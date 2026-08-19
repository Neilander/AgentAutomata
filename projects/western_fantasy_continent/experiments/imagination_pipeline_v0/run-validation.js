"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ImaginationPipeline } = require("./imagination-pipeline");
const { createScenario } = require("./trajectory-fixtures");

function objectById(world, id) {
  return world.objects.find((object) => object.id === id);
}

const cases = [
  {
    id: "full-arrow-city-chain",
    scenario: createScenario(),
    options: { perceptionBudget: 40, imaginationBudget: 20 },
    expect(result) {
      assert.equal(result.status, "complete");
      assert.equal(objectById(result.imaginedWorld, "ship-a").column, "C");
      assert.equal(result.imaginedWorld.city.health, 2);
      assert.equal(result.trace.groundings.length, 3);
    },
  },
  {
    id: "normal-complete",
    scenario: createScenario({ endpointKind: "normal" }),
    options: { perceptionBudget: 40, imaginationBudget: 20 },
    expect(result) {
      assert.equal(result.status, "complete");
      assert.equal(result.imaginedWorld.city.health, 3);
    },
  },
  {
    id: "random-boundary",
    scenario: createScenario({ endpointKind: "random" }),
    options: { perceptionBudget: 40, imaginationBudget: 20 },
    expect(result) {
      assert.equal(result.status, "random");
    },
  },
  {
    id: "choice-boundary",
    scenario: createScenario({ endpointKind: "choice" }),
    options: { perceptionBudget: 40, imaginationBudget: 20 },
    expect(result) {
      assert.equal(result.status, "choice");
    },
  },
  {
    id: "unknown-boundary",
    scenario: createScenario({ endpointKind: "mystery" }),
    options: { perceptionBudget: 40, imaginationBudget: 20 },
    expect(result) {
      assert.equal(result.status, "unknown");
    },
  },
  {
    id: "imagination-attention-stop",
    scenario: createScenario(),
    options: { perceptionBudget: 40, imaginationBudget: 0.5 },
    expect(result) {
      assert.equal(result.status, "attention_stop");
      assert.equal(objectById(result.imaginedWorld, "ship-a").row, 2);
    },
  },
  {
    id: "perception-attention-stop",
    scenario: createScenario(),
    options: { perceptionBudget: 18, imaginationBudget: 20 },
    expect(result) {
      assert.equal(result.status, "attention_stop");
      assert.equal(result.imaginedWorld.city.health, 3);
    },
  },
];

const summaries = [];
for (const row of cases) {
  const pipeline = new ImaginationPipeline();
  const before = structuredClone(row.scenario.world);
  let result;
  let error = null;
  try {
    result = pipeline.run({ ...row.scenario, ...row.options });
    row.expect(result);
    assert.deepEqual(row.scenario.world, before);
  } catch (caught) {
    error = `${caught.name}: ${caught.message}`;
  }
  summaries.push({
    id: row.id,
    passed: error === null,
    error,
    status: result?.status ?? null,
    reason: result?.reason ?? null,
    observed_world_unchanged: result?.observedWorldUnchanged ?? false,
    grounding_rules: result?.trace.groundings.map((item) => item.trajectoryId) ?? [],
    relation_rejections: result?.trace.relationRejections ?? [],
    boundaries: result?.trace.boundaries ?? [],
    attention_selected_count: result?.trace.attention.selected.length ?? 0,
    imagination_attention_spent: result?.attentionAccount.spent ?? 0,
  });
}

const payload = {
  schema: "imagination_pipeline_validation_v0",
  case_count: summaries.length,
  passed_count: summaries.filter((row) => row.passed).length,
  all_passed: summaries.every((row) => row.passed),
  formal_player_modified: false,
  activation_encoder: "deterministic_test_encoder_replaceable_by_real_gte_adapter",
  reused_grounding_submission: "../blind_rule_program_micro_v0/submission/submission.js",
  cases: summaries,
};

const artifactPath = path.join(__dirname, "artifacts", "validation.json");
fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  case_count: payload.case_count,
  passed_count: payload.passed_count,
  all_passed: payload.all_passed,
}));
process.exitCode = payload.all_passed ? 0 : 1;
