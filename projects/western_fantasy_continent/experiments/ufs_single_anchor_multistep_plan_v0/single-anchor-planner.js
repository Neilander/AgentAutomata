"use strict";

function clone(value) {
  return structuredClone(value);
}

function roomCells(room, playerResponse) {
  const byId = new Map((playerResponse.mapView?.baseCells || []).map((cell) => [cell.id, cell]));
  return room.cellIds.map((id) => byId.get(id)).filter(Boolean);
}

function accessibleRooms(playerResponse) {
  const excavatorIndex = Number(playerResponse.observation?.excavatorIndex || 0);
  return (playerResponse.mapView?.rooms || []).filter((room) => {
    const cells = roomCells(room, playerResponse);
    return cells.length === room.cellIds.length
      && cells.every((cell) => Number(cell.unlockIndex || 0) <= excavatorIndex);
  });
}

function capabilitySet(intentActivations, environmentActivations) {
  return new Set([...intentActivations, ...environmentActivations]
    .filter((row) => row.triggerSideAccepted && row.capability)
    .map((row) => row.capability.id));
}

function bestRoom(rooms, type) {
  return rooms.filter((room) => room.type === type).sort((left, right) => (
    Number(left.energyCost || 0) - Number(right.energyCost || 0)
      || Number(right.modifier || 0) - Number(left.modifier || 0)
      || left.id.localeCompare(right.id)
  ))[0] || null;
}

function sortedDice(playerResponse, color) {
  return (playerResponse.observation?.dice || [])
    .filter((die) => die.placed === false && (!color || die.color === color))
    .sort((left, right) => Number(right.value) - Number(left.value)
      || left.id.localeCompare(right.id));
}

