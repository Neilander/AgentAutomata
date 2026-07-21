const { deriveEventImpact } = require("./event-impact-engine-v1");
const {
  projectEmotionsAtHorizon,
  simulateEmotionSequence,
} = require("./emotion-simulator-v1");

function simulateStructuredEmotionSequence(input, options = {}) {
  if (!Array.isArray(input?.events) || input.events.length === 0) {
    throw new Error("input.events must contain structured events");
  }
  const events = [...input.events].sort((left, right) => left.time - right.time);
  let priorThreat = initialThreatFromHistory(input.history);
  const impacts = [];
  const simulatorEvents = [];

  for (const event of events) {
    const impact = deriveEventImpact({
      event,
      profile: input.profile,
      history: input.history,
      context: { priorThreat },
    });
    impacts.push(impact);
    simulatorEvents.push({
      id: event.id,
      time: event.time,
      description: `structured-event:${event.id}`,
      appraisals: impact.appraisals,
      targets: impact.targets,
      measuredChemistry: event.measuredChemistry || {},
      observedPhysical: event.observedPhysical || {},
    });
    const threat = effectiveAppraisal(impact.appraisals.threatMagnitude);
    const resolution = effectiveAppraisal(impact.appraisals.threatResolution);
    priorThreat = Math.max(threat, priorThreat * 0.82) * (1 - 0.85 * resolution);
  }

  const simulation = simulateEmotionSequence({
    profile: input.profile?.emotionDynamics || {},
    initialPhysiology: input.initialPhysiology || { chemistry: {} },
    longTermContext: {
      ...(input.history || {}),
      memories: input.history?.memories || [],
    },
    events: simulatorEvents,
  }, options);
  const settledHorizonSeconds = Math.max(0, Number(options.settledHorizonSeconds) || 60);
  const frames = simulation.frames.map((frame) => ({
    ...frame,
    settledHorizonSeconds,
    settledEmotions: projectEmotionsAtHorizon(frame.emotions, settledHorizonSeconds),
  }));

  return {
    schema: "structured_emotion_pipeline_v1",
    eventImpacts: impacts,
    frames,
    finalChemistry: simulation.finalChemistry,
    audit: {
      narrativeTextReadByImpactEngine: false,
      goldEmotionReadByImpactEngine: false,
      formalPlayerAgentModified: false,
    },
  };
}

function initialThreatFromHistory(history = {}) {
  const memories = Array.isArray(history.memories) ? history.memories : [];
  let remaining = 1;
  let threat = 0;
  for (const memory of memories) {
    if (memory.category !== "threat") continue;
    const contribution = clamp01(Number(memory.strength) || 0.5)
      * clamp01(Number(memory.recency) || 0.5)
      * (memory.resolved === true ? 0.2 : 1);
    threat += remaining * contribution;
    remaining *= 1 - contribution;
  }
  return clamp01(threat * 0.5);
}

function effectiveAppraisal(entry) {
  if (!entry) return 0;
  return clamp01(entry.value * entry.confidence);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

module.exports = {
  simulateStructuredEmotionSequence,
};
