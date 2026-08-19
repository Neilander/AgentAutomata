"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const EXPERIMENTS = path.resolve(ROOT, "..");
const GAME_DATA = path.resolve(ROOT, "..", "..", "game_data");
const TEAM_EXPERIMENT = path.join(EXPERIMENTS, "team_vector_guess_v1");
const SOURCE_FILE = path.join(TEAM_EXPERIMENT, "artifacts", "team-vector-knowledge.json");
const SEMANTIC_FILE = path.join(ROOT, "artifacts", "semantic-inputs.json");
const HIDDEN_FILE = path.join(ROOT, "artifacts", "unseen-hidden-truth.json");
const OUT_FILE = path.join(ROOT, "artifacts", "closed-loop-results.json");

const COMBAT = require(path.join(GAME_DATA, "combat-sim"));
const BUILDER = require(path.join(TEAM_EXPERIMENT, "build-team-knowledge"));
const PARSER = require(path.join(EXPERIMENTS, "player_agent_api_loop_v1", "battle-information-parser"));
const { matchCausalChain } = require(path.join(GAME_DATA, "causal-chain-event-matcher"));
const { visibleActionId, visibleCharacterRef } = require(path.join(GAME_DATA, "public-causal-identifiers"));
const { buildHypothesisDirectedAttention } = require(path.join(
  EXPERIMENTS,
  "player_agent_api_loop_v1",
  "hypothesis-directed-attention",
));
const MIND_AI = require(path.join(EXPERIMENTS, "player_mind_toy_v0", "mind-toy-ai-loop"));
const MIND_RUNTIME = require(path.join(EXPERIMENTS, "player_mind_toy_v0", "mind-toy-runtime"));
const { ValueField, adaptiveRadius, dot } = require("./value-field");

const RECALL_LIMIT = 8;
const MIND_TOY_LIMIT = 3;
const ATTEMPT_LIMIT = 2;
const AVAILABLE_TEAM_LIMIT = 16;
const FIT_WEIGHT = 0.5;
const VALUE_WEIGHT = 0.5;

const KEYWORD_ROLE_WEIGHTS = Object.freeze({
  survive: { knight: 4, priest: 4, berserker: 2, warrior: 2, bard: 1 },
  finish: { mage: 4, ranger: 4, assassin: 4, warrior: 2, berserker: 2 },
  attrition: { warlock: 4, alchemist: 4, priest: 3, knight: 2, mage: 1 },
  reliable: { knight: 3, priest: 3, warrior: 2, mage: 2, ranger: 2 },
});

const HYPOTHESIS_TEMPLATES = Object.freeze({
  knight: { skill: "guard", effect: "shield_applied", concept: "shield", label: "骑士护盾" },
  priest: { skill: "heal", effect: "heal_applied", concept: "healing", label: "牧师治疗" },
  ranger: { skill: "pinningArrow", effect: "control_applied", concept: "control", label: "游侠限制" },
  mage: { skill: "fireball", effect: "damage_dealt", concept: "burst", label: "法师火焰伤害" },
  assassin: { skill: "toxicStabs", effect: "damage_dealt", concept: "sustained_damage", label: "刺客持续伤害" },
  warlock: { skill: "venomBrand", effect: "damage_dealt", concept: "sustained_damage", label: "术士持续伤害" },
  alchemist: { skill: "miasmaFlask", effect: "damage_dealt", concept: "sustained_damage", label: "炼金持续伤害" },
  berserker: { skill: "bloodStrike", effect: "damage_dealt", concept: "burst", label: "狂战伤害" },
  warrior: { skill: "powerStrike", effect: "damage_dealt", concept: "burst", label: "战士伤害" },
  bard: { skill: "tempoSong", effect: "buff_applied", concept: "control", label: "吟游节奏增益" },
});

