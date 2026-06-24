const SLASH_BASE = "/effect_lab/assets/brackeys/particles/alpha";
const ROLE_ICONS = {
  knight: "🛡️", warrior: "⚔️", berserker: "🪓", assassin: "🗡️", ranger: "🏹",
  mage: "🔥", priest: "✨", warlock: "☠️", bard: "🎵", alchemist: "⚗️",
};

const SHARED_SKILLS = window.GAME_SKILL_DATA || {};
const BERSERKER_SHARED = SHARED_SKILLS.roles?.berserker || {};
const BERSERKER_MODEL = SHARED_SKILLS.berserkerModel || {};
const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
const BERSERKER_DURATIONS = BERSERKER_MODEL.durations || {};
const BERSERKER_COOLDOWNS = BERSERKER_MODEL.cooldowns || {};
const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};
const SIGNALS = window.GAME_COMBAT_SIGNALS || {};
const SHARED_SKILL_KEY_BY_NAME = Object.fromEntries(Object.entries(SHARED_SKILLS.skills || {}).map(([key, skill]) => [skill.name, key]));
Object.assign(SHARED_SKILL_KEY_BY_NAME, {
  "护卫反击": "retaliationStance",
  "王旗不倒": "bannerWall",
});
const TEAM_TIMER_ALIASES = {
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

if (!SHARED_SKILLS.createSkillLibrary || !SHARED_SKILLS.roleKits || !SHARED_SKILLS.skills) {
  throw new Error("Skill assets and skill runtime must load before team-simulator.js");
}

const TEAM_SHARED_SKILLS = SHARED_SKILLS.createSkillLibrary({
  iconBase: "",
  timerAliases: TEAM_TIMER_ALIASES,
  isAlive: alive,
  hpRatio: teamHpRatio,
  statusCount: teamStatusCount,
  effectivePower: teamEffectivePower,
  enemiesOf: enemies,
  alliesOf: allies,
  lowestEnemy: teamLowestEnemy,
  lowestHpAlly: teamLowestHpAlly,
  carryAlly: teamCarryAlly,
  byDistance,
  hit: teamHit,
  shield: teamShield,
  healUnit: teamHealUnit,
  addPoison: teamAddPoison,
  addBurn: teamAddBurn,
  takeRaw: teamTakeRaw,
  floater: teamFloater,
  counterattack: teamCounterattack,
  emitEffectSignal: emitTeamEffectSignal,
});

const ROLES = {
  knight: role("骑士", "守护前排", 360, 34, 14, 12, ["守护", "誓卫嘲讽"], "护卫反击", "王旗不倒"),
  warrior: role("战士", "稳定压线", 345, 55, 11, 13, ["重击", "顺劈"], "破阵步", "战旗冲锋"),
  berserker: sharedBerserkerRole(),
  assassin: role("刺客", "低血收割", 292, 67, 7, 12, ["毒刃连刺", "影切"], "破绽毒刃", "暗影收割"),
  ranger: role("游侠", "标记点杀", 285, 58, 7, 38, ["猎标箭", "钉足箭"], "鹰眼换弦", "箭雨"),
  mage: role("法师", "燃烧爆发", 228, 52, 4, 38, ["余烬火球", "烈焰扩散"], "火种共鸣", "流星火雨"),
  priest: role("牧师", "治疗护盾", 286, 44, 6, 35, ["急救", "净血护符"], "净化祷言", "神圣庇护"),
  warlock: role("术士", "毒层扩散", 318, 60, 8, 34, ["腐毒烙印", "血契供奉"], "温床契约", "万毒献祭"),
  bard: role("吟游诗人", "团队节奏", 286, 45, 7, 36, ["急板战歌", "勇气和弦"], "返场", "终章强音"),
  alchemist: role("炼金师", "异常放大", 286, 47, 7, 35, ["沼雾瓶", "爆裂瓶"], "催化剂", "终极混剂"),
};

const ROLE_PROFILES = {
  knight: profile(
    "前排护卫：靠护盾、减伤和反击承压，输出不是主目标。",
    [["反击", 35, "gold"], ["普攻", 25, "steel"], ["控制承压", 25, "blue"], ["技能直伤", 15, "red"]],
    [["护盾", 36, "blue"], ["减伤", 28, "gold"], ["护甲", 22, "steel"], ["血量", 14, "green"]]
  ),
  warrior: profile(
    "稳定压线：正面接敌，靠顺劈和冲锋把伤害铺到前排。",
    [["技能直伤", 42, "red"], ["普攻", 26, "steel"], ["小范围", 20, "gold"], ["爆发窗口", 12, "purple"]],
    [["血量", 34, "green"], ["护甲", 30, "steel"], ["站位", 20, "gold"], ["短控", 16, "blue"]]
  ),
  berserker: profile(
    "强化普攻核心：血怒、旋风、战吼都在放大普攻，最吃急速。",
    [["强化普攻", 45, "red"], ["普攻基础", 28, "steel"], ["旋风溅射", 15, "purple"], ["战吼窗口", 12, "gold"]],
    [["吸血", 34, "red"], ["濒死保护", 28, "gold"], ["血量", 22, "green"], ["护甲", 16, "steel"]]
  ),
  assassin: profile(
    "低血收割：优先找残血，毒和影切负责把一个点迅速打穿。",
    [["斩杀", 34, "red"], ["毒刃叠层", 26, "green"], ["影切爆发", 24, "purple"], ["普攻", 16, "steel"]],
    [["机动", 34, "purple"], ["短时规避", 26, "blue"], ["收割回血", 20, "green"], ["血量", 20, "steel"]]
  ),
  ranger: profile(
    "标记点杀：标记是准备动作，钉足和箭雨负责拉开距离并兑现伤害。",
    [["标记收益", 32, "gold"], ["普攻", 27, "steel"], ["箭雨", 23, "blue"], ["钉足控制", 18, "purple"]],
    [["射程", 40, "blue"], ["控制", 24, "purple"], ["机动", 18, "gold"], ["血量", 18, "steel"]]
  ),
  mage: profile(
    "燃烧爆发：先点燃，再扩散，最后用大招把燃烧战场化。",
    [["燃烧持续", 34, "red"], ["爆发", 28, "gold"], ["扩散", 24, "purple"], ["直伤", 14, "steel"]],
    [["射程", 34, "blue"], ["控场", 24, "purple"], ["击杀滚动", 22, "gold"], ["身板", 20, "steel"]]
  ),
  priest: profile(
    "治疗护盾：输出很低，价值在救急、净化和给队伍续航。",
    [["治疗贡献", 42, "green"], ["护盾贡献", 28, "blue"], ["净化", 20, "gold"], ["直伤", 10, "steel"]],
    [["治疗", 42, "green"], ["护盾", 30, "blue"], ["净化", 18, "gold"], ["站位", 10, "steel"]]
  ),
  warlock: profile(
    "毒层扩散：靠剧毒层数和献祭爆发，强但需要队伍帮它拖时间。",
    [["剧毒持续", 36, "green"], ["献祭爆发", 26, "purple"], ["毒层扩散", 24, "gold"], ["普攻", 14, "steel"]],
    [["血量", 30, "green"], ["射程", 26, "blue"], ["吸收", 20, "purple"], ["风险", 24, "red"]]
  ),
  bard: profile(
    "团队节奏：自己伤害低，核心是把急速和增伤给主要输出位。",
    [["急速贡献", 40, "blue"], ["勇气增伤", 28, "gold"], ["返场触发", 20, "purple"], ["普攻", 12, "steel"]],
    [["距离", 32, "blue"], ["团队节奏", 28, "gold"], ["血量", 22, "green"], ["护甲", 18, "steel"]]
  ),
  alchemist: profile(
    "异常放大：给燃烧/剧毒队伍补催化，让异常伤害变成爆发。",
    [["异常增幅", 34, "purple"], ["爆裂瓶", 26, "red"], ["毒雾铺场", 24, "green"], ["普攻", 16, "steel"]],
    [["距离", 30, "blue"], ["功能性", 26, "gold"], ["血量", 24, "green"], ["护甲", 20, "steel"]]
  ),
};

const NAMES = ["银誓", "裂盾", "赤炉", "鸦羽", "月弦", "冷杉", "金穗", "雾瓶", "灰契", "晨歌", "燧石", "长阶"];
const CHALLENGES = [
  { id: 30, name: "边境试炼", roles: ["warrior", "ranger", "priest", "mage"] },
  { id: 60, name: "堡垒守军", roles: ["knight", "warrior", "priest", "bard"] },
  { id: 80, name: "暗影小队", roles: ["knight", "assassin", "assassin", "warlock"] },
  { id: 90, name: "余烬议会", roles: ["knight", "mage", "mage", "alchemist"] },
];

const state = {
  roster: [],
  squad: [],
  selectedId: null,
  modalOpen: false,
  units: [],
  running: false,
  activeChallenge: null,
  results: {},
  logs: [],
  signalBus: SIGNALS.createCombatSignalBus ? SIGNALS.createCombatSignalBus() : null,
  time: 0,
  lastFrame: 0,
};

const els = {
  recruitBtn: document.querySelector("#recruitBtn"),
  autoPickBtn: document.querySelector("#autoPickBtn"),
  tourBtn: document.querySelector("#tourBtn"),
  squadSlots: document.querySelector("#squadSlots"),
  squadSummary: document.querySelector("#squadSummary"),
  rosterGrid: document.querySelector("#rosterGrid"),
  challengeList: document.querySelector("#challengeList"),
  selectedName: document.querySelector("#selectedName"),
  selectedDetail: document.querySelector("#selectedDetail"),
  heroModal: document.querySelector("#heroModal"),
  modalCloseBtn: document.querySelector("#modalCloseBtn"),
  modalHeroIcon: document.querySelector("#modalHeroIcon"),
  modalHeroName: document.querySelector("#modalHeroName"),
  modalHeroMeta: document.querySelector("#modalHeroMeta"),
  modalHeroPower: document.querySelector("#modalHeroPower"),
  modalSkillGrid: document.querySelector("#modalSkillGrid"),
  modalStats: document.querySelector("#modalStats"),
  modalTeamBtn: document.querySelector("#modalTeamBtn"),
  unitLayer: document.querySelector("#unitLayer"),
  fxLayer: document.querySelector("#fxLayer"),
  battleLog: document.querySelector("#battleLog"),
  battleState: document.querySelector("#battleState"),
};

function role(name, fantasy, hp, power, armor, range, small, passive, ult) {
  return { name, fantasy, hp, power, armor, range, small, passive, ult };
}

function sharedBerserkerRole() {
  const stats = BERSERKER_SHARED.stats || {};
  return role(
    BERSERKER_SHARED.name || "狂战士",
    BERSERKER_SHARED.fantasy || "普攻狂暴",
    stats.hp ?? 330,
    stats.power ?? 66,
    stats.armor ?? 8,
    stats.range ?? 12,
    ["血怒斩", "裂骨旋风"],
    "血怒引擎",
    "不死战吼"
  );
}

function profile(summary, output, survival) {
  return { summary, output, survival };
}

const ROLE_SKILL_POOLS = buildRoleSkillPools();

function buildRoleSkillPools() {
  const pools = Object.fromEntries(Object.keys(ROLES).map((roleKey) => [roleKey, { small: [], passive: [], ult: [] }]));
  for (const [roleKey, roleKit] of Object.entries(SHARED_SKILLS.roleKits || {})) {
    if (!pools[roleKey]) continue;
    addUnique(pools[roleKey].small, roleKit.kit?.small1);
    addUnique(pools[roleKey].small, roleKit.kit?.small2);
    addUnique(pools[roleKey].passive, roleKit.kit?.passive);
    addUnique(pools[roleKey].ult, roleKit.kit?.ultimate);
  }
  for (const [skillKey, skill] of Object.entries(SHARED_SKILLS.skills || {})) {
    for (const roleKey of skill.roleKeys || []) {
      if (!pools[roleKey]) continue;
      if (skill.type === SHARED_SKILLS.TYPE?.SMALL) addUnique(pools[roleKey].small, skillKey);
      else if (skill.type === SHARED_SKILLS.TYPE?.PASSIVE) addUnique(pools[roleKey].passive, skillKey);
      else if (skill.type === SHARED_SKILLS.TYPE?.ULT) addUnique(pools[roleKey].ult, skillKey);
    }
  }
  return pools;
}

function addUnique(list, value) {
  if (value && !list.includes(value)) list.push(value);
}

function randomKit(roleKey, base) {
  const pool = ROLE_SKILL_POOLS[roleKey] || {};
  const smallKeys = pickMany(pool.small, 2);
  while (smallKeys.length < 2) smallKeys.push(SHARED_SKILL_KEY_BY_NAME[base.small[smallKeys.length]] || base.small[smallKeys.length]);
  return {
    smallKeys,
    passiveKey: pickOne(pool.passive) || SHARED_SKILL_KEY_BY_NAME[base.passive] || base.passive,
    ultKey: pickOne(pool.ult) || SHARED_SKILL_KEY_BY_NAME[base.ult] || base.ult,
  };
}

function pickOne(list = []) {
  return list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

function pickMany(list = [], count) {
  const pool = [...list];
  const picked = [];
  while (pool.length && picked.length < count) {
    const index = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(index, 1)[0]);
  }
  return picked;
}

function skillNameByKey(key) {
  return SHARED_SKILLS.skills?.[key]?.name || key;
}

function setup() {
  recruit();
  bind();
  requestAnimationFrame(tick);
}

function bind() {
  els.recruitBtn.addEventListener("click", recruit);
  els.autoPickBtn.addEventListener("click", autoPick);
  els.tourBtn.addEventListener("click", runTour);
  els.rosterGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    if (event.target.closest("button")) toggleHero(card.dataset.id);
    else openHeroModal(card.dataset.id);
  });
  els.squadSlots.addEventListener("click", (event) => {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    openHeroModal(card.dataset.id);
  });
  els.modalCloseBtn.addEventListener("click", closeHeroModal);
  els.heroModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-modal]")) closeHeroModal();
  });
  els.modalTeamBtn.addEventListener("click", () => {
    if (state.selectedId) toggleHero(state.selectedId);
    renderModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeHeroModal();
  });
  els.challengeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-challenge]");
    if (button) startChallenge(Number(button.dataset.challenge));
  });
}

