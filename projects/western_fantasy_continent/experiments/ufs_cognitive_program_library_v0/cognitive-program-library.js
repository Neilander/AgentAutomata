"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { validateProgram } = require("./program-validator");

const LIBRARY_SCHEMA = "ufs_cognitive_program_library_v0";

class CognitiveProgramLibrary {
  constructor({ filePath = null, sourceRules = {} } = {}) {
    this.filePath = filePath;
    this.sourceRules = structuredClone(sourceRules);
    this.entries = new Map();
    if (filePath && fs.existsSync(filePath)) this.load(filePath);
  }

  load(filePath = this.filePath) {
    if (!filePath) throw new Error("library load needs a file path");
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    if (payload.schema !== LIBRARY_SCHEMA) throw new Error(`unsupported library schema: ${payload.schema}`);
    this.entries.clear();
    for (const entry of payload.entries) {
      if (this.entries.has(entry.programId)) throw new Error(`duplicate library program: ${entry.programId}`);
      if (!Array.isArray(entry.revisions) || entry.revisions.length === 0) {
        throw new Error(`library entry has no revisions: ${entry.programId}`);
      }
      const revisions = entry.revisions.map((row, index) => {
        const program = validateProgram(row.program, { sourceRules: this.sourceRules });
        if (program.programId !== entry.programId || program.revision !== index + 1) {
          throw new Error(`non-contiguous revision history: ${entry.programId}`);
        }
        return { program, provenance: structuredClone(row.provenance) };
      });
      this.entries.set(entry.programId, revisions);
    }
    this.filePath = filePath;
    return this;
  }

  store(program, provenance = {}) {
    const checked = validateProgram(program, { sourceRules: this.sourceRules });
    if (checked.revision !== 1) throw new Error("new programs must start at revision 1");
    if (this.entries.has(checked.programId)) throw new Error(`program already exists: ${checked.programId}`);
    this.entries.set(checked.programId, [{ program: checked, provenance: structuredClone(provenance) }]);
    return this.get(checked.programId);
  }

  get(programId, { revision = "latest" } = {}) {
    const rows = this.entries.get(programId);
    if (!rows) return null;
    const row = revision === "latest" ? rows.at(-1) : rows[Number(revision) - 1];
    return row ? structuredClone(row) : null;
  }

  revise(programId, nextProgram, provenance = {}) {
    const rows = this.entries.get(programId);
    if (!rows) throw new Error(`cannot revise unknown program: ${programId}`);
    const checked = validateProgram(nextProgram, { sourceRules: this.sourceRules });
    const expectedRevision = rows.length + 1;
    if (checked.programId !== programId || checked.revision !== expectedRevision) {
      throw new Error(`revision must be ${expectedRevision} for ${programId}`);
    }
    rows.push({ program: checked, provenance: structuredClone(provenance) });
    return this.get(programId);
  }

  list({ latestOnly = true } = {}) {
    return [...this.entries.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .flatMap(([programId, rows]) => (
        latestOnly
          ? [{ programId, ...structuredClone(rows.at(-1)) }]
          : rows.map((row) => ({ programId, ...structuredClone(row) }))
      ));
  }

  save(filePath = this.filePath) {
    if (!filePath) throw new Error("library save needs a file path");
    const payload = {
      schema: LIBRARY_SCHEMA,
      entries: [...this.entries.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([programId, revisions]) => ({
          programId,
          revisions: structuredClone(revisions),
        })),
    };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    this.filePath = filePath;
    return filePath;
  }
}

module.exports = {
  CognitiveProgramLibrary,
  LIBRARY_SCHEMA,
};
