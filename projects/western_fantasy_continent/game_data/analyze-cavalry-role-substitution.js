"use strict";

const fs = require("fs");
const path = require("path");
const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");

const GAMES_PER_SIDE = Math.max(1, Number(process.argv[2]) || 1);
const OUTPUT_JSON = path.join(__dirname, "..", "design", "balance", "cavalry-role-substitution.json");
const OUTPUT_REPORT = path.join(__dirname, "..", "design", "cavalry-role-substitution-report.md");
const PRESET_KEYS = Object.keys(SKILLS.presets);

function cloneTeam(key) {
  return structuredClone(SKILLS.presets[key].team);
}

function cavalrySpec(sourceKey, slotIndex) {
  return {
    role: "cavalry",
    name: `替补马骑兵-${sourceKey}-${slotIndex + 1}`,
    ...structuredClone(SKILLS.roleKits.cavalry.kit),
  };
}

function simulatePerspective(team, opponent, seedPrefix) {
  let wins = 0;
  let games = 0;
  for (let seed = 0; seed < GAMES_PER_SIDE; seed += 1) {
    const forward = COMBAT.simulateTeams(team, opponent, {
      seed: `${seedPrefix}|${seed}|forward`,
      randomizeStats: true,
      maxTime: 80,
    });
    wins += forward.winner === "left" ? 1 : 0;
    games += 1;

    const reverse = COMBAT.simulateTeams(opponent, team, {
      seed: `${seedPrefix}|${seed}|reverse`,
      randomizeStats: true,
      maxTime: 80,
    });
    wins += reverse.winner === "right" ? 1 : 0;
    games += 1;
  }
  return { wins, games, rate: wins / games };
}

function outcome(rate) {
  if (rate >= 0.6) return "win";
  if (rate <= 0.4) return "loss";
  return "even";
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits = 3) {
  return Number(Number(value || 0).toFixed(digits));
}

function correlation(xs, ys) {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const mx = average(xs);
  const my = average(ys);
  let numerator = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let index = 0; index < xs.length; index += 1) {
    const dx = xs[index] - mx;
    const dy = ys[index] - my;
    numerator += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  if (dx2 <= 1e-12 || dy2 <= 1e-12) return 0;
  return numerator / Math.sqrt(dx2 * dy2);
}

function summarizeGroup(entries, group) {
  const originalRates = entries.map((entry) => entry.originalRate);
  const cavalryRates = entries.map((entry) => entry.cavalryRate);
  const mutations = new Set(entries.map((entry) => entry.mutationId));
  const sourceTeams = new Set(entries.map((entry) => entry.sourcePreset));
  const changed = entries.filter((entry) => entry.originalOutcome !== entry.cavalryOutcome);
  return {
    group,
    mutations: mutations.size,
    sourceTeams: sourceTeams.size,
    cells: entries.length,
    originalWinRate: round(average(originalRates)),
    cavalryWinRate: round(average(cavalryRates)),
    averageDelta: round(average(entries.map((entry) => entry.delta))),
    meanAbsoluteCellDelta: round(average(entries.map((entry) => Math.abs(entry.delta)))),
    outcomePreservation: round(1 - changed.length / Math.max(1, entries.length)),
    profileCorrelation: round(correlation(originalRates, cavalryRates)),
    improvedCells: entries.filter((entry) => entry.delta > 0).length,
    weakenedCells: entries.filter((entry) => entry.delta < 0).length,
    unchangedCells: entries.filter((entry) => entry.delta === 0).length,
  };
}

