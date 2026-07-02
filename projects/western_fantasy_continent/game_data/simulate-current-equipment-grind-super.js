const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { simulateTeams, clonePreset } = require("./combat-sim");
const BUILD_LAYERS = require("./build-layers");
const MECHANIC_CURVES = require("./mechanic-curves");

const ROOT = path.join(__dirname, "..");
const EQUIPMENT_UI_FILE = path.join(ROOT, "equipment_grind_simulator", "equipment-grind-simulator.js");
const OUT_DIR = path.join(ROOT, "design", "equipment_progression");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-super-db.json");
const OUT_JSON = path.join(OUT_DIR, "current-equipment-grind-super-8runs.json");
const OUT_REPORT = path.join(OUT_DIR, "current-equipment-grind-super-8runs.md");

const CONFIG = {
  ticks: Number(process.env.CURRENT_EQUIP_TICKS || 24),
  itemsPerTeamPerTick: Number(process.env.CURRENT_EQUIP_ITEMS || 4),
  waterlineSample: Number(process.env.CURRENT_EQUIP_WATERLINE_SAMPLE || 48),
  scoreWeights: { average: 0.45, best: 0.35, worst: 0.2 },
};

const SCENARIOS = [
  { id: "s1_fire_lowhp_wall", seed: 73129, teamIds: ["fireBurst", "bloodRage", "ironWall"] },
  { id: "s2_poison_shadow_sustain", seed: 91871, teamIds: ["poisonBloom", "shadowExecute", "holySustain"] },
  { id: "s3_double_dot_wall", seed: 44221, teamIds: ["fireBurst", "poisonBloom", "ironWall"] },
  { id: "s4_lowhp_shadow_sustain", seed: 66513, teamIds: ["bloodRage", "shadowExecute", "holySustain"] },
  { id: "s5_defensive_shells", seed: 12017, teamIds: ["ironWall", "holySustain", "bloodRage"] },
  { id: "s6_damage_race", seed: 84391, teamIds: ["fireBurst", "poisonBloom", "shadowExecute"] },
  { id: "s7_spell_execute_sustain", seed: 57133, teamIds: ["fireBurst", "shadowExecute", "holySustain"] },
  { id: "s8_pressure_front", seed: 44633, teamIds: ["bloodRage", "poisonBloom", "ironWall"] },
];

const TEAM_LABELS = {
  fireBurst: "火焰",
  bloodRage: "低血",
  ironWall: "反击",
  poisonBloom: "剧毒",
  shadowExecute: "暗影",
  holySustain: "圣光",
};

const { AFFIX_DEFS, SLOT_DATA, RARITIES } = loadCurrentEquipmentDefs();
const SLOT_KEYS = Object.keys(SLOT_DATA);
const EQUIPMENT_LEVEL_BY_TIER = { 1: 20, 2: 40, 3: 60, 4: 100, 5: 150 };
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterline = sampleWaterline(readJson(WATERLINE_FILE).teams, CONFIG.waterlineSample);
  const runs = SCENARIOS.map((scenario) => runScenario(scenario, waterline));
  const output = {
    schema: "western_fantasy_current_equipment_grind_super_8runs_v1",
    generatedAt: new Date().toISOString(),
    config: CONFIG,
    waterline: {
      file: path.relative(ROOT, WATERLINE_FILE).replace(/\\/g, "/"),
      total: readJson(WATERLINE_FILE).teams.length,
      sample: waterline.length,
      avgPressure: round(avg(waterline.map((team) => team.evaluation?.pressureScore || 0)), 2),
    },
    affixReview: summarizeAffixCoverage(),
    runs,
    synthesis: synthesize(runs),
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_REPORT, renderReport(output), "utf8");
  console.log(renderConsole(output));
}

