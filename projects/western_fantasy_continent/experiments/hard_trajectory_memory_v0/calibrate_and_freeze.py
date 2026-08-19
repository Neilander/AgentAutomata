from __future__ import annotations

import hashlib
import json
from pathlib import Path

from fixtures import development_cases, holdout_cases, memory_trajectories
from run_experiment import calibrate, encode_all


HERE = Path(__file__).resolve().parent
FROZEN_FILES = ("trajectory_memory.py", "fixtures.py", "final_holdout.py", "evaluate_frozen.py")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    trajectories = memory_trajectories()
    calibration_cases = development_cases() + holdout_cases()
    vectors = encode_all(trajectories, calibration_cases)
    calibration, details = calibrate(trajectories, calibration_cases, vectors)
    frozen = {
        "schema": "hard_trajectory_memory_frozen_config_v0",
        "calibrationCases": len(calibration_cases),
        "memoryTrajectories": len(trajectories),
        "memorySegments": sum(max(0, len(row["states"]) - 2) for row in trajectories),
        "memoryConfig": {
            "state_weight": calibration["stateWeight"],
            "direction_weight": calibration["directionWeight"],
            "signature_mode": calibration["signatureMode"],
            "prediction_mode": calibration["predictionMode"],
        },
        "queryConfig": {
            "top_k": 8,
            "threshold": calibration["threshold"],
            "score_band": 0.10,
            "temperature": 0.035,
            "future_cluster_threshold": calibration["futureClusterThreshold"],
            "outcome_direction_weight": calibration["outcomeDirectionWeight"],
            "support_bonus": calibration["supportBonus"],
        },
        "calibration": calibration,
        "frozenHashes": {name: digest(HERE / name) for name in FROZEN_FILES},
    }
    artifacts = HERE / "artifacts"
    artifacts.mkdir(exist_ok=True)
    (artifacts / "frozen_config.json").write_text(json.dumps(frozen, ensure_ascii=False, indent=2), encoding="utf-8")
    (artifacts / "calibration_results.json").write_text(
        json.dumps({"config": frozen, "development": details["bestDevelopment"]}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"frozen": frozen, "development": {
        key: value for key, value in details["bestDevelopment"].items() if key != "rows"
    }}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

