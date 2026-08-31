"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { pathsFor, readRecords, recordStep } = require("./record-game-step");

const MAX_RECORDS_PER_GAME = 500;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function contractFor(view, type) {
  return view.operationContracts?.find((contract) => contract.type === type) ?? null;
}

function enumValues(contract, field) {
  const spec = contract?.fields?.[field];
  if (spec?.kind === "fixed") return [spec.value];
  if (spec?.kind === "enum") return [...spec.values];
  return [];
}

function payloadForRecord(root, record) {
  return record.payloadFile ? readJson(path.join(root, record.payloadFile)) : null;
}

function collectMemory(paths, records, view) {
  const rooms = new Map();
  const cells = new Map();
  const feedbackIds = new Set();
  for (const record of records) {
    const publicView = record.public;
    for (const room of publicView?.mapView?.rooms ?? []) rooms.set(room.id, room);
    for (const cell of publicView?.mapView?.baseCells ?? []) cells.set(cell.id, cell);
    const serialized = JSON.stringify(publicView);
    for (const match of serialized.matchAll(/feedback-[A-Za-z0-9._:-]+/gu)) feedbackIds.add(match[0]);
  }
  const round = view.game?.round;
  const acceptedRoundPayloads = records
    .filter((record) => record.command === "advance"
      && record.public?.game?.round === round
      && record.public?.status !== "rejected")
    .map((record) => payloadForRecord(paths.root, record))
    .filter(Boolean);
  const placementPayloads = acceptedRoundPayloads.filter((payload) => payload.type === "place_die");
  const usedCells = new Set(placementPayloads.map((payload) => payload.cellId));
  const usedColumns = new Set([...usedCells].map((cellId) => cells.get(cellId)?.column).filter(Number.isInteger));
  const placedRoomIds = placementPayloads.map((payload) => cells.get(payload.cellId)?.roomId).filter(Boolean);
  const rejectedPayloads = records
    .filter((record) => record.command === "advance" && record.public?.status === "rejected")
    .map((record) => payloadForRecord(paths.root, record))
    .filter(Boolean);
  return {
    rooms,
    cells,
    feedbackIds: [...feedbackIds].sort(),
    usedCells,
    usedColumns,
    placedRoomIds,
    rejectedPayloads,
  };
}

function roomType(room, roomId) {
  if (room?.type) return room.type;
  for (const type of ["energy", "research", "fighter", "tunnel", "aa"]) {
    if (roomId.includes(type)) return type;
  }
  return "unknown";
}

function sourceLabel(memory) {
  return memory.feedbackIds.length
    ? `公开视图实际暴露feedback轨迹${memory.feedbackIds.join(",")}`
    : "公开视图未暴露feedback轨迹ID，依据公开合同与稳定规则知识";
}

