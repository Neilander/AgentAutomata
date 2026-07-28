(function (root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FIFTEEN_DAY_DEMO = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
"use strict";

const COMBAT = typeof module !== "undefined" && module.exports ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM;
const SKILLS = typeof module !== "undefined" && module.exports ? require("../game_data/skill-data") : root.GAME_SKILL_DATA;
const BUILD_LAYERS = typeof module !== "undefined" && module.exports ? require("../game_data/build-layers") : root.GAME_BUILD_LAYERS;

const VERSION = "fifteen_day_demo_v3";
const AP_PER_DAY = 3;
const FINAL_DAY = 15;
const INVENTORY_LIMIT = 200;
const MAX_ACTIVE_BY_ACT = { 1: 4, 2: 10, 3: 10 };
const FORMATION_LABELS = [
  "前排一号", "前排二号", "前排三号", "前排四号", "前排五号",
  "后排一号", "后排二号", "后排三号", "后排四号", "后排五号",
];
const AFFIX_DEFS = {
  might: { label: "武力", category: "major" }, fortitude: { label: "坚韧", category: "major" }, agility: { label: "敏捷", category: "major" },
  arcana: { label: "奥术", category: "major" }, rhythm: { label: "节律", category: "major" }, resilience: { label: "韧性", category: "major" },
  maxHp: { label: "生命", category: "basic" }, physicalPower: { label: "物攻", category: "basic" }, magicPower: { label: "法强", category: "basic" }, armor: { label: "护甲", category: "basic" },
  attackSpeed: { label: "攻速", category: "basic", percent: true }, skillHaste: { label: "技能急速", category: "basic", percent: true }, effectPower: { label: "效果强度", category: "specialist", percent: true },
  effectResist: { label: "效果抗性", category: "basic", percent: true }, receivedHealing: { label: "受治愈增幅", category: "specialist", percent: true }, healPower: { label: "治疗强度", category: "specialist" },
  shieldPower: { label: "护盾强度", category: "specialist" }, dotAmp: { label: "DOT 增幅", category: "specialist" }, controlPower: { label: "控制强度", category: "specialist" },
  critChance: { label: "暴击率", category: "specialist" }, critDamage: { label: "暴击伤害", category: "specialist" }, lifeSteal: { label: "吸血", category: "specialist" },
  shieldBreak: { label: "破盾", category: "specialist" }, armorBreak: { label: "破甲", category: "specialist" }, initiative: { label: "先手", category: "specialist" },
  fireAmp: { label: "火焰增幅", category: "archetype" }, poisonAmp: { label: "剧毒增幅", category: "archetype" }, shadowAmp: { label: "暗影增幅", category: "archetype" },
  arcaneAmp: { label: "奥术增幅", category: "archetype" }, markPower: { label: "标记强度", category: "archetype" }, stealthDuration: { label: "隐身持续", category: "archetype" },
  executeDamage: { label: "处决伤害", category: "archetype" }, lowHpDamage: { label: "低血伤害", category: "archetype" }, lowHpHealingReceived: { label: "低血受治愈", category: "archetype" },
  counterDamage: { label: "反击伤害", category: "archetype" }, cleanseEfficiency: { label: "净化效率", category: "archetype" }, auraPower: { label: "光环强度", category: "archetype" },
};
const SLOT_DATA = {
  weapon: { label: "武器", baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "agility", "arcana", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "executeDamage", "lowHpDamage", "markPower"] },
  helm: { label: "头盔", baseStats: ["maxHp", "armor"], affixPool: ["arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "healPower", "controlPower", "critChance", "fireAmp", "poisonAmp", "arcaneAmp", "markPower", "stealthDuration", "cleanseEfficiency", "auraPower"] },
  chest: { label: "胸甲", baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "effectResist", "receivedHealing", "shieldPower", "lowHpHealingReceived", "counterDamage", "cleanseEfficiency"] },
  gloves: { label: "护手", baseStats: ["physicalPower", "armor"], affixPool: ["might", "agility", "attackSpeed", "critChance", "critDamage", "lifeSteal", "shieldBreak", "armorBreak", "markPower", "executeDamage", "lowHpDamage", "counterDamage"] },
  legs: { label: "腿甲", baseStats: ["maxHp", "armor"], affixPool: ["fortitude", "resilience", "agility", "effectResist", "receivedHealing", "skillHaste", "lowHpHealingReceived", "cleanseEfficiency", "counterDamage"] },
  boots: { label: "靴子", baseStats: ["maxHp", "armor"], affixPool: ["agility", "rhythm", "resilience", "attackSpeed", "skillHaste", "effectResist", "initiative", "controlPower", "stealthDuration", "auraPower"] },
  ring: { label: "戒指", baseOptions: [["physicalPower"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "skillHaste", "effectPower", "effectResist", "dotAmp", "controlPower", "healPower", "shieldPower", "fireAmp", "poisonAmp", "shadowAmp", "markPower", "executeDamage", "lowHpDamage", "lowHpHealingReceived", "auraPower"] },
  charm: { label: "护符", baseOptions: [["maxHp"], ["magicPower"]], affixPool: ["might", "fortitude", "agility", "arcana", "rhythm", "resilience", "effectPower", "receivedHealing", "dotAmp", "healPower", "shieldPower", "controlPower", "fireAmp", "poisonAmp", "shadowAmp", "arcaneAmp", "stealthDuration", "cleanseEfficiency", "auraPower", "counterDamage"] },
};
const SLOT_LABELS = Object.fromEntries(Object.entries(SLOT_DATA).map(([id, slot]) => [id, slot.label]));
const RARITY_DATA = [
  { id: "common", label: "普通", affixes: 1, value: 1 },
  { id: "rare", label: "稀有", affixes: 2, value: 1.3 },
  { id: "epic", label: "史诗", affixes: 4, value: 1.9 },
  { id: "legendary", label: "传说", affixes: 7, value: 2.8 },
  { id: "mythic", label: "神话", affixes: 12, value: 4.2 },
];
const RARITIES = RARITY_DATA.map((row) => row.label);
const RARITY_BY_LABEL = Object.fromEntries(RARITY_DATA.map((row) => [row.label, row]));
const BLOCKED_DIRECT_AFFIXES = new Set(["physicalPower", "magicPower", "maxHp", "armor", "attackSpeed", "skillHaste"]);
const IDENTITY_TAGS = ["古代锻造", "赃物", "流放者", "宗教", "白鹿家", "恐怖", "贵族", "矿工", "王国军", "异端"];
const THREAT_LEVELS = [
  { level: 1, name: "明显低威胁" }, { level: 2, name: "低威胁" }, { level: 3, name: "势均力敌" },
  { level: 4, name: "需要警戒" }, { level: 5, name: "高威胁" }, { level: 6, name: "极高威胁" }, { level: 7, name: "致命威胁" },
];
const PUBLIC_SKILL_DESCRIPTIONS = {
  shadowCut: "跳向低生命目标；目标生命越低，伤害越高。",
  shadowHarvest: "攻击低生命目标；低于处决线时直接击败。",
  boneWhirl: "5秒内普攻会对主目标追加伤害，并溅射附近两个敌人。",
  rageEngine: "生命越低，普攻速度、伤害与吸血越高。",
  undyingRoar: "4.8秒内生命不低于1，并获得5.2秒急速、血怒、旋风和吸血。",
  guard: "给自己施加护盾。",
  tempoSong: "短时间提高全队行动速度。",
  warBanner: "短时间提高全队前排成员的输出，并攻击两个敌人。",
};

const HEROES = {
  player: { name: "你", role: "均衡近战", combatRole: "warrior", base: 55 },
  shield: { name: "负伤盾手·赫恩", role: "前排保护", combatRole: "knight", base: 45 },
  apothecary: { name: "药师学徒·米娅", role: "治疗支援", combatRole: "priest", base: 39 },
  thief: { name: "小偷·鸦指", role: "潜入输出", combatRole: "assassin", base: 43 },
  duelist: { name: "旁支剑士·艾妲", role: "反击决斗", combatRole: "warrior", base: 56 },
  exile: { name: "流放者弓手·萨芮", role: "远程侦察", combatRole: "ranger", base: 54 },
  champion: { name: "擂台冠军·布罗克", role: "重击突阵", combatRole: "berserker", base: 61 },
  priest: { name: "灰袍司祭·伊文", role: "群体治疗", combatRole: "priest", base: 52 },
  engineer: { name: "桥梁师·罗莎", role: "炼金破阵", combatRole: "alchemist", base: 55 },
  mage: { name: "逃亡术士·维尔", role: "范围法术", combatRole: "mage", base: 60 },
  hunter: { name: "兽猎人·苔牙", role: "恐惧控制", combatRole: "warlock", base: 54 },
  banner: { name: "断旗队长·阿黛尔", role: "阵线指挥", combatRole: "knight", base: 64 },
  witch: { name: "沼泽女巫·盐枝", role: "持续削弱", combatRole: "warlock", base: 59 },
};

const GUILD_GUESTS = {
  guild_guard: { name: "协会盾卫·奥伦", role: "前排保护", combatRole: "knight", base: 46 },
  guild_scout: { name: "协会斥候·雀尾", role: "远程输出", combatRole: "ranger", base: 44 },
  guild_medic: { name: "协会医师·苏拉", role: "治疗支援", combatRole: "priest", base: 42 },
  guild_breaker: { name: "协会破阵手·岩拳", role: "近战爆发", combatRole: "berserker", base: 55 },
  guild_mage: { name: "协会术士·蓝烛", role: "范围法术", combatRole: "mage", base: 53 },
};

const GUILD_QUESTS = {
  road_pests: {
    id: "road_pests", title: "旧路鼠患", difficulty: "简单委托", description: "商队旧路被一群穴鼠占住，协会允许你从三名驻站成员中借人。",
    partyCap: 3, guestCap: 2, guests: ["guild_guard", "guild_scout", "guild_medic"], zoneId: "ash", rewardLevel: 1, lootCount: 2,
    enemies: [["warrior", "铁齿穴鼠"], ["assassin", "钻袋穴鼠"], ["warrior", "老穴鼠"]], tier: 1, scales: { hp: .76, power: .74 },
  },
  black_iron_warrant: {
    id: "black_iron_warrant", title: "黑铁悬赏", difficulty: "困难委托", description: "一支披甲盗匪夺走协会信物。任务没有前置门槛，但阵容错误会迅速崩溃。",
    partyCap: 4, guestCap: 2, guests: ["guild_guard", "guild_medic", "guild_breaker", "guild_mage"], zoneId: "inner", rewardLevel: 3, lootCount: 4,
    enemies: [["knight", "黑铁盾首"], ["warrior", "黑铁刀手"], ["ranger", "黑铁弩手"], ["priest", "黑铁随军医"]], tier: 3, scales: { hp: 1.24, power: 1.20, armor: 1.16 },
  },
};

const ZONES = {
  ash: { title: "灰炉外环", area: "灰炉遗址", start: 1, scene: "煤灰覆盖着外围废道，怪物拖着废铁在断墙间游荡。" },
  inner: { title: "灰炉内环", area: "灰炉遗址", start: 1, flag: "innerOpen", scene: "炉门后的环形甬道仍有余火，守炉残骸携带着更完整的旧式装备。" },
  quarry: { title: "黑石采坑", area: "北部矿区", start: 6, scene: "废弃矿道里残留着雇佣军的木箱与被惊动的穴居怪。" },
  forge: { title: "古王炉心", area: "王炉地底", start: 11, scene: "炉心深处仍有古老锻造机关运转，守炉造物在火光中巡行。" },
};

const EVENTS = [
  { id: "injured_shield", title: "倒在商道边的盾手", area: "西门商道", start: 1, end: 2, scene: "一名受伤盾手靠在翻倒的货车旁，钱袋压在断木下面。", options: [
    { id: "carry", label: "亲自把他背回镇里" },
    { id: "purse", label: "取走无人看守的钱袋" },
  ] },
  { id: "smith_intro", title: "铁匠的试炉", area: "镇中心", start: 2, end: 4, scene: "铁匠把三把普通武器摆在砧台旁，试炉只够再烧一次。", options: [
    { id: "promise", label: "答应替她收集三把普通武器", visible: (s) => !s.flags.smithPromise },
    { id: "forge", label: "把三把普通武器交给铁匠", visible: (s) => Boolean(s.flags.smithPromise), req: (s) => countUnequipped(s, (i) => i.slot === "weapon" && i.rarity === "普通") >= 3, callback: "你此前答应了铁匠，并已经带回三把普通武器" },
  ] },
  { id: "well_dispute", title: "水井边的争执", area: "镇中心", start: 1, end: 2, scene: "染匠说上游截水是旧约，菜农说今年再断水全家都会饿死。", options: [
    { id: "tanner", label: "支持染匠执行旧约" },
    { id: "grower", label: "支持菜农先保住收成" },
    { id: "measure", label: "查水尺与旧账后再分水", req: (s) => s.flags.smithPromise, callback: "铁匠愿意借出你此前答应试炉后见过的量尺" },
  ] },
  { id: "apothecary_debt", title: "被堵在药铺里的学徒", area: "镇中心", start: 3, end: 4, scene: "债主堵住药铺门口，学徒仍在给两个发热的孩子换湿布。", options: [
    { id: "pay", label: "替她还清五枚金币", req: (s) => s.resources.gold >= 5 },
    { id: "patients", label: "留下来帮她照看病人" },
  ] },
  { id: "thief_trial", title: "粮仓屋顶的小偷", area: "西门商道", start: 2, end: 4, scene: "守仓人抓住一个偷面包的孩子；屋檐上还藏着一捆盖有白鹿家印记的账页。", options: [
    { id: "thief", label: "替孩子作保并追问账页来历" },
    { id: "warden", label: "把孩子和账页都交给守仓人" },
  ] },
  { id: "caravan", title: "燃烧的驮车", area: "西门商道", start: 1, end: 5, scene: "一辆驮车起火，车夫被压住，货箱上的锁已经烧红。", options: [
    { id: "rescue", label: "先救被压住的车夫" },
    { id: "cargo", label: "先拖走即将烧毁的货箱" },
  ] },
  { id: "furnace_clue", title: "王炉门上的断纹", area: "灰炉遗址", start: 2, end: 5, visible: (s) => s.flags.gateInspected && !s.flags.innerOpen, scene: "熔毁锁芯旁有三段断纹，铜线一直连向守门甲胄。", options: [
    { id: "smith", label: "把断纹拓印交给铁匠", visible: (s) => !s.flags.smithDoorTheory, req: (s) => s.flags.smithPromise, callback: "你此前答应了铁匠的试炉" },
    { id: "key", label: "把三件[古代锻造]装备交给铁匠", visible: (s) => Boolean(s.flags.smithDoorTheory), req: (s) => countUnequipped(s, (i) => i.identityTags.includes("古代锻造")) >= 3, callback: "铁匠已经辨认出炉门断纹" },
    { id: "force", label: "挑战守门甲胄" },
  ] },
  { id: "cooling_well", title: "冒蒸汽的冷却井", area: "灰炉遗址", start: 2, end: 5, visible: (s) => s.flags.guardianFailed && !s.flags.innerOpen, scene: "甲胄退回炉门后，冷却井仍沿铜管向它输送蒸汽。", options: [
    { id: "jam", label: "用废铁卡死冷却阀", callback: "此前与守门甲胄交手时发现了供汽铜管" },
  ] },
  { id: "quartermaster", title: "河畔营地的军需车", area: "河畔营地", start: 3, end: 5, scene: "军需车停在木栅后，后坡的排水沟通向营地内侧。", options: [
    { id: "thief", label: "让小偷从排水沟潜入", req: (s) => s.roster.includes("thief"), callback: "鸦指此前加入了你的队伍" },
    { id: "fight", label: "正面袭击军需守卫" },
  ] },
  { id: "duelist", title: "白鹿家的旁支剑士", area: "西门商道", start: 4, end: 5, scene: "旁支剑士没有跟护卫队同行。她反复查看少爷留下的书面命令。", options: [
    { id: "evidence", label: "把收集到的账页与证词交给她", req: (s) => s.resources.evidence >= 3, callback: "此前取得的账页与证词在这里有了用处" },
    { id: "challenge", label: "以剑证明你不是街头暴徒" },
  ] },
  { id: "night_raid", title: "营地夜巡", area: "河畔营地", start: 4, end: 5, scene: "巡逻火把沿河移动，高地能看见他们换岗时留下的空档。", options: [
    { id: "ambush", label: "伏击夜巡队" },
    { id: "scout", label: "只记录换岗路线", req: (s) => s.roster.includes("thief"), callback: "鸦指能够避开巡逻视线" },
  ] },
  { id: "market_toll", title: "集市上的私设路税", area: "镇中心", start: 1, end: 5, scene: "两名白鹿家仆役堵住集市出口，说少爷受伤后每辆货车都要补交安宁钱。", options: [
    { id: "protect", label: "替摊贩交三枚金币", req: (s) => s.resources.gold >= 3 },
    { id: "names", label: "记下收钱人的姓名与印章" },
    { id: "table", label: "当众掀翻收费桌" },
  ] },
  { id: "watch_bell", title: "裂开的警钟", area: "旧城墙", start: 2, end: 5, scene: "城墙警钟裂了一道口，修钟匠说剩下的铜链只能修钟或加固西门，不能两边都用。", options: [
    { id: "bell", label: "把铜链留给警钟" },
    { id: "gate", label: "把铜链拖去加固西门" },
  ] },
  { id: "missing_scribe", title: "躲进草棚的书记员", area: "西门商道", start: 2, end: 5, scene: "少爷家的书记员抱着一册货运账躲在草棚里。他说回去会挨打，却也不敢公开作证。", options: [
    { id: "shelter", label: "藏起书记员并抄下货运账" },
    { id: "return", label: "把他送回白鹿家换赏钱" },
  ] },
  { id: "grain_prices", title: "突然涨价的粮铺", area: "镇中心", start: 3, end: 5, scene: "粮铺老板听说家兵将至，把最后几袋麦子锁进后仓，只肯按三倍价格出售。", options: [
    { id: "ration", label: "逼粮铺按户限量平价出售" },
    { id: "auction", label: "替粮铺维持高价并收取分成" },
  ] },
  { id: "ford_deserter", title: "浅滩边的逃兵", area: "河畔营地", start: 3, end: 5, scene: "一名家兵把制服埋进浅滩。他知道队长的口令，只求一条不被追回去的路。", options: [
    { id: "hide", label: "藏起逃兵并记下口令" },
    { id: "return", label: "把逃兵交给营地领赏" },
  ] },
  { id: "road_barricade", title: "商道上的最后一车木料", area: "西门商道", start: 4, end: 5, scene: "木匠只剩一车梁木。镇民想拿它封路，车队老板则愿意出钱买走。", options: [
    { id: "build", label: "把木料留下修筑路障" },
    { id: "sell", label: "让车队带走木料" },
  ] },
  { id: "widow_claim", title: "拿着马鞍的寡妇", area: "镇中心", start: 4, end: 5, scene: "寡妇说少爷纵马撞死了她丈夫，家仆却拿出一张已经按过手印的和解书。", options: [
    { id: "hearing", label: "召集见证人重新核对和解书" },
    { id: "settle", label: "劝她收下补偿不要再追究" },
  ] },

  { id: "exile_scout", title: "被驱逐的灰炉向导", area: "黑石采坑", start: 6, end: 8, scene: "一名流放者在矿道口画守卫换岗图，她想取回家族被扣下的骨匣。", options: [
    { id: "return", label: "答应替她取回骨匣" },
    { id: "rune", label: "用一件[流放者]装备证明来意", req: (s) => heroHasTag(s, "player", "流放者"), callback: "你此前选择穿戴了带有流放者印记的装备" },
  ] },
  { id: "mine_strike", title: "拒绝下井的矿工", area: "北部矿区", start: 6, end: 10, scene: "矿主扣住粮票逼人下井，矿工则堵住运煤轨道。", options: [
    { id: "miners", label: "站在矿工一边扣下运煤车" },
    { id: "owner", label: "护送运煤车通过人群" },
    { id: "audit", label: "查清粮票和欠薪账", req: (s) => s.resources.evidence >= 2, callback: "此前收集的记录可以与欠薪账互相核对" },
  ] },
  { id: "chapel_guard", title: "封闭礼拜堂的灰袍司祭", area: "旧礼拜堂", start: 6, end: 10, scene: "司祭把避难者锁在礼拜堂里，门外的人说他私藏了教会药品。", options: [
    { id: "medicine", label: "送去三份药品", req: (s) => s.resources.medicine >= 3 },
    { id: "search", label: "要求当众检查地下储藏室" },
  ] },
  { id: "bridge_engineer", title: "被拆毁的北桥", area: "北部矿区", start: 7, end: 10, scene: "桥梁师守着半截绞盘，她说缺两件古代锻造零件，也可以冒险从激流里拖出旧梁。", options: [
    { id: "parts", label: "交出两件[古代锻造]装备", req: (s) => countUnequipped(s, (i) => i.identityTags.includes("古代锻造")) >= 2, callback: "此前带出的古代锻造物能替代耐火轴承" },
    { id: "river", label: "带队下水抢修旧梁" },
  ] },
  { id: "arena", title: "矿区的倒塌擂台", area: "北部矿区", start: 7, end: 10, scene: "冠军答应加入能把他逼出白线的人。围观者已经在废石上下注。", options: [
    { id: "fight", label: "公开挑战擂台冠军" },
    { id: "rematch", label: "接受双方卸甲重赛", visible: (s) => s.flags.arenaFailed, callback: "此前的败战让你看清了冠军接受的重赛规则" },
  ] },
  { id: "deserter_mage", title: "躲在盐仓里的逃亡术士", area: "河畔营地", start: 7, end: 10, scene: "术士烧掉了雇佣军征召书。他需要一条离开封锁线的路。", options: [
    { id: "route", label: "把夜巡换岗图交给他", req: (s) => s.flags.campScouted, callback: "你此前掌握了营地的换岗路线" },
    { id: "bribe", label: "花八枚金币买通河船", req: (s) => s.resources.gold >= 8 },
  ] },
  { id: "tax_archive", title: "临时税务所", area: "镇中心", start: 8, end: 10, scene: "执法官把镇民欠税册与少爷的赔偿要求钉在同一块木板上。", options: [
    { id: "steal", label: "趁换岗时偷走盖章底册", req: (s) => s.roster.includes("thief") || s.roster.includes("exile"), callback: "队伍里有人熟悉潜入与换岗" },
    { id: "petition", label: "召集欠税人逐条核对" },
  ] },
  { id: "grain_seizure", title: "被扣押的冬粮", area: "西门商道", start: 8, end: 10, scene: "执法队扣下冬粮作为赔偿，车夫只认盖章放行条。", options: [
    { id: "papers", label: "拿税务底册逼车夫放粮", req: (s) => s.flags.taxLedger, callback: "此前取得的盖章底册能推翻扣粮手续" },
    { id: "raid", label: "截停押粮队" },
  ] },
  { id: "signal_tower", title: "山脊上的信号塔", area: "北部矿区", start: 8, end: 10, scene: "信号塔每晚向南方点三次火，守塔人从不离开平台。", options: [
    { id: "false", label: "换掉今晚的灯油与旗语", req: (s) => s.roster.includes("exile") || s.roster.includes("engineer"), callback: "此前结识的向导或桥梁师看得懂旗语机关" },
    { id: "storm", label: "趁雷雨强攻塔楼" },
  ] },
  { id: "paymaster", title: "雇佣军发饷日", area: "河畔营地", start: 9, end: 10, scene: "六名押运兵围着钱箱，营帐里不断有人来问欠饷。", options: [
    { id: "fight", label: "夺下发饷钱箱" },
    { id: "rumor", label: "把欠饷名单贴到营门", req: (s) => s.flags.taxLedger || s.resources.evidence >= 4, callback: "此前掌握的账目能证明军饷被截留" },
  ] },
  { id: "noble_banquet", title: "执法官的宴会", area: "镇中心", start: 9, end: 10, scene: "执法官邀请镇上有头脸的人赴宴，桌上摆着尚未宣读的判决书。", options: [
    { id: "noble", label: "穿戴[贵族]装备入席", req: (s) => heroHasTag(s, "player", "贵族"), callback: "你此前穿上的贵族印记改变了守门人的态度" },
    { id: "servants", label: "让学徒混进后厨", req: (s) => s.roster.includes("apothecary") || s.roster.includes("thief"), callback: "此前加入的同伴能从仆役通道进入" },
  ] },
  { id: "hunter", title: "矿道里的食铁兽", area: "黑石采坑", start: 9, end: 10, scene: "巨兽咬断矿轨后躲进黑暗，猎人用粉笔标出它反复经过的岔路。", options: [
    { id: "hunt", label: "跟猎人进入矿道" },
    { id: "trap", label: "在标出的岔路布置陷阱", visible: (s) => s.flags.huntFailed, callback: "此前追猎失败后，你记住了食铁兽反复经过的岔路" },
  ] },
  { id: "quarry_collapse", title: "塌方后的求救声", area: "黑石采坑", start: 6, end: 10, scene: "塌方堵住采坑支道，石缝里还能听见敲击声；另一侧散落着没人看守的矿晶箱。", options: [
    { id: "rescue", label: "组织人手挖开求救方向" },
    { id: "crystals", label: "趁乱拖走矿晶箱" },
  ] },
  { id: "river_customs", title: "河面上的临时关卡", area: "河畔营地", start: 6, end: 10, scene: "执法队在河面拉起铁索，每条船都要交钱并登记乘客。岸边旧纤道仍通向下游。", options: [
    { id: "route", label: "利用掌握的换岗路线走旧纤道", req: (s) => s.flags.campScouted, callback: "第一幕记下的营地换岗路线延伸到了河岸" },
    { id: "bribe", label: "交四枚金币让一条船放行", req: (s) => s.resources.gold >= 4 },
    { id: "papers", label: "偷记关卡登记册上的名字" },
  ] },
  { id: "chapel_inquest", title: "礼拜堂外的审问席", area: "旧礼拜堂", start: 7, end: 10, scene: "教会巡查员要求司祭交出避难者名册，门外已经摆好审问桌。", options: [
    { id: "priest", label: "让伊文当众质疑审问程序", req: (s) => s.roster.includes("priest"), callback: "此前加入的伊文熟悉教会审问规则" },
    { id: "letters", label: "交出地下室发现的教会来信", req: (s) => s.nodes.chapel_guard?.option === "search", callback: "此前搜查地下室时发现了未登记来信" },
    { id: "list", label: "交出名册换取礼拜堂平安" },
  ] },
  { id: "mercenary_contract", title: "钉在酒馆门上的佣兵契约", area: "镇中心", start: 7, end: 10, scene: "契约承诺围剿后按人头分钱，末尾却写着伤亡与欠饷都由执法官另行解释。", options: [
    { id: "buyout", label: "支付十枚金币买断一队佣兵", req: (s) => s.resources.gold >= 10 },
    { id: "clause", label: "用税务底册证明契约无法兑现", req: (s) => s.flags.taxLedger, callback: "此前取得的税务底册能核对执法官的支付能力" },
    { id: "copy", label: "抄下契约留作证据" },
  ] },
  { id: "mine_prisoners", title: "运煤车里的囚工", area: "北部矿区", start: 8, end: 10, scene: "一辆封闭运煤车里关着拒绝签契约的矿工，押车守卫正在等下一班换岗。", options: [
    { id: "free", label: "撬开车门放走囚工" },
    { id: "pay", label: "付五枚金币让守卫丢下钥匙", req: (s) => s.resources.gold >= 5 },
  ] },
  { id: "north_hostages", title: "北门下的扣押名单", area: "北部矿区", start: 9, end: 10, scene: "执法队扣住六名镇民，声称只要煤灰镇交药或交出证人就放人。", options: [
    { id: "medicine", label: "交出两份药换回镇民", req: (s) => s.resources.medicine >= 2 },
    { id: "question", label: "追查名单上被反复涂改的名字" },
  ] },

  { id: "banner_company", title: "失去军籍的断旗队", area: "西门商道", start: 11, end: 15, scene: "二十名旧王国兵护送难民抵达。他们没有粮，也不愿再替贵族卖命。", options: [
    { id: "grain", label: "把夺回的冬粮分给他们", req: (s) => s.flags.grainRecovered, callback: "此前夺回的冬粮现在能安置难民与旧兵" },
    { id: "pay", label: "支付十二枚金币作为军饷", req: (s) => s.resources.gold >= 12 },
    { id: "oath", label: "出示执法官伪造判决的证据", req: (s) => s.resources.evidence >= 6, callback: "此前累积的证据能动摇旧兵对命令的服从" },
  ] },
  { id: "swamp_witch", title: "沼泽边的盐枝女巫", area: "南部沼泽", start: 11, end: 15, scene: "女巫能让攻城兽拒绝进食，但礼拜堂的人要求先烧掉她的药圃。", options: [
    { id: "protect", label: "承诺保护她的药圃" },
    { id: "church", label: "支持礼拜堂封禁药圃" },
    { id: "herbs", label: "交出五份药品换取兽群药剂", req: (s) => s.resources.medicine >= 5 },
  ] },
  { id: "war_council", title: "三方争吵的战前会议", area: "镇中心", start: 11, end: 15, scene: "矿工要守矿道，商人要守粮仓，司祭坚持先撤走伤员。能调动的人手只够先答应一方。", options: [
    { id: "miners", label: "先把人手交给矿工" },
    { id: "merchants", label: "先把人手交给商人" },
    { id: "chapel", label: "先把人手交给礼拜堂" },
  ] },
  { id: "sky_ferry", title: "山顶的旧式飞艇塔", area: "北部矿区", start: 11, end: 15, scene: "升降塔仍能转动，但主轴缺一枚耐火炉心，塔下还有雇佣军巡逻。", options: [
    { id: "core", label: "安装一件[古代锻造]史诗装备", req: (s) => countUnequipped(s, (i) => i.identityTags.includes("古代锻造") && rarityIndex(i.rarity) >= rarityIndex("史诗")) >= 1, callback: "此前刷到的高阶古代锻造物可以充当炉心" },
    { id: "seize", label: "清除塔下巡逻队" },
  ] },
  { id: "plague_camp", title: "围城前的热病营", area: "旧礼拜堂", start: 12, end: 15, scene: "难民营出现热病，药品不够同时救治病人和维持前线。", options: [
    { id: "sick", label: "把药优先留给病人", req: (s) => s.resources.medicine >= 3 },
    { id: "front", label: "把药优先送往前线", req: (s) => s.resources.medicine >= 3 },
    { id: "witch", label: "请盐枝女巫辨认病源", req: (s) => s.roster.includes("witch"), callback: "你此前保护或帮助了盐枝女巫" },
  ] },
  { id: "siege_engines", title: "正在组装的攻城器", area: "河畔营地", start: 12, end: 15, scene: "八名工兵在河滩组装投石机，零件分散在三处火堆旁。", options: [
    { id: "fight", label: "强袭攻城器工地" },
    { id: "sabotage", label: "让桥梁师混入工匠队", req: (s) => s.roster.includes("engineer"), callback: "此前加入的桥梁师熟悉承重机关" },
  ] },
  { id: "beast_pens", title: "围剿军的战兽栏", area: "南部沼泽", start: 12, end: 15, scene: "五头披甲战兽被铁链拴在木桩旁，饲养员用同一只桶投食。", options: [
    { id: "fight", label: "在战兽出栏前解决它们" },
    { id: "dose", label: "把女巫药剂倒进食桶", req: (s) => s.flags.beastDrug, callback: "盐枝此前交给你的兽群药剂在这里有了目标" },
  ] },
  { id: "traitor_gate", title: "半夜打开的旧城门", area: "旧城墙", start: 13, end: 15, scene: "守门人说风吹开了门，但门闩上有新鲜锉痕，旁边还掉着贵族火漆。", options: [
    { id: "arrest", label: "立刻扣下守门人" },
    { id: "follow", label: "假装没有发现并跟踪他" },
  ] },
  { id: "evacuation_route", title: "挤满伤员的撤离路", area: "旧城墙", start: 11, end: 15, scene: "南门道路已经被难民车堵住。飞艇塔、矿道和商队都能带走一部分人，但没有一条路容得下所有人。", options: [
    { id: "ferry", label: "优先用飞艇运走伤员", req: (s) => s.flags.skyFerry, callback: "此前重新启动的飞艇塔现在可以运人" },
    { id: "mine", label: "让矿工从矿道疏散家属", req: (s) => s.flags.minersSupport, callback: "此前支持的矿工愿意开放秘密矿道" },
    { id: "carts", label: "征用商队车辆分批撤离" },
  ] },
  { id: "merchant_council", title: "关门议价的商人议会", area: "镇中心", start: 11, end: 15, scene: "商人们愿意提供车马和仓库，但要求战后优先偿还损失。", options: [
    { id: "grain", label: "用夺回的冬粮换取车马", req: (s) => s.flags.grainRecovered, callback: "此前夺回的冬粮成为商人愿意接受的筹码" },
    { id: "fund", label: "支付八枚金币雇佣车队", req: (s) => s.resources.gold >= 8 },
    { id: "refuse", label: "拒绝战后优先偿还的条件" },
  ] },
  { id: "chapel_sanctuary", title: "礼拜堂里的最后空位", area: "旧礼拜堂", start: 11, end: 15, scene: "礼拜堂只剩一片能铺床的空地。司祭要留给伤员，女巫则说发热的难民必须先隔离。", options: [
    { id: "priest", label: "让伊文安排伤员床位", req: (s) => s.roster.includes("priest"), callback: "此前加入的伊文能调动礼拜堂人员" },
    { id: "witch", label: "听从盐枝划出隔离区", req: (s) => s.roster.includes("witch"), callback: "此前加入的盐枝辨认得出传染迹象" },
    { id: "families", label: "把空位留给带孩子的家庭" },
  ] },
  { id: "enemy_letters", title: "从城墙缝里塞进的密信", area: "旧城墙", start: 12, end: 15, scene: "三封密信分别许诺赦免、金币和职位，落款来自围剿联盟中不同的军队。", options: [
    { id: "trace", label: "沿贵族联络点追查送信人", req: (s) => s.flags.traitorNetwork, callback: "此前跟踪守门人找到了仍在使用的联络点" },
    { id: "publish", label: "把三封互相矛盾的密信贴满镇口" },
    { id: "answer", label: "挑一封回信试探对方底线" },
  ] },
  { id: "deserter_wave", title: "城外放下武器的人", area: "西门商道", start: 12, end: 15, scene: "十几名围剿军士兵把武器堆在路边，声称只想进镇躲过下一轮冲锋。", options: [
    { id: "asylum", label: "收下武器并准许他们进镇" },
    { id: "question", label: "先分开审问各营部署" },
    { id: "refuse", label: "拒绝开门但留下食物" },
  ] },
  { id: "powder_store", title: "旧仓库里的火药桶", area: "河畔营地", start: 13, end: 15, scene: "旧仓库地下还存着一批受潮火药。罗莎说能改成陷阱，维尔则想把它们做成火墙。", options: [
    { id: "engineer", label: "让罗莎改装承重陷阱", req: (s) => s.roster.includes("engineer"), callback: "此前加入的罗莎能判断火药与承重结构" },
    { id: "mage", label: "让维尔布置引燃火墙", req: (s) => s.roster.includes("mage"), callback: "此前加入的维尔能够远程引燃受潮火药" },
    { id: "move", label: "把火药搬离居民区" },
  ] },
  { id: "noble_hostages", title: "被镇民扣住的贵族亲眷", area: "镇中心", start: 13, end: 15, scene: "几名贵族亲眷被堵在旅店。镇民想拿他们换停战，也有人要求立刻清算。", options: [
    { id: "bargain", label: "用证据和人质共同提出交换", req: (s) => s.resources.evidence >= 6, callback: "此前积累的证据让交换不只是空口威胁" },
    { id: "release", label: "保证安全并放他们离开" },
    { id: "hold", label: "继续扣住他们等待围剿军回应" },
  ] },
  { id: "last_supply", title: "只能送往一处的补给车", area: "西门商道", start: 14, end: 15, scene: "最后一辆补给车停在岔路口：前线缺药，难民缺粮，城墙也缺修补材料。", options: [
    { id: "front", label: "把补给送往前线" },
    { id: "refugees", label: "把补给送往难民营" },
    { id: "walls", label: "把补给送往旧城墙" },
  ] },
  { id: "ancient_core", title: "古王炉心的第二道门", area: "王炉地底", start: 13, end: 15, visible: (s) => s.flags.innerOpen, scene: "第二道门后传来整齐锤击声，地上有一排不属于人类的脚印。", options: [
    { id: "fight", label: "进入炉心清除守炉造物" },
    { id: "seal", label: "让铁匠与桥梁师重接封印", req: (s) => s.roster.includes("engineer") && s.flags.smithPromise, callback: "此前结识的铁匠与桥梁师能共同理解封印结构" },
  ] },
  { id: "coalition_envoy", title: "围剿联盟的无旗使者", area: "镇中心", start: 14, end: 15, scene: "使者承认三支军队并不互相信任。他只问你准备把谁的秘密先公开。", options: [
    { id: "pay", label: "交出发饷钱箱里的欠条", req: (s) => s.flags.payChest, callback: "此前夺下的钱箱里留着各营欠饷凭据" },
    { id: "law", label: "公开执法官伪造判决", req: (s) => s.flags.falseJudgment, callback: "此前取得的伪造判决能让联盟互相追责" },
    { id: "fear", label: "展示[恐怖]装备要求他们退军", req: (s) => heroHasTag(s, "player", "恐怖"), callback: "你此前选择穿戴的恐怖印记已经传进敌营" },
  ] },
];

const COMBAT_OPTIONS = new Set([
  "furnace_clue:force", "quartermaster:fight", "duelist:challenge", "night_raid:ambush",
  "bridge_engineer:river", "arena:fight", "arena:rematch", "grain_seizure:raid", "signal_tower:storm",
  "paymaster:fight", "hunter:hunt", "hunter:trap", "sky_ferry:seize", "siege_engines:fight",
  "beast_pens:fight", "ancient_core:fight",
]);

const EVENT_OUTCOMES = {
  "injured_shield:carry": "你把伤员背回镇里。赫恩包扎好伤口后，带着盾牌加入了队伍。",
  "injured_shield:purse": "你带走了断木下的钱袋。伤员留在商道边，镇里没人知道他后来去了哪里。",
  "smith_intro:promise": "铁匠把试炉留到第四日：带回三把普通武器，她就替你重锻一次。",
  "smith_intro:forge": "蓝钢长剑成形时，王炉门的断纹同时亮起。门后的灰炉内环已经可以进入。",
  "well_dispute:tanner": "染坊按旧约拿到了水，也付了你报酬；菜农们沉默地拆走了引水槽。",
  "well_dispute:grower": "水先流进了菜地。菜农送来药草答谢，染坊则记住了这次损失。",
  "well_dispute:measure": "旧账和水尺证明两边都多报了用水量。新的分水刻度被当众钉在井栏上。",
  "apothecary_debt:pay": "债主拿钱离开。米娅收起剩下的药，带着药箱加入了队伍。",
  "apothecary_debt:patients": "你陪米娅照看病人直到债主散去。她带着省下的药和你一同离开。",
  "thief_trial:thief": "孩子交出白鹿家的账页，也说出了偷运粮食的暗门。鸦指随后加入了队伍。",
  "thief_trial:warden": "守仓人收下孩子与账页，答应把两者一起交给镇议事人核对。",
  "caravan:rescue": "车夫被从燃烧的横梁下拖出。他把随车药包留给了救他的人。",
  "caravan:cargo": "货箱保住了，车夫却没能及时脱身。烧黑的箱里留下金币和一件装备。",
  "furnace_clue:smith": "铁匠认出断纹来自旧式炉门：普通钥匙无用，同源旧物或许能重铸锁芯。",
  "furnace_clue:key": "三件旧物被熔成带断纹的钥胚。炉门在低沉的摩擦声中打开。",
  "cooling_well:jam": "废铁卡死了冷却阀。铜管里的蒸汽声减弱，守门甲胄的动作也慢了下来。",
  "quartermaster:thief": "鸦指从排水沟打开车闩。军需车侧翻，营地里的人开始抢救箭箱和粮袋。",
  "duelist:evidence": "艾妲逐页核对账页与证词，确认少爷隐瞒了命令。她收剑加入了队伍。",
  "night_raid:scout": "鸦指记下三轮换岗的空档，没有惊动巡逻队。营地的夜间路线已经清楚。",
  "market_toll:protect": "金币替摊贩交到家仆手里，集市重新开门；摊贩们把欠下的人情记在你名下。",
  "market_toll:names": "收钱人的姓名、印章和数目被逐笔记下。家仆察觉不对时，那页记录已经传过半条街。",
  "market_toll:table": "收费桌被当街掀翻，堵路的家仆暂时退开；围观者叫好，白鹿家的人也记住了你。",
  "watch_bell:bell": "旧警钟重新挂上钟架。镇民约好钟响三次便携武器到西门集合。",
  "watch_bell:gate": "木料被钉在西门内侧，最松的一段栅门撑住了；钟楼仍旧沉默。",
  "missing_scribe:shelter": "抄写员被藏进空酒窖。他交出少爷强征马匹时留下的命令抄本。",
  "missing_scribe:return": "抄写员被送回账房。管事付清赏钱，随即把他锁进了后院。",
  "grain_prices:ration": "存粮按户重新登记，几袋药草也从仓底翻了出来；商人没能趁乱抬价。",
  "grain_prices:auction": "粮袋当场卖给出价最高的人。你的钱袋鼓了起来，队尾的穷户却空手离开。",
  "ford_deserter:hide": "逃兵换上船工衣服藏进芦苇荡，并把护卫队的人数和口令写了下来。",
  "ford_deserter:return": "白鹿家收回逃兵，赏钱如数付给你；河对岸很快传来一声枪响。",
  "road_barricade:build": "翻倒的货车被改成两道错开的路障，镇民也把沙袋拖到了路边。",
  "road_barricade:sell": "可用的车轴和铁箍被拆走卖掉。商道重新畅通，路口没有留下遮挡。",
  "widow_claim:hearing": "欠条、收据和证词被摆到同一张桌上。少爷亲随多收的那笔钱再也藏不住了。",
  "widow_claim:settle": "你逼亲随退还一半田契，寡妇当场按了手印；双方都接受了这笔不完整的和解。",
  "exile_scout:return": "你答应取回骨匣。萨芮把换岗图卷起，先与你一同行动。",
  "exile_scout:rune": "萨芮认出你身上的流放者印记，把换岗图和骨匣的去向都告诉了你。",
  "mine_strike:miners": "运煤车被扣下，矿工把粮食分给家人，并答应在围攻时守住矿道。",
  "mine_strike:owner": "运煤车穿过人群，矿主付清了护送费；矿工没有让开第二条轨道。",
  "mine_strike:audit": "欠薪账被摊在轨道上逐项核对。矿主无法否认，矿工也答应恢复一条矿道。",
  "chapel_guard:medicine": "药品送进礼拜堂，伊文让避难者打开侧门，也带着余下药箱加入队伍。",
  "chapel_guard:search": "地下室被当众打开：药品确实短缺，但里面还藏着未登记的教会来信。",
  "bridge_engineer:parts": "两件旧物被拆成耐火轴承。北桥绞盘重新转动，罗莎加入了队伍。",
  "deserter_mage:route": "维尔记下夜巡空档，烧掉最后一张征召书，沿你给的路线加入队伍。",
  "deserter_mage:bribe": "河船收下金币，维尔有了退路，也愿意暂时留在队伍里。",
  "tax_archive:steal": "盖章底册从税务所消失。你现在握有赔偿命令被改写过的原始记录。",
  "tax_archive:petition": "欠税人逐条核对底册，几处后添墨迹在众人面前暴露出来。",
  "grain_seizure:papers": "车夫看见盖章底册后拒绝继续押粮，冬粮被送回镇里。",
  "signal_tower:false": "假灯油和旗语按时升起。南方回信照旧，但内容已经被你误导。",
  "paymaster:rumor": "欠饷名单贴满营门。士兵围住军需官，钱箱暂时没人再替他看守。",
  "noble_banquet:noble": "贵族印记让你坐进宴席。尚未宣读的判决书上，几处印章日期互相矛盾。",
  "noble_banquet:servants": "后厨把判决书送错了桌。米娅记下内容，鸦指则带回了盖章残页。",
  "quarry_collapse:rescue": "被压住的矿工一个个从石缝里拖出来。活下来的人答应替你守住矿道。",
  "quarry_collapse:crystals": "支撑木被撬开后，矿工来不及撤离；你从新裂开的矿脉里带走了晶石和一件旧物。",
  "river_customs:route": "你沿此前记下的巡逻空档绕过税卡，一条不经官道的运货路线被走通了。",
  "river_customs:bribe": "税吏收钱后抬起栏杆，没有在货单上留下这支队伍的名字。",
  "river_customs:papers": "三份互相矛盾的税单被你扣下。税吏不敢再拦，但拒绝盖放行章。",
  "chapel_inquest:priest": "伊文站到礼拜堂门前，公开质问搜查令的印章。审讯官没有闯门，只留下了威胁。",
  "chapel_inquest:letters": "教会来信被摊在众人面前。搜查队的命令与信上日期对不上，审讯被迫中止。",
  "chapel_inquest:list": "避难者名单被交出去，礼拜堂免于搜查；几户人家连夜搬离了镇子。",
  "mercenary_contract:buyout": "欠饷被填上后，一小队佣兵撕掉旧徽记，转而接受你的指挥。",
  "mercenary_contract:clause": "原始合同证明雇主先违约。佣兵拒绝继续冲锋，并把违约条款交给你。",
  "mercenary_contract:copy": "你抄走合同和签名。佣兵仍留在原营，但雇主拖欠军饷的事实有了凭据。",
  "mine_prisoners:free": "囚笼被砸开，矿工沿废弃支洞撤走；留下的人开始搬石头封堵追兵。",
  "mine_prisoners:pay": "守卫收下赎金放人。矿工毫发无伤地离开，囚笼和守卫都还留在原处。",
  "north_hostages:medicine": "药品换回了全部人质。伤者被抬进镇里，押送队拿药后向北撤走。",
  "north_hostages:question": "你只赎回能说出营地布置的人。名单和岗哨位置到手，其余人质仍被押往北方。",
  "banner_company:grain": "冬粮分到难民手里。断旗队重新列队，决定替送粮的人守住道路。",
  "banner_company:pay": "军饷分发完毕，旧王国兵重新竖起断旗，加入了守镇队伍。",
  "banner_company:oath": "伪造判决被旧兵逐页传看。他们拒绝再替贵族命令驱赶难民。",
  "swamp_witch:protect": "盐枝接受保护药圃的承诺，带着让战兽拒食的药剂加入队伍。",
  "swamp_witch:church": "药圃被封，礼拜堂的人公开支持你；盐枝收起药剂，独自退回沼泽。",
  "swamp_witch:herbs": "药品换来了整桶兽群药剂。盐枝也带着剩余配方加入队伍。",
  "war_council:miners": "有限的人手先被派往矿道。矿工开始加固北侧入口。",
  "war_council:merchants": "有限的人手先被派往粮仓。商人开始转移冬粮和车队。",
  "war_council:chapel": "有限的人手先被派往礼拜堂。伤员与难民沿侧门撤离。",
  "sky_ferry:core": "史诗旧物嵌入主轴，飞艇塔重新转动。高处的道路从此不再遥不可及。",
  "plague_camp:sick": "药先留给病人，热病营的高烧开始下降，前线只能重新分配存药。",
  "plague_camp:front": "药被送往前线，守军得到补给；难民营仍有人整夜发热。",
  "plague_camp:witch": "盐枝从水桶里辨出病源，隔离了污染的井水，没有消耗前线药品。",
  "siege_engines:sabotage": "罗莎混入工匠队，把承重销换成了软铁。投石机仍立着，却经不起第一次发射。",
  "beast_pens:dose": "药剂倒进同一只食桶。五头战兽闻过饲料后开始撕扯缰绳，拒绝出栏。",
  "traitor_gate:arrest": "守门人被当场扣下，旧城门重新上闩；城里的人暂时不知道他在等谁。",
  "traitor_gate:follow": "你假装没看见锉痕，跟着守门人找到了一处仍在使用的贵族联络点。",
  "evacuation_route:ferry": "重新运转的飞艇把伤员分批送过城墙，镇中心腾出了一条撤离通道。",
  "evacuation_route:mine": "矿工拆开旧通风井，难民沿矿道撤到北坡；入口随后被重新伪装。",
  "evacuation_route:carts": "商人的车队被征作撤离车，老人和孩子先被送走；前线少了几辆运货车。",
  "merchant_council:grain": "商人承认你保住过粮价，交出车队和仓库钥匙支持守城。",
  "merchant_council:fund": "金币填上了商队可能蒙受的损失，几辆满载物资的车驶向前线。",
  "merchant_council:refuse": "你拒绝替商人兜底。部分镇民拍手叫好，商队则关门自行撤货。",
  "chapel_sanctuary:priest": "伊文敲响礼拜堂小钟，侧门向平民开放；守堂人开始登记伤员。",
  "chapel_sanctuary:witch": "盐枝用药雾隔开病人与难民，礼拜堂腾出足够位置接纳更多家庭。",
  "chapel_sanctuary:families": "你亲自把几户人家带进地下室。避难处挤满了人，但没人被留在门外。",
  "enemy_letters:trace": "信使按原路返回时被跟上了。联络点的位置和沿途暗号都被记下。",
  "enemy_letters:publish": "敌军互相指责的书信贴满街口，围剿联盟的共同命令开始失去分量。",
  "enemy_letters:answer": "一封盖着假印章的回信被送回敌营。对方接受了联络，却还没有亮出底牌。",
  "deserter_wave:asylum": "放下武器的逃兵被安置在外圈营地，他们提供了口令，也答应守住自己的营门。",
  "deserter_wave:question": "逃兵逐个画出营地路线后被放走。你得到情报，却没有留下这批人。",
  "deserter_wave:refuse": "镇门没有为逃兵打开。镇民免去安置负担，也看见他们重新走回敌军方向。",
  "powder_store:engineer": "罗莎拆掉引信并换了仓门锁，敌军留下的火药再也无法按原计划引爆。",
  "powder_store:mage": "维尔把火线接进敌军器械场。远处很快升起一团黑烟，仓库也彻底报废。",
  "powder_store:move": "火药被连夜搬出居民区，最近的几条街免于殉爆；这批火药没能用于反击。",
  "noble_hostages:bargain": "贵族联络点收到交换条件。人质暂时留在你手里，一条谈判渠道已经打开。",
  "noble_hostages:release": "人质被无条件放走，几户贵族公开称赞这次克制；你也失去了手里的筹码。",
  "noble_hostages:hold": "人质被转移到更牢固的地窖。敌方不敢立刻强攻，镇里却有人对此不安。",
  "last_supply:front": "最后一车药驶向前线，伤兵重新拿起武器；难民与城墙只能继续等待。",
  "last_supply:refugees": "粮食和药品送进避难处，饥饿的人群安静下来；前线没有等到这辆车。",
  "last_supply:walls": "木料与铁件被卸在城墙下，缺口连夜补上；车上没有剩下可分给伤员的物资。",
  "ancient_core:seal": "铁匠与罗莎重接封印。锤击声停下，炉心里留下三件尚未冷却的装备。",
  "coalition_envoy:pay": "使者带走欠饷钱箱里的欠条。围剿军营地当夜就传出争吵。",
  "coalition_envoy:law": "使者带走伪造判决的抄本。三支军队开始互相追问谁有权下令。",
  "coalition_envoy:fear": "使者看见那件令人不安的战利品后，没有再重复总攻的威胁。",
};

const GRIND_ENCOUNTERS = {
  ash: [
    { level: 1, title: "煤灰废道", enemies: [["assassin", "炉灰鼠"], ["assassin", "炉灰鼠"], ["warrior", "捡铁小鬼"]], tier: 1, hp: 0.34, power: 0.31, armor: 0.72 },
    { level: 2, title: "炉渣回廊", enemies: [["warrior", "炉渣猎犬"], ["warrior", "炉渣猎犬"], ["ranger", "余烬投手"], ["knight", "护炉残兵"]], tier: 1, hp: 0.52, power: 0.46, armor: 0.86 },
    { level: 3, title: "熔壳工棚", enemies: [["knight", "熔壳监工"], ["warrior", "焦骨斗士"], ["warrior", "焦骨斗士"], ["mage", "灰烬术士"], ["berserker", "拖链兽"]], tier: 2, hp: 0.67, power: 0.59, armor: 0.96 },
  ],
  inner: [
    { level: 1, title: "余火甬道", enemies: [["warrior", "炉膛爬虫"], ["ranger", "铜钉射手"], ["knight", "守炉残骸"]], tier: 2, hp: 0.56, power: 0.50, armor: 0.92 },
    { level: 2, title: "铸模长廊", enemies: [["knight", "铸模卫"], ["warrior", "铸模卫"], ["mage", "余焰灯灵"], ["priest", "补炉傀儡"]], tier: 2, hp: 0.68, power: 0.61, armor: 1.0 },
    { level: 3, title: "封火室", enemies: [["knight", "封火甲"], ["knight", "封火甲"], ["berserker", "赤铁兽"], ["mage", "炉心残响"], ["priest", "修补傀儡"]], tier: 3, hp: 0.78, power: 0.70, armor: 1.08 },
  ],
  quarry: [
    { level: 1, title: "弃置矿道", enemies: [["assassin", "穴鼠"], ["warrior", "穴居怪"], ["ranger", "拾荒弩手"]], tier: 3, hp: 0.58, power: 0.53, armor: 0.94 },
    { level: 2, title: "黑石装卸场", enemies: [["knight", "矿场监工"], ["warrior", "矿场打手"], ["ranger", "高架弩手"], ["alchemist", "火药工"]], tier: 3, hp: 0.70, power: 0.64, armor: 1.02 },
    { level: 3, title: "食铁兽巢", enemies: [["berserker", "食铁幼兽"], ["berserker", "食铁幼兽"], ["knight", "矿甲守卫"], ["mage", "晶尘术士"], ["priest", "矿井祭司"]], tier: 4, hp: 0.82, power: 0.74, armor: 1.10 },
  ],
  forge: [
    { level: 1, title: "铜壳铸台", enemies: [["knight", "铜壳造物"], ["warrior", "锻锤造物"], ["mage", "火纹造物"]], tier: 4, hp: 0.68, power: 0.62, armor: 1.06 },
    { level: 2, title: "王炉传送带", enemies: [["knight", "王炉卫"], ["warrior", "锻锤卫"], ["ranger", "飞钉机关"], ["alchemist", "熔液机关"]], tier: 5, hp: 0.78, power: 0.70, armor: 1.14 },
    { level: 3, title: "不熄炉室", enemies: [["knight", "古王重甲"], ["knight", "古王重甲"], ["berserker", "熔铁巨像"], ["mage", "炉火记录者"], ["priest", "王炉修复者"]], tier: 6, hp: 0.90, power: 0.80, armor: 1.22 },
  ],
};

const QUEST_DEFINITIONS = [
  {
    id: "white_deer", type: "main", title: "白鹿家的报复", objective: "在第五日前决定如何应对白鹿家的家兵。", deadline: 5,
    visible: (s) => s.day <= 5 || (s.phase === "showdown" && s.showdownAct === 1),
    complete: (s) => Boolean(s.flags.youngMasterRepelled),
    progress: (s) => `第${Math.min(s.day, 5)}/5日`,
    links: {
      place_event_injured_shield: "受伤的盾手也许愿意共同守镇",
      place_event_thief_trial: "白鹿家印记的账页可能成为筹码",
      place_event_market_toll: "家仆正在借少爷之名扩大冲突",
      place_event_missing_scribe: "书记员见过家兵收到的命令",
      place_event_ford_deserter: "逃兵知道家兵口令与部署",
      place_event_widow_claim: "少爷留下的旧案正在发酵",
      place_event_duelist: "旁支剑士能影响家兵的服从",
      place_event_quartermaster: "军需车直接支撑第五日来袭",
      place_event_night_raid: "夜巡路线通向家兵营地",
      place_event_watch_bell: "警钟会改变镇口的迎战准备",
      place_event_road_barricade: "木料可以改变第五日的防线",
      place_showdown: "报复已经抵达镇外",
    },
  },
  {
    id: "three_witnesses", type: "side", title: "三个能开口的人", objective: "找到三份能够互相印证的证词或记录。", deadline: 5,
    visible: (s) => witnessCount(s) > 0 && (s.day <= 5 || witnessCount(s) >= 3),
    complete: (s) => witnessCount(s) >= 3,
    progress: (s) => `${Math.min(3, witnessCount(s))}/3份证词`,
    links: {
      place_event_thief_trial: "屋顶上的账页能补足命令来源",
      place_event_market_toll: "姓名与印章能确定具体执行人",
      place_event_missing_scribe: "书记员能够证明命令如何下达",
      place_event_ford_deserter: "逃兵能证明家兵如何集结",
      place_event_widow_claim: "旧案证词能说明报复并非偶发",
      place_event_duelist: "她愿意听一组能够互证的材料",
    },
  },
  {
    id: "furnace_gate", type: "side", title: "王炉门", objective: "找出打开灰炉内环的办法。",
    visible: (s) => Boolean(s.flags.gateInspected || s.flags.smithDoorTheory || s.flags.guardianFailed || s.flags.innerOpen),
    complete: (s) => Boolean(s.flags.innerOpen), progress: (s) => s.flags.innerOpen ? "内环已开放" : "仍被封锁",
    links: {
      place_gate: "门上的断纹与守门甲胄仍待处理",
      place_event_smith_intro: "铁匠正在试验古代锻造方法",
      place_event_furnace_clue: "断纹、旧装备与甲胄彼此有关",
      place_event_cooling_well: "冷却井连着守门甲胄的铜管",
      place_zone_ash: "外环装备可能带有古代锻造印记",
    },
  },
  {
    id: "north_blockade", type: "main", title: "北桥封锁", objective: "在第十日前处理执法官与雇佣军的封锁。", deadline: 10,
    visible: (s) => (s.day >= 6 && s.day <= 10) || (s.phase === "showdown" && s.showdownAct === 2),
    complete: (s) => Boolean(s.flags.bailiffRepelled), progress: (s) => `第${Math.min(Math.max(s.day, 6), 10) - 5}/5日`,
    links: {
      place_event_mine_strike: "煤与欠薪决定矿工站在哪一边",
      place_event_chapel_guard: "礼拜堂正在承受封锁压力",
      place_event_bridge_engineer: "北桥是封锁线的关键通路",
      place_event_tax_archive: "执法官用税册为封锁找依据",
      place_event_grain_seizure: "冬粮正被当成赔偿物扣押",
      place_event_signal_tower: "信号塔维持着封锁线的联络",
      place_event_paymaster: "欠饷会影响雇佣军是否继续作战",
      place_event_mercenary_contract: "契约把执法官与雇佣军绑在一起",
      place_event_north_hostages: "封锁已经开始扣押镇民",
      place_showdown: "北桥联军已经列阵",
    },
  },
  {
    id: "false_judgment", type: "side", title: "一纸假判决", objective: "找到能推翻执法官判决的三类记录。", deadline: 10,
    visible: (s) => falseJudgmentCount(s) > 0 && (s.day <= 10 || falseJudgmentCount(s) >= 3),
    complete: (s) => falseJudgmentCount(s) >= 3,
    progress: (s) => `${Math.min(3, falseJudgmentCount(s))}/3类记录`,
    links: {
      place_event_tax_archive: "税务底册能核对判决中的数字",
      place_event_chapel_inquest: "教会来信能核对审问程序",
      place_event_mercenary_contract: "佣兵契约暴露判决的受益人",
      place_event_noble_banquet: "尚未宣读的判决书就在宴席上",
      place_event_grain_seizure: "扣粮手续留下了可核对的印章",
      place_event_north_hostages: "扣押名单能证明判决如何执行",
    },
  },
  {
    id: "final_siege", type: "main", title: "围剿联盟", objective: "在第十五日前应对三支互不信任的围剿军。", deadline: 15,
    visible: (s) => s.day >= 11 || (s.phase === "showdown" && s.showdownAct === 3),
    complete: (s) => s.phase === "complete" && Boolean(s.result?.win), progress: (s) => `第${Math.min(Math.max(s.day, 11), 15) - 10}/5日`,
    links: {
      place_event_enemy_letters: "敌军书信暴露了联盟内部矛盾",
      place_event_deserter_wave: "逃兵知道各营的口令与怨气",
      place_event_powder_store: "火药库关系到总攻器械与居民区",
      place_event_noble_hostages: "人质同时牵动地方贵族与镇民",
      place_event_siege_engines: "攻城器械会直接参与总攻",
      place_event_beast_pens: "战兽是围剿军的突阵力量",
      place_event_coalition_envoy: "无旗使者在寻找能拆散联盟的筹码",
      place_showdown: "三支军队已经发动总攻",
    },
  },
  {
    id: "civilian_safety", type: "side", title: "把人留在战火之外", objective: "为平民准备三种能够互相补位的保障。", deadline: 15,
    visible: (s) => civilianSafetyCount(s) > 0 && (s.day <= 15 || civilianSafetyCount(s) >= 3),
    complete: (s) => civilianSafetyCount(s) >= 3,
    progress: (s) => `${Math.min(3, civilianSafetyCount(s))}/3项保障`,
    links: {
      place_event_evacuation_route: "撤离路线决定平民往哪里走",
      place_event_chapel_sanctuary: "礼拜堂可以成为固定避难处",
      place_event_plague_camp: "病人与难民正在争夺有限药品",
      place_event_powder_store: "火药库一旦殉爆会波及居民区",
      place_event_last_supply: "最后一车物资只能优先保障一处",
      place_event_merchant_council: "商队的车辆与仓库能支撑撤离",
    },
  },
];

function actForDay(day) { return day <= 5 ? 1 : day <= 10 ? 2 : 3; }
function clone(value) { return structuredClone(value); }
function hash(text) { let h = 2166136261; for (const ch of String(text)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
function rand(state) { let x = state.rngState >>> 0; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; state.rngState = x >>> 0; return state.rngState / 4294967296; }
function pick(state, rows) { let roll = rand(state) * rows.reduce((sum, row) => sum + row[1], 0); for (const row of rows) { roll -= row[1]; if (roll <= 0) return row[0]; } return rows.at(-1)[0]; }
function rarityIndex(rarity) { return RARITIES.indexOf(rarity); }
function itemPower(item) { return Number(item?.power || 0); }
function zoneAvailable(state, zoneId) {
  const zone = ZONES[zoneId];
  return Boolean(zone && state.day >= zone.start && (!zone.flag || state.flags[zone.flag]));
}

function threatForLevel(level) {
  const safeLevel = Math.max(1, Math.min(THREAT_LEVELS.length, Number(level) || 1));
  return clone(THREAT_LEVELS[safeLevel - 1]);
}

function witnessCount(state) {
  return [state.nodes.thief_trial?.resolved, state.flags.tollNames, state.flags.scribeWitness, state.flags.deserterWitness, state.flags.widowTestimony].filter(Boolean).length;
}

function falseJudgmentCount(state) {
  return [state.flags.taxLedger, state.flags.churchLetters, state.flags.contractBroken, state.flags.falseJudgment, state.flags.hostageList].filter(Boolean).length;
}

function civilianSafetyCount(state) {
  return [state.flags.civiliansSafe, state.flags.mineEvacuation, state.flags.evacuationCarts, state.flags.merchantCarts, state.flags.frontMedicine, state.flags.wallsRepaired].filter(Boolean).length;
}

function publicQuests(state, places) {
  const placeIds = new Set(places.map((place) => place.id));
  return QUEST_DEFINITIONS.filter((quest) => quest.visible(state)).map((quest) => ({
    id: quest.id,
    type: quest.type,
    title: quest.title,
    objective: quest.objective,
    deadline: quest.deadline || null,
    status: quest.complete(state) ? "complete" : "active",
    progressLabel: quest.progress(state),
    relatedPlaces: Object.entries(quest.links)
      .filter(([placeId]) => placeIds.has(placeId))
      .map(([placeId, hint]) => ({ placeId, hint })),
  }));
}

function addQuestLinksToPlaces(places, quests) {
  const linksByPlace = new Map();
  for (const quest of quests) {
    for (const link of quest.relatedPlaces) {
      if (!linksByPlace.has(link.placeId)) linksByPlace.set(link.placeId, []);
      linksByPlace.get(link.placeId).push({ questId: quest.id, questTitle: quest.title, questType: quest.type, hint: link.hint });
    }
  }
  return places.map((place) => ({ ...place, questLinks: linksByPlace.get(place.id) || [] }));
}

function emptyEquipmentSlots() {
  return Object.fromEntries(Object.keys(SLOT_DATA).map((slot) => [slot, null]));
}

function createInitialState(seed = "fifteen-day-demo") {
  const state = {
    version: VERSION,
    seed: String(seed),
    rngState: parseInt(hash(seed), 36) || 1,
    day: 1,
    ap: AP_PER_DAY,
    phase: "planning",
    showdownAct: null,
    roster: ["player"],
    activeParty: ["player"],
    formation: { player: 0 },
    equipment: {},
    inventory: [],
    resources: { gold: 6, medicine: 0, townFavor: 0, evidence: 0, influence: 0 },
    guildRecord: { road_pests: 0, black_iron_warrant: 0 },
    flags: {},
    nodes: {},
    chapterResults: [],
    recent: [],
    lastCombat: null,
    result: null,
    stats: { spentActions: 0, grinds: 0, grindAttempts: 0, combats: 0, failedCombats: 0, salvaged: 0 },
  };
  for (const heroId of Object.keys(HEROES)) state.equipment[heroId] = emptyEquipmentSlots();
  state.inventory.push({
    id: "starter_knife", name: "普通武器 Lv.12", slot: "weapon", slotLabel: "武器", rarity: "普通", rarityId: "common", equipmentLevel: 12,
    power: 6, baseStats: { physicalPower: 6 }, affixes: [{ stat: "might", label: "武力", value: 1, level: 1, category: "major" }], identityTags: [], source: "随身物品",
  });
  state.equipment.player.weapon = "starter_knife";
  addLog(state, "你在镇上打了撒泼的白鹿家少爷。他离开前说，第五日会带人回来。", "threat");
  return state;
}

function addLog(state, text, kind = "result") {
  state.recent.unshift({ day: state.day, kind, text });
  state.recent = state.recent.slice(0, 30);
}

function countUnequipped(state, predicate) {
  return state.inventory.filter(predicate).length;
}

function takeUnequipped(state, predicate, count) {
  const ids = state.inventory.filter(predicate).sort((a, b) => itemPower(a) - itemPower(b)).slice(0, count).map((item) => item.id);
  if (ids.length < count) throw new Error("物品已经不在背包里。");
  for (const slots of Object.values(state.equipment)) {
    for (const slot of Object.keys(slots)) if (ids.includes(slots[slot])) slots[slot] = null;
  }
  state.inventory = state.inventory.filter((item) => !ids.includes(item.id));
}

function heroHasTag(state, heroId, tag) {
  return Object.values(state.equipment[heroId] || {}).some((itemId) => state.inventory.find((item) => item.id === itemId)?.identityTags.includes(tag));
}

function recruit(state, heroId) {
  if (!state.roster.includes(heroId)) {
    state.roster.push(heroId);
    const cap = MAX_ACTIVE_BY_ACT[actForDay(state.day)];
    if (state.activeParty.length < cap) {
      state.activeParty.push(heroId);
      state.formation[heroId] = firstFreeSlot(state, cap);
    }
    addLog(state, `${HEROES[heroId].name}加入了队伍。`, "recruit");
  }
}

function firstFreeSlot(state, cap = 10) {
  const used = new Set(state.activeParty.map((id) => state.formation[id]));
  for (let slot = 0; slot < cap; slot += 1) if (!used.has(slot)) return slot;
  return Math.max(0, cap - 1);
}

function grindRarityTable(zoneId, level = 1) {
  const tables = {
    ash: [
      [["普通", .74], ["稀有", .22], ["史诗", .039], ["传说", .001]],
      [["普通", .70], ["稀有", .25], ["史诗", .049], ["传说", .001]],
      [["普通", .66], ["稀有", .28], ["史诗", .059], ["传说", .001]],
    ],
    inner: [
      [["普通", .42], ["稀有", .47], ["史诗", .105], ["传说", .005]],
      [["普通", .38], ["稀有", .49], ["史诗", .124], ["传说", .006]],
      [["普通", .34], ["稀有", .50], ["史诗", .153], ["传说", .007]],
    ],
    quarry: [
      [["稀有", .60], ["史诗", .34], ["传说", .058], ["神话", .002]],
      [["稀有", .56], ["史诗", .37], ["传说", .067], ["神话", .003]],
      [["稀有", .52], ["史诗", .40], ["传说", .076], ["神话", .004]],
    ],
    forge: [
      [["史诗", .60], ["传说", .35], ["神话", .05]],
      [["史诗", .56], ["传说", .38], ["神话", .06]],
      [["史诗", .52], ["传说", .41], ["神话", .07]],
    ],
  };
  return (tables[zoneId] || tables.ash)[Math.max(0, Math.min(2, Number(level || 1) - 1))];
}

function rollEquipmentLevel(state, zoneId, level) {
  const zoneBase = { ash: 18, inner: 32, quarry: 52, forge: 82 }[zoneId] || 18;
  return Math.max(1, Math.round((zoneBase + (Math.max(1, level) - 1) * 8) * (.88 + rand(state) * .24)));
}

function rollDirectStatValue(state, stat, equipmentLevel) {
  const variance = .92 + rand(state) * .16;
  const scales = { physicalPower: .5, magicPower: .5, maxHp: 2.8, armor: .08 };
  return Math.max(1, Math.round(equipmentLevel * (scales[stat] || .12) * variance));
}

function rollAffixValue(state, stat, equipmentLevel) {
  const def = AFFIX_DEFS[stat] || {};
  const variance = .88 + rand(state) * .24;
  if (def.category === "major") return Math.max(1, Math.round((1.1 + equipmentLevel / 45) * variance));
  if (def.percent) return Math.max(1, Math.round((2.5 + equipmentLevel / 7.5) * variance));
  return Math.max(1, Math.round((2 + equipmentLevel / 9) * variance));
}

function rollAffixLevel(equipmentLevel) {
  if (equipmentLevel >= 120) return 5;
  if (equipmentLevel >= 80) return 4;
  if (equipmentLevel >= 50) return 3;
  if (equipmentLevel >= 30) return 2;
  return 1;
}

function rollAffixes(state, slot, rarity, equipmentLevel) {
  const pool = slot.affixPool.filter((stat) => !BLOCKED_DIRECT_AFFIXES.has(stat));
  const focus = [pick(state, pool.map((stat) => [stat, 1])), pick(state, pool.map((stat) => [stat, 1]))];
  const focusSlots = Math.floor(rarity.affixes * .5);
  return Array.from({ length: rarity.affixes }, (_, index) => {
    const stat = index < focusSlots ? focus[index % focus.length] : pick(state, pool.map((row) => [row, 1]));
    return { stat, label: AFFIX_DEFS[stat]?.label || stat, value: rollAffixValue(state, stat, equipmentLevel), level: rollAffixLevel(equipmentLevel), category: AFFIX_DEFS[stat]?.category || "mechanic", percent: Boolean(AFFIX_DEFS[stat]?.percent) };
  });
}

function itemScore(baseStats, affixes, rarity) {
  const base = Object.entries(baseStats).reduce((sum, [stat, value]) => sum + value * ({ maxHp: .08, armor: 1.8, physicalPower: .7, magicPower: .7 }[stat] || .2), 0);
  const affix = affixes.reduce((sum, row) => sum + row.value * (row.category === "major" ? 2.4 : row.percent ? .8 : 1), 0);
  return Math.max(1, Math.round((base + affix) * rarity.value));
}

function generateItem(state, zoneId, level = 1) {
  const rarityTable = grindRarityTable(zoneId, level);
  const rarityLabel = pick(state, rarityTable);
  const rarity = RARITY_BY_LABEL[rarityLabel] || RARITY_DATA[0];
  const slotKey = pick(state, Object.keys(SLOT_DATA).map((slot) => [slot, 1]));
  const slot = SLOT_DATA[slotKey];
  const equipmentLevel = rollEquipmentLevel(state, zoneId, level);
  const baseStatsList = slot.baseOptions ? pick(state, slot.baseOptions.map((row) => [row, 1])) : slot.baseStats;
  const baseStats = Object.fromEntries(baseStatsList.map((stat) => [stat, rollDirectStatValue(state, stat, equipmentLevel)]));
  const affixes = rollAffixes(state, slot, rarity, equipmentLevel);
  const power = itemScore(baseStats, affixes, rarity);
  const tags = [];
  const tagChance = (zoneId === "forge" ? 0.78 : zoneId === "quarry" ? 0.58 : zoneId === "inner" ? 0.48 : 0.34) + (Math.max(1, level) - 1) * .025;
  if (rand(state) < tagChance) tags.push(pick(state, IDENTITY_TAGS.map((tag) => [tag, 1])));
  const name = `${tags[0] ? `${tags[0]}·` : ""}${rarity.label}${slot.label} Lv.${equipmentLevel}`;
  return { id: `item_${state.day}_${state.stats.grinds}_${state.inventory.length}_${hash(`${state.rngState}|${name}`)}`, name, slot: slotKey, slotLabel: slot.label, rarity: rarity.label, rarityId: rarity.id, equipmentLevel, power, baseStats, affixes, identityTags: tags, source: `${ZONES[zoneId].title} · LV${level}` };
}

function equippedItemIds(state) {
  return new Set(Object.values(state.equipment).flatMap((slots) => Object.values(slots).filter(Boolean)));
}

function enforceInventoryLimit(state) {
  const excess = Math.max(0, state.inventory.length - INVENTORY_LIMIT);
  if (!excess) return [];
  const equipped = equippedItemIds(state);
  const removable = state.inventory.filter((item) => !equipped.has(item.id)).sort((a, b) => {
    const tagDifference = Number(Boolean(a.identityTags?.length)) - Number(Boolean(b.identityTags?.length));
    if (tagDifference) return tagDifference;
    const rarityDifference = rarityIndex(a.rarity) - rarityIndex(b.rarity);
    if (rarityDifference) return rarityDifference;
    const powerDifference = itemPower(a) - itemPower(b);
    if (powerDifference) return powerDifference;
    return String(a.id).localeCompare(String(b.id));
  });
  const removed = removable.slice(0, excess);
  const removedIds = new Set(removed.map((item) => item.id));
  state.inventory = state.inventory.filter((item) => !removedIds.has(item.id));
  state.stats.salvaged = Number(state.stats.salvaged || 0) + removed.length;
  return removed;
}

function grind(state, zoneId, count) {
  if (state.phase !== "planning") throw new Error("大战已经开始，当前无法刷取装备。");
  const zone = ZONES[zoneId];
  if (!zoneAvailable(state, zoneId)) throw new Error("这个区域尚未被发现。");
  const items = [];
  for (let i = 0; i < count; i += 1) items.push(generateItem(state, zoneId));
  state.inventory.push(...items);
  state.stats.grinds += count;
  const salvaged = enforceInventoryLimit(state);
  const counts = Object.fromEntries(RARITIES.map((rarity) => [rarity, items.filter((item) => item.rarity === rarity).length]).filter((row) => row[1]));
  addLog(state, `你在${zone.title}连续战斗${count}次，带回${count}件装备：${Object.entries(counts).map(([r, n]) => `${r}${n}`).join("、")}。${salvaged.length ? `背包达到${INVENTORY_LIMIT}件上限，自动分解了最差的${salvaged.length}件。` : ""}`, "loot");
}

function heroPower(state, heroId) {
  return HEROES[heroId].base + Object.values(state.equipment[heroId]).reduce((sum, itemId) => sum + itemPower(state.inventory.find((item) => item.id === itemId)), 0);
}

function roleSpec(role, name, slotIndex, scales = {}) {
  const kit = SKILLS.roleKits[role];
  if (!kit) throw new Error(`缺少战斗职业：${role}`);
  const magic = ["mage", "priest", "warlock", "alchemist"].includes(role);
  const power = Math.round((kit.power || 40) * (scales.power || 1));
  return {
    role, name, roleName: kit.role || role,
    hp: Math.round((kit.hp || 300) * (scales.hp || 1)),
    maxHp: Math.round((kit.hp || 300) * (scales.hp || 1)),
    power,
    physicalPower: Math.round(magic ? power * 0.28 : power),
    magicPower: Math.round(magic ? power : power * 0.28),
    armor: Math.round((kit.armor || 8) * (scales.armor || 1)),
    range: kit.range || 14,
    small1: scales.small1 || kit.kit.small1,
    small2: scales.small2 || kit.kit.small2,
    passive: scales.passive || kit.kit.passive,
    ultimate: scales.ultimate || kit.kit.ultimate,
    slotIndex,
    unitKind: scales.unitKind || "",
  };
}

function heroCombatSpec(state, heroId, slotIndex) {
  const hero = HEROES[heroId];
  const spec = roleSpec(hero.combatRole, hero.name, slotIndex, { hp: 0.88 + hero.base / 460, power: 0.82 + hero.base / 360, armor: 0.92 });
  const equipped = Object.values(state.equipment[heroId] || {}).map((itemId) => state.inventory.find((item) => item.id === itemId)).filter(Boolean);
  const bundle = BUILD_LAYERS.buildEquipmentModifierBundle(equipped);
  spec.physicalPower += Math.round(bundle.physicalPowerAdd || 0);
  spec.magicPower += Math.round(bundle.magicPowerAdd || 0);
  spec.power = Math.max(spec.physicalPower, spec.magicPower);
  spec.maxHp += Math.round(bundle.maxHpAdd || 0);
  spec.hp = spec.maxHp;
  spec.armor += Math.round(bundle.armorAdd || 0);
  spec.attackSpeedMult = bundle.attackSpeedMult || 1;
  spec.skillHasteMult = bundle.skillHasteMult || 1;
  spec.effectPowerMult = bundle.effectPowerMult || 1;
  spec.effectResistPct = Math.min(.65, bundle.effectResistPct || 0);
  spec.receivedHealingMult = bundle.receivedHealingMult || 1;
  spec.mechanicModifiers = clone(bundle.mechanicModifiers || {});
  return spec;
}

function guildGuestCombatSpec(guestId, slotIndex) {
  const guest = GUILD_GUESTS[guestId];
  if (!guest) throw new Error(`未知的协会同行者：${guestId}`);
  return roleSpec(guest.combatRole, guest.name, slotIndex, { hp: .90 + guest.base / 500, power: .86 + guest.base / 420, armor: .94, unitKind: "guild_guest" });
}

function guildQuestPlan(state, questId, ownHeroIds, guestIds) {
  const quest = GUILD_QUESTS[questId];
  if (!quest || state.phase !== "planning") return null;
  const own = [...new Set(ownHeroIds || [])];
  const guests = [...new Set(guestIds || [])];
  if (!own.includes("player")) throw new Error("协会要求委托发起人本人出队。");
  if (own.some((heroId) => !state.roster.includes(heroId))) throw new Error("选择中含有尚未加入的角色。");
  if (guests.some((guestId) => !quest.guests.includes(guestId))) throw new Error("选择中含有本次委托未提供的同行者。");
  if (guests.length > quest.guestCap) throw new Error(`本次最多借用${quest.guestCap}名协会同行者。`);
  if (own.length + guests.length > quest.partyCap) throw new Error(`本次委托最多出战${quest.partyCap}人。`);
  const leftTeam = own.map((heroId, index) => heroCombatSpec(state, heroId, index));
  for (const guestId of guests) leftTeam.push(guildGuestCombatSpec(guestId, leftTeam.length));
  const rightTeam = quest.enemies.map(([role, name], index) => enemySpec(role, name, index, quest.tier, quest.scales));
  return {
    kind: "guildQuest", questId, title: `${quest.difficulty} · ${quest.title}`, difficulty: quest.difficulty, description: quest.description,
    enemyTitle: { level: questId === "road_pests" ? 2 : 5, name: questId === "road_pests" ? "低威胁" : "高威胁" },
    seed: `${state.seed}|guild|${questId}|${state.stats.combats}|${state.guildRecord?.[questId] || 0}`,
    leftTeam, rightTeam, maxTime: questId === "road_pests" ? 70 : 100,
  };
}

function militiaSpec(index, tier = 1, kind = "militia") {
  const roles = ["warrior", "knight", "ranger", "priest", "warrior"];
  return roleSpec(roles[index % roles.length], `煤灰镇志愿者${index + 1}`, index, { hp: 0.72 + tier * 0.08, power: 0.66 + tier * 0.08, armor: 0.85, unitKind: kind });
}

function enemySpec(role, name, index, tier = 1, scales = {}) {
  return roleSpec(role, name, index, { ...scales, hp: (0.88 + tier * 0.10) * (scales.hp || 1), power: (0.84 + tier * 0.10) * (scales.power || 1), armor: scales.armor || 1, unitKind: "enemy" });
}

function grindEnemyTitleLevel(zoneId, level) {
  const base = { ash: 1, inner: 2, quarry: 3, forge: 4 }[zoneId] || 1;
  return Math.min(7, base + Math.max(0, Number(level) - 1));
}

function eventEnemyTitleLevel(key, state) {
  if (key === "furnace_clue:force") return state.flags.coolingJammed ? 5 : 6;
  if (key === "quartermaster:fight") return 2;
  if (key === "duelist:challenge") return 3;
  if (key === "night_raid:ambush") return 3;
  if (key === "bridge_engineer:river") return 5;
  if (key.startsWith("arena:")) return key.endsWith("rematch") ? 4 : 5;
  if (["grain_seizure:raid", "signal_tower:storm"].includes(key)) return 4;
  if (key === "paymaster:fight") return 5;
  if (key.startsWith("hunter:")) return key.endsWith("trap") ? 5 : 6;
  if (key === "sky_ferry:seize") return 5;
  if (key === "siege_engines:fight") return 6;
  if (["beast_pens:fight", "ancient_core:fight"].includes(key)) return 7;
  return 2;
}

function grindCombatPlan(state, zoneId, level) {
  const zone = ZONES[zoneId];
  const encounter = GRIND_ENCOUNTERS[zoneId]?.find((row) => row.level === Number(level));
  if (!zone || !encounter || !zoneAvailable(state, zoneId) || state.phase !== "planning") return null;
  const leftTeam = state.activeParty.map((heroId, index) => heroCombatSpec(state, heroId, index));
  const rightTeam = encounter.enemies.map(([role, name], index) => enemySpec(role, `${name}${encounter.enemies.filter((row) => row[1] === name).length > 1 ? index + 1 : ""}`, index, encounter.tier, { hp: encounter.hp, power: encounter.power, armor: encounter.armor }));
  return {
    kind: "grind",
    zoneId,
    level: encounter.level,
    title: `${zone.title} LV${encounter.level} · ${encounter.title}`,
    enemyTitle: threatForLevel(grindEnemyTitleLevel(zoneId, encounter.level)),
    seed: `${state.seed}|grind|${zoneId}|${encounter.level}|${state.stats.grindAttempts || 0}|${state.stats.grinds}`,
    leftTeam,
    rightTeam,
    maxTime: 80,
  };
}

function eventCombatPlan(state, eventId, optionId) {
  const key = `${eventId}:${optionId}`;
  if (!COMBAT_OPTIONS.has(key)) return null;
  const leftTeam = state.activeParty.map((heroId, index) => heroCombatSpec(state, heroId, index));
  let title = "交战";
  let rightTeam = [];
  if (key === "furnace_clue:force") {
    title = "守门甲胄";
    const jammed = Boolean(state.flags.coolingJammed);
    rightTeam = [enemySpec("knight", "守门甲胄", 0, 2, { hp: jammed ? 5.5 : 10.5, power: jammed ? 2.35 : 3.8, armor: jammed ? 1.30 : 2.0, small1: "enemyStoneGuard", small2: "enemySweepingClaw", passive: "enemyNoop", ultimate: "enemyNoUltimate" })];
  } else if (key === "quartermaster:fight") {
    title = "军需车守卫";
    rightTeam = [enemySpec("knight", "军需盾卫", 0, 1), enemySpec("ranger", "营地弩手", 1, 1), enemySpec("warrior", "押运兵", 2, 1)];
  } else if (key === "duelist:challenge") {
    title = "西门比剑";
    leftTeam.splice(1);
    rightTeam = [enemySpec("warrior", "旁支剑士", 0, 2, { hp: 1.05, power: 1.05 })];
  } else if (key === "night_raid:ambush") {
    title = "伏击夜巡队";
    rightTeam = ["knight", "warrior", "ranger", "priest"].map((role, i) => enemySpec(role, `夜巡兵${i + 1}`, i, 2));
  } else if (key === "bridge_engineer:river") {
    title = "激流抢修";
    rightTeam = [enemySpec("berserker", "激流中的穴兽", 0, 2, { hp: 16, power: 3.4, armor: 1.7 })];
  } else if (key.startsWith("arena:")) {
    title = key.endsWith("rematch") ? "卸甲重赛" : "矿区擂台";
    rightTeam = [enemySpec("berserker", "擂台冠军", 0, 3, { hp: key.endsWith("rematch") ? 10 : 18, power: key.endsWith("rematch") ? 2.3 : 3.4, armor: key.endsWith("rematch") ? 1.15 : 1.65 })];
  } else if (key === "grain_seizure:raid") {
    title = "截停押粮队";
    rightTeam = ["knight", "knight", "ranger", "ranger", "warrior"].map((r, i) => enemySpec(r, `押粮兵${i + 1}`, i, 2));
  } else if (key === "signal_tower:storm") {
    title = "雷雨强攻信号塔";
    rightTeam = ["knight", "ranger", "ranger", "mage", "warrior"].map((r, i) => enemySpec(r, `守塔兵${i + 1}`, i, 3));
  } else if (key === "paymaster:fight") {
    title = "夺取发饷钱箱";
    rightTeam = ["knight", "knight", "warrior", "warrior", "ranger", "priest"].map((r, i) => enemySpec(r, `押运兵${i + 1}`, i, 3));
  } else if (key.startsWith("hunter:")) {
    title = "矿道猎兽";
    const trapped = key.endsWith("trap");
    rightTeam = [enemySpec("berserker", "食铁兽", 0, 3, { hp: trapped ? 10 : 20, power: trapped ? 2.4 : 3.8, armor: trapped ? 1.2 : 1.85 })];
  } else if (key === "sky_ferry:seize") {
    title = "夺取飞艇塔";
    rightTeam = ["knight", "warrior", "ranger", "ranger", "mage", "priest"].map((r, i) => enemySpec(r, `塔下巡逻兵${i + 1}`, i, 3));
  } else if (key === "siege_engines:fight") {
    title = "强袭攻城器工地";
    rightTeam = ["knight", "knight", "warrior", "warrior", "ranger", "ranger", "alchemist", "priest"].map((r, i) => enemySpec(r, `围剿工兵${i + 1}`, i, 4));
  } else if (key === "beast_pens:fight") {
    title = "战兽栏突袭";
    rightTeam = Array.from({ length: 5 }, (_, i) => enemySpec("berserker", `披甲战兽${i + 1}`, i, 4, { hp: 1.35, power: 1.18 }));
  } else if (key === "ancient_core:fight") {
    title = "炉心守卫战";
    rightTeam = Array.from({ length: 8 }, (_, i) => enemySpec(i < 3 ? "knight" : i < 6 ? "warrior" : "mage", `守炉造物${i + 1}`, i, 5));
  }
  return { kind: "combat", title, enemyTitle: threatForLevel(eventEnemyTitleLevel(key, state)), internalAction: `event:${eventId}:${optionId}`, seed: `${state.seed}|${state.day}|${key}|${state.stats.combats}`, leftTeam, rightTeam, maxTime: 90 };
}

function showdownPlan(state, strategy) {
  const act = state.showdownAct;
  if (!act || strategy === "political") return null;
  let leftTeam = state.activeParty.map((heroId, index) => heroCombatSpec(state, heroId, index));
  let rightTeam = [];
  let title = "决战";
  if (act === 1) {
    title = "白鹿家兵抵达煤灰镇";
    rightTeam = ["warrior", "knight", "knight", "ranger", "ranger", "priest"].map((role, i) => enemySpec(role, `白鹿家兵${i + 1}`, i, 2, {
      hp: 1.15,
      power: strategy === "ambush" && state.flags.campScouted ? 0.93 : 1.15,
    }));
  } else if (act === 2) {
    title = "执法队与雇佣军会战";
    while (leftTeam.length < 10 && leftTeam.length < state.activeParty.length + volunteerCount(state, 2)) leftTeam.push(militiaSpec(leftTeam.length, 2));
    rightTeam = ["knight", "knight", "warrior", "warrior", "ranger", "ranger", "mage", "alchemist", "priest", "berserker"].map((role, i) => enemySpec(role, `执法联军${i + 1}`, i, 4, { hp: state.flags.payChest ? 0.86 : 1, power: state.flags.signalFalse ? 0.88 : 1 }));
  } else {
    title = "围剿联盟总攻";
    const reinforcementTarget = Math.min(20, 10 + volunteerCount(state, 3));
    while (leftTeam.length < reinforcementTarget) leftTeam.push(militiaSpec(leftTeam.length, 3, leftTeam.length >= 10 ? "reinforcement" : "militia"));
    rightTeam = ["knight", "knight", "berserker", "berserker", "ranger", "ranger", "mage", "mage", "priest", "alchemist"].map((role, i) => enemySpec(role, `围剿精锐${i + 1}`, i, 6, { hp: state.flags.siegeSabotaged ? 0.86 : 1, power: state.flags.beastsNeutralized ? 0.88 : 1 }));
  }
  return { kind: "combat", title, enemyTitle: threatForLevel(act === 1 ? 3 : act === 2 ? 5 : 7), internalAction: `showdown:${strategy}`, seed: `${state.seed}|showdown${act}|${strategy}|${state.stats.combats}`, leftTeam, rightTeam, maxTime: 120 };
}

function volunteerCount(state, act) {
  if (act === 2) return Math.min(10, 2 + Math.floor(Math.max(0, state.resources.townFavor) / 2) + (state.flags.minersSupport ? 2 : 0));
  return Math.min(20, 4 + Math.floor(Math.max(0, state.resources.townFavor) / 2) + Math.floor(state.resources.influence / 2) + (state.flags.bannerCompany ? 6 : 0) + (state.flags.warCouncil ? 2 : 0));
}

function simulatePlan(plan) {
  return COMBAT.simulateTeams(plan.leftTeam, plan.rightTeam, { seed: plan.seed, maxTime: plan.maxTime, randomizeStats: false });
}

function combatWon(result) { return result?.metrics?.leftAlive > 0 && result?.metrics?.rightAlive === 0; }
function publicCombatSummary(result, title) {
  const rounded = (value) => Math.round(Number(value || 0));
  return {
    title,
    win: combatWon(result),
    duration: Math.round(Number(result.duration || result.time || 0) * 10) / 10,
    alliesStarted: result.units.filter((u) => u.side === "left").length,
    alliesAlive: result.metrics.leftAlive,
    enemiesStarted: result.units.filter((u) => u.side === "right").length,
    enemiesAlive: result.metrics.rightAlive,
    alliesDamage: rounded(result.metrics.leftDamage),
    alliesHealing: rounded(result.metrics.leftHealing),
    alliesShield: rounded(result.metrics.leftShield),
    enemiesDamage: rounded(result.metrics.rightDamage),
    topAlliedDamage: result.units.filter((unit) => unit.side === "left").sort((a, b) => Number(b.damageDone || 0) - Number(a.damageDone || 0)).slice(0, 5).map((unit) => ({ name: unit.name, damage: rounded(unit.damageDone) })),
  };
}

function eventIsVisible(state, event) {
  return state.phase === "planning" && state.day >= event.start && state.day <= event.end && !state.nodes[event.id]?.resolved && (!event.visible || event.visible(state));
}

function optionIsAvailable(state, event, option) {
  return eventIsVisible(state, event) && state.ap > 0 && (!option.visible || option.visible(state)) && (!option.req || option.req(state));
}

function internalActions(state) {
  if (state.result) return [];
  if (state.phase === "showdown") {
    const rows = ["hold", "field"].map((id) => {
      const plan = showdownPlan(state, id);
      return { id: `showdown:${id}`, label: `${id === "hold" ? "依托现有防线迎战" : "主动出城迎战"}（${plan.leftTeam.length}对${plan.rightTeam.length}）`, kind: "combat", placeId: "place_showdown", actionPointCost: 0 };
    });
    if (state.showdownAct === 1 && state.flags.campScouted) {
      const plan = showdownPlan(state, "ambush");
      rows.push({ id: "showdown:ambush", label: `利用掌握的夜巡路线伏击家兵（${plan.leftTeam.length}对${plan.rightTeam.length}）`, kind: "combat", placeId: "place_showdown", actionPointCost: 0 });
    }
    if (politicalRouteAvailable(state)) rows.push({ id: "showdown:political", label: "在众人面前迫使对方撤军", kind: "decision", placeId: "place_showdown" });
    return rows;
  }
  const rows = [];
  for (const [zoneId, zone] of Object.entries(ZONES)) {
    if (zoneAvailable(state, zoneId)) {
      for (const encounter of GRIND_ENCOUNTERS[zoneId]) rows.push({
        id: `grindbattle:${zoneId}:${encounter.level}`,
        label: `LV${encounter.level} · ${encounter.title}（${encounter.enemies.length}名敌人）`,
        kind: "grind",
        placeId: `place_zone_${zoneId}`,
        grindZoneId: zoneId,
        grindLevel: encounter.level,
        enemyCount: encounter.enemies.length,
      });
    }
  }
  if (!state.flags.gateInspected && state.day <= 5 && state.ap > 0) rows.push({ id: "investigate:gate", label: "检查王炉门与锁芯", kind: "inspect", placeId: "place_gate" });
  for (const event of EVENTS) {
    if (!eventIsVisible(state, event)) continue;
    for (const option of event.options) if (optionIsAvailable(state, event, option)) rows.push({ id: `event:${event.id}:${option.id}`, label: option.label, kind: COMBAT_OPTIONS.has(`${event.id}:${option.id}`) ? "combat" : "event", placeId: `place_event_${event.id}`, callback: typeof option.callback === "function" ? option.callback(state) : option.callback || "" });
  }
  if (state.ap > 0 && state.flags.lastPatrolDay !== state.day && !rows.some((row) => ["event", "combat", "inspect"].includes(row.kind))) rows.push({ id: "patrol", label: "利用剩余时间走访镇民", kind: "event", placeId: "place_patrol" });
  for (const quest of Object.values(GUILD_QUESTS)) rows.push({
    id: `guildquest:${quest.id}`,
    label: `${quest.difficulty} · ${quest.title}`,
    kind: "guild",
    placeId: "place_guild",
    actionPointCost: 0,
    difficulty: quest.difficulty,
    partyCap: quest.partyCap,
    guestCap: quest.guestCap,
  });
  const cap = MAX_ACTIVE_BY_ACT[actForDay(state.day)];
  for (const heroId of state.roster) {
    const active = state.activeParty.includes(heroId);
    if (!active && state.activeParty.length < cap) rows.push({ id: `party:add:${heroId}`, label: `${HEROES[heroId].name}加入出战`, kind: "party", placeId: "place_party" });
    if (active && heroId !== "player" && state.activeParty.length > 1) rows.push({ id: `party:remove:${heroId}`, label: `${HEROES[heroId].name}回到候补`, kind: "party", placeId: "place_party" });
  }
  rows.push({ id: "end_day", label: "结束本日", kind: "time", placeId: "place_calendar" });
  return rows;
}

function politicalRouteAvailable(state) {
  if (state.showdownAct === 1) return state.resources.evidence >= 5 && Boolean(state.flags.duelistSupport);
  if (state.showdownAct === 2) return state.resources.evidence >= 8 && Boolean(state.flags.falseJudgment);
  if (state.showdownAct === 3) return state.resources.evidence >= 10 && state.resources.influence >= 8 && Boolean(state.flags.coalitionSplit);
  return false;
}

function applyAction(stateInput, internalId) {
  const state = clone(stateInput);
  if (!internalActions(state).some((row) => row.id === internalId)) throw new Error(`当前不能执行：${internalId}`);
  if (internalId.startsWith("grind:")) {
    const [, zone, count] = internalId.split(":"); grind(state, zone, Number(count)); return state;
  }
  if (internalId === "patrol") {
    state.resources.townFavor += 1;
    state.flags.lastPatrolDay = state.day;
    addLog(state, "你走访了没有撤离的镇民，记下他们最担心的事。", "event");
    spendAction(state);
    return state;
  }
  if (internalId.startsWith("party:")) { applyParty(state, internalId); return state; }
  if (internalId === "investigate:gate") { state.flags.gateInspected = true; addLog(state, "煤灰下露出熔毁锁芯、三段断纹和一条通往守门甲胄的铜线。", "clue"); spendAction(state); return state; }
  if (internalId === "end_day") { endDay(state); return state; }
  if (internalId.startsWith("guildquest:")) {
    const questId = internalId.split(":")[1];
    const plan = guildQuestPlan(state, questId, ["player"], []);
    if (!plan) throw new Error("当前不能承接这份协会委托。");
    settleCombat(state, internalId, simulatePlan(plan));
    return state;
  }
  if (internalId.startsWith("showdown:")) {
    const strategy = internalId.split(":")[1];
    if (strategy === "political") settleShowdown(state, strategy, null); else settleCombat(state, internalId, simulatePlan(showdownPlan(state, strategy)));
    return state;
  }
  if (internalId.startsWith("event:")) {
    const [, eventId, optionId] = internalId.split(":");
    const plan = eventCombatPlan(state, eventId, optionId);
    if (plan) settleCombat(state, internalId, simulatePlan(plan)); else settleEvent(state, eventId, optionId);
    return state;
  }
  throw new Error(`未知行动：${internalId}`);
}

function applyParty(state, internalId) {
  const [, op, heroId] = internalId.split(":");
  if (op === "add") { state.activeParty.push(heroId); state.formation[heroId] = firstFreeSlot(state, MAX_ACTIVE_BY_ACT[actForDay(state.day)]); }
  else state.activeParty = state.activeParty.filter((id) => id !== heroId);
  addLog(state, `${HEROES[heroId].name}${op === "add" ? "加入出战" : "回到候补"}。`, "party");
}

function spendAction(state) {
  state.ap = Math.max(0, state.ap - 1);
  state.stats.spentActions += 1;
}

function endDay(state) {
  if ([5, 10, 15].includes(state.day)) {
    state.phase = "showdown";
    state.showdownAct = actForDay(state.day);
    addLog(state, state.day === 5 ? "白鹿家的家兵已经出现在镇外。" : state.day === 10 ? "执法队与雇佣军在北桥外列阵。" : "三支围剿军同时升起了进攻旗。", "threat");
  } else {
    state.day += 1;
    state.ap = AP_PER_DAY;
    addLog(state, `第${state.day}日开始。`, "time");
  }
}

function settleEvent(state, eventId, optionId) {
  const node = state.nodes[eventId] || (state.nodes[eventId] = {});
  node.resolved = true; node.option = optionId;
  const r = state.resources; const f = state.flags;
  if (eventId === "injured_shield") { if (optionId === "carry") { recruit(state, "shield"); r.townFavor += 1; } else { r.gold += 4; f.shieldAbandoned = true; } }
  else if (eventId === "smith_intro") { if (optionId === "promise") { f.smithPromise = true; node.resolved = false; } else { takeUnequipped(state, (i) => i.slot === "weapon" && i.rarity === "普通", 3); state.inventory.push({ id: `smith_${state.day}`, name: "蓝钢长剑", slot: "weapon", slotLabel: "武器", rarity: "稀有", power: 18, identityTags: ["古代锻造"], source: "铁匠试炉" }); f.smithForged = true; f.innerOpen = true; } }
  else if (eventId === "well_dispute") { if (optionId === "tanner") { r.gold += 3; r.townFavor -= 1; } else if (optionId === "grower") { r.townFavor += 2; r.medicine += 1; } else { r.townFavor += 1; r.evidence += 1; } }
  else if (eventId === "apothecary_debt") { if (optionId === "pay") r.gold -= 5; else r.townFavor += 1; recruit(state, "apothecary"); r.medicine += 2; }
  else if (eventId === "thief_trial") { if (optionId === "thief") { recruit(state, "thief"); r.evidence += 2; } else { r.townFavor += 1; r.evidence += 1; } }
  else if (eventId === "caravan") { if (optionId === "rescue") { r.townFavor += 2; r.medicine += 2; } else { r.gold += 6; state.inventory.push(generateItem(state, "ash")); } }
  else if (eventId === "furnace_clue") {
    if (optionId === "smith") {
      f.smithDoorTheory = true;
      node.resolved = false;
    } else {
      takeUnequipped(state, (i) => i.identityTags.includes("古代锻造"), 3);
      f.innerOpen = true;
    }
  }
  else if (eventId === "cooling_well") { f.coolingJammed = true; }
  else if (eventId === "quartermaster") { f.campScouted = true; r.evidence += 1; }
  else if (eventId === "duelist") { f.duelistSupport = true; if (optionId === "evidence") r.evidence += 1; recruit(state, "duelist"); }
  else if (eventId === "night_raid") { f.campScouted = true; r.influence += 1; }
  else if (eventId === "exile_scout") { recruit(state, "exile"); f.boneCasket = true; }
  else if (eventId === "mine_strike") { if (optionId === "miners") { f.minersSupport = true; r.townFavor += 2; } else if (optionId === "owner") r.gold += 8; else { f.minersSupport = true; r.evidence += 2; } }
  else if (eventId === "chapel_guard") { if (optionId === "medicine") r.medicine -= 3; else r.evidence += 1; recruit(state, "priest"); }
  else if (eventId === "bridge_engineer") { if (optionId === "parts") takeUnequipped(state, (i) => i.identityTags.includes("古代锻造"), 2); recruit(state, "engineer"); f.bridgeOpen = true; }
  else if (eventId === "deserter_mage") { if (optionId === "bribe") r.gold -= 8; recruit(state, "mage"); }
  else if (eventId === "tax_archive") { f.taxLedger = true; r.evidence += optionId === "steal" ? 3 : 2; }
  else if (eventId === "grain_seizure") { f.grainRecovered = true; r.townFavor += 2; }
  else if (eventId === "signal_tower") { f.signalFalse = true; r.influence += 2; }
  else if (eventId === "paymaster") { f.payChest = true; r.gold += optionId === "rumor" ? 2 : 12; r.influence += 2; }
  else if (eventId === "noble_banquet") { f.falseJudgment = true; r.evidence += 4; }
  else if (eventId === "banner_company") { if (optionId === "pay") r.gold -= 12; f.bannerCompany = true; r.influence += 4; recruit(state, "banner"); }
  else if (eventId === "swamp_witch") { if (optionId === "church") { r.townFavor += 2; } else { recruit(state, "witch"); f.beastDrug = true; if (optionId === "herbs") r.medicine -= 5; } }
  else if (eventId === "war_council") { f.warCouncil = optionId; r.influence += 2; }
  else if (eventId === "sky_ferry") { if (optionId === "core") takeUnequipped(state, (i) => i.identityTags.includes("古代锻造") && rarityIndex(i.rarity) >= rarityIndex("史诗"), 1); f.skyFerry = true; r.influence += 2; }
  else if (eventId === "plague_camp") { if (optionId !== "witch") r.medicine -= 3; if (optionId === "front") f.frontMedicine = true; else { r.townFavor += 3; f.civiliansSafe = true; } }
  else if (eventId === "siege_engines") { f.siegeSabotaged = true; r.influence += 1; }
  else if (eventId === "beast_pens") { f.beastsNeutralized = true; }
  else if (eventId === "traitor_gate") { if (optionId === "follow") { r.evidence += 3; f.traitorNetwork = true; } else r.townFavor += 1; }
  else if (eventId === "market_toll") {
    if (optionId === "protect") { r.gold -= 3; r.townFavor += 2; f.merchantsProtected = true; }
    else if (optionId === "names") { r.evidence += 2; f.tollNames = true; }
    else { r.townFavor += 1; r.influence += 1; f.marketDefied = true; }
  }
  else if (eventId === "watch_bell") { if (optionId === "bell") { r.influence += 2; f.watchBell = true; } else { r.townFavor += 1; f.westGateReinforced = true; } }
  else if (eventId === "missing_scribe") { if (optionId === "shelter") { r.evidence += 2; r.townFavor += 1; f.scribeWitness = true; } else { r.gold += 5; f.scribeReturned = true; } }
  else if (eventId === "grain_prices") { if (optionId === "ration") { r.townFavor += 2; r.medicine += 1; f.grainRationed = true; } else { r.gold += 6; r.townFavor -= 1; } }
  else if (eventId === "ford_deserter") { if (optionId === "hide") { r.evidence += 2; r.influence += 1; f.deserterWitness = true; } else r.gold += 5; }
  else if (eventId === "road_barricade") { if (optionId === "build") { r.townFavor += 2; f.roadBarricade = true; } else r.gold += 4; }
  else if (eventId === "widow_claim") { if (optionId === "hearing") { r.evidence += 2; r.townFavor += 1; f.widowTestimony = true; } else { r.influence += 1; f.widowSettled = true; } }
  else if (eventId === "quarry_collapse") { if (optionId === "rescue") { r.townFavor += 2; f.minersSupport = true; } else { r.gold += 7; state.inventory.push(generateItem(state, "quarry")); } }
  else if (eventId === "river_customs") { if (optionId === "route") { r.influence += 2; f.smugglingRoute = true; } else if (optionId === "bribe") { r.gold -= 4; r.influence += 1; } else r.evidence += 2; }
  else if (eventId === "chapel_inquest") { if (optionId === "priest") { r.influence += 2; f.inquestDefied = true; } else if (optionId === "letters") { r.evidence += 3; f.churchLetters = true; } else { r.townFavor -= 1; f.refugeeListGiven = true; } }
  else if (eventId === "mercenary_contract") { if (optionId === "buyout") { r.gold -= 10; r.influence += 3; f.hiredDefectors = true; } else if (optionId === "clause") { r.evidence += 2; r.influence += 2; f.contractBroken = true; } else r.evidence += 2; }
  else if (eventId === "mine_prisoners") { if (optionId === "free") { r.townFavor += 2; f.minersSupport = true; f.freedWorkers = true; } else { r.gold -= 5; r.influence += 2; f.freedWorkers = true; } }
  else if (eventId === "north_hostages") { if (optionId === "medicine") { r.medicine -= 2; r.townFavor += 3; f.hostagesFreed = true; } else { r.evidence += 3; f.hostageList = true; } }
  else if (eventId === "evacuation_route") { if (optionId === "ferry") { r.townFavor += 3; f.civiliansSafe = true; } else if (optionId === "mine") { r.townFavor += 2; f.mineEvacuation = true; } else { r.influence += 1; f.evacuationCarts = true; } }
  else if (eventId === "merchant_council") { if (optionId === "grain") { r.influence += 3; f.merchantCarts = true; } else if (optionId === "fund") { r.gold -= 8; r.influence += 2; f.merchantCarts = true; } else { r.townFavor += 1; f.merchantsRefused = true; } }
  else if (eventId === "chapel_sanctuary") { if (optionId === "priest") { r.townFavor += 2; f.civiliansSafe = true; } else if (optionId === "witch") { r.medicine += 2; f.civiliansSafe = true; } else r.townFavor += 3; }
  else if (eventId === "enemy_letters") { if (optionId === "trace") { r.evidence += 3; r.influence += 2; f.letterCourier = true; } else if (optionId === "publish") { r.evidence += 1; r.influence += 3; f.enemyLettersPublished = true; } else { r.influence += 1; f.enemyContact = true; } }
  else if (eventId === "deserter_wave") { if (optionId === "asylum") { r.townFavor += 2; r.influence += 2; f.enemyDeserters = true; } else if (optionId === "question") { r.evidence += 2; r.influence += 1; } else r.townFavor += 1; }
  else if (eventId === "powder_store") { if (optionId === "engineer") { f.siegeSabotaged = true; r.influence += 2; } else if (optionId === "mage") { f.powderFire = true; r.influence += 2; } else { r.townFavor += 2; f.civiliansSafe = true; } }
  else if (eventId === "noble_hostages") { if (optionId === "bargain") { r.influence += 3; f.hostageBargain = true; } else if (optionId === "release") { r.townFavor += 3; f.noblesReleased = true; } else { r.influence += 2; r.townFavor -= 1; f.noblesHeld = true; } }
  else if (eventId === "last_supply") { if (optionId === "front") { f.frontMedicine = true; r.influence += 2; } else if (optionId === "refugees") { r.townFavor += 3; f.civiliansSafe = true; } else { r.influence += 1; f.wallsRepaired = true; } }
  else if (eventId === "ancient_core") { f.forgeSecured = true; for (let i = 0; i < 3; i += 1) state.inventory.push(generateItem(state, "forge")); }
  else if (eventId === "coalition_envoy") { f.coalitionSplit = true; r.influence += 3; }
  const salvaged = enforceInventoryLimit(state);
  if (salvaged.length) addLog(state, `背包达到${INVENTORY_LIMIT}件上限，自动分解了最差的${salvaged.length}件装备。`, "equipment");
  const outcome = EVENT_OUTCOMES[`${eventId}:${optionId}`];
  const isUnlock = (eventId === "smith_intro" && optionId === "forge") || (eventId === "furnace_clue" && optionId === "key");
  const isClue = (eventId === "smith_intro" && optionId === "promise") || (eventId === "furnace_clue" && optionId === "smith") || eventId === "cooling_well";
  const outcomeKind = isUnlock ? "unlock" : isClue ? "clue" : eventId === "quartermaster" ? "threat" : "event";
  addLog(state, outcome || `你处理了“${EVENTS.find((e) => e.id === eventId).title}”。`, outcomeKind);
  spendAction(state);
}

function settleCombat(state, internalId, result) {
  const plan = internalId.startsWith("showdown:")
    ? showdownPlan(state, internalId.split(":")[1])
    : internalId.startsWith("guildquest:")
      ? { title: `${GUILD_QUESTS[internalId.split(":")[1]].difficulty} · ${GUILD_QUESTS[internalId.split(":")[1]].title}` }
      : eventCombatPlan(state, internalId.split(":")[1], internalId.split(":")[2]);
  const summary = publicCombatSummary(result, plan.title);
  state.lastCombat = summary;
  state.stats.combats += 1;
  if (!summary.win) state.stats.failedCombats += 1;
  addLog(state, `在“${summary.title}”中我方${summary.win ? "获胜" : "失利"}：我方${summary.alliesAlive}/${summary.alliesStarted}人仍能战斗，敌方${summary.enemiesAlive}/${summary.enemiesStarted}人仍能战斗，用时${summary.duration}秒；我方造成${summary.alliesDamage}伤害、治疗${summary.alliesHealing}、获得${summary.alliesShield}护盾。`, summary.win ? "combat_win" : "combat_loss");
  if (internalId.startsWith("showdown:")) { settleShowdown(state, internalId.split(":")[1], summary); return; }
  if (internalId.startsWith("guildquest:")) {
    const questId = internalId.split(":")[1];
    const quest = GUILD_QUESTS[questId];
    state.guildRecord = { road_pests: 0, black_iron_warrant: 0, ...(state.guildRecord || {}) };
    if (summary.win) {
      state.guildRecord[questId] += 1;
      const loot = Array.from({ length: quest.lootCount }, () => generateItem(state, quest.zoneId, quest.rewardLevel));
      state.inventory.push(...loot);
      const best = loot.slice().sort((a, b) => rarityIndex(b.rarity) - rarityIndex(a.rarity) || itemPower(b) - itemPower(a))[0];
      addLog(state, `${quest.title}完成。协会交付了${loot.length}件战利品，其中最好的是${best.rarity}${best.slotLabel}。`, "loot");
    } else {
      addLog(state, `${quest.title}失败。协会没有扣除行动力，你可以更换自有成员与临时同行者后重试。`, "combat_loss");
    }
    const salvaged = enforceInventoryLimit(state);
    if (salvaged.length) addLog(state, `背包达到${INVENTORY_LIMIT}件上限，自动分解了最差的${salvaged.length}件装备。`, "equipment");
    return;
  }
  const [, eventId, optionId] = internalId.split(":");
  if (summary.win) {
    if (eventId === "furnace_clue") { state.flags.innerOpen = true; state.nodes[eventId] = { resolved: true, option: optionId }; }
    else if (eventId === "duelist") { state.flags.duelistSupport = true; recruit(state, "duelist"); state.nodes[eventId] = { resolved: true, option: optionId }; }
    else if (eventId === "arena") { recruit(state, "champion"); state.nodes[eventId] = { resolved: true, option: optionId }; }
    else if (eventId === "hunter") { recruit(state, "hunter"); state.nodes[eventId] = { resolved: true, option: optionId }; state.resources.influence += 1; }
    else {
      state.nodes[eventId] = { resolved: true, option: optionId };
      if (eventId === "quartermaster") { state.flags.campScouted = true; state.resources.evidence += 1; }
      if (eventId === "night_raid") { state.flags.campScouted = true; state.resources.influence += 2; }
      if (eventId === "bridge_engineer") { recruit(state, "engineer"); state.flags.bridgeOpen = true; }
      if (eventId === "grain_seizure") { state.flags.grainRecovered = true; state.resources.townFavor += 2; }
      if (eventId === "signal_tower") { state.flags.signalFalse = true; state.resources.influence += 2; }
      if (eventId === "paymaster") { state.flags.payChest = true; state.resources.gold += 12; }
      if (eventId === "sky_ferry") { state.flags.skyFerry = true; state.resources.influence += 2; }
      if (eventId === "siege_engines") state.flags.siegeSabotaged = true;
      if (eventId === "beast_pens") state.flags.beastsNeutralized = true;
      if (eventId === "ancient_core") { state.flags.forgeSecured = true; for (let i = 0; i < 3; i += 1) state.inventory.push(generateItem(state, "forge")); }
    }
  } else {
    state.flags[`${eventId}Failed`] = true;
    if (eventId === "furnace_clue") state.flags.guardianFailed = true;
    if (eventId === "arena") state.flags.arenaFailed = true;
    if (eventId === "hunter") state.flags.huntFailed = true;
  }
  const salvaged = enforceInventoryLimit(state);
  if (salvaged.length) addLog(state, `背包达到${INVENTORY_LIMIT}件上限，自动分解了最差的${salvaged.length}件装备。`, "equipment");
  spendAction(state);
}

function settleShowdown(state, strategy, summary) {
  const act = state.showdownAct;
  const win = strategy === "political" || Boolean(summary?.win);
  state.chapterResults.push({ act, day: state.day, strategy, win, combat: summary || null });
  if (strategy === "political") {
    if (act === 1) addLog(state, "艾妲当众核对少爷的书面命令，镇民证词让家兵拒绝继续替私人恩怨动刀。", "political_win");
    else if (act === 2) addLog(state, "你公开执法官伪造的判决，并让此前作证的镇民逐条核对；雇佣军拒绝替一张假判决送命。", "political_win");
    else {
      const lever = state.nodes.coalition_envoy?.option === "pay" ? "欠饷钱箱里的欠条" : state.nodes.coalition_envoy?.option === "fear" ? "围剿军已经畏惧的战利品" : "执法官伪造判决的证据";
      addLog(state, `无旗使者带走了${lever}；你争取过的镇民和盟友同时拒绝服从同一支军队，三方在总攻前互相撤旗。`, "political_win");
    }
  }
  if (act === 3) {
    state.phase = "complete";
    state.ap = 0;
    state.result = { win, ending: win ? (strategy === "political" ? "联盟瓦解" : "守住煤灰镇") : "围剿军攻入煤灰镇", chapters: clone(state.chapterResults) };
    return;
  }
  state.day += 1;
  state.ap = AP_PER_DAY;
  state.phase = "planning";
  state.showdownAct = null;
  if (act === 1) {
    state.flags.youngMasterRepelled = win;
    addLog(state, win ? "少爷的家兵退走，但家族执法官宣布你袭击贵族私兵。第六日，北桥开始设卡。" : "家兵控制了镇口，少爷却没有满足。他要求家族执法官把整座镇子列为赔偿物。", "chapter");
  } else {
    state.flags.bailiffRepelled = win;
    addLog(state, win ? "执法队撤退时烧掉了判决书。更远处，三支军队开始以“平乱”为名集结。" : "执法官占住北桥，却发现雇佣军、教会武装和地方贵族都想瓜分战利品。", "chapter");
  }
}

function publicActionId(state, internalId) { return `choice_${hash(`${state.seed}|${state.day}|${state.ap}|${state.phase}|${state.stats.spentActions}|${state.stats.grinds}|${internalId}`)}`; }
function actionCatalog(state) { return internalActions(state).map((row) => ({ ...row, publicId: publicActionId(state, row.id) })); }

function applyPlayerAction(state, publicId) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match) throw new Error("这个行动已经不在当前场景中。");
  if (match.kind === "grind") throw new Error("刷装必须先完成实际战斗。");
  if (match.kind === "guild") throw new Error("协会委托必须先选择出战成员。");
  return applyAction(state, match.id);
}

function preparePlayerGuildCombat(state, publicId, ownHeroIds, guestIds) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match || match.kind !== "guild") return null;
  const plan = guildQuestPlan(state, match.id.split(":")[1], ownHeroIds, guestIds);
  return plan ? { ...clone(plan), publicActionId: publicId } : null;
}

function preparePlayerGrindCombat(state, publicId) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match || match.kind !== "grind") return null;
  const plan = grindCombatPlan(state, match.grindZoneId, match.grindLevel);
  return plan ? { ...clone(plan), publicActionId: publicId } : null;
}

