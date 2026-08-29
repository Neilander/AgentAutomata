"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { UfsFeedbackLearner } = require("./ufs-feedback-learning");
const { UfsFullGameFeedbackBridge } = require("./ufs-full-game-feedback-bridge");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");

const TEMPLATE_SCHEMA = "ufs_initial_player_template_v1";
const PROFILE_SCHEMA = "ufs_player_profile_v1";
const TEMPLATE_ID = "ufs-page9-rule-reader-player-v1";
const PLAYER_ID = /^[A-Za-z0-9._-]{1,64}$/u;

const FROZEN_ASSET_PATHS = Object.freeze([
  "rule_reading_trajectory_v0/source_rules.json",
  "rule_reading_trajectory_v0/ai_compiled_trajectories.json",
  "rule_reading_trajectory_v0/artifacts/node_gte_matrix_manifest.json",
  "rule_reading_trajectory_v0/artifacts/current_matrix.f32",
  "rule_reading_trajectory_v0/artifacts/following_matrix.f32",
  "rule_reading_trajectory_v0/artifacts/coarse_matrix.f32",
  "../ufs_cognitive_program_library_v0/library/program-library.json",
]);

function clone(value) {
  return structuredClone(value);
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function assertPlayerId(playerId, label = "playerId") {
  if (typeof playerId !== "string" || !PLAYER_ID.test(playerId)) {
    throw new TypeError(`${label} must use 1-64 letters, digits, dot, underscore, or hyphen`);
  }
}

function assertSeed(seed) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new TypeError("attentionSeed must be an unsigned 32-bit integer");
  }
}

function buildInitialPlayerTemplate() {
  const assets = FROZEN_ASSET_PATHS.map((relativePath) => {
    const absolutePath = path.resolve(__dirname, relativePath);
    const bytes = fs.readFileSync(absolutePath);
    return {
      path: relativePath.replaceAll("\\", "/"),
      bytes: bytes.length,
      sha256: sha256(bytes),
    };
  });
  const initialLearningState = new UfsFeedbackLearner().exportState();
  const templateBody = {
    templateId: TEMPLATE_ID,
    knowledgeAssets: assets,
    attentionPolicy: {
      schema: "ufs_full_attention_161_plus_v1",
      defaultCapacity: 41,
      backgroundAttentionRequired: true,
    },
    initialPersonalState: {
      feedbackLearningState: initialLearningState,
      predictionLedger: [],
      nextEvidenceId: 1,
      nextTicketId: 1,
    },
  };
  return {
    schema: TEMPLATE_SCHEMA,
    ...templateBody,
    templateFingerprint: sha256(stable(templateBody)),
  };
}

function templateRef(template = buildInitialPlayerTemplate()) {
  if (template?.schema !== TEMPLATE_SCHEMA) throw new TypeError("invalid initial player template");
  return {
    templateId: template.templateId,
    templateFingerprint: template.templateFingerprint,
  };
}

function createFreshPlayer({
  playerId,
  attentionSeed = 20260825,
  now = () => new Date().toISOString(),
  template = buildInitialPlayerTemplate(),
} = {}) {
  assertPlayerId(playerId);
  assertSeed(attentionSeed);
  const at = now();
  return {
    schema: PROFILE_SCHEMA,
    playerId,
    template: templateRef(template),
    lineage: {
      mode: "fresh",
      rootPlayerId: playerId,
      parentPlayerId: null,
      parentRevision: null,
      generation: 0,
    },
    attention: { baseSeed: attentionSeed },
    cognition: clone(template.initialPersonalState),
    progress: {
      revision: 0,
      episodesCaptured: 0,
      operationsExperienced: 0,
    },
    episodeHistory: [],
    createdAt: at,
    updatedAt: at,
  };
}

