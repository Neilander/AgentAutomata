const fs = require("fs");
const path = require("path");
const vm = require("vm");
const DATA = require("./skill-data");
const { simulateTeams } = require("./combat-sim");

const ROOT = path.resolve(__dirname, "..");
const GUIDE_PATH = path.join(ROOT, "tutorial_guide_v3", "tutorial-guide.js");
const REPORT_PATH = path.join(ROOT, "design", "balance", "tutorial-guide-v3-report.md");

const SLOT_LAYOUTS = {
  frontBack: [
    { slotIndex: 0, lane: "front" },
    { slotIndex: 2, lane: "back" },
  ],
  frontPair: [
    { slotIndex: 0, lane: "front" },
    { slotIndex: 1, lane: "front" },
  ],
  frontOneBackTwo: [
    { slotIndex: 0, lane: "front" },
    { slotIndex: 2, lane: "back" },
    { slotIndex: 3, lane: "back" },
  ],
  frontTwoBackOne: [
    { slotIndex: 0, lane: "front" },
    { slotIndex: 1, lane: "front" },
    { slotIndex: 2, lane: "back" },
  ],
  full: [
    { slotIndex: 0, lane: "front" },
    { slotIndex: 1, lane: "front" },
    { slotIndex: 2, lane: "back" },
    { slotIndex: 3, lane: "back" },
  ],
};

const FRONT_ROLES = new Set(["knight", "warrior", "berserker"]);
const SOFT_FRONT_ROLES = new Set(["warlock", "priest"]);
const BACK_ROLES = new Set(["mage", "ranger", "bard", "priest", "warlock", "alchemist"]);

function readLevels() {
  const source = fs.readFileSync(GUIDE_PATH, "utf8");
  const match = source.match(/const LEVELS = (\[[\s\S]*?\]);\s*const state = /);
  if (!match) throw new Error("Cannot find LEVELS in tutorial-guide.js");
  const context = {};
  vm.createContext(context);
  vm.runInContext(`levels = ${match[1]}`, context);
  return context.levels;
}

function unitSpec(entry, id, slotIndex) {
  const role = typeof entry === "string" ? entry : entry.role;
  const tuning = typeof entry === "string" ? {} : entry;
  const kit = DATA.roleKits[role];
  if (!kit) throw new Error(`Unknown role: ${role}`);
  return {
    id,
    slotIndex,
    role,
    roleName: kit.role,
    name: kit.name,
    hp: Math.round(kit.hp * (tuning.hpMult ?? 1) + (tuning.hpAdd ?? 0)),
    power: Math.round(kit.power * (tuning.powerMult ?? 1) + (tuning.powerAdd ?? 0)),
    armor: Math.round(kit.armor + (tuning.armorAdd ?? 0)),
    range: kit.range,
    small1: kit.kit.small1,
    small2: kit.kit.small2,
    passive: kit.kit.passive,
    ultimate: kit.kit.ultimate,
  };
}

function run() {
  const levels = readLevels();
  const rows = levels.map((level, index) => analyzeLevel(level, index));
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, renderReport(rows), "utf8");
  console.log(`Wrote ${REPORT_PATH}`);
  rows.forEach((row) => {
    console.log(`${row.index + 1}. ${row.title}: ${row.passCount}/${row.total} pass (${pct(row.passDensity)}), teaches ${row.teachesCount}, accidental ${row.accidentalCount}, status ${row.status}`);
  });
}

function analyzeLevel(level, index) {
  const layout = SLOT_LAYOUTS[level.slotLayout] || SLOT_LAYOUTS.full;
  const combos = permutations(level.choices, layout, level.slots);
  const results = combos.map((combo) => simulateCombo(level, combo, index));
  const passing = results.filter((item) => item.pass);
  const audits = passing.map((item) => auditPassing(level, item));
  const teachesCount = audits.filter((item) => item.kind === "teaches" || item.kind === "acceptable").length;
  const accidentalCount = audits.filter((item) => item.kind === "accidental").length;
  const naturalPassCount = audits.filter((item) => item.natural).length;
  const passDensity = passing.length / Math.max(1, results.length);
  const target = level.lesson?.targetDensity || densityTarget(level.lesson?.type);
  const densityOk = passDensity >= target[0] && passDensity <= target[1];
  const isPractice = level.lesson?.type === "practice";
  const teachingOk = isPractice
    ? naturalPassCount > 0
    : passing.length > 0 && teachesCount / passing.length >= 0.65 && accidentalCount <= Math.max(1, Math.floor(passing.length * 0.25));
  const hiddenTuning = level.enemies.some((enemy) => typeof enemy === "object" && ["hpMult", "powerMult", "armorAdd", "hpAdd", "powerAdd"].some((key) => enemy[key] !== undefined));
  return {
    index,
    title: level.title,
    goal: level.lesson?.goal || "",
    type: level.lesson?.type || "lesson",
    total: results.length,
    passCount: passing.length,
    passDensity,
    target,
    densityOk,
    teachingOk,
    hiddenTuning,
    teachesCount,
    accidentalCount,
    naturalPassCount,
    status: densityOk && teachingOk && !hiddenTuning ? "ok" : "review",
    passing: audits.slice(0, 12),
    failing: results.filter((item) => !item.pass).slice(0, 6).map(formatCombo),
  };
}