function recruit() {
  state.roster = Array.from({ length: 8 }, (_, index) => makeHero(index));
  state.squad = [];
  state.selectedId = state.roster[0].id;
  state.results = {};
  state.logs = ["招募了 8 名候选角色。"];
  state.signalBus?.clear();
  state.units = [];
  state.running = false;
  render();
}

function makeHero(index) {
  const keys = Object.keys(ROLES);
  const roleKey = keys[Math.floor(Math.random() * keys.length)];
  const base = ROLES[roleKey];
  const kit = randomKit(roleKey, base);
  const quality = 0.88 + Math.random() * 0.28;
  const powerScore = Math.round((base.hp * 0.11 + base.power * 4.2 + base.armor * 7) * quality);
  return {
    id: `h${Date.now()}_${index}_${Math.random().toString(36).slice(2, 5)}`,
    name: `${NAMES[Math.floor(Math.random() * NAMES.length)]}${base.name}`,
    roleKey,
    roleName: base.name,
    fantasy: base.fantasy,
    icon: ROLE_ICONS[roleKey],
    hp: Math.round(base.hp * quality),
    power: Math.round(base.power * quality),
    armor: Math.round(base.armor * quality),
    range: base.range,
    smallKeys: kit.smallKeys,
    small: kit.smallKeys.map(skillNameByKey),
    passiveKey: kit.passiveKey,
    passive: skillNameByKey(kit.passiveKey),
    ultKey: kit.ultKey,
    ult: skillNameByKey(kit.ultKey),
    score: powerScore,
  };
}

