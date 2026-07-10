const COMBAT = require("./combat-sim");
const SKILL_DATA = require("./skill-data");
const CORE = require("../map_progression_lab/map-progression-cognition-core");

const nodes = Object.fromEntries(CORE.nodes.map((item) => [item.id, item]));

function stateWithGear(score, seed = "sweep") {
  const state = CORE.initialState(seed);
  if (score > 0) state.equipped.weapon = { slot: "weapon", power: score };
  return state;
}

function scaleTeam(team, factor) {
  return team.map((unit) => ({
    ...unit,
    hp: Math.round(unit.hp * factor),
    maxHp: Math.round(unit.maxHp * factor),
    power: Math.round(unit.power * factor),
    physicalPower: Math.round(unit.physicalPower * factor),
    magicPower: Math.round(unit.magicPower * factor),
    armor: Math.round(unit.armor * (0.9 + factor * 0.1)),
  }));
}

function fieldFor(node) {
  if (node.id.includes("prison")) return "sentry_suppression";
  if (node.id.includes("bandit")) return "heavy_shield_line";
  if (node.id === "r1_main_5") return "heavy_shield_line";
  if (node.type === "boss") return "pressure_corridor";
  return "";
}

function restoreFullKits(team) {
  return team.map((unit) => {
    const kit = SKILL_DATA.roleKits?.[unit.role]?.kit || {};
    return { ...unit, small1: kit.small1, small2: kit.small2, passive: kit.passive, ultimate: kit.ultimate };
  });
}

function sample(nodeId, gear, enemyFactor, count = 30, field = true, rescued = false, fullEnemyKits = false) {
  const node = nodes[nodeId];
  let wins = 0;
  let hpMargin = 0;
  let leftAlive = 0;
  let duration = 0;
  for (let index = 0; index < count; index += 1) {
    const state = stateWithGear(gear, `sweep-${nodeId}-${gear}-${enemyFactor}-${index}`);
    if (rescued) state.cleared.r1_prison = true;
    const baseEnemy = CORE.enemyTeam(node);
    const result = COMBAT.simulateTeams(CORE.playerTeam(state), scaleTeam(fullEnemyKits ? restoreFullKits(baseEnemy) : baseEnemy, enemyFactor), {
      seed: `sweep|${nodeId}|${gear}|${enemyFactor}|${index}`,
      randomizeStats: false,
      fieldEffectId: field ? fieldFor(node) : "",
      maxTime: 70,
    });
    wins += result.winner === "left" ? 1 : 0;
    hpMargin += result.leftHp - result.rightHp;
    leftAlive += result.metrics.leftAlive;
    duration += result.duration;
  }
  return {
    nodeId,
    gear,
    enemyFactor,
    field,
    rescued,
    fullEnemyKits,
    winRate: Math.round(wins / count * 1000) / 1000,
    averageHpMargin: Math.round(hpMargin / count * 1000) / 1000,
    averageLeftAlive: Math.round(leftAlive / count * 1000) / 1000,
    averageDuration: Math.round(duration / count * 1000) / 1000,
  };
}

function run() {
  const prison = [];
  for (const gear of [0, 20, 30, 40, 55]) {
    for (const factor of [1, 1.15, 1.3, 1.45, 1.6, 1.75]) prison.push(sample("r1_prison", gear, factor));
  }
  const fieldContrast = [
    sample("r1_prison", 30, 1.3, 30, true),
    sample("r1_prison", 30, 1.3, 30, false),
    sample("r1_bandit", 30, 1, 30, true),
    sample("r1_bandit", 30, 1, 30, false),
  ];
  const prisonFullKits = [];
  for (const gear of [20, 30, 40, 55]) {
    for (const factor of [1, 1.15, 1.3, 1.45, 1.6, 1.75, 2]) prisonFullKits.push(sample("r1_prison", gear, factor, 30, true, false, true));
  }
  const roleProof = [
    sample("r1_main_5", 45, 1, 30, false, false),
    sample("r1_main_5", 45, 1, 30, false, true),
  ];
  return { prison, prisonFullKits, fieldContrast, roleProof };
}

if (require.main === module) console.log(JSON.stringify(run(), null, 2));

module.exports = { sample, run };
