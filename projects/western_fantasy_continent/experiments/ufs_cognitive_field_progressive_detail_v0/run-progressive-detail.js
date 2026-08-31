"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  PlayerFeedbackGteMemory,
  compileQueryVectorsWithGte,
  validateFeedbackGteOverlay,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");

const HERE = __dirname;
const TARGET_ID = "feedback-trajectory-00162";
const CONFUSER_ID = "feedback-trajectory-00128";

function rankOf(rows, trajectoryId) {
  const index = rows.findIndex((row) => row.trajectory.trajectoryId === trajectoryId);
  return index < 0 ? null : index + 1;
}

function activationOf(rows, trajectoryId) {
  return rows.find((row) => row.trajectory.trajectoryId === trajectoryId)?.activation ?? null;
}

function main() {
  const fixture = JSON.parse(fs.readFileSync(path.join(HERE, "progressive-cues.json"), "utf8"));
  const profilePath = path.resolve(
    HERE,
    "../ufs_single_step_planner_two_games_v24/attempt-02/profiles/game-02-output-revision-9.json",
  );
  const profile = JSON.parse(fs.readFileSync(profilePath, "utf8"));
  const learning = profile.cognition.feedbackLearningState;
  const trajectories = learning.trajectories;
  const overlay = validateFeedbackGteOverlay(profile.cognition.feedbackGteOverlay, trajectories);
  if (profile.progress.revision !== 9 || trajectories.length !== 275
    || trajectories.some((row) => row.compileStatus !== "compiled_matrix")) {
    throw new Error("learned profile no longer matches frozen revision-9 275/275 baseline");
  }
  const memory = new PlayerFeedbackGteMemory({
    overlay,
    trajectories,
    memories: learning.memories || [],
    chains: learning.chains || [],
  });
  const byId = new Map(trajectories.map((row) => [row.trajectoryId, row]));
  const target = byId.get(TARGET_ID);
  const progressive = [
    ...fixture.channels.before.map((row) => ({ ...row, channel: "before" })),
    ...fixture.channels.after.map((row) => ({ ...row, channel: "after" })),
  ];
  const exact = [
    { channel: "before", level: "exact", q: target.currentQ },
    { channel: "after", level: "exact", q: target.followingQ },
  ];
  const compiled = compileQueryVectorsWithGte([...progressive, ...exact].map((row) => row.q));
  const evaluated = [...progressive, ...exact].map((spec, index) => {
    const method = spec.channel === "before" ? "queryVector" : "queryFollowingVector";
    const rows = memory[method](compiled.vectors[index].vector, {
      context: null,
      topK: trajectories.length,
      threshold: -1,
    });
    return {
      channel: spec.channel,
      level: spec.level,
      addedDetail: spec.addedDetail || "exact stored endpoint ceiling",
      targetRank: rankOf(rows, TARGET_ID),
      targetActivation: Number(activationOf(rows, TARGET_ID).toFixed(6)),
      confuserRank: rankOf(rows, CONFUSER_ID),
      confuserActivation: Number(activationOf(rows, CONFUSER_ID).toFixed(6)),
      targetMinusConfuserActivation: Number((
        activationOf(rows, TARGET_ID) - activationOf(rows, CONFUSER_ID)
      ).toFixed(6)),
      topTrajectoryId: rows[0]?.trajectory.trajectoryId || null,
      topActivation: rows[0] == null ? null : Number(rows[0].activation.toFixed(6)),
    };
  });
  const channels = Object.fromEntries(["before", "after"].map((channel) => {
    const levels = evaluated.filter((row) => row.channel === channel && row.level !== "exact");
    const exactRow = evaluated.find((row) => row.channel === channel && row.level === "exact");
    const nonWorseningAdditions = levels.slice(1).filter((row, index) => (
      row.targetRank <= levels[index].targetRank
    )).length;
    const first = levels[0];
    const final = levels.at(-1);
    return [channel, {
      levels,
      exactCeiling: exactRow,
      checks: {
        finalBetterThanGeneric: final.targetRank < first.targetRank,
        finalTop3: final.targetRank <= 3,
        atLeastThreeNonWorseningAdditions: nonWorseningAdditions >= 3,
        finalAboveConfuser: final.targetRank < final.confuserRank,
      },
      nonWorseningAdditions,
    }];
  }));
  const checks = Object.values(channels).flatMap((row) => Object.values(row.checks));
  process.stdout.write(`${JSON.stringify({
    schema: "ufs_progressive_detail_result_v0",
    frozen: {
      playerId: profile.playerId,
      revision: profile.progress.revision,
      trajectoryCount: trajectories.length,
      targetTrajectoryId: TARGET_ID,
      confuserTrajectoryId: CONFUSER_ID,
      encoder: compiled.encoder,
    },
    channels,
    allFrozenChecksPassed: checks.every(Boolean),
  }, null, 2)}\n`);
}

main();

