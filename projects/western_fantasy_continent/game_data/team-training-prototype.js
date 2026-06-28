const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");

const OUT_DIR = path.join(__dirname, "..", "design", "team_training");
const DATASET_FILE = path.join(OUT_DIR, "team-training-dataset.json");
const MODEL_FILE = path.join(OUT_DIR, "team-generator-model.json");
const REPORT_FILE = path.join(OUT_DIR, "team-generator-report.md");

const DATASET_SCHEMA = "western_fantasy_team_training_v1";
const MODEL_SCHEMA = "western_fantasy_team_generator_model_v1";
const VERSION = {
  combatEngine: "combat-sim-current",
  skillData: SKILL_DATA.assetVersion || SKILL_DATA.version || "unknown",
  generator: "team-training-prototype-v1",
};

const ROLE_KEYS = Object.keys(SKILL_DATA.roleKits || {});
const PRESET_KEYS = Object.keys(SKILL_DATA.presets || {});
const DEFAULT_SAMPLES = 180;
const DEFAULT_RECOMMEND_ROLE = "assassin";
const DEFAULT_CANDIDATES = 18;
const DEFAULT_SEEDS_PER_PRESET = 2;

function run() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || "all";
  const samples = Number(args.samples || DEFAULT_SAMPLES);
  const role = args.role || DEFAULT_RECOMMEND_ROLE;
  const target = args.target || "";
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let dataset = null;
  let model = null;
  let recommendations = null;

  if (mode === "generate" || mode === "all") {
    dataset = generateDataset(samples);
    writeJson(DATASET_FILE, dataset);
  } else {
    dataset = readJson(DATASET_FILE);
  }

  if (mode === "train" || mode === "all" || mode === "recommend") {
    model = trainModel(dataset);
    writeJson(MODEL_FILE, model);
  } else {
    model = readJson(MODEL_FILE);
  }

  if (mode === "recommend" || mode === "all") {
    recommendations = recommendTeams(role, model, dataset, {
      candidates: Number(args.candidates || DEFAULT_CANDIDATES),
      seedsPerPreset: Number(args.seeds || DEFAULT_SEEDS_PER_PRESET),
      targetPreset: target,
    });
    fs.writeFileSync(REPORT_FILE, renderReport({ dataset, model, recommendations, role, target }), "utf8");
  }

  console.log(`wrote ${path.relative(process.cwd(), DATASET_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), MODEL_FILE)}`);
  if (recommendations) console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
}

function generateDataset(sampleCount) {
  const rolePools = buildRolePools();
  const rng = seededRandom(`team-training|${VERSION.skillData}|${sampleCount}`);
  const samples = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const left = buildGeneratedTeam(rolePools, rng, `L${index}`);
    const right = buildOpponentTeam(rolePools, rng, index);
    const result = simulateTeams(left.map(toCombatUnit), right.map(toCombatUnit), {
      seed: `team-training-combat|${VERSION.skillData}|${index}`,
      randomizeStats: true,
      maxTime: 75,
    });
    samples.push(serializeMatch(index, left, right, result, "generated_vs_generated"));
  }

  for (const [presetKey, preset] of Object.entries(SKILL_DATA.presets || {})) {
    for (let seed = 0; seed < 3; seed += 1) {
      const left = preset.team.map((unit, index) => characterToken(unit, `preset:${presetKey}:${index}`));
      const right = buildGeneratedTeam(rolePools, seededRandom(`preset-opponent|${presetKey}|${seed}`), `P${seed}`);
      const result = simulateTeams(left.map(toCombatUnit), right.map(toCombatUnit), {
        seed: `team-training-preset|${presetKey}|${seed}`,
        randomizeStats: true,
        maxTime: 75,
      });
      samples.push(serializeMatch(samples.length, left, right, result, `preset:${presetKey}`));
    }
  }

  return {
    schema: DATASET_SCHEMA,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    sampleCount: samples.length,
    roleCount: ROLE_KEYS.length,
    presetCount: PRESET_KEYS.length,
    samples,
  };
}