function runScenario(scenario, waterline) {
  const rng = mulberry32(scenario.seed);
  const teams = scenario.teamIds.map((id) => ({
    id,
    label: TEAM_LABELS[id] || id,
    inventory: [],
    equippedItemsByUnit: [],
    equippedTeam: clonePreset(id),
  }));

  const timeline = [];
  let lastScores = scoreAllTeams(teams, waterline, `${scenario.id}|initial`);
  timeline.push(snapshot(0, 0, lastScores));

  for (let tick = 1; tick <= CONFIG.ticks; tick += 1) {
    const progressionScore = weightedProgressionScore(lastScores);
    for (const team of teams) {
      for (let i = 0; i < CONFIG.itemsPerTeamPerTick; i += 1) {
        team.inventory.push(generateItem(dropTier(progressionScore), rarityTable(progressionScore), rng));
      }
      const equip = autoEquipTeam(team.id, team.inventory);
      team.equippedItemsByUnit = equip.itemsByUnit;
      team.equippedTeam = applyEquipmentToPreset(team.id, equip.itemsByUnit);
      team.equipSummary = equip.summary;
    }
    lastScores = scoreAllTeams(teams, waterline, `${scenario.id}|tick-${tick}`);
    timeline.push(snapshot(tick, progressionScore, lastScores));
  }

  return {
    id: scenario.id,
    seed: scenario.seed,
    teamIds: scenario.teamIds,
    timeline,
    summary: summarizeRun(timeline),
    teamSummaries: summarizeTeams(timeline),
    possibleConclusion: possibleConclusion(timeline),
  };
}

function scoreAllTeams(teams, mobs, seedPrefix) {
  const rows = teams.map((team) => scoreTeam(team, mobs, seedPrefix));
  const values = rows.map((row) => row.score);
  return {
    average: round(avg(values)),
    best: round(Math.max(...values)),
    worst: round(Math.min(...values)),
    spread: round(Math.max(...values) - Math.min(...values)),
    rows,
  };
}

function scoreTeam(team, mobs, seedPrefix) {
  let wins = 0;
  let damage = 0;
  let dotDamage = 0;
  for (const mob of mobs) {
    const result = simulateTeams(structuredClone(team.equippedTeam), structuredClone(mob.team), {
      seed: `current-equipment-super|${seedPrefix}|${team.id}|${mob.id}`,
      randomizeStats: false,
      maxTime: 70,
      healthInterval: 1,
    });
    if (result.winner === "left") wins += 1;
    damage += result.metrics.leftDamage || 0;
    dotDamage += result.metrics.leftDotDamage || 0;
  }
  return {
    id: team.id,
    label: team.label,
    wins,
    games: mobs.length,
    score: round(wins / mobs.length),
    avgDamage: Math.round(damage / mobs.length),
    avgDotDamage: Math.round(dotDamage / mobs.length),
    inventorySize: team.inventory.length,
    equipSummary: team.equipSummary || {},
  };
}

function autoEquipTeam(presetId, inventory) {
  const baseTeam = clonePreset(presetId);
  const used = new Set();
  const itemsByUnit = baseTeam.map(() => ({}));
  const summary = {};
  for (let unitIndex = 0; unitIndex < baseTeam.length; unitIndex += 1) {
    const unit = baseTeam[unitIndex];
    const role = unit.role;
    summary[unit.name || `${role}-${unitIndex}`] = {};
    for (const slot of SLOT_KEYS) {
      const candidates = inventory
        .filter((item) => item.slot === slot && !used.has(item.id))
        .map((item) => ({ item, score: itemScoreForRole(item, role) }))
        .sort((a, b) => b.score - a.score);
      if (!candidates.length) continue;
      const best = candidates[0];
      used.add(best.item.id);
      itemsByUnit[unitIndex][slot] = best.item;
      summary[unit.name || `${role}-${unitIndex}`][slot] = {
        id: best.item.id,
        rarity: best.item.rarity,
        tier: best.item.tier,
        score: round(best.score, 1),
        affixes: best.item.affixes.map((affix) => affix.stat),
      };
    }
  }
  return { itemsByUnit, summary };
}

function applyEquipmentToPreset(presetId, itemsByUnit) {
  return clonePreset(presetId).map((unit, index) => {
    const equipmentItems = Object.values(itemsByUnit[index] || {}).map((item) => ({
      baseStats: item.baseStats,
      affixes: item.affixes.map((affix) => ({
        id: affix.stat,
        stat: affix.stat,
        value: buildLayerAffixValue(affix.stat, affix.value, true),
      })),
    }));
    const layerItems = equipmentItems.map((item) => ({
      baseStats: Object.fromEntries(Object.entries(item.baseStats || {}).map(([stat, value]) => [stat, buildLayerAffixValue(stat, value)])),
      affixes: item.affixes,
    }));
    return BUILD_LAYERS.applyBuildLayers(unit, {
      equipmentItems: layerItems,
      tags: ["current-equipment-grind-super"],
    });
  });
}