function buildSingleAnchorPlan({
  playerResponse,
  intent,
  intentActivations = [],
  environmentActivations = [],
} = {}) {
  if (!playerResponse || playerResponse.pending?.type !== "place_die") {
    throw new Error("single-anchor pilot requires a real die-placement boundary");
  }
  if (!intent?.primary?.desiredTrack) throw new TypeError("macro intent is required");

  const capabilities = capabilitySet(intentActivations, environmentActivations);
  if (!capabilities.has("research_room_advances_track")) {
    throw new Error("neither activation group awakened a research method");
  }
  const rooms = accessibleRooms(playerResponse);
  const researchRoom = bestRoom(rooms, "research");
  if (!researchRoom) throw new Error("no currently accessible visible research room");

  const gray = sortedDice(playerResponse, "gray");
  const white = sortedDice(playerResponse, "white");
  const primaryDie = gray.shift();
  if (!primaryDie) throw new Error("pilot requires one non-reroll die for the primary anchor");

  const minimumEnergy = Number(intent.constraints?.find((row) => row.track === "energy")
    ?.minimumAfterPlannedRoomEffects ?? 0);
  const currentEnergy = Number(playerResponse.observation.energy || 0);
  const directEnergyAfterResearch = currentEnergy - Number(researchRoom.energyCost || 0);
  let supportRoom = null;
  const supportAssignments = [];
  let expectedEnergyGain = 0;
  if (directEnergyAfterResearch < minimumEnergy) {
    if (!capabilities.has("energy_room_generates_energy")) {
      throw new Error("research anchor violates energy constraint and no energy method was awakened");
    }
    supportRoom = rooms.filter((room) => room.type === "energy")
      .filter((room) => room.cellIds.length <= gray.length)
      .sort((left, right) => right.cellIds.length - left.cellIds.length
        || Number(right.modifier || 0) - Number(left.modifier || 0)
        || left.id.localeCompare(right.id))[0] || null;
    if (!supportRoom) throw new Error("no accessible energy support room can be completed without reroll");
    const supportDice = gray.splice(0, supportRoom.cellIds.length).sort((a, b) => (
      Number(a.value) - Number(b.value) || a.id.localeCompare(b.id)
    ));
    supportRoom.cellIds.forEach((cellId, index) => {
      supportAssignments.push({ die: supportDice[index], cellId });
    });
    expectedEnergyGain = supportDice.reduce((sum, die) => sum + Number(die.value), 0)
      + Number(supportRoom.modifier || 0);
  }

  const primaryCell = researchRoom.cellIds[0];
  const usedCells = new Set([...supportAssignments.map((row) => row.cellId), primaryCell]);
  const usedColumns = new Set([...usedCells].map((cellId) => (
    playerResponse.mapView.baseCells.find((cell) => cell.id === cellId).column
  )));
  const remainingDice = [...gray, ...white];
  const secondaryAssignments = [];
  for (const role of intent.secondaryRoleOrder || []) {
    if (remainingDice.length === 0) break;
    const room = rooms.filter((candidate) => candidate.type === role)
      .flatMap((candidate) => roomCells(candidate, playerResponse)
        .map((cell) => ({ room: candidate, cell })))
      .filter(({ cell }) => !usedCells.has(cell.id) && !usedColumns.has(cell.column))
      .sort((left, right) => left.cell.column - right.cell.column
        || left.room.id.localeCompare(right.room.id))[0];
    if (!room) continue;
    const die = remainingDice.shift();
    secondaryAssignments.push({ die, cellId: room.cell.id, room: room.room });
    usedCells.add(room.cell.id);
    usedColumns.add(room.cell.column);
  }
  if (remainingDice.length > 0) {
    const fillers = rooms.flatMap((room) => roomCells(room, playerResponse)
      .map((cell) => ({ room, cell })))
      .filter(({ cell }) => !usedCells.has(cell.id) && !usedColumns.has(cell.column))
      .sort((left, right) => left.cell.column - right.cell.column
        || left.room.id.localeCompare(right.room.id));
    while (remainingDice.length > 0 && fillers.length > 0) {
      const slot = fillers.shift();
      if (usedColumns.has(slot.cell.column)) continue;
      const die = remainingDice.shift();
      secondaryAssignments.push({ die, cellId: slot.cell.id, room: slot.room });
      usedColumns.add(slot.cell.column);
    }
  }

  const placements = [
    ...supportAssignments.map(({ die, cellId }) => ({ type: "place_die", dieId: die.id, cellId })),
    { type: "place_die", dieId: primaryDie.id, cellId: primaryCell },
    ...secondaryAssignments.map(({ die, cellId }) => ({ type: "place_die", dieId: die.id, cellId })),
  ];
  const expectedEnergyAfterPrimary = currentEnergy + expectedEnergyGain
    - Number(researchRoom.energyCost || 0);
  const payableSecondaryRooms = secondaryAssignments.map((row) => row.room)
    .filter((room, index, all) => all.findIndex((candidate) => candidate.id === room.id) === index)
    .filter((room) => ["fighter"].includes(room.type))
    .filter((room) => expectedEnergyAfterPrimary - Number(room.energyCost || 0) >= minimumEnergy);

  const roomActions = [
    ...(supportRoom ? [{ type: "resolve_room", roomId: supportRoom.id, pay: true }] : []),
    { type: "resolve_room", roomId: researchRoom.id, pay: true },
    { type: "choose_research_advance", roomId: researchRoom.id, advanceSteps: "maximum_available" },
    ...payableSecondaryRooms.map((room) => ({ type: "resolve_room", roomId: room.id, pay: true })),
    { type: "end_rooms" },
  ];

  return {
    schema: "ufs_single_anchor_multistep_plan_v0",
    status: "planned",
    macroIntent: clone(intent),
    activationGroups: {
      intent: clone(intentActivations),
      environment: clone(environmentActivations),
    },
    anchorPackage: {
      primary: {
        kind: "research_progress",
        roomId: researchRoom.id,
        dieId: primaryDie.id,
        expectedRoomValue: Number(primaryDie.value) + Number(researchRoom.modifier || 0),
      },
      support: supportRoom ? {
        kind: "energy_before_research",
        roomId: supportRoom.id,
        dieIds: supportAssignments.map((row) => row.die.id),
        expectedEnergyGain,
      } : null,
      reason: supportRoom
        ? "direct research would violate the nonzero-energy constraint, so energy is an enabling anchor"
        : "research is directly feasible without violating the energy constraint",
    },
    placements,
    publicRandomContingency: {
      trigger: "placing a white die while another die remains",
      policy: "keep the remaining die's assigned room role; obtain its value only from the public random boundary",
    },
    roomActions,
    expectedBeforeRandom: {
      energyAfterPrimaryAndSupport: expectedEnergyAfterPrimary,
      researchDirection: "increase",
    },
    searchAudit: {
      strategy: "intent_and_environment_activation_then_anchor_completion",
      cartesianPlacementCandidatesGenerated: 0,
      accessibleRoomCount: rooms.length,
      awakenedCapabilityCount: capabilities.size,
      anchorCandidateCount: supportRoom ? 2 : 1,
      completePlansGenerated: 1,
    },
  };
}

module.exports = { accessibleRooms, buildSingleAnchorPlan };
