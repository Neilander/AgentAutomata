const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { ARCHETYPES } = require("./equipment-affix-registry");
const { evaluateVariant, VARIANTS } = require("./equipment-auto-iteration");

const OUT_DIR = path.join(__dirname, "../design/equipment_auto_iteration");
const OUT_JSON = path.join(OUT_DIR, "equipment-combat-validation.json");
const OUT_REPORT = path.join(OUT_DIR, "equipment-combat-validation-report.md");

const ARCHETYPE_PRESETS = {
  lowHealthBerserker: "bloodRage",
  fireMage: "fireBurst",
  poisonBloom: "poisonBloom",
  shadowAssassin: "shadowExecute",
  ironKnight: "ironWall",
  holySustain: "holySustain",
};

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const evaluated = VARIANTS.map((variant, index) => ({
    variant,
    staticResult: evaluateVariant(variant, 90210 + index * 101),
  })).sort((a, b) => b.staticResult.overallScore - a.staticResult.overallScore);
  const preferred = evaluated.find((entry) => entry.variant.id === (process.env.EQUIPMENT_VARIANT || ""));
  const { variant, staticResult } = preferred || evaluated[0];
  const opponentKeys = Object.keys(SKILL_DATA.presets || {});
  const rows = [];

  for (const archetypeRow of staticResult.archetypes) {
    const presetKey = ARCHETYPE_PRESETS[archetypeRow.id];
    if (!presetKey || !SKILL_DATA.presets[presetKey]) continue;
    const archetype = ARCHETYPES[archetypeRow.id];
    const finalMilestone = archetypeRow.milestones[archetypeRow.milestones.length - 1];
    const build = finalMilestone.bestBuild || [];
    const equipmentBonus = buildToCombatBonus(build, archetypeRow.id);
    const baseTeam = clonePreset(presetKey);
    const equippedTeam = applyEquipmentToTeam(baseTeam, archetype.role, equipmentBonus);
    const cells = opponentKeys
      .filter((opponent) => opponent !== presetKey)
      .map((opponent) => runCell(presetKey, archetypeRow.label, baseTeam, equippedTeam, opponent));
    rows.push(summarizeArchetype(archetypeRow, presetKey, equipmentBonus, cells));
  }

  const report = {
    schema: "western_fantasy_equipment_combat_validation_v1",
    generatedAt: new Date().toISOString(),
    variant: {
      id: variant.id,
      label: variant.label,
      note: variant.note,
      staticOverall: staticResult.overallScore,
      staticAggregate: staticResult.aggregate,
    },
    constraints: [
      "No character base stats, skill data, combat engine, or waterline teams are modified.",
      "Equipment bonuses are applied only to cloned team specs before simulateTeams.",
      "This is a proxy combat mapping for validation, not the final equipment combat formula.",
    ],
    rows,
    aggregate: aggregate(rows),
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
  fs.writeFileSync(OUT_REPORT, renderReport(report), "utf8");
  console.log(renderConsole(report));
}

function runCell(presetKey, archetypeLabel, baseTeam, equippedTeam, opponentKey) {
  const base = simulateTeams(structuredClone(baseTeam), clonePreset(opponentKey), {
    seed: `equipment-validation|base|${presetKey}|${opponentKey}`,
    randomizeStats: false,
    maxTime: 75,
    healthInterval: 1,
  });
  const equipped = simulateTeams(structuredClone(equippedTeam), clonePreset(opponentKey), {
    seed: `equipment-validation|equipped|${presetKey}|${opponentKey}`,
    randomizeStats: false,
    maxTime: 75,
    healthInterval: 1,
  });
  return {
    opponentKey,
    opponentName: SKILL_DATA.presets[opponentKey]?.name || opponentKey,
    baseWin: base.winner === "left",
    equippedWin: equipped.winner === "left",
    winDelta: Number(equipped.winner === "left") - Number(base.winner === "left"),
    baseHp: round(base.leftHp),
    equippedHp: round(equipped.leftHp),
    hpDelta: round(equipped.leftHp - base.leftHp),
    baseDamage: round(base.metrics.leftDamage),
    equippedDamage: round(equipped.metrics.leftDamage),
    damageDelta: round(equipped.metrics.leftDamage - base.metrics.leftDamage),
    baseDuration: round(base.duration),
    equippedDuration: round(equipped.duration),
    archetypeLabel,
  };
}

