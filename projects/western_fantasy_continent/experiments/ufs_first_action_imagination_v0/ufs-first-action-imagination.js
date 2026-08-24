"use strict";

const {
  ImaginationPipeline,
} = require("../imagination_pipeline_v0/imagination-pipeline");
const {
  PlacementRuleImagination,
} = require("./placement-rule-imagination");

function clone(value) {
  return structuredClone(value);
}

function columnLabel(column) {
  return `C${column + 1}`;
}

function visibleTileKind(cell) {
  if (cell.effect?.type === "arrow") return "arrow";
  if (cell.effect?.type === "mothership_down") return "mothership";
  return "normal";
}

function buildSkyWorld(publicState, publicMap) {
  const tiles = [];
  for (const row of publicMap.sky.rows) {
    row.cells.forEach((cell, column) => {
      const tile = {
        column: columnLabel(column),
        row: row.index,
        kind: visibleTileKind(cell),
      };
      if (cell.effect?.type === "arrow") {
        tile.targetColumn = columnLabel(cell.effect.targetColumn);
        tile.targetRow = cell.effect.targetRow;
      }
      tiles.push(tile);
    });
  }
  for (let column = 0; column < publicMap.columns; column += 1) {
    tiles.push({
      column: columnLabel(column),
      row: publicMap.sky.cityRow,
      kind: "city",
    });
  }
  return {
    objects: publicState.ships.map((ship) => ({
      id: ship.id,
      color: ship.color,
      column: columnLabel(ship.column),
      row: ship.row,
      frozen: false,
      city_distance: publicMap.sky.cityRow - ship.row,
    })),
    tiles,
    city: {
      health: publicMap.city.maxDamage - publicState.damage,
    },
  };
}

function applyPlacementToImaginedState(publicState, publicMap, selectedAction, cell, room, skyResult) {
  const imaginedState = clone(publicState);
  const die = imaginedState.dice.find((candidate) => candidate.id === selectedAction.dieId);
  die.placed = true;
  imaginedState.placements.push({
    id: `${selectedAction.dieId}@${selectedAction.cellId}`,
    dieId: selectedAction.dieId,
    dieColor: selectedAction.dieColor,
    dieValue: selectedAction.dieValue,
    cellId: selectedAction.cellId,
    roomId: room.id,
    roomType: room.type,
    column: cell.column,
    excavationCandidate: cell.unlockIndex > publicState.excavatorIndex,
    excavationDistance: Math.max(0, cell.unlockIndex - publicState.excavatorIndex),
    removesRobotId: null,
    resolved: false,
  });
  for (const ship of imaginedState.ships) {
    const imaginedShip = skyResult.imaginedWorld.objects.find((object) => object.id === ship.id);
    if (!imaginedShip) throw new Error(`imagined sky lost ship: ${ship.id}`);
    ship.column = Number(imaginedShip.column.slice(1)) - 1;
    ship.row = imaginedShip.row;
  }
  imaginedState.damage = Math.max(
    0,
    publicMap.city.maxDamage - skyResult.imaginedWorld.city.health,
  );
  return imaginedState;
}

class UfsFirstActionImagination {
  constructor({
    pipeline = new ImaginationPipeline(),
    placementRuleImagination = new PlacementRuleImagination(),
  } = {}) {
    this.pipeline = pipeline;
    this.placementRuleImagination = placementRuleImagination;
  }

  run({
    publicState,
    publicMap,
    selectedAction,
    placementPerceptionBudget = 30,
  }) {
    const observedBefore = clone(publicState);
    if (publicState.phase !== "dice") throw new Error("first-action imagination requires dice phase");
    const placementThought = this.placementRuleImagination.run({
      publicState,
      publicMap,
      selectedAction,
      perceptionBudget: placementPerceptionBudget,
    });
    const { die, cell, room } = placementThought.context;
    if (placementThought.status !== "automatic") {
      const observedWorldUnchanged = JSON.stringify(publicState) === JSON.stringify(observedBefore);
      return {
        schema: "ufs_first_action_imagination_result_v0",
        status: placementThought.status,
        reason: placementThought.reason,
        selectedAction: clone(selectedAction),
        imaginedConsequences: placementThought.imaginedConsequences,
        observedWorldUnchanged,
        imaginedState: clone(publicState),
        remainingDice: publicState.dice.filter((candidate) => !candidate.placed),
        stoppedBeforeSecondAction: false,
        nextAction: null,
        trace: {
          placementRules: placementThought.trace,
          sky: null,
          boundary: { kind: placementThought.status, reason: placementThought.reason },
        },
      };
    }
    const actualDescent = placementThought.imaginedConsequences.movement.amount;
    const skyWorld = buildSkyWorld(publicState, publicMap);
    const skyResult = this.pipeline.run({
      world: skyWorld,
      action: {
        type: "place_die",
        dieId: die.id,
        column: columnLabel(cell.column),
        amount: actualDescent,
        selection: "all",
      },
      perceptionBudget: 40,
      imaginationBudget: 20,
    });
    const imaginedState = applyPlacementToImaginedState(
      publicState,
      publicMap,
      selectedAction,
      cell,
      room,
      skyResult,
    );
    const remainingDice = imaginedState.dice.filter((candidate) => !candidate.placed);
    let status = skyResult.status;
    let reason = skyResult.reason;
    if (skyResult.status === "complete" && remainingDice.length > 0) {
      status = "choice";
      reason = "next_player_decision";
    }
    const observedWorldUnchanged = JSON.stringify(publicState) === JSON.stringify(observedBefore);
    if (!observedWorldUnchanged) throw new Error("imagination mutated public observed state");
    return {
      schema: "ufs_first_action_imagination_result_v0",
      status,
      reason,
      selectedAction: clone(selectedAction),
      imaginedConsequences: {
        movement: placementThought.imaginedConsequences.movement,
        skyStatus: skyResult.status,
        room: placementThought.imaginedConsequences.room,
      },
      observedWorldUnchanged,
      imaginedState,
      remainingDice: remainingDice.map((candidate) => ({
        id: candidate.id,
        color: candidate.color,
        value: candidate.value,
      })),
      stoppedBeforeSecondAction: status === "choice" && reason === "next_player_decision",
      nextAction: null,
      trace: {
        placementRules: placementThought.trace,
        sky: skyResult.trace,
        boundary: {
          kind: status,
          reason,
        },
      },
    };
  }
}

module.exports = {
  UfsFirstActionImagination,
  buildSkyWorld,
};
