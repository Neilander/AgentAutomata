const fs = require("fs");
const path = require("path");
const { loadSkillAssetSource } = require("./skill-asset-source");

const MODEL_FILE = path.join(__dirname, "balance", "class-skill-budget-model.json");
const OUT_FILE = path.join(__dirname, "..", "design", "balance", "skill-budget-report.md");

const CLASS_BY_ROLE = {
  "骑士": "knight",
  "战士": "warrior",
  "狂战士": "berserker",
  "刺客": "assassin",
  "游侠": "ranger",
  "法师": "mage",
  "牧师": "priest",
  "术士": "warlock",
  "吟游诗人": "bard",
  "炼金师": "alchemist",
};

const DAMAGE_TYPE_MULT = {
  physical: 1,
  fire: 1.08,
  poison: 1.05,
  shadow: 1.12,
  arcane: 1.08,
};

function run() {
  const assets = loadSkillAssetSource();
  const model = JSON.parse(fs.readFileSync(MODEL_FILE, "utf8"));
  const rolePower = Object.fromEntries(Object.values(assets.roleKits).map((role) => [role.role, role.power]));
  const rows = Object.entries(assets.skills).map(([id, skill]) => analyzeSkill(id, skill, rolePower[skill.role] || 45, model));
  fs.writeFileSync(OUT_FILE, renderMarkdown(rows, model), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  return rows;
}

function analyzeSkill(id, skill, power, model) {
  const tier = skill.type === "大招" ? "ultimate" : skill.type === "小技能" ? "small" : "passive";
  const classKey = CLASS_BY_ROLE[skill.role] || "unknown";
  const metrics = summarizeEffects(skill.effects || [], power);
  const cooldown = Math.max(skill.cooldown || 1, 1);
  const rates = {
    dps: round(metrics.damage / cooldown),
    sps: round(metrics.shield / cooldown),
    hps: round(metrics.heal / cooldown),
    controlUptime: round(metrics.controlDuration / cooldown, 2),
    defenseUptime: round(metrics.defenseDuration / cooldown, 2),
    buffValuePerSecond: round(metrics.buffValue / cooldown),
  };
  const axes = activeAxes(rates, metrics);
  const warnings = [];
  if (tier !== "passive") {
    const classModel = model.classes[classKey];
    const tierModel = model.tiers[tier];
    if (classModel && tierModel) {
      for (const [metric, level] of Object.entries(classModel.smallCaps || {})) {
        const limit = tierModel[metric]?.[level];
        const extreme = tierModel[metric]?.extreme;
        if (Number.isFinite(limit) && rates[metric] > limit) {
          warnings.push(`${metric} ${rates[metric]} exceeds ${classModel.label || classKey} ${level} cap ${limit}`);
        }
        if (Number.isFinite(extreme) && rates[metric] > extreme) {
          warnings.push(`${metric} ${rates[metric]} exceeds global extreme ${extreme}`);
        }
      }
    }
    if (axes.length >= model.globalSmallSkillDensity.warnPrimaryAxes && tier === "small") {
      warnings.push(`function density ${axes.length}: ${axes.join(", ")}`);
    }
  }
  return {
    id,
    name: skill.name,
    role: skill.role,
    classKey,
    type: skill.type,
    cooldown: skill.cooldown || 0,
    openingCooldown: skill.openingCooldown || "",
    ...rates,
    axes,
    warnings,
    notes: metrics.notes,
  };
}

function summarizeEffects(effects, power) {
  const totals = { damage: 0, shield: 0, heal: 0, controlDuration: 0, defenseDuration: 0, buffValue: 0, notes: [] };
  for (const effect of effects) {
    const count = effect.count || 1;
    const typeMult = DAMAGE_TYPE_MULT[effect.type] || 1;
    const hit = (flat = 0, ratio = 0, targetCount = 1, extra = 0) => {
      totals.damage += (flat + power * ratio + extra) * targetCount * typeMult;
    };
    if (effect.kind === "hitTarget") hit(effect.flat, effect.power);
    else if (effect.kind === "hitEnemies") hit(effect.flat, effect.power, count || 4);
    else if (effect.kind === "hitLowestEnemy") hit(effect.flat, effect.power, 1, (effect.missingTargetHpFlat || 0) * 0.35);
    else if (effect.kind === "hitMarkedTarget") hit(effect.flat, effect.power, 1, (effect.perMark || 0) * 3);
    else if (effect.kind === "hitTargetWithStatus") hit(effect.flat, effect.power, 1, (effect.perStatus || 0) * Math.min(effect.maxStatus || 8, 4));
    else if (effect.kind === "burningEnemies") hit(effect.flat, effect.power, effect.count || 2, (effect.perBurn || 0) * 3);
    else if (effect.kind === "arrowStorm") totals.damage += (29 + power * 0.28 + 8) * 4;
    else if (effect.kind === "meteorRain") totals.damage += (22 + power * 0.18 + 12) * 4 * 1.08;
    else if (effect.kind === "plagueOffering") totals.damage += (22 + 6 * 9 + power * 0.22) * 3 * 1.05;
    else if (effect.kind === "grandMixture") totals.damage += (18 + power * 0.16 + 4 * 8) * 4 * 1.08;
    else if (effect.kind === "poisonTarget") addDot(totals, effect, 2.1);
    else if (effect.kind === "burnTarget") addDot(totals, effect, 2.15);
    else if (effect.kind === "poisonEnemies") addDot(totals, effect, 2.1, 4);
    else if (effect.kind === "shieldLowestAlly" || effect.kind === "shieldCarryAlly") totals.shield += effect.flat + power * effect.power;
    else if (effect.kind === "teamShield") totals.shield += (effect.flat + power * effect.power) * (effect.selfOnly ? 1 : 4);
    else if (effect.kind === "healLowestAlly") totals.heal += effect.flat + power * effect.power;
    else if (effect.kind === "teamHeal") totals.heal += (effect.flat + power * effect.power) * 4;
    else if (["timer", "targetTimer", "lowestAllyTimer", "carryTimer", "teamTimer", "enemyTimers"].includes(effect.kind)) addTimerValue(totals, effect);
    else if (effect.kind === "buffCarryPower") totals.buffValue += (effect.amount || 0) * (effect.duration || 0);
    else if (effect.kind === "markTarget") totals.buffValue += (effect.stacks || 1) * 10;
    else if (effect.kind === "crescendo") totals.buffValue += 80;
    else if (effect.kind === "berserkerRoar") {
      totals.buffValue += 80;
      totals.notes.push("death-prevent/haste/leech bundle");
    } else if (effect.kind === "counterOnDamageTaken") {
      totals.damage += ((effect.flat || 0) + power * (effect.power || 0) + (effect.blockedRatio || 0) * 40) * 2;
      totals.notes.push("reactive estimate");
    } else if (effect.kind === "teamRetaliation") {
      totals.buffValue += 60;
      totals.notes.push("team reactive window");
    }
  }
  return totals;
}

function addTimerValue(totals, effect) {
  const duration = effect.duration || 0;
  if (["slowTimer", "tauntTimer"].includes(effect.timer)) totals.controlDuration += duration;
  else if (["guardTimer", "dotResistTimer", "undyingTimer"].includes(effect.timer)) totals.defenseDuration += duration;
  else if (["hasteTimer", "bloodFuryTimer", "whirlwindTimer", "roarFuryTimer", "bonusPowerTimer", "lifeStealTimer"].includes(effect.timer)) totals.buffValue += duration * 12;
  else totals.buffValue += duration * 6;
}

function addDot(totals, effect, tickValue, targetCount = 1) {
  totals.damage += (effect.stacks || 0) * tickValue * Math.min(effect.time || 6, 6) * targetCount;
  totals.notes.push(targetCount > 1 ? "aoe dot setup estimate" : "dot setup estimate");
}

function activeAxes(rates, metrics) {
  const axes = [];
  if (rates.dps >= 8) axes.push("damage");
  if (rates.sps >= 6) axes.push("shield");
  if (rates.hps >= 6) axes.push("heal");
  if (rates.controlUptime >= 0.25) axes.push("timer/control");
  if (rates.defenseUptime >= 0.3) axes.push("defense-window");
  if (rates.buffValuePerSecond >= 5) axes.push("buff");
  if (metrics.notes.some((note) => note.includes("death"))) axes.push("death-prevent");
  return axes;
}

function renderMarkdown(rows, model) {
  const active = rows.filter((row) => row.type !== "被动");
  const warnings = rows.filter((row) => row.warnings.length);
  const byClass = {};
  for (const row of active) {
    byClass[row.classKey] ||= [];
    byClass[row.classKey].push(row);
  }
  const lines = [
    "# Skill Budget Model Report",
    "",
    "This report is a static first pass. It checks skill scale against class-specific budgets before benchmark-team or breaker testing.",
    "",
    "## Summary",
    "",
    `- Skills checked: ${rows.length}`,
    `- Active skills checked: ${active.length}`,
    `- Warning count: ${warnings.length}`,
    "",
    "## Current Warnings",
    "",
  ];
  if (!warnings.length) lines.push("- None.");
  for (const row of warnings) {
    lines.push(`- \`${row.id}\` (${row.role}, ${row.type}): ${row.warnings.join("; ")}.`);
  }
  lines.push("", "## Class Baselines", "");
  for (const [classKey, skills] of Object.entries(byClass).sort()) {
    const classModel = model.classes[classKey];
    lines.push(`### ${classModel?.label || classKey}`, "");
    lines.push(`Allowed highs: ${(classModel?.allowedHigh || []).join(", ") || "n/a"}`);
    lines.push("");
    lines.push("| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |");
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
    for (const row of skills.sort((a, b) => b.dps + b.sps + b.hps + b.buffValuePerSecond - (a.dps + a.sps + a.hps + a.buffValuePerSecond))) {
      lines.push(`| \`${row.id}\` | ${row.type} | ${row.cooldown} | ${row.dps} | ${row.sps} | ${row.hps} | ${row.controlUptime} | ${row.defenseUptime} | ${row.buffValuePerSecond} | ${row.axes.join(", ")} |`);
    }
    lines.push("");
  }
  lines.push("## Interpretation", "");
  lines.push("- High HPS on priest skills is expected; it should not be judged against assassin or mage budgets.");
  lines.push("- High SPS/control on knight skills is expected, while direct healing would be suspicious.");
  lines.push("- Function density warnings mean a skill occupies several jobs at once; this requires benchmark testing rather than automatic nerfs.");
  lines.push("- Breaker/red-team runs should be reserved for batches of new skills or balance passes.");
  return `${lines.join("\n")}\n`;
}

function round(value, digits = 1) {
  return Number(value.toFixed(digits));
}

if (require.main === module) run();

module.exports = { analyzeSkill, run };
