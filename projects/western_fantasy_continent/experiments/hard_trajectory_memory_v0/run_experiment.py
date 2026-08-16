from __future__ import annotations

import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path
from time import perf_counter

import numpy as np

HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402
from fixtures import CONCEPT_CANDIDATES, development_cases, holdout_cases, memory_trajectories  # noqa: E402
from trajectory_memory import HardTrajectoryMemory, collect_texts, rank_concepts  # noqa: E402


def encode_all(trajectories: list[dict], cases: list[dict]) -> dict[str, np.ndarray]:
    texts = collect_texts(trajectories, cases, CONCEPT_CANDIDATES)
    matrix = GTERuntime().encode(texts, batch_size=24)
    return {text: matrix[index] for index, text in enumerate(texts)}


def run_cases(memory: HardTrajectoryMemory, cases: list[dict], vectors: dict[str, np.ndarray], config: dict) -> dict:
    rows = []
    for case in cases:
        result = memory.query(case["previous"], case["current"], **config)
        predicted = None
        retrieved_prediction = None
        ranking = []
        if not result["abstained"]:
            ranking = rank_concepts(result["prediction"], CONCEPT_CANDIDATES, vectors)
            predicted = ranking[0][0]
            votes = defaultdict(float)
            for selected in result["selected"]:
                if selected["inWinningCluster"]:
                    votes[selected["rememberedNextConcept"]] += selected["weight"]
            retrieved_prediction = max(votes, key=votes.get) if votes else None
        correct = result["abstained"] if case["expected"] is None else retrieved_prediction == case["expected"]
        rows.append({
            "id": case["id"], "kind": case["kind"], "group": case["group"], "expected": case["expected"],
            "predicted": retrieved_prediction, "geometricPrediction": predicted,
            "correct": correct, "bestScore": result["bestScore"], "evidenceScore": result["evidenceScore"],
            "confidence": result["confidence"], "agreement": result["agreement"],
            "effectiveSupport": result["effectiveSupport"], "selected": result["selected"],
            "topConcepts": ranking[:3], "clusterMass": result.get("clusterMass", 0.0),
            "clusterCount": result.get("clusterCount", 0), "evidenceCount": result.get("evidenceCount", 0),
        })
    return summarize(rows)


def summarize(rows: list[dict]) -> dict:
    groups = {}
    for row in rows:
        bucket = groups.setdefault(row["group"], {"cases": 0, "correct": 0})
        bucket["cases"] += 1
        bucket["correct"] += int(row["correct"])
    for bucket in groups.values():
        bucket["accuracy"] = bucket["correct"] / bucket["cases"]
    positives = [row for row in rows if row["kind"] == "positive"]
    negatives = [row for row in rows if row["kind"] == "negative"]
    return {
        "cases": len(rows), "correct": sum(row["correct"] for row in rows),
        "accuracy": sum(row["correct"] for row in rows) / len(rows),
        "positiveAccuracy": sum(row["correct"] for row in positives) / max(1, len(positives)),
        "negativeAccuracy": sum(row["correct"] for row in negatives) / max(1, len(negatives)),
        "groups": groups, "rows": rows,
    }


def calibrate(trajectories: list[dict], cases: list[dict], vectors: dict[str, np.ndarray]) -> tuple[dict, dict]:
    best = None
    trials = []
    # These algebraic signatures also accept predicted vectors during rollout.
    modes = [("delta", 0.0), ("endpoints", 0.5), ("state_delta", 0.5)]
    for signature_mode, state_weight in modes:
        for prediction_mode in ("future_prototype",):
            memory = HardTrajectoryMemory(
                trajectories, vectors, state_weight=state_weight, direction_weight=1.0-state_weight,
                signature_mode=signature_mode, prediction_mode=prediction_mode,
            )
            for future_cluster_threshold in (0.58, 0.70, 0.82):
              for outcome_direction_weight in (0.0, 0.35, 0.65):
                for support_bonus in (0.0, 0.02, 0.04):
                  for threshold in np.arange(0.35, 0.86, 0.025):
                    config = {"top_k": 8, "threshold": float(threshold), "score_band": 0.10, "temperature": 0.035,
                              "future_cluster_threshold": future_cluster_threshold,
                              "outcome_direction_weight": outcome_direction_weight, "support_bonus": support_bonus}
                    result = run_cases(memory, cases, vectors, config)
                    balanced = 0.5 * (result["positiveAccuracy"] + result["negativeAccuracy"])
                    macro = float(np.mean([group["accuracy"] for group in result["groups"].values()]))
                    trial = {
                        "signatureMode": signature_mode, "predictionMode": prediction_mode,
                        "stateWeight": state_weight, "directionWeight": 1.0-state_weight,
                        "threshold": float(threshold), "futureClusterThreshold": future_cluster_threshold,
                        "outcomeDirectionWeight": outcome_direction_weight,
                        "supportBonus": support_bonus,
                        "balanced": balanced, "macroAccuracy": macro, "accuracy": result["accuracy"],
                    }
                    trials.append(trial)
                    key = (macro, balanced, result["accuracy"], threshold)
                    if best is None or key > best[0]:
                        best = (key, trial, result)
    return best[1], {"bestDevelopment": best[2], "trialCount": len(trials)}