function main() {
  const source = readJson(SOURCE_FILE);
  const semantic = readJson(SEMANTIC_FILE);
  const hidden = readJson(HIDDEN_FILE);
  validateBoundaries(source, semantic, hidden);

  const teams = source.teams;
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const coordinates = new Map(semantic.teamOrder.map((teamId, index) => [teamId, semantic.teamCoordinates[index]]));
  const needs = Object.fromEntries(Object.entries(semantic.needs).map(([id, row]) => [id, row.vector]));
  const concepts = Object.fromEntries(Object.entries(semantic.concepts).map(([id, row]) => [id, row.vector]));
  const historicalWinRate = buildHistoricalWinRates(source);
  const radius = adaptiveRadius([...coordinates.values()]);
  const baseField = buildBaseField(teams, coordinates, historicalWinRate, radius);
  const episodes = buildEpisodes(teams, hidden.opponents);
  const methodRows = Object.fromEntries([
    "random",
    "keyword",
    "semantic_only",
    "static_fit_value",
    "mindtoy_no_learning",
    "persistent_r_only",
    "full_closed_loop",
  ].map((id) => [id, []]));
  const persistentLearningFields = new Map(hidden.opponents.map((opponentId) => [
    opponentId,
    baseField.clone(),
  ]));
  const persistentROnlyFields = new Map(hidden.opponents.map((opponentId) => [
    opponentId,
    baseField.clone(),
  ]));

  for (const episode of episodes) {
    const availableTeams = episode.availableTeamIds.map((teamId) => teamById.get(teamId));
    const fitRows = semanticScores(availableTeams, coordinates, needs[episode.needId], new Set([episode.startTeamId]));
    const plans = {
      random: randomPlan(availableTeams, episode),
      keyword: keywordPlan(availableTeams, episode),
      semantic_only: fitRows.slice(0, ATTEMPT_LIMIT).map((row) => row.teamId),
      static_fit_value: staticPlan(fitRows, historicalWinRate),
    };
    for (const [methodId, plan] of Object.entries(plans)) {
      methodRows[methodId].push(runStaticMethod({ methodId, plan, episode, teamById }));
    }
    methodRows.full_closed_loop.push(runFullMethod({
      episode,
      teams: availableTeams,
      teamById,
      coordinates,
      needVector: needs[episode.needId],
      concepts,
      baseField: persistentLearningFields.get(episode.opponentId),
      learnTeamResults: true,
      learnVerifiedConcepts: true,
      cloneField: false,
    }));
    methodRows.mindtoy_no_learning.push(runFullMethod({
      episode,
      teams: availableTeams,
      teamById,
      coordinates,
      needVector: needs[episode.needId],
      concepts,
      baseField,
      learnTeamResults: false,
      learnVerifiedConcepts: false,
      cloneField: true,
    }));
    methodRows.persistent_r_only.push(runFullMethod({
      episode,
      teams: availableTeams,
      teamById,
      coordinates,
      needVector: needs[episode.needId],
      concepts,
      baseField: persistentROnlyFields.get(episode.opponentId),
      learnTeamResults: true,
      learnVerifiedConcepts: false,
      cloneField: false,
    }));
  }

  const hiddenTruth = new Map(hidden.rows.map((row) => [`${row.teamId}|${row.opponentId}`, row.winRate]));
  const methods = Object.fromEntries(Object.entries(methodRows).map(([id, rows]) => [
    id,
    summarizeMethod(rows, hiddenTruth),
  ]));
  const fullRows = methodRows.full_closed_loop;
  const payload = {
    schema: "semantic_solution_closed_loop_v0",
    boundary: {
      formalPlayerAgentModified: false,
      opponentsAbsentFromPriorTraining: true,
      hiddenTruthUsedForSelection: false,
      startFailureUsesLiveVisibleResultOnly: true,
      mindToyModel: "multi_ranking",
      mindToyBuiltByAI: false,
      mindToyReason: "one-step roster choice has a frozen minimal sufficient structure; experiment tests retrieval and learning rather than AI schema generation",
      diagnosisRuleIsCodeOwnedV0: true,
      causalVerificationUsesOrdinaryPerceptionAndRealStructuredEventMatcher: true,
      fullLoopMemoryPersistsAcrossEpisodesWithinTheSameOpponent: true,
      noLearningBaselineResetsAfterEachEpisode: true,
    },
    parameters: {
      recallLimit: RECALL_LIMIT,
      mindToyLimit: MIND_TOY_LIMIT,
      attemptLimit: ATTEMPT_LIMIT,
      availableTeamLimit: AVAILABLE_TEAM_LIMIT,
      fitWeight: FIT_WEIGHT,
      contextualValueWeight: VALUE_WEIGHT,
      adaptiveDirectRadius: round(radius, 6),
      conceptRadius: round(Math.max(radius * 2.2, 0.02), 6),
      conceptInfluence: "relative activation squared from the known-team 30th to 90th semantic percentile",
    },
    corpus: {
      teamCount: teams.length,
      priorOpponentCount: source.opponents.length,
      unseenOpponents: hidden.opponents,
      episodeCount: episodes.length,
      candidatePoolRule: "start team plus 15 deterministic player-available teams chosen without hidden outcomes",
      needCounts: countBy(episodes, (row) => row.needId),
    },
    methods,
    learningAudit: {
      eVerifyStatuses: countBy(
        fullRows.flatMap((row) => row.attempts),
        (row) => row.eVerify?.status || "no_hypothesis",
      ),
      eVerifyStepStates: countBy(
        fullRows.flatMap((row) => row.attempts).flatMap((row) => row.verificationSteps || []),
        (row) => `${row.state}:${row.reason || "matched"}`,
      ),
      secondAttemptCount: fullRows.filter((row) => row.attempts.length > 1).length,
      fallbackHiddenDelta: summarizeFallbackDelta(fullRows, hiddenTruth),
      pairedAgainstNoLearning: comparePairedMethods(
        fullRows,
        methodRows.mindtoy_no_learning,
        hiddenTruth,
      ),
      pairedAgainstROnly: comparePairedMethods(
        fullRows,
        methodRows.persistent_r_only,
        hiddenTruth,
      ),
      rOnlyAgainstNoLearning: comparePairedMethods(
        methodRows.persistent_r_only,
        methodRows.mindtoy_no_learning,
        hiddenTruth,
      ),
      maximumRecallCount: Math.max(...fullRows.map((row) => Math.max(...row.selectionTraces.map((trace) => trace.recalled.length)))),
      maximumMindToyOptionCount: Math.max(...fullRows.map((row) => Math.max(...row.selectionTraces.map((trace) => trace.mindToyOptions.length)))),
    },
    sampleEpisodes: fullRows.slice(0, 8),
  };
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: OUT_FILE,
    episodes: episodes.length,
    methods: Object.fromEntries(Object.entries(methods).map(([id, row]) => [id, {
      actualSolveRate: row.actualSolveRate,
      firstChoiceHiddenWinRate: row.firstChoiceHiddenWinRate,
      selectedAttemptHiddenWinRate: row.selectedAttemptHiddenWinRate,
      improvementOverStart: row.hiddenImprovementOverStart,
    }])),
    learningAudit: payload.learningAudit,
  }, null, 2));
}

