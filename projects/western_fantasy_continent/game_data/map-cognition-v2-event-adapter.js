const V1_ADAPTER = require("./map-cognition-v1-event-adapter");
const RUNTIME = require("./player-cognition-v2-event-runtime");

function buildMapEventLog(action, resultEvent, options = {}) {
  const rows = V1_ADAPTER.buildMapEventLog(action, resultEvent, options);
  const event = resultEvent || {};
  const observedPower = Number(event.gearAfter ?? event.gearBefore);
  for (const row of rows) {
    if (["combat_result", "action_summary"].includes(row.type) && Number.isFinite(observedPower)) {
      row.result.observedPower = observedPower;
      row.presentation.hasNumber = true;
      row.presentation.visibleMetric = "team_power";
    }
  }
  if (event.outcome === "win" && Number(event.gearAfter) > Number(event.gearBefore)) {
    const growthAmount = Number(event.gearAfter) - Number(event.gearBefore);
    const summary = rows.find((row) => row.type === "action_summary");
    if (summary) summary.result.components.push({ kind: "power_growth", amount: growthAmount });
    rows.push({
      id: `map_action:${event.node}:${event.step}:power-growth`,
      time: Math.max(0, Number(event.duration || 0)) + 0.07,
      type: "gear_growth",
      subject: { id: "player_squad", name: "player squad", side: "left", role: "player_squad" },
      environment: { region: options.region || "region_1", node: event.node, nodeType: options.nodeType || "main", phase: "reward" },
      behavior: { kind: "encounter_reward", key: `reward:${event.node}`, name: "equipment growth" },
      result: {
        kind: "power_growth",
        occurred: true,
        before: Number(event.gearBefore),
        after: Number(event.gearAfter),
        amount: growthAmount,
      },
      presentation: { visible: true, hasSource: true, hasTarget: true, hasNumber: true, hasAnimation: true },
    });
  }
  return rows.sort((a, b) => a.time - b.time || String(a.id).localeCompare(String(b.id)));
}

function runMapAction(core, state, action, cognitionState, options = {}) {
  const nodeId = String(action || "").split(":")[1];
  const node = core.nodes.find((item) => item.id === nodeId);
  const result = core.applyAction(state, action, { captureVisibleSignals: true });
  if (!result.ok) return { ...result, cognitionState };
  const eventLog = buildMapEventLog(action, result.event, { ...options, analysis: result.analysis, nodeType: node?.type || "map" });
  return { ...result, cognitionState: RUNTIME.ingestEvents(cognitionState, eventLog), eventLog };
}

module.exports = { buildMapEventLog, runMapAction };
