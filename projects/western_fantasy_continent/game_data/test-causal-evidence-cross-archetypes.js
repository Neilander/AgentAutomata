const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseAllPerceptionLevels,
} = require("../experiments/player_agent_api_loop_v1/battle-information-parser");
const {
  matchCausalChain,
} = require("./causal-chain-event-matcher");

const archiveRoot = path.join(
  __dirname,
  "..",
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "2026-07-18_post_cognition_two_agents",
);
const inertialSessionPath = path.join(
  archiveRoot,
  "inertial_player_paired_alpha",
  "session.json",
);
const noviceSessionPath = path.join(
  archiveRoot,
  "open_novice_paired_alpha",
  "session.json",
);
const bardSessionPath = path.join(
  __dirname,
  "..",
  ".local_run_archive",
  "player_agent_api_loop_v1",
  "controlled_runs",
  "2026-07-17_enriched_two_chapter",
  "open_novice",
  "paired-alpha",
  "session.json",
);

assert(fs.existsSync(inertialSessionPath), "缺少惯性玩家真实模拟存档");
assert(fs.existsSync(noviceSessionPath), "缺少开放新手真实模拟存档");
assert(fs.existsSync(bardSessionPath), "缺少吟游玩家真实模拟存档");

const inertial = JSON.parse(fs.readFileSync(inertialSessionPath, "utf8"));
const novice = JSON.parse(fs.readFileSync(noviceSessionPath, "utf8"));
const bardSession = JSON.parse(fs.readFileSync(bardSessionPath, "utf8"));

const parsedCases = {
  berserker: parseRecord(inertial.chapter1.history[13], "cross:berserker:39"),
  knightWin: parseRecord(inertial.chapter2.history[12], "cross:knightWin:0"),
  knightLoss: parseRecord(inertial.chapter2.history[9], "cross:knightLoss:1"),
  ranger: parseRecord(novice.chapter1.history[11], "cross:ranger:8"),
  priest: parseRecord(novice.chapter2.history[3], "cross:priest:43"),
  mage: parseRecord(inertial.chapter1.history[11], "cross:mage:14"),
  bard: parseRecord(bardSession.chapter1.history[16], "cross:bard:8"),
};

for (const [caseId, parsed] of Object.entries(parsedCases)) {
  assertNestedPerception(parsed, caseId);
}

const berserkerEvidence = parsedCases.berserker.high.causalEvidence;
const berserkerCast = exact(berserkerEvidence, "skill_cast", 4.8, (row) => row.subject.side === "left");
const bloodFury = exact(berserkerEvidence, "damage_increased", 4.8, (row) => row.subject.side === "left");
const berserkerKill = exact(berserkerEvidence, "target_defeated", 12.4, (row) => row.subject.side === "left");
const berserkerWin = one(berserkerEvidence, "combat_won");
assert.equal(berserkerCast.actionId, bloodFury.actionId);
const berserkerChain = makeHypothesis("狂战血怒链", [
  matchStep("施放血怒技能", berserkerCast),
  matchStep("血怒增伤生效", bloodFury, ["damage_up", "power_up"]),
  matchStep("狂战击败目标", berserkerKill),
  outcomeStep("战斗胜利", "combat_won", berserkerWin.subject),
]);
const berserkerHigh = run(berserkerChain, berserkerEvidence);
assert.equal(berserkerHigh.everify.status, "confirmed");

const knightWinEvidence = parsedCases.knightWin.high.causalEvidence;
const bannerCast = exact(knightWinEvidence, "skill_cast", 20.24, (row) => (
  row.subject.side === "left" && row.qualifiers.includes("ultimate")
));
const bannerShield = exact(knightWinEvidence, "shield_applied", 20.24, (row) => (
  row.subject.side === "left" && row.actionId === bannerCast.actionId
));
const knightWin = one(knightWinEvidence, "combat_won");
const knightChain = makeHypothesis("骑士旗墙保护链", [
  matchStep("骑士施放旗墙", bannerCast, ["ultimate"]),
  matchStep("旗墙形成护盾", bannerShield, ["shielded", "ultimate"]),
  outcomeStep("战斗胜利", "combat_won", knightWin.subject),
]);
const knightHigh = run(knightChain, knightWinEvidence);
assert.equal(knightHigh.everify.status, "confirmed");

