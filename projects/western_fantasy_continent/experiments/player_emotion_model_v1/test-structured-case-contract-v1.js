const assert = require("node:assert/strict");
const {
  freezeStructuredInput,
  validateStructuredCaseBundle,
} = require("./structured-case-contract-v1");

function makeBundle(split = "sealed_test") {
  const source = {
    schema: "structured_emotion_source_v1",
    caseId: "case-001",
    kind: "interview",
    title: "Source title",
    sourceGroup: "person-001",
    locator: "https://example.invalid/source",
    preEmotionFacts: [
      {
        id: "fact-1",
        statement: "A valued mission encountered an unexpected failure.",
        locator: "paragraph 2",
      },
    ],
  };
  const input = freezeStructuredInput({
    schema: "structured_emotion_input_v1",
    caseId: "case-001",
    split,
    sourceFactIds: ["fact-1"],
    annotation: {
      inputAnnotator: "encoder-a",
      frozenAt: "2026-07-21T01:00:00.000Z",
      goldVisibleDuringEncoding: split === "sealed_test" ? false : true,
    },
    profile: {
      goalValues: { mission: 0.9 },
    },
    history: {},
    events: [{
      id: "mission-failure",
      time: 0,
      outcome: {
        actualUtility: -0.8,
        expectedUtility: 0.6,
        expectationConfidence: 0.8,
        goalProgress: -0.9,
        confidence: 0.9,
      },
      targets: { expectedOutcome: "mission success" },
    }],
  });
  const gold = {
    schema: "structured_emotion_gold_v1",
    caseId: "case-001",
    emotions: [{ family: "disappointment", intensity: 0.8 }],
    evidenceType: "first_person_self_report",
    goldLocator: "paragraph 3",
    annotation: {
      goldAnnotator: "annotator-b",
      revealedAt: "2026-07-21T02:00:00.000Z",
    },
  };
  return { source, input, gold };
}

const valid = makeBundle();
assert.deepEqual(validateStructuredCaseBundle(valid), []);

const circular = makeBundle();
circular.input = freezeStructuredInput({
  ...circular.input,
  actualEmotion: "sadness",
});
assert(
  validateStructuredCaseBundle(circular)
    .some((error) => error.includes("actualEmotion")),
);

const tampered = makeBundle();
tampered.input.events[0].outcome.actualUtility = 0.9;
assert(
  validateStructuredCaseBundle(tampered)
    .some((error) => error.includes("contentHash")),
);

const sameAnnotator = makeBundle();
sameAnnotator.gold.annotation.goldAnnotator = "encoder-a";
assert(
  validateStructuredCaseBundle(sameAnnotator)
    .some((error) => error.includes("annotators must be different")),
);

const earlyReveal = makeBundle();
earlyReveal.gold.annotation.revealedAt = "2026-07-20T23:00:00.000Z";
assert(
  validateStructuredCaseBundle(earlyReveal)
    .some((error) => error.includes("revealed after")),
);

const unknownFact = makeBundle();
unknownFact.input = freezeStructuredInput({
  ...unknownFact.input,
  sourceFactIds: ["fact-not-in-source"],
});
assert(
  validateStructuredCaseBundle(unknownFact)
    .some((error) => error.includes("unknown fact")),
);

console.log(JSON.stringify({
  status: "PASS",
  cases: 6,
  guarantees: [
    "source facts are traceable",
    "emotion answers are forbidden in structured input",
    "frozen input tampering is detected",
    "sealed input and gold use different annotators",
    "gold reveal occurs after input freeze",
    "structured events pass the event-impact boundary",
  ],
}, null, 2));
