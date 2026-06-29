const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");

const DB_DIR = path.join(__dirname, "team_pools");
const ROLE_DB_FILE = path.join(DB_DIR, "role-team-pool-db.json");
const MAIN_DB_FILE = path.join(DB_DIR, "team-pool-db.json");
const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const MAIN_MATRIX_FILE = path.join(OUT_DIR, "role-vs-main-matrix.json");
const MAIN_REPORT_FILE = path.join(OUT_DIR, "role-vs-main-matrix-report.md");
const PRESET_MATRIX_FILE = path.join(OUT_DIR, "role-vs-preset-matrix.json");
const PRESET_REPORT_FILE = path.join(OUT_DIR, "role-vs-preset-matrix-report.md");

const MATRIX_SCHEMA = "western_fantasy_role_vs_main_matrix_v1";
const DEFAULT_MAIN_LIMIT = 200;

function run() {
  const args = parseArgs(process.argv.slice(2));
  const roleFilter = args.role || "";
  const mainLimit = Number(args["main-limit"] || DEFAULT_MAIN_LIMIT);
  const opponentSource = args.opponents || "main";
  const roleDb = readJson(ROLE_DB_FILE);
  const roles = roleFilter ? [roleFilter] : Object.keys(roleDb.roles || {});
  for (const role of roles) {
    if (!roleDb.roles[role]) throw new Error(`Unknown role pool: ${role}`);
  }
  const opponents = opponentSource === "presets"
    ? loadPresetOpponents()
    : loadMainOpponents(mainLimit);
  const matrixFile = opponentSource === "presets" ? PRESET_MATRIX_FILE : MAIN_MATRIX_FILE;
  const reportFile = opponentSource === "presets" ? PRESET_REPORT_FILE : MAIN_REPORT_FILE;
  const cells = [];
  const total = roles.reduce((sum, role) => sum + roleDb.roles[role].teams.length * opponents.length, 0);
  let completed = 0;
  const startedAt = Date.now();

  for (const role of roles) {
    for (const roleTeam of roleDb.roles[role].teams) {
      for (const opponent of opponents) {
        cells.push(runCell(role, roleTeam, opponent, opponentSource));
        completed += 1;
        if (completed % 1000 === 0 || completed === total) {
          const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
          console.log(`matrix ${completed}/${total} cells in ${elapsed}s`);
        }
      }
    }
  }

  const matrix = {
    schema: MATRIX_SCHEMA,
    generatedAt: new Date().toISOString(),
    opponentSource,
    seedPolicy: "single deterministic seed per cell; rerun specific cells manually when deeper evidence is needed",
    roleTeamDatabase: path.relative(path.dirname(matrixFile), ROLE_DB_FILE).replace(/\\/g, "/"),
    opponentDatabase: opponentSource === "presets"
      ? "game_data/skill_assets/presets"
      : path.relative(path.dirname(matrixFile), MAIN_DB_FILE).replace(/\\/g, "/"),
    roleCount: roles.length,
    roleTeamCount: roles.reduce((sum, role) => sum + roleDb.roles[role].teams.length, 0),
    mainTeamCount: opponents.length,
    cellCount: cells.length,
    roleSummary: summarizeRoles(cells),
    roleTeamSummary: summarizeRoleTeams(cells),
    mainTeamSummary: summarizeMainTeams(cells),
    cells,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeJson(matrixFile, matrix);
  fs.writeFileSync(reportFile, renderReport(matrix), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), matrixFile)}`);
  console.log(`wrote ${path.relative(process.cwd(), reportFile)}`);
  return matrix;
}

function runCell(role, roleTeamEntry, mainTeamEntry, opponentSource = "main") {
  const focusIndex = Number.isFinite(roleTeamEntry.focusUnitIndex) ? roleTeamEntry.focusUnitIndex : roleTeamEntry.team.findIndex((unit) => unit.role === role);
  const result = simulateTeams(toCombatTeam(roleTeamEntry.team), toCombatTeam(mainTeamEntry.team), {
    seed: `role-matrix|${opponentSource}|${role}|${roleTeamEntry.id}|${mainTeamEntry.id}`,
    randomizeStats: false,
    maxTime: 75,
    healthInterval: 1,
  });
  const focusUnit = result.units.find((unit) => unit.side === "left" && unit.index === focusIndex);
  const firstDeath = (result.signals || []).find((signal) => signal.tags?.includes("death"));
  const focusRef = focusUnit?.id || "";
  const focusSignals = (result.signals || []).filter((signal) => signal.source?.id === focusRef || signal.target?.id === focusRef);
  const focusHeal = amount(focusSignals.filter((signal) => signal.tags?.includes("heal") && signal.source?.id === focusRef));
  const focusShield = amount(focusSignals.filter((signal) => signal.tags?.includes("shield") && signal.source?.id === focusRef));
  const cell = {
    role,
    roleName: roleName(role),
    roleTeamId: roleTeamEntry.id,
    roleTeamName: roleTeamEntry.name,
    roleTeamPattern: roleTeamEntry.pattern,
    roleTeamPatternName: roleTeamEntry.patternName,
    mainTeamId: mainTeamEntry.id,
    mainTeamName: mainTeamEntry.name,
    mainTeamPattern: mainTeamEntry.pattern,
    mainTeamPatternName: mainTeamEntry.patternName,
    win: result.winner === "left",
    winner: result.winner,
    duration: round(result.duration, 2),
    leftHp: round(result.leftHp, 3),
    rightHp: round(result.rightHp, 3),
    leftAlive: result.metrics.leftAlive,
    rightAlive: result.metrics.rightAlive,
    leftDamage: round(result.metrics.leftDamage, 1),
    rightDamage: round(result.metrics.rightDamage, 1),
    leftHealing: round(result.metrics.leftHealing, 1),
    leftShield: round(result.metrics.leftShield, 1),
    focus: {
      index: focusIndex,
      role: focusUnit?.role || role,
      alive: Boolean(focusUnit?.alive),
      hpRatio: round(focusUnit?.hpRatio || 0, 3),
      damage: round(focusUnit?.damageDone || 0, 1),
      heal: round(focusHeal, 1),
      shield: round(focusShield, 1),
    },
    firstDeath: firstDeath ? {
      time: round(firstDeath.time || 0, 2),
      side: firstDeath.target?.side || "",
      role: firstDeath.target?.role || "",
      killerRole: firstDeath.meta?.killerRole || "",
    } : null,
  };
  cell.tags = cellTags(cell);
  return cell;
}

function loadMainOpponents(mainLimit) {
  const mainDb = readJson(MAIN_DB_FILE);
  return (mainDb.teams || []).slice(0, mainLimit);
}

function loadPresetOpponents() {
  return Object.entries(SKILL_DATA.presets || {}).map(([id, preset]) => ({
    id,
    name: preset.name || id,
    source: "standard-preset",
    pattern: "standard_preset",
    patternName: "标准固定流派",
    tags: ["standard_preset", preset.design?.primaryOutput || ""].filter(Boolean),
    team: structuredClone(preset.team || []),
  }));
}

function cellTags(cell) {
  const tags = [cell.win ? "win" : "loss"];
  if (cell.duration <= 12) tags.push("fast");
  else if (cell.duration >= 45) tags.push("long");
  if (cell.focus.damage >= Math.max(220, cell.leftDamage * 0.25)) tags.push("focus-damage");
  if (cell.focus.heal + cell.focus.shield >= Math.max(180, (cell.leftHealing + cell.leftShield) * 0.3)) tags.push("focus-sustain");
  if (cell.focus.alive) tags.push("focus-alive");
  if (cell.leftHp >= 0.75 && cell.win) tags.push("clean-win");
  if (!cell.win && cell.rightHp >= 0.75) tags.push("hard-loss");
  if (cell.firstDeath?.side === "right") tags.push("first-kill");
  if (cell.firstDeath?.side === "left") tags.push("first-death");
  return tags;
}

function summarizeRoles(cells) {
  return Object.values(groupBy(cells, (cell) => cell.role)).map((items) => {
    const role = items[0].role;
    const wins = items.filter((cell) => cell.win).length;
    const hardWins = items.filter((cell) => cell.win && cell.leftHp >= 0.7).length;
    const hardLosses = items.filter((cell) => !cell.win && cell.rightHp >= 0.7).length;
    return {
      role,
      roleName: roleName(role),
      games: items.length,
      wins,
      winRate: round(wins / items.length, 3),
      avgDuration: round(avg(items.map((cell) => cell.duration)), 2),
      avgLeftHp: round(avg(items.map((cell) => cell.leftHp)), 3),
      avgRightHp: round(avg(items.map((cell) => cell.rightHp)), 3),
      avgFocusDamage: round(avg(items.map((cell) => cell.focus.damage)), 1),
      avgFocusSustain: round(avg(items.map((cell) => cell.focus.heal + cell.focus.shield)), 1),
      focusAliveRate: round(avg(items.map((cell) => cell.focus.alive ? 1 : 0)), 3),
      hardWins,
      hardLosses,
      bestRoleTeams: topRoleTeams(items, true),
      weakestRoleTeams: topRoleTeams(items, false),
      bestTargets: topMainTargets(items, true),
      worstTargets: topMainTargets(items, false),
    };
  }).sort((a, b) => b.winRate - a.winRate);
}

function summarizeRoleTeams(cells) {
  return Object.values(groupBy(cells, (cell) => `${cell.role}:${cell.roleTeamId}`)).map((items) => summarizeTeamCells(items[0].role, items[0].roleTeamId, items[0].roleTeamName, items)).sort((a, b) => b.winRate - a.winRate);
}

function summarizeMainTeams(cells) {
  return Object.values(groupBy(cells, (cell) => cell.mainTeamId)).map((items) => {
    const losses = items.filter((cell) => cell.win).length;
    return {
      mainTeamId: items[0].mainTeamId,
      mainTeamName: items[0].mainTeamName,
      mainTeamPatternName: items[0].mainTeamPatternName,
      games: items.length,
      lossesToRolePool: losses,
      lossRate: round(losses / items.length, 3),
      hardestForRoles: topRolesAgainstMain(items, false),
      easiestForRoles: topRolesAgainstMain(items, true),
    };
  }).sort((a, b) => b.lossRate - a.lossRate);
}

function summarizeTeamCells(role, id, name, items) {
  const wins = items.filter((cell) => cell.win).length;
  return {
    role,
    roleName: roleName(role),
    roleTeamId: id,
    roleTeamName: name,
    games: items.length,
    wins,
    winRate: round(wins / items.length, 3),
    avgDuration: round(avg(items.map((cell) => cell.duration)), 2),
    avgLeftHp: round(avg(items.map((cell) => cell.leftHp)), 3),
    avgFocusDamage: round(avg(items.map((cell) => cell.focus.damage)), 1),
    avgFocusSustain: round(avg(items.map((cell) => cell.focus.heal + cell.focus.shield)), 1),
    focusAliveRate: round(avg(items.map((cell) => cell.focus.alive ? 1 : 0)), 3),
  };
}

function topRoleTeams(cells, best) {
  return Object.values(groupBy(cells, (cell) => cell.roleTeamId))
    .map((items) => summarizeTeamCells(items[0].role, items[0].roleTeamId, items[0].roleTeamName, items))
    .sort((a, b) => best ? b.winRate - a.winRate : a.winRate - b.winRate)
    .slice(0, 3)
    .map((item) => ({ id: item.roleTeamId, name: item.roleTeamName, winRate: item.winRate }));
}

function topMainTargets(cells, best) {
  return Object.values(groupBy(cells, (cell) => cell.mainTeamId))
    .map((items) => {
      const wins = items.filter((cell) => cell.win).length;
      return { id: items[0].mainTeamId, name: items[0].mainTeamName, winRate: round(wins / items.length, 3) };
    })
    .sort((a, b) => best ? b.winRate - a.winRate : a.winRate - b.winRate)
    .slice(0, 5);
}

function topRolesAgainstMain(cells, mainWins) {
  return Object.values(groupBy(cells, (cell) => cell.role))
    .map((items) => {
      const roleWins = items.filter((cell) => cell.win).length;
      return { role: items[0].role, roleName: roleName(items[0].role), roleWinRate: round(roleWins / items.length, 3) };
    })
    .sort((a, b) => mainWins ? a.roleWinRate - b.roleWinRate : b.roleWinRate - a.roleWinRate)
    .slice(0, 3);
}

function renderReport(matrix) {
  const lines = [
    matrix.opponentSource === "presets"
      ? "# Role Team Pool vs Fixed Preset Matrix"
      : "# Role Team Pool vs Main Team Pool Matrix",
    "",
    "每个格子只存一场确定性对局的 summary，不保存完整 signals / replay。需要看具体对局时，用对应 roleTeamId 和 mainTeamId 重新跑。",
    "",
    "## Scope",
    "",
    `- Roles: ${matrix.roleCount}`,
    `- Role teams: ${matrix.roleTeamCount}`,
    `- Opponent source: ${matrix.opponentSource}`,
    `- Opponent teams: ${matrix.mainTeamCount}`,
    `- Cells / battles: ${matrix.cellCount}`,
    `- Seed policy: ${matrix.seedPolicy}`,
    "",
    "## Role Summary",
    "",
    "| Role | Win Rate | Wins | Avg Focus Damage | Avg Focus Sustain | Focus Alive | Hard Wins | Hard Losses | Best Role Teams | Weak Role Teams |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |",
  ];
  for (const row of matrix.roleSummary) {
    lines.push(`| ${row.roleName} \`${row.role}\` | ${pct(row.winRate)} | ${row.wins}/${row.games} | ${row.avgFocusDamage} | ${row.avgFocusSustain} | ${pct(row.focusAliveRate)} | ${row.hardWins} | ${row.hardLosses} | ${row.bestRoleTeams.map(formatMiniRate).join("<br>")} | ${row.weakestRoleTeams.map(formatMiniRate).join("<br>")} |`);
  }
  lines.push("", "## Opponent Pool Pressure", "");
  lines.push("下面是最容易被职业小池打穿的对手队伍，以及最难打的对手队伍。");
  lines.push("", "### Most Beaten Opponent Teams", "");
  for (const item of matrix.mainTeamSummary.slice(0, 10)) {
    lines.push(`- ${item.mainTeamName} \`${item.mainTeamId}\`: role-pool win ${pct(item.lossRate)}; vulnerable to ${item.hardestForRoles.map((role) => `${role.roleName} ${pct(role.roleWinRate)}`).join(", ")}`);
  }
  lines.push("", "### Hardest Opponent Teams", "");
  for (const item of matrix.mainTeamSummary.slice().sort((a, b) => a.lossRate - b.lossRate).slice(0, 10)) {
    lines.push(`- ${item.mainTeamName} \`${item.mainTeamId}\`: role-pool win ${pct(item.lossRate)}; best into it ${item.hardestForRoles.map((role) => `${role.roleName} ${pct(role.roleWinRate)}`).join(", ")}`);
  }
  lines.push("", "## Initial Interpretation", "");
  const strongest = matrix.roleSummary[0];
  const weakest = matrix.roleSummary[matrix.roleSummary.length - 1];
  lines.push(`- 当前最高职业小池：${strongest.roleName} ${pct(strongest.winRate)}。`);
  lines.push(`- 当前最低职业小池：${weakest.roleName} ${pct(weakest.winRate)}。`);
  lines.push("- 这不是职业单体强度结论，而是“该职业的 10 个测试队伍进入当前主池环境”的结果。");
  lines.push("- 如果某职业偏高，先看 best role teams 是否集中在 1-2 个队伍；如果集中，可能是队伍壳或技能组合问题，不一定是职业整体问题。");
  lines.push("- 如果某职业偏低，先看 focus damage / focus sustain / focus alive，判断是焦点没贡献、站不住，还是队伍模板不适合它。");
  return `${lines.join("\n")}\n`;
}

function formatMiniRate(item) {
  return `${item.id} ${pct(item.winRate)}`;
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

function amount(signals) {
  return signals.reduce((sum, signal) => sum + (signal.amount || 0), 0);
}

function roleName(role) {
  return SKILL_DATA.roleKits[role]?.role || role;
}

function groupBy(items, fn) {
  const groups = {};
  for (const item of items) {
    const key = fn(item);
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
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

module.exports = { run, runCell, summarizeRoles };
