"use strict";

function clone(value) {
  return structuredClone(value);
}

function safePublicInput(publicState, publicMap) {
  const observation = Object.fromEntries([
    "round", "phase", "energy", "damage", "researchIndex", "excavatorIndex",
    "mothershipRow", "outcome", "dice", "ships", "waitingShips", "placements", "robots",
    "uncertainties",
  ].map((key) => [key, clone(publicState[key] ?? null)]));
  for (const collection of ["dice", "ships", "waitingShips", "placements", "robots"]) {
    if (!Array.isArray(observation[collection])) observation[collection] = [];
  }
  return {
    observation,
    publicMap: {
      id: publicMap.id,
      columns: publicMap.columns,
      city: clone(publicMap.city),
      research: clone(publicMap.research),
      base: clone(publicMap.base),
      sky: clone(publicMap.sky),
    },
  };
}

function placementContext(publicState, publicMap, selectedAction) {
  const cell = publicMap.base.cells.find((row) => row.id === selectedAction.cellId);
  if (!cell) throw new Error(`full attention cannot find placement cell: ${selectedAction.cellId}`);
  const shipRows = publicState.ships
    .filter((ship) => ship.column === cell.column)
    .map((ship) => ship.row);
  return {
    phase: "dice",
    action: "place_die",
    goal: "imagine_selected_worker_placement",
    tags: ["imagination"],
    focus: {
      die_id: selectedAction.dieId,
      die_value: selectedAction.dieValue,
      cell_id: selectedAction.cellId,
      room_id: cell.roomId,
      column: cell.column,
      ship_rows: shipRows,
    },
  };
}

function eventContext(event, scope, fullWorld, publicMap) {
  const focus = { focus_item_ids: [], secondary_item_ids: [], focus_kinds: [], focus_tags: [] };
  let action = scope.stage || event.type;
  if (scope.phase === "dice" && scope.stage === "white_reroll") {
    action = "white_reroll";
    focus.focus_item_ids.push(`die:${scope.dieId}`);
    focus.secondary_item_ids.push(...fullWorld.dice.filter((die) => !die.placed).map((die) => `die:${die.id}`));
  } else if (scope.phase === "rooms") {
    action = scope.stage === "payment" ? "resolve_room_payment" : `resolve_${scope.roomType || "room"}`;
    if (scope.roomId) focus.focus_item_ids.push(`room:${scope.roomId}`);
    const room = publicMap.base.rooms.find((row) => row.id === scope.roomId);
    if (room) {
      focus.secondary_item_ids.push(...room.cellIds.map((id) => `base_cell:${id}`));
      focus.secondary_item_ids.push(...fullWorld.placements
        .filter((row) => row.roomId === room.id && !row.resolved)
        .map((row) => `placement:${row.id}`));
    }
    if (scope.stage === "payment" || scope.roomType === "energy" || scope.stage === "excavation") {
      focus.focus_item_ids.push("track:energy");
    }
    if (scope.roomType === "fighter") {
      focus.focus_kinds.push("ship");
      focus.focus_tags.push("explosion");
    }
    if (scope.roomType === "research") focus.focus_item_ids.push("track:researchIndex");
    if (scope.stage === "excavation") {
      focus.focus_item_ids.push("track:excavatorIndex", `placement:${scope.placementId}`);
    }
  } else if (scope.phase === "mothership") {
    action = `mothership_${scope.stage}`;
    focus.focus_item_ids.push("track:mothershipRow");
    if (scope.stage === "descent") {
      focus.focus_tags.push(`row:${fullWorld.mothershipRow + 1}`);
      focus.focus_kinds.push("ship");
    } else if (scope.stage === "threshold") {
      focus.secondary_item_ids.push("track:damage");
    } else if (scope.stage === "row_action") {
      const row = publicMap.sky.rows.find((candidate) => candidate.index === fullWorld.mothershipRow);
      row?.mothershipActions?.forEach((candidate, index) => {
        if (!scope.actionType || candidate.type === scope.actionType) {
          focus.focus_item_ids.push(`mothership_action:${row.index}:${index}`);
        }
      });
    } else if (scope.stage === "spawn") {
      focus.focus_item_ids.push(`waiting_ship:${scope.shipId}`);
      focus.focus_kinds.push("ship", "waiting_ship");
      focus.focus_tags.push(`row:${publicMap.sky.dropRow}`);
    }
  }
  return {
    phase: scope.phase,
    action,
    goal: "continue_one_round_imagination",
    tags: ["imagination"],
    focus,
  };
}

