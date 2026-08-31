"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  PlayerFeedbackGteMemory,
  compileQueryVectorsWithGte,
  validateFeedbackGteOverlay,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");
const {
  activateCognitiveFieldVectors,
} = require("../ufs_first_action_imagination_v0/ufs-cognitive-field-activation");
const {
  canonicalQ,
} = require("../ufs_first_action_imagination_v0/ufs-feedback-learning");

const HERE = __dirname;
const THRESHOLD = 0.55;

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(HERE, file), "utf8"));
}

function valueAt(root, dotted) {
  return dotted.split(".").reduce((value, key) => (
    value != null && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : undefined
  ), root);
}

function cloneCue(cue, prefix = "") {
  return {
    ...structuredClone(cue),
    cueId: `${prefix}${cue.cueId}`,
  };
}

function exactCue(target, channel) {
  return {
    cueId: `exact-${channel}`,
    kind: channel === "before" ? "exact_state" : "exact_result",
    channel,
    statement: `Exact stored ${channel} endpoint sanity query`,
    statePaths: ["benchmark.exactStoredEndpoint"],
    knowledgeIds: ["BENCHMARK-SANITY"],
    q: structuredClone(channel === "before" ? target.currentQ : target.followingQ),
  };
}

function targetRank(result, targetId) {
  const index = result.candidates.findIndex((row) => row.trajectoryId === targetId);
  return index < 0 ? null : index + 1;
}

function endpointForCase(trajectory, caseType) {
  if (caseType === "exact_before") return trajectory.currentQ;
  if (caseType === "exact_after") return trajectory.followingQ;
  return null;
}

function exactEndpointEquivalent(left, right, caseType) {
  const leftEndpoint = endpointForCase(left, caseType);
  const rightEndpoint = endpointForCase(right, caseType);
  return leftEndpoint != null && rightEndpoint != null
    && canonicalQ(leftEndpoint) === canonicalQ(rightEndpoint);
}

function metric(rows, predicate) {
  const selected = rows.filter(predicate);
  const top1 = selected.filter((row) => row.rank != null && row.rank <= 1).length;
  const top3 = selected.filter((row) => row.rank != null && row.rank <= 3).length;
  const top5 = selected.filter((row) => row.rank != null && row.rank <= 5).length;
  const mrr = selected.length === 0 ? 0 : selected.reduce(
    (sum, row) => sum + (row.rank == null ? 0 : 1 / row.rank), 0,
  ) / selected.length;
  return {
    count: selected.length,
    top1,
    top3,
    top5,
    hitAt1: Number((top1 / Math.max(1, selected.length)).toFixed(6)),
    hitAt3: Number((top3 / Math.max(1, selected.length)).toFixed(6)),
    hitAt5: Number((top5 / Math.max(1, selected.length)).toFixed(6)),
    mrr: Number(mrr.toFixed(6)),
  };
}

function validateAgentGrounding(inputs, passes) {
  const inputById = new Map(inputs.situations.map((row) => [row.scenarioId, row]));
  const errors = [];
  let cueCount = 0;
  for (const run of passes.runs) {
    const input = inputById.get(run.scenarioId);
    if (!input) {
      errors.push(`${run.scenarioId}: missing agent input`);
      continue;
    }
    const knowledgeIds = new Set(input.knowledge.map((row) => row.knowledgeId));
    for (const pass of run.passes) {
      for (const cue of pass.cues) {
        cueCount += 1;
        if (!Array.isArray(cue.statePaths) || cue.statePaths.length === 0) {
          errors.push(`${cue.cueId}: missing state paths`);
        }
        for (const statePath of cue.statePaths || []) {
          if (valueAt(input.publicState, statePath) === undefined) {
            errors.push(`${cue.cueId}: unknown state path ${statePath}`);
          }
        }
        if (!Array.isArray(cue.knowledgeIds) || cue.knowledgeIds.length === 0) {
          errors.push(`${cue.cueId}: missing knowledge IDs`);
        }
        for (const knowledgeId of cue.knowledgeIds || []) {
          if (!knowledgeIds.has(knowledgeId)) {
            errors.push(`${cue.cueId}: unavailable knowledge ${knowledgeId}`);
          }
        }
      }
    }
  }
  return { cueCount, errors };
}

