const TOP_SCALE_SHARE = 0.30;
const DEFAULT_PAIR_WEIGHT = 4;
const NEW_SUBJECT_STIFFNESS = 0.2;

function createStrengthCognitionMatrix(options = {}) {
  return {
    schema: "character_strength_cognition_matrix_v1",
    profile: options.profile || "ordinary",
    updateCount: 0,
    entries: [],
    subjectOrder: [],
    informationMatrix: [],
    evidenceVector: [],
    scale: emptyScale(),
    history: [],
  };
}

function ensureStrengthCognitionMatrix(value, options = {}) {
  if (!value || value.schema !== "character_strength_cognition_matrix_v1") {
    return createStrengthCognitionMatrix(options);
  }
  const matrix = clone(value);
  matrix.profile = matrix.profile || options.profile || "ordinary";
  matrix.updateCount = Number(matrix.updateCount || 0);
  matrix.entries = Array.isArray(matrix.entries) ? matrix.entries : [];
  ensureInformationState(matrix);
  matrix.scale = matrix.scale || emptyScale();
  matrix.history = Array.isArray(matrix.history) ? matrix.history : [];
  refreshStrengthScale(matrix);
  return matrix;
}

function updateStrengthCognitionMatrix(matrixInput, analysis, options = {}) {
  const matrix = ensureStrengthCognitionMatrix(matrixInput, { profile: analysis?.profile });
  const units = Array.isArray(analysis?.units) ? analysis.units.filter((unit) => unit?.id) : [];
  if (units.length === 0) return { matrix, trace: null };

  const pairWeight = Math.max(0.01, Number(options.pairWeight || DEFAULT_PAIR_WEIGHT));
  const entryById = new Map(matrix.entries.map((entry) => [entry.subject.id, entry]));
  const participantEntries = units.map((unit) => {
    const existing = entryById.get(unit.id);
    if (existing) return existing;
    const entry = {
      subject: { id: unit.id, name: unit.name, role: unit.role },
      position: 0,
      stiffness: NEW_SUBJECT_STIFFNESS,
      evidenceCount: 0,
      firstObservedReportId: analysis.reportId,
      lastObservedReportId: null,
      lastObservedLevel: 0,
      scaleView: null,
    };
    matrix.entries.push(entry);
    entryById.set(unit.id, entry);
    return entry;
  });
  ensureInformationState(matrix);

  const size = units.length;
  const system = matrix.informationMatrix.map((row) => row.slice());
  const target = matrix.evidenceVector.slice();
  const globalIndexById = new Map(matrix.subjectOrder.map((id, index) => [id, index]));
  const before = participantEntries.map((entry) => ({
    id: entry.subject.id,
    position: Number(entry.position || 0),
    stiffness: Math.max(NEW_SUBJECT_STIFFNESS, Number(entry.stiffness || 0)),
    evidenceCount: Number(entry.evidenceCount || 0),
  }));

  const relativeMatrix = Array.from({ length: size }, () => Array(size).fill(0));
  for (let left = 0; left < size; left += 1) {
    for (let right = left + 1; right < size; right += 1) {
      const difference = Number(units[left].strength?.level || 0) - Number(units[right].strength?.level || 0);
      relativeMatrix[left][right] = round(difference);
      relativeMatrix[right][left] = round(-difference);
      addPairConstraint(
        system,
        target,
        globalIndexById.get(units[left].id),
        globalIndexById.get(units[right].id),
        difference,
        pairWeight,
      );
    }
  }

  const solved = solveLinearSystem(system, target);
  matrix.informationMatrix = system;
  matrix.evidenceVector = target;
  matrix.entries.forEach((entry, index) => {
    entry.position = round(solved[index]);
    entry.stiffness = round(system[index][index]);
  });
  const after = [];
  for (let index = 0; index < size; index += 1) {
    const entry = participantEntries[index];
    entry.subject = { id: units[index].id, name: units[index].name, role: units[index].role };
    entry.evidenceCount = before[index].evidenceCount + 1;
    entry.lastObservedReportId = analysis.reportId;
    entry.lastObservedLevel = Number(units[index].strength?.level || 0);
    after.push({
      id: entry.subject.id,
      position: entry.position,
      delta: round(entry.position - before[index].position),
      stiffness: entry.stiffness,
      evidenceCount: entry.evidenceCount,
    });
  }

  matrix.updateCount += 1;
  refreshStrengthScale(matrix);
  const trace = {
    updateIndex: matrix.updateCount,
    reportId: analysis.reportId,
    participantIds: units.map((unit) => unit.id),
    before,
    battleRelativeMatrix: relativeMatrix,
    observedLevels: units.map((unit) => ({ id: unit.id, level: Number(unit.strength?.level || 0) })),
    after,
    scale: clone(matrix.scale),
    rule: "minimize prior movement plus all weighted pairwise relation errors in one simultaneous solve",
  };
  matrix.history.push(trace);
  if (matrix.history.length > 32) matrix.history.splice(0, matrix.history.length - 32);
  return { matrix, trace };
}

