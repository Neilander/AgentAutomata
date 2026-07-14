const assert = require("node:assert/strict");
const RUNTIME = require("./player-cognition-v3-event-runtime");

const confirmed = runScenario("hypothesis-confirm", 0.32, 0.25);
assert.equal(confirmed.afterUnrelated.hypotheses[0].status, "pending");
assert.equal(confirmed.final.hypotheses[0].status, "confirmed");
assert.equal(confirmed.verification.EVerify, 1);
assert.equal(confirmed.verification.hypothesisVerification[0].observedValue, 0.32);

const refuted = runScenario("hypothesis-refute", 0.12, 0.25);
assert.equal(refuted.afterUnrelated.hypotheses[0].status, "pending");
assert.equal(refuted.final.hypotheses[0].status, "refuted");
assert.equal(refuted.verification.EVerify, 1);
assert.equal(refuted.verification.hypothesisVerification[0].observedValue, 0.12);

const unreadable = runScenario("hypothesis-inconclusive", null, 0.25);
assert.equal(unreadable.final.hypotheses[0].status, "inconclusive");
assert.equal(unreadable.verification.EVerify, 0, "unreadable evidence must not grant verification effort");

let currentAction = RUNTIME.createState("current-action-hypothesis");
currentAction = RUNTIME.applyDecision(currentAction, decision({
  id: "current-action-rank",
  action: "challenge:r1_main_7",
  verificationScope: "current_action",
  targetCondition: { metric: "damageRank", operator: "==", value: 1 },
}));
currentAction = RUNTIME.ingestEvents(currentAction, [event({
  id: "combat:current-action-rank",
  type: "team_experiment_result",
  behavior: { kind: "team_experiment", key: "challenge:r1_main_7" },
  result: {
    kind: "team_experiment_result",
    occurred: true,
    heroId: "hero_ranger",
    contribution: { observed: true, damage: 700, damageRank: 1 },
    components: [{ kind: "team_experiment_contribution" }],
  },
})]);
assert.equal(currentAction.hypotheses[0].status, "confirmed");
assert.equal(currentAction.trace.at(-1).EVerify, 1);

console.log(JSON.stringify({
  result: "PASS",
  confirmed: confirmed.final.hypotheses[0],
  refuted: refuted.final.hypotheses[0],
  inconclusive: unreadable.final.hypotheses[0],
}, null, 2));

function runScenario(id, damageShare, threshold) {
  let state = RUNTIME.createState(id);
  state = RUNTIME.applyDecision(state, decision({
    id,
    action: "swap:2:hero_ranger",
    verificationScope: "next_combat",
    targetCondition: { metric: "damageShare", operator: ">=", value: threshold },
  }));

  const afterUnrelated = RUNTIME.ingestEvents(state, [event({
    id: `unrelated:${id}`,
    type: "action_summary",
    behavior: { kind: "equip_item", key: "equip:hero_ranger:item" },
    result: { kind: "action_summary", occurred: true, components: [{ kind: "item_equipped" }] },
  })]);

  const contribution = damageShare === null
    ? { observed: true, damage: 40 }
    : { observed: true, damage: 40, damageShare };
  const final = RUNTIME.ingestEvents(afterUnrelated, [event({
    id: `combat:${id}`,
    type: "team_experiment_result",
    behavior: { kind: "team_experiment", key: "challenge:r1_main_7" },
    result: {
      kind: "team_experiment_result",
      occurred: true,
      heroId: "hero_ranger",
      contribution,
      components: [{ kind: "team_experiment_contribution" }],
    },
  })]);
  return { afterUnrelated, final, verification: final.trace.at(-1) };
}

function decision({ id, action, verificationScope, targetCondition }) {
  return {
    id: `decision:${id}`,
    action,
    goalId: "grow_and_progress",
    alternatives: [{ action: "challenge:r1_main_6", reason: "Continue without testing the Ranger." }],
    reasoningChain: [
      { kind: "goal", evidence: "Improve the active team." },
      { kind: "knowledge", evidence: "The Ranger has not fought in the active team." },
      { kind: "affordance", evidence: "A swap can place the Ranger in the team." },
      { kind: "comparison", evidence: "Continuing now would not test the Ranger." },
      { kind: "hypothesis", evidence: "The next battle can measure Ranger damage share." },
    ],
    hypothesis: {
      id,
      problem: "Ranger contribution is unknown.",
      cause: "Ranger should provide sustained single-target damage.",
      resultKind: "team_experiment_contribution",
      target: "hero_ranger",
      verificationScope,
      targetCondition,
    },
  };
}

function event(input) {
  return {
    id: input.id,
    time: 1,
    type: input.type,
    subject: { id: "player_squad", role: "player_squad", side: "left" },
    environment: { region: "region_1", node: "test", phase: "result" },
    behavior: input.behavior,
    result: input.result,
    presentation: { visible: true, hasSource: true, hasTarget: true, hasNumber: true, hasAnimation: true },
    directResult: false,
  };
}
