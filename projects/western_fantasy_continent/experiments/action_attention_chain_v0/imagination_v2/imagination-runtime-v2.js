"use strict";

function createImaginationWorld({ units, connections, entities }) {
  const world = {
    units: new Map(units.map((unit) => [unit.id, clone(unit)])),
    connections: connections.map(clone),
    entities: new Map(entities.map((entity) => [entity.id, clone(entity)])),
  };
  for (const edge of world.connections) {
    if (!world.units.has(edge.from) || !world.units.has(edge.to)) throw new Error(`invalid edge ${edge.from}->${edge.to}`);
  }
  return world;
}

function snapshot(world) {
  return {
    units: [...world.units.values()].map(clone),
    connections: world.connections.map(clone),
    entities: [...world.entities.values()].map(clone),
  };
}

function imagine({ world: observedWorld, actionDefinitions, glueLinks, startInvocation, goal = null, maxActions = 50 }) {
  const observedSnapshot = snapshot(observedWorld);
  const world = createImaginationWorld(observedSnapshot);
  const definitions = new Map(actionDefinitions.map((definition) => [definition.id, definition]));
  const queue = [clone(startInvocation)];
  const trace = [];

  while (queue.length) {
    if (trace.length >= maxActions) throw new Error(`imagination budget exhausted: ${maxActions}`);
    const invocation = queue.shift();
    const definition = definitions.get(invocation.actionId);
    if (!definition) throw new Error(`unknown imagined action: ${invocation.actionId}`);
    const expansion = expandAction(world, definition, invocation.input || {});
    const row = {
      index: trace.length + 1,
      actionId: definition.id,
      actionTags: [...(definition.tags || [])],
      input: clone(invocation.input || {}),
      gluedFrom: clone(invocation.gluedFrom || null),
      attention: clone(expansion.attention),
      prediction: clone(expansion.prediction),
      ports: clone(expansion.ports),
      gluedInvocations: [],
    };
    trace.push(row);

    for (const port of expansion.ports) {
      const context = buildContext(world, definition, invocation, port);
      for (const link of glueLinks.filter((candidate) => matchesSource(candidate.from, definition, port))) {
        if (!matchesCondition(context, link.condition || {})) continue;
        const matches = link.attention ? attendAndSelect(world, resolve(link.attention, context)) : [null];
        if (link.attention && !matches.length) continue;
        const repetitions = link.forEachMatch ? matches : [matches[0] || null];
        for (const match of repetitions) {
          const local = { ...context, match };
          for (const target of arrayOf(link.invoke)) {
            const next = {
              actionId: target.actionId,
              input: resolve(target.input || {}, local),
              gluedFrom: { linkId: link.id, actionIndex: row.index, port: port.name },
            };
            queue.push(next);
            row.gluedInvocations.push(clone(next));
          }
        }
      }
    }
  }

  return {
    schema: "action_attention_imagination_v2",
    observedWorld: observedSnapshot,
    imaginedWorld: snapshot(world),
    trace,
    goalMatch: goal ? evaluateGoal(world, goal) : null,
  };
}

function expandAction(world, definition, input) {
  switch (definition.operator) {
    case "point_relocate": {
      const entity = requireEntity(world, input.actorId);
      const target = requireUnit(world, input.targetUnitId);
      const from = entity.unitId;
      const attention = pointAttention(world, [from, target.id].filter(Boolean), target.id);
      entity.unitId = target.id;
      return {
        attention,
        prediction: { tendency: "entity_position_changes", patches: [{ entityId: entity.id, field: "unitId", from, to: target.id }] },
        ports: [{ name: definition.outputPort, actorId: entity.id, from, to: target.id, ...clone(input.portPayload || {}) }],
      };
    }
    case "directed_move": {
      const entity = requireEntity(world, input.actorId);
      const from = entity.unitId;
      const path = follow(world, from, definition.connectionKind, definition.direction, Number(input.distance));
      const to = path.at(-1) || from;
      const attendedIds = [from, ...path];
      const attention = {
        schema: "action_attention_region_v2",
        shape: "directed_path",
        unitIds: attendedIds,
        units: attendedIds.map((id) => clone(requireUnit(world, id))),
        connections: pathEdges(world, attendedIds, definition.connectionKind),
        anchors: {
          actor: { entityId: entity.id, unitId: from },
          origin: from,
          path: path.slice(0, -1),
          endpoint: to,
        },
        observationPolicy: {
          visibleUnitIds: attendedIds,
          consequenceEligibleUnitIds: definition.consequenceFocus === "endpoint" ? [to] : attendedIds,
        },
      };
      entity.unitId = to;
      return {
        attention,
        prediction: {
          tendency: "entity_moves_through_space",
          patches: [{ entityId: entity.id, field: "unitId", from, to }],
          confidence: path.length === Number(input.distance) ? 1 : 0.7,
        },
        ports: [{
          name: definition.outputPort,
          actorId: entity.id,
          from,
          to,
          path,
          cause: input.cause || null,
          searchOrigin: input.searchOrigin || null,
        }],
      };
    }
    case "select_entity": {
      const attentionSpec = resolve(definition.attention, { input, world: snapshot(world) });
      const matches = attendAndSelect(world, attentionSpec);
      return {
        attention: matches[0]?.attention || attentionSpec,
        prediction: { tendency: "attention_selects_candidate", patches: [] },
        ports: matches.map((selected) => ({ name: definition.outputPort, ...selected, ...clone(input.portPayload || {}) })),
      };
    }
    case "damage": {
      const entity = requireEntity(world, input.targetId);
      const from = Number(entity.state?.hp || 0);
      const to = Math.max(0, from - Number(input.amount));
      const attention = pointAttention(world, [entity.unitId].filter(Boolean), entity.unitId);
      entity.state = { ...(entity.state || {}), hp: to };
      return {
        attention,
        prediction: { tendency: "entity_state_decreases", patches: [{ entityId: entity.id, field: "state.hp", from, to }] },
        ports: [{ name: definition.outputPort, targetId: entity.id, hpBefore: from, hpAfter: to }],
      };
    }
    default:
      throw new Error(`unsupported imagination operator: ${definition.operator}`);
  }
}

