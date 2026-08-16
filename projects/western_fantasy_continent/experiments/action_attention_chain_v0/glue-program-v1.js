"use strict";

const ACTION_TYPES = new Set([
  "notice", "compute", "adjust", "place", "relocate", "move_along",
  "remove", "damage", "reveal", "create", "decision", "random",
  "unknown", "outcome",
]);
const REGION_MODES = new Set(["unit", "flood", "rays"]);
const QUERY_MODES = new Set(["all", "first", "first_by", "nearest_per_direction", "random_one"]);
const BANNED_EXAMPLE_IDS = ["ship-purple", "ship-white", "purple-0", "die-4"];
const ACTION_FIELDS = {
  notice: { required: ["type", "label"], optional: ["id", "entityId"] },
  compute: { required: ["type", "key", "value"], optional: [] },
  adjust: { required: ["type", "key", "delta"], optional: ["min", "max"] },
  place: { required: ["type", "entityId", "targetUnitId"], optional: [] },
  relocate: { required: ["type", "entityId", "targetUnitId"], optional: [] },
  move_along: { required: ["type", "entityId", "connectionKind"], optional: ["distance", "distanceFrom", "direction"] },
  remove: { required: ["type", "entityId"], optional: [] },
  damage: { required: ["type", "entityId", "amount"], optional: [] },
  reveal: { required: ["type", "entityId"], optional: [] },
  create: { required: ["type", "entity"], optional: [] },
  decision: { required: ["type", "owner", "reason"], optional: [] },
  random: { required: ["type", "reason"], optional: ["possibilities"] },
  unknown: { required: ["type", "reason"], optional: [] },
  outcome: { required: ["type", "outcome", "reason"], optional: [] },
};
const REGION_FIELDS = new Set(["mode", "seed", "maxDepth", "directions", "connectionKinds"]);
const QUERY_FIELDS = new Set(["mode", "target", "keep", "stopAt", "field", "order", "seed"]);
const PREDICATE_FIELDS = new Set(["exists", "type", "faction", "id", "idNot", "tagsAll", "unitTagsAll", "kind"]);
const CONDITION_OPERATORS = new Set(["includes", "excludes", "exists", "not"]);

function validateGlueProgram(program, { expectedSourceRuleIds = [], allowPartial = false } = {}) {
  const errors = [];
  if (!program || program.schema !== "glue_program_v1") errors.push("schema必须是glue_program_v1");
  if (!Array.isArray(program?.steps)) errors.push("steps必须是数组");
  if (errors.length) return { ok: false, errors };

  const seenSources = new Set();
  const seenUnits = new Set();
  program.steps.forEach((step, stepIndex) => {
    const prefix = `steps[${stepIndex}]`;
    if (typeof step.sourceRuleId !== "string") errors.push(`${prefix}.sourceRuleId缺失`);
    if (seenSources.has(step.sourceRuleId)) errors.push(`${prefix}重复来源${step.sourceRuleId}`);
    seenSources.add(step.sourceRuleId);
    if (expectedSourceRuleIds.length && !expectedSourceRuleIds.includes(step.sourceRuleId)) {
      errors.push(`${prefix}引用未知规则${step.sourceRuleId}`);
    }
    if (typeof step.interpretation !== "string" || !step.interpretation.trim()) {
      errors.push(`${prefix}.interpretation必须说明本句局部因果`);
    }
    if (!Array.isArray(step.units)) errors.push(`${prefix}.units必须是数组`);
    for (const [unitIndex, unit] of (step.units || []).entries()) {
      validateUnit(unit, `${prefix}.units[${unitIndex}]`, step.sourceRuleId, errors, seenUnits);
    }
  });

  if (expectedSourceRuleIds.length) {
    const actual = program.steps.map((step) => step.sourceRuleId);
    const expectedPrefix = allowPartial ? expectedSourceRuleIds.slice(0, actual.length) : expectedSourceRuleIds;
    if (JSON.stringify(actual) !== JSON.stringify(expectedPrefix)) {
      errors.push(`步骤必须按顺序追加：期望${expectedPrefix.join(",")}，实际${actual.join(",")}`);
    }
  }

  const serialized = JSON.stringify(program);
  for (const id of BANNED_EXAMPLE_IDS) {
    if (serialized.includes(id)) errors.push(`禁止写死示例实体ID：${id}`);
  }
  validateReferences(program, errors);
  return { ok: errors.length === 0, errors };
}

