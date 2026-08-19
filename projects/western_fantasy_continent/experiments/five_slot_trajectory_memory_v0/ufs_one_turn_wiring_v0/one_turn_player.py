from __future__ import annotations

import copy
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from five_slot_memory import FiveSlotTrajectoryMemory, WakeupCandidate
from noticed_step_writer import FullyNoticedStep


HERE = Path(__file__).resolve().parent


@dataclass(frozen=True)
class PlanningGoal:
    city_damage_weight: float = -100.0
    mothership_advance_weight: float = -30.0
    ship_descent_weight: float = -1.0
    uncertainty_weight: float = -8.0
    energy_delta_weight: float = 3.0
    research_advance_weight: float = 12.0
    ships_destroyed_weight: float = 8.0
    excavator_advance_weight: float = 4.0
    setup_progress_weight: float = 1.0


def _step(row: dict[str, Any]) -> FullyNoticedStep:
    return FullyNoticedStep(**row)


def build_rule_memory(encoder, path: Path | None = None) -> FiveSlotTrajectoryMemory:
    source = path or HERE / "rule_trajectories.json"
    payload = json.loads(source.read_text(encoding="utf-8"))
    memory = FiveSlotTrajectoryMemory.new(encoder)
    for transition in payload["transitions"]:
        current = _step(transition["current"]).to_coordinate()
        following = _step(transition["following"]).to_coordinate()
        memory.remember(
            current,
            following,
            record_id=transition["id"],
            metadata={
                "sourceRuleIds": transition["sourceRuleIds"],
                "requires": transition["requires"],
                "materializer": transition["materializer"],
                "followingStep": transition["following"],
            },
        )
    return memory


def requirements_match(requirements: dict[str, Any], facts: dict[str, Any]) -> bool:
    return all(facts.get(key) == expected for key, expected in requirements.items())


def select_wakeup(memory, step: FullyNoticedStep, facts: dict[str, Any]) -> tuple[WakeupCandidate | None, dict]:
    # Vector retrieval must narrow the library first.  Exact public facts only verify
    # those three recalled candidates; they are not allowed to scan the whole library.
    result = memory.query(step.to_coordinate(), top_k=3, threshold=0.45, score_band=0.18)
    selected = next(
        (candidate for candidate in result.candidates if requirements_match(candidate.metadata["requires"], facts)),
        None,
    )
    trace = {
        "queryStep": asdict(step),
        "facts": facts,
        "bestScore": result.best_score,
        "selectedRecordId": selected.record_id if selected else None,
        "selectedScore": selected.score if selected else None,
        "selectedRank": (
            next(index for index, candidate in enumerate(result.candidates, start=1) if candidate is selected)
            if selected else None
        ),
        "recalledFollowing": asdict(selected.following) if selected else None,
        "candidateRecordIds": [candidate.record_id for candidate in result.candidates],
    }
    return selected, trace


def _cell(public_map: dict, row: int, column: int) -> dict:
    for sky_row in public_map["sky"]["rows"]:
        if sky_row["index"] == row:
            return sky_row["cells"][column]
    return {}


def _landing_step(ship: dict, old_row: int, effect: str, cell: dict) -> FullyNoticedStep:
    labels = {
        "arrow": "箭头格",
        "mothership_down": "母舰下降格",
        "city": "城市所在行",
        "quiet": "没有即时移动效果的天空格",
    }
    return FullyNoticedStep(
        actor=f"{ship['color']}飞船{ship['id']}",
        action=f"从第{old_row}行下降并最终停在{labels[effect]}",
        affected_object=f"飞船{ship['id']}与第{ship['row']}行第{ship['column'] + 1}列落点",
        before_state=f"飞船位于第{old_row}行第{ship['column'] + 1}列",
        after_state=f"飞船最终到达第{ship['row']}行；落点公开信息为{json.dumps(cell, ensure_ascii=False)}",
        temporal_state="下降已经结束，正在结算最终停留格",
        context="真实UFS公开版图上的一步预想",
    )


def _strategic_state(world: dict) -> dict:
    return {
        "damage": world["damage"],
        "mothershipRow": world["mothershipRow"],
        "ships": sorted(
            ({key: ship[key] for key in ("id", "color", "column", "row")} for ship in world["ships"]),
            key=lambda row: row["id"],
        ),
        "waitingShips": sorted(
            ({key: ship[key] for key in ("id", "color")} for ship in world["waitingShips"]),
            key=lambda row: row["id"],
        ),
    }


def _zero_future_features() -> dict[str, int]:
    return {
        "energyDelta": 0,
        "researchAdvance": 0,
        "shipsDestroyed": 0,
        "excavatorAdvance": 0,
        "setupProgress": 0,
    }