function groupBy(items, keyFn) {
  const groups = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function signedPct(value) {
  const points = Math.round(value * 100);
  return `${points > 0 ? "+" : ""}${points}pp`;
}

function renderReport(result) {
  const closest = result.byReplacedRole[0];
  const furthest = result.byReplacedRole[result.byReplacedRole.length - 1];
  const front = result.bySlot.find((row) => row.group === "front");
  const back = result.bySlot.find((row) => row.group === "back");
  const lines = [
    "# 马骑兵4v4单槽替换定位验证",
    "",
    `使用现有${result.setup.presetCount}套4v4预设。将每套队伍的4个单位逐个替换为基础马骑兵，共${result.setup.mutationCount}个变体；每个变体对阵全部原始预设，每格双方换边各${result.setup.gamesPerSide}局。`,
    "",
    "判断方法：替换某职业后，平均胜率变化越小、对手胜负分类保留越多、胜负谱相关性越高，说明骑兵越接近该职业原本承担的位置。这里只用于定位筛查，不作为精确平衡胜率。",
    "",
    "## 初步结论",
    "",
    `- 最接近${closest.roleName}：整体胜率${signedPct(closest.averageDelta)}，但单格平均仍变化${pct(closest.meanAbsoluteCellDelta)}，只有${pct(closest.outcomePreservation)}的胜/平/负分类保持，因此属于相近强度槽位，不是相同对局定位。`,
    `- 与${furthest.roleName}差异最大：替换后整体胜率${signedPct(furthest.averageDelta)}，单格平均变化${pct(furthest.meanAbsoluteCellDelta)}。`,
    `- 前两槽与后两槽的替换后总胜率分别为${pct(front.cavalryWinRate)}和${pct(back.cavalryWinRate)}；骑兵更适合前槽的信号很轻，主要差异仍来自队伍职责而不是出生槽位。`,
    "- 这轮测试的是无套装基础骑兵替换预设中的一名定制职业单位；它会同时移除原单位的预设技能协同，所以结论用于识别重叠风险，不等价于职业强度排名。",
    "",
    "## 按被替换职业汇总",
    "",
    "| 被替换职业 | 出现次数 | 原队胜率 | 换骑兵后 | 平均变化 | 单格平均变化 | 胜负分类保留 | 胜负谱相关 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const row of result.byReplacedRole) {
    lines.push(`| ${row.roleName} \`${row.group}\` | ${row.mutations} | ${pct(row.originalWinRate)} | ${pct(row.cavalryWinRate)} | ${signedPct(row.averageDelta)} | ${pct(row.meanAbsoluteCellDelta)} | ${pct(row.outcomePreservation)} | ${row.profileCorrelation.toFixed(2)} |`);
  }
  lines.push(
    "",
    "## 按站位汇总",
    "",
    "| 原始槽位 | 替换次数 | 原队胜率 | 换骑兵后 | 平均变化 | 单格平均变化 | 胜负分类保留 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const row of result.bySlot) {
    lines.push(`| ${row.slotLabel} | ${row.mutations} | ${pct(row.originalWinRate)} | ${pct(row.cavalryWinRate)} | ${signedPct(row.averageDelta)} | ${pct(row.meanAbsoluteCellDelta)} | ${pct(row.outcomePreservation)} |`);
  }
  lines.push(
    "",
    "## 变化最小的单槽替换",
    "",
  );
  for (const row of result.closestMutations.slice(0, 10)) {
    lines.push(`- ${row.sourceName}第${row.slotIndex + 1}位：${row.replacedRoleName}→马骑兵；原队${pct(row.originalWinRate)}，替换后${pct(row.cavalryWinRate)}，单格平均变化${pct(row.meanAbsoluteCellDelta)}，分类保留${pct(row.outcomePreservation)}。`);
  }
  lines.push(
    "",
    "## 变化最大的单槽替换",
    "",
  );
  for (const row of result.mostChangedMutations.slice(0, 10)) {
    lines.push(`- ${row.sourceName}第${row.slotIndex + 1}位：${row.replacedRoleName}→马骑兵；原队${pct(row.originalWinRate)}，替换后${pct(row.cavalryWinRate)}，单格平均变化${pct(row.meanAbsoluteCellDelta)}，分类保留${pct(row.outcomePreservation)}。`);
  }
  return `${lines.join("\n")}\n`;
}

function run() {
  const cells = [];
  const mutations = [];
  for (const sourcePreset of PRESET_KEYS) {
    const sourceTeam = cloneTeam(sourcePreset);
    for (let slotIndex = 0; slotIndex < sourceTeam.length; slotIndex += 1) {
      const replacedRole = sourceTeam[slotIndex].role;
      const mutationId = `${sourcePreset}|slot${slotIndex + 1}|${replacedRole}-to-cavalry`;
      const cavalryTeam = structuredClone(sourceTeam);
      cavalryTeam[slotIndex] = cavalrySpec(sourcePreset, slotIndex);
      const mutationCells = [];

      for (const opponentPreset of PRESET_KEYS) {
        const opponentTeam = cloneTeam(opponentPreset);
        const seedPrefix = `cavalry-role-substitution|${mutationId}|${opponentPreset}`;
        const original = simulatePerspective(sourceTeam, opponentTeam, seedPrefix);
        const cavalry = simulatePerspective(cavalryTeam, opponentTeam, seedPrefix);
        const cell = {
          mutationId,
          sourcePreset,
          sourceName: SKILLS.presets[sourcePreset].name,
          slotIndex,
          slotGroup: slotIndex < 2 ? "front" : "back",
          replacedRole,
          replacedRoleName: SKILLS.roleKits[replacedRole]?.role || replacedRole,
          opponentPreset,
          opponentName: SKILLS.presets[opponentPreset].name,
          originalWins: original.wins,
          cavalryWins: cavalry.wins,
          games: original.games,
          originalRate: original.rate,
          cavalryRate: cavalry.rate,
          delta: cavalry.rate - original.rate,
          originalOutcome: outcome(original.rate),
          cavalryOutcome: outcome(cavalry.rate),
        };
        cells.push(cell);
        mutationCells.push(cell);
      }

      const summary = summarizeGroup(mutationCells, mutationId);
      mutations.push({
        ...summary,
        mutationId,
        sourcePreset,
        sourceName: SKILLS.presets[sourcePreset].name,
        slotIndex,
        slotGroup: slotIndex < 2 ? "front" : "back",
        replacedRole,
        replacedRoleName: SKILLS.roleKits[replacedRole]?.role || replacedRole,
      });
    }
  }

  const byReplacedRole = [...groupBy(cells, (cell) => cell.replacedRole).entries()]
    .map(([role, entries]) => ({
      ...summarizeGroup(entries, role),
      roleName: SKILLS.roleKits[role]?.role || role,
    }))
    .sort((a, b) => a.meanAbsoluteCellDelta - b.meanAbsoluteCellDelta || b.outcomePreservation - a.outcomePreservation);

  const bySlot = [...groupBy(cells, (cell) => cell.slotGroup).entries()]
    .map(([slot, entries]) => ({
      ...summarizeGroup(entries, slot),
      slotLabel: slot === "front" ? "前两槽" : "后两槽",
    }))
    .sort((a, b) => a.group.localeCompare(b.group));

  const result = {
    schema: "western_fantasy_cavalry_role_substitution_v1",
    setup: {
      presetCount: PRESET_KEYS.length,
      mutationCount: mutations.length,
      opponentCount: PRESET_KEYS.length,
      gamesPerSide: GAMES_PER_SIDE,
      gamesPerCell: GAMES_PER_SIDE * 2,
      totalBattles: cells.length * GAMES_PER_SIDE * 4,
      loadout: "no equipment sets",
      comparison: "paired original team and one-slot cavalry replacement against the same opponent and seeds",
    },
    byReplacedRole,
    bySlot,
    closestMutations: [...mutations].sort((a, b) => a.meanAbsoluteCellDelta - b.meanAbsoluteCellDelta || b.outcomePreservation - a.outcomePreservation),
    mostChangedMutations: [...mutations].sort((a, b) => b.meanAbsoluteCellDelta - a.meanAbsoluteCellDelta || a.outcomePreservation - b.outcomePreservation),
    mutations,
    cells,
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  fs.writeFileSync(OUTPUT_REPORT, renderReport(result), "utf8");
  console.log(JSON.stringify({
    setup: result.setup,
    byReplacedRole: result.byReplacedRole,
    bySlot: result.bySlot,
    closestMutations: result.closestMutations.slice(0, 5),
    mostChangedMutations: result.mostChangedMutations.slice(0, 5),
    outputJson: path.relative(process.cwd(), OUTPUT_JSON),
    outputReport: path.relative(process.cwd(), OUTPUT_REPORT),
  }, null, 2));
}

run();