function validatePlayerProfile(profile, { template = buildInitialPlayerTemplate() } = {}) {
  if (profile?.schema !== PROFILE_SCHEMA) throw new TypeError("invalid UFS player profile");
  assertPlayerId(profile.playerId);
  if (profile.template?.templateId !== template.templateId
    || profile.template?.templateFingerprint !== template.templateFingerprint) {
    throw new Error("player template fingerprint does not match the current frozen cognitive assets");
  }
  assertSeed(profile.attention?.baseSeed);
  if (!Number.isInteger(profile.progress?.revision) || profile.progress.revision < 0) {
    throw new TypeError("player profile revision must be a non-negative integer");
  }
  if (profile.cognition?.feedbackLearningState?.schema !== "ufs_feedback_learning_state_v0") {
    throw new TypeError("player profile is missing a valid feedback learning state");
  }
  if (!Array.isArray(profile.cognition?.predictionLedger)) {
    throw new TypeError("player profile predictionLedger must be an array");
  }
  return clone(profile);
}

function forkPlayer({
  parentProfile,
  playerId,
  attentionSeed = null,
  now = () => new Date().toISOString(),
  template = buildInitialPlayerTemplate(),
} = {}) {
  const parent = validatePlayerProfile(parentProfile, { template });
  assertPlayerId(playerId);
  if (playerId === parent.playerId) throw new Error("forked playerId must differ from its parent");
  const seed = attentionSeed == null ? parent.attention.baseSeed : attentionSeed;
  assertSeed(seed);
  const at = now();
  return {
    schema: PROFILE_SCHEMA,
    playerId,
    template: clone(parent.template),
    lineage: {
      mode: "fork",
      rootPlayerId: parent.lineage.rootPlayerId,
      parentPlayerId: parent.playerId,
      parentRevision: parent.progress.revision,
      generation: parent.lineage.generation + 1,
    },
    attention: { baseSeed: seed },
    cognition: clone(parent.cognition),
    progress: {
      revision: 0,
      episodesCaptured: 0,
      operationsExperienced: 0,
    },
    inheritedSnapshot: {
      parentPlayerId: parent.playerId,
      parentRevision: parent.progress.revision,
      learnedTrajectoryCount: parent.cognition.feedbackLearningState.trajectories.length,
      reinforcedConnectionCount: parent.cognition.feedbackLearningState.connectionUpdates.length,
      predictionLedgerCount: parent.cognition.predictionLedger.length,
      at,
    },
    episodeHistory: [],
    createdAt: at,
    updatedAt: at,
  };
}

function playerIdentity(profile, episodeId) {
  return {
    schema: "ufs_player_identity_v1",
    playerId: profile.playerId,
    rootPlayerId: profile.lineage.rootPlayerId,
    parentPlayerId: profile.lineage.parentPlayerId,
    generation: profile.lineage.generation,
    templateId: profile.template.templateId,
    templateFingerprint: profile.template.templateFingerprint,
    baseProfileRevision: profile.progress.revision,
    episodeId,
  };
}

function createSessionForPlayer({
  playerProfile,
  publicMap,
  initialPublicState,
  sessionOptions = {},
  now = () => new Date().toISOString(),
  template = buildInitialPlayerTemplate(),
} = {}) {
  const profile = validatePlayerProfile(playerProfile, { template });
  if (!publicMap) throw new TypeError("createSessionForPlayer requires publicMap");
  if (!initialPublicState) throw new TypeError("createSessionForPlayer requires initialPublicState");
  const episodeOrdinal = profile.progress.episodesCaptured + 1;
  const episodeId = `${profile.playerId}-episode-${String(episodeOrdinal).padStart(4, "0")}`;
  const learner = new UfsFeedbackLearner({ state: profile.cognition.feedbackLearningState });
  const bridge = new UfsFullGameFeedbackBridge({
    learner,
    predictionLedger: profile.cognition.predictionLedger,
    nextEvidenceId: profile.cognition.nextEvidenceId,
    nextTicketId: profile.cognition.nextTicketId,
  });
  const session = new UfsFullGameAttentionSession({
    ...sessionOptions,
    publicMap,
    feedbackLearner: learner,
    feedbackBridge: bridge,
    playerIdentity: playerIdentity(profile, episodeId),
  });
  const response = session.start({
    initialPublicState,
    attentionSeed: profile.attention.baseSeed,
  });
  return {
    session,
    response,
    episode: {
      episodeId,
      playerId: profile.playerId,
      baseProfileRevision: profile.progress.revision,
      startedAt: now(),
    },
  };
}

