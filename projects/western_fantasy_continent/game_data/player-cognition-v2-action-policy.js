const RUNTIME = require("./player-cognition-v2-event-runtime");

function selectNextAction(cognitionState, observation, options = {}) {
  const terminal = terminalDecision(observation);
  if (terminal) {
    return { action: null, candidates: [], decision: null, cognitionState, terminal: true, reason: terminal };
  }
  const candidates = (observation?.allowedActions || []).map((action) => scoreAction(cognitionState, observation, action));
  candidates.sort((a, b) => b.score - a.score || a.action.localeCompare(b.action));
  const selected = candidates[0] || null;
  if (!selected) return { action: null, candidates: [], decision: null, cognitionState };

  const decision = {
    id: `decision:${observation?.step || 0}:${selected.action}`,
    time: Number(options.time || 0),
    action: selected.action,
    goalId: selected.goalId || cognitionState.activeGoalId || "grow_and_progress",
    choiceMode: choiceModeForSelection(cognitionState, selected),
    environment: { region: "region_1", step: observation?.step || 0, goal: observation?.currentGoal || "" },
    alternatives: candidates.map(publicCandidate),
    reasoningChain: buildReasoningChain(cognitionState, observation, selected, candidates),
    hypothesis: selected.hypothesis || null,
  };
  return {
    action: selected.action,
    candidates: candidates.map(publicCandidate),
    decision,
    cognitionState: RUNTIME.applyDecision(cognitionState, decision),
  };
}

function scoreAction(state, observation, action) {
  const [kind, first] = String(action).split(":");
  if (kind === "challenge") return scoreChallenge(state, observation, action, first);
  if (kind === "swap") return scoreSwap(state, observation, action);
  return { action, kind, score: -1, components: { unsupported: -1 } };
}

