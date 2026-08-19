"use strict";

const CONFIG = require("./game-config");

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

function createGame(seed = 1) {
  const state = {
    schema: "ufs_planning_game_state_v0",
    seed,
    rngState: (Number(seed) >>> 0) || 1,
    round: 0,
    phase: "new_round",
    energy: 2,
    damage: 0,
    research: 0,
    excavatorDepth: 0,
    mothership: 0,
    ships: Array.from({ length: CONFIG.COLUMNS }, (_, column) => ({
      id: `purple-${column}`,
      kind: "purple",
      column,
      row: 0,
    })),
    waitingShips: [],
    dice: [],
    placements: [],
    history: [],
    outcome: null,
  };
  return startRound(state);
}

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function startRound(input) {
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
  state.placements = [];
  storeRng(state, rng);
  state.history.push({ type: "round_started", round: state.round, dice: state.dice.map(dieView) });
  return state;
}

function legalPlacements(state, dieId) {
  if (state.phase !== "dice") return [];
  const die = state.dice.find((row) => row.id === dieId && !row.placed);
  if (!die) return [];
  const usedColumns = new Set(state.placements.map((row) => row.column));
  const hasExcavation = state.placements.some((row) => row.roomType === "excavate");
  const rows = [];
  for (let column = 0; column < CONFIG.COLUMNS; column += 1) {
    if (usedColumns.has(column)) continue;
    rows.push(makePlacement(die, { id: `aa-c${column}`, column, depth: 0, type: "aa", modifier: 0, energyCost: 0 }));
    for (const room of CONFIG.ROOMS.filter((candidate) => candidate.column === column && candidate.depth <= state.excavatorDepth)) {
      rows.push(makePlacement(die, room));
    }
    const remainingDepth = CONFIG.MAX_EXCAVATION - state.excavatorDepth;
    if (!hasExcavation && remainingDepth > 0) {
      const distance = Math.min(die.value, remainingDepth);
      if (distance > 0) {
        rows.push(makePlacement(die, {
          id: `excavate-c${column}-to${state.excavatorDepth + distance}`,
          column,
          depth: state.excavatorDepth + distance,
          type: "excavate",
          modifier: 0,
          energyCost: 1,
        }));
      }
    }
  }
  return rows;
}

function allLegalPlacements(state) {
  return state.dice
    .filter((die) => !die.placed)
    .flatMap((die) => legalPlacements(state, die.id));
}

function applyPlacement(input, placement, options = {}) {
  const state = cloneState(input);
  assertOngoing(state);
  const legal = legalPlacements(state, placement.dieId).find((row) => row.id === placement.id);
  if (!legal) throw new Error(`illegal placement: ${placement.id}`);
  const die = state.dice.find((row) => row.id === legal.dieId);
  die.placed = true;
  state.placements.push(legal);

  const descent = Math.max(0, die.value - (legal.roomType === "aa" ? 1 : 0));
  const shipEvents = moveShipsInColumn(state, legal.column, descent);
  state.history.push({
    type: "die_placed",
    round: state.round,
    die: dieView(die),
    placement: legal,
    descent,
    shipEvents,
  });
  if (state.outcome) return state;

  if (die.color === "white" && state.dice.some((row) => !row.placed)) {
    rerollUnplaced(state, options.rerollMode || "actual");
  }
  if (state.dice.every((row) => row.placed)) state.phase = "rooms";
  return state;
}

function resolveRooms(input, requestedOrder = null) {
  const state = cloneState(input);
  if (state.phase !== "rooms") throw new Error(`cannot resolve rooms during ${state.phase}`);
  const priority = { energy: 0, fighter: 1, research: 2, excavate: 3, aa: 4 };
  const byId = new Map(state.placements.map((row) => [row.id, row]));
  const ordered = requestedOrder
    ? requestedOrder.map((id) => byId.get(id)).filter(Boolean)
    : [...state.placements].sort((a, b) => priority[a.roomType] - priority[b.roomType]);
  const resolutions = [];
  for (const placement of ordered) {
    if (state.outcome) break;
    resolutions.push(resolvePlacement(state, placement));
  }
  state.history.push({ type: "rooms_resolved", round: state.round, resolutions });
  if (!state.outcome) state.phase = "mothership";
  return state;
}

function resolveMothership(input, options = {}) {
  const state = cloneState(input);
  if (state.phase !== "mothership") throw new Error(`cannot move mothership during ${state.phase}`);
  state.mothership += 1;
  if (state.mothership >= CONFIG.MOTHERSHIP_LIMIT) {
    lose(state, "mothership_reached_city");
    return state;
  }
  const event = CONFIG.MOTHERSHIP_EVENTS[state.mothership] || "none";
  if (event === "spawn_white") state.waitingShips.push(makeWaitingWhite(state));
  if (event === "research_back") state.research = Math.max(0, state.research - 1);
  if (event === "damage") damageCity(state, "mothership_event");
  if (event === "excavator_back") state.excavatorDepth = Math.max(0, state.excavatorDepth - 1);
  respawnShips(state);
  state.history.push({ type: "mothership_resolved", round: state.round, position: state.mothership, event });
  if (!state.outcome && options.startNextRound !== false) return startRound(state);
  return state;
}

function playRoundWithPlacements(input, placements, options = {}) {
  let state = cloneState(input);
  for (const placement of placements) state = applyPlacement(state, placement, options);
  if (state.phase === "rooms") state = resolveRooms(state);
  if (state.phase === "mothership" && !state.outcome) state = resolveMothership(state, options);
  return state;
}

