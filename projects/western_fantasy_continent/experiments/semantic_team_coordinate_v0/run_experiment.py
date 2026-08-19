from __future__ import annotations

import json
import math
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
EXPERIMENTS = ROOT.parent
TEAM_ARTIFACT = EXPERIMENTS / "team_vector_guess_v1" / "artifacts" / "team-vector-knowledge.json"
OUT_DIR = ROOT / "artifacts"
OUT_FILE = OUT_DIR / "semantic-coordinate-results.json"

sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))
from gte_runtime import GTERuntime  # noqa: E402


QUERIES = [
    {"id": "survive", "text": "要让队伍活下去", "validation": "survival"},
    {"id": "heal_protect", "text": "需要持续治疗和保护队友", "validation": "protection"},
    {"id": "damage", "text": "需要造成更多伤害", "validation": "damage"},
    {"id": "fast", "text": "需要在敌人启动前迅速建立优势", "validation": "tempo"},
    {"id": "area", "text": "需要同时攻击多个敌人", "validation": "area_damage"},
    {"id": "control", "text": "需要限制敌人行动", "validation": "control"},
    {"id": "sustain_damage", "text": "需要用持续效果慢慢消耗敌人", "validation": "sustained_damage"},
]

CAPABILITY_PROBES = [
    ("healing", "这支队伍能够持续恢复受伤队友的生命"),
    ("shield", "这支队伍能够用护盾保护队友"),
    ("damage_reduction", "这支队伍能够降低队友受到的伤害"),
    ("control", "这支队伍能够限制敌人行动，为队友争取时间"),
    ("fast_kill", "这支队伍能够快速击杀敌人，提前解除威胁"),
    ("damage", "这支队伍能够造成很高的伤害"),
    ("area_damage", "这支队伍擅长同时攻击多个敌人"),
    ("loot", "这支队伍能够获得更多战利品"),
]

PREDICATE_PROBES = [
    ("healing", "持续恢复受伤队友的生命"),
    ("shield", "用护盾保护队友"),
    ("damage_reduction", "降低队友受到的伤害"),
    ("control", "限制敌人行动，为队友争取时间"),
    ("fast_kill", "快速击杀敌人，提前解除威胁"),
    ("damage", "造成很高的伤害"),
    ("area_damage", "同时攻击多个敌人"),
    ("loot", "获得更多战利品"),
]

SYNTHETIC_TEAMS = {
    "healer": [
        "这支队伍能够持续治疗受伤的队友",
        "这支队伍能让濒死队友恢复生命",
        "这支队伍在长时间战斗中保持队友血量",
    ],
    "shield": [
        "这支队伍能够在敌人攻击前提供护盾",
        "这支队伍能够减少队友受到的伤害",
        "这支队伍能保护脆弱的后排成员",
    ],
    "glass_cannon": [
        "这支队伍能够在短时间内造成很高伤害",
        "这支队伍能够迅速击杀一个敌人",
        "这支队伍自身很脆弱，容易在攻击后倒下",
    ],
    "controller": [
        "这支队伍能够眩晕和减速敌人",
        "这支队伍能够阻止敌人连续行动",
        "这支队伍可以为队友争取更多行动时间",
    ],
    "balanced_survival": [
        "这支队伍能够治疗受伤的队友",
        "这支队伍能够限制敌人的行动",
        "这支队伍可以较快击杀带来威胁的敌人",
    ],
    "loot_specialist": [
        "这支队伍能够发现隐藏的宝箱",
        "这支队伍能够获得更多战利品",
        "这支队伍能够降低商店里的购买价格",
    ],
}


