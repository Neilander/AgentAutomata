"use strict";

const baseBundle = require("./public_bundle/frozen_rules.json");
const skyBundle = require("./public_bundle_round2/sky/rules.json");
const roomBundle = require("./public_bundle_round2/room/rules.json");
const phaseBundle = require("./public_bundle_round2/phase/rules.json");

function mergeRules(...bundles) {
  const rules = {};
  for (const bundle of bundles) {
    for (const [ruleId, text] of Object.entries(bundle.rules)) {
      if (Object.prototype.hasOwnProperty.call(rules, ruleId) && rules[ruleId] !== text) {
        throw new Error(`conflicting source rule: ${ruleId}`);
      }
      rules[ruleId] = text;
    }
  }
  return Object.freeze(rules);
}

const SOURCE_RULES = mergeRules(baseBundle, skyBundle, roomBundle, phaseBundle);

module.exports = { SOURCE_RULES, mergeRules };
