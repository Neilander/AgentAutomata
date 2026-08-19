from __future__ import annotations

import hashlib
import unittest

import numpy as np

from one_turn_player import build_rule_memory, requirements_match, select_wakeup
from noticed_step_writer import FullyNoticedStep


class StableEncoder:
    dimension = 24
    identifier = "ufs-one-turn-test-encoder"

    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        rows = []
        for text in texts:
            seed = int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")
            rng = np.random.default_rng(seed)
            vector = rng.normal(size=self.dimension).astype(np.float32)
            rows.append(vector / np.linalg.norm(vector))
        return np.asarray(rows)


class UfsOneTurnWiringTest(unittest.TestCase):
    def test_requirement_check_is_exact_secondary_validation(self) -> None:
        self.assertTrue(requirements_match({"landingEffect": "arrow"}, {"landingEffect": "arrow"}))
        self.assertFalse(requirements_match({"landingEffect": "arrow"}, {"landingEffect": "quiet"}))

    def test_placement_wakes_descent_record(self) -> None:
        memory = build_rule_memory(StableEncoder())
        payload = FullyNoticedStep(
            actor="玩家",
            action="把一颗未放置骰子放入一个合法基地格",
            affected_object="该骰子和所选基地列",
            before_state="骰子尚未放置，同列飞船仍在原位",
            after_state="骰子已经位于选定基地格",
            temporal_state="骰子阶段中，放置已经发生",
            context="真实UFS对局中的工人骰放置",
        )
        selected, _ = select_wakeup(memory, payload, {"diePlaced": True})
        self.assertIsNotNone(selected)
        self.assertEqual(selected.record_id, "placement-to-column-descent")

    def test_empty_memory_cannot_imagine_a_rule(self) -> None:
        from five_slot_memory import FiveSlotTrajectoryMemory

        memory = FiveSlotTrajectoryMemory.new(StableEncoder())
        selected, trace = select_wakeup(memory, json_step("放置骰子", "骰子已放置"), {"diePlaced": True})
        self.assertIsNone(selected)
        self.assertIsNone(trace["selectedRecordId"])


def json_step(action: str, after: str) -> FullyNoticedStep:
    return FullyNoticedStep(
        actor="玩家",
        action=action,
        affected_object="骰子和所选基地列",
        before_state="骰子尚未放置，同列飞船仍在原位",
        after_state=after,
        temporal_state="骰子阶段中的候选动作已经发生",
        context="真实UFS公开局面中的一步预想",
    )


if __name__ == "__main__":
    unittest.main(verbosity=2)
