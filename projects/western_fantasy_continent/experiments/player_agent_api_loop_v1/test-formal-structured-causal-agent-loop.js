const assert = require("node:assert/strict");
const LOOP = require("./player-agent-loop");

const confirmed = runCase({
  seed: "formal-causal-agent-confirmed",
  expectedOutcomePredicate: "combat_won",
  expectedStatus: "confirmed",
});
const refuted = runCase({
  seed: "formal-causal-agent-refuted",
  expectedOutcomePredicate: "combat_lost",
  expectedStatus: "refuted",
});
const inconclusive = runMissingSkillCase();

assert(confirmed.causalKnowledgeUpdates >= 3);
assert(confirmed.verificationEmotion > 0);
assert.equal(refuted.verificationEmotion, 0);
assert(refuted.causalKnowledgeUpdates >= 3);
assert.equal(inconclusive.causalKnowledgeUpdates, 0);
assert.equal(inconclusive.verificationEmotion, 0);

console.log(JSON.stringify({
  result: "PASS",
  scope: "战前公开技能合同→Agent结构化因果链→真实战斗证据→EVerify→因果学习",
  cases: { confirmed, refuted, inconclusive },
}, null, 2));

function runCase({ seed, expectedOutcomePredicate, expectedStatus }) {
  const session = LOOP.createSession(seed, 1, {
    profileId: "open_novice",
    perceptionProfile: "high",
  });
  const request = LOOP.getPendingRequest(session);
  const warrior = request.observation.roster.find((row) => row.id === "hero_warrior");
  const powerStrike = warrior.visibleSkills.find((row) => row.name === "重击");
  assert(warrior?.causalRef, "战前请求应公开角色因果引用");
  assert(powerStrike?.actionId, "战前请求应公开技能因果标识");
  assert(!JSON.stringify(request).includes("powerStrike"), "战前请求不应泄漏内部技能键");

  const hypothesisId = `agent-chain:${expectedOutcomePredicate}`;
  const response = {
    action: "challenge:r1_main_1",
    goalId: request.playerState.activeGoalId,
    reasoningChain: [
      { kind: "goal", evidence: "推进当前可见主线。" },
      { kind: "evidence", evidence: "灰鸦战士当前在队，并公开显示重击技能。" },
      { kind: "affordance", evidence: "当前可挑战灰带郊野1。" },
      { kind: "comparison", evidence: "挑战比只换站位更直接验证技能链。" },
      { kind: "hypothesis", evidence: "重击命中后若战斗达到预期结果，则这条路径得到支持。" },
    ],
    alternatives: ["swap:0:militia_drum"],
    hypothesis: {
      id: hypothesisId,
      problem: "验证灰鸦战士的重击是否参与本场结果",
      cause: "灰鸦战士使用重击造成伤害",
      claim: `重击伤害是通向${expectedOutcomePredicate === "combat_won" ? "胜利" : "失败"}的一条贡献路径`,
      claimMode: "contributing_path",
      resultKind: expectedOutcomePredicate,
      target: "hero_warrior",
      verificationScope: "current_action",
      causalChain: [
        {
          id: "cast",
          statement: "灰鸦战士施放重击",
          matcher: {
            predicate: "skill_cast",
            subject: warrior.causalRef,
            actionId: powerStrike.actionId,
          },
        },
        {
          id: "damage",
          statement: "灰鸦战士用重击造成伤害",
          matcher: {
            predicate: "damage_dealt",
            subject: warrior.causalRef,
            actionId: powerStrike.actionId,
          },
        },
        {
          id: "outcome",
          statement: expectedOutcomePredicate === "combat_won" ? "战斗胜利" : "战斗失败",
          matcher: { predicate: expectedOutcomePredicate },
        },
      ],
    },
  };

  const after = LOOP.applyDecisionResponse(session, response);
  const record = after.history[0];
  const verification = record.causalHypothesisVerification.results[0];
  assert.equal(verification.matcherStatus, "matched");
  assert.equal(verification.status, expectedStatus);
  assert.equal(verification.settlement.settled, true);
  assert.equal(
    after.cognitionState.hypotheses.find((row) => row.id === hypothesisId).status,
    expectedStatus,
  );
  const trace = after.cognitionState.trace.find((row) => (
    row.type === "structured_causal_verification"
    && row.hypothesisVerification?.some((item) => item.id === hypothesisId)
  ));
  assert(trace, "正式运行时应产生结构化EVerify轨迹");
  assert.equal(trace.verificationFeedback.rows[0].evidenceSource, "semantic_causal_evidence");
  const receivedActionIds = new Set(
    record.receivedInformation.causalEvidence.map((row) => row.actionId).filter(Boolean),
  );
  assert(receivedActionIds.has(powerStrike.actionId), "战后证据必须复用战前公开技能标识");
  assert.equal(record.receivedInformation.audit.hypothesisAttention.active, true);
  assert.equal(record.receivedInformation.audit.hypothesisAttention.changesInformationTier, false);
  assert.equal(record.receivedInformation.audit.hypothesisAttention.affectsOrdinaryKnowledgeSignals, false);

  return {
    status: verification.status,
    receivedEvidenceCount: record.receivedInformation.causalEvidence.length,
    focusedEvidenceCount: record.receivedInformation.audit.hypothesisAttention.receivedFocusedCandidateCount,
    publicActionIdReused: true,
    stepStates: verification.stepMatches.map((row) => row.state),
    verificationEmotion: trace.verificationEmotion,
    causalKnowledgeUpdates: trace.causalKnowledgeUpdates.length,
    finalBeliefs: trace.causalKnowledgeUpdates.map((row) => ({
      belief: row.belief,
      confidence: row.confidence,
      lastStatus: row.lastStatus,
    })),
  };
}