function resolvePlacement(state, placement) {
  const value = Math.max(0, placement.dieValue + placement.modifier);
  if (placement.roomType === "aa") return { placementId: placement.id, type: "aa", used: true, value: 0 };
  if (state.energy < placement.energyCost) {
    return { placementId: placement.id, type: placement.roomType, used: false, reason: "insufficient_energy", value };
  }
  state.energy -= placement.energyCost;
  if (placement.roomType === "energy") {
    const before = state.energy;
    state.energy = Math.min(CONFIG.MAX_ENERGY, state.energy + value);
    return { placementId: placement.id, type: "energy", used: true, value, gained: state.energy - before };
  }
  if (placement.roomType === "research") {
    const before = state.research;
    state.research = Math.min(CONFIG.RESEARCH_TARGET, state.research + value);
    if (state.research >= CONFIG.RESEARCH_TARGET) win(state);
    return { placementId: placement.id, type: "research", used: true, value, gained: state.research - before };
  }
  if (placement.roomType === "fighter") {
    const destroyed = destroyShipsOnExplosionSpaces(state, value);
    return { placementId: placement.id, type: "fighter", used: true, value, destroyed };
  }
  if (placement.roomType === "excavate") {
    const before = state.excavatorDepth;
    state.excavatorDepth = Math.max(state.excavatorDepth, placement.depth);
    return { placementId: placement.id, type: "excavate", used: true, value, gained: state.excavatorDepth - before };
  }
  throw new Error(`unknown room type: ${placement.roomType}`);
}

function moveShipsInColumn(state, column, descent) {
  const events = [];
  for (const ship of state.ships.filter((row) => row.column === column)) {
    ship.row += descent;
    if (ship.row >= CONFIG.CITY_ROW) {
      events.push({ shipId: ship.id, event: "city_hit" });
      state.waitingShips.push({ id: ship.id, kind: ship.kind });
      state.ships = state.ships.filter((row) => row.id !== ship.id);
      damageCity(state, "ship_hit");
      if (state.outcome) break;
    } else {
      events.push({ shipId: ship.id, event: "descended", row: ship.row });
    }
  }
  return events;
}

function destroyShipsOnExplosionSpaces(state, strength) {
  const destroyed = [];
  for (const ship of [...state.ships]) {
    const threshold = CONFIG.EXPLOSION_SPACES[ship.column][ship.row];
    if (threshold == null || threshold > strength) continue;
    destroyed.push({ shipId: ship.id, kind: ship.kind, threshold });
    state.ships = state.ships.filter((row) => row.id !== ship.id);
    if (ship.kind === "purple") state.waitingShips.push({ id: ship.id, kind: ship.kind });
  }
  return destroyed;
}

function rerollUnplaced(state, mode) {
  const before = state.dice.filter((row) => !row.placed).map(dieView);
  if (mode === "expected") {
    const expected = [3, 4, 3, 4, 3];
    let cursor = 0;
    for (const die of state.dice.filter((row) => !row.placed)) {
      die.value = expected[cursor % expected.length];
      cursor += 1;
    }
  } else {
    const rng = rngFromState(state);
    for (const die of state.dice.filter((row) => !row.placed)) die.value = rng.d6();
    storeRng(state, rng);
  }
  state.history.push({ type: "white_reroll", round: state.round, before, after: state.dice.filter((row) => !row.placed).map(dieView), mode });
}

function respawnShips(state) {
  const queue = [...state.waitingShips];
  state.waitingShips = [];
  for (const waiting of queue) {
    const column = chooseSpawnColumn(state);
    if (column == null) {
      state.waitingShips.push(waiting);
      continue;
    }
    state.ships.push({ id: waiting.id, kind: waiting.kind, column, row: 0 });
  }
}

function chooseSpawnColumn(state) {
  const rows = Array.from({ length: CONFIG.COLUMNS }, (_, column) => {
    const ships = state.ships.filter((ship) => ship.column === column);
    return { column, count: ships.length, highest: ships.length ? Math.min(...ships.map((ship) => ship.row)) : -1 };
  });
  rows.sort((a, b) => a.count - b.count || b.highest - a.highest || a.column - b.column);
  return rows[0]?.count >= 2 ? null : rows[0]?.column;
}

function makeWaitingWhite(state) {
  const existing = state.ships.filter((row) => row.kind === "white").length
    + state.waitingShips.filter((row) => row.kind === "white").length;
  return { id: `white-${state.round}-${existing}`, kind: "white" };
}

function makePlacement(die, room) {
  return {
    id: `${die.id}@${room.id}`,
    dieId: die.id,
    dieColor: die.color,
    dieValue: die.value,
    roomId: room.id,
    roomType: room.type,
    column: room.column,
    depth: room.depth,
    modifier: room.modifier,
    energyCost: room.energyCost,
  };
}

function dieView(die) {
  return { id: die.id, color: die.color, value: die.value };
}

function damageCity(state, reason) {
  state.damage += 1;
  state.history.push({ type: "city_damaged", round: state.round, reason, damage: state.damage });
  if (state.damage >= CONFIG.MAX_DAMAGE) lose(state, "maximum_damage");
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

module.exports = {
  SeededRng,
  allLegalPlacements,
  applyPlacement,
  cloneState,
  createGame,
  legalPlacements,
  playRoundWithPlacements,
  resolveMothership,
  resolveRooms,
  startRound,
};