function toggleHero(id) {
  selectHero(id);
  if (state.squad.includes(id)) {
    state.squad = state.squad.filter((item) => item !== id);
  } else if (state.squad.length < 4) {
    state.squad.push(id);
  }
  render();
}

function selectHero(id) {
  state.selectedId = id;
  render();
}

function openHeroModal(id) {
  state.selectedId = id;
  state.modalOpen = true;
  render();
}

function closeHeroModal() {
  state.modalOpen = false;
  renderModal();
}

function autoPick() {
  state.squad = [...state.roster].sort((a, b) => b.score - a.score).slice(0, 4).map((hero) => hero.id);
  state.selectedId = state.squad[0];
  render();
}

async function runTour() {
  if (state.squad.length !== 4 || state.running) return;
  state.results = {};
  for (const challenge of CHALLENGES) {
    await startChallenge(challenge.id, true);
    await sleep(500);
    if (state.results[challenge.id]?.result === "失败") break;
  }
}

function startChallenge(strength, silent = false) {
  if (state.squad.length !== 4 || state.running) {
    if (!silent) state.logs.unshift("需要先选满 4 人。");
    render();
    return Promise.resolve();
  }
  state.running = true;
  state.time = 0;
  state.activeChallenge = strength;
  state.logs = [`挑战强度 ${strength} 开始。`];
  const heroes = state.squad.map((id) => state.roster.find((hero) => hero.id === id));
  const challenge = CHALLENGES.find((item) => item.id === strength);
  state.units = [
    ...makeUnits("ally", heroes, strength),
    ...makeUnits("enemy", challenge.roles.map((roleKey, index) => makeEnemy(roleKey, strength, index)), strength),
  ];
  render();
  return new Promise((resolve) => {
    state.resolveBattle = resolve;
  });
}

function makeEnemy(roleKey, strength, index) {
  const base = ROLES[roleKey];
  const quality = 0.64 + strength / 120;
  return {
    id: `e${strength}_${index}`,
    name: `${base.name}${strength}`,
    roleKey,
    roleName: base.name,
    fantasy: base.fantasy,
    icon: ROLE_ICONS[roleKey],
    hp: Math.round(base.hp * quality),
    power: Math.round(base.power * quality),
    armor: Math.round(base.armor * quality),
    range: base.range,
    small: [...base.small],
    passiveKey: SHARED_SKILL_KEY_BY_NAME[base.passive] || base.passive,
    passive: base.passive,
    ult: base.ult,
    score: strength * 10,
  };
}

function makeUnits(side, heroes) {
  const form = side === "ally"
    ? [{ x: 28, y: 35, line: "前排" }, { x: 28, y: 65, line: "前排" }, { x: 14, y: 35, line: "后排" }, { x: 14, y: 65, line: "后排" }]
    : [{ x: 72, y: 35, line: "前排" }, { x: 72, y: 65, line: "前排" }, { x: 86, y: 35, line: "后排" }, { x: 86, y: 65, line: "后排" }];
  return heroes.map((hero, index) => ({
    ...hero,
    unitId: `${side}_${index}`,
    side,
    x: form[index].x,
    y: form[index].y,
    line: form[index].line,
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
    attackCd: 0.8 + index * 0.12,
    skillCd: [
      teamOpeningCooldown(hero.small[0], 1 + index * 0.3),
      teamOpeningCooldown(hero.small[1], 2.6 + index * 0.3),
    ],
    ultCd: teamOpeningCooldown(hero.ult, 14 + index * 1.6),
    focusTarget: "",
    focusHits: 0,
    deadTriggered: false,
  }));
}

function teamOpeningCooldown(skillName, fallback) {
  if (skillName === "不死战吼") return BERSERKER_MODEL.openingCooldowns?.undyingRoar ?? 8;
  const skillKey = SHARED_SKILL_KEY_BY_NAME[skillName];
  return SHARED_SKILLS.skills?.[skillKey]?.openingCooldown ?? fallback;
}

function tick(now) {
  const dt = Math.min(0.05, ((now - state.lastFrame) / 1000 || 0.016));
  state.lastFrame = now;
  if (state.running) updateBattle(dt);
  renderBattle();
  requestAnimationFrame(tick);
}

function updateBattle(dt) {
  state.time += dt;
  for (const unit of state.units.filter(alive)) {
    tickStatus(unit, dt);
    unit.attackCd -= dt * (unit.haste > 0 ? 1.4 : 1);
    unit.skillCd = unit.skillCd.map((cd) => Math.max(0, cd - dt));
    unit.ultCd = Math.max(0, unit.ultCd - dt);
    unit.haste = Math.max(0, unit.haste - dt);
    unit.slow = Math.max(0, unit.slow - dt);
    unit.guard = Math.max(0, unit.guard - dt);
    unit.taunt = Math.max(0, unit.taunt - dt);
    unit.immortal = Math.max(0, unit.immortal - dt);
    unit.lifeSteal = Math.max(0, unit.lifeSteal - dt);
    unit.bloodFury = Math.max(0, unit.bloodFury - dt);
    unit.whirlwind = Math.max(0, unit.whirlwind - dt);
    unit.roarFury = Math.max(0, unit.roarFury - dt);
    unit.retaliationTimer = Math.max(0, unit.retaliationTimer - dt);
    unit.counterCd = Math.max(0, unit.counterCd - dt);
    unit.bonusPowerTimer = Math.max(0, unit.bonusPowerTimer - dt);

    const target = chooseTarget(unit);
    if (!target) continue;
    const distance = dist(unit, target);
    if (distance > unit.range) {
      moveToward(unit, target, dt);
      continue;
    }
    if (unit.ultCd <= 0) cast(unit, target, "ult");
    else if (unit.skillCd[0] <= 0) cast(unit, target, 0);
    else if (unit.skillCd[1] <= 0) cast(unit, target, 1);
    else if (unit.attackCd <= 0) basic(unit, target);
  }
  state.signalBus?.emitHealthSnapshots(state.units, state.time);
  finishIfNeeded();
}

function tickStatus(unit, dt) {
  tickDot(unit, unit.burn, dt, 2.15, "burn");
  tickDot(unit, unit.poison, dt, 2.1, "poison");
}

