const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  buildHealthThresholdSignals,
  buildMapEventLog,
} = require("./map-cognition-v1-event-adapter");
const {
  matchCausalChain,
} = require("./causal-chain-event-matcher");
const REGION_1_CORE = require("../map_progression_lab/map-progression-cognition-core-phase2-midlock");
const REGION_2_CORE = require("../map_progression_lab/map-progression-chapter2-core");
const {
  parseAllPerceptionLevels,
  parseBattleInformation,
} = require("../experiments/player_agent_api_loop_v1/battle-information-parser");
const {
  organizeReceivedBattleInformation,
} = require("../experiments/player_agent_api_loop_v1/received-information-organizer");

const berserker = {
  id: "hero_berserker",
  name: "赤潮狂战士",
  side: "left",
  role: "狂战士",
};
const context = {
  expectationKey: "health-threshold-test",
  environment: {
    region: "region_1",
    node: "health_trial",
    nodeType: "trial",
  },
};

const steppedSnapshots = snapshots([
  [0.5, 100],
  [1, 74],
  [1.5, 70],
  [2, 49],
  [2.5, 40],
  [3, 24],
  [3.5, 20],
]);
const steppedSignals = buildHealthThresholdSignals(steppedSnapshots, context);
assert.deepEqual(
  steppedSignals.map((row) => [row.time, row.result.thresholdPercent, row.presentation.informationTier]),
  [
    [1, 75, "standard_low"],
    [2, 50, "standard_high"],
    [3, 25, "highlight"],
  ],
);
assert(steppedSignals.every((row) => row.learn === false));
assert(steppedSignals.every((row) => row.directResult === false));
assert(steppedSignals.every((row) => row.causalEvidenceOnly === true));

const jumpSignals = buildHealthThresholdSignals(snapshots([
  [0.5, 100],
  [1, 20],
]), context);
assert.deepEqual(
  jumpSignals.map((row) => row.result.thresholdPercent),
  [75, 50, 25],
);

const recoveredAndDroppedAgain = buildHealthThresholdSignals(snapshots([
  [0.5, 100],
  [1, 74],
  [2, 70],
  [3, 82],
  [4, 74],
  [5, 49],
  [6, 24],
]), context);
assert.deepEqual(
  recoveredAndDroppedAgain.map((row) => row.result.thresholdPercent),
  [75, 75, 50, 25],
);

const rates = {
  low: { 75: 0, 50: 0, 25: 0 },
  ordinary: { 75: 0, 50: 0, 25: 0 },
  high: { 75: 0, 50: 0, 25: 0 },
};
const sampleCount = 500;
for (let index = 0; index < sampleCount; index += 1) {
  const parsed = parseAllPerceptionLevels(steppedSignals, {
    seed: `health-rate:${index}`,
    causalContext: {
      region: "region_1",
      node: "health_trial",
      teamMembers: [berserker],
    },
  });
  assertNested(parsed);
  for (const level of Object.keys(rates)) {
    for (const threshold of [75, 50, 25]) {
      if (parsed[level].causalEvidence.some((row) => (
        row.qualifiers.includes(`health_${threshold}`)
      ))) {
        rates[level][threshold] += 1;
      }
    }
  }
}

for (const level of ["low", "ordinary", "high"]) {
  assert(rates[level][25] > rates[level][50]);
  assert(rates[level][50] > rates[level][75]);
}
for (const threshold of [75, 50, 25]) {
  assert(rates.high[threshold] > rates.ordinary[threshold]);
  assert(rates.ordinary[threshold] > rates.low[threshold]);
}

const routed = findRoutedHealthEvidence(steppedSignals);
assert.equal(routed.receivedObservations.length, 0);
assert.equal(routed.audit.causalEvidenceRoutedToKnowledge, false);
assert(routed.causalEvidence.some((row) => row.qualifiers.includes("health_25")));
assert.equal(routed.routes.causalKnowledge.length, 0);
assert.equal(routed.receivedObservations.length, 0);

