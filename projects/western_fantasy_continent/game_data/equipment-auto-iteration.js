const fs = require("fs");
const path = require("path");
const {
  AFFIXES,
  AFFIX_LEVEL_VALUES,
  ARCHETYPES,
  RARITIES,
  SCORE_BUCKETS,
  SLOTS,
  SLOT_BASES,
  SLOT_LABELS,
} = require("./equipment-affix-registry");

const OUT_DIR = path.join(__dirname, "../design/equipment_auto_iteration");
const DROP_MILESTONES = [10, 20, 50, 100, 200];
const ITEMS_PER_RUN = 5;

const VARIANTS = [
  {
    id: "v1_baseline",
    label: "v1 基线",
    note: "直接使用当前部位池和稀有度权重。",
    rule: {},
  },
  {
    id: "v2_faster_formation",
    label: "v2 更快成型",
    note: "提高优质/稀有出现率，并略微提高流派词条在关键部位的权重。",
    rule: {
      rarityWeights: { rough: 26, common: 30, fine: 25, rare: 14, epic: 5 },
      archetypeAffixWeight: 1.22,
      requiredAffixWeight: 1.18,
    },
  },
  {
    id: "v3_slot_balance",
    label: "v3 部位价值平衡",
    note: "削弱挂饰万能性，增强胸/腿/左手的防御与功能价值。",
    rule: {
      trinketAffixWeight: 0.72,
      defensiveSlotWeight: 1.2,
      supportSlotWeight: 1.12,
      rarityWeights: { rough: 28, common: 30, fine: 24, rare: 13, epic: 5 },
      requiredAffixWeight: 1.12,
    },
  },
  {
    id: "v4_extreme_guard",
    label: "v4 极端风险收束",
    note: "保留 v3 的部位平衡，并降低高风险乘区词条同件/同套叠加概率。",
    rule: {
      trinketAffixWeight: 0.68,
      defensiveSlotWeight: 1.18,
      supportSlotWeight: 1.1,
      riskyAffixWeight: 0.72,
      duplicateBucketPenalty: 0.72,
      rarityWeights: { rough: 28, common: 31, fine: 24, rare: 13, epic: 4 },
      requiredAffixWeight: 1.1,
    },
  },
  {
    id: "v5_best_so_far_probe",
    label: "v5 固定底座回补",
    note: "以 v4 为基础，提高装备固定属性底座，降低对完美关键词条的依赖，观察能否改善最优配装和随机穿搭差距。",
    rule: {
      trinketAffixWeight: 0.7,
      defensiveSlotWeight: 1.14,
      supportSlotWeight: 1.08,
      riskyAffixWeight: 0.76,
      duplicateBucketPenalty: 0.74,
      rarityWeights: { rough: 25, common: 31, fine: 26, rare: 14, epic: 4 },
      baseStatGlobalMult: 1.22,
      archetypeAffixWeight: 1.04,
      requiredAffixWeight: 1.08,
    },
  },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results = VARIANTS.map((variant, index) => evaluateVariant(variant, 90210 + index * 101));
  const ranked = [...results].sort((a, b) => b.overallScore - a.overallScore);
  const output = {
    generatedAt: new Date().toISOString(),
    constraints: [
      "Only equipment rules are varied.",
      "No role base stats, skills, combat engine, or waterline teams are modified.",
      "This first pass is static loot/equip evaluation; combat waterline hookup is the next slice.",
    ],
    dropMilestones: DROP_MILESTONES,
    variants: results,
    best: ranked[0],
  };

  fs.writeFileSync(path.join(OUT_DIR, "equipment-auto-iteration-results.json"), JSON.stringify(output, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "equipment-auto-iteration-report.md"), renderReport(output));
  console.log(renderConsoleSummary(output));
}

function evaluateVariant(variant, seed) {
  const rng = mulberry32(seed);
  const archetypeResults = Object.entries(ARCHETYPES).map(([id, archetype]) => evaluateArchetype(variant, id, archetype, rng));
  const aggregate = aggregateVariant(archetypeResults);
  return {
    id: variant.id,
    label: variant.label,
    note: variant.note,
    rule: variant.rule,
    ...aggregate,
    archetypes: archetypeResults,
  };
}

