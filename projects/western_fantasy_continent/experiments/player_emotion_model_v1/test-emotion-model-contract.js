const assert = require("node:assert/strict");
const {
  CHEMICAL_AXES,
  validateCaseRecord,
  validateCorpus,
} = require("./emotion-model-contract");

const baseCase = {
  schema: "player_emotion_case_v1",
  id: "contract-valid-1",
  split: "train",
  source: {
    kind: "experiment",
    title: "Synthetic contract fixture",
    sourceGroup: "synthetic-contract-fixtures-a",
    locator: "local:test",
  },
  annotationProtocol: {
    inputFrozenBeforeGoldReview: true,
    usedGoldEmotionToInferInputs: false,
    inputAnnotator: "fixture-input",
    goldAnnotator: "fixture-gold",
  },
  modelInput: {
    initialPhysiology: {
      chemistry: {
        serotonin: {
          level: 0.5,
          baseline: 0.5,
          confidence: 0.8,
          provenance: "profile_baseline",
          derivedFromGoldEmotion: false,
        },
      },
    },
    appraisals: {
      threatMagnitude: {
        value: 0.8,
        confidence: 0.9,
        basisEventIds: ["event-1"],
        derivedFromGoldEmotion: false,
      },
    },
    eventSequence: [
      {
        id: "event-1",
        time: 0,
        description: "A nearby threat enters the room before the emotion is reported.",
        derivedFromGoldEmotion: false,
      },
    ],
    longTermContext: {
      memories: [],
      relationships: [],
      crossGamePriors: [],
    },
  },
  gold: {
    emotions: [
      {
        family: "fear",
        target: "nearby threat",
        intensityRange: [0.6, 0.9],
        evidenceLevel: "A",
        evidenceRefs: ["self-report-1"],
      },
      {
        family: "anger",
        target: "blocked exit",
        intensityRange: [0.1, 0.4],
        evidenceLevel: "B",
        evidenceRefs: ["behavior-1"],
      },
    ],
  },
};

assert(CHEMICAL_AXES.includes("serotonin"), "serotonin must be an explicit chemical axis");
assert.deepEqual(validateCaseRecord(baseCase), []);

const oldHiddenSerotonin = structuredClone(baseCase);
oldHiddenSerotonin.id = "contract-hidden-serotonin";
oldHiddenSerotonin.modelInput.initialPhysiology.chemistry.punishmentInhibition =
  oldHiddenSerotonin.modelInput.initialPhysiology.chemistry.serotonin;
delete oldHiddenSerotonin.modelInput.initialPhysiology.chemistry.serotonin;
assert(validateCaseRecord(oldHiddenSerotonin).some((error) => error.includes("unknown chemistry axis")));

const circularChemistry = structuredClone(baseCase);
circularChemistry.id = "contract-circular-chemistry";
circularChemistry.modelInput.initialPhysiology.chemistry.serotonin.derivedFromGoldEmotion = true;
assert(validateCaseRecord(circularChemistry).some((error) => error.includes("cannot be derived")));

const circularProtocol = structuredClone(baseCase);
circularProtocol.id = "contract-circular-protocol";
circularProtocol.annotationProtocol.usedGoldEmotionToInferInputs = true;
assert(validateCaseRecord(circularProtocol).some((error) => error.includes("must be false")));

const weakButValidGold = structuredClone(baseCase);
weakButValidGold.id = "contract-soft-gold";
weakButValidGold.gold.emotions = [{
  family: "confusion",
  target: "unexplained event",
  evidenceLevel: "C",
  evidenceRefs: ["observer-inference-1"],
}];
assert.deepEqual(validateCaseRecord(weakButValidGold), []);

const leakedTestCase = structuredClone(baseCase);
leakedTestCase.id = "contract-leaked-test";
leakedTestCase.split = "sealed_test";
assert(validateCorpus([baseCase, leakedTestCase]).some((error) => error.includes("leaks across")));

const independentTestCase = structuredClone(leakedTestCase);
independentTestCase.id = "contract-independent-test";
independentTestCase.source.sourceGroup = "synthetic-contract-fixtures-b";
assert.deepEqual(validateCorpus([baseCase, independentTestCase]), []);

console.log(JSON.stringify({
  status: "PASS",
  explicitChemicalAxes: CHEMICAL_AXES.length,
  serotoninExplicit: true,
  multiEmotionGoldSupported: true,
  circularInputRejected: true,
  sourceGroupLeakageRejected: true,
}, null, 2));
