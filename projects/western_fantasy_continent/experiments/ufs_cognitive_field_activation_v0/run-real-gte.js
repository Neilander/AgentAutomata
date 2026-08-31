"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  PlayerFeedbackGteMemory,
  compileFeedbackGteForLearner,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");
const {
  activateCognitiveField,
} = require("../ufs_first_action_imagination_v0/ufs-cognitive-field-activation");
const {
  UfsFeedbackLearner,
} = require("../ufs_first_action_imagination_v0/ufs-feedback-learning");

const HERE = __dirname;
const summaries = JSON.parse(fs.readFileSync(path.join(HERE, "agent-cue-summaries.json"), "utf8"));
const full = summaries.runs.find((run) => run.knowledgeBaseId === "full-research-rules");
const operations = full.operationHints[0].operations;
const beforeQ = {
  affected_object: "可结算的研究房、当前能源与研究轨道",
  change_trend: "研究房等待支付，研究推进尚未选择",
  cause_relation: "玩家看见准备好的研究房并准备先支付再选择推进格数",
  temporal_state: "两步研究操作开始前",
  context: "UFS规则书提供的两步研究方法",
};
const followingQ = {
  affected_object: "研究标记与玩家能源",
  change_trend: "研究标记推进2格，能源从2降低到0",
  cause_relation: "支付研究房能源后选择连续推进2格",
  temporal_state: "两步研究操作全部完成后",
  context: "可结算研究房产生研究进度",
};

const learner = new UfsFeedbackLearner({ now: () => "2026-08-30T02:30:00.000Z" });
learner.learnObservedTransition({
  evidence: {
    evidenceId: "rulebook-two-step-research-real-gte",
    playerVisible: true,
    transition: "knowledge_query",
    systemIntegrity: "passed",
  },
  currentQ: beforeQ,
  actualFollowingQ: followingQ,
  operations,
  source: { kind: "rule_query", ref: "K-ROOM-RESEARCH" },
});
const overlay = compileFeedbackGteForLearner({ learner });
const state = learner.exportState();
const memory = new PlayerFeedbackGteMemory({
  overlay,
  trajectories: state.trajectories,
  memories: state.memories,
  chains: state.chains,
});
const activationsByKnowledge = summaries.runs.map((run) => ({
  knowledgeBaseId: run.knowledgeBaseId,
  result: activateCognitiveField({
    memory,
    cues: run.cues,
    topK: 4,
    threshold: 0.5,
  }),
}));

const output = {
  schema: "ufs_cognitive_field_real_gte_result_v0",
  encoder: overlay.encoder,
  operationCount: operations.length,
  knowledgeCueComparison: summaries.runs.map((run) => ({
    knowledgeBaseId: run.knowledgeBaseId,
    cueKinds: run.cues.map((cue) => cue.kind),
    cueChannels: run.cues.map((cue) => cue.channel),
    operationHintLengths: run.operationHints.map((hint) => hint.operations.length),
    unknownCount: run.unknowns.length,
  })),
  diagnosticFixedMemoryIndex: true,
  activationByKnowledge: activationsByKnowledge.map(({ knowledgeBaseId, result }) => ({
    knowledgeBaseId,
    cueCount: result.cueCount,
    candidates: result.candidates.map((candidate) => ({
      trajectoryId: candidate.trajectoryId,
      operations: candidate.trajectory.operations,
      followingQ: candidate.trajectory.followingQ,
      recallActivation: candidate.recallActivation,
      strongestActivation: candidate.strongestActivation,
      matchedCueKinds: candidate.matchedCueKinds,
      matchedChannels: candidate.matchedChannels,
      evidence: candidate.evidence,
      supportingMemoryIds: candidate.supportingMemoryIds,
    })),
  })),
};

process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