function buildCases({ oracle, trajectoriesById, passesById }) {
  const cases = [];
  oracle.targets.forEach((spec, index) => {
    const target = trajectoriesById.get(spec.targetTrajectoryId);
    const confuser = trajectoriesById.get(spec.confuserTrajectoryId);
    const run = passesById.get(spec.scenarioId);
    if (!target || !confuser || !run) throw new Error(`incomplete benchmark target ${spec.scenarioId}`);
    const pass = (number) => run.passes.find((row) => row.pass === number).cues;
    const p1 = pass(1);
    const p2 = pass(2);
    const p3 = pass(3);
    const distractorRun = passesById.get(
      oracle.targets[(index + 2) % oracle.targets.length].scenarioId,
    );
    const unrelatedRun = passesById.get(
      oracle.targets[(index + 3) % oracle.targets.length].scenarioId,
    );
    const distractors = distractorRun.passes.find((row) => row.pass === 1).cues;
    const unrelated = unrelatedRun.passes.find((row) => row.pass === 1).cues;
    const add = (caseType, cues, expectedPositive) => cases.push({
      caseId: `${spec.scenarioId}:${caseType}`,
      scenarioId: spec.scenarioId,
      category: spec.category,
      targetTrajectoryId: spec.targetTrajectoryId,
      caseType,
      expectedPositive,
      cues: cues.map((cue, cueIndex) => cloneCue(cue, `${caseType}-${cueIndex}-`)),
    });
    add("exact_before", [exactCue(target, "before")], true);
    add("exact_after", [exactCue(target, "after")], true);
    add("pass1_before", p1.filter((cue) => cue.channel === "before"), true);
    add("pass1_after", p1.filter((cue) => cue.channel === "after"), true);
    add("pass1_combined", p1, true);
    add("pass2_combined", p2, true);
    add("pass3_combined", p3, true);
    add("pass1_with_noise", [
      ...p1,
      ...distractors.map((cue) => cloneCue(cue, "distractor-")),
    ], true);
    add("near_miss", [exactCue(confuser, "before"), exactCue(confuser, "after")], false);
    add("unrelated", unrelated, false);
  });
  return cases;
}