function generateItem(tier, rarityTable, rng) {
  const slotKey = pick(SLOT_KEYS, rng);
  const slot = SLOT_DATA[slotKey];
  const rarity = chooseRarity(rarityTable, rng);
  const equipmentLevel = equipmentLevelForTier(tier);
  const affixes = pickAffixStats(slot.affixPool, rarity.affixes, rng).map((stat) => rollAffix(stat, equipmentLevel, rng));
  const baseStats = rollBaseStats(slot, tier, rarity, rng);
  return {
    id: `sim_item_${Math.floor(rng() * 1e12).toString(36)}`,
    slot: slotKey,
    tier,
    equipmentLevel,
    rarity: rarity.id,
    rarityLabel: rarity.label,
    icon: slot.icon,
    name: `${rarity.label}${slot.label} Lv.${equipmentLevel}`,
    baseStats,
    affixes,
  };
}

function rollBaseStats(slot, tier, rarity, rng) {
  const baseStats = slot.baseOptions ? pick(slot.baseOptions, rng) : (slot.baseStats || []);
  const equipmentLevel = equipmentLevelForTier(tier);
  return Object.fromEntries(baseStats.map((stat) => [stat, rollDirectStatValue(stat, equipmentLevel, rng)]));
}

function rollAffix(stat, equipmentLevel, rng) {
  const level = rollAffixLevel(equipmentLevel);
  return {
    stat,
    value: rollAffixValue(stat, equipmentLevel, rng),
    level,
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
    attackSpeed: 0.0014,
    skillHaste: 0.0014,
    effectPower: 0.0012,
    effectResist: 0.001,
    receivedHealing: 0.0012,
  };
  const value = equipmentLevel * (rows[stat] || 0.12) * variance;
  return percentStats().includes(stat) ? round(value, 3) : Math.max(1, Math.round(value));
}

function equipmentLevelForTier(tier) {
  return EQUIPMENT_LEVEL_BY_TIER[tier] || Math.max(1, Math.round(Number(tier) || 1));
}

function itemScoreForRole(item, role) {
  const baseScore = Object.entries(item.baseStats || {}).reduce((sum, [stat, value]) => sum + normalizedStatScoreForRole(stat, value, role), 0);
  const affixScore = (item.affixes || []).reduce((sum, affix) => sum + normalizedStatScoreForRole(affix.stat, affix.value, role), 0);
  const rarityValue = { common: 1, rare: 1.35, epic: 1.7, legendary: 2.15, mythic: 2.65 }[item.rarity] || 1;
  return item.tier * 22 + rarityValue * 18 + baseScore + affixScore;
}

