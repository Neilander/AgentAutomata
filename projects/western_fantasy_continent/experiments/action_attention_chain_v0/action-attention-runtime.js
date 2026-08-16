"use strict";

/*
 * Action-Attention Chain V0
 *
 * The runtime deliberately knows nothing about chess, cards, or UFS. It only
 * knows a graph-shaped world, attention regions, declarative selectors,
 * atomic actions, glued rules, and explicit simulation boundaries.
 */

function createWorld({ units, connections, entities }) {
  const world = {
    units: new Map(units.map((unit) => [unit.id, clone(unit)])),
    connections: connections.map(clone),
    entities: new Map(entities.map((entity) => [entity.id, clone(entity)])),
  };
  validateWorld(world);
  return world;
}

function snapshotWorld(world) {
  return {
    units: [...world.units.values()].map(clone),
    connections: world.connections.map(clone),
    entities: [...world.entities.values()].map(clone),
  };
}

function buildAttentionRegion(world, spec) {
  const seeds = arrayOf(spec.seed);
  for (const seed of seeds) requireUnit(world, seed);

  const unitIds = new Set(seeds);
  const distanceByUnit = Object.fromEntries(seeds.map((id) => [id, 0]));
  const rays = {};

  if (spec.mode === "rays") {
    if (seeds.length !== 1) throw new Error("rays attention requires one seed");
    for (const direction of spec.directions || []) {
      const path = walkRay(world, seeds[0], direction, spec.connectionKinds, spec.maxDepth);
      rays[direction] = path;
      path.forEach((id, index) => {
        unitIds.add(id);
        distanceByUnit[id] = Math.min(distanceByUnit[id] ?? Infinity, index + 1);
      });
    }
  } else if (spec.mode === "flood") {
    const frontier = seeds.map((id) => ({ id, depth: 0 }));
    const maxDepth = spec.maxDepth ?? Infinity;
    while (frontier.length) {
      const current = frontier.shift();
      if (current.depth >= maxDepth) continue;
      for (const edge of outgoing(world, current.id, spec.connectionKinds)) {
        if (unitIds.has(edge.to)) continue;
        unitIds.add(edge.to);
        distanceByUnit[edge.to] = current.depth + 1;
        frontier.push({ id: edge.to, depth: current.depth + 1 });
      }
    }
  } else if (spec.mode !== "unit") {
    throw new Error(`unsupported attention mode: ${spec.mode}`);
  }

  const ids = [...unitIds];
  const internalConnections = [];
  const externalConnections = [];
  for (const edge of world.connections) {
    const fromInside = unitIds.has(edge.from);
    const toInside = unitIds.has(edge.to);
    if (fromInside && toInside) internalConnections.push(clone(edge));
    else if (fromInside !== toInside) externalConnections.push(clone(edge));
  }

  return {
    schema: "attention_region_v0",
    seedUnitIds: seeds,
    unitIds: ids,
    units: ids.map((id) => clone(world.units.get(id))),
    internalConnections,
    externalConnections,
    distanceByUnit,
    rays,
  };
}

function selectFromRegion(world, region, query = {}) {
  if (query.mode === "nearest_per_direction") {
    const rows = [];
    for (const [direction, path] of Object.entries(region.rays)) {
      for (let index = 0; index < path.length; index += 1) {
        const unitId = path[index];
        const occupants = entitiesAt(world, unitId).filter((entity) => !entity.removed);
        if (!occupants.some((entity) => matchesEntity(world, entity, unitId, query.stopAt || { exists: true }))) {
          continue;
        }
        const kept = occupants.find((entity) => matchesEntity(world, entity, unitId, query.keep || {}));
        if (kept) rows.push(matchRow(kept, unitId, index + 1, direction));
        break;
      }
    }
    return rows;
  }

  let rows = [];
  for (const unitId of region.unitIds) {
    if (query.target === "unit") {
      const unit = world.units.get(unitId);
      if (matchesUnit(unit, query.keep || {})) {
        rows.push({ unitId, unit: clone(unit), distance: region.distanceByUnit[unitId] ?? 0, direction: null });
      }
      continue;
    }
    for (const entity of entitiesAt(world, unitId)) {
      if (!entity.removed && matchesEntity(world, entity, unitId, query.keep || {})) {
        rows.push(matchRow(entity, unitId, region.distanceByUnit[unitId] ?? 0, null));
      }
    }
  }
  if (query.mode === "first_by") {
    rows.sort((left, right) => compareValues(
      getPath(left, query.field),
      getPath(right, query.field),
      query.order === "desc" ? -1 : 1,
    ));
    return rows.slice(0, 1);
  }
  if (query.mode === "first") return rows.slice(0, 1);
  if (query.mode === "random_one") {
    if (!rows.length) return [];
    return [rows[stableIndex(query.seed ?? 1, rows.length)]];
  }
  if (query.mode == null || query.mode === "all") return rows;
  throw new Error(`unsupported selection mode: ${query.mode}`);
}

