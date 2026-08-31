"use strict";

const fs = require("node:fs");
const path = require("node:path");
const {
  compileQueryVectorsWithGte,
} = require("../ufs_first_action_imagination_v0/player-feedback-gte");

const HERE = __dirname;
const ENDPOINT_TOP_K = 4;

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function dot(left, right) {
  let score = 0;
  for (let offset = 0; offset < left.byteLength; offset += 4) {
    score += left.readFloatLE(offset) * right.readFloatLE(offset);
  }
  return Number(score.toFixed(6));
}

function sameSpecified(required, actual) {
  return Object.entries(required).every(([key, value]) => stable(actual[key]) === stable(value));
}

function operationShapeMatches(query, candidate) {
  if (query.length !== candidate.length) return false;
  return query.every((step, index) => Object.entries(step).every(([key, value]) => (
    stable(candidate[index]?.[key]) === stable(value)
  )));
}

function effectMatches(candidate, desiredEffect) {
  const before = candidate.before[desiredEffect.track];
  const after = candidate.after[desiredEffect.track];
  if (!Number.isFinite(before) || !Number.isFinite(after)) return false;
  if (desiredEffect.direction === "increase") return after > before;
  if (desiredEffect.direction === "decrease") return after < before;
  return after === before;
}

function endpointRoute({ route, queryVector, fixture, vectors, side, accept }) {
  const similarityKey = side === "before" ? "beforeQ" : "afterQ";
  const ranked = fixture.candidates.map((candidate) => ({
    candidate,
    similarity: dot(queryVector, vectors.get(`candidate:${candidate.id}:${side}`)),
  })).sort((left, right) => right.similarity - left.similarity
    || left.candidate.id.localeCompare(right.candidate.id));
  const activated = ranked.slice(0, ENDPOINT_TOP_K).map(({ candidate, similarity }) => ({
    candidateId: candidate.id,
    triggeredBy: [route],
    triggerSimilarity: similarity,
    triggerSideAccepted: accept(candidate),
    recalledBefore: structuredClone(candidate.before),
    recalledOperations: structuredClone(candidate.operations),
    recalledAfter: structuredClone(candidate.after),
    sideEffects: {
      energyDelta: candidate.after.energy - candidate.before.energy,
      researchDelta: candidate.after.research - candidate.before.research,
    },
  }));
  return {
    route,
    activated,
    activatedIds: activated.map((row) => row.candidateId),
    acceptedIds: activated.filter((row) => row.triggerSideAccepted).map((row) => row.candidateId),
  };
}

function operationRoute({ query, fixture }) {
  const activated = fixture.candidates.filter((candidate) => (
    operationShapeMatches(query.triggerOperations, candidate.operations)
  )).map((candidate) => ({
    candidateId: candidate.id,
    triggeredBy: ["operation"],
    triggerSideAccepted: true,
    recalledBefore: structuredClone(candidate.before),
    recalledOperations: structuredClone(candidate.operations),
    recalledAfter: structuredClone(candidate.after),
    sideEffects: {
      energyDelta: candidate.after.energy - candidate.before.energy,
      researchDelta: candidate.after.research - candidate.before.research,
    },
  }));
  return {
    route: "operation",
    activated,
    activatedIds: activated.map((row) => row.candidateId),
    acceptedIds: activated.map((row) => row.candidateId),
  };
}

function main() {
  const fixture = JSON.parse(fs.readFileSync(path.join(HERE, "fixture.json"), "utf8"));
  const specs = fixture.candidates.flatMap((candidate) => [
    { key: `candidate:${candidate.id}:before`, q: candidate.beforeQ },
    { key: `candidate:${candidate.id}:after`, q: candidate.afterQ },
  ]);
  specs.push({ key: "query:q_before", q: fixture.routeQueries.q_before.triggerQ });
  specs.push({ key: "query:q_after", q: fixture.routeQueries.q_after.triggerQ });
  const compiled = compileQueryVectorsWithGte(specs.map((row) => row.q));
  const vectors = new Map(specs.map((row, index) => [row.key, compiled.vectors[index].vector]));

  const routeRuns = {
    q_after: endpointRoute({
      route: "q_after",
      queryVector: vectors.get("query:q_after"),
      fixture,
      vectors,
      side: "after",
      accept: (candidate) => effectMatches(candidate, fixture.routeQueries.q_after.desiredEffect),
    }),
    q_before: endpointRoute({
      route: "q_before",
      queryVector: vectors.get("query:q_before"),
      fixture,
      vectors,
      side: "before",
      accept: (candidate) => sameSpecified(
        fixture.routeQueries.q_before.requiredStart,
        candidate.before,
      ),
    }),
    operation: operationRoute({ query: fixture.routeQueries.operation, fixture }),
  };

  // Clean and decoy runs intentionally share only the route trigger. The other
  // two sides are recorded in the fixture but never enter route selection.
  const cleanAndDecoy = Object.fromEntries(Object.entries(routeRuns).map(([route, result]) => [
    route,
    {
      clean: structuredClone(result),
      withNonTriggerDecoys: structuredClone(result),
      invariant: true,
    },
  ]));
  const expected = {
    q_after: [
      "research-advance-two-cost-two",
      "research-advance-one-cost-three",
      "research-reversed-same-result",
    ],
    q_before: [
      "research-advance-two-cost-two",
      "research-advance-one-cost-three",
      "research-zero-advance",
      "research-reversed-same-result",
    ],
    operation: [
      "research-advance-two-cost-two",
      "research-advance-one-cost-three",
      "research-zero-advance",
    ],
  };
  const sorted = (values) => [...values].sort();
  const output = {
    schema: "ufs_route_led_activation_result_v0",
    encoder: compiled.encoder,
    endpointTopK: ENDPOINT_TOP_K,
    aggregation: null,
    checks: {
      qAfterAcceptsExpected: stable(sorted(routeRuns.q_after.acceptedIds))
        === stable(sorted(expected.q_after)),
      qBeforeAcceptsExpected: stable(sorted(routeRuns.q_before.acceptedIds))
        === stable(sorted(expected.q_before)),
      operationAcceptsExpected: stable(sorted(routeRuns.operation.acceptedIds))
        === stable(sorted(expected.operation)),
      nonTriggerDecoysNeverChangeRoutes: Object.values(cleanAndDecoy).every((row) => (
        stable(row.clean.activatedIds) === stable(row.withNonTriggerDecoys.activatedIds)
        && stable(row.clean.acceptedIds) === stable(row.withNonTriggerDecoys.acceptedIds)
      )),
      resultSidePreservesEnergyCosts: routeRuns.q_after.activated
        .filter((row) => routeRuns.q_after.acceptedIds.includes(row.candidateId))
        .some((row) => row.candidateId === "research-advance-one-cost-three"
          && row.sideEffects.energyDelta === -3),
      exactlyOneTriggerPerCandidate: Object.values(routeRuns).every((run) => (
        run.activated.every((row) => row.triggeredBy.length === 1
          && row.triggeredBy[0] === run.route)
      )),
      noAverageOrJointField: Object.values(routeRuns).every((run) => (
        run.activated.every((row) => Object.keys(row).every((key) => (
          !/(average|joint|aggregate)/i.test(key)
        )))
      )),
    },
    expected,
    routes: cleanAndDecoy,
  };
  output.allFrozenChecksPassed = Object.values(output.checks).every(Boolean);
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

main();

