const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulatePresetMatchup } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "archetype-matchup-report.md");
const EVIDENCE_FILE = path.join(__dirname, "..", "design", "balance", "archetype-matchup-evidence.json");
const GAMES = 15;
const TOTAL_GAMES = GAMES * 2;
const EVIDENCE_SAMPLES_PER_CELL = 10;
const ECOLOGY_HEALTH_LIMITS = {
  allRounderAdvantageRatio: 0.55,
  allRounderAnswerRatio: 0.2,
  vulnerableDisadvantageRatio: 0.45,
  vulnerableAdvantageRatio: 0.15,
  absoluteRateLow: 0,
  absoluteRateHigh: 1,
  hardCounterLow: 0.1,
  hardCounterHigh: 0.9,
  softBandLow: 0.35,
  softBandHigh: 0.65,
};

function run() {
  const keys = Object.keys(SKILL_DATA.presets);
  const rows = keys.map((left) => ({
    key: left,
    cells: keys.map((right) => left === right ? null : runPair(left, right)),
  }));
  fs.writeFileSync(OUT_FILE, renderMarkdown(keys, rows), "utf8");
  fs.mkdirSync(path.dirname(EVIDENCE_FILE), { recursive: true });
  fs.writeFileSync(EVIDENCE_FILE, `${JSON.stringify(renderEvidence(keys, rows), null, 2)}\n`, "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), EVIDENCE_FILE)}`);
}

function runPair(left, right) {
  const games = [];
  let wins = 0;
  const totals = emptyTotals();
  for (let seed = 0; seed < GAMES; seed += 1) {
    const leftResult = simulatePresetMatchup(left, right, { seed });
    games.push(summarizeGame(leftResult, { left, right, seed, perspective: "left" }));
    if (leftResult.winner === "left") wins += 1;
    addPerspectiveTotals(totals, leftResult, "left");

    const rightResult = simulatePresetMatchup(right, left, { seed });
    games.push(summarizeGame(rightResult, { left, right, seed, perspective: "right" }));
    if (rightResult.winner === "right") wins += 1;
    addPerspectiveTotals(totals, rightResult, "right");
  }
  return {
    left,
    right,
    wins,
    games: TOTAL_GAMES,
    rate: wins / TOTAL_GAMES,
    evidenceGames: games.slice(0, EVIDENCE_SAMPLES_PER_CELL),
    avgDuration: totals.duration / TOTAL_GAMES,
    avg: averageTotals(totals),
    expectation: classifyExpectation(left, right, wins / TOTAL_GAMES),
  };
}

function classifyExpectation(left, right, rate) {
  const design = SKILL_DATA.presets[left]?.design || {};
  const expected = {
    strong: design.strongMatchups || [],
    weak: design.weakMatchups || [],
  };
  const actual = rate >= 0.6 ? "favored" : rate <= 0.4 ? "weak" : "even";
  const intended = expected.strong.includes(right) ? "favored" : expected.weak.includes(right) ? "weak" : "flex";
  const ok = intended === "flex" || intended === actual || (intended === "favored" && rate >= 0.53) || (intended === "weak" && rate <= 0.47);
  return { intended, actual, ok };
}

function renderMarkdown(keys, rows) {
  const health = analyzeBalanceHealth(rows);
  const lines = [
    "# Archetype Matchup Report",
    "",
    `Generated with \`${GAMES}\` deterministic seeds per side, \`${TOTAL_GAMES}\` total games per matchup, from \`game_data/combat-sim.js\`.`,
    "",
    "Rates are left preset win rates. Expectation checks ask whether a matchup follows the intended strong/weak/flex contract; ecology health treats 0/100 as expected in low-randomness combat, then checks whether hard counters have answers and whether any preset becomes an all-rounder.",
    "",
    "## Win Matrix",
    "",
    `| Preset | ${keys.map((key) => SKILL_DATA.presets[key].name).join(" | ")} |`,
    `| --- | ${keys.map(() => "---:").join(" | ")} |`,
  ];
  for (const row of rows) {
    lines.push(`| ${SKILL_DATA.presets[row.key].name} | ${row.cells.map((cell) => cell ? renderRate(cell) : "—").join(" | ")} |`);
  }
  lines.push("", "## Ecology Health", "");
  lines.push(`- Result: ${health.pass ? "pass" : "review"}.`);
  lines.push(`- Matrix cells checked: ${health.total}.`);
  lines.push(`- Absolute outcomes (${percent(ECOLOGY_HEALTH_LIMITS.absoluteRateLow)} or ${percent(ECOLOGY_HEALTH_LIMITS.absoluteRateHigh)}): ${health.absolute.length}/${health.total} (${percent(health.absoluteShare)}), recorded as determinism evidence, not an automatic failure.`);
  lines.push(`- Hard counters (<= ${percent(ECOLOGY_HEALTH_LIMITS.hardCounterLow)} or >= ${percent(ECOLOGY_HEALTH_LIMITS.hardCounterHigh)}): ${health.hard.length}/${health.total} (${percent(health.hardShare)}).`);
  lines.push(`- Soft band (${percent(ECOLOGY_HEALTH_LIMITS.softBandLow)}-${percent(ECOLOGY_HEALTH_LIMITS.softBandHigh)}): ${health.soft.length}/${health.total} (${percent(health.softShare)}).`);
  lines.push(`- Polarization score: ${health.polarizationScore.toFixed(2)} (0 is all 50/50, 1 is all 0/100).`);
  if (health.failures.length) {
    lines.push("- Review checks:");
    for (const failure of health.failures) lines.push(`  - ${failure}`);
  }
  lines.push("");
  lines.push("Preset ecology profile:");
  for (const preset of health.presetProfiles) {
    lines.push(`- \`${preset.key}\`: ${preset.status}; prey ${preset.preyCount}/${preset.opponentCount}, predators ${preset.predatorCount}/${preset.opponentCount}, extreme advantage tags ${preset.advantageTags.join(", ") || "-"}.`);
  }
  lines.push("");
  lines.push("Most polarized ordered matchups:");
  for (const cell of health.mostPolarized.slice(0, 12)) {
    lines.push(`- \`${cell.left}\` vs \`${cell.right}\`: ${percent(cell.rate)} (${cell.expectation.intended}/${cell.expectation.actual})`);
  }
  lines.push("", "## Expectation Mismatches", "");
  const mismatches = rows.flatMap((row) => row.cells.filter((cell) => cell && !cell.expectation.ok));
  if (!mismatches.length) {
    lines.push("- None in this run.");
  } else {
    for (const cell of mismatches) {
      lines.push(`- \`${cell.left}\` vs \`${cell.right}\`: expected ${cell.expectation.intended}, actual ${cell.expectation.actual}, rate ${percent(cell.rate)}.`);
    }
  }
  lines.push("", "## Pair Details", "");
  for (const row of rows) {
    for (const cell of row.cells.filter(Boolean)) {
      lines.push(`### \`${cell.left}\` into \`${cell.right}\``);
      lines.push("");
      lines.push(`- Win rate: ${percent(cell.rate)} (${cell.wins}/${cell.games})`);
      lines.push(`- Expectation: intended ${cell.expectation.intended}, actual ${cell.expectation.actual}, ${cell.expectation.ok ? "ok" : "mismatch"}`);
      lines.push(`- Avg duration: ${cell.avgDuration.toFixed(1)}s`);
      lines.push(`- Avg left basic / DOT / heal / shield: ${num(cell.avg.leftBasicDamage)} / ${num(cell.avg.leftDotDamage)} / ${num(cell.avg.leftHealing)} / ${num(cell.avg.leftShield)}`);
      lines.push(`- Avg right basic / DOT / heal / shield: ${num(cell.avg.rightBasicDamage)} / ${num(cell.avg.rightDotDamage)} / ${num(cell.avg.rightHealing)} / ${num(cell.avg.rightShield)}`);
      lines.push("");
    }
  }
  return `${lines.join("\n")}\n`;
}

function renderEvidence(keys, rows) {
  const health = analyzeBalanceHealth(rows);
  return {
    schema: "western_fantasy_archetype_matchup_evidence_v1",
    generatedAt: new Date().toISOString(),
    source: "game_data/simulate-archetype-matchups.js",
    gamesPerSide: GAMES,
    totalGamesPerCell: TOTAL_GAMES,
    evidenceSamplesPerCell: EVIDENCE_SAMPLES_PER_CELL,
    presets: Object.fromEntries(keys.map((key) => [key, {
      name: SKILL_DATA.presets[key].name,
      fantasy: SKILL_DATA.presets[key].design?.fantasy || "",
      primaryOutput: SKILL_DATA.presets[key].design?.primaryOutput || "",
      strongMatchups: SKILL_DATA.presets[key].design?.strongMatchups || [],
      weakMatchups: SKILL_DATA.presets[key].design?.weakMatchups || [],
    }])),
    balanceHealth: {
      pass: health.pass,
      mode: "deterministic_ecology",
      total: health.total,
      absoluteCount: health.absolute.length,
      hardCounterCount: health.hard.length,
      softBandCount: health.soft.length,
      absoluteShare: round(health.absoluteShare, 4),
      hardCounterShare: round(health.hardShare, 4),
      softBandShare: round(health.softShare, 4),
      polarizationScore: round(health.polarizationScore, 4),
      failures: health.failures,
      presetProfiles: health.presetProfiles,
    },
    matchups: rows.flatMap((row) => row.cells.filter(Boolean).map((cell) => ({
      left: cell.left,
      right: cell.right,
      leftName: SKILL_DATA.presets[cell.left].name,
      rightName: SKILL_DATA.presets[cell.right].name,
      rate: round(cell.rate, 4),
      wins: cell.wins,
      games: cell.games,
      expectation: cell.expectation,
      avgDuration: round(cell.avgDuration, 2),
      avg: roundObject(cell.avg),
      evidenceGames: cell.evidenceGames,
    }))),
  };
}

function summarizeGame(result, context) {
  const ownSide = context.perspective;
  const oppSide = ownSide === "left" ? "right" : "left";
  const won = result.winner === ownSide;
  return {
    seed: context.seed,
    perspective: context.perspective,
    won,
    winner: won ? context.left : context.right,
    duration: result.duration,
    hpScore: {
      own: sideValue(result, ownSide, "Hp"),
      opponent: sideValue(result, oppSide, "Hp"),
    },
    metrics: perspectiveMetrics(result.metrics, ownSide),
    signalSummary: summarizeSignals(result.signals, ownSide),
    keyEvents: keyEvents(result, ownSide),
    survivors: {
      own: result.units.filter((unit) => unit.side === ownSide && unit.alive).length,
      opponent: result.units.filter((unit) => unit.side === oppSide && unit.alive).length,
    },
  };
}

function summarizeSignals(signals, ownSide) {
  const opponentSide = ownSide === "left" ? "right" : "left";
  return {
    own: summarizeSideSignals(signals, ownSide),
    opponent: summarizeSideSignals(signals, opponentSide),
  };
}

function summarizeSideSignals(signals, side) {
  const damage = signals.filter((signal) => signal.tags.includes("damage") && signal.source?.side === side && !signal.tags.includes("selfCost"));
  const taken = signals.filter((signal) => signal.tags.includes("damage") && signal.target?.side === side && !signal.tags.includes("selfCost"));
  const healing = signals.filter((signal) => signal.tags.includes("heal") && signal.target?.side === side);
  const shield = signals.filter((signal) => signal.tags.includes("shield") && signal.target?.side === side);
  const casts = signals.filter((signal) => signal.tags.includes("cast") && signal.source?.side === side);
  const deaths = signals.filter((signal) => signal.tags.includes("death") && signal.target?.side === side);
  return {
    damage: roundObject({
      total: amount(damage),
      basic: amount(damage.filter((signal) => signal.tags.includes("basic"))),
      skill: amount(damage.filter((signal) => signal.tags.includes("skill"))),
      ultimate: amount(damage.filter((signal) => signal.tags.includes("ultimate"))),
      dot: amount(damage.filter((signal) => signal.tags.includes("dot"))),
      poison: amount(damage.filter((signal) => signal.tags.includes("poison"))),
      burn: amount(damage.filter((signal) => signal.tags.includes("burn"))),
      execute: amount(damage.filter((signal) => signal.skillKey === "shadowHarvest" || signal.skillKey === "deathNeedle")),
      counter: amount(damage.filter((signal) => signal.tags.includes("counter"))),
      area: amount(damage.filter((signal) => signal.tags.includes("area") || signal.tags.includes("splash"))),
    }),
    taken: roundObject({
      total: amount(taken),
      blocked: amount(taken.map((signal) => ({ amount: signal.meta?.blocked || 0 }))),
    }),
    sustain: roundObject({
      healing: amount(healing),
      shield: amount(shield),
      effectiveHealingRatio: effectiveHealingRatio(healing),
    }),
    status: {
      poisonStacks: amount(signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("poison"))),
      burnStacks: amount(signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("burn"))),
      slowApplications: signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("slow")).length,
      markApplications: amount(signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("mark"))),
    },
    casts: {
      small: casts.filter((signal) => signal.tags.includes("smallSkill")).length,
      ultimate: casts.filter((signal) => signal.tags.includes("ultimate")).length,
    },
    firstDeathTime: deaths[0]?.time ?? null,
  };
}

