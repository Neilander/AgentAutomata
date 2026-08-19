from __future__ import annotations

import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
MEMORY_ROOT = HERE.parent
sys.path.insert(0, str(MEMORY_ROOT))
sys.path.insert(0, str(HERE))

from five_slot_memory import FiveSlotTrajectoryMemory, SLOT_NAMES  # noqa: E402
from rule_trajectory_compiler import (  # noqa: E402
    AdaptiveNumericOutcome,
    CandidateEvidence,
    RuleHeadIndex,
    RuleTrajectoryCompiler,
)


class FastStableEncoder:
    dimension = 24
    identifier = "rule-trajectory-test-encoder-v0"

    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        rows = []
        for text in texts:
            seed = int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")
            rng = np.random.default_rng(seed)
            value = rng.normal(size=self.dimension).astype(np.float32)
            rows.append(value / np.linalg.norm(value))
        return np.asarray(rows, dtype=np.float32)


def load_fixture() -> tuple[dict[str, str], list[dict]]:
    source = json.loads((HERE / "source_rules.json").read_text(encoding="utf-8"))["rules"]
    edges = json.loads((HERE / "ai_compiled_examples.json").read_text(encoding="utf-8"))["edges"]
    return source, edges


class RuleTrajectoryCompilerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.source, self.rows = load_fixture()
        self.compiler = RuleTrajectoryCompiler(self.source)

    def test_ai_examples_compile_to_exact_five_slot_qs(self) -> None:
        drafts = self.compiler.compile_rows(self.rows)
        self.assertEqual(len(drafts), 6)
        self.assertEqual(sum(row.state == "ready" for row in drafts), 5)
        self.assertEqual(sum(row.state == "unresolved" for row in drafts), 1)
        for draft in drafts:
            self.assertEqual(len(draft.current.slot_texts()), 5)
            self.assertTrue(all(getattr(draft.current, name).strip() for name in SLOT_NAMES))
            if draft.following:
                self.assertEqual(len(draft.following.slot_texts()), 5)

    def test_numeric_relation_binds_new_start_positions(self) -> None:
        draft = self.compiler.compile_rows(self.rows)[0]
        relation = draft.variable_relations[0]
        self.assertEqual(relation.bind({"start_row": 2, "die_value": 3}), 5)
        self.assertEqual(relation.bind({"start_row": 8, "die_value": 3}), 11)
        with self.assertRaises(KeyError):
            relation.bind({"start_row": 2})

    def test_draft_cannot_invent_a_concrete_number(self) -> None:
        bad = copy.deepcopy(self.rows[0])
        bad["following"]["change_trend"] = "飞船无条件下降7格"
        with self.assertRaisesRegex(ValueError, "invented concrete numbers"):
            self.compiler.compile_rows([bad])

    def test_grounding_quote_must_exist_in_frozen_rule(self) -> None:
        bad = copy.deepcopy(self.rows[1])
        bad["sourceGrounding"] = {"all": ["箭头还会额外造成城市伤害。"]}
        with self.assertRaisesRegex(ValueError, "not in source rule"):
            self.compiler.compile_rows([bad])

    def test_unresolved_rule_cannot_fabricate_a_following_q(self) -> None:
        unresolved = copy.deepcopy(self.rows[3])
        unresolved["following"] = copy.deepcopy(self.rows[4]["following"])
        with self.assertRaisesRegex(ValueError, "must not invent"):
            self.compiler.compile_rows([unresolved])

    def test_unresolved_rule_records_lookup_need_and_is_not_installed(self) -> None:
        drafts = self.compiler.compile_rows(self.rows)
        unresolved = next(row for row in drafts if row.state == "unresolved")
        self.assertIn("查看", unresolved.unresolved_need)
        memory = FiveSlotTrajectoryMemory.new(FastStableEncoder())
        installed = self.compiler.install_ready(memory, drafts)
        self.assertEqual(len(installed), 5)
        self.assertNotIn(unresolved.edge_id, installed)

    def test_arrow_rule_is_a_separate_wakeup_not_baked_into_descent(self) -> None:
        drafts = {row.edge_id: row for row in self.compiler.compile_rows(self.rows)}
        descent = drafts["place-die-to-descend-ships"]
        arrow = drafts["arrow-landing-to-horizontal-move"]
        self.assertNotIn("箭头", " ".join(descent.following.slot_texts()))
        self.assertIn("箭头", " ".join(arrow.current.slot_texts()))
        self.assertIn("横向", " ".join(arrow.following.slot_texts()))
        self.assertNotEqual(descent.source_rule_id, arrow.source_rule_id)

    def test_random_number_estimate_moves_with_experience(self) -> None:
        estimate = AdaptiveNumericOutcome(decay=0.7)
        self.assertIsNone(estimate.estimate())
        for value in (1, 1, 2, 1, 2):
            estimate.observe(value)
        low_period = estimate.estimate()
        self.assertLess(low_period.center, 2)
        self.assertEqual((low_period.typical_low, low_period.typical_high), (1, 2))
        for value in (5, 5, 5, 5, 5, 5, 5, 5):
            estimate.observe(value)
        high_period = estimate.estimate()
        self.assertGreater(high_period.center, 4.5)
        self.assertEqual((high_period.typical_low, high_period.typical_high), (5, 5))
        self.assertEqual((high_period.observed_low, high_period.observed_high), (1, 5))

    def test_repeated_verification_strengthens_same_connection(self) -> None:
        drafts = self.compiler.compile_rows(self.rows)
        arrow = next(row for row in drafts if row.edge_id == "arrow-landing-to-horizontal-move")
        memory = FiveSlotTrajectoryMemory.new(FastStableEncoder())
        arrow.to_memory(memory)
        arrow.to_memory(memory)
        arrow.to_memory(memory)
        record = next(row for row in memory.records if row.record_id == arrow.edge_id)
        self.assertEqual(record.observations, 3)
        self.assertEqual(record.support, 3.0)

    def test_unresolved_head_remains_addressable_for_rule_lookup(self) -> None:
        drafts = self.compiler.compile_rows(self.rows)
        unresolved = next(row for row in drafts if row.state == "unresolved")
        index = RuleHeadIndex(FastStableEncoder(), drafts)
        result = index.query(unresolved.current)
        self.assertEqual(result.edge_id, unresolved.edge_id)
        self.assertEqual(result.state, "unresolved")
        self.assertIsNone(result.following)
        self.assertIn("查看", result.unresolved_need)

    def test_agent_slot_evidence_can_accept_or_reject_recalled_row(self) -> None:
        drafts = {row.edge_id: row for row in self.compiler.compile_rows(self.rows)}
        query = drafts["arrow-landing-to-horizontal-move"].current
        supported = CandidateEvidence(
            candidate_edge_id="arrow-landing-to-horizontal-move",
            slot_verdicts={name: "supported" for name in SLOT_NAMES},
            evidence_quotes={name: getattr(query, name) for name in SLOT_NAMES},
        )
        supported.validate(query, drafts[supported.candidate_edge_id])
        self.assertTrue(supported.accepted)

        contradicted = CandidateEvidence(
            candidate_edge_id="arrow-landing-to-horizontal-move",
            slot_verdicts={
                name: ("contradicted" if name == "change_trend" else "supported")
                for name in SLOT_NAMES
            },
            evidence_quotes={name: getattr(query, name) for name in SLOT_NAMES},
        )
        contradicted.validate(query, drafts[contradicted.candidate_edge_id])
        self.assertFalse(contradicted.accepted)
        forged = copy.deepcopy(contradicted.evidence_quotes)
        forged["change_trend"] = "查询里不存在的证据"
        with self.assertRaisesRegex(ValueError, "not present"):
            CandidateEvidence(
                candidate_edge_id=contradicted.candidate_edge_id,
                slot_verdicts=contradicted.slot_verdicts,
                evidence_quotes=forged,
            ).validate(query, drafts[contradicted.candidate_edge_id])


if __name__ == "__main__":
    unittest.main(verbosity=2)
