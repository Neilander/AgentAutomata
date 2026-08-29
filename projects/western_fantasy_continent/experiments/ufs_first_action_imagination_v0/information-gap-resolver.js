"use strict";

function clone(value) {
  return structuredClone(value);
}

function words(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .flatMap((row) => row.split(/[.:/]+/))
    .filter((row) => row.length > 1 && !["row", "value", "current", "location"].includes(row));
}

function knowledgeMatches(record, slot) {
  if (record?.query?.slot === slot) return true;
  if (record?.query?.anyPublicSlot === true) return true;
  if (record?.query?.slotPrefix && slot.startsWith(record.query.slotPrefix)) return true;
  return false;
}

function locatorPath(locator, slot) {
  if (!locator) return null;
  if (locator.path === "$slot") return slot;
  return locator.path || null;
}

function unknownInformation(slot, reason = "knowledge_and_targeted_exploration_missed") {
  return {
    schema: "unknown_information_v0",
    slot,
    known: false,
    reason,
  };
}

function normalizeStateItems(facts, stateItems, queryablePaths) {
  const queryable = queryablePaths == null ? null : new Set(queryablePaths);
  const factItems = facts.map((fact) => ({
    id: `fact:${fact.path}`,
    tags: [...new Set([fact.path, ...words(fact.path)])],
    values: { [fact.path]: clone(fact.value) },
    accessible: queryable == null || queryable.has(fact.path),
  }));
  return [...factItems, ...(stateItems || []).map((item) => ({
    id: item.id,
    tags: [...new Set(item.tags || [])],
    values: clone(item.values || {}),
    accessible: item.accessible !== false,
  }))];
}

class InformationGapResolver {
  constructor({ knowledge = [], explorationBudget = 6 } = {}) {
    if (!Number.isInteger(explorationBudget) || explorationBudget < 1) {
      throw new RangeError("explorationBudget must be a positive integer");
    }
    this.knowledge = clone(knowledge);
    this.explorationBudget = explorationBudget;
  }

  resolve({ missingSlots, facts = [], queryablePaths = null, stateItems = [], explorationHints = {} }) {
    if (!Array.isArray(missingSlots)) throw new TypeError("missingSlots must be an array");
    const items = normalizeStateItems(facts, stateItems, queryablePaths);
    const factByPath = new Map(facts.map((fact) => [fact.path, fact]));
    const accessiblePaths = new Set(items
      .filter((item) => item.accessible)
      .flatMap((item) => Object.keys(item.values)));
    const resolved = [];
    const confusions = [];
    const attempts = [];

    for (const slot of [...new Set(missingSlots)]) {
      const attempt = {
        slot,
        knowledgeQuery: { attempted: true, result: "miss", knowledgeId: null },
        targetedLookup: { attempted: false, target: null, result: "not_attempted" },
        exploration: { attempted: false, targetTerms: [], examinedItemIds: [], result: "not_attempted" },
      };
      const knowledge = this.knowledge.find((record) => knowledgeMatches(record, slot)) || null;
      let value;
      let source = null;

      if (knowledge) {
        attempt.knowledgeQuery.knowledgeId = knowledge.id;
        if (Object.prototype.hasOwnProperty.call(knowledge, "answer")) {
          attempt.knowledgeQuery.result = "answer";
          value = clone(knowledge.answer);
          source = "knowledge_answer";
        } else {
          const path = locatorPath(knowledge.locator, slot);
          attempt.knowledgeQuery.result = path ? "locator" : "miss";
          if (path) {
            attempt.targetedLookup = { attempted: true, target: path, result: "miss" };
            if (factByPath.has(path) && accessiblePaths.has(path)) {
              value = clone(factByPath.get(path).value);
              source = "knowledge_directed_lookup";
              attempt.targetedLookup.result = "found";
            }
          }
        }
      }

      if (source == null) {
        const targetTerms = [...new Set(explorationHints[slot] || words(slot))];
        attempt.exploration.attempted = true;
        attempt.exploration.targetTerms = targetTerms;
        const candidates = items.filter((item) => {
          if (!item.accessible) return false;
          if (Object.prototype.hasOwnProperty.call(item.values, slot)) return true;
          const itemWords = new Set([...item.tags.flatMap(words), ...words(item.id)]);
          return targetTerms.length > 0 && targetTerms.every((term) => itemWords.has(term));
        }).slice(0, this.explorationBudget);
        attempt.exploration.examinedItemIds = candidates.map((item) => item.id);
        const found = candidates.find((item) => Object.prototype.hasOwnProperty.call(item.values, slot));
        if (found) {
          value = clone(found.values[slot]);
          source = "targeted_state_exploration";
          attempt.exploration.result = "found";
        } else {
          attempt.exploration.result = "miss";
        }
      }

      if (source) {
        resolved.push({ slot, value, source });
      } else {
        const unknown = unknownInformation(slot);
        confusions.push({
          slot,
          status: "confused",
          knowledgeQuery: "miss",
          targetedExploration: "miss",
          value: unknown,
        });
      }
      attempts.push(attempt);
    }

    return {
      schema: "information_gap_resolution_v0",
      resolved,
      confusions,
      attempts,
      complete: confusions.length === 0,
    };
  }
}

const PUBLIC_SLOT_LOCATOR_KNOWLEDGE = Object.freeze([{
  id: "knowledge:public-slot-path-locates-visible-state",
  query: { anyPublicSlot: true },
  locator: { path: "$slot" },
}]);

module.exports = {
  InformationGapResolver,
  PUBLIC_SLOT_LOCATOR_KNOWLEDGE,
  unknownInformation,
};
