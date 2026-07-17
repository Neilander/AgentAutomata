const fs = require("node:fs");
const path = require("node:path");
const EQUIPMENT = require("../../game_data/equipment-runtime");
const ROSTER = require("../../map_progression_lab/map-progression-roster");
const REGION_1 = require("../../map_progression_lab/map-progression-cognition-core-phase2-midlock");
const REGION_2 = require("../../map_progression_lab/map-progression-chapter2-core");

const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const region1BeforeAssassin = prepareRegion1(["mage", "ranger", "berserker", "bard"]);
const region1 = prepareRegion1(["mage", "ranger", "berserker", "bard", "assassin"]);
const region2BeforeAlchemist = prepareRegion2(["ranger", "berserker", "bard", "assassin", "warlock", "knight", "priest"]);
const region2 = prepareRegion2(["ranger", "berserker", "bard", "assassin", "warlock", "alchemist", "knight", "priest"]);
const result = {
  schema: "enriched_bottleneck_enumeration_v1",
  method: "Every 4-character combination is tested in canonical and reversed formation. Bare and deterministic best-visible-equipment states are reported separately.",
  region1Main6: analyzeNode(region1BeforeAssassin, REGION_1, "r1_main_6", 16),
  region1Main7: analyzeNode(region1BeforeAssassin, REGION_1, "r1_main_7", 18),
  region1Main8: analyzeNode(region1BeforeAssassin, REGION_1, "r1_main_8", 20),
  region1Main9: analyzeNode(region1, REGION_1, "r1_main_9", 24),
  region1Main10: analyzeNode(region1, REGION_1, "r1_main_10", 26),
  region1Boss: analyzeNode(region1, REGION_1, "r1_boss", 32),
  region2ShieldTrial: analyzeNode(region2BeforeAlchemist, REGION_2, "r2_shield_trial", 24),
  region2FlagTrial: analyzeNode(region2BeforeAlchemist, REGION_2, "r2_flag_trial", 24),
  region2Confluence: analyzeNode(region2, REGION_2, "r2_confluence", 32),
  region2Boss: analyzeNode(region2, REGION_2, "r2_boss", 36),
};

if (outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
}
console.log(JSON.stringify(result, null, 2));

function prepareRegion1(rewards) {
  let state = REGION_1.initialState("bottleneck-enumeration-r1", {
    starterVariant: "player_agent_role_wave",
    environmentVariant: "enriched_v1",
  });
  for (const reward of rewards) state.roster = ROSTER.rescueHero(state.roster, reward);
  return state;
}

function prepareRegion2(rewards) {
  let state = REGION_2.initialState("bottleneck-enumeration-r2", { environmentVariant: "enriched_v1" });
  for (const reward of rewards) state.roster = ROSTER.rescueHero(state.roster, reward);
  return state;
}

function analyzeNode(baseState, core, nodeId, gearItemCount) {
  const node = core.nodes.find((row) => row.id === nodeId);
  baseState.attempts[nodeId] = 1;
  const ids = baseState.roster.map((unit) => unit.id);
  const teams = combinations(ids, 4).flatMap((team) => [team, [...team].reverse()]);
  const gearRule = core === REGION_1
    ? { ...REGION_1.dropRuleForNode(node, baseState), count: gearItemCount }
    : { ...REGION_2.dropRuleForNode(baseState, node), count: gearItemCount };
  const visibleGear = EQUIPMENT.generateItems(gearRule, `${baseState.seed}|visible-gear-pool`, `${nodeId}_benchmark`);
  return {
    nodeId,
    rosterSize: ids.length,
    uniqueCombinations: combinations(ids, 4).length,
    testedFormations: teams.length,
    bare: runTeams(baseState, core, node, teams, []),
    bestVisibleEquipment: runTeams(baseState, core, node, teams, visibleGear),
  };
}

function runTeams(baseState, core, node, teams, inventory) {
  const rows = teams.map((teamSlots) => {
    const state = structuredClone(baseState);
    state.teamSlots = [...teamSlots];
    if (inventory.length) {
      const equipped = EQUIPMENT.autoEquip(state.roster, state.teamSlots, structuredClone(inventory));
      state.roster = equipped.roster;
      state.inventory = equipped.inventory;
    }
    const combat = core.resolveCombat(state, node);
    return {
      teamSlots,
      win: combat.win,
      score: round(Number(combat.leftHp || 0) - Number(combat.rightHp || 0)),
      playerHp: round(combat.leftHp),
      enemyHp: round(combat.rightHp),
      duration: round(combat.duration),
    };
  });
  const wins = rows.filter((row) => row.win);
  const sorted = [...rows].sort((a, b) => b.score - a.score);
  const heroWinPresence = {};
  for (const id of baseState.roster.map((unit) => unit.id)) {
    const containing = rows.filter((row) => row.teamSlots.includes(id));
    heroWinPresence[id] = {
      formations: containing.length,
      wins: containing.filter((row) => row.win).length,
      winRate: round(containing.filter((row) => row.win).length / Math.max(1, containing.length)),
    };
  }
  return {
    formations: rows.length,
    wins: wins.length,
    losses: rows.length - wins.length,
    winRate: round(wins.length / Math.max(1, rows.length)),
    best: sorted.slice(0, 5),
    worst: sorted.slice(-5).reverse(),
    heroWinPresence,
  };
}

function combinations(values, size) {
  const result = [];
  visit(0, []);
  return result;
  function visit(index, selected) {
    if (selected.length === size) {
      result.push([...selected]);
      return;
    }
    for (let next = index; next <= values.length - (size - selected.length); next += 1) {
      selected.push(values[next]);
      visit(next + 1, selected);
      selected.pop();
    }
  }
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}
