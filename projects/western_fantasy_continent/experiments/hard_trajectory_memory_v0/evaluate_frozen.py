from __future__ import annotations

import hashlib
import json
from collections import defaultdict
from pathlib import Path
from time import perf_counter

import numpy as np

from final_holdout import final_holdout_cases
from fixtures import development_cases, holdout_cases, memory_trajectories
from run_experiment import encode_all, evidence_test, run_cases, scale_test
from trajectory_memory import HardTrajectoryMemory, unit


HERE = Path(__file__).resolve().parent


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def retrieved_label(result: dict) -> str | None:
    votes: dict[str | None, float] = defaultdict(float)
    for row in result["selected"]:
        if row["inWinningCluster"]:
            votes[row["rememberedNextConcept"]] += row["weight"]
    return max(votes, key=votes.get) if votes else None


def rollout_test(memory: HardTrajectoryMemory, cases: list[dict], vectors: dict[str, np.ndarray], query: dict) -> dict:
    sequences = {
        "p-det-1": ["detonated", "blast_damage"],
        "p-switch-1": ["switch_activated", "door_open"],
        "p-melt-1": ["melted", "puddle_formed"],
        "p-break-1": ["barrier_broken", "passage_open"],
        "p-card-1": ["event_revealed", "marker_placed"],
        "p-nonce-1": ["fluff_black", "ring_rotating"],
        "p-poison-1": ["health_reduced", "collapsed"],
    }
    by_id = {row["id"]: row for row in cases}
    rows = []
    for identifier, expected in sequences.items():
        case = by_id[identifier]
        first = memory.query(case["previous"], case["current"], **query)
        labels = [retrieved_label(first)]
        second = {"abstained": True, "selected": []}
        if not first["abstained"]:
            second = memory.query(vectors[case["current"]], first["prediction"], **query)
            labels.append(retrieved_label(second))
        else:
            labels.append(None)
        rows.append({"id": identifier, "expected": expected, "predicted": labels,
                     "correct": labels == expected, "step2Evidence": second.get("evidenceScore")})
    return {"cases": len(rows), "correct": sum(row["correct"] for row in rows), "rows": rows}


def exact_replay_test(memory: HardTrajectoryMemory, query: dict) -> dict:
    correct = 0
    rows = []
    for segment in memory.segments:
        result = memory.query(segment.previous_text, segment.current_text, **query)
        predicted = retrieved_label(result)
        good = predicted == segment.next_concept
        correct += int(good)
        if not good:
            rows.append({"trajectoryId": segment.trajectory_id, "stepIndex": segment.step_index,
                         "expected": segment.next_concept, "predicted": predicted})
    return {"cases": len(memory.segments), "correct": correct, "accuracy": correct / len(memory.segments),
            "failures": rows}


def conflict_test(trajectories: list[dict], vectors: dict[str, np.ndarray], config: dict, query: dict) -> dict:
    det = next(row for row in trajectories if row["id"] == "detonate-0")
    quiet = next(row for row in trajectories if row["id"] == "quiet-0")

    def copies(detonations: int, quiets: int) -> list[dict]:
        rows = []
        for index in range(detonations):
            rows.append({"id": f"conflict-det-{index}", "states": det["states"][:3]})
        for index in range(quiets):
            rows.append({"id": f"conflict-quiet-{index}", "states": [det["states"][0], det["states"][1], quiet["states"][2]]})
        return rows

    output = {}
    for name, counts in (("consistent", (8, 0)), ("majority", (6, 2)), ("balanced", (4, 4))):
        test_memory = HardTrajectoryMemory(copies(*counts), vectors, **config)
        result = test_memory.query(det["states"][0]["text"], det["states"][1]["text"], **query)
        output[name] = {"predicted": retrieved_label(result), "confidence": result["confidence"],
                        "clusterMass": result.get("clusterMass"), "clusterCount": result.get("clusterCount"),
                        "evidenceCount": result.get("evidenceCount")}
    output["passed"] = (
        output["consistent"]["predicted"] == "detonated"
        and output["majority"]["predicted"] == "detonated"
        and output["consistent"]["confidence"] > output["majority"]["confidence"] > output["balanced"]["confidence"]
        and output["balanced"]["clusterCount"] >= 2
    )
    return output