function trainModel(dataset) {
  const roleScores = Object.fromEntries(ROLE_KEYS.map((role) => [role, emptyScore()]));
  const skillScores = {};
  const rolePairScores = {};
  const skillPairScores = {};
  const winnerTeams = [];

  for (const sample of dataset.samples || []) {
    const winnerSide = sample.result.winner;
    const loserSide = winnerSide === "left" ? "right" : "left";
    const winner = sample[winnerSide];
    const loser = sample[loserSide];
    const weight = scoreWeight(sample.result);
    winnerTeams.push({
      sampleId: sample.id,
      side: winnerSide,
      winRateProxy: round(sample.result.hpMargin, 3),
      roles: winner.characters.map((unit) => unit.role),
      skillKeys: winner.characters.flatMap((unit) => unit.skillKeys),
      characters: winner.characters,
    });
    addTeamScore(roleScores, skillScores, winner.characters, weight);
    addPairScores(rolePairScores, winner.characters.map((unit) => unit.role), weight);
    addPairScores(skillPairScores, winner.characters.flatMap((unit) => unit.skillKeys), weight * 0.35);
    addTeamScore(roleScores, skillScores, loser.characters, -weight * 0.35);
  }

  normalizeScores(roleScores);
  normalizeScores(skillScores);

  return {
    schema: MODEL_SCHEMA,
    version: VERSION,
    trainedAt: new Date().toISOString(),
    sourceDataset: path.relative(path.dirname(MODEL_FILE), DATASET_FILE).replace(/\\/g, "/"),
    sampleCount: dataset.samples?.length || 0,
    roleScores,
    skillScores,
    rolePairScores: normalizePairScores(rolePairScores),
    skillPairScores: normalizePairScores(skillPairScores),
    winnerTeams: winnerTeams
      .sort((a, b) => b.winRateProxy - a.winRateProxy)
      .slice(0, 80),
  };
}

function recommendTeams(coreRole, model, dataset, options = {}) {
  if (!SKILL_DATA.roleKits[coreRole]) throw new Error(`Unknown role: ${coreRole}`);
  if (options.targetPreset && !SKILL_DATA.presets[options.targetPreset]) throw new Error(`Unknown target preset: ${options.targetPreset}`);
  const rolePools = buildRolePools();
  const candidates = [];
  const seen = new Set();
  const targetCount = options.candidates || DEFAULT_CANDIDATES;

  const addCandidate = (team, source) => {
    const normalized = normalizeTeam(team);
    const key = teamKey(normalized);
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ source, team: normalized, modelScore: scoreTeam(normalized, model, coreRole) });
  };

  for (const preset of Object.values(SKILL_DATA.presets || {})) {
    if (!preset.team.some((unit) => unit.role === coreRole)) continue;
    addCandidate(preset.team.map((unit, index) => characterToken(unit, `preset-candidate:${index}`)), "preset-containing-core");
  }

  for (const winner of model.winnerTeams || []) {
    if (!winner.roles.includes(coreRole)) continue;
    addCandidate(winner.characters.map((unit, index) => characterToken(unit, `winner:${winner.sampleId}:${index}`)), "winning-memory");
  }

  const rng = seededRandom(`recommend|${coreRole}|${VERSION.skillData}`);
  while (candidates.length < targetCount * 4) {
    addCandidate(buildModelGuidedTeam(coreRole, rolePools, model, rng), "model-guided-mutation");
  }

  const ranked = candidates
    .sort((a, b) => b.modelScore - a.modelScore)
    .slice(0, targetCount)
    .map((candidate, index) => ({
      id: index + 1,
      ...candidate,
      validation: validateCandidate(candidate.team, index, options.seedsPerPreset || DEFAULT_SEEDS_PER_PRESET, {
        coreRole,
        targetPreset: options.targetPreset || "",
      }),
      similarity: presetSimilarity(candidate.team),
      structureTags: structureTags(candidate.team),
    }))
    .sort((a, b) => {
      if (options.targetPreset) return b.validation.targetWinRate - a.validation.targetWinRate || b.validation.avgWinRate - a.validation.avgWinRate || b.modelScore - a.modelScore;
      return b.validation.avgWinRate - a.validation.avgWinRate || b.modelScore - a.modelScore;
    });

  return {
    role: coreRole,
    targetPreset: options.targetPreset || "",
    generatedAt: new Date().toISOString(),
    candidatesRequested: targetCount,
    candidates: ranked,
  };
}

