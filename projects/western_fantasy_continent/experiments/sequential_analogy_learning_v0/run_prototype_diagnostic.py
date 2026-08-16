from __future__ import annotations

import json
from pathlib import Path

from prototype_learner import ConsequencePrototypeLearner
from run_learning_curve import (
    ARTIFACTS,
    BATCH_SIZE,
    CachedEncoder,
    DATA,
    MAX_ROUNDS,
    MIN_SIMILARITY,
    SECRET,
    read_jsonl,
    score_predictions,
    verify_manifest,
)


def main() -> None:
    output_path = ARTIFACTS / "prototype_diagnostic_on_exposed_eval.json"
    if output_path.exists():
        raise RuntimeError("prototype diagnostic already exists")
    manifest = verify_manifest()
    learn = read_jsonl(DATA / "learn_ideal_records.jsonl")
    queries = read_jsonl(DATA / "eval_ideal_queries.jsonl")
    gold = read_jsonl(SECRET / "eval_gold.jsonl")
    encoder = CachedEncoder()
    learner = ConsequencePrototypeLearner(encoder, min_similarity=MIN_SIMILARITY)
    fixed100 = ConsequencePrototypeLearner(encoder, min_similarity=MIN_SIMILARITY)
    rounds = []
    for round_index in range(MAX_ROUNDS):
        start = round_index * BATCH_SIZE
        end = start + BATCH_SIZE
        learner.observe(learn[start:end])
        if round_index == 0:
            fixed100.observe(learn[start:end])
        selected = score_predictions(learner.predict(queries[start:end]), gold[start:end])
        fixed = score_predictions(fixed100.predict(queries[start:end]), gold[start:end])
        row = {
            "round": round_index + 1,
            "memories": end,
            "prototypes": len(learner.prototypes),
            "selected": selected,
            "fixed100": fixed,
        }
        rounds.append(row)
        print(json.dumps({
            "round": row["round"], "memories": end, "prototypes": row["prototypes"],
            "selected": selected["summary"], "fixed100": fixed["summary"]["all"],
        }, ensure_ascii=False), flush=True)
    output = {
        "schema": "prototype_diagnostic_on_exposed_eval_v0",
        "status": "development_diagnostic_only_eval_was_already_exposed",
        "datasetManifest": manifest,
        "rounds": rounds,
        "final": rounds[-1]["selected"]["summary"],
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
