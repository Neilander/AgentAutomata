"use strict";

const path = require("node:path");
const submission = require("./submissions/agent_01_programs.json");
const sourceBundle = require("./public_bundle/frozen_rules.json");
const { CognitiveProgramLibrary } = require("./cognitive-program-library");

const EXPECTED_IDS = Object.freeze([
  "ordinary-descent-v1",
  "aa-descent-v1",
  "aa-room-no-output-v1",
  "multi-room-completeness-v1",
  "single-room-value-v1",
]);
const EXPECTED_INPUTS = Object.freeze([
  "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/AUTHORING_CONTRACT.md",
  "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/frozen_rules.json",
  "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/submission-template.json",
]);

function install() {
  if (submission.schema !== "ufs_cognitive_json_program_submission_v0") {
    throw new Error(`unsupported submission schema: ${submission.schema}`);
  }
  if (submission.authoringAudit.otherRepositoryFilesRead !== false) {
    throw new Error("blind author declared access to non-allowed repository files");
  }
  if (JSON.stringify(submission.authoringAudit.allowedInputsUsed) !== JSON.stringify(EXPECTED_INPUTS)) {
    throw new Error("blind author input audit differs from frozen allowed inputs");
  }
  const ids = submission.programs.map((program) => program.programId).sort();
  if (JSON.stringify(ids) !== JSON.stringify([...EXPECTED_IDS].sort())) {
    throw new Error(`blind submission program IDs mismatch: ${ids.join(",")}`);
  }
  const libraryPath = path.resolve(__dirname, "library/program-library.json");
  const library = new CognitiveProgramLibrary({ sourceRules: sourceBundle.rules });
  for (const program of submission.programs) {
    library.store(program, {
      author: "isolated_agent_01",
      authoringMode: "rules_and_public_contract_only",
      allowedInputs: [...EXPECTED_INPUTS],
      installedAfterBlindSubmission: true,
      submission: "submissions/agent_01_programs.json",
    });
  }
  library.save(libraryPath);
  return {
    libraryPath,
    programsInstalled: library.list().map((row) => row.programId),
  };
}

if (require.main === module) {
  console.log(JSON.stringify(install(), null, 2));
}

module.exports = { install };
