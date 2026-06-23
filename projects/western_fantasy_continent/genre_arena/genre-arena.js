const ICON_BASE = "https://game-icons.net/icons/000000/ffffff/1x1/lorc";
const VFX_BASE = "/effect_lab/assets/brackeys";

const TYPE = { SMALL: "小技能", PASSIVE: "被动", ULT: "大招" };
const TEAM_SIZE = 4;
const MAX_TIME = 75;
const SHARED_SKILLS = window.GAME_SKILL_DATA || {};
const BERSERKER_SHARED = SHARED_SKILLS.roles?.berserker || {};
const BERSERKER_MODEL = SHARED_SKILLS.berserkerModel || {};
const BERSERKER_RATIOS = BERSERKER_MODEL.ratios || {};
const BERSERKER_DURATIONS = BERSERKER_MODEL.durations || {};
const BERSERKER_COOLDOWNS = BERSERKER_MODEL.cooldowns || {};
const BERSERKER_PASSIVE = BERSERKER_MODEL.passive || {};
const SIGNALS = window.GAME_COMBAT_SIGNALS || {};

const VFX_SHEETS = {
  impact: sheet("predrawn/impact_white_6x4.png", 6, 4, 24),
  bigHit: sheet("predrawn/big_hit_6x5.png", 6, 5, 30),
  blood: sheet("predrawn/blood_impact_6x5.png", 6, 5, 30),
  explosion: sheet("predrawn/explosion_6x5.png", 6, 5, 30),
  fireRing: sheet("predrawn/fire_ring_6x5.png", 6, 5, 30),
  electricRing: sheet("predrawn/electric_ring_6x5.png", 6, 5, 30),
  charge: sheet("predrawn/charge_7x6.png", 7, 6, 42),
  vortex: sheet("predrawn/vortex_6x5.png", 6, 5, 30),
  wavyBlue: sheet("predrawn/wavy_blue_6x5.png", 6, 5, 30),
  wavyPurple: sheet("predrawn/wavy_purple_6x5.png", 6, 5, 30),
};

const VFX_IMAGES = {
  slash01: `${VFX_BASE}/particles/alpha/slash_01_a.png`,
  slash02: `${VFX_BASE}/particles/alpha/slash_02_a.png`,
  slash03: `${VFX_BASE}/particles/alpha/slash_03_a.png`,
  slash04: `${VFX_BASE}/particles/alpha/slash_04_a.png`,
  fire01: `${VFX_BASE}/particles/alpha/fire_01_a.png`,
  flame01: `${VFX_BASE}/particles/alpha/flame_01_a.png`,
  spark01: `${VFX_BASE}/particles/alpha/spark_01_a.png`,
  magic01: `${VFX_BASE}/particles/alpha/magic_01_a.png`,
  smoke01: `${VFX_BASE}/particles/alpha/smoke_01_a.png`,
};

const SKILL_FX = {
  guard: { kind: "shield", at: "self", sheet: "charge", color: "blue" },
  tauntLine: { kind: "shield", at: "self", sheet: "electricRing", color: "gold" },
  powerStrike: { kind: "slash", at: "target", sheet: "bigHit", image: "slash02", color: "gold" },
  cleave: { kind: "cleave", at: "target", sheet: "impact", image: "slash01", color: "gold" },
  bloodStrike: { kind: "slash", at: "target", sheet: "blood", image: "slash04", color: "blood" },
  boneWhirl: { kind: "whirl", at: "self", sheet: "vortex", image: "slash03", color: "blood" },
  toxicStabs: { kind: "stab", at: "target", sheet: "blood", image: "slash01", color: "poison" },
  shadowCut: { kind: "dash", at: "target", sheet: "wavyPurple", image: "slash04", color: "shadow" },
  markShot: { kind: "projectile", at: "target", sheet: "impact", image: "spark01", color: "blue" },
  pinningArrow: { kind: "projectile", at: "target", sheet: "wavyBlue", image: "spark01", color: "ice" },
  fireball: { kind: "projectile", at: "target", sheet: "explosion", image: "fire01", color: "fire" },
  emberSpread: { kind: "aoe", at: "enemyCenter", sheet: "fireRing", image: "flame01", color: "fire" },
  heal: { kind: "heal", at: "lowestAlly", sheet: "charge", image: "magic01", color: "heal" },
  bloodCharm: { kind: "shield", at: "lowestAlly", sheet: "charge", color: "blue" },
  venomBrand: { kind: "aoe", at: "target", sheet: "wavyPurple", image: "smoke01", color: "poison" },
  bloodContract: { kind: "buff", at: "carryAlly", sheet: "blood", image: "magic01", color: "blood" },
  tempoSong: { kind: "teamBuff", at: "teamCenter", sheet: "electricRing", image: "magic01", color: "gold" },
  courageChord: { kind: "buff", at: "carryAlly", sheet: "charge", image: "magic01", color: "gold" },
  miasmaFlask: { kind: "aoe", at: "enemyCenter", sheet: "wavyPurple", image: "smoke01", color: "poison" },
  volatileBottle: { kind: "aoe", at: "target", sheet: "explosion", image: "fire01", color: "fire" },
  frostNova: { kind: "aoe", at: "enemyCenter", sheet: "wavyBlue", color: "ice" },
  bannerWall: { kind: "teamBuff", at: "teamCenter", sheet: "electricRing", color: "gold", ultimate: true },
  warBanner: { kind: "cleave", at: "enemyCenter", sheet: "bigHit", image: "slash02", color: "gold", ultimate: true },
  undyingRoar: { kind: "buff", at: "self", sheet: "blood", color: "blood", ultimate: true },
  shadowHarvest: { kind: "dash", at: "target", sheet: "wavyPurple", image: "slash04", color: "shadow", ultimate: true },
  arrowStorm: { kind: "rain", at: "enemyCenter", sheet: "impact", image: "spark01", color: "blue", ultimate: true },
  meteorRain: { kind: "rain", at: "enemyCenter", sheet: "explosion", image: "fire01", color: "fire", ultimate: true },
  sanctuary: { kind: "teamBuff", at: "teamCenter", sheet: "charge", color: "heal", ultimate: true },
  plagueOffering: { kind: "aoe", at: "enemyCenter", sheet: "vortex", image: "smoke01", color: "poison", ultimate: true },
  crescendo: { kind: "teamBuff", at: "teamCenter", sheet: "electricRing", image: "magic01", color: "gold", ultimate: true },
  grandMixture: { kind: "aoe", at: "enemyCenter", sheet: "vortex", image: "magic01", color: "arcane", ultimate: true },
};

function sheet(path, cols, rows, frames) {
  return { src: `${VFX_BASE}/${path}`, cols, rows, frames };
}

const state = {
  running: false,
  speed: 1,
  time: 0,
  lastFrame: 0,
  teams: { left: null, right: null },
  units: [],
  logs: [],
  signalBus: SIGNALS.createCombatSignalBus ? SIGNALS.createCombatSignalBus() : null,
  nextId: 1,
  selectedPreset: { left: "poisonBloom", right: "ironWall" },
  balanceRows: [],
};

