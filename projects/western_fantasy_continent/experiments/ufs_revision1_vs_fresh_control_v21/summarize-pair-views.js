"use strict";

const fs = require("node:fs");
const path = require("node:path");

for (const [arm, state] of Object.entries({
  treatment: "states/treatment-episode2",
  control: "states/control-episode1",
})) {
  const view = JSON.parse(fs.readFileSync(path.join(__dirname, state, "current-player-view.json"), "utf8"));
  process.stdout.write(`${JSON.stringify({
    arm,
    status: view.status,
    reason: view.reason,
    round: view.game?.round,
    completedRoundCount: view.game?.completedRoundCount,
    actionCount: view.actionCount,
    tracks: {
      phase: view.observation?.phase,
      energy: view.observation?.energy,
      researchIndex: view.observation?.researchIndex,
      excavatorIndex: view.observation?.excavatorIndex,
      mothershipRow: view.observation?.mothershipRow,
      damage: view.observation?.damage,
    },
    unplacedDice: view.observation?.dice?.filter((die) => !die.placed).map((die) => `${die.id}:${die.value}`),
    visibleShips: view.observation?.ships?.map((ship) => `${ship.id}:c${ship.column}r${ship.row}`),
    pending: view.pending,
    operations: view.availableOperations,
    operationContracts: view.operationContracts,
    visibleRooms: view.mapView?.rooms,
    visibleBaseCells: view.mapView?.baseCells,
    lastAction: view.lastAction,
  }, null, 2)}\n`);
}

