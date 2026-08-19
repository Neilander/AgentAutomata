from __future__ import annotations

import json
import sys
import tempfile
from collections import defaultdict
from pathlib import Path
from time import perf_counter

import numpy as np

from five_slot_memory import FiveSlotCoordinate as Q
from five_slot_memory import FiveSlotTrajectoryMemory
from gte_encoder import LocalGTEEncoder


HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
SOURCE = EXPERIMENTS / "sequential_analogy_learning_v0"
FINAL = SOURCE / "final_v1"
ARTIFACTS = HERE / "artifacts"


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def interaction_text(row: dict) -> str:
    parts = []
    for index, interaction in enumerate(row["interactions"], start=1):
        parts.append(
            f"第{index}步：{interaction['subject']}对{interaction.get('object') or '环境'}"
            f"产生{interaction['change']}"
        )
    return "；".join(parts)


def role_text(row: dict) -> str:
    subjects = sorted({item["subject"] for item in row["interactions"]})
    objects = sorted({item.get("object") for item in row["interactions"] if item.get("object")})
    description = row["slots"][0]["description"] if row.get("slots") else row["beforeNorm"]
    return (
        f"当前涉及{len(row.get('slots', []))}个对象；作用发起角色为{','.join(subjects)}；"
        f"作用承受角色为{','.join(objects) or '环境'}；对象关系为{description}"
    )


def current_q(row: dict, public: dict) -> Q:
    return Q(
        affected_object=role_text(row),
        change_trend=f"局面从{row['beforeNorm']}推进到{row['currentNorm']}",
        cause_relation=interaction_text(row),
        temporal_state="这些相互作用已经发生，但后续结果尚未观察",
        context=(
            f"真实事件的因果后果预测；原始公开局面是{public['before']}；"
            f"原始公开作用是{public['interactions']}"
        ),
    )


def following_q(effects: list[dict]) -> Q:
    affected = "；".join(
        f"{effect.get('slot') or effect.get('entity')}受到后果" for effect in effects
    )
    changes = "；".join(
        f"{effect.get('slot') or effect.get('entity')}的{effect.get('property', '状态')}"
        f"{effect.get('operation', '变为')}{effect['value']}" for effect in effects
    )
    return Q(
        affected_object=affected,
        change_trend=changes,
        cause_relation="由前述有向相互作用共同导致这些状态变化",
        temporal_state="后续结果已经发生并被观察",
        context="真实事件中已经观察到的因果后果",
    )


def family_lookup() -> dict[tuple[str, ...], str]:
    catalog = json.loads((SOURCE / "family_catalog.json").read_text(encoding="utf-8"))
    lookup: dict[tuple[str, ...], str] = {}
    for family in catalog:
        signature = tuple(effect["predicate"] for effect in family["effects"])
        if signature in lookup:
            raise ValueError(f"duplicate family effect signature: {signature}")
        lookup[signature] = family["family_id"]
    return lookup


def family_for_train(row: dict, lookup: dict[tuple[str, ...], str]) -> str:
    signature = tuple(effect["value"] for effect in row["effects"])
    if signature not in lookup:
        raise KeyError(f"cannot map train row {row['id']} to a family")
    return lookup[signature]


def normalized_gold_effects(query: dict, gold: dict) -> list[dict]:
    inverse = {entity: slot for slot, entity in query["bindings"].items()}
    rows = []
    for effect in gold["effects"]:
        slot = inverse.get(effect["entity"])
        if slot is None:
            raise KeyError(f"gold entity {effect['entity']} is not bound in {query['id']}")
        rows.append({"slot": slot, **{key: effect[key] for key in ("property", "operation", "value")}})
    return rows


def top_family(result) -> str | None:
    if result.abstained or not result.candidates:
        return None
    return result.candidates[0].metadata.get("familyId")


