"use strict";

const baseController = require("../ufs_live_ai_automatic_multicutpoint_three_round_v2/automatic-multicutpoint-controller");
const { RulePlanningRecall } = require("./rule-planning-recall");

function clone(value) {
  return structuredClone(value);
}

function visibleRoomCells(response, room) {
  const occupied = new Set((response.observation?.placements || []).map((row) => row.cellId));
  const excavatorIndex = Number(response.observation?.excavatorIndex || 0);
  const byId = new Map((response.mapView?.baseCells || []).map((cell) => [cell.id, cell]));
  return (room.cellIds || []).map((id) => byId.get(id)).filter((cell) => (
    cell && !occupied.has(cell.id) && Number(cell.unlockIndex || 0) <= excavatorIndex
  ));
}

function stableDice(response) {
  return (response.observation?.dice || []).filter((die) => !die.placed)
    .sort((left, right) => {
      if (left.color !== right.color) return left.color === "gray" ? -1 : 1;
      return Number(right.value) - Number(left.value) || left.id.localeCompare(right.id);
    });
}

function occupiedColumns(response) {
  const cells = new Map((response.mapView?.baseCells || []).map((cell) => [cell.id, cell]));
  return new Set((response.observation?.placements || []).filter((row) => row.resolved === false)
    .map((row) => row.column ?? cells.get(row.cellId)?.column).filter(Number.isInteger));
}

function bestVisibleRoom(response, roomType) {
  return (response.mapView?.rooms || []).filter((room) => (
    room.type === roomType && visibleRoomCells(response, room).length > 0
  )).sort((left, right) => Number(left.energyCost || 0) - Number(right.energyCost || 0)
    || Number(right.modifier || 0) - Number(left.modifier || 0)
    || left.id.localeCompare(right.id))[0] || null;
}

function completionMemory(recall) {
  return recall.qBefore.accepted.find((record) => (
    record.operationPattern?.type === "place_die"
    && record.operationPattern?.repeat === "each_unoccupied_visible_cell_in_same_room"
  )) || null;
}

function groundMemoryLedAnchor({ response, resultMemory, recall }) {
  const room = bestVisibleRoom(response, resultMemory.roomType);
  if (!room) return { status: "not_grounded", reason: "no_visible_room_for_recalled_result" };
  const cells = visibleRoomCells(response, room);
  const isMulticell = (room.cellIds || []).length > 1;
  const completion = completionMemory(recall);
  if (isMulticell && !completion) {
    return {
      status: "not_grounded",
      reason: "missing_recalled_multicell_completion_relation",
      roomId: room.id,
      resultMemoryId: resultMemory.memoryId,
    };
  }
  const targetCells = isMulticell ? cells : cells.slice(0, 1);
  const blockedColumns = occupiedColumns(response);
  if (targetCells.some((cell) => blockedColumns.has(cell.column))) {
    return { status: "not_grounded", reason: "room_cell_column_already_used", roomId: room.id };
  }
  if (new Set(targetCells.map((cell) => cell.column)).size !== targetCells.length) {
    return { status: "not_grounded", reason: "room_cells_share_a_column", roomId: room.id };
  }
  const dice = stableDice(response);
  if (dice.length < targetCells.length) {
    return { status: "not_grounded", reason: "not_enough_visible_dice", roomId: room.id };
  }
  const steps = targetCells.map((cell, index) => ({
    id: `memory-place-${dice[index].id}-to-${cell.id}`,
    operation: { type: "place_die", dieId: dice[index].id, cellId: cell.id },
    anchor: { collection: "dice", match: { id: dice[index].id, placed: false } },
    rationale: {
      source: "recalled_rule_then_visible_binding",
      resultMemoryId: resultMemory.memoryId,
      completionMemoryId: isMulticell ? completion.memoryId : null,
      roomId: room.id,
    },
  }));
  return {
    status: "grounded",
    roomId: room.id,
    resultMemoryId: resultMemory.memoryId,
    completionMemoryId: isMulticell ? completion.memoryId : null,
    steps,
  };
}

class MemoryLedMulticutpointController {
  constructor({ recall = new RulePlanningRecall() } = {}) {
    this.recall = recall;
  }

  generateCandidates(response, intent = baseController.macroIntent(response)) {
    if (!(response.observation?.phase === "dice"
      && response.availableOperations?.includes("place_die"))) {
      return baseController.generateCandidates(response, intent);
    }
    const recalled = this.recall.recall({ response, intent });
    const candidates = [];
    for (const route of recalled.qAfter) {
      for (const resultMemory of route.accepted) {
        const grounded = groundMemoryLedAnchor({ response, resultMemory, recall: recalled });
        if (grounded.status !== "grounded") continue;
        candidates.push({
          id: `memory-anchor-${route.role}-${grounded.roomId}`,
          rationale: `由${route.role}结果侧记忆与当前场景侧房间记忆共同生成`,
          triggeredBy: ["q_after", ...(grounded.completionMemoryId ? ["q_before"] : [])],
          recalledMemoryIds: [
            grounded.resultMemoryId,
            ...(grounded.completionMemoryId ? [grounded.completionMemoryId] : []),
          ],
          steps: grounded.steps,
          recallEvidence: {
            qAfterRole: route.role,
            qAfterAccepted: clone(route.accepted),
            qBeforeAccepted: clone(recalled.qBefore.accepted),
          },
        });
      }
    }
    return candidates.slice(0, 3);
  }
}

module.exports = {
  MemoryLedMulticutpointController,
  bestVisibleRoom,
  groundMemoryLedAnchor,
  stableDice,
};
