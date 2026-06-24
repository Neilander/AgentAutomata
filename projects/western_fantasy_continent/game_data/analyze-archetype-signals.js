const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulatePresetMatchup } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "archetype-signal-report.md");
const SEEDS = 4;
const AREA_KINDS = new Set(["arrowStorm", "burningEnemies", "grandMixture", "hitEnemies", "meteorRain", "plagueOffering", "poisonEnemies"]);
const PAYOFF_KINDS = new Set(["burningEnemies", "grandMixture", "hitMarkedTarget", "hitTargetWithStatus", "meteorRain", "plagueOffering"]);
const EXECUTE_KINDS = new Set(["hitLowestEnemy"]);

function run() {
  const rows = Object.entries(SKILL_DATA.presets).map(([presetId, preset]) => analyzePreset(presetId, preset));
  fs.writeFileSync(OUT_FILE, renderMarkdown(rows), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  return rows;
}

function analyzePreset(presetId, preset) {
  const opponents = preset.design.validationOpponents;
  const samples = [];
  for (const opponent of opponents) {
    for (let seed = 0; seed < SEEDS; seed += 1) {
      samples.push(sampleResult(simulatePresetMatchup(presetId, opponent, { seed, randomizeStats: false }), "left"));
      samples.push(sampleResult(simulatePresetMatchup(opponent, presetId, { seed, randomizeStats: false }), "right"));
    }
  }
  const metrics = averageMetrics(samples);
  const groups = [
    ["curve", preset.design.curves || []],
    ["metric", preset.design.signalAcceptance || []],
    ["failure boundary", preset.design.failureBoundaries || []],
  ];
  const checks = groups.flatMap(([group, rules]) => rules.map((rule) => ({
    ...rule,
    group,
    actual: metrics[rule.metric],
    pass: compare(metrics[rule.metric], rule.op, rule.value),
  })));
  return {
    presetId,
    name: preset.name,
    fantasy: preset.design.fantasy,
    experience: preset.design.experience || {},
    primaryOutput: preset.design.primaryOutput,
    opponents,
    samples: samples.length,
    metrics,
    checks,
    pass: checks.every((check) => check.pass),
  };
}

function sampleResult(result, side) {
  const enemySide = side === "left" ? "right" : "left";
  const signals = result.signals;
  const ownUnits = result.units.filter((unit) => unit.side === side);
  const enemyUnits = result.units.filter((unit) => unit.side === enemySide);
  const unitsById = Object.fromEntries(result.units.map((unit) => [unit.id, unit]));
  const ownDamageSignals = damageSignals(signals, side);
  const enemyDamageSignals = damageSignals(signals, enemySide);
  const totalDamage = amount(ownDamageSignals);
  const basicSignals = ownDamageSignals.filter((signal) => signal.tags.includes("basic"));
  const dotDamage = amount(ownDamageSignals.filter((signal) => signal.tags.includes("dot")));
  const empoweredBasicDamage = amount(basicSignals.filter((signal) => (signal.meta?.windows || []).length));
  const hasteBasicDamage = amount(basicSignals.filter((signal) => (signal.meta?.windows || []).includes("haste")));
  const counterSignals = ownDamageSignals.filter((signal) => signal.tags.includes("counter"));
  const ultimateDamage = amount(ownDamageSignals.filter((signal) => signal.tags.includes("ultimate")));
  const areaDamage = amount(ownDamageSignals.filter((signal) => signal.tags.includes("area") || skillHasKind(signal.skillKey, AREA_KINDS)));
  const payoffDamage = amount(ownDamageSignals.filter((signal) => skillHasKind(signal.skillKey, PAYOFF_KINDS)));
  const executeDamage = amount(ownDamageSignals.filter((signal) => skillHasKind(signal.skillKey, EXECUTE_KINDS)));
  const sourceDamage = groupAmount(ownDamageSignals, (signal) => signal.source?.id);
  const targetDamage = groupAmount(ownDamageSignals, (signal) => signal.target?.id);
  const poisonSignals = signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("poison"));
  const burnSignals = signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("burn"));
  const markApplications = signalAmount(signals, side, ["status", "mark"]);
  const slowSignals = signals.filter((signal) => signal.source?.side === side && signal.tags.includes("status") && signal.tags.includes("slow"));
  const healingSignals = signals.filter((signal) => signal.tags.includes("heal") && signal.target?.side === side);
  const shieldSignals = signals.filter((signal) => signal.tags.includes("shield") && signal.target?.side === side);
  const selfCostSignals = signals.filter((signal) => signal.tags.includes("selfCost") && signal.source?.side === side);
  const duration = Math.max(result.duration, 0.001);
  const berserker = ownUnits.find((unit) => unit.role === "berserker");
  const carryUnit = ownUnits.find((unit) => unit.passive === "rageEngine") || ownUnits.find((unit) => unit.role === "berserker");
  const carryId = carryUnit?.id || maxKey(sourceDamage);
  const carryDamage = sourceDamage[carryId] || 0;
  const lowCurve = lowHealthCurve(signals, berserker, duration);
  const teamCurve = teamHealthCurve(signals, side);
  const firstOwnDeath = firstDeathTime(signals, ownUnits, duration);
  const carryDeath = carryId ? firstDeathTime(signals, ownUnits.filter((unit) => unit.id === carryId), duration) : 0;
  const firstUltimate = firstSignalTime(signals, (signal) => signal.source?.side === side && signal.tags.includes("cast") && signal.tags.includes("ultimate"));
  const peak = peakWindow(ownDamageSignals, duration, 2);
  const statusOverlap = overlappingStatusRatio(poisonSignals, burnSignals, duration);
  const enemyMeleeIds = new Set(enemyUnits.filter((unit) => SKILL_DATA.roleKits[unit.role]?.range < 20).map((unit) => unit.id));
  const enemyMeleeBasics = enemyDamageSignals.filter((signal) => signal.tags.includes("basic") && enemyMeleeIds.has(signal.source?.id));
  const slowIntervals = slowSignals.map((signal) => ({ id: signal.target?.id, start: signal.time, end: signal.time + (signal.meta?.duration || signal.amount || 0) }));
  const controlRate = eventRateRatio(enemyMeleeBasics, slowIntervals, duration);
  const buffSignals = signals.filter((signal) => signal.source?.side === side && signal.tags.includes("buff"));
  const carryBuffAmount = amount(buffSignals.filter((signal) => signal.target?.id === carryId));
  const topTwoDamageIds = Object.entries(sourceDamage).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([id]) => id);
  const topTwoBuffAmount = amount(buffSignals.filter((signal) => topTwoDamageIds.includes(signal.target?.id)));
  const totalBuffAmount = amount(buffSignals);
  const firstPayoff = firstSignalTime(ownDamageSignals, (signal) => skillHasKind(signal.skillKey, PAYOFF_KINDS));
  const uniqueBerserkerBasics = uniqueEvents(basicSignals.filter((signal) => signal.source?.id === berserker?.id));

  return {
    basicDamageShare: share(amount(basicSignals), totalDamage),
    dotDamageShare: share(dotDamage, totalDamage),
    empoweredBasicDamageShare: share(empoweredBasicDamage, totalDamage),
    hasteWindowBasicDamageShare: share(hasteBasicDamage, totalDamage),
    carryDamageShare: share(carryDamage, totalDamage),
    carrySurvives10Seconds: carryDeath >= Math.min(10, duration) ? 1 : 0,
    carryFirstDeathTime: Math.min(carryDeath, duration),
    carryBuffShare: share(carryBuffAmount, totalBuffAmount),
    topTwoBuffShare: share(topTwoBuffAmount, totalBuffAmount),
    counterTriggers: counterSignals.length,
    counterDamageShare: share(amount(counterSignals), totalDamage),
    blockedCounterLinkRate: share(counterSignals.filter((signal) => (signal.meta?.blockedTrigger || 0) > 0).length, counterSignals.length),
    ultimateDamageShare: share(ultimateDamage, totalDamage),
    areaDamageShare: share(areaDamage, totalDamage),
    statusPayoffDamageShare: share(payoffDamage, totalDamage),
    executeDamageShare: share(executeDamage, totalDamage),
    lowestTargetDamageShare: share(Math.max(0, ...Object.values(targetDamage)), totalDamage),
    poisonStacksApplied: amount(poisonSignals),
    burnStacksApplied: amount(burnSignals),
    statusStacksApplied: amount(poisonSignals) + amount(burnSignals),
    poisonApplicationAcceleration: phaseRateRatio(poisonSignals, firstPayoff, duration),
    poisonSpreadEvents: poisonSignals.filter((signal) => signal.tags.includes("poisonSpread")).length,
    payoffCycles: signals.filter((signal) => signal.source?.side === side && signal.tags.includes("cast") && skillHasKind(signal.skillKey, PAYOFF_KINDS)).length,
    dualStatusOverlapRatio: statusOverlap,
    markApplications,
    slowApplications: slowSignals.length,
    controlWindowMeleeRateRatio: controlRate,
    healingPerSecond: amount(healingSignals) / duration,
    shieldPerSecond: amount(shieldSignals) / duration,
    effectiveHealingRatio: effectiveHealingRatio(healingSignals),
    teamRecoveryAfterCrisis: recoveryAmount(teamCurve),
    selfCostPerSecond: amount(selfCostSignals) / duration,
    ultimateCastsBefore15: signals.filter((signal) => signal.source?.side === side && signal.tags.includes("cast") && signal.tags.includes("ultimate") && signal.time <= 15).length,
    ultimateBeforeFirstDeath: Number.isFinite(firstUltimate) && firstUltimate < firstOwnDeath ? 1 : 0,
    postUltimateHpLossRatio: phaseHpLossRatio(teamCurve, firstUltimate, 3),
    enemyMeleeBasicPerSecond: enemyMeleeBasics.length / duration,
    survivorsAt20Seconds: survivorsAt(signals, side, 20, result.units),
    peak2sDamageShare: share(peak.amount, totalDamage),
    postPeakDamageRateRatio: postPeakRatio(ownDamageSignals, peak.start, duration, 2),
    burnCoverageBeforeUltimate: coverageBeforeSkill(burnSignals, signals, side, "meteorRain", enemyUnits.length),
    payoffStartsAfterSetup: Number.isFinite(firstPayoff) && firstPayoff >= 2 ? 1 : 0,
    lowHealthEntryRate: lowCurve.entered,
    lowHealthSurvivalSeconds: lowCurve.survivalSeconds,
    lowHealthOscillations: lowCurve.oscillations,
    postLowAttackRateRatio: attackRateRatio(uniqueBerserkerBasics, lowCurve.firstLowTime, duration),
    recoveryAfterLow: lowCurve.recovery,
    highHealthDecline: lowCurve.highHealthDecline,
  };
}

