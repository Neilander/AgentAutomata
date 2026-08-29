"use strict";

const COMBAT = require("./combat-sim");
const GAME = require("../border_village_war/border-village-core");

const GAMES = 50;
const SIZES = [4, 8, 20];
const THRESHOLDS = [16, 20, 24, 28];
const CONTINUITY_GRACE = 0.4;

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return round(sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))]);
}

function useAnalysisThreshold(sim, threshold) {
  sim.recordCavalryMovement = function recordCavalryMovementAtThreshold(unit, before, after, movementKind = "move") {
    if (!unit?.mechanicModifiers?.["set:cavalryCharge:foundation"]) return;
    const distance = this.getDistance(before, after);
    if (!(distance > 0)) return;
    unit.cavalryMovingTimer = Math.max(unit.cavalryMovingTimer || 0, 0.3);
    if (!unit.mechanicModifiers?.["set:cavalryCharge:breakthrough"] || unit.cavalryChargeReady) return;
    unit.cavalryChargeContinuityTimer = CONTINUITY_GRACE;
    unit.cavalryDistance = (unit.cavalryDistance || 0) + distance;
    if (unit.cavalryDistance < threshold) return;
    this.enterCavalryChargeState(unit, movementKind, unit.cavalryDistance, { threshold });
  };
}

function analyze(size, threshold) {
  const totals = {
    cavalry: 0,
    ridersReady: 0,
    ready: 0,
    breakthrough: 0,
    chargeHits: 0,
    chargeDamage: 0,
    cavalryDamage: 0,
    resets: 0,
    firstReadyTimes: [],
    readyWithinOneSecond: 0,
    readyWithinTwoSeconds: 0,
    sources: {},
  };

  for (let game = 0; game < GAMES; game += 1) {
    const plan = GAME.cavalryMockPlan(size, "fullSets");
    const sim = new COMBAT.CombatSimulation({
      seed: `cavalry-charge-threshold|${size}|${game}`,
      randomizeStats: true,
      maxTime: plan.maxTime,
    });
    useAnalysisThreshold(sim, threshold);
    const result = sim.run(plan.leftTeam, plan.rightTeam);
    const riders = result.units.filter((unit) => unit.side === "left" && unit.role === "cavalry");
    const riderIds = new Set(riders.map((unit) => unit.id));
    const readySignals = result.signals.filter((signal) => riderIds.has(signal.source?.id) && signal.tags?.includes("equipmentSet") && signal.tags?.includes("cavalryCharge") && signal.tags?.includes("chargeReady"));
    const breakthroughs = result.signals.filter((signal) => riderIds.has(signal.source?.id) && signal.kind === "movement" && signal.tags?.includes("cavalryCharge") && signal.tags?.includes("breakthrough"));
    const chargeHits = result.signals.filter((signal) => riderIds.has(signal.source?.id) && signal.kind === "damage" && signal.tags?.includes("cavalryCharge") && signal.tags?.includes("breakthrough"));
    const resets = result.signals.filter((signal) => riderIds.has(signal.source?.id) && signal.tags?.includes("chargeProgressReset"));

    totals.cavalry += riders.length;
    totals.ready += readySignals.length;
    totals.breakthrough += breakthroughs.length;
    totals.chargeHits += chargeHits.length;
    totals.chargeDamage += chargeHits.reduce((sum, signal) => sum + (Number(signal.amount) || 0), 0);
    totals.cavalryDamage += riders.reduce((sum, rider) => sum + rider.damageDone, 0);
    totals.resets += resets.length;

    for (const rider of riders) {
      const riderReady = readySignals.filter((signal) => signal.source.id === rider.id);
      if (!riderReady.length) continue;
      totals.ridersReady += 1;
      const firstTime = Math.min(...riderReady.map((signal) => signal.time));
      totals.firstReadyTimes.push(firstTime);
      if (firstTime <= 1) totals.readyWithinOneSecond += 1;
      if (firstTime <= 2) totals.readyWithinTwoSeconds += 1;
    }
    for (const signal of readySignals) {
      const source = signal.meta?.movementKind || "unknown";
      totals.sources[source] = (totals.sources[source] || 0) + 1;
    }
  }

  return {
    threshold,
    size: `${size}v${size}`,
    samples: GAMES,
    cavalrySamples: totals.cavalry,
    ridersEverReadyPct: round(totals.ridersReady / totals.cavalry * 100),
    readyPerRider: round(totals.ready / totals.cavalry),
    breakthroughPerRider: round(totals.breakthrough / totals.cavalry),
    conversionPct: round(totals.ready ? totals.breakthrough / totals.ready * 100 : 0),
    firstReadySeconds: {
      median: percentile(totals.firstReadyTimes, 0.5),
      p90: percentile(totals.firstReadyTimes, 0.9),
    },
    readyWithinOneSecondPct: round(totals.readyWithinOneSecond / totals.cavalry * 100),
    readyWithinTwoSecondsPct: round(totals.readyWithinTwoSeconds / totals.cavalry * 100),
    progressResetsPerRider: round(totals.resets / totals.cavalry),
    triggerSourcesPct: Object.fromEntries(Object.entries(totals.sources).map(([key, value]) => [key, round(value / totals.ready * 100)])),
    chargeHitsPerRider: round(totals.chargeHits / totals.cavalry),
    chargeDamageSharePct: round(totals.cavalryDamage ? totals.chargeDamage / totals.cavalryDamage * 100 : 0),
  };
}

console.log(JSON.stringify({
  setup: {
    gamesPerThresholdAndSize: GAMES,
    thresholds: THRESHOLDS,
    sizes: SIZES,
    lineup: "full-set knightless training-ground lineup",
    commonRandomSeedsAcrossThresholds: true,
    geometry: {
      playableWidth: 86,
      cavalryBaseMoveSpeed: 12,
      fullSetMoveSpeed: 15,
      doubleLeapDistance: 20,
      fullSetRunDistance: 15,
    },
  },
  results: THRESHOLDS.flatMap((threshold) => SIZES.map((size) => analyze(size, threshold))),
}, null, 2));
