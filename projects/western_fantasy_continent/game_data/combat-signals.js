const GAME_COMBAT_SIGNALS = (() => {
  const INFORMATION_PRESENTATION_CONTRACT = Object.freeze({
    schema: "information_presentation_tier_v2",
    defaultTier: "standard",
    tiers: Object.freeze({
      background: Object.freeze({
        rank: 1,
        perceptionStrength: 0.25,
        forcedReception: false,
        frontendIntent: "incidental_background_feedback",
      }),
      ambient: Object.freeze({
        rank: 2,
        perceptionStrength: 0.4,
        forcedReception: false,
        frontendIntent: "minor_repeated_feedback",
      }),
      standard_low: Object.freeze({
        rank: 3,
        perceptionStrength: 0.5,
        forcedReception: false,
        frontendIntent: "secondary_routine_feedback",
      }),
      standard: Object.freeze({
        rank: 4,
        perceptionStrength: 0.6,
        forcedReception: false,
        frontendIntent: "normal_combat_feedback",
      }),
      standard_high: Object.freeze({
        rank: 5,
        perceptionStrength: 0.7,
        forcedReception: false,
        frontendIntent: "important_routine_feedback",
      }),
      prominent: Object.freeze({
        rank: 6,
        perceptionStrength: 0.8,
        forcedReception: false,
        frontendIntent: "major_nonexclusive_feedback",
      }),
      highlight: Object.freeze({
        rank: 7,
        perceptionStrength: 0.9,
        forcedReception: false,
        frontendIntent: "reserved_focus_feedback",
      }),
      blocking: Object.freeze({
        rank: 8,
        perceptionStrength: 1,
        forcedReception: true,
        frontendIntent: "exclusive_acknowledged_feedback",
      }),
    }),
  });

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
      text: input.text || "",
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

  function describePresentation(signal) {
    const kind = signal?.kind || "event";
    const tags = new Set(signal?.tags || []);
    const specialMovement = kind === "movement" && ["shadowReset", "shadowStep", "hidden", "blink"].some((tag) => tags.has(tag));
    const sourceVisible = Boolean(signal.source?.id);
    const targetVisible = Boolean(signal.target?.id);
    const visible = (kind === "skill" && sourceVisible)
      || (["damage", "heal", "shield", "status", "field", "death"].includes(kind) && targetVisible)
      || (specialMovement && sourceVisible);
    if (!visible) return {
      contract: "battle_view_unified_signal_v1",
      visible: false,
      reason: kind === "health" ? "state_synced_without_discrete_feedback" : "no_playUnifiedSignal_branch",
    };
    const hasNumber = ["damage", "heal", "shield"].includes(kind) && Number(signal.amount || 0) !== 0;
    const hasText = ["skill", "damage", "heal", "shield", "status", "field", "death"].includes(kind);
    const motion = kind === "skill" || kind === "damage" || kind === "heal" || kind === "shield" || kind === "status" || kind === "field" || kind === "death" || specialMovement;
    const fontPx = tags.has("ultimate") ? 14 : kind === "skill" ? 12 : hasText ? 13 : 0;
    const animationSeconds = kind === "skill" ? 0.78 : ["damage", "heal", "shield", "status", "field", "death"].includes(kind) ? 0.9 : 0.72;
    const colorToken = tags.has("fire") || tags.has("burn") ? "fire"
      : tags.has("poison") ? "poison"
        : kind === "heal" ? "heal"
          : kind === "shield" ? "shield"
            : tags.has("hidden") ? "purple" : "default";
    const anchor = kind === "field" && signal.source?.id
      ? signal.source.id
      : signal.target?.id || signal.source?.id || "battlefield";
    return {
      contract: "battle_view_unified_signal_v1",
      informationContract: INFORMATION_PRESENTATION_CONTRACT.schema,
      informationTier: informationTierForSignal(signal),
      visible: true,
      hasNumber,
      hasText,
      hasSource: Boolean(signal.source?.id),
      hasTarget: Boolean(signal.target?.id),
      hasHealthDelta: Number.isFinite(signal.hpBefore) && Number.isFinite(signal.hpAfter),
      hasAnimation: motion,
      renderEvidence: {
        cssClass: kind === "skill" ? "battle-skill-label" : hasText ? "battle-floater" : "battle-vfx-ring",
        fontPx,
        animationSeconds,
        colorToken,
        moving: motion,
      },
      attentionZone: anchor,
      renderer: rendererForSignal(kind, tags, specialMovement),
    };
  }

  function rendererForSignal(kind, tags, specialMovement) {
    if (kind === "skill") return "label+skill_fx";
    if (kind === "damage") return tags.has("dot") ? "floater+ring" : "floater+slash";
    if (kind === "heal" || kind === "shield" || kind === "status") return "floater_or_ring";
    if (kind === "field") return "floater+ring";
    if (kind === "death") return "death_floater";
    if (specialMovement) return "afterimage+ring";
    return "none";
  }

  function informationTierForSignal(signal) {
    const kind = signal?.kind || "event";
    const tags = new Set(signal?.tags || []);
    if (tags.has("blocking") || tags.has("requires_acknowledgement")) return "blocking";
    if (tags.has("ultimate") || kind === "field") return "highlight";
    if (kind === "death") return "prominent";
    if (kind === "movement" || tags.has("dot")) return "background";
    if (kind === "skill") return "ambient";
    if (kind === "damage") return "standard_low";
    if (kind === "status") return "standard_high";
    if (kind === "heal" || kind === "shield") return "standard";
    return INFORMATION_PRESENTATION_CONTRACT.defaultTier;
  }

  function normalizeInformationTier(value, fallback = INFORMATION_PRESENTATION_CONTRACT.defaultTier) {
    if (INFORMATION_PRESENTATION_CONTRACT.tiers[value]) return value;
    return INFORMATION_PRESENTATION_CONTRACT.tiers[fallback]
      ? fallback
      : INFORMATION_PRESENTATION_CONTRACT.defaultTier;
  }

  return {
    INFORMATION_PRESENTATION_CONTRACT,
    createCombatSignalBus,
    unitRef,
    unitMeta,
    describePresentation,
    informationTierForSignal,
    normalizeInformationTier,
  };
})();

if (typeof window !== "undefined") window.GAME_COMBAT_SIGNALS = GAME_COMBAT_SIGNALS;
if (typeof module !== "undefined") module.exports = GAME_COMBAT_SIGNALS;