function validateCandidate(team, candidateIndex, seedsPerPreset, context = {}) {
  const results = [];
  for (const presetKey of PRESET_KEYS) {
    let wins = 0;
    let damage = 0;
    let hp = 0;
    let duration = 0;
    let coreDamage = 0;
    let coreAlive = 0;
    let coreDeaths = 0;
    let coreBlink = 0;
    let coreAutoUltimate = 0;
    let coreDamageShare = 0;
    let teamShield = 0;
    let teamHealing = 0;
    for (let seed = 0; seed < seedsPerPreset; seed += 1) {
      const result = simulateTeams(team.map(toCombatUnit), clonePreset(presetKey), {
        seed: `recommend-validate|${candidateIndex}|${presetKey}|${seed}`,
        randomizeStats: true,
        maxTime: 75,
      });
      if (result.winner === "left") wins += 1;
      damage += result.metrics.leftDamage;
      hp += result.leftHp;
      duration += result.duration;
      const contribution = coreContribution(result, context.coreRole);
      coreDamage += contribution.damage;
      coreAlive += contribution.alive;
      coreDeaths += contribution.deaths;
      coreBlink += contribution.blinks;
      coreAutoUltimate += contribution.autoUltimates;
      coreDamageShare += contribution.damageShare;
      teamShield += result.metrics.leftShield || 0;
      teamHealing += result.metrics.leftHealing || 0;
    }
    results.push({
      presetKey,
      presetName: SKILL_DATA.presets[presetKey]?.name || presetKey,
      winRate: wins / seedsPerPreset,
      avgDamage: round(damage / seedsPerPreset, 1),
      avgHp: round(hp / seedsPerPreset, 2),
      avgDuration: round(duration / seedsPerPreset, 1),
      core: {
        avgDamage: round(coreDamage / seedsPerPreset, 1),
        damageShare: round(coreDamageShare / seedsPerPreset, 3),
        aliveRate: round(coreAlive / seedsPerPreset, 3),
        deaths: round(coreDeaths / seedsPerPreset, 2),
        blinks: round(coreBlink / seedsPerPreset, 2),
        autoUltimates: round(coreAutoUltimate / seedsPerPreset, 2),
      },
      sustain: {
        shield: round(teamShield / seedsPerPreset, 1),
        healing: round(teamHealing / seedsPerPreset, 1),
      },
    });
  }
  const target = context.targetPreset ? results.find((item) => item.presetKey === context.targetPreset) : null;
  return {
    avgWinRate: round(average(results.map((item) => item.winRate)), 3),
    targetPreset: context.targetPreset || "",
    targetWinRate: target ? round(target.winRate, 3) : 0,
    targetCore: target?.core || null,
    presetsBeaten: results.filter((item) => item.winRate >= 0.5).length,
    bestMatchups: results.filter((item) => item.winRate >= 0.75).map((item) => item.presetKey),
    worstMatchups: results.filter((item) => item.winRate <= 0.25).map((item) => item.presetKey),
    coreAverage: averageCore(results.map((item) => item.core)),
    results,
  };
}

function coreContribution(result, coreRole) {
  const coreUnits = result.units.filter((unit) => unit.side === "left" && unit.role === coreRole);
  const coreIds = new Set(coreUnits.map((unit) => unit.id));
  const coreDamage = coreUnits.reduce((sum, unit) => sum + (unit.damageDone || 0), 0);
  const teamDamage = Math.max(1, result.metrics.leftDamage || 0);
  const sourceSignals = result.signals.filter((signal) => signal.source?.side === "left" && coreIds.has(signal.source.id));
  return {
    damage: coreDamage,
    damageShare: coreDamage / teamDamage,
    alive: coreUnits.length ? coreUnits.filter((unit) => unit.alive).length / coreUnits.length : 0,
    deaths: coreUnits.filter((unit) => !unit.alive).length,
    blinks: sourceSignals.filter((signal) => signal.tags.includes("blink")).length,
    autoUltimates: sourceSignals.filter((signal) => signal.tags.includes("autoUltimate")).length,
  };
}

function averageCore(rows) {
  if (!rows.length) return {};
  return {
    avgDamage: round(average(rows.map((row) => row.avgDamage)), 1),
    damageShare: round(average(rows.map((row) => row.damageShare)), 3),
    aliveRate: round(average(rows.map((row) => row.aliveRate)), 3),
    deaths: round(average(rows.map((row) => row.deaths)), 2),
    blinks: round(average(rows.map((row) => row.blinks)), 2),
    autoUltimates: round(average(rows.map((row) => row.autoUltimates)), 2),
  };
}