function keyEvents(result, ownSide) {
  const opponentSide = ownSide === "left" ? "right" : "left";
  return [
    ...firstEvents(result.signals, ownSide, "own"),
    ...firstEvents(result.signals, opponentSide, "opponent"),
    ...peakDamageEvents(result.signals, ownSide, "own"),
    ...peakDamageEvents(result.signals, opponentSide, "opponent"),
  ].sort((a, b) => a.time - b.time || a.type.localeCompare(b.type)).slice(0, 16);
}

function firstEvents(signals, side, label) {
  const events = [];
  const firstDeath = signals.find((signal) => signal.tags.includes("death") && signal.target?.side === side);
  const firstUltimate = signals.find((signal) => signal.tags.includes("cast") && signal.tags.includes("ultimate") && signal.source?.side === side);
  const firstLow = signals.find((signal) => signal.tags.includes("snapshot") && signal.target?.side === side && signal.maxHp > 0 && signal.hp / signal.maxHp <= 0.45);
  if (firstDeath) events.push(eventOf("firstDeath", label, firstDeath));
  if (firstUltimate) events.push(eventOf("firstUltimate", label, firstUltimate));
  if (firstLow) events.push(eventOf("firstLowHealth", label, firstLow));
  return events;
}

function peakDamageEvents(signals, side, label) {
  const damage = signals.filter((signal) => signal.tags.includes("damage") && signal.source?.side === side && !signal.tags.includes("selfCost"));
  if (!damage.length) return [];
  let best = { start: 0, amount: 0 };
  for (const signal of damage) {
    const amountInWindow = amount(damage.filter((item) => item.time >= signal.time && item.time < signal.time + 2));
    if (amountInWindow > best.amount) best = { start: signal.time, amount: amountInWindow };
  }
  return [{
    type: "peak2sDamage",
    side: label,
    time: round(best.start, 2),
    amount: round(best.amount),
  }];
}

