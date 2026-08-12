"use strict";

const ENGINE = require("../standard-engine");
const { matchOneTurn } = require("./one-turn-match");

/**
 * UFS adapter for the current worker-placement decision only.
 *
 * A white die can reroll unplaced dice after the immediate ship movement.
 * The adapter marks that uncertainty; one-turn goals must assess only effects
 * already resolved by this placement, not the newly rolled future values.
 */
function matchCurrentPlacements({ map, state, goal }) {
  const actions = ENGINE.allLegalWorkerPlacements(map, state);
  const result = matchOneTurn({
    goal,
    state,
    actions,
    simulate: (before, action) => ENGINE.applyWorkerPlacement(map, before, action, { rerollMode: "expected" }),
    actionKey: (action) => action.id,
    describeAction: describePlacement,
  });

  result.results.forEach((row) => attachRerollUncertainty(row, state, actions));
  result.ranked = [...result.results].sort((left, right) => {
    const order = { complete: 0, partial: 1, none: 2, harmful: 3, invalid: 4 };
    return order[left.status] - order[right.status]
      || right.progress - left.progress
      || left.inputIndex - right.inputIndex;
  });
  result.best = result.ranked.find((row) => row.status !== "invalid") || null;
  result.scope = {
    game: "Under Falling Skies",
    decision: "current_worker_placement",
    legalSource: "standard-engine.allLegalWorkerPlacements",
    stochasticBoundary: "future rerolled dice are unknown and may not be used by the goal",
  };
  return result;
}

function attachRerollUncertainty(row, before, actions) {
  const action = actions[row.inputIndex];
  const unplacedAfter = before.dice.filter((die) => !die.placed && die.id !== action.dieId).length;
  row.uncertainty = action.dieColor === "white" && unplacedAfter > 0
    ? { type: "future_dice_reroll", affectedDice: unplacedAfter }
    : null;
}

function describePlacement(action) {
  const excavation = action.excavationCandidate ? `，挖掘${action.excavationDistance}格` : "";
  return `${action.dieColor}骰${action.dieValue} → ${action.roomType}房间（列${action.column + 1}${excavation}）`;
}

function avoidMothershipAdvanceGoal() {
  return {
    id: "avoid_mothership_advance",
    label: "这次放骰不要让母舰下降",
    assess({ before, after }) {
      const delta = after.mothershipRow - before.mothershipRow;
      return {
        satisfied: delta === 0,
        progress: delta === 0 ? 1 : -delta,
        evidence: [{ type: "mothership_row_delta", value: delta }],
      };
    },
  };
}

function avoidCityDamageGoal() {
  return {
    id: "avoid_city_damage",
    label: "这次放骰不要让城市受伤",
    assess({ before, after }) {
      const delta = after.damage - before.damage;
      return {
        satisfied: delta === 0,
        progress: delta === 0 ? 1 : -delta,
        evidence: [{ type: "city_damage_delta", value: delta }],
      };
    },
  };
}

module.exports = {
  avoidCityDamageGoal,
  avoidMothershipAdvanceGoal,
  matchCurrentPlacements,
};
