"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { compileQueryVectorsWithGte } = require("../ufs_first_action_imagination_v0/player-feedback-gte");
const { UfsFullAttentionProvider } = require("../ufs_first_action_imagination_v0/ufs-full-attention-provider");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const ruleMemory = require("../ufs_first_action_imagination_v0/rule_reading_trajectory_v0/ai_compiled_trajectories.json");
const { buildSingleAnchorPlan } = require("./single-anchor-planner");

const HERE = __dirname;
const TOP_K = 6;
const CAPABILITIES = Object.freeze({
  energy_room_generates_energy: {
    id: "energy_room_generates_energy", roomType: "energy", outputTrack: "energy",
  },
  fighter_room_destroys_eligible_ships: {
    id: "fighter_room_destroys_eligible_ships", roomType: "fighter", outputTrack: "ships",
  },
  research_room_advances_track: {
    id: "research_room_advances_track", roomType: "research", outputTrack: "researchIndex",
  },
  tunnel_no_room_output: {
    id: "tunnel_no_room_output", roomType: "tunnel", outputTrack: null,
  },
});

function clone(value) {
  return structuredClone(value);
}

function stable(value) {
  return JSON.stringify(value);
}

function hash(value) {
  return crypto.createHash("sha256").update(stable(value)).digest("hex");
}

function dot(left, right) {
  let score = 0;
  for (let offset = 0; offset < left.byteLength; offset += 4) {
    score += left.readFloatLE(offset) * right.readFloatLE(offset);
  }
  return Number(score.toFixed(6));
}

function intentQ(intent) {
  return {
    affected_object: "研究进度与本局胜利目标",
    change_trend: "研究从当前较低位置明显增加",
    cause_relation: "寻找能够取得研究进展的方法",
    temporal_state: "规划本轮结果时",
    context: intent.summary,
  };
}

function environmentQ(roomType, count) {
  const labels = { research: "研究", energy: "能源", fighter: "战斗机", tunnel: "隧道", aa: "防空" };
  return {
    affected_object: `当前可见的${labels[roomType] || roomType}房和五颗待放置骰子`,
    change_trend: `存在${count}个这种房间，可考虑如何投入和结算`,
    cause_relation: "玩家在正式骰子放置边界看到了这些地图对象",
    temporal_state: "本轮骰子尚未放置时",
    context: "从当前环境寻找可用方法，不预设结果",
  };
}

function compileActivations(playerResponse, intent) {
  const edges = ruleMemory.edges;
  const roomCounts = Object.fromEntries((playerResponse.mapView.rooms || []).reduce((map, room) => {
    map.set(room.type, (map.get(room.type) || 0) + 1);
    return map;
  }, new Map()));
  const querySpecs = [
    { key: "intent", route: "q_after", q: intentQ(intent) },
    ...Object.entries(roomCounts).map(([roomType, count]) => ({
      key: `environment:${roomType}`,
      route: "q_before",
      roomType,
      q: environmentQ(roomType, count),
    })),
  ];
  const specs = edges.flatMap((edge) => [
    { key: `edge:${edge.edgeId}:before`, q: edge.current },
    { key: `edge:${edge.edgeId}:after`, q: edge.following },
  ]).concat(querySpecs.map((row) => ({ key: `query:${row.key}`, q: row.q })));
  const compiled = compileQueryVectorsWithGte(specs.map((row) => row.q));
  const vectors = new Map(specs.map((row, index) => [row.key, compiled.vectors[index].vector]));

  const rank = (query, side) => edges.map((edge) => ({
    edge,
    similarity: dot(
      vectors.get(`query:${query.key}`),
      vectors.get(`edge:${edge.edgeId}:${side}`),
    ),
  })).sort((left, right) => right.similarity - left.similarity
    || left.edge.edgeId.localeCompare(right.edge.edgeId)).slice(0, TOP_K);

  const intentRows = rank(querySpecs[0], "after").map(({ edge, similarity }) => {
    const capability = CAPABILITIES[edge.sourceRuleId] || null;
    return {
      memoryId: edge.edgeId,
      sourceRuleId: edge.sourceRuleId,
      triggeredBy: "q_after",
      triggerSimilarity: similarity,
      triggerSideAccepted: Boolean(capability?.outputTrack === intent.primary.desiredTrack
        || ["win_by_research_before_destruction", "research_top_is_immediate_win"]
          .includes(edge.sourceRuleId)),
      capability: clone(capability),
    };
  });
  const environmentRows = querySpecs.slice(1).flatMap((query) => (
    rank(query, "before").map(({ edge, similarity }) => {
      const capability = CAPABILITIES[edge.sourceRuleId] || null;
      return {
        memoryId: edge.edgeId,
        sourceRuleId: edge.sourceRuleId,
        cueRoomType: query.roomType,
        triggeredBy: "q_before",
        triggerSimilarity: similarity,
        triggerSideAccepted: Boolean(capability?.roomType === query.roomType),
        capability: clone(capability),
      };
    })
  ));
  return { encoder: compiled.encoder, intentRows, environmentRows, querySpecs };
}

function makeSession() {
  return new UfsFullGameAttentionSession({
    publicMap,
    choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
  });
}

