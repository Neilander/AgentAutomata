const RARITIES = [
  { id: "common", name: "普通", multiplier: 1.0, color: "#c8c2b2" },
  { id: "rare", name: "稀有", multiplier: 1.25, color: "#66b8e8" },
  { id: "epic", name: "史诗", multiplier: 1.6, color: "#a783ee" },
  { id: "legendary", name: "传说", multiplier: 2.1, color: "#e7b84f" },
  { id: "mythic", name: "神话", multiplier: 2.75, color: "#ef6f6c" },
  { id: "wonder", name: "惊奇", multiplier: 3.45, color: "#6ce0c5" },
  { id: "phantom", name: "幻影", multiplier: 4.35, color: "#d68cff" },
];

const ZONES = [
  { id: "grass_camp", name: "荒草营地", recommendedLevel: 1, recommendedPower: 120, enemyLevel: [1, 2], expReward: [26, 40], equipmentTiers: [1, 2], rarityTable: { common: 0.58, rare: 0.28, epic: 0.1, legendary: 0.035, mythic: 0.005 }, enemies: ["草地盗匪", "木盾兵", "野火学徒"], map: { x: 12, y: 68, radius: 11, color: "#78a84b" } },
  { id: "old_road", name: "旧路哨站", recommendedLevel: 3, recommendedPower: 260, enemyLevel: [3, 4], expReward: [46, 68], equipmentTiers: [2, 3], rarityTable: { rare: 0.48, epic: 0.28, legendary: 0.16, mythic: 0.07, wonder: 0.01 }, enemies: ["铁盔巡兵", "弩手", "灰袍医师"], map: { x: 27, y: 55, radius: 10, color: "#9c8d65" } },
  { id: "black_pine", name: "黑松林", recommendedLevel: 5, recommendedPower: 480, enemyLevel: [5, 7], expReward: [74, 110], equipmentTiers: [3, 4, 5], rarityTable: { epic: 0.45, legendary: 0.3, mythic: 0.18, wonder: 0.06, phantom: 0.01 }, enemies: ["林地刺客", "黑松狼", "腐藤术士"], map: { x: 42, y: 38, radius: 12, color: "#36683d" } },
  { id: "stone_mine", name: "碎石矿坑", recommendedLevel: 8, recommendedPower: 760, enemyLevel: [8, 10], expReward: [110, 165], equipmentTiers: [5, 6, 7], rarityTable: { legendary: 0.42, mythic: 0.32, wonder: 0.18, phantom: 0.08 }, enemies: ["矿坑傀儡", "爆药工", "碎晶虫"], map: { x: 58, y: 62, radius: 11, color: "#777067" } },
  { id: "mist_marsh", name: "雾沼边境", recommendedLevel: 10, recommendedPower: 1120, enemyLevel: [10, 13], expReward: [155, 230], equipmentTiers: [6, 7, 8], rarityTable: { mythic: 0.5, wonder: 0.33, phantom: 0.17 }, enemies: ["沼泽毒师", "泥甲守卫", "雾中猎手"], map: { x: 72, y: 45, radius: 12, color: "#597f61" } },
  { id: "thunder_highland", name: "雷鸣高地", recommendedLevel: 15, recommendedPower: 1780, enemyLevel: [15, 18], expReward: [230, 340], equipmentTiers: [7, 8, 9], rarityTable: { mythic: 0.28, wonder: 0.46, phantom: 0.26 }, enemies: ["雷斧蛮兵", "风暴祭司", "山脊巨兽"], map: { x: 83, y: 24, radius: 11, color: "#6c7faf" } },
  { id: "dragon_bone", name: "龙骨废墟", recommendedLevel: 20, recommendedPower: 2600, enemyLevel: [20, 24], expReward: [330, 520], equipmentTiers: [9, 10], rarityTable: { wonder: 0.55, phantom: 0.45 }, enemies: ["龙骨骑士", "星界残魂", "废墟守望者"], map: { x: 91, y: 72, radius: 10, color: "#9b6f62" } },
];

const STORAGE_KEY = "western_fantasy_world_demo_v4";
const SHARED_SKILLS = window.GAME_SKILL_DATA || {};
const BERSERKER_MODEL = SHARED_SKILLS.berserkerModel || {};
const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
const BERSERKER_DURATIONS = BERSERKER_MODEL.durations || {};
const BERSERKER_COOLDOWNS = BERSERKER_MODEL.cooldowns || {};
const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};
const SLOTS = ["武器", "头盔", "胸甲", "护手", "鞋子", "饰品"];
const SLOT_ICONS = { 武器: "⚔️", 头盔: "🪖", 胸甲: "🛡️", 护手: "🧤", 鞋子: "🥾", 饰品: "💍" };
const RARITY_RANK = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5, wonder: 6, phantom: 7 };
const RARITY_AFFIX_COUNT = { common: 1, rare: 1, epic: 2, legendary: 2, mythic: 3, wonder: 3, phantom: 3 };
const STAT_META = {
  hp: { name: "生命", weight: 0.22, unit: "" },
  attack: { name: "攻击", weight: 3.2, unit: "" },
  defense: { name: "防御", weight: 5.2, unit: "" },
  magicPower: { name: "法强", weight: 3.2, unit: "" },
  magicResist: { name: "魔抗", weight: 4.8, unit: "" },
  attackSpeed: { name: "攻速", weight: 180, unit: "%", percent: true },
  moveSpeed: { name: "移速", weight: 5, unit: "" },
  critChance: { name: "物暴", weight: 230, unit: "%", percent: true },
  spellCritChance: { name: "法暴", weight: 230, unit: "%", percent: true },
  critDamage: { name: "暴伤", weight: 120, unit: "%", percent: true },
  fireDamage: { name: "火焰伤害", weight: 2.6, unit: "" },
  poisonDamage: { name: "剧毒伤害", weight: 2.7, unit: "" },
  lightningDamage: { name: "雷电伤害", weight: 2.8, unit: "" },
  iceDamage: { name: "冰霜伤害", weight: 2.7, unit: "" },
  arcaneDamage: { name: "奥术伤害", weight: 2.9, unit: "" },
  fireDamageAmp: { name: "火焰增幅", weight: 180, unit: "%", percent: true },
  poisonDurationAmp: { name: "剧毒时长", weight: 150, unit: "%", percent: true },
  lightningChainChance: { name: "闪电连锁", weight: 240, unit: "%", percent: true },
  healPower: { name: "治疗", weight: 3.1, unit: "" },
  cooldownReduction: { name: "冷却缩减", weight: 260, unit: "%", percent: true },
  lifeSteal: { name: "吸血", weight: 260, unit: "%", percent: true },
  blockChance: { name: "格挡", weight: 240, unit: "%", percent: true },
  regen: { name: "回复", weight: 3.2, unit: "" },
  shieldPower: { name: "护盾", weight: 3, unit: "" },
  resistShred: { name: "减抗", weight: 260, unit: "%", percent: true },
  vulnerabilityAmp: { name: "易伤", weight: 240, unit: "%", percent: true },
  markPower: { name: "标记强度", weight: 220, unit: "%", percent: true },
  auraPower: { name: "战歌强度", weight: 220, unit: "%", percent: true },
};
const SLOT_STAT_POOLS = {
  武器: ["attack", "magicPower", "attackSpeed", "critChance", "spellCritChance", "fireDamage", "lightningDamage", "arcaneDamage", "lifeSteal", "resistShred"],
  头盔: ["attack", "magicPower", "critChance", "spellCritChance", "magicResist", "healPower", "cooldownReduction", "auraPower"],
  胸甲: ["hp", "defense", "magicResist", "fireDamageAmp", "poisonDurationAmp", "blockChance", "regen", "shieldPower"],
  护手: ["attack", "attackSpeed", "critChance", "fireDamage", "poisonDamage", "lightningChainChance", "markPower", "vulnerabilityAmp"],
  鞋子: ["hp", "defense", "moveSpeed", "attackSpeed", "iceDamage", "cooldownReduction", "regen"],
  饰品: ["magicPower", "healPower", "critDamage", "fireDamageAmp", "lightningChainChance", "arcaneDamage", "poisonDamage", "resistShred", "auraPower", "vulnerabilityAmp"],
};
const MAP_SIZE = { width: 2200, height: 1400 };
const FORMATION = [
  { x: -5.2, y: -1.4 },
  { x: 0.4, y: 4.2 },
  { x: 5.4, y: -1.8 },
];

const CLASS_DESIGNS = {
  战士: { icon: "⚔", visible: "冲进怪堆，一刀砍到多个敌人", feedback: "黄色顺劈弧，两段伤害同时跳", focus: ["攻击", "攻速", "物暴", "暴伤"], combo: "吃吟游诗人攻速，配骑士聚怪" },
  狂战士: { icon: "🪓", visible: "血越低打得越疯，快死时突然爆发", feedback: "红色血怒光，攻击频率和伤害变高", focus: ["攻击", "吸血", "攻速", "暴伤"], combo: "牧师控血不死，吟游诗人放大爆发" },
  骑士: { icon: "🛡", visible: "怪物更容易围着他，后排掉血变慢", feedback: "嘲讽标记、盾光、队友受伤数字变小", focus: ["生命", "防御", "魔抗", "格挡"], combo: "保护法师/牧师，给AOE创造窗口" },
  游侠: { icon: "🏹", visible: "站远处点杀同一目标，越打越痛", feedback: "目标头上标记层数，伤害逐渐变大", focus: ["攻速", "物暴", "标记强度", "雷电"], combo: "术士减抗后，标记目标被快速点杀" },
  法师: { icon: "🔥", visible: "怪堆被一波范围法术炸掉", feedback: "火圈/雷爆，一片敌人同时跳伤害", focus: ["法强", "法暴", "火焰", "奥术"], combo: "骑士聚怪，术士减抗后爆炸" },
  牧师: { icon: "✚", visible: "队友快死时被拉回来", feedback: "绿色治疗数字和短护盾圈", focus: ["治疗", "法强", "冷却", "护盾"], combo: "保狂战士低血爆发，稳住后排" },
  吟游诗人: { icon: "♪", visible: "全队进入加速窗口，攻击节奏突然变快", feedback: "全队音符，攻速变快，暴击更多", focus: ["战歌强度", "冷却", "治疗", "暴击"], combo: "放大战士/游侠/狂战士输出窗口" },
  术士: { icon: "☠", visible: "怪物挂诅咒，持续掉血并变脆", feedback: "紫黑诅咒、小跳伤害、后续伤害变大", focus: ["法强", "剧毒", "持续时间", "减抗"], combo: "给法师和游侠制造易伤环境" },
};

const HERO_POOL = [
  { id: "vanguard", name: "先锋", role: "战士", color: "#67bdd8", hp: 225, attack: 20, defense: 1.05, speed: 6.2, rarity: "普通", hair: "#26343c", skin: "#e0b184", accent: "#67bdd8" },
  { id: "red_lion", name: "赤狮", role: "狂战士", color: "#ef6f6c", hp: 245, attack: 27, defense: 0.86, speed: 6.2, rarity: "传说", hair: "#73301f", skin: "#e1aa78", accent: "#ef6f6c" },
  { id: "iron_oath", name: "铁誓", role: "骑士", color: "#83c06b", hp: 310, attack: 15, defense: 1.55, speed: 5.3, rarity: "普通", hair: "#3d3329", skin: "#d8a373", accent: "#83c06b" },
  { id: "moon_ranger", name: "月弦", role: "游侠", color: "#a783ee", hp: 178, attack: 27, defense: 0.76, speed: 7.0, rarity: "史诗", hair: "#201d2e", skin: "#d9b39b", accent: "#a783ee" },
  { id: "ember", name: "烬法", role: "法师", color: "#e7a45c", hp: 165, attack: 24, defense: 0.78, speed: 5.8, rarity: "稀有", hair: "#5a2d27", skin: "#e5b38c", accent: "#e7a45c" },
  { id: "silver_priest", name: "银誓", role: "牧师", color: "#d7dce8", hp: 190, attack: 19, defense: 1.0, speed: 5.6, rarity: "稀有", hair: "#ece7d8", skin: "#d9ae8a", accent: "#d7dce8" },
  { id: "dawn_bard", name: "晨歌", role: "吟游诗人", color: "#d7b65d", hp: 185, attack: 18, defense: 0.92, speed: 6.1, rarity: "稀有", hair: "#6a4b2d", skin: "#e3b58d", accent: "#d7b65d" },
  { id: "ash_warlock", name: "灰契", role: "术士", color: "#9d76c9", hp: 175, attack: 23, defense: 0.82, speed: 5.7, rarity: "史诗", hair: "#2a2033", skin: "#c99d84", accent: "#9d76c9" },
];

const state = {
  equipmentSets: [],
  selectedZoneId: "grass_camp",
  running: false,
  speedMode: 1,
  lastFrame: 0,
  pan: { x: -260, y: -330 },
  zoom: 0.82,
  dragging: null,
  phase: "patrol",
  phaseTimer: 0,
  patrolTarget: null,
  activeGroupId: null,
  mobs: [],
  loot: [],
  collectables: [],
  floaters: [],
  effects: [],
  mobId: 1,
  groupId: 1,
  lootId: 1,
  collectId: 1,
  floatId: 1,
  effectId: 1,
  squad: createDefaultSquad(),
  roster: [],
  selectedHeroId: "vanguard",
  selectedInventoryId: null,
  lastRecruit: null,
  tower: { floor: 1, best: 0, active: false, batch: 1, lastReward: null, banner: { type: "idle", text: "选择试炼层，开始检测小队战力。" } },
  player: { level: 1, exp: 0, power: 0, inventory: [], fights: 0, supplies: 0, gold: 120 },
  logs: [],
};

