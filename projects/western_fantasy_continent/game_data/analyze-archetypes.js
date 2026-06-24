const fs = require("fs");
const path = require("path");
const { loadSkillAssetSource } = require("./skill-asset-source");

const OUT_FILE = path.join(__dirname, "..", "design", "archetype-analysis-report.md");

const EFFECT_TAGS = {
  arrowStorm: ["damage", "area", "backline"],
  berserkerRoar: ["sustain", "haste", "basicWindow", "deathPrevent"],
  buffCarryPower: ["support", "power", "carry"],
  burningEnemies: ["damage", "burn", "area", "statusPayoff"],
  burnTarget: ["burn", "dot", "status"],
  crescendo: ["support", "haste", "power", "teamWindow"],
  enemyTimers: ["control", "slow"],
  grandMixture: ["damage", "area", "statusPayoff"],
  healLowestAlly: ["heal", "sustain"],
  hitEnemies: ["damage", "area"],
  hitLowestEnemy: ["damage", "execute", "focus"],
  hitMarkedTarget: ["damage", "markPayoff", "focus"],
  hitTarget: ["damage", "singleTarget"],
  hitTargetWithStatus: ["damage", "statusPayoff"],
  lowestAllyTimer: ["support", "sustain"],
  markTarget: ["mark", "setup", "focus"],
  meteorRain: ["damage", "burn", "area", "burst"],
  plagueOffering: ["damage", "poison", "area", "dotPayoff", "burst"],
  poisonEnemies: ["poison", "dot", "area", "status"],
  poisonTarget: ["poison", "dot", "status"],
  selfRawDamage: ["risk", "selfDamage"],
  shieldLowestAlly: ["shield", "sustain"],
  targetTimer: ["control", "slow"],
  teamHeal: ["heal", "sustain", "team"],
  teamShield: ["shield", "sustain", "team"],
  teamTimer: ["support", "teamWindow"],
  timer: ["selfWindow"],
};

const PRESET_EXPECTATIONS = {
  poisonBloom: { wants: ["poison", "dot", "dotPayoff", "sustain"], watch: ["burst", "execute"] },
  fireBurst: { wants: ["burn", "area", "burst"], watch: ["shield", "heal"] },
  crownCarry: { wants: ["support", "carry", "basicWindow", "haste"], watch: ["execute"] },
  ironWall: { wants: ["shield", "heal", "sustain"], watch: ["poison", "dotPayoff"] },
  bloodRage: { wants: ["basicWindow", "haste", "sustain", "deathPrevent"], watch: ["execute", "burst"] },
  lightningTempo: { wants: ["mark", "markPayoff", "haste", "focus"], watch: ["control", "execute"] },
  frostControl: { wants: ["control", "slow", "statusPayoff"], watch: ["backline", "burst"] },
  holySustain: { wants: ["heal", "shield", "sustain"], watch: ["poison", "dotPayoff"] },
  shadowExecute: { wants: ["execute", "focus", "risk"], watch: ["shield", "deathPrevent"] },
  alchemyChaos: { wants: ["poison", "burn", "statusPayoff", "area"], watch: ["execute", "burst"] },
};

function run() {
  const assets = loadSkillAssetSource();
  const rows = Object.entries(assets.presets).map(([id, preset]) => analyzePreset(id, preset, assets));
  const markdown = renderMarkdown(rows);
  fs.writeFileSync(OUT_FILE, markdown, "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

function analyzePreset(id, preset, assets) {
  const skillIds = unique(preset.team.flatMap((unit) => [unit.small1, unit.small2, unit.passive, unit.ultimate]));
  const roleIds = preset.team.map((unit) => unit.role);
  const tags = {};
  const skillTypes = {};
  const skillRows = skillIds.map((skillId) => {
    const skill = assets.skills[skillId];
    skillTypes[skill.type] = (skillTypes[skill.type] || 0) + 1;
    const effectTags = unique((skill.effects || []).flatMap((effect) => EFFECT_TAGS[effect.kind] || [`unknown:${effect.kind}`]));
    for (const tag of effectTags) tags[tag] = (tags[tag] || 0) + 1;
    return { id: skillId, name: skill.name, type: skill.type, role: skill.role, tags: effectTags };
  });
  const expectation = PRESET_EXPECTATIONS[id] || { wants: [], watch: [] };
  const missingWants = expectation.wants.filter((tag) => !tags[tag]);
  const watchHits = expectation.watch.filter((tag) => tags[tag]);
  const status = missingWants.length ? "needs review" : "passes intent";
  return { id, preset, roleIds, skillIds, skillTypes, tags, skillRows, expectation, missingWants, watchHits, status };
}

function renderMarkdown(rows) {
  const lines = [
    "# Archetype Analysis Report",
    "",
    "Generated from `game_data/skill_assets/**/*.json`.",
    "",
    "This is an asset-level check. It verifies that each preset contains the mechanics its design says it needs; combat signal simulation is still required for numeric balance.",
    "",
    "## Matrix",
    "",
    "| Preset | Status | Roles | Unique Skills | Main Tags | Missing Intent Tags | Counter Tags Present |",
    "| --- | --- | --- | ---: | --- | --- | --- |",
  ];
  for (const row of rows) {
    lines.push(`| \`${row.id}\` ${row.preset.name} | ${row.status} | ${row.roleIds.join(", ")} | ${row.skillIds.length} | ${topTags(row.tags).join(", ")} | ${empty(row.missingWants)} | ${empty(row.watchHits)} |`);
  }
  lines.push("", "## Details", "");
  for (const row of rows) {
    lines.push(`### \`${row.id}\` ${row.preset.name}`, "");
    lines.push(`- Fantasy: ${row.preset.desc}`);
    lines.push(`- Expected tags: ${row.expectation.wants.join(", ") || "none"}`);
    lines.push(`- Watch tags: ${row.expectation.watch.join(", ") || "none"}`);
    lines.push(`- Skill mix: ${Object.entries(row.skillTypes).map(([type, count]) => `${type} ${count}`).join(", ")}`);
    lines.push(`- Result: ${row.status}${row.missingWants.length ? `; missing ${row.missingWants.join(", ")}` : ""}`);
    lines.push("");
    lines.push("| Skill | Type | Role | Tags |");
    lines.push("| --- | --- | --- | --- |");
    for (const skill of row.skillRows) {
      lines.push(`| \`${skill.id}\` ${skill.name} | ${skill.type} | ${skill.role} | ${skill.tags.join(", ") || "none"} |`);
    }
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

function topTags(tags) {
  return Object.entries(tags).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6).map(([tag, count]) => `${tag}(${count})`);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function empty(items) {
  return items.length ? items.join(", ") : "-";
}

if (require.main === module) {
  run();
}

module.exports = { analyzePreset, run };