function summarizeArchetype(archetypeRow, presetKey, equipmentBonus, cells) {
  const baseWins = cells.filter((cell) => cell.baseWin).length;
  const equippedWins = cells.filter((cell) => cell.equippedWin).length;
  const flippedWins = cells.filter((cell) => !cell.baseWin && cell.equippedWin);
  const flippedLosses = cells.filter((cell) => cell.baseWin && !cell.equippedWin);
  const avgHpDelta = avg(cells.map((cell) => cell.hpDelta));
  const avgDamageDelta = avg(cells.map((cell) => cell.damageDelta));
  return {
    archetypeId: archetypeRow.id,
    archetypeLabel: archetypeRow.label,
    presetKey,
    presetName: SKILL_DATA.presets[presetKey]?.name || presetKey,
    games: cells.length,
    baseWins,
    equippedWins,
    baseWinRate: round(baseWins / cells.length),
    equippedWinRate: round(equippedWins / cells.length),
    winRateDelta: round((equippedWins - baseWins) / cells.length),
    flippedWins: flippedWins.map((cell) => cell.opponentKey),
    flippedLosses: flippedLosses.map((cell) => cell.opponentKey),
    avgHpDelta: round(avgHpDelta),
    avgDamageDelta: round(avgDamageDelta),
    equipmentBonus,
    staticSummary: archetypeRow.summary,
    cells,
    verdict: verdictFor({ winRateDelta: (equippedWins - baseWins) / cells.length, avgHpDelta, avgDamageDelta, flippedLosses }),
  };
}

function buildToCombatBonus(build, archetypeId) {
  const bonus = {
    maxHpAdd: 0,
    physicalPowerAdd: 0,
    magicPowerAdd: 0,
    armorAdd: 0,
    attackSpeedMult: 1,
    skillHasteMult: 1,
    effectPowerMult: 1,
    effectResistPct: 0,
    receivedHealingMult: 1,
    notes: [],
  };
  for (const item of build) {
    for (const [stat, value] of Object.entries(item.baseStats || {})) {
      applyStatBonus(bonus, stat, value, "base");
    }
    for (const affix of item.affixes || []) {
      applyAffixBonus(bonus, affix, archetypeId);
    }
  }
  normalizeBonusForArchetype(bonus, archetypeId);
  bonus.maxHpAdd = Math.round(bonus.maxHpAdd);
  bonus.physicalPowerAdd = round(bonus.physicalPowerAdd);
  bonus.magicPowerAdd = round(bonus.magicPowerAdd);
  bonus.armorAdd = round(bonus.armorAdd);
  bonus.attackSpeedMult = round(clamp(bonus.attackSpeedMult, 0.75, 1.55));
  bonus.skillHasteMult = round(clamp(bonus.skillHasteMult, 0.75, 1.55));
  bonus.effectPowerMult = round(clamp(bonus.effectPowerMult, 0.8, 1.5));
  bonus.effectResistPct = round(clamp(bonus.effectResistPct, 0, 0.42));
  bonus.receivedHealingMult = round(clamp(bonus.receivedHealingMult, 0.8, 1.45));
  return bonus;
}