def normalize(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    if norm <= 1e-12:
        return np.zeros_like(vector)
    return vector / norm


def canonicalize(statement: str) -> str:
    text = statement.strip()
    text = text.replace("我方角色", "这支队伍").replace("我方", "这支队伍")
    text = text.replace("本场战斗", "一次战斗").replace("本场", "一次战斗中")
    text = re.sub(r"([\u4e00-\u9fff]+)\d(?=(?:、|在|一次|本))", r"队伍中的\1", text)
    text = re.sub(r"\s+", "", text)
    return text


def is_friendly_knowledge(statement: str) -> bool:
    if statement.startswith("本场战斗") or statement.startswith("我方"):
        return True
    if statement.startswith("敌方"):
        return False
    if "敌方单位" in statement or "敌方角色" in statement:
        return False
    if "对我方" in statement:
        return False
    return True


def saturation(count: int, tau: float = 2.0) -> float:
    return 1.0 - math.exp(-max(0, count) / tau)


def spearman(left: np.ndarray, right: np.ndarray) -> float:
    def ranks(values: np.ndarray) -> np.ndarray:
        order = np.argsort(values, kind="mergesort")
        result = np.empty(len(values), dtype=np.float64)
        start = 0
        while start < len(values):
            end = start + 1
            while end < len(values) and values[order[end]] == values[order[start]]:
                end += 1
            result[order[start:end]] = (start + end - 1) / 2.0
            start = end
        return result

    left_rank = ranks(left)
    right_rank = ranks(right)
    if np.std(left_rank) <= 1e-12 or np.std(right_rank) <= 1e-12:
        return 0.0
    return float(np.corrcoef(left_rank, right_rank)[0, 1])


def collect_real_knowledge(payload: dict) -> dict[str, Counter[str]]:
    result: dict[str, Counter[str]] = defaultdict(Counter)
    for cell in payload["knowledge"]["cells"]:
        team_id = cell["subject"]["id"]
        for statement in cell.get("receivedKnowledge", {}).get("statements", []):
            if is_friendly_knowledge(statement):
                result[team_id][canonicalize(statement)] += 1
    return result


def semantic_claim(statement: str) -> tuple[str, int]:
    """Convert an observed sentence to a proposition plus support/refutation.

    This is deliberately not an ability-axis mapping. The proposition stays as
    natural language; the sign only prevents embedding negation from being
    mistaken for positive topical similarity.
    """
    text = canonicalize(statement)
    if "战斗失败" in text or "无人存活" in text:
        return "在战斗中存活并取得胜利", -1
    if "战斗胜利" in text and "存活" in text:
        return "在战斗中存活并取得胜利", 1
    if "倒下" in text:
        return "队伍成员在战斗中存活", -1
    if "治疗" in text:
        return "持续治疗受伤的队友", 1
    if "护盾" in text:
        return "用护盾保护队友", 1
    if "击倒了" in text:
        return "击倒敌人", 1
    text = re.sub(r"^这支队伍", "", text)
    text = text.replace("一次战斗中", "").replace("一次战斗", "")
    return text.strip("，。 ") or canonicalize(statement), 1


def collect_signed_real_knowledge(payload: dict) -> dict[str, dict[str, list[int]]]:
    result: dict[str, dict[str, list[int]]] = defaultdict(lambda: defaultdict(lambda: [0, 0]))
    for cell in payload["knowledge"]["cells"]:
        team_id = cell["subject"]["id"]
        for statement in cell.get("receivedKnowledge", {}).get("statements", []):
            if not is_friendly_knowledge(statement):
                continue
            claim, stance = semantic_claim(statement)
            result[team_id][claim][0 if stance > 0 else 1] += 1
    return result


def build_coordinate(
    counts: Counter[str],
    vector_by_text: dict[str, np.ndarray],
    corpus_center: np.ndarray | None,
) -> tuple[np.ndarray, float]:
    if not counts:
        dimension = next(iter(vector_by_text.values())).shape[0]
        return np.zeros(dimension, dtype=np.float64), 0.0
    coordinate = np.zeros(next(iter(vector_by_text.values())).shape[0], dtype=np.float64)
    evidence_mass = 0.0
    for text, count in counts.items():
        weight = saturation(count)
        update = vector_by_text[text]
        if corpus_center is not None:
            update = update - corpus_center
        coordinate += weight * update
        evidence_mass += weight
    return normalize(coordinate), evidence_mass


def build_signed_coordinate(
    claims: dict[str, list[int]], vector_by_text: dict[str, np.ndarray]
) -> tuple[np.ndarray, float]:
    dimension = next(iter(vector_by_text.values())).shape[0]
    coordinate = np.zeros(dimension, dtype=np.float64)
    evidence_mass = 0.0
    for claim, (support, refute) in claims.items():
        total = support + refute
        if total <= 0:
            continue
        belief = (support - refute) / total
        weight = saturation(total) * belief
        coordinate += weight * vector_by_text[claim]
        evidence_mass += abs(weight)
    return normalize(coordinate), evidence_mass


def without_outcome_claims(claims: dict[str, list[int]]) -> dict[str, list[int]]:
    return {
        claim: counts
        for claim, counts in claims.items()
        if "存活" not in claim and "胜利" not in claim and "倒下" not in claim
    }


def build_validation_targets(payload: dict) -> tuple[list[str], dict[str, np.ndarray]]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for cell in payload["heldOutValidation"]["cells"]:
        grouped[cell["subject"]["id"]].append(cell)
    team_ids = [row["id"] for row in payload["teams"]]
    targets: dict[str, list[float]] = defaultdict(list)
    for team_id in team_ids:
        cells = grouped[team_id]
        targets["survival"].append(float(np.mean([cell["result"]["ownAlive"] / 4.0 for cell in cells])))
        for axis in ["protection", "damage", "tempo", "area_damage", "control", "sustained_damage"]:
            targets[axis].append(float(np.mean([cell["signalSummary"]["rawAxes"][axis] for cell in cells])))
    return team_ids, {key: np.array(values, dtype=np.float64) for key, values in targets.items()}


def query_score_report(
    team_ids: list[str],
    coordinates: np.ndarray,
    query_vectors: np.ndarray,
    targets: dict[str, np.ndarray],
    teams_by_id: dict[str, dict],
) -> list[dict]:
    rows = []
    for query, query_vector in zip(QUERIES, query_vectors):
        scores = coordinates @ query_vector
        target = targets[query["validation"]]
        order = np.argsort(-scores)
        top = order[:10]
        bottom = order[-10:]
        rows.append({
            "queryId": query["id"],
            "query": query["text"],
            "validationTarget": query["validation"],
            "spearman": round(spearman(scores, target), 4),
            "top10HeldOutMean": round(float(np.mean(target[top])), 4),
            "bottom10HeldOutMean": round(float(np.mean(target[bottom])), 4),
            "top10BeatsBottom10": bool(np.mean(target[top]) > np.mean(target[bottom])),
            "topTeams": [
                {
                    "teamId": team_ids[index],
                    "label": teams_by_id[team_ids[index]]["label"],
                    "semanticScore": round(float(scores[index]), 4),
                    "heldOutTarget": round(float(target[index]), 4),
                }
                for index in order[:5]
            ],
        })
    return rows


def run() -> dict:
    payload = json.loads(TEAM_ARTIFACT.read_text(encoding="utf-8"))
    runtime = GTERuntime()
    real_knowledge = collect_real_knowledge(payload)
    signed_real_knowledge = collect_signed_real_knowledge(payload)
    real_texts = sorted({text for counts in real_knowledge.values() for text in counts})
    claim_texts = sorted({claim for claims in signed_real_knowledge.values() for claim in claims})
    synthetic_texts = sorted({text for texts in SYNTHETIC_TEAMS.values() for text in texts})
    query_texts = [row["text"] for row in QUERIES]
    probe_texts = [text for _, text in CAPABILITY_PROBES]
    predicate_probe_texts = [text for _, text in PREDICATE_PROBES]
    all_texts = list(dict.fromkeys(
        real_texts + claim_texts + synthetic_texts + query_texts + probe_texts + predicate_probe_texts
    ))
    encoded = runtime.encode(all_texts, batch_size=24)
    vectors = {text: encoded[index] for index, text in enumerate(all_texts)}

    real_matrix = np.array([vectors[text] for text in real_texts])
    corpus_center = normalize(np.mean(real_matrix, axis=0))
    query_raw = np.array([vectors[text] for text in query_texts])
    query_centered = np.array([normalize(vectors[text] - corpus_center) for text in query_texts])

    team_ids, targets = build_validation_targets(payload)
    teams_by_id = {row["id"]: row for row in payload["teams"]}
    raw_coordinates = []
    centered_coordinates = []
    signed_coordinates = []
    capability_only_coordinates = []
    masses = {}
    for team_id in team_ids:
        raw, mass = build_coordinate(real_knowledge[team_id], vectors, None)
        centered, _ = build_coordinate(real_knowledge[team_id], vectors, corpus_center)
        signed, _ = build_signed_coordinate(signed_real_knowledge[team_id], vectors)
        capability_only, _ = build_signed_coordinate(
            without_outcome_claims(signed_real_knowledge[team_id]), vectors
        )
        raw_coordinates.append(raw)
        centered_coordinates.append(centered)
        signed_coordinates.append(signed)
        capability_only_coordinates.append(capability_only)
        masses[team_id] = round(mass, 4)
    raw_coordinates_array = np.array(raw_coordinates)
    centered_coordinates_array = np.array(centered_coordinates)
    signed_coordinates_array = np.array(signed_coordinates)
    capability_only_coordinates_array = np.array(capability_only_coordinates)

    probe_matrix = np.array([vectors[text] for text in probe_texts])
    survival_vector = vectors["要让队伍活下去"]
    probe_scores = probe_matrix @ survival_vector
    probe_order = np.argsort(-probe_scores)
    predicate_probe_matrix = np.array([vectors[text] for text in predicate_probe_texts])
    predicate_probe_scores = predicate_probe_matrix @ survival_vector
    predicate_probe_order = np.argsort(-predicate_probe_scores)

    synthetic_coordinates = {}
    for team_id, statements in SYNTHETIC_TEAMS.items():
        counts = Counter(statements)
        coordinate, mass = build_coordinate(counts, vectors, None)
        synthetic_coordinates[team_id] = {"coordinate": coordinate, "mass": mass}
    synthetic_matrix = np.array([synthetic_coordinates[key]["coordinate"] for key in SYNTHETIC_TEAMS])
    synthetic_query_scores = synthetic_matrix @ query_raw.T

    contradiction_claim = "持续治疗受伤的队友"
    positive_coordinate, _ = build_signed_coordinate({contradiction_claim: [1, 0]}, vectors)
    contradicted_coordinate, _ = build_signed_coordinate({contradiction_claim: [1, 1]}, vectors)
    reversed_coordinate, _ = build_signed_coordinate({contradiction_claim: [1, 3]}, vectors)
    positive_score = float(positive_coordinate @ survival_vector)
    mixed_score = float(contradicted_coordinate @ survival_vector)
    reversed_score = float(reversed_coordinate @ survival_vector)

    repetition_counts = [1, 2, 5, 20]
    repetition_weights = [saturation(count) for count in repetition_counts]

    result = {
        "schema": "semantic_team_coordinate_v0",
        "boundary": {
            "formalPlayerAgentModified": False,
            "knowledgeSource": "renderer-selected player-visible statements from the 50-team experiment",
            "candidateRepresentation": "zero-origin saturated sum of atomic knowledge embeddings",
            "queryRepresentation": "the natural-language need embedding itself",
            "validationOnlyUsesHeldOutCombatMetrics": True,
            "manualNeedWeights": False,
            "manualNineAxisCandidateVector": False,
        },
        "model": {"name": "Alibaba-NLP/gte-multilingual-base", "dimensions": int(encoded.shape[1])},
        "knowledge": {
            "teamCount": len(team_ids),
            "uniqueFriendlyStatementCount": len(real_texts),
            "meanUniqueStatementsPerTeam": round(float(np.mean([len(real_knowledge[t]) for t in team_ids])), 3),
            "meanEvidenceMass": round(float(np.mean(list(masses.values()))), 3),
        },
        "directActivationProbe": [
            {
                "rank": rank + 1,
                "capability": CAPABILITY_PROBES[index][0],
                "text": CAPABILITY_PROBES[index][1],
                "similarity": round(float(probe_scores[index]), 4),
            }
            for rank, index in enumerate(probe_order)
        ],
        "predicateActivationProbe": [
            {
                "rank": rank + 1,
                "capability": PREDICATE_PROBES[index][0],
                "text": PREDICATE_PROBES[index][1],
                "similarity": round(float(predicate_probe_scores[index]), 4),
            }
            for rank, index in enumerate(predicate_probe_order)
        ],
        "syntheticTeams": {
            "teamOrder": list(SYNTHETIC_TEAMS),
            "queries": query_texts,
            "scores": np.round(synthetic_query_scores, 4).tolist(),
        },
        "realTeams": {
            "rawSum": query_score_report(team_ids, raw_coordinates_array, query_raw, targets, teams_by_id),
            "corpusCenteredSum": query_score_report(
                team_ids, centered_coordinates_array, query_centered, targets, teams_by_id
            ),
            "signedSemanticState": query_score_report(
                team_ids, signed_coordinates_array, query_raw, targets, teams_by_id
            ),
            "capabilityOnlyAblation": query_score_report(
                team_ids, capability_only_coordinates_array, query_raw, targets, teams_by_id
            ),
        },
        "coordinateSnapshots": {
            "purpose": "frozen capability-only coordinates for downstream isolated experiments",
            "outcomeClaimsExcluded": True,
            "teamOrder": team_ids,
            "capabilityOnly": np.round(capability_only_coordinates_array, 8).tolist(),
        },
        "edgeCases": {
            "repetitionSaturation": [
                {"count": count, "weight": round(weight, 4)}
                for count, weight in zip(repetition_counts, repetition_weights)
            ],
            "contradiction": {
                "positiveOnlySurvivalSimilarity": round(positive_score, 4),
                "positivePlusNegativeSurvivalSimilarity": round(mixed_score, 4),
                "oneSupportThreeRefutationsSurvivalSimilarity": round(reversed_score, 4),
                "negativeKnowledgeReducedScore": mixed_score < positive_score,
                "refutationsCanReverseCoordinate": reversed_score < 0,
                "note": "The semantic proposition stays continuous, while support/refutation is structural evidence metadata.",
            },
        },
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return result


if __name__ == "__main__":
    report = run()
    print(json.dumps({
        "output": str(OUT_FILE),
        "directActivationProbe": report["directActivationProbe"],
        "predicateActivationProbe": report["predicateActivationProbe"],
        "rawSum": [
            {"query": row["queryId"], "spearman": row["spearman"], "top10BeatsBottom10": row["top10BeatsBottom10"]}
            for row in report["realTeams"]["rawSum"]
        ],
        "centeredSum": [
            {"query": row["queryId"], "spearman": row["spearman"], "top10BeatsBottom10": row["top10BeatsBottom10"]}
            for row in report["realTeams"]["corpusCenteredSum"]
        ],
        "signedSemanticState": [
            {"query": row["queryId"], "spearman": row["spearman"], "top10BeatsBottom10": row["top10BeatsBottom10"]}
            for row in report["realTeams"]["signedSemanticState"]
        ],
        "capabilityOnlyAblation": [
            {"query": row["queryId"], "spearman": row["spearman"], "top10BeatsBottom10": row["top10BeatsBottom10"]}
            for row in report["realTeams"]["capabilityOnlyAblation"]
        ],
        "contradiction": report["edgeCases"]["contradiction"],
    }, ensure_ascii=False, indent=2))
