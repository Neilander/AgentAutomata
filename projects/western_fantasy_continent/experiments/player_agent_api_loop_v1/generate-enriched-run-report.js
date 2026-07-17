const fs = require("node:fs");
const path = require("node:path");
const RUNNER = require("./enriched-two-chapter-run");

const root = path.resolve(process.argv[2] || path.join(__dirname, "controlled_runs", "2026-07-17_enriched_two_chapter"));
const manifest = readJson(path.join(root, "manifest.json"));
const mechanicalPath = path.join(root, "mechanical-bottlenecks.json");
const mechanical = fs.existsSync(mechanicalPath) ? summarizeMechanical(readJson(mechanicalPath)) : null;
const runs = [];
for (const profileId of manifest.profiles) {
  for (const seed of manifest.pairedSeeds) {
    const sessionPath = path.join(root, profileId, seed, "session.json");
    if (!fs.existsSync(sessionPath)) continue;
    runs.push(analyzeRun(readJson(sessionPath), profileId, seed, sessionPath));
  }
}

const profileRows = manifest.profiles.map((profileId) => analyzeProfile(profileId, runs.filter((run) => run.profileId === profileId)));
const startedRuns = runs.filter((run) => run.started);
const aggregate = {
  schema: "enriched_two_chapter_statistics_v1",
  generatedAt: new Date().toISOString(),
  manifest,
  coverage: {
    expectedRuns: manifest.profiles.length * manifest.pairedSeeds.length,
    presentRuns: runs.length,
    startedRuns: startedRuns.length,
    completeRuns: startedRuns.filter((run) => run.complete).length,
    chapter1Clears: startedRuns.filter((run) => run.chapter1Cleared).length,
    chapter2Clears: startedRuns.filter((run) => run.chapter2Cleared).length,
    alphaStarted: startedRuns.filter((run) => run.seed === "paired-alpha").length,
    alphaComplete: startedRuns.filter((run) => run.seed === "paired-alpha" && run.complete).length,
    betaStarted: startedRuns.filter((run) => run.seed === "paired-beta").length,
    betaComplete: startedRuns.filter((run) => run.seed === "paired-beta" && run.complete).length,
  },
  profiles: profileRows,
  runs,
  mechanical,
  diagnostics: buildDiagnostics(startedRuns, profileRows),
};

writeJson(path.join(root, "aggregate-statistics.json"), aggregate);
fs.writeFileSync(path.join(root, "STATISTICAL_REPORT.md"), renderMarkdown(aggregate));
console.log(JSON.stringify({
  report: path.join(root, "STATISTICAL_REPORT.md"),
  statistics: path.join(root, "aggregate-statistics.json"),
  coverage: aggregate.coverage,
  diagnostics: aggregate.diagnostics,
}, null, 2));

