"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { compileQueryVectorsWithGte } = require("../ufs_first_action_imagination_v0/player-feedback-gte");
const { UfsFullAttentionProvider } = require("../ufs_first_action_imagination_v0/ufs-full-attention-provider");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const { UfsOneRoundImagination } = require("../ufs_first_action_imagination_v0/ufs-one-round-imagination");
const { UfsOneRoundSession } = require("../ufs_first_action_imagination_v0/ufs-one-round-session");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const ruleMemory = require("../ufs_first_action_imagination_v0/rule_reading_trajectory_v0/ai_compiled_trajectories.json");
const intent = require("../ufs_single_anchor_multistep_plan_v0/agent-intent.json");
const { buildSingleAnchorPlan } = require("../ufs_single_anchor_multistep_plan_v0/single-anchor-planner");
const { compileActivations } = require("../ufs_single_anchor_multistep_plan_v0/run-single-anchor-plan");
const {
  chooseSecondCutpoint,
  planRoomOrder,
  threatVector,
} = require("./multi-cutpoint-planner");

const HERE = __dirname;
const TOP_K = 6;
const REPLAY_VALUES = Object.freeze([1, 2, 3, 4, 5, 6]);
const PREFIX = Object.freeze([
  Object.freeze({ type: "place_die", dieId: "r1-gray-0", cellId: "A-r2-c4" }),
  Object.freeze({ type: "place_die", dieId: "r1-gray-1", cellId: "A-r2-c5" }),
  Object.freeze({ type: "place_die", dieId: "r1-gray-2", cellId: "A-r2-c2" }),
  Object.freeze({ type: "place_die", dieId: "r1-white-3", cellId: "A-r2-c1" }),
]);

function clone(value) {
  return structuredClone(value);
}

function dot(left, right) {
  let score = 0;
  for (let offset = 0; offset < left.byteLength; offset += 4) {
    score += left.readFloatLE(offset) * right.readFloatLE(offset);
  }
  return Number(score.toFixed(6));
}

function makeFormalSession() {
  return new UfsFullGameAttentionSession({
    publicMap,
    choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
  });
}

function cutpointQ(value) {
  return {
    affected_object: "same-column ships, the last unplaced die, and visible anti-air or tunnel rooms",
    change_trend: `descent amount is pending after the public reroll produced ${value}`,
    cause_relation: "the remaining die can be placed in one of these rooms in the final open base column",
    temporal_state: "ready to happen before the last placement",
    context: "imagined candidate action from the updated public environment",
  };
}

function compileSecondCutpointActivations() {
  const edges = ruleMemory.edges;
  const queries = REPLAY_VALUES.map((value) => ({ value, q: cutpointQ(value) }));
  const specs = edges.map((edge) => ({ key: `edge:${edge.edgeId}`, q: edge.current }))
    .concat(queries.map((row) => ({ key: `query:${row.value}`, q: row.q })));
  const compiled = compileQueryVectorsWithGte(specs.map((row) => row.q));
  const vectors = new Map(specs.map((row, index) => [row.key, compiled.vectors[index].vector]));
  const byValue = {};
  for (const query of queries) {
    byValue[query.value] = edges.map((edge) => ({
      memoryId: edge.edgeId,
      sourceRuleId: edge.sourceRuleId,
      triggeredBy: "q_before",
      triggerSimilarity: dot(
        vectors.get(`query:${query.value}`),
        vectors.get(`edge:${edge.edgeId}`),
      ),
      triggerSideAccepted: false,
      capability: null,
    })).sort((left, right) => right.triggerSimilarity - left.triggerSimilarity
      || left.memoryId.localeCompare(right.memoryId)).slice(0, TOP_K).map((row) => {
      if (row.memoryId === "read-rule-aa-placement-to-reduced-descent") {
        return {
          ...row,
          triggerSideAccepted: true,
          capability: { id: "aa_reduced_descent", roomType: "aa" },
        };
      }
      if (row.memoryId === "read-rule-tunnel-placement-to-no-room-output") {
        return {
          ...row,
          triggerSideAccepted: true,
          capability: { id: "tunnel_no_room_output", roomType: "tunnel" },
        };
      }
      if (row.memoryId === "read-rule-place-die-to-same-column-descent") {
        return {
          ...row,
          triggerSideAccepted: true,
          capability: { id: "same_column_descent", roomType: null },
        };
      }
      return row;
    });
  }
  return { encoder: compiled.encoder, queries, byValue };
}

