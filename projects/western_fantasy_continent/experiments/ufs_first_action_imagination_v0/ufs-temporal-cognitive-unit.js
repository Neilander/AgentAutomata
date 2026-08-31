"use strict";

const UNIT_SCHEMA = "ufs_temporal_cognitive_unit_v1";

function clone(value) {
  return structuredClone(value);
}

function stable(value) {
  return JSON.stringify(value);
}

function roomForCell(publicMap, cellId) {
  const cell = publicMap?.base?.cells?.find((row) => row.id === cellId);
  return cell ? publicMap.base.rooms.find((row) => row.id === cell.roomId) || null : null;
}

function roomById(publicMap, roomId) {
  return publicMap?.base?.rooms?.find((row) => row.id === roomId) || null;
}

function operationLabel(operation) {
  return Object.entries(operation)
    .map(([key, value]) => `${key}=${typeof value === "object" ? stable(value) : value}`)
    .join("|");
}

function inferObjective(firstOperation, publicMap) {
  if (firstOperation.type === "place_die") {
    const room = roomForCell(publicMap, firstOperation.cellId);
    if (!room) return { kind: "single_operation", operationType: firstOperation.type };
    return {
      kind: "room_investment",
      roomId: room.id,
      roomType: room.type,
      requiredCellIds: clone(room.cellIds),
    };
  }
  if (firstOperation.type === "resolve_room") {
    const room = roomById(publicMap, firstOperation.roomId);
    if (room?.type === "research") {
      return { kind: "research_resolution", roomId: room.id, roomType: room.type };
    }
    if (room) return { kind: "room_resolution", roomId: room.id, roomType: room.type };
  }
  return { kind: "single_operation", operationType: firstOperation.type };
}

function occupiedCellIds(mentalBefore, operations) {
  return new Set([
    ...(mentalBefore?.placements || []).filter((row) => !row.resolved).map((row) => row.cellId),
    ...operations.filter((row) => row.type === "place_die").map((row) => row.cellId),
  ]);
}

function remainingDice(playerResponse, operations) {
  const used = new Set(operations.filter((row) => row.type === "place_die").map((row) => row.dieId));
  return (playerResponse?.observation?.dice || [])
    .filter((row) => row.placed === false && !used.has(row.id));
}

function visibleCellIds(playerResponse) {
  return new Set((playerResponse?.mapView?.baseCells || []).map((row) => row.id));
}

function branchResult({ objective, operations, trial, status, completionReason }) {
  return {
    schema: UNIT_SCHEMA,
    status,
    objective: clone(objective),
    operationCount: operations.length,
    operations: clone(operations),
    completionReason,
    imaginedStatus: trial.status,
    imaginedReason: trial.reason,
    simulationReliability: trial.simulationReliability || "cognitive_trial_completed",
    imaginedWorld: clone(trial.imaginedWorld),
  };
}

function expandTemporalCognitiveUnits({
  firstOperation,
  playerResponse,
  mentalBefore,
  publicMap,
  simulateSequence,
  maxOperations = 4,
} = {}) {
  if (!firstOperation || typeof firstOperation.type !== "string") {
    throw new TypeError("temporal cognitive unit requires a first operation");
  }
  if (typeof simulateSequence !== "function") {
    throw new TypeError("temporal cognitive unit requires simulateSequence");
  }
  if (!Number.isInteger(maxOperations) || maxOperations < 1) {
    throw new RangeError("maxOperations must be a positive integer");
  }
  const objective = inferObjective(firstOperation, publicMap);
  const visible = visibleCellIds(playerResponse);
  const output = [];

  const visit = (operations) => {
    const trial = simulateSequence(clone(operations));
    if (!trial || trial.status === "rejected") return;
    if (trial.status === "complete") {
      output.push(branchResult({
        objective, operations, trial, status: "completed", completionReason: "terminal_outcome",
      }));
      return;
    }
    if (trial.status === "random") {
      output.push(branchResult({
        objective, operations, trial, status: "suspended", completionReason: "public_random_boundary",
      }));
      return;
    }

    const pending = trial.pending || null;
    if (pending?.type === "room_effect" && pending.effectKind === "research_room_choice"
      && pending.roomId === objective.roomId) {
      if (operations.length >= maxOperations) {
        output.push(branchResult({
          objective, operations, trial, status: "truncated", completionReason: "operation_limit",
        }));
        return;
      }
      for (let advanceSteps = 0; advanceSteps <= pending.maxAdvanceSteps; advanceSteps += 1) {
        visit([...operations, {
          type: "choose_research_advance",
          roomId: pending.roomId,
          advanceSteps,
        }]);
      }
      return;
    }

    if (objective.kind === "room_investment") {
      const occupied = occupiedCellIds(mentalBefore, operations);
      const missing = objective.requiredCellIds.filter((cellId) => !occupied.has(cellId));
      const lastOperation = operations[operations.length - 1];
      if (lastOperation.type === "resolve_room" && lastOperation.roomId === objective.roomId) {
        output.push(branchResult({
          objective, operations, trial, status: "completed", completionReason: "room_effect_resolved",
        }));
        return;
      }
      if (missing.length > 0 && pending?.type === "place_die" && operations.length < maxOperations) {
        const dice = remainingDice(playerResponse, operations);
        const continuations = [];
        for (const die of dice) {
          for (const cellId of missing) {
            if (visible.has(cellId)) continuations.push({ type: "place_die", dieId: die.id, cellId });
          }
        }
        if (continuations.length > 0) {
          continuations.forEach((operation) => visit([...operations, operation]));
          return;
        }
      }
      if (missing.length === 0 && pending?.type === "room_action"
        && pending.candidates?.resolvableRoomIds?.includes(objective.roomId)
        && operations.length < maxOperations) {
        visit([...operations, { type: "resolve_room", roomId: objective.roomId, pay: true }]);
        return;
      }
      output.push(branchResult({
        objective,
        operations,
        trial,
        status: missing.length === 0 ? "completed" : "suspended",
        completionReason: missing.length === 0
          ? "room_investment_ready"
          : operations.length >= maxOperations ? "operation_limit" : "continuation_not_visible",
      }));
      return;
    }

    if (objective.kind === "research_resolution") {
      output.push(branchResult({
        objective, operations, trial, status: "completed", completionReason: "research_effect_resolved",
      }));
      return;
    }
    if (objective.kind === "room_resolution") {
      output.push(branchResult({
        objective, operations, trial, status: "completed", completionReason: "room_effect_resolved",
      }));
      return;
    }
    output.push(branchResult({
      objective, operations, trial, status: "completed", completionReason: "single_operation_boundary",
    }));
  };

  visit([clone(firstOperation)]);
  return output;
}

function publicUnit(unit) {
  return {
    schema: unit.schema,
    status: unit.status,
    objective: clone(unit.objective),
    operationCount: unit.operationCount,
    operations: clone(unit.operations),
    completionReason: unit.completionReason,
  };
}

module.exports = {
  UNIT_SCHEMA,
  expandTemporalCognitiveUnits,
  inferObjective,
  operationLabel,
  publicUnit,
};
