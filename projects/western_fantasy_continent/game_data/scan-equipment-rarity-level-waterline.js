const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { simulateTeams, clonePreset } = require("./combat-sim");
const BUILD_LAYERS = require("./build-layers");
const MECHANIC_CURVES = require("./mechanic-curves");

const ROOT = path.join(__dirname, "..");
const EQUIPMENT_UI_FILE = path.join(ROOT, "equipment_grind_simulator", "equipment-grind-simulator.js");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-super-db.json");
const OUT_DIR = path.join(ROOT, "design", "equipment_progression");
const OUT_JSON = path.join(OUT_DIR, "equipment-rarity-level-waterline-thresholds.json");
const OUT_REPORT = path.join(OUT_DIR, "equipment-rarity-level-waterline-thresholds.md");

const PRESET_IDS = ["fireBurst", "bloodRage", "ironWall", "shadowExecute", "poisonBloom", "holySustain"];
const TEAM_LABELS = {
  fireBurst: "火焰爆燃",
  bloodRage: "低血狂暴",
  ironWall: "铁壁反击",
  shadowExecute: "暗影处决",
  poisonBloom: "剧毒滚雪球",
  holySustain: "圣光续航",
};
const LEVELS = [250, 230, 210, 190, 170, 150, 130, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20];
const SAMPLE_SIZE = Number(process.env.EQUIP_THRESHOLD_SAMPLE || 48);
const CANDIDATES_PER_SLOT = Number(process.env.EQUIP_THRESHOLD_CANDIDATES || 4);
const VERIFY_FULL = process.env.EQUIP_THRESHOLD_FULL === "0" ? false : true;
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

const { AFFIX_DEFS, SLOT_DATA, RARITIES } = loadCurrentEquipmentDefs();
const SLOT_KEYS = Object.keys(SLOT_DATA);
const RARITY_IDS = RARITIES.map((rarity) => rarity.id);

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterlineAll = readJson(WATERLINE_FILE).teams;
  const waterlineSample = sampleWaterline(waterlineAll, SAMPLE_SIZE);
  const sampleRows = [];

  for (const rarityId of RARITY_IDS) {
    for (const level of LEVELS) {
      sampleRows.push(evaluateRarityLevel(rarityId, level, waterlineSample, `sample|${rarityId}|${level}`));
    }
  }

  const thresholds = RARITY_IDS.map((rarityId) => summarizeThreshold(rarityId, sampleRows));
  const fullVerification = VERIFY_FULL
    ? thresholds.filter((row) => row.sampleFullClearLevel).map((row) => verifyThreshold(row, waterlineAll))
    : [];

  const output = {
    schema: "western_fantasy_equipment_rarity_level_waterline_thresholds_v1",
    generatedAt: new Date().toISOString(),
    config: {
      levels: LEVELS,
      sampleSize: waterlineSample.length,
      totalWaterline: waterlineAll.length,
      candidatesPerSlot: CANDIDATES_PER_SLOT,
      presets: PRESET_IDS,
      fullVerification: VERIFY_FULL,
      fullClearDefinition: "all six representative presets win every sampled super-waterline match",
    },
    waterline: {
      file: path.relative(ROOT, WATERLINE_FILE).replace(/\\/g, "/"),
      total: waterlineAll.length,
      sample: waterlineSample.length,
      avgSamplePressure: round(avg(waterlineSample.map((team) => team.evaluation?.pressureScore || 0)), 2),
    },
    thresholds,
    sampleRows,
    fullVerification,
    notes: [
      "This scan bypasses progression drops and directly equips fixed-rarity, fixed-level gear.",
      "Each unit auto-equips the best of several generated candidates per slot using role-aware scoring.",
      "Sample clear means all 6 presets beat all sampled super-waterline teams.",
      "Full verification reruns threshold levels against the full super-waterline database.",
    ],
  };

  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_REPORT, renderReport(output), "utf8");
  console.log(renderConsole(output));
}

function evaluateRarityLevel(rarityId, equipmentLevel, waterline, seedPrefix) {
  const teams = PRESET_IDS.map((presetId) => {
    const equippedTeam = equipPresetAtRarityLevel(presetId, rarityId, equipmentLevel, `${seedPrefix}|${presetId}`);
    return scoreTeam(presetId, equippedTeam, waterline, seedPrefix);
  });
  const totalWins = teams.reduce((sum, team) => sum + team.wins, 0);
  const totalGames = teams.reduce((sum, team) => sum + team.games, 0);
  const minScore = Math.min(...teams.map((team) => team.score));
  const avgScore = avg(teams.map((team) => team.score));
  const fullClear = teams.every((team) => team.wins === team.games);
  return {
    rarity: rarityId,
    rarityLabel: rarityLabel(rarityId),
    equipmentLevel,
    fullClear,
    totalWins,
    totalGames,
    avgScore: round(avgScore),
    minScore: round(minScore),
    teamRows: teams,
  };
}

