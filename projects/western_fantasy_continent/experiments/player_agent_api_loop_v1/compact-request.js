const fs = require("node:fs");
const path = require("node:path");

if (require.main === module) {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath) throw new Error("usage: node compact-request.js <request.json> [compact.json]");

  const request = JSON.parse(fs.readFileSync(path.resolve(inputPath), "utf8"));
  const compact = request.type === "decision" ? compactDecision(request) : compactAttribution(request);
  const text = `${JSON.stringify(compact, null, 2)}\n`;
  if (outputPath) fs.writeFileSync(path.resolve(outputPath), text);
  else process.stdout.write(text);
}

function compactDecision(request) {
  return {
    type: request.type,
    schema: request.schema,
    cycle: request.cycle,
    agentSession: request.agentSession,
    playerProfile: request.playerProfile,
    controller: request.controller,
    instruction: request.instruction,
    playerState: {
      emotion: request.playerState.emotion,
      activeGoalId: request.playerState.activeGoalId,
      goals: request.playerState.goals,
      characterImpressions: request.playerState.characterImpressions,
      rosterChangeExpectations: request.playerState.rosterChangeExpectations,
      failureMemories: request.playerState.failureMemories,
      hypotheses: request.playerState.hypotheses,
      knowledge: (request.playerState.knowledge || []).map(compactKnowledge),
    },
    knowledgeRetrieval: request.knowledgeRetrieval,
    observation: request.observation,
    responseContract: request.responseContract,
    auditNote: "Lossless for legal actions and current observations; historical evidence arrays and older repeated observations are folded only for agent reading.",
  };
}

function compactAttribution(request) {
  const visibleIds = new Set((request.visibleEvents || []).map((event) => event.id));
  const candidates = (request.existingKnowledge || []).filter((row) =>
    (row.evidenceEventIds || []).some((id) => visibleIds.has(id))
  );
  return {
    type: request.type,
    schema: request.schema,
    cycle: request.cycle,
    agentSession: request.agentSession,
    playerProfile: request.playerProfile,
    controller: request.controller,
    instruction: request.instruction,
    action: request.action,
    outcome: request.outcome,
    emotionBeforeAction: request.emotionBeforeAction,
    emotionAfterEvents: request.emotionAfterEvents,
    candidateKnowledge: candidates.map(compactKnowledge),
    visibleEvents: request.visibleEvents,
    responseContract: request.responseContract,
    auditNote: "candidateKnowledge contains only rows citing at least one currently visible event; exact ids remain unchanged.",
  };
}

function compactKnowledge(row) {
  const observations = row.result?.observations || [];
  return {
    id: row.id,
    subject: row.subject,
    environment: row.environment,
    behavior: row.behavior,
    result: {
      sampleCount: row.result?.sampleCount,
      outcomeDistribution: row.result?.outcomeDistribution,
      latestObservation: row.result?.latestObservation || observations.at(-1) || null,
    },
    evidence: row.evidence || { count: (row.evidenceEventIds || []).length, recentEventIds: (row.evidenceEventIds || []).slice(-4) },
    latestAttribution: row.latestAttribution || (row.attributions || []).at(-1) || null,
    ...(row.playerReadableFact ? { playerReadableFact: row.playerReadableFact } : {}),
  };
}

module.exports = { compactDecision, compactAttribution };