function runActionAttentionChain({
  world: inputWorld,
  rules,
  initialActions,
  initialMemory = {},
  disabledRuleIds = [],
  actionHandlers = {},
  maxActions = 100,
}) {
  const world = createWorld(snapshotWorld(inputWorld));
  const queue = initialActions.map(clone);
  const deferredQueue = [];
  const memory = clone(initialMemory);
  const trace = [];
  const skippedRules = [];
  let terminal = null;
  let actionCount = 0;

  while ((queue.length || deferredQueue.length) && !terminal) {
    if (!queue.length) queue.push(...deferredQueue.splice(0));
    if (actionCount >= maxActions) {
      terminal = { kind: "attention_budget_exhausted", reason: `maxActions=${maxActions}` };
      break;
    }
    const action = queue.shift();
    const before = snapshotWorld(world);
    const result = executeAtomicAction(world, memory, action, actionHandlers);
    actionCount += 1;
    const event = eventContext(world, memory, action, result);
    const actionTrace = {
      index: actionCount,
      action: clone(action),
      result: clone(result),
      worldChanged: JSON.stringify(before) !== JSON.stringify(snapshotWorld(world)),
      activatedRules: [],
    };
    trace.push(actionTrace);

    if (result.terminal) {
      terminal = result.terminal;
      continue;
    }

    const matchingRules = rules
      .filter((rule) => matchesCondition(event, rule.when || {}))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of matchingRules) {
      if (disabledRuleIds.includes(rule.id)) {
        skippedRules.push({ ruleId: rule.id, afterActionIndex: actionCount });
        continue;
      }

      let region = null;
      let matches = [null];
      if (rule.attention) {
        const regionSpec = resolveTemplate(rule.attention.region, event);
        region = buildAttentionRegion(world, regionSpec);
        matches = selectFromRegion(world, region, resolveTemplate(rule.attention.query || {}, event));
      }

      const generated = [];
      if (!rule.attention || matches.length || rule.runWhenEmpty) {
        const repetitions = rule.forEachMatch ? matches : [matches[0] || null];
        for (const match of repetitions) {
          const context = { ...event, match };
          for (const template of rule.then || []) generated.push(resolveTemplate(template, context));
        }
      }
      if (rule.deferUntilChainEnd) deferredQueue.push(...generated);
      else queue.push(...generated);
      actionTrace.activatedRules.push({
        ruleId: rule.id,
        attentionRegion: region,
        matches: matches.filter(Boolean).map(clone),
        generatedActions: generated.map(clone),
      });
    }
  }

  if (!terminal) {
    terminal = queue.length === 0 && deferredQueue.length === 0
      ? { kind: "chain_complete", reason: "no_glued_action_remaining" }
      : { kind: "unknown", reason: "runtime_stopped" };
  }

  return {
    schema: "action_attention_chain_run_v0",
    world: snapshotWorld(world),
    memory: clone(memory),
    trace,
    skippedRules,
    terminal,
  };
}

