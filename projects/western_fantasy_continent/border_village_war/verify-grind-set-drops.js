"use strict";

const assert = require("node:assert/strict");
const GAME = require("./border-village-core");
const SETS = require("../game_data/equipment-sets");

function makeState(difficulty) {
  const state = GAME.createInitialState(`set-drop-d${difficulty}`);
  state.phase = "management";
  state.storyStep = null;
  state.day = 3;
  state.ap = 3;
  state.roster = ["player"];
  state.activeParty = ["player"];
  state.grind.winsByDifficulty = difficulty === 6
    ? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 90, 6: 0 }
    : { 1: 0, 2: 0, 3: 0, 4: 50, 5: 0, 6: 0 };
  state.stats.grindWins = difficulty === 6 ? 90 : 50;
  const weapon = {
    id: `set_drop_fixture_${difficulty}`,
    name: "套装掉落验证武器",
    slot: "weapon",
    slotLabel: "武器",
    rarity: "传说",
    rarityId: "legendary",
    equipmentLevel: 999,
    power: 99999,
    baseStats: { physicalPower: 100000, maxHp: 100000, armor: 1000 },
    affixes: [],
    identityTags: [],
    source: "验证夹具",
  };
  state.inventory.push(weapon);
  state.equipment.player.weapon = weapon.id;
  const select = GAME.getPlayerObservation(state).actions.find((row) => row.operation === "select_grind_difficulty" && row.targetDifficulty === difficulty);
  assert(select?.available, `Difficulty ${difficulty} is not unlocked in the verification fixture`);
  return GAME.applyPlayerAction(state, select.id);
}

function collectDrops(state, difficulty, rounds, forcedRarity) {
  const config = GAME.GRIND_DIFFICULTIES[difficulty];
  config.enemies = [["warrior", "概率验证木桩"]];
  config.scale = { hp: .1, power: .1, armor: .1 };
  config.lootCountTable = [[3, 1]];
  config.rarityTable = [[forcedRarity, 1]];
  const drops = [];
  for (let round = 0; round < rounds; round += 1) {
    const observation = GAME.getPlayerObservation(state);
    const action = observation.actions.find((row) => row.kind === "grind");
    const beforeIds = new Set(state.inventory.map((item) => item.id));
    const plan = GAME.preparePlayerCombat(state, action.id);
    const result = GAME.simulatePlan(plan);
    assert(result.metrics.leftAlive > 0 && result.metrics.rightAlive === 0, `Verification grind lost at round ${round + 1}`);
    state = GAME.applyPlayerCombatResult(state, action.id, result);
    const fresh = state.inventory.filter((item) => !beforeIds.has(item.id));
    assert.equal(fresh.length, 3, `Difficulty ${difficulty} did not drop exactly three items`);
    drops.push(...fresh);
    const freshIds = new Set(fresh.map((item) => item.id));
    state.inventory = state.inventory.filter((item) => !freshIds.has(item.id));
  }
  return { state, drops };
}

assert.deepEqual(GAME.GRIND_DIFFICULTIES[6].rarityTable, [["普通", .20], ["稀有", .42], ["史诗", .30], ["传说", .08]], "Difficulty 6 rarity table changed");
assert.equal(GAME.GRIND_DIFFICULTIES[5].unlockScoreToNext, 450, "Difficulty 6 is not gated at 450 score");
assert.equal(GAME.GRIND_SET_CONVERSION_CHANCE, .20, "Set conversion chance changed");

let directedState = makeState(6);
let observation = GAME.getPlayerObservation(directedState);
const desired = ["cavalryCharge", "sighingWall", "guardianEcho"];
for (let slotIndex = 0; slotIndex < desired.length; slotIndex += 1) {
  observation = GAME.getPlayerObservation(directedState);
  const action = observation.actions.find((row) => row.operation === "select_grind_set" && row.targetSetSlot === slotIndex && row.targetSetId === desired[slotIndex]);
  directedState = GAME.applyPlayerAction(directedState, action.id);
}
const directed = collectDrops(directedState, 6, 200, "史诗").drops;
const directedSets = directed.filter((item) => item.setId);
const directedRate = directedSets.length / directed.length;
assert(directedRate >= .15 && directedRate <= .25, `Directed set conversion rate ${directedRate} is too far from 20%`);
assert(directedSets.every((item) => desired.includes(item.setId)), "Difficulty 6 produced a set outside the selected three-set pool");
assert(new Set(directedSets.map((item) => item.setId)).size === 3, "Difficulty 6 did not produce all three selected sets in the deterministic sample");
assert(directedSets.every((item) => item.rarity === "史诗" && item.setName === SETS.SETS[item.setId].name), "Set conversion overwrote base rarity or omitted set identity");
const uniqueCavalryPieces = [...new Map(directedSets.filter((item) => item.setId === "cavalryCharge").map((item) => [item.slot, item])).values()].slice(0, 6);
assert.equal(uniqueCavalryPieces.length, 6, "Deterministic drop sample did not contain six distinct cavalry-set slots");
const activationState = makeState(6);
activationState.inventory.push(...uniqueCavalryPieces);
for (const item of uniqueCavalryPieces) activationState.equipment.player[item.slot] = item.id;
const activationPlan = GAME.huntPlan(activationState);
assert.equal(activationPlan.leftTeam[0].mechanicModifiers["set:cavalryCharge:pieces"], 6, "Generated set drops did not reach formal equipment counting");
assert.equal(activationPlan.leftTeam[0].mechanicModifiers["set:cavalryCharge:breakthrough"], 1, "Six generated set drops did not activate the formal six-piece mechanic");

const unrestricted = collectDrops(makeState(5), 5, 120, "传说").drops.filter((item) => item.setId);
assert(unrestricted.some((item) => !desired.includes(item.setId)), "Difficulty 5 incorrectly used the difficulty-6 directed pool");
assert(unrestricted.every((item) => SETS.SETS[item.setId]), "Unrestricted conversion produced an unknown set");

const belowThreshold = collectDrops(makeState(6), 6, 30, "稀有").drops;
assert(!belowThreshold.some((item) => item.setId), "Equipment below epic rarity converted into a set");

console.log(JSON.stringify({
  status: "PASS",
  difficulty6: { eligibleItems: directed.length, setItems: directedSets.length, conversionRate: Number(directedRate.toFixed(3)), selectedSets: desired, generatedSixPieceActivated: true },
  difficulty5: { setItems: unrestricted.length, pool: "all-current-sets" },
  belowEpic: { items: belowThreshold.length, setItems: 0 },
}, null, 2));
