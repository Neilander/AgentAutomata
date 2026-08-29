#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const file = process.argv[2];
if (!file) process.exit(2);
const response = JSON.parse(fs.readFileSync(file, "utf8"));
const observation = response.observation || {};
const summary = {
  status: response.status,
  reason: response.reason,
  seed: response.attention && response.attention.seed,
  tracks: {
    damage: observation.damage,
    energy: observation.energy,
    excavatorIndex: observation.excavatorIndex,
    mothershipRow: observation.mothershipRow,
    phase: observation.phase,
    researchIndex: observation.researchIndex,
    outcome: observation.outcome,
  },
  dice: observation.dice || [],
  ships: observation.ships || [],
  waitingShips: observation.waitingShips || [],
  placements: observation.placements || [],
  robots: observation.robots || [],
  rooms: (response.mapView && response.mapView.rooms) || [],
  baseCells: (response.mapView && response.mapView.baseCells) || [],
  skyCells: (response.mapView && response.mapView.skyCells) || [],
  pending: response.pending,
  availableOperations: response.availableOperations,
  lastAction: response.lastAction,
  actionCount: response.actionCount,
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