function eventOf(type, side, signal) {
  const unit = type === "firstUltimate" ? signal.source : signal.target;
  return {
    type,
    side,
    time: round(signal.time, 2),
    unit: unit?.name || "",
    role: unit?.role || "",
    skillKey: signal.skillKey || null,
    skillName: signal.skillName || "",
    amount: round(signal.amount || 0),
  };
}

function analyzeBalanceHealth(rows) {
  const cells = rows.flatMap((row) => row.cells.filter(Boolean));
  const total = Math.max(1, cells.length);
  const absolute = cells.filter((cell) => cell.rate <= ECOLOGY_HEALTH_LIMITS.absoluteRateLow || cell.rate >= ECOLOGY_HEALTH_LIMITS.absoluteRateHigh);
  const hard = cells.filter((cell) => cell.rate <= ECOLOGY_HEALTH_LIMITS.hardCounterLow || cell.rate >= ECOLOGY_HEALTH_LIMITS.hardCounterHigh);
  const soft = cells.filter((cell) => cell.rate >= ECOLOGY_HEALTH_LIMITS.softBandLow && cell.rate <= ECOLOGY_HEALTH_LIMITS.softBandHigh);
  const absoluteShare = absolute.length / total;
  const hardShare = hard.length / total;
  const softShare = soft.length / total;
  const polarizationScore = cells.reduce((sum, cell) => sum + Math.abs(cell.rate - 0.5) * 2, 0) / total;
  const presetProfiles = buildPresetEcologyProfiles(rows, cells);
  const failures = [];
  for (const profile of presetProfiles) {
    if (profile.status === "all-rounder-risk") {
      failures.push(`${profile.key} has broad hard advantages but few hard predators (${profile.preyCount} prey, ${profile.predatorCount} predators)`);
    }
    if (profile.status === "vulnerable-without-prey") {
      failures.push(`${profile.key} has many hard predators and almost no hard prey (${profile.predatorCount} predators, ${profile.preyCount} prey)`);
    }
  }
  return {
    total: cells.length,
    absolute,
    hard,
    soft,
    absoluteShare,
    hardShare,
    softShare,
    polarizationScore,
    presetProfiles,
    mostPolarized: [...cells].sort((a, b) => Math.abs(b.rate - 0.5) - Math.abs(a.rate - 0.5)),
    failures,
    pass: failures.length === 0,
  };
}

