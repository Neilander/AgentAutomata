"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  compileQueryVectorsWithGte,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");

const HERE = __dirname;
const HIGH_EPSILON = 0.0005;

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stable(value[key])}`
    )).join(",")}}`;
  }
  return JSON.stringify(value);
}

function relationQ(relation, side) {
  const valueLabel = side === "before" ? "before" : "after";
  return {
    affected_object: `object.type=${relation.objectType};object.state=${relation.objectState}`,
    change_trend: `energy.${valueLabel}=${relation.energy};research.${valueLabel}=${relation.research}`,
    cause_relation: "relation.schema=typed_transition_v0;relation.role=state_endpoint",
    temporal_state: `phase.${valueLabel}=${relation.phase};boundary=${side}_operations`,
    context: "identity.scope=object_role;episode_ids=excluded",
  };
}

function dot(left, right) {
  let score = 0;
  for (let offset = 0; offset < left.byteLength; offset += 4) {
    score += left.readFloatLE(offset) * right.readFloatLE(offset);
  }
  return Number(score.toFixed(6));
}

function operationMatch(queryOperations, candidateOperations) {
  const countExact = queryOperations.length === candidateOperations.length;
  const steps = [];
  const longest = Math.max(queryOperations.length, candidateOperations.length);
  for (let index = 0; index < longest; index += 1) {
    const query = queryOperations[index] || null;
    const candidate = candidateOperations[index] || null;
    if (query == null || candidate == null) {
      steps.push({ index, typeExact: false, missingStep: true, matchedParameters: [], conflicts: [] });
      continue;
    }
    const parameterKeys = [...new Set([
      ...Object.keys(query).filter((key) => key !== "type"),
      ...Object.keys(candidate).filter((key) => key !== "type"),
    ])].sort();
    const matchedParameters = [];
    const conflicts = [];
    for (const key of parameterKeys) {
      if (!Object.prototype.hasOwnProperty.call(query, key)) continue;
      if (Object.prototype.hasOwnProperty.call(candidate, key)
        && stable(query[key]) === stable(candidate[key])) {
        matchedParameters.push(key);
      } else {
        conflicts.push({ key, query: query[key], candidate: candidate[key] });
      }
    }
    steps.push({
      index,
      typeExact: query.type === candidate.type,
      missingStep: false,
      matchedParameters,
      conflicts,
    });
  }
  const typeOrderExact = countExact && steps.every((row) => row.typeExact);
  const hasConflict = !countExact || steps.some((row) => (
    row.missingStep || !row.typeExact || row.conflicts.length > 0
  ));
  const exact = stable(queryOperations) === stable(candidateOperations);
  return {
    status: exact ? "exact" : (hasConflict ? "conflict" : "compatible"),
    exact,
    countExact,
    typeOrderExact,
    steps,
  };
}

function activationClass({ beforeHigh, operation, afterHigh }) {
  if (beforeHigh && operation.exact && afterHigh) return "complete_convergence";
  if (beforeHigh && operation.exact) return "method_convergence";
  if (operation.exact && afterHigh) return "result_convergence";
  if (beforeHigh && afterHigh) return "endpoint_convergence_without_operation";
  if (beforeHigh) return "before_only";
  if (operation.exact) return "operation_only";
  if (afterHigh) return "after_only";
  return "not_high";
}

function main() {
  const fixturePath = path.resolve(
    HERE,
    "../ufs_structured_relation_activation_v0/fixture.json",
  );
  const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
  const specs = [];
  for (const candidate of fixture.candidates) {
    specs.push({ key: `candidate:${candidate.id}:before`, q: relationQ(candidate.before, "before") });
    specs.push({ key: `candidate:${candidate.id}:after`, q: relationQ(candidate.after, "after") });
  }
  for (const query of fixture.queries) {
    specs.push({ key: `query:${query.id}:before`, q: relationQ(query.before, "before") });
    specs.push({ key: `query:${query.id}:after`, q: relationQ(query.after, "after") });
  }
  const compiled = compileQueryVectorsWithGte(specs.map((row) => row.q));
  const vectors = new Map(specs.map((row, index) => [row.key, compiled.vectors[index].vector]));
  const runs = fixture.queries.map((query) => {
    const beforeVector = vectors.get(`query:${query.id}:before`);
    const afterVector = vectors.get(`query:${query.id}:after`);
    const raw = fixture.candidates.map((candidate) => ({
      candidateId: candidate.id,
      beforeSimilarity: dot(beforeVector, vectors.get(`candidate:${candidate.id}:before`)),
      operation: operationMatch(query.operations, candidate.operations),
      afterSimilarity: dot(afterVector, vectors.get(`candidate:${candidate.id}:after`)),
    }));
    const bestBefore = Math.max(...raw.map((row) => row.beforeSimilarity));
    const bestAfter = Math.max(...raw.map((row) => row.afterSimilarity));
    const candidates = raw.map((row) => {
      const beforeHigh = bestBefore - row.beforeSimilarity <= HIGH_EPSILON;
      const afterHigh = bestAfter - row.afterSimilarity <= HIGH_EPSILON;
      return {
        ...row,
        beforeHigh,
        afterHigh,
        activationClass: activationClass({ ...row, beforeHigh, afterHigh }),
      };
    });
    const completeConvergenceIds = candidates
      .filter((row) => row.activationClass === "complete_convergence")
      .map((row) => row.candidateId);
    return {
      queryId: query.id,
      expectedId: query.expectedId,
      bestBefore,
      bestAfter,
      completeConvergenceIds,
      expectedComplete: completeConvergenceIds.length === 1
        && completeConvergenceIds[0] === query.expectedId,
      candidates,
    };
  });
  const targetRuns = runs.filter((row) => row.queryId.startsWith("target-paraphrase"));
  const targetSignatures = targetRuns.map((run) => JSON.stringify(run.candidates.map((row) => ({
    candidateId: row.candidateId,
    beforeHigh: row.beforeHigh,
    operationStatus: row.operation.status,
    afterHigh: row.afterHigh,
    activationClass: row.activationClass,
  }))));
  const output = {
    schema: "ufs_three_channel_multistep_activation_result_v0",
    encoder: compiled.encoder,
    highEpsilon: HIGH_EPSILON,
    candidateCount: fixture.candidates.length,
    queryCount: fixture.queries.length,
    compiledVectorCount: specs.length,
    channels: ["q_before_gte", "operation_structure", "q_after_gte"],
    aggregation: null,
    checks: {
      everyExpectedUniquelyComplete: runs.every((row) => row.expectedComplete),
      targetParaphrasesSameClassification: new Set(targetSignatures).size === 1,
      reversedDistinctFromTarget: runs.find((row) => row.queryId === "reversed-order-query")
        ?.completeConvergenceIds[0] === "research-reversed-order-confuser",
      zeroAdvanceDistinctFromTarget: runs.find((row) => row.queryId === "zero-advance-query")
        ?.completeConvergenceIds[0] === "research-zero-advance-confuser",
      noAverageOrJointField: runs.every((row) => row.candidates.every((candidate) => (
        Object.keys(candidate).every((key) => !/(average|joint|aggregate)/i.test(key))
      ))),
    },
    runs,
  };
  output.allFrozenChecksPassed = Object.values(output.checks).every(Boolean);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main();