function placementChoice(view, memory) {
  const rejectedCells = new Set(memory.rejectedPayloads
    .filter((payload) => payload.type === "place_die")
    .map((payload) => payload.cellId));
  const excavator = view.observation?.excavatorIndex ?? 0;
  const robots = new Set((view.observation?.robots ?? []).map((robot) => robot.cellId).filter(Boolean));
  const availableCells = [...memory.cells.values()].filter((cell) =>
    cell.unlockIndex <= excavator
      && !memory.usedColumns.has(cell.column)
      && !memory.usedCells.has(cell.id)
      && !rejectedCells.has(cell.id)
      && !robots.has(cell.id));
  const unplacedDice = (view.observation?.dice ?? []).filter((die) => !die.placed);
  if (!availableCells.length || !unplacedDice.length) {
    throw new Error(`no public-memory legal placement candidate: cells=${availableCells.length}, dice=${unplacedDice.length}`);
  }

  const placedByRoom = new Map();
  for (const roomId of memory.placedRoomIds) placedByRoom.set(roomId, (placedByRoom.get(roomId) ?? 0) + 1);
  const researchAlreadyPlanned = memory.placedRoomIds.some((roomId) => roomType(memory.rooms.get(roomId), roomId) === "research");
  const energyAlreadyPlanned = memory.placedRoomIds.some((roomId) => roomType(memory.rooms.get(roomId), roomId) === "energy");
  const energy = view.observation?.energy ?? 0;

  function roomViable(cell) {
    const room = memory.rooms.get(cell.roomId);
    const fullCells = room?.cellIds?.map((id) => memory.cells.get(id)).filter(Boolean) ?? [cell];
    if (room?.cellIds?.length && fullCells.length !== room.cellIds.length) return false;
    const placed = placedByRoom.get(cell.roomId) ?? 0;
    const missing = fullCells.filter((candidate) => !memory.usedCells.has(candidate.id));
    if (placed > 0 && missing.length === 0) return false;
    if (missing.length > unplacedDice.length) return false;
    return missing.every((candidate) => candidate.unlockIndex <= excavator
      && !robots.has(candidate.id)
      && (!memory.usedColumns.has(candidate.column) || memory.usedCells.has(candidate.id)));
  }

  function score(cell) {
    const room = memory.rooms.get(cell.roomId);
    const type = roomType(room, cell.roomId);
    const partial = (placedByRoom.get(cell.roomId) ?? 0) > 0;
    if (!roomViable(cell) && ["energy", "research", "fighter"].includes(type)) return -1000;
    let value = 0;
    if (partial) value += 300;
    if (type === "research" && !researchAlreadyPlanned) value += 240;
    if (type === "energy" && (!energyAlreadyPlanned || partial)) value += energy <= 4 ? 220 : 150;
    if (type === "fighter") value += 120;
    if (type === "tunnel") value += 100;
    if (type === "aa") value += 20;
    if (type === "research" && (room?.energyCost ?? 0) > energy && !energyAlreadyPlanned) value -= 180;
    value += cell.row * 2;
    value += cell.column / 10;
    return value;
  }

  const cell = [...availableCells].sort((left, right) => score(right) - score(left)
    || right.column - left.column || left.id.localeCompare(right.id))[0];
  if (score(cell) < -500) {
    const fallback = availableCells.sort((left, right) => left.id.localeCompare(right.id))[0];
    if (!fallback) throw new Error("no fallback placement cell");
    return buildPlacement(view, memory, fallback, unplacedDice);
  }
  return buildPlacement(view, memory, cell, unplacedDice);
}

function buildPlacement(view, memory, cell, dice) {
  const die = [...dice].sort((left, right) => {
    if (left.color === "white" && right.color !== "white") return 1;
    if (right.color === "white" && left.color !== "white") return -1;
    return right.value - left.value || left.id.localeCompare(right.id);
  })[0];
  const room = memory.rooms.get(cell.roomId);
  const type = roomType(room, cell.roomId);
  const fullSize = room?.cellIds?.length ?? 1;
  const already = memory.placedRoomIds.filter((roomId) => roomId === cell.roomId).length;
  const incompleteNote = fullSize > 1 && already + 1 < fullSize
    ? `这是${fullSize}格房的第${already + 1}格，不预测立即收益`
    : `该提交完成当前计划占格，房间收益仍待房间阶段`;
  return {
    payload: {
      type: "place_die",
      dieId: die.id,
      cellId: cell.id,
      predictions: [{
        because: `${sourceLabel(memory)}：提交骰子后应占据所选${type}格；${incompleteNote}。`,
        expectations: [{ itemId: `die:${die.id}`, field: "placed", change: "equals", value: true }],
      }],
    },
    decision: `宏观需要能源循环、研究进度与母舰期限平衡；公开工作记忆候选中选择${die.id}=${die.value}到${cell.id}/${cell.roomId}，${incompleteNote}；${sourceLabel(memory)}。`,
  };
}

function researchChoice(view, memory) {
  const contract = contractFor(view, "choose_research_advance");
  const roomId = enumValues(contract, "roomId")[0];
  const maximum = contract.fields.advanceSteps.maximum;
  const change = maximum > 0 ? "increase" : "unchanged";
  return {
    payload: {
      type: "choose_research_advance",
      roomId,
      advanceSteps: maximum,
      predictions: [{
        because: `${sourceLabel(memory)}：公开预算合同允许0..${maximum}步，取最大合法推进。`,
        expectations: [{ itemId: "track:researchIndex", field: "researchIndex", change }],
      }],
    },
    decision: `公开研究预算${view.pending?.budget ?? "?"}、最大${maximum}步；选择最大合法值${maximum}，预期研究${change === "increase" ? "上升" : "保持"}；${sourceLabel(memory)}。`,
  };
}

