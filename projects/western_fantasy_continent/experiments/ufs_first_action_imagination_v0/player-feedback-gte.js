"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { assertFiveSlotQ } = require("../imagination_pipeline_v0/five-slot-activation");
const { canonicalQ, contextMatches } = require("./ufs-feedback-learning");
const { jointTransitionQ, operationSequenceKey } = require("./ufs-transition-memory");

const OVERLAY_SCHEMA = "ufs_player_feedback_gte_overlay_v1";
const BATCH_SCHEMA = "ufs_player_feedback_gte_compile_batch_v1";
const INPUT_SCHEMA = "ufs_player_feedback_gte_compile_input_v1";
const COORDINATE_WIDTH = 3840;

function clone(value) {
  return structuredClone(value);
}

function sha256(...buffers) {
  const hash = crypto.createHash("sha256");
  for (const buffer of buffers) hash.update(buffer);
  return hash.digest("hex");
}

function matrixBuffer(base64, rows, width, label) {
  if (typeof base64 !== "string" || base64 === "") {
    throw new TypeError(`${label} must be non-empty base64`);
  }
  const buffer = Buffer.from(base64, "base64");
  if (buffer.byteLength !== rows * width * 4) {
    throw new Error(`${label} byte length disagrees with matrix shape`);
  }
  return buffer;
}

function validateBatch(batch, records) {
  if (batch?.schema !== BATCH_SCHEMA) throw new Error("invalid feedback GTE compile batch");
  if (batch.dtype !== "float32-le") throw new Error("feedback GTE batch must use float32-le");
  if (batch.coordinateWidth !== COORDINATE_WIDTH) {
    throw new Error(`feedback GTE batch width must be ${COORDINATE_WIDTH}`);
  }
  const expectedIds = records.map((row) => row.trajectoryId);
  if (JSON.stringify(batch.recordIds) !== JSON.stringify(expectedIds)) {
    throw new Error("feedback GTE batch record order disagrees with compile input");
  }
  const current = matrixBuffer(
    batch.currentMatrixBase64, records.length, batch.coordinateWidth, "currentMatrixBase64",
  );
  const following = matrixBuffer(
    batch.followingMatrixBase64, records.length, batch.coordinateWidth, "followingMatrixBase64",
  );
  if (batch.currentSha256 && sha256(current) !== batch.currentSha256) {
    throw new Error("feedback GTE current matrix hash mismatch");
  }
  if (batch.followingSha256 && sha256(following) !== batch.followingSha256) {
    throw new Error("feedback GTE following matrix hash mismatch");
  }
  return { current, following };
}

