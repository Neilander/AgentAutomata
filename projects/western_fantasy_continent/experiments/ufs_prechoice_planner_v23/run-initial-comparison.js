"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const { compileRowsWithLocalGte } = require("../ufs_first_action_imagination_v0/player-feedback-gte");
const { createSessionForPlayer } = require("../ufs_first_action_imagination_v0/ufs-player-generator");

const ROOT = path.resolve(__dirname, "..");
const CLI = path.join(ROOT, "ufs_first_action_imagination_v0", "full-game-attention-player-cli.js");
const FRESH = path.join(
  ROOT, "ufs_revision1_vs_fresh_control_v21", "profiles", "control-fresh-revision0.json",
);
const LEARNED = path.join(
  ROOT, "ufs_learned_player_five_games_v22", "profiles", "game-05-compiled-revision-7.json",
);

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    timeout: 10 * 60 * 1000,
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(`${args.join(" ")} failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function one(profile, label) {
  const stateDir = fs.mkdtempSync(path.join(os.tmpdir(), `ufs-v23-${label}-`));
  try {
    run([CLI, "player-start", stateDir, profile]);
    const checkpointFile = path.join(stateDir, "full-game-host-checkpoint.json");
    const checkpointBefore = fs.readFileSync(checkpointFile, "utf8");
    const startedAt = Date.now();
    const plan = JSON.parse(run([CLI, "plan", stateDir]));
    const planningMilliseconds = Date.now() - startedAt;
    if (fs.readFileSync(checkpointFile, "utf8") !== checkpointBefore) {
      throw new Error(`${label} plan mutated its live checkpoint`);
    }
    return {
      label,
      planningMilliseconds,
      attemptedCount: plan.attemptedCount,
      legalCandidateCount: plan.legalCandidateCount,
      recommendedPayload: plan.recommendedPayload,
      topFive: plan.ranking.slice(0, 5).map((row) => ({
        payload: row.payload,
        baselineScore: row.baselineScore,
        finalScore: row.finalScore,
        feedbackAdjustment: row.feedbackAdjustment,
        recalledFeedback: row.recalledFeedback,
      })),
      feedbackAdjustedCandidateCount: plan.ranking.filter((row) => row.feedbackAdjustment).length,
      recalledCandidateCount: plan.ranking.filter((row) => row.recalledFeedback.length > 0).length,
    };
  } finally {
    fs.rmSync(stateDir, { recursive: true, force: true });
  }
}

function summarizePlan(plan, label, planningMilliseconds) {
  return {
    label,
    planningMilliseconds,
    attemptedCount: plan.attemptedCount,
    legalCandidateCount: plan.legalCandidateCount,
    recommendedPayload: plan.recommendedPayload,
    topFive: plan.ranking.slice(0, 5).map((row) => ({
      payload: row.payload,
      baselineScore: row.baselineScore,
      finalScore: row.finalScore,
      feedbackAdjustment: row.feedbackAdjustment,
      recalledFeedback: row.recalledFeedback,
    })),
    feedbackAdjustedCandidateCount: plan.ranking.filter((row) => row.feedbackAdjustment).length,
    recalledCandidateCount: plan.ranking.filter((row) => row.recalledFeedback.length > 0).length,
  };
}

function roomBoundary(profileFile, label) {
  const playerProfile = JSON.parse(fs.readFileSync(profileFile, "utf8"));
  const { session } = createSessionForPlayer({
    playerProfile,
    publicMap,
    initialPublicState,
    feedbackGteCompiler: null,
  });
  const prefixFiles = ["0002.json", "0003.json", "0004.json", "0005.json"];
  const payloadRoot = path.join(
    ROOT, "ufs_learned_player_five_games_v22", "records", "game-01", "payloads",
  );
  let response;
  for (const file of prefixFiles) {
    response = session.advance(JSON.parse(fs.readFileSync(path.join(payloadRoot, file), "utf8")));
    if (response.status === "rejected") throw new Error(`${label} prefix ${file}: ${response.reason}`);
  }
  response = session.advance({
    type: "submit_random_observation",
    values: { "r1-white-4": 1 },
  });
  if (response.status === "rejected") throw new Error(`${label} prefix reroll: ${response.reason}`);
  response = session.advance(JSON.parse(fs.readFileSync(path.join(payloadRoot, "0007.json"), "utf8")));
  if (response.status !== "choice" || response.pending?.type !== "room_action") {
    throw new Error(`${label} did not reach the room action boundary`);
  }
  const checkpointBefore = JSON.stringify(session.exportCheckpoint());
  const startedAt = Date.now();
  const plan = session.planCurrentChoice({ queryCompiler: compileRowsWithLocalGte });
  const planningMilliseconds = Date.now() - startedAt;
  if (JSON.stringify(session.exportCheckpoint()) !== checkpointBefore) {
    throw new Error(`${label} room plan mutated its live checkpoint`);
  }
  return summarizePlan(plan, label, planningMilliseconds);
}

function main() {
  const fresh = one(FRESH, "fresh");
  const learned = one(LEARNED, "learned");
  const freshRoom = roomBoundary(FRESH, "fresh-room");
  const learnedRoom = roomBoundary(LEARNED, "learned-room");
  process.stdout.write(`${JSON.stringify({
    schema: "ufs_v23_prechoice_comparison_v1",
    sameAttentionSeed: true,
    initialBoundary: {
      choiceChanged: JSON.stringify(fresh.recommendedPayload) !== JSON.stringify(learned.recommendedPayload),
      fresh,
      learned,
    },
    firstRoomBoundary: {
      choiceChanged: JSON.stringify(freshRoom.recommendedPayload)
        !== JSON.stringify(learnedRoom.recommendedPayload),
      fresh: freshRoom,
      learned: learnedRoom,
    },
  }, null, 2)}\n`);
}

if (require.main === module) main();

module.exports = { main, one, roomBoundary };