function scoreChallenge(state, observation, action, nodeId) {
  const node = (observation.visibleNodes || []).find((item) => item.id === nodeId) || {};
  const pattern = {
    subject: "player_squad",
    environment: nodeId,
    behavior: `map_action:${action}`,
  };
  const knowledge = RUNTIME.matchKnowledge(state.knowledge || [], pattern);
  const memoryKey = `${pattern.subject}|${pattern.environment}|${pattern.behavior}`;
  const failure = (state.failureMemories || []).find((row) => row.key === memoryKey && !row.resolved);
  const currentPower = Number(observation?.gear?.score || 0);
  const baselinePower = Number(failure?.baselinePower || 0);
  const powerGrowth = baselinePower > 0 ? (currentPower - baselinePower) / baselinePower : 0;
  const wakeThreshold = Number(failure?.wakePowerGrowth || state.config?.longHorizon?.failureWakePowerGrowth || 0.3);
  const wakeReady = Boolean(failure && baselinePower > 0 && powerGrowth >= wakeThreshold);
  const emotion = Number(state.emotion?.value || 38);
  const explorationTolerance = clamp(0.45 + (emotion - 38) / 80, 0.25, 0.75);
  const goalId = goalForNode(node);
  const goal = (state.goals || []).find((row) => row.id === goalId);
  const goalDrive = goal ? clamp((Number(goal.objectiveValue || 0) + Number(goal.subjectiveValue || 0)) / 2, 0.2, 1) : 0.5;
  const goalFit = visibleGoalFit(observation.currentGoal, node) * (0.7 + 0.3 * goalDrive);
  const knowledgeValue = knowledge ? clamp(Number(knowledge.meanUtility || 0) / 2, -0.8, 1.2) * Number(knowledge.confidence || 0) : 0;
  const successBelief = knowledge?.estimatedSuccess ?? (failure ? Math.max(0.15, 0.5 - failure.fear * 0.35) : 0.55);
  const exploration = knowledge ? 0 : 0.3 * explorationTolerance;
  const visibleReward = visibleRewardValue(node.rewardHint);
  const perceivedCost = clamp(0.8 + Number(knowledge?.meanProcessSeconds || 0) / 30, 0.8, 3);
  const fearPenalty = wakeReady ? 0 : Number(failure?.fear || 0) * (0.45 + (1 - explorationTolerance) * 0.35);
  const dormantFailurePenalty = failure && baselinePower > 0 && !wakeReady ? 0.65 : 0;
  const repetitionCount = recentDecisionRepeats(state, action);
  const repetitionPenalty = node.status === "farmable" && knowledge ? Math.min(0.24, 0.08 + repetitionCount * 0.04) : 0;
  const dormantFailure = (state.failureMemories || []).find((row) => !row.resolved && Number(row.baselinePower || 0) > 0);
  const dormantGrowth = dormantFailure ? (currentPower - dormantFailure.baselinePower) / dormantFailure.baselinePower : 0;
  const preparationBonus = node.status === "farmable" && dormantFailure && dormantGrowth < Number(dormantFailure.wakePowerGrowth || 0.3) ? 0.15 : 0;
  const wakeBonus = wakeReady ? 0.9 : 0;
  const optionalRiskPenalty = !knowledge && node.type !== "main" ? Math.pow(1 - explorationTolerance, 2) * 0.2 : 0;
  const numerator = goalFit + visibleReward + knowledgeValue + exploration + preparationBonus + wakeBonus;
  const score = numerator * (0.55 + 0.45 * successBelief) / perceivedCost
    - fearPenalty - dormantFailurePenalty - repetitionPenalty - optionalRiskPenalty;
  const hypothesis = failure ? {
    id: `retry:${nodeId}:${failure.failures + 1}`,
    problem: `previous_failure:${nodeId}`,
    cause: wakeReady
      ? `visible power grew ${Math.round(powerGrowth * 100)}% from the failure baseline`
      : "current approach may still be insufficient",
    resultKind: "combat_win",
    target: nodeId,
  } : preparationBonus > 0 ? {
    id: `prepare:${nodeId}:${recentDecisionRepeats(state, action) + 1}`,
    problem: "a failed visible goal remains below its observed power wake condition",
    cause: `known equipment source may raise visible power from ${currentPower} toward ${Math.ceil(dormantFailure.baselinePower * (1 + Number(dormantFailure.wakePowerGrowth || 0.3)))}`,
    resultKind: "power_growth",
    target: nodeId,
  } : !knowledge && (node.type !== "main" || visibleReward >= 0.16) ? {
    id: `explore:${nodeId}`,
    problem: "active growth goal has an unresolved path",
    cause: node.rewardHint ? `visible reward hint: ${node.rewardHint}` : "untried visible encounter",
    resultKind: /角色|营救/.test(String(node.rewardHint || "")) ? "character_unlock" : "combat_win",
    target: nodeId,
  } : null;
  return {
    action,
    kind: "challenge",
    nodeId,
    goalId,
    score: round(score),
    known: Boolean(knowledge),
    hypothesis,
    components: {
      goalFit: round(goalFit),
      goalDrive: round(goalDrive),
      visibleReward: round(visibleReward),
      knowledgeValue: round(knowledgeValue),
      successBelief: round(successBelief),
      exploration: round(exploration),
      perceivedCost: round(perceivedCost),
      fearPenalty: round(fearPenalty),
      dormantFailurePenalty: round(dormantFailurePenalty),
      repetitionPenalty: round(repetitionPenalty),
      preparationBonus: round(preparationBonus),
      wakeBonus: round(wakeBonus),
      powerGrowth: round(powerGrowth),
      wakeThreshold: round(wakeThreshold),
      optionalRiskPenalty: round(optionalRiskPenalty),
    },
    knowledgeBasis: knowledge ? knowledge.id : null,
    failureBasis: failure ? {
      failures: failure.failures,
      fear: failure.fear,
      baselinePower: failure.baselinePower,
      currentPower,
      powerGrowth: round(powerGrowth),
      wakeReady,
    } : null,
  };
}