function apply(session, operation, trace, source) {
  const response = session.advance(operation);
  trace.push({ source, operation: clone(operation), status: response.status, reason: response.reason });
  if (response.status === "rejected") throw new Error(`operation rejected: ${response.reason}`);
  return response;
}

function applyPrefixAndReroll(session, value, trace) {
  let response = session.start({ initialPublicState, attentionSeed: 2026082504 });
  for (const operation of PREFIX) response = apply(session, operation, trace, "first_cutpoint_committed_prefix");
  if (response.status !== "random") throw new Error("white placement did not reach public reroll boundary");
  return apply(session, {
    type: "submit_random_observation",
    values: { "r1-white-4": value },
  }, trace, "shared_public_random_tape");
}

function executeRoomOrderAndSpawns(session, roomOrder, trace, source) {
  let response = null;
  for (const template of roomOrder.operations) {
    const operation = template.advanceSteps === "maximum_available"
      ? { ...template, advanceSteps: response.pending.maxAdvanceSteps }
      : template;
    response = apply(session, operation, trace, source);
  }
  while (response.pending?.type === "spawn") {
    response = apply(session, {
      type: "choose_spawn",
      shipId: response.pending.shipId,
      dropPointId: response.pending.candidates[0],
    }, trace, "shared_first_legal_spawn_policy");
  }
  return response;
}

function cognitiveContinuation({ value, finalPlacement, firstPassPlan }) {
  const session = new UfsOneRoundSession({
    publicMap,
    runtime: new UfsOneRoundImagination({
      attentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
    }),
  });
  let response = session.start({ initialPublicState, attentionSeed: 2026082504 });
  for (const operation of PREFIX) response = session.advance(operation);
  response = session.advance({
    type: "submit_random_observation",
    values: { "r1-white-4": value },
  });
  response = session.advance(finalPlacement);
  const roomOrder = planRoomOrder({
    playerResponse: {
      pending: response.pending,
      observation: response.observation,
      mapView: { rooms: publicMap.base.rooms },
    },
    anchorPackage: firstPassPlan.anchorPackage,
    minimumEnergy: 1,
  });
  for (const template of roomOrder.operations) {
    const operation = template.advanceSteps === "maximum_available"
      ? { ...template, advanceSteps: response.pending.maxAdvanceSteps }
      : template;
    response = session.advance(operation);
    if (response.status === "rejected") throw new Error(`cognitive continuation rejected: ${response.reason}`);
  }
  while (response.pending?.type === "spawn") {
    response = session.advance({
      type: "choose_spawn",
      shipId: response.pending.shipId,
      dropPointId: response.pending.candidates[0],
    });
  }
  const world = session.inspectRuntimeResult().imaginedWorld;
  return {
    status: response.status,
    reason: response.reason,
    world: clone(world),
    threat: threatVector(world),
    roomOrder,
  };
}

function formalOutcome({ value, finalPlacement, firstPassPlan }) {
  const session = makeFormalSession();
  const trace = [];
  let response = applyPrefixAndReroll(session, value, trace);
  response = apply(session, finalPlacement, trace, "second_cutpoint_selected_anchor");
  const roomOrder = planRoomOrder({
    playerResponse: response,
    anchorPackage: firstPassPlan.anchorPackage,
    minimumEnergy: 1,
  });
  response = executeRoomOrderAndSpawns(session, roomOrder, trace, "third_cutpoint_operation_order");
  return {
    trace,
    roomOrder,
    response,
    final: {
      energy: response.observation.energy,
      damage: response.observation.damage,
      researchIndex: response.observation.researchIndex,
      mothershipRow: response.observation.mothershipRow,
      phase: response.observation.phase,
      threat: threatVector(response.observation),
      ships: clone(response.observation.ships),
    },
  };
}

