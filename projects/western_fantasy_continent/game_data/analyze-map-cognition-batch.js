const CORE = require("../map_progression_lab/map-progression-cognition-core");

function runOne(seed, maxSteps = 36, policy = "explorer") {
  let state = CORE.initialState(seed);
  const trace = [];
  let decisionPoints = 0;
  while (state.step < maxSteps && !state.cleared.r1_boss) {
    const observation = CORE.observe(state);
    if (observation.allowedActions.length > 1) decisionPoints += 1;
    const action = chooseAction(observation, policy);
    if (!action) break;
    const result = CORE.applyAction(state, action);
    if (!result.ok) break;
    state = result.state;
    if (result.event.node) trace.push({
      step: state.step,
      node: result.event.node,
      outcome: result.event.outcome,
      duration: result.event.duration,
      playerAlive: result.event.survivors.player,
      enemyAlive: result.event.survivors.enemy,
      playerHp: result.event.hpScore.player,
      enemyHp: result.event.hpScore.enemy,
      gearBefore: result.event.gearBefore,
      gearAfter: result.event.gearAfter ?? result.event.gearBefore,
      firstClear: Boolean(result.event.firstClear),
      contributions: result.event.contributions || [],
      roleProof: result.event.roleProof || null,
    });
  }
  const observation = CORE.observe(state);
  return {
    seed,
    policy,
    completed: Boolean(state.cleared.r1_boss),
    stoppedAt: observation.currentGoal,
    steps: state.step,
    wins: trace.filter((item) => item.outcome === "win").length,
    losses: trace.filter((item) => item.outcome === "loss").length,
    decisionPoints,
    finalGear: CORE.gearScore(state),
    firstLoss: trace.find((item) => item.outcome === "loss")?.node || null,
    trace,
  };
}

function chooseAction(observation, policy = "explorer") {
  const actions = observation.allowedActions;
  if (!actions.length) return null;
  if (policy === "mainline") return chooseMainlineAction(observation);
  const rangerSwap = actions.find((action) => action === "swap:3:hero_ranger");
  if (rangerSwap && !observation.team.includes("林地游侠")) return rangerSwap;
  const availableNodes = observation.visibleNodes.filter((item) => item.status === "available");
  const mergeNode = availableNodes.find((item) => item.id === "r1_main_9");
  if (mergeNode) return "challenge:r1_main_9";
  const lastEvent = observation.lastEvent;
  const banditNode = availableNodes.find((item) => item.id === "r1_bandit");
  if (lastEvent?.node === "r1_prison" && lastEvent.outcome === "loss" && banditNode) return "challenge:r1_bandit";
  if (lastEvent?.node === "r1_prison" && lastEvent.outcome === "loss") {
    const nextMain = availableNodes
      .filter((item) => item.type === "main")
      .sort((a, b) => Number(a.id.split("_").pop()) - Number(b.id.split("_").pop()))[0];
    if (nextMain) return `challenge:${nextMain.id}`;
    const farmMain = observation.visibleNodes
      .filter((item) => item.type === "main" && item.status === "farmable")
      .sort((a, b) => Number(b.id.split("_").pop()) - Number(a.id.split("_").pop()))[0];
    if (farmMain) return `challenge:${farmMain.id}`;
  }
  if (lastEvent?.outcome === "loss") {
    const farmMain = observation.visibleNodes
      .filter((item) => item.type === "main" && item.status === "farmable")
      .sort((a, b) => Number(b.id.split("_").pop()) - Number(a.id.split("_").pop()))[0];
    if (farmMain) return `challenge:${farmMain.id}`;
  }
  const unresolvedPrison = observation.cognition.failureMemories.find((memory) => memory.node === "r1_prison" && !memory.resolved);
  if (unresolvedPrison && observation.gear.score >= unresolvedPrison.gearScore * 1.3) {
    const retry = availableNodes.find((item) => item.id === "r1_prison");
    if (retry) return "challenge:r1_prison";
  }
  const prison = availableNodes.find((item) => item.id === "r1_prison") ? "challenge:r1_prison" : null;
  if (prison && !observation.cognition.failureMemories.some((memory) => memory.node === "r1_prison")) return prison;
  const bandit = availableNodes.find((item) => item.id === "r1_bandit") ? "challenge:r1_bandit" : null;
  if (bandit) return bandit;
  if (prison && lastEvent?.node === "r1_bandit") return prison;
  const main = availableNodes.find((item) => item.id.includes("_main_"));
  if (main) return `challenge:${main.id}`;
  const boss = availableNodes.find((item) => item.type === "boss");
  return boss ? `challenge:${boss.id}` : actions[0];
}

