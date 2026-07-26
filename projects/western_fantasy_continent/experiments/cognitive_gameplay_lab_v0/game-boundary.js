"use strict";

const { SCHEMAS, clone, uniqueStrings } = require("./contracts");

const PLAYER_VIEW_KEYS = new Set([
  "gameId",
  "turn",
  "status",
  "scene",
  "publicRules",
  "visibleSignals",
  "allowedActions",
  "actionHistory",
]);

function createPlayerView(engineSnapshot = {}) {
  const view = {};
  for (const key of PLAYER_VIEW_KEYS) {
    if (Object.hasOwn(engineSnapshot, key)) view[key] = clone(engineSnapshot[key]);
  }
  view.schema = SCHEMAS.GAME_VIEW;
  view.gameId = String(view.gameId || "unknown_game");
  view.turn = nonNegativeInteger(view.turn, 0);
  view.status = String(view.status || "playing");
  view.scene = normalizeScene(view.scene);
  view.publicRules = normalizeRows(view.publicRules, "rule");
  view.visibleSignals = normalizeRows(view.visibleSignals, "signal");
  view.allowedActions = uniqueStrings(view.allowedActions);
  view.actionHistory = normalizeRows(view.actionHistory, "action_history");
  assertNoForbiddenKeys(view);
  return view;
}

function assertNoForbiddenKeys(value, path = "playerView") {
  if (!value || typeof value !== "object") return true;
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase();
    if (["truth", "secret", "hidden", "solution", "answer", "engineonly", "designertruth"].some((word) => normalized.includes(word))) {
      throw new Error(`forbidden hidden-state key at ${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`);
  }
  return true;
}

function assertSentinelAbsent(value, sentinel) {
  if (!sentinel) throw new Error("sentinel is required");
  if (JSON.stringify(value).includes(String(sentinel))) {
    throw new Error("hidden-state sentinel leaked into player-facing data");
  }
  return true;
}

function normalizeScene(input) {
  const scene = input && typeof input === "object" && !Array.isArray(input) ? clone(input) : {};
  return {
    id: String(scene.id || "scene"),
    label: String(scene.label || scene.id || "scene"),
    concepts: uniqueStrings(scene.concepts),
    environment: uniqueStrings(scene.environment),
    currentProblem: String(scene.currentProblem || ""),
  };
}

function normalizeRows(input, prefix) {
  return (Array.isArray(input) ? input : []).map((row, index) => {
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      throw new Error(`${prefix} row must be an object`);
    }
    return { id: String(row.id || `${prefix}:${index + 1}`), ...clone(row) };
  });
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : fallback;
}

module.exports = {
  PLAYER_VIEW_KEYS,
  assertNoForbiddenKeys,
  assertSentinelAbsent,
  createPlayerView,
};
