const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseBattleInformation,
  parseAllPerceptionLevels,
  inspectBattleInformation,
} = require("./battle-information-parser");

function visibleEvent(id, time, type, subject, behavior, result, presentation = {}) {
  return {
    id,
    time,
    type,
    subject,
    behavior,
    result,
    presentation: {
      visible: true,
      hasSource: true,
      hasTarget: true,
      hasNumber: true,
      hasAnimation: true,
      ...presentation,
    },
    H: 0.91,
    emotionDelta: -0.73,
    diagnosis: { designerAnswer: "牧师必在后排" },
  };
}

const warrior = { id: "hero_warrior", name: "灰鸦战士", side: "left", role: "warrior" };
const ranger = { id: "hero_ranger", name: "林地游侠", side: "left", role: "ranger" };
const priestEnemy = { id: "right-3", name: "草药匪徒3", side: "right", role: "priest" };
const knightEnemy = { id: "right-1", name: "重甲盗匪1", side: "right", role: "knight" };
const rangedEnemy = { id: "right-4", name: "路匪弓手4", side: "right", role: "ranger" };

const fixedBattle = [
  visibleEvent("event:field:1", 0, "field", null, { name: "灼热地面" }, { kind: "field", name: "灼热地面" }),
  visibleEvent("event:damage:1", 1, "damage", rangedEnemy, { name: "穿云箭" }, { kind: "damage", amount: 28, target: ranger }),
  visibleEvent("event:damage:2", 2, "damage", knightEnemy, { name: "盾牌猛击" }, { kind: "damage", amount: 18, target: warrior }),
  visibleEvent("event:heal:1", 3, "heal", priestEnemy, { name: "草药包扎" }, { kind: "heal", amount: 42, target: knightEnemy }),
  visibleEvent("event:shield:1", 4, "shield", knightEnemy, { name: "临时护盾" }, { kind: "shield", amount: 35, target: priestEnemy }),
  visibleEvent("event:status:1", 5, "status", priestEnemy, { name: "加速" }, { kind: "status", amount: 1, target: priestEnemy }),
  visibleEvent("event:skill:1", 6, "skill", priestEnemy, { name: "前压冲锋" }, { kind: "skill", target: warrior }),
  visibleEvent("event:damage:3", 7, "damage", ranger, { name: "箭雨" }, { kind: "damage", amount: 66, target: rangedEnemy }),
  visibleEvent("event:heal:2", 8, "heal", warrior, { name: "战地包扎" }, { kind: "heal", amount: 20, target: warrior }),
  visibleEvent("event:death:1", 9, "death", rangedEnemy, { name: "穿云箭" }, { kind: "ally_death", target: ranger }),
  visibleEvent("event:death:2", 10, "death", warrior, { name: "斩击" }, { kind: "enemy_kill", target: rangedEnemy }),
  visibleEvent(
    "event:result:1",
    11,
    "combat_result",
    { id: "player_squad", name: "player squad", side: "left", role: "player_squad" },
    { name: "挑战关卡" },
    {
      kind: "combat_loss",
      survivors: { ally: 1, enemy: 2 },
      observedPower: 999,
      boundary: "designer_only",
      diagnosis: { dominantDamage: "physical" },
    },
  ),
  visibleEvent("event:loot:1", 12, "loot", warrior, { name: "领取战利品" }, { kind: "loot", itemName: "旧护符", rarity: "普通" }),
  visibleEvent("event:unlock:1", 13, "map_unlock", warrior, { name: "打开地图" }, { kind: "map_unlock", unlockedNodes: ["r1_hidden_9"] }),
  visibleEvent("event:internal:1", 14, "team_experiment_result", warrior, { name: "内部换人实验" }, { kind: "team_experiment_result", heroId: "hero_ranger" }),
  visibleEvent("event:summary:1", 15, "action_summary", warrior, { name: "内部动作汇总" }, { kind: "action_summary", components: [{ kind: "private_A", amount: 3 }] }),
  visibleEvent("event:hidden:1", 16, "damage", priestEnemy, { name: "隐藏攻击" }, { kind: "damage", amount: 999, target: warrior }, { visible: false }),
];