function analyzeRun(run, profileId, seed, sessionPath) {
  const summary = RUNNER.summarize(run);
  const chapterSessions = [run.chapter1, run.chapter2].filter(Boolean);
  const history = chapterSessions.flatMap((session, index) => session.history.map((row) => ({ chapter: index + 1, ...row })));
  const challenges = history.filter((row) => row.action.startsWith("challenge:"));
  const swaps = history.filter((row) => row.action.startsWith("swap:"));
  const equips = history.filter((row) => row.action.startsWith("equip:"));
  const unlocks = history.map((row, index) => ({ index, chapter: row.chapter, cycle: row.cycle, ...(row.gameEvent?.characterUnlock || {}) })).filter((row) => row.heroId);
  const unlockTests = unlocks.map((unlock) => {
    const later = history.findIndex((row, index) => index > unlock.index && row.action.startsWith("challenge:")
      && (row.decisionRequest?.observation?.teamSlots || []).some((slot) => slot.heroId === unlock.heroId));
    return { ...unlock, tested: later >= 0, actionsUntilTest: later >= 0 ? later - unlock.index : null };
  });
  const rosterATrace = history.flatMap((row) => (row.eventTrace || []).map((trace) => ({ action: row.action, chapter: row.chapter, cycle: row.cycle, ...trace })))
    .filter((row) => row.expectationSource === "roster_prediction");
  const rosterPredictionSelections = history.map((row) => row.rosterPredictionSelection).filter(Boolean);
  const rosterPredictionResolutions = history.map((row) => row.rosterPredictionResolution).filter(Boolean);
  const lootBatchOrderPenalties = history.flatMap((row) => {
    const lootTrace = (row.eventTrace || []).filter((trace) => trace.type === "loot");
    return lootTrace.flatMap((trace, index) => {
      const earlierPeak = Math.max(0, ...lootTrace.slice(0, index).map((prior) => Number(prior.acquiredEmotion || 0)));
      return Number(trace.expectationEmotion || 0) < 0 && earlierPeak > Number(trace.acquiredEmotion || 0)
        ? [{ chapter: row.chapter, cycle: row.cycle, action: row.action, eventId: trace.eventId, earlierAcquiredPeak: earlierPeak, acquired: trace.acquiredEmotion, A: trace.expectationEmotion }]
        : [];
    });
  });
  const sameBuildRetryRecoveries = history.flatMap((row, index) => {
    if (!row.action.startsWith("challenge:") || row.outcome !== "loss") return [];
    const node = row.gameEvent?.node || row.action.split(":")[1];
    const laterIndex = history.findIndex((candidate, candidateIndex) => candidateIndex > index
      && candidate.action === `challenge:${node}`);
    if (laterIndex < 0 || history[laterIndex].outcome !== "win") return [];
    const interveningBuildChange = history.slice(index + 1, laterIndex).some((candidate) => candidate.action.startsWith("swap:") || candidate.action.startsWith("equip:"));
    return interveningBuildChange ? [] : [{ node, lossCycle: row.cycle, winCycle: history[laterIndex].cycle, interveningActions: history.slice(index + 1, laterIndex).map((candidate) => candidate.action) }];
  });
  const drops = challenges.flatMap((row) => row.gameEvent?.loot || []);
  const dropObservations = challenges.flatMap((row) => (row.gameEvent?.loot || []).map((item) => ({
    pairedKey: `${seed}|${row.chapter}|${item.id}`,
    chapter: row.chapter,
    node: row.gameEvent?.node || row.action.split(":")[1],
    rarity: item.rarity || "unknown",
  })));
  const rarityCounts = countBy(drops, (item) => item.rarity || "unknown");
  const mythicItemIds = new Set(drops.filter((item) => item.rarity === "mythic").map((item) => item.id));
  const equippedMythicIds = [...new Set(equips.map((row) => row.action.split(":")[2]).filter((id) => mythicItemIds.has(id)))];
  const usedHeroIds = new Set(challenges.flatMap((row) => (row.decisionRequest?.observation?.teamSlots || []).map((slot) => slot.heroId)));
  const lastSession = chapterSessions.at(-1);
  const unresolvedFailures = lastSession.cognitionState.failureMemories.filter((row) => !row.resolved);
  return {
    profileId,
    seed,
    sessionPath,
    started: history.length > 0,
    complete: summary.status.complete,
    chapter1Cleared: summary.status.chapter1Cleared,
    chapter2Cleared: summary.status.chapter2Cleared,
    activeChapter: summary.status.activeChapter,
    phase: summary.status.phase,
    cycles: summary.status.cycles,
    challengeCount: challenges.length,
    wins: challenges.filter((row) => row.outcome === "win").length,
    losses: challenges.filter((row) => row.outcome === "loss").length,
    attemptsByNode: countBy(challenges, (row) => row.gameEvent?.node || row.action.split(":")[1]),
    lossesByNode: countBy(challenges.filter((row) => row.outcome === "loss"), (row) => row.gameEvent?.node || row.action.split(":")[1]),
    swaps: swaps.length,
    equips: equips.length,
    unlockTests,
    unlockedNeverTested: unlockTests.filter((row) => !row.tested).map((row) => row.heroId),
    usedHeroIds: [...usedHeroIds],
    drops: drops.length,
    dropObservations,
    rarityCounts,
    mythicDrops: rarityCounts.mythic || 0,
    equippedMythicIds,
    rosterA: {
      selections: rosterPredictionSelections.length,
      resolved: history.filter((row) => row.rosterPredictionResolution?.status === "resolved").length,
      invalidated: rosterPredictionResolutions.filter((row) => row.status === "invalidated").length,
      invalidatedReasons: countBy(rosterPredictionResolutions.filter((row) => row.status === "invalidated"), (row) => row.resolutionReason || "unknown"),
      positive: rosterATrace.filter((row) => Number(row.expectationEmotion || 0) > 0).length,
      negative: rosterATrace.filter((row) => Number(row.expectationEmotion || 0) < 0).length,
      zero: rosterATrace.filter((row) => Number(row.expectationEmotion || 0) === 0).length,
      total: round(sum(rosterATrace, (row) => Number(row.expectationEmotion || 0))),
      minimum: rosterATrace.length ? Math.min(...rosterATrace.map((row) => Number(row.expectationEmotion || 0))) : 0,
    },
    lootBatchOrderPenalties,
    sameBuildRetryRecoveries,
    emotion: summary.emotion,
    knowledgeCount: summary.knowledgeCount,
    priorStatuses: countBy(lastSession.playerProfile.priorBeliefs || [], (row) => row.status || "unknown"),
    finalCharacterImpressions: summaryImpressions(lastSession),
    unresolvedFailures: unresolvedFailures.map((row) => ({ node: row.node, attempt: row.attempt, wakeCondition: row.wakeCondition })),
    route: summary.route,
  };
}

