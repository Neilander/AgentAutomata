"use strict";

const CONTRACT = require("./map-contract");

class SeededRng {
  constructor(seed) {
    this.state = (Number(seed) >>> 0) || 1;
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }

  d6() {
    return 1 + Math.floor(this.next() * 6);
  }
}

function createGame(map, seed = 1) {
  CONTRACT.validateMap(map);
  const state = {
    schema: "ufs_standard_game_state_v1",
    mapId: map.id,
    seed,
    rngState: (Number(seed) >>> 0) || 1,
    round: 0,
    phase: "new_round",
    energy: map.city.startEnergy,
    damage: 0,
    researchIndex: 0,
    excavatorIndex: map.base.startExcavatorIndex,
    mothershipRow: -1,
    ships: Array.from({ length: map.columns }, (_, column) => ({
      id: `purple-${column}`,
      color: "purple",
      column,
      row: map.sky.dropRow,
    })),
    waitingShips: [],
    dice: [],
    placements: [],
    robots: [],
    nextWhiteId: 1,
    nextRobotId: 1,
    history: [],
    outcome: null,
  };
  return startRound(map, state);
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function startRound(map, input) {
  const state = cloneState(input);
  assertOngoing(state);
  const rng = rngFromState(state);
  state.round += 1;
  state.phase = "dice";
  state.dice = ["gray", "gray", "gray", "white", "white"].map((color, index) => ({
    id: `r${state.round}-${color}-${index}`,
    color,
    value: rng.d6(),
    placed: false,
  }));
  applyFirstRollAbility(map, state);
  state.placements = [];
  storeRng(state, rng);
  state.history.push({ type: "round_started", round: state.round, dice: state.dice.map(dieView) });
  return state;
}

function legalWorkerPlacements(map, state, dieId) {
  if (state.phase !== "dice") return [];
  const die = state.dice.find((candidate) => candidate.id === dieId && !candidate.placed);
  if (!die) return [];
  const usedColumns = new Set(state.placements.map((placement) => placement.column));
  const alreadyExcavating = state.placements.some((placement) => placement.excavationCandidate);
  const indexes = CONTRACT.indexMap(map);
  const options = [];
  for (const cell of map.base.cells) {
    if (usedColumns.has(cell.column)) continue;
    const room = indexes.roomById.get(cell.roomId);
    const locked = cell.unlockIndex > state.excavatorIndex;
    const distance = cell.unlockIndex - state.excavatorIndex;
    if (locked && (alreadyExcavating || distance > die.value)) continue;
    options.push({
      id: `${die.id}@${cell.id}`,
      dieId: die.id,
      dieColor: die.color,
      dieValue: die.value,
      cellId: cell.id,
      roomId: room.id,
      roomType: room.type,
      column: cell.column,
      excavationCandidate: locked,
      excavationDistance: locked ? distance : 0,
      removesRobotId: state.robots.find((robot) => robot.cellId === cell.id)?.id || null,
    });
  }
  return options;
}

function allLegalWorkerPlacements(map, state) {
  return state.dice.filter((die) => !die.placed).flatMap((die) => legalWorkerPlacements(map, state, die.id));
}

function applyWorkerPlacement(map, input, requested, options = {}) {
  const state = cloneState(input);
  assertOngoing(state);
  const legal = legalWorkerPlacements(map, state, requested.dieId).find((candidate) => candidate.id === requested.id);
  if (!legal) throw new Error(`illegal worker placement: ${requested.id}`);
  const die = state.dice.find((candidate) => candidate.id === legal.dieId);
  die.placed = true;
  if (legal.removesRobotId) state.robots = state.robots.filter((robot) => robot.id !== legal.removesRobotId);
  state.placements.push({ ...legal, resolved: false });

  const descent = Math.max(0, die.value - (legal.roomType === "aa" ? 1 : 0));
  const shipEvents = moveShipsAndResolveLanding(map, state, legal.column, descent);
  state.history.push({
    type: "worker_placed",
    round: state.round,
    die: dieView(die),
    placement: legal,
    descent,
    shipEvents,
  });
  if (state.outcome) return state;

  if (die.color === "white" && state.dice.some((candidate) => !candidate.placed)
    && options.rerollMode !== "deferred") {
    rerollUnplaced(state, options.rerollMode || "actual");
  }
  if (state.dice.every((candidate) => candidate.placed)) state.phase = "rooms";
  return state;
}

function moveShipsAndResolveLanding(map, state, column, descent) {
  if (descent <= 0) return [];
  const events = [];
  const moving = state.ships.filter((ship) => ship.column === column);
  for (const ship of moving) ship.row += descent;

  for (const ship of [...moving]) {
    if (!state.ships.some((candidate) => candidate.id === ship.id)) continue;
    if (ship.row >= map.sky.cityRow) {
      state.ships = state.ships.filter((candidate) => candidate.id !== ship.id);
      state.waitingShips.push({ id: ship.id, color: ship.color });
      damageCity(map, state, 1, "ship_hit");
      events.push({ shipId: ship.id, type: "city_hit" });
    } else {
      events.push({ shipId: ship.id, type: "descended", row: ship.row });
    }
    if (state.outcome) return events;
  }

  const indexes = CONTRACT.indexMap(map);
  const landed = state.ships
    .filter((ship) => ship.column === column && moving.some((candidate) => candidate.id === ship.id))
    .sort((a, b) => a.row - b.row || a.id.localeCompare(b.id));
  for (const ship of landed) {
    if (!state.ships.some((candidate) => candidate.id === ship.id)) continue;
    const effect = indexes.skyRowByIndex.get(ship.row)?.cells?.[ship.column]?.effect;
    if (!effect) continue;
    if (effect.type === "arrow") {
      const occupied = state.ships.some((candidate) => candidate.id !== ship.id
        && candidate.row === effect.targetRow && candidate.column === effect.targetColumn);
      if (!occupied) {
        const from = { row: ship.row, column: ship.column };
        ship.row = effect.targetRow;
        ship.column = effect.targetColumn;
        events.push({ shipId: ship.id, type: "arrow", from, to: { row: ship.row, column: ship.column } });
      } else {
        events.push({ shipId: ship.id, type: "arrow_blocked" });
      }
    } else if (effect.type === "mothership_down") {
      const amount = effect.amount || 1;
      for (let step = 0; step < amount && !state.outcome; step += 1) moveMothershipOnly(map, state, "sky_trigger");
      events.push({ shipId: ship.id, type: "mothership_down", amount });
    }
  }
  return events;
}

function legalRoomActions(map, state) {
  if (state.phase !== "rooms") return [];
  const indexes = CONTRACT.indexMap(map);
  const actions = [];
  for (const placement of state.placements.filter((candidate) => !candidate.resolved && candidate.excavationCandidate)) {
    actions.push({
      type: "excavate",
      placementId: placement.id,
      targetIndex: indexes.cellById.get(placement.cellId).unlockIndex,
      affordable: state.energy >= 1,
    });
  }
  for (const room of map.base.rooms) {
    const sources = completeRoomSources(map, state, room);
    if (!sources) continue;
    actions.push({
      type: "resolve_room",
      roomId: room.id,
      sourceIds: sources.map((source) => source.id),
      roomType: room.type,
      value: sources.reduce((sum, source) => sum + source.value, room.modifier),
      affordable: state.energy >= room.energyCost,
    });
  }
  for (const placement of state.placements.filter((candidate) => !candidate.resolved)) {
    actions.push({ type: "skip_worker", placementId: placement.id });
  }
  for (const robot of state.robots) actions.push({ type: "remove_robot", robotId: robot.id });
  actions.push({ type: "end_rooms" });
  return actions;
}

function applyRoomAction(map, input, action) {
  const state = cloneState(input);
  if (state.phase !== "rooms") throw new Error(`cannot resolve room action during ${state.phase}`);
  if (action.type === "skip_worker") return skipWorker(state, action.placementId);
  if (action.type === "remove_robot") {
    if (!state.robots.some((robot) => robot.id === action.robotId)) throw new Error(`unknown robot ${action.robotId}`);
    state.robots = state.robots.filter((robot) => robot.id !== action.robotId);
    state.history.push({ type: "robot_removed", robotId: action.robotId });
    return state;
  }
  if (action.type === "excavate") return resolveExcavation(map, state, action);
  if (action.type === "resolve_room") return resolveRoom(map, state, action);
  if (action.type === "end_rooms") return endRooms(state);
  throw new Error(`unknown room action: ${action.type}`);
}

function resolveExcavation(map, state, action) {
  const indexes = CONTRACT.indexMap(map);
  const placement = state.placements.find((candidate) => candidate.id === action.placementId && !candidate.resolved);
  if (!placement?.excavationCandidate) throw new Error(`not an unresolved excavation placement: ${action.placementId}`);
  if (state.energy < 1) throw new Error("insufficient energy for excavation");
  const targetIndex = indexes.cellById.get(placement.cellId).unlockIndex;
  if (targetIndex <= state.excavatorIndex || targetIndex - state.excavatorIndex > placement.dieValue) {
    throw new Error("illegal excavation distance");
  }
  state.energy -= 1;
  state.excavatorIndex = targetIndex;
  placement.resolved = true;
  state.history.push({ type: "excavated", placementId: placement.id, targetIndex });
  return state;
}

function resolveRoom(map, state, action) {
  const indexes = CONTRACT.indexMap(map);
  const room = indexes.roomById.get(action.roomId);
  if (!room) throw new Error(`unknown room: ${action.roomId}`);
  const sources = completeRoomSources(map, state, room);
  if (!sources) throw new Error(`room is not complete: ${room.id}`);
  const expectedIds = sources.map((source) => source.id).sort();
  const requestedIds = [...(action.sourceIds || [])].sort();
  if (JSON.stringify(expectedIds) !== JSON.stringify(requestedIds)) throw new Error(`room source mismatch: ${room.id}`);
  if (state.energy < room.energyCost) throw new Error(`insufficient energy for room: ${room.id}`);

  const value = Math.max(0, sources.reduce((sum, source) => sum + source.value, room.modifier));
  state.energy -= room.energyCost;
  const result = { type: room.type, roomId: room.id, value, energyCost: room.energyCost };

  if (room.type === "energy") {
    const before = state.energy;
    state.energy = Math.min(map.city.maxEnergy, state.energy + value);
    result.gained = state.energy - before;
  } else if (room.type === "fighter") {
    result.destroyed = destroyShips(map, state, value);
  } else if (room.type === "research") {
    const maxSteps = maxResearchAdvance(map, state, room, value);
    const steps = action.advanceSteps == null ? maxSteps : action.advanceSteps;
    if (!Number.isInteger(steps) || steps < 0 || steps > maxSteps) throw new Error(`illegal research advance: ${steps}/${maxSteps}`);
    state.researchIndex += steps;
    result.advanced = steps;
    if (state.researchIndex >= map.research.costs.length) win(state);
  } else if (room.type === "robot") {
    result.installed = installRobot(map, state, action, value);
  } else if (room.type !== "aa" && room.type !== "tunnel") {
    throw new Error(`unsupported room type: ${room.type}`);
  }

  consumeSources(state, sources);
  state.history.push({ type: "room_resolved", ...result });
  return state;
}

function completeRoomSources(map, state, room) {
  const sources = [];
  for (const cellId of room.cellIds) {
    const placement = state.placements.find((candidate) => candidate.cellId === cellId && !candidate.resolved);
    if (placement) {
      if (placement.excavationCandidate) return null;
      sources.push({ id: placement.id, kind: "worker", cellId, value: placement.dieValue });
      continue;
    }
    const robot = state.robots.find((candidate) => candidate.cellId === cellId && !candidate.exhausted);
    if (robot) {
      sources.push({ id: robot.id, kind: "robot", cellId, value: robot.value });
      continue;
    }
    return null;
  }
  return sources;
}

function maxResearchAdvance(map, state, room, value) {
  let budget = value;
  let steps = 0;
  while (state.researchIndex + steps < map.research.costs.length) {
    const nextIndex = state.researchIndex + steps;
    const reachesTop = nextIndex === map.research.costs.length - 1;
    if (reachesTop && map.research.finalRequiresMultiSpace && room.cellIds.length < 2) break;
    const cost = map.research.costs[nextIndex];
    if (cost > budget) break;
    budget -= cost;
    steps += 1;
  }
  return steps;
}

function installRobot(map, state, action, roomValue) {
  const indexes = CONTRACT.indexMap(map);
  const target = indexes.cellById.get(action.targetCellId);
  if (!target || target.unlockIndex > state.excavatorIndex) throw new Error("robot target must be an excavated cell");
  if (state.placements.some((placement) => placement.cellId === target.id && !placement.resolved)
    || state.robots.some((robot) => robot.cellId === target.id)) throw new Error("robot target is occupied");
  if (state.robots.length >= map.city.robotLimit) {
    if (!action.removeRobotId || !state.robots.some((robot) => robot.id === action.removeRobotId)) {
      throw new Error("robot limit reached; removeRobotId required");
    }
    state.robots = state.robots.filter((robot) => robot.id !== action.removeRobotId);
  }
  const robot = {
    id: `robot-${state.nextRobotId}`,
    cellId: target.id,
    value: Math.min(6, roomValue),
    exhausted: true,
    installedRound: state.round,
  };
  state.nextRobotId += 1;
  state.robots.push(robot);
  return { ...robot };
}

function consumeSources(state, sources) {
  for (const source of sources) {
    if (source.kind === "worker") {
      const placement = state.placements.find((candidate) => candidate.id === source.id);
      placement.resolved = true;
    } else {
      const robot = state.robots.find((candidate) => candidate.id === source.id);
      if (!robot) continue;
      robot.value -= 1;
      robot.exhausted = true;
      if (robot.value <= 0) state.robots = state.robots.filter((candidate) => candidate.id !== robot.id);
    }
  }
}

function skipWorker(state, placementId) {
  const placement = state.placements.find((candidate) => candidate.id === placementId && !candidate.resolved);
  if (!placement) throw new Error(`unknown unresolved worker: ${placementId}`);
  placement.resolved = true;
  state.history.push({ type: "worker_skipped", placementId });
  return state;
}

function endRooms(state) {
  for (const placement of state.placements) placement.resolved = true;
  for (const robot of state.robots) robot.exhausted = false;
  state.phase = "mothership";
  state.history.push({ type: "rooms_ended", round: state.round });
  return state;
}

function resolveMothership(map, input, options = {}) {
  const state = cloneState(input);
  if (state.phase !== "mothership") throw new Error(`cannot resolve mothership during ${state.phase}`);
  moveMothershipOnly(map, state, "mothership_phase");
  if (state.outcome) return state;
  const indexes = CONTRACT.indexMap(map);
  const row = indexes.skyRowByIndex.get(state.mothershipRow);
  for (const action of row?.mothershipActions || []) {
    applyMothershipAction(map, state, action);
    if (state.outcome) return state;
  }
  if (options.deferSpawns === true) {
    state.phase = "spawning";
    return state;
  }
  spawnWaitingShips(map, state, options.spawnPolicy);
  state.history.push({ type: "mothership_phase_ended", round: state.round, mothershipRow: state.mothershipRow });
  if (!state.outcome && options.startNextRound !== false) return startRound(map, state);
  if (!state.outcome) state.phase = "new_round";
  return state;
}

function nextSpawnChoice(map, state) {
  if (state.phase !== "spawning") return null;
  const waiting = [...state.waitingShips]
    .sort((a, b) => colorPriority(a.color) - colorPriority(b.color))[0];
  if (!waiting) return null;
  const openColumns = Array.from({ length: map.columns }, (_, column) => column)
    .filter((column) => !state.ships.some((ship) => (
      ship.column === column && ship.row === map.sky.dropRow
    )));
  if (!openColumns.length) return null;
  const emptyColumns = openColumns.filter((column) => (
    !state.ships.some((ship) => ship.column === column)
  ));
  let candidates = emptyColumns;
  if (!candidates.length) {
    const distances = openColumns.map((column) => ({
      column,
      distance: Math.min(...state.ships
        .filter((ship) => ship.column === column)
        .map((ship) => ship.row)) - map.sky.dropRow,
    }));
    const farthest = Math.max(...distances.map((row) => row.distance));
    candidates = distances.filter((row) => row.distance === farthest).map((row) => row.column);
  }
  return { waiting: { ...waiting }, candidates };
}

function applySpawnChoice(map, input, requested) {
  const state = cloneState(input);
  const next = nextSpawnChoice(map, state);
  if (!next) throw new Error("no spawn choice is pending");
  if (requested.shipId !== next.waiting.id || !next.candidates.includes(requested.column)) {
    throw new Error(`illegal spawn choice: ${requested.shipId}@${requested.column}`);
  }
  state.waitingShips = state.waitingShips.filter((ship) => ship.id !== requested.shipId);
  state.ships.push({
    id: next.waiting.id,
    color: next.waiting.color,
    column: requested.column,
    row: map.sky.dropRow,
  });
  state.history.push({
    type: "ship_spawned",
    shipId: next.waiting.id,
    column: requested.column,
  });
  return state;
}

function finishDeferredMothership(state) {
  const next = cloneState(state);
  if (next.phase !== "spawning") throw new Error(`cannot finish spawning during ${next.phase}`);
  next.phase = next.outcome ? next.phase : "new_round";
  next.history.push({
    type: "mothership_phase_ended",
    round: next.round,
    mothershipRow: next.mothershipRow,
  });
  return next;
}

function moveMothershipOnly(map, state, source) {
  state.mothershipRow += 1;
  const collected = state.ships.filter((ship) => ship.row === state.mothershipRow);
  if (collected.length) {
    state.ships = state.ships.filter((ship) => ship.row !== state.mothershipRow);
    state.waitingShips.push(...collected.map((ship) => ({ id: ship.id, color: ship.color })));
  }
  state.history.push({ type: "mothership_moved", source, row: state.mothershipRow, collected: collected.map((ship) => ship.id) });
  if (state.mothershipRow >= map.sky.skullRow) lose(state, "mothership_reached_skull");
}

function applyMothershipAction(map, state, action) {
  if (action.type === "damage") {
    damageCity(map, state, action.amount, "mothership_action");
  } else if (action.type === "research_back") {
    state.researchIndex = Math.max(0, state.researchIndex - action.amount);
  } else if (action.type === "excavator_back") {
    state.excavatorIndex = Math.max(map.base.startExcavatorIndex, state.excavatorIndex - action.amount);
    const indexes = CONTRACT.indexMap(map);
    state.robots = state.robots.filter((robot) => indexes.cellById.get(robot.cellId).unlockIndex <= state.excavatorIndex);
  } else if (action.type === "spawn_white") {
    const whiteLimit = map.whiteShipPool || 4;
    const activeWhites = state.ships.filter((ship) => ship.color === "white").length
      + state.waitingShips.filter((ship) => ship.color === "white").length;
    const amount = Math.min(action.amount, Math.max(0, whiteLimit - activeWhites));
    for (let index = 0; index < amount; index += 1) {
      state.waitingShips.push({ id: `white-${state.nextWhiteId}`, color: "white" });
      state.nextWhiteId += 1;
    }
  } else {
    throw new Error(`unknown mothership action: ${action.type}`);
  }
  state.history.push({ type: "mothership_action", action: { ...action } });
}

function spawnWaitingShips(map, state, spawnPolicy = null) {
  const ordered = [...state.waitingShips].sort((a, b) => colorPriority(a.color) - colorPriority(b.color));
  const remaining = [];
  state.waitingShips = [];
  for (const waiting of ordered) {
    const openColumns = Array.from({ length: map.columns }, (_, column) => column)
      .filter((column) => !state.ships.some((ship) => ship.column === column && ship.row === map.sky.dropRow));
    if (!openColumns.length) {
      remaining.push(waiting);
      continue;
    }
    const emptyColumns = openColumns.filter((column) => !state.ships.some((ship) => ship.column === column));
    let candidates = emptyColumns;
    if (!candidates.length) {
      const distances = openColumns.map((column) => ({
        column,
        distance: Math.min(...state.ships.filter((ship) => ship.column === column).map((ship) => ship.row)) - map.sky.dropRow,
      }));
      const farthest = Math.max(...distances.map((row) => row.distance));
      candidates = distances.filter((row) => row.distance === farthest).map((row) => row.column);
    }
    const chosen = spawnPolicy ? spawnPolicy({ waiting: { ...waiting }, candidates: [...candidates], state: cloneState(state) }) : Math.min(...candidates);
    if (!candidates.includes(chosen)) throw new Error(`spawn policy selected illegal column: ${chosen}`);
    state.ships.push({ id: waiting.id, color: waiting.color, column: chosen, row: map.sky.dropRow });
  }
  state.waitingShips.push(...remaining);
}

function destroyShips(map, state, strength) {
  const indexes = CONTRACT.indexMap(map);
  const destroyed = [];
  for (const ship of [...state.ships]) {
    const threshold = indexes.skyRowByIndex.get(ship.row)?.cells?.[ship.column]?.explosion;
    if (threshold == null || threshold > strength) continue;
    destroyed.push({ id: ship.id, color: ship.color, threshold });
    state.ships = state.ships.filter((candidate) => candidate.id !== ship.id);
    if (ship.color === "purple") state.waitingShips.push({ id: ship.id, color: ship.color });
  }
  return destroyed;
}

function rerollUnplaced(state, mode) {
  const before = state.dice.filter((die) => !die.placed).map(dieView);
  if (mode === "expected") {
    const values = [3, 4, 3, 4, 3];
    let cursor = 0;
    for (const die of state.dice.filter((candidate) => !candidate.placed)) {
      die.value = values[cursor % values.length];
      cursor += 1;
    }
  } else {
    const rng = rngFromState(state);
    for (const die of state.dice.filter((candidate) => !candidate.placed)) die.value = rng.d6();
    storeRng(state, rng);
  }
  state.history.push({ type: "white_reroll", before, after: state.dice.filter((die) => !die.placed).map(dieView), mode });
}

function applyFirstRollAbility(map, state) {
  const ability = map.city.firstRoll;
  if (!ability || ability.type !== "set_die") return;
  const candidates = state.dice.filter((die) => ability.color === "any" || die.color === ability.color);
  const die = candidates[ability.ordinal || 0];
  if (die) die.value = ability.value;
}

function damageCity(map, state, amount, reason) {
  state.damage += amount;
  state.history.push({ type: "city_damaged", amount, reason, damage: state.damage });
  if (state.damage >= map.city.maxDamage) lose(state, "maximum_damage");
}

function win(state) {
  state.outcome = { result: "win", reason: "research_complete", round: state.round };
  state.phase = "won";
}

function lose(state, reason) {
  state.outcome = { result: "loss", reason, round: state.round };
  state.phase = "lost";
}

function assertOngoing(state) {
  if (state.outcome) throw new Error(`game already ended: ${state.outcome.result}`);
}

function rngFromState(state) {
  return new SeededRng(state.rngState);
}

function storeRng(state, rng) {
  state.rngState = rng.state;
}

function dieView(die) {
  return { id: die.id, color: die.color, value: die.value };
}

function colorPriority(color) {
  return color === "purple" ? 0 : 1;
}

module.exports = {
  SeededRng,
  allLegalWorkerPlacements,
  applyRoomAction,
  applySpawnChoice,
  applyWorkerPlacement,
  cloneState,
  createGame,
  legalRoomActions,
  legalWorkerPlacements,
  maxResearchAdvance,
  nextSpawnChoice,
  finishDeferredMothership,
  resolveMothership,
  spawnWaitingShips,
  startRound,
};