function choiceContext(fullWorld, publicMap, pending, lastAction = null) {
  const focus = { focus_item_ids: [], secondary_item_ids: [], focus_kinds: [], focus_tags: [] };
  const pendingType = pending?.type || "terminal";
  if (pendingType === "place_die") {
    const unplaced = fullWorld.dice.filter((die) => !die.placed);
    const maxDieValue = Math.max(0, ...unplaced.map((die) => die.value));
    const occupiedColumns = new Set(fullWorld.placements.map((row) => row.column));
    const availableCells = publicMap.base.cells.filter((cell) => (
      !occupiedColumns.has(cell.column)
      && cell.unlockIndex <= fullWorld.excavatorIndex + maxDieValue
    ));
    focus.focus_item_ids.push(
      ...unplaced.map((die) => `die:${die.id}`),
      "track:phase",
      "track:energy",
      "track:damage",
      "track:researchIndex",
      "track:excavatorIndex",
      "track:mothershipRow",
    );
    focus.secondary_item_ids.push(
      ...availableCells.map((cell) => `base_cell:${cell.id}`),
      ...new Set(availableCells.map((cell) => `room:${cell.roomId}`)),
    );
    focus.focus_kinds.push("ship");
    focus.focus_tags.push("explosion", "effect:mothership_down", "effect:arrow");
  } else if (pendingType === "room_action" || pendingType === "room_payment" || pendingType === "room_effect") {
    const unresolved = fullWorld.placements.filter((row) => !row.resolved);
    focus.focus_item_ids.push(
      "track:phase",
      "track:energy",
      "track:researchIndex",
      "track:excavatorIndex",
      ...unresolved.map((row) => `placement:${row.id}`),
    );
    focus.secondary_item_ids.push(
      ...unresolved.map((row) => `base_cell:${row.cellId}`),
      ...new Set(unresolved.map((row) => `room:${row.roomId}`)),
    );
    focus.focus_kinds.push("ship");
    focus.focus_tags.push("explosion");
  } else if (pendingType === "white_reroll") {
    focus.focus_item_ids.push(
      "track:phase",
      ...fullWorld.dice.filter((die) => !die.placed).map((die) => `die:${die.id}`),
    );
  } else if (pendingType === "spawn") {
    focus.focus_item_ids.push("track:mothershipRow", `waiting_ship:${pending.shipId}`);
    focus.focus_kinds.push("ship", "waiting_ship");
    focus.focus_tags.push(`row:${publicMap.sky.dropRow}`);
  } else {
    focus.focus_item_ids.push(
      "track:phase", "track:energy", "track:damage", "track:researchIndex",
      "track:excavatorIndex", "track:mothershipRow", "track:outcome",
    );
    if (["new_round", "won", "lost"].includes(fullWorld.phase)) {
      const currentRow = publicMap.sky.rows.find((row) => row.index === fullWorld.mothershipRow);
      currentRow?.mothershipActions?.forEach((_action, index) => {
        focus.focus_item_ids.push(`mothership_action:${currentRow.index}:${index}`);
      });
    }
  }
  if (lastAction?.dieId) focus.focus_item_ids.push(`die:${lastAction.dieId}`);
  if (lastAction?.cellId) focus.secondary_item_ids.push(`base_cell:${lastAction.cellId}`);
  if (lastAction?.roomId) focus.secondary_item_ids.push(`room:${lastAction.roomId}`);
  return {
    phase: fullWorld.phase,
    action: `choose:${pendingType}`,
    goal: "select_next_operation",
    tags: ["decision"],
    focus: {
      ...focus,
      focus_item_ids: [...new Set(focus.focus_item_ids)],
      secondary_item_ids: [...new Set(focus.secondary_item_ids)],
      focus_kinds: [...new Set(focus.focus_kinds)],
      focus_tags: [...new Set(focus.focus_tags)],
    },
  };
}