function simulateCombo(level, combo, levelIndex) {
  const leftTeam = combo.placements.map((placement) => unitSpec(placement.role, `ally-${placement.slotIndex}`, placement.slotIndex));
  const rightTeam = level.enemies.map((entry, index) => unitSpec(entry, `enemy-${index}`, index));
  const seed = `tutorial-v3-audit|${levelIndex}|${formatCombo(combo)}`;
  const result = simulateTeams(leftTeam, rightTeam, { seed, randomizeStats: false, maxTime: 70, healthInterval: 0.5 });
  return { ...combo, pass: result.winner === "left", result };
}

function auditPassing(level, item) {
  const roles = item.placements.map((slot) => slot.role);
  const lesson = level.lesson || {};
  const natural = isNatural(item.placements);
  const hasRequired = (lesson.teaches || []).every((role) => roles.includes(role));
  const hasAnyRequired = !lesson.teachesAny?.length || lesson.teachesAny.some((role) => roles.includes(role));
  const hasForbidden = (lesson.accidentalIfIncludes || []).some((role) => roles.includes(role));
  let kind = "acceptable";
  let reason = "related pass";
  if (hasRequired && hasAnyRequired && natural && !hasForbidden) {
    kind = "teaches";
    reason = "uses intended roles naturally";
  } else if (hasForbidden || !natural || !hasRequired || !hasAnyRequired) {
    kind = "accidental";
    reason = [
      !natural ? "unnatural formation" : "",
      !hasRequired ? "misses required lesson role" : "",
      !hasAnyRequired ? "misses lesson option" : "",
      hasForbidden ? "uses unrelated dominant role" : "",
    ].filter(Boolean).join(", ");
  }
  return {
    combo: formatCombo(item),
    kind,
    reason,
    natural,
    leftHp: item.result.leftHp,
    rightHp: item.result.rightHp,
    duration: item.result.duration,
    metrics: item.result.metrics,
  };
}

function permutations(choices, layout, slots) {
  const results = [];
  const chooseRoles = choose(choices, slots);
  for (const roles of chooseRoles) {
    for (const slotSet of choose(layout, slots)) {
      for (const orderedRoles of permute(roles)) {
        results.push({
          placements: orderedRoles.map((role, index) => ({
            role,
            slotIndex: slotSet[index].slotIndex,
            lane: slotSet[index].lane,
          })),
        });
      }
    }
  }
  return results;
}

function isNatural(placements) {
  return placements.every((placement) => {
    if (placement.lane === "front") return FRONT_ROLES.has(placement.role) || SOFT_FRONT_ROLES.has(placement.role);
    return BACK_ROLES.has(placement.role) || placement.role === "assassin";
  });
}

function densityTarget(type = "lesson") {
  if (type === "operation") return [0.45, 1];
  if (type === "combo") return [0.2, 0.45];
  if (type === "practice") return [0.4, 0.7];
  return [0.15, 0.35];
}

function choose(items, count) {
  if (count === 0) return [[]];
  if (items.length < count) return [];
  const [head, ...tail] = items;
  return [
    ...choose(tail, count - 1).map((set) => [head, ...set]),
    ...choose(tail, count),
  ];
}

function permute(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, index) => permute(items.filter((_, inner) => inner !== index)).map((rest) => [item, ...rest]));
}

function formatCombo(combo) {
  return combo.placements
    .slice()
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((item) => `${item.slotIndex}:${item.role}`)
    .join(" ");
}

function renderReport(rows) {
  return [
    "# Tutorial Guide V3 Audit",
    "",
    "This report enumerates every selectable role and formation combination for tutorial_guide_v3.",
    "",
    "| Level | Type | Goal | Pass | Target | Teach | Accidental | Natural Pass | Status |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) => `| ${row.index + 1}. ${row.title} | ${row.type} | ${row.goal} | ${row.passCount}/${row.total} (${pct(row.passDensity)}) | ${pct(row.target[0])}-${pct(row.target[1])} | ${row.teachesCount} | ${row.accidentalCount} | ${row.naturalPassCount} | ${row.status}${row.hiddenTuning ? " hidden-tuning" : ""} |`),
    "",
    ...rows.flatMap((row) => [
      `## ${row.index + 1}. ${row.title}`,
      "",
      `- Goal: ${row.goal || "-"}`,
      `- Status: ${row.status}`,
      `- Density: ${row.passCount}/${row.total} (${pct(row.passDensity)})`,
      `- Teaching audit: teaches/acceptable ${row.teachesCount}, accidental ${row.accidentalCount}, natural pass ${row.naturalPassCount}`,
      row.hiddenTuning ? "- Warning: hidden enemy stat tuning is present." : "",
      "- Passing samples:",
      ...row.passing.map((item) => `  - ${item.kind}: ${item.combo}; ${item.reason}; hp ${item.leftHp}/${item.rightHp}; t=${item.duration}`),
      "- Failing samples:",
      ...row.failing.map((item) => `  - ${item}`),
      "",
    ]),
  ].join("\n");
}

function pct(value) {
  return `${Math.round(value * 100)}%`;
}

if (require.main === module) run();

module.exports = { run, analyzeLevel, readLevels };