function damageSignals(signals, side) {
  return signals.filter((signal) => signal.tags.includes("damage") && signal.source?.side === side && !signal.tags.includes("selfCost"));
}

function lowHealthCurve(signals, unit, duration) {
  if (!unit) return { entered: 0, firstLowTime: Infinity, survivalSeconds: 0, oscillations: 0, recovery: 0, highHealthDecline: 0 };
  const series = healthSeries(signals, unit.id);
  const firstLowIndex = series.findIndex((point) => point.ratio <= 0.45);
  if (firstLowIndex < 0) return { entered: 0, firstLowTime: Infinity, survivalSeconds: 0, oscillations: 0, recovery: 0, highHealthDecline: decline(series) };
  const firstLowTime = series[firstLowIndex].time;
  const after = series.slice(firstLowIndex);
  const death = after.find((point) => point.ratio <= 0);
  let runningMin = 1;
  let recoveryPeak = 0;
  let oscillations = 0;
  let recovery = 0;
  for (const point of after) {
    runningMin = Math.min(runningMin, point.ratio);
    recovery = Math.max(recovery, point.ratio - runningMin);
    recoveryPeak = Math.max(recoveryPeak, point.ratio);
    if (runningMin <= 0.5 && recoveryPeak - runningMin >= 0.06) {
      oscillations += 1;
      runningMin = point.ratio;
      recoveryPeak = point.ratio;
    }
  }
  return {
    entered: 1,
    firstLowTime,
    survivalSeconds: Math.max(0, (death?.time ?? duration) - firstLowTime),
    oscillations,
    recovery,
    highHealthDecline: decline(series.slice(0, firstLowIndex + 1)),
  };
}