function buildPresetEcologyProfiles(rows, cells) {
  const keys = rows.map((row) => row.key);
  return keys.map((key) => {
    const prey = new Set();
    const predators = new Set();
    const advantageTags = new Set();
    for (const cell of cells) {
      if (cell.left === key && cell.rate >= ECOLOGY_HEALTH_LIMITS.hardCounterHigh) {
        prey.add(cell.right);
        addExpectationTag(advantageTags, cell);
      }
      if (cell.right === key && cell.rate <= ECOLOGY_HEALTH_LIMITS.hardCounterLow) {
        prey.add(cell.left);
        addExpectationTag(advantageTags, cell);
      }
      if (cell.left === key && cell.rate <= ECOLOGY_HEALTH_LIMITS.hardCounterLow) predators.add(cell.right);
      if (cell.right === key && cell.rate >= ECOLOGY_HEALTH_LIMITS.hardCounterHigh) predators.add(cell.left);
    }
    const opponentCount = Math.max(1, keys.length - 1);
    const advantageRatio = prey.size / opponentCount;
    const answerRatio = predators.size / opponentCount;
    let status = "answered";
    if (advantageRatio >= ECOLOGY_HEALTH_LIMITS.allRounderAdvantageRatio && answerRatio <= ECOLOGY_HEALTH_LIMITS.allRounderAnswerRatio) {
      status = "all-rounder-risk";
    } else if (answerRatio >= ECOLOGY_HEALTH_LIMITS.vulnerableDisadvantageRatio && advantageRatio <= ECOLOGY_HEALTH_LIMITS.vulnerableAdvantageRatio) {
      status = "vulnerable-without-prey";
    } else if (advantageRatio >= ECOLOGY_HEALTH_LIMITS.allRounderAdvantageRatio) {
      status = "dominant-but-answered";
    } else if (answerRatio >= ECOLOGY_HEALTH_LIMITS.vulnerableDisadvantageRatio) {
      status = "niche-under-pressure";
    }
    return {
      key,
      status,
      opponentCount,
      prey: [...prey].sort(),
      predators: [...predators].sort(),
      preyCount: prey.size,
      predatorCount: predators.size,
      advantageRatio: round(advantageRatio, 3),
      answerRatio: round(answerRatio, 3),
      advantageTags: [...advantageTags].sort(),
    };
  });
}

