from __future__ import annotations

import argparse
import hashlib
import json
from collections import defaultdict
from pathlib import Path
from time import perf_counter

import numpy as np

from final_holdout import final_holdout_cases
from final_holdout_v1 import final_holdout_v1_cases
from fixtures import development_cases, holdout_cases, memory_trajectories
from run_experiment import encode_all, scale_test
from trajectory_memory_v1 import RobustTrajectoryMemory


HERE = Path(__file__).resolve().parent
ARTIFACTS = HERE / "artifacts"
FROZEN_FILES = ("trajectory_memory.py", "trajectory_memory_v1.py", "fixtures.py", "final_holdout_v1.py", "run_v1.py")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def label(result: dict) -> str | None:
    if result["abstained"]:
        return None
    votes = defaultdict(float)
    for row in result["selected"]:
        if row["inWinningCluster"]:
            votes[row["rememberedNextConcept"]] += row["weight"]
    return max(votes, key=votes.get) if votes else None


def run_cases(memory: RobustTrajectoryMemory, cases: list[dict], query: dict) -> dict:
    rows = []
    for case in cases:
        result = memory.query(case["previous"], case["current"], **query)
        predicted = label(result)
        if case["kind"] == "positive":
            correct = predicted == case["expected"]
        elif case["kind"] == "negative":
            correct = result["abstained"] or predicted == "no_followup"
        else:
            correct = result["abstained"]
        rows.append({
            "id": case["id"], "kind": case["kind"], "group": case["group"],
            "expected": case["expected"], "predicted": predicted, "correct": correct,
            "abstained": result["abstained"], "bestScore": result["bestScore"],
            "evidenceScore": result["evidenceScore"], "confidence": result["confidence"],
            "rawConfidence": result.get("rawConfidence"),
            "uncertaintyDominance": result.get("uncertaintyDominance"),
            "uncertaintyClusterCount": result.get("uncertaintyClusterCount"),
            "selected": result["selected"],
        })
    groups = {}
    kinds = {}
    for row in rows:
        for buckets, key in ((groups, row["group"]), (kinds, row["kind"])):
            bucket = buckets.setdefault(key, {"cases": 0, "correct": 0})
            bucket["cases"] += 1
            bucket["correct"] += int(row["correct"])
    for buckets in (groups, kinds):
        for bucket in buckets.values():
            bucket["accuracy"] = bucket["correct"] / bucket["cases"]
    return {"cases": len(rows), "correct": sum(row["correct"] for row in rows),
            "accuracy": sum(row["correct"] for row in rows) / len(rows),
            "groups": groups, "kinds": kinds, "rows": rows}


