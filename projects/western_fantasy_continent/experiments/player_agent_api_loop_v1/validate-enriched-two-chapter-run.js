const assert = require("node:assert/strict");
const EQUIPMENT = require("../../game_data/equipment-runtime");
const ROSTER = require("../../map_progression_lab/map-progression-roster");
const REGION_1 = require("../../map_progression_lab/map-progression-cognition-core-phase2-midlock");
const REGION_2 = require("../../map_progression_lab/map-progression-chapter2-core");
const LOOP = require("./player-agent-loop");
const RUNNER = require("./enriched-two-chapter-run");

const defaultRegion1 = REGION_1.initialState("default-check", { starterVariant: "player_agent_role_wave" });
const enrichedRegion1 = REGION_1.initialState("enriched-check", {
  starterVariant: "player_agent_role_wave",
  environmentVariant: "enriched_v1",
});
assert.equal(defaultRegion1.flags.enrichedV1, false);
assert.equal(enrichedRegion1.flags.enrichedV1, true);

const region1Rules = REGION_1.nodes
  .filter((node) => node.id !== "r1_bandit")
  .map((node) => ({ node: node.id, rule: REGION_1.dropRuleForNode(node, enrichedRegion1) }));
const enrichedRegion2 = REGION_2.initialState("enriched-check", { environmentVariant: "enriched_v1" });
const region2Rules = REGION_2.nodes.map((node) => ({ node: node.id, rule: REGION_2.dropRuleForNode(enrichedRegion2, node) }));
for (const { node, rule } of [...region1Rules, ...region2Rules]) {
  assert.equal(round(Object.values(rule.rates).reduce((sum, value) => sum + value, 0)), 1, `${node} rates must sum to one`);
  assert.equal(rule.rates.mythic, 0.01, `${node} must have exactly 1% mythic per generated item`);
}

const probabilitySample = sampleMythicRate(region2Rules.find((row) => row.node === "r2_boss").rule, 100000);
assert.ok(probabilitySample.rate >= 0.0085 && probabilitySample.rate <= 0.0115, `observed mythic rate ${probabilitySample.rate}`);

const pairedA = structuredClone(enrichedRegion1);
pairedA.attempts.r1_main_1 = 1;
const pairedB = structuredClone(pairedA);
pairedB.inventory = EQUIPMENT.generateItems({ level: [1, 1], rates: { common: 1 }, count: 7 }, "unrelated-inventory");
assert.deepEqual(REGION_1.lootFor(pairedA, REGION_1.nodes.find((row) => row.id === "r1_main_1"), false), REGION_1.lootFor(pairedB, REGION_1.nodes.find((row) => row.id === "r1_main_1"), false));

let unlockState = enrichedRegion1;
unlockState.cleared = { r1_main_1: true, r1_main_2: true };
unlockState = forceWinRegion1(unlockState, "r1_main_3").state;
assert.ok(unlockState.roster.some((unit) => unit.id === "hero_berserker"));
unlockState.cleared.r1_main_4 = true;
unlockState.cleared.r1_main_5 = true;
unlockState = forceWinRegion1(unlockState, "r1_bandit").state;
assert.ok(unlockState.roster.some((unit) => unit.id === "hero_bard"));
unlockState.cleared.r1_main_6 = true;
unlockState.cleared.r1_main_7 = true;
unlockState = forceWinRegion1(unlockState, "r1_main_8").state;
assert.ok(unlockState.roster.some((unit) => unit.id === "hero_assassin"));

let chapter2Unlocks = enrichedRegion2;
chapter2Unlocks = forceWinRegion2(chapter2Unlocks, "r2_entry").state;
assert.ok(chapter2Unlocks.roster.some((unit) => unit.id === "hero_warlock"));
chapter2Unlocks.cleared.r2_knight_rescue = true;
chapter2Unlocks.cleared.r2_priest_rescue = true;
chapter2Unlocks.cleared.r2_shield_trial = true;
chapter2Unlocks.cleared.r2_flag_trial = true;
chapter2Unlocks = forceWinRegion2(chapter2Unlocks, "r2_confluence").state;
assert.ok(chapter2Unlocks.roster.some((unit) => unit.id === "hero_alchemist"));

