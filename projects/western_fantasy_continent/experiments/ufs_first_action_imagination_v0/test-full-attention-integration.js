"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  engine,
  map,
} = require("../ufs_real_state_candidate_exam_v0/scenario-fixtures");
const {
  ROUND_ONE_RANDOM_OBSERVATIONS,
  ROUND_ONE_SCRIPT,
} = require("./one-round-fixture");
const {
  UfsFullAttentionProvider,
  buildFullItems,
  placementContext,
  safePublicInput,
} = require("./ufs-full-attention-provider");
const { UfsOneRoundImagination } = require("./ufs-one-round-imagination");

function initialPlacement(seed = 20260824, mode = "probabilistic") {
  const publicState = engine.createGame(map, 1);
  const selectedAction = scriptedPlacement(publicState, 0);
  return new UfsFullAttentionProvider({ mode }).noticePlacement({
    publicState,
    publicMap: map,
    selectedAction,
    randomSeed: seed,
  });
}

function scriptedPlacement(publicState, index) {
  const scriptRow = ROUND_ONE_SCRIPT.placements[index];
  return {
    ...scriptRow,
    dieValue: publicState.dice.find((die) => die.id === scriptRow.dieId).value,
  };
}

function byId(allocation, itemId) {
  const row = allocation.field.find((item) => item.itemId === itemId);
  assert.ok(row, `missing full-attention item: ${itemId}`);
  return row;
}

test("the initial public game is represented by the complete 153-item attention field", () => {
  const publicState = engine.createGame(map, 1);
  const before = structuredClone(publicState);
  const publicInput = safePublicInput(publicState, map);
  const items = buildFullItems(publicInput);

  assert.equal(items.length, 153);
  assert.equal(items.filter((item) => item.kind === "sky_cell").length, 80);
  assert.equal(items.filter((item) => item.kind === "base_cell").length, 30);
  assert.equal(items.filter((item) => item.kind === "room").length, 25);
  assert.equal(new Set(items.map((item) => item.itemId)).size, 153);
  assert.deepEqual(publicState, before);
  assert.equal(Object.hasOwn(publicInput, "seed"), false);
  assert.equal(Object.hasOwn(publicInput, "rngState"), false);
  assert.equal(Object.hasOwn(publicInput, "history"), false);
});

test("an action boosts its related items without deleting the surrounding field", () => {
  const allocation = initialPlacement(20260824, "probabilistic");

  assert.equal(allocation.spaceItemCount, 153);
  assert.equal(allocation.capacity, 41);
  assert.equal(allocation.noticedItemIds.length, 41);
  assert.equal(allocation.omittedItemIds.length, 112);
  assert.equal(byId(allocation, "die:r1-gray-0").activation, 0.95);
  assert.equal(byId(allocation, "base_cell:A-r2-c2").activation, 0.95);
  assert.equal(byId(allocation, "room:A-upper-research").activation, 0.7);
  assert.equal(byId(allocation, "ship:purple-1").activation, 0.85);
  assert.equal(byId(allocation, "sky_cell:15:4").activation, 0.04);
  assert.ok(allocation.field.every((item) => item.activation > 0));
});

test("probabilistic attention is reproducible and high-activation items win more often", () => {
  const first = initialPlacement(7);
  const repeated = initialPlacement(7);
  const different = initialPlacement(8);
  assert.deepEqual(first.noticedItemIds, repeated.noticedItemIds);
  assert.notDeepEqual(first.noticedItemIds, different.noticedItemIds);

  let focusedSeen = 0;
  let backgroundSeen = 0;
  for (let seed = 1; seed <= 300; seed += 1) {
    const allocation = initialPlacement(seed);
    if (byId(allocation, "base_cell:A-r2-c2").noticed) focusedSeen += 1;
    if (byId(allocation, "sky_cell:15:4").noticed) backgroundSeen += 1;
  }
  assert.ok(focusedSeen > backgroundSeen * 3, { focusedSeen, backgroundSeen });
  assert.ok(backgroundSeen > 0, { focusedSeen, backgroundSeen });
});

test("noticed items leave a short decaying trace that a new action can override", () => {
  const publicState = engine.createGame(map, 1);
  const provider = new UfsFullAttentionProvider();
  provider.beginEpisode();
  const first = provider.noticePlacement({
    publicState,
    publicMap: map,
    selectedAction: scriptedPlacement(publicState, 0),
    randomSeed: 1,
  });
  const second = provider.noticePlacement({
    publicState,
    publicMap: map,
    selectedAction: scriptedPlacement(publicState, 1),
    randomSeed: 2,
  });
  const third = provider.noticePlacement({
    publicState,
    publicMap: map,
    selectedAction: scriptedPlacement(publicState, 2),
    randomSeed: 3,
  });

  assert.equal(byId(first, "die:r1-gray-0").carryoverActivation, 0);
  assert.equal(byId(second, "die:r1-gray-0").baseActivation, 0.04);
  assert.equal(byId(second, "die:r1-gray-0").carryoverActivation, 0.171);
  assert.equal(byId(second, "die:r1-gray-0").activation, 0.211);
  assert.equal(byId(third, "die:r1-gray-0").carryoverActivation, 0.05985);
  assert.ok(
    byId(second, "die:r1-gray-1").activation
      > byId(second, "die:r1-gray-0").activation,
  );
  assert.ok(second.carryoverAppliedItemIds.includes("ship:purple-1"));
  assert.ok(second.traceBefore.some((row) => row.itemId === "ship:purple-1"));

  provider.beginEpisode();
  const reset = provider.noticePlacement({
    publicState,
    publicMap: map,
    selectedAction: scriptedPlacement(publicState, 1),
    randomSeed: 2,
  });
  assert.equal(byId(reset, "die:r1-gray-0").carryoverActivation, 0);
  assert.deepEqual(reset.traceBefore, []);
});

