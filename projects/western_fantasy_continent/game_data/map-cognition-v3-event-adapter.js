const V2_ADAPTER = require("./map-cognition-v2-event-adapter");
const RUNTIME = require("./player-cognition-v3-event-runtime");

function buildMapEventLog(action, resultEvent, options = {}) {
  const rows = V2_ADAPTER.buildMapEventLog(action, resultEvent, options);
  const event = resultEvent || {};
  const activeExperiment = options.activeExperiment || null;
  if (String(action).startsWith("swap:")) {
    const [, slotText, heroId] = String(action).split(":");
    rows.push({
      id: `team-change:${event.step}:${heroId}`,
      time: 0.04,
      type: "team_change",
      subject: { id: "player_squad", role: "player_squad", side: "left" },
      environment: { region: "region_1", phase: "team" },
      behavior: { kind: "team_management", key: String(action) },
      result: {
        kind: "team_changed",
        occurred: true,
        heroId,
        slotIndex: Number(slotText),
        teamBefore: event.teamBefore || [],
        teamAfter: event.teamAfter || [],
      },
      presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: true },
    });
  } else if (activeExperiment && ["win", "loss"].includes(event.outcome)) {
    const contribution = options.experimentContribution || { observed: false, damage: 0, heal: 0, shield: 0, skillCount: 0 };
    rows.push({
      id: `team-experiment:${event.step}:${activeExperiment.id}`,
      time: Math.max(0, Number(event.duration || 0)) + 0.06,
      type: "team_experiment_result",
      subject: { id: "player_squad", role: "player_squad", side: "left" },
      environment: { region: "region_1", node: event.node, phase: "result" },
      behavior: { kind: "team_experiment", key: String(action) },
      result: {
        kind: "team_experiment_result",
        occurred: true,
        experimentId: activeExperiment.id,
        heroId: activeExperiment.heroId,
        heroPresent: options.heroPresent !== false,
        node: event.node,
        outcome: event.outcome,
        contribution,
        components: contribution.observed ? [{ kind: "team_experiment_contribution" }] : [],
      },
      presentation: { visible: true, hasSource: true, hasTarget: true, hasAnimation: false },
      directResult: false,
    });
  }
  return rows.sort((a, b) => a.time - b.time || String(a.id).localeCompare(String(b.id)));
}

function runMapAction(core, state, action, cognitionState, options = {}) {
  const nodeId = String(action || "").split(":")[1];
  const node = core.nodes.find((item) => item.id === nodeId);
  const activeExperiment = (cognitionState.affordanceExperiments || []).find((row) => row.status === "awaiting_combat") || null;
  const result = core.applyAction(state, action, { captureVisibleSignals: true });
  if (!result.ok) return { ...result, cognitionState };
  const experimentContribution = activeExperiment ? summarizeExperimentContribution(result, activeExperiment) : null;
  const eventLog = buildMapEventLog(action, result.event, {
    ...options,
    analysis: result.analysis,
    nodeType: node?.type || (String(action).startsWith("swap:") ? "team" : "map"),
    activeExperiment,
    heroPresent: activeExperiment ? result.state.teamSlots.includes(activeExperiment.heroId) : null,
    experimentContribution,
  });
  return { ...result, cognitionState: RUNTIME.ingestEvents(cognitionState, eventLog), eventLog };
}

function summarizeExperimentContribution(result, experiment) {
  const hero = result.state.roster.find((row) => row.id === experiment.heroId);
  const name = hero?.name || "";
  const signals = (result.analysis?.combatSignals || []).filter((row) => row.subject?.id === experiment.heroId || (name && row.subject?.name === name));
  const totals = { damage: 0, heal: 0, shield: 0, skillCount: 0 };
  for (const signal of signals) {
    if (signal.type === "damage") totals.damage += Number(signal.result?.amount || 0);
    if (signal.type === "heal") totals.heal += Number(signal.result?.amount || 0);
    if (signal.type === "shield") totals.shield += Number(signal.result?.amount || 0);
    if (signal.type === "skill") totals.skillCount += 1;
  }
  return {
    observed: totals.damage > 0 || totals.heal > 0 || totals.shield > 0 || totals.skillCount > 0,
    ...totals,
  };
}

module.exports = { buildMapEventLog, runMapAction, summarizeExperimentContribution };
