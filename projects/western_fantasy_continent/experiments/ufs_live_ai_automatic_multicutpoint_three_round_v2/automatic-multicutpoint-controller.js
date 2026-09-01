"use strict";

function clone(value) {
  return structuredClone(value);
}

function visibleRoomIndex(response) {
  return new Map((response.mapView?.rooms || []).map((room) => [room.id, room]));
}

function visibleOpenCells(response) {
  const occupied = new Set((response.observation?.placements || []).map((row) => row.cellId));
  const rooms = visibleRoomIndex(response);
  const excavatorIndex = Number(response.observation?.excavatorIndex || 0);
  return (response.mapView?.baseCells || [])
    .filter((cell) => !occupied.has(cell.id)
      && rooms.has(cell.roomId)
      && Number(cell.unlockIndex || 0) <= excavatorIndex)
    .map((cell) => ({ ...clone(cell), room: clone(rooms.get(cell.roomId)) }));
}

function macroIntent(response) {
  const q = response.observation || {};
  const threat = (q.ships || []).reduce((sum, ship) => sum + Number(ship.row || 0), 0);
  if (q.energy <= 2) {
    return {
      id: "restore-energy-before-expensive-progress",
      text: "先形成可结算能源房，避免研究或战斗机支付把能源压到不可恢复区；剩余骰子控制可见威胁。",
      priorities: ["energy", "research", "fighter", "aa", "tunnel"],
      qBasis: { energy: q.energy, researchIndex: q.researchIndex, visibleThreatRows: threat },
    };
  }
  if (threat >= 8) {
    return {
      id: "advance-research-under-visible-threat",
      text: "保持能源余量的同时推进研究，并优先使用战斗机或防空处理已看见的高位威胁。",
      priorities: ["research", "fighter", "aa", "energy", "tunnel"],
      qBasis: { energy: q.energy, researchIndex: q.researchIndex, visibleThreatRows: threat },
    };
  }
  return {
    id: "research-with-energy-support",
    text: "用当前能源换取研究推进，同时补充能源并用剩余骰子产生威胁控制或隧道收益。",
    priorities: ["research", "energy", "fighter", "aa", "tunnel"],
    qBasis: { energy: q.energy, researchIndex: q.researchIndex, visibleThreatRows: threat },
  };
}

function roomTypeForCell(cell) {
  return cell.room?.type || null;
}

