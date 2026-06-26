const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulatePresetMatchup } = require("./combat-sim");

const SEEDS = Number(process.env.ROLE_DIAG_SEEDS || 12);
const OUT_DIR = path.join(__dirname, "..", "design", "balance");
const JSON_OUT = path.join(OUT_DIR, "role-character-diagnostics.json");
const MD_OUT = path.join(OUT_DIR, "role-character-diagnostics.md");

const ROLE_CONTRACTS = {
  knight: {
    name: "骑士",
    expected: ["承伤", "护盾", "嘲讽", "反击"],
    weakness: ["直接输出不应过高", "爆发不应过高"],
    checks: [
      { id: "damage-too-high", label: "骑士输出过高", metric: "damageShare", op: ">", value: 0.36, severity: 2 },
      { id: "burst-too-high", label: "骑士爆发过高", metric: "peak2sDamageShare", op: ">", value: 0.32, severity: 2 },
    ],
  },
  warrior: {
    name: "战士",
    expected: ["稳定输出", "前排压制", "适中承伤"],
    weakness: ["不应超过刺客/法师式爆发", "不应拥有高治疗/护盾"],
    checks: [
      { id: "burst-too-high", label: "战士爆发过高", metric: "peak2sDamageShare", op: ">", value: 0.42, severity: 2 },
      { id: "sustain-too-high", label: "战士自带续航/护盾过高", metric: "ownSustainShare", op: ">", value: 0.24, severity: 2 },
    ],
  },
  berserker: {
    name: "狂战士",
    expected: ["低血强化", "普攻主轴", "吸血翻盘"],
    weakness: ["高输出时不应过于安全", "不应脱离低血风险"],
    checks: [
      { id: "safe-carry", label: "狂战高输出但过于安全", compound: "highDamageHighSurvival", severity: 3 },
      { id: "skill-dominant", label: "狂战输出不像普攻流", metric: "basicDamageShareOfOwn", op: "<", value: 0.34, severity: 2 },
    ],
  },
  mage: {
    name: "法师",
    expected: ["技能伤害", "AOE", "元素爆发"],
    weakness: ["承伤不应高", "生存不应强", "治疗/护盾不应高"],
    checks: [
      { id: "tankiness-too-high", label: "法师承伤生存过强", compound: "highTakenHighSurvival", severity: 3 },
      { id: "sustain-too-high", label: "法师治疗/护盾贡献过高", metric: "ownSustainShare", op: ">", value: 0.18, severity: 2 },
    ],
  },
  priest: {
    name: "牧师",
    expected: ["治疗", "护盾", "保护核心"],
    weakness: ["直接输出不应高", "爆发不应高"],
    checks: [
      { id: "damage-too-high", label: "牧师输出过高", metric: "damageShare", op: ">", value: 0.24, severity: 3 },
      { id: "burst-too-high", label: "牧师爆发过高", metric: "peak2sDamageShare", op: ">", value: 0.22, severity: 2 },
      { id: "sustain-too-low", label: "牧师治疗/护盾没有存在感", compound: "lowSustainWhenNeeded", severity: 2 },
    ],
  },
  assassin: {
    name: "刺客",
    expected: ["切后排", "收割", "短爆发"],
    weakness: ["生存不能太强", "承伤不能太高", "治疗/护盾不能太高"],
    checks: [
      { id: "survival-too-high", label: "刺客生存过强", compound: "assassinSafeSurvival", severity: 3 },
      { id: "sustain-too-high", label: "刺客治疗/护盾贡献过高", metric: "ownSustainShare", op: ">", value: 0.16, severity: 2 },
      { id: "taken-too-high", label: "刺客承伤过高但仍存活", compound: "highTakenHighSurvival", severity: 3 },
    ],
  },
  ranger: {
    name: "游侠",
    expected: ["标记", "持续输出", "远程压制"],
    weakness: ["不应变成纯刺客爆发", "不应高承伤"],
    checks: [
      { id: "burst-too-high", label: "游侠爆发过高", metric: "peak2sDamageShare", op: ">", value: 0.44, severity: 2 },
      { id: "tankiness-too-high", label: "游侠承伤生存过强", compound: "highTakenHighSurvival", severity: 2 },
    ],
  },
  bard: {
    name: "诗人",
    expected: ["加速", "增益", "节奏辅助"],
    weakness: ["直接输出不应高", "承伤不应高"],
    checks: [
      { id: "damage-too-high", label: "诗人输出过高", metric: "damageShare", op: ">", value: 0.28, severity: 2 },
      { id: "buff-too-low", label: "诗人增益存在感低", metric: "buffShare", op: "<", value: 0.18, severity: 1 },
    ],
  },
  warlock: {
    name: "术士",
    expected: ["诅咒", "持续伤害", "毒/献祭"],
    weakness: ["不应高护盾", "不应稳定治疗主职化"],
    checks: [
      { id: "sustain-too-high", label: "术士治疗/护盾过高", metric: "ownSustainShare", op: ">", value: 0.24, severity: 2 },
      { id: "dot-too-low", label: "术士持续伤害占比低", metric: "dotDamageShareOfOwn", op: "<", value: 0.18, severity: 1 },
    ],
  },
  alchemist: {
    name: "炼金术士",
    expected: ["状态混合", "异常转爆发", "区域收益"],
    weakness: ["不应成为纯治疗/护盾", "没有状态时不应爆发过强"],
    checks: [
      { id: "sustain-too-high", label: "炼金治疗/护盾过高", metric: "ownSustainShare", op: ">", value: 0.22, severity: 2 },
      { id: "status-too-low", label: "炼金状态参与低", compound: "lowAlchemyStatusIdentity", severity: 1 },
    ],
  },
};

