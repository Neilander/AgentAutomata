"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { compileGlueProgram, validateGlueProgram } = require("./glue-program-v1");
const { runActionAttentionChain } = require("./action-attention-runtime");
const { buildCompiledUfsWorld } = require("./ufs-rule-ai-compile-v0");

const EXPECTED_SOURCES = ["R01", "R02", "R03", "R04", "R05", "R06", "R07", "R08"];
const programPath = process.argv[2] || path.join(__dirname, "blind_compile_v1", "program.json");
const program = JSON.parse(fs.readFileSync(programPath, "utf8"));
const validation = validateGlueProgram(program, { expectedSourceRuleIds: EXPECTED_SOURCES });
if (!validation.ok) {
  console.log(JSON.stringify({ status: "STRUCTURE_FAIL", errors: validation.errors }, null, 2));
  process.exitCode = 1;
  return;
}

const rules = compileGlueProgram(program, { expectedSourceRuleIds: EXPECTED_SOURCES });

function prefixRules(lastSourceRuleId) {
  const count = EXPECTED_SOURCES.indexOf(lastSourceRuleId) + 1;
  const expectedPrefix = EXPECTED_SOURCES.slice(0, count);
  const prefix = { schema: "glue_program_v1", steps: program.steps.slice(0, count) };
  return compileGlueProgram(prefix, { expectedSourceRuleIds: expectedPrefix });
}

function run(options = {}, ruleSet = rules) {
  const world = buildCompiledUfsWorld(options);
  if (options.arrowDestinationTag) {
    world.units.get(`sky-c1-r${options.dieValue}`).tags.push(options.arrowDestinationTag);
  }
  return runActionAttentionChain({
    world,
    rules: ruleSet,
    initialActions: [
      { type: "compute", key: "placedRoomTags", value: world.units.get("base-c0").tags },
      { type: "place", entityId: "die", targetUnitId: "base-c0" },
    ],
  });
}

function entity(result, id) {
  return result.world.entities.find((candidate) => candidate.id === id);
}

const tests = [];
function test(name, fn) {
  try {
    fn();
    tests.push({ name, pass: true });
  } catch (error) {
    tests.push({ name, pass: false, error: error.message });
  }
}

test("普通房按完整骰值下降", () => {
  const result = run({ dieValue: 4, landingTag: "explosion" });
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r4");
  assert.equal(entity(result, "city").state.hp, 3);
});

test("防空房只减一且不依赖路径格", () => {
  const result = run({ dieValue: 4, roomTags: ["aa_room"], landingTag: "explosion" });
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r3");
});

test("同列多架飞船使用同一模板", () => {
  const result = run({ dieValue: 2, landingTag: "explosion", secondShip: true });
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r2");
  assert.equal(entity(result, "ship-white").unitId, "sky-c0-r3");
});

test("1点防空归零且不触发母舰下降", () => {
  const result = run({ dieValue: 1, roomTags: ["aa_room"], landingTag: "mothership_down" });
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r0");
  assert.equal(entity(result, "mothership").unitId, "mothership-r0");
});

test("母舰格粘接下降但不执行行右动作", () => {
  const result = run({ dieValue: 3, landingTag: "mothership_down" });
  assert.equal(entity(result, "mothership").unitId, "mothership-r1");
  assert.equal(result.trace.some((row) => row.action.id === "resolve-mothership-row-action"), false);
});

test("母舰抵达骷髅形成已知失败", () => {
  const result = run({ dieValue: 3, landingTag: "mothership_down", mothershipAtSkullDoor: true });
  assert.equal(result.terminal.kind, "known_outcome");
  assert.equal(result.terminal.outcome, "loss");
});

test("箭头移动后用新落点继续粘接结算", () => {
  const result = run({ dieValue: 2, landingTag: "arrow_right", arrowDestinationTag: "city_hit" });
  assert.equal(entity(result, "city").state.hp, 2);
  assert.equal(entity(result, "ship-purple").unitId, "mothership-waiting");
});

