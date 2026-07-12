const CORE = require("../map_progression_lab/map-progression-cognition-core");
const V5 = require("./player-cognition-v5-sandbox");

const PROFILE_CONFIG = {
  balanced: V5.PLAYER_PROFILES.balanced,
  impatient: V5.PLAYER_PROFILES.impatient,
  analytical: V5.PLAYER_PROFILES.analytical,
};

function runOne(seed, profile = "balanced", maxSteps = 42) {
  let state = CORE.initialState(seed);
  const mind = {
    profile,
    feedback: 38,
    baselines: {},
    hypothesis: null,
    tried: new Set(),
    trace: [],
    decisions: [],
    branchChoice: null,
  };

  while (state.step < maxSteps && !state.cleared.r1_boss && (mind.feedback >= abandonThreshold(profile) || mind.hypothesis)) {
    const observation = CORE.observe(state);
    const choice = chooseAction(state, observation, mind);
    if (!choice) break;
    if (choice.decision) mind.decisions.push({ step: state.step + 1, ...choice.decision });
    const result = CORE.applyAction(state, choice.action);
    if (!result.ok) break;
    state = result.state;
    if (!result.event.node) {
      mind.trace.push({ step: state.step, action: choice.action, outcome: result.event.outcome, feedback: mind.feedback });
      continue;
    }

    const cognition = evaluateBattle(result.event, mind, choice);
    mind.feedback = cognition.feedbackAfter;
    updateHypothesis(mind, result.event, cognition, choice);
    if (result.event.outcome === "loss" && !mind.hypothesis && (mind.feedback >= abandonThreshold(profile) || (state.failures[result.event.node] || 0) <= 4)) {
      mind.hypothesis = createHypothesis(state, result.observation, result.event, mind);
      mind.decisions.push({ step: state.step, target: result.event.node, ...mind.hypothesis.decision });
    }
    if (result.event.performance?.hitCount) {
      const previous = mind.baselines[result.event.node];
      mind.baselines[result.event.node] = { ...result.event.performance, confidence: previous ? 0.9 : 0.65 };
    }
    mind.trace.push({
      step: state.step,
      action: choice.action,
      node: result.event.node,
      outcome: result.event.outcome,
      duration: result.event.duration,
      gearBefore: result.event.gearBefore,
      gearAfter: result.event.gearAfter ?? result.event.gearBefore,
      performance: result.event.performance,
      diagnosis: result.event.diagnosis,
      totalExperience: cognition.totalExperience,
      feedbackAfter: cognition.feedbackAfter,
      hypothesisStatus: cognition.hypothesisStatus,
      nextAction: cognition.nextAction,
      decision: choice.decision || null,
    });
  }

  return {
    seed,
    profile,
    completed: Boolean(state.cleared.r1_boss),
    steps: state.step,
    finalFeedback: mind.feedback,
    minFeedback: minimum(mind.trace.map((row) => row.feedbackAfter).filter(Number.isFinite), 38),
    losses: mind.trace.filter((row) => row.outcome === "loss").length,
    branchChoice: mind.branchChoice,
    finalGear: CORE.gearScore(state),
    hypotheses: {
      confirmed: mind.trace.filter((row) => row.hypothesisStatus === "confirmed").length,
      refuted: mind.trace.filter((row) => row.hypothesisStatus === "refuted").length,
      pending: mind.hypothesis ? 1 : 0,
    },
    decisions: mind.decisions,
    trace: mind.trace,
  };
}