function tickDot(unit, dot, dt, perStack, type) {
  if (dot.stacks <= 0) return;
  dot.time -= dt;
  dot.tick -= dt;
  if (dot.tick <= 0) {
    dot.tick = 1;
    withAction(dot.source, { tags: ["dot", "damage", type], skillName: type === "poison" ? "剧毒" : "燃烧" }, () => {
      damage(dot.source || null, unit, dot.stacks * perStack, type);
    });
  }
  if (dot.time <= 0) dot.stacks = 0;
}

function cast(unit, target, slot) {
  const skillName = slot === "ult" ? unit.ult : unit.small[slot];
  const sharedSkill = TEAM_SHARED_SKILLS[SHARED_SKILL_KEY_BY_NAME[skillName]];
  label(unit, skillName, slot === "ult");
  if (slot === "ult") unit.ultCd = sharedSkill?.cooldown ?? 24;
  else unit.skillCd[slot] = sharedSkill?.cooldown ?? cooldownFor(skillName, slot);

  if (sharedSkill) {
    emitSignal({
      kind: "skill",
      tags: ["skill", slot === "ult" ? "ultimate" : "smallSkill", "cast"],
      source: unitRef(unit),
      target: unitRef(target),
      skillKey: SHARED_SKILL_KEY_BY_NAME[skillName],
      skillName,
      meta: { slot, role: unit.roleName },
    });
    withAction(unit, { tags: ["skill", slot === "ult" ? "ultimate" : "smallSkill"], skillKey: SHARED_SKILL_KEY_BY_NAME[skillName], skillName }, () => {
      sharedSkill.cast({ unit, target, visual: true });
    });
    if (slot === "ult") triggerEncore(unit);
    return;
  }

  if (skillName === "守护") shield(unit, 58 + unit.power * 0.45, skillName, 0);
  else if (skillName === "誓卫嘲讽") shield(unit, 42 + unit.power * 0.35, skillName, 5);
  else if (skillName === "血怒斩") bloodFury(unit);
  else if (skillName === "裂骨旋风") whirlwind(unit);
  else if (["重击", "影切", "暗影收割"].includes(skillName)) slash(unit, target, "blood"), damage(unit, target, unit.power * (slot === "ult" ? 1.45 : 0.72), "physical");
  else if (["顺劈", "战旗冲锋"].includes(skillName)) enemies(unit).filter(alive).sort(byDistance(unit)).slice(0, 3).forEach((enemy) => slash(unit, enemy, "gold") || damage(unit, enemy, unit.power * 0.48, "physical"));
  else if (skillName === "万毒献祭") plagueOffering(unit);
  else if (["毒刃连刺", "腐毒烙印", "沼雾瓶"].includes(skillName)) enemies(unit).filter(alive).sort(byDistance(unit)).slice(0, skillName === "沼雾瓶" ? 4 : 1).forEach((enemy) => poison(unit, enemy, 3));
  else if (skillName === "爆裂瓶") volatileBottle(unit, target);
  else if (["余烬火球", "烈焰扩散", "流星火雨"].includes(skillName)) enemies(unit).filter(alive).sort(byDistance(target)).slice(0, slot === "ult" ? 4 : 2).forEach((enemy) => burn(unit, enemy, slot === "ult" ? 4 : 2));
  else if (skillName === "净血护符") shield(allies(unit).filter(alive).sort((a, b) => a.hpNow / a.maxHp - b.hpNow / b.maxHp)[0], 58 + unit.power * 0.44, skillName, 0);
  else if (["急救", "神圣庇护"].includes(skillName)) allies(unit).filter(alive).sort((a, b) => a.hpNow / a.maxHp - b.hpNow / b.maxHp).slice(0, slot === "ult" ? 4 : 1).forEach((ally) => heal(unit, ally, 50 + unit.power * 0.5));
  else if (skillName === "血契供奉" || skillName === "勇气和弦") buffCarry(unit, skillName);
  else if (["急板战歌", "终章强音"].includes(skillName)) allies(unit).filter(alive).forEach((ally) => { ally.haste = 5; ring(ally, "gold"); });
  else if (skillName === "猎标箭") markShot(unit, target);
  else if (skillName === "钉足箭") pinningShot(unit, target);
  else if (skillName === "箭雨") arrowStorm(unit);
  else if (skillName === "不死战吼") undyingRoar(unit);
  else if (skillName === "王旗不倒") allies(unit).filter(alive).forEach((ally) => shield(ally, 42 + unit.power * 0.3, skillName));
  else if (skillName === "终极混剂") grandMixture(unit);
  if (slot === "ult") triggerEncore(unit);
}

function basic(unit, target) {
  const isBerserker = unit.roleKey === "berserker" || unit.roleName === "狂战士" || unit.passive === "血怒引擎";
  const missingHp = isBerserker ? 1 - unit.hpNow / unit.maxHp : 0;
  const lowHpHaste = isBerserker ? 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0) : 1;
  unit.attackCd = (isBerserker ? (BERSERKER_MODEL.basicAttackCooldown ?? 1.35) : 1.35) / lowHpHaste;
  const power = teamEffectivePower(unit);
  let amount = isBerserker ? (BERSERKER_MODEL.basicFlatDamage ?? 10) + power * (BERSERKER_MODEL.basicPowerRatio ?? 0.22) : 10 + power * 0.22;
  let visible = false;
  if (unit.bloodFury > 0) {
    amount += power * (BERSERKER_RATIOS.blood ?? 0.45) * (1 + (1 - unit.hpNow / unit.maxHp) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45));
    visible = true;
  }
  if (unit.whirlwind > 0) {
    amount += power * (BERSERKER_RATIOS.whirlwind ?? 0.3);
    visible = true;
  }
  if (unit.roarFury > 0) {
    amount += power * (BERSERKER_RATIOS.roar ?? 0.35);
    visible = true;
  }
  withAction(unit, { tags: ["basic", "attack"], skillName: label, meta: { windows: teamActiveWindows(unit) } }, () => {
    damage(unit, target, amount, "physical", visible);
  });
  if (unit.passive === "血怒引擎" && unit.hpNow < unit.maxHp) {
    const leech = amount * ((BERSERKER_PASSIVE.baseLeech ?? 0.06) + (1 - unit.hpNow / unit.maxHp) * (BERSERKER_PASSIVE.missingHpLeech ?? 0.08));
    unit.hpNow = Math.min(unit.maxHp, unit.hpNow + leech);
    if (visible) floater(unit, `吸血+${Math.round(leech)}`, "heal");
  }
  if (unit.whirlwind > 0) {
    enemies(unit).filter((enemy) => alive(enemy) && enemy.unitId !== target.unitId).sort(byDistance(target)).slice(0, BERSERKER_MODEL.splashTargets ?? 2)
      .forEach((enemy) => withAction(unit, { tags: ["basic", "attack", "area", "splash"], skillName: "旋风溅射", meta: { windows: teamActiveWindows(unit) } }, () => {
        damage(unit, enemy, power * (BERSERKER_RATIOS.splash ?? 0.18), "physical", true);
      }));
  }
  if (unit.passive === "鹰眼换弦") {
    unit.focusHits = unit.focusTarget === target.unitId ? unit.focusHits + 1 : 1;
    unit.focusTarget = target.unitId;
    if (unit.focusHits >= 3) {
      unit.focusHits = 0;
      unit.skillCd = unit.skillCd.map((cd) => Math.max(0, cd - 1.8));
      floater(unit, "换弦", "heal");
    }
  }
}