function runMissingSkillCase() {
  const session = LOOP.createSession("formal-causal-agent-inconclusive", 1, {
    profileId: "open_novice",
    perceptionProfile: "high",
  });
  const request = LOOP.getPendingRequest(session);
  const reserveDrummer = request.observation.roster.find((row) => row.id === "militia_drum");
  const tempoSong = reserveDrummer.visibleSkills[0];
  const hypothesisId = "agent-chain:missing-reserve-skill";
  const response = {
    action: "challenge:r1_main_1",
    goalId: request.playerState.activeGoalId,
    reasoningChain: [
      { kind: "goal", evidence: "推进当前主线。" },
      { kind: "evidence", evidence: "备用角色公开显示节奏歌。" },
      { kind: "affordance", evidence: "当前可以直接挑战。" },
      { kind: "comparison", evidence: "也可以先把该角色换上。" },
      { kind: "hypothesis", evidence: "测试未上场角色的技能是否真的出现。" },
    ],
    alternatives: ["swap:0:militia_drum"],
    hypothesis: {
      id: hypothesisId,
      problem: "不能把没有上场的角色当作本场原因",
      cause: "备用鼓手使用节奏歌",
      claim: "备用鼓手的节奏歌参与本场胜利",
      claimMode: "contributing_path",
      resultKind: "combat_won",
      target: "militia_drum",
      verificationScope: "current_action",
      causalChain: [
        {
          id: "cast",
          statement: "备用鼓手施放节奏歌",
          matcher: {
            predicate: "skill_cast",
            subject: reserveDrummer.causalRef,
            actionId: tempoSong.actionId,
          },
        },
        {
          id: "buff",
          statement: "节奏歌提供增益",
          matcher: {
            predicate: "buff_applied",
            actionId: tempoSong.actionId,
          },
        },
        {
          id: "outcome",
          statement: "战斗胜利",
          matcher: { predicate: "combat_won" },
        },
      ],
    },
  };
  const after = LOOP.applyDecisionResponse(session, response);
  const verification = after.history[0].causalHypothesisVerification.results[0];
  const attentionAudit = after.history[0].receivedInformation.audit.hypothesisAttention;
  const trace = after.cognitionState.trace.find((row) => row.type === "structured_causal_verification");
  assert.equal(verification.status, "inconclusive");
  assert.deepEqual(verification.stepMatches.map((row) => row.state), [
    "unknown",
    "unknown",
    "observed",
  ]);
  assert.equal(attentionAudit.active, true);
  assert.equal(attentionAudit.matchedCandidateCount, 0);
  return {
    status: verification.status,
    publicActionIdReused: true,
    stepStates: verification.stepMatches.map((row) => row.state),
    verificationEmotion: trace.verificationEmotion,
    causalKnowledgeUpdates: trace.causalKnowledgeUpdates.length,
  };
}
