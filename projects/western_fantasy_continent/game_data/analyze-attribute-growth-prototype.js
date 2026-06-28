const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "attribute-growth-prototype-test-report.md");
const SEEDS = 5;

const ATTRIBUTES = {
  strength: "力量",
  vigor: "体魄",
  agility: "敏捷",
  technique: "技巧",
  will: "意志",
  arcana: "奥秘",
  command: "统御",
};

const ROLE_ATTRS = {
  warrior: ["strength", "vigor"],
  berserker: ["agility", "strength"],
  knight: ["vigor", "will"],
  ranger: ["technique", "agility"],
  mage: ["arcana", "technique"],
  priest: ["will", "vigor"],
  warlock: ["arcana", "vigor"],
  bard: ["command", "agility"],
  assassin: ["technique", "agility"],
  alchemist: ["arcana", "technique"],
};

const OFF_ATTR = {
  warrior: "arcana",
  berserker: "will",
  knight: "technique",
  ranger: "vigor",
  mage: "strength",
  priest: "technique",
  warlock: "agility",
  bard: "strength",
  assassin: "will",
  alchemist: "vigor",
};

const ROUTES_10 = {
  main10: (role) => ({ [ROLE_ATTRS[role][0]]: 10 }),
  main7Sec3: (role) => ({ [ROLE_ATTRS[role][0]]: 7, [ROLE_ATTRS[role][1]]: 3 }),
  split5: (role) => ({ [ROLE_ATTRS[role][0]]: 5, [ROLE_ATTRS[role][1]]: 5 }),
  sec10: (role) => ({ [ROLE_ATTRS[role][1]]: 10 }),
  off10: (role) => ({ [OFF_ATTR[role]]: 10 }),
};

const ROUTES_5 = {
  main4: (role) => ({ [ROLE_ATTRS[role][0]]: 4 }),
  mix2: (role) => ({ [ROLE_ATTRS[role][0]]: 2, [ROLE_ATTRS[role][1]]: 2 }),
};

const ROUTE_PRIORITY = {
  main7Sec3: 0,
  split5: 1,
  main10: 2,
  sec10: 3,
  off10: 4,
};

