"use strict";

const fs = require("fs");
const path = require("path");
const SEMANTIC = require("../../../semantic-space");
const RULE_READER = require("../rule-knowledge-reader");

const RELATION_FILE = path.join(__dirname, "rule-relations.json");

function loadRelations() {
  const payload = JSON.parse(fs.readFileSync(RELATION_FILE, "utf8"));
  if (payload.schema !== "ufs_acquisition_meaning_relations_v1") throw new Error(`unexpected relation schema: ${payload.schema}`);
  return payload.relations;
}

function buildMeaningState(options = {}) {
  const stage = Number(options.stage || 5);
  const events = new Set(options.events || []);
  const space = options.space || SEMANTIC.loadSemanticSpace();
  const snapshot = RULE_READER.buildRuleCognition({ scope: "first_game" });
  const knownKnowledge = new Set(snapshot.knowledge
    .filter((row) => knowledgeStage(row.id) <= stage)
    .map((row) => row.id));
  const relations = loadRelations().filter((relation) => {
    if (relation.introducedStage > stage) return false;
    if (!relation.sourceKnowledgeIds.every((id) => knownKnowledge.has(id))) return false;
    if (relation.activation === "always") return true;
    return events.has(relation.activation.slice("event:".length));
  });

  const surfaces = buildSurfaces(space, relations);
  const meaning = walkMeaning(space, relations, surfaces, "victory");
  return {
    schema: "ufs_acquisition_meaning_state_v1",
    stage,
    events: [...events],
    dimensions: space.dimensions,
    activeRelations: relations.map((relation) => relation.id),
    surfaces: Object.fromEntries(Object.entries(surfaces).map(([target, surface]) => [target, {
      target,
      anchorRefs: surface.anchorRefs,
      coordinateDimensions: surface.vector.length,
    }])),
    meaning,
  };
}

function buildSurfaces(space, relations) {
  const grouped = new Map();
  for (const relation of relations) {
    if (!grouped.has(relation.acquireTarget)) grouped.set(relation.acquireTarget, []);
    grouped.get(relation.acquireTarget).push(relation);
  }
  const surfaces = {};
  for (const [target, rows] of grouped) {
    const vector = Array(space.dimensions).fill(0);
    for (const row of rows) {
      const anchor = vectorForRef(space, row.sourceRef);
      for (let index = 0; index < vector.length; index += 1) vector[index] += anchor[index];
    }
    surfaces[target] = { vector: SEMANTIC.normalize(vector), anchorRefs: rows.map((row) => row.sourceRef) };
  }
  return surfaces;
}

function walkMeaning(space, relations, surfaces, rootTarget) {
  const records = [];
  const bestByRef = new Map();

  function visit(target, inheritedMeaning, pathTargets, depth) {
    if (depth > 6 || pathTargets.includes(target)) return;
    const surface = surfaces[target];
    if (!surface) return;
    for (const relation of relations.filter((row) => row.acquireTarget === target)) {
      const sourceVector = vectorForRef(space, relation.sourceRef);
      const localCloseness = Math.max(0, SEMANTIC.dot(sourceVector, surface.vector));
      const totalMeaning = inheritedMeaning * localCloseness;
      const record = {
        sourceRef: relation.sourceRef,
        acquireTarget: target,
        relationId: relation.id,
        depth,
        localCloseness: round(localCloseness),
        meaningForVictory: round(totalMeaning),
        path: [...pathTargets, target, relation.sourceRef],
      };
      records.push(record);
      if (!bestByRef.has(relation.sourceRef) || bestByRef.get(relation.sourceRef).meaningForVictory < record.meaningForVictory) {
        bestByRef.set(relation.sourceRef, record);
      }
      const sourceConcept = relation.sourceRef.startsWith("concept:") ? relation.sourceRef.slice("concept:".length) : null;
      if (sourceConcept) visit(sourceConcept, totalMeaning, [...pathTargets, target], depth + 1);
    }
  }

  visit(rootTarget, 1, [], 1);
  return {
    rootTarget,
    ranked: [...bestByRef.values()].sort((a, b) => b.meaningForVictory - a.meaningForVictory || a.depth - b.depth || a.sourceRef.localeCompare(b.sourceRef)),
    allPaths: records,
  };
}

function vectorForRef(space, ref) {
  const [section, id] = ref.split(":");
  const sectionName = section === "concept" ? "concepts" : section === "roomType" ? "roomTypes" : null;
  const row = sectionName && space[sectionName]?.[id];
  if (!row) throw new Error(`unknown semantic ref: ${ref}`);
  return row.vector;
}

function knowledgeStage(id) {
  const stages = RULE_READER.loadStages();
  const stage = stages.find((row) => (row.knowledgeAdded || []).some((knowledge) => knowledge.id === id));
  return stage ? stage.stage : Number.POSITIVE_INFINITY;
}

function round(value) {
  return Math.round(value * 1e6) / 1e6;
}

module.exports = { buildMeaningState, buildSurfaces, loadRelations, walkMeaning };
