"use strict";

function clone(value) {
  return structuredClone(value);
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function matches(row, expected = {}) {
  return Object.entries(expected).every(([key, value]) => sameValue(row?.[key], value));
}

function evaluateEntityAnchor(q, anchor) {
  const collection = q?.world?.[anchor.collection];
  if (!Array.isArray(collection)) {
    return {
      status: "uncertain",
      reason: `collection_not_available:${anchor.collection}`,
      evidence: null,
    };
  }
  const evidence = collection.find((row) => matches(row, anchor.match));
  if (evidence) return { status: "supported", reason: "matching_entity_present", evidence: clone(evidence) };
  if ((q?.epistemic?.omittedCollections || []).includes(anchor.collection)) {
    return {
      status: "uncertain",
      reason: `entity_may_be_omitted:${anchor.collection}`,
      evidence: null,
    };
  }
  return { status: "unsupported", reason: "matching_entity_absent", evidence: null };
}

function runSequentialRollout({ initialQ, steps, imagineStep, evaluateAnchor = evaluateEntityAnchor } = {}) {
  if (!initialQ || typeof initialQ !== "object") throw new TypeError("initialQ is required");
  if (!Array.isArray(steps) || steps.length === 0) throw new TypeError("steps are required");
  if (typeof imagineStep !== "function") throw new TypeError("imagineStep is required");
  if (typeof evaluateAnchor !== "function") throw new TypeError("evaluateAnchor must be a function");

  let currentQ = clone(initialQ);
  const trace = [];
  for (let index = 0; index < steps.length; index += 1) {
    const step = clone(steps[index]);
    const qBefore = clone(currentQ);
    const anchor = step.anchor == null
      ? { status: "supported", reason: "no_anchor_required", evidence: null }
      : evaluateAnchor(qBefore, step.anchor);
    if (!["supported", "unsupported", "uncertain"].includes(anchor?.status)) {
      throw new TypeError("anchor evaluation must return supported, unsupported, or uncertain");
    }
    if (anchor.status !== "supported") {
      trace.push({ index, stepId: step.id, operation: step.operation, qBefore, anchor, imagined: false });
      return {
        schema: "ufs_sequential_q_rollout_v1",
        status: anchor.status === "uncertain" ? "paused_uncertain" : "invalidated",
        stoppedBeforeStep: index,
        stopReason: anchor.reason,
        trace,
        finalQ: qBefore,
        deterministicBenefitClaimAllowed: false,
      };
    }

    const immutableInput = clone(qBefore);
    const imagined = imagineStep({
      index,
      step: clone(step),
      qBefore: clone(qBefore),
    });
    if (!imagined || typeof imagined !== "object" || !imagined.qAfter) {
      throw new TypeError("imagineStep must return { qAfter, ... }");
    }
    if (!sameValue(qBefore, immutableInput)) throw new Error("imagineStep mutated qBefore");
    currentQ = clone(imagined.qAfter);
    trace.push({
      index,
      stepId: step.id,
      operation: step.operation,
      qBefore,
      anchor: clone(anchor),
      qAfter: clone(currentQ),
      imaginationEvidence: clone(imagined.evidence || null),
      imagined: true,
    });
  }
  return {
    schema: "ufs_sequential_q_rollout_v1",
    status: "complete",
    stoppedBeforeStep: null,
    stopReason: null,
    trace,
    finalQ: clone(currentQ),
    deterministicBenefitClaimAllowed: true,
  };
}

function revalidateNextStep({ actualQ, step, evaluateAnchor = evaluateEntityAnchor } = {}) {
  if (!actualQ || !step) throw new TypeError("actualQ and step are required");
  const anchor = step.anchor == null
    ? { status: "supported", reason: "no_anchor_required", evidence: null }
    : evaluateAnchor(actualQ, step.anchor);
  return {
    schema: "ufs_sequential_q_revalidation_v1",
    stepId: step.id,
    anchor,
    mayExecute: anchor.status === "supported",
    mayClaimDeterministicBenefit: anchor.status === "supported",
    requiresReplan: anchor.status !== "supported",
  };
}

module.exports = {
  evaluateEntityAnchor,
  revalidateNextStep,
  runSequentialRollout,
};
