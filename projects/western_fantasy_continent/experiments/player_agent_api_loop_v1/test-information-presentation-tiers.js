const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const COMBAT_SIGNALS = require("../../game_data/combat-signals");
const MAP_EVENT_ADAPTER = require("../../game_data/map-cognition-v1-event-adapter");
const CURRENT_COGNITION_RUNTIME = require("../../game_data/player-cognition-v3-event-runtime");
const {
  INFORMATION_PRESENTATION_CONTRACT,
  inspectBattleInformation,
  parseAllPerceptionLevels,
} = require("./battle-information-parser");

const EXPECTED_STRENGTHS = Object.freeze({
  blocking: 1,
  highlight: 0.9,
  prominent: 0.8,
  standard_high: 0.7,
  standard: 0.6,
  standard_low: 0.5,
  ambient: 0.4,
  background: 0.25,
});
const ORDERED_TIERS = Object.freeze([
  "background",
  "ambient",
  "standard_low",
  "standard",
  "standard_high",
  "prominent",
  "highlight",
  "blocking",
]);
const PROFILE_BIASES = Object.freeze({ low: -1.05, ordinary: 0, high: 1.05 });
const TARGET_REAL_BATTLE_MEANS = Object.freeze({ low: 0.25, ordinary: 0.5, high: 0.75 });

assert.equal(INFORMATION_PRESENTATION_CONTRACT.schema, "information_presentation_tier_v2");
assert.deepEqual(
  Object.fromEntries(Object.entries(INFORMATION_PRESENTATION_CONTRACT.tiers)
    .map(([tier, row]) => [tier, row.perceptionStrength])),
  EXPECTED_STRENGTHS,
);
assert.equal(INFORMATION_PRESENTATION_CONTRACT.tiers.blocking.forcedReception, true);
for (const tier of ORDERED_TIERS.filter((tier) => tier !== "blocking")) {
  assert.equal(INFORMATION_PRESENTATION_CONTRACT.tiers[tier].forcedReception, false);
}

const canonicalByTier = Object.fromEntries(
  Object.keys(EXPECTED_STRENGTHS).map((tier) => {
    const events = [canonicalHeal(`canonical:${tier}`, 0, tier)];
    return [tier, {
      diagnostic: inspectBattleInformation(events, { seed: "tier-comparison" }).candidateDiagnostics[0],
      parsed: parseAllPerceptionLevels(events, { seed: "tier-comparison" }),
    }];
  }),
);

for (const tier of Object.keys(EXPECTED_STRENGTHS)) {
  assert.equal(canonicalByTier[tier].diagnostic.features.informationTier, tier);
  assert.equal(
    canonicalByTier[tier].diagnostic.features.presentationStrength,
    EXPECTED_STRENGTHS[tier],
  );
}
for (const level of Object.keys(PROFILE_BIASES)) {
  for (let index = 1; index < ORDERED_TIERS.length; index += 1) {
    const lower = canonicalByTier[ORDERED_TIERS[index - 1]]
      .diagnostic.receptionProbability[level];
    const higher = canonicalByTier[ORDERED_TIERS[index]]
      .diagnostic.receptionProbability[level];
    assert(higher > lower);
    assert(higher - lower <= 0.06);
  }
  assert.equal(canonicalByTier.blocking.parsed[level].signals.length, 1);
}

const repeatedStandard = inspectBattleInformation(
  Array.from({ length: 6 }, (_, index) => canonicalHeal(`repeat:${index}`, index, "standard")),
).candidateDiagnostics[0];
for (const level of Object.keys(PROFILE_BIASES)) {
  assert(
    repeatedStandard.receptionProbability[level]
      > canonicalByTier.standard.diagnostic.receptionProbability[level],
  );
}
assert(repeatedStandard.receptionProbability.ordinary >= 0.7);
assert(repeatedStandard.receptionProbability.high >= 0.94);

const spacedStandard = inspectBattleInformation(
  Array.from({ length: 5 }, (_, index) => canonicalDamage(`spaced:${index}`, index, "standard")),
).candidateDiagnostics[0];
const crowdedStandard = inspectBattleInformation(
  Array.from({ length: 5 }, (_, index) => canonicalDamage(`crowded:${index}`, 0, "standard")),
).candidateDiagnostics[0];
assert(spacedStandard.features.attentionAvailability > crowdedStandard.features.attentionAvailability);
assert(spacedStandard.strength > crowdedStandard.strength);
for (const level of Object.keys(PROFILE_BIASES)) {
  assert(
    spacedStandard.receptionProbability[level]
      > crowdedStandard.receptionProbability[level],
  );
}

