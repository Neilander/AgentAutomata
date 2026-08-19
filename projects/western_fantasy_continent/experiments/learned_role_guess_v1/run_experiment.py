from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import numpy as np


EXPERIMENT_ROOT = Path(__file__).resolve().parent
LATENT_RUNTIME_ROOT = EXPERIMENT_ROOT.parent / "latent_space_rune_v0"
sys.path.insert(0, str(LATENT_RUNTIME_ROOT))

from gte_runtime import GTERuntime  # noqa: E402


DIMENSIONS = {
    "output": {
        "description": "对敌方造成整体战斗输出、帮助队伍击杀敌人的能力",
        "questions": [
            "这个角色整体打伤害的本事，比参照角色更强吗？",
            "如果主要缺的是杀敌火力，它比参照角色更能输出吗？",
            "它在造成总伤害方面是否超过参照角色？",
        ],
    },
    "protection": {
        "description": "通过治疗、护盾、格挡或减伤保护队友的整体能力",
        "questions": [
            "这个角色整体上比参照角色更能保住队友吗？",
            "需要队伍活下来时，它提供的总体保护更强吗？",
            "不限定具体手段，它比参照角色更擅长保护全队吗？",
        ],
    },
    "buff": {
        "description": "给队友施加正面增益、放大队伍能力的本事",
        "questions": [
            "这个角色比参照角色更能强化其他队友吗？",
            "它给全队提供正面增益的能力更强吗？",
            "如果想放大队伍，它比参照角色更有用吗？",
        ],
    },
    "healing": {
        "description": "直接恢复队友失去的生命值、治疗伤口的能力",
        "questions": [
            "这个角色给队友回血的本事比参照角色强吗？",
            "队友受伤以后，它比参照角色更会把生命恢复回来吗？",
            "只比较直接治疗，它是否强于参照角色？",
        ],
    },
    "shielding": {
        "description": "提前生成护盾或屏障、吸收即将受到的伤害",
        "questions": [
            "这个角色套盾挡伤害的本事比参照角色强吗？",
            "只比较提前制造屏障，它是否更擅长保护队友？",
            "它生成护盾吸收攻击的能力更强吗？",
        ],
    },
    "area_damage": {
        "description": "同时攻击多个敌人、清理成群目标的能力",
        "questions": [
            "这个角色清理一群小怪的本事比参照角色强吗？",
            "面对多个敌人时，它的群体攻击更厉害吗？",
            "只比较同时打很多目标，它是否强于参照角色？",
        ],
    },
    "sustained_damage": {
        "description": "长时间不断造成伤害、持续磨掉敌人生命的能力",
        "questions": [
            "这个角色长时间磨血的本事比参照角色强吗？",
            "战斗拖久以后，它的持续伤害更厉害吗？",
            "只比较连续不断的输出，它是否强于参照角色？",
        ],
    },
}


def load_memory() -> dict:
    return json.loads(
        (EXPERIMENT_ROOT / "artifacts" / "learned-role-memory.json").read_text(
            encoding="utf-8"
        )
    )


def build_values(characters: list[dict]) -> dict[str, np.ndarray]:
    values = {}
    for dimension in DIMENSIONS:
        rows = []
        for character in characters:
            if dimension in character["capabilities"]:
                rows.append(float(character["capabilities"][dimension]["position"]))
                continue
            trait = next(
                (row for row in character["traits"] if row["domain"] == dimension), None
            )
            rows.append(float(trait["level"]) if trait else np.nan)
        values[dimension] = np.array(rows, dtype=np.float64)
    return values


def build_dimension_recognizer(runtime: GTERuntime):
    names = list(DIMENSIONS)
    description_vectors = runtime.encode(
        [DIMENSIONS[name]["description"] for name in names]
    )

    def recognize(texts: list[str]) -> list[dict]:
        query_vectors = runtime.encode(texts)
        scores = query_vectors @ description_vectors.T
        output = []
        for row in scores:
            ranking = np.argsort(-row)
            output.append(
                {
                    "predicted": names[int(ranking[0])],
                    "margin": float(row[ranking[0]] - row[ranking[1]]),
                    "ranking": [
                        {"dimension": names[int(index)], "score": float(row[index])}
                        for index in ranking[:3]
                    ],
                }
            )
        return output

    return recognize


