"use strict";

const SLOT_KEYS = Object.freeze([
  "affected_object",
  "change_trend",
  "cause_relation",
  "temporal_state",
  "context",
]);

function assertFiveSlotQ(q, label = "q") {
  if (!q || typeof q !== "object") {
    throw new TypeError(`${label} must be an object`);
  }
  for (const key of SLOT_KEYS) {
    if (typeof q[key] !== "string" || q[key].trim() === "") {
      throw new TypeError(`${label}.${key} must be a non-empty string`);
    }
  }
  const extra = Object.keys(q).filter((key) => !SLOT_KEYS.includes(key));
  if (extra.length > 0) {
    throw new TypeError(`${label} has non-five-slot fields: ${extra.join(", ")}`);
  }
  return q;
}

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function tokenize(text) {
  return String(text)
    .toLowerCase()
    .split(/[^a-z0-9_\u3400-\u9fff]+/u)
    .map((token) => token.trim())
    .filter(Boolean);
}

function normalize(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}

class DeterministicFiveSlotEncoder {
  constructor({ slotDimensions = 32, slotWeights = {} } = {}) {
    if (!Number.isInteger(slotDimensions) || slotDimensions < 8) {
      throw new TypeError("slotDimensions must be an integer >= 8");
    }
    this.slotDimensions = slotDimensions;
    this.slotWeights = Object.fromEntries(
      SLOT_KEYS.map((key) => [key, Number(slotWeights[key] ?? 1)]),
    );
  }

  encodeSlot(text, slotKey) {
    const vector = Array(this.slotDimensions).fill(0);
    const tokens = tokenize(text);
    for (const token of tokens) {
      const hash = fnv1a(`${slotKey}:${token}`);
      const index = hash % this.slotDimensions;
      const sign = ((hash >>> 8) & 1) === 0 ? 1 : -1;
      vector[index] += sign;
    }
    const weight = this.slotWeights[slotKey];
    return normalize(vector).map((value) => value * weight);
  }

  encode(q) {
    assertFiveSlotQ(q);
    const concatenated = SLOT_KEYS.flatMap((key) => this.encodeSlot(q[key], key));
    return normalize(concatenated);
  }
}

class MatrixTrajectoryMemory {
  constructor(trajectories, { encoder = new DeterministicFiveSlotEncoder() } = {}) {
    if (!Array.isArray(trajectories) || trajectories.length === 0) {
      throw new TypeError("trajectories must be a non-empty array");
    }
    this.encoder = encoder;
    this.trajectories = trajectories.map((trajectory, index) => {
      if (!trajectory || typeof trajectory.id !== "string" || trajectory.id === "") {
        throw new TypeError(`trajectory[${index}].id must be a non-empty string`);
      }
      assertFiveSlotQ(trajectory.triggerQ, `trajectory[${index}].triggerQ`);
      return Object.freeze({ ...trajectory });
    });
    this.width = this.encoder.encode(this.trajectories[0].triggerQ).length;
    this.matrix = new Float64Array(this.trajectories.length * this.width);
    this.trajectories.forEach((trajectory, row) => {
      const vector = this.encoder.encode(trajectory.triggerQ);
      if (vector.length !== this.width) {
        throw new Error("encoder returned inconsistent vector width");
      }
      this.matrix.set(vector, row * this.width);
    });
  }

  query(q, { topK = 4 } = {}) {
    assertFiveSlotQ(q);
    if (!Number.isInteger(topK) || topK <= 0) {
      throw new TypeError("topK must be a positive integer");
    }
    const queryVector = this.encoder.encode(q);
    const scored = this.trajectories.map((trajectory, row) => {
      let activation = 0;
      const offset = row * this.width;
      for (let column = 0; column < this.width; column += 1) {
        activation += this.matrix[offset + column] * queryVector[column];
      }
      return { trajectory, activation };
    });
    scored.sort((left, right) => (
      right.activation - left.activation
      || left.trajectory.id.localeCompare(right.trajectory.id)
    ));
    return scored.slice(0, Math.min(topK, scored.length));
  }
}

module.exports = {
  SLOT_KEYS,
  assertFiveSlotQ,
  DeterministicFiveSlotEncoder,
  MatrixTrajectoryMemory,
};