function presetSimilarity(team) {
  const teamRoles = new Set(team.map((unit) => `role:${unit.role}`));
  const teamSkills = new Set(team.flatMap((unit) => unit.skillKeys.map((skill) => `skill:${skill}`)));
  const teamSet = new Set([...teamRoles, ...teamSkills]);
  const similarities = Object.entries(SKILL_DATA.presets || {}).map(([presetKey, preset]) => {
    const presetSet = new Set([
      ...preset.team.map((unit) => `role:${unit.role}`),
      ...preset.team.flatMap((unit) => [unit.small1, unit.small2, unit.passive, unit.ultimate].map((skill) => `skill:${skill}`)),
    ]);
    const intersection = [...teamSet].filter((item) => presetSet.has(item)).length;
    const union = new Set([...teamSet, ...presetSet]).size;
    return { presetKey, score: union ? intersection / union : 0 };
  }).sort((a, b) => b.score - a.score);
  return {
    nearestPreset: similarities[0]?.presetKey || "",
    nearestScore: round(similarities[0]?.score || 0, 3),
    top: similarities.slice(0, 3).map((item) => ({ presetKey: item.presetKey, score: round(item.score, 3) })),
  };
}

function structureTags(team) {
  const roles = team.map((unit) => unit.role);
  const tags = [];
  const count = (pool) => roles.filter((role) => pool.includes(role)).length;
  const hasSkillTag = (tag) => team.some((unit) => unit.skills.some((skill) => skill.tokens.includes(tag)));
  const frontCount = count(["warrior", "knight", "berserker", "priest"]);
  const supportCount = count(["priest", "bard", "knight", "alchemist", "warlock"]);
  const carryCount = count(["assassin", "ranger", "mage", "warlock", "berserker"]);
  if (frontCount >= 2) tags.push("double-front");
  if (supportCount >= 2) tags.push("support-heavy");
  if (carryCount >= 2) tags.push("multi-carry");
  if (roles.includes("assassin") && hasSkillTag("keyword:backline")) tags.push("backline-dive");
  if (roles.includes("berserker") && hasSkillTag("risk:selfDamage")) tags.push("risk-frontline");
  if (hasSkillTag("keyword:mark")) tags.push("mark-engine");
  if (hasSkillTag("keyword:poison")) tags.push("poison-engine");
  if (hasSkillTag("keyword:burn")) tags.push("burn-engine");
  if (hasSkillTag("function:shield") && hasSkillTag("function:heal")) tags.push("sustain-shell");
  if (hasSkillTag("function:window")) tags.push("window-tempo");
  return tags;
}

function buildRolePools() {
  const pools = Object.fromEntries(ROLE_KEYS.map((roleKey) => [roleKey, { small: [], passive: [], ultimate: [] }]));
  for (const [roleKey, role] of Object.entries(SKILL_DATA.roleKits || {})) {
    addUnique(pools[roleKey].small, role.kit.small1);
    addUnique(pools[roleKey].small, role.kit.small2);
    addUnique(pools[roleKey].passive, role.kit.passive);
    addUnique(pools[roleKey].ultimate, role.kit.ultimate);
  }
  for (const [skillKey, skill] of Object.entries(SKILL_DATA.skills || {})) {
    for (const roleKey of skill.roleKeys || []) {
      if (!pools[roleKey]) continue;
      if (skill.type === SKILL_DATA.TYPE.SMALL) addUnique(pools[roleKey].small, skillKey);
      else if (skill.type === SKILL_DATA.TYPE.PASSIVE) addUnique(pools[roleKey].passive, skillKey);
      else if (skill.type === SKILL_DATA.TYPE.ULT) addUnique(pools[roleKey].ultimate, skillKey);
    }
  }
  return pools;
}

function buildGeneratedTeam(rolePools, rng, tag) {
  const roles = pickTeamRoles(rng);
  return roles.map((role, index) => randomCharacter(role, rolePools, rng, `${tag}:${index}`));
}

function buildOpponentTeam(rolePools, rng, sampleIndex) {
  if (sampleIndex % 5 === 0 && PRESET_KEYS.length) {
    return clonePreset(pick(PRESET_KEYS, rng)).map((unit, index) => characterToken(unit, `opponent-preset:${sampleIndex}:${index}`));
  }
  return buildGeneratedTeam(rolePools, rng, `R${sampleIndex}`);
}

function pickTeamRoles(rng) {
  const front = ["warrior", "knight", "berserker", "priest"];
  const carry = ["assassin", "ranger", "mage", "warlock", "berserker", "alchemist"];
  const support = ["priest", "bard", "knight", "alchemist", "warlock"];
  const flex = ROLE_KEYS;
  return [pick(front, rng), pick(carry, rng), pick(support, rng), pick(flex, rng)];
}

