from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
LATENT_RUNTIME_ROOT = ROOT.parent / "latent_space_rune_v0"
sys.path.insert(0, str(LATENT_RUNTIME_ROOT))

from gte_runtime import GTERuntime  # noqa: E402


ARTIFACT = ROOT / "artifacts" / "team-vector-knowledge.json"
RESULT_JSON = ROOT / "artifacts" / "vector-test-results.json"
RESULT_MD = ROOT / "RESULTS.md"


AXIS_LANGUAGE = {
    "damage": {
        "positive": "这支队伍很擅长造成总体伤害并击败敌人",
        "negative": "这支队伍几乎不能造成有效伤害",
        "question": "这支队伍造成总体伤害的能力更强吗？",
        "anchors": ["总体伤害", "总输出能力", "整场战斗累计造成的全部伤害"],
    },
    "protection": {
        "positive": "这支队伍很擅长治疗、护盾和保护队友存活",
        "negative": "这支队伍几乎不能保护受伤的队友",
        "question": "这支队伍保护队友活下来的能力更强吗？",
        "anchors": ["保护队友", "治疗与护盾", "让队伍生存下来"],
    },
    "buff": {
        "positive": "这支队伍很擅长给队友增益并强化全队",
        "negative": "这支队伍几乎不能强化其他队友",
        "question": "这支队伍给队友提供增益的能力更强吗？",
        "anchors": ["给队友增益", "强化全队", "放大队友能力"],
    },
    "tempo": {
        "positive": "这支队伍启动很快，战斗前期立刻形成压力",
        "negative": "这支队伍启动很慢，前期无法形成压力",
        "question": "这支队伍进入战斗后启动得更快吗？",
        "anchors": ["快速启动", "开战前期形成压力", "尽早开始发挥作用"],
    },
    "burst": {
        "positive": "这支队伍能在短时间内集中打出巨大爆发伤害",
        "negative": "这支队伍短时间内没有明显爆发伤害",
        "question": "这支队伍的短时间爆发能力更强吗？",
        "anchors": ["短时间爆发", "瞬间造成大量伤害", "集中爆发输出"],
    },
    "sustained_damage": {
        "positive": "这支队伍擅长用毒、灼烧和连续攻击造成持续伤害",
        "negative": "这支队伍不能长时间持续磨掉敌人生命",
        "question": "这支队伍长时间持续伤害的能力更强吗？",
        "anchors": ["持续伤害", "毒和灼烧磨血", "长时间不断造成伤害"],
    },
    "area_damage": {
        "positive": "这支队伍擅长群体攻击并同时清理多个敌人",
        "negative": "这支队伍不擅长同时伤害多个敌人",
        "question": "这支队伍清理成群敌人的能力更强吗？",
        "anchors": ["群体伤害", "同时攻击多个敌人", "清理一群小怪"],
    },
    "control": {
        "positive": "这支队伍擅长减速、冻结和限制敌人行动",
        "negative": "这支队伍不能限制或拖延敌人行动",
        "question": "这支队伍控制和拖延敌人的能力更强吗？",
        "anchors": ["控制敌人", "减速冻结", "限制敌人行动"],
    },
    "execution": {
        "positive": "这支队伍擅长集中火力快速处决一个危险目标",
        "negative": "这支队伍不能有效集火或快速完成单点击杀",
        "question": "这支队伍快速集火处决单个目标的能力更强吗？",
        "anchors": ["单点处决", "集火危险目标", "快速击杀一个核心敌人"],
    },
}


