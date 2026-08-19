"use strict";

(function expose(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.UFSSkyCityModel = api;
}(typeof globalThis === "object" ? globalThis : this, () => {
  const TILE_COUNT = 4;
  const COLUMNS = 5;
  const CELL_TYPES = new Set(["empty", "explosion", "arrow_left", "arrow_right", "mothership_down"]);
  const ACTION_TYPES = ["excavator_back", "research_back", "spawn_white", "damage"];

  function createCell() {
    return { type: "empty", amount: null };
  }

  function createRow(tileId, localRow) {
    return {
      id: `${tileId}-r${localRow + 1}`,
      localRow,
      cells: Array.from({ length: COLUMNS }, createCell),
      rail: {
        skull: false,
        actions: Object.fromEntries(ACTION_TYPES.map((type) => [type, null])),
      },
    };
  }

  function createTile(index, rowCount = 4) {
    const id = `sky-${index + 1}`;
    return {
      id,
      label: `天空板 ${index + 1}`,
      side: "easy",
      rows: Array.from({ length: rowCount }, (_, row) => createRow(id, row)),
    };
  }

  function createState() {
    const tiles = Array.from({ length: TILE_COUNT }, (_, index) => createTile(index));
    return {
      activeTileId: tiles[0].id,
      selectedCell: null,
      selectedRail: null,
      baseEntry: null,
      tileOrder: tiles.map((tile) => tile.id),
      tiles,
      city: {
        id: "roswell",
        label: "Roswell",
        maxDamage: null,
        startEnergy: null,
        maxEnergy: null,
        robotLimit: 2,
        firstRoll: null,
      },
      research: {
        costsText: "",
        finalRequiresMultiSpace: true,
      },
    };
  }

  function renumberTileRows(tile) {
    tile.rows.forEach((row, index) => {
      row.localRow = index;
      row.id = `${tile.id}-r${index + 1}`;
    });
  }

  function addTileRow(state, tileId) {
    const tile = findTile(state, tileId);
    tile.rows.push(createRow(tile.id, tile.rows.length));
    return tile.rows.at(-1);
  }

  function removeTileRow(state, tileId) {
    const tile = findTile(state, tileId);
    if (tile.rows.length <= 1) throw new Error("每块天空板至少保留一行");
    const removed = tile.rows.pop();
    renumberTileRows(tile);
    return removed;
  }

  function findTile(state, tileId) {
    const tile = state.tiles.find((candidate) => candidate.id === tileId);
    if (!tile) throw new Error(`找不到天空板 ${tileId}`);
    return tile;
  }

  function parseResearchCosts(text) {
    if (!String(text || "").trim()) return [];
    return String(text)
      .split(/[，,、\s]+/)
      .filter(Boolean)
      .map((value) => Number(value));
  }

  function nullableInteger(value) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isInteger(number) ? number : null;
  }

  function engineCell(cell, globalRow, column) {
    if (!cell || cell.type === "empty") return {};
    if (cell.type === "explosion") return { explosion: nullableInteger(cell.amount) };
    if (cell.type === "mothership_down") {
      return { effect: { type: "mothership_down", amount: nullableInteger(cell.amount) || 1 } };
    }
    if (cell.type === "arrow_left" || cell.type === "arrow_right") {
      const delta = cell.type === "arrow_left" ? -1 : 1;
      return { effect: { type: "arrow", targetRow: globalRow, targetColumn: column + delta } };
    }
    return {};
  }

  function rowActions(row) {
    return ACTION_TYPES
      .map((type) => ({ type, amount: nullableInteger(row.rail?.actions?.[type]) }))
      .filter((action) => action.amount != null && action.amount > 0);
  }

  function orderedTiles(state) {
    return state.tileOrder.map((tileId) => findTile(state, tileId));
  }

  function assembleRows(state) {
    const rows = [];
    const source = [];
    let globalRow = 0;
    orderedTiles(state).forEach((tile, tileOrder) => {
      tile.rows.forEach((row) => {
        rows.push({
          index: globalRow,
          cells: row.cells.map((cell, column) => engineCell(cell, globalRow, column)),
          mothershipActions: rowActions(row),
        });
        source.push({ tileId: tile.id, tileOrder, localRow: row.localRow, globalRow, skull: Boolean(row.rail?.skull) });
        globalRow += 1;
      });
    });
    return { rows, source };
  }

  function buildExport(state) {
    const { rows, source } = assembleRows(state);
    const skullRows = source.filter((row) => row.skull).map((row) => row.globalRow);
    const researchCosts = parseResearchCosts(state.research.costsText);
    return {
      schema: "ufs_sky_city_entry_v1",
      editor: {
        tileOrder: [...state.tileOrder],
        savedAt: new Date().toISOString(),
      },
      city: {
        id: String(state.city.id || "").trim(),
        label: String(state.city.label || "").trim(),
        maxDamage: nullableInteger(state.city.maxDamage),
        startEnergy: nullableInteger(state.city.startEnergy),
        maxEnergy: nullableInteger(state.city.maxEnergy),
        robotLimit: nullableInteger(state.city.robotLimit),
        firstRoll: nullableInteger(state.city.firstRoll),
      },
      research: {
        costs: researchCosts,
        finalRequiresMultiSpace: Boolean(state.research.finalRequiresMultiSpace),
      },
      sky: {
        dropRow: 0,
        cityRow: rows.length,
        skullRow: skullRows.length === 1 ? skullRows[0] : null,
        rows,
      },
      sourceTiles: state.tiles,
      baseEntry: state.baseEntry,
    };
  }

  function validateState(state) {
    const errors = [];
    const warnings = [];
    if (!Array.isArray(state.tiles) || state.tiles.length !== TILE_COUNT) errors.push("必须正好有 4 块天空板。");
    if (new Set(state.tileOrder).size !== TILE_COUNT) errors.push("四块天空板的上下顺序存在重复或遗漏。");

    let filledCells = 0;
    let skullCount = 0;
    for (const tile of state.tiles || []) {
      if (tile.rows?.length !== 4) errors.push(`${tile.label || tile.id} 必须正好有 4 行。`);
      tile.rows?.forEach((row, rowIndex) => {
        if (!Array.isArray(row.cells) || row.cells.length !== COLUMNS) {
          errors.push(`${tile.label || tile.id} 第 ${rowIndex + 1} 行必须正好有 5 格。`);
          return;
        }
        if (row.rail?.skull) skullCount += 1;
        row.cells.forEach((cell, column) => {
          if (!CELL_TYPES.has(cell.type)) errors.push(`${tile.label} 第 ${rowIndex + 1} 行第 ${column + 1} 格类型未知。`);
          if (cell.type !== "empty") filledCells += 1;
          if ((cell.type === "explosion" || cell.type === "mothership_down")
            && (!Number.isInteger(Number(cell.amount)) || Number(cell.amount) <= 0)) {
            errors.push(`${tile.label} 第 ${rowIndex + 1} 行第 ${column + 1} 格需要正整数。`);
          }
          if (cell.type === "arrow_left" && column === 0) errors.push(`${tile.label} 第 ${rowIndex + 1} 行最左格不能继续向左。`);
          if (cell.type === "arrow_right" && column === COLUMNS - 1) errors.push(`${tile.label} 第 ${rowIndex + 1} 行最右格不能继续向右。`);
        });
        for (const type of ACTION_TYPES) {
          const amount = row.rail?.actions?.[type];
          if (amount != null && amount !== "" && (!Number.isInteger(Number(amount)) || Number(amount) <= 0)) {
            errors.push(`${tile.label} 第 ${rowIndex + 1} 行的侧轨效果 ${type} 需要正整数。`);
          }
        }
      });
    }
    if (!filledCells) warnings.push("天空格尚未录入。");
    if (skullCount === 0) warnings.push("尚未标记母舰到达后立即失败的骷髅行。");
    if (skullCount > 1) errors.push("只能有一行标记为母舰骷髅失败行。");

    const city = state.city || {};
    if (!String(city.id || "").trim()) errors.push("城市编号不能为空。");
    if (!String(city.label || "").trim()) warnings.push("城市名称尚未填写。");
    for (const [field, label, allowZero] of [
      ["maxDamage", "最大伤害／生命轨道", false],
      ["startEnergy", "初始能源", true],
      ["maxEnergy", "能源上限", false],
      ["robotLimit", "机器人上限", true],
    ]) {
      const value = nullableInteger(city[field]);
      if (value == null) warnings.push(`${label}尚未填写。`);
      else if (value < (allowZero ? 0 : 1)) errors.push(`${label}数值无效。`);
    }
    const costs = parseResearchCosts(state.research?.costsText);
    if (!costs.length) warnings.push("研究轨道费用尚未填写。");
    else if (costs.some((value) => !Number.isInteger(value) || value <= 0)) errors.push("研究轨道费用必须全部为正整数。");
    return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], result: buildExport(state) };
  }

  function restoreState(payload) {
    if (payload?.schema !== "ufs_sky_city_entry_v1" || !Array.isArray(payload.sourceTiles)) {
      throw new Error("不是天空＋城市录入器导出的文件");
    }
    const state = createState();
    state.tiles = payload.sourceTiles;
    state.tileOrder = payload.editor?.tileOrder || state.tiles.map((tile) => tile.id);
    state.activeTileId = state.tileOrder[0];
    state.baseEntry = payload.baseEntry || null;
    Object.assign(state.city, payload.city || {});
    state.research.costsText = Array.isArray(payload.research?.costs) ? payload.research.costs.join(", ") : "";
    state.research.finalRequiresMultiSpace = payload.research?.finalRequiresMultiSpace !== false;
    state.tiles.forEach((tile) => {
      // Early editor builds incorrectly defaulted to 3 rows. Preserve entered
      // data and append the missing physical fourth row when those saves load.
      while (tile.rows.length < 4) tile.rows.push(createRow(tile.id, tile.rows.length));
      renumberTileRows(tile);
    });
    return state;
  }

  return {
    ACTION_TYPES,
    CELL_TYPES,
    COLUMNS,
    TILE_COUNT,
    addTileRow,
    assembleRows,
    buildExport,
    createState,
    findTile,
    parseResearchCosts,
    removeTileRow,
    restoreState,
    validateState,
  };
}));
