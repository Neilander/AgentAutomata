"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { allocateAttention } = require("./attention");
const { buildActiveCognition } = require("./active-cognition");
const { createGuessGame, toGuessPlayerView } = require("./guess-game");
const { applyMindToyBuildResponse, createMindToyBuildSession, getMindToyBuildRequest } = require("./mind-toy-builder");

const view = toGuessPlayerView(createGuessGame({ target: 6 }));
const goal = { id: "identify_rune", label: "找出目标符文", concepts: ["符文探测", "候选范围"] };
const attention = allocateAttention({ budget: 2, goal, signals: view.visibleSignals });
const active = buildActiveCognition({
  playerView: view, goal, attentionResult: attention,
  retrievalResult: { selected: [], attentionSpent: 0, attentionRemaining: attention.remaining },
  attentionCapacity: 2,
  knownRules: view.publicRules.map((row) => ({ ...row, activated: true })),
});
const session = createMindToyBuildSession({
  activeCognition: active,
  adequacyContract: { minimumReferencedActions: 1, requiredStructureTokens: ["current_candidates"], allowedModels: ["state_transition"] },
});
const request = getMindToyBuildRequest(session);
const response = JSON.parse(fs.readFileSync(path.join(__dirname, "reviewed-ai-samples", "guess-turn0-build.json"), "utf8"));
const built = applyMindToyBuildResponse(session, response);

assert.equal(request.allowedEvidenceIds.includes("attention:signal:candidate_range:0/gist"), true);
assert.equal(built.baseSession.buildResponse.selectedModel, "state_transition");
assert.deepEqual(built.adequacyAudit.referencedActions, ["probe:rune_5"]);
assert.equal(JSON.stringify(response).includes("engineOnlyTarget"), false);
assert.equal(response.estimationRequests.every((row) => row.reason && row.resolution?.resolverId), true);
console.log("PASS reviewed current-Codex MindToy sample is grounded, legal, minimal, and estimation-sourced");
