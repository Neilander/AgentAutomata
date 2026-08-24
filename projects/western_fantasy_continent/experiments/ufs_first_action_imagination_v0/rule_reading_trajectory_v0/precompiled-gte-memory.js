"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  SLOT_KEYS,
  assertFiveSlotQ,
} = require("../../imagination_pipeline_v0/five-slot-activation");

const ARTIFACTS = path.resolve(__dirname, "artifacts");
const DEFAULT_MANIFEST = path.join(ARTIFACTS, "node_gte_matrix_manifest.json");

function canonicalQ(q) {
  assertFiveSlotQ(q);
  return JSON.stringify(SLOT_KEYS.map((key) => q[key]));
}

function loadArtifacts(manifestPath = DEFAULT_MANIFEST) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (manifest.schema !== "ufs_node_precompiled_gte_matrix_v0") {
    throw new Error(`unsupported GTE matrix manifest: ${manifest.schema}`);
  }
  if (manifest.dtype !== "float32-le") {
    throw new Error(`unsupported GTE matrix dtype: ${manifest.dtype}`);
  }
  const [rows, width] = manifest.currentShape;
  if (rows !== manifest.records.length || width !== 3840) {
    throw new Error("GTE current matrix shape disagrees with manifest records");
  }
  const matrixPath = path.resolve(path.dirname(manifestPath), manifest.currentMatrixFile);
  const current = fs.readFileSync(matrixPath);
  if (current.byteLength !== rows * width * 4) {
    throw new Error("GTE current matrix byte length is invalid");
  }
  const rowById = new Map();
  const queryRowByQ = new Map();
  manifest.records.forEach((record, index) => {
    rowById.set(record.recordId, index);
    const key = canonicalQ(record.current);
    if (!queryRowByQ.has(key)) queryRowByQ.set(key, index);
  });
  return {
    current,
    manifest,
    queryRowByQ,
    rowById,
    width,
  };
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

class PrecompiledGteTrajectoryMemory {
  constructor(trajectories, { manifestPath = DEFAULT_MANIFEST } = {}) {
    if (!Array.isArray(trajectories) || trajectories.length === 0) {
      throw new TypeError("trajectories must be a non-empty array");
    }
    this.kind = "precompiled_real_gte_matrix";
    this.artifacts = loadArtifacts(manifestPath);
    const recordById = new Map(
      this.artifacts.manifest.records.map((record) => [record.recordId, record]),
    );
    this.rows = trajectories.map((trajectory) => {
      const matrixRow = this.artifacts.rowById.get(trajectory.id);
      const record = recordById.get(trajectory.id);
      if (matrixRow === undefined || !record) {
        throw new Error(`trajectory is absent from GTE matrix: ${trajectory.id}`);
      }
      if (canonicalQ(trajectory.triggerQ) !== canonicalQ(record.current)) {
        throw new Error(`trajectory current Q disagrees with GTE matrix: ${trajectory.id}`);
      }
      return {
        matrixRow,
        observations: Number(record.observations),
        support: Number(record.support),
        trajectory,
      };
    });
  }

  query(q, { topK = 4 } = {}) {
    assertFiveSlotQ(q);
    if (!Number.isInteger(topK) || topK <= 0) {
      throw new TypeError("topK must be a positive integer");
    }
    const queryRow = this.artifacts.queryRowByQ.get(canonicalQ(q));
    if (queryRow === undefined) return [];
    return this.rows
      .map((row) => ({
        activation: dotRows(
          this.artifacts.current,
          this.artifacts.width,
          row.matrixRow,
          queryRow,
        ),
        connectionStrength: row.support,
        matrixKind: this.kind,
        observations: row.observations,
        support: row.support,
        trajectory: row.trajectory,
      }))
      .sort((left, right) => (
        right.activation - left.activation
        || right.support - left.support
        || left.trajectory.id.localeCompare(right.trajectory.id)
      ))
      .slice(0, Math.min(topK, this.rows.length));
  }

  reinforce(edgeId, { amount = 1 } = {}) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new TypeError("reinforcement amount must be finite and positive");
    }
    const row = this.rows.find((candidate) => candidate.trajectory.id === edgeId);
    if (!row) throw new Error(`cannot reinforce unknown trajectory: ${edgeId}`);
    row.support += amount;
    row.observations += 1;
    return {
      edgeId,
      observations: row.observations,
      support: row.support,
    };
  }

  exportLearningOverlay() {
    return {
      schema: "ufs_trajectory_connection_learning_overlay_v0",
      records: this.rows.map((row) => ({
        recordId: row.trajectory.id,
        observations: row.observations,
        support: row.support,
      })),
    };
  }
}

module.exports = {
  DEFAULT_MANIFEST,
  PrecompiledGteTrajectoryMemory,
  canonicalQ,
};
