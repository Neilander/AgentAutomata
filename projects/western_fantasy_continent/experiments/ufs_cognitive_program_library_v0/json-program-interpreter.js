"use strict";

const { validateProgram } = require("./program-validator");

function valueFromScope(name, env, scope) {
  if (Object.prototype.hasOwnProperty.call(scope, name)) return scope[name];
  if (Object.prototype.hasOwnProperty.call(env, name)) return env[name];
  throw new Error(`program referenced unknown variable: ${name}`);
}

function expandTemplate(template, env, scope) {
  return template.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, name) => (
    String(valueFromScope(name, env, scope))
  ));
}

function declaredReadMatches(declared, actual) {
  const start = declared.indexOf("${");
  if (start < 0) return declared === actual;
  const end = declared.indexOf("}", start + 2);
  if (end < 0) return false;
  const prefix = declared.slice(0, start);
  const suffix = declared.slice(end + 1);
  return actual.startsWith(prefix)
    && actual.endsWith(suffix)
    && actual.length > prefix.length + suffix.length;
}

function numeric(value, label) {
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`${label} must be finite`);
  return result;
}

class JsonCognitiveProgramInterpreter {
  execute(program, { attention }) {
    const checked = validateProgram(program);
    if (!attention || typeof attention.read !== "function") {
      throw new TypeError("program execution needs an attention reader");
    }
    const reads = [];
    const env = {};
    const secureRead = (path) => {
      if (!checked.requiredReads.some((declared) => declaredReadMatches(declared, path))) {
        throw new Error(`program attempted undeclared attention read: ${path}`);
      }
      const value = attention.read(path);
      reads.push(path);
      return value;
    };

    const evaluate = (expression, scope = {}) => {
      if (expression === null || typeof expression !== "object") return expression;
      if (Array.isArray(expression)) return expression.map((row) => evaluate(row, scope));
      if (!Object.prototype.hasOwnProperty.call(expression, "op")) {
        return Object.fromEntries(
          Object.entries(expression).map(([key, row]) => [key, evaluate(row, scope)]),
        );
      }
      switch (expression.op) {
        case "read":
          return secureRead(expression.path);
        case "read_template":
          return secureRead(expandTemplate(expression.template, env, scope));
        case "var":
          return structuredClone(valueFromScope(expression.name, env, scope));
        case "get": {
          const source = evaluate(expression.from, scope);
          if (source === null || typeof source !== "object") {
            throw new Error(`get.${expression.key} needs an object`);
          }
          return structuredClone(source[expression.key]);
        }
        case "map": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items)) throw new Error("map items must be an array");
          return items.map((item) => evaluate(expression.value, {
            ...scope,
            [expression.as]: item,
          }));
        }
        case "filter": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items)) throw new Error("filter items must be an array");
          return items.filter((item) => Boolean(evaluate(expression.where, {
            ...scope,
            [expression.as]: item,
          })));
        }
        case "length": {
          const value = evaluate(expression.value, scope);
          if (!Array.isArray(value) && typeof value !== "string") {
            throw new Error("length needs an array or string");
          }
          return value.length;
        }
        case "eq":
          return evaluate(expression.left, scope) === evaluate(expression.right, scope);
        case "not":
          return !Boolean(evaluate(expression.value, scope));
        case "and":
          return expression.values.every((row) => Boolean(evaluate(row, scope)));
        case "or":
          return expression.values.some((row) => Boolean(evaluate(row, scope)));
        case "lte":
          return numeric(evaluate(expression.left, scope), "lte left")
            <= numeric(evaluate(expression.right, scope), "lte right");
        case "gte":
          return numeric(evaluate(expression.left, scope), "gte left")
            >= numeric(evaluate(expression.right, scope), "gte right");
        case "contains": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items) && typeof items !== "string") {
            throw new Error("contains needs an array or string");
          }
          return items.includes(evaluate(expression.value, scope));
        }
        case "add":
          return expression.values.reduce(
            (sum, row) => sum + numeric(evaluate(row, scope), "add operand"),
            0,
          );
        case "subtract":
          return numeric(evaluate(expression.left, scope), "subtract left")
            - numeric(evaluate(expression.right, scope), "subtract right");
        case "min":
        case "max": {
          const evaluated = evaluate(expression.values, scope);
          const values = Array.isArray(evaluated) ? evaluated : [evaluated];
          if (values.length === 0) throw new Error(`${expression.op} needs at least one operand`);
          const numbers = values.map((row) => numeric(row, `${expression.op} operand`));
          return expression.op === "min" ? Math.min(...numbers) : Math.max(...numbers);
        }
        case "sum": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items)) throw new Error("sum items must be an array");
          return items.reduce((sum, row) => sum + numeric(row, "sum item"), 0);
        }
        case "pluck": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items)) throw new Error("pluck items must be an array");
          return items.map((row) => row?.[expression.key]);
        }
        case "first": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items)) throw new Error("first items must be an array");
          return items.length > 0 ? structuredClone(items[0]) : null;
        }
        case "unique": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items)) throw new Error("unique items must be an array");
          return [...new Set(items)];
        }
        case "concat": {
          const items = evaluate(expression.items, scope);
          if (!Array.isArray(items) || items.some((row) => !Array.isArray(row))) {
            throw new Error("concat items must evaluate to an array of arrays");
          }
          return items.flat();
        }
        case "if":
          return evaluate(expression.condition, scope)
            ? evaluate(expression.then, scope)
            : evaluate(expression.else, scope);
        default:
          throw new Error(`unsupported program op: ${expression.op}`);
      }
    };

    for (const [name, expression] of Object.entries(checked.bindings)) {
      env[name] = evaluate(expression);
    }
    const fields = evaluate(checked.output.fields);
    if (checked.output.kind === "set_movement_amount") {
      if (!Number.isFinite(fields.amount) || fields.amount < 0) {
        throw new Error("movement amount must be finite and non-negative");
      }
    } else if (checked.output.kind === "set_noticed_room_state") {
      if (!Array.isArray(fields.occupiedCells) || !Array.isArray(fields.missingCells)) {
        throw new Error("room patch cell fields must be arrays");
      }
      if (typeof fields.complete !== "boolean") throw new Error("room patch complete must be boolean");
      if (fields.roomValue !== null && !Number.isFinite(fields.roomValue)) {
        throw new Error("roomValue must be finite or null");
      }
      if (!Number.isFinite(fields.energyCost)) throw new Error("energyCost must be finite");
      if (!["ready_but_not_resolved", "setup_only_incomplete", "no_room_phase_output"]
        .includes(fields.roomPhaseStatus)) {
        throw new Error(`invalid room phase status: ${fields.roomPhaseStatus}`);
      }
    }
    validateRuntimePatch(checked.output.kind, fields);
    return {
      bindings: structuredClone(env),
      patch: { kind: checked.output.kind, ...fields },
      reads,
    };
  }
}

