const GAME_RUNTIME_FIELD_EFFECTS = (() => {
const EFFECTS = [
  {
    id: "sentry_suppression",
    name: "哨塔压制",
    focus: "敌方后排在被近战贴住前更危险",
    expected: "刺客、冲锋骑士、能快速接触后排的队伍",
    candidates: [
      { id: "shadowExecute", preset: "shadowExecute" },
      { id: "cavalryBreak", preset: "cavalryBreak" },
      { id: "frostTrapField", preset: "frostTrapField" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "four_ranged_damage", roles: ["ranger", "mage", "warlock", "alchemist"] },
      { id: "frontline_contact", roles: ["knight", "warrior", "assassin", "priest"] },
    ],
    swaps: [
      { id: "fire_add_assassin", from: ["warrior", "knight", "mage", "mage"], to: ["warrior", "knight", "assassin", "mage"], note: "same fire front, replace one caster with a backline engager" },
      { id: "ranged_add_knight", from: ["ranger", "mage", "warlock", "alchemist"], to: ["knight", "mage", "warlock", "alchemist"], note: "ranged damage core, add contact pressure" },
    ],
  },
  {
    id: "heavy_shield_line",
    name: "重盾阵线",
    focus: "前排开局获得明显护盾",
    expected: "破盾、集火、持续输出队伍",
    candidates: [
      { id: "cavalryBreak", preset: "cavalryBreak" },
      { id: "duelChampion", preset: "duelChampion" },
      { id: "lightningTempo", preset: "lightningTempo" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "holySustain", preset: "holySustain" },
      { id: "shieldbreaker_mix", roles: ["knight", "warrior", "ranger", "bard"] },
    ],
    swaps: [
      { id: "sustain_add_ranger", from: ["knight", "warrior", "priest", "priest"], to: ["knight", "warrior", "ranger", "priest"], note: "drop one healer for shield-breaking ranged pressure" },
      { id: "duel_add_ranger", from: ["warrior", "knight", "priest", "bard"], to: ["warrior", "ranger", "priest", "bard"], note: "turn duel support into front shield pressure" },
    ],
  },
  {
    id: "old_tower_prison",
    name: "旧塔狱门",
    focus: "敌方前排持盾掩护后排哨手，破盾军械可以明显缩短攻坚时间",
    expected: "破盾装备、持续盯住前排、快速接触后排",
    candidates: [],
    swaps: [],
  },
  {
    id: "heavy_shield_lock",
    name: "重盾锁阵",
    focus: "候选关卡专用：重盾阻力与命名破盾军械形成可验证锁钥",
    expected: "现有构筑可绕过；失败路线通过军械营地获得破盾与裂甲钥匙",
    candidates: [],
    swaps: [],
  },
  {
    id: "pressure_corridor",
    name: "高压回廊",
    focus: "开局周期性压低全场血量",
    expected: "治疗、护盾、低血收益队伍",
    candidates: [
      { id: "crownCarry", preset: "crownCarry" },
      { id: "bloodRage", preset: "bloodRage" },
      { id: "holySustain", preset: "holySustain" },
      { id: "scarletVanguard", preset: "scarletVanguard" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "double_priest_berserker", roles: ["berserker", "warrior", "priest", "priest"] },
    ],
    swaps: [
      { id: "rage_add_priest", from: ["berserker", "warrior", "mage", "bard"], to: ["berserker", "warrior", "priest", "bard"], note: "replace burst with recovery under opening pressure" },
      { id: "frontline_add_priest", from: ["knight", "warrior", "mage", "bard"], to: ["knight", "warrior", "priest", "bard"], note: "keep frontline plan, replace burst with recovery" },
    ],
  },
  {
    id: "delay_mud",
    name: "迟滞泥地",
    focus: "近战接敌变慢，控制更容易创造窗口",
    expected: "冰控、陷阱、远程持续输出队伍",
    candidates: [
      { id: "frostControl", preset: "frostControl" },
      { id: "frostTrapField", preset: "frostTrapField" },
      { id: "bulwarkMarks", preset: "bulwarkMarks" },
      { id: "four_ranged_damage", roles: ["ranger", "mage", "warlock", "alchemist"] },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "control_backline", roles: ["knight", "mage", "alchemist", "bard"] },
    ],
    swaps: [
      { id: "melee_add_mage", from: ["knight", "warrior", "ranger", "bard"], to: ["knight", "mage", "ranger", "bard"], note: "keep one front, replace one melee with control" },
      { id: "marks_add_mage", from: ["knight", "ranger", "ranger", "bard"], to: ["knight", "ranger", "mage", "bard"], note: "replace one mark slot with control" },
    ],
  },
  {
    id: "war_drum_echo",
    name: "战鼓回声",
    focus: "连续普攻叠节奏",
    expected: "游侠、狂战、吟游加速普攻队伍",
    candidates: [
      { id: "lightningTempo", preset: "lightningTempo" },
      { id: "bloodRage", preset: "bloodRage" },
      { id: "bulwarkMarks", preset: "bulwarkMarks" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "basic_attack_core", roles: ["warrior", "ranger", "ranger", "bard"] },
    ],
    swaps: [
      { id: "marks_add_bard", from: ["knight", "ranger", "ranger", "priest"], to: ["knight", "ranger", "ranger", "bard"], note: "replace passive recovery with attack rhythm" },
      { id: "rage_add_bard", from: ["berserker", "warrior", "priest", "mage"], to: ["berserker", "warrior", "priest", "bard"], note: "add attack rhythm to low-HP melee core" },
    ],
  },
  {
    id: "blood_moon_rise",
    name: "血月升起",
    focus: "15 秒时低血单位获得短暂爆发窗口",
    expected: "低血狂战、能保低血核心的队伍",
    candidates: [
      { id: "bloodRage", preset: "bloodRage" },
      { id: "scarletVanguard", preset: "scarletVanguard" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "holySustain", preset: "holySustain" },
      { id: "shadowExecute", preset: "shadowExecute" },
      { id: "low_hp_core", roles: ["berserker", "knight", "priest", "bard"] },
    ],
    swaps: [
      { id: "rage_add_berserker", from: ["warrior", "knight", "priest", "bard"], to: ["berserker", "knight", "priest", "bard"], note: "replace stable fighter with low-HP carry" },
      { id: "scarlet_add_priest", from: ["berserker", "warrior", "mage", "bard"], to: ["berserker", "warrior", "priest", "bard"], note: "protect the blood moon target" },
    ],
  },
  {
    id: "king_flag",
    name: "王旗落地",
    focus: "前排守旗，阵亡后全队反扑",
    expected: "强前排、殉道、反打队伍",
    candidates: [
      { id: "ironWall", preset: "ironWall" },
      { id: "martyrFrontline", preset: "martyrFrontline" },
      { id: "cavalryBreak", preset: "cavalryBreak" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "flag_guard_mix", roles: ["knight", "priest", "warlock", "ranger"] },
    ],
    swaps: [
      { id: "attrition_add_knight", from: ["priest", "warrior", "warlock", "ranger"], to: ["knight", "warrior", "warlock", "ranger"], note: "add a real guard to trigger flag protection" },
      { id: "guard_add_knight", from: ["warrior", "priest", "warlock", "ranger"], to: ["knight", "priest", "warlock", "ranger"], note: "replace fighter with a dedicated flag guard" },
    ],
  },
  {
    id: "mirror_curse",
    name: "镜像诅咒",
    focus: "最高攻击单位输出时会反噬自己",
    expected: "多核、治疗、护盾、非单核爆发队伍",
    candidates: [
      { id: "holySustain", preset: "holySustain" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "alchemyChaos", preset: "alchemyChaos" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "shadowExecute", preset: "shadowExecute" },
      { id: "multi_core_safe", roles: ["knight", "mage", "ranger", "priest"] },
    ],
    swaps: [
      { id: "single_carry_add_second_core", from: ["knight", "priest", "bard", "berserker"], to: ["knight", "priest", "mage", "berserker"], note: "add second damage core under mirror reflection" },
      { id: "execute_add_mage", from: ["knight", "assassin", "assassin", "warlock"], to: ["knight", "assassin", "mage", "warlock"], note: "replace one assassin with a second non-reflected damage core" },
    ],
  },
  {
    id: "hunting_whistle",
    name: "猎场鸣哨",
    focus: "后排低血目标周期性被猎杀标记",
    expected: "刺客、游侠、后排收割队伍",
    candidates: [
      { id: "shadowExecute", preset: "shadowExecute" },
      { id: "lightningTempo", preset: "lightningTempo" },
      { id: "bulwarkMarks", preset: "bulwarkMarks" },
      { id: "frostTrapField", preset: "frostTrapField" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "hunt_backline", roles: ["knight", "assassin", "ranger", "bard"] },
    ],
    swaps: [
      { id: "marks_add_assassin", from: ["knight", "ranger", "mage", "bard"], to: ["knight", "assassin", "ranger", "bard"], note: "replace a caster with a diver to cash in the whistle mark" },
      { id: "tempo_add_ranger", from: ["warrior", "ranger", "bard", "mage"], to: ["warrior", "ranger", "bard", "ranger"], note: "double down on marked backline pressure" },
    ],
  },
  {
    id: "ember_contagion",
    name: "余火传染",
    focus: "首个阵亡单位留下会传染的火种",
    expected: "治疗、控场、拖时间、火毒异常队伍",
    candidates: [
      { id: "poisonBloom", preset: "poisonBloom" },
      { id: "alchemyChaos", preset: "alchemyChaos" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "frostControl", preset: "frostControl" },
      { id: "holySustain", preset: "holySustain" },
      { id: "ember_sustain", roles: ["knight", "priest", "alchemist", "warlock"] },
    ],
    swaps: [
      { id: "status_add_priest", from: ["knight", "mage", "warlock", "alchemist"], to: ["knight", "priest", "warlock", "alchemist"], note: "replace burst caster with sustain to hold ember tempo" },
      { id: "frost_add_alchemist", from: ["knight", "priest", "mage", "bard"], to: ["knight", "priest", "mage", "alchemist"], note: "add status pressure around ember transfer" },
    ],
  },
  {
    id: "death_inheritance",
    name: "Death Inheritance",
    focus: "Dead units pass part of their stats to the nearest living ally",
    expected: "martyr front line, sacrifice frontliners, protect-one-carry teams",
    candidates: [
      { id: "martyrFrontline", preset: "martyrFrontline" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "ironWall", preset: "ironWall" },
      { id: "holySustain", preset: "holySustain" },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "inherit_carry", roles: ["warrior", "priest", "bard", "berserker"] },
    ],
    swaps: [
      { id: "add_sacrifice_front", from: ["knight", "mage", "warlock", "ranger"], to: ["knight", "warrior", "warlock", "ranger"], note: "keep the guard and add a frontliner whose death feeds nearby allies" },
      { id: "carry_near_martyr", from: ["knight", "warrior", "mage", "bard"], to: ["knight", "warrior", "priest", "bard"], note: "replace burst with a martyr-style support near the carry line" },
    ],
  },
  {
    id: "shield_detonation",
    name: "Shield Detonation",
    focus: "Overshielded units explode, consume their shield, and damage nearby enemies",
    expected: "knight, priest, shield stacking, defensive front-line teams",
    candidates: [
      { id: "holySustain", preset: "holySustain" },
      { id: "ironWall", preset: "ironWall" },
      { id: "crownCarry", preset: "crownCarry" },
      { id: "kingFlagMix", roles: ["knight", "priest", "warrior", "bard"] },
      { id: "fireBurst", preset: "fireBurst" },
      { id: "shield_bomb", roles: ["knight", "priest", "priest", "ranger"] },
    ],
    swaps: [
      { id: "add_second_priest", from: ["knight", "warrior", "priest", "bard"], to: ["knight", "warrior", "priest", "priest"], note: "add more shield/heal generation to trigger detonations" },
      { id: "add_knight_bomb", from: ["warrior", "mage", "priest", "bard"], to: ["knight", "mage", "priest", "bard"], note: "replace fighter with a shield anchor" },
    ],
  },
  {
    id: "wildfire_rings",
    name: "Wildfire Rings",
    focus: "Backline units carry expanding fire rings that burn everyone inside",
    expected: "fire/status teams, control teams, sustain teams, backline spacing puzzles",
    candidates: [
      { id: "fireBurst", preset: "fireBurst" },
      { id: "alchemyChaos", preset: "alchemyChaos" },
      { id: "frostControl", preset: "frostControl" },
      { id: "holySustain", preset: "holySustain" },
      { id: "four_ranged_damage", roles: ["ranger", "mage", "warlock", "alchemist"] },
      { id: "wildfire_control", roles: ["knight", "mage", "alchemist", "priest"] },
      { id: "wildfire_backline_assassin", roles: ["knight", "priest", "mage", "assassin"] },
      { id: "wildfire_assassin_delivery", roles: ["knight", "mage", "warlock", "assassin"] },
    ],
    swaps: [
      { id: "add_control_to_fire", from: ["warrior", "knight", "mage", "mage"], to: ["warrior", "knight", "mage", "alchemist"], note: "replace one fire caster with control/status to hold enemies in the rings" },
      { id: "add_sustain_to_ranged", from: ["ranger", "mage", "warlock", "alchemist"], to: ["ranger", "mage", "priest", "warlock"], note: "add sustain so the backline survives its own rings" },
      { id: "add_backline_assassin_delivery", from: ["knight", "mage", "warlock", "alchemist"], to: ["knight", "mage", "warlock", "assassin"], note: "replace one backline caster with a backline assassin who carries the fire ring into enemies" },
    ],
  },
];