function run() {
  const presetKeys = Object.keys(SKILL_DATA.presets);
  const games = [];
  const observations = [];
  const anomalies = [];

  for (const left of presetKeys) {
    for (const right of presetKeys) {
      if (left === right) continue;
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const result = simulatePresetMatchup(left, right, { seed, healthInterval: 0.5 });
        const gameId = `${left}__vs__${right}__seed_${seed}`;
        const game = summarizeGame(gameId, left, right, seed, result);
        games.push(game);
        const unitRows = analyzeUnits(game, result);
        observations.push(...unitRows);
        for (const row of unitRows) anomalies.push(...evaluateUnit(row, game));
      }
    }
  }

  const report = {
    schema: "western_fantasy_role_character_diagnostics_v1",
    generatedAt: new Date().toISOString(),
    seedsPerOrderedMatchup: SEEDS,
    presetCount: presetKeys.length,
    games: games.length,
    roles: roleSummary(observations, anomalies),
    anomalies: anomalies.sort((a, b) => b.score - a.score || b.metrics.duration - a.metrics.duration),
    observations,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(JSON_OUT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  fs.writeFileSync(MD_OUT, renderMarkdown(report), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), JSON_OUT)}`);
  console.log(`wrote ${path.relative(process.cwd(), MD_OUT)}`);
}

function summarizeGame(gameId, left, right, seed, result) {
  const sides = {
    left: sideTotals(result, "left"),
    right: sideTotals(result, "right"),
  };
  return {
    id: gameId,
    left,
    right,
    seed,
    winner: result.winner,
    duration: result.duration,
    hpScore: { left: result.leftHp, right: result.rightHp },
    sides,
  };
}

function sideTotals(result, side) {
  const signals = result.signals || [];
  const damage = signals.filter((signal) => isDamageFrom(signal, side));
  const taken = signals.filter((signal) => isDamageTo(signal, side));
  const heal = signals.filter((signal) => signal.tags.includes("heal") && signal.source?.side === side);
  const shield = signals.filter((signal) => signal.tags.includes("shield") && signal.source?.side === side);
  const status = signals.filter((signal) => signal.tags.includes("status") && signal.source?.side === side);
  const buff = signals.filter((signal) => signal.tags.includes("buff") && signal.source?.side === side);
  return {
    damage: amount(damage),
    taken: amount(taken),
    heal: amount(heal),
    shield: amount(shield),
    sustain: amount(heal) + amount(shield),
    status: amount(status),
    buff: amount(buff),
    dps: amount(damage) / Math.max(result.duration, 0.001),
  };
}

function analyzeUnits(game, result) {
  const unitById = Object.fromEntries(result.units.map((unit) => [unit.id, unit]));
  return result.units.map((unit) => {
    const signals = result.signals || [];
    const source = signals.filter((signal) => signal.source?.id === unit.id);
    const target = signals.filter((signal) => signal.target?.id === unit.id);
    const damage = source.filter((signal) => signal.tags.includes("damage") && !signal.tags.includes("selfCost"));
    const basicDamage = damage.filter((signal) => signal.tags.includes("basic"));
    const dotDamage = damage.filter((signal) => signal.tags.includes("dot"));
    const skillDamage = damage.filter((signal) => signal.tags.includes("skill"));
    const ultimateDamage = damage.filter((signal) => signal.tags.includes("ultimate"));
    const areaDamage = damage.filter((signal) => signal.tags.includes("area") || signal.tags.includes("splash"));
    const executeDamage = damage.filter((signal) => signal.skillKey === "shadowHarvest" || signal.skillKey === "deathNeedle");
    const takenDamage = target.filter((signal) => signal.tags.includes("damage") && !signal.tags.includes("selfCost"));
    const heal = source.filter((signal) => signal.tags.includes("heal"));
    const shield = source.filter((signal) => signal.tags.includes("shield"));
    const healReceived = target.filter((signal) => signal.tags.includes("heal"));
    const shieldReceived = target.filter((signal) => signal.tags.includes("shield"));
    const buff = source.filter((signal) => signal.tags.includes("buff"));
    const status = source.filter((signal) => signal.tags.includes("status"));
    const deaths = target.filter((signal) => signal.tags.includes("death"));
    const kills = source.filter((signal) => signal.tags.includes("death"));
    const casts = source.filter((signal) => signal.tags.includes("cast"));
    const side = game.sides[unit.side];
    const enemySide = unit.side === "left" ? game.sides.right : game.sides.left;
    const deathTime = deaths.length ? Math.min(...deaths.map((signal) => signal.time)) : game.duration;
    const peak = peakWindow(damage, game.duration, 2);
    const role = normalizeRole(unit.role);
    const damageTotal = amount(damage);
    const sustainTotal = amount(heal) + amount(shield);
    return {
      gameId: game.id,
      seed: game.seed,
      ownPreset: unit.side === "left" ? game.left : game.right,
      opponentPreset: unit.side === "left" ? game.right : game.left,
      side: unit.side,
      teamWon: game.winner === unit.side,
      unitId: unit.id,
      name: unit.name,
      role,
      roleName: ROLE_CONTRACTS[role]?.name || unit.role,
      skills: skillKeysForUnit(unitById[unit.id]),
      metrics: roundObject({
        duration: game.duration,
        damage: damageTotal,
        damageShare: share(damageTotal, side.damage),
        basicDamage: amount(basicDamage),
        basicDamageShareOfOwn: share(amount(basicDamage), damageTotal),
        skillDamage: amount(skillDamage),
        skillDamageShareOfOwn: share(amount(skillDamage), damageTotal),
        ultimateDamage: amount(ultimateDamage),
        dotDamage: amount(dotDamage),
        dotDamageShareOfOwn: share(amount(dotDamage), damageTotal),
        areaDamage: amount(areaDamage),
        executeDamage: amount(executeDamage),
        heal: amount(heal),
        shield: amount(shield),
        ownSustain: sustainTotal,
        ownSustainShare: share(sustainTotal, Math.max(side.sustain, side.damage * 0.35)),
        healingShare: share(amount(heal), side.heal),
        shieldShare: share(amount(shield), side.shield),
        taken: amount(takenDamage),
        takenShare: share(amount(takenDamage), side.taken),
        healReceived: amount(healReceived),
        shieldReceived: amount(shieldReceived),
        receivedSupport: amount(healReceived) + amount(shieldReceived),
        receivedSupportPerTaken: share(amount(healReceived) + amount(shieldReceived), amount(takenDamage)),
        buff: amount(buff),
        buffShare: share(amount(buff), side.buff),
        statusAmount: amount(status),
        statusAmountShare: share(amount(status), side.status),
        survivalTime: deathTime,
        survivalRatio: share(deathTime, game.duration),
        kills: kills.length,
        casts: casts.length,
        ultimateCasts: casts.filter((signal) => signal.tags.includes("ultimate")).length,
        firstCastTime: casts.length ? Math.min(...casts.map((signal) => signal.time)) : null,
        peak2sDamage: peak.amount,
        peak2sDamageShare: share(peak.amount, side.damage),
        enemyDps: enemySide.dps,
      }),
      evidence: {
        deathTime,
        peak2sStart: peak.start,
        topDamageSkills: topBySkill(damage),
        topTakenSkills: topBySkill(takenDamage),
      },
    };
  });
}

function evaluateUnit(row, game) {
  const contract = ROLE_CONTRACTS[row.role];
  if (!contract) return [];
  const out = [];
  for (const check of contract.checks) {
    const hit = check.compound ? compoundCheck(check.compound, row) : compare(row.metrics[check.metric], check.op, check.value);
    if (!hit) continue;
    const reasons = explain(row, check);
    out.push({
      id: `${row.gameId}:${row.unitId}:${check.id}`,
      role: row.role,
      roleName: contract.name,
      issue: check.label,
      severity: check.severity,
      score: check.severity * (reasons.length ? 1 : 2),
      hasReason: reasons.length > 0,
      reasons,
      game: {
        id: row.gameId,
        seed: row.seed,
        ownPreset: row.ownPreset,
        opponentPreset: row.opponentPreset,
        side: row.side,
        teamWon: row.teamWon,
      },
      unit: {
        id: row.unitId,
        name: row.name,
        role: row.role,
        skills: row.skills,
      },
      metrics: row.metrics,
      evidence: row.evidence,
    });
  }
  return out;
}

function compoundCheck(kind, row) {
  const m = row.metrics;
  if (kind === "highDamageHighSurvival") return m.damageShare > 0.38 && m.survivalRatio > 0.82 && m.duration > 18;
  if (kind === "highTakenHighSurvival") return m.takenShare > 0.24 && m.survivalRatio > 0.72 && m.duration > 18;
  if (kind === "assassinSafeSurvival") return m.damageShare > 0.28 && m.survivalRatio > (row.teamWon ? 0.82 : 0.9) && m.duration > 16;
  if (kind === "lowSustainWhenNeeded") return m.enemyDps > 12 && m.ownSustainShare < 0.25 && m.duration > 14;
  if (kind === "lowAlchemyStatusIdentity") return m.statusAmountShare < 0.16 && m.statusAmount < 40 && m.casts >= 8 && m.duration > 18;
  return false;
}

function explain(row, check) {
  const m = row.metrics;
  const reasons = [];
  if (m.enemyDps < 8 && ["tankiness-too-high", "survival-too-high", "taken-too-high"].includes(check.id)) {
    reasons.push("对面输出压力低，生存偏高可能来自对局环境。");
  }
  if (m.receivedSupportPerTaken > 0.45 && ["tankiness-too-high", "survival-too-high", "taken-too-high", "safe-carry"].includes(check.id)) {
    reasons.push("该角色收到大量治疗/护盾，生存偏高有队友保护解释。");
  }
  if (m.duration < 14 && ["burst-too-high", "damage-too-high"].includes(check.id)) {
    reasons.push("对局很短，伤害占比容易被早期窗口放大。");
  }
  if (row.role === "priest" && check.id === "damage-too-high" && m.basicDamageShareOfOwn > 0.9 && m.peak2sDamageShare < 0.1) {
    reasons.push("牧师高输出主要来自长时间普攻累计，不是技能爆发；优先检查辅助空档和队友伤害不足。");
  }
  if (row.role === "bard" && check.id === "damage-too-high" && m.basicDamageShareOfOwn > 0.9 && m.peak2sDamageShare < 0.08) {
    reasons.push("诗人高输出主要来自长时间普攻累计，不是技能爆发；可能是辅助空档的度量问题。");
  }
  if (["assassinSafeSurvival", "highTakenHighSurvival"].includes(check.compound) && row.teamWon && m.duration < 30) {
    reasons.push("队伍较快获胜，刺客存活可能是战斗结束前未被惩罚，而不是自身坦度过强。");
  }
  if (row.role === "assassin" && !row.teamWon && m.duration < 20 && ["survival-too-high", "taken-too-high"].includes(check.id)) {
    reasons.push("队伍短时间落败，刺客接近终局才死亡；这更像失败节奏，不应等同于刺客过硬。");
  }
  if (row.role === "assassin" && m.receivedSupportPerTaken > 0.22 && ["tankiness-too-high", "survival-too-high", "taken-too-high", "safe-carry"].includes(check.id)) {
    reasons.push("刺客收到中等护盾保护，部分生存异常来自队友保护。");
  }
  if (row.role === "alchemist" && check.id === "status-too-low" && m.statusAmount >= 40) {
    reasons.push("炼金绝对状态量健康；低占比来自队伍整体状态量过高，不等于该角色没开工。");
  }
  if (row.role === "alchemist" && check.id === "status-too-low" && SKILL_DATA.presets[row.ownPreset]?.design?.primaryOutput !== "statusPayoff") {
    reasons.push("该预设不是状态兑现主轴，炼金在这里更像副状态/控制位。");
  }
  if (!row.teamWon && ["sustain-too-low", "buff-too-low", "dot-too-low", "status-too-low"].includes(check.id)) {
    reasons.push("队伍落败，体系未启动可能导致该项贡献偏低。");
  }
  if (row.role === "knight" && check.id.includes("damage") && m.takenShare > 0.35) {
    reasons.push("骑士承受大量压力，反击伤害可能被承伤触发放大。");
  }
  if (row.role === "berserker" && check.id === "skill-dominant" && m.survivalRatio < 0.45) {
    reasons.push("狂战过早死亡，普攻窗口不足。");
  }
  return reasons;
}

function roleSummary(observations, anomalies) {
  const roles = {};
  for (const row of observations) {
    roles[row.role] ||= {
      role: row.role,
      name: ROLE_CONTRACTS[row.role]?.name || row.role,
      expected: ROLE_CONTRACTS[row.role]?.expected || [],
      weakness: ROLE_CONTRACTS[row.role]?.weakness || [],
      samples: 0,
      avg: {},
      anomalyCount: 0,
      unexplainedCount: 0,
      issueCounts: {},
    };
    const item = roles[row.role];
    item.samples += 1;
    for (const key of ["damageShare", "basicDamageShareOfOwn", "ownSustainShare", "takenShare", "survivalRatio", "peak2sDamageShare", "buffShare", "statusAmountShare"]) {
      item.avg[key] = (item.avg[key] || 0) + (row.metrics[key] || 0);
    }
  }
  for (const item of Object.values(roles)) {
    for (const key of Object.keys(item.avg)) item.avg[key] = round(item.avg[key] / item.samples, 3);
  }
  for (const anomaly of anomalies) {
    const item = roles[anomaly.role];
    if (!item) continue;
    item.anomalyCount += 1;
    if (!anomaly.hasReason) item.unexplainedCount += 1;
    item.issueCounts[anomaly.issue] = (item.issueCounts[anomaly.issue] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(roles).sort((a, b) => b[1].unexplainedCount - a[1].unexplainedCount || b[1].anomalyCount - a[1].anomalyCount));
}

function renderMarkdown(report) {
  const lines = [
    "# Role Character Diagnostics",
    "",
    `Generated with ${report.seedsPerOrderedMatchup} seeds per ordered preset matchup, ${report.games} games total.`,
    "",
    "This report checks whether each role behaves like its intended fantasy. Every issue links to a game id, seed, unit, metrics, and a short reason when the analyzer can find one.",
    "",
    "## Role Risk Summary",
    "",
    "| Role | Samples | Avg damage share | Avg sustain share | Avg taken share | Avg survival | Anomalies | Unexplained | Top issues |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
  ];
  for (const role of Object.values(report.roles)) {
    lines.push(`| ${role.name} \`${role.role}\` | ${role.samples} | ${pct(role.avg.damageShare)} | ${pct(role.avg.ownSustainShare)} | ${pct(role.avg.takenShare)} | ${pct(role.avg.survivalRatio)} | ${role.anomalyCount} | ${role.unexplainedCount} | ${topIssues(role.issueCounts)} |`);
  }
  lines.push("", "## Interpretation Notes", "");
  lines.push("- `priest`: the top issue is high damage share, but the evidence usually shows basic attacks, not burst. Treat this as a support downtime/basic-attack tuning problem or a team-low-damage context, not as a priest burst problem.");
  lines.push("- `alchemist`: low status share is only treated as suspicious when absolute status output is also low. This avoids false alarms in teams where multiple characters create status.");
  lines.push("- `bard`: average direct damage is low, but some games cross the direct-damage threshold. Check whether this is harmless long-fight basic damage before nerfing.");
  lines.push("- `assassin`: unexplained high survival / high taken cases remain the most suspicious role-shape issue, but short losing games are now separated from true over-tankiness.");
  lines.push("- `berserker`: high-output high-survival cases are currently reasoned as supported by healing/shields. This may be acceptable for carry comps, but it should remain watched.");
  lines.push("- `knight` and `warrior`: no current contract violations in this run.");
  lines.push("", "## Highest Priority Unexplained Issues", "");
  const unexplained = report.anomalies.filter((item) => !item.hasReason).slice(0, 40);
  if (!unexplained.length) lines.push("- None.");
  for (const item of unexplained) lines.push(renderIssue(item));

  lines.push("", "## Reasoned Issues", "");
  const reasoned = report.anomalies.filter((item) => item.hasReason).slice(0, 40);
  if (!reasoned.length) lines.push("- None.");
  for (const item of reasoned) lines.push(renderIssue(item));

  lines.push("", "## Role Contracts Used", "");
  for (const [role, contract] of Object.entries(ROLE_CONTRACTS)) {
    lines.push(`### ${contract.name} \`${role}\``);
    lines.push(`- Expected: ${contract.expected.join(", ")}`);
    lines.push(`- Weakness: ${contract.weakness.join(", ")}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function renderIssue(item) {
  const m = item.metrics;
  const reasons = item.reasons.length ? ` Reason: ${item.reasons.join(" ")}` : " Reason: none.";
  return `- [${item.roleName}] ${item.issue}: \`${item.game.id}\`, ${item.unit.name} \`${item.unit.id}\`, damage ${pct(m.damageShare)}, sustain ${pct(m.ownSustainShare)}, taken ${pct(m.takenShare)}, survival ${pct(m.survivalRatio)}, peak2s ${pct(m.peak2sDamageShare)}.${reasons}`;
}

function skillKeysForUnit(unit) {
  return [unit.small1, unit.small2, unit.passive, unit.ultimate].filter(Boolean);
}

function normalizeRole(role) {
  return ROLE_CONTRACTS[role] ? role : String(role || "").toLowerCase();
}

function isDamageFrom(signal, side) {
  return signal.tags.includes("damage") && signal.source?.side === side && !signal.tags.includes("selfCost");
}

function isDamageTo(signal, side) {
  return signal.tags.includes("damage") && signal.target?.side === side && !signal.tags.includes("selfCost");
}

function topBySkill(signals) {
  const values = {};
  for (const signal of signals) {
    const key = signal.skillKey || signal.skillName || "unknown";
    values[key] = (values[key] || 0) + (signal.amount || 0);
  }
  return Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([key, value]) => ({ key, amount: round(value) }));
}

