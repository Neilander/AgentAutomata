const assert = require("node:assert/strict");
const CONTROLLED = require("./controlled-two-chapter-run");

let run = CONTROLLED.createRun({ seed: "controlled-two-chapter-smoke", profileId: "open_novice" });

run = completeOneCycle(run, {
  exactAction: "challenge:r1_main_1",
  intent: "Challenge the first main encounter exactly as instructed.",
});

const chapter1Snapshot = {
  emotion: run.chapter1.cognitionState.emotion.value,
  knowledgeCount: run.chapter1.knowledgeBase.length,
  conceptCount: run.chapter1.conceptState.concepts.length,
  agentSessionId: run.chapter1.agentContext.id,
};

run = CONTROLLED.advanceToChapter2(run, { maxCycles: 4 });
assert.equal(run.chapter2.cognitionState.emotion.value, chapter1Snapshot.emotion);
assert.equal(run.chapter2.knowledgeBase.length, chapter1Snapshot.knowledgeCount);
assert.equal(run.chapter2.conceptState.concepts.length, chapter1Snapshot.conceptCount);
assert.equal(run.chapter2.agentContext.id, chapter1Snapshot.agentSessionId);

run = completeOneCycle(run, {
  exactAction: "challenge:r2_entry",
  intent: "Enter Chapter 2 without allowing the Agent to choose a different route.",
});

const summary = CONTROLLED.summarizeEmotion(run);
assert.equal(summary.chapters.length, 2);
assert.equal(summary.chapters[0].cycles.length, 1);
assert.equal(summary.chapters[1].cycles.length, 1);
assert.ok(summary.chapters.every((chapter) => chapter.cycles[0].eventEmotion.length > 0));

assert.throws(() => CONTROLLED.getPendingRequest(run, {
  exactAction: "challenge:not_a_real_node",
}), /no legal action/);

console.log(JSON.stringify({
  result: "PASS",
  inherited: chapter1Snapshot,
  transition: run.chapter2.chapterTransition,
  emotion: summary.overall,
  actions: summary.chapters.flatMap((chapter) => chapter.cycles.map((cycle) => cycle.action)),
}, null, 2));

function completeOneCycle(runInput, directive) {
  let value = runInput;
  const decision = CONTROLLED.getPendingRequest(value, directive);
  assert.deepEqual(decision.controller.eligibleActions, [directive.exactAction]);
  value = CONTROLLED.applyDecisionResponse(value, directive, {
    action: directive.exactAction,
    goalId: decision.playerState.activeGoalId,
    reasoningChain: [{ kind: "affordance", evidence: `The controller requires ${directive.exactAction}.` }],
    alternatives: [],
    hypothesis: null,
  });
  const attribution = CONTROLLED.getPendingRequest(value);
  const visibleIds = new Set(attribution.visibleEvents.map((event) => event.id));
  const knowledge = attribution.existingKnowledge.find((row) =>
    row.evidenceEventIds.some((eventId) => visibleIds.has(eventId))
  );
  assert.ok(knowledge);
  const evidenceEventId = knowledge.evidenceEventIds.find((eventId) => visibleIds.has(eventId));
  value = CONTROLLED.applyAttributionResponse(value, {
    knowledgeId: knowledge.id,
    primaryCause: "The cited encounter result supports this causal record.",
    confidence: 0.7,
    evidenceEventIds: [evidenceEventId],
    alternativeCauses: [],
    nextTest: "",
  });
  return value;
}