const freshState = REGION_1_CORE.initialState("health-state-real-core", {
  environmentVariant: "enriched_v1",
});
const freshBattle = REGION_1_CORE.applyAction(
  freshState,
  "challenge:r1_main_1",
  { captureVisibleSignals: true },
);
assert.equal(freshBattle.ok, true);
assert(freshBattle.analysis.healthSnapshots.length > 0);
const freshRawEventLog = buildMapEventLog(
  "challenge:r1_main_1",
  freshBattle.event,
  {
    analysis: freshBattle.analysis,
    region: "region_1",
    nodeType: "main",
  },
);
const freshHealthRows = freshRawEventLog.filter((row) => row.type === "health_state");
assert(freshHealthRows.length > 0);
assert(freshHealthRows.some((row) => row.result.thresholdPercent === 25));

const chapter2State = REGION_2_CORE.initialState("health-state-chapter2", {
  environmentVariant: "enriched_v1",
});
const chapter2Battle = REGION_2_CORE.applyAction(
  chapter2State,
  "challenge:r2_entry",
  { captureVisibleSignals: true },
);
assert.equal(chapter2Battle.ok, true);
assert(chapter2Battle.analysis.healthSnapshots.length > 0);
const chapter2RawEventLog = buildMapEventLog(
  "challenge:r2_entry",
  chapter2Battle.event,
  {
    analysis: chapter2Battle.analysis,
    region: "region_2",
    nodeType: "main",
  },
);
const chapter2HealthRows = chapter2RawEventLog.filter((row) => row.type === "health_state");
assert(chapter2HealthRows.length > 0);

const archivePath = path.join(
  __dirname,
  "..",
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "2026-07-18_post_cognition_two_agents",
  "inertial_player_paired_alpha",
  "session.json",
);
assert(fs.existsSync(archivePath), "缺少狂战真实模拟存档");
const archive = JSON.parse(fs.readFileSync(archivePath, "utf8"));
const rawBerserkerBattle = structuredClone(archive.chapter1.history[13].rawEventLog);
const bloodFuryRaw = rawBerserkerBattle.find((row) => (
  row.type === "status"
  && row.time === 4.8
  && row.behavior?.key === "bloodStrike"
));
assert(bloodFuryRaw);
const derivedHealthRows = buildHealthThresholdSignals([
  {
    sequence: 1,
    time: 0.5,
    target: bloodFuryRaw.subject,
    hp: 100,
    maxHp: 100,
  },
  {
    sequence: 2,
    time: 4.72,
    target: bloodFuryRaw.subject,
    hp: 24,
    maxHp: 100,
  },
], {
  expectationKey: "archive:r1_main_6",
  environment: {
    region: "region_1",
    node: "r1_main_6",
    nodeType: "main",
  },
});
rawBerserkerBattle.push(...derivedHealthRows);
rawBerserkerBattle.sort((left, right) => left.time - right.time);
const teamMembers = collectTeamMembers(rawBerserkerBattle);
const parsedBerserker = parseBattleInformation(rawBerserkerBattle, {
  perceptionLevel: "high",
  seed: "health-berserker:1",
  causalContext: {
    region: "region_1",
    node: "r1_main_6",
    teamMembers,
  },
});
const receivedHealth25 = exact(parsedBerserker.causalEvidence, "health_dropped_below", 4.72, (row) => (
  row.qualifiers.includes("health_25") && row.subject.side === "left"
));
const receivedBloodFury = exact(parsedBerserker.causalEvidence, "damage_increased", 4.8, (row) => (
  sameRef(row.subject, receivedHealth25.subject)
));
const receivedKill = exact(parsedBerserker.causalEvidence, "target_defeated", 12.4, (row) => (
  sameRef(row.subject, receivedHealth25.subject)
));
const receivedWin = exact(parsedBerserker.causalEvidence, "combat_won", 27.52);
const lowHealthBerserkerChain = {
  id: "berserker-low-health-chain",
  claim: "狂战进入25%血量后触发强化并击败目标，随后队伍获胜",
  claimMode: "contributing_path",
  chosenBehavior: "让狂战在低血量窗口继续输出",
  causalChain: [
    matcherStep("进入25%血量", receivedHealth25, ["health_25"]),
    matcherStep("血怒强化生效", receivedBloodFury, ["damage_up", "power_up"]),
    matcherStep("狂战击败目标", receivedKill),
    matcherStep("队伍获胜", receivedWin),
  ],
};
const matchedBerserker = matchCausalChain({
  hypothesis: lowHealthBerserkerChain,
  receivedSemanticEvents: parsedBerserker.causalEvidence,
});
assert.equal(matchedBerserker.everify.status, "confirmed");
assert.equal(matchedBerserker.everify.dimensions.support, 1);

