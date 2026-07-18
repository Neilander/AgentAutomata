const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const LOOP = require("./player-agent-loop");
const COMPACT = require("./compact-request");

function buildValidationRequests() {
  let session = LOOP.createSession("formal-cognition-agent-validation", 3, {
    profileId: "open_novice",
    perceptionProfile: "ordinary",
  });
  session = LOOP.applyDecisionResponse(session, {
    action: "challenge:r1_main_1",
    goalId: "grow_and_progress",
    reasoningChain: [{ kind: "evidence", evidence: "推进当前唯一开放的主线关卡。" }],
    alternatives: [],
    hypothesis: null,
  });
  const encounter = session.knowledgeBase.find((row) => row.behavior.kind === "challenge_level");
  assert(encounter);
  session = LOOP.applyAttributionResponse(session, {
    knowledgeId: encounter.id,
    primaryCause: "当前四人阵型完成了这次可见战斗。",
    confidence: 0.9,
    evidenceEventIds: encounter.evidenceEventIds.slice(-1),
    alternativeCauses: [],
    nextTest: "",
  });

  session.gameState.inventory = [];
  const historicalEncounter = session.knowledgeBase.find((row) => row.behavior.kind === "challenge_level");
  historicalEncounter.key = historicalEncounter.key.replaceAll("r1_main_1", "r1_main_2");
  historicalEncounter.environment.node = "r1_main_2";
  historicalEncounter.behavior.key = "challenge:r1_main_2";
  historicalEncounter.behavior.target = "r1_main_2";
  historicalEncounter.result.outcomeDistribution = { loss: 1 };
  const historicalObservation = historicalEncounter.result.observations.at(-1);
  historicalObservation.outcome = "loss";
  historicalObservation.performanceScore = -0.35;
  historicalObservation.survivors = { player: 0, enemy: 2 };
  for (const member of historicalObservation.teamCognitionSnapshot) {
    member.cognitionScaleBoundaryPosition = 0;
    member.cognitionRelativeToScale = member.cognitionMatrixPosition;
  }
  const historicalWarrior = historicalObservation.teamCognitionSnapshot
    .find((member) => member.id === "hero_warrior");
  historicalWarrior.cognitionMatrixPosition = -2.2;
  historicalWarrior.cognitionScaleBoundaryPosition = 0;
  historicalWarrior.cognitionRelativeToScale = -2.2;
  historicalWarrior.cognitionLevel = -2;
  historicalWarrior.cognitionLabel = "明显偏弱";
  historicalWarrior.cognitionInTopThirtyPercent = false;
  const snapshotById = new Map(
    historicalObservation.teamCognitionSnapshot.map((member) => [member.id, member]),
  );
  for (const member of historicalEncounter.subject.members) {
    Object.assign(member, snapshotById.get(member.id));
  }
  session.cognitionState.failureMemories = [{
    id: "failure:controlled-cognition-change",
    node: "r1_main_2",
    key: historicalEncounter.key,
    resolved: false,
    summary: "同一阵型过去在主线2失败过，但当时角色认知与现在不同。",
  }];

  const request = LOOP.getPendingRequest(session);
  const eligibleActions = [
    "challenge:r1_main_2",
    "swap:0:militia_drum",
  ].filter((action) => request.observation.allowedActions.includes(action));
  assert.deepEqual(eligibleActions, ["challenge:r1_main_2", "swap:0:militia_drum"]);
  request.controller = {
    validation: "只比较利用历史认知变化重试，与换入一个从未战斗过的未知民兵。",
    eligibleActions,
  };
  request.instruction += " For this controlled validation, choose only one controller.eligibleActions value. The reserve militia has no battle evidence; do not invent its strength. If the historical cognition coordinates matter, cite the exact past and current relative-to-scale values in reasoning.";
  request.observation.allowedActions = eligibleActions;
  request.playerState.rosterChangeExpectations.actions = (
    request.playerState.rosterChangeExpectations.actions || []
  ).filter((row) => eligibleActions.includes(row.action));

  const full = COMPACT.compactDecision(request);
  const retrievedEncounter = full.playerState.knowledge.find((row) => (
    row.behavior?.kind === "challenge_level"
      && row.environment?.node === "r1_main_2"
  ));
  assert(retrievedEncounter);
  assert(retrievedEncounter.playerReadableFact.includes("当时前30%标尺"));
  assert.equal(retrievedEncounter.result.latestObservation.teamCognitionSnapshot.length, 4);
  const currentWarrior = full.playerState.characterImpressions.find((row) => (
    row.subject?.id === "hero_warrior"
  ));
  assert(currentWarrior.relativeToTopThirtyBoundary > 0);

  const ablated = structuredClone(full);
  ablated.controller.validation = "对照组：历史阵容和结果保留，但删除当时角色认知坐标。";
  ablated.instruction = ablated.instruction
    .replace("If the historical cognition coordinates matter, cite the exact past and current relative-to-scale values in reasoning.", "The historical cognition coordinates are unavailable in this control request; do not invent them.");
  const ablatedEncounter = ablated.playerState.knowledge.find((row) => (
    row.behavior?.kind === "challenge_level"
      && row.environment?.node === "r1_main_2"
  ));
  delete ablatedEncounter.playerReadableFact;
  for (const member of ablatedEncounter.subject?.members || []) stripCognition(member);
  for (const member of ablatedEncounter.result?.latestObservation?.teamCognitionSnapshot || []) {
    stripCognition(member);
  }

  return {
    session,
    full,
    ablated,
    audit: {
      formalKnowledgeCount: session.knowledgeBase.length,
      formalRouterSchema: session.history[0].receivedInformation.schema,
      formalPublicEvidenceOnly: session.knowledgeBase.every((row) => (
        row.evidenceEventIds.every((id) => id.startsWith("battle_signal:"))
      )),
      currentWarriorRelativeToScale: currentWarrior.relativeToTopThirtyBoundary,
      historicalWarriorRelativeToScale: historicalWarrior.cognitionRelativeToScale,
      eligibleActions,
    },
  };
}

function stripCognition(member) {
  for (const key of [
    "cognitionMatrixPosition",
    "cognitionScaleBoundaryPosition",
    "cognitionRelativeToScale",
    "cognitionLevel",
    "cognitionLabel",
    "cognitionInTopThirtyPercent",
    "cognitionEvidenceCount",
  ]) delete member[key];
}

function writeValidation(outputDirectory) {
  const output = buildValidationRequests();
  fs.mkdirSync(outputDirectory, { recursive: true });
  writeJson(path.join(outputDirectory, "full-request.json"), output.full);
  writeJson(path.join(outputDirectory, "ablated-request.json"), output.ablated);
  writeJson(path.join(outputDirectory, "audit.json"), output.audit);
  return output.audit;
}

function writeJson(target, value) {
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}

if (require.main === module) {
  const outputDirectory = path.resolve(
    process.argv[2]
      || path.join(
        __dirname,
        "..",
        "..",
        ".local_run_archive",
        "player_agent_api_loop_v1",
        "formal-cognition-agent-validation",
      ),
  );
  process.stdout.write(`${JSON.stringify(writeValidation(outputDirectory), null, 2)}\n`);
}

module.exports = { buildValidationRequests, writeValidation };