def ablations(trajectories: list[dict], cases: list[dict], vectors: dict[str, np.ndarray], threshold: float) -> dict:
    output = {}
    for name, state_weight in (("stateOnly", 1.0), ("directionOnly", 0.0), ("statePlusDirection", 0.5)):
        memory = HardTrajectoryMemory(trajectories, vectors, state_weight=state_weight, direction_weight=1.0-state_weight)
        output[name] = run_cases(memory, cases, vectors, {"top_k": 8, "threshold": threshold, "score_band": 0.10, "temperature": 0.035})
        output[name].pop("rows")
    return output


def scale_test(memory: HardTrajectoryMemory, previous: str, current: str) -> list[dict]:
    rows = []
    base = len(memory.segments)
    for target in (base, 1000, 10000, 50000):
        copies = max(1, int(np.ceil(target / base)))
        expanded = memory.expanded_for_scale(copies)
        timings = []
        for _ in range(20):
            result = expanded.query(previous, current, top_k=8, threshold=-1.0)
            timings.append(result["matrixSeconds"])
        rows.append({"segments": len(expanded.segments), "medianMatrixMs": float(np.median(timings)*1000), "p95MatrixMs": float(np.percentile(timings,95)*1000)})
    return rows


def evidence_test(trajectories: list[dict], vectors: dict[str, np.ndarray], config: dict) -> dict:
    case = next(row for row in holdout_cases() if row["id"] == "hold-det-a")
    one = [row for row in trajectories if row["id"] == "detonate-0"]
    many = [row for row in trajectories if row["id"].startswith("detonate-")]
    results = {}
    for name, rows in (("oneEpisode", one), ("fiveSimilarEpisodes", many)):
        memory = HardTrajectoryMemory(
            rows, vectors, state_weight=config["state_weight"], direction_weight=config["direction_weight"],
            signature_mode=config["signature_mode"], prediction_mode=config["prediction_mode"],
        )
        result = memory.query(
            case["previous"], case["current"], top_k=8, threshold=config["threshold"],
            future_cluster_threshold=config["future_cluster_threshold"], support_bonus=config["support_bonus"],
            outcome_direction_weight=config["outcome_direction_weight"],
        )
        votes = defaultdict(float)
        for selected in result["selected"]:
            if selected["inWinningCluster"]:
                votes[selected["rememberedNextConcept"]] += selected["weight"]
        results[name] = {key: result[key] for key in ("bestScore", "evidenceScore", "confidence", "agreement", "effectiveSupport", "abstained")}
        results[name]["predicted"] = max(votes, key=votes.get) if votes else None
    return results


def main() -> None:
    trajectories = memory_trajectories()
    development = development_cases()
    holdout = holdout_cases()
    started = perf_counter()
    vectors = encode_all(trajectories, development + holdout)
    calibration, calibration_details = calibrate(trajectories, development, vectors)
    config = {
        "state_weight": calibration["stateWeight"], "direction_weight": calibration["directionWeight"],
        "signature_mode": calibration["signatureMode"], "prediction_mode": calibration["predictionMode"],
        "threshold": calibration["threshold"],
        "future_cluster_threshold": calibration["futureClusterThreshold"], "support_bonus": calibration["supportBonus"],
        "outcome_direction_weight": calibration["outcomeDirectionWeight"],
    }
    memory = HardTrajectoryMemory(
        trajectories, vectors, state_weight=config["state_weight"], direction_weight=config["direction_weight"],
        signature_mode=config["signature_mode"], prediction_mode=config["prediction_mode"],
    )
    query_config = {"top_k": 8, "threshold": config["threshold"], "score_band": 0.10, "temperature": 0.035,
                    "future_cluster_threshold": calibration["futureClusterThreshold"],
                    "outcome_direction_weight": calibration["outcomeDirectionWeight"],
                    "support_bonus": calibration["supportBonus"]}
    holdout_result = run_cases(memory, holdout, vectors, query_config)
    output = {
        "schema": "hard_trajectory_memory_experiment_v0",
        "memory": {"trajectories": len(trajectories), "segments": len(memory.segments), "matrixShape": list(memory.signature_matrix.shape), "runtimeMemoryLoop": False},
        "calibration": calibration,
        "development": calibration_details["bestDevelopment"],
        "holdout": holdout_result,
        "ablations": ablations(trajectories, holdout, vectors, config["threshold"]),
        "evidenceAccumulation": evidence_test(trajectories, vectors, config),
        "scale": scale_test(memory, holdout[0]["previous"], holdout[0]["current"]),
        "elapsedSeconds": perf_counter()-started,
        "inputHash": hashlib.sha256((Path(__file__).read_bytes()+Path(HERE/"fixtures.py").read_bytes()+Path(HERE/"trajectory_memory.py").read_bytes())).hexdigest(),
    }
    artifacts = HERE / "artifacts"
    artifacts.mkdir(exist_ok=True)
    (artifacts / "results.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    compact = {**output, "development": {key:value for key,value in output["development"].items() if key != "rows"}, "holdout": {key:value for key,value in output["holdout"].items() if key != "rows"}}
    print(json.dumps(compact, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
