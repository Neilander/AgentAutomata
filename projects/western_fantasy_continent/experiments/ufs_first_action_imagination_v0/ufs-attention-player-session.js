"use strict";

const { UfsFullAttentionProvider } = require("./ufs-full-attention-provider");
const { UfsOneRoundSession } = require("./ufs-one-round-session");

function clone(value) {
  return structuredClone(value);
}

class UfsAttentionPlayerSession {
  constructor({
    publicMap,
    coreSession = null,
    attentionProvider = new UfsFullAttentionProvider(),
  } = {}) {
    if (!publicMap) throw new TypeError("UfsAttentionPlayerSession requires a publicMap");
    this.publicMap = clone(publicMap);
    this.coreSession = coreSession || new UfsOneRoundSession({ publicMap });
    this.attentionProvider = attentionProvider;
    this.attentionSeed = null;
    this.started = false;
    this.lastPlayerResponse = null;
  }

  start({ initialPublicState, attentionSeed = 20260824 }) {
    if (this.started) throw new Error("player session has already started");
    this.started = true;
    this.attentionSeed = attentionSeed;
    this.attentionProvider.beginEpisode();
    return this._project(this.coreSession.start({ initialPublicState, attentionSeed }));
  }

  advance(action) {
    if (!this.started) throw new Error("player session must be started before advance");
    const raw = this.coreSession.advance(action);
    if (raw.status === "rejected") {
      return {
        ...clone(this.lastPlayerResponse),
        status: "rejected",
        reason: raw.reason,
        lastAction: clone(action),
      };
    }
    return this._project(raw);
  }

  _project(raw) {
    const decision = this.attentionProvider.noticeChoice({
      fullWorld: raw.observation,
      publicMap: this.publicMap,
      pending: raw.pending,
      lastAction: raw.lastAction,
      randomSeed: (this.attentionSeed + raw.actionCount * 7919) >>> 0,
    });
    const response = {
      schema: "ufs_attention_limited_player_response_v0",
      status: raw.status,
      reason: raw.reason,
      observation: decision.observation,
      mapView: decision.mapView,
      noticedItems: decision.noticedItems,
      attention: decision.attention,
      pending: clone(raw.pending),
      availableOperations: clone(raw.availableOperations),
      lastAction: clone(raw.lastAction),
      actionCount: raw.actionCount,
    };
    this.lastPlayerResponse = response;
    return clone(response);
  }

  exportCheckpoint() {
    if (!this.started) throw new Error("cannot checkpoint an unstarted player session");
    return {
      schema: "ufs_attention_limited_player_checkpoint_v0",
      core: this.coreSession.exportCheckpoint(),
      attentionSeed: this.attentionSeed,
      attentionTrace: this.attentionProvider.traceSnapshot(),
      lastPlayerResponse: clone(this.lastPlayerResponse),
    };
  }

  static restore(checkpoint, {
    attentionProvider = new UfsFullAttentionProvider(),
    runtime = null,
  } = {}) {
    if (checkpoint?.schema !== "ufs_attention_limited_player_checkpoint_v0") {
      throw new TypeError("invalid attention-limited player checkpoint");
    }
    const coreSession = runtime
      ? UfsOneRoundSession.restore(checkpoint.core, { runtime })
      : UfsOneRoundSession.restore(checkpoint.core);
    attentionProvider.restoreTrace(checkpoint.attentionTrace);
    const session = new UfsAttentionPlayerSession({
      publicMap: checkpoint.core.publicMap,
      coreSession,
      attentionProvider,
    });
    session.started = true;
    session.attentionSeed = checkpoint.attentionSeed;
    session.lastPlayerResponse = clone(checkpoint.lastPlayerResponse);
    return session;
  }

  inspectHostState() {
    return {
      response: clone(this.coreSession.lastResponse),
      checkpoint: this.exportCheckpoint(),
    };
  }
}

module.exports = { UfsAttentionPlayerSession };
