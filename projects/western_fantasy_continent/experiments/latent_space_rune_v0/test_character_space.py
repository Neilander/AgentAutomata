from __future__ import annotations

import unittest

import numpy as np

from character_space import (
    AXES,
    build_characters,
    choose_question,
    oracle_probabilities,
    run_all_guesses,
    update_posterior,
)


class CharacterSpaceTest(unittest.TestCase):
    def test_dataset_has_40_unique_characters_and_signatures(self):
        characters = build_characters()
        self.assertEqual(len(characters), 40)
        self.assertEqual(len({item.id for item in characters}), 40)
        self.assertEqual(len({item.tags for item in characters}), 40)

    def test_oracle_coordinates_can_identify_every_character(self):
        characters = build_characters()
        result = run_all_guesses(characters, oracle_probabilities(characters))
        self.assertEqual(result["accuracy"], 1.0)
        self.assertEqual(result["mean_target_rank"], 1.0)

    def test_posterior_remains_normalized(self):
        posterior = np.full(40, 1 / 40)
        signal = np.linspace(0.05, 0.95, 40)
        updated = update_posterior(posterior, signal, True)
        self.assertAlmostEqual(float(updated.sum()), 1.0)
        self.assertTrue(np.all(updated > 0))

    def test_question_selection_does_not_repeat(self):
        posterior = np.full(40, 1 / 40)
        probabilities = np.tile(np.linspace(0.05, 0.95, 40)[:, None], (1, len(AXES)))
        first = choose_question(posterior, probabilities, [])
        second = choose_question(posterior, probabilities, [first])
        self.assertNotEqual(first, second)


if __name__ == "__main__":
    unittest.main()
