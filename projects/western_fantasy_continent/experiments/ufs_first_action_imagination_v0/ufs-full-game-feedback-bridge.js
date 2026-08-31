"use strict";

const { assertFiveSlotQ } = require("../imagination_pipeline_v0/five-slot-activation");
const {
  compileAutomaticPredictionTickets,
  compileDeclaredPredictionTickets,
  evaluatePredictionTicket,
  ticketsOverlap,
} = require("./ufs-prediction-ticket");

function clone(value) {
  return structuredClone(value);
}

function isFiveSlot(value) {
  try {
    assertFiveSlotQ(value);
    return true;
  } catch {
    return false;
  }
}

function collectPredictionEnvelopes(traceDelta) {
  const found = [];
  const visit = (value, occurrence) => {
    if (!value || typeof value !== "object") return;
    if (isFiveSlot(value.q) && value.grounding
      && isFiveSlot(value.grounding.awakenedFollowingQ)
      && typeof value.grounding.trajectoryId === "string") {
      const selected = (value.candidates || []).find((row) => (
        row.trajectoryId === value.grounding.trajectoryId
      ));
      found.push({
        occurrence,
        trajectoryId: value.grounding.trajectoryId,
        currentQ: clone(value.q),
        predictedFollowingQ: clone(value.grounding.awakenedFollowingQ),
        activation: Number(selected?.activation ?? 1),
        patch: clone(value.grounding.patch || null),
        omittedItemIds: clone(value.trace?.perception?.omittedItemIds || value.perception?.omittedItemIds || []),
      });
    }
    if (isFiveSlot(value.currentQ) && isFiveSlot(value.awakenedFollowingQ)
      && typeof value.trajectoryId === "string") {
      found.push({
        occurrence,
        trajectoryId: value.trajectoryId,
        currentQ: clone(value.currentQ),
        predictedFollowingQ: clone(value.awakenedFollowingQ),
        activation: Number(value.activation ?? 1),
        patch: clone(value.patch || value.patches || null),
        omittedItemIds: clone(value.omittedItemIds || []),
      });
    }
    if (Array.isArray(value)) {
      value.forEach((row) => visit(row, occurrence));
    } else {
      Object.values(value).forEach((row) => visit(row, occurrence));
    }
  };
  for (const row of traceDelta?.placements || []) {
    visit(row, `placement:${row.selectedAction?.dieId}:${row.selectedAction?.cellId}`);
  }
  for (const row of traceDelta?.randomBoundaries || []) {
    visit(row, `random:${row.afterDieId}`);
  }
  for (const row of traceDelta?.roomSteps || []) {
    const action = row.action || {};
    visit(row, `room:${action.type}:${action.roomId || action.placementId || "none"}:${row.stage}:${action.advanceSteps ?? "pending"}`);
  }
  for (const row of traceDelta?.mothershipSteps || []) {
    visit(row, `mothership:${row.stage}:${row.shipId || "none"}:${row.chosenDropPointId || "pending"}`);
  }
  const unique = new Map();
  for (const row of found) {
    const key = `${row.occurrence}|${row.trajectoryId}|${JSON.stringify(row.currentQ)}|${JSON.stringify(row.patch)}`;
    row.occurrenceKey = key;
    if (!unique.has(key)) unique.set(key, row);
  }
  return [...unique.values()];
}

function itemIdsForSection(section, before, after) {
  if (["round", "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow", "outcome"].includes(section)) {
    return [`track:${section}`];
  }
  const prefixes = {
    dice: "die",
    ships: "ship",
    waitingShips: "waiting_ship",
    placements: "placement",
    robots: "robot",
  };
  const prefix = prefixes[section];
  if (!prefix) return [];
  const rows = [...(before[section] || []), ...(after[section] || [])];
  return [...new Set(rows.map((row) => `${prefix}:${row.id}`))];
}

