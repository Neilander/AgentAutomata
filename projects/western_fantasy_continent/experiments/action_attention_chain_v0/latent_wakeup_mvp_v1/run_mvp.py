from __future__ import annotations

import json
import sys
from collections import deque
from copy import deepcopy
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parents[1]
sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402


def normalize(value: np.ndarray) -> np.ndarray:
    return value / max(float(np.linalg.norm(value)), 1e-12)


def cosine(left: np.ndarray, right: np.ndarray) -> float:
    return float(np.dot(normalize(left), normalize(right)))


def make_world(features: dict[str, str], ship_description: str = "外星飞船") -> dict:
    units = {}
    connections = []
    for row in range(4):
        for column in range(2):
            unit_id = f"sky-c{column}-r{row}"
            units[unit_id] = {"id": unit_id, "feature": features.get(unit_id)}
            if row < 3:
                connections.append({"from": unit_id, "to": f"sky-c{column}-r{row + 1}", "kind": "sky_down", "direction": "down"})
            if column == 0:
                connections.append({"from": unit_id, "to": f"sky-c1-r{row}", "kind": "sky_horizontal", "direction": "right"})
    units["mothership-r0"] = {"id": "mothership-r0", "feature": None}
    units["mothership-r1"] = {"id": "mothership-r1", "feature": features.get("mothership-r1")}
    units["mothership-waiting"] = {"id": "mothership-waiting", "feature": None}
    connections.append({"from": "mothership-r0", "to": "mothership-r1", "kind": "mothership_down", "direction": "down"})
    return {
        "stage": "dice",
        "units": units,
        "connections": connections,
        "entities": {
            "ship": {"id": "ship", "type": "ship", "description": ship_description, "unitId": "sky-c0-r0"},
            "mothership": {"id": "mothership", "type": "mothership", "description": "敌方母舰", "unitId": "mothership-r0"},
            "city": {"id": "city", "type": "city", "description": "玩家城市", "unitId": "sky-c1-r3", "hp": 3},
        },
        "outcome": None,
    }