const els = {
  viewport: document.querySelector("#worldMap"),
  map: document.querySelector("#mapContent"),
  fight: document.querySelector("#fightBtn"),
  auto: document.querySelector("#autoBtn"),
  reset: document.querySelector("#resetBtn"),
  recruit: document.querySelector("#recruitBtn"),
  playerStats: document.querySelector("#playerStats"),
  squadPanel: document.querySelector("#squadPanel"),
  tavernPanel: document.querySelector("#tavernPanel"),
  gearPanel: document.querySelector("#gearPanel"),
  inventoryHeroStrip: document.querySelector("#inventoryHeroStrip"),
  inventoryList: document.querySelector("#inventoryList"),
  inventoryDetail: document.querySelector("#inventoryDetail"),
  partyList: document.querySelector("#partyList"),
  characterGrid: document.querySelector("#characterGrid"),
  characterDetail: document.querySelector("#characterDetail"),
  modal: document.querySelector("#systemModal"),
  modalTitle: document.querySelector("#modalTitle"),
  modalClose: document.querySelector("#modalCloseBtn"),
  gearView: document.querySelector("#gearView"),
  charactersView: document.querySelector("#charactersView"),
  inventoryView: document.querySelector("#inventoryView"),
  tavernView: document.querySelector("#tavernView"),
  towerView: document.querySelector("#towerView"),
  towerPanel: document.querySelector("#towerPanel"),
  zoneName: document.querySelector("#zoneName"),
  zoneInfo: document.querySelector("#zoneInfo"),
  monsterPreview: document.querySelector("#monsterPreview"),
  dropList: document.querySelector("#dropList"),
  logList: document.querySelector("#logList"),
};

async function setup() {
  const data = await fetch("/api/game-data/summary").then((res) => res.json());
  state.equipmentSets = data.equipmentSets || [];
  load();
  normalizeState();
  recalcPlayerPower();
  renderMap();
  ensureMobs();
  ensureCollectables();
  bindEvents();
  setPatrolTarget();
  updatePan();
  render();
  requestAnimationFrame(tick);
}

function createDefaultSquad() {
  return [
    makeHeroFromTemplate(HERO_POOL[0], 9, 75),
    makeHeroFromTemplate(HERO_POOL[1], 12, 77),
    makeHeroFromTemplate(HERO_POOL[2], 15, 73),
  ];
}

function makeHeroFromTemplate(template, x, y) {
  return makeHero(template.id, template.name, template.role, template.color, x, y, template.hp, template.attack, template.defense, template.speed, template);
}

function makeHero(id, name, role, color, x, y, hp, attack, defense, speed) {
  return {
    id,
    name,
    role,
    color,
    x,
    y,
    hp,
    maxHp: hp,
    attack,
    defense,
    speed,
    rarity: arguments[10]?.rarity || "普通",
    hair: arguments[10]?.hair || "#26343c",
    skin: arguments[10]?.skin || "#e0b184",
    accent: arguments[10]?.accent || color,
    cooldown: 0,
    skillCooldown: randomRange([1.5, 3.5]),
    defenseBuff: 0,
    defenseBuffTimer: 0,
    reviveTimer: 0,
    targetMobId: null,
    targetLootId: null,
    targetCollectId: null,
    equipment: {},
    power: 0,
    attackAnim: 0,
    attackLungeX: 0,
    attackLungeY: 0,
    powerPop: null,
  };
}

function bindEvents() {
  els.fight.addEventListener("click", toggleRunning);
  els.auto.addEventListener("click", toggleSpeed);
  els.reset.addEventListener("click", reset);
  els.recruit.addEventListener("click", recruitHero);
  els.squadPanel.addEventListener("click", handleSquadClick);
  if (els.partyList) els.partyList.addEventListener("click", handleCharactersClick);
  if (els.characterGrid) els.characterGrid.addEventListener("click", handleCharactersClick);
  if (els.characterDetail) els.characterDetail.addEventListener("click", handleCharactersClick);
  els.gearPanel.addEventListener("click", handleGearClick);
  if (els.inventoryHeroStrip) els.inventoryHeroStrip.addEventListener("click", handleGearClick);
  els.inventoryList.addEventListener("click", handleInventoryClick);
  if (els.inventoryDetail) els.inventoryDetail.addEventListener("click", handleInventoryClick);
  els.tavernPanel.addEventListener("click", handleTavernClick);
  if (els.towerPanel) els.towerPanel.addEventListener("click", handleTowerClick);
  document.querySelectorAll("[data-open-panel]").forEach((button) => {
    button.addEventListener("click", () => openPanel(button.dataset.openPanel));
  });
  els.modalClose.addEventListener("click", closePanel);
  els.modal.addEventListener("click", (event) => {
    if (event.target === els.modal) closePanel();
  });

  els.viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    const rect = els.viewport.getBoundingClientRect();
    const before = screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
    const nextZoom = clamp(state.zoom * (event.deltaY > 0 ? 0.9 : 1.1), 0.55, 1.65);
    state.zoom = nextZoom;
    state.pan.x = event.clientX - rect.left - before.x * state.zoom / 100 * MAP_SIZE.width;
    state.pan.y = event.clientY - rect.top - before.y * state.zoom / 100 * MAP_SIZE.height;
    clampPan();
    updatePan();
    save();
  }, { passive: false });

  els.viewport.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    if (event.target.closest(".zone")) return;
    els.viewport.setPointerCapture(event.pointerId);
    state.dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, panX: state.pan.x, panY: state.pan.y };
    els.viewport.classList.add("dragging");
  });
  els.viewport.addEventListener("pointermove", (event) => {
    if (!state.dragging || state.dragging.id !== event.pointerId) return;
    state.pan.x = state.dragging.panX + event.clientX - state.dragging.x;
    state.pan.y = state.dragging.panY + event.clientY - state.dragging.y;
    clampPan();
    updatePan();
  });
  els.viewport.addEventListener("pointerup", stopDrag);
  els.viewport.addEventListener("pointercancel", stopDrag);
}

function stopDrag(event) {
  if (!state.dragging || state.dragging.id !== event.pointerId) return;
  state.dragging = null;
  els.viewport.classList.remove("dragging");
  save();
}

function renderMap() {
  for (const zone of ZONES) {
    const node = document.createElement("button");
    node.className = "zone";
    node.dataset.zone = zone.id;
    node.style.left = `${zone.map.x}%`;
    node.style.top = `${zone.map.y}%`;
    node.style.setProperty("--monster", zone.map.color);
    node.innerHTML = `<strong>${zone.name}</strong><span>推荐 Lv.${zone.recommendedLevel}</span><span>战力 ${zone.recommendedPower}</span><div class="monster-icon"></div>`;
    node.addEventListener("click", () => {
      state.selectedZoneId = zone.id;
      state.phase = "patrol";
      state.activeGroupId = null;
      clearHeroTargets();
      setPatrolTarget();
      save();
      render();
    });
    els.map.appendChild(node);
  }
}

function toggleRunning() {
  state.running = !state.running;
  syncFightButton();
  if (state.running && !state.patrolTarget) setPatrolTarget();
  render();
}

function syncFightButton() {
  els.fight.textContent = state.running ? "暂停巡逻" : "开始巡逻";
}

function toggleSpeed() {
  state.speedMode = state.speedMode === 1 ? 2 : state.speedMode === 2 ? 4 : 1;
  els.auto.textContent = `加速 x${state.speedMode}`;
}

function tick(now) {
  const delta = Math.min((now - state.lastFrame) / 1000, 0.05) || 0;
  state.lastFrame = now;
  if (state.running) {
    for (let i = 0; i < state.speedMode; i += 1) updateWorld(delta);
    renderActors();
    renderSquad();
    renderPlayer();
    syncFightButton();
  }
  requestAnimationFrame(tick);
}

function updateWorld(delta) {
  ensureMobs();
  ensureCollectables();
  updateCommonTimers(delta);

  if (state.phase === "patrol") updatePatrol(delta);
  if (state.phase === "combat") updateCombat(delta);
  if (state.phase === "loot") updateLootPhase(delta);

  updateMobs(delta);
  updateLootPickup();
  updateCollectablePickup();
  updateFloaters(delta);
  updateEffects(delta);
}

function updateCommonTimers(delta) {
  for (const hero of state.squad) {
    hero.attackAnim = Math.max(0, hero.attackAnim - delta);
    if (hero.attackAnim <= 0) {
      hero.attackLungeX = 0;
      hero.attackLungeY = 0;
    }
    hero.cooldown = Math.max(0, hero.cooldown - delta);
    hero.skillCooldown = Math.max(0, (hero.skillCooldown || 0) - delta);
    hero.defenseBuffTimer = Math.max(0, (hero.defenseBuffTimer || 0) - delta);
    if (hero.defenseBuffTimer <= 0) hero.defenseBuff = 0;
    hero.bardBuffTimer = Math.max(0, (hero.bardBuffTimer || 0) - delta);
    hero.bloodrageTimer = Math.max(0, (hero.bloodrageTimer || 0) - delta);
    hero.shieldTimer = Math.max(0, (hero.shieldTimer || 0) - delta);
    if (hero.shieldTimer <= 0) hero.shield = 0;
    if (hero.powerPop) {
      hero.powerPop.life -= delta;
      if (hero.powerPop.life <= 0) hero.powerPop = null;
    }
    if (hero.hp <= 0) {
      hero.reviveTimer -= delta;
      if (hero.reviveTimer <= 0) reviveHero(hero);
    }
  }
}

function updatePatrol(delta) {
  const alive = aliveHeroes();
  if (!alive.length) return;
  if (!state.patrolTarget || squadCenterDistance(state.patrolTarget) < 3.5) {
    setPatrolTarget();
  }

  const nearbyCollect = nearestCollectable(squadCenter(), 8);
  const encounter = nearestPassiveGroupInSelectedZone(9);
  if (encounter && squadCenterDistance(encounter) < 8.5) {
    beginEncounter(encounter.groupId);
    return;
  }

  alive.forEach((hero, index) => {
    const collect = nearbyCollect && index === 2 ? nearbyCollect : null;
    const offset = FORMATION[index] || { x: 0, y: 0 };
    const target = collect || { x: state.patrolTarget.x + offset.x, y: state.patrolTarget.y + offset.y };
    moveToward(hero, target, hero.speed * 0.62, delta);
  });
}

function updateCombat(delta) {
  const group = activeGroupMobs();
  if (!group.length) {
    if (state.tower.active) completeTowerFloor();
    state.phase = "loot";
    state.phaseTimer = 1.1;
    clearHeroTargets();
    addLog("这一波战斗结束，小队开始收拾掉落。");
    return;
  }

  const alive = aliveHeroes();
  if (!alive.length) {
    if (state.tower.active) failTowerFloor();
    return;
  }
  alive.forEach((hero, index) => {
    let mob = group.find((item) => item.id === hero.targetMobId && item.hp > 0);
    if (!mob) {
      mob = group.sort((a, b) => distance(hero, a) - distance(hero, b))[index % group.length];
      hero.targetMobId = mob?.id || null;
    }
    if (!mob) return;
    const role = normalizeRole(hero.role);
    const range = role === "游侠" ? 7.2 : ["法师", "牧师", "术士", "吟游诗人"].includes(role) ? 6.4 : 3.1;
    const offset = FORMATION[index] || { x: 0, y: 0 };
    const standPoint = { x: mob.x - 1.4 + offset.x * 0.45, y: mob.y + offset.y * 0.4 };
    if (distance(hero, mob) > range) {
      moveToward(hero, standPoint, hero.speed * 0.72, delta);
    } else if ((hero.skillCooldown || 0) <= 0) {
      castHeroSkill(hero, group, mob);
    } else if (hero.cooldown <= 0) {
      heroAttack(hero, mob);
    }
  });
}

function updateLootPhase(delta) {
  const alive = aliveHeroes();
  const availableLoot = state.loot.filter((item) => getZoneByPoint(item)?.id === state.selectedZoneId);
  if (availableLoot.length) {
    alive.forEach((hero) => {
      const loot = nearestItem(hero, availableLoot);
      if (loot) moveToward(hero, loot, hero.speed * 0.68, delta);
    });
    return;
  }
  state.phaseTimer -= delta;
  if (state.phaseTimer <= 0) {
    state.phase = "patrol";
    state.activeGroupId = null;
    setPatrolTarget();
    addLog("东西捡完，队伍继续巡逻。");
  }
}