function applyPlayerGrindCombatResult(stateInput, publicId, result) {
  const match = actionCatalog(stateInput).find((row) => row.publicId === publicId);
  if (!match || match.kind !== "grind") throw new Error("这个刷装战斗已经不在当前场景中。");
  const state = clone(stateInput);
  const win = combatWon(result);
  state.stats.grindAttempts = Number(state.stats.grindAttempts || 0) + 1;
  state.stats.combats += 1;
  state.lastCombat = publicCombatSummary(result, `${ZONES[match.grindZoneId].title} LV${match.grindLevel}`);
  if (!win) {
    state.stats.failedCombats += 1;
    addLog(state, `${ZONES[match.grindZoneId].title} LV${match.grindLevel}战败，没有带回装备。`, "combat");
    return { state, outcome: { win: false, loot: [], salvaged: [], summary: clone(state.lastCombat) } };
  }
  const item = generateItem(state, match.grindZoneId, match.grindLevel);
  state.inventory.push(item);
  state.stats.grinds += 1;
  const salvaged = enforceInventoryLimit(state);
  if (salvaged.length) addLog(state, `背包达到${INVENTORY_LIMIT}件上限，已自动分解最差的${salvaged.length}件装备。`, "equipment");
  if (rarityIndex(item.rarity) >= rarityIndex("史诗")) addLog(state, `${ZONES[match.grindZoneId].title} LV${match.grindLevel}掉落了${item.rarity}装备：${item.name}。`, "loot");
  return {
    state,
    outcome: {
      win: true,
      loot: [clone(item)],
      salvaged: salvaged.map((row) => clone(row)),
      summary: clone(state.lastCombat),
    },
  };
}

