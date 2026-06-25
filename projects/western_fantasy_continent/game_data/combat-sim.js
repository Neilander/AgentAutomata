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
  return simulateTeams(leftTeam, rightTeam, { seed: `${leftKey}|${rightKey}|${options.seed || 0}`, ...options });
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
  }

  api() {
    return {
      iconBase: ICON_BASE,
      hit: (...args) => this.hit(...args),
      addPoison: (...args) => this.addPoison(...args),
      addBurn: (...args) => this.addBurn(...args),
      healUnit: (...args) => this.healUnit(...args),
      shield: (...args) => this.shield(...args),
      takeRaw: (...args) => this.takeRaw(...args),
      floater: () => {},
      enemiesOf: (unit) => this.enemiesOf(unit),
      alliesOf: (unit) => this.alliesOf(unit),
      isAlive: (unit) => this.isAlive(unit),
      byDistance: (unit) => this.byDistance(unit),
      lowestEnemy: (unit) => this.lowestEnemy(unit),
      lowestHpAlly: (unit) => this.lowestHpAlly(unit),
      carryAlly: (unit) => this.carryAlly(unit),
      effectivePower: (unit) => this.effectivePower(unit),
      hpRatio: (unit) => this.hpRatio(unit),
      statusCount: (unit) => this.statusCount(unit),
      counterattack: (...args) => this.counterattack(...args),
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
        role: unit.role,
        name: unit.name,
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
      const slot = FORMATION[side][index % TEAM_SIZE];
      const maxHp = spec.maxHp || spec.hp || role.hp;
      return {
        id: `${side}-${index + 1}`,
        side,
        index,
        ...spec,
        role: spec.role || role.key || role.role || "encounterUnit",
        name: spec.name || role.name,
        roleName: spec.roleName || role.role || role.name || "敌人",
        maxHp,
        hp: maxHp,
        power: spec.power ?? role.power,
        armor: spec.armor ?? role.armor,
        range: spec.range ?? role.range,
        homeX: slot.x,
        homeY: slot.y,
        line: slot.line,
        x: slot.x,
        y: slot.y,
        attackCd: 0.6 + index * 0.08,
        skillCd: {
          small1: this.openingCooldown(spec.small1, 1 + index * 0.35),
          small2: this.openingCooldown(spec.small2, 2.2 + index * 0.35),
          ultimate: this.openingCooldown(spec.ultimate, 20 + index * 1.8),
        },
        shield: 0,
        poison: status(),
        burn: status(),
        slowTimer: 0,
        guardTimer: 0,
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
        counterCd: 0,
        damageDone: 0,
        mark: 0,
        icon: spec.icon?.startsWith?.("http") ? spec.icon : `${ICON_BASE}/${spec.icon || role.icon || "crossed-swords"}.svg`,
      };
    });
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
    for (const key of ["small1", "small2", "ultimate"]) unit.skillCd[key] = Math.max(0, unit.skillCd[key] - dt);
    unit.attackCd -= dt * (unit.hasteTimer > 0 ? (unit.hasteMultiplier || 1.45) : 1);
    for (const key of ["slowTimer", "guardTimer", "tauntTimer", "hasteTimer", "dotResistTimer", "undyingTimer", "lifeStealTimer", "bonusPowerTimer", "bloodFuryTimer", "whirlwindTimer", "roarFuryTimer", "retaliationTimer"]) {
      unit[key] = Math.max(0, unit[key] - dt);
    }
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
      const resist = unit.dotResistTimer > 0 ? 0.6 : 1;
      this.withAction(dot.source, { tags: ["dot", "damage", type], skillName: type === "poison" ? "剧毒" : "燃烧" }, () => {
        this.takeDamage(dot.source, unit, dot.stacks * perStack * resist, type);
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
    const missingHp = isBerserker ? 1 - this.hpRatio(unit) : 0;
    const lowHpHaste = isBerserker ? 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0) : 1;
    unit.attackCd = ((isBerserker ? (BERSERKER_MODEL.basicAttackCooldown ?? 1.35) : 1.45) * (unit.slowTimer > 0 ? 1.25 : 1)) / lowHpHaste;
    const power = this.effectivePower(unit);
    let amount = isBerserker ? (BERSERKER_MODEL.basicFlatDamage ?? 10) + power * (BERSERKER_MODEL.basicPowerRatio ?? 0.22) : 11 + power * 0.22;
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
      this.hit(unit, target, amount, "physical", label);
    });
    if (isBerserker && unit.whirlwindTimer > 0) {
      this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && enemy.id !== target.id).sort(this.byDistance(target)).slice(0, BERSERKER_MODEL.splashTargets ?? 2)
        .forEach((enemy) => this.withAction(unit, { tags: ["basic", "attack", "area", "splash"], skillName: "旋风溅射", meta: { windows: this.activeWindows(unit) } }, () => {
          this.hit(unit, enemy, power * (BERSERKER_RATIOS.splash ?? 0.18), "physical", "旋风溅射");
        }));
    }
  }

  hit(source, target, amount, type, label) {
    if (!target) return;
    let value = amount + this.effectivePower(source) * 0.04;
    if (source.passive === "lineBreaker" && target.line === "前排") value *= 1.12;
    if (source.passive === "rageEngine") value *= 1 + (1 - this.hpRatio(source)) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
    if (source.passive === "executionSense" && (this.hpRatio(target) < 0.45 || this.statusCount(target) > 0)) value *= 1.18;
    if (source.passive === "duelistFocus") value *= 1 + (target.mark || 0) * 0.045;
    if (source.passive === "catalyst" && this.statusCount(target) > 0) value *= 1.06;
    value *= SKILL_DATA.passiveDamageMultiplier?.(source, target, this.api()) || 1;
    if (target.guardTimer > 0) value *= 0.72;
    const mitigated = Math.max(1, value - target.armor * (type === "physical" ? 0.72 : 0.38));
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
      if (source.lifeStealTimer > 0 || source.passive === "rageEngine") {
        const leechRate = source.lifeStealTimer > 0 ? (BERSERKER_PASSIVE.roarLeech ?? 0.18) : (BERSERKER_PASSIVE.baseLeech ?? 0.06) + (1 - this.hpRatio(source)) * (BERSERKER_PASSIVE.missingHpLeech ?? 0.08);
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
    if (target.hp <= 0) this.onDeath(target, source);
  }

  counterattack(unit, source, effect, context = {}) {
    if (!this.isAlive(unit) || !this.isAlive(source) || (unit.counterCd || 0) > 0) return;
    unit.counterCd = effect.cooldown || 0;
    const amount = (effect.flat || 0)
      + this.effectivePower(unit) * (effect.power || 0)
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

  healUnit(unit, amount, label = "治疗") {
    if (!unit || !this.isAlive(unit)) return;
    const before = unit.hp;
    unit.hp = Math.min(unit.maxHp, unit.hp + amount);
    const healed = unit.hp - before;
    const overflow = Math.max(0, amount - (unit.maxHp - before));
    if (unit.passive === "afterglowGrace" && overflow > 0) unit.shield += overflow * 0.65;
    if (healed > 0) {
      this.emitSignal({
        kind: "heal",
        tags: this.actionTags(null, ["heal"]).filter(Boolean),
        source: null,
        target: SIGNALS.unitRef(unit),
        amount: healed,
        skillName: label,
        hpBefore: before,
        hpAfter: unit.hp,
        meta: { overflow },
      });
    }
  }

  shield(unit, amount, label) {
    if (!unit || !this.isAlive(unit)) return;
    const bonus = unit.passive === "fortressStance" ? 1.08 + (1 - this.hpRatio(unit)) * 0.12 : 1;
    const value = amount * bonus;
    unit.shield += value;
    this.emitSignal({
      kind: "shield",
      tags: this.actionTags(null, ["shield"]).filter(Boolean),
      source: null,
      target: SIGNALS.unitRef(unit),
      amount: value,
      skillName: label,
      shield: unit.shield,
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

  chooseTarget(unit) {
    const enemies = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    if (!enemies.length) return null;
    const taunters = unit.range < 20 ? enemies.filter((enemy) => enemy.tauntTimer > 0) : [];
    if (taunters.length) return taunters.sort(this.byDistance(unit))[0];
    if (unit.roleName === "刺客") return this.lowestEnemy(unit) || enemies[0];
    const front = enemies.filter((enemy) => enemy.line === "前排");
    const candidates = front.length && unit.range < 30 ? front : enemies;
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

  effectivePower(unit) { return unit.power + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0); }
  statusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slowTimer > 0 ? 2 : 0) + (unit.mark || 0); }
  carryAlly(unit) { return this.alliesOf(unit).filter((ally) => this.isAlive(ally)).sort((a, b) => this.effectivePower(b) - this.effectivePower(a))[0]; }
  lowestEnemy(unit) { return this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
  enemiesOf(unit) { return this.units.filter((item) => item.side !== unit.side); }
  alliesOf(unit) { return this.units.filter((item) => item.side === unit.side); }
  lowestHpAlly(unit) { return this.alliesOf(unit).filter((ally) => this.isAlive(ally)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
  isAlive(unit) { return unit && unit.hp > 0; }
  hpRatio(unit) { return unit.hp / unit.maxHp; }
  getDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  byDistance(unit) { return (a, b) => this.getDistance(unit, a) - this.getDistance(unit, b); }
  isBerserkerUnit(unit) { return unit?.role === "berserker" || unit?.roleName === "狂战士" || unit?.passive === "rageEngine"; }
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
    unit._actionSignal = action;
    try {
      return fn();
    } finally {
      unit._actionSignal = previous;
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
