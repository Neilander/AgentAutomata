from __future__ import annotations

import json
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
SOURCE = HERE / "artifacts" / "prototype_threshold_calibration_on_exposed_eval.json"


def metrics(rows: list[dict], threshold: float) -> dict:
    known = [row for row in rows if not row["unknown"]]
    unknown = [row for row in rows if row["unknown"]]
    known_correct = sum(row["underlyingCorrect"] and row["similarity"] >= threshold for row in known)
    unknown_correct = sum(row["similarity"] < threshold for row in unknown)
    return {
        "threshold": threshold,
        "decisionAccuracy": (known_correct + unknown_correct) / len(rows),
        "answerableAccuracy": known_correct / len(known),
        "unknownRejection": unknown_correct / len(unknown),
    }


def main() -> None:
    rows = json.loads(SOURCE.read_text(encoding="utf-8"))["rows"]
    development = rows[:2500]
    validation = rows[2500:]
    candidates = [metrics(development, float(value)) for value in np.arange(0.0, 0.951, 0.005)]
    feasible = [row for row in candidates if row["answerableAccuracy"] >= 0.8 and row["unknownRejection"] >= 0.7]
    selected = max(feasible or candidates, key=lambda row: (row["decisionAccuracy"], row["answerableAccuracy"]))
    output = {
        "schema": "posthoc_half_split_threshold_validation_v0",
        "status": "posthoc_not_pristine_but_threshold_selected_on_first_half_only",
        "development": selected,
        "validation": metrics(validation, selected["threshold"]),
        "developmentCases": len(development),
        "validationCases": len(validation),
    }
    path = HERE / "artifacts" / "prototype_threshold_half_split_validation.json"
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
