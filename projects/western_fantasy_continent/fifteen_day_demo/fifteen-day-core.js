(function (root, factory) {
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.FIFTEEN_DAY_DEMO = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
"use strict";

const COMBAT = typeof module !== "undefined" && module.exports ? require("../game_data/combat-sim") : root.GAME_COMBAT_SIM;
const SKILLS = typeof module !== "undefined" && module.exports ? require("../game_data/skill-data") : root.GAME_SKILL_DATA;

const VERSION = "fifteen_day_demo_v2";
const AP_PER_DAY = 3;
const FINAL_DAY = 15;
const MAX_ACTIVE_BY_ACT = { 1: 4, 2: 10, 3: 10 };
const FORMATION_LABELS = [
  "前排一号", "前排二号", "前排三号", "前排四号", "前排五号",
  "后排一号", "后排二号", "后排三号", "后排四号", "后排五号",
];
const SLOT_LABELS = { weapon: "武器", armor: "护甲", charm: "饰品" };
const RARITIES = ["普通", "稀有", "史诗", "传说", "神话", "永恒"];
const RARITY_POWER = { "普通": 7, "稀有": 13, "史诗": 23, "传说": 38, "神话": 62, "永恒": 100 };
const IDENTITY_TAGS = ["古代锻造", "赃物", "流放者", "宗教", "白鹿家", "恐怖", "贵族", "矿工", "王国军", "异端"];
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
    { id: "forge", label: "把三把普通武器交给铁匠", visible: (s) => Boolean(s.flags.smithPromise), req: (s) => countUnequipped(s, (i) => i.slot === "weapon" && i.rarity === "普通") >= 3 },
  ] },
  { id: "well_dispute", title: "水井边的争执", area: "镇中心", start: 1, end: 2, scene: "染匠说上游截水是旧约，菜农说今年再断水全家都会饿死。", options: [
    { id: "tanner", label: "支持染匠执行旧约" },
    { id: "grower", label: "支持菜农先保住收成" },
    { id: "measure", label: "查水尺与旧账后再分水", req: (s) => s.flags.smithPromise },
  ] },
  { id: "apothecary_debt", title: "被堵在药铺里的学徒", area: "镇中心", start: 3, end: 4, scene: "债主堵住药铺门口，学徒仍在给两个发热的孩子换湿布。", options: [
    { id: "pay", label: "替她还清五枚金币", req: (s) => s.resources.gold >= 5 },
    { id: "patients", label: "留下来帮她照看病人" },
  ] },
  { id: "thief_trial", title: "粮仓屋顶的小偷", area: "西门商道", start: 2, end: 4, scene: "守仓人抓住一个偷面包的孩子；屋檐上还藏着一捆盖有白鹿家印记的账页。", options: [
    { id: "thief", label: "替孩子作保并追问账页来历" },
    { id: "warden", label: "把孩子和账页都交给守仓人" },
  ] },
  { id: "caravan", title: "燃烧的驮车", area: "西门商道", start: 3, end: 3, scene: "一辆驮车起火，车夫被压住，货箱上的锁已经烧红。", options: [
    { id: "rescue", label: "先救被压住的车夫" },
    { id: "cargo", label: "先拖走即将烧毁的货箱" },
  ] },
  { id: "furnace_clue", title: "王炉门上的断纹", area: "灰炉遗址", start: 2, end: 5, visible: (s) => s.flags.gateInspected && !s.flags.innerOpen, scene: "熔毁锁芯旁有三段断纹，铜线一直连向守门甲胄。", options: [
    { id: "smith", label: "把断纹拓印交给铁匠", visible: (s) => !s.flags.smithDoorTheory, req: (s) => s.flags.smithPromise },
    { id: "key", label: "把三件[古代锻造]装备交给铁匠", visible: (s) => Boolean(s.flags.smithDoorTheory), req: (s) => countUnequipped(s, (i) => i.identityTags.includes("古代锻造")) >= 3 },
    { id: "force", label: "挑战守门甲胄" },
  ] },
  { id: "cooling_well", title: "冒蒸汽的冷却井", area: "灰炉遗址", start: 2, end: 5, visible: (s) => s.flags.guardianFailed && !s.flags.innerOpen, scene: "甲胄退回炉门后，冷却井仍沿铜管向它输送蒸汽。", options: [
    { id: "jam", label: "用废铁卡死冷却阀" },
  ] },
  { id: "quartermaster", title: "河畔营地的军需车", area: "河畔营地", start: 3, end: 5, scene: "军需车停在木栅后，后坡的排水沟通向营地内侧。", options: [
    { id: "thief", label: "让小偷从排水沟潜入", req: (s) => s.roster.includes("thief") },
    { id: "fight", label: "正面袭击军需守卫" },
  ] },
  { id: "duelist", title: "白鹿家的旁支剑士", area: "西门商道", start: 4, end: 5, scene: "旁支剑士没有跟护卫队同行。她反复查看少爷留下的书面命令。", options: [
    { id: "evidence", label: "把收集到的账页与证词交给她", req: (s) => s.resources.evidence >= 3 },
    { id: "challenge", label: "以剑证明你不是街头暴徒" },
  ] },
  { id: "night_raid", title: "营地夜巡", area: "河畔营地", start: 4, end: 5, scene: "巡逻火把沿河移动，高地能看见他们换岗时留下的空档。", options: [
    { id: "ambush", label: "伏击夜巡队" },
    { id: "scout", label: "只记录换岗路线", req: (s) => s.roster.includes("thief") },
  ] },

  { id: "exile_scout", title: "被驱逐的灰炉向导", area: "黑石采坑", start: 6, end: 8, scene: "一名流放者在矿道口画守卫换岗图，她想取回家族被扣下的骨匣。", options: [
    { id: "return", label: "答应替她取回骨匣" },
    { id: "rune", label: "用一件[流放者]装备证明来意", req: (s) => heroHasTag(s, "player", "流放者") },
  ] },
  { id: "mine_strike", title: "拒绝下井的矿工", area: "北部矿区", start: 6, end: 7, scene: "矿主扣住粮票逼人下井，矿工则堵住运煤轨道。", options: [
    { id: "miners", label: "站在矿工一边扣下运煤车" },
    { id: "owner", label: "护送运煤车通过人群" },
    { id: "audit", label: "查清粮票和欠薪账", req: (s) => s.resources.evidence >= 2 },
  ] },
  { id: "chapel_guard", title: "封闭礼拜堂的灰袍司祭", area: "旧礼拜堂", start: 6, end: 7, scene: "司祭把避难者锁在礼拜堂里，门外的人说他私藏了教会药品。", options: [
    { id: "medicine", label: "送去三份药品", req: (s) => s.resources.medicine >= 3 },
    { id: "search", label: "要求当众检查地下储藏室" },
  ] },
  { id: "bridge_engineer", title: "被拆毁的北桥", area: "北部矿区", start: 7, end: 8, scene: "桥梁师守着半截绞盘，她说缺两件古代锻造零件，也可以冒险从激流里拖出旧梁。", options: [
    { id: "parts", label: "交出两件[古代锻造]装备", req: (s) => countUnequipped(s, (i) => i.identityTags.includes("古代锻造")) >= 2 },
    { id: "river", label: "带队下水抢修旧梁" },
  ] },
  { id: "arena", title: "矿区的倒塌擂台", area: "北部矿区", start: 7, end: 10, scene: "冠军答应加入能把他逼出白线的人。围观者已经在废石上下注。", options: [
    { id: "fight", label: "公开挑战擂台冠军" },
    { id: "rematch", label: "接受双方卸甲重赛", visible: (s) => s.flags.arenaFailed },
  ] },
  { id: "deserter_mage", title: "躲在盐仓里的逃亡术士", area: "河畔营地", start: 7, end: 8, scene: "术士烧掉了雇佣军征召书。他需要一条离开封锁线的路。", options: [
    { id: "route", label: "把夜巡换岗图交给他", req: (s) => s.flags.campScouted },
    { id: "bribe", label: "花八枚金币买通河船", req: (s) => s.resources.gold >= 8 },
  ] },
  { id: "tax_archive", title: "临时税务所", area: "镇中心", start: 8, end: 9, scene: "执法官把镇民欠税册与少爷的赔偿要求钉在同一块木板上。", options: [
    { id: "steal", label: "趁换岗时偷走盖章底册", req: (s) => s.roster.includes("thief") || s.roster.includes("exile") },
    { id: "petition", label: "召集欠税人逐条核对" },
  ] },
  { id: "grain_seizure", title: "被扣押的冬粮", area: "西门商道", start: 8, end: 9, scene: "执法队扣下冬粮作为赔偿，车夫只认盖章放行条。", options: [
    { id: "papers", label: "拿税务底册逼车夫放粮", req: (s) => s.flags.taxLedger },
    { id: "raid", label: "截停押粮队" },
  ] },
  { id: "signal_tower", title: "山脊上的信号塔", area: "北部矿区", start: 8, end: 9, scene: "信号塔每晚向南方点三次火，守塔人从不离开平台。", options: [
    { id: "false", label: "换掉今晚的灯油与旗语", req: (s) => s.roster.includes("exile") || s.roster.includes("engineer") },
    { id: "storm", label: "趁雷雨强攻塔楼" },
  ] },
  { id: "paymaster", title: "雇佣军发饷日", area: "河畔营地", start: 9, end: 10, scene: "六名押运兵围着钱箱，营帐里不断有人来问欠饷。", options: [
    { id: "fight", label: "夺下发饷钱箱" },
    { id: "rumor", label: "把欠饷名单贴到营门", req: (s) => s.flags.taxLedger || s.resources.evidence >= 4 },
  ] },
  { id: "noble_banquet", title: "执法官的宴会", area: "镇中心", start: 9, end: 10, scene: "执法官邀请镇上有头脸的人赴宴，桌上摆着尚未宣读的判决书。", options: [
    { id: "noble", label: "穿戴[贵族]装备入席", req: (s) => heroHasTag(s, "player", "贵族") },
    { id: "servants", label: "让学徒混进后厨", req: (s) => s.roster.includes("apothecary") || s.roster.includes("thief") },
  ] },
  { id: "hunter", title: "矿道里的食铁兽", area: "黑石采坑", start: 9, end: 10, scene: "巨兽咬断矿轨后躲进黑暗，猎人用粉笔标出它反复经过的岔路。", options: [
    { id: "hunt", label: "跟猎人进入矿道" },
    { id: "trap", label: "在标出的岔路布置陷阱", visible: (s) => s.flags.huntFailed },
  ] },

  { id: "banner_company", title: "失去军籍的断旗队", area: "西门商道", start: 11, end: 13, scene: "二十名旧王国兵护送难民抵达。他们没有粮，也不愿再替贵族卖命。", options: [
    { id: "grain", label: "把夺回的冬粮分给他们", req: (s) => s.flags.grainRecovered },
    { id: "pay", label: "支付十二枚金币作为军饷", req: (s) => s.resources.gold >= 12 },
    { id: "oath", label: "出示执法官伪造判决的证据", req: (s) => s.resources.evidence >= 6 },
  ] },
  { id: "swamp_witch", title: "沼泽边的盐枝女巫", area: "南部沼泽", start: 11, end: 13, scene: "女巫能让攻城兽拒绝进食，但礼拜堂的人要求先烧掉她的药圃。", options: [
    { id: "protect", label: "承诺保护她的药圃" },
    { id: "church", label: "支持礼拜堂封禁药圃" },
    { id: "herbs", label: "交出五份药品换取兽群药剂", req: (s) => s.resources.medicine >= 5 },
  ] },
  { id: "war_council", title: "三方争吵的战前会议", area: "镇中心", start: 11, end: 12, scene: "矿工要守矿道，商人要守粮仓，司祭坚持先撤走伤员。能调动的人手只够先答应一方。", options: [
    { id: "miners", label: "先把人手交给矿工" },
    { id: "merchants", label: "先把人手交给商人" },
    { id: "chapel", label: "先把人手交给礼拜堂" },
  ] },
  { id: "sky_ferry", title: "山顶的旧式飞艇塔", area: "北部矿区", start: 11, end: 14, scene: "升降塔仍能转动，但主轴缺一枚耐火炉心，塔下还有雇佣军巡逻。", options: [
    { id: "core", label: "安装一件[古代锻造]史诗装备", req: (s) => countUnequipped(s, (i) => i.identityTags.includes("古代锻造") && rarityIndex(i.rarity) >= rarityIndex("史诗")) >= 1 },
    { id: "seize", label: "清除塔下巡逻队" },
  ] },
  { id: "plague_camp", title: "围城前的热病营", area: "旧礼拜堂", start: 12, end: 14, scene: "难民营出现热病，药品不够同时救治病人和维持前线。", options: [
    { id: "sick", label: "把药优先留给病人", req: (s) => s.resources.medicine >= 3 },
    { id: "front", label: "把药优先送往前线", req: (s) => s.resources.medicine >= 3 },
    { id: "witch", label: "请盐枝女巫辨认病源", req: (s) => s.roster.includes("witch") },
  ] },
  { id: "siege_engines", title: "正在组装的攻城器", area: "河畔营地", start: 12, end: 14, scene: "八名工兵在河滩组装投石机，零件分散在三处火堆旁。", options: [
    { id: "fight", label: "强袭攻城器工地" },
    { id: "sabotage", label: "让桥梁师混入工匠队", req: (s) => s.roster.includes("engineer") },
  ] },
  { id: "beast_pens", title: "围剿军的战兽栏", area: "南部沼泽", start: 12, end: 14, scene: "五头披甲战兽被铁链拴在木桩旁，饲养员用同一只桶投食。", options: [
    { id: "fight", label: "在战兽出栏前解决它们" },
    { id: "dose", label: "把女巫药剂倒进食桶", req: (s) => s.flags.beastDrug },
  ] },
  { id: "traitor_gate", title: "半夜打开的旧城门", area: "旧城墙", start: 13, end: 14, scene: "守门人说风吹开了门，但门闩上有新鲜锉痕，旁边还掉着贵族火漆。", options: [
    { id: "arrest", label: "立刻扣下守门人" },
    { id: "follow", label: "假装没有发现并跟踪他" },
  ] },
  { id: "ancient_core", title: "古王炉心的第二道门", area: "王炉地底", start: 13, end: 15, visible: (s) => s.flags.innerOpen, scene: "第二道门后传来整齐锤击声，地上有一排不属于人类的脚印。", options: [
    { id: "fight", label: "进入炉心清除守炉造物" },
    { id: "seal", label: "让铁匠与桥梁师重接封印", req: (s) => s.roster.includes("engineer") && s.flags.smithPromise },
  ] },
  { id: "coalition_envoy", title: "围剿联盟的无旗使者", area: "镇中心", start: 14, end: 15, scene: "使者承认三支军队并不互相信任。他只问你准备把谁的秘密先公开。", options: [
    { id: "pay", label: "交出发饷钱箱里的欠条", req: (s) => s.flags.payChest },
    { id: "law", label: "公开执法官伪造判决", req: (s) => s.flags.falseJudgment },
    { id: "fear", label: "展示[恐怖]装备要求他们退军", req: (s) => heroHasTag(s, "player", "恐怖") },
  ] },
];