const LOCAL_ROLE_KITS = {
  knight: {
    name: "铁壁骑士", role: "骑士", fantasy: "站住、挡住、反打", hp: 350, power: 34, armor: 13, range: 11, icon: "checked-shield",
    kit: { small1: "guard", small2: "tauntLine", passive: "fortressStance", ultimate: "bannerWall" },
  },
  warrior: {
    name: "前锋战士", role: "战士", fantasy: "稳健前排，压低敌方阵线", hp: 345, power: 56, armor: 12, range: 13, icon: "hammer-drop",
    kit: { small1: "powerStrike", small2: "cleave", passive: "lineBreaker", ultimate: "warBanner" },
  },
  berserker: {
    name: BERSERKER_SHARED.arenaName || "赤狮狂战",
    role: BERSERKER_SHARED.name || "狂战士",
    fantasy: BERSERKER_SHARED.arenaFantasy || "技能开窗口，越砍越疯，吃急速和吸血翻盘",
    hp: BERSERKER_SHARED.stats?.hp ?? 330,
    power: BERSERKER_SHARED.stats?.power ?? 66,
    armor: BERSERKER_SHARED.stats?.armor ?? 8,
    range: BERSERKER_SHARED.stats?.range ?? 12,
    icon: BERSERKER_SHARED.icon || "axe-swing",
    kit: { small1: "bloodStrike", small2: "boneWhirl", passive: "rageEngine", ultimate: "undyingRoar" },
  },
  assassin: {
    name: "毒刃刺客", role: "刺客", fantasy: "贴脸叠层，低血收割", hp: 292, power: 66, armor: 7, range: 12, icon: "daggers",
    kit: { small1: "toxicStabs", small2: "shadowCut", passive: "executionSense", ultimate: "shadowHarvest" },
  },
  ranger: {
    name: "月弦游侠", role: "游侠", fantasy: "标记单点，越射越准", hp: 285, power: 58, armor: 7, range: 38, icon: "arrow-flights",
    kit: { small1: "markShot", small2: "pinningArrow", passive: "duelistFocus", ultimate: "arrowStorm" },
  },
  mage: {
    name: "烬火法师", role: "法师", fantasy: "点燃、扩散、爆燃", hp: 225, power: 50, armor: 4, range: 38, icon: "fireball",
    kit: { small1: "fireball", small2: "emberSpread", passive: "kindlingEcho", ultimate: "meteorRain" },
  },
  priest: {
    name: "银誓牧师", role: "牧师", fantasy: "保核心，续航和护盾", hp: 285, power: 44, armor: 6, range: 35, icon: "checked-shield",
    kit: { small1: "heal", small2: "bloodCharm", passive: "afterglowGrace", ultimate: "sanctuary" },
  },
  warlock: {
    name: "灰契术士", role: "术士", fantasy: "献祭、诅咒、毒爆", hp: 320, power: 61, armor: 8, range: 34, icon: "poison-bottle",
    kit: { small1: "venomBrand", small2: "bloodContract", passive: "hotbedPact", ultimate: "plagueOffering" },
  },
  bard: {
    name: "晨歌诗人", role: "吟游诗人", fantasy: "全队节奏窗口", hp: 285, power: 45, armor: 7, range: 36, icon: "guitar",
    kit: { small1: "tempoSong", small2: "courageChord", passive: "encore", ultimate: "crescendo" },
  },
  alchemist: {
    name: "沼雾炼金师", role: "炼金师", fantasy: "铺场、瓶剂、异常放大", hp: 285, power: 46, armor: 7, range: 35, icon: "fizzing-flask",
    kit: { small1: "miasmaFlask", small2: "volatileBottle", passive: "catalyst", ultimate: "grandMixture" },
  },
};

