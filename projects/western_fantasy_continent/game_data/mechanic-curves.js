const MECHANIC_CURVES_VERSION = "mechanic-curves-v1";

const MECHANIC_CURVES = {
  attackSpeed: { label: "Attack speed", cap: 0.75, half: 70, output: "percent" },
  skillHaste: { label: "Skill haste", cap: 0.75, half: 70, output: "percent" },
  effectPower: { label: "Effect power", cap: 1.2, half: 90, output: "percent" },
  effectResist: { label: "Effect resist", cap: 0.5, half: 80, output: "percent" },
  receivedHealing: { label: "Received healing", cap: 0.8, half: 75, output: "percent" },

  healPower: { label: "Heal power", cap: 1.4, half: 80, output: "percent" },
  shieldPower: { label: "Shield power", cap: 1.4, half: 80, output: "percent" },
  dotAmp: { label: "DOT amp", cap: 1.2, half: 90, output: "percent" },
  controlPower: { label: "Control power", cap: 0.7, half: 100, output: "percent" },
  critChance: { label: "Crit chance", cap: 0.45, half: 90, output: "percent" },
  critDamage: { label: "Crit damage", cap: 1.2, half: 80, output: "percent" },
  lifeSteal: { label: "Life steal", cap: 0.35, half: 80, output: "percent" },
  shieldBreak: { label: "Shield break", cap: 0.8, half: 80, output: "percent" },
  armorBreak: { label: "Armor break", cap: 0.8, half: 80, output: "percent" },
  initiative: { label: "Initiative", cap: 0.6, half: 80, output: "percent" },

  fireAmp: { label: "Fire amp", cap: 1.2, half: 90, output: "percent" },
  poisonAmp: { label: "Poison amp", cap: 1.2, half: 90, output: "percent" },
  markPower: { label: "Mark power", cap: 1.0, half: 85, output: "percent" },
  stealthDuration: { label: "Stealth duration", cap: 0.65, half: 100, output: "percent" },
  executeDamage: { label: "Execute damage", cap: 1.0, half: 85, output: "percent" },
  lowHpDamage: { label: "Low HP damage", cap: 1.0, half: 85, output: "percent" },
  lowHpHealingReceived: { label: "Low HP received healing", cap: 1.0, half: 75, output: "percent" },
  counterDamage: { label: "Counter damage", cap: 1.0, half: 85, output: "percent" },
  cleanseEfficiency: { label: "Cleanse efficiency", cap: 0.8, half: 70, output: "percent" },
  auraPower: { label: "Aura power", cap: 1.0, half: 90, output: "percent" },
  shadowAmp: { label: "Shadow amp", cap: 1.0, half: 90, output: "percent" },
  arcaneAmp: { label: "Arcane amp", cap: 1.0, half: 90, output: "percent" },
};

function mechanicCurveValue(id, points) {
  const def = MECHANIC_CURVES[id];
  const value = Math.max(0, Number(points) || 0);
  if (!def || !value) return 0;
  return round((def.cap * value) / (value + def.half), 4);
}

function mechanicCurvePercent(id, points) {
  return round(mechanicCurveValue(id, points) * 100, 2);
}

function hasMechanicCurve(id) {
  return Boolean(MECHANIC_CURVES[id]);
}

function curveSnapshot(id, pointsList = [1, 5, 10, 20, 40, 80, 160]) {
  return pointsList.map((points) => ({
    points,
    value: mechanicCurveValue(id, points),
    percent: mechanicCurvePercent(id, points),
  }));
}

function round(value, digits = 4) {
  return Number((Number(value) || 0).toFixed(digits));
}

const api = {
  MECHANIC_CURVES_VERSION,
  MECHANIC_CURVES,
  mechanicCurveValue,
  mechanicCurvePercent,
  hasMechanicCurve,
  curveSnapshot,
};

if (typeof module !== "undefined" && module.exports) module.exports = api;
if (typeof window !== "undefined") window.GAME_MECHANIC_CURVES = api;
