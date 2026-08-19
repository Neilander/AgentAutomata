"use strict";

// Roswell A+B base transcription.
// Room types, modifiers, energy costs and multi-cell grouping come from the
// user's reviewed editor export. Excavation order is transcribed separately
// from the yellow tunnel shown on the physical A+B setup.

const cells = [];
const rooms = [];
const pathEntries = [];

function cellId(tile, row, column) {
  return `${tile}-r${row + 1}-c${column + 1}`;
}

function room(id, type, specs, modifier = 0, energyCost = 0) {
  const cellIds = specs.map(({ tile, row, column, unlockIndex = 0, pathOrder = null }) => {
    const idForCell = cellId(tile, row, column);
    cells.push({
      id: idForCell,
      tile,
      row,
      column,
      unlockIndex,
      roomId: id,
    });
    if (pathOrder != null) pathEntries.push({ order: pathOrder, cellId: idForCell });
    return idForCell;
  });
  rooms.push({ id, type, cellIds, modifier, energyCost });
}

function at(tile, row, column, pathOrder = null) {
  return {
    tile,
    row,
    column,
    unlockIndex: pathOrder == null ? 0 : pathOrder,
    pathOrder,
  };
}

// A row 1: five anti-air rooms. Their -1 ship descent is an AA rule, not a
// normal room modifier, so modifier remains 0.
for (let column = 0; column < 5; column += 1) {
  room(`A-aa-c${column + 1}`, "aa", [at("A", 0, column)]);
}

// A row 2: already excavated at game start.
room("A-upper-fighter", "fighter", [at("A", 1, 0)], -1, 1);
room("A-upper-research", "research", [at("A", 1, 1)], 0, 2);
room("A-upper-tunnel", "tunnel", [at("A", 1, 2)]);
room("A-upper-energy", "energy", [at("A", 1, 3), at("A", 1, 4)], -3, 0);

// The excavator starts at A row 3 column 5, then continues left.
room("A-path-energy", "energy", [at("A", 2, 0, 4)]);
room("A-path-fighter", "fighter", [at("A", 2, 1, 3), at("A", 2, 2, 2)], 0, 2);
room("A-path-research", "research", [at("A", 2, 3, 1)], -1, 1);
room("A-start-tunnel", "tunnel", [at("A", 2, 4, 0)]);

// B row 1: path enters at column 1 and travels left to right.
room("B-upper-research-left", "research", [at("B", 0, 0, 5)], -1, 0);
room("B-upper-tunnel", "tunnel", [at("B", 0, 1, 6)]);
room("B-upper-research-multi", "research", [at("B", 0, 2, 7), at("B", 0, 3, 8)], 0, 2);
room("B-upper-fighter", "fighter", [at("B", 0, 4, 9)], 0, 2);

// B row 2: path turns and travels right to left.
room("B-middle-fighter-left", "fighter", [at("B", 1, 0, 14)], 1, 2);
room("B-middle-energy", "energy", [at("B", 1, 1, 13)], 1, 0);
room("B-middle-fighter", "fighter", [at("B", 1, 2, 12)], 0, 1);
room("B-middle-tunnel", "tunnel", [at("B", 1, 3, 11)]);
room("B-middle-research", "research", [at("B", 1, 4, 10)], 0, 1);

// B row 3: final turn, left to right, ending at the lower-right corner.
room("B-bottom-tunnel-left", "tunnel", [at("B", 2, 0, 15)]);
room("B-bottom-research-multi", "research", [at("B", 2, 1, 16), at("B", 2, 2, 17), at("B", 2, 3, 18)], 0, 2);
room("B-bottom-tunnel-right", "tunnel", [at("B", 2, 4, 19)]);

cells.sort((a, b) => a.tile.localeCompare(b.tile) || a.row - b.row || a.column - b.column);
pathEntries.sort((a, b) => a.order - b.order);

const fullRoute = [
  ...Array.from({ length: 5 }, (_, offset) => cellId("A", 0, 4 - offset)),
  ...Array.from({ length: 5 }, (_, column) => cellId("A", 1, column)),
  ...Array.from({ length: 5 }, (_, offset) => cellId("A", 2, 4 - offset)),
  ...Array.from({ length: 5 }, (_, column) => cellId("B", 0, column)),
  ...Array.from({ length: 5 }, (_, offset) => cellId("B", 1, 4 - offset)),
  ...Array.from({ length: 5 }, (_, column) => cellId("B", 2, column)),
];

module.exports = {
  source: "user-reviewed-room-entry-plus-physical-yellow-tunnel",
  cells,
  rooms,
  fullRoute,
  excavatorPath: pathEntries.map((entry) => entry.cellId),
  startExcavatorIndex: 0,
};