const LOCAL_SKILLS = {
  guard: skill("守护", TYPE.SMALL, "骑士", 8, "checked-shield", "给自己护盾，拖慢爆发队。", ({ unit }) => shield(unit, 48 + unit.power * 0.34, "守护")),
  tauntLine: skill("誓卫嘲讽", TYPE.SMALL, "骑士", 10, "shield-reflect", "嘲讽附近敌人并减伤。", ({ unit }) => { unit.guardTimer = 5; shield(unit, 55 + unit.power * 0.35, "誓卫"); }),
  powerStrike: skill("重击", TYPE.SMALL, "战士", 5, "hammer-drop", "稳定单体物理伤害。", ({ unit, target }) => hit(unit, target, 34 + unit.power * 0.48, "physical", "重击")),
  cleave: skill("顺劈", TYPE.SMALL, "战士", 7, "sword-slice", "打前排附近两人。", ({ unit, target }) => enemiesOf(unit).filter(isAlive).sort(byDistance(unit)).slice(0, 2).forEach((enemy) => hit(unit, enemy, 24 + unit.power * 0.32, "physical", "顺劈"))),
  bloodStrike: skill("血怒斩", TYPE.SMALL, "狂战士", BERSERKER_COOLDOWNS.bloodStrike ?? 5.2, "bloody-sword", sharedSkillDesc("bloodStrike", "进入血怒窗口，强化接下来的普攻。"), ({ unit }) => { unit.bloodFuryTimer = BERSERKER_DURATIONS.bloodFury ?? 4; floater(unit, "血怒普攻", "heal"); }),
  boneWhirl: skill("裂骨旋风", TYPE.SMALL, "狂战士", BERSERKER_COOLDOWNS.boneWhirl ?? 8.4, "spinning-sword", sharedSkillDesc("boneWhirl", "进入旋风架势，普攻追加主目标附伤和溅射。"), ({ unit }) => { unit.whirlwindTimer = BERSERKER_DURATIONS.whirlwind ?? 5; floater(unit, "旋风架势", "shield"); }),
  toxicStabs: skill("毒刃连刺", TYPE.SMALL, "刺客", 4, "daggers", "快速刺击并叠低额毒。", ({ unit, target }) => { hit(unit, target, 14 + unit.power * 0.24, "physical", "毒刃"); addPoison(target, 2, 6, unit); }),
  shadowCut: skill("影切", TYPE.SMALL, "刺客", 6, "sprint", "跳向低血目标。", ({ unit }) => { const target = lowestEnemy(unit); if (target) hit(unit, target, 24 + unit.power * 0.38 + (1 - hpRatio(target)) * 34, "shadow", "影切"); }),
  markShot: skill("猎标箭", TYPE.SMALL, "游侠", 5, "targeted", "标记并单点增伤。", ({ unit, target }) => { target.mark = Math.min(6, (target.mark || 0) + 1); hit(unit, target, 24 + unit.power * 0.34 + target.mark * 5, "physical", "猎标箭"); }),
  pinningArrow: skill("钉足箭", TYPE.SMALL, "游侠", 8, "arrowed", "减速并压制前排。", ({ unit, target }) => { target.slowTimer = 4; hit(unit, target, 28 + unit.power * 0.3, "physical", "钉足箭"); }),
  fireball: skill("余烬火球", TYPE.SMALL, "法师", 6, "fireball", "单体火焰并点燃。", ({ unit, target }) => { hit(unit, target, 19 + unit.power * 0.25, "fire", "火球"); addBurn(target, 2, 6, unit); }),
  emberSpread: skill("烈焰扩散", TYPE.SMALL, "法师", 9, "fire-zone", "燃烧目标向附近扩散。", ({ unit }) => enemiesOf(unit).filter((e) => isAlive(e) && e.burn.stacks > 0).slice(0, 3).forEach((enemy) => { hit(unit, enemy, 6 + enemy.burn.stacks * 4, "fire", "扩散"); addBurn(enemy, 1, 5, unit); })),
  heal: skill("急救", TYPE.SMALL, "牧师", 7, "checked-shield", "治疗最低血友军。", ({ unit }) => healUnit(lowestHpAlly(unit), 48 + unit.power * 0.42, "急救")),
  bloodCharm: skill("净血护符", TYPE.SMALL, "牧师", 10, "checked-shield", "护盾并降低 DOT 压力。", ({ unit }) => { const ally = lowestHpAlly(unit); if (!ally) return; shield(ally, 58 + unit.power * 0.44, "净血"); ally.dotResistTimer = 5; }),
  venomBrand: skill("腐毒烙印", TYPE.SMALL, "术士", 6, "poison-bottle", "单体上毒，已有毒则延长。", ({ unit, target }) => { addPoison(target, 4, 8, unit); hit(unit, target, 14 + unit.power * 0.2, "poison", "腐毒"); }),
  bloodContract: skill("血契供奉", TYPE.SMALL, "术士", 8, "bleeding-heart", "牺牲自己，强化最高攻击友军。", ({ unit }) => { const ally = carryAlly(unit); if (!ally) return; takeRaw(unit, unit.maxHp * 0.05, null, "blood"); ally.bonusPowerTimer = 6; ally.bonusPower = Math.max(ally.bonusPower || 0, 16); floater(ally, "血契", "heal"); }),
  tempoSong: skill("急板战歌", TYPE.SMALL, "吟游诗人", 9, "musical-notes", "全队加速一小段窗口。", ({ unit }) => alliesOf(unit).filter(isAlive).forEach((ally) => { ally.hasteTimer = 5; floater(ally, "急板", "heal"); })),
  courageChord: skill("勇气和弦", TYPE.SMALL, "吟游诗人", 7, "guitar", "给攻击最高友军增伤。", ({ unit }) => { const ally = carryAlly(unit); if (ally) { ally.bonusPowerTimer = 6; ally.bonusPower = Math.max(ally.bonusPower || 0, 18); floater(ally, "勇气", "heal"); } }),
  miasmaFlask: skill("沼雾瓶", TYPE.SMALL, "炼金师", 10, "fizzing-flask", "敌方全体少量铺毒。", ({ unit }) => enemiesOf(unit).filter(isAlive).forEach((enemy) => { addPoison(enemy, 2, 7, unit); hit(unit, enemy, 5 + unit.power * 0.08, "poison", "沼雾"); })),
  volatileBottle: skill("爆裂瓶", TYPE.SMALL, "炼金师", 8, "round-bottom-flask", "对异常目标额外伤害。", ({ unit, target }) => hit(unit, target, 18 + unit.power * 0.2 + Math.min(8, statusCount(target)) * 6, "fire", "爆裂瓶")),
  frostNova: skill("霜环", TYPE.SMALL, "法师", 10, "ice-bolt", "群体减速，克制近战突进。", ({ unit }) => enemiesOf(unit).filter(isAlive).sort(byDistance(unit)).slice(0, 3).forEach((enemy) => { enemy.slowTimer = 7; hit(unit, enemy, 22 + unit.power * 0.25, "ice", "霜环"); })),

  fortressStance: passive("坚守阵线", "骑士", "shield", "护盾效果提高，低血更硬。"),
  lineBreaker: passive("破阵步", "战士", "swordman", "攻击前排时小幅增伤。"),
  rageEngine: passive("血怒引擎", "狂战士", "rage", sharedSkillDesc("rageEngine", "低血时强化普攻并吸血。")),
  executionSense: passive("处决嗅觉", "刺客", "death-note", "攻击低血或异常目标增伤。"),
  duelistFocus: passive("决斗专注", "游侠", "bullseye", "同一目标标记越高越强。"),
  kindlingEcho: passive("火种共鸣", "法师", "burning-embers", "燃烧目标死亡时溅射火焰。"),
  afterglowGrace: passive("余光恩典", "牧师", "holy-symbol", "治疗溢出转护盾。"),
  hotbedPact: passive("温床契约", "术士", "virus", "中毒敌人死亡时余毒扩散。"),
  encore: passive("返场", "吟游诗人", "double-quaver", "友军释放大招后缩短小技能冷却。"),
  catalyst: passive("催化剂", "炼金师", "chemical-drop", "异常状态伤害小幅提高。"),

  bannerWall: ult("王旗不倒", "骑士", 34, "shield-bash", "全队护盾与短暂减伤。", ({ unit }) => alliesOf(unit).filter(isAlive).forEach((ally) => { shield(ally, 58 + unit.power * 0.38, "王旗"); ally.guardTimer = 3; })),
  warBanner: ult("战旗冲锋", "战士", 28, "war-axe", "全队前排输出窗口。", ({ unit }) => { alliesOf(unit).filter(isAlive).forEach((ally) => ally.bonusPowerTimer = 5); enemiesOf(unit).filter(isAlive).sort(byDistance(unit)).slice(0, 3).forEach((enemy) => hit(unit, enemy, 32 + unit.power * 0.34, "physical", "冲锋")); }),
  undyingRoar: ult("不死战吼", "狂战士", BERSERKER_COOLDOWNS.undyingRoar ?? 24, "lion", sharedSkillDesc("undyingRoar", "短暂不死，并开启血怒、旋风、急速和战吼普攻窗口。"), ({ unit }) => {
    unit.undyingTimer = BERSERKER_DURATIONS.immortal ?? 6;
    unit.hasteTimer = BERSERKER_DURATIONS.haste ?? 6;
    unit.hasteMultiplier = BERSERKER_MODEL.hasteMultiplier ?? 1.4;
    unit.lifeStealTimer = BERSERKER_DURATIONS.roarFury ?? 6;
    unit.bloodFuryTimer = Math.max(unit.bloodFuryTimer || 0, BERSERKER_DURATIONS.roarFury ?? 6);
    unit.whirlwindTimer = Math.max(unit.whirlwindTimer || 0, BERSERKER_DURATIONS.roarFury ?? 6);
    unit.roarFuryTimer = BERSERKER_DURATIONS.roarFury ?? 6;
    floater(unit, "不死", "heal");
  }),
  shadowHarvest: ult("暗影收割", "刺客", 24, "cloak-dagger", "处决低血目标，击杀刷新。", ({ unit }) => { const target = lowestEnemy(unit); if (target) hit(unit, target, 74 + unit.power * 0.66 + (1 - hpRatio(target)) * 95, "shadow", "收割"); }),
  arrowStorm: ult("箭雨", "游侠", 30, "arrow-cluster", "多段压低敌方后排。", ({ unit }) => enemiesOf(unit).filter(isAlive).forEach((enemy) => hit(unit, enemy, 29 + unit.power * 0.28 + (enemy.line === "后排" ? 16 : 0), "physical", "箭雨"))),
  meteorRain: ult("流星火雨", "法师", 37, "meteor-impact", "群体火焰，对燃烧目标爆燃。", ({ unit }) => enemiesOf(unit).filter(isAlive).forEach((enemy) => { hit(unit, enemy, 22 + unit.power * 0.18 + enemy.burn.stacks * 6, "fire", "流星"); addBurn(enemy, 2, 6, unit); })),
  sanctuary: ult("神圣庇护", "牧师", 32, "aura", "全队治疗和护盾。", ({ unit }) => alliesOf(unit).filter(isAlive).forEach((ally) => { healUnit(ally, 36 + unit.power * 0.28, "庇护"); shield(ally, 32 + unit.power * 0.3, "庇护"); })),
  plagueOffering: ult("万毒献祭", "术士", 30, "death-skull", "引爆所有中毒敌人，保留部分毒层。", ({ unit }) => enemiesOf(unit).filter(isAlive).forEach((enemy) => { if (enemy.poison.stacks <= 0) return; hit(unit, enemy, 22 + enemy.poison.stacks * 9 + unit.power * 0.22, "poison", "万毒"); enemy.poison.stacks = Math.ceil(enemy.poison.stacks * 0.45); })),
  crescendo: ult("终章强音", "吟游诗人", 30, "sonic-shout", "全队急速并触发返场。", ({ unit }) => alliesOf(unit).filter(isAlive).forEach((ally) => { ally.hasteTimer = 8; ally.bonusPowerTimer = 8; ally.bonusPower = Math.max(ally.bonusPower || 0, 10); })),
  grandMixture: ult("终极混剂", "炼金师", 35, "bubbling-flask", "根据敌方异常层数造成混合爆发。", ({ unit }) => enemiesOf(unit).filter(isAlive).forEach((enemy) => hit(unit, enemy, 18 + unit.power * 0.16 + Math.min(8, statusCount(enemy)) * 8, "arcane", "混剂"))),
};

