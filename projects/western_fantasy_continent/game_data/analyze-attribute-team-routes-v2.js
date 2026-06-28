const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");
const { ROLE_ATTRS, ATTRS, buildRoutes, unitSpec, standardPoints, pct, round } = require("./analyze-attribute-build-routes-v2");

const OUT_FILE = path.join(__dirname, "..", "design", "attribute-team-route-simulation-v2.md");
const SAMPLES_PER_ROUTE = 28;
const TEAM_SIZES = [2, 4];

function run() {
  const roles = Object.keys(ROLE_ATTRS).filter((role) => SKILL_DATA.roleKits[role]);
  const routeByRole = Object.fromEntries(roles.map((role) => [role, buildRoutes(role)]));
  const rows = roles.map((role) => analyzeRole(role, roles, routeByRole));
  fs.writeFileSync(OUT_FILE, renderReport(rows), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

function analyzeRole(role, roles, routeByRole) {
  const routes = buildRoutes(role).map((route) => analyzeRoute(role, route, roles, routeByRole));
  const bySize = Object.fromEntries(TEAM_SIZES.map((size) => {
    const sorted = [...routes].sort((a, b) => b.sizes[size].winRate - a.sizes[size].winRate || b.sizes[size].avgDamage - a.sizes[size].avgDamage);
    const best = sorted[0];
    const viable = sorted.filter((route) => route.sizes[size].winRate >= 0.38 && best.sizes[size].winRate - route.sizes[size].winRate <= 0.1);
    return [size, { sorted, best, viable }];
  }));
  const issues = [];
  for (const size of TEAM_SIZES) {
    if (bySize[size].viable.length < 2) issues.push(`${size}v${size}有效路线少于2条`);
    if (bySize[size].best.kind === "survival" && !["knight", "priest"].includes(role)) issues.push(`${size}v${size}纯生存最优`);
    if (bySize[size].sorted.some((route, index) => route.kind === "wrong" && index < 2 && route.sizes[size].winRate >= 0.45)) issues.push(`${size}v${size}错属性进前二`);
  }
  return { role, routes, bySize, issues };
}

function analyzeRoute(role, route, roles, routeByRole) {
  const sizes = {};
  for (const teamSize of TEAM_SIZES) {
    const games = [];
    for (let sample = 0; sample < SAMPLES_PER_ROUTE; sample += 1) {
      const scenarioKey = `team-route|${role}|${teamSize}|${sample}`;
      const rng = seededRandom(scenarioKey);
      const left = buildTeamWithFocus(role, route, teamSize, roles, routeByRole, rng);
      const right = buildRandomTeam(teamSize, roles, routeByRole, rng);
      const result = simulateTeams(left, right, {
        seed: `${scenarioKey}|combat`,
        randomizeStats: false,
        maxTime: 75,
      });
      const focal = result.units.find((unit) => unit.side === "left" && unit.index === 0);
      games.push({
        won: result.winner === "left",
        teamDamage: result.metrics.leftDamage,
        teamHp: result.leftHp,
        focalDamage: focal?.damageDone || 0,
        focalAlive: focal?.alive ? 1 : 0,
        opponentRoles: right.map((unit) => unit.role),
        allyRoles: left.slice(1).map((unit) => unit.role),
      });
    }
    sizes[teamSize] = summarizeGames(games);
  }
  return { ...route, sizes };
}

function buildTeamWithFocus(role, route, teamSize, roles, routeByRole, rng) {
  const team = [unitSpec(role, route.points, route.label)];
  while (team.length < teamSize) {
    const allyRole = pick(roles, rng);
    const allyRoute = pickPlayableRoute(routeByRole[allyRole], rng);
    team.push(unitSpec(allyRole, allyRoute.points, allyRoute.label));
  }
  return team.map((unit, index) => ({ ...unit, slotIndex: index }));
}

function buildRandomTeam(teamSize, roles, routeByRole, rng) {
  const team = [];
  while (team.length < teamSize) {
    const role = pick(roles, rng);
    const route = pickPlayableRoute(routeByRole[role], rng);
    team.push(unitSpec(role, route.points, route.label));
  }
  return team.map((unit, index) => ({ ...unit, slotIndex: index }));
}

function pickPlayableRoute(routes, rng) {
  const pool = routes.filter((route) => route.kind === "expected" || route.kind === "survival" || route.kind === "speed" || route.kind === "redteam");
  return pick(pool, rng);
}

function summarizeGames(games) {
  const wins = games.filter((game) => game.won).length;
  return {
    games: games.length,
    winRate: wins / games.length,
    avgTeamDamage: avg(games.map((game) => game.teamDamage)),
    avgTeamHp: avg(games.map((game) => game.teamHp)),
    avgDamage: avg(games.map((game) => game.focalDamage)),
    aliveRate: avg(games.map((game) => game.focalAlive)),
    commonWins: topRoles(games.filter((game) => game.won).flatMap((game) => game.opponentRoles)),
    commonLosses: topRoles(games.filter((game) => !game.won).flatMap((game) => game.opponentRoles)),
  };
}

function renderReport(rows) {
  const lines = [];
  lines.push("# Attribute System v2 Team Route Simulation");
  lines.push("");
  lines.push("本报告补充 `attribute-build-route-simulation-v2.md` 的 2v2/4v4 团战抽样。");
  lines.push("");
  lines.push("重要边界：不改职业基础数值。每个职业每条路线作为一个焦点单位，放进随机 2v2 和 4v4 队伍中，队友和敌人也随机职业/随机路线。");
  lines.push("");
  lines.push("## 测试方法");
  lines.push("");
  lines.push(`- 每个职业每条路线，每种队伍规模抽样 ${SAMPLES_PER_ROUTE} 场。`);
  lines.push("- 焦点单位固定在左队第 1 位，其余队友随机。");
  lines.push("- 敌方全队随机职业和随机路线。");
  lines.push("- 统计焦点路线所在队伍胜率、焦点平均伤害、焦点存活率。");
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push("| 职业 | 2v2最优 | 2v2有效路线 | 4v4最优 | 4v4有效路线 | 问题 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const row of rows) {
    const two = row.bySize[2];
    const four = row.bySize[4];
    lines.push(`| ${roleName(row.role)} | ${two.best.label} ${pct(two.best.sizes[2].winRate)} | ${two.viable.map((route) => `${route.label} ${pct(route.sizes[2].winRate)}`).join(" / ") || "无"} | ${four.best.label} ${pct(four.best.sizes[4].winRate)} | ${four.viable.map((route) => `${route.label} ${pct(route.sizes[4].winRate)}`).join(" / ") || "无"} | ${row.issues.join("；") || "无"} |`);
  }
  lines.push("");
  lines.push("## 分职业详情");
  for (const row of rows) {
    lines.push("");
    lines.push(`### ${roleName(row.role)}`);
    lines.push("");
    lines.push(`主副属性：${ATTRS[ROLE_ATTRS[row.role][0]]} / ${ATTRS[ROLE_ATTRS[row.role][1]]}`);
    for (const size of TEAM_SIZES) {
      lines.push("");
      lines.push(`#### ${size}v${size}`);
      lines.push("");
      lines.push("| 排名 | 路线 | 类型 | 队伍胜率 | 焦点伤害 | 焦点存活 | 常赢对手 | 常输对手 |");
      lines.push("| ---: | --- | --- | ---: | ---: | ---: | --- | --- |");
      row.bySize[size].sorted.forEach((route, index) => {
        const stats = route.sizes[size];
        lines.push(`| ${index + 1} | ${route.label} | ${kindName(route.kind)} | ${pct(stats.winRate)} | ${round(stats.avgDamage, 1)} | ${pct(stats.aliveRate)} | ${stats.commonWins.map(roleName).join("、") || "-"} | ${stats.commonLosses.map(roleName).join("、") || "-"} |`);
      });
    }
  }
  lines.push("");
  lines.push("## 初步观察");
  lines.push("");
  lines.push("- 这份报告应该和 1v1 报告一起看。1v1 里纯坚韧偏强，团战里如果仍然偏强，才说明坚韧换算确实过高。");
  lines.push("- 诗人、牧师、炼金、游侠这类依赖队伍环境的职业，主要看 4v4。");
  lines.push("- 狂战如果在 4v4 仍然所有路线都很强，说明它是职业基础机制泛强，而不是单挑误差。");
  lines.push("");
  return lines.join("\n");
}

function roleName(role) {
  return SKILL_DATA.roleKits[role]?.name || role;
}

function kindName(kind) {
  return {
    expected: "预设",
    survival: "生存红队",
    speed: "速度红队",
    wrong: "错属性红队",
    redteam: "分散红队",
  }[kind] || kind;
}

function topRoles(roles) {
  const counts = new Map();
  for (const role of roles) counts.set(role, (counts.get(role) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([role]) => role);
}

function pick(items, rng) {
  return items[Math.floor(rng() * items.length)];
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
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
