const fs = require("fs");
const path = require("path");
const SKILL_DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "attribute-build-route-simulation-v2.md");
const SEEDS = 8;
const ATTR_ORDER = ["might", "fortitude", "agility", "arcana", "rhythm", "resilience"];

const ATTRS = {
  might: "武力",
  fortitude: "坚韧",
  agility: "敏捷",
  arcana: "奥术",
  rhythm: "节律",
  resilience: "韧性",
};

const ROLE_ATTRS = {
  warrior: ["might", "fortitude"],
  berserker: ["agility", "might"],
  knight: ["fortitude", "resilience"],
  ranger: ["might", "agility"],
  mage: ["arcana", "rhythm"],
  priest: ["arcana", "resilience"],
  warlock: ["arcana", "rhythm"],
  bard: ["rhythm", "arcana"],
  assassin: ["agility", "might"],
  alchemist: ["rhythm", "arcana"],
};

const MAGIC_ROLES = new Set(["mage", "priest", "warlock", "bard", "alchemist"]);

const EXPERIMENTAL_KITS = {
  berserker: {
    small1: "rendingFury",
    small2: "boneWhirl",
    passive: "rageChain",
    ultimate: "rageRelease",
    note: "实验狂战：去掉不死/吸血兜底，把收益集中到高频普攻窗口。",
  },
  assassin: {
    small1: "shadowBurstAmbush",
    small2: "throatCut",
    passive: "shadowMomentum",
    ultimate: "midnightBloom",
    note: "实验刺客：暗影表现但物理缩放，降低等低血处决收益。",
  },
};

function resolveKit(role, base) {
  const experimental = EXPERIMENTAL_KITS[role];
  if (!experimental) return { kit: base.kit || {}, source: "default" };
  const keys = [experimental.small1, experimental.small2, experimental.passive, experimental.ultimate].filter(Boolean);
  const missing = keys.filter((key) => !SKILL_DATA.skills[key]);
  if (missing.length) return { kit: base.kit || {}, source: `default; missing experimental ${missing.join(", ")}` };
  return { kit: experimental, source: "experimental" };
}

const ATTR_BONUS = {
  might: { physicalPower: 2.35, hp: 3 },
  fortitude: { hp: 14, receivedHealing: 0.012 },
  agility: { attackSpeed: 0.052, effectResist: 0.005 },
  arcana: { magicPower: 2.65, skillHaste: 0.018 },
  rhythm: { skillHaste: 0.055, effectPower: 0.04 },
  resilience: { armor: 0.5, effectResist: 0.012 },
};