const emittedTiers = {
  background: COMBAT_SIGNALS.describePresentation(combatSignal("movement", ["hidden"])).informationTier,
  ambient: COMBAT_SIGNALS.describePresentation(combatSignal("skill")).informationTier,
  standard_low: COMBAT_SIGNALS.describePresentation(combatSignal("damage")).informationTier,
  standard: COMBAT_SIGNALS.describePresentation(combatSignal("heal")).informationTier,
  standard_high: COMBAT_SIGNALS.describePresentation(combatSignal("status")).informationTier,
  prominent: COMBAT_SIGNALS.describePresentation(combatSignal("death")).informationTier,
  highlight: COMBAT_SIGNALS.describePresentation(combatSignal("skill", ["ultimate"])).informationTier,
  blocking: COMBAT_SIGNALS.describePresentation(combatSignal("skill", ["blocking"])).informationTier,
};
assert.deepEqual(emittedTiers, {
  background: "background",
  ambient: "ambient",
  standard_low: "standard_low",
  standard: "standard",
  standard_high: "standard_high",
  prominent: "prominent",
  highlight: "highlight",
  blocking: "blocking",
});

const rewardRows = MAP_EVENT_ADAPTER.buildMapEventLog("challenge:tier_contract", {
  step: 1,
  node: "tier_contract",
  outcome: "win",
  duration: 1,
  firstClear: true,
  survivors: { player: 4, enemy: 0 },
  lootOpportunity: true,
  loot: [
    { id: "common", name: "普通物品", rarity: "common" },
    { id: "rare", name: "稀有物品", rarity: "rare" },
    { id: "epic", name: "史诗物品", rarity: "epic" },
    { id: "mythic", name: "神话物品", rarity: "mythic" },
  ],
  characterUnlock: { id: "test", heroId: "hero_test", name: "测试角色" },
}, { analysis: { combatSignals: [] } });
assert.equal(rewardRows.find((row) => row.type === "combat_result").presentation.informationTier, "blocking");
assert.equal(rewardRows.find((row) => row.type === "character_unlock").presentation.informationTier, "blocking");
assert.deepEqual(
  rewardRows.filter((row) => row.type === "loot").map((row) => row.presentation.informationTier),
  ["ambient", "standard_high", "prominent", "blocking"],
);

const strictRuntimeState = CURRENT_COGNITION_RUNTIME.createState("tier-runtime", {
  receiveThreshold: 0.99,
});
const runtimeReception = Object.fromEntries(Object.keys(EXPECTED_STRENGTHS).map((tier) => {
  const received = CURRENT_COGNITION_RUNTIME.receiveSignal(
    canonicalHeal(`runtime:${tier}`, 0, tier),
    strictRuntimeState,
  );
  assert.equal(received.components.informationTier, tier);
  assert.equal(received.components.presentationStrength, EXPECTED_STRENGTHS[tier]);
  return [tier, received];
}));
assert.equal(runtimeReception.ambient.accepted, false);
assert.equal(runtimeReception.standard.accepted, false);
assert.equal(runtimeReception.highlight.accepted, false);
assert.equal(runtimeReception.blocking.accepted, true);
assert.equal(runtimeReception.blocking.reason, "forced_presentation_tier");

const fixture = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures", "battle-information-real-event-log.json"),
  "utf8",
));
const realDiagnostics = inspectBattleInformation(fixture.rawEventLog, {
  seed: "presentation-tier-calibration",
}).candidateDiagnostics.filter((row) => !row.anchor);
const selectedRealMeans = meanProbabilities(realDiagnostics, EXPECTED_STRENGTHS);
assert(selectedRealMeans.low >= 0.23 && selectedRealMeans.low <= 0.27);
assert(selectedRealMeans.ordinary >= 0.47 && selectedRealMeans.ordinary <= 0.51);
assert(selectedRealMeans.high >= 0.73 && selectedRealMeans.high <= 0.77);

