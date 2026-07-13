const CORE = require("../map_progression_lab/map-progression-cognition-core-phase2-recovery");
const RUNTIME = require("./player-cognition-v2-event-runtime");
const ADAPTER = require("./map-cognition-v2-event-adapter");
const POLICY = require("./player-cognition-v2-action-policy");

function run(seed = "phase2-c", maxActions = 40) {
  let gameState = CORE.initialState(seed);
  let cognitionState = RUNTIME.createState(seed);
  const route = [];
  for (let step = 1; step <= maxActions; step += 1) {
    const observation = CORE.observe(gameState);
    const choice = POLICY.selectNextAction(cognitionState, observation, { time: gameState.step || 0 });
    if (choice.terminal) return { ok: false, error: "terminal_before_character_unlock", route };
    const result = ADAPTER.runMapAction(CORE, gameState, choice.action, choice.cognitionState);
    if (!result.ok) return { ok: false, error: result.error, route };
    gameState = result.state;
    cognitionState = result.cognitionState;
    route.push(`${choice.action}:${result.event.outcome}`);
    if (result.event.node !== "r1_prison" || result.event.outcome !== "win" || !result.event.firstClear) continue;

    const after = CORE.observe(gameState);
    const next = POLICY.selectNextAction(cognitionState, after, { time: gameState.step || 0 });
    const swapActions = after.allowedActions.filter((action) => action.startsWith("swap:") && action.endsWith(":hero_ranger"));
    return {
      ok: true,
      seed,
      route,
      bossAlreadyCleared: after.visibleNodes.find((node) => node.id === "r1_boss")?.status === "cleared",
      rangerVisibleInRoster: after.roster.some((hero) => hero.id === "hero_ranger"),
      adjustTeamBehaviorVisible: after.cognition.behaviors.includes("调整队伍"),
      rangerSwapActions: swapActions,
      rangerInTeam: gameState.teamSlots.includes("hero_ranger"),
      nextAction: next.action,
      terminal: Boolean(next.terminal),
      terminalReason: next.reason || null,
      bestSwapScore: next.candidates?.filter((row) => row.action.startsWith("swap:")).sort((a, b) => b.score - a.score)[0]?.score ?? null,
      swapKnowledgeRows: cognitionState.knowledge.filter((row) => row.pattern?.behavior?.includes("swap")).length,
      remainingCharacterVerificationOpportunity: !next.terminal,
    };
  }
  return { ok: false, error: "character_not_unlocked", route };
}

function runMicroFixture(seedSwapKnowledge = false) {
  const state = RUNTIME.createState(seedSwapKnowledge ? "swap-seeded" : "swap-unseen");
  if (seedSwapKnowledge) {
    state.knowledge.push({
      id: "knowledge:synthetic-swap",
      pattern: { subject: "player_squad", environment: "team", behavior: "swap:hero" },
      count: 1,
      confidence: 0.8,
      meanUtility: 0.5,
      meanMagnitude: 0.5,
      resultKinds: { team_changed: 1 },
      meanProcessSeconds: 0,
      outcomeTrials: 0,
      outcomeWins: 0,
    });
  }
  const observation = {
    step: 8,
    currentGoal: "test the newly rescued Ranger",
    gear: { score: 300 },
    roster: [{ id: "hero_ranger", name: "Ranger", role: "ranger" }],
    visibleNodes: [{ id: "r1_main_7", name: "Ranger proof", type: "main", status: "available", rewardHint: "role proof" }],
    allowedActions: ["swap:1:hero_ranger", "challenge:r1_main_7"],
  };
  const choice = POLICY.selectNextAction(state, observation);
  return {
    seedSwapKnowledge,
    selected: choice.action,
    candidates: choice.candidates,
  };
}

if (require.main === module) {
  console.log(JSON.stringify({
    realRoutes: [run("phase2-a"), run("phase2-b"), run("phase2-c"), run("phase2-d"), run("phase2-e")],
    microFixtures: [runMicroFixture(false), runMicroFixture(true)],
  }, null, 2));
}

module.exports = { run, runMicroFixture };
