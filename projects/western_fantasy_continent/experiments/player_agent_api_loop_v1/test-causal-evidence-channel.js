const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseAllPerceptionLevels,
} = require("./battle-information-parser");
const {
  organizeReceivedBattleInformation,
} = require("./received-information-organizer");

const fixture = JSON.parse(fs.readFileSync(
  path.join(__dirname, "fixtures", "battle-information-real-event-log.json"),
  "utf8",
));
const causalContext = {
  node: "r2_flag_trial",
  region: "region_2",
  teamMembers: [
    { id: "hero_warrior", name: "灰鸦战士" },
    { id: "hero_mage", name: "烬火法师" },
    { id: "hero_priest", name: "晨祷牧师" },
    { id: "hero_ranger", name: "林地游侠" },
  ],
};

const parsed = parseAllPerceptionLevels(fixture.rawEventLog, {
  seed: "causal-real:6",
  causalContext,
});
for (const level of ["low", "ordinary"]) {
  const nextLevel = level === "low" ? "ordinary" : "high";
  const nextIds = new Set(parsed[nextLevel].causalEvidence.map((row) => row.id));
  assert(parsed[level].causalEvidence.every((row) => nextIds.has(row.id)));
}

const rangerKillAt116 = (level) => parsed[level].causalEvidence.find((row) => (
  row.predicate === "target_defeated" && row.time === 11.6
));
assert.equal(rangerKillAt116("low"), undefined);
assert(rangerKillAt116("ordinary"));
assert(rangerKillAt116("high"));
assert.deepEqual(rangerKillAt116("ordinary"), rangerKillAt116("high"));

const receivedKill = rangerKillAt116("ordinary");
assert.match(receivedKill.subject.refId, /^visible_character:[0-9a-f]{8}$/);
assert.match(receivedKill.object.conceptId, /^visible_concept:[0-9a-f]{8}$/);
assert.match(receivedKill.object.publicEntityId, /^visible_entity:[0-9a-f]{8}$/);
assert.equal(receivedKill.subject.side, "left");
assert.equal(receivedKill.object.side, "right");
assert.equal(receivedKill.informationTier, "standard_high");

const publicCausalJson = JSON.stringify(parsed);
for (const forbidden of [
  "left-4",
  "right-2",
  "hero_ranger",
  "killerRole",
  "targetRole",
  "sourceName",
  "targetName",
  "diagnosis",
]) {
  assert(!publicCausalJson.includes(forbidden), `因果辅助证据泄漏了 ${forbidden}`);
}

const hiddenKillLog = structuredClone(fixture.rawEventLog);
const hiddenKill = hiddenKillLog.find((row) => row.type === "death" && row.time === 11.6);
hiddenKill.presentation.visible = false;
const hiddenParsed = parseAllPerceptionLevels(hiddenKillLog, {
  seed: "causal-real:6",
  causalContext,
});
for (const level of ["low", "ordinary", "high"]) {
  assert.equal(
    hiddenParsed[level].causalEvidence.some((row) => (
      row.predicate === "target_defeated" && row.time === 11.6
    )),
    false,
  );
}

const routed = organizeReceivedBattleInformation(fixture.rawEventLog, {
  seed: "causal-real:6",
  episodeId: "causal-evidence-test",
  perceptionLevel: "ordinary",
  causalContext,
});
assert(routed.causalEvidence.some((row) => (
  row.predicate === "target_defeated" && row.time === 11.6
)));
assert.equal(routed.audit.causalEvidenceRoutedToKnowledge, false);
assert.equal(
  routed.routes.causalKnowledge.some((route) => (
    route.evidencePublicSignalIds || []
  ).includes(receivedKill.id)),
  false,
);
assert.equal(
  routed.receivedObservations.some((row) => row.sourceSignalId === receivedKill.id),
  false,
);

console.log(JSON.stringify({
  result: "PASS",
  fixture: fixture.schema,
  receivedCausalEvidence: {
    low: parsed.low.causalEvidence.length,
    ordinary: parsed.ordinary.causalEvidence.length,
    high: parsed.high.causalEvidence.length,
  },
  rangerKillAt116: {
    low: false,
    ordinary: true,
    high: true,
  },
  hiddenKillExcludedAtAllLevels: true,
  routedToKnowledge: false,
}, null, 2));
