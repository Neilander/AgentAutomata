"use strict";

const { allocateAttention } = require("./attention");
const { buildActiveCognition } = require("./active-cognition");
const { assertSentinelAbsent } = require("./game-boundary");
const { retrieveGameMemories } = require("./memory-retrieval");
const { applyGuessAction, toGuessPlayerView } = require("./guess-game");
const { applyMindToyBuildResponse, applyResolvedEstimates, createMindToyBuildSession, getMindToyBuildRequest } = require("./mind-toy-builder");
const { resolveEstimates } = require("./estimate-resolver");
const { acceptIdeaResponse, attemptIdea, createIdeaRequest, evaluateIdea } = require("./idea-loop");
const { chooseNextCognitiveOperation } = require("./thought-controller");
const { recordThought, validateTraceCausality } = require("./thought-trace");
const { createTrace } = require("./contracts");

function runGuessCognitiveLoop(input = {}) {
  if (typeof input.ai?.buildMindToy !== "function" || typeof input.ai?.proposeIdea !== "function") {
    throw new Error("AI port requires buildMindToy and proposeIdea functions");
  }
  let engine = input.engine;
  let trace = createTrace();
  const initialEvidenceIds = ["view:0"];
  const cycles = [];
  const maxTurns = Number(input.maxTurns || 8);
  while (engine.status === "playing" && engine.turn < maxTurns) {
    const cycle = engine.turn;
    const viewRef = `view:${cycle}`;
    const playerView = toGuessPlayerView(engine);
    assertSentinelAbsent(playerView, engine.engineOnlySentinel);
    const goal = { id: "identify_rune", label: "找出目标符文", concepts: ["符文探测", "候选范围"], successCondition: "反馈为一致" };
    const attention = allocateAttention({ budget: input.attentionBudget ?? 2, goal, signals: playerView.visibleSignals });
    const attentionRef = `attention:${cycle}`;
    trace = recordThought(trace, event(cycle, "attention", "perceived", [viewRef], [attentionRef], attention.spent, initialEvidenceIds));

    const retrieval = retrieveGameMemories({
      goal, scene: playerView.scene, observations: attention.received,
      memoryStore: input.memoryStore || [], attentionBudget: attention.remaining,
      automaticThreshold: input.automaticMemoryThreshold ?? 2.2,
      deliberateThreshold: input.deliberateMemoryThreshold ?? 1.3,
    });
    const memoryRef = `retrieval:${cycle}`;
    trace = recordThought(trace, event(cycle, "memory_retrieval", "retrieved", [attentionRef], [memoryRef], retrieval.attentionSpent, initialEvidenceIds));
    const knownRules = playerView.publicRules.map((rule) => ({ ...rule, activated: true }));
    const active = buildActiveCognition({
      playerView, goal, attentionResult: attention, retrievalResult: retrieval,
      attentionCapacity: input.attentionBudget ?? 2, knownRules,
      unresolvedUnknowns: ["目标符文的确切位置"],
    });
    const activeRef = `active:${cycle}`;
    trace = recordThought(trace, event(cycle, "active_cognition", "integrated", [attentionRef, memoryRef], [activeRef], 0, initialEvidenceIds));

    let buildSession = createMindToyBuildSession({
      activeCognition: active,
      knowledgePolicy: { mode: "closed_world" },
      adequacyContract: { minimumReferencedActions: 1, requiredStructureTokens: ["current_candidates"], allowedModels: ["state_transition"] },
    });
    const buildRequest = getMindToyBuildRequest(buildSession);
    assertSentinelAbsent(buildRequest, engine.engineOnlySentinel);
    const buildResponse = input.ai.buildMindToy(buildRequest);
    buildSession = applyMindToyBuildResponse(buildSession, buildResponse);
    const buildRef = `mind-build:${cycle}`;
    trace = recordThought(trace, event(cycle, "mind_toy", "built", [activeRef], [buildRef], 0.25, initialEvidenceIds));

    const facts = activeFacts(active);
    const calculators = guessCalculators(facts);
    const resolved = resolveEstimates({
      requests: buildSession.baseSession.buildResponse.estimationRequests,
      activeCognition: active,
      calculators,
    });
    buildSession = applyResolvedEstimates(buildSession, resolved.estimateResponse);
    const mindToy = buildSession.baseSession.mindToy;
    const toyRef = `mind-toy:${cycle}`;
    trace = recordThought(trace, event(cycle, "estimate", "resolved", [buildRef], [toyRef], 0.25, initialEvidenceIds));

    const ideaRequest = createIdeaRequest({ activeCognition: active, mindToy, previousIdeas: [] });
    assertSentinelAbsent(ideaRequest, engine.engineOnlySentinel);
    const idea = acceptIdeaResponse(ideaRequest, input.ai.proposeIdea(ideaRequest));
    const ideaRef = `idea:${cycle}:${idea.id}`;
    trace = recordThought(trace, event(cycle, "idea", "proposed", [activeRef, toyRef], [ideaRef], 0.25, initialEvidenceIds));
    const attempt = attemptIdea({ idea, mindToy });
    const attemptRef = `attempt:${cycle}:${idea.id}`;
    trace = recordThought(trace, event(cycle, "local_attempt", "simulated", [ideaRef, toyRef], [attemptRef], 0.25, initialEvidenceIds));
    const evaluation = evaluateIdea({ attempt });
    const evaluationRef = `evaluation:${cycle}:${idea.id}`;
    trace = recordThought(trace, event(cycle, "idea_evaluation", "evaluated", [attemptRef], [evaluationRef], 0, initialEvidenceIds));
    const controller = chooseNextCognitiveOperation({
      activeCognition: active, mindToy, attentionRemaining: Math.max(0, attention.remaining - retrieval.attentionSpent - 1),
      ideas: [{ idea, attempt, evaluation }], actConfidenceThreshold: 0.5,
    });
    if (controller.operation !== "act") throw new Error(`Guess V0 expected an actionable idea, got ${controller.operation}`);
    engine = applyGuessAction(engine, idea.actionId);
    const nextViewRef = `view:${engine.turn}`;
    trace = recordThought(trace, event(cycle, "game_action", "acted", [evaluationRef], [nextViewRef], 0, initialEvidenceIds));
    cycles.push({ cycle, playerView, active, buildRequest, buildResponse, mindToy, idea, attempt, evaluation, controller, actionId: idea.actionId });
  }
  validateTraceCausality(trace, initialEvidenceIds);
  return { schema: "guess_cognitive_run_v0", status: engine.status, turns: engine.turn, engine, cycles, trace };
}