function candidateOrders(intent) {
  const base = intent.priorities;
  const variants = [
    { id: "intent-first", order: base },
    { id: "resource-first", order: ["energy", "research", "fighter", "aa", "tunnel"] },
    { id: "threat-first", order: ["fighter", "aa", "research", "energy", "tunnel"] },
  ];
  const seen = new Set();
  return variants.filter((variant) => {
    const key = variant.order.join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dieAnchor(dieId) {
  return { collection: "dice", match: { id: dieId, placed: false } };
}

function shipAnchorForCell(response, cell) {
  const ship = (response.observation?.ships || [])
    .filter((row) => row.column === cell.column)
    .sort((left, right) => right.row - left.row)[0];
  if (!ship) return null;
  return { collection: "ships", match: { id: ship.id, column: ship.column } };
}

function chooseCell({ response, openCells, usedCells, usedColumns, desiredType }) {
  const rows = openCells.filter((cell) => (
    !usedCells.has(cell.id)
    && !usedColumns.has(cell.column)
    && roomTypeForCell(cell) === desiredType
  ));
  if (desiredType === "aa") {
    rows.sort((left, right) => {
      const leftThreat = (response.observation?.ships || [])
        .filter((ship) => ship.column === left.column)
        .reduce((max, ship) => Math.max(max, ship.row), -1);
      const rightThreat = (response.observation?.ships || [])
        .filter((ship) => ship.column === right.column)
        .reduce((max, ship) => Math.max(max, ship.row), -1);
      return rightThreat - leftThreat || left.id.localeCompare(right.id);
    });
  }
  return rows[0] || null;
}

function buildPlacementSteps(response, order, { knownOccupiedColumns = [] } = {}) {
  const dice = (response.observation?.dice || []).filter((die) => !die.placed);
  const openCells = visibleOpenCells(response);
  const usedCells = new Set();
  const usedColumns = new Set((response.observation?.placements || [])
    .filter((row) => row.resolved === false)
    .map((row) => row.column));
  for (const column of knownOccupiedColumns) usedColumns.add(column);
  const steps = [];
  const remaining = [...dice].sort((left, right) => {
    if (left.color !== right.color) return left.color === "white" ? -1 : 1;
    return right.value - left.value || left.id.localeCompare(right.id);
  });

  const roomDemand = new Map();
  for (const cell of openCells) {
    const type = roomTypeForCell(cell);
    if (!roomDemand.has(type)) roomDemand.set(type, 0);
    roomDemand.set(type, Math.max(roomDemand.get(type), cell.room.cellIds?.length || 1));
  }

  const expandedOrder = [];
  for (const type of order) {
    const count = type === "energy" ? Math.min(2, roomDemand.get(type) || 0) : 1;
    for (let index = 0; index < count; index += 1) expandedOrder.push(type);
  }
  for (const type of ["aa", "tunnel", "fighter", "research", "energy"]) {
    while (expandedOrder.length < remaining.length && openCells.some((cell) => (
      roomTypeForCell(cell) === type && !usedCells.has(cell.id)
    ))) expandedOrder.push(type);
  }

  while (remaining.length > 0) {
    const die = remaining.shift();
    let cell = null;
    let desiredType = null;
    while (expandedOrder.length > 0 && !cell) {
      desiredType = expandedOrder.shift();
      cell = chooseCell({ response, openCells, usedCells, usedColumns, desiredType });
    }
    if (!cell) cell = openCells.find((row) => (
      !usedCells.has(row.id) && !usedColumns.has(row.column)
    )) || null;
    if (!cell) break;
    usedCells.add(cell.id);
    usedColumns.add(cell.column);
    const threatAnchor = roomTypeForCell(cell) === "aa" ? shipAnchorForCell(response, cell) : null;
    steps.push({
      id: `place-${die.id}-to-${cell.id}`,
      operation: { type: "place_die", dieId: die.id, cellId: cell.id },
      anchor: threatAnchor || dieAnchor(die.id),
      rationale: {
        role: roomTypeForCell(cell),
        source: threatAnchor ? "visible-threat-anchor" : "visible-die-and-room-anchor",
      },
    });
  }
  return steps;
}

function operationCandidate(id, operation, rationale, anchor = null) {
  return {
    id,
    rationale,
    steps: [{
      id,
      operation: clone(operation),
      ...(anchor ? { anchor: clone(anchor) } : {}),
    }],
  };
}

function candidatesForNonDice(response, intent) {
  const pending = response.pending || {};
  const available = new Set(response.availableOperations || []);
  if (available.has("choose_research_advance")) {
    const contract = (response.operationContracts || [])
      .find((row) => row.type === "choose_research_advance");
    const maximum = contract?.fields?.advanceSteps?.maximum ?? pending.maxAdvanceSteps ?? 0;
    const values = [...new Set([maximum, Math.max(0, maximum - 1), 0])].slice(0, 3);
    return values.map((advanceSteps) => operationCandidate(
      `research-advance-${advanceSteps}`,
      { type: "choose_research_advance", roomId: pending.roomId, advanceSteps },
      `从公开上限${maximum}中选择推进${advanceSteps}步`,
    ));
  }
  if (available.has("choose_spawn")) {
    return (pending.candidates || []).slice(0, 3).map((dropPointId) => operationCandidate(
      `spawn-${pending.shipId}-${dropPointId}`,
      { type: "choose_spawn", shipId: pending.shipId, dropPointId },
      "只比较当前公开出生点，不读取host",
    ));
  }
  if (available.has("resolve_room")) {
    const ids = pending.candidates?.resolvableRoomIds || [];
    const rooms = visibleRoomIndex(response);
    const priority = new Map(intent.priorities.map((type, index) => [type, index]));
    const roomCandidates = [...ids].sort((left, right) => {
      const lp = priority.get(rooms.get(left)?.type) ?? 99;
      const rp = priority.get(rooms.get(right)?.type) ?? 99;
      return lp - rp || left.localeCompare(right);
    }).slice(0, available.has("end_rooms") ? 2 : 3).map((roomId) => operationCandidate(
      `resolve-${roomId}`,
      { type: "resolve_room", roomId, pay: true },
      `按宏观意图优先级结算公开房间${roomId}`,
    ));
    if (available.has("end_rooms")) {
      roomCandidates.push(operationCandidate(
        "end-rooms-fallback",
        { type: "end_rooms" },
        "认知设想若不支持剩余房间效果，则保守结束房间阶段",
      ));
    }
    return roomCandidates;
  }
  if (available.has("excavate")) {
    return (pending.candidates?.excavationPlacementIds || []).slice(0, 3).map((placementId) => (
      operationCandidate(`excavate-${placementId}`, { type: "excavate", placementId }, "公开可挖掘工人")
    ));
  }
  if (available.has("end_rooms")) {
    return [operationCandidate("end-rooms", { type: "end_rooms" }, "无更高价值公开房间动作，结束房间阶段")];
  }
  if (available.has("skip_worker")) {
    return (pending.candidates?.skippablePlacementIds || []).slice(0, 1).map((placementId) => (
      operationCandidate(`skip-${placementId}`, { type: "skip_worker", placementId }, "公开房间不可结算，跳过工人")
    ));
  }
  return [];
}

function generateCandidates(response, intent = macroIntent(response), context = {}) {
  if (response.observation?.phase === "dice" && response.availableOperations?.includes("place_die")) {
    return candidateOrders(intent).map((variant) => ({
      id: variant.id,
      rationale: `由${intent.id}切入口生成${variant.order.join("→")}的少量锚点序列`,
      steps: buildPlacementSteps(response, variant.order, context),
    })).filter((candidate) => candidate.steps.length > 0).slice(0, 3);
  }
  return candidatesForNonDice(response, intent);
}

function candidatePreference(candidate, imagination, response, intent) {
  if (!["complete", "paused_random"].includes(imagination.status)) return -Infinity;
  if (!imagination.trace?.[0]?.imagined) return -Infinity;
  const operation = candidate.steps[0].operation;
  let score = 100;
  if (operation.type === "place_die") {
    const cell = (response.mapView?.baseCells || []).find((row) => row.id === operation.cellId);
    const room = (response.mapView?.rooms || []).find((row) => row.id === cell?.roomId);
    const index = intent.priorities.indexOf(room?.type);
    score += index < 0 ? 0 : 20 - index * 3;
    const die = (response.observation?.dice || []).find((row) => row.id === operation.dieId);
    if (die?.color === "white") score += 5;
  } else if (operation.type === "choose_research_advance") {
    score += operation.advanceSteps * 5;
  } else if (operation.type === "resolve_room") {
    const room = (response.mapView?.rooms || []).find((row) => row.id === operation.roomId);
    const index = intent.priorities.indexOf(room?.type);
    score += index < 0 ? 10 : 30 - index * 4;
  } else if (operation.type === "end_rooms") {
    score -= 20;
  } else if (operation.type === "choose_spawn") {
    const point = Number(String(operation.dropPointId).match(/(\d+)$/u)?.[1] || 1) - 1;
    const load = (response.observation?.ships || [])
      .filter((ship) => ship.column === point)
      .reduce((sum, ship) => sum + ship.row + 1, 0);
    score -= load;
  }
  score += Math.min(5, imagination.automaticTrajectoryCount || 0);
  return score;
}

module.exports = {
  candidatePreference,
  generateCandidates,
  macroIntent,
  visibleOpenCells,
};
