"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const RULE_IDS = [
  "RULE-BASE-COLUMN-MOVE",
  "RULE-FROZEN-STAYS",
  "RULE-NEAREST-CITY-TIES",
];

function staticSecurity(source) {
  const patterns = [
    [/\brequire\s*\(/, "require is forbidden"],
    [/\bimport\s*(?:\(|[\s{*])/, "import is forbidden"],
    [/\bprocess\b/, "process access is forbidden"],
    [/\b(?:eval|Function)\s*\(/, "dynamic code is forbidden"],
    [/\b(?:fetch|XMLHttpRequest|WebSocket)\b/, "network access is forbidden"],
    [/\b(?:globalThis|global)\b/, "global reflection is forbidden"],
    [/\.(?:keys|values|entries)\s*\(/, "unknown-key enumeration is forbidden"],
    [/\bReflect\b|\bProxy\b/, "reflection is forbidden"],
    [/__proto__|constructor\s*\[/, "prototype escape is forbidden"],
  ];
  return patterns.filter(([pattern]) => pattern.test(source)).map(([, message]) => message);
}

function loadSubmission(source) {
  const context = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(source, context, {
    filename: "submission.js",
    timeout: 1000,
    contextCodeGeneration: { strings: false, wasm: false },
  });
  return context.module.exports;
}

function makeAudited(value, audit, pathName = "state") {
  if (value === null || typeof value !== "object") return value;
  const target = Array.isArray(value) ? value : { ...value };
  return new Proxy(target, {
    get(targetObject, property, receiver) {
      if (typeof property === "string") {
        const childPath = Array.isArray(targetObject)
          ? `${pathName}[${property}]`
          : `${pathName}.${property}`;
        if (!Array.isArray(targetObject) || !["length"].includes(property)) {
          audit.push(childPath);
        }
        if (property.startsWith("_hidden")) {
          throw new Error(`forbidden hidden-field read: ${childPath}`);
        }
        const child = Reflect.get(targetObject, property, receiver);
        return makeAudited(child, audit, childPath);
      }
      return Reflect.get(targetObject, property, receiver);
    },
    set(_targetObject, property) {
      throw new Error(`input mutation forbidden at ${pathName}.${String(property)}`);
    },
    deleteProperty(_targetObject, property) {
      throw new Error(`input deletion forbidden at ${pathName}.${String(property)}`);
    },
    ownKeys() {
      throw new Error(`unknown-key enumeration forbidden at ${pathName}`);
    },
  });
}

function normalized(value) {
  return JSON.parse(JSON.stringify(value));
}

function isAllowedRead(pathName) {
  return /^(?:state\.(?:event|objects)|state\.event\.(?:type|column|amount|selection)|state\.objects\[\d+\]|state\.objects\[\d+\]\.(?:id|column|row|frozen|city_distance))$/.test(pathName);
}

function main() {
  const args = process.argv.slice(2);
  const roundIndex = Number(args[args.indexOf("--round") + 1]);
  const outputPath = args[args.indexOf("--output") + 1];
  const submissionArg = args.includes("--submission")
    ? args[args.indexOf("--submission") + 1]
    : path.join("submission", "submission.js");
  const submissionPath = path.resolve(ROOT, submissionArg);
  if (![0, 1, 2].includes(roundIndex) || !outputPath) {
    throw new Error("usage: node run_validation.js --round 0|1|2 --output FILE [--submission FILE]");
  }

  const source = fs.readFileSync(submissionPath, "utf8");
  const staticErrors = staticSecurity(source);
  let submission = null;
  let loadError = null;
  if (staticErrors.length === 0) {
    try {
      submission = loadSubmission(source);
    } catch (error) {
      loadError = `${error.name}: ${error.message}`;
    }
  }
  const expectedRuleIds = RULE_IDS.slice(0, roundIndex + 1);
  const metadataOk = Boolean(submission)
    && JSON.stringify(submission.SOURCE_RULE_IDS) === JSON.stringify(expectedRuleIds)
    && typeof submission.REVISION === "string"
    && typeof submission.preview === "function";

  const results = [];
  for (let n = 0; n <= roundIndex; n += 1) {
    const cases = JSON.parse(fs.readFileSync(path.join(ROOT, "hidden_cases", `round_${n}.json`), "utf8"));
    for (const testCase of cases) {
      const workingState = normalized(testCase.state);
      const before = normalized(workingState);
      const audit = [];
      let actual = null;
      let error = loadError;
      if (submission && !loadError) {
        try {
          actual = normalized(submission.preview(makeAudited(workingState, audit)));
        } catch (caught) {
          error = `${caught.name}: ${caught.message}`;
        }
      }
      const inputUnchanged = JSON.stringify(workingState) === JSON.stringify(before);
      const passed = !error
        && JSON.stringify(actual) === JSON.stringify(testCase.expected)
        && inputUnchanged;
      results.push({
        id: testCase.id,
        rule_set: testCase.rule_set,
        passed,
        actual,
        expected: testCase.expected,
        error,
        input_unchanged: inputUnchanged,
        reads: audit,
      });
    }
  }

  const payload = {
    experiment: "blind_rule_program_micro_v0",
    round: roundIndex,
    submission_path: path.relative(ROOT, submissionPath).replaceAll("\\", "/"),
    submission_sha256: crypto.createHash("sha256").update(source).digest("hex"),
    revision: submission?.REVISION ?? null,
    source_rule_ids: submission?.SOURCE_RULE_IDS ?? null,
    expected_rule_ids: expectedRuleIds,
    metadata_ok: metadataOk,
    static_security_errors: staticErrors,
    load_error: loadError,
    case_count: results.length,
    passed_count: results.filter((item) => item.passed).length,
    all_passed: metadataOk && staticErrors.length === 0 && !loadError && results.every((item) => item.passed),
    input_immutability_all: results.every((item) => item.input_unchanged),
    hidden_field_reads: results.flatMap((item) => item.reads).filter((p) => p.split(".").at(-1).startsWith("_hidden")),
    unauthorized_state_reads: results.flatMap((item) => item.reads).filter((p) => !isAllowedRead(p)),
    cases: results,
  };
  payload.all_passed = payload.all_passed
    && payload.hidden_field_reads.length === 0
    && payload.unauthorized_state_reads.length === 0;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    round: payload.round,
    case_count: payload.case_count,
    passed_count: payload.passed_count,
    all_passed: payload.all_passed,
  }));
  process.exitCode = payload.all_passed ? 0 : 1;
}

main();