SCENARIOS = [
    {
        "id": "arrow_then_city_recursive",
        "world": make_world({
            "sky-c0-r1": "一个画着向右尖头、会引导飞船横移的天空格",
            "sky-c1-r1": "天空区域下方与玩家城市相撞的位置",
        }),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "placed_die"},
        "expectedPresets": ["ship_lands_right_arrow", "ship_hits_city"],
        "expectedActions": ["move", "move", "damage", "relocate"],
    },
    {
        "id": "paraphrased_arrow_random_upstream",
        "world": make_world({"sky-c0-r1": "提示外星载具朝右侧换列的导航标记"}, "白色外星载具"),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "random_extra"},
        "expectedPresets": ["ship_lands_right_arrow"],
        "expectedActions": ["move", "move"],
    },
    {
        "id": "mothership_signal_then_skull_recursive",
        "world": make_world({
            "sky-c0-r1": "印着母舰向下图案的信号区域",
            "mothership-r1": "带有骷髅图案、母舰到达便会失败的轨道行",
        }),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "placed_die"},
        "expectedPresets": ["ship_lands_mothership_down", "mothership_reaches_skull"],
        "expectedActions": ["move", "move", "outcome"],
    },
    {
        "id": "direct_city_hit",
        "world": make_world({"sky-c0-r1": "飞船下降到底部后会撞上的城市建筑群"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "placed_die"},
        "expectedPresets": ["ship_hits_city"],
        "expectedActions": ["move", "damage", "relocate"],
    },
    {
        "id": "explosion_known_no_immediate_effect",
        "world": make_world({"sky-c0-r1": "一块画着明亮爆炸符号的天空地块"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "placed_die"},
        "expectedPresets": ["ship_lands_explosion_no_immediate_effect"],
        "expectedActions": ["move"],
    },
    {
        "id": "arrow_seen_on_path_but_not_endpoint",
        "world": make_world({"sky-c0-r1": "指示飞船向右横移的箭头格"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 2, "cause": "placed_die"},
        "expectedPresets": [],
        "expectedActions": ["move"],
    },
    {
        "id": "unknown_endpoint_stays_question",
        "world": make_world({"sky-c0-r1": "从未见过的紫色旋涡符文格"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "placed_die"},
        "expectedPresets": [],
        "expectedActions": ["move"],
    },
    {
        "id": "looking_at_arrow_does_not_activate_it",
        "world": make_world({"sky-c0-r1": "一个画着向右尖头的天空格"}),
        "initial": {"operator": "inspect", "actorRef": "ship", "targetUnitId": "sky-c0-r1"},
        "expectedPresets": [],
        "expectedActions": ["inspect"],
    },
]


class SemanticWakeRuntime:
    def __init__(self, model: dict, vectors: dict[str, np.ndarray]):
        self.model = model
        self.vectors = vectors
        self.presets = model["memoryPresets"]
        self.compiled = {}
        settings = model["retrieval"]
        combined_rows = []
        object_only_rows = []
        example_to_preset = []
        dimensions = next(iter(vectors.values())).shape[0]
        for preset_index, preset in enumerate(self.presets):
            object_vectors = np.stack([normalize(vectors[text]) for text in preset["targetExamples"]])
            arrows = np.stack([
                normalize(vectors[after] - vectors[before])
                for before, after in preset["triggerExamples"]
            ])
            trend_prototype = normalize(arrows.mean(axis=0))
            self.compiled[preset["id"]] = {
                "objectVectors": object_vectors,
                "trendPrototype": trend_prototype,
            }
            for object_vector in object_vectors:
                # One expanded row represents one object phrasing plus the
                # memory's shared transition prototype. Max-reduction later
                # lets multiple phrasings belong to the same memory.
                combined_rows.append(np.concatenate([
                    settings["objectWeight"] * object_vector,
                    settings["trendWeight"] * trend_prototype,
                ]))
                # The second block returns the unweighted object score in the
                # same matrix multiplication, so unknown-object rejection does
                # not require another per-memory scan.
                object_only_rows.append(np.concatenate([
                    object_vector,
                    np.zeros(dimensions, dtype=np.float64),
                ]))
                example_to_preset.append(preset_index)
        self.example_to_preset = np.asarray(example_to_preset, dtype=np.int64)
        self.example_count = len(example_to_preset)
        self.activation_matrix = np.stack(combined_rows + object_only_rows)
        requirement_fields = sorted({key for preset in self.presets for key in preset["requires"]})
        self.requirement_columns = {
            field: np.asarray([preset["requires"].get(field, "*") for preset in self.presets], dtype=object)
            for field in requirement_fields
        }

    def _fact_mask(self, facts: dict) -> np.ndarray:
        mask = np.ones(len(self.presets), dtype=bool)
        # This loops over the tiny fact schema, never over memories.
        for field, requirements in self.requirement_columns.items():
            actual = facts.get(field)
            mask &= (requirements == "*") | (requirements == actual)
        return mask

    def retrieve(self, event: dict) -> dict:
        settings = self.model["retrieval"]
        object_vector = normalize(self.vectors[event["feature"]])
        trend_vector = normalize(self.vectors[event["after"]] - self.vectors[event["before"]])
        query = np.concatenate([object_vector, trend_vector])
        all_outputs = self.activation_matrix @ query
        example_activations = all_outputs[: self.example_count]
        example_object_scores = all_outputs[self.example_count :]
        activations = np.full(len(self.presets), -np.inf, dtype=np.float64)
        object_scores = np.full(len(self.presets), -np.inf, dtype=np.float64)
        np.maximum.at(activations, self.example_to_preset, example_activations)
        np.maximum.at(object_scores, self.example_to_preset, example_object_scores)
        trend_scores = (
            activations - settings["objectWeight"] * object_scores
        ) / settings["trendWeight"]
        ranking = np.argsort(activations)[::-1]
        top_indices = ranking[: settings["topK"]]
        margin = float(activations[ranking[0]] - activations[ranking[1]])
        semantic_mask = (
            (object_scores >= settings["minimumObjectScore"])
            & (activations >= settings["minimumScore"])
        )
        top_k_mask = np.zeros(len(self.presets), dtype=bool)
        top_k_mask[top_indices] = True
        fact_mask = self._fact_mask(event["facts"])
        semantic_candidates = [
            self.presets[index] for index in ranking
            if semantic_mask[index] and top_k_mask[index]
        ]
        verified_candidates = [
            self.presets[index] for index in ranking
            if semantic_mask[index] and top_k_mask[index] and fact_mask[index]
        ]
        # Margin is diagnostic rather than a global rejection gate. Closely
        # related memories are allowed into Top-K and exact facts disambiguate
        # them, matching the intended "associate, then verify" architecture.
        return {
            "topK": [
                {
                    "id": self.presets[index]["id"],
                    "score": float(activations[index]),
                    "objectScore": float(object_scores[index]),
                    "trendScore": float(trend_scores[index]),
                }
                for index in top_indices
            ],
            "margin": margin,
            "semanticCandidates": semantic_candidates,
            "verifiedCandidates": verified_candidates,
            "activationVector": activations.tolist(),
            "semanticMask": semantic_mask.tolist(),
            "factMask": fact_mask.tolist(),
            "effectiveMask": (semantic_mask & top_k_mask & fact_mask).tolist(),
        }

    def reference_scores(self, event: dict) -> np.ndarray:
        """Scalar reference used only by tests to prove matrix equivalence."""
        settings = self.model["retrieval"]
        object_vector = normalize(self.vectors[event["feature"]])
        trend_vector = normalize(self.vectors[event["after"]] - self.vectors[event["before"]])
        values = []
        for preset in self.presets:
            compiled = self.compiled[preset["id"]]
            object_score = max(cosine(object_vector, row) for row in compiled["objectVectors"])
            trend_score = cosine(trend_vector, compiled["trendPrototype"])
            values.append(settings["objectWeight"] * object_score + settings["trendWeight"] * trend_score)
        return np.asarray(values)

    @staticmethod
    def verify(preset: dict, facts: dict) -> bool:
        return all(facts.get(key) == value for key, value in preset["requires"].items())

    def run(self, scenario: dict) -> dict:
        world = deepcopy(scenario["world"])
        queue = deque([deepcopy(scenario["initial"])])
        action_trace = []
        wake_trace = []
        noticed = []
        while queue:
            action = queue.popleft()
            action_trace.append(action["operator"])
            if len(action_trace) > 30:
                raise RuntimeError("action budget exhausted")
            events = self.execute(world, action, noticed)
            for event in events:
                retrieval = self.retrieve(event)
                semantic_candidates = retrieval["semanticCandidates"]
                verified_candidates = retrieval["verifiedCandidates"]
                candidate = semantic_candidates[0] if semantic_candidates else None
                verified_candidate = verified_candidates[0] if verified_candidates else None
                verified = verified_candidate is not None
                wake_trace.append({
                    "feature": event["feature"],
                    "relation": event["facts"]["relation"],
                    "topK": retrieval["topK"],
                    "margin": retrieval["margin"],
                    "activationVector": retrieval["activationVector"],
                    "factMask": retrieval["factMask"],
                    "effectiveMask": retrieval["effectiveMask"],
                    "rawCandidate": candidate["id"] if candidate else None,
                    "verifiedPreset": verified_candidate["id"] if verified else None,
                    "knownNoImmediateEffect": bool(verified and verified_candidate.get("knownNoImmediateEffect")),
                })
                if verified:
                    for emitted in verified_candidate["emit"]:
                        queue.append(self.resolve_action(emitted, event["actorId"]))
        return {
            "id": scenario["id"],
            "actionTrace": action_trace,
            "awakenedPresets": [row["verifiedPreset"] for row in wake_trace if row["verifiedPreset"]],
            "wakeTrace": wake_trace,
            "noticed": noticed,
            "world": world,
        }

    def execute(self, world: dict, action: dict, noticed: list) -> list[dict]:
        operator = action["operator"]
        actor_id = action.get("actorRef")
        actor = world["entities"].get(actor_id) if actor_id else None
        if operator == "move":
            path = []
            current = actor["unitId"]
            for _ in range(action["distance"]):
                edge = next((edge for edge in world["connections"] if edge["from"] == current and edge["kind"] == action["connectionKind"] and edge["direction"] == action["direction"]), None)
                if edge is None:
                    break
                current = edge["to"]
                path.append(current)
            origin = actor["unitId"]
            actor["unitId"] = current
            for unit_id in path:
                feature = world["units"][unit_id].get("feature")
                if feature:
                    noticed.append({"action": "move", "feature": feature, "role": "endpoint" if unit_id == current else "path", "salience": 1.0 if unit_id == current else 0.45})
            feature = world["units"][current].get("feature")
            if not feature:
                return []
            before = f"{feature}尚未被{actor['description']}占据或接触"
            after = f"{actor['description']}完成移动并最终停在{feature}，与它发生接触"
            return [{
                "feature": feature,
                "before": before,
                "after": after,
                "actorId": actor_id,
                "facts": {"actorType": actor["type"], "relation": "endpoint_overlap", "stage": world["stage"]},
                "origin": origin,
                "endpoint": current,
            }]
        if operator == "inspect":
            feature = world["units"][action["targetUnitId"]].get("feature")
            if not feature:
                return []
            noticed.append({"action": "inspect", "feature": feature, "role": "focus", "salience": 1.0})
            return [{
                "feature": feature,
                "before": f"{feature}尚未被{actor['description']}查看",
                "after": f"{actor['description']}开始仔细观察{feature}",
                "actorId": actor_id,
                "facts": {"actorType": actor["type"], "relation": "observed", "stage": world["stage"]},
            }]
        if operator == "damage":
            actor["hp"] = max(0, actor["hp"] - action["amount"])
            return []
        if operator == "relocate":
            actor["unitId"] = action["targetUnitId"]
            return []
        if operator == "outcome":
            world["outcome"] = {"value": action["outcome"], "reason": action["reason"]}
            return []
        raise ValueError(f"unsupported operator: {operator}")

    @staticmethod
    def resolve_action(template: dict, current_actor_id: str) -> dict:
        action = deepcopy(template)
        if action.get("actorRef") == "$actor":
            action["actorRef"] = current_actor_id
        return action


def collect_texts(model: dict, scenarios: list[dict] | None = None) -> list[str]:
    texts = set()
    for preset in model["memoryPresets"]:
        texts.update(preset["targetExamples"])
        for before, after in preset["triggerExamples"]:
            texts.update((before, after))
    for scenario in scenarios or SCENARIOS:
        world = scenario["world"]
        action = scenario["initial"]
        actor = world["entities"][action["actorRef"]]
        if action["operator"] == "move":
            for unit in world["units"].values():
                feature = unit.get("feature")
                if feature:
                    texts.add(feature)
                    texts.add(f"{feature}尚未被{actor['description']}占据或接触")
                    texts.add(f"{actor['description']}完成移动并最终停在{feature}，与它发生接触")
            # Recursive actions use the mothership description as well.
            mothership = world["entities"]["mothership"]
            for unit in world["units"].values():
                feature = unit.get("feature")
                if feature:
                    texts.add(f"{feature}尚未被{mothership['description']}占据或接触")
                    texts.add(f"{mothership['description']}完成移动并最终停在{feature}，与它发生接触")
        elif action["operator"] == "inspect":
            feature = world["units"][action["targetUnitId"]]["feature"]
            texts.update((feature, f"{feature}尚未被{actor['description']}查看", f"{actor['description']}开始仔细观察{feature}"))
    return sorted(texts)


def main() -> None:
    model = json.loads((HERE / "ai_initial_model.json").read_text(encoding="utf-8"))
    texts = collect_texts(model)
    matrix = GTERuntime().encode(texts, batch_size=16)
    vectors = {text: matrix[index] for index, text in enumerate(texts)}
    runtime = SemanticWakeRuntime(model, vectors)
    results = [runtime.run(scenario) for scenario in SCENARIOS]
    for scenario, result in zip(SCENARIOS, results):
        result["expectedPresets"] = scenario["expectedPresets"]
        result["expectedActions"] = scenario["expectedActions"]
        result["presetPass"] = result["awakenedPresets"] == scenario["expectedPresets"]
        result["actionPass"] = result["actionTrace"] == scenario["expectedActions"]
    payload = {
        "schema": "semantic_action_glue_mvp_v1",
        "modelFrozenBeforeCases": model["frozenForEvaluation"],
        "scenarioCount": len(results),
        "passCount": sum(row["presetPass"] and row["actionPass"] for row in results),
        "results": results,
    }
    output_dir = HERE / "artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "latest_results.json"
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "scenarioCount": payload["scenarioCount"],
        "passCount": payload["passCount"],
        "cases": [{"id": row["id"], "presets": row["awakenedPresets"], "actions": row["actionTrace"], "pass": row["presetPass"] and row["actionPass"]} for row in results],
    }, ensure_ascii=False, indent=2))
    print(f"RESULT_PATH={output_path}")
    if payload["passCount"] != payload["scenarioCount"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
