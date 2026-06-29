const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");

const DB_DIR = path.join(__dirname, "team_pools");
const ROLE_DB_FILE = path.join(DB_DIR, "role-team-pool-db.json");
const MAIN_DB_FILE = path.join(DB_DIR, "team-pool-db.json");
const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const REPORT_FILE = path.join(OUT_DIR, "role-team-pool-report.md");
const ROUND_FILE = path.join(OUT_DIR, "role-team-pool-last-round.json");

const DB_SCHEMA = "western_fantasy_role_team_pool_db_v1";
const ROUND_SCHEMA = "western_fantasy_role_team_pool_round_v1";
const DEFAULT_DESIGNED_PER_ROLE = 7;
const DEFAULT_RANDOM_PER_ROLE = 3;
const DEFAULT_RANDOM_COUNT = 3;
const DEFAULT_SEEDS = 1;
const DEFAULT_OPPONENT_LIMIT = 200;
const DEFAULT_PROMOTE_LIMIT = 3;

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

const ROLE_PATTERNS = [
  { key: "balanced_shell", name: "均衡壳", slots: ["focus", "front", "carry", "support"] },
  { key: "double_front_shell", name: "双前排壳", slots: ["front", "focus", "front", "support"] },
  { key: "protect_focus", name: "核心保护", slots: ["front", "support", "focus", "support"] },
  { key: "status_partner", name: "异常搭档", slots: ["front", "focus", "status", "support"] },
  { key: "control_window", name: "控制窗口", slots: ["front", "control", "focus", "support"] },
  { key: "tempo_shell", name: "节奏壳", slots: ["front", "bard", "focus", "backDamage"] },
  { key: "mirror_pair", name: "双同职验证", slots: ["front", "focus", "focus", "support"] },
];

