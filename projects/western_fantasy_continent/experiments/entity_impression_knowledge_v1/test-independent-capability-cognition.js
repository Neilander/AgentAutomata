const assert = require("node:assert/strict");
const MODEL = require("./entity-impression-model");

const first = MODEL.analyzeBattleReport({
  id: "independent-capability-first",
  environment: { tags: ["capability_probe"] },
  playerTeam: [
    { id: "striker", name: "烈刃", role: "damage" },
    { id: "guardian", name: "壁垒", role: "tank" },
    { id: "bard", name: "号角", role: "support" },
    { id: "scout", name: "斥候", role: "damage" },
  ],
  gameEvent: {
    outcome: "win",
    contributions: [
      { name: "烈刃", role: "damage", damage: 120 },
      { name: "壁垒", role: "tank", damage: 5 },
      { name: "号角", role: "support", damage: 5 },
      { name: "斥候", role: "damage", damage: 30 },
    ],
  },
  eventLog: [
    damage("d1", "striker", "烈刃", 120),
    damage("d2", "guardian", "壁垒", 5),
    damage("d3", "bard", "号角", 5),
    damage("d4", "scout", "斥候", 30),
    shield("s1", "guardian", "壁垒", "striker", "烈刃", 120),
    buff("b1", "bard", "号角", "striker", "烈刃", 4),
    buff("b2", "bard", "号角", "guardian", "壁垒", 4),
    buff("b3", "bard", "号角", "scout", "斥候", 4),
  ],
}, { profile: "ordinary" });

assert.equal(first.capabilityAxes.output.teamContribution, 160);
assert.equal(first.capabilityAxes.protection.teamContribution, 120);
assert.equal(first.capabilityAxes.buff.teamContribution, 12);
assert.equal(unit(first, "striker").capabilities.output.contribution, 120);
assert.equal(unit(first, "guardian").capabilities.protection.contribution, 120);
assert.equal(unit(first, "bard").capabilities.buff.contribution, 12);

const state = MODEL.createImpressionState({ profile: "ordinary" });
const trace = MODEL.ingestBattleAnalysis(state, first);
assert.equal(
  trace.changes.filter((row) => row.action === "updated_capability_cognition_matrix").length,
  3,
  "one battle with visible evidence on all axes must update three independent matrices",
);

const current = new Map(
  MODEL.listCurrentCapabilityCognition(state).map((row) => [row.subject.id, row]),
);
assert(
  current.get("striker").capabilities.output.position
    > current.get("guardian").capabilities.output.position,
  "the damage specialist must lead the output ruler",
);
assert(
  current.get("guardian").capabilities.protection.position
    > current.get("striker").capabilities.protection.position,
  "the tank must lead the protection ruler independently of damage",
);
assert(
  current.get("bard").capabilities.buff.position
    > current.get("striker").capabilities.buff.position,
  "the support must lead the buff ruler independently of damage",
);
assert.equal(current.get("guardian").capabilities.protection.inTopThirtyPercent, true);
assert.equal(current.get("bard").capabilities.buff.inTopThirtyPercent, true);
assert.equal(
  current.get("guardian").decisionRule,
  "根据当前问题独立取用输出、保护或增益标尺；不得自动合成为综合强度",
);

const protectionBefore = JSON.stringify(state.capabilityCognitionMatrices.protection);
const buffBefore = JSON.stringify(state.capabilityCognitionMatrices.buff);
const outputOnly = MODEL.analyzeBattleReport({
  id: "independent-capability-output-only",
  environment: { tags: ["damage_race"] },
  playerTeam: [
    { id: "striker", name: "烈刃", role: "damage" },
    { id: "scout", name: "斥候", role: "damage" },
    { id: "new_cannon", name: "雷炮", role: "damage" },
    { id: "new_blade", name: "新刃", role: "damage" },
  ],
  gameEvent: {
    outcome: "win",
    contributions: [
      { name: "烈刃", role: "damage", damage: 80 },
      { name: "斥候", role: "damage", damage: 40 },
      { name: "雷炮", role: "damage", damage: 180 },
      { name: "新刃", role: "damage", damage: 60 },
    ],
  },
  eventLog: [
    damage("od1", "striker", "烈刃", 80),
    damage("od2", "scout", "斥候", 40),
    damage("od3", "new_cannon", "雷炮", 180),
    damage("od4", "new_blade", "新刃", 60),
  ],
}, { profile: "ordinary" });
const secondTrace = MODEL.ingestBattleAnalysis(state, outputOnly);
assert(secondTrace.changes.some((row) => row.action === "updated_capability_cognition_matrix" && row.axis === "output"));
assert(secondTrace.changes.some((row) => row.action === "capability_axis_not_observed" && row.axis === "protection"));
assert(secondTrace.changes.some((row) => row.action === "capability_axis_not_observed" && row.axis === "buff"));
assert.equal(
  JSON.stringify(state.capabilityCognitionMatrices.protection),
  protectionBefore,
  "an output-only battle must not pull the protection ruler",
);
assert.equal(
  JSON.stringify(state.capabilityCognitionMatrices.buff),
  buffBefore,
  "an output-only battle must not pull the buff ruler",
);

const migrated = {
  schema: "entity_impression_knowledge_v1",
  profile: "ordinary",
  strengthCognitionMatrix: MODEL.STRENGTH_MATRIX.createStrengthCognitionMatrix({ profile: "ordinary" }),
};
assert.deepEqual(MODEL.listCurrentCapabilityCognition(migrated), []);
assert.deepEqual(Object.keys(migrated.capabilityCognitionMatrices), ["output", "protection", "buff"]);

console.log(JSON.stringify({
  result: "PASS",
  axes: MODEL.CAPABILITY_AXES,
  firstLeaders: {
    output: leader(state, "output"),
    protection: leader(state, "protection"),
    buff: leader(state, "buff"),
  },
  independentUpdateCounts: Object.fromEntries(MODEL.CAPABILITY_AXES.map((axis) => [
    axis,
    state.capabilityCognitionMatrices[axis].updateCount,
  ])),
}, null, 2));

function damage(id, subjectId, subjectName, amount) {
  return {
    id,
    type: "damage",
    subject: { id: subjectId, name: subjectName, side: "left" },
    behavior: { tags: ["damage"] },
    result: {
      target: { id: `enemy:${id}`, side: "right" },
      hpBefore: amount,
      hpAfter: 0,
      amount,
      meta: { visibleTargetCount: 1 },
    },
  };
}

function shield(id, subjectId, subjectName, targetId, targetName, amount) {
  return {
    id,
    type: "shield",
    subject: { id: subjectId, name: subjectName, side: "left" },
    behavior: { tags: ["shield"] },
    result: { target: { id: targetId, name: targetName, side: "left" }, amount },
  };
}

function buff(id, subjectId, subjectName, targetId, targetName, amount) {
  return {
    id,
    type: "status",
    subject: { id: subjectId, name: subjectName, side: "left" },
    behavior: { tags: ["status", "buff", "teamWindow"] },
    result: { target: { id: targetId, name: targetName, side: "left" }, amount },
  };
}

function unit(analysis, id) {
  return analysis.units.find((row) => row.id === id);
}

function leader(state, axis) {
  return state.capabilityCognitionMatrices[axis].entries
    .slice()
    .sort((left, right) => right.position - left.position)[0].subject.id;
}
