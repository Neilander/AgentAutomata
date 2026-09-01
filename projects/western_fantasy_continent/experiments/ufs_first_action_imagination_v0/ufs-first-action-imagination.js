"use strict";

const {
  ImaginationPipeline,
} = require("../imagination_pipeline_v0/imagination-pipeline");
const {
  PlacementRuleImagination,
} = require("./placement-rule-imagination");
const { UfsEventRuleImagination } = require("./ufs-event-rule-imagination");
const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");

function clone(value) {
  return structuredClone(value);
}

function normalizeUncertainty(row) {
  return row?.value?.schema === "unknown_information_v0" ? row.value : row;
}

function mergeUncertainties(...groups) {
  const bySlot = new Map();
  for (const row of groups.flat().filter(Boolean).map(normalizeUncertainty)) {
    const key = row?.slot || JSON.stringify(row);
    bySlot.set(key, clone(row));
  }
  return [...bySlot.values()];
}

function columnLabel(column) {
  return `C${column + 1}`;
}

function visibleTileKind(cell) {
  if (cell.effect?.type === "arrow") return "arrow";
  if (cell.effect?.type === "mothership_down") return "mothership";
  return "normal";
}

function buildSkyWorld(publicState, publicMap) {
  const tiles = [];
  for (const row of publicMap.sky.rows) {
    row.cells.forEach((cell, column) => {
      const tile = {
        column: columnLabel(column),
        row: row.index,
        kind: visibleTileKind(cell),
      };
      if (cell.effect?.type === "arrow") {
        tile.targetColumn = columnLabel(cell.effect.targetColumn);
        tile.targetRow = cell.effect.targetRow;
      }
      tiles.push(tile);
    });
  }
  for (let column = 0; column < publicMap.columns; column += 1) {
    tiles.push({
      column: columnLabel(column),
      row: publicMap.sky.cityRow,
      kind: "city",
    });
  }
  return {
    objects: publicState.ships.map((ship) => ({
      id: ship.id,
      color: ship.color,
      column: columnLabel(ship.column),
      row: ship.row,
      frozen: false,
      city_distance: publicMap.sky.cityRow - ship.row,
    })),
    tiles,
    city: {
      health: publicMap.city.maxDamage - publicState.damage,
    },
    uncertainties: clone(publicState.uncertainties || []),
  };
}

function applySelectedPlacementShell(publicState, selectedAction, cell, room) {
  const imaginedState = clone(publicState);
  const die = imaginedState.dice.find((candidate) => candidate.id === selectedAction.dieId);
  die.placed = true;
  imaginedState.placements.push({
    id: `${selectedAction.dieId}@${selectedAction.cellId}`,
    dieId: selectedAction.dieId,
    dieColor: selectedAction.dieColor,
    dieValue: selectedAction.dieValue,
    cellId: selectedAction.cellId,
    roomId: room.id,
    roomType: room.type,
    column: cell.column,
    excavationCandidate: cell.unlockIndex > publicState.excavatorIndex,
    excavationDistance: Math.max(0, cell.unlockIndex - publicState.excavatorIndex),
    removesRobotId: null,
    resolved: false,
  });
  return imaginedState;
}

function applyPlacementToImaginedState(publicState, publicMap, selectedAction, cell, room, skyResult) {
  const imaginedState = applySelectedPlacementShell(publicState, selectedAction, cell, room);
  for (const ship of imaginedState.ships) {
    const imaginedShip = skyResult.imaginedWorld.objects.find((object) => object.id === ship.id);
    if (!imaginedShip) throw new Error(`imagined sky lost ship: ${ship.id}`);
    ship.column = Number(imaginedShip.column.slice(1)) - 1;
    ship.row = imaginedShip.row;
  }
  imaginedState.damage = Math.max(
    0,
    publicMap.city.maxDamage - skyResult.imaginedWorld.city.health,
  );
  imaginedState.uncertainties = mergeUncertainties(
    publicState.uncertainties || [],
    skyResult.imaginedWorld.uncertainties || [],
  );
  return imaginedState;
}

function skyCellAt(publicMap, rowIndex, column) {
  return publicMap.sky.rows.find((row) => row.index === rowIndex)?.cells?.[column] || null;
}

function collectShipsAtMothershipRow(imaginedState) {
  const collected = imaginedState.ships
    .filter((ship) => ship.row === imaginedState.mothershipRow);
  if (collected.length === 0) return [];
  const collectedIds = new Set(collected.map((ship) => ship.id));
  imaginedState.ships = imaginedState.ships
    .filter((ship) => !collectedIds.has(ship.id));
  imaginedState.waitingShips ||= [];
  imaginedState.waitingShips.push(...collected.map((ship) => ({
    id: ship.id,
    color: ship.color,
  })));
  return collected.map((ship) => ship.id);
}

function movedShips(before, after) {
  return after.ships.filter((ship) => {
    const prior = before.ships.find((candidate) => candidate.id === ship.id);
    return prior && (prior.column !== ship.column || prior.row !== ship.row);
  });
}

