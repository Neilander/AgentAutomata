const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const chapterOne = require("./map-progression-cognition-core-phase2-midlock.js");
const chapterTwo = require("./map-progression-chapter2-core.js");

function assertResolvedCombat(core, state, nodeId) {
  const beforeGear = core.gearScore(state);
  const result = core.applyAction(state, `challenge:${nodeId}`, {
    captureVisibleSignals: true,
    resolvedCombat: {
      winner: "left",
      duration: 12.5,
      leftHp: 220,
      rightHp: 0,
      units: [],
      signals: [],
      summary: {},
      metrics: {},
    },
  });
  assert.equal(result.ok, true, `${nodeId} should settle`);
  assert.equal(result.event.outcome, "win", `${nodeId} should use rendered winner`);
  assert.equal(result.event.duration, 12.5, `${nodeId} should preserve rendered duration`);
  assert.ok(result.event.gearAfter >= beforeGear, `${nodeId} should produce a valid gear state`);
}

const chapterOneState = chapterOne.initialState("campaign-v4-smoke-ch1", { starterVariant: "player_agent_role_wave" });
chapterOneState.cleared.r1_main_1 = true;
assertResolvedCombat(chapterOne, chapterOneState, "r1_main_2");

const chapterTwoState = chapterTwo.initialState("campaign-v4-smoke-ch2");
assertResolvedCombat(chapterTwo, chapterTwoState, "r2_entry");

for (const file of ["campaign-v4.html", "campaign-v4.css", "campaign-v4.js"]) {
  assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should exist`);
}

const page = fs.readFileSync(path.join(root, "campaign-v4.html"), "utf8");
for (const asset of [
  "/battle_view/battle-view.js",
  "/map_progression_lab/map-progression-cognition-core-phase2-midlock.js",
  "/map_progression_lab/map-progression-chapter2-core.js",
  "/map_progression_lab/campaign-v4.js",
]) {
  assert.ok(page.includes(asset), `page should load ${asset}`);
}

console.log("campaign-v4 validation passed");
