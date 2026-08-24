"use strict";

const PROGRAM_KEYS = Object.freeze([
  "programId", "revision", "sourceRuleIds", "trigger", "requiredReads", "bindings", "output",
]);
const RELATION_KEYS = new Set(["roomTypes", "excludedRoomTypes", "cellCount", "minimumCellCount"]);
const ROOM_TYPES = new Set(["aa", "tunnel", "energy", "fighter", "research"]);
const Q_KINDS = new Set([
  "placement_movement", "placement_room_state",
  "white_die_placed", "ship_final_arrow", "ship_final_mothership_space", "ship_city_contact",
  "room_payment", "energy_room_resolution", "fighter_room_resolution", "research_room_resolution",
  "excavation_placement", "excavation_resolution", "research_order", "final_research_constraint",
  "research_completion", "damage_threshold", "mothership_threshold", "mothership_phase_start",
  "mothership_row_action", "research_top", "spawn_priority_empty", "spawn_priority_farthest",
]);
const ALLOWED_READS = new Set([
  "event.dieValue", "event.dieId", "event.shipId",
  "room.id", "room.type", "room.cellIds", "room.modifier", "room.energyCost", "room.value",
  "room.zone", "room.cellCount", "room.cell:${cellId}.occupied", "room.cell:${cellId}.dieValue",
  "player.energy", "player.energyCap", "dice.ids", "dice:${dieId}.placed",
  "tile.arrow.targetColumn", "tile.arrow.targetRow", "mothership.row", "mothership.onSkullRow",
  "mothership.rowAction.type", "mothership.rowAction.value", "sky.row:${nextRow}.shipIds",
  "explosionShip.ids", "explosionShip:${shipId}.threshold", "research.costsAhead",
  "round.usedUnexcavatedPlacement", "excavation.pathDistance", "excavation.targetIndex",
  "excavation.pathIndicesBehind", "research.pendingRoomIds", "research.room:${roomId}.value",
  "research.targetCost", "research.complete", "research.atTop", "city.destroyed", "damage.atBottom",
  "spawn.shipId", "spawn.shipColor", "sky.columnIds", "sky.column:${columnId}.shipIds",
  "sky.column:${columnId}.dropPointId", "spawn.availableDropPointIds",
  "spawn.dropPoint:${dropPointId}.distanceFromHighestShip",
]);
const EXPRESSION_KEYS = Object.freeze({
  read: ["op", "path"], read_template: ["op", "template"], var: ["op", "name"],
  get: ["op", "from", "key"], map: ["op", "items", "as", "value"],
  filter: ["op", "items", "as", "where"], length: ["op", "value"],
  first: ["op", "items"], pluck: ["op", "items", "key"], unique: ["op", "items"],
  concat: ["op", "items"], eq: ["op", "left", "right"], not: ["op", "value"],
  and: ["op", "values"], or: ["op", "values"], lte: ["op", "left", "right"],
  gte: ["op", "left", "right"], contains: ["op", "items", "value"],
  add: ["op", "values"], subtract: ["op", "left", "right"], min: ["op", "values"],
  max: ["op", "values"], sum: ["op", "items"], if: ["op", "condition", "then", "else"],
});
const OUTPUT_FIELDS = Object.freeze({
  set_movement_amount: ["amount"],
  set_noticed_room_state: ["roomId", "roomType", "occupiedCells", "missingCells", "complete", "roomValue", "energyCost", "roomPhaseStatus"],
  randomize_unplaced_dice: ["dieIds", "field", "valueState", "stopKind", "stopReason"],
  move_ship: ["shipId", "column", "row", "stopKind"],
  move_mothership: ["fromRow", "toRow", "delta", "stopKind"],
  city_contact: ["shipId", "damageDelta", "shipDestination", "stopKind"],
  room_payment_choice: ["energyCost", "canPay", "stopKind"],
  energy_room_result: ["energyBefore", "gain", "energyAfter", "removeDie", "stopKind"],
  fighter_room_result: ["eligibleShipIds", "roomValue", "removeDie", "stopKind"],
  research_room_choice: ["budget", "continuousCosts", "stopKind"],
  excavation_placement_legality: ["dieValue", "pathDistance", "otherUnexcavatedAlreadyUsed", "legal", "stopKind"],
  excavation_result: ["energyDelta", "removeDieId", "excavatorTargetIndex", "newlyExcavatedIndices", "stopKind"],
  research_order_choice: ["rooms", "continuousCosts", "combineValues", "stopKind"],
  final_research_constraint: ["targetCost", "requiresRoomType", "requiresZone", "requiresMinimumCells", "currentRoomEligible", "stopKind"],
  terminal_check: ["terminal", "result", "reason", "stopKind"],
  mothership_phase_descent: ["fromRow", "toRow", "collectedShipIds", "stopKind"],
  mothership_row_action: ["actionType", "amount", "stopKind"],
  spawn_candidates: ["shipId", "candidateDropPointIds", "stopKind"],
});

