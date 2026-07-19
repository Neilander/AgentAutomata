const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");
const COMPACT = require("./compact-request");

const probeSession = LOOP.createSession("target-condition-contract-probe", 4);
const fullRequest = LOOP.getPendingRequest(probeSession);
const hypothesisContract = fullRequest.responseContract.hypothesis;

assert(hypothesisContract.targetCondition, "the formal contract must expose targetCondition");
assert.equal(
  Object.prototype.hasOwnProperty.call(hypothesisContract, "nextCombatTargetCondition"),
  false,
  "the rejected alias must not remain in the formal contract",
);
assert.equal(
  hypothesisContract.targetCondition.requirement,
  "required when verificationScope is next_combat; optional for current_action",
);

const compactRequest = COMPACT.compactDecision(fullRequest);
assert.deepEqual(
  compactRequest.responseContract.hypothesis,
  hypothesisContract,
  "compact and full decision requests must expose the same hypothesis contract",
);

const learnedRequestSession = LOOP.createSession("causal-knowledge-request-probe", 4);
learnedRequestSession.cognitionState.causalKnowledge.push({
  id: "causal-knowledge:probe",
  scope: {
    cause: "减速帮助主C拖到大招",
    behavior: "swap:2:hero_ranger",
    resultKind: "team_experiment_contribution",
    target: "hero_ranger",
    targetCondition: { metric: "damageShare", operator: ">=", value: 0.25 },
    environment: { region: "region_1", node: "r1_main_7" },
  },
  belief: 0.36,
  confidence: 0.36,
  evidenceCount: 2,
  lastStatus: "confirmed",
});
const learnedRequest = LOOP.getPendingRequest(learnedRequestSession);
const learnedCompact = COMPACT.compactDecision(learnedRequest);
assert.equal(learnedRequest.playerState.causalKnowledge[0].belief, 0.36);
assert.deepEqual(
  learnedCompact.playerState.causalKnowledge,
  learnedRequest.playerState.causalKnowledge,
  "full and compact requests must expose the same learned causal beliefs",
);

const confirmed = runFormalCase(
  "next-combat-confirmed",
  "next_combat",
  { metric: "damage", operator: ">", value: 0 },
);
assert.equal(confirmed.status, "confirmed");
assert(confirmed.evidence[0].observedValue > 0);

const refuted = runFormalCase(
  "next-combat-refuted",
  "next_combat",
  { metric: "damage", operator: "<", value: 0 },
);
assert.equal(refuted.status, "refuted");
assert(refuted.evidence[0].observedValue > 0);

const currentAction = runFormalCase(
  "current-action-confirmed",
  "current_action",
  { metric: "damage", operator: ">", value: 0 },
);
assert.equal(currentAction.status, "confirmed");
assert.deepEqual(
  currentAction.targetCondition,
  confirmed.targetCondition,
  "current_action and next_combat must persist the same targetCondition shape",
);

const rejectedAlias = decisionFor("deprecated-alias", "next_combat", null);
rejectedAlias.hypothesis.nextCombatTargetCondition = {
  metric: "damage",
  operator: ">",
  value: 0,
};
assert.throws(
  () => LOOP.applyDecisionResponse(
    LOOP.createSession("target-condition-rejected-alias", 4),
    rejectedAlias,
  ),
  /unsupported hypothesis field nextCombatTargetCondition; use targetCondition/,
);

console.log(JSON.stringify({
  result: "PASS",
  formalContractField: "targetCondition",
  compactContractMatches: true,
  causalKnowledgeVisibleInNextDecision: true,
  confirmed: summarize(confirmed),
  refuted: summarize(refuted),
  currentAction: summarize(currentAction),
  deprecatedAlias: "rejected_with_use_targetCondition_message",
  scope: "deterministic formal-request and runtime contract regression",
}, null, 2));

function runFormalCase(id, verificationScope, targetCondition) {
  let session = LOOP.createSession(`target-condition:${id}`, 4);
  session = LOOP.applyDecisionResponse(
    session,
    decisionFor(id, verificationScope, targetCondition),
  );
  const hypothesis = session.cognitionState.hypotheses.find((row) => row.id === id);
  assert(hypothesis, `formal decision must persist hypothesis ${id}`);
  return hypothesis;
}

function decisionFor(id, verificationScope, targetCondition) {
  return {
    action: "challenge:r1_main_1",
    goalId: "grow_and_progress",
    reasoningChain: [
      { kind: "goal", evidence: "Improve the active team." },
      { kind: "knowledge", evidence: "The current contribution has measurable battle evidence." },
      { kind: "affordance", evidence: "The visible first challenge can test it." },
      { kind: "comparison", evidence: "Swapping reserve militia would test a different question." },
      { kind: "hypothesis", evidence: "The selected character should cross the stated damage condition." },
    ],
    alternatives: [{
      action: "swap:0:militia_drum",
      reason: "Test a different team composition instead.",
    }],
    capabilityNeedMix: null,
    hypothesis: {
      id,
      problem: "The visible damage contribution needs verification.",
      cause: "The active Warrior should cause measurable damage.",
      resultKind: "team_experiment_contribution",
      target: "hero_warrior",
      verificationScope,
      targetCondition,
    },
  };
}

function summarize(hypothesis) {
  return {
    id: hypothesis.id,
    verificationScope: hypothesis.verificationScope,
    targetCondition: hypothesis.targetCondition,
    status: hypothesis.status,
    observedValue: hypothesis.evidence[0]?.observedValue ?? null,
  };
}
