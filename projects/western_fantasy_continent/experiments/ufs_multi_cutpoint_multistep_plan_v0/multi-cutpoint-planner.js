"use strict";

function clone(value) {
  return structuredClone(value);
}

function threatVector(world) {
  const rows = (world.ships || []).map((ship) => Number(ship.row || 0));
  return {
    damage: Number(world.damage || 0),
    maximumShipRow: rows.length > 0 ? Math.max(...rows) : 0,
    totalShipRows: rows.reduce((sum, row) => sum + row, 0),
    activeShipCount: rows.length,
  };
}

function compareThreat(left, right) {
  return left.damage - right.damage
    || left.maximumShipRow - right.maximumShipRow
    || left.totalShipRows - right.totalShipRows;
}

function remainingColumnContext(playerResponse) {
  const cells = playerResponse.mapView?.baseCells || [];
  const usedColumns = new Set((playerResponse.observation?.placements || []).map((placement) => (
    cells.find((cell) => cell.id === placement.cellId)?.column
  )).filter((column) => column != null));
  const allColumns = [...new Set(cells.map((cell) => cell.column))].sort((a, b) => a - b);
  const remainingColumns = allColumns.filter((column) => !usedColumns.has(column));
  if (remainingColumns.length !== 1) {
    throw new Error(`second cut-in expects one remaining column, got ${remainingColumns.length}`);
  }
  const column = remainingColumns[0];
  const excavatorIndex = Number(playerResponse.observation?.excavatorIndex || 0);
  const roomsById = new Map((playerResponse.mapView?.rooms || []).map((room) => [room.id, room]));
  const choices = cells.filter((cell) => cell.column === column
    && Number(cell.unlockIndex || 0) <= excavatorIndex)
    .map((cell) => ({ cell, room: roomsById.get(cell.roomId) }))
    .filter((row) => row.room);
  return {
    column,
    remainingDie: (playerResponse.observation?.dice || []).find((die) => !die.placed) || null,
    ships: (playerResponse.observation?.ships || []).filter((ship) => ship.column === column),
    choices,
  };
}

function chooseSecondCutpoint({
  playerResponse,
  routeActivations,
  imagineCandidate,
} = {}) {
  if (typeof imagineCandidate !== "function") throw new TypeError("imagineCandidate is required");
  const context = remainingColumnContext(playerResponse);
  if (!context.remainingDie) throw new Error("no remaining die at second cut-in");
  const awakenedRoomTypes = new Set((routeActivations || [])
    .filter((row) => row.triggerSideAccepted && row.capability?.roomType)
    .map((row) => row.capability.roomType));
  const candidates = context.choices.filter((row) => awakenedRoomTypes.has(row.room.type))
    .map((row) => {
      const payload = {
        type: "place_die",
        dieId: context.remainingDie.id,
        cellId: row.cell.id,
      };
      const imagined = imagineCandidate(payload);
      return {
        payload,
        roomId: row.room.id,
        roomType: row.room.type,
        imagined,
        threat: threatVector(imagined.world),
      };
    });
  if (candidates.length === 0) throw new Error("no awakened remaining-column anchors");
  candidates.sort((left, right) => compareThreat(left.threat, right.threat)
    || left.roomId.localeCompare(right.roomId));
  return {
    schema: "ufs_environment_replan_cutpoint_v0",
    triggeredBy: "q_before",
    context: clone(context),
    activations: clone(routeActivations),
    candidates,
    selected: clone(candidates[0]),
    searchAudit: {
      cartesianPlacementCandidatesGenerated: 0,
      localAnchorCandidatesGenerated: candidates.length,
      completeContinuationsImagined: candidates.length,
    },
  };
}

function planRoomOrder({ playerResponse, anchorPackage, minimumEnergy = 1 } = {}) {
  if (playerResponse.pending?.type !== "room_action") {
    throw new Error("room-order cut-in requires a room_action boundary");
  }
  const resolvable = new Set(playerResponse.pending.candidates?.resolvableRoomIds || []);
  const supportRoomId = anchorPackage.support?.roomId;
  const researchRoomId = anchorPackage.primary?.roomId;
  if (!resolvable.has(supportRoomId) || !resolvable.has(researchRoomId)) {
    throw new Error("committed support and primary anchors are not both resolvable");
  }
  const currentEnergy = Number(playerResponse.observation.energy || 0);
  const supportGain = Number(anchorPackage.support.expectedEnergyGain || 0);
  const researchCost = 2;
  if (currentEnergy - researchCost < minimumEnergy
    && currentEnergy + supportGain - researchCost < minimumEnergy) {
    throw new Error("energy support cannot make research satisfy the retained constraint");
  }
  const fighterRoom = (playerResponse.mapView.rooms || []).find((room) => (
    room.type === "fighter" && resolvable.has(room.id)
  ));
  const operations = [
    { type: "resolve_room", roomId: supportRoomId, pay: true },
    { type: "resolve_room", roomId: researchRoomId, pay: true },
    { type: "choose_research_advance", roomId: researchRoomId, advanceSteps: "maximum_available" },
  ];
  const energyAfterResearch = currentEnergy + supportGain - researchCost;
  if (fighterRoom && energyAfterResearch - Number(fighterRoom.energyCost || 0) >= minimumEnergy) {
    operations.push({ type: "resolve_room", roomId: fighterRoom.id, pay: true });
  }
  operations.push({ type: "end_rooms" });
  return {
    schema: "ufs_operation_replan_cutpoint_v0",
    triggeredBy: "operation",
    availableRoomIds: [...resolvable],
    dependencyReason: "energy support must resolve before research; fighter is retained only after the research and energy constraints remain feasible",
    operations,
    searchAudit: {
      roomOrderPermutationsGenerated: 0,
      dependencyOrderedOperations: operations.length,
    },
  };
}

module.exports = {
  chooseSecondCutpoint,
  compareThreat,
  planRoomOrder,
  remainingColumnContext,
  threatVector,
};
