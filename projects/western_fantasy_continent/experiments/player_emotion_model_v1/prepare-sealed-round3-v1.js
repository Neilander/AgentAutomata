const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PREVIOUS_DIR = path.join(ROOT, "data", "blind_rounds", "v2");
const OUTPUT_DIR = path.join(ROOT, "data", "blind_rounds", "v3");
const SOURCE_INPUT = path.join(PREVIOUS_DIR, "remaining_final_holdout.inputs.jsonl");
const PREVIOUS_PRE_REGISTRATION = path.join(PREVIOUS_DIR, "round2.pre_registered.json");
const ROUND_INPUT = path.join(OUTPUT_DIR, "round3.inputs.jsonl");
const HOLDOUT_INPUT = path.join(OUTPUT_DIR, "remaining_final_holdout.inputs.jsonl");
const ROUND_MANIFEST = path.join(OUTPUT_DIR, "round3.pre_registered.json");
const SELECTION_SALT = "player-emotion-generative-v1|sealed-round3|2026-07-21";
const SELECTED_GROUP_COUNT = 3;

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readJsonLines(file) {
  return fs.readFileSync(file, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function jsonLines(records) {
  return `${records.map((record) => JSON.stringify(record)).join("\n")}\n`;
}

function main() {
  const sourceText = fs.readFileSync(SOURCE_INPUT);
  const previous = JSON.parse(fs.readFileSync(PREVIOUS_PRE_REGISTRATION, "utf8"));
  if (sha256(sourceText) !== previous.untouchedHoldout.inputSha256) {
    throw new Error("round 2 remaining input changed");
  }
  const inputs = readJsonLines(SOURCE_INPUT);
  const groups = [...new Set(inputs.map((record) => record.sourceGroup))]
    .map((sourceGroup) => ({
      sourceGroup,
      selectionHash: sha256(`${SELECTION_SALT}|${sourceGroup}`),
    }))
    .sort((left, right) => left.selectionHash.localeCompare(right.selectionHash));
  const selectedGroups = groups.slice(0, SELECTED_GROUP_COUNT);
  const selectedSet = new Set(selectedGroups.map((entry) => entry.sourceGroup));
  const round = inputs.filter((record) => selectedSet.has(record.sourceGroup));
  const holdout = inputs.filter((record) => !selectedSet.has(record.sourceGroup));
  const strict = round.filter(
    (record) => record.evaluationTracks?.strictEmotionInference === true,
  );
  const roundText = jsonLines(round);
  const holdoutText = jsonLines(holdout);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(ROUND_INPUT, roundText, "utf8");
  fs.writeFileSync(HOLDOUT_INPUT, holdoutText, "utf8");
  const manifest = {
    schema: "player_emotion_blind_round_pre_registration_v1",
    createdAt: new Date().toISOString(),
    priorRounds: {
      round1AndRound2AnswersAlreadyOpened: true,
      priorSelectedGroupsExcluded: true,
    },
    selection: {
      unit: "sourceGroup",
      method: "ascending sha256 of fixed salt and sourceGroup",
      salt: SELECTION_SALT,
      selectedGroupCount: SELECTED_GROUP_COUNT,
      selectedGroups,
    },
    source: {
      file: path.relative(ROOT, SOURCE_INPUT).replaceAll("\\", "/"),
      verifiedSha256: sha256(sourceText),
      sourceCaseCount: inputs.length,
      sourceGroupCount: groups.length,
    },
    round3: {
      inputFile: path.relative(ROOT, ROUND_INPUT).replaceAll("\\", "/"),
      inputSha256: sha256(roundText),
      caseCount: round.length,
      strictCaseCount: strict.length,
      caseIds: round.map((record) => record.caseId),
    },
    untouchedHoldout: {
      inputFile: path.relative(ROOT, HOLDOUT_INPUT).replaceAll("\\", "/"),
      inputSha256: sha256(holdoutText),
      caseCount: holdout.length,
      sourceGroupCount: groups.length - SELECTED_GROUP_COUNT,
    },
    preRegisteredEvaluation: {
      primaryTrack: "strictEmotionInference=true",
      labelProjection: {
        fear: ["fear", "anxiety"],
        anger: ["anger", "frustration"],
        sadness: ["sadness", "disappointment"],
        disgust: ["disgust"],
        joy: [
          "joy",
          "excitement",
          "satisfaction",
          "relief",
          "hope",
          "pride",
          "attachment",
          "gratitude",
        ],
        shame: ["shame"],
        guilt: ["guilt", "regret"],
      },
      projectionAggregation: "maximum member-family intensity; no summing",
      ranking: "For each projected ISEAR label use max(onset intensity, settled intensity), descending.",
      primaryMetric: "top3 accuracy",
      secondaryMetrics: ["top1 accuracy"],
      noThresholdTuningBeforeReveal: true,
      nonEventReportsRemainInPrimaryDenominator: true,
    },
    state: {
      structuredInputsFrozen: false,
      predictionsFrozen: false,
      answersOpenedForSelectedRound: false,
      remainingHoldoutAnswersOpened: false,
    },
  };
  fs.writeFileSync(ROUND_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    roundCases: round.length,
    strictRoundCases: strict.length,
    selectedGroups: SELECTED_GROUP_COUNT,
    untouchedHoldoutCases: holdout.length,
    roundInputSha256: manifest.round3.inputSha256,
  }, null, 2)}\n`);
}

main();