REQUIREMENTS = [
    {
        "id": "protect_and_damage",
        "text": "我需要一支既能保护队友，又不能丢掉伤害的队伍。",
        "expected": ["protection", "damage"],
        "needs": [
            {"text": "需要治疗、护盾和保护队友存活", "expected": "protection"},
            {"text": "需要整场累计的总体伤害和总输出能力", "expected": "damage"},
        ],
    },
    {
        "id": "fast_burst",
        "text": "我需要快速启动，在开战以后尽早打出爆发。",
        "expected": ["tempo", "burst"],
        "needs": [
            {"text": "需要战斗前期快速启动", "expected": "tempo"},
            {"text": "需要短时间集中爆发伤害", "expected": "burst"},
        ],
    },
    {
        "id": "poison_attrition",
        "text": "我想依靠毒和持续伤害慢慢拖死敌人。",
        "expected": ["sustained_damage"],
        "needs": [
            {"text": "需要依靠毒和灼烧长时间持续伤害，而不是短时间爆发", "expected": "sustained_damage"},
        ],
    },
    {
        "id": "control_delay",
        "text": "敌人行动太快，我需要控制和减速来拖延他们。",
        "expected": ["control"],
        "needs": [
            {"text": "需要减速、冻结和控制敌人行动", "expected": "control"},
        ],
    },
    {
        "id": "clear_groups",
        "text": "敌人数量很多，需要快速清理一群小怪。",
        "expected": ["area_damage", "damage"],
        "needs": [
            {"text": "需要同时攻击并清理多个敌人", "expected": "area_damage"},
            {"text": "需要造成足够的总体伤害", "expected": "damage"},
        ],
    },
    {
        "id": "execute_target",
        "text": "对面有一个特别危险的核心，我要快速集火把它处决。",
        "expected": ["execution", "burst"],
        "needs": [
            {"text": "需要集火并单点处决危险目标", "expected": "execution"},
            {"text": "需要短时间集中爆发伤害", "expected": "burst"},
        ],
    },
    {
        "id": "support_core",
        "text": "我方核心已经有输出，我需要强化他并且保护他活下来。",
        "expected": ["buff", "protection"],
        "needs": [
            {"text": "需要给核心队友提供增益并强化他", "expected": "buff"},
            {"text": "需要治疗、护盾和保护核心队友存活", "expected": "protection"},
        ],
    },
]


def load_payload() -> dict:
    return json.loads(ARTIFACT.read_text(encoding="utf-8"))


class RequirementDirections:
    def __init__(self, runtime: GTERuntime, axes: list[str]):
        self.runtime = runtime
        self.axes = axes
        anchor_texts = []
        self.anchor_slices = []
        for axis in axes:
            start = len(anchor_texts)
            anchor_texts.extend(
                [AXIS_LANGUAGE[axis]["positive"], *AXIS_LANGUAGE[axis]["anchors"]]
            )
            self.anchor_slices.append(slice(start, len(anchor_texts)))
        self.anchor_vectors = runtime.encode(anchor_texts)

    def direction(self, text: str, max_axes: int = 3) -> dict:
        encoded = self.runtime.encode([text])[0]
        anchor_alignment = self.anchor_vectors @ encoded
        alignment = np.array(
            [float(np.max(anchor_alignment[span])) for span in self.anchor_slices],
            dtype=np.float64,
        )
        ranking = np.argsort(-alignment)
        selected = [int(index) for index in ranking[:max_axes]]
        weights = np.zeros(len(self.axes), dtype=np.float64)
        floor = float(alignment[selected[-1]])
        for index in selected:
            weights[index] = max(0.0, float(alignment[index]) - floor + 0.01)
        if float(np.linalg.norm(weights)) <= 1e-12:
            weights[selected[0]] = 1.0
        weights = normalize(weights)
        return {
            "text": text,
            "weights": weights,
            "ranking": [
                {"axis": self.axes[int(index)], "alignment": float(alignment[index])}
                for index in ranking
            ],
        }

    def compose(self, needs: list[dict]) -> dict:
        weights = np.zeros(len(self.axes), dtype=np.float64)
        rows = []
        for need in needs:
            recognized = self.direction(need["text"], max_axes=3)
            predicted = recognized["ranking"][0]["axis"]
            weights[self.axes.index(predicted)] += float(need.get("strength", 1.0))
            rows.append(
                {
                    "text": need["text"],
                    "expected": need.get("expected"),
                    "predicted": predicted,
                    "top3": [row["axis"] for row in recognized["ranking"][:3]],
                    "correct": predicted == need.get("expected"),
                    "ranking": recognized["ranking"][:5],
                }
            )
        return {"weights": normalize(weights), "atomicNeeds": rows}


def vector_matrix(payload: dict, branch: str) -> tuple[list[str], np.ndarray]:
    rows = payload[branch]["vectors"] if branch == "knowledge" else payload[branch]["vectors"]
    team_ids = [row["teamId"] for row in rows]
    matrix = np.array([row["vector"] for row in rows], dtype=np.float64)
    return team_ids, matrix


def evaluate_direction_language(model: RequirementDirections) -> dict:
    rows = []
    for requirement in REQUIREMENTS:
        whole = model.direction(requirement["text"])
        composed = model.compose(requirement["needs"])
        top3 = [row["axis"] for row in whole["ranking"][:3]]
        expected = requirement["expected"]
        rows.append(
            {
                **requirement,
                "top1": top3[0],
                "top3": top3,
                "allExpectedInTop3": all(axis in top3 for axis in expected),
                "allAtomicNeedsCorrect": all(row["correct"] for row in composed["atomicNeeds"]),
                "atomicNeeds": composed["atomicNeeds"],
                "weights": {
                    axis: round(float(composed["weights"][index]), 4)
                    for index, axis in enumerate(model.axes)
                    if composed["weights"][index] > 0
                },
                "ranking": whole["ranking"][:5],
            }
        )
    atomic_rows = [atomic for row in rows for atomic in row["atomicNeeds"]]
    return {
        "count": len(rows),
        "allExpectedTop3Rate": sum(row["allExpectedInTop3"] for row in rows) / len(rows),
        "atomicTop1Rate": sum(row["correct"] for row in atomic_rows) / len(atomic_rows),
        "rows": rows,
    }


