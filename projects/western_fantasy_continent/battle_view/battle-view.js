(() => {
  const SLASH_BASE = "/effect_lab/assets/brackeys/particles/alpha";
  const SKILLS = window.GAME_SKILL_DATA || {};
  const SIGNALS = window.GAME_COMBAT_SIGNALS || {};
  const ROLE_ICONS = {
    knight: "🛡️", warrior: "⚔️", berserker: "🪓", assassin: "🗡️", ranger: "🏹",
    mage: "🔥", priest: "✨", warlock: "☠️", bard: "🎵", alchemist: "⚗️",
    enemy_bone_ogre: "👁️", enemy_ember_idol: "🔥", enemy_plague_totem: "☠️",
    enemy_stone_golem: "🪨", enemy_mirror_executioner: "🗡️", enemy_frost_pylon: "❄️",
  };
  const BERSERKER_MODEL = SKILLS.berserkerModel || {};
  const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
  const BERSERKER_DURATIONS = BERSERKER_MODEL.durations || {};
  const BERSERKER_COOLDOWNS = BERSERKER_MODEL.cooldowns || {};
  const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};
  const SKILL_KEY_BY_NAME = Object.fromEntries(Object.entries(SKILLS.skills || {}).map(([key, skill]) => [skill.name, key]));
  Object.assign(SKILL_KEY_BY_NAME, {
    "护卫反击": "retaliationStance",
    "王旗不倒": "bannerWall",
  });

  const TIMER_ALIASES = {
    guardTimer: "guard",
    tauntTimer: "taunt",
    slowTimer: "slow",
    hasteTimer: "haste",
    undyingTimer: "immortal",
    lifeStealTimer: "lifeSteal",
    bloodFuryTimer: "bloodFury",
    whirlwindTimer: "whirlwind",
    roarFuryTimer: "roarFury",
  };

  class BattleView {
    constructor(options = {}) {
      this.container = options.container;
      this.onFinish = options.onFinish || (() => {});
      this.maxTime = options.maxTime || 70;
      this.speed = options.speed || 1;
      this.state = {
        running: false,
        time: 0,
        lastFrame: 0,
        units: [],
        logs: [],
        result: null,
        raf: 0,
        signalBus: SIGNALS.createCombatSignalBus ? SIGNALS.createCombatSignalBus() : null,
      };
      this.sharedSkills = SKILLS.createSkillLibrary ? SKILLS.createSkillLibrary(this.skillApi()) : {};
      this.mount();
    }

    mount() {
      if (!this.container) throw new Error("BattleView requires a container.");
      this.container.__battleView = this;
      window.__latestBattleView = this;
      this.container.innerHTML = `
        <section class="battle-view">
          <div class="battle-view-scoreboard">
            <div><span>我方存活</span><strong data-battle-left>0</strong></div>
            <div><span data-battle-state>待命</span><strong data-battle-time>0.0s</strong></div>
            <div><span>敌方存活</span><strong data-battle-right>0</strong></div>
          </div>
          <div class="battle-view-field" data-battle-field>
            <span class="battle-side-label left">我方阵线</span>
            <span class="battle-side-label right">敌方阵线</span>
            <div class="battle-fx-layer" data-battle-fx></div>
            <div class="battle-unit-layer" data-battle-units></div>
          </div>
          <div class="battle-view-log" data-battle-log></div>
        </section>
      `;
      this.els = {
        left: this.container.querySelector("[data-battle-left]"),
        right: this.container.querySelector("[data-battle-right]"),
        state: this.container.querySelector("[data-battle-state]"),
        time: this.container.querySelector("[data-battle-time]"),
        unitLayer: this.container.querySelector("[data-battle-units]"),
        fxLayer: this.container.querySelector("[data-battle-fx]"),
        log: this.container.querySelector("[data-battle-log]"),
      };
      this.render();
    }

    start({ leftTeam = [], rightTeam = [], seed = "battle-view", title = "战斗", randomizeStats } = {}) {
      if (window.GAME_COMBAT_SIM?.CombatSimulation) {
        this.startUnified({ leftTeam, rightTeam, seed, title, randomizeStats });
        return;
      }
      this.stop(false);
      this.state.time = 0;
      this.state.result = null;
      this.state.logs = [`${title}\u5f00\u59cb\u3002`];
      this.state.signalBus?.clear();
      this.state.units = [
        ...this.makeUnits("ally", leftTeam),
        ...this.makeUnits("enemy", rightTeam),
      ];
      this.state.running = true;
      this.state.lastFrame = performance.now();
      this.state.seed = seed;
      this.render();
      this.state.raf = setInterval(() => this.tick(performance.now()), 33);
    }

    preview({ leftTeam = [], rightTeam = [], title = "预览" } = {}) {
      this.stop(false);
      this.state.time = 0;
      this.state.result = null;
      this.state.logs = leftTeam.length || rightTeam.length ? [`${title}阵容预览。`] : [];
      this.state.signalBus?.clear();
      this.state.units = [
        ...this.makeUnits("ally", leftTeam),
        ...this.makeUnits("enemy", rightTeam),
      ];
      this.render();
    }

    startUnified({ leftTeam = [], rightTeam = [], seed = "battle-view", title = "\u6218\u6597", randomizeStats } = {}) {
      if (!window.GAME_COMBAT_SIM?.CombatSimulation) {
        this.start({ leftTeam, rightTeam, seed, title });
        return;
      }
      this.stop(false);
      const sim = new window.GAME_COMBAT_SIM.CombatSimulation({
        seed,
        maxTime: this.maxTime,
        healthInterval: 0.5,
        randomizeStats,
      });
      sim.time = 0;
      sim.nextId = 1;
      sim.logs = [];
      sim.signalBus.clear();
      sim.units = [...sim.makeTeam("left", leftTeam), ...sim.makeTeam("right", rightTeam)];
      if (sim.randomizeStats) sim.applyStatSwing();

      this.state.time = 0;
      this.state.result = null;
      this.state.logs = [`${title}\u5f00\u59cb\u3002`];
      this.state.signalBus?.clear();
      this.state.units = [
        ...this.makeUnits("ally", leftTeam),
        ...this.makeUnits("enemy", rightTeam),
      ];
      this.state.unifiedSim = sim;
      this.state.lastSignalIndex = 0;
      this.state.running = true;
      this.state.lastFrame = performance.now();
      this.state.seed = seed;
      this.syncUnifiedUnits();
      this.render();
      this.state.raf = setInterval(() => this.tickUnified(performance.now()), 33);
    }

    tickUnified(now) {
      const sim = this.state.unifiedSim;
      if (!this.state.running || !sim) return;
      const dt = Math.min(0.2, ((now - this.state.lastFrame) / 1000 || 0.016)) * this.speed;
      this.state.lastFrame = now;
      sim.update(dt);
      this.state.time = sim.time;
      this.syncUnifiedUnits();
      this.playUnifiedSignals();
      this.finishUnifiedIfNeeded();
      this.render();
    }

    syncUnifiedUnits() {
      const sim = this.state.unifiedSim;
      if (!sim) return;
      const sideMap = { left: "ally", right: "enemy" };
      for (const combatUnit of sim.units || []) {
        const unit = this.state.units.find((item) => item.side === sideMap[combatUnit.side] && item.unitId.endsWith(`_${combatUnit.index}`));
        if (!unit) continue;
        unit.x = combatUnit.x;
        unit.y = combatUnit.y;
        unit.maxHp = combatUnit.maxHp;
        unit.hpNow = Math.max(0, combatUnit.hp);
        unit.shield = combatUnit.shield || 0;
        unit.simId = combatUnit.id;
        unit.deadTriggered = !sim.isAlive(combatUnit);
        unit.damageDone = combatUnit.damageDone || 0;
        unit.hiddenTimer = combatUnit.hiddenTimer || 0;
        unit.guardTimer = combatUnit.guardTimer || 0;
        unit.forcedTargetId = combatUnit.forcedTargetId || null;
      }
    }

    playUnifiedSignals() {
      const sim = this.state.unifiedSim;
      if (!sim) return;
      const signals = sim.signalBus.signals || [];
      const start = this.state.lastSignalIndex || 0;
      for (const signal of signals.slice(start)) this.playUnifiedSignal(signal);
      this.state.lastSignalIndex = signals.length;
    }

    playUnifiedSignal(signal) {
      if (signal.kind === "health") return;
      const source = this.displayUnitForRef(signal.source);
      const target = this.displayUnitForRef(signal.target);
      const tags = signal.tags || [];
      const amount = Math.round(signal.amount || 0);
      if (signal.kind === "skill") {
        if (source) this.label(source, signal.skillName || signal.skillKey || "\u6280\u80fd", tags.includes("ultimate"));
        this.playSkillFx(signal, source, target);
        return;
      }
      if (signal.kind === "damage") {
        if (target && amount > 0) {
          const cls = tags.includes("burn") || tags.includes("fire") ? "fire" : tags.includes("poison") ? "poison" : "";
          const prefix = tags.includes("burn") ? "\u71c3\u70e7-" : tags.includes("poison") ? "\u5267\u6bd2-" : "-";
          this.floater(target, `${prefix}${amount}`, cls);
          if (this.isResidualFireSignal(signal)) {
            this.ring(target, "fire");
          } else if (source && !tags.includes("dot") && !tags.includes("selfCost")) {
            this.slash(source, target, cls === "poison" ? "poison" : cls === "fire" ? "fire" : "gold");
          }
        }
        return;
      }
      if (signal.kind === "heal") {
        if (target && amount > 0) {
          this.floater(target, `\u6cbb\u7597+${amount}`, "heal");
          this.ring(target, "green");
        }
        return;
      }
      if (signal.kind === "shield") {
        if (target && amount > 0) {
          this.floater(target, `\u62a4\u76fe+${amount}`, "shield");
          this.ring(target, "blue");
        }
        return;
      }
      if (signal.kind === "movement") {
        if (!source) return;
        if (tags.includes("shadowReset")) {
          this.afterimage(signal.meta?.before, source, "purple");
          this.floater(source, "转火", "purple");
          this.ring(source, "purple");
          if (target) this.slash(source, target, "purple");
        } else if (tags.includes("shadowStep") || tags.includes("hidden")) {
          this.afterimage(signal.meta?.before, source, "purple");
          this.floater(source, "隐身", "purple");
          this.ring(source, "purple");
          if (target) this.slash(source, target, "purple");
        } else if (tags.includes("blink")) {
          this.afterimage(signal.meta?.before, source, "blue");
          if (target) this.slash(source, target, "blue");
        }
        return;
      }
      if (signal.kind === "status") {
        if (!target) return;
        if (tags.includes("burn")) {
          this.floater(target, `\u71c3\u70e7+${amount}`, "fire");
          this.ring(target, "fire");
        } else if (tags.includes("poison")) {
          this.floater(target, `\u5267\u6bd2+${amount}`, "poison");
          this.ring(target, "poison");
        } else if (tags.includes("hidden")) {
          this.floater(target, tags.includes("extend") ? "续隐" : "隐身", "purple");
          this.ring(target, "purple");
        } else if (tags.includes("mark")) {
          this.floater(target, `猎标+${amount}`, "purple");
          this.ring(target, "purple");
        } else {
          this.ring(target, "gold");
        }
        return;
      }
      if (signal.kind === "death" && target) this.floater(target, "\u5012\u4e0b", "");
    }

    playSkillFx(signal, source, target) {
      if (!source) return;
      const key = signal.skillKey || "";
      const tags = signal.tags || [];
      if (tags.includes("ultimate")) this.ring(source, "gold");
      if (!target) {
        this.ring(source, tags.includes("ultimate") ? "gold" : "blue");
        return;
      }
      if (/fire|burn|meteor|ember|flare|comet/i.test(key)) this.beam(source, target, "fire"), this.ring(target, "fire");
      else if (/poison|venom|plague|toxic|curse/i.test(key)) this.beam(source, target, "poison"), this.ring(target, "poison");
      else if (/heal|grace|mending|sanctuary/i.test(key)) this.ring(target, "green");
      else if (/shield|guard|banner|vow|wall/i.test(key)) this.ring(target, "blue");
      else if (/shadow|assassin|throat|midnight/i.test(key) || tags.includes("hidden")) this.slash(source, target, "purple");
      else if (/arrow|mark|lance|shot/i.test(key)) this.beam(source, target, "blue");
      else this.slash(source, target, /death|blood|wound|rage/i.test(key) ? "blood" : "gold");
    }

    displayUnitForRef(ref) {
      if (!ref) return null;
      const sideMap = { left: "ally", right: "enemy", ally: "ally", enemy: "enemy" };
      const side = sideMap[ref.side] || ref.side;
      const exact = this.state.units.find((unit) => unit.simId === ref.id || unit.id === ref.id || unit.unitId === ref.id);
      if (exact) return exact;
      const named = this.state.units.filter((unit) => side && unit.side === side && unit.name === ref.name);
      return named.length === 1 ? named[0] : null;
    }

    isResidualFireSignal(signal) {
      const tags = signal.tags || [];
      return tags.includes("fire") && (/火种余爆|燃烧/.test(signal.skillName || "") || tags.includes("dot"));
    }

    finishUnifiedIfNeeded() {
      const sim = this.state.unifiedSim;
      if (!sim) return;
      const leftAlive = sim.units.some((unit) => unit.side === "left" && sim.isAlive(unit));
      const rightAlive = sim.units.some((unit) => unit.side === "right" && sim.isAlive(unit));
      if (leftAlive && rightAlive && sim.time < this.maxTime) return;
      this.state.running = false;
      if (this.state.raf) clearInterval(this.state.raf);
      this.state.raf = 0;
      const leftHp = sim.sideHpScore("left");
      const rightHp = sim.sideHpScore("right");
      const winner = leftHp >= rightHp ? "left" : "right";
      this.state.result = {
        passed: winner === "left",
        winner,
        duration: sim.time,
        leftHp,
        rightHp,
        units: this.state.units,
        signals: sim.signalBus.signals,
        summary: sim.signalBus.summary(),
        metrics: sim.metrics(),
      };
      this.state.logs.unshift(`${winner === "left" ? "\u80dc\u5229" : "\u5931\u8d25"} 路 ${sim.time.toFixed(1)}s`);
      this.onFinish(this.state.result);
    }
    stop(render = true) {
      if (this.state.raf) clearInterval(this.state.raf);
      this.state.raf = 0;
      this.state.running = false;
      this.state.unifiedSim = null;
      if (render) this.render();
    }

    reset() {
      this.stop(false);
      this.state.time = 0;
      this.state.units = [];
      this.state.logs = [];
      this.state.result = null;
      this.state.signalBus?.clear();
      this.render();
    }

    destroy() {
      this.stop(false);
      this.container.innerHTML = "";
    }

    skillApi() {
      return {
        iconBase: "",
        timerAliases: TIMER_ALIASES,
        isAlive: (unit) => this.alive(unit),
        hpRatio: (unit) => this.hpRatio(unit),
        statusCount: (unit) => this.statusCount(unit),
        effectivePower: (unit) => this.effectivePower(unit),
        enemiesOf: (unit) => this.enemies(unit),
        alliesOf: (unit) => this.allies(unit),
        lowestEnemy: (unit) => this.lowestEnemy(unit),
        lowestHpAlly: (unit) => this.lowestHpAlly(unit),
        carryAlly: (unit) => this.carryAlly(unit),
        byDistance: (unit) => this.byDistance(unit),
        hit: (source, target, amount, type, text, visible) => this.hit(source, target, amount, type, text, visible),
        shield: (unit, amount, text) => this.shield(unit, amount, text, 0),
        healUnit: (target, amount) => this.heal(target, target, amount),
        addPoison: (target, stacks, time, source) => this.poison(source, target, stacks, time),
        addBurn: (target, stacks, time, source) => this.burn(source, target, stacks, time),
        takeRaw: (target, amount) => this.takeRaw(target, amount),
        floater: (unit, text, tone) => this.floater(unit, text, tone),
        counterattack: (unit, source, effect, context) => this.counterattack(unit, source, effect, context),
        emitEffectSignal: (signal) => this.emitEffectSignal(signal),
      };
    }

    makeUnits(side, specs) {
      const form = side === "ally"
        ? [{ x: 28, y: 35, line: "前排" }, { x: 28, y: 65, line: "前排" }, { x: 14, y: 35, line: "后排" }, { x: 14, y: 65, line: "后排" }, { x: 20, y: 50, line: "后排" }, { x: 36, y: 50, line: "前排" }]
        : [{ x: 72, y: 35, line: "前排" }, { x: 72, y: 65, line: "前排" }, { x: 86, y: 35, line: "后排" }, { x: 86, y: 65, line: "后排" }, { x: 80, y: 50, line: "后排" }, { x: 64, y: 50, line: "前排" }];
      return specs.map((spec, index) => {
        const hero = this.normalizeSpec(spec, side, index);
        const slotIndex = Number.isFinite(spec.slotIndex) ? spec.slotIndex : index;
        const slot = form[slotIndex % form.length];
        return {
          ...hero,
          unitId: `${side}_${index}`,
          side,
          slotIndex,
          x: slot.x,
          y: slot.y,
          line: slot.line,
          maxHp: hero.hp,
          hpNow: hero.hp,
          shield: 0,
          burn: { stacks: 0, time: 0, tick: 1 },
          poison: { stacks: 0, time: 0, tick: 1 },
          mark: 0,
          haste: 0,
          slow: 0,
          guard: 0,
          taunt: 0,
          immortal: 0,
          lifeSteal: 0,
          bloodFury: 0,
          whirlwind: 0,
          roarFury: 0,
          retaliationTimer: 0,
          retaliationEffect: null,
          counterCd: 0,
          bonusPowerTimer: 0,
          bonusPower: 0,
          attackCd: 0.8,
          skillCd: [
            this.openingCooldown(hero.small[0], 1),
            this.openingCooldown(hero.small[1], 2.6),
          ],
          ultCd: this.openingCooldown(hero.ult, 14),
          focusTarget: "",
          focusHits: 0,
          deadTriggered: false,
        };
      });
    }

    normalizeSpec(spec, side, index) {
      const roleKey = spec.roleKey || spec.role || "warrior";
      const kit = SKILLS.roleKits?.[roleKey] || {};
      const stats = kit.stats || {};
      const name = spec.name || kit.name || `${side === "ally" ? "我方" : "敌方"}${index + 1}`;
      const roleName = spec.roleName || kit.role || kit.name || roleKey;
      return {
        id: spec.id || `${side}_${index}`,
        name,
        roleKey,
        roleName,
        fantasy: spec.fantasy || "",
        icon: spec.iconText || ROLE_ICONS[roleKey] || (side === "ally" ? "⚔️" : "◆"),
        hp: Math.round(spec.maxHp || spec.hp || stats.hp || kit.hp || 300),
        power: Math.round(spec.power ?? stats.power ?? kit.power ?? 45),
        armor: Math.round(spec.armor ?? stats.armor ?? kit.armor ?? 8),
        range: spec.range ?? stats.range ?? kit.range ?? 12,
        smallKeys: [
          spec.smallKeys?.[0] || spec.small1 || kit.kit?.small1,
          spec.smallKeys?.[1] || spec.small2 || kit.kit?.small2,
        ].filter(Boolean),
        small: [
          this.skillName(spec.small?.[0] || spec.small1 || kit.kit?.small1),
          this.skillName(spec.small?.[1] || spec.small2 || kit.kit?.small2 || "enemyNoop"),
        ],
        passiveKey: spec.passiveKey || spec.passive || kit.kit?.passive,
        passive: this.skillName(spec.passive || spec.passiveKey || kit.kit?.passive),
        ultKey: spec.ultKey || spec.ultimate || spec.ult || kit.kit?.ultimate,
        ult: this.skillName(spec.ult || spec.ultimate || spec.ultKey || kit.kit?.ultimate || "enemyNoUltimate"),
      };
    }

    skillName(value) {
      if (!value) return "无";
      return SKILLS.skills?.[value]?.name || value;
    }

    skillKey(name) {
      return SKILL_KEY_BY_NAME[name] || name;
    }

    openingCooldown(skillName, fallback) {
      if (skillName === "不死战吼") return BERSERKER_MODEL.openingCooldowns?.undyingRoar ?? 8;
      return SKILLS.skills?.[this.skillKey(skillName)]?.openingCooldown ?? fallback;
    }

    tick(now) {
      if (!this.state.running) return;
      const dt = Math.min(0.2, ((now - this.state.lastFrame) / 1000 || 0.016)) * this.speed;
      this.state.lastFrame = now;
      this.update(dt);
      this.render();
    }

    update(dt) {
      this.state.time += dt;
      for (const unit of this.state.units.filter((item) => this.alive(item))) {
        this.tickStatus(unit, dt);
        unit.attackCd -= dt * (unit.haste > 0 ? 1.4 : 1);
        unit.skillCd = unit.skillCd.map((cd) => Math.max(0, cd - dt));
        unit.ultCd = Math.max(0, unit.ultCd - dt);
        for (const key of ["haste", "slow", "guard", "taunt", "immortal", "lifeSteal", "bloodFury", "whirlwind", "roarFury", "retaliationTimer", "bonusPowerTimer"]) {
          unit[key] = Math.max(0, unit[key] - dt);
        }
        unit.counterCd = Math.max(0, unit.counterCd - dt);

        const target = this.chooseTarget(unit);
        if (!target) continue;
        const distance = this.dist(unit, target);
        if (distance > unit.range) {
          this.moveToward(unit, target, dt);
          continue;
        }
        if (unit.ultCd <= 0) this.cast(unit, target, "ult");
        else if (unit.skillCd[0] <= 0) this.cast(unit, target, 0);
        else if (unit.skillCd[1] <= 0) this.cast(unit, target, 1);
        else if (unit.attackCd <= 0) this.basic(unit, target);
      }
      this.state.signalBus?.emitHealthSnapshots(this.state.units, this.state.time);
      this.finishIfNeeded();
    }

    tickStatus(unit, dt) {
      this.tickDot(unit, unit.burn, dt, 2.15, "burn");
      this.tickDot(unit, unit.poison, dt, 2.1, "poison");
    }

    tickDot(unit, dot, dt, perStack, type) {
      if (dot.stacks <= 0) return;
      dot.time -= dt;
      dot.tick -= dt;
      if (dot.tick <= 0) {
        dot.tick = 1;
        this.withAction(dot.source, { tags: ["dot", "damage", type], skillName: type === "poison" ? "剧毒" : "燃烧" }, () => {
          this.damage(dot.source || null, unit, dot.stacks * perStack, type);
        });
      }
      if (dot.time <= 0) dot.stacks = 0;
    }

    cast(unit, target, slot) {
      const skillName = slot === "ult" ? unit.ult : unit.small[slot];
      const skillKey = this.skillKey(skillName);
      const sharedSkill = this.sharedSkills[skillKey];
      this.label(unit, skillName, slot === "ult");
      if (slot === "ult") unit.ultCd = sharedSkill?.cooldown ?? 24;
      else unit.skillCd[slot] = sharedSkill?.cooldown ?? this.cooldownFor(skillName, slot);

      if (sharedSkill) {
        this.emitSignal({
          kind: "skill",
          tags: ["skill", slot === "ult" ? "ultimate" : "smallSkill", "cast"],
          source: this.unitRef(unit),
          target: this.unitRef(target),
          skillKey,
          skillName,
          meta: { slot, role: unit.roleName },
        });
        this.withAction(unit, { tags: ["skill", slot === "ult" ? "ultimate" : "smallSkill"], skillKey, skillName }, () => {
          sharedSkill.cast({ unit, target, visual: true });
        });
        if (slot === "ult") this.triggerEncore(unit);
        return;
      }

      if (["重击", "影切", "暗影收割"].includes(skillName)) this.slash(unit, target, "blood"), this.damage(unit, target, unit.power * (slot === "ult" ? 1.45 : 0.72), "physical");
      else if (["顺劈", "战旗冲锋"].includes(skillName)) this.enemies(unit).filter((enemy) => this.alive(enemy)).sort(this.byDistance(unit)).slice(0, 3).forEach((enemy) => this.slash(unit, enemy, "gold") || this.damage(unit, enemy, unit.power * 0.48, "physical"));
      if (slot === "ult") this.triggerEncore(unit);
    }

    basic(unit, target) {
      const isBerserker = unit.roleKey === "berserker" || unit.roleName === "狂战士" || unit.passive === "血怒引擎";
      const missingHp = isBerserker ? 1 - unit.hpNow / unit.maxHp : 0;
      const lowHpHaste = isBerserker ? 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0) : 1;
      unit.attackCd = (isBerserker ? (BERSERKER_MODEL.basicAttackCooldown ?? 1.35) : 1.35) / lowHpHaste;
      const power = this.effectivePower(unit);
      let amount = isBerserker ? (BERSERKER_MODEL.basicFlatDamage ?? 10) + power * (BERSERKER_MODEL.basicPowerRatio ?? 0.22) : 10 + power * 0.22;
      let visible = false;
      let basicLabel = "攻击";
      if (unit.bloodFury > 0) {
        amount += power * (BERSERKER_RATIOS.blood ?? 0.45) * (1 + (1 - unit.hpNow / unit.maxHp) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45));
        visible = true;
        basicLabel = "血怒普攻";
      }
      if (unit.whirlwind > 0) {
        amount += power * (BERSERKER_RATIOS.whirlwind ?? 0.3);
        visible = true;
        basicLabel = basicLabel === "攻击" ? "旋风普攻" : basicLabel;
      }
      if (unit.roarFury > 0) {
        amount += power * (BERSERKER_RATIOS.roar ?? 0.35);
        visible = true;
        basicLabel = "战吼普攻";
      }
      this.withAction(unit, { tags: ["basic", "attack"], skillName: basicLabel, meta: { windows: this.activeWindows(unit) } }, () => {
        this.damage(unit, target, amount, "physical", visible);
      });
      if (unit.passive === "血怒引擎" && unit.hpNow < unit.maxHp) {
        const leech = amount * ((BERSERKER_PASSIVE.baseLeech ?? 0.06) + (1 - unit.hpNow / unit.maxHp) * (BERSERKER_PASSIVE.missingHpLeech ?? 0.08));
        unit.hpNow = Math.min(unit.maxHp, unit.hpNow + leech);
        if (visible) this.floater(unit, `吸血+${Math.round(leech)}`, "heal");
      }
      if (unit.whirlwind > 0) {
        this.enemies(unit).filter((enemy) => this.alive(enemy) && enemy.unitId !== target.unitId).sort(this.byDistance(target)).slice(0, BERSERKER_MODEL.splashTargets ?? 2)
          .forEach((enemy) => this.withAction(unit, { tags: ["basic", "attack", "area", "splash"], skillName: "旋风溅射", meta: { windows: this.activeWindows(unit) } }, () => {
            this.damage(unit, enemy, power * (BERSERKER_RATIOS.splash ?? 0.18), "physical", true);
          }));
      }
    }

    hit(source, target, amount, type, text, visible = true) {
      this.damage(source, target, amount, type, visible);
      if (visible && text) this.label(source, text);
    }

    damage(source, target, amount, type, visible = true) {
      if (!this.alive(target)) return;
      const hpBefore = target.hpNow;
      let value = Math.max(1, amount - target.armor * (type === "physical" ? 0.7 : 0.35));
      if (source?.passive === "破阵步" && target.line === "前排") value *= 1.12;
      if (source?.passive === "血怒引擎") value *= 1 + (1 - source.hpNow / source.maxHp) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
      if (source?.passive === "破绽毒刃" && (target.poison.stacks > 0 || target.burn.stacks > 0)) value *= 1.18;
      if (source?.passive === "催化剂" && this.statusCount(target) > 0) value *= 1.12;
      value *= SKILLS.passiveDamageMultiplier?.(source, target, { statusCount: (unit) => this.statusCount(unit), hpRatio: (unit) => this.hpRatio(unit) }) || 1;
      if (target.guard > 0) value *= 0.72;
      let blocked = 0;
      if (target.shield > 0) {
        blocked = Math.min(target.shield, value);
        target.shield -= blocked;
        value -= blocked;
      }
      if (blocked > 0) this.floater(target, `护盾-${Math.round(blocked)}`, "shield");
      if (value > 0) {
        if (target.immortal > 0 && target.hpNow - value <= 1) value = Math.max(0, target.hpNow - 1);
        target.hpNow = Math.max(0, target.hpNow - value);
        if (value > 0) {
          this.emitSignal({
            kind: "damage",
            tags: this.actionTags(source, ["damage", type, blocked > 0 ? "blocked" : "", value !== amount ? "mitigated" : ""]).filter(Boolean),
            source: this.unitRef(source),
            target: this.unitRef(target),
            amount: value,
            skillKey: source?._actionSignal?.skillKey || null,
            skillName: source?._actionSignal?.skillName || "",
            hpBefore,
            hpAfter: target.hpNow,
            meta: { rawAmount: amount, blocked, shieldAfter: target.shield || 0, ...source?._actionSignal?.meta },
          });
        }
        if (source?.lifeSteal > 0 && value > 0) {
          const leech = value * (BERSERKER_PASSIVE.roarLeech ?? 0.18);
          const before = source.hpNow;
          source.hpNow = Math.min(source.maxHp, source.hpNow + leech);
          this.emitSignal({ kind: "heal", tags: this.actionTags(source, ["heal", "lifeSteal"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(source), amount: source.hpNow - before, skillName: "吸血", hpBefore: before, hpAfter: source.hpNow });
          if (visible) this.floater(source, `吸血+${Math.round(leech)}`, "heal");
        }
        const cls = type === "burn" || type === "fire" ? "fire" : type === "poison" ? "poison" : "";
        const prefix = type === "burn" ? "燃烧-" : type === "poison" ? "剧毒-" : "-";
        if (visible) this.floater(target, `${prefix}${Math.round(value)}`, cls);
        if (target.hpNow <= 0) this.onDeath(target, source);
      }
      SKILLS.triggerReactiveEffects?.("afterDamageTaken", { unit: target, source, blocked, damageTaken: value, rawAmount: amount, type, visual: visible }, { counterattack: (unit, attacker, effect, context) => this.counterattack(unit, attacker, effect, context) });
    }

    shield(unit, amount, text, guardSeconds = 3) {
      if (!unit) return;
      unit.shield += amount;
      unit.guard = Math.max(unit.guard, guardSeconds);
      this.emitSignal({ kind: "shield", tags: this.actionTags(null, ["shield"]).filter(Boolean), source: null, target: this.unitRef(unit), amount, skillName: text, shield: unit.shield });
      this.floater(unit, `${text || "护盾"}+${Math.round(amount)}`, "shield");
      this.ring(unit, "blue");
    }

    heal(source, target, amount) {
      if (!target) return;
      const before = target.hpNow;
      target.hpNow = Math.min(target.maxHp, target.hpNow + amount);
      this.emitSignal({ kind: "heal", tags: this.actionTags(source, ["heal"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(target), amount: target.hpNow - before, skillName: source?._actionSignal?.skillName || "治疗", hpBefore: before, hpAfter: target.hpNow });
      this.floater(target, `治疗+${Math.round(amount)}`, "heal");
      this.ring(target, "green");
    }

    burn(source, target, stacks, time = 6) {
      target.burn.stacks += stacks;
      target.burn.time = Math.max(target.burn.time, time);
      target.burn.source = source;
      this.emitSignal({ kind: "status", tags: this.actionTags(source, ["status", "debuff", "burn", "dotStack"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(target), amount: stacks, skillName: source?._actionSignal?.skillName || "燃烧", meta: { stacks: target.burn.stacks, duration: target.burn.time } });
      this.floater(target, `燃烧+${stacks}`, "fire");
      this.ring(target, "fire");
    }

    poison(source, target, stacks, time = 8) {
      target.poison.stacks = Math.min(20, target.poison.stacks + stacks);
      target.poison.time = Math.max(target.poison.time, time);
      target.poison.source = source;
      this.emitSignal({ kind: "status", tags: this.actionTags(source, ["status", "debuff", "poison", "dotStack"]).filter(Boolean), source: this.unitRef(source), target: this.unitRef(target), amount: stacks, skillName: source?._actionSignal?.skillName || "剧毒", meta: { stacks: target.poison.stacks, duration: target.poison.time } });
      this.floater(target, `剧毒+${stacks}`, "poison");
      this.ring(target, "poison");
    }

    takeRaw(target, amount) {
      if (!target) return;
      target.hpNow = Math.max(1, target.hpNow - amount);
    }

    counterattack(unit, source, effect, context = {}) {
      if (!this.alive(unit) || !this.alive(source) || (unit.counterCd || 0) > 0) return;
      unit.counterCd = effect.cooldown || 0;
      const amount = (effect.flat || 0) + this.effectivePower(unit) * (effect.power || 0) + (context.blocked || 0) * (effect.blockedRatio || 0);
      this.withAction(unit, { tags: ["counter", "reactive"], skillKey: unit.passiveKey || this.skillKey(unit.passive), skillName: effect.label || "反击", meta: { blockedTrigger: context.blocked || 0 } }, () => this.damage(unit, source, amount, "physical", context.visual));
      if (context.visual) this.floater(unit, effect.label || "反击", "shield");
    }

    emitEffectSignal(signal) {
      this.emitSignal({ ...signal, source: this.unitRef(signal.source), target: this.unitRef(signal.target), skillKey: signal.source?._actionSignal?.skillKey || null, skillName: signal.source?._actionSignal?.skillName || "" });
    }

    onDeath(unit, killer) {
      if (unit.deadTriggered) return;
      unit.deadTriggered = true;
      this.emitSignal({ kind: "death", tags: ["death"], source: this.unitRef(killer), target: this.unitRef(unit), skillKey: killer?._actionSignal?.skillKey || null, skillName: killer?._actionSignal?.skillName || "", hpBefore: 0, hpAfter: 0 });
      this.floater(unit, "倒下", "");
    }

    triggerEncore(caster) {
      this.allies(caster).filter((ally) => this.alive(ally) && ally.passive === "返场").forEach((bard) => {
        bard.skillCd = bard.skillCd.map((cd) => Math.max(0, cd - 2));
        this.floater(bard, "返场", "heal");
      });
    }

    cooldownFor(skillName, slot) {
      if (skillName === "血怒斩") return BERSERKER_COOLDOWNS.bloodStrike ?? 5.2;
      if (skillName === "裂骨旋风") return BERSERKER_COOLDOWNS.boneWhirl ?? 8.4;
      return slot === 0 ? 5.2 : 8.4;
    }

    moveToward(unit, target, dt) {
      const d = this.dist(unit, target);
      if (!d) return;
      const step = dt * (unit.slow > 0 ? 4.8 : 8);
      unit.x += ((target.x - unit.x) / d) * step;
      unit.y += ((target.y - unit.y) / d) * step;
    }

    finishIfNeeded() {
      const allyAlive = this.state.units.some((unit) => unit.side === "ally" && this.alive(unit));
      const enemyAlive = this.state.units.some((unit) => unit.side === "enemy" && this.alive(unit));
      if (allyAlive && enemyAlive && this.state.time < this.maxTime) return;
      this.state.running = false;
      if (this.state.raf) clearInterval(this.state.raf);
      this.state.raf = 0;
      const leftHp = this.sideHpScore("ally");
      const rightHp = this.sideHpScore("enemy");
      const passed = leftHp >= rightHp;
      this.state.result = {
        passed,
        winner: passed ? "left" : "right",
        duration: this.state.time,
        leftHp,
        rightHp,
        units: this.state.units,
        signals: this.state.signalBus?.signals || [],
        metrics: this.metrics(),
      };
      this.state.logs.unshift(`${passed ? "胜利" : "失败"} · ${this.state.time.toFixed(1)}s`);
      this.onFinish(this.state.result);
    }

    metrics() {
      return {
        leftAlive: this.state.units.filter((unit) => unit.side === "ally" && this.alive(unit)).length,
        rightAlive: this.state.units.filter((unit) => unit.side === "enemy" && this.alive(unit)).length,
        leftDamage: Math.round(this.state.signalBus?.query(["damage"]).filter((signal) => signal.source?.side === "ally").reduce((sum, signal) => sum + signal.amount, 0) || 0),
        rightDamage: Math.round(this.state.signalBus?.query(["damage"]).filter((signal) => signal.source?.side === "enemy").reduce((sum, signal) => sum + signal.amount, 0) || 0),
        leftHealing: Math.round(this.state.signalBus?.query(["heal"]).filter((signal) => signal.target?.side === "ally").reduce((sum, signal) => sum + signal.amount, 0) || 0),
        leftShield: Math.round(this.state.signalBus?.query(["shield"]).filter((signal) => signal.target?.side === "ally").reduce((sum, signal) => sum + signal.amount, 0) || 0),
      };
    }

    render() {
      if (!this.els) return;
      this.els.state.textContent = this.state.running ? "交战中" : this.state.result ? (this.state.result.passed ? "胜利" : "失败") : "待命";
      this.els.time.textContent = `${this.state.time.toFixed(1)}s`;
      this.els.left.textContent = String(this.state.units.filter((unit) => unit.side === "ally" && this.alive(unit)).length);
      this.els.right.textContent = String(this.state.units.filter((unit) => unit.side === "enemy" && this.alive(unit)).length);
      this.els.unitLayer.innerHTML = this.state.units.map((unit) => `
        <div class="battle-unit ${unit.side === "enemy" ? "enemy" : ""} ${unit.hiddenTimer > 0 ? "hidden" : ""} ${unit.guardTimer > 0 ? "guarded" : ""} ${this.alive(unit) ? "" : "dead"}" style="left:${unit.x}%;top:${unit.y}%">
          <div class="battle-avatar">${unit.icon}</div>
          <div class="battle-unit-name">${unit.name}</div>
          <div class="battle-hp"><span style="width:${Math.max(0, unit.hpNow / unit.maxHp * 100)}%"></span></div>
        </div>
      `).join("");
      this.els.log.innerHTML = this.state.logs.slice(0, 10).map((item) => `<div>${item}</div>`).join("");
    }

    label(unit, text, ult = false) {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-skill-label ${ult ? "ult" : ""}`;
      node.textContent = text;
      node.style.left = `${unit.x}%`;
      node.style.top = `${unit.y - 10}%`;
      this.els.fxLayer.appendChild(node);
      setTimeout(() => node.remove(), ult ? 1050 : 780);
      if (text && text !== "攻击") this.state.logs.unshift(`${unit.name}：${text}`);
    }

    floater(unit, text, cls = "") {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-floater ${cls}`;
      node.textContent = text;
      node.style.left = `${unit.x}%`;
      node.style.top = `${unit.y}%`;
      this.els.fxLayer.appendChild(node);
      setTimeout(() => node.remove(), 900);
    }

    ring(unit, color = "gold") {
      if (!unit || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-ring battle-vfx-${color}`;
      node.style.left = `${unit.x}%`;
      node.style.top = `${unit.y}%`;
      node.style.setProperty("--scale", "1");
      this.els.fxLayer.appendChild(node);
      setTimeout(() => node.remove(), 720);
    }

    afterimage(before, unit, color = "purple") {
      if (!unit || !before || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-afterimage battle-vfx-${color}`;
      node.style.left = `${before.x}%`;
      node.style.top = `${before.y}%`;
      node.textContent = unit.icon || "";
      this.els.fxLayer.appendChild(node);
      setTimeout(() => node.remove(), 520);
    }

    slash(source, target, color = "gold") {
      if (!source || !target || !this.els?.fxLayer) return;
      const node = document.createElement("img");
      node.className = `battle-vfx-slash battle-vfx-${color}`;
      node.src = `${SLASH_BASE}/slash_02_a.png`;
      node.style.left = `${(source.x + target.x) / 2}%`;
      node.style.top = `${(source.y + target.y) / 2}%`;
      node.style.setProperty("--angle", `${Math.atan2(target.y - source.y, target.x - source.x)}rad`);
      node.style.setProperty("--scale", "1");
      this.els.fxLayer.appendChild(node);
      setTimeout(() => node.remove(), 480);
    }

    beam(source, target, color = "blue") {
      if (!source || !target || !this.els?.fxLayer) return;
      const node = document.createElement("div");
      node.className = `battle-vfx-beam battle-vfx-${color}`;
      const length = this.dist(source, target);
      node.style.left = `${source.x}%`;
      node.style.top = `${source.y}%`;
      node.style.width = `${length}%`;
      node.style.transform = `rotate(${Math.atan2(target.y - source.y, target.x - source.x)}rad)`;
      this.els.fxLayer.appendChild(node);
      setTimeout(() => node.remove(), 360);
    }

    chooseTarget(unit) {
      const foes = this.enemies(unit).filter((enemy) => this.alive(enemy));
      if (!foes.length) return null;
      const taunters = unit.range < 20 ? foes.filter((foe) => foe.taunt > 0) : [];
      if (taunters.length) return taunters.sort(this.byDistance(unit))[0];
      if (unit.roleKey === "assassin") return foes.sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0];
      const front = foes.filter((foe) => foe.line === "前排");
      return (front.length && unit.range < 30 ? front : foes).sort(this.byDistance(unit))[0];
    }

    allies(unit) { return this.state.units.filter((item) => item.side === unit.side); }
    enemies(unit) { return this.state.units.filter((item) => item.side !== unit.side); }
    alive(unit) { return unit && unit.hpNow > 0; }
    hpRatio(unit) { return unit.hpNow / unit.maxHp; }
    dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
    byDistance(unit) { return (a, b) => this.dist(unit, a) - this.dist(unit, b); }
    statusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slow > 0 ? 2 : 0) + (unit.mark || 0); }
    effectivePower(unit) { return unit.power + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0); }
    lowestEnemy(unit) { return this.enemies(unit).filter((enemy) => this.alive(enemy)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
    lowestHpAlly(unit) { return this.allies(unit).filter((ally) => this.alive(ally)).sort((a, b) => this.hpRatio(a) - this.hpRatio(b))[0]; }
    carryAlly(unit) { return this.allies(unit).filter((ally) => this.alive(ally)).sort((a, b) => this.effectivePower(b) - this.effectivePower(a))[0]; }
    sideHpScore(side) { return this.state.units.filter((unit) => unit.side === side).reduce((sum, unit) => sum + Math.max(0, unit.hpNow / unit.maxHp), 0); }
    unitRef(unit) { return SIGNALS.unitRef ? SIGNALS.unitRef(unit) : unit ? { id: unit.unitId || unit.id, name: unit.name, side: unit.side, role: unit.roleName } : null; }
    emitSignal(signal) { this.state.signalBus?.emit({ time: this.state.time, ...signal }); }
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
    actionTags(source, tags) { return [...(source?._actionSignal?.tags || []), ...tags]; }
    activeWindows(unit) {
      return [
        unit.bloodFury > 0 ? "bloodFury" : "",
        unit.whirlwind > 0 ? "whirlwind" : "",
        unit.roarFury > 0 ? "roarFury" : "",
        unit.haste > 0 ? "haste" : "",
      ].filter(Boolean);
    }
  }

  window.GAME_BATTLE_VIEW = {
    mount(options) {
      return new BattleView(options);
    },
  };
})();
