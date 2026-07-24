(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FIVE_DAY_RAID = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COMBAT_SIM = typeof module !== "undefined" && module.exports
    ? require("../game_data/combat-sim")
    : globalThis.GAME_COMBAT_SIM;
  const SKILL_DATA = typeof module !== "undefined" && module.exports
    ? require("../game_data/skill-data")
    : globalThis.GAME_SKILL_DATA;

  const VERSION = "five_day_guard_raid_v2_real_combat";
  const MAX_PARTY = 4;
  const AP_PER_DAY = 3;
  const FINAL_DAY = 5;
  const RARITIES = ["普通", "稀有", "史诗", "传说", "神话", "永恒"];
  const RARITY_POWER = { "普通": 7, "稀有": 13, "史诗": 23, "传说": 38, "神话": 62, "永恒": 100 };
  const SLOT_LABEL = { weapon: "武器", armor: "护甲", charm: "饰品" };
  const IDENTITY_TAGS = ["古代锻造", "赃物", "流放者", "宗教", "白鹿家", "恐怖", "贵族"];

  const HEROES = {
    player: { name: "你", role: "均衡近战", combatRole: "warrior", base: 55, note: "本章主角；装备成长最稳定。" },
    shield: { name: "负伤盾手·赫恩", role: "前排保护", combatRole: "knight", base: 45, note: "能把队伍从脆弱单人变成有前排的小队。" },
    apothecary: { name: "药师学徒·米娅", role: "治疗支援", combatRole: "priest", base: 38, note: "基础战力低，但提高守城与持久战稳定性。" },
    thief: { name: "小偷·鸦指", role: "潜入输出", combatRole: "assassin", base: 42, note: "可打开营地与账本的低冲突路线。" },
    exile: { name: "流放者弓手·萨芮", role: "远程侦察", combatRole: "ranger", base: 55, note: "懂灰炉旧符文，也适合伏击。" },
    champion: { name: "擂台冠军·布罗克", role: "重击挑战", combatRole: "berserker", base: 60, note: "需要用实力赢得加入。" },
    duelist: { name: "家族剑士·伊兰", role: "决斗爆发", combatRole: "warrior", base: 58, note: "重视证据与名誉，可建立决斗资格。" },
    hunter: { name: "兽猎人·苔牙", role: "恐惧控制", combatRole: "warlock", base: 52, note: "追踪夜袭者，擅长瓦解士气。" }
  };

  const FORMATION_LABELS = ["前排一号", "前排二号", "后排一号", "后排二号"];
  const EVENT_COMBAT_OPTIONS = {
    guardian: new Set(["fight"]),
    quartermaster: new Set(["fight"]),
    arena: new Set(["fight", "rematch"]),
    duelist: new Set(["challenge"]),
    hunter: new Set(["hunt", "track"]),
    night_raid: new Set(["ambush"]),
  };
  const FINAL_COMBAT_OPTIONS = new Set(["defend", "field", "ambush", "duel"]);

  const MAP_AREAS = {
    square: { label: "镇中心", x: 49, y: 47, tone: "civic" },
    furnace: { label: "灰炉遗址", x: 78, y: 38, tone: "forge" },
    camp: { label: "河畔营地", x: 60, y: 14, tone: "danger" },
    west: { label: "西门商道", x: 17, y: 42, tone: "trade" },
    chapel: { label: "旧礼拜堂", x: 70, y: 73, tone: "faith" },
    wall: { label: "旧城墙", x: 26, y: 76, tone: "defense" }
  };

  function hashSeed(text) {
    let h = 2166136261;
    for (const ch of String(text)) {
      h ^= ch.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function random(state) {
    let t = state.rng += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function weightedPick(state, rows) {
    const roll = random(state);
    let cursor = 0;
    for (const row of rows) {
      cursor += row[1];
      if (roll < cursor) return row[0];
    }
    return rows[rows.length - 1][0];
  }

  function makeStarterItem() {
    return {
      id: "item_starter_knife",
      name: "旧猎刀",
      slot: "weapon",
      slotLabel: "武器",
      rarity: "普通",
      power: 5,
      identityTags: [],
      source: "家中旧物"
    };
  }

  function createInitialState(seed = "five-day-default") {
    const starter = makeStarterItem();
    return {
      version: VERSION,
      seed: String(seed),
      rng: hashSeed(seed),
      itemSerial: 1,
      day: 1,
      ap: AP_PER_DAY,
      spentActions: 0,
      phase: "planning",
      result: null,
      resources: { gold: 6, medicine: 0, townFavor: 0, evidence: 0 },
      roster: ["player"],
      activeParty: ["player"],
      formation: { player: 0 },
      equipment: { player: { weapon: starter.id, armor: null, charm: null } },
      inventory: [starter],
      dungeons: { outer: true, inner: false },
      threat: {
        arrival: "第五日黄昏",
        known: ["队长与五名护卫"],
        intel: [],
        supply: 100,
        morale: 100,
        legalClaim: 100,
        removed: [],
        townDefense: 0,
        alliedSupport: 0
      },
      flags: {
        insultedYoungMaster: true,
        doorInspected: false,
        smithDoorTheory: false,
        exileRuneTheory: false
      },
      nodes: {},
      recent: [{ kind: "story", text: "你打了在镇上撒泼的白鹿家少爷。他逃走前放话：第五日，他家的护卫队会来。" }],
      stats: { grindRuns: 0, outerRuns: 0, innerRuns: 0, equipmentActions: 0, recruits: 0, failedChallenges: 0, combats: 0 }
    };
  }

  function itemPower(item) {
    return item ? Number(item.power || 0) : 0;
  }

  function heroPower(state, heroId) {
    const hero = HEROES[heroId];
    if (!hero) return 0;
    const slots = state.equipment[heroId] || {};
    const gear = Object.values(slots).reduce((sum, itemId) => {
      const item = state.inventory.find((entry) => entry.id === itemId);
      return sum + itemPower(item);
    }, 0);
    return hero.base + gear;
  }

  function partyPower(state) {
    let total = state.activeParty.reduce((sum, heroId) => sum + heroPower(state, heroId), 0);
    if (state.activeParty.includes("shield") && state.activeParty.length > 1) total += 12;
    if (state.activeParty.includes("apothecary") && state.activeParty.length > 2) total += 10;
    if (state.activeParty.includes("exile") && state.flags.campScouted) total += 8;
    return total;
  }

  function isCombatActionId(actionId) {
    if (String(actionId).startsWith("final:")) return FINAL_COMBAT_OPTIONS.has(String(actionId).split(":")[1]);
    if (!String(actionId).startsWith("event:")) return false;
    const [, eventId, optionId] = String(actionId).split(":");
    return Boolean(EVENT_COMBAT_OPTIONS[eventId]?.has(optionId));
  }

  function roleSpec(role, name, slotIndex, options = {}) {
    const kit = SKILL_DATA?.roleKits?.[role];
    if (!kit) throw new Error(`缺少正式战斗职业：${role}`);
    const roleKit = kit.kit || {};
    const magicRole = ["mage", "priest", "warlock", "alchemist"].includes(role);
    const hpScale = Number(options.hpScale || 1);
    const powerScale = Number(options.powerScale || 1);
    const armorScale = Number(options.armorScale || 1);
    const basePower = Math.round((kit.power || 40) * powerScale);
    return {
      role,
      name,
      roleName: options.roleName || kit.role || role,
      hp: Math.round((kit.hp || 300) * hpScale),
      maxHp: Math.round((kit.hp || 300) * hpScale),
      power: basePower,
      physicalPower: Math.round((magicRole ? basePower * 0.28 : basePower) * (options.physicalPowerMult || 1)),
      magicPower: Math.round((magicRole ? basePower : basePower * 0.28) * (options.magicPowerMult || 1)),
      armor: Math.round((kit.armor || 8) * armorScale + (options.armorAdd || 0)),
      range: options.range || kit.range || 14,
      small1: options.small1 || roleKit.small1,
      small2: options.small2 || roleKit.small2,
      passive: options.passive || roleKit.passive,
      ultimate: options.ultimate || roleKit.ultimate,
      attackSpeedMult: options.attackSpeedMult || 1,
      skillHasteMult: options.skillHasteMult || 1,
      effectPowerMult: options.effectPowerMult || 1,
      effectResistPct: options.effectResistPct || 0,
      slotIndex,
      homeX: options.homeX,
      homeY: options.homeY,
      line: options.line,
      unitKind: options.unitKind || "",
    };
  }

  function heroCombatSpec(state, heroId, options = {}) {
    const hero = HEROES[heroId];
    const baseRatio = hero.base / 55;
    const spec = roleSpec(hero.combatRole, hero.name, Number(state.formation?.[heroId] ?? 0), {
      hpScale: (0.80 + baseRatio * 0.20) * (options.hpMult || 1),
      powerScale: (0.72 + baseRatio * 0.28) * (options.powerMult || 1),
      armorScale: 0.86 + baseRatio * 0.14,
      armorAdd: options.armorAdd || 0,
      attackSpeedMult: options.attackSpeedMult || 1,
      skillHasteMult: options.skillHasteMult || 1,
      effectPowerMult: options.effectPowerMult || 1,
    });
    const slots = state.equipment[heroId] || {};
    const weapon = state.inventory.find((item) => item.id === slots.weapon);
    const armor = options.disableArmor ? null : state.inventory.find((item) => item.id === slots.armor);
    const charm = state.inventory.find((item) => item.id === slots.charm);
    const mainKey = ["mage", "priest", "warlock", "alchemist"].includes(hero.combatRole) ? "magicPower" : "physicalPower";
    spec[mainKey] += Math.round(itemPower(weapon) * 2.40 + itemPower(charm));
    spec.power = Math.max(spec.physicalPower, spec.magicPower);
    spec.maxHp += Math.round(itemPower(armor) * 16 + itemPower(charm) * 5);
    spec.hp = spec.maxHp;
    spec.armor += Math.round(itemPower(armor) * 0.55);
    spec.effectPowerMult *= 1 + itemPower(charm) * 0.01;
    return spec;
  }

  function playerCombatTeam(state, options = {}) {
    const ids = options.onlyPlayer ? ["player"] : state.activeParty;
    return ids.map((heroId) => heroCombatSpec(state, heroId, options));
  }

  function enemySpec(role, name, slotIndex, options = {}) {
    return roleSpec(role, name, slotIndex, {
      ...options,
      unitKind: options.unitKind || "enemy",
    });
  }

  function finalEnemyTeam(state) {
    const removed = new Set(state.threat.removed);
    const morale = Math.max(0.78, Math.min(1.10, 0.82 + state.threat.morale * 0.0024));
    const supply = Math.max(0.68, Math.min(1, 0.70 + state.threat.supply * 0.003));
    const legal = Math.max(0.82, Math.min(1, 0.82 + state.threat.legalClaim * 0.0018));
    const positions = [
      { homeX: 76, homeY: 34, line: "前排" }, { homeX: 76, homeY: 66, line: "前排" },
      { homeX: 91, homeY: 20, line: "后排" }, { homeX: 91, homeY: 40, line: "后排" },
      { homeX: 91, homeY: 60, line: "后排" }, { homeX: 91, homeY: 80, line: "后排" },
    ];
    const rows = [];
    function add(id, role, name, options = {}) {
      if (removed.has(id)) return;
      const position = positions[rows.length];
      rows.push(enemySpec(role, name, rows.length, {
        ...position,
        hpScale: (options.hpScale || 1) * morale,
        powerScale: (options.powerScale || 1) * morale * (options.usesSupply ? supply : 1),
        armorScale: options.armorScale || 1,
        skillHasteMult: options.usesSupply ? 0.82 + supply * 0.18 : 1,
        effectPowerMult: options.usesLaw ? legal : 1,
      }));
    }
    add("captain", "warrior", "队长·罗德里克", { hpScale: 1.18, powerScale: 1.12, armorScale: 1.08 });
    add("shield_one", "knight", "本地盾手", { hpScale: 0.92, powerScale: 0.88 });
    add("shield_two", "knight", "本地盾手", { hpScale: 0.92, powerScale: 0.88 });
    add("crossbow_one", "ranger", "白鹿家弩手", { hpScale: 0.88, powerScale: 0.94, usesSupply: true });
    add("crossbow_two", "ranger", "白鹿家弩手", { hpScale: 0.88, powerScale: 0.94, usesSupply: true });
    add("priest", "priest", "随队执事", { hpScale: 0.90, powerScale: 0.90, usesSupply: true, usesLaw: true });
    return rows;
  }

  function combatPlanForInternalAction(state, actionId) {
    if (!isCombatActionId(actionId)) return null;
    const seed = `${state.seed}|combat|${actionId}|day${state.day}|spent${state.spentActions}|gear${partyPower(state)}`;
    let title = "交战";
    let leftTeam = playerCombatTeam(state);
    let rightTeam = [];
    let preparation = [];
    if (actionId === "event:guardian:fight") {
      title = "王炉守卫";
      const jammed = Boolean(state.flags.coolingJammed);
      rightTeam = [enemySpec("knight", "守炉甲胄", 0, {
        hpScale: jammed ? 4.50 : 8.25,
        powerScale: jammed ? 3.40 : 6.20,
        armorScale: jammed ? 1.70 : 2.35,
        small1: "enemyHeavySmash", small2: "enemyNoop", passive: "enemyStoneGuard", ultimate: "enemyNoUltimate",
      })];
      if (jammed) preparation.push("冷却阀已经卡死，甲胄动作迟缓");
    } else if (actionId === "event:quartermaster:fight") {
      title = "军需车守卫";
      const drain = state.flags.campDrainKnown ? 0.80 : 1;
      rightTeam = [
        enemySpec("knight", "军需盾卫", 0, { hpScale: 0.95 * drain, powerScale: 0.92 * drain }),
        enemySpec("ranger", "营地弩手", 2, { hpScale: 0.86 * drain, powerScale: 0.92 * drain }),
        enemySpec("warrior", "军需押运兵", 1, { hpScale: 0.90 * drain, powerScale: 0.90 * drain }),
      ];
      if (state.flags.campDrainKnown) preparation.push("你们从后坡暗沟接近，避开了第一轮齐射");
    } else if (actionId.startsWith("event:arena:")) {
      title = actionId.endsWith(":rematch") ? "带伤重赛" : "倒塌擂台";
      const rematch = actionId.endsWith(":rematch");
      leftTeam = playerCombatTeam(state, { disableArmor: rematch });
      rightTeam = [enemySpec("berserker", "擂台冠军·布罗克", 0, {
        hpScale: rematch ? 1.45 : 2.05,
        powerScale: rematch ? 1.18 : 1.45,
        armorScale: rematch ? 0.9 : 1.1,
      })];
      if (rematch) preparation.push("双方都不使用护甲");
    } else if (actionId === "event:duelist:challenge") {
      title = "西门比剑";
      leftTeam = playerCombatTeam(state, { onlyPlayer: true });
      rightTeam = [enemySpec("warrior", "家族剑士·伊兰", 0, { hpScale: 1.12, powerScale: 1.08, armorScale: 1.08 })];
      preparation.push("只有你本人参加比剑");
    } else if (actionId.startsWith("event:hunter:")) {
      title = "断角兽狩猎";
      const trapped = actionId.endsWith(":track");
      rightTeam = [enemySpec("berserker", "断角兽", 0, {
        hpScale: trapped ? 1.65 : 2.45,
        powerScale: trapped ? 1.18 : 1.52,
        armorScale: trapped ? 0.92 : 1.12,
        small1: "enemySweepingClaw", small2: "enemyHeavySmash", passive: "enemyDormantPassive", ultimate: "enemyNoUltimate",
      })];
      if (trapped) preparation.push("断角兽左后腿负伤，冲撞节奏被陷阱打断");
    } else if (actionId === "event:night_raid:ambush") {
      title = "伏击营地夜巡队";
      rightTeam = [
        enemySpec("knight", "夜巡盾卫", 0, { hpScale: 1.02, powerScale: 1.02 }),
        enemySpec("warrior", "夜巡刀手", 1, { hpScale: 1.02, powerScale: 1.04 }),
        enemySpec("ranger", "火把弩手", 2, { hpScale: 0.94, powerScale: 1.06 }),
        enemySpec("priest", "营地随军医", 3, { hpScale: 0.94, powerScale: 1.02 }),
      ];
    } else if (actionId === "final:duel") {
      title = "荣誉决斗";
      leftTeam = playerCombatTeam(state, { onlyPlayer: true });
      rightTeam = [enemySpec("warrior", "队长·罗德里克", 0, { hpScale: 1.26, powerScale: 1.18, armorScale: 1.12 })];
      preparation.push("你本人对阵护卫队长，其他人不得插手");
    } else if (actionId.startsWith("final:")) {
      const strategy = actionId.split(":")[1];
      title = strategy === "defend" ? "煤灰镇守城战" : strategy === "ambush" ? "河岸伏击战" : "镇外迎击战";
      rightTeam = finalEnemyTeam(state);
      if (strategy === "defend") {
        const defense = Math.min(0.45, state.threat.townDefense / 180);
        const support = Math.min(0.28, state.threat.alliedSupport / 180);
        leftTeam = playerCombatTeam(state, { hpMult: 1 + defense + support * 0.5, armorAdd: Math.round(state.threat.townDefense / 12), effectPowerMult: 1 + support });
        if (state.threat.townDefense > 0) preparation.push("修补后的镇墙和街垒提供掩护");
        if (state.threat.alliedSupport > 0) preparation.push("留下的镇民持续递送箭杆、药品和饮水");
      } else if (strategy === "ambush") {
        leftTeam = playerCombatTeam(state, { attackSpeedMult: 1.12, skillHasteMult: 1.10 });
        rightTeam = rightTeam.map((unit) => ({ ...unit, hp: Math.round(unit.hp * 0.82), maxHp: Math.round(unit.maxHp * 0.82), armor: Math.max(0, unit.armor - 2) }));
        preparation.push("侦察路线让队伍先占据河岸高地");
      }
    }
    return { kind: "combat", title, actionId, seed, leftTeam, rightTeam, preparation, maxTime: 75 };
  }

  function combatWon(result) {
    const metrics = result?.metrics || {};
    if (Number.isFinite(metrics.leftAlive) && Number.isFinite(metrics.rightAlive)) {
      return metrics.leftAlive > 0 && metrics.rightAlive === 0;
    }
    return result?.winner === "left" || result?.passed === true;
  }

  function summarizeCombatResult(result, title) {
    const units = Array.isArray(result?.units) ? result.units : [];
    const allies = units.filter((unit) => ["left", "ally"].includes(unit.side));
    const enemies = units.filter((unit) => ["right", "enemy"].includes(unit.side));
    return {
      title,
      win: combatWon(result),
      duration: Math.round(Number(result?.duration || 0) * 10) / 10,
      allies: allies.map((unit) => ({ name: unit.name, alive: unit.alive !== false && Number(unit.hp ?? unit.hpNow ?? 0) > 0, hpRatio: Math.max(0, Math.min(1, Number(unit.hpRatio ?? ((unit.hp ?? unit.hpNow ?? 0) / (unit.maxHp || 1))) || 0)), damageDone: Math.round(Number(unit.damageDone || 0)) })),
      enemies: enemies.map((unit) => ({ name: unit.name, alive: unit.alive !== false && Number(unit.hp ?? unit.hpNow ?? 0) > 0, hpRatio: Math.max(0, Math.min(1, Number(unit.hpRatio ?? ((unit.hp ?? unit.hpNow ?? 0) / (unit.maxHp || 1))) || 0)) })),
    };
  }

  function visibleHeroSkills(heroId) {
    const role = HEROES[heroId]?.combatRole;
    const kit = SKILL_DATA?.roleKits?.[role]?.kit || {};
    return [kit.small1, kit.small2, kit.passive, kit.ultimate].filter(Boolean).map((key) => {
      const skill = SKILL_DATA.skills?.[key] || {};
      return { name: skill.name || key, type: skill.type || "技能", description: skill.description || "" };
    });
  }

  function countItems(state, predicate) {
    return state.inventory.filter(predicate).length;
  }

  function equippedItemIds(state) {
    return new Set(Object.values(state.equipment).flatMap((slots) => Object.values(slots || {})).filter(Boolean));
  }

  function unequippedItems(state, predicate) {
    const equipped = equippedItemIds(state);
    return state.inventory.filter((item) => !equipped.has(item.id) && (!predicate || predicate(item)));
  }

  function generateItem(state, dungeonId) {
    const inner = dungeonId === "inner";
    const rarity = weightedPick(state, inner
      ? [["普通", 0.18], ["稀有", 0.55], ["史诗", 0.25], ["传说", 0.019], ["神话", 0.00098], ["永恒", 0.00002]]
      : [["普通", 0.76], ["稀有", 0.22], ["史诗", 0.019], ["传说", 0.00098], ["神话", 0.000019], ["永恒", 0.000001]]
    );
    const slot = weightedPick(state, [["weapon", 0.38], ["armor", 0.38], ["charm", 0.24]]);
    const tagChance = inner ? 0.62 : 0.38;
    const identityTags = [];
    if (random(state) < tagChance) identityTags.push(IDENTITY_TAGS[Math.floor(random(state) * IDENTITY_TAGS.length)]);
    if (rarity === "传说" || rarity === "神话" || rarity === "永恒") {
      const second = IDENTITY_TAGS[Math.floor(random(state) * IDENTITY_TAGS.length)];
      if (!identityTags.includes(second)) identityTags.push(second);
    }
    const roots = {
      weapon: ["短剑", "猎弓", "战锤", "仪式刃"],
      armor: ["皮甲", "锁甲", "旅袍", "胸铠"],
      charm: ["指环", "徽记", "骨哨", "护符"]
    };
    const prefixes = inner ? ["王炉", "熔金", "赤誓", "旧王"] : ["灰炉", "煤尘", "旧镇", "裂纹"];
    const base = RARITY_POWER[rarity];
    const variance = Math.floor(random(state) * 5) - 2;
    const item = {
      id: `item_${state.itemSerial++}`,
      name: `${prefixes[Math.floor(random(state) * prefixes.length)]}${roots[slot][Math.floor(random(state) * roots[slot].length)]}`,
      slot,
      slotLabel: SLOT_LABEL[slot],
      rarity,
      power: Math.max(3, base + variance + (inner ? 2 : 0)),
      identityTags,
      source: inner ? "王炉内环" : "灰炉外环"
    };
    state.inventory.push(item);
    return item;
  }

  function addLog(state, text, kind = "result") {
    state.recent.unshift({ kind, text });
    state.recent = state.recent.slice(0, 12);
  }

  function consumeItems(state, count, predicate) {
    const candidates = unequippedItems(state, predicate).sort((a, b) => itemPower(a) - itemPower(b));
    if (candidates.length < count) return false;
    const consumed = new Set(candidates.slice(0, count).map((item) => item.id));
    state.inventory = state.inventory.filter((item) => !consumed.has(item.id));
    return true;
  }

  function ensureHeroEquipment(state, heroId) {
    if (!state.equipment[heroId]) state.equipment[heroId] = { weapon: null, armor: null, charm: null };
  }

  function recruit(state, heroId) {
    if (!state.roster.includes(heroId)) {
      state.roster.push(heroId);
      ensureHeroEquipment(state, heroId);
      state.stats.recruits += 1;
      addLog(state, `${HEROES[heroId].name}加入候补。是否出战由你决定。`, "recruit");
    }
  }

  function removeGuard(state, id, label) {
    if (!state.threat.removed.includes(id)) {
      state.threat.removed.push(id);
      addLog(state, `${label}不再参加第五日围攻。`, "threat");
    }
  }

  const EVENTS = [
    {
      id: "smith", title: "铁匠的试炉", area: "square", start: 1, end: 5, type: "引入", persistent: true,
      summary: "铁匠愿意把你刷来的废料变成确定收益，也看得懂王炉门锁。",
      options: [
        { id: "inspect_lock", label: "把炉门拓印拿给铁匠看", outcome: "铁匠只会根据拓印说出他实际看懂的部分。", req: [{ kind: "flag", label: "先调查王炉门", test: (s) => Boolean(s.flags.doorInspected) }], once: "smithDoorTheory" },
        { id: "craft", label: "交三把普通武器，锻成一把稀有武器", outcome: "确定得到稀有武器；教会你装备不只靠随机。", req: [{ kind: "items", count: 3, label: "未装备的普通武器×3", test: (s) => countItems(s, (i) => i.slot === "weapon" && i.rarity === "普通" && !equippedItemIds(s).has(i.id)) >= 3 }], once: "smithCrafted" },
        { id: "key", label: "把收集到的古代锻造物交给铁匠", outcome: "铁匠会尝试完成他提出的重铸方案。", req: [{ kind: "flag", label: "铁匠尚未研究炉门拓印", test: (s) => Boolean(s.flags.smithDoorTheory) }, { kind: "state", label: "王炉内环尚未开放", test: (s) => !s.dungeons.inner }, { kind: "items", count: 3, label: (s) => `未装备的[古代锻造]装备 ${countItems(s, (i) => i.identityTags.includes("古代锻造") && !equippedItemIds(s).has(i.id))}/3`, test: (s) => countItems(s, (i) => i.identityTags.includes("古代锻造") && !equippedItemIds(s).has(i.id)) >= 3 }], once: "smithKey" }
      ]
    },
    {
      id: "injured_shield", title: "沟渠里的负伤盾手", area: "west", start: 1, end: 2, type: "招募",
      summary: "一个被商队抛下的盾手伤得不重，但没人肯为他耽误时间。",
      options: [
        { id: "medicine", label: "用一份药救治他", outcome: "盾手加入候补。", req: [{ kind: "resource", label: "药品×1", test: (s) => s.resources.medicine >= 1 }] },
        { id: "carry", label: "亲自把他背回镇里", outcome: "消耗行动，不需要物资；盾手加入候补。" },
        { id: "take_shield", label: "拿走他的盾，继续备战", outcome: "得到一件普通护甲；此人不会加入。" }
      ]
    },
    {
      id: "apothecary", title: "药铺的两张欠条", area: "square", start: 1, end: 3, type: "自我选择",
      summary: "药师学徒既欠采药人的钱，也答应照顾镇上的病人，今天只能顾一头。",
      options: [
        { id: "patients", label: "替她照顾病人", outcome: "得到药品与镇民支持；学徒加入候补。" },
        { id: "herbs", label: "陪她去追回药草", outcome: "得到更多药品；学徒加入候补。" },
        { id: "buy", label: "替她还债", outcome: "不占她的道德选择；学徒加入候补。", req: [{ kind: "resource", label: "金币×5", test: (s) => s.resources.gold >= 5 }] }
      ]
    },
    {
      id: "thief_trial", title: "小偷与粮商", area: "west", start: 1, end: 2, type: "自我选择",
      summary: "小偷偷粮确实违法；粮商囤粮抬价也确有其事。两边都拿得出证据。",
      options: [
        { id: "thief", label: "放走小偷，让他交出账页", outcome: "小偷加入候补；得到粮商证据，但失去商人支持。" },
        { id: "merchant", label: "把小偷交给粮商", outcome: "得到金币与商人支持；小偷路线关闭。" },
        { id: "public", label: "把双方证据一起贴到广场", outcome: "不招募任何一方；镇民支持与证据增加。" }
      ]
    },
    {
      id: "guild_feud", title: "铠匠与客栈老板", area: "square", start: 1, end: 2, type: "自我选择",
      summary: "铠匠要拆客栈后院扩炉；老板说那口井是全街火灾时唯一的水源。",
      options: [
        { id: "armorer", label: "支持铠匠扩炉", outcome: "一件稀有护甲；城墙施工会更贵。" },
        { id: "inn", label: "保住水井", outcome: "守城防御提高；锻造服务不受影响。" },
        { id: "survey", label: "丈量废巷，给两家另开通道", outcome: "花金币换取两边较小的支持。", req: [{ kind: "resource", label: "金币×3", test: (s) => s.resources.gold >= 3 }] }
      ]
    },
    {
      id: "caravan", title: "西门翻覆的货车", area: "west", start: 1, end: 3, type: "自我选择",
      summary: "河水正在上涨。车夫要先救贵重货箱，车后的难民要先解开绳索。",
      options: [
        { id: "people", label: "先救人", outcome: "镇民支持提高，得到一份药。" },
        { id: "goods", label: "先抢货箱", outcome: "得到金币和一件装备，难民不会帮你守城。" },
        { id: "split", label: "带两名队员同时处理", outcome: "两边都保住；需要先有三人出战。", req: [{ kind: "party", label: "出战人数≥3", test: (s) => s.activeParty.length >= 3 }] }
      ]
    },
    {
      id: "rumor", title: "酒馆里的消息贩子", area: "square", start: 1, end: 4, type: "侦察",
      summary: "他不知道你该怎么赢，但知道护卫队在雇谁、带什么。",
      options: [
        { id: "pay", label: "买完整名单", outcome: "护卫队六人的组成与弱点变为可见。", req: [{ kind: "resource", label: "金币×3", test: (s) => s.resources.gold >= 3 }] },
        { id: "favor", label: "用镇民人情换消息", outcome: "不花金币，但消耗镇民支持。", req: [{ kind: "resource", label: "镇民支持≥2", test: (s) => s.resources.townFavor >= 2 }] },
        { id: "ignore", label: "公开拒绝，让对方以为你毫无准备", outcome: "获得少量士气优势，但仍不知道成员详情。" }
      ]
    },
    {
      id: "exile", title: "灰炉边的流放者", area: "furnace", start: 2, end: 4, type: "锁钥/招募",
      summary: "流放者认识炉门符文，却在躲避礼拜堂的人。她不会免费把命交给你。",
      options: [
        { id: "marks", label: "把门上纹路的拓印拿给她看", outcome: "听她说自己实际认出的东西。", req: [{ kind: "flag", label: "先调查王炉门", test: (s) => Boolean(s.flags.doorInspected) }], once: "exileRuneTheory" },
        { id: "relic", label: "交给她一件[宗教]装备作谈判筹码", outcome: "她加入候补，并教你符文开门。", req: [{ kind: "items", label: "未装备的[宗教]装备×1", test: (s) => countItems(s, (i) => i.identityTags.includes("宗教") && !equippedItemIds(s).has(i.id)) >= 1 }] },
        { id: "evidence", label: "承诺保护她，并拿出两份证据", outcome: "她加入候补，并教你符文开门。", req: [{ kind: "resource", label: "证据≥2", test: (s) => s.resources.evidence >= 2 }] },
        { id: "rune", label: "接受她提出的符文交易", outcome: "完成她刚刚提出的交易。", req: [{ kind: "flag", label: "她尚未解释拓印", test: (s) => Boolean(s.flags.exileRuneTheory) }, { kind: "resource", label: "金币×4", test: (s) => s.resources.gold >= 4 }] }
      ]
    },
    {
      id: "guardian", title: "王炉守卫", area: "furnace", start: 1, end: 4, type: "挑战",
      summary: "一具仍在运转的古代甲胄守着炉门。正面战胜它也能开门。建议小队战力：230。",
      options: [
        { id: "fight", label: "挑战守炉甲胄", outcome: "胜利则开门；失败会暴露冷却机关，并保留挑战。" }
      ]
    },
    {
      id: "cooling", title: "守炉甲胄的冷却井", area: "furnace", start: 1, end: 4, type: "失败推进",
      summary: "只有在守炉战失败后，喷出的蒸汽才会暴露这条机关链。",
      visibleIf: (s) => Boolean(s.flags.guardianFailed),
      options: [
        { id: "jam", label: "花一次行动卡死冷却阀", outcome: "再次挑战时守卫大幅削弱。" },
        { id: "thief", label: "让小偷钻入管道开门", outcome: "绕过守卫直接打开炉门。", req: [{ kind: "roster", label: "已招募小偷", test: (s) => s.roster.includes("thief") }] }
      ]
    },
    {
      id: "chapel", title: "礼拜堂的失窃圣物", area: "chapel", start: 2, end: 4, type: "自我选择",
      summary: "礼拜堂指控流放者偷走圣物；流放者说那本来是她家族被没收的遗物。",
      options: [
        { id: "church", label: "把圣物线索交给礼拜堂", outcome: "得到宗教装备与法理支持；流放者不再信任你。" },
        { id: "exile", label: "承认它属于流放者家族", outcome: "得到证据与流放者信任；礼拜堂不满。" },
        { id: "history", label: "查旧契约再公开裁断", outcome: "需要已有证据；削弱护卫队的法理借口。", req: [{ kind: "resource", label: "证据≥1", test: (s) => s.resources.evidence >= 1 }] }
      ]
    },
    {
      id: "quartermaster", title: "河畔营地的军需车", area: "camp", start: 2, end: 4, type: "多解",
      summary: "护卫队的箭、药和粮都在这辆车上。营门盘查身份，后坡有排水沟。",
      options: [
        { id: "contraband", label: "穿戴[赃物]装备冒充销赃客", outcome: "破坏补给并留下错误线索。", req: [{ kind: "equipped_tag", label: "出战队穿戴[赃物]装备", test: (s) => partyHasEquippedTag(s, "赃物") }] },
        { id: "thief", label: "让小偷从排水沟潜入", outcome: "破坏补给并抄走一页军需账。", req: [{ kind: "roster", label: "已招募小偷", test: (s) => s.roster.includes("thief") }] },
        { id: "fight", label: "正面袭击军需守卫", outcome: "战力足够则破坏补给；失败会发现后坡暗沟。" }
      ]
    },
    {
      id: "ledger", title: "执事的雇佣账本", area: "chapel", start: 2, end: 4, type: "锁钥",
      summary: "随队执事并非白鹿家臣。他需要一个能公开解释的理由退出。",
      options: [
        { id: "religious", label: "出示[宗教]装备，请他核对伪造印章", outcome: "执事退出围攻；装备不会被消耗。", req: [{ kind: "equipped_tag", label: "出战队穿戴[宗教]装备", test: (s) => partyHasEquippedTag(s, "宗教") }] },
        { id: "steal", label: "让小偷偷出账本", outcome: "得到能迫使执事退出的证据。", req: [{ kind: "roster", label: "已招募小偷", test: (s) => s.roster.includes("thief") }] },
        { id: "buy", label: "替执事偿还秘密债务", outcome: "执事退出围攻。", req: [{ kind: "resource", label: "金币×8", test: (s) => s.resources.gold >= 8 }] }
      ]
    },
    {
      id: "militia", title: "两名护卫的欠薪", area: "square", start: 2, end: 4, type: "矛盾",
      summary: "护卫队里的两名盾手是本地雇工。他们要钱，也怕被当成背叛贵族的逃兵。",
      options: [
        { id: "pay", label: "支付欠薪与逃亡路费", outcome: "一名盾手退出；花费很高但干净。", req: [{ kind: "resource", label: "金币×7", test: (s) => s.resources.gold >= 7 }] },
        { id: "proof", label: "用两份证据证明少爷先违法", outcome: "两名盾手都有理由退出。", req: [{ kind: "resource", label: "证据≥2", test: (s) => s.resources.evidence >= 2 }] },
        { id: "terror", label: "穿戴[恐怖]装备威吓他们", outcome: "一名盾手退出，但护卫队士气转为愤怒。", req: [{ kind: "equipped_tag", label: "出战队穿戴[恐怖]装备", test: (s) => partyHasEquippedTag(s, "恐怖") }] }
      ]
    },
    {
      id: "arena", title: "倒塌擂台上的冠军", area: "wall", start: 2, end: 4, type: "挑战/招募",
      summary: "冠军只跟能让他认真出手的人走。建议小队战力：190。失败后可以提出一场有限制的重赛。",
      options: [
        { id: "fight", label: "公开挑战冠军", outcome: "胜利则冠军加入；失败会开放带伤重赛。" },
        { id: "rematch", label: "接受带伤重赛：不准使用护甲", outcome: "门槛降低，但只在首次落败后出现。", req: [{ kind: "flag", label: "先在公开挑战中失败", test: (s) => Boolean(s.flags.arenaFailed) }] }
      ]
    },
    {
      id: "wall", title: "旧城墙的三处缺口", area: "wall", start: 2, end: 5, type: "引入",
      summary: "守城能把装备之外的准备转成最终战优势，但材料和人手都有限。",
      options: [
        { id: "armor", label: "拆两件普通护甲填补箭孔", outcome: "城防显著提高。", req: [{ kind: "items", label: "未装备的普通护甲×2", test: (s) => countItems(s, (i) => i.slot === "armor" && i.rarity === "普通" && !equippedItemIds(s).has(i.id)) >= 2 }] },
        { id: "favor", label: "动员镇民修墙", outcome: "消耗镇民支持，城防提高。", req: [{ kind: "resource", label: "镇民支持≥2", test: (s) => s.resources.townFavor >= 2 }] },
        { id: "gold", label: "雇石匠连夜施工", outcome: "花金币获得较高城防。", req: [{ kind: "resource", label: "金币×5", test: (s) => s.resources.gold >= 5 }] }
      ]
    },
    {
      id: "duelist", title: "白鹿家的旁支剑士", area: "west", start: 3, end: 5, type: "矛盾/招募",
      summary: "她效忠家族名誉，却认为少爷的行为正在毁掉家族名誉。她需要能站得住的理由。",
      options: [
        { id: "evidence", label: "给她看三份少爷违法的证据", outcome: "她加入候补，并赋予你提出荣誉决斗的资格。", req: [{ kind: "resource", label: "证据≥3", test: (s) => s.resources.evidence >= 3 }] },
        { id: "noble", label: "穿戴[贵族]装备与她正式会谈", outcome: "不招募她，但获得荣誉决斗资格。", req: [{ kind: "equipped_tag", label: "主角穿戴[贵族]装备", test: (s) => heroHasEquippedTag(s, "player", "贵族") }] },
        { id: "challenge", label: "以剑证明你不是街头暴徒", outcome: "战力足够则她加入；失败不关闭证据路线。" }
      ]
    },
    {
      id: "hunter", title: "夜路上的断角兽", area: "camp", start: 3, end: 5, type: "挑战/招募",
      summary: "一头被军需气味引来的怪兽在营地外徘徊。猎人正在追它。建议小队战力：215。",
      options: [
        { id: "hunt", label: "与猎人共同狩猎", outcome: "胜利则猎人加入，并得到[恐怖]战利品；失败会留下可追踪脚印。" },
        { id: "track", label: "沿失败后留下的脚印设陷阱", outcome: "降低挑战门槛。", req: [{ kind: "flag", label: "先在狩猎中失败", test: (s) => Boolean(s.flags.huntFailed) }] }
      ]
    },
    {
      id: "night_raid", title: "营地夜巡", area: "camp", start: 3, end: 4, type: "副挑战",
      summary: "这是比主线更难的副挑战。成功能显著打击士气，失败会让敌人加强巡逻。建议战力：280。",
      options: [
        { id: "ambush", label: "伏击夜巡队", outcome: "胜利则大幅降低士气并完成伏击准备；失败提高营地戒备。" },
        { id: "scout", label: "只侦察路线，不接战", outcome: "小幅降低士气并完成伏击准备。", req: [{ kind: "roster", label: "已招募流放者或小偷", test: (s) => s.roster.includes("exile") || s.roster.includes("thief") }] }
      ]
    },
    {
      id: "envoy", title: "少爷的和解使者", area: "square", start: 4, end: 5, type: "自我选择",
      summary: "使者要你公开下跪。作为交换，少爷会把围攻改成一次示威；但他的书面条件也可能成为证据。",
      options: [
        { id: "kneel", label: "接受公开道歉", outcome: "护卫队规模缩小，但主角名望受损；本章仍会结算。" },
        { id: "letter", label: "拖延谈判，骗取盖章条件书", outcome: "获得关键证据，削弱法理借口。" },
        { id: "duel", label: "正式提出由双方代表决斗", outcome: "锁定荣誉决斗结局。", req: [{ kind: "flag", label: "已获得荣誉决斗资格", test: (s) => Boolean(s.flags.duelRight) }] }
      ]
    },
    {
      id: "evacuation", title: "第五日前的撤离争执", area: "wall", start: 4, end: 5, type: "自我选择",
      summary: "镇民想撤走，店主担心一走就会被抢空。你只能把有限人手放在一个方向。",
      options: [
        { id: "civilians", label: "优先护送平民撤离", outcome: "失败后果减轻；可用于守城的人手减少。" },
        { id: "barricade", label: "说服大家留下修街垒", outcome: "需要镇民支持；提高城防。", req: [{ kind: "resource", label: "镇民支持≥2", test: (s) => s.resources.townFavor >= 2 }] },
        { id: "stores", label: "封存店铺物资作为公用补给", outcome: "提高守城支援，但商人关系恶化。" }
      ]
    }
  ];

  function heroHasEquippedTag(state, heroId, tag) {
    const slots = state.equipment[heroId] || {};
    return Object.values(slots).some((itemId) => {
      const item = state.inventory.find((entry) => entry.id === itemId);
      return item && item.identityTags.includes(tag);
    });
  }

  function partyHasEquippedTag(state, tag) {
    return state.activeParty.some((heroId) => heroHasEquippedTag(state, heroId, tag));
  }

  function eventNodeState(state, event) {
    if (event.visibleIf && !event.visibleIf(state)) return "hidden";
    const progress = state.nodes[event.id] || {};
    if (progress.resolved && !event.persistent) return "resolved";
    if (state.day < event.start) return "future";
    if (state.day > event.end) return "expired";
    if (state.phase !== "planning") return "closed";
    return "available";
  }

  function optionAvailability(state, event, option) {
    const nodeState = eventNodeState(state, event);
    const reasons = [];
    if (nodeState === "future") reasons.push(`第${event.start}日出现`);
    if (nodeState === "expired") reasons.push("事件已错过");
    if (nodeState === "resolved" || nodeState === "closed") reasons.push("事件已结束");
    if (nodeState === "hidden") reasons.push("尚未发现");
    if (state.ap <= 0) reasons.push("今日行动点已用完");
    if (event.id === "smith" && option.id === "key" && state.dungeons.inner) return { available: false, reasons: ["王炉内环已经开放，无需再造钥匙"] };
    if (event.id === "smith" && option.id === "inspect_lock" && state.dungeons.inner) return { available: false, reasons: ["王炉内环已经开放"] };
    if (event.id === "guardian" && option.id === "fight" && state.dungeons.inner) return { available: false, reasons: ["王炉内环已经开放，无需再挑战守卫"] };
    if (event.id === "exile" && option.id === "rune" && state.dungeons.inner) return { available: false, reasons: ["王炉内环已经开放，纯符文交易已无新增结果"] };
    if (event.id === "exile" && option.id === "marks" && state.dungeons.inner) return { available: false, reasons: ["王炉内环已经开放"] };
    if (event.id === "cooling" && state.dungeons.inner) return { available: false, reasons: ["王炉内环已经开放，冷却机关已无新增结果"] };
    if (option.once && state.flags[option.once]) reasons.push("本章已使用");
    for (const req of option.req || []) if (!req.test(state)) reasons.push(typeof req.label === "function" ? req.label(state) : req.label);
    return { available: reasons.length === 0, reasons };
  }

  function getVisibleNodes(state) {
    const offsets = [[-10, -10], [0, -12], [10, -9], [-12, 0], [0, 0], [12, 1], [-9, 10], [4, 12], [14, 9]];
    const eventNodes = EVENTS.filter((event) => !event.visibleIf || event.visibleIf(state)).map((event) => ({
      id: event.id,
      kind: "event",
      title: event.title,
      area: event.area,
      areaLabel: MAP_AREAS[event.area].label,
      x: MAP_AREAS[event.area].x + offsets[EVENTS.filter((entry) => entry.area === event.area).findIndex((entry) => entry.id === event.id) % offsets.length][0],
      y: MAP_AREAS[event.area].y + offsets[EVENTS.filter((entry) => entry.area === event.area).findIndex((entry) => entry.id === event.id) % offsets.length][1],
      type: event.type,
      summary: event.summary,
      window: `第${event.start}—${event.end}日`,
      status: eventNodeState(state, event),
      options: event.options.map((option) => {
        const availability = optionAvailability(state, event, option);
        const progress = event.id === "smith" && option.id === "key" && !state.dungeons.inner
          ? `${countItems(state, (i) => i.identityTags.includes("古代锻造") && !equippedItemIds(state).has(i.id))}/3`
          : null;
        return { id: option.id, label: option.label, outcome: option.outcome, cost: "1行动点", progress, ...availability };
      })
    }));
    const dungeons = [
      {
        id: "dungeon_outer", kind: "dungeon", title: "灰炉外环", area: "furnace", areaLabel: MAP_AREAS.furnace.label,
        x: 79, y: 31, type: "免费刷装", summary: "始终开放。普通为主，稀有约两成，史诗极少；任何次数都不消耗行动点。",
        status: state.phase === "planning" ? "available" : "closed", options: [
          { id: "grind:outer:1", label: "刷1次", outcome: "掉落1件装备", cost: "0行动点", available: state.phase === "planning", reasons: state.phase === "planning" ? [] : ["来袭已经开始"] },
          { id: "grind:outer:10", label: "刷10次", outcome: "掉落10件装备", cost: "0行动点", available: state.phase === "planning", reasons: state.phase === "planning" ? [] : ["来袭已经开始"] }
        ]
      },
      {
        id: "dungeon_inner", kind: "dungeon", title: "王炉内环", area: "furnace", areaLabel: MAP_AREAS.furnace.label,
        x: 88, y: 43, type: "锁钥副本", summary: "稀有为主、史诗显著增加。锻造钥匙、流放者符文或战胜守炉甲胄都能开门。",
        status: state.phase !== "planning" ? "closed" : state.dungeons.inner ? "available" : "locked", options: [
          { id: "grind:inner:1", label: "刷1次", outcome: "掉落1件高阶装备", cost: "0行动点", available: state.phase === "planning" && state.dungeons.inner, reasons: state.phase !== "planning" ? ["来袭已经开始"] : state.dungeons.inner ? [] : ["王炉门仍锁着"] },
          { id: "grind:inner:10", label: "刷10次", outcome: "掉落10件高阶装备", cost: "0行动点", available: state.phase === "planning" && state.dungeons.inner, reasons: state.phase !== "planning" ? ["来袭已经开始"] : state.dungeons.inner ? [] : ["王炉门仍锁着"] }
        ]
      }
    ];
    return [...dungeons, ...eventNodes];
  }

  function applyEventEffect(state, eventId, optionId) {
    const node = state.nodes[eventId] || (state.nodes[eventId] = {});
    let resolved = true;
    if (eventId === "smith" && optionId === "inspect_lock") {
      state.flags.smithDoorTheory = true;
      resolved = false;
      addLog(state, "铁匠用炭笔补全拓印：锁芯已经熔坏，普通钥匙无用；三件同源的古代锻造物也许能重铸出匹配结构。", "clue");
    } else if (eventId === "smith" && optionId === "craft") {
      consumeItems(state, 3, (i) => i.slot === "weapon" && i.rarity === "普通");
      const item = generateItem(state, "outer"); item.rarity = "稀有"; item.power = 15; item.name = "铁匠重锻长剑"; item.identityTags = ["古代锻造"];
      state.flags.smithCrafted = true; resolved = false; addLog(state, "铁匠把三把普通武器重锻成稀有长剑。它进入背包，尚未装备。", "loot");
    } else if (eventId === "smith" && optionId === "key") {
      consumeItems(state, 3, (i) => i.identityTags.includes("古代锻造")); state.flags.smithKey = true; state.dungeons.inner = true; resolved = false; addLog(state, "炉门钥匙重铸完成：王炉内环开放。", "unlock");
    } else if (eventId === "injured_shield") {
      if (optionId === "medicine") state.resources.medicine -= 1;
      if (optionId === "take_shield") {
        const item = generateItem(state, "outer"); item.slot = "armor"; item.slotLabel = "护甲"; item.rarity = "普通"; item.power = 9; item.name = "弃兵圆盾"; item.identityTags = ["赃物"];
        addLog(state, "你拿走圆盾。它进入背包；盾手不会再加入你。", "loot");
      } else recruit(state, "shield");
    } else if (eventId === "apothecary") {
      if (optionId === "buy") state.resources.gold -= 5;
      state.resources.medicine += optionId === "herbs" ? 3 : 1;
      if (optionId === "patients") state.resources.townFavor += 1;
      recruit(state, "apothecary");
    } else if (eventId === "thief_trial") {
      if (optionId === "thief") { recruit(state, "thief"); state.resources.evidence += 1; state.flags.merchantAngry = true; }
      if (optionId === "merchant") { state.resources.gold += 6; state.flags.merchantSupport = true; }
      if (optionId === "public") { state.resources.evidence += 1; state.resources.townFavor += 2; }
    } else if (eventId === "guild_feud") {
      if (optionId === "armorer") { const item = generateItem(state, "outer"); item.slot = "armor"; item.slotLabel = "护甲"; item.rarity = "稀有"; item.power = 15; item.name = "扩炉铠甲"; }
      if (optionId === "inn") { state.threat.townDefense += 18; state.resources.townFavor += 1; }
      if (optionId === "survey") { state.resources.gold -= 3; state.threat.townDefense += 10; state.resources.townFavor += 1; }
    } else if (eventId === "caravan") {
      if (optionId === "people") { state.resources.townFavor += 2; state.resources.medicine += 1; }
      if (optionId === "goods") { state.resources.gold += 5; generateItem(state, "outer"); }
      if (optionId === "split") { state.resources.gold += 4; state.resources.townFavor += 2; state.resources.medicine += 1; }
    } else if (eventId === "rumor") {
      if (optionId === "pay") state.resources.gold -= 3;
      if (optionId === "favor") state.resources.townFavor -= 2;
      if (optionId === "ignore") state.threat.morale = Math.max(0, state.threat.morale - 8);
      if (optionId !== "ignore") {
        state.flags.guardRosterKnown = true;
        state.threat.known = ["队长·罗德里克", "弩手×2", "本地盾手×2", "随队执事"];
        state.threat.intel = ["弩手依赖军需车的箭与药", "本地盾手最在意欠薪与免罪理由", "随队执事不是家臣，需要法理借口才肯参战", "队长接受有资格者提出的荣誉决斗"];
        addLog(state, "完整情报已固定在态势板：六人名单与四条可利用弱点现在持续可见。", "intel");
      }
    } else if (eventId === "exile" && optionId === "marks") {
      state.flags.exileRuneTheory = true;
      resolved = false;
      addLog(state, "流放者认出拓印不是装饰：几处缺口组成了旧王炉的开门短句。她愿意谈一笔只涉及符文的交易。", "clue");
    } else if (eventId === "exile") {
      if (optionId === "relic") consumeItems(state, 1, (i) => i.identityTags.includes("宗教"));
      if (optionId === "rune") state.resources.gold -= 4;
      if (optionId !== "rune") recruit(state, "exile");
      state.dungeons.inner = true; state.flags.exileRune = true; addLog(state, "流放者译出旧符文：王炉内环开放。", "unlock");
    } else if (eventId === "guardian") {
      throw new Error("守炉甲胄必须经过正式战斗运行时。");
    } else if (eventId === "cooling") {
      if (optionId === "jam") { state.flags.coolingJammed = true; addLog(state, "铁楔卡住冷却阀后，铜管持续发出闷响；甲胄再次转身时动作明显慢了半拍。", "unlock"); }
      if (optionId === "thief") { state.dungeons.inner = true; state.flags.thiefOpenedFurnace = true; addLog(state, "小偷从管道内部拉开炉门：王炉内环开放。", "unlock"); }
    } else if (eventId === "chapel") {
      if (optionId === "church") { const item = generateItem(state, "outer"); item.identityTags = ["宗教"]; item.name = "礼拜堂银徽"; state.threat.legalClaim = Math.max(0, state.threat.legalClaim - 10); state.flags.exileBlocked = true; addLog(state, "礼拜堂交给你一枚带旧教印的银徽，并宣布愿意为你的说法作证。", "result"); }
      if (optionId === "exile") { state.resources.evidence += 1; state.flags.exileTrust = true; addLog(state, "旧口供上的没收记录与你的判断一致；流放者收起了原本握在手里的刀。", "result"); }
      if (optionId === "history") { state.threat.legalClaim = Math.max(0, state.threat.legalClaim - 45); state.resources.evidence += 1; addLog(state, "旧契约被贴上广场，围观者看见礼拜堂当年没有合法没收圣物。", "result"); }
    } else if (eventId === "quartermaster") {
      if (optionId === "fight") throw new Error("军需车正面袭击必须经过正式战斗运行时。");
      state.threat.supply = Math.max(0, state.threat.supply - 65); state.resources.evidence += optionId === "thief" ? 1 : 0; state.flags.campScouted = true; addLog(state, "军需车侧翻起火。营地里有人抢救箭箱、药箱和粮袋。", "threat");
    } else if (eventId === "ledger") {
      if (optionId === "buy") state.resources.gold -= 8;
      if (optionId === "steal") state.resources.evidence += 1;
      removeGuard(state, "priest", "随队执事"); state.threat.legalClaim = Math.max(0, state.threat.legalClaim - 30);
    } else if (eventId === "militia") {
      if (optionId === "pay") { state.resources.gold -= 7; removeGuard(state, "shield_one", "一名本地盾手"); }
      if (optionId === "proof") { removeGuard(state, "shield_one", "第一名本地盾手"); removeGuard(state, "shield_two", "第二名本地盾手"); state.threat.legalClaim = Math.max(0, state.threat.legalClaim - 25); }
      if (optionId === "terror") { removeGuard(state, "shield_one", "一名本地盾手"); state.threat.morale = Math.min(120, state.threat.morale + 15); }
    } else if (eventId === "arena") {
      throw new Error("擂台挑战必须经过正式战斗运行时。");
    } else if (eventId === "wall") {
      if (optionId === "armor") { consumeItems(state, 2, (i) => i.slot === "armor" && i.rarity === "普通"); state.threat.townDefense += 35; addLog(state, "拆下的护甲片被钉进箭孔，三处缺口都出现了新的金属挡板。", "result"); }
      if (optionId === "favor") { state.resources.townFavor -= 2; state.threat.townDefense += 28; addLog(state, "镇民推来木车和门板，连夜把缺口改成了街垒。", "result"); }
      if (optionId === "gold") { state.resources.gold -= 5; state.threat.townDefense += 32; addLog(state, "石匠连夜垒起矮墙，原本漏风的箭孔已经收窄。", "result"); }
    } else if (eventId === "duelist") {
      if (optionId === "evidence") { recruit(state, "duelist"); state.flags.duelRight = true; }
      if (optionId === "noble") { state.flags.duelRight = true; addLog(state, "旁支剑士答应为一场正式决斗作证：由你本人对阵护卫队长，其他人不得插手。", "result"); }
      if (optionId === "challenge") {
        throw new Error("西门比剑必须经过正式战斗运行时。");
      }
    } else if (eventId === "hunter") {
      throw new Error("断角兽狩猎必须经过正式战斗运行时。");
    } else if (eventId === "night_raid") {
      if (optionId === "scout") { state.threat.morale = Math.max(0, state.threat.morale - 18); state.flags.ambushPrepared = true; state.flags.campScouted = true; addLog(state, "侦察者在地图上画出夜巡换岗的空档和两条撤退小路。", "result"); }
      else throw new Error("夜巡伏击必须经过正式战斗运行时。");
    } else if (eventId === "envoy") {
      if (optionId === "kneel") { removeGuard(state, "crossbow_two", "一名弩手"); state.flags.publicApology = true; state.threat.legalClaim = 0; }
      if (optionId === "letter") { state.resources.evidence += 2; state.threat.legalClaim = Math.max(0, state.threat.legalClaim - 45); state.flags.sealedLetter = true; addLog(state, "使者留下盖有白鹿家印章的条件书；上面承认少爷先在镇上动手。", "result"); }
      if (optionId === "duel") { state.flags.duelLocked = true; addLog(state, "使者收下挑战书，答应把你本人对阵护卫队长的要求带回营地。", "result"); }
    } else if (eventId === "evacuation") {
      if (optionId === "civilians") { state.flags.civiliansSafe = true; addLog(state, "老人和孩子沿南边小路离开，负责带路的人回来报告他们已经越过石桥。", "result"); }
      if (optionId === "barricade") { state.resources.townFavor -= 2; state.threat.townDefense += 35; addLog(state, "留下的人把货车横在街口，门窗后的射击位置也已经清空。", "result"); }
      if (optionId === "stores") { state.threat.alliedSupport += 25; state.flags.merchantAngry = true; addLog(state, "封存的店铺里搬出成捆箭杆和粮袋，一批镇民因此留下帮忙。", "result"); }
    }
    node.lastOption = optionId;
    if (resolved) node.resolved = true;
  }

  function advanceClock(state) {
    if (state.ap > 0) return;
    if (state.day < FINAL_DAY) {
      state.day += 1;
      state.ap = AP_PER_DAY;
      addLog(state, `第${state.day}日开始。护卫队将在第五日黄昏抵达。`, "clock");
    } else {
      state.phase = "final";
      addLog(state, "第五日黄昏：白鹿家护卫队抵达镇外。准备已经结束。", "final");
    }
  }

  function spendAction(state) {
    state.ap -= 1;
    state.spentActions += 1;
    advanceClock(state);
  }

  function applyEventAction(state, eventId, optionId) {
    const event = EVENTS.find((entry) => entry.id === eventId);
    if (!event) throw new Error(`未知事件：${eventId}`);
    const option = event.options.find((entry) => entry.id === optionId);
    if (!option) throw new Error(`未知选项：${eventId}/${optionId}`);
    const availability = optionAvailability(state, event, option);
    if (!availability.available) throw new Error(`当前不能执行：${availability.reasons.join("、")}`);
    applyEventEffect(state, eventId, optionId);
    const playerLabel = SAFE_ACTION_LABELS[`event:${eventId}:${optionId}`] || option.label;
    addLog(state, `已处理「${event.title}」：${playerLabel}`, "action");
    spendAction(state);
  }

  function grind(state, dungeonId, count) {
    if (state.phase !== "planning") throw new Error("来袭已经开始，不能继续刷装。");
    if (dungeonId === "inner" && !state.dungeons.inner) throw new Error("王炉内环仍被门锁封住。");
    if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error("单次刷取数量必须为1—100。");
    const drops = [];
    for (let i = 0; i < count; i += 1) drops.push(generateItem(state, dungeonId));
    state.stats.grindRuns += count;
    state.stats[dungeonId === "inner" ? "innerRuns" : "outerRuns"] += count;
    const rareCount = drops.filter((item) => RARITIES.indexOf(item.rarity) >= 1).length;
    const best = drops.slice().sort((a, b) => RARITIES.indexOf(b.rarity) - RARITIES.indexOf(a.rarity))[0];
    addLog(state, `${dungeonId === "inner" ? "王炉内环" : "灰炉外环"}带回${count}件装备，其中稀有及以上${rareCount}件，最高${best.rarity}。`, "loot");
    return drops;
  }

  function equipItem(state, itemId, heroId) {
    if (!state.roster.includes(heroId)) throw new Error("该角色尚未加入队伍。");
    const item = state.inventory.find((entry) => entry.id === itemId);
    if (!item) throw new Error("背包中没有这件装备。");
    ensureHeroEquipment(state, heroId);
    for (const slots of Object.values(state.equipment)) {
      for (const slot of Object.keys(slots)) if (slots[slot] === itemId) slots[slot] = null;
    }
    state.equipment[heroId][item.slot] = itemId;
    state.stats.equipmentActions += 1;
    addLog(state, `${HEROES[heroId].name}装备了${item.rarity}${item.name}，小队战力现在是${partyPower(state)}。`, "equipment");
  }

  function autoEquip(state) {
    const before = partyPower(state);
    const assigned = new Set();
    for (const heroId of state.activeParty) {
      ensureHeroEquipment(state, heroId);
      for (const slot of Object.keys(SLOT_LABEL)) {
        const best = state.inventory.filter((item) => item.slot === slot && !assigned.has(item.id)).sort((a, b) => itemPower(b) - itemPower(a))[0];
        state.equipment[heroId][slot] = best ? best.id : null;
        if (best) assigned.add(best.id);
      }
    }
    for (const heroId of state.roster.filter((id) => !state.activeParty.includes(id))) {
      ensureHeroEquipment(state, heroId);
      state.equipment[heroId] = { weapon: null, armor: null, charm: null };
    }
    state.stats.equipmentActions += 1;
    addLog(state, `你明确完成了一次择优穿戴：小队战力${before}→${partyPower(state)}。`, "equipment");
  }

  function setPartyMember(state, heroId, active) {
    if (!state.roster.includes(heroId)) throw new Error("该角色尚未加入候补。");
    if (heroId === "player" && !active) throw new Error("本章主角不能离队。");
    if (active) {
      if (state.activeParty.includes(heroId)) return;
      if (state.activeParty.length >= MAX_PARTY) throw new Error("出战队已满，请先换下一人。");
      state.activeParty.push(heroId);
      state.formation = state.formation || {};
      const occupied = new Set(state.activeParty.filter((id) => id !== heroId).map((id) => state.formation[id]).filter(Number.isFinite));
      const prefersBack = ["apothecary", "thief", "exile", "hunter"].includes(heroId);
      const preference = prefersBack ? [2, 3, 1, 0] : [1, 0, 2, 3];
      state.formation[heroId] = preference.find((slot) => !occupied.has(slot)) ?? 0;
      addLog(state, `${HEROES[heroId].name}加入出战队。装备不会自动分配。`, "party");
    } else {
      state.activeParty = state.activeParty.filter((id) => id !== heroId);
      addLog(state, `${HEROES[heroId].name}回到候补。`, "party");
    }
  }

  function setFormationSlot(state, heroId, targetSlot) {
    if (!state.activeParty.includes(heroId)) throw new Error("只有出战成员才能调整站位。");
    if (!Number.isInteger(targetSlot) || targetSlot < 0 || targetSlot >= MAX_PARTY) throw new Error("站位不存在。");
    state.formation = state.formation || {};
    const currentSlot = Number(state.formation[heroId] ?? state.activeParty.indexOf(heroId));
    if (currentSlot === targetSlot) return;
    const otherId = state.activeParty.find((id) => id !== heroId && Number(state.formation[id]) === targetSlot);
    state.formation[heroId] = targetSlot;
    if (otherId) state.formation[otherId] = currentSlot;
    addLog(state, `${HEROES[heroId].name}调整到${FORMATION_LABELS[targetSlot]}${otherId ? `，${HEROES[otherId].name}与其交换位置` : ""}。`, "party");
  }

  function enemyPower(state) {
    const units = [
      ["captain", 90], ["crossbow_one", 60], ["crossbow_two", 60], ["shield_one", 55], ["shield_two", 55], ["priest", 55]
    ];
    let total = units.filter(([id]) => !state.threat.removed.includes(id)).reduce((sum, row) => sum + row[1], 0);
    total += Math.round(state.threat.supply * 0.30);
    total += Math.round((state.threat.morale - 50) * 0.35);
    total += Math.round(state.threat.legalClaim * 0.10);
    return Math.max(90, total);
  }

  function finalOptions(state) {
    if (state.phase !== "final") return [];
    const options = [
      { id: "defend", label: "依托小镇正面防守", requirement: "始终可选", bonus: state.threat.townDefense + state.threat.alliedSupport },
      { id: "field", label: "在镇外迎击", requirement: "始终可选", bonus: 0 }
    ];
    if (state.flags.ambushPrepared) options.push({ id: "ambush", label: "按侦察路线伏击", requirement: "已完成营地侦察/夜巡准备", bonus: 45 + Math.round((100 - state.threat.supply) * 0.25) });
    if (state.flags.duelLocked || state.flags.duelRight) {
      options.push({
        id: "duel", label: "要求队长履行荣誉决斗", requirement: "已获得决斗资格", bonus: 0,
        preview: { breakdown: "你本人对阵护卫队长；其他人不得插手。" }
      });
    }
    if (state.resources.evidence >= 4 && state.threat.legalClaim <= 30 && state.threat.removed.length >= 2) options.push({ id: "collapse", label: "在镇门公开证据，迫使雇员解散", requirement: "证据、法理与反水条件均满足", bonus: 0 });
    return options;
  }

  function resolveFinal(state, strategyId) {
    if (state.phase !== "final") throw new Error("最终战尚未开始。");
    const option = finalOptions(state).find((entry) => entry.id === strategyId);
    if (!option) throw new Error("该最终方案当前不可用。");
    if (strategyId !== "collapse") throw new Error("战斗方案必须经过正式战斗运行时结算。");
    const explanation = "账本、少爷违法证据与已经动摇的雇员形成完整因果链，护卫队在开战前解散。";
    state.phase = "victory";
    state.result = { win: true, strategy: strategyId, explanation, civiliansSafe: Boolean(state.flags.civiliansSafe) };
    addLog(state, `胜利：${explanation}`, "victory");
    return state.result;
  }

  function settleCombatAction(state, actionId, result) {
    const plan = combatPlanForInternalAction(state, actionId);
    if (!plan) throw new Error("这不是可结算的战斗行动。");
    if (!getAllowedActions(state).some((row) => row.id === actionId)) throw new Error("这个战斗已经不在当前场景中。");
    const win = combatWon(result);
    state.stats.combats = Number(state.stats.combats || 0) + 1;
    state.lastCombat = summarizeCombatResult(result, plan.title);

    if (actionId.startsWith("final:")) {
      const strategy = actionId.split(":")[1];
      state.phase = win ? "victory" : "defeat";
      const explanation = win
        ? strategy === "duel" ? "你在众目睽睽下击败护卫队长，其他人只能收起武器。" : "护卫队失去继续作战的能力，白鹿家的人撤出煤灰镇。"
        : strategy === "duel" ? "护卫队长赢下决斗，白鹿家以胜者身份逼近镇门。" : "你的出战队被击溃，护卫队越过了最后一道防线。";
      state.result = { win, strategy, explanation, civiliansSafe: Boolean(state.flags.civiliansSafe), combat: clone(state.lastCombat) };
      addLog(state, `${win ? "胜利" : "失败"}：${explanation}`, win ? "victory" : "defeat");
      return;
    }

    const [, eventId, optionId] = actionId.split(":");
    const event = EVENTS.find((entry) => entry.id === eventId);
    const option = event?.options.find((entry) => entry.id === optionId);
    if (!event || !option) throw new Error("战斗事件不存在。");
    const node = state.nodes[eventId] || (state.nodes[eventId] = {});
    let resolved = win;
    if (eventId === "guardian") {
      if (win) {
        state.dungeons.inner = true;
        state.flags.guardianDefeated = true;
        addLog(state, "守炉甲胄在炉门前倒下，王炉内环开放。", "unlock");
      } else {
        state.flags.guardianFailed = true;
        state.stats.failedChallenges += 1;
        resolved = false;
        addLog(state, "守炉甲胄把队伍逼退。交手时，甲胄背部喷出的蒸汽沿铜管回流进一口冷却井。", "failure");
      }
    } else if (eventId === "quartermaster") {
      if (win) {
        state.threat.supply = Math.max(0, state.threat.supply - 65);
        state.flags.campScouted = true;
        addLog(state, "军需车侧翻起火。营地里有人抢救箭箱、药箱和粮袋。", "threat");
      } else {
        state.flags.campDrainKnown = true;
        state.stats.failedChallenges += 1;
        resolved = false;
        addLog(state, "袭击军需车失败。撤退时，你看见后坡暗沟一直通进营地内侧，守卫的视线被土坡挡住。", "failure");
      }
    } else if (eventId === "arena") {
      if (win) recruit(state, "champion");
      else {
        state.flags.arenaFailed = true;
        state.stats.failedChallenges += 1;
        resolved = false;
        addLog(state, "你没能逼冠军退到擂台边缘。他揉了揉旧伤，问你敢不敢在双方都带伤的条件下再来一次。", "failure");
      }
    } else if (eventId === "duelist") {
      if (win) {
        recruit(state, "duelist");
        state.flags.duelRight = true;
      } else {
        state.stats.failedChallenges += 1;
        resolved = false;
        addLog(state, "剑士收剑后没有离开，只说：勇气不能证明你说的都是真的。", "failure");
      }
    } else if (eventId === "hunter") {
      if (win) {
        recruit(state, "hunter");
        const item = generateItem(state, "outer");
        item.identityTags = ["恐怖"];
        item.name = "断角兽骨哨";
        item.slot = "charm";
        item.slotLabel = "饰品";
        item.power = 16;
        item.rarity = "稀有";
        state.threat.morale = Math.max(0, state.threat.morale - 15);
      } else {
        state.flags.huntFailed = true;
        state.stats.failedChallenges += 1;
        resolved = false;
        addLog(state, optionId === "track" ? "断角兽踩中陷阱后仍拖断绳索逃走。猎人发现它的左后腿已经受伤，但眼下仍追不上。" : "怪兽撞开灌木逃走，泥地上留下连贯蹄印。猎人蹲下来量了量脚印间距。", "failure");
      }
    } else if (eventId === "night_raid") {
      if (win) {
        state.threat.morale = Math.max(0, state.threat.morale - 55);
        state.flags.ambushPrepared = true;
        state.flags.campScouted = true;
        addLog(state, "夜巡队溃散后，营地连续吹响警哨；你保留了他们下一次换岗的路线图。", "result");
      } else {
        state.threat.morale = Math.min(120, state.threat.morale + 12);
        state.stats.failedChallenges += 1;
        addLog(state, "夜袭失败。河边多了两处火盆，巡逻者开始结伴换岗。", "failure");
      }
    }
    node.lastOption = optionId;
    node.resolved = resolved;
    addLog(state, `已交战「${event.title}」：${playerActionLabel({ id: actionId, label: option.label })}`, "action");
    spendAction(state);
  }

  function simulateCombatPlan(plan) {
    if (!COMBAT_SIM?.simulateTeams) throw new Error("正式战斗运行时未加载。");
    return COMBAT_SIM.simulateTeams(plan.leftTeam, plan.rightTeam, {
      seed: plan.seed,
      randomizeStats: false,
      maxTime: plan.maxTime,
    });
  }

  function endDay(state) {
    if (state.phase !== "planning") throw new Error("当前不能结束日程。");
    state.ap = 0;
    advanceClock(state);
  }

  function applyAction(inputState, actionId) {
    const state = clone(inputState);
    if (isCombatActionId(actionId)) {
      const plan = combatPlanForInternalAction(state, actionId);
      settleCombatAction(state, actionId, simulateCombatPlan(plan));
    } else if (actionId === "investigate:inner_door") {
      if (state.phase !== "planning" || state.dungeons.inner || state.flags.doorInspected || state.ap <= 0) throw new Error("当前不能继续调查炉门。");
      state.flags.doorInspected = true;
      addLog(state, "你擦掉煤灰：门锁内部像被熔毁，门面有断裂旧纹；附近甲胄胸口的铜线一直通向门框。", "clue");
      spendAction(state);
    } else if (actionId.startsWith("event:")) {
      const parts = actionId.split(":");
      applyEventAction(state, parts[1], parts[2]);
    } else if (actionId.startsWith("grind:")) {
      const parts = actionId.split(":");
      grind(state, parts[1], Number(parts[2]));
    } else if (actionId === "auto_equip") autoEquip(state);
    else if (actionId.startsWith("equip:")) {
      const parts = actionId.split(":"); equipItem(state, parts[1], parts[2]);
    } else if (actionId.startsWith("party:add:")) setPartyMember(state, actionId.split(":")[2], true);
    else if (actionId.startsWith("party:remove:")) setPartyMember(state, actionId.split(":")[2], false);
    else if (actionId.startsWith("formation:")) {
      const parts = actionId.split(":");
      setFormationSlot(state, parts[1], Number(parts[2]));
    }
    else if (actionId === "end_day") endDay(state);
    else if (actionId.startsWith("final:")) resolveFinal(state, actionId.split(":")[1]);
    else throw new Error(`未知动作：${actionId}`);
    return state;
  }

  function getAllowedActions(state) {
    const actions = [];
    for (const node of getVisibleNodes(state)) {
      for (const option of node.options) {
        if (!option.available) continue;
        const id = node.kind === "dungeon" ? option.id : `event:${node.id}:${option.id}`;
        actions.push({ id, label: `${node.title}｜${option.label}`, cost: option.cost, outcome: option.outcome });
      }
    }
    if (state.phase === "planning") {
      if (!state.dungeons.inner && !state.flags.doorInspected && state.ap > 0) {
        actions.push({ id: "investigate:inner_door", label: "王炉门｜擦去煤灰，仔细检查门锁与周围", cost: "1行动点", outcome: "观察门本身" });
      }
      actions.push({ id: "auto_equip", label: "队伍｜一键择优穿戴", cost: "0行动点", outcome: "明确把背包中最高战力装备分给当前出战队" });
      const equipped = equippedItemIds(state);
      const equipActionIds = new Set();
      function offerEquip(item, heroId, reason) {
        if (!item || equipped.has(item.id)) return;
        const id = `equip:${item.id}:${heroId}`;
        if (equipActionIds.has(id)) return;
        equipActionIds.add(id);
        const currentId = (state.equipment[heroId] || {})[item.slot];
        const current = state.inventory.find((entry) => entry.id === currentId);
        const afterPower = partyPower(state) + itemPower(item) - itemPower(current);
        actions.push({
          id,
          label: `装备｜${HEROES[heroId].name}穿戴${item.rarity}${item.name}${item.identityTags.length ? `[${item.identityTags.join("/")}]` : ""}`,
          cost: "0行动点",
          outcome: `${reason}；替换当前${item.slotLabel}，小队战力${partyPower(state)}→${afterPower}`
        });
      }
      for (const heroId of state.activeParty) {
        for (const slot of Object.keys(SLOT_LABEL)) {
          const currentId = (state.equipment[heroId] || {})[slot];
          const current = state.inventory.find((item) => item.id === currentId);
          const best = unequippedItems(state, (item) => item.slot === slot).sort((a, b) => itemPower(b) - itemPower(a))[0];
          if (best && itemPower(best) > itemPower(current)) offerEquip(best, heroId, "这是该部位当前最强的未装备物品");
        }
      }
      for (const item of unequippedItems(state, (entry) => entry.identityTags.length > 0).sort((a, b) => itemPower(b) - itemPower(a)).slice(0, 12)) {
        offerEquip(item, "player", `身份词条可用于事件交涉`);
      }
      for (const item of state.inventory.filter((entry) => entry.identityTags.length > 0)) {
        let carrierId = null;
        for (const [heroId, slots] of Object.entries(state.equipment)) {
          if (Object.values(slots || {}).includes(item.id)) { carrierId = heroId; break; }
        }
        if (!carrierId || carrierId === "player") continue;
        const id = `equip:${item.id}:player`;
        if (equipActionIds.has(id)) continue;
        equipActionIds.add(id);
        const currentId = (state.equipment.player || {})[item.slot];
        const current = state.inventory.find((entry) => entry.id === currentId);
        const carrierLoss = state.activeParty.includes(carrierId) ? itemPower(item) : 0;
        const afterPower = partyPower(state) + itemPower(item) - itemPower(current) - carrierLoss;
        actions.push({
          id,
          label: `转交身份装备｜${HEROES[carrierId].name}→你：${item.rarity}${item.name}[${item.identityTags.join("/")}]`,
          cost: "0行动点",
          outcome: `${HEROES[carrierId].name}的${item.slotLabel}会空出；主角替换当前${item.slotLabel}并获得对应身份；小队战力${partyPower(state)}→${afterPower}`
        });
      }
      for (const heroId of state.roster) {
        if (!state.activeParty.includes(heroId) && state.activeParty.length < MAX_PARTY) actions.push({ id: `party:add:${heroId}`, label: `编队｜${HEROES[heroId].name}加入出战`, cost: "0行动点", outcome: "只改变出战队，不自动装备" });
        if (state.activeParty.includes(heroId) && heroId !== "player") actions.push({ id: `party:remove:${heroId}`, label: `编队｜${HEROES[heroId].name}回候补`, cost: "0行动点", outcome: "空出一个出战位" });
      }
      for (const heroId of state.activeParty) {
        const current = Number(state.formation?.[heroId] ?? state.activeParty.indexOf(heroId));
        for (let slot = 0; slot < MAX_PARTY; slot += 1) {
          if (slot === current) continue;
          actions.push({ id: `formation:${heroId}:${slot}`, label: `站位｜${HEROES[heroId].name}调到${FORMATION_LABELS[slot]}`, cost: "0行动点", outcome: "若目标位置有人则交换" });
        }
      }
      actions.push({ id: "end_day", label: "时间｜提前结束本日", cost: `放弃剩余${state.ap}行动点`, outcome: "推进到下一日或第五日来袭" });
    }
    for (const option of finalOptions(state)) actions.push({ id: `final:${option.id}`, label: `最终方案｜${option.label}`, cost: "结算章节", outcome: option.preview ? option.preview.breakdown : option.requirement });
    return actions;
  }

  function inventorySummary(state) {
    const byRarity = Object.fromEntries(RARITIES.map((rarity) => [rarity, 0]));
    const byTag = {};
    for (const item of state.inventory) {
      byRarity[item.rarity] += 1;
      for (const tag of item.identityTags) byTag[tag] = (byTag[tag] || 0) + 1;
    }
    return { total: state.inventory.length, byRarity, byTag };
  }

  const PLAYER_SCENES = {
    smith: "铁匠把几把断刃摊在砧台上，反复比较火色。他愿意看看你从灰炉带回来的东西。",
    injured_shield: "西门沟渠里躺着一个负伤男人，圆盾压在腿下。商队已经走远。",
    apothecary: "药铺里挤满病人，学徒还惦记着城外没收回来的药草。",
    thief_trial: "粮商揪住一个偷粮少年；少年指着粮仓封条，喊他正在囤粮抬价。",
    guild_feud: "铠匠要扩炉，客栈老板守着后院的水井，两个人都拒绝让步。",
    caravan: "西门外货车侧翻，河水正在上涨；车夫和被缚在车后的难民同时呼救。",
    rumor: "酒馆角落的消息贩子声称见过白鹿家护卫，但他不会免费开口。",
    exile: "灰炉边的流放者一直避开礼拜堂的人。她的视线在旧炉墙上停留得比常人更久。",
    guardian: "一具古代甲胄站在炉门附近。你靠近时，它胸口的铜线亮了一瞬。",
    cooling: "上次交手时喷出的蒸汽掀开了碎石，露出一口与甲胄相连的冷却井。",
    chapel: "礼拜堂声称圣物被盗；另一份旧口供却说它曾从一个流放家族手里被没收。",
    quartermaster: "河畔营地的军需车停在木栅后，门卫盘问每个靠近的人，后坡有一道积水沟。",
    ledger: "随队执事暂住礼拜堂。他随身带着雇佣印章，却不像白鹿家的家臣。",
    militia: "两名本地雇工抱怨白鹿家拖欠工钱，但更担心被贵族追究逃跑。",
    arena: "倒塌擂台上，一个壮汉独自练拳。围观者称他从不跟没本事的人同行。",
    wall: "旧城墙有三处明显缺口。风从箭孔灌进来，石料和人手都不够。",
    duelist: "白鹿家的旁支剑士在西门等你。她谈家族名誉时，语气比谈少爷本人更认真。",
    hunter: "断角兽的脚印绕着营地延伸，一名猎人正蹲在泥边检查血迹。",
    night_raid: "夜巡队每天沿河换岗。高地能看见路线，但火把之间还有大片黑暗。",
    envoy: "少爷的使者带着一张盖印文书来到广场，要求你在第五日前作出回应。",
    evacuation: "镇民争论要不要撤离，店主们则担心空镇会被洗劫。"
  };

  const SAFE_ACTION_LABELS = {
    "event:militia:terror": "向两名雇工逼近，让他们自己衡量继续参战的风险",
    "event:ledger:religious": "请执事亲自核对你身上的旧徽记",
    "event:quartermaster:contraband": "以营地熟悉的黑市装束接近门卫",
    "event:duelist:noble": "按她认可的礼仪正式会谈",
    "event:exile:relic": "把那件带有礼拜堂印记的物品放在流放者面前",
    "event:smith:inspect_lock": "把炉门拓印拿给铁匠看",
    "event:exile:marks": "把门上纹路的拓印拿给流放者看"
  };

  function publicActionId(state, internalActionId) {
    const key = `${state.seed}:${state.day}:${state.spentActions}:${state.inventory.length}:${internalActionId}`;
    return `choice_${hashSeed(key).toString(36)}`;
  }

  function playerActionLabel(row) {
    if (SAFE_ACTION_LABELS[row.id]) return SAFE_ACTION_LABELS[row.id];
    const parts = String(row.label || row.id).split("｜");
    return parts.length > 1 ? parts.slice(1).join("｜") : parts[0];
  }

  function playerActionKind(internalId) {
    if (isCombatActionId(internalId)) return "combat";
    if (internalId.startsWith("grind:")) return "enter_area";
    if (internalId.startsWith("event:") || internalId.startsWith("investigate:")) return "interact";
    if (internalId.startsWith("equip:") || internalId === "auto_equip") return "equipment";
    if (internalId.startsWith("party:")) return "party";
    if (internalId.startsWith("formation:")) return "formation";
    if (internalId.startsWith("final:")) return "final_decision";
    if (internalId === "end_day") return "time";
    return "action";
  }

  function playerActionPlaceId(internalId) {
    if (internalId.startsWith("grind:outer:")) return "place_grey_furnace_outer";
    if (internalId.startsWith("grind:inner:")) return "place_king_furnace_door";
    if (internalId === "investigate:inner_door") return "place_king_furnace_door";
    if (internalId.startsWith("event:")) return `place_${internalId.split(":")[1]}`;
    if (internalId.startsWith("equip:") || internalId === "auto_equip") return "place_party";
    if (internalId.startsWith("party:")) return "place_party";
    if (internalId.startsWith("formation:")) return "place_party";
    if (internalId.startsWith("final:")) return "place_final";
    if (internalId === "end_day") return "place_time";
    return "place_misc";
  }

  function getPlayerActionCatalog(state) {
    return getAllowedActions(state)
      .filter((row) => !row.id.startsWith("event:guardian:") || state.flags.doorInspected || state.flags.guardianFailed)
      .map((row) => {
        const result = {
          id: publicActionId(state, row.id),
          internalId: row.id,
          label: playerActionLabel(row),
          kind: playerActionKind(row.id),
          placeId: playerActionPlaceId(row.id)
        };
        if (row.id.startsWith("event:") || row.id.startsWith("investigate:")) result.actionPointMark = 1;
        if (row.id === "end_day") result.endsCurrentDay = true;
        return result;
      });
  }

  function applyPlayerAction(inputState, publicId) {
    const match = getPlayerActionCatalog(inputState).find((row) => row.id === publicId);
    if (!match) throw new Error("这个行动已经不在当前场景中。");
    return applyAction(inputState, match.internalId);
  }

  function preparePlayerCombat(inputState, publicId) {
    const match = getPlayerActionCatalog(inputState).find((row) => row.id === publicId);
    if (!match || !isCombatActionId(match.internalId)) return null;
    const plan = combatPlanForInternalAction(inputState, match.internalId);
    return { ...clone(plan), publicActionId: publicId };
  }

  function applyPlayerCombatResult(inputState, publicId, result) {
    const match = getPlayerActionCatalog(inputState).find((row) => row.id === publicId);
    if (!match || !isCombatActionId(match.internalId)) throw new Error("这个战斗已经不在当前场景中。");
    const state = clone(inputState);
    settleCombatAction(state, match.internalId, result);
    return state;
  }

  function playerNodeScene(state, event) {
    if (event.id === "smith" && state.flags.smithDoorTheory && !state.dungeons.inner) {
      const count = countItems(state, (item) => item.identityTags.includes("古代锻造") && !equippedItemIds(state).has(item.id));
      return `${PLAYER_SCENES.smith} 他已经提出重铸设想，目前桌上有${count}件符合拓印火纹的器物。`;
    }
    if (event.id === "exile" && state.flags.exileRuneTheory && !state.dungeons.inner) {
      return `${PLAYER_SCENES.exile} 她已经认出拓印中的短句，并开价四枚金币。`;
    }
    return PLAYER_SCENES[event.id] || event.title;
  }

  function getPlayerVisibleNodes(state) {
    const nodes = [];
    nodes.push({
      id: "place_grey_furnace_outer",
      title: "灰炉外环",
      area: "灰炉遗址",
      status: state.phase === "planning" ? "present" : "closed",
      scene: "煤灰覆盖着外围废道，里面不时传来怪物拖动铁器的声音。"
    });
    nodes.push({
      id: "place_king_furnace_door",
      title: "王炉门",
      area: "灰炉遗址",
      status: state.dungeons.inner ? "open" : "locked",
      scene: state.dungeons.inner
        ? "厚重铁门已经打开，里面的炉火照出更深的通道。"
        : state.flags.doorInspected
          ? "煤灰下露出熔毁的锁芯、断裂旧纹，以及一条通往附近甲胄的铜线。"
          : "一扇被煤灰覆盖的厚重铁门挡住了更深处。"
    });
    for (const event of EVENTS) {
      if (event.id === "guardian" && !state.flags.doorInspected && !state.flags.guardianFailed) continue;
      if (event.visibleIf && !event.visibleIf(state)) continue;
      const progress = state.nodes[event.id] || {};
      const hasAppeared = state.day >= event.start || progress.resolved || progress.lastOption;
      if (!hasAppeared) continue;
      if (state.day > event.end && !progress.resolved && !progress.lastOption) continue;
      nodes.push({
        id: `place_${event.id}`,
        title: event.title,
        area: MAP_AREAS[event.area].label,
        status: progress.resolved ? "settled" : state.day > event.end ? "gone" : state.phase === "planning" ? "present" : "closed",
        scene: playerNodeScene(state, event)
      });
    }
    return nodes;
  }

  function playerThreatSignals(state) {
    const rows = ["白鹿家的人将在第五日黄昏抵达。"];
    if (state.flags.guardRosterKnown) rows.push(...state.threat.known.map((row) => `消息：${row}`));
    if (state.threat.supply < 100) rows.push("河畔营地正在抢救受损的箭箱、药品和粮袋。");
    if (state.threat.morale > 105) rows.push("营地方向的咒骂和叫嚣比之前更响。");
    if (state.threat.morale < 70) rows.push("来往镇外的雇工神色动摇，夜间火把也少了。 ");
    if (state.threat.legalClaim < 50) rows.push("镇上开始有人公开质疑少爷这次报复是否站得住脚。");
    const removedSummary = visibleRemovedThreats(state);
    if (removedSummary.length) rows.push(`已经确认不会随队出现：${removedSummary.join("、")}。`);
    if (state.threat.townDefense > 0) rows.push("镇墙和街垒已经有了明显修补。 ");
    if (state.flags.duelRight) rows.push("旁支剑士愿意为你本人和护卫队长的一对一决斗作证；其他人不得插手。");
    if (state.flags.duelLocked) rows.push("少爷的使者已经收下由你本人挑战护卫队长的正式文书。");
    return rows;
  }

  function visibleRemovedThreats(state) {
    const removed = new Set(state.threat.removed);
    const rows = [];
    const crossbowsOut = Number(removed.has("crossbow_one")) + Number(removed.has("crossbow_two"));
    const shieldsOut = Number(removed.has("shield_one")) + Number(removed.has("shield_two"));
    if (removed.has("captain")) rows.push("队长·罗德里克");
    if (crossbowsOut) rows.push(crossbowsOut === 1 ? "一名弩手" : `弩手×${crossbowsOut}`);
    if (shieldsOut) rows.push(shieldsOut === 1 ? "一名本地盾手" : `本地盾手×${shieldsOut}`);
    if (removed.has("priest")) rows.push("随队执事");
    return rows;
  }

  function getPlayerObservation(state) {
    const catalog = getPlayerActionCatalog(state);
    const itemById = new Map(state.inventory.map((item) => [item.id, item]));
    return {
      schema: "five_day_guard_raid_observation_v2",
      time: { day: state.day, actionsRemainingToday: state.ap, phase: state.phase },
      situation: state.day === 1
        ? "你打了在镇上撒泼的白鹿家少爷。他逃走前说第五日会带人回来。"
        : "白鹿家少爷留下的期限仍在逼近。",
      party: {
        active: state.activeParty.map((id) => ({
          id: `ally_${hashSeed(id).toString(36)}`,
          name: HEROES[id].name,
          role: HEROES[id].role,
          combatRole: HEROES[id].combatRole,
          visiblePower: heroPower(state, id),
          formation: { slotIndex: Number(state.formation?.[id] ?? state.activeParty.indexOf(id)), label: FORMATION_LABELS[Number(state.formation?.[id] ?? state.activeParty.indexOf(id))] },
          visibleSkills: visibleHeroSkills(id),
          wornItems: Object.values(state.equipment[id] || {}).filter(Boolean).map((itemId) => itemById.get(itemId)).filter(Boolean).map((item) => ({ name: item.name, slot: item.slotLabel, rarity: item.rarity, power: item.power, identityTags: clone(item.identityTags) }))
        })),
        reserve: state.roster.filter((id) => !state.activeParty.includes(id)).map((id) => ({ id: `ally_${hashSeed(id).toString(36)}`, name: HEROES[id].name, role: HEROES[id].role, combatRole: HEROES[id].combatRole, visibleSkills: visibleHeroSkills(id) }))
      },
      resources: clone(state.resources),
      inventory: state.inventory.map((item) => ({ id: `gear_${hashSeed(item.id).toString(36)}`, name: item.name, slot: item.slotLabel, rarity: item.rarity, power: item.power, identityTags: clone(item.identityTags), currentlyWorn: equippedItemIds(state).has(item.id) })),
      places: getPlayerVisibleNodes(state),
      threatSignals: playerThreatSignals(state),
      recentSignals: clone(state.recent.slice(0, 8)).map((row) => row.text),
      actions: catalog.map(({ internalId, ...row }) => row),
      lastCombat: state.lastCombat ? clone(state.lastCombat) : null,
      result: state.result ? { win: state.result.win, explanation: state.result.explanation, combat: state.result.combat ? clone(state.result.combat) : null } : null
    };
  }

  function getPlayerView(state) {
    const removedLabels = { captain: "队长·罗德里克", crossbow_one: "一名弩手", crossbow_two: "一名弩手", shield_one: "一名本地盾手", shield_two: "一名本地盾手", priest: "随队执事" };
    const equippedIdentityTags = [];
    for (const heroId of state.activeParty) {
      const slots = state.equipment[heroId] || {};
      for (const itemId of Object.values(slots)) {
        const item = state.inventory.find((entry) => entry.id === itemId);
        for (const tag of item ? item.identityTags : []) equippedIdentityTags.push({ tag, carrier: HEROES[heroId].name, item: item.name });
      }
    }
    const identityGroups = new Map();
    for (const row of equippedIdentityTags) {
      if (!identityGroups.has(row.tag)) identityGroups.set(row.tag, new Set());
      identityGroups.get(row.tag).add(row.carrier);
    }
    const equippedIdentitySummary = [...identityGroups.entries()].map(([tag, carriers]) => ({ tag, carriers: [...carriers] }));
    const removedSet = new Set(state.threat.removed);
    const removedSummary = [];
    const crossbowsOut = Number(removedSet.has("crossbow_one")) + Number(removedSet.has("crossbow_two"));
    const shieldsOut = Number(removedSet.has("shield_one")) + Number(removedSet.has("shield_two"));
    if (removedSet.has("captain")) removedSummary.push("队长·罗德里克");
    if (crossbowsOut) removedSummary.push(crossbowsOut === 1 ? "一名弩手" : `弩手×${crossbowsOut}`);
    if (shieldsOut) removedSummary.push(shieldsOut === 1 ? "一名本地盾手" : `本地盾手×${shieldsOut}`);
    if (removedSet.has("priest")) removedSummary.push("随队执事");
    let knownMembers = clone(state.threat.known);
    if (state.flags.guardRosterKnown) {
      const removed = new Set(state.threat.removed);
      const crossbowsOut = Number(removed.has("crossbow_one")) + Number(removed.has("crossbow_two"));
      const shieldsOut = Number(removed.has("shield_one")) + Number(removed.has("shield_two"));
      knownMembers = [
        `队长·罗德里克（${removed.has("captain") ? "已退出" : "参战"}）`,
        `弩手×${2 - crossbowsOut}${crossbowsOut ? `（${crossbowsOut}人已退出）` : ""}${state.threat.supply < 100 ? "（补给受损）" : ""}`,
        `本地盾手×${2 - shieldsOut}${shieldsOut ? `（${shieldsOut}人已退出）` : ""}`,
        `随队执事（${removed.has("priest") ? "已退出" : "参战"}）`
      ];
    }
    return {
      schema: "five_day_guard_raid_player_view_v1",
      objective: "第五日黄昏应对贵族护卫队；刷副本不花行动点，事件与关系会改变最终战。",
      clock: { day: state.day, finalDay: FINAL_DAY, actionPoints: state.ap, spentActions: state.spentActions, phase: state.phase },
      rulesVisible: ["每日3行动点，共5日", "刷副本不消耗行动点且不推进时间", "掉落进入背包，只有明确装备后才增加战力", "出战队上限4人，开局只有主角", "锁定节点会持续显示缺少条件"],
      party: {
        power: partyPower(state), max: MAX_PARTY,
        equippedIdentityTags,
        equippedIdentitySummary,
        active: state.activeParty.map((id) => ({ id, ...HEROES[id], power: heroPower(state, id), equipment: clone(state.equipment[id] || {}) })),
        reserve: state.roster.filter((id) => !state.activeParty.includes(id)).map((id) => ({ id, ...HEROES[id], power: heroPower(state, id) }))
      },
      resources: clone(state.resources),
      inventory: inventorySummary(state),
      inventoryItems: clone(state.inventory),
      threat: { ...clone(state.threat), known: knownMembers, removed: removedSummary, estimatedPower: state.flags.guardRosterKnown ? enemyPower(state) : null },
      nodes: getVisibleNodes(state),
      finalOptions: finalOptions(state),
      recent: clone(state.recent),
      allowedActions: getAllowedActions(state),
      result: clone(state.result)
    };
  }

  return {
    VERSION, MAX_PARTY, AP_PER_DAY, FINAL_DAY, RARITIES, HEROES, MAP_AREAS, EVENTS,
    createInitialState, getPlayerView, getVisibleNodes, getAllowedActions, applyAction,
    getPlayerObservation, getPlayerActionCatalog, applyPlayerAction, preparePlayerCombat, applyPlayerCombatResult,
    combatPlanForInternalAction, simulateCombatPlan,
    partyPower, heroPower, enemyPower, finalOptions, inventorySummary
  };
});