function equipPresetAtRarityLevel(presetId, rarityId, equipmentLevel, seedText) {
  const rarity = rarityById(rarityId);
  const rng = seededRandom(seedText);
  return clonePreset(presetId).map((unit, unitIndex) => {
    const items = [];
    for (const slot of SLOT_KEYS) {
      const candidates = Array.from({ length: CANDIDATES_PER_SLOT }, (_, candidateIndex) => (
        generateItem(slot, rarity, equipmentLevel, rng, `${presetId}-${unitIndex}-${slot}-${candidateIndex}`)
      ));
      const best = candidates
        .map((item) => ({ item, score: itemScoreForRole(item, unit.role) }))
        .sort((a, b) => b.score - a.score)[0]?.item;
      if (best) items.push(best);
    }
    return applyItems(unit, items);
  });
}

function applyItems(unit, items) {
  const layerItems = items.map((item) => ({
    baseStats: Object.fromEntries(Object.entries(item.baseStats || {}).map(([stat, value]) => [stat, buildLayerAffixValue(stat, value)])),
    affixes: item.affixes.map((affix) => ({
      id: affix.stat,
      stat: affix.stat,
      value: buildLayerAffixValue(affix.stat, affix.value, true),
    })),
  }));
  return BUILD_LAYERS.applyBuildLayers(unit, {
    equipmentItems: layerItems,
    tags: ["equipment-rarity-level-threshold"],
  });
}

