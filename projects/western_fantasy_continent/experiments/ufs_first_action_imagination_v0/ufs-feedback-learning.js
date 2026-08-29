"use strict";

const {
  SLOT_KEYS,
  assertFiveSlotQ,
} = require("../imagination_pipeline_v0/five-slot-activation");

const SCHEMA = "ufs_feedback_learning_state_v0";
const HIGH_ACTIVATION = 0.75;
const SOURCE_PRIORS = Object.freeze({
  tutorial: 0.72,
  rule_query: 0.86,
  single_experience: 0.42,
  repeated_experience: 0.62,
  player_guess: 0.18,
});

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

function canonicalQ(q) {
  assertFiveSlotQ(q);
  return JSON.stringify(SLOT_KEYS.map((key) => q[key].trim()));
}

function sameQ(left, right) {
  return canonicalQ(left) === canonicalQ(right);
}

function mismatchSlots(predicted, actual) {
  assertFiveSlotQ(predicted, "predictedFollowingQ");
  assertFiveSlotQ(actual, "actualFollowingQ");
  return SLOT_KEYS.filter((key) => predicted[key].trim() !== actual[key].trim());
}

function contextMatches(required, actual) {
  if (required == null) return true;
  if (typeof required !== "object" || Array.isArray(required)) return required === actual;
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) return false;
  return Object.entries(required).every(([key, value]) => contextMatches(value, actual[key]));
}

function sourcePrior(kind) {
  if (!Object.prototype.hasOwnProperty.call(SOURCE_PRIORS, kind)) {
    throw new Error(`unknown feedback source kind: ${kind}`);
  }
  return SOURCE_PRIORS[kind];
}

function confidenceFor(record) {
  const strongestPrior = Math.max(...record.provenance.map((row) => sourcePrior(row.kind)));
  const experienceGain = 1 - Math.exp(-Math.max(0, record.observations - 1) / 4);
  return Number(Math.min(0.99, strongestPrior + (1 - strongestPrior) * experienceGain).toFixed(6));
}

function assertSource(source) {
  if (!source || typeof source.kind !== "string") throw new TypeError("source.kind is required");
  sourcePrior(source.kind);
  if (typeof source.ref !== "string" || source.ref.trim() === "") {
    throw new TypeError("source.ref is required");
  }
}

function evidenceDecision(evidence) {
  if (!evidence || typeof evidence !== "object") return "missing_evidence_contract";
  if (typeof evidence.evidenceId !== "string" || evidence.evidenceId.trim() === "") {
    return "missing_evidence_id";
  }
  if (evidence.playerVisible !== true) return "not_player_visible";
  if (!["committed", "knowledge_query"].includes(evidence.transition)) {
    return `transition_${evidence.transition || "unknown"}`;
  }
  if (evidence.systemIntegrity !== "passed") {
    return `system_integrity_${evidence.systemIntegrity || "unknown"}`;
  }
  return null;
}

function emptyState() {
  return {
    schema: SCHEMA,
    nextId: 1,
    trajectories: [],
    connectionUpdates: [],
    randomModels: [],
    chains: [],
    attentionAdjustments: [],
    unresolved: [],
    quarantinedFeedback: [],
  };
}

function normalizeState(state) {
  const next = state == null ? emptyState() : clone(state);
  if (next.schema !== SCHEMA) throw new Error(`unsupported feedback state: ${next.schema}`);
  for (const key of [
    "trajectories", "connectionUpdates", "randomModels", "chains", "attentionAdjustments", "unresolved",
    "quarantinedFeedback",
  ]) {
    if (next[key] == null) next[key] = [];
    if (!Array.isArray(next[key])) throw new TypeError(`feedback state ${key} must be an array`);
  }
  if (!Number.isInteger(next.nextId) || next.nextId < 1) throw new TypeError("invalid nextId");
  return next;
}

class UfsFeedbackLearner {
  constructor({ state = null, now = () => new Date().toISOString() } = {}) {
    this.state = normalizeState(state);
    this.now = now;
  }

