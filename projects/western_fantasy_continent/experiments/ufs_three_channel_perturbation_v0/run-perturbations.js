"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  compileQueryVectorsWithGte,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");

const HERE = __dirname;
const HIGH_EPSILON = 0.0005;
const RELATION_FIELDS = ["objectType", "objectState", "phase", "energy", "research"];
const TARGET_ID = "research-two-step-target";

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${stable(value[key])}`
    )).join(",")}}`;
  }
  return JSON.stringify(value);
}

function fieldPresent(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key) && object[key] !== undefined;
}

function relationCoverage(relation) {
  const knownFields = RELATION_FIELDS.filter((key) => fieldPresent(relation, key));
  return {
    knownFields,
    missingFields: RELATION_FIELDS.filter((key) => !knownFields.includes(key)),
    ratio: knownFields.length / RELATION_FIELDS.length,
    full: knownFields.length === RELATION_FIELDS.length,
  };
}

function relationQ(relation, side) {
  const valueLabel = side === "before" ? "before" : "after";
  const objectParts = [
    fieldPresent(relation, "objectType") ? `object.type=${relation.objectType}` : null,
    fieldPresent(relation, "objectState") ? `object.state=${relation.objectState}` : null,
  ].filter(Boolean);
  const valueParts = [
    fieldPresent(relation, "energy") ? `energy.${valueLabel}=${relation.energy}` : null,
    fieldPresent(relation, "research") ? `research.${valueLabel}=${relation.research}` : null,
  ].filter(Boolean);
  const temporalParts = [
    fieldPresent(relation, "phase") ? `phase.${valueLabel}=${relation.phase}` : null,
    `boundary=${side}_operations`,
  ];
  return {
    affected_object: objectParts.join(";") || "object.relation=unobserved",
    change_trend: valueParts.join(";") || "track.relation=unobserved",
    cause_relation: "relation.schema=typed_transition_v0;relation.role=state_endpoint",
    temporal_state: temporalParts.join(";"),
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
      steps.push({ index, typeExact: false, missingStep: true, missingQueryParameters: [], conflicts: [] });
      continue;
    }
    const queryParameterKeys = Object.keys(query).filter((key) => key !== "type").sort();
    const candidateParameterKeys = Object.keys(candidate).filter((key) => key !== "type").sort();
    const missingQueryParameters = candidateParameterKeys.filter((key) => (
      !Object.prototype.hasOwnProperty.call(query, key)
    ));
    const matchedParameters = [];
    const conflicts = [];
    for (const key of queryParameterKeys) {
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
      missingQueryParameters,
      matchedParameters,
      conflicts,
    });
  }
  const typeOrderExact = countExact && steps.every((row) => row.typeExact);
  const hasConflict = !countExact || steps.some((row) => (
    row.missingStep || !row.typeExact || row.conflicts.length > 0
  ));
  const exact = stable(queryOperations) === stable(candidateOperations);
  const hasOmission = steps.some((row) => row.missingQueryParameters.length > 0);
  return {
    status: exact ? "exact" : (hasConflict ? "conflict" : "compatible"),
    exact,
    compatible: !hasConflict,
    countExact,
    typeOrderExact,
    hasOmission,
    steps,
  };
}

function classify({ beforeHigh, beforeCoverage, operation, afterHigh, afterCoverage }) {
  const operationUsable = operation.exact || operation.status === "compatible";
  if (beforeHigh && beforeCoverage.full && operation.exact
    && afterHigh && afterCoverage.full) return "complete_convergence";
  if (beforeHigh && operationUsable && afterHigh) return "partial_convergence";
  if (beforeHigh && afterHigh && operation.status === "conflict") {
    return "endpoint_convergence_operation_conflict";
  }
  if (beforeHigh && operationUsable) return "method_convergence";
  if (operationUsable && afterHigh) return "result_convergence";
  if (beforeHigh && afterHigh) return "endpoint_convergence_without_operation";
  if (beforeHigh) return "before_only";
  if (operationUsable) return "operation_only";
  if (afterHigh) return "after_only";
  return "not_high";
}

