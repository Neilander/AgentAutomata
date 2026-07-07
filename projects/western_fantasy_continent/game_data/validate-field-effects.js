const fs = require("fs");
const path = require("path");

const { simulateTeams } = require("./combat-sim");
const FIELD = require("./field-effects");

const OUT_DIR = path.join(__dirname, "..", "design", "field_effects");
const JSON_OUT = path.join(OUT_DIR, "field-effect-validation.json");
const MD_OUT = path.join(OUT_DIR, "field-effect-validation.md");

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const ordinaryTeams = FIELD.standardTeams.map((team) => ({
    ...team,
    team: FIELD.roleTeam(team.roles, team.id),
  }));

  const effects = FIELD.effects.map((effect) => validateEffect(effect, ordinaryTeams));
  const report = {
    schema: "western_fantasy_field_effect_validation_v1",
    generatedAt: new Date().toISOString(),
    combatOptions: { randomizeStats: false, maxTime: 75 },
    targetLiftByLevel: { 1: "about +20%", 2: "about +40%", 3: "about +70%" },
    effects,
  };
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(MD_OUT, renderMarkdown(report), "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), JSON_OUT)}`);
  console.log(`Wrote ${path.relative(process.cwd(), MD_OUT)}`);
  return report;
}

function validateEffect(effect, ordinaryTeams) {
  const favorableTeams = effect.favorableTeams.map((roles, index) => ({
    id: `${effect.id}_fav_${index + 1}`,
    name: `${effect.name} Fav ${index + 1}`,
    roles,
    team: FIELD.roleTeam(roles, `${effect.id}-fav-${index + 1}`),
  }));
  const levels = effect.levels.map((levelSpec) => validateLevel(effect, levelSpec.level, favorableTeams, ordinaryTeams));
  return {
    id: effect.id,
    name: effect.name,
    family: effect.family,
    targetSignal: effect.targetSignal,
    risk: effect.risk,
    favoredRoles: effect.favoredRoles,
    levels,
  };
}

function validateLevel(effect, level, favorableTeams, ordinaryTeams) {
  const favoredCells = [];
  for (const favored of favorableTeams) {
    for (const ordinary of ordinaryTeams) {
      const base = cellScore(favored.team, ordinary.team, `${effect.id}|base|${favored.id}|${ordinary.id}`);
      const fielded = FIELD.applyFieldEffectToTeams(favored.team, ordinary.team, effect.id, level);
      const withField = cellScore(fielded.leftTeam, fielded.rightTeam, `${effect.id}|L${level}|${favored.id}|${ordinary.id}`);
      favoredCells.push({
        favored: favored.id,
        opponent: ordinary.id,
        baseline: base.score,
        withField: withField.score,
        delta: round(withField.score - base.score),
        relativeLift: relativeLift(base.score, withField.score),
        winnerBefore: base.winner,
        winnerAfter: withField.winner,
      });
    }
  }

  const standardRows = ordinaryTeams.map((team) => {
    const cells = ordinaryTeams.filter((opponent) => opponent.id !== team.id).map((opponent) => {
      const base = cellScore(team.team, opponent.team, `${effect.id}|std-base|${team.id}|${opponent.id}`);
      const fielded = FIELD.applyFieldEffectToTeams(team.team, opponent.team, effect.id, level);
      const withField = cellScore(fielded.leftTeam, fielded.rightTeam, `${effect.id}|std-L${level}|${team.id}|${opponent.id}`);
      return {
        opponent: opponent.id,
        baseline: base.score,
        withField: withField.score,
        delta: round(withField.score - base.score),
      };
    });
    const avgDelta = avg(cells.map((cell) => cell.delta));
    return {
      id: team.id,
      name: team.name,
      roles: team.roles,
      avgDelta: round(avgDelta),
      benefits: avgDelta > 0.045,
      cells,
    };
  });

  const avgBaseline = avg(favoredCells.map((cell) => cell.baseline));
  const avgWithField = avg(favoredCells.map((cell) => cell.withField));
  const avgLift = relativeLift(avgBaseline, avgWithField);
  const beneficiaryCount = standardRows.filter((row) => row.benefits).length;
  const breadth = beneficiaryCount / standardRows.length;
  const verdict = verdictForLevel(level, avgLift, breadth);

  return {
    level,
    expectedLift: effect.levels[level - 1]?.expectedLift,
    avgBaseline: round(avgBaseline),
    avgWithField: round(avgWithField),
    avgRelativeLift: avgLift,
    standardBeneficiaryCount: beneficiaryCount,
    standardTeamCount: standardRows.length,
    breadth: round(breadth),
    verdict,
    favoredCells,
    standardRows,
  };
}

function cellScore(leftTeam, rightTeam, seed) {
  const result = simulateTeams(leftTeam, rightTeam, {
    seed,
    randomizeStats: false,
    maxTime: 75,
    healthInterval: 99,
  });
  const total = Math.max(1, result.leftHp + result.rightHp);
  return {
    winner: result.winner,
    score: round(result.leftHp / total),
    leftHp: result.leftHp,
    rightHp: result.rightHp,
  };
}

function verdictForLevel(level, lift, breadth) {
  const expected = { 1: 0.2, 2: 0.4, 3: 0.7 }[level] || 0.2;
  const liftOk = lift >= expected * 0.55 && lift <= expected * 1.75;
  const breadthOk = breadth >= 0.15 && breadth <= 0.65;
  if (liftOk && breadthOk) return "pass";
  if (!liftOk && breadthOk) return "tune_strength";
  if (liftOk && !breadthOk) return "tune_breadth";
  return "needs_redesign";
}

function renderMarkdown(report) {
  const lines = [
    "# Field Effect Validation",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Score is left-side remaining HP share. Lift compares favorable teams against ordinary teams before and after the field effect.",
    "",
    "| Field | L1 Lift | L1 Breadth | L1 Verdict | L2 Lift | L2 Breadth | L2 Verdict | L3 Lift | L3 Breadth | L3 Verdict |",
    "| --- | ---: | ---: | --- | ---: | ---: | --- | ---: | ---: | --- |",
  ];
  for (const effect of report.effects) {
    const row = effect.levels.map((level) => [pct(level.avgRelativeLift), pct(level.breadth), level.verdict]).flat();
    lines.push(`| ${effect.name} | ${row.join(" | ")} |`);
  }
  for (const effect of report.effects) {
    lines.push("", `## ${effect.name}`, "", effect.targetSignal, "", `Risk: ${effect.risk}`, "");
    for (const level of effect.levels) {
      const best = [...level.standardRows].sort((a, b) => b.avgDelta - a.avgDelta).slice(0, 3);
      lines.push(`- L${level.level}: favored lift ${pct(level.avgRelativeLift)}, standard breadth ${level.standardBeneficiaryCount}/${level.standardTeamCount}, verdict ${level.verdict}.`);
      lines.push(`  Best standard beneficiaries: ${best.map((row) => `${row.name} ${signedPct(row.avgDelta)}`).join(", ")}.`);
    }
  }
  return `${lines.join("\n")}\n`;
}

function avg(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relativeLift(before, after) {
  return round((after - before) / Math.max(0.08, before));
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function signedPct(value) {
  return `${value >= 0 ? "+" : ""}${pct(value)}`;
}

if (require.main === module) run();

module.exports = { run };