def evaluate_question_understanding(recognize) -> dict:
    texts = []
    truth = []
    for dimension, spec in DIMENSIONS.items():
        for question in spec["questions"]:
            texts.append(question)
            truth.append(dimension)
    predictions = recognize(texts)
    rows = []
    for text, expected, prediction in zip(texts, truth, predictions):
        top_dimensions = [row["dimension"] for row in prediction["ranking"]]
        rows.append(
            {
                "question": text,
                "expected": expected,
                "predicted": prediction["predicted"],
                "correct": prediction["predicted"] == expected,
                "top2Correct": expected in top_dimensions[:2],
                "top3Correct": expected in top_dimensions,
                "familyCompatible": same_semantic_family(
                    prediction["predicted"], expected
                ),
                "margin": prediction["margin"],
                "top3": prediction["ranking"],
            }
        )
    return {
        "accuracy": sum(row["correct"] for row in rows) / len(rows),
        "top2Accuracy": sum(row["top2Correct"] for row in rows) / len(rows),
        "top3Accuracy": sum(row["top3Correct"] for row in rows) / len(rows),
        "semanticFamilyAccuracy": sum(row["familyCompatible"] for row in rows)
        / len(rows),
        "count": len(rows),
        "errors": [row for row in rows if not row["correct"]],
        "rows": rows,
    }


def same_semantic_family(left: str, right: str) -> bool:
    if left == right:
        return True
    families = [
        {"output", "area_damage", "sustained_damage"},
        {"protection", "healing", "shielding"},
        {"buff"},
    ]
    return any(left in family and right in family for family in families)


def choose_diagnostic_clues(
    target_index: int,
    posterior: np.ndarray,
    values: dict[str, np.ndarray],
    used: set[tuple[str, int]],
) -> tuple[str, int] | None:
    best = None
    for dimension, dimension_values in values.items():
        target_value = dimension_values[target_index]
        if not np.isfinite(target_value):
            continue
        for anchor_index, anchor_value in enumerate(dimension_values):
            key = (dimension, anchor_index)
            if anchor_index == target_index or key in used or not np.isfinite(anchor_value):
                continue
            known = np.isfinite(dimension_values)
            answer = target_value > anchor_value
            predicted_match = np.where(
                known,
                (dimension_values > anchor_value) == answer,
                0.5,
            )
            yes_mass = float(
                posterior @ np.where(predicted_match == 0.5, 0.5, predicted_match.astype(float))
            )
            balance = 1 - abs(0.5 - yes_mass) * 2
            known_mass = float(posterior[known].sum())
            score = balance * known_mass
            if best is None or score > best[0]:
                best = (score, dimension, anchor_index)
    return (best[1], best[2]) if best else None


def apply_relative_clue(
    posterior: np.ndarray,
    interpreted_dimension: str,
    true_dimension: str,
    anchor_index: int,
    target_index: int,
    values: dict[str, np.ndarray],
) -> np.ndarray:
    true_values = values[true_dimension]
    answer = bool(true_values[target_index] > true_values[anchor_index])
    interpreted_values = values[interpreted_dimension]
    if not np.isfinite(interpreted_values[anchor_index]):
        return posterior.copy()
    known = np.isfinite(interpreted_values)
    candidate_answers = interpreted_values > interpreted_values[anchor_index]
    likelihood = np.where(known, np.where(candidate_answers == answer, 0.92, 0.08), 0.5)
    updated = posterior * likelihood
    return updated / updated.sum()


def rank_of(posterior: np.ndarray, target_index: int) -> int:
    return int(np.where(np.argsort(-posterior) == target_index)[0][0] + 1)


