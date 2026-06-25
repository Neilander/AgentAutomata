const fs = require("fs");
const path = require("path");

const EVIDENCE_FILE = path.join(__dirname, "..", "design", "balance", "archetype-matchup-evidence.json");
const OUT_FILE = path.join(__dirname, "..", "design", "balance", "archetype-extreme-diagnosis.md");
const OUT_JSON = path.join(__dirname, "..", "design", "balance", "archetype-extreme-diagnosis.json");
const EXTREME_LOW = 0.1;
const EXTREME_HIGH = 0.9;

function run() {
  const evidence = JSON.parse(fs.readFileSync(EVIDENCE_FILE, "utf8"));
  const extremes = evidence.matchups
    .filter((matchup) => matchup.rate <= EXTREME_LOW || matchup.rate >= EXTREME_HIGH)
    .map((matchup) => diagnoseMatchup(matchup, evidence.presets));
  const byPreset = summarizeByPreset(extremes, evidence.presets);
  const ecology = summarizeEcology(byPreset, evidence.presets);
  const output = {
    schema: "western_fantasy_archetype_extreme_diagnosis_v1",
    generatedAt: new Date().toISOString(),
    source: path.relative(path.join(__dirname, ".."), EVIDENCE_FILE),
    thresholds: { extremeLow: EXTREME_LOW, extremeHigh: EXTREME_HIGH },
    balanceHealth: evidence.balanceHealth,
    ecology,
    extremes,
    byPreset,
    leverage: leverageSummary(extremes),
  };
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUT_FILE, renderMarkdown(output, evidence.presets), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
  console.log(`wrote ${path.relative(process.cwd(), OUT_JSON)}`);
  return output;
}

function diagnoseMatchup(matchup, presets) {
  const leftFavored = matchup.rate >= EXTREME_HIGH;
  const advantaged = leftFavored ? matchup.left : matchup.right;
  const disadvantaged = leftFavored ? matchup.right : matchup.left;
  const samples = matchup.evidenceGames || [];
  const avg = averageSamples(samples);
  const winner = leftFavored ? avg.own : avg.opponent;
  const loser = leftFavored ? avg.opponent : avg.own;
  const reasons = inferReasons(winner, loser);
  return {
    left: matchup.left,
    right: matchup.right,
    leftName: matchup.leftName,
    rightName: matchup.rightName,
    rate: matchup.rate,
    advantaged,
    advantagedName: presets[advantaged]?.name || advantaged,
    disadvantaged,
    disadvantagedName: presets[disadvantaged]?.name || disadvantaged,
    expectation: matchup.expectation,
    avgDuration: matchup.avgDuration,
    sampleCount: samples.length,
    reasons,
    headline: headline(reasons),
    metrics: {
      advantaged: compactSide(winner),
      disadvantaged: compactSide(loser),
    },
  };
}

function averageSamples(samples) {
  const totals = { own: emptySide(), opponent: emptySide(), duration: 0 };
  for (const sample of samples) {
    totals.duration += sample.duration || 0;
    addSide(totals.own, flattenSide(sample.signalSummary?.own || {}, sample, "own"));
    addSide(totals.opponent, flattenSide(sample.signalSummary?.opponent || {}, sample, "opponent"));
  }
  const count = Math.max(1, samples.length);
  return {
    own: divideSide(totals.own, count),
    opponent: divideSide(totals.opponent, count),
    duration: totals.duration / count,
  };
}

function emptySide() {
  return {
    totalDamage: 0,
    basicDamage: 0,
    skillDamage: 0,
    ultimateDamage: 0,
    dotDamage: 0,
    poisonDamage: 0,
    burnDamage: 0,
    executeDamage: 0,
    counterDamage: 0,
    areaDamage: 0,
    takenDamage: 0,
    blockedDamage: 0,
    healing: 0,
    shield: 0,
    effectiveHealingRatio: 0,
    poisonStacks: 0,
    burnStacks: 0,
    slowApplications: 0,
    markApplications: 0,
    smallCasts: 0,
    ultimateCasts: 0,
    firstDeathTime: 0,
    firstDeathSamples: 0,
    peak2sDamage: 0,
    survivors: 0,
  };
}