const COMBAT_OPTIONS = new Set([
  "furnace_clue:force", "quartermaster:fight", "duelist:challenge", "night_raid:ambush",
  "bridge_engineer:river", "arena:fight", "arena:rematch", "grain_seizure:raid", "signal_tower:storm",
  "paymaster:fight", "hunter:hunt", "hunter:trap", "sky_ferry:seize", "siege_engines:fight",
  "beast_pens:fight", "ancient_core:fight",
]);

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
    flags: {},
    nodes: {},
    chapterResults: [],
    recent: [],
    lastCombat: null,
    result: null,
    stats: { spentActions: 0, grinds: 0, combats: 0, failedCombats: 0 },
  };
  for (const heroId of Object.keys(HEROES)) state.equipment[heroId] = { weapon: null, armor: null, charm: null };
  state.inventory.push({ id: "starter_knife", name: "缺口短刀", slot: "weapon", slotLabel: "武器", rarity: "普通", power: 6, identityTags: [], source: "随身物品" });
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

function generateItem(state, zoneId) {
  const rarityTable = zoneId === "forge"
    ? [["史诗", 0.60], ["传说", 0.35], ["神话", 0.049], ["永恒", 0.001]]
    : zoneId === "quarry"
      ? [["稀有", 0.60], ["史诗", 0.34], ["传说", 0.058], ["神话", 0.002]]
      : zoneId === "inner"
        ? [["普通", 0.42], ["稀有", 0.47], ["史诗", 0.105], ["传说", 0.005]]
      : [["普通", 0.70], ["稀有", 0.25], ["史诗", 0.049], ["传说", 0.001]];
  const rarity = pick(state, rarityTable);
  const slot = pick(state, [["weapon", 0.38], ["armor", 0.38], ["charm", 0.24]]);
  const base = RARITY_POWER[rarity];
  const power = Math.max(4, Math.round(base * (0.82 + rand(state) * 0.36)));
  const tags = [];
  const tagChance = zoneId === "forge" ? 0.78 : zoneId === "quarry" ? 0.58 : zoneId === "inner" ? 0.48 : 0.34;
  if (rand(state) < tagChance) tags.push(pick(state, IDENTITY_TAGS.map((tag) => [tag, 1])));
  const names = {
    weapon: ["短剑", "战斧", "长弓", "符文杖"], armor: ["锁甲", "旅衣", "鳞甲", "炉纹袍"], charm: ["骨哨", "火漆戒", "旧圣徽", "矿晶坠"],
  };
  const name = `${tags[0] ? `${tags[0]}·` : ""}${pick(state, names[slot].map((row) => [row, 1]))}`;
  return { id: `item_${state.day}_${state.stats.grinds}_${state.inventory.length}_${hash(`${state.rngState}|${name}`)}`, name, slot, slotLabel: SLOT_LABELS[slot], rarity, power, identityTags: tags, source: ZONES[zoneId].title };
}

