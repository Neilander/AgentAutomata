from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
from collections import defaultdict
from pathlib import Path
from time import perf_counter

import numpy as np

HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402
from analogy_memory import MODES, AnalogyMemory, collect_representation_texts, safe_render  # noqa: E402
from fixtures import development_cases, final_cases, source_trajectories  # noqa: E402


ARTIFACTS = HERE / "artifacts"
FROZEN_FILES = ("analogy_memory.py", "fixtures.py", "run_experiment.py")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def encode(sources: list[dict], cases: list[dict]) -> dict[str, np.ndarray]:
    texts = collect_representation_texts(sources, cases)
    matrix = GTERuntime().encode(texts, batch_size=24)
    return {text: matrix[index] for index, text in enumerate(texts)}


def expected_effects(case: dict, source_by_id: dict[str, dict]) -> list[dict]:
    if case["expectedFamily"] is None:
        return []
    source = source_by_id[case["expectedFamily"]]
    return [{"entity": case["bindings"].get(effect["slot"], f"<未绑定:{effect['slot']}>") ,
             "change": effect["change"]} for effect in source["effects"]]


def evaluate_cases(memory: AnalogyMemory, cases: list[dict], sources: list[dict], threshold: float) -> dict:
    source_by_id = {row["id"]: row for row in sources}
    rows = []
    for case in cases:
        result = memory.query(case, threshold=threshold)
        if case["kind"] == "unknown":
            correct = result.abstained
            grounded = result.abstained
            unbound_grounded = False
            expected_text = None
        else:
            expected_source = source_by_id[case["expectedFamily"]]
            expected_text = safe_render(expected_source["nextTemplate"], case["bindings"])
            correct = (not result.abstained and result.source_id == case["expectedFamily"]
                       and result.predicted_effects == expected_effects(case, source_by_id))
            grounded = correct and result.predicted_text == expected_text
            target_names = set(case["bindings"].values())
            unbound_grounded = bool(target_names) and target_names.issubset(set(
                name for name in target_names if name in expected_source["nextRaw"]
            ))
        rows.append({
            "id": case["id"], "kind": case["kind"], "group": case["group"],
            "expectedFamily": case["expectedFamily"], "predictedFamily": result.source_id,
            "score": result.score, "abstained": result.abstained, "correct": correct,
            "predictedText": result.predicted_text, "expectedText": expected_text,
            "predictedEffects": result.predicted_effects,
            "targetGrounded": grounded, "unboundSourceTextGrounded": unbound_grounded,
            "topSources": result.top_sources,
        })
    groups = defaultdict(lambda: {"cases": 0, "correct": 0})
    kinds = defaultdict(lambda: {"cases": 0, "correct": 0})
    for row in rows:
        for buckets, key in ((groups, row["group"]), (kinds, row["kind"])):
            buckets[key]["cases"] += 1
            buckets[key]["correct"] += int(row["correct"])
    for buckets in (groups, kinds):
        for bucket in buckets.values():
            bucket["accuracy"] = bucket["correct"] / bucket["cases"]
    known = [row for row in rows if row["kind"] == "known"]
    return {
        "cases": len(rows), "correct": sum(row["correct"] for row in rows),
        "accuracy": sum(row["correct"] for row in rows) / len(rows),
        "knownAccuracy": sum(row["correct"] for row in known) / len(known),
        "targetGroundingAccuracy": sum(row["targetGrounded"] for row in known) / len(known),
        "unboundSourceTextGroundingAccuracy": sum(row["unboundSourceTextGrounded"] for row in known) / len(known),
        "groups": dict(groups), "kinds": dict(kinds), "rows": rows,
    }


def calibrate() -> None:
    sources = source_trajectories()
    cases = development_cases()
    vectors = encode(sources, cases)
    per_mode = {}
    winner = None
    for mode in MODES:
        memory = AnalogyMemory(sources, mode, vectors)
        best = None
        for threshold in np.arange(0.25, 0.91, 0.01):
            result = evaluate_cases(memory, cases, sources, float(threshold))
            known = result["kinds"]["known"]["accuracy"]
            unknown = result["kinds"]["unknown"]["accuracy"]
            group_macro = float(np.mean([bucket["accuracy"] for bucket in result["groups"].values()]))
            balanced = 0.5 * (known + unknown)
            key = (balanced, group_macro, known, result["accuracy"])
            if best is None or key > best[0]:
                best = (key, float(threshold), result)
        per_mode[mode] = {
            "threshold": best[1],
            "development": {key: value for key, value in best[2].items() if key != "rows"},
        }
        winner_key = (best[0], mode == "normalized_transition")
        if winner is None or winner_key > winner[0]:
            winner = (winner_key, mode)
    frozen = {
        "schema": "analogical_transfer_frozen_config_v0",
        "sources": len(sources), "developmentCases": len(cases),
        "selectedMode": winner[1], "modes": per_mode,
        "frozenHashes": {name: digest(HERE / name) for name in FROZEN_FILES},
    }
    ARTIFACTS.mkdir(exist_ok=True)
    (ARTIFACTS / "frozen_config.json").write_text(json.dumps(frozen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(frozen, ensure_ascii=False, indent=2))


def evaluate() -> None:
    result_path = ARTIFACTS / "frozen_results.json"
    if result_path.exists():
        raise RuntimeError("frozen analogy holdout already evaluated")
    frozen = json.loads((ARTIFACTS / "frozen_config.json").read_text(encoding="utf-8"))
    actual = {name: digest(HERE / name) for name in frozen["frozenHashes"]}
    if actual != frozen["frozenHashes"]:
        raise RuntimeError(f"frozen hash mismatch: {actual}")
    sources = source_trajectories()
    cases = final_cases()
    vectors = encode(sources, cases)
    started = perf_counter()
    modes = {}
    for mode in MODES:
        memory = AnalogyMemory(sources, mode, vectors)
        modes[mode] = evaluate_cases(memory, cases, sources, frozen["modes"][mode]["threshold"])
    selected = modes[frozen["selectedMode"]]
    output = {
        "schema": "analogical_transfer_frozen_evaluation_v0",
        "frozenConfig": frozen,
        "finalCases": len(cases),
        "selectedMode": frozen["selectedMode"],
        "selected": selected,
        "modeAblation": {mode: {key: value for key, value in result.items() if key != "rows"}
                         for mode, result in modes.items()},
        "matrixShape": [len(sources), 768],
        "runtimeSourceLoop": False,
        "elapsedAfterEncodingSeconds": perf_counter() - started,
    }
    result_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    compact = {**output, "selected": {key: value for key, value in selected.items() if key != "rows"}}
    print(json.dumps(compact, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("calibrate", "evaluate"))
    args = parser.parse_args()
    calibrate() if args.mode == "calibrate" else evaluate()


if __name__ == "__main__":
    main()

