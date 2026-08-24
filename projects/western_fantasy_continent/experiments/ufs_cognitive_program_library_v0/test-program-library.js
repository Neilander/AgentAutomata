"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const submission = require("./submissions/agent_01_programs.json");
const sourceBundle = require("./public_bundle/frozen_rules.json");
const { CognitiveProgramLibrary } = require("./cognitive-program-library");
const { loadDefaultLibrary } = require("./default-library");
const { JsonCognitiveProgramInterpreter } = require("./json-program-interpreter");

function attention(values) {
  return {
    read(readPath) {
      if (!Object.prototype.hasOwnProperty.call(values, readPath)) {
        throw new Error(`hidden test did not expose attention path: ${readPath}`);
      }
      return structuredClone(values[readPath]);
    },
  };
}

function execute(programId, values) {
  const row = loadDefaultLibrary().get(programId);
  assert.ok(row, `installed program missing: ${programId}`);
  return new JsonCognitiveProgramInterpreter().execute(row.program, {
    attention: attention(values),
  });
}

test("blind submission declares only the three frozen public inputs", () => {
  assert.equal(submission.authoringAudit.otherRepositoryFilesRead, false);
  assert.deepEqual(submission.authoringAudit.allowedInputsUsed, [
    "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/AUTHORING_CONTRACT.md",
    "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/frozen_rules.json",
    "projects/western_fantasy_continent/experiments/ufs_cognitive_program_library_v0/public_bundle/submission-template.json",
  ]);
  assert.equal(submission.programs.length, 5);
});

test("library stores, gets, revises, persists, and preserves the old revision", () => {
  const library = new CognitiveProgramLibrary({ sourceRules: sourceBundle.rules });
  const original = submission.programs.find((row) => row.programId === "ordinary-descent-v1");
  library.store(original, { author: "blind-agent" });
  assert.equal(library.get(original.programId).program.revision, 1);

  const revision2 = structuredClone(original);
  revision2.revision = 2;
  revision2.bindings.nonNegativeAmount = {
    op: "max",
    values: [0, { op: "var", name: "dieValue" }],
  };
  revision2.output.fields.amount = { op: "var", name: "nonNegativeAmount" };
  library.revise(original.programId, revision2, { reason: "confirmed-equivalent-revision" });
  assert.equal(library.get(original.programId).program.revision, 2);
  assert.equal(library.get(original.programId, { revision: 1 }).program.revision, 1);
  assert.notDeepEqual(
    library.get(original.programId).program,
    library.get(original.programId, { revision: 1 }).program,
  );
  assert.equal(library.list({ latestOnly: false }).length, 2);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ufs-program-library-"));
  const tempFile = path.join(tempDir, "library.json");
  library.save(tempFile);
  const restored = new CognitiveProgramLibrary({
    filePath: tempFile,
    sourceRules: sourceBundle.rules,
  });
  assert.equal(restored.get(original.programId).program.revision, 2);
  assert.equal(restored.get(original.programId, { revision: 1 }).provenance.author, "blind-agent");
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("blind-authored descent programs compute ordinary and AA movement", () => {
  assert.deepEqual(execute("ordinary-descent-v1", {
    "event.dieValue": 4,
  }).patch, { kind: "set_movement_amount", amount: 4 });
  assert.deepEqual(execute("aa-descent-v1", {
    "event.dieValue": 1,
  }).patch, { kind: "set_movement_amount", amount: 0 });
  assert.deepEqual(execute("aa-descent-v1", {
    "event.dieValue": 6,
  }).patch, { kind: "set_movement_amount", amount: 5 });
});

test("blind-authored multi-room program distinguishes incomplete and complete values", () => {
  const common = {
    "room.id": "hidden-energy",
    "room.type": "energy",
    "room.cellIds": ["X1", "X2"],
    "room.modifier": -1,
    "room.energyCost": 0,
  };
  const incomplete = execute("multi-room-completeness-v1", {
    ...common,
    "room.cell:X1.occupied": false,
    "room.cell:X1.dieValue": null,
    "room.cell:X2.occupied": true,
    "room.cell:X2.dieValue": 4,
  }).patch;
  assert.equal(incomplete.complete, false);
  assert.deepEqual(incomplete.missingCells, ["X1"]);
  assert.equal(incomplete.roomValue, null);
  assert.equal(incomplete.roomPhaseStatus, "setup_only_incomplete");

  const complete = execute("multi-room-completeness-v1", {
    ...common,
    "room.cell:X1.occupied": true,
    "room.cell:X1.dieValue": 3,
    "room.cell:X2.occupied": true,
    "room.cell:X2.dieValue": 4,
  }).patch;
  assert.equal(complete.complete, true);
  assert.deepEqual(complete.missingCells, []);
  assert.equal(complete.roomValue, 6);
  assert.equal(complete.roomPhaseStatus, "ready_but_not_resolved");
});

test("blind-authored single-room and AA-room programs produce bounded pending states", () => {
  const single = execute("single-room-value-v1", {
    "room.id": "hidden-fighter",
    "room.type": "fighter",
    "room.cellIds": ["Y1"],
    "room.modifier": -1,
    "room.energyCost": 1,
    "room.cell:Y1.occupied": true,
    "room.cell:Y1.dieValue": 5,
  }).patch;
  assert.equal(single.roomValue, 4);
  assert.equal(single.roomPhaseStatus, "ready_but_not_resolved");

  const aa = execute("aa-room-no-output-v1", {
    "room.id": "hidden-aa",
    "room.type": "aa",
    "room.cellIds": ["Z1"],
    "room.energyCost": 0,
    "room.cell:Z1.occupied": true,
  }).patch;
  assert.equal(aa.complete, true);
  assert.equal(aa.roomValue, null);
  assert.equal(aa.roomPhaseStatus, "no_room_phase_output");
});

test("interpreter blocks reads that were not declared by the JSON program", () => {
  const program = structuredClone(
    submission.programs.find((row) => row.programId === "ordinary-descent-v1"),
  );
  program.requiredReads = [];
  assert.throws(() => new JsonCognitiveProgramInterpreter().execute(program, {
    attention: attention({ "event.dieValue": 4 }),
  }), /undeclared attention read/);
});
