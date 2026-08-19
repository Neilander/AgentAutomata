from __future__ import annotations

import json
import unittest
from pathlib import Path

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
from test_continuation_controller import ContinuationControllerTests


HERE = Path(__file__).resolve().parent


def event(identifier: str, change: str) -> ImaginedEvent:
    return ImaginedEvent(
        identifier,
        FiveSlotCoordinate(
            affected_object=identifier,
            change_trend=change,
            cause_relation="前一状态变化触发当前状态",
            temporal_state="当前连续设想步骤",
            context="UFS公开规则形成的脑内预想",
        ),
    )


def p(identifier: str, description: str, cost: float = 1.0, change=None) -> AttentionPoint:
    return AttentionPoint(identifier, description, cost, change)


def ufs_graph(familiarity: float = 0.4):
    city_damage = PredictedChange("城市", "伤害", 1, "飞船到达城市会令城市伤害增加")
    graph = {
        "die_placed": (
            GlueOutcome(
                "same_column_descent",
                "automatic",
                (
                    p("scan-column", "注意骰子正上方同列飞船"),
                    p("project-landing", "沿下降路径检查每架飞船的最终落点"),
                ),
                next_events=(
                    event("ship_a_arrow", "飞船A最终停在箭头格"),
                    event("ship_b_quiet", "飞船B最终停在普通格"),
                ),
                activation=0.9,
                salience=0.6,
                familiarity=familiarity,
                source_memory_ids=("place-die-to-descend-ships",),
            ),
        ),
        "ship_a_arrow": (
            GlueOutcome(
                "arrow_horizontal_move",
                "automatic",
                (p("read-arrow", "注意最终落点箭头的方向"), p("follow-arrow", "检查箭头目标位置")),
                next_events=(event("ship_a_city", "横移后的飞船A到达城市"),),
                activation=0.88,
                salience=0.7,
                familiarity=familiarity,
                source_memory_ids=("arrow-landing-to-horizontal-move",),
            ),
        ),
        "ship_b_quiet": (
            GlueOutcome(
                "ordinary_sky_stops",
                "complete",
                (p("check-quiet", "确认普通落点没有即时后果", 0.6),),
                completion_reason="普通天空格没有继续粘连的即时效果",
                activation=0.76,
                salience=0.2,
                familiarity=familiarity,
            ),
        ),
        "ship_a_city": (
            GlueOutcome(
                "city_contact_damage",
                "automatic",
                (
                    p("notice-city", "注意飞船已经到达城市"),
                    p("predict-damage", "注意城市伤害将增加", change=city_damage),
                ),
                next_events=(event("city_damaged", "城市伤害增加，飞船进入等待区"),),
                activation=0.91,
                salience=0.95,
                familiarity=familiarity,
                source_memory_ids=("city-contact-to-damage",),
            ),
        ),
        "city_damaged": (
            GlueOutcome(
                "city_branch_complete",
                "complete",
                (p("confirm-city", "确认城市受伤后的公开状态", 0.6, city_damage),),
                completion_reason="城市伤害与飞船等待区变化已经结算",
                activation=0.85,
                salience=0.9,
                familiarity=familiarity,
            ),
        ),
        "white_die_placed": (
            GlueOutcome(
                "white_ship_descent",
                "automatic",
                (p("white-column", "注意白骰同列飞船"),),
                next_events=(event("white_ship_quiet", "同列飞船下降后停在普通格"),),
                activation=0.88,
                salience=0.6,
                familiarity=familiarity,
            ),
            GlueOutcome(
                "reroll_unplaced_dice",
                "random",
                (p("notice-reroll", "注意其余未放置骰子将被重掷"),),
                random_summary="每颗未放置骰子的具体新点数要等实际重掷，已知范围为1到6",
                activation=0.9,
                salience=0.75,
                familiarity=familiarity,
            ),
        ),
        "white_ship_quiet": (
            GlueOutcome(
                "white_ship_stable",
                "complete",
                (p("confirm-white-quiet", "确认飞船普通落点没有即时后果", 0.6),),
                completion_reason="同列飞船停在普通天空格，确定分支结束",
                activation=0.75,
                salience=0.2,
                familiarity=familiarity,
            ),
        ),
        "unknown_mothership_icon": (
            GlueOutcome(
                "mothership_icon_lookup",
                "unknown",
                (p("inspect-icon", "注意母舰停留行的陌生图标"),),
                missing_knowledge="需要查阅该母舰图标的作用对象和变化量",
                activation=0.82,
                salience=0.7,
                familiarity=0.0,
            ),
        ),
        "spawn_tie": (
            GlueOutcome(
                "choose_spawn_column",
                "choice",
                (p("notice-tie", "注意有两个同样合法的出生列"),),
                alternatives=("在第2列生成", "在第4列生成"),
                activation=0.78,
                salience=0.6,
                familiarity=familiarity,
            ),
        ),
    }
    return graph


def run_scenario(initial: str, budget: float, familiarity: float = 0.4) -> dict:
    controller = ImaginationContinuationController()
    graph = ufs_graph(familiarity)
    goal = GoalSpec("protect_city", "城市", "伤害", 0, 1.0, "current_round")
    result = controller.run(
        [event(initial, "场景起始状态已经发生")],
        lambda row: graph[row.event_id],
        AttentionAccount(budget),
        (goal,),
    )
    return {
        "initialEvent": initial,
        "budget": budget,
        "familiarity": familiarity,
        "result": result,
    }


def main() -> None:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(ContinuationControllerTests)
    run = unittest.TextTestRunner(verbosity=2).run(suite)
    if not run.wasSuccessful():
        raise SystemExit(1)

    scenarios = [
        run_scenario("die_placed", 12.0, 0.4),
        run_scenario("die_placed", 2.2, 0.4),
        run_scenario("die_placed", 4.0, 1.0),
        run_scenario("white_die_placed", 5.0, 0.4),
        run_scenario("unknown_mothership_icon", 2.0, 0.0),
        run_scenario("spawn_tie", 2.0, 0.4),
    ]
    payload = {
        "schema": "imagination_continuation_validation_v0",
        "tests": {"run": run.testsRun, "failures": len(run.failures), "errors": len(run.errors)},
        "scenarios": scenarios,
    }
    output = HERE / "artifacts" / "validation.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "tests": payload["tests"],
        "scenarioSummaries": [
            {
                "initialEvent": row["initialEvent"],
                "budget": row["budget"],
                "familiarity": row["familiarity"],
                "traceResults": [step["result"] for step in row["result"]["trace"]],
                "boundaryKinds": row["result"]["boundaryKinds"],
                "attention": row["result"]["attention"],
            }
            for row in scenarios
        ],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
