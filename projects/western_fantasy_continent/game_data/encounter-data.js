const EMPTY_ENEMY_SLOTS = {
  small2: "enemyNoop",
  passive: "enemyDormantPassive",
  ultimate: "enemyNoUltimate",
};

const ENCOUNTER_ROSTER = {
  ironGuard: {
    id: "ironGuard",
    name: "铁壁守卫",
    role: "knight",
    tags: ["frontline", "shield", "taunt"],
    small1: "guard",
    small2: "tauntLine",
    passive: "fortressStance",
    ultimate: "bannerWall",
  },
  oathMedic: {
    id: "oathMedic",
    name: "银誓医师",
    role: "priest",
    tags: ["heal", "shield", "stabilize"],
    small1: "heal",
    small2: "bloodCharm",
    passive: "afterglowGrace",
    ultimate: "sanctuary",
  },
  emberAdept: {
    id: "emberAdept",
    name: "余烬学徒",
    role: "mage",
    tags: ["burn", "area", "burst"],
    small1: "fireball",
    small2: "emberSpread",
    passive: "kindlingEcho",
    ultimate: "meteorRain",
  },
  markHunter: {
    id: "markHunter",
    name: "月弦猎手",
    role: "ranger",
    tags: ["mark", "focus", "ranged"],
    small1: "markShot",
    small2: "pinningArrow",
    passive: "duelistFocus",
    ultimate: "arrowStorm",
  },
  toxicKnife: {
    id: "toxicKnife",
    name: "毒刃影手",
    role: "assassin",
    tags: ["poison", "execute", "melee"],
    small1: "toxicStabs",
    small2: "shadowCut",
    passive: "executionSense",
    ultimate: "shadowHarvest",
  },
  grayPact: {
    id: "grayPact",
    name: "灰契术士",
    role: "warlock",
    tags: ["poison", "payoff", "sacrifice"],
    small1: "venomBrand",
    small2: "miasmaFlask",
    passive: "hotbedPact",
    ultimate: "plagueOffering",
  },
  battleDrummer: {
    id: "battleDrummer",
    name: "战鼓诗人",
    role: "bard",
    tags: ["haste", "buff", "tempo"],
    small1: "tempoSong",
    small2: "courageChord",
    passive: "encore",
    ultimate: "crescendo",
  },
  lineBreaker: {
    id: "lineBreaker",
    name: "破阵战士",
    role: "warrior",
    tags: ["frontline", "cleave", "physical"],
    small1: "powerStrike",
    small2: "cleave",
    passive: "lineBreaker",
    ultimate: "warBanner",
  },
  redLion: {
    id: "redLion",
    name: "赤狮狂战",
    role: "berserker",
    tags: ["lowHp", "lifesteal", "basic"],
    small1: "bloodStrike",
    small2: "boneWhirl",
    passive: "rageEngine",
    ultimate: "undyingRoar",
  },
  mistAlchemist: {
    id: "mistAlchemist",
    name: "沼雾炼金师",
    role: "alchemist",
    tags: ["status", "poison", "burn"],
    small1: "miasmaFlask",
    small2: "volatileBottle",
    passive: "catalyst",
    ultimate: "grandMixture",
  },
};

const ENEMIES = {
  boneOgre: enemy({
    role: "enemy_bone_ogre",
    name: "裂骨独眼",
    roleName: "重击敌人",
    hp: 1050,
    power: 72,
    armor: 12,
    range: 12,
    icon: "ogre",
    small1: "enemyHeavySmash",
    small2: "enemySweepingClaw",
    tags: ["singlePressure", "physical"],
  }),
  emberIdol: enemy({
    role: "enemy_ember_idol",
    name: "余烬石像",
    roleName: "群伤敌人",
    hp: 1280,
    power: 108,
    armor: 11,
    range: 36,
    icon: "fire-shrine",
    small1: "enemyEmberPulse",
    tags: ["aoe", "fire"],
  }),
  plagueTotem: enemy({
    role: "enemy_plague_totem",
    name: "瘟疫图腾",
    roleName: "叠毒敌人",
    hp: 1680,
    power: 70,
    armor: 13,
    range: 34,
    icon: "totem",
    small1: "enemyVenomCloud",
    tags: ["poison", "clock"],
  }),
  stoneGolem: enemy({
    role: "enemy_stone_golem",
    name: "石肤魔像",
    roleName: "护盾敌人",
    hp: 2920,
    power: 108,
    armor: 26,
    range: 11,
    icon: "stone-pile",
    small1: "enemyStoneGuard",
    small2: "enemyHeavySmash",
    tags: ["shield", "armor"],
  }),
  mirrorExecutioner: enemy({
    role: "enemy_mirror_executioner",
    name: "镜刃处刑者",
    roleName: "斩杀敌人",
    hp: 1560,
    power: 142,
    armor: 12,
    range: 15,
    icon: "assassin-pocket",
    small1: "enemyCullWeak",
    tags: ["execute", "focusLowest"],
  }),
  frostPylon: enemy({
    role: "enemy_frost_pylon",
    name: "霜缚塔",
    roleName: "减速敌人",
    hp: 1320,
    power: 98,
    armor: 14,
    range: 38,
    icon: "ice-bolt",
    small1: "enemyFrostClamp",
    small2: "enemyEmberPulse",
    tags: ["slow", "tempoTax"],
  }),
};

