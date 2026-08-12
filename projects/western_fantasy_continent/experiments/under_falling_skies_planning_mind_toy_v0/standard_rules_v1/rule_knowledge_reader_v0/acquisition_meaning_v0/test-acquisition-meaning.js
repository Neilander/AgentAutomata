"use strict";

const assert = require("assert");
const MODEL = require("./acquisition-meaning");

const goalOnly = MODEL.buildMeaningState({ stage: 1 });
assert.strictEqual(goalOnly.dimensions, 768);
assert.deepStrictEqual(goalOnly.activeRelations, ["research_means_acquire_victory"]);
assert.strictEqual(find(goalOnly, "concept:research").depth, 1);
assert.strictEqual(find(goalOnly, "concept:research").meaningForVictory, 1);
assert.strictEqual(find(goalOnly, "concept:energy"), null, "energy must not become understood victory meaning from an unopened two-step chain");

const rulesRead = MODEL.buildMeaningState({ stage: 3 });
assert(find(rulesRead, "roomType:research"), "research room should become a known way to obtain research");
assert.strictEqual(find(rulesRead, "concept:energy"), null, "reading two separate rules must not automatically proceduralize their composition");

const energyBlocked = MODEL.buildMeaningState({ stage: 3, events: ["research_room_energy_shortage"] });
const energy = find(energyBlocked, "concept:energy");
assert(energy, "visible energy shortage must make energy part of the understood victory chain");
assert.strictEqual(energy.depth, 2);
assert(energy.meaningForVictory > 0.75, `energy meaning should be strong after the blocker, got ${energy.meaningForVictory}`);
assert(find(energyBlocked, "roomType:energy"), "once energy is meaningful, the known energy-room behavior should become reachable");

const prematureBlock = MODEL.buildMeaningState({ stage: 2, events: ["research_room_energy_shortage"] });
assert.strictEqual(find(prematureBlock, "concept:energy"), null, "an event cannot activate a relation whose component rules have not been read");

const finalRoomBlocked = MODEL.buildMeaningState({ stage: 5, events: ["final_research_room_locked"] });
assert(find(finalRoomBlocked, "concept:infrastructure"), "locked final room must make infrastructure meaningful");
assert(find(finalRoomBlocked, "roomType:excavate"), "once infrastructure matters, excavation must become a reachable behavior");
assert.strictEqual(find(finalRoomBlocked, "concept:energy"), null, "an excavation blocker alone must not fabricate an energy-shortage lesson");

const bothBlocked = MODEL.buildMeaningState({
  stage: 5,
  events: ["research_room_energy_shortage", "final_research_room_locked", "research_room_energy_shortage"],
});
assert(find(bothBlocked, "concept:energy"), "energy meaning must survive when another blocker is also learned");
assert(find(bothBlocked, "concept:infrastructure"), "infrastructure meaning must survive when another blocker is also learned");
assert.strictEqual(bothBlocked.surfaces.research.anchorRefs.length, 3, "duplicate observations must not duplicate a rule anchor");

console.log(JSON.stringify({
  status: "PASS",
  dimensions: goalOnly.dimensions,
  beforeBlock: compact(rulesRead),
  afterEnergyBlock: compact(energyBlocked),
  afterFinalRoomBlock: compact(finalRoomBlocked),
  afterBothBlocks: compact(bothBlocked),
}, null, 2));

function find(state, sourceRef) {
  return state.meaning.ranked.find((row) => row.sourceRef === sourceRef) || null;
}

function compact(state) {
  return state.meaning.ranked.map((row) => ({ sourceRef: row.sourceRef, depth: row.depth, meaningForVictory: row.meaningForVictory }));
}
