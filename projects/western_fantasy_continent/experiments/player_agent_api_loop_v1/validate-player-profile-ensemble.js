const assert = require("node:assert/strict");
const ENSEMBLE = require("./player-profile-ensemble");
const PROFILES = require("./player-profiles");

assert.equal(PROFILES.listPlayerProfiles().length, 10);

const selectedA = PROFILES.selectPlayerProfiles({ profileCount: 2, selectionSeed: "paired-profile-test" });
const selectedB = PROFILES.selectPlayerProfiles({ profileCount: 2, selectionSeed: "paired-profile-test" });
assert.deepEqual(selectedA.map((row) => row.id), selectedB.map((row) => row.id));
assert.equal(new Set(selectedA.map((row) => row.id)).size, 2);

let ensemble = ENSEMBLE.createEnsemble({
  seed: "two-profile-two-cycle",
  maxCycles: 2,
  profileIds: ["damage_absolutist", "safety_conservative"],
});

assert.deepEqual(ensemble.selectedProfileIds, ["damage_absolutist", "safety_conservative"]);
assert.equal(new Set(ensemble.runs.map((run) => run.session.agentContext.id)).size, 2);
assert.deepEqual(
  ensemble.runs.map((run) => run.session.gameState),
  [ensemble.runs[0].session.gameState, ensemble.runs[0].session.gameState],
  "paired profiles must start from the same game state",
);

for (let cycle = 0; cycle < 2; cycle += 1) {
  const decisionRequests = ENSEMBLE.getPendingRequests(ensemble);
  assert.equal(decisionRequests.length, 2);
  for (const { profileId, request } of decisionRequests) {
    assert.equal(request.type, "decision");
    assert.equal(request.playerProfile.profileId, profileId);
    assert.equal(request.playerProfile.priorBeliefs.every((row) => row.status === "unverified_prior"), true);
    const action = request.observation.allowedActions[0];
    ensemble = ENSEMBLE.applyDecisionResponse(ensemble, profileId, {
      action,
      goalId: request.playerState.activeGoalId,
      reasoningChain: [{ kind: "affordance", evidence: `The game exposes ${action}.` }],
      alternatives: request.observation.allowedActions.slice(1, 2),
      hypothesis: null,
    });
  }

  const attributionRequests = ENSEMBLE.getPendingRequests(ensemble);
  for (const { profileId, request } of attributionRequests) {
    assert.equal(request.type, "attribution");
    assert.equal(request.playerProfile.profileId, profileId);
    const visibleIds = new Set(request.visibleEvents.map((event) => event.id));
    const knowledge = request.existingKnowledge.find((row) =>
      row.evidenceEventIds.some((eventId) => visibleIds.has(eventId))
    );
    assert.ok(knowledge, "attribution must have evidence-bound knowledge");
    const evidenceEventId = knowledge.evidenceEventIds.find((eventId) => visibleIds.has(eventId));
    ensemble = ENSEMBLE.applyAttributionResponse(ensemble, profileId, {
      knowledgeId: knowledge.id,
      primaryCause: "The cited game event produced this recorded result.",
      confidence: 0.7,
      evidenceEventIds: [evidenceEventId],
      alternativeCauses: [],
      nextTest: "",
    });
  }
}

for (const run of ensemble.runs) {
  assert.equal(run.session.phase, "complete");
  assert.equal(run.session.cycle, 2);
  assert.equal(run.session.playerProfile.profileId, run.profileId);
  assert.equal(run.session.playerProfile.priorBeliefs.every((row) => row.status === "unverified_prior"), true);
}

console.log(JSON.stringify({
  result: "PASS",
  registrySize: PROFILES.listPlayerProfiles().length,
  deterministicCountSelection: selectedA.map((row) => row.id),
  exactSelection: ensemble.selectedProfileIds,
  independentAgentContexts: ensemble.runs.map((run) => run.session.agentContext.id),
  completedCycles: Object.fromEntries(ensemble.runs.map((run) => [run.profileId, run.session.cycle])),
}, null, 2));