function analyzeProfile(profileId, rows) {
  return {
    profileId,
    expectedRuns: rows.length,
    runs: rows.filter((row) => row.started).length,
    complete: rows.filter((row) => row.started && row.complete).length,
    chapter1Clears: rows.filter((row) => row.started && row.chapter1Cleared).length,
    chapter2Clears: rows.filter((row) => row.started && row.chapter2Cleared).length,
    challenges: sum(rows, (row) => row.challengeCount),
    losses: sum(rows, (row) => row.losses),
    swaps: sum(rows, (row) => row.swaps),
    equips: sum(rows, (row) => row.equips),
    mythicDrops: sum(rows, (row) => row.mythicDrops),
    mythicEquips: sum(rows, (row) => row.equippedMythicIds.length),
    unlockedNeverTested: [...new Set(rows.flatMap((row) => row.unlockedNeverTested))],
    rosterANegative: sum(rows, (row) => row.rosterA.negative),
    rosterATotal: round(sum(rows, (row) => row.rosterA.total)),
    rosterASelections: sum(rows, (row) => row.rosterA.selections),
    rosterAResolved: sum(rows, (row) => row.rosterA.resolved),
    rosterAInvalidated: sum(rows, (row) => row.rosterA.invalidated),
    lootBatchOrderPenalties: sum(rows, (row) => row.lootBatchOrderPenalties.length),
    sameBuildRetryRecoveries: sum(rows, (row) => row.sameBuildRetryRecoveries.length),
    finalEmotionMean: rows.some((row) => row.started) ? round(sum(rows.filter((row) => row.started), (row) => row.emotion.final) / rows.filter((row) => row.started).length) : null,
  };
}

