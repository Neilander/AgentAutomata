"use strict";

const { assertFiveSlotQ } = require("../imagination_pipeline_v0/five-slot-activation");

const MAX_DECLARED_PREDICTIONS = 3;
const VALID_CHANGES = new Set([
  "increase", "decrease", "changed", "unchanged", "equals", "present", "absent",
]);

const COLLECTIONS = Object.freeze({
  die: "dice",
  ship: "ships",
  waiting_ship: "waitingShips",
  placement: "placements",
  robot: "robots",
});

const SECTION_PREFIXES = Object.freeze({
  dice: "die",
  ships: "ship",
  waitingShips: "waiting_ship",
  placements: "placement",
  robots: "robot",
});

const COMPARABLE_FIELDS = Object.freeze({
  dice: ["color", "value", "placed"],
  ships: ["color", "column", "row"],
  waitingShips: ["color"],
  placements: ["dieId", "dieValue", "cellId", "roomId", "column", "excavationCandidate", "resolved"],
  robots: ["roomId", "value", "exhausted"],
});

const PATCH_SECTIONS = Object.freeze({
  set_movement_amount: ["ships", "waitingShips", "damage"],
  set_noticed_room_state: ["placements"],
  move_ship: ["ships", "waitingShips", "damage"],
  city_contact: ["ships", "waitingShips", "damage"],
  terminal_check: ["phase", "outcome"],
  randomize_unplaced_dice: ["dice"],
  room_payment_choice: ["energy"],
  energy_room_result: ["energy", "placements"],
  fighter_room_result: ["ships", "waitingShips", "placements"],
  research_room_choice: ["energy", "researchIndex", "placements"],
  research_order_choice: ["researchIndex"],
  final_research_constraint: ["researchIndex", "phase", "outcome"],
  excavation_placement_legality: ["placements"],
  excavation_result: ["energy", "excavatorIndex", "placements"],
  move_mothership: ["mothershipRow"],
  mothership_phase_descent: ["mothershipRow", "ships", "waitingShips"],
  mothership_row_action: ["energy", "damage", "researchIndex", "ships", "waitingShips"],
  spawn_candidates: ["ships", "waitingShips", "phase"],
});

