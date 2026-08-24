"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { buildWalkthroughData } = require("./build-walkthrough-data");

function objectById(world, id) {
  return world.objects.find((object) => object.id === id);
}

test("walkthrough is generated from a complete immutable observed-world run", () => {
  const data = buildWalkthroughData();
  assert.equal(data.schema, "imagination_pipeline_walkthrough_v0");
  assert.equal(data.steps.length, 10);
  assert.equal(data.result.status, "complete");
  assert.equal(data.result.observedWorldUnchanged, true);
  assert.equal(data.meta.formalPlayerModified, false);
  assert.deepEqual(data.steps[0].world, data.scenario.observedWorld);
  assert.equal(data.scenario.observedWorld.city.health, 3);
  assert.equal(objectById(data.scenario.observedWorld, "ship-a").row, 2);
});

test("walkthrough preserves the arrow-city consequence chain", () => {
  const data = buildWalkthroughData();
  const finalStep = data.steps.at(-1);
  assert.equal(objectById(finalStep.world, "ship-a").column, "C");
  assert.equal(objectById(finalStep.world, "ship-a").row, 4);
  assert.equal(finalStep.world.city.health, 2);
  assert.equal(finalStep.detail.boundary.kind, "complete");
  assert.ok(data.steps.some((step) => (
    step.detailKind === "activation"
    && step.detail.rejections?.some((row) => row.reason.includes("landed_arrow!=passed_arrow"))
  )));
});

test("every step has a stage, raw evidence, world snapshot, and audit checks", () => {
  const data = buildWalkthroughData();
  const stageIds = new Set(data.stages.map((stage) => stage.id));
  for (const step of data.steps) {
    assert.ok(stageIds.has(step.stageId));
    assert.ok(step.title.length > 0);
    assert.ok(step.raw && Object.hasOwn(step.raw, "input") && Object.hasOwn(step.raw, "output"));
    assert.ok(step.world && Array.isArray(step.world.objects));
    assert.ok(step.checks.length >= 3);
  }
});

test("standalone page references generated data and interaction script", () => {
  const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
  assert.match(html, /walkthrough-data\.js/);
  assert.match(html, /app\.js/);
  assert.match(html, /id="next-button"/);
  assert.match(html, /id="flow-rail"/);
  assert.match(html, /id="observed-board"/);
  assert.match(html, /id="imagined-board"/);
});
