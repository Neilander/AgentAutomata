const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const RETRIEVAL = require("./knowledge-retrieval");

const ROOT = path.resolve(__dirname);
const fixtures = [
  {
    chapter: 1,
    file: path.join(ROOT, "real_main7_run_2026-07-13_170746", "session.json"),
    slices: [
      slice(2, "first_loot_equip", [
        required("loot_requires_manual_equip", (row) => row.environment?.phase === "loot_drop" && latest(row).powerChanged === false),
      ]),
      slice(16, "failure_then_frontline_equip", [
        required("failed_main6", (row) => row.environment?.node === "r1_main_6" && Number(row.result?.outcomeDistribution?.loss || 0) > 0),
        required("frontline_item_equipped", (row) => row.behavior?.kind === "equip_item" && row.behavior?.target === "militia_barricade"),
      ]),
      slice(19, "targeted_bandit_key_retry", [
        required("main6_failure_memory", (row) => row.environment?.node === "r1_main_6" && Number(row.result?.outcomeDistribution?.loss || 0) > 0),
        required("warrior_key_equipped", (row) => row.behavior?.kind === "equip_item" && row.behavior?.target === "hero_warrior"),
      ]),
      slice(28, "chapter1_boss_attempt", [
        required("main10_progress", (row) => row.environment?.node === "r1_main_10" && ["win", "nodes_unlocked"].includes(latest(row).outcome)),
      ]),
    ],
  },
  {
    chapter: 2,
    file: path.join(ROOT, "chapter2_iterations", "2026-07-14_2230", "player_e", "session.json"),
    slices: [
      slice(4, "knight_roster_decision", [
        required("knight_unlock", (row) => JSON.stringify(row).includes("hero_knight") && row.environment?.phase === "character_reward"),
      ]),
      slice(7, "priest_roster_decision", [
        required("priest_unlock", (row) => JSON.stringify(row).includes("hero_priest") && row.environment?.phase === "character_reward"),
      ]),
      slice(10, "shield_trial", [
        required("knight_shield_contribution", (row) => row.subject?.id === "hero_knight" && Number(latest(row).shielding || 0) > 0),
        required("priest_heal_contribution", (row) => row.subject?.id === "hero_priest" && Number(latest(row).healing || 0) > 0),
      ]),
      slice(11, "flag_trial", [
        required("priest_heal_contribution", (row) => row.subject?.id === "hero_priest" && Number(latest(row).healing || 0) > 0),
      ]),
      slice(15, "first_epic_equip", [
        required("equipment_causality", (row) => row.behavior?.kind === "equip_item" || latest(row).outcome === "loot_obtained"),
      ]),
      slice(16, "chapter2_boss", [
        required("king_flag_rule", (row) => row.subject?.id === "field:king_flag"),
        required("epic_on_mage", (row) => row.behavior?.kind === "equip_item" && row.behavior?.target === "hero_mage" && JSON.stringify(row).includes("r2_first_epic")),
      ]),
    ],
  },
];

const results = [];
for (const fixture of fixtures) {
  const session = JSON.parse(fs.readFileSync(fixture.file, "utf8"));
  for (const definition of fixture.slices) {
    const index = session.history.findIndex((row) => row.cycle === definition.cycle);
    assert(index >= 0, `missing cycle ${definition.cycle}`);
    const request = session.history[index].decisionRequest;
    const fullKnowledge = request.playerState.knowledge;
    const beforeHash = hash(fullKnowledge);
    const retrieval = RETRIEVAL.retrieveKnowledge({
      knowledgeBase: fullKnowledge,
      observation: request.observation,
      goals: request.playerState.goals,
      failureMemories: request.playerState.failureMemories,
      hypotheses: request.playerState.hypotheses,
      history: session.history.slice(0, index),
    });
    assert.equal(hash(fullKnowledge), beforeHash, "retrieval mutated the full knowledge store");
    assert(retrieval.knowledge.length <= RETRIEVAL.DEFAULT_LIMIT, "retrieval exceeded row limit");
    assert.equal(retrieval.audit.missedRequired.length, 0, `runtime required checks missed: ${retrieval.audit.missedRequired.join(",")}`);
    const selectedIds = new Set(retrieval.knowledge.map((row) => row.id));
    const checks = definition.required.map((check) => {
      const candidates = fullKnowledge.filter(check.predicate).map((row) => row.id);
      assert(candidates.length, `${definition.name} fixture has no source knowledge for ${check.id}`);
      const selected = candidates.some((id) => selectedIds.has(id));
      assert(selected, `${definition.name} missed semantic requirement ${check.id}; candidates=${candidates.join(",")}`);
      return { id: check.id, candidates, selected };
    });
    const fullRequestBytes = bytes(request);
    const compactRequest = structuredClone(request);
    compactRequest.schema = "player_decision_request_v2_slice_validation";
    compactRequest.playerState.knowledge = retrieval.knowledge;
    compactRequest.playerState.knowledgeStoreCount = fullKnowledge.length;
    compactRequest.knowledgeRetrieval = retrieval.audit;
    const compactBytes = bytes(compactRequest);
    assert.deepEqual(compactRequest.observation, request.observation, "retrieval changed observation or legal actions");
    assert.equal(compactRequest.playerState.emotion, request.playerState.emotion, "retrieval changed emotion");
    results.push({
      chapter: fixture.chapter,
      cycle: definition.cycle,
      slice: definition.name,
      actionChosen: session.history[index].action,
      fullKnowledgeRows: fullKnowledge.length,
      selectedKnowledgeRows: retrieval.knowledge.length,
      fullRequestBytes,
      compactRequestBytes: compactBytes,
      requestReductionRatio: round(1 - compactBytes / fullRequestBytes),
      knowledgeReductionRatio: retrieval.audit.byteReductionRatio,
      semanticChecks: checks,
      selected: retrieval.audit.selected,
    });
  }
}

const summary = {
  result: "PASS",
  schema: "knowledge_retrieval_slice_validation_v1",
  slices: results.length,
  semanticChecks: results.reduce((sum, row) => sum + row.semanticChecks.length, 0),
  averageRequestReductionRatio: round(results.reduce((sum, row) => sum + row.requestReductionRatio, 0) / results.length),
  minimumRequestReductionRatio: round(Math.min(...results.map((row) => row.requestReductionRatio))),
  maximumSelectedRows: Math.max(...results.map((row) => row.selectedKnowledgeRows)),
  results,
};

const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (outputPath) fs.writeFileSync(outputPath, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

function slice(cycle, name, requiredChecks) { return { cycle, name, required: requiredChecks }; }
function required(id, predicate) { return { id, predicate }; }
function latest(row) { return row.result?.observations?.at?.(-1) || row.result?.latestObservation || {}; }
function bytes(value) { return Buffer.byteLength(JSON.stringify(value), "utf8"); }
function hash(value) { return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
function round(value) { return Number(Number(value || 0).toFixed(4)); }
