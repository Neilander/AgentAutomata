"use strict";

const STATUS_ORDER = Object.freeze({
  complete: 0,
  partial: 1,
  none: 2,
  harmful: 3,
  invalid: 4,
});

/**
 * Exhaustively grounds one goal against one already-instantiated action set.
 *
 * This is deliberately not a planner. It does not invent actions, create
 * subgoals, chain transitions, or choose a winner. Every supplied action is
 * simulated exactly once and retained in the audit result.
 */
function matchOneTurn({
  goal,
  state,
  actions,
  simulate,
  actionKey = defaultActionKey,
  describeAction = defaultDescribeAction,
}) {
  validateInputs({ goal, state, actions, simulate, actionKey, describeAction });

  const keyed = actions.map((action, index) => ({
    action,
    index,
    key: String(actionKey(action)),
  }));
  const duplicate = findDuplicate(keyed.map((row) => row.key));
  if (duplicate) throw new Error(`duplicate action key: ${duplicate}`);

  const results = keyed.map(({ action, index, key }) => {
    const label = String(describeAction(action));
    try {
      const after = simulate(state, action);
      const assessment = normalizeAssessment(goal.assess({ before: state, after, action }));
      return {
        actionKey: key,
        actionLabel: label,
        inputIndex: index,
        status: assessment.status,
        progress: assessment.progress,
        evidence: assessment.evidence,
        after,
      };
    } catch (error) {
      return {
        actionKey: key,
        actionLabel: label,
        inputIndex: index,
        status: "invalid",
        progress: 0,
        evidence: [{ type: "simulation_error", message: error.message }],
        error: error.message,
        after: null,
      };
    }
  });

  const ranked = [...results].sort((left, right) => {
    return STATUS_ORDER[left.status] - STATUS_ORDER[right.status]
      || right.progress - left.progress
      || left.inputIndex - right.inputIndex;
  });
  const counts = Object.fromEntries(Object.keys(STATUS_ORDER).map((status) => [
    status,
    results.filter((row) => row.status === status).length,
  ]));

  return {
    schema: "one_turn_grounded_match_v0",
    goal: { id: goal.id, label: goal.label },
    exhaustiveOverSuppliedActions: true,
    suppliedActionCount: actions.length,
    examinedActionCount: results.length,
    hasDirectMatch: counts.complete > 0,
    hasPartialMatch: counts.partial > 0,
    counts,
    results,
    ranked,
    best: ranked.find((row) => row.status !== "invalid") || null,
    limits: {
      transitionDepth: 1,
      createsSubgoals: false,
      chainsActions: false,
      selectsAction: false,
    },
  };
}

function normalizeAssessment(value) {
  if (!value || typeof value !== "object") throw new Error("goal.assess must return an object");
  const progress = Number(value.progress ?? 0);
  if (!Number.isFinite(progress)) throw new Error("goal progress must be finite");
  const status = value.status || inferStatus(value.satisfied, progress);
  if (!(status in STATUS_ORDER) || status === "invalid") {
    throw new Error(`goal returned unsupported status: ${status}`);
  }
  if (status === "complete" && value.satisfied === false) {
    throw new Error("complete assessment cannot be explicitly unsatisfied");
  }
  return {
    status,
    progress,
    evidence: Array.isArray(value.evidence) ? value.evidence : [],
  };
}

function inferStatus(satisfied, progress) {
  if (satisfied === true) return "complete";
  if (progress > 0) return "partial";
  if (progress < 0) return "harmful";
  return "none";
}

function validateInputs({ goal, state, actions, simulate, actionKey, describeAction }) {
  if (!goal || typeof goal.id !== "string" || typeof goal.label !== "string" || typeof goal.assess !== "function") {
    throw new Error("goal requires id, label, and assess({ before, after, action })");
  }
  if (state == null || typeof state !== "object") throw new Error("state must be an object");
  if (!Array.isArray(actions)) throw new Error("actions must be an array");
  if (typeof simulate !== "function") throw new Error("simulate must be a function");
  if (typeof actionKey !== "function") throw new Error("actionKey must be a function");
  if (typeof describeAction !== "function") throw new Error("describeAction must be a function");
}

function findDuplicate(values) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}

function defaultActionKey(action) {
  if (action && action.id != null) return action.id;
  return JSON.stringify(action);
}

function defaultDescribeAction(action) {
  if (action && action.label != null) return action.label;
  return defaultActionKey(action);
}

module.exports = {
  STATUS_ORDER,
  matchOneTurn,
};
