const fs = require("fs");
const path = require("path");
const CORE = require("../map_progression_lab/map-progression-cognition-core");

function load(file) {
  return CORE.normalizeState(JSON.parse(fs.readFileSync(file, "utf8")));
}

function save(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

function run(argv) {
  const [command, sessionFile, value] = argv;
  if (!command || !sessionFile) throw new Error("Usage: node map-cognition-session.js <new|observe|act> <session.json> [seed|action]");
  const absolute = path.resolve(sessionFile);
  if (command === "new") {
    const state = CORE.initialState(value || path.basename(sessionFile, ".json"));
    save(absolute, state);
    return { ok: true, observation: CORE.observe(state) };
  }
  const state = load(absolute);
  if (command === "observe") return { ok: true, observation: CORE.observe(state) };
  if (command === "act") {
    const result = CORE.applyAction(state, value);
    if (result.ok) save(absolute, result.state);
    return { ok: result.ok, event: result.event, error: result.error, observation: result.observation };
  }
  throw new Error(`Unknown command: ${command}`);
}

if (require.main === module) {
  try {
    console.log(JSON.stringify(run(process.argv.slice(2)), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { run };
