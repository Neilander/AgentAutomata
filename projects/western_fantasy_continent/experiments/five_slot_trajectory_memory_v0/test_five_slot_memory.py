from __future__ import annotations

import hashlib
import tempfile
import unittest
from pathlib import Path

import numpy as np

from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory


class StableTestEncoder:
    """Deterministic encoder for lifecycle tests; semantic behavior is tested with GTE separately."""

    dimension = 24

    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        rows = []
        for text in texts:
            seed = int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")
            rng = np.random.default_rng(seed)
            vector = rng.normal(size=self.dimension)
            rows.append(vector / np.linalg.norm(vector))
        return np.asarray(rows, dtype=np.float64)


def coordinate(label: str) -> FiveSlotCoordinate:
    return FiveSlotCoordinate(
        affected_object=f"{label}对象",
        change_trend=f"{label}变化",
        cause_relation=f"{label}原因",
        temporal_state=f"{label}时间",
        context=f"{label}上下文",
    )


class FiveSlotMemoryLifecycleTest(unittest.TestCase):
    def test_new_instance_is_empty_and_independent(self) -> None:
        encoder = StableTestEncoder()
        first = FiveSlotTrajectoryMemory.new(encoder)
        second = FiveSlotTrajectoryMemory.new(encoder)
        result = first.query(coordinate("查询"))
        self.assertTrue(result.abstained)
        self.assertEqual(result.reason, "empty_memory")
        first.remember(coordinate("一"), coordinate("二"))
        self.assertEqual(len(first), 1)
        self.assertEqual(len(second), 0)

    def test_exact_query_retrieves_following_coordinate(self) -> None:
        memory = FiveSlotTrajectoryMemory.new(StableTestEncoder())
        current = coordinate("当前")
        following = coordinate("后续")
        memory.remember(current, following, record_id="known-link")
        result = memory.query(current, threshold=0.99)
        self.assertFalse(result.abstained)
        self.assertEqual(result.following, following)
        self.assertEqual(result.candidates[0].record_id, "known-link")
        self.assertEqual(memory.coordinate_dimension, StableTestEncoder.dimension * 5)

    def test_repeated_observation_strengthens_same_connection(self) -> None:
        memory = FiveSlotTrajectoryMemory.new(StableTestEncoder())
        current = coordinate("当前")
        following = coordinate("后续")
        identifier = memory.remember(current, following, strength=0.5)
        repeated = memory.remember(current, following, strength=1.5)
        self.assertEqual(identifier, repeated)
        self.assertEqual(len(memory), 1)
        self.assertEqual(memory.records[0].observations, 2)
        self.assertEqual(memory.records[0].support, 2.0)

    def test_save_load_round_trip_rebuilds_matrix(self) -> None:
        encoder = StableTestEncoder()
        memory = FiveSlotTrajectoryMemory.new(encoder)
        current = coordinate("当前")
        following = coordinate("后续")
        memory.remember(current, following, metadata={"source": "unit-test"}, record_id="saved")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "memory.json"
            memory.save(path)
            restored = FiveSlotTrajectoryMemory.load(path, StableTestEncoder())
            result = restored.query(current, threshold=0.99)
        self.assertEqual(len(restored), 1)
        self.assertEqual(result.following, following)
        self.assertEqual(result.candidates[0].metadata["source"], "unit-test")

    def test_trajectory_creates_consecutive_links(self) -> None:
        memory = FiveSlotTrajectoryMemory.new(StableTestEncoder())
        points = [coordinate("一"), coordinate("二"), coordinate("三")]
        identifiers = memory.remember_trajectory(points, metadata={"episode": "demo"})
        self.assertEqual(len(identifiers), 2)
        self.assertEqual(memory.query(points[0], threshold=0.99).following, points[1])
        self.assertEqual(memory.query(points[1], threshold=0.99).following, points[2])


if __name__ == "__main__":
    unittest.main(verbosity=2)