function spawnChoice(view, memory) {
  const contract = contractFor(view, "choose_spawn");
  const shipId = enumValues(contract, "shipId")[0];
  const candidates = enumValues(contract, "dropPointId").sort();
  const dropPointId = candidates[0];
  return {
    payload: {
      type: "choose_spawn",
      shipId,
      dropPointId,
      predictions: [{
        because: `${sourceLabel(memory)}：从公开候选按冻结字典序选择生成点，生成本身不应改变能源。`,
        expectations: [{ itemId: "track:energy", field: "energy", change: "unchanged" }],
      }],
    },
    decision: `公开${shipId}生成候选为${candidates.join("/")}；按冻结顺序选${dropPointId}，不使用私有天空oracle，预期能源不变；${sourceLabel(memory)}。`,
  };
}

function roomChoice(view, memory) {
  const energy = view.observation?.energy ?? 0;
  const research = view.observation?.researchIndex ?? 0;
  const candidates = [...(view.pending?.candidates?.resolvableRoomIds ?? [])];
  const contract = contractFor(view, "resolve_room");
  const contractRooms = new Set(enumValues(contract, "roomId"));

  function candidateScore(roomId) {
    const type = roomType(memory.rooms.get(roomId), roomId);
    if (type === "energy") return 500;
    if (type === "research") return 400;
    if (type === "fighter") return 300;
    if (type === "tunnel") return 200;
    return 100;
  }

  for (const roomId of candidates.sort((left, right) => candidateScore(right) - candidateScore(left)
    || left.localeCompare(right))) {
    if (!contractRooms.has(roomId)) continue;
    const room = memory.rooms.get(roomId);
    const type = roomType(room, roomId);
    const cost = room?.energyCost ?? 0;
    const preservesFloor = type === "energy" || type === "tunnel" || energy - cost >= 1 || research >= 13;
    if (!preservesFloor) continue;
    const change = type === "energy" ? "increase" : cost > 0 ? "decrease" : "unchanged";
    return {
      payload: {
        type: "resolve_room",
        roomId,
        pay: true,
        predictions: [{
          because: `${sourceLabel(memory)}：${roomId}公开可结算，类型${type}、成本${cost}，并遵守至少1能源安全线。`,
          expectations: [{ itemId: "track:energy", field: "energy", change }],
        }],
      },
      decision: `当前能源${energy}；优先级为能源>研究>战斗机>通道，选公开可结算${roomId}(${type},成本${cost})，预计能源${change}；${sourceLabel(memory)}。`,
    };
  }

  const excavationContract = contractFor(view, "excavate");
  const excavationIds = enumValues(excavationContract, "placementId");
  if (excavationIds.length && energy > 1) {
    const placementId = [...excavationIds].sort().at(-1);
    return {
      payload: {
        type: "excavate",
        placementId,
        predictions: [{
          because: `${sourceLabel(memory)}：公开候选可支付且能源${energy}>1，选择确定性最深/末序候选并保留安全线。`,
          expectations: [{ itemId: "track:excavatorIndex", field: "excavatorIndex", change: "increase" }],
        }],
      },
      decision: `公开挖掘候选${excavationIds.join("/")}且能源${energy}>1；选${placementId}，预期挖掘机推进并避免零能源陷阱；${sourceLabel(memory)}。`,
    };
  }

  const skipContract = contractFor(view, "skip_worker");
  const skipIds = enumValues(skipContract, "placementId").sort();
  if (skipIds.length) {
    const placementId = skipIds[0];
    return {
      payload: {
        type: "skip_worker",
        placementId,
        predictions: [{
          because: `${sourceLabel(memory)}：没有符合能源安全线的生产/挖掘，跳过该工人应保持能源。`,
          expectations: [{ itemId: "track:energy", field: "energy", change: "unchanged" }],
        }],
      },
      decision: `当前能源${energy}，公开剩余工人${skipIds.join("/")}没有符合安全线的收益；跳过${placementId}，预期能源不变；${sourceLabel(memory)}。`,
    };
  }

  if (view.availableOperations.includes("end_rooms")) {
    return {
      payload: {
        type: "end_rooms",
        predictions: [{
          because: `${sourceLabel(memory)}：无生产候选后结束房间阶段，母舰应向骷髅线推进。`,
          expectations: [{ itemId: "track:mothershipRow", field: "mothershipRow", change: "increase" }],
        }],
      },
      decision: `房间/工人候选已耗尽；结束房间阶段，把当前母舰行${view.observation?.mothershipRow ?? "?"}作为正式期限，预期其上升；${sourceLabel(memory)}。`,
    };
  }
  throw new Error(`unsupported room boundary: ${view.availableOperations.join(",")}`);
}

