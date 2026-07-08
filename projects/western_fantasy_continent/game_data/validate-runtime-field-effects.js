const fs = require("fs");
const path = require("path");

const SKILL_DATA = require("./skill-data");
const { simulateTeams, clonePreset } = require("./combat-sim");
const RUNTIME_FIELDS = require("./runtime-field-effects");

const OUT_DIR = path.join(__dirname, "..", "design", "field_effects");
const JSON_OUT = path.join(OUT_DIR, "runtime-field-effect-advantage.json");
const MD_OUT = path.join(OUT_DIR, "runtime-field-effect-advantage.md");
const WATERLINE_PATH = path.join(__dirname, "team_pools", "mob-waterline-db.json");

function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const waterline = readWaterline();
  const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] || waterline.length);
  const opponents = waterline.slice(0, Math.min(limit, waterline.length));
  const baseCache = new Map();
  const effects = RUNTIME_FIELDS.effects.map((effect) => validateEffect(effect, opponents, baseCache));
  const report = {
    schema: "western_fantasy_runtime_field_effect_advantage_v1",
    generatedAt: new Date().toISOString(),
    waterline: {
      source: path.relative(path.join(__dirname, ".."), WATERLINE_PATH).replace(/\\/g, "/"),
      totalAvailable: waterline.length,
      used: opponents.length,
    },
    combatOptions: { randomizeStats: false, maxTime: 75 },
    method: "For every candidate team, run the same waterline without the field and then with the field. Also run one-role swap tests where both before and after teams use the same field effect.",
    effects,
  };
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(MD_OUT, renderMarkdown(report), "utf8");
  console.log(`Wrote ${path.relative(process.cwd(), JSON_OUT)}`);
  console.log(`Wrote ${path.relative(process.cwd(), MD_OUT)}`);
  return report;
}

function validateEffect(effect, opponents, baseCache) {
  const rows = effect.candidates.map((candidate) => {
    const team = materializeCandidate(candidate);
    const base = scoreAgainstWaterline(team, opponents, null, baseCache);
    const field = scoreAgainstWaterline(team, opponents, effect.id, null, base);
    return {
      id: candidate.id,
      roles: team.map((unit) => unit.role),
      baseWins: base.wins,
      fieldWins: field.wins,
      baseRate: round(base.rate),
      fieldRate: round(field.rate),
      absoluteLift: round(field.rate - base.rate),
      relativeLift: relativeLift(base.rate, field.rate),
      flipsToWin: field.flipsToWin,
      flipsToLoss: field.flipsToLoss,
      reason: candidate.reason || reasonFor(effect.id, candidate.id),
    };
  }).sort((a, b) => (b.absoluteLift - a.absoluteLift) || (b.relativeLift - a.relativeLift));

  const top = rows.slice(0, 3);
  const swapRows = (effect.swaps || []).map((swap) => validateSwap(effect, swap, opponents));
  return {
    id: effect.id,
    name: effect.name,
    focus: effect.focus,
    expected: effect.expected,
    topAdvantage: top.map((row) => ({
      id: row.id,
      absoluteLift: row.absoluteLift,
      relativeLift: row.relativeLift,
      baseRate: row.baseRate,
      fieldRate: row.fieldRate,
    })),
    rows,
    swapRows,
    judgment: judgmentSentence(effect, top),
  };
}

function validateSwap(effect, swap, opponents) {
  const beforeTeam = materializeCandidate({ id: `${swap.id}_before`, roles: swap.from });
  const afterTeam = materializeCandidate({ id: `${swap.id}_after`, roles: swap.to });
  const before = scoreAgainstWaterline(beforeTeam, opponents, effect.id, null);
  const after = scoreAgainstWaterline(afterTeam, opponents, effect.id, null, before);
  return {
    id: swap.id,
    note: swap.note,
    from: swap.from,
    to: swap.to,
    beforeWins: before.wins,
    afterWins: after.wins,
    beforeRate: round(before.rate),
    afterRate: round(after.rate),
    absoluteLift: round(after.rate - before.rate),
    relativeLift: relativeLift(before.rate, after.rate),
    flipsToWin: after.flipsToWin,
    flipsToLoss: after.flipsToLoss,
  };
}

function scoreAgainstWaterline(team, opponents, fieldEffectId, cache, baseDetails) {
  const cacheKey = !fieldEffectId ? teamKey(team) : null;
  if (cache && cacheKey && cache.has(cacheKey)) return cache.get(cacheKey);
  let wins = 0;
  let flipsToWin = 0;
  let flipsToLoss = 0;
  const winByOpponent = {};
  for (const opponent of opponents) {
    const seed = `runtime-field-compare|${teamKey(team)}|${opponent.id}`;
    const result = simulateTeams(team, opponent.team, {
      seed,
      randomizeStats: false,
      fieldEffectId,
    });
    const didWin = result.winner === "left";
    winByOpponent[opponent.id] = didWin;
    if (didWin) wins += 1;
    if (fieldEffectId && baseDetails?.winByOpponent) {
      const baseWin = !!baseDetails.winByOpponent[opponent.id];
      if (!baseWin && didWin) flipsToWin += 1;
      if (baseWin && !didWin) flipsToLoss += 1;
    }
  }
  const scored = { wins, total: opponents.length, rate: wins / opponents.length, flipsToWin, flipsToLoss, winByOpponent };
  if (cache && cacheKey) cache.set(cacheKey, scored);
  return scored;
}

