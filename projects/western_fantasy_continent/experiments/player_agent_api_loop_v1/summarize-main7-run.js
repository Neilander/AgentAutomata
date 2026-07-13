const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const sessionPath = path.resolve(process.argv[2] || "session.json");
const outputTag = String(process.argv[3] || "").trim();
const outputSuffix = outputTag ? `-${outputTag}` : "";
const runDir = path.dirname(sessionPath);
const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));

const trace = session.history.map((row) => ({
  cycle: row.cycle,
  action: row.action,
  outcome: row.outcome,
  emotionBefore: row.emotionBeforeDecision,
  emotionAfter: row.emotionAfterEvents,
  automaticEmotionDelta: row.automaticEmotionDelta,
  addedKnowledge: row.learningDelta?.addedKnowledge || [],
  updatedKnowledge: row.learningDelta?.updatedKnowledge || [],
  matchedConcepts: row.learningDelta?.matchedConcepts || [],
  addedConcepts: row.learningDelta?.addedConcepts || [],
  changedConceptCandidates: row.learningDelta?.changedConceptCandidates || [],
  conceptLibraryChanged: Boolean(row.learningDelta?.conceptLibraryChanged),
  attribution: row.attribution || null,
}));

const requiredFiles = [];
for (let cycle = 1; cycle <= session.cycle; cycle += 1) {
  const cycleLabel = String(cycle).padStart(2, "0");
  for (const kind of ["decision", "attribution"]) {
    for (const direction of ["request", "response"]) {
      requiredFiles.push(`${kind}-${cycleLabel}-${direction}.json`);
    }
  }
}

const responseFiles = requiredFiles.filter((name) => name.includes("-response.json"));
const responseHashes = Object.fromEntries(responseFiles.map((name) => {
  const filePath = path.join(runDir, name);
  return [name, fs.existsSync(filePath) ? sha256(fs.readFileSync(filePath)) : null];
}));
const outsideResponseHashes = collectOutsideResponseHashes(path.resolve(__dirname), runDir);
const responseHashMatchesOutsideRun = Object.entries(responseHashes)
  .filter(([, hash]) => hash && outsideResponseHashes.has(hash))
  .map(([name, hash]) => ({ name, hash, matches: outsideResponseHashes.get(hash) }));

const decisionResponsesOutsideAllowedActions = [];
const responseSessionMismatches = [];
for (let cycle = 1; cycle <= session.cycle; cycle += 1) {
  const label = String(cycle).padStart(2, "0");
  const request = readJson(path.join(runDir, `decision-${label}-request.json`));
  const response = readJson(path.join(runDir, `decision-${label}-response.json`));
  const historyRow = session.history.find((row) => row.cycle === cycle);
  if (!request.observation?.allowedActions?.includes(response.action)) {
    decisionResponsesOutsideAllowedActions.push({ cycle, action: response.action });
  }
  if (JSON.stringify(response) !== JSON.stringify(historyRow?.decisionResponse)) {
    responseSessionMismatches.push({ cycle, kind: "decision" });
  }
  const attributionResponse = readJson(path.join(runDir, `attribution-${label}-response.json`));
  const recordedAttribution = historyRow?.attribution;
  const normalizedAttribution = recordedAttribution ? {
    knowledgeId: recordedAttribution.knowledgeId,
    primaryCause: recordedAttribution.cause,
    confidence: recordedAttribution.confidence,
    evidenceEventIds: recordedAttribution.evidenceEventIds,
    alternativeCauses: recordedAttribution.alternativeCauses,
    nextTest: recordedAttribution.nextTest,
  } : null;
  if (JSON.stringify(attributionResponse) !== JSON.stringify(normalizedAttribution)) {
    responseSessionMismatches.push({ cycle, kind: "attribution" });
  }
}