function chooseMainlineAction(observation) {
  const available = observation.visibleNodes.filter((item) => item.status === "available");
  const mergeNode = available.find((item) => item.id === "r1_main_9");
  if (mergeNode) return "challenge:r1_main_9";
  const main = available
    .filter((item) => item.type === "main")
    .sort((a, b) => Number(a.id.split("_").pop()) - Number(b.id.split("_").pop()))[0];
  if (main) return `challenge:${main.id}`;
  const boss = available.find((item) => item.type === "boss");
  const bossMemory = observation.cognition.failureMemories.find((memory) => memory.node === "r1_boss" && !memory.resolved);
  if (boss && (!bossMemory || observation.gear.score > bossMemory.gearScore)) return `challenge:${boss.id}`;
  const farm = observation.visibleNodes
    .filter((item) => item.type === "main" && item.status === "farmable")
    .sort((a, b) => Number(b.id.split("_").pop()) - Number(a.id.split("_").pop()))[0];
  if (farm) return `challenge:${farm.id}`;
  return boss ? `challenge:${boss.id}` : null;
}

function aggregate(runs) {
  const nodeRows = {};
  for (const run of runs) {
    for (const event of run.trace) {
      const row = nodeRows[event.node] || (nodeRows[event.node] = { attempts: 0, wins: 0, losses: 0, durations: [], gearBefore: [], hpMargin: [] });
      row.attempts += 1;
      row.wins += event.outcome === "win" ? 1 : 0;
      row.losses += event.outcome === "loss" ? 1 : 0;
      row.durations.push(event.duration);
      row.gearBefore.push(event.gearBefore);
      row.hpMargin.push(event.playerHp - event.enemyHp);
    }
  }
  const firstPrison = runs.map((run) => run.trace.find((event) => event.node === "r1_prison")).filter(Boolean);
  const postCampPrison = runs.map((run) => {
    const campIndex = run.trace.findIndex((event) => event.node === "r1_bandit" && event.outcome === "win");
    return campIndex < 0 ? null : run.trace.slice(campIndex + 1).find((event) => event.node === "r1_prison") || null;
  }).filter(Boolean);
  const firstBoss = runs.map((run) => run.trace.find((event) => event.node === "r1_boss")).filter(Boolean);
  const rangerProofs = runs.map((run) => run.trace.find((event) => event.node === "r1_main_7")?.roleProof).filter(Boolean);
  return {
    runs: runs.length,
    completionRate: ratio(runs.filter((run) => run.completed).length, runs.length),
    averageSteps: average(runs.map((run) => run.steps)),
    averageLosses: average(runs.map((run) => run.losses)),
    averageDecisionPoints: average(runs.map((run) => run.decisionPoints)),
    averageFinalGear: average(runs.map((run) => run.finalGear)),
    firstLosses: countBy(runs.map((run) => run.firstLoss || "none")),
    teachingLocks: {
      firstPrisonAttempts: firstPrison.length,
      firstPrisonWinRate: ratio(firstPrison.filter((event) => event.outcome === "win").length, firstPrison.length),
      postCampPrisonAttempts: postCampPrison.length,
      postCampPrisonWinRate: ratio(postCampPrison.filter((event) => event.outcome === "win").length, postCampPrison.length),
      firstBossAttempts: firstBoss.length,
      firstBossWinRate: ratio(firstBoss.filter((event) => event.outcome === "win").length, firstBoss.length),
      rangerEvidenceRate: ratio(rangerProofs.length, runs.length),
      averageRangerDamageShare: average(rangerProofs.map((proof) => proof.rangerDamageShare || 0)),
    },
    nodes: Object.fromEntries(Object.entries(nodeRows).map(([id, row]) => [id, {
      attempts: row.attempts,
      winRate: ratio(row.wins, row.attempts),
      averageDuration: average(row.durations),
      averageGearBefore: average(row.gearBefore),
      averageHpMargin: average(row.hpMargin),
    }])),
  };
}