function executeAtomicAction(world, memory, action, actionHandlers = {}) {
  if (actionHandlers[action.type]) {
    const result = actionHandlers[action.type]({ world, memory, action });
    if (!result || typeof result !== "object") throw new Error(`action handler must return an object: ${action.type}`);
    return result;
  }
  switch (action.type) {
    case "notice":
      return { noticed: action.label || action.id };
    case "place":
    case "relocate": {
      const entity = requireEntity(world, action.entityId);
      requireUnit(world, action.targetUnitId);
      const from = entity.unitId ?? null;
      entity.unitId = action.targetUnitId;
      return { entityId: entity.id, from, to: entity.unitId };
    }
    case "remove": {
      const entity = requireEntity(world, action.entityId);
      const from = entity.unitId ?? null;
      entity.removed = true;
      entity.unitId = null;
      return { entityId: entity.id, from, removed: true };
    }
    case "compute":
      memory[action.key] = action.value;
      return { key: action.key, value: memory[action.key] };
    case "adjust": {
      if (!Number.isFinite(memory[action.key])) throw new Error(`cannot adjust non-number memory: ${action.key}`);
      const adjusted = memory[action.key] + action.delta;
      memory[action.key] = Math.max(
        action.min ?? -Infinity,
        Math.min(action.max ?? Infinity, adjusted),
      );
      return { key: action.key, value: memory[action.key], delta: action.delta };
    }
    case "move_along": {
      const entity = requireEntity(world, action.entityId);
      const distance = action.distanceFrom
        ? Number(memory[action.distanceFrom])
        : Number(action.distance);
      if (!Number.isFinite(distance)) throw new Error(`invalid move distance for ${entity.id}`);
      let current = entity.unitId;
      const path = [];
      for (let step = 0; step < distance; step += 1) {
        const next = outgoing(world, current, [action.connectionKind])
          .find((edge) => !action.direction || edge.direction === action.direction);
        if (!next) break;
        current = next.to;
        path.push(current);
      }
      const from = entity.unitId;
      entity.unitId = current;
      return { entityId: entity.id, from, to: current, requestedDistance: distance, path };
    }
    case "reveal": {
      const entity = requireEntity(world, action.entityId);
      entity.state = { ...(entity.state || {}), revealed: true };
      return { entityId: entity.id, revealed: true };
    }
    case "create": {
      if (world.entities.has(action.entity.id)) throw new Error(`duplicate entity: ${action.entity.id}`);
      requireUnit(world, action.entity.unitId);
      world.entities.set(action.entity.id, clone(action.entity));
      return { entityId: action.entity.id, created: true, to: action.entity.unitId };
    }
    case "damage": {
      const entity = requireEntity(world, action.entityId);
      const before = Number(entity.state?.hp ?? 0);
      entity.state = { ...(entity.state || {}), hp: Math.max(0, before - action.amount) };
      return { entityId: entity.id, hpBefore: before, hpAfter: entity.state.hp, amount: action.amount };
    }
    case "decision":
      return { terminal: { kind: action.owner === "other" ? "other_decision" : "self_decision", reason: action.reason } };
    case "random":
      return { terminal: { kind: "random_outcome", reason: action.reason, possibilities: clone(action.possibilities || []) } };
    case "unknown":
      return { terminal: { kind: "knowledge_gap", reason: action.reason } };
    case "outcome":
      return { terminal: { kind: "known_outcome", outcome: action.outcome, reason: action.reason } };
    default:
      throw new Error(`unsupported atomic action: ${action.type}`);
  }
}

function eventContext(world, memory, action, result) {
  const entity = action.entityId ? world.entities.get(action.entityId) : null;
  const targetUnitId = action.targetUnitId || result.to || entity?.unitId || null;
  return {
    action,
    result,
    memory,
    entity: entity || null,
    targetUnit: targetUnitId ? world.units.get(targetUnitId) : null,
    resultUnit: targetUnitId ? world.units.get(targetUnitId) : null,
  };
}