function tags(...values) {
  return values.flat().filter(Boolean);
}

function buildFullItems(publicInput) {
  const { observation, publicMap } = publicInput;
  const items = [];
  const trackKinds = {
    researchIndex: "research",
    excavatorIndex: "excavator",
    mothershipRow: "mothership",
  };
  for (const key of ["round", "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow", "outcome"]) {
    items.push({ itemId: `track:${key}`, kind: trackKinds[key] || key, value: clone(observation[key]), tags: ["public_track"] });
  }
  for (const die of observation.dice) {
    const state = die.placed ? "placed" : "unplaced";
    items.push({
      itemId: `die:${die.id}`, kind: "die", value: clone(die),
      tags: tags(state, `die_color:${die.color}`, `die_value:${die.value}`),
    });
  }
  for (const ship of observation.ships) {
    items.push({
      itemId: `ship:${ship.id}`, kind: "ship", value: clone(ship),
      tags: tags(`column:${ship.column}`, `row:${ship.row}`, `ship_color:${ship.color}`),
    });
  }
  for (const ship of observation.waitingShips) {
    items.push({ itemId: `waiting_ship:${ship.id}`, kind: "waiting_ship", value: clone(ship), tags: ["waiting"] });
  }
  for (const placement of observation.placements) {
    items.push({
      itemId: `placement:${placement.id}`, kind: "placement", value: clone(placement),
      tags: tags(`cell:${placement.cellId}`, `room:${placement.roomId}`),
    });
  }
  for (const robot of observation.robots) {
    items.push({
      itemId: `robot:${robot.id}`, kind: "robot", value: clone(robot),
      tags: tags(`cell:${robot.cellId}`, robot.roomId ? `room:${robot.roomId}` : null),
    });
  }
  for (const room of publicMap.base.rooms) {
    items.push({
      itemId: `room:${room.id}`, kind: "room", value: clone(room),
      tags: tags(`room:${room.id}`, `room_type:${room.type}`),
    });
  }
  for (const cell of publicMap.base.cells) {
    items.push({
      itemId: `base_cell:${cell.id}`, kind: "base_cell", value: clone(cell),
      tags: tags(`column:${cell.column}`, `room:${cell.roomId}`, `tile:${cell.tile}`),
    });
  }
  for (const row of publicMap.sky.rows) {
    row.cells.forEach((cell, column) => {
      items.push({
        itemId: `sky_cell:${row.index}:${column}`,
        kind: "sky_cell",
        value: { row: row.index, column, ...clone(cell) },
        tags: tags(
          `column:${column}`,
          `row:${row.index}`,
          cell.effect?.type ? `effect:${cell.effect.type}` : null,
          cell.explosion != null ? "explosion" : null,
        ),
      });
    });
    (row.mothershipActions || []).forEach((action, index) => {
      items.push({
        itemId: `mothership_action:${row.index}:${index}`,
        kind: "mothership_action",
        value: { row: row.index, index, type: action.type, amount: action.amount },
        tags: tags(`row:${row.index}`, `action_type:${action.type}`),
      });
    });
  }
  if (new Set(items.map((item) => item.itemId)).size !== items.length) {
    throw new Error("full attention item ids must be unique");
  }
  return items;
}