function visibleChangedItemIds(formalStep, playerResponse) {
  const noticed = new Set((playerResponse.noticedItems || []).map((row) => row.itemId));
  return [...new Set(formalStep.changedSections.flatMap((section) => (
    itemIdsForSection(section, formalStep.before, formalStep.after)
  )))].filter((itemId) => noticed.has(itemId));
}

function summarizeArrayChange(label, beforeRows, afterRows) {
  const before = JSON.stringify(beforeRows || []);
  const after = JSON.stringify(afterRows || []);
  return before === after ? null : `${label}发生玩家可见变化`;
}

function actualFollowingQ(formalStep, operation) {
  const changes = [];
  const labels = {
    energy: "能源",
    damage: "城市伤害",
    researchIndex: "研究进度",
    excavatorIndex: "挖掘进度",
    mothershipRow: "母舰位置",
    round: "回合",
    phase: "阶段",
  };
  for (const [key, label] of Object.entries(labels)) {
    if (JSON.stringify(formalStep.before[key]) !== JSON.stringify(formalStep.after[key])) {
      changes.push(`${label}${formalStep.before[key]}→${formalStep.after[key]}`);
    }
  }
  for (const [key, label] of [
    ["dice", "骰子"], ["ships", "飞船"], ["waitingShips", "等待飞船"],
    ["placements", "放置"], ["robots", "机器人"],
  ]) {
    const row = summarizeArrayChange(label, formalStep.before[key], formalStep.after[key]);
    if (row) changes.push(row);
  }
  if (JSON.stringify(formalStep.before.outcome) !== JSON.stringify(formalStep.after.outcome)) {
    changes.push(`游戏结果变为${formalStep.after.outcome?.result || "未结束"}`);
  }
  return {
    affected_object: changes.length ? "本次操作后玩家可见的状态部分" : "本次操作涉及的公开状态部分",
    change_trend: changes.length ? changes.join("；") : "没有发生可见状态变化",
    cause_relation: `${operation.type}经过正式规则结算`,
    temporal_state: "实际操作结算并获得反馈后",
    context: "玩家可见的正式游戏反馈",
  };
}

function feedbackApplicability(operation, formalStep) {
  return {
    operationType: operation.type,
    phaseBefore: formalStep.before.phase,
    roomId: operation.roomId || null,
    cellId: operation.cellId || null,
    energyBefore: formalStep.before.energy,
    researchIndexBefore: formalStep.before.researchIndex,
    excavatorIndexBefore: formalStep.before.excavatorIndex,
    mothershipRowBefore: formalStep.before.mothershipRow,
  };
}

function recalledExpectations(candidate, predictionLedger) {
  const evidenceIds = new Set((candidate.provenance || []).map((row) => row.ref));
  const ledgerEntry = [...predictionLedger].reverse().find((entry) => (
    evidenceIds.has(entry.evidenceId)
      && entry.ticket?.evaluation?.evaluations?.some((row) => row.observed)
  ));
  if (!ledgerEntry) return [];
  return ledgerEntry.ticket.evaluation.evaluations
    .filter((row) => row.observed)
    .map((row) => {
      const expectation = clone(row.expectation);
      delete expectation.baselineValue;
      const prefix = expectation.itemId.split(":", 1)[0];
      if (prefix === "track") delete expectation.field;
      if (row.afterValue === undefined) {
        return prefix === "track" || expectation.field ? null : {
          itemId: expectation.itemId,
          change: "absent",
        };
      }
      return {
        itemId: expectation.itemId,
        ...(expectation.field ? { field: expectation.field } : {}),
        change: "equals",
        value: clone(row.afterValue),
      };
    })
    .filter(Boolean);
}

function ticketActualFollowingQ(ticket, evaluation, operation) {
  const observed = evaluation.evaluations.filter((row) => row.observed);
  const changes = observed.map((row) => {
    const target = row.expectation.field
      ? `${row.expectation.itemId}.${row.expectation.field}`
      : row.expectation.itemId;
    return `${target}实际为${JSON.stringify(row.afterValue)}`;
  });
  return {
    affected_object: observed.map((row) => row.expectation.itemId).join("、") || "预测票据关注的状态",
    change_trend: changes.join("；") || "尚未获得足够的可见结果",
    cause_relation: `${operation.type}经过正式规则结算`,
    temporal_state: "预测票据截止并获得玩家可见反馈后",
    context: "与行动前明确预测逐项比较的正式反馈",
  };
}