function createRuntimeField(effectId, sim) {
  if (!effectId) return null;
  const def = EFFECTS.find((item) => item.id === effectId);
  if (!def) throw new Error(`Unknown runtime field effect: ${effectId}`);
  const helpers = createHelpers(sim, def);
  const state = { timers: {}, flags: {}, lastTick: 0 };
  const api = {
    id: def.id,
    def,
    setup() {
      if (def.id === "heavy_shield_line" || def.id === "heavy_shield_lock" || def.id === "old_tower_prison") {
        sim.units.filter((unit) => helpers.isFront(unit)).forEach((unit) => {
          const ratio = def.id === "old_tower_prison" && unit.side === "right" ? 0.42 : ["heavy_shield_line", "heavy_shield_lock"].includes(def.id) ? 0.34 : 0;
          if (!ratio) return;
          sim.shield(unit, unit.maxHp * ratio, def.name, unit);
          helpers.fieldSignal(def.id === "old_tower_prison" ? "狱门护盾" : "重盾", unit, { amount: Math.round(unit.maxHp * ratio) });
        });
      }
      if (def.id === "king_flag") {
        ["left", "right"].forEach((side) => {
          const guard = helpers.frontUnits(side).sort((a, b) => helpers.centerDistance(a) - helpers.centerDistance(b))[0];
          if (guard) {
            guard.fieldFlagGuard = true;
            helpers.fieldSignal("守旗", guard);
          }
        });
      }
      if (def.id === "mirror_curse") {
        ["left", "right"].forEach((side) => {
          const target = helpers.living(side).sort((a, b) => helpers.powerScore(b) - helpers.powerScore(a))[0];
          if (target) {
            target.fieldMirror = true;
            helpers.fieldSignal("镜像", target);
          }
        });
      }
      if (def.id === "wildfire_rings") {
        helpers.alive().filter((unit) => helpers.isBack(unit)).forEach((unit) => {
          unit.fieldWildfireCarrier = true;
          helpers.fieldSignal("Wildfire", unit, { radius: 8 });
        });
      }
    },
    beforeUpdate(dt) {
      if (def.id === "pressure_corridor" && sim.time <= 13 && helpers.elapsed("corridor", 3)) {
        helpers.alive().forEach((unit) => helpers.fieldDamage(unit, unit.maxHp * 0.06, "高压", { floorRatio: 0.34 }));
      }
      if (def.id === "blood_moon_rise" && sim.time >= 12 && !state.flags.bloodMoon) {
        state.flags.bloodMoon = true;
        ["left", "right"].forEach((side) => {
          const unit = helpers.living(side).sort((a, b) => helpers.bloodMoonPriority(a) - helpers.bloodMoonPriority(b))[0];
          if (unit) {
            unit.fieldBloodMoonTimer = 10;
            sim.shield(unit, unit.maxHp * 0.25, def.name, unit);
            helpers.fieldSignal("血月", unit, { duration: 10 });
          }
        });
      }
      if (def.id === "hunting_whistle" && helpers.elapsed("hunt", 10)) {
        ["left", "right"].forEach((side) => {
          const unit = helpers.living(side).filter((item) => helpers.isBack(item)).sort((a, b) => a.hp - b.hp)[0];
          if (unit) {
            unit.fieldHuntedTimer = 5;
            helpers.fieldSignal("猎标", unit, { duration: 5 });
          }
        });
      }
      if (def.id === "ember_contagion" && helpers.elapsed("emberTick", 1)) {
        helpers.alive().filter((unit) => unit.fieldEmberHolder).forEach((unit) => helpers.fieldDamage(unit, unit.maxHp * 0.08, "余火"));
      }
      if (def.id === "wildfire_rings") {
        const radius = 6 + Math.floor(sim.time / 4) * 1.8;
        if (helpers.elapsed("wildfireTick", 1)) {
          helpers.alive().filter((unit) => unit.fieldWildfireCarrier).forEach((carrier) => {
            helpers.alive().filter((unit) => unit.id !== carrier.id && helpers.distance(unit, carrier) <= radius).forEach((unit) => {
              sim.addBurn(unit, 1, 4, carrier);
              helpers.fieldDamage(unit, 3 + radius * 0.55, "Wildfire");
            });
          });
        }
        if (helpers.elapsed("wildfireGrow", 4)) {
          helpers.alive().filter((unit) => unit.fieldWildfireCarrier).forEach((unit) => helpers.fieldSignal("Wildfire expands", unit, { radius: Math.round(radius) }));
        }
      }
      helpers.alive().forEach((unit) => {
        unit.fieldBloodMoonTimer = Math.max(0, (unit.fieldBloodMoonTimer || 0) - dt);
        unit.fieldFlagRallyTimer = Math.max(0, (unit.fieldFlagRallyTimer || 0) - dt);
        unit.fieldHuntedTimer = Math.max(0, (unit.fieldHuntedTimer || 0) - dt);
      });
    },
    beforeHit(source, target, context) {
      if (!source || !target) return;
      if (def.id === "sentry_suppression") {
        if (helpers.isBack(target) && helpers.isMelee(source) && !target.fieldSentryEngaged) {
          target.fieldSentryEngaged = true;
          helpers.fieldSignal("哨塔失效", target, { source: source.id });
        }
        if (helpers.isBack(source) && !source.fieldSentryEngaged) context.amount *= 1.38;
      }
      if (def.id === "old_tower_prison") {
        if (helpers.isBack(target) && helpers.isMelee(source) && !target.fieldSentryEngaged) {
          target.fieldSentryEngaged = true;
          helpers.fieldSignal("狱塔哨手被贴身", target, { source: source.id });
        }
        if (helpers.isBack(source) && !source.fieldSentryEngaged) context.amount *= 1.28;
        if (target.shield > 0) {
          const breakPoints = Number(source.mechanicModifiers?.shieldBreak || 0);
          context.amount *= 1 + Math.min(0.7, breakPoints * 0.025);
          if (breakPoints > 0 && !source.fieldShieldBreakSignaled) {
            source.fieldShieldBreakSignaled = true;
            helpers.fieldSignal("破盾军械生效", target, { source: source.id, points: breakPoints });
          }
        } else if ((target.armor || 0) > 0) {
          const armorBreakPoints = Number(source.mechanicModifiers?.armorBreak || 0);
          context.amount *= 1 + Math.min(0.45, armorBreakPoints * 0.018);
          if (armorBreakPoints > 0 && !source.fieldArmorBreakSignaled) {
            source.fieldArmorBreakSignaled = true;
            helpers.fieldSignal("裂甲军械生效", target, { source: source.id, points: armorBreakPoints });
          }
        }
      }
      if (def.id === "heavy_shield_lock") {
        if (target.shield > 0) {
          const breakPoints = Number(source.mechanicModifiers?.shieldBreak || 0);
          context.amount *= 1 + Math.min(0.7, breakPoints * 0.025);
          const signalKey = `shieldBreak:${source.side}`;
          if (breakPoints > 0 && !state.flags[signalKey]) {
            state.flags[signalKey] = true;
            helpers.fieldSignal("破盾军械生效", target, { source: source.id, points: breakPoints });
          }
        } else if ((target.armor || 0) > 0) {
          const armorBreakPoints = Number(source.mechanicModifiers?.armorBreak || 0);
          context.amount *= 1 + Math.min(0.45, armorBreakPoints * 0.018);
          const signalKey = `armorBreak:${source.side}`;
          if (armorBreakPoints > 0 && !state.flags[signalKey]) {
            state.flags[signalKey] = true;
            helpers.fieldSignal("裂甲军械生效", target, { source: source.id, points: armorBreakPoints });
          }
        }
      }
      if (["heavy_shield_line", "heavy_shield_lock"].includes(def.id) && target.shield > 0 && ["warrior", "ranger", "berserker"].includes(source.role)) {
        context.amount *= 2.2;
      }
      if (def.id === "war_drum_echo" && source._actionSignal?.tags?.includes("basic")) {
        const stacks = Math.min(5, source.fieldDrumStacks || 0);
        context.amount *= 1 + stacks * 0.065;
        source.fieldDrumStacks = Math.min(5, stacks + 1);
        if (source.fieldDrumStacks !== stacks) helpers.fieldSignal(`战鼓${source.fieldDrumStacks}`, source);
      }
      if (def.id === "blood_moon_rise" && source.fieldBloodMoonTimer > 0) context.amount *= 1.55;
      if (def.id === "king_flag") {
        if (target.fieldFlagGuard) context.amount *= 0.78;
        if (source.fieldFlagRallyTimer > 0) context.amount *= 1.24;
      }
      if (def.id === "hunting_whistle" && target.fieldHuntedTimer > 0 && (source.role === "assassin" || source.role === "ranger" || source.range >= 32)) {
        context.amount *= 2;
      }
      if (def.id === "wildfire_rings" && target.burn?.stacks > 0 && ["mage", "alchemist", "warlock"].includes(source.role)) {
        context.amount *= 1.12;
      }
    },
    beforeHeal(source, target, context) {
      if (def.id === "pressure_corridor" && sim.time <= 16 && sim.hpRatio(target) < 0.65) context.amount *= 1.35;
      if (def.id === "blood_moon_rise" && target.fieldBloodMoonTimer > 0) context.amount *= 1.55;
      if (def.id === "wildfire_rings" && target.burn?.stacks > 0) context.amount *= 1.12;
    },
    beforeShield(source, target, context) {
      if (def.id === "pressure_corridor" && sim.time <= 16 && sim.hpRatio(target) < 0.75) context.amount *= 1.32;
    },
    afterShield(source, target) {
      if (def.id !== "shield_detonation" || !sim.isAlive(target) || target.fieldShieldDetonationLock) return;
      const threshold = target.maxHp * 0.34;
      if ((target.shield || 0) < threshold) return;
      const consumed = target.shield;
      target.shield = 0;
      target.fieldShieldDetonationLock = true;
      helpers.fieldSignal("Shield detonation", target, { consumed: Math.round(consumed) });
      sim.enemiesOf(target).filter((enemy) => sim.isAlive(enemy) && helpers.distance(enemy, target) <= 42).forEach((enemy) => {
        helpers.fieldDamage(enemy, consumed * 0.5, "Shield detonation");
      });
      target.fieldShieldDetonationLock = false;
    },
    afterDamage(source, target, context) {
      if (def.id === "blood_moon_rise" && source?.fieldBloodMoonTimer > 0 && context.remaining > 0 && sim.isAlive(source)) {
        sim.healUnit(source, context.remaining * 0.35, "血月吸取", source);
      }
      if (def.id === "mirror_curse" && source?.fieldMirror && context.remaining > 0 && !state.flags.reflecting) {
        state.flags.reflecting = true;
        helpers.fieldDamage(source, context.remaining * 0.7, "镜像反噬");
        state.flags.reflecting = false;
      }
    },
    afterDeath(unit) {
      if (def.id === "death_inheritance" && !unit.fieldInheritanceSpent) {
        unit.fieldInheritanceSpent = true;
        const target = helpers.living(unit.side).filter((ally) => ally.id !== unit.id).sort((a, b) => helpers.distance(unit, a) - helpers.distance(unit, b))[0];
        if (target) {
          const hpGain = Math.round(unit.maxHp * 0.9);
          const powerGain = Math.round(helpers.powerScore(unit) * 0.9);
          const armorGain = Math.max(1, Math.round((unit.armor || 0) * 0.9));
          target.maxHp += hpGain;
          target.hp += hpGain;
          target.power += powerGain;
          target.physicalPower += powerGain;
          target.magicPower += powerGain;
          target.armor += armorGain;
          helpers.fieldSignal("Inheritance", target, { from: unit.id, hpGain, powerGain, armorGain });
        }
      }
      if (def.id === "king_flag" && unit.fieldFlagGuard) {
        helpers.living(unit.side).forEach((ally) => {
          ally.fieldFlagRallyTimer = 6;
          helpers.fieldSignal("王旗反扑", ally, { duration: 6 });
        });
      }
      if (def.id === "ember_contagion" && (unit.fieldEmberHolder || !state.flags.emberStarted)) {
        state.flags.emberStarted = true;
        const target = helpers.alive().sort((a, b) => helpers.distance(unit, a) - helpers.distance(unit, b))[0];
        if (target) {
          helpers.alive().forEach((item) => { item.fieldEmberHolder = false; });
          target.fieldEmberHolder = true;
          helpers.fieldSignal("余火附身", target);
        }
      }
    },
    moveSpeedMult(unit) {
      if (def.id === "delay_mud" && helpers.isMelee(unit)) return 0.84;
      return 1;
    },
  };
  return api;
}