def cross_trajectory_test(trajectories: list[dict], vectors: dict[str, np.ndarray], config: dict, query: dict) -> dict:
    split = []
    for source in [row for row in trajectories if row["id"].startswith("switch-")]:
        split.append({"id": f"first-{source['id']}", "states": source["states"][:3]})
        split.append({"id": f"second-{source['id']}", "states": source["states"][1:4]})
    memory = HardTrajectoryMemory(split, vectors, **config)
    previous = "货箱靠近没亮的重量按钮，远端舱门关闭。"
    current = "货箱移上按钮并压住它，按钮暂时未亮。"
    first = memory.query(previous, current, **query)
    second = memory.query(vectors[current], first["prediction"], **query) if not first["abstained"] else {"selected": []}
    first_label, second_label = retrieved_label(first), retrieved_label(second)
    second_sources = [row["trajectoryId"] for row in second.get("selected", []) if row["inWinningCluster"]]
    return {"predicted": [first_label, second_label], "secondSources": second_sources,
            "passed": first_label == "switch_activated" and second_label == "door_open"
                      and any(source.startswith("second-") for source in second_sources)}


def matrix_equivalence(memory: HardTrajectoryMemory, vectors: dict[str, np.ndarray], case: dict) -> dict:
    previous = vectors[case["previous"]]
    current = vectors[case["current"]]
    query_vector = memory._signature(previous, current, unit(current - previous), case["previous"], case["current"])
    vectorized = memory.signature_matrix @ query_vector
    scalar = np.array([float(np.dot(row, query_vector)) for row in memory.signature_matrix])
    return {"rows": len(vectorized), "maxAbsoluteDifference": float(np.max(np.abs(vectorized - scalar))),
            "passed": bool(np.allclose(vectorized, scalar, atol=1e-12))}


def main() -> None:
    artifacts = HERE / "artifacts"
    result_path = artifacts / "frozen_results.json"
    if result_path.exists():
        raise RuntimeError("frozen holdout has already been evaluated; create a new experiment version instead of rerunning")
    frozen = json.loads((artifacts / "frozen_config.json").read_text(encoding="utf-8"))
    actual = {name: digest(HERE / name) for name in frozen["frozenHashes"]}
    if actual != frozen["frozenHashes"]:
        raise RuntimeError(f"frozen source hash mismatch: expected={frozen['frozenHashes']} actual={actual}")

    started = perf_counter()
    trajectories = memory_trajectories()
    cases = final_holdout_cases()
    vectors = encode_all(trajectories, cases + development_cases() + holdout_cases())
    memory = HardTrajectoryMemory(trajectories, vectors, **frozen["memoryConfig"])
    query = frozen["queryConfig"]
    single_step = run_cases(memory, cases, vectors, query)
    geometric_correct = sum(
        (row["geometricPrediction"] == row["expected"]) if row["expected"] is not None
        else (row["predicted"] is None)
        for row in single_step["rows"]
    )
    output = {
        "schema": "hard_trajectory_memory_frozen_evaluation_v0",
        "frozenConfig": frozen,
        "singleStep": single_step,
        "geometricContinuationAccuracy": geometric_correct / len(cases),
        "exactReplay": exact_replay_test(memory, query),
        "multiStep": rollout_test(memory, cases, vectors, query),
        "crossTrajectory": cross_trajectory_test(trajectories, vectors, frozen["memoryConfig"], query),
        "conflict": conflict_test(trajectories, vectors, frozen["memoryConfig"], query),
        "evidenceAccumulation": evidence_test(trajectories, vectors, {
            **frozen["memoryConfig"], **{
                "threshold": query["threshold"], "future_cluster_threshold": query["future_cluster_threshold"],
                "outcome_direction_weight": query["outcome_direction_weight"], "support_bonus": query["support_bonus"],
            }
        }),
        "matrixEquivalence": matrix_equivalence(memory, vectors, cases[0]),
        "scale": scale_test(memory, cases[0]["previous"], cases[0]["current"]),
        "elapsedSeconds": perf_counter() - started,
    }
    artifacts.mkdir(exist_ok=True)
    result_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    compact = {**output, "singleStep": {key: value for key, value in single_step.items() if key != "rows"}}
    compact["exactReplay"] = {key: value for key, value in output["exactReplay"].items() if key != "failures"}
    print(json.dumps(compact, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
