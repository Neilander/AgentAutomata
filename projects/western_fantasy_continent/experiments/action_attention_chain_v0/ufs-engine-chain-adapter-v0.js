"use strict";

const ENGINE = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/standard-engine");
const { createWorld, runActionAttentionChain } = require("./action-attention-runtime");

function runEnginePlacementChain({ map, state, placement, extensionRules = [], seed = 1 }) {
  const brainWorld = engineStateToAttentionWorld(map, state, placement);
  const memory = { engineState: ENGINE.cloneState(state), map, seed, authoritativeActions: 0, extensionActions: 0 };

  const run = runActionAttentionChain({
    world: brainWorld,
    rules: extensionRules,
    initialMemory: memory,
    initialActions: [{
      type: "ufs_apply_worker_placement",
      placement,
      id: "authoritative-worker-placement",
      label: "在真实UFS引擎中放置工人骰",
    }],
    actionHandlers: {
      ufs_apply_worker_placement: ({ world, memory: runtimeMemory, action }) => {
        runtimeMemory.engineState = ENGINE.applyWorkerPlacement(
          runtimeMemory.map,
          runtimeMemory.engineState,
          action.placement,
          { rerollMode: "expected" },
        );
        runtimeMemory.authoritativeActions += 1;
        syncShips(world, runtimeMemory.engineState);
        const history = runtimeMemory.engineState.history.at(-1);
        return {
          column: action.placement.column,
          dieValue: action.placement.dieValue,
          roomType: action.placement.roomType,
          shipEvents: history?.shipEvents || [],
        };
      },
      ufs_extra_move_ship: ({ world, memory: runtimeMemory, action }) => {
        const ship = runtimeMemory.engineState.ships.find((candidate) => candidate.id === action.entityId);
        if (!ship) return { skipped: true, reason: "ship_not_active", entityId: action.entityId };
        const from = { row: ship.row, column: ship.column };
        ship.row = Math.min(runtimeMemory.map.sky.cityRow - 1, ship.row + action.rows);
        runtimeMemory.engineState.history.push({
          type: "extension_ship_moved",
          ruleId: action.ruleId,
          shipId: ship.id,
          from,
          to: { row: ship.row, column: ship.column },
        });
        runtimeMemory.extensionActions += 1;
        syncShips(world, runtimeMemory.engineState);
        return { entityId: ship.id, from: unitId(from.row, from.column), to: unitId(ship.row, ship.column), rows: action.rows };
      },
      ufs_move_adjacent_column_ships: ({ world, memory: runtimeMemory, action }) => {
        const targetColumn = action.fromColumn + action.columnDelta;
        const moved = [];
        if (targetColumn >= 0 && targetColumn < runtimeMemory.map.columns) {
          for (const ship of runtimeMemory.engineState.ships.filter((candidate) => candidate.column === targetColumn)) {
            const from = { row: ship.row, column: ship.column };
            ship.row = Math.min(runtimeMemory.map.sky.cityRow - 1, ship.row + action.rows);
            moved.push({ id: ship.id, from, to: { row: ship.row, column: ship.column } });
          }
        }
        runtimeMemory.engineState.history.push({
          type: "extension_adjacent_column_moved",
          ruleId: action.ruleId,
          targetColumn,
          moved,
        });
        runtimeMemory.extensionActions += 1;
        syncShips(world, runtimeMemory.engineState);
        return { targetColumn, moved, to: moved[0] ? unitId(moved[0].to.row, moved[0].to.column) : null };
      },
    },
  });

  return {
    ...run,
    engineState: run.memory.engineState,
    adapterAudit: {
      authoritativeActions: run.memory.authoritativeActions,
      extensionActions: run.memory.extensionActions,
      ruleIds: extensionRules.map((rule) => rule.id),
    },
  };
}

function engineStateToAttentionWorld(map, state, placement) {
  const units = [];
  const connections = [];
  for (let row = map.sky.dropRow; row < map.sky.cityRow; row += 1) {
    for (let column = 0; column < map.columns; column += 1) {
      const cell = map.sky.rows.find((candidate) => candidate.index === row)?.cells?.[column] || {};
      const tags = ["sky"];
      if (cell.explosion != null) tags.push("explosion");
      if (cell.effect?.type) tags.push(cell.effect.type);
      units.push({ id: unitId(row, column), kind: "sky_cell", row, column, tags });
      if (row + 1 < map.sky.cityRow) connections.push({
        from: unitId(row, column),
        to: unitId(row + 1, column),
        kind: "sky_down",
        direction: "down",
      });
      if (column + 1 < map.columns) {
        connections.push({ from: unitId(row, column), to: unitId(row, column + 1), kind: "sky_horizontal", direction: "right" });
        connections.push({ from: unitId(row, column + 1), to: unitId(row, column), kind: "sky_horizontal", direction: "left" });
      }
    }
  }
  units.push({ id: "placement", kind: "placement_context", column: placement.column, tags: [placement.roomType] });
  for (const unit of units.filter((candidate) => candidate.kind === "sky_cell")) {
    connections.push({ from: "placement", to: unit.id, kind: "visible_sky", direction: "out" });
  }

  const entities = state.ships.map((ship) => ({
    id: ship.id,
    type: "ship",
    faction: "other",
    unitId: unitId(ship.row, ship.column),
    state: { color: ship.color, column: ship.column, row: ship.row },
    tags: [...(ship.tags || [])],
  }));
  return createWorld({ units, connections, entities });
}

function syncShips(world, engineState) {
  const active = new Set(engineState.ships.map((ship) => ship.id));
  for (const entity of world.entities.values()) {
    if (entity.type === "ship" && !active.has(entity.id)) {
      entity.removed = true;
      entity.unitId = null;
    }
  }
  for (const ship of engineState.ships) {
    const existing = world.entities.get(ship.id);
    const next = {
      id: ship.id,
      type: "ship",
      faction: "other",
      unitId: unitId(ship.row, ship.column),
      state: { color: ship.color, column: ship.column, row: ship.row },
      tags: [...(ship.tags || [])],
    };
    if (existing) Object.assign(existing, next, { removed: false });
    else world.entities.set(ship.id, next);
  }
}

function unitId(row, column) {
  return `sky-r${row}-c${column}`;
}

function randomOtherShipRule({ rows = 1, seed = 1, candidateTag = null } = {}) {
  const keep = { type: "ship", idNot: "purple-${result.column}" };
  if (candidateTag) keep.tagsAll = [candidateTag];
  return {
    id: `random-other-ship-after-move-${rows}`,
    when: { "action.type": "ufs_apply_worker_placement" },
    attention: {
      region: { mode: "flood", seed: "placement", maxDepth: 1, connectionKinds: ["visible_sky"] },
      query: {
        mode: "random_one",
        seed,
        keep,
      },
    },
    then: [{ type: "ufs_extra_move_ship", entityId: "${match.entityId}", rows, ruleId: "random_other_ship" }],
  };
}

function explosionMovesAdjacentColumnRule({ columnDelta = 1, rows = 1 } = {}) {
  return {
    id: `explosion-moves-adjacent-${columnDelta}-${rows}`,
    when: { "action.type": "ufs_extra_move_ship", "resultUnit.tags": { includes: "explosion" } },
    then: [{
      type: "ufs_move_adjacent_column_ships",
      fromColumn: "$resultUnit.column",
      columnDelta,
      rows,
      ruleId: "explosion_adjacent_chain",
    }],
  };
}

module.exports = {
  engineStateToAttentionWorld,
  explosionMovesAdjacentColumnRule,
  randomOtherShipRule,
  runEnginePlacementChain,
};
