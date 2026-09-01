"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const initialPublicState = require("./public_initial_state.json");
const publicMap = require("./public-map");
const { compactAttentionResponse } = require("./compact-attention-response");
const { buildRandomObservation } = require("./replayable-random-observation");
const { UfsFullGameAttentionSession } = require("./ufs-full-game-attention-session");
const {
  capturePlayerProfile,
  createSessionForPlayer,
  restoreSessionForPlayer,
  summarizePlayerProfile,
  validatePlayerProfile,
} = require("./ufs-player-generator");

const HELP = `Usage:
  node full-game-attention-player-cli.js start <state-dir>
  node full-game-attention-player-cli.js player-start <state-dir> <player-profile.json>
  node full-game-attention-player-cli.js plan <state-dir>
  node full-game-attention-player-cli.js imagine-sequence <state-dir> <sequence.json>
  node full-game-attention-player-cli.js advance <state-dir> <choice.json>
  node full-game-attention-player-cli.js random <state-dir> [random-observation.json]
  node full-game-attention-player-cli.js player-capture <state-dir> <player-profile.json>
  node full-game-attention-player-cli.js help

The session continues across round boundaries and stops only at a public win/loss outcome.
Set UFS_ATTENTION_SEED to an unsigned 32-bit game attention seed.

Choice payloads:
  {"type":"place_die","dieId":"...","cellId":"...","predictions":[{"because":"...","expectations":[{"itemId":"die:...","field":"placed","change":"equals","value":true}]}]}
  {"type":"resolve_room","roomId":"...","pay":true}
  {"type":"choose_research_advance","roomId":"...","advanceSteps":1}
  {"type":"excavate","placementId":"..."}
  {"type":"skip_worker","placementId":"..."}
  {"type":"end_rooms"}
  {"type":"choose_spawn","shipId":"...","dropPointId":"DP-C3"}

Optional prediction tickets:
  - Put 0-3 predictions on any deliberate choice payload. Random observations need none.
  - Each prediction needs a reason and one or more expectations.
  - change: increase | decrease | changed | unchanged | equals | present | absent
  - A result is learned only when its ticket existed before the action and every target was noticed.

Use the random command at both white-reroll and next-round-roll boundaries. With no file it draws
fresh values. A supplied observation file is strictly validated against the public pending die IDs,
which allows paired experiments to replay a precommitted external random sequence.
Only use IDs and operations exposed by the current public attention-limited response.
Stdout and current-player-view.json contain the compact player view. Full noticed-item and
attention-trace evidence is private host audit data in attention-audit-transcript.jsonl.

Use player-start for isolated learning experiments. advance/random automatically continue the exact
same identified player checkpoint. player-capture compiles newly learned feedback with the local
real GTE model, then writes its private matrices, trajectories, connection updates, attention
adjustments and prediction ledger back to that player's profile once per episode.
Capturing seals that state directory. Start a new player-start directory with the updated profile to
run the same learned player in its next episode.
`;

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function configuredAttentionSeed() {
  const raw = process.env.UFS_ATTENTION_SEED ?? "20260825";
  if (!/^\d+$/.test(raw)) throw new Error("UFS_ATTENTION_SEED must be an unsigned 32-bit integer");
  const seed = Number(raw);
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) {
    throw new Error("UFS_ATTENTION_SEED must be an unsigned 32-bit integer");
  }
  return seed;
}

function filesFor(stateDir) {
  return {
    checkpoint: path.join(stateDir, "full-game-host-checkpoint.json"),
    view: path.join(stateDir, "current-player-view.json"),
    transcript: path.join(stateDir, "machine-transcript.jsonl"),
    attentionAudit: path.join(stateDir, "attention-audit-transcript.jsonl"),
    feedbackAudit: path.join(stateDir, "feedback-audit-transcript.jsonl"),
    playerProfileBase: path.join(stateDir, "player-profile-base.json"),
    playerCaptureReceipt: path.join(stateDir, "player-capture-receipt.json"),
  };
}

function persist(paths, kind, operation, session, response) {
  const publicResponse = compactAttentionResponse(response);
  const recordedAt = new Date().toISOString();
  writeJson(paths.checkpoint, session.exportCheckpoint());
  writeJson(paths.view, publicResponse);
  fs.appendFileSync(paths.transcript, `${JSON.stringify({
    step: publicResponse.actionCount,
    round: publicResponse.game.round,
    kind,
    operation: operation ? structuredClone(operation) : null,
    response: publicResponse,
    recordedAt,
  })}\n`, "utf8");
  fs.appendFileSync(paths.attentionAudit, `${JSON.stringify({
    step: response.actionCount,
    round: response.game.round,
    kind,
    operation: operation ? structuredClone(operation) : null,
    response,
    recordedAt,
  })}\n`, "utf8");
  const feedback = session.inspectFeedbackState();
  fs.appendFileSync(paths.feedbackAudit, `${JSON.stringify({
    step: response.actionCount,
    round: response.game.round,
    kind,
    operation: operation ? structuredClone(operation) : null,
    audit: feedback.lastAudit,
    learningSummary: {
      learnedTrajectories: feedback.learning.trajectories.length,
      reinforcedConnections: feedback.learning.connectionUpdates.length,
      attentionAdjustments: feedback.learning.attentionAdjustments.length,
      quarantinedFeedback: feedback.learning.quarantinedFeedback.length,
    },
    recordedAt,
  })}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(publicResponse, null, 2)}\n`);
}

