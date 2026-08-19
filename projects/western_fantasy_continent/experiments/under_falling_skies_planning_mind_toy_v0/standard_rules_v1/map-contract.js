"use strict";

const ROOM_TYPES = new Set(["aa", "tunnel", "energy", "fighter", "research", "robot"]);
const SKY_EFFECT_TYPES = new Set(["arrow", "mothership_down"]);
const MOTHERSHIP_ACTION_TYPES = new Set(["excavator_back", "research_back", "spawn_white", "damage"]);

function validateMap(map) {
  const errors = [];
  if (!map || map.schema !== "ufs_standard_map_v1") errors.push("schema 必须是 ufs_standard_map_v1");
  if (map?.columns !== 5) errors.push("正式地图必须有 5 列");
  if (!map?.city?.id) errors.push("缺少 city.id");
  requirePositive(errors, map?.city?.maxDamage, "city.maxDamage");
  requirePositive(errors, map?.city?.maxEnergy, "city.maxEnergy");
  requireInteger(errors, map?.city?.startEnergy, "city.startEnergy", 0);
  requireInteger(errors, map?.city?.robotLimit, "city.robotLimit", 0);

  const costs = map?.research?.costs;
  if (!Array.isArray(costs) || costs.length < 2 || costs.some((value) => !Number.isInteger(value) || value <= 0)) {
    errors.push("research.costs 必须是至少两个正整数；每项代表前进到下一格的成本");
  }

  const skyRows = map?.sky?.rows;
  if (!Array.isArray(skyRows) || skyRows.length < 3) errors.push("sky.rows 至少需要 3 行");
  requireInteger(errors, map?.sky?.dropRow, "sky.dropRow", 0);
  requirePositive(errors, map?.sky?.cityRow, "sky.cityRow");
  requirePositive(errors, map?.sky?.skullRow, "sky.skullRow");
  if (Array.isArray(skyRows)) {
    const rowIds = new Set();
    for (const row of skyRows) {
      if (!Number.isInteger(row.index)) errors.push("每个 sky row 需要整数 index");
      if (rowIds.has(row.index)) errors.push(`sky row index 重复: ${row.index}`);
      rowIds.add(row.index);
      if (!Array.isArray(row.cells) || row.cells.length !== 5) {
        errors.push(`sky row ${row.index} 必须正好有 5 个 cells`);
        continue;
      }
      row.cells.forEach((cell, column) => validateSkyCell(errors, cell, row.index, column));
      for (const action of row.mothershipActions || []) {
        if (!MOTHERSHIP_ACTION_TYPES.has(action.type)) errors.push(`未知母舰动作: ${action.type}`);
        requirePositive(errors, action.amount, `row ${row.index} action.amount`);
      }
    }
  }

  const cells = map?.base?.cells;
  const rooms = map?.base?.rooms;
  if (!Array.isArray(cells) || cells.length < 5) errors.push("base.cells 不完整");
  if (!Array.isArray(rooms) || rooms.length < 1) errors.push("base.rooms 不完整");
  const cellById = new Map();
  for (const cell of cells || []) {
    if (!cell.id) errors.push("base cell 缺少 id");
    if (cellById.has(cell.id)) errors.push(`base cell id 重复: ${cell.id}`);
    cellById.set(cell.id, cell);
    requireInteger(errors, cell.column, `${cell.id}.column`, 0);
    if (cell.column >= 5) errors.push(`${cell.id}.column 超出 0-4`);
    requireInteger(errors, cell.unlockIndex, `${cell.id}.unlockIndex`, 0);
    if (!cell.roomId) errors.push(`${cell.id} 缺少 roomId`);
  }
  const seenRoomCells = new Set();
  for (const room of rooms || []) {
    if (!room.id) errors.push("room 缺少 id");
    if (!ROOM_TYPES.has(room.type)) errors.push(`未知房间类型: ${room.type}`);
    if (!Array.isArray(room.cellIds) || room.cellIds.length < 1) errors.push(`${room.id}.cellIds 为空`);
    requireInteger(errors, room.modifier, `${room.id}.modifier`);
    requireInteger(errors, room.energyCost, `${room.id}.energyCost`, 0);
    for (const cellId of room.cellIds || []) {
      if (!cellById.has(cellId)) errors.push(`${room.id} 引用了不存在的 cell ${cellId}`);
      if (seenRoomCells.has(cellId)) errors.push(`cell ${cellId} 被多个房间引用`);
      seenRoomCells.add(cellId);
      if (cellById.get(cellId)?.roomId !== room.id) errors.push(`${cellId}.roomId 与 ${room.id} 不一致`);
    }
  }
  for (const cell of cells || []) if (!seenRoomCells.has(cell.id)) errors.push(`cell ${cell.id} 未被 room 引用`);

  const path = map?.base?.excavatorPath;
  if (!Array.isArray(path) || path.length < 1) errors.push("base.excavatorPath 为空");
  for (const cellId of path || []) if (!cellById.has(cellId)) errors.push(`挖掘路径引用不存在的 cell ${cellId}`);
  requireInteger(errors, map?.base?.startExcavatorIndex, "base.startExcavatorIndex", 0);
  if (Array.isArray(path) && map.base.startExcavatorIndex >= path.length) errors.push("startExcavatorIndex 超出路径");

  if (errors.length) {
    const error = new Error(`地图合同无效 (${errors.length}):\n- ${errors.join("\n- ")}`);
    error.details = errors;
    throw error;
  }
  return true;
}

function validateSkyCell(errors, cell, row, column) {
  if (cell.explosion != null) requirePositive(errors, cell.explosion, `sky[${row}][${column}].explosion`);
  if (!cell.effect) return;
  if (!SKY_EFFECT_TYPES.has(cell.effect.type)) errors.push(`未知天空效果: ${cell.effect.type}`);
  if (cell.effect.type === "arrow") {
    requireInteger(errors, cell.effect.targetRow, `arrow targetRow`, 0);
    requireInteger(errors, cell.effect.targetColumn, `arrow targetColumn`, 0);
    if (cell.effect.targetColumn >= 5) errors.push("arrow targetColumn 超出 0-4");
  }
  if (cell.effect.type === "mothership_down") requirePositive(errors, cell.effect.amount || 1, "mothership_down.amount");
}

function indexMap(map) {
  validateMap(map);
  return {
    cellById: new Map(map.base.cells.map((cell) => [cell.id, cell])),
    roomById: new Map(map.base.rooms.map((room) => [room.id, room])),
    skyRowByIndex: new Map(map.sky.rows.map((row) => [row.index, row])),
  };
}

function requirePositive(errors, value, path) {
  if (!Number.isInteger(value) || value <= 0) errors.push(`${path} 必须是正整数`);
}

function requireInteger(errors, value, path, minimum = null) {
  if (!Number.isInteger(value) || (minimum != null && value < minimum)) errors.push(`${path} 必须是整数${minimum == null ? "" : `且不小于 ${minimum}`}`);
}

module.exports = { indexMap, validateMap };