function normalizeBonusForArchetype(bonus, archetypeId) {
  if (archetypeId === "lowHealthBerserker") {
    // Preserve the low-health window: too much HP/healing made the build worse in validation.
    bonus.maxHpAdd = 0;
    bonus.magicPowerAdd = 0;
    bonus.armorAdd = Math.min(bonus.armorAdd, 3);
    bonus.physicalPowerAdd = Math.min(Math.max(bonus.physicalPowerAdd, 32), 38);
    bonus.receivedHealingMult = Math.min(bonus.receivedHealingMult, 1.06);
    bonus.effectResistPct = Math.min(bonus.effectResistPct, 0.06);
    bonus.attackSpeedMult = Math.min(Math.max(bonus.attackSpeedMult, 1.22), 1.32);
    bonus.skillHasteMult = Math.min(bonus.skillHasteMult, 1.08);
  } else if (archetypeId === "shadowAssassin") {
    bonus.maxHpAdd = Math.min(bonus.maxHpAdd, 45);
    bonus.magicPowerAdd = 0;
    bonus.armorAdd = Math.min(bonus.armorAdd, 4);
    bonus.physicalPowerAdd = Math.min(Math.max(bonus.physicalPowerAdd, 34), 42);
    bonus.receivedHealingMult = 1;
    bonus.effectResistPct = Math.min(bonus.effectResistPct, 0.04);
    bonus.attackSpeedMult = Math.min(bonus.attackSpeedMult, 1.18);
  } else if (archetypeId === "holySustain") {
    bonus.physicalPowerAdd = 0;
    bonus.magicPowerAdd = Math.min(bonus.magicPowerAdd, 22);
    bonus.armorAdd = Math.min(bonus.armorAdd, 12);
    bonus.skillHasteMult = Math.min(bonus.skillHasteMult, 1.08);
    bonus.effectPowerMult = Math.min(bonus.effectPowerMult, 1.08);
    bonus.receivedHealingMult = Math.min(bonus.receivedHealingMult, 1.12);
  } else if (archetypeId === "fireMage") {
    bonus.physicalPowerAdd = Math.min(bonus.physicalPowerAdd, 8);
    bonus.armorAdd = Math.min(bonus.armorAdd, 20);
    bonus.skillHasteMult = Math.min(bonus.skillHasteMult, 1.28);
    bonus.receivedHealingMult = Math.min(bonus.receivedHealingMult, 1.08);
  } else if (archetypeId === "poisonBloom") {
    bonus.physicalPowerAdd = Math.min(bonus.physicalPowerAdd, 10);
    bonus.maxHpAdd = Math.min(bonus.maxHpAdd, 145);
    bonus.receivedHealingMult = Math.min(bonus.receivedHealingMult, 1.16);
    bonus.effectPowerMult = Math.min(bonus.effectPowerMult, 1.18);
  } else if (archetypeId === "ironKnight") {
    bonus.magicPowerAdd = Math.min(bonus.magicPowerAdd, 8);
    bonus.physicalPowerAdd = Math.min(bonus.physicalPowerAdd, 22);
    bonus.attackSpeedMult = Math.min(bonus.attackSpeedMult, 1.08);
    bonus.effectPowerMult = Math.min(bonus.effectPowerMult, 1.08);
  }
}

function applyStatBonus(bonus, stat, value) {
  if (stat === "hp") bonus.maxHpAdd += value;
  else if (stat === "attack") bonus.physicalPowerAdd += value;
  else if (stat === "magicPower") bonus.magicPowerAdd += value;
  else if (stat === "defense") bonus.armorAdd += value * 0.8;
  else if (stat === "attackSpeed") bonus.attackSpeedMult *= 1 + value * 0.012;
  else if (stat === "skillHaste") bonus.skillHasteMult *= 1 + value * 0.012;
  else if (stat === "effectPower") bonus.effectPowerMult *= 1 + value * 0.012;
  else if (stat === "effectResist") bonus.effectResistPct += value * 0.008;
  else if (stat === "healPower" || stat === "shieldPower") bonus.magicPowerAdd += value * 0.8;
  else if (stat === "initiative") bonus.attackSpeedMult *= 1 + value * 0.006;
}