function projectChoiceAttention({ allocation, publicInput }) {
  const itemById = new Map(buildFullItems(publicInput).map((item) => [item.itemId, item]));
  const noticedItems = allocation.noticedItemIds
    .map((itemId) => itemById.get(itemId))
    .filter(Boolean)
    .map((item) => clone(item));
  const byKind = (kind) => noticedItems.filter((item) => item.kind === kind).map((item) => clone(item.value));
  const tracks = Object.fromEntries(noticedItems
    .filter((item) => item.itemId.startsWith("track:"))
    .map((item) => [item.itemId.slice("track:".length), clone(item.value)]));
  const fieldById = new Map(allocation.field.map((row) => [row.itemId, row]));
  return {
    schema: "ufs_attention_limited_decision_observation_v0",
    observation: {
      ...tracks,
      uncertainties: clone(publicInput.observation.uncertainties || []),
      dice: byKind("die"),
      ships: byKind("ship"),
      waitingShips: byKind("waiting_ship"),
      placements: byKind("placement"),
      robots: byKind("robot"),
    },
    mapView: {
      mapId: publicInput.publicMap.id,
      columns: publicInput.publicMap.columns,
      rooms: byKind("room"),
      baseCells: byKind("base_cell"),
      skyCells: byKind("sky_cell"),
      mothershipActions: byKind("mothership_action"),
    },
    noticedItems: noticedItems.map((item) => ({
      itemId: item.itemId,
      kind: item.kind,
      value: clone(item.value),
      activation: fieldById.get(item.itemId)?.activation ?? null,
    })),
    attention: {
      mode: allocation.mode,
      spaceItemCount: allocation.spaceItemCount,
      capacity: allocation.capacity,
      noticedCount: allocation.noticedItemIds.length,
      omittedCount: allocation.omittedItemIds.length,
      carryoverAppliedItemIds: clone(allocation.carryoverAppliedItemIds),
      traceBefore: clone(allocation.traceBefore),
      traceAfter: clone(allocation.traceAfter),
    },
  };
}