let loopUnlock = LOOP.createSession("enriched-unlock-signal", 5, { profileId: "open_novice", environmentVariant: "enriched_v1" });
loopUnlock.gameState.cleared = { r1_main_1: true, r1_main_2: true };
loopUnlock.gameState.roster = ROSTER.rescueHero(loopUnlock.gameState.roster, "mage");
loopUnlock.gameState.teamSlots = ["hero_warrior", "militia_barricade", "hero_mage", "militia_herb"];
loopUnlock = LOOP.applyDecisionResponse(loopUnlock, {
  action: "challenge:r1_main_3",
  goalId: "grow_and_progress",
  reasoningChain: [{ kind: "affordance", evidence: "The visible main encounter is available." }],
  alternatives: [],
  hypothesis: null,
});
assert.equal(loopUnlock.history[0].outcome, "win");
assert.equal(loopUnlock.history[0].gameEvent.characterUnlock?.heroId, "hero_berserker");
assert.ok(loopUnlock.history[0].eventLog.some((event) => event.type === "character_unlock" && event.result?.heroId === "hero_berserker"));

const ordinaryLateTeam = REGION_1.enemyTeam(REGION_1.nodes.find((node) => node.id === "r1_main_9"), defaultRegion1);
const enrichedLateTeam = REGION_1.enemyTeam(REGION_1.nodes.find((node) => node.id === "r1_main_9"), enrichedRegion1);
assert.ok(sumHp(enrichedLateTeam) > sumHp(ordinaryLateTeam));
const ordinaryConfluence = REGION_2.enemyTeam(REGION_2.nodes.find((node) => node.id === "r2_confluence"), REGION_2.initialState("ordinary"));
const enrichedConfluence = REGION_2.enemyTeam(REGION_2.nodes.find((node) => node.id === "r2_confluence"), enrichedRegion2);
assert.ok(sumHp(enrichedConfluence) > sumHp(ordinaryConfluence));

let run = RUNNER.createRun({ seed: "transition-check", profileId: "open_novice" });
run.chapter1.gameState.cleared.r1_boss = true;
run.chapter1.gameState.roster = ROSTER.rescueHero(run.chapter1.gameState.roster, "berserker");
run.chapter1.gameState.roster[0].equipment.weapon = EQUIPMENT.generateItems({ level: [12, 12], rates: { legendary: 1 }, count: 1 }, "carry-check")[0];
run = RUNNER.advanceToChapter2(run);
assert.equal(run.chapter2.environmentVariant, "enriched_v1");
assert.equal(run.chapter2.gameState.flags.enrichedV1, true);
assert.ok(run.chapter2.gameState.roster.some((unit) => unit.id === "hero_berserker"));
assert.ok(run.chapter2.gameState.roster[0].equipment.weapon);
assert.equal(run.chapter1.agentContext.id, run.chapter2.agentContext.id);

console.log(JSON.stringify({
  result: "PASS",
  exactMythicRuleCount: region1Rules.length + region2Rules.length,
  probabilitySample,
  addedHeroes: ["hero_berserker", "hero_bard", "hero_assassin", "hero_warlock", "hero_alchemist"],
  semanticUnlockEvent: loopUnlock.history[0].eventLog.find((event) => event.type === "character_unlock")?.id,
  bottleneckHpMultipliers: {
    region1Main9: round(sumHp(enrichedLateTeam) / sumHp(ordinaryLateTeam)),
    region2Confluence: round(sumHp(enrichedConfluence) / sumHp(ordinaryConfluence)),
  },
  transition: run.chapter2.chapterTransition,
}, null, 2));

function forceWinRegion1(state, nodeId) {
  return REGION_1.applyAction(state, `challenge:${nodeId}`, { resolvedCombat: resolvedWin(), captureVisibleSignals: true });
}

function forceWinRegion2(state, nodeId) {
  return REGION_2.applyAction(state, `challenge:${nodeId}`, { resolvedCombat: resolvedWin(), captureVisibleSignals: true });
}

function resolvedWin() {
  return {
    winner: "left",
    duration: 10,
    leftHp: 0.9,
    rightHp: 0,
    metrics: { leftAlive: 4, rightAlive: 0 },
    units: [0, 1, 2, 3].map((index) => ({ side: "left", alive: true, hp: 100, name: `player-${index}`, role: "warrior", damageDone: 100 - index * 5 })),
    signals: [],
  };
}

function sampleMythicRate(rule, count) {
  let mythic = 0;
  for (let index = 0; index < count; index += 1) {
    const item = EQUIPMENT.generateItems({ ...rule, count: 1 }, `mythic-validation:${index}`, `sample_${index}`)[0];
    if (item.rarity === "mythic") mythic += 1;
  }
  return { items: count, mythic, rate: round(mythic / count, 5) };
}

function sumHp(team) {
  return team.reduce((sum, unit) => sum + Number(unit.maxHp || unit.hp || 0), 0);
}

function round(value, digits = 4) {
  return Number(Number(value || 0).toFixed(digits));
}
