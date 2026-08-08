"use strict";

// This is deliberately not a commercial board transcription. It is a compact
// fixture that contains every official rule shape needed by the engine tests.
const cells = [];
const rooms = [];

function room(id, type, specs, modifier = 0, energyCost = 0) {
  const cellIds = specs.map(([column, unlockIndex], index) => {
    const cellId = `${id}-c${column}-${index}`;
    cells.push({ id: cellId, column, unlockIndex, roomId: id });
    return cellId;
  });
  rooms.push({ id, type, cellIds, modifier, energyCost });
}

room("aa-0", "aa", [[0, 0]]);
room("energy-1", "energy", [[1, 0]]);
room("fighter-2", "fighter", [[2, 0]], 0, 1);
room("research-3", "research", [[3, 0]], 0, 1);
room("tunnel-4", "tunnel", [[4, 0]]);
room("deep-energy-0", "energy", [[0, 2]], 1, 0);
room("multi-research", "research", [[1, 3], [2, 3]], -1, 2);
room("robot-3", "robot", [[3, 4]], 0, 1);
room("deep-fighter-4", "fighter", [[4, 5]], 2, 2);

const rows = Array.from({ length: 10 }, (_, index) => ({
  index,
  cells: Array.from({ length: 5 }, () => ({})),
  mothershipActions: [],
}));
rows[2].cells[0] = { explosion: 2 };
rows[3].cells[1] = { effect: { type: "arrow", targetRow: 2, targetColumn: 2 } };
rows[4].cells[2] = { effect: { type: "mothership_down", amount: 1 } };
rows[5].cells[3] = { explosion: 4 };
rows[1].mothershipActions = [{ type: "spawn_white", amount: 1 }];
rows[3].mothershipActions = [{ type: "research_back", amount: 1 }];
rows[5].mothershipActions = [{ type: "excavator_back", amount: 2 }];
rows[7].mothershipActions = [{ type: "damage", amount: 1 }];

module.exports = {
  schema: "ufs_standard_map_v1",
  id: "synthetic-all-rules",
  label: "规则单测合成地图（非商业版图）",
  columns: 5,
  city: {
    id: "test-city",
    label: "测试城市",
    maxDamage: 4,
    startEnergy: 2,
    maxEnergy: 7,
    robotLimit: 2,
    firstRoll: null,
  },
  research: {
    costs: [1, 3, 1, 2, 4, 1],
    finalRequiresMultiSpace: true,
  },
  sky: {
    dropRow: 0,
    cityRow: 10,
    skullRow: 8,
    rows,
  },
  base: {
    cells,
    rooms,
    excavatorPath: [
      "energy-1-c1-0",
      "deep-energy-0-c0-0",
      "multi-research-c1-0",
      "multi-research-c2-1",
      "robot-3-c3-0",
      "deep-fighter-4-c4-0",
    ],
    startExcavatorIndex: 0,
  },
};