function grind(state, zoneId, count) {
  if (state.phase !== "planning") throw new Error("大战已经开始，当前无法刷取装备。");
  const zone = ZONES[zoneId];
  if (!zoneAvailable(state, zoneId)) throw new Error("这个区域尚未被发现。");
  const items = [];
  for (let i = 0; i < count; i += 1) items.push(generateItem(state, zoneId));
  state.inventory.push(...items);
  state.stats.grinds += count;
  const counts = Object.fromEntries(RARITIES.map((rarity) => [rarity, items.filter((item) => item.rarity === rarity).length]).filter((row) => row[1]));
  addLog(state, `你在${zone.title}连续战斗${count}次，带回${count}件装备：${Object.entries(counts).map(([r, n]) => `${r}${n}`).join("、")}。`, "loot");
}

function autoEquip(state) {
  const available = new Set(state.inventory.map((item) => item.id));
  for (const heroId of state.activeParty) {
    for (const slot of Object.keys(SLOT_LABELS)) {
      const best = state.inventory.filter((item) => item.slot === slot && available.has(item.id)).sort((a, b) => itemPower(b) - itemPower(a))[0];
      const currentId = state.equipment[heroId][slot];
      const current = state.inventory.find((item) => item.id === currentId);
      if (best && (!current || best.power > current.power)) {
        if (currentId) available.add(currentId);
        state.equipment[heroId][slot] = best.id;
        available.delete(best.id);
      } else if (currentId) available.delete(currentId);
    }
  }
  addLog(state, "队伍重新比较了背包里的装备并完成穿戴。", "equipment");
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
  const slots = state.equipment[heroId];
  const weapon = state.inventory.find((i) => i.id === slots.weapon);
  const armor = state.inventory.find((i) => i.id === slots.armor);
  const charm = state.inventory.find((i) => i.id === slots.charm);
  const main = ["mage", "priest", "warlock", "alchemist"].includes(hero.combatRole) ? "magicPower" : "physicalPower";
  spec[main] += Math.round(itemPower(weapon) * 2.2 + itemPower(charm) * 0.9);
  spec.power = Math.max(spec.physicalPower, spec.magicPower);
  spec.maxHp += Math.round(itemPower(armor) * 15 + itemPower(charm) * 4);
  spec.hp = spec.maxHp;
  spec.armor += Math.round(itemPower(armor) * 0.5);
  spec.effectPowerMult = 1 + itemPower(charm) * 0.008;
  return spec;
}