function materializeCandidate(candidate) {
  if (candidate.preset) return clonePreset(candidate.preset);
  return roleTeam(candidate.roles, candidate.id);
}

function roleTeam(roles, id) {
  return roles.map((role, index) => {
    const kit = SKILL_DATA.roleKits[role];
    if (!kit) throw new Error(`Unknown role in runtime field validation: ${role}`);
    return {
      role,
      roleName: kit.role || kit.name,
      name: `${id}-${index + 1}`,
      slotIndex: index,
      small1: kit.kit.small1,
      small2: kit.kit.small2,
      passive: kit.kit.passive,
      ultimate: kit.kit.ultimate,
    };
  });
}

function readWaterline() {
  return JSON.parse(fs.readFileSync(WATERLINE_PATH, "utf8")).teams.map((row) => ({
    id: row.id,
    name: row.name,
    team: row.team,
  }));
}

function teamKey(team) {
  return team.map((unit) => `${unit.role}:${unit.small1}:${unit.small2}:${unit.passive}:${unit.ultimate}`).join("|");
}

function reasonFor(effectId, candidateId) {
  const reasons = {
    sentry_suppression: "checks whether contact/diver access lowers backline pressure",
    heavy_shield_line: "checks whether shield break or focused sustained damage converts front shields",
    pressure_corridor: "checks whether healing, shielding, or low-HP engines convert early pressure",
    delay_mud: "checks whether control/backline plans use delayed contact",
    war_drum_echo: "checks whether basic-attack tempo turns into real wins",
    blood_moon_rise: "checks whether low-HP carry windows become recoverable burst windows",
    king_flag: "checks whether front guard and death-rally plans become stronger",
    mirror_curse: "checks whether multi-core or sustain teams handle carry reflection better",
    hunting_whistle: "checks whether backline hunting converts marks into kills",
    ember_contagion: "checks whether sustain/status teams exploit the ember tempo",
  };
  return `${reasons[effectId] || "field advantage check"} (${candidateId})`;
}

function judgmentSentence(effect, topRows) {
  if (!topRows.length) return `${effect.name}: no advantage rows were measured.`;
  const best = topRows[0];
  const nearby = topRows[1];
  return `${effect.name} currently favors ${best.id}: ${pct(best.baseRate)} -> ${pct(best.fieldRate)} (${signedPct(best.absoluteLift)} abs, ${signedPct(best.relativeLift)} rel)` +
    (nearby ? `; nearby ${nearby.id}: ${pct(nearby.baseRate)} -> ${pct(nearby.fieldRate)}.` : ".");
}

function renderMarkdown(report) {
  const lines = [];
  lines.push("# Runtime Field Effect Advantage Validation");
  lines.push("");
  lines.push(`- Generated: ${report.generatedAt}`);
  lines.push(`- Waterline used: ${report.waterline.used}/${report.waterline.totalAvailable}`);
  lines.push(`- Method: ${report.method}`);
  lines.push("");
  for (const effect of report.effects) {
    lines.push(`## ${effect.name} (${effect.id})`);
    lines.push("");
    lines.push(`- Focus: ${effect.focus}`);
    lines.push(`- Expected: ${effect.expected}`);
    lines.push(`- Judgment: ${effect.judgment}`);
    lines.push("");
    lines.push("| Team | Base | Field | Abs Lift | Rel Lift | Flips + | Flips - |");
    lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: |");
    for (const row of effect.rows) {
      lines.push(`| ${row.id} | ${pct(row.baseRate)} | ${pct(row.fieldRate)} | ${signedPct(row.absoluteLift)} | ${signedPct(row.relativeLift)} | ${row.flipsToWin} | ${row.flipsToLoss} |`);
    }
    lines.push("");
    if (effect.swapRows?.length) {
      lines.push("### One-Role Swap Tests In This Field");
      lines.push("");
      lines.push("| Swap | Before Field | After Field | Abs Lift | Rel Lift | Flips + | Flips - | Note |");
      lines.push("| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |");
      for (const row of effect.swapRows) {
        lines.push(`| ${row.id} | ${pct(row.beforeRate)} | ${pct(row.afterRate)} | ${signedPct(row.absoluteLift)} | ${signedPct(row.relativeLift)} | ${row.flipsToWin} | ${row.flipsToLoss} | ${row.note || ""} |`);
      }
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

function relativeLift(base, field) {
  return round((field - base) / Math.max(0.05, base));
}

function pct(value) {
  return `${Math.round(value * 1000) / 10}%`;
}

function signedPct(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${pct(value)}`;
}

function round(value, digits = 4) {
  return Number(value.toFixed(digits));
}

if (require.main === module) run();

module.exports = { run };
