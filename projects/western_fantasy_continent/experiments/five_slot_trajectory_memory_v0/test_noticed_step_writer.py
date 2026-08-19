from __future__ import annotations

import unittest

from five_slot_memory import FiveSlotTrajectoryMemory
from noticed_step_writer import FullyNoticedStep, FullyNoticedTrajectoryWriter
from test_five_slot_memory import StableTestEncoder


def step(label: str) -> FullyNoticedStep:
    return FullyNoticedStep(
        actor=f"{label}发起者",
        action=f"{label}动作",
        affected_object=f"{label}对象",
        before_state=f"{label}之前",
        after_state=f"{label}之后",
        temporal_state=f"{label}已经被完整观察",
        context=f"{label}真实游戏局面",
    )


class FullyNoticedStepWriterTest(unittest.TestCase):
    def test_step_is_mapped_to_five_nonempty_slots(self) -> None:
        coordinate = step("飞机下降").to_coordinate()
        self.assertEqual(len(coordinate.slot_texts()), 5)
        self.assertTrue(all(coordinate.slot_texts()))
        self.assertIn("飞机下降之前", coordinate.change_trend)
        self.assertIn("飞机下降之后", coordinate.change_trend)
        self.assertIn("飞机下降发起者", coordinate.cause_relation)

    def test_writer_preserves_episode_order_in_memory(self) -> None:
        memory = FiveSlotTrajectoryMemory.new(StableTestEncoder())
        steps = [step("放骰子"), step("飞船下降"), step("触发箭头"), step("碰到炸弹")]
        identifiers = FullyNoticedTrajectoryWriter.remember(
            memory,
            steps,
            metadata={"episode": "ufs-demo"},
        )
        coordinates = FullyNoticedTrajectoryWriter.abstract(steps)
        self.assertEqual(len(identifiers), 3)
        for index in range(3):
            result = memory.query(coordinates[index], threshold=0.99)
            self.assertEqual(result.following, coordinates[index + 1])
            self.assertEqual(result.candidates[0].metadata["trajectoryStep"], index)
            self.assertEqual(result.candidates[0].metadata["inputAssumption"], "every_step_fully_noticed")

    def test_missing_observed_fact_is_rejected_instead_of_invented(self) -> None:
        with self.assertRaises(ValueError):
            FullyNoticedStep(
                actor="飞机",
                action="下降",
                affected_object="",
                before_state="高处",
                after_state="低处",
                temporal_state="已经发生",
                context="真实局面",
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)
