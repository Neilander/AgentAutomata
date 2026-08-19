from __future__ import annotations

import json
import sys
from pathlib import Path


HERE = Path(__file__).resolve().parent


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def key(effects: list[dict]) -> tuple[tuple[str, str], ...]:
    return tuple(sorted((effect["entity"], str(effect["value"])) for effect in effects))


def main() -> None:
    round_index = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    round_dir = HERE / f"agent_round_{round_index:02d}"
    predictions = read_jsonl(round_dir / "predictions.jsonl")
    start = (round_index - 1) * 100
    gold = read_jsonl(HERE / "secret" / "eval_gold.jsonl")[start:start + 100]
    gold_by_id = {row["id"]: row for row in gold}
    rows = []
    for prediction in predictions:
        expected = gold_by_id[prediction["id"]]
        unknown = expected["familySplit"] == "unknown_only"
        correct = bool(prediction["uncertain"]) if unknown else (
            not prediction["uncertain"] and key(prediction["effects"]) == key(expected["effects"])
        )
        rows.append({
            "id": prediction["id"], "familyId": expected["familyId"],
            "unknown": unknown, "correct": correct, "uncertain": prediction["uncertain"],
            "predictedEffects": prediction["effects"], "goldEffects": expected["effects"],
            "evidenceTrainIds": prediction["evidenceTrainIds"],
        })
    answerable = [row for row in rows if not row["unknown"]]
    unknown = [row for row in rows if row["unknown"]]
    output = {
        "schema": "actual_agent_round_score_v0",
        "round": round_index,
        "cases": len(rows),
        "correct": sum(row["correct"] for row in rows),
        "accuracy": sum(row["correct"] for row in rows) / len(rows),
        "answerableAccuracy": sum(row["correct"] for row in answerable) / len(answerable),
        "unknownRejection": sum(row["correct"] for row in unknown) / len(unknown),
        "coverage": sum(not row["uncertain"] for row in rows) / len(rows),
        "rows": rows,
    }
    path = round_dir / "score.json"
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key_: value for key_, value in output.items() if key_ != "rows"}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