function guessCalculators(facts) {
  const min = Number(facts.candidateMin);
  const max = Number(facts.candidateMax);
  return {
    probe_partition: ({ request, activeCognition }) => {
      const probe = Number(request.resolution?.probe);
      if (![min, max, probe].every(Number.isFinite) || probe < min || probe > max) return { status: "unknown", reason: "probe or candidate range is unavailable" };
      const count = max - min + 1;
      return {
        status: "estimated",
        value: { kind: "state_distribution", outcomes: [
          { stateId: "lower_than_probe", probability: (probe - min) / count },
          { stateId: "equal_to_probe", probability: 1 / count },
          { stateId: "higher_than_probe", probability: (max - probe) / count },
        ] },
        confidence: 0.8,
        evidenceIds: activeCognition.evidenceIds.filter((id) => id.includes("candidate_range") || id.includes("ordered_feedback")),
        assumptions: ["在没有更多线索时，主观上把当前候选看作等可能"],
      };
    },
    state_value: ({ request, activeCognition }) => {
      const probe = Number(request.resolution?.probe);
      const counts = {
        current_candidates: max - min + 1,
        lower_than_probe: Math.max(0, probe - min),
        equal_to_probe: 0,
        higher_than_probe: Math.max(0, max - probe),
      };
      if (!Object.hasOwn(counts, request.targetId)) return { status: "unknown", reason: "unknown subjective state" };
      const expected = request.targetId === "equal_to_probe" ? 10 : -counts[request.targetId];
      return {
        status: "estimated", value: { kind: "scalar", expected, range: [expected, expected] }, confidence: 0.8,
        evidenceIds: activeCognition.evidenceIds.filter((id) => id.includes("candidate_range") || id.includes("ordered_feedback")),
        assumptions: ["剩余候选越少，主观状态越接近目标"],
      };
    },
  };
}

function activeFacts(active) {
  return Object.assign({}, ...active.observations.map((row) => row.content?.facts || {}), ...active.knownRules.map((row) => row.facts || {}));
}
function event(cycle, module, type, inputRefs, outputRefs, attentionCost, initialEvidenceIds) {
  return { cycle, module, type, inputRefs, outputRefs, attentionCost, initialEvidenceIds };
}

module.exports = { runGuessCognitiveLoop };