def _max_research_advance(public_input: dict, room: dict, value: int) -> int:
    research = public_input["publicMap"]["research"]
    index = public_input["observation"]["researchIndex"]
    budget = value
    steps = 0
    while index + steps < len(research["costs"]):
        next_index = index + steps
        reaches_top = next_index == len(research["costs"]) - 1
        if reaches_top and research["finalRequiresMultiSpace"] and len(room["cellIds"]) < 2:
            break
        cost = research["costs"][next_index]
        if cost > budget:
            break
        budget -= cost
        steps += 1
    return steps


def _future_step(kind: str, action: dict, room: dict | None) -> FullyNoticedStep:
    placement = action["placement"]
    room_label = f"{placement['roomType']}房{placement['roomId']}"
    common = {
        "temporal_state": "当前放置完成后，对未来房间阶段进行预想",
        "context": "真实UFS公开局面中的延迟房间收益",
    }
    if kind == "excavation":
        return FullyNoticedStep(
            actor=f"放在未挖掘格{placement['cellId']}上的骰子",
            action="等待房间阶段支付一点能源进行挖掘",
            affected_object="挖掘机与未开放路径",
            before_state="骰子已合法放在未挖掘格，挖掘机尚未移动",
            after_state="未来可以选择支付能源并移动挖掘机",
            **common,
        )
    if kind == "multi_incomplete":
        return FullyNoticedStep(
            actor=f"放入{room_label}其中一格的骰子",
            action="占据房间的一部分但尚未填满全部格子",
            affected_object=room_label,
            before_state="多格房间尚未放入本颗骰子",
            after_state="多格房间增加一个已占格，但仍缺少其他格",
            **common,
        )
    if kind == "none":
        return FullyNoticedStep(
            actor=f"放在{room_label}中的骰子",
            action="等待进入房间阶段",
            affected_object="该骰子的未来房间效果",
            before_state="骰子已经完成放置",
            after_state="该位置在房间阶段没有额外资源效果",
            **common,
        )
    labels = {"energy": "能源", "research": "研究", "fighter": "战斗机"}
    label = labels[kind]
    return FullyNoticedStep(
        actor=f"等待进入房间阶段的{label}房骰子",
        action=f"在房间完整且能源成本可支付时准备结算{label}房",
        affected_object=f"{room_label}与其作用对象",
        before_state=f"骰子已经占据{label}房，但房间效果尚未结算",
        after_state=f"{label}房达到可结算状态",
        **common,
    )


def project_delayed_benefit(memory, public_input: dict, action: dict, predicted_world: dict) -> dict:
    observation = public_input["observation"]
    placement = action["placement"]
    rooms = {row["id"]: row for row in public_input["publicMap"]["base"]["rooms"]}
    room = rooms[placement["roomId"]]
    if placement["excavationCandidate"]:
        kind = "excavation"
    else:
        occupied = {
            row["cellId"] for row in observation["placements"] if not row.get("resolved", False)
        } | {row["cellId"] for row in observation["robots"] if not row.get("exhausted", False)}
        occupied.add(placement["cellId"])
        complete = all(cell_id in occupied for cell_id in room["cellIds"])
        if not complete:
            kind = "multi_incomplete"
        elif room["type"] in {"energy", "research", "fighter"}:
            kind = room["type"]
        else:
            kind = "none"

    future_step = _future_step(kind, action, room)
    selected, trace = select_wakeup(memory, future_step, {"futureKind": kind})
    expected_materializers = {
        "energy": "project_energy_room",
        "research": "project_research_room",
        "fighter": "project_fighter_room",
        "excavation": "project_excavation",
        "multi_incomplete": "project_multi_room_setup",
        "none": "project_zero_room_benefit",
    }
    base = {
        "kind": kind,
        "status": "memory_missing",
        "roomId": room["id"],
        "features": _zero_future_features(),
        "wakeup": trace,
        "assumption": "若后续放置和结算顺序不改变相关状态时的房间阶段投影",
    }
    if selected is None or selected.metadata["materializer"] != expected_materializers[kind]:
        return base

    features = _zero_future_features()
    if kind == "multi_incomplete":
        features["setupProgress"] = 1
        return {**base, "status": "conditional_needs_other_cells", "features": features}
    if kind == "excavation":
        if observation["energy"] < 1:
            return {**base, "status": "currently_unaffordable"}
        features["energyDelta"] = -1
        features["excavatorAdvance"] = placement["excavationDistance"]
        return {**base, "status": "projected_resolvable", "features": features}
    if kind == "none":
        return {**base, "status": "projected_zero_benefit"}

    if observation["energy"] < room["energyCost"]:
        return {**base, "status": "currently_unaffordable"}
    value = max(0, placement["dieValue"] + room["modifier"])
    features["energyDelta"] = -room["energyCost"]
    if kind == "energy":
        after_cost = observation["energy"] - room["energyCost"]
        after_gain = min(public_input["publicMap"]["city"]["maxEnergy"], after_cost + value)
        features["energyDelta"] = after_gain - observation["energy"]
    elif kind == "research":
        features["researchAdvance"] = _max_research_advance(public_input, room, value)
    elif kind == "fighter":
        destroyed = 0
        for ship in predicted_world["ships"]:
            cell = _cell(public_input["publicMap"], ship["row"], ship["column"])
            threshold = cell.get("explosion")
            destroyed += int(threshold is not None and threshold <= value)
        features["shipsDestroyed"] = destroyed
    return {
        **base,
        "status": "projected_resolvable",
        "roomValue": value,
        "energyCost": room["energyCost"],
        "features": features,
    }