const candidateSweep = [
  {
    id: "optimized_irregular",
    blocking: 1,
    highlight: 0.9067,
    prominent: 0.8133,
    standard_high: 0.72,
    standard: 0.6267,
    standard_low: 0.5333,
    ambient: 0.44,
    background: 0.25,
  },
  { id: "frozen_v2", ...EXPECTED_STRENGTHS },
  {
    id: "low_reception",
    blocking: 1,
    highlight: 0.88,
    prominent: 0.76,
    standard_high: 0.64,
    standard: 0.5,
    standard_low: 0.34,
    ambient: 0.25,
    background: 0.15,
  },
  {
    id: "high_reception",
    blocking: 1,
    highlight: 0.98,
    prominent: 0.92,
    standard_high: 0.84,
    standard: 0.72,
    standard_low: 0.55,
    ambient: 0.5,
    background: 0.35,
  },
  {
    id: "legacy_anchor_expansion",
    blocking: 1,
    highlight: 0.95,
    prominent: 0.85,
    standard_high: 0.75,
    standard: 0.6,
    standard_low: 0.4,
    ambient: 0.25,
    background: 0.15,
  },
].map((candidate) => {
  const means = meanProbabilities(realDiagnostics, candidate);
  const targetError = sum(Object.keys(TARGET_REAL_BATTLE_MEANS).map(
    (level) => (means[level] - TARGET_REAL_BATTLE_MEANS[level]) ** 2,
  ));
  return { ...candidate, means, targetError: round(targetError, 6) };
}).sort((a, b) => a.targetError - b.targetError);
assert.equal(candidateSweep.length, 5);
const frozenCandidate = candidateSweep.find((row) => row.id === "frozen_v2");
assert(frozenCandidate.targetError <= 0.00035);

console.log(JSON.stringify({
  result: "PASS",
  contract: INFORMATION_PRESENTATION_CONTRACT,
  sameSignalByTier: Object.fromEntries(Object.entries(canonicalByTier).map(([tier, row]) => [
    tier,
    {
      strength: row.diagnostic.strength,
      receptionProbability: row.diagnostic.receptionProbability,
      forcedReception: tier === "blocking",
    },
  ])),
  repetition: {
    oneStandard: canonicalByTier.standard.diagnostic.receptionProbability,
    sixStandard: repeatedStandard.receptionProbability,
  },
  attentionCompetition: {
    spacedAvailability: spacedStandard.features.attentionAvailability,
    crowdedAvailability: crowdedStandard.features.attentionAvailability,
    spacedProbability: spacedStandard.receptionProbability,
    crowdedProbability: crowdedStandard.receptionProbability,
  },
  realBattleNonAnchorMeans: selectedRealMeans,
  candidateSweep,
  emittedTiers,
  rewardTiers: rewardRows
    .filter((row) => ["combat_result", "loot", "character_unlock"].includes(row.type))
    .map((row) => ({
      type: row.type,
      rarity: row.result?.rarity || null,
      tier: row.presentation.informationTier,
    })),
  currentRuntime: Object.fromEntries(Object.entries(runtimeReception).map(([tier, row]) => [
    tier,
    {
      H: row.H,
      accepted: row.accepted,
      reason: row.reason,
      presentationStrength: row.components.presentationStrength,
    },
  ])),
}, null, 2));

function canonicalHeal(id, time, tier) {
  return visibleEvent(id, time, "heal", 20, tier);
}

function canonicalDamage(id, time, tier) {
  return visibleEvent(id, time, "damage", 20, tier);
}

function visibleEvent(id, time, type, amount, tier) {
  return {
    id,
    time,
    type,
    subject: { id: "source", name: "可见来源", side: "right" },
    behavior: { kind: type, key: `${type}:visible`, name: "可见表现" },
    result: {
      kind: type,
      amount,
      target: { id: "target", name: "可见目标", side: "left" },
    },
    presentation: {
      visible: true,
      hasSource: true,
      hasTarget: true,
      hasNumber: true,
      hasAnimation: true,
      informationTier: tier,
      attentionZone: "target",
      renderEvidence: { animationSeconds: 0.9 },
    },
  };
}

function combatSignal(kind, tags = []) {
  return {
    kind,
    tags,
    amount: kind === "damage" ? 10 : 0,
    source: { id: "source" },
    target: { id: "target" },
  };
}

function meanProbabilities(diagnostics, strengths) {
  return Object.fromEntries(Object.entries(PROFILE_BIASES).map(([level, bias]) => {
    const values = diagnostics.map((row) => {
      const features = row.features;
      const strength = clamp(
        features.salience * 0.32
        + strengths[features.informationTier] * 0.18
        + features.magnitude * 0.18
        + features.goalRelevance * 0.14
        + features.attentionAvailability * 0.18,
        0,
        1,
      );
      const z = (strength - 0.84) / 0.16 + bias;
      const singleOpportunity = 1 / (1 + Math.exp(-z));
      return 1 - Math.pow(
        1 - singleOpportunity,
        clamp(features.effectiveOpportunities, 1, 5),
      );
    });
    return [level, round(sum(values) / values.length)];
  }));
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}