function clone(value) {
  return structuredClone(value);
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function assertExpectation(expectation, label = "prediction expectation") {
  if (!expectation || typeof expectation !== "object" || Array.isArray(expectation)) {
    throw new TypeError(`${label} must be an object`);
  }
  if (typeof expectation.itemId !== "string" || !expectation.itemId.includes(":")) {
    throw new TypeError(`${label}.itemId must be a scoped item id`);
  }
  if (!VALID_CHANGES.has(expectation.change)) {
    throw new Error(`${label}.change must be one of ${[...VALID_CHANGES].join(", ")}`);
  }
  if (expectation.field != null && typeof expectation.field !== "string") {
    throw new TypeError(`${label}.field must be a string when present`);
  }
  if (expectation.change === "equals" && !Object.hasOwn(expectation, "value")) {
    throw new Error(`${label}.value is required for equals`);
  }
  if (["present", "absent"].includes(expectation.change) && expectation.field != null) {
    throw new Error(`${label}.${expectation.change} cannot target a field`);
  }
}

function splitOperationAndPredictionDeclarations(action) {
  const operation = clone(action);
  const declarations = clone(operation.predictions || []);
  delete operation.predictions;
  if (!Array.isArray(declarations)) throw new TypeError("action.predictions must be an array");
  if (declarations.length > MAX_DECLARED_PREDICTIONS) {
    throw new RangeError(`action.predictions supports at most ${MAX_DECLARED_PREDICTIONS} tickets`);
  }
  declarations.forEach((declaration, index) => {
    if (!declaration || typeof declaration !== "object" || Array.isArray(declaration)) {
      throw new TypeError(`action.predictions[${index}] must be an object`);
    }
    if (!Array.isArray(declaration.expectations) || declaration.expectations.length === 0) {
      throw new TypeError(`action.predictions[${index}].expectations must be a non-empty array`);
    }
    declaration.expectations.forEach((row, expectationIndex) => (
      assertExpectation(row, `action.predictions[${index}].expectations[${expectationIndex}]`)
    ));
    if (declaration.because != null && typeof declaration.because !== "string") {
      throw new TypeError(`action.predictions[${index}].because must be a string`);
    }
  });
  return { operation, declarations };
}

function describeExpectation(expectation) {
  const target = expectation.field
    ? `${expectation.itemId}.${expectation.field}`
    : expectation.itemId;
  const descriptions = {
    increase: "增加",
    decrease: "减少",
    changed: "发生变化",
    unchanged: "保持不变",
    present: "出现",
    absent: "消失",
  };
  if (expectation.change === "equals") return `${target}变为${JSON.stringify(expectation.value)}`;
  return `${target}${descriptions[expectation.change]}`;
}

function declaredTicketQ(operation, declaration, formalBefore) {
  const focus = declaration.expectations.map((row) => row.itemId).join("、");
  const because = declaration.because || "玩家当前知识与判断";
  const currentQ = {
    affected_object: focus,
    change_trend: `准备执行${operation.type}，结果尚未发生`,
    cause_relation: because,
    temporal_state: "行动提交前",
    context: `${formalBefore.phase}阶段执行${operation.type}前的明确预测`,
  };
  const predictedFollowingQ = {
    affected_object: focus,
    change_trend: declaration.expectations.map(describeExpectation).join("；"),
    cause_relation: `${operation.type}：${because}`,
    temporal_state: declaration.verifyBy || "本次正式结算到达稳定边界后",
    context: "行动前明确写下的预测票据",
  };
  assertFiveSlotQ(currentQ, "declared prediction currentQ");
  assertFiveSlotQ(predictedFollowingQ, "declared prediction followingQ");
  return { currentQ, predictedFollowingQ };
}

function compileDeclaredPredictionTickets({
  operation,
  declarations,
  formalBefore,
  beliefBefore = formalBefore,
  nextTicketId,
}) {
  return declarations.map((declaration, index) => {
    const q = declaredTicketQ(operation, declaration, formalBefore);
    return {
      schema: "ufs_prediction_ticket_v1",
      ticketId: nextTicketId(index),
      source: "deliberate_action_prediction",
      issuedForOperation: operation.type,
      trajectoryId: null,
      activation: Number(declaration.confidence ?? 0.75),
      currentQ: q.currentQ,
      predictedFollowingQ: q.predictedFollowingQ,
      expectations: declaration.expectations.map((expectation) => ({
        ...clone(expectation),
        baselineValue: itemValue(beliefBefore, expectation.itemId, expectation.field || null),
      })),
      deadline: declaration.verifyBy || "stable_boundary",
      rationale: declaration.because || null,
    };
  });
}

function itemValue(state, itemId, field = null) {
  const separator = itemId.indexOf(":");
  const prefix = separator >= 0 ? itemId.slice(0, separator) : itemId;
  const id = separator >= 0 ? itemId.slice(separator + 1) : "";
  let value;
  if (prefix === "track") value = state?.[id];
  else {
    const collection = COLLECTIONS[prefix];
    value = collection ? (state?.[collection] || []).find((row) => row.id === id) : undefined;
  }
  if (field == null) return clone(value);
  return clone(value?.[field]);
}

function expectationItemIds(expectation) {
  return [expectation.itemId];
}

function evaluateExpectation(expectation, before, after) {
  assertExpectation(expectation);
  const beforeValue = Object.hasOwn(expectation, "baselineValue")
    ? clone(expectation.baselineValue)
    : itemValue(before, expectation.itemId, expectation.field || null);
  const afterValue = itemValue(after, expectation.itemId, expectation.field || null);
  let passed;
  if (expectation.change === "increase") passed = Number(afterValue) > Number(beforeValue);
  else if (expectation.change === "decrease") passed = Number(afterValue) < Number(beforeValue);
  else if (expectation.change === "changed") passed = stable(afterValue) !== stable(beforeValue);
  else if (expectation.change === "unchanged") passed = stable(afterValue) === stable(beforeValue);
  else if (expectation.change === "equals") passed = stable(afterValue) === stable(expectation.value);
  else if (expectation.change === "present") passed = afterValue !== undefined;
  else if (expectation.change === "absent") passed = afterValue === undefined;
  return { passed, beforeValue, afterValue };
}

function evaluatePredictionTicket(ticket, { formalBefore, formalAfter, noticedItemIds }) {
  const noticed = new Set(noticedItemIds || []);
  const evaluations = ticket.expectations.map((expectation) => ({
    expectation: clone(expectation),
    observed: expectationItemIds(expectation).some((itemId) => noticed.has(itemId)),
    ...evaluateExpectation(expectation, formalBefore, formalAfter),
  }));
  const observed = evaluations.filter((row) => row.observed);
  let status = "unresolved";
  if (observed.some((row) => !row.passed)) status = "contradicted";
  else if (observed.length === evaluations.length) status = "confirmed";
  return { status, evaluations };
}

function changedEntityIds(beforeRows = [], afterRows = []) {
  const beforeById = new Map(beforeRows.map((row) => [row.id, row]));
  const afterById = new Map(afterRows.map((row) => [row.id, row]));
  return [...new Set([...beforeById.keys(), ...afterById.keys()])]
    .filter((id) => stable(beforeById.get(id)) !== stable(afterById.get(id)));
}

function automaticExpectations({ envelope, mentalBefore, predictedWorld }) {
  const sections = PATCH_SECTIONS[envelope.patch?.kind] || [];
  const expectations = [];
  for (const section of sections) {
    const prefix = SECTION_PREFIXES[section];
    if (!prefix) {
      if (stable(mentalBefore?.[section]) !== stable(predictedWorld?.[section])) {
        expectations.push({ itemId: `track:${section}`, change: "equals", value: clone(predictedWorld?.[section]) });
      }
      continue;
    }
    for (const id of changedEntityIds(mentalBefore?.[section], predictedWorld?.[section])) {
      const beforeValue = (mentalBefore?.[section] || []).find((row) => row.id === id);
      const afterValue = (predictedWorld?.[section] || []).find((row) => row.id === id);
      if (afterValue === undefined) {
        expectations.push({ itemId: `${prefix}:${id}`, change: "absent" });
        continue;
      }
      const fields = COMPARABLE_FIELDS[section] || [];
      for (const field of fields) {
        if (!Object.hasOwn(afterValue, field)) continue;
        if (beforeValue && stable(beforeValue[field]) === stable(afterValue[field])) continue;
        expectations.push({
          itemId: `${prefix}:${id}`,
          field,
          change: "equals",
          value: clone(afterValue[field]),
        });
      }
    }
  }
  return expectations;
}

function compileAutomaticPredictionTickets({
  envelopes,
  operation,
  mentalBefore,
  predictedWorld,
  nextTicketId,
}) {
  return envelopes.map((envelope, index) => ({
    schema: "ufs_prediction_ticket_v1",
    ticketId: nextTicketId(index),
    source: "awakened_five_slot_trajectory",
    issuedForOperation: operation.type,
    trajectoryId: envelope.trajectoryId,
    activation: envelope.activation,
    currentQ: clone(envelope.currentQ),
    predictedFollowingQ: clone(envelope.predictedFollowingQ),
    expectations: automaticExpectations({ envelope, mentalBefore, predictedWorld }),
    deadline: "stable_boundary",
    rationale: envelope.patch?.kind || null,
    occurrence: envelope.occurrence,
    occurrenceKey: envelope.occurrenceKey,
    patch: clone(envelope.patch),
    omittedItemIds: clone(envelope.omittedItemIds || []),
  }));
}

function ticketsOverlap(left, right) {
  const leftIds = new Set(left.expectations.flatMap(expectationItemIds));
  return right.expectations.some((expectation) => (
    expectationItemIds(expectation).some((itemId) => leftIds.has(itemId))
  ));
}

module.exports = {
  MAX_DECLARED_PREDICTIONS,
  compileAutomaticPredictionTickets,
  compileDeclaredPredictionTickets,
  evaluatePredictionTicket,
  itemValue,
  splitOperationAndPredictionDeclarations,
  ticketsOverlap,
};
