const fs = require("node:fs");
const path = require("node:path");
const EXPECTATION = require("./roster-change-expectation");
const IMPRESSIONS = require("../entity_impression_knowledge_v1/entity-impression-model");
const PROFILES = require("./player-profiles");

const PROFILE_IDS = [
  "open_novice",
  "damage_absolutist",
  "safety_conservative",
  "low_friction_optimizer",
  "inertial_player",
  "novelty_collector",
];
const NODE = "visible_swarm_gate";
const NAMES = {
  vanguard: "Grey Vanguard",
  priest: "Dawn Priest",
  ranger: "Moss Ranger",
  recruit: "Field Recruit",
  weak_guard: "Shield Recruit",
  strong_blade: "Ember Champion",
  area_mage: "Storm Mage",
};

function initializeProfile(profileId) {
  const entityImpressionState = seededCognition();
  let rosterExpectationState = EXPECTATION.createState();
  rosterExpectationState = EXPECTATION.recordChallenge(rosterExpectationState, {
    teamIds: ["vanguard", "priest", "ranger", "recruit"],
    entityImpressionState,
    record: challenge("loss", 2, 3),
  }).state;
  return {
    schema: "controlled_real_agent_roster_state_v1",
    profileId,
    round: 1,
    status: "decision",
    currentTeamIds: ["vanguard", "priest", "ranger", "recruit"],
    entityImpressionState,
    rosterExpectationState,
    visibleHistory: [{
      round: 0,
      action: `challenge:${NODE}`,
      outcome: "loss",
      performanceScore: -0.25,
      teamIds: ["vanguard", "priest", "ranger", "recruit"],
    }],
  };
}

function buildRequest(state) {
  const allowedActions = allowedActionsFor(state.currentTeamIds);
  const expectations = EXPECTATION.buildExpectations({
    state: state.rosterExpectationState,
    currentTeamIds: state.currentTeamIds,
    allowedActions,
    visibleNodeIds: [NODE],
    entityImpressionState: state.entityImpressionState,
  });
  const profile = PROFILES.createProfileState(state.profileId);
  return {
    schema: "controlled_real_agent_roster_decision_v1",
    episode: "one visible failure-and-retry loop",
    round: state.round,
    persistentAgentSession: `roster-real-agent:${state.profileId}`,
    instruction: "Act as this persistent player profile. Choose exactly one allowed action using only this request. Profile priors are fallible habits, not game truth. Do not optimize for an evaluator and do not assume future outcomes. Explain the visible problem, evidence, action comparison, and one observable next-fight hypothesis.",
    playerProfile: profile,
    visibleState: {
      goal: "clear the visible swarm gate",
      currentTeam: state.currentTeamIds.map(characterView),
      lastBattle: state.visibleHistory.at(-1),
      failureMemory: {
        encounter: NODE,
        exactCurrentTeamFailed: state.visibleHistory.at(-1)?.outcome === "loss",
        attemptsInVisibleHistory: state.visibleHistory.length,
      },
      characterImpressions: currentImpressions(state.entityImpressionState),
      rosterChangeExpectations: expectations,
      actionCosts: Object.fromEntries(allowedActions.map((action) => [action, action.startsWith("swap:")
        ? { resourceCost: 0, interactionCost: "one roster change", reversible: true }
        : { resourceCost: 0, interactionCost: "immediate retry", reversible: true }])),
      allowedActions,
    },
    responseContract: {
      action: "one exact value from visibleState.allowedActions",
      reasoningChain: ["visible_problem", "known_evidence", "affordance_comparison", "chosen_behavior", "observable_hypothesis"],
      acknowledgedAlternatives: "at least one unchosen legal action and why it lost",
      confidence: "0..1 player confidence, not a win probability",
    },
  };
}

function advance(state, action) {
  const allowed = allowedActionsFor(state.currentTeamIds);
  if (!allowed.includes(action)) throw new Error(`illegal action for ${state.profileId}: ${action}`);
  const beforeTeamIds = [...state.currentTeamIds];
  if (action.startsWith("swap:")) {
    const [, slotText, incomingId] = action.split(":");
    state.currentTeamIds[Number(slotText)] = incomingId;
  }
  const settlement = outcomeFor(state.currentTeamIds);
  state.rosterExpectationState = EXPECTATION.recordChallenge(state.rosterExpectationState, {
    teamIds: state.currentTeamIds,
    entityImpressionState: state.entityImpressionState,
    record: challenge(settlement.outcome, settlement.playerHp, settlement.enemyHp),
  }).state;
  state.visibleHistory.push({
    round: state.round,
    action,
    teamBefore: beforeTeamIds,
    teamIds: [...state.currentTeamIds],
    outcome: settlement.outcome,
    performanceScore: EXPECTATION.combatPerformanceScore(challenge(settlement.outcome, settlement.playerHp, settlement.enemyHp).gameEvent),
    visibleResult: settlement.visibleResult,
  });
  state.round += 1;
  state.status = settlement.outcome === "win" ? "complete" : "decision";
  return { state, settlement };
}

function allowedActionsFor(teamIds) {
  const actions = [`challenge:${NODE}`];
  if (teamIds[3] !== "weak_guard") actions.push("swap:3:weak_guard");
  if (teamIds[3] !== "strong_blade") actions.push("swap:3:strong_blade");
  if (teamIds[3] !== "recruit") actions.push("swap:3:recruit");
  if (teamIds[2] !== "area_mage") actions.push("swap:2:area_mage");
  if (teamIds[2] !== "ranger") actions.push("swap:2:ranger");
  return actions;
}

