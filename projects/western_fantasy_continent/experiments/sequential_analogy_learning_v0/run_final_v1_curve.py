from __future__ import annotations

import hashlib
import json
from pathlib import Path

from prototype_learner import ConsequencePrototypeLearner
from run_learning_curve import BATCH_SIZE, CachedEncoder, MAX_ROUNDS, read_jsonl, score_predictions, stop_reached


HERE = Path(__file__).resolve().parent
ROOT = HERE / "final_v1"
DATA = ROOT / "data"
SECRET = ROOT / "secret"
ARTIFACTS = ROOT / "artifacts"
SELECTED_THRESHOLD = 0.855


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def verify() -> dict:
    manifest = json.loads((ARTIFACTS / "dataset_manifest.json").read_text(encoding="utf-8"))
    for relative, expected in manifest["hashes"].items():
        path = HERE / relative
        if digest(path) != expected:
            raise RuntimeError(f"hash mismatch: {relative}")
    uniqueness = json.loads((ARTIFACTS / "surface_uniqueness.json").read_text(encoding="utf-8"))
    if uniqueness["trainUnique"] != 5000 or uniqueness["evalUnique"] != 5000:
        raise RuntimeError("surface uniqueness audit failed")
    return manifest


def main() -> None:
    output_path = ARTIFACTS / "frozen_curve.json"
    if output_path.exists():
        raise RuntimeError("final v1 curve already evaluated")
    manifest = verify()
    learn = read_jsonl(DATA / "learn_ideal_records.jsonl")
    queries = read_jsonl(DATA / "eval_ideal_queries.jsonl")
    gold = read_jsonl(SECRET / "eval_gold.jsonl")
    encoder = CachedEncoder()
    learner = ConsequencePrototypeLearner(encoder, min_similarity=SELECTED_THRESHOLD)
    fixed100 = ConsequencePrototypeLearner(encoder, min_similarity=SELECTED_THRESHOLD)
    rounds = []
    for round_index in range(MAX_ROUNDS):
        start = round_index * BATCH_SIZE
        end = start + BATCH_SIZE
        learner.observe(learn[start:end])
        if round_index == 0:
            fixed100.observe(learn[start:end])
        selected = score_predictions(learner.predict(queries[start:end]), gold[start:end])
        fixed = score_predictions(fixed100.predict(queries[start:end]), gold[start:end])
        rounds.append({
            "round": round_index + 1, "memories": end,
            "prototypes": len(learner.prototypes), "selected": selected, "fixed100": fixed,
        })
        print(json.dumps({
            "round": round_index + 1, "memories": end,
            "all": selected["summary"]["all"],
            "answerable": selected["summary"]["answerable"],
            "unknown": selected["summary"]["unknown"],
            "fixed100": fixed["summary"]["all"],
        }, ensure_ascii=False), flush=True)
        if stop_reached(rounds):
            break
    output = {
        "schema": "sequential_analogy_final_v1_curve",
        "status": "frozen_ideal_parser_prototype_curve",
        "importantLimitation": "exact observed consequence signatures form prototypes; this is not raw-language Agent performance",
        "manifest": manifest,
        "threshold": SELECTED_THRESHOLD,
        "thresholdSource": "pilot_v0 exposed development; frozen before final_v1 materialization",
        "stoppedEarly": len(rounds) < MAX_ROUNDS,
        "stopCriterionMet": stop_reached(rounds),
        "stopMemories": rounds[-1]["memories"],
        "rounds": rounds,
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