function evaluateArchetype(variant, archetypeId, archetype, rng) {
  const inventory = [];
  const milestones = [];
  let bestAtPrevious = 0;

  for (let totalDrops = 1; totalDrops <= Math.max(...DROP_MILESTONES); totalDrops += 1) {
    inventory.push(generateItem(variant, archetype, rng, totalDrops));
    if (DROP_MILESTONES.includes(totalDrops)) {
      const best = autoEquipBest(inventory, archetype);
      const randomBuilds = sampleRandomBuilds(inventory, archetype, rng, 80);
      const diversity = scoreDiversity(best.score, randomBuilds);
      const fantasy = scoreFantasy(best, archetype);
      const extreme = scoreExtreme(best, archetype);
      const formation = scoreFormation(best.score, bestAtPrevious, totalDrops, archetype);
      bestAtPrevious = best.score;
      milestones.push({
        drops: totalDrops,
        bestScore: round(best.score),
        bestItems: summarizeBuild(best),
        diversity,
        fantasy,
        extreme,
        formation,
        missingRequired: missingRequired(best, archetype),
        bestBuild: best.items,
      });
    }
  }

  const final = milestones[milestones.length - 1];
  const firstPlayable = milestones.find((m) => m.formation.playable) || null;
  const firstBuild = milestones.find((m) => m.formation.initialBuild) || null;
  return {
    id: archetypeId,
    label: archetype.label,
    milestones,
    summary: {
      finalScore: final.bestScore,
      finalDiversity: final.diversity.score,
      finalFantasy: final.fantasy.score,
      finalExtremeRisk: final.extreme.risk,
      firstPlayableDrops: firstPlayable?.drops || null,
      firstBuildDrops: firstBuild?.drops || null,
      finalMissingRequired: final.missingRequired,
    },
  };
}

function generateItem(variant, archetype, rng, dropIndex) {
  const slot = weightedPick(
    SLOTS.map((id) => ({ id, weight: slotDropWeight(id, variant.rule) })),
    rng,
  );
  const rarity = rollRarity(variant.rule, rng, dropIndex);
  const base = pick(SLOT_BASES[slot], rng);
  const affixes = [];
  const used = new Set();

  for (let i = 0; i < rarity.affixCount; i += 1) {
    const pool = AFFIXES.filter((affix) => {
      if (used.has(affix.id)) return false;
      if (!affix.slots.includes(slot)) return false;
      if (affix.rarityFloor > rarity.maxLevel) return false;
      return true;
    });
    if (!pool.length) break;
    const affix = weightedPick(pool.map((item) => ({ id: item.id, weight: affixWeight(item, slot, archetype, variant.rule, affixes) })), rng);
    const full = AFFIXES.find((item) => item.id === affix);
    const level = rollAffixLevel(rarity, rng);
    used.add(full.id);
    affixes.push({
      id: full.id,
      label: full.label,
      tier: full.tier,
      level,
      value: AFFIX_LEVEL_VALUES[level] || 1,
      budget: full.budget,
      flags: full.flags,
    });
  }

  return {
    id: `${variant.id}_${dropIndex}_${slot}`,
    slot,
    slotLabel: SLOT_LABELS[slot],
    type: base.id,
    typeLabel: base.label,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    baseStats: scaleBaseStats(base.stats, rarity.baseMult * (variant.rule.baseStatGlobalMult || 1)),
    affixes,
  };
}

function rollRarity(rule, rng, dropIndex) {
  const stageBonus = dropIndex > 120 ? 1.2 : dropIndex > 50 ? 1.1 : 1;
  const weights = RARITIES.map((rarity) => {
    const override = rule.rarityWeights?.[rarity.id] ?? rarity.weight;
    const lateWeight = ["rare", "epic"].includes(rarity.id) ? override * stageBonus : override;
    return { id: rarity.id, weight: lateWeight };
  });
  const id = weightedPick(weights, rng);
  return RARITIES.find((rarity) => rarity.id === id);
}

function rollAffixLevel(rarity, rng) {
  const max = rarity.maxLevel;
  const roll = rng();
  if (max <= 1) return 1;
  if (roll > 0.93 && max >= 5) return 5;
  if (roll > 0.82 && max >= 4) return 4;
  if (roll > 0.58 && max >= 3) return 3;
  if (roll > 0.28 && max >= 2) return 2;
  return 1;
}

