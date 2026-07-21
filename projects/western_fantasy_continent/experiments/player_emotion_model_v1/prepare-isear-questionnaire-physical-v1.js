const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const GOLD = path.join(DATA_DIR, "development.gold.jsonl");
const OUTPUT = path.join(DATA_DIR, "development.questionnaire-physical-v1.jsonl");

function observed(value, confidence, basis, provenance) {
  return {
    value,
    confidence,
    provenance,
    basis,
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mapQuestionnairePhysical(record, provenance = "self_reported") {
  const q = record.researchOnlyPostEmotionFields;
  return {
    schema: "isear_questionnaire_physical_v1",
    caseId: record.caseId,
    split: record.split,
    sourceGroup: record.sourceGroup,
    observedPhysical: {
      sympatheticArousal: observed(clamp01(q.ERGO / 4), 0.72, "ERGO", provenance),
      somaticDistress: observed(clamp01(q.TROPHO / 3), 0.68, "TROPHO", provenance),
      approachWithdrawal: observed(Math.min(1, Math.max(-1, q.MOVE)), 0.66, "MOVE", provenance),
      expressiveActivation: observed(clamp01(q.EXPRES / 6), 0.66, "EXPRES", provenance),
      smiling: observed(clamp01(q.EXP1), 0.82, "EXP1", provenance),
      crying: observed(clamp01(q.EXP2), 0.82, "EXP2", provenance),
      aggression: observed(clamp01(q.EXP10), 0.82, "EXP10", provenance),
      vocalActivation: observed(clamp01(Math.max(q.PARAL / 3, q.VERBAL / 3)), 0.62, "PARAL+VERBAL", provenance),
      temperatureActivation: observed(clamp01(Math.abs(q.TEMPER) / 2), 0.58, "TEMPER", provenance),
    },
    protocol: {
      emotionLabelCopied: false,
      chemistryInferred: false,
      interpretation: "Observed/self-reported bodily and action response during the event; not a neurotransmitter measurement.",
    },
  };
}

function main() {
  const records = fs.readFileSync(GOLD, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => mapQuestionnairePhysical(JSON.parse(line)));
  const body = records.map((record) => JSON.stringify(record)).join("\n");
  if (body.includes("reportedEmotionFamily")) throw new Error("emotion label leaked into physical file");
  fs.writeFileSync(OUTPUT, `${body}\n`, "utf8");
  console.log(JSON.stringify({
    status: "PASS",
    records: records.length,
    emotionLabelCopied: false,
    chemistryInferred: false,
    output: OUTPUT,
  }, null, 2));
}

if (require.main === module) main();

module.exports = {
  mapQuestionnairePhysical,
};