function powershellExecutable() {
  if (process.platform !== "win32") return "pwsh";
  const windows = process.env.SystemRoot || "C:\\Windows";
  return path.join(windows, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
}

function compileRowsWithLocalGte(records) {
  if (!Array.isArray(records) || records.length === 0) {
    throw new TypeError("compileRowsWithLocalGte requires feedback records");
  }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-feedback-gte-"));
  const input = path.join(temp, "input.json");
  const output = path.join(temp, "output.json");
  try {
    fs.writeFileSync(input, `${JSON.stringify({
      schema: INPUT_SCHEMA,
      records: records.map((row) => ({
        recordId: row.trajectoryId,
        current: row.activationQ || row.currentQ,
        following: row.followingQ,
      })),
    })}\n`, "utf8");
    const runner = path.resolve(__dirname, "run-player-feedback-gte-compile.ps1");
    const result = spawnSync(powershellExecutable(), [
      "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", runner,
      "-InputPath", input, "-OutputPath", output,
    ], {
      cwd: __dirname,
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    if (result.status !== 0) {
      throw new Error(`local GTE feedback compile failed (${result.status}): ${result.stderr || result.stdout}`);
    }
    if (!fs.existsSync(output)) throw new Error("local GTE feedback compiler produced no output");
    return JSON.parse(fs.readFileSync(output, "utf8"));
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

function overlayBuffers(overlay) {
  const rows = overlay.recordIds.length;
  return {
    current: matrixBuffer(
      overlay.currentMatrixBase64, rows, overlay.coordinateWidth, "currentMatrixBase64",
    ),
    following: matrixBuffer(
      overlay.followingMatrixBase64, rows, overlay.coordinateWidth, "followingMatrixBase64",
    ),
  };
}

function validateFeedbackGteOverlay(overlay, trajectories) {
  if (overlay == null) return null;
  if (overlay.schema !== OVERLAY_SCHEMA) throw new Error("invalid player feedback GTE overlay");
  if (overlay.dtype !== "float32-le" || overlay.coordinateWidth !== COORDINATE_WIDTH) {
    throw new Error("player feedback GTE overlay matrix format is invalid");
  }
  if (!Array.isArray(overlay.recordIds) || new Set(overlay.recordIds).size !== overlay.recordIds.length) {
    throw new Error("player feedback GTE overlay record IDs are invalid");
  }
  const byId = new Map(trajectories.map((row) => [row.trajectoryId, row]));
  const overlayIds = new Set(overlay.recordIds);
  for (const recordId of overlay.recordIds) {
    const row = byId.get(recordId);
    if (!row || row.compileStatus !== "compiled_matrix") {
      throw new Error(`player feedback GTE overlay references an uncompiled trajectory: ${recordId}`);
    }
  }
  for (const row of trajectories) {
    if (row.compileStatus === "compiled_matrix" && !overlayIds.has(row.trajectoryId)) {
      throw new Error(`compiled feedback trajectory is absent from player GTE overlay: ${row.trajectoryId}`);
    }
  }
  const buffers = overlayBuffers(overlay);
  const fingerprint = sha256(
    Buffer.from(JSON.stringify(overlay.recordIds)), buffers.current, buffers.following,
  );
  if (overlay.fingerprint !== fingerprint) {
    throw new Error("player feedback GTE overlay fingerprint mismatch");
  }
  return clone(overlay);
}

function compileFeedbackGteForLearner({ learner, previousOverlay = null, compiler = compileRowsWithLocalGte }) {
  const state = learner.exportState();
  const trajectories = state.trajectories;
  if (trajectories.length === 0) return null;
  const existing = previousOverlay == null
    ? null
    : validateFeedbackGteOverlay(previousOverlay, trajectories);
  const existingIds = new Set(existing?.recordIds || []);
  const pending = trajectories.filter((row) => !existingIds.has(row.trajectoryId));
  let recordIds = existing?.recordIds || [];
  let current = existing ? overlayBuffers(existing).current : Buffer.alloc(0);
  let following = existing ? overlayBuffers(existing).following : Buffer.alloc(0);
  let encoder = existing?.encoder || null;
  let slotWeights = existing?.slotWeights || null;
  if (pending.length > 0) {
    const compileRecords = pending.map((row) => ({
      ...clone(row),
      currentQ: clone(row.activationQ || row.currentQ),
    }));
    const batch = compiler(compileRecords);
    const compiled = validateBatch(batch, pending);
    if (encoder && batch.encoder !== encoder) {
      throw new Error("cannot append feedback vectors from a different GTE encoder");
    }
    encoder = batch.encoder;
    slotWeights = batch.slotWeights;
    recordIds = [...recordIds, ...batch.recordIds];
    current = Buffer.concat([current, compiled.current]);
    following = Buffer.concat([following, compiled.following]);
  }
  const fingerprint = sha256(Buffer.from(JSON.stringify(recordIds)), current, following);
  const overlay = {
    schema: OVERLAY_SCHEMA,
    encoder,
    dtype: "float32-le",
    slotWeights,
    coordinateWidth: COORDINATE_WIDTH,
    recordIds,
    currentMatrixBase64: current.toString("base64"),
    followingMatrixBase64: following.toString("base64"),
    fingerprint,
  };
  const pendingIds = trajectories
    .filter((row) => row.compileStatus === "pending_matrix_compile")
    .map((row) => row.trajectoryId);
  if (pendingIds.length > 0) {
    learner.markMatrixCompiled({
      trajectoryIds: pendingIds,
      manifestRef: `player-feedback-gte:${fingerprint}`,
    });
  }
  validateFeedbackGteOverlay(overlay, learner.exportState().trajectories);
  return overlay;
}

function dotRows(buffer, width, leftRow, rightRow) {
  let score = 0;
  const leftOffset = leftRow * width * 4;
  const rightOffset = rightRow * width * 4;
  for (let column = 0; column < width; column += 1) {
    score += buffer.readFloatLE(leftOffset + column * 4)
      * buffer.readFloatLE(rightOffset + column * 4);
  }
  return score;
}

function dotRowVector(buffer, vector, width, row) {
  if (!Buffer.isBuffer(vector) || vector.byteLength !== width * 4) {
    throw new TypeError(`query vector must be a ${width}-float buffer`);
  }
  let score = 0;
  const rowOffset = row * width * 4;
  for (let column = 0; column < width; column += 1) {
    score += buffer.readFloatLE(rowOffset + column * 4)
      * vector.readFloatLE(column * 4);
  }
  return score;
}

function compileQueryVectorsWithGte(queries, compiler = compileRowsWithLocalGte) {
  if (!Array.isArray(queries) || queries.length === 0) {
    throw new TypeError("compileQueryVectorsWithGte requires at least one five-slot query");
  }
  queries.forEach((q) => assertFiveSlotQ(q));
  const records = queries.map((q, index) => ({
    trajectoryId: `planning-query-${String(index + 1).padStart(4, "0")}`,
    currentQ: clone(q),
    followingQ: clone(q),
  }));
  const batch = compiler(clone(records));
  const compiled = validateBatch(batch, records);
  return {
    encoder: batch.encoder,
    coordinateWidth: batch.coordinateWidth,
    vectors: records.map((record, index) => ({
      queryId: record.trajectoryId,
      vector: Buffer.from(compiled.current.subarray(
        index * batch.coordinateWidth * 4,
        (index + 1) * batch.coordinateWidth * 4,
      )),
    })),
  };
}

class PlayerFeedbackGteMemory {
  constructor({ overlay, trajectories, memories = [], chains = [] }) {
    this.overlay = validateFeedbackGteOverlay(overlay, trajectories);
    this.kind = "player_feedback_real_gte_matrix";
    const buffers = overlayBuffers(this.overlay);
    this.current = buffers.current;
    this.following = buffers.following;
    this.memoriesById = new Map(memories.map((row) => [row.memoryId, clone(row)]));
    const byId = new Map(trajectories.map((row) => [row.trajectoryId, clone(row)]));
    this.rows = this.overlay.recordIds.map((recordId, matrixRow) => ({
      matrixRow,
      trajectory: byId.get(recordId),
    }));
    this.queryRowByQ = new Map();
    this.followingRowByQ = new Map();
    for (const row of this.rows) {
      const key = canonicalQ(row.trajectory.activationQ || row.trajectory.currentQ);
      if (!this.queryRowByQ.has(key)) this.queryRowByQ.set(key, row.matrixRow);
      const rawCurrentKey = canonicalQ(row.trajectory.currentQ);
      if (!this.queryRowByQ.has(rawCurrentKey)) {
        this.queryRowByQ.set(rawCurrentKey, row.matrixRow);
      }
      const followingKey = canonicalQ(row.trajectory.followingQ);
      if (!this.followingRowByQ.has(followingKey)) {
        this.followingRowByQ.set(followingKey, row.matrixRow);
      }
    }
    this.chainByPair = new Map(chains.map((row) => [
      `${row.fromTrajectoryId}\u0000${row.toTrajectoryId}`,
      clone(row),
    ]));
  }

  query(q, {
    context = {}, operations = null, previousTrajectoryId = null, topK = 4, threshold = 0.55,
  } = {}) {
    assertFiveSlotQ(q);
    if (!Number.isInteger(topK) || topK <= 0) throw new TypeError("topK must be positive");
    const activationQ = operations == null ? q : jointTransitionQ(q, operations);
    const queryRow = this.queryRowByQ.get(canonicalQ(activationQ))
      ?? this.queryRowByQ.get(canonicalQ(q));
    if (queryRow === undefined) return [];
    const offset = queryRow * this.overlay.coordinateWidth * 4;
    const vector = Buffer.from(this.current.subarray(
      offset, offset + this.overlay.coordinateWidth * 4,
    ));
    return this.queryVector(vector, {
      context, operations, previousTrajectoryId, topK, threshold,
    });
  }

  queryVector(vector, {
    context = null, operations = null, previousTrajectoryId = null, topK = 4, threshold = 0.55,
  } = {}) {
    if (!Number.isInteger(topK) || topK <= 0) throw new TypeError("topK must be positive");
    const sequenceKey = operations == null ? null : operationSequenceKey(operations);
    return this.rows
      .filter((row) => context == null || contextMatches(row.trajectory.applicability, context))
      .filter((row) => sequenceKey == null
        || row.trajectory.operationSequenceExplicit === false
        || row.trajectory.operationSequenceExplicit == null
        || row.trajectory.operationSequenceKey === sequenceKey)
      .map((row) => {
        const activation = dotRowVector(
          this.current, vector, this.overlay.coordinateWidth, row.matrixRow,
        );
        const chain = previousTrajectoryId == null ? null : this.chainByPair.get(
          `${previousTrajectoryId}\u0000${row.trajectory.trajectoryId}`,
        );
        return {
          activation,
          rankScore: activation + (chain?.chainingStrength || 0) * 0.1,
          matrixKind: this.kind,
          chain: chain ? clone(chain) : null,
          trajectory: clone(row.trajectory),
          supportingMemoryIds: clone(row.trajectory.supportingMemoryIds || []),
          supportingMemories: (row.trajectory.supportingMemoryIds || [])
            .map((id) => clone(this.memoriesById.get(id)))
            .filter(Boolean),
        };
      })
      .filter((row) => row.activation >= threshold)
      .sort((left, right) => (
        right.rankScore - left.rankScore
        || right.trajectory.support - left.trajectory.support
        || left.trajectory.trajectoryId.localeCompare(right.trajectory.trajectoryId)
      ))
      .slice(0, Math.min(topK, this.rows.length));
  }

  queryFollowingVector(vector, {
    context = null, operations = null, topK = 4, threshold = 0.55,
  } = {}) {
    if (!Number.isInteger(topK) || topK <= 0) throw new TypeError("topK must be positive");
    const sequenceKey = operations == null ? null : operationSequenceKey(operations);
    return this.rows
      .filter((row) => context == null || contextMatches(row.trajectory.applicability, context))
      .filter((row) => sequenceKey == null
        || row.trajectory.operationSequenceExplicit === false
        || row.trajectory.operationSequenceExplicit == null
        || row.trajectory.operationSequenceKey === sequenceKey)
      .map((row) => {
        const activation = dotRowVector(
          this.following, vector, this.overlay.coordinateWidth, row.matrixRow,
        );
        return {
          activation,
          rankScore: activation,
          matrixKind: this.kind,
          trajectory: clone(row.trajectory),
          supportingMemoryIds: clone(row.trajectory.supportingMemoryIds || []),
          supportingMemories: (row.trajectory.supportingMemoryIds || [])
            .map((id) => clone(this.memoriesById.get(id)))
            .filter(Boolean),
        };
      })
      .filter((row) => row.activation >= threshold)
      .sort((left, right) => right.rankScore - left.rankScore
        || right.trajectory.support - left.trajectory.support
        || left.trajectory.trajectoryId.localeCompare(right.trajectory.trajectoryId))
      .slice(0, Math.min(topK, this.rows.length));
  }

  queryPair(currentQ, followingQ, {
    context = null, operations = null, topK = 4, threshold = 0.55,
  } = {}) {
    assertFiveSlotQ(currentQ, "pair currentQ");
    assertFiveSlotQ(followingQ, "pair followingQ");
    if (!Number.isInteger(topK) || topK <= 0) throw new TypeError("topK must be positive");
    const activationQ = operations == null ? currentQ : jointTransitionQ(currentQ, operations);
    const currentRow = this.queryRowByQ.get(canonicalQ(activationQ))
      ?? this.queryRowByQ.get(canonicalQ(currentQ));
    const followingRow = this.followingRowByQ.get(canonicalQ(followingQ));
    if (currentRow === undefined || followingRow === undefined) return [];
    const width = this.overlay.coordinateWidth;
    const currentOffset = currentRow * width * 4;
    const followingOffset = followingRow * width * 4;
    return this.queryPairVectors(
      Buffer.from(this.current.subarray(currentOffset, currentOffset + width * 4)),
      Buffer.from(this.following.subarray(followingOffset, followingOffset + width * 4)),
      { context, operations, topK, threshold },
    );
  }

  queryPairVectors(currentVector, followingVector, {
    context = null, operations = null, topK = 4, threshold = 0.55,
  } = {}) {
    if (!Number.isInteger(topK) || topK <= 0) throw new TypeError("topK must be positive");
    const sequenceKey = operations == null ? null : operationSequenceKey(operations);
    return this.rows
      .filter((row) => context == null || contextMatches(row.trajectory.applicability, context))
      .filter((row) => sequenceKey == null
        || row.trajectory.operationSequenceExplicit === false
        || row.trajectory.operationSequenceExplicit == null
        || row.trajectory.operationSequenceKey === sequenceKey)
      .map((row) => {
        const currentActivation = dotRowVector(
          this.current, currentVector, this.overlay.coordinateWidth, row.matrixRow,
        );
        const followingActivation = dotRowVector(
          this.following, followingVector, this.overlay.coordinateWidth, row.matrixRow,
        );
        const pairActivation = Math.min(currentActivation, followingActivation);
        return {
          activation: pairActivation,
          currentActivation,
          followingActivation,
          rankScore: (currentActivation + followingActivation) / 2,
          matrixKind: this.kind,
          trajectory: clone(row.trajectory),
          supportingMemoryIds: clone(row.trajectory.supportingMemoryIds || []),
          supportingMemories: (row.trajectory.supportingMemoryIds || [])
            .map((id) => clone(this.memoriesById.get(id)))
            .filter(Boolean),
        };
      })
      .filter((row) => row.activation >= threshold)
      .sort((left, right) => right.rankScore - left.rankScore
        || right.trajectory.support - left.trajectory.support
        || left.trajectory.trajectoryId.localeCompare(right.trajectory.trajectoryId))
      .slice(0, Math.min(topK, this.rows.length));
  }
}

module.exports = {
  COORDINATE_WIDTH,
  OVERLAY_SCHEMA,
  PlayerFeedbackGteMemory,
  compileFeedbackGteForLearner,
  compileQueryVectorsWithGte,
  compileRowsWithLocalGte,
  validateFeedbackGteOverlay,
};
