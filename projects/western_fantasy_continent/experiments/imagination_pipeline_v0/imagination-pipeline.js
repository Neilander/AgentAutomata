"use strict";

const path = require("node:path");
const { MatrixTrajectoryMemory } = require("./five-slot-activation");
const { qFor, TRAJECTORIES } = require("./trajectory-fixtures");

const DEFAULT_GROUNDER_PATH = path.resolve(
  __dirname,
  "../blind_rule_program_micro_v0/submission/submission.js",
);

class AttentionAccessError extends Error {
  constructor(atomId) {
    super(`attention did not expose required public fact: ${atomId}`);
    this.name = "AttentionAccessError";
    this.atomId = atomId;
  }
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.max(minimum, Math.min(maximum, value));
}

function clone(value) {
  return structuredClone(value);
}

function tileKey(column, row) {
  return `${column}:${row}`;
}

function atomIdForTile(column, row, field) {
  return `tile:${tileKey(column, row)}.${field}`;
}

function findTile(world, column, row) {
  return world.tiles.find((tile) => tile.column === column && tile.row === row) || null;
}

function instantiateActionPattern(action) {
  if (!action || action.type !== "place_die") {
    throw new Error("imagination_pipeline_v0 currently accepts only place_die candidates");
  }
  if (typeof action.column !== "string" || !Number.isInteger(action.amount)) {
    throw new TypeError("place_die requires a string column and integer amount");
  }
  return {
    patternId: "ACTION-PLACE-DIE-V0",
    actionType: "place_die",
    actorRef: action.dieId,
    parameters: {
      column: action.column,
      amount: action.amount,
      selection: action.selection || "all",
    },
    attentionPlan: {
      directEventFields: ["type", "column", "amount", "selection"],
      objectRelation: "same_column",
      spatialExpansion: "predicted_endpoint_then_special_target",
    },
    exit: "die_placed",
  };
}

function createAtomRegistry(world, action) {
  const atoms = new Map();
  function add(id, value) {
    if (!atoms.has(id)) {
      atoms.set(id, {
        id,
        value,
        activation: 0.04,
        contributions: [{ source: "default", amount: 0.04 }],
      });
    }
  }
  add("event.type", action.type);
  add("event.column", action.column);
  add("event.amount", action.amount);
  add("event.selection", action.selection || "all");
  for (const object of world.objects) {
    for (const field of ["id", "column", "row", "frozen", "city_distance"]) {
      add(`object:${object.id}.${field}`, object[field]);
    }
  }
  for (const tile of world.tiles) {
    for (const field of ["column", "row", "kind", "targetColumn", "targetRow"]) {
      if (tile[field] !== undefined) add(atomIdForTile(tile.column, tile.row, field), tile[field]);
    }
  }
  add("city.health", world.city.health);
  return atoms;
}

function contribute(atoms, id, source, amount) {
  const atom = atoms.get(id);
  if (!atom) return;
  atom.activation = clamp(atom.activation + amount);
  atom.contributions.push({ source, amount });
}

