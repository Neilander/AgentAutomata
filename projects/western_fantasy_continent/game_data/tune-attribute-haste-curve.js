const fs = require("fs");
const path = require("path");
const { simulateTeams, clonePreset } = require("./combat-sim");
const { applyBuildLayers, ROLE_ATTRS, ATTRIBUTE_STAT_WEIGHTS, attributePointYield } = require("./build-layers");

const OUT_DIR = path.join(__dirname, "..", "design", "attribute_haste_tuning");
const OUT_JSON = path.join(OUT_DIR, "attribute-haste-candidate-scan.json");
const OUT_REPORT = path.join(OUT_DIR, "attribute-haste-candidate-scan.md");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-enhanced-db.json");

const SAMPLE_SIZE = Number(process.env.WATERLINE_SAMPLE || 40);

const CANDIDATES = [
  { id: "old_reference", label: "旧参考", arcanaSkillHaste: 0.018, rhythmSkillHaste: 0.055 },
  { id: "current_cut", label: "当前一刀", arcanaSkillHaste: 0.012, rhythmSkillHaste: 0.04 },
  { id: "soft_cut", label: "轻压节律", arcanaSkillHaste: 0.012, rhythmSkillHaste: 0.035 },
  { id: "medium_cut", label: "中压双源", arcanaSkillHaste: 0.01, rhythmSkillHaste: 0.034 },
  { id: "hard_cut", label: "重压双源", arcanaSkillHaste: 0.008, rhythmSkillHaste: 0.03 },
  { id: "low_arcana_mid_rhythm", label: "低奥术中节律", arcanaSkillHaste: 0.006, rhythmSkillHaste: 0.025 },
  { id: "mid_arcana_low_rhythm", label: "中奥术低节律", arcanaSkillHaste: 0.008, rhythmSkillHaste: 0.022 },
  { id: "very_hard_cut", label: "极压急速", arcanaSkillHaste: 0.006, rhythmSkillHaste: 0.02 },
  { id: "ultra_low_arcana", label: "极低奥术", arcanaSkillHaste: 0.004, rhythmSkillHaste: 0.022 },
  { id: "zero_haste_probe", label: "急速归零探针", arcanaSkillHaste: 0, rhythmSkillHaste: 0 },
];

const PRESETS = [
  { id: "fireBurst", label: "火法", watch: "cap-risk" },
  { id: "poisonBloom", label: "毒队", watch: "cap-risk" },
  { id: "holySustain", label: "牧师续航", watch: "injury-risk" },
  { id: "crownCarry", label: "王冠核心", watch: "injury-risk" },
  { id: "lightningTempo", label: "闪电节奏", watch: "injury-risk" },
  { id: "alchemyChaos", label: "炼金混沌", watch: "injury-risk" },
];

const ROUTES = [
  { id: "base", label: "无加点", pointsFor: () => ({}) },
  { id: "main10", label: "10主", pointsFor: (role) => ({ [mainAttr(role)]: 10 }) },
  { id: "secondary10", label: "10副", pointsFor: (role) => ({ [secondaryAttr(role)]: 10 }) },
  { id: "mixed55", label: "5主5副", pointsFor: (role) => ({ [mainAttr(role)]: 5, [secondaryAttr(role)]: 5 }) },
  { id: "arcana10", label: "10奥术", pointsFor: () => ({ arcana: 10 }) },
  { id: "rhythm10", label: "10节律", pointsFor: () => ({ rhythm: 10 }) },
];

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterline = sampleWaterline(readJson(WATERLINE_FILE).teams, SAMPLE_SIZE);
  const output = {
    schema: "western_fantasy_attribute_haste_tuning_v1",
    generatedAt: new Date().toISOString(),
    sampleSize: waterline.length,
    candidates: CANDIDATES.map((candidate) => runCandidate(candidate, waterline)),
  };
  output.analysis = analyze(output.candidates);
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_REPORT, renderReport(output), "utf8");
  console.log(renderConsole(output));
}

function runCandidate(candidate, waterline) {
  const rows = [];
  for (const preset of PRESETS) {
    for (const route of ROUTES) {
      const team = applyRouteToPreset(preset.id, route, candidate);
      rows.push(scoreTeam(candidate, preset, route, team, waterline));
    }
  }
  return {
    ...candidate,
    rows,
    summary: summarizeCandidate(rows),
  };
}

