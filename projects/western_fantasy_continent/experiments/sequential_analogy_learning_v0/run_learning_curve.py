from __future__ import annotations

import hashlib
import json
import math
import random
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402
from episodic_learner import EpisodicAnalogyLearner, Prediction  # noqa: E402


DATA = HERE / "data"
SECRET = HERE / "secret"
ARTIFACTS = HERE / "artifacts"
BATCH_SIZE = 100
MAX_ROUNDS = 50
STABLE_ROUNDS = 5
TARGET_ACCURACY = 0.80
# Reused without looking at this experiment's eval pool. The previous frozen
# analogy experiment selected 0.89 for normalized-transition retrieval.
MIN_SIMILARITY = 0.89


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


class CachedEncoder:
    def __init__(self) -> None:
        self.runtime = GTERuntime()
        self.cache: dict[str, np.ndarray] = {}

    def __call__(self, texts: list[str]) -> np.ndarray:
        missing = list(dict.fromkeys(text for text in texts if text not in self.cache))
        if missing:
            vectors = self.runtime.encode(missing, batch_size=32)
            self.cache.update({text: vectors[index] for index, text in enumerate(missing)})
        return np.stack([self.cache[text] for text in texts])


def effect_key(effects: list[dict]) -> tuple[tuple[str, str, str, str], ...]:
    return tuple(sorted(
        (effect["entity"], effect["property"], effect["operation"], str(effect["value"]))
        for effect in effects
    ))


def wilson(successes: int, total: int) -> tuple[float, float]:
    if total == 0:
        return (0.0, 0.0)
    z = 1.959963984540054
    proportion = successes / total
    denominator = 1.0 + z * z / total
    center = (proportion + z * z / (2 * total)) / denominator
    spread = z * math.sqrt(proportion * (1 - proportion) / total + z * z / (4 * total * total)) / denominator
    return (center - spread, center + spread)


def score_predictions(predictions: list[Prediction], gold: list[dict]) -> dict:
    rows = []
    buckets = defaultdict(lambda: [0, 0])
    for prediction, expected in zip(predictions, gold, strict=True):
        unknown = expected["familySplit"] == "unknown_only"
        if unknown:
            correct = prediction.abstained
        else:
            correct = (not prediction.abstained and effect_key(prediction.effects) == effect_key(expected["effects"]))
        row = {
            "id": expected["id"],
            "familyId": expected["familyId"],
            "familySplit": expected["familySplit"],
            "subjectCount": expected["subjectCount"],
            "interactionCount": expected["interactionCount"],
            "correct": correct,
            "abstained": prediction.abstained,
            "similarity": prediction.similarity,
            "voteMargin": prediction.vote_margin,
            "sourceIds": prediction.source_ids,
            "predictedEffects": prediction.effects,
            "goldEffects": expected["effects"],
        }
        rows.append(row)
        names = [
            "all",
            "unknown" if unknown else "answerable",
            f"subjects_{expected['subjectCount']}",
            f"interactions_{expected['interactionCount']}",
        ]
        for name in names:
            buckets[name][0] += int(correct)
            buckets[name][1] += 1
    summary = {}
    for name, (correct, total) in buckets.items():
        low, high = wilson(correct, total)
        summary[name] = {
            "correct": correct, "cases": total, "accuracy": correct / total,
            "wilson95": [low, high],
        }
    return {"summary": summary, "rows": rows}


def random_predictions(memory: list[dict], queries: list[dict], seed: int) -> list[Prediction]:
    rng = random.Random(seed)
    output = []
    for query in queries:
        candidates = [row for row in memory if all(effect["slot"] in query["bindings"] for effect in row["effects"])]
        source = rng.choice(candidates)
        effects = [
            {
                "entity": query["bindings"][effect["slot"]],
                "property": effect["property"],
                "operation": effect["operation"],
                "value": effect["value"],
            }
            for effect in source["effects"]
        ]
        output.append(Prediction(query["id"], False, None, effects, [source["id"]], 0.0, 0.0))
    return output