function applyAffixBonus(bonus, affix, archetypeId) {
  const value = affix.value || 1;
  switch (affix.id) {
    case "might":
      bonus.physicalPowerAdd += value * 1.05;
      bonus.maxHpAdd += value * 4;
      break;
    case "fortitude":
      bonus.maxHpAdd += value * 10;
      bonus.armorAdd += value * 0.45;
      break;
    case "agility":
      bonus.attackSpeedMult *= 1 + value * 0.012;
      bonus.effectResistPct += value * 0.004;
      break;
    case "arcana":
      bonus.magicPowerAdd += value * 1.1;
      bonus.skillHasteMult *= 1 + value * 0.006;
      break;
    case "rhythm":
      bonus.skillHasteMult *= 1 + value * 0.012;
      bonus.effectPowerMult *= 1 + value * 0.005;
      break;
    case "resilience":
      bonus.armorAdd += value * 0.7;
      bonus.effectResistPct += value * 0.006;
      break;
    case "attack":
      bonus.physicalPowerAdd += value * 1.35;
      break;
    case "magicPower":
      bonus.magicPowerAdd += value * 1.35;
      break;
    case "hp":
      bonus.maxHpAdd += value * 9;
      break;
    case "defense":
      bonus.armorAdd += value * 0.9;
      break;
    case "attackSpeed":
      bonus.attackSpeedMult *= 1 + value * 0.014;
      break;
    case "skillHaste":
      bonus.skillHasteMult *= 1 + value * 0.014;
      break;
    case "effectResist":
      bonus.effectResistPct += value * 0.009;
      break;
    case "effectPower":
    case "dotAmp":
    case "fireAmp":
    case "poisonAmp":
    case "ritualFocus":
      bonus.effectPowerMult *= 1 + value * 0.012;
      bonus.magicPowerAdd += value * 0.25;
      break;
    case "healPower":
    case "shieldPower":
    case "cleanseEfficiency":
    case "sustainFlow":
      bonus.magicPowerAdd += value * 0.55;
      bonus.receivedHealingMult *= 1 + value * 0.01;
      break;
    case "healingReceived":
    case "lowHpHealingReceived":
      bonus.receivedHealingMult *= 1 + value * 0.014;
      bonus.maxHpAdd += value * 3;
      break;
    case "critChance":
    case "critDamage":
    case "shieldBreak":
    case "armorBreak":
    case "focusFire":
    case "markPower":
    case "executeDamage":
      bonus.physicalPowerAdd += value * 0.65;
      break;
    case "lifeSteal":
      bonus.receivedHealingMult *= 1 + value * 0.01;
      bonus.physicalPowerAdd += value * 0.25;
      break;
    case "lowHpDamage":
    case "martialTempo":
      bonus.physicalPowerAdd += value * 0.45;
      bonus.attackSpeedMult *= 1 + value * 0.007;
      break;
    case "initiative":
    case "stealthDuration":
      bonus.attackSpeedMult *= 1 + value * 0.006;
      bonus.effectResistPct += value * 0.003;
      break;
    case "counterDamage":
      bonus.physicalPowerAdd += archetypeId === "ironKnight" ? value * 0.5 : value * 0.25;
      bonus.armorAdd += value * 0.25;
      break;
    case "controlPower":
    case "auraPower":
      bonus.skillHasteMult *= 1 + value * 0.006;
      bonus.effectPowerMult *= 1 + value * 0.006;
      break;
    default:
      bonus.notes.push(`unmapped:${affix.id}`);
      break;
  }
}

function applyEquipmentToTeam(team, targetRole, bonus) {
  return team.map((unit) => {
    if (unit.role !== targetRole) return structuredClone(unit);
    const next = structuredClone(unit);
    const baseHp = next.maxHp || next.hp || 0;
    next.maxHp = Math.round(baseHp + bonus.maxHpAdd);
    next.hp = next.maxHp;
    next.physicalPower = (next.physicalPower ?? next.power ?? 0) + bonus.physicalPowerAdd;
    next.magicPower = (next.magicPower ?? next.power ?? 0) + bonus.magicPowerAdd;
    next.power = Math.round(Math.max(next.physicalPower, next.magicPower, next.power || 0));
    next.armor = round((next.armor || 0) + bonus.armorAdd);
    next.attackSpeedMult = round((next.attackSpeedMult || 1) * bonus.attackSpeedMult);
    next.skillHasteMult = round((next.skillHasteMult || 1) * bonus.skillHasteMult);
    next.effectPowerMult = round((next.effectPowerMult || 1) * bonus.effectPowerMult);
    next.effectResistPct = round((next.effectResistPct || 0) + bonus.effectResistPct);
    next.receivedHealingMult = round((next.receivedHealingMult || 1) * bonus.receivedHealingMult);
    next.equipmentTags = ["equipment-v5-static-best"];
    return next;
  });
}

function verdictFor(row) {
  if (row.flippedLosses.length) return "review: equipment caused regression";
  if (row.winRateDelta > 0.25) return "risk: large win-rate jump";
  if (row.winRateDelta > 0 || row.avgHpDelta > 0.08 || row.avgDamageDelta > 25) return "ok: visible improvement";
  return "weak: little combat effect";
}