const archivedSessionPath = path.join(
  __dirname,
  "controlled_runs",
  "2026-07-17_enriched_two_chapter",
  "open_novice",
  "paired-alpha",
  "session.json",
);
const archivedFixturePath = path.join(
  __dirname,
  "fixtures",
  "battle-information-real-event-log.json",
);
let archivedAudit = null;
let archivedCalibration = null;
if (fs.existsSync(archivedFixturePath)) {
  const fixture = JSON.parse(fs.readFileSync(archivedFixturePath, "utf8"));
  archivedAudit = inspectBattleInformation(fixture.rawEventLog, { seed: "archive-audit" });
  assert.equal(archivedAudit.pass, true, JSON.stringify(archivedAudit, null, 2));
  assert(archivedAudit.source.rawEventCount >= 300);
}
if (fs.existsSync(archivedSessionPath)) {
  const archive = JSON.parse(fs.readFileSync(archivedSessionPath, "utf8"));
  const records = [
    ...(archive.chapter1?.history || []),
    ...(archive.chapter2?.history || []),
  ].filter((row) => Array.isArray(row.rawEventLog) && row.rawEventLog.length);
  if (records.length) {
    const challengeRecords = records.filter((row) => String(row.action || "").startsWith("challenge:"));
    const diagnostics = challengeRecords.flatMap((row) => (
      inspectBattleInformation(row.rawEventLog, { seed: "calibration" })
        .candidateDiagnostics
        .filter((candidate) => !candidate.anchor)
    ));
    archivedCalibration = Object.fromEntries(["low", "ordinary", "high"].map((level) => [
      level,
      diagnostics.reduce((sum, row) => sum + row.receptionProbability[level], 0) / diagnostics.length,
    ]));
    assert(archivedCalibration.low >= 0.2 && archivedCalibration.low <= 0.32);
    assert(archivedCalibration.ordinary >= 0.44 && archivedCalibration.ordinary <= 0.57);
    assert(archivedCalibration.high >= 0.69 && archivedCalibration.high <= 0.81);
  }
}

const parsed = parseAllPerceptionLevels(fixedBattle, { seed: "fixed-battle" });
assert.equal(parsed.low.perception.model, "independent_signal_threshold");
assert.equal(parsed.ordinary.perception.model, "independent_signal_threshold");
assert.equal(parsed.high.perception.model, "independent_signal_threshold");
assert(parsed.low.signals.length <= parsed.ordinary.signals.length);
assert(parsed.ordinary.signals.length <= parsed.high.signals.length);

const lowStatements = parsed.low.signals.map((row) => row.statement);
const ordinaryStatements = parsed.ordinary.signals.map((row) => row.statement);
const highStatements = parsed.high.signals.map((row) => row.statement);
assert(lowStatements.every((statement) => ordinaryStatements.includes(statement)));
assert(ordinaryStatements.every((statement) => highStatements.includes(statement)));
assert(parsed.low.signals.some((row) => row.type === "combat_outcome"));
for (const lowSignal of parsed.low.signals) {
  const ordinarySignal = parsed.ordinary.signals.find((row) => row.statement === lowSignal.statement);
  assert.equal(ordinarySignal?.id, lowSignal.id);
}
assert(!JSON.stringify(parsed).includes("availableVisibleSignalCount"));
assert(!JSON.stringify(parsed).includes("actualReceiveRate"));