function attendAndSelect(world, spec) {
  const region = buildRegion(world, spec.region);
  let rows = [];
  for (const unitId of region.unitIds) {
    for (const entity of world.entities.values()) {
      if (entity.unitId !== unitId || entity.removed) continue;
      if (!matchesEntity(entity, spec.query?.keep || {})) continue;
      rows.push({ entityId: entity.id, unitId, entity: clone(entity), attention: clone(region) });
    }
  }
  if (spec.query?.mode === "random_one") {
    rows = rows.length ? [rows[stableIndex(spec.query.seed ?? 1, rows.length)]] : [];
  } else if (spec.query?.mode === "first") rows = rows.slice(0, 1);
  return rows;
}

function buildRegion(world, spec) {
  const unitIds = new Set([spec.seed]);
  const queue = [{ id: spec.seed, depth: 0 }];
  while (queue.length) {
    const current = queue.shift();
    if (spec.mode !== "flood" || current.depth >= (spec.maxDepth ?? Infinity)) continue;
    for (const edge of outgoing(world, current.id, spec.connectionKinds)) {
      if (unitIds.has(edge.to)) continue;
      unitIds.add(edge.to);
      queue.push({ id: edge.to, depth: current.depth + 1 });
    }
  }
  const ids = [...unitIds];
  return {
    schema: "action_attention_region_v2",
    shape: spec.mode,
    unitIds: ids,
    units: ids.map((id) => clone(requireUnit(world, id))),
    connections: world.connections.filter((edge) => unitIds.has(edge.from) && unitIds.has(edge.to)).map(clone),
    anchors: { seed: spec.seed },
  };
}

function pointAttention(world, unitIds, focus) {
  return {
    schema: "action_attention_region_v2",
    shape: "points",
    unitIds,
    units: unitIds.map((id) => clone(requireUnit(world, id))),
    connections: [],
    anchors: { focus },
  };
}

function evaluateGoal(world, goal) {
  const checks = (goal.all || [goal]).map((condition) => {
    if (condition.type === "entity_state_at_least") {
      const entity = requireEntity(world, condition.entityId);
      const actual = getPath(entity.state || {}, condition.field);
      return { ...condition, actual, matched: Number(actual) >= Number(condition.value) };
    }
    if (condition.type === "entity_not_at_tag") {
      const entity = requireEntity(world, condition.entityId);
      const tags = requireUnit(world, entity.unitId).tags || [];
      return { ...condition, actual: tags, matched: !tags.includes(condition.tag) };
    }
    throw new Error(`unsupported goal: ${condition.type}`);
  });
  return { matched: checks.every((check) => check.matched), checks };
}

function buildContext(world, definition, invocation, port) {
  const focusId = port.to || port.unitId || null;
  return {
    action: { id: definition.id, tags: definition.tags || [] },
    input: invocation.input || {},
    port,
    focusUnit: focusId ? world.units.get(focusId) : null,
  };
}

function matchesSource(source, definition, port) {
  if (source.port !== port.name) return false;
  if (source.actionId && source.actionId !== definition.id) return false;
  if (source.actionTag && !(definition.tags || []).includes(source.actionTag)) return false;
  return true;
}

function matchesCondition(context, condition) {
  return Object.entries(condition).every(([path, expected]) => {
    const actual = getPath(context, path);
    if (expected && typeof expected === "object") {
      if (Object.hasOwn(expected, "includes")) return Array.isArray(actual) && actual.includes(expected.includes);
      if (Object.hasOwn(expected, "not")) return actual !== expected.not;
    }
    return actual === expected;
  });
}

function matchesEntity(entity, predicate) {
  if (predicate.type && entity.type !== predicate.type) return false;
  if (predicate.idNot && entity.id === predicate.idNot) return false;
  if (predicate.tagsAll && !predicate.tagsAll.every((tag) => (entity.tags || []).includes(tag))) return false;
  return true;
}

function follow(world, start, kind, direction, distance) {
  const path = [];
  let current = start;
  for (let step = 0; step < distance; step += 1) {
    const edge = outgoing(world, current, [kind]).find((candidate) => !direction || candidate.direction === direction);
    if (!edge) break;
    current = edge.to;
    path.push(current);
  }
  return path;
}

function pathEdges(world, ids, kind) {
  const pairs = new Set(ids.slice(0, -1).map((id, index) => `${id}->${ids[index + 1]}`));
  return world.connections.filter((edge) => edge.kind === kind && pairs.has(`${edge.from}->${edge.to}`)).map(clone);
}

function outgoing(world, from, kinds) {
  return world.connections.filter((edge) => edge.from === from && (!kinds || kinds.includes(edge.kind)));
}

function resolve(value, context) {
  if (Array.isArray(value)) return value.map((item) => resolve(item, context));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolve(item, context)]));
  if (typeof value !== "string") return value;
  if (/^\$[a-zA-Z]/.test(value) && !value.includes("${")) return clone(getPath(context, value.slice(1)));
  return value.replace(/\$\{([^}]+)\}/g, (_, path) => String(getPath(context, path)));
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

function getPath(value, path) {
  return path.split(".").reduce((current, key) => current == null ? undefined : current[key], value);
}

function stableIndex(seed, length) {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
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

module.exports = { createImaginationWorld, imagine, snapshot };
