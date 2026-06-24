const fs = require("fs");
const path = require("path");

const ASSET_ROOT = path.join(__dirname, "skill_assets");

function loadSkillAssetSource() {
  const metadata = readJson(path.join(ASSET_ROOT, "metadata.json"));
  return {
    version: metadata.version,
    TYPE: metadata.TYPE,
    roleKits: readCollection("roles"),
    skills: readCollection("skills"),
    presets: readCollection("presets"),
    berserkerModel: readJson(path.join(ASSET_ROOT, "models", "berserker.json")),
  };
}

function readCollection(folderName) {
  const dir = path.join(ASSET_ROOT, folderName);
  const entries = {};
  for (const fileName of fs.readdirSync(dir).filter((name) => name.endsWith(".json")).sort()) {
    const id = path.basename(fileName, ".json");
    entries[id] = readJson(path.join(dir, fileName));
  }
  return entries;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

module.exports = { ASSET_ROOT, loadSkillAssetSource };
