"use strict";

function clone(value) {
  return structuredClone(value);
}

function compactAttentionResponse(response) {
  const compact = clone(response);
  delete compact.noticedItems;
  if (compact.attention) {
    delete compact.attention.carryoverAppliedItemIds;
    delete compact.attention.traceBefore;
    delete compact.attention.traceAfter;
    compact.attention.detail = "summary";
  }
  return compact;
}

module.exports = { compactAttentionResponse };