const fixedAudit = inspectBattleInformation(fixedBattle, { seed: "fixed-battle" });
assert.equal(fixedAudit.pass, true, JSON.stringify(fixedAudit, null, 2));
assert(fixedAudit.coverage.every((row) => row.pass));
assert.equal(fixedAudit.excessInformation.pass, true);
assert.equal(fixedAudit.source.ignoredInternalEventCount, 2);
assert.equal(fixedAudit.perceptionScale.forcedQuota, false);
for (const diagnostic of fixedAudit.candidateDiagnostics) {
  assert(diagnostic.receptionProbability.low <= diagnostic.receptionProbability.ordinary);
  assert(diagnostic.receptionProbability.ordinary <= diagnostic.receptionProbability.high);
}

const publicOutput = JSON.stringify(parsed);
for (const forbidden of [
  "草药匪徒3",
  "重甲盗匪1",
  "路匪弓手4",
  "right-1",
  "right-3",
  "right-4",
  "priest",
  "knight",
  "后排",
  "diagnosis",
  "emotionDelta",
  "observedPower",
  "boundary",
  "team_experiment_result",
  "private_A",
  "999",
]) {
  assert(!publicOutput.includes(forbidden), `玩家输出泄漏了 ${forbidden}`);
}
assert(JSON.stringify(fixedAudit.candidateDiagnostics).includes("使用过治疗的敌方单位"));
assert(JSON.stringify(fixedAudit.candidateDiagnostics).includes("表现出远程攻击的敌方单位"));
assert(!publicOutput.includes("治疗职业"));
assert(!publicOutput.includes("远程小怪"));

const renamedBattle = structuredClone(fixedBattle);
for (const event of renamedBattle) {
  for (const ref of [event.subject, event.result?.target]) {
    if (ref?.side !== "right") continue;
    ref.id = `renamed:${ref.id}`;
    ref.name = `完全不同的敌人名:${ref.name}`;
    ref.role = "completely_different_internal_role";
  }
}
const renamedParsed = parseAllPerceptionLevels(renamedBattle, { seed: "fixed-battle" });
for (const level of ["low", "ordinary", "high"]) {
  assert.deepEqual(renamedParsed[level].signals, parsed[level].signals);
}

const oneHeal = [
  visibleEvent("repeat:1", 1, "heal", priestEnemy, { name: "草药包扎" }, { kind: "heal", amount: 20, target: knightEnemy }),
];
const repeatedHeal = Array.from({ length: 6 }, (_, index) => (
  visibleEvent(
    `repeat:${index + 1}`,
    index + 1,
    "heal",
    priestEnemy,
    { name: "草药包扎" },
    { kind: "heal", amount: 20, target: knightEnemy },
  )
));
const oneHealDiagnostic = inspectBattleInformation(oneHeal).candidateDiagnostics[0];
const repeatedHealDiagnostic = inspectBattleInformation(repeatedHeal).candidateDiagnostics[0];
assert(repeatedHealDiagnostic.features.repetition > oneHealDiagnostic.features.repetition);
assert(
  repeatedHealDiagnostic.features.effectiveOpportunities
  > oneHealDiagnostic.features.effectiveOpportunities,
);
assert.equal(
  repeatedHealDiagnostic.sharedDetectionValue,
  oneHealDiagnostic.sharedDetectionValue,
);
assert(oneHealDiagnostic.receptionProbability.low < 0.2);
assert(oneHealDiagnostic.receptionProbability.ordinary < 0.5);
assert(oneHealDiagnostic.receptionProbability.high > 0.4);
for (const level of ["low", "ordinary", "high"]) {
  assert(
    repeatedHealDiagnostic.receptionProbability[level]
    > oneHealDiagnostic.receptionProbability[level],
  );
}

function damageBurst(times) {
  return times.map((time, index) => visibleEvent(
    `burst:${index + 1}`,
    time,
    "damage",
    rangedEnemy,
    { name: "穿云箭" },
    { kind: "damage", amount: 20, target: ranger },
    {
      attentionZone: "player_backline",
      renderEvidence: { animationSeconds: 0.5, moving: true, fontPx: 16, colorToken: "default" },
    },
  ));
}
const spacedDamage = inspectBattleInformation(damageBurst([0, 1, 2, 3, 4])).candidateDiagnostics[0];
const crowdedDamage = inspectBattleInformation(damageBurst([0, 0, 0, 0, 0])).candidateDiagnostics[0];
assert(spacedDamage.features.attentionAvailability > crowdedDamage.features.attentionAvailability);
assert(spacedDamage.strength > crowdedDamage.strength);