function outcomeFor(teamIds) {
  if (teamIds[2] === "area_mage" && teamIds[3] === "strong_blade") {
    return { outcome: "win", playerHp: 3.6, enemyHp: 0.8, visibleResult: "the team clears with a large remaining-HP advantage" };
  }
  if (teamIds[2] === "area_mage") {
    return { outcome: "loss", playerHp: 2.6, enemyHp: 3.2, visibleResult: "swarm handling improves and the gap narrows, but the team still loses" };
  }
  if (teamIds[3] === "strong_blade") {
    return { outcome: "loss", playerHp: 2.8, enemyHp: 3.2, visibleResult: "still a loss, but the remaining-HP gap becomes much smaller" };
  }
  if (teamIds[3] === "weak_guard") {
    return { outcome: "loss", playerHp: 1.8, enemyHp: 3.2, visibleResult: "the replacement does not improve the visible result" };
  }
  return { outcome: "loss", playerHp: 1.9, enemyHp: 3.1, visibleResult: "the unchanged team loses again with a similar gap" };
}

function currentImpressions(state) {
  return IMPRESSIONS.listCurrentStrengthCognition(state).map((row) => ({
    character: characterView(row.subject.id),
    currentLevel: row.level,
    position: row.position,
    evidenceCount: row.evidenceCount,
  }));
}

function characterView(id) { return { id, name: NAMES[id] || id }; }

function seededCognition() {
  const state = IMPRESSIONS.createImpressionState({ profile: "expert" });
  state.strengthCognitionMatrix.entries = [
    seeded("vanguard", 6), seeded("priest", 5), seeded("ranger", 4), seeded("recruit", 1),
    seeded("weak_guard", 1.5), seeded("strong_blade", 7), seeded("area_mage", 6),
  ];
  IMPRESSIONS.STRENGTH_MATRIX.refreshStrengthScale(state.strengthCognitionMatrix);
  state.traitObservations.push(trait("ranger", "area_damage", 0));
  state.traitObservations.push(trait("recruit", "area_damage", 0));
  state.traitObservations.push(trait("area_mage", "area_damage", 6));
  return state;
}

function seeded(id, position) {
  return {
    subject: { id, name: NAMES[id], role: "visible_player_character" },
    position,
    stiffness: 4,
    evidenceCount: 3,
    firstObservedReportId: "controlled-visible-history",
    lastObservedReportId: "controlled-visible-history",
    lastObservedLevel: position,
    scaleView: null,
  };
}

function trait(id, domain, level) {
  return {
    subject: { id, name: NAMES[id], role: "visible_player_character" },
    reportId: `controlled-trait:${id}:${domain}`,
    observationOrder: 1,
    context: { tags: ["many_targets"] },
    basis: { visibleAttempts: 3 },
    claim: { domain, level, rawMagnitudePercent: level * 20 },
    eligible: true,
    evidenceReliability: 1,
  };
}

function challenge(outcome, playerHp, enemyHp) {
  return {
    outcome,
    action: `challenge:${NODE}`,
    gameEvent: {
      node: NODE,
      outcome,
      teamSizes: { player: 4, enemy: 4 },
      hpScore: { player: playerHp, enemy: enemyHp },
      waveSummary: [{ unitCount: 8 }],
    },
  };
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function init(outputDir) {
  for (const profileId of PROFILE_IDS) {
    const state = initializeProfile(profileId);
    const dir = path.join(outputDir, profileId);
    writeJson(path.join(dir, "state.json"), state);
    writeJson(path.join(dir, "request-1.json"), buildRequest(state));
  }
  writeJson(path.join(outputDir, "manifest.json"), {
    schema: "controlled_real_agent_roster_manifest_v1",
    profiles: PROFILE_IDS,
    boundedEpisode: "exact-team failure followed by at most two persistent Agent decisions",
    hiddenSettlementDisclosure: "Results are deterministic evaluator fixtures and never appear in a request before the corresponding action.",
  });
}

function advanceFiles(outputDir, profileId, action) {
  const dir = path.join(outputDir, profileId);
  const state = JSON.parse(fs.readFileSync(path.join(dir, "state.json"), "utf8"));
  const appliedRound = state.round;
  const result = advance(state, action);
  writeJson(path.join(dir, `settlement-${appliedRound}.json`), result.settlement);
  writeJson(path.join(dir, "state.json"), result.state);
  if (result.state.status === "decision") writeJson(path.join(dir, `request-${result.state.round}.json`), buildRequest(result.state));
  return result;
}

if (require.main === module) {
  const [command, outputArg, profileId, action] = process.argv.slice(2);
  const outputDir = path.resolve(outputArg || path.join(__dirname, "controlled_runs", "2026-07-16_roster_real_agents"));
  if (command === "init") init(outputDir);
  else if (command === "advance") advanceFiles(outputDir, profileId, action);
  else throw new Error("usage: node controlled-real-agent-roster-run.js init <outputDir> | advance <outputDir> <profileId> <action>");
}

module.exports = { PROFILE_IDS, initializeProfile, buildRequest, advance, init, advanceFiles };