function ensureInformationState(matrix) {
  const ids = matrix.entries.map((entry) => entry.subject.id);
  const valid = Array.isArray(matrix.subjectOrder)
    && ids.length === matrix.subjectOrder.length
    && ids.every((id, index) => matrix.subjectOrder[index] === id)
    && Array.isArray(matrix.informationMatrix)
    && matrix.informationMatrix.length === ids.length
    && matrix.informationMatrix.every((row) => Array.isArray(row) && row.length === ids.length)
    && Array.isArray(matrix.evidenceVector)
    && matrix.evidenceVector.length === ids.length;
  if (valid) return;

  const oldOrder = Array.isArray(matrix.subjectOrder) ? matrix.subjectOrder : [];
  const oldIndex = new Map(oldOrder.map((id, index) => [id, index]));
  const oldMatrix = Array.isArray(matrix.informationMatrix) ? matrix.informationMatrix : [];
  const oldVector = Array.isArray(matrix.evidenceVector) ? matrix.evidenceVector : [];
  const nextMatrix = Array.from({ length: ids.length }, () => Array(ids.length).fill(0));
  const nextVector = Array(ids.length).fill(0);

  for (let row = 0; row < ids.length; row += 1) {
    const oldRow = oldIndex.get(ids[row]);
    if (oldRow == null) {
      const stiffness = Math.max(NEW_SUBJECT_STIFFNESS, Number(matrix.entries[row].stiffness || 0));
      nextMatrix[row][row] = stiffness;
      nextVector[row] = stiffness * Number(matrix.entries[row].position || 0);
      continue;
    }
    nextVector[row] = Number(oldVector[oldRow] || 0);
    for (let column = 0; column < ids.length; column += 1) {
      const oldColumn = oldIndex.get(ids[column]);
      if (oldColumn != null) nextMatrix[row][column] = Number(oldMatrix[oldRow]?.[oldColumn] || 0);
    }
  }
  matrix.subjectOrder = ids;
  matrix.informationMatrix = nextMatrix;
  matrix.evidenceVector = nextVector;
}

function refreshStrengthScale(matrix) {
  const eligible = matrix.entries
    .filter((entry) => Number(entry.evidenceCount || 0) > 0)
    .sort((a, b) => Number(b.position || 0) - Number(a.position || 0)
      || String(a.subject.id).localeCompare(String(b.subject.id)));
  if (eligible.length === 0) {
    matrix.scale = emptyScale();
    return matrix.scale;
  }
  const topCount = Math.max(1, Math.ceil(eligible.length * TOP_SCALE_SHARE));
  const boundary = Number(eligible[topCount - 1].position || 0);
  eligible.forEach((entry, index) => {
    const relativeToScale = round(Number(entry.position || 0) - boundary);
    entry.scaleView = {
      rank: index + 1,
      populationSize: eligible.length,
      topCount,
      inTopThirtyPercent: index < topCount,
      boundaryPosition: round(boundary),
      relativeToScale,
      level: clamp(Math.round(relativeToScale), -3, 9),
    };
  });
  matrix.scale = {
    share: TOP_SCALE_SHARE,
    populationSize: eligible.length,
    topCount,
    boundaryPosition: round(boundary),
    boundarySubjectId: eligible[topCount - 1].subject.id,
    topSubjectIds: eligible.slice(0, topCount).map((entry) => entry.subject.id),
    updatedAt: matrix.updateCount,
  };
  return matrix.scale;
}

function addPairConstraint(system, target, left, right, difference, weight) {
  system[left][left] += weight;
  system[right][right] += weight;
  system[left][right] -= weight;
  system[right][left] -= weight;
  target[left] += weight * difference;
  target[right] -= weight * difference;
}

function solveLinearSystem(matrixInput, vectorInput) {
  const size = vectorInput.length;
  const rows = matrixInput.map((row, index) => [...row.map(Number), Number(vectorInput[index])]);
  for (let column = 0; column < size; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < size; row += 1) {
      if (Math.abs(rows[row][column]) > Math.abs(rows[pivot][column])) pivot = row;
    }
    if (Math.abs(rows[pivot][column]) < 1e-10) throw new Error("strength cognition matrix is singular");
    if (pivot !== column) [rows[pivot], rows[column]] = [rows[column], rows[pivot]];
    const divisor = rows[column][column];
    for (let item = column; item <= size; item += 1) rows[column][item] /= divisor;
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue;
      const factor = rows[row][column];
      for (let item = column; item <= size; item += 1) rows[row][item] -= factor * rows[column][item];
    }
  }
  return rows.map((row) => row[size]);
}

function emptyScale() {
  return {
    share: TOP_SCALE_SHARE,
    populationSize: 0,
    topCount: 0,
    boundaryPosition: 0,
    boundarySubjectId: null,
    topSubjectIds: [],
    updatedAt: 0,
  };
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function round(value, digits = 3) { return Number(Number(value || 0).toFixed(digits)); }
function clone(value) { return structuredClone(value); }

module.exports = {
  TOP_SCALE_SHARE,
  DEFAULT_PAIR_WEIGHT,
  createStrengthCognitionMatrix,
  ensureStrengthCognitionMatrix,
  updateStrengthCognitionMatrix,
  refreshStrengthScale,
  solveLinearSystem,
};