function buildDiagnostics(runs, profiles) {
  const allUnlocks = runs.flatMap((run) => run.unlockTests);
  const uniqueDrops = [...new Map(runs.flatMap((run) => run.dropObservations).map((row) => [row.pairedKey, row])).values()];
  const uniqueMythic = uniqueDrops.filter((row) => row.rarity === "mythic");
  return {
    completionRate: round(runs.filter((run) => run.complete).length / Math.max(1, runs.length)),
    chapter2ConfluenceLosses: sum(runs, (run) => run.lossesByNode.r2_confluence || 0),
    chapter1Main9Losses: sum(runs, (run) => run.lossesByNode.r1_main_9 || 0),
    equipActionRatePerChallenge: round(sum(runs, (run) => run.equips) / Math.max(1, sum(runs, (run) => run.challengeCount))),
    newCharacterTestRate: round(allUnlocks.filter((row) => row.tested).length / Math.max(1, allUnlocks.length)),
    uniquePairedDropItems: uniqueDrops.length,
    uniquePairedMythicItems: uniqueMythic.length,
    playerMythicExposures: sum(runs, (run) => run.mythicDrops),
    playerMythicEquipResponses: sum(runs, (run) => run.equippedMythicIds.length),
    observedMythicRateAcrossUniquePairedDrops: round(uniqueMythic.length / Math.max(1, uniqueDrops.length), 5),
    mythicRuleValidation: "All 19 generated rule classes contain exact mythic=0.01; the deterministic 100,000-item validator observed 988 mythics (0.988%).",
    mythicRateSampleCaveat: "The live-agent unique-drop sample is too small to estimate a 1% rate; its observed percentage is descriptive only.",
    pairedBetaCaveat: "open_novice/paired-beta had no opening mythic but received a mythic level-26 item at Chapter 2 cycle 16 (+160 active power), so only its pre-drop segment is a non-jackpot comparison.",
    pairedSeedCorrelationRule: "The same seed/node/attempt drop is one random observation even when several profiles experience it; profile-level mythic counts are player exposures, not independent probability samples.",
    lootBatchOrderPenaltyCount: sum(runs, (run) => run.lootBatchOrderPenalties.length),
    worstLootBatchOrderPenalty: round(Math.min(0, ...runs.flatMap((run) => run.lootBatchOrderPenalties).map((row) => Number(row.A || 0)))),
    sameBuildRetryRecoveryCount: sum(runs, (run) => run.sameBuildRetryRecoveries.length),
    retrySeedConfound: "Combat attempt number changes the random seed. A loss can become a win without a roster or equipment intervention, weakening causal learning about the wall.",
    rawDiagnosisBoundaryLimitation: "Threat knowledge currently spreads raw gameEvent.diagnosis fields into later player requests. Disposable enemy names and internal role strings can bypass concept interpretation.",
    cognitionAuditLimitation: "The archived trace does not expose a complete P/Q/R/kP plus Agency-to-action audit, and code-owned profile priors remain unverified_prior after contradictory evidence.",
    runsEndingEmotionAtLeast95: runs.filter((run) => Number(run.emotion.final || 0) >= 95).map((run) => `${run.profileId}/${run.seed}:${round(run.emotion.final)}`),
    emotionSaturationRisk: "Several long runs approach the upper emotion range despite major repeated losses, which compresses later positive and negative feedback.",
    profilesWithNoEquipActions: profiles.filter((row) => row.runs > 0 && row.equips === 0).map((row) => row.profileId),
    profilesWithNegativeRosterA: profiles.filter((row) => row.rosterANegative > 0).map((row) => row.profileId),
    rosterPredictionSelections: sum(runs, (run) => run.rosterA.selections),
    rosterPredictionResolved: sum(runs, (run) => run.rosterA.resolved),
    rosterPredictionInvalidated: sum(runs, (run) => run.rosterA.invalidated),
    rosterPredictionNaturalProgressRisk: "A swap prediction is scoped to the currently selected encounter. If the player swaps after a clear and advances to the newly unlocked encounter, the prediction is invalidated as different_encounter and produces no A feedback.",
    unverifiedPriorRows: sum(runs, (run) => run.priorStatuses.unverified_prior || 0),
    modelSelectionLimitation: "5.5fast requested; current subagent interface exposes no model selector or actual model identity.",
    mythicCognitionLimitation: "Current probability family combines every non-common drop by node; it does not learn a cross-node 1% mythic belief or dry streak.",
    mechanicalCoverage: "The exhaustive formation scan now covers selected middle gates, r1_main_10, r1_boss, and r2_boss in bare and deterministic best-visible-equipment states.",
  };
}

