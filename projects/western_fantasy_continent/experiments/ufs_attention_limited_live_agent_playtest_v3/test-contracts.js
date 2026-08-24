const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = __dirname;
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const readJsonl = (relative) => fs.readFileSync(path.join(root, relative), 'utf8').trim().split(/\r?\n/).map(JSON.parse);

test('transcript is chronological and contains exactly one choice per nonterminal step', () => {
  const transcript = readJsonl('transcript.jsonl');
  assert.deepEqual(transcript.map((row) => row.step), [0, 1, 2, 3]);
  assert.deepEqual(transcript.slice(0, 3).map((row) => row.choice), [
    'choices/step-000.json', 'choices/step-001.json', 'choices/step-002.json'
  ]);
  assert.equal(transcript[3].choice, null);
  assert.equal(transcript[3].terminal, true);
});

test('choices only use a die and cell visible in the immediately preceding sanitized view', () => {
  for (let step = 0; step < 3; step += 1) {
    const n = String(step).padStart(3, '0');
    const view = readJson(`views/view-${n}.json`);
    const choice = readJson(`choices/step-${n}.json`);
    assert.ok(view.noticedObjectIds.includes(choice.dieId));
    assert.ok(view.noticedObjectIds.includes(choice.cellId));
    assert.ok(view.availableOperations.includes(choice.type));
  }
});

test('sanitized views contain no host checkpoint, public map, trace delta, or future script', () => {
  const forbidden = new Set(['checkpoint', 'hostCheckpoint', 'host-checkpoint', 'publicMap', 'traceDelta', 'futureActions', 'plannedActions', 'decisionScript', 'operationScript']);
  const walk = (value) => {
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      assert.equal(forbidden.has(key), false, `forbidden key ${key}`);
      walk(child);
    }
  };
  for (let step = 0; step <= 3; step += 1) walk(readJson(`views/view-${String(step).padStart(3, '0')}.json`));
});

test('every visible die and ship object is supported by noticed object ids', () => {
  for (let step = 0; step <= 3; step += 1) {
    const view = readJson(`views/view-${String(step).padStart(3, '0')}.json`);
    for (const object of [...(view.observation.dice || []), ...(view.observation.ships || [])]) {
      assert.ok(view.noticedObjectIds.includes(object.id), `${object.id} unsupported at step ${step}`);
    }
  }
});

test('playtest source imports no old answer, fixture, oracle, or engine module', () => {
  const sources = fs.readdirSync(root).filter((name) => name.endsWith('.js'));
  for (const name of sources) {
    const lines = fs.readFileSync(path.join(root, name), 'utf8').split(/\r?\n/)
      .filter((line) => /require\(|from\s+['"]|import\s+/.test(line));
    const imports = lines.join('\n');
    assert.doesNotMatch(imports, /autonomous|candidate_exam|live_agent_playtest_v[12]|fixture|oracle|standard-engine|formal/i);
  }
});
