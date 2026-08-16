from __future__ import annotations

import json

import numpy as np

from prototype_learner import ConsequencePrototypeLearner
from run_learning_curve import ARTIFACTS, CachedEncoder, DATA, SECRET, effect_key, read_jsonl, verify_manifest


def main() -> None:
    output_path = ARTIFACTS / "prototype_threshold_calibration_on_exposed_eval.json"
    if output_path.exists():
        raise RuntimeError("threshold calibration already exists")
    verify_manifest()
    learn = read_jsonl(DATA / "learn_ideal_records.jsonl")
    queries = read_jsonl(DATA / "eval_ideal_queries.jsonl")
    gold = read_jsonl(SECRET / "eval_gold.jsonl")
    encoder = CachedEncoder()
    learner = ConsequencePrototypeLearner(encoder, min_similarity=None)
    learner.observe(learn)
    predictions = learner.predict(queries)
    rows = []
    for prediction, expected in zip(predictions, gold, strict=True):
        unknown = expected["familySplit"] == "unknown_only"
        underlying_correct = effect_key(prediction.effects) == effect_key(expected["effects"])
        rows.append({
            "id": expected["id"], "familyId": expected["familyId"], "unknown": unknown,
            "underlyingCorrect": underlying_correct, "similarity": prediction.similarity,
            "margin": prediction.vote_margin,
        })
    sweep = []
    for threshold in np.arange(0.0, 0.951, 0.005):
        threshold = float(threshold)
        answerable = [row for row in rows if not row["unknown"]]
        unknown = [row for row in rows if row["unknown"]]
        known_correct = sum(row["underlyingCorrect"] and row["similarity"] >= threshold for row in answerable)
        unknown_correct = sum(row["similarity"] < threshold for row in unknown)
        total = known_correct + unknown_correct
        sweep.append({
            "threshold": threshold,
            "decisionAccuracy": total / len(rows),
            "answerableAccuracy": known_correct / len(answerable),
            "unknownRejection": unknown_correct / len(unknown),
            "coverage": sum(row["similarity"] >= threshold for row in rows) / len(rows),
        })
    best_overall = max(sweep, key=lambda row: (row["decisionAccuracy"], row["answerableAccuracy"]))
    feasible = [row for row in sweep if row["answerableAccuracy"] >= 0.8 and row["unknownRejection"] >= 0.7]
    output = {
        "schema": "prototype_threshold_calibration_exposed_v0",
        "status": "development_only_eval_exposed",
        "noAbstainAnswerableAccuracy": sum(row["underlyingCorrect"] for row in rows if not row["unknown"]) / 4500,
        "similarity": {
            "answerableMean": float(np.mean([row["similarity"] for row in rows if not row["unknown"]])),
            "unknownMean": float(np.mean([row["similarity"] for row in rows if row["unknown"]])),
            "answerableCorrectMean": float(np.mean([row["similarity"] for row in rows if not row["unknown"] and row["underlyingCorrect"]])),
            "answerableWrongMean": float(np.mean([row["similarity"] for row in rows if not row["unknown"] and not row["underlyingCorrect"]])),
        },
        "bestOverall": best_overall,
        "feasible80Known70Unknown": feasible[-1] if feasible else None,
        "sweep": sweep,
        "rows": rows,
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in output.items() if key not in ("sweep", "rows")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
