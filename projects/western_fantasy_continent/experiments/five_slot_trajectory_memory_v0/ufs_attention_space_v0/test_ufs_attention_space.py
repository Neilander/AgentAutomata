from __future__ import annotations

import copy
import json
import random
import subprocess
import sys
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
BRIDGE = HERE.parent / "ufs_one_turn_wiring_v0" / "ufs-public-bridge.js"
sys.path.insert(0, str(HERE))

from ufs_attention_space import (  # noqa: E402
    AttentionContext,
    AttentionScope,
    UfsAttentionModule,
    UfsAttentionProfile,
    UfsAttentionSpace,
)


def load_real_snapshot(seed: int = 119) -> dict:
    output = subprocess.check_output(
        ["node", str(BRIDGE), "snapshot", str(seed)],
        text=True,
        encoding="utf-8",
    )
    return json.loads(output)


class UfsAttentionSpaceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.public_input = load_real_snapshot()
        cls.action = next(
            row
            for row in cls.public_input["legalActions"]
            if row["id"] == "worker:r1-gray-0@A-r2-c2"
        )

    def setUp(self) -> None:
        placement = self.action["placement"]
        ship_rows = [
            ship["row"]
            for ship in self.public_input["observation"]["ships"]
            if ship["column"] == placement["column"]
        ]
        self.context = AttentionContext(
            phase="dice",
            action="place_die",
            goal="choose_worker_placement",
            tags=("imagination",),
            focus={
                "die_id": placement["dieId"],
                "die_value": placement["dieValue"],
                "cell_id": placement["cellId"],
                "room_id": placement["roomId"],
                "column": placement["column"],
                "ship_rows": ship_rows,
            },
        )

    def _field(self, module: UfsAttentionModule) -> dict[str, float]:
        return {
            row["itemId"]: row["activation"]
            for row in module.inspect_attention(self.context)
        }

    def test_real_public_snapshot_builds_full_addressable_space(self) -> None:
        space = UfsAttentionSpace(self.public_input)
        ids = {item.item_id for item in space.items}
        self.assertEqual(sum(item.kind == "sky_cell" for item in space.items), 80)
        self.assertEqual(sum(item.kind == "base_cell" for item in space.items), 30)
        self.assertIn("track:energy", ids)
        self.assertIn("track:damage", ids)
        self.assertIn("die:r1-gray-0", ids)
        self.assertIn("ship:purple-1", ids)

    def test_hidden_or_answer_like_input_is_rejected(self) -> None:
        for forbidden in ("seed", "rngState", "history", "bestAction"):
            unsafe = copy.deepcopy(self.public_input)
            unsafe[forbidden] = "leak"
            with self.subTest(forbidden=forbidden), self.assertRaises(ValueError):
                UfsAttentionSpace(unsafe)

    def test_build_does_not_mutate_public_input(self) -> None:
        source = copy.deepcopy(self.public_input)
        before = copy.deepcopy(source)
        UfsAttentionSpace(source)
        self.assertEqual(source, before)

    def test_place_die_base_preset_is_narrow_but_keeps_background(self) -> None:
        module = UfsAttentionModule(self.public_input)
        field = self._field(module)
        self.assertGreaterEqual(field["die:r1-gray-0"], 0.9)
        self.assertGreaterEqual(field["base_cell:A-r2-c2"], 0.9)
        self.assertGreaterEqual(field["ship:purple-1"], 0.8)
        self.assertLess(field["track:researchIndex"], 0.2)
        self.assertGreater(field["sky_cell:15:4"], 0.0)
        self.assertLess(field["sky_cell:15:4"], 0.1)

    def test_rule_reader_can_define_a_new_action_preset(self) -> None:
        profile = UfsAttentionProfile()
        preset_id = profile.define_initial_attention(
            {"kinds": ["energy", "research"]},
            0.6,
            AttentionScope(phase="rooms", action="resolve_room"),
            "规则说明房间结算会消耗能源并可能推进研究",
        )
        module = UfsAttentionModule(self.public_input, profile)
        room_context = AttentionContext(phase="rooms", action="resolve_room")
        room_field = {
            row["itemId"]: row["activation"]
            for row in module.inspect_attention(room_context)
        }
        dice_field = self._field(module)
        self.assertEqual(room_field["track:energy"], 0.64)
        self.assertEqual(room_field["track:researchIndex"], 0.64)
        self.assertLess(dice_field["track:energy"], 0.2)
        self.assertEqual(profile.inspect_initial_presets()[0]["adjustment_id"], preset_id)

    def test_ai_can_increase_and_decrease_attention_with_audit(self) -> None:
        profile = UfsAttentionProfile()
        module = UfsAttentionModule(self.public_input, profile)
        before = self._field(module)
        boost_id = profile.increase_attention(
            {"relation": "all_unplaced_dice"},
            0.35,
            AttentionScope(phase="dice", action="place_die"),
            "复盘发现放白骰时常忽略剩余骰子会被重掷",
        )
        lower_id = profile.decrease_attention(
            {"kinds": ["damage"]},
            0.5,
            AttentionScope(phase="dice", action="place_die"),
            "当前练习只检查骰子联动，临时降低伤害轨道权重",
        )
        after_rows = module.inspect_attention(self.context)
        after = {row["itemId"]: row["activation"] for row in after_rows}
        self.assertGreater(after["die:r1-white-4"], before["die:r1-white-4"])
        self.assertEqual(after["track:damage"], 0.0)
        white = next(row for row in after_rows if row["itemId"] == "die:r1-white-4")
        self.assertIn(boost_id, {row["source"] for row in white["contributions"]})
        self.assertEqual({row["adjustment_id"] for row in profile.inspect_adjustments()}, {boost_id, lower_id})

    def test_expand_attention_uses_public_relation_not_answer(self) -> None:
        profile = UfsAttentionProfile()
        module = UfsAttentionModule(self.public_input, profile)
        before = self._field(module)
        profile.expand_attention(
            "same_column_as_focus",
            0.25,
            AttentionScope(phase="dice", action="place_die"),
            "复盘发现同列较远的天空标志也可能进入后续链条",
        )
        after = self._field(module)
        self.assertAlmostEqual(after["sky_cell:10:1"] - before["sky_cell:10:1"], 0.25)
        self.assertEqual(after["sky_cell:10:4"], before["sky_cell:10:4"])

    def test_multi_tag_selector_requires_all_tags(self) -> None:
        profile = UfsAttentionProfile()
        module = UfsAttentionModule(self.public_input, profile)
        before = self._field(module)
        profile.increase_attention(
            {"tags": ["column:1", "explosion"]},
            0.3,
            AttentionScope(phase="dice", action="place_die"),
            "只加强目标列里的爆炸格，而非全列或全图爆炸格",
        )
        after = self._field(module)
        self.assertGreater(after["sky_cell:6:1"], before["sky_cell:6:1"])
        self.assertEqual(after["sky_cell:5:1"], before["sky_cell:5:1"])
        self.assertEqual(after["sky_cell:6:0"], before["sky_cell:6:0"])

    def test_scope_isolation_and_revert_are_exact(self) -> None:
        profile = UfsAttentionProfile()
        module = UfsAttentionModule(self.public_input, profile)
        before = self._field(module)
        adjustment_id = profile.increase_attention(
            {"kinds": ["energy"]},
            0.4,
            AttentionScope(phase="rooms", action="resolve_room"),
            "房间结算时需要检查能源是否足够",
        )
        self.assertEqual(self._field(module), before)
        profile.remove_adjustment(adjustment_id)
        self.assertEqual(self._field(module), before)

    def test_budget_is_finite_and_monotonic(self) -> None:
        module = UfsAttentionModule(self.public_input)
        low = module.notice(self.context, 0.15)
        normal = module.notice(self.context, 0.5)
        high = module.notice(self.context, 0.9)
        low_ids = {row.item_id for row in low.noticed}
        normal_ids = {row.item_id for row in normal.noticed}
        high_ids = {row.item_id for row in high.noticed}
        self.assertLess(low.capacity, normal.capacity)
        self.assertLess(normal.capacity, high.capacity)
        self.assertTrue(low_ids.issubset(normal_ids))
        self.assertTrue(normal_ids.issubset(high_ids))
        self.assertGreater(low.omitted_count, high.omitted_count)

    def test_invalid_ai_adjustment_cannot_smuggle_an_answer(self) -> None:
        profile = UfsAttentionProfile()
        with self.assertRaises(ValueError):
            profile.increase_attention(
                {"bestAction": "worker:r1-gray-0@A-r2-c2"},
                1.0,
                AttentionScope(action="place_die"),
                "直接告诉答案",
            )
        with self.assertRaises(ValueError):
            profile.expand_attention(
                "future_winning_route",
                0.5,
                AttentionScope(action="place_die"),
                "读取未来",
            )

    def test_random_adjustment_sequences_preserve_field_invariants(self) -> None:
        randomizer = random.Random(20260818)
        kinds = ["energy", "damage", "research", "die", "ship", "sky_cell"]
        for sequence in range(20):
            profile = UfsAttentionProfile()
            module = UfsAttentionModule(self.public_input, profile)
            for step in range(30):
                operation = randomizer.choice(("increase", "decrease"))
                method = getattr(profile, f"{operation}_attention")
                method(
                    {"kinds": [randomizer.choice(kinds)]},
                    max(0.001, randomizer.random()),
                    AttentionScope(phase="dice", action="place_die"),
                    f"property-test-{sequence}-{step}",
                )
            rows = module.inspect_attention(self.context)
            self.assertEqual(len(rows), len(module.space.items))
            self.assertEqual(len({row["itemId"] for row in rows}), len(rows))
            self.assertTrue(all(0.0 <= row["activation"] <= 1.0 for row in rows))


if __name__ == "__main__":
    unittest.main(verbosity=2)