class UfsFullGameFeedbackBridge {
  constructor({
    learner,
    feedbackGteMemory = null,
    pendingPredictions = [],
    pendingPredictionTickets = [],
    pendingCognitiveUnitTickets = [],
    completedCognitiveUnitPending = false,
    episodeId = null,
    previousTrajectoryId = null,
    nextEvidenceId = 1,
    nextTicketId = 1,
    seenPredictionKeys = [],
    predictionLedger = [],
  } = {}) {
    if (!learner) throw new TypeError("full-game feedback bridge requires a learner");
    this.learner = learner;
    this.feedbackGteMemory = feedbackGteMemory;
    this.pendingPredictions = clone(pendingPredictions);
    this.pendingPredictionTickets = clone(pendingPredictionTickets);
    this.pendingCognitiveUnitTickets = clone(pendingCognitiveUnitTickets);
    this.completedCognitiveUnitPending = Boolean(completedCognitiveUnitPending);
    this.episodeId = episodeId;
    this.previousTrajectoryId = previousTrajectoryId;
    this.nextEvidenceId = nextEvidenceId;
    this.nextTicketId = nextTicketId;
    this.seenPredictionKeys = new Set(seenPredictionKeys);
    this.predictionLedger = clone(predictionLedger);
  }

  exportCheckpoint() {
    return {
      schema: "ufs_full_game_feedback_bridge_checkpoint_v1",
      pendingPredictions: clone(this.pendingPredictions),
      pendingPredictionTickets: clone(this.pendingPredictionTickets),
      pendingCognitiveUnitTickets: clone(this.pendingCognitiveUnitTickets),
      completedCognitiveUnitPending: this.completedCognitiveUnitPending,
      episodeId: this.episodeId,
      previousTrajectoryId: this.previousTrajectoryId,
      nextEvidenceId: this.nextEvidenceId,
      nextTicketId: this.nextTicketId,
      seenPredictionKeys: [...this.seenPredictionKeys],
      predictionLedger: clone(this.predictionLedger),
    };
  }

  exportPredictionLedger() {
    return clone(this.predictionLedger);
  }

  _gteFeedbackTickets({ seedTickets, operation, allocateTicketId }) {
    if (!this.feedbackGteMemory) return [];
    const recalledTrajectoryIds = new Set();
    const output = [];
    for (const seed of seedTickets) {
      const context = {
        ...seed.applicability,
        predictionSource: seed.source,
      };
      const recalled = this.feedbackGteMemory.query(seed.currentQ, {
        context,
        operations: seed.operations || [operation],
        previousTrajectoryId: this.previousTrajectoryId,
        topK: 3,
      });
      let candidate = null;
      let expectations = [];
      for (const row of recalled) {
        const trajectory = row.trajectory;
        if (!String(trajectory.trajectoryId).startsWith("feedback-")
          || recalledTrajectoryIds.has(trajectory.trajectoryId)) continue;
        const contract = recalledExpectations(trajectory, this.predictionLedger);
        if (contract.length === 0) continue;
        candidate = { ...trajectory, activation: row.activation, matrixKind: row.matrixKind };
        expectations = contract;
        break;
      }
      if (!candidate) continue;
      recalledTrajectoryIds.add(candidate.trajectoryId);
      output.push({
        schema: "ufs_prediction_ticket_v1",
        ticketId: allocateTicketId(),
        source: "gte_feedback_trajectory",
        issuedForOperation: operation.type,
        trajectoryId: candidate.trajectoryId,
        activation: Number(Math.min(1, Math.max(0, candidate.activation)).toFixed(6)),
        operations: clone(candidate.operations || seed.operations || [operation]),
        currentQ: clone(candidate.currentQ),
        predictedFollowingQ: clone(candidate.followingQ),
        expectations,
        deadline: "stable_boundary",
        rationale: "player_feedback_real_gte_top_k",
        supportingMemoryIds: clone(candidate.supportingMemoryIds || []),
        applicability: clone(candidate.applicability),
        recalledFrom: {
          seedTicketId: seed.ticketId,
          trajectoryId: candidate.trajectoryId,
          compileStatus: candidate.compileStatus,
          matrixKind: candidate.matrixKind,
          originalPredictionSource: candidate.applicability?.predictionSource || null,
        },
      });
    }
    return output;
  }

