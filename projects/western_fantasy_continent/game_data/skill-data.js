const GAME_SKILL_DATA = (() => {
  const assets = resolveAssets();
  const { TYPE, roleKits, skills, presets, berserkerModel } = assets;

  function createSkillLibrary(api) {
    const iconBase = api.iconBase || "";
    return Object.fromEntries(Object.entries(skills).map(([key, def]) => [key, {
      ...def,
      icon: `${iconBase}/${def.icon}.svg`,
      cast: (context) => executeEffects(def.effects || [], context, api),
    }]));
  }

  function executeEffects(effects, context, api) {
    for (const effect of effects) executeEffect(effect, context, api);
  }

  function triggerReactiveEffects(event, context, api) {
    const passive = skills[context.unit?.passiveKey || context.unit?.passive];
    for (const effect of passive?.effects || []) {
      if (effect.kind === "counterOnDamageTaken" && event === "afterDamageTaken") {
        if (effect.requiresBlockedDamage && !(context.blocked > 0)) continue;
        if (effect.meleeOnly && !(context.source?.range < 20)) continue;
        api.counterattack?.(context.unit, context.source, effect, context);
      }
    }
    const teamEffect = context.unit?.retaliationTimer > 0 ? context.unit.retaliationEffect : null;
    if (teamEffect && event === "afterDamageTaken") {
      if (teamEffect.requiresBlockedDamage && !(context.blocked > 0)) return;
      if (teamEffect.meleeOnly && !(context.source?.range < 20)) return;
      api.counterattack?.(context.unit, context.source, teamEffect, context);
    }
  }

  function executeEffect(effect, context, api) {
    const { unit, target, visual } = context;
    const power = api.effectivePower ? api.effectivePower(unit) : unit.power;
    const enemies = (count, anchor = unit) => api.enemiesOf(unit).filter(api.isAlive).sort(api.byDistance(anchor)).slice(0, count ?? Infinity);
    const allies = () => api.alliesOf(unit).filter(api.isAlive);
    const setTimer = (owner, timerName, duration) => {
      const key = api.timerAliases?.[timerName] || timerName;
      owner[key] = Math.max(owner[key] || 0, duration);
    };

    if (effect.kind === "timer") {
      setTimer(unit, effect.timer, effect.duration);
      api.emitEffectSignal?.({
        kind: "status",
        tags: ["status", "buff", "timer", effect.timer],
        source: unit,
        target: unit,
        amount: effect.duration,
        meta: { timer: effect.timer, duration: effect.duration },
      });
      if (effect.label) api.floater(unit, effect.label, effect.tone || "heal");
    } else if (effect.kind === "chargeToTarget" && target) {
      api.chargeToTarget?.(unit, target, effect);
    } else if (effect.kind === "targetTimer" && target) {
      setTimer(target, effect.timer, effect.duration);
      api.emitEffectSignal?.({
        kind: "status",
        tags: ["status", "debuff", effect.timer === "slowTimer" ? "slow" : "timer"],
        source: unit,
        target,
        amount: effect.duration,
        meta: { timer: effect.timer, duration: effect.duration },
      });
    } else if (effect.kind === "hitTarget" && target) {
      api.hit(unit, target, effect.flat + power * effect.power, effect.type, effect.label, visual);
    } else if (effect.kind === "hitEnemies") {
      enemies(effect.count).forEach((enemy) => api.hit(unit, enemy, effect.flat + power * effect.power, effect.type, effect.label, visual));
    } else if (effect.kind === "shieldBreakEnemies") {
      enemies(effect.count).forEach((enemy) => api.breakShield?.(unit, enemy, effect.amount, effect.label));
    } else if (effect.kind === "poisonTarget" && target) {
      api.addPoison(target, effect.stacks, effect.time, unit, visual);
    } else if (effect.kind === "burnTarget" && target) {
      api.addBurn(target, effect.stacks, effect.time, unit, visual);
    } else if (effect.kind === "markTarget" && target) {
      target.mark = Math.min(effect.max, (target.mark || 0) + effect.stacks);
      api.emitEffectSignal?.({
        kind: "status",
        tags: ["status", "debuff", "mark", "stack"],
        source: unit,
        target,
        amount: effect.stacks,
        meta: { stacks: target.mark },
      });
    } else if (effect.kind === "hitMarkedTarget" && target) {
      api.hit(unit, target, effect.flat + power * effect.power + (target.mark || 0) * effect.perMark, effect.type, effect.label, visual);
    } else if (effect.kind === "hitLowestEnemy") {
      const enemy = api.lowestEnemy(unit);
      if (enemy) api.hit(unit, enemy, effect.flat + power * effect.power + (1 - api.hpRatio(enemy)) * effect.missingTargetHpFlat, effect.type, effect.label, visual);
    } else if (effect.kind === "burningEnemies") {
      api.enemiesOf(unit).filter((enemy) => api.isAlive(enemy) && enemy.burn.stacks > 0).slice(0, effect.count).forEach((enemy) => {
        api.hit(unit, enemy, effect.flat + enemy.burn.stacks * effect.perBurn, effect.type, effect.label, visual);
        api.addBurn(enemy, effect.addBurn, effect.burnTime, unit, visual);
      });
    } else if (effect.kind === "healLowestAlly") {
      api.healUnit(api.lowestHpAlly(unit), effect.flat + power * effect.power, effect.label, visual);
    } else if (effect.kind === "shieldLowestAlly") {
      api.shield(api.lowestHpAlly(unit), effect.flat + power * effect.power, effect.label, visual);
    } else if (effect.kind === "shieldCarryAlly") {
      api.shield(api.carryAlly(unit), effect.flat + power * effect.power, effect.label, visual);
    } else if (effect.kind === "lowestAllyTimer") {
      const ally = api.lowestHpAlly(unit);
      if (ally) setTimer(ally, effect.timer, effect.duration);
    } else if (effect.kind === "carryTimer") {
      const ally = api.carryAlly(unit);
      if (ally) setTimer(ally, effect.timer, effect.duration);
    } else if (effect.kind === "selfRawDamage") {
      api.takeRaw(unit, unit.maxHp * effect.maxHp, unit, effect.type);
    } else if (effect.kind === "buffCarryPower") {
      const ally = api.carryAlly(unit);
      if (ally) {
        ally.bonusPowerTimer = effect.duration;
        ally.bonusPower = Math.max(ally.bonusPower || 0, effect.amount);
        api.emitEffectSignal?.({
          kind: "status",
          tags: ["status", "buff", "carry", "power"],
          source: unit,
          target: ally,
          amount: effect.amount,
          meta: { duration: effect.duration },
        });
        api.floater(ally, effect.label, "heal");
      }
    } else if (effect.kind === "teamTimer") {
      allies().forEach((ally) => {
        setTimer(ally, effect.timer, effect.duration);
        api.emitEffectSignal?.({
          kind: "status",
          tags: ["status", "buff", "teamWindow", effect.timer],
          source: unit,
          target: ally,
          amount: effect.duration,
          meta: { timer: effect.timer, duration: effect.duration },
        });
        if (effect.label) api.floater(ally, effect.label, effect.tone || "heal");
      });
    } else if (effect.kind === "teamRetaliation") {
      allies().forEach((ally) => {
        setTimer(ally, "retaliationTimer", effect.duration);
        ally.retaliationEffect = effect;
        api.emitEffectSignal?.({
          kind: "status",
          tags: ["status", "buff", "teamWindow", "retaliation"],
          source: unit,
          target: ally,
          amount: effect.duration,
          meta: { duration: effect.duration },
        });
      });
    } else if (effect.kind === "poisonEnemies") {
      enemies(null).forEach((enemy) => api.addPoison(enemy, effect.stacks, effect.time, unit, visual));
    } else if (effect.kind === "hitTargetWithStatus" && target) {
      api.hit(unit, target, effect.flat + power * effect.power + Math.min(effect.maxStatus, api.statusCount(target)) * effect.perStatus, effect.type, effect.label, visual);
    } else if (effect.kind === "enemyTimers") {
      enemies(effect.count).forEach((enemy) => {
        setTimer(enemy, effect.timer, effect.duration);
        api.emitEffectSignal?.({
          kind: "status",
          tags: ["status", "debuff", effect.timer === "slowTimer" ? "slow" : "timer", "area"],
          source: unit,
          target: enemy,
          amount: effect.duration,
          meta: { timer: effect.timer, duration: effect.duration },
        });
      });
    } else if (effect.kind === "teamShield") {
      const targets = effect.selfOnly ? [unit] : allies();
      targets.forEach((ally) => api.shield(ally, effect.flat + power * effect.power, effect.label, visual));
    } else if (effect.kind === "teamHeal") {
      allies().forEach((ally) => api.healUnit(ally, effect.flat + power * effect.power, effect.label, visual));
    } else if (effect.kind === "berserkerRoar") {
      setTimer(unit, "undyingTimer", berserkerModel.durations.immortal);
      setTimer(unit, "hasteTimer", berserkerModel.durations.haste);
      unit.hasteMultiplier = berserkerModel.hasteMultiplier;
      setTimer(unit, "lifeStealTimer", berserkerModel.durations.roarFury);
      setTimer(unit, "bloodFuryTimer", berserkerModel.durations.roarFury);
      setTimer(unit, "whirlwindTimer", berserkerModel.durations.roarFury);
      setTimer(unit, "roarFuryTimer", berserkerModel.durations.roarFury);
      api.floater(unit, "不死", "heal");
    } else if (effect.kind === "arrowStorm") {
      enemies(null).forEach((enemy) => api.hit(unit, enemy, 29 + power * 0.28 + (enemy.line === "后排" ? 16 : 0), "physical", "箭雨", visual));
    } else if (effect.kind === "meteorRain") {
      enemies(null).forEach((enemy) => {
        api.hit(unit, enemy, 22 + power * 0.18 + enemy.burn.stacks * 6, "fire", "流星", visual);
        api.addBurn(enemy, 2, 6, unit, visual);
      });
    } else if (effect.kind === "plagueOffering") {
      enemies(null).forEach((enemy) => {
        if (enemy.poison.stacks <= 0) return;
        api.hit(unit, enemy, (effect.flat ?? 22) + enemy.poison.stacks * (effect.perPoison ?? 9) + power * (effect.power ?? 0.22), "poison", "万毒", visual);
        enemy.poison.stacks = Math.ceil(enemy.poison.stacks * (effect.retain ?? 0.45));
        if ((effect.reapply || 0) > 0) api.addPoison(enemy, effect.reapply, effect.reapplyTime || 6, unit, visual);
      });
    } else if (effect.kind === "crescendo") {
      allies().forEach((ally) => {
        ally.hasteTimer = 8;
        ally.bonusPowerTimer = 8;
        ally.bonusPower = Math.max(ally.bonusPower || 0, 10);
      });
    } else if (effect.kind === "grandMixture") {
      enemies(null).forEach((enemy) => api.hit(
        unit,
        enemy,
        (effect.flat ?? 18) + power * (effect.power ?? 0.16) + Math.min(effect.maxStatus ?? 8, api.statusCount(enemy)) * (effect.perStatus ?? 8),
        "arcane",
        "混剂",
        visual,
      ));
    }
  }

  function passiveDamageMultiplier(source, target, api) {
    if (!source || !target) return 1;
    const passive = skills[source.passiveKey || source.passive];
    let multiplier = 1;
    for (const effect of passive?.effects || []) {
      if (effect.kind !== "passiveDamageAmp") continue;
      if (effect.requiresStatus && !(api.statusCount?.(target) > 0)) continue;
      if (effect.targetLine && target.line !== effect.targetLine) continue;
      if (Number.isFinite(effect.targetHpBelow) && !(api.hpRatio?.(target) < effect.targetHpBelow)) continue;
      if (Number.isFinite(effect.sourceHpBelow) && !(api.hpRatio?.(source) < effect.sourceHpBelow)) continue;
      if (effect.targetTimer && !(target[effect.targetTimer] > 0)) continue;
      if (Number.isFinite(effect.perMark)) multiplier *= 1 + (target.mark || 0) * effect.perMark;
      multiplier *= 1 + (effect.amp || 0);
    }
    return multiplier;
  }

  function resolveAssets() {
    if (typeof window !== "undefined" && window.GAME_SKILL_ASSETS) return window.GAME_SKILL_ASSETS;
    if (typeof require !== "undefined") return require("./skill-assets.js");
    throw new Error("GAME_SKILL_ASSETS must be loaded before skill-data.js");
  }

  return {
    version: "2026-06-23-skill-runtime-from-assets",
    TYPE,
    roles: {
      berserker: {
        key: "berserker",
        name: "狂战士",
        arenaName: "赤狮狂战",
        fantasy: "普攻狂暴",
        arenaFantasy: roleKits.berserker.fantasy,
        icon: roleKits.berserker.icon,
        stats: { hp: roleKits.berserker.hp, power: roleKits.berserker.power, armor: roleKits.berserker.armor, range: roleKits.berserker.range },
        kit: { small: [roleKits.berserker.kit.small1, roleKits.berserker.kit.small2], passive: roleKits.berserker.kit.passive, ultimate: roleKits.berserker.kit.ultimate },
      },
    },
    assetVersion: assets.version,
    roleKits,
    skills,
    presets,
    berserkerModel,
    createSkillLibrary,
    triggerReactiveEffects,
    passiveDamageMultiplier,
  };
})();

if (typeof window !== "undefined") window.GAME_SKILL_DATA = GAME_SKILL_DATA;
if (typeof module !== "undefined") module.exports = GAME_SKILL_DATA;