function activationFor(item, context, items) {
  let activation = 0.04;
  const focus = context.focus || {};
  if (context.action === "place_die") {
    if (item.itemId === `die:${focus.die_id}`) activation += 0.91;
    else if (item.itemId === `base_cell:${focus.cell_id}`) activation += 0.91;
    else if (item.itemId === `room:${focus.room_id}`) activation += 0.66;
    else if (["base_cell", "placement", "robot"].includes(item.kind)
      && item.tags.includes(`room:${focus.room_id}`)) activation += 0.46;
    else if (item.kind === "ship" && item.tags.includes(`column:${focus.column}`)) activation += 0.81;
    else if (item.kind === "sky_cell" && item.tags.includes(`column:${focus.column}`)) {
      const shipRows = items
        .filter((row) => row.kind === "ship" && row.tags.includes(`column:${focus.column}`))
        .map((row) => row.value.row);
      const inPath = shipRows.some((row) => row < item.value.row && item.value.row <= row + focus.die_value);
      activation += inPath ? 0.58 : 0.24;
    } else if (["damage", "mothership"].includes(item.kind)) activation += 0.10;
    else if (["energy", "research", "excavator"].includes(item.kind)) activation += 0.06;
  } else {
    const primary = new Set(focus.focus_item_ids || []);
    const secondary = new Set(focus.secondary_item_ids || []);
    const kinds = new Set(focus.focus_kinds || []);
    const focusTags = new Set(focus.focus_tags || []);
    if (primary.has(item.itemId)) activation += 0.76;
    else if (secondary.has(item.itemId)) activation += 0.46;
    else if (kinds.has(item.kind)) activation += 0.34;
    else if (item.tags.some((tag) => focusTags.has(tag))) activation += 0.24;
  }
  return Math.max(0, Math.min(1, Number(activation.toFixed(6))));
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function feedbackScopeMatches(scope, context) {
  const includes = (singular, plural, value) => {
    const expected = scope?.[singular] ?? scope?.[plural];
    if (expected == null) return true;
    return (Array.isArray(expected) ? expected : [expected]).includes(value);
  };
  if (!includes("action", "actions", context.action)) return false;
  if (!includes("phase", "phases", context.phase)) return false;
  if (!includes("goal", "goals", context.goal)) return false;
  const requiredTags = scope?.tags || [];
  return requiredTags.every((tag) => (context.tags || []).includes(tag));
}

function feedbackSelectorMatches(selector, item) {
  const itemIds = selector?.itemIds ?? selector?.item_ids;
  if (itemIds && !itemIds.includes(item.itemId)) return false;
  if (selector?.kinds && !selector.kinds.includes(item.kind)) return false;
  if (selector?.tags && !selector.tags.every((tag) => item.tags.includes(tag))) return false;
  return Boolean(itemIds || selector?.kinds || selector?.tags);
}

function feedbackAdjustmentFor(item, context, adjustments) {
  const applied = adjustments.filter((row) => (
    feedbackScopeMatches(row.scope, context)
    && feedbackSelectorMatches(row.selector, item)
  ));
  const total = applied.reduce((sum, row) => (
    sum + (row.operation === "decrease" ? -row.amount : row.amount)
  ), 0);
  return {
    total: Number(total.toFixed(6)),
    adjustmentIds: applied.map((row) => row.adjustmentId),
  };
}

function allocateFullAttention({
  publicInput,
  context,
  attentionLevel,
  randomSeed,
  mode,
  carryover = {},
  learnedAttentionAdjustments = [],
}) {
  const items = buildFullItems(publicInput);
  const field = items.map((item) => {
    const baseActivation = activationFor(item, context, items);
    const carryoverActivation = Math.max(0, Number(carryover[item.itemId] || 0));
    const learned = feedbackAdjustmentFor(item, context, learnedAttentionAdjustments);
    return {
      itemId: item.itemId,
      kind: item.kind,
      baseActivation,
      carryoverActivation: Number(carryoverActivation.toFixed(6)),
      learnedAttentionAdjustment: learned.total,
      learnedAttentionAdjustmentIds: learned.adjustmentIds,
      activation: Number(Math.max(0, Math.min(
        1,
        baseActivation + carryoverActivation + learned.total,
      )).toFixed(6)),
    };
  });
  const capacity = mode === "all"
    ? field.length
    : Math.round(6 + attentionLevel * (50 - 6));
  let noticed;
  if (mode === "all") {
    noticed = field;
  } else {
    const random = seededRandom(randomSeed);
    noticed = field.map((row) => ({
      row,
      key: -Math.log(Math.max(1e-12, random())) / Math.max(1e-9, row.activation ** 2),
    })).sort((left, right) => left.key - right.key)
      .slice(0, Math.min(capacity, field.length))
      .map((entry) => entry.row);
  }
  const noticedIds = new Set(noticed.map((row) => row.itemId));
  return {
    schema: "ufs_full_attention_allocation_v0",
    mode,
    spaceItemCount: field.length,
    capacity,
    carryoverAppliedItemIds: field
      .filter((row) => row.carryoverActivation > 0)
      .map((row) => row.itemId)
      .sort(),
    noticedItemIds: [...noticedIds].sort(),
    omittedItemIds: field.filter((row) => !noticedIds.has(row.itemId)).map((row) => row.itemId).sort(),
    field: field.map((row) => ({ ...row, noticed: noticedIds.has(row.itemId) })),
  };
}

function has(allocation, itemId) {
  return allocation.noticedItemIds.includes(itemId);
}

function roomNoticed(allocation, scope) {
  return scope.roomId ? has(allocation, `room:${scope.roomId}`) : true;
}

function projectEventAttention({ allocation, event, observedState, scope, fullWorld, publicMap }) {
  const state = clone(observedState);
  const paths = [];
  const expose = (...rows) => paths.push(...rows);
  if (event.type === "die_placed") {
    state.dice = state.dice.filter((die) => has(allocation, `die:${die.id}`));
    expose("dice.ids");
    for (const die of state.dice) expose(`dice:${die.id}.placed`);
  } else if (event.type === "room_resolution" && event.stage === "payment") {
    if (roomNoticed(allocation, scope)) expose("room.energyCost");
    if (has(allocation, "track:energy")) expose("player.energy");
  } else if (event.type === "room_resolution" && state.room?.type === "energy") {
    if (roomNoticed(allocation, scope)) expose("room.value");
    if (has(allocation, "track:energy")) expose("player.energy", "player.energyCap");
  } else if (event.type === "room_resolution" && state.room?.type === "fighter") {
    if (roomNoticed(allocation, scope)) expose("room.value", "explosionShip.ids");
    state.explosionShips = state.explosionShips.filter((ship) => {
      const full = fullWorld.ships.find((row) => row.id === ship.id);
      return full && has(allocation, `ship:${ship.id}`)
        && has(allocation, `sky_cell:${full.row}:${full.column}`);
    });
    for (const ship of state.explosionShips) expose(`explosionShip:${ship.id}.threshold`);
  } else if (event.type === "room_resolution" && state.room?.type === "research") {
    if (roomNoticed(allocation, scope)) expose("room.value");
    if (has(allocation, "track:researchIndex")) expose("research.costsAhead");
  } else if (event.type === "excavation_selected") {
    const placement = fullWorld.placements.find((row) => row.dieId === event.dieId && !row.resolved);
    if (placement && has(allocation, `placement:${placement.id}`)) expose("event.dieId");
    if (has(allocation, "track:excavatorIndex")) {
      expose("excavation.targetIndex", "excavation.pathIndicesBehind");
    }
  } else if (event.type === "phase_started") {
    if (has(allocation, "track:mothershipRow")) expose("mothership.row");
    const nextRow = fullWorld.mothershipRow + 1;
    const visibleIds = (state.sky.shipsByRow[nextRow] || [])
      .filter((id) => has(allocation, `ship:${id}`));
    state.sky.shipsByRow[nextRow] = visibleIds;
    if (has(allocation, "track:mothershipRow")) expose(`sky.row:${nextRow}.shipIds`);
  } else if (event.type === "mothership_threshold_check") {
    if (has(allocation, "track:mothershipRow")) expose("mothership.onSkullRow");
  } else if (event.type === "mothership_descent_completed") {
    const row = publicMap.sky.rows.find((candidate) => candidate.index === fullWorld.mothershipRow);
    const actionIndex = row?.mothershipActions?.findIndex((candidate) => (
      candidate.type === state.mothership?.rowAction?.type
      && candidate.amount === state.mothership?.rowAction?.value
    ));
    const actionItemId = actionIndex >= 0
      ? `mothership_action:${fullWorld.mothershipRow}:${actionIndex}`
      : null;
    if (has(allocation, "track:mothershipRow") && actionItemId && has(allocation, actionItemId)) {
      expose("mothership.rowAction.type", "mothership.rowAction.value");
    }
  } else if (event.type === "spawn_started") {
    state.sky.columns = state.sky.columns.flatMap((column) => {
      const columnIndex = Number(column.id.slice(1)) - 1;
      if (!has(allocation, `sky_cell:${publicMap.sky.dropRow}:${columnIndex}`)) return [];
      return [{
        ...column,
        shipIds: column.shipIds.filter((id) => has(allocation, `ship:${id}`)),
      }];
    });
    const visibleColumns = new Set(state.sky.columns.map((column) => column.id));
    state.spawn.dropPoints = state.spawn.dropPoints.flatMap((point) => {
      const columnId = `C${Number(point.id.slice("DP-C".length))}`;
      if (!visibleColumns.has(columnId)) return [];
      const columnIndex = Number(columnId.slice(1)) - 1;
      const rows = fullWorld.ships
        .filter((ship) => ship.column === columnIndex && has(allocation, `ship:${ship.id}`))
        .map((ship) => ship.row);
      return [{
        ...point,
        distanceFromHighestShip: rows.length > 0
          ? Math.min(...rows) - publicMap.sky.dropRow
          : Number.POSITIVE_INFINITY,
      }];
    });
    expose("spawn.shipId", "sky.columnIds", "spawn.availableDropPointIds");
    for (const column of state.sky.columns) {
      expose(`sky.column:${column.id}.shipIds`, `sky.column:${column.id}.dropPointId`);
    }
    for (const point of state.spawn.dropPoints) {
      expose(`spawn.dropPoint:${point.id}.distanceFromHighestShip`);
    }
  } else {
    // Event families outside the current fixed round keep conservative access:
    // no projected path means the event runtime stops before forming Q.
  }
  return {
    noticedState: state,
    noticedPaths: [...new Set(paths)],
    attentionAudit: allocation,
  };
}

class UfsFullAttentionProvider {
  constructor({
    mode = "probabilistic",
    attentionLevel = 0.8,
    traceStrength = 0.18,
    traceDecay = 0.35,
    traceSteps = 2,
    learnedAttentionAdjustments = [],
  } = {}) {
    if (!["probabilistic", "all"].includes(mode)) throw new Error(`unknown full attention mode: ${mode}`);
    if (!(traceStrength >= 0 && traceStrength <= 1)) throw new RangeError("traceStrength must be between 0 and 1");
    if (!(traceDecay >= 0 && traceDecay <= 1)) throw new RangeError("traceDecay must be between 0 and 1");
    if (!Number.isInteger(traceSteps) || traceSteps < 0) throw new RangeError("traceSteps must be a non-negative integer");
    this.mode = mode;
    this.attentionLevel = attentionLevel;
    this.traceStrength = traceStrength;
    this.traceDecay = traceDecay;
    this.traceSteps = traceSteps;
    this.setLearnedAttentionAdjustments(learnedAttentionAdjustments);
    this.attentionTrace = new Map();
  }

  setLearnedAttentionAdjustments(adjustments) {
    if (!Array.isArray(adjustments)) throw new TypeError("learned attention adjustments must be an array");
    this.learnedAttentionAdjustments = clone(adjustments);
  }

  learnedAttentionSnapshot() {
    return clone(this.learnedAttentionAdjustments);
  }

  beginEpisode() {
    this.attentionTrace.clear();
  }

  traceSnapshot() {
    return [...this.attentionTrace.entries()]
      .map(([itemId, trace]) => ({ itemId, ...trace }))
      .sort((left, right) => left.itemId.localeCompare(right.itemId));
  }

  restoreTrace(snapshot) {
    if (!Array.isArray(snapshot)) throw new TypeError("attention trace snapshot must be an array");
    this.attentionTrace = new Map(snapshot.map((row) => {
      if (typeof row.itemId !== "string" || !Number.isFinite(row.boost)
        || !Number.isInteger(row.remainingSteps)) {
        throw new TypeError("invalid attention trace row");
      }
      return [row.itemId, { boost: row.boost, remainingSteps: row.remainingSteps }];
    }));
  }

  _carryover() {
    return Object.fromEntries([...this.attentionTrace.entries()]
      .map(([itemId, trace]) => [itemId, trace.boost]));
  }

  _commitTrace(allocation) {
    if (this.traceSteps === 0 || this.traceStrength === 0) {
      this.attentionTrace.clear();
      return;
    }
    const next = new Map();
    for (const [itemId, trace] of this.attentionTrace.entries()) {
      const remainingSteps = trace.remainingSteps - 1;
      const boost = Number((trace.boost * this.traceDecay).toFixed(6));
      if (remainingSteps > 0 && boost > 0) next.set(itemId, { boost, remainingSteps });
    }
    for (const row of allocation.field.filter((item) => item.noticed)) {
      const refreshed = Number((row.baseActivation * this.traceStrength).toFixed(6));
      const existing = next.get(row.itemId);
      if (!existing || refreshed >= existing.boost) {
        next.set(row.itemId, { boost: refreshed, remainingSteps: this.traceSteps });
      }
    }
    this.attentionTrace = next;
  }

  _allocate(publicInput, context, randomSeed) {
    const allocation = allocateFullAttention({
      publicInput,
      context,
      attentionLevel: this.attentionLevel,
      randomSeed,
      mode: this.mode,
      carryover: this._carryover(),
      learnedAttentionAdjustments: this.learnedAttentionAdjustments,
    });
    allocation.traceBefore = this.traceSnapshot();
    this._commitTrace(allocation);
    allocation.traceAfter = this.traceSnapshot();
    return allocation;
  }

  noticePlacement({ publicState, publicMap, selectedAction, randomSeed }) {
    return this._allocate(
      safePublicInput(publicState, publicMap),
      placementContext(publicState, publicMap, selectedAction),
      randomSeed,
    );
  }

  noticeEvent({ fullWorld, publicMap, event, observedState, scope, randomSeed }) {
    const allocation = this._allocate(
      safePublicInput(fullWorld, publicMap),
      eventContext(event, scope, fullWorld, publicMap),
      randomSeed,
    );
    return projectEventAttention({ allocation, event, observedState, scope, fullWorld, publicMap });
  }

  noticeChoice({ fullWorld, publicMap, pending, lastAction = null, randomSeed }) {
    const publicInput = safePublicInput(fullWorld, publicMap);
    const allocation = this._allocate(
      publicInput,
      choiceContext(fullWorld, publicMap, pending, lastAction),
      randomSeed,
    );
    return projectChoiceAttention({ allocation, publicInput });
  }
}

module.exports = {
  UfsFullAttentionProvider,
  allocateFullAttention,
  buildFullItems,
  choiceContext,
  eventContext,
  placementContext,
  projectChoiceAttention,
  projectEventAttention,
  safePublicInput,
};
