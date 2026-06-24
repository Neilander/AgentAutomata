const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "balance", "skill-pool-redteam-report.md");
const ROLE_KEYS = Object.keys(SKILL_DATA.roleKits || {});
const PRESET_KEYS = Object.keys(SKILL_DATA.presets || {});
const NEW_SKILLS = new Set([
  "shieldBash",
  "guardBreak",
  "redFeast",
  "garrote",
  "flareMark",
  "iceLance",
  "mendingLight",
  "curseLeak",
  "rhythmGuard",
  "sparkCatalyst",
  "oathRally",
  "ruinComet",
  "statusHunter",
  "frontlineDrill",
  "finisherInstinct",
]);

function run() {
  const pools = buildPools();
  const candidates = [];
  for (let i = 0; i < 32; i += 1) {
    const team = randomTeam(pools, seededRandom(`redteam-team-${i}`));
    const results = PRESET_KEYS.map((presetKey) => testAgainstPreset(team, presetKey, i));
    const wins = results.filter((result) => result.winRate >= 0.5).length;
    const avgWinRate = average(results.map((result) => result.winRate));
    const avgDuration = average(results.map((result) => result.avgDuration));
    const newSkillCount = team.flatMap((unit) => [unit.small1, unit.small2, unit.passive, unit.ultimate]).filter((key) => NEW_SKILLS.has(key)).length;
    candidates.push({ id: i + 1, team, wins, avgWinRate, avgDuration, newSkillCount, results });
  }
  candidates.sort((a, b) => b.avgWinRate - a.avgWinRate || b.newSkillCount - a.newSkillCount);
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, render(candidates), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  return candidates;
}

function buildPools() {
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

function randomTeam(pools, rng) {
  const roles = shuffle([...ROLE_KEYS], rng).slice(0, 4);
  return roles.map((role) => {
    const pool = pools[role];
    const small = pickMany(pool.small, 2, rng);
    return {
      role,
      small1: small[0],
      small2: small[1],
      passive: pick(pool.passive, rng),
      ultimate: pick(pool.ultimate, rng),
    };
  });
}

function testAgainstPreset(team, presetKey, teamIndex) {
  const seeds = [0, 1, 2, 3, 4];
  const results = seeds.map((seed) => simulateTeams(team, clonePreset(presetKey), {
    seed: `skill-redteam-${teamIndex}-${presetKey}-${seed}`,
    randomizeStats: true,
  }));
  return {
    presetKey,
    winRate: results.filter((result) => result.winner === "left").length / results.length,
    avgDuration: average(results.map((result) => result.duration)),
    avgLeftHp: average(results.map((result) => result.leftHp)),
    avgRightHp: average(results.map((result) => result.rightHp)),
  };
}

function render(candidates) {
  const top = candidates.slice(0, 8);
  const risky = top.filter((candidate) => candidate.avgWinRate >= 0.65 || (candidate.wins >= Math.ceil(PRESET_KEYS.length * 0.8) && candidate.avgWinRate >= 0.64));
  const lines = [
    "# Skill Pool Red-Team Report",
    "",
    "Generated random 4-unit teams from default role kits plus newly tagged role/common skills, then tested them against every current standard preset.",
    "",
    "## Summary",
    "",
    `- Candidates tested: ${candidates.length}`,
    `- Standard presets tested per candidate: ${PRESET_KEYS.length}`,
    `- Seeds per matchup: 5`,
    `- Risky candidates: ${risky.length}`,
    "",
    "## Top Breaker Candidates",
    "",
    "| Candidate | Avg Win | Presets Beaten | New Skills | Team | Most Lopsided Wins |",
    "| --- | ---: | ---: | ---: | --- | --- |",
  ];
  for (const candidate of top) {
    const wins = candidate.results
      .filter((result) => result.winRate >= 0.8)
      .map((result) => `${result.presetKey} ${(result.winRate * 100).toFixed(0)}%`)
      .slice(0, 4)
      .join(", ") || "-";
    lines.push(`| ${candidate.id} | ${(candidate.avgWinRate * 100).toFixed(1)}% | ${candidate.wins}/${PRESET_KEYS.length} | ${candidate.newSkillCount} | ${formatTeam(candidate.team)} | ${wins} |`);
  }
  lines.push("", "## Interpretation", "");
  if (!risky.length) {
    lines.push("- No random candidate crossed the breaker risk line in this run.");
  } else {
    lines.push("- At least one candidate crossed the breaker risk line; inspect the top candidate before adding more power to shared skills.");
  }
  lines.push("- Risk line requires either 65%+ average win rate, or very broad matchup coverage plus 64%+ average win rate. Broad but shallow 55%-63% candidates are watch-list items, not automatic nerf triggers.");
  lines.push("- This is a batch gate, not a final balance proof. Archetype signal contracts still decide whether existing streams keep their intended shape.");
  lines.push("- If a new skill appears in multiple top breaker teams, tune that skill first before changing class baselines.");
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function formatTeam(team) {
  return team.map((unit) => {
    const roleName = SKILL_DATA.roleKits[unit.role]?.role || unit.role;
    const skills = [unit.small1, unit.small2, unit.passive, unit.ultimate]
      .filter((key) => NEW_SKILLS.has(key))
      .map((key) => SKILL_DATA.skills[key]?.name || key);
    return `${roleName}${skills.length ? `(${skills.join("/")})` : ""}`;
  }).join(" + ");
}

function addUnique(list, item) {
  if (item && !list.includes(item)) list.push(item);
}

function pick(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

function pickMany(list, count, rng) {
  const pool = [...list];
  const out = [];
  while (pool.length && out.length < count) {
    out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return out;
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
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

module.exports = { run };
