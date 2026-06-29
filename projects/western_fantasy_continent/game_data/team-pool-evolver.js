const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");

const DB_DIR = path.join(__dirname, "team_pools");
const DB_FILE = path.join(DB_DIR, "team-pool-db.json");
const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const REPORT_FILE = path.join(OUT_DIR, "team-pool-evolver-report.md");
const ROUND_FILE = path.join(OUT_DIR, "team-pool-last-round.json");

const DB_SCHEMA = "western_fantasy_team_pool_db_v1";
const ROUND_SCHEMA = "western_fantasy_team_pool_round_v1";
const DEFAULT_DESIGNED_COUNT = 140;
const DEFAULT_RANDOM_COUNT = 60;
const DEFAULT_SEEDS = 2;
const DEFAULT_OPPONENT_SAMPLE = 48;
const DEFAULT_PROMOTE_LIMIT = 16;

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

const DESIGNED_PATTERNS = [
  { key: "one_front_three_back", name: "一前排三后排", count: 30, slots: ["front", "carry", "backDamage", "support"] },
  { key: "two_front_two_back", name: "两前排两后排", count: 30, slots: ["front", "sturdyFront", "carry", "support"] },
  { key: "three_front_one_back", name: "三前排一后排", count: 18, slots: ["front", "sturdyFront", "riskFront", "support"] },
  { key: "four_front", name: "四前排", count: 8, slots: ["front", "front", "riskFront", "sturdyFront"] },
  { key: "protect_carry", name: "一核心三保护", count: 18, slots: ["sturdyFront", "front", "support", "carry"] },
  { key: "status_engine", name: "状态铺设与引爆", count: 18, slots: ["front", "status", "status", "support"] },
  { key: "control_burst", name: "控制爆发", count: 18, slots: ["front", "control", "backDamage", "support"] },
];