const knightLossEvidence = parsedCases.knightLoss.high.causalEvidence;
const lossBannerCast = exact(knightLossEvidence, "skill_cast", 54.16, (row) => (
  row.subject.side === "left" && row.qualifiers.includes("ultimate")
));
const lossBannerShield = exact(knightLossEvidence, "shield_applied", 54.16, (row) => (
  row.subject.side === "left" && row.actionId === lossBannerCast.actionId
));
const knightLoss = one(knightLossEvidence, "combat_lost");
const knightFailureChain = makeHypothesis("骑士旗墙会带来胜利", [
  matchStep("骑士施放旗墙", lossBannerCast, ["ultimate"]),
  matchStep("旗墙形成护盾", lossBannerShield, ["shielded", "ultimate"]),
  outcomeStep("战斗胜利", "combat_won", knightLoss.subject),
]);
const knightFailure = run(knightFailureChain, knightLossEvidence);
assert.equal(knightFailure.everify.status, "refuted");
assert.equal(
  knightFailure.stepMatches.at(-1).reason,
  "opposite_predicate:combat_lost",
);

const priestEvidence = parsedCases.priest.high.causalEvidence;
const priestHeal = exact(priestEvidence, "heal_applied", 2.96, (row) => row.subject.side === "left");
const priestShield = exact(priestEvidence, "shield_applied", 3.04, (row) => (
  row.subject.side === "left" && sameRef(row.object, priestHeal.object)
));
const priestWin = one(priestEvidence, "combat_won");
const priestChain = makeHypothesis("牧师治疗保护链", [
  matchStep("牧师治疗队友", priestHeal),
  matchStep("牧师给同一队友护盾", priestShield, ["shielded"]),
  outcomeStep("战斗胜利", "combat_won", priestWin.subject),
]);
const priestHigh = run(priestChain, priestEvidence);
assert.equal(priestHigh.everify.status, "confirmed");

const rangerEvidence = parsedCases.ranger.high.causalEvidence;
const rangerSlow = exact(rangerEvidence, "control_applied", 21.12, (row) => row.subject.side === "left");
const rangerKill = exact(rangerEvidence, "target_defeated", 21.12, (row) => (
  sameRef(row.subject, rangerSlow.subject) && sameRef(row.object, rangerSlow.object)
));
const rangerWin = one(rangerEvidence, "combat_won");
const rangerChain = makeHypothesis("游侠定身击杀链", [
  matchStep("游侠减速目标", rangerSlow, ["slow"]),
  matchStep("游侠击败同一目标", rangerKill, [], true),
  outcomeStep("战斗胜利", "combat_won", rangerWin.subject),
]);
const rangerHigh = run(rangerChain, rangerEvidence);
assert.equal(rangerHigh.everify.status, "confirmed");

const mageEvidence = parsedCases.mage.high.causalEvidence;
const fireballCast = exact(mageEvidence, "skill_cast", 8, (row) => row.subject.side === "left");
const burnDamage = exact(mageEvidence, "damage_dealt", 11.12, (row) => (
  sameRef(row.subject, fireballCast.subject) && row.qualifiers.includes("burn")
));
const mageLoss = one(mageEvidence, "combat_lost");
const mageExpectedWinChain = makeHypothesis("法师灼烧会带来胜利", [
  matchStep("法师施放火球", fireballCast),
  matchStep("法师造成灼烧伤害", burnDamage, ["burn"]),
  outcomeStep("战斗胜利", "combat_won", mageLoss.subject),
]);
const mageFailure = run(mageExpectedWinChain, mageEvidence);
assert.equal(mageFailure.everify.status, "refuted");
assert.equal(mageFailure.stepMatches.at(-1).reason, "opposite_predicate:combat_lost");