function buildAttentionField(world, action, actionInstance, {
  maxItems = 40,
  goal = null,
  adjustments = {},
} = {}) {
  if (!Number.isInteger(maxItems) || maxItems <= 0) {
    throw new TypeError("attention maxItems must be a positive integer");
  }
  const atoms = createAtomRegistry(world, action);
  for (const field of actionInstance.attentionPlan.directEventFields) {
    contribute(atoms, `event.${field}`, "action_direct", 0.96);
  }

  const sameColumnObjects = world.objects.filter((object) => object.column === action.column);
  for (const object of sameColumnObjects) {
    for (const field of ["id", "column", "row", "frozen", "city_distance"]) {
      contribute(atoms, `object:${object.id}.${field}`, "action_same_column", 0.88);
    }
    const endpointRow = object.row + action.amount;
    const endpoint = findTile(world, object.column, endpointRow);
    if (!endpoint) continue;
    for (const field of ["column", "row", "kind", "targetColumn", "targetRow"]) {
      contribute(
        atoms,
        atomIdForTile(endpoint.column, endpoint.row, field),
        "action_predicted_endpoint",
        0.8,
      );
    }
    if (endpoint.kind === "arrow") {
      const target = findTile(world, endpoint.targetColumn, endpoint.targetRow);
      if (target) {
        for (const field of ["column", "row", "kind", "targetColumn", "targetRow"]) {
          contribute(
            atoms,
            atomIdForTile(target.column, target.row, field),
            "action_special_target",
            0.68,
          );
        }
      }
    }
  }

  for (const tile of world.tiles) {
    if (tile.kind !== "normal") {
      contribute(atoms, atomIdForTile(tile.column, tile.row, "kind"), "salient_special_tile", 0.12);
    }
  }
  if (goal?.kind === "protect_city") {
    contribute(atoms, "city.health", "goal_protect_city", 0.66);
    for (const tile of world.tiles.filter((candidate) => candidate.kind === "city")) {
      contribute(atoms, atomIdForTile(tile.column, tile.row, "kind"), "goal_protect_city", 0.12);
    }
  }
  for (const [id, amount] of Object.entries(adjustments)) {
    contribute(atoms, id, "review_adjustment", Number(amount));
  }

  const ranked = [...atoms.values()].sort((left, right) => (
    right.activation - left.activation || left.id.localeCompare(right.id)
  ));
  const selected = ranked.slice(0, Math.min(maxItems, ranked.length));
  const selectedById = new Map(selected.map((atom) => [atom.id, atom]));
  return {
    maxItems,
    totalPublicAtoms: ranked.length,
    ranked,
    selected,
    selectedById,
    has(id) {
      return selectedById.has(id);
    },
    read(id, readTrace = null) {
      if (!selectedById.has(id)) throw new AttentionAccessError(id);
      if (readTrace) readTrace.push(id);
      return selectedById.get(id).value;
    },
  };
}

function fullAttentionSources(atomId, action) {
  if (atomId === "event.column") return [`base_cell:${action.cellId}`];
  if (atomId.startsWith("event.")) return [`die:${action.dieId}`];
  if (atomId === "city.health") return ["track:damage"];
  const objectMatch = /^object:([^.]*)\./.exec(atomId);
  if (objectMatch) return [`ship:${objectMatch[1]}`];
  const tileMatch = /^tile:C(\d+):(-?\d+)\./.exec(atomId);
  if (tileMatch) {
    const column = Number(tileMatch[1]) - 1;
    const row = Number(tileMatch[2]);
    return row >= 0 && row <= 15 ? [`sky_cell:${row}:${column}`] : ["track:damage"];
  }
  return [];
}

function buildExternalAttentionField(world, action, allocation) {
  if (!allocation || !Array.isArray(allocation.noticedItemIds)) {
    throw new TypeError("externalAttention must be a full attention allocation");
  }
  const noticed = new Set(allocation.noticedItemIds);
  const atoms = [...createAtomRegistry(world, action).values()];
  const selected = atoms.filter((atom) => fullAttentionSources(atom.id, action)
    .every((itemId) => noticed.has(itemId)));
  const selectedById = new Map(selected.map((atom) => [atom.id, atom]));
  return {
    maxItems: selected.length,
    totalPublicAtoms: atoms.length,
    ranked: atoms,
    selected,
    selectedById,
    has(id) { return selectedById.has(id); },
    read(id, readTrace = null) {
      if (!selectedById.has(id)) throw new AttentionAccessError(id);
      if (readTrace) readTrace.push(id);
      return selectedById.get(id).value;
    },
  };
}

function hasObjectFields(attention, objectId, fields) {
  return fields.every((field) => attention.has(`object:${objectId}.${field}`));
}

function attentionToInitialQueries(world, action, attention) {
  const requiredEvent = ["event.type", "event.column", "event.amount", "event.selection"];
  if (!requiredEvent.every((id) => attention.has(id))) return [];
  const queries = [];
  for (const object of world.objects) {
    if (!hasObjectFields(attention, object.id, ["id", "column", "row", "frozen"])) continue;
    if (attention.read(`object:${object.id}.column`) !== action.column) continue;
    queries.push({
      q: qFor("place_die_same_column"),
      metadata: {
        kind: "place_die_same_column",
        objectId: object.id,
        column: action.column,
      },
    });
  }
  return queries;
}