function preparePlayerCombat(state, publicId) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match || match.kind !== "combat") return null;
  const plan = match.id.startsWith("showdown:")
    ? showdownPlan(state, match.id.split(":")[1])
    : eventCombatPlan(state, match.id.split(":")[1], match.id.split(":")[2]);
  return plan ? { ...clone(plan), publicActionId: publicId } : null;
}

function applyPlayerCombatResult(stateInput, publicId, result) {
  const match = actionCatalog(stateInput).find((row) => row.publicId === publicId);
  if (!match || !["combat", "guild"].includes(match.kind)) throw new Error("这个战斗已经不在当前场景中。");
  const state = clone(stateInput);
  settleCombat(state, match.id, result);
  return state;
}

function equipPlayerItem(stateInput, heroId, itemId) {
  const state = clone(stateInput);
  if (!state.roster.includes(heroId)) throw new Error("这个角色尚未加入队伍。");
  const item = state.inventory.find((row) => row.id === itemId);
  if (!item || !SLOT_DATA[item.slot]) throw new Error("这件装备已经不在背包里。");
  for (const slots of Object.values(state.equipment)) for (const slot of Object.keys(slots)) if (slots[slot] === itemId) slots[slot] = null;
  state.equipment[heroId] = { ...emptyEquipmentSlots(), ...(state.equipment[heroId] || {}) };
  state.equipment[heroId][item.slot] = item.id;
  addLog(state, `${HEROES[heroId].name}换上了${item.name}。`, "equipment");
  return state;
}

