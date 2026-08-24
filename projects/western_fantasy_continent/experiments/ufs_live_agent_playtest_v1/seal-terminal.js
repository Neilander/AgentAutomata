"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = __dirname;
const runtime = path.join(root, "runtime");
const response = JSON.parse(fs.readFileSync(path.join(runtime, "current-response.json"), "utf8"));
if (!["complete", "unknown", "attention_stop"].includes(response.status)) {
  throw new Error(`refusing to seal non-terminal response: ${response.status}`);
}
for (const [name, value] of [
  ["final-response.json", response],
  ["final-checkpoint.json", response.checkpoint],
]) {
  const target = path.join(runtime, name);
  if (fs.existsSync(target)) throw new Error(`refusing to overwrite ${target}`);
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`);
}
process.stdout.write(`${response.status}:${response.reason}\n`);