function buildModelGuidedTeam(coreRole, rolePools, model, rng) {
  const roles = [coreRole];
  while (roles.length < 4) {
    roles.push(weightedPickRole(ROLE_KEYS, (role) => rolePartnerScore(coreRole, role, model) + roleBaseScore(role, model), rng));
  }
  return roles.map((role, index) => modelGuidedCharacter(role, rolePools, model, rng, `guided:${coreRole}:${index}`));
}

function modelGuidedCharacter(role, rolePools, model, rng, id) {
  const pool = rolePools[role];
  const small = pickManyWeighted(pool.small, 2, (skill) => skillBaseScore(skill, model), rng);
  return characterToken({
    role,
    small1: small[0],
    small2: small[1],
    passive: weightedPick(pool.passive, (skill) => skillBaseScore(skill, model), rng),
    ultimate: weightedPick(pool.ultimate, (skill) => skillBaseScore(skill, model), rng),
  }, id);
}

function randomCharacter(role, rolePools, rng, id) {
  const pool = rolePools[role];
  const small = pickMany(pool.small, 2, rng);
  return characterToken({
    role,
    small1: small[0],
    small2: small[1],
    passive: pick(pool.passive, rng),
    ultimate: pick(pool.ultimate, rng),
  }, id);
}

function characterToken(unit, id) {
  const role = SKILL_DATA.roleKits[unit.role];
  if (!role) throw new Error(`Unknown role in character token: ${unit.role}`);
  const skills = [unit.small1, unit.small2, unit.passive, unit.ultimate].map((key) => skillToken(key));
  const baseStats = {
    hp: Number(unit.hp ?? role.hp),
    power: Number(unit.power ?? role.power),
    armor: Number(unit.armor ?? role.armor),
    range: Number(unit.range ?? role.range),
    attackType: unit.attackType || (["mage", "priest", "warlock", "bard", "alchemist"].includes(unit.role) ? "arcane" : "physical"),
  };
  return {
    id,
    role: unit.role,
    roleName: role.role,
    baseStats,
    slotIndex: Number.isFinite(unit.slotIndex) ? unit.slotIndex : undefined,
    small1: unit.small1,
    small2: unit.small2,
    passive: unit.passive,
    ultimate: unit.ultimate,
    skillKeys: [unit.small1, unit.small2, unit.passive, unit.ultimate],
    skills,
    tokenText: [
      `role:${unit.role}`,
      `hp:${baseStats.hp}`,
      `power:${baseStats.power}`,
      `armor:${baseStats.armor}`,
      `range:${baseStats.range}`,
      ...skills.flatMap((skill) => skill.tokens),
    ].join(" "),
    vector: characterVector(baseStats, skills),
  };
}

function skillToken(skillKey) {
  const skill = SKILL_DATA.skills[skillKey];
  if (!skill) return { key: skillKey, name: skillKey, type: "unknown", tokens: [`skill:${skillKey}`], vector: {} };
  const effectTags = (skill.effects || []).flatMap(effectTagsFor);
  const tokens = [
    `skill:${skillKey}`,
    `skillType:${skill.type}`,
    `cooldown:${bucket(skill.cooldown || 0, [0, 6, 10, 18, 30])}`,
    ...effectTags,
  ];
  return {
    key: skillKey,
    name: skill.name,
    type: skill.type,
    cooldown: skill.cooldown || 0,
    openingCooldown: skill.openingCooldown || 0,
    effects: skill.effects || [],
    tokens: Array.from(new Set(tokens)),
    vector: vectorFromTags(effectTags),
  };
}

function effectTagsFor(effect) {
  const tags = [`effect:${effect.kind}`];
  if (effect.type) tags.push(`damageType:${effect.type}`);
  if (effect.scaleWith) tags.push(`scale:${effect.scaleWith}`);
  if (effect.timer) tags.push(`timer:${effect.timer}`);
  if (effect.kind.includes("Shield") || effect.kind === "teamShield") tags.push("function:shield");
  if (effect.kind.includes("Heal") || effect.kind === "teamHeal") tags.push("function:heal");
  if (effect.kind.includes("hit") || effect.kind === "arrowStorm" || effect.kind === "meteorRain") tags.push("function:damage");
  if (effect.kind.includes("Poison") || effect.kind === "poisonTarget") tags.push("keyword:poison");
  if (effect.kind.includes("burn") || effect.kind === "burnTarget") tags.push("keyword:burn");
  if (effect.kind.includes("mark") || effect.kind === "markTarget") tags.push("keyword:mark");
  if (effect.kind === "blinkBacklineStrike") tags.push("keyword:backline", "keyword:blink", "function:targeting");
  if (effect.kind === "chargeToTarget") tags.push("keyword:charge", "function:targeting");
  if (effect.kind === "selfRawDamage") tags.push("risk:selfDamage");
  if (effect.kind === "teamTimer" || effect.kind === "timer") tags.push("function:window");
  if (effect.count && effect.count > 1) tags.push("shape:multiTarget");
  return tags;
}

