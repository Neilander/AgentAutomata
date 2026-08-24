"use strict";

const sourceBundle = require("./source_rules.json");
const generatedBundle = require("./ai_compiled_trajectories.json");
const {
  SLOT_KEYS,
  assertFiveSlotQ,
} = require("../../imagination_pipeline_v0/five-slot-activation");

const NON_PLACEMENT_Q_KIND_BY_SOURCE = Object.freeze({
  white_die_rerolls_remaining: "white_die_placed",
  passed_sky_spaces_do_not_trigger: "ship_final_arrow",
  mothership_down_space: "ship_final_mothership_space",
  ship_city_hit: "ship_city_contact",
  room_requires_energy: "room_payment",
  energy_room_generates_energy: "energy_room_resolution",
  fighter_room_destroys_eligible_ships: "fighter_room_resolution",
  research_room_advances_track: "research_room_resolution",
  win_by_research_before_destruction: "research_completion",
  lose_by_damage_track: "damage_threshold",
  lose_by_mothership_skull: "mothership_threshold",
  excavation_placement_requirement: "excavation_placement",
  excavate_cost_and_result: "excavation_resolution",
  research_order_changes_usefulness: "research_order",
  mothership_descends_each_round: "mothership_phase_start",
  mothership_action_applies_row_effect: "mothership_row_action",
  research_top_is_immediate_win: "research_top",
  final_research_requires_lower_multi_room: "final_research_constraint",
  spawn_empty_columns_first: "spawn_priority_empty",
  spawn_farthest_from_highest_ship: "spawn_priority_farthest",
});

function validateGeneratedBundle() {
  const ids = new Set();
  for (const edge of generatedBundle.edges) {
    if (!edge.edgeId || ids.has(edge.edgeId)) {
      throw new Error(`missing or duplicate generated edge id: ${edge.edgeId}`);
    }
    ids.add(edge.edgeId);
    const source = sourceBundle.rules[edge.sourceRuleId];
    if (!source) throw new Error(`generated edge has unknown source: ${edge.sourceRuleId}`);
    if (edge.state !== "ready") throw new Error(`unsupported generated edge state: ${edge.state}`);
    assertFiveSlotQ(edge.current, `${edge.edgeId}.current`);
    assertFiveSlotQ(edge.following, `${edge.edgeId}.following`);
    const grounded = edge.sourceGrounding?.all;
    if (!Array.isArray(grounded) || grounded.length === 0) {
      throw new Error(`generated edge lacks source grounding: ${edge.edgeId}`);
    }
    for (const quote of grounded) {
      if (!source.includes(quote)) {
        throw new Error(`generated edge quote is outside source rule: ${edge.edgeId}`);
      }
    }
    const coordinateText = [...SLOT_KEYS]
      .flatMap((key) => [edge.current[key], edge.following[key]])
      .join(" ");
    const sourceNumbers = new Set(source.match(/\d+(?:\.\d+)?/g) || []);
    const generatedNumbers = new Set(coordinateText.match(/\d+(?:\.\d+)?/g) || []);
    for (const number of generatedNumbers) {
      if (!sourceNumbers.has(number)) {
        throw new Error(`generated edge invented number ${number}: ${edge.edgeId}`);
      }
    }
  }
  return {
    sourceCount: Object.keys(sourceBundle.rules).length,
    edgeCount: generatedBundle.edges.length,
    firstActionEdgeCount: generatedBundle.edges.filter(
      (edge) => edge.metadata?.useInFirstAction,
    ).length,
  };
}

function loadPlacementTrajectories() {
  validateGeneratedBundle();
  return Object.freeze(
    generatedBundle.edges
      .filter((edge) => edge.metadata?.useInFirstAction)
      .map((edge) => {
        const runtime = edge.metadata.runtimeGrounding;
        if (!runtime?.qKind) {
          throw new Error(`first-action edge lacks grounding contract: ${edge.edgeId}`);
        }
        const {
          program: _legacyProgramHint,
          ...relation
        } = runtime;
        return Object.freeze({
          id: edge.edgeId,
          sourceRuleId: edge.sourceRuleId,
          triggerQ: structuredClone(edge.current),
          followingQ: structuredClone(edge.following),
          relation,
          generationOrigin: "ai_rule_reading",
        });
      }),
  );
}

function loadAllTrajectories() {
  validateGeneratedBundle();
  return Object.freeze(generatedBundle.edges.map((edge) => {
    const runtime = edge.metadata?.runtimeGrounding;
    const qKind = runtime?.qKind || NON_PLACEMENT_Q_KIND_BY_SOURCE[edge.sourceRuleId];
    if (!qKind) throw new Error(`generated edge lacks qKind mapping: ${edge.edgeId}`);
    const {
      program: _legacyProgramHint,
      ...runtimeRelation
    } = runtime || {};
    return Object.freeze({
      id: edge.edgeId,
      sourceRuleId: edge.sourceRuleId,
      triggerQ: structuredClone(edge.current),
      followingQ: structuredClone(edge.following),
      relation: { ...runtimeRelation, qKind },
      outcomeKind: edge.metadata?.outcomeKind || "automatic",
      generationOrigin: "ai_rule_reading",
    });
  }));
}

module.exports = {
  generatedBundle,
  loadAllTrajectories,
  loadPlacementTrajectories,
  NON_PLACEMENT_Q_KIND_BY_SOURCE,
  sourceBundle,
  validateGeneratedBundle,
};