function updateMobs(delta) {
  for (const mob of state.mobs) {
    mob.cooldown = Math.max(0, mob.cooldown - delta);
    mob.hitTimer = Math.max(0, mob.hitTimer - delta);
    mob.markTimer = Math.max(0, (mob.markTimer || 0) - delta);
    if (mob.markTimer <= 0) mob.markStacks = 0;
    mob.curseTimer = Math.max(0, (mob.curseTimer || 0) - delta);
    mob.poisonTimer = Math.max(0, (mob.poisonTimer || 0) - delta);
    if (mob.poisonTimer > 0) {
      mob.poisonTick = (mob.poisonTick || 0) + delta;
      if (mob.poisonTick >= 0.55) {
        mob.poisonTick = 0;
        const poison = Math.max(2, Math.round(mob.poisonDamage || 3));
        mob.hp -= poison;
        mob.hitTimer = Math.max(mob.hitTimer, 0.14);
        addFloater(mob.x + randomRange([-0.4, 0.4]), mob.y - 3.1, `毒 ${poison}`, "#a783ee");
        if (mob.hp <= 0) {
          killMob(mob);
          continue;
        }
      }
    }
    if (!mob.aggroTargetId) continue;
    const hero = state.squad.find((item) => item.id === mob.aggroTargetId && item.hp > 0);
    if (!hero) {
      mob.aggroTargetId = null;
      continue;
    }
    if (distance(mob, hero) > 2.8) {
      moveToward(mob, hero, mob.speed, delta);
    } else if (mob.cooldown <= 0) {
      mobAttack(mob, hero);
    }
  }
}

function beginEncounter(groupId) {
  state.phase = "combat";
  state.activeGroupId = groupId;
  clearHeroTargets();
  const count = activeGroupMobs().length;
  addLog(`遭遇一组敌人（${count}个），小队展开攻击。`);
}

function heroAttack(hero, mob) {
  const stats = hero.finalStats || computeHeroStats(hero);
  const role = normalizeRole(hero.role);
  const elementDamage = stats.fireDamage * (1 + stats.fireDamageAmp) + stats.poisonDamage * 0.75 + stats.lightningDamage * (1 + stats.lightningChainChance) + stats.iceDamage * 0.65 + stats.arcaneDamage;
  const isCaster = ["法师", "牧师", "术士", "吟游诗人"].includes(role);
  const crit = Math.random() < (isCaster ? stats.spellCritChance : stats.critChance);
  const markBonus = (mob.markStacks || 0) * (0.08 + stats.markPower);
  const curseBonus = mob.curseTimer > 0 ? (0.12 + stats.vulnerabilityAmp) : 0;
  const missingHp = clamp(1 - hero.hp / hero.maxHp, 0, 0.65);
  const rageBonus = role === "狂战士" ? missingHp * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45) : 0;
  const bloodWindowDamage = role === "狂战士" && hero.bloodrageTimer > 0
    ? stats.attack * (BERSERKER_RATIOS.blood ?? 0.45) * (1 + missingHp * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45))
    : 0;
  const baseDamage = stats.attack * 0.72 + stats.magicPower * 0.28 + elementDamage * 0.32 + randomInt(-2, 3) - mob.defense * (0.52 - Math.min(0.22, stats.resistShred));
  let damage = Math.max(3, Math.round((baseDamage + bloodWindowDamage) * (1 + markBonus + curseBonus + rageBonus) * (crit ? 1.5 + stats.critDamage : 1)));
  if (role === "游侠") {
    mob.markStacks = Math.min(5, (mob.markStacks || 0) + 1);
    mob.markTimer = 5;
  }
  mob.hp -= damage;
  mob.hitTimer = 0.18;
  mob.aggroTargetId = hero.id;
  hero.attackAnim = 0.52;
  const dx = mob.x - hero.x;
  const dy = mob.y - hero.y;
  const len = Math.hypot(dx, dy) || 1;
  hero.attackLungeX = dx / len;
  hero.attackLungeY = dy / len;
  const bardSpeed = hero.bardBuffTimer > 0 ? 0.22 + (hero.bardBuffPower || 0) : 0;
  const rageSpeed = role === "狂战士" && hero.bloodrageTimer > 0
    ? (BERSERKER_MODEL.hasteMultiplier ?? 1.4) - 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0)
    : 0;
  hero.cooldown = Math.max(0.34, (isCaster ? 0.96 : role === "骑士" ? 0.9 : 0.74) / (1 + stats.attackSpeed + bardSpeed + rageSpeed));
  addFloater(mob.x, mob.y - 2.8, crit ? `暴 ${damage}` : `-${damage}`, crit ? "#ef6f6c" : "#ffd27a");
  if (stats.lifeSteal > 0 && damage > 0) {
    hero.hp = Math.min(hero.maxHp, hero.hp + Math.round(damage * stats.lifeSteal));
  }
  if (role === "战士") {
    const group = activeGroupMobs().filter((item) => item.id !== mob.id && distance(item, mob) < 4.6).slice(0, 1);
    for (const side of group) {
      const cleave = Math.max(2, Math.round(damage * 0.42));
      side.hp -= cleave;
      side.hitTimer = 0.16;
      side.aggroTargetId = hero.id;
      addFloater(side.x, side.y - 3, `溅 ${cleave}`, "#ffd27a");
      if (side.hp <= 0) killMob(side);
    }
  }
  if (mob.hp <= 0) killMob(mob);
}