const LOCAL_PRESETS = {
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

const ROLE_KITS = SHARED_SKILLS.roleKits || LOCAL_ROLE_KITS;
const SKILLS = SHARED_SKILLS.createSkillLibrary ? SHARED_SKILLS.createSkillLibrary({
  iconBase: ICON_BASE,
  isAlive,
  hpRatio,
  statusCount,
  effectivePower,
  enemiesOf,
  alliesOf,
  lowestEnemy,
  lowestHpAlly,
  carryAlly,
  byDistance,
  hit,
  shield,
  healUnit,
  addPoison,
  addBurn,
  takeRaw,
  floater,
}) : LOCAL_SKILLS;
const PRESETS = SHARED_SKILLS.presets || LOCAL_PRESETS;

const els = {
  leftConfig: document.querySelector("#leftConfig"),
  rightConfig: document.querySelector("#rightConfig"),
  leftSummary: document.querySelector("#leftSummary"),
  rightSummary: document.querySelector("#rightSummary"),
  startBtn: document.querySelector("#startBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  speedBtn: document.querySelector("#speedBtn"),
  unitLayer: document.querySelector("#unitLayer"),
  fxLayer: document.querySelector("#fxLayer"),
  leftAlive: document.querySelector("#leftAlive"),
  rightAlive: document.querySelector("#rightAlive"),
  battleTimer: document.querySelector("#battleTimer"),
  battleState: document.querySelector("#battleState"),
  combatLog: document.querySelector("#combatLog"),
  skillLibrary: document.querySelector("#skillLibrary"),
  presetButtons: document.querySelector("#presetButtons"),
  matchupGrid: document.querySelector("#matchupGrid"),
  simBtn: document.querySelector("#simBtn"),
};

function setup() {
  state.teams.left = clonePreset("poisonBloom");
  state.teams.right = clonePreset("ironWall");
  renderPresetButtons();
  renderConfigs();
  renderSkillLibrary();
  bindEvents();
  resetBattle();
  requestAnimationFrame(tick);
}

function skill(name, type, role, cooldown, icon, desc, cast) {
  return { name, type, role, cooldown, icon: `${ICON_BASE}/${icon}.svg`, desc, cast };
}
function passive(name, role, icon, desc) {
  return { name, type: TYPE.PASSIVE, role, cooldown: 0, icon: `${ICON_BASE}/${icon}.svg`, desc, passive: true };
}
function ult(name, role, cooldown, icon, desc, cast) {
  return skill(name, TYPE.ULT, role, cooldown, icon, desc, cast);
}
function sharedSkillDesc(key, fallback) {
  return SHARED_SKILLS.skills?.[key]?.desc || fallback;
}
function preset(name, desc, roles, overrides = {}) {
  const kitSource = SHARED_SKILLS.roleKits || LOCAL_ROLE_KITS;
  return { name, desc, team: roles.map((role, index) => ({ role, ...kitSource[role].kit, ...(overrides[index] || {}) })) };
}
function clonePreset(key) {
  return structuredClone(PRESETS[key].team);
}

function bindEvents() {
  els.startBtn.addEventListener("click", () => {
    state.running = !state.running;
    els.startBtn.textContent = state.running ? "暂停" : "开始";
    els.battleState.textContent = state.running ? "交战中" : "暂停";
    state.lastFrame = performance.now();
  });
  els.resetBtn.addEventListener("click", resetBattle);
  els.speedBtn.addEventListener("click", () => {
    state.speed = state.speed === 1 ? 2 : state.speed === 2 ? 4 : 1;
    els.speedBtn.textContent = `速度 x${state.speed}`;
  });
  els.presetButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset][data-side]");
    if (!button) return;
    state.selectedPreset[button.dataset.side] = button.dataset.preset;
    state.teams[button.dataset.side] = clonePreset(button.dataset.preset);
    renderPresetButtons();
    renderConfigs();
    resetBattle();
  });
  els.leftConfig.addEventListener("change", () => readConfig("left"));
  els.rightConfig.addEventListener("change", () => readConfig("right"));
  els.simBtn.addEventListener("click", runBalanceCheck);
}

function renderPresetButtons() {
  els.presetButtons.innerHTML = Object.entries(PRESETS).map(([key, preset]) => `
    <button type="button" data-side="left" data-preset="${key}" class="${state.selectedPreset.left === key ? "active" : ""}">左：${preset.name}</button>
    <button type="button" data-side="right" data-preset="${key}" class="${state.selectedPreset.right === key ? "active" : ""}">右：${preset.name}</button>
  `).join("");
}

function renderConfigs() {
  renderSideConfig("left", els.leftConfig);
  renderSideConfig("right", els.rightConfig);
  els.leftSummary.textContent = summarizeTeam("left");
  els.rightSummary.textContent = summarizeTeam("right");
}
function renderSideConfig(side, mount) {
  mount.innerHTML = state.teams[side].map((spec, index) => {
    const role = ROLE_KITS[spec.role];
    return `
      <article class="config-card" data-index="${index}">
        <header><strong>${index + 1}. ${role.name}</strong><span class="role-badge">${role.role}</span></header>
        <div class="fantasy">${role.fantasy}</div>
        <div class="slot-row"><label>角色</label><select data-field="role">${roleOptions(spec.role)}</select></div>
        <div class="slot-row"><label>小技 1</label><select data-field="small1">${skillOptions(spec.small1, TYPE.SMALL)}</select></div>
        <div class="slot-row"><label>小技 2</label><select data-field="small2">${skillOptions(spec.small2, TYPE.SMALL)}</select></div>
        <div class="slot-row"><label>被动</label><select data-field="passive">${skillOptions(spec.passive, TYPE.PASSIVE, true)}</select></div>
        <div class="slot-row"><label>大招</label><select data-field="ultimate">${skillOptions(spec.ultimate, TYPE.ULT, true)}</select></div>
      </article>
    `;
  }).join("");
}
function roleOptions(selected) {
  return Object.entries(ROLE_KITS).map(([key, role]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${role.name}</option>`).join("");
}
function skillOptions(selected, type, allowEmpty = false) {
  const options = allowEmpty ? ['<option value="">无</option>'] : [];
  return options.concat(Object.entries(SKILLS).filter(([, skill]) => skill.type === type).map(([key, skill]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${skill.name} · ${skill.role}</option>`)).join("");
}
function readConfig(side) {
  const mount = side === "left" ? els.leftConfig : els.rightConfig;
  state.teams[side] = [...mount.querySelectorAll(".config-card")].map((card) => ({
    role: card.querySelector('[data-field="role"]').value,
    small1: card.querySelector('[data-field="small1"]').value,
    small2: card.querySelector('[data-field="small2"]').value,
    passive: card.querySelector('[data-field="passive"]').value,
    ultimate: card.querySelector('[data-field="ultimate"]').value,
  }));
  state.selectedPreset[side] = "custom";
  renderPresetButtons();
  resetBattle();
}
function summarizeTeam(side) {
  if (state.selectedPreset[side] && PRESETS[state.selectedPreset[side]]) return PRESETS[state.selectedPreset[side]].name;
  return "自定义组合";
}