  _id(prefix) {
    const id = `${prefix}-${String(this.state.nextId).padStart(5, "0")}`;
    this.state.nextId += 1;
    return id;
  }

  _accept(evidence, feedbackKind) {
    const reason = evidenceDecision(evidence);
    if (!reason) return { accepted: true };
    const row = {
      quarantineId: this._id("quarantine"),
      feedbackKind,
      evidenceId: evidence?.evidenceId || null,
      reason,
      at: this.now(),
    };
    this.state.quarantinedFeedback.push(row);
    return { accepted: false, learned: false, reason, quarantine: clone(row) };
  }

  _remember({ currentQ, followingQ, source, applicability = {}, correction = null, unresolved = false }) {
    assertFiveSlotQ(currentQ, "currentQ");
    assertFiveSlotQ(followingQ, "followingQ");
    assertSource(source);
    const applicabilityKey = stable(applicability || {});
    let row = this.state.trajectories.find((candidate) => (
      sameQ(candidate.currentQ, currentQ)
      && sameQ(candidate.followingQ, followingQ)
      && stable(candidate.applicability) === applicabilityKey
      && candidate.unresolved === unresolved
    ));
    const at = this.now();
    if (row) {
      row.observations += 1;
      row.support = Number((row.support + 1).toFixed(6));
      row.lastSeenAt = at;
      row.provenance.push({ kind: source.kind, ref: source.ref, at });
    } else {
      row = {
        trajectoryId: this._id("feedback-trajectory"),
        currentQ: clone(currentQ),
        followingQ: clone(followingQ),
        applicability: clone(applicability || {}),
        support: 1,
        observations: 1,
        firstSeenAt: at,
        lastSeenAt: at,
        provenance: [{ kind: source.kind, ref: source.ref, at }],
        confidence: 0,
        unresolved,
        correctsTrajectoryIds: [],
        mismatchSlots: [],
        compileStatus: "pending_matrix_compile",
      };
      this.state.trajectories.push(row);
    }
    if (correction) {
      row.correctsTrajectoryIds = [...new Set([
        ...row.correctsTrajectoryIds,
        correction.trajectoryId,
      ])];
      row.mismatchSlots = [...new Set([...row.mismatchSlots, ...correction.mismatchSlots])];
    }
    row.confidence = confidenceFor(row);
    return row;
  }

  _reinforceExisting(candidate, source) {
    assertSource(source);
    let row = this.state.connectionUpdates.find((entry) => entry.trajectoryId === candidate.trajectoryId);
    const at = this.now();
    if (!row) {
      row = {
        trajectoryId: candidate.trajectoryId,
        addedSupport: 0,
        addedObservations: 0,
        lastSeenAt: at,
        provenance: [],
        confidence: 0,
      };
      this.state.connectionUpdates.push(row);
    }
    row.addedSupport = Number((row.addedSupport + 1).toFixed(6));
    row.addedObservations += 1;
    row.lastSeenAt = at;
    row.provenance.push({ kind: source.kind, ref: source.ref, at });
    row.confidence = confidenceFor({
      observations: row.addedObservations,
      provenance: row.provenance,
    });
    return row;
  }

