from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path


HERE = Path(__file__).resolve().parent
ARTIFACTS = HERE / "artifacts"


def summarize(path: Path, selected_key: str = "selected") -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    rounds = data["rounds"]
    accuracies = [row[selected_key]["summary"]["all"]["accuracy"] for row in rounds]
    answerable = [row[selected_key]["summary"]["answerable"]["accuracy"] for row in rounds]
    family = defaultdict(lambda: [0, 0, 0])
    cuts = defaultdict(lambda: [0, 0])
    for round_ in rounds:
        for row in round_[selected_key]["rows"]:
            family[row["familyId"]][0] += int(row["correct"])
            family[row["familyId"]][1] += 1
            family[row["familyId"]][2] += int(row["abstained"])
            for name in (
                f"subjects_{row['subjectCount']}",
                f"interactions_{row['interactionCount']}",
                row["familySplit"],
            ):
                cuts[name][0] += int(row["correct"])
                cuts[name][1] += 1
    family_rows = [
        {"familyId": key, "correct": value[0], "cases": value[1],
         "accuracy": value[0] / value[1], "abstained": value[2]}
        for key, value in family.items()
    ]
    return {
        "rounds": len(rounds),
        "firstAccuracy": accuracies[0],
        "finalAccuracy": accuracies[-1],
        "maxAccuracy": max(accuracies),
        "maxRound": accuracies.index(max(accuracies)) + 1,
        "meanAccuracy": sum(accuracies) / len(accuracies),
        "last5Accuracy": sum(accuracies[-5:]) / 5,
        "finalAnswerableAccuracy": answerable[-1],
        "last5AnswerableAccuracy": sum(answerable[-5:]) / 5,
        "cuts": {key: {"correct": value[0], "cases": value[1], "accuracy": value[0] / value[1]}
                 for key, value in cuts.items()},
        "familiesAtLeast80": sum(row["accuracy"] >= 0.8 for row in family_rows),
        "familiesBelow50": sum(row["accuracy"] < 0.5 for row in family_rows),
        "bestFamilies": sorted(family_rows, key=lambda row: (-row["accuracy"], row["familyId"]))[:10],
        "worstFamilies": sorted(family_rows, key=lambda row: (row["accuracy"], row["familyId"]))[:20],
    }


def main() -> None:
    output = {
        "individualMemory": summarize(ARTIFACTS / "ideal_parser_learning_curve.json"),
        "consequencePrototype": summarize(ARTIFACTS / "prototype_diagnostic_on_exposed_eval.json"),
    }
    (ARTIFACTS / "curve_summary.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
