const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const GOLD = path.join(DATA_DIR, "development.gold.jsonl");
const OUTPUT = path.join(DATA_DIR, "development.questionnaire-cognition-v1.jsonl");

function entry(value, confidence, basis) {
  return { value, confidence, basis };
}

function mapQuestionnaire(record) {
  const q = record.researchOnlyPostEmotionFields;
  const appraisals = {};
  if (q.PLEA === 1) appraisals.outcomeValence = entry(0.9, 0.9, "PLEA:pleasant");
  if (q.PLEA === 2) appraisals.outcomeValence = entry(0.5, 0.9, "PLEA:neutral");
  if (q.PLEA === 3) appraisals.outcomeValence = entry(0.1, 0.9, "PLEA:unpleasant");

  if (q.PLAN === 1) {
    appraisals.goalCongruence = entry(0.9, 0.9, "PLAN:helped");
    appraisals.goalRelevance = entry(0.85, 0.8, "PLAN:helped");
  }
  if (q.PLAN === 2) {
    appraisals.goalCongruence = entry(0.5, 0.9, "PLAN:no_effect");
    appraisals.goalRelevance = entry(0.3, 0.65, "PLAN:no_effect");
  }
  if (q.PLAN === 3) {
    appraisals.goalCongruence = entry(0.1, 0.9, "PLAN:hindered");
    appraisals.goalRelevance = entry(0.85, 0.8, "PLAN:hindered");
    appraisals.obstruction = entry(0.82, 0.72, "PLAN:hindered");
  }

  if (q.EXPC >= 1 && q.EXPC <= 3) {
    appraisals.unexpectedChange = entry(
      ({ 1: 0.9, 2: 0.55, 3: 0.1 })[q.EXPC],
      0.82,
      "EXPC:expectedness",
    );
  }
  if (q.FAIR >= 1 && q.FAIR <= 3) {
    const unfairness = ({ 1: 0.1, 2: 0.5, 3: 0.9 })[q.FAIR];
    appraisals.normViolation = entry(unfairness, 0.68, "FAIR:unfairness_intensity");
  }
  if (q.MORL >= 1 && q.MORL <= 3) {
    const immorality = ({ 1: 0.05, 2: 0.5, 3: 0.9 })[q.MORL];
    const prior = appraisals.normViolation?.value ?? 0;
    appraisals.normViolation = entry(Math.max(prior, immorality), 0.78, "MORL:improper");
  }

  if (q.CAUS >= 1 && q.CAUS <= 4) {
    appraisals.selfAttribution = entry(q.CAUS === 1 ? 0.95 : 0.05, 0.9, "CAUS:agency");
    appraisals.blameCertainty = entry(
      q.CAUS === 2 || q.CAUS === 3 ? 0.85 : q.CAUS === 1 ? 0.65 : 0.15,
      0.75,
      "CAUS:agency",
    );
  }

  if (q.COPING >= 1 && q.COPING <= 5) {
    const control = ({ 1: 0.65, 2: 0.9, 3: 0.62, 4: 0.3, 5: 0.08 })[q.COPING];
    appraisals.controllability = entry(control, 0.86, "COPING");
    if (q.COPING === 3) {
      appraisals.escapeAvailability = entry(0.9, 0.82, "COPING:escape");
      appraisals.threatMagnitude = entry(0.72, 0.55, "COPING:escape");
    }
    if (q.COPING === 5) {
      appraisals.threatMagnitude = entry(0.5, 0.4, "COPING:powerless");
      appraisals.expectedUncertainty = entry(0.68, 0.52, "COPING:powerless");
    }
  }

  if (q.SELF >= 1 && q.SELF <= 3) {
    appraisals.selfEvaluationValence = entry(
      ({ 1: 0.1, 2: 0.5, 3: 0.9 })[q.SELF],
      0.86,
      "SELF:self_esteem_effect",
    );
  }
  if (q.RELA >= 1 && q.RELA <= 3) {
    const relationshipValence = ({ 1: 0.1, 2: 0.5, 3: 0.9 })[q.RELA];
    appraisals.relationshipValence = entry(relationshipValence, 0.84, "RELA:relationship_effect");
    appraisals.socialSafety = entry(relationshipValence, 0.62, "RELA:relationship_effect");
  }
  if (q.CAUS === 1 && q.RELA === 1 && q.MORL >= 2) {
    appraisals.harmToOther = entry(
      q.MORL === 3 ? 0.78 : 0.62,
      0.55,
      "CAUS:self + RELA:negative + MORL:improper",
    );
    appraisals.repairOpportunity = entry(0.55, 0.32, "questionnaire_prior");
  }

  return {
    schema: "isear_questionnaire_cognition_v1",
    caseId: record.caseId,
    split: record.split,
    sourceGroup: record.sourceGroup,
    appraisals,
    protocol: {
      emotionLabelCopied: false,
      intensityCopied: false,
      physiologyCopied: false,
      interpretation: "Diagnostic conditional on respondent-reported cognitive appraisal; not a pre-event text-only score.",
    },
  };
}

function main() {
  const records = fs.readFileSync(GOLD, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => mapQuestionnaire(JSON.parse(line)));

  const serialized = records.map((record) => JSON.stringify(record)).join("\n");
  if (serialized.includes("reportedEmotionFamily")) throw new Error("emotion label leaked into cognition file");
  fs.writeFileSync(OUTPUT, `${serialized}\n`, "utf8");
  console.log(JSON.stringify({
    status: "PASS",
    records: records.length,
    emotionLabelCopied: false,
    output: OUTPUT,
  }, null, 2));
}

if (require.main === module) main();

module.exports = {
  mapQuestionnaire,
};