const FORMATION = {
  left: [{ x: 30, y: 36, line: "前排" }, { x: 30, y: 64, line: "前排" }, { x: 16, y: 32, line: "后排" }, { x: 16, y: 68, line: "后排" }],
  right: [{ x: 70, y: 36, line: "前排" }, { x: 70, y: 64, line: "前排" }, { x: 84, y: 32, line: "后排" }, { x: 84, y: 68, line: "后排" }],
};

function resetBattle() {
  state.running = false;
  state.time = 0;
  state.nextId = 1;
  state.lastFrame = performance.now();
  state.units = [...makeTeam("left", state.teams.left), ...makeTeam("right", state.teams.right)];
  state.logs = ["战斗已重置。"];
  state.signalBus?.clear();
  els.startBtn.textContent = "开始";
  els.battleState.textContent = "待命";
  clearFx();
  render();
}
function makeTeam(side, specs) {
  return specs.map((spec, index) => {
    const role = ROLE_KITS[spec.role];
    const slot = FORMATION[side][index];
    return {
      id: state.nextId++, side, index, ...spec,
      name: role.name, roleName: role.role, maxHp: role.hp, hp: role.hp, power: role.power,
      armor: role.armor, range: role.range, homeX: slot.x, homeY: slot.y, line: slot.line, x: slot.x, y: slot.y,
      attackCd: 0.6 + index * 0.08,
      skillCd: {
        small1: 1 + index * 0.35,
        small2: 2.2 + index * 0.35,
        ultimate: spec.ultimate === "undyingRoar" ? (BERSERKER_MODEL.openingCooldowns?.undyingRoar ?? 8) : 20 + index * 1.8,
      },
      shield: 0, poison: status(), burn: status(), slowTimer: 0, guardTimer: 0, hasteTimer: 0,
      dotResistTimer: 0, undyingTimer: 0, lifeStealTimer: 0, bonusPowerTimer: 0, bonusPower: 0,
      bloodFuryTimer: 0, whirlwindTimer: 0, roarFuryTimer: 0,
      damageDone: 0, mark: 0, icon: `${ICON_BASE}/${role.icon}.svg`,
    };
  });
}
function status() { return { stacks: 0, time: 0, tick: 1, source: null }; }

function tick(now) {
  const dt = Math.min(0.05, ((now - state.lastFrame) / 1000 || 0.016)) * state.speed;
  state.lastFrame = now;
  if (state.running) updateBattle(dt, true);
  render();
  requestAnimationFrame(tick);
}

function updateBattle(dt, visual = false) {
  state.time += dt;
  for (const unit of state.units.filter(isAlive)) {
    tickStatuses(unit, dt, visual);
    tickTimers(unit, dt);
    const target = chooseTarget(unit);
    if (!target) continue;
    const distance = getDistance(unit, target);
    if (distance > unit.range) {
      moveToward(unit, target, dt);
      continue;
    }
    if (unit.skillCd.ultimate <= 0 && unit.ultimate) castSlot(unit, "ultimate", target, visual);
    else if (unit.skillCd.small1 <= 0) castSlot(unit, "small1", target, visual);
    else if (unit.skillCd.small2 <= 0) castSlot(unit, "small2", target, visual);
    else if (unit.attackCd <= 0) basicAttack(unit, target, visual);
  }
  state.signalBus?.emitHealthSnapshots(state.units, state.time);
  checkWinner();
}
function tickTimers(unit, dt) {
  for (const key of ["small1", "small2", "ultimate"]) unit.skillCd[key] = Math.max(0, unit.skillCd[key] - dt);
  unit.attackCd -= dt * (unit.hasteTimer > 0 ? (unit.hasteMultiplier || 1.45) : 1);
  for (const key of ["slowTimer", "guardTimer", "hasteTimer", "dotResistTimer", "undyingTimer", "lifeStealTimer", "bonusPowerTimer", "bloodFuryTimer", "whirlwindTimer", "roarFuryTimer"]) unit[key] = Math.max(0, unit[key] - dt);
}
function tickStatuses(unit, dt, visual) {
  tickDot(unit, unit.poison, dt, 2.1, "poison", visual);
  tickDot(unit, unit.burn, dt, 2.15, "burn", visual);
}
function tickDot(unit, dot, dt, perStack, type, visual) {
  if (dot.stacks <= 0) return;
  dot.time -= dt;
  dot.tick -= dt;
  if (dot.tick <= 0) {
    dot.tick = 1;
    const resist = unit.dotResistTimer > 0 ? 0.6 : 1;
    withAction(dot.source, { tags: ["dot", "damage", type], skillName: type === "poison" ? "剧毒" : "燃烧" }, () => {
      takeDamage(dot.source, unit, dot.stacks * perStack * resist, type, visual);
    });
  }
  if (dot.time <= 0) Object.assign(dot, status());
}
function castSlot(unit, slot, target, visual) {
  const skill = SKILLS[unit[slot]];
  if (!skill) return;
  if (visual) playSkillFx(unit, target, unit[slot], slot, skill);
  emitSignal({
    kind: "skill",
    tags: ["skill", slot === "ultimate" ? "ultimate" : "smallSkill", "cast"],
    source: unitRef(unit),
    target: unitRef(target),
    skillKey: unit[slot],
    skillName: skill.name,
    meta: { slot, role: unit.roleName },
  });
  withAction(unit, { tags: ["skill", slot === "ultimate" ? "ultimate" : "smallSkill"], skillKey: unit[slot], skillName: skill.name }, () => {
    skill.cast({ unit, target, visual });
  });
  unit.skillCd[slot] = skill.cooldown;
  if (slot === "ultimate") triggerEncore(unit);
}
function basicAttack(unit, target, visual) {
  const isBerserker = isBerserkerUnit(unit);
  const missingHp = isBerserker ? 1 - hpRatio(unit) : 0;
  const lowHpHaste = isBerserker ? 1 + missingHp * (BERSERKER_PASSIVE.lowHpHaste ?? 0) : 1;
  unit.attackCd = ((isBerserker ? (BERSERKER_MODEL.basicAttackCooldown ?? 1.35) : 1.45) * (unit.slowTimer > 0 ? 1.25 : 1)) / lowHpHaste;
  const power = effectivePower(unit);
  let amount = isBerserker ? (BERSERKER_MODEL.basicFlatDamage ?? 10) + power * (BERSERKER_MODEL.basicPowerRatio ?? 0.22) : 11 + power * 0.22;
  let label = "攻击";
  if (isBerserker && unit.bloodFuryTimer > 0) {
    amount += power * (BERSERKER_RATIOS.blood ?? 0.45) * (1 + (1 - hpRatio(unit)) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45));
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
  withAction(unit, { tags: ["basic", "attack"], skillName: label, meta: { windows: activeWindows(unit) } }, () => {
    hit(unit, target, amount, "physical", label, visual);
  });
  if (isBerserker && unit.whirlwindTimer > 0) {
    enemiesOf(unit).filter((enemy) => isAlive(enemy) && enemy.id !== target.id).sort(byDistance(target)).slice(0, BERSERKER_MODEL.splashTargets ?? 2)
      .forEach((enemy) => withAction(unit, { tags: ["basic", "attack", "area", "splash"], skillName: "旋风溅射", meta: { windows: activeWindows(unit) } }, () => {
        hit(unit, enemy, power * (BERSERKER_RATIOS.splash ?? 0.18), "physical", "旋风溅射", visual);
      }));
  }
}
function isBerserkerUnit(unit) {
  return unit?.role === "berserker" || unit?.roleName === "狂战士" || unit?.passive === "rageEngine";
}
function moveToward(unit, target, dt) {
  const distance = getDistance(unit, target);
  if (distance <= unit.range * 0.92) return;
  const step = dt * (unit.roleName === "刺客" ? 10 : unit.slowTimer > 0 ? 4.2 : 7);
  const dx = target.x - unit.x;
  const dy = target.y - unit.y;
  const move = Math.min(step, Math.max(0, distance - unit.range * 0.9));
  unit.x = clamp(unit.x + (dx / distance) * move, 7, 93);
  unit.y = clamp(unit.y + (dy / distance) * move, 12, 88);
}

