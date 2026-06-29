const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");

const OUT_DIR = path.join(__dirname, "..", "design", "balance");
const REPORT_FILE = path.join(OUT_DIR, "ecology-tool-team-search-report.md");
const JSON_FILE = path.join(OUT_DIR, "ecology-tool-team-search.json");
const WATERLINE_FILE = path.join(__dirname, "team_pools", "mob-waterline-db.json");
const WATERLINE_REPORT = path.join(OUT_DIR, "ecology-tool-waterline-report.md");

const SEEDS = Array.from({ length: 12 }, (_, index) => `eco-tool-${index + 1}`);
const MATRIX_SEEDS = Array.from({ length: 8 }, (_, index) => `eco-matrix-${index + 1}`);
const MAX_ATTEMPTS = 50;

const PACKAGES = [
  {
    id: "anti_crown_tools",
    name: "Anti Crown Tools",
    primaryTargets: ["crownCarry"],
    required: ["oathbreakerSlash", "kingmarkShot", "shieldwallRiposte"],
    roles: ["warrior", "ranger", "knight", "mage", "priest", "bard"],
    note: "shield pressure, highest-power mark, and counter-frontline",
  },
  {
    id: "anti_fire_tools",
    name: "Anti Fire Tools",
    primaryTargets: ["fireBurst"],
    required: ["emberPrayer", "cooldownRift", "filterElixir"],
    requiredCounts: { emberPrayer: 2 },
    roles: ["priest", "priest", "mage", "knight", "alchemist", "warrior", "warlock"],
    note: "early guard cleanse, skill-window delay, and DOT resistance",
  },
  {
    id: "anti_poison_tools",
    name: "Anti Poison Tools",
    primaryTargets: ["poisonBloom"],
    required: ["bloodCleanse", "filterElixir", "frenzyBreakRoar"],
    roles: ["priest", "alchemist", "berserker", "knight", "warrior", "ranger"],
    note: "poison cleanse, DOT resistance, and low-health rush",
  },
  {
    id: "anti_melee_tools",
    name: "Anti Melee Tools",
    primaryTargets: ["shadowExecute", "bloodRage", "lightningTempo"],
    required: ["shieldwallRiposte", "oathbreakerSlash", "kingmarkShot"],
    roles: ["knight", "warrior", "ranger", "priest", "bard", "mage"],
    note: "shield counter, taunt window, and focused marks",
  },
];

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pools = buildRoleSkillPools();
  const selected = [];
  const packageReports = PACKAGES.map((pkg) => {
    const candidates = generateCandidates(pkg, pools).slice(0, MAX_ATTEMPTS);
    const scored = candidates.map((team, index) => scoreCandidate(pkg, team, `${pkg.id}-${index + 1}`));
    scored.sort((a, b) => b.primaryWinRate - a.primaryWinRate || b.avgWinRate - a.avgWinRate);
    const best = scored[0];
    if (best && best.primaryWinRate >= 0.6) selected.push(best);
    return { package: pkg, attempts: scored.length, best, top: scored.slice(0, 5) };
  });

  const matrix = buildSelectedMatrix(selected);
  const passedPrimary = PACKAGES.every((pkg) => selected.some((team) => team.packageId === pkg.id));
  const output = {
    generatedAt: new Date().toISOString(),
    maxAttemptsPerPackage: MAX_ATTEMPTS,
    passedPrimary,
    packages: packageReports,
    selected,
    matrix,
  };

  writeJson(JSON_FILE, output);
  fs.writeFileSync(REPORT_FILE, renderReport(output), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), JSON_FILE)}`);

  if (passedPrimary && fs.existsSync(WATERLINE_FILE)) {
    const waterline = scoreWaterline(selected);
    fs.writeFileSync(WATERLINE_REPORT, renderWaterlineReport(waterline), "utf8");
    console.log(`wrote ${path.relative(process.cwd(), WATERLINE_REPORT)}`);
  } else if (!passedPrimary) {
    console.log("skip waterline: primary standard-team goals not met");
  } else {
    console.log("skip waterline: mob-waterline-db.json missing");
  }
}

function buildRoleSkillPools() {
  const pools = {};
  for (const [role, kit] of Object.entries(SKILL_DATA.roleKits)) {
    pools[role] = {
      small: [kit.kit.small1, kit.kit.small2],
      passive: [kit.kit.passive],
      ultimate: [kit.kit.ultimate],
    };
  }
  for (const [key, skill] of Object.entries(SKILL_DATA.skills)) {
    for (const role of skill.roleKeys || []) {
      if (!pools[role]) continue;
      if (skill.passive || skill.type === "被动") addUnique(pools[role].passive, key);
      else if (skill.type === "大招") addUnique(pools[role].ultimate, key);
      else addUnique(pools[role].small, key);
    }
  }
  return pools;
}

function generateCandidates(pkg, pools) {
  const rng = seededRandom(pkg.id);
  const candidates = [];
  for (let attempt = 0; attempt < MAX_ATTEMPTS * 3 && candidates.length < MAX_ATTEMPTS; attempt += 1) {
    const roles = shuffle(pkg.roles, rng).slice(0, 4);
    const team = roles.map((role) => makeUnit(role, pools, rng));
    placeRequiredSkills(team, pkg.required, pools, rng);
    placeRequiredSkillCounts(team, pkg.requiredCounts, pools, rng);
    if (!meetsRequiredSkills(team, pkg.required, pkg.requiredCounts)) continue;
    candidates.push(team);
  }
  return candidates;
}

function makeUnit(role, pools, rng) {
  const kit = SKILL_DATA.roleKits[role].kit;
  const smalls = shuffle(pools[role].small, rng);
  return {
    role,
    small1: smalls[0] || kit.small1,
    small2: smalls[1] || kit.small2,
    passive: pick(pools[role].passive, rng) || kit.passive,
    ultimate: pick(pools[role].ultimate, rng) || kit.ultimate,
  };
}

function placeRequiredSkills(team, required, pools, rng) {
  for (const skillKey of required) {
    if (team.some((unit) => Object.values(unit).includes(skillKey))) continue;
    const skill = SKILL_DATA.skills[skillKey];
    const roles = skill.roleKeys || [];
    let unit = team.find((candidate) => roles.includes(candidate.role));
    if (!unit) {
      const role = roles.find(Boolean);
      if (!role) continue;
      unit = makeUnit(role, pools, rng);
      team[Math.floor(rng() * team.length)] = unit;
    }
    if (skill.passive || skill.type === "被动") unit.passive = skillKey;
    else if (skill.type === "大招") unit.ultimate = skillKey;
    else if (unit.small1 === unit.small2 || rng() < 0.5) unit.small1 = skillKey;
    else unit.small2 = skillKey;
  }
}

function placeRequiredSkillCounts(team, requiredCounts, pools, rng) {
  if (!requiredCounts) return;
  for (const [skillKey, count] of Object.entries(requiredCounts)) {
    for (let index = countSkill(team, skillKey); index < count; index += 1) {
      placeRequiredSkills(team, [skillKey], pools, rng);
      if (countSkill(team, skillKey) < index + 1) {
        const skill = SKILL_DATA.skills[skillKey];
        const role = skill?.roleKeys?.[0];
        if (!role) continue;
        const unit = makeUnit(role, pools, rng);
        assignSkill(unit, skillKey, skill);
        team[Math.floor(rng() * team.length)] = unit;
      }
    }
  }
}

function meetsRequiredSkills(team, required, requiredCounts) {
  const hasSingles = required.every((skill) => team.some((unit) => Object.values(unit).includes(skill)));
  const hasCounts = Object.entries(requiredCounts || {}).every(([skill, count]) => countSkill(team, skill) >= count);
  return hasSingles && hasCounts;
}

function countSkill(team, skillKey) {
  return team.filter((unit) => Object.values(unit).includes(skillKey)).length;
}

function assignSkill(unit, skillKey, skill = SKILL_DATA.skills[skillKey]) {
  if (skill.passive || skill.type === "琚姩") unit.passive = skillKey;
  else if (skill.type === "澶ф嫑") unit.ultimate = skillKey;
  else if (unit.small1 === unit.small2) unit.small1 = skillKey;
  else unit.small2 = skillKey;
}

function scoreCandidate(pkg, team, id) {
  const primaryResults = pkg.primaryTargets.flatMap((target) => runSeries(team, clonePreset(target), `${id}|${target}`));
  const primaryWinRate = winRate(primaryResults);
  const presetRows = Object.keys(SKILL_DATA.presets).map((presetId) => {
    const results = runSeries(team, clonePreset(presetId), `${id}|all|${presetId}`);
    return { presetId, winRate: winRate(results), avgDuration: avg(results.map((item) => item.duration)) };
  });
  return {
    id,
    packageId: pkg.id,
    packageName: pkg.name,
    note: pkg.note,
    primaryTargets: pkg.primaryTargets,
    primaryWinRate: round(primaryWinRate),
    avgWinRate: round(avg(presetRows.map((row) => row.winRate))),
    hardPrey: presetRows.filter((row) => row.winRate >= 0.9).map((row) => row.presetId),
    hardPredators: presetRows.filter((row) => row.winRate <= 0.1).map((row) => row.presetId),
    team,
    presetRows,
  };
}

function runSeries(leftTeam, rightTeam, seedPrefix, seeds = SEEDS) {
  return seeds.map((seed) => simulateTeams(clone(leftTeam), clone(rightTeam), {
    seed: `${seedPrefix}|${seed}`,
    randomizeStats: false,
    healthInterval: 1,
  }));
}

function buildSelectedMatrix(selected) {
  return selected.map((team) => ({
    id: team.id,
    packageId: team.packageId,
    rows: Object.keys(SKILL_DATA.presets).map((presetId) => {
      const results = runSeries(team.team, clonePreset(presetId), `selected|${team.id}|${presetId}`, MATRIX_SEEDS);
      return { presetId, winRate: round(winRate(results)) };
    }),
  }));
}

function scoreWaterline(selected) {
  const waterline = readJson(WATERLINE_FILE);
  return {
    generatedAt: new Date().toISOString(),
    teams: selected.map((team) => {
      const buckets = {};
      for (const mob of waterline.teams) {
        const results = runSeries(team.team, mob.team, `waterline|${team.id}|${mob.id}`, ["a", "b", "c"]);
        const bucket = buckets[mob.bucket] || { games: 0, wins: 0 };
        bucket.games += results.length;
        bucket.wins += results.filter((result) => result.winner === "left").length;
        buckets[mob.bucket] = bucket;
      }
      for (const bucket of Object.values(buckets)) bucket.winRate = round(bucket.wins / bucket.games);
      return { id: team.id, packageId: team.packageId, avgWinRate: round(avg(Object.values(buckets).map((bucket) => bucket.winRate))), buckets };
    }),
  };
}

function renderReport(output) {
  const lines = [];
  lines.push("# Ecology Tool Team Search");
  lines.push("");
  lines.push(`Max attempts per package: ${output.maxAttemptsPerPackage}`);
  lines.push(`Primary standard-team goals: ${output.passedPrimary ? "PASS" : "FAIL"}`);
  lines.push("");
  for (const item of output.packages) {
    lines.push(`## ${item.package.name} \`${item.package.id}\``);
    lines.push("");
    lines.push(`- Primary targets: ${item.package.primaryTargets.join(", ")}`);
    lines.push(`- Reusable function: ${item.package.note}`);
    lines.push(`- Attempts: ${item.attempts}`);
    if (item.best) {
      lines.push(`- Best: \`${item.best.id}\`, primary win ${pct(item.best.primaryWinRate)}, avg preset win ${pct(item.best.avgWinRate)}`);
      lines.push(`- Hard prey: ${item.best.hardPrey.join(", ") || "-"}`);
      lines.push(`- Hard predators: ${item.best.hardPredators.join(", ") || "-"}`);
      lines.push("");
      lines.push(renderTeam(item.best.team));
    }
    lines.push("");
    lines.push("| Candidate | Primary Win | Avg Preset Win | Hard Prey | Hard Predators |");
    lines.push("| --- | ---: | ---: | --- | --- |");
    for (const row of item.top) {
      lines.push(`| \`${row.id}\` | ${pct(row.primaryWinRate)} | ${pct(row.avgWinRate)} | ${row.hardPrey.join(", ") || "-"} | ${row.hardPredators.join(", ") || "-"} |`);
    }
    lines.push("");
  }
  lines.push("## Selected Matrix Into Existing Presets");
  lines.push("");
  for (const item of output.matrix) {
    lines.push(`### \`${item.id}\``);
    lines.push("");
    lines.push("| Preset | Win Rate |");
    lines.push("| --- | ---: |");
    for (const row of item.rows) lines.push(`| ${row.presetId} | ${pct(row.winRate)} |`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderWaterlineReport(output) {
  const lines = ["# Ecology Tool Waterline Report", ""];
  for (const team of output.teams) {
    lines.push(`## \`${team.id}\` ${team.packageId}`);
    lines.push("");
    lines.push(`- Avg bucket win: ${pct(team.avgWinRate)}`);
    lines.push("| Bucket | Wins/Games | Win Rate |");
    lines.push("| --- | ---: | ---: |");
    for (const [bucketId, bucket] of Object.entries(team.buckets)) {
      lines.push(`| ${bucketId} | ${bucket.wins}/${bucket.games} | ${pct(bucket.winRate)} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderTeam(team) {
  return team.map((unit, index) => `${index + 1}. ${unit.role}: ${unit.small1}, ${unit.small2}, ${unit.passive}, ${unit.ultimate}`).join("\n");
}

function winRate(results) {
  return results.filter((result) => result.winner === "left").length / results.length;
}

function addUnique(list, item) {
  if (item && !list.includes(item)) list.push(item);
}

function pick(items, rng) {
  if (!items?.length) return null;
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

function clone(value) {
  return structuredClone(value);
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
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

if (require.main === module) run();

module.exports = { run };
