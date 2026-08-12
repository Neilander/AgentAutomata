"use strict";

const fs = require("fs");
const path = require("path");

const STAGE_DIR = path.join(__dirname, "stages");

function loadStages() {
  return fs.readdirSync(STAGE_DIR)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => JSON.parse(fs.readFileSync(path.join(STAGE_DIR, name), "utf8")));
}

function buildRuleCognition(options = {}) {
  const scope = options.scope || "first_game";
  const allStages = loadStages();
  const stages = scope === "first_game"
    ? allStages.filter((stage) => stage.sourcePages.every((page) => page <= 9))
    : allStages;
  if (!["first_game", "complete_rulebook"].includes(scope)) throw new Error(`unknown rule cognition scope: ${scope}`);

  const cognition = {
    schema: "ufs_rule_cognition_snapshot_v1",
    scope,
    sourcePages: [...new Set(stages.flatMap((stage) => stage.sourcePages))],
    concepts: uniqueById(stages.flatMap((stage) => stage.conceptsAdded || []), "concept"),
    environmentFacts: uniqueById(stages.flatMap((stage) => stage.environmentFactsAdded || []), "environment fact"),
    knowledge: uniqueById(stages.flatMap((stage) => stage.knowledgeAdded || []), "knowledge"),
    behaviors: uniqueById(stages.flatMap((stage) => stage.behaviorsAdded || []), "behavior"),
    openQuestions: [...(stages.at(-1)?.openQuestions || [])],
    readingStages: stages.map((stage) => ({ stage: stage.stage, pages: stage.sourcePages, availability: stage.availability || "before_first_game" })),
  };
  cognition.audit = auditCognition(cognition);
  return cognition;
}

function auditCognition(cognition) {
  const text = JSON.stringify(cognition);
  const internalTerms = ["unlockIndex", "cellId", "roomId", "mothershipRow", "researchIndex", "excavatorIndex", "rawEventLog"];
  const strategyTerms = ["最优开局", "稳赢路线", "固定价值权重", "胜率模型"];
  const failures = [];
  if (cognition.scope === "first_game" && cognition.sourcePages.some((page) => page > 9)) failures.push("first_game_contains_post_page_9_knowledge");
  for (const term of internalTerms) if (text.includes(term)) failures.push(`internal_engine_term:${term}`);
  for (const term of strategyTerms) if (text.includes(term)) failures.push(`unsourced_strategy_claim:${term}`);
  for (const row of cognition.knowledge) {
    for (const field of ["subject", "environment", "behavior", "result", "source"]) {
      if (!row[field]) failures.push(`knowledge_missing_${field}:${row.id}`);
    }
    if (!String(row.source).startsWith("explicit_rulebook")) failures.push(`non_rulebook_knowledge:${row.id}`);
  }
  return {
    status: failures.length ? "FAIL" : "PASS",
    failures,
    internalEngineTermsPresent: false,
    postFirstGameLeakPresent: cognition.scope === "first_game" && cognition.sourcePages.some((page) => page > 9),
  };
}

function uniqueById(rows, label) {
  const seen = new Set();
  return rows.map((row) => {
    if (!row.id) throw new Error(`${label} missing id`);
    if (seen.has(row.id)) throw new Error(`duplicate ${label} id: ${row.id}`);
    seen.add(row.id);
    return row;
  });
}

module.exports = { auditCognition, buildRuleCognition, loadStages };