def _apply_recalled_landing(world: dict, public_map: dict, ship_id: str, selected: WakeupCandidate) -> None:
    kind = selected.metadata["materializer"]
    ship = next((row for row in world["ships"] if row["id"] == ship_id), None)
    if kind == "stop_chain":
        return
    if kind == "move_to_arrow_target":
        if ship is None:
            return
        cell = _cell(public_map, ship["row"], ship["column"])
        target_row = cell["effect"]["targetRow"]
        target_column = cell["effect"]["targetColumn"]
        occupied = any(
            other["id"] != ship_id and other["row"] == target_row and other["column"] == target_column
            for other in world["ships"]
        )
        if not occupied:
            ship["row"] = target_row
            ship["column"] = target_column
        return
    if kind == "move_mothership_one_row":
        world["mothershipRow"] += 1
        collected = [row for row in world["ships"] if row["row"] == world["mothershipRow"]]
        world["ships"] = [row for row in world["ships"] if row["row"] != world["mothershipRow"]]
        world["waitingShips"].extend({"id": row["id"], "color": row["color"]} for row in collected)
        return
    if kind == "damage_city_and_wait":
        if ship is None:
            return
        world["ships"] = [row for row in world["ships"] if row["id"] != ship_id]
        world["waitingShips"].append({"id": ship["id"], "color": ship["color"]})
        world["damage"] += 1
        return
    raise ValueError(f"unsupported recalled materializer: {kind}")