function affixWeight(affix, slot, archetype, rule, existingAffixes) {
  let weight = 1;
  const desired = archetype.desired[affix.id] || 0;
  if (desired) weight *= 1 + desired * 0.55;
  if (archetype.required.includes(affix.id)) weight *= rule.requiredAffixWeight || 1;
  if (affix.tier === "archetype") weight *= rule.archetypeAffixWeight || 1;
  if (slot === "trinket") weight *= rule.trinketAffixWeight || 1;
  if (["chest", "legs"].includes(slot) && (affix.budget.survival || 0) > 0.4) weight *= rule.defensiveSlotWeight || 1;
  if (["leftHand", "head"].includes(slot) && (affix.budget.mechanic || 0) > 0.5) weight *= rule.supportSlotWeight || 1;
  if (affix.flags.some((flag) => ["multiplicative", "dotRisk", "sustainRisk", "executeRisk", "controlRisk"].includes(flag))) {
    weight *= rule.riskyAffixWeight || 1;
  }
  if (rule.duplicateBucketPenalty && existingAffixes.some((item) => sharesRiskFlag(item, affix))) {
    weight *= rule.duplicateBucketPenalty;
  }
  return weight;
}

function sharesRiskFlag(a, b) {
  return (a.flags || []).some((flag) => (b.flags || []).includes(flag) && flag !== "multiplicative");
}

function slotDropWeight(slot, rule) {
  let weight = 1;
  if (slot === "trinket") weight *= rule.trinketDropWeight || 1;
  if (["chest", "legs", "leftHand"].includes(slot)) weight *= rule.defensiveSlotDropWeight || 1;
  return weight;
}

function autoEquipBest(inventory, archetype) {
  const bySlot = {};
  for (const slot of SLOTS) {
    bySlot[slot] = inventory.filter((item) => item.slot === slot).sort((a, b) => scoreItem(b, archetype) - scoreItem(a, archetype));
  }
  const build = {};
  for (const slot of SLOTS) {
    if (slot === "twoHand") continue;
    if (bySlot[slot][0]) build[slot] = bySlot[slot][0];
  }
  const twoHand = bySlot.twoHand[0];
  const oneHandScore = (build.rightHand ? scoreItem(build.rightHand, archetype) : 0) + (build.leftHand ? scoreItem(build.leftHand, archetype) : 0);
  if (twoHand && scoreItem(twoHand, archetype) > oneHandScore * 0.9) {
    delete build.rightHand;
    delete build.leftHand;
    build.twoHand = twoHand;
  }
  return scoreBuild(build, archetype);
}

function sampleRandomBuilds(inventory, archetype, rng, count) {
  const bySlot = Object.fromEntries(SLOTS.map((slot) => [slot, inventory.filter((item) => item.slot === slot)]));
  const scores = [];
  for (let i = 0; i < count; i += 1) {
    const build = {};
    for (const slot of SLOTS) {
      if (slot === "twoHand") continue;
      if (bySlot[slot].length) build[slot] = pick(bySlot[slot], rng);
    }
    if (bySlot.twoHand.length && rng() > 0.72) {
      build.twoHand = pick(bySlot.twoHand, rng);
      delete build.leftHand;
      delete build.rightHand;
    }
    scores.push(scoreBuild(build, archetype).score);
  }
  return scores;
}

function scoreItem(item, archetype) {
  const baseScore = Object.entries(item.baseStats).reduce((sum, [id, value]) => sum + (archetype.desired[id] || 0.08) * normalizeValue(id, value), 0);
  const affixScore = item.affixes.reduce((sum, affix) => sum + scoreAffix(affix, archetype), 0);
  return baseScore + affixScore;
}

function scoreBuild(build, archetype) {
  const totals = { output: 0, survival: 0, tempo: 0, mechanic: 0 };
  const affixIds = [];
  const items = Object.values(build);
  let score = 0;
  for (const item of items) {
    score += scoreItem(item, archetype);
    for (const affix of item.affixes) {
      affixIds.push(affix.id);
      for (const bucket of Object.keys(SCORE_BUCKETS)) {
        totals[bucket] += (affix.budget[bucket] || 0) * affix.value;
      }
    }
    for (const [stat, value] of Object.entries(item.baseStats)) {
      addBaseBudget(totals, stat, value);
    }
  }
  return { build, items, score, totals, affixIds };
}

function scoreAffix(affix, archetype) {
  const desired = archetype.desired[affix.id] || 0.05;
  const bucketValue = Object.values(affix.budget).reduce((sum, value) => sum + value, 0);
  return affix.value * (desired * 2.4 + bucketValue * 0.18);
}

function addBaseBudget(totals, stat, value) {
  const normalized = normalizeValue(stat, value);
  if (["attack", "magicPower"].includes(stat)) totals.output += normalized;
  else if (["hp", "defense", "effectResist"].includes(stat)) totals.survival += normalized;
  else if (["attackSpeed", "skillHaste", "initiative"].includes(stat)) totals.tempo += normalized;
  else totals.mechanic += normalized * 0.5;
}

