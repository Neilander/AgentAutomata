"use strict";

const fs = require("node:fs");
const path = require("node:path");
const publicMap = require("../under_falling_skies_planning_mind_toy_v0/standard_rules_v1/fixtures/roswell-threat-0-map");
const { UfsOneRoundSession } = require("../ufs_first_action_imagination_v0/ufs-one-round-session");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, name), "utf8"));
}

function compactStepAttention(trace) {
  const attention = trace?.placementRules?.attention;
  const perception = trace?.perception;
  return {
    mode: attention?.mode || trace?.attention?.mode || null,
    fullSpaceItemCount: attention?.fullSpaceItemCount ?? perception?.fullSpaceItemCount ?? null,
    noticedCount: attention?.fullNoticedItemIds?.length ?? perception?.capacity ?? null,
    omittedCount: attention?.fullOmittedItemIds?.length ?? perception?.omittedItemIds?.length ?? null,
    carriedCount: attention?.fullCarryoverAppliedItemIds?.length
      ?? attention?.carryoverAppliedItemIds?.length
      ?? perception?.carryoverAppliedItemIds?.length
      ?? 0,
  };
}

function runExperiment() {
  const initialPublicState = readJson("public_initial_state.json");
  const decisions = readJson("agent_decisions.json");
  const random = readJson("external_random_observations.json");
  const session = new UfsOneRoundSession({ publicMap });
  const interactions = [];
  let response = session.start({
    initialPublicState,
    attentionSeed: decisions.attentionSeed,
  });
  interactions.push({ kind: "start", response: compactResponse(response) });
  for (const row of decisions.placements) {
    response = session.advance({ type: "place_die", dieId: row.dieId, cellId: row.cellId });
    interactions.push({ cardId: row.cardId, response: compactResponse(response) });
    if (response.status === "random") {
      const values = random.observations[`after:${response.pending.afterDieId}`];
      response = session.advance({ type: "submit_random_observation", values });
      interactions.push({ kind: "external_random_observation", response: compactResponse(response) });
    }
  }
  for (const { cardId, ...action } of decisions.roomActions) {
    response = session.advance(action);
    interactions.push({ cardId, response: compactResponse(response) });
  }
  while (response.status === "choice" && response.pending?.type === "spawn") {
    const choice = decisions.spawnChoices[response.pending.shipId];
    response = session.advance({
      type: "choose_spawn",
      shipId: response.pending.shipId,
      dropPointId: choice.dropPointId,
    });
    interactions.push({ cardId: choice.cardId, response: compactResponse(response) });
  }
  const result = session.inspectRuntimeResult();
  const choiceReplay = {
    placementCards: decisions.placements.map((row, index) => ({
      cardId: row.cardId,
      action: `${row.dieId}@${row.cellId}`,
      runtimeStatus: result.trace.placements[index]?.status || null,
      attention: compactStepAttention(result.trace.placements[index]?.cognitiveTrace),
    })),
    roomCards: decisions.roomActions.map((row) => ({
      cardId: row.cardId,
      action: row.type,
      target: row.roomId || row.placementId || null,
    })),
    spawnCards: result.trace.mothershipSteps.filter((row) => row.stage === "spawn").map((row) => ({
      cardId: decisions.spawnChoices[row.shipId]?.cardId || null,
      shipId: row.shipId,
      candidates: row.patch?.candidateDropPointIds || [],
      chosen: row.chosenDropPointId,
      status: row.status,
      attention: compactStepAttention(row.cognitiveTrace),
    })),
  };
  return {
    schema: "ufs_autonomous_round_agent_experiment_result_v0",
    protocol: {
      decisionOrigin: decisions.decisionAuthor,
      cognitionUsesFormalEngine: false,
      importsFixedOneRoundFixture: false,
      randomBoundary: "external_public_observation_only",
      controlAdapter: "each decision is submitted through start/advance and receives a new observation before the next operation",
    },
    status: result.status,
    reason: result.reason,
    pending: result.pending,
    observedWorldUnchanged: result.observedWorldUnchanged,
    interactions,
    choiceReplay,
    summary: {
      attentionStops: [
        ...result.trace.placements,
        ...result.trace.randomBoundaries,
        ...result.trace.roomSteps,
        ...result.trace.mothershipSteps,
      ].filter((row) => row.status === "attention_stop").length,
      unknownStops: [
        ...result.trace.placements,
        ...result.trace.randomBoundaries,
        ...result.trace.roomSteps,
        ...result.trace.mothershipSteps,
      ].filter((row) => row.status === "unknown").length,
      randomBoundaries: result.trace.randomBoundaries.map((row) => ({
        afterDieId: row.afterDieId,
        requestedDieIds: row.patch?.dieIds || [],
        resumedBy: row.resumedBy,
      })),
      cognitiveSteps: {
        placements: result.trace.placements.length,
        random: result.trace.randomBoundaries.length,
        room: result.trace.roomSteps.length,
        mothership: result.trace.mothershipSteps.length,
      },
      final: {
        phase: result.imaginedWorld.phase,
        energy: result.imaginedWorld.energy,
        damage: result.imaginedWorld.damage,
        researchIndex: result.imaginedWorld.researchIndex,
        excavatorIndex: result.imaginedWorld.excavatorIndex,
        mothershipRow: result.imaginedWorld.mothershipRow,
        ships: result.imaginedWorld.ships,
      },
    },
    cognitiveResult: result,
  };
}

function compactResponse(response) {
  return {
    status: response.status,
    reason: response.reason,
    phase: response.observation?.phase || null,
    pending: response.pending,
    availableOperations: response.availableOperations,
    actionCount: response.actionCount,
  };
}

if (require.main === module) {
  const result = runExperiment();
  if (process.argv.includes("--write")) {
    fs.writeFileSync(path.join(__dirname, "machine-trace.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify({
    status: result.status,
    reason: result.reason,
    choiceReplay: result.choiceReplay,
    summary: result.summary,
  }, null, 2));
}

module.exports = { runExperiment };
