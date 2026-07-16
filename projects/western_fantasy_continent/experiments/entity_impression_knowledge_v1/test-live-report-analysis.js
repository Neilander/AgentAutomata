const assert = require("assert");
const fs = require("fs");
const path = require("path");
const MODEL = require("./entity-impression-model");

const sessionPath = path.resolve(__dirname, "../player_agent_api_loop_v1/causal_verification_v9_concept_interpreter/session.json");
const session = JSON.parse(fs.readFileSync(sessionPath, "utf8"));
const record = session.history.find((row) => row.action?.startsWith("challenge:"));
const analysis = MODEL.analyzeBattleReport({
  id: `live:${record.gameEvent.node}`,
  environment: { id: record.gameEvent.node, tags: ["early_main", "mixed"] },
  gameEvent: record.gameEvent,
  eventLog: record.eventLog,
}, { profile: "ordinary" });

assert.strictEqual(analysis.units.length, 4, "aggregate player_squad events must not become a fifth unit");
const mage = analysis.units.find((unit) => unit.name === "烬火法师");
const warrior = analysis.units.find((unit) => unit.name === "灰鸦战士");
assert(mage.strength.level > 0, "the settled live report should show the mage as strong");
assert(mage.traits.some((trait) => trait.domain === "area_damage"), "distinct visible targets should support mage area-damage knowledge");
assert(!warrior.traits.some((trait) => trait.domain === "single_target_damage"), "collapsed enemy identities must not turn ambiguous warrior hits into single-target knowledge");

console.log(JSON.stringify({
  result: "PASS",
  unitCount: analysis.units.length,
  mageStrength: mage.strength,
  mageTraits: mage.traits,
  warriorStrength: warrior.strength,
  warriorTraits: warrior.traits,
  unresolvedSignal: "old semantic reports need result.meta.visibleTargetCount for reliable same-concept area classification",
}, null, 2));