function matchesCondition(context, condition) {
  return Object.entries(condition).every(([path, expected]) => {
    const actual = getPath(context, path);
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      if (Object.hasOwn(expected, "includes")) return Array.isArray(actual) && actual.includes(expected.includes);
      if (Object.hasOwn(expected, "excludes")) return Array.isArray(actual) && !actual.includes(expected.excludes);
      if (Object.hasOwn(expected, "exists")) return expected.exists ? actual != null : actual == null;
      if (Object.hasOwn(expected, "not")) return actual !== expected.not;
    }
    return actual === expected;
  });
}

function resolveTemplate(value, context) {
  if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, context));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
      interpolate(key, context),
      resolveTemplate(item, context),
    ]));
  }
  if (typeof value !== "string") return value;
  if (/^\$[a-zA-Z]/.test(value) && !value.includes("${")) return clone(getPath(context, value.slice(1)));
  return interpolate(value, context);
}

function interpolate(value, context) {
  if (typeof value !== "string") return value;
  return value.replace(/\$\{([^}]+)\}/g, (_, path) => String(getPath(context, path)));
}

function matchesEntity(world, entity, unitId, predicate) {
  if (predicate.exists === true && !entity) return false;
  if (predicate.type && entity.type !== predicate.type) return false;
  if (predicate.faction && entity.faction !== predicate.faction) return false;
  if (predicate.id && entity.id !== predicate.id) return false;
  if (predicate.idNot && entity.id === predicate.idNot) return false;
  if (predicate.tagsAll && !predicate.tagsAll.every((tag) => (entity.tags || []).includes(tag))) return false;
  if (predicate.unitTagsAll) {
    const unit = world.units.get(unitId);
    if (!predicate.unitTagsAll.every((tag) => (unit.tags || []).includes(tag))) return false;
  }
  return true;
}

function matchesUnit(unit, predicate) {
  if (predicate.id && unit.id !== predicate.id) return false;
  if (predicate.kind && unit.kind !== predicate.kind) return false;
  if (predicate.tagsAll && !predicate.tagsAll.every((tag) => (unit.tags || []).includes(tag))) return false;
  return true;
}

function matchRow(entity, unitId, distance, direction) {
  return { entityId: entity.id, entity: clone(entity), unitId, distance, direction };
}

function walkRay(world, seed, direction, connectionKinds, maxDepth = Infinity) {
  const path = [];
  const visited = new Set([seed]);
  let current = seed;
  while (path.length < maxDepth) {
    const edge = outgoing(world, current, connectionKinds).find((item) => item.direction === direction);
    if (!edge || visited.has(edge.to)) return path;
    path.push(edge.to);
    visited.add(edge.to);
    current = edge.to;
  }
  return path;
}

function outgoing(world, from, connectionKinds) {
  return world.connections.filter((edge) => (
    edge.from === from
    && (!connectionKinds || connectionKinds.includes(edge.kind))
  ));
}

function entitiesAt(world, unitId) {
  return [...world.entities.values()].filter((entity) => entity.unitId === unitId);
}

function requireUnit(world, id) {
  const unit = world.units.get(id);
  if (!unit) throw new Error(`unknown unit: ${id}`);
  return unit;
}

function requireEntity(world, id) {
  const entity = world.entities.get(id);
  if (!entity) throw new Error(`unknown entity: ${id}`);
  return entity;
}

function validateWorld(world) {
  for (const edge of world.connections) {
    requireUnit(world, edge.from);
    requireUnit(world, edge.to);
  }
  for (const entity of world.entities.values()) {
    if (entity.unitId != null) requireUnit(world, entity.unitId);
  }
}

function getPath(value, path) {
  if (!path) return value;
  return path.split(".").reduce((current, key) => current == null ? undefined : current[key], value);
}

function compareValues(left, right, direction) {
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left < right ? -direction : direction;
}

function stableIndex(seed, length) {
  const text = String(seed);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function arrayOf(value) {
  return Array.isArray(value) ? value : [value];
}

function clone(value) {
  if (value === undefined) return undefined;
  return structuredClone(value);
}

module.exports = {
  buildAttentionRegion,
  createWorld,
  runActionAttentionChain,
  selectFromRegion,
  snapshotWorld,
};