function castHeroSkill(hero, group, target) {
  const stats = hero.finalStats || computeHeroStats(hero);
  const role = normalizeRole(hero.role);
  const cooldownScale = 1 - Math.min(0.38, stats.cooldownReduction);
  hero.attackAnim = 0.58;
  if (role === "骑士") {
    for (const ally of aliveHeroes()) {
      ally.defenseBuff = 8 + stats.defense * 0.35;
      ally.defenseBuffTimer = 4;
      ally.shield = Math.max(ally.shield || 0, Math.round(12 + stats.shieldPower * 0.8));
      ally.shieldTimer = 4;
    }
    for (const mob of group.slice(0, 5)) mob.aggroTargetId = hero.id;
    hero.skillCooldown = 8.5 * cooldownScale;
    addEffect(hero.x, hero.y, "shield", "#6ce0c5", "守");
    addFloater(hero.x, hero.y - 4, "嘲讽守护", "#6ce0c5");
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}举盾嘲讽，敌人转火，队伍进入抗压窗口。`);
    return;
  }
  if (role === "牧师") {
    const ally = aliveHeroes().sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    const heal = Math.round(35 + stats.magicPower * 0.55 + stats.healPower * 0.9);
    ally.hp = Math.min(ally.maxHp, ally.hp + heal);
    ally.shield = Math.max(ally.shield || 0, Math.round(8 + stats.shieldPower * 0.55));
    ally.shieldTimer = 3.2;
    hero.skillCooldown = 7.5 * cooldownScale;
    addEffect(ally.x, ally.y, "heal", "#6ce0c5", "+");
    addFloater(ally.x, ally.y - 4, `+${heal}`, "#6ce0c5");
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}治疗${ally.name}，续航节奏被拉长。`);
    return;
  }
  if (role === "法师") {
    const damage = Math.round(18 + stats.magicPower * 0.85 + stats.fireDamage * (1 + stats.fireDamageAmp) + stats.arcaneDamage * 0.7);
    addEffect(target.x, target.y, "fire", "#ef6f6c", "炎");
    for (const mob of group.slice(0, 4)) {
      mob.hp -= damage;
      mob.hitTimer = 0.24;
      mob.aggroTargetId = hero.id;
      addFloater(mob.x, mob.y - 3, `炎 ${damage}`, "#ef6f6c");
      if (mob.hp <= 0) killMob(mob);
    }
    hero.skillCooldown = 6.8 * cooldownScale;
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}释放范围法术，清怪速度出现爆发点。`);
    return;
  }
  if (role === "游侠") {
    target.markStacks = Math.min(6, (target.markStacks || 0) + 2);
    target.markTimer = 6;
    const damage = Math.round(24 + stats.attack * 1.25 + stats.lightningDamage * 0.9 + stats.markPower * 80);
    target.hp -= damage;
    target.hitTimer = 0.28;
    target.aggroTargetId = hero.id;
    hero.skillCooldown = 5.4 * cooldownScale;
    addEffect(target.x, target.y, "mark", "#d68cff", `×${target.markStacks}`);
    addFloater(target.x, target.y - 3, `标 ${damage}`, "#d68cff");
    if (target.hp <= 0) killMob(target);
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}标记${target.name}，后续点杀伤害开始滚动。`);
    return;
  }
  if (role === "狂战士") {
    hero.bloodrageTimer = BERSERKER_DURATIONS.bloodFury ?? 4;
    hero.skillCooldown = (BERSERKER_COOLDOWNS.bloodStrike ?? 5.2) * cooldownScale;
    addEffect(hero.x, hero.y, "rage", "#ef6f6c", "怒");
    addFloater(hero.x, hero.y - 4, "血怒普攻", "#ef6f6c");
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}进入血怒，低血线时输出窗口更明显。`);
    return;
  }
  if (role === "吟游诗人") {
    const buff = 0.16 + stats.auraPower;
    for (const ally of aliveHeroes()) {
      ally.bardBuffTimer = 4.2;
      ally.bardBuffPower = buff;
      addEffect(ally.x, ally.y, "song", "#d7b65d", "♪", 0.9);
    }
    hero.skillCooldown = 8.2 * cooldownScale;
    addFloater(hero.x, hero.y - 4, "战歌", "#d7b65d");
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}奏响战歌，全队攻速窗口打开。`);
    return;
  }
  if (role === "术士") {
    const damage = Math.round(10 + stats.magicPower * 0.45 + stats.poisonDamage * 0.9);
    for (const mob of group.slice(0, 4)) {
      mob.curseTimer = 5.8;
      mob.poisonTimer = 4.4 * (1 + stats.poisonDurationAmp);
      mob.poisonDamage = Math.max(3, damage * 0.32);
      mob.aggroTargetId = hero.id;
      mob.hp -= damage;
      mob.hitTimer = 0.22;
      addFloater(mob.x, mob.y - 3, `咒 ${damage}`, "#a783ee");
      if (mob.hp <= 0) killMob(mob);
    }
    hero.skillCooldown = 7.1 * cooldownScale;
    addEffect(target.x, target.y, "curse", "#a783ee", "咒");
    addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}铺开诅咒，敌人持续掉血并变脆。`);
    return;
  }
  const damage = Math.round(16 + stats.attack * 0.95);
  addEffect(target.x, target.y, "slash", "#ffd27a", "斩");
  for (const mob of group.slice(0, 2)) {
    mob.hp -= damage;
    mob.hitTimer = 0.22;
    mob.aggroTargetId = hero.id;
    addFloater(mob.x, mob.y - 3, `斩 ${damage}`, "#ffd27a");
    if (mob.hp <= 0) killMob(mob);
  }
  hero.skillCooldown = 6.2 * cooldownScale;
  addLog(`[SKILL_BREAKPOINT 技能断点] ${hero.name}顺劈，近战清怪速度出现小爆发。`);
}

function mobAttack(mob, hero) {
  const stats = hero.finalStats || computeHeroStats(hero);
  const mitigation = (stats.defense + (hero.defenseBuff || 0)) * 0.35 + stats.magicResist * 0.08;
  const blocked = Math.random() < stats.blockChance;
  let damage = Math.max(2, Math.round((mob.attack + randomInt(-2, 3) - mitigation) * (blocked ? 0.45 : 1)));
  if (hero.shield > 0) {
    const absorbed = Math.min(hero.shield, damage);
    hero.shield -= absorbed;
    damage -= absorbed;
    addFloater(hero.x + 0.5, hero.y - 4.2, `盾 ${absorbed}`, "#6ce0c5");
  }
  hero.hp -= damage;
  mob.cooldown = 1.1 + Math.random() * 0.55;
  addFloater(hero.x, hero.y - 3, blocked ? `格 ${damage}` : `-${damage}`, blocked ? "#ffd27a" : "#ef6f6c");
  if (hero.hp <= 0) {
    hero.hp = 0;
    hero.reviveTimer = 5.5;
    hero.targetMobId = null;
    hero.targetLootId = null;
    addLog(`${hero.name}倒下休息，几秒后会回到战场。`);
  }
}

function killMob(mob) {
  const zone = ZONES.find((item) => item.id === mob.zoneId);
  state.mobs = state.mobs.filter((item) => item.id !== mob.id);
  state.player.fights += 1;
  if (mob.tower) {
    addFloater(mob.x, mob.y - 4, "塔卫倒下", "#d7b65d");
    for (const hero of state.squad) if (hero.targetMobId === mob.id) hero.targetMobId = null;
    return;
  }
  const exp = Math.round(randomRange(zone.expReward));
  const gold = randomInt(6, 13) + zone.recommendedLevel;
  state.player.gold += gold;
  gainExp(exp);
  const dropCount = Math.random() < 0.22 ? 2 : 1;
  const drops = [];
  for (let i = 0; i < dropCount; i += 1) {
    const drop = createDrop(zone);
    drops.push(drop);
    state.loot.push({
      id: state.lootId++,
      x: mob.x + randomRange([-1.6, 1.6]),
      y: mob.y + randomRange([-1.2, 1.2]),
      drop,
    });
  }
  addFloater(mob.x, mob.y - 4, `+${gold}金`, "#d7b65d");
  addLog(`击败 ${mob.name}，掉出了 ${dropCount} 个装备球。`);
  addLog(`[DROP_BREAKPOINT 掉落断点] ${zone.name} / ${mob.name} -> ${drops.map(formatDropName).join("、")}。`);
  for (const hero of state.squad) if (hero.targetMobId === mob.id) hero.targetMobId = null;
}

function updateLootPickup() {
  for (const loot of [...state.loot]) {
    const hero = aliveHeroes().find((item) => distance(item, loot) < 2.3);
    if (hero) collectLoot(hero, loot);
  }
}

function updateCollectablePickup() {
  for (const item of [...state.collectables]) {
    const hero = aliveHeroes().find((unit) => distance(unit, item) < 2.1);
    if (!hero) continue;
    state.collectables = state.collectables.filter((collectable) => collectable.id !== item.id);
    const exp = item.kind === "herb" ? 8 : 14;
    const gold = item.kind === "herb" ? 4 : 8;
    state.player.supplies += 1;
    state.player.gold += gold;
    gainExp(exp);
    addFloater(item.x, item.y - 2, `+${gold}金`, "#d7b65d");
    addLog(`${hero.name}收集了${item.name}，获得少量经验。`);
  }
}

function collectLoot(hero, loot) {
  const powerBefore = state.player.power;
  state.loot = state.loot.filter((item) => item.id !== loot.id);
  addInventoryItem(loot.drop);
  const { receiver, gain } = equipBestCandidate(loot.drop);
  recalcPlayerPower();
  const teamGain = state.player.power - powerBefore;
  if (receiver && gain > 0) {
    receiver.powerPop = { text: `+${gain}`, life: 0.8 };
    addFloater(receiver.x, receiver.y - 4.5, `战力 +${gain}`, "#6ce0c5");
    addLog(`${receiver.name}装备 ${formatDropName(loot.drop)}，战力 +${gain}。`);
    addLog(`[GROWTH_BREAKPOINT 成长断点] 队伍战力 ${powerBefore} -> ${state.player.power}，本次 +${teamGain}。`);
  } else {
    addLog(`${hero.name}捡到 ${formatDropName(loot.drop)}，暂时没有替换。`);
    addLog(`[GROWTH_BREAKPOINT 成长断点] 无替换，队伍战力保持 ${state.player.power}。`);
  }
  save();
  render();
}

function recruitHero() {
  const cost = 60;
  if (state.player.gold < cost) {
    addLog("金币不足，先去巡逻刷怪和收集资源。");
    renderLogs();
    return;
  }
  state.player.gold -= cost;
  const template = rollHeroTemplate();
  const recruit = makeHeroFromTemplate(template, squadCenter().x + randomRange([-2, 2]), squadCenter().y + randomRange([-2, 2]));
  recruit.id = `${template.id}_${Date.now().toString(36)}`;
  recalcHeroPower(recruit);
  state.lastRecruit = recruit;
  state.roster.unshift(recruit);
  state.roster = state.roster.slice(0, 12);
  addLog(`酒馆招募到 ${recruit.rarity} ${recruit.name}。`);
  save();
  render();
}

function rollHeroTemplate() {
  const value = Math.random();
  const pool = value > 0.9 ? HERO_POOL.filter((hero) => hero.rarity === "传说") : value > 0.62 ? HERO_POOL.filter((hero) => hero.rarity === "史诗") : value > 0.28 ? HERO_POOL.filter((hero) => hero.rarity === "稀有") : HERO_POOL.filter((hero) => hero.rarity === "普通");
  return pick(pool.length ? pool : HERO_POOL);
}

function handleSquadClick(event) {
  const card = event.target.closest("[data-hero-id]");
  if (!card) return;
  state.selectedHeroId = card.dataset.heroId;
  render();
  save();
  openPanel("gear");
}

function handleGearClick(event) {
  const card = event.target.closest("[data-hero-id]");
  if (!card) return;
  state.selectedHeroId = card.dataset.heroId;
  renderGear();
  renderInventory();
  save();
}

function handleInventoryClick(event) {
  const slot = event.target.closest("[data-inventory-id]");
  if (slot) {
    state.selectedInventoryId = slot.dataset.inventoryId;
    renderInventory();
    save();
    return;
  }
  const button = event.target.closest("[data-equip-id]");
  if (!button) return;
  const drop = state.player.inventory.find((item) => item.id === button.dataset.equipId);
  const hero = selectedHero();
  if (!drop || !hero) return;
  const oldPower = hero.power;
  const teamBefore = state.player.power;
  hero.equipment[drop.slot] = drop;
  recalcHeroPower(hero);
  recalcPlayerPower();
  sortAndTrimInventory();
  const gain = hero.power - oldPower;
  hero.powerPop = { text: gain >= 0 ? `+${gain}` : `${gain}`, life: 0.8 };
  addLog(`${hero.name}换上 ${formatDropName(drop)}，战力${gain >= 0 ? "+" : ""}${gain}。`);
  addLog(`[GROWTH_BREAKPOINT 成长断点] 手动换装后队伍战力 ${teamBefore} -> ${state.player.power}。`);
  save();
  render();
}

function handleCharactersClick(event) {
  const card = event.target.closest("[data-character-id]");
  if (card) {
    state.selectedHeroId = card.dataset.characterId;
    renderCharacters();
    renderGear();
    renderInventory();
    save();
    return;
  }
  const action = event.target.closest("[data-character-action]");
  if (!action) return;
  const hero = findHeroEverywhere(action.dataset.characterId || state.selectedHeroId);
  if (!hero) return;
  if (action.dataset.characterAction === "equip") {
    state.selectedHeroId = hero.id;
    openPanel("inventory");
    return;
  }
  if (action.dataset.characterAction === "bench") {
    benchHero(hero.id);
    return;
  }
  if (action.dataset.characterAction === "join") {
    joinHero(hero.id);
  }
}

function benchHero(heroId) {
  if (state.squad.length <= 1) {
    addLog("至少保留 1 名出战角色。");
    render();
    return;
  }
  const index = state.squad.findIndex((hero) => hero.id === heroId);
  if (index < 0) return;
  const [hero] = state.squad.splice(index, 1);
  state.roster.push(hero);
  state.selectedHeroId = state.squad[0]?.id || hero.id;
  recalcPlayerPower();
  addLog(`${hero.name}离开出战队伍，进入候补。`);
  save();
  render();
}

function joinHero(heroId) {
  const index = state.roster.findIndex((hero) => hero.id === heroId);
  if (index < 0) return;
  const [hero] = state.roster.splice(index, 1);
  if (state.squad.length < 3) {
    const center = squadCenter();
    hero.x = center.x + randomRange([-2, 2]);
    hero.y = center.y + randomRange([-2, 2]);
    state.squad.push(hero);
    addLog(`${hero.name}加入出战队伍。`);
  } else {
    const replaceIndex = Math.max(0, state.squad.findIndex((item) => item.id === state.selectedHeroId));
    const old = state.squad[replaceIndex];
    hero.x = old.x;
    hero.y = old.y;
    state.squad[replaceIndex] = hero;
    state.roster.push(old);
    addLog(`${hero.name}加入出战队伍，替换了${old.name}。`);
  }
  state.selectedHeroId = hero.id;
  recalcPlayerPower();
  save();
  render();
}

function handleTavernClick(event) {
  const button = event.target.closest("[data-roster-id]");
  if (!button) return;
  joinHero(button.dataset.rosterId);
}

function handleTowerClick(event) {
  const button = event.target.closest("[data-tower-action]");
  if (!button) return;
  if (button.dataset.towerAction === "start") {
    startTowerFloor(Number(button.dataset.towerCount || 1));
    closePanel();
    render();
  }
}

function openPanel(name) {
  const titles = { gear: "装备管理", inventory: "背包", tavern: "酒馆", characters: "角色管理", tower: "试炼塔" };
  els.modalTitle.textContent = titles[name] || "界面";
  if (name === "characters") renderCharacters();
  if (name === "inventory" || name === "gear") {
    renderGear();
    renderInventory();
  }
  if (name === "tower") renderTower();
  for (const view of [els.gearView, els.charactersView, els.inventoryView, els.tavernView, els.towerView]) {
    if (!view) continue;
    view.classList.remove("active");
  }
  const target = name === "tavern" ? els.tavernView : name === "characters" ? els.charactersView : name === "tower" ? els.towerView : els.inventoryView;
  target.classList.add("active");
  els.modal.classList.add("open");
  els.modal.setAttribute("aria-hidden", "false");
}

function closePanel() {
  els.modal.classList.remove("open");
  els.modal.setAttribute("aria-hidden", "true");
}

function equipBestCandidate(drop) {
  let receiver = null;
  let bestGain = 0;
  for (const hero of state.squad) {
    const old = hero.equipment[drop.slot];
    const gain = drop.power - (old?.power || 0);
    if (gain > bestGain) {
      bestGain = gain;
      receiver = hero;
    }
  }
  if (receiver && bestGain > 0) {
    receiver.equipment[drop.slot] = drop;
    recalcHeroPower(receiver);
  }
  return { receiver, gain: bestGain };
}

function addInventoryItem(drop) {
  state.player.inventory = [drop, ...state.player.inventory.filter((item) => item.id !== drop.id)];
  sortAndTrimInventory();
}

function sortAndTrimInventory(limit = 90) {
  const equippedIds = equippedItemIds();
  state.player.inventory.sort((a, b) => {
    const equipDelta = Number(equippedIds.has(b.id)) - Number(equippedIds.has(a.id));
    if (equipDelta) return equipDelta;
    return equipmentScore(b) - equipmentScore(a);
  });
  const protectedItems = state.player.inventory.filter((item) => equippedIds.has(item.id));
  const looseItems = state.player.inventory.filter((item) => !equippedIds.has(item.id)).slice(0, Math.max(0, limit - protectedItems.length));
  state.player.inventory = [...protectedItems, ...looseItems].sort((a, b) => equipmentScore(b) - equipmentScore(a));
  if (state.selectedInventoryId && !state.player.inventory.some((item) => item.id === state.selectedInventoryId)) {
    state.selectedInventoryId = state.player.inventory[0]?.id || null;
  }
}

function equipmentScore(item) {
  normalizeDrop(item);
  return (RARITY_RANK[item.rarity] || 0) * 1_000_000 + item.power * 1000 + item.tier * 100 + item.level;
}

function equippedItemIds() {
  return new Set(state.squad.flatMap((hero) => Object.values(hero.equipment || {}).map((item) => item.id)));
}

function equippedBy(itemId) {
  return state.squad.find((hero) => Object.values(hero.equipment || {}).some((item) => item.id === itemId));
}

function normalizeDrop(item) {
  if (!item) return item;
  if (!Array.isArray(item.affixes) || !item.affixes.length) {
    const fallbackStat = (SLOT_STAT_POOLS[item.slot] || SLOT_STAT_POOLS.武器)[0];
    item.affixes = [{ stat: fallbackStat, value: rollStatValue(fallbackStat, Math.max(10, item.power || 20)) }];
  }
  item.power = estimateAffixPower(item.affixes);
  return item;
}

function estimateAffixPower(affixes) {
  return Math.round((affixes || []).reduce((sum, affix) => {
    const meta = STAT_META[affix.stat] || { weight: 3 };
    return sum + affix.value * meta.weight;
  }, 0));
}

function ensureMobs() {
  for (const zone of ZONES) {
    const groups = new Set(state.mobs.filter((mob) => mob.zoneId === zone.id).map((mob) => mob.groupId));
    const targetGroups = zone.id === state.selectedZoneId ? 2 : 1;
    for (let i = groups.size; i < targetGroups; i += 1) spawnGroup(zone);
  }
}

function spawnGroup(zone) {
  const groupId = state.groupId++;
  const existing = new Set(state.mobs.filter((mob) => mob.zoneId === zone.id).map((mob) => mob.spawnSide));
  const side = !existing.has("left") ? "left" : !existing.has("right") ? "right" : Math.random() < 0.5 ? "left" : "right";
  const sideSign = side === "left" ? -1 : 1;
  const laneY = side === "left" ? -0.45 : 0.45;
  const center = {
    x: clamp(zone.map.x + sideSign * randomRange([zone.map.radius * 0.85, zone.map.radius * 1.45]), 4, 96),
    y: clamp(zone.map.y + laneY * randomRange([zone.map.radius * 0.45, zone.map.radius * 0.95]) + randomRange([-2, 2]), 7, 93),
  };
  const count = randomInt(2, 3);
  for (let i = 0; i < count; i += 1) {
    state.mobs.push(createMob(zone, groupId, side, {
      x: center.x + (i - (count - 1) / 2) * 2.4 + randomRange([-0.7, 0.7]),
      y: center.y + randomRange([-1.8, 1.8]),
    }));
  }
}

function createMob(zone, groupId, spawnSide, point) {
  const level = randomInt(zone.enemyLevel[0], zone.enemyLevel[1]);
  const powerRatio = Math.max(0.7, zone.recommendedPower / 240);
  const maxHp = Math.round(180 + level * 42 + powerRatio * 46);
  return {
    id: state.mobId++,
    groupId,
    spawnSide,
    zoneId: zone.id,
    name: pick(zone.enemies),
    level,
    x: clamp(point.x, 4, 96),
    y: clamp(point.y, 7, 93),
    spawnX: point.x,
    spawnY: point.y,
    color: zone.map.color,
    maxHp,
    hp: maxHp,
    attack: Math.round(8 + level * 1.45 + powerRatio * 1.8),
    defense: 7 + level * 0.55 + powerRatio * 0.35,
    speed: 4.3 + Math.random() * 1.1,
    cooldown: Math.random(),
    hitTimer: 0,
    aggroTargetId: null,
  };
}

function startTowerFloor(count = 1) {
  if (state.tower.active) return;
  const zone = getZone();
  const floor = state.tower.floor || 1;
  const floors = clamp(Math.round(count) || 1, 1, 50);
  const groupId = state.groupId++;
  const center = squadCenter();
  const enemies = towerBatchEnemies(floor, floors);
  state.mobs = state.mobs.filter((mob) => !mob.tower);
  enemies.forEach((enemy, index) => {
    const angle = (index / enemies.length) * Math.PI * 2;
    const ring = 6 + Math.floor(index / 16) * 4.5;
    state.mobs.push(createTowerMob(zone, groupId, enemy, {
      x: clamp(center.x + 8 + Math.cos(angle) * ring, 4, 96),
      y: clamp(center.y + Math.sin(angle) * (ring * 0.72), 7, 93),
    }));
  });
  state.tower.active = true;
  state.tower.batch = floors;
  state.tower.banner = { type: "active", text: `第 ${floor}-${floor + floors - 1} 层挑战中：已刷出 ${enemies.length} 个塔卫，击败全部敌人即通关。` };
  state.phase = "combat";
  state.activeGroupId = groupId;
  state.running = true;
  syncFightButton();
  clearHeroTargets();
  addLog(`[TOWER_BREAKPOINT 爬塔断点] 第 ${floor}-${floor + floors - 1} 层开始，塔卫 ${enemies.length} 个，总强度 ${towerBatchPower(floor, floors)}。`);
}

function createTowerMob(zone, groupId, enemy, point) {
  const roleScale = enemy.role === "骑士" ? 1.25 : enemy.role === "牧师" ? 0.95 : enemy.role === "法师" || enemy.role === "术士" ? 0.88 : 1;
  const maxHp = Math.round(enemy.power * 0.72 * roleScale);
  return {
    id: state.mobId++,
    groupId,
    spawnSide: "tower",
    zoneId: zone.id,
    tower: true,
    role: enemy.role,
    name: enemy.name,
    level: enemy.level,
    x: point.x,
    y: point.y,
    spawnX: point.x,
    spawnY: point.y,
    color: enemy.color,
    maxHp,
    hp: maxHp,
    attack: Math.round(9 + enemy.level * 1.8 + enemy.power * 0.018),
    defense: 8 + enemy.level * 0.7 + enemy.power * 0.004,
    speed: 4.2 + enemy.level * 0.035,
    cooldown: Math.random() * 0.8,
    hitTimer: 0,
    aggroTargetId: null,
  };
}

function towerEnemyPreview(floor) {
  const roles = ["战士", "骑士", "游侠", "法师", "牧师", "术士", "狂战士", "吟游诗人"];
  const count = Math.min(6, 3 + Math.floor((floor - 1) / 5));
  const power = towerFloorPower(floor);
  return Array.from({ length: count }, (_, index) => {
    const role = roles[(floor + index * 2) % roles.length];
    const design = CLASS_DESIGNS[role] || CLASS_DESIGNS.战士;
    return {
      role,
      name: `${design.icon} 塔卫${index + 1}`,
      level: Math.max(1, floor + Math.floor(index / 2)),
      power: Math.round(power / count * randomRange([0.9, 1.12])),
      color: ["#8f5f4d", "#637c91", "#7b5ea7", "#876b42"][index % 4],
    };
  });
}

function towerBatchEnemies(startFloor, floors) {
  return Array.from({ length: floors }, (_, index) => towerEnemyPreview(startFloor + index)).flat();
}

function towerFloorPower(floor) {
  const base = 165 + floor * 42 + Math.pow(floor, 1.32) * 24;
  const pulse = floor % 10 === 0 ? 1.42 : floor % 5 === 0 ? 1.24 : floor % 3 === 0 ? 1.12 : 1;
  return Math.round(base * pulse);
}

function towerBatchPower(startFloor, floors) {
  let total = 0;
  for (let i = 0; i < floors; i += 1) total += towerFloorPower(startFloor + i);
  return total;
}

function completeTowerFloor() {
  const floor = state.tower.floor || 1;
  const floors = state.tower.batch || 1;
  const endFloor = floor + floors - 1;
  state.tower.active = false;
  state.tower.best = Math.max(state.tower.best || 0, endFloor);
  const zone = getZone();
  let gold = 0;
  let exp = 0;
  for (let i = 0; i < floors; i += 1) {
    const current = floor + i;
    gold += 28 + current * 7;
    exp += 42 + current * 18;
  }
  const dropZone = {
    ...zone,
    enemyLevel: [endFloor, endFloor + 1],
    equipmentTiers: [clamp(Math.ceil(endFloor / 2), 1, 10)],
    rarityTable: endFloor < 4
      ? { common: 0.45, rare: 0.33, epic: 0.16, legendary: 0.05, mythic: 0.01 }
      : endFloor < 8
        ? { rare: 0.32, epic: 0.34, legendary: 0.22, mythic: 0.1, wonder: 0.02 }
        : { epic: 0.26, legendary: 0.28, mythic: 0.28, wonder: 0.14, phantom: 0.04 },
  };
  state.player.gold += gold;
  gainExp(exp);
  const drop = createDrop(dropZone);
  const center = squadCenter();
  state.loot.push({
    id: state.lootId++,
    x: center.x + randomRange([-1.2, 1.2]),
    y: center.y + randomRange([-1.2, 1.2]),
    drop,
  });
  state.tower.lastReward = `第 ${floor}-${endFloor} 层通关：金币 +${gold}，经验 +${exp}，掉落 ${formatDropName(drop)}。`;
  state.tower.banner = { type: "success", text: `挑战成功：第 ${floor}-${endFloor} 层已通关，下一层强度 ${towerFloorPower(endFloor + 1)}。` };
  state.tower.floor = endFloor + 1;
  state.tower.batch = 1;
  addLog(`[TOWER_BREAKPOINT 爬塔断点] 第 ${floor}-${endFloor} 层通关，下一层强度 ${towerFloorPower(state.tower.floor)}。`);
}

function failTowerFloor() {
  const floor = state.tower.floor || 1;
  const floors = state.tower.batch || 1;
  const endFloor = floor + floors - 1;
  state.tower.active = false;
  state.tower.banner = { type: "fail", text: `挑战失败：第 ${floor}-${endFloor} 层没有打过，先去刷装备或调整阵容。` };
  state.tower.lastReward = `第 ${floor}-${endFloor} 层失败：没有奖励，塔层不会前进。`;
  state.tower.batch = 1;
  state.mobs = state.mobs.filter((mob) => !mob.tower);
  state.activeGroupId = null;
  state.phase = "patrol";
  state.running = false;
  syncFightButton();
  clearHeroTargets();
  setPatrolTarget();
  addLog(`[TOWER_BREAKPOINT 爬塔断点] 第 ${floor} 层挑战失败，小队需要补强。`);
}

function ensureCollectables() {
  const zone = getZone();
  const selectedCount = state.collectables.filter((item) => item.zoneId === zone.id).length;
  for (let i = selectedCount; i < 8; i += 1) {
    const kind = Math.random() < 0.65 ? "herb" : "crystal";
    const angle = Math.random() * Math.PI * 2;
    const radius = randomRange([zone.map.radius * 0.4, zone.map.radius * 1.5]);
    state.collectables.push({
      id: state.collectId++,
      zoneId: zone.id,
      kind,
      name: kind === "herb" ? "草药" : "晶簇",
      x: clamp(zone.map.x + Math.cos(angle) * radius, 4, 96),
      y: clamp(zone.map.y + Math.sin(angle) * radius, 7, 93),
    });
  }
}

function createDrop(zone) {
  const tier = pick(zone.equipmentTiers);
  const set = pick(state.equipmentSets.filter((item) => item.tier === tier)) || { id: "wild", name: "野外", tier };
  const rarity = rollRarity(zone.rarityTable);
  const level = randomInt(zone.enemyLevel[0], zone.enemyLevel[1]);
  const slot = pick(SLOTS);
  const roll = Number((0.85 + Math.random() * 0.3).toFixed(2));
  const affixes = createAffixes(slot, tier, level, rarity, roll);
  const power = estimateAffixPower(affixes);
  return { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, setId: set.id, setName: set.name, tier, rarity: rarity.id, rarityName: rarity.name, rarityColor: rarity.color, level, slot, roll, power, affixes };
}

function createAffixes(slot, tier, level, rarity, roll) {
  const pool = [...(SLOT_STAT_POOLS[slot] || SLOT_STAT_POOLS.武器)];
  const count = RARITY_AFFIX_COUNT[rarity.id] || 1;
  const baseBudget = (8 + tier * 9 + level * 5) * rarity.multiplier * roll;
  const selected = [];
  for (let i = 0; i < count && pool.length; i += 1) {
    const stat = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const share = baseBudget * randomRange([0.85, 1.18]);
    selected.push({ stat, value: rollStatValue(stat, share) });
  }
  return selected;
}

function rollStatValue(stat, budget) {
  if (STAT_META[stat]?.percent) {
    return Number(clamp(budget / 950, 0.01, 0.42).toFixed(3));
  }
  return Math.max(1, Math.round(budget / (STAT_META[stat]?.weight || 3)));
}

function recalcHeroPower(hero) {
  const stats = computeHeroStats(hero);
  hero.finalStats = stats;
  hero.power = heroPowerFromStats(stats);
}

function heroPowerFromStats(stats) {
  return Math.round(stats.hp * 0.22 + stats.attack * 5.2 + stats.defense * 31 + stats.magicPower * 4.8 + stats.magicResist * 16 + stats.attackSpeed * 260 + stats.critChance * 280 + stats.spellCritChance * 260 + stats.healPower * 4 + stats.lifeSteal * 420 + stats.blockChance * 380 + stats.cooldownReduction * 360 + stats.markPower * 300 + stats.auraPower * 310 + stats.resistShred * 330 + stats.vulnerabilityAmp * 300);
}

function previewEquipPowerDelta(hero, item) {
  const currentPower = hero.power || heroPowerFromStats(hero.finalStats || computeHeroStats(hero));
  const previewHero = { ...hero, equipment: { ...(hero.equipment || {}), [item.slot]: item } };
  return heroPowerFromStats(computeHeroStats(previewHero)) - currentPower;
}

function computeHeroStats(hero) {
  const role = normalizeRole(hero.role);
  const stats = {
    hp: hero.maxHp,
    attack: hero.attack,
    defense: hero.defense,
    magicPower: ["法师", "牧师", "术士", "吟游诗人"].includes(role) ? hero.attack : 0,
    magicResist: 0,
    attackSpeed: 0,
    moveSpeed: hero.speed,
    critChance: 0.05,
    spellCritChance: 0.04,
    critDamage: 0.5,
    fireDamage: 0,
    poisonDamage: 0,
    lightningDamage: 0,
    iceDamage: 0,
    arcaneDamage: 0,
    fireDamageAmp: 0,
    poisonDurationAmp: 0,
    lightningChainChance: 0,
    healPower: 0,
    cooldownReduction: 0,
    lifeSteal: 0,
    blockChance: 0,
    regen: 0,
    shieldPower: 0,
    resistShred: 0,
    vulnerabilityAmp: 0,
    markPower: 0,
    auraPower: 0,
  };
  for (const item of Object.values(hero.equipment || {})) {
    normalizeDrop(item);
    for (const affix of item.affixes) {
      stats[affix.stat] = (stats[affix.stat] || 0) + affix.value;
    }
  }
  return stats;
}

function recalcPlayerPower() {
  for (const hero of state.squad) recalcHeroPower(hero);
  recalcRosterPower();
  state.player.power = state.squad.reduce((sum, hero) => sum + hero.power, 0);
}

function recalcRosterPower() {
  for (const hero of state.roster || []) recalcHeroPower(hero);
}

function gainExp(amount) {
  state.player.exp += amount;
  while (state.player.exp >= nextLevelExp(state.player.level)) {
    state.player.exp -= nextLevelExp(state.player.level);
    state.player.level += 1;
    for (const hero of state.squad) {
      hero.maxHp += 18;
      hero.hp = hero.maxHp;
      hero.attack += 3;
      hero.defense += 0.12;
      recalcHeroPower(hero);
    }
    addLog(`队伍升到 Lv.${state.player.level}，三名角色基础属性提升。`);
  }
  recalcPlayerPower();
}

function reviveHero(hero) {
  const center = squadCenter();
  hero.hp = hero.maxHp;
  hero.x = center.x + randomRange([-3, 3]);
  hero.y = center.y + randomRange([2, 5]);
  addFloater(hero.x, hero.y - 4, "复活", "#6ce0c5");
}

function setPatrolTarget() {
  const zone = getZone();
  const angle = Math.random() * Math.PI * 2;
  const radius = randomRange([zone.map.radius * 0.45, zone.map.radius * 1.55]);
  state.patrolTarget = {
    x: clamp(zone.map.x + Math.cos(angle) * radius, 4, 96),
    y: clamp(zone.map.y + Math.sin(angle) * radius, 7, 93),
  };
}

function nearestPassiveGroupInSelectedZone(maxDistance) {
  const center = squadCenter();
  const groups = new Map();
  for (const mob of state.mobs) {
    if (mob.zoneId !== state.selectedZoneId || mob.hp <= 0 || mob.aggroTargetId) continue;
    if (!groups.has(mob.groupId)) groups.set(mob.groupId, { groupId: mob.groupId, x: 0, y: 0, count: 0 });
    const group = groups.get(mob.groupId);
    group.x += mob.x;
    group.y += mob.y;
    group.count += 1;
  }
  const candidates = [...groups.values()].map((group) => ({ ...group, x: group.x / group.count, y: group.y / group.count }));
  return candidates.filter((group) => distance(center, group) <= maxDistance).sort((a, b) => distance(center, a) - distance(center, b))[0];
}

function activeGroupMobs() {
  return state.mobs.filter((mob) => mob.groupId === state.activeGroupId && mob.hp > 0);
}

function clearHeroTargets() {
  for (const hero of state.squad) {
    hero.targetMobId = null;
    hero.targetLootId = null;
    hero.targetCollectId = null;
  }
}

function aliveHeroes() {
  return state.squad.filter((hero) => hero.hp > 0);
}

function squadCenter() {
  const alive = aliveHeroes();
  const list = alive.length ? alive : state.squad;
  return {
    x: list.reduce((sum, hero) => sum + hero.x, 0) / list.length,
    y: list.reduce((sum, hero) => sum + hero.y, 0) / list.length,
  };
}

function squadCenterDistance(target) {
  return distance(squadCenter(), target);
}

function nearestCollectable(origin, maxDistance) {
  const selected = state.collectables.filter((item) => item.zoneId === state.selectedZoneId);
  const item = nearestItem(origin, selected);
  return item && distance(origin, item) <= maxDistance ? item : null;
}

function nearestItem(origin, items) {
  return items.slice().sort((a, b) => distance(origin, a) - distance(origin, b))[0];
}

function moveToward(actor, target, speed, delta) {
  const dx = target.x - actor.x;
  const dy = target.y - actor.y;
  const len = Math.hypot(dx, dy);
  if (len < 0.01) return;
  const step = Math.min(len, speed * delta);
  actor.x += (dx / len) * step;
  actor.y += (dy / len) * step;
}

function updateFloaters(delta) {
  for (const item of state.floaters) {
    item.life -= delta;
    item.y -= delta * 5.5;
  }
  state.floaters = state.floaters.filter((item) => item.life > 0);
}

function addFloater(x, y, text, color) {
  state.floaters.push({ id: state.floatId++, x, y, text, color, life: 0.85 });
}

function addEffect(x, y, type, color = "#ffd27a", text = "", life = 0.7) {
  state.effects.push({ id: state.effectId++, x, y, type, color, text, life, maxLife: life });
}

function updateEffects(delta) {
  for (const item of state.effects) item.life -= delta;
  state.effects = state.effects.filter((item) => item.life > 0);
}

function render() {
  const zone = getZone();
  for (const node of els.map.querySelectorAll(".zone")) {
    const item = ZONES.find((z) => z.id === node.dataset.zone);
    node.classList.toggle("active", item.id === state.selectedZoneId);
    node.classList.toggle("locked", state.player.level + 3 < item.recommendedLevel && state.player.power < item.recommendedPower * 0.55);
  }
  renderActors();
  renderPlayer();
  renderSquad();
  renderCharacters();
  renderTavern();
  renderTower();
  renderGear();
  renderInventory();
  renderZone(zone);
  renderDrops();
  renderLogs();
  syncFightButton();
}

function renderActors() {
  renderCollection(".mob", state.mobs, (node, mob) => {
    node.dataset.id = String(mob.id);
    node.style.left = `${mob.x}%`;
    node.style.top = `${mob.y}%`;
    node.style.setProperty("--monster", mob.color);
    node.classList.toggle("hit", mob.hitTimer > 0);
    node.classList.toggle("aggro", Boolean(mob.aggroTargetId));
    node.classList.toggle("tower-mob", Boolean(mob.tower));
    node.classList.toggle("tower-target", Boolean(mob.tower && mob.aggroTargetId));
    node.classList.toggle("cursed", mob.curseTimer > 0);
    node.classList.toggle("marked", (mob.markStacks || 0) > 0);
    const marker = mob.markStacks ? `<div class="mark-badge">×${mob.markStacks}</div>` : "";
    const role = mob.role ? `<div class="mob-role">${CLASS_DESIGNS[mob.role]?.icon || "◆"}</div>` : "";
    node.innerHTML = `<div class="hp"><span style="width:${Math.max(0, mob.hp / mob.maxHp * 100)}%"></span></div>${marker}${role}<div class="head"></div><div class="body"></div>`;
  });

  renderCollection(".hero-unit", state.squad, (node, hero) => {
    node.dataset.id = hero.id;
    node.style.left = `${hero.x}%`;
    node.style.top = `${hero.y}%`;
    node.style.setProperty("--hero", hero.color);
    node.style.setProperty("--avatar", `url("${avatarData(hero)}")`);
    const attackProgress = hero.attackAnim > 0 ? 1 - hero.attackAnim / 0.42 : 0;
    const lunge = hero.attackAnim > 0 ? Math.sin(attackProgress * Math.PI) : 0;
    const lungeX = (hero.attackLungeX || 0) * lunge * 28;
    const lungeY = (hero.attackLungeY || 0) * lunge * 18;
    node.style.transform = `translate(-50%, -50%) translate(${lungeX}px, ${lungeY}px)`;
    node.classList.toggle("attacking", hero.attackAnim > 0);
    node.classList.toggle("dead", hero.hp <= 0);
    node.classList.toggle("shielded", hero.shield > 0);
    node.classList.toggle("singing", hero.bardBuffTimer > 0);
    node.classList.toggle("bloodrage", hero.bloodrageTimer > 0 || normalizeRole(hero.role) === "狂战士" && hero.hp / hero.maxHp < 0.45);
    const roleIcon = CLASS_DESIGNS[normalizeRole(hero.role)]?.icon || "◆";
    const shield = hero.shield > 0 ? `<div class="shield-badge">${Math.ceil(hero.shield)}</div>` : "";
    node.innerHTML = `<div class="hp"><span style="width:${Math.max(0, hero.hp / hero.maxHp * 100)}%"></span></div>${shield}<div class="role-badge">${roleIcon}</div><div class="shadow"></div><div class="weapon"></div><div class="body"></div><div class="head"></div><div class="portrait-dot"></div>`;
  });

  renderCollection(".loot-orb", state.loot, (node, loot) => {
    node.dataset.id = String(loot.id);
    node.style.left = `${loot.x}%`;
    node.style.top = `${loot.y}%`;
    node.style.setProperty("--loot", loot.drop.rarityColor);
    node.title = formatDropName(loot.drop);
  });

  renderCollection(".collectable", state.collectables, (node, item) => {
    node.dataset.id = String(item.id);
    node.style.left = `${item.x}%`;
    node.style.top = `${item.y}%`;
    node.classList.toggle("crystal-item", item.kind === "crystal");
    node.title = item.name;
  });

  renderCollection(".floater", state.floaters, (node, floater) => {
    node.dataset.id = String(floater.id);
    node.style.left = `${floater.x}%`;
    node.style.top = `${floater.y}%`;
    node.style.setProperty("--float", floater.color);
    node.style.opacity = String(clamp(floater.life / 0.85, 0, 1));
    node.textContent = floater.text;
  });

  renderCollection(".skill-effect", state.effects, (node, effect) => {
    node.dataset.id = String(effect.id);
    node.style.left = `${effect.x}%`;
    node.style.top = `${effect.y}%`;
    node.style.setProperty("--effect", effect.color);
    node.style.opacity = String(clamp(effect.life / effect.maxLife, 0, 1));
    node.className = `skill-effect ${effect.type}`;
    node.textContent = effect.text;
  });
}

function renderCollection(selector, items, update) {
  const existing = new Map([...els.map.querySelectorAll(selector)].map((node) => [node.dataset.id, node]));
  for (const item of items) {
    let node = existing.get(String(item.id));
    if (!node) {
      node = document.createElement("div");
      node.className = selector.slice(1);
      els.map.appendChild(node);
    }
    update(node, item);
    existing.delete(String(item.id));
  }
  for (const node of existing.values()) node.remove();
}

function renderPlayer() {
  const needed = nextLevelExp(state.player.level);
  const expPercent = Math.min(100, state.player.exp / needed * 100);
  const phaseText = state.phase === "combat" ? "战斗中" : state.phase === "loot" ? "收拾掉落" : "巡逻中";
  els.playerStats.innerHTML = `
    <div class="stat-chip"><b>Lv.${state.player.level}</b><span>队伍等级</span></div>
    <div class="stat-chip"><b>${state.player.power}</b><span>总战力</span></div>
    <div class="stat-chip"><b>${state.player.gold}</b><span>金币</span></div>
    <div class="stat-chip"><b>${phaseText}</b><span>当前节奏</span></div>
    <div class="stat-chip exp-chip"><b>${state.player.exp} / ${needed}</b><span>经验</span><div class="bar"><span style="width:${expPercent}%"></span></div></div>
  `;
}

function renderSquad() {
  els.squadPanel.innerHTML = state.squad.map((hero) => {
    const hpPercent = Math.max(0, Math.min(100, hero.hp / hero.maxHp * 100));
    const gear = SLOTS.map((slot) => {
      const item = hero.equipment[slot];
      const icon = SLOT_ICONS[slot] || "□";
      return `<span class="gear-mini ${item ? "" : "empty"}" style="--rarity:${item?.rarityColor || "#66745c"}" title="${slot}${item ? ` · ${item.rarityName}` : " · 空"}">${item ? icon : "·"}</span>`;
    }).join("");
    const pop = hero.powerPop ? `<span class="power-pop">${hero.powerPop.text}</span>` : "";
    return `<div class="hero-card ${hero.id === state.selectedHeroId ? "active" : ""}" data-hero-id="${hero.id}">
      <span class="avatar" style="background-image:url('${avatarData(hero)}')"></span>
      <div class="hero-name-row"><strong>${hero.name}</strong><span class="role-tag">${hero.role}</span></div>
      ${pop}
      <div class="hero-meta">${hero.rarity} · 战力 ${hero.power}</div>
      <div class="hp-line"><div class="hp-row"><span>生命</span><span>${Math.ceil(hero.hp)} / ${hero.maxHp}</span></div><div class="hp-bar"><span style="width:${hpPercent}%"></span></div></div>
      <div class="gear-icons">${gear}</div>
    </div>`;
  }).join("");
}

