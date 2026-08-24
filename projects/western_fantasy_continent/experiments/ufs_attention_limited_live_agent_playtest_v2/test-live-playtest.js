"use strict";

const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const ROOT = __dirname;
const transcript = JSON.parse(fs.readFileSync(path.join(ROOT, "machine-transcript.json"), "utf8"));

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, name), "utf8"));
}

test("machine transcript preserves strict increasing action order", () => {
  assert.equal(transcript.attempt, 1);
  assert.deepEqual(transcript.events.map((event) => event.actionCount), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  assert.equal(transcript.events.filter((event) => event.kind === "external_random").length, 1);
  assert.equal(transcript.events.at(-1).terminal, "no_available_operation");
});

test("every choice file contains exactly one operation object", () => {
  const choices = transcript.events.filter((event) => event.choice);
  assert.equal(choices.length, 7);
  for (const event of choices) {
    const choice = readJson(event.choice);
    assert.equal(typeof choice, "object");
    assert.equal(Array.isArray(choice), false);
    assert.equal(typeof choice.type, "string");
    assert.equal(Object.hasOwn(choice, "operations"), false);
    assert.equal(JSON.stringify(choice).includes("future"), false);
  }
});

test("sanitized player views expose no checkpoint, public map, or host trace delta", () => {
  for (const event of transcript.events) {
    const view = readJson(event.view);
    const serialized = JSON.stringify(view);
    assert.equal(Object.hasOwn(view, "checkpoint"), false, event.view);
    assert.equal(Object.hasOwn(view, "publicMap"), false, event.view);
    assert.equal(Object.hasOwn(view, "traceDelta"), false, event.view);
    assert.equal(serialized.includes("host-checkpoint"), false, event.view);
  }
});

test("all visible game objects are backed by noticedItems", () => {
  for (const event of transcript.events) {
    const view = readJson(event.view);
    const ids = new Set(view.noticedItems.map((item) => item.itemId));
    for (const die of view.observation.dice || []) assert(ids.has(`die:${die.id}`), `${event.view} die ${die.id}`);
    for (const ship of view.observation.ships || []) assert(ids.has(`ship:${ship.id}`), `${event.view} ship ${ship.id}`);
    for (const placement of view.observation.placements || []) assert(ids.has(`placement:${placement.id}`), `${event.view} placement ${placement.id}`);
    for (const room of view.mapView.rooms || []) assert(ids.has(`room:${room.id}`), `${event.view} room ${room.id}`);
    for (const cell of view.mapView.baseCells || []) assert(ids.has(`base_cell:${cell.id}`), `${event.view} base ${cell.id}`);
    for (const cell of view.mapView.skyCells || []) assert(ids.has(`sky_cell:${cell.row}:${cell.column}`), `${event.view} sky ${cell.row}:${cell.column}`);
  }
});

test("experiment source does not import old answers, fixtures, or formal engine", () => {
  const sourceFiles = fs.readdirSync(ROOT).filter((name) => /\.(js|mjs|cjs)$/.test(name));
  const forbidden = [/ufs_autonomous_round_agent_v0/i, /ufs_live_agent_playtest_v1/i, /candidate_exam/i, /formal[-_ ]engine/i, /oracle/i, /fixture/i];
  for (const name of sourceFiles) {
    const source = fs.readFileSync(path.join(ROOT, name), "utf8");
    const imports = source.split(/\r?\n/).filter((line) => /\brequire\s*\(|\bfrom\s+["']|\bimport\s*\(/.test(line)).join("\n");
    for (const pattern of forbidden) assert.equal(pattern.test(imports), false, `${name}: ${pattern}`);
  }
});
