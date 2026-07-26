"use strict";

const { clone } = require("./contracts");
const { createPlayerView } = require("./game-boundary");

function createGuessGame(input = {}) {
  const min = integer(input.min, 1);
  const max = integer(input.max, 8);
  const target = integer(input.target, 6);
  if (min >= max || target < min || target > max) throw new Error("invalid guess game range or target");
  return {
    engineOnlyTarget: target,
    engineOnlySentinel: String(input.sentinel || "ENGINE_ONLY_RUNE_TRUTH"),
    min,
    max,
    knownMin: min,
    knownMax: max,
    turn: 0,
    status: "playing",
    history: [],
  };
}

function toGuessPlayerView(engineInput) {
  const engine = clone(engineInput);
  const candidates = range(engine.knownMin, engine.knownMax);
  const last = engine.history.at(-1) || null;
  const visibleSignals = [{
    id: `signal:candidate_range:${engine.turn}`,
    concepts: ["候选范围", "符文探测"],
    salience: 0.9,
    novelty: engine.turn === 0 ? 0.8 : 0.4,
    layers: [{
      id: "gist", cost: 0.5, importance: 1,
      text: `当前候选符文是${engine.knownMin}到${engine.knownMax}`,
      content: { facts: { candidateMin: engine.knownMin, candidateMax: engine.knownMax, candidateCount: candidates.length } },
    }],
  }];
  if (last) visibleSignals.push({
    id: `signal:last_feedback:${engine.turn}`,
    concepts: ["有序反馈", "符文探测"],
    salience: 1,
    novelty: 0.9,
    layers: [{
      id: "gist", cost: 0.5, importance: 1,
      text: last.feedback === "equal" ? `符文${last.probe}与目标一致`
        : `目标频率比符文${last.probe}${last.feedback === "higher" ? "更高" : "更低"}`,
      content: { facts: { lastProbe: last.probe, lastFeedback: last.feedback } },
    }],
  });
  return createPlayerView({
    gameId: "rune_guess_v0",
    turn: engine.turn,
    status: engine.status,
    scene: {
      id: "rune_console", label: "符文探测台", concepts: ["符文探测", "有序反馈"],
      environment: ["符文实验"], currentProblem: engine.status === "won" ? "已找到目标符文" : `从${engine.knownMin}到${engine.knownMax}中找出目标符文`,
    },
    publicRules: [{
      id: "rule:ordered_feedback", text: "探测后会得到目标频率更高、更低或一致", concepts: ["有序反馈"],
      facts: { feedbackKinds: ["lower", "equal", "higher"] },
    }],
    visibleSignals,
    allowedActions: engine.status === "playing" ? candidates.map((value) => `probe:rune_${value}`) : [],
    actionHistory: engine.history.map((row, index) => ({
      id: `history:${index + 1}`, turn: index, actionId: `probe:rune_${row.probe}`, feedback: row.feedback,
    })),
  });
}

function applyGuessAction(engineInput, actionId) {
  const engine = clone(engineInput);
  if (engine.status !== "playing") throw new Error("game is complete");
  const match = /^probe:rune_(\d+)$/.exec(String(actionId));
  if (!match) throw new Error(`invalid guess action ${actionId}`);
  const probe = Number(match[1]);
  if (probe < engine.knownMin || probe > engine.knownMax) throw new Error(`probe ${probe} is outside the known range`);
  const feedback = probe === engine.engineOnlyTarget ? "equal" : probe < engine.engineOnlyTarget ? "higher" : "lower";
  engine.history.push({ probe, feedback });
  engine.turn += 1;
  if (feedback === "equal") engine.status = "won";
  else if (feedback === "higher") engine.knownMin = probe + 1;
  else engine.knownMax = probe - 1;
  return engine;
}

function integer(value, fallback) { const number = Number(value); return Number.isInteger(number) ? number : fallback; }
function range(min, max) { return Array.from({ length: max - min + 1 }, (_, index) => min + index); }

module.exports = { applyGuessAction, createGuessGame, toGuessPlayerView };