function validateUnit(unit, prefix, sourceRuleId, errors, seenUnits) {
  if (!unit || typeof unit !== "object") {
    errors.push(`${prefix}必须是对象`);
    return;
  }
  if (typeof unit.id !== "string" || !unit.id.trim()) errors.push(`${prefix}.id缺失`);
  else if (seenUnits.has(unit.id)) errors.push(`${prefix}.id重复：${unit.id}`);
  else seenUnits.add(unit.id);
  if (unit.sourceRuleId !== sourceRuleId) errors.push(`${prefix}.sourceRuleId必须等于所在步骤来源`);
  if (!unit.trigger || typeof unit.trigger !== "object" || !Object.keys(unit.trigger).length) {
    errors.push(`${prefix}.trigger不能为空`);
  }
  validateTrigger(unit.trigger || {}, `${prefix}.trigger`, errors);
  if (!Array.isArray(unit.emit) || !unit.emit.length) errors.push(`${prefix}.emit必须包含至少一个动作`);
  for (const [actionIndex, action] of (unit.emit || []).entries()) {
    validateAction(action, `${prefix}.emit[${actionIndex}]`, errors);
  }
  if (unit.attention) {
    if (!REGION_MODES.has(unit.attention.region?.mode)) errors.push(`${prefix}.attention.region.mode不受支持`);
    rejectUnknownFields(unit.attention.region || {}, REGION_FIELDS, `${prefix}.attention.region`, errors);
    const queryMode = unit.attention.query?.mode || "all";
    if (!QUERY_MODES.has(queryMode)) errors.push(`${prefix}.attention.query.mode不受支持：${queryMode}`);
    rejectUnknownFields(unit.attention.query || {}, QUERY_FIELDS, `${prefix}.attention.query`, errors);
    validatePredicate(unit.attention.query?.keep, `${prefix}.attention.query.keep`, errors);
    validatePredicate(unit.attention.query?.stopAt, `${prefix}.attention.query.stopAt`, errors);
  }
  if (unit.priority != null && !Number.isFinite(unit.priority)) errors.push(`${prefix}.priority必须是数字`);
  if (unit.schedule != null && !["immediate", "chain_end"].includes(unit.schedule)) {
    errors.push(`${prefix}.schedule只能是immediate或chain_end`);
  }
}

function validateAction(action, prefix, errors) {
  if (!ACTION_TYPES.has(action?.type)) {
    errors.push(`${prefix}动作类型不受支持：${action?.type}`);
    return;
  }
  const schema = ACTION_FIELDS[action.type];
  const allowed = new Set([...schema.required, ...schema.optional]);
  rejectUnknownFields(action, allowed, prefix, errors);
  for (const field of schema.required) {
    if (action[field] == null) errors.push(`${prefix}.${field}缺失`);
  }
  if (action.type === "move_along" && action.distance == null && action.distanceFrom == null) {
    errors.push(`${prefix}必须提供distance或distanceFrom`);
  }
}

function validateTrigger(trigger, prefix, errors) {
  for (const [path, expected] of Object.entries(trigger)) {
    if (!isAllowedContextPath(path)) errors.push(`${prefix}使用未定义路径：${path}`);
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const keys = Object.keys(expected);
      if (keys.length !== 1 || !CONDITION_OPERATORS.has(keys[0])) {
        errors.push(`${prefix}.${path}条件运算只支持includes/excludes/exists/not`);
      }
    }
  }
}

function validatePredicate(predicate, prefix, errors) {
  if (!predicate) return;
  rejectUnknownFields(predicate, PREDICATE_FIELDS, prefix, errors);
}

function rejectUnknownFields(object, allowed, prefix, errors) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) errors.push(`${prefix}包含未定义字段：${key}`);
  }
}

function validateReferences(value, errors, path = "program") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateReferences(item, errors, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => validateReferences(item, errors, `${path}.${key}`));
    return;
  }
  if (typeof value !== "string") return;
  const refs = [];
  if (/^\$[a-zA-Z]/.test(value) && !value.includes("${")) refs.push(value.slice(1));
  for (const match of value.matchAll(/\$\{([^}]+)\}/g)) refs.push(match[1]);
  for (const ref of refs) {
    if (!isAllowedContextPath(ref)) errors.push(`${path}引用未定义上下文字段：${ref}`);
  }
}

function isAllowedContextPath(path) {
  if (/^memory\.[^.]+$/.test(path)) return true;
  if (/^action\.(type|id|label|entityId|targetUnitId|owner|reason)$/.test(path)) return true;
  if (/^result\.(entityId|from|to|key|value|delta|requestedDistance|path|hpBefore|hpAfter|amount|removed|revealed|created|noticed)$/.test(path)) return true;
  if (/^entity\.(id|type|faction|unitId)$/.test(path)) return true;
  if (/^entity\.state\.[^.]+$/.test(path)) return true;
  if (/^entity\.tags$/.test(path)) return true;
  if (/^(targetUnit|resultUnit)\.(id|kind|tags|column|row)$/.test(path)) return true;
  if (/^match\.(entityId|unitId|distance|direction)$/.test(path)) return true;
  if (/^match\.entity\.(id|type|faction|unitId)$/.test(path)) return true;
  if (/^match\.entity\.state\.[^.]+$/.test(path)) return true;
  if (/^match\.unit\.(id|kind|tags|column|row)$/.test(path)) return true;
  return false;
}

function compileGlueProgram(program, options = {}) {
  const validation = validateGlueProgram(program, options);
  if (!validation.ok) throw new Error(`invalid glue program:\n${validation.errors.join("\n")}`);
  return program.steps.flatMap((step) => step.units.map((unit) => {
    const rule = {
      id: unit.id,
      sourceRuleId: unit.sourceRuleId,
      when: structuredClone(unit.trigger),
      then: structuredClone(unit.emit),
    };
    if (unit.attention) {
      rule.attention = {
        region: structuredClone(unit.attention.region),
        query: structuredClone(unit.attention.query || {}),
      };
      if (unit.attention.forEachMatch) rule.forEachMatch = true;
      if (unit.attention.runWhenEmpty) rule.runWhenEmpty = true;
    }
    if (unit.priority != null) rule.priority = unit.priority;
    if (unit.schedule === "chain_end") rule.deferUntilChainEnd = true;
    return rule;
  }));
}

module.exports = { compileGlueProgram, validateGlueProgram };