function run() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode || "report";
  const role = args.role || "";
  const dryRun = Boolean(args["dry-run"]);
  fs.mkdirSync(DB_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (mode === "init") {
    const db = initDatabase({ force: Boolean(args.force) });
    fs.writeFileSync(REPORT_FILE, renderDatabaseReport(db), "utf8");
    console.log(`wrote ${path.relative(process.cwd(), ROLE_DB_FILE)}`);
    console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
    return db;
  }

  if (mode === "report") {
    const db = loadOrInitDatabase();
    fs.writeFileSync(REPORT_FILE, renderDatabaseReport(db), "utf8");
    console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
    return db;
  }

  if (mode !== "evolve") throw new Error(`Unknown mode: ${mode}`);
  const db = loadOrInitDatabase();
  const roles = role ? [role] : Object.keys(SKILL_DATA.roleKits || {});
  for (const item of roles) {
    if (!SKILL_DATA.roleKits[item]) throw new Error(`Unknown role: ${item}`);
  }

  const round = runEvolutionRound(db, {
    roles,
    randomCount: Number(args.random || DEFAULT_RANDOM_COUNT),
    seeds: Number(args.seeds || DEFAULT_SEEDS),
    opponentLimit: Number(args["opponent-limit"] || DEFAULT_OPPONENT_LIMIT),
    promoteLimit: Number(args["promote-limit"] || DEFAULT_PROMOTE_LIMIT),
    focusSkill: args["focus-skill"] || "",
    roundId: args.round || nextRoundId(db),
  });

  if (!dryRun) {
    for (const promoted of round.promoted) db.roles[promoted.role].teams.push(promoted.teamEntry);
    db.updatedAt = new Date().toISOString();
    db.rounds.push(round.roundSummary);
    writeJson(ROLE_DB_FILE, db);
  }

  writeJson(ROUND_FILE, round);
  fs.writeFileSync(REPORT_FILE, renderDatabaseReport(db, round, { dryRun }), "utf8");
  console.log(`${dryRun ? "dry-run " : ""}promoted ${round.promoted.length}/${round.candidates.length}`);
  console.log(`wrote ${path.relative(process.cwd(), ROUND_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
  if (!dryRun) console.log(`wrote ${path.relative(process.cwd(), ROLE_DB_FILE)}`);
  return round;
}

function initDatabase(options = {}) {
  if (fs.existsSync(ROLE_DB_FILE) && !options.force) return readJson(ROLE_DB_FILE);
  const pools = buildPools();
  const roles = Object.keys(SKILL_DATA.roleKits || {});
  const db = {
    schema: DB_SCHEMA,
    version: {
      skillData: SKILL_DATA.assetVersion || SKILL_DATA.version || "unknown",
      generator: "role-team-pool-evolver-v1",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    policy: {
      designedPerRole: DEFAULT_DESIGNED_PER_ROLE,
      randomSeedPerRole: DEFAULT_RANDOM_PER_ROLE,
      promotionOnly: true,
      removalEnabled: false,
      note: "Each role owns a compact test pool. Start with 7 logic teams and 3 random seed teams; later append valuable random discoveries.",
    },
    roles: Object.fromEntries(roles.map((role) => [role, initRolePool(role, pools)])),
    rounds: [],
  };
  writeJson(ROLE_DB_FILE, db);
  return db;
}

function initRolePool(role, pools) {
  const rng = seededRandom(`role-pool-init|${SKILL_DATA.assetVersion}|${role}`);
  const seen = new Set();
  const teams = [];
  for (const presetTeam of presetTeamsForRole(role).slice(0, DEFAULT_DESIGNED_PER_ROLE)) {
    addUniqueTeam(teams, seen, presetTeam);
  }
  for (const pattern of ROLE_PATTERNS) {
    if (teams.length >= DEFAULT_DESIGNED_PER_ROLE) break;
    addUniqueTeam(teams, seen, buildRolePatternTeam(role, pattern, pools, rng, {
      id: `${role}-logic-${String(teams.length + 1).padStart(2, "0")}`,
      source: "role-designer-logic",
      generation: 0,
    }));
  }
  while (teams.length < DEFAULT_DESIGNED_PER_ROLE + DEFAULT_RANDOM_PER_ROLE) {
    addUniqueTeam(teams, seen, buildRoleRandomTeam(role, pools, rng, {
      id: `${role}-seed-${String(teams.length - DEFAULT_DESIGNED_PER_ROLE + 1).padStart(2, "0")}`,
      source: "role-random-seed",
      generation: 0,
    }));
  }
  return {
    role,
    roleName: SKILL_DATA.roleKits[role]?.role || role,
    targetSize: DEFAULT_DESIGNED_PER_ROLE + DEFAULT_RANDOM_PER_ROLE,
    teams,
  };
}

function presetTeamsForRole(role) {
  return Object.entries(SKILL_DATA.presets || {})
    .filter(([, preset]) => (preset.team || []).some((unit) => unit.role === role))
    .map(([presetKey, preset], index) => {
      const team = structuredClone(preset.team || []).map((unit, slotIndex) => ({
        ...unit,
        roleName: SKILL_DATA.roleKits[unit.role]?.role || unit.role,
        name: SKILL_DATA.roleKits[unit.role]?.name || unit.role,
        slotIndex,
      }));
      const focusUnitIndex = team.findIndex((unit) => unit.role === role);
      return {
        id: `${role}-preset-${String(index + 1).padStart(2, "0")}`,
        name: `${SKILL_DATA.roleKits[role]?.role || role}-${preset.name || presetKey}`,
        source: "role-fixed-preset",
        generation: 0,
        focusRole: role,
        focusUnitIndex,
        pattern: `fixed_preset:${presetKey}`,
        patternName: `固定流派:${preset.name || presetKey}`,
        presetKey,
        tags: [...new Set(["fixed_preset", presetKey, ...(preset.design?.desiredTags || []), ...structureTags(team)])],
        team,
        createdAt: new Date().toISOString(),
      };
    });
}

function loadOrInitDatabase() {
  if (!fs.existsSync(ROLE_DB_FILE)) return initDatabase();
  return readJson(ROLE_DB_FILE);
}

function runEvolutionRound(db, options) {
  const pools = buildPools();
  const opponents = loadMainPoolOpponents(options.opponentLimit);
  const candidates = [];
  const promoted = [];
  for (const role of options.roles) {
    const rng = seededRandom(`role-pool-round|${SKILL_DATA.assetVersion}|${options.roundId}|${role}|${options.focusSkill}`);
    const seen = new Set((db.roles[role]?.teams || []).map((entry) => teamKey(entry.team)));
    const roleCandidates = [];
    while (roleCandidates.length < options.randomCount) {
      const candidate = buildRoleRandomTeam(role, pools, rng, {
        id: `${role}-random-${options.roundId}-${String(roleCandidates.length + 1).padStart(2, "0")}`,
        source: "role-random-candidate",
        generation: (db.rounds?.length || 0) + 1,
        focusSkill: options.focusSkill,
      });
      if (options.focusSkill) applyFocusSkill(candidate.team, role, options.focusSkill);
      const key = teamKey(candidate.team);
      if (seen.has(key)) continue;
      seen.add(key);
      const evaluation = evaluateTeam(candidate.team, opponents, options);
      const value = evaluateDiscoveryValue(evaluation);
      const row = { role, teamEntry: { ...candidate, evaluation }, evaluation, value };
      roleCandidates.push(row);
      candidates.push(row);
    }
    const rolePromoted = roleCandidates
      .filter((candidate) => candidate.value.keep)
      .sort((a, b) => b.value.score - a.value.score || b.evaluation.avgWinRate - a.evaluation.avgWinRate)
      .slice(0, options.promoteLimit)
      .map((candidate, index) => ({
        ...candidate,
        teamEntry: {
          ...candidate.teamEntry,
          id: `${role}-discover-${options.roundId}-${String(index + 1).padStart(2, "0")}`,
          source: "role-random-discovery",
          promotedAt: new Date().toISOString(),
          promotionReason: candidate.value.reasons,
        },
      }));
    promoted.push(...rolePromoted);
  }

  return {
    schema: ROUND_SCHEMA,
    generatedAt: new Date().toISOString(),
    roundId: options.roundId,
    roles: options.roles,
    focusSkill: options.focusSkill,
    randomCountPerRole: options.randomCount,
    seeds: options.seeds,
    opponentCount: opponents.length,
    candidates,
    promoted,
    roundSummary: {
      id: options.roundId,
      generatedAt: new Date().toISOString(),
      roles: options.roles,
      focusSkill: options.focusSkill,
      randomCountPerRole: options.randomCount,
      promotedCount: promoted.length,
      promotedIds: promoted.map((item) => item.teamEntry.id),
    },
  };
}

function buildRolePatternTeam(focusRole, pattern, pools, rng, meta = {}) {
  const units = pattern.slots.map((slot, index) => {
    const role = slot === "focus" ? focusRole : pickRole(slot, rng, focusRole);
    return buildUnit(role, pools, rng, index);
  });
  normalizeFocusIndex(units, focusRole);
  return {
    id: meta.id,
    name: `${SKILL_DATA.roleKits[focusRole]?.role || focusRole}-${pattern.name}`,
    source: meta.source,
    generation: meta.generation,
    focusRole,
    focusUnitIndex: units.findIndex((unit) => unit.role === focusRole),
    pattern: pattern.key,
    patternName: pattern.name,
    tags: [...new Set([pattern.key, ...structureTags(units)])],
    team: units,
    createdAt: new Date().toISOString(),
  };
}

function buildRoleRandomTeam(focusRole, pools, rng, meta = {}) {
  const slots = ["focus", pick(["front", "sturdyFront", "riskFront"], rng), pick(["carry", "backDamage", "status", "control"], rng), pick(["support", "control", "status", "flex"], rng)];
  const shuffled = shuffle(slots, rng);
  const units = shuffled.map((slot, index) => {
    const role = slot === "focus" ? focusRole : pickRole(slot, rng, focusRole);
    return buildUnit(role, pools, rng, index);
  });
  normalizeFocusIndex(units, focusRole);
  return {
    id: meta.id,
    name: `${SKILL_DATA.roleKits[focusRole]?.role || focusRole}-随机试炼`,
    source: meta.source,
    generation: meta.generation,
    focusRole,
    focusSkill: meta.focusSkill || "",
    focusUnitIndex: units.findIndex((unit) => unit.role === focusRole),
    pattern: "role_random_exploration",
    patternName: "职业随机探索",
    tags: [...new Set(["role_random_exploration", ...structureTags(units)])],
    team: units,
    createdAt: new Date().toISOString(),
  };
}

function applyFocusSkill(team, focusRole, skillKey) {
  const skill = SKILL_DATA.skills[skillKey];
  if (!skill) throw new Error(`Unknown focus skill: ${skillKey}`);
  if (!(skill.roleKeys || []).includes(focusRole)) throw new Error(`Skill ${skillKey} is not available to role ${focusRole}`);
  const unit = team.find((item) => item.role === focusRole);
  if (!unit) return;
  if (skill.type === SKILL_DATA.TYPE.SMALL) {
    unit.small1 = skillKey;
    if (unit.small2 === skillKey) unit.small2 = fallbackSkill(focusRole, "small", skillKey);
  } else if (skill.type === SKILL_DATA.TYPE.PASSIVE) {
    unit.passive = skillKey;
  } else if (skill.type === SKILL_DATA.TYPE.ULT) {
    unit.ultimate = skillKey;
  }
}

function evaluateTeam(team, opponents, options) {
  const results = opponents.map((opponent) => {
    let wins = 0;
    let duration = 0;
    let leftHp = 0;
    let rightHp = 0;
    let focusDamage = 0;
    let focusAlive = 0;
    for (let seed = 0; seed < options.seeds; seed += 1) {
      const result = simulateTeams(toCombatTeam(team), cloneTeam(opponent.team), {
        seed: `role-pool|${options.roundId}|${teamKey(team)}|${opponent.key}|${seed}`,
        randomizeStats: false,
        maxTime: 75,
        healthInterval: 0.5,
      });
      if (result.winner === "left") wins += 1;
      duration += result.duration || 0;
      leftHp += result.leftHp || 0;
      rightHp += result.rightHp || 0;
      const focus = result.units?.find((unit) => unit.side === "left" && unit.index === team.findIndex((item) => item.role === team[0].role));
      focusDamage += focus?.damageDone || 0;
      focusAlive += focus?.alive ? 1 : 0;
    }
    return {
      opponent: opponent.key,
      opponentName: opponent.name,
      wins,
      games: options.seeds,
      winRate: round(wins / Math.max(1, options.seeds), 3),
      avgDuration: round(duration / Math.max(1, options.seeds), 2),
      avgLeftHp: round(leftHp / Math.max(1, options.seeds), 3),
      avgRightHp: round(rightHp / Math.max(1, options.seeds), 3),
      avgFocusDamage: round(focusDamage / Math.max(1, options.seeds), 1),
      focusAliveRate: round(focusAlive / Math.max(1, options.seeds), 3),
    };
  });
  const hardPrey = results.filter((item) => item.winRate >= 0.8);
  const hardPredators = results.filter((item) => item.winRate <= 0.2);
  return {
    avgWinRate: round(avg(results.map((item) => item.winRate)), 3),
    hardPreyCount: hardPrey.length,
    hardPredatorCount: hardPredators.length,
    avgFocusDamage: round(avg(results.map((item) => item.avgFocusDamage)), 1),
    avgFocusAliveRate: round(avg(results.map((item) => item.focusAliveRate)), 3),
    bestWins: hardPrey.sort((a, b) => b.winRate - a.winRate || b.avgLeftHp - a.avgLeftHp).slice(0, 8),
    worstLosses: hardPredators.sort((a, b) => a.winRate - b.winRate || a.avgLeftHp - b.avgLeftHp).slice(0, 8),
    matchupResults: results,
  };
}

function evaluateDiscoveryValue(evaluation) {
  const reasons = [];
  let score = 0;
  if (evaluation.avgWinRate >= 0.54) {
    reasons.push(`overall win rate ${pct(evaluation.avgWinRate)}`);
    score += 42 + evaluation.avgWinRate * 40;
  }
  if (evaluation.hardPreyCount >= 4 && evaluation.avgWinRate >= 0.32) {
    reasons.push(`${evaluation.hardPreyCount} hard prey`);
    score += 24 + evaluation.hardPreyCount * 4;
  }
  if (evaluation.avgFocusAliveRate >= 0.45 && evaluation.avgFocusDamage >= 180) {
    reasons.push(`focus role contributes damage ${evaluation.avgFocusDamage}`);
    score += 18;
  }
  if (evaluation.bestWins.length && evaluation.avgWinRate >= 0.28) {
    reasons.push(`counter candidate into ${evaluation.bestWins[0].opponentName}`);
    score += 24;
  }
  if (!reasons.length) reasons.push("no promotion signal");
  return {
    keep: score >= 50,
    score: round(score, 2),
    reasons,
  };
}

function loadMainPoolOpponents(limit) {
  if (!fs.existsSync(MAIN_DB_FILE)) throw new Error("Main team pool missing. Run team-pool-evolver.js --mode=init first.");
  const db = readJson(MAIN_DB_FILE);
  return (db.teams || []).slice(0, limit).map((entry) => ({
    key: `main:${entry.id}`,
    name: entry.name || entry.id,
    team: toCombatTeam(entry.team),
  }));
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

function fallbackSkill(role, bucket, except) {
  const pools = buildPools();
  const source = bucket === "small" ? pools[role].small : bucket === "passive" ? pools[role].passive : pools[role].ultimate;
  return source.find((key) => key !== except) || except;
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

function normalizeFocusIndex(units, focusRole) {
  const first = units.findIndex((unit) => unit.role === focusRole);
  if (first <= 0) return;
  [units[0], units[first]] = [units[first], units[0]];
  units.forEach((unit, index) => { unit.slotIndex = index; });
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

function renderDatabaseReport(db, round, options = {}) {
  const lines = [
    "# Role Team Pool Report",
    "",
    "每个职业维护一个小型队伍池，用来测试该职业或该职业新技能。默认每职业 10 队：7 个设计逻辑队 + 3 个随机种子队。",
    "",
    "## Simulation Budget",
    "",
    `- 单职业测试：10 role teams x 200 main teams = 2,000 matchup pairs before seeds.`,
    `- 十职业全量测试：100 role teams x 200 main teams = 20,000 matchup pairs before seeds.`,
    `- 如果 seeds=2，全职业就是 40,000 场战斗。`,
    "",
    "## Database",
    "",
    `- File: \`game_data/team_pools/role-team-pool-db.json\``,
    `- Roles: ${Object.keys(db.roles || {}).length}`,
    `- Total teams: ${Object.values(db.roles || {}).reduce((sum, row) => sum + (row.teams?.length || 0), 0)}`,
    `- Rounds recorded: ${db.rounds?.length || 0}`,
    `- Removal enabled: ${db.policy?.removalEnabled ? "yes" : "no"}`,
    "",
    "| Role | Teams | Sources | Patterns |",
    "| --- | ---: | --- | --- |",
  ];
  for (const [role, row] of Object.entries(db.roles || {})) {
    lines.push(`| ${row.roleName || role} \`${role}\` | ${row.teams.length} | ${formatCounts(countBy(row.teams, (team) => team.source))} | ${formatCounts(countBy(row.teams, (team) => team.patternName || team.pattern))} |`);
  }
  if (round) {
    lines.push("", "## Last Evolution Round", "");
    lines.push(`- Mode: ${options.dryRun ? "dry-run" : "write"}`);
    lines.push(`- Round: ${round.roundId}`);
    lines.push(`- Roles: ${round.roles.join(", ")}`);
    lines.push(`- Focus skill: ${round.focusSkill || "-"}`);
    lines.push(`- Random candidates per role: ${round.randomCountPerRole}`);
    lines.push(`- Opponents: ${round.opponentCount}`);
    lines.push(`- Seeds: ${round.seeds}`);
    lines.push(`- Promoted: ${round.promoted.length}`);
    lines.push("", "| Role | Candidate | Keep | Score | Avg Win | Hard Prey | Focus Damage | Reasons | Team |");
    lines.push("| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |");
    for (const candidate of round.candidates.slice().sort((a, b) => b.value.score - a.value.score).slice(0, 24)) {
      lines.push(`| ${roleName(candidate.role)} | ${candidate.teamEntry.id} | ${candidate.value.keep ? "yes" : "no"} | ${candidate.value.score} | ${pct(candidate.evaluation.avgWinRate)} | ${candidate.evaluation.hardPreyCount} | ${candidate.evaluation.avgFocusDamage} | ${candidate.value.reasons.join("; ")} | ${formatTeam(candidate.teamEntry.team)} |`);
    }
  }
  lines.push("", "## Usage", "");
  lines.push("初始化：");
  lines.push("");
  lines.push("```bash");
  lines.push("node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=init");
  lines.push("```");
  lines.push("");
  lines.push("测试某个职业新技能，但先不写库：");
  lines.push("");
  lines.push("```bash");
  lines.push("node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=evolve --role=priest --focus-skill=purifyingWard --dry-run");
  lines.push("```");
  return `${lines.join("\n")}\n`;
}

function formatTeam(team) {
  return team.map((unit) => `${roleName(unit.role)}(${[unit.small1, unit.small2, unit.passive, unit.ultimate].map(skillName).join("/")})`).join(" + ");
}

function skillName(key) {
  return SKILL_DATA.skills[key]?.name || key;
}

function roleName(role) {
  return SKILL_DATA.roleKits[role]?.role || role;
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

function pickRole(group, rng, focusRole) {
  if (group === "bard") return "bard";
  const pool = (ROLE_GROUPS[group] || ROLE_GROUPS.flex).filter((role) => role !== focusRole);
  return pick(pool.length ? pool : ROLE_GROUPS.flex, rng);
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

function countBy(items, fn) {
  const counts = {};
  for (const item of items) {
    const key = fn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function formatCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([key, count]) => `${key}:${count}`).join(", ");
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
  return `rr${String((db.rounds?.length || 0) + 1).padStart(3, "0")}`;
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
  runEvolutionRound,
  evaluateDiscoveryValue,
};
