"use strict";

const { loadDefaultLibrary } = require("./default-library");
const { JsonCognitiveProgramInterpreter, selectProgram } = require("./json-program-interpreter");

function executeActivatedRule({ qKind, sourceRuleId, metadata = {}, attention }) {
  const library = loadDefaultLibrary();
  const selection = selectProgram(library, { qKind, sourceRuleId, metadata });
  if (!selection.selected) {
    return {
      status: selection.candidates.length === 0 ? "unknown" : "ambiguous",
      candidates: selection.candidates,
      patch: null,
      reads: [],
    };
  }
  const executed = new JsonCognitiveProgramInterpreter().execute(selection.selected.program, { attention });
  return {
    status: "executed",
    programId: selection.selected.program.programId,
    revision: selection.selected.program.revision,
    provenance: selection.selected.provenance,
    ...executed,
  };
}

module.exports = { executeActivatedRule };
