const assert = require("assert");
const RUNTIME = require("./player-cognition-v3-event-runtime");
const POLICY = require("./player-cognition-v3-action-policy");
const LOOP = require("./analyze-map-cognition-v3-action-loop");
const ADAPTER = require("./map-cognition-v3-event-adapter");

function characterEvent(visible = true) {
  return {
    id: visible ? "visible-ranger" : "hidden-ranger",
    time: 1,
    type: "character_unlock",
    subject: { id: "player_squad", role: "player_squad" },
    environment: { node: "r1_prison", phase: "reward" },
    behavior: { kind: "encounter_reward", key: "reward:r1_prison" },
    result: { kind: "character_unlock", occurred: true, character: "ranger" },
    presentation: { visible, hasSource: true, hasTarget: true, hasAnimation: true },
  };
}

function observation(options = {}) {
  const bossStatus = options.bossStatus || "available";
  return {
    step: 8,
    currentGoal: "test the newly rescued Ranger",
    gear: { score: 300 },
    team: "Warrior、Barricade、Mage、Herb",
    roster: [
      { id: "hero_warrior", name: "Warrior", kind: "hero", role: "warrior" },
      { id: "militia_barricade", name: "Barricade", kind: "militia", role: "warrior" },
      { id: "hero_mage", name: "Mage", kind: "hero", role: "mage" },
      { id: "militia_herb", name: "Herb", kind: "militia", role: "priest" },
      { id: "hero_ranger", name: "Ranger", kind: "hero", role: "ranger" },
      { id: "militia_spear", name: "Spear", kind: "militia", role: "warrior" },
    ],
    visibleNodes: [
      { id: "r1_main_7", name: "Ranger proof", type: "main", status: options.proofStatus || "available", rewardHint: "role proof" },
      { id: "r1_boss", name: "Boss", type: "boss", status: bossStatus, rewardHint: "region clear" },
    ],
    allowedActions: ["swap:0:hero_ranger", "swap:1:hero_ranger", "swap:2:hero_ranger", "swap:3:hero_ranger", "challenge:r1_main_7"],
  };
}

function teamChangedEvent() {
  return {
    id: "team-change-ranger",
    time: 2,
    type: "team_change",
    subject: { id: "player_squad", role: "player_squad" },
    environment: { phase: "team" },
    behavior: { kind: "team_management", key: "swap:1:hero_ranger" },
    result: { kind: "team_changed", occurred: true, heroId: "hero_ranger", slotIndex: 1 },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
  };
}

function experimentResultEvent() {
  return {
    id: "ranger-combat-proof",
    time: 3,
    type: "team_experiment_result",
    subject: { id: "player_squad", role: "player_squad" },
    environment: { node: "r1_main_7", phase: "result" },
    behavior: { kind: "team_experiment", key: "challenge:r1_main_7" },
    result: {
      kind: "team_experiment_result",
      occurred: true,
      experimentId: "team-experiment:hero_ranger",
      heroId: "hero_ranger",
      heroPresent: true,
      node: "r1_main_7",
      outcome: "win",
      contribution: { observed: true, damage: 100, heal: 0, shield: 0, skillCount: 1 },
      components: [{ kind: "team_experiment_contribution" }],
    },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: false },
    directResult: false,
  };
}

function testVisibleUnlockCreatesBoundedExperiment() {
  const state = RUNTIME.ingestEvents(RUNTIME.createState("visible"), [characterEvent(true)]);
  assert.equal(state.affordanceExperiments.length, 1);
  const choice = POLICY.selectNextAction(state, observation());
  assert.equal(choice.action, "swap:1:hero_ranger", "visible new Ranger voluntarily replaces visible militia");

  const changed = RUNTIME.ingestEvents(choice.cognitionState, [teamChangedEvent()]);
  assert.equal(changed.affordanceExperiments[0].status, "awaiting_combat");
  assert.equal(changed.hypotheses.find((row) => row.id === "verify-team-experiment:hero_ranger").status, "pending");
  const swapSummary = {
    id: "swap-summary",
    time: 2.5,
    type: "action_summary",
    subject: { id: "player_squad", role: "player_squad" },
    environment: { phase: "team" },
    behavior: { kind: "map_action", key: "swap:1:hero_ranger" },
    result: { kind: "action_summary", occurred: true, components: [{ kind: "action_changed" }] },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: false },
  };
  const afterSwapSummary = RUNTIME.ingestEvents(changed, [swapSummary]);
  assert.equal(afterSwapSummary.hypotheses.find((row) => row.id === "verify-team-experiment:hero_ranger").status, "pending", "swap boundary cannot prematurely refute combat hypothesis");
  const next = POLICY.selectNextAction(changed, observation());
  assert.equal(next.action, "challenge:r1_main_7", "one swap leads to combat instead of swap oscillation");

  const resolved = RUNTIME.ingestEvents(afterSwapSummary, [experimentResultEvent()]);
  assert.equal(resolved.affordanceExperiments[0].status, "resolved");
  assert.equal(resolved.hypotheses.find((row) => row.id === "verify-team-experiment:hero_ranger").status, "confirmed");
}

function testHiddenAndOldReserveDoNotCreateExperiment() {
  const hidden = RUNTIME.ingestEvents(RUNTIME.createState("hidden"), [characterEvent(false)]);
  assert.equal(hidden.affordanceExperiments.length, 0, "hidden unlock creates no experiment");
  const ordinary = POLICY.selectNextAction(RUNTIME.createState("ordinary"), observation());
  assert.equal(ordinary.action, "challenge:r1_main_7", "an old visible reserve without unlock evidence gets no novelty boost");
}

