const { CombatSimulation } = require("./combat-sim");
const ROSTER = require("../map_progression_lab/map-progression-roster");
const ENCOUNTERS = require("../map_progression_lab/map-progression-encounters");

const DT = 0.08;

function runFirstLevel(seed, candidateInput = {}) {
  const candidate = normalizeCandidate(candidateInput);
  const leftTeam = ROSTER.buildTeam(ROSTER.createInitialRoster(), ROSTER.INITIAL_TEAM_SLOTS, 1);
  const waves = ENCOUNTERS.firstRoadWaves(candidate.baseProfile).map((bigWave) => ({
    ...bigWave,
    smallWaves: bigWave.smallWaves.map((smallWave, smallIndex) => ({
      ...smallWave,
      spawnWhenRemaining: smallIndex === 0 && Number.isFinite(candidate.spawnWhenRemaining)
        ? candidate.spawnWhenRemaining
        : smallWave.spawnWhenRemaining,
      rightTeam: tuneEnemies(smallWave.rightTeam, candidate),
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
  const hitDetails = enemyUnits.map((unit) => ({ role: unit.role, hits: damageHits.get(unit.id) || 0 }));
  const targetHits = hitCounts.filter((count) => count >= candidate.targetMin && count <= candidate.targetMax).length;
  const leftUnits = sim.units.filter((unit) => unit.side === "left");
  return {
    candidate,
    duration: round(sim.time),
    win: leftUnits.some((unit) => sim.isAlive(unit)) && !enemyUnits.some((unit) => sim.isAlive(unit)),
    survivors: leftUnits.filter((unit) => sim.isAlive(unit)).length,
    enemyDamage: round(enemyUnits.reduce((sum, unit) => sum + (unit.damageDone || 0), 0)),
    oneHitRate: round(hitCounts.filter((count) => count <= 1).length / Math.max(1, hitCounts.length)),
    averageHitsPerEnemy: round(average(hitCounts)),
    medianHitsPerEnemy: median(hitCounts),
    targetHitRate: round(targetHits / Math.max(1, hitCounts.length)),
    underTargetHitRate: round(hitCounts.filter((count) => count < candidate.targetMin).length / Math.max(1, hitCounts.length)),
    overTargetHitRate: round(hitCounts.filter((count) => count > candidate.targetMax).length / Math.max(1, hitCounts.length)),
    hitHistogram: histogram(hitCounts),
    roleHits: summarizeRoleHits(hitDetails, candidate.targetMin, candidate.targetMax),
    firstDamageTime: round(Math.min(...damageEventTimes)),
    lastDeathTime: round(Math.max(...deathTimes.values())),
    longestDamageGap: round(longestGap(damageEventTimes)),
    spawnTimes,
  };
}

function normalizeCandidate(input) {
  if (typeof input === "number") return { id: `hp_${input}`, baseProfile: "effort_v0", meleeHpScale: input, rangedHpScale: input, armorAdd: 0, targetMin: 9, targetMax: 11 };
  return {
    id: input.id || "current",
    baseProfile: input.baseProfile || "effort_v0",
    meleeHpScale: Number(input.meleeHpScale ?? input.hpScale ?? 1),
    rangedHpScale: Number(input.rangedHpScale ?? input.hpScale ?? 1),
    armorAdd: Number(input.armorAdd || 0),
    spawnWhenRemaining: Number.isFinite(input.spawnWhenRemaining) ? Number(input.spawnWhenRemaining) : undefined,
    targetMin: Number(input.targetMin ?? 9),
    targetMax: Number(input.targetMax ?? 11),
  };
}

function tuneEnemies(team, candidate) {
  return team.map((spec) => {
    const hpScale = spec.range >= 24 ? candidate.rangedHpScale : candidate.meleeHpScale;
    const hp = Math.max(1, Math.round((spec.hp || spec.maxHp || 1) * hpScale));
    return {
      ...spec,
      hp,
      maxHp: hp,
      armor: Math.max(0, (spec.armor || 0) + candidate.armorAdd),
    };
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

function median(values) {
  if (!values.length) return 0;
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : round((ordered[middle - 1] + ordered[middle]) / 2);
}

function histogram(values) {
  return values.reduce((result, value) => {
    result[value] = (result[value] || 0) + 1;
    return result;
  }, {});
}

function summarizeRoleHits(details, targetMin, targetMax) {
  const roles = {};
  for (const detail of details) {
    const row = roles[detail.role] || (roles[detail.role] = []);
    row.push(detail.hits);
  }
  return Object.fromEntries(Object.entries(roles).map(([role, values]) => [role, {
    average: round(average(values)),
    targetRate: round(values.filter((value) => value >= targetMin && value <= targetMax).length / values.length),
    underTargetRate: round(values.filter((value) => value < targetMin).length / values.length),
    overTargetRate: round(values.filter((value) => value > targetMax).length / values.length),
  }]));
}

function round(value, digits = 3) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

function summarize(candidateInput, count = 80) {
  const candidate = normalizeCandidate(candidateInput);
  const runs = Array.from({ length: count }, (_, index) => runFirstLevel(`first-level-effort|${candidate.id}|${index}`, candidate));
  return {
    candidate,
    count,
    winRate: round(runs.filter((run) => run.win).length / count),
    averageDuration: round(average(runs.map((run) => run.duration))),
    durationRange: [Math.min(...runs.map((run) => run.duration)), Math.max(...runs.map((run) => run.duration))],
    averageOneHitRate: round(average(runs.map((run) => run.oneHitRate))),
    averageHitsPerEnemy: round(average(runs.map((run) => run.averageHitsPerEnemy))),
    averageMedianHitsPerEnemy: round(average(runs.map((run) => run.medianHitsPerEnemy))),
    averageTargetHitRate: round(average(runs.map((run) => run.targetHitRate))),
    averageUnderTargetHitRate: round(average(runs.map((run) => run.underTargetHitRate))),
    averageOverTargetHitRate: round(average(runs.map((run) => run.overTargetHitRate))),
    averageRoleHits: averageRoleRows(runs.map((run) => run.roleHits)),
    averageLongestDamageGap: round(average(runs.map((run) => run.longestDamageGap))),
    averageEnemyDamage: round(average(runs.map((run) => run.enemyDamage))),
    averageSurvivors: round(average(runs.map((run) => run.survivors))),
  };
}

if (require.main === module) {
  const selected = [
    { id: "paper_v0", baseProfile: "paper_v0" },
    { id: "effort_v0", baseProfile: "effort_v0" },
    { id: "hp_only", baseProfile: "effort_v0", hpScale: 2.5, spawnWhenRemaining: 2 },
    { id: "hp_armor", baseProfile: "effort_v0", hpScale: 2.05, armorAdd: 5, spawnWhenRemaining: 2 },
    { id: "split_overlap", baseProfile: "effort_v0", meleeHpScale: 2.45, rangedHpScale: 2.7, armorAdd: 1, spawnWhenRemaining: 3 },
    { id: "effort_v1", baseProfile: "effort_v1" },
    { id: "effort_v2", baseProfile: "effort_v2" },
  ];
  console.log(JSON.stringify(selected.map((candidate) => summarize(candidate)), null, 2));
}

function averageRoleRows(rows) {
  const roles = new Set(rows.flatMap((row) => Object.keys(row || {})));
  return Object.fromEntries([...roles].map((role) => [role, {
    average: round(average(rows.map((row) => row[role]?.average || 0))),
    targetRate: round(average(rows.map((row) => row[role]?.targetRate || 0))),
    underTargetRate: round(average(rows.map((row) => row[role]?.underTargetRate || 0))),
    overTargetRate: round(average(rows.map((row) => row[role]?.overTargetRate || 0))),
  }]));
}

module.exports = { normalizeCandidate, runFirstLevel, summarize };