function flattenSide(side, sample, sideKey) {
  const peak = (sample.keyEvents || []).find((event) => event.side === sideKey && event.type === "peak2sDamage");
  return {
    totalDamage: side.damage?.total || 0,
    basicDamage: side.damage?.basic || 0,
    skillDamage: side.damage?.skill || 0,
    ultimateDamage: side.damage?.ultimate || 0,
    dotDamage: side.damage?.dot || 0,
    poisonDamage: side.damage?.poison || 0,
    burnDamage: side.damage?.burn || 0,
    executeDamage: side.damage?.execute || 0,
    counterDamage: side.damage?.counter || 0,
    areaDamage: side.damage?.area || 0,
    takenDamage: side.taken?.total || 0,
    blockedDamage: side.taken?.blocked || 0,
    healing: side.sustain?.healing || 0,
    shield: side.sustain?.shield || 0,
    effectiveHealingRatio: side.sustain?.effectiveHealingRatio || 0,
    poisonStacks: side.status?.poisonStacks || 0,
    burnStacks: side.status?.burnStacks || 0,
    slowApplications: side.status?.slowApplications || 0,
    markApplications: side.status?.markApplications || 0,
    smallCasts: side.casts?.small || 0,
    ultimateCasts: side.casts?.ultimate || 0,
    firstDeathTime: side.firstDeathTime || 0,
    firstDeathSamples: side.firstDeathTime ? 1 : 0,
    peak2sDamage: peak?.amount || 0,
    survivors: sample.survivors?.[sideKey] || 0,
  };
}

function addSide(total, sample) {
  for (const key of Object.keys(total)) total[key] += sample[key] || 0;
}

function divideSide(total, count) {
  const out = {};
  for (const [key, value] of Object.entries(total)) out[key] = value / count;
  return out;
}

function inferReasons(winner, loser) {
  const reasons = [];
  addReason(reasons, "damageLead", "总伤害碾压", ratio(winner.totalDamage, loser.totalDamage), winner.totalDamage > loser.totalDamage * 1.25);
  addReason(reasons, "basicPressure", "普攻压力过高", share(winner.basicDamage, winner.totalDamage), share(winner.basicDamage, winner.totalDamage) >= 0.45 && winner.basicDamage > loser.basicDamage * 1.25);
  addReason(reasons, "dotPressure", "DOT/异常压力过高", share(winner.dotDamage, winner.totalDamage), share(winner.dotDamage, winner.totalDamage) >= 0.22 && winner.dotDamage > loser.dotDamage * 1.25);
  addReason(reasons, "burstWindow", "2秒峰值爆发过强", ratio(winner.peak2sDamage, loser.peak2sDamage), winner.peak2sDamage > loser.peak2sDamage * 1.35 && share(winner.peak2sDamage, winner.totalDamage) >= 0.18);
  addReason(reasons, "sustainGap", "治疗/护盾资源差距过大", ratio(winner.healing + winner.shield, loser.healing + loser.shield), winner.healing + winner.shield > (loser.healing + loser.shield) * 1.4 && winner.healing + winner.shield > 120);
  addReason(reasons, "shieldWall", "护盾吸收过强", share(winner.blockedDamage, winner.takenDamage + winner.blockedDamage), winner.blockedDamage > loser.blockedDamage * 1.4 && winner.blockedDamage > 80);
  addReason(reasons, "executePressure", "处决压力过稳定", share(winner.executeDamage, winner.totalDamage), share(winner.executeDamage, winner.totalDamage) >= 0.1);
  addReason(reasons, "counterValue", "反击收益过高", share(winner.counterDamage, winner.totalDamage), share(winner.counterDamage, winner.totalDamage) >= 0.08);
  addReason(reasons, "controlPressure", "控制窗口压制", ratio(winner.slowApplications, loser.slowApplications), winner.slowApplications >= loser.slowApplications + 2);
  addReason(reasons, "statusSetup", "状态铺垫过快", winner.poisonStacks + winner.burnStacks, winner.poisonStacks + winner.burnStacks >= 25);
  const loserDeath = loser.firstDeathSamples ? loser.firstDeathTime / loser.firstDeathSamples : Infinity;
  const winnerDeath = winner.firstDeathSamples ? winner.firstDeathTime / winner.firstDeathSamples : Infinity;
  addReason(reasons, "earlyCollapse", "弱势方过早减员", loserDeath, loserDeath <= 12 && loserDeath + 3 <= winnerDeath);
  addReason(reasons, "lowCounterplay", "弱势方反制资源不足", ratio(loser.healing + loser.shield + loser.blockedDamage, winner.totalDamage), loser.healing + loser.shield + loser.blockedDamage < winner.totalDamage * 0.35);
  if (!reasons.length) {
    reasons.push({ tag: "unclassified", label: "需要更细信号", score: 0, detail: "当前聚合信号不足以解释这个极端结果。" });
  }
  return reasons.sort((a, b) => b.score - a.score).slice(0, 5);
}