function relationCheck(trajectory, query) {
  const expected = trajectory.relation || {};
  if (expected.qKind && expected.qKind !== query.metadata.kind) {
    return {
      accepted: false,
      reason: `q_kind_mismatch:${query.metadata.kind}!=${expected.qKind}`,
    };
  }
  if (expected.tileKind && expected.tileKind !== query.metadata.tileKind) {
    return {
      accepted: false,
      reason: `tile_kind_mismatch:${query.metadata.tileKind}!=${expected.tileKind}`,
    };
  }
  return { accepted: true, reason: "current_noticed_relation_matches" };
}

function validateTrajectoryContracts(trajectories) {
  const outcomeKinds = new Set(["automatic", "choice", "random", "unknown", "complete"]);
  for (const [index, trajectory] of trajectories.entries()) {
    for (const field of ["id", "sourceRuleId", "sourceQuote", "program", "outcomeKind"]) {
      if (typeof trajectory[field] !== "string" || trajectory[field].trim() === "") {
        throw new TypeError(`trajectory[${index}].${field} must be a non-empty string`);
      }
    }
    if (!outcomeKinds.has(trajectory.outcomeKind)) {
      throw new TypeError(`trajectory[${index}] has invalid outcomeKind`);
    }
    if (!Array.isArray(trajectory.internalAttentionPoints)) {
      throw new TypeError(`trajectory[${index}].internalAttentionPoints must be an array`);
    }
  }
}

function loadBlindGrounder(modulePath = DEFAULT_GROUNDER_PATH) {
  delete require.cache[require.resolve(modulePath)];
  const grounder = require(modulePath);
  const needed = ["RULE-BASE-COLUMN-MOVE", "RULE-FROZEN-STAYS"];
  if (!grounder || typeof grounder.preview !== "function") {
    throw new Error("blind grounding submission must export preview(state)");
  }
  if (!needed.every((id) => grounder.SOURCE_RULE_IDS?.includes(id))) {
    throw new Error("blind grounding submission lacks required source rules");
  }
  return grounder;
}

function guardedObject(object, attention, reads) {
  return new Proxy({}, {
    get(_target, property) {
      if (typeof property !== "string") return undefined;
      return attention.read(`object:${object.id}.${property}`, reads);
    },
    set() {
      throw new Error("grounding preview cannot mutate noticed object input");
    },
    ownKeys() {
      throw new Error("grounding preview cannot enumerate object keys");
    },
  });
}

function makeGuardedGroundingState(world, action, objectIds, attention, reads) {
  const objects = objectIds.map((objectId) => {
    const object = world.objects.find((candidate) => candidate.id === objectId);
    if (!object) throw new Error(`unknown grounding object: ${objectId}`);
    return guardedObject(object, attention, reads);
  });
  const event = new Proxy({}, {
    get(_target, property) {
      if (typeof property !== "string") return undefined;
      return attention.read(`event.${property}`, reads);
    },
    set() {
      throw new Error("grounding preview cannot mutate event input");
    },
    ownKeys() {
      throw new Error("grounding preview cannot enumerate event keys");
    },
  });
  return { event, objects };
}

function unique(values) {
  return [...new Set(values)];
}

function previewTrajectoryProgram({
  trajectory,
  queries,
  imaginedWorld,
  action,
  attention,
  blindGrounder,
}) {
  const reads = [];
  if (trajectory.program === "blind_column_move") {
    const objectIds = unique(queries.map((query) => query.metadata.objectId));
    const state = makeGuardedGroundingState(
      imaginedWorld,
      action,
      objectIds,
      attention,
      reads,
    );
    const before = JSON.stringify(imaginedWorld);
    const effects = blindGrounder.preview(state);
    if (JSON.stringify(imaginedWorld) !== before) {
      throw new Error("grounding preview mutated imaginedWorld input");
    }
    return {
      reads,
      patches: effects.map((effect) => ({
        kind: "move_object",
        objectId: effect.object_id,
        fromColumn: action.column,
        fromRow: effect.from_row,
        toColumn: action.column,
        toRow: effect.to_row,
      })),
    };
  }

  if (trajectory.program === "arrow_shift") {
    const patches = queries.map((query) => {
      const { objectId, tileColumn, tileRow } = query.metadata;
      const targetColumn = attention.read(atomIdForTile(tileColumn, tileRow, "targetColumn"), reads);
      const targetRow = attention.read(atomIdForTile(tileColumn, tileRow, "targetRow"), reads);
      const object = imaginedWorld.objects.find((candidate) => candidate.id === objectId);
      if (!object) throw new Error(`arrow shift missing object: ${objectId}`);
      return {
        kind: "move_object",
        objectId,
        fromColumn: object.column,
        fromRow: object.row,
        toColumn: targetColumn,
        toRow: targetRow,
      };
    });
    return { reads, patches };
  }

  if (trajectory.program === "city_damage") {
    attention.read("city.health", reads);
    const currentHealth = imaginedWorld.city.health;
    const hitCount = queries.length;
    return {
      reads,
      patches: [{
        kind: "set_city_health",
        fromHealth: imaginedWorld.city.health,
        toHealth: Math.max(0, currentHealth - hitCount),
      }],
    };
  }

  if (trajectory.program === "no_effect") {
    return { reads, patches: [] };
  }
  throw new Error(`unknown trajectory program: ${trajectory.program}`);
}

