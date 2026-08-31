"use strict";

const { assertFiveSlotQ } = require("../imagination_pipeline_v0/five-slot-activation");

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

function normalizeOperationSequence(operations, { fallbackType = null } = {}) {
  const supplied = operations == null && fallbackType
    ? [{ type: fallbackType }]
    : operations;
  if (!Array.isArray(supplied) || supplied.length === 0) {
    throw new TypeError("transition memory requires a non-empty operation sequence");
  }
  return supplied.map((operation, index) => {
    if (!operation || typeof operation !== "object" || Array.isArray(operation)) {
      throw new TypeError(`operation sequence item ${index} must be an object`);
    }
    if (typeof operation.type !== "string" || operation.type.trim() === "") {
      throw new TypeError(`operation sequence item ${index} requires a type`);
    }
    const normalized = clone(operation);
    delete normalized.predictions;
    delete normalized.cognitiveUnit;
    return normalized;
  });
}

function operationSequenceKey(operations) {
  return stable(normalizeOperationSequence(operations));
}

function operationSequenceText(operations) {
  return normalizeOperationSequence(operations)
    .map((operation, index) => `${index + 1}:${stable(operation)}`)
    .join(" → ");
}

function jointTransitionQ(beforeQ, operations) {
  assertFiveSlotQ(beforeQ, "transition beforeQ");
  const sequenceText = operationSequenceText(operations);
  const joint = {
    ...clone(beforeQ),
    cause_relation: `${beforeQ.cause_relation}；显式行为序列：${sequenceText}`,
    temporal_state: `${beforeQ.temporal_state}；行为序列开始前`,
    context: `${beforeQ.context}；Q前与行为联合查询`,
  };
  assertFiveSlotQ(joint, "joint transition Q");
  return joint;
}

module.exports = {
  jointTransitionQ,
  normalizeOperationSequence,
  operationSequenceKey,
  operationSequenceText,
};