def imagine_worker_placement(memory, public_input: dict, action: dict) -> dict:
    observation = public_input["observation"]
    public_map = public_input["publicMap"]
    placement = action["placement"]
    world = {
        "damage": observation["damage"],
        "mothershipRow": observation["mothershipRow"],
        "ships": copy.deepcopy(observation["ships"]),
        "waitingShips": copy.deepcopy(observation["waitingShips"]),
    }
    start = FullyNoticedStep(
        actor="玩家",
        action=(
            f"把{placement['dieColor']}色{placement['dieValue']}点骰子{placement['dieId']}"
            f"放入第{placement['column'] + 1}列的{placement['roomType']}格"
        ),
        affected_object=f"骰子{placement['dieId']}和第{placement['column'] + 1}列",
        before_state="骰子尚未放置，同列飞船仍在原位",
        after_state=f"骰子已经位于基地格{placement['cellId']}",
        temporal_state="骰子阶段中的候选动作已经在脑内假设发生",
        context="真实UFS公开局面中的一步预想",
    )
    selected, trace = select_wakeup(memory, start, {"diePlaced": True})
    wakeups = [trace]
    unresolved = []
    uncertainties = []
    if selected is None or selected.metadata["materializer"] != "descend_same_column":
        unresolved.append("没有从记忆唤醒同列飞船下降")
        return {
            "actionId": action["id"],
            "complete": False,
            "wakeups": wakeups,
            "unresolved": unresolved,
            "uncertainties": uncertainties,
            "delayedBenefit": {
                "kind": "unknown",
                "status": "blocked_by_missing_immediate_memory",
                "features": _zero_future_features(),
            },
            "predicted": _strategic_state(world),
        }

    descent = max(0, placement["dieValue"] - (1 if placement["roomType"] == "aa" else 0))
    moving = [ship for ship in world["ships"] if ship["column"] == placement["column"]]
    old_rows = {ship["id"]: ship["row"] for ship in moving}
    for ship in moving:
        ship["row"] += descent

    city_row = public_map["sky"]["cityRow"]
    for moving_ship in list(moving):
        ship = next((row for row in world["ships"] if row["id"] == moving_ship["id"]), None)
        if ship is None:
            continue
        if ship["row"] >= city_row:
            effect = "city"
            cell = {"city": True}
        else:
            cell = _cell(public_map, ship["row"], ship["column"])
            raw_effect = cell.get("effect", {}).get("type")
            effect = raw_effect if raw_effect in {"arrow", "mothership_down"} else "quiet"
        landing = _landing_step(ship, old_rows[ship["id"]], effect, cell)
        landing_selected, landing_trace = select_wakeup(memory, landing, {"landingEffect": effect})
        wakeups.append(landing_trace)
        if landing_selected is None:
            unresolved.append(f"飞船{ship['id']}的{effect}落点没有唤醒后续")
            continue
        _apply_recalled_landing(world, public_map, ship["id"], landing_selected)

    if placement["dieColor"] == "white":
        reroll = FullyNoticedStep(
            actor=f"白色骰子{placement['dieId']}",
            action="完成放置以及同列飞船下降的结算",
            affected_object="其余尚未放置的骰子",
            before_state="其余骰子仍保持本次白骰放置前的点数",
            after_state="白骰已经完成放置，准备重掷其余未放置骰子",
            temporal_state="白骰放置后、进入下一个玩家选择前",
            context="真实UFS公开局面中的白骰并行随机后果预想",
        )
        reroll_selected, reroll_trace = select_wakeup(memory, reroll, {"whiteDiePlaced": True})
        wakeups.append(reroll_trace)
        if reroll_selected is None or reroll_selected.metadata["materializer"] != "mark_unknown_white_reroll":
            unresolved.append("白骰随机重掷没有从记忆中被唤醒")
        else:
            uncertainties.append("其余未放置骰子会重掷；具体新点数在实际投掷前未知")
    delayed_benefit = project_delayed_benefit(memory, public_input, action, world)
    if delayed_benefit["status"] == "memory_missing":
        unresolved.append("未来房间收益没有从记忆中被唤醒")
    return {
        "actionId": action["id"],
        "complete": not unresolved,
        "placement": placement,
        "effectiveDescent": descent,
        "wakeups": wakeups,
        "unresolved": unresolved,
        "uncertainties": uncertainties,
        "delayedBenefit": delayed_benefit,
        "predicted": _strategic_state(world),
    }


def score_prediction(observation: dict, prediction: dict, goal: PlanningGoal) -> dict:
    before_rows = {ship["id"]: ship["row"] for ship in observation["ships"]}
    after_rows = {ship["id"]: ship["row"] for ship in prediction["predicted"]["ships"]}
    ship_descent = sum(
        # A ship can leave the active sky because the mothership collected it or
        # because it hit the city.  Those consequences have their own features;
        # disappearance alone must not be misread as further downward travel.
        max(0, after_rows.get(ship_id, old_row) - old_row)
        for ship_id, old_row in before_rows.items()
    )
    features = {
        "cityDamage": prediction["predicted"]["damage"] - observation["damage"],
        "mothershipAdvance": prediction["predicted"]["mothershipRow"] - observation["mothershipRow"],
        "shipDescent": ship_descent,
        "uncertaintyCount": len(prediction["unresolved"]) + len(prediction["uncertainties"]),
        **prediction["delayedBenefit"]["features"],
    }
    score = (
        features["cityDamage"] * goal.city_damage_weight
        + features["mothershipAdvance"] * goal.mothership_advance_weight
        + features["shipDescent"] * goal.ship_descent_weight
        + features["uncertaintyCount"] * goal.uncertainty_weight
        + features["energyDelta"] * goal.energy_delta_weight
        + features["researchAdvance"] * goal.research_advance_weight
        + features["shipsDestroyed"] * goal.ships_destroyed_weight
        + features["excavatorAdvance"] * goal.excavator_advance_weight
        + features["setupProgress"] * goal.setup_progress_weight
    )
    return {"score": score, "features": features}


def choose_one_turn(memory, public_input: dict, goal: PlanningGoal | None = None) -> dict:
    target = goal or PlanningGoal()
    candidates = []
    for action in public_input["legalActions"]:
        if action["kind"] != "worker_placement":
            continue
        prediction = imagine_worker_placement(memory, public_input, action)
        prediction["evaluation"] = score_prediction(public_input["observation"], prediction, target)
        candidates.append(prediction)
    candidates.sort(key=lambda row: (-row["evaluation"]["score"], row["actionId"]))
    return {
        "schema": "ufs_five_slot_one_turn_choice_v0",
        "goal": asdict(target),
        "selectedActionId": candidates[0]["actionId"] if candidates else None,
        "candidates": candidates,
    }