function hit(source, target, amount, type, label, visual = true) {
  if (!target) return;
  let value = amount + effectivePower(source) * 0.04;
  if (source.passive === "lineBreaker" && target.line === "前排") value *= 1.12;
  if (source.passive === "rageEngine") value *= 1 + (1 - hpRatio(source)) * (BERSERKER_PASSIVE.maxDamageAmp ?? 0.45);
  if (source.passive === "executionSense" && (hpRatio(target) < 0.45 || statusCount(target) > 0)) value *= 1.18;
  if (source.passive === "duelistFocus") value *= 1 + (target.mark || 0) * 0.045;
  if (source.passive === "catalyst" && statusCount(target) > 0) value *= 1.06;
  if (target.guardTimer > 0) value *= 0.72;
  const mitigated = Math.max(1, value - target.armor * (type === "physical" ? 0.72 : 0.38));
  takeDamage(source, target, mitigated, type, visual, label);
  if (visual) log(`${source.name} ${label} ${target.name}。`);
}
function takeDamage(source, target, amount, type, visual = true, label = "") {
  if (!isAlive(target)) return;
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
    emitSignal({
      kind: "damage",
      tags: actionTags(source, ["damage", type, blocked > 0 ? "blocked" : "", remaining !== amount ? "mitigated" : ""]).filter(Boolean),
      source: unitRef(source),
      target: unitRef(target),
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
      const leechRate = source.lifeStealTimer > 0 ? 0.18 : (BERSERKER_PASSIVE.baseLeech ?? 0.06) + (1 - hpRatio(source)) * (BERSERKER_PASSIVE.missingHpLeech ?? 0.08);
      healUnit(source, amount * leechRate, "吸血", visual);
    }
  }
  if (visual && blocked > 0) floater(target, `护盾-${Math.round(blocked)}`, "shield");
  if (visual && remaining > 0) {
    const label = type === "poison" ? `剧毒-${Math.round(remaining)}`
      : type === "burn" ? `燃烧-${Math.round(remaining)}`
      : type === "fire" ? `火焰-${Math.round(remaining)}`
      : `-${Math.round(remaining)}`;
    floater(target, label, type === "poison" ? "poison" : type === "burn" || type === "fire" ? "fire" : "");
  }
  if (target.hp <= 0) onDeath(target, source, visual);
}
function takeRaw(target, amount, source, type) {
  const hpBefore = target.hp;
  target.hp = Math.max(1, target.hp - amount);
  emitSignal({
    kind: "damage",
    tags: ["damage", type || "raw", "selfCost"],
    source: unitRef(source),
    target: unitRef(target),
    amount: hpBefore - target.hp,
    hpBefore,
    hpAfter: target.hp,
  });
}
function healUnit(unit, amount, label = "治疗", visual = true) {
  if (!unit || !isAlive(unit)) return;
  const before = unit.hp;
  unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  const healed = unit.hp - before;
  const overflow = Math.max(0, amount - (unit.maxHp - before));
  if (unit.passive === "afterglowGrace" && overflow > 0) unit.shield += overflow * 0.65;
  if (healed > 0) {
    emitSignal({
      kind: "heal",
      tags: actionTags(null, ["heal"]).filter(Boolean),
      source: null,
      target: unitRef(unit),
      amount: healed,
      skillName: label,
      hpBefore: before,
      hpAfter: unit.hp,
      meta: { overflow },
    });
  }
  if (visual) floater(unit, `+${Math.round(amount)}`, "heal");
}
function shield(unit, amount, label, visual = true) {
  if (!unit || !isAlive(unit)) return;
  const bonus = unit.passive === "fortressStance" ? 1.08 + (1 - hpRatio(unit)) * 0.12 : 1;
  const value = amount * bonus;
  unit.shield += value;
  emitSignal({
    kind: "shield",
    tags: actionTags(null, ["shield"]).filter(Boolean),
    source: null,
    target: unitRef(unit),
    amount: value,
    skillName: label,
    shield: unit.shield,
  });
  if (visual) floater(unit, `${label}+${Math.round(value)}`, "shield");
}
function addPoison(target, stacks, time, source, visual = state.running) {
  target.poison.stacks = Math.min(20, target.poison.stacks + stacks);
  target.poison.time = Math.max(target.poison.time, time);
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
  if (visual && isAlive(target)) floater(target, `剧毒+${stacks}`, "poison");
}
function addBurn(target, stacks, time, source, visual = state.running) {
  target.burn.stacks += stacks;
  target.burn.time = Math.max(target.burn.time, time);
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
  if (visual && isAlive(target)) floater(target, `燃烧+${stacks}`, "fire");
}
function onDeath(unit, killer, visual) {
  if (visual) log(`${unit.name} 倒下。`);
  if (unit.poison.stacks > 0) alliesOf(killer || unit).filter((ally) => ally.passive === "hotbedPact" && isAlive(ally)).slice(0, 1).forEach((source) => {
    alliesOf(unit).filter((ally) => isAlive(ally) && ally.id !== unit.id).forEach((enemy) => addPoison(enemy, Math.ceil(unit.poison.stacks * 0.18), 6, source));
    if (visual) log(`温床契约触发，${unit.name} 的余毒扩散。`);
  });
  if (unit.burn.stacks > 0) alliesOf(killer || unit).filter((ally) => ally.passive === "kindlingEcho" && isAlive(ally)).slice(0, 1).forEach((source) => {
    enemiesOf(source).filter(isAlive).sort(byDistance(unit)).slice(0, 2).forEach((enemy) => hit(source, enemy, 14 + unit.burn.stacks * 6, "fire", "火种余爆", visual));
  });
  if (killer && killer.ultimate === "shadowHarvest") killer.skillCd.ultimate = Math.min(killer.skillCd.ultimate, 8);
}
function triggerEncore(unit) {
  alliesOf(unit).filter((ally) => ally.passive === "encore" && isAlive(ally)).forEach((bard) => {
    bard.skillCd.small1 = Math.max(0, bard.skillCd.small1 - 2);
    bard.skillCd.small2 = Math.max(0, bard.skillCd.small2 - 2);
  });
}
function checkWinner() {
  const left = state.units.some((unit) => unit.side === "left" && isAlive(unit));
  const right = state.units.some((unit) => unit.side === "right" && isAlive(unit));
  if (!left || !right || state.time >= MAX_TIME) {
    state.running = false;
    const winner = left && !right ? "左队胜利" : right && !left ? "右队胜利" : "时间到";
    els.battleState.textContent = winner;
    els.startBtn.textContent = "开始";
    log(winner);
  }
}

