const MODEL = require("./player-cognition-v5-sandbox");

const BASE_GAME = {
  title: "AI vertex combat",
  enemyCount: 4,
  enemyHp: 100,
  damagePerHit: 20,
  attackInterval: 1,
  moveSeconds: 2,
  durationSeconds: null,
  burstEvery: 0,
  burstMultiplier: 1,
  decisionSteps: [],
  verification: null,
  signal: {
    salience: 0.75,
    perceptual: 0.8,
    causal: 0.75,
    goal: 0.8,
    repetitions: 1,
  },
  process: {
    deadRepetition: 0.15,
    incomprehension: 0.1,
    progressReadability: 0.75,
  },
  progression: 1,
  progressionFreshness: 1,
  otherResult: 0,
  baseline: null,
  agencyBefore: {
    desire: 0.8,
    gap: 0.6,
    clarity: 0.6,
    path: 0.5,
    causal: 0.5,
    improvement: 0.25,
    cost: 1,
  },
  agencyAfter: {
    desire: 0.8,
    gap: 0.5,
    clarity: 0.7,
    path: 0.65,
    causal: 0.65,
    improvement: 0.3,
    cost: 1,
  },
  decisionContext: null,
};

function simulateVertexGame(id, patch = {}, options = {}) {
  const facts = deepMerge(BASE_GAME, patch);
  const random = seededRandom(options.seed || id);
  const jitter = Number(options.jitter ?? 0.02);
  const damageValues = [];
  const timeline = [];
  let time = facts.moveSeconds;
  timeline.push({ time: round(time), type: "contact", enemyCount: facts.enemyCount });

  if (Number.isFinite(facts.durationSeconds)) {
    const endTime = time + Math.max(0, facts.durationSeconds);
    let enemy = 0;
    let hp = facts.enemyHp;
    let localHits = 0;
    while (time + facts.attackInterval <= endTime + 1e-9 && damageValues.length < 10000) {
      localHits += 1;
      const amount = nextDamage(facts, damageValues.length + 1, random, jitter);
      hp -= amount;
      time += facts.attackInterval;
      damageValues.push(amount);
      timeline.push({ time: round(time), type: "damage", enemy, amount: round(amount), hpAfter: round(Math.max(0, hp)) });
      if (hp <= 0) {
        timeline.push({ time: round(time), type: "kill", enemy, hits: localHits });
        enemy = (enemy + 1) % Math.max(1, facts.enemyCount);
        hp = facts.enemyHp;
        localHits = 0;
      }
    }
    if (time < endTime) {
      time = endTime;
      timeline.push({ time: round(time), type: "interval_end" });
    }
  } else for (let enemy = 0; enemy < facts.enemyCount; enemy += 1) {
    let hp = facts.enemyHp;
    let localHits = 0;
    while (hp > 0 && localHits < 10000) {
      localHits += 1;
      const hitIndex = damageValues.length + 1;
      const amount = nextDamage(facts, hitIndex, random, jitter);
      hp -= amount;
      time += facts.attackInterval;
      damageValues.push(amount);
      timeline.push({ time: round(time), type: "damage", enemy, amount: round(amount), hpAfter: round(Math.max(0, hp)) });
    }
    timeline.push({ time: round(time), type: "kill", enemy, hits: localHits });
  }

  const sortedDamage = [...damageValues].sort((a, b) => a - b);
  const attackSeconds = Math.max(0.001, time - facts.moveSeconds);
  const performance = {
    d50: percentile(sortedDamage, 0.5),
    d90: percentile(sortedDamage, 0.9),
    frequency: round(damageValues.length / attackSeconds),
    impact: round(average(damageValues.map((amount) => amount / Math.max(1, facts.enemyHp)))),
  };
  const input = {
    id,
    title: facts.title,
    wSeconds: Number.isFinite(facts.wSeconds) ? facts.wSeconds : round(time),
    decisionSteps: [...facts.decisionSteps],
    verify: facts.verification ? { ...facts.verification } : null,
    signal: { ...facts.signal },
    process: { ...facts.process },
    progression: facts.progression,
    progressionFreshness: facts.progressionFreshness,
    otherResult: facts.otherResult,
    performance,
    baseline: facts.baseline ? { ...facts.baseline } : null,
    agencyBefore: { ...facts.agencyBefore },
    agencyAfter: { ...facts.agencyAfter },
    decisionContext: facts.decisionContext ? structuredClone(facts.decisionContext) : null,
  };
  const output = MODEL.simulateScenario(input, options.modelConfig || {});
  return { id, facts, input, output, timeline };
}

function nextDamage(facts, hitIndex, random, jitter) {
  const burst = facts.burstEvery > 0 && hitIndex % facts.burstEvery === 0;
  const noise = 1 + (random() * 2 - 1) * jitter;
  return Math.max(0.001, facts.damagePerHit * (burst ? facts.burstMultiplier : 1) * noise);
}

function deepMerge(base, patch) {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(patch || {})) {
    if (value && typeof value === "object" && !Array.isArray(value) && result[key] && typeof result[key] === "object" && !Array.isArray(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else {
      result[key] = structuredClone(value);
    }
  }
  return result;
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (const char of String(seedText)) {
    seed ^= char.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function percentile(values, ratio) {
  if (!values.length) return 0;
  return round(values[Math.max(0, Math.min(values.length - 1, Math.ceil(values.length * ratio) - 1))]);
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 3) {
  return Number.isFinite(Number(value)) ? Number(Number(value).toFixed(digits)) : 0;
}

module.exports = { BASE_GAME, deepMerge, simulateVertexGame };