class ImaginationAttentionAccount {
  constructor(budget) {
    if (!Number.isFinite(budget) || budget < 0) {
      throw new TypeError("imagination attention budget must be a non-negative number");
    }
    this.initial = budget;
    this.remaining = budget;
    this.spent = 0;
    this.entries = [];
  }

  inspect(trajectory) {
    for (const point of trajectory.internalAttentionPoints || []) {
      const familiarity = clamp(Number(trajectory.familiarity || 0));
      const cost = Math.max(0.25, 1 - 0.5 * familiarity);
      if (this.remaining + 1e-9 < cost) {
        return {
          status: "attention_stop",
          point,
          required: cost,
          remaining: this.remaining,
        };
      }
      this.remaining -= cost;
      this.spent += cost;
      this.entries.push({ trajectoryId: trajectory.id, point, cost });
    }
    return { status: trajectory.outcomeKind };
  }
}

function applyPatches(world, patches) {
  for (const patch of patches) {
    if (patch.kind === "move_object") {
      const object = world.objects.find((candidate) => candidate.id === patch.objectId);
      if (!object) throw new Error(`patch references unknown object: ${patch.objectId}`);
      if (object.column !== patch.fromColumn || object.row !== patch.fromRow) {
        throw new Error(`patch source mismatch for ${patch.objectId}`);
      }
      object.column = patch.toColumn;
      object.row = patch.toRow;
      continue;
    }
    if (patch.kind === "set_city_health") {
      if (world.city.health !== patch.fromHealth) throw new Error("city patch source mismatch");
      world.city.health = patch.toHealth;
      continue;
    }
    throw new Error(`unknown patch kind: ${patch.kind}`);
  }
}

function landingKindToQKind(tileKind) {
  const known = {
    arrow: "landed_arrow",
    city: "landed_city",
    normal: "landed_normal",
    mothership: "landed_mothership",
    random: "landed_random",
    choice: "landed_choice",
  };
  return known[tileKind] || "landed_unknown";
}

function deriveQueriesFromPatches(world, patches, attention) {
  const queries = [];
  const missingAttention = [];
  for (const patch of patches.filter((candidate) => candidate.kind === "move_object")) {
    const kindAtom = atomIdForTile(patch.toColumn, patch.toRow, "kind");
    if (!attention.has(kindAtom)) {
      missingAttention.push(kindAtom);
      continue;
    }
    const tileKind = attention.read(kindAtom);
    const kind = landingKindToQKind(tileKind);
    queries.push({
      q: qFor(kind),
      metadata: {
        kind,
        objectId: patch.objectId,
        tileKind,
        tileColumn: patch.toColumn,
        tileRow: patch.toRow,
      },
    });
  }
  return { queries, missingAttention };
}

function groupSelections(selections) {
  const groups = new Map();
  for (const selection of selections) {
    const id = selection.trajectory.id;
    if (!groups.has(id)) groups.set(id, { trajectory: selection.trajectory, queries: [] });
    groups.get(id).queries.push(selection.query);
  }
  return [...groups.values()];
}

