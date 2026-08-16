"use strict";

const crypto = require("crypto");

const RESPONSE_KEYS = new Set(["schema", "eventId", "selections", "abstainReason"]);
const SELECTION_KEYS = new Set(["rowId", "evidence"]);
const EVIDENCE_KEYS = new Set(["factPath", "observedValue", "requirement"]);
const FORBIDDEN_OUTPUT_KEYS = new Set(["action", "actions", "emit", "nextAction", "payload", "then"]);

function compileWakeRows(definitions) {
  const publicRows = [];
  const privatePayloads = {};
  const seen = new Set();
  definitions.forEach((definition, index) => {
    const rowId = definition.rowId || `W${String(index + 1).padStart(3, "0")}`;
    if (seen.has(rowId)) throw new Error(`duplicate wake row: ${rowId}`);
    seen.add(rowId);
    if (!definition.sourceRuleId || !definition.triggerDescription || !definition.requires) {
      throw new Error(`incomplete wake row: ${rowId}`);
    }
    publicRows.push({
      rowId,
      sourceRuleId: definition.sourceRuleId,
      triggerDescription: definition.triggerDescription,
      requires: structuredClone(definition.requires),
    });
    privatePayloads[rowId] = {
      rowId,
      emit: structuredClone(definition.emit || []),
      chainDirective: definition.chainDirective || "continue",
      priority: definition.priority || 0,
    };
  });
  return {
    schema: "wake_row_matrix_v1",
    publicRows,
    publicRowsHash: sha(publicRows),
    privatePayloads,
  };
}

function validateAgentResponse({ eventId, localFact, response, compiled }) {
  const errors = [];
  rejectForbiddenKeys(response, "response", errors);
  rejectUnknownKeys(response, RESPONSE_KEYS, "response", errors);
  if (response?.schema !== "wake_row_selection_v1") errors.push("schema必须是wake_row_selection_v1");
  if (response?.eventId !== eventId) errors.push(`eventId不匹配：${response?.eventId}/${eventId}`);
  if (!Array.isArray(response?.selections)) errors.push("selections必须是数组");
  const rows = new Map(compiled.publicRows.map((row) => [row.rowId, row]));
  const selected = new Set();
  for (const [selectionIndex, selection] of (response?.selections || []).entries()) {
    const prefix = `selections[${selectionIndex}]`;
    rejectForbiddenKeys(selection, prefix, errors);
    rejectUnknownKeys(selection, SELECTION_KEYS, prefix, errors);
    const row = rows.get(selection.rowId);
    if (!row) {
      errors.push(`${prefix}.rowId不存在：${selection.rowId}`);
      continue;
    }
    if (selected.has(selection.rowId)) errors.push(`${prefix}.rowId重复：${selection.rowId}`);
    selected.add(selection.rowId);
    if (!Array.isArray(selection.evidence)) {
      errors.push(`${prefix}.evidence必须是数组`);
      continue;
    }
    const evidenceByPath = new Map();
    for (const [evidenceIndex, evidence] of selection.evidence.entries()) {
      const evidencePrefix = `${prefix}.evidence[${evidenceIndex}]`;
      rejectForbiddenKeys(evidence, evidencePrefix, errors);
      rejectUnknownKeys(evidence, EVIDENCE_KEYS, evidencePrefix, errors);
      const actual = getPath(localFact, evidence.factPath);
      if (!same(actual, evidence.observedValue)) errors.push(`${evidencePrefix}观察值与localFact不符`);
      evidenceByPath.set(evidence.factPath, evidence);
    }
    for (const requirement of row.requires) {
      const actual = getPath(localFact, requirement.factPath);
      if (!matches(actual, requirement)) errors.push(`${prefix}不满足${requirement.factPath}`);
      const evidence = evidenceByPath.get(requirement.factPath);
      if (!evidence) errors.push(`${prefix}缺少${requirement.factPath}举证`);
      else if (!same(evidence.requirement, publicRequirement(requirement))) errors.push(`${prefix}.${requirement.factPath} requirement抄录不一致`);
    }
  }
  if (!(response?.selections || []).length && !response?.abstainReason) errors.push("未选择行时必须给abstainReason");
  return { ok: errors.length === 0, errors, selectedRowIds: [...selected] };
}

