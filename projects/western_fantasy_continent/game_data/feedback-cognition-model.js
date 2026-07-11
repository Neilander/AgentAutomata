const GAME_FEEDBACK_COGNITION_MODEL = (() => {
  const DEFAULT_CONFIG = {
    version: "feedback-v4",
    maxValue: 100,
    initialValue: 38,
    lowThreshold: 20,
    decayPer5s: 4.5,
    freshnessDecay: 0.1,
    recoveryPerFailure: 0.4,
    expectationMissPenalty: 4,
    abandon: {
      baseBias: -3.4,
      localFailureWeight: 0.75,
      totalFailureWeight: 0.08,
      feedbackProtectionWeight: 2.3,
    },
    baseIntensity: {
      "cast:": 0.35,
      "kill:normal_enemy": 1.3,
      "kill:elite_enemy": 7,
      "survive:danger_window": 8,
      "verify:team_change": 8,
      "proof:role_contribution": 10,
      "loot:equipment": 4.5,
      "loot:rare_equipment": 8,
      "equip:power_upgrade": 4.5,
      "clear:main_level": 6,
      "clear:side_branch": 10,
      "clear:boss": 16,
      "unlock:character": 20,
      "unlock:region": 26,
      "discover:main_node": 2,
      "discover:side_branch": 6,
      "discover:boss": 8,
      "decision:first_main_route": 3,
      "decision:new_main_challenge": 2,
      "decision:side_branch": 5,
      "decision:retry_after_failure": 4,
      "decision:farm_after_failure": 3,
      "decision:change_team": 6,
      "expectation:fulfilled": 6,
    },
  };

  function normalizeConfig(overrides = {}) {
    return {
      ...DEFAULT_CONFIG,
      ...overrides,
      abandon: { ...DEFAULT_CONFIG.abandon, ...(overrides.abandon || {}) },
      baseIntensity: { ...DEFAULT_CONFIG.baseIntensity, ...(overrides.baseIntensity || {}) },
    };
  }

  function createState(configInput = {}, seed = "feedback-player") {
    const config = normalizeConfig(configInput);
    return {
      schema: "feedback_cognition_state_v1",
      version: config.version,
      value: clamp(config.initialValue, 0, config.maxValue),
      maxValue: config.maxValue,
      gameTime: 0,
      lastDecayTime: 0,
      nextDecayTime: 5,
      eventRecords: {},
      localFailures: {},
      totalFailures: 0,
      activeFailureObject: null,
      activeFailureCount: 0,
      abandoned: false,
      lastAbandonDecision: null,
      rngState: seedHash(seed),
      trace: [],
      contributionByEvent: {},
      contributionByCategory: {},
      lowFeedbackSeconds: 0,
      currentLowFeedbackSeconds: 0,
      maxLowFeedbackStreak: 0,
      minValue: clamp(config.initialValue, 0, config.maxValue),
      lastGainTime: 0,
      longestNoGainSeconds: 0,
      expectations: {},
    };
  }

  function advanceTo(state, targetTime, configInput = {}, context = {}) {
    const config = normalizeConfig(configInput);
    const target = Math.max(state.gameTime, Number(targetTime) || 0);
    while (state.nextDecayTime <= target + 1e-9) {
      accumulateElapsed(state, state.nextDecayTime, config);
      const before = state.value;
      state.value = Math.max(0, state.value - config.decayPer5s);
      state.minValue = Math.min(state.minValue, state.value);
      state.lastDecayTime = state.nextDecayTime;
      state.nextDecayTime += 5;
      state.trace.push({
        type: "decay",
        gameTime: round(state.gameTime),
        feedbackBefore: round(before),
        decayAmount: round(before - state.value),
        feedbackAfter: round(state.value),
        context,
      });
    }
    accumulateElapsed(state, target, config);
    return state;
  }

  function triggerEvent(state, eventKey, options = {}, configInput = {}) {
    const config = normalizeConfig(configInput);
    advanceTo(state, options.time ?? state.gameTime, config, options.context);
    const record = state.eventRecords[eventKey] || {
      triggerCount: 0,
      baseIntensity: resolveBaseIntensity(eventKey, config),
      freshness: 1,
      lastTriggerTime: null,
      totalFeedbackGranted: 0,
    };
    const before = state.value;
    const freshnessBefore = record.freshness;
    const desireMultiplier = Math.max(0, Number(options.desireMultiplier ?? 1));
    const magnitudeMultiplier = Math.max(0, Number(options.magnitudeMultiplier ?? 1));
    const gain = record.baseIntensity * desireMultiplier * magnitudeMultiplier * freshnessBefore;
    state.value = Math.min(state.maxValue, state.value + gain);
    const granted = state.value - before;
    record.triggerCount += 1;
    record.freshness = Math.max(0, record.freshness - config.freshnessDecay);
    if (record.freshness < 1e-9) record.freshness = 0;
    record.lastTriggerTime = state.gameTime;
    record.totalFeedbackGranted += granted;
    state.eventRecords[eventKey] = record;
    state.contributionByEvent[eventKey] = (state.contributionByEvent[eventKey] || 0) + granted;
    const category = eventCategory(eventKey);
    state.contributionByCategory[category] = (state.contributionByCategory[category] || 0) + granted;
    if (granted > 0) {
      state.longestNoGainSeconds = Math.max(state.longestNoGainSeconds, state.gameTime - state.lastGainTime);
      state.lastGainTime = state.gameTime;
    }
    if (state.value > config.lowThreshold) state.currentLowFeedbackSeconds = 0;
    state.trace.push({
      type: "event",
      gameTime: round(state.gameTime),
      eventKey,
      category,
      triggerCount: record.triggerCount,
      baseIntensity: round(record.baseIntensity),
      desireMultiplier: round(desireMultiplier),
      magnitudeMultiplier: round(magnitudeMultiplier),
      freshnessBefore: round(freshnessBefore),
      feedbackGain: round(granted),
      feedbackBefore: round(before),
      feedbackAfter: round(state.value),
      metadata: options.metadata || {},
    });
    return granted;
  }

  function recordFailure(state, failedObject, relatedEvents = [], options = {}, configInput = {}) {
    const config = normalizeConfig(configInput);
    advanceTo(state, options.time ?? state.gameTime, config, options.context);
    state.localFailures[failedObject] = (state.localFailures[failedObject] || 0) + 1;
    state.totalFailures += 1;
    const localCount = state.localFailures[failedObject];
    state.activeFailureObject = failedObject;
    state.activeFailureCount = localCount;
    const preAbandonEmotion = emotionLabel(state, config);
    const feedbackRatio = state.maxValue ? state.value / state.maxValue : 0;
    const abandonLogit = config.abandon.baseBias
      + config.abandon.localFailureWeight * localCount
      + config.abandon.totalFailureWeight * state.totalFailures
      - config.abandon.feedbackProtectionWeight * feedbackRatio;
    const abandonProbability = sigmoid(abandonLogit);
    const abandonRoll = nextRandom(state);
    const abandoned = abandonRoll < abandonProbability;
    const recoveries = [];
    if (!abandoned) {
      for (const eventKey of [...new Set(relatedEvents)]) {
        const record = state.eventRecords[eventKey] || {
          triggerCount: 0,
          baseIntensity: resolveBaseIntensity(eventKey, config),
          freshness: 1,
          lastTriggerTime: null,
          totalFeedbackGranted: 0,
        };
        const before = record.freshness;
        record.freshness = Math.min(1, record.freshness + config.recoveryPerFailure);
        state.eventRecords[eventKey] = record;
        recoveries.push({ eventKey, before: round(before), after: round(record.freshness) });
      }
    }
    state.abandoned = abandoned;
    state.lastAbandonDecision = {
      failedObject,
      gameTime: state.gameTime,
      preAbandonEmotion,
      probability: abandonProbability,
      roll: abandonRoll,
      abandoned,
    };
    state.trace.push({
      type: "failure",
      gameTime: round(state.gameTime),
      failedObject,
      localFailureCount: localCount,
      totalFailureCount: state.totalFailures,
      feedbackAtFailure: round(state.value),
      abandonProbability: round(abandonProbability),
      abandonRoll: round(abandonRoll),
      abandoned,
      preAbandonEmotion,
      recoveries,
      attribution: options.attribution || "",
    });
    return { abandoned, abandonProbability, abandonRoll, recoveries };
  }

  function createExpectation(state, expectationKey, options = {}, configInput = {}) {
    const config = normalizeConfig(configInput);
    advanceTo(state, options.time ?? state.gameTime, config, options.context);
    state.expectations[expectationKey] = {
      createdAt: state.gameTime,
      strength: Math.max(0, Number(options.strength ?? 1)),
      expectedEvent: options.expectedEvent || "",
      metadata: options.metadata || {},
      status: "pending",
    };
    state.trace.push({
      type: "expectation_created",
      gameTime: round(state.gameTime),
      expectationKey,
      strength: round(state.expectations[expectationKey].strength),
      expectedEvent: state.expectations[expectationKey].expectedEvent,
      feedbackAtCreation: round(state.value),
      metadata: state.expectations[expectationKey].metadata,
    });
  }

  function resolveExpectation(state, expectationKey, fulfilled, options = {}, configInput = {}) {
    const config = normalizeConfig(configInput);
    advanceTo(state, options.time ?? state.gameTime, config, options.context);
    const expectation = state.expectations[expectationKey];
    if (!expectation || expectation.status !== "pending") return null;
    expectation.status = fulfilled ? "fulfilled" : "missed";
    expectation.resolvedAt = state.gameTime;
    let feedbackDelta = 0;
    if (fulfilled) {
      feedbackDelta = triggerEvent(state, "expectation:fulfilled", {
        time: state.gameTime,
        desireMultiplier: expectation.strength,
        metadata: { expectationKey, ...options.metadata },
      }, config);
    } else {
      const before = state.value;
      state.value = Math.max(0, state.value - config.expectationMissPenalty * expectation.strength);
      feedbackDelta = state.value - before;
      state.minValue = Math.min(state.minValue, state.value);
      state.contributionByEvent["expectation:missed"] = (state.contributionByEvent["expectation:missed"] || 0) + feedbackDelta;
      state.contributionByCategory.world = (state.contributionByCategory.world || 0) + feedbackDelta;
    }
    state.trace.push({
      type: "expectation_resolved",
      gameTime: round(state.gameTime),
      expectationKey,
      fulfilled,
      feedbackDelta: round(feedbackDelta),
      feedbackAfter: round(state.value),
      metadata: options.metadata || {},
    });
    return { fulfilled, feedbackDelta };
  }

  function resolveFailure(state, failedObject, options = {}, configInput = {}) {
    const config = normalizeConfig(configInput);
    advanceTo(state, options.time ?? state.gameTime, config, options.context);
    if (state.activeFailureObject !== failedObject) return false;
    state.trace.push({
      type: "failure_resolved",
      gameTime: round(state.gameTime),
      failedObject,
      resolvedFailureCount: state.activeFailureCount,
      feedbackAtResolution: round(state.value),
    });
    state.activeFailureObject = null;
    state.activeFailureCount = 0;
    return true;
  }

  function diagnostics(state, configInput = {}) {
    const config = normalizeConfig(configInput);
    return {
      version: state.version,
      gameTime: round(state.gameTime),
      value: round(state.value),
      emotion: emotionLabel(state, config),
      minValue: round(state.minValue),
      lowFeedbackSeconds: round(state.lowFeedbackSeconds),
      currentLowFeedbackSeconds: round(state.currentLowFeedbackSeconds),
      maxLowFeedbackStreak: round(state.maxLowFeedbackStreak),
      longestNoGainSeconds: round(Math.max(state.longestNoGainSeconds, state.gameTime - state.lastGainTime)),
      recentEventDiversity: recentEventDiversity(state),
      totalFailures: state.totalFailures,
      activeFailureObject: state.activeFailureObject,
      activeFailureCount: state.activeFailureCount,
      abandoned: state.abandoned,
      lastAbandonDecision: state.lastAbandonDecision ? {
        ...state.lastAbandonDecision,
        gameTime: round(state.lastAbandonDecision.gameTime),
        probability: round(state.lastAbandonDecision.probability),
        roll: round(state.lastAbandonDecision.roll),
      } : null,
      contributionByCategory: roundObject(state.contributionByCategory),
      contributionByEvent: roundObject(state.contributionByEvent),
      exhaustedEvents: Object.entries(state.eventRecords).filter(([, record]) => record.freshness <= 0).map(([key]) => key),
    };
  }

  function emotionLabel(state, configInput = {}) {
    const config = normalizeConfig(configInput);
    const ratio = state.maxValue ? state.value / state.maxValue : 0;
    const activeFailures = state.activeFailureCount || 0;
    const noGainSeconds = state.gameTime - state.lastGainTime;
    const diversity = recentEventDiversity(state);
    if (state.abandoned) return "已放弃";
    if (activeFailures >= 2 && (ratio < 0.5 || state.currentLowFeedbackSeconds >= 5)) return "疲惫且受挫";
    if (activeFailures >= 3) return "投入但受挫";
    if (state.currentLowFeedbackSeconds >= 10 || noGainSeconds >= 12 || (noGainSeconds >= 8 && diversity <= 1)) return "疲惫";
    if (state.value <= config.lowThreshold * 0.5) return "乏味";
    if (state.value <= config.lowThreshold) return "疲惫";
    if (ratio >= 0.75) return "兴奋";
    if (ratio >= 0.5) return "投入";
    return "平稳";
  }

  function accumulateElapsed(state, target, config) {
    const elapsed = Math.max(0, target - state.gameTime);
    if (state.value <= config.lowThreshold) {
      state.lowFeedbackSeconds += elapsed;
      state.currentLowFeedbackSeconds += elapsed;
      state.maxLowFeedbackStreak = Math.max(state.maxLowFeedbackStreak, state.currentLowFeedbackSeconds);
    } else {
      state.currentLowFeedbackSeconds = 0;
    }
    state.gameTime = target;
  }

  function recentEventDiversity(state, windowSeconds = 30) {
    const cutoff = state.gameTime - windowSeconds;
    return new Set(state.trace
      .filter((entry) => entry.type === "event" && entry.gameTime >= cutoff && entry.feedbackGain > 0)
      .map((entry) => entry.eventKey)).size;
  }

  function resolveBaseIntensity(eventKey, config) {
    if (Number.isFinite(config.baseIntensity[eventKey])) return config.baseIntensity[eventKey];
    const prefix = Object.keys(config.baseIntensity)
      .filter((key) => key.endsWith(":"))
      .sort((a, b) => b.length - a.length)
      .find((key) => eventKey.startsWith(key));
    return prefix ? config.baseIntensity[prefix] : 0;
  }

  function eventCategory(eventKey) {
    if (eventKey.startsWith("cast:") || eventKey.startsWith("kill:") || eventKey.startsWith("survive:") || eventKey.startsWith("verify:") || eventKey.startsWith("proof:")) return "combat";
    if (eventKey.startsWith("decision:") || eventKey.startsWith("discover:") || eventKey.startsWith("unlock:region") || eventKey.startsWith("expectation:")) return "world";
    return "progression";
  }

  function sigmoid(value) {
    return 1 / (1 + Math.exp(-value));
  }

  function seedHash(text) {
    let value = 2166136261;
    for (const char of String(text)) {
      value ^= char.charCodeAt(0);
      value = Math.imul(value, 16777619);
    }
    return value >>> 0;
  }

  function nextRandom(state) {
    let value = state.rngState || 1;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    state.rngState = value >>> 0;
    return state.rngState / 4294967296;
  }

  function round(value) {
    return Math.round((Number(value) || 0) * 1000) / 1000;
  }

  function roundObject(value) {
    return Object.fromEntries(Object.entries(value || {}).map(([key, amount]) => [key, round(amount)]));
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  return { DEFAULT_CONFIG, advanceTo, createExpectation, createState, diagnostics, emotionLabel, normalizeConfig, recordFailure, resolveExpectation, resolveFailure, triggerEvent };
})();

if (typeof window !== "undefined") window.GAME_FEEDBACK_COGNITION_MODEL = GAME_FEEDBACK_COGNITION_MODEL;
if (typeof module !== "undefined") module.exports = GAME_FEEDBACK_COGNITION_MODEL;
