const fs = require("fs");
const path = require("path");
const MODEL = require("./entity-impression-model");
const { createPresetReports } = require("./preset-battle-reports");

const OUTPUT = path.join(__dirname, "generated");
const reports = createPresetReports();
const reportById = new Map(reports.map((report) => [report.id, report]));
const forwardOrder = reports.map((report) => report.id);
const armorFirstOrder = [
  "battle_3_armored_elite",
  "battle_4_armored_elite_repeat",
  "battle_1_weak_swarm",
  "battle_2_mixed_patrol",
  "battle_5_low_armor_champion",
];

const minimal = runSequence(forwardOrder.slice(0, 3), "ordinary", "minimal_first_impression_then_correction");
const forwardOrdinary = runSequence(forwardOrder, "ordinary", "forward_ordinary");
const forwardExpert = runSequence(forwardOrder, "expert", "forward_expert");
const armorFirstExpert = runSequence(armorFirstOrder, "expert", "armor_first_expert");
const result = {
  schema: "entity_impression_experiment_result_v1",
  fixtureDisclosure: "All five battles are controlled preset reports using the live semantic event shape; they are not claimed as freshly simulated combat.",
  minimal,
  sequences: { forwardOrdinary, forwardExpert, armorFirstExpert },
};

if (process.argv.includes("--write")) {
  fs.mkdirSync(OUTPUT, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT, "preset-battle-reports.json"), `${JSON.stringify(reports, null, 2)}\n`);
  fs.writeFileSync(path.join(OUTPUT, "deterministic-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  fs.writeFileSync(path.join(OUTPUT, "agent-analysis-packets.json"), `${JSON.stringify(buildAgentPackets(), null, 2)}\n`);
}

console.log(JSON.stringify(summarize(result), null, 2));

function runSequence(order, profile, id) {
  const state = MODEL.createImpressionState({ profile });
  const analyses = [];
  for (const reportId of order) {
    const analysis = MODEL.analyzeBattleReport(reportById.get(reportId), { profile });
    analyses.push(analysis);
    MODEL.ingestBattleAnalysis(state, analysis);
  }
  return {
    id,
    profile,
    order,
    analyses,
    state,
    warriorDefaultRetrieval: MODEL.retrieveImpressions(state, "hero_warrior"),
    warriorHighArmorRetrieval: MODEL.retrieveImpressions(state, "hero_warrior", ["elite", "high_armor"]),
    warriorLowArmorRetrieval: MODEL.retrieveImpressions(state, "hero_warrior", ["swarm", "low_armor"]),
  };
}

function buildAgentPackets() {
  return {
    schema: "entity_impression_agent_packets_v1",
    rules: {
      usefulContribution: "damage + effective healing + shield absorbed + prevented damage + control value",
      expectedUnitContribution: "team useful contribution / active unit count",
      relativeStrength: "unit useful contribution / expected unit contribution - 1",
      strengthPerception: "Use the supplied profile bands; positive input is capped at 150%.",
      domainMagnitude: "domain contribution / expected unit contribution * 100%; do not subtract 100% for traits",
      traitRule: "A trait is learned only when that domain magnitude reaches semantic level 3 or above.",
      knowledgeRule: "Keep immutable first impressions and append contradictory contextual observations. Separately synthesize a revisable current belief.",
      priorityRule: "Exact context evidence outranks general belief. General current belief weights every observation by reliability * (1 + 1 / observation order), so earlier evidence matters more but cannot permanently lock belief.",
      agentInterpretationPolicy: MODEL.AGENT_INTERPRETATION_POLICY,
    },
    packets: [
      buildPacket("forward_ordinary", "ordinary", forwardOrder),
      buildPacket("forward_expert", "expert", forwardOrder),
      buildPacket("armor_first_expert", "expert", armorFirstOrder),
    ],
  };
}

function buildPacket(id, profile, order) {
  return {
    id,
    profile,
    perceptionBands: profile === "ordinary" ? MODEL.POSITIVE_BANDS.ordinary : MODEL.POSITIVE_BANDS.expert,
    provisionalNegativeBands: MODEL.NEGATIVE_BANDS,
    reports: order.map((reportId) => compactReport(reportById.get(reportId))),
  };
}

function compactReport(report) {
  const analysis = MODEL.analyzeBattleReport(report, { profile: "expert" });
  return {
    id: report.id,
    environment: report.environment,
    outcome: report.gameEvent.outcome,
    activeUnitCount: report.playerTeam.length,
    unitEvidence: analysis.units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      role: unit.role,
      channels: unit.channels,
      domains: unit.domains,
      domainEvidence: unit.domainEvidence,
      evidenceEventIds: unit.evidenceEventIds,
    })),
  };
}

function summarize(value) {
  const pick = (sequence) => ({
    id: sequence.id,
    profile: sequence.profile,
    order: sequence.order,
    warriorKnowledge: sequence.state.knowledge.filter((row) => row.subject.id === "hero_warrior"),
    defaultTop: sequence.warriorDefaultRetrieval[0] || null,
    highArmorTop: sequence.warriorHighArmorRetrieval[0] || null,
  });
  return {
    fixtureDisclosure: value.fixtureDisclosure,
    minimal: pick(value.minimal),
    sequences: Object.fromEntries(Object.entries(value.sequences).map(([key, sequence]) => [key, pick(sequence)])),
  };
}

module.exports = { runSequence, buildAgentPackets };
