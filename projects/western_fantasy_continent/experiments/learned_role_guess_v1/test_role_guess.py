from __future__ import annotations

import sys
import unittest
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from run_experiment import apply_relative_clue, build_values, load_memory  # noqa: E402


class LearnedRoleGuessTest(unittest.TestCase):
    def setUp(self):
        self.memory = load_memory()
        self.characters = self.memory["characters"]
        self.values = build_values(self.characters)

    def test_frozen_memory_contains_real_battle_knowledge(self):
        self.assertEqual(self.memory["source"]["battleCount"], 22)
        self.assertEqual(len(self.characters), 13)
        self.assertTrue(self.memory["source"]["generatedFromPlayerVisibleSignals"])
        self.assertFalse(self.memory["source"]["designerStatsExposed"])

    def test_name_and_role_are_not_in_retrieval_text(self):
        for character in self.characters:
            self.assertNotIn(character["name"], character["retrievalText"])
            self.assertNotIn(character["role"], character["retrievalText"])

    def test_unknown_is_not_zero_or_deleted(self):
        values = self.values["healing"]
        known = np.where(np.isfinite(values))[0]
        unknown = np.where(~np.isfinite(values))[0]
        posterior = np.full(len(self.characters), 1 / len(self.characters))
        updated = apply_relative_clue(
            posterior,
            "healing",
            "healing",
            int(known[0]),
            int(known[1]),
            self.values,
        )
        self.assertTrue(np.all(updated[unknown] > 0))
        self.assertTrue(np.allclose(updated[unknown], updated[unknown][0]))

    def test_protection_and_healing_remain_separate(self):
        priest = next(row for row in self.characters if row["id"] == "hero_priest")
        self.assertIn("protection", priest["capabilities"])
        self.assertTrue(any(row["domain"] == "healing" for row in priest["traits"]))
        self.assertNotEqual(
            priest["capabilities"]["protection"]["position"],
            next(row["level"] for row in priest["traits"] if row["domain"] == "healing"),
        )


if __name__ == "__main__":
    unittest.main()
