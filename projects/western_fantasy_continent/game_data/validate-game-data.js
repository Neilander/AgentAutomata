const { EMPTY_STATS } = require("./stat-schema");
const { EQUIPMENT_SETS } = require("./equipment");
const { MAX_RELICS_PER_UNIT, RELICS } = require("./relics");
const { buildUnitStats, createBasicDamagePacket } = require("./combat-model");
const { run: validateSkillAssets } = require("./validate-skill-assets");
const { run: validateCombatSignals } = require("./validate-combat-signals");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateStats(stats, owner) {
  for (const key of Object.keys(stats)) {
    assert(key in EMPTY_STATS, `${owner} uses unknown stat: ${key}`);
    assert(typeof stats[key] === "number", `${owner}.${key} must be a number`);
  }
}

function validateEquipment() {
  assert(EQUIPMENT_SETS.length === 10, "There must be exactly 10 equipment sets");
  const ids = new Set();
  for (const set of EQUIPMENT_SETS) {
    assert(!ids.has(set.id), `Duplicate equipment id: ${set.id}`);
    ids.add(set.id);
    assert(set.name, `${set.id} is missing name`);
    assert(set.tier >= 1 && set.tier <= 10, `${set.id} tier must be 1-10`);
    validateStats(set.stats, set.id);
  }
}

function validateRelics() {
  assert(MAX_RELICS_PER_UNIT === 6, "Max relic count should be 6");
  assert(RELICS.length === 20, "There must be exactly 20 relics");
  const ids = new Set();
  for (const relic of RELICS) {
    assert(!ids.has(relic.id), `Duplicate relic id: ${relic.id}`);
    ids.add(relic.id);
    assert(relic.name, `${relic.id} is missing name`);
    assert(relic.trigger, `${relic.id} is missing trigger`);
    assert(relic.description, `${relic.id} is missing description`);
    assert(relic.effect, `${relic.id} is missing effect`);
    if (relic.effect.stats) {
      validateStats(relic.effect.stats, relic.id);
    }
  }
}

function validateUnitBuild() {
  const stats = buildUnitStats({
    classKey: "warrior",
    equipmentSetId: "dragonforged_set",
    relicIds: ["glass_blade", "stone_heart"],
  });
  assert(stats.attack > 0, "Built unit should have attack");
  assert(stats.hp > 0, "Built unit should have hp");
  const packet = createBasicDamagePacket(stats);
  assert(packet.entries.length >= 2, "Dragonforged warrior should create typed damage entries");
}

function run() {
  validateEquipment();
  validateRelics();
  validateUnitBuild();
  validateSkillAssets();
  validateCombatSignals();
  console.log("game data ok");
}

if (require.main === module) {
  run();
}

module.exports = { run };
