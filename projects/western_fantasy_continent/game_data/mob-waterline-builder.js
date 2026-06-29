const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");

const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const DB_DIR = path.join(__dirname, "team_pools");
const WATERLINE_FILE = path.join(DB_DIR, "mob-waterline-db.json");
const REPORT_FILE = path.join(OUT_DIR, "mob-waterline-report.md");
const ROLE_SCORE_FILE = path.join(OUT_DIR, "mob-waterline-role-score.json");
const ROLE_SCORE_REPORT = path.join(OUT_DIR, "mob-waterline-role-score-report.md");

const SCHEMA = "western_fantasy_mob_waterline_v1";
const SCORE_SCHEMA = "western_fantasy_mob_waterline_role_score_v1";
const BATCH_SIZE = 200;
const MAX_BATCHES = 40;
const TARGET_TOTAL = 500;

const BUCKETS = [
  { key: "0_2", label: "0-2", min: 0, max: 2, target: 100 },
  { key: "3_7", label: "3-7", min: 3, max: 7, target: 160 },
  { key: "8_12", label: "8-12", min: 8, max: 12, target: 140 },
  { key: "13_14", label: "13-14", min: 13, max: 14, target: 70 },
  { key: "15_17", label: "15-17", min: 15, max: 17, target: 30 },
];

const ROLE_GROUPS = {
  front: ["knight", "warrior", "berserker"],
  sturdyFront: ["knight", "warrior"],
  riskFront: ["berserker", "warrior"],
  carry: ["ranger", "mage", "assassin", "warlock"],
  backDamage: ["ranger", "mage", "assassin", "warlock", "alchemist"],
  status: ["warlock", "alchemist", "mage", "assassin"],
  control: ["mage", "ranger", "bard", "knight"],
  support: ["priest", "bard", "alchemist"],
  flex: ["knight", "warrior", "berserker", "assassin", "ranger", "mage", "priest", "warlock", "bard", "alchemist"],
};

const PATTERNS = [
  { key: "one_front_three_back", name: "一前排三后排", slots: ["front", "carry", "backDamage", "support"], weight: 7 },
  { key: "two_front_two_back", name: "两前排两后排", slots: ["front", "sturdyFront", "carry", "support"], weight: 8 },
  { key: "three_front_one_back", name: "三前排一后排", slots: ["front", "sturdyFront", "riskFront", "support"], weight: 7 },
  { key: "four_front", name: "四前排", slots: ["front", "front", "riskFront", "sturdyFront"], weight: 4 },
  { key: "protect_carry", name: "一核心三保护", slots: ["sturdyFront", "front", "support", "carry"], weight: 7 },
  { key: "status_engine", name: "状态铺设与引爆", slots: ["front", "status", "status", "support"], weight: 8 },
  { key: "control_burst", name: "控制爆发", slots: ["front", "control", "backDamage", "support"], weight: 5 },
  { key: "random_roles", name: "随机职业", slots: ["flex", "flex", "flex", "flex"], weight: 4 },
];

function run() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || "build";
  if (mode === "score-roles") return scoreRoles();
  if (mode !== "build") throw new Error(`Unknown mode: ${mode}`);
  return buildWaterline({
    targetTotal: Number(args.target || TARGET_TOTAL),
    batchSize: Number(args.batch || BATCH_SIZE),
    maxBatches: Number(args["max-batches"] || MAX_BATCHES),
    force: Boolean(args.force),
  });
}

