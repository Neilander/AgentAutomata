const fs = require("fs");
const path = require("path");
const { loadSkillAssetSource } = require("./skill-asset-source");

const OUT_FILE = path.join(__dirname, "skill-assets.js");

function run() {
  const assets = loadSkillAssetSource();
  const body = JSON.stringify(assets, null, 2);
  const content = [
    "const GAME_SKILL_ASSETS = (() => {",
    `  return ${indent(body, 2)};`,
    "})();",
    "",
    'if (typeof window !== "undefined") window.GAME_SKILL_ASSETS = GAME_SKILL_ASSETS;',
    'if (typeof module !== "undefined") module.exports = GAME_SKILL_ASSETS;',
    "",
  ].join("\n");
  fs.writeFileSync(OUT_FILE, content, "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

function indent(text, spaces) {
  const pad = " ".repeat(spaces);
  return text.split("\n").map((line, index) => (index === 0 ? line : `${pad}${line}`)).join("\n");
}

if (require.main === module) {
  run();
}

module.exports = { run };