function characterVector(baseStats, skills) {
  const vector = {
    hp: baseStats.hp / 350,
    power: baseStats.power / 60,
    armor: baseStats.armor / 14,
    range: baseStats.range / 40,
  };
  for (const skill of skills) {
    for (const [key, value] of Object.entries(skill.vector || {})) {
      vector[key] = (vector[key] || 0) + value;
    }
  }
  return roundObject(vector, 4);
}

function vectorFromTags(tags) {
  const vector = {};
  for (const tag of tags) vector[tag] = (vector[tag] || 0) + 1;
  return vector;
}

function serializeMatch(id, left, right, result, source) {
  const resultSummary = {
    winner: result.winner,
    duration: result.duration,
    leftHp: result.leftHp,
    rightHp: result.rightHp,
    hpMargin: round(result.leftHp - result.rightHp, 3),
    metrics: result.metrics,
    signalSummary: summarizeSignals(result.signals),
  };
  return {
    id,
    source,
    version: VERSION,
    left: { characters: normalizeTeam(left), teamVector: teamVector(left) },
    right: { characters: normalizeTeam(right), teamVector: teamVector(right) },
    result: resultSummary,
  };
}

function summarizeSignals(signals) {
  const side = (sideKey, tags, sourceOrTarget = "source") => signals
    .filter((signal) => signal[sourceOrTarget]?.side === sideKey && tags.every((tag) => signal.tags.includes(tag)))
    .reduce((sum, signal) => sum + (signal.amount || 0), 0);
  return {
    left: {
      damage: round(side("left", ["damage"]), 1),
      basicDamage: round(side("left", ["basic", "damage"]), 1),
      skillDamage: round(side("left", ["skill", "damage"]), 1),
      healing: round(side("left", ["heal"], "target"), 1),
      shield: round(side("left", ["shield"], "target"), 1),
      marks: round(side("left", ["mark"]), 1),
      deaths: signals.filter((signal) => signal.kind === "death" && signal.target?.side === "left").length,
    },
    right: {
      damage: round(side("right", ["damage"]), 1),
      basicDamage: round(side("right", ["basic", "damage"]), 1),
      skillDamage: round(side("right", ["skill", "damage"]), 1),
      healing: round(side("right", ["heal"], "target"), 1),
      shield: round(side("right", ["shield"], "target"), 1),
      marks: round(side("right", ["mark"]), 1),
      deaths: signals.filter((signal) => signal.kind === "death" && signal.target?.side === "right").length,
    },
  };
}

function toCombatUnit(character, index = 0) {
  return {
    role: character.role,
    name: `${character.roleName || character.role}-${index + 1}`,
    small1: character.small1,
    small2: character.small2,
    passive: character.passive,
    ultimate: character.ultimate,
    hp: character.baseStats.hp,
    power: character.baseStats.power,
    armor: character.baseStats.armor,
    range: character.baseStats.range,
    attackType: character.baseStats.attackType,
    slotIndex: Number.isFinite(character.slotIndex) ? character.slotIndex : index,
  };
}

function normalizeTeam(team) {
  return team.map((unit, index) => ({
    ...unit,
    slotIndex: Number.isFinite(unit.slotIndex) ? unit.slotIndex : index,
  }));
}

function teamVector(team) {
  const out = {};
  for (const unit of team) {
    for (const [key, value] of Object.entries(unit.vector || {})) out[key] = (out[key] || 0) + value;
  }
  return roundObject(out, 4);
}

function scoreWeight(result) {
  return 1 + Math.max(-1, Math.min(1, result.hpMargin || 0)) * 0.25;
}