function validateBoundaries(source, semantic, hidden) {
  const seen = new Set(source.opponents.map((row) => row.id));
  if (hidden.opponents.some((id) => seen.has(id))) throw new Error("unseen validation overlaps prior opponent training");
  if (semantic.boundary.teamCoordinatesExcludeOutcomeClaims !== true) throw new Error("coordinates include outcome claims");
  if (hidden.boundary.usedForSelection !== false) throw new Error("hidden truth selection boundary missing");
  if (semantic.teamOrder.length !== source.teams.length) throw new Error("team coordinate count mismatch");
}

function buildHistoricalWinRates(source) {
  const rows = new Map(source.teams.map((team) => [team.id, []]));
  for (const cell of source.knowledge.cells) {
    rows.get(cell.subject.id).push(cell.result.outcome === "win" ? 1 : 0);
  }
  return new Map([...rows].map(([teamId, values]) => [teamId, mean(values)]));
}

function buildBaseField(teams, coordinates, historicalWinRate, radius) {
  const field = new ValueField({
    directRadius: radius,
    conceptRadius: Math.max(radius * 2.2, 0.02),
    priorMass: 0.25,
    referenceCoordinates: [...coordinates.values()],
  });
  for (const team of teams) {
    field.addTeamResult({
      coordinate: coordinates.get(team.id),
      context: "*",
      utility: historicalWinRate.get(team.id),
      weight: 0.18,
      source: `prior-six-context-reputation:${team.id}`,
    });
  }
  return field;
}