function normalizeValue(stat, value) {
  if (["attackSpeed", "skillHaste", "critChance", "effectResist", "initiative"].includes(stat)) return value * 2.5;
  if (["hp"].includes(stat)) return value / 14;
  if (["defense"].includes(stat)) return value / 2.5;
  return value / 3;
}

function scoreDiversity(bestScore, randomScores) {
  const sorted = [...randomScores].sort((a, b) => a - b);
  const p20 = percentile(sorted, 0.2);
  const median = percentile(sorted, 0.5);
  const p80 = percentile(sorted, 0.8);
  const lift = bestScore / Math.max(1, median);
  const spread = (p80 - p20) / Math.max(1, median);
  const liftScore = bandScore(lift, 1.35, 1.85, 2.8, 4.2);
  const spreadScore = bandScore(spread, 0.25, 0.4, 0.85, 1.25);
  const score = liftScore * 0.62 + spreadScore * 0.38;
  return {
    score: round(score),
    lift: round(lift),
    spread: round(spread),
    liftScore: round(liftScore),
    spreadScore: round(spreadScore),
    p20: round(p20),
    median: round(median),
    p80: round(p80),
  };
}

function scoreFantasy(best, archetype) {
  const groups = archetype.requiredGroups || archetype.required.map((id) => ({ label: id, ids: [id] }));
  const requiredHits = groups.filter((group) => group.ids.some((id) => best.affixIds.includes(id))).length;
  const requiredCoverage = requiredHits / Math.max(1, groups.length);
  const desiredScore = Object.entries(archetype.desired).reduce((sum, [id, weight]) => {
    const count = best.affixIds.filter((affixId) => affixId === id).length;
    return sum + Math.min(1, count) * weight;
  }, 0);
  const desiredMax = Object.values(archetype.desired).reduce((sum, value) => sum + Math.min(1, value), 0);
  const coverage = desiredScore / Math.max(1, desiredMax);
  const score = clamp(requiredCoverage * 0.65 + coverage * 0.35, 0, 1);
  return { score: round(score), requiredCoverage: round(requiredCoverage), desiredCoverage: round(coverage), requiredHits };
}

function scoreExtreme(best, archetype) {
  const total = Object.values(best.totals).reduce((sum, value) => sum + value, 0) || 1;
  const concentration = Object.fromEntries(Object.entries(best.totals).map(([key, value]) => [key, round(value / total)]));
  const maxBucket = Object.entries(concentration).sort((a, b) => b[1] - a[1])[0];
  const comboHits = archetype.riskCombos.filter((combo) => combo.every((id) => best.affixIds.includes(id))).length;
  const riskyAffixCount = best.items.flatMap((item) => item.affixes).filter((affix) => (affix.flags || []).length).length;
  const risk = clamp((maxBucket[1] - 0.54) / 0.28, 0, 1) * 0.35
    + clamp(comboHits / 2, 0, 1) * 0.35
    + clamp(riskyAffixCount / 9, 0, 1) * 0.3;
  return { risk: round(risk), concentration, maxBucket: maxBucket[0], comboHits, riskyAffixCount };
}

function scoreFormation(bestScore, previousScore, drops) {
  const playable = bestScore >= 24;
  const initialBuild = bestScore >= 38;
  const gain = bestScore - previousScore;
  const target = drops <= 20 ? 24 : drops <= 50 ? 38 : drops <= 100 ? 50 : 58;
  const score = clamp(bestScore / target, 0, 1);
  return { score: round(score), playable, initialBuild, gain: round(gain), target };
}

function missingRequired(best, archetype) {
  const groups = archetype.requiredGroups || archetype.required.map((id) => ({ label: id, ids: [id] }));
  return groups.filter((group) => !group.ids.some((id) => best.affixIds.includes(id))).map((group) => group.label);
}

function summarizeBuild(best) {
  return best.items.map((item) => ({
    slot: item.slotLabel,
    rarity: item.rarityLabel,
    type: item.typeLabel,
    affixes: item.affixes.map((affix) => `${affix.label}${affix.level}`),
  }));
}