function unequipPlayerSlot(stateInput, heroId, slot) {
  const state = clone(stateInput);
  if (!state.roster.includes(heroId) || !SLOT_DATA[slot]) throw new Error("无法卸下这个部位的装备。");
  state.equipment[heroId] = { ...emptyEquipmentSlots(), ...(state.equipment[heroId] || {}) };
  const item = state.inventory.find((row) => row.id === state.equipment[heroId][slot]);
  state.equipment[heroId][slot] = null;
  if (item) addLog(state, `${HEROES[heroId].name}卸下了${item.name}。`, "equipment");
  return state;
}

function publicSituation(state) {
  if (state.phase === "showdown") return state.showdownAct === 1 ? "白鹿家兵已经抵达镇外。" : state.showdownAct === 2 ? "执法队与雇佣军正在北桥外列阵。" : "三支围剿军同时发动总攻。";
  if (state.day <= 5) return "白鹿家少爷说第五日会带家兵回来。";
  if (state.day <= 10) return state.flags.youngMasterRepelled ? "少爷退走后，家族执法官以袭击贵族私兵为名封锁北桥。" : "少爷的家兵占住镇口，执法官开始清点整座镇子的财产。";
  return state.flags.bailiffRepelled ? "执法队退走后，三支互不信任的军队以平乱为名围向煤灰镇。" : "执法官占住北桥，随后赶来的三支军队开始争夺这场围剿的主导权。";
}

