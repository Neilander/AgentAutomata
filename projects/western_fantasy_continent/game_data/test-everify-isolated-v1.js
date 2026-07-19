const assert = require("node:assert/strict");
const {
  evaluateEVerify,
  validateHypothesis,
} = require("./everify-isolated-v1");

const rangerBreakFormation = {
  id: "ranger-breaks-high-health-formation",
  claim: "Using the ranger will break the enemy formation.",
  chosenBehavior: "field the ranger and focus the high-health enemy",
  support: 999,
  strength: 999,
  causalChain: [
    {
      id: "ranger-damage-up",
      statement: "The ranger gains enough single-target damage.",
    },
    {
      id: "high-health-target-defeated",
      statement: "The ranger defeats the high-health enemy.",
    },
    {
      id: "enemy-formation-broken",
      statement: "The enemy formation loses its protected structure.",
    },
  ],
};

assert.equal(validateHypothesis(rangerBreakFormation).valid, true);

const fullChain = runCase("full_chain_confirmed", 0.8, rangerBreakFormation, [
  observed("ranger-damage-up", "standard_high", 2),
  observed("high-health-target-defeated", "prominent", 6),
  observed("enemy-formation-broken", "highlight", 8),
]);
assert.equal(fullChain.everify.status, "confirmed");
assert.equal(fullChain.everify.dimensions.support, 1);
assert.equal(fullChain.everify.dimensions.strength, 0.7);
assert.equal(fullChain.everify.derived.strategySatisfaction, 0.7);
assert.equal(fullChain.everify.derived.knowledgeEvidence, 0.7);
assert.equal(fullChain.everify.chainAudit.readsCustomSupport, false);
assert.equal(fullChain.everify.chainAudit.readsCustomStrength, false);
assert.equal(fullChain.everify.chainAudit.derivesLinkStateFromStepEvidence, true);

const middleStepRefuted = runCase("middle_step_refuted", 0.8, rangerBreakFormation, [
  observed("ranger-damage-up", "standard_high", 2),
  contradicted("high-health-target-defeated", "prominent", 6),
  observed("enemy-formation-broken", "highlight", 8),
]);
assert.equal(middleStepRefuted.everify.status, "refuted");
assert.equal(middleStepRefuted.everify.dimensions.support, -1);
assert.equal(middleStepRefuted.everify.dimensions.strength, 0.8);
assert.equal(middleStepRefuted.everify.derived.strategySatisfaction, 0);
assert.equal(middleStepRefuted.everify.derived.knowledgeEvidence, -0.8);

const prefixOnly = runCase("prefix_supported_final_step_unknown", -0.8, rangerBreakFormation, [
  observed("ranger-damage-up", "standard_high", 2),
  observed("high-health-target-defeated", "prominent", 6),
]);
assert.equal(prefixOnly.everify.status, "partially_confirmed");
assert.equal(prefixOnly.everify.dimensions.support, 0);
assert.equal(prefixOnly.everify.derived.knowledgeEvidence, 0);
assert.equal(prefixOnly.everify.derived.strategySatisfaction, 0);
assert.equal(
  prefixOnly.everify.derived.supportedPrefixThrough,
  "high-health-target-defeated",
);
assert.deepEqual(prefixOnly.everify.derived.localLinkKnowledge, [{
  linkId: "ranger-damage-up->high-health-target-defeated",
  fromStepId: "ranger-damage-up",
  toStepId: "high-health-target-defeated",
  evidence: 0.7,
}]);

