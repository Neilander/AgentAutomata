"use strict";

const assert = require("node:assert/strict");
const {
  buildScenarioA,
  buildScenarioB,
  buildScenarioC,
  engine,
  map,
} = require("./scenario-fixtures");

const cases = [
  {
    name: "A",
    state: buildScenarioA(),
    dieId: "r1-gray-2",
    cellId: "A-r2-c5",
    expectedDescent: 4,
    expectedShipEvents: [{ shipId: "purple-4", type: "descended", row: 4 }],
  },
  {
    name: "B",
    state: buildScenarioB(),
    dieId: "r2-gray-0",
    cellId: "A-r2-c1",
    expectedDescent: 5,
    expectedShipEvents: [{ shipId: "purple-0", type: "descended", row: 5 }],
  },
  {
    name: "C",
    state: buildScenarioC(),
    dieId: "r2-gray-2",
    cellId: "A-r1-c3",
    expectedDescent: 0,
    expectedShipEvents: [],
  },
];

const results = cases.map((entry) => {
  const action = engine.allLegalWorkerPlacements(map, entry.state)
    .find((candidate) => candidate.dieId === entry.dieId && candidate.cellId === entry.cellId);
  assert.ok(action, `scenario ${entry.name}: selected action must be legal`);

  const next = engine.applyWorkerPlacement(map, entry.state, action);
  const event = next.history.at(-1);
  assert.equal(event.type, "worker_placed");
  assert.equal(event.descent, entry.expectedDescent);
  assert.deepEqual(event.shipEvents, entry.expectedShipEvents);

  return {
    scenario: entry.name,
    action: action.id,
    legal: true,
    descent: event.descent,
    shipEvents: event.shipEvents,
  };
});

console.log(JSON.stringify({ result: "PASS", selections: results }, null, 2));