function chooseAction(state, observation, mind) {
  const available = observation.visibleNodes.filter((node) => node.status === "available");
  const actions = new Set(observation.allowedActions);

  if (mind.hypothesis?.phase === "retry") {
    const action = `challenge:${mind.hypothesis.target}`;
    if (actions.has(action)) return { action, hypothesis: mind.hypothesis };
  }

  if (mind.hypothesis?.phase === "intervene") {
    const intervention = interventionAction(state, observation, mind.hypothesis);
    if (intervention) {
      mind.hypothesis.phase = mind.hypothesis.behavior === "continue_main" && intervention !== "challenge:r1_bandit" ? "intervene" : "retry";
      return { action: intervention, decision: mind.hypothesis.decision };
    }
    mind.hypothesis.phase = "retry";
  }

  const last = observation.lastEvent;
  if (last?.outcome === "loss" && !mind.hypothesis) {
    mind.hypothesis = createHypothesis(state, observation, last, mind);
    const intervention = interventionAction(state, observation, mind.hypothesis);
    if (intervention) {
      mind.hypothesis.phase = mind.hypothesis.behavior === "continue_main" && intervention !== "challenge:r1_bandit" ? "intervene" : "retry";
      return { action: intervention, decision: mind.hypothesis.decision };
    }
  }

  const main9 = available.find((node) => node.id === "r1_main_9");
  if (main9) return { action: "challenge:r1_main_9" };

  if (state.cleared.r1_main_6 && !state.cleared.r1_main_9 && mind.profile !== "impatient"
    && state.roster.some((unit) => unit.id === "hero_ranger") && !state.teamSlots.includes("hero_ranger")
    && !mind.tried.has("prepare:ranger")) {
    const rangerSwap = observation.allowedActions.find((action) => action.endsWith(":hero_ranger"));
    if (rangerSwap) {
      mind.tried.add("prepare:ranger");
      return { action: rangerSwap, decision: deliberate("prepare_ranger", "高生命单体路线适合验证游侠持续输出") };
    }
  }

  if (!state.cleared.r1_prison && available.some((node) => node.id === "r1_prison") && shouldTryPrison(state, mind)) {
    return { action: "challenge:r1_prison", decision: deliberate("rescue_character", "新角色可能扩展队伍解法") };
  }
  if (!state.cleared.r1_bandit && available.some((node) => node.id === "r1_bandit") && shouldTryCamp(state, mind)) {
    return { action: "challenge:r1_bandit", decision: deliberate("targeted_gear", "固定军械可能解决当前强度缺口") };
  }

  const fork = state.cleared.r1_main_9 ? [] : available.filter((node) => node.id === "r1_main_7" || node.id === "r1_main_8");
  if (fork.length) {
    const useSingleTarget = state.teamSlots.includes("hero_ranger") || !state.teamSlots.includes("hero_mage");
    const target = useSingleTarget && fork.some((node) => node.id === "r1_main_7") ? "r1_main_7" : "r1_main_8";
    mind.branchChoice = target;
    return { action: `challenge:${target}`, decision: deliberate("route_choice", target === "r1_main_7" ? "选择高生命单体路线验证持续输出" : "选择群体路线验证范围清场") };
  }

  const main = available.filter((node) => node.type === "main" && !isSkippedFork(state, node.id)).sort(mainOrder)[0];
  if (main) return { action: `challenge:${main.id}` };
  const boss = available.find((node) => node.type === "boss");
  if (boss) return { action: `challenge:${boss.id}` };
  return null;
}

function shouldTryPrison(state, mind) {
  if (state.failures.r1_prison) return false;
  if (mind.profile === "impatient") return Boolean(state.cleared.r1_main_5);
  return Boolean(state.cleared.r1_main_3);
}

function shouldTryCamp(state, mind) {
  if (!state.cleared.r1_main_5) return false;
  return Boolean(state.failures.r1_prison) || mind.profile === "analytical" || Boolean(state.failures.r1_boss);
}

function createHypothesis(state, observation, last, mind) {
  const target = last.node;
  const candidates = [];
  const nextMain = availableMain(observation);
  if (target === "r1_prison" && nextMain) {
    candidates.push({ behavior: "continue_main", reason: "支线失败后继续主线可获得装备并保留回访机会", score: 0.86 });
  }
  if (!state.cleared.r1_bandit && observation.visibleNodes.some((node) => node.id === "r1_bandit" && node.status === "available")) {
    if (!mind.tried.has(`clear_camp:${target}`)) candidates.push({ behavior: "clear_camp", reason: "固定装备可提高强度", score: 0.9 });
  }
  const healerSwap = observation.allowedActions.find((action) => action === "swap:3:militia_herb");
  if (target === "r1_boss" && last.diagnosis?.firstAllyDeath?.time < 12 && healerSwap && !mind.tried.has(`restore_healer:${target}`)) {
    candidates.push({ behavior: "restore_healer", reason: `${last.diagnosis.firstAllyDeath.name}率先阵亡，恢复治疗位可能延长队伍生存`, score: 0.76 });
  }
  const reserve = reserveSwap(observation);
  if (reserve && !mind.tried.has(`swap_character:${target}`)) candidates.push({ behavior: "swap_character", reason: "换人可能改变角色贡献", score: reserve.endsWith(":hero_ranger") ? 0.72 : 0.4 });
  const farm = latestFarm(observation);
  if (farm) candidates.push({ behavior: "farm_gear", reason: "最近主线可提供可见装备提升", score: 0.55 });
  const selected = candidates.sort((a, b) => b.score - a.score)[0] || { behavior: "retry", reason: "没有已知的更优路径", score: 0.1 };
  mind.tried.add(`${selected.behavior}:${target}`);
  return {
    target,
    behavior: selected.behavior,
    reason: selected.reason,
    phase: "intervene",
    gearBefore: observation.gear.score,
    decision: deliberate(selected.behavior, selected.reason),
  };
}

