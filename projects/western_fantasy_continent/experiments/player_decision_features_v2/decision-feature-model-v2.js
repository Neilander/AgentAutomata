"use strict";

/**
 * 第二版隔离模型：只输出四个核心决策特征。
 *
 * EDecision       主动思考累计剂量
 * QDecision       每单位思考解决复杂问题的程度
 * Ordering        每单位思考把混乱内容组织成有序结构的程度
 * ChoiceAuthorship 有意义选择表达玩家自身意愿的程度
 */
function assessCoreDecisionFeatures(episode = {}) {
  const segments = Array.isArray(episode.thoughtSegments) ? episode.thoughtSegments : [];

  let cognitiveDose = 0;
  let problemResolutionSum = 0;
  let orderingGainSum = 0;

  for (const segment of segments) {
    if (segment?.deliberate === false) continue;

    const duration = Math.max(0, number(segment?.durationUnits));
    const intensity = clamp01(segment?.controlIntensity);
    const dose = duration * intensity;
    if (dose <= 0) continue;

    cognitiveDose += dose;
    problemResolutionSum += dose * clampSigned(segment?.resolvedComplexity);
    orderingGainSum += dose * clampSigned(segment?.orderingGain);
  }

  const choice = episode.choice || {};
  const meaningfulAlternativeCount = Math.max(0, number(choice.meaningfulAlternativeCount));
  const ChoiceAuthorship = meaningfulAlternativeCount >= 2
    ? minGate([
      choice.meaningfulDifference,
      choice.tradeoffUnderstanding,
      choice.voluntariness,
      choice.preferenceExpression,
    ])
    : 0;

  return {
    coreFeatures: {
      EDecision: round(cognitiveDose),
      QDecision: round(cognitiveDose > 0 ? problemResolutionSum / cognitiveDose : 0),
      Ordering: round(cognitiveDose > 0 ? orderingGainSum / cognitiveDose : 0),
      ChoiceAuthorship: round(ChoiceAuthorship),
    },
    audit: {
      cognitiveDose: round(cognitiveDose),
      deliberateSegmentCount: segments.filter((segment) => segment?.deliberate !== false
        && number(segment?.durationUnits) > 0
        && number(segment?.controlIntensity) > 0).length,
      meaningfulAlternativeCount,
    },
  };
}

/**
 * AhaMoment属于二层体验，不属于四个核心特征。
 * 它只在“此前积累的困惑，在很短时间内被真正理解并大量消解”时升高。
 */
function deriveAhaMoment(transition = {}, configInput = {}) {
  const referenceInstantUnits = positive(configInput.referenceInstantUnits, 1);
  const confusionBefore = clamp01(transition.confusionBefore);
  const confusionAfter = clamp01(transition.confusionAfter);
  const confusionReleased = Math.max(0, confusionBefore - confusionAfter);
  const resolutionDurationUnits = Math.max(0, number(transition.resolutionDurationUnits));
  const suddenness = 1 / (1 + resolutionDurationUnits / referenceInstantUnits);
  const comprehension = clamp01(transition.comprehension);

  return {
    secondLayer: {
      AhaMoment: round(confusionReleased * suddenness * comprehension),
    },
    audit: {
      confusionBefore: round(confusionBefore),
      confusionAfter: round(confusionAfter),
      confusionReleased: round(confusionReleased),
      suddenness: round(suddenness),
      comprehension: round(comprehension),
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

function positive(value, fallback) {
  const parsed = number(value);
  return parsed > 0 ? parsed : fallback;
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
  assessCoreDecisionFeatures,
  deriveAhaMoment,
};