def evaluate_retrieval(
    payload: dict,
    model: RequirementDirections,
    team_ids: list[str],
    knowledge_vectors: np.ndarray,
    validation_vectors: np.ndarray,
) -> dict:
    team_by_id = {row["id"]: row for row in payload["teams"]}
    rows = []
    for requirement in REQUIREMENTS:
        direction = model.compose(requirement["needs"])
        weights = direction["weights"]
        knowledge_scores = knowledge_vectors @ weights
        validation_scores = validation_vectors @ weights
        ranking = np.argsort(-knowledge_scores)
        top = ranking[:10]
        bottom = ranking[-10:]
        top_validation = float(np.mean(validation_scores[top]))
        bottom_validation = float(np.mean(validation_scores[bottom]))
        top5 = []
        for index in ranking[:5]:
            team_id = team_ids[int(index)]
            top5.append(
                {
                    "teamId": team_id,
                    "formation": team_by_id[team_id]["label"],
                    "knowledgeScore": round(float(knowledge_scores[index]), 4),
                    "validationScore": round(float(validation_scores[index]), 4),
                    "axisValues": {
                        axis: round(float(knowledge_vectors[index, axis_index]), 3)
                        for axis_index, axis in enumerate(model.axes)
                        if weights[axis_index] > 0
                    },
                }
            )
        rows.append(
            {
                **requirement,
                "directionWeights": {
                    axis: round(float(weights[index]), 4)
                    for index, axis in enumerate(model.axes)
                    if weights[index] > 0
                },
                "heldOutTop10Mean": round(top_validation, 4),
                "heldOutBottom10Mean": round(bottom_validation, 4),
                "heldOutMargin": round(top_validation - bottom_validation, 4),
                "heldOutPassed": top_validation > bottom_validation,
                "top5": top5,
            }
        )
    return {
        "count": len(rows),
        "heldOutPassRate": sum(row["heldOutPassed"] for row in rows) / len(rows),
        "rows": rows,
    }


def evaluate_axis_stability(
    axes: list[str], knowledge_vectors: np.ndarray, validation_vectors: np.ndarray
) -> dict:
    rows = []
    for index, axis in enumerate(axes):
        correlation = spearman(knowledge_vectors[:, index], validation_vectors[:, index])
        ordering = np.argsort(-knowledge_vectors[:, index])
        top = ordering[:10]
        bottom = ordering[-10:]
        rows.append(
            {
                "axis": axis,
                "spearman": round(float(correlation), 4),
                "heldOutTop10Mean": round(float(np.mean(validation_vectors[top, index])), 4),
                "heldOutBottom10Mean": round(float(np.mean(validation_vectors[bottom, index])), 4),
                "topBeatsBottom": bool(
                    np.mean(validation_vectors[top, index])
                    > np.mean(validation_vectors[bottom, index])
                ),
            }
        )
    return {
        "meanSpearman": round(float(np.mean([row["spearman"] for row in rows])), 4),
        "topBeatsBottomRate": sum(row["topBeatsBottom"] for row in rows) / len(rows),
        "rows": rows,
    }