function interventionAction(state, observation, hypothesis) {
  if (hypothesis.behavior === "continue_main") {
    if (observation.allowedActions.includes("challenge:r1_bandit")) return "challenge:r1_bandit";
    const main = availableMain(observation);
    return main ? `challenge:${main.id}` : null;
  }
  if (hypothesis.behavior === "clear_camp") return observation.allowedActions.includes("challenge:r1_bandit") ? "challenge:r1_bandit" : null;
  if (hypothesis.behavior === "restore_healer") return observation.allowedActions.includes("swap:3:militia_herb") ? "swap:3:militia_herb" : null;
  if (hypothesis.behavior === "farm_gear") {
    const farm = latestFarm(observation);
    return farm ? `challenge:${farm.id}` : null;
  }
  if (hypothesis.behavior === "swap_character") return reserveSwap(observation);
  hypothesis.phase = "retry";
  return null;
}

function reserveSwap(observation) {
  const swaps = observation.allowedActions.filter((action) => action.startsWith("swap:"));
  if (!swaps.length) return null;
  const ranger = swaps.find((action) => action === "swap:3:hero_ranger") || swaps.find((action) => action.endsWith(":hero_ranger"));
  const spear = swaps.find((action) => action === "swap:1:militia_spear") || swaps.find((action) => action.endsWith(":militia_spear"));
  return ranger || spear || swaps[0];
}

function latestFarm(observation) {
  return observation.visibleNodes
    .filter((node) => node.type === "main" && node.status === "farmable")
    .sort((a, b) => mainNumber(b.id) - mainNumber(a.id))[0] || null;
}

function availableMain(observation) {
  const main9Cleared = observation.visibleNodes.some((node) => node.id === "r1_main_9" && node.status === "farmable");
  return observation.visibleNodes
    .filter((node) => node.type === "main" && node.status === "available" && !(main9Cleared && (node.id === "r1_main_7" || node.id === "r1_main_8")))
    .sort(mainOrder)[0] || null;
}

function isSkippedFork(state, id) {
  return Boolean(state.cleared.r1_main_9) && (id === "r1_main_7" || id === "r1_main_8");
}

function evaluateBattle(event, mind, choice) {
  const candidateHypothesis = choice.hypothesis || (mind.hypothesis?.phase === "retry" ? mind.hypothesis : null);
  const hypothesis = candidateHypothesis?.target === event.node ? candidateHypothesis : null;
  const isFirstClear = Boolean(event.firstClear);
  const lootCount = (event.loot || []).length;
  return V5.simulateScenario({
    id: `${event.node}:${event.step}`,
    title: event.node,
    // Auto-battle time is not equal to continuous player effort. Only the attended
    // decision/inspection slice contributes to W.
    wSeconds: Math.min(3.5, Math.max(1.2, event.duration * 0.15)),
    decisionSteps: hypothesis || choice.decision ? ["problem", "cause", "behavior", "hypothesis"] : [],
    verify: hypothesis ? { compared: true, observed: event.outcome === "win" ? 1 : 0, operator: ">=", target: 1, freshness: 1 } : null,
    signal: {
      salience: event.outcome === "loss" ? 0.9 : isFirstClear ? 0.82 : 0.62,
      perceptual: 0.85,
      causal: hypothesis ? 0.9 : lootCount ? 0.72 : 0.65,
      goal: event.node === "r1_boss" ? 1 : isFirstClear ? 0.86 : 0.62,
      repetitions: 1,
    },
    process: {
      deadRepetition: event.outcome === "win" && !isFirstClear ? 0.45 : 0.05,
      incomprehension: event.resolution === "time_limit" ? 0.4 : 0.05,
      progressReadability: isFirstClear || lootCount ? 0.92 : 0.68,
    },
    progression: isFirstClear ? (event.node === "r1_boss" ? 3 : 1) : lootCount ? 0.35 : 0,
    progressionFreshness: isFirstClear ? 1 : 0.55,
    otherResult: event.outcome === "loss" ? -1.2 : event.node === "r1_boss" ? 1.4 : 0,
    performance: event.performance,
    baseline: mind.baselines[event.node] || null,
    agencyBefore: { desire: 1, gap: 0.65, clarity: hypothesis ? 0.85 : 0.55, path: hypothesis ? 0.8 : 0.55, causal: hypothesis ? 0.8 : 0.5, improvement: 0.35, cost: 1 },
    agencyAfter: { desire: 1, gap: event.outcome === "win" ? 0.45 : 0.75, clarity: 0.8, path: event.outcome === "win" ? 0.82 : 0.62, causal: hypothesis ? 0.88 : 0.58, improvement: 0.35, cost: 1 },
    decisionContext: hypothesis ? {
      triedBehavior: hypothesis.behavior,
      causes: [{ id: "current_plan_insufficient", confidence: 0.75 }, { id: "equipment_too_weak", confidence: 0.55 }],
      behaviors: [{ id: "farm_gear", available: true, addresses: ["equipment_too_weak"], causal: 0.75, improvement: 0.3, cost: 1 }],
    } : null,
  }, { ...PROFILE_CONFIG[mind.profile], initialFeedbackStock: mind.feedback });
}

