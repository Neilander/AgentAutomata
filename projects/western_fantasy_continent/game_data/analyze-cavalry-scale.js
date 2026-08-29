"use strict";

const COMBAT = require("./combat-sim");
const SKILLS = require("./skill-data");

const GAMES = 50;
const SIZES = [4, 8, 20];

function spec(role, index) {
  return { role, name: `${SKILLS.roleKits[role].name}-${index + 1}`, ...SKILLS.roleKits[role].kit };
}

function teams(size) {
  const left = [];
  const right = [];
  for (let index = 0; index < size / 4; index += 1) {
    left.push(spec("knight", index), spec("cavalry", index), spec("mage", index), spec("priest", index));
    right.push(spec("knight", index), spec("warrior", index), spec("mage", index), spec("priest", index));
  }
  return { left, right };
}

function analyzeSize(size) {
  const totals = {
    wins: 0,
    duration: 0,
    cavalryDamage: 0,
    teamDamage: 0,
    cavalryKills: 0,
    teamKills: 0,
    cavalrySurvivalTime: 0,
    cavalryAliveAtEnd: 0,
    cavalryCount: 0,
    casts: { cavalryDoubleLeap: 0, cavalryRun: 0, cavalryWhirlwind: 0 },
  };
  for (let game = 0; game < GAMES; game += 1) {
    const matchup = teams(size);
    const result = COMBAT.simulateTeams(matchup.left, matchup.right, {
      seed: `cavalry-final-no-set|${size}|${game}`,
      randomizeStats: true,
      maxTime: 75,
    });
    if (result.winner === "left") totals.wins += 1;
    totals.duration += result.duration;
    totals.teamDamage += result.metrics.leftDamage;
    const leftUnits = result.units.filter((unit) => unit.side === "left");
    const cavalry = leftUnits.filter((unit) => unit.role === "cavalry");
    totals.cavalryCount += cavalry.length;
    totals.cavalryDamage += cavalry.reduce((sum, unit) => sum + unit.damageDone, 0);
    totals.cavalryKills += cavalry.reduce((sum, unit) => sum + unit.kills, 0);
    totals.teamKills += leftUnits.reduce((sum, unit) => sum + unit.kills, 0);
    totals.cavalrySurvivalTime += cavalry.reduce((sum, unit) => sum + unit.survivalTime, 0);
    totals.cavalryAliveAtEnd += cavalry.filter((unit) => unit.alive).length;
    for (const signal of result.signals.filter((signal) => signal.kind === "skill" && signal.source?.role === "马骑兵")) {
      if (signal.skillKey in totals.casts) totals.casts[signal.skillKey] += 1;
    }
  }
  const count = totals.cavalryCount;
  return {
    size: `${size}v${size}`,
    games: GAMES,
    cavalryPerTeam: size / 4,
    noEquipmentSets: true,
    winRatePct: round(totals.wins / GAMES * 100),
    averageDuration: round(totals.duration / GAMES),
    averageSurvivalTime: round(totals.cavalrySurvivalTime / count),
    endAliveRatePct: round(totals.cavalryAliveAtEnd / count * 100),
    damageSharePct: round(totals.cavalryDamage / totals.teamDamage * 100),
    damagePerCavalry: round(totals.cavalryDamage / count),
    killsPerCavalry: round(totals.cavalryKills / count),
    cavalryKillSharePct: round(totals.teamKills ? totals.cavalryKills / totals.teamKills * 100 : 0),
    castsPerCavalry: Object.fromEntries(Object.entries(totals.casts).map(([key, value]) => [key, round(value / count)])),
  };
}

function round(value) {
  return Number(value.toFixed(3));
}

console.log(JSON.stringify({
  setup: {
    gamesPerSize: GAMES,
    leftBlock: ["knight", "cavalry", "mage", "priest"],
    rightBlock: ["knight", "warrior", "mage", "priest"],
    note: "Cavalry replaces warrior in otherwise mirrored balanced blocks; no equipment or set mechanics are supplied.",
  },
  results: SIZES.map(analyzeSize),
}, null, 2));
