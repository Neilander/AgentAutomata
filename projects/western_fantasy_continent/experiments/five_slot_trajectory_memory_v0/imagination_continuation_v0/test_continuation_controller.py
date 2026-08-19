from __future__ import annotations

import unittest

from continuation_controller import (
    AttentionAccount,
    AttentionPoint,
    GlueOutcome,
    GoalSpec,
    ImaginedEvent,
    ImaginationContinuationController,
    PredictedChange,
)
from five_slot_memory import FiveSlotCoordinate


def event(identifier: str) -> ImaginedEvent:
    return ImaginedEvent(
        identifier,
        FiveSlotCoordinate(
            affected_object=identifier,
            change_trend=f"{identifier}发生变化",
            cause_relation="前一步导致当前变化",
            temporal_state="当前设想步骤",
            context="隔离测试",
        ),
    )


def point(identifier: str, cost: float = 1.0, change: PredictedChange | None = None) -> AttentionPoint:
    return AttentionPoint(identifier, f"检查{identifier}", cost, change)


def automatic(identifier: str, next_ids: tuple[str, ...], **kwargs) -> GlueOutcome:
    return GlueOutcome(
        identifier,
        "automatic",
        kwargs.pop("attention_points", (point(f"{identifier}-point"),)),
        next_events=tuple(event(row) for row in next_ids),
        **kwargs,
    )


def complete(identifier: str, **kwargs) -> GlueOutcome:
    return GlueOutcome(
        identifier,
        "complete",
        kwargs.pop("attention_points", (point(f"{identifier}-point"),)),
        completion_reason="本分支没有更多即时后果",
        **kwargs,
    )


class ContinuationControllerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.controller = ImaginationContinuationController()

    def test_deterministic_chain_continues_until_complete(self) -> None:
        graph = {
            "placed": (automatic("descend", ("landed",)),),
            "landed": (automatic("arrow", ("shifted",)),),
            "shifted": (complete("quiet"),),
        }
        result = self.controller.run([event("placed")], lambda row: graph[row.event_id], AttentionAccount(10))
        self.assertEqual([row["result"] for row in result["trace"]], ["continue", "continue", "complete"])
        self.assertEqual(result["boundaryKinds"], [])

    def test_parallel_random_does_not_cancel_deterministic_branch(self) -> None:
        graph = {
            "white_placed": (
                automatic("ship_descent", ("ship_landed",), salience=0.6),
                GlueOutcome(
                    "reroll_remaining",
                    "random",
                    (point("notice-reroll"),),
                    random_summary="其余骰子各自变为1到6之间的未知点数",
                    salience=0.5,
                ),
            ),
            "ship_landed": (complete("ship_stable"),),
        }
        result = self.controller.run([event("white_placed")], lambda row: graph[row.event_id], AttentionAccount(10))
        self.assertIn("random", result["boundaryKinds"])
        self.assertTrue(any(row.get("outcomeId") == "ship_stable" for row in result["completions"]))

    def test_choice_and_unknown_are_distinct_boundaries(self) -> None:
        graph = {
            "fork": (
                GlueOutcome("pick_direction", "choice", (point("notice-choice"),), alternatives=("向左", "向右")),
            ),
            "alien_icon": (
                GlueOutcome(
                    "lookup_icon",
                    "unknown",
                    (point("notice-icon"),),
                    missing_knowledge="不知道该母舰图标会改变什么",
                ),
            ),
        }
        result = self.controller.run(
            [event("fork"), event("alien_icon")],
            lambda row: graph[row.event_id],
            AttentionAccount(10),
        )
        self.assertEqual(set(result["boundaryKinds"]), {"choice", "unknown"})

    def test_attention_stops_inside_an_outcome_and_does_not_emit_next_event(self) -> None:
        outcome = automatic(
            "long_step",
            ("should_not_run",),
            attention_points=(point("ship", 1.0), point("landing", 1.0), point("city", 1.0)),
        )
        result = self.controller.run([event("start")], lambda _: (outcome,), AttentionAccount(1.5))
        self.assertEqual(result["boundaryKinds"], ["attention_stop"])
        self.assertEqual(result["trace"][0]["inspectedAttentionPoints"][0]["pointId"], "ship")
        self.assertEqual(result["trace"][0]["missedAttentionPoints"][0]["pointId"], "landing")
        self.assertFalse(any(row["eventId"] == "should_not_run" for row in result["completions"]))

    def test_familiarity_reduces_but_never_removes_attention_cost(self) -> None:
        points = (point("p1"), point("p2"), point("p3"))
        unfamiliar = automatic("step", ("done",), attention_points=points, familiarity=0.0)
        familiar = automatic("step", ("done",), attention_points=points, familiarity=1.0)
        done = complete("done-complete", attention_points=(point("done-check", 0.1),), familiarity=1.0)
        graph_done = lambda row: (done,) if row.event_id == "done" else None

        result_new = self.controller.run(
            [event("start")],
            lambda row: (unfamiliar,) if row.event_id == "start" else graph_done(row),
            AttentionAccount(1.2),
        )
        result_familiar = self.controller.run(
            [event("start")],
            lambda row: (familiar,) if row.event_id == "start" else graph_done(row),
            AttentionAccount(1.2),
        )
        self.assertIn("attention_stop", result_new["boundaryKinds"])
        self.assertNotIn("attention_stop", result_familiar["boundaryKinds"])
        self.assertGreater(result_familiar["attention"]["spent"], 0)

    def test_goal_relevance_prioritizes_threat_under_small_budget(self) -> None:
        city_change = PredictedChange("城市", "伤害", 1, "城市伤害增加")
        goal = GoalSpec("protect_city", "城市", "伤害", 0, 1.0)
        city = automatic(
            "city_threat",
            ("city_result",),
            attention_points=(point("city-impact", change=city_change),),
            activation=0.5,
            salience=0.2,
        )
        decoration = automatic(
            "minor_resource",
            ("resource_result",),
            activation=0.8,
            salience=0.2,
        )
        result = self.controller.run(
            [event("start")],
            lambda row: (city, decoration) if row.event_id == "start" else (),
            AttentionAccount(1.0),
            (goal,),
        )
        self.assertEqual(result["trace"][0]["outcomeId"], "city_threat")
        self.assertEqual(result["trace"][0]["goalMatches"][0]["effect"], "threat")
        stopped = [row for row in result["boundaries"] if row["kind"] == "attention_stop"]
        self.assertEqual(stopped[0]["outcomeId"], "minor_resource")

    def test_automatic_outcome_can_emit_multiple_simultaneous_events(self) -> None:
        graph = {
            "placed": (automatic("two_ships", ("ship_a_landed", "ship_b_landed")),),
            "ship_a_landed": (complete("ship-a-complete"),),
            "ship_b_landed": (complete("ship-b-complete"),),
        }
        result = self.controller.run([event("placed")], lambda row: graph[row.event_id], AttentionAccount(5))
        complete_ids = {row["eventId"] for row in result["completions"]}
        self.assertEqual(complete_ids, {"ship_a_landed", "ship_b_landed"})

    def test_no_recalled_successor_is_unknown_not_safe_completion(self) -> None:
        result = self.controller.run([event("ordinary_cell")], lambda _: (), AttentionAccount(1))
        self.assertEqual(result["boundaryKinds"], ["unknown"])
        self.assertEqual(result["completions"], [])

    def test_explicit_no_effect_memory_is_a_normal_completion(self) -> None:
        result = self.controller.run(
            [event("ordinary_cell")],
            lambda _: (complete("known-no-effect"),),
            AttentionAccount(1),
        )
        self.assertEqual(result["boundaryKinds"], [])
        self.assertEqual(result["completions"][0]["outcomeId"], "known-no-effect")

    def test_same_event_outcome_pair_is_guarded_against_loops(self) -> None:
        loop = automatic("repeat", ("start",), familiarity=1.0)
        result = self.controller.run([event("start")], lambda _: (loop,), AttentionAccount(10))
        self.assertIn("loop_guard", result["boundaryKinds"])


if __name__ == "__main__":
    unittest.main()
