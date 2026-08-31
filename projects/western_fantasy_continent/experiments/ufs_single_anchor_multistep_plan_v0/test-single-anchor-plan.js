"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { UfsFullAttentionProvider } = require("../ufs_first_action_imagination_v0/ufs-full-attention-provider");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const intent = require("./agent-intent.json");
const { buildSingleAnchorPlan } = require("./single-anchor-planner");

function activation(id, route) {
  const methods = {
    research_room_advances_track: { id, roomType: "research", outputTrack: "researchIndex" },
    energy_room_generates_energy: { id, roomType: "energy", outputTrack: "energy" },
  };
  return {
    memoryId: `test:${id}`,
    triggeredBy: route,
    triggerSideAccepted: true,
    capability: methods[id],
  };
}

test("one anchor pass plans five dice without Cartesian placement enumeration", () => {
  const session = new UfsFullGameAttentionSession({
    publicMap,
    choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
  });
  const response = session.start({ initialPublicState, attentionSeed: 2026082504 });
  const before = JSON.stringify(session.exportCheckpoint());
  const plan = buildSingleAnchorPlan({
    playerResponse: response,
    intent,
    intentActivations: [activation("research_room_advances_track", "q_after")],
    environmentActivations: [
      activation("research_room_advances_track", "q_before"),
      activation("energy_room_generates_energy", "q_before"),
    ],
  });

  assert.equal(plan.placements.length, 5);
  assert.equal(new Set(plan.placements.map((row) => row.dieId)).size, 5);
  assert.deepEqual(plan.anchorPackage, {
    primary: {
      kind: "research_progress",
      roomId: "A-upper-research",
      dieId: "r1-gray-2",
      expectedRoomValue: 4,
    },
    support: {
      kind: "energy_before_research",
      roomId: "A-upper-energy",
      dieIds: ["r1-gray-0", "r1-gray-1"],
      expectedEnergyGain: 2,
    },
    reason: "direct research would violate the nonzero-energy constraint, so energy is an enabling anchor",
  });
  assert.equal(plan.searchAudit.cartesianPlacementCandidatesGenerated, 0);
  assert.equal(plan.searchAudit.completePlansGenerated, 1);
  assert.equal(JSON.stringify(session.exportCheckpoint()), before);
});

test("non-trigger-side disagreement does not remove an awakened method", () => {
  const session = new UfsFullGameAttentionSession({
    publicMap,
    choiceAttentionProvider: new UfsFullAttentionProvider({ mode: "all" }),
  });
  const response = session.start({ initialPublicState, attentionSeed: 2026082504 });
  const plan = buildSingleAnchorPlan({
    playerResponse: response,
    intent,
    intentActivations: [{
      ...activation("research_room_advances_track", "q_after"),
      unrelatedBeforeDecoy: "energy room in another episode",
      unrelatedOperationsDecoy: ["different operation"],
    }],
    environmentActivations: [activation("energy_room_generates_energy", "q_before")],
  });
  assert.equal(plan.anchorPackage.primary.kind, "research_progress");
  assert.equal(plan.anchorPackage.support.kind, "energy_before_research");
});
