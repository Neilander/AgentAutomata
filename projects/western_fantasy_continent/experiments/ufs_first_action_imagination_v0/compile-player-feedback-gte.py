from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
MEMORY_ROOT = HERE.parent / "five_slot_trajectory_memory_v0"
sys.path.insert(0, str(MEMORY_ROOT))

from five_slot_memory import (  # noqa: E402
    DEFAULT_SLOT_WEIGHTS,
    FiveSlotCoordinate,
    FiveSlotTrajectoryMemory,
)
from gte_encoder import LocalGTEEncoder  # noqa: E402


INPUT_SCHEMA = "ufs_player_feedback_gte_compile_input_v1"
OUTPUT_SCHEMA = "ufs_player_feedback_gte_compile_batch_v1"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    if payload.get("schema") != INPUT_SCHEMA:
        raise ValueError(f"unsupported compile input: {payload.get('schema')}")
    rows = payload.get("records")
    if not isinstance(rows, list) or not rows:
        raise ValueError("feedback GTE compile requires at least one record")

    record_ids = [row["recordId"] for row in rows]
    if len(record_ids) != len(set(record_ids)):
        raise ValueError("feedback GTE compile record IDs must be unique")
    current = [FiveSlotCoordinate.from_dict(row["current"]) for row in rows]
    following = [FiveSlotCoordinate.from_dict(row["following"]) for row in rows]

    encoder = LocalGTEEncoder()
    memory = FiveSlotTrajectoryMemory.new(encoder)
    current_matrix = np.asarray(memory.coordinate_vectors(current), dtype="<f4")
    following_matrix = np.asarray(memory.coordinate_vectors(following), dtype="<f4")
    expected_shape = (len(rows), 3840)
    if current_matrix.shape != expected_shape or following_matrix.shape != expected_shape:
        raise ValueError(
            f"unexpected feedback GTE matrix shapes: {current_matrix.shape}, {following_matrix.shape}"
        )

    current_bytes = current_matrix.tobytes(order="C")
    following_bytes = following_matrix.tobytes(order="C")
    output = {
        "schema": OUTPUT_SCHEMA,
        "encoder": encoder.identifier,
        "dtype": "float32-le",
        "slotWeights": DEFAULT_SLOT_WEIGHTS,
        "coordinateWidth": 3840,
        "recordIds": record_ids,
        "currentMatrixBase64": base64.b64encode(current_bytes).decode("ascii"),
        "followingMatrixBase64": base64.b64encode(following_bytes).decode("ascii"),
        "currentSha256": hashlib.sha256(current_bytes).hexdigest(),
        "followingSha256": hashlib.sha256(following_bytes).hexdigest(),
    }
    args.output.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