const audit = {
  schema: "player_agent_run_audit_v2",
  seed: session.seed,
  completedCycles: session.cycle,
  stoppedAtPhase: session.phase,
  clearedMain7: Boolean(session.gameState?.cleared?.r1_main_7),
  reachedBoss: session.history.some((row) => row.action === "challenge:r1_boss"),
  clearedBoss: Boolean(session.gameState?.cleared?.r1_boss),
  bossAttempts: session.history.filter((row) => row.action === "challenge:r1_boss").length,
  actionCounts: countActions(session.history),
  teamSwapActions: session.history.filter((row) => row.action.startsWith("swap:")).map((row) => ({ cycle: row.cycle, action: row.action })),
  characterUnlocks: session.history.flatMap((row) => (row.eventLog || [])
    .filter((event) => event.type === "character_unlock")
    .map((event) => ({ cycle: row.cycle, character: event.result?.character, heroId: event.result?.heroId }))),
  mageSwapActions: session.history.filter((row) => row.action.startsWith("swap:") && row.action.endsWith(":hero_mage")).map((row) => row.cycle),
  rangerSwapActions: session.history.filter((row) => row.action.startsWith("swap:") && row.action.endsWith(":hero_ranger")).map((row) => row.cycle),
  characterExperimentResults: session.history.flatMap((row) => (row.eventLog || [])
    .filter((event) => event.type === "team_experiment_result")
    .map((event) => ({ cycle: row.cycle, ...event.result }))),
  main1WaveSummary: session.history.find((row) => row.action === "challenge:r1_main_1")?.gameEvent?.waveSummary || [],
  requiredFileCount: requiredFiles.length,
  missingFiles: requiredFiles.filter((name) => !fs.existsSync(path.join(runDir, name))),
  historyRowsWithLearningDelta: session.history.filter((row) => row.learningDelta).length,
  historyRowsWithRawAndSemanticLogs: session.history.filter((row) => Array.isArray(row.rawEventLog) && Array.isArray(row.eventLog)).length,
  canonicalKnowledgeCount: session.knowledgeBase.length,
  invalidCanonicalKnowledge: session.knowledgeBase
    .filter((row) => !row.subject || !row.environment || !row.behavior || !row.result)
    .map((row) => row.id),
  lootKnowledgeThatChangedEquippedPower: session.knowledgeBase
    .filter((row) => row.behavior?.kind === "clear_level")
    .filter((row) => row.result?.observations?.some((item) => item.outcome === "loot_obtained" && item.powerChanged))
    .map((row) => row.id),
  apiCallRecords: session.apiCalls.length,
  decisionResponsesOutsideAllowedActions,
  responseSessionMismatches,
  responseHashMatchesOutsideRun,
  responseHashes,
  note: "Response files were created in this unique run directory. Decisions and attributions were supplied turn-by-turn by an external player agent; combat, loot, emotion, canonical knowledge, and concept interpretation were computed by repository code.",
};

const traceJsonName = `action-knowledge-concept-trace${outputSuffix}.json`;
const auditJsonName = `run-audit${outputSuffix}.json`;
const traceMarkdownName = outputTag
  ? `ACTION_KNOWLEDGE_CONCEPT_TRACE_${outputTag.replace(/-/g, "_").toUpperCase()}.md`
  : "ACTION_KNOWLEDGE_CONCEPT_TRACE.md";
fs.writeFileSync(path.join(runDir, traceJsonName), `${JSON.stringify(trace, null, 2)}\n`);
fs.writeFileSync(path.join(runDir, auditJsonName), `${JSON.stringify(audit, null, 2)}\n`);
fs.writeFileSync(path.join(runDir, traceMarkdownName), renderMarkdown(session, trace, audit));

  if (!audit.clearedMain7 || (outputTag && !audit.reachedBoss) || audit.missingFiles.length || audit.invalidCanonicalKnowledge.length || audit.decisionResponsesOutsideAllowedActions.length || audit.responseSessionMismatches.length) {
  process.exitCode = 1;
}

console.log(JSON.stringify({
  clearedMain7: audit.clearedMain7,
  reachedBoss: audit.reachedBoss,
  clearedBoss: audit.clearedBoss,
  bossAttempts: audit.bossAttempts,
  cycles: audit.completedCycles,
  knowledge: audit.canonicalKnowledgeCount,
  missingFiles: audit.missingFiles,
  invalidCanonicalKnowledge: audit.invalidCanonicalKnowledge,
  traceFile: path.join(runDir, traceMarkdownName),
}, null, 2));