function cityContactShipIds(skyResult) {
  return [...new Set((skyResult.trace.groundings || [])
    .filter((row) => row.committed && row.trajectoryId === "RULE-LANDED-CITY-DAMAGE")
    .flatMap((row) => row.objectIds || []))];
}

class UfsFirstActionImagination {
  constructor({
    pipeline = new ImaginationPipeline(),
    placementRuleImagination = new PlacementRuleImagination(),
    eventRuleImagination = new UfsEventRuleImagination(),
    attentionProvider = new UfsFullAttentionProvider(),
  } = {}) {
    this.pipeline = pipeline;
    this.placementRuleImagination = placementRuleImagination;
    this.eventRuleImagination = eventRuleImagination;
    this.attentionProvider = attentionProvider;
  }

  run({
    publicState,
    publicMap,
    selectedAction,
    placementPerceptionBudget = 30,
    globalAttention = null,
    attentionSeed = 20260824,
  }) {
    const observedBefore = clone(publicState);
    if (publicState.phase !== "dice") throw new Error("first-action imagination requires dice phase");
    if (!globalAttention) this.attentionProvider.beginEpisode();
    const effectiveGlobalAttention = globalAttention || this.attentionProvider.noticePlacement({
      publicState,
      publicMap,
      selectedAction,
      randomSeed: attentionSeed,
    });
    const placementThought = this.placementRuleImagination.run({
      publicState,
      publicMap,
      selectedAction,
      perceptionBudget: placementPerceptionBudget,
      globalAttention: effectiveGlobalAttention,
    });
    const { die, cell, room } = placementThought.context;
    if (placementThought.status !== "automatic") {
      const observedWorldUnchanged = JSON.stringify(publicState) === JSON.stringify(observedBefore);
      return {
        schema: "ufs_first_action_imagination_result_v0",
        status: placementThought.status,
        reason: placementThought.reason,
        selectedAction: clone(selectedAction),
        imaginedConsequences: placementThought.imaginedConsequences,
        observedWorldUnchanged,
        imaginedState: clone(publicState),
        remainingDice: publicState.dice.filter((candidate) => !candidate.placed),
        stoppedBeforeSecondAction: false,
        nextAction: null,
        trace: {
          placementRules: placementThought.trace,
          sky: null,
          boundary: { kind: placementThought.status, reason: placementThought.reason },
        },
      };
    }
    let excavationPlacementLegality = null;
    if (cell.unlockIndex > publicState.excavatorIndex) {
      excavationPlacementLegality = this.eventRuleImagination.run({
        event: { type: "excavation_placement_considered", dieValue: die.value },
        observedState: {
          excavation: { pathDistance: cell.unlockIndex - publicState.excavatorIndex },
          round: {
            usedUnexcavatedPlacement: publicState.placements.some(
              (placement) => !placement.resolved && placement.excavationCandidate,
            ),
          },
        },
      });
      if (excavationPlacementLegality.status !== "automatic"
        || excavationPlacementLegality.patch?.kind !== "excavation_placement_legality") {
        throw new Error(`excavation placement legality was not resolved: ${selectedAction.cellId}`);
      }
      if (!excavationPlacementLegality.patch.legal) {
        throw new Error(`illegal_unexcavated_placement:${selectedAction.cellId}`);
      }
    }
    const actualDescent = placementThought.imaginedConsequences.movement?.amount;
    if (!Number.isInteger(actualDescent)) {
      const imaginedState = applySelectedPlacementShell(publicState, selectedAction, cell, room);
      imaginedState.uncertainties = mergeUncertainties(
        publicState.uncertainties || [],
        placementThought.trace.confusions || [],
      );
      const remainingDice = imaginedState.dice.filter((candidate) => !candidate.placed);
      const observedWorldUnchanged = JSON.stringify(publicState) === JSON.stringify(observedBefore);
      return {
        schema: "ufs_first_action_imagination_result_v0",
        status: "choice",
        reason: "next_player_decision_with_uncertain_automatic_consequence",
        selectedAction: clone(selectedAction),
        imaginedConsequences: placementThought.imaginedConsequences,
        observedWorldUnchanged,
        imaginedState,
        remainingDice,
        stoppedBeforeSecondAction: true,
        nextAction: null,
        trace: {
          placementRules: placementThought.trace,
          sky: null,
          boundary: {
            kind: "choice",
            reason: "confusion_did_not_end_decision_flow",
          },
        },
      };
    }
    const skyWorld = buildSkyWorld(publicState, publicMap);
    const skyResult = this.pipeline.run({
      world: skyWorld,
      action: {
        type: "place_die",
        dieId: die.id,
        cellId: selectedAction.cellId,
        column: columnLabel(cell.column),
        amount: actualDescent,
        selection: "all",
      },
      perceptionBudget: 40,
      imaginationBudget: 20,
      externalAttention: effectiveGlobalAttention,
    });
    const imaginedState = applyPlacementToImaginedState(
      publicState,
      publicMap,
      selectedAction,
      cell,
      room,
      skyResult,
    );
    const landingEvents = [];
    let landingBoundary = null;
    if (skyResult.status === "complete") {
      const noticedItems = new Set(effectiveGlobalAttention.noticedItemIds || []);
      const queriedAtoms = new Set(
        (skyResult.trace.attention.queryAcquired || []).map((row) => row.id),
      );
      for (const shipId of cityContactShipIds(skyResult)) {
        const ship = imaginedState.ships.find((candidate) => candidate.id === shipId);
        if (!ship) continue;
        const result = this.eventRuleImagination.run({
          event: { type: "ship_landed", shipId },
          observedState: { tile: { kind: "city" } },
        });
        landingEvents.push({
          shipId,
          tile: { row: publicMap.sky.cityRow, column: ship.column, kind: "city" },
          status: result.status,
          reason: result.reason,
          patch: clone(result.patch),
          damageApplication: "already_committed_by_landed_city_trajectory",
          cognitiveTrace: clone(result.trace),
        });
        if (result.status !== "automatic" || result.patch?.kind !== "city_contact") {
          landingBoundary = { status: result.status, reason: result.reason };
          break;
        }
        imaginedState.ships = imaginedState.ships.filter((candidate) => candidate.id !== shipId);
        imaginedState.waitingShips ||= [];
        imaginedState.waitingShips.push({ id: ship.id, color: ship.color });
      }
      if (!landingBoundary) {
        for (const ship of movedShips(publicState, imaginedState)) {
          const landingItemId = `sky_cell:${ship.row}:${ship.column}`;
          const landingKindAtom = `tile:${columnLabel(ship.column)}:${ship.row}.kind`;
          if (!noticedItems.has(landingItemId) && !queriedAtoms.has(landingKindAtom)) continue;
          const landingCell = skyCellAt(publicMap, ship.row, ship.column);
          if (landingCell?.effect?.type !== "mothership_down") continue;
          const result = this.eventRuleImagination.run({
            event: { type: "ship_landed", shipId: ship.id },
            observedState: {
              tile: { kind: "mothership_down" },
              mothership: { row: imaginedState.mothershipRow },
            },
            externalAttention: {
              noticedPaths: noticedItems.has("track:mothershipRow") ? ["mothership.row"] : [],
            },
          });
          landingEvents.push({
            shipId: ship.id,
            tile: { row: ship.row, column: ship.column, kind: "mothership_down" },
            status: result.status,
            reason: result.reason,
            patch: clone(result.patch),
            cognitiveTrace: clone(result.trace),
          });
          if (result.status === "automatic" && result.patch?.kind === "uncertain_event_effect") {
            imaginedState.uncertainties = mergeUncertainties(
              imaginedState.uncertainties || [],
              result.patch.confusions || [],
            );
            continue;
          }
          if (result.status !== "automatic" || result.patch?.kind !== "move_mothership") {
            landingBoundary = { status: result.status, reason: result.reason };
            break;
          }
          imaginedState.mothershipRow = result.patch.toRow;
          landingEvents.at(-1).transitionConsequences = {
            collectedShipIds: collectShipsAtMothershipRow(imaginedState),
          };
        }
      }
    }
    const remainingDice = imaginedState.dice.filter((candidate) => !candidate.placed);
    let status = landingBoundary?.status || skyResult.status;
    let reason = landingBoundary?.reason || skyResult.reason;
    if (!landingBoundary && skyResult.status === "complete" && remainingDice.length > 0) {
      status = "choice";
      reason = "next_player_decision";
    }
    const observedWorldUnchanged = JSON.stringify(publicState) === JSON.stringify(observedBefore);
    if (!observedWorldUnchanged) throw new Error("imagination mutated public observed state");
    return {
      schema: "ufs_first_action_imagination_result_v0",
      status,
      reason,
      selectedAction: clone(selectedAction),
      imaginedConsequences: {
        movement: placementThought.imaginedConsequences.movement,
        skyStatus: skyResult.status,
        landingEvents: landingEvents.map((row) => ({
          shipId: row.shipId,
          tile: row.tile,
          status: row.status,
          patch: row.patch,
        })),
        room: placementThought.imaginedConsequences.room,
      },
      observedWorldUnchanged,
      imaginedState,
      remainingDice: remainingDice.map((candidate) => ({
        id: candidate.id,
        color: candidate.color,
        value: candidate.value,
      })),
      stoppedBeforeSecondAction: status === "choice" && reason === "next_player_decision",
      nextAction: null,
      trace: {
        placementRules: placementThought.trace,
        excavationPlacementLegality: excavationPlacementLegality ? {
          status: excavationPlacementLegality.status,
          patch: clone(excavationPlacementLegality.patch),
          cognitiveTrace: clone(excavationPlacementLegality.trace),
        } : null,
        sky: skyResult.trace,
        landingEvents,
        boundary: {
          kind: status,
          reason,
        },
      },
    };
  }
}

module.exports = {
  UfsFirstActionImagination,
  buildSkyWorld,
};
