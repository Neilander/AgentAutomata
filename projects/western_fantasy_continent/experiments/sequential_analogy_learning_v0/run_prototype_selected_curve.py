from __future__ import annotations

import json

from prototype_learner import ConsequencePrototypeLearner
from run_learning_curve import (
    ARTIFACTS,
    BATCH_SIZE,
    CachedEncoder,
    DATA,
    MAX_ROUNDS,
    SECRET,
    read_jsonl,
    score_predictions,
    stop_reached,
    verify_manifest,
)


SELECTED_THRESHOLD = 0.855


def main() -> None:
    output_path = ARTIFACTS / "prototype_selected_curve_on_exposed_eval.json"
    if output_path.exists():
        raise RuntimeError("selected prototype curve already exists")
    manifest = verify_manifest()
    learn = read_jsonl(DATA / "learn_ideal_records.jsonl")
    queries = read_jsonl(DATA / "eval_ideal_queries.jsonl")
    gold = read_jsonl(SECRET / "eval_gold.jsonl")
    encoder = CachedEncoder()
    learner = ConsequencePrototypeLearner(encoder, min_similarity=SELECTED_THRESHOLD)
    rounds = []
    for round_index in range(MAX_ROUNDS):
        start = round_index * BATCH_SIZE
        end = start + BATCH_SIZE
        learner.observe(learn[start:end])
        selected = score_predictions(learner.predict(queries[start:end]), gold[start:end])
        rounds.append({
            "round": round_index + 1, "memories": end,
            "prototypes": len(learner.prototypes), "selected": selected,
        })
        print(json.dumps({
            "round": round_index + 1, "memories": end,
            "all": selected["summary"]["all"],
            "answerable": selected["summary"]["answerable"],
            "unknown": selected["summary"]["unknown"],
        }, ensure_ascii=False), flush=True)
        if stop_reached(rounds):
            break
    output = {
        "schema": "prototype_selected_curve_exposed_v0",
        "status": "development_only_threshold_tuned_on_exposed_eval",
        "datasetManifest": manifest,
        "threshold": SELECTED_THRESHOLD,
        "stoppedEarly": len(rounds) < MAX_ROUNDS,
        "stopCriterionMet": stop_reached(rounds),
        "stopMemories": rounds[-1]["memories"],
        "rounds": rounds,
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
