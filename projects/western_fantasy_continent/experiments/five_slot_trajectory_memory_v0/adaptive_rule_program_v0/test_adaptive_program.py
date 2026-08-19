from __future__ import annotations

import copy
import json
import unittest
from pathlib import Path

from adaptive_program import AdaptiveGroundingProgram


HERE = Path(__file__).resolve().parent


def load_program() -> AdaptiveGroundingProgram:
    return AdaptiveGroundingProgram.from_files(HERE / "base_program.json", HERE / "source_rules.json")


def revisions() -> list[dict]:
    return json.loads((HERE / "program_revisions.json").read_text(encoding="utf-8"))["revisions"]


class AdaptiveProgramTests(unittest.TestCase):
    def test_base_program_generalizes_column_value_and_target_count(self) -> None:
        program = load_program()
        state = {
            "ships": [
                {"id": "A", "column": 3, "row": 2, "traits": []},
                {"id": "B", "column": 3, "row": 7, "traits": []},
                {"id": "C", "column": 4, "row": 5, "traits": []},
            ]
        }
        result = program.preview(
            {"type": "die_placed", "die": {"column": 3, "value": 4}, "roomType": "normal"},
            state,
        )
        self.assertEqual(result.selected_ids, ("A", "B"))
        self.assertEqual([ship["row"] for ship in result.after_state["ships"]], [6, 11, 5])

    def test_preview_never_mutates_public_input(self) -> None:
        program = load_program()
        event = {"type": "die_placed", "die": {"column": 1, "value": 2}, "roomType": "normal"}
        state = {"ships": [{"id": "A", "column": 1, "row": 4, "traits": []}]}
        frozen_event = copy.deepcopy(event)
        frozen_state = copy.deepcopy(state)
        program.preview(event, state)
        self.assertEqual(event, frozen_event)
        self.assertEqual(state, frozen_state)

    def test_all_revisions_compose_in_declared_order(self) -> None:
        program = load_program()
        for revision in revisions():
            program.apply_revision(revision)
        state = {
            "ships": [
                {"id": "normal", "column": 2, "row": 1, "traits": []},
                {"id": "frozen", "column": 2, "row": 1, "traits": ["frozen"]},
                {"id": "heavy", "column": 2, "row": 1, "traits": ["heavy"]},
                {"id": "combo", "column": 2, "row": 1, "traits": ["heavy", "boosted"]},
                {"id": "other", "column": 4, "row": 1, "traits": ["boosted"]},
            ]
        }
        result = program.preview(
            {"type": "die_placed", "die": {"column": 2, "value": 6}, "roomType": "aa"},
            state,
        )
        self.assertEqual(result.selected_ids, ("normal", "heavy", "combo"))
        # AA: N=5. normal +5, frozen +0, heavy floor(5/2)=2, combo 2+boost 1.
        self.assertEqual([ship["row"] for ship in result.after_state["ships"]], [6, 1, 3, 4, 1])

    def test_preview_records_attention_reads_from_actual_dependencies(self) -> None:
        program = load_program()
        for revision in revisions():
            program.apply_revision(revision)
        result = program.preview(
            {"type": "die_placed", "die": {"column": 2, "value": 6}, "roomType": "aa"},
            {"ships": [{"id": "H", "column": 2, "row": 3, "traits": ["heavy", "boosted"]}]},
        )
        reads = set(result.attention_reads)
        self.assertIn("event.roomType", reads)
        self.assertIn("candidate.column[candidate=H]", reads)
        self.assertIn("candidate.traits[candidate=H]", reads)
        self.assertIn("candidate.row[candidate=H]", reads)

    def test_focus_reducer_keeps_all_frontmost_ties(self) -> None:
        program = load_program()
        for revision in revisions():
            program.apply_revision(revision)
        result = program.preview(
            {"type": "die_placed", "die": {"column": 2, "value": 4}, "roomType": "focus"},
            {
                "ships": [
                    {"id": "back", "column": 2, "row": 3, "traits": []},
                    {"id": "front-a", "column": 2, "row": 8, "traits": []},
                    {"id": "front-b", "column": 2, "row": 8, "traits": ["heavy"]},
                    {"id": "frozen-front", "column": 2, "row": 10, "traits": ["frozen"]},
                ]
            },
        )
        self.assertEqual(result.selected_ids, ("front-a", "front-b"))
        self.assertEqual([ship["row"] for ship in result.after_state["ships"]], [3, 12, 10, 10])

    def test_patch_requires_quote_from_frozen_source(self) -> None:
        program = load_program()
        bad = copy.deepcopy(revisions()[0])
        bad["sourceQuote"] = "不存在的规则句子"
        with self.assertRaises(ValueError):
            program.apply_revision(bad)

    def test_unrelated_event_is_not_applicable(self) -> None:
        result = load_program().preview(
            {"type": "draw_card", "die": {"column": 2, "value": 6}, "roomType": "normal"},
            {"ships": []},
        )
        self.assertFalse(result.applicable)
        self.assertEqual(result.effects, ())


if __name__ == "__main__":
    unittest.main()