const bardEvidence = parsedCases.bard.high.causalEvidence;
const tempoCast = exact(bardEvidence, "skill_cast", 2.88, (row) => row.subject.side === "left");
const powerBuff = exact(bardEvidence, "damage_increased", 2.96, (row) => (
  row.subject.side === "left" && row.qualifiers.includes("power_up")
));
const hasteBuff = bardEvidence.find((row) => (
  row.predicate === "buff_applied"
  && row.time === 2.88
  && row.subject.side === "left"
  && row.actionId === tempoCast.actionId
  && row.qualifiers.includes("haste")
));
assert(hasteBuff, "应收到吟游在2.88秒施加的至少一条加速证据");
const bardMechanismChain = makeHypothesis("吟游连续增益链", [
  matchStep("吟游施放节奏技能", tempoCast),
  matchStep("队友获得加速", hasteBuff, ["haste"]),
  matchStep("队友获得增伤", powerBuff, ["damage_up", "power_up"]),
]);
const bardMechanism = run(bardMechanismChain, bardEvidence);
assert.equal(bardMechanism.everify.status, "confirmed");

const guardCast = exact(knightWinEvidence, "skill_cast", 15.6, (row) => row.subject.side === "left");
assert.notEqual(guardCast.actionId, bannerCast.actionId);
const wrongSkillEvidence = [
  guardCast,
  bannerShield,
  knightWin,
];
const wrongSkill = run(knightChain, wrongSkillEvidence);
assert.equal(wrongSkill.stepMatches[0].state, "unknown");
assert.notEqual(wrongSkill.everify.status, "confirmed");

const rawActionHypothesis = structuredClone(knightChain);
rawActionHypothesis.id = "禁止使用内部技能名";
rawActionHypothesis.causalChain[0].matcher.actionId = "bannerWall";
const rawActionRejected = run(rawActionHypothesis, knightWinEvidence);
assert.equal(rawActionRejected.status, "invalid_input");
assert(rawActionRejected.hypothesisValidation.errors.includes(
  "step_0_action_id_must_be_opaque_public_id",
));

const reversedPriestEvidence = priestEvidence.map((row) => {
  if (row.id === priestHeal.id) return { ...row, time: 3.2 };
  if (row.id === priestShield.id) return { ...row, time: 3.04 };
  return row;
});
const reversedPriest = run(priestChain, reversedPriestEvidence);
assert.equal(reversedPriest.everify.status, "refuted");
assert.equal(reversedPriest.everify.chainAudit.links[0].temporalOrderValid, false);

const publicJson = JSON.stringify(Object.fromEntries(
  Object.entries(parsedCases).map(([caseId, parsed]) => [
    caseId,
    Object.fromEntries(["low", "ordinary", "high"].map((level) => [
      level,
      parsed[level].causalEvidence,
    ])),
  ]),
));
for (const forbidden of [
  "白垒骑士",
  "赤潮狂战士",
  "晨祷牧师",
  "烬火法师",
  "林地游侠",
  "银弦吟游诗人",
  "bannerWall",
  "bloodStrike",
  "pinningArrow",
  "tempoSong",
  "left-1",
  "right-1",
]) {
  assert(!publicJson.includes(forbidden), `公开因果证据泄漏内部身份：${forbidden}`);
}

const positiveCases = [
  ["狂战", berserkerChain, parsedCases.berserker],
  ["骑士", knightChain, parsedCases.knightWin],
  ["牧师", priestChain, parsedCases.priest],
  ["游侠", rangerChain, parsedCases.ranger],
];
const perceptionResults = Object.fromEntries(positiveCases.map(([label, hypothesis, parsed]) => [
  label,
  Object.fromEntries(["low", "ordinary", "high"].map((level) => [
    level,
    run(hypothesis, parsed[level].causalEvidence).everify.status,
  ])),
]));
const archivedBerserkerHasHealthStateEvidence = parsedCases.berserker.high.causalEvidence.some((row) => (
  row.predicate === "health_dropped_below"
));
assert.equal(archivedBerserkerHasHealthStateEvidence, false);

