const RUNTIME = require("./player-cognition-v1-event-runtime");

function buildMapEventLog(action, resultEvent, options = {}) {
  const event = resultEvent || {};
  const analysis = options.analysis || {};
  const node = event.node || String(action || "").split(":")[1] || "map";
  const nodeType = options.nodeType || "main";
  const expectationKey = `map_action:${node}:${event.step || 0}`;
  const subject = { id: "player_squad", name: "player squad", side: "left", role: "player_squad" };
  const environment = { region: "region_1", node, nodeType, phase: "world" };
  const behavior = { kind: "map_action", key: String(action || "unknown"), name: String(action || "") };
  const rows = [{
    id: `${expectationKey}:start`,
    time: 0,
    type: "action_start",
    subject,
    environment,
    behavior,
    result: { kind: "action_started", occurred: true },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    process: { decisionCount: 0, reactiveCount: 0, mechanicalSeconds: 0 },
    expectation: { phase: "open", key: expectationKey, deadline: "action_end" },
    directResult: false,
    learn: false,
  }];

  rows.push(...compactCombatSignals(analysis.combatSignals || []).map((signal) => ({
    ...signal,
    time: Math.max(0, Number(signal.time) || 0),
  })));

  const duration = Math.max(0, Number(event.duration) || 0);
  const outcomeKind = event.outcome === "win" ? "combat_win" : event.outcome === "loss" ? "combat_loss" : "action_changed";
  rows.push({
    id: `${expectationKey}:result`,
    time: duration,
    type: "combat_result",
    subject,
    environment: { ...environment, phase: "result" },
    behavior,
    result: {
      kind: outcomeKind,
      occurred: true,
      firstClear: Boolean(event.firstClear),
      survivors: event.survivors || null,
      resolution: event.resolution || null,
      boundary: event.outcome === "loss" ? "interrupted_by_defeat" : "normal_end",
    },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    settleExpectation: false,
    learn: false,
  });

  const rareLoot = (event.loot || []).some((item) => item.rarity && item.rarity !== "common");
  const lootComponents = (event.loot || []).map((item) => ({ kind: "loot", rarity: item.rarity || "common" }));
  const rareLootComponents = lootComponents.filter((item) => item.rarity !== "common");
  if (event.lootOpportunity) {
    rows.push({
      id: `${expectationKey}:loot-outcome`,
      time: duration + 0.005,
      type: "loot_outcome",
      subject,
      environment: { ...environment, phase: "reward" },
      behavior: { kind: "encounter_reward", key: `reward:${node}`, name: "encounter reward" },
      result: { kind: "probability_outcome", occurred: true, itemCount: rareLootComponents.length, components: rareLootComponents },
      probability: { opportunity: true, success: rareLoot, family: `rare_equipment:${node}` },
      expectation: { phase: "accumulate", key: `probability:rare_equipment:${node}`, deadline: "learned_probability_horizon" },
      presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: rareLoot },
      directResult: false,
    });
  }

  for (const [index, item] of (event.loot || []).entries()) {
    const rarity = item.rarity || "common";
    rows.push({
      id: `${expectationKey}:loot:${index + 1}`,
      time: duration + 0.01 * (index + 1),
      type: "loot",
      subject,
      environment: { ...environment, phase: "reward" },
      behavior: { kind: "encounter_reward", key: `reward:${node}`, name: "encounter reward" },
      result: { kind: "loot", occurred: true, rarity, itemId: item.id || "", itemName: item.name || "" },
      presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    });
  }

  const characterUnlock = event.characterUnlock
    || (event.outcome === "win" && event.firstClear && node === "r1_prison"
      ? { id: "ranger", heroId: "hero_ranger", name: "林地游侠" }
      : null);
  const unlockedCharacter = event.outcome === "win" && event.firstClear && characterUnlock;
  if (unlockedCharacter) {
    rows.push({
      id: `${expectationKey}:character`,
      time: duration + 0.04,
      type: "character_unlock",
      subject,
      environment: { ...environment, phase: "reward" },
      behavior: { kind: "encounter_reward", key: `reward:${node}`, name: "character rescue" },
      result: {
        kind: "character_unlock",
        occurred: true,
        character: characterUnlock.id,
        heroId: characterUnlock.heroId,
        characterName: characterUnlock.name,
      },
      presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    });
  }

  const components = [
    { kind: outcomeKind, firstClear: Boolean(event.firstClear) },
    ...(unlockedCharacter ? [{ kind: "character_unlock" }] : []),
  ];
  rows.push({
    id: `${expectationKey}:summary`,
    time: duration + 0.08,
    type: "action_summary",
    subject,
    environment,
    behavior,
    result: { kind: "action_summary", occurred: true, boundary: event.outcome === "loss" ? "interrupted_by_defeat" : "normal_end", components },
    presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: false },
    process: { decisionCount: 0, reactiveCount: 0, mechanicalSeconds: duration },
    expectation: { phase: "close", key: expectationKey, deadline: "action_end" },
    directResult: false,
  });

  return rows.sort((a, b) => a.time - b.time || Number(a.sequence || 0) - Number(b.sequence || 0) || a.id.localeCompare(b.id));
}

function compactCombatSignals(signals) {
  const grouped = new Map();
  const discrete = [];
  for (const signal of signals || []) {
    if (["damage", "heal", "shield"].includes(signal.type)) {
      const bucket = Math.floor((Number(signal.time) || 0) * 2) / 2;
      const key = [signal.type, bucket, signal.subject?.id || "none", signal.result?.target?.id || "none", signal.behavior?.key || "none"].join("|");
      const current = grouped.get(key);
      if (!current) {
        grouped.set(key, structuredClone(signal));
      } else {
        current.result.amount = round(Number(current.result.amount || 0) + Number(signal.result?.amount || 0));
        if (Number.isFinite(signal.result?.hpAfter)) current.result.hpAfter = signal.result.hpAfter;
        current.presentation.hasNumber ||= Boolean(signal.presentation?.hasNumber);
        current.presentation.hasHealthDelta ||= Boolean(signal.presentation?.hasHealthDelta);
      }
      continue;
    }
    if (["death", "skill", "movement", "status"].includes(signal.type)) discrete.push(normalizeCombatResult(signal));
  }
  return [...grouped.values().map(normalizeCombatResult), ...discrete].sort((a, b) => a.time - b.time || Number(a.sequence || 0) - Number(b.sequence || 0) || a.id.localeCompare(b.id));
}

function normalizeCombatResult(signal) {
  const row = structuredClone(signal);
  if (row.type === "death") {
    row.result.kind = row.result.target?.side === "right" ? "enemy_kill" : "ally_death";
  }
  return row;
}

function runMapAction(core, state, action, cognitionState, options = {}) {
  const nodeId = String(action || "").split(":")[1];
  const node = core.nodes.find((item) => item.id === nodeId);
  const result = core.applyAction(state, action, { captureVisibleSignals: true });
  if (!result.ok) return { ...result, cognitionState };
  const eventLog = buildMapEventLog(action, result.event, { ...options, analysis: result.analysis, nodeType: node?.type || "map" });
  const nextCognition = RUNTIME.ingestEvents(cognitionState, eventLog);
  return { ...result, cognitionState: nextCognition, eventLog };
}

function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

module.exports = { buildMapEventLog, compactCombatSignals, runMapAction };