function bloodFury(unit) {
  unit.bloodFury = BERSERKER_DURATIONS.bloodFury ?? 4;
  slash(unit, unit, "blood");
  ring(unit, "blood");
  floater(unit, "血怒普攻", "heal");
}

function whirlwind(unit) {
  unit.whirlwind = BERSERKER_DURATIONS.whirlwind ?? 5;
  ring(unit, "gold");
  floater(unit, "旋风架势", "shield");
}

function damage(source, target, amount, type, visible = true) {
  if (!alive(target)) return;
  const hpBefore = target.hpNow;
  let value = Math.max(1, amount - target.armor * (type === "physical" ? 0.7 : 0.35));
  if (source?.passive === "破阵步" && target.line === "前排") value *= 1.12;
  if (source?.passive === "血怒引擎") value *= 1 + (1 - source.hpNow / source.maxHp) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
  if (source?.passive === "破绽毒刃" && (target.poison.stacks > 0 || target.burn.stacks > 0)) value *= 1.18;
  if (source?.passive === "催化剂" && (target.poison.stacks > 0 || target.burn.stacks > 0 || target.mark > 0)) value *= 1.12;
  value *= SHARED_SKILLS.passiveDamageMultiplier?.(source, target, {
    statusCount: teamStatusCount,
    hpRatio: teamHpRatio,
  }) || 1;
  if (target.guard > 0) value *= 0.72;
  let blocked = 0;
  if (target.shield > 0) {
    blocked = Math.min(target.shield, value);
    target.shield -= blocked;
    value -= blocked;
  }
  if (blocked > 0) floater(target, `护盾-${Math.round(blocked)}`, "shield");
  if (blocked > 0 && target.passive === "护卫反击" && source && alive(source)) {
    const reflect = Math.max(1, blocked * 0.22);
    source.hpNow = Math.max(0, source.hpNow - reflect);
    floater(source, `反击-${Math.round(reflect)}`, "");
  }
  if (value > 0) {
    if (target.immortal > 0 && target.hpNow - value <= 1) value = Math.max(0, target.hpNow - 1);
    target.hpNow = Math.max(0, target.hpNow - value);
    if (value > 0) {
      emitSignal({
        kind: "damage",
        tags: actionTags(source, ["damage", type, blocked > 0 ? "blocked" : "", value !== amount ? "mitigated" : ""]).filter(Boolean),
        source: unitRef(source),
        target: unitRef(target),
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
      emitSignal({
        kind: "heal",
        tags: actionTags(source, ["heal", "lifeSteal"]).filter(Boolean),
        source: unitRef(source),
        target: unitRef(source),
        amount: source.hpNow - before,
        skillName: "吸血",
        hpBefore: before,
        hpAfter: source.hpNow,
      });
      if (visible) floater(source, `吸血+${Math.round(leech)}`, "heal");
    }
    const cls = type === "burn" || type === "fire" ? "fire" : type === "poison" ? "poison" : "";
    const prefix = type === "burn" ? "燃烧-" : type === "poison" ? "剧毒-" : "-";
    if (visible) floater(target, `${prefix}${Math.round(value)}`, cls);
    if (target.hpNow <= 0) onDeath(target, source);
  }
  SHARED_SKILLS.triggerReactiveEffects?.("afterDamageTaken", {
    unit: target,
    source,
    blocked,
    damageTaken: value,
    rawAmount: amount,
    type,
    visual: visible,
  }, {
    counterattack: teamCounterattack,
  });
}

function markShot(unit, target) {
  if (!target) return;
  target.mark = Math.min(6, target.mark + 1);
  beam(unit, target, "blue");
  damage(unit, target, unit.power * 0.58, "physical");
  floater(target, `猎标+1`, "shield");
}

function pinningShot(unit, target) {
  if (!target) return;
  beam(unit, target, "blue");
  const bonus = target.mark >= 3 ? unit.power * 0.25 : 0;
  damage(unit, target, unit.power * 0.52 + bonus, "physical");
  target.slow = 4;
  floater(target, target.mark >= 3 ? "钉足+破绽" : "钉足", "shield");
}

function arrowStorm(unit) {
  enemies(unit).filter(alive).forEach((enemy) => {
    beam(unit, enemy, "blue");
    const lineBonus = enemy.line === "后排" ? unit.power * 0.35 : 0;
    const markBonus = enemy.mark * unit.power * 0.06;
    damage(unit, enemy, unit.power * 0.7 + lineBonus + markBonus, "physical");
    if (enemy.mark > 0) {
      floater(enemy, `猎标清算`, "shield");
      enemy.mark = 0;
    }
  });
}

function buffCarry(unit, skillName) {
  const target = allies(unit).filter(alive).sort((a, b) => b.power - a.power)[0];
  if (!target) return;
  target.haste = 5;
  ring(target, "gold");
  floater(target, skillName === "血契供奉" ? "血契急速" : "勇气急速", "heal");
  if (skillName === "血契供奉") damage(null, unit, unit.maxHp * 0.05, "physical", false);
}

function plagueOffering(unit) {
  enemies(unit).filter(alive).forEach((enemy) => {
    if (enemy.poison.stacks <= 0) return;
    ring(enemy, "poison");
    damage(unit, enemy, 22 + enemy.poison.stacks * 9 + unit.power * 0.22, "poison");
    enemy.poison.stacks = Math.ceil(enemy.poison.stacks * 0.45);
  });
}

function volatileBottle(unit, target) {
  if (!target) return;
  const status = target.burn.stacks + target.poison.stacks + target.mark;
  ring(target, "fire");
  damage(unit, target, unit.power * 0.42 + Math.min(8, status) * 6, "fire");
}

function undyingRoar(unit) {
  unit.immortal = BERSERKER_DURATIONS.immortal ?? 6;
  unit.haste = BERSERKER_DURATIONS.haste ?? 6;
  unit.bloodFury = Math.max(unit.bloodFury, BERSERKER_DURATIONS.roarFury ?? 6);
  unit.whirlwind = Math.max(unit.whirlwind, BERSERKER_DURATIONS.roarFury ?? 6);
  unit.roarFury = BERSERKER_DURATIONS.roarFury ?? 6;
  ring(unit, "blood");
  floater(unit, "不死", "heal");
}

function cooldownFor(skillName, slot) {
  if (skillName === "血怒斩") return BERSERKER_COOLDOWNS.bloodStrike ?? 5.2;
  if (skillName === "裂骨旋风") return BERSERKER_COOLDOWNS.boneWhirl ?? 8.4;
  return slot === 0 ? 5.2 : 8.4;
}

function grandMixture(unit) {
  enemies(unit).filter(alive).forEach((enemy) => {
    const status = enemy.burn.stacks + enemy.poison.stacks + enemy.mark;
    ring(enemy, "purple");
    damage(unit, enemy, unit.power * 0.36 + Math.min(10, status) * 8, "fire");
  });
}

function triggerEncore(caster) {
  allies(caster).filter((ally) => alive(ally) && ally.passive === "返场").forEach((bard) => {
    bard.skillCd = bard.skillCd.map((cd) => Math.max(0, cd - 2));
    floater(bard, "返场", "heal");
  });
}

function onDeath(unit, killer) {
  if (unit.deadTriggered) return;
  unit.deadTriggered = true;
  if (unit.burn.stacks > 0 && killer) {
    allies(killer).filter((ally) => ally.passive === "火种共鸣" && alive(ally)).slice(0, 1).forEach((mage) => {
      enemies(mage).filter((enemy) => alive(enemy) && enemy.unitId !== unit.unitId).sort(byDistance(unit)).slice(0, 2)
        .forEach((enemy) => burn(mage, enemy, Math.max(1, Math.ceil(unit.burn.stacks * 0.25))));
    });
  }
  if (unit.poison.stacks > 0 && killer) {
    allies(killer).filter((ally) => ally.passive === "温床契约" && alive(ally)).slice(0, 1).forEach((warlock) => {
      enemies(warlock).filter((enemy) => alive(enemy) && enemy.unitId !== unit.unitId).forEach((enemy) => {
        poison(warlock, enemy, Math.max(1, Math.ceil(unit.poison.stacks * 0.2)));
      });
    });
  }
}

function shield(unit, amount, text, guardSeconds = 3) {
  if (!unit) return;
  unit.shield += amount;
  unit.guard = Math.max(unit.guard, guardSeconds);
  emitSignal({
    kind: "shield",
    tags: actionTags(null, ["shield"]).filter(Boolean),
    source: null,
    target: unitRef(unit),
    amount,
    skillName: text,
    shield: unit.shield,
  });
  floater(unit, `${text}+${Math.round(amount)}`, "shield");
  ring(unit, "blue");
}

function heal(source, target, amount) {
  const before = target.hpNow;
  target.hpNow = Math.min(target.maxHp, target.hpNow + amount);
  emitSignal({
    kind: "heal",
    tags: actionTags(source, ["heal"]).filter(Boolean),
    source: unitRef(source),
    target: unitRef(target),
    amount: target.hpNow - before,
    skillName: source?._actionSignal?.skillName || "治疗",
    hpBefore: before,
    hpAfter: target.hpNow,
  });
  floater(target, `治疗+${Math.round(amount)}`, "heal");
  if (source.passive === "净化祷言") {
    target.burn.stacks = Math.max(0, target.burn.stacks - 2);
    target.poison.stacks = Math.max(0, target.poison.stacks - 2);
    floater(target, "净化", "shield");
  }
  ring(target, "green");
}

function burn(source, target, stacks) {
  target.burn.stacks += stacks;
  target.burn.time = Math.max(target.burn.time, 6);
  target.burn.source = source;
  emitSignal({
    kind: "status",
    tags: actionTags(source, ["status", "debuff", "burn", "dotStack"]).filter(Boolean),
    source: unitRef(source),
    target: unitRef(target),
    amount: stacks,
    skillName: source?._actionSignal?.skillName || "燃烧",
    meta: { stacks: target.burn.stacks, duration: target.burn.time },
  });
  floater(target, `燃烧+${stacks}`, "fire");
  ring(target, "fire");
}

function poison(source, target, stacks) {
  target.poison.stacks = Math.min(20, target.poison.stacks + stacks);
  target.poison.time = Math.max(target.poison.time, 8);
  target.poison.source = source;
  emitSignal({
    kind: "status",
    tags: actionTags(source, ["status", "debuff", "poison", "dotStack"]).filter(Boolean),
    source: unitRef(source),
    target: unitRef(target),
    amount: stacks,
    skillName: source?._actionSignal?.skillName || "剧毒",
    meta: { stacks: target.poison.stacks, duration: target.poison.time },
  });
  floater(target, `剧毒+${stacks}`, "poison");
  ring(target, "poison");
}

function moveToward(unit, target, dt) {
  const d = dist(unit, target);
  const step = dt * (unit.slow > 0 ? 4.8 : 8);
  unit.x += ((target.x - unit.x) / d) * step;
  unit.y += ((target.y - unit.y) / d) * step;
}

function finishIfNeeded() {
  const allyAlive = state.units.some((unit) => unit.side === "ally" && alive(unit));
  const enemyAlive = state.units.some((unit) => unit.side === "enemy" && alive(unit));
  if (allyAlive && enemyAlive && state.time < 70) return;
  state.running = false;
  const leftHp = state.units.filter((unit) => unit.side === "ally").reduce((sum, unit) => sum + Math.max(0, unit.hpNow / unit.maxHp), 0);
  const rightHp = state.units.filter((unit) => unit.side === "enemy").reduce((sum, unit) => sum + Math.max(0, unit.hpNow / unit.maxHp), 0);
  const result = leftHp >= rightHp ? "胜利" : "失败";
  state.results[state.activeChallenge] = { result, time: state.time.toFixed(1) };
  state.logs.unshift(`强度 ${state.activeChallenge}：${result}`);
  state.battleState = result;
  if (state.resolveBattle) state.resolveBattle();
  state.resolveBattle = null;
  render();
}

function render() {
  renderSquad();
  renderRoster();
  renderChallenges();
  renderDetail();
  renderModal();
  renderBattle();
}

function renderSquad() {
  els.squadSummary.textContent = `${state.squad.length} / 4`;
  const cards = state.squad.map((id) => state.roster.find((hero) => hero.id === id)).map(slotCard).join("");
  const empties = Array.from({ length: 4 - state.squad.length }, (_, i) => `<div class="slot-card empty">空位 ${i + 1}</div>`).join("");
  els.squadSlots.innerHTML = cards + empties;
}

function slotCard(hero) {
  return `<article class="slot-card" data-id="${hero.id}">
    <div class="avatar">${hero.icon}</div>
    <div><span class="name">${hero.name}</span><span class="meta">${hero.roleName} · ${hero.fantasy}</span></div>
    <span class="power">${hero.score}</span>
  </article>`;
}

function renderRoster() {
  els.rosterGrid.innerHTML = state.roster.map((hero) => {
    const inSquad = state.squad.includes(hero.id);
    return `<article class="hero-card ${inSquad ? "in-squad" : ""} ${state.selectedId === hero.id ? "selected" : ""}" data-id="${hero.id}">
      <div class="avatar">${hero.icon}</div>
      <div>
        <span class="name">${hero.name}</span>
        <span class="meta">${hero.roleName} · 战力 ${hero.score}</span>
        <div class="tags"><span class="tag">${hero.passive}</span><span class="tag">${hero.ult}</span></div>
      </div>
      <button type="button">${inSquad ? "移出" : "入队"}</button>
    </article>`;
  }).join("");
}

function renderChallenges() {
  els.challengeList.innerHTML = CHALLENGES.map((item) => {
    const result = state.results[item.id];
    const active = state.activeChallenge === item.id && state.running;
    const cls = active ? "active" : result?.result === "胜利" ? "win" : result?.result === "失败" ? "lose" : "";
    return `<article class="challenge-card ${cls}">
      <header><strong>${item.name}</strong><span class="power">${item.id}</span></header>
      <div class="result">${result ? `${result.result} · ${result.time}s` : item.roles.map((roleKey) => ROLES[roleKey].name).join(" / ")}</div>
      <button type="button" data-challenge="${item.id}">${active ? "挑战中" : "挑战"}</button>
    </article>`;
  }).join("");
}

function renderDetail() {
  const hero = state.roster.find((item) => item.id === state.selectedId);
  if (!hero) return;
  els.selectedName.textContent = `${hero.name} · ${hero.roleName}`;
  els.selectedDetail.textContent = `小技：${hero.small.join(" / ")}。被动：${hero.passive}。大招：${hero.ult}。生命 ${hero.hp}，攻击 ${hero.power}，护甲 ${hero.armor}。`;
}

function renderModal() {
  const hero = state.roster.find((item) => item.id === state.selectedId);
  els.heroModal.classList.toggle("hidden", !state.modalOpen || !hero);
  els.heroModal.setAttribute("aria-hidden", state.modalOpen && hero ? "false" : "true");
  if (!hero || !state.modalOpen) return;
  const inSquad = state.squad.includes(hero.id);
  els.modalHeroIcon.textContent = hero.icon;
  els.modalHeroName.textContent = hero.name;
  els.modalHeroMeta.textContent = `${hero.roleName} · ${hero.fantasy}`;
  els.modalHeroPower.textContent = hero.score;
  els.modalSkillGrid.innerHTML = [
    profileBox(hero),
    skillBox("小技能", hero.small[0], skillHint(hero.small[0])),
    skillBox("小技能", hero.small[1], skillHint(hero.small[1])),
    skillBox("被动", hero.passive, passiveHint(hero.passive)),
    skillBox("大招", hero.ult, ultHint(hero.ult)),
  ].join("");
  els.modalStats.innerHTML = `
    <span>生命 <strong>${hero.hp}</strong></span>
    <span>攻击 <strong>${hero.power}</strong></span>
    <span>护甲 <strong>${hero.armor}</strong></span>
    <span>射程 <strong>${hero.range}</strong></span>
  `;
  els.modalTeamBtn.textContent = inSquad ? "移出小队" : state.squad.length >= 4 ? "小队已满" : "加入小队";
  els.modalTeamBtn.disabled = !inSquad && state.squad.length >= 4;
}

function skillBox(type, name, desc) {
  return `<article class="skill-box"><span>${type}</span><strong>${name}</strong><p>${desc}</p></article>`;
}

function profileBox(hero) {
  const data = ROLE_PROFILES[hero.roleKey];
  if (!data) return "";
  return `<article class="profile-box">
    <p>${data.summary}</p>
    ${profileGroup("输出 / 贡献构成", data.output)}
    ${profileGroup("生存构成", data.survival)}
  </article>`;
}

function profileGroup(title, rows) {
  return `<section class="profile-group">
    <strong>${title}</strong>
    ${rows.map(([label, value, tone]) => `<div class="profile-row ${tone}">
      <span>${label}</span>
      <b>${value}%</b>
      <i style="width:${value}%"></i>
    </div>`).join("")}
  </section>`;
}

function skillHint(name) {
  const shared = sharedHintByName(name);
  if (shared) return shared;
  return ({
    "守护": "给自己获得 58 + 攻击力45% 的护盾，不附带减伤，偏单纯吸收伤害。",
    "誓卫嘲讽": "给自己获得 42 + 攻击力35% 的护盾，并减伤 28%，持续 5 秒，偏站桩承压。",
    "重击": "对当前目标造成攻击力72% 的物理伤害。",
    "顺劈": "对最近 3 个敌人各造成攻击力48% 的物理伤害。",
    "血怒斩": "进入 4 秒血怒状态；期间每次普攻额外造成攻击力45% 伤害，生命越低额外伤害越高。",
    "裂骨旋风": "进入 5 秒旋风架势；期间普攻主目标额外 +攻击力30%，并溅射附近 2 个敌人各攻击力18%。",
    "毒刃连刺": "给最近 1 个敌人叠加 3 层剧毒，剧毒每秒造成层数 x 2.1 伤害，最多 20 层。",
    "影切": "对当前低血目标造成攻击力72% 的物理伤害。",
    "猎标箭": "造成攻击力58% 的物理伤害，并叠 1 层猎标，最多 6 层；猎标本身不直接增伤。",
    "钉足箭": "造成攻击力52% 的物理伤害并减速 4 秒；目标有 3 层猎标时额外造成攻击力25%。",
    "余烬火球": "给最近 2 个敌人各叠加 2 层燃烧；燃烧无上限，每秒造成层数 x 2.15 伤害。",
    "烈焰扩散": "给最近 2 个敌人各叠加 2 层燃烧，用来扩大燃烧面。",
    "急救": "治疗当前生命比例最低的友军，治疗量为 50 + 攻击力50%。",
    "净血护符": "给当前生命比例最低的友军获得 58 + 攻击力44% 的护盾，不治疗生命。",
    "腐毒烙印": "给最近 1 个敌人叠加 3 层剧毒，持续 8 秒。",
    "血契供奉": "牺牲自身约 5% 最大生命，让攻击最高的友军急速 5 秒。",
    "急板战歌": "让全体友军急速 5 秒，急速期间攻击冷却流速提高 40%。",
    "勇气和弦": "让攻击最高的友军急速 5 秒，适合强化单核。",
    "沼雾瓶": "给最多 4 个敌人各叠加 3 层剧毒，快速铺异常。",
    "爆裂瓶": "造成攻击力42% + 异常层数加成的火焰伤害，异常层数最多计算 8 层。",
  })[name] || "职业技能。";
}

function passiveHint(name) {
  const shared = sharedHintByName(name);
  if (shared) return shared;
  return ({
    "护卫反击": "护盾吸收伤害时，立刻反击来源，造成吸收量22% 的真实反击伤害。",
    "破阵步": "攻击前排目标时，最终伤害提高 12%。",
    "血怒引擎": "低血时强化血怒普攻，并让普攻按已造成伤害吸血；越残吸血越高。",
    "破绽毒刃": "攻击带有燃烧或剧毒的目标时，最终伤害提高 18%。",
    "鹰眼换弦": "连续普攻同一目标 3 次后，小技能冷却各缩短 1.8 秒；切换目标会重置。",
    "火种共鸣": "燃烧目标死亡时，把其燃烧层数约 25% 扩散给附近 2 个敌人。",
    "净化祷言": "牧师治疗时，额外移除目标 2 层燃烧和 2 层剧毒。",
    "温床契约": "中毒目标死亡时，把其剧毒层数约 20% 扩散给其他敌人。",
    "返场": "任意友军释放大招后，自身两个小技能冷却各缩短 2 秒。",
    "催化剂": "攻击带有燃烧、剧毒或猎标的目标时，最终伤害提高 12%。",
  })[name] || "职业被动。";
}

function ultHint(name) {
  const shared = sharedHintByName(name);
  if (shared) return shared;
  return ({
    "王旗不倒": "给全体友军获得 42 + 攻击力30% 的护盾，并减伤 28%，持续 3 秒。",
    "战旗冲锋": "对最近 3 个敌人各造成攻击力48% 的物理伤害，并触发返场。",
    "不死战吼": "自身 6 秒内不会低于 1 点生命，并同时获得急速、血怒、旋风架势和攻击力35% 普攻附伤。",
    "暗影收割": "对当前低血目标造成攻击力145% 的物理伤害。",
    "箭雨": "对全体敌人造成攻击力70% 物理伤害；后排额外 +35%；每层猎标额外 +6% 并清除猎标。",
    "流星火雨": "给全体敌人各叠加 4 层燃烧，作为无上限燃烧爆发入口。",
    "神圣庇护": "治疗全体友军，治疗量为 50 + 攻击力50%，并触发净化祷言。",
    "万毒献祭": "引爆所有中毒敌人，造成 22 + 毒层 x 9 + 攻击力22% 的剧毒伤害，并保留 45% 毒层。",
    "终章强音": "让全体友军急速 5 秒，并触发返场节奏。",
    "终极混剂": "对全体敌人造成攻击力36% + 异常层数加成的火焰伤害，最多计算 10 层异常。",
  })[name] || "职业大招。";
}

function sharedHintByName(name) {
  return Object.values(SHARED_SKILLS.skills || {}).find((skill) => skill.name === name)?.desc || "";
}

function renderBattle() {
  els.battleState.textContent = state.running ? `强度 ${state.activeChallenge} 挑战中` : (state.battleState || "待命");
  els.unitLayer.innerHTML = state.units.map((unit) => `<div class="unit ${unit.side === "enemy" ? "enemy" : ""} ${alive(unit) ? "" : "dead"}" style="left:${unit.x}%;top:${unit.y}%">
    <div class="avatar">${unit.icon}</div>
    <div class="unit-name">${unit.name}</div>
    <div class="bar"><span style="width:${Math.max(0, unit.hpNow / unit.maxHp * 100)}%"></span></div>
  </div>`).join("");
  els.battleLog.innerHTML = state.logs.slice(0, 12).map((item) => `<div>${item}</div>`).join("");
}

function chooseTarget(unit) {
  const foes = enemies(unit).filter(alive);
  if (!foes.length) return null;
  const taunters = unit.range < 20 ? foes.filter((foe) => foe.taunt > 0) : [];
  if (taunters.length) return taunters.sort(byDistance(unit))[0];
  if (unit.roleKey === "assassin") return foes.sort((a, b) => a.hpNow / a.maxHp - b.hpNow / b.maxHp)[0];
  const front = foes.filter((foe) => foe.line === "前排");
  return (front.length && unit.range < 30 ? front : foes).sort(byDistance(unit))[0];
}
function allies(unit) { return state.units.filter((item) => item.side === unit.side); }
function enemies(unit) { return state.units.filter((item) => item.side !== unit.side); }
function alive(unit) { return unit && unit.hpNow > 0; }
function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function byDistance(unit) { return (a, b) => dist(unit, a) - dist(unit, b); }
function teamHpRatio(unit) { return unit.hpNow / unit.maxHp; }
function teamStatusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slow > 0 ? 2 : 0) + (unit.mark || 0); }
function teamEffectivePower(unit) { return unit.power + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0); }
function teamLowestEnemy(unit) { return enemies(unit).filter(alive).sort((a, b) => teamHpRatio(a) - teamHpRatio(b))[0]; }
function teamLowestHpAlly(unit) { return allies(unit).filter(alive).sort((a, b) => teamHpRatio(a) - teamHpRatio(b))[0]; }
function teamCarryAlly(unit) { return allies(unit).filter(alive).sort((a, b) => teamEffectivePower(b) - teamEffectivePower(a))[0]; }
function teamHit(source, target, amount, type, text, visible) { damage(source, target, amount, type, visible); if (visible) label(source, text); }
function teamShield(unit, amount, text) { shield(unit, amount, text, 0); }
function teamHealUnit(target, amount) { heal(target, target, amount); }
function teamAddPoison(target, stacks, time, source) { poison(source, target, stacks); target.poison.time = Math.max(target.poison.time, time); }
function teamAddBurn(target, stacks, time, source) { burn(source, target, stacks); target.burn.time = Math.max(target.burn.time, time); }
function teamTakeRaw(target, amount) { target.hpNow = Math.max(1, target.hpNow - amount); }
function teamFloater(unit, text, tone) { floater(unit, text, tone); }
function teamCounterattack(unit, source, effect, context = {}) {
  if (!alive(unit) || !alive(source) || (unit.counterCd || 0) > 0) return;
  unit.counterCd = effect.cooldown || 0;
  const amount = (effect.flat || 0)
    + teamEffectivePower(unit) * (effect.power || 0)
    + (context.blocked || 0) * (effect.blockedRatio || 0);
  withAction(unit, {
    tags: ["counter", "reactive"],
    skillKey: unit.passiveKey || SHARED_SKILL_KEY_BY_NAME[unit.passive] || unit.passive,
    skillName: effect.label || "反击",
    meta: { blockedTrigger: context.blocked || 0 },
  }, () => damage(unit, source, amount, "physical", context.visual));
  if (context.visual) floater(unit, effect.label || "反击", "shield");
}
function unitRef(unit) { return SIGNALS.unitRef ? SIGNALS.unitRef(unit) : unit ? { id: unit.unitId || unit.id, name: unit.name, side: unit.side, role: unit.roleName } : null; }
function emitSignal(signal) {
  if (!state.signalBus) return;
  state.signalBus.emit({ time: state.time, ...signal });
}
function emitTeamEffectSignal(signal) {
  emitSignal({
    ...signal,
    source: unitRef(signal.source),
    target: unitRef(signal.target),
    skillKey: signal.source?._actionSignal?.skillKey || null,
    skillName: signal.source?._actionSignal?.skillName || "",
  });
}
function withAction(unit, action, fn) {
  if (!unit) return fn();
  const previous = unit._actionSignal;
  unit._actionSignal = action;
  try {
    return fn();
  } finally {
    unit._actionSignal = previous;
  }
}
function actionTags(source, tags) {
  return [...(source?._actionSignal?.tags || []), ...tags];
}
function teamActiveWindows(unit) {
  return [
    unit.bloodFury > 0 ? "bloodFury" : "",
    unit.whirlwind > 0 ? "whirlwind" : "",
    unit.roarFury > 0 ? "roarFury" : "",
    unit.haste > 0 ? "haste" : "",
  ].filter(Boolean);
}
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

