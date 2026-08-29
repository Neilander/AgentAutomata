"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const mode = process.argv[2] || "stage1";
if (!["stage1", "final"].includes(mode)) {
  throw new Error("usage: node auto-clean-play.js <stage1|final>");
}

const dir = __dirname;
const ledgerPath = path.join(dir, "machine-records.ndjson");

function readRows() {
  if (!fs.existsSync(ledgerPath)) return [];
  return fs.readFileSync(ledgerPath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(JSON.parse);
}

function lastPublic(rows) {
  return rows.at(-1)?.public || null;
}

function nextSeq(rows) {
  return String(rows.length + 1).padStart(3, "0");
}

function runRecorder(args) {
  const result = spawnSync(process.execPath, ["record-public-step.js", ...args], {
    cwd: dir,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    process.exit(result.status || 1);
  }
  const response = JSON.parse(result.stdout);
  const rows = readRows();
  console.log(`${args[0]} ${args[1]} ${response.status}/${response.reason} round=${response.game?.round} done=${response.game?.completedRoundCount}`);
  return { response, rows };
}

function contract(publicView, type) {
  return publicView.operationContracts?.find((row) => row.type === type);
}

function enumValues(publicView, type, field) {
  return contract(publicView, type)?.fields?.[field]?.values || [];
}

function occupiedColumns(publicView) {
  return new Set((publicView.observation?.placements || [])
    .filter((row) => !row.resolved)
    .map((row) => row.column));
}

function roomById(publicView) {
  return new Map((publicView.mapView?.rooms || []).map((room) => [room.id, room]));
}

function bannedPlacements(rows) {
  const banned = new Set();
  for (const row of rows) {
    const reason = row.public?.reason || "";
    const action = row.public?.lastAction;
    if (row.public?.status === "rejected" && reason.includes("rejected placement")
      && action?.dieId && action?.cellId) {
      banned.add(`${action.dieId}@${action.cellId}`);
    }
  }
  return banned;
}

function choosePlacement(publicView, rows) {
  const dice = (publicView.observation?.dice || []).filter((die) => !die.placed);
  const cells = publicView.mapView?.baseCells || [];
  const occupied = occupiedColumns(publicView);
  const rooms = roomById(publicView);
  const banned = bannedPlacements(rows);
  const excavatorIndex = Number(publicView.observation?.excavatorIndex ?? 0);
  const energy = Number(publicView.observation?.energy ?? 0);
  const existingRooms = new Set((publicView.observation?.placements || [])
    .filter((row) => !row.resolved)
    .map((row) => row.roomId));
  let best = null;
  for (const die of dice) {
    for (const cell of cells) {
      if (occupied.has(cell.column)) continue;
      if (banned.has(`${die.id}@${cell.id}`)) continue;
      if (Number.isInteger(cell.unlockIndex) && cell.unlockIndex > excavatorIndex + die.value) continue;
      const room = rooms.get(cell.roomId);
      let score = die.value;
      if (cell.unlockIndex > excavatorIndex) score += energy > 0 ? 90 + cell.unlockIndex : 35 + cell.unlockIndex;
      if (room?.type === "energy") score += 85;
      else if (room?.type === "research") score += 75;
      else if (room?.type === "tunnel") score += 55;
      else if (room?.type === "fighter") score += 35;
      else if (room?.type === "aa") score += 25;
      if (existingRooms.has(cell.roomId)) score += 45;
      if (!best || score > best.score) best = { die, cell, room, score };
    }
  }
  if (!best && dice[0] && cells[0]) best = { die: dice[0], cell: cells[0], room: rooms.get(cells[0].roomId), score: 0 };
  if (!best) throw new Error("no visible placement candidate");
  return {
    judgment: `macro_need=energy_depth_research; choose ${best.die.id}@${best.cell.id}; prefer ${best.room?.type || "visible"} over lower value or occupied-column options`,
    payload: {
      type: "place_die",
      dieId: best.die.id,
      cellId: best.cell.id,
      predictions: [{
        because: "chosen die and base cell are visible and expected to become occupied after placement",
        expectations: [
          { itemId: `die:${best.die.id}`, field: "placed", change: "equals", value: true },
          { itemId: `cell:${best.cell.id}`, field: "occupied", change: "equals", value: true },
        ],
      }],
    },
  };
}

function chooseRoomAction(publicView) {
  const ops = publicView.availableOperations || [];
  if (ops.includes("excavate")) {
    const ids = enumValues(publicView, "excavate", "placementId");
    if (ids.length) {
      return {
        judgment: `macro_need=depth; choose excavation ${ids.at(-1)} before spending workers on weaker room effects`,
        payload: {
          type: "excavate",
          placementId: ids.at(-1),
          predictions: [{
            because: "listed excavation candidate should spend energy and advance excavation depth",
            expectations: [
              { itemId: "track:excavatorIndex", field: "value", change: "increase" },
              { itemId: `placement:${ids.at(-1)}`, field: "resolved", change: "equals", value: true },
            ],
          }],
        },
      };
    }
  }
  if (ops.includes("resolve_room")) {
    const values = enumValues(publicView, "resolve_room", "roomId");
    const rooms = roomById(publicView);
    const priority = { energy: 5, research: 4, fighter: 3, aa: 2, tunnel: 1 };
    const chosen = [...values].sort((a, b) => (
      (priority[rooms.get(b)?.type] || 0) - (priority[rooms.get(a)?.type] || 0)
      || a.localeCompare(b)
    ))[0];
    if (chosen) {
      const type = rooms.get(chosen)?.type || "room";
      const expectations = [
        { itemId: `room:${chosen}`, field: "resolved", change: "equals", value: true },
      ];
      if (type === "energy") expectations.push({ itemId: "resource:energy", field: "amount", change: "changed" });
      if (type === "research") expectations.push({ itemId: "track:researchIndex", field: "value", change: "changed" });
      return {
        judgment: `macro_need=resources_and_progress; resolve ${chosen} (${type}) as best currently offered room`,
        payload: { type: "resolve_room", roomId: chosen, pay: true, predictions: [{ because: "room is listed as resolvable by the public contract", expectations }] },
      };
    }
  }
  if (ops.includes("skip_worker")) {
    const ids = enumValues(publicView, "skip_worker", "placementId");
    if (ids.length) {
      return {
        judgment: `macro_need=clear_unhelpful_worker; skip ${ids[0]} because no better room effect is available`,
        payload: {
          type: "skip_worker",
          placementId: ids[0],
          predictions: [{
            because: "skipped worker should be marked resolved",
            expectations: [{ itemId: `placement:${ids[0]}`, field: "resolved", change: "equals", value: true }],
          }],
        },
      };
    }
  }
  return {
    judgment: "macro_need=end_phase; no useful room actions remain, advance to mothership",
    payload: {
      type: "end_rooms",
      predictions: [{
        because: "ending rooms should advance the game phase toward mothership/spawn/new round",
        expectations: [{ itemId: "phase:game", field: "phase", change: "changed" }],
      }],
    },
  };
}

function chooseResearch(publicView) {
  const c = contract(publicView, "choose_research_advance");
  const max = c?.fields?.advanceSteps?.maximum ?? publicView.pending?.maxAdvanceSteps ?? 0;
  const roomId = c?.fields?.roomId?.value ?? publicView.pending?.roomId;
  const steps = Math.max(0, max);
  return {
    judgment: `macro_need=victory_progress; choose max research advance ${steps}/${max}`,
    payload: {
      type: "choose_research_advance",
      roomId,
      advanceSteps: steps,
      predictions: [{
        because: "research choice uses the public maximum affordable advance",
        expectations: [{ itemId: "track:researchIndex", field: "value", change: steps > 0 ? "increase" : "unchanged" }],
      }],
    },
  };
}

function chooseSpawn(publicView) {
  const c = contract(publicView, "choose_spawn");
  const shipId = c?.fields?.shipId?.value ?? publicView.pending?.shipId;
  const candidates = c?.fields?.dropPointId?.values || publicView.pending?.candidates || [];
  const ships = publicView.observation?.ships || [];
  const scored = candidates.map((id) => {
    const column = Number(id.slice("DP-C".length)) - 1;
    const rows = ships.filter((ship) => ship.column === column).map((ship) => ship.row);
    return { id, column, score: rows.length ? Math.min(...rows) : 999 };
  }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  const chosen = scored[0]?.id;
  if (!chosen) throw new Error("no spawn candidate");
  return {
    judgment: `macro_need=least_crowded_spawn; choose ${chosen} for ${shipId}`,
    payload: {
      type: "choose_spawn",
      shipId,
      dropPointId: chosen,
      predictions: [{
        because: "chosen drop point is listed by the public spawn contract",
        expectations: [
          { itemId: `ship:${shipId}`, field: "present", change: "equals", value: true },
        ],
      }],
    },
  };
}

function chooseAdvance(publicView, rows) {
  const pending = publicView.pending?.type;
  if ((publicView.availableOperations || []).includes("place_die") || pending === "place_die") {
    return choosePlacement(publicView, rows);
  }
  if ((publicView.availableOperations || []).includes("choose_research_advance")) {
    return chooseResearch(publicView);
  }
  if ((publicView.availableOperations || []).includes("choose_spawn")) {
    return chooseSpawn(publicView);
  }
  if (pending === "room_action" || (publicView.availableOperations || []).some((op) => ["resolve_room", "excavate", "skip_worker", "end_rooms"].includes(op))) {
    return chooseRoomAction(publicView);
  }
  throw new Error(`no strategy for pending ${pending}`);
}

let rows = readRows();
let publicView = lastPublic(rows);
if (!rows.length) {
  ({ response: publicView, rows } = runRecorder([nextSeq(rows), "start", "fresh_clean_start"]));
}

for (let guard = 0; guard < 240; guard += 1) {
  if (mode === "stage1"
    && publicView.status === "random"
    && publicView.reason === "waiting_for_next_round_roll"
    && publicView.pending?.round === 4
    && publicView.game?.completedRoundCount === 3) {
    console.log("stage1_boundary_reached");
    process.exit(0);
  }
  if (publicView.status === "complete") {
    console.log("formal_outcome_reached");
    process.exit(0);
  }
  const seq = nextSeq(rows);
  if (publicView.status === "random") {
    ({ response: publicView, rows } = runRecorder([seq, "random", `observe_${publicView.pending?.type || "random"}`]));
    continue;
  }
  const choice = chooseAdvance(publicView, rows);
  ({ response: publicView, rows } = runRecorder([
    seq,
    "advance",
    choice.judgment,
    JSON.stringify(choice.payload),
  ]));
}

throw new Error("guard limit reached before requested stop");