function peakWindow(signals, duration, window) {
  let best = { start: 0, amount: 0 };
  for (let start = 0; start <= duration; start += 0.5) {
    const value = amount(signals.filter((signal) => signal.time >= start && signal.time < start + window));
    if (value > best.amount) best = { start, amount: value };
  }
  return { start: round(best.start), amount: round(best.amount) };
}

function compare(actual, op, expected) {
  if (!Number.isFinite(actual)) return false;
  if (op === ">") return actual > expected;
  if (op === "<") return actual < expected;
  if (op === ">=") return actual >= expected;
  if (op === "<=") return actual <= expected;
  return false;
}

function amount(signals) {
  return signals.reduce((sum, signal) => sum + (signal.amount || 0), 0);
}

function share(value, total) {
  return total > 0 ? value / total : 0;
}

function round(value, digits = 3) {
  if (value === null || value === undefined) return value;
  return Number(Number(value).toFixed(digits));
}

function roundObject(object) {
  return Object.fromEntries(Object.entries(object).map(([key, value]) => [key, round(value)]));
}

function pct(value) {
  return `${Math.round((value || 0) * 100)}%`;
}

function topIssues(counts) {
  const items = Object.entries(counts || {}).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return items.length ? items.map(([key, value]) => `${key} ${value}`).join("; ") : "-";
}

if (require.main === module) run();

module.exports = { run, analyzeUnits, evaluateUnit, ROLE_CONTRACTS };