function load(stateDir) {
  const paths = filesFor(stateDir);
  if (!fs.existsSync(paths.checkpoint)) throw new Error("full-game attention session has not started");
  if (fs.existsSync(paths.playerCaptureReceipt)) {
    throw new Error("player episode has already been captured and sealed; start a new state directory to continue this player");
  }
  const checkpoint = readJson(paths.checkpoint);
  if (fs.existsSync(paths.playerProfileBase)) {
    const playerProfile = validatePlayerProfile(readJson(paths.playerProfileBase));
    return {
      paths,
      playerProfile,
      session: restoreSessionForPlayer({ playerProfile, checkpoint }),
    };
  }
  return { paths, playerProfile: null, session: UfsFullGameAttentionSession.restore(checkpoint) };
}

function start(stateDir) {
  fs.mkdirSync(stateDir, { recursive: true });
  const paths = filesFor(stateDir);
  if (fs.existsSync(paths.transcript) || fs.existsSync(paths.attentionAudit)
    || fs.existsSync(paths.feedbackAudit)) {
    throw new Error("transcript already exists; refusing to overwrite");
  }
  const session = new UfsFullGameAttentionSession({ publicMap });
  const response = session.start({
    initialPublicState,
    attentionSeed: configuredAttentionSeed(),
  });
  persist(paths, "start", null, session, response);
}

function startPlayer(stateDir, playerProfileFile) {
  fs.mkdirSync(stateDir, { recursive: true });
  const paths = filesFor(stateDir);
  if (fs.existsSync(paths.transcript) || fs.existsSync(paths.attentionAudit)
    || fs.existsSync(paths.feedbackAudit) || fs.existsSync(paths.playerProfileBase)
    || fs.existsSync(paths.playerCaptureReceipt)) {
    throw new Error("player state already exists; refusing to overwrite");
  }
  const playerProfile = validatePlayerProfile(readJson(playerProfileFile));
  const { session, response } = createSessionForPlayer({
    playerProfile,
    publicMap,
    initialPublicState,
  });
  writeJson(paths.playerProfileBase, playerProfile);
  persist(paths, "player_start", null, session, response);
}

function capturePlayer(stateDir, playerProfileFile) {
  const { paths, playerProfile, session } = load(stateDir);
  if (!playerProfile) throw new Error("player-capture requires a state created by player-start");
  const output = path.resolve(playerProfileFile);
  if (fs.existsSync(output)) {
    const current = validatePlayerProfile(readJson(output));
    if (current.playerId !== playerProfile.playerId
      || current.progress.revision !== playerProfile.progress.revision) {
      throw new Error("capture target is not the base player profile revision for this episode");
    }
  }
  const captured = capturePlayerProfile({ playerProfile, session });
  writeJson(output, captured);
  writeJson(paths.playerCaptureReceipt, {
    schema: "ufs_player_capture_receipt_v1",
    playerId: captured.playerId,
    fromRevision: playerProfile.progress.revision,
    toRevision: captured.progress.revision,
    profilePath: output,
    capturedAt: captured.updatedAt,
  });
  process.stdout.write(`${JSON.stringify(summarizePlayerProfile(captured), null, 2)}\n`);
}

function advance(stateDir, choiceFile) {
  const { paths, session } = load(stateDir);
  const operation = readJson(choiceFile);
  const response = session.advance(operation);
  persist(paths, "advance", operation, session, response);
}

function plan(stateDir) {
  const { session } = load(stateDir);
  process.stdout.write(`${JSON.stringify(session.planCurrentChoice(), null, 2)}\n`);
}

function imagineSequence(stateDir, sequenceFile) {
  const { session } = load(stateDir);
  const request = readJson(sequenceFile);
  const checkpointBefore = JSON.stringify(session.exportCheckpoint());
  const result = session.imagineSequentialPlan(request);
  if (JSON.stringify(session.exportCheckpoint()) !== checkpointBefore) {
    throw new Error("sequential imagination mutated the live session");
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function observeRandom(stateDir, observationFile = null) {
  const { paths, session } = load(stateDir);
  const current = readJson(paths.view);
  const supplied = observationFile == null ? null : readJson(observationFile);
  const operation = buildRandomObservation(current, supplied, crypto.randomInt);
  const response = session.advance(operation);
  persist(paths, "external_random_observation", operation, session, response);
}

const [command, stateDirArg, choiceFileArg] = process.argv.slice(2);
if (["help", "--help", "-h"].includes(command)) {
  process.stdout.write(HELP);
  process.exit(0);
}
if (!stateDirArg) throw new Error(HELP);
const stateDir = path.resolve(stateDirArg);
if (command === "start") start(stateDir);
else if (command === "player-start" && choiceFileArg) startPlayer(stateDir, path.resolve(choiceFileArg));
else if (command === "plan") plan(stateDir);
else if (command === "imagine-sequence" && choiceFileArg) {
  imagineSequence(stateDir, path.resolve(choiceFileArg));
}
else if (command === "advance" && choiceFileArg) advance(stateDir, path.resolve(choiceFileArg));
else if (command === "random") observeRandom(
  stateDir,
  choiceFileArg ? path.resolve(choiceFileArg) : null,
);
else if (command === "player-capture" && choiceFileArg) capturePlayer(stateDir, path.resolve(choiceFileArg));
else throw new Error(HELP);
