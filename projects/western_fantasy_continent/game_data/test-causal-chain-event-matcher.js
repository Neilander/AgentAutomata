const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  matchCausalChain,
  validateMatcherHypothesis,
} = require("./causal-chain-event-matcher");
const {
  parseBattleInformation,
} = require("../experiments/player_agent_api_loop_v1/battle-information-parser");

const rangerChain = hypothesis({
  id: "ranger-breaks-protected-formation",
  claim: "The ranger's focused damage breaks the protected formation.",
  chosenBehavior: "field ranger and focus the protected high-health enemy",
  steps: [
    step("ranger-damage-up", "Ranger damage rises.", {
      predicate: "damage_increased",
      subject: ref("hero_ranger"),
      qualifiersAll: ["damage_up"],
      environment: { node: "trial_gate" },
    }),
    step("ranger-kills-anchor", "Ranger defeats the protected high-health enemy.", {
      predicate: "target_defeated",
      subject: ref("hero_ranger"),
      object: concept("enemy_high_health", "visible_entity:protected_anchor"),
      qualifiersAll: ["high_health", "protected"],
      environment: { node: "trial_gate" },
      exclusiveSubject: true,
    }),
    step("formation-breaks", "The protected enemy formation breaks.", {
      predicate: "formation_broken",
      subject: ref("enemy_team"),
      qualifiersAll: ["formation", "protected"],
      environment: { node: "trial_gate" },
    }),
    step("team-wins", "The player team wins.", {
      predicate: "combat_won",
      subject: ref("player_squad"),
      environment: { node: "trial_gate" },
    }),
  ],
});

assert.equal(validateMatcherHypothesis(rangerChain).valid, true);