function buildWaterline(options = {}) {
  if (fs.existsSync(WATERLINE_FILE) && !options.force) {
    console.log(`exists ${path.relative(process.cwd(), WATERLINE_FILE)}; use --force to rebuild`);
    return readJson(WATERLINE_FILE);
  }
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pools = buildPools();
  const fixedPresets = fixedPresetOpponents();
  const selected = [];
  const overflow = [];
  const seen = new Set();
  let evaluated = 0;

  for (let batch = 1; batch <= options.maxBatches && selected.length < options.targetTotal; batch += 1) {
    const rng = seededRandom(`mob-waterline|${SKILL_DATA.assetVersion}|batch-${batch}`);
    for (let i = 0; i < options.batchSize; i += 1) {
      const candidate = buildCandidate(pools, rng, `mob-candidate-b${batch}-${String(i + 1).padStart(3, "0")}`);
      const key = teamKey(candidate.team);
      if (seen.has(key)) continue;
      seen.add(key);
      const evaluation = evaluateCandidate(candidate, fixedPresets);
      evaluated += 1;
      const bucket = bucketFor(evaluation.score);
      const entry = { ...candidate, bucket: bucket.key, bucketLabel: bucket.label, evaluation };
      const current = selected.filter((item) => item.bucket === bucket.key).length;
      if (current < bucket.target) selected.push(entry);
      else overflow.push(entry);
    }
    fillFromOverflow(selected, overflow);
    console.log(`waterline batch ${batch}: selected ${selected.length}/${options.targetTotal}; evaluated ${evaluated}; ${bucketCountsText(selected)}`);
  }

  fillFromOverflow(selected, overflow, true);
  selected.sort((a, b) => a.evaluation.score - b.evaluation.score || a.id.localeCompare(b.id));
  selected.forEach((team, index) => {
    team.id = `mob-${String(index + 1).padStart(3, "0")}`;
  });

  const db = {
    schema: SCHEMA,
    generatedAt: new Date().toISOString(),
    version: {
      skillData: SKILL_DATA.assetVersion || SKILL_DATA.version || "unknown",
      generator: "mob-waterline-builder-v1",
    },
    fixedPresetCount: fixedPresets.length,
    evaluatedCandidates: evaluated,
    targetTotal: options.targetTotal,
    teams: selected.slice(0, options.targetTotal),
    bucketSummary: summarizeBuckets(selected.slice(0, options.targetTotal)),
  };
  writeJson(WATERLINE_FILE, db);
  fs.writeFileSync(REPORT_FILE, renderWaterlineReport(db), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), WATERLINE_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
  return db;
}

function evaluateCandidate(candidate, fixedPresets) {
  const wins = [];
  const losses = [];
  let totalDuration = 0;
  let totalHp = 0;
  for (const preset of fixedPresets) {
    const result = simulateTeams(toCombatTeam(candidate.team), cloneTeam(preset.team), {
      seed: `mob-waterline|${candidate.id}|vs|${preset.id}`,
      randomizeStats: false,
      maxTime: 75,
      healthInterval: 1,
    });
    totalDuration += result.duration || 0;
    totalHp += result.leftHp || 0;
    if (result.winner === "left") wins.push(preset.id);
    else losses.push(preset.id);
  }
  return {
    score: wins.length,
    winRate: round(wins.length / fixedPresets.length, 3),
    wins,
    losses,
    avgDuration: round(totalDuration / fixedPresets.length, 2),
    avgHp: round(totalHp / fixedPresets.length, 3),
  };
}