function visiblePlaces(state, catalog) {
  const rows = [];
  if (state.phase === "showdown") {
    const plan = showdownPlan(state, "hold");
    const reinforcements = plan.leftTeam.length - state.activeParty.length;
    const sources = [];
    if (state.flags.bannerCompany) sources.push("断旗队");
    if (state.flags.minersSupport) sources.push("矿工");
    if (state.flags.warCouncil) sources.push("战前会议调来的人手");
    if (state.resources.townFavor > 0) sources.push("受你帮助的镇民");
    const assembly = reinforcements > 0 ? `你的${state.activeParty.length}名出战成员之外，还有${reinforcements}名盟友响应；来源包括${sources.length ? sources.join("、") : "临时志愿者"}。对面有${plan.rightTeam.length}名核心敌人。` : `你的${state.activeParty.length}名出战成员已经集结，对面有${plan.rightTeam.length}名核心敌人。`;
    return [{ id: "place_showdown", title: state.showdownAct === 1 ? "镇外家兵" : state.showdownAct === 2 ? "北桥联军" : "围剿联盟", area: "煤灰镇", status: "present", scene: `${publicSituation(state)} ${assembly}`, actionCount: catalog.length }];
  }
  for (const [zoneId, zone] of Object.entries(ZONES)) if (zoneAvailable(state, zoneId)) rows.push({ id: `place_zone_${zoneId}`, title: zone.title, area: zone.area, status: "open", scene: zone.scene, actionCount: catalog.filter((a) => a.placeId === `place_zone_${zoneId}`).length });
  if (state.day <= 5) rows.push({ id: "place_gate", title: "王炉门", area: "灰炉遗址", status: state.flags.innerOpen ? "open" : "locked", scene: state.flags.gateInspected ? "煤灰下露出熔毁锁芯、三段断纹和一条通往守门甲胄的铜线。" : "一扇煤灰覆盖的铁门挡住了通往内环的路。", actionCount: catalog.filter((a) => a.placeId === "place_gate").length });
  for (const event of EVENTS) if (eventIsVisible(state, event)) rows.push({ id: `place_event_${event.id}`, title: event.title, area: event.area, status: "present", scene: event.scene, actionCount: catalog.filter((a) => a.placeId === `place_event_${event.id}`).length });
  if (catalog.some((action) => action.placeId === "place_patrol")) rows.push({ id: "place_patrol", title: "尚未撤离的街巷", area: "煤灰镇", status: "present", scene: "眼下没有迫在眉睫的事件，但仍有镇民在收拾店铺和讨论局势。", actionCount: 1 });
  rows.push({ id: "place_guild", title: "冒险者协会", area: "镇中心", status: "open", scene: "公告板上同时挂着无需门槛的简单委托和高风险悬赏。每份委托都允许你带自己的队友，并借用有限的协会成员。", actionCount: catalog.filter((a) => a.placeId === "place_guild").length });
  rows.push({ id: "place_party", title: "队伍与装备", area: "营地", status: "present", scene: `当前可以安排最多${MAX_ACTIVE_BY_ACT[actForDay(state.day)]}名出战成员。`, actionCount: catalog.filter((a) => a.placeId === "place_party").length });
  rows.push({ id: "place_calendar", title: "今日日程", area: "营地", status: "present", scene: `今天还有${state.ap}次行动。`, actionCount: catalog.filter((action) => action.placeId === "place_calendar").length });
  return rows;
}