function renderMarkdown(data) {
  const lines = [
    "# Enriched Two-Chapter Player-Agent Statistics",
    "",
    `- Runs initialized: ${data.coverage.presentRuns}/${data.coverage.expectedRuns}; started ${data.coverage.startedRuns}; complete ${data.coverage.completeRuns}`,
    `- Alpha profile runs: started ${data.coverage.alphaStarted}, complete ${data.coverage.alphaComplete}; beta comparisons: started ${data.coverage.betaStarted}, complete ${data.coverage.betaComplete}`,
    `- Requested model: ${data.manifest.requestedModel}; actual: ${data.manifest.actualModel} (${data.manifest.modelSelectionStatus})`,
    `- Paired seeds: ${data.manifest.pairedSeeds.join(", ")}`,
    "",
    "## Per-profile results",
    "",
    "| profile | complete | C1 | C2 | fights | losses | swaps | equips | mythic drop/equip | new heroes never tested | negative roster A | final emotion mean |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: |",
  ];
  for (const row of data.profiles) {
    lines.push(`| ${row.profileId} | ${row.complete}/${row.runs} | ${row.chapter1Clears} | ${row.chapter2Clears} | ${row.challenges} | ${row.losses} | ${row.swaps} | ${row.equips} | ${row.mythicDrops}/${row.mythicEquips} | ${row.unlockedNeverTested.join(", ") || "-"} | ${row.rosterANegative} | ${row.finalEmotionMean ?? "-"} |`);
  }
  if (data.mechanical) {
    lines.push("", "## Mechanical bottleneck enumeration", "", "Every legal 4-character combination was tested in canonical and reversed order, both bare and with deterministic best-visible equipment.", "", "| encounter | formations | bare win rate | geared win rate |", "| --- | ---: | ---: | ---: |");
    for (const row of data.mechanical.nodes) lines.push(`| ${row.nodeId} | ${row.formations} | ${formatPercent(row.bareWinRate)} | ${formatPercent(row.gearedWinRate)} |`);
  }
  lines.push("", "## Cross-run diagnostics", "");
  for (const [key, value] of Object.entries(data.diagnostics)) lines.push(`- ${key}: ${Array.isArray(value) ? value.join(", ") || "none" : value}`);
  lines.push("", "## 当前暴露的问题", "", ...renderDiagnosis(data));
  lines.push("", "## Run details", "");
  for (const run of data.runs) {
    lines.push(`### ${run.profileId} / ${run.seed}`, "", `- Complete: ${run.complete}; chapter ${run.activeChapter}; phase ${run.phase}`, `- Fights ${run.challengeCount}, wins ${run.wins}, losses ${run.losses}; swaps ${run.swaps}; equips ${run.equips}`, `- Attempts: ${JSON.stringify(run.attemptsByNode)}`, `- Drops: ${JSON.stringify(run.rarityCounts)}; roster A: ${JSON.stringify(run.rosterA)}`, `- Unresolved failures: ${JSON.stringify(run.unresolvedFailures)}`, "");
  }
  return `${lines.join("\n")}\n`;
}

function summarizeMechanical(source) {
  const nodes = Object.values(source).filter((row) => row && row.nodeId && row.bare && row.bestVisibleEquipment).map((row) => ({
    nodeId: row.nodeId,
    formations: row.testedFormations || row.bare.formations,
    bareWinRate: Number(row.bare.winRate || 0),
    gearedWinRate: Number(row.bestVisibleEquipment.winRate || 0),
  }));
  return { schema: source.schema, method: source.method, nodes };
}