function choose(view, memory) {
  if (view.availableOperations.includes("place_die")) return placementChoice(view, memory);
  if (view.availableOperations.includes("choose_research_advance")) return researchChoice(view, memory);
  if (view.availableOperations.includes("choose_spawn")) return spawnChoice(view, memory);
  if (["resolve_room", "excavate", "skip_worker", "end_rooms"]
    .some((operation) => view.availableOperations.includes(operation))) return roomChoice(view, memory);
  throw new Error(`no controller for operations: ${view.availableOperations?.join(",")}`);
}

function plannedChoice(paths) {
  const result = spawnSync(process.execPath, [paths.cli, "plan", paths.stateDir], {
    cwd: paths.root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.status !== 0) {
    throw new Error(`pre-choice planning failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  const plan = JSON.parse(result.stdout);
  if (plan.status !== "planned" || !plan.recommendedPayload?.type) {
    throw new Error(`pre-choice planner returned no recommendation: ${result.stdout}`);
  }
  const winner = plan.ranking[0];
  const recalled = winner.feedbackAdjustment
    ? `；个人GTE反馈${winner.feedbackAdjustment.trajectoryId}以activation ${winner.feedbackAdjustment.activation}修正了该候选`
    : "；本候选没有可用的已审计个人反馈修正";
  return {
    payload: plan.recommendedPayload,
    decision: `选择前试演${plan.attemptedCount}个可见候选，认知规则接受${plan.legalCandidateCount}个；按下一稳定边界效用选择${JSON.stringify(winner.payload)}，分数${winner.finalScore}${recalled}。`,
    plan,
  };
}

function run(game) {
  const paths = pathsFor(game);
  let records = readRecords(paths.ledger);
  if (!records.length) {
    recordStep({
      game,
      sequence: "0001",
      command: "player-start",
      decision: `从连续链revision ${game}启动第${game + 1}个个人episode；先读取公开初始视图，不读取正式host。`,
    });
    records = readRecords(paths.ledger);
  }
  while (records.length < MAX_RECORDS_PER_GAME) {
    const view = readJson(path.join(paths.stateDir, "current-player-view.json"));
    if (view.status === "complete") return view;
    const sequence = String(records.length + 1).padStart(4, "0");
    if (view.status === "random") {
      recordStep({
        game,
        sequence,
        command: "random",
        decision: `公开${view.pending?.type}随机边界；只提交按tape seed、pending type与本游戏出现次数预提交的观察，不挑值、不重跑。`,
      });
    } else if (["choice", "rejected"].includes(view.status)) {
      const action = plannedChoice(paths);
      const recovery = view.status === "rejected"
        ? `上一提交被正式层原子拒绝(${view.reason})；保留同一局并换用公开合法候选。`
        : "";
      recordStep({
        game,
        sequence,
        command: "advance",
        decision: `${recovery}${action.decision}`,
        payload: action.payload,
      });
    } else {
      throw new Error(`ordinary boundary has unsupported status ${view.status}`);
    }
    records = readRecords(paths.ledger);
  }
  throw new Error(`game ${game} exceeded ${MAX_RECORDS_PER_GAME} public records without terminal outcome`);
}

if (require.main === module) {
  const gameRaw = process.argv[2];
  if (!/^[1-5]$/u.test(gameRaw ?? "")) throw new Error("Usage: node autoplay-game.js <game 1..5>");
  const terminal = run(Number(gameRaw));
  process.stdout.write(`${JSON.stringify({
    game: Number(gameRaw),
    status: terminal.status,
    outcome: terminal.observation?.outcome,
    round: terminal.game?.round,
    completedRoundCount: terminal.game?.completedRoundCount,
    actionCount: terminal.actionCount,
  }, null, 2)}\n`);
}

module.exports = { choose, collectMemory, plannedChoice, run };