function addTeamScore(roleScores, skillScores, characters, weight) {
  for (const unit of characters) {
    addScore(roleScores[unit.role] ||= emptyScore(), weight);
    for (const skillKey of unit.skillKeys || []) {
      addScore(skillScores[skillKey] ||= emptyScore(), weight);
    }
  }
}

function addPairScores(store, items, weight) {
  const unique = [...new Set(items.filter(Boolean))];
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const key = pairKey(unique[i], unique[j]);
      store[key] ||= emptyScore();
      addScore(store[key], weight);
    }
  }
}

function scoreTeam(team, model, coreRole) {
  let score = 0;
  for (const unit of team) {
    score += roleBaseScore(unit.role, model);
    if (unit.role !== coreRole) score += rolePartnerScore(coreRole, unit.role, model) * 1.4;
    for (const skillKey of unit.skillKeys || []) score += skillBaseScore(skillKey, model) * 0.35;
  }
  const roles = team.map((unit) => unit.role);
  if (new Set(roles).size < 3) score -= 1.2;
  if (!roles.some((role) => ["warrior", "knight", "berserker", "priest"].includes(role))) score -= 0.8;
  if (!roles.some((role) => ["priest", "bard", "knight", "alchemist", "warlock"].includes(role))) score -= 0.5;
  return round(score, 4);
}

function roleBaseScore(role, model) {
  return model.roleScores?.[role]?.score || 0;
}

function rolePartnerScore(a, b, model) {
  return model.rolePairScores?.[pairKey(a, b)]?.score || 0;
}

function skillBaseScore(skill, model) {
  return model.skillScores?.[skill]?.score || 0;
}

function emptyScore() {
  return { positive: 0, negative: 0, count: 0, score: 0 };
}

function addScore(row, value) {
  if (value >= 0) row.positive += value;
  else row.negative += Math.abs(value);
  row.count += 1;
}

function normalizeScores(store) {
  for (const row of Object.values(store)) {
    row.score = round((row.positive - row.negative) / Math.max(1, Math.sqrt(row.count)), 4);
  }
}

function normalizePairScores(store) {
  normalizeScores(store);
  return Object.fromEntries(Object.entries(store)
    .filter(([, row]) => row.count >= 2)
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 400));
}