function scoreTeam(presetId, equippedTeam, waterline, seedPrefix) {
  let wins = 0;
  let damage = 0;
  let dotDamage = 0;
  let duration = 0;
  for (const mob of waterline) {
    const result = simulateTeams(structuredClone(equippedTeam), structuredClone(mob.team), {
      seed: `rarity-level-threshold|${seedPrefix}|${presetId}|${mob.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    if (result.winner === "left") wins += 1;
    damage += result.metrics.leftDamage || 0;
    dotDamage += result.metrics.leftDotDamage || 0;
    duration += result.duration || 0;
  }
  return {
    id: presetId,
    label: TEAM_LABELS[presetId] || presetId,
    wins,
    games: waterline.length,
    score: round(wins / waterline.length),
    avgDamage: Math.round(damage / waterline.length),
    avgDotDamage: Math.round(dotDamage / waterline.length),
    avgDuration: round(duration / waterline.length, 1),
  };
}

function summarizeThreshold(rarityId, rows) {
  const rarityRows = rows.filter((row) => row.rarity === rarityId).sort((a, b) => b.equipmentLevel - a.equipmentLevel);
  const full = [...rarityRows].reverse().find((row) => row.fullClear);
  const near95 = [...rarityRows].reverse().find((row) => row.avgScore >= 0.95 && row.minScore >= 0.9);
  const best = rarityRows.slice().sort((a, b) => b.avgScore - a.avgScore || b.minScore - a.minScore)[0];
  return {
    rarity: rarityId,
    rarityLabel: rarityLabel(rarityId),
    affixLines: rarityById(rarityId).affixes,
    sampleFullClearLevel: full?.equipmentLevel || null,
    sampleNearClearLevel: near95?.equipmentLevel || null,
    bestSampleLevel: best?.equipmentLevel || null,
    bestSampleAvgScore: best?.avgScore || 0,
    bestSampleMinScore: best?.minScore || 0,
  };
}

function verifyThreshold(threshold, waterlineAll) {
  const levels = unique([threshold.sampleFullClearLevel, threshold.sampleFullClearLevel - 20, threshold.sampleFullClearLevel + 20])
    .filter((level) => Number.isFinite(level) && level > 0)
    .sort((a, b) => b - a);
  return {
    rarity: threshold.rarity,
    rarityLabel: threshold.rarityLabel,
    checkedLevels: levels.map((level) => evaluateRarityLevel(threshold.rarity, level, waterlineAll, `full|${threshold.rarity}|${level}`)),
  };
}

function generateItem(slotKey, rarity, equipmentLevel, rng, idSuffix) {
  const slot = SLOT_DATA[slotKey];
  const affixes = pickAffixStats(slot.affixPool, rarity.affixes, rng).map((stat) => rollAffix(stat, equipmentLevel, rng));
  return {
    id: `threshold_${idSuffix}`,
    slot: slotKey,
    equipmentLevel,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    baseStats: rollBaseStats(slot, equipmentLevel, rng),
    affixes,
  };
}

function rollBaseStats(slot, equipmentLevel, rng) {
  const baseStats = slot.baseOptions ? pick(slot.baseOptions, rng) : (slot.baseStats || []);
  return Object.fromEntries(baseStats.map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel, rng)]));
}

function rollAffix(stat, equipmentLevel, rng) {
  return {
    stat,
    value: rollAffixValue(stat, equipmentLevel, rng),
    level: rollAffixLevel(equipmentLevel),
    category: AFFIX_DEFS[stat]?.category || "mechanic",
  };
}

function rollAffixLevel(equipmentLevel) {
  if (equipmentLevel >= 120) return 5;
  if (equipmentLevel >= 80) return 4;
  if (equipmentLevel >= 50) return 3;
  if (equipmentLevel >= 30) return 2;
  return 1;
}

function rollAffixValue(stat, equipmentLevel, rng) {
  const def = AFFIX_DEFS[stat] || { category: "mechanic" };
  const variance = 0.88 + rng() * 0.24;
  if (def.category === "major") return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
  if (def.percent || MECHANIC_CURVES.hasMechanicCurve(stat)) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
  if (stat === "effectResist" || stat === "receivedHealing" || stat === "effectPower") return Math.max(1, Math.round((2.5 + equipmentLevel / 8) * variance));
  return Math.max(1, Math.round((2 + equipmentLevel / 9) * variance));
}

function rollDirectStatValue(stat, equipmentLevel, rng) {
  const variance = 0.92 + rng() * 0.16;
  const rows = {
    physicalPower: 0.5,
    magicPower: 0.5,
    maxHp: 2.8,
    armor: 0.08,
  };
  return Math.max(1, Math.round(equipmentLevel * (rows[stat] || 0.12) * variance));
}

function itemScoreForRole(item, role) {
  const baseScore = Object.entries(item.baseStats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScoreForRole(stat, value, role), 0);
  const affixScore = (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScoreForRole(affix.stat, affix.value, role), 0);
  const rarityValue = { common: 1, rare: 1.35, epic: 1.7, legendary: 2.15, mythic: 2.65 }[item.rarity] || 1;
  return item.equipmentLevel * 0.28 + rarityValue * 18 + baseScore + affixScore;
}

function normalizedStatScoreForRole(stat, value, role) {
  const numeric = Number(value) || 0;
  if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return numeric * 55 * roleAttributeWeight(role, stat);
  const curveValue = MECHANIC_CURVES.hasMechanicCurve(stat) ? MECHANIC_CURVES.mechanicCurveValue(stat, numeric) * 100 : numeric;
  const weights = {
    maxHp: 0.55,
    physicalPower: 8 * rolePhysicalWeight(role),
    magicPower: 8 * roleMagicWeight(role),
    armor: 12,
    attackSpeed: 320 * rolePhysicalWeight(role),
    skillHaste: 330 * roleSkillWeight(role),
    effectPower: 285 * roleEffectWeight(role),
    effectResist: 210,
    receivedHealing: 220 * roleFrontlineWeight(role),
    healPower: 18 * roleHealWeight(role),
    shieldPower: 18 * roleShieldWeight(role),
    dotAmp: 16 * roleDotWeight(role),
    controlPower: 15 * roleControlWeight(role),
    critChance: 13 * roleCritWeight(role),
    critDamage: 13 * roleCritWeight(role),
    lifeSteal: 18 * roleLifeStealWeight(role),
    shieldBreak: 12 * rolePhysicalWeight(role),
    armorBreak: 12 * rolePhysicalWeight(role),
    initiative: 14 * roleInitiativeWeight(role),
    fireAmp: 18 * (["mage", "alchemist", "ranger"].includes(role) ? 1 : 0.35),
    poisonAmp: 18 * (["warlock", "alchemist", "assassin"].includes(role) ? 1 : 0.35),
    shadowAmp: 18 * (["assassin", "warlock"].includes(role) ? 1 : 0.35),
    arcaneAmp: 18 * (["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 0.9 : 0.25),
    markPower: 18 * (["ranger", "assassin"].includes(role) ? 1 : 0.25),
    stealthDuration: 20 * (role === "assassin" ? 1 : role === "ranger" ? 0.82 : 0.12),
    executeDamage: 17 * (["assassin", "ranger", "warrior"].includes(role) ? 1 : 0.25),
    lowHpDamage: 18 * (["berserker", "warlock", "warrior"].includes(role) ? 1 : 0.25),
    lowHpHealingReceived: 18 * (["berserker", "knight", "warrior"].includes(role) ? 1 : 0.28),
    counterDamage: 16 * (["knight", "warrior"].includes(role) ? 1 : 0.3),
    cleanseEfficiency: 17 * (["priest", "bard", "alchemist"].includes(role) ? 1 : 0.35),
    auraPower: 18 * (["bard", "priest", "knight"].includes(role) ? 1 : 0.35),
  };
  return (weights[stat] || 2.5) * curveValue;
}

function renderReport(output) {
  const lines = [];
  lines.push("# Equipment Rarity / Level Thresholds vs Super Waterline", "");
  lines.push(`Generated at: ${output.generatedAt}`, "");
  lines.push("## Method", "");
  lines.push(`- Presets: ${output.config.presets.join(", ")}`);
  lines.push(`- Sample waterline: ${output.waterline.sample}/${output.waterline.total}`);
  lines.push(`- Candidates per unit slot: ${output.config.candidatesPerSlot}`);
  lines.push(`- Full clear: ${output.config.fullClearDefinition}`);
  lines.push(`- Levels scanned: ${output.config.levels.join(", ")}`);
  lines.push("", "## Threshold Summary", "");
  lines.push("| Rarity | Affix lines | Sample full-clear level | Sample near-clear level | Best sampled score |");
  lines.push("| --- | ---: | ---: | ---: | --- |");
  for (const row of output.thresholds) {
    lines.push(`| ${row.rarityLabel} \`${row.rarity}\` | ${row.affixLines} | ${row.sampleFullClearLevel ?? "-"} | ${row.sampleNearClearLevel ?? "-"} | ${row.bestSampleAvgScore}/${row.bestSampleMinScore} @ Lv.${row.bestSampleLevel} |`);
  }
  lines.push("", "## Sample Matrix", "");
  for (const rarity of RARITY_IDS) {
    lines.push(`### ${rarityLabel(rarity)}`, "");
    lines.push("| Level | Full clear | Avg score | Min team score | Weakest team |");
    lines.push("| ---: | --- | ---: | ---: | --- |");
    for (const row of output.sampleRows.filter((item) => item.rarity === rarity).sort((a, b) => b.equipmentLevel - a.equipmentLevel)) {
      const weakest = row.teamRows.slice().sort((a, b) => a.score - b.score)[0];
      lines.push(`| ${row.equipmentLevel} | ${row.fullClear ? "yes" : "no"} | ${row.avgScore} | ${row.minScore} | ${weakest.label} ${weakest.wins}/${weakest.games} |`);
    }
    lines.push("");
  }
  if (output.fullVerification.length) {
    lines.push("## Full Waterline Verification", "");
    for (const entry of output.fullVerification) {
      lines.push(`### ${entry.rarityLabel}`, "");
      lines.push("| Level | Full clear | Avg score | Min score | Weakest team |");
      lines.push("| ---: | --- | ---: | ---: | --- |");
      for (const row of entry.checkedLevels) {
        const weakest = row.teamRows.slice().sort((a, b) => a.score - b.score)[0];
        lines.push(`| ${row.equipmentLevel} | ${row.fullClear ? "yes" : "no"} | ${row.avgScore} | ${row.minScore} | ${weakest.label} ${weakest.wins}/${weakest.games} |`);
      }
      lines.push("");
    }
  }
  lines.push("## Notes", "");
  for (const note of output.notes) lines.push(`- ${note}`);
  return `${lines.join("\n")}\n`;
}

function renderConsole(output) {
  return [
    "Equipment rarity/level threshold scan complete.",
    `sample=${output.waterline.sample}/${output.waterline.total}`,
    ...output.thresholds.map((row) => `${row.rarity}: full=${row.sampleFullClearLevel ?? "none"} near=${row.sampleNearClearLevel ?? "none"} best=${row.bestSampleAvgScore}/${row.bestSampleMinScore}@${row.bestSampleLevel}`),
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function loadCurrentEquipmentDefs() {
  const src = fs.readFileSync(EQUIPMENT_UI_FILE, "utf8");
  return {
    AFFIX_DEFS: vm.runInNewContext(`(${extractConstObject(src, "AFFIX_DEFS")})`),
    SLOT_DATA: vm.runInNewContext(`(${extractConstObject(src, "SLOT_DATA")})`),
    RARITIES: vm.runInNewContext(`(${extractConstArray(src, "RARITIES")})`),
  };
}

function extractConstObject(src, name) {
  return extractConstDelimited(src, name, "{", "}");
}

function extractConstArray(src, name) {
  return extractConstDelimited(src, name, "[", "]");
}

function extractConstDelimited(src, name, open, close) {
  const marker = `const ${name} = `;
  const start = src.indexOf(marker);
  if (start < 0) throw new Error(`Missing ${name}`);
  const openStart = src.indexOf(open, start);
  let depth = 0;
  for (let i = openStart; i < src.length; i += 1) {
    if (src[i] === open) depth += 1;
    if (src[i] === close) depth -= 1;
    if (depth === 0) return src.slice(openStart, i + 1);
  }
  throw new Error(`Unterminated ${name}`);
}

function buildLayerAffixValue(stat, value, isAffix = false) {
  const numeric = Number(value || 0);
  if (isAffix && MECHANIC_CURVES.hasMechanicCurve(stat)) return numeric;
  return percentStats().includes(stat) ? numeric * 100 : numeric;
}

function percentStats() {
  return Object.entries(AFFIX_DEFS).filter(([, def]) => def.percent).map(([id]) => id);
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function pickAffixStats(list, count, rng) {
  const pool = list.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
  const result = [];
  for (let i = 0; i < count; i += 1) result.push(pick(pool, rng));
  return result;
}

function sampleWaterline(teams, count) {
  if (teams.length <= count) return teams;
  const sorted = [...teams].sort((a, b) => (a.evaluation?.pressureScore || 0) - (b.evaluation?.pressureScore || 0));
  const result = [];
  for (let i = 0; i < count; i += 1) {
    const index = Math.round((i / Math.max(1, count - 1)) * (sorted.length - 1));
    result.push(sorted[index]);
  }
  return result;
}

function rarityById(id) {
  const rarity = RARITIES.find((item) => item.id === id);
  if (!rarity) throw new Error(`Unknown rarity: ${id}`);
  return rarity;
}

function rarityLabel(id) {
  return rarityById(id).label || id;
}

function unique(values) {
  return [...new Set(values)];
}

function rolePhysicalWeight(role) { return ["warrior", "berserker", "assassin", "ranger", "knight"].includes(role) ? 1 : 0.45; }
function roleMagicWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard"].includes(role) ? 1 : 0.35; }
function roleSkillWeight(role) { return ["mage", "priest", "warlock", "alchemist", "bard", "knight"].includes(role) ? 1 : 0.65; }
function roleEffectWeight(role) { return ["mage", "warlock", "alchemist", "priest", "bard"].includes(role) ? 1 : 0.5; }
function roleFrontlineWeight(role) { return ["knight", "warrior", "berserker"].includes(role) ? 1 : 0.55; }
function roleHealWeight(role) { return role === "priest" ? 1 : role === "bard" ? 0.7 : 0.25; }
function roleShieldWeight(role) { return ["knight", "priest"].includes(role) ? 1 : role === "bard" ? 0.7 : 0.3; }
function roleDotWeight(role) { return ["warlock", "alchemist", "mage", "assassin"].includes(role) ? 1 : 0.35; }
function roleControlWeight(role) { return ["mage", "bard", "alchemist", "warlock"].includes(role) ? 1 : 0.4; }
function roleCritWeight(role) { return ["ranger", "assassin", "warrior"].includes(role) ? 1 : 0.35; }
function roleLifeStealWeight(role) { return ["berserker", "assassin", "warrior"].includes(role) ? 1 : 0.25; }
function roleInitiativeWeight(role) { return ["assassin", "ranger", "mage", "bard"].includes(role) ? 1 : 0.55; }
function roleAttributeWeight(role, attr) {
  const [main, secondary] = BUILD_LAYERS.ROLE_ATTRS?.[role] || [];
  if (attr === main) return 1.25;
  if (attr === secondary) return 1;
  return 0.48;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

if (require.main === module) main();

module.exports = { main, evaluateRarityLevel, equipPresetAtRarityLevel, readJson, WATERLINE_FILE };