function executePlan(plan) {
  const session = makeSession();
  let response = session.start({ initialPublicState, attentionSeed: 2026082504 });
  const trace = [];
  const apply = (operation, source) => {
    response = session.advance(operation);
    trace.push({ source, operation: clone(operation), status: response.status, reason: response.reason });
    if (response.status === "rejected") throw new Error(`formal execution rejected: ${response.reason}`);
  };
  for (const placement of plan.placements) {
    apply(placement, "planned_placement");
    if (response.status === "random") {
      const values = Object.fromEntries(response.pending.dieIds.map((dieId) => [dieId, 3]));
      apply({ type: "submit_random_observation", values }, "evaluation_random_tape_not_planner_input");
    }
  }
  for (const template of plan.roomActions) {
    const operation = template.advanceSteps === "maximum_available"
      ? { ...template, advanceSteps: response.pending.maxAdvanceSteps }
      : template;
    apply(operation, "planned_room_action");
  }
  return { response, trace };
}

function main() {
  const intent = JSON.parse(fs.readFileSync(path.join(HERE, "agent-intent.json"), "utf8"));
  const live = makeSession();
  const playerResponse = live.start({ initialPublicState, attentionSeed: 2026082504 });
  const checkpointBefore = live.exportCheckpoint();
  const activation = compileActivations(playerResponse, intent);
  const plan = buildSingleAnchorPlan({
    playerResponse,
    intent,
    intentActivations: activation.intentRows,
    environmentActivations: activation.environmentRows,
  });
  const baseline = live.planCurrentChoice();
  const checkpointAfter = live.exportCheckpoint();
  const execution = executePlan(plan);
  const finalObservation = execution.response.observation;
  const visibleInput = {
    observation: playerResponse.observation,
    mapView: playerResponse.mapView,
    availableOperations: playerResponse.availableOperations,
    operationContracts: playerResponse.operationContracts,
  };
  const placementColumns = plan.placements.map((row) => (
    playerResponse.mapView.baseCells.find((cell) => cell.id === row.cellId).column
  ));
  const output = {
    schema: "ufs_single_anchor_multistep_plan_result_v0",
    input: {
      kind: "formal_initial_checkpoint_full_public_attention",
      attentionSeed: 2026082504,
      visibleInputHash: hash(visibleInput),
      diceCount: playerResponse.observation.dice.length,
      hiddenStateUsedForIntentOrPlanning: false,
    },
    intent,
    activation: {
      encoder: activation.encoder,
      querySpecs: activation.querySpecs,
      intent: activation.intentRows,
      environment: activation.environmentRows,
    },
    plan,
    singleStepBaseline: {
      attemptedCount: baseline.attemptedCount,
      legalCandidateCount: baseline.legalCandidateCount,
      recommendedPayload: baseline.recommendedPayload,
    },
    evaluation: {
      randomTapeDisclosure: "the value 3 is supplied only after the formal public random boundary and was not planner input",
      trace: execution.trace,
      final: {
        status: execution.response.status,
        reason: execution.response.reason,
        energy: finalObservation.energy,
        damage: finalObservation.damage,
        researchIndex: finalObservation.researchIndex,
        mothershipRow: finalObservation.mothershipRow,
      },
    },
    checks: {
      realFormalCheckpointUsed: playerResponse.schema === "ufs_full_game_attention_response_v1",
      exactlyFiveDicePlanned: plan.placements.length === 5,
      everyDieUsedOnce: new Set(plan.placements.map((row) => row.dieId)).size === 5,
      everyColumnUsedOnce: new Set(placementColumns).size === 5,
      intentAndEnvironmentGroupsBothExist: activation.intentRows.length > 0
        && activation.environmentRows.length > 0,
      researchMethodAwakened: [...activation.intentRows, ...activation.environmentRows]
        .some((row) => row.triggerSideAccepted
          && row.capability?.id === "research_room_advances_track"),
      energySupportAwakened: activation.environmentRows.some((row) => row.triggerSideAccepted
        && row.capability?.id === "energy_room_generates_energy"),
      anchorHasPrimaryAndSupport: plan.anchorPackage.primary.kind === "research_progress"
        && plan.anchorPackage.support?.kind === "energy_before_research",
      noCartesianPlacementEnumeration: plan.searchAudit.cartesianPlacementCandidatesGenerated === 0
        && plan.searchAudit.completePlansGenerated === 1,
      planningWasReadOnly: hash(checkpointBefore) === hash(checkpointAfter),
      baselineStillChoosesImmediateAa: baseline.recommendedPayload?.cellId === "A-r1-c1",
      formalExecutionReachedResearchTwo: finalObservation.researchIndex === 2,
      zeroEnergyTrapAvoided: finalObservation.energy >= 1,
      noFormalRejection: execution.trace.every((row) => row.status !== "rejected"),
    },
  };
  output.allChecksPassed = Object.values(output.checks).every(Boolean);
  const serialized = `${JSON.stringify(output, null, 2)}\n`;
  if (process.argv.includes("--write-evidence")) {
    const evidenceDir = path.join(HERE, "evidence");
    fs.mkdirSync(evidenceDir, { recursive: true });
    fs.writeFileSync(path.join(evidenceDir, "single-pass-result.json"), serialized, "utf8");
  }
  process.stdout.write(serialized);
  return output;
}

if (require.main === module) main();

module.exports = { compileActivations, executePlan, main };
