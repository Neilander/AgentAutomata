"use strict";

const path = require("node:path");
const { CognitiveProgramLibrary } = require("./cognitive-program-library");
const { SOURCE_RULES } = require("./source-catalog");

const DEFAULT_LIBRARY_PATH = path.resolve(__dirname, "library/program-library.json");

function loadDefaultLibrary() {
  return new CognitiveProgramLibrary({
    filePath: DEFAULT_LIBRARY_PATH,
    sourceRules: SOURCE_RULES,
  });
}

module.exports = {
  DEFAULT_LIBRARY_PATH,
  loadDefaultLibrary,
};