function renderCharacters() {
  if (!els.partyList || !els.characterGrid || !els.characterDetail) return;
  recalcRosterPower();
  const selected = findHeroEverywhere(state.selectedHeroId) || state.squad[0] || state.roster[0];
  const activeIds = new Set(state.squad.map((hero) => hero.id));
  els.partyList.innerHTML = Array.from({ length: 3 }, (_, index) => {
    const hero = state.squad[index];
    return hero ? renderCharacterCard(hero, { active: true, index, party: true }) : `<div class="party-empty"><strong>${index + 1}</strong><span>空位</span></div>`;
  }).join("");
  const all = sortedAllHeroes();
  els.characterGrid.innerHTML = all.map((hero) => renderCharacterCard(hero, { active: activeIds.has(hero.id), compact: true })).join("") || "<div class=\"empty-panel\">还没有候补角色，去酒馆招募。</div>";
  els.characterDetail.innerHTML = selected ? renderCharacterDetail(selected, activeIds.has(selected.id)) : "<div class=\"empty-panel\">请选择一个角色。</div>";
}

function sortedAllHeroes() {
  const activeIds = new Set(state.squad.map((hero) => hero.id));
  return [...state.squad, ...state.roster].sort((a, b) => {
    const activeDelta = Number(activeIds.has(b.id)) - Number(activeIds.has(a.id));
    return activeDelta || (b.power || 0) - (a.power || 0);
  });
}

