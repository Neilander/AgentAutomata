"use strict";

// 历史隔离版：Insight作为核心特征的结构已被player_decision_features_v2取代。

/**
 * 隔离的决策特征识别器。
 *
 * 它只描述一次决策过程，不读取胜负、奖励、情绪或玩家喜好，
 * 也不把四个特征翻译成任何正负反馈。
 */
function assessDecisionFeatures(episode = {}) {
  const segments = Array.isArray(episode.thoughtSegments) ? episode.thoughtSegments : [];

  let cognitiveDose = 0;
  let ordinaryQualityDose = 0;
  let qualityWeightedSum = 0;

  for (const segment of segments) {
    if (segment?.deliberate === false) continue;

    const duration = Math.max(0, number(segment?.durationUnits));
    const intensity = clamp01(segment?.controlIntensity);
    const dose = duration * intensity;
    if (dose <= 0) continue;

    cognitiveDose += dose;

    // 突破步骤仍然消耗思考量，但它的特殊推进由Insight单独描述，
    // 不在Q中再次结算。Q只描述其余思考是否持续推进。
    if (segment?.breakthrough === true) continue;
    ordinaryQualityDose += dose;

    // cognitiveChange表示这一小段思考后，决策状态是更清楚/可行动，
    // 还是更混乱。positive change还必须是新产生的，而不是重复旧结论。
    const cognitiveChange = clampSigned(segment?.cognitiveChange);
    const newness = clamp01(segment?.newCognitiveContent);
    const qualityContribution = cognitiveChange >= 0
      ? cognitiveChange * newness
      : cognitiveChange;
    qualityWeightedSum += dose * qualityContribution;
  }

  // EDecision保留原始累计剂量，不在特征层封顶；偏好区间和疲劳曲线
  // 属于未来二级反馈模型。
  const EDecision = cognitiveDose;
  const QDecision = ordinaryQualityDose > 0
    ? clampSigned(qualityWeightedSum / ordinaryQualityDose)
    : 0;

  const insightEvidence = episode.insight || {};
  const Insight = minGate([
    insightEvidence.keyRelationUnderstood,
    insightEvidence.newToPlayer,
    insightEvidence.suddenness,
    insightEvidence.subjectiveOptionCompression,
  ]);

  const choiceEvidence = episode.choice || {};
  const meaningfulAlternativeCount = Math.max(0, number(choiceEvidence.meaningfulAlternativeCount));
  const ChoiceAuthorship = meaningfulAlternativeCount >= 2
    ? minGate([
      choiceEvidence.meaningfulDifference,
      choiceEvidence.tradeoffUnderstanding,
      choiceEvidence.voluntariness,
      choiceEvidence.preferenceExpression,
    ])
    : 0;

  return {
    features: {
      EDecision: round(EDecision),
      QDecision: round(QDecision),
      Insight: round(Insight),
      ChoiceAuthorship: round(ChoiceAuthorship),
    },
    audit: {
      cognitiveDose: round(cognitiveDose),
      ordinaryQualityDose: round(ordinaryQualityDose),
      deliberateSegmentCount: segments.filter((segment) => segment?.deliberate !== false
        && number(segment?.durationUnits) > 0
        && number(segment?.controlIntensity) > 0).length,
      meaningfulAlternativeCount,
    },
  };
}

function minGate(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  return clamp01(Math.min(...values.map(clamp01)));
}

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, number(value)));
}

function clampSigned(value) {
  return Math.max(-1, Math.min(1, number(value)));
}

function round(value) {
  return Math.round(number(value) * 10000) / 10000;
}

module.exports = {
  assessDecisionFeatures,
};