function militiaSpec(index, tier = 1, kind = "militia") {
  const roles = ["warrior", "knight", "ranger", "priest", "warrior"];
  return roleSpec(roles[index % roles.length], `煤灰镇志愿者${index + 1}`, index, { hp: 0.72 + tier * 0.08, power: 0.66 + tier * 0.08, armor: 0.85, unitKind: kind });
}

function enemySpec(role, name, index, tier = 1, scales = {}) {
  return roleSpec(role, name, index, { hp: (0.88 + tier * 0.10) * (scales.hp || 1), power: (0.84 + tier * 0.10) * (scales.power || 1), armor: scales.armor || 1, unitKind: "enemy", ...scales });
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
    rightTeam = [enemySpec("knight", "守门甲胄", 0, 2, { hp: jammed ? 2.2 : 4.2, power: jammed ? 1.35 : 2.25, armor: jammed ? 1.15 : 1.65, small1: "enemyHeavySmash", small2: "enemyNoop", passive: "enemyStoneGuard", ultimate: "enemyNoUltimate" })];
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
    rightTeam = [enemySpec("berserker", "激流中的穴兽", 0, 2, { hp: 2.4, power: 1.3 })];
  } else if (key.startsWith("arena:")) {
    title = key.endsWith("rematch") ? "卸甲重赛" : "矿区擂台";
    rightTeam = [enemySpec("berserker", "擂台冠军", 0, 3, { hp: key.endsWith("rematch") ? 1.3 : 2.1, power: key.endsWith("rematch") ? 1.05 : 1.35 })];
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
    rightTeam = [enemySpec("berserker", "食铁兽", 0, 3, { hp: trapped ? 1.6 : 2.8, power: trapped ? 1.1 : 1.45, armor: trapped ? 0.9 : 1.15 })];
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
  return { kind: "combat", title, internalAction: `event:${eventId}:${optionId}`, seed: `${state.seed}|${state.day}|${key}|${state.stats.combats}`, leftTeam, rightTeam, maxTime: 90 };
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
      hp: 0.85,
      power: strategy === "ambush" && state.flags.campScouted ? 0.714 : 0.85,
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
  return { kind: "combat", title, internalAction: `showdown:${strategy}`, seed: `${state.seed}|showdown${act}|${strategy}|${state.stats.combats}`, leftTeam, rightTeam, maxTime: 120 };
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
      return { id: `showdown:${id}`, label: `${id === "hold" ? "依托现有防线迎战" : "主动出城迎战"}（${plan.leftTeam.length}对${plan.rightTeam.length}）`, kind: "combat", placeId: "place_showdown" };
    });
    if (state.showdownAct === 1 && state.flags.campScouted) {
      const plan = showdownPlan(state, "ambush");
      rows.push({ id: "showdown:ambush", label: `利用掌握的夜巡路线伏击家兵（${plan.leftTeam.length}对${plan.rightTeam.length}）`, kind: "combat", placeId: "place_showdown" });
    }
    if (politicalRouteAvailable(state)) rows.push({ id: "showdown:political", label: "在众人面前迫使对方撤军", kind: "decision", placeId: "place_showdown" });
    return rows;
  }
  const rows = [];
  for (const [zoneId, zone] of Object.entries(ZONES)) {
    if (zoneAvailable(state, zoneId)) {
      rows.push({ id: `grind:${zoneId}:1`, label: `在${zone.title}战斗1次`, kind: "grind", placeId: `place_zone_${zoneId}` });
      rows.push({ id: `grind:${zoneId}:10`, label: `在${zone.title}连续战斗10次`, kind: "grind", placeId: `place_zone_${zoneId}` });
    }
  }
  if (!state.flags.gateInspected && state.day <= 5 && state.ap > 0) rows.push({ id: "investigate:gate", label: "检查王炉门与锁芯", kind: "inspect", placeId: "place_gate" });
  for (const event of EVENTS) {
    if (!eventIsVisible(state, event)) continue;
    for (const option of event.options) if (optionIsAvailable(state, event, option)) rows.push({ id: `event:${event.id}:${option.id}`, label: option.label, kind: COMBAT_OPTIONS.has(`${event.id}:${option.id}`) ? "combat" : "event", placeId: `place_event_${event.id}` });
  }
  if (state.ap > 0 && state.flags.lastPatrolDay !== state.day && !rows.some((row) => ["event", "combat", "inspect"].includes(row.kind))) rows.push({ id: "patrol", label: "利用剩余时间走访镇民", kind: "event", placeId: "place_patrol" });
  rows.push({ id: "auto_equip", label: "让当前出战成员择优穿戴", kind: "equipment", placeId: "place_party" });
  const ownedTags = [...new Set(state.inventory.flatMap((item) => item.identityTags))];
  for (const tag of ownedTags.filter((row) => !heroHasTag(state, "player", row))) rows.push({ id: `equip:tag:${tag}`, label: `让你换上一件[${tag}]装备`, kind: "equipment", placeId: "place_party" });
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
  if (internalId === "auto_equip") { autoEquip(state); return state; }
  if (internalId === "patrol") {
    state.resources.townFavor += 1;
    state.flags.lastPatrolDay = state.day;
    addLog(state, "你走访了没有撤离的镇民，记下他们最担心的事。", "event");
    spendAction(state);
    return state;
  }
  if (internalId.startsWith("equip:tag:")) {
    const tag = internalId.slice("equip:tag:".length);
    const item = state.inventory.filter((row) => row.identityTags.includes(tag)).sort((a, b) => itemPower(b) - itemPower(a))[0];
    if (!item) throw new Error("这件装备已经不在背包里。");
    for (const slots of Object.values(state.equipment)) for (const slot of Object.keys(slots)) if (slots[slot] === item.id) slots[slot] = null;
    state.equipment.player[item.slot] = item.id;
    addLog(state, `你穿上了${item.name}。`, "equipment");
    return state;
  }
  if (internalId.startsWith("party:")) { applyParty(state, internalId); return state; }
  if (internalId === "investigate:gate") { state.flags.gateInspected = true; addLog(state, "煤灰下露出熔毁锁芯、三段断纹和一条通往守门甲胄的铜线。", "clue"); spendAction(state); return state; }
  if (internalId === "end_day") { endDay(state); return state; }
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
  else if (eventId === "smith_intro") { if (optionId === "promise") { f.smithPromise = true; node.resolved = false; addLog(state, "铁匠让你带回三把普通武器，试炉会一直留到第四日。", "clue"); } else { takeUnequipped(state, (i) => i.slot === "weapon" && i.rarity === "普通", 3); state.inventory.push({ id: `smith_${state.day}`, name: "蓝钢长剑", slot: "weapon", slotLabel: "武器", rarity: "稀有", power: 18, identityTags: ["古代锻造"], source: "铁匠试炉" }); f.smithForged = true; f.innerOpen = true; addLog(state, "蓝钢长剑成形时，王炉门的断纹同时亮起。门后的灰炉内环已经可以进入。", "unlock"); } }
  else if (eventId === "well_dispute") { if (optionId === "tanner") { r.gold += 3; r.townFavor -= 1; } else if (optionId === "grower") { r.townFavor += 2; r.medicine += 1; } else { r.townFavor += 1; r.evidence += 1; } }
  else if (eventId === "apothecary_debt") { if (optionId === "pay") r.gold -= 5; else r.townFavor += 1; recruit(state, "apothecary"); r.medicine += 2; }
  else if (eventId === "thief_trial") { if (optionId === "thief") { recruit(state, "thief"); r.evidence += 2; } else { r.townFavor += 1; r.evidence += 1; } }
  else if (eventId === "caravan") { if (optionId === "rescue") { r.townFavor += 2; r.medicine += 2; } else { r.gold += 6; state.inventory.push(generateItem(state, "ash")); } }
  else if (eventId === "furnace_clue") {
    if (optionId === "smith") {
      f.smithDoorTheory = true;
      node.resolved = false;
      addLog(state, "铁匠认出断纹来自旧式炉门，但普通钥匙插不进去。", "clue");
    } else {
      takeUnequipped(state, (i) => i.identityTags.includes("古代锻造"), 3);
      f.innerOpen = true;
      addLog(state, "铁匠把三件旧物熔成带断纹的钥胚，炉门在低沉的摩擦声中打开。", "unlock");
    }
  }
  else if (eventId === "cooling_well") { f.coolingJammed = true; addLog(state, "冷却阀被废铁卡住，铜管里的蒸汽声逐渐变弱。", "clue"); }
  else if (eventId === "quartermaster") { f.campScouted = true; r.evidence += 1; addLog(state, "军需车侧翻，营地里的人开始抢救箭箱和粮袋。", "threat"); }
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
  else if (eventId === "ancient_core") { f.forgeSecured = true; for (let i = 0; i < 3; i += 1) state.inventory.push(generateItem(state, "forge")); }
  else if (eventId === "coalition_envoy") { f.coalitionSplit = true; r.influence += 3; }
  addLog(state, `你处理了“${EVENTS.find((e) => e.id === eventId).title}”。`, "event");
  spendAction(state);
}