const publicJson = JSON.stringify(parsedBerserker.causalEvidence);
for (const forbidden of ["left-", "right-", "赤潮狂战士", "bloodStrike", "\"hp\"", "\"maxHp\""]) {
  assert(!publicJson.includes(forbidden), `公开血量证据泄漏内部字段：${forbidden}`);
}

console.log(JSON.stringify({
  result: "PASS",
  thresholds: [
    { percent: 75, informationTier: "standard_low" },
    { percent: 50, informationTier: "standard_high" },
    { percent: 25, informationTier: "highlight" },
  ],
  repeatedWhileStayingInBand: false,
  recoveryAllowsLaterReentry: true,
  multiThresholdJumpPreserved: true,
  receptionRates: Object.fromEntries(
    Object.entries(rates).map(([level, values]) => [
      level,
      Object.fromEntries(Object.entries(values).map(([threshold, count]) => [
        threshold,
        Number((count / sampleCount).toFixed(3)),
      ])),
    ]),
  ),
  freshCore: {
    chapter1: {
      healthSnapshots: freshBattle.analysis.healthSnapshots.length,
      healthThresholdEvents: freshHealthRows.length,
    },
    chapter2: {
      healthSnapshots: chapter2Battle.analysis.healthSnapshots.length,
      healthThresholdEvents: chapter2HealthRows.length,
    },
  },
  routing: {
    ordinarySignals: routed.receivedObservations.length,
    causalEvidence: routed.causalEvidence.length,
    causalKnowledge: routed.routes.causalKnowledge.length,
  },
  berserkerLowHealthChain: matchedBerserker.everify.status,
}, null, 2));

function snapshots(rows) {
  return rows.map(([time, hp], index) => ({
    sequence: index + 1,
    time,
    target: berserker,
    hp,
    maxHp: 100,
  }));
}

function assertNested(parsed) {
  const low = new Set(parsed.low.causalEvidence.map((row) => row.id));
  const ordinary = new Set(parsed.ordinary.causalEvidence.map((row) => row.id));
  const high = new Set(parsed.high.causalEvidence.map((row) => row.id));
  assert([...low].every((id) => ordinary.has(id)));
  assert([...ordinary].every((id) => high.has(id)));
}

function findRoutedHealthEvidence(rawEvents) {
  for (let index = 0; index < 200; index += 1) {
    const result = organizeReceivedBattleInformation(rawEvents, {
      seed: `health-routing:${index}`,
      episodeId: "health-routing",
      perceptionLevel: "high",
      causalContext: {
        region: "region_1",
        node: "health_trial",
        teamMembers: [berserker],
      },
    });
    if (result.causalEvidence.some((row) => row.qualifiers.includes("health_25"))) {
      return result;
    }
  }
  throw new Error("高感知200个固定种子内未收到25%血量证据");
}

function collectTeamMembers(events) {
  const rows = [];
  for (const event of events) {
    for (const ref of [event.subject, event.result?.target]) {
      if (ref?.side !== "left" || !ref.id || !ref.name) continue;
      if (!rows.some((row) => row.id === ref.id)) rows.push({ id: ref.id, name: ref.name });
    }
  }
  return rows;
}

function exact(events, predicate, time, extra = () => true) {
  const rows = events.filter((row) => (
    row.predicate === predicate
    && row.time === time
    && extra(row)
  ));
  assert.equal(rows.length, 1, `${predicate}@${time}应恰好命中一条，实际${rows.length}条`);
  return rows[0];
}

function matcherStep(id, evidence, qualifiersAll = []) {
  return {
    id,
    statement: id,
    matcher: {
      predicate: evidence.predicate,
      ...(evidence.actionId ? { actionId: evidence.actionId } : {}),
      subject: structuredClone(evidence.subject),
      object: structuredClone(evidence.object),
      qualifiersAll,
      environment: structuredClone(evidence.environment),
    },
  };
}

function sameRef(left, right) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {});
}