function renderCharacterCard(hero, options = {}) {
  const isSelected = hero.id === state.selectedHeroId;
  const status = options.active ? "出战" : "候补";
  const role = normalizeRole(hero.role);
  const design = CLASS_DESIGNS[role] || CLASS_DESIGNS.战士;
  const chips = classQuickChips(role);
  return `<button class="character-card ${isSelected ? "selected" : ""} ${options.compact ? "compact" : ""} ${options.party ? "party-member" : ""}" data-character-id="${hero.id}" type="button" style="--hero:${hero.color}; --accent:${hero.accent}; --hair:${hero.hair}; --skin:${hero.skin}">
    <span class="character-avatar"><i></i></span>
    <strong>${options.index !== undefined ? `${options.index + 1}. ` : ""}${design.icon} ${hero.name}</strong>
    <span>${hero.rarity} ${role} · 战力 ${hero.power || 0}</span>
    <div class="class-card-chips">${chips.map((chip) => `<b>${chip}</b>`).join("")}</div>
    <em>${status}</em>
  </button>`;
}

function renderCharacterDetail(hero, isActive) {
  const stats = hero.finalStats || computeHeroStats(hero);
  const role = normalizeRole(hero.role);
  const design = CLASS_DESIGNS[role] || CLASS_DESIGNS.战士;
  const action = isActive
    ? `<button class="danger-action" data-character-action="bench" data-character-id="${hero.id}" type="button">出队到候补</button>`
    : `<button class="equip-action" data-character-action="join" data-character-id="${hero.id}" type="button">${state.squad.length < 3 ? "加入出战" : "替换当前出战"}</button>`;
  return `<div class="character-portrait" style="--hero:${hero.color}; --accent:${hero.accent}; --hair:${hero.hair}; --skin:${hero.skin}">
      <div class="portrait-weapon">${design.icon}</div>
      <div class="portrait-body"></div>
      <div class="portrait-head"></div>
      <div class="portrait-hair"></div>
      <div class="portrait-info"><strong>${hero.name}</strong><span>${hero.rarity} ${role}</span></div>
    </div>
    <div class="power-row"><div class="power-bar"><i style="width:${Math.max(12, Math.min(100, hero.power / Math.max(1, state.player.power) * 100))}%"></i></div><strong>${hero.power || 0}</strong></div>
    ${renderClassPanel(role, stats, "detail")}
    <div class="character-stats">${formatHeroStatsSummary(stats)}</div>
    <div class="character-actions">
      ${action}
      <button data-character-action="equip" data-character-id="${hero.id}" type="button">调整装备</button>
    </div>`;
}

