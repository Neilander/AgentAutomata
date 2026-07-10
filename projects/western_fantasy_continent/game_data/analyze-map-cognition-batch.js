const CORE = require("../map_progression_lab/map-progression-cognition-core");

function runOne(seed, maxSteps = 30) {
  let state = CORE.initialState(seed);
  const trace = [];
  let decisionPoints = 0;
  while (state.step < maxSteps && !state.cleared.r1_boss) {
    const observation = CORE.observe(state);
    if (observation.allowedActions.length > 1) decisionPoints += 1;
    const action = chooseAction(observation);
    if (!action) break;
    const result = CORE.applyAction(state, action);
    if (!result.ok) break;
    state = result.state;
    trace.push({
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
    });
  }
  const observation = CORE.observe(state);
  return {
    seed,
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

function chooseAction(observation) {
  const actions = observation.allowedActions;
  if (!actions.length) return null;
  const availableNodes = observation.visibleNodes.filter((item) => item.status === "available");
  const lastEvent = observation.lastEvent;
  const banditNode = observation.visibleNodes.find((item) => item.id === "r1_bandit" && ["available", "farmable"].includes(item.status));
  if (lastEvent?.node === "r1_prison" && lastEvent.outcome === "loss" && banditNode) return "challenge:r1_bandit";
  if (lastEvent?.node === "r1_prison" && lastEvent.outcome === "loss") {
    const farmMain = observation.visibleNodes
      .filter((item) => item.type === "main" && item.status === "farmable")
      .sort((a, b) => Number(b.id.split("_").pop()) - Number(a.id.split("_").pop()))[0];
    if (farmMain) return `challenge:${farmMain.id}`;
  }
  const prison = availableNodes.find((item) => item.id === "r1_prison") ? "challenge:r1_prison" : null;
  if (prison && !observation.cognition.failureMemories.some((memory) => memory.node === "r1_prison")) return prison;
  const bandit = availableNodes.find((item) => item.id === "r1_bandit") ? "challenge:r1_bandit" : null;
  if (bandit) return bandit;
  if (prison) return prison;
  const main = availableNodes.find((item) => item.id.includes("_main_"));
  if (main) return `challenge:${main.id}`;
  const boss = availableNodes.find((item) => item.type === "boss");
  return boss ? `challenge:${boss.id}` : actions[0];
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
  return {
    runs: runs.length,
    completionRate: ratio(runs.filter((run) => run.completed).length, runs.length),
    averageSteps: average(runs.map((run) => run.steps)),
    averageLosses: average(runs.map((run) => run.losses)),
    averageDecisionPoints: average(runs.map((run) => run.decisionPoints)),
    averageFinalGear: average(runs.map((run) => run.finalGear)),
    firstLosses: countBy(runs.map((run) => run.firstLoss || "none")),
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

function runBatch(count = 40) {
  const runs = Array.from({ length: count }, (_, index) => runOne(`map-batch-${index + 1}`));
  return { aggregate: aggregate(runs), runs };
}

if (require.main === module) {
  const result = runBatch(Number(process.argv[2] || 40));
  console.log(JSON.stringify(result.aggregate, null, 2));
}

module.exports = { runOne, runBatch, aggregate };
