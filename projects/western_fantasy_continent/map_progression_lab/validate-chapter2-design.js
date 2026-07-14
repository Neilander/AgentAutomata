const assert = require("node:assert/strict");
const CORE = require("./map-progression-chapter2-core");
const ROSTER = require("./map-progression-roster");
const EQUIPMENT = require("../game_data/equipment-runtime");

function stateWithHeroes(seed, teamSlots) {
  const state = CORE.initialState(seed);
  state.roster = ROSTER.rescueHero(state.roster, "knight");
  state.roster = ROSTER.rescueHero(state.roster, "priest");
  state.teamSlots = [...teamSlots];
  return state;
}

function winRate(nodeId, teamSlots, samples = 100) {
  let wins = 0;
  let hpSum = 0;
  for (let index = 0; index < samples; index += 1) {
    const state = stateWithHeroes(`chapter2-key-${nodeId}-${index}`, teamSlots);
    state.attempts[nodeId] = 1;
    const result = CORE.resolveCombat(state, CORE.nodes.find((item) => item.id === nodeId));
    if (result.win) wins += 1;
    hpSum += Number(result.leftHp || 0) - Number(result.rightHp || 0);
  }
  return { wins, samples, rate: wins / samples, meanHpMargin: hpSum / samples };
}

function equipBest(state, skipEpic = false) {
  let changed = true;
  while (changed) {
    changed = false;
    let best = null;
    for (let itemIndex = 0; itemIndex < state.inventory.length; itemIndex += 1) {
      const item = state.inventory[itemIndex];
      if (skipEpic && item.rarity === "epic") continue;
      for (const heroId of state.teamSlots) {
        const hero = state.roster.find((unit) => unit.id === heroId);
        const oldItem = hero.equipment?.[item.slot] || null;
        const gain = EQUIPMENT.itemScoreForRole(item, hero.role) - (oldItem ? EQUIPMENT.itemScoreForRole(oldItem, hero.role) : 0);
        if (gain > 0 && (!best || gain > best.gain)) best = { itemIndex, hero, oldItem, gain };
      }
    }
    if (!best) continue;
    const [item] = state.inventory.splice(best.itemIndex, 1);
    best.hero.equipment = { ...(best.hero.equipment || {}) };
    if (best.oldItem) state.inventory.push(best.oldItem);
    best.hero.equipment[item.slot] = item;
    changed = true;
  }
  return state;
}

function clearNode(state, nodeId, maxAttempts = 8, equipRewards = true) {
  let next = state;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const result = CORE.applyAction(next, `challenge:${nodeId}`);
    assert.equal(result.ok, true);
    next = result.state;
    if (result.event.outcome === "win") return equipRewards ? equipBest(next) : next;
  }
  throw new Error(`standard progression could not clear ${nodeId}`);
}

function prepareBoss(seed, equipEpic) {
  let state = CORE.initialState(seed);
  for (const nodeId of ["r2_entry", "r2_knight_rescue", "r2_priest_rescue"]) state = clearNode(state, nodeId);
  state.teamSlots = ["hero_warrior", "hero_knight", "hero_priest", "hero_ranger"];
  equipBest(state);
  for (const nodeId of ["r2_shield_trial", "r2_flag_trial"]) state = clearNode(state, nodeId);
  state.teamSlots = ["hero_warrior", "hero_knight", "hero_mage", "hero_ranger"];
  equipBest(state);
  state = clearNode(state, "r2_confluence", 8, false);
  return equipBest(state, !equipEpic);
}

function bossRate(equipEpic, samples = 40) {
  let wins = 0;
  let gearScore = 0;
  for (let index = 0; index < samples; index += 1) {
    const state = prepareBoss(`chapter2-boss-key-${index}`, equipEpic);
    gearScore += CORE.gearScore(state);
    const result = CORE.applyAction(state, "challenge:r2_boss");
    if (result.event.outcome === "win") wins += 1;
  }
  return { wins, samples, rate: wins / samples, meanGearScore: gearScore / samples };
}

function main() {
  const entry = CORE.applyAction(CORE.initialState("chapter2-structure"), "challenge:r2_entry", { captureVisibleSignals: true });
  assert.equal(entry.ok, true);
  assert.equal(entry.event.outcome, "win");
  const visible = entry.observation.visibleNodes.map((item) => item.id);
  assert(visible.includes("r2_knight_rescue"));
  assert(visible.includes("r2_priest_rescue"));
  assert(!visible.includes("r2_confluence"));
  assert.equal(entry.event.loot[0].level, 22);
  assert.equal(entry.event.loot[0].rarity, "common");

  const shieldBefore = winRate("r2_shield_trial", ["hero_warrior", "hero_knight", "hero_mage", "hero_ranger"]);
  const shieldAfter = winRate("r2_shield_trial", ["hero_warrior", "hero_knight", "hero_priest", "hero_ranger"]);
  const flagBefore = winRate("r2_flag_trial", ["hero_warrior", "militia_barricade", "hero_priest", "hero_ranger"]);
  const flagAfter = winRate("r2_flag_trial", ["hero_warrior", "hero_knight", "hero_priest", "hero_ranger"]);
  const shieldLift = shieldAfter.rate - shieldBefore.rate;
  const flagLift = flagAfter.rate - flagBefore.rate;
  const roleKeyPass = (before, after) => before <= 0.35 && after >= 0.65 && after - before >= 0.35;
  const roleKeysPass = roleKeyPass(shieldBefore.rate, shieldAfter.rate) && roleKeyPass(flagBefore.rate, flagAfter.rate);
  const bossWithoutEpic = bossRate(false);
  const bossWithEpic = bossRate(true);
  const epicLift = bossWithEpic.rate - bossWithoutEpic.rate;
  const epicKeyPass = bossWithoutEpic.rate <= 0.4 && bossWithEpic.rate >= 0.65 && epicLift >= 0.3;

  const report = {
    result: roleKeysPass && epicKeyPass ? "PASS" : "FAIL",
    structure: {
      entryUnlocksBothRescues: true,
      confluenceInitiallyLocked: true,
      crossKeys: {
        shieldTrialUnlockedBy: "knight rescue lane",
        shieldTrialIntendedKey: "priest from other lane",
        flagTrialUnlockedBy: "priest rescue lane",
        flagTrialIntendedKey: "knight from other lane",
      },
    },
    roleKeyTests: {
      acceptanceWindow: { maximumPreKeyWinRate: 0.35, minimumPostKeyWinRate: 0.65, minimumAbsoluteLift: 0.35 },
      shieldPriestSwap: { before: shieldBefore, after: shieldAfter, absoluteLift: shieldLift, pass: roleKeyPass(shieldBefore.rate, shieldAfter.rate) },
      kingFlagKnightSwap: { before: flagBefore, after: flagAfter, absoluteLift: flagLift, pass: roleKeyPass(flagBefore.rate, flagAfter.rate) },
    },
    equipmentKeyTest: {
      target: "The same progressed team should read the four-affix Epic as a meaningful boss key.",
      epicHeld: bossWithoutEpic,
      epicEquipped: bossWithEpic,
      absoluteLift: epicLift,
      pass: epicKeyPass,
    },
  };
  console.log(JSON.stringify(report, null, 2));
  if (!roleKeysPass || !epicKeyPass) process.exitCode = 1;
}

main();