function sameOutcome(left, right) {
  return JSON.stringify({
    energy: left.energy,
    damage: left.damage,
    researchIndex: left.researchIndex,
    mothershipRow: left.mothershipRow,
    threat: left.threat,
  }) === JSON.stringify({
    energy: right.energy,
    damage: right.damage,
    researchIndex: right.researchIndex,
    mothershipRow: right.mothershipRow,
    threat: right.threat,
  });
}

function main() {
  const initialSession = makeFormalSession();
  const initialResponse = initialSession.start({ initialPublicState, attentionSeed: 2026082504 });
  const initialCheckpoint = JSON.stringify(initialSession.exportCheckpoint());
  const firstActivation = compileActivations(initialResponse, intent);
  const firstPassPlan = buildSingleAnchorPlan({
    playerResponse: initialResponse,
    intent,
    intentActivations: firstActivation.intentRows,
    environmentActivations: firstActivation.environmentRows,
  });
  const firstPassReadOnly = JSON.stringify(initialSession.exportCheckpoint()) === initialCheckpoint;
  const secondActivation = compileSecondCutpointActivations();

  const scenarios = REPLAY_VALUES.map((value) => {
    const checkpointSession = makeFormalSession();
    const checkpointTrace = [];
    const checkpointResponse = applyPrefixAndReroll(checkpointSession, value, checkpointTrace);
    const replan = chooseSecondCutpoint({
      playerResponse: checkpointResponse,
      routeActivations: secondActivation.byValue[value],
      imagineCandidate: (payload) => cognitiveContinuation({
        value,
        finalPlacement: payload,
        firstPassPlan,
      }),
    });
    const tunnelPayload = {
      type: "place_die", dieId: "r1-white-4", cellId: "A-r2-c3",
    };
    const aaPayload = {
      type: "place_die", dieId: "r1-white-4", cellId: "A-r1-c3",
    };
    const formalTunnel = formalOutcome({ value, finalPlacement: tunnelPayload, firstPassPlan });
    const formalAa = formalOutcome({ value, finalPlacement: aaPayload, firstPassPlan });
    const selectedFormal = replan.selected.payload.cellId === aaPayload.cellId ? formalAa : formalTunnel;
    const cognitiveByCell = Object.fromEntries(replan.candidates.map((row) => [row.payload.cellId, {
      energy: row.imagined.world.energy,
      damage: row.imagined.world.damage,
      researchIndex: row.imagined.world.researchIndex,
      mothershipRow: row.imagined.world.mothershipRow,
      threat: row.threat,
    }]));
    const benefit = {
      researchDelta: selectedFormal.final.researchIndex - formalTunnel.final.researchIndex,
      energyDelta: selectedFormal.final.energy - formalTunnel.final.energy,
      damageAvoided: formalTunnel.final.damage - selectedFormal.final.damage,
      maximumShipRowReduction: formalTunnel.final.threat.maximumShipRow
        - selectedFormal.final.threat.maximumShipRow,
      totalShipRowsReduction: formalTunnel.final.threat.totalShipRows
        - selectedFormal.final.threat.totalShipRows,
    };
    return {
      rerollValue: value,
      cutpoints: {
        first: {
          triggeredBy: "q_after_and_q_before_union",
          anchorPackage: clone(firstPassPlan.anchorPackage),
        },
        second: replan,
        third: clone(selectedFormal.roomOrder),
      },
      staticSinglePass: formalTunnel.final,
      aaAlternative: formalAa.final,
      multiPassSelected: {
        roomType: replan.selected.roomType,
        cellId: replan.selected.payload.cellId,
        final: selectedFormal.final,
      },
      cognitiveByCell,
      cognitiveMatchesFormal: sameOutcome(cognitiveByCell[tunnelPayload.cellId], formalTunnel.final)
        && sameOutcome(cognitiveByCell[aaPayload.cellId], formalAa.final),
      benefit,
      noFormalRejection: [...formalTunnel.trace, ...formalAa.trace]
        .every((row) => row.status !== "rejected"),
    };
  });

  const totals = scenarios.reduce((sum, row) => ({
    researchDelta: sum.researchDelta + row.benefit.researchDelta,
    energyDelta: sum.energyDelta + row.benefit.energyDelta,
    damageAvoided: sum.damageAvoided + row.benefit.damageAvoided,
    maximumShipRowReduction: sum.maximumShipRowReduction + row.benefit.maximumShipRowReduction,
    totalShipRowsReduction: sum.totalShipRowsReduction + row.benefit.totalShipRowsReduction,
  }), {
    researchDelta: 0,
    energyDelta: 0,
    damageAvoided: 0,
    maximumShipRowReduction: 0,
    totalShipRowsReduction: 0,
  });
  const output = {
    schema: "ufs_multi_cutpoint_multistep_plan_result_v0",
    input: {
      checkpoint: "formal initial UFS state",
      attention: "full public",
      attentionSeed: 2026082504,
      randomTapeValues: REPLAY_VALUES,
      sharedSpawnPolicy: "first legal candidate",
    },
    activation: {
      firstPassEncoder: firstActivation.encoder,
      secondPassEncoder: secondActivation.encoder,
      secondPassQueries: secondActivation.queries,
      secondPassByValue: secondActivation.byValue,
    },
    firstPassPlan,
    scenarios,
    aggregateBenefit: {
      ...totals,
      averageMaximumShipRowReduction: Number((totals.maximumShipRowReduction / scenarios.length).toFixed(6)),
      averageTotalShipRowsReduction: Number((totals.totalShipRowsReduction / scenarios.length).toFixed(6)),
      changedSecondCutpointCount: scenarios.filter((row) => row.multiPassSelected.roomType === "aa").length,
      retainedStaticChoiceCount: scenarios.filter((row) => row.multiPassSelected.roomType === "tunnel").length,
    },
    checks: {
      firstPassPlanningReadOnly: firstPassReadOnly,
      sixSharedRandomCases: scenarios.length === 6,
      exactlyThreeCutpointsEach: scenarios.every((row) => Object.keys(row.cutpoints).length === 3),
      secondCutpointAwakensAaAndTunnel: scenarios.every((row) => {
        const types = new Set(row.cutpoints.second.candidates.map((candidate) => candidate.roomType));
        return types.has("aa") && types.has("tunnel") && types.size === 2;
      }),
      noCartesianEnumeration: firstPassPlan.searchAudit.cartesianPlacementCandidatesGenerated === 0
        && scenarios.every((row) => (
          row.cutpoints.second.searchAudit.cartesianPlacementCandidatesGenerated === 0
          && row.cutpoints.third.searchAudit.roomOrderPermutationsGenerated === 0
        )),
      cognitivePredictionsMatchFormal: scenarios.every((row) => row.cognitiveMatchesFormal),
      adaptiveChoiceNeverWorseOnThreat: scenarios.every((row) => (
        row.benefit.damageAvoided >= 0
        && row.benefit.maximumShipRowReduction >= 0
        && row.benefit.totalShipRowsReduction >= 0
      )),
      preservesResearchAndEnergy: scenarios.every((row) => (
        row.benefit.researchDelta === 0 && row.benefit.energyDelta === 0
      )),
      catchesValueFourInteraction: scenarios.find((row) => row.rerollValue === 4)
        ?.multiPassSelected.roomType === "tunnel",
      changesChoiceForOtherFiveValues: scenarios.filter((row) => (
        row.multiPassSelected.roomType === "aa"
      )).length === 5,
      aggregateThreatBenefitExact: totals.totalShipRowsReduction === 18
        && totals.maximumShipRowReduction === 7,
      noFormalRejection: scenarios.every((row) => row.noFormalRejection),
    },
  };
  output.allChecksPassed = Object.values(output.checks).every(Boolean);
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (process.argv.includes("--write-evidence")) {
    const evidenceDir = path.join(HERE, "evidence");
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, "multi-pass-result.json"), serialized, "utf8");
  }
  process.stdout.write(serialized);
  return output;
}

if (require.main === module) main();

module.exports = { cognitiveContinuation, compileSecondCutpointActivations, formalOutcome, main };
