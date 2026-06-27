const fs = require("fs");
const path = require("path");
const DATA = require("./skill-data");
const { CombatSimulation } = require("./combat-sim");

const OUT_FILE = path.join(__dirname, "..", "design", "balance", "role-ecology-report.md");

const ROLES = ["knight", "warrior", "berserker", "assassin", "ranger", "mage", "priest", "warlock", "bard"];
const ROLE_NAME = {
  knight: "Knight",
  warrior: "Warrior",
  berserker: "Berserker",
  assassin: "Assassin",
  ranger: "Ranger",
  mage: "Mage",
  priest: "Priest",
  warlock: "Warlock",
  bard: "Bard",
};

const DUOS = {
  knightMage: ["knight", "mage"],
  warriorMage: ["warrior", "mage"],
  warriorWarrior: ["warrior", "warrior"],
  warriorBard: ["warrior", "bard"],
  warriorPriest: ["warrior", "priest"],
  warriorRanger: ["warrior", "ranger"],
  berserkerPriest: ["berserker", "priest"],
  berserkerBard: ["berserker", "bard"],
  assassinRanger: ["assassin", "ranger"],
  assassinWarlock: ["assassin", "warlock"],
  knightPriest: ["knight", "priest"],
  mageBard: ["mage", "bard"],
  warlockPriest: ["warlock", "priest"],
  knightRanger: ["knight", "ranger"],
};

const TEAMS = {
  balanced: ["knight", "priest", "ranger", "mage"],
  frontPressure: ["warrior", "priest", "ranger", "mage"],
  doubleWarrior: ["warrior", "warrior", "priest", "ranger"],
  blood: ["berserker", "priest", "bard", "ranger"],
  execute: ["knight", "assassin", "assassin", "warlock"],
  dot: ["knight", "priest", "warlock", "mage"],
  tempo: ["warrior", "bard", "ranger", "mage"],
  noFront: ["mage", "priest", "bard", "ranger"],
  noHeal: ["knight", "warrior", "ranger", "mage"],
  doubleFront: ["knight", "warrior", "priest", "ranger"],
};

function unitSpec(role, id, slotIndex) {
  const kit = DATA.roleKits[role];
  return {
    id,
    slotIndex,
    name: ROLE_NAME[role],
    role,
    roleName: ROLE_NAME[role],
    hp: kit.hp,
    power: kit.power,
    armor: kit.armor,
    range: kit.range,
    small1: kit.kit.small1,
    small2: kit.kit.small2,
    passive: kit.kit.passive,
    ultimate: kit.kit.ultimate,
  };
}

function teamSpec(roles, prefix) {
  return roles.map((role, index) => unitSpec(role, `${prefix}-${index}`, index));
}

function run(left, right, seed) {
  return new CombatSimulation({ seed, maxTime: 70, randomizeStats: false }).run(teamSpec(left, "L"), teamSpec(right, "R"));
}

function win(res) {
  return res.winner === "left";
}

function matrix(entries) {
  const keys = Object.keys(entries);
  return keys.map((leftKey) => {
    let wins = 0;
    const losses = [];
    const beats = [];
    for (const rightKey of keys) {
      if (leftKey === rightKey) continue;
      const res = run(entries[leftKey], entries[rightKey], `${leftKey}|${rightKey}`);
      if (win(res)) {
        wins += 1;
        beats.push(rightKey);
      } else {
        losses.push(rightKey);
      }
    }
    return { key: leftKey, team: entries[leftKey], wins, total: keys.length - 1, beats, losses };
  });
}

function oneVsOne() {
  return ROLES.map((left) => {
    let wins = 0;
    const result = {};
    for (const right of ROLES) {
      if (left === right) continue;
      const res = run([left], [right], `1v1|${left}|${right}`);
      result[right] = win(res) ? "W" : "L";
      if (win(res)) wins += 1;
    }
    return { role: left, wins, total: ROLES.length - 1, result };
  });
}