def run_guesses(characters: list[dict], values: dict[str, np.ndarray], recognize) -> dict:
    runs = []
    for target_index, target in enumerate(characters):
        posterior = np.full(len(characters), 1 / len(characters), dtype=np.float64)
        oracle_posterior = posterior.copy()
        used: set[tuple[str, int]] = set()
        trace = []
        for step in range(6):
            clue = choose_diagnostic_clues(target_index, posterior, values, used)
            if clue is None:
                break
            true_dimension, anchor_index = clue
            used.add(clue)
            question = DIMENSIONS[true_dimension]["questions"][step % 3]
            interpretation = recognize([question])[0]
            before_effective = 1 / float(np.sum(posterior**2))
            posterior = apply_relative_clue(
                posterior,
                interpretation["predicted"],
                true_dimension,
                anchor_index,
                target_index,
                values,
            )
            oracle_posterior = apply_relative_clue(
                oracle_posterior,
                true_dimension,
                true_dimension,
                anchor_index,
                target_index,
                values,
            )
            trace.append(
                {
                    "question": question,
                    "trueDimension": true_dimension,
                    "interpretedDimension": interpretation["predicted"],
                    "anchor": characters[anchor_index]["name"],
                    "answer": bool(
                        values[true_dimension][target_index]
                        > values[true_dimension][anchor_index]
                    ),
                    "targetRank": rank_of(posterior, target_index),
                    "effectiveCandidatesBefore": before_effective,
                    "effectiveCandidatesAfter": 1 / float(np.sum(posterior**2)),
                }
            )
        final_rank = rank_of(posterior, target_index)
        oracle_rank = rank_of(oracle_posterior, target_index)
        runs.append(
            {
                "target": target["name"],
                "targetId": target["id"],
                "rank": final_rank,
                "oracleRank": oracle_rank,
                "top1": final_rank == 1,
                "top3": final_rank <= 3,
                "top5": final_rank <= 5,
                "trace": trace,
            }
        )
    return {
        "targetCount": len(runs),
        "top1": sum(run["top1"] for run in runs) / len(runs),
        "top3": sum(run["top3"] for run in runs) / len(runs),
        "top5": sum(run["top5"] for run in runs) / len(runs),
        "meanRank": float(np.mean([run["rank"] for run in runs])),
        "oracleTop3": sum(run["oracleRank"] <= 3 for run in runs) / len(runs),
        "oracleMeanRank": float(np.mean([run["oracleRank"] for run in runs])),
        "runs": runs,
    }


def unknown_preservation_check(characters: list[dict], values: dict[str, np.ndarray]) -> dict:
    dimension = "healing"
    dimension_values = values[dimension]
    anchor_index = next(index for index, value in enumerate(dimension_values) if np.isfinite(value))
    target_index = next(
        index
        for index, value in enumerate(dimension_values)
        if np.isfinite(value) and index != anchor_index
    )
    posterior = np.full(len(characters), 1 / len(characters), dtype=np.float64)
    updated = apply_relative_clue(
        posterior,
        dimension,
        dimension,
        anchor_index,
        target_index,
        values,
    )
    unknown_indices = np.where(~np.isfinite(dimension_values))[0]
    return {
        "dimension": dimension,
        "unknownCharacterCount": int(len(unknown_indices)),
        "unknownsRemainPossible": bool(np.all(updated[unknown_indices] > 0)),
        "unknownProbabilityEqual": bool(
            len(unknown_indices) <= 1
            or np.allclose(updated[unknown_indices], updated[unknown_indices][0])
        ),
    }


def main() -> None:
    memory = load_memory()
    characters = memory["characters"]
    values = build_values(characters)
    runtime = GTERuntime()
    recognize = build_dimension_recognizer(runtime)
    understanding = evaluate_question_understanding(recognize)
    guesses = run_guesses(characters, values, recognize)
    result = {
        "schema": "learned_role_guess_result_v1",
        "source": memory["source"],
        "candidateCount": len(characters),
        "dimensionCount": len(DIMENSIONS),
        "dimensions": list(DIMENSIONS),
        "questionUnderstanding": understanding,
        "roleGuess": guesses,
        "unknownPreservation": unknown_preservation_check(characters, values),
        "interpretation": {
            "fastRecallGoal": "Top-3/Top-5保留目标，不要求直接替代详细比较",
            "numbersReadByGTE": False,
            "gteResponsibility": "把自然语言问题匹配到玩家已学到的能力或特点方向",
            "matrixResponsibility": "在匹配方向上执行相对大小比较",
        },
    }
    output_path = EXPERIMENT_ROOT / "artifacts" / "latest-results.json"
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "result": "PASS",
                "questionUnderstanding": {
                    "accuracy": understanding["accuracy"],
                    "top2Accuracy": understanding["top2Accuracy"],
                    "top3Accuracy": understanding["top3Accuracy"],
                    "semanticFamilyAccuracy": understanding["semanticFamilyAccuracy"],
                    "count": understanding["count"],
                    "errorCount": len(understanding["errors"]),
                },
                "roleGuess": {
                    key: value for key, value in guesses.items() if key != "runs"
                },
                "unknownPreservation": result["unknownPreservation"],
                "output": str(output_path),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