function chooseTarget(unit) {
  const enemies = enemiesOf(unit).filter(isAlive);
  if (!enemies.length) return null;
  if (unit.roleName === "刺客") return lowestEnemy(unit) || enemies[0];
  const front = enemies.filter((enemy) => enemy.line === "前排");
  const candidates = front.length && unit.range < 30 ? front : enemies;
  return candidates.sort(byDistance(unit))[0];
}
function effectivePower(unit) { return unit.power + (unit.bonusPowerTimer > 0 ? unit.bonusPower || 14 : 0); }
function statusCount(unit) { return unit.poison.stacks + unit.burn.stacks + (unit.slowTimer > 0 ? 2 : 0) + (unit.mark || 0); }
function carryAlly(unit) { return alliesOf(unit).filter(isAlive).sort((a, b) => effectivePower(b) - effectivePower(a))[0]; }
function lowestEnemy(unit) { return enemiesOf(unit).filter(isAlive).sort((a, b) => hpRatio(a) - hpRatio(b))[0]; }
function enemiesOf(unit) { return state.units.filter((item) => item.side !== unit.side); }
function alliesOf(unit) { return state.units.filter((item) => item.side === unit.side); }
function lowestHpAlly(unit) { return alliesOf(unit).filter(isAlive).sort((a, b) => hpRatio(a) - hpRatio(b))[0]; }
function isAlive(unit) { return unit && unit.hp > 0; }
function hpRatio(unit) { return unit.hp / unit.maxHp; }
function getDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function byDistance(unit) { return (a, b) => getDistance(unit, a) - getDistance(unit, b); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function unitRef(unit) { return SIGNALS.unitRef ? SIGNALS.unitRef(unit) : unit ? { id: unit.id, name: unit.name, side: unit.side, role: unit.roleName } : null; }
function emitSignal(signal) {
  if (!state.signalBus) return;
  state.signalBus.emit({ time: state.time, ...signal });
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
function activeWindows(unit) {
  return [
    unit.bloodFuryTimer > 0 ? "bloodFury" : "",
    unit.whirlwindTimer > 0 ? "whirlwind" : "",
    unit.roarFuryTimer > 0 ? "roarFury" : "",
    unit.hasteTimer > 0 ? "haste" : "",
  ].filter(Boolean);
}

function render() {
  els.unitLayer.innerHTML = state.units.map(renderUnit).join("");
  els.leftAlive.textContent = state.units.filter((u) => u.side === "left" && isAlive(u)).length;
  els.rightAlive.textContent = state.units.filter((u) => u.side === "right" && isAlive(u)).length;
  els.battleTimer.textContent = `${state.time.toFixed(1)}s`;
  els.combatLog.innerHTML = state.logs.slice(-100).reverse().map((item) => `<div>${item}</div>`).join("");
}
function renderUnit(unit) {
  const mainSkill = SKILLS[unit.small1];
  const cdRatio = mainSkill ? 1 - clamp(unit.skillCd.small1 / mainSkill.cooldown, 0, 1) : 1;
  return `
    <div class="unit ${unit.side} ${isAlive(unit) ? "" : "dead"}" style="left:${unit.x}%;top:${unit.y}%">
      <div class="avatar"><img src="${unit.icon}" alt=""></div>
      <div class="nameplate">${unit.name}<span>${unit.line}</span></div>
      <div class="hp-bar"><span style="width:${clamp(unit.hp / unit.maxHp, 0, 1) * 100}%"></span></div>
      <div class="cd-bar"><span style="width:${cdRatio * 100}%"></span></div>
      <div class="badges">
        ${unit.poison.stacks > 0 ? `<span class="poison-stack">毒${unit.poison.stacks}</span>` : ""}
        ${unit.burn.stacks > 0 ? `<span class="burn-stack">燃${unit.burn.stacks}</span>` : ""}
        ${unit.shield > 0 ? `<span class="shield-stack">盾${Math.round(unit.shield)}</span>` : ""}
      </div>
    </div>
  `;
}
function renderSkillLibrary() {
  els.skillLibrary.innerHTML = Object.entries(ROLE_KITS).map(([key, role]) => {
    const kit = role.kit;
    return `<div class="skill-card"><strong>${role.name}</strong><span>${role.fantasy}</span><span>小技：${SKILLS[kit.small1].name} / ${SKILLS[kit.small2].name}</span><span>被动：${SKILLS[kit.passive].name} · 大招：${SKILLS[kit.ultimate].name}</span></div>`;
  }).join("");
}

function playSkillFx(unit, target, skillId, slot, skill) {
  const fx = SKILL_FX[skillId] || { kind: "impact", at: "target", sheet: "impact", color: "gold" };
  const source = pointOf(unit);
  const impact = resolveFxPoint(unit, target, fx.at);
  const isUlt = slot === "ultimate" || fx.ultimate;
  const scale = isUlt ? 1.35 : 1;

  spawnSkillLabel(unit, skill.name, isUlt);
  spawnCastPulse(source, fx.color, scale);

  if (["projectile", "dash"].includes(fx.kind)) spawnBeam(source, impact, fx.color, fx.kind === "dash");
  if (["slash", "cleave", "stab", "dash"].includes(fx.kind)) {
    spawnSlash(source, impact, fx.image || "slash02", fx.color, scale * (fx.kind === "stab" ? 0.72 : 1));
  }
  if (fx.kind === "whirl") {
    spawnSlash(source, { x: source.x + (unit.side === "left" ? 5 : -5), y: source.y - 8 }, fx.image || "slash03", fx.color, scale);
    spawnSlash(source, { x: source.x + (unit.side === "left" ? -5 : 5), y: source.y + 8 }, "slash01", fx.color, scale * 0.85);
  }
  if (fx.kind === "rain") {
    for (let i = 0; i < 5; i += 1) {
      const lane = { x: impact.x - 8 + i * 4, y: impact.y - 10 + (i % 2) * 6 };
      setTimeout(() => spawnBeam({ x: lane.x - 10, y: lane.y - 18 }, lane, fx.color, false), i * 80);
      setTimeout(() => spawnSprite(fx.sheet, lane, fx.color, scale * 0.7), i * 90);
    }
    return;
  }

  if (fx.sheet) spawnSprite(fx.sheet, impact, fx.color, scale);
  if (fx.image && ["aoe", "heal", "buff", "teamBuff"].includes(fx.kind)) {
    spawnImage(fx.image, impact, fx.color, scale);
  }
  if (["shield", "heal", "buff", "teamBuff", "aoe"].includes(fx.kind)) {
    spawnRing(impact, fx.color, scale * (isUlt ? 1.25 : 1));
  }
}

function resolveFxPoint(unit, target, mode) {
  if (mode === "self") return pointOf(unit);
  if (mode === "lowestAlly") return pointOf(lowestHpAlly(unit) || unit);
  if (mode === "carryAlly") return pointOf(carryAlly(unit) || unit);
  if (mode === "teamCenter") return centerOf(alliesOf(unit).filter(isAlive), unit);
  if (mode === "enemyCenter") return centerOf(enemiesOf(unit).filter(isAlive), target || unit);
  return pointOf(target || unit);
}

function pointOf(unit) {
  return { x: unit?.x ?? 50, y: unit?.y ?? 50 };
}

function centerOf(units, fallback) {
  if (!units.length) return pointOf(fallback);
  return {
    x: units.reduce((sum, unit) => sum + unit.x, 0) / units.length,
    y: units.reduce((sum, unit) => sum + unit.y, 0) / units.length,
  };
}

function spawnSkillLabel(unit, text, isUlt) {
  const node = document.createElement("div");
  node.className = `skill-label ${isUlt ? "ultimate" : ""}`;
  node.textContent = text;
  node.style.left = `${unit.x}%`;
  node.style.top = `${unit.y - 10}%`;
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), isUlt ? 1050 : 760);
}