function createHelpers(sim, def) {
  const timers = {};
  return {
    alive: () => sim.units.filter((unit) => sim.isAlive(unit)),
    living: (side) => sim.units.filter((unit) => unit.side === side && sim.isAlive(unit)),
    frontUnits: (side) => sim.units.filter((unit) => unit.side === side && unit.slotIndex < 2 && sim.isAlive(unit)),
    isFront: (unit) => unit.slotIndex < 2,
    isBack: (unit) => unit.slotIndex >= 2,
    isMelee: (unit) => unit.range <= 18,
    bloodMoonPriority: (unit) => (unit.role === "berserker" ? -2 : 0) + sim.hpRatio(unit),
    powerScore: (unit) => Math.max(unit.physicalPower || 0, unit.magicPower || 0, unit.power || 0),
    centerDistance: (unit) => Math.hypot(unit.x - 50, unit.y - 50),
    distance: (a, b) => Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)),
    elapsed(key, interval) {
      if (!timers[key]) timers[key] = 0;
      if (sim.time + 0.001 < timers[key]) return false;
      timers[key] = sim.time + interval;
      return true;
    },
    fieldDamage(unit, amount, label, options = {}) {
      if (!unit || !sim.isAlive(unit)) return;
      if (Number.isFinite(options.floorRatio)) {
        const floorHp = unit.maxHp * options.floorRatio;
        amount = Math.min(amount, Math.max(0, unit.hp - floorHp));
        if (amount <= 0) return;
      }
      sim.takeDamage(null, unit, amount, "field", label);
    },
    fieldSignal(text, unit, meta = {}) {
      const sourceUnit = meta.source ? sim.units.find((candidate) => candidate.id === meta.source) : null;
      sim.emitSignal({
        kind: "field",
        tags: ["field", def.id],
        source: sourceUnit ? { id: sourceUnit.id, side: sourceUnit.side, index: sourceUnit.index, role: sourceUnit.role, name: sourceUnit.name } : null,
        target: unit ? { id: unit.id, side: unit.side, index: unit.index, role: unit.role, name: unit.name } : null,
        text,
        skillName: def.name,
        meta,
      });
    },
  };
}

return { effects: EFFECTS, createRuntimeField };
})();

if (typeof window !== "undefined") window.GAME_RUNTIME_FIELD_EFFECTS = GAME_RUNTIME_FIELD_EFFECTS;
if (typeof module !== "undefined") module.exports = GAME_RUNTIME_FIELD_EFFECTS;