function main() {
  const oracle = readJson("oracle.json");
  const inputs = readJson("agent-inputs.json");
  const passes = readJson("agent-cue-passes.json");
  const learnedPath = path.resolve(HERE, oracle.profile);
  const freshPath = path.resolve(
    HERE,
    "../ufs_revision1_vs_fresh_control_v21/profiles/control-fresh-revision0.json",
  );
  const learned = JSON.parse(fs.readFileSync(learnedPath, "utf8"));
  const fresh = JSON.parse(fs.readFileSync(freshPath, "utf8"));
  const learning = learned.cognition.feedbackLearningState;
  const freshLearning = fresh.cognition.feedbackLearningState;
  const trajectories = learning.trajectories;
  if (trajectories.length !== 275 || trajectories.some((row) => row.compileStatus !== "compiled_matrix")) {
    throw new Error("learned profile no longer matches frozen 275/275 compiled baseline");
  }
  if ((freshLearning.trajectories || []).length !== 0 || fresh.cognition.feedbackGteOverlay != null) {
    throw new Error("fresh ownership control unexpectedly contains personal feedback GTE");
  }
  const overlay = validateFeedbackGteOverlay(learned.cognition.feedbackGteOverlay, trajectories);
  const memory = new PlayerFeedbackGteMemory({
    overlay,
    trajectories,
    memories: learning.memories || [],
    chains: learning.chains || [],
  });
  const trajectoriesById = new Map(trajectories.map((row) => [row.trajectoryId, row]));
  const passesById = new Map(passes.runs.map((row) => [row.scenarioId, row]));
  const grounding = validateAgentGrounding(inputs, passes);
  if (grounding.errors.length > 0) {
    throw new Error(`agent cue grounding failed:\n${grounding.errors.join("\n")}`);
  }
  const cases = buildCases({ oracle, trajectoriesById, passesById });
  const flattened = cases.flatMap((row) => row.cues);
  const compiled = compileQueryVectorsWithGte(flattened.map((cue) => cue.q));
  if (compiled.encoder !== overlay.encoder) {
    throw new Error(`query encoder ${compiled.encoder} disagrees with learned overlay ${overlay.encoder}`);
  }
  let cursor = 0;
  const caseRows = cases.map((testCase) => {
    const vectors = compiled.vectors.slice(cursor, cursor + testCase.cues.length)
      .map((row) => row.vector);
    cursor += testCase.cues.length;
    const result = activateCognitiveFieldVectors({
      memory,
      cues: testCase.cues,
      vectors,
      perCueTopK: trajectories.length,
      topK: trajectories.length,
      threshold: -1,
    });
    const rank = targetRank(result, testCase.targetTrajectoryId);
    const target = rank == null ? null : result.candidates[rank - 1];
    const top = result.candidates[0] || null;
    const targetTrajectory = trajectoriesById.get(testCase.targetTrajectoryId);
    const exactEndpointKey = endpointForCase(targetTrajectory, testCase.caseType) == null
      ? null
      : canonicalQ(endpointForCase(targetTrajectory, testCase.caseType));
    const exactEquivalentCount = exactEndpointKey == null ? null : trajectories.filter((row) => (
      canonicalQ(endpointForCase(row, testCase.caseType)) === exactEndpointKey
    )).length;
    // This deliberately leaks the oracle trajectory context. It is an upper-bound
    // diagnostic for whether context gating can resolve duplicate/near-duplicate Qs,
    // not part of the frozen benchmark score.
    const oracleContextResult = testCase.expectedPositive
      ? activateCognitiveFieldVectors({
        memory,
        cues: testCase.cues,
        vectors,
        context: targetTrajectory.applicability,
        perCueTopK: trajectories.length,
        topK: trajectories.length,
        threshold: -1,
      })
      : null;
    return {
      caseId: testCase.caseId,
      scenarioId: testCase.scenarioId,
      category: testCase.category,
      caseType: testCase.caseType,
      expectedPositive: testCase.expectedPositive,
      targetTrajectoryId: testCase.targetTrajectoryId,
      rank,
      targetRecallActivation: target == null ? null : target.recallActivation,
      targetStrongestActivation: target == null ? null : target.strongestActivation,
      topTrajectoryId: top?.trajectoryId || null,
      topRecallActivation: top?.recallActivation ?? null,
      topStrongestActivation: top?.strongestActivation ?? null,
      topAboveThreshold: Number(top?.strongestActivation ?? -Infinity) >= THRESHOLD,
      exactEndpointEquivalentAt1: exactEndpointKey == null || top == null
        ? null
        : exactEndpointEquivalent(top.trajectory, targetTrajectory, testCase.caseType),
      exactEquivalentTrajectoryCount: exactEquivalentCount,
      oracleContextRank: oracleContextResult == null
        ? null
        : targetRank(oracleContextResult, testCase.targetTrajectoryId),
    };
  });
  const byKey = new Map(caseRows.map((row) => [`${row.scenarioId}:${row.caseType}`, row]));
  const exact = metric(caseRows, (row) => row.caseType.startsWith("exact_"));
  const exactEquivalentTop1 = caseRows.filter((row) => (
    row.caseType.startsWith("exact_") && row.exactEndpointEquivalentAt1
  )).length;
  const paraphrase = metric(caseRows, (row) => [
    "pass1_before", "pass1_after", "pass1_combined", "pass2_combined",
    "pass3_combined", "pass1_with_noise",
  ].includes(row.caseType));
  const combinedPass1 = metric(caseRows, (row) => row.caseType === "pass1_combined");
  const nearMiss = metric(caseRows, (row) => row.caseType === "near_miss");
  const unrelated = metric(caseRows, (row) => row.caseType === "unrelated");
  const oracleContextParaphrase = metric(
    caseRows.map((row) => ({ ...row, rank: row.oracleContextRank })),
    (row) => [
      "pass1_before", "pass1_after", "pass1_combined", "pass2_combined",
      "pass3_combined", "pass1_with_noise",
    ].includes(row.caseType),
  );
  const oracleContextCombinedPass1 = metric(
    caseRows.map((row) => ({ ...row, rank: row.oracleContextRank })),
    (row) => row.caseType === "pass1_combined",
  );
  const stability = oracle.targets.map((spec) => {
    const ranks = [1, 2, 3].map((pass) => byKey.get(
      `${spec.scenarioId}:pass${pass}_combined`,
    ).rank);
    return {
      scenarioId: spec.scenarioId,
      ranks,
      allTop3: ranks.every((rank) => rank != null && rank <= 3),
    };
  });
  const convergence = oracle.targets.map((spec) => {
    const before = byKey.get(`${spec.scenarioId}:pass1_before`).rank;
    const after = byKey.get(`${spec.scenarioId}:pass1_after`).rank;
    const combined = byKey.get(`${spec.scenarioId}:pass1_combined`).rank;
    const bestSingle = Math.min(before ?? Infinity, after ?? Infinity);
    return {
      scenarioId: spec.scenarioId,
      before,
      after,
      combined,
      changeFromBestSingle: Number.isFinite(bestSingle) && combined != null
        ? bestSingle - combined
        : null,
    };
  });
  const noise = oracle.targets.map((spec) => {
    const clean = byKey.get(`${spec.scenarioId}:pass1_combined`).rank;
    const noisy = byKey.get(`${spec.scenarioId}:pass1_with_noise`).rank;
    return {
      scenarioId: spec.scenarioId,
      clean,
      noisy,
      rankChange: clean == null || noisy == null ? null : clean - noisy,
    };
  });
  const thresholds = {
    exactHitAt1: exact.hitAt1 === 1,
    paraphraseHitAt3: paraphrase.hitAt3 >= 0.75,
    combinedPass1Top3: combinedPass1.top3 >= 5,
    threePassStableTop3: stability.filter((row) => row.allTop3).length >= 4,
    nearMissFalseTop3: nearMiss.top3 <= 1,
    unrelatedFalseTop3: unrelated.top3 <= 1,
    grounding: grounding.errors.length === 0,
    freshPersonalCandidatesZero: true,
  };
  const output = {
    schema: "ufs_cognitive_field_activation_benchmark_result_v1",
    frozen: {
      learnedPlayerId: learned.playerId,
      learnedRevision: learned.progress.revision,
      learnedEpisodes: learned.progress.episodesCaptured,
      learnedOperations: learned.progress.operationsExperienced,
      learnedTrajectoryCount: trajectories.length,
      learnedCompiledCount: trajectories.filter((row) => row.compileStatus === "compiled_matrix").length,
      freshPlayerId: fresh.playerId,
      freshPersonalTrajectoryCount: (freshLearning.trajectories || []).length,
      encoder: compiled.encoder,
    },
    counts: {
      targetCount: oracle.targets.length,
      learnedCases: caseRows.length,
      freshOwnershipCases: caseRows.length,
      compiledCueCount: flattened.length,
      agentCueCount: grounding.cueCount,
      agentGroundingErrors: grounding.errors.length,
    },
    metrics: {
      exact,
      exactEquivalentTop1: {
        count: exact.count,
        top1: exactEquivalentTop1,
        hitAt1: Number((exactEquivalentTop1 / Math.max(1, exact.count)).toFixed(6)),
      },
      paraphrase,
      combinedPass1,
      nearMissTargetFalseHit: nearMiss,
      unrelatedTargetFalseHit: unrelated,
      unrelatedTopAboveThresholdCount: caseRows.filter((row) => (
        row.caseType === "unrelated" && row.topAboveThreshold
      )).length,
      stableAllThreeTop3: stability.filter((row) => row.allTop3).length,
      diagnosticsNotFrozenScores: {
        oracleContextParaphrase,
        oracleContextCombinedPass1,
      },
      thresholds,
      allFrozenThresholdsPassed: Object.values(thresholds).every(Boolean),
    },
    stability,
    convergence,
    noise,
    cases: caseRows,
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main();