def summarize_family_recall(results, gold_rows: list[dict]) -> dict:
    buckets: dict[str, list[bool]] = defaultdict(list)
    scores: dict[str, list[float]] = defaultdict(list)
    for result, gold in zip(results, gold_rows):
        group = "unknown" if gold["familySplit"] == "unknown_only" else "known"
        predicted = top_family(result)
        buckets[group].append(predicted == gold["familyId"] if group == "known" else False)
        scores[group].append(result.best_score)
        if group == "known":
            buckets[f"subjects_{gold['subjectCount']}"] .append(predicted == gold["familyId"])
            buckets[f"interactions_{gold['interactionCount']}"] .append(predicted == gold["familyId"])
    summary = {}
    for name, values in buckets.items():
        summary[name] = {
            "cases": len(values),
            "correct": sum(values),
            "accuracy": sum(values) / len(values) if values else 0.0,
        }
    for name, values in scores.items():
        summary[f"{name}BestScore"] = {
            "mean": float(np.mean(values)),
            "min": float(np.min(values)),
            "max": float(np.max(values)),
        }
    return summary


def threshold_metrics(results, gold_rows: list[dict], threshold: float) -> dict:
    known_cases = known_correct = unknown_cases = unknown_correct = 0
    for result, gold in zip(results, gold_rows):
        answered = result.best_score >= threshold
        if gold["familySplit"] == "unknown_only":
            unknown_cases += 1
            unknown_correct += int(not answered)
        else:
            known_cases += 1
            known_correct += int(answered and top_family(result) == gold["familyId"])
    total = known_cases + unknown_cases
    correct = known_correct + unknown_correct
    return {
        "threshold": threshold,
        "all": {"cases": total, "correct": correct, "accuracy": correct / total},
        "known": {
            "cases": known_cases,
            "correct": known_correct,
            "accuracy": known_correct / known_cases,
        },
        "unknownReject": {
            "cases": unknown_cases,
            "correct": unknown_correct,
            "accuracy": unknown_correct / unknown_cases,
        },
    }


