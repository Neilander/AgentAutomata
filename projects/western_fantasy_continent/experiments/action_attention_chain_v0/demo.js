"use strict";

const { runActionAttentionChain } = require("./action-attention-runtime");
const { cardEventCase, chessRookCase, ufsPlacementCase } = require("./cases");

function compact(run) {
  return {
    actions: run.trace.map((row) => ({
      index: row.index,
      action: row.action.id || row.action.type,
      worldChanged: row.worldChanged,
      rules: row.activatedRules.map((rule) => ({
        id: rule.ruleId,
        attentionUnits: rule.attentionRegion?.unitIds || [],
        targets: rule.matches.map((match) => match.entityId),
        glued: rule.generatedActions.map((action) => action.id || action.type),
      })),
    })),
    skippedRules: run.skippedRules,
    terminal: run.terminal,
  };
}

const results = {
  chess: compact(runActionAttentionChain(chessRookCase())),
  ufsFull: compact(runActionAttentionChain(ufsPlacementCase())),
  ufsMissingSilentModifier: compact(runActionAttentionChain({
    ...ufsPlacementCase(),
    disabledRuleIds: ["aa-reduces-movement"],
  })),
  card: compact(runActionAttentionChain(cardEventCase())),
};

console.log(JSON.stringify(results, null, 2));