function testSettledContributionAndExplicitAbsence() {
  const contribution = ADAPTER.summarizeExperimentContribution({
    state: { roster: [{ id: "hero_ranger", name: "Ranger" }] },
    analysis: { combatSignals: [] },
    event: { contributions: [{ name: "Ranger", damage: 999 }] },
  }, { heroId: "hero_ranger" });
  assert.equal(contribution.observed, true, "the exposed combat settlement is authoritative contribution evidence");
  assert.equal(contribution.damage, 999);
  assert.equal(contribution.damageShare, 1);
  assert.equal(contribution.damageRank, 1);

  const noContribution = ADAPTER.summarizeExperimentContribution({
    state: { roster: [{ id: "hero_ranger", name: "Ranger" }] },
    analysis: { combatSignals: [] },
    event: { contributions: [] },
  }, { heroId: "hero_ranger" });
  assert.equal(noContribution.observed, false);

  const unlocked = RUNTIME.ingestEvents(RUNTIME.createState("hidden-contribution"), [characterEvent(true)]);
  const selected = POLICY.selectNextAction(unlocked, observation());
  const changed = RUNTIME.ingestEvents(selected.cognitionState, [teamChangedEvent()]);
  const noVisibleContribution = {
    ...experimentResultEvent(),
    id: "ranger-no-visible-contribution",
    result: {
      ...experimentResultEvent().result,
      contribution: noContribution,
      components: [],
    },
  };
  const settled = RUNTIME.ingestEvents(changed, [noVisibleContribution]);
  assert.equal(settled.affordanceExperiments[0].status, "resolved", "combat boundary resolves the bounded experiment");
  assert.equal(settled.hypotheses.find((row) => row.id === "verify-team-experiment:hero_ranger").status, "refuted", "absence of visible contribution explicitly refutes instead of leaving a pending hypothesis");
}

function testOnlyOneCharacterExperimentRunsAtATime() {
  const assassinUnlock = {
    ...characterEvent(true),
    id: "visible-assassin",
    result: { kind: "character_unlock", occurred: true, character: "assassin" },
  };
  const dualObservation = observation();
  dualObservation.roster.push({ id: "hero_assassin", name: "Assassin", kind: "hero", role: "assassin" });
  dualObservation.allowedActions.push(
    "swap:0:hero_assassin",
    "swap:1:hero_assassin",
    "swap:2:hero_assassin",
    "swap:3:hero_assassin",
  );

  const unlocked = RUNTIME.ingestEvents(RUNTIME.createState("dual-unlock"), [characterEvent(true), assassinUnlock]);
  const first = POLICY.selectNextAction(unlocked, dualObservation);
  assert.ok(first.action.startsWith("swap:"), "one newly unlocked character starts an experiment");
  const firstHero = first.action.split(":")[2];
  const changed = RUNTIME.ingestEvents(first.cognitionState, [{
    ...teamChangedEvent(),
    id: `team-change-${firstHero}`,
    behavior: { kind: "team_management", key: first.action },
    result: { kind: "team_changed", occurred: true, heroId: firstHero, slotIndex: Number(first.action.split(":")[1]) },
  }]);
  const beforeEvidence = POLICY.selectNextAction(changed, dualObservation);
  assert.equal(beforeEvidence.action, "challenge:r1_main_7", "a second character swap waits until the active experiment receives combat evidence");

  const swapsOnly = {
    ...dualObservation,
    visibleNodes: [],
    allowedActions: ["swap:0:hero_ranger", "swap:1:hero_assassin"],
  };
  const waiting = POLICY.selectNextAction(changed, swapsOnly);
  assert.equal(waiting.action, null, "blocked swaps are removed from the choice set rather than selected as the least-negative action");
}

function testTerminalWaitsThenReleases() {
  const available = RUNTIME.ingestEvents(RUNTIME.createState("terminal"), [characterEvent(true)]);
  const done = observation({ bossStatus: "cleared", proofStatus: "farmable" });
  assert.equal(POLICY.selectNextAction(available, done).terminal, undefined, "terminal waits for meaningful new-character experiment");
  const changed = RUNTIME.ingestEvents(available, [teamChangedEvent()]);
  assert.equal(POLICY.selectNextAction(changed, done).terminal, undefined, "terminal waits for following combat verification");
  const resolved = RUNTIME.ingestEvents(changed, [experimentResultEvent()]);
  assert.equal(POLICY.selectNextAction(resolved, done).terminal, true, "terminal releases after experiment resolution");
}

function testRealRoutes() {
  for (const seed of ["phase2-a", "phase2-b", "phase2-c", "phase2-d", "phase2-e"]) {
    const result = LOOP.runLoop(seed, 40);
    assert.equal(result.ok, true, `${seed} completes`);
    const actions = result.loop.actions.map((row) => row.action);
    assert.equal(actions.filter((action) => action.startsWith("swap:")).length, 1, `${seed} performs exactly one swap`);
    assert.equal(result.loop.gameState.teamSlots.includes("hero_ranger"), true, `${seed} keeps Ranger active`);
    assert.equal(result.loop.cognitionState.affordanceExperiments[0].status, "resolved", `${seed} verifies Ranger in combat`);
    assert.ok(result.loop.terminal, `${seed} terminates after verification`);
  }
}

testVisibleUnlockCreatesBoundedExperiment();
testHiddenAndOldReserveDoNotCreateExperiment();
testSettledContributionAndExplicitAbsence();
testOnlyOneCharacterExperimentRunsAtATime();
testTerminalWaitsThenReleases();
testRealRoutes();
console.log("player cognition V3 character affordance tests passed");