function run() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || "evolve";
  const dryRun = Boolean(args["dry-run"]);
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (mode === "init") {
    const db = initDatabase({
      force: Boolean(args.force),
      designedCount: Number(args.designed || DEFAULT_DESIGNED_COUNT),
    });
    console.log(`wrote ${path.relative(process.cwd(), DB_FILE)}`);
    return db;
  }

  if (mode === "report") {
    const db = loadOrInitDatabase();
    fs.writeFileSync(REPORT_FILE, renderDatabaseReport(db, null), "utf8");
    console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
    return db;
  }

  if (mode !== "evolve") throw new Error(`Unknown mode: ${mode}`);
  const db = loadOrInitDatabase();
  const round = runExplorationRound(db, {
    randomCount: Number(args.random || DEFAULT_RANDOM_COUNT),
    seeds: Number(args.seeds || DEFAULT_SEEDS),
    opponentSample: Number(args["opponent-sample"] || DEFAULT_OPPONENT_SAMPLE),
    promoteLimit: Number(args["promote-limit"] || DEFAULT_PROMOTE_LIMIT),
    roundId: args.round || nextRoundId(db),
  });

  if (!dryRun) {
    for (const item of round.promoted) db.teams.push(item.teamEntry);
    db.updatedAt = new Date().toISOString();
    db.rounds.push(round.roundSummary);
    writeJson(DB_FILE, db);
  }

  writeJson(ROUND_FILE, round);
  fs.writeFileSync(REPORT_FILE, renderDatabaseReport(db, round, { dryRun }), "utf8");
  console.log(`${dryRun ? "dry-run " : ""}promoted ${round.promoted.length}/${round.candidates.length}`);
  console.log(`wrote ${path.relative(process.cwd(), ROUND_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
  if (!dryRun) console.log(`wrote ${path.relative(process.cwd(), DB_FILE)}`);
  return round;
}

function initDatabase(options = {}) {
  if (fs.existsSync(DB_FILE) && !options.force) return readJson(DB_FILE);
  const pools = buildPools();
  const rng = seededRandom(`team-pool-init|${SKILL_DATA.assetVersion}|${options.designedCount || DEFAULT_DESIGNED_COUNT}`);
  const teams = buildDesignedTeams(pools, rng, options.designedCount || DEFAULT_DESIGNED_COUNT);
  const db = {
    schema: DB_SCHEMA,
    version: {
      skillData: SKILL_DATA.assetVersion || SKILL_DATA.version || "unknown",
      generator: "team-pool-evolver-v1",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    policy: {
      intendedDesignedCount: DEFAULT_DESIGNED_COUNT,
      intendedRandomExplorationCount: DEFAULT_RANDOM_COUNT,
      promotionOnly: true,
      removalEnabled: false,
      note: "Keep designer-logic teams as the stable base. Every exploration round may append valuable random teams; no automatic removal yet.",
    },
    teams,
    rounds: [],
  };
  writeJson(DB_FILE, db);
  return db;
}

function loadOrInitDatabase() {
  if (!fs.existsSync(DB_FILE)) return initDatabase();
  return readJson(DB_FILE);
}

function buildDesignedTeams(pools, rng, targetCount) {
  const teams = [];
  const seen = new Set();
  for (const pattern of DESIGNED_PATTERNS) {
    for (let i = 0; i < pattern.count && teams.length < targetCount; i += 1) {
      addUniqueTeam(teams, seen, buildPatternTeam(pattern, pools, rng, {
        id: `logic-${String(teams.length + 1).padStart(3, "0")}`,
        source: "designer-logic",
        generation: 0,
      }));
    }
  }
  while (teams.length < targetCount) {
    const pattern = pick(DESIGNED_PATTERNS, rng);
    addUniqueTeam(teams, seen, buildPatternTeam(pattern, pools, rng, {
      id: `logic-${String(teams.length + 1).padStart(3, "0")}`,
      source: "designer-logic-fill",
      generation: 0,
    }));
  }
  return teams;
}

function buildPatternTeam(pattern, pools, rng, meta = {}) {
  const roles = pattern.slots.map((slot) => pickRole(slot, rng));
  const units = roles.map((role, index) => buildUnit(role, pools, rng, index));
  return {
    id: meta.id,
    name: `${pattern.name} ${meta.id}`,
    source: meta.source,
    generation: meta.generation,
    pattern: pattern.key,
    patternName: pattern.name,
    tags: [...new Set([pattern.key, ...structureTags(units)])],
    team: units,
    createdAt: new Date().toISOString(),
  };
}

function runExplorationRound(db, options) {
  const pools = buildPools();
  const rng = seededRandom(`team-pool-round|${SKILL_DATA.assetVersion}|${options.roundId}|${db.teams.length}`);
  const opponents = buildOpponentPool(db, options.opponentSample);
  const candidates = [];
  const seen = new Set(db.teams.map((team) => teamKey(team.team)));

  while (candidates.length < options.randomCount) {
    const teamEntry = buildRandomTeamEntry(pools, rng, {
      id: `random-${options.roundId}-${String(candidates.length + 1).padStart(3, "0")}`,
      generation: db.rounds.length + 1,
    });
    const key = teamKey(teamEntry.team);
    if (seen.has(key)) continue;
    seen.add(key);
    const evaluation = evaluateTeam(teamEntry.team, opponents, options);
    const value = evaluateDiscoveryValue(evaluation);
    candidates.push({ teamEntry: { ...teamEntry, evaluation }, evaluation, value });
  }

  const promoted = candidates
    .filter((candidate) => candidate.value.keep)
    .sort((a, b) => b.value.score - a.value.score || b.evaluation.avgWinRate - a.evaluation.avgWinRate)
    .slice(0, options.promoteLimit)
    .map((candidate, index) => ({
      ...candidate,
      teamEntry: {
        ...candidate.teamEntry,
        id: `discover-${options.roundId}-${String(index + 1).padStart(3, "0")}`,
        source: "random-discovery",
        promotedAt: new Date().toISOString(),
        promotionReason: candidate.value.reasons,
      },
    }));

  return {
    schema: ROUND_SCHEMA,
    generatedAt: new Date().toISOString(),
    roundId: options.roundId,
    randomCount: options.randomCount,
    seeds: options.seeds,
    opponentCount: opponents.length,
    candidates,
    promoted,
    roundSummary: {
      id: options.roundId,
      generatedAt: new Date().toISOString(),
      randomCount: options.randomCount,
      promotedCount: promoted.length,
      promotedIds: promoted.map((item) => item.teamEntry.id),
      bestCandidate: candidates.slice().sort((a, b) => b.value.score - a.value.score)[0]?.teamEntry?.name || "",
    },
  };
}

function buildRandomTeamEntry(pools, rng, meta) {
  const roles = shuffle(Object.keys(SKILL_DATA.roleKits || {}), rng).slice(0, 4);
  if (rng() < 0.35) roles[Math.floor(rng() * roles.length)] = pick(ROLE_GROUPS.front, rng);
  const units = roles.map((role, index) => buildUnit(role, pools, rng, index));
  return {
    id: meta.id,
    name: `随机探索 ${meta.id}`,
    source: "random-candidate",
    generation: meta.generation,
    pattern: "random_exploration",
    patternName: "随机探索",
    tags: [...new Set(["random_exploration", ...structureTags(units)])],
    team: units,
    createdAt: new Date().toISOString(),
  };
}

function evaluateTeam(team, opponents, options) {
  const matchupResults = opponents.map((opponent) => {
    let wins = 0;
    let duration = 0;
    let leftHp = 0;
    let rightHp = 0;
    let damage = 0;
    let firstDeathTimes = [];
    for (let seed = 0; seed < options.seeds; seed += 1) {
      const result = simulateTeams(toCombatTeam(team), cloneTeam(opponent.team), {
        seed: `team-pool|${options.roundId}|${teamKey(team)}|${opponent.key}|${seed}`,
        randomizeStats: false,
        maxTime: 75,
        healthInterval: 0.5,
      });
      if (result.winner === "left") wins += 1;
      duration += result.duration || 0;
      leftHp += result.leftHp || 0;
      rightHp += result.rightHp || 0;
      damage += result.metrics?.leftDamage || 0;
      const firstDeath = (result.signals || []).find((signal) => signal.tags?.includes("death"));
      if (firstDeath) firstDeathTimes.push(firstDeath.time || 0);
    }
    return {
      opponent: opponent.key,
      opponentName: opponent.name,
      opponentKind: opponent.kind,
      wins,
      games: options.seeds,
      winRate: round(wins / Math.max(1, options.seeds), 3),
      avgDuration: round(duration / Math.max(1, options.seeds), 2),
      avgLeftHp: round(leftHp / Math.max(1, options.seeds), 3),
      avgRightHp: round(rightHp / Math.max(1, options.seeds), 3),
      avgDamage: round(damage / Math.max(1, options.seeds), 1),
      avgFirstDeath: firstDeathTimes.length ? round(avg(firstDeathTimes), 2) : null,
    };
  });
  const standard = matchupResults.filter((item) => item.opponentKind === "standard-preset");
  const curated = matchupResults.filter((item) => item.opponentKind === "curated-pool");
  const hardPrey = matchupResults.filter((item) => item.winRate >= 0.8);
  const hardPredators = matchupResults.filter((item) => item.winRate <= 0.2);
  return {
    avgWinRate: round(avg(matchupResults.map((item) => item.winRate)), 3),
    standardAvgWinRate: round(avg(standard.map((item) => item.winRate)), 3),
    curatedAvgWinRate: round(avg(curated.map((item) => item.winRate)), 3),
    hardPreyCount: hardPrey.length,
    hardPredatorCount: hardPredators.length,
    bestWins: hardPrey.sort((a, b) => b.winRate - a.winRate || b.avgLeftHp - a.avgLeftHp).slice(0, 8),
    worstLosses: hardPredators.sort((a, b) => a.winRate - b.winRate || a.avgLeftHp - b.avgLeftHp).slice(0, 8),
    matchupResults,
  };
}

function evaluateDiscoveryValue(evaluation) {
  const reasons = [];
  let score = 0;
  if (evaluation.avgWinRate >= 0.56) {
    reasons.push(`overall win rate ${pct(evaluation.avgWinRate)}`);
    score += 40 + evaluation.avgWinRate * 40;
  }
  if (evaluation.standardAvgWinRate >= 0.58) {
    reasons.push(`standard-preset win rate ${pct(evaluation.standardAvgWinRate)}`);
    score += 34 + evaluation.standardAvgWinRate * 35;
  }
  if (evaluation.hardPreyCount >= 3 && evaluation.avgWinRate >= 0.34) {
    reasons.push(`${evaluation.hardPreyCount} hard prey with acceptable average`);
    score += 24 + evaluation.hardPreyCount * 4;
  }
  const specialCounter = evaluation.bestWins.find((item) => item.opponentKind === "standard-preset" && item.winRate >= 0.8);
  if (specialCounter && evaluation.avgWinRate >= 0.3) {
    reasons.push(`counter candidate into ${specialCounter.opponent}`);
    score += 28 + specialCounter.winRate * 20;
  }
  if (!reasons.length) reasons.push("no promotion signal");
  return {
    keep: score >= 50,
    score: round(score, 2),
    reasons,
  };
}

function buildOpponentPool(db, sampleCount) {
  const standard = Object.entries(SKILL_DATA.presets || {}).map(([key, preset]) => ({
    key: `preset:${key}`,
    name: preset.name || key,
    kind: "standard-preset",
    team: clonePreset(key),
  }));
  const curated = db.teams.slice(0, sampleCount).map((entry) => ({
    key: `pool:${entry.id}`,
    name: entry.name || entry.id,
    kind: "curated-pool",
    team: toCombatTeam(entry.team),
  }));
  return [...standard, ...curated];
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

function structureTags(team) {
  const roles = team.map((unit) => unit.role);
  const frontCount = roles.filter((role) => ROLE_GROUPS.front.includes(role)).length;
  const supportCount = roles.filter((role) => ROLE_GROUPS.support.includes(role)).length;
  const statusCount = roles.filter((role) => ROLE_GROUPS.status.includes(role)).length;
  const carryCount = roles.filter((role) => ROLE_GROUPS.carry.includes(role)).length;
  const tags = [];
  tags.push(`${frontCount}front`);
  if (supportCount >= 2) tags.push("support-heavy");
  if (carryCount >= 2) tags.push("multi-carry");
  if (statusCount >= 2) tags.push("status-engine");
  if (roles.includes("assassin")) tags.push("execute-pressure");
  if (roles.includes("berserker")) tags.push("risk-frontline");
  if (roles.includes("priest") || roles.includes("bard")) tags.push("sustain-shell");
  return tags;
}

function renderDatabaseReport(db, round, options = {}) {
  const patternCounts = countBy(db.teams, (team) => team.patternName || team.pattern || "unknown");
  const sourceCounts = countBy(db.teams, (team) => team.source || "unknown");
  const lines = [
    "# Team Pool Evolver Report",
    "",
    "本报告记录预制队伍池和随机探索队伍的状态。这个流程不是 AI 训练；它是设计师先验 + 随机探索 + combat-sim 验证 + 有价值队伍追加。",
    "",
    "## Database",
    "",
    `- File: \`game_data/team_pools/team-pool-db.json\``,
    `- Teams: ${db.teams.length}`,
    `- Rounds recorded: ${db.rounds.length}`,
    `- Removal enabled: ${db.policy?.removalEnabled ? "yes" : "no"}`,
    "",
    "### Source Counts",
    "",
    ...Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "### Pattern Counts",
    "",
    ...Object.entries(patternCounts).sort((a, b) => b[1] - a[1]).map(([key, value]) => `- ${key}: ${value}`),
  ];

  if (round) {
    lines.push("", "## Last Exploration Round", "");
    lines.push(`- Mode: ${options.dryRun ? "dry-run" : "write"}`);
    lines.push(`- Round: ${round.roundId}`);
    lines.push(`- Random candidates: ${round.candidates.length}`);
    lines.push(`- Opponents per candidate: ${round.opponentCount}`);
    lines.push(`- Seeds per matchup: ${round.seeds}`);
    lines.push(`- Promoted: ${round.promoted.length}`);
    lines.push("", "| Candidate | Keep | Score | Avg Win | Standard Win | Hard Prey | Reasons | Team |");
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- | --- |");
    const top = round.candidates.slice().sort((a, b) => b.value.score - a.value.score || b.evaluation.avgWinRate - a.evaluation.avgWinRate).slice(0, 16);
    for (const candidate of top) {
      lines.push(`| ${candidate.teamEntry.id} | ${candidate.value.keep ? "yes" : "no"} | ${candidate.value.score} | ${pct(candidate.evaluation.avgWinRate)} | ${pct(candidate.evaluation.standardAvgWinRate)} | ${candidate.evaluation.hardPreyCount} | ${candidate.value.reasons.join("; ")} | ${formatTeam(candidate.teamEntry.team)} |`);
    }
    if (round.promoted.length) {
      lines.push("", "### Promoted Teams", "");
      for (const item of round.promoted) {
        lines.push(`- ${item.teamEntry.id}: ${formatTeam(item.teamEntry.team)}; ${item.value.reasons.join("; ")}`);
      }
    }
  }

  lines.push("", "## Next Use", "");
  lines.push("- Keep the 140 logic teams as the stable base.");
  lines.push("- Run 60 random exploration teams per round when we want new candidates.");
  lines.push("- Promote only teams with clear value: broad strength, strong standard-preset counter, or multiple hard prey.");
  lines.push("- Do not remove weak logic teams yet; growth from 140 to 200/260/320 is acceptable at this stage.");
  return `${lines.join("\n")}\n`;
}