function scoreRoles() {
  if (!fs.existsSync(WATERLINE_FILE)) throw new Error("Waterline missing. Run mob-waterline-builder.js --mode=build first.");
  const waterline = readJson(WATERLINE_FILE);
  const roleDb = readJson(path.join(DB_DIR, "role-team-pool-db.json"));
  const roleRows = [];
  const teamRows = [];

  for (const [role, rolePool] of Object.entries(roleDb.roles || {})) {
    const fixedTeams = (rolePool.teams || []).filter((team) => team.source === "role-fixed-preset");
    const teamsToScore = fixedTeams.length ? fixedTeams : (rolePool.teams || []);
    for (const team of teamsToScore) {
      const result = scoreTeamAgainstWaterline(team, waterline.teams);
      teamRows.push({ role, roleName: rolePool.roleName, teamId: team.id, teamName: team.name, source: team.source, presetKey: team.presetKey || "", ...result });
    }
    const rows = teamRows.filter((row) => row.role === role);
    roleRows.push({
      role,
      roleName: rolePool.roleName,
      teams: rows.length,
      avgScore: round(avg(rows.map((row) => row.score)), 2),
      avgWinRate: round(avg(rows.map((row) => row.winRate)), 3),
      best: rows.slice().sort((a, b) => b.winRate - a.winRate).slice(0, 3).map(miniTeamScore),
      weak: rows.slice().sort((a, b) => a.winRate - b.winRate).slice(0, 3).map(miniTeamScore),
    });
  }

  roleRows.sort((a, b) => b.avgWinRate - a.avgWinRate);
  const output = {
    schema: SCORE_SCHEMA,
    generatedAt: new Date().toISOString(),
    waterline: path.relative(path.dirname(ROLE_SCORE_FILE), WATERLINE_FILE).replace(/\\/g, "/"),
    waterlineTeams: waterline.teams.length,
    roleSummary: roleRows,
    teamSummary: teamRows.sort((a, b) => b.winRate - a.winRate),
  };
  writeJson(ROLE_SCORE_FILE, output);
  fs.writeFileSync(ROLE_SCORE_REPORT, renderRoleScoreReport(output), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), ROLE_SCORE_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), ROLE_SCORE_REPORT)}`);
  return output;
}

function scoreTeamAgainstWaterline(team, mobs) {
  let wins = 0;
  const bucketResults = Object.fromEntries(BUCKETS.map((bucket) => [bucket.key, { games: 0, wins: 0 }]));
  for (const mob of mobs) {
    const result = simulateTeams(toCombatTeam(team.team), toCombatTeam(mob.team), {
      seed: `role-score|${team.id}|vs|${mob.id}`,
      randomizeStats: false,
      maxTime: 75,
      healthInterval: 1,
    });
    const win = result.winner === "left";
    if (win) wins += 1;
    bucketResults[mob.bucket].games += 1;
    if (win) bucketResults[mob.bucket].wins += 1;
  }
  return {
    score: wins,
    games: mobs.length,
    winRate: round(wins / mobs.length, 3),
    buckets: Object.fromEntries(Object.entries(bucketResults).map(([key, row]) => [key, {
      wins: row.wins,
      games: row.games,
      winRate: row.games ? round(row.wins / row.games, 3) : 0,
    }])),
  };
}

function buildCandidate(pools, rng, id) {
  const pattern = weightedPick(PATTERNS, rng);
  const roles = pattern.slots.map((slot) => pick(ROLE_GROUPS[slot] || ROLE_GROUPS.flex, rng));
  if (rng() < 0.18) roles[Math.floor(rng() * roles.length)] = pick(ROLE_GROUPS.front, rng);
  const units = roles.map((role, index) => buildUnit(role, pools, rng, index));
  return {
    id,
    name: `${pattern.name} ${id}`,
    source: "mob-waterline-candidate",
    pattern: pattern.key,
    patternName: pattern.name,
    tags: [...new Set([pattern.key, ...structureTags(units)])],
    team: units,
  };
}

function buildPools() {
  const pools = Object.fromEntries(Object.keys(SKILL_DATA.roleKits || {}).map((roleKey) => [roleKey, { small: [], passive: [], ultimate: [] }]));
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

function buildUnit(role, pools, rng, slotIndex) {
  const pool = pools[role];
  const small = pickMany(pool.small, 2, rng);
  return {
    role,
    roleName: SKILL_DATA.roleKits[role]?.role || role,
    name: SKILL_DATA.roleKits[role]?.name || role,
    slotIndex,
    small1: small[0],
    small2: small[1],
    passive: pick(pool.passive, rng),
    ultimate: pick(pool.ultimate, rng),
  };
}

function fixedPresetOpponents() {
  return Object.entries(SKILL_DATA.presets || {}).map(([id, preset]) => ({
    id,
    name: preset.name || id,
    team: clonePreset(id),
  }));
}

function bucketFor(score) {
  return BUCKETS.find((bucket) => score >= bucket.min && score <= bucket.max) || BUCKETS[BUCKETS.length - 1];
}

function fillFromOverflow(selected, overflow, force = false) {
  for (const bucket of BUCKETS) {
    while (selected.filter((item) => item.bucket === bucket.key).length < bucket.target) {
      const index = overflow.findIndex((item) => item.bucket === bucket.key);
      if (index < 0) break;
      selected.push(overflow.splice(index, 1)[0]);
    }
  }
  if (!force) return;
  while (selected.length < TARGET_TOTAL && overflow.length) {
    selected.push(overflow.shift());
  }
}

function summarizeBuckets(teams) {
  return BUCKETS.map((bucket) => {
    const rows = teams.filter((team) => team.bucket === bucket.key);
    return {
      key: bucket.key,
      label: bucket.label,
      count: rows.length,
      target: bucket.target,
      avgScore: round(avg(rows.map((team) => team.evaluation.score)), 2),
    };
  });
}

function renderWaterlineReport(db) {
  const lines = [
    "# Mob Waterline Report",
    "",
    "这是一组生成小怪强度尺。每支生成队都按打赢固定 preset 的数量分桶；任何新队都可以打这组水表来获得强度分。",
    "",
    "## Summary",
    "",
    `- Teams: ${db.teams.length}`,
    `- Evaluated candidates: ${db.evaluatedCandidates}`,
    `- Fixed presets used for scoring: ${db.fixedPresetCount}`,
    "",
    "| Bucket | Count | Target | Avg Score | Meaning |",
    "| --- | ---: | ---: | ---: | --- |",
  ];
  for (const row of db.bucketSummary) {
    lines.push(`| ${row.label} | ${row.count} | ${row.target} | ${row.avgScore} | ${bucketMeaning(row.key)} |`);
  }
  lines.push("", "## Examples", "");
  for (const bucket of BUCKETS) {
    lines.push(`### ${bucket.label}`, "");
    for (const team of db.teams.filter((item) => item.bucket === bucket.key).slice(0, 6)) {
      lines.push(`- ${team.id}: ${team.name}; score ${team.evaluation.score}/17; beats ${team.evaluation.wins.join(", ") || "-"}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderRoleScoreReport(output) {
  const lines = [
    "# Role Score On Mob Waterline",
    "",
    "每个职业取其固定 preset 来源的标准队，打 500 支小怪水表队。分数不是职业单体强度，而是该职业现有标准队的清小怪能力。",
    "",
    "## Role Summary",
    "",
    "| Role | Avg Win | Avg Score | Teams | Best | Weak |",
    "| --- | ---: | ---: | ---: | --- | --- |",
  ];
  for (const row of output.roleSummary) {
    lines.push(`| ${row.roleName} \`${row.role}\` | ${pct(row.avgWinRate)} | ${row.avgScore}/${output.waterlineTeams} | ${row.teams} | ${row.best.map(formatMiniScore).join("<br>")} | ${row.weak.map(formatMiniScore).join("<br>")} |`);
  }
  lines.push("", "## Team Detail", "");
  lines.push("| Team | Role | Win | 0-2 | 3-7 | 8-12 | 13-14 | 15-17 |");
  lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |");
  for (const row of output.teamSummary) {
    lines.push(`| ${row.teamName} \`${row.teamId}\` | ${row.roleName} | ${pct(row.winRate)} | ${bucketPct(row, "0_2")} | ${bucketPct(row, "3_7")} | ${bucketPct(row, "8_12")} | ${bucketPct(row, "13_14")} | ${bucketPct(row, "15_17")} |`);
  }
  return `${lines.join("\n")}\n`;
}