function addExpectationTag(tags, cell) {
  const intended = cell.expectation?.intended || "flex";
  const actual = cell.expectation?.actual || "unknown";
  tags.add(`${intended}->${actual}`);
}

function renderRate(cell) {
  const mark = cell.expectation.ok ? "" : "!";
  return `${percent(cell.rate)}${mark}`;
}

function emptyTotals() {
  return {
    duration: 0,
    leftBasicDamage: 0,
    rightBasicDamage: 0,
    leftDotDamage: 0,
    rightDotDamage: 0,
    leftHealing: 0,
    rightHealing: 0,
    leftShield: 0,
    rightShield: 0,
  };
}

function addPerspectiveTotals(totals, result, perspective) {
  const metrics = result.metrics;
  totals.duration += result.duration;
  const own = perspective === "left" ? "left" : "right";
  const opp = perspective === "left" ? "right" : "left";
  totals.leftBasicDamage += metrics[`${own}BasicDamage`] || 0;
  totals.leftDotDamage += metrics[`${own}DotDamage`] || 0;
  totals.leftHealing += metrics[`${own}Healing`] || 0;
  totals.leftShield += metrics[`${own}Shield`] || 0;
  totals.rightBasicDamage += metrics[`${opp}BasicDamage`] || 0;
  totals.rightDotDamage += metrics[`${opp}DotDamage`] || 0;
  totals.rightHealing += metrics[`${opp}Healing`] || 0;
  totals.rightShield += metrics[`${opp}Shield`] || 0;
}

