"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ARTIFACT = path.join(__dirname, "artifacts", "semantic-space.json");

function loadSemanticSpace(file = ARTIFACT) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  if (payload.schema !== "ufs_planning_semantic_space_v0") throw new Error(`unexpected semantic schema: ${payload.schema}`);
  if (payload.dimensions !== 768) throw new Error(`expected 768 dimensions, got ${payload.dimensions}`);
  return payload;
}

function dot(a, b) {
  let total = 0;
  for (let index = 0; index < a.length; index += 1) total += a[index] * b[index];
  return total;
}

function normalize(vector) {
  const norm = Math.sqrt(dot(vector, vector));
  return norm > 1e-12 ? vector.map((value) => value / norm) : vector.map(() => 0);
}

function weightedVector(space, weightedConcepts) {
  const vector = Array(space.dimensions).fill(0);
  for (const [conceptId, weight] of Object.entries(weightedConcepts)) {
    if (!weight) continue;
    const concept = space.concepts[conceptId];
    if (!concept) throw new Error(`unknown semantic concept: ${conceptId}`);
    for (let index = 0; index < vector.length; index += 1) vector[index] += concept.vector[index] * weight;
  }
  return normalize(vector);
}

module.exports = { ARTIFACT, dot, loadSemanticSpace, normalize, weightedVector };
