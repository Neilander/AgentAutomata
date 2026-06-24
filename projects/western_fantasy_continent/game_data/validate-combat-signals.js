const assert = require("assert");
const { simulatePresetMatchup } = require("./combat-sim");

function run() {
  const result = simulatePresetMatchup("shadowExecute", "ironWall", {
    seed: "signal-validation",
    randomizeStats: false,
    healthInterval: 0.5,
  });
  const signals = result.signals;

  assert(signals.some((signal) => signal.tags.includes("basic") && signal.tags.includes("damage")), "missing basic damage signal");
  assert(signals.some((signal) => signal.tags.includes("skill") && signal.tags.includes("cast")), "missing skill cast signal");
  assert(signals.some((signal) => signal.tags.includes("health") && signal.tags.includes("snapshot")), "missing health snapshot signal");

  const taunts = signals.filter((signal) => signal.skillKey === "tauntLine" && signal.tags.includes("cast"));
  assert(taunts.length > 0, "tauntLine never cast");
  assert(taunts.some((taunt) => signals.some((signal) => (
    signal.time >= taunt.time
    && signal.time <= taunt.time + 5
    && signal.tags.includes("damage")
    && signal.source?.role === "刺客"
    && signal.target?.id === taunt.source?.id
  ))), "melee taunt did not redirect assassin damage");

  console.log("combat signals ok");
}

if (require.main === module) run();

module.exports = { run };