function visibleSkills(heroId) {
  const kit = SKILLS.roleKits[HEROES[heroId].combatRole]?.kit || {};
  return [kit.small1, kit.small2, kit.passive, kit.ultimate].filter(Boolean).map((key) => ({ name: SKILLS.skills[key]?.name || key, type: SKILLS.skills[key]?.type || "技能", description: PUBLIC_SKILL_DESCRIPTIONS[key] || SKILLS.skills[key]?.desc || SKILLS.skills[key]?.description || "" }));
}

function knownEffectsForAction(state, row) {
  if (!row || !["event", "inspect"].includes(row.kind)) return [];
  try {
    const next = applyAction(state, row.id);
    const labels = { gold: "金币", medicine: "药品", townFavor: "镇民支持", evidence: "证据", influence: "影响力" };
    return Object.entries(labels).map(([resource, label]) => ({
      resource,
      label,
      delta: Number(next.resources?.[resource] || 0) - Number(state.resources?.[resource] || 0),
    })).filter((effect) => effect.delta !== 0);
  } catch {
    return [];
  }
}

function getPlayerObservation(state) {
  const catalog = actionCatalog(state);
  const act = actForDay(state.day);
  const rawPlaces = visiblePlaces(state, catalog);
  const quests = publicQuests(state, rawPlaces);
  const places = addQuestLinksToPlaces(rawPlaces, quests);
  const placeById = new Map(places.map((place) => [place.id, place]));
  return {
    schema: "fifteen_day_demo_player_observation_v1",
    time: { day: state.day, actionsRemainingToday: state.ap, phase: state.phase, act, nextKnownDeadline: state.day <= 5 ? 5 : state.day <= 10 ? 10 : 15 },
    situation: publicSituation(state),
    party: {
      maxActive: MAX_ACTIVE_BY_ACT[act],
      active: state.activeParty.map((id) => ({ id, name: HEROES[id].name, role: HEROES[id].role, visiblePower: heroPower(state, id), formation: FORMATION_LABELS[state.formation[id]] || `队列${state.formation[id] + 1}`, visibleSkills: visibleSkills(id) })),
      reserve: state.roster.filter((id) => !state.activeParty.includes(id)).map((id) => ({ id, name: HEROES[id].name, role: HEROES[id].role, visiblePower: heroPower(state, id), visibleSkills: visibleSkills(id) })),
    },
    resources: clone(state.resources),
    inventory: state.inventory.map((item) => clone(item)),
    inventoryLimit: INVENTORY_LIMIT,
    equipmentSlots: Object.entries(SLOT_DATA).map(([id, row]) => ({ id, label: row.label })),
    guild: {
      record: clone(state.guildRecord || {}),
      guests: Object.entries(GUILD_GUESTS).map(([id, row]) => ({ id, name: row.name, role: row.role })),
      quests: Object.values(GUILD_QUESTS).map((quest) => ({ id: quest.id, title: quest.title, difficulty: quest.difficulty, description: quest.description, partyCap: quest.partyCap, guestCap: quest.guestCap, guests: [...quest.guests], clears: Number(state.guildRecord?.[quest.id] || 0) })),
    },
    salvagedCount: Number(state.stats.salvaged || 0),
    quests,
    places,
    threatSignals: state.recent.filter((row) => ["threat", "chapter"].includes(row.kind)).slice(0, 8).map((row) => row.text),
    recentSignals: state.recent.slice(0, 8).map((row) => row.text),
    lastCombat: clone(state.lastCombat),
    actions: catalog.map((row) => ({
      id: row.publicId,
      label: row.label,
      kind: row.kind,
      placeId: row.placeId,
      callback: row.callback || "",
      grindLevel: row.grindLevel || 0,
      enemyCount: row.enemyCount || 0,
      difficulty: row.difficulty || "",
      partyCap: row.partyCap || 0,
      guestCap: row.guestCap || 0,
      actionPointMark: row.actionPointCost ?? (["event", "combat", "inspect"].includes(row.kind) ? 1 : 0),
      endsCurrentDay: row.kind === "time",
      knownEffects: knownEffectsForAction(state, row),
      futureImpacts: [...new Set((placeById.get(row.placeId)?.questLinks || []).map((link) => link.questTitle))],
    })),
    result: clone(state.result),
  };
}

