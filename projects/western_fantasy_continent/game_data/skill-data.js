const GAME_SKILL_DATA = (() => {
  const TYPE = { SMALL: "小技能", PASSIVE: "被动", ULT: "大招" };
  const roleKits = {
    knight: role("铁壁骑士", "骑士", "站住、挡住、反打", 350, 34, 13, 11, "checked-shield", "guard", "tauntLine", "fortressStance", "bannerWall"),
    warrior: role("前锋战士", "战士", "稳健前排，压低敌方阵线", 345, 56, 12, 13, "hammer-drop", "powerStrike", "cleave", "lineBreaker", "warBanner"),
    berserker: role("赤狮狂战", "狂战士", "技能开窗口，越砍越疯，吃急速和吸血翻盘", 330, 66, 8, 12, "axe-swing", "bloodStrike", "boneWhirl", "rageEngine", "undyingRoar"),
    assassin: role("毒刃刺客", "刺客", "贴脸叠层，低血收割", 292, 66, 7, 12, "daggers", "toxicStabs", "shadowCut", "executionSense", "shadowHarvest"),
    ranger: role("月弦游侠", "游侠", "标记单点，越射越准", 285, 58, 7, 38, "arrow-flights", "markShot", "pinningArrow", "duelistFocus", "arrowStorm"),
    mage: role("烬火法师", "法师", "点燃、扩散、爆燃", 225, 50, 4, 38, "fireball", "fireball", "emberSpread", "kindlingEcho", "meteorRain"),
    priest: role("银誓牧师", "牧师", "保核心，续航和护盾", 285, 44, 6, 35, "checked-shield", "heal", "bloodCharm", "afterglowGrace", "sanctuary"),
    warlock: role("灰契术士", "术士", "献祭、诅咒、毒爆", 320, 61, 8, 34, "poison-bottle", "venomBrand", "bloodContract", "hotbedPact", "plagueOffering"),
    bard: role("晨歌诗人", "吟游诗人", "全队节奏窗口", 285, 45, 7, 36, "guitar", "tempoSong", "courageChord", "encore", "crescendo"),
    alchemist: role("沼雾炼金师", "炼金师", "铺场、瓶剂、异常放大", 285, 46, 7, 35, "fizzing-flask", "miasmaFlask", "volatileBottle", "catalyst", "grandMixture"),
  };

  const skills = {
    guard: skill("守护", TYPE.SMALL, "骑士", 8, "checked-shield", "给自己护盾，拖慢爆发队。", [shieldSelf(48, 0.34, "守护")]),
    tauntLine: skill("誓卫嘲讽", TYPE.SMALL, "骑士", 10, "shield-reflect", "嘲讽附近敌人并减伤。", [timer("guardTimer", 5), shieldSelf(55, 0.35, "誓卫")]),
    powerStrike: skill("重击", TYPE.SMALL, "战士", 5, "hammer-drop", "稳定单体物理伤害。", [hitTarget(34, 0.48, "physical", "重击")]),
    cleave: skill("顺劈", TYPE.SMALL, "战士", 7, "sword-slice", "打前排附近两人。", [hitEnemies(2, 24, 0.32, "physical", "顺劈")]),
    bloodStrike: skill("血怒斩", TYPE.SMALL, "狂战士", 5.2, "bloody-sword", "进入 4 秒血怒状态；期间每次普攻额外造成攻击力45% 伤害，生命越低额外伤害越高。", [timer("bloodFuryTimer", 4, "血怒普攻", "heal")]),
    boneWhirl: skill("裂骨旋风", TYPE.SMALL, "狂战士", 8.4, "spinning-sword", "进入 5 秒旋风架势；期间普攻主目标额外 +攻击力30%，并溅射附近 2 个敌人各攻击力18%。", [timer("whirlwindTimer", 5, "旋风架势", "shield")]),
    toxicStabs: skill("毒刃连刺", TYPE.SMALL, "刺客", 4, "daggers", "快速刺击并叠低额毒。", [hitTarget(14, 0.24, "physical", "毒刃"), poisonTarget(2, 6)]),
    shadowCut: skill("影切", TYPE.SMALL, "刺客", 6, "sprint", "跳向低血目标。", [{ kind: "hitLowestEnemy", flat: 24, power: 0.38, missingTargetHpFlat: 34, type: "shadow", label: "影切" }]),
    markShot: skill("猎标箭", TYPE.SMALL, "游侠", 5, "targeted", "标记并单点增伤。", [{ kind: "markTarget", stacks: 1, max: 6 }, { kind: "hitMarkedTarget", flat: 24, power: 0.34, perMark: 5, type: "physical", label: "猎标箭" }]),
    pinningArrow: skill("钉足箭", TYPE.SMALL, "游侠", 8, "arrowed", "减速并压制前排。", [targetTimer("slowTimer", 4), hitTarget(28, 0.3, "physical", "钉足箭")]),
    fireball: skill("余烬火球", TYPE.SMALL, "法师", 6, "fireball", "单体火焰并点燃。", [hitTarget(19, 0.25, "fire", "火球"), burnTarget(2, 6)]),
    emberSpread: skill("烈焰扩散", TYPE.SMALL, "法师", 9, "fire-zone", "燃烧目标向附近扩散。", [{ kind: "burningEnemies", count: 3, flat: 6, perBurn: 4, addBurn: 1, burnTime: 5, type: "fire", label: "扩散" }]),
    heal: skill("急救", TYPE.SMALL, "牧师", 7, "checked-shield", "治疗最低血友军。", [{ kind: "healLowestAlly", flat: 48, power: 0.42, label: "急救" }]),
    bloodCharm: skill("净血护符", TYPE.SMALL, "牧师", 10, "checked-shield", "护盾并降低 DOT 压力。", [{ kind: "shieldLowestAlly", flat: 58, power: 0.44, label: "净血" }, { kind: "lowestAllyTimer", timer: "dotResistTimer", duration: 5 }]),
    venomBrand: skill("腐毒烙印", TYPE.SMALL, "术士", 6, "poison-bottle", "单体上毒，已有毒则延长。", [poisonTarget(4, 8), hitTarget(14, 0.2, "poison", "腐毒")]),
    bloodContract: skill("血契供奉", TYPE.SMALL, "术士", 8, "bleeding-heart", "牺牲自己，强化最高攻击友军。", [{ kind: "selfRawDamage", maxHp: 0.05, type: "blood" }, { kind: "buffCarryPower", duration: 6, amount: 16, label: "血契" }]),
    tempoSong: skill("急板战歌", TYPE.SMALL, "吟游诗人", 9, "musical-notes", "全队加速一小段窗口。", [{ kind: "teamTimer", timer: "hasteTimer", duration: 5, label: "急板", tone: "heal" }]),
    courageChord: skill("勇气和弦", TYPE.SMALL, "吟游诗人", 7, "guitar", "给攻击最高友军增伤。", [{ kind: "buffCarryPower", duration: 6, amount: 18, label: "勇气" }]),
    miasmaFlask: skill("沼雾瓶", TYPE.SMALL, "炼金师", 10, "fizzing-flask", "敌方全体少量铺毒。", [{ kind: "poisonEnemies", stacks: 2, time: 7 }, hitEnemies(null, 5, 0.08, "poison", "沼雾")]),
    volatileBottle: skill("爆裂瓶", TYPE.SMALL, "炼金师", 8, "round-bottom-flask", "对异常目标额外伤害。", [{ kind: "hitTargetWithStatus", flat: 18, power: 0.2, perStatus: 6, maxStatus: 8, type: "fire", label: "爆裂瓶" }]),
    frostNova: skill("霜环", TYPE.SMALL, "法师", 10, "ice-bolt", "群体减速，克制近战突进。", [{ kind: "enemyTimers", count: 3, timer: "slowTimer", duration: 7 }, hitEnemies(3, 22, 0.25, "ice", "霜环")]),

    fortressStance: passive("坚守阵线", "骑士", "shield", "护盾效果提高，低血更硬。"),
    lineBreaker: passive("破阵步", "战士", "swordman", "攻击前排时小幅增伤。"),
    rageEngine: passive("血怒引擎", "狂战士", "rage", "低血时强化血怒普攻，并让普攻按已造成伤害吸血；越残吸血越高。"),
    executionSense: passive("处决嗅觉", "刺客", "death-note", "攻击低血或异常目标增伤。"),
    duelistFocus: passive("决斗专注", "游侠", "bullseye", "同一目标标记越高越强。"),
    kindlingEcho: passive("火种共鸣", "法师", "burning-embers", "燃烧目标死亡时溅射火焰。"),
    afterglowGrace: passive("余光恩典", "牧师", "holy-symbol", "治疗溢出转护盾。"),
    hotbedPact: passive("温床契约", "术士", "virus", "中毒敌人死亡时余毒扩散。"),
    encore: passive("返场", "吟游诗人", "double-quaver", "友军释放大招后缩短小技能冷却。"),
    catalyst: passive("催化剂", "炼金师", "chemical-drop", "异常状态伤害小幅提高。"),

    bannerWall: ult("王旗不倒", "骑士", 34, "shield-bash", "全队护盾与短暂减伤。", [{ kind: "teamShield", flat: 58, power: 0.38, label: "王旗" }, { kind: "teamTimer", timer: "guardTimer", duration: 3 }]),
    warBanner: ult("战旗冲锋", "战士", 28, "war-axe", "全队前排输出窗口。", [{ kind: "teamTimer", timer: "bonusPowerTimer", duration: 5 }, hitEnemies(3, 32, 0.34, "physical", "冲锋")]),
    undyingRoar: ult("不死战吼", "狂战士", 24, "lion", "自身 6 秒内不会低于 1 点生命，并同时获得急速、血怒、旋风架势和攻击力35% 普攻附伤。", [{ kind: "berserkerRoar" }]),
    shadowHarvest: ult("暗影收割", "刺客", 24, "cloak-dagger", "处决低血目标，击杀刷新。", [{ kind: "hitLowestEnemy", flat: 74, power: 0.66, missingTargetHpFlat: 95, type: "shadow", label: "收割" }]),
    arrowStorm: ult("箭雨", "游侠", 30, "arrow-cluster", "多段压低敌方后排。", [{ kind: "arrowStorm" }]),
    meteorRain: ult("流星火雨", "法师", 37, "meteor-impact", "群体火焰，对燃烧目标爆燃。", [{ kind: "meteorRain" }]),
    sanctuary: ult("神圣庇护", "牧师", 32, "aura", "全队治疗和护盾。", [{ kind: "teamHeal", flat: 36, power: 0.28, label: "庇护" }, { kind: "teamShield", flat: 32, power: 0.3, label: "庇护" }]),
    plagueOffering: ult("万毒献祭", "术士", 30, "death-skull", "引爆所有中毒敌人，保留部分毒层。", [{ kind: "plagueOffering" }]),
    crescendo: ult("终章强音", "吟游诗人", 30, "sonic-shout", "全队急速并触发返场。", [{ kind: "crescendo" }]),
    grandMixture: ult("终极混剂", "炼金师", 35, "bubbling-flask", "根据敌方异常层数造成混合爆发。", [{ kind: "grandMixture" }]),
  };

  const presets = {
    poisonBloom: preset("毒巢滚雪球", "慢启动，死亡扩散，后期毒爆", ["knight", "assassin", "warlock", "priest"], {
      0: { small1: "guard", small2: "bloodCharm", passive: "fortressStance", ultimate: "bannerWall" },
      2: { small1: "venomBrand", small2: "miasmaFlask", passive: "hotbedPact", ultimate: "plagueOffering" },
      3: { small1: "bloodCharm", small2: "heal", passive: "hotbedPact", ultimate: "sanctuary" },
    }),
    fireBurst: preset("余烬爆燃", "点燃扩散，流星收尾，优开脆皮", ["warrior", "knight", "mage", "mage"]),
    crownCarry: preset("王冠核心", "全队资源养一个狂战/游侠核心", ["knight", "priest", "bard", "berserker"], {
      1: { small2: "bloodCharm" },
      2: { small1: "tempoSong", small2: "courageChord", ultimate: "crescendo" },
    }),
    ironWall: preset("铁壁反击", "高护盾高减伤，拖时间吃大招", ["knight", "warrior", "priest", "bard"]),
    bloodRage: preset("低血狂怒", "低血爆发和吸血翻盘", ["berserker", "warrior", "priest", "bard"]),
    lightningTempo: preset("急速节奏", "吟游加速，游侠持续点杀", ["warrior", "ranger", "bard", "ranger"]),
    frostControl: preset("霜控拖延", "减速控场，克制近战", ["knight", "priest", "mage", "alchemist"], {
      2: { small1: "frostNova", small2: "fireball", ultimate: "meteorRain" },
      3: { small1: "volatileBottle", small2: "miasmaFlask" },
    }),
    holySustain: preset("圣盾续航", "治疗护盾密度高，消耗取胜", ["knight", "warrior", "priest", "priest"]),
    shadowExecute: preset("暗影处决", "低血斩杀，优开后排脆皮", ["knight", "assassin", "assassin", "warlock"], {
      0: { small1: "tauntLine", small2: "guard", ultimate: "bannerWall" },
      3: { small1: "bloodContract", small2: "venomBrand", ultimate: "plagueOffering" },
    }),
    alchemyChaos: preset("炼金异常", "毒火混合，靠异常层数放大", ["knight", "alchemist", "alchemist", "mage"]),
  };

  const berserkerModel = {
    basicAttackCooldown: 1.35,
    basicFlatDamage: 10,
    basicPowerRatio: 0.22,
    openingCooldowns: { bloodStrike: 1, boneWhirl: 2.6, undyingRoar: 8 },
    cooldowns: { bloodStrike: 5.2, boneWhirl: 8.4, undyingRoar: 24 },
    durations: { bloodFury: 4, whirlwind: 5, roarFury: 6, haste: 6, immortal: 6 },
    ratios: { blood: 0.45, whirlwind: 0.3, splash: 0.18, roar: 0.35 },
    passive: { maxDamageAmp: 0.45, baseLeech: 0.08, missingHpLeech: 0.11, lowHpHaste: 0.7 },
    splashTargets: 2,
    hasteMultiplier: 1.4,
  };

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
      if (effect.label) api.floater(unit, effect.label, effect.tone || "heal");
    } else if (effect.kind === "targetTimer" && target) {
      setTimer(target, effect.timer, effect.duration);
    } else if (effect.kind === "hitTarget" && target) {
      api.hit(unit, target, effect.flat + power * effect.power, effect.type, effect.label, visual);
    } else if (effect.kind === "hitEnemies") {
      enemies(effect.count).forEach((enemy) => api.hit(unit, enemy, effect.flat + power * effect.power, effect.type, effect.label, visual));
    } else if (effect.kind === "poisonTarget" && target) {
      api.addPoison(target, effect.stacks, effect.time, unit, visual);
    } else if (effect.kind === "burnTarget" && target) {
      api.addBurn(target, effect.stacks, effect.time, unit, visual);
    } else if (effect.kind === "markTarget" && target) {
      target.mark = Math.min(effect.max, (target.mark || 0) + effect.stacks);
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
    } else if (effect.kind === "lowestAllyTimer") {
      const ally = api.lowestHpAlly(unit);
      if (ally) setTimer(ally, effect.timer, effect.duration);
    } else if (effect.kind === "selfRawDamage") {
      api.takeRaw(unit, unit.maxHp * effect.maxHp, null, effect.type);
    } else if (effect.kind === "buffCarryPower") {
      const ally = api.carryAlly(unit);
      if (ally) {
        ally.bonusPowerTimer = effect.duration;
        ally.bonusPower = Math.max(ally.bonusPower || 0, effect.amount);
        api.floater(ally, effect.label, "heal");
      }
    } else if (effect.kind === "teamTimer") {
      allies().forEach((ally) => {
        setTimer(ally, effect.timer, effect.duration);
        if (effect.label) api.floater(ally, effect.label, effect.tone || "heal");
      });
    } else if (effect.kind === "poisonEnemies") {
      enemies(null).forEach((enemy) => api.addPoison(enemy, effect.stacks, effect.time, unit, visual));
    } else if (effect.kind === "hitTargetWithStatus" && target) {
      api.hit(unit, target, effect.flat + power * effect.power + Math.min(effect.maxStatus, api.statusCount(target)) * effect.perStatus, effect.type, effect.label, visual);
    } else if (effect.kind === "enemyTimers") {
      enemies(effect.count).forEach((enemy) => setTimer(enemy, effect.timer, effect.duration));
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
        api.hit(unit, enemy, 22 + enemy.poison.stacks * 9 + power * 0.22, "poison", "万毒", visual);
        enemy.poison.stacks = Math.ceil(enemy.poison.stacks * 0.45);
      });
    } else if (effect.kind === "crescendo") {
      allies().forEach((ally) => {
        ally.hasteTimer = 8;
        ally.bonusPowerTimer = 8;
        ally.bonusPower = Math.max(ally.bonusPower || 0, 10);
      });
    } else if (effect.kind === "grandMixture") {
      enemies(null).forEach((enemy) => api.hit(unit, enemy, 18 + power * 0.16 + Math.min(8, api.statusCount(enemy)) * 8, "arcane", "混剂", visual));
    }
  }

  function role(name, roleName, fantasy, hp, power, armor, range, icon, small1, small2, passive, ultimate) {
    return { name, role: roleName, fantasy, hp, power, armor, range, icon, kit: { small1, small2, passive, ultimate } };
  }
  function skill(name, type, role, cooldown, icon, desc, effects) {
    return { name, type, role, cooldown, icon, desc, effects };
  }
  function passive(name, role, icon, desc) {
    return { name, type: TYPE.PASSIVE, role, cooldown: 0, icon, desc, passive: true, effects: [] };
  }
  function ult(name, role, cooldown, icon, desc, effects) {
    return skill(name, TYPE.ULT, role, cooldown, icon, desc, effects);
  }
  function preset(name, desc, roles, overrides = {}) {
    return { name, desc, team: roles.map((roleKey, index) => ({ role: roleKey, ...roleKits[roleKey].kit, ...(overrides[index] || {}) })) };
  }
  function timer(timerName, duration, label, tone) { return { kind: "timer", timer: timerName, duration, label, tone }; }
  function targetTimer(timerName, duration) { return { kind: "targetTimer", timer: timerName, duration }; }
  function hitTarget(flat, power, type, label) { return { kind: "hitTarget", flat, power, type, label }; }
  function hitEnemies(count, flat, power, type, label) { return { kind: "hitEnemies", count, flat, power, type, label }; }
  function shieldSelf(flat, power, label) { return { kind: "teamShield", flat, power, label, selfOnly: true }; }
  function poisonTarget(stacks, time) { return { kind: "poisonTarget", stacks, time }; }
  function burnTarget(stacks, time) { return { kind: "burnTarget", stacks, time }; }

  return {
    version: "2026-06-23-shared-skill-runtime",
    TYPE,
    roles: { berserker: { key: "berserker", name: "狂战士", arenaName: "赤狮狂战", fantasy: "普攻狂暴", arenaFantasy: roleKits.berserker.fantasy, icon: roleKits.berserker.icon, stats: { hp: 330, power: 66, armor: 8, range: 12 }, kit: { small: ["bloodStrike", "boneWhirl"], passive: "rageEngine", ultimate: "undyingRoar" } } },
    roleKits,
    skills,
    presets,
    berserkerModel,
    createSkillLibrary,
  };
})();

if (typeof window !== "undefined") window.GAME_SKILL_DATA = GAME_SKILL_DATA;
if (typeof module !== "undefined") module.exports = GAME_SKILL_DATA;