function settleCombat(state, internalId, result) {
  const plan = internalId.startsWith("showdown:") ? showdownPlan(state, internalId.split(":")[1]) : eventCombatPlan(state, internalId.split(":")[1], internalId.split(":")[2]);
  const summary = publicCombatSummary(result, plan.title);
  state.lastCombat = summary;
  state.stats.combats += 1;
  if (!summary.win) state.stats.failedCombats += 1;
  addLog(state, `在“${summary.title}”中我方${summary.win ? "获胜" : "失利"}：我方${summary.alliesAlive}/${summary.alliesStarted}人仍能战斗，敌方${summary.enemiesAlive}/${summary.enemiesStarted}人仍能战斗，用时${summary.duration}秒；我方造成${summary.alliesDamage}伤害、治疗${summary.alliesHealing}、获得${summary.alliesShield}护盾。`, summary.win ? "combat_win" : "combat_loss");
  if (internalId.startsWith("showdown:")) { settleShowdown(state, internalId.split(":")[1], summary); return; }
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
  return applyAction(state, match.id);
}

function preparePlayerCombat(state, publicId) {
  const match = actionCatalog(state).find((row) => row.publicId === publicId);
  if (!match || match.kind !== "combat") return null;
  const plan = match.id.startsWith("showdown:") ? showdownPlan(state, match.id.split(":")[1]) : eventCombatPlan(state, match.id.split(":")[1], match.id.split(":")[2]);
  return plan ? { ...clone(plan), publicActionId: publicId } : null;
}