function buildEpisodes(teams, opponents) {
  const episodes = [];
  for (const opponentId of opponents) {
    for (const team of teams) {
      const result = simulate(team, opponentId, `semantic-loop-start|${team.id}|${opponentId}`);
      if (result.winner === "left") continue;
      const diagnosis = diagnoseVisibleFailure(result);
      episodes.push({
        id: `${opponentId}|${team.id}`,
        opponentId,
        startTeamId: team.id,
        needId: diagnosis.needId,
        diagnosis,
        startVisibleResult: publicResult(result),
        availableTeamIds: availableTeamPool(teams, team.id, `${opponentId}|${team.id}`),
      });
    }
  }
  if (!episodes.length) throw new Error("sealed opponents produced no failed starting episodes");
  return episodes;
}

function availableTeamPool(teams, startTeamId, seed) {
  const random = seededRandom(`available-team-pool|${seed}`);
  const others = teams
    .filter((team) => team.id !== startTeamId)
    .map((team) => ({ teamId: team.id, key: random() }))
    .sort((a, b) => a.key - b.key || a.teamId.localeCompare(b.teamId))
    .slice(0, AVAILABLE_TEAM_LIMIT - 1)
    .map((row) => row.teamId);
  return [startTeamId, ...others];
}

function diagnoseVisibleFailure(result) {
  const enemyHp = Number(result.rightHp || 0);
  const duration = Number(result.duration || 0);
  if (enemyHp <= 0.25) return { needId: "finish", reason: "敌方残余生命不高，玩家可见问题是未完成最后击杀" };
  if (duration >= 28) return { needId: "attrition", reason: "战斗持续很久后失败，玩家可见问题是持久作战不足" };
  if (duration <= 16 || Number(result.leftHp || 0) <= 0.05) {
    return { needId: "survive", reason: "我方快速或彻底倒下，玩家可见问题是生存窗口不足" };
  }
  return { needId: "reliable", reason: "可见结果没有单一突出信号，只形成低精度的可靠性需求" };
}

function semanticScores(teams, coordinates, needVector, excluded) {
  const raw = teams
    .filter((team) => !excluded.has(team.id))
    .map((team) => ({ teamId: team.id, rawFit: dot(coordinates.get(team.id), needVector) }))
    .sort((a, b) => b.rawFit - a.rawFit || a.teamId.localeCompare(b.teamId));
  const min = Math.min(...raw.map((row) => row.rawFit));
  const max = Math.max(...raw.map((row) => row.rawFit));
  return raw.map((row, index) => ({
    ...row,
    fit: max > min ? (row.rawFit - min) / (max - min) : 0.5,
    fitRank: index + 1,
  }));
}

function randomPlan(teams, episode) {
  const rows = teams.filter((team) => team.id !== episode.startTeamId);
  const random = seededRandom(`random-baseline|${episode.id}`);
  return rows.map((team) => ({ team, key: random() })).sort((a, b) => a.key - b.key).slice(0, ATTEMPT_LIMIT).map((row) => row.team.id);
}

function keywordPlan(teams, episode) {
  const weights = KEYWORD_ROLE_WEIGHTS[episode.needId];
  return teams
    .filter((team) => team.id !== episode.startTeamId)
    .map((team) => ({ teamId: team.id, score: team.roles.reduce((sum, role) => sum + Number(weights[role] || 0), 0) }))
    .sort((a, b) => b.score - a.score || a.teamId.localeCompare(b.teamId))
    .slice(0, ATTEMPT_LIMIT)
    .map((row) => row.teamId);
}

function staticPlan(fitRows, historicalWinRate) {
  return fitRows
    .slice(0, RECALL_LIMIT)
    .map((row) => ({ ...row, score: FIT_WEIGHT * row.fit + VALUE_WEIGHT * historicalWinRate.get(row.teamId) }))
    .sort((a, b) => b.score - a.score || a.teamId.localeCompare(b.teamId))
    .slice(0, ATTEMPT_LIMIT)
    .map((row) => row.teamId);
}

