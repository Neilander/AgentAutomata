"use strict";

function qFor(kind) {
  const rows = {
    place_die_same_column: {
      affected_object: "ship",
      change_trend: "position movement pending",
      cause_relation: "die placed in same column",
      temporal_state: "ready to happen",
      context: "imagined candidate action",
    },
    landed_arrow: {
      affected_object: "ship",
      change_trend: "landed on arrow endpoint",
      cause_relation: "movement ended on special tile",
      temporal_state: "just completed",
      context: "imagined consequence",
    },
    landed_city: {
      affected_object: "city",
      change_trend: "city damage pending",
      cause_relation: "ship ended movement on city",
      temporal_state: "ready to happen",
      context: "imagined consequence",
    },
    landed_normal: {
      affected_object: "ship",
      change_trend: "movement finished safely",
      cause_relation: "ship ended movement on normal tile",
      temporal_state: "completed",
      context: "imagined consequence",
    },
    landed_random: {
      affected_object: "ship",
      change_trend: "random result pending",
      cause_relation: "ship ended movement on random tile",
      temporal_state: "awaiting random outcome",
      context: "imagined consequence",
    },
    landed_choice: {
      affected_object: "ship",
      change_trend: "player choice pending",
      cause_relation: "ship ended movement on choice tile",
      temporal_state: "awaiting decision",
      context: "imagined consequence",
    },
    landed_unknown: {
      affected_object: "ship",
      change_trend: "unknown consequence pending",
      cause_relation: "ship ended movement on unfamiliar tile",
      temporal_state: "knowledge missing",
      context: "imagined consequence",
    },
  };
  if (!rows[kind]) throw new Error(`unknown q kind: ${kind}`);
  return { ...rows[kind] };
}

const TRAJECTORIES = Object.freeze([
  {
    id: "RULE-PLACE-DIE-COLUMN-MOVE",
    sourceRuleId: "RULE-BASE-COLUMN-MOVE",
    sourceQuote: "A placed die moves non-frozen ships in the same column by its amount.",
    triggerQ: qFor("place_die_same_column"),
    relation: { qKind: "place_die_same_column" },
    program: "blind_column_move",
    outcomeKind: "automatic",
    internalAttentionPoints: ["same_column_targets", "movement_endpoint"],
    familiarity: 0.6,
  },
  {
    id: "RULE-000-PASSING-ARROW-DOES-NOT-SHIFT",
    sourceRuleId: "RULE-PASSING-ARROW",
    sourceQuote: "Passing over an arrow without landing does not shift the ship.",
    triggerQ: qFor("landed_arrow"),
    relation: { qKind: "passed_arrow" },
    program: "no_effect",
    outcomeKind: "complete",
    internalAttentionPoints: ["endpoint_relation"],
    familiarity: 0.5,
  },
  {
    id: "RULE-LANDED-ARROW-SHIFT",
    sourceRuleId: "RULE-LANDED-ARROW-SHIFT",
    sourceQuote: "A ship that ends movement on an arrow shifts to the arrow target.",
    triggerQ: qFor("landed_arrow"),
    relation: { qKind: "landed_arrow", tileKind: "arrow" },
    program: "arrow_shift",
    outcomeKind: "automatic",
    internalAttentionPoints: ["endpoint_relation", "arrow_target"],
    familiarity: 0.55,
  },
  {
    id: "RULE-LANDED-CITY-DAMAGE",
    sourceRuleId: "RULE-LANDED-CITY-DAMAGE",
    sourceQuote: "A ship ending movement on the city deals one visible city damage.",
    triggerQ: qFor("landed_city"),
    relation: { qKind: "landed_city", tileKind: "city" },
    program: "city_damage",
    outcomeKind: "complete",
    internalAttentionPoints: ["city_state"],
    familiarity: 0.5,
  },
  {
    id: "RULE-LANDED-NORMAL-COMPLETE",
    sourceRuleId: "RULE-LANDED-NORMAL-COMPLETE",
    sourceQuote: "A ship ending on a normal tile has no further immediate consequence.",
    triggerQ: qFor("landed_normal"),
    relation: { qKind: "landed_normal", tileKind: "normal" },
    program: "no_effect",
    outcomeKind: "complete",
    internalAttentionPoints: ["normal_endpoint"],
    familiarity: 0.8,
  },
  {
    id: "RULE-LANDED-RANDOM-STOP",
    sourceRuleId: "RULE-LANDED-RANDOM-STOP",
    sourceQuote: "A random tile stops deterministic imagination at the unknown result.",
    triggerQ: qFor("landed_random"),
    relation: { qKind: "landed_random", tileKind: "random" },
    program: "no_effect",
    outcomeKind: "random",
    internalAttentionPoints: ["random_boundary"],
    familiarity: 0.4,
  },
  {
    id: "RULE-LANDED-CHOICE-STOP",
    sourceRuleId: "RULE-LANDED-CHOICE-STOP",
    sourceQuote: "A choice tile pauses the current imagination branch for a new decision.",
    triggerQ: qFor("landed_choice"),
    relation: { qKind: "landed_choice", tileKind: "choice" },
    program: "no_effect",
    outcomeKind: "choice",
    internalAttentionPoints: ["choice_boundary"],
    familiarity: 0.4,
  },
]);

function createScenario({ endpointKind = "arrow", amount = 2 } = {}) {
  const endpointRow = 2 + amount;
  const tiles = [
    {
      column: "B",
      row: endpointRow,
      kind: endpointKind,
      ...(endpointKind === "arrow" ? { targetColumn: "C", targetRow: endpointRow } : {}),
    },
    { column: "B", row: 8, kind: "normal" },
    { column: "C", row: endpointRow, kind: "city" },
    { column: "C", row: 1, kind: "normal" },
  ];
  return {
    world: {
      objects: [
        { id: "ship-a", column: "B", row: 2, frozen: false, city_distance: 2 },
        { id: "ship-frozen", column: "B", row: 6, frozen: true, city_distance: 1 },
        { id: "ship-other", column: "C", row: 1, frozen: false, city_distance: 4 },
      ],
      tiles,
      city: { health: 3 },
    },
    action: {
      type: "place_die",
      dieId: "die-3",
      column: "B",
      amount,
      selection: "all",
    },
    goal: { kind: "protect_city" },
  };
}

module.exports = {
  qFor,
  TRAJECTORIES,
  createScenario,
};
