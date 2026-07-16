const fs = require("fs");
const path = require("path");
const MODEL = require("./entity-impression-model");

const SESSION_PATH = path.resolve(__dirname, "../player_agent_api_loop_v1/causal_verification_v9_concept_interpreter/session.json");
const OUTPUT_PATH = path.join(__dirname, "generated", "live-report-analysis.json");
const AGENT_PACKET_PATH = path.join(__dirname, "generated", "live-report-agent-packet.json");
const session = JSON.parse(fs.readFileSync(SESSION_PATH, "utf8"));
const record = session.history.find((row) => row.action?.startsWith("challenge:"));
if (!record) throw new Error("accepted evidence session has no challenge record");

const report = {
  id: `accepted-live-record:${record.gameEvent.node}:cycle:${record.cycle}`,
  source: SESSION_PATH,
  environment: {
    id: record.gameEvent.node,
    label: "已接受运行中的真实第一场战斗",
    tags: ["early_main", "mixed"],
  },
  gameEvent: record.gameEvent,
  eventLog: record.eventLog,
};
const analysis = MODEL.analyzeBattleReport(report, { profile: "ordinary" });
const packet = {
  disclosure: "This analysis is derived from the accepted recorded combat report, not a controlled fixture and not a freshly rerun battle.",
  reportSource: SESSION_PATH,
  reportId: report.id,
  environment: report.environment,
  outcome: report.gameEvent.outcome,
  duration: report.gameEvent.duration,
  activeUnitCount: analysis.units.length,
  expectedUnitContribution: analysis.expectedUnitContribution,
  unitEvidence: analysis.units.map((unit) => ({
    id: unit.id,
    name: unit.name,
    role: unit.role,
    channels: unit.channels,
    domains: unit.domains,
    domainEvidence: unit.domainEvidence,
    evidenceEventIds: unit.evidenceEventIds,
  })),
  deterministicAudit: analysis,
};

if (process.argv.includes("--write")) {
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(packet, null, 2)}\n`);
  const { deterministicAudit, ...agentPacket } = packet;
  fs.writeFileSync(AGENT_PACKET_PATH, `${JSON.stringify(agentPacket, null, 2)}\n`);
}

console.log(JSON.stringify({
  reportId: packet.reportId,
  activeUnitCount: packet.activeUnitCount,
  expectedUnitContribution: packet.expectedUnitContribution,
  units: analysis.units.map((unit) => ({ name: unit.name, contribution: unit.usefulContribution, strength: unit.strength, traits: unit.traits })),
}, null, 2));
