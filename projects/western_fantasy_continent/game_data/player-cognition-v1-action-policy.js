const RUNTIME = require("./player-cognition-v1-event-runtime");

function selectNextAction(cognitionState, observation, options = {}) {
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
  const failure = (state.failureMemories || []).find((row) => row.key === memoryKey);
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
  const fearPenalty = Number(failure?.fear || 0) * (0.45 + (1 - explorationTolerance) * 0.35);
  const repetitionPenalty = node.status === "farmable" && knowledge ? 0.08 : 0;
  const optionalRiskPenalty = !knowledge && node.type !== "main" ? Math.pow(1 - explorationTolerance, 2) * 0.2 : 0;
  const numerator = goalFit + visibleReward + knowledgeValue + exploration;
  const score = numerator * (0.55 + 0.45 * successBelief) / perceivedCost - fearPenalty - repetitionPenalty - optionalRiskPenalty;
  const hypothesis = failure ? {
    id: `retry:${nodeId}:${failure.failures + 1}`,
    problem: `previous_failure:${nodeId}`,
    cause: "current approach may still be insufficient",
    resultKind: "combat_win",
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
      repetitionPenalty: round(repetitionPenalty),
      optionalRiskPenalty: round(optionalRiskPenalty),
    },
    knowledgeBasis: knowledge ? knowledge.id : null,
    failureBasis: failure ? { failures: failure.failures, fear: failure.fear } : null,
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

function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = { selectNextAction, scoreAction };
