"use strict";

// User-transcribed easy sides for all four sky tiles, ordered top to bottom.
// Compact cell legend: . empty, E# explosion, L/R horizontal arrow,
// M mothership descends one row. Rail legend: W white ship, X excavator back,
// Q research back, D city damage.

const ACTION_TYPES = {
  W: "spawn_white",
  X: "excavator_back",
  Q: "research_back",
  D: "damage",
};

const tileSpecs = [
  {
    id: "sky-1", label: "天空板 1", side: "easy", rows: [
      { cells: [".", ".", ".", "R", "."], actions: [["W", 1]] },
      { cells: [".", "L", "R", ".", "."], actions: [["X", 2]] },
      { cells: ["M", ".", "E1", ".", "."], actions: [["W", 1]] },
      { cells: ["E2", ".", "L", ".", "E4"] },
    ],
  },
  {
    id: "sky-2", label: "天空板 2", side: "easy", rows: [
      { cells: ["M", "R", ".", "E4", "."], actions: [["W", 1]] },
      { cells: [".", "M", ".", ".", "."], actions: [["X", 1]] },
      { cells: ["E4", "E3", ".", "L", "E2"], actions: [["Q", 1]] },
      { cells: ["R", ".", "E8", ".", "L"] },
    ],
  },
  {
    id: "sky-3", label: "天空板 3", side: "easy", rows: [
      { cells: [".", ".", "E4", "R", "."], actions: [["Q", 1]] },
      { cells: ["E5", ".", "L", ".", "."], actions: [["W", 1]] },
      { cells: [".", "M", "R", ".", "E6"] },
      { cells: ["M", "E3", ".", "E4", "M"], skull: true },
    ],
  },
  {
    id: "sky-4", label: "天空板 4", side: "easy", rows: [
      { cells: ["E3", "R", ".", "M", "."] },
      { cells: [".", "E6", ".", "L", "E4"] },
      { cells: ["R", ".", "E3", ".", "L"] },
      { cells: [".", "E5", "M", "E4", "."] },
    ],
  },
];

function compileCell(token, row, column) {
  if (token === ".") return {};
  if (token === "M") return { effect: { type: "mothership_down", amount: 1 } };
  if (token === "L" || token === "R") {
    const targetColumn = column + (token === "L" ? -1 : 1);
    if (targetColumn < 0 || targetColumn >= 5) throw new Error(`arrow leaves sky at row ${row}, column ${column}`);
    return { effect: { type: "arrow", targetRow: row, targetColumn } };
  }
  const explosion = /^E(\d+)$/.exec(token);
  if (explosion) return { explosion: Number(explosion[1]) };
  throw new Error(`unknown sky cell token: ${token}`);
}

const rows = [];
const rowSources = [];
let globalRow = 0;
for (const [tileOrder, tile] of tileSpecs.entries()) {
  if (tile.rows.length !== 4) throw new Error(`${tile.id} must contain 4 rows`);
  for (const [localRow, row] of tile.rows.entries()) {
    if (row.cells.length !== 5) throw new Error(`${tile.id} row ${localRow + 1} must contain 5 cells`);
    rows.push({
      index: globalRow,
      cells: row.cells.map((token, column) => compileCell(token, globalRow, column)),
      mothershipActions: (row.actions || []).map(([code, amount]) => ({ type: ACTION_TYPES[code], amount })),
    });
    rowSources.push({ tileId: tile.id, tileOrder, localRow, globalRow, skull: Boolean(row.skull) });
    globalRow += 1;
  }
}

const skullRows = rowSources.filter((row) => row.skull).map((row) => row.globalRow);
if (skullRows.length !== 1) throw new Error(`expected exactly one skull row, found ${skullRows.length}`);

module.exports = {
  source: "user-export-2026-08-11",
  threatLevel: 0,
  tileOrder: tileSpecs.map((tile) => tile.id),
  tiles: tileSpecs.map(({ id, label, side }) => ({ id, label, side })),
  dropRow: 0,
  cityRow: rows.length,
  skullRow: skullRows[0],
  rows,
};
