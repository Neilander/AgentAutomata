const GAME_COMBAT_SIGNALS = (() => {
  function createCombatSignalBus(options = {}) {
    const signals = [];
    let lastHealthSnapshot = 0;
    const healthInterval = options.healthInterval ?? 0.5;

    function emit(input) {
      const signal = normalize(input, options.now ? options.now() : 0);
      signals.push(signal);
      return signal;
    }

    function emitHealthSnapshots(units, time = options.now ? options.now() : 0) {
      if (time - lastHealthSnapshot < healthInterval) return;
      lastHealthSnapshot = time;
      for (const unit of units || []) {
        emit({
          time,
          kind: "health",
          tags: ["health", "snapshot"],
          target: unitRef(unit),
          hp: unit.hp ?? unit.hpNow ?? 0,
          maxHp: unit.maxHp ?? unit.hp ?? 1,
          shield: unit.shield || 0,
          meta: unitMeta(unit),
        });
      }
    }

    function query(requiredTags = []) {
      return signals.filter((signal) => requiredTags.every((tag) => signal.tags.includes(tag)));
    }

    function clear() {
      signals.length = 0;
      lastHealthSnapshot = 0;
    }

    function summary() {
      const byUnit = {};
      const buckets = {};
      for (const signal of signals) {
        for (const tag of signal.tags) buckets[tag] = (buckets[tag] || 0) + (signal.amount || 0);
        const sourceId = signal.source?.id;
        if (sourceId) {
          byUnit[sourceId] ||= { name: signal.source.name, damage: 0, healing: 0, shield: 0, taken: 0 };
          if (signal.tags.includes("damage")) byUnit[sourceId].damage += signal.amount || 0;
          if (signal.tags.includes("heal")) byUnit[sourceId].healing += signal.amount || 0;
          if (signal.tags.includes("shield")) byUnit[sourceId].shield += signal.amount || 0;
        }
        const targetId = signal.target?.id;
        if (targetId && signal.tags.includes("damage")) {
          byUnit[targetId] ||= { name: signal.target.name, damage: 0, healing: 0, shield: 0, taken: 0 };
          byUnit[targetId].taken += signal.amount || 0;
        }
      }
      return { totalSignals: signals.length, buckets, byUnit };
    }

    return { signals, emit, emitHealthSnapshots, query, clear, summary };
  }

  function normalize(input, fallbackTime) {
    const tags = Array.from(new Set(input.tags || []));
    return {
      time: Number(input.time ?? fallbackTime ?? 0),
      kind: input.kind || inferKind(tags),
      tags,
      source: input.source || null,
      target: input.target || null,
      amount: Number(input.amount || 0),
      skillKey: input.skillKey || null,
      skillName: input.skillName || "",
      hpBefore: input.hpBefore,
      hpAfter: input.hpAfter,
      hp: input.hp,
      maxHp: input.maxHp,
      shield: input.shield,
      meta: input.meta || {},
    };
  }

  function inferKind(tags) {
    if (tags.includes("damage")) return "damage";
    if (tags.includes("heal")) return "heal";
    if (tags.includes("shield")) return "shield";
    if (tags.includes("health")) return "health";
    if (tags.includes("skill")) return "skill";
    return "event";
  }

  function unitRef(unit) {
    if (!unit) return null;
    return {
      id: unit.id || unit.unitId || "",
      name: unit.name || "",
      side: unit.side || "",
      role: unit.roleName || unit.role || "",
    };
  }

  function unitMeta(unit) {
    if (!unit) return {};
    return {
      side: unit.side || "",
      role: unit.roleName || unit.role || "",
      line: unit.line || "",
      passive: unit.passive || "",
    };
  }

  return { createCombatSignalBus, unitRef, unitMeta };
})();

if (typeof window !== "undefined") window.GAME_COMBAT_SIGNALS = GAME_COMBAT_SIGNALS;
if (typeof module !== "undefined") module.exports = GAME_COMBAT_SIGNALS;