def main() -> None:
    learn = read_jsonl(FINAL / "data" / "learn_ideal_records.jsonl")
    learn_public_rows = read_jsonl(FINAL / "data" / "learn_public.jsonl")
    eval_queries = read_jsonl(FINAL / "data" / "eval_ideal_queries.jsonl")
    eval_public_rows = read_jsonl(FINAL / "data" / "eval_public.jsonl")
    eval_gold = read_jsonl(FINAL / "secret" / "eval_gold.jsonl")
    if not (
        len(learn) == len(learn_public_rows) == len(eval_queries)
        == len(eval_public_rows) == len(eval_gold) == 5000
    ):
        raise ValueError("expected frozen 5000/5000 dataset")
    learn_public = {row["id"]: row for row in learn_public_rows}
    eval_public = {row["id"]: row for row in eval_public_rows}
    gold_by_id = {row["id"]: row for row in eval_gold}
    ordered_gold = [gold_by_id[row["id"]] for row in eval_queries]
    lookup = family_lookup()

    encoder = LocalGTEEncoder()
    memory = FiveSlotTrajectoryMemory.new(encoder)
    build_started = perf_counter()
    for row in learn:
        family_id = family_for_train(row, lookup)
        memory.remember(
            current_q(row, learn_public[row["id"]]),
            following_q(row["effects"]),
            record_id=row["id"],
            metadata={"familyId": family_id},
        )
    # One batched warm-up encodes every memory slot and compiles the 5000×3840 matrix.
    memory._compile()
    build_seconds = perf_counter() - build_started

    replay_indices = np.linspace(0, len(learn) - 1, 500, dtype=int)
    replay_queries = [
        current_q(learn[index], learn_public[learn[index]["id"]]) for index in replay_indices
    ]
    replay_started = perf_counter()
    replay_results = memory.query_many(
        replay_queries, threshold=-1.0, top_k=5, chunk_size=64, candidate_pool=128
    )
    replay_seconds = perf_counter() - replay_started
    replay_correct = sum(
        result.candidates and result.candidates[0].record_id == learn[index]["id"]
        for result, index in zip(replay_results, replay_indices)
    )

    evaluation_limit = 1000
    selected_eval = eval_queries[:evaluation_limit]
    selected_gold = ordered_gold[:evaluation_limit]
    query_coordinates = [
        current_q(row, eval_public[row["id"]]) for row in selected_eval
    ]
    eval_started = perf_counter()
    eval_results = memory.query_many(
        query_coordinates, threshold=-1.0, top_k=5, score_band=0.12, chunk_size=64
    )
    eval_seconds = perf_counter() - eval_started
    full_summary = summarize_family_recall(eval_results, selected_gold)
    cached_started = perf_counter()
    cached_results = memory.query_many(
        query_coordinates, threshold=-1.0, top_k=5, score_band=0.12, chunk_size=64
    )
    cached_seconds = perf_counter() - cached_started
    cached_equal = [top_family(row) for row in cached_results] == [
        top_family(row) for row in eval_results
    ]

    dev_count = 200
    best_threshold = None
    best_dev = None
    for threshold in np.arange(0.78, 0.951, 0.005):
        metrics = threshold_metrics(eval_results[:dev_count], selected_gold[:dev_count], float(threshold))
        objective = (
            metrics["all"]["accuracy"],
            min(metrics["known"]["accuracy"], metrics["unknownReject"]["accuracy"]),
        )
        if best_dev is None or objective > best_dev[0]:
            best_dev = (objective, metrics)
            best_threshold = float(threshold)
    assert best_dev is not None and best_threshold is not None
    threshold_holdout = threshold_metrics(
        eval_results[dev_count:], selected_gold[dev_count:], best_threshold
    )

    baseline = FiveSlotTrajectoryMemory.new(encoder)
    for row in learn[:100]:
        baseline.remember(
            current_q(row, learn_public[row["id"]]),
            following_q(row["effects"]),
            record_id=row["id"],
            metadata={"familyId": family_for_train(row, lookup)},
        )
    # This control uses the same already-encoded texts; only its memory rows differ.
    baseline._text_vectors = memory._text_vectors
    baseline_started = perf_counter()
    baseline_results = baseline.query_many(
        query_coordinates, threshold=-1.0, top_k=5, score_band=0.12, chunk_size=128
    )
    baseline_seconds = perf_counter() - baseline_started
    baseline_summary = summarize_family_recall(baseline_results, selected_gold)

    persistence_started = perf_counter()
    with tempfile.TemporaryDirectory() as directory:
        store = Path(directory) / "memory-5000.json"
        memory.save(store, include_cache=True)
        store_bytes = store.stat().st_size
        cache_bytes = store.with_suffix(store.suffix + ".vectors.npz").stat().st_size
        restored = FiveSlotTrajectoryMemory.load(store, encoder)
        sample_coordinates = query_coordinates[:25]
        restored_results = restored.query_many(
            sample_coordinates, threshold=-1.0, top_k=5, chunk_size=25
        )
        persistence_equal = [top_family(row) for row in restored_results] == [
            top_family(row) for row in eval_results[:25]
        ]
        restored_count = len(restored)
    persistence_seconds = perf_counter() - persistence_started

    current_bytes = int(memory._current_matrix.nbytes) if memory._current_matrix is not None else 0
    following_bytes = int(memory._following_matrix.nbytes) if memory._following_matrix is not None else 0
    payload = {
        "schema": "five_slot_bulk_memory_validation_v0",
        "sourceDataset": "sequential_analogy_learning_v0/final_v1",
        "learningRecords": len(memory),
        "learningObservations": sum(row.observations for row in memory.records),
        "evaluationQueries": len(query_coordinates),
        "coordinateDimension": memory.coordinate_dimension,
        "buildSeconds": build_seconds,
        "matrixBytes": current_bytes + following_bytes,
        "exactReplay": {
            "cases": len(replay_indices),
            "correct": int(replay_correct),
            "accuracy": replay_correct / len(replay_indices),
            "seconds": replay_seconds,
        },
        "full5000Memory": {
            "firstQuerySecondsIncludingNewTextEncoding": eval_seconds,
            "cachedQuerySeconds": cached_seconds,
            "cachedPredictionsEqual": cached_equal,
            "summary": full_summary,
            "thresholdSelectedOnFirst200": best_dev[1],
            "thresholdHoldoutNext800": threshold_holdout,
        },
        "fixedFirst100Memory": {"seconds": baseline_seconds, "summary": baseline_summary},
        "persistence": {
            "savedBytes": store_bytes,
            "cacheBytes": cache_bytes,
            "restoredRecords": restored_count,
            "first25PredictionsEqual": persistence_equal,
            "secondsIncludingCacheWriteLoadAnd25Queries": persistence_seconds,
        },
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "bulk_validation.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if (
        replay_correct != len(replay_indices)
        or not persistence_equal
        or not cached_equal
        or restored_count != 5000
    ):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
