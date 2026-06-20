const DAMAGE_TYPES = [
  "physical",
  "fire",
  "poison",
  "lightning",
  "ice",
  "holy",
  "shadow",
  "arcane",
];

const BASE_STATS = {
  hp: 0,
  attack: 0,
  defense: 0,
  magicPower: 0,
  magicResist: 0,
  attackSpeed: 0,
  critChance: 0,
  critDamage: 0,
  moveSpeed: 0,
  accuracy: 0,
  evasion: 0,
};

const SPECIALIZED_STATS = {
  physicalDamageAmp: 0,
  fireDamage: 0,
  fireDamageAmp: 0,
  fireDurationAmp: 0,
  poisonDamage: 0,
  poisonDamageAmp: 0,
  poisonDurationAmp: 0,
  lightningDamage: 0,
  lightningDamageAmp: 0,
  lightningChainChance: 0,
  iceDamage: 0,
  iceDamageAmp: 0,
  iceSlowAmp: 0,
  holyDamageAmp: 0,
  shadowDamageAmp: 0,
  arcaneDamageAmp: 0,
  dotDamageAmp: 0,
  areaDamageAmp: 0,
  singleTargetDamageAmp: 0,
};

const EMPTY_STATS = {
  ...BASE_STATS,
  ...SPECIALIZED_STATS,
};

function mergeStats(...sources) {
  const result = { ...EMPTY_STATS };
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) {
      result[key] = (result[key] || 0) + value;
    }
  }
  return result;
}

module.exports = {
  DAMAGE_TYPES,
  BASE_STATS,
  SPECIALIZED_STATS,
  EMPTY_STATS,
  mergeStats,
};