function runStaticMethod({ methodId, plan, episode, teamById }) {
  const attempts = [];
  for (const [index, teamId] of plan.entries()) {
    const result = simulate(
      teamById.get(teamId),
      episode.opponentId,
      `semantic-loop-${methodId}|${index + 1}|${episode.id}`,
    );
    attempts.push({ teamId, outcome: result.winner === "left" ? "win" : "loss", visibleResult: publicResult(result) });
    if (result.winner === "left") break;
  }
  return { episodeId: episode.id, opponentId: episode.opponentId, startTeamId: episode.startTeamId, needId: episode.needId, attempts };
}

function runFullMethod({
  episode,
  teams,
  teamById,
  coordinates,
  needVector,
  concepts,
  baseField,
  learnTeamResults,
  learnVerifiedConcepts,
  cloneField,
}) {
  const field = cloneField ? baseField.clone() : baseField;
  field.addTeamResult({
    coordinate: coordinates.get(episode.startTeamId),
    context: episode.opponentId,
    utility: 0,
    source: `visible-start-failure:${episode.id}`,
  });
  const excluded = new Set([episode.startTeamId]);
  const attempts = [];
  const selectionTraces = [];
  let lastEVerify = null;
  for (let index = 0; index < ATTEMPT_LIMIT; index += 1) {
    const selection = chooseWithMindToy({ teams, coordinates, needVector, field, context: episode.opponentId, excluded });
    selectionTraces.push(selection.trace);
    const team = teamById.get(selection.teamId);
    const hypothesis = buildHypothesis(team, episode, index);
    const observed = simulateAndVerify(team, episode.opponentId, index, episode.id, hypothesis);
    const utility = observed.result.winner === "left" ? 1 : 0;
    if (learnTeamResults) {
      field.addTeamResult({
        coordinate: coordinates.get(team.id),
        context: episode.opponentId,
        utility,
        source: `attempt-result:${episode.id}:${index + 1}`,
      });
    }
    const causalUpdate = verifiedConceptUpdate(observed.verification);
    if (learnVerifiedConcepts && causalUpdate && concepts[hypothesis.conceptId]) {
      field.addConceptResult({
        coordinate: concepts[hypothesis.conceptId],
        context: episode.opponentId,
        utility: causalUpdate.utility,
        support: causalUpdate.strength,
        source: `everify:${episode.id}:${index + 1}:${causalUpdate.status}`,
      });
    }
    lastEVerify = observed.verification?.everify || null;
    attempts.push({
      teamId: team.id,
      outcome: utility ? "win" : "loss",
      visibleResult: publicResult(observed.result),
      hypothesis: { id: hypothesis.id, conceptId: hypothesis.conceptId, claim: hypothesis.claim },
      eVerify: lastEVerify ? {
        status: lastEVerify.status,
        support: lastEVerify.dimensions.support,
        strength: lastEVerify.dimensions.strength,
      } : null,
      verificationSteps: (observed.verification?.stepMatches || []).map((row) => ({
        stepId: row.stepId,
        state: row.state,
        reason: row.reason,
      })),
      causalUpdate,
    });
    excluded.add(team.id);
    if (utility) break;
  }
  return {
    episodeId: episode.id,
    opponentId: episode.opponentId,
    startTeamId: episode.startTeamId,
    needId: episode.needId,
    diagnosis: episode.diagnosis,
    attempts,
    selectionTraces,
    eVerify: lastEVerify ? { status: lastEVerify.status } : null,
    learning: {
      teamResults: learnTeamResults,
      verifiedConcepts: learnVerifiedConcepts,
    },
  };
}

function chooseWithMindToy({ teams, coordinates, needVector, field, context, excluded }) {
  const allFits = semanticScores(teams, coordinates, needVector, excluded);
  const recalled = allFits.slice(0, RECALL_LIMIT).map((row) => ({
    ...row,
    value: field.evaluate(coordinates.get(row.teamId), context),
  }));
  const shortlist = [...recalled]
    .map((row) => ({
      ...row,
      preattentiveActivation: FIT_WEIGHT * row.fit + VALUE_WEIGHT * row.value.value,
    }))
    .sort((a, b) => b.preattentiveActivation - a.preattentiveActivation || a.teamId.localeCompare(b.teamId))
    .slice(0, MIND_TOY_LIMIT);
  const attempt = runMindToy(shortlist, context);
  return {
    teamId: attempt.selected.id,
    trace: {
      recalled: recalled.map((row) => ({ teamId: row.teamId, fit: round(row.fit), value: round(row.value.value) })),
      mindToyOptions: shortlist.map((row) => row.teamId),
      ranking: attempt.ranking.map((row) => ({ teamId: row.id, score: row.score, confidence: row.confidence })),
      selectedTeamId: attempt.selected.id,
      consideredOptions: attempt.trace.consideredOptions,
    },
  };
}