  process({
    operation,
    traceDelta,
    formalStep,
    playerResponse,
    mentalBefore = null,
    predictedWorld = null,
    predictionDeclarations = null,
    cognitiveUnitEvent = null,
  }) {
    if (mentalBefore && predictedWorld && Array.isArray(predictionDeclarations)) {
      return this._processPredictionTickets({
        operation,
        traceDelta,
        formalStep,
        playerResponse,
        mentalBefore,
        predictedWorld,
        predictionDeclarations,
        cognitiveUnitEvent,
      });
    }
    return this._processLegacy({ operation, traceDelta, formalStep, playerResponse });
  }

  _processPredictionTickets({
    operation,
    traceDelta,
    formalStep,
    playerResponse,
    mentalBefore,
    predictedWorld,
    predictionDeclarations,
    cognitiveUnitEvent,
  }) {
    const envelopes = collectPredictionEnvelopes(traceDelta)
      .filter((row) => !this.seenPredictionKeys.has(row.occurrenceKey));
    envelopes.forEach((row) => this.seenPredictionKeys.add(row.occurrenceKey));
    const allocateTicketId = () => {
      const ticketId = `prediction-ticket-${String(this.nextTicketId).padStart(6, "0")}`;
      this.nextTicketId += 1;
      return ticketId;
    };
    const issuedApplicability = feedbackApplicability(operation, { before: mentalBefore });
    const unitStart = cognitiveUnitEvent?.operationIndex === 0;
    const deliberateOperation = unitStart ? { type: "cognitive_unit" } : operation;
    const compiledDeliberate = compileDeclaredPredictionTickets({
      operation: deliberateOperation,
      declarations: predictionDeclarations,
      formalBefore: formalStep.before,
      beliefBefore: mentalBefore,
      nextTicketId: allocateTicketId,
    }).map((ticket) => ({
      ...ticket,
      applicability: {
        ...clone(issuedApplicability),
        ...(unitStart ? {
          cognitiveUnitObjective: clone(cognitiveUnitEvent.unit.objective),
          cognitiveUnitOperationCount: cognitiveUnitEvent.unit.operations.length,
        } : {}),
      },
      ...(unitStart ? {
        issuedForOperation: "cognitive_unit",
        operations: clone(cognitiveUnitEvent.unit.operations),
        cognitiveUnit: clone(cognitiveUnitEvent.unit),
      } : {}),
    }));
    const deliberate = unitStart ? [] : compiledDeliberate;
    const automatic = compileAutomaticPredictionTickets({
      envelopes,
      operation,
      mentalBefore,
      predictedWorld,
      nextTicketId: allocateTicketId,
    }).filter((ticket) => ticket.expectations.length > 0)
      .map((ticket) => ({ ...ticket, applicability: clone(issuedApplicability) }));
    const recalled = this._gteFeedbackTickets({
      seedTickets: [...compiledDeliberate, ...automatic],
      operation,
      allocateTicketId,
    });
    const unitTicketIds = new Set(compiledDeliberate.map((ticket) => ticket.ticketId));
    const unitRecalled = unitStart
      ? recalled.filter((ticket) => unitTicketIds.has(ticket.recalledFrom?.seedTicketId))
      : [];
    const immediateRecalled = unitStart
      ? recalled.filter((ticket) => !unitTicketIds.has(ticket.recalledFrom?.seedTicketId))
      : recalled;
    if (unitStart) {
      this.pendingCognitiveUnitTickets.push(...compiledDeliberate, ...unitRecalled);
    }
    if (cognitiveUnitEvent?.status === "completed") {
      this.completedCognitiveUnitPending = true;
    }
    this.pendingPredictionTickets.push(...deliberate, ...automatic, ...immediateRecalled);

    if (!formalStep.accepted) {
      return {
        status: "quarantined_system_error",
        reason: formalStep.error,
        learned: [],
        predictionCount: this.pendingPredictionTickets.length,
        tickets: clone(this.pendingPredictionTickets),
      };
    }
    if (!formalStep.stable) {
      return {
        status: "deferred",
        reason: formalStep.deferredReason,
        learned: [],
        predictionCount: this.pendingPredictionTickets.length,
        newlyIssuedTicketCount: deliberate.length + automatic.length + recalled.length,
        tickets: clone(this.pendingPredictionTickets),
      };
    }

    const tickets = this.pendingPredictionTickets;
    this.pendingPredictionTickets = [];
    if (this.completedCognitiveUnitPending) {
      tickets.push(...this.pendingCognitiveUnitTickets);
      this.pendingCognitiveUnitTickets = [];
      this.completedCognitiveUnitPending = false;
    }
    if (tickets.length === 0) {
      return {
        status: "no_prediction",
        reason: "no_verifiable_prediction_ticket_before_action",
        learned: [],
        predictionCount: 0,
        tickets: [],
      };
    }

    const noticedItemIds = (playerResponse.noticedItems || []).map((row) => row.itemId);
    const evaluated = tickets.map((ticket) => ({
      ticket,
      evaluation: evaluatePredictionTicket(ticket, {
        formalBefore: formalStep.before,
        formalAfter: formalStep.after,
        noticedItemIds,
      }),
    }));
    const contradicted = evaluated.filter((row) => row.evaluation.status === "contradicted");
    const ambiguousIds = new Set();
    for (let left = 0; left < contradicted.length; left += 1) {
      for (let right = left + 1; right < contradicted.length; right += 1) {
        if (ticketsOverlap(contradicted[left].ticket, contradicted[right].ticket)) {
          ambiguousIds.add(contradicted[left].ticket.ticketId);
          ambiguousIds.add(contradicted[right].ticket.ticketId);
        }
      }
    }

    const learned = [];
    for (const row of evaluated) {
      const { ticket, evaluation } = row;
      if (evaluation.status === "unresolved" || ambiguousIds.has(ticket.ticketId)) continue;
      const evidenceId = `full-game-feedback-${String(this.nextEvidenceId).padStart(6, "0")}`;
      this.nextEvidenceId += 1;
      const actualQ = evaluation.status === "confirmed"
        ? ticket.predictedFollowingQ
        : ticketActualFollowingQ(ticket, evaluation, { type: ticket.issuedForOperation });
      const predictionCandidates = ticket.trajectoryId ? [{
        trajectoryId: ticket.trajectoryId,
        activation: ticket.activation,
        predictedFollowingQ: ticket.predictedFollowingQ,
      }] : [];
      const result = this.learner.learnObservedTransition({
        evidence: {
          evidenceId,
          playerVisible: true,
          transition: "committed",
          systemIntegrity: "passed",
        },
        currentQ: ticket.currentQ,
        actualFollowingQ: actualQ,
        operations: ticket.operations || [operation],
        experienceContext: {
          episodeId: this.episodeId,
          ticketId: ticket.ticketId,
          issuedForOperation: ticket.issuedForOperation,
          round: formalStep.before.round,
          phase: formalStep.before.phase,
        },
        source: { kind: "single_experience", ref: evidenceId },
        applicability: {
          ...ticket.applicability,
          predictionSource: ticket.recalledFrom?.originalPredictionSource || ticket.source,
        },
        predictionCandidates,
        previousTrajectoryId: this.previousTrajectoryId,
      });
      this.previousTrajectoryId = result.trajectory?.trajectoryId
        || result.existingTrajectoryUpdates?.[0]?.trajectoryId
        || this.previousTrajectoryId;
      learned.push({
        evidenceId,
        ticket: clone(ticket),
        evaluation: clone(evaluation),
        result,
      });
    }

    const counts = Object.fromEntries(["confirmed", "contradicted", "unresolved"].map((status) => [
      status,
      evaluated.filter((row) => row.evaluation.status === status).length,
    ]));
    let status;
    let reason = null;
    if (learned.some((row) => row.evaluation.status === "contradicted")) status = "learned_correction";
    else if (learned.length > 0) status = "learned_confirmations";
    else {
      status = "not_learned";
      reason = ambiguousIds.size > 0
        ? "overlapping_prediction_tickets_make_mismatch_attribution_ambiguous"
        : "prediction_targets_not_fully_present_in_player_attention";
    }
    const auditedTickets = evaluated.map((row) => ({
      ...clone(row.ticket),
      evaluation: clone(row.evaluation),
      learningDisposition: ambiguousIds.has(row.ticket.ticketId) ? "ambiguous" : row.evaluation.status,
    }));
    const learnedEvidenceByTicket = new Map(learned.map((row) => [
      row.ticket.ticketId,
      row.evidenceId,
    ]));
    this.predictionLedger.push(...auditedTickets.map((ticket) => ({
      ticket: clone(ticket),
      status: ticket.learningDisposition,
      evidenceId: learnedEvidenceByTicket.get(ticket.ticketId) || null,
    })));
    return {
      status,
      reason,
      learned,
      predictionCount: tickets.length,
      ticketCounts: counts,
      ambiguousTicketIds: [...ambiguousIds],
      tickets: auditedTickets,
    };
  }

