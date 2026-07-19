const SCHEMA = "hypothesis_directed_attention_v1";
const MAX_ACTIVE_HYPOTHESES = 2;
const MAX_ATTENTION_TARGETS = 6;

const PASSIVELY_OBVIOUS_PREDICATES = new Set([
  "combat_won",
  "combat_lost",
]);

function buildHypothesisDirectedAttention(hypothesesInput, options = {}) {
  const action = String(options.action || "");
  const eligible = (hypothesesInput || [])
    .filter((row) => (
      row?.status === "pending"
      && Array.isArray(row.causalChain)
      && (
        (row.verificationScope === "current_action" && row.action === action)
        || (row.verificationScope === "next_combat" && row.chosenBehavior !== action)
      )
    ))
    .slice(0, MAX_ACTIVE_HYPOTHESES);

  const targets = [];
  for (const hypothesis of eligible) {
    for (const step of hypothesis.causalChain) {
      if (targets.length >= MAX_ATTENTION_TARGETS) break;
      if (!isEligibleAttentionMatcher(step?.matcher)) continue;
      targets.push({
        hypothesisId: String(hypothesis.id),
        stepId: String(step.id),
        matcher: clone(step.matcher),
      });
    }
  }

  return {
    schema: SCHEMA,
    active: targets.length > 0,
    hypothesisIds: [...new Set(targets.map((row) => row.hypothesisId))],
    targets,
    limits: {
      maxActiveHypotheses: MAX_ACTIVE_HYPOTHESES,
      maxAttentionTargets: MAX_ATTENTION_TARGETS,
    },
  };
}

function isEligibleAttentionMatcher(matcher) {
  if (!matcher || typeof matcher !== "object") return false;
  if (!matcher.predicate || PASSIVELY_OBVIOUS_PREDICATES.has(matcher.predicate)) return false;
  return Boolean(
    matcher.actionId
    || hasKeys(matcher.subject)
    || hasKeys(matcher.object)
    || (matcher.qualifiersAll || []).length
    || hasKeys(matcher.environment),
  );
}

function hasKeys(value) {
  return value && typeof value === "object" && Object.keys(value).length > 0;
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMA,
  MAX_ACTIVE_HYPOTHESES,
  MAX_ATTENTION_TARGETS,
  buildHypothesisDirectedAttention,
};