function assertExactKeys(value, expected, label) {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) throw new Error(`${label} keys mismatch: ${actual.join(",")}`);
}

function validateExpression(value, label = "expression") {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((row, index) => validateExpression(row, `${label}[${index}]`));
    return;
  }
  if (!Object.prototype.hasOwnProperty.call(value, "op")) {
    for (const [key, row] of Object.entries(value)) validateExpression(row, `${label}.${key}`);
    return;
  }
  const expected = EXPRESSION_KEYS[value.op];
  if (!expected) throw new Error(`${label} uses unsupported op: ${value.op}`);
  assertExactKeys(value, expected, label);
  for (const [key, row] of Object.entries(value)) {
    if (key !== "op") validateExpression(row, `${label}.${key}`);
  }
}

function validateRelation(relation) {
  if (!relation || typeof relation !== "object" || Array.isArray(relation)) throw new Error("trigger.relation must be an object");
  for (const [key, value] of Object.entries(relation)) {
    if (!RELATION_KEYS.has(key)) throw new Error(`unsupported relation key: ${key}`);
    if (key === "roomTypes" || key === "excludedRoomTypes") {
      if (!Array.isArray(value) || value.length === 0 || value.some((row) => !ROOM_TYPES.has(row))) throw new Error(`invalid relation room types: ${key}`);
    } else if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`relation ${key} must be a positive integer`);
    }
  }
}

function validateProgram(program, { sourceRules = null } = {}) {
  if (!program || typeof program !== "object" || Array.isArray(program)) throw new TypeError("program must be an object");
  assertExactKeys(program, PROGRAM_KEYS, "program");
  if (typeof program.programId !== "string" || !program.programId.trim()) throw new Error("programId must be a non-empty string");
  if (!Number.isInteger(program.revision) || program.revision <= 0) throw new Error("revision must be a positive integer");
  if (!Array.isArray(program.sourceRuleIds) || program.sourceRuleIds.length === 0) throw new Error("sourceRuleIds must be a non-empty array");
  if (new Set(program.sourceRuleIds).size !== program.sourceRuleIds.length) throw new Error("sourceRuleIds must be unique");
  if (sourceRules) {
    for (const sourceRuleId of program.sourceRuleIds) if (!sourceRules[sourceRuleId]) throw new Error(`unknown source rule: ${sourceRuleId}`);
  }
  assertExactKeys(program.trigger, ["qKind", "relation"], "trigger");
  if (!Q_KINDS.has(program.trigger.qKind)) throw new Error(`unsupported qKind: ${program.trigger.qKind}`);
  validateRelation(program.trigger.relation);
  if (!Array.isArray(program.requiredReads)) throw new Error("requiredReads must be an array");
  if (new Set(program.requiredReads).size !== program.requiredReads.length) throw new Error("requiredReads must be unique");
  for (const read of program.requiredReads) if (!ALLOWED_READS.has(read)) throw new Error(`unsupported attention read: ${read}`);
  if (!program.bindings || typeof program.bindings !== "object" || Array.isArray(program.bindings)) throw new Error("bindings must be an object");
  for (const [name, expression] of Object.entries(program.bindings)) {
    if (!name.trim()) throw new Error("binding names must not be empty");
    validateExpression(expression, `bindings.${name}`);
  }
  assertExactKeys(program.output, ["kind", "fields"], "output");
  const expectedFields = OUTPUT_FIELDS[program.output.kind];
  if (!expectedFields) throw new Error(`unsupported output kind: ${program.output.kind}`);
  assertExactKeys(program.output.fields, expectedFields, "output.fields");
  validateExpression(program.output.fields, "output.fields");
  return structuredClone(program);
}

module.exports = { ALLOWED_READS, OUTPUT_FIELDS, Q_KINDS, validateExpression, validateProgram };