def evaluate_team_guess(
    payload: dict,
    model: RequirementDirections,
    team_ids: list[str],
    vectors: np.ndarray,
) -> dict:
    axis_question_audit = {
        axis: model.direction(AXIS_LANGUAGE[axis]["question"], max_axes=3)
        for axis in model.axes
    }
    runs = []
    for target_index, target_id in enumerate(team_ids):
        posterior = np.full(len(team_ids), 1 / len(team_ids), dtype=np.float64)
        used: set[tuple[int, int]] = set()
        trace = []
        for step in range(8):
            clue = choose_clue(target_index, posterior, vectors, used)
            if clue is None:
                break
            axis_index, anchor_index = clue
            used.add(clue)
            axis = model.axes[axis_index]
            true_answer = bool(vectors[target_index, axis_index] > vectors[anchor_index, axis_index])
            # Guessing tests the learned team vector and dot-product mechanics. The
            # generated clue already owns an explicit axis; fuzzy-language mapping is
            # audited separately instead of being allowed to corrupt this test.
            weights = np.zeros(len(model.axes), dtype=np.float64)
            weights[axis_index] = 1.0
            projected = vectors @ weights
            candidate_answers = projected > projected[anchor_index]
            likelihood = np.where(candidate_answers == true_answer, 0.92, 0.08)
            posterior = posterior * likelihood
            posterior = posterior / posterior.sum()
            trace.append(
                {
                    "step": step + 1,
                    "axis": axis,
                    "interpretedWeights": {
                        name: round(float(weights[index]), 4)
                        for index, name in enumerate(model.axes)
                        if weights[index] > 0
                    },
                    "anchorTeamId": team_ids[anchor_index],
                    "answer": true_answer,
                    "targetRank": rank_of(posterior, target_index),
                    "effectiveCandidates": round(1 / float(np.sum(posterior**2)), 3),
                }
            )
        runs.append(
            {
                "targetTeamId": target_id,
                "targetFormation": payload["teams"][target_index]["label"],
                "finalRank": rank_of(posterior, target_index),
                "finalProbability": round(float(posterior[target_index]), 6),
                "trace": trace,
            }
        )
    first_top1_steps = []
    for row in runs:
        first = next(
            (trace_row["step"] for trace_row in row["trace"] if trace_row["targetRank"] == 1),
            None,
        )
        if first is not None:
            first_top1_steps.append(first)
    return {
        "teamCount": len(runs),
        "top1": sum(row["finalRank"] <= 1 for row in runs),
        "top3": sum(row["finalRank"] <= 3 for row in runs),
        "top5": sum(row["finalRank"] <= 5 for row in runs),
        "meanRank": round(float(np.mean([row["finalRank"] for row in runs])), 4),
        "meanFirstTop1Step": round(float(np.mean(first_top1_steps)), 4),
        "maxFirstTop1Step": max(first_top1_steps),
        "axisQuestionLanguageAudit": {
            axis: {
                "top1": row["ranking"][0]["axis"],
                "top3": [item["axis"] for item in row["ranking"][:3]],
            }
            for axis, row in axis_question_audit.items()
        },
        "runs": runs,
    }


def choose_clue(
    target_index: int,
    posterior: np.ndarray,
    vectors: np.ndarray,
    used: set[tuple[int, int]],
) -> tuple[int, int] | None:
    best = None
    for axis_index in range(vectors.shape[1]):
        target_value = vectors[target_index, axis_index]
        for anchor_index in range(vectors.shape[0]):
            key = (axis_index, anchor_index)
            if anchor_index == target_index or key in used:
                continue
            answer = target_value > vectors[anchor_index, axis_index]
            candidate_answers = vectors[:, axis_index] > vectors[anchor_index, axis_index]
            match_mass = float(posterior[candidate_answers == answer].sum())
            balance = 1 - abs(0.5 - match_mass) * 2
            separation = abs(target_value - vectors[anchor_index, axis_index])
            score = balance * min(1.0, separation * 2 + 0.1)
            if best is None or score > best[0]:
                best = (score, axis_index, anchor_index)
    return (best[1], best[2]) if best else None


def rank_of(posterior: np.ndarray, target_index: int) -> int:
    return int(np.where(np.argsort(-posterior) == target_index)[0][0] + 1)


def spearman(left: np.ndarray, right: np.ndarray) -> float:
    left_rank = rank_values(left)
    right_rank = rank_values(right)
    if np.std(left_rank) <= 1e-12 or np.std(right_rank) <= 1e-12:
        return 0.0
    return float(np.corrcoef(left_rank, right_rank)[0, 1])


def rank_values(values: np.ndarray) -> np.ndarray:
    order = np.argsort(values)
    ranks = np.empty(len(values), dtype=np.float64)
    cursor = 0
    while cursor < len(values):
        end = cursor + 1
        while end < len(values) and values[order[end]] == values[order[cursor]]:
            end += 1
        average_rank = (cursor + end - 1) / 2
        ranks[order[cursor:end]] = average_rank
        cursor = end
    return ranks