function renderReport({ dataset, model, recommendations, role, target }) {
  const lines = [];
  lines.push("# Team Generator Prototype Report", "");
  lines.push(`- Dataset samples: ${dataset.sampleCount}`);
  lines.push(`- Skill data version: \`${VERSION.skillData}\``);
  lines.push(`- Requested core role: \`${role}\``);
  lines.push(`- Target preset: ${target ? `\`${target}\`` : "none"}`);
  lines.push(`- Candidate teams validated: ${recommendations.candidates.length}`);
  lines.push("");
  lines.push("## What This Prototype Does", "");
  lines.push("- Stores each character as a token sentence containing role, base stats, skills, effect keywords, and a numeric vector.");
  lines.push("- Trains a lightweight retrieval/scoring model from winning teams and losing teams.");
  lines.push("- Generates candidate teams for a requested role, then validates them against every current standard preset with the real simulator.");
  lines.push("- This is not yet a neural network; it is the data and search loop that a neural generator can later replace.");
  lines.push("");
  lines.push("## Top Recommendations", "");
  lines.push("| Rank | Target Win | Avg Win | Core Share | Core Signal | Similar To | Tags | Source | Team |");
  lines.push("| ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |");
  recommendations.candidates.slice(0, 10).forEach((candidate, index) => {
    const core = target ? candidate.validation.targetCore : candidate.validation.coreAverage;
    const coreSignal = core
      ? `dmg ${Math.round((core.damageShare || 0) * 100)}%, alive ${Math.round((core.aliveRate || 0) * 100)}%, blink ${core.blinks || 0}, auto ${core.autoUltimates || 0}`
      : "-";
    lines.push(`| ${index + 1} | ${target ? pct(candidate.validation.targetWinRate) : "-"} | ${pct(candidate.validation.avgWinRate)} | ${core ? pct(core.damageShare || 0) : "-"} | ${coreSignal} | ${candidate.similarity.nearestPreset} ${pct(candidate.similarity.nearestScore)} | ${candidate.structureTags.join(", ") || "-"} | ${candidate.source} | ${formatTeam(candidate.team)} |`);
  });
  lines.push("");
  lines.push("## Target Details", "");
  if (target) {
    lines.push(`The table is sorted by target win rate against \`${target}\`, then by full-ecology average win rate.`);
  } else {
    lines.push("No target preset was provided, so the table is sorted by full-ecology average win rate.");
  }
  lines.push("Similarity is recorded but not penalized. If many strong teams converge toward one preset, treat that preset as an attractor rather than a mistake.");
  lines.push("");
  lines.push("## Emergence Signals", "");
  const tagCounts = countTags(recommendations.candidates.slice(0, 10).flatMap((candidate) => candidate.structureTags));
  lines.push(`- Repeated structure tags: ${Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => `${tag} x${count}`).join(", ") || "-"}.`);
  const strongNonPreset = recommendations.candidates.filter((candidate) => candidate.source !== "preset-containing-core" && (target ? candidate.validation.targetWinRate >= 0.5 : candidate.validation.avgWinRate >= 0.5));
  lines.push(`- Non-preset candidates passing ${target ? "target" : "ecology"} threshold: ${strongNonPreset.length}/${recommendations.candidates.length}.`);
  const copiedStrong = recommendations.candidates.filter((candidate) => candidate.similarity.nearestScore >= 0.5 && (target ? candidate.validation.targetWinRate >= 0.5 : candidate.validation.avgWinRate >= 0.5));
  lines.push(`- Strong candidates with >=50% similarity to an existing preset: ${copiedStrong.length}/${recommendations.candidates.length}.`);
  lines.push("- Current interpretation: emergence is weak if only preset memory wins; emergence is stronger if model-guided or winning-memory candidates repeatedly form the same structure tags and pass validation without being near-identical to one preset.");
  lines.push("");
  lines.push("## Top Role Scores", "");
  lines.push("| Role | Score | Count |");
  lines.push("| --- | ---: | ---: |");
  Object.entries(model.roleScores)
    .sort((a, b) => b[1].score - a[1].score)
    .forEach(([roleKey, row]) => lines.push(`| \`${roleKey}\` | ${row.score} | ${row.count} |`));
  lines.push("");
  lines.push("## Data Boundary", "");
  lines.push("- Same-role stack tests are not used as the main training target here.");
  lines.push("- Generated matches include random structured teams plus current preset teams.");
  lines.push("- Every sample carries base stats. If a character has custom hp/power/armor/range, those values enter the token and combat unit.");
  lines.push("- When skills change, regenerate the dataset for affected versions; old data remains versioned, not silently mixed.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function countTags(tags) {
  const out = {};
  for (const tag of tags) out[tag] = (out[tag] || 0) + 1;
  return out;
}

function formatTeam(team) {
  return team.map((unit) => {
    const skills = [unit.small1, unit.small2, unit.passive, unit.ultimate].join("/");
    return `${unit.role}(${skills})`;
  }).join(" + ");
}

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const [rawKey, rawValue] = arg.replace(/^--/, "").split("=");
    args[rawKey] = rawValue ?? true;
  }
  return args;
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function addUnique(list, item) {
  if (item && !list.includes(item)) list.push(item);
}

function teamKey(team) {
  return team.map((unit) => [unit.role, unit.small1, unit.small2, unit.passive, unit.ultimate].join(":")).join("|");
}

function pairKey(a, b) {
  return [a, b].sort().join("::");
}

function weightedPickRole(list, scoreFn, rng) {
  return weightedPick(list, scoreFn, rng);
}

function weightedPick(list, scoreFn, rng) {
  const weights = list.map((item) => Math.max(0.05, 1 + scoreFn(item)));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let roll = rng() * total;
  for (let index = 0; index < list.length; index += 1) {
    roll -= weights[index];
    if (roll <= 0) return list[index];
  }
  return list[list.length - 1];
}

function pickManyWeighted(list, count, scoreFn, rng) {
  const pool = [...list];
  const output = [];
  while (pool.length && output.length < count) {
    const picked = weightedPick(pool, scoreFn, rng);
    output.push(picked);
    pool.splice(pool.indexOf(picked), 1);
  }
  return output;
}

function pickMany(list, count, rng) {
  const pool = [...list];
  const output = [];
  while (pool.length && output.length < count) {
    output.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return output;
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function roundObject(input, digits = 3) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, round(value, digits)]));
}

function bucket(value, cuts) {
  for (const cut of cuts) if (value <= cut) return `<=${cut}`;
  return `>${cuts[cuts.length - 1]}`;
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

if (require.main === module) run();

module.exports = {
  generateDataset,
  trainModel,
  recommendTeams,
  characterToken,
  skillToken,
};
