"use strict";

function chooseNextCognitiveOperation(input = {}) {
  const budget = Number(input.attentionRemaining ?? 0);
  if (!input.activeCognition) return decision("perceive_and_retrieve", "当前还没有可用于思考的激活认知");
  if (!input.mindToy) return decision("build_mind_toy", "需要先形成当前问题的最小思维结构");
  if (input.mindToy.phase === "estimate" || input.hasUnresolvedRequiredEstimates) {
    return decision("resolve_estimates", "结构中仍有决定行动所需的未知估算");
  }
  const ideas = Array.isArray(input.ideas) ? input.ideas : [];
  if (!ideas.length) return decision("propose_one_idea", "当前还没有具体可尝试思路");
  const pending = ideas.find((row) => !row.attempt);
  if (pending) return decision("attempt_one_idea", "对一个新思路做有限局部推演", pending.idea?.id || pending.id);
  const useful = ideas
    .filter((row) => row.evaluation?.useful)
    .sort((a, b) => Number(b.evaluation.predictedProgress) - Number(a.evaluation.predictedProgress))[0];
  if (useful && (budget <= Number(input.actBudgetThreshold ?? 1) || Number(useful.evaluation.confidence) >= Number(input.actConfidenceThreshold ?? 0.55))) {
    return decision("act", "已有足够可靠且能推进目标的思路", useful.idea?.id || useful.id);
  }
  if (budget > Number(input.minimumIdeaBudget ?? 0.5)) return decision("propose_one_idea", "现有思路尚不够好，尝试形成另一条思路");
  if (useful) return decision("act", "注意力即将耗尽，执行当前最佳可用思路", useful.idea?.id || useful.id);
  return decision("act_fallback", "注意力耗尽且没有可靠思路，只能执行保底合法行动");
}

function decision(operation, reason, targetIdeaId = null) {
  return { schema: "cognitive_controller_decision_v0", operation, reason, targetIdeaId };
}

module.exports = { chooseNextCognitiveOperation };
