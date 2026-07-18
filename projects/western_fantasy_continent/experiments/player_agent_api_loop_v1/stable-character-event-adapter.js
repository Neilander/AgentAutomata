const SCHEMA = "stable_character_event_adapter_v1";

function normalizeCharacterCognitionReport(reportInput = {}) {
  const report = clone(reportInput);
  const playerTeam = Array.isArray(report.playerTeam) ? report.playerTeam : [];
  const stableById = new Map();
  const stableByName = new Map();
  const ambiguousNames = new Set();

  for (const unit of playerTeam) {
    if (!unit?.id) continue;
    const stable = {
      id: String(unit.id),
      name: String(unit.name || unit.id),
      role: unit.role == null ? null : String(unit.role),
    };
    stableById.set(stable.id, stable);
    if (!stable.name) continue;
    if (stableByName.has(stable.name)) {
      ambiguousNames.add(stable.name);
      stableByName.delete(stable.name);
    } else if (!ambiguousNames.has(stable.name)) {
      stableByName.set(stable.name, stable);
    }
  }

  const identityMap = new Map();
  const unmappedFriendlyActors = new Map();
  let mappedReferenceCount = 0;
  const normalizeFriendlyRef = (reference) => {
    if (!reference || reference.side !== "left" || reference.id === "player_squad") {
      return reference;
    }
    const stable = stableById.get(String(reference.id))
      || stableByName.get(String(reference.name || ""));
    if (!stable) {
      const key = String(reference.id || reference.name || "unknown");
      if (!unmappedFriendlyActors.has(key)) {
        unmappedFriendlyActors.set(key, {
          battleActorId: reference.id || null,
          visibleName: reference.name || null,
        });
      }
      return reference;
    }
    const battleActorId = String(reference.id || stable.id);
    if (battleActorId !== stable.id) identityMap.set(battleActorId, stable);
    mappedReferenceCount += 1;
    return {
      ...reference,
      id: stable.id,
      name: stable.name,
      role: stable.role || reference.role || null,
      battleActorId: battleActorId === stable.id ? null : battleActorId,
    };
  };

  report.eventLog = (report.eventLog || []).map((event) => ({
    ...event,
    subject: normalizeFriendlyRef(event.subject),
    result: event.result
      ? {
        ...event.result,
        target: normalizeFriendlyRef(event.result.target),
        source: normalizeFriendlyRef(event.result.source),
      }
      : event.result,
  }));

  return {
    schema: SCHEMA,
    report,
    audit: {
      teamSize: playerTeam.length,
      mappedReferenceCount,
      temporaryIdentityCount: identityMap.size,
      identityMap: [...identityMap.entries()].map(([battleActorId, stable]) => ({
        battleActorId,
        stableCharacterId: stable.id,
        stableCharacterName: stable.name,
      })),
      ambiguousVisibleNames: [...ambiguousNames],
      unmappedFriendlyActors: [...unmappedFriendlyActors.values()],
      allTemporaryFriendlyActorsMapped: unmappedFriendlyActors.size === 0,
    },
  };
}

function clone(value) {
  return structuredClone(value);
}

module.exports = {
  SCHEMA,
  normalizeCharacterCognitionReport,
};