function addReason(reasons, tag, label, score, condition) {
  if (!condition) return;
  reasons.push({ tag, label, score: round(score), detail: reasonDetail(tag, score) });
}

function reasonDetail(tag, score) {
  if (tag === "damageLead") return `优势方总伤害约为弱势方 ${round(score, 2)} 倍。`;
  if (tag === "basicPressure") return `优势方普攻占自身输出约 ${percent(score)}。`;
  if (tag === "dotPressure") return `优势方 DOT 占自身输出约 ${percent(score)}。`;
  if (tag === "burstWindow") return `优势方 2 秒峰值约为弱势方 ${round(score, 2)} 倍。`;
  if (tag === "sustainGap") return `优势方治疗+护盾约为弱势方 ${round(score, 2)} 倍。`;
  if (tag === "shieldWall") return `优势方承伤中护盾吸收占比约 ${percent(score)}。`;
  if (tag === "executePressure") return `优势方处决伤害占比约 ${percent(score)}。`;
  if (tag === "counterValue") return `优势方反击伤害占比约 ${percent(score)}。`;
  if (tag === "controlPressure") return `优势方控制应用约为弱势方 ${round(score, 2)} 倍。`;
  if (tag === "statusSetup") return `优势方平均铺设状态层数约 ${round(score)}。`;
  if (tag === "earlyCollapse") return `弱势方平均首死约在 ${round(score, 2)} 秒。`;
  if (tag === "lowCounterplay") return `弱势方反制资源/优势方伤害约 ${percent(score)}。`;
  return "";
}

function compactSide(side) {
  return {
    totalDamage: round(side.totalDamage),
    basicShare: round(share(side.basicDamage, side.totalDamage), 3),
    dotShare: round(share(side.dotDamage, side.totalDamage), 3),
    executeShare: round(share(side.executeDamage, side.totalDamage), 3),
    counterShare: round(share(side.counterDamage, side.totalDamage), 3),
    peak2sDamage: round(side.peak2sDamage),
    healing: round(side.healing),
    shield: round(side.shield),
    blockedDamage: round(side.blockedDamage),
    statusStacks: round(side.poisonStacks + side.burnStacks),
    firstDeathTime: side.firstDeathSamples ? round(side.firstDeathTime / side.firstDeathSamples, 2) : null,
    survivors: round(side.survivors, 2),
  };
}

function summarizeByPreset(extremes, presets) {
  const summary = Object.fromEntries(Object.keys(presets).map((key) => [key, {
    key,
    name: presets[key].name,
    extremeAdvantages: [],
    extremeDisadvantages: [],
    advantageTags: {},
    disadvantageTags: {},
  }]));
  for (const item of extremes) {
    summary[item.advantaged].extremeAdvantages.push(shortMatchup(item));
    summary[item.disadvantaged].extremeDisadvantages.push(shortMatchup(item));
    countTags(summary[item.advantaged].advantageTags, item.reasons);
    countTags(summary[item.disadvantaged].disadvantageTags, item.reasons);
  }
  return Object.values(summary).map((item) => ({
    ...item,
    advantageTags: sortCounts(item.advantageTags),
    disadvantageTags: sortCounts(item.disadvantageTags),
  }));
}