test("城市受伤且飞船返航", () => {
  const result = run({ dieValue: 5, landingTag: "city_hit" });
  assert.equal(entity(result, "city").state.hp, 2);
  assert.equal(entity(result, "ship-purple").unitId, "mothership-waiting");
});

test("白骰在确定连锁后停于随机边界", () => {
  const result = run({ dieValue: 2, whiteDie: true, landingTag: "explosion" });
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r2");
  assert.equal(result.terminal.kind, "random_outcome");
});

test("爆炸格规则明确为零动作", () => {
  assert.equal(program.steps.find((step) => step.sourceRuleId === "R06").units.length, 0);
});

test("粘接单元声明倒序后语义不变", () => {
  const reversedRules = [...rules].reverse();
  const baseline = run({ dieValue: 3, landingTag: "mothership_down" });
  const reversed = run({ dieValue: 3, landingTag: "mothership_down" }, reversedRules);
  assert.deepEqual(reversed.world, baseline.world);
  assert.deepEqual(reversed.terminal, baseline.terminal);
});

test("拆掉箭头来源后链条在箭头格停止", () => {
  const withoutArrow = rules.filter((rule) => rule.sourceRuleId !== "R05");
  const result = run({ dieValue: 2, landingTag: "arrow_right" }, withoutArrow);
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r2");
});

test("逐句前缀R01已形成基础下降", () => {
  const result = run({ dieValue: 3, landingTag: "explosion" }, prefixRules("R01"));
  assert.equal(entity(result, "ship-purple").unitId, "sky-c0-r3");
});

test("逐句前缀加入R02才获得防空修正", () => {
  const before = run({ dieValue: 3, roomTags: ["aa_room"], landingTag: "explosion" }, prefixRules("R01"));
  const after = run({ dieValue: 3, roomTags: ["aa_room"], landingTag: "explosion" }, prefixRules("R02"));
  assert.equal(entity(before, "ship-purple").unitId, "sky-c0-r3");
  assert.equal(entity(after, "ship-purple").unitId, "sky-c0-r2");
});

test("逐句前缀加入R04后母舰格产生连锁", () => {
  const result = run({ dieValue: 3, landingTag: "mothership_down" }, prefixRules("R04"));
  assert.equal(entity(result, "mothership").unitId, "mothership-r1");
});

test("逐句前缀加入R05后箭头开始改道", () => {
  const before = run({ dieValue: 2, landingTag: "arrow_right" }, prefixRules("R04"));
  const after = run({ dieValue: 2, landingTag: "arrow_right" }, prefixRules("R05"));
  assert.equal(entity(before, "ship-purple").unitId, "sky-c0-r2");
  assert.equal(entity(after, "ship-purple").unitId, "sky-c1-r2");
});

test("逐句前缀加入R07后城市命中才结算", () => {
  const result = run({ dieValue: 5, landingTag: "city_hit" }, prefixRules("R07"));
  assert.equal(entity(result, "city").state.hp, 2);
});

test("逐句前缀加入R08后白骰才产生随机终点", () => {
  const before = run({ dieValue: 2, whiteDie: true, landingTag: "explosion" }, prefixRules("R07"));
  const after = run({ dieValue: 2, whiteDie: true, landingTag: "explosion" }, prefixRules("R08"));
  assert.equal(before.terminal.kind, "chain_complete");
  assert.equal(after.terminal.kind, "random_outcome");
});

const failed = tests.filter((row) => !row.pass);
console.log(JSON.stringify({
  status: failed.length ? "BEHAVIOR_FAIL" : "PASS",
  structure: validation,
  sourceSteps: program.steps.length,
  glueUnits: rules.length,
  passed: tests.length - failed.length,
  total: tests.length,
  tests,
}, null, 2));
if (failed.length) process.exitCode = 1;