function applyRouteToPreset(presetId, route, candidate) {
  return clonePreset(presetId).map((unit) => {
    const points = route.pointsFor(unit.role);
    if (!Object.values(points).some(Boolean)) return unit;
    return applyBuildLayers(unit, {
      equipmentModifiers: candidateBundle(points, candidate),
      tags: [`attribute-haste-tuning:${candidate.id}:${route.id}`],
    });
  });
}

function candidateBundle(points, candidate) {
  const weights = {
    ...ATTRIBUTE_STAT_WEIGHTS,
    arcana: { ...ATTRIBUTE_STAT_WEIGHTS.arcana, skillHaste: candidate.arcanaSkillHaste },
    rhythm: { ...ATTRIBUTE_STAT_WEIGHTS.rhythm, skillHaste: candidate.rhythmSkillHaste },
  };
  const bundle = {
    source: "attribute-haste-tuning",
    maxHpAdd: 0,
    physicalPowerAdd: 0,
    magicPowerAdd: 0,
    armorAdd: 0,
    attackSpeedMult: 1,
    skillHasteMult: 1,
    effectPowerMult: 1,
    effectResistPct: 0,
    receivedHealingMult: 1,
    mechanicModifiers: {},
    notes: [],
    debug: { points, candidate: candidate.id },
  };
  for (const [attr, raw] of Object.entries(points || {})) {
    const yieldValue = attributePointYield(raw);
    const row = weights[attr] || {};
    bundle.maxHpAdd += (row.hp || 0) * yieldValue;
    bundle.physicalPowerAdd += (row.physicalPower || 0) * yieldValue;
    bundle.magicPowerAdd += (row.magicPower || 0) * yieldValue;
    bundle.armorAdd += (row.armor || 0) * yieldValue;
    bundle.attackSpeedMult *= 1 + (row.attackSpeed || 0) * yieldValue;
    bundle.skillHasteMult *= 1 + (row.skillHaste || 0) * yieldValue;
    bundle.effectPowerMult *= 1 + (row.effectPower || 0) * yieldValue;
    bundle.effectResistPct += (row.effectResist || 0) * yieldValue;
    bundle.receivedHealingMult *= 1 + (row.receivedHealing || 0) * yieldValue;
  }
  bundle.maxHpAdd = round(bundle.maxHpAdd);
  bundle.physicalPowerAdd = round(bundle.physicalPowerAdd);
  bundle.magicPowerAdd = round(bundle.magicPowerAdd);
  bundle.armorAdd = round(bundle.armorAdd);
  bundle.attackSpeedMult = round(bundle.attackSpeedMult, 4);
  bundle.skillHasteMult = round(bundle.skillHasteMult, 4);
  bundle.effectPowerMult = round(bundle.effectPowerMult, 4);
  bundle.effectResistPct = round(Math.min(0.5, bundle.effectResistPct), 4);
  bundle.receivedHealingMult = round(bundle.receivedHealingMult, 4);
  return bundle;
}