function validateRuntimePatch(kind, fields) {
  const finiteFields = {
    move_mothership: ["fromRow", "toRow", "delta"], city_contact: ["damageDelta"],
    room_payment_choice: ["energyCost"], energy_room_result: ["energyBefore", "gain", "energyAfter"],
    fighter_room_result: ["roomValue"], research_room_choice: ["budget"],
    excavation_placement_legality: ["dieValue", "pathDistance"], excavation_result: ["energyDelta"],
    final_research_constraint: ["targetCost", "requiresMinimumCells"],
    mothership_phase_descent: ["fromRow", "toRow"], mothership_row_action: ["amount"],
  };
  for (const name of finiteFields[kind] ?? []) {
    if (!Number.isFinite(fields[name])) throw new Error(`${kind}.${name} must be finite`);
  }
  const arrayFields = {
    randomize_unplaced_dice: ["dieIds"], fighter_room_result: ["eligibleShipIds"],
    research_room_choice: ["continuousCosts"], excavation_result: ["newlyExcavatedIndices"],
    research_order_choice: ["rooms", "continuousCosts"], mothership_phase_descent: ["collectedShipIds"],
    spawn_candidates: ["candidateDropPointIds"],
  };
  for (const name of arrayFields[kind] ?? []) {
    if (!Array.isArray(fields[name])) throw new Error(`${kind}.${name} must be an array`);
  }
  const booleanFields = {
    room_payment_choice: ["canPay"], energy_room_result: ["removeDie"], fighter_room_result: ["removeDie"],
    excavation_placement_legality: ["otherUnexcavatedAlreadyUsed", "legal"],
    research_order_choice: ["combineValues"], final_research_constraint: ["currentRoomEligible"],
    terminal_check: ["terminal"],
  };
  for (const name of booleanFields[kind] ?? []) {
    if (typeof fields[name] !== "boolean") throw new Error(`${kind}.${name} must be boolean`);
  }
  if (kind === "terminal_check" && !["win", "loss", "ongoing"].includes(fields.result)) {
    throw new Error(`invalid terminal result: ${fields.result}`);
  }
  if (Object.prototype.hasOwnProperty.call(fields, "stopKind")
    && !["automatic", "choice", "random", "complete"].includes(fields.stopKind)) {
    throw new Error(`invalid stopKind: ${fields.stopKind}`);
  }
}

function relationMatches(relation, metadata) {
  if (relation.roomTypes && !relation.roomTypes.includes(metadata.roomType)) return false;
  if (relation.excludedRoomTypes?.includes(metadata.roomType)) return false;
  if (relation.cellCount !== undefined && relation.cellCount !== metadata.cellCount) return false;
  if (
    relation.minimumCellCount !== undefined
    && metadata.cellCount < relation.minimumCellCount
  ) return false;
  return true;
}

function selectProgram(library, { qKind, sourceRuleId, metadata }) {
  const candidates = library.list({ latestOnly: true })
    .filter((row) => row.program.trigger.qKind === qKind)
    .filter((row) => row.program.sourceRuleIds.includes(sourceRuleId))
    .filter((row) => relationMatches(row.program.trigger.relation, metadata));
  if (candidates.length !== 1) {
    return {
      candidates: candidates.map((row) => row.program.programId),
      selected: null,
    };
  }
  return { candidates: [candidates[0].program.programId], selected: candidates[0] };
}

module.exports = {
  JsonCognitiveProgramInterpreter,
  relationMatches,
  selectProgram,
};