def calibrate() -> None:
    base = json.loads((ARTIFACTS / "frozen_config.json").read_text(encoding="utf-8"))
    trajectories = memory_trajectories()
    cases = development_cases() + holdout_cases() + final_holdout_cases()
    vectors = encode_all(trajectories, cases)
    memory = RobustTrajectoryMemory(trajectories, vectors, **base["memoryConfig"])
    base_query = base["queryConfig"]
    best = None
    trial_count = 0
    for uncertainty_cluster_threshold in (0.58, 0.68, 0.78):
        for uncertainty_direction_weight in (0.25, 0.5, 0.75):
            for confidence_threshold in (0.0, 0.005, 0.01, 0.02, 0.03, 0.05, 0.075):
                query = {**base_query, "confidence_threshold": confidence_threshold,
                         "uncertainty_cluster_threshold": uncertainty_cluster_threshold,
                         "uncertainty_direction_weight": uncertainty_direction_weight}
                result = run_cases(memory, cases, query)
                trial_count += 1
                class_balanced = float(np.mean([bucket["accuracy"] for bucket in result["kinds"].values()]))
                macro = float(np.mean([bucket["accuracy"] for bucket in result["groups"].values()]))
                positive = result["kinds"]["positive"]["accuracy"]
                key = (class_balanced, positive, macro, result["accuracy"])
                if best is None or key > best[0]:
                    best = (key, query, result)
    frozen = {
        "schema": "hard_trajectory_memory_frozen_config_v1",
        "calibrationCases": len(cases), "trialCount": trial_count,
        "memoryConfig": base["memoryConfig"], "queryConfig": best[1],
        "calibrationMetrics": {key: value for key, value in best[2].items() if key != "rows"},
        "frozenHashes": {name: digest(HERE / name) for name in FROZEN_FILES},
    }
    (ARTIFACTS / "frozen_config_v1.json").write_text(json.dumps(frozen, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(frozen, ensure_ascii=False, indent=2))


def exact_replay(memory: RobustTrajectoryMemory, query: dict) -> dict:
    correct = 0
    for segment in memory.segments:
        result = memory.query(segment.previous_text, segment.current_text, **query)
        correct += int(label(result) == segment.next_concept)
    return {"cases": len(memory.segments), "correct": correct, "accuracy": correct / len(memory.segments)}


def conflict_test(trajectories: list[dict], vectors: dict, memory_config: dict, query: dict) -> dict:
    det = next(row for row in trajectories if row["id"] == "detonate-0")
    quiet = next(row for row in trajectories if row["id"] == "quiet-0")
    output = {}
    for name, (det_count, quiet_count) in (("consistent", (8, 0)), ("majority", (6, 2)), ("balanced", (4, 4))):
        rows = []
        for index in range(det_count):
            rows.append({"id": f"{name}-det-{index}", "states": det["states"][:3]})
        for index in range(quiet_count):
            rows.append({"id": f"{name}-quiet-{index}", "states": [det["states"][0], det["states"][1], quiet["states"][2]]})
        memory = RobustTrajectoryMemory(rows, vectors, **memory_config)
        result = memory.query(det["states"][0]["text"], det["states"][1]["text"], **query)
        output[name] = {"predicted": label(result), "abstained": result["abstained"],
                        "confidence": result["confidence"], "rawConfidence": result["rawConfidence"],
                        "dominance": result["uncertaintyDominance"],
                        "uncertaintyClusters": result["uncertaintyClusterCount"]}
    output["passed"] = (output["consistent"]["confidence"] > output["majority"]["confidence"]
                        > output["balanced"]["confidence"]
                        and output["balanced"]["uncertaintyClusters"] >= 2)
    return output


def evidence_test(trajectories: list[dict], vectors: dict, memory_config: dict, query: dict) -> dict:
    case = final_holdout_cases()[0]
    output = {}
    for name, rows in (("oneEpisode", [next(row for row in trajectories if row["id"] == "detonate-0")]),
                       ("fiveEpisodes", [row for row in trajectories if row["id"].startswith("detonate-")])):
        memory = RobustTrajectoryMemory(rows, vectors, **memory_config)
        result = memory.query(case["previous"], case["current"], **query)
        output[name] = {"predicted": label(result), "abstained": result["abstained"],
                        "evidenceScore": result["evidenceScore"], "confidence": result["confidence"]}
    output["passed"] = output["oneEpisode"]["abstained"] and output["fiveEpisodes"]["predicted"] == "detonated"
    return output


def multi_step(memory: RobustTrajectoryMemory, cases: list[dict], vectors: dict, query: dict) -> dict:
    plans = {
        "v1-det-1": ["detonated", "blast_damage"],
        "v1-switch-1": ["switch_activated", "door_open"],
        "v1-melt-1": ["melted", "puddle_formed"],
        "v1-card-1": ["event_revealed", "marker_placed"],
        "v1-nonce-1": ["fluff_black", "ring_rotating"],
        "v1-poison-1": ["health_reduced", "collapsed"],
    }
    lookup = {row["id"]: row for row in cases}
    rows = []
    for identifier, expected in plans.items():
        case = lookup[identifier]
        first = memory.query(case["previous"], case["current"], **query)
        second = memory.query(vectors[case["current"]], first["prediction"], **query) if not first["abstained"] else None
        predicted = [label(first), label(second) if second else None]
        rows.append({"id": identifier, "expected": expected, "predicted": predicted, "correct": predicted == expected})
    return {"cases": len(rows), "correct": sum(row["correct"] for row in rows), "rows": rows}


def evaluate() -> None:
    result_path = ARTIFACTS / "frozen_results_v1.json"
    if result_path.exists():
        raise RuntimeError("v1 frozen holdout already evaluated")
    frozen = json.loads((ARTIFACTS / "frozen_config_v1.json").read_text(encoding="utf-8"))
    actual = {name: digest(HERE / name) for name in frozen["frozenHashes"]}
    if actual != frozen["frozenHashes"]:
        raise RuntimeError("v1 frozen hash mismatch")
    started = perf_counter()
    trajectories = memory_trajectories()
    cases = final_holdout_v1_cases()
    # Include old diagnostics only so auxiliary evidence queries have vectors;
    # final labels are never used for parameter selection here.
    vectors = encode_all(trajectories, cases + final_holdout_cases())
    memory = RobustTrajectoryMemory(trajectories, vectors, **frozen["memoryConfig"])
    single = run_cases(memory, cases, frozen["queryConfig"])
    output = {
        "schema": "hard_trajectory_memory_frozen_evaluation_v1",
        "config": frozen,
        "singleStep": single,
        "exactReplay": exact_replay(memory, frozen["queryConfig"]),
        "multiStep": multi_step(memory, cases, vectors, frozen["queryConfig"]),
        "conflict": conflict_test(trajectories, vectors, frozen["memoryConfig"], frozen["queryConfig"]),
        "evidenceAccumulation": evidence_test(trajectories, vectors, frozen["memoryConfig"], frozen["queryConfig"]),
        "scale": scale_test(memory, cases[0]["previous"], cases[0]["current"]),
        "elapsedSeconds": perf_counter() - started,
    }
    result_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    compact = {**output, "singleStep": {key: value for key, value in single.items() if key != "rows"}}
    print(json.dumps(compact, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("mode", choices=("calibrate", "evaluate"))
    args = parser.parse_args()
    calibrate() if args.mode == "calibrate" else evaluate()


if __name__ == "__main__":
    main()