  _updateRandomModel({ currentQ, applicability, followingQ, numericValue, at }) {
    const modelKey = `${canonicalQ(currentQ)}|${stable(applicability || {})}`;
    let model = this.state.randomModels.find((candidate) => candidate.modelKey === modelKey);
    if (!model) {
      model = {
        randomModelId: this._id("random-model"),
        modelKey,
        currentQ: clone(currentQ),
        applicability: clone(applicability || {}),
        observations: 0,
        outcomeCounts: [],
        recentValues: [],
        center: null,
        commonRange: null,
        historicalRange: null,
        recentShift: null,
        lastSeenAt: at,
      };
      this.state.randomModels.push(model);
    }
    const outcomeKey = canonicalQ(followingQ);
    let outcome = model.outcomeCounts.find((candidate) => candidate.outcomeKey === outcomeKey);
    if (!outcome) {
      outcome = { outcomeKey, followingQ: clone(followingQ), count: 0, recentWeight: 0 };
      model.outcomeCounts.push(outcome);
    }
    for (const candidate of model.outcomeCounts) {
      candidate.recentWeight = Number((candidate.recentWeight * 0.8).toFixed(6));
    }
    outcome.count += 1;
    outcome.recentWeight = Number((outcome.recentWeight + 1).toFixed(6));
    model.observations += 1;
    model.lastSeenAt = at;
    if (Number.isFinite(numericValue)) {
      model.recentValues.push(Number(numericValue));
      if (model.recentValues.length > 20) model.recentValues.shift();
      const values = model.recentValues;
      const historical = model.historicalRange || [numericValue, numericValue];
      model.historicalRange = [Math.min(historical[0], numericValue), Math.max(historical[1], numericValue)];
      model.center = Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(6));
      const sorted = [...values].sort((left, right) => left - right);
      const low = sorted[Math.floor((sorted.length - 1) * 0.1)];
      const high = sorted[Math.ceil((sorted.length - 1) * 0.9)];
      model.commonRange = [low, high];
      if (values.length >= 6) {
        const split = Math.floor(values.length / 2);
        const earlier = values.slice(0, split);
        const recent = values.slice(split);
        const earlierMean = earlier.reduce((sum, value) => sum + value, 0) / earlier.length;
        const recentMean = recent.reduce((sum, value) => sum + value, 0) / recent.length;
        model.recentShift = Number((recentMean - earlierMean).toFixed(6));
      }
    }
    return model;
  }

  _updateChain(previousTrajectoryId, nextTrajectoryId, at) {
    if (!previousTrajectoryId) return null;
    let chain = this.state.chains.find((candidate) => (
      candidate.fromTrajectoryId === previousTrajectoryId
      && candidate.toTrajectoryId === nextTrajectoryId
    ));
    if (!chain) {
      chain = {
        chainId: this._id("chain"),
        fromTrajectoryId: previousTrajectoryId,
        toTrajectoryId: nextTrajectoryId,
        consecutiveCount: 0,
        chainingStrength: 0,
        automaticity: 0,
        attentionCost: 1,
        ruleQueryCost: 1,
        lastSeenAt: at,
      };
      this.state.chains.push(chain);
    }
    chain.consecutiveCount += 1;
    chain.chainingStrength = Number((chain.consecutiveCount / (chain.consecutiveCount + 2)).toFixed(6));
    chain.automaticity = Number((chain.consecutiveCount / (chain.consecutiveCount + 4)).toFixed(6));
    chain.attentionCost = Number((1 / (chain.consecutiveCount + 1)).toFixed(6));
    chain.ruleQueryCost = Number((1 / (chain.consecutiveCount + 1)).toFixed(6));
    chain.lastSeenAt = at;
    return chain;
  }

  _upsertAttention({ operation, selector, scope, amount, reason }) {
    if (!["increase", "decrease", "expand"].includes(operation)) {
      throw new Error(`unsupported attention operation: ${operation}`);
    }
    if (!selector || typeof selector !== "object" || Array.isArray(selector)) {
      throw new TypeError("attention selector must be an object");
    }
    if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
      throw new TypeError("attention scope must be an object");
    }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1) {
      throw new RangeError("attention amount must be in (0, 1]");
    }
    const key = `${operation}|${stable(selector)}|${stable(scope)}`;
    let row = this.state.attentionAdjustments.find((candidate) => candidate.key === key);
    if (!row) {
      row = {
        adjustmentId: this._id("attention"), key, operation,
        selector: clone(selector), scope: clone(scope), amount: 0,
        observations: 0, reasons: [],
      };
      this.state.attentionAdjustments.push(row);
    }
    row.observations += 1;
    row.amount = Number(Math.min(0.6, row.amount + amount).toFixed(6));
    row.reasons.push(reason);
    return row;
  }

  learnObservedTransition({
    evidence,
    currentQ,
    actualFollowingQ,
    source,
    applicability = {},
    predictionCandidates = [],
    previousTrajectoryId = null,
    randomOutcome = null,
    missedAttention = [],
    repeatedlyIrrelevantAttention = [],
  }) {
    const gate = this._accept(evidence, "observed_transition");
    if (!gate.accepted) return gate;
    assertFiveSlotQ(currentQ, "currentQ");
    assertFiveSlotQ(actualFollowingQ, "actualFollowingQ");
    assertSource(source);
    const corrections = predictionCandidates
      .filter((candidate) => Number(candidate.activation) >= HIGH_ACTIVATION)
      .filter((candidate) => !sameQ(candidate.predictedFollowingQ, actualFollowingQ))
      .map((candidate) => ({
        trajectoryId: candidate.trajectoryId,
        mismatchSlots: mismatchSlots(candidate.predictedFollowingQ, actualFollowingQ),
      }));
    const confirmations = predictionCandidates
      .filter((candidate) => Number(candidate.activation) >= HIGH_ACTIVATION)
      .filter((candidate) => sameQ(candidate.predictedFollowingQ, actualFollowingQ));
    const correctionApplicability = corrections.length > 0
      ? clone(applicability || {})
      : clone(applicability || {});
    if (corrections.length > 0 && Object.keys(correctionApplicability).length === 0) {
      throw new Error("a distinguishing context is required for a high-activation correction");
    }
    const existingTrajectoryUpdates = confirmations.map((candidate) => (
      this._reinforceExisting(candidate, source)
    ));
    let trajectory = null;
    if (confirmations.length === 0 || corrections.length > 0) {
      trajectory = this._remember({
        currentQ,
        followingQ: actualFollowingQ,
        source,
        applicability: correctionApplicability,
        correction: corrections[0] || null,
      });
      for (const correction of corrections.slice(1)) {
        trajectory.correctsTrajectoryIds = [...new Set([
          ...trajectory.correctsTrajectoryIds,
          correction.trajectoryId,
        ])];
        trajectory.mismatchSlots = [...new Set([
          ...trajectory.mismatchSlots,
          ...correction.mismatchSlots,
        ])];
      }
    }
    const at = this.now();
    const randomModel = randomOutcome
      ? this._updateRandomModel({
        currentQ,
        applicability,
        followingQ: actualFollowingQ,
        numericValue: randomOutcome.numericValue,
        at,
      })
      : null;
    const learnedTrajectoryId = trajectory?.trajectoryId || confirmations[0]?.trajectoryId || null;
    const chain = learnedTrajectoryId
      ? this._updateChain(previousTrajectoryId, learnedTrajectoryId, at)
      : null;
    const attentionAdjustments = [];
    for (const missed of missedAttention) {
      attentionAdjustments.push(this._upsertAttention({
        operation: missed.relation ? "expand" : "increase",
        selector: missed.selector,
        scope: missed.scope,
        amount: Number(missed.amount ?? 0.08),
        reason: missed.reason || "实际反馈表明该情境中漏看了因果相关状态",
      }));
    }
    for (const irrelevant of repeatedlyIrrelevantAttention) {
      attentionAdjustments.push(this._upsertAttention({
        operation: "decrease",
        selector: irrelevant.selector,
        scope: irrelevant.scope,
        amount: Number(irrelevant.amount ?? 0.04),
        reason: irrelevant.reason || "该情境中反复注意到但与实际后果无关",
      }));
    }
    return {
      accepted: true,
      learned: true,
      trajectory: trajectory ? clone(trajectory) : null,
      existingTrajectoryUpdates: clone(existingTrajectoryUpdates),
      corrections: clone(corrections),
      randomModel: randomModel ? clone(randomModel) : null,
      chain: chain ? clone(chain) : null,
      attentionAdjustments: clone(attentionAdjustments),
    };
  }

  learnUnresolved({ evidence, currentQ, queryQ, source, applicability = {}, unresolvedNeed }) {
    const gate = this._accept(evidence, "unresolved_query");
    if (!gate.accepted) return gate;
    const trajectory = this._remember({
      currentQ, followingQ: queryQ, source, applicability, unresolved: true,
    });
    let unresolved = this.state.unresolved.find((row) => row.trajectoryId === trajectory.trajectoryId);
    if (!unresolved) {
      unresolved = {
        unresolvedId: this._id("unresolved"),
        trajectoryId: trajectory.trajectoryId,
        unresolvedNeed,
        status: "open",
        resolutions: [],
      };
      this.state.unresolved.push(unresolved);
    }
    return { accepted: true, learned: true, trajectory: clone(trajectory), unresolved: clone(unresolved) };
  }

  resolveUnresolved({
    evidence, unresolvedId, currentQ, resolvedFollowingQ, source, applicability = {},
  }) {
    const gate = this._accept(evidence, "unresolved_resolution");
    if (!gate.accepted) return gate;
    const unresolved = this.state.unresolved.find((row) => row.unresolvedId === unresolvedId);
    if (!unresolved) throw new Error(`unknown unresolved record: ${unresolvedId}`);
    const trajectory = this._remember({
      currentQ, followingQ: resolvedFollowingQ, source, applicability,
    });
    unresolved.status = "resolved_but_query_exit_retained";
    unresolved.resolutions.push(trajectory.trajectoryId);
    unresolved.lastResolvedAt = this.now();
    return { accepted: true, learned: true, trajectory: clone(trajectory), unresolved: clone(unresolved) };
  }

  recall(currentQ, { context = {}, previousTrajectoryId = null, topK = 8 } = {}) {
    assertFiveSlotQ(currentQ, "currentQ");
    const chainByTarget = new Map(this.state.chains
      .filter((row) => row.fromTrajectoryId === previousTrajectoryId)
      .map((row) => [row.toTrajectoryId, row]));
    const candidates = this.state.trajectories
      .filter((row) => sameQ(row.currentQ, currentQ))
      .filter((row) => contextMatches(row.applicability, context))
      .map((row) => {
        const specificity = stable(row.applicability) === "{}"
          ? 0
          : stable(row.applicability).length;
        const chain = chainByTarget.get(row.trajectoryId);
        return {
          ...clone(row),
          recallScore: Number((
            1
            + Math.min(0.4, specificity / 1000)
            + row.confidence * 0.1
            + Math.log1p(row.support) * 0.02
            + (chain?.chainingStrength || 0) * 0.1
          ).toFixed(6)),
          chain: chain ? clone(chain) : null,
        };
      })
      .sort((left, right) => right.recallScore - left.recallScore
        || right.confidence - left.confidence
        || left.trajectoryId.localeCompare(right.trajectoryId))
      .slice(0, topK);
    const randomModel = this.state.randomModels.find((row) => (
      sameQ(row.currentQ, currentQ) && contextMatches(row.applicability, context)
    ));
    return { candidates, randomModel: randomModel ? clone(randomModel) : null };
  }

  exportState() {
    return clone(this.state);
  }

  exportAttentionAdjustments() {
    return clone(this.state.attentionAdjustments);
  }

  pendingMatrixRecords() {
    return clone(this.state.trajectories.filter((row) => row.compileStatus === "pending_matrix_compile"));
  }

  markMatrixCompiled({ trajectoryIds, manifestRef }) {
    if (!Array.isArray(trajectoryIds) || trajectoryIds.length === 0) {
      throw new TypeError("trajectoryIds must be a non-empty array");
    }
    if (typeof manifestRef !== "string" || manifestRef.trim() === "") {
      throw new TypeError("manifestRef is required");
    }
    const requested = new Set(trajectoryIds);
    const found = this.state.trajectories.filter((row) => requested.has(row.trajectoryId));
    if (found.length !== requested.size) throw new Error("cannot mark an unknown trajectory as compiled");
    const at = this.now();
    for (const row of found) {
      row.compileStatus = "compiled_matrix";
      row.matrixManifestRef = manifestRef;
      row.compiledAt = at;
    }
    return clone(found);
  }
}

module.exports = {
  HIGH_ACTIVATION,
  SCHEMA,
  SOURCE_PRIORS,
  UfsFeedbackLearner,
  canonicalQ,
  contextMatches,
  evidenceDecision,
  mismatchSlots,
};