def stop_reached(rounds: list[dict]) -> bool:
    if len(rounds) < STABLE_ROUNDS:
        return False
    recent = rounds[-STABLE_ROUNDS:]
    accuracies = [row["selected"]["summary"]["all"]["accuracy"] for row in recent]
    combined_correct = sum(row["selected"]["summary"]["all"]["correct"] for row in recent)
    combined_total = STABLE_ROUNDS * BATCH_SIZE
    answerable_correct = sum(row["selected"]["summary"]["answerable"]["correct"] for row in recent)
    answerable_total = sum(row["selected"]["summary"]["answerable"]["cases"] for row in recent)
    unknown_correct = sum(row["selected"]["summary"]["unknown"]["correct"] for row in recent)
    unknown_total = sum(row["selected"]["summary"]["unknown"]["cases"] for row in recent)
    return (
        min(accuracies) >= TARGET_ACCURACY
        and combined_correct / combined_total >= TARGET_ACCURACY
        and answerable_correct / answerable_total >= TARGET_ACCURACY
        and unknown_correct / unknown_total >= 0.70
    )


def verify_manifest() -> dict:
    manifest_path = ARTIFACTS / "dataset_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    for relative, expected in manifest["hashes"].items():
        actual = digest(HERE / relative)
        if actual != expected:
            raise RuntimeError(f"dataset hash mismatch: {relative}")
    return manifest


def main() -> None:
    output_path = ARTIFACTS / "ideal_parser_learning_curve.json"
    if output_path.exists():
        raise RuntimeError("learning curve already exists; do not overwrite a frozen run")
    manifest = verify_manifest()
    learn = read_jsonl(DATA / "learn_ideal_records.jsonl")
    queries = read_jsonl(DATA / "eval_ideal_queries.jsonl")
    gold = read_jsonl(SECRET / "eval_gold.jsonl")
    if not (len(learn) == len(queries) == len(gold) == 5000):
        raise RuntimeError("expected 5000 learn/query/gold rows")
    if set(row["id"] for row in learn) & set(row["id"] for row in queries):
        raise RuntimeError("learn/eval id overlap")

    encoder = CachedEncoder()
    selected = EpisodicAnalogyLearner(
        encoder, top_k=9, min_similarity=MIN_SIMILARITY,
    )
    top1 = EpisodicAnalogyLearner(
        encoder, top_k=1, min_similarity=MIN_SIMILARITY,
    )
    fixed100 = EpisodicAnalogyLearner(
        encoder, top_k=9, min_similarity=MIN_SIMILARITY,
    )
    rounds = []
    cumulative_memory: list[dict] = []
    for round_index in range(MAX_ROUNDS):
        start = round_index * BATCH_SIZE
        end = start + BATCH_SIZE
        train_batch = learn[start:end]
        query_batch = queries[start:end]
        gold_batch = gold[start:end]
        selected.observe(train_batch)
        top1.observe(train_batch)
        if round_index == 0:
            fixed100.observe(train_batch)
        cumulative_memory.extend(train_batch)
        selected_score = score_predictions(selected.predict(query_batch), gold_batch)
        top1_score = score_predictions(top1.predict(query_batch), gold_batch)
        fixed_score = score_predictions(fixed100.predict(query_batch), gold_batch)
        random_score = score_predictions(
            random_predictions(cumulative_memory, query_batch, SEED_FOR_RANDOM + round_index), gold_batch
        )
        row = {
            "round": round_index + 1,
            "memories": end,
            "selected": selected_score,
            "top1": top1_score,
            "fixed100": fixed_score,
            "randomMemory": random_score,
        }
        rounds.append(row)
        compact = {
            "round": round_index + 1,
            "memories": end,
            "selected": selected_score["summary"],
            "top1": top1_score["summary"]["all"],
            "fixed100": fixed_score["summary"]["all"],
            "random": random_score["summary"]["all"],
        }
        print(json.dumps(compact, ensure_ascii=False), flush=True)
        if stop_reached(rounds):
            break

    output = {
        "schema": "sequential_analogy_ideal_parser_curve_v0",
        "status": "ideal_parser_upper_bound_not_formal_agent_reader",
        "datasetManifest": manifest,
        "config": {
            "batchSize": BATCH_SIZE,
            "maxMemories": 5000,
            "topK": 9,
            "minSimilarity": MIN_SIMILARITY,
            "thresholdSource": "previous frozen normalized-transition experiment",
            "stableRounds": STABLE_ROUNDS,
            "targetAccuracy": TARGET_ACCURACY,
        },
        "stoppedEarly": len(rounds) < MAX_ROUNDS,
        "stopMemories": rounds[-1]["memories"],
        "stopCriterionMet": stop_reached(rounds),
        "rounds": rounds,
        "encoderCacheEntries": len(encoder.cache),
    }
    output_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({key: value for key, value in output.items() if key != "rounds"}, ensure_ascii=False, indent=2))


SEED_FOR_RANDOM = 0xBAD5EED


if __name__ == "__main__":
    main()