function healthSeries(signals, unitId) {
  return signals.filter((signal) => signal.tags.includes("snapshot") && signal.target?.id === unitId)
    .map((signal) => ({ time: signal.time, ratio: signal.maxHp > 0 ? signal.hp / signal.maxHp : 0 }));
}

function teamHealthCurve(signals, side) {
  const snapshots = signals.filter((signal) => signal.tags.includes("snapshot") && signal.target?.side === side);
  const byTime = {};
  for (const signal of snapshots) {
    const key = signal.time.toFixed(3);
    byTime[key] ||= [];
    byTime[key].push(signal.maxHp > 0 ? signal.hp / signal.maxHp : 0);
  }
  return Object.entries(byTime).map(([time, values]) => ({
    time: Number(time),
    ratio: values.reduce((sum, value) => sum + value, 0) / values.length,
  })).sort((a, b) => a.time - b.time);
}

function recoveryAmount(series) {
  let min = 1;
  let recovery = 0;
  for (const point of series) {
    min = Math.min(min, point.ratio);
    recovery = Math.max(recovery, point.ratio - min);
  }
  return recovery;
}

function phaseHpLossRatio(series, eventTime, window) {
  if (!Number.isFinite(eventTime)) return 1;
  const before = hpLoss(series, Math.max(0, eventTime - window), eventTime);
  const after = hpLoss(series, eventTime, eventTime + window);
  return before > 0 ? after / before : after > 0 ? 1 : 0;
}