function summarizeEcology(byPreset, presets) {
  const opponentCount = Math.max(1, Object.keys(presets).length - 1);
  const profiles = byPreset.map((preset) => {
    const prey = new Set(preset.extremeAdvantages.map((item) => item.disadvantaged));
    const predators = new Set(preset.extremeDisadvantages.map((item) => item.advantaged));
    const categoryCount = causeCategories(preset.advantageTags).length;
    const preyRatio = prey.size / opponentCount;
    const predatorRatio = predators.size / opponentCount;
    let status = "answered-niche";
    if (preyRatio >= 0.55 && predatorRatio <= 0.2 && categoryCount >= 3) status = "all-rounder-risk";
    else if (predatorRatio >= 0.45 && preyRatio <= 0.15) status = "vulnerable-without-prey";
    else if (preyRatio >= 0.55) status = "dominant-but-answered";
    else if (predatorRatio >= 0.45) status = "niche-under-pressure";
    else if (preyRatio >= 0.25 && predatorRatio >= 0.25) status = "polarized-but-answered";
    return {
      key: preset.key,
      name: preset.name,
      status,
      prey: [...prey].sort(),
      predators: [...predators].sort(),
      preyRatio: round(preyRatio, 3),
      predatorRatio: round(predatorRatio, 3),
      advantageCauseCategories: causeCategories(preset.advantageTags),
      primaryAdvantageTags: preset.advantageTags.slice(0, 4),
      primaryDisadvantageTags: preset.disadvantageTags.slice(0, 4),
    };
  });
  const reviewItems = profiles
    .filter((profile) => profile.status === "all-rounder-risk" || profile.status === "vulnerable-without-prey")
    .map((profile) => `${profile.name} ${profile.status}: prey ${profile.prey.length}, predators ${profile.predators.length}`);
  return {
    rule: "In deterministic combat, 0/100 is acceptable when the winner has clear cost, clear predators, and causal explanation. Review all-rounders and preyless weak presets first.",
    pass: reviewItems.length === 0,
    reviewItems,
    profiles,
  };
}

function causeCategories(tags) {
  const categories = new Set();
  for (const item of tags) {
    const tag = item.tag || item;
    if (["damageLead", "basicPressure", "burstWindow", "executePressure"].includes(tag)) categories.add("frontloadedDamage");
    else if (["dotPressure", "statusSetup"].includes(tag)) categories.add("statusScaling");
    else if (["sustainGap", "shieldWall", "lowCounterplay"].includes(tag)) categories.add("sustainOrCounterplay");
    else if (["controlPressure", "counterValue", "earlyCollapse"].includes(tag)) categories.add("tempoControl");
    else categories.add("other");
  }
  return [...categories].sort();
}

function shortMatchup(item) {
  return {
    matchup: `${item.left} vs ${item.right}`,
    rate: item.rate,
    advantaged: item.advantaged,
    disadvantaged: item.disadvantaged,
    headline: item.headline,
  };
}

function countTags(target, reasons) {
  for (const reason of reasons) target[reason.tag] = (target[reason.tag] || 0) + 1;
}

function sortCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tag, count]) => ({ tag, count }));
}

function leverageSummary(extremes) {
  const counts = {};
  for (const item of extremes) {
    for (const reason of item.reasons) counts[reason.tag] = (counts[reason.tag] || 0) + 1;
  }
  return sortCounts(counts);
}

function headline(reasons) {
  return reasons.slice(0, 2).map((reason) => reason.label).join(" + ") || "未归因";
}