  _processLegacy({ operation, traceDelta, formalStep, playerResponse }) {
    const newPredictions = collectPredictionEnvelopes(traceDelta)
      .filter((row) => !this.seenPredictionKeys.has(row.occurrenceKey));
    newPredictions.forEach((row) => this.seenPredictionKeys.add(row.occurrenceKey));
    this.pendingPredictions.push(...newPredictions);
    if (!formalStep.accepted) {
      return {
        status: "quarantined_system_error",
        reason: formalStep.error,
        learned: [],
        predictionCount: this.pendingPredictions.length,
      };
    }
    if (!formalStep.stable) {
      return {
        status: "deferred",
        reason: formalStep.deferredReason,
        learned: [],
        predictionCount: this.pendingPredictions.length,
      };
    }
    const predictions = this.pendingPredictions;
    this.pendingPredictions = [];
    const visibleItems = visibleChangedItemIds(formalStep, playerResponse);
    if (predictions.length === 0) {
      return { status: "no_prediction", reason: "no_five_slot_prediction_in_trace", learned: [], predictionCount: 0 };
    }
    if (visibleItems.length === 0) {
      return {
        status: "not_learned",
        reason: "actual_change_not_present_in_player_attention",
        learned: [],
        predictionCount: predictions.length,
      };
    }
    if (formalStep.cognitiveMatch === false && predictions.length !== 1) {
      return {
        status: "not_learned",
        reason: "multiple_predictions_make_mismatch_attribution_ambiguous",
        learned: [],
        predictionCount: predictions.length,
      };
    }
    const learned = [];
    for (const prediction of predictions) {
      const actualQ = formalStep.cognitiveMatch
        ? prediction.predictedFollowingQ
        : actualFollowingQ(formalStep, operation);
      const missedAttention = formalStep.cognitiveMatch ? [] : prediction.omittedItemIds
        .filter((itemId) => itemIdsForSection(
          formalStep.differingSections[0], formalStep.before, formalStep.after,
        ).includes(itemId))
        .map((itemId) => ({
          selector: { itemIds: [itemId] },
          scope: { action: operation.type, phase: formalStep.before.phase },
          amount: 0.08,
          reason: "正式反馈显示该情境中的认知偏差与漏看的状态部分有关",
        }));
      const evidenceId = `full-game-feedback-${String(this.nextEvidenceId).padStart(6, "0")}`;
      this.nextEvidenceId += 1;
      const result = this.learner.learnObservedTransition({
        evidence: {
          evidenceId,
          playerVisible: true,
          transition: "committed",
          systemIntegrity: "passed",
        },
        currentQ: prediction.currentQ,
        actualFollowingQ: actualQ,
        operations: prediction.operations || [operation],
        experienceContext: {
          episodeId: this.episodeId,
          trajectoryId: prediction.trajectoryId,
          operationType: operation.type,
          round: formalStep.before.round,
          phase: formalStep.before.phase,
        },
        source: { kind: "single_experience", ref: evidenceId },
        applicability: feedbackApplicability(operation, formalStep),
        predictionCandidates: [{
          trajectoryId: prediction.trajectoryId,
          activation: prediction.activation,
          predictedFollowingQ: prediction.predictedFollowingQ,
        }],
        previousTrajectoryId: this.previousTrajectoryId,
        missedAttention,
      });
      this.previousTrajectoryId = result.trajectory?.trajectoryId
        || result.existingTrajectoryUpdates?.[0]?.trajectoryId
        || this.previousTrajectoryId;
      learned.push({ evidenceId, prediction: clone(prediction), result });
    }
    if (operation.type === "choose_research_advance") {
      const researchPrediction = predictions.find((row) => row.patch?.kind === "research_room_choice");
      const researchVisible = visibleItems.includes("track:energy")
        || visibleItems.includes("track:researchIndex");
      if (researchPrediction && researchVisible) {
        const evidenceId = `full-game-feedback-${String(this.nextEvidenceId).padStart(6, "0")}`;
        this.nextEvidenceId += 1;
        const budget = researchPrediction.patch.budget;
        const nextCost = researchPrediction.patch.continuousCosts?.[0] ?? null;
        const concreteFollowingQ = {
          affected_object: "支付房间能源后的研究进度与剩余能源",
          change_trend: `能源${formalStep.before.energy}→${formalStep.after.energy}；研究${formalStep.before.researchIndex}→${formalStep.after.researchIndex}；实际推进${operation.advanceSteps}格`,
          cause_relation: `研究房预算${budget}与下一研究需求${nextCost}共同限制推进`,
          temporal_state: "研究房完成实际结算后",
          context: "玩家可见的正式研究反馈",
        };
        const result = this.learner.learnObservedTransition({
          evidence: {
            evidenceId,
            playerVisible: true,
            transition: "committed",
            systemIntegrity: "passed",
          },
          currentQ: researchPrediction.currentQ,
          actualFollowingQ: concreteFollowingQ,
          operations: researchPrediction.operations || [operation],
          experienceContext: {
            episodeId: this.episodeId,
            trajectoryId: researchPrediction.trajectoryId,
            operationType: operation.type,
            round: formalStep.before.round,
            phase: formalStep.before.phase,
          },
          source: { kind: "single_experience", ref: evidenceId },
          applicability: {
            operationType: operation.type,
            roomId: operation.roomId,
            roomBudget: budget,
            nextResearchCost: nextCost,
            energyBefore: formalStep.before.energy,
            researchIndexBefore: formalStep.before.researchIndex,
          },
          previousTrajectoryId: researchPrediction.trajectoryId,
        });
        this.previousTrajectoryId = result.trajectory?.trajectoryId || this.previousTrajectoryId;
        learned.push({
          evidenceId,
          prediction: clone(researchPrediction),
          result,
          concreteResearchResult: true,
        });
      }
    }
    return {
      status: formalStep.cognitiveMatch ? "learned_confirmations" : "learned_correction",
      reason: null,
      learned,
      predictionCount: predictions.length,
      visibleChangedItemIds: visibleItems,
      formalCognitiveMatch: formalStep.cognitiveMatch,
    };
  }
}

module.exports = {
  UfsFullGameFeedbackBridge,
  actualFollowingQ,
  collectPredictionEnvelopes,
  feedbackApplicability,
  itemIdsForSection,
  recalledExpectations,
  visibleChangedItemIds,
};
