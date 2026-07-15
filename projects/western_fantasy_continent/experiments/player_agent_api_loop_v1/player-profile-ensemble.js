const LOOP = require("./player-agent-loop");
const PROFILES = require("./player-profiles");

const SCHEMA = "player_profile_ensemble_v1";

function createEnsemble(options = {}) {
  const seed = String(options.seed || "player-profile-ensemble");
  const maxCycles = Math.max(1, Math.floor(Number(options.maxCycles) || 2));
  const chapter = Number(options.chapter) === 2 ? 2 : 1;
  const selected = PROFILES.selectPlayerProfiles({
    profileIds: options.profileIds,
    profileCount: options.profileCount,
    selectionSeed: options.selectionSeed || seed,
  });
  const runs = selected.map((profile) => ({
    profileId: profile.id,
    session: chapter === 2
      ? LOOP.createChapter2Session(seed, maxCycles, options.priorPlayerState || null, { profileId: profile.id })
      : LOOP.createSession(seed, maxCycles, { profileId: profile.id }),
  }));
  return {
    schema: SCHEMA,
    seed,
    chapter,
    maxCycles,
    selectedProfileIds: selected.map((row) => row.id),
    runs,
  };
}

function getPendingRequests(ensembleInput) {
  const ensemble = validate(ensembleInput);
  return ensemble.runs.map((run) => ({
    profileId: run.profileId,
    request: LOOP.getPendingRequest(run.session),
  }));
}

function applyDecisionResponse(ensembleInput, profileId, response) {
  return updateRun(ensembleInput, profileId, (session) => LOOP.applyDecisionResponse(session, response));
}

function applyAttributionResponse(ensembleInput, profileId, response) {
  return updateRun(ensembleInput, profileId, (session) => LOOP.applyAttributionResponse(session, response));
}

function updateRun(ensembleInput, profileId, updater) {
  const ensemble = validate(ensembleInput);
  const run = ensemble.runs.find((row) => row.profileId === profileId);
  if (!run) throw new Error(`profile is not selected in this ensemble: ${profileId}`);
  run.session = updater(run.session);
  return ensemble;
}

function validate(input) {
  const ensemble = structuredClone(input);
  if (!ensemble || ensemble.schema !== SCHEMA || !Array.isArray(ensemble.runs)) {
    throw new Error("invalid player profile ensemble");
  }
  return ensemble;
}

module.exports = {
  SCHEMA,
  applyAttributionResponse,
  applyDecisionResponse,
  createEnsemble,
  getPendingRequests,
};