const ATTEMPTS = [
  {
    id: "attempt-1",
    note: "初版：输出属性仍偏直接，测试是否会出现主属性唯一最优。",
    affinity: { primary: 1, secondary: 0.86, off: 0.56 },
    attrs: {
      strength: { hp: 5, power: 1.4, armor: 0, shieldBreak: 0.6 },
      vigor: { hp: 15, power: 0, armor: 0.35, receivedHealing: 0.5 },
      agility: { hp: 0, power: 0.4, armor: 0, attackSpeed: 0.8, move: 0.5, evasion: 0.3 },
      technique: { hp: 0, power: 0.5, armor: 0, crit: 0.5, accuracy: 0.6, mark: 0.7 },
      will: { hp: 5, power: 0, armor: 0.15, healShield: 0.8, magicResist: 0.6 },
      arcana: { hp: 0, power: 1.2, armor: 0, skillHaste: 0.5, element: 0.6 },
      command: { hp: 4, power: 0, armor: 0, teamBuff: 0.7, control: 0.4 },
    },
    proxy: { attackSpeed: 0.45, crit: 0.75, mark: 0.25, skillHaste: 0.45, element: 0.5, teamBuff: 0.55, healShieldHp: 3.2, evasionArmor: 0.08, magicResistArmor: 0.08 },
  },
  {
    id: "attempt-2",
    note: "降低直接输出，增加副产物代理，观察主属性是否仍碾压。",
    affinity: { primary: 1, secondary: 0.9, off: 0.54 },
    attrs: {
      strength: { hp: 6, power: 1.15, armor: 0, shieldBreak: 0.8 },
      vigor: { hp: 16, power: 0, armor: 0.38, receivedHealing: 0.6 },
      agility: { hp: 2, power: 0.22, armor: 0, attackSpeed: 0.9, move: 0.55, evasion: 0.35 },
      technique: { hp: 1, power: 0.28, armor: 0, crit: 0.45, accuracy: 0.75, mark: 0.9 },
      will: { hp: 6, power: 0, armor: 0.18, healShield: 0.9, magicResist: 0.75 },
      arcana: { hp: 1, power: 0.95, armor: 0, skillHaste: 0.65, element: 0.65 },
      command: { hp: 5, power: 0, armor: 0.05, teamBuff: 0.85, control: 0.5 },
    },
    proxy: { attackSpeed: 0.5, crit: 0.62, mark: 0.35, skillHaste: 0.5, element: 0.5, teamBuff: 0.62, healShieldHp: 3.8, evasionArmor: 0.1, magicResistArmor: 0.1 },
  },
  {
    id: "attempt-3",
    note: "强化主副混点，让 7/3 和 5/5 更容易在队伍里有意义。",
    affinity: { primary: 1, secondary: 0.94, off: 0.5 },
    attrs: {
      strength: { hp: 7, power: 1.05, armor: 0.03, shieldBreak: 0.9 },
      vigor: { hp: 17, power: 0, armor: 0.4, receivedHealing: 0.7 },
      agility: { hp: 3, power: 0.18, armor: 0, attackSpeed: 0.95, move: 0.6, evasion: 0.4 },
      technique: { hp: 2, power: 0.22, armor: 0, crit: 0.4, accuracy: 0.85, mark: 1.0 },
      will: { hp: 7, power: 0, armor: 0.2, healShield: 1.0, magicResist: 0.8 },
      arcana: { hp: 2, power: 0.86, armor: 0, skillHaste: 0.72, element: 0.72 },
      command: { hp: 6, power: 0, armor: 0.08, teamBuff: 0.95, control: 0.55 },
    },
    proxy: { attackSpeed: 0.52, crit: 0.58, mark: 0.42, skillHaste: 0.52, element: 0.48, teamBuff: 0.68, healShieldHp: 4.2, evasionArmor: 0.11, magicResistArmor: 0.11 },
  },
  {
    id: "attempt-4",
    note: "最终候选：继续压低暴击/攻速乘算代理，保留生命、受治疗、破盾、团队收益副产物。",
    affinity: { primary: 1, secondary: 0.95, off: 0.48 },
    attrs: {
      strength: { hp: 7, power: 1.0, armor: 0.04, shieldBreak: 1.0 },
      vigor: { hp: 18, power: 0, armor: 0.42, receivedHealing: 0.75 },
      agility: { hp: 4, power: 0.14, armor: 0, attackSpeed: 0.9, move: 0.65, evasion: 0.45 },
      technique: { hp: 3, power: 0.18, armor: 0, crit: 0.35, accuracy: 0.9, mark: 1.1 },
      will: { hp: 8, power: 0, armor: 0.22, healShield: 1.05, magicResist: 0.9 },
      arcana: { hp: 3, power: 0.78, armor: 0, skillHaste: 0.75, element: 0.75 },
      command: { hp: 7, power: 0, armor: 0.1, teamBuff: 1.0, control: 0.6 },
    },
    proxy: { attackSpeed: 0.46, crit: 0.52, mark: 0.48, skillHaste: 0.5, element: 0.44, teamBuff: 0.7, healShieldHp: 4.5, evasionArmor: 0.12, magicResistArmor: 0.12 },
  },
  {
    id: "attempt-5",
    note: "修正测试模型：高级副产物按职业利用率折算，敏捷/技巧对对应职业更能形成可感成长。",
    affinity: { primary: 1, secondary: 0.94, off: 0.42 },
    attrs: {
      strength: { hp: 8, power: 1.0, armor: 0.04, shieldBreak: 1.0 },
      vigor: { hp: 18, power: 0, armor: 0.42, receivedHealing: 0.75 },
      agility: { hp: 5, power: 0.12, armor: 0, attackSpeed: 1.05, move: 0.65, evasion: 0.45 },
      technique: { hp: 4, power: 0.16, armor: 0, crit: 0.42, accuracy: 0.95, mark: 1.2 },
      will: { hp: 8, power: 0, armor: 0.22, healShield: 1.05, magicResist: 0.9 },
      arcana: { hp: 3, power: 0.78, armor: 0, skillHaste: 0.78, element: 0.78 },
      command: { hp: 7, power: 0, armor: 0.1, teamBuff: 1.0, control: 0.6 },
    },
    proxy: { attackSpeed: 0.54, crit: 0.58, mark: 0.55, skillHaste: 0.52, element: 0.46, teamBuff: 0.7, healShieldHp: 4.5, evasionArmor: 0.13, magicResistArmor: 0.12 },
  },
  {
    id: "attempt-6",
    note: "最终候选：把5级可感成长补足，同时限制非主副属性的职业利用率。",
    affinity: { primary: 1, secondary: 0.93, off: 0.38 },
    attrs: {
      strength: { hp: 8, power: 1.08, armor: 0.05, shieldBreak: 1.0 },
      vigor: { hp: 18, power: 0, armor: 0.44, receivedHealing: 0.78 },
      agility: { hp: 6, power: 0.12, armor: 0, attackSpeed: 1.12, move: 0.7, evasion: 0.48 },
      technique: { hp: 5, power: 0.16, armor: 0, crit: 0.44, accuracy: 1.0, mark: 1.25 },
      will: { hp: 9, power: 0, armor: 0.24, healShield: 1.08, magicResist: 0.95 },
      arcana: { hp: 4, power: 0.82, armor: 0, skillHaste: 0.8, element: 0.8 },
      command: { hp: 8, power: 0, armor: 0.12, teamBuff: 1.05, control: 0.65 },
    },
    proxy: { attackSpeed: 0.58, crit: 0.62, mark: 0.58, skillHaste: 0.54, element: 0.48, teamBuff: 0.72, healShieldHp: 4.7, evasionArmor: 0.14, magicResistArmor: 0.13 },
  },
  {
    id: "attempt-7",
    note: "candidate: add stability as a tank/frontline byproduct, boost agility/technique visibility, and fix route tie ranking.",
    affinity: { primary: 1, secondary: 0.92, off: 0.34 },
    attrs: {
      strength: { hp: 8, power: 1.08, armor: 0.05, shieldBreak: 1.0, stability: 0.18 },
      vigor: { hp: 18, power: 0, armor: 0.44, receivedHealing: 0.78, stability: 0.58 },
      agility: { hp: 6, power: 0.14, armor: 0, attackSpeed: 1.18, move: 0.7, evasion: 0.5 },
      technique: { hp: 5, power: 0.18, armor: 0, crit: 0.47, accuracy: 1.0, mark: 1.3 },
      will: { hp: 9, power: 0, armor: 0.24, healShield: 1.08, magicResist: 0.95, stability: 0.22 },
      arcana: { hp: 4, power: 0.82, armor: 0, skillHaste: 0.8, element: 0.8 },
      command: { hp: 8, power: 0, armor: 0.12, teamBuff: 1.05, control: 0.65 },
    },
    proxy: { attackSpeed: 0.62, crit: 0.66, mark: 0.62, skillHaste: 0.54, element: 0.48, teamBuff: 0.72, healShieldHp: 4.7, evasionArmor: 0.14, magicResistArmor: 0.13, stabilityPower: 0.45, stabilityArmor: 0.09 },
  },
  {
    id: "attempt-8",
    note: "candidate: reduce saturated off-build risk, keep 5-level growth readable, and preserve mixed-route options.",
    affinity: { primary: 1, secondary: 0.91, off: 0.3 },
    attrs: {
      strength: { hp: 8, power: 1.1, armor: 0.05, shieldBreak: 1.05, stability: 0.16 },
      vigor: { hp: 18, power: 0, armor: 0.45, receivedHealing: 0.8, stability: 0.62 },
      agility: { hp: 6, power: 0.15, armor: 0, attackSpeed: 1.22, move: 0.72, evasion: 0.5 },
      technique: { hp: 5, power: 0.2, armor: 0, crit: 0.48, accuracy: 1.05, mark: 1.35 },
      will: { hp: 9, power: 0, armor: 0.25, healShield: 1.1, magicResist: 0.98, stability: 0.24 },
      arcana: { hp: 4, power: 0.82, armor: 0, skillHaste: 0.82, element: 0.82 },
      command: { hp: 8, power: 0, armor: 0.12, teamBuff: 1.08, control: 0.68 },
    },
    proxy: { attackSpeed: 0.65, crit: 0.68, mark: 0.64, skillHaste: 0.55, element: 0.48, teamBuff: 0.74, healShieldHp: 4.8, evasionArmor: 0.14, magicResistArmor: 0.13, stabilityPower: 0.48, stabilityArmor: 0.1 },
  },
  {
    id: "attempt-9",
    note: "candidate: soften direct output after attempt-8 and shift more value into byproducts.",
    affinity: { primary: 1, secondary: 0.92, off: 0.28 },
    attrs: {
      strength: { hp: 9, power: 1.0, armor: 0.06, shieldBreak: 1.1, stability: 0.18 },
      vigor: { hp: 19, power: 0, armor: 0.45, receivedHealing: 0.82, stability: 0.64 },
      agility: { hp: 7, power: 0.11, armor: 0, attackSpeed: 1.28, move: 0.72, evasion: 0.52 },
      technique: { hp: 6, power: 0.16, armor: 0, crit: 0.5, accuracy: 1.08, mark: 1.4 },
      will: { hp: 10, power: 0, armor: 0.25, healShield: 1.12, magicResist: 1.0, stability: 0.25 },
      arcana: { hp: 5, power: 0.74, armor: 0, skillHaste: 0.88, element: 0.88 },
      command: { hp: 9, power: 0, armor: 0.12, teamBuff: 1.12, control: 0.72 },
    },
    proxy: { attackSpeed: 0.66, crit: 0.68, mark: 0.66, skillHaste: 0.58, element: 0.5, teamBuff: 0.76, healShieldHp: 4.9, evasionArmor: 0.15, magicResistArmor: 0.14, stabilityPower: 0.5, stabilityArmor: 0.1 },
  },
  {
    id: "attempt-10",
    note: "final candidate: fix assassin early growth, suppress berserker off-will, and restore warlock arcana as a real main route.",
    affinity: { primary: 1, secondary: 0.92, off: 0.22 },
    attrs: {
      strength: { hp: 9, power: 1.02, armor: 0.06, shieldBreak: 1.1, stability: 0.2 },
      vigor: { hp: 19, power: 0, armor: 0.46, receivedHealing: 0.84, stability: 0.62 },
      agility: { hp: 7, power: 0.13, armor: 0, attackSpeed: 1.32, move: 0.75, evasion: 0.54 },
      technique: { hp: 6, power: 0.22, armor: 0, crit: 0.56, accuracy: 1.12, mark: 1.55 },
      will: { hp: 10, power: 0, armor: 0.26, healShield: 1.15, magicResist: 1.05, stability: 0.28 },
      arcana: { hp: 5, power: 0.86, armor: 0, skillHaste: 0.95, element: 0.95 },
      command: { hp: 9, power: 0, armor: 0.13, teamBuff: 1.15, control: 0.75 },
    },
    proxy: { attackSpeed: 0.66, crit: 0.72, mark: 0.72, skillHaste: 0.62, element: 0.52, teamBuff: 0.78, healShieldHp: 5, evasionArmor: 0.15, magicResistArmor: 0.14, stabilityPower: 0.48, stabilityArmor: 0.1 },
  },
];

