"use strict";

// 可替换AI端口的确定性测试替身。它只读请求，不接触游戏引擎真值。
function createDeterministicGuessAi() {
  return {
    buildMindToy(request) {
      const facts = Object.assign({}, ...request.observableContext.visibleEvidence.map((row) => row.facts || {}));
      const min = Number(facts.candidateMin);
      const max = Number(facts.candidateMax);
      const probe = Math.floor((min + max) / 2);
      const actionId = `probe:rune_${probe}`;
      const evidenceIds = request.allowedEvidenceIds.filter((id) => id.includes("candidate_range") || id.includes("ordered_feedback"));
      return {
        schema: "mind_structure_build_response_v0", selectedModel: "state_transition",
        selectionReason: "探测结果会改变下一轮候选状态，因此需要一个最小状态转移结构",
        rejectedHigherComplexity: "已经是当前任务所需的最高结构，但只保留一次探测",
        evidenceIds,
        structure: {
          model: "state_transition", initialStateId: "current_candidates", horizon: 1,
          states: ["current_candidates", "lower_than_probe", "equal_to_probe", "higher_than_probe"].map((id) => ({ id, terminal: id !== "current_candidates", valueEstimateId: `estimate:value:${id}` })),
          actions: [{ id: actionId, fromStateId: "current_candidates", transitionEstimateId: "estimate:probe_partition" }],
        },
        estimationRequests: [{
          id: "estimate:probe_partition", targetKind: "transition", targetId: actionId, field: "outcomes", outputShape: "state_distribution",
          knowledgeRule: "derive_only_from_cited_knowledge", reason: "判断这次探测平均能把候选缩小多少", resolution: { resolverId: "probe_partition", probe },
        }, ...["current_candidates", "lower_than_probe", "equal_to_probe", "higher_than_probe"].map((stateId) => ({
          id: `estimate:value:${stateId}`, targetKind: "state_value", targetId: stateId, field: "subjectiveValue", outputShape: "scalar",
          knowledgeRule: "derive_only_from_cited_knowledge", reason: "比较探测前后距离找出目标还有多远", resolution: { resolverId: "state_value", probe },
        }))],
      };
    },
    proposeIdea(request) {
      const action = request.mindToy.structure.actions[0];
      return {
        schema: "cognitive_idea_v0", id: `idea:${action.id}`, actionId: action.id,
        claim: "探测当前候选的中间位置，预计能较均衡地缩小范围",
        rationale: "候选有序且会返回高低反馈，当前思维结构显示这个探测有多个可区分后继状态",
        evidenceIds: request.allowedEvidenceIds.filter((id) => id.includes("candidate_range") || id.includes("ordered_feedback")),
        estimateIds: [action.transitionEstimateId],
      };
    },
  };
}

module.exports = { createDeterministicGuessAi };