function run() {
  const roles = Object.keys(ROLE_ATTRS).filter((role) => SKILL_DATA.roleKits[role]);
  const rows = roles.map((role) => analyzeRole(role, roles));
  fs.writeFileSync(OUT_FILE, renderReport(rows), "utf8");
  console.log(`wrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

function analyzeRole(role, roles) {
  const routes = buildRoutes(role).map((route) => analyzeRoute(role, route, roles));
  routes.sort((a, b) => b.winRate - a.winRate || b.avgDamage - a.avgDamage || b.avgHp - a.avgHp);
  routes.forEach((route, index) => {
    route.rank = index + 1;
  });
  const best = routes[0];
  const viable = routes.filter((route) => route.winRate >= 0.35 && best.winRate - route.winRate <= 0.12);
  const niches = routes.filter((route) => route.prey.length >= 2 && !viable.includes(route));
  const issues = [];
  if (viable.length < 2) issues.push("有效路线少于2条");
  if (viable.length > 5) issues.push("有效路线过多，路线区分可能不明显");
  if (routes.some((route) => route.kind === "wrong" && route.rank <= 2 && route.winRate >= 0.45)) issues.push("红队错属性路线进入前二");
  if (best.kind === "survival" && !["knight", "priest"].includes(role)) issues.push("纯生存路线成为最优，可能压制职业幻想");
  if (best.winRate - routes[routes.length - 1].winRate < 0.18) issues.push("十种路线差距过小");
  return { role, routes, viable, niches, issues };
}

function analyzeRoute(role, route, roles) {
  const own = unitSpec(role, route.points, route.label);
  const opponents = roles.map((opponent) => {
    const enemy = unitSpec(opponent, standardPoints(opponent), "标准7/3");
    let wins = 0;
    let damage = 0;
    let hp = 0;
    for (let seed = 0; seed < SEEDS; seed += 1) {
      const result = simulateTeams([own], [enemy], {
        seed: `attr-v2|${role}|${route.key}|vs|${opponent}|${seed}`,
        randomizeStats: false,
      });
      if (result.winner === "left") wins += 1;
      damage += result.metrics.leftDamage;
      hp += result.leftHp;
    }
    return {
      opponent,
      winRate: wins / SEEDS,
      avgDamage: damage / SEEDS,
      avgHp: hp / SEEDS,
    };
  });
  const winRate = avg(opponents.map((item) => item.winRate));
  const avgDamage = avg(opponents.map((item) => item.avgDamage));
  const avgHp = avg(opponents.map((item) => item.avgHp));
  const prey = opponents.filter((item) => item.winRate >= 0.65).map((item) => item.opponent);
  return { ...route, opponents, winRate, avgDamage, avgHp, prey };
}

function buildRoutes(role) {
  const [main, secondary] = ROLE_ATTRS[role];
  const wrong = MAGIC_ROLES.has(role) ? "might" : "arcana";
  const speed = MAGIC_ROLES.has(role) ? "rhythm" : "agility";
  const candidates = [
    route("main10", "10主", { [main]: 10 }, "expected"),
    route("secondary10", "10副", { [secondary]: 10 }, "expected"),
    route("main7_secondary3", "7主3副", { [main]: 7, [secondary]: 3 }, "expected"),
    route("main5_secondary5", "5主5副", { [main]: 5, [secondary]: 5 }, "expected"),
    route("main3_secondary7", "3主7副", { [main]: 3, [secondary]: 7 }, "expected"),
    route("pure_fortitude", "10坚韧", { fortitude: 10 }, "survival"),
    route("pure_resilience", "10韧性", { resilience: 10 }, "survival"),
    route("pure_speed", `10${ATTRS[speed]}`, { [speed]: 10 }, "speed"),
    route("wrong_output", `10${ATTRS[wrong]}`, { [wrong]: 10 }, "wrong"),
    route("spread", "全分散", { might: 2, fortitude: 2, agility: 2, arcana: 2, rhythm: 1, resilience: 1 }, "redteam"),
  ];
  const seen = new Set();
  const unique = [];
  for (const item of candidates) {
    const key = pointKey(item.points);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(item);
  }
  return unique.map((item, index) => ({ ...item, rankSeed: index }));
}

function route(key, label, points, kind) {
  return { key, label, points: normalizePoints(points), kind };
}

function standardPoints(role) {
  const [main, secondary] = ROLE_ATTRS[role];
  return { [main]: 7, [secondary]: 3 };
}

function unitSpec(role, points, routeLabel) {
  const base = SKILL_DATA.roleKits[role];
  const { kit } = resolveKit(role, base);
  const bonus = buildBonus(points);
  return {
    role,
    name: `${base.name}-${routeLabel}`,
    small1: kit.small1,
    small2: kit.small2,
    passive: kit.passive,
    ultimate: kit.ultimate,
    hp: Math.round(base.hp + bonus.hp),
    power: base.power,
    physicalPower: round(base.power + bonus.physicalPower, 2),
    magicPower: round(base.power + bonus.magicPower, 2),
    attackType: MAGIC_ROLES.has(role) ? "arcane" : "physical",
    armor: round(base.armor + bonus.armor, 2),
    range: base.range,
    attackSpeedMult: round(1 + bonus.attackSpeed, 3),
    skillHasteMult: round(1 + bonus.skillHaste, 3),
    effectPowerMult: round(1 + bonus.effectPower, 3),
    effectResistPct: Math.min(0.5, round(bonus.effectResist, 3)),
    receivedHealingMult: round(1 + bonus.receivedHealing, 3),
  };
}

function buildBonus(points) {
  const bonus = { hp: 0, physicalPower: 0, magicPower: 0, armor: 0, attackSpeed: 0, skillHaste: 0, effectPower: 0, effectResist: 0, receivedHealing: 0 };
  for (const [attr, value] of Object.entries(points)) {
    const row = ATTR_BONUS[attr];
    if (!row || !value) continue;
    bonus.hp += (row.hp || 0) * value;
    bonus.physicalPower += (row.physicalPower || 0) * value;
    bonus.magicPower += (row.magicPower || 0) * value;
    bonus.armor += (row.armor || 0) * value;
    bonus.attackSpeed += (row.attackSpeed || 0) * value;
    bonus.skillHaste += (row.skillHaste || 0) * value;
    bonus.effectPower += (row.effectPower || 0) * value;
    bonus.effectResist += (row.effectResist || 0) * value;
    bonus.receivedHealing += (row.receivedHealing || 0) * value;
  }
  return bonus;
}

function renderReport(rows) {
  const lines = [];
  lines.push("# Attribute System v2 Build Route Simulation");
  lines.push("");
  lines.push("本报告测试 `attribute_system_v2_candidate.md` 的加点路线空间。");
  lines.push("");
  lines.push("重要边界：本次不改职业基础数值。每个角色以现有 `hp / power / armor / skills` 为基底，只额外叠加 10 点大属性。");
  lines.push("");
  lines.push("实验边界：`berserker` 和 `assassin` 使用新增实验技能套装进行验证；旧技能没有删除，也没有替换正式默认套装。");
  lines.push("");
  lines.push("## 测试方法");
  lines.push("");
  lines.push("- 每个职业生成最多 10 种 10 点加点路线：主属性、副属性、主副混点、纯生存、纯速度、错属性红队、全分散。");
  lines.push("- 对手也不是裸数值，而是对应职业的 `7主/3副` 标准路线。");
  lines.push("- 每条路线打所有职业的 1v1，每个对局跑 8 个固定 seed。");
  lines.push("- 有效路线定义：平均胜率不低于 35%，且距离本职业最佳路线不超过 12 个百分点。");
  lines.push("");
  lines.push("## 当前代理换算");
  lines.push("");
  lines.push("| 大属性 | 本次测试换算 |");
  lines.push("| --- | --- |");
  lines.push("| 武力 | 每点 `physicalPower +2.35`，`hp +3` |");
  lines.push("| 坚韧 | 每点 `hp +14`，`receivedHealing +1.2%`，不增幅吸血 |");
  lines.push("| 敏捷 | 每点 `attackSpeed +5.2%`，`effectResist +0.5%` |");
  lines.push("| 奥术 | 每点 `magicPower +2.65`，`skillHaste +1.8%` |");
  lines.push("| 节律 | 每点 `skillHaste +5.5%`，`effectPower +4%` |");
  lines.push("| 韧性 | 每点 `armor +0.5`，`effectResist +1.2%` |");
  lines.push("");
  lines.push("说明：当前正式战斗仍没有完整的物理/法术分离、DOT 增幅、控制强度公式。本次只给模拟器增加了默认不生效的测试字段，用来近似攻速、急速、效果强度、效果抗性。");
  lines.push("");
  lines.push("## 总览");
  lines.push("");
  lines.push("| 职业 | 有效路线数 | 最优路线 | 有效路线 | 问题 |");
  lines.push("| --- | ---: | --- | --- | --- |");
  for (const row of rows) {
    const best = row.routes[0];
    lines.push(`| ${roleName(row.role)} | ${row.viable.length} | ${best.label} ${pct(best.winRate)} | ${row.viable.map((route) => `${route.label} ${pct(route.winRate)}`).join(" / ") || "无"} | ${row.issues.join("；") || "无"} |`);
  }
  lines.push("");
  lines.push("## 分职业详情");
  for (const row of rows) {
    lines.push("");
    lines.push(`### ${roleName(row.role)}`);
    lines.push("");
    lines.push(`主副属性：${ATTRS[ROLE_ATTRS[row.role][0]]} / ${ATTRS[ROLE_ATTRS[row.role][1]]}`);
    lines.push("");
    lines.push("| 排名 | 路线 | 类型 | 平均胜率 | 平均伤害 | 平均剩余HP | 明显优势对手 |");
    lines.push("| ---: | --- | --- | ---: | ---: | ---: | --- |");
    row.routes.forEach((route, index) => {
      lines.push(`| ${index + 1} | ${route.label} | ${kindName(route.kind)} | ${pct(route.winRate)} | ${round(route.avgDamage, 1)} | ${round(route.avgHp, 1)} | ${route.prey.map(roleName).join("、") || "-"} |`);
    });
    if (row.niches.length) {
      lines.push("");
      lines.push(`补充观察：${row.niches.map((route) => `${route.label} 有 ${route.prey.length} 个明显优势对手`).join("；")}。`);
    }
  }
  lines.push("");
  lines.push("## 结论");
  lines.push("");
  const viableCounts = rows.map((row) => row.viable.length);
  lines.push(`- 平均有效路线数：${round(avg(viableCounts), 2)}。`);
  lines.push(`- 有效路线少于 2 条的职业：${rows.filter((row) => row.viable.length < 2).map((row) => roleName(row.role)).join("、") || "无"}。`);
  lines.push(`- 红队错属性进入前二的职业：${rows.filter((row) => row.issues.some((issue) => issue.includes("错属性"))).map((row) => roleName(row.role)).join("、") || "无"}。`);
  lines.push("");
  lines.push("下一步建议：先由用户验收本报告里的有效路线数量是否符合直觉，再决定是否调整各大属性的每点换算。");
  lines.push("");
  return lines.join("\n");
}

function normalizePoints(points) {
  const output = {};
  for (const attr of ATTR_ORDER) output[attr] = points[attr] || 0;
  return output;
}

function pointKey(points) {
  const normalized = normalizePoints(points);
  return ATTR_ORDER.map((attr) => `${attr}:${normalized[attr]}`).join("|");
}

function roleName(role) {
  return SKILL_DATA.roleKits[role]?.name || role;
}

function kindName(kind) {
  return {
    expected: "预设",
    survival: "生存红队",
    speed: "速度红队",
    wrong: "错属性红队",
    redteam: "分散红队",
  }[kind] || kind;
}

function avg(values) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

function round(value, digits = 3) {
  return Number(value.toFixed(digits));
}

if (require.main === module) run();

module.exports = { run, ROLE_ATTRS, ATTRS, ATTR_BONUS, ATTR_ORDER, buildRoutes, unitSpec, standardPoints, pct, round };