function renderTavern() {
  const recruit = state.lastRecruit;
  const rosterHtml = state.roster.length
    ? state.roster.slice(0, 5).map((hero) => `<div class="equip-row"><div><strong style="color:${hero.color}">${hero.name}</strong><div>${hero.rarity} ${hero.role} · 战力 ${hero.power}</div></div><button data-roster-id="${hero.id}" type="button">入队</button></div>`).join("")
    : "<div>酒馆里暂时没有候选角色。</div>";
  const rollHtml = recruit ? `<div class="tavern-roll"><span class="avatar" style="background-image:url('${avatarData(recruit)}')"></span><div><strong style="color:${recruit.color}">${recruit.name}</strong><div>${recruit.rarity} ${recruit.role}</div></div></div>` : "";
  els.tavernPanel.innerHTML = `<div>招募消耗：60 金币</div>${rollHtml}${rosterHtml}`;
}

function renderTower() {
  if (!els.towerPanel) return;
  const floor = state.tower.floor || 1;
  const nextPower = towerFloorPower(floor);
  const preview = towerEnemyPreview(floor);
  const batch10 = towerBatchEnemies(floor, 10).length;
  const batch50 = towerBatchEnemies(floor, 50).length;
  const canStart = aliveHeroes().length > 0 && !state.tower.active;
  const banner = state.tower.banner || { type: state.tower.active ? "active" : "idle", text: "选择试炼层，开始检测小队战力。" };
  els.towerPanel.innerHTML = `<div class="tower-layout">
    <div class="tower-banner ${banner.type}">
      <strong>${towerBannerTitle(banner.type)}</strong>
      <span>${banner.text}</span>
    </div>
    <section class="tower-stage">
      <div class="tower-spire"><span>${floor}</span></div>
      <div>
        <h3>第 ${floor} 层试炼</h3>
        <p>固定敌人、固定强度，用来检测当前三人小队是否真的变强。</p>
        <div class="tower-metrics">
          <div><b>${state.tower.best || 0}</b><span>最高层</span></div>
          <div><b>${state.player.power}</b><span>队伍战力</span></div>
          <div><b>${nextPower}</b><span>本层强度</span></div>
          <div><b>${Math.round(state.player.power / Math.max(1, nextPower) * 100)}%</b><span>战力比</span></div>
        </div>
      </div>
    </section>
    <section class="tower-enemies">
      ${preview.map((enemy) => `<div class="tower-enemy ${state.tower.active ? "highlight" : ""}"><i>${CLASS_DESIGNS[enemy.role]?.icon || "◆"}</i><strong>${enemy.name}</strong><span>${enemy.role} · Lv.${enemy.level}</span></div>`).join("")}
    </section>
    <section class="tower-reward">
      <strong>节奏曲线</strong>
      <p>普通层稳步提升，3 层小坎、5 层精英、10 层首领，强度会一段快一段慢。</p>
      <p>${state.tower.lastReward || "通关后会给金币、经验和一件本层装备。"}</p>
      <div class="tower-actions">
        <button class="equip-action" data-tower-action="start" data-tower-count="1" type="button" ${canStart ? "" : "disabled"}>${state.tower.active ? "挑战中" : "挑战本层"}</button>
        <button class="equip-action secondary" data-tower-action="start" data-tower-count="10" type="button" ${canStart ? "" : "disabled"}>连战 10 层 · ${batch10} 敌</button>
        <button class="equip-action secondary" data-tower-action="start" data-tower-count="50" type="button" ${canStart ? "" : "disabled"}>连战 50 层 · ${batch50} 敌</button>
      </div>
    </section>
  </div>`;
}

function renderGear() {
  const hero = selectedHero();
  if (!hero) {
    els.gearPanel.innerHTML = "<div>先选择一个小队角色。</div>";
    return;
  }
  const stats = hero.finalStats || computeHeroStats(hero);
  const role = normalizeRole(hero.role);
  const design = CLASS_DESIGNS[role] || CLASS_DESIGNS.战士;
  const activeIds = new Set(state.squad.map((item) => item.id));
  const heroList = sortedAllHeroes()
    .map((item) => {
      const itemRole = normalizeRole(item.role);
      return `<button class="inventory-hero-chip ${item.id === state.selectedHeroId ? "active" : ""}" data-hero-id="${item.id}" type="button" style="--hero:${item.color}; --hair:${item.hair}; --skin:${item.skin}"><span class="character-avatar"><i></i></span><strong>${CLASS_DESIGNS[itemRole]?.icon || "◆"} ${item.name}</strong><span>${activeIds.has(item.id) ? "出战" : "候补"} · ${itemRole}</span><em>${item.power}</em></button>`;
    })
    .join("");
  if (els.inventoryHeroStrip) els.inventoryHeroStrip.innerHTML = heroList || "<div class=\"empty-panel\">暂无角色。</div>";
  const slots = SLOTS.map((slot) => {
    const item = hero.equipment[slot];
    const affixText = item ? item.affixes.slice(0, 2).map(formatAffix).join(" / ") : "空槽";
    return `<div class="gear-slot ${item ? "filled" : ""}" style="--rarity:${item?.rarityColor || "#66745c"}"><span class="gear-icon">${SLOT_ICONS[slot] || "🎒"}</span><div><strong>${slot}</strong><span>${item ? item.rarityName : "未装备"}</span><em>${affixText}</em></div></div>`;
  }).join("");
  els.gearPanel.innerHTML = `<div class="gear-portrait" style="--hero:${hero.color}; --hair:${hero.hair}; --skin:${hero.skin}; --accent:${hero.accent}">
      <div class="portrait-scene">
        <div class="portrait-weapon">${design.icon}</div>
        <div class="portrait-body"></div>
        <div class="portrait-head"></div>
        <div class="portrait-hair"></div>
      </div>
      <div class="portrait-info">
        <strong>${hero.name}</strong>
        <span>${hero.rarity} ${role}</span>
      </div>
    </div>
    <div class="power-row">
      <div class="power-bar"><i style="width:${Math.max(12, Math.min(100, hero.power / Math.max(1, state.player.power) * 100))}%"></i></div>
      <strong>${hero.power}</strong>
    </div>
    <div class="gear-selected">${renderClassPanel(role, stats, "gear")}<div class="hero-stat-line">${formatHeroStatsSummary(stats)}</div></div>
    <div class="gear-slots">${slots}</div>`;
}

function renderInventory() {
  sortAndTrimInventory();
  const items = state.player.inventory.slice(0, 42);
  if (!state.selectedInventoryId && items[0]) state.selectedInventoryId = items[0].id;
  if (state.selectedInventoryId && !state.player.inventory.some((item) => item.id === state.selectedInventoryId)) {
    state.selectedInventoryId = items[0]?.id || null;
  }
  const cells = Array.from({ length: 42 }, (_, index) => {
    const drop = items[index];
    if (!drop) return `<button class="bag-cell empty" type="button" aria-label="空格"></button>`;
    const wearer = equippedBy(drop.id);
    return `<button class="bag-cell ${drop.id === state.selectedInventoryId ? "selected" : ""} ${wearer ? "equipped" : ""}" data-inventory-id="${drop.id}" type="button" style="--rarity:${drop.rarityColor}" title="${formatDropName(drop)}"><span class="bag-tier">T${drop.tier}</span><span class="bag-icon">${SLOT_ICONS[drop.slot] || "🎒"}</span><span class="bag-rarity">${drop.rarityName}</span><span class="bag-power">+${drop.power}</span>${wearer ? `<span class="bag-equipped">已装</span>` : ""}</button>`;
  }).join("");
  const selected = state.player.inventory.find((item) => item.id === state.selectedInventoryId);
  const wearer = selected ? equippedBy(selected.id) : null;
  const hero = selectedHero();
  const current = selected && hero ? hero.equipment[selected.slot] : null;
  const delta = selected && hero ? previewEquipPowerDelta(hero, selected) : 0;
  const detail = selected
    ? `<div class="bag-detail" style="--rarity:${selected.rarityColor}">
        <div class="detail-head"><span class="detail-icon">${SLOT_ICONS[selected.slot] || "🎒"}</span><div><strong>${formatDropName(selected)}</strong><div>${selected.rarityName} · ${selected.slot} · Lv.${selected.level} · Tier ${selected.tier}</div></div></div>
        <div class="compare-line"><span>当前角色</span><strong>${hero?.name || "未选择"}</strong></div>
        <div class="compare-line"><span>当前槽位</span><strong>${current ? formatDropName(current) : "空槽"}</strong></div>
        <div class="compare-line"><span>战力变化</span><strong class="${delta >= 0 ? "gain" : "loss"}">${delta >= 0 ? "+" : ""}${delta}</strong></div>
        <div class="affix-list">${selected.affixes.map((affix) => `<div>${formatAffix(affix)}</div>`).join("")}</div>
        <div class="detail-meta">${wearer ? `已装备：${wearer.name}` : "当前未装备"} · roll ${selected.roll}</div>
        <button class="equip-action" data-equip-id="${selected.id}" type="button">装备到${selected.slot}</button>
      </div>`
    : `<div class="bag-detail muted">背包还没有装备。</div>`;
  els.inventoryList.innerHTML = `<div class="bag-grid">${cells}</div>`;
  if (els.inventoryDetail) els.inventoryDetail.innerHTML = detail;
}

function renderZone(zone) {
  const rarityText = Object.entries(zone.rarityTable).map(([id, chance]) => {
    const rarity = RARITIES.find((item) => item.id === id);
    return `<span class="rarity-pill" style="--rarity:${rarity.color}">${rarity.name} ${Math.round(chance * 100)}%</span>`;
  }).join("");
  const groupCount = new Set(state.mobs.filter((mob) => mob.zoneId === zone.id).map((mob) => mob.groupId)).size;
  const collectCount = state.collectables.filter((item) => item.zoneId === zone.id).length;
  els.zoneName.textContent = zone.name;
  els.zoneInfo.innerHTML = `
    <div class="zone-metrics">
      <div class="zone-metric"><b>Lv.${zone.recommendedLevel}</b><span>推荐等级</span></div>
      <div class="zone-metric"><b>${zone.recommendedPower}</b><span>推荐战力</span></div>
      <div class="zone-metric"><b>${zone.enemyLevel[0]}-${zone.enemyLevel[1]}</b><span>怪物等级</span></div>
      <div class="zone-metric"><b>${zone.expReward[0]}-${zone.expReward[1]}</b><span>经验</span></div>
      <div class="zone-metric"><b>${zone.equipmentTiers.join(" / ")}</b><span>装备 Tier</span></div>
      <div class="zone-metric"><b>${groupCount}</b><span>当前怪群</span></div>
      <div class="zone-metric"><b>${collectCount}</b><span>收集品</span></div>
      <div class="zone-metric"><b>${Math.round(state.zoom * 100)}%</b><span>地图缩放</span></div>
    </div>
    <div class="rarity-row">${rarityText}</div>
  `;
  els.monsterPreview.innerHTML = `<div class="big-monster" style="--monster:${zone.map.color}"><div class="horn left"></div><div class="horn right"></div><div class="head"></div><div class="body"></div></div><div class="monster-names"><strong>敌人</strong><span>${zone.enemies.join(" / ")}</span></div>`;
}

function renderDrops() {
  const drops = state.player.inventory.slice(0, 10);
  els.dropList.innerHTML = drops.map((drop) => `<div class="drop" style="--rarity:${drop.rarityColor}">
    <span class="drop-icon">${SLOT_ICONS[drop.slot] || "🎒"}</span>
    <div><strong>${formatDropName(drop)}</strong><div>Lv.${drop.level} · T${drop.tier} · +${drop.power}</div></div>
  </div>`).join("") || "<div>还没有掉落。</div>";
}

function renderLogs() {
  els.logList.innerHTML = state.logs.map((item) => `<div>${item}</div>`).join("") || "<div>开始巡逻后，小队会先走一段路，遇到怪群才开战。</div>";
}

function selectedHero() {
  return findHeroEverywhere(state.selectedHeroId) || state.squad[0] || state.roster[0];
}

