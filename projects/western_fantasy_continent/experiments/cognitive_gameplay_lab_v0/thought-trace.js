"use strict";

const { appendTrace, clone, createTrace, uniqueStrings } = require("./contracts");

function recordThought(traceInput, eventInput) {
  const trace = appendTrace(traceInput, eventInput);
  validateTraceCausality(trace, eventInput.initialEvidenceIds || []);
  return trace;
}

function validateTraceCausality(traceInput, initialEvidenceIds = []) {
  const trace = createTrace(traceInput);
  const available = new Set(uniqueStrings(initialEvidenceIds));
  let expectedSequence = 1;
  for (const event of trace.events) {
    if (event.sequence !== expectedSequence) throw new Error(`trace sequence gap at ${event.sequence}`);
    for (const ref of event.inputRefs || []) {
      if (!available.has(ref)) throw new Error(`trace input ${ref} was not produced before event ${event.sequence}`);
    }
    for (const ref of event.outputRefs || []) {
      if (available.has(ref)) throw new Error(`trace output ${ref} already exists before event ${event.sequence}`);
      available.add(ref);
    }
    expectedSequence += 1;
  }
  return { valid: true, availableRefs: [...available] };
}

function traceSummary(traceInput) {
  const trace = createTrace(traceInput);
  return trace.events.map((event) => ({
    sequence: event.sequence,
    cycle: event.cycle,
    module: event.module,
    type: event.type,
    inputs: clone(event.inputRefs),
    outputs: clone(event.outputRefs),
    attentionCost: event.attentionCost,
  }));
}

module.exports = { recordThought, traceSummary, validateTraceCausality };