function updateHypothesis(mind, event, cognition, choice) {
  const hypothesis = choice.hypothesis || (mind.hypothesis?.phase === "retry" ? mind.hypothesis : null);
  if (!hypothesis) return;
  if (event.node !== hypothesis.target) return;
  mind.hypothesis = null;
}

function deliberate(behavior, reason) {
  return { behavior, reason, chain: ["发现问题", "归因", "选择行为", "形成可验证假设"] };
}

function runBatch(count = 30) {
  const profiles = ["balanced", "impatient", "analytical"];
  const runs = Array.from({ length: count }, (_, index) => runOne(`v5-flow-${index + 1}`, profiles[index % profiles.length]));
  return { aggregate: aggregate(runs), runs };
}

function aggregate(runs) {
  return {
    runs: runs.length,
    completionRate: ratio(runs.filter((run) => run.completed).length, runs.length),
    byProfile: Object.fromEntries(["balanced", "impatient", "analytical"].map((profile) => {
      const rows = runs.filter((run) => run.profile === profile);
      return [profile, summarize(rows)];
    })),
    averageSteps: average(runs.map((run) => run.steps)),
    averageLosses: average(runs.map((run) => run.losses)),
    averageFinalFeedback: average(runs.map((run) => run.finalFeedback)),
    averageMinimumFeedback: average(runs.map((run) => run.minFeedback)),
    averageFinalGear: average(runs.map((run) => run.finalGear)),
    branchChoices: countBy(runs.map((run) => run.branchChoice || "none")),
    hypotheses: {
      confirmed: runs.reduce((sum, run) => sum + run.hypotheses.confirmed, 0),
      refuted: runs.reduce((sum, run) => sum + run.hypotheses.refuted, 0),
      pending: runs.reduce((sum, run) => sum + run.hypotheses.pending, 0),
    },
  };
}

function summarize(rows) {
  return {
    runs: rows.length,
    completionRate: ratio(rows.filter((run) => run.completed).length, rows.length),
    averageSteps: average(rows.map((run) => run.steps)),
    averageLosses: average(rows.map((run) => run.losses)),
    averageFinalFeedback: average(rows.map((run) => run.finalFeedback)),
  };
}

function mainOrder(a, b) { return mainNumber(a.id) - mainNumber(b.id); }
function mainNumber(id) { return Number(String(id).split("_").pop()) || 0; }
function average(values) { return values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0; }
function ratio(value, total) { return total ? round(value / total) : 0; }
function round(value) { return Math.round(value * 1000) / 1000; }
function minimum(values, fallback) { return values.length ? Math.min(...values) : fallback; }
function countBy(values) { return values.reduce((rows, value) => ({ ...rows, [value]: (rows[value] || 0) + 1 }), {}); }
function abandonThreshold(profile) { return profile === "impatient" ? 28 : profile === "analytical" ? 18 : 20; }

if (require.main === module) {
  const result = runBatch(Number(process.argv[2] || 30));
  console.log(JSON.stringify(result.aggregate, null, 2));
}

module.exports = { runOne, runBatch, aggregate, chooseAction, evaluateBattle };