function hpLoss(series, start, end) {
  const points = series.filter((point) => point.time >= start && point.time <= end);
  if (points.length < 2) return 0;
  return Math.max(0, points[0].ratio - points[points.length - 1].ratio);
}

function decline(series) {
  if (series.length < 2) return 0;
  return Math.max(0, series[0].ratio - series[series.length - 1].ratio);
}

function attackRateRatio(signals, splitTime, duration) {
  if (!Number.isFinite(splitTime) || splitTime <= 0 || splitTime >= duration) return 0;
  const window = Math.min(4, splitTime, duration - splitTime);
  if (window <= 0.5) return 0;
  const beforeRate = signals.filter((signal) => signal.time >= splitTime - window && signal.time < splitTime).length / window;
  const afterRate = signals.filter((signal) => signal.time >= splitTime && signal.time < splitTime + window).length / window;
  return beforeRate > 0 ? afterRate / beforeRate : afterRate > 0 ? 2 : 0;
}

function halfRateRatio(signals, duration) {
  const half = duration / 2;
  const early = signals.filter((signal) => signal.time < half).reduce((sum, signal) => sum + (signal.amount || 0), 0) / Math.max(half, 0.001);
  const late = signals.filter((signal) => signal.time >= half).reduce((sum, signal) => sum + (signal.amount || 0), 0) / Math.max(duration - half, 0.001);
  return early > 0 ? late / early : late > 0 ? 2 : 0;
}

function phaseRateRatio(signals, splitTime, duration) {
  if (!Number.isFinite(splitTime) || splitTime <= 1 || splitTime >= duration - 1) return halfRateRatio(signals, duration);
  const early = signals.filter((signal) => signal.time < splitTime).reduce((sum, signal) => sum + (signal.amount || 0), 0) / splitTime;
  const late = signals.filter((signal) => signal.time >= splitTime).reduce((sum, signal) => sum + (signal.amount || 0), 0) / Math.max(duration - splitTime, 0.001);
  return early > 0 ? late / early : late > 0 ? 2 : 0;
}

