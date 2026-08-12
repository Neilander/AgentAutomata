"use strict";

const assert = require("assert");
const READER = require("./rule-knowledge-reader");

const first = READER.buildRuleCognition({ scope: "first_game" });
assert.deepStrictEqual(first.sourcePages, [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.strictEqual(first.readingStages.length, 5);
assert.strictEqual(first.concepts.length, 33);
assert.strictEqual(first.environmentFacts.length, 14);
assert.strictEqual(first.knowledge.length, 21);
assert.strictEqual(first.behaviors.length, 11);
assert.strictEqual(first.audit.status, "PASS");
assert(first.knowledge.some((row) => row.id === "final_research_requires_lower_multi_room"));
assert(!first.concepts.some((row) => row.id === "robot_die"));
assert(!first.concepts.some((row) => row.id === "campaign_chapter"));

const complete = READER.buildRuleCognition({ scope: "complete_rulebook" });
assert.strictEqual(complete.readingStages.length, 8);
assert.strictEqual(complete.concepts.length, 48);
assert.strictEqual(complete.environmentFacts.length, 23);
assert.strictEqual(complete.knowledge.length, 27);
assert.strictEqual(complete.behaviors.length, 19);
assert.strictEqual(complete.audit.status, "PASS");
assert(complete.concepts.some((row) => row.id === "robot_die"));
assert(complete.concepts.some((row) => row.id === "campaign_chapter"));

console.log(JSON.stringify({
  status: "PASS",
  firstGame: counts(first),
  completeRulebook: counts(complete),
  firstGameLeakAudit: first.audit,
}, null, 2));

function counts(snapshot) {
  return {
    stages: snapshot.readingStages.length,
    pages: snapshot.sourcePages.length,
    concepts: snapshot.concepts.length,
    environmentFacts: snapshot.environmentFacts.length,
    knowledge: snapshot.knowledge.length,
    behaviors: snapshot.behaviors.length,
  };
}