function bucketMeaning(key) {
  return {
    "0_2": "trash / low pressure",
    "3_7": "normal mobs",
    "8_12": "elite mobs",
    "13_14": "boss candidates",
    "15_17": "apex / anomaly mobs",
  }[key] || "";
}

function miniTeamScore(row) {
  return { teamId: row.teamId, teamName: row.teamName, winRate: row.winRate, score: row.score };
}

function formatMiniScore(row) {
  return `${row.teamId} ${pct(row.winRate)}`;
}

function bucketPct(row, key) {
  return row.buckets[key] ? `${row.buckets[key].wins}/${row.buckets[key].games} ${pct(row.buckets[key].winRate)}` : "-";
}

function bucketCountsText(teams) {
  return BUCKETS.map((bucket) => `${bucket.label}:${teams.filter((team) => team.bucket === bucket.key).length}/${bucket.target}`).join(" ");
}

function structureTags(team) {
  const roles = team.map((unit) => unit.role);
  const frontCount = roles.filter((role) => ROLE_GROUPS.front.includes(role)).length;
  const supportCount = roles.filter((role) => ROLE_GROUPS.support.includes(role)).length;
  const statusCount = roles.filter((role) => ROLE_GROUPS.status.includes(role)).length;
  const tags = [`${frontCount}front`];
  if (supportCount >= 2) tags.push("support-heavy");
  if (statusCount >= 2) tags.push("status-engine");
  if (roles.includes("assassin")) tags.push("execute-pressure");
  if (roles.includes("berserker")) tags.push("risk-frontline");
  if (roles.includes("bard")) tags.push("tempo");
  if (roles.includes("priest")) tags.push("healing-shell");
  return tags;
}

function toCombatTeam(team) {
  return team.map((unit, index) => ({
    ...unit,
    id: unit.id || `${unit.role}-${index}`,
    name: unit.name || SKILL_DATA.roleKits[unit.role]?.name || unit.role,
    roleName: unit.roleName || SKILL_DATA.roleKits[unit.role]?.role || unit.role,
    slotIndex: index,
  }));
}

function cloneTeam(team) {
  return structuredClone(team);
}

function teamKey(team) {
  return team.map((unit) => [unit.role, unit.small1, unit.small2, unit.passive, unit.ultimate].join(":")).join("|");
}

function weightedPick(items, rng) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = rng() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function pickMany(items, count, rng) {
  return shuffle(items, rng).slice(0, count);
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function addUnique(list, item) {
  if (item && !list.includes(item)) list.push(item);
}

function seededRandom(seedText) {
  let h = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    h ^= seedText.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6D2B79F5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + (value || 0), 0) / values.length;
}

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function round(value, digits = 2) {
  return Number(Number(value || 0).toFixed(digits));
}

function parseArgs(argv) {
  const args = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const raw = arg.slice(2);
    const [key, value] = raw.includes("=") ? raw.split(/=(.*)/s).slice(0, 2) : [raw, "true"];
    args[key] = value === "true" ? true : value;
  }
  return args;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

if (require.main === module) run();

module.exports = { buildWaterline, scoreRoles, evaluateCandidate };