function makePerturbations(base) {
  const rows = [];
  const add = (id, kind, mutate) => {
    const query = structuredClone(base);
    query.id = id;
    mutate(query);
    rows.push({ id, kind, query });
  };
  add("baseline", "baseline", () => {});
  add("missing-before-energy", "missing", (query) => { delete query.before.energy; });
  add("missing-after-research", "missing", (query) => { delete query.after.research; });
  add("missing-operation-advance-steps", "missing", (query) => {
    delete query.operations[1].advanceSteps;
  });
  add("wrong-operation-advance-zero", "inconsistent_error", (query) => {
    query.operations[1].advanceSteps = 0;
  });
  add("wrong-after-research-zero", "inconsistent_error", (query) => {
    query.after.research = 0;
  });
  add("wrong-before-object-energy", "inconsistent_error", (query) => {
    query.before.objectType = "energy_room";
  });
  add("reversed-operation-order", "coherent_wrong_input", (query) => {
    query.operations.reverse();
  });
  return rows;
}

function main() {
  const fixture = JSON.parse(fs.readFileSync(path.resolve(
    HERE,
    "../ufs_structured_relation_activation_v0/fixture.json",
  ), "utf8"));
  const base = fixture.queries.find((row) => row.id === "target-paraphrase-1");
  const perturbations = makePerturbations(base);
  const specs = [];
  for (const candidate of fixture.candidates) {
    specs.push({ key: `candidate:${candidate.id}:before`, q: relationQ(candidate.before, "before") });
    specs.push({ key: `candidate:${candidate.id}:after`, q: relationQ(candidate.after, "after") });
  }
  for (const row of perturbations) {
    specs.push({ key: `query:${row.id}:before`, q: relationQ(row.query.before, "before") });
    specs.push({ key: `query:${row.id}:after`, q: relationQ(row.query.after, "after") });
  }
  const compiled = compileQueryVectorsWithGte(specs.map((row) => row.q));
  const vectors = new Map(specs.map((row, index) => [row.key, compiled.vectors[index].vector]));
  const runs = perturbations.map((row) => {
    const beforeCoverage = relationCoverage(row.query.before);
    const afterCoverage = relationCoverage(row.query.after);
    const raw = fixture.candidates.map((candidate) => ({
      candidateId: candidate.id,
      beforeSimilarity: dot(
        vectors.get(`query:${row.id}:before`),
        vectors.get(`candidate:${candidate.id}:before`),
      ),
      operation: operationMatch(row.query.operations, candidate.operations),
      afterSimilarity: dot(
        vectors.get(`query:${row.id}:after`),
        vectors.get(`candidate:${candidate.id}:after`),
      ),
    }));
    const bestBefore = Math.max(...raw.map((candidate) => candidate.beforeSimilarity));
    const bestAfter = Math.max(...raw.map((candidate) => candidate.afterSimilarity));
    const candidates = raw.map((candidate) => {
      const beforeHigh = bestBefore - candidate.beforeSimilarity <= HIGH_EPSILON;
      const afterHigh = bestAfter - candidate.afterSimilarity <= HIGH_EPSILON;
      return {
        ...candidate,
        beforeHigh,
        afterHigh,
        activationClass: classify({
          ...candidate,
          beforeHigh,
          beforeCoverage,
          afterHigh,
          afterCoverage,
        }),
      };
    });
    return {
      perturbationId: row.id,
      kind: row.kind,
      beforeCoverage,
      afterCoverage,
      completeConvergenceIds: candidates.filter((candidate) => (
        candidate.activationClass === "complete_convergence"
      )).map((candidate) => candidate.candidateId),
      targetClass: candidates.find((candidate) => candidate.candidateId === TARGET_ID)
        ?.activationClass,
      candidates,
    };
  });
  const missing = runs.filter((row) => row.kind === "missing");
  const inconsistent = runs.filter((row) => row.kind === "inconsistent_error");
  const reversed = runs.find((row) => row.perturbationId === "reversed-operation-order");
  const output = {
    schema: "ufs_three_channel_perturbation_result_v0",
    encoder: compiled.encoder,
    highEpsilon: HIGH_EPSILON,
    aggregation: null,
    checks: {
      baselineUniquelyCompletesTarget: runs[0].completeConvergenceIds.length === 1
        && runs[0].completeConvergenceIds[0] === TARGET_ID,
      missingNeverCompletes: missing.every((row) => row.completeConvergenceIds.length === 0),
      missingKeepsTargetPartial: missing.every((row) => row.targetClass === "partial_convergence"),
      inconsistentErrorsNeverComplete: inconsistent.every((row) => (
        row.completeConvergenceIds.length === 0
      )),
      reversedUniquelyCompletesReversedMemory: reversed.completeConvergenceIds.length === 1
        && reversed.completeConvergenceIds[0] === "research-reversed-order-confuser",
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

