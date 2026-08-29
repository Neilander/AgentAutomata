"use strict";

const GAME = require("./border-village-core");
const EQUIPMENT_SETS = require("../game_data/equipment-sets");

const PARTY = ["player", "captain", "rider", "witch"];
const SLOTS = Object.keys(GAME.SLOT_DATA);
const RUNS = Math.max(1, Number(process.argv[2]) || 50);
const tuning = {
  hp: Number(process.env.D6_HP) || GAME.GRIND_DIFFICULTIES[6].scale.hp,
  power: Number(process.env.D6_POWER) || GAME.GRIND_DIFFICULTIES[6].scale.power,
  armor: Number(process.env.D6_ARMOR) || GAME.GRIND_DIFFICULTIES[6].scale.armor,
};
GAME.GRIND_DIFFICULTIES[6].scale = { ...tuning };
if (process.env.D6_ENEMY_PROFILE === "arcane") {
  GAME.GRIND_DIFFICULTIES[6].enemies = [
    ["knight", "源心法阵守卫"], ["knight", "灾厄法阵守卫"],
    ["mage", "腐星秘法师"], ["mage", "源心秘法师"], ["mage", "灾星秘法师"],
    ["warlock", "源心咒师"], ["warlock", "魔潮咒师"], ["warlock", "无光咒师"],
    ["alchemist", "灾厄投手"], ["alchemist", "腐液塑形者"],
    ["priest", "魔潮大祭司"], ["priest", "源心祭司"],
  ];
}
if (process.env.D6_ENEMY_PROFILE === "focus") {
  GAME.GRIND_DIFFICULTIES[6].enemies = [
    ["knight", "源心法阵守卫"], ["knight", "灾厄法阵守卫"],
    ["mage", "腐星秘法师"], ["mage", "源心秘法师"],
    ["mage", "灾星秘法师"], ["mage", "无光秘法师"],
    ["priest", "魔潮大祭司"], ["priest", "源心祭司"],
  ];
}

const SCENARIOS = [
  { id: "all_rare", label: "全员稀有", baseRarity: "稀有" },
  { id: "all_epic_plain", label: "全员史诗（无套装）", baseRarity: "史诗" },
  { id: "all_epic_arcane_counter", label: "全员史诗法阵克制队（骑兵/狂战/炼金/术士）", baseRarity: "史诗", party: ["rider", "sellsword", "alchemist", "witch"] },
  { id: "all_epic_arcane_exposed", label: "全员史诗法阵劣势队（骑士/双游侠/战士）", baseRarity: "史诗", party: ["captain", "scout", "hunter", "player"] },
  { id: "epic_myriad_set", label: "全员史诗 + 战士万夫之勇六件套", baseRarity: "史诗", setHero: "player", setId: "myriadValor" },
  { id: "epic_cavalry_set", label: "全员史诗 + 骑兵奔袭铁骑六件套", baseRarity: "史诗", setHero: "rider", setId: "cavalryCharge" },
  { id: "one_full_legendary", label: "全员史诗 + 战士全身传说（无套装）", baseRarity: "史诗", legendaryHero: "player" },
];

function equipGeneratedItem(state, heroId, slot, rarity, setId = null) {
  const item = GAME.generateItem(state, "难度6门槛校准", 6, rarity, slot);
  if (setId) {
    const set = EQUIPMENT_SETS.SETS[setId];
    item.setId = setId;
    item.setName = set.name;
    item.setRank = set.rarity || "传说";
    item.identityTags = [...new Set([...(item.identityTags || []), `套装:${set.name}`])];
    item.name = `${set.name}·${item.slotLabel} Lv.${item.equipmentLevel}`;
  }
  state.inventory.push(item);
  state.equipment[heroId][slot] = item.id;
}

function makeState(scenario, runIndex) {
  const party = scenario.party || PARTY;
  const state = GAME.createInitialState(`difficulty-six-${scenario.id}-${runIndex}`);
  state.phase = "management";
  state.storyStep = null;
  state.day = 3;
  state.ap = 3;
  state.roster = [...party];
  state.activeParty = [...party];
  state.grind.selectedDifficulty = 6;
  state.grind.unlockedDifficulty = 6;
  state.grind.winsByDifficulty = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 90, 6: 0 };
  state.stats.grindWins = 90;

  for (const heroId of party) {
    for (const slot of SLOTS) state.equipment[heroId][slot] = null;
    for (const [slotIndex, slot] of SLOTS.entries()) {
      const rarity = heroId === scenario.legendaryHero ? "传说" : scenario.baseRarity;
      const setId = heroId === scenario.setHero && slotIndex < 6 ? scenario.setId : null;
      equipGeneratedItem(state, heroId, slot, rarity, setId);
    }
  }
  return state;
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function summarize(scenario) {
  const rows = [];
  for (let runIndex = 0; runIndex < RUNS; runIndex += 1) {
    const state = makeState(scenario, runIndex);
    const plan = GAME.huntPlan(state);
    const result = GAME.simulatePlan(plan);
    const win = result.metrics.leftAlive > 0 && result.metrics.rightAlive === 0;
    rows.push({
      win,
      duration: result.duration,
      leftAlive: result.metrics.leftAlive,
      rightAlive: result.metrics.rightAlive,
      leftDamage: result.metrics.leftDamage,
      rightDamage: result.metrics.rightDamage,
    });
  }
  const sum = (key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);
  const wins = rows.filter((row) => row.win).length;
  return {
    id: scenario.id,
    label: scenario.label,
    runs: RUNS,
    wins,
    winRate: round(wins / RUNS * 100),
    averageDuration: round(sum("duration") / RUNS),
    averageLeftAlive: round(sum("leftAlive") / RUNS, 2),
    averageRightAlive: round(sum("rightAlive") / RUNS, 2),
    averageLeftDamage: round(sum("leftDamage") / RUNS),
    averageRightDamage: round(sum("rightDamage") / RUNS),
  };
}

console.log(JSON.stringify({
  stage: GAME.GRIND_DIFFICULTIES[6].name,
  tuning,
  party: PARTY.map((id) => ({ id, name: GAME.HEROES[id].name, role: GAME.HEROES[id].combatRole })),
  enemyProfile: process.env.D6_ENEMY_PROFILE || "live",
  runsPerScenario: RUNS,
  scenarios: SCENARIOS.map(summarize),
}, null, 2));