function spawnCastPulse(point, color, scale = 1) {
  const node = document.createElement("div");
  node.className = `vfx-pulse vfx-${color}`;
  node.style.left = `${point.x}%`;
  node.style.top = `${point.y}%`;
  node.style.setProperty("--scale", scale);
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 620);
}

function spawnRing(point, color, scale = 1) {
  const node = document.createElement("div");
  node.className = `vfx-ring vfx-${color}`;
  node.style.left = `${point.x}%`;
  node.style.top = `${point.y}%`;
  node.style.setProperty("--scale", scale);
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 760);
}

function spawnBeam(source, target, color, heavy) {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);
  const node = document.createElement("div");
  node.className = `vfx-beam vfx-${color} ${heavy ? "heavy" : ""}`;
  node.style.left = `${source.x}%`;
  node.style.top = `${source.y}%`;
  node.style.width = `${length}%`;
  node.style.transform = `rotate(${angle}rad)`;
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), heavy ? 520 : 360);
}

function spawnSlash(source, target, imageName, color, scale = 1) {
  const node = document.createElement("img");
  node.className = `vfx-slash vfx-${color}`;
  node.src = VFX_IMAGES[imageName] || VFX_IMAGES.slash02;
  const mid = { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 };
  const angle = Math.atan2(target.y - source.y, target.x - source.x);
  node.style.left = `${mid.x}%`;
  node.style.top = `${mid.y}%`;
  node.style.setProperty("--angle", `${angle}rad`);
  node.style.setProperty("--scale", scale);
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 520);
}

function spawnImage(imageName, point, color, scale = 1) {
  const node = document.createElement("img");
  node.className = `vfx-image vfx-${color}`;
  node.src = VFX_IMAGES[imageName] || VFX_IMAGES.magic01;
  node.style.left = `${point.x}%`;
  node.style.top = `${point.y}%`;
  node.style.setProperty("--scale", scale);
  els.fxLayer.appendChild(node);
  setTimeout(() => node.remove(), 720);
}

function spawnSprite(sheetName, point, color, scale = 1) {
  const sheetInfo = VFX_SHEETS[sheetName] || VFX_SHEETS.impact;
  const node = document.createElement("div");
  node.className = `vfx-sheet vfx-${color}`;
  node.style.left = `${point.x}%`;
  node.style.top = `${point.y}%`;
  node.style.backgroundImage = `url("${sheetInfo.src}")`;
  node.style.backgroundSize = `${sheetInfo.cols * 100}% ${sheetInfo.rows * 100}%`;
  node.style.setProperty("--scale", scale);
  els.fxLayer.appendChild(node);

  let frame = 0;
  const duration = 560;
  const stepMs = Math.max(16, duration / sheetInfo.frames);
  const timer = setInterval(() => {
    frame += 1;
    const col = frame % sheetInfo.cols;
    const row = Math.floor(frame / sheetInfo.cols);
    const x = sheetInfo.cols <= 1 ? 0 : (col / (sheetInfo.cols - 1)) * 100;
    const y = sheetInfo.rows <= 1 ? 0 : (row / (sheetInfo.rows - 1)) * 100;
    node.style.backgroundPosition = `${x}% ${y}%`;
    if (frame >= sheetInfo.frames - 1) {
      clearInterval(timer);
      node.remove();
    }
  }, stepMs);
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
function clearFx() { els.fxLayer.innerHTML = ""; }
function log(text) { state.logs.push(`${state.time.toFixed(1).padStart(4, " ")}s ${text}`); }

function runBalanceCheck() {
  const keys = Object.keys(PRESETS);
  const rows = [];
  for (const a of keys) {
    const row = { key: a, name: PRESETS[a].name, cells: [] };
    for (const b of keys) {
      if (a === b) {
        row.cells.push({ text: "—", cls: "even" });
        continue;
      }
      const wins = simulateMatchup(a, b, 7);
      const rate = wins / 7;
      row.cells.push({ text: `${Math.round(rate * 100)}%`, cls: rate >= 0.72 ? "favored" : rate <= 0.28 ? "bad" : "even" });
    }
    rows.push(row);
  }
  state.balanceRows = rows;
  renderBalance(keys);
}
function simulateMatchup(leftKey, rightKey, games) {
  let wins = 0;
  for (let i = 0; i < games; i += 1) {
    const result = simulateOnce(clonePreset(leftKey), clonePreset(rightKey), i);
    if (result === "left") wins += 1;
  }
  return wins;
}
function simulateOnce(leftTeam, rightTeam, seed) {
  const oldUnits = state.units;
  const oldLogs = state.logs;
  const oldTime = state.time;
  const oldNextId = state.nextId;
  state.nextId = 1;
  state.time = 0;
  state.logs = [];
  state.units = [...makeTeam("left", leftTeam), ...makeTeam("right", rightTeam)];
  const rng = seededRandom(`${leftTeam.map((u) => u.role).join("-")}|${rightTeam.map((u) => u.role).join("-")}|${seed}`);
  for (const unit of state.units) {
    const statSwing = 0.94 + rng() * 0.12;
    unit.maxHp = Math.round(unit.maxHp * statSwing);
    unit.hp = unit.maxHp;
    unit.power = Math.round(unit.power * (0.95 + rng() * 0.1));
    unit.armor = Math.round(unit.armor * (0.96 + rng() * 0.08));
    unit.skillCd.small1 += rng() * 1.2;
    unit.skillCd.small2 += rng() * 1.5;
    unit.skillCd.ultimate += rng() * 3;
  }
  while (state.time < MAX_TIME) {
    updateBattle(0.08, false);
    const left = state.units.some((unit) => unit.side === "left" && isAlive(unit));
    const right = state.units.some((unit) => unit.side === "right" && isAlive(unit));
    if (!left || !right) break;
  }
  const leftHp = state.units.filter((u) => u.side === "left").reduce((sum, u) => sum + Math.max(0, u.hp / u.maxHp), 0);
  const rightHp = state.units.filter((u) => u.side === "right").reduce((sum, u) => sum + Math.max(0, u.hp / u.maxHp), 0);
  const winner = leftHp >= rightHp ? "left" : "right";
  state.units = oldUnits;
  state.logs = oldLogs;
  state.time = oldTime;
  state.nextId = oldNextId;
  return winner;
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
function renderBalance(keys) {
  els.matchupGrid.innerHTML = `
    <div class="matrix-head"></div>
    ${keys.map((key) => `<div class="matrix-head">${PRESETS[key].name}</div>`).join("")}
    ${state.balanceRows.map((row) => `
      <div class="matrix-head">${row.name}</div>
      ${row.cells.map((cell) => `<div class="matrix-cell ${cell.cls}">${cell.text}</div>`).join("")}
    `).join("")}
  `;
}

setup();
