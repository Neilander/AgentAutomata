const { CombatSimulation } = require("./combat-sim");
const ROSTER = require("../map_progression_lab/map-progression-roster");
const ENCOUNTERS = require("../map_progression_lab/map-progression-encounters");

const DT = 0.08;

function runFirstLevel(seed, hpScale = 1) {
  const leftTeam = ROSTER.buildTeam(ROSTER.createInitialRoster(), ROSTER.INITIAL_TEAM_SLOTS, 1);
  const waves = ENCOUNTERS.firstRoadWaves().map((bigWave) => ({
    ...bigWave,
    smallWaves: bigWave.smallWaves.map((smallWave) => ({
      ...smallWave,
      rightTeam: scaleHp(smallWave.rightTeam, hpScale),
    })),
  }));
  const sim = new CombatSimulation({ seed, maxTime: 30, randomizeStats: false, healthInterval: 0.5 });
  sim.time = 0;
  sim.nextId = 1;
  sim.logs = [];
  sim.signalBus.clear();
  sim.units = [...sim.makeTeam("left", leftTeam), ...sim.makeTeam("right", waves[0].smallWaves[0].rightTeam)];
  sim.runtimeField?.setup?.();

  let bigIndex = 0;
  let smallIndex = 0;
  let signalIndex = 0;
  let nextRightIndex = sim.units.filter((unit) => unit.side === "right").length;
  const damageHits = new Map();
  const deathTimes = new Map();
  const damageEventTimes = [];
  const spawnTimes = [{ bigIndex: 0, smallIndex: 0, time: 0 }];

  while (sim.time < sim.maxTime) {
    sim.update(DT);
    const newSignals = sim.signalBus.signals.slice(signalIndex);
    signalIndex = sim.signalBus.signals.length;
    for (const signal of newSignals) {
      if (signal.tags.includes("damage") && signal.target?.side === "right") {
        damageHits.set(signal.target.id, (damageHits.get(signal.target.id) || 0) + 1);
        damageEventTimes.push(signal.time);
        if (Number(signal.hpAfter) <= 0 && !deathTimes.has(signal.target.id)) deathTimes.set(signal.target.id, signal.time);
      }
    }

    const alliesAlive = sim.units.some((unit) => unit.side === "left" && sim.isAlive(unit));
    if (!alliesAlive) break;
    const enemiesAlive = sim.units.filter((unit) => unit.side === "right" && sim.isAlive(unit)).length;
    const currentSmall = waves[bigIndex].smallWaves[smallIndex];
    const nextSmall = waves[bigIndex].smallWaves[smallIndex + 1];
    if (nextSmall && enemiesAlive <= (currentSmall.spawnWhenRemaining ?? 1)) {
      smallIndex += 1;
      addReinforcements(sim, nextSmall.rightTeam, nextRightIndex);
      nextRightIndex += nextSmall.rightTeam.length;
      spawnTimes.push({ bigIndex, smallIndex, time: sim.time });
      continue;
    }
    if (enemiesAlive > 0) continue;
    const nextBig = waves[bigIndex + 1];
    if (!nextBig) break;
    bigIndex += 1;
    smallIndex = 0;
    addReinforcements(sim, nextBig.smallWaves[0].rightTeam, nextRightIndex);
    nextRightIndex += nextBig.smallWaves[0].rightTeam.length;
    spawnTimes.push({ bigIndex, smallIndex: 0, time: sim.time });
  }

  const enemyUnits = sim.units.filter((unit) => unit.side === "right");
  const hitCounts = enemyUnits.map((unit) => damageHits.get(unit.id) || 0);
  const leftUnits = sim.units.filter((unit) => unit.side === "left");
  return {
    duration: round(sim.time),
    win: leftUnits.some((unit) => sim.isAlive(unit)) && !enemyUnits.some((unit) => sim.isAlive(unit)),
    survivors: leftUnits.filter((unit) => sim.isAlive(unit)).length,
    enemyDamage: round(enemyUnits.reduce((sum, unit) => sum + (unit.damageDone || 0), 0)),
    oneHitRate: round(hitCounts.filter((count) => count <= 1).length / Math.max(1, hitCounts.length)),
    averageHitsPerEnemy: round(average(hitCounts)),
    firstDamageTime: round(Math.min(...damageEventTimes)),
    lastDeathTime: round(Math.max(...deathTimes.values())),
    longestDamageGap: round(longestGap(damageEventTimes)),
    spawnTimes,
  };
}

function scaleHp(team, hpScale) {
  return team.map((spec) => {
    const hp = Math.max(1, Math.round((spec.hp || spec.maxHp || 1) * hpScale));
    return { ...spec, hp, maxHp: hp };
  });
}

function addReinforcements(sim, specs, nextIndex) {
  const incoming = sim.makeTeam("right", specs);
  incoming.forEach((unit, index) => {
    unit.index = nextIndex + index;
    unit.id = `right-${unit.index + 1}`;
  });
  sim.units.push(...incoming);
}

function longestGap(values) {
  if (values.length < 2) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  let longest = 0;
  for (let index = 1; index < ordered.length; index += 1) longest = Math.max(longest, ordered[index] - ordered[index - 1]);
  return longest;
}

function average(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round(value, digits = 3) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function summarize(hpScale, count = 40) {
  const runs = Array.from({ length: count }, (_, index) => runFirstLevel(`first-level-effort|${index}`, hpScale));
  return {
    hpScale,
    count,
    winRate: round(runs.filter((run) => run.win).length / count),
    averageDuration: round(average(runs.map((run) => run.duration))),
    durationRange: [Math.min(...runs.map((run) => run.duration)), Math.max(...runs.map((run) => run.duration))],
    averageOneHitRate: round(average(runs.map((run) => run.oneHitRate))),
    averageHitsPerEnemy: round(average(runs.map((run) => run.averageHitsPerEnemy))),
    averageLongestDamageGap: round(average(runs.map((run) => run.longestDamageGap))),
    averageEnemyDamage: round(average(runs.map((run) => run.enemyDamage))),
    averageSurvivors: round(average(runs.map((run) => run.survivors))),
  };
}

if (require.main === module) {
  const scales = process.argv.slice(2).map(Number).filter((value) => Number.isFinite(value) && value > 0);
  const selected = scales.length ? scales : [1, 1.5, 2, 2.5, 3];
  console.log(JSON.stringify(selected.map((scale) => summarize(scale)), null, 2));
}

module.exports = { runFirstLevel, summarize };