function scoreTeam(candidate, preset, route, team, waterline) {
  let wins = 0;
  let damage = 0;
  let dotDamage = 0;
  let duration = 0;
  for (const mob of waterline) {
    const result = simulateTeams(structuredClone(team), structuredClone(mob.team), {
      seed: `attribute-haste|fixed|${preset.id}|${route.id}|${mob.id}`,
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
    preset: preset.id,
    label: preset.label,
    watch: preset.watch,
    route: route.id,
    routeLabel: route.label,
    score: round(wins / waterline.length),
    avgDamage: Math.round(damage / waterline.length),
    avgDotDamage: Math.round(dotDamage / waterline.length),
    avgDuration: round(duration / waterline.length, 1),
  };
}

function summarizeCandidate(rows) {
  const byPreset = Object.fromEntries(PRESETS.map((preset) => [preset.id, rows.filter((row) => row.preset === preset.id)]));
  const fireMain = findScore(byPreset.fireBurst, "main10");
  const fireSec = findScore(byPreset.fireBurst, "secondary10");
  const poisonMain = findScore(byPreset.poisonBloom, "main10");
  const poisonSec = findScore(byPreset.poisonBloom, "secondary10");
  const injuryRows = rows.filter((row) => row.watch === "injury-risk" && row.route !== "base");
  const capRows = rows.filter((row) => row.watch === "cap-risk" && row.route !== "base");
  const capRisk = avg(capRows.map((row) => Math.max(0, row.score - 0.88)));
  const hardCapCount = capRows.filter((row) => row.score >= 0.98).length;
  const supportAverage = avg(injuryRows.map((row) => row.score));
  const firePoisonAverage = avg(capRows.map((row) => row.score));
  const supportFloorPenalty = Math.max(0, 0.72 - supportAverage) * 2;
  return {
    fireMain,
    fireSecondary: fireSec,
    poisonMain,
    poisonSecondary: poisonSec,
    firePoisonAverage: round(firePoisonAverage),
    supportAverage: round(supportAverage),
    capRisk: round(capRisk),
    hardCapCount,
    supportFloorPenalty: round(supportFloorPenalty),
    candidateScore: round((1 - capRisk * 3) * 0.55 + supportAverage * 0.3 + (1 - Math.abs(firePoisonAverage - 0.86)) * 0.15 - hardCapCount * 0.015 - supportFloorPenalty),
  };
}

function analyze(candidates) {
  const ranked = [...candidates].sort((a, b) => b.summary.candidateScore - a.summary.candidateScore);
  return {
    best: ranked[0]?.id,
    ranking: ranked.map((candidate) => ({
      id: candidate.id,
      score: candidate.summary.candidateScore,
      firePoisonAverage: candidate.summary.firePoisonAverage,
      supportAverage: candidate.summary.supportAverage,
      capRisk: candidate.summary.capRisk,
      hardCapCount: candidate.summary.hardCapCount,
      supportFloorPenalty: candidate.summary.supportFloorPenalty,
      fireMain: candidate.summary.fireMain,
      poisonMain: candidate.summary.poisonMain,
    })),
  };
}

function renderReport(output) {
  const lines = [];
  lines.push("# Attribute Skill Haste Candidate Scan", "");
  lines.push(`Generated at: ${output.generatedAt}`);
  lines.push(`Waterline sample size: ${output.sampleSize}`, "");
  lines.push("## Ranking", "");
  lines.push("| Candidate | Score | Fire/Poison Avg | Support Avg | Cap Risk | Hard Caps | Support Penalty | Fire 10主 | Poison 10主 |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const row of output.analysis.ranking) {
    lines.push(`| ${row.id} | ${row.score} | ${row.firePoisonAverage} | ${row.supportAverage} | ${row.capRisk} | ${row.hardCapCount} | ${row.supportFloorPenalty} | ${row.fireMain} | ${row.poisonMain} |`);
  }
  lines.push("", "## Candidate Details", "");
  for (const candidate of output.candidates) {
    lines.push(`### ${candidate.id}`, "");
    lines.push(`- arcanaSkillHaste: ${candidate.arcanaSkillHaste}`);
    lines.push(`- rhythmSkillHaste: ${candidate.rhythmSkillHaste}`);
    lines.push(`- candidateScore: ${candidate.summary.candidateScore}`);
    lines.push("");
    lines.push("| Preset | Base | 10主 | 10副 | 5主5副 | 10奥术 | 10节律 |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
    for (const preset of PRESETS) {
      const rows = candidate.rows.filter((row) => row.preset === preset.id);
      lines.push(`| ${preset.label} | ${findScore(rows, "base")} | ${findScore(rows, "main10")} | ${findScore(rows, "secondary10")} | ${findScore(rows, "mixed55")} | ${findScore(rows, "arcana10")} | ${findScore(rows, "rhythm10")} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderConsole(output) {
  const best = output.analysis.ranking[0];
  return [
    "Attribute skill haste candidate scan complete.",
    `sample=${output.sampleSize}`,
    `best=${best.id} score=${best.score} firePoison=${best.firePoisonAverage} support=${best.supportAverage} capRisk=${best.capRisk}`,
    `report=${OUT_REPORT}`,
  ].join("\n");
}

function sampleWaterline(teams, sampleSize) {
  if (!sampleSize || teams.length <= sampleSize) return teams;
  const result = [];
  for (let i = 0; i < sampleSize; i += 1) {
    result.push(teams[Math.floor(i * teams.length / sampleSize)]);
  }
  return result;
}

function mainAttr(role) {
  return ROLE_ATTRS[role]?.[0] || "might";
}

function secondaryAttr(role) {
  return ROLE_ATTRS[role]?.[1] || mainAttr(role);
}

function findScore(rows, route) {
  return rows.find((row) => row.route === route)?.score ?? 0;
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 3) {
  return Number((Number(value) || 0).toFixed(digits));
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

if (require.main === module) main();

module.exports = { main };