function applyPlayerCombatResult(stateInput, publicId, result) {
  const match = actionCatalog(stateInput).find((row) => row.publicId === publicId);
  if (!match || match.kind !== "combat") throw new Error("这个战斗已经不在当前场景中。");
  const state = clone(stateInput);
  settleCombat(state, match.id, result);
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
  rows.push({ id: "place_party", title: "队伍与装备", area: "营地", status: "present", scene: `当前可以安排最多${MAX_ACTIVE_BY_ACT[actForDay(state.day)]}名出战成员。`, actionCount: catalog.filter((a) => a.placeId === "place_party").length });
  rows.push({ id: "place_calendar", title: "今日日程", area: "营地", status: "present", scene: `今天还有${state.ap}次行动。`, actionCount: catalog.filter((action) => action.placeId === "place_calendar").length });
  return rows;
}

function visibleSkills(heroId) {
  const kit = SKILLS.roleKits[HEROES[heroId].combatRole]?.kit || {};
  return [kit.small1, kit.small2, kit.passive, kit.ultimate].filter(Boolean).map((key) => ({ name: SKILLS.skills[key]?.name || key, type: SKILLS.skills[key]?.type || "技能", description: PUBLIC_SKILL_DESCRIPTIONS[key] || SKILLS.skills[key]?.desc || SKILLS.skills[key]?.description || "" }));
}