function perspectiveMetrics(metrics, ownSide) {
  const oppSide = ownSide === "left" ? "right" : "left";
  return roundObject({
    ownBasicDamage: metrics[`${ownSide}BasicDamage`] || 0,
    ownDotDamage: metrics[`${ownSide}DotDamage`] || 0,
    ownHealing: metrics[`${ownSide}Healing`] || 0,
    ownShield: metrics[`${ownSide}Shield`] || 0,
    opponentBasicDamage: metrics[`${oppSide}BasicDamage`] || 0,
    opponentDotDamage: metrics[`${oppSide}DotDamage`] || 0,
    opponentHealing: metrics[`${oppSide}Healing`] || 0,
    opponentShield: metrics[`${oppSide}Shield`] || 0,
  });
}

function sideValue(result, side, suffix) {
  return result[`${side}${suffix}`] || 0;
}

function averageTotals(totals) {
  const out = {};
  for (const [key, value] of Object.entries(totals)) out[key] = value / TOTAL_GAMES;
  return out;
}

function amount(signals) {
  return signals.reduce((sum, signal) => sum + (signal.amount || 0), 0);
}

function effectiveHealingRatio(healingSignals) {
  const healed = amount(healingSignals);
  const overflow = healingSignals.reduce((sum, signal) => sum + (signal.meta?.overflow || 0), 0);
  return healed + overflow > 0 ? healed / (healed + overflow) : 0;
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function num(value) {
  return String(Math.round(value));
}

function round(value, digits = 1) {
  return Number(Number(value || 0).toFixed(digits));
}

function roundObject(input, digits = 1) {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [
    key,
    Number.isFinite(value) ? round(value, digits) : value,
  ]));
}

if (require.main === module) {
  run();
}

module.exports = { run, runPair, analyzeBalanceHealth };
