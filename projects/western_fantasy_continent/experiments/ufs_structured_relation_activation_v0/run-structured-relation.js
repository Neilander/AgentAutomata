"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  compileQueryVectorsWithGte,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");
const {
  jointTransitionQ,
} = require("../ufs_first_action_imagination_v0/ufs-transition-memory");

const HERE = __dirname;
const ROUTE_TOP_K = 2;

function relationQ(relation, side) {
  const boundary = side === "before" ? "before_operations" : "after_operations";
  const valueLabel = side === "before" ? "before" : "after";
  return {
    affected_object: `object.type=${relation.objectType};object.state=${relation.objectState}`,
    change_trend: `energy.${valueLabel}=${relation.energy};research.${valueLabel}=${relation.research}`,
    cause_relation: "relation.schema=typed_transition_v0;relation.role=state_endpoint",
    temporal_state: `phase.${valueLabel}=${relation.phase};boundary=${boundary}`,
    context: "identity.scope=object_role;episode_ids=excluded",
  };
}

function dot(left, right) {
  let score = 0;
  for (let offset = 0; offset < left.byteLength; offset += 4) {
    score += left.readFloatLE(offset) * right.readFloatLE(offset);
  }
  return score;
}

function rankRows(rows, scoreKey) {
  return [...rows].sort((left, right) => right[scoreKey] - left[scoreKey]
    || left.candidateId.localeCompare(right.candidateId));
}

function rankOf(rows, candidateId) {
  return rows.findIndex((row) => row.candidateId === candidateId) + 1;
}

function vectorSpec(representation, row, side) {
  const semantic = side === "before" ? row.semanticBeforeQ : row.semanticFollowingQ;
  if (representation === "semantic_endpoints") return semantic;
  if (representation === "semantic_with_operations") {
    return side === "before" ? jointTransitionQ(semantic, row.operations) : semantic;
  }
  const structured = relationQ(side === "before" ? row.before : row.after, side);
  return side === "before" ? jointTransitionQ(structured, row.operations) : structured;
}

function main() {
  const fixture = JSON.parse(fs.readFileSync(path.join(HERE, "fixture.json"), "utf8"));
  const representations = [
    "semantic_endpoints",
    "semantic_with_operations",
    "structured_with_operations",
  ];
  const specs = [];
  for (const representation of representations) {
    for (const candidate of fixture.candidates) {
      for (const side of ["before", "after"]) {
        specs.push({
          key: `${representation}:candidate:${candidate.id}:${side}`,
          q: vectorSpec(representation, candidate, side),
        });
      }
    }
    for (const query of fixture.queries) {
      for (const side of ["before", "after"]) {
        specs.push({
          key: `${representation}:query:${query.id}:${side}`,
          q: vectorSpec(representation, query, side),
        });
      }
    }
  }
  const compiled = compileQueryVectorsWithGte(specs.map((row) => row.q));
  const vectors = new Map(specs.map((row, index) => [row.key, compiled.vectors[index].vector]));
  const runs = [];
  for (const representation of representations) {
    for (const query of fixture.queries) {
      const beforeQuery = vectors.get(`${representation}:query:${query.id}:before`);
      const afterQuery = vectors.get(`${representation}:query:${query.id}:after`);
      const scores = fixture.candidates.map((candidate) => {
        const beforeSimilarity = dot(
          beforeQuery,
          vectors.get(`${representation}:candidate:${candidate.id}:before`),
        );
        const afterSimilarity = dot(
          afterQuery,
          vectors.get(`${representation}:candidate:${candidate.id}:after`),
        );
        return {
          candidateId: candidate.id,
          beforeSimilarity: Number(beforeSimilarity.toFixed(6)),
          afterSimilarity: Number(afterSimilarity.toFixed(6)),
          jointSimilarity: Number(((beforeSimilarity + afterSimilarity) / 2).toFixed(6)),
        };
      });
      const before = rankRows(scores, "beforeSimilarity");
      const after = rankRows(scores, "afterSimilarity");
      const joint = rankRows(scores, "jointSimilarity");
      const union = [...new Set([
        ...before.slice(0, ROUTE_TOP_K).map((row) => row.candidateId),
        ...after.slice(0, ROUTE_TOP_K).map((row) => row.candidateId),
        ...joint.slice(0, ROUTE_TOP_K).map((row) => row.candidateId),
      ])];
      runs.push({
        representation,
        queryId: query.id,
        expectedId: query.expectedId,
        expectedRanks: {
          before: rankOf(before, query.expectedId),
          after: rankOf(after, query.expectedId),
          joint: rankOf(joint, query.expectedId),
        },
        routeLeaders: {
          before: before[0].candidateId,
          after: after[0].candidateId,
          joint: joint[0].candidateId,
        },
        unionTop2: union,
        expectedInUnion: union.includes(query.expectedId),
        scores,
      });
    }
  }
  const structured = runs.filter((row) => row.representation === "structured_with_operations");
  const targetStructured = structured.filter((row) => row.queryId.startsWith("target-paraphrase"));
  const checks = {
    structuredAllJointTop1: structured.every((row) => row.expectedRanks.joint === 1),
    structuredAllExpectedInUnion: structured.every((row) => row.expectedInUnion),
    targetParaphrasesStable: new Set(targetStructured.map((row) => (
      JSON.stringify(row.expectedRanks)
    ))).size === 1,
    noEpisodeIdsInFixture: !/(die:|cellId|roomId|ticket|feedback-trajectory)/.test(
      JSON.stringify(fixture),
    ),
  };
  process.stdout.write(`${JSON.stringify({
    schema: "ufs_structured_relation_activation_result_v0",
    encoder: compiled.encoder,
    candidateCount: fixture.candidates.length,
    queryCount: fixture.queries.length,
    compiledVectorCount: specs.length,
    routeTopK: ROUTE_TOP_K,
    checks,
    allFrozenChecksPassed: Object.values(checks).every(Boolean),
    runs,
  }, null, 2)}\n`);
}

main();

