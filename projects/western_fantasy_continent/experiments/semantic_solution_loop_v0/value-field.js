"use strict";

function normalize(vector) {
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  return norm > 1e-12 ? vector.map((value) => value / norm) : vector.map(() => 0);
}

function dot(left, right) {
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result += left[index] * right[index];
  return result;
}

class ValueField {
  constructor({
    directRadius = 0.025,
    conceptRadius = 0.06,
    priorValue = 0.5,
    priorMass = 0.2,
    referenceCoordinates = [],
  } = {}) {
    this.directRadius = directRadius;
    this.conceptRadius = conceptRadius;
    this.priorValue = priorValue;
    this.priorMass = priorMass;
    this.referenceCoordinates = referenceCoordinates.map(normalize);
    this.anchors = [];
  }

  clone() {
    const next = new ValueField({
      directRadius: this.directRadius,
      conceptRadius: this.conceptRadius,
      priorValue: this.priorValue,
      priorMass: this.priorMass,
      referenceCoordinates: this.referenceCoordinates,
    });
    next.anchors = structuredClone(this.anchors);
    return next;
  }

  addTeamResult({ coordinate, context, utility, weight = 1, source }) {
    this.addAnchor({ coordinate, context, utility, weight, radius: this.directRadius, kind: "team_result", source });
  }

  addConceptResult({ coordinate, context, utility, support, source }) {
    if (!(support > 0)) return;
    const center = normalize(coordinate);
    const similarities = this.referenceCoordinates.map((row) => dot(center, row)).sort((a, b) => a - b);
    const activationFloor = quantile(similarities, 0.3);
    const activationCeiling = quantile(similarities, 0.9);
    this.addAnchor({
      coordinate: center,
      context,
      utility,
      weight: support,
      radius: this.conceptRadius,
      kind: "verified_concept",
      source,
      activationFloor,
      activationCeiling,
    });
  }

  addAnchor({ coordinate, context, utility, weight, radius, kind, source, activationFloor, activationCeiling }) {
    this.anchors.push({
      center: normalize(coordinate),
      context,
      utility: clamp01(utility),
      weight: Math.max(0, Number(weight) || 0),
      radius: Math.max(1e-6, Number(radius) || this.directRadius),
      kind,
      source,
      activationFloor,
      activationCeiling,
    });
  }

  evaluate(coordinateInput, context) {
    const coordinate = normalize(coordinateInput);
    const contributions = [];
    for (const anchor of this.anchors) {
      if (anchor.context !== context && anchor.context !== "*") continue;
      const similarity = dot(coordinate, anchor.center);
      const influence = anchor.kind === "verified_concept"
        ? conceptActivation(similarity, anchor.activationFloor, anchor.activationCeiling) * anchor.weight
        : Math.exp(-Math.max(0, 1 - similarity) / anchor.radius) * anchor.weight;
      if (influence <= 1e-10) continue;
      contributions.push({ influence, anchor, similarity });
    }
    const mass = contributions.reduce((sum, row) => sum + row.influence, 0);
    const weighted = contributions.reduce((sum, row) => sum + row.influence * row.anchor.utility, 0);
    const value = (this.priorMass * this.priorValue + weighted) / (this.priorMass + mass);
    const mean = mass > 1e-12 ? weighted / mass : this.priorValue;
    const variance = mass > 1e-12
      ? contributions.reduce((sum, row) => sum + row.influence * ((row.anchor.utility - mean) ** 2), 0) / mass
      : 0.25;
    return {
      value,
      epistemicConfidence: mass / (this.priorMass + mass),
      outcomeVariance: variance,
      evidenceMass: mass,
      strongest: contributions.sort((a, b) => b.influence - a.influence).slice(0, 3).map((row) => ({
        source: row.anchor.source,
        kind: row.anchor.kind,
        utility: row.anchor.utility,
        influence: row.influence,
      })),
    };
  }
}

function adaptiveRadius(coordinates, rank = 5) {
  const distances = coordinates.map((coordinate, rowIndex) => {
    const similarities = coordinates
      .map((other, columnIndex) => rowIndex === columnIndex ? -Infinity : dot(coordinate, other))
      .sort((a, b) => b - a);
    return Math.max(1e-4, 1 - similarities[Math.min(rank - 1, similarities.length - 1)]);
  }).sort((a, b) => a - b);
  const middle = Math.floor(distances.length / 2);
  const median = distances.length % 2 ? distances[middle] : (distances[middle - 1] + distances[middle]) / 2;
  return Math.max(0.006, Math.min(0.25, median * 0.8));
}

function clamp01(value) { return Math.max(0, Math.min(1, Number(value) || 0)); }

function conceptActivation(similarity, floor, ceiling) {
  if (!Number.isFinite(floor) || !Number.isFinite(ceiling) || ceiling <= floor + 1e-9) return 0;
  const relative = clamp01((similarity - floor) / (ceiling - floor));
  return relative * relative;
}

function quantile(sorted, probability) {
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  const weight = position - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

module.exports = { ValueField, adaptiveRadius, dot, normalize };
