"use strict";

const path = require("node:path");
const { CognitiveProgramLibrary } = require("./cognitive-program-library");
const { SOURCE_RULES } = require("./source-catalog");

const BATCHES = Object.freeze([
  {
    name: "sky", author: "isolated_agent_sky",
    submission: require("./submissions/agent_sky_programs.json"),
    file: "submissions/agent_sky_programs.json",
    expectedIds: ["white-die-reroll", "arrow-final-landing", "mothership-down-space", "city-contact"],
  },
  {
    name: "room", author: "isolated_agent_room",
    submission: require("./submissions/agent_room_programs.json"),
    file: "submissions/agent_room_programs.json",
    expectedIds: ["room-energy-payment", "energy-room-resolution", "fighter-room-resolution", "research-room-choice", "unexcavated-placement-legality", "excavation-resolution", "research-room-order-choice", "final-research-room-restriction"],
  },
  {
    name: "phase", author: "isolated_agent_phase",
    submission: require("./submissions/agent_phase_programs.json"),
    file: "submissions/agent_phase_programs.json",
    expectedIds: ["research-completion-before-destruction", "damage-track-loss", "mothership-skull-loss", "mothership-phase-descent", "mothership-row-action", "research-top-win", "spawn-empty-columns", "spawn-farthest-drop-point"],
  },
]);

function expectedInputs(batchName) {
  const root = "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0";
  return [
    `${root}/public_bundle_round2/DSL_V2.md`, `${root}/public_bundle_round2/submission-template.json`,
    `${root}/public_bundle_round2/${batchName}/rules.json`, `${root}/public_bundle_round2/${batchName}/TASK.md`,
  ];
}

function auditBatch(batch) {
  const { submission } = batch;
  if (submission.schema !== "ufs_cognitive_json_program_submission_v0") throw new Error(`${batch.name}: unsupported submission schema`);
  if (submission.authoringAudit.otherRepositoryFilesRead !== false) throw new Error(`${batch.name}: author declared extra repository access`);
  if (JSON.stringify(submission.authoringAudit.allowedInputsUsed) !== JSON.stringify(expectedInputs(batch.name))) {
    throw new Error(`${batch.name}: allowed input audit mismatch`);
  }
  const actual = submission.programs.map((row) => row.programId).sort();
  const expected = [...batch.expectedIds].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${batch.name}: program ID set mismatch`);
}

function install() {
  const libraryPath = path.resolve(__dirname, "library/program-library.json");
  const library = new CognitiveProgramLibrary({ filePath: libraryPath, sourceRules: SOURCE_RULES });
  let installed = 0;
  let alreadyPresent = 0;
  for (const batch of BATCHES) {
    auditBatch(batch);
    for (const program of batch.submission.programs) {
      const existing = library.get(program.programId, { revision: 1 });
      if (existing) {
        if (JSON.stringify(existing.program) !== JSON.stringify(program)) {
          throw new Error(`installed revision differs from blind submission: ${program.programId}`);
        }
        alreadyPresent += 1;
        continue;
      }
      library.store(program, {
        author: batch.author,
        authoringMode: "rules_and_public_contract_only",
        allowedInputs: expectedInputs(batch.name),
        installedAfterAllBlindSubmissions: true,
        submission: batch.file,
      });
      installed += 1;
    }
  }
  library.save(libraryPath);
  return {
    libraryPath, totalPrograms: library.list().length,
    round2Programs: BATCHES.reduce((sum, row) => sum + row.expectedIds.length, 0),
    installed, alreadyPresent,
  };
}

if (require.main === module) console.log(JSON.stringify(install(), null, 2));

module.exports = { BATCHES, auditBatch, expectedInputs, install };