function normalizedStatScoreForRole(stat, value, role) {
  const numeric = Number(value) || 0;
  if (BUILD_LAYERS.ATTR_ORDER?.includes(stat)) return numeric * 55 * roleAttributeWeight(role, stat);
  const curvePoints = MECHANIC_CURVES.hasMechanicCurve(stat) ? numeric : percentStats().includes(stat) ? numeric * 100 : numeric;
  const curveValue = MECHANIC_CURVES.hasMechanicCurve(stat) ? MECHANIC_CURVES.mechanicCurveValue(stat, curvePoints) * 100 : numeric;
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

function dropTier(score) {
  if (score > 0.85) return 5;
  if (score > 0.62) return 4;
  if (score > 0.38) return 3;
  if (score > 0.18) return 2;
  return 1;
}

function rarityTable(score) {
  if (score > 0.82) return { epic: 0.22, legendary: 0.48, mythic: 0.3 };
  if (score > 0.58) return { epic: 0.48, legendary: 0.36, mythic: 0.16 };
  if (score > 0.34) return { rare: 0.22, epic: 0.46, legendary: 0.25, mythic: 0.07 };
  if (score > 0.15) return { rare: 0.52, epic: 0.34, legendary: 0.14 };
  return { common: 0.62, rare: 0.28, epic: 0.1 };
}

function chooseRarity(table, rng) {
  const roll = rng();
  let cursor = 0;
  for (const rarity of RARITIES) {
    cursor += table[rarity.id] || 0;
    if (roll <= cursor) return rarity;
  }
  return RARITIES.filter((rarity) => table[rarity.id]).pop() || RARITIES[0];
}

function snapshot(tick, progressionScore, scores) {
  return {
    tick,
    progressionScore: round(progressionScore),
    averageScore: scores.average,
    bestScore: scores.best,
    worstScore: scores.worst,
    spread: scores.spread,
    teams: scores.rows,
  };
}

function summarizeRun(timeline) {
  const first = timeline[0];
  const last = timeline[timeline.length - 1];
  const averageSeries = timeline.map((row) => row.averageScore);
  const jumps = seriesJumps(averageSeries);
  return {
    start: pickRunSummary(first),
    end: pickRunSummary(last),
    deltaAverage: round(last.averageScore - first.averageScore),
    deltaBest: round(last.bestScore - first.bestScore),
    deltaWorst: round(last.worstScore - first.worstScore),
    satisfyingJumps: jumps.filter((jump) => jump >= 0.05).length,
    maxJump: round(Math.max(...jumps, 0)),
    plateauTicks: countPlateauTicks(averageSeries),
    finalSpread: last.spread,
  };
}

function summarizeTeams(timeline) {
  const ids = timeline[0].teams.map((team) => team.id);
  return ids.map((id) => {
    const series = timeline.map((row) => row.teams.find((team) => team.id === id));
    const scoreSeries = series.map((row) => row.score);
    const jumps = seriesJumps(scoreSeries);
    const first = series[0];
    const last = series[series.length - 1];
    return {
      id,
      label: last.label,
      startScore: first.score,
      endScore: last.score,
      delta: round(last.score - first.score),
      satisfyingJumps: jumps.filter((jump) => jump >= 0.05).length,
      maxJump: round(Math.max(...jumps, 0)),
      finalInventorySize: last.inventorySize,
      avgDamage: last.avgDamage,
      avgDotDamage: last.avgDotDamage,
      equipSummary: last.equipSummary,
    };
  });
}

function synthesize(runs) {
  const endAverage = runs.map((run) => run.summary.end.averageScore);
  const endBest = runs.map((run) => run.summary.end.bestScore);
  const endWorst = runs.map((run) => run.summary.end.worstScore);
  const deltas = runs.map((run) => run.summary.deltaAverage);
  const strongest = runs.slice().sort((a, b) => b.summary.end.averageScore - a.summary.end.averageScore)[0];
  const weakest = runs.slice().sort((a, b) => a.summary.end.worstScore - b.summary.end.worstScore)[0];
  return {
    aggregate: {
      averageEndAverage: round(avg(endAverage)),
      averageEndBest: round(avg(endBest)),
      averageEndWorst: round(avg(endWorst)),
      averageDeltaAverage: round(avg(deltas)),
      maxDeltaAverage: round(Math.max(...deltas)),
      minDeltaAverage: round(Math.min(...deltas)),
    },
    strongestScenario: { id: strongest.id, teamIds: strongest.teamIds, endAverage: strongest.summary.end.averageScore },
    weakestFloorScenario: { id: weakest.id, teamIds: weakest.teamIds, endWorst: weakest.summary.end.worstScore },
    possibleConclusions: [
      "Super waterline is intentionally harsh; absolute scores should be read as pressure capacity, not normal dungeon clear rate.",
      "If average and best improve but worst remains low, loot is creating a carry/high-roll path but not solving team floor.",
      "If all curves stay flat, current drop quality or role-aware equip scoring is too weak for the super bucket.",
      "If one archetype dominates best-score endings, its affix family should be checked for over-conversion.",
    ],
  };
}

function possibleConclusion(timeline) {
  const summary = summarizeRun(timeline);
  const notes = [];
  if (summary.deltaAverage >= 0.2) notes.push("average growth is visible against super waterline");
  else notes.push("average growth is weak against super waterline");
  if (summary.deltaBest > summary.deltaWorst + 0.12) notes.push("growth is top-heavy; carry/high-roll improves more than floor");
  if (summary.satisfyingJumps >= 3) notes.push("growth has several noticeable jumps");
  if (summary.plateauTicks >= 8) notes.push("many plateau ticks; loot may feel flat between jumps");
  return notes;
}

function pickRunSummary(row) {
  return {
    tick: row.tick,
    averageScore: row.averageScore,
    bestScore: row.bestScore,
    worstScore: row.worstScore,
    spread: row.spread,
  };
}

function renderReport(output) {
  const lines = [];
  lines.push("# Current Equipment Grind vs Super Waterline", "");
  lines.push(`Generated at: ${output.generatedAt}`, "");
  lines.push("## Setup", "");
  lines.push(`- Super waterline sample: ${output.waterline.sample}/${output.waterline.total}`);
  lines.push(`- Avg sampled pressure: ${output.waterline.avgPressure}`);
  lines.push(`- Ticks: ${output.config.ticks}`);
  lines.push(`- Items per team per tick: ${output.config.itemsPerTeamPerTick}`);
  lines.push("", "## Synthesis", "");
  lines.push(`- Average end average: ${output.synthesis.aggregate.averageEndAverage}`);
  lines.push(`- Average end best: ${output.synthesis.aggregate.averageEndBest}`);
  lines.push(`- Average end worst: ${output.synthesis.aggregate.averageEndWorst}`);
  lines.push(`- Average delta: ${output.synthesis.aggregate.averageDeltaAverage}`);
  lines.push(`- Strongest scenario: ${output.synthesis.strongestScenario.id} (${output.synthesis.strongestScenario.teamIds.join(", ")}) end average ${output.synthesis.strongestScenario.endAverage}`);
  lines.push(`- Weakest floor scenario: ${output.synthesis.weakestFloorScenario.id} (${output.synthesis.weakestFloorScenario.teamIds.join(", ")}) end worst ${output.synthesis.weakestFloorScenario.endWorst}`);
  lines.push("", "## Runs", "");
  lines.push("| Run | Teams | Start avg | End avg | End best | End worst | Delta avg | Jumps | Plateau |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const run of output.runs) {
    lines.push(`| ${run.id} | ${run.teamIds.join(", ")} | ${run.summary.start.averageScore} | ${run.summary.end.averageScore} | ${run.summary.end.bestScore} | ${run.summary.end.worstScore} | ${run.summary.deltaAverage} | ${run.summary.satisfyingJumps} | ${run.summary.plateauTicks} |`);
  }
  lines.push("", "## Team End Scores", "");
  for (const run of output.runs) {
    lines.push(`### ${run.id}`, "");
    for (const team of run.teamSummaries) {
      lines.push(`- ${team.id}: ${team.startScore} -> ${team.endScore}, delta ${team.delta}, jumps ${team.satisfyingJumps}, inventory ${team.finalInventorySize}`);
    }
    lines.push("");
  }
  lines.push("## Notes", "");
  for (const note of output.synthesis.possibleConclusions) lines.push(`- ${note}`);
  return `${lines.join("\n")}\n`;
}

function renderConsole(output) {
  return [
    "Current equipment grind vs super waterline complete.",
    `runs=${output.runs.length} sample=${output.waterline.sample}`,
    `avgEnd=${output.synthesis.aggregate.averageEndAverage} avgDelta=${output.synthesis.aggregate.averageDeltaAverage}`,
    `bestEnd=${output.synthesis.aggregate.averageEndBest} worstEnd=${output.synthesis.aggregate.averageEndWorst}`,
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function summarizeAffixCoverage() {
  const roles = {
    fireAmp: ["mage", "alchemist", "ranger"],
    poisonAmp: ["warlock", "alchemist", "assassin"],
    markPower: ["ranger", "assassin"],
    stealthDuration: ["assassin", "ranger"],
    executeDamage: ["assassin", "ranger", "warrior"],
    lowHpDamage: ["berserker", "warlock", "warrior"],
    lowHpHealingReceived: ["berserker", "knight", "warrior"],
    counterDamage: ["knight", "warrior"],
    cleanseEfficiency: ["priest", "bard", "alchemist"],
    auraPower: ["bard", "priest", "knight"],
    shadowAmp: ["assassin", "warlock"],
    arcaneAmp: ["mage", "warlock", "alchemist", "priest", "bard"],
  };
  return Object.entries(AFFIX_DEFS)
    .filter(([, def]) => def.category === "archetype")
    .map(([id, def]) => ({
      id,
      label: def.label,
      roles: roles[id] || [],
      valid: (roles[id] || []).length >= 2,
      slots: Object.entries(SLOT_DATA).filter(([, slot]) => (slot.affixPool || []).includes(id)).map(([key]) => key),
    }));
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

function weightedProgressionScore(scores) {
  return clamp(
    scores.average * CONFIG.scoreWeights.average
      + scores.best * CONFIG.scoreWeights.best
      + scores.worst * CONFIG.scoreWeights.worst,
    0,
    1,
  );
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

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function pickMany(list, count, rng) {
  const pool = [...list];
  const result = [];
  while (pool.length && result.length < count) result.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return result;
}

function pickAffixStats(list, count, rng) {
  const pool = list.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
  const result = [];
  for (let i = 0; i < count; i += 1) result.push(pick(pool, rng));
  return result;
}

function choose(list, count) {
  return list.slice(0, count);
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

function seriesJumps(values) {
  const jumps = [];
  for (let i = 1; i < values.length; i += 1) jumps.push(round(values[i] - values[i - 1]));
  return jumps;
}

function countPlateauTicks(values) {
  return seriesJumps(values).filter((jump) => Math.abs(jump) < 0.015).length;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

if (require.main === module) main();

module.exports = { main };