function renderMarkdown(output, presets) {
  const lines = [
    "# Archetype Extreme Matchup Diagnosis",
    "",
    `Generated from \`${output.source}\`. This report diagnoses extreme ordered matchups; it does not recommend direct numeric changes by itself.`,
    "",
    "## Summary",
    "",
    `- Extreme ordered matchups: ${output.extremes.length}.`,
    `- Ecology health: ${output.ecology.pass ? "pass" : "review"}; polarization score ${output.balanceHealth.polarizationScore}.`,
    `- Extreme thresholds: <= ${percent(EXTREME_LOW)} or >= ${percent(EXTREME_HIGH)}.`,
    `- Deterministic rule: ${output.ecology.rule}`,
    "",
    "## Ecology Review",
    "",
  ];
  if (!output.ecology.reviewItems.length) {
    lines.push("- No all-rounder or preyless-weak preset flagged by the current heuristic.");
  } else {
    for (const item of output.ecology.reviewItems) lines.push(`- ${item}.`);
  }
  lines.push("", "| Preset | Status | Hard prey | Hard predators | Advantage categories |");
  lines.push("| --- | --- | ---: | ---: | --- |");
  for (const profile of output.ecology.profiles) {
    lines.push(`| ${profile.name} \`${profile.key}\` | ${profile.status} | ${profile.prey.length} | ${profile.predators.length} | ${profile.advantageCauseCategories.join(", ") || "-"} |`);
  }
  lines.push(
    "",
    "## Repeated Cause Tags",
    "",
    "| Cause tag | Count | Meaning |",
    "| --- | ---: | --- |",
  );
  for (const item of output.leverage) {
    lines.push(`| \`${item.tag}\` | ${item.count} | ${reasonLabel(item.tag)} |`);
  }
  lines.push("", "## Preset Summary", "");
  for (const preset of output.byPreset) {
    lines.push(`### ${preset.name} \`${preset.key}\``, "");
    lines.push(`- Extreme advantages: ${preset.extremeAdvantages.length}; repeated tags: ${formatTags(preset.advantageTags)}.`);
    lines.push(`- Extreme disadvantages: ${preset.extremeDisadvantages.length}; repeated tags: ${formatTags(preset.disadvantageTags)}.`);
    if (preset.extremeAdvantages.length) {
      lines.push("- Advantage cases:");
      for (const item of preset.extremeAdvantages.slice(0, 8)) lines.push(`  - ${item.matchup}: ${percent(item.rate)}; ${item.headline}.`);
    }
    if (preset.extremeDisadvantages.length) {
      lines.push("- Disadvantage cases:");
      for (const item of preset.extremeDisadvantages.slice(0, 8)) lines.push(`  - ${item.matchup}: ${percent(item.rate)}; ${item.headline}.`);
    }
    lines.push("");
  }
  lines.push("## Extreme Matchup Details", "");
  for (const item of output.extremes) {
    lines.push(`### ${item.leftName} into ${item.rightName}`);
    lines.push("");
    lines.push(`- Rate: ${percent(item.rate)}; advantaged: ${item.advantagedName}; disadvantaged: ${item.disadvantagedName}.`);
    lines.push(`- Headline: ${item.headline}.`);
    lines.push(`- Top reasons: ${item.reasons.map((reason) => `${reason.label} (${reason.detail})`).join("; ")}.`);
    lines.push(`- Advantaged metrics: damage ${item.metrics.advantaged.totalDamage}, basic ${percent(item.metrics.advantaged.basicShare)}, DOT ${percent(item.metrics.advantaged.dotShare)}, peak ${item.metrics.advantaged.peak2sDamage}, sustain ${item.metrics.advantaged.healing}+${item.metrics.advantaged.shield}, first death ${item.metrics.advantaged.firstDeathTime ?? "none"}.`);
    lines.push(`- Disadvantaged metrics: damage ${item.metrics.disadvantaged.totalDamage}, basic ${percent(item.metrics.disadvantaged.basicShare)}, DOT ${percent(item.metrics.disadvantaged.dotShare)}, peak ${item.metrics.disadvantaged.peak2sDamage}, sustain ${item.metrics.disadvantaged.healing}+${item.metrics.disadvantaged.shield}, first death ${item.metrics.disadvantaged.firstDeathTime ?? "none"}.`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function reasonLabel(tag) {
  const labels = {
    damageLead: "优势方总伤害显著领先",
    basicPressure: "优势方普攻输出占比高且领先",
    dotPressure: "优势方 DOT/异常输出占比高",
    burstWindow: "优势方短窗口爆发过强",
    sustainGap: "优势方治疗/护盾资源显著领先",
    shieldWall: "优势方护盾承伤占比高",
    executePressure: "优势方处决伤害占比较高",
    counterValue: "优势方反击伤害占比较高",
    controlPressure: "优势方控制应用更密集",
    statusSetup: "优势方状态铺设量大",
    earlyCollapse: "弱势方首死过早",
    lowCounterplay: "弱势方治疗/护盾/格挡反制不足",
    unclassified: "聚合信号不足，需要新增细粒度信号",
  };
  return labels[tag] || tag;
}

function formatTags(tags) {
  if (!tags.length) return "-";
  return tags.slice(0, 4).map((item) => `${item.tag} x${item.count}`).join(", ");
}

function ratio(a, b) {
  return b > 0 ? a / b : a > 0 ? 99 : 0;
}

function share(part, total) {
  return total > 0 ? part / total : 0;
}

function round(value, digits = 1) {
  return Number(Number(value || 0).toFixed(digits));
}

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

if (require.main === module) run();

module.exports = { run, diagnoseMatchup };
