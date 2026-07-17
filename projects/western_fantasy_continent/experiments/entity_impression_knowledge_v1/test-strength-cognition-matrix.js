const assert = require("assert");
const MATRIX = require("./strength-cognition-matrix");

const joint = MATRIX.createStrengthCognitionMatrix({ profile: "expert" });
joint.entries = [
  seeded("a", 3),
  seeded("b", 6),
  seeded("c", 12),
  seeded("d", 9),
];
MATRIX.refreshStrengthScale(joint);
const jointResult = MATRIX.updateStrengthCognitionMatrix(joint, {
  reportId: "joint_movement_probe",
  profile: "expert",
  units: [
    observed("a", 0),
    observed("b", 2),
    observed("c", 6),
    observed("d", 6),
  ],
});
const jointPositions = Object.fromEntries(jointResult.matrix.entries.map((entry) => [entry.subject.id, entry.position]));
assert(jointPositions.a > 3, "A should move up when the battle says its gap to B is smaller");
assert(Math.abs(jointPositions.b - 6) < 0.2, "B should remain near its old position when old and new relations agree");
assert(jointPositions.c < 12, "C should move down when the battle compresses its gap to B");
assert(jointPositions.d > 9, "D should move up when the battle expands its gap to B");
assert.deepStrictEqual(jointResult.trace.after.map((row) => row.id), ["a", "b", "c", "d"]);
assert.strictEqual(jointResult.trace.battleRelativeMatrix[0][1], -2);
assert.strictEqual(jointResult.trace.battleRelativeMatrix[1][0], 2);

const commutativeReports = [
  battle("order_1", [["a", 0], ["b", 2], ["c", 5], ["d", -1]]),
  battle("order_2", [["c", 3], ["d", 1], ["e", 6], ["f", 0]]),
  battle("order_3", [["a", -1], ["e", 4], ["g", 2], ["h", 0]]),
];
const forwardOrderPositions = runReports(commutativeReports);
const reverseOrderPositions = runReports(commutativeReports.slice().reverse());
const orderDifferences = Object.keys(forwardOrderPositions)
  .map((id) => Math.abs(forwardOrderPositions[id] - reverseOrderPositions[id]));
assert(Math.max(...orderDifferences) <= 0.001,
  "the same complete pairwise evidence graph must produce the same per-character positions in any battle order");

const baseline = MATRIX.createStrengthCognitionMatrix({ profile: "expert" });
const baselineScores = [12, 10, 9, 8, 7, 6, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, -1, -2, -3];
baseline.entries = baselineScores.map((position, index) => seeded(`hero_${index + 1}`, position));
MATRIX.refreshStrengthScale(baseline);
assert.strictEqual(baseline.scale.populationSize, 20);
assert.strictEqual(baseline.scale.topCount, 6);
assert.strictEqual(baseline.scale.boundaryPosition, 6);
assert.strictEqual(entry(baseline, "hero_5").scaleView.relativeToScale, 1,
  "a position of 7 above a boundary of 6 must display as level 1");
assert.strictEqual(entry(baseline, "hero_3").scaleView.level, 3);

const withStrong = structuredClone(baseline);
withStrong.entries.push(seeded("new_strong_1", 15), seeded("new_strong_2", 14), seeded("new_strong_3", 13));
MATRIX.refreshStrengthScale(withStrong);
assert(withStrong.scale.boundaryPosition > baseline.scale.boundaryPosition,
  "several new strong characters must raise the live top-30-percent boundary");
assert(entry(withStrong, "hero_3").scaleView.level < entry(baseline, "hero_3").scaleView.level,
  "an unchanged old character must be reclassified downward after the ruler rises");

const withWeak = structuredClone(baseline);
for (let index = 0; index < 10; index += 1) withWeak.entries.push(seeded(`new_weak_${index + 1}`, -10 - index));
MATRIX.refreshStrengthScale(withWeak);
assert(withWeak.scale.boundaryPosition < baseline.scale.boundaryPosition,
  "many valid weak characters must lower the live top-30-percent boundary by expanding the population");
assert(entry(withWeak, "hero_3").scaleView.level > entry(baseline, "hero_3").scaleView.level,
  "an unchanged old character must be reclassified upward after many weaker characters arrive");

console.log(JSON.stringify({
  result: "PASS",
  jointPositions,
  orderCommutativity: {
    subjectCount: Object.keys(forwardOrderPositions).length,
    maximumPositionDifference: Math.max(...orderDifferences),
  },
  baselineScale: baseline.scale,
  strongScale: withStrong.scale,
  weakScale: withWeak.scale,
  oldHeroLevels: {
    baseline: entry(baseline, "hero_3").scaleView.level,
    afterStrong: entry(withStrong, "hero_3").scaleView.level,
    afterWeak: entry(withWeak, "hero_3").scaleView.level,
  },
}, null, 2));

function seeded(id, position) {
  return {
    subject: { id, name: id, role: "probe" },
    position,
    stiffness: 1,
    evidenceCount: 1,
    firstObservedReportId: "seed",
    lastObservedReportId: "seed",
    lastObservedLevel: position,
    scaleView: null,
  };
}

function observed(id, level) {
  return { id, name: id, role: "probe", strength: { level } };
}

function battle(reportId, rows) {
  return {
    reportId,
    profile: "expert",
    units: rows.map(([id, level]) => observed(id, level)),
  };
}

function runReports(reports) {
  let matrix = MATRIX.createStrengthCognitionMatrix({ profile: "expert" });
  for (const report of reports) matrix = MATRIX.updateStrengthCognitionMatrix(matrix, report).matrix;
  return Object.fromEntries(matrix.entries
    .map((row) => [row.subject.id, row.position])
    .sort(([left], [right]) => left.localeCompare(right)));
}

function entry(matrix, id) {
  return matrix.entries.find((row) => row.subject.id === id);
}