console.log(JSON.stringify({
  result: "PASS",
  scope: "真实模拟存档的跨职业隔离验证，尚未接入正式EVerify",
  readyForFormalIntegration: false,
  actualRecords: 7,
  cases: {
    positive: {
      berserker: berserkerHigh.everify.status,
      knight: knightHigh.everify.status,
      priest: priestHigh.everify.status,
      ranger: rangerHigh.everify.status,
      bardMechanism: bardMechanism.everify.status,
    },
    negative: {
      knightObservedShieldButLost: knightFailure.everify.status,
      mageObservedBurnButLost: mageFailure.everify.status,
      wrongKnightSkillCannotImpersonateBannerWall: wrongSkill.everify.status,
      reversedPriestOrder: reversedPriest.everify.status,
      rawActionIdentity: rawActionRejected.status,
    },
  },
  coverageGaps: {
    archivedBerserkerLowHealthAntecedentAvailable: archivedBerserkerHasHealthStateEvidence,
    reason: "这份2026-07-18旧存档早于血量跨档事件；当前运行时由独立血量专项测试验证。",
  },
  perceptionResults,
  receivedEvidenceCounts: Object.fromEntries(
    Object.entries(parsedCases).map(([caseId, parsed]) => [
      caseId,
      Object.fromEntries(["low", "ordinary", "high"].map((level) => [
        level,
        parsed[level].causalEvidence.length,
      ])),
    ]),
  ),
}, null, 2));

function parseRecord(record, seed) {
  const rawEvents = record.rawEventLog || [];
  const environment = rawEvents.find((row) => row.environment?.node)?.environment || {};
  const teamMembers = [];
  for (const event of rawEvents) {
    for (const ref of [event.subject, event.result?.target]) {
      if (ref?.side !== "left" || !ref.id || !ref.name) continue;
      if (!teamMembers.some((row) => row.id === ref.id)) {
        teamMembers.push({ id: ref.id, name: ref.name });
      }
    }
  }
  return parseAllPerceptionLevels(rawEvents, {
    seed,
    causalContext: {
      node: environment.node,
      region: environment.region,
      teamMembers,
    },
  });
}

function assertNestedPerception(parsed, caseId) {
  const low = new Set(parsed.low.causalEvidence.map((row) => row.id));
  const ordinary = new Set(parsed.ordinary.causalEvidence.map((row) => row.id));
  const high = new Set(parsed.high.causalEvidence.map((row) => row.id));
  assert([...low].every((id) => ordinary.has(id)), `${caseId}: low不应超出ordinary`);
  assert([...ordinary].every((id) => high.has(id)), `${caseId}: ordinary不应超出high`);
}

function exact(events, predicate, time, extra = () => true) {
  const rows = events.filter((row) => (
    row.predicate === predicate
    && row.time === time
    && extra(row)
  ));
  assert.equal(rows.length, 1, `${predicate}@${time} 应精确命中一条，实际${rows.length}条`);
  return rows[0];
}

function one(events, predicate) {
  const rows = events.filter((row) => row.predicate === predicate);
  assert.equal(rows.length, 1, `${predicate} 应精确命中一条，实际${rows.length}条`);
  return rows[0];
}

function makeHypothesis(id, steps) {
  return {
    id,
    claim: id,
    claimMode: "contributing_path",
    chosenBehavior: id,
    causalChain: steps,
  };
}

function matchStep(id, evidence, qualifiersAll = [], exclusiveSubject = false) {
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
      ...(exclusiveSubject ? { exclusiveSubject: true } : {}),
    },
  };
}

function outcomeStep(id, predicate, subject) {
  return {
    id,
    statement: id,
    matcher: {
      predicate,
      subject: structuredClone(subject),
    },
  };
}

function run(hypothesis, events) {
  return matchCausalChain({
    hypothesis,
    receivedSemanticEvents: events,
  });
}

function sameRef(left, right) {
  return JSON.stringify(left || {}) === JSON.stringify(right || {});
}
