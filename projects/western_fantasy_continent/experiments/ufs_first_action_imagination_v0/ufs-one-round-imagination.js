"use strict";

const { UfsFirstActionImagination } = require("./ufs-first-action-imagination");
const { UfsEventRuleImagination } = require("./ufs-event-rule-imagination");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");

function clone(value) {
  return structuredClone(value);
}

function unchanged(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mapIndexes(publicMap) {
  return {
    cellById: new Map(publicMap.base.cells.map((cell) => [cell.id, cell])),
    roomById: new Map(publicMap.base.rooms.map((room) => [room.id, room])),
    skyRowByIndex: new Map(publicMap.sky.rows.map((row) => [row.index, row])),
  };
}

function roomSources(world, room) {
  const sources = [];
  for (const cellId of room.cellIds) {
    const placement = world.placements.find((row) => row.cellId === cellId && !row.resolved);
    if (placement) {
      if (placement.excavationCandidate) return null;
      sources.push({ kind: "worker", id: placement.id, value: placement.dieValue });
      continue;
    }
    const robot = world.robots.find((row) => row.cellId === cellId && !row.exhausted);
    if (!robot) return null;
    sources.push({ kind: "robot", id: robot.id, value: robot.value });
  }
  return sources;
}

function consumeSources(world, sources) {
  for (const source of sources) {
    if (source.kind === "worker") {
      world.placements.find((row) => row.id === source.id).resolved = true;
    } else {
      const robot = world.robots.find((row) => row.id === source.id);
      robot.value -= 1;
      robot.exhausted = true;
      if (robot.value <= 0) world.robots = world.robots.filter((row) => row.id !== robot.id);
    }
  }
}

function maximumResearchAdvance(continuousCosts, budget) {
  let spent = 0;
  let steps = 0;
  for (const cost of continuousCosts) {
    if (!Number.isFinite(cost) || cost < 0 || spent + cost > budget) break;
    spent += cost;
    steps += 1;
  }
  return steps;
}

function scriptedAction(scriptRow, world) {
  const die = world.dice.find((row) => row.id === scriptRow.dieId);
  if (!die || die.placed) throw new Error(`scripted die is unavailable: ${scriptRow.dieId}`);
  return {
    type: "place_die",
    dieId: die.id,
    dieColor: die.color,
    dieValue: die.value,
    cellId: scriptRow.cellId,
  };
}

function eventStep(
  eventImagination,
  event,
  fullObservedState,
  eventPerception,
  scope,
  fullPerception = null,
) {
  const fullBefore = clone(fullObservedState);
  let noticedState = clone(fullPerception?.noticedState ?? fullObservedState);
  let noticedPaths = fullPerception?.noticedPaths ? [...fullPerception.noticedPaths] : null;
  let omittedItemIds = [...(fullPerception?.attentionAudit?.omittedItemIds || [])];
  let perceptionMode = fullPerception?.attentionAudit?.mode || "identity_test_perception";
  if (eventPerception) {
    const perception = eventPerception({
      event: clone(event),
      scope: clone(scope),
      publicState: clone(fullObservedState),
    });
    if (!perception || typeof perception !== "object" || !("noticedState" in perception)) {
      throw new TypeError("eventPerception must return { noticedState, omittedItemIds? }");
    }
    noticedState = clone(perception.noticedState);
    omittedItemIds.push(...(perception.omittedItemIds || []));
    perceptionMode = perception.mode || "injected_test_perception";
  }
  const noticedBefore = clone(noticedState);
  const result = eventImagination.run({
    event,
    observedState: noticedState,
    ...(noticedPaths ? { externalAttention: { noticedPaths } } : {}),
  });
  if (!result.observedWorldUnchanged) throw new Error("event imagination mutated its input");
  if (!unchanged(fullObservedState, fullBefore)) throw new Error("event perception mutated full public input");
  if (!unchanged(noticedState, noticedBefore)) throw new Error("event imagination mutated noticed input");
  result.trace.perception = {
    mode: perceptionMode,
    scope: clone(scope),
    omittedItemIds: [...new Set(omittedItemIds)],
    noticedPaths,
    fullSpaceItemCount: fullPerception?.attentionAudit?.spaceItemCount ?? null,
    capacity: fullPerception?.attentionAudit?.capacity ?? null,
    carryoverAppliedItemIds: fullPerception?.attentionAudit?.carryoverAppliedItemIds ?? [],
    attentionTraceBefore: fullPerception?.attentionAudit?.traceBefore ?? [],
    attentionTraceAfter: fullPerception?.attentionAudit?.traceAfter ?? [],
    fullField: fullPerception?.attentionAudit?.field ?? null,
    fullInputUnchanged: true,
    noticedInputUnchanged: true,
  };
  return result;
}

function explosionShips(world, indexes) {
  return world.ships.flatMap((ship) => {
    const threshold = indexes.skyRowByIndex.get(ship.row)?.cells?.[ship.column]?.explosion;
    return threshold == null ? [] : [{ id: ship.id, threshold }];
  });
}

function shipsByRow(world) {
  return world.ships.reduce((rows, ship) => {
    (rows[ship.row] ||= []).push(ship.id);
    return rows;
  }, {});
}

function spawnState(world, publicMap) {
  const columns = Array.from({ length: publicMap.columns }, (_, column) => {
    const ships = world.ships.filter((ship) => ship.column === column);
    return {
      id: `C${column + 1}`,
      shipIds: ships.map((ship) => ship.id),
      dropPointId: `DP-C${column + 1}`,
    };
  });
  const openColumns = columns.filter((column, index) => (
    !world.ships.some((ship) => ship.column === index && ship.row === publicMap.sky.dropRow)
  ));
  return {
    sky: { columns },
    spawn: {
      dropPoints: openColumns.map((column) => {
        const columnIndex = Number(column.id.slice(1)) - 1;
        const rows = world.ships.filter((ship) => ship.column === columnIndex).map((ship) => ship.row);
        return {
          id: column.dropPointId,
          distanceFromHighestShip: rows.length > 0
            ? Math.min(...rows) - publicMap.sky.dropRow
            : Number.POSITIVE_INFINITY,
        };
      }),
    },
  };
}

function applyMothershipAction(world, publicMap, patch) {
  if (patch.actionType === "spawn_white") {
    const limit = publicMap.whiteShipPool || 4;
    const active = [...world.ships, ...world.waitingShips]
      .filter((ship) => ship.color === "white").length;
    const amount = Math.min(patch.amount, Math.max(0, limit - active));
    for (let index = 0; index < amount; index += 1) {
      world.waitingShips.push({ id: `white-${world.nextWhiteId}`, color: "white" });
      world.nextWhiteId += 1;
    }
  } else if (patch.actionType === "damage") {
    world.damage += patch.amount;
  } else if (patch.actionType === "research_back") {
    world.researchIndex = Math.max(0, world.researchIndex - patch.amount);
  } else if (patch.actionType === "excavator_back") {
    world.excavatorIndex = Math.max(publicMap.base.startExcavatorIndex, world.excavatorIndex - patch.amount);
  } else {
    throw new Error(`unsupported imagined mothership action: ${patch.actionType}`);
  }
}

function suspended({ reason, status, world, trace, observedBefore, initialPublicState, pending }) {
  return {
    schema: "ufs_one_round_imagination_result_v0",
    status,
    reason,
    pending,
    imaginedWorld: clone(world),
    trace,
    observedWorldUnchanged: unchanged(initialPublicState, observedBefore),
  };
}

class UfsOneRoundImagination {
  constructor({
    placementImagination = new UfsFirstActionImagination(),
    eventImagination = new UfsEventRuleImagination(),
    eventPerception = null,
    attentionProvider = new UfsFullAttentionProvider(),
  } = {}) {
    this.placementImagination = placementImagination;
    this.eventImagination = eventImagination;
    this.eventPerception = eventPerception;
    this.attentionProvider = attentionProvider;
  }

  run({
    initialPublicState,
    publicMap,
    script,
    randomObservations = {},
    attentionSeed = 20260824,
    allowPartialScript = false,
    decisionOrigin = "fixed_test_script",
    choiceOrigin = "fixed_test_choice",
  }) {
    const observedBefore = clone(initialPublicState);
    this.attentionProvider.beginEpisode();
    const world = clone(initialPublicState);
    const indexes = mapIndexes(publicMap);
    const noticedRooms = new Map();
    const trace = {
      placements: [],
      randomBoundaries: [],
      roomSteps: [],
      mothershipSteps: [],
      administrativeTransitions: [],
    };
    let attentionStep = 0;
    const nextAttentionSeed = () => attentionSeed + attentionStep++;
    const runEvent = (event, observedState, scope) => {
      const fullPerception = this.attentionProvider.noticeEvent({
        fullWorld: world,
        publicMap,
        event,
        observedState,
        scope,
        randomSeed: nextAttentionSeed(),
      });
      return eventStep(
        this.eventImagination,
        event,
        observedState,
        this.eventPerception,
        scope,
        fullPerception,
      );
    };
    if (world.phase !== "dice") throw new Error("one-round imagination must start in dice phase");
    if (!script || !Array.isArray(script.placements) || !Array.isArray(script.roomActions)) {
      throw new TypeError("one-round imagination needs a scripted placement and room sequence");
    }

    for (const row of script.placements) {
      const selectedAction = scriptedAction(row, world);
      const globalAttention = this.attentionProvider.noticePlacement({
        publicState: world,
        publicMap,
        selectedAction,
        randomSeed: nextAttentionSeed(),
      });
      const result = this.placementImagination.run({
        publicState: world,
        publicMap,
        selectedAction,
        globalAttention,
      });
      trace.placements.push({
        decisionOrigin,
        selectedAction: clone(selectedAction),
        status: result.status,
        reason: result.reason,
        cognitiveTrace: result.trace,
      });
      if (!["choice", "complete"].includes(result.status)) {
        return suspended({
          status: result.status,
          reason: result.reason,
          world,
          trace,
          observedBefore,
          initialPublicState,
          pending: { type: "placement", dieId: selectedAction.dieId },
        });
      }
      if (result.imaginedConsequences.room?.roomId) {
        noticedRooms.set(result.imaginedConsequences.room.roomId, clone(result.imaginedConsequences.room));
      }
      Object.assign(world, clone(result.imaginedState));

      if (selectedAction.dieColor === "white" && world.dice.some((die) => !die.placed)) {
        const randomResult = runEvent(
          { type: "die_placed", dieColor: "white" },
          { dice: world.dice },
          { phase: "dice", stage: "white_reroll", dieId: selectedAction.dieId },
        );
        const observationKey = `after:${selectedAction.dieId}`;
        const observation = randomObservations[observationKey];
        trace.randomBoundaries.push({
          afterDieId: selectedAction.dieId,
          status: randomResult.status,
          patch: randomResult.patch,
          cognitiveTrace: randomResult.trace,
          resumedBy: observation ? "external_observation" : null,
        });
        if (randomResult.status !== "random") {
          return suspended({
            status: randomResult.status,
            reason: randomResult.reason,
            world,
            trace,
            observedBefore,
            initialPublicState,
            pending: { type: "white_reroll" },
          });
        }
        if (!observation) {
          return suspended({
            status: "random",
            reason: "waiting_for_actual_reroll",
            world,
            trace,
            observedBefore,
            initialPublicState,
            pending: {
              type: "white_reroll",
              ...(allowPartialScript ? { afterDieId: selectedAction.dieId } : {}),
              dieIds: randomResult.patch.dieIds,
            },
          });
        }
        for (const dieId of randomResult.patch.dieIds) {
          if (!Number.isInteger(observation[dieId]) || observation[dieId] < 1 || observation[dieId] > 6) {
            throw new Error(`external reroll observation missing a d6 value for ${dieId}`);
          }
          world.dice.find((die) => die.id === dieId).value = observation[dieId];
        }
      }
    }

    if (!world.dice.every((die) => die.placed)) {
      if (allowPartialScript) {
        return suspended({
          status: "choice",
          reason: "waiting_for_die_placement",
          world,
          trace,
          observedBefore,
          initialPublicState,
          pending: { type: "place_die" },
        });
      }
      throw new Error("script ended before all five dice were placed");
    }
    world.phase = "rooms";
    trace.administrativeTransitions.push({
      from: "dice",
      to: "rooms",
      cause: "all_dice_placed",
      trajectoryDriven: false,
    });

    for (const action of script.roomActions) {
      if (action.type === "resolve_room") {
        const room = indexes.roomById.get(action.roomId);
        if (!room) throw new Error(`unknown scripted room: ${action.roomId}`);
        const sources = roomSources(world, room);
        if (!sources) throw new Error(`scripted room is incomplete: ${room.id}`);
        const noticedRoom = noticedRooms.get(room.id);
        if (!noticedRoom?.complete || !Number.isFinite(noticedRoom.roomValue)) {
          throw new Error(`no complete remembered room patch for: ${room.id}`);
        }
        const roomValue = noticedRoom.roomValue;
        const payment = runEvent(
          { type: "room_resolution", stage: "payment" },
          { room: { type: room.type, energyCost: room.energyCost }, player: { energy: world.energy } },
          { phase: "rooms", stage: "payment", roomId: room.id },
        );
        const paymentTrace = {
          action: clone(action),
          stage: "payment",
          status: payment.status,
          patch: payment.patch,
          cognitiveTrace: payment.trace,
          resumedBy: action.pay === true ? choiceOrigin : null,
        };
        trace.roomSteps.push(paymentTrace);
        if (payment.status !== "choice" || action.pay !== true) {
          return suspended({
            status: payment.status,
            reason: action.pay === true ? payment.reason : "waiting_for_room_payment_choice",
            world,
            trace,
            observedBefore,
            initialPublicState,
            pending: { type: "room_payment", roomId: room.id },
          });
        }
        if (!payment.patch.canPay) throw new Error(`script chose unaffordable room: ${room.id}`);
        world.energy -= payment.patch.energyCost;

        let effectState;
        if (room.type === "energy") {
          effectState = {
            room: { type: room.type, value: roomValue },
            player: { energy: world.energy, energyCap: publicMap.city.maxEnergy },
          };
        } else if (room.type === "fighter") {
          effectState = { room: { type: room.type, value: roomValue }, explosionShips: explosionShips(world, indexes) };
        } else if (room.type === "research") {
          effectState = {
            room: { type: room.type, value: roomValue },
            research: { costsAhead: publicMap.research.costs.slice(world.researchIndex) },
          };
        } else {
          throw new Error(`one-round cognitive room reducer does not support ${room.type}`);
        }
        const effect = runEvent(
          { type: "room_resolution", stage: "effect" },
          effectState,
          { phase: "rooms", stage: "effect", roomId: room.id, roomType: room.type },
        );
        const effectTrace = {
          action: clone(action), stage: "effect", status: effect.status,
          patch: effect.patch, cognitiveTrace: effect.trace,
          roomInputOrigin: "remembered_placement_room_patch",
        };
        trace.roomSteps.push(effectTrace);
        const researchChoice = room.type === "research"
          && effect.status === "choice"
          && effect.patch?.kind === "research_room_choice";
        if (effect.status !== "automatic" && !researchChoice) {
          return suspended({ status: effect.status, reason: effect.reason, world, trace,
            observedBefore, initialPublicState, pending: { type: "room_effect", roomId: room.id } });
        }
        if (researchChoice && action.advanceSteps == null) {
          const maxAdvanceSteps = maximumResearchAdvance(
            effect.patch.continuousCosts,
            effect.patch.budget,
          );
          return suspended({
            status: "choice",
            reason: effect.reason,
            world,
            trace,
            observedBefore,
            initialPublicState,
            pending: {
              type: "room_effect",
              effectKind: "research_room_choice",
              roomId: room.id,
              budget: effect.patch.budget,
              continuousCosts: clone(effect.patch.continuousCosts),
              maxAdvanceSteps,
            },
          });
        }
        if (researchChoice) {
          const maxAdvanceSteps = maximumResearchAdvance(
            effect.patch.continuousCosts,
            effect.patch.budget,
          );
          if (!Number.isInteger(action.advanceSteps)
            || action.advanceSteps < 0
            || action.advanceSteps > maxAdvanceSteps) {
            throw new Error(`illegal research advance: ${action.advanceSteps}/${maxAdvanceSteps}`);
          }
          world.researchIndex += action.advanceSteps;
          effectTrace.selectedAdvanceSteps = action.advanceSteps;
          effectTrace.maxAdvanceSteps = maxAdvanceSteps;
          effectTrace.resumedBy = choiceOrigin;
          effectTrace.status = "choice_resumed";
        }
        if (effect.patch.kind === "energy_room_result") {
          world.energy = effect.patch.energyAfter;
        } else if (effect.patch.kind === "fighter_room_result") {
          for (const shipId of effect.patch.eligibleShipIds) {
            const ship = world.ships.find((candidate) => candidate.id === shipId);
            world.ships = world.ships.filter((candidate) => candidate.id !== shipId);
            // Destroying a purple enemy returns that physical token to the
            // mothership queue; white tokens leave play.
            if (ship?.color === "purple") world.waitingShips.push({ id: ship.id, color: ship.color });
          }
        }
        consumeSources(world, sources);

        if (researchChoice && world.researchIndex >= publicMap.research.costs.length) {
          const top = runEvent(
            { type: "research_position_changed" },
            { research: { atTop: true } },
            { phase: "rooms", stage: "research_top", roomId: room.id, roomType: room.type },
          );
          trace.roomSteps.push({
            action: clone(action), stage: "research_top", status: top.status,
            patch: top.patch, cognitiveTrace: top.trace,
          });
          if (top.status === "complete") {
            world.outcome = { result: top.patch.result, reason: top.patch.reason, round: world.round };
            world.phase = top.patch.result === "win" ? "won" : "lost";
            return suspended({ status: "complete", reason: top.patch.reason, world, trace,
              observedBefore, initialPublicState, pending: null });
          }
          if (top.status !== "automatic") {
            return suspended({ status: top.status, reason: top.reason, world, trace,
              observedBefore, initialPublicState, pending: { type: "research_top" } });
          }
        }
      } else if (action.type === "excavate") {
        const placement = world.placements.find((row) => row.id === action.placementId && !row.resolved);
        if (!placement?.excavationCandidate) throw new Error(`invalid scripted excavation: ${action.placementId}`);
        const targetIndex = indexes.cellById.get(placement.cellId).unlockIndex;
        const result = runEvent(
          { type: "excavation_selected", dieId: placement.dieId },
          {
            excavation: {
              targetIndex,
              pathIndicesBehind: Array.from(
                { length: Math.max(0, targetIndex - world.excavatorIndex) },
                (_, offset) => world.excavatorIndex + offset + 1,
              ),
            },
          },
          { phase: "rooms", stage: "excavation", placementId: placement.id },
        );
        trace.roomSteps.push({ action: clone(action), stage: "effect", status: result.status, patch: result.patch, cognitiveTrace: result.trace });
        if (result.status !== "automatic") {
          return suspended({ status: result.status, reason: result.reason, world, trace, observedBefore, initialPublicState, pending: { type: "excavation" } });
        }
        world.energy += result.patch.energyDelta;
        world.excavatorIndex = result.patch.excavatorTargetIndex;
        placement.resolved = true;
      } else if (action.type === "skip_worker") {
        const placement = world.placements.find((row) => row.id === action.placementId && !row.resolved);
        if (!placement) throw new Error(`invalid scripted skip: ${action.placementId}`);
        placement.resolved = true;
        trace.roomSteps.push({ action: clone(action), stage: "decision", status: "choice_resumed", resumedBy: choiceOrigin, trajectoryDriven: false });
      } else if (action.type === "end_rooms") {
        world.placements.forEach((placement) => { placement.resolved = true; });
        world.robots.forEach((robot) => { robot.exhausted = false; });
        world.phase = "mothership";
        trace.administrativeTransitions.push({ from: "rooms", to: "mothership", cause: "scripted_end_rooms", trajectoryDriven: false });
      } else {
        throw new Error(`unsupported scripted room action: ${action.type}`);
      }
    }

    if (world.phase !== "mothership") {
      if (allowPartialScript) {
        return suspended({
          status: "choice",
          reason: "waiting_for_room_action",
          world,
          trace,
          observedBefore,
          initialPublicState,
          pending: { type: "room_action" },
        });
      }
      throw new Error("room script did not enter mothership phase");
    }
    const descent = runEvent(
      { type: "phase_started" },
      { phase: "mothership", mothership: { row: world.mothershipRow }, sky: { shipsByRow: shipsByRow(world) } },
      { phase: "mothership", stage: "descent" },
    );
    trace.mothershipSteps.push({ stage: "descent", status: descent.status, patch: descent.patch, cognitiveTrace: descent.trace });
    if (descent.status !== "automatic") {
      return suspended({ status: descent.status, reason: descent.reason, world, trace, observedBefore, initialPublicState, pending: { type: "mothership_descent" } });
    }
    world.mothershipRow = descent.patch.toRow;
    for (const shipId of descent.patch.collectedShipIds) {
      const ship = world.ships.find((row) => row.id === shipId);
      world.ships = world.ships.filter((row) => row.id !== shipId);
      if (ship) world.waitingShips.push({ id: ship.id, color: ship.color });
    }

    const threshold = runEvent(
      { type: "mothership_threshold_check" },
      { mothership: { onSkullRow: world.mothershipRow >= publicMap.sky.skullRow } },
      { phase: "mothership", stage: "threshold" },
    );
    trace.mothershipSteps.push({ stage: "threshold", status: threshold.status, patch: threshold.patch, cognitiveTrace: threshold.trace });
    if (threshold.patch.terminal) {
      world.outcome = { result: threshold.patch.result, reason: threshold.patch.reason, round: world.round };
      world.phase = threshold.patch.result === "win" ? "won" : "lost";
      return suspended({ status: "complete", reason: threshold.patch.reason, world, trace, observedBefore, initialPublicState, pending: null });
    }

    const row = indexes.skyRowByIndex.get(world.mothershipRow);
    for (const action of row?.mothershipActions || []) {
      const result = runEvent(
        { type: "mothership_descent_completed" },
        { mothership: { rowAction: { type: action.type, value: action.amount } } },
        { phase: "mothership", stage: "row_action", actionType: action.type },
      );
      trace.mothershipSteps.push({ stage: "row_action", status: result.status, patch: result.patch, cognitiveTrace: result.trace });
      if (result.status !== "automatic") {
        return suspended({ status: result.status, reason: result.reason, world, trace, observedBefore, initialPublicState, pending: { type: "mothership_row_action" } });
      }
      applyMothershipAction(world, publicMap, result.patch);
    }

    const orderedWaiting = [...world.waitingShips]
      .sort((left, right) => (left.color === "purple" ? 0 : 1) - (right.color === "purple" ? 0 : 1));
    world.waitingShips = [];
    for (const waiting of orderedWaiting) {
      const state = spawnState(world, publicMap);
      const result = runEvent(
        { type: "spawn_started", shipId: waiting.id },
        state,
        { phase: "mothership", stage: "spawn", shipId: waiting.id },
      );
      const requested = script.spawnChoices?.[waiting.id] || null;
      const candidates = result.patch?.candidateDropPointIds || [];
      const chosen = candidates.length === 1 ? candidates[0] : requested;
      trace.mothershipSteps.push({
        stage: "spawn", shipId: waiting.id, status: result.status,
        patch: result.patch, cognitiveTrace: result.trace,
        chosenDropPointId: chosen,
        resumedBy: result.status === "choice" && chosen ? choiceOrigin : null,
      });
      if (!chosen) {
        world.waitingShips.push(waiting);
        return suspended({ status: result.status, reason: "waiting_for_spawn_choice", world, trace, observedBefore, initialPublicState, pending: { type: "spawn", shipId: waiting.id, candidates } });
      }
      if (!candidates.includes(chosen)) throw new Error(`script chose illegal spawn point ${chosen} for ${waiting.id}`);
      world.ships.push({
        id: waiting.id,
        color: waiting.color,
        column: Number(chosen.slice("DP-C".length)) - 1,
        row: publicMap.sky.dropRow,
      });
    }

    world.phase = "new_round";
    trace.administrativeTransitions.push({ from: "mothership", to: "new_round", cause: "mothership_phase_complete", trajectoryDriven: false });
    if (!unchanged(initialPublicState, observedBefore)) throw new Error("one-round imagination mutated observed world");
    return {
      schema: "ufs_one_round_imagination_result_v0",
      status: "complete",
      reason: "one_round_imagined_to_next_round_boundary",
      pending: null,
      imaginedWorld: clone(world),
      observedWorldUnchanged: true,
      trace,
    };
  }
}

module.exports = {
  UfsOneRoundImagination,
  roomSources,
  maximumResearchAdvance,
  spawnState,
};
