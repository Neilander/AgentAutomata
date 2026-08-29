const GAME_COMBAT_SIM = (() => {
const SKILL_DATA = typeof window !== "undefined"
  ? window.GAME_SKILL_DATA
  : require("./skill-data");
const SIGNALS = typeof window !== "undefined"
  ? window.GAME_COMBAT_SIGNALS
  : require("./combat-signals");
const RUNTIME_FIELDS = typeof window !== "undefined"
  ? window.GAME_RUNTIME_FIELD_EFFECTS
  : require("./runtime-field-effects");

const MAX_TIME = 75;
const ICON_BASE = "https://game-icons.net/icons/000000/ffffff/1x1/lorc";

const BERSERKER_MODEL = SKILL_DATA.berserkerModel || {};
const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};
const VERDANT_CIRCLE = Object.freeze({
  baseEnemyPowerPerGrowth: 0.55,
  sixPieceEnemyPowerPerGrowth: 1,
  baseAllyHpPerGrowth: 0.04,
  sixPieceAllyHpPerGrowth: 0.05,
  sixPieceSplashRatio: 0.5,
  sixPieceSplashTargets: 2,
  sixPieceOverflowShieldRatio: 1,
  sixPieceNatureOutputMult: 1.35,
  propagatedGrowth: 2,
  spreadCooldown: 6,
});
const MYRIAD_VALOR = Object.freeze({
  powerPerHitRatio: 0.095,
});
const METEOR_FIRE_RAIN = Object.freeze({
  triggerHits: 20,
  strikeCount: 7,
  minDelay: 0.5,
  maxDelay: 1.5,
  radius: 8,
  flatDamage: 28,
  powerRatio: 0.8,
});
const GUARDIAN_ECHO = Object.freeze({
  chance: 0.5,
  radius: 18,
  valueRatio: 0.7,
});
const EAGLE_EYE = Object.freeze({
  lockThreshold: 6,
  quietDelay: 0.9,
  radius: 9,
  volleys: 8,
  flatDamage: 7,
  powerRatio: 0.45,
});
const CAVALRY_CHARGE = Object.freeze({
  distanceThreshold: 16,
  continuityGrace: 0.4,
  readyPowerMult: 1.35,
  readyMoveMult: 1.5,
  breakthroughDistance: 12,
  pathRadius: 4.5,
  flatDamage: 42,
  powerRatio: 2.9,
  blockedDelay: 1.2,
});
const SIGHING_WALL = Object.freeze({
  radius: 13,
  pulseInterval: 20,
  shieldFlat: 55,
  shieldPowerRatio: 0.8,
  interceptStun: 1.4,
});

const FORMATION = {
  left: [{ x: 18, y: 36, line: "前排" }, { x: 18, y: 64, line: "前排" }, { x: 2, y: 32, line: "后排" }, { x: 2, y: 68, line: "后排" }],
  right: [{ x: 82, y: 36, line: "前排" }, { x: 82, y: 64, line: "前排" }, { x: 98, y: 32, line: "后排" }, { x: 98, y: 68, line: "后排" }],
};

function formationSlot(side, index, teamSize) {
  if (teamSize <= 4) return FORMATION[side][index % 4];
  const row = index % 5;
  const column = Math.floor(index / 5);
  const columnCount = Math.ceil(teamSize / 5);
  const x = side === "left" ? 32 - column * 10 : 68 + column * 10;
  return { x, y: 18 + row * 16, line: column < Math.ceil(columnCount / 2) ? "前排" : "后排" };
}

function simulatePresetMatchup(leftKey, rightKey, options = {}) {
  const leftTeam = clonePreset(leftKey);
  const rightTeam = clonePreset(rightKey);
  return simulateTeams(leftTeam, rightTeam, { ...options, seed: `${leftKey}|${rightKey}|${options.seed || 0}` });
}

function simulateTeams(leftTeam, rightTeam, options = {}) {
  const sim = new CombatSimulation(options);
  return sim.run(leftTeam, rightTeam);
}

function simulateWaveTeams(leftTeam, waves, options = {}) {
  const sim = new CombatSimulation(options);
  return sim.runWaves(leftTeam, waves);
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
    this.currentSchoolCast = null;
    this.pendingSetEffects = [];
    this.runtimeFieldEffectId = options.fieldEffectId || options.runtimeFieldEffect || null;
    this.runtimeField = RUNTIME_FIELDS?.createRuntimeField?.(this.runtimeFieldEffectId, this) || null;
    this.obstacles = structuredClone(options.obstacles || []);
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
      alliesInRange: (unit, range) => this.alliesInRange(unit, range),
      isAlive: (unit) => this.isAlive(unit),
      byDistance: (unit) => this.byDistance(unit),
      highestPowerEnemy: (unit) => this.highestPowerEnemy(unit),
      highestSkillHasteEnemy: (unit) => this.highestSkillHasteEnemy(unit),
      backlineLowestEnemy: (unit) => this.backlineLowestEnemy(unit),
      highestStatusAlly: (unit, statusType, range) => this.highestStatusAlly(unit, statusType, range),
      lowestEnemy: (unit) => this.lowestEnemy(unit),
      lowestHpAlly: (unit, range) => this.lowestHpAlly(unit, range),
      carryAlly: (unit, range) => this.carryAlly(unit, range),
      effectivePower: (unit, type) => this.effectivePower(unit, type),
      hpRatio: (unit) => this.hpRatio(unit),
      statusCount: (unit) => this.statusCount(unit),
      counterattack: (...args) => this.counterattack(...args),
      chargeToTarget: (...args) => this.chargeToTarget(...args),
      cavalryDoubleLeap: (...args) => this.startCavalryDoubleLeap(...args),
      cavalryRun: (...args) => this.startCavalryRun(...args),
      cavalryWhirlwind: (...args) => this.startCavalryWhirlwind(...args),
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
    this.pendingSetEffects = [];
    this.units = [...this.makeTeam("left", leftTeam), ...this.makeTeam("right", rightTeam)];
    if (this.randomizeStats) this.applyStatSwing();
    this.runtimeField?.setup?.();

    while (this.time < this.maxTime) {
      this.update(this.dt);
      const left = this.units.some((unit) => unit.side === "left" && this.isAlive(unit));
      const right = this.units.some((unit) => unit.side === "right" && this.isAlive(unit));
      if (!left || !right) break;
    }

    return this.buildResult();
  }

  runWaves(leftTeam, wavesInput) {
    const waves = structuredClone(wavesInput || []);
    const firstSmallWave = waves[0]?.smallWaves?.[0];
    if (!firstSmallWave) return this.run(leftTeam, []);

    this.time = 0;
    this.nextId = 1;
    this.logs = [];
    this.signalBus.clear();
    this.pendingSetEffects = [];
    this.units = [...this.makeTeam("left", leftTeam), ...this.makeTeam("right", firstSmallWave.rightTeam || [])];
    if (this.randomizeStats) this.applyStatSwing();
    this.runtimeField?.setup?.();

    let bigIndex = 0;
    let smallIndex = 0;
    let nextRightIndex = this.units.filter((unit) => unit.side === "right").length;
    const waveSummary = [];
    this.recordWaveEntry(waveSummary, waves[0], firstSmallWave, bigIndex, smallIndex, firstSmallWave.rightTeam?.length || 0);

    while (this.time < this.maxTime) {
      this.update(this.dt);
      const alliesAlive = this.units.some((unit) => unit.side === "left" && this.isAlive(unit));
      if (!alliesAlive) break;

      const enemiesAlive = this.units.filter((unit) => unit.side === "right" && this.isAlive(unit)).length;
      const currentBigWave = waves[bigIndex];
      const currentSmallWave = currentBigWave.smallWaves[smallIndex];
      const nextSmallWave = currentBigWave.smallWaves[smallIndex + 1];
      if (nextSmallWave && enemiesAlive <= (currentSmallWave.spawnWhenRemaining ?? 1)) {
        smallIndex += 1;
        this.addReinforcements("right", nextSmallWave.rightTeam || [], nextRightIndex);
        nextRightIndex += nextSmallWave.rightTeam?.length || 0;
        this.recordWaveEntry(waveSummary, currentBigWave, nextSmallWave, bigIndex, smallIndex, nextSmallWave.rightTeam?.length || 0);
        continue;
      }
      if (enemiesAlive > 0) continue;

      const nextBigWave = waves[bigIndex + 1];
      if (!nextBigWave) break;
      bigIndex += 1;
      smallIndex = 0;
      const openingWave = nextBigWave.smallWaves[0];
      this.addReinforcements("right", openingWave.rightTeam || [], nextRightIndex);
      nextRightIndex += openingWave.rightTeam?.length || 0;
      this.recordWaveEntry(waveSummary, nextBigWave, openingWave, bigIndex, smallIndex, openingWave.rightTeam?.length || 0);
    }

    const finalBigWave = waves[bigIndex];
    const allEntriesStarted = bigIndex === waves.length - 1 && smallIndex === finalBigWave.smallWaves.length - 1;
    const enemiesAlive = this.units.some((unit) => unit.side === "right" && this.isAlive(unit));
    const waveComplete = allEntriesStarted && !enemiesAlive;
    const result = this.buildResult({ waveSummary, waveComplete });
    if (!waveComplete) result.winner = "right";
    return result;
  }

  addReinforcements(side, specs, nextIndex) {
    const incoming = this.makeTeam(side, specs);
    incoming.forEach((unit, index) => {
      unit.index = nextIndex + index;
      unit.id = `${side}-${unit.index + 1}`;
    });
    this.units.push(...incoming);
    return incoming;
  }

  recordWaveEntry(summary, bigWave, smallWave, bigIndex, smallIndex, unitCount) {
    const entry = {
      bigIndex,
      smallIndex,
      bigTitle: bigWave?.title || `Wave ${bigIndex + 1}`,
      title: smallWave?.title || `Wave ${bigIndex + 1}-${smallIndex + 1}`,
      startTitle: smallWave?.startTitle || smallWave?.title || "Enemy reinforcements arrived",
      time: round(this.time),
      unitCount,
    };
    summary.push(entry);
    const target = this.units.find((unit) => unit.side === "right" && unit.index >= this.units.filter((unit) => unit.side === "right").length - unitCount);
    this.emitSignal({
      kind: "status",
      tags: ["status", "wave", "reinforcement"],
      target: SIGNALS.unitRef(target),
      text: entry.startTitle,
      meta: { bigIndex, smallIndex, unitCount, waveTitle: entry.title },
    });
  }

  buildResult(extra = {}) {
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
        kills: unit.kills || 0,
        survivalTime: round(unit.deathTime ?? this.time),
      })),
      signals: this.signalBus.signals,
      summary: this.signalBus.summary(),
      metrics: this.metrics(),
      ...extra,
    };
  }

  makeTeam(side, specs) {
    return specs.map((spec, index) => {
      const role = this.unitProfile(spec);
      const slotIndex = Number.isFinite(spec.slotIndex) ? spec.slotIndex : index;
      const defaultSlot = formationSlot(side, slotIndex, specs.length);
      const slot = {
        x: Number.isFinite(spec.homeX) ? spec.homeX : Number.isFinite(spec.x) ? spec.x : defaultSlot.x,
        y: Number.isFinite(spec.homeY) ? spec.homeY : Number.isFinite(spec.y) ? spec.y : defaultSlot.y,
        line: spec.line || defaultSlot.line,
      };
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
        physicalPower: spec.physicalPower ?? spec.power ?? role.physicalPower ?? role.power,
        magicPower: spec.magicPower ?? spec.power ?? role.magicPower ?? role.power,
        armor: spec.armor ?? role.armor,
        magicResist: spec.magicResist ?? role.magicResist ?? 0,
        moveSpeed: spec.moveSpeed ?? role.moveSpeed ?? 7,
        range: spec.range ?? role.range,
        supportRange: spec.supportRange ?? role.supportRange ?? Infinity,
        attackSpeedMult: spec.attackSpeedMult ?? role.attackSpeedMult ?? 1,
        skillHasteMult: spec.skillHasteMult ?? role.skillHasteMult ?? 1,
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
        shadowBurstCd: 0,
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
        verdantSpreadCd: 0,
        myriadValorStacks: 0,
        myriadValorBasePower: spec.physicalPower ?? spec.power ?? role.power,
        meteorFireHits: 0,
        eagleEyeLock: 0,
        eagleEyeTargetId: null,
        eagleEyeControlLatched: false,
        cavalryDistance: 0,
        cavalryChargeReady: false,
        cavalryChargeContinuityTimer: 0,
        cavalryMovingTimer: 0,
        cavalryLeapState: null,
        cavalryRunState: null,
        cavalryWhirlwindState: null,
        cavalryKillChargeTimer: 0,
        cavalryKillChargeEffect: null,
        cavalryKillChargeDashed: false,
        sighingWallCooldown: 0,
        stunTimer: 0,
        natureSeeds: {},
        assassinFocusTargetId: null,
        lastTargetSignalId: null,
        hiddenRetaliateTimer: 2.2,
        counterCd: 0,
        damageDone: 0,
        kills: 0,
        deathTime: null,
        mark: 0,
        rageStacks: 0,
        icon: spec.icon?.startsWith?.("http") ? spec.icon : `${ICON_BASE}/${spec.icon || role.icon || "crossed-swords"}.svg`,
      };
      this.applyEquipmentSetFoundations(unit);
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
      if (Number.isFinite(effect.magicResistAdd)) unit.magicResist += effect.magicResistAdd;
      if (Number.isFinite(effect.magicResistMult)) unit.magicResist = Math.round(unit.magicResist * effect.magicResistMult);
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
      unit.magicResist = Math.round(unit.magicResist * (0.96 + this.rng() * 0.08));
      unit.skillCd.small1 += this.rng() * 1.2;
      unit.skillCd.small2 += this.rng() * 1.5;
      unit.skillCd.ultimate += this.rng() * 3;
    }
  }

  update(dt) {
    this.time += dt;
    this.tickScheduledSetEffects();
    this.runtimeField?.beforeUpdate?.(dt);
    for (const unit of this.actionOrder()) {
      this.tickStatuses(unit, dt);
      this.tickTimers(unit, dt);
      this.tickEquipmentSetAuras(unit);
      this.handleEagleEyeControl(unit);
      if (unit.stunTimer > 0) continue;
      this.tickCavalryActions(unit, dt);
      const target = this.chooseTarget(unit);
      if (!target) continue;
      this.emitTargetSignal(unit, target);
      if (this.cavalryActionActive(unit)) {
        if (!unit.cavalryWhirlwindState && unit.attackCd <= 0) {
          const nearby = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && this.getDistance(unit, enemy) <= unit.range).sort(this.byDistance(unit))[0];
          if (nearby) this.basicAttack(unit, nearby);
        }
        continue;
      }
      if (unit.cavalryKillChargeTimer > 0) {
        this.tryCavalryKillChargeDash(unit, target);
        if (this.getDistance(unit, target) <= unit.range && unit.attackCd <= 0) this.basicAttack(unit, target);
        else if (this.getDistance(unit, target) > unit.range) this.moveToward(unit, target, dt);
        continue;
      }
      const distance = this.getDistance(unit, target);
      if (distance > unit.range) {
        if (unit.skillCd.ultimate <= 0 && this.skillHasEffect(unit.ultimate, "chargeToTarget")) this.castSlot(unit, "ultimate", target);
        else if (unit.skillCd.small1 <= 0 && this.skillHasEffect(unit.small1, "chargeToTarget")) this.castSlot(unit, "small1", target);
        else if (unit.skillCd.small2 <= 0 && this.skillHasEffect(unit.small2, "chargeToTarget")) this.castSlot(unit, "small2", target);
        else if (unit.skillCd.small1 <= 0 && this.skillHasEffect(unit.small1, "cavalryDoubleLeap") && this.canCastSlot(unit, "small1", target)) this.castSlot(unit, "small1", target);
        else if (unit.skillCd.small2 <= 0 && this.skillHasEffect(unit.small2, "cavalryRun") && this.canCastSlot(unit, "small2", target)) this.castSlot(unit, "small2", target);
        if (this.cavalryActionActive(unit)) continue;
        if (this.getDistance(unit, target) <= unit.range) continue;
        this.moveToward(unit, target, dt);
        continue;
      }
      if (unit.skillCd.ultimate <= 0 && unit.ultimate && this.canCastSlot(unit, "ultimate", target)) this.castSlot(unit, "ultimate", target);
      else if (unit.skillCd.small1 <= 0 && this.canCastSlot(unit, "small1", target)) this.castSlot(unit, "small1", target);
      else if (unit.skillCd.small2 <= 0 && this.canCastSlot(unit, "small2", target)) this.castSlot(unit, "small2", target);
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
    for (const key of ["slowTimer", "guardTimer", "hiddenTimer", "shadowBurstCd", "shieldVulnerableTimer", "tauntTimer", "duelTimer", "hasteTimer", "dotResistTimer", "undyingTimer", "lifeStealTimer", "bonusPowerTimer", "bloodFuryTimer", "whirlwindTimer", "roarFuryTimer", "retaliationTimer", "forcedTargetTimer", "verdantSpreadCd", "sighingWallCooldown", "stunTimer", "cavalryKillChargeTimer"]) {
      unit[key] = Math.max(0, unit[key] - dt);
    }
    if (unit.forcedTargetTimer <= 0) unit.forcedTargetId = null;
    unit.counterCd = Math.max(0, (unit.counterCd || 0) - dt);
    unit.cavalryMovingTimer = Math.max(0, (unit.cavalryMovingTimer || 0) - dt);
    unit.cavalryChargeContinuityTimer = Math.max(0, (unit.cavalryChargeContinuityTimer || 0) - dt);
    if (!unit.cavalryChargeReady
      && (unit.cavalryDistance || 0) > 0
      && unit.cavalryChargeContinuityTimer <= 0
      && !unit.cavalryLeapState
      && !unit.cavalryRunState) {
      this.resetCavalryChargeProgress(unit, "stopped");
    }
  }

  tickStatuses(unit, dt) {
    this.tickDot(unit, unit.poison, dt, 2.1, "poison");
    this.tickDot(unit, unit.burn, dt, 2.15, "burn");
    this.tickNatureSeeds(unit, dt);
  }

  tickEquipmentSetAuras(unit) {
    if (!unit?.mechanicModifiers?.["set:sighingWall:unyieldingBoundary"] || (unit.sighingWallCooldown || 0) > 0) return;
    unit.sighingWallCooldown = SIGHING_WALL.pulseInterval;
    const allies = this.alliesOf(unit).filter((ally) => this.isAlive(ally) && this.getDistance(unit, ally) <= SIGHING_WALL.radius);
    const amount = SIGHING_WALL.shieldFlat + this.effectivePower(unit, "magic") * SIGHING_WALL.shieldPowerRatio;
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "sighingWall", "wallPulse"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(unit),
      amount: allies.length,
      skillName: "叹息之墙",
      meta: { radius: SIGHING_WALL.radius, interval: SIGHING_WALL.pulseInterval, targets: allies.map(SIGNALS.unitRef) },
    });
    this.withAction(unit, { tags: ["equipmentSet", "sighingWall", "wallPulse", "shield", "area"], skillName: "叹息之墙" }, () => {
      for (const ally of allies) this.shield(ally, amount, "叹息之墙", unit);
    });
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

  applyEquipmentSetFoundations(unit) {
    if (!unit.mechanicModifiers?.["set:cavalryCharge:foundation"]) return;
    const moveSpeed = Math.max(0, Number(unit.mechanicModifiers.moveSpeed) || 0) / 100;
    const conversion = Math.max(0, Number(unit.mechanicModifiers.moveSpeedAttackConversion) || 0) / 100;
    unit.cavalryMoveSpeedMult = 1 + moveSpeed;
    unit.attackSpeedMult *= 1 + moveSpeed * conversion;
    unit.cavalryMovingDamageReduction = clamp((Number(unit.mechanicModifiers.movingDamageReduction) || 0) / 100, 0, 0.8);
  }

  tickNatureSeeds(unit, dt) {
    for (const [sourceId, seed] of Object.entries(unit.natureSeeds || {})) {
      seed.time = Math.max(0, seed.time - dt);
      if (seed.time > 0) continue;
      const source = this.units.find((candidate) => candidate.id === sourceId);
      delete unit.natureSeeds[sourceId];
      if (source) this.bloomNatureSeed(source, unit, seed, false);
    }
  }

  touchSchoolTarget(source, target) {
    const context = this.currentSchoolCast;
    if (!source || !target || context?.school !== "nature" || context.sourceId !== source.id) return;
    if (!source.mechanicModifiers?.["set:verdantCircle:sowing"]) return;
    if (context.touchedTargetIds.has(target.id)) return;
    context.touchedTargetIds.add(target.id);

    const seeds = target.natureSeeds || (target.natureSeeds = {});
    const existing = seeds[source.id];
    if (!existing) {
      seeds[source.id] = { sourceId: source.id, growth: 1, time: 6, canSpread: true, setId: "verdantCircle" };
      this.emitNatureSeedSignal("seedPlant", source, target, seeds[source.id]);
      return;
    }

    existing.growth = Math.min(3, existing.growth + 1);
    existing.time = 6;
    this.emitNatureSeedSignal("seedGrow", source, target, existing);
    if (existing.growth < 3 || !source.mechanicModifiers?.["set:verdantCircle:propagation"]) return;
    delete seeds[source.id];
    this.bloomNatureSeed(source, target, existing, true);
  }

  bloomNatureSeed(source, target, seed, immediate) {
    if (!source || !target || !this.isAlive(target)) return;
    const growth = Math.max(1, Math.min(3, Number(seed.growth) || 1));
    const sixPiece = Boolean(source.mechanicModifiers?.["set:verdantCircle:propagation"]);
    this.emitNatureSeedSignal("seedBloom", source, target, seed, { immediate });
    this.withAction(source, { tags: ["equipmentSet", "verdantCircle", "nature", "seedBloom"], skillName: "繁生之环·绽放", meta: { growth, immediate } }, () => {
      if (source.side === target.side) {
        const healRatio = sixPiece ? VERDANT_CIRCLE.sixPieceAllyHpPerGrowth : VERDANT_CIRCLE.baseAllyHpPerGrowth;
        const overflow = this.healUnit(target, target.maxHp * healRatio * growth, "繁生之环·绽放", source);
        if (sixPiece && overflow > 0) this.shield(target, overflow * VERDANT_CIRCLE.sixPieceOverflowShieldRatio, "繁生之环·余蕴", source);
      } else {
        const powerRatio = sixPiece ? VERDANT_CIRCLE.sixPieceEnemyPowerPerGrowth : VERDANT_CIRCLE.baseEnemyPowerPerGrowth;
        const bloomDamage = this.effectivePower(source, "magic") * powerRatio * growth;
        this.takeDamage(source, target, bloomDamage, "nature", "繁生之环·绽放");
        if (sixPiece && growth >= 3) {
          this.units
            .filter((candidate) => candidate.side === target.side && candidate.id !== target.id && this.isAlive(candidate))
            .sort(this.byDistance(target))
            .slice(0, VERDANT_CIRCLE.sixPieceSplashTargets)
            .forEach((candidate) => this.takeDamage(source, candidate, bloomDamage * VERDANT_CIRCLE.sixPieceSplashRatio, "nature", "繁生之环·花潮"));
        }
      }
    });
    if (!immediate || !seed.canSpread || (source.verdantSpreadCd || 0) > 0) return;
    const spreadTarget = this.units
      .filter((candidate) => candidate.side === target.side && candidate.id !== target.id && this.isAlive(candidate) && !candidate.natureSeeds?.[source.id])
      .sort(this.byDistance(target))[0];
    if (!spreadTarget) return;
    source.verdantSpreadCd = VERDANT_CIRCLE.spreadCooldown;
    spreadTarget.natureSeeds[source.id] = { sourceId: source.id, growth: VERDANT_CIRCLE.propagatedGrowth, time: 6, canSpread: false, setId: "verdantCircle" };
    this.emitNatureSeedSignal("seedSpread", source, spreadTarget, spreadTarget.natureSeeds[source.id], { origin: SIGNALS.unitRef(target) });
  }

  emitNatureSeedSignal(action, source, target, seed, extraMeta = {}) {
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "verdantCircle", "nature", "natureSeed", action],
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: seed.growth,
      skillName: action === "seedPlant" ? "繁生之环·播种" : action === "seedGrow" ? "繁生之环·生长" : action === "seedSpread" ? "繁生之环·传播" : "繁生之环·绽放",
      meta: { growth: seed.growth, duration: seed.time, canSpread: seed.canSpread, setId: seed.setId, ...extraMeta },
    });
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
      meta: { slot, role: unit.roleName, school: skill.school || null },
    });
    const previousSchoolCast = this.currentSchoolCast;
    this.currentSchoolCast = skill.school ? { school: skill.school, sourceId: unit.id, touchedTargetIds: new Set() } : null;
    try {
      this.withAction(unit, { tags: ["skill", slot === "ultimate" ? "ultimate" : "smallSkill", skill.school || ""].filter(Boolean), skillKey: unit[slot], skillName: skill.name, meta: { school: skill.school || null } }, () => {
        skill.cast({ unit, target, visual: false });
      });
    } finally {
      this.currentSchoolCast = previousSchoolCast;
    }
    unit.skillCd[slot] = skill.cooldown;
    if (slot === "ultimate") this.triggerEncore(unit);
  }

  canCastSlot(unit, slot, target = null) {
    const skillKey = unit?.[slot];
    const effects = SKILL_DATA.skills[skillKey]?.effects || [];
    const doubleLeap = effects.find((effect) => effect.kind === "cavalryDoubleLeap");
    if (doubleLeap) {
      if (!target || !this.isAlive(target) || target.hiddenTimer > 0) return false;
      return this.getDistance(unit, target) <= (doubleLeap.triggerRange || ((doubleLeap.distance || 10) * 2 + (doubleLeap.radius || 11)));
    }
    const run = effects.find((effect) => effect.kind === "cavalryRun");
    if (run) return Boolean(this.cavalryMovementTarget(unit, target));
    const whirlwind = effects.find((effect) => effect.kind === "cavalryWhirlwind");
    if (!whirlwind) return true;
    const radius = whirlwind.radius || 14;
    return this.enemiesOf(unit).some((enemy) => this.isAlive(enemy) && this.getDistance(unit, enemy) <= radius);
  }

  cavalryActionActive(unit) {
    return Boolean(unit?.cavalryLeapState || unit?.cavalryRunState || unit?.cavalryWhirlwindState);
  }

  cavalryDirection(unit, target) {
    const distance = target ? this.getDistance(unit, target) : 0;
    if (distance > 0) return { x: (target.x - unit.x) / distance, y: (target.y - unit.y) / distance };
    return { x: unit.side === "left" ? 1 : -1, y: 0 };
  }

  startCavalryDoubleLeap(unit, target, effect = {}) {
    if (!unit || this.cavalryActionActive(unit)) return;
    unit.cavalryLeapState = {
      effect: structuredClone(effect),
      direction: this.cavalryDirection(unit, target),
      elapsed: 0,
      landings: 0,
    };
  }

  startCavalryRun(unit, target, effect = {}) {
    if (!unit || this.cavalryActionActive(unit)) return;
    const runTarget = this.cavalryMovementTarget(unit, target);
    if (!runTarget) return;
    unit.cavalryRunState = {
      effect: structuredClone(effect),
      targetId: runTarget.id,
      direction: this.cavalryDirection(unit, runTarget),
      enteredChargeState: false,
      elapsed: 0,
      pulseDistance: 0,
      pulses: 0,
      start: { x: unit.x, y: unit.y },
    };
  }

  startCavalryWhirlwind(unit, _target, effect = {}) {
    if (!unit || this.cavalryActionActive(unit)) return;
    unit.cavalryWhirlwindState = {
      effect: structuredClone(effect),
      elapsed: 0,
      nextTick: 0,
      ticks: 0,
    };
  }

  tickCavalryActions(unit, dt) {
    if (unit.cavalryLeapState) this.tickCavalryDoubleLeap(unit, dt);
    else if (unit.cavalryRunState) this.tickCavalryRun(unit, dt);
    else if (unit.cavalryWhirlwindState) this.tickCavalryWhirlwind(unit, dt);
  }

  tickCavalryDoubleLeap(unit, dt) {
    const state = unit.cavalryLeapState;
    if (!state) return;
    state.elapsed += dt;
    const effect = state.effect;
    const landingTimes = effect.landingTimes || [0.24, 1];
    while (state.landings < 2 && state.elapsed + 1e-9 >= (landingTimes[state.landings] ?? state.landings * 0.75)) {
      const before = { x: unit.x, y: unit.y };
      unit.x = clamp(unit.x + state.direction.x * (effect.distance || 13), 7, 93);
      unit.y = clamp(unit.y + state.direction.y * (effect.distance || 13), 12, 88);
      this.recordCavalryMovement(unit, before, unit, "skillLeap");
      state.landings += 1;
      const targets = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && this.getDistance(unit, enemy) <= (effect.radius || 11));
      this.withAction(unit, { tags: ["skill", "smallSkill", "cavalry", "leap", "movement", "physical", "area"], skillKey: unit.small1, skillName: effect.label || "铁蹄震地", meta: { landing: state.landings, radius: effect.radius || 11 } }, () => {
        for (const enemy of targets) this.hit(unit, enemy, (effect.flat || 0) + this.effectivePower(unit, "physical") * (effect.power || 0), effect.type || "physical", effect.label || "铁蹄震地", false, "physical");
      });
      this.emitSignal({
        kind: "movement",
        tags: ["movement", "skill", "cavalry", "leap", `landing${state.landings}`],
        source: SIGNALS.unitRef(unit),
        target: SIGNALS.unitRef(unit),
        amount: round(this.getDistance(before, unit)),
        skillKey: unit.small1,
        skillName: "二连跃",
        meta: { before, after: { x: unit.x, y: unit.y }, landing: state.landings, targets: targets.map(SIGNALS.unitRef) },
      });
    }
    if (state.elapsed >= (effect.duration || 1.6)) unit.cavalryLeapState = null;
  }

  tickCavalryRun(unit, dt) {
    const state = unit.cavalryRunState;
    if (!state) return;
    state.elapsed += dt;
    const before = { x: unit.x, y: unit.y };
    const fieldMoveMult = this.runtimeField?.moveSpeedMult?.(unit) ?? 1;
    const setMoveMult = unit.cavalryMoveSpeedMult || 1;
    const slowMoveMult = unit.slowTimer > 0 && unit.roleName !== "刺客" ? 0.6 : 1;
    const step = unit.moveSpeed * (state.effect.speedMult || 1) * setMoveMult * fieldMoveMult * slowMoveMult * dt;
    const plannedEnd = {
      x: clamp(unit.x + state.direction.x * step, 7, 93),
      y: clamp(unit.y + state.direction.y * step, 12, 88),
    };
    const wall = this.findSighingWallInterceptor(unit, before, plannedEnd);
    if (wall) {
      unit.cavalryRunState = null;
      this.interruptChargeAtWall(unit, wall, "skillRun", before, plannedEnd);
      return;
    }
    unit.x = plannedEnd.x;
    unit.y = plannedEnd.y;
    const moved = this.getDistance(before, unit);
    const wasChargeReady = unit.cavalryChargeReady;
    this.recordCavalryMovement(unit, before, unit, "skillRun");
    const enteredChargeStateDuringMovement = !wasChargeReady && unit.cavalryChargeReady;
    state.enteredChargeState = state.enteredChargeState || enteredChargeStateDuringMovement;
    state.pulseDistance += moved;
    const pulseThreshold = Math.max(0.1, Number(state.effect.pulseDistance) || 3);
    while (state.pulseDistance + 1e-9 >= pulseThreshold) {
      state.pulseDistance -= pulseThreshold;
      state.pulses += 1;
      this.triggerCavalryRunPulse(unit, state.effect, state.pulses);
    }
    if (state.elapsed >= (state.effect.duration || 1.2)) {
      this.emitSignal({
        kind: "movement",
        tags: ["movement", "skill", "cavalry", "run"],
        source: SIGNALS.unitRef(unit),
        target: SIGNALS.unitRef(unit),
        amount: round(this.getDistance(state.start, unit)),
        skillKey: unit.small2,
        skillName: state.effect.label || "奔跑",
        meta: { before: state.start, after: { x: unit.x, y: unit.y }, duration: state.elapsed, enteredChargeState: state.enteredChargeState, pulses: state.pulses },
      });
      unit.cavalryRunState = null;
    }
  }

  triggerCavalryRunPulse(unit, effect = {}, pulse = 1) {
    const radius = Math.max(0, Number(effect.radius) || 8);
    const targets = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && this.getDistance(unit, enemy) <= radius);
    const label = effect.pulseLabel || "奔踏震击";
    this.emitSignal({
      kind: "status",
      tags: ["status", "skill", "cavalry", "runPulse", "area"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(unit),
      amount: targets.length,
      skillKey: unit.small2,
      skillName: label,
      meta: { pulse, radius, targets: targets.map(SIGNALS.unitRef) },
    });
    this.withAction(unit, { tags: ["skill", "smallSkill", "cavalry", "runPulse", "physical", "area"], skillKey: unit.small2, skillName: label, meta: { pulse, radius } }, () => {
      for (const enemy of targets) {
        this.hit(unit, enemy, (effect.flat || 0) + this.effectivePower(unit, "physical") * (effect.power || 0), "physical", label, false, "physical");
        if (!this.isAlive(enemy) || this.rng() >= (Number(effect.stunChance) || 0)) continue;
        const duration = Math.max(0, Number(effect.stunDuration) || 0);
        enemy.stunTimer = Math.max(enemy.stunTimer || 0, duration);
        this.emitSignal({
          kind: "status",
          tags: ["status", "debuff", "stun", "skill", "cavalry", "runPulse"],
          source: SIGNALS.unitRef(unit),
          target: SIGNALS.unitRef(enemy),
          amount: duration,
          skillKey: unit.small2,
          skillName: label,
          meta: { pulse, chance: effect.stunChance || 0, duration },
        });
      }
    });
  }

  tickCavalryWhirlwind(unit, dt) {
    const state = unit.cavalryWhirlwindState;
    if (!state) return;
    state.elapsed += dt;
    const effect = state.effect;
    while (state.elapsed + 1e-9 >= state.nextTick && state.nextTick < (effect.duration || 4.8)) {
      const targets = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && this.getDistance(unit, enemy) <= (effect.radius || 14));
      this.withAction(unit, { tags: ["skill", "ultimate", "cavalry", "whirlwind", "physical", "area"], skillKey: unit.ultimate, skillName: effect.label || "风卷残云", meta: { tick: state.ticks + 1, radius: effect.radius || 14 } }, () => {
        for (const enemy of targets) this.hit(unit, enemy, (effect.flat || 0) + this.effectivePower(unit, "physical") * (effect.power || 0), effect.type || "physical", effect.label || "风卷残云", false, "physical");
      });
      state.ticks += 1;
      state.nextTick += effect.interval || 0.6;
    }
    if (state.elapsed >= (effect.duration || 4.8)) unit.cavalryWhirlwindState = null;
  }

  tryCavalryKillChargeDash(unit, target) {
    const effect = unit?.cavalryKillChargeEffect;
    target = this.cavalryMovementTarget(unit, target);
    if (!effect || unit.cavalryKillChargeDashed || !target || !this.isAlive(target)) return false;
    const distance = this.getDistance(unit, target);
    if (distance <= unit.range) return false;
    const direction = this.cavalryDirection(unit, target);
    const move = Math.min(effect.dashDistance || 24, Math.max(0, distance - unit.range * 0.82));
    const before = { x: unit.x, y: unit.y };
    unit.x = clamp(unit.x + direction.x * move, 7, 93);
    unit.y = clamp(unit.y + direction.y * move, 12, 88);
    unit.cavalryKillChargeDashed = true;
    unit.attackCd = Math.min(unit.attackCd, 0.12);
    this.recordCavalryMovement(unit, before, unit, "passiveCharge");
    this.emitSignal({
      kind: "movement",
      tags: ["movement", "passive", "cavalry", "charge"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      amount: round(this.getDistance(before, unit)),
      skillKey: unit.passive,
      skillName: effect.label || "乘胜冲锋",
      meta: { before, after: { x: unit.x, y: unit.y } },
    });
    return true;
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
    if (unit.cavalryKillChargeTimer > 0 && unit.cavalryKillChargeEffect) {
      const effect = unit.cavalryKillChargeEffect;
      amount += (effect.bonusFlat || 0) + power * (effect.bonusPower || 0);
      label = effect.label || "乘胜冲锋";
      unit.cavalryKillChargeTimer = 0;
      unit.cavalryKillChargeEffect = null;
      unit.cavalryKillChargeDashed = false;
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
      for (const effect of this.passiveEffects(unit, "basicAttackMarkBurst")) {
        if (!this.isAlive(target) || !(unit.hiddenTimer > 0) || (unit.shadowBurstCd || 0) > 0) continue;
        if ((target.mark || 0) < (effect.minMark || 5)) continue;
        const consumed = Math.min(target.mark || 0, effect.consumeMark || effect.minMark || 5);
        target.mark = Math.max(0, (target.mark || 0) - consumed);
        unit.shadowBurstCd = effect.cooldown || 1.1;
        unit.hiddenTimer = Math.max(unit.hiddenTimer || 0, effect.hiddenDuration || 1.2);
        if (effect.guardDuration) unit.guardTimer = Math.max(unit.guardTimer || 0, effect.guardDuration);
        this.withAction(unit, { tags: ["passive", "markBurst", "hidden"], skillKey: unit.passive, skillName: effect.label || "影标爆发" }, () => {
          const power = this.effectivePower(unit, effect.scaleWith || "physical");
          this.hit(unit, target, (effect.flat || 0) + power * (effect.power || 0) + consumed * (effect.perMark || 0), effect.type || "physical", effect.label || "影标爆发", false, effect.scaleWith || "physical");
        });
        this.emitSignal({
          kind: "status",
          tags: this.actionTags(unit, ["status", "buff", "hidden", "markBurst"]).filter(Boolean),
          source: SIGNALS.unitRef(unit),
          target: SIGNALS.unitRef(target),
          amount: consumed,
          skillKey: unit.passive,
          skillName: effect.label || "影标爆发",
          meta: { consumed, targetMark: target.mark || 0, hiddenDuration: unit.hiddenTimer },
        });
      }
      for (const effect of this.passiveEffects(unit, "basicAttackHiddenExtend")) {
        if (!(unit.hiddenTimer > 0)) continue;
        if ((target.mark || 0) < (effect.minMark || 1)) continue;
        const beforeHidden = unit.hiddenTimer;
        unit.hiddenTimer = Math.min(effect.maxHidden || 4, unit.hiddenTimer + (effect.extend || 0.2));
        if (effect.guardDuration) unit.guardTimer = Math.max(unit.guardTimer || 0, effect.guardDuration);
        if (unit.hiddenTimer > beforeHidden) {
          this.emitSignal({
            kind: "status",
            tags: this.actionTags(unit, ["status", "buff", "hidden", "extend", "basic"]).filter(Boolean),
            source: SIGNALS.unitRef(unit),
            target: SIGNALS.unitRef(unit),
            amount: round(unit.hiddenTimer - beforeHidden),
            skillKey: unit.passive,
            skillName: effect.label || "影势续隐",
            meta: { beforeHidden, afterHidden: unit.hiddenTimer, targetMark: target.mark || 0, guardDuration: effect.guardDuration || 0 },
          });
        }
      }
      for (const effect of this.passiveEffects(unit, "basicAttackCooldownRefund")) {
        if (effect.requiresHidden !== false && !(unit.hiddenTimer > 0)) continue;
        if (Number.isFinite(effect.minHiddenRemaining) && (unit.hiddenTimer || 0) < effect.minHiddenRemaining) continue;
        if ((target.mark || 0) < (effect.minMark || 0)) continue;
        const speedBonus = Math.max(0, (unit.attackSpeedMult || 1) - 1);
        const refunded = {};
        for (const [slot, field] of [["small1", "small1Refund"], ["small2", "small2Refund"], ["ultimate", "ultimateRefund"]]) {
          const speedField = `${field}PerAttackSpeedBonus`;
          const amount = (effect[field] || 0) + speedBonus * (effect[speedField] || 0);
          if (amount <= 0 || !unit.skillCd?.[slot]) continue;
          const beforeCd = unit.skillCd[slot];
          unit.skillCd[slot] = Math.max(0, beforeCd - amount);
          const delta = beforeCd - unit.skillCd[slot];
          if (delta > 0) refunded[slot] = round(delta);
        }
        const totalRefund = Object.values(refunded).reduce((sum, value) => sum + value, 0);
        if (totalRefund > 0) {
          this.emitSignal({
            kind: "status",
            tags: this.actionTags(unit, ["status", "buff", "cooldownRefund", "basic", "hidden"]).filter(Boolean),
            source: SIGNALS.unitRef(unit),
            target: SIGNALS.unitRef(unit),
            amount: round(totalRefund),
            skillKey: unit.passive,
            skillName: effect.label || "影刃回环",
            meta: { refunded, enemy: SIGNALS.unitRef(target), targetMark: target.mark || 0 },
          });
          const cutPower = effect.cutPower || 0;
          const cutSpeedPower = effect.cutPowerPerAttackSpeedBonus || 0;
          const cutFlat = effect.cutFlat || 0;
          if (cutFlat > 0 || cutPower > 0 || cutSpeedPower > 0) {
            const power = this.effectivePower(unit, effect.cutScaleWith || "physical");
            const cutAmount = cutFlat + power * cutPower + power * speedBonus * cutSpeedPower;
            if (cutAmount > 0) this.hit(unit, target, cutAmount, effect.cutType || "physical", effect.cutLabel || effect.label || "影刃切割", false, effect.cutScaleWith || "physical");
          }
        }
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
    this.touchSchoolTarget(source, target);
    let value = amount + this.effectivePower(source, scaleWith) * 0.04;
    if (source.passive === "lineBreaker" && target.line === "前排") value *= 1.06;
    if (source.passive === "rageEngine") value *= 1 + (1 - this.hpRatio(source)) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
    if (source.passive === "executionSense" && (this.hpRatio(target) < 0.38 || this.statusCount(target) > 0)) value *= 1.06;
    if (source.passive === "duelistFocus") value *= 1 + (target.mark || 0) * 0.045;
    if (source.passive === "catalyst" && this.statusCount(target) > 0) value *= 1.06;
    value *= SKILL_DATA.passiveDamageMultiplier?.(source, target, this.api()) || 1;
    if (target.guardTimer > 0) value *= 0.72;
    const context = { amount: value, type, label, visual, scaleWith };
    this.runtimeField?.beforeHit?.(source, target, context);
    value = context.amount;
    const directDefense = type === "physical" ? target.armor : target.magicResist;
    const mitigated = Math.max(1, value - directDefense * 0.72);
    if (source?.hiddenTimer > 0 && this.isAlive(target)) {
      target.forcedTargetId = source.id;
      target.forcedTargetTimer = Math.max(target.forcedTargetTimer || 0, source.hiddenRetaliateTimer ?? 2.2);
    }
    this.takeDamage(source, target, mitigated, type, label);
  }

  takeDamage(source, target, amount, type, label = "") {
    if (!this.isAlive(target)) return;
    const hpBefore = target.hp;
    const natureAction = type === "nature" || type === "poison" || source?._actionSignal?.tags?.includes("nature");
    if (natureAction && source?.mechanicModifiers?.["set:verdantCircle:propagation"] && !source?._actionSignal?.tags?.includes("equipmentSet")) {
      amount *= VERDANT_CIRCLE.sixPieceNatureOutputMult;
    }
    if (target.cavalryLeapState) {
      const reduction = clamp(Number(target.cavalryLeapState.effect?.damageReduction) || 0, 0, 0.8);
      const prevented = amount * reduction;
      amount -= prevented;
      if (prevented > 0) this.emitSignal({
        kind: "status",
        tags: ["status", "skill", "cavalry", "leap", "damageReduction"],
        source: SIGNALS.unitRef(target),
        target: SIGNALS.unitRef(target),
        amount: prevented,
        skillKey: target.small1,
        skillName: "二连跃",
        meta: { reduction },
      });
    }
    if (target.cavalryMovingTimer > 0 && target.mechanicModifiers?.["set:cavalryCharge:foundation"]) {
      const prevented = amount * (target.cavalryMovingDamageReduction || 0);
      amount -= prevented;
      if (prevented > 0) this.emitSignal({
        kind: "status",
        tags: ["status", "equipmentSet", "cavalryCharge", "movingDamageReduction"],
        source: SIGNALS.unitRef(target),
        target: SIGNALS.unitRef(target),
        amount: prevented,
        skillName: "驰骋减伤",
        meta: { reduction: target.cavalryMovingDamageReduction },
      });
    }
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
    if (remaining > 0 || blocked > 0) this.growMyriadValor(source, target);
    if (remaining > 0 || blocked > 0) this.countMeteorFireHit(source, target, type);
    if (remaining > 0 || blocked > 0) this.buildEagleEyeLock(source, target);
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
    this.runtimeField?.afterDamage?.(source, target, { amount, remaining, blocked, type, label, hpBefore, hpAfter: target.hp });
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
    if (!unit || !this.isAlive(unit)) return 0;
    this.touchSchoolTarget(source, unit);
    const context = { amount, label };
    this.runtimeField?.beforeHeal?.(source, unit, context);
    amount = context.amount;
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
      this.maybeGuardianEcho("heal", source, unit, { amount: value * GUARDIAN_ECHO.valueRatio, label });
    }
    return overflow;
  }

  growMyriadValor(source, target) {
    if (!source || !target || source.side === target.side || !this.isAlive(source)) return;
    if (!source.mechanicModifiers?.["set:myriadValor:battleGrowth"]) return;
    if (source._actionSignal?.tags?.includes("equipmentSet")) return;
    source.myriadValorStacks = (source.myriadValorStacks || 0) + 1;
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "buff", "equipmentSet", "myriadValor", "battleGrowth"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(source),
      amount: source.myriadValorStacks,
      skillName: "万夫之勇",
      meta: {
        stacks: source.myriadValorStacks,
        hitTarget: SIGNALS.unitRef(target),
        physicalPowerGain: round((source.myriadValorBasePower || source.physicalPower || 0) * MYRIAD_VALOR.powerPerHitRatio * source.myriadValorStacks),
      },
    });
  }

  countMeteorFireHit(source, target, type) {
    if (!source || !target || source.side === target.side || !this.isAlive(source)) return;
    if (!source.mechanicModifiers?.["set:meteorFireRain:skyfall"]) return;
    if (!['fire', 'burn'].includes(type)) return;
    if (source._actionSignal?.tags?.includes("equipmentSet") || source._actionSignal?.tags?.includes("meteorRain")) return;
    source.meteorFireHits = (source.meteorFireHits || 0) + 1;
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "equipmentSet", "meteorFireRain", "fireCount"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: source.meteorFireHits,
      skillName: "流星火雨·蓄势",
      meta: { fireHits: source.meteorFireHits, triggerHits: METEOR_FIRE_RAIN.triggerHits },
    });
    while (source.meteorFireHits >= METEOR_FIRE_RAIN.triggerHits) {
      source.meteorFireHits -= METEOR_FIRE_RAIN.triggerHits;
      this.scheduleMeteorFireRain(source);
    }
  }

  scheduleMeteorFireRain(source) {
    const enemies = this.enemiesOf(source).filter((enemy) => this.isAlive(enemy));
    if (!enemies.length) return;
    for (let index = 0; index < METEOR_FIRE_RAIN.strikeCount; index += 1) {
      const anchor = enemies[index % enemies.length];
      const position = {
        x: round(clamp(anchor.x + (this.rng() - 0.5) * 8, 7, 93)),
        y: round(clamp(anchor.y + (this.rng() - 0.5) * 8, 12, 88)),
      };
      const delay = METEOR_FIRE_RAIN.minDelay + this.rng() * (METEOR_FIRE_RAIN.maxDelay - METEOR_FIRE_RAIN.minDelay);
      const strike = { kind: "meteor", sourceId: source.id, position, dueAt: this.time + delay, index: index + 1 };
      this.pendingSetEffects.push(strike);
      this.emitSignal({
        kind: "status",
        tags: ["status", "equipmentSet", "meteorFireRain", "meteorWarning"],
        source: SIGNALS.unitRef(source),
        amount: round(delay),
        skillName: "流星火雨·落点",
        meta: { index: strike.index, position, delay: round(delay), dueAt: round(strike.dueAt), radius: METEOR_FIRE_RAIN.radius },
      });
    }
  }

  tickScheduledSetEffects() {
    if (!this.pendingSetEffects.length) return;
    const ready = this.pendingSetEffects.filter((effect) => effect.dueAt <= this.time);
    this.pendingSetEffects = this.pendingSetEffects.filter((effect) => effect.dueAt > this.time);
    for (const effect of ready) {
      if (effect.kind === "skyArrow") {
        this.resolveSkyArrowZone(effect);
        continue;
      }
      const source = this.units.find((unit) => unit.id === effect.sourceId);
      if (!source) continue;
      const targets = this.enemiesOf(source).filter((target) => this.isAlive(target) && this.getDistance(effect.position, target) <= METEOR_FIRE_RAIN.radius);
      this.emitSignal({
        kind: "status",
        tags: ["status", "equipmentSet", "meteorFireRain", "meteorImpact"],
        source: SIGNALS.unitRef(source),
        amount: targets.length,
        skillName: "流星火雨",
        meta: { index: effect.index, position: effect.position, radius: METEOR_FIRE_RAIN.radius, targets: targets.map(SIGNALS.unitRef) },
      });
      this.withAction(source, { tags: ["equipmentSet", "meteorFireRain", "meteorRain", "fire", "area"], skillName: "流星火雨", meta: { position: effect.position, radius: METEOR_FIRE_RAIN.radius } }, () => {
        for (const target of targets) {
          this.hit(source, target, METEOR_FIRE_RAIN.flatDamage + this.effectivePower(source, "magic") * METEOR_FIRE_RAIN.powerRatio, "fire", "流星火雨", false, "magic");
        }
      });
    }
  }

  buildEagleEyeLock(source, target) {
    if (!source || !target || source.side === target.side || !this.isAlive(source)) return;
    if (!source.mechanicModifiers?.["set:eagleEye:skyArrow"]) return;
    if (source._actionSignal?.tags?.includes("equipmentSet")) return;
    if (source.eagleEyeTargetId && source.eagleEyeTargetId !== target.id) this.resetEagleEyeLock(source, "targetChanged");
    source.eagleEyeTargetId = target.id;
    const gain = source._actionSignal?.tags?.includes("trap") ? 2 : 1;
    source.eagleEyeLock = (source.eagleEyeLock || 0) + gain;
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "equipmentSet", "eagleEye", "lockGain"]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: gain,
      skillName: "鹰眼校准",
      meta: { lock: source.eagleEyeLock, threshold: EAGLE_EYE.lockThreshold, gain },
    });
    if (source.eagleEyeLock < EAGLE_EYE.lockThreshold) return;
    source.eagleEyeLock -= EAGLE_EYE.lockThreshold;
    this.scheduleSkyArrow(source, target);
  }

  resetEagleEyeLock(source, reason) {
    if (!source || !(source.eagleEyeLock > 0)) return;
    const before = source.eagleEyeLock;
    source.eagleEyeLock = 0;
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "eagleEye", "lockReset"],
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(source),
      amount: before,
      skillName: "鹰眼校准·中断",
      meta: { reason, lockBefore: before },
    });
  }

  handleEagleEyeControl(unit) {
    if (!unit?.mechanicModifiers?.["set:eagleEye:skyArrow"]) return;
    const controlled = (unit.slowTimer || 0) > 0 || (unit.tauntTimer || 0) > 0;
    if (controlled && !unit.eagleEyeControlLatched) this.resetEagleEyeLock(unit, "controlled");
    unit.eagleEyeControlLatched = controlled;
  }

  scheduleSkyArrow(source, target) {
    const position = { x: round(target.x), y: round(target.y) };
    this.pendingSetEffects.push({ kind: "skyArrow", sourceId: source.id, position, dueAt: this.time + EAGLE_EYE.quietDelay });
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "eagleEye", "skyArrowWarning"],
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(target),
      amount: EAGLE_EYE.quietDelay,
      skillName: "天穹之箭·锁定",
      meta: { position, delay: EAGLE_EYE.quietDelay, radius: EAGLE_EYE.radius },
    });
  }

  resolveSkyArrowZone(effect) {
    const source = this.units.find((unit) => unit.id === effect.sourceId);
    if (!source) return;
    const targets = this.enemiesOf(source).filter((target) => this.isAlive(target) && this.getDistance(effect.position, target) <= EAGLE_EYE.radius);
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "eagleEye", "skyArrowImpact"],
      source: SIGNALS.unitRef(source),
      amount: targets.length,
      skillName: "天穹之箭",
      meta: { position: effect.position, radius: EAGLE_EYE.radius, volleys: EAGLE_EYE.volleys, targets: targets.map(SIGNALS.unitRef) },
    });
    this.withAction(source, { tags: ["equipmentSet", "eagleEye", "skyArrow", "physical", "area"], skillName: "天穹之箭", meta: { position: effect.position, volleys: EAGLE_EYE.volleys } }, () => {
      for (let volley = 0; volley < EAGLE_EYE.volleys; volley += 1) {
        for (const target of targets) this.hit(source, target, EAGLE_EYE.flatDamage + this.effectivePower(source, "physical") * EAGLE_EYE.powerRatio, "physical", "天穹之箭", false, "physical");
      }
    });
  }

  shield(unit, amount, label, source = this.currentActionSource) {
    if (!unit || !this.isAlive(unit)) return;
    this.touchSchoolTarget(source, unit);
    const context = { amount, label };
    this.runtimeField?.beforeShield?.(source, unit, context);
    amount = context.amount;
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
    this.runtimeField?.afterShield?.(source, unit, { amount: value, label, shield: unit.shield });
    this.maybeGuardianEcho("shield", source, unit, { amount: value * GUARDIAN_ECHO.valueRatio, label });
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
    this.maybeGuardianEcho("cleanse", source, target, { statusType, amount, label });
    return cleared;
  }

  maybeGuardianEcho(kind, source, anchor, payload = {}) {
    if (!source || !anchor || !this.isAlive(source)) return false;
    if (!source.mechanicModifiers?.["set:guardianEcho:resonance"]) return false;
    if (source._actionSignal?.tags?.includes("guardianEcho")) return false;
    if (this.rng() >= GUARDIAN_ECHO.chance) return false;
    const allies = this.alliesOf(source).filter((ally) => this.isAlive(ally) && this.getDistance(anchor, ally) <= GUARDIAN_ECHO.radius);
    this.emitSignal({
      kind: "status",
      tags: this.actionTags(source, ["status", "equipmentSet", "guardianEcho", "echoProc", kind]).filter(Boolean),
      source: SIGNALS.unitRef(source),
      target: SIGNALS.unitRef(anchor),
      amount: allies.length,
      skillName: "护佑回响",
      meta: { kind, radius: GUARDIAN_ECHO.radius, targets: allies.map(SIGNALS.unitRef), originalLabel: payload.label || "" },
    });
    this.withAction(source, { tags: ["equipmentSet", "guardianEcho", "echo", kind], skillName: "护佑回响", meta: { echoKind: kind, anchor: SIGNALS.unitRef(anchor) } }, () => {
      if (kind === "heal") {
        for (const ally of allies) this.healUnit(ally, payload.amount || 0, "护佑回响", source);
      } else if (kind === "shield") {
        for (const ally of allies) this.shield(ally, payload.amount || 0, "护佑回响", source);
      } else if (kind === "cleanse") {
        for (const ally of allies) this.cleanseStatus(source, ally, payload.statusType, payload.amount || 1, 0, "护佑回响");
      }
    });
    return true;
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
    this.touchSchoolTarget(source, target);
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
    this.touchSchoolTarget(source, target);
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
    if (unit.deathTime === null) unit.deathTime = this.time;
    if (killer && killer.id !== unit.id) killer.kills = (killer.kills || 0) + 1;
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
    this.runtimeField?.afterDeath?.(unit, killer);
    if (killer && this.isAlive(killer)) {
      const chargeEffect = this.passiveEffects(killer, "cavalryKillCharge")[0];
      if (chargeEffect) {
        killer.cavalryKillChargeTimer = chargeEffect.duration || 6;
        killer.cavalryKillChargeEffect = structuredClone(chargeEffect);
        killer.cavalryKillChargeDashed = false;
        this.emitSignal({
          kind: "status",
          tags: ["status", "buff", "passive", "cavalry", "chargeReady"],
          source: SIGNALS.unitRef(killer),
          target: SIGNALS.unitRef(killer),
          amount: killer.cavalryKillChargeTimer,
          skillKey: killer.passive,
          skillName: chargeEffect.label || "乘胜冲锋",
          meta: { victim: SIGNALS.unitRef(unit), duration: killer.cavalryKillChargeTimer },
        });
      }
    }
    this.tryShadowKillReset(killer, unit);
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

  tryShadowKillReset(killer, victim) {
    if (!killer || !this.isAlive(killer)) return;
    const effects = this.passiveEffects(killer, "shadowKillReset");
    if (!effects.length) return;
    for (const effect of effects) {
      if (effect.requiresHidden !== false && !(killer.hiddenTimer > 0)) continue;
      if (effect.requiresMarked !== false && !((victim?.mark || 0) >= (effect.minMark || 1))) continue;
      const next = this.backlineLowestEnemy(killer) || this.lowestEnemy(killer);
      const before = { x: killer.x, y: killer.y };
      if (next && effect.blinkToNext !== false) {
        const sideOffset = killer.side === "left" ? -3.6 : 3.6;
        killer.x = clamp(next.x + sideOffset, 7, 93);
        killer.y = clamp(next.y + (effect.yOffset || 1.4), 12, 88);
        killer.forcedTargetId = next.id;
        killer.forcedTargetTimer = Math.max(killer.forcedTargetTimer || 0, effect.lockDuration || 2.6);
        killer.assassinFocusTargetId = next.id;
      } else {
        killer.forcedTargetId = null;
        killer.forcedTargetTimer = 0;
        killer.assassinFocusTargetId = null;
      }
      killer.hiddenTimer = Math.max(killer.hiddenTimer || 0, effect.hiddenDuration || 2.4);
      killer.guardTimer = Math.max(killer.guardTimer || 0, effect.guardDuration || 0.45);
      if (Number.isFinite(effect.cooldownRefund)) {
        for (const slot of ["small1", "small2", "ultimate"]) {
          if (killer[slot] === (effect.refundSkill || "shadowBurstAmbush")) {
            killer.skillCd[slot] = Math.max(0, killer.skillCd[slot] - effect.cooldownRefund);
          }
        }
      }
      this.emitSignal({
        kind: "movement",
        tags: this.actionTags(killer, ["movement", "blink", "shadowReset", "hidden", next ? "retarget" : "exit"]).filter(Boolean),
        source: SIGNALS.unitRef(killer),
        target: SIGNALS.unitRef(next || victim),
        amount: next ? round(this.getDistance({ x: before.x, y: before.y }, killer)) : 0,
        skillKey: killer.passive,
        skillName: effect.label || "影杀转火",
        meta: {
          before,
          after: { x: killer.x, y: killer.y },
          victim: SIGNALS.unitRef(victim),
          nextTarget: SIGNALS.unitRef(next),
          hiddenDuration: killer.hiddenTimer,
          lockDuration: killer.forcedTargetTimer || 0,
        },
      });
      break;
    }
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
    if (unit.role === "assassin" && unit.assassinFocusTargetId) {
      const focus = enemies.find((enemy) => enemy.id === unit.assassinFocusTargetId);
      if (focus) return focus;
      unit.assassinFocusTargetId = null;
    }
    const taunter = this.tauntTarget(unit, enemies);
    if (taunter) return taunter;
    const visibleEnemies = enemies.filter((enemy) => !(enemy.hiddenTimer > 0));
    const targetPool = visibleEnemies.length ? visibleEnemies : enemies;
    return targetPool.sort(this.byDistance(unit))[0];
  }

  nearestVisibleEnemy(unit) {
    return this.enemiesOf(unit)
      .filter((enemy) => this.isAlive(enemy) && !(enemy.hiddenTimer > 0))
      .sort(this.byDistance(unit))[0] || null;
  }

  cavalryMovementTarget(unit, fallback = null) {
    const forced = fallback && unit.forcedTargetId === fallback.id && unit.forcedTargetTimer > 0;
    const taunted = fallback && fallback.tauntTimer > 0 && unit.range < 20;
    if (forced || taunted) return fallback;
    return this.nearestVisibleEnemy(unit);
  }

  emitTargetSignal(unit, target) {
    if (!unit || !target || unit.lastTargetSignalId === target.id) return;
    const previousTargetId = unit.lastTargetSignalId || null;
    unit.lastTargetSignalId = target.id;
    const forced = unit.forcedTargetId === target.id && unit.forcedTargetTimer > 0;
    const assassinFocus = unit.assassinFocusTargetId === target.id;
    const taunted = target.tauntTimer > 0 && unit.range < 20;
    this.emitSignal({
      kind: "targeting",
      tags: this.actionTags(unit, ["targeting", forced ? "forcedTarget" : "", assassinFocus ? "assassinFocus" : "", taunted ? "taunt" : ""]).filter(Boolean),
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      amount: 0,
      skillKey: null,
      skillName: "target select",
      meta: {
        previousTargetId,
        forcedTargetId: unit.forcedTargetId || null,
        forcedTargetTimer: round(unit.forcedTargetTimer || 0),
        assassinFocusTargetId: unit.assassinFocusTargetId || null,
        targetHpRatio: round(this.hpRatio(target)),
        distance: round(this.getDistance(unit, target)),
      },
    });
  }

  moveToward(unit, target, dt) {
    const distance = this.getDistance(unit, target);
    if (distance <= unit.range * 0.92) return;
    const fieldMoveMult = this.runtimeField?.moveSpeedMult?.(unit) ?? 1;
    const cavalryMove = (unit.cavalryMoveSpeedMult || 1) * (unit.cavalryChargeReady ? CAVALRY_CHARGE.readyMoveMult : 1);
    const baseMoveSpeed = Math.max(0, Number(unit.moveSpeed) || 0);
    const slowMoveMult = unit.slowTimer > 0 && unit.roleName !== "刺客" ? 0.6 : 1;
    const step = dt * baseMoveSpeed * slowMoveMult * fieldMoveMult * cavalryMove;
    const dx = target.x - unit.x;
    const dy = target.y - unit.y;
    const move = Math.min(step, Math.max(0, distance - unit.range * 0.9));
    const before = { x: unit.x, y: unit.y };
    unit.x = clamp(unit.x + (dx / distance) * move, 7, 93);
    unit.y = clamp(unit.y + (dy / distance) * move, 12, 88);
    this.recordCavalryMovement(unit, before, unit, "advance");
    this.tryCavalryBreakthrough(unit, target);
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
    const plannedEnd = {
      x: clamp(unit.x + (dx / distance) * travel, 7, 93),
      y: clamp(unit.y + (dy / distance) * travel, 12, 88),
    };
    const wall = this.findSighingWallInterceptor(unit, before, plannedEnd);
    if (wall) {
      this.interruptChargeAtWall(unit, wall, "skillCharge", before, plannedEnd);
      return;
    }
    unit.x = plannedEnd.x;
    unit.y = plannedEnd.y;
    this.recordCavalryMovement(unit, before, unit, "skillCharge");
    this.tryCavalryBreakthrough(unit, target);
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

  recordCavalryMovement(unit, before, after, movementKind = "move") {
    if (!unit?.mechanicModifiers?.["set:cavalryCharge:foundation"]) return;
    const distance = this.getDistance(before, after);
    if (!(distance > 0)) return;
    unit.cavalryMovingTimer = Math.max(unit.cavalryMovingTimer || 0, 0.3);
    if (!unit.mechanicModifiers?.["set:cavalryCharge:breakthrough"] || unit.cavalryChargeReady) return;
    unit.cavalryChargeContinuityTimer = CAVALRY_CHARGE.continuityGrace;
    unit.cavalryDistance = (unit.cavalryDistance || 0) + distance;
    if (unit.cavalryDistance < CAVALRY_CHARGE.distanceThreshold) return;
    this.enterCavalryChargeState(unit, movementKind, unit.cavalryDistance);
  }

  resetCavalryChargeProgress(unit, reason = "stopped") {
    const previousDistance = unit?.cavalryDistance || 0;
    if (!(previousDistance > 0) || unit.cavalryChargeReady) return false;
    unit.cavalryDistance = 0;
    unit.cavalryChargeContinuityTimer = 0;
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "cavalryCharge", "chargeProgressReset"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(unit),
      amount: round(previousDistance),
      skillName: "冲锋蓄势中断",
      meta: { reason, continuityGrace: CAVALRY_CHARGE.continuityGrace },
    });
    return true;
  }

  enterCavalryChargeState(unit, movementKind = "move", amount = 0, extraMeta = {}) {
    if (!unit?.mechanicModifiers?.["set:cavalryCharge:foundation"] || !unit.mechanicModifiers?.["set:cavalryCharge:breakthrough"] || unit.cavalryChargeReady) return false;
    unit.cavalryDistance = Math.max(unit.cavalryDistance || 0, CAVALRY_CHARGE.distanceThreshold);
    unit.cavalryChargeReady = true;
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "cavalryCharge", "chargeReady"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(unit),
      amount: round(amount || unit.cavalryDistance),
      skillName: "冲锋",
      meta: { movementKind, threshold: CAVALRY_CHARGE.distanceThreshold, ...extraMeta },
    });
    return true;
  }

  tryCavalryBreakthrough(unit, target) {
    if (!unit?.cavalryChargeReady || !target || !this.isAlive(target)) return false;
    if (this.getDistance(unit, target) > Math.max(unit.range + 2, 14)) return false;
    const distance = Math.max(0.001, this.getDistance(unit, target));
    const direction = { x: (target.x - unit.x) / distance, y: (target.y - unit.y) / distance };
    const start = { x: unit.x, y: unit.y };
    const end = {
      x: clamp(start.x + direction.x * CAVALRY_CHARGE.breakthroughDistance, 7, 93),
      y: clamp(start.y + direction.y * CAVALRY_CHARGE.breakthroughDistance, 12, 88),
    };
    const wall = this.findSighingWallInterceptor(unit, start, end);
    if (wall) {
      unit.cavalryChargeReady = false;
      unit.cavalryDistance = 0;
      unit.cavalryChargeContinuityTimer = 0;
      this.interruptChargeAtWall(unit, wall, "setBreakthrough", start, end);
      return false;
    }
    const obstacle = this.obstacles.find((entry) => segmentPointDistance(start, end, entry) <= (entry.radius || 3));
    if (obstacle) {
      unit.cavalryChargeReady = false;
      unit.cavalryDistance = 0;
      unit.cavalryChargeContinuityTimer = 0;
      unit.attackCd = Math.max(unit.attackCd, CAVALRY_CHARGE.blockedDelay);
      this.emitSignal({
        kind: "status",
        tags: ["status", "equipmentSet", "cavalryCharge", "chargeBlocked", "obstacle"],
        source: SIGNALS.unitRef(unit),
        target: SIGNALS.unitRef(unit),
        amount: CAVALRY_CHARGE.blockedDelay,
        skillName: "冲锋受阻",
        meta: { reason: "obstacle", obstacle, start, end },
      });
      return false;
    }
    const hitTargets = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && segmentPointDistance(start, end, enemy) <= CAVALRY_CHARGE.pathRadius);
    unit.x = end.x;
    unit.y = end.y;
    unit.cavalryChargeReady = false;
    unit.cavalryDistance = 0;
    unit.cavalryChargeContinuityTimer = 0;
    this.withAction(unit, { tags: ["equipmentSet", "cavalryCharge", "breakthrough", "movement", "physical", "area"], skillName: "冲锋突破", meta: { start, end } }, () => {
      for (const enemy of hitTargets) this.hit(unit, enemy, CAVALRY_CHARGE.flatDamage + this.effectivePower(unit, "physical") * CAVALRY_CHARGE.powerRatio, "physical", "冲锋突破", false, "physical");
    });
    this.emitSignal({
      kind: "movement",
      tags: ["movement", "equipmentSet", "cavalryCharge", "breakthrough"],
      source: SIGNALS.unitRef(unit),
      target: SIGNALS.unitRef(target),
      amount: round(this.getDistance(start, end)),
      skillName: "冲锋突破",
      meta: { start, end, hitTargets: hitTargets.map(SIGNALS.unitRef), ignoresUnitCollision: true },
    });
    return true;
  }

  findSighingWallInterceptor(charger, start, end) {
    return this.enemiesOf(charger).find((unit) => (
      this.isAlive(unit)
      && unit.mechanicModifiers?.["set:sighingWall:unyieldingBoundary"]
      && segmentPointDistance(start, end, unit) <= SIGHING_WALL.radius
    ));
  }

  interruptChargeAtWall(charger, wall, chargeKind, start, end) {
    charger.stunTimer = Math.max(charger.stunTimer || 0, SIGHING_WALL.interceptStun);
    charger.attackCd = Math.max(charger.attackCd, SIGHING_WALL.interceptStun);
    this.emitSignal({
      kind: "status",
      tags: ["status", "equipmentSet", "sighingWall", "chargeIntercept", "stun"],
      source: SIGNALS.unitRef(wall),
      target: SIGNALS.unitRef(charger),
      amount: SIGHING_WALL.interceptStun,
      skillName: "叹息之墙·截断",
      meta: { chargeKind, radius: SIGHING_WALL.radius, start, attemptedEnd: end },
    });
  }

  blinkBacklineStrike(unit, effect = {}) {
    if (!unit || !this.isAlive(unit)) return;
    const backline = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy) && enemy.line === "后排");
    const fallback = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    let target = (backline.length ? backline : fallback).sort((a, b) => this.hpRatio(a) - this.hpRatio(b) || this.getDistance(unit, a) - this.getDistance(unit, b))[0];
    if (unit.assassinFocusTargetId) {
      const currentFocus = fallback.find((enemy) => enemy.id === unit.assassinFocusTargetId);
      if (currentFocus) target = currentFocus;
    }
    if (!target) return;
    const before = { x: unit.x, y: unit.y };
    const sideOffset = unit.side === "left" ? -3.8 : 3.8;
    unit.x = clamp(target.x + sideOffset, 7, 93);
    unit.y = clamp(target.y + (effect.yOffset || 1.6), 12, 88);
    unit.attackCd = Math.min(unit.attackCd, effect.attackCd ?? 0.08);
    unit.forcedTargetId = target.id;
    unit.forcedTargetTimer = effect.lockDuration ?? 3.2;
    unit.assassinFocusTargetId = target.id;
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
    let target = this.backlineLowestEnemy(unit);
    if (unit.assassinFocusTargetId) {
      const currentFocus = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy)).find((enemy) => enemy.id === unit.assassinFocusTargetId);
      if (currentFocus) target = currentFocus;
    }
    if (!target) return;

    const before = { x: unit.x, y: unit.y };
    const sideOffset = unit.side === "left" ? -3.8 : 3.8;
    unit.x = clamp(target.x + sideOffset, 7, 93);
    unit.y = clamp(target.y + (effect.yOffset || 1.6), 12, 88);
    unit.attackCd = Math.min(unit.attackCd, effect.attackCd ?? 0.08);
    unit.forcedTargetId = target.id;
    unit.forcedTargetTimer = effect.lockDuration ?? 3.2;
    unit.assassinFocusTargetId = target.id;
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
    const myriadGain = type === "physical" && unit?.mechanicModifiers?.["set:myriadValor:battleGrowth"]
      ? (unit.myriadValorBasePower || unit.physicalPower || 0) * MYRIAD_VALOR.powerPerHitRatio * (unit.myriadValorStacks || 0)
      : 0;
    const cavalryPowerMult = type === "physical" && unit?.cavalryChargeReady ? CAVALRY_CHARGE.readyPowerMult : 1;
    return (base + myriadGain + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0)) * cavalryPowerMult;
  }
  statusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slowTimer > 0 ? 2 : 0) + (unit.mark || 0); }
  carryAlly(unit, range = Infinity) {
    const carryScore = (ally) => Math.max(this.effectivePower(ally, "physical"), this.effectivePower(ally, "magic"));
    return this.alliesInRange(unit, range).sort((a, b) => carryScore(b) - carryScore(a))[0];
  }
  lowestEnemy(unit) {
    const enemies = this.enemiesOf(unit).filter((enemy) => this.isAlive(enemy));
    return this.tauntTarget(unit, enemies) || enemies.sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
  }
  enemiesOf(unit) { return this.units.filter((item) => item.side !== unit.side); }
  alliesOf(unit) { return this.units.filter((item) => item.side === unit.side); }
  alliesInRange(unit, range = Infinity) {
    const maxRange = Number.isFinite(range) ? Math.max(0, range) : Infinity;
    return this.alliesOf(unit).filter((ally) => this.isAlive(ally) && this.getDistance(unit, ally) <= maxRange);
  }
  lowestHpAlly(unit, range = Infinity) { return this.alliesInRange(unit, range).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
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
  highestStatusAlly(unit, statusType, range = Infinity) {
    const statusValue = (ally) => (statusType === "burn" ? ally.burn?.stacks : ally.poison?.stacks) || 0;
    return this.alliesInRange(unit, range).sort((a, b) => statusValue(b) - statusValue(a) || this.hpRatio(a) - this.hpRatio(b))[0];
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
    const passive = this.passiveEffects(source, "passiveHealAmp").reduce((multiplier, effect) => {
      if (effect.selfOnly && source.id !== target?.id) return multiplier;
      if (effect.targetLine && target?.line !== effect.targetLine) return multiplier;
      return multiplier * (1 + (effect.amp || 0));
    }, 1);
    const setAmp = source.mechanicModifiers?.["set:guardianEcho:foundation"] ? 1.2 : 1;
    return passive * setAmp;
  }
  passiveShieldMultiplier(source, target) {
    if (!source) return 1;
    const passive = this.passiveEffects(source, "passiveShieldAmp").reduce((multiplier, effect) => {
      if (effect.selfOnly && source.id !== target?.id) return multiplier;
      if (effect.targetLine && target?.line !== effect.targetLine) return multiplier;
      return multiplier * (1 + (effect.amp || 0));
    }, 1);
    const setAmp = source.mechanicModifiers?.["set:sighingWall:foundation"] ? 1.2 : 1;
    return passive * setAmp;
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

function segmentPointDistance(start, end, point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq <= 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = clamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSq, 0, 1);
  return Math.hypot(point.x - (start.x + dx * t), point.y - (start.y + dy * t));
}

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

return { CombatSimulation, simulatePresetMatchup, simulateTeams, simulateWaveTeams, clonePreset };
})();

if (typeof window !== "undefined") window.GAME_COMBAT_SIM = GAME_COMBAT_SIM;
if (typeof module !== "undefined") module.exports = GAME_COMBAT_SIM;