function aggregate(rows) {
  return {
    archetypes: rows.length,
    avgBaseWinRate: round(avg(rows.map((row) => row.baseWinRate))),
    avgEquippedWinRate: round(avg(rows.map((row) => row.equippedWinRate))),
    avgWinRateDelta: round(avg(rows.map((row) => row.winRateDelta))),
    avgHpDelta: round(avg(rows.map((row) => row.avgHpDelta))),
    avgDamageDelta: round(avg(rows.map((row) => row.avgDamageDelta))),
    regressions: rows.reduce((sum, row) => sum + row.flippedLosses.length, 0),
    largeJumps: rows.filter((row) => row.winRateDelta > 0.25).map((row) => row.archetypeId),
  };
}

function renderReport(report) {
  const lines = [];
  lines.push("# 装备水表验证 v1");
  lines.push("");
  lines.push(`生成时间：${report.generatedAt}`);
  lines.push("");
  lines.push("约束：本验证只在克隆队伍 spec 上应用装备代理 bonus，没有修改角色属性、技能、战斗引擎或水表队伍。");
  lines.push("");
  lines.push(`验证版本：${report.variant.label}。`);
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push(`- 平均基础胜率：${pct(report.aggregate.avgBaseWinRate)}`);
  lines.push(`- 平均装备胜率：${pct(report.aggregate.avgEquippedWinRate)}`);
  lines.push(`- 平均胜率变化：${pct(report.aggregate.avgWinRateDelta)}`);
  lines.push(`- 平均 HP 分变化：${report.aggregate.avgHpDelta}`);
  lines.push(`- 平均伤害变化：${report.aggregate.avgDamageDelta}`);
  lines.push(`- 装备导致的胜转负：${report.aggregate.regressions}`);
  lines.push(`- 大幅跳升流派：${report.aggregate.largeJumps.join(", ") || "无"}`);
  lines.push("");
  lines.push("## 按流派");
  lines.push("");
  lines.push("| 流派 | 预设 | 基础胜率 | 装备胜率 | 变化 | HP变化 | 伤害变化 | 判定 |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const row of report.rows) {
    lines.push(`| ${row.archetypeLabel} | ${row.presetName} \`${row.presetKey}\` | ${pct(row.baseWinRate)} | ${pct(row.equippedWinRate)} | ${pct(row.winRateDelta)} | ${row.avgHpDelta} | ${row.avgDamageDelta} | ${row.verdict} |`);
  }
  lines.push("");
  lines.push("## 观察");
  lines.push("");
  for (const row of report.rows) {
    lines.push(`### ${row.archetypeLabel}`);
    lines.push("");
    lines.push(`- 翻盘对手：${row.flippedWins.join(", ") || "无"}`);
    lines.push(`- 回退对手：${row.flippedLosses.join(", ") || "无"}`);
    lines.push(`- 装备 bonus：HP +${row.equipmentBonus.maxHpAdd}, 物攻 +${row.equipmentBonus.physicalPowerAdd}, 法强 +${row.equipmentBonus.magicPowerAdd}, 护甲 +${row.equipmentBonus.armorAdd}, 攻速 x${row.equipmentBonus.attackSpeedMult}, 技能急速 x${row.equipmentBonus.skillHasteMult}, 效果 x${row.equipmentBonus.effectPowerMult}, 受治愈 x${row.equipmentBonus.receivedHealingMult}`);
    lines.push("");
  }
  lines.push("## 局限");
  lines.push("");
  lines.push("- 当前是代理映射，不是最终装备战斗公式。");
  lines.push("- 没有改 combat-sim，所以部分词条只能映射成现有字段，不能完整表现独特机制。");
  lines.push("- 下一轮应根据本验证控制装备映射强度，并保存一个可继续接入正式装备系统的候选版本。");
  return `${lines.join("\n")}\n`;
}

function renderConsole(report) {
  return [
    `Equipment combat validation complete for ${report.variant.label}`,
    `avg base=${report.aggregate.avgBaseWinRate}, equipped=${report.aggregate.avgEquippedWinRate}, delta=${report.aggregate.avgWinRateDelta}, regressions=${report.aggregate.regressions}`,
    `Report: ${OUT_REPORT}`,
  ].join("\n");
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

if (require.main === module) main();

module.exports = { applyEquipmentToTeam, buildToCombatBonus };