function uniqueEvents(signals) {
  const seen = new Set();
  return signals.filter((signal) => {
    const key = `${signal.source?.id || ""}|${signal.time.toFixed(3)}|${signal.skillName || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function eventRateRatio(events, intervals, duration) {
  const merged = mergeIntervals(intervals, duration);
  const insideTime = merged.reduce((sum, interval) => sum + interval.end - interval.start, 0);
  const outsideTime = Math.max(0.001, duration - insideTime);
  const inside = events.filter((event) => merged.some((interval) => interval.id === event.source?.id && event.time >= interval.start && event.time <= interval.end)).length;
  const outside = events.length - inside;
  const insideRate = inside / Math.max(insideTime, 0.001);
  const outsideRate = outside / outsideTime;
  return outsideRate > 0 ? insideRate / outsideRate : insideRate > 0 ? 1 : 0;
}

function mergeIntervals(intervals, duration) {
  const grouped = {};
  for (const interval of intervals) {
    if (!interval.id) continue;
    grouped[interval.id] ||= [];
    grouped[interval.id].push({ id: interval.id, start: Math.max(0, interval.start), end: Math.min(duration, interval.end) });
  }
  const out = [];
  for (const list of Object.values(grouped)) {
    list.sort((a, b) => a.start - b.start);
    for (const interval of list) {
      const last = out[out.length - 1];
      if (last && last.id === interval.id && interval.start <= last.end) last.end = Math.max(last.end, interval.end);
      else out.push({ ...interval });
    }
  }
  return out;
}

function peakWindow(signals, duration, window) {
  let best = { start: 0, amount: 0 };
  for (let start = 0; start <= duration; start += 0.5) {
    const value = amount(signals.filter((signal) => signal.time >= start && signal.time < start + window));
    if (value > best.amount) best = { start, amount: value };
  }
  return best;
}

function postPeakRatio(signals, peakStart, duration, window) {
  const peakAmount = amount(signals.filter((signal) => signal.time >= peakStart && signal.time < peakStart + window));
  const afterAmount = amount(signals.filter((signal) => signal.time >= peakStart + window && signal.time < Math.min(duration, peakStart + window * 2)));
  return peakAmount > 0 ? afterAmount / peakAmount : 1;
}

function coverageBeforeSkill(statusSignals, signals, side, skillKey, enemyCount) {
  const cast = signals.find((signal) => signal.source?.side === side && signal.tags.includes("cast") && signal.skillKey === skillKey);
  if (!cast || enemyCount <= 0) return 0;
  const targets = new Set(statusSignals.filter((signal) => signal.time <= cast.time).map((signal) => signal.target?.id).filter(Boolean));
  return targets.size / enemyCount;
}

function overlappingStatusRatio(poisonSignals, burnSignals, duration) {
  if (duration <= 0) return 0;
  const poisonWindows = poisonSignals.map((signal) => ({ id: signal.target?.id, start: signal.time, end: signal.time + (signal.meta?.duration || 6) }));
  const burnWindows = burnSignals.map((signal) => ({ id: signal.target?.id, start: signal.time, end: signal.time + (signal.meta?.duration || 6) }));
  let overlap = 0;
  for (const poison of poisonWindows) {
    for (const burn of burnWindows) {
      if (poison.id !== burn.id) continue;
      overlap += Math.max(0, Math.min(poison.end, burn.end, duration) - Math.max(poison.start, burn.start));
    }
  }
  return Math.min(1, overlap / duration);
}

function effectiveHealingRatio(signals) {
  const effective = amount(signals);
  const overflow = signals.reduce((sum, signal) => sum + (signal.meta?.overflow || 0), 0);
  return share(effective, effective + overflow);
}

function firstDeathTime(signals, units, duration) {
  const ids = new Set(units.map((unit) => unit.id));
  const deathEvents = signals.filter((signal) => signal.tags.includes("death") && ids.has(signal.target?.id)).map((signal) => signal.time);
  if (deathEvents.length) return Math.min(...deathEvents);
  const deaths = signals.filter((signal) => signal.tags.includes("snapshot") && ids.has(signal.target?.id) && signal.hp <= 0).map((signal) => signal.time);
  return deaths.length ? Math.min(...deaths) : duration;
}

function firstSignalTime(signals, predicate) {
  const signal = signals.find(predicate);
  return signal ? signal.time : Infinity;
}

function survivorsAt(signals, side, targetTime, units) {
  const snapshots = signals.filter((signal) => signal.tags.includes("snapshot") && signal.target?.side === side && signal.time <= targetTime + 0.25);
  if (!snapshots.length) return units.filter((unit) => unit.side === side && unit.alive).length;
  const latest = {};
  for (const signal of snapshots) latest[signal.target.id] = signal;
  return Object.values(latest).filter((signal) => signal.hp > 0).length;
}

function skillHasKind(skillKey, kinds) {
  return (SKILL_DATA.skills[skillKey]?.effects || []).some((effect) => kinds.has(effect.kind));
}

function signalAmount(signals, side, tags) {
  return amount(signals.filter((signal) => signal.source?.side === side && tags.every((tag) => signal.tags.includes(tag))));
}

function groupAmount(signals, keyFn) {
  const values = {};
  for (const signal of signals) {
    const key = keyFn(signal);
    if (key) values[key] = (values[key] || 0) + (signal.amount || 0);
  }
  return values;
}

function maxKey(values) {
  return Object.entries(values).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
}

function amount(signals) {
  return signals.reduce((sum, signal) => sum + (signal.amount || 0), 0);
}

function share(value, total) {
  return total > 0 ? value / total : 0;
}

function averageMetrics(samples) {
  const totals = {};
  for (const sample of samples) {
    for (const [key, value] of Object.entries(sample)) totals[key] = (totals[key] || 0) + value;
  }
  return Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / samples.length]));
}

function compare(actual, op, expected) {
  if (!Number.isFinite(actual)) return false;
  if (op === ">=") return actual >= expected;
  if (op === "<=") return actual <= expected;
  if (op === ">") return actual > expected;
  if (op === "<") return actual < expected;
  return false;
}

function renderMarkdown(rows) {
  const lines = [
    "# Archetype Signal And Curve Acceptance Report",
    "",
    `Generated from preset-owned design contracts with ${SEEDS} deterministic seeds per side and validation opponent.`,
    "",
    "A pass requires the intended process curve, numeric conversion, and failure boundaries. Win rate is evaluated separately.",
    "",
    "## Summary",
    "",
    "| Preset | Primary output | Result | Passing checks | Validation opponents |",
    "| --- | --- | --- | ---: | --- |",
  ];
  for (const row of rows) {
    lines.push(`| \`${row.presetId}\` ${row.name} | ${row.primaryOutput} | ${row.pass ? "pass" : "needs work"} | ${row.checks.filter((check) => check.pass).length}/${row.checks.length} | ${row.opponents.join(", ")} |`);
  }
  lines.push("", "## Details", "");
  for (const row of rows) {
    lines.push(`### \`${row.presetId}\` ${row.name}`, "");
    lines.push(`- Fantasy: ${row.fantasy}`);
    if (row.experience.start) lines.push(`- Experience: ${row.experience.start} -> ${row.experience.transition} -> ${row.experience.payoff} -> ${row.experience.reset}`);
    lines.push(`- Samples: ${row.samples}`);
    for (const check of row.checks) {
      lines.push(`- ${check.pass ? "PASS" : "FAIL"} [${check.group}] \`${check.metric}\`: ${format(check.actual)} ${check.op} ${format(check.value)}`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function format(value) {
  return Number.isInteger(value) ? String(value) : Number(value).toFixed(3);
}

if (require.main === module) run();

module.exports = { analyzePreset, run, sampleResult };
