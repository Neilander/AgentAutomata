const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");

const MAIN_DB_FILE = path.join(__dirname, "team_pools", "team-pool-db.json");
const OUT_DIR = path.join(__dirname, "..", "design", "team_pool");
const MATRIX_FILE = path.join(OUT_DIR, "preset-vs-main-matrix.json");
const REPORT_FILE = path.join(OUT_DIR, "preset-vs-main-matrix-report.md");

const MATRIX_SCHEMA = "western_fantasy_preset_vs_main_matrix_v1";
const DEFAULT_MAIN_LIMIT = 200;

function run() {
  const args = parseArgs(process.argv.slice(2));
  const mainLimit = Number(args["main-limit"] || DEFAULT_MAIN_LIMIT);
  const mainDb = readJson(MAIN_DB_FILE);
  const presets = Object.entries(SKILL_DATA.presets || {}).map(([key, preset]) => ({
    id: key,
    name: preset.name || key,
    team: clonePreset(key),
  }));
  const mainTeams = (mainDb.teams || []).slice(0, mainLimit);
  const cells = [];
  const total = presets.length * mainTeams.length;
  const startedAt = Date.now();
  let completed = 0;

  for (const preset of presets) {
    for (const mainTeam of mainTeams) {
      cells.push(runCell(preset, mainTeam));
      completed += 1;
      if (completed % 1000 === 0 || completed === total) {
        console.log(`preset-main ${completed}/${total} cells in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
      }
    }
  }

  const matrix = {
    schema: MATRIX_SCHEMA,
    generatedAt: new Date().toISOString(),
    seedPolicy: "single deterministic seed per cell; fixed preset on left, generated main-pool team on right",
    presetCount: presets.length,
    mainTeamCount: mainTeams.length,
    cellCount: cells.length,
    presetSummary: summarizePresets(cells),
    mainTeamSummary: summarizeMainTeams(cells),
    patternSummary: summarizePatterns(cells),
    cells,
  };
  fs.mkdirSync(OUT_DIR, { recursive: true });
  writeJson(MATRIX_FILE, matrix);
  fs.writeFileSync(REPORT_FILE, renderReport(matrix), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), MATRIX_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), REPORT_FILE)}`);
  return matrix;
}

function runCell(preset, mainTeam) {
  const result = simulateTeams(cloneTeam(preset.team), toCombatTeam(mainTeam.team), {
    seed: `preset-vs-main|${preset.id}|${mainTeam.id}`,
    randomizeStats: false,
    maxTime: 75,
    healthInterval: 1,
  });
  const firstDeath = (result.signals || []).find((signal) => signal.tags?.includes("death"));
  return {
    presetId: preset.id,
    presetName: preset.name,
    mainTeamId: mainTeam.id,
    mainTeamName: mainTeam.name,
    mainTeamPattern: mainTeam.pattern,
    mainTeamPatternName: mainTeam.patternName,
    presetWin: result.winner === "left",
    winner: result.winner,
    duration: round(result.duration, 2),
    presetHp: round(result.leftHp, 3),
    mainHp: round(result.rightHp, 3),
    presetAlive: result.metrics.leftAlive,
    mainAlive: result.metrics.rightAlive,
    presetDamage: round(result.metrics.leftDamage, 1),
    mainDamage: round(result.metrics.rightDamage, 1),
    firstDeath: firstDeath ? {
      time: round(firstDeath.time || 0, 2),
      side: firstDeath.target?.side || "",
      role: firstDeath.target?.role || "",
      killerRole: firstDeath.meta?.killerRole || "",
    } : null,
    tags: cellTags(result),
  };
}

function cellTags(result) {
  const tags = [result.winner === "left" ? "preset-win" : "main-win"];
  if (result.duration <= 12) tags.push("fast");
  else if (result.duration >= 45) tags.push("long");
  if (result.leftHp >= 0.75 && result.winner === "left") tags.push("clean-preset-win");
  if (result.rightHp >= 0.75 && result.winner === "right") tags.push("clean-main-win");
  return tags;
}

function summarizePresets(cells) {
  return Object.values(groupBy(cells, (cell) => cell.presetId)).map((items) => {
    const wins = items.filter((cell) => cell.presetWin).length;
    return {
      presetId: items[0].presetId,
      presetName: items[0].presetName,
      games: items.length,
      wins,
      winRate: round(wins / items.length, 3),
      avgDuration: round(avg(items.map((cell) => cell.duration)), 2),
      avgPresetHp: round(avg(items.map((cell) => cell.presetHp)), 3),
      avgMainHp: round(avg(items.map((cell) => cell.mainHp)), 3),
      hardWins: items.filter((cell) => cell.presetWin && cell.presetHp >= 0.75).length,
      hardLosses: items.filter((cell) => !cell.presetWin && cell.mainHp >= 0.75).length,
    };
  }).sort((a, b) => b.winRate - a.winRate);
}

function summarizeMainTeams(cells) {
  return Object.values(groupBy(cells, (cell) => cell.mainTeamId)).map((items) => {
    const wins = items.filter((cell) => !cell.presetWin).length;
    return {
      mainTeamId: items[0].mainTeamId,
      mainTeamName: items[0].mainTeamName,
      mainTeamPatternName: items[0].mainTeamPatternName,
      games: items.length,
      wins,
      winRate: round(wins / items.length, 3),
      hardestPresets: items.filter((cell) => !cell.presetWin).map((cell) => cell.presetId),
      lossesToPresets: items.filter((cell) => cell.presetWin).map((cell) => cell.presetId),
    };
  }).sort((a, b) => b.winRate - a.winRate);
}

function summarizePatterns(cells) {
  return Object.values(groupBy(cells, (cell) => cell.mainTeamPatternName || cell.mainTeamPattern || "unknown")).map((items) => {
    const mainWins = items.filter((cell) => !cell.presetWin).length;
    return {
      pattern: items[0].mainTeamPatternName || items[0].mainTeamPattern,
      cells: items.length,
      mainWins,
      mainWinRate: round(mainWins / items.length, 3),
    };
  }).sort((a, b) => b.mainWinRate - a.mainWinRate);
}

function renderReport(matrix) {
  const lines = [
    "# Fixed Presets vs Generated Main Team Pool Matrix",
    "",
    "固定实验队在左，生成主池队伍在右。每格只打一局，只存 summary。",
    "",
    "## Scope",
    "",
    `- Fixed presets: ${matrix.presetCount}`,
    `- Generated main-pool teams: ${matrix.mainTeamCount}`,
    `- Cells / battles: ${matrix.cellCount}`,
    "",
    "## Fixed Preset Results",
    "",
    "| Preset | Win Rate | Wins | Hard Wins | Hard Losses |",
    "| --- | ---: | ---: | ---: | ---: |",
  ];
  for (const row of matrix.presetSummary) {
    lines.push(`| ${row.presetName} \`${row.presetId}\` | ${pct(row.winRate)} | ${row.wins}/${row.games} | ${row.hardWins} | ${row.hardLosses} |`);
  }
  lines.push("", "## Generated Main Pool Strength", "");
  lines.push(`- Generated teams beating no fixed preset: ${matrix.mainTeamSummary.filter((row) => row.wins === 0).length}/${matrix.mainTeamSummary.length}`);
  lines.push(`- Generated teams beating at least one fixed preset: ${matrix.mainTeamSummary.filter((row) => row.wins >= 1).length}/${matrix.mainTeamSummary.length}`);
  lines.push(`- Generated teams beating at least five fixed presets: ${matrix.mainTeamSummary.filter((row) => row.wins >= 5).length}/${matrix.mainTeamSummary.length}`);
  lines.push(`- Generated teams beating at least half of fixed presets: ${matrix.mainTeamSummary.filter((row) => row.winRate >= 0.5).length}/${matrix.mainTeamSummary.length}`);
  lines.push("", "### Strong Generated Teams", "");
  for (const row of matrix.mainTeamSummary.slice(0, 12)) {
    lines.push(`- ${row.mainTeamName} \`${row.mainTeamId}\`: ${row.wins}/${row.games}; beats ${row.hardestPresets.join(", ") || "-"}`);
  }
  lines.push("", "### Weak Generated Teams", "");
  for (const row of matrix.mainTeamSummary.slice().sort((a, b) => a.winRate - b.winRate).slice(0, 12)) {
    lines.push(`- ${row.mainTeamName} \`${row.mainTeamId}\`: ${row.wins}/${row.games}; loses to ${row.lossesToPresets.join(", ") || "-"}`);
  }
  lines.push("", "## Generated Pattern Summary", "");
  lines.push("| Pattern | Main Win Rate | Main Wins / Cells |");
  lines.push("| --- | ---: | ---: |");
  for (const row of matrix.patternSummary) {
    lines.push(`| ${row.pattern} | ${pct(row.mainWinRate)} | ${row.mainWins}/${row.cells} |`);
  }
  return `${lines.join("\n")}\n`;
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

module.exports = { run, runCell };