function average(values) {
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 1000) / 1000 : 0;
}

function ratio(value, total) {
  return total ? Math.round(value / total * 1000) / 1000 : 0;
}

function countBy(values) {
  return values.reduce((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function ownedItemCount(state) {
  return state.inventory.length + state.roster.reduce((sum, unit) => sum + Object.keys(unit.equipment || {}).length, 0);
}

function checkBranchInvariants(count = 20) {
  let campRepeatNoReward = 0;
  let prisonImmediateRetry = 0;
  let prisonFailureSamples = 0;
  let prisonRepeatNoReward = 0;
  for (let index = 0; index < count; index += 1) {
    let state = CORE.initialState(`branch-invariant-${index + 1}`);
    for (let mainNo = 1; mainNo <= 3; mainNo += 1) state = CORE.applyAction(state, `challenge:r1_main_${mainNo}`).state;
    const earlyPrison = CORE.applyAction(state, "challenge:r1_prison");
    state = earlyPrison.state;
    if (earlyPrison.ok && earlyPrison.event.outcome === "loss") {
      prisonFailureSamples += 1;
      if (CORE.observe(state).visibleNodes.some((node) => node.id === "r1_prison" && node.status === "available")) prisonImmediateRetry += 1;
    }
    for (let mainNo = 4; mainNo <= 5; mainNo += 1) state = CORE.applyAction(state, `challenge:r1_main_${mainNo}`).state;

    state = CORE.applyAction(state, "challenge:r1_bandit").state;
    const campItems = ownedItemCount(state);
    const campGear = CORE.gearScore(state);
    const campRepeat = CORE.applyAction(state, "challenge:r1_bandit");
    if (campRepeat.ok && (campRepeat.event.loot || []).length === 0 && ownedItemCount(campRepeat.state) === campItems && CORE.gearScore(campRepeat.state) === campGear) campRepeatNoReward += 1;
    state = campRepeat.state;

    if (!state.cleared.r1_prison) state = CORE.applyAction(state, "challenge:r1_prison").state;
    for (let attempt = 0; attempt < 5 && !state.cleared.r1_prison; attempt += 1) state = CORE.applyAction(state, "challenge:r1_prison").state;
    if (!state.cleared.r1_prison) continue;

    const prisonItems = ownedItemCount(state);
    const prisonGear = CORE.gearScore(state);
    const rosterCount = state.roster.length;
    let repeatPassed = false;
    for (let attempt = 0; attempt < 5 && !repeatPassed; attempt += 1) {
      const repeat = CORE.applyAction(state, "challenge:r1_prison");
      state = repeat.state;
      if (repeat.event.outcome !== "win") continue;
      repeatPassed = (repeat.event.loot || []).length === 0
        && ownedItemCount(state) === prisonItems
        && CORE.gearScore(state) === prisonGear
        && state.roster.length === rosterCount;
    }
    if (repeatPassed) prisonRepeatNoReward += 1;
  }
  return {
    samples: count,
    campRepeatNoRewardRate: ratio(campRepeatNoReward, count),
    prisonFailureSamples,
    prisonImmediateRetryRate: ratio(prisonImmediateRetry, prisonFailureSamples),
    prisonRepeatNoRewardRate: ratio(prisonRepeatNoReward, count),
  };
}

function runBatch(count = 40, policy = "explorer") {
  const runs = Array.from({ length: count }, (_, index) => runOne(`map-${policy}-${index + 1}`, 36, policy));
  return { aggregate: { ...aggregate(runs), invariants: checkBranchInvariants(Math.min(20, count)) }, runs };
}

if (require.main === module) {
  const result = runBatch(Number(process.argv[2] || 40), process.argv[3] || "explorer");
  console.log(JSON.stringify(result.aggregate, null, 2));
}

module.exports = { runOne, runBatch, aggregate, checkBranchInvariants, chooseAction, chooseMainlineAction };