function executeSelectedRows({ eventId, localFact, response, compiled, consumed = new Set(), executor }) {
  const validation = validateAgentResponse({ eventId, localFact, response, compiled });
  if (!validation.ok) throw new Error(`invalid wake row response:\n${validation.errors.join("\n")}`);
  const results = [];
  for (const rowId of validation.selectedRowIds) {
    const consumeKey = `${eventId}:${rowId}`;
    if (consumed.has(consumeKey)) throw new Error(`wake row already consumed: ${consumeKey}`);
    consumed.add(consumeKey);
    const payload = compiled.privatePayloads[rowId];
    const emittedResults = [];
    for (const actionTemplate of payload.emit) {
      const action = resolveTemplate(actionTemplate, localFact);
      emittedResults.push(executor(action, { eventId, rowId, localFact }));
    }
    results.push({ rowId, emittedResults, chainDirective: payload.chainDirective });
  }
  return {
    schema: "wake_row_execution_v1",
    eventId,
    selectedRowIds: validation.selectedRowIds,
    results,
    abstained: validation.selectedRowIds.length === 0,
  };
}

function referenceSelectRows({ eventId, localFact, publicRows }) {
  const matching = publicRows.filter((row) => row.requires.every((requirement) => matches(getPath(localFact, requirement.factPath), requirement)));
  return {
    schema: "wake_row_selection_v1",
    eventId,
    selections: matching.map((row) => ({
      rowId: row.rowId,
      evidence: row.requires.map((requirement) => ({
        factPath: requirement.factPath,
        observedValue: structuredClone(getPath(localFact, requirement.factPath)),
        requirement: publicRequirement(requirement),
      })),
    })),
    ...(matching.length ? {} : { abstainReason: "没有满足全部触发条件的记忆行" }),
  };
}

function publicRequirement(requirement) {
  if (Object.hasOwn(requirement, "equals")) return { equals: structuredClone(requirement.equals) };
  if (Object.hasOwn(requirement, "includes")) return { includes: structuredClone(requirement.includes) };
  if (Object.hasOwn(requirement, "exists")) return { exists: Boolean(requirement.exists) };
  throw new Error(`unsupported requirement: ${JSON.stringify(requirement)}`);
}

function matches(actual, requirement) {
  if (Object.hasOwn(requirement, "equals")) return same(actual, requirement.equals);
  if (Object.hasOwn(requirement, "includes")) return Array.isArray(actual) && actual.includes(requirement.includes);
  if (Object.hasOwn(requirement, "exists")) return requirement.exists ? actual != null : actual == null;
  return false;
}

function resolveTemplate(value, localFact) {
  if (Array.isArray(value)) return value.map((item) => resolveTemplate(item, localFact));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, resolveTemplate(item, localFact)]));
  if (typeof value !== "string") return value;
  if (/^\$fact\./.test(value)) return structuredClone(getPath(localFact, value.slice(6)));
  return value.replace(/\$\{fact\.([^}]+)\}/g, (_, factPath) => String(getPath(localFact, factPath)));
}

function rejectForbiddenKeys(value, prefix, errors) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) if (FORBIDDEN_OUTPUT_KEYS.has(key)) errors.push(`${prefix}禁止输出字段${key}`);
}

function rejectUnknownKeys(value, allowed, prefix, errors) {
  if (!value || typeof value !== "object") return;
  for (const key of Object.keys(value)) if (!allowed.has(key)) errors.push(`${prefix}未知字段${key}`);
}

function getPath(value, factPath) {
  return String(factPath || "").split(".").reduce((current, key) => current == null ? undefined : current[key], value);
}

function same(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function sha(value) {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

module.exports = { compileWakeRows, executeSelectedRows, referenceSelectRows, validateAgentResponse };