function scoreSwap(state, observation, action) {
  const knownTeamBehavior = (state.knowledge || []).some((row) => row.pattern?.behavior?.includes("swap"));
  const unresolvedFailure = (state.failureMemories || []).some((row) => !row.resolved && row.failures > 0);
  const attributionFit = unresolvedFailure && knownTeamBehavior ? 0.18 : 0;
  const score = (knownTeamBehavior ? 0.12 : 0.04) + attributionFit;
  return {
    action,
    kind: "swap",
    goalId: state.activeGoalId || "grow_and_progress",
    score: round(score),
    known: knownTeamBehavior,
    components: { discoveredTeamEffect: knownTeamBehavior ? 0.12 : 0.04, failureAttributionFit: attributionFit },
    knowledgeBasis: null,
    failureBasis: null,
  };
}

function buildReasoningChain(state, observation, selected, candidates) {
  const selectedGoal = (state.goals || []).find((goal) => goal.id === selected.goalId);
  const rows = [
    { kind: "goal", evidence: `${selected.goalId}:${round((selectedGoal?.objectiveValue || 0) + (selectedGoal?.subjectiveValue || 0))}` },
    { kind: "affordance", evidence: `${candidates.length} visible actions` },
  ];
  if (selected.knowledgeBasis || selected.failureBasis) {
    rows.push({ kind: "knowledge", evidence: selected.knowledgeBasis || `failure:${selected.failureBasis.failures}` });
  } else if (selected.hypothesis?.cause) {
    rows.push({ kind: "evidence", evidence: selected.hypothesis.cause });
  }
  if (candidates.length > 1) {
    const runnerUp = candidates[1];
    rows.push({ kind: "comparison", evidence: `${selected.action}:${selected.score} > ${runnerUp.action}:${runnerUp.score}` });
  }
  if (selected.hypothesis) rows.push({ kind: "hypothesis", evidence: `${selected.hypothesis.problem} -> ${selected.action}` });
  return rows;
}

function visibleGoalFit(goalText, node) {
  if (!node?.id) return 0;
  const progressionGoal = /推进|首领|郊野/.test(String(goalText || ""));
  if (node.status === "available" && node.type === "main") return progressionGoal ? 0.65 : 0.35;
  if (node.status === "available") return 0.5;
  if (node.status === "repeatable") return 0.28;
  if (node.status === "farmable") return 0.2;
  return String(goalText || "").includes(node.name || "__none__") ? 0.45 : 0.05;
}

function visibleRewardValue(hint) {
  const text = String(hint || "");
  if (!text) return 0;
  if (/角色|营救/.test(text)) return 0.28;
  if (/紫|史诗/.test(text)) return 0.24;
  if (/蓝|稀有/.test(text)) return 0.16;
  return 0.08;
}

function publicCandidate(candidate) {
  return {
    action: candidate.action,
    kind: candidate.kind,
    goalId: candidate.goalId,
    score: candidate.score,
    known: candidate.known,
    components: candidate.components,
    knowledgeBasis: candidate.knowledgeBasis,
    failureBasis: candidate.failureBasis,
  };
}

function goalForNode(node) {
  return node?.type === "main" ? "grow_and_progress" : "discover_new_capabilities";
}

function choiceModeForSelection(state, selected) {
  const unresolved = (state.failureMemories || []).filter((row) => !row.resolved && row.failures > 0);
  if (!unresolved.length) return "goal_pursuit";
  if (selected.failureBasis) return "retry_failed_goal";
  if (selected.goalId !== state.activeGoalId) return "switch_to_other_goal_after_failure";
  return "continue_current_goal_while_failed_goal_is_dormant";
}

function recentDecisionRepeats(state, action) {
  const decisions = (state.trace || []).filter((row) => row.type === "decision").map((row) => row.tuple?.result?.action);
  let count = 0;
  for (let index = decisions.length - 1; index >= 0 && decisions[index] === action; index -= 1) count += 1;
  return count;
}

function terminalDecision(observation) {
  const boss = (observation?.visibleNodes || []).find((node) => node.id === "r1_boss");
  if (!boss || !["farmable", "cleared"].includes(boss.status)) return null;
  const unfinished = (observation.visibleNodes || []).some((node) => node.status === "available");
  return unfinished ? null : "region_goal_complete_no_unfinished_visible_node";
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = { selectNextAction, scoreAction, terminalDecision };