function renderMarkdown(currentSession, rows, currentAudit) {
  const lines = [
    `# ${currentAudit.reachedBoss ? "主线1至Boss" : "主线1至7"}真实认知循环追踪`,
    "",
    `- seed: \`${currentSession.seed}\``,
    `- 完成行为: ${currentSession.cycle} 次`,
    `- 停止位置: \`${currentSession.phase}\`（${currentSession.cycle} 次行为与归因均已结束）`,
    `- 第7关通过: ${currentAudit.clearedMain7 ? "是" : "否"}`,
    `- Boss到达: ${currentAudit.reachedBoss ? "是" : "否"}，挑战 ${currentAudit.bossAttempts} 次，通过: ${currentAudit.clearedBoss ? "是" : "否"}`,
    `- 最终情绪: ${round(currentSession.cognitionState.emotion.value)}，最低情绪: ${round(currentSession.cognitionState.emotion.minimum)}`,
    `- 最终知识: ${currentSession.knowledgeBase.length} 条`,
    "",
    "## 真实性边界",
    "",
    "- 每次 decision/attribution 请求都由运行时代码根据当时状态生成。",
    "- 外部玩家agent逐次读取请求并新写响应；没有调用旧响应或复制旧会话。",
    "- 战斗胜负、战报、掉落、情绪、知识更新和概念解释均由仓库运行时代码计算。",
    "- AI/助手只选择允许的行为并提供证据约束的归因，不能填写胜负、掉落或情绪。",
    "- 归因证据必须属于所选知识；跨知识混写的归因会被校验器拒绝，修正后才能写入会话。",
    "",
    "## 逐行为记录",
    "",
  ];

  for (const row of rows) {
    lines.push(`### ${row.cycle}. ${row.action} -> ${row.outcome}`);
    lines.push("");
    lines.push(`- 情绪: ${round(row.emotionBefore)} -> ${round(row.emotionAfter)}（自动变化 ${signed(row.automaticEmotionDelta)}）`);
    lines.push(`- 新增知识: ${formatKnowledgeList(row.addedKnowledge, "新增")}`);
    lines.push(`- 更新知识: ${formatKnowledgeList(row.updatedKnowledge, "更新")}`);
    lines.push(`- 匹配概念: ${formatConceptMatches(row.matchedConcepts)}`);
    lines.push(`- 新建概念: ${row.addedConcepts.length ? row.addedConcepts.map((item) => item.label || item.id).join("；") : "无"}`);
    lines.push(`- 候选概念变化: ${formatCandidates(row.changedConceptCandidates)}`);
    lines.push(`- 概念库改变: ${row.conceptLibraryChanged ? "是" : "否"}`);
    lines.push(`- AI归因: ${row.attribution?.cause || "无"}`);
    lines.push("");
  }

  lines.push("## 最终概念状态", "");
  const concepts = Object.values(currentSession.conceptState?.concepts || {});
  const candidates = Object.values(currentSession.conceptState?.candidates || {});
  lines.push(`- 正式概念: ${concepts.map((item) => `${item.label || item.id}（${item.id}）`).join("；") || "无"}`);
  lines.push(`- 候选概念: ${candidates.map((item) => `${item.id} / 证据${item.evidenceCount} / ${item.status}`).join("；") || "无"}`);
  lines.push("- 本轮没有自动批准任何新概念；治疗、治疗+护盾、护盾仍保留为候选。", "");
  lines.push("## 审计", "");
  lines.push(`- 行为分布: ${JSON.stringify(currentAudit.actionCounts)}`);
  lines.push(`- 换人行为: ${currentAudit.teamSwapActions.length ? JSON.stringify(currentAudit.teamSwapActions) : "无"}`);
  lines.push(`- 角色解锁: ${currentAudit.characterUnlocks.length ? JSON.stringify(currentAudit.characterUnlocks) : "无"}`);
  lines.push(`- 法师换入轮次: ${currentAudit.mageSwapActions.length ? currentAudit.mageSwapActions.join("、") : "无"}`);
  lines.push(`- 游侠换入轮次: ${currentAudit.rangerSwapActions.length ? currentAudit.rangerSwapActions.join("、") : "无"}`);
  lines.push(`- 新角色战斗验证: ${currentAudit.characterExperimentResults.length ? JSON.stringify(currentAudit.characterExperimentResults) : "无"}`);
  lines.push(`- 主线1进场: ${currentAudit.main1WaveSummary.length ? currentAudit.main1WaveSummary.map((row) => `${row.unitCount}人@${row.time}s`).join("；") : "非波次或无记录"}`);
  lines.push(`- ${currentAudit.requiredFileCount}个请求/响应文件缺失: ${currentAudit.missingFiles.length ? currentAudit.missingFiles.join("、") : "无"}`);
  lines.push(`- 行为都有知识/概念增量: ${currentAudit.historyRowsWithLearningDelta}/${currentSession.cycle}`);
  lines.push(`- 行为都有原始日志和概念解释后日志: ${currentAudit.historyRowsWithRawAndSemanticLogs}/${currentSession.cycle}`);
  lines.push(`- 结构不完整的主体-环境-行为-结果知识: ${currentAudit.invalidCanonicalKnowledge.length ? currentAudit.invalidCanonicalKnowledge.join("、") : "无"}`);
  lines.push(`- 掉落后自动增加已装备战力的错误知识: ${currentAudit.lootKnowledgeThatChangedEquippedPower.length ? currentAudit.lootKnowledgeThatChangedEquippedPower.join("、") : "无"}`);
  lines.push(`- 越过当步允许行为列表的决策: ${currentAudit.decisionResponsesOutsideAllowedActions.length ? JSON.stringify(currentAudit.decisionResponsesOutsideAllowedActions) : "无"}`);
  lines.push(`- 响应文件与会话内决策不一致: ${currentAudit.responseSessionMismatches.length ? JSON.stringify(currentAudit.responseSessionMismatches) : "无"}`);
  lines.push(`- 与其他旧运行目录完全同哈希的响应: ${currentAudit.responseHashMatchesOutsideRun.length ? JSON.stringify(currentAudit.responseHashMatchesOutsideRun) : "无"}`);
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function formatKnowledgeList(items, mode) {
  if (!items.length) return "无";
  return items.map((item) => {
    const subject = item.subject?.name || item.subject?.id || "未知主体";
    const environment = item.environment?.node || item.environment?.encounterBand || item.environment?.phase || "未知环境";
    const behavior = item.behavior?.kind || "未知行为";
    const result = describeResult(item.latestResult || item.result?.observations?.at(-1));
    const sample = item.sampleCount ? `，样本${item.previousSampleCount || 0}->${item.sampleCount}` : "";
    return `${item.id} ${mode}：[${subject} / ${environment} / ${behavior} / ${result}${sample}]`;
  }).join("；");
}

function describeResult(result = {}) {
  if (result.outcome === "win" && result.unlockedNodes) return `解锁${result.unlockedNodes.join("、")}`;
  if (result.outcome === "win" || result.outcome === "loss") {
    return `${result.outcome}，${round(result.duration)}秒，我方${result.survivors?.player ?? "?"}存活/敌方${result.survivors?.enemy ?? "?"}存活`;
  }
  if (result.outcome === "loot_obtained") return `掉落${result.drops?.map((item) => item.name).join("、") || "无"}，装备战力未自动改变=${!result.powerChanged}`;
  if (result.outcome === "item_equipped") return `装备${result.item?.name}，战力${result.equippedPowerBefore}->${result.equippedPowerAfter}`;
  if (result.outcome === "team_changed") return `队伍变化：${result.before?.join("+")} -> ${result.after?.join("+")}`;
  if (result.outcome === "combat_contribution") return `伤害${round(result.damage)}，占比${round(result.damageShare * 100)}%，治疗${round(result.healing)}，护盾${round(result.shielding)}`;
  if (result.outcome === "damage_profile") return `总伤害${round(result.totalDamage)}，命中${result.hitCount}，击杀${result.killCount}`;
  if (result.outcome === "threat_profile") return `主要${result.dominantDamage}伤害，敌方存活${result.enemySurvivorCount}`;
  if (result.outcome === "enemy_concept_threat") return `伤害${round(result.damage)}，治疗${round(result.healing)}，护盾${round(result.shielding)}，击杀${result.kills}`;
  return JSON.stringify(result);
}

function formatConceptMatches(items) {
  if (!items.length) return "无";
  return items.map((item) => `${item.label || item.conceptId} x${item.observedEntityCount}`).join("；");
}

function formatCandidates(items) {
  if (!items.length) return "无";
  return items.map((item) => `${item.id}：证据${item.evidenceCount}，${item.status}`).join("；");
}

function countActions(history) {
  return history.reduce((counts, row) => {
    const kind = String(row.action || "unknown").split(":")[0];
    counts[kind] = (counts[kind] || 0) + 1;
    return counts;
  }, {});
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectOutsideResponseHashes(root, excludedDir) {
  const result = new Map();
  const stack = [root];
  while (stack.length) {
    const current = stack.pop();
    if (path.resolve(current) === path.resolve(excludedDir)) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const filePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(filePath);
      } else if (entry.isFile() && /(?:decision|attribution)-\d+-response\.json$/.test(entry.name)) {
        const hash = sha256(fs.readFileSync(filePath));
        if (!result.has(hash)) result.set(hash, []);
        result.get(hash).push(path.relative(root, filePath));
      }
    }
  }
  return result;
}

function round(value) {
  return Number.isFinite(Number(value)) ? Math.round(Number(value) * 10000) / 10000 : value;
}

function signed(value) {
  const rounded = round(value);
  return Number(rounded) >= 0 ? `+${rounded}` : String(rounded);
}
