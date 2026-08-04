"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const sessionPath = path.resolve(process.argv[2] || path.join(__dirname, "playtest", "v3-open-novice-session.json"));
const tracePath = path.resolve(process.argv[3] || sessionPath.replace(/-session\.json$/u, "-visible-trace.json"));
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/u, "")); }
const session = readJson(sessionPath);
const trace = readJson(tracePath);

assert.equal(session.phase, "complete", "Formal playtest did not reach a complete final-battle state");
assert.equal(session.history.length, session.cycle, "History length does not match cycle count");
assert.equal(trace.phase, "complete", "Visible trace is not complete");
assert.equal(trace.completedCycles, session.cycle, "Visible trace cycle count differs from the sealed session");
assert.equal(trace.cycles.length, session.history.length, "Visible trace omitted decision cycles");

const decisionCalls = session.apiCalls.filter((row) => row.type === "decision");
const attributionCalls = session.apiCalls.filter((row) => row.type === "attribution");
assert.equal(decisionCalls.length, session.history.length, "Not every cycle has a recorded decision call");
assert.equal(attributionCalls.length, session.history.length, "Not every cycle has a recorded attribution call");

let combatCount = 0;
for (const record of session.history) {
  const visibleAction = record.beforeObservation.actions.find((row) => row.id === record.action.id);
  assert(visibleAction, `Cycle ${record.cycle} selected an action absent from its public observation`);
  assert.notEqual(visibleAction.available, false, `Cycle ${record.cycle} selected a disabled action`);
  assert(record.attribution, `Cycle ${record.cycle} lacks post-result attribution`);
  assert(record.attribution.learnedAfterFeedback, `Cycle ${record.cycle} attribution was not made after feedback`);
  assert(record.attribution.evidenceEventIds.length > 0, `Cycle ${record.cycle} attribution cites no evidence`);
  assert(record.attribution.evidenceEventIds.every((id) => /^evidence_\d+$/u.test(id)), `Cycle ${record.cycle} attribution cites a non-public evidence id`);
  if (record.action.kind === "combat" || record.action.kind === "grind") {
    combatCount += 1;
    assert(record.combatAudit?.signalCount > 0, `Cycle ${record.cycle} combat skipped the actual timeline`);
  }

  const day = record.beforeObservation.time.day;
  const publicInput = JSON.stringify(record.decisionInput);
  for (const forbidden of ["rngState", "resolvedRaids", "resolvedEvents", "intendedLesson", "successChance"]) {
    assert(!publicInput.includes(forbidden), `Cycle ${record.cycle} leaked internal field ${forbidden}`);
  }
  if (day < 4) assert(!publicInput.includes("血鼓萨满祭坛") && !publicInput.includes("圣殿火堆旁的女巫"), `Cycle ${record.cycle} leaked the day-four line`);
  if (day < 5) assert(!publicInput.includes("披甲战兽栏") && !publicInput.includes("追着巨兽脚印而来的猎人"), `Cycle ${record.cycle} leaked the day-five line`);
  if (day < 6) assert(!publicInput.includes("最后一支南下商队"), `Cycle ${record.cycle} leaked the day-six line`);
}

const knowledgeRows = Object.values(session.knowledgeBase || {});
const sampleCount = knowledgeRows.reduce((sum, row) => sum + Number(row.result?.sampleCount || 0), 0);
const attributionCount = knowledgeRows.reduce((sum, row) => sum + Number(row.attributions?.length || 0), 0);
assert.equal(sampleCount, session.history.length, "Knowledge samples do not account for every observed action result");
assert.equal(attributionCount, session.history.length, "Knowledge attributions do not account for every decision cycle");
assert.equal(trace.knowledge.reduce((sum, row) => sum + Number(row.sampleCount || 0), 0), sampleCount, "Visible knowledge export differs from the sealed knowledge base");

console.log(JSON.stringify({
  status: "PASS",
  session: path.basename(sessionPath),
  phase: session.phase,
  cycles: session.cycle,
  decisions: decisionCalls.length,
  attributions: attributionCalls.length,
  combatsWithTimeline: combatCount,
  knowledgeRows: knowledgeRows.length,
  knowledgeSamples: sampleCount,
  finalResult: session.gameState.result?.title || null,
}, null, 2));