function findHeroEverywhere(heroId) {
  return state.squad.find((hero) => hero.id === heroId) || state.roster.find((hero) => hero.id === heroId);
}

function normalizeState() {
  state.player.gold = Number.isFinite(state.player.gold) ? state.player.gold : 120;
  state.player.supplies = Number.isFinite(state.player.supplies) ? state.player.supplies : 0;
  state.roster = Array.isArray(state.roster) ? state.roster : [];
  state.effects = Array.isArray(state.effects) ? state.effects : [];
  state.tower = { floor: 1, best: 0, active: false, batch: 1, lastReward: null, banner: { type: "idle", text: "选择试炼层，开始检测小队战力。" }, ...(state.tower || {}), active: false, batch: 1 };
  state.squad = state.squad.map((hero, index) => {
    const template = HERO_POOL.find((item) => hero.id.startsWith(item.id)) || HERO_POOL[index] || HERO_POOL[0];
    return {
      ...makeHeroFromTemplate(template, hero.x ?? (10 + index * 3), hero.y ?? 75),
      ...hero,
      role: normalizeRole(hero.role || template.role),
      speed: Math.min(hero.speed || template.speed, template.speed),
      rarity: hero.rarity || template.rarity,
      hair: hero.hair || template.hair,
      skin: hero.skin || template.skin,
      accent: hero.accent || template.accent,
      equipment: hero.equipment || {},
    };
  });
  state.roster = state.roster.map((hero, index) => {
    const template = HERO_POOL.find((item) => hero.id.startsWith(item.id)) || HERO_POOL[index % HERO_POOL.length] || HERO_POOL[0];
    return {
      ...makeHeroFromTemplate(template, hero.x ?? 12, hero.y ?? 75),
      ...hero,
      role: normalizeRole(hero.role || template.role),
      speed: Math.min(hero.speed || template.speed, template.speed),
      rarity: hero.rarity || template.rarity,
      hair: hero.hair || template.hair,
      skin: hero.skin || template.skin,
      accent: hero.accent || template.accent,
      equipment: hero.equipment || {},
    };
  });
  if (!state.squad.some((hero) => hero.id === state.selectedHeroId)) {
    state.selectedHeroId = state.squad[0]?.id || state.roster[0]?.id || "vanguard";
  }
  state.player.inventory = Array.isArray(state.player.inventory) ? state.player.inventory : [];
  sortAndTrimInventory();
  recalcRosterPower();
}

function avatarData(hero) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="${hero.accent}"/><circle cx="40" cy="41" r="31" fill="${hero.skin}"/><path d="M12 38C14 13 33 5 52 13c12 5 17 17 15 29-15-12-31-17-55-4Z" fill="${hero.hair}"/><path d="M23 58c9 10 25 13 36 0-5 15-30 15-36 0Z" fill="#38291f" opacity=".45"/><circle cx="30" cy="40" r="4" fill="#1d1b18"/><circle cx="51" cy="40" r="4" fill="#1d1b18"/><path d="M18 78c4-17 39-23 48 0Z" fill="${hero.color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function reset() {
  localStorage.removeItem(STORAGE_KEY);
  state.selectedZoneId = "grass_camp";
  state.running = false;
  state.speedMode = 1;
  state.phase = "patrol";
  state.phaseTimer = 0;
  state.activeGroupId = null;
  state.pan = { x: -260, y: -330 };
  state.zoom = 0.82;
  state.mobs = [];
  state.loot = [];
  state.collectables = [];
  state.floaters = [];
  state.effects = [];
  state.mobId = 1;
  state.groupId = 1;
  state.lootId = 1;
  state.collectId = 1;
  state.floatId = 1;
  state.effectId = 1;
  state.squad = createDefaultSquad();
  state.roster = [];
  state.selectedHeroId = "vanguard";
  state.lastRecruit = null;
  state.tower = { floor: 1, best: 0, active: false, batch: 1, lastReward: null, banner: { type: "idle", text: "选择试炼层，开始检测小队战力。" } };
  state.player = { level: 1, exp: 0, power: 0, inventory: [], fights: 0, supplies: 0, gold: 120 };
  state.logs = [];
  recalcPlayerPower();
  ensureMobs();
  ensureCollectables();
  setPatrolTarget();
  updatePan();
  els.fight.textContent = "开始巡逻";
  els.auto.textContent = "加速 x1";
  save();
  render();
}

function screenToWorld(screenX, screenY) {
  return {
    x: ((screenX - state.pan.x) / state.zoom) / MAP_SIZE.width * 100,
    y: ((screenY - state.pan.y) / state.zoom) / MAP_SIZE.height * 100,
  };
}

function updatePan() {
  els.map.style.width = `${MAP_SIZE.width}px`;
  els.map.style.height = `${MAP_SIZE.height}px`;
  els.map.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
}

function clampPan() {
  const rect = els.viewport.getBoundingClientRect();
  const scaledWidth = MAP_SIZE.width * state.zoom;
  const scaledHeight = MAP_SIZE.height * state.zoom;
  state.pan.x = scaledWidth <= rect.width ? (rect.width - scaledWidth) / 2 : clamp(state.pan.x, rect.width - scaledWidth, 0);
  state.pan.y = scaledHeight <= rect.height ? (rect.height - scaledHeight) / 2 : clamp(state.pan.y, rect.height - scaledHeight, 0);
}

function rollRarity(table) {
  const value = Math.random();
  let cursor = 0;
  for (const rarity of RARITIES) {
    cursor += table[rarity.id] || 0;
    if (value <= cursor) return rarity;
  }
  for (let i = RARITIES.length - 1; i >= 0; i -= 1) {
    if (table[RARITIES[i].id]) return RARITIES[i];
  }
  return RARITIES[0];
}

function nextLevelExp(level) {
  if (level < 5) return Math.round(70 + level * 42);
  if (level < 12) return Math.round(260 + level ** 1.55 * 42);
  return Math.round(760 + level ** 2.05 * 38);
}

function getZone() { return ZONES.find((zone) => zone.id === state.selectedZoneId) || ZONES[0]; }
function getZoneByPoint(point) { return ZONES.slice().sort((a, b) => distance(a.map, point) - distance(b.map, point))[0]; }
function formatDropName(drop) { return `${drop.rarityName}${drop.setName}${drop.slot}`; }
function formatAffix(affix) {
  const meta = STAT_META[affix.stat] || { name: affix.stat };
  const value = meta.percent ? `${Math.round(affix.value * 100)}%` : Math.round(affix.value);
  return `${meta.name} +${value}`;
}
function formatHeroStatsSummary(stats) {
  return [
    `生命 ${Math.round(stats.hp)}`,
    `攻 ${Math.round(stats.attack)}`,
    `法 ${Math.round(stats.magicPower)}`,
    `防 ${Math.round(stats.defense)}`,
    `魔抗 ${Math.round(stats.magicResist)}`,
    `攻速 +${Math.round(stats.attackSpeed * 100)}%`,
    `暴 ${Math.round(stats.critChance * 100)}%`,
  ].join(" / ");
}

function renderClassPanel(role, stats, variant = "detail") {
  const design = CLASS_DESIGNS[role] || CLASS_DESIGNS.战士;
  const kpis = classKpis(role, stats);
  const chips = classQuickChips(role);
  return `<section class="class-panel ${variant === "gear" ? "gear-class-panel" : ""}">
    <div class="class-panel-head">
      <div class="class-emblem">${design.icon}</div>
      <div>
        <strong>${role}</strong>
        <span>${chips.join(" · ")}</span>
      </div>
    </div>
    <div class="class-flow">
      <div><i>触发</i><b>${kpis.trigger}</b><span>${kpis.triggerSub}</span></div>
      <div><i>画面</i><b>${kpis.feedback}</b><span>${kpis.feedbackSub}</span></div>
      <div><i>收益</i><b>${kpis.payoff}</b><span>${kpis.payoffSub}</span></div>
    </div>
    <div class="focus-tags">${design.focus.map((item) => `<i>${item}</i>`).join("")}</div>
    <div class="combo-line">配合：${design.combo}</div>
  </section>`;
}

function towerBannerTitle(type) {
  if (type === "active") return "挑战中";
  if (type === "success") return "挑战成功";
  if (type === "fail") return "挑战失败";
  return "试炼塔";
}

function classQuickChips(role) {
  const map = {
    战士: ["近战", "顺劈", "清小怪"],
    狂战士: ["近战", "低血爆发", "吸血"],
    骑士: ["前排", "嘲讽", "护盾"],
    游侠: ["远程", "标记", "点杀"],
    法师: ["远程", "AOE", "爆发"],
    牧师: ["后排", "治疗", "护盾"],
    吟游诗人: ["辅助", "全队加速", "窗口期"],
    术士: ["后排", "诅咒", "持续伤害"],
  };
  return map[role] || ["输出", "技能", "成长"];
}

function classKpis(role, stats) {
  const pct = (value) => `${Math.round(value * 100)}%`;
  const map = {
    战士: { trigger: "贴近怪堆", triggerSub: "普攻和技能会溅射", feedback: "黄色斩弧", feedbackSub: "两个敌人一起跳伤害", payoff: `攻 ${Math.round(stats.attack)}`, payoffSub: "攻速/暴击越高越明显" },
    狂战士: { trigger: "血量下降", triggerSub: "越危险越快", feedback: "红色血怒", feedbackSub: "武器发红，攻击变密", payoff: `吸血 ${pct(stats.lifeSteal)}`, payoffSub: "低血线站得住才强" },
    骑士: { trigger: "开场/冷却到", triggerSub: "把怪拉向自己", feedback: "青色盾圈", feedbackSub: "队友出现护盾数字", payoff: `格挡 ${pct(stats.blockChance)}`, payoffSub: "防御/护盾提高容错" },
    游侠: { trigger: "锁定单体", triggerSub: "连续攻击叠标记", feedback: "紫色标记", feedbackSub: "目标头上层数增加", payoff: `标记 ${pct(stats.markPower)}`, payoffSub: "越打同一个越痛" },
    法师: { trigger: "怪物聚集", triggerSub: "冷却到就炸一片", feedback: "红色火圈", feedbackSub: "多个敌人同时掉血", payoff: `法强 ${Math.round(stats.magicPower)}`, payoffSub: "火焰/奥术提高爆发" },
    牧师: { trigger: "队友低血", triggerSub: "自动抬最低血量", feedback: "绿色治疗", feedbackSub: "治疗数字和护盾圈", payoff: `治疗 ${Math.round(stats.healPower)}`, payoffSub: "冷却和护盾越高越稳" },
    吟游诗人: { trigger: "技能窗口", triggerSub: "全队进入加速期", feedback: "金色音符", feedbackSub: "队友身上发光", payoff: `战歌 ${pct(stats.auraPower)}`, payoffSub: "放大战士/游侠输出" },
    术士: { trigger: "接触怪群", triggerSub: "铺诅咒和毒", feedback: "紫黑咒印", feedbackSub: "小额毒伤持续跳", payoff: `减抗 ${pct(stats.resistShred)}`, payoffSub: "让法师和游侠打更痛" },
  };
  return map[role] || map.战士;
}

function skillDescription(hero) {
  const cooldown = Math.ceil(hero.skillCooldown || 0);
  const ready = cooldown <= 0 ? "可释放" : `${cooldown}s`;
  const role = normalizeRole(hero.role);
  const design = CLASS_DESIGNS[role] || CLASS_DESIGNS.战士;
  return `技能：${design.visible}。画面反馈：${design.feedback}。冷却 ${ready}`;
}
function normalizeRole(role) {
  if (role === "坦克") return "骑士";
  if (role === "刺客") return "游侠";
  return role || "战士";
}
function addLog(text) { state.logs.unshift(text); state.logs = state.logs.slice(0, 100); }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function pick(items) { return items[Math.floor(Math.random() * items.length)]; }
function randomRange([min, max]) { return min + Math.random() * (max - min); }
function randomInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    selectedZoneId: state.selectedZoneId,
    squad: state.squad,
    roster: state.roster,
    selectedHeroId: state.selectedHeroId,
    selectedInventoryId: state.selectedInventoryId,
    lastRecruit: state.lastRecruit,
    tower: { ...state.tower, active: false, batch: 1 },
    player: state.player,
    logs: state.logs,
    pan: state.pan,
    zoom: state.zoom,
  }));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    const saved = JSON.parse(raw);
    state.selectedZoneId = saved.selectedZoneId || state.selectedZoneId;
    state.squad = Array.isArray(saved.squad) && saved.squad.length ? saved.squad : state.squad;
    state.roster = Array.isArray(saved.roster) ? saved.roster : state.roster;
    state.selectedHeroId = saved.selectedHeroId || state.selectedHeroId;
    state.selectedInventoryId = saved.selectedInventoryId || state.selectedInventoryId;
    state.lastRecruit = saved.lastRecruit || state.lastRecruit;
    state.tower = { ...state.tower, ...(saved.tower || {}), active: false, batch: 1 };
    state.player = saved.player || state.player;
    state.logs = saved.logs || [];
    state.pan = saved.pan || state.pan;
    state.zoom = saved.zoom || state.zoom;
  } catch {}
}

setup().catch((error) => {
  els.logList.innerHTML = `<div>${error.message}</div>`;
});
