const assertNode = require("assert");
const GENERATED_SKILL_ASSETS = require("./skill-assets");
const { loadSkillAssetSource } = require("./skill-asset-source");

const SKILL_ASSETS = loadSkillAssetSource();

const KNOWN_EFFECT_KINDS = new Set([
  "arrowStorm",
  "basicAttackMark",
  "basicAttackHiddenExtend",
  "basicAttackRage",
  "basicAttackSelfShield",
  "basicAttackPoison",
  "berserkerRoar",
  "blinkBacklineStrike",
  "buffCarryPower",
  "burningEnemies",
  "burnTarget",
  "crescendo",
  "counterOnDamageTaken",
  "carryTimer",
  "chargeToTarget",
  "cleanseStatusAlly",
  "enemyTimers",
  "fadeOnLowHp",
  "grandMixture",
  "healLowestAlly",
  "hitBacklineLowestEnemy",
  "hitEnemies",
  "hitHighestSkillHasteEnemyDelay",
  "hitLowestEnemy",
  "hitMarkedTarget",
  "hitTarget",
  "hitTargetWithStatus",
  "lowestAllyTimer",
  "markTarget",
  "markHighestPowerEnemy",
  "meteorRain",
  "passiveDamageAmp",
  "passiveDotAmp",
  "dotResistOnDotTaken",
  "passiveHealAmp",
  "passiveShieldAmp",
  "passiveStat",
  "plagueOffering",
  "poisonEnemies",
  "poisonTarget",
  "rageRelease",
  "selfRawDamage",
  "shadowStepStrike",
  "shieldBreakEnemies",
  "shieldSourceOnDamageType",
  "shieldLowestAlly",
  "shieldCarryAlly",
  "targetTimer",
  "teamHeal",
  "teamRetaliation",
  "teamShield",
  "teamTimer",
  "timer",
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function validateRoleKits() {
  for (const [roleId, role] of Object.entries(SKILL_ASSETS.roleKits || {})) {
    assert(role.name, `${roleId} missing name`);
    assert(role.role, `${roleId} missing role`);
    assert(role.fantasy, `${roleId} missing fantasy`);
    assert(Number.isFinite(role.hp) && role.hp > 0, `${roleId}.hp must be positive`);
    assert(Number.isFinite(role.power) && role.power > 0, `${roleId}.power must be positive`);
    assert(Number.isFinite(role.armor), `${roleId}.armor must be numeric`);
    assert(Number.isFinite(role.range) && role.range > 0, `${roleId}.range must be positive`);
    assert(role.kit?.small1 && role.kit?.small2 && role.kit?.passive && role.kit?.ultimate, `${roleId} kit must include 2 small skills, passive, ultimate`);
  }
}

function validateSkills() {
  for (const [skillId, skill] of Object.entries(SKILL_ASSETS.skills || {})) {
    assert(skill.name, `${skillId} missing name`);
    assert(skill.role, `${skillId} missing role`);
    assert(skill.type, `${skillId} missing type`);
    assert(skill.icon, `${skillId} missing icon`);
    assert(skill.desc, `${skillId} missing desc`);
    assert(Array.isArray(skill.effects), `${skillId}.effects must be an array`);
    assert(Number.isFinite(skill.cooldown) && skill.cooldown >= 0, `${skillId}.cooldown must be non-negative`);
    if (skill.openingCooldown !== undefined) assert(Number.isFinite(skill.openingCooldown) && skill.openingCooldown >= 0, `${skillId}.openingCooldown must be non-negative`);
    for (const effect of skill.effects) {
      assert(KNOWN_EFFECT_KINDS.has(effect.kind), `${skillId} uses unknown effect kind: ${effect.kind}`);
    }
  }
}

function validateKitReferences() {
  const skills = SKILL_ASSETS.skills || {};
  for (const [roleId, role] of Object.entries(SKILL_ASSETS.roleKits || {})) {
    for (const key of [role.kit.small1, role.kit.small2, role.kit.passive, role.kit.ultimate]) {
      assert(skills[key], `${roleId} kit references missing skill: ${key}`);
    }
  }
}

function validatePresets() {
  const skills = SKILL_ASSETS.skills || {};
  const roles = SKILL_ASSETS.roleKits || {};
  for (const [presetId, preset] of Object.entries(SKILL_ASSETS.presets || {})) {
    assert(preset.name, `${presetId} missing name`);
    assert(preset.desc, `${presetId} missing desc`);
    assert(preset.design, `${presetId} missing design metadata`);
    assert(preset.design.fantasy, `${presetId}.design.fantasy missing`);
    assert(preset.design.primaryOutput, `${presetId}.design.primaryOutput missing`);
    for (const field of ["desiredTags", "watchTags", "strongMatchups", "weakMatchups", "validationOpponents", "curves", "signalAcceptance", "failureBoundaries"]) {
      assert(Array.isArray(preset.design[field]), `${presetId}.design.${field} must be an array`);
    }
    for (const field of ["start", "transition", "payoff", "reset"]) {
      assert(preset.design.experience?.[field], `${presetId}.design.experience.${field} missing`);
    }
    for (const opponent of [...preset.design.strongMatchups, ...preset.design.weakMatchups, ...preset.design.validationOpponents]) {
      assert(SKILL_ASSETS.presets[opponent], `${presetId} references missing design opponent: ${opponent}`);
      assert(opponent !== presetId, `${presetId} cannot reference itself as a design opponent`);
    }
    for (const rule of [...preset.design.curves, ...preset.design.signalAcceptance, ...preset.design.failureBoundaries]) {
      assert(rule.metric, `${presetId} signal rule missing metric`);
      assert([">=", "<=", ">", "<"].includes(rule.op), `${presetId}.${rule.metric} uses unsupported operator: ${rule.op}`);
      assert(Number.isFinite(rule.value), `${presetId}.${rule.metric} value must be numeric`);
    }
    assert(Array.isArray(preset.team) && preset.team.length === 4, `${presetId}.team must include 4 units`);
    for (const [index, unit] of preset.team.entries()) {
      assert(roles[unit.role], `${presetId}[${index}] references missing role: ${unit.role}`);
      for (const key of [unit.small1, unit.small2, unit.passive, unit.ultimate]) {
        assert(skills[key], `${presetId}[${index}] references missing skill: ${key}`);
      }
    }
  }
}

function validateBerserkerModel() {
  const model = SKILL_ASSETS.berserkerModel;
  assert(model, "berserkerModel missing");
  assert(Number.isFinite(model.basicAttackCooldown) && model.basicAttackCooldown > 0, "berserkerModel.basicAttackCooldown must be positive");
  assert(Number.isFinite(model.openingCooldowns?.undyingRoar), "berserkerModel.openingCooldowns.undyingRoar missing");
  assert(Number.isFinite(model.passive?.baseLeech), "berserkerModel.passive.baseLeech missing");
  assert(Number.isFinite(model.passive?.missingHpLeech), "berserkerModel.passive.missingHpLeech missing");
  assert(Number.isFinite(model.passive?.lowHpHaste), "berserkerModel.passive.lowHpHaste missing");
  assert(Number.isFinite(model.passive?.roarLeech), "berserkerModel.passive.roarLeech missing");
}

function validateGeneratedBundle() {
  assertNode.deepStrictEqual(GENERATED_SKILL_ASSETS, SKILL_ASSETS, "skill-assets.js is out of sync with skill_assets source files. Run game_data/build-skill-assets.js.");
}

function run() {
  validateRoleKits();
  validateSkills();
  validateKitReferences();
  validatePresets();
  validateBerserkerModel();
  validateGeneratedBundle();
  console.log("skill assets ok");
}

if (require.main === module) {
  run();
}

module.exports = { run };