function runMindToy(shortlist, context) {
  const evidence = [];
  for (const row of shortlist) {
    evidence.push({ id: `fit:${row.teamId}`, text: "玩家知识与当前需求的语义匹配", facts: { value: row.fit } });
    evidence.push({ id: `value:${context}:${row.teamId}`, text: "玩家当前价值地形的主观估算", facts: { value: row.value.value } });
  }
  let session = MIND_AI.createSession({
    observableContext: { id: `roster-choice:${context}`, visibleEvidence: evidence },
    goal: { id: "replace_failed_team", text: "从已召回候选中选择下一支值得尝试的队伍" },
    playerMemory: [],
    knowledgePolicy: { mode: "open_but_player_visible" },
  });
  const estimationRequests = [];
  const options = shortlist.map((row) => {
    const fitId = `estimate-fit:${row.teamId}`;
    const valueId = `estimate-value:${row.teamId}`;
    estimationRequests.push(
      { id: fitId, targetKind: "dimension", targetId: row.teamId, field: "requirement_fit", outputShape: "feature_scalar", knowledgeRule: "derive_only_from_cited_knowledge", reason: "判断候选是否回应当前问题" },
      { id: valueId, targetKind: "dimension", targetId: row.teamId, field: "contextual_value", outputShape: "feature_scalar", knowledgeRule: "derive_only_from_cited_knowledge", reason: "判断玩家经验是否支持在当前环境尝试" },
    );
    return { id: row.teamId, availability: "available", valueEstimateIds: { requirement_fit: fitId, contextual_value: valueId } };
  });
  session = MIND_AI.applyBuildResponse(session, {
    schema: MIND_AI.BUILD_RESPONSE_SCHEMA,
    selectedModel: MIND_AI.MODEL_TYPES.MULTI_RANKING,
    selectionReason: "一次换队选择同时比较需求匹配和当前环境价值，最低充分模型是多价值排行榜。",
    rejectedHigherComplexity: "本轮没有路径、前置条件或连续状态变化。",
    structure: {
      model: MIND_AI.MODEL_TYPES.MULTI_RANKING,
      dimensions: [
        { id: "requirement_fit", direction: "maximize", weight: FIT_WEIGHT },
        { id: "contextual_value", direction: "maximize", weight: VALUE_WEIGHT },
      ],
      options,
    },
    estimationRequests,
  });
  const estimates = [];
  for (const row of shortlist) {
    estimates.push(estimate(`estimate-fit:${row.teamId}`, row.fit, row.value.epistemicConfidence, [`fit:${row.teamId}`]));
    estimates.push(estimate(`estimate-value:${row.teamId}`, row.value.value, row.value.epistemicConfidence, [`value:${context}:${row.teamId}`]));
  }
  session = MIND_AI.applyEstimateResponse(session, { schema: MIND_AI.ESTIMATE_RESPONSE_SCHEMA, estimates });
  return MIND_RUNTIME.attempt(session.mindToy);
}

function estimate(requestId, expected, confidence, evidenceIds) {
  return {
    requestId,
    status: "estimated",
    value: { kind: "scalar", expected: round(expected, 6), range: [0, 1] },
    confidence: round(confidence, 6),
    evidenceIds,
    assumptions: ["这是玩家基于有限经历形成的主观估算，不是隐藏胜率"],
  };
}