function restoreSessionForPlayer({
  playerProfile,
  checkpoint,
  template = buildInitialPlayerTemplate(),
} = {}) {
  const profile = validatePlayerProfile(playerProfile, { template });
  const identity = checkpoint?.playerIdentity;
  if (identity?.schema !== "ufs_player_identity_v1") {
    throw new Error("profiled continuation requires a checkpoint with player identity");
  }
  if (identity.playerId !== profile.playerId
    || identity.templateFingerprint !== profile.template.templateFingerprint
    || identity.baseProfileRevision !== profile.progress.revision) {
    throw new Error("checkpoint belongs to a different player or profile revision");
  }
  return UfsFullGameAttentionSession.restore(checkpoint);
}

function capturePlayerProfile({
  playerProfile,
  session,
  now = () => new Date().toISOString(),
  template = buildInitialPlayerTemplate(),
} = {}) {
  const profile = validatePlayerProfile(playerProfile, { template });
  const identity = session?.inspectPlayerIdentity?.();
  if (!identity || identity.playerId !== profile.playerId
    || identity.templateFingerprint !== profile.template.templateFingerprint
    || identity.baseProfileRevision !== profile.progress.revision) {
    throw new Error("session does not belong to this player profile revision");
  }
  const bridge = session.feedbackBridge.exportCheckpoint();
  if (bridge.pendingPredictionTickets.length > 0) {
    throw new Error("cannot capture player learning while prediction tickets are still pending");
  }
  const learning = session.feedbackLearner.exportState();
  const formal = session.inspectHostState().observation;
  const at = now();
  const next = clone(profile);
  next.cognition = {
    feedbackLearningState: learning,
    predictionLedger: bridge.predictionLedger,
    nextEvidenceId: bridge.nextEvidenceId,
    nextTicketId: bridge.nextTicketId,
  };
  next.progress.revision += 1;
  next.progress.episodesCaptured += 1;
  next.progress.operationsExperienced += session.actionHistory.length;
  next.episodeHistory.push({
    episodeId: identity.episodeId,
    baseProfileRevision: identity.baseProfileRevision,
    attentionSeed: session.gameAttentionSeed,
    operations: session.actionHistory.length,
    completedRoundCount: session.completedRounds.length,
    outcome: clone(formal.outcome),
    learnedTrajectoryCount: learning.trajectories.length,
    reinforcedConnectionCount: learning.connectionUpdates.length,
    predictionLedgerCount: bridge.predictionLedger.length,
    capturedAt: at,
  });
  next.updatedAt = at;
  return next;
}

function summarizePlayerProfile(playerProfile, options = {}) {
  const profile = validatePlayerProfile(playerProfile, options);
  return {
    playerId: profile.playerId,
    template: clone(profile.template),
    lineage: clone(profile.lineage),
    attentionSeed: profile.attention.baseSeed,
    revision: profile.progress.revision,
    episodesCaptured: profile.progress.episodesCaptured,
    operationsExperienced: profile.progress.operationsExperienced,
    learnedTrajectories: profile.cognition.feedbackLearningState.trajectories.length,
    reinforcedConnections: profile.cognition.feedbackLearningState.connectionUpdates.length,
    attentionAdjustments: profile.cognition.feedbackLearningState.attentionAdjustments.length,
    predictionLedgerEntries: profile.cognition.predictionLedger.length,
  };
}

module.exports = {
  PROFILE_SCHEMA,
  TEMPLATE_SCHEMA,
  buildInitialPlayerTemplate,
  capturePlayerProfile,
  createFreshPlayer,
  createSessionForPlayer,
  forkPlayer,
  restoreSessionForPlayer,
  summarizePlayerProfile,
  validatePlayerProfile,
};
