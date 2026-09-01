"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  compileQueryVectorsWithGte,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");

const RULE_ARTIFACTS = path.resolve(
  __dirname,
  "../ufs_first_action_imagination_v0/rule_reading_trajectory_v0/artifacts",
);
const MANIFEST_FILE = path.join(RULE_ARTIFACTS, "node_gte_matrix_manifest.json");
const MEMORY_FILE = path.join(__dirname, "planning-affordance-memory.json");
const TOP_K = 8;

function clone(value) {
  return structuredClone(value);
}

function dotRowVector(matrix, vector, width, row) {
  let score = 0;
  const offset = row * width * 4;
  for (let column = 0; column < width; column += 1) {
    score += matrix.readFloatLE(offset + column * 4) * vector.readFloatLE(column * 4);
  }
  return Number(score.toFixed(6));
}

function loadFrozenRuleMatrix() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  const [rows, width] = manifest.currentShape;
  if (manifest.schema !== "ufs_node_precompiled_gte_matrix_v0"
    || manifest.dtype !== "float32-le"
    || rows !== manifest.records.length
    || JSON.stringify(manifest.followingShape) !== JSON.stringify([rows, width])) {
    throw new Error("invalid frozen rule GTE matrix manifest");
  }
  const current = fs.readFileSync(path.join(RULE_ARTIFACTS, manifest.currentMatrixFile));
  const following = fs.readFileSync(path.join(RULE_ARTIFACTS, manifest.followingMatrixFile));
  if (current.byteLength !== rows * width * 4 || following.byteLength !== rows * width * 4) {
    throw new Error("frozen rule GTE matrix shape mismatch");
  }
  return { current, following, manifest, width };
}

function rank(vector, matrix, frozen, topK = TOP_K) {
  return frozen.manifest.records.map((record, matrixRow) => ({
    trajectoryId: record.recordId,
    activation: dotRowVector(matrix, vector, frozen.width, matrixRow),
  })).sort((left, right) => right.activation - left.activation
    || left.trajectoryId.localeCompare(right.trajectoryId)).slice(0, topK);
}

class RulePlanningRecall {
  constructor({ compiler = compileQueryVectorsWithGte } = {}) {
    this.memory = JSON.parse(fs.readFileSync(MEMORY_FILE, "utf8"));
    if (this.memory.schema !== "ufs_rule_planning_affordance_memory_v1") {
      throw new Error("invalid planning affordance memory");
    }
    this.frozen = loadFrozenRuleMatrix();
    const qAfter = this.memory.queries.q_after;
    this.querySpecs = [
      { key: "q_before:visible-multicell-room", route: "q_before", q: this.memory.queries.q_before },
      ...Object.entries(qAfter).map(([role, q]) => ({
        key: `q_after:${role}`, route: "q_after", role, q,
      })),
    ];
    const compiled = compiler(this.querySpecs.map((row) => row.q));
    if (compiled.coordinateWidth !== this.frozen.width) {
      throw new Error("planning query encoder width disagrees with rule matrix");
    }
    this.queryVectors = new Map(this.querySpecs.map((spec, index) => [
      spec.key, compiled.vectors[index].vector,
    ]));
    this.encoder = compiled.encoder;
  }

  recall({ response, intent }) {
    const visibleRooms = response.mapView?.rooms || [];
    const hasVisibleMulticellRoom = visibleRooms.some((room) => room.cellIds?.length >= 2);
    const beforeSpec = this.querySpecs[0];
    const beforeRanked = hasVisibleMulticellRoom
      ? rank(this.queryVectors.get(beforeSpec.key), this.frozen.current, this.frozen)
      : [];
    const beforeIds = new Set(beforeRanked.map((row) => row.trajectoryId));
    const beforeAccepted = this.memory.records.filter((record) => (
      record.triggeredBy === "q_before"
      && beforeIds.has(record.sourceTrajectoryId)
      && visibleRooms.some((room) => (
        room.cellIds?.length >= record.applicability.minimumVisibleCellCount
      ))
    )).map(clone);

    const requestedRoles = [...new Set(intent?.priorities || [])];
    const afterRoutes = requestedRoles.map((role) => {
      const key = `q_after:${role}`;
      if (!this.queryVectors.has(key)) return null;
      const ranked = rank(this.queryVectors.get(key), this.frozen.following, this.frozen);
      const ids = new Set(ranked.map((row) => row.trajectoryId));
      const accepted = this.memory.records.filter((record) => (
        record.triggeredBy === "q_after"
        && record.desiredRole === role
        && ids.has(record.sourceTrajectoryId)
      )).map(clone);
      return { route: "q_after", role, queryKey: key, ranked, accepted };
    }).filter(Boolean);

    return {
      schema: "ufs_rule_planning_recall_result_v1",
      encoder: this.encoder,
      qBefore: {
        route: "q_before",
        queryKey: beforeSpec.key,
        sceneHadVisibleMulticellRoom: hasVisibleMulticellRoom,
        ranked: beforeRanked,
        accepted: beforeAccepted,
      },
      qAfter: afterRoutes,
    };
  }
}

module.exports = {
  MEMORY_FILE,
  RulePlanningRecall,
  loadFrozenRuleMatrix,
};