function getPlayerObservation(state) {
  const catalog = actionCatalog(state);
  const act = actForDay(state.day);
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
    places: visiblePlaces(state, catalog),
    threatSignals: state.recent.filter((row) => ["threat", "chapter"].includes(row.kind)).slice(0, 8).map((row) => row.text),
    recentSignals: state.recent.slice(0, 8).map((row) => row.text),
    lastCombat: clone(state.lastCombat),
    actions: catalog.map((row) => ({ id: row.publicId, label: row.label, kind: row.kind, placeId: row.placeId, actionPointMark: ["event", "combat", "inspect"].includes(row.kind) ? 1 : 0, endsCurrentDay: row.kind === "time" })),
    result: clone(state.result),
  };
}

function migrateState(stateInput) {
  const state = clone(stateInput);
  if (state.flags?.smithForged && !state.flags.innerOpen) {
    state.flags.innerOpen = true;
    if (!state.flags.smithInnerMigrationNoted) {
      state.flags.smithInnerMigrationNoted = true;
      addLog(state, "铁匠试炉留下的蓝钢断纹与王炉门发生共鸣，灰炉内环已经开放。", "unlock");
    }
  }
  return state;
}

return {
  VERSION, AP_PER_DAY, FINAL_DAY, HEROES, EVENTS, ZONES,
  createInitialState, migrateState, getPlayerObservation, applyPlayerAction, preparePlayerCombat, applyPlayerCombatResult,
  applyAction, internalActions, simulatePlan, showdownPlan, eventCombatPlan, heroPower, actForDay,
};
});
