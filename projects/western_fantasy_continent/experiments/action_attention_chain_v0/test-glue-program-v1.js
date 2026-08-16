"use strict";

const assert = require("node:assert/strict");
const { compileGlueProgram, validateGlueProgram } = require("./glue-program-v1");

const expected = ["R01", "R02"];
const valid = {
  schema: "glue_program_v1",
  steps: [
    {
      sourceRuleId: "R01",
      interpretation: "放置后注意同类对象",
      units: [{
        id: "attend-after-place",
        sourceRuleId: "R01",
        trigger: { "action.type": "place" },
        attention: {
          region: { mode: "unit", seed: "$result.to" },
          query: { mode: "all", keep: { type: "ship" } },
          forEachMatch: true,
        },
        emit: [{ type: "notice", entityId: "${match.entityId}", label: "注意对象" }],
      }],
    },
    { sourceRuleId: "R02", interpretation: "本句明确没有额外动作", units: [] },
  ],
};

assert.deepEqual(validateGlueProgram(valid, { expectedSourceRuleIds: expected }), { ok: true, errors: [] });
const compiled = compileGlueProgram(valid, { expectedSourceRuleIds: expected });
assert.equal(compiled.length, 1);
assert.equal(compiled[0].when["action.type"], "place");
assert.equal(compiled[0].forEachMatch, true);

const reversed = structuredClone(valid);
reversed.steps.reverse();
assert.equal(validateGlueProgram(reversed, { expectedSourceRuleIds: expected }).ok, false);

const duplicate = structuredClone(valid);
duplicate.steps[1].units.push(structuredClone(duplicate.steps[0].units[0]));
duplicate.steps[1].units[0].sourceRuleId = "R02";
assert.equal(validateGlueProgram(duplicate, { expectedSourceRuleIds: expected }).ok, false);

const hardcoded = structuredClone(valid);
hardcoded.steps[0].units[0].emit[0].entityId = "ship-purple";
assert.equal(validateGlueProgram(hardcoded, { expectedSourceRuleIds: expected }).ok, false);

const unsupported = structuredClone(valid);
unsupported.steps[0].units[0].emit[0].type = "magically_win";
assert.equal(validateGlueProgram(unsupported, { expectedSourceRuleIds: expected }).ok, false);

const inventedActionField = structuredClone(valid);
inventedActionField.steps[0].units[0].emit[0].resolutionMode = "magic";
assert.equal(validateGlueProgram(inventedActionField, { expectedSourceRuleIds: expected }).ok, false);

const badContextPath = structuredClone(valid);
badContextPath.steps[0].units[0].trigger["resultUnit.type"] = "base_slot";
assert.equal(validateGlueProgram(badContextPath, { expectedSourceRuleIds: expected }).ok, false);

console.log(JSON.stringify({ status: "PASS", tests: 7, contract: "glue_program_v1" }, null, 2));