const fullRangerPath = run("full_ranger_path", rangerChain, [
  event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
  event("noise-hit", 2, "damage_dealt", ref("hero_mage"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["fire"], "standard_low"),
  event("ranger-kill", 5, "target_defeated", ref("hero_ranger"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent"),
  event("break", 6, "formation_broken", ref("enemy_team"), null, ["formation", "protected"], "highlight"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(fullRangerPath.everify.status, "confirmed");
assert.equal(fullRangerPath.everify.dimensions.support, 1);
assert.equal(fullRangerPath.everify.dimensions.strength, 0.7);
assert.equal(fullRangerPath.audit.usedFullOrderedPath, true);

const killStolenByMage = run("kill_stolen_by_mage", rangerChain, [
  event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
  event("mage-kill", 5, "target_defeated", ref("hero_mage"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent"),
  event("break", 6, "formation_broken", ref("enemy_team"), null, ["formation", "protected"], "highlight"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(killStolenByMage.everify.status, "refuted");
assert.equal(killStolenByMage.everify.dimensions.support, -1);
assert.equal(
  killStolenByMage.stepMatches[1].reason,
  "exclusive_outcome_has_different_subject",
);

const mageKillsDifferentHighHealthEnemy = run(
  "mage_kills_different_high_health_enemy",
  rangerChain,
  [
    event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
    event("mage-kill-other", 5, "target_defeated", ref("hero_mage"), concept("enemy_high_health", "visible_entity:other_guard"), ["high_health", "protected"], "prominent"),
    event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
  ],
);
assert.equal(mageKillsDifferentHighHealthEnemy.everify.status, "inconclusive");
assert.equal(mageKillsDifferentHighHealthEnemy.stepMatches[1].state, "unknown");
assert.notEqual(
  mageKillsDifferentHighHealthEnemy.stepMatches[1].reason,
  "exclusive_outcome_has_different_subject",
);

const missingFormationSignal = run("missing_formation_signal", rangerChain, [
  event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
  event("ranger-kill", 5, "target_defeated", ref("hero_ranger"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(missingFormationSignal.everify.status, "partially_confirmed");
assert.equal(missingFormationSignal.everify.dimensions.support, 0);
assert.equal(missingFormationSignal.stepMatches[2].state, "unknown");

const lowPerceptionMissedBuff = run("low_perception_missed_buff", rangerChain, [
  event("ranger-kill", 5, "target_defeated", ref("hero_ranger"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent"),
  event("break", 6, "formation_broken", ref("enemy_team"), null, ["formation", "protected"], "highlight"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(lowPerceptionMissedBuff.everify.status, "inconclusive");
assert.equal(lowPerceptionMissedBuff.everify.dimensions.support, 0);
assert.equal(lowPerceptionMissedBuff.stepMatches[0].state, "unknown");

const formationBreaksTooEarly = run("formation_breaks_before_anchor_kill", rangerChain, [
  event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
  event("break", 3, "formation_broken", ref("enemy_team"), null, ["formation", "protected"], "highlight"),
  event("ranger-kill", 5, "target_defeated", ref("hero_ranger"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(formationBreaksTooEarly.everify.status, "refuted");
assert.equal(
  formationBreaksTooEarly.everify.chainAudit.links[1].temporalOrderValid,
  false,
);

const wrongEncounter = run("same_events_wrong_encounter", rangerChain, [
  event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high", "other_gate"),
  event("ranger-kill", 5, "target_defeated", ref("hero_ranger"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent", "other_gate"),
  event("break", 6, "formation_broken", ref("enemy_team"), null, ["formation", "protected"], "highlight", "other_gate"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking", "other_gate"),
]);
assert.equal(wrongEncounter.everify.status, "inconclusive");
assert.equal(wrongEncounter.everify.comparisonMade, false);

const shieldChain = hypothesis({
  id: "shield-buys-time-for-ultimate",
  claim: "Priest shield keeps the tank alive until the mage ultimate.",
  chosenBehavior: "field priest and tank together",
  steps: [
    step("shield", "Priest shields the tank.", {
      predicate: "shield_applied",
      subject: ref("hero_priest"),
      object: ref("hero_tank"),
      qualifiersAll: ["shielded"],
    }),
    step("tank-survives", "Tank survives until the ultimate window.", {
      predicate: "survived_checkpoint",
      subject: ref("hero_tank"),
      qualifiersAll: ["alive"],
    }),
    step("mage-ultimate", "Mage casts the ultimate.", {
      predicate: "skill_cast",
      subject: ref("hero_mage"),
      qualifiersAll: ["ultimate"],
    }),
    step("team-wins", "The player team wins.", {
      predicate: "combat_won",
      subject: ref("player_squad"),
    }),
  ],
});
const shieldSuccess = run("shield_chain_success", shieldChain, [
  event("shield", 2, "shield_applied", ref("hero_priest"), ref("hero_tank"), ["shielded"], "standard"),
  event("alive", 7, "survived_checkpoint", ref("hero_tank"), null, ["alive"], "standard_high"),
  event("ult", 8, "skill_cast", ref("hero_mage"), null, ["ultimate"], "highlight"),
  event("win", 10, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(shieldSuccess.everify.status, "confirmed");
assert.equal(shieldSuccess.everify.dimensions.strength, 0.6);

const tankDiesBeforeUltimate = run("tank_dies_before_ultimate", shieldChain, [
  event("shield", 2, "shield_applied", ref("hero_priest"), ref("hero_tank"), ["shielded"], "standard"),
  event("tank-down", 5, "ally_defeated", ref("hero_tank"), null, [], "highlight"),
  event("ult", 8, "skill_cast", ref("hero_mage"), null, ["ultimate"], "highlight"),
  event("loss", 10, "combat_lost", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(tankDiesBeforeUltimate.everify.status, "refuted");
assert.equal(
  tankDiesBeforeUltimate.stepMatches[1].reason,
  "opposite_predicate:ally_defeated",
);
assert.equal(
  tankDiesBeforeUltimate.stepMatches[3].reason,
  "opposite_predicate:combat_lost",
);

const controlChain = hypothesis({
  id: "slow-delays-backline-for-ultimate",
  claim: "Ranger slow delays the enemy backline until the mage ultimate.",
  chosenBehavior: "field ranger with mage",
  steps: [
    step("slow", "Ranger slows the enemy backline.", {
      predicate: "control_applied",
      subject: ref("hero_ranger"),
      object: concept("enemy_backline"),
      qualifiersAll: ["slow"],
    }),
    step("ultimate", "Mage casts the ultimate.", {
      predicate: "skill_cast",
      subject: ref("hero_mage"),
      qualifiersAll: ["ultimate"],
    }),
    step("backline-falls", "Mage defeats the enemy backline.", {
      predicate: "target_defeated",
      subject: ref("hero_mage"),
      object: concept("enemy_backline"),
      exclusiveSubject: true,
    }),
    step("win", "The player team wins.", {
      predicate: "combat_won",
      subject: ref("player_squad"),
    }),
  ],
});
const controlSuccess = run("control_chain_success", controlChain, [
  event("slow", 1, "control_applied", ref("hero_ranger"), concept("enemy_backline"), ["slow"], "standard_high"),
  event("ult", 5, "skill_cast", ref("hero_mage"), null, ["ultimate"], "highlight"),
  event("kill", 6, "target_defeated", ref("hero_mage"), concept("enemy_backline"), [], "prominent"),
  event("win", 9, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(controlSuccess.everify.status, "confirmed");

const repeatedNoiseUsesBestOrderedPath = run("repeated_noise_uses_ordered_path", controlChain, [
  event("old-ult", 0.5, "skill_cast", ref("hero_mage"), null, ["ultimate"], "ambient"),
  event("slow", 1, "control_applied", ref("hero_ranger"), concept("enemy_backline"), ["slow"], "standard_high"),
  event("real-ult", 5, "skill_cast", ref("hero_mage"), null, ["ultimate"], "highlight"),
  event("kill", 6, "target_defeated", ref("hero_mage"), concept("enemy_backline"), [], "prominent"),
  event("win", 9, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(repeatedNoiseUsesBestOrderedPath.everify.status, "confirmed");
assert.equal(repeatedNoiseUsesBestOrderedPath.stepMatches[1].semanticEventId, "battle_signal:real-ult");

const fullPathWithCompetingMageCause = run("full_path_with_competing_mage_cause", rangerChain, [
  event("buff", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
  event("mage-ult", 4, "skill_cast", ref("hero_mage"), null, ["ultimate"], "highlight"),
  event("ranger-kill", 5, "target_defeated", ref("hero_ranger"), concept("enemy_high_health", "visible_entity:protected_anchor"), ["high_health", "protected"], "prominent"),
  event("break", 6, "formation_broken", ref("enemy_team"), null, ["formation", "protected"], "highlight"),
  event("win", 12, "combat_won", ref("player_squad"), null, [], "blocking"),
]);
assert.equal(fullPathWithCompetingMageCause.everify.status, "confirmed");
assert.equal(fullPathWithCompetingMageCause.audit.provesPathOccurredNotExclusiveCause, true);
assert.equal(fullPathWithCompetingMageCause.audit.supportsPrimaryCauseClaims, false);

const actualFixture = JSON.parse(fs.readFileSync(
  path.join(
    __dirname,
    "..",
    "experiments",
    "player_agent_api_loop_v1",
    "fixtures",
    "battle-information-real-event-log.json",
  ),
  "utf8",
));
const actualParsed = parseBattleInformation(actualFixture.rawEventLog, {
  perceptionLevel: "ordinary",
  seed: "causal-chain:2",
  causalContext: {
    node: "r2_flag_trial",
    region: "region_2",
    teamMembers: [
      { id: "hero_warrior", name: "灰鸦战士" },
      { id: "hero_mage", name: "烬火法师" },
      { id: "hero_priest", name: "晨祷牧师" },
      { id: "hero_ranger", name: "林地游侠" },
    ],
  },
});
const actualAggregateParsed = parseBattleInformation(actualFixture.rawEventLog, {
  perceptionLevel: "ordinary",
  seed: "causal-chain-actual-fixture",
});
const actualEnemyDefeated = actualAggregateParsed.signals.find((row) => row.type === "enemy_defeated");
const actualOutcome = actualParsed.signals.find((row) => row.type === "combat_outcome");
assert(actualEnemyDefeated);
assert(actualOutcome);
assert.equal(actualEnemyDefeated.statement.includes("林地游侠"), false);

const currentAggregateSignalsCannotProveFineChain = run(
  "actual_fixture_aggregate_signals_cannot_prove_fine_chain",
  rangerChain,
  [
    event("group-kills", 7, "enemy_group_defeated", ref("player_squad"), concept("enemy_generic"), [], "standard_low"),
    event("win", 49.6, "combat_won", ref("player_squad"), null, [], "blocking"),
  ],
);
assert.equal(currentAggregateSignalsCannotProveFineChain.everify.status, "inconclusive");
assert.equal(currentAggregateSignalsCannotProveFineChain.stepMatches[1].state, "unknown");

const actualRangerDamage = actualParsed.causalEvidence.find((row) => (
  row.predicate === "damage_dealt" && row.time === 10.88
));
const actualRangerKill = actualParsed.causalEvidence.find((row) => (
  row.predicate === "target_defeated" && row.time === 11.6
));
const actualCombatWin = actualParsed.causalEvidence.find((row) => row.predicate === "combat_won");
assert(actualRangerDamage);
assert(actualRangerKill);
assert(actualCombatWin);
assert.deepEqual(actualRangerDamage.subject, actualRangerKill.subject);
assert.deepEqual(actualRangerDamage.object, actualRangerKill.object);
const actualVisibleRangerChain = hypothesis({
  id: "actual-visible-ranger-chain",
  claim: "The visible ranger damaged and then defeated the same visible enemy before the team won.",
  chosenBehavior: "keep the visible ranger focused on the same target",
  steps: [
    step("visible-ranger-damage", "The ranger damages the target.", {
      predicate: "damage_dealt",
      subject: actualRangerDamage.subject,
      object: actualRangerDamage.object,
      environment: { node: "r2_flag_trial" },
    }),
    step("visible-ranger-kill", "The ranger defeats that target.", {
      predicate: "target_defeated",
      subject: actualRangerKill.subject,
      object: actualRangerKill.object,
      environment: { node: "r2_flag_trial" },
      exclusiveSubject: true,
    }),
    step("visible-team-win", "The player team wins.", {
      predicate: "combat_won",
      subject: actualCombatWin.subject,
      environment: { node: "r2_flag_trial" },
    }),
  ],
});
const actualVisibleRangerPath = run(
  "actual_fixture_visible_causal_channel_confirms_ranger_path",
  actualVisibleRangerChain,
  actualParsed.causalEvidence,
);
assert.equal(actualVisibleRangerPath.everify.status, "confirmed");
assert.equal(actualVisibleRangerPath.audit.usedFullOrderedPath, true);

const primaryCauseClaim = structuredClone(rangerChain);
primaryCauseClaim.id = "ranger-is-primary-cause";
primaryCauseClaim.claimMode = "primary_cause";
const primaryCauseRejected = {
  id: "primary_cause_claim_rejected",
  ...matchCausalChain({
    hypothesis: primaryCauseClaim,
    receivedSemanticEvents: [],
  }),
};
assert.equal(primaryCauseRejected.status, "invalid_input");
assert.ok(primaryCauseRejected.hypothesisValidation.errors.includes(
  "primary_cause_not_supported_by_observational_matcher",
));

const rawIdentityRejected = run("raw_identity_rejected", rangerChain, [
  {
    ...event("raw", 1, "damage_increased", ref("hero_ranger"), null, ["damage_up"], "standard_high"),
    subject: { refId: "left-4" },
  },
]);
assert.equal(rawIdentityRejected.eventValidation.rejected[0].reason, "event_subject_refId_raw_identity_forbidden");
assert.equal(rawIdentityRejected.everify.comparisonMade, false);

const results = [
  fullRangerPath,
  killStolenByMage,
  mageKillsDifferentHighHealthEnemy,
  missingFormationSignal,
  lowPerceptionMissedBuff,
  formationBreaksTooEarly,
  wrongEncounter,
  shieldSuccess,
  tankDiesBeforeUltimate,
  controlSuccess,
  repeatedNoiseUsesBestOrderedPath,
  fullPathWithCompetingMageCause,
  currentAggregateSignalsCannotProveFineChain,
  actualVisibleRangerPath,
  primaryCauseRejected,
  rawIdentityRejected,
];

console.log(JSON.stringify({
  result: "PASS",
  scope: "isolated_structured_event_matcher_not_formal_runtime",
  caseCount: results.length,
  statusCounts: results.reduce((counts, row) => {
    const status = row.everify?.status || row.status;
    counts[status] = (counts[status] || 0) + 1;
    return counts;
  }, {}),
  cases: results.map(summary),
  observedLimit: {
    sourceFixture: actualFixture.schema,
    actualReceivedSignalTypes: actualParsed.signals.map((row) => row.type),
    actualEnemyDefeatedStatement: actualEnemyDefeated.statement,
    currentAggregateBattleSignalsCanConfirmFineRangerKillChain: false,
    causalEvidenceChannelCanConfirmFineRangerKillChain: true,
    receivedCausalEvidenceCount: actualParsed.causalEvidence.length,
    reason: "The summary stays aggregated, while the separate non-knowledge causal channel retains perceived actor-target-time evidence.",
  },
}, null, 2));

function hypothesis({ id, claim, chosenBehavior, steps }) {
  return {
    id,
    claim,
    claimMode: "contributing_path",
    chosenBehavior,
    causalChain: steps,
  };
}

function step(id, statement, matcher) {
  return { id, statement, matcher };
}

function ref(refId) {
  return { refId };
}

function concept(conceptId, publicEntityId) {
  return {
    conceptId,
    ...(publicEntityId ? { publicEntityId } : {}),
    side: "enemy",
  };
}

function event(
  id,
  time,
  predicate,
  subject,
  object,
  qualifiers,
  informationTier,
  node = "trial_gate",
) {
  return {
    id: `battle_signal:${id}`,
    time,
    predicate,
    subject: subject || {},
    object: object || {},
    qualifiers,
    environment: { node },
    informationTier,
  };
}

function run(id, chain, events) {
  return {
    id,
    ...matchCausalChain({
      hypothesis: chain,
      receivedSemanticEvents: events,
    }),
  };
}

function summary(row) {
  const hypothesisErrors = row.hypothesisValidation?.errors || [];
  const eventRejections = row.eventValidation?.rejected || [];
  return {
    id: row.id || row.hypothesisValidation?.id,
    matcherStatus: row.status,
    everifyStatus: row.everify?.status || null,
    support: row.everify?.dimensions?.support ?? null,
    strength: row.everify?.dimensions?.strength ?? null,
    stepStates: row.stepMatches?.map((stepRow) => stepRow.state) || [],
    rejectionReasons: hypothesisErrors.length ? hypothesisErrors : eventRejections,
  };
}
