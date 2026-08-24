"use strict";

const { engine, map } = require("../ufs_real_state_candidate_exam_v0/scenario-fixtures");
const {
  ROUND_ONE_RANDOM_OBSERVATIONS,
  ROUND_ONE_SCRIPT,
} = require("./one-round-fixture");
const { UfsOneRoundImagination } = require("./ufs-one-round-imagination");

const result = new UfsOneRoundImagination().run({
  initialPublicState: engine.createGame(map, 1),
  publicMap: map,
  script: ROUND_ONE_SCRIPT,
  randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
});

const steps = [
  ...result.trace.placements.map((row, index) => ({
    step: `放骰${index + 1}`,
    action: `${row.selectedAction.dieId} → ${row.selectedAction.cellId}`,
    programs: row.cognitiveTrace.placementRules.groundings.map((grounding) => grounding.programId),
    attention: {
      fullItems: row.cognitiveTrace.placementRules.attention.fullSpaceItemCount,
      noticed: row.cognitiveTrace.placementRules.attention.fullNoticedItemIds.length,
      omitted: row.cognitiveTrace.placementRules.attention.fullOmittedItemIds.length,
      carriedFromPreviousStep: row.cognitiveTrace.placementRules.attention.fullField
        .filter((item) => item.carryoverActivation > 0).length,
    },
  })),
  ...result.trace.randomBoundaries.map((row) => ({
    step: "白骰重投",
    action: `${row.patch.dieIds.join(", ")} 等待真实随机值后恢复`,
    program: row.cognitiveTrace.grounding.programId,
    attention: {
      fullItems: row.cognitiveTrace.perception.fullSpaceItemCount,
      noticed: row.cognitiveTrace.perception.capacity,
      omitted: row.cognitiveTrace.perception.omittedItemIds.length,
      carriedFromPreviousStep: row.cognitiveTrace.perception.fullField
        .filter((item) => item.carryoverActivation > 0).length,
    },
  })),
  ...result.trace.roomSteps.map((row) => ({
    step: `房间:${row.stage}`,
    action: row.action.type === "resolve_room" ? row.action.roomId : row.action.type,
    program: row.cognitiveTrace?.grounding?.programId || "固定测试选择/阶段控制",
    ...(row.cognitiveTrace ? {
      attention: {
        fullItems: row.cognitiveTrace.perception.fullSpaceItemCount,
        noticed: row.cognitiveTrace.perception.capacity,
        omitted: row.cognitiveTrace.perception.omittedItemIds.length,
        carriedFromPreviousStep: row.cognitiveTrace.perception.fullField
          .filter((item) => item.carryoverActivation > 0).length,
      },
    } : {}),
  })),
  ...result.trace.mothershipSteps.map((row) => ({
    step: `母舰:${row.stage}`,
    action: row.shipId || row.patch?.actionType || "",
    program: row.cognitiveTrace.grounding.programId,
    attention: {
      fullItems: row.cognitiveTrace.perception.fullSpaceItemCount,
      noticed: row.cognitiveTrace.perception.capacity,
      omitted: row.cognitiveTrace.perception.omittedItemIds.length,
      carriedFromPreviousStep: row.cognitiveTrace.perception.fullField
        .filter((item) => item.carryoverActivation > 0).length,
    },
  })),
];

console.log(JSON.stringify({
  schema: result.schema,
  status: result.status,
  reason: result.reason,
  steps,
  final: {
    phase: result.imaginedWorld.phase,
    energy: result.imaginedWorld.energy,
    damage: result.imaginedWorld.damage,
    researchIndex: result.imaginedWorld.researchIndex,
    excavatorIndex: result.imaginedWorld.excavatorIndex,
    mothershipRow: result.imaginedWorld.mothershipRow,
    ships: result.imaginedWorld.ships,
  },
}, null, 2));