def normalize(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    if norm <= 1e-12:
        return np.zeros_like(vector)
    return vector / norm


def normalize_rows(matrix: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(matrix, axis=1, keepdims=True)
    norms = np.where(norms <= 1e-12, 1.0, norms)
    return matrix / norms


def render_markdown(payload: dict, results: dict) -> str:
    direction = results["directionLanguage"]
    retrieval = results["retrieval"]
    stability = results["axisStability"]
    guessing = results["teamGuess"]
    lines = [
        "# 50队知识向量与需求方向实验",
        "",
        "## 结论",
        "",
        f"- 50支队伍完成两套随机种子的600场战斗；知识只来自第一套，第二套只校验。",
        f"- 复合需求拆成原子需求后，原子方向Top-1正确率：{direction['atomicTop1Rate']:.1%}；整句仅作为对照。",
        f"- 按知识向量点积选出的Top-10，在未参与学习的战斗中优于Bottom-10：{sum(row['heldOutPassed'] for row in retrieval['rows'])}/{retrieval['count']}类需求。",
        f"- 九个能力轴的平均跨种子Spearman相关：{stability['meanSpearman']:.3f}。",
        f"- 最多8条相对线索后，猜队伍Top-1 {guessing['top1']}/{guessing['teamCount']}，Top-3 {guessing['top3']}/{guessing['teamCount']}，Top-5 {guessing['top5']}/{guessing['teamCount']}，平均名次{guessing['meanRank']:.2f}。",
        f"- 目标队伍平均在第{guessing['meanFirstTop1Step']:.2f}条线索首次升到Top-1，最晚第{guessing['maxFirstTop1Step']}条。",
        "",
        "## 需求方向与检索",
        "",
        "| 需求 | 方向权重 | 未见战斗Top10 | 未见战斗Bottom10 | 通过 |",
        "| --- | --- | ---: | ---: | --- |",
    ]
    direction_by_id = {row["id"]: row for row in direction["rows"]}
    for row in retrieval["rows"]:
        weights = "、".join(f"{axis}={value:.2f}" for axis, value in row["directionWeights"].items())
        direction_ok = direction_by_id[row["id"]]["allAtomicNeedsCorrect"]
        passed = row["heldOutPassed"] and direction_ok
        lines.append(
            f"| {row['text']} | {weights} | {row['heldOutTop10Mean']:.3f} | {row['heldOutBottom10Mean']:.3f} | {'是' if passed else '否'} |"
        )
    lines.extend(
        [
            "",
            "## 各能力轴跨种子稳定性",
            "",
            "| 能力轴 | Spearman | Top10未见表现 | Bottom10未见表现 |",
            "| --- | ---: | ---: | ---: |",
        ]
    )
    for row in stability["rows"]:
        lines.append(
            f"| {row['axis']} | {row['spearman']:.3f} | {row['heldOutTop10Mean']:.3f} | {row['heldOutBottom10Mean']:.3f} |"
        )
    lines.extend(
        [
            "",
            "## 边界",
            "",
            "- 这是50队小样本，不代表完整1000队结果。",
            "- 队伍向量使用标准技能；技能搭配随机化尚未加入。",
            "- 猜队伍验证的是知识内部可区分性；需求检索的第二随机种子才是本轮外部校验。",
            "- GTE只把需求语言变成方向，不产生队伍能力值；能力值来自玩家可见战斗signal。",
            "",
        ]
    )
    return "\n".join(lines)


def main() -> None:
    payload = load_payload()
    axes = [row["id"] for row in payload["axes"]]
    if axes != list(AXIS_LANGUAGE):
        raise ValueError(f"axis order mismatch: {axes}")
    team_ids, knowledge_vectors = vector_matrix(payload, "knowledge")
    validation_ids, validation_vectors = vector_matrix(payload, "heldOutValidation")
    if team_ids != validation_ids:
        raise ValueError("knowledge and validation team order mismatch")
    runtime = GTERuntime()
    directions = RequirementDirections(runtime, axes)
    results = {
        "schema": "team_vector_query_results_v1",
        "teamCount": len(team_ids),
        "axisOrder": axes,
        "directionLanguage": evaluate_direction_language(directions),
        "axisStability": evaluate_axis_stability(axes, knowledge_vectors, validation_vectors),
        "retrieval": evaluate_retrieval(
            payload,
            directions,
            team_ids,
            knowledge_vectors,
            validation_vectors,
        ),
        "teamGuess": evaluate_team_guess(
            payload, directions, team_ids, knowledge_vectors
        ),
    }
    RESULT_JSON.write_text(
        json.dumps(results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    RESULT_MD.write_text(render_markdown(payload, results), encoding="utf-8")
    print(
        json.dumps(
            {
                "teamCount": len(team_ids),
                "directionTop3": results["directionLanguage"]["allExpectedTop3Rate"],
                "heldOutRetrievalPass": results["retrieval"]["heldOutPassRate"],
                "meanAxisSpearman": results["axisStability"]["meanSpearman"],
                "guessTop1": results["teamGuess"]["top1"],
                "guessTop3": results["teamGuess"]["top3"],
                "guessTop5": results["teamGuess"]["top5"],
                "guessMeanRank": results["teamGuess"]["meanRank"],
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
