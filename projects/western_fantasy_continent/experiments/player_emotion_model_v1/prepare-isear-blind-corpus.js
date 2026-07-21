const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const INPUT = path.join(__dirname, "data", "raw", "isear", "filtered-api.jsonl");
const OUTPUT_DIR = path.join(__dirname, "data", "prepared", "isear-v1");
const SPLITS = ["train", "development", "sealed_test"];

const EXPLICIT_EMOTION_PATTERNS = [
  /\banger|\bangry|\bannoyed|\brage|\bfurious/i,
  /\bfear|\bafraid|\bscared|\bterror|\bfrighten/i,
  /\bjoy|\bhappy|\bdelight|\belat(?:ed|ion)/i,
  /\bsad|\bsorrow|\bgrief|\bdepress/i,
  /\bdisgust|\brevolt(?:ed|ing)|brepuls/i,
  /\bshame|\bashamed|\bembarrass|\bhumiliat/i,
  /\bguilt|\bguilty|\bremorse/i,
];

function digest(value, length = 20) {
  return crypto.createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function splitForSourceGroup(sourceGroupKey) {
  const bucket = Number.parseInt(digest(`isear-split-v1:${sourceGroupKey}`, 8), 16) % 1000;
  if (bucket < 700) return "train";
  if (bucket < 850) return "development";
  return "sealed_test";
}

function loadRows() {
  return fs.readFileSync(INPUT, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writeJsonl(file, records) {
  const body = records.map((record) => JSON.stringify(record)).join("\n");
  fs.writeFileSync(file, body ? `${body}\n` : "", "utf8");
}

function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function makeRecords(row) {
  const rawGroupKey = `${row.COUN}:${row.CITY}:${row.SUBJ}`;
  const sourceGroup = `isear-person-${digest(rawGroupKey, 16)}`;
  const split = splitForSourceGroup(rawGroupKey);
  const caseId = `isear-${digest(`${row.MYKEY}:${row.__index_level_0__}`, 20)}`;
  const situation = String(row.SIT || "").trim();
  const containsExplicitEmotionLanguage = EXPLICIT_EMOTION_PATTERNS.some((pattern) => pattern.test(situation));

  const blindInput = {
    schema: "emotion_blind_input_v1",
    caseId,
    split,
    sourceGroup,
    source: {
      kind: "experiment",
      dataset: "ISEAR",
      collectionNote: "First-person situation report; emotion answer is kept in a separate gold file.",
    },
    observableBeforeInference: {
      situation,
      demographics: {
        age: row.AGE,
        sexCode: row.SEX,
        countryCode: row.COUN,
      },
    },
    evaluationTracks: {
      naturalNarrative: true,
      strictEmotionInference: !containsExplicitEmotionLanguage,
    },
    leakageAudit: {
      containsExplicitEmotionLanguage,
      goldFieldsPresent: false,
    },
  };

  const gold = {
    schema: "emotion_gold_v1",
    caseId,
    split,
    sourceGroup,
    reportedEmotionFamily: String(row.Field1 || "").toLowerCase(),
    reportedIntensityRaw: row.INTS,
    evidenceLevel: "A",
    evidenceKind: "first_person_self_report",
    collectionCaveat: "The respondent was prompted for an emotion category; use as supervised gold, while tracking demand and wording bias.",
    researchOnlyPostEmotionFields: {
      ERGO: row.ERGO,
      TROPHO: row.TROPHO,
      TEMPER: row.TEMPER,
      EXPRES: row.EXPRES,
      MOVE: row.MOVE,
      EXP1: row.EXP1,
      EXP2: row.EXP2,
      EXP10: row.EXP10,
      PARAL: row.PARAL,
      CON: row.CON,
      EXPC: row.EXPC,
      PLEA: row.PLEA,
      PLAN: row.PLAN,
      FAIR: row.FAIR,
      CAUS: row.CAUS,
      COPING: row.COPING,
      MORL: row.MORL,
      SELF: row.SELF,
      RELA: row.RELA,
      VERBAL: row.VERBAL,
      NEUTRO: row.NEUTRO,
    },
  };
  return { blindInput, gold };
}

function assertPartitionIntegrity(inputsBySplit, goldBySplit) {
  const groupOwner = new Map();
  for (const split of SPLITS) {
    const inputIds = new Set(inputsBySplit[split].map((record) => record.caseId));
    const goldIds = new Set(goldBySplit[split].map((record) => record.caseId));
    if (inputIds.size !== inputsBySplit[split].length) throw new Error(`${split}: duplicate input case id`);
    if (goldIds.size !== goldBySplit[split].length) throw new Error(`${split}: duplicate gold case id`);
    if (inputIds.size !== goldIds.size || [...inputIds].some((id) => !goldIds.has(id))) {
      throw new Error(`${split}: blind and gold case ids differ`);
    }
    for (const record of inputsBySplit[split]) {
      const owner = groupOwner.get(record.sourceGroup);
      if (owner && owner !== split) throw new Error(`${record.sourceGroup} leaks across ${owner} and ${split}`);
      groupOwner.set(record.sourceGroup, split);
      if (JSON.stringify(record).includes("reportedEmotionFamily")) {
        throw new Error(`${record.caseId}: gold label leaked into blind input`);
      }
    }
  }
}

function main() {
  const rows = loadRows();
  const inputsBySplit = Object.fromEntries(SPLITS.map((split) => [split, []]));
  const goldBySplit = Object.fromEntries(SPLITS.map((split) => [split, []]));

  for (const row of rows) {
    const { blindInput, gold } = makeRecords(row);
    inputsBySplit[blindInput.split].push(blindInput);
    goldBySplit[gold.split].push(gold);
  }
  assertPartitionIntegrity(inputsBySplit, goldBySplit);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const files = [];
  const summary = {};
  for (const split of SPLITS) {
    const inputFile = path.join(OUTPUT_DIR, `${split}.inputs.jsonl`);
    const goldFile = path.join(OUTPUT_DIR, `${split}.gold.jsonl`);
    writeJsonl(inputFile, inputsBySplit[split]);
    writeJsonl(goldFile, goldBySplit[split]);
    files.push(inputFile, goldFile);
    summary[split] = {
      cases: inputsBySplit[split].length,
      sourceGroups: new Set(inputsBySplit[split].map((record) => record.sourceGroup)).size,
      strictInferenceCases: inputsBySplit[split].filter(
        (record) => record.evaluationTracks.strictEmotionInference,
      ).length,
    };
  }

  const manifest = {
    schema: "emotion_corpus_manifest_v1",
    createdAt: new Date().toISOString(),
    sourceDataset: "savalera/isear-from-original",
    sourceConfig: "filtered",
    sourceLicense: "Apache-2.0",
    totalCases: rows.length,
    splitPolicy: "Deterministic 70/15/15 hash split by country:city:respondent; all reports from one person stay together.",
    leakagePolicy: "Blind input files contain no reported emotion, intensity, or post-emotion questionnaire fields.",
    strictTrackPolicy: "Strict inference excludes situations containing direct English emotion words; natural-narrative track retains all cases.",
    summary,
    fileHashes: Object.fromEntries(files.map((file) => [path.basename(file), sha256File(file)])),
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}

main();