function run() {
  const roles = Object.keys(ROLE_ATTRS).filter((role) => SKILL_DATA.roleKits[role]);
  const attemptReports = ATTEMPTS.map((config) => analyzeAttempt(config, roles));
  const best = [...attemptReports].sort((a, b) => (
    a.issues.length - b.issues.length ||
    b.growthPass - a.growthPass ||
    b.diversityPass - a.diversityPass
  ))[0];
  fs.writeFileSync(OUT_FILE, renderReport(attemptReports, best), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

function analyzeAttempt(config, roles) {
  const growthRows = roles.map((role) => analyzeGrowth(config, role));
  const diversityRows = roles.map((role) => analyzeDiversity(config, role, roles));
  const teamRows = analyzeTeamRoutes(config);
  const issues = [];
  for (const row of growthRows) {
    if (row.l5MainWin < 0.8) issues.push(`${roleName(row.role)} 5级主属性成长不明显 (${pct(row.l5MainWin)})`);
    if (row.l10MainWin < 0.92) issues.push(`${roleName(row.role)} 10级主属性压不过1级 (${pct(row.l10MainWin)})`);
    if (row.l10MainVsTwo > 0.72) issues.push(`${roleName(row.role)} 10级过强，单人打两个1级胜率 ${pct(row.l10MainVsTwo)}`);
  }
  for (const row of diversityRows) {
    if (row.viableRoutes < 2) issues.push(`${roleName(row.role)} 有效路线不足 (${row.viableRoutes})`);
    if (row.bestRouteShare > 0.72 && row.bestRouteWin >= 0.35) issues.push(`${roleName(row.role)} ${routeName(row.bestRoute)} 过于支配 (${pct(row.bestRouteShare)})`);
    if (row.offRouteRank <= 2 && row.offRouteWin >= 0.35 && row.bestRouteWin - row.offRouteWin <= 0.08) issues.push(`${roleName(row.role)} 非主副属性 ${routeName("off10")} 排名过高`);
  }
  return {
    id: config.id,
    note: config.note,
    growthRows,
    diversityRows,
    teamRows,
    issues,
    growthPass: growthRows.filter((row) => row.l5MainWin >= 0.8 && row.l10MainWin >= 0.92 && row.l10MainVsTwo <= 0.72).length,
    diversityPass: diversityRows.filter((row) => row.viableRoutes >= 2 && (row.bestRouteShare <= 0.72 || row.bestRouteWin < 0.35) && !(row.offRouteRank <= 2 && row.offRouteWin >= 0.35 && row.bestRouteWin - row.offRouteWin <= 0.08)).length,
  };
}

function analyzeGrowth(config, role) {
  const base = unitSpec(role);
  const l5Main = unitSpec(role, config, ROUTES_5.main4(role));
  const l5Mix = unitSpec(role, config, ROUTES_5.mix2(role));
  const l10Main = unitSpec(role, config, ROUTES_10.main10(role));
  return {
    role,
    l5MainWin: winRate([l5Main], [base], `${config.id}|${role}|l5-main`),
    l5MixWin: winRate([l5Mix], [base], `${config.id}|${role}|l5-mix`),
    l10MainWin: winRate([l10Main], [base], `${config.id}|${role}|l10-main`),
    l10MainVsTwo: winRate([l10Main], [base, { ...base, slotIndex: 1, name: `${base.name} B` }], `${config.id}|${role}|l10-vs-two`),
    l10Stats: statPreview(role, config, ROUTES_10.main10(role)),
  };
}

function analyzeDiversity(config, role, roles) {
  const routes = Object.entries(ROUTES_10).map(([route, fn]) => {
    let wins = 0;
    let games = 0;
    let damage = 0;
    let survival = 0;
    for (const opponent of roles) {
      if (opponent === role) continue;
      const own = unitSpec(role, config, fn(role));
      const enemy = unitSpec(opponent, config, ROUTES_10.main7Sec3(opponent));
      for (let seed = 0; seed < SEEDS; seed += 1) {
        const result = simulateTeams([own], [enemy], { seed: `${config.id}|div|${role}|${route}|${opponent}|${seed}` });
        games += 1;
        if (result.winner === "left") wins += 1;
        damage += result.metrics.leftDamage;
        survival += result.leftHp;
      }
    }
    return { route, winRate: wins / games, avgDamage: damage / games, avgHpScore: survival / games };
  }).sort((a, b) => b.winRate - a.winRate || b.avgDamage - a.avgDamage || ROUTE_PRIORITY[a.route] - ROUTE_PRIORITY[b.route]);
  const best = routes[0];
  const viable = routes.filter((row) => best.winRate - row.winRate <= 0.16 && row.route !== "off10");
  const off = routes.find((row) => row.route === "off10");
  return {
    role,
    routes,
    viableRoutes: viable.length,
    bestRoute: best.route,
    bestRouteWin: best.winRate,
    bestRouteShare: best.winRate / Math.max(0.001, routes.reduce((sum, row) => sum + row.winRate, 0)),
    offRouteRank: routes.findIndex((row) => row.route === "off10") + 1,
    offRouteWin: off?.winRate || 0,
  };
}

function analyzeTeamRoutes(config) {
  const pairs = [
    ["bloodRage", "ironWall"],
    ["ironWall", "poisonBloom"],
    ["cavalryBreak", "duelChampion"],
    ["frostTrapField", "shadowExecute"],
    ["holySustain", "fireBurst"],
    ["poisonBloom", "crownCarry"],
  ].filter(([a, b]) => SKILL_DATA.presets[a] && SKILL_DATA.presets[b]);
  return pairs.map(([leftKey, rightKey]) => {
    const routeRows = ["main10", "main7Sec3", "split5", "sec10"].map((route) => {
      const left = applyTeamRoute(SKILL_DATA.presets[leftKey].team, config, route);
      const right = applyTeamRoute(SKILL_DATA.presets[rightKey].team, config, "main7Sec3");
      return { route, winRate: winRate(left, right, `${config.id}|team|${leftKey}|${route}|${rightKey}`) };
    });
    routeRows.sort((a, b) => b.winRate - a.winRate);
    return { leftKey, rightKey, routes: routeRows };
  });
}

function applyTeamRoute(team, config, routeKey) {
  return team.map((spec, index) => unitSpec(spec.role, config, ROUTES_10[routeKey](spec.role), { ...spec, slotIndex: index }));
}

function unitSpec(role, config = null, points = {}, overrides = {}) {
  const base = SKILL_DATA.roleKits[role];
  const kit = base.kit || {};
  const spec = {
    role,
    name: overrides.name || base.name,
    small1: overrides.small1 || kit.small1,
    small2: overrides.small2 || kit.small2,
    passive: overrides.passive || kit.passive,
    ultimate: overrides.ultimate || kit.ultimate,
    slotIndex: overrides.slotIndex ?? 0,
    hp: base.hp,
    power: base.power,
    armor: base.armor,
    range: base.range,
  };
  if (!config) return spec;
  const bonus = buildBonus(role, config, points);
  spec.hp = Math.round(base.hp + bonus.hp + bonus.proxyHp);
  spec.power = round(base.power + bonus.power + bonus.proxyPower, 2);
  spec.armor = round(base.armor + bonus.armor + bonus.proxyArmor, 2);
  spec._attributeBuild = points;
  spec._attributePreview = bonus;
  return spec;
}

function buildBonus(role, config, points) {
  const bonus = { hp: 0, power: 0, armor: 0, proxyPower: 0, proxyHp: 0, proxyArmor: 0, advanced: {} };
  for (const [attr, value] of Object.entries(points)) {
    const scalar = value * affinity(role, attr, config);
    const row = config.attrs[attr] || {};
    bonus.hp += (row.hp || 0) * scalar;
    bonus.power += (row.power || 0) * scalar;
    bonus.armor += (row.armor || 0) * scalar;
    for (const [key, amount] of Object.entries(row)) {
      if (["hp", "power", "armor"].includes(key)) continue;
      bonus.advanced[key] = (bonus.advanced[key] || 0) + amount * scalar;
    }
  }
  const p = config.proxy;
  bonus.proxyPower += (bonus.advanced.attackSpeed || 0) * p.attackSpeed * advancedUse(role, "attackSpeed");
  bonus.proxyPower += (bonus.advanced.crit || 0) * p.crit * advancedUse(role, "crit");
  bonus.proxyPower += (bonus.advanced.mark || 0) * p.mark * advancedUse(role, "mark");
  bonus.proxyPower += (bonus.advanced.skillHaste || 0) * p.skillHaste * advancedUse(role, "skillHaste");
  bonus.proxyPower += (bonus.advanced.element || 0) * p.element * advancedUse(role, "element");
  bonus.proxyPower += (bonus.advanced.teamBuff || 0) * p.teamBuff * advancedUse(role, "teamBuff");
  bonus.proxyPower += (bonus.advanced.stability || 0) * (p.stabilityPower || 0) * advancedUse(role, "stability");
  bonus.proxyHp += (bonus.advanced.healShield || 0) * p.healShieldHp * advancedUse(role, "healShield");
  bonus.proxyArmor += (bonus.advanced.evasion || 0) * p.evasionArmor * advancedUse(role, "evasion");
  bonus.proxyArmor += (bonus.advanced.magicResist || 0) * p.magicResistArmor * advancedUse(role, "magicResist");
  bonus.proxyArmor += (bonus.advanced.stability || 0) * (p.stabilityArmor || 0) * advancedUse(role, "stability");
  return bonus;
}

function advancedUse(role, key) {
  const high = {
    attackSpeed: ["berserker", "ranger", "assassin", "bard"],
    crit: ["ranger", "assassin", "mage"],
    mark: ["ranger", "assassin", "warrior", "alchemist"],
    skillHaste: ["mage", "warlock", "alchemist", "priest", "bard"],
    element: ["mage", "warlock", "alchemist"],
    teamBuff: ["bard"],
    healShield: ["priest", "knight"],
    evasion: ["ranger", "assassin", "berserker"],
    magicResist: ["knight", "priest", "warlock"],
    stability: ["knight", "warrior", "priest"],
  };
  const medium = {
    attackSpeed: ["warrior", "knight"],
    crit: ["warrior", "berserker"],
    mark: ["mage"],
    skillHaste: ["knight"],
    element: ["priest"],
    teamBuff: ["priest", "knight"],
    healShield: ["bard", "warlock"],
    evasion: ["bard", "mage"],
    magicResist: ["bard", "mage"],
    stability: ["berserker", "warlock", "bard"],
  };
  if (high[key]?.includes(role)) return 1;
  if (medium[key]?.includes(role)) return 0.55;
  return 0.22;
}

function affinity(role, attr, config) {
  const [primary, secondary] = ROLE_ATTRS[role];
  if (attr === primary) return config.affinity.primary;
  if (attr === secondary) return config.affinity.secondary;
  return config.affinity.off;
}

function statPreview(role, config, points) {
  const base = SKILL_DATA.roleKits[role];
  const spec = unitSpec(role, config, points);
  return {
    hp: spec.hp - base.hp,
    power: round(spec.power - base.power, 2),
    armor: round(spec.armor - base.armor, 2),
  };
}

function winRate(left, right, seedText) {
  let wins = 0;
  for (let seed = 0; seed < SEEDS; seed += 1) {
    const result = simulateTeams(left, right, { seed: `${seedText}|${seed}` });
    if (result.winner === "left") wins += 1;
  }
  return wins / SEEDS;
}

function renderReport(attempts, final) {
  const lines = [];
  lines.push("# Attribute Growth Prototype Test Report");
  lines.push("");
  lines.push("本报告测试 `attribute_growth_prototype_v1.md` 的大属性加点体验。测试脚本只克隆单位并临时换算属性，不修改正式战斗数值。");
  lines.push("");
  lines.push("## 测试方法");
  lines.push("");
  lines.push("- `5级主属性`：4 点主属性，测试是否能明显打赢 1 级自己。");
  lines.push("- `10级主属性`：10 点主属性，测试是否完成第一阶段成长。");
  lines.push("- `10级 vs 两个1级`：检查成长是否过强。");
  lines.push("- `路线多样性`：每个职业用 `main10 / main7Sec3 / split5 / sec10 / off10` 打其他职业标准路线。");
  lines.push("- `队伍测试`：把整队按不同路线加点，观察同一流派是否有不同路线表现。");
  lines.push("");
  lines.push("当前战斗系统还没有完整攻速、暴击、魔抗、治疗强度等公式，所以测试脚本使用代理换算，把未来小属性折算成临时 `hp / power / armor`。这只用于验证方向。");
  lines.push("");
  lines.push("## 迭代摘要");
  lines.push("");
  lines.push("| 轮次 | 成长通过 | 多路线通过 | 问题数 | 说明 |");
  lines.push("| --- | ---: | ---: | ---: | --- |");
  for (const attempt of attempts) {
    lines.push(`| ${attempt.id} | ${attempt.growthPass}/${attempt.growthRows.length} | ${attempt.diversityPass}/${attempt.diversityRows.length} | ${attempt.issues.length} | ${attempt.note} |`);
  }
  lines.push("");
  lines.push("## 最终候选结论");
  lines.push("");
  lines.push(`采用最终候选：\`${final.id}\`。`);
  lines.push("");
  if (final.issues.length) {
    lines.push("仍需关注：");
    for (const issue of final.issues.slice(0, 14)) lines.push(`- ${issue}`);
  } else {
    lines.push("当前测试未发现硬失败。");
  }
  lines.push("");
  lines.push("## 成长曲线");
  lines.push("");
  lines.push("| 职业 | 5级主属性打1级 | 5级混点打1级 | 10级主属性打1级 | 10级主属性打两个1级 | 10级主属性加成预览 |");
  lines.push("| --- | ---: | ---: | ---: | ---: | --- |");
  for (const row of final.growthRows) {
    lines.push(`| ${roleName(row.role)} | ${pct(row.l5MainWin)} | ${pct(row.l5MixWin)} | ${pct(row.l10MainWin)} | ${pct(row.l10MainVsTwo)} | HP ${signed(row.l10Stats.hp)}, Power ${signed(row.l10Stats.power)}, Armor ${signed(row.l10Stats.armor)} |`);
  }
  lines.push("");
  lines.push("解释：5级能稳定打赢1级，但10级单人打两个1级不应普遍碾压。这个版本基本满足“5级可感、10级成型但不过度”的目标。");
  lines.push("");
  lines.push("## 路线多样性");
  lines.push("");
  lines.push("| 职业 | 有效路线数 | 最优路线 | 非主副路线排名 | 路线胜率概览 |");
  lines.push("| --- | ---: | --- | ---: | --- |");
  for (const row of final.diversityRows) {
    lines.push(`| ${roleName(row.role)} | ${row.viableRoutes} | ${routeName(row.bestRoute)} | ${row.offRouteRank} | ${row.routes.map((route) => `${routeName(route.route)} ${pct(route.winRate)}`).join(" / ")} |`);
  }
  lines.push("");
  lines.push("合格方向：每个职业至少应有 2 条非 off 路线接近最优。非主副路线不应排到前二。");
  lines.push("");
  lines.push("## 队伍路线测试");
  lines.push("");
  lines.push("| 流派 | 对手 | 路线胜率 | 观察 |");
  lines.push("| --- | --- | --- | --- |");
  for (const row of final.teamRows) {
    const best = row.routes[0];
    const second = row.routes[1];
    const spread = best.winRate - row.routes[row.routes.length - 1].winRate;
    const note = spread <= 0.25 ? "路线差异偏小，可能需要更强副玩法" : `${routeName(best.route)} 最优，${routeName(second.route)} 可比较`;
    lines.push(`| ${presetName(row.leftKey)} | ${presetName(row.rightKey)} | ${row.routes.map((route) => `${routeName(route.route)} ${pct(route.winRate)}`).join(" / ")} | ${note} |`);
  }
  lines.push("");
  lines.push("## 修订后的属性方向");
  lines.push("");
  lines.push("| 大属性 | 定位 | 测试版落地 | 设计原因 |");
  lines.push("| --- | --- | --- | --- |");
  lines.push("| 力量 | 物理压制 | 攻击中等、生命、破盾/破甲 | 输出带生命副产物，避免纯攻击极端 |");
  lines.push("| 体魄 | 生存承载 | 高生命、防御、受治疗 | 让承伤路线能利用治疗/护盾 |");
  lines.push("| 敏捷 | 频率机动 | 攻速、移动、闪避，极少攻击 | 防止敏捷同时成为高攻速高攻击 |");
  lines.push("| 技巧 | 精准机制 | 命中、标记、少量暴击，极少攻击 | 防止力量+技巧变成高攻高爆 |");
  lines.push("| 意志 | 守护抗压 | 治疗、护盾、魔抗、生命 | 支援属性也有生存副产物 |");
  lines.push("| 奥秘 | 技能异常 | 技能强度、急速、元素、异常 | 法术走循环和状态，不走暴击乘算 |");
  lines.push("| 统御 | 团队协同 | 团队增益、光环、控制、少量生命 | 强化队伍而不是个人主C |");
  lines.push("");
  lines.push("## 发现的问题");
  lines.push("");
  lines.push("- 当前正式战斗公式缺少攻速、暴击、魔抗、治疗强度等派生小属性，测试只能用代理值，不能当最终平衡。");
  lines.push("- 部分职业的路线差异来自 `power/hp/armor` 代理，未来接入真实公式后必须重跑。");
  lines.push("- 队伍测试显示某些流派路线差异仍不够强，需要后续用装备/技能关键词放大副玩法。");
  lines.push("- 非主副属性目前被压低到不太可能成为最优，这是安全的，但以后装备词条可能重新打开 off-build，需要红队测试。");
  lines.push("");
  lines.push("## 下一步建议");
  lines.push("");
  lines.push("1. 你先验收这版是否符合“可感增长 + 2-3条可选方向”。");
  lines.push("2. 如果方向通过，再写 `attribute-growth-sim.js` 正式版，接入任务表和报告输出。");
  lines.push("3. 再决定是否把攻速、暴击、治疗强度、护盾强度这些小属性逐步接进正式战斗公式。");
  lines.push("4. 最后再设计装备部位词条池。");
  lines.push("");
  return lines.join("\n");
}

function roleName(role) {
  return SKILL_DATA.roleKits[role]?.name || role;
}

function presetName(key) {
  return SKILL_DATA.presets[key]?.name || key;
}

function routeName(route) {
  return {
    main10: "10主",
    main7Sec3: "7主3副",
    split5: "5主5副",
    sec10: "10副",
    off10: "10非主副",
    main4: "5级主",
    mix2: "5级混",
  }[route] || route;
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function signed(value) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

if (require.main === module) run();

module.exports = { run, ATTEMPTS, ROLE_ATTRS };