function scoreReport({ one, duo, four }) {
  const warrior = one.find((row) => row.role === "warrior");
  const assassin = one.find((row) => row.role === "assassin");
  const warriorDuoRows = duo.filter((row) => row.key.startsWith("warrior") || row.key === "doubleWarrior");
  const assassinDuoRows = duo.filter((row) => row.key.startsWith("assassin"));
  const doubleWarrior = four.find((row) => row.key === "doubleWarrior");
  const noFront = four.find((row) => row.key === "noFront");
  const topFour = [...four].sort((a, b) => b.wins - a.wins)[0];

  const checks = [
    {
      id: "warriorSoloStrong",
      ok: warrior.wins >= 5 && warrior.wins <= 7,
      value: `${warrior.wins}/${warrior.total}`,
      target: "Warrior 1v1 may be high, but not perfect.",
    },
    {
      id: "warriorComboLowCeiling",
      ok: warriorDuoRows.every((row) => row.wins <= 8) && (doubleWarrior?.wins || 0) <= 5,
      value: `duos ${warriorDuoRows.map((row) => `${row.key}:${row.wins}/${row.total}`).join(", ")}; doubleWarrior ${doubleWarrior?.wins}/${doubleWarrior?.total}`,
      target: "Warrior can be strong alone but should not dominate buffed or duplicated teams.",
    },
    {
      id: "assassinConditional",
      ok: assassin.wins <= 6 && assassinDuoRows.every((row) => row.wins <= 8),
      value: `solo ${assassin.wins}/${assassin.total}; duos ${assassinDuoRows.map((row) => `${row.key}:${row.wins}/${row.total}`).join(", ")}`,
      target: "Assassin burst should have front/sustain counters.",
    },
    {
      id: "noFrontWeak",
      ok: noFront?.wins <= 1,
      value: `${noFront?.wins}/${noFront?.total}`,
      target: "No-front teams should be clearly weak.",
    },
    {
      id: "noSingleTeamDominates",
      ok: topFour.wins <= 6,
      value: `${topFour.key} ${topFour.wins}/${topFour.total}`,
      target: "No 4v4 standard team should dominate the field.",
    },
  ];
  return checks;
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function main() {
  const one = oneVsOne();
  const duo = matrix(DUOS);
  const four = matrix(TEAMS);
  const checks = scoreReport({ one, duo, four });
  const stats = ROLES.map((role) => {
    const kit = DATA.roleKits[role];
    return [ROLE_NAME[role], kit.hp, kit.power, kit.armor, kit.range, `${kit.kit.passive}/${kit.kit.small1}/${kit.kit.small2}/${kit.kit.ultimate}`];
  });

  const lines = [
    "# Role Ecology Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Verdict Checks",
    "",
    table(["Check", "Status", "Value", "Target"], checks.map((check) => [check.id, check.ok ? "ok" : "review", check.value, check.target])),
    "",
    "## Base Stats",
    "",
    table(["Role", "HP", "Power", "Armor", "Range", "Kit"], stats),
    "",
    "## 1v1 Matrix Summary",
    "",
    table(["Role", "Wins", "Results"], one.map((row) => [ROLE_NAME[row.role], `${row.wins}/${row.total}`, Object.entries(row.result).map(([role, result]) => `${ROLE_NAME[role]}:${result}`).join(" ")])),
    "",
    "## 2v2 Matrix Summary",
    "",
    table(["Duo", "Wins", "Losses"], duo.map((row) => [row.key, `${row.wins}/${row.total}`, row.losses.join(", ") || "-"])),
    "",
    "## 4v4 Matrix Summary",
    "",
    table(["Team", "Roles", "Wins", "Losses"], four.map((row) => [row.key, row.team.map((role) => ROLE_NAME[role]).join(" + "), `${row.wins}/${row.total}`, row.losses.join(", ") || "-"])),
    "",
  ];

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, `${lines.join("\n")}\n`, "utf8");
  console.log(lines.slice(0, 20).join("\n"));
  console.log(`\nWrote ${path.relative(process.cwd(), OUT_FILE)}`);
}

main();