function formatTeam(team) {
  return team.map((unit) => {
    const role = SKILL_DATA.roleKits[unit.role]?.role || unit.role;
    const skills = [unit.small1, unit.small2, unit.passive, unit.ultimate].map((key) => SKILL_DATA.skills[key]?.name || key).join("/");
    return `${role}(${skills})`;
  }).join(" + ");
}

function addUniqueTeam(teams, seen, team) {
  const key = teamKey(team.team);
  if (seen.has(key)) return false;
  seen.add(key);
  teams.push(team);
  return true;
}

function teamKey(team) {
  return team.map((unit) => [unit.role, unit.small1, unit.small2, unit.passive, unit.ultimate].join(":")).join("|");
}

function pickRole(group, rng) {
  return pick(ROLE_GROUPS[group] || ROLE_GROUPS.flex, rng);
}

function pickMany(items, count, rng) {
  const pool = shuffle(items, rng);
  return pool.slice(0, count);
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

function countBy(items, fn) {
  const counts = {};
  for (const item of items) {
    const key = fn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
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

function nextRoundId(db) {
  return `r${String((db.rounds?.length || 0) + 1).padStart(3, "0")}`;
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

module.exports = {
  initDatabase,
  runExplorationRound,
  buildDesignedTeams,
  evaluateDiscoveryValue,
};
