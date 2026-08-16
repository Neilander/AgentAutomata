const fs = require('fs');
const path = require('path');

const root = __dirname;
const actual = JSON.parse(fs.readFileSync(path.join(root, 'outputs', 'phase2_predictions.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(root, 'hidden_expected.json'), 'utf8'));

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function equal(a, b) {
  return JSON.stringify(stable(a)) === JSON.stringify(stable(b));
}

function includesAll(actualValues, expectedValues) {
  const set = new Set(actualValues || []);
  return expectedValues.every((value) => set.has(value));
}

const actualById = new Map(actual.cases.map((item) => [item.id, item]));
const results = [];

for (const spec of expected.cases) {
  const item = actualById.get(spec.id);
  if (!item) {
    results.push({id: spec.id, passed: false, checks: {present: false}});
    continue;
  }
  const checks = {
    present: true,
    finalStateExact: equal(item.finalState, spec.finalState),
    requiredRulesRecalled: includesAll(item.activatedRuleIds, spec.requiredRuleIds),
    forbiddenRulesAvoided: !(item.activatedRuleIds || []).some((id) => spec.forbiddenRuleIds.includes(id)),
    requiredMemoriesRecalled: includesAll(item.activatedMemoryIds, spec.requiredMemoryIds),
    continuedLongEnough: (item.actionTrace || []).length >= spec.minimumActionSteps,
    attentionWasExplicit: Array.isArray(item.attentionTrace) && item.attentionTrace.length > 0 && item.attentionTrace.every((entry) => entry.why && entry.observation)
  };
  results.push({id: spec.id, passed: Object.values(checks).every(Boolean), checks});
}

const summary = {
  schema: 'blind_agent_wakeup_evaluation_v0',
  casesPassed: results.filter((item) => item.passed).length,
  casesTotal: results.length,
  allPassed: results.every((item) => item.passed),
  results
};

const output = path.join(root, 'outputs', 'programmatic_evaluation.json');
fs.writeFileSync(output, JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(summary, null, 2));