class ImaginationPipeline {
  constructor({
    trajectories = TRAJECTORIES,
    memory = null,
    blindGrounder = null,
    activationThreshold = 0.55,
    topK = 4,
    maxIterations = 12,
  } = {}) {
    validateTrajectoryContracts(trajectories);
    this.memory = memory || new MatrixTrajectoryMemory(trajectories);
    this.blindGrounder = blindGrounder || loadBlindGrounder();
    this.activationThreshold = activationThreshold;
    this.topK = topK;
    this.maxIterations = maxIterations;
  }

  run({
    world,
    action,
    goal = null,
    perceptionBudget = 40,
    imaginationBudget = 20,
    attentionAdjustments = {},
    externalAttention = null,
  }) {
    const observedBefore = JSON.stringify(world);
    const imaginedWorld = clone(world);
    const actionInstance = instantiateActionPattern(action);
    const attention = externalAttention
      ? buildExternalAttentionField(world, action, externalAttention)
      : buildAttentionField(world, action, actionInstance, {
        maxItems: perceptionBudget,
        goal,
        adjustments: attentionAdjustments,
      });
    const attentionAccount = new ImaginationAttentionAccount(imaginationBudget);
    let currentQueries = attentionToInitialQueries(world, action, attention);
    const seenQueryKeys = new Set();
    const trace = {
      schema: "imagination_pipeline_trace_v0",
      actionInstance,
      attention: {
        mode: externalAttention ? "external_full_attention" : "legacy_local_attention",
        totalPublicAtoms: attention.totalPublicAtoms,
        budget: attention.maxItems,
        selected: attention.selected.map((atom) => ({
          id: atom.id,
          activation: atom.activation,
          contributions: atom.contributions,
        })),
        ...(externalAttention ? {
          fullSpaceItemCount: externalAttention.spaceItemCount,
          fullCapacity: externalAttention.capacity,
          fullNoticedItemIds: externalAttention.noticedItemIds,
          fullOmittedItemIds: externalAttention.omittedItemIds,
          fullCarryoverAppliedItemIds: externalAttention.carryoverAppliedItemIds,
          attentionTraceBefore: externalAttention.traceBefore,
          attentionTraceAfter: externalAttention.traceAfter,
        } : {}),
      },
      initialQueryCount: currentQueries.length,
      activations: [],
      relationRejections: [],
      groundings: [],
      boundaries: [],
    };

    if (currentQueries.length === 0) {
      trace.boundaries.push({ kind: "attention_stop", reason: "no_complete_initial_q" });
    }

    for (let iteration = 0; currentQueries.length > 0 && iteration < this.maxIterations; iteration += 1) {
      const selections = [];
      for (const query of currentQueries) {
        const object = imaginedWorld.objects.find(
          (candidate) => candidate.id === query.metadata.objectId,
        );
        const queryKey = JSON.stringify([
          query.metadata.kind,
          query.metadata.objectId,
          query.metadata.tileColumn ?? null,
          query.metadata.tileRow ?? null,
          object?.column ?? null,
          object?.row ?? null,
        ]);
        if (seenQueryKeys.has(queryKey)) {
          trace.boundaries.push({
            kind: "unknown",
            reason: "repeated_imagined_query_guard",
            queryKind: query.metadata.kind,
            objectId: query.metadata.objectId,
          });
          continue;
        }
        seenQueryKeys.add(queryKey);
        const candidates = this.memory.query(query.q, { topK: this.topK });
        trace.activations.push({
          iteration,
          queryKind: query.metadata.kind,
          objectId: query.metadata.objectId,
          candidates: candidates.map((candidate) => ({
            trajectoryId: candidate.trajectory.id,
            activation: candidate.activation,
          })),
        });
        let accepted = null;
        for (const candidate of candidates) {
          if (candidate.activation < this.activationThreshold) continue;
          const relation = relationCheck(candidate.trajectory, query);
          if (!relation.accepted) {
            trace.relationRejections.push({
              iteration,
              queryKind: query.metadata.kind,
              trajectoryId: candidate.trajectory.id,
              activation: candidate.activation,
              reason: relation.reason,
            });
            continue;
          }
          accepted = { trajectory: candidate.trajectory, query, activation: candidate.activation };
          break;
        }
        if (accepted) {
          selections.push(accepted);
        } else {
          trace.boundaries.push({
            kind: "unknown",
            reason: "no_activated_trajectory_passed_relation_gate",
            queryKind: query.metadata.kind,
            objectId: query.metadata.objectId,
          });
        }
      }

      if (selections.length === 0) {
        currentQueries = [];
        break;
      }
      const nextQueries = [];
      for (const group of groupSelections(selections)) {
        let preview;
        try {
          preview = previewTrajectoryProgram({
            trajectory: group.trajectory,
            queries: group.queries,
            imaginedWorld,
            action,
            attention,
            blindGrounder: this.blindGrounder,
          });
        } catch (error) {
          if (error instanceof AttentionAccessError) {
            trace.boundaries.push({
              kind: "attention_stop",
              reason: "grounding_required_unnoticed_fact",
              trajectoryId: group.trajectory.id,
              atomId: error.atomId,
            });
            continue;
          }
          throw error;
        }

        const continuation = attentionAccount.inspect(group.trajectory);
        const groundingTrace = {
          iteration,
          trajectoryId: group.trajectory.id,
          queryKinds: group.queries.map((query) => query.metadata.kind),
          reads: preview.reads,
          patches: preview.patches,
          continuation,
          committed: false,
        };
        trace.groundings.push(groundingTrace);

        if (continuation.status === "attention_stop") {
          trace.boundaries.push({
            kind: "attention_stop",
            reason: "imagination_attention_exhausted",
            trajectoryId: group.trajectory.id,
            point: continuation.point,
          });
          continue;
        }
        if (["random", "choice", "unknown"].includes(continuation.status)) {
          trace.boundaries.push({
            kind: continuation.status,
            reason: `trajectory_boundary:${group.trajectory.id}`,
            trajectoryId: group.trajectory.id,
          });
          continue;
        }

        applyPatches(imaginedWorld, preview.patches);
        groundingTrace.committed = true;
        if (continuation.status === "complete") {
          trace.boundaries.push({
            kind: "complete",
            reason: `explicit_complete:${group.trajectory.id}`,
            trajectoryId: group.trajectory.id,
          });
          continue;
        }

        const derived = deriveQueriesFromPatches(imaginedWorld, preview.patches, attention);
        if (derived.missingAttention.length > 0) {
          trace.boundaries.push({
            kind: "complete",
            reason: "unnoticed_endpoint_effect_omitted_from_imagination",
            missingAtoms: derived.missingAttention,
            inferenceQuality: "attention_limited_possible_error",
            assumption: "no_additional_landing_effect_was_imagined",
          });
        }
        nextQueries.push(...derived.queries);
        if (preview.patches.length === 0 && derived.queries.length === 0) {
          trace.boundaries.push({
            kind: "complete",
            reason: `automatic_rule_had_no_effect:${group.trajectory.id}`,
            trajectoryId: group.trajectory.id,
          });
        }
      }
      currentQueries = nextQueries;
    }

    if (currentQueries.length > 0) {
      trace.boundaries.push({ kind: "unknown", reason: "max_iterations_reached" });
    }
    const observedWorldUnchanged = JSON.stringify(world) === observedBefore;
    if (!observedWorldUnchanged) throw new Error("pipeline mutated observedWorld");
    const boundaryPriority = ["attention_stop", "choice", "random", "unknown", "complete"];
    const finalBoundary = boundaryPriority
      .map((kind) => trace.boundaries.find((boundary) => boundary.kind === kind))
      .find(Boolean) || { kind: "unknown", reason: "no_explicit_boundary" };
    return {
      schema: "imagination_pipeline_result_v0",
      status: finalBoundary.kind,
      reason: finalBoundary.reason,
      observedWorldUnchanged,
      imaginedWorld,
      attentionAccount: {
        initial: attentionAccount.initial,
        spent: attentionAccount.spent,
        remaining: attentionAccount.remaining,
        entries: attentionAccount.entries,
      },
      trace,
    };
  }
}

module.exports = {
  AttentionAccessError,
  ImaginationAttentionAccount,
  ImaginationPipeline,
  instantiateActionPattern,
  buildAttentionField,
  buildExternalAttentionField,
  attentionToInitialQueries,
  relationCheck,
  validateTrajectoryContracts,
  loadBlindGrounder,
  atomIdForTile,
};