const survivalFocused = inspectBattleInformation(fixedBattle, { goalFocus: "survival" });
const lootFocused = inspectBattleInformation(fixedBattle, { goalFocus: "loot" });
const survivalThreat = survivalFocused.candidateDiagnostics.find((row) => row.type.startsWith("incoming_damage_"));
const lootThreat = lootFocused.candidateDiagnostics.find((row) => row.type === survivalThreat.type);
assert(survivalThreat.features.goalRelevance > lootThreat.features.goalRelevance);
assert(survivalThreat.strength > lootThreat.strength);

const quietWeakSignal = [
  visibleEvent(
    "quiet:1",
    0,
    "skill",
    warrior,
    { name: "轻微姿态调整" },
    { kind: "skill", target: warrior },
    { hasNumber: false, hasAnimation: false, hasTarget: false },
  ),
];
const quietHighCounts = Array.from({ length: 200 }, (_, index) => (
  parseBattleInformation(quietWeakSignal, {
    perceptionLevel: "high",
    seed: `quiet:${index}`,
  }).signals.length
));
assert(quietHighCounts.some((count) => count === 0));
assert(quietHighCounts.some((count) => count === 1));

const loudBlockingBattle = fixedBattle
  .filter((event) => event.presentation?.visible !== false)
  .map((event) => ({
    ...structuredClone(event),
    presentation: { ...event.presentation, blocking: true },
  }));
const loudLow = parseBattleInformation(loudBlockingBattle, {
  perceptionLevel: "low",
  seed: "loud",
});
const loudAudit = inspectBattleInformation(loudBlockingBattle, { seed: "loud" });
assert.equal(loudLow.signals.length, loudAudit.candidateSignalCount);
assert.equal(loudAudit.perceptionScale.episodeRates.low, 1);

console.log(JSON.stringify({
  fixedBattle: {
    eventCount: fixedBattle.length,
    candidateSignalCount: fixedAudit.candidateSignalCount,
    received: {
      low: parsed.low.signals.length,
      ordinary: parsed.ordinary.signals.length,
      high: parsed.high.signals.length,
    },
    episodeRates: fixedAudit.perceptionScale.episodeRates,
    coverage: fixedAudit.coverage,
    excessInformation: fixedAudit.excessInformation,
  },
  edgeCases: {
    repetitionReception: {
      one: oneHealDiagnostic.receptionProbability,
      repeatedSixTimes: repeatedHealDiagnostic.receptionProbability,
      effectiveOpportunities: {
        one: oneHealDiagnostic.features.effectiveOpportunities,
        repeatedSixTimes: repeatedHealDiagnostic.features.effectiveOpportunities,
      },
    },
    attentionAvailability: {
      spaced: spacedDamage.features.attentionAvailability,
      crowded: crowdedDamage.features.attentionAvailability,
    },
    quietHighCanReceiveNothing: quietHighCounts.some((count) => count === 0),
    loudLowCanReceiveEverything: loudAudit.perceptionScale.episodeRates.low === 1,
    enemyIdentityRenameInvariant: true,
  },
  archivedBattle: archivedAudit && {
    source: archivedAudit.source,
    candidateSignalCount: archivedAudit.candidateSignalCount,
    received: Object.fromEntries(
      Object.entries(archivedAudit.parsedByLevel).map(([level, result]) => [
        level,
        result.signals.length,
      ]),
    ),
    longRunMeanProbability: archivedCalibration,
    coverage: archivedAudit.coverage,
    excessInformation: archivedAudit.excessInformation,
  },
}, null, 2));