function aggregateVariant(archetypeResults) {
  const finals = archetypeResults.map((item) => item.summary);
  const diversity = avg(finals.map((item) => item.finalDiversity));
  const fantasy = avg(finals.map((item) => item.finalFantasy));
  const extreme = avg(finals.map((item) => item.finalExtremeRisk));
  const formation = avg(finals.map((item) => formationScoreFromDrops(item.firstPlayableDrops, item.firstBuildDrops)));
  const overallScore = diversity * 0.24 + fantasy * 0.34 + (1 - extreme) * 0.22 + formation * 0.2;
  return {
    overallScore: round(overallScore),
    aggregate: {
      diversity: round(diversity),
      fantasy: round(fantasy),
      extremeRisk: round(extreme),
      formationSpeed: round(formation),
      firstPlayableAvg: round(avg(finals.map((item) => item.firstPlayableDrops || 240))),
      firstBuildAvg: round(avg(finals.map((item) => item.firstBuildDrops || 240))),
    },
  };
}

function formationScoreFromDrops(playable, build) {
  const playableScore = playable ? clamp((40 - playable) / 30, 0, 1) : 0;
  const buildScore = build ? clamp((85 - build) / 65, 0, 1) : 0;
  return playableScore * 0.45 + buildScore * 0.55;
}

function renderReport(output) {
  const lines = [];
  lines.push("# 装备词条自动迭代静态评估");
  lines.push("");
  lines.push(`生成时间：${output.generatedAt}`);
  lines.push("");
  lines.push("约束：本轮只评估装备规则，没有修改角色属性、技能或战斗引擎。");
  lines.push("");
  lines.push("## 版本总览");
  lines.push("");
  lines.push("| 版本 | 总分 | 多样性 | 流派增强 | 极端风险 | 成型速度 | 可玩平均掉落 | 成型平均掉落 |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const variant of output.variants) {
    const a = variant.aggregate;
    lines.push(`| ${variant.label} | ${variant.overallScore} | ${a.diversity} | ${a.fantasy} | ${a.extremeRisk} | ${a.formationSpeed} | ${a.firstPlayableAvg} | ${a.firstBuildAvg} |`);
  }
  lines.push("");
  lines.push(`阶段性最佳：${output.best.label}。`);
  lines.push("");
  for (const variant of output.variants) {
    lines.push(`## ${variant.label}`);
    lines.push("");
    lines.push(variant.note);
    lines.push("");
    lines.push("| 流派 | 最终分 | 多样性 | 流派增强 | 极端风险 | 首次可玩 | 初步成型 | 缺口 |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
    for (const item of variant.archetypes) {
      const s = item.summary;
      lines.push(`| ${item.label} | ${s.finalScore} | ${s.finalDiversity} | ${s.finalFantasy} | ${s.finalExtremeRisk} | ${s.firstPlayableDrops || "未达"} | ${s.firstBuildDrops || "未达"} | ${s.finalMissingRequired.join("、") || "无"} |`);
    }
    lines.push("");
  }
  lines.push("## 下一步");
  lines.push("");
  lines.push("下一步应把静态最佳规则固化为正式 affix registry 和掉落生成器参数，然后再接入装备水表战斗验证。");
  return `${lines.join("\n")}\n`;
}

function renderConsoleSummary(output) {
  const lines = [];
  lines.push(`Equipment auto-iteration static pass complete. Best: ${output.best.label} (${output.best.overallScore})`);
  for (const variant of output.variants) {
    const a = variant.aggregate;
    lines.push(`${variant.id}: overall=${variant.overallScore}, diversity=${a.diversity}, fantasy=${a.fantasy}, extreme=${a.extremeRisk}, formation=${a.formationSpeed}`);
  }
  lines.push(`Report: ${path.join(OUT_DIR, "equipment-auto-iteration-report.md")}`);
  return lines.join("\n");
}

function scaleBaseStats(stats, mult) {
  return Object.fromEntries(Object.entries(stats).map(([key, value]) => [key, round(value * mult)]));
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function weightedPick(items, rng) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.id;
  }
  return items[items.length - 1].id;
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * p)));
  return sorted[index];
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function bandScore(value, lowBad, lowGood, highGood, highBad) {
  if (value <= lowBad || value >= highBad) return 0;
  if (value >= lowGood && value <= highGood) return 1;
  if (value < lowGood) return (value - lowBad) / (lowGood - lowBad);
  return (highBad - value) / (highBad - highGood);
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function mulberry32(seed) {
  return function rng() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

if (require.main === module) main();

module.exports = {
  autoEquipBest,
  evaluateVariant,
  generateItem,
  scoreBuild,
  scoreItem,
  VARIANTS,
};
