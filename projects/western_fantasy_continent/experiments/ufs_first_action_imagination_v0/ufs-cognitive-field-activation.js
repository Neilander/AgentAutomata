"use strict";

const { assertFiveSlotQ } = require("../imagination_pipeline_v0/five-slot-activation");
const { compileQueryVectorsWithGte } = require("./player-feedback-gte");

const CUE_CHANNELS = new Set(["before", "after"]);

function clone(value) {
  return structuredClone(value);
}

function validateCues(cues) {
  if (!Array.isArray(cues) || cues.length === 0) {
    throw new TypeError("cognitive field activation requires at least one cue");
  }
  const ids = new Set();
  return cues.map((cue, index) => {
    if (!cue || typeof cue !== "object" || Array.isArray(cue)) {
      throw new TypeError(`cognitive cue ${index} must be an object`);
    }
    if (typeof cue.cueId !== "string" || cue.cueId.trim() === "" || ids.has(cue.cueId)) {
      throw new TypeError(`cognitive cue ${index} requires a unique cueId`);
    }
    if (!CUE_CHANNELS.has(cue.channel)) {
      throw new TypeError(`cognitive cue ${cue.cueId} channel must be before or after`);
    }
    if (typeof cue.kind !== "string" || cue.kind.trim() === "") {
      throw new TypeError(`cognitive cue ${cue.cueId} requires a kind`);
    }
    assertFiveSlotQ(cue.q, `cognitive cue ${cue.cueId}`);
    ids.add(cue.cueId);
    return clone(cue);
  });
}

function activationEvidence(cue, match, rank) {
  return {
    cueId: cue.cueId,
    kind: cue.kind,
    channel: cue.channel,
    source: clone(cue.source || {
      statement: cue.statement || null,
      statePaths: cue.statePaths || [],
      knowledgeIds: cue.knowledgeIds || [],
    }),
    activation: Number(match.activation.toFixed(6)),
    cueRank: rank + 1,
  };
}

function activateCognitiveField({
  memory,
  cues,
  queryCompiler = null,
  context = null,
  perCueTopK = 8,
  topK = 8,
  threshold = 0.55,
} = {}) {
  const normalized = validateCues(cues);
  const compiled = compileQueryVectorsWithGte(
    normalized.map((cue) => cue.q),
    queryCompiler || undefined,
  );
  return activateCognitiveFieldVectors({
    memory,
    cues: normalized,
    vectors: compiled.vectors.map((row) => row.vector),
    context,
    perCueTopK,
    topK,
    threshold,
  });
}

function activateCognitiveFieldVectors({
  memory,
  cues,
  vectors,
  context = null,
  perCueTopK = 8,
  topK = 8,
  threshold = 0.55,
} = {}) {
  if (!memory || typeof memory.queryVector !== "function"
    || typeof memory.queryFollowingVector !== "function") {
    throw new TypeError("cognitive field activation requires bidirectional vector memory");
  }
  if (!Number.isInteger(perCueTopK) || perCueTopK <= 0
    || !Number.isInteger(topK) || topK <= 0) {
    throw new TypeError("cognitive field topK values must be positive integers");
  }
  const normalized = validateCues(cues);
  if (!Array.isArray(vectors) || vectors.length !== normalized.length
    || vectors.some((vector) => !Buffer.isBuffer(vector))) {
    throw new TypeError("cognitive field activation requires one compiled vector per cue");
  }
  const byTrajectory = new Map();

  normalized.forEach((cue, cueIndex) => {
    const method = cue.channel === "before" ? "queryVector" : "queryFollowingVector";
    const matches = memory[method](vectors[cueIndex], {
      topK: perCueTopK,
      threshold,
      ...(context == null ? {} : { context }),
    });
    matches.forEach((match, rank) => {
      const id = match.trajectory.trajectoryId;
      let row = byTrajectory.get(id);
      if (!row) {
        row = {
          trajectoryId: id,
          trajectory: clone(match.trajectory),
          supportingMemoryIds: clone(match.supportingMemoryIds || []),
          supportingMemories: clone(match.supportingMemories || []),
          evidence: [],
        };
        byTrajectory.set(id, row);
      }
      row.evidence.push(activationEvidence(cue, match, rank));
    });
  });

  const candidates = [...byTrajectory.values()].map((row) => {
    const strongestByKind = new Map();
    for (const evidence of row.evidence) {
      const existing = strongestByKind.get(evidence.kind);
      if (!existing || evidence.activation > existing.activation) {
        strongestByKind.set(evidence.kind, evidence);
      }
    }
    const independentEvidence = [...strongestByKind.values()];
    const channels = [...new Set(independentEvidence.map((item) => item.channel))].sort();
    return {
      ...row,
      // This is recall relevance only. It is deliberately separate from action utility.
      recallActivation: Number(independentEvidence
        .reduce((sum, item) => sum + Math.max(0, item.activation), 0)
        .toFixed(6)),
      strongestActivation: Number(Math.max(...independentEvidence
        .map((item) => item.activation)).toFixed(6)),
      matchedCueKinds: [...strongestByKind.keys()].sort(),
      matchedChannels: channels,
      evidence: row.evidence.sort((left, right) => right.activation - left.activation
        || left.cueId.localeCompare(right.cueId)),
    };
  }).sort((left, right) => right.matchedChannels.length - left.matchedChannels.length
    || right.matchedCueKinds.length - left.matchedCueKinds.length
    || right.recallActivation - left.recallActivation
    || left.trajectoryId.localeCompare(right.trajectoryId))
    .slice(0, topK);

  return {
    schema: "ufs_cognitive_field_activation_v0",
    cueCount: normalized.length,
    candidates,
  };
}

module.exports = {
  activateCognitiveField,
  activateCognitiveFieldVectors,
  validateCues,
};