test("short-term trace makes the previous focus more likely, not mandatory", () => {
  const publicState = engine.createGame(map, 1);
  function previousFocusSeen(traceStrength) {
    let seen = 0;
    for (let seed = 1; seed <= 120; seed += 1) {
      const provider = new UfsFullAttentionProvider({ traceStrength });
      provider.beginEpisode();
      provider.noticePlacement({
        publicState,
        publicMap: map,
        selectedAction: scriptedPlacement(publicState, 0),
        randomSeed: seed,
      });
      const next = provider.noticePlacement({
        publicState,
        publicMap: map,
        selectedAction: scriptedPlacement(publicState, 1),
        randomSeed: 10000 + seed,
      });
      if (next.noticedItemIds.includes("die:r1-gray-0")) seen += 1;
    }
    return seen;
  }
  const withTrace = previousFocusSeen(0.18);
  const withoutTrace = previousFocusSeen(0);

  assert.ok(withTrace > withoutTrace * 3, { withTrace, withoutTrace });
  assert.ok(withTrace < 120, { withTrace, withoutTrace });
});

test("the whole continuous round uses full attention before Q and never the legacy local selector", () => {
  const result = new UfsOneRoundImagination().run({
    initialPublicState: engine.createGame(map, 1),
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
    attentionSeed: 20260824,
  });
  assert.equal(result.status, "complete");

  for (const placement of result.trace.placements) {
    const attention = placement.cognitiveTrace.placementRules.attention;
    assert.equal(attention.mode, "external_full_attention");
    assert.ok(attention.fullSpaceItemCount >= 153);
    assert.ok(attention.fullOmittedItemIds.length > 100);
    assert.equal(placement.cognitiveTrace.sky.attention.mode, "external_full_attention");
    assert.equal(
      placement.cognitiveTrace.sky.attention.fullSpaceItemCount,
      attention.fullSpaceItemCount,
    );
  }
  assert.equal(
    result.trace.placements[0].cognitiveTrace.placementRules.attention
      .fullField.some((row) => row.carryoverActivation > 0),
    false,
  );
  assert.equal(
    result.trace.placements[1].cognitiveTrace.placementRules.attention
      .fullField.some((row) => row.carryoverActivation > 0),
    true,
  );
  const eventSteps = [
    ...result.trace.randomBoundaries,
    ...result.trace.roomSteps.filter((row) => row.cognitiveTrace),
    ...result.trace.mothershipSteps,
  ];
  for (const step of eventSteps) {
    assert.equal(step.cognitiveTrace.attention.mode, "external_full_attention");
    assert.ok(step.cognitiveTrace.perception.fullSpaceItemCount >= 153);
    assert.ok(step.cognitiveTrace.perception.omittedItemIds.length > 100);
  }
});

test("a natural probabilistic omission can create a wrong inference and still continue", () => {
  const result = new UfsOneRoundImagination().run({
    initialPublicState: engine.createGame(map, 1),
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
    attentionSeed: 65,
  });
  const fighter = result.trace.roomSteps.find((row) => (
    row.stage === "effect" && row.action?.roomId === "A-upper-fighter"
  ));

  assert.equal(result.status, "complete");
  assert.equal(fighter.cognitiveTrace.perception.mode, "probabilistic");
  assert.equal(fighter.cognitiveTrace.perception.omittedItemIds.includes("ship:purple-0"), false);
  assert.equal(fighter.cognitiveTrace.perception.omittedItemIds.includes("sky_cell:3:0"), true);
  assert.deepEqual(fighter.patch.eligibleShipIds, []);
  assert.deepEqual(
    result.imaginedWorld.ships.find((ship) => ship.id === "purple-0"),
    { id: "purple-0", color: "purple", column: 0, row: 3 },
  );
  assert.deepEqual(
    result.trace.mothershipSteps.filter((row) => row.stage === "spawn").map((row) => row.shipId),
    ["white-1"],
  );
});

test("a reused round runner clears short-term attention between episodes", () => {
  const runner = new UfsOneRoundImagination();
  const run = () => runner.run({
    initialPublicState: engine.createGame(map, 1),
    publicMap: map,
    script: ROUND_ONE_SCRIPT,
    randomObservations: ROUND_ONE_RANDOM_OBSERVATIONS,
    attentionSeed: 20260824,
  });
  const first = run();
  const repeated = run();
  const firstAttention = first.trace.placements[0].cognitiveTrace.placementRules.attention;
  const repeatedAttention = repeated.trace.placements[0].cognitiveTrace.placementRules.attention;

  assert.equal(first.status, "complete");
  assert.equal(repeated.status, "complete");
  assert.deepEqual(firstAttention.fullNoticedItemIds, repeatedAttention.fullNoticedItemIds);
  assert.equal(firstAttention.fullField.some((row) => row.carryoverActivation > 0), false);
  assert.equal(repeatedAttention.fullField.some((row) => row.carryoverActivation > 0), false);
});

test("the full-attention runtime remains independent from the formal oracle engine", () => {
  for (const fileName of ["ufs-full-attention-provider.js", "ufs-one-round-imagination.js"]) {
    const source = fs.readFileSync(path.resolve(__dirname, fileName), "utf8");
    assert.doesNotMatch(source, /standard-engine|scenario-fixtures|applyWorkerPlacement|applyRoomAction|resolveMothership/);
  }
  assert.ok(placementContext);
});