function buildHypothesis(team, episode, attemptIndex) {
  const roleOrder = preferredRoles(episode.needId, team.roles);
  const role = roleOrder[0];
  const slotIndex = team.roles.indexOf(role);
  const template = HYPOTHESIS_TEMPLATES[role];
  const memberId = `${team.id}:slot-${slotIndex + 1}`;
  const subject = visibleCharacterRef(memberId);
  const actionId = visibleActionId(template.skill);
  const prefix = `${episode.id}:attempt-${attemptIndex + 1}`;
  return {
    id: `hypothesis:${prefix}`,
    claim: `${template.label}形成一条有助于战斗胜利的路径`,
    chosenBehavior: `fight:${team.id}`,
    action: `fight:${team.id}`,
    verificationScope: "current_action",
    claimMode: "contributing_path",
    status: "pending",
    conceptId: template.concept,
    causalChain: [
      {
        id: `${prefix}:skill`,
        statement: `${template.label}对应技能被施放`,
        matcher: { predicate: "skill_cast", subject, actionId },
      },
      {
        id: `${prefix}:effect`,
        statement: `${template.label}产生预期效果`,
        matcher: { predicate: template.effect, subject, actionId },
      },
      {
        id: `${prefix}:win`,
        statement: "战斗胜利",
        matcher: { predicate: "combat_won" },
      },
    ],
  };
}

function preferredRoles(needId, roles) {
  const preference = {
    survive: ["knight", "priest", "berserker", "warrior", "bard"],
    finish: ["ranger", "mage", "assassin", "warrior", "berserker"],
    attrition: ["warlock", "alchemist", "priest", "knight", "mage"],
    reliable: ["knight", "priest", "ranger", "mage", "warrior"],
  }[needId];
  return [...preference.filter((role) => roles.includes(role)), ...roles.filter((role) => !preference.includes(role))];
}

function simulateAndVerify(team, opponentId, attemptIndex, episodeId, hypothesis) {
  const combatTeam = BUILDER.buildCombatTeam(team);
  const result = COMBAT.simulateTeams(
    combatTeam,
    COMBAT.clonePreset(opponentId),
    {
      seed: `semantic-loop-full|${attemptIndex + 1}|${episodeId}`,
      randomizeStats: false,
      maxTime: 75,
      healthInterval: 0.5,
    },
  );
  const events = BUILDER.toVisibleSemanticEvents(result, team, { id: opponentId, label: opponentId, probe: "sealed" });
  const attention = buildHypothesisDirectedAttention([hypothesis], { action: hypothesis.action });
  const parsed = PARSER.parseBattleInformation(events, {
    seed: `semantic-loop-perception|${attemptIndex + 1}|${episodeId}`,
    perceptionLevel: "ordinary",
    hypothesisAttention: attention,
    causalContext: {
      region: "semantic_solution_loop",
      node: opponentId,
      teamMembers: combatTeam.map((row) => ({ id: row.id, name: row.name })),
    },
  });
  const verification = matchCausalChain({
    hypothesis,
    receivedSemanticEvents: parsed.causalEvidence,
  });
  return { result, parsed, verification };
}

function verifiedConceptUpdate(verification) {
  const everify = verification?.everify;
  if (!everify) return null;
  if (everify.status === "confirmed") {
    return { status: "confirmed", utility: 1, strength: everify.dimensions.strength };
  }
  const finalStep = verification.stepMatches?.at(-1);
  if (everify.status === "refuted" && finalStep?.state === "contradicted" && everify.chainAudit.supportedPrefixLinkCount >= 1) {
    return { status: "refuted_after_observed_path", utility: 0, strength: everify.dimensions.strength };
  }
  return null;
}