function migrateState(stateInput) {
  const state = clone(stateInput);
  state.guildRecord = { road_pests: 0, black_iron_warrant: 0, ...(state.guildRecord || {}) };
  for (const heroId of Object.keys(HEROES)) {
    const old = state.equipment?.[heroId] || {};
    state.equipment[heroId] = { ...emptyEquipmentSlots(), ...old, chest: old.chest || old.armor || null };
    delete state.equipment[heroId].armor;
  }
  for (const item of state.inventory || []) {
    if (item.slot === "armor") item.slot = "chest";
    item.slotLabel = SLOT_LABELS[item.slot] || item.slotLabel;
    item.identityTags = item.identityTags || [];
    item.baseStats = item.baseStats || {};
    item.affixes = item.affixes || [];
  }
  state.stats = { spentActions: 0, grinds: 0, grindAttempts: 0, combats: 0, failedCombats: 0, salvaged: 0, ...(state.stats || {}) };
  if (state.flags?.smithForged && !state.flags.innerOpen) {
    state.flags.innerOpen = true;
    if (!state.flags.smithInnerMigrationNoted) {
      state.flags.smithInnerMigrationNoted = true;
      addLog(state, "铁匠试炉留下的蓝钢断纹与王炉门发生共鸣，灰炉内环已经开放。", "unlock");
    }
  }
  const salvaged = enforceInventoryLimit(state);
  if (salvaged.length) addLog(state, `旧背包超过${INVENTORY_LIMIT}件，已自动分解最差的${salvaged.length}件装备。`, "equipment");
  return state;
}

return {
  VERSION, AP_PER_DAY, FINAL_DAY, INVENTORY_LIMIT, HEROES, EVENTS, ZONES, GRIND_ENCOUNTERS, SLOT_DATA, RARITY_DATA, AFFIX_DEFS, GUILD_GUESTS, GUILD_QUESTS, THREAT_LEVELS, QUEST_DEFINITIONS, EVENT_OUTCOMES, COMBAT_OPTIONS,
  createInitialState, migrateState, getPlayerObservation, applyPlayerAction, preparePlayerCombat, preparePlayerGuildCombat, preparePlayerGrindCombat, applyPlayerCombatResult, applyPlayerGrindCombatResult,
  equipPlayerItem, unequipPlayerSlot, applyAction, internalActions, simulatePlan, showdownPlan, eventCombatPlan, grindCombatPlan, guildQuestPlan, heroPower, actForDay,
};
});