const prefixLearnedButOutcomeRefuted = runCase(
  "prefix_learned_but_outcome_refuted",
  0.8,
  rangerBreakFormation,
  [
    observed("ranger-damage-up", "standard_high", 2),
    observed("high-health-target-defeated", "prominent", 6),
    contradicted("enemy-formation-broken", "highlight", 8),
  ],
);
assert.equal(prefixLearnedButOutcomeRefuted.everify.status, "refuted");
assert.equal(prefixLearnedButOutcomeRefuted.everify.dimensions.support, -1);
assert.equal(
  prefixLearnedButOutcomeRefuted.everify.derived.supportedPrefixThrough,
  "high-health-target-defeated",
);
assert.equal(
  prefixLearnedButOutcomeRefuted.everify.derived.localLinkKnowledge[0].evidence,
  0.7,
);
assert.equal(
  prefixLearnedButOutcomeRefuted.everify.derived.localLinkKnowledge[1].evidence,
  -0.9,
);

const reversedTime = runCase("reversed_time_refutes_link", 0.8, rangerBreakFormation, [
  observed("ranger-damage-up", "standard_high", 7),
  observed("high-health-target-defeated", "prominent", 3),
]);
assert.equal(reversedTime.everify.status, "refuted");
assert.equal(reversedTime.everify.chainAudit.links[0].temporalOrderValid, false);

const customNumericTier = runCase("custom_numeric_tier_rejected", 0.8, rangerBreakFormation, [
  observed("ranger-damage-up", 0.63, 2),
  observed("high-health-target-defeated", "prominent", 6),
]);
assert.equal(customNumericTier.everify.status, "inconclusive");
assert.equal(customNumericTier.everify.comparisonMade, false);
assert.equal(
  customNumericTier.everify.chainAudit.invalidEvidence[0].reason,
  "frozen_information_tier_required",
);

const incompleteHypothesis = {
  id: "incomplete",
  claim: "The ranger helps.",
  chosenBehavior: "field the ranger",
  causalChain: [
    { id: "ranger-fields", statement: "The ranger enters battle." },
    { id: "combat-won", statement: "The team wins." },
  ],
};
const incomplete = runCase("incomplete_chain_rejected", 0.8, incompleteHypothesis, []);
assert.equal(incomplete.everify.status, "invalid_hypothesis");
assert.equal(incomplete.everify.dimensions.support, 0);
assert.ok(incomplete.everify.chainAudit.validationErrors.includes("causal_chain_requires_3_steps"));

const sameEvidenceDifferentR = runCase("same_chain_different_r", -0.8, rangerBreakFormation, [
  observed("ranger-damage-up", "standard_high", 2),
  observed("high-health-target-defeated", "prominent", 6),
  observed("enemy-formation-broken", "highlight", 8),
]);
assert.deepEqual(sameEvidenceDifferentR.everify, fullChain.everify);

for (const row of [
  fullChain,
  middleStepRefuted,
  prefixOnly,
  prefixLearnedButOutcomeRefuted,
  reversedTime,
  customNumericTier,
  incomplete,
]) {
  assert.equal(row.everify.chainAudit.readsResultR, false);
}

console.log(JSON.stringify({
  result: "PASS",
  scope: "isolated_causal_chain_not_formal_runtime",
  contract: {
    agentMustProvideCompleteChain: true,
    minimumSteps: 3,
    inputContainsOnlyReceivedStepEvidence: true,
    programDerivesLinkSupport: true,
    programComputesWholeChainSupport: true,
    programComputesStrengthFromFrozenTiers: true,
    wholeChainUsesConjunctiveSupport: true,
    noStepAveraging: true,
    noMechanismEffectWeights: true,
    readsResultR: false,
  },
  cases: [
    fullChain,
    middleStepRefuted,
    prefixOnly,
    prefixLearnedButOutcomeRefuted,
    reversedTime,
    customNumericTier,
    incomplete,
  ],
}, null, 2));

function observed(stepId, informationTier, time) {
  return {
    stepId,
    state: "observed",
    informationTier,
    time,
  };
}

function contradicted(stepId, informationTier, time) {
  return {
    stepId,
    state: "contradicted",
    informationTier,
    time,
  };
}

function runCase(id, resultR, hypothesis, receivedStepEvidence) {
  return {
    id,
    resultR,
    everify: evaluateEVerify({
      hypothesis,
      receivedStepEvidence,
    }),
  };
}
