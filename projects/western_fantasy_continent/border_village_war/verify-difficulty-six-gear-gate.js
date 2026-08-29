"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const GAME = require("./border-village-core");

const analyzer = path.join(__dirname, "analyze-difficulty-six-gear-gate.js");
const env = { ...process.env };
delete env.D6_HP;
delete env.D6_POWER;
delete env.D6_ARMOR;

const report = JSON.parse(execFileSync(process.execPath, [analyzer, "50"], {
  cwd: __dirname,
  env,
  encoding: "utf8",
  maxBuffer: 4 * 1024 * 1024,
}));
const rows = Object.fromEntries(report.scenarios.map((row) => [row.id, row]));

assert.deepEqual(report.tuning, { hp: 4.5, power: 2.8, armor: 2 }, "Difficulty-six tuning changed without recalibrating its focused counter puzzle");
assert.deepEqual(GAME.GRIND_DIFFICULTIES[6].enemies.map(([role]) => role).sort(), ["knight", "knight", "mage", "mage", "mage", "mage", "priest", "priest"].sort(), "Difficulty six is no longer the focused fixed knight/mage/priest formation");
assert(rows.all_rare.winRate <= 10, `All-rare team clears too often: ${rows.all_rare.winRate}%`);
assert(rows.all_epic_plain.winRate <= 20, `Generic all-epic team clears too often: ${rows.all_epic_plain.winRate}%`);
assert(rows.all_epic_arcane_counter.winRate >= 80, `High-magic-resist all-epic counter team is not reliable: ${rows.all_epic_arcane_counter.winRate}%`);
assert(rows.all_epic_arcane_exposed.winRate <= 10, `Low-magic-resist exposed team clears too often: ${rows.all_epic_arcane_exposed.winRate}%`);
assert(rows.epic_myriad_set.winRate >= 75, `Representative melee epic six-piece route is not viable: ${rows.epic_myriad_set.winRate}%`);
assert(rows.epic_cavalry_set.winRate >= 65, `Representative cavalry epic six-piece route is not viable: ${rows.epic_cavalry_set.winRate}%`);

console.log(JSON.stringify({ status: "PASS", stage: report.stage, tuning: report.tuning, scenarios: report.scenarios }, null, 2));
