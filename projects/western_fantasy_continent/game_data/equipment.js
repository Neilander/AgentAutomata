const EQUIPMENT_SETS = [
  {
    id: "training_set",
    name: "训练者套装",
    tier: 1,
    stats: { hp: 60, attack: 6, defense: 3, attackSpeed: 0.03 },
  },
  {
    id: "iron_guard_set",
    name: "铁卫套装",
    tier: 2,
    stats: { hp: 110, attack: 9, defense: 10, magicResist: 4 },
  },
  {
    id: "hunter_set",
    name: "猎手套装",
    tier: 3,
    stats: { hp: 95, attack: 16, critChance: 0.06, moveSpeed: 8, accuracy: 6 },
  },
  {
    id: "warlock_set",
    name: "术士套装",
    tier: 4,
    stats: { hp: 90, magicPower: 24, magicResist: 8, arcaneDamageAmp: 0.08 },
  },
  {
    id: "ember_set",
    name: "烈焰套装",
    tier: 5,
    stats: { hp: 130, magicPower: 22, fireDamage: 18, fireDamageAmp: 0.12, fireDurationAmp: 0.1 },
  },
  {
    id: "venom_marsh_set",
    name: "毒沼套装",
    tier: 6,
    stats: { hp: 145, defense: 9, poisonDamage: 22, poisonDamageAmp: 0.16, poisonDurationAmp: 0.18 },
  },
  {
    id: "thunder_set",
    name: "雷鸣套装",
    tier: 7,
    stats: { hp: 150, attack: 20, magicPower: 20, lightningDamage: 25, lightningDamageAmp: 0.18, lightningChainChance: 0.1 },
  },
  {
    id: "frost_oath_set",
    name: "冰誓套装",
    tier: 8,
    stats: { hp: 210, defense: 18, magicResist: 16, iceDamage: 26, iceDamageAmp: 0.16, iceSlowAmp: 0.2 },
  },
  {
    id: "dragonforged_set",
    name: "龙铸套装",
    tier: 9,
    stats: { hp: 260, attack: 34, defense: 22, fireDamage: 30, physicalDamageAmp: 0.15, fireDamageAmp: 0.22 },
  },
  {
    id: "astral_set",
    name: "星界套装",
    tier: 10,
    stats: { hp: 300, attack: 28, magicPower: 44, magicResist: 28, arcaneDamageAmp: 0.24, holyDamageAmp: 0.18, critDamage: 0.25 },
  },
];

module.exports = { EQUIPMENT_SETS };

