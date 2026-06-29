const GAME_COMBAT_SIM = (() => {
const SKILL_DATA = typeof window !== "undefined"
  ? window.GAME_SKILL_DATA
  : require("./skill-data");
const SIGNALS = typeof window !== "undefined"
  ? window.GAME_COMBAT_SIGNALS
  : require("./combat-signals");

const TEAM_SIZE = 4;
const MAX_TIME = 75;
const ICON_BASE = "https://game-icons.net/icons/000000/ffffff/1x1/lorc";

const BERSERKER_MODEL = SKILL_DATA.berserkerModel || {};
const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};

const FORMATION = {
  left: [{ x: 30, y: 36, line: "前排" }, { x: 30, y: 64, line: "前排" }, { x: 16, y: 32, line: "后排" }, { x: 16, y: 68, line: "后排" }],
  right: [{ x: 70, y: 36, line: "前排" }, { x: 70, y: 64, line: "前排" }, { x: 84, y: 32, line: "后排" }, { x: 84, y: 68, line: "后排" }],
};

function simulatePresetMatchup(leftKey, rightKey, options = {}) {
  const leftTeam = clonePreset(leftKey);
  const rightTeam = clonePreset(rightKey);
  return simulateTeams(leftTeam, rightTeam, { ...options, seed: `${leftKey}|${rightKey}|${options.seed || 0}` });
}

function simulateTeams(leftTeam, rightTeam, options = {}) {
  const sim = new CombatSimulation(options);
  return sim.run(leftTeam, rightTeam);
}

function clonePreset(key) {
  const preset = SKILL_DATA.presets[key];
  if (!preset) throw new Error(`Unknown preset: ${key}`);
  return structuredClone(preset.team);
}

class CombatSimulation {
  constructor(options = {}) {
    this.maxTime = options.maxTime || MAX_TIME;
    this.dt = options.dt || 0.08;
    this.seedText = options.seed || "combat-sim";
    this.rng = seededRandom(this.seedText);
    this.time = 0;
    this.nextId = 1;
    this.units = [];
    this.logs = [];
    this.signalBus = SIGNALS.createCombatSignalBus({ healthInterval: options.healthInterval ?? 0.5 });
    this.skills = SKILL_DATA.createSkillLibrary(this.api());
    this.randomizeStats = options.randomizeStats !== false;
    this.currentActionSource = null;
  }

  api() {
    return {
      iconBase: ICON_BASE,
      hit: (...args) => this.hit(...args),
      addPoison: (...args) => this.addPoison(...args),
      addBurn: (...args) => this.addBurn(...args),
      healUnit: (unit, amount, label, source) => this.healUnit(unit, amount, label, typeof source === "object" ? source : undefined),
      shield: (unit, amount, label, source) => this.shield(unit, amount, label, typeof source === "object" ? source : undefined),
      breakShield: (...args) => this.breakShield(...args),
      takeRaw: (...args) => this.takeRaw(...args),
      floater: () => {},
      enemiesOf: (unit) => this.enemiesOf(unit),
      alliesOf: (unit) => this.alliesOf(unit),
      isAlive: (unit) => this.isAlive(unit),
      byDistance: (unit) => this.byDistance(unit),
      highestPowerEnemy: (unit) => this.highestPowerEnemy(unit),
      highestSkillHasteEnemy: (unit) => this.highestSkillHasteEnemy(unit),
      backlineLowestEnemy: (unit) => this.backlineLowestEnemy(unit),
      highestStatusAlly: (unit, statusType) => this.highestStatusAlly(unit, statusType),
      lowestEnemy: (unit) => this.lowestEnemy(unit),
      lowestHpAlly: (unit) => this.lowestHpAlly(unit),
      carryAlly: (unit) => this.carryAlly(unit),
      effectivePower: (unit, type) => this.effectivePower(unit, type),
      hpRatio: (unit) => this.hpRatio(unit),
      statusCount: (unit) => this.statusCount(unit),
      counterattack: (...args) => this.counterattack(...args),
      chargeToTarget: (...args) => this.chargeToTarget(...args),
      blinkBacklineStrike: (...args) => this.blinkBacklineStrike(...args),
      shadowStepStrike: (...args) => this.shadowStepStrike(...args),
      cleanseStatus: (...args) => this.cleanseStatus(...args),
      delayReadySkill: (...args) => this.delayReadySkill(...args),
      emitEffectSignal: (...args) => this.emitEffectSignal(...args),
    };
  }

  run(leftTeam, rightTeam) {
    this.time = 0;
    this.nextId = 1;
    this.logs = [];
    this.signalBus.clear();
    this.units = [...this.makeTeam("left", leftTeam), ...this.makeTeam("right", rightTeam)];
    if (this.randomizeStats) this.applyStatSwing();

    while (this.time < this.maxTime) {
      this.update(this.dt);
      const left = this.units.some((unit) => unit.side === "left" && this.isAlive(unit));
      const right = this.units.some((unit) => unit.side === "right" && this.isAlive(unit));
      if (!left || !right) break;
    }

    const leftHp = this.sideHpScore("left");
    const rightHp = this.sideHpScore("right");
    const winner = leftHp >= rightHp ? "left" : "right";
    return {
      winner,
      duration: round(this.time),
      leftHp: round(leftHp),
      rightHp: round(rightHp),
      units: this.units.map((unit) => ({
        id: unit.id,
        side: unit.side,
        index: unit.index,
        role: unit.role,
        name: unit.name,
        small1: unit.small1,
        small2: unit.small2,
        passive: unit.passive,
        ultimate: unit.ultimate,
        hp: round(unit.hp),
        maxHp: unit.maxHp,
        hpRatio: round(this.hpRatio(unit)),
        alive: this.isAlive(unit),
        damageDone: round(unit.damageDone),
      })),
      signals: this.signalBus.signals,
      summary: this.signalBus.summary(),
      metrics: this.metrics(),
    };
  }

  makeTeam(side, specs) {
    return specs.map((spec, index) => {
      const role = this.unitProfile(spec);
      const slotIndex = Number.isFinite(spec.slotIndex) ? spec.slotIndex : index;
      const slot = FORMATION[side][slotIndex % TEAM_SIZE];
      const maxHp = spec.maxHp || spec.hp || role.hp;
      const unit = {
        id: `${side}-${index + 1}`,
        side,
        index,
        slotIndex,
        ...spec,
        role: spec.role || role.key || role.role || "encounterUnit",
        name: spec.name || role.name,
        roleName: spec.roleName || role.role || role.name || "敌人",
        maxHp,
        hp: maxHp,
        power: spec.power ?? role.power,
        physicalPower: spec.physicalPower ?? spec.power ?? role.power,
        magicPower: spec.magicPower ?? spec.power ?? role.power,
        armor: spec.armor ?? role.armor,
        range: spec.range ?? role.range,
        attackSpeedMult: spec.attackSpeedMult ?? 1,
        skillHasteMult: spec.skillHasteMult ?? 1,
        effectPowerMult: spec.effectPowerMult ?? 1,
        effectResistPct: spec.effectResistPct ?? 0,
        receivedHealingMult: spec.receivedHealingMult ?? 1,
        homeX: slot.x,
        homeY: slot.y,
        line: slot.line,
        x: slot.x,
        y: slot.y,
        attackCd: 0.6,
        skillCd: {
          small1: this.openingCooldown(spec.small1, 1),
          small2: this.openingCooldown(spec.small2, 2.2),
          ultimate: this.openingCooldown(spec.ultimate, 20),
        },
        shield: 0,
        poison: status(),
        burn: status(),
        slowTimer: 0,
        guardTimer: 0,
        hiddenTimer: 0,
        shieldVulnerableTimer: 0,
        tauntTimer: 0,
        hasteTimer: 0,
        dotResistTimer: 0,
        undyingTimer: 0,
        lifeStealTimer: 0,
        bonusPowerTimer: 0,
        bonusPower: 0,
        bloodFuryTimer: 0,
        whirlwindTimer: 0,
        roarFuryTimer: 0,
        retaliationTimer: 0,
        retaliationEffect: null,
        deathRoarUsed: false,
        forcedTargetId: null,
        forcedTargetTimer: 0,
        hiddenRetaliateTimer: 2.2,
        counterCd: 0,
        damageDone: 0,
        mark: 0,
        rageStacks: 0,
        icon: spec.icon?.startsWith?.("http") ? spec.icon : `${ICON_BASE}/${spec.icon || role.icon || "crossed-swords"}.svg`,
      };
      this.applyPassiveStats(unit);
      unit.hp = unit.maxHp;
      return unit;
    });
  }

  applyPassiveStats(unit) {
    for (const effect of this.passiveEffects(unit, "passiveStat")) {
      if (Number.isFinite(effect.maxHpAdd)) unit.maxHp += effect.maxHpAdd;
      if (Number.isFinite(effect.maxHpMult)) unit.maxHp = Math.round(unit.maxHp * effect.maxHpMult);
      if (Number.isFinite(effect.powerAdd)) {
        unit.power += effect.powerAdd;
        unit.physicalPower += effect.powerAdd;
        unit.magicPower += effect.powerAdd;
      }
      if (Number.isFinite(effect.powerMult)) {
        unit.power = Math.round(unit.power * effect.powerMult);
        unit.physicalPower = Math.round(unit.physicalPower * effect.powerMult);
        unit.magicPower = Math.round(unit.magicPower * effect.powerMult);
      }
      if (Number.isFinite(effect.armorAdd)) unit.armor += effect.armorAdd;
      if (Number.isFinite(effect.armorMult)) unit.armor = Math.round(unit.armor * effect.armorMult);
      if (Number.isFinite(effect.rangeAdd)) unit.range += effect.rangeAdd;
      if (Number.isFinite(effect.attackSpeedMult)) unit.attackSpeedMult *= effect.attackSpeedMult;
      if (Number.isFinite(effect.skillHasteMult)) unit.skillHasteMult *= effect.skillHasteMult;
    }
  }

  unitProfile(spec) {
    const role = SKILL_DATA.roleKits[spec.role];
    if (role) return role;
    for (const field of ["name", "hp", "power", "armor", "range"]) {
      if (spec[field] === undefined) throw new Error(`Inline combat unit ${spec.role || spec.name || "unknown"} missing ${field}`);
    }
    return spec;
  }

  openingCooldown(skillKey, fallback) {
    if (skillKey === "undyingRoar") return BERSERKER_MODEL.openingCooldowns?.undyingRoar ?? 8;
    return SKILL_DATA.skills[skillKey]?.openingCooldown ?? fallback;
  }

  applyStatSwing() {
    for (const unit of this.units) {
      const statSwing = 0.94 + this.rng() * 0.12;
      unit.maxHp = Math.round(unit.maxHp * statSwing);
      unit.hp = unit.maxHp;
      unit.power = Math.round(unit.power * (0.95 + this.rng() * 0.1));
      unit.physicalPower = Math.round(unit.physicalPower * (0.95 + this.rng() * 0.1));
      unit.magicPower = Math.round(unit.magicPower * (0.95 + this.rng() * 0.1));
      unit.armor = Math.round(unit.armor * (0.96 + this.rng() * 0.08));
      unit.skillCd.small1 += this.rng() * 1.2;
      unit.skillCd.small2 += this.rng() * 1.5;
      unit.skillCd.ultimate += this.rng() * 3;
    }
  }

  update(dt) {
    this.time += dt;
    for (const unit of this.actionOrder()) {
      this.tickStatuses(unit, dt);
      this.tickTimers(unit, dt);
      const target = this.chooseTarget(unit);
      if (!target) continue;
      const distance = this.getDistance(unit, target);
      if (distance > unit.range) {
        if (unit.skillCd.ultimate <= 0 && this.skillHasEffect(unit.ultimate, "chargeToTarget")) this.castSlot(unit, "ultimate", target);
        else if (unit.skillCd.small1 <= 0 && this.skillHasEffect(unit.small1, "chargeToTarget")) this.castSlot(unit, "small1", target);
        else if (unit.skillCd.small2 <= 0 && this.skillHasEffect(unit.small2, "chargeToTarget")) this.castSlot(unit, "small2", target);
        if (this.getDistance(unit, target) <= unit.range) continue;
        this.moveToward(unit, target, dt);
        continue;
      }
      if (unit.skillCd.ultimate <= 0 && unit.ultimate) this.castSlot(unit, "ultimate", target);
      else if (unit.skillCd.small1 <= 0) this.castSlot(unit, "small1", target);
      else if (unit.skillCd.small2 <= 0) this.castSlot(unit, "small2", target);
      else if (unit.attackCd <= 0) this.basicAttack(unit, target);
    }
    this.signalBus.emitHealthSnapshots(this.units, this.time);
  }

  actionOrder() {
    const units = this.units.filter((item) => this.isAlive(item));
    for (let i = units.length - 1; i > 0; i -= 1) {
      const j = Math.floor(this.rng() * (i + 1));
      [units[i], units[j]] = [units[j], units[i]];
    }
    return units;
  }

  tickTimers(unit, dt) {
    for (const key of ["small1", "small2", "ultimate"]) unit.skillCd[key] = Math.max(0, unit.skillCd[key] - dt * (unit.skillHasteMult || 1));
    unit.attackCd -= dt * (unit.hasteTimer > 0 ? (unit.hasteMultiplier || 1.45) : 1) * (unit.attackSpeedMult || 1);
    for (const key of ["slowTimer", "guardTimer", "hiddenTimer", "shieldVulnerableTimer", "tauntTimer", "duelTimer", "hasteTimer", "dotResistTimer", "undyingTimer", "lifeStealTimer", "bonusPowerTimer", "bloodFuryTimer", "whirlwindTimer", "roarFuryTimer", "retaliationTimer", "forcedTargetTimer"]) {
      unit[key] = Math.max(0, unit[key] - dt);
    }
    if (unit.forcedTargetTimer <= 0) unit.forcedTargetId = null;
    unit.counterCd = Math.max(0, (unit.counterCd || 0) - dt);
  }

  tickStatuses(unit, dt) {
    this.tickDot(unit, unit.poison, dt, 2.1, "poison");
    this.tickDot(unit, unit.burn, dt, 2.15, "burn");
  }

  tickDot(unit, dot, dt, perStack, type) {
    if (dot.stacks <= 0) return;
    dot.time -= dt;
    dot.tick -= dt;
    if (dot.tick <= 0) {
      dot.tick = 1;
      const resist = (unit.dotResistTimer > 0 ? 0.6 : 1) * (1 - Math.min(0.5, Math.max(0, unit.effectResistPct || 0)));
      this.withAction(dot.source, { tags: ["dot", "damage", type], skillName: type === "poison" ? "剧毒" : "燃烧" }, () => {
        this.takeDamage(dot.source, unit, dot.stacks * perStack * resist * this.passiveDotMultiplier(dot.source, type) * (dot.source?.effectPowerMult || 1), type);
      });
    }
    if (dot.time <= 0) Object.assign(dot, status());
  }

  castSlot(unit, slot, target) {
    const skill = this.skills[unit[slot]];
    if (!skill) return;
    this.emitSignal({
      kind: "skill",
      tags: ["skill", slot === "ultimate" ? "ultimate" : "smallSkill", "cast"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      skillKey: unit[slot],
      skillName: skill.name,
      meta: { slot, role: unit.roleName },
    });
    this.withAction(unit, { tags: ["skill", slot === "ultimate" ? "ultimate" : "smallSkill"], skillKey: unit[slot], skillName: skill.name }, () => {
      skill.cast({ unit, target, visual: false });
    });
    unit.skillCd[slot] = skill.cooldown;
    if (slot === "ultimate") this.triggerEncore(unit);
  }

  basicAttack(unit, target) {
    const isBerserker = this.isBerserkerUnit(unit);
    const rageEffects = this.passiveEffects(unit, "basicAttackRage");
    const rageStacks = unit.rageStacks || 0;
    const rageAttackSpeed = rageEffects.reduce((multiplier, effect) => multiplier + rageStacks * (effect.attackSpeedPerStack || 0), 1);
    const missingHp = isBerserker ? 1 - this.hpRatio(unit) : 0;
    const lowHpHaste = isBerserker ? 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0) : 1;
    unit.attackCd = ((isBerserker ? (BERSERKER_MODEL.basicAttackCooldown ?? 1.35) : 1.45) * (unit.slowTimer > 0 ? 1.25 : 1)) / lowHpHaste / rageAttackSpeed;
    const attackType = unit.attackType || "physical";
    const power = this.effectivePower(unit, attackType);
    let amount = isBerserker ? (BERSERKER_MODEL.basicFlatDamage ?? 10) + power * (BERSERKER_MODEL.basicPowerRatio ?? 0.22) : 11 + power * 0.22;
    for (const effect of rageEffects) {
      amount += power * rageStacks * (effect.damagePerStack || 0);
      if (this.hpRatio(unit) <= (effect.lowHpThreshold || 0.45)) amount += power * rageStacks * (effect.lowHpDamagePerStack || 0);
    }
    let label = "攻击";
    if (isBerserker && unit.bloodFuryTimer > 0) {
      amount += power * (BERSERKER_RATIOS.blood ?? 0.45) * (1 + (1 - this.hpRatio(unit)) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45));
      label = "血怒普攻";
    }
    if (isBerserker && unit.whirlwindTimer > 0) {
      amount += power * (BERSERKER_RATIOS.whirlwind ?? 0.3);
      label = label === "攻击" ? "旋风普攻" : label;
    }
    if (isBerserker && unit.roarFuryTimer > 0) {
      amount += power * (BERSERKER_RATIOS.roar ?? 0.35);
      label = "战吼普攻";
    }
    this.withAction(unit, { tags: ["basic", "attack"], skillName: label, meta: { windows: this.activeWindows(unit) } }, () => {
      this.hit(unit, target, amount, attackType, label);
      for (const effect of this.passiveEffects(unit, "basicAttackMark")) {
        target.mark = Math.min(effect.max || 6, (target.mark || 0) + (effect.stacks || 1));
        this.emitSignal({
          kind: "status",
          side: target.side,
          unitId: target.id,
          text: `猎标${target.mark}`,
          tone: "debuff",
          value: target.mark,
          tags: this.actionTags(unit, ["status", "debuff", "mark", "basic"]).filter(Boolean),
          sourceId: unit.id,
          skillKey: unit.passive,
          skillName: "猎杀节律",
          meta: { stacks: target.mark },
        });
      }
      for (const effect of this.passiveEffects(unit, "basicAttackSelfShield")) {
        const bonus = (target.mark || 0) * (effect.perMark || 0);
        this.shield(unit, (effect.flat || 0) + bonus, effect.label || "影步", unit);
      }
      for (const effect of this.passiveEffects(unit, "basicAttackPoison")) {
        this.addPoison(target, effect.stacks || 1, effect.time || 4, unit);
      }
      for (const effect of rageEffects) {
        const before = unit.rageStacks || 0;
        const extra = this.hpRatio(unit) <= (effect.lowHpThreshold || 0.45) ? (effect.lowHpExtraStacks || 0) : 0;
        unit.rageStacks = Math.min(effect.max || 8, before + (effect.stacks || 1) + extra);
        if (unit.rageStacks !== before) {
          this.emitSignal({
            kind: "status",
            side: unit.side,
            unitId: unit.id,
            text: `怒血${unit.rageStacks}`,
            tone: "buff",
            value: unit.rageStacks,
            tags: this.actionTags(unit, ["status", "buff", "rage", "basic"]).filter(Boolean),
            sourceId: unit.id,
            skillKey: unit.passive,
            skillName: effect.label || "怒血连击",
            meta: { stacks: unit.rageStacks },
          });
        }
      }
    });
    if (isBerserker && unit.whirlwindTimer > 0) {
      this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && enemy.id !== target.id).sort(this.byDistance(target)).slice(0, BERSERKER_MODEL.splashTargets ?? 2)
        .forEach((enemy) => this.withAction(unit, { tags: ["basic", "attack", "area", "splash"], skillName: "旋风溅射", meta: { windows: this.activeWindows(unit) } }, () => {
          this.hit(unit, enemy, power * (BERSERKER_RATIOS.splash ?? 0.18), "physical", "旋风溅射");
        }));
    }
  }

  hit(source, target, amount, type, label, visual, scaleWith = type) {
    if (!target) return;
    let value = amount + this.effectivePower(source, scaleWith) * 0.04;
    if (source.passive === "lineBreaker" && target.line === "前排") value *= 1.06;
    if (source.passive === "rageEngine") value *= 1 + (1 - this.hpRatio(source)) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
    if (source.passive === "executionSense" && (this.hpRatio(target) < 0.38 || this.statusCount(target) > 0)) value *= 1.06;
    if (source.passive === "duelistFocus") value *= 1 + (target.mark || 0) * 0.045;
    if (source.passive === "catalyst" && this.statusCount(target) > 0) value *= 1.06;
    value *= SKILL_DATA.passiveDamageMultiplier?.(source, target, this.api()) || 1;
    if (target.guardTimer > 0) value *= 0.72;
    const mitigated = Math.max(1, value - target.armor * (type === "physical" ? 0.72 : 0.38));
    if (source?.hiddenTimer > 0 && this.isAlive(target)) {
      target.forcedTargetId = source.id;
      target.forcedTargetTimer = Math.max(target.forcedTargetTimer || 0, source.hiddenRetaliateTimer ?? 2.2);
    }
    this.takeDamage(source, target, mitigated, type, label);
  }

  takeDamage(source, target, amount, type, label = "") {
    if (!this.isAlive(target)) return;
    const hpBefore = target.hp;
    let remaining = amount;
    let blocked = 0;
    if (target.shield > 0) {
      blocked = Math.min(target.shield, remaining);
      target.shield -= blocked;
      remaining -= blocked;
    }
    if (target.undyingTimer > 0 && target.hp - remaining <= 1) remaining = Math.max(0, target.hp - 1);
    target.hp = Math.max(0, target.hp - remaining);
    if (remaining > 0) {
      this.emitSignal({
        kind: "damage",
        tags: this.actionTags(source, ["damage", type, blocked > 0 ? "blocked" : "", remaining !== amount ? "mitigated" : ""]).filter(Boolean),
        source: SIGNALS.unitRef(source),
        target: SIGNALS.unitRef(target),
        amount: remaining,
        skillKey: source?._actionSignal?.skillKey || null,
        skillName: label || source?._actionSignal?.skillName || "",
        hpBefore,
        hpAfter: target.hp,
        meta: { rawAmount: amount, blocked, shieldAfter: target.shield || 0, ...source?._actionSignal?.meta },
      });
    }
    if (source) {
      source.damageDone += amount;
      let leechRate = 0;
      if (source.lifeStealTimer > 0 || source.passive === "rageEngine") {
        leechRate += source.lifeStealTimer > 0 ? (BERSERKER_PASSIVE.roarLeech ?? 0.18) : (BERSERKER_PASSIVE.baseLeech ?? 0.06) + (1 - this.hpRatio(source)) * (BERSERKER_PASSIVE.missingHpLeech ?? 0.08);
      }
      for (const effect of this.passiveEffects(source, "basicAttackRage")) {
        leechRate += (source.rageStacks || 0) * (effect.leechPerStack || 0);
        if (this.hpRatio(source) <= (effect.lowHpThreshold || 0.45)) leechRate += effect.lowHpLeechBonus || 0;
      }
      if (leechRate > 0) {
        this.healUnit(source, amount * leechRate, "吸血");
      }
    }
    SKILL_DATA.triggerReactiveEffects?.("afterDamageTaken", {
      unit: target,
      source,
      blocked,
      damageTaken: remaining,
      rawAmount: amount,
      type,
    }, this.api());
    if (target.hp <= 0 && this.tryAutoRazorRoar(target, source)) return;
    if (target.hp <= 0) this.onDeath(target, source);
  }

  tryAutoRazorRoar(unit, source) {
    if (!unit || unit.ultimate !== "aaRazorRoar" || unit.deathRoarUsed) return false;
    unit.deathRoarUsed = true;
    unit.hp = 1;
    unit.skillCd.ultimate = Math.max(unit.skillCd.ultimate || 0, SKILL_DATA.skills.aaRazorRoar?.cooldown || 32);
    this.emitSignal({
      kind: "status",
      tags: ["status", "deathPrevent", "autoUltimate", "berserker"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(unit),
      amount: unit.hp,
      skillKey: "aaRazorRoar",
      skillName: SKILL_DATA.skills.aaRazorRoar?.name || "刃吼狂潮",
      meta: { trigger: "firstZeroHp", preventedBy: source?.id || "" },
    });
    this.withAction(unit, { tags: ["skill", "ultimate", "autoUltimate"], skillKey: "aaRazorRoar", skillName: SKILL_DATA.skills.aaRazorRoar?.name || "刃吼狂潮" }, () => {
      this.skills.aaRazorRoar?.cast({ unit, target: this.chooseTarget(unit), visual: false });
    });
    unit.hasteTimer = Math.min(unit.hasteTimer || 0, 0.9);
    unit.bloodFuryTimer = 0;
    unit.whirlwindTimer = Math.min(unit.whirlwindTimer || 0, 2.8);
    return true;
  }

  counterattack(unit, source, effect, context = {}) {
    if (!this.isAlive(unit) || !this.isAlive(source) || (unit.counterCd || 0) > 0) return;
    unit.counterCd = effect.cooldown || 0;
    if (effect.tauntDuration) unit.tauntTimer = Math.max(unit.tauntTimer || 0, effect.tauntDuration);
    const amount = (effect.flat || 0)
      + this.effectivePower(unit, "physical") * (effect.power || 0)
      + (context.blocked || 0) * (effect.blockedRatio || 0);
    this.withAction(unit, {
      tags: ["counter", "reactive"],
      skillKey: unit.passive,
      skillName: effect.label || "Counter",
      meta: { blockedTrigger: context.blocked || 0 },
    }, () => this.hit(unit, source, amount, "physical", effect.label || "Counter"));
  }

  emitEffectSignal(signal) {
    this.emitSignal({
      ...signal,
      source: SIGNALS.unitRef(signal.source),
      target: SIGNALS.unitRef(signal.target),
      skillKey: signal.source?._actionSignal?.skillKey || null,
      skillName: signal.source?._actionSignal?.skillName || "",
    });
  }

  takeRaw(target, amount, source, type) {
    const hpBefore = target.hp;
    target.hp = Math.max(1, target.hp - amount);
    this.emitSignal({
      kind: "damage",
      tags: ["damage", type || "raw", "selfCost"],
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: hpBefore - target.hp,
      hpBefore,
      hpAfter: target.hp,
    });
  }

  healUnit(unit, amount, label = "治疗", source = this.currentActionSource) {
    if (!unit || !this.isAlive(unit)) return;
    const received = label === "吸血" ? 1 : (unit.receivedHealingMult || 1);
    const value = amount * received * this.passiveHealMultiplier(source, unit);
    const before = unit.hp;
    unit.hp = Math.min(unit.maxHp, unit.hp + value);
    const healed = unit.hp - before;
    const overflow = Math.max(0, value - (unit.maxHp - before));
    if (unit.passive === "afterglowGrace" && overflow > 0) unit.shield += overflow * 0.65;
    if (healed > 0) {
      this.emitSignal({
        kind: "heal",
        tags: this.actionTags(source, ["heal"]).filter(Boolean),
        source: SIGNALS.unitRef(source),
        target: SIGNALS.unitRef(unit),
        amount: healed,
        skillKey: source?._actionSignal?.skillKey || null,
        skillName: label,
        hpBefore: before,
        hpAfter: unit.hp,
        meta: { overflow },
      });
    }
  }

  shield(unit, amount, label, source = this.currentActionSource) {
    if (!unit || !this.isAlive(unit)) return;
    const bonus = unit.passive === "fortressStance" ? 1.08 + (1 - this.hpRatio(unit)) * 0.12 : 1;
    const vulnerability = unit.shieldVulnerableTimer > 0 ? 0.75 : 1;
    const value = amount * (unit.receivedHealingMult || 1) * bonus * vulnerability * this.passiveShieldMultiplier(source, unit);
    unit.shield += value;
    this.emitSignal({
      kind: "shield",
      tags: this.actionTags(source, ["shield"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(unit),
      amount: value,
      skillKey: source?._actionSignal?.skillKey || null,
      skillName: label,
      shield: unit.shield,
    });
  }

  breakShield(source, target, amount, label = "破盾") {
    if (!target || !this.isAlive(target) || !(target.shield > 0) || !(amount > 0)) return;
    const broken = Math.min(target.shield, amount);
    target.shield -= broken;
    this.emitSignal({
      kind: "shieldBreak",
      tags: this.actionTags(source, ["shieldBreak"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: broken,
      skillKey: source?._actionSignal?.skillKey || null,
      skillName: label,
      meta: { shieldAfter: target.shield },
    });
  }

  cleanseStatus(source, target, statusType, amount, healPerStack = 0, label = "净化") {
    if (!target || !this.isAlive(target)) return 0;
    const statusState = statusType === "burn" ? target.burn : target.poison;
    if (!statusState || statusState.stacks <= 0) return 0;
    const cleared = Math.min(statusState.stacks, amount);
    statusState.stacks -= cleared;
    if (statusState.stacks <= 0) Object.assign(statusState, status());
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "cleanse", statusType]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: cleared,
      skillKey: source?._actionSignal?.skillKey || null,
      skillName: label,
      meta: { statusType, cleared },
    });
    if (healPerStack > 0) this.healUnit(target, cleared * healPerStack, label, source);
    return cleared;
  }

  delayReadySkill(unit, amount, label = "冷却裂隙") {
    if (!unit || !this.isAlive(unit)) return;
    const slots = ["small1", "small2", "ultimate"].filter((slot) => Number.isFinite(unit.skillCd?.[slot]));
    const slot = slots.sort((a, b) => unit.skillCd[a] - unit.skillCd[b])[0];
    if (!slot) return;
    unit.skillCd[slot] += amount;
    this.emitSignal({
      kind: "status",
      tags: ["status", "debuff", "cooldownDelay"],
      source: SIGNALS.unitRef(this.currentActionSource),
      target: SIGNALS.unitRef(unit),
      amount,
      skillKey: this.currentActionSource?._actionSignal?.skillKey || null,
      skillName: label,
      meta: { slot, delay: amount },
    });
  }

  addPoison(target, stacks, time, source) {
    target.poison.stacks = Math.min(20, target.poison.stacks + stacks);
    target.poison.time = Math.max(target.poison.time, time);
    target.poison.source = source;
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "debuff", "poison", "dotStack"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: stacks,
      skillName: source?._actionSignal?.skillName || "剧毒",
      meta: { stacks: target.poison.stacks, duration: target.poison.time },
    });
  }

  addBurn(target, stacks, time, source) {
    target.burn.stacks += stacks;
    target.burn.time = Math.max(target.burn.time, time);
    target.burn.source = source;
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "debuff", "burn", "dotStack"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: stacks,
      skillName: source?._actionSignal?.skillName || "燃烧",
      meta: { stacks: target.burn.stacks, duration: target.burn.time },
    });
  }

  onDeath(unit, killer) {
    this.emitSignal({
      kind: "death",
      tags: ["death"],
      source: SIGNALS.unitRef(killer),
      target: SIGNALS.unitRef(unit),
      skillKey: killer?._actionSignal?.skillKey || null,
      skillName: killer?._actionSignal?.skillName || "",
      hpBefore: 0,
      hpAfter: 0,
      meta: {
        killerRole: killer?.role || "",
        targetRole: unit.role || "",
      },
    });
    if (unit.poison.stacks > 0) {
      this.alliesOf(killer || unit).filter((ally) => ally.passive === "hotbedPact" && this.isAlive(ally)).slice(0, 1).forEach((source) => {
        this.alliesOf(unit).filter((ally) => this.isAlive(ally) && ally.id !== unit.id).forEach((enemy) => {
          this.withAction(source, { tags: ["passive", "poisonSpread"], skillKey: "hotbedPact", skillName: "Poison Spread" }, () => {
            this.addPoison(enemy, Math.ceil(unit.poison.stacks * 0.18), 6, source);
          });
        });
      });
    }
    if (unit.burn.stacks > 0) {
      this.alliesOf(killer || unit).filter((ally) => ally.passive === "kindlingEcho" && this.isAlive(ally)).slice(0, 1).forEach((source) => {
        this.enemiesOf(source).filter((enemy) => this.isAlive(enemy)).sort(this.byDistance(unit)).slice(0, 2).forEach((enemy) => this.hit(source, enemy, 14 + unit.burn.stacks * 6, "fire", "火种余爆"));
      });
    }
    if (killer && killer.ultimate === "shadowHarvest") killer.skillCd.ultimate = Math.min(killer.skillCd.ultimate, 8);
  }

  triggerEncore(unit) {
    this.alliesOf(unit).filter((ally) => ally.passive === "encore" && this.isAlive(ally)).forEach((bard) => {
      bard.skillCd.small1 = Math.max(0, bard.skillCd.small1 - 2);
      bard.skillCd.small2 = Math.max(0, bard.skillCd.small2 - 2);
    });
  }

  metrics() {
    return {
      leftAlive: this.units.filter((unit) => unit.side === "left" && this.isAlive(unit)).length,
      rightAlive: this.units.filter((unit) => unit.side === "right" && this.isAlive(unit)).length,
      leftDamage: round(this.units.filter((unit) => unit.side === "left").reduce((sum, unit) => sum + unit.damageDone, 0)),
      rightDamage: round(this.units.filter((unit) => unit.side === "right").reduce((sum, unit) => sum + unit.damageDone, 0)),
      leftBasicDamage: round(this.sideSignalAmount("left", ["basic", "damage"])),
      rightBasicDamage: round(this.sideSignalAmount("right", ["basic", "damage"])),
      leftDotDamage: round(this.sideSignalAmount("left", ["dot", "damage"])),
      rightDotDamage: round(this.sideSignalAmount("right", ["dot", "damage"])),
      leftHealing: round(this.sideSignalAmount("left", ["heal"], "target")),
      rightHealing: round(this.sideSignalAmount("right", ["heal"], "target")),
      leftShield: round(this.sideSignalAmount("left", ["shield"], "target")),
      rightShield: round(this.sideSignalAmount("right", ["shield"], "target")),
    };
  }

  sideSignalAmount(side, tags, ref = "source") {
    return this.signalBus.query(tags).filter((signal) => signal[ref]?.side === side).reduce((sum, signal) => sum + (signal.amount || 0), 0);
  }

  sideHpScore(side) {
    return this.units.filter((unit) => unit.side === side).reduce((sum, unit) => sum + Math.max(0, unit.hp / unit.maxHp), 0);
  }

  tauntTarget(unit, enemies = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy))) {
    if (!(unit.range < 20)) return null;
    const taunters = enemies.filter((enemy) => enemy.tauntTimer > 0);
    return taunters.length ? taunters.sort(this.byDistance(unit))[0] : null;
  }

  chooseTarget(unit) {
    const enemies = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    if (!enemies.length) return null;
    if (unit.forcedTargetId && unit.forcedTargetTimer > 0) {
      const forced = enemies.find((enemy) => enemy.id === unit.forcedTargetId);
      if (forced) return forced;
    }
    const taunter = this.tauntTarget(unit, enemies);
    if (taunter) return taunter;
    if (unit.roleName === "刺客") return this.lowestEnemy(unit) || enemies[0];
    const visibleEnemies = enemies.filter((enemy) => !(enemy.hiddenTimer > 0));
    const targetPool = visibleEnemies.length ? visibleEnemies : enemies;
    const front = targetPool.filter((enemy) => enemy.line === "前排");
    const candidates = front.length && unit.range < 30 ? front : targetPool;
    return candidates.sort(this.byDistance(unit))[0];
  }

  moveToward(unit, target, dt) {
    const distance = this.getDistance(unit, target);
    if (distance <= unit.range * 0.92) return;
    const step = dt * (unit.roleName === "刺客" ? 10 : unit.slowTimer > 0 ? 4.2 : 7);
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const move = Math.min(step, Math.max(0, distance - unit.range * 0.9));
    unit.x = clamp(unit.x + (dx / distance) * move, 7, 93);
    unit.y = clamp(unit.y + (dy / distance) * move, 12, 88);
  }

  chargeToTarget(unit, target, effect = {}) {
    if (!unit || !target || !this.isAlive(unit) || !this.isAlive(target)) return;
    const distance = this.getDistance(unit, target);
    if (distance <= 0) return;
    const stopRange = Number.isFinite(effect.stopRange) ? effect.stopRange : Math.max(6, unit.range * 0.72);
    const maxDistance = Number.isFinite(effect.distance) ? effect.distance : 18;
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const travel = Math.min(maxDistance, Math.max(0, distance - stopRange));
    const before = { x: unit.x, y: unit.y };
    unit.x = clamp(unit.x + (dx / distance) * travel, 7, 93);
    unit.y = clamp(unit.y + (dy / distance) * travel, 12, 88);
    unit.attackCd = Math.min(unit.attackCd, effect.attackCd ?? 0.15);
    const impactCount = Number.isFinite(effect.impactCount) ? effect.impactCount : 0;
    if (impactCount > 0) {
      this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy)).sort(this.byDistance(unit)).slice(0, impactCount).forEach((enemy) => {
        const impactDistance = Math.max(0.001, this.getDistance(unit, enemy));
        const push = effect.pushDistance ?? 2.5;
        enemy.x = clamp(enemy.x + ((enemy.x - unit.x) / impactDistance) * push, 7, 93);
        enemy.y = clamp(enemy.y + ((enemy.y - unit.y) / impactDistance) * push, 12, 88);
        enemy.attackCd = Math.max(enemy.attackCd, effect.attackDelay ?? 0.45);
        if ((effect.shieldBreak || 0) > 0 && enemy.shield > 0) {
          const broken = Math.min(enemy.shield, effect.shieldBreak);
          enemy.shield -= broken;
          this.emitSignal({
            kind: "shieldBreak",
            tags: this.actionTags(unit, ["shieldBreak", "charge"]).filter(Boolean),
            source: SIGNALS.unitRef(unit),
            target: SIGNALS.unitRef(enemy),
            amount: broken,
            skillKey: unit?._actionSignal?.skillKey || null,
            skillName: effect.label || unit?._actionSignal?.skillName || "charge",
            meta: { shieldAfter: enemy.shield },
          });
        }
      });
    }
    this.emitSignal({
      kind: "movement",
      tags: this.actionTags(unit, ["movement", "charge"]).filter(Boolean),
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      amount: round(travel),
      skillKey: unit?._actionSignal?.skillKey || null,
      skillName: effect.label || unit?._actionSignal?.skillName || "charge",
      meta: { before, after: { x: unit.x, y: unit.y }, stopRange, impactCount },
    });
  }

  blinkBacklineStrike(unit, effect = {}) {
    if (!unit || !this.isAlive(unit)) return;
    const backline = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && enemy.line === "鍚庢帓");
    const fallback = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    const target = (backline.length ? backline : fallback).sort((a, b) => this.hpRatio(a) - this.hpRatio(b) || this.getDistance(unit, a) - this.getDistance(unit, b))[0];
    if (!target) return;
    const before = { x: unit.x, y: unit.y };
    const sideOffset = unit.side === "left" ? -3.8 : 3.8;
    unit.x = clamp(target.x + sideOffset, 7, 93);
    unit.y = clamp(target.y + (effect.yOffset || 1.6), 12, 88);
    unit.attackCd = Math.min(unit.attackCd, effect.attackCd ?? 0.08);
    unit.forcedTargetId = target.id;
    unit.forcedTargetTimer = effect.lockDuration ?? 3.2;
    unit.hiddenRetaliateTimer = effect.retaliateDuration ?? 2.2;
    if (effect.guardDuration) unit.guardTimer = Math.max(unit.guardTimer || 0, effect.guardDuration);
    this.emitSignal({
      kind: "movement",
      tags: this.actionTags(unit, ["movement", "blink", "backline"]).filter(Boolean),
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      amount: round(this.getDistance({ x: before.x, y: before.y }, unit)),
      skillKey: unit?._actionSignal?.skillKey || null,
      skillName: effect.label || unit?._actionSignal?.skillName || "blink",
      meta: { before, after: { x: unit.x, y: unit.y }, lockDuration: unit.forcedTargetTimer },
    });
    if (effect.targetSlowDuration) target.slowTimer = Math.max(target.slowTimer || 0, effect.targetSlowDuration);
    const power = this.effectivePower(unit, effect.scaleWith || effect.type || "physical");
    const executeBonus = (1 - this.hpRatio(target)) * (effect.missingTargetHpFlat || 0);
    this.hit(unit, target, (effect.flat || 0) + power * (effect.power || 0) + executeBonus, effect.type || "physical", effect.hitLabel || effect.label || "blink", false, effect.scaleWith || effect.type || "physical");
    if (effect.markStacks) {
      target.mark = Math.min(effect.markMax || 5, (target.mark || 0) + effect.markStacks);
      this.emitSignal({
        kind: "status",
        tags: this.actionTags(unit, ["status", "debuff", "mark", "backline"]).filter(Boolean),
        source: SIGNALS.unitRef(unit),
        target: SIGNALS.unitRef(target),
        amount: effect.markStacks,
        skillKey: unit?._actionSignal?.skillKey || null,
        skillName: effect.label || unit?._actionSignal?.skillName || "blink",
        meta: { stacks: target.mark },
      });
    }
  }

  shadowStepStrike(unit, effect = {}) {
    if (!unit || !this.isAlive(unit)) return;
    const target = this.backlineLowestEnemy(unit);
    if (!target) return;

    const before = { x: unit.x, y: unit.y };
    const sideOffset = unit.side === "left" ? -3.8 : 3.8;
    unit.x = clamp(target.x + sideOffset, 7, 93);
    unit.y = clamp(target.y + (effect.yOffset || 1.6), 12, 88);
    unit.attackCd = Math.min(unit.attackCd, effect.attackCd ?? 0.08);
    unit.forcedTargetId = target.id;
    unit.forcedTargetTimer = effect.lockDuration ?? 3.2;
    if (effect.guardDuration) unit.guardTimer = Math.max(unit.guardTimer || 0, effect.guardDuration);
    if (effect.hiddenDuration) unit.hiddenTimer = Math.max(unit.hiddenTimer || 0, effect.hiddenDuration);

    this.emitSignal({
      kind: "movement",
      tags: this.actionTags(unit, ["movement", "blink", "backline", "shadowStep", effect.hiddenDuration ? "hidden" : ""]).filter(Boolean),
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      amount: round(this.getDistance({ x: before.x, y: before.y }, unit)),
      skillKey: unit?._actionSignal?.skillKey || null,
      skillName: effect.label || unit?._actionSignal?.skillName || "shadow step",
      meta: { before, after: { x: unit.x, y: unit.y }, lockDuration: unit.forcedTargetTimer, hiddenDuration: effect.hiddenDuration || 0 },
    });

    const power = this.effectivePower(unit, effect.scaleWith || effect.type || "physical");
    const executeBonus = (1 - this.hpRatio(target)) * (effect.missingTargetHpFlat || 0);
    this.hit(unit, target, (effect.flat || 0) + power * (effect.power || 0) + executeBonus, effect.type || "physical", effect.hitLabel || effect.label || "shadow step", false, effect.scaleWith || effect.type || "physical");

    if (effect.markStacks) {
      target.mark = Math.min(effect.markMax || 5, (target.mark || 0) + effect.markStacks);
      this.emitSignal({
        kind: "status",
        tags: this.actionTags(unit, ["status", "debuff", "mark", "backline", "shadowStep"]).filter(Boolean),
        source: SIGNALS.unitRef(unit),
        target: SIGNALS.unitRef(target),
        amount: effect.markStacks,
        skillKey: unit?._actionSignal?.skillKey || null,
        skillName: effect.label || unit?._actionSignal?.skillName || "shadow step",
        meta: { stacks: target.mark },
      });
    }
  }

  effectivePower(unit, type = "physical") {
    const base = type === "physical"
      ? (unit.physicalPower ?? unit.power)
      : (unit.magicPower ?? unit.power);
    return base + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0);
  }
  statusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slowTimer > 0 ? 2 : 0) + (unit.mark || 0); }
  carryAlly(unit) {
    const carryScore = (ally) => Math.max(this.effectivePower(ally, "physical"), this.effectivePower(ally, "magic"));
    return this.alliesOf(unit).filter((ally) => this.isAlive(ally)).sort((a, b) => carryScore(b) - carryScore(a))[0];
  }
  lowestEnemy(unit) {
    const enemies = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    return this.tauntTarget(unit, enemies) || enemies.sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
  }
  enemiesOf(unit) { return this.units.filter((item) => item.side !== unit.side); }
  alliesOf(unit) { return this.units.filter((item) => item.side === unit.side); }
  lowestHpAlly(unit) { return this.alliesOf(unit).filter((ally) => this.isAlive(ally)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
  highestPowerEnemy(unit) {
    return this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy)).sort((a, b) => (
      (this.effectivePower(b, "physical") + this.effectivePower(b, "magic"))
      - (this.effectivePower(a, "physical") + this.effectivePower(a, "magic"))
    ))[0];
  }
  highestSkillHasteEnemy(unit) {
    const rangedFlag = (enemy) => enemy.range >= 30 ? 1 : 0;
    return this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy)).sort((a, b) => (
      (b.skillHasteMult || 1) - (a.skillHasteMult || 1)
      || rangedFlag(b) - rangedFlag(a)
      || this.effectivePower(b, "magic") - this.effectivePower(a, "magic")
    ))[0];
  }
  backlineLowestEnemy(unit) {
    const enemies = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    const backline = enemies.filter((enemy) => enemy.line === "后排");
    return (backline.length ? backline : enemies).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
  }
  highestStatusAlly(unit, statusType) {
    const statusValue = (ally) => (statusType === "burn" ? ally.burn?.stacks : ally.poison?.stacks) || 0;
    return this.alliesOf(unit).filter((ally) => this.isAlive(ally)).sort((a, b) => statusValue(b) - statusValue(a) || this.hpRatio(a) - this.hpRatio(b))[0];
  }
  isAlive(unit) { return unit && unit.hp > 0; }
  hpRatio(unit) { return unit.hp / unit.maxHp; }
  getDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  byDistance(unit) { return (a, b) => this.getDistance(unit, a) - this.getDistance(unit, b); }
  isBerserkerUnit(unit) { return unit?.role === "berserker" || unit?.roleName === "狂战士" || unit?.passive === "rageEngine"; }
  passiveEffects(unit, kind) {
    const passive = SKILL_DATA.skills[unit?.passiveKey || unit?.passive];
    return (passive?.effects || []).filter((effect) => effect.kind === kind);
  }
  skillHasEffect(skillKey, kind) {
    return (SKILL_DATA.skills[skillKey]?.effects || []).some((effect) => effect.kind === kind);
  }
  passiveDotMultiplier(source, type) {
    if (!source) return 1;
    return this.passiveEffects(source, "passiveDotAmp").reduce((multiplier, effect) => {
      if (effect.type && effect.type !== type) return multiplier;
      return multiplier * (1 + (effect.amp || 0));
    }, 1);
  }
  passiveHealMultiplier(source, target) {
    if (!source) return 1;
    return this.passiveEffects(source, "passiveHealAmp").reduce((multiplier, effect) => {
      if (effect.selfOnly && source.id !== target?.id) return multiplier;
      if (effect.targetLine && target?.line !== effect.targetLine) return multiplier;
      return multiplier * (1 + (effect.amp || 0));
    }, 1);
  }
  passiveShieldMultiplier(source, target) {
    if (!source) return 1;
    return this.passiveEffects(source, "passiveShieldAmp").reduce((multiplier, effect) => {
      if (effect.selfOnly && source.id !== target?.id) return multiplier;
      if (effect.targetLine && target?.line !== effect.targetLine) return multiplier;
      return multiplier * (1 + (effect.amp || 0));
    }, 1);
  }
  emitSignal(signal) { this.signalBus.emit({ time: this.time, ...signal }); }
  activeWindows(unit) {
    return [
      unit.bloodFuryTimer > 0 ? "bloodFury" : "",
      unit.whirlwindTimer > 0 ? "whirlwind" : "",
      unit.roarFuryTimer > 0 ? "roarFury" : "",
      unit.hasteTimer > 0 ? "haste" : "",
    ].filter(Boolean);
  }
  withAction(unit, action, fn) {
    if (!unit) return fn();
    const previous = unit._actionSignal;
    const previousSource = this.currentActionSource;
    unit._actionSignal = action;
    this.currentActionSource = unit;
    try {
      return fn();
    } finally {
      unit._actionSignal = previous;
      this.currentActionSource = previousSource;
    }
  }
  actionTags(source, tags) {
    return [...(source?._actionSignal?.tags || []), ...tags];
  }
}

function status() { return { stacks: 0, time: 0, tick: 1, source: null }; }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function round(value, digits = 3) { return Number(value.toFixed(digits)); }

function seededRandom(seedText) {
  let seed = 2166136261;
  for (let i = 0; i < seedText.length; i += 1) {
    seed ^= seedText.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return () => {
    seed += 0x6D2B79F5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

return { CombatSimulation, simulatePresetMatchup, simulateTeams, clonePreset };
})();

if (typeof window !== "undefined") window.GAME_COMBAT_SIM = GAME_COMBAT_SIM;
if (typeof module !== "undefined") module.exports = GAME_COMBAT_SIM;