function summarizeMethod(rows, hiddenTruth) {
  const starts = rows.map((row) => hiddenTruth.get(`${row.startTeamId}|${row.opponentId}`));
  const first = rows.map((row) => hiddenTruth.get(`${row.attempts[0].teamId}|${row.opponentId}`));
  const selected = rows.flatMap((row) => row.attempts.map((attempt) => hiddenTruth.get(`${attempt.teamId}|${row.opponentId}`)));
  const solved = rows.filter((row) => row.attempts.some((attempt) => attempt.outcome === "win")).length;
  return {
    episodeCount: rows.length,
    actualSolveRate: round(solved / rows.length),
    meanAttemptsUsed: round(mean(rows.map((row) => row.attempts.length))),
    startHiddenWinRate: round(mean(starts)),
    firstChoiceHiddenWinRate: round(mean(first)),
    selectedAttemptHiddenWinRate: round(mean(selected)),
    hiddenImprovementOverStart: round(mean(first) - mean(starts)),
    positiveFirstChoiceImprovementRate: round(first.filter((value, index) => value > starts[index]).length / rows.length),
    perOpponent: Object.fromEntries([...new Set(rows.map((row) => row.opponentId))].map((opponentId) => {
      const subset = rows.filter((row) => row.opponentId === opponentId);
      const opponentFirst = subset.map((row) => hiddenTruth.get(`${row.attempts[0].teamId}|${opponentId}`));
      const opponentStart = subset.map((row) => hiddenTruth.get(`${row.startTeamId}|${opponentId}`));
      return [opponentId, {
        episodes: subset.length,
        actualSolveRate: round(subset.filter((row) => row.attempts.some((attempt) => attempt.outcome === "win")).length / subset.length),
        firstChoiceHiddenWinRate: round(mean(opponentFirst)),
        hiddenImprovementOverStart: round(mean(opponentFirst) - mean(opponentStart)),
      }];
    })),
  };
}

function summarizeFallbackDelta(rows, hiddenTruth) {
  const deltas = rows
    .filter((row) => row.attempts.length > 1)
    .map((row) => hiddenTruth.get(`${row.attempts[1].teamId}|${row.opponentId}`)
      - hiddenTruth.get(`${row.attempts[0].teamId}|${row.opponentId}`));
  return {
    cases: deltas.length,
    meanDelta: round(mean(deltas)),
    positiveRate: deltas.length ? round(deltas.filter((value) => value > 0).length / deltas.length) : 0,
  };
}

function comparePairedMethods(fullRows, noLearningRows, hiddenTruth) {
  const noLearningByEpisode = new Map(noLearningRows.map((row) => [row.episodeId, row]));
  const firstChoiceDeltas = [];
  let differentFirstChoices = 0;
  let fullBetter = 0;
  let noLearningBetter = 0;
  for (const full of fullRows) {
    const baseline = noLearningByEpisode.get(full.episodeId);
    if (!baseline) continue;
    const fullTeamId = full.attempts[0].teamId;
    const baselineTeamId = baseline.attempts[0].teamId;
    if (fullTeamId !== baselineTeamId) differentFirstChoices += 1;
    const fullValue = hiddenTruth.get(`${fullTeamId}|${full.opponentId}`);
    const baselineValue = hiddenTruth.get(`${baselineTeamId}|${full.opponentId}`);
    const delta = fullValue - baselineValue;
    firstChoiceDeltas.push(delta);
    if (delta > 0) fullBetter += 1;
    if (delta < 0) noLearningBetter += 1;
  }
  return {
    cases: firstChoiceDeltas.length,
    differentFirstChoiceRate: round(differentFirstChoices / Math.max(1, firstChoiceDeltas.length)),
    meanFirstChoiceHiddenDelta: round(mean(firstChoiceDeltas)),
    fullBetterRate: round(fullBetter / Math.max(1, firstChoiceDeltas.length)),
    noLearningBetterRate: round(noLearningBetter / Math.max(1, firstChoiceDeltas.length)),
  };
}

function simulate(team, opponentId, seed) {
  return COMBAT.simulateTeams(
    BUILDER.buildCombatTeam(team),
    COMBAT.clonePreset(opponentId),
    { seed, randomizeStats: false, maxTime: 75, healthInterval: 0.5 },
  );
}

function publicResult(result) {
  return {
    outcome: result.winner === "left" ? "win" : "loss",
    duration: round(result.duration),
    ownHp: round(result.leftHp),
    enemyHp: round(result.rightHp),
    ownAlive: result.metrics.leftAlive,
    enemyAlive: result.metrics.rightAlive,
  };
}

function countBy(rows, selector) {
  const result = {};
  for (const row of rows) {
    const key = selector(row);
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function seededRandom(seedText) {
  let state = hash32(seedText) || 0x9e3779b9;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hash32(text) {
  let hash = 2166136261;
  for (const char of String(text)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0; }
function round(value, digits = 4) { return Number(Number(value || 0).toFixed(digits)); }

if (require.main === module) main();