const ENCOUNTER_LEVELS = [
  {
    id: "ogre_gate",
    name: "关卡1 裂骨门卫",
    fantasy: "一个高压近战木桩，考验前排和治疗是否够硬。",
    chooseCount: 2,
    rosterIds: ["ironGuard", "oathMedic", "lineBreaker", "markHunter", "emberAdept", "redLion", "battleDrummer", "toxicKnife"],
    enemyTeam: [ENEMIES.boneOgre],
    target: { minWinCombos: 3, maxWinShare: 0.65 },
  },
  {
    id: "ember_clock",
    name: "关卡2 余烬倒计时",
    fantasy: "群体火焰持续压血，要求快速击杀或群体续航。",
    chooseCount: 3,
    rosterIds: ["ironGuard", "oathMedic", "emberAdept", "markHunter", "toxicKnife", "grayPact", "battleDrummer", "lineBreaker"],
    enemyTeam: [ENEMIES.emberIdol],
    target: { minWinCombos: 5, maxWinShare: 0.7 },
  },
  {
    id: "plague_clock",
    name: "关卡3 瘟疫钟摆",
    fantasy: "毒会越拖越危险，爆发和稳定抬血都能解，但慢队会被拖垮。",
    chooseCount: 3,
    rosterIds: ["oathMedic", "emberAdept", "markHunter", "toxicKnife", "grayPact", "battleDrummer", "redLion", "mistAlchemist"],
    enemyTeam: [ENEMIES.plagueTotem],
    target: { minWinCombos: 4, maxWinShare: 0.65 },
  },
  {
    id: "stone_skin",
    name: "关卡4 石肤试炼",
    fantasy: "高甲高盾敌人，纯物理会卡住，异常和破防窗口更有效。",
    chooseCount: 4,
    rosterIds: ["ironGuard", "oathMedic", "emberAdept", "markHunter", "toxicKnife", "grayPact", "battleDrummer", "lineBreaker", "redLion", "mistAlchemist"],
    enemyTeam: [ENEMIES.stoneGolem],
    target: { minWinCombos: 8, maxWinShare: 0.62 },
  },
  {
    id: "mirror_frost",
    name: "关卡5 镜霜双考",
    fantasy: "处决者压最低血，霜塔压节奏，需要保护、抬血和足够输出同时在线。",
    chooseCount: 6,
    rosterIds: ["ironGuard", "oathMedic", "emberAdept", "markHunter", "toxicKnife", "grayPact", "battleDrummer", "lineBreaker", "redLion", "mistAlchemist"],
    enemyTeam: [ENEMIES.mirrorExecutioner, ENEMIES.frostPylon],
    target: { minWinCombos: 10, maxWinShare: 0.7 },
  },
];

function enemy(spec) {
  return {
    ...EMPTY_ENEMY_SLOTS,
    ...spec,
  };
}

function rosterTeam(ids) {
  return ids.map((id) => {
    const unit = ENCOUNTER_ROSTER[id];
    if (!unit) throw new Error(`Unknown encounter roster id: ${id}`);
    return { ...unit };
  });
}

const GAME_ENCOUNTER_DATA = {
  ENCOUNTER_ROSTER,
  ENEMIES,
  ENCOUNTER_LEVELS,
  rosterTeam,
};

if (typeof window !== "undefined") window.GAME_ENCOUNTER_DATA = GAME_ENCOUNTER_DATA;
if (typeof module !== "undefined") module.exports = GAME_ENCOUNTER_DATA;