function label(unit, text, ult = false) {
  const node = document.createElement("div");
  node.className = `skill-label ${ult ? "ult" : ""}`;
  node.textContent = text;
  node.style.left = `${unit.x}%`;
  node.style.top = `${unit.y - 10}%`;
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), ult ? 1050 : 780);
}

function floater(unit, text, cls = "") {
  const node = document.createElement("div");
  node.className = `floater ${cls}`;
  node.textContent = text;
  node.style.left = `${unit.x}%`;
  node.style.top = `${unit.y}%`;
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 900);
}

function ring(unit, color = "gold") {
  const node = document.createElement("div");
  node.className = `vfx-ring vfx-${color}`;
  node.style.left = `${unit.x}%`;
  node.style.top = `${unit.y}%`;
  node.style.setProperty("--scale", "1");
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 720);
}

function slash(source, target, color = "gold") {
  const node = document.createElement("img");
  node.className = `vfx-slash vfx-${color}`;
  node.src = `${SLASH_BASE}/slash_02_a.png`;
  node.style.left = `${(source.x + target.x) / 2}%`;
  node.style.top = `${(source.y + target.y) / 2}%`;
  node.style.setProperty("--angle", `${Math.atan2(target.y - source.y, target.x - source.x)}rad`);
  node.style.setProperty("--scale", "1");
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 480);
}

function beam(source, target, color = "blue") {
  const node = document.createElement("div");
  node.className = `vfx-beam vfx-${color}`;
  const length = dist(source, target);
  node.style.left = `${source.x}%`;
  node.style.top = `${source.y}%`;
  node.style.width = `${length}%`;
  node.style.transform = `rotate(${Math.atan2(target.y - source.y, target.x - source.x)}rad)`;
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 360);
}

setup();