function renderDiagnosis(data) {
  const d = data.diagnostics;
  const started = data.coverage.startedRuns;
  const settlementRate = d.rosterPredictionSelections ? d.rosterPredictionResolved / d.rosterPredictionSelections : 0;
  const gearSwamped = data.mechanical?.nodes.filter((row) => row.gearedWinRate - row.bareWinRate >= 0.5) || [];
  const lines = [
    `- **独立审阅总判定：reject（作为完整认知/进度验证）。** 玩家行为本身大体符合各自 profile，但当前证据只能当诊断样本，不能宣称整套玩家认知模型已经可信。`,
    `- **玩家可见信号边界有泄漏。** 威胁知识直接携带了 gameEvent.diagnosis 中的临时敌人名字和内部 role 字符串，没有先经过概念解释；因此“引用合法事件 ID”不等于“玩家只看到了合法语义”。`,
    `- **换人 A 反馈在自然推进中基本没有结算。** 已建立 ${d.rosterPredictionSelections} 次换人预测，只结算 ${d.rosterPredictionResolved} 次（${formatPercent(settlementRate)}），另有 ${d.rosterPredictionInvalidated} 次因进入下一场战斗而失效。受控的“换人后重打同一关”测试通过，但真实玩家常在胜利后换人并继续前进，当前绑定方式覆盖不了这种正常行为。`,
    `- **同批掉落存在顺序污染。** 共检测到 ${d.lootBatchOrderPenaltyCount} 次“先出高价值装备、后出普通装备”导致的负 A，最差 ${d.worstLootBatchOrderPenalty}。同一场结算里的普通掉落不应因为前一件是极品就立刻被当成失望。`,
    `- **神话掉落有行为反应，但没有正确的概率认知。** 玩家共接触 ${d.playerMythicExposures} 件神话并装备 ${d.playerMythicEquipResponses} 件；当前知识只学习“某节点出过非普通装备”，没有跨节点的 1% 神话概率、干旱期或惊喜尺度。`,
    `- **beta 不是完整无神话对照。** 它在第二章第 16 轮获得神话 Lv26 装备并增加 160 有效强度；只能把此前片段与 alpha 对照，不能用其 Boss 结果证明无神话路线更容易。掉落规则本身的 1% 由 10 万次程序抽样验证为 0.988%，真实 Agent 的 117 件独立掉落样本太小，不能反推概率。`,
    `- **战斗随机数削弱因果学习。** 重试会改变战斗随机种子，所以相同阵容和装备也可能从失败变成胜利；玩家容易把随机翻盘错误归因给路线、角色或装备。`,
    `- **玩家先验没有状态闭环。** ${d.unverifiedPriorRows} 条先验在运行后仍标记为 unverified_prior；知识和行为可能已经改变，但“先验被证实/被推翻”没有程序化落盘。`,
    `- **完整认知计算仍不可审计。** 当前归档没有把 P/Q/R/kP 和 Agency→动作选择形成一条完整可复算链；所以最终情绪值和行为合理，仍不能替代对完整认知模型的验证。`,
    `- **情绪尺度出现上沿饱和。** ${d.runsEndingEmotionAtLeast95.length} 个运行结束时情绪值达到 95 以上；惯性型即使经历大量失败也接近上沿，后期装备提升和再次失败的反馈会被压扁。`,
    `- **终局也会被最佳可见装备显著软化。** 新增穷举后，第一章 Boss 从裸装 ${formatPercent(data.mechanical?.nodes.find((row) => row.nodeId === "r1_boss")?.bareWinRate)} 升至装备态 ${formatPercent(data.mechanical?.nodes.find((row) => row.nodeId === "r1_boss")?.gearedWinRate)}；第二章 Boss 从 ${formatPercent(data.mechanical?.nodes.find((row) => row.nodeId === "r2_boss")?.bareWinRate)} 升至 ${formatPercent(data.mechanical?.nodes.find((row) => row.nodeId === "r2_boss")?.gearedWinRate)}。Agent 的实际装备未必达到该上限，但关卡的理论判别力已经被装备大幅压缩。`,
    `- **样本口径提醒。** 当前统计包含 ${started} 个已启动玩家运行；相同 paired seed 的同一掉落只算一个随机观测，不能把多个玩家看到同一件神话装备当成多次独立抽样。`,
  ];
  if (gearSwamped.length) {
    lines.splice(3, 0, `- **装备正在淹没关卡机制。** ${gearSwamped.map((row) => `${row.nodeId} ${formatPercent(row.bareWinRate)}→${formatPercent(row.gearedWinRate)}`).join("；")}。这些关卡原本想检查阵容/角色理解，但最佳可见装备让绝大多数编队直接通过。`);
  }
  return lines;
}

function formatPercent(value) {
  return `${round(Number(value || 0) * 100, 2)}%`;
}

function summaryImpressions(session) {
  const entries = session.entityImpressionState?.strengthCognitionMatrix?.entries || [];
  return entries.map((row) => ({ subject: row.subject, position: row.position, evidenceCount: row.evidenceCount }));
}

function countBy(rows, selector) {
  const result = {};
  for (const row of rows) {
    const key = selector(row);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function sum(rows, selector) {
  return rows.reduce((total, row) => total + Number(selector(row) || 0), 0);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}
