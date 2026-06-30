const DATA = window.GAME_SKILL_DATA;
const SIM = window.GAME_COMBAT_SIM;

if (!DATA?.presets || !SIM?.simulateTeams || !window.GAME_BATTLE_VIEW?.mount) {
  throw new Error("Balance showcase requires skill data, combat sim, and battle view.");
}

const SHADOW_KIT = {
  small1: "shadowBurstAmbush",
  small2: "throatCut",
  passive: "shadowMomentum",
  ultimate: "midnightBloom",
};

const SCENARIOS = [
  {
    id: "old-vs-frost",
    group: "标准队失利",
    title: "旧暗影处决 vs 霜控拖延",
    left: presetTeam("shadowExecute"),
    right: presetTeam("frostControl"),
    seed: "showcase-old-frost",
    rightEdge: "霜控拖延依靠法师和控制链拖住节奏，旧暗影处决很难在前几秒拆掉关键后排。",
    watch: ["观察左队刺客是否能摸到法师。", "如果第一击没有拆核心，右队控制和续航会把节奏拖回来。"],
  },
  {
    id: "double-vs-frost",
    group: "暗影刺客突破",
    title: "双暗影刺客 vs 霜控拖延",
    left: shadowTeam("two"),
    right: presetTeam("frostControl"),
    seed: "showcase-double-frost",
    rightEdge: "右队优势仍然是控制链，但双暗影能把第一目标死亡时间提前到控制体系完全展开之前。",
    watch: ["看两个刺客是否同时压到法师。", "如果法师早倒，霜控队的后续节奏会断。"],
  },
  {
    id: "single-vs-frost",
    group: "单闪现刺客失效",
    title: "单闪现刺客 vs 霜控拖延",
    left: shadowTeam("one"),
    right: presetTeam("frostControl"),
    seed: "showcase-single-frost",
    rightEdge: "单闪现刺客能制造扰乱，但单人伤害密度不够，常常切到目标后自己先被控制链和后续伤害处理掉。",
    watch: ["看第一目标死亡是否足够早。", "对比双暗影：单人切入后缺少第二个刺客接力。"],
  },
  {
    id: "old-vs-poison",
    group: "标准队失利",
    title: "旧暗影处决 vs 毒巢滚雪球",
    left: presetTeam("shadowExecute"),
    right: presetTeam("poisonBloom"),
    seed: "showcase-old-poison",
    rightEdge: "毒巢依靠术士和刺客铺状态，越拖越难处理。旧队伍的处决节奏通常赶不上毒层滚起来。",
    watch: ["看右队术士是否安全站住。", "如果毒层先成型，左队会快速掉血。"],
  },
  {
    id: "double-vs-poison",
    group: "暗影刺客突破",
    title: "双暗影刺客 vs 毒巢滚雪球",
    left: shadowTeam("two"),
    right: presetTeam("poisonBloom"),
    seed: "showcase-double-poison",
    rightEdge: "毒巢怕核心状态源过早死亡。双暗影的意义是把毒队的发动机直接拆掉。",
    watch: ["看术士或敌方刺客是否在 10 秒左右倒下。", "一旦状态源死亡，毒巢的滚雪球会明显变慢。"],
  },
  {
    id: "single-vs-poison",
    group: "单闪现刺客失效",
    title: "单闪现刺客 vs 毒巢滚雪球",
    left: shadowTeam("one"),
    right: presetTeam("poisonBloom"),
    seed: "showcase-single-poison",
    rightEdge: "毒巢需要尽早拆状态源。单闪现刺客经常只能换掉一个目标，剩余毒体系还能继续滚。",
    watch: ["看单刺客是否能在毒层成型前击杀术士。", "如果刺客先死，队伍会立刻进入毒队节奏。"],
  },
  {
    id: "double-vs-fire",
    group: "暗影刺客天敌",
    title: "双暗影刺客 vs 余烬爆燃",
    left: shadowTeam("two"),
    right: presetTeam("fireBurst"),
    seed: "showcase-double-fire",
    rightEdge: "余烬爆燃有两个法师。双暗影能切死第一个，但第二个法师仍会继续放火；死亡法师的火种回响也会造成余爆。",
    watch: ["看第一个法师是否已经死亡。", "确认后续伤害来自第二个法师和火种回响，而不是死者继续行动。", "这局展示暗影刺客不是通用答案。"],
  },
  {
    id: "single-vs-fire",
    group: "单闪现刺客失效",
    title: "单闪现刺客 vs 余烬爆燃",
    left: shadowTeam("one"),
    right: presetTeam("fireBurst"),
    seed: "showcase-single-fire",
    rightEdge: "单闪现刺客即使切掉一个法师，也无法同时压住第二个法师，火队的爆发会继续覆盖全场。",
    watch: ["看第一个法师死亡后第二个法师是否还在输出。", "单刺客没有足够人数同时处理双核心。"],
  },
  {
    id: "bloodrage-vs-iron",
    group: "低血狂战成果",
    title: "低血狂怒 vs 铁壁反击",
    left: presetTeam("bloodRage"),
    right: presetTeam("ironWall"),
    seed: "showcase-blood-iron",
    rightEdge: "铁壁反击靠前排抗线和反打建立优势，但低血狂战可以在承压后提高输出节奏。",
    watch: ["看狂战血量压低后是否进入反打窗口。", "如果牧师和前排撑住第一波，狂战会逐步接管战斗。"],
  },
  {
    id: "bloodrage-vs-fire",
    group: "低血狂战天敌",
    title: "低血狂怒 vs 余烬爆燃",
    left: presetTeam("bloodRage"),
    right: presetTeam("fireBurst"),
    seed: "showcase-blood-fire",
    rightEdge: "余烬爆燃能在狂战稳定低血窗口前制造成片伤害，直接绕过慢热恢复曲线。",
    watch: ["看狂战是否来不及把低血优势转成持续输出。", "这局展示低血狂战怕快速爆发清场。"],
  },
];

const state = {
  activeId: SCENARIOS[0].id,
  view: null,
};

const els = {
  list: document.querySelector("#scenarioList"),
  count: document.querySelector("#scenarioCount"),
  type: document.querySelector("#scenarioType"),
  title: document.querySelector("#scenarioTitle"),
  badge: document.querySelector("#matchBadge"),
  leftName: document.querySelector("#leftName"),
  leftDesc: document.querySelector("#leftDesc"),
  leftUnits: document.querySelector("#leftUnits"),
  rightEdge: document.querySelector("#rightEdge"),
  watchList: document.querySelector("#watchList"),
  quickStats: document.querySelector("#quickStats"),
  playBtn: document.querySelector("#playBtn"),
  previewBtn: document.querySelector("#previewBtn"),
  mount: document.querySelector("#battleMount"),
};

function init() {
  state.view = window.GAME_BATTLE_VIEW.mount({
    container: els.mount,
    maxTime: 75,
    speed: 1.2,
    onFinish: (result) => {
      els.badge.textContent = result?.winner === "left" ? "左队胜" : result?.winner === "right" ? "右队胜" : "超时";
    },
  });
  renderList();
  renderScenario();
  els.playBtn.addEventListener("click", playActive);
  els.previewBtn.addEventListener("click", previewActive);
}

function renderList() {
  els.count.textContent = `${SCENARIOS.length} 组`;
  els.list.innerHTML = SCENARIOS.map((scenario) => `
    <button class="scenario-button" type="button" data-id="${scenario.id}">
      <em>${escapeHtml(scenario.group)}</em>
      <strong>${escapeHtml(scenario.title)}</strong>
      <span>${escapeHtml(teamLabel(scenario.left))} → ${escapeHtml(teamLabel(scenario.right))}</span>
    </button>
  `).join("");
  els.list.querySelectorAll(".scenario-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeId = button.dataset.id;
      renderScenario();
    });
  });
}

function renderScenario() {
  const scenario = activeScenario();
  els.list.querySelectorAll(".scenario-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.id === scenario.id);
  });
  els.type.textContent = scenario.group;
  els.title.textContent = scenario.title;
  els.badge.textContent = "待命";
  els.leftName.textContent = teamLabel(scenario.left);
  els.leftDesc.textContent = `${teamLabel(scenario.left)} 对 ${teamLabel(scenario.right)}`;
  els.leftUnits.innerHTML = scenario.left.map((unit, index) => unitRow(unit, index)).join("");
  els.rightEdge.textContent = scenario.rightEdge;
  els.watchList.innerHTML = scenario.watch.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  renderQuickStats(scenario);
  previewActive();
}

function renderQuickStats(scenario) {
  const result = summarizeScenario(scenario, 8);
  els.quickStats.innerHTML = [
    statLine("8 seed 胜负", `${result.leftWins}/8`),
    statLine("首个敌方死亡", result.firstEnemyDeath || "-"),
    statLine("敌方死亡序列", result.enemyDeathSequence || "-"),
    statLine("首个我方死亡", result.firstAllyDeath || "-"),
    statLine("平均时长", `${result.avgDuration.toFixed(1)}s`),
  ].join("");
}

function statLine(label, value) {
  return `<div class="stat-line"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function summarizeScenario(scenario, seeds) {
  const rows = [];
  for (let seed = 0; seed < seeds; seed += 1) {
    const result = SIM.simulateTeams(cloneTeam(scenario.left), cloneTeam(scenario.right), {
      seed: `${scenario.seed}|summary|${seed}`,
      randomizeStats: false,
      maxTime: 75,
      healthInterval: 1,
    });
    rows.push({
      win: result.winner === "left",
      duration: result.duration || 0,
      firstEnemyDeath: firstDeathText(result, "right"),
      firstAllyDeath: firstDeathText(result, "left"),
      enemyDeathSequence: deathSequenceText(result, "right"),
    });
  }
  return {
    leftWins: rows.filter((row) => row.win).length,
    avgDuration: rows.reduce((sum, row) => sum + row.duration, 0) / rows.length,
    firstEnemyDeath: mostCommon(rows.map((row) => row.firstEnemyDeath).filter(Boolean)),
    firstAllyDeath: mostCommon(rows.map((row) => row.firstAllyDeath).filter(Boolean)),
    enemyDeathSequence: mostCommon(rows.map((row) => row.enemyDeathSequence).filter(Boolean)),
  };
}

function firstDeathText(result, side) {
  const signal = (result.signals || []).find((item) => item.tags?.includes("death") && item.target?.side === side);
  if (!signal) return "";
  const time = Number(signal.time || 0).toFixed(1);
  return `${time}s ${signal.target?.role || ""}`;
}

function deathSequenceText(result, side) {
  const deaths = (result.signals || [])
    .filter((item) => item.tags?.includes("death") && item.target?.side === side)
    .slice(0, 3)
    .map((signal) => `${Number(signal.time || 0).toFixed(1)}s ${signal.target?.name || signal.target?.role || ""}`);
  return deaths.join(" / ");
}

function mostCommon(values) {
  if (!values.length) return "";
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) || 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

function playActive() {
  const scenario = activeScenario();
  els.badge.textContent = "战斗中";
  state.view.start({
    leftTeam: cloneTeam(scenario.left),
    rightTeam: cloneTeam(scenario.right),
    seed: `${scenario.seed}|play`,
    title: scenario.title,
    randomizeStats: false,
  });
}

function previewActive() {
  const scenario = activeScenario();
  state.view.preview({
    leftTeam: cloneTeam(scenario.left),
    rightTeam: cloneTeam(scenario.right),
    title: scenario.title,
  });
}

function activeScenario() {
  return SCENARIOS.find((scenario) => scenario.id === state.activeId) || SCENARIOS[0];
}

function presetTeam(key) {
  return cloneTeam(DATA.presets[key]?.team || []).map((unit, index) => ({
    ...unit,
    slotIndex: index,
  }));
}

function shadowTeam(mode) {
  let replaced = 0;
  return presetTeam("shadowExecute").map((unit) => {
    if (unit.role !== "assassin") return unit;
    if (mode === "one" && replaced >= 1) return unit;
    replaced += 1;
    return {
      ...unit,
      ...SHADOW_KIT,
      name: mode === "two" ? "双影刺客" : "暗影刺客",
    };
  });
}

function cloneTeam(team) {
  return structuredClone(team);
}

function teamLabel(team) {
  const roles = team.map((unit) => DATA.roleKits[unit.role]?.name || unit.role);
  const assassins = team.filter((unit) => unit.role === "assassin" && unit.small1 === "shadowBurstAmbush").length;
  if (assassins === 2) return "双暗影刺客";
  if (assassins === 1) return "单暗影刺客";
  const preset = Object.values(DATA.presets).find((item) => JSON.stringify(item.team) === JSON.stringify(team.map(({ slotIndex, name, ...unit }) => unit)));
  return preset?.name || roles.join(" / ");
}

function unitRow(unit, index) {
  const role = DATA.roleKits[unit.role] || {};
  const displayName = unit.name || role.name || unit.role;
  const skillNames = [unit.small1, unit.small2, unit.passive, unit.ultimate]
    .map((key) => DATA.skills[key]?.name || key)
    .filter(Boolean)
    .join(" · ");
  return `
    <div class="unit-row">
      <i>${index + 1}</i>
      <div>
        <strong>${escapeHtml(displayName)}</strong>
        <span>${escapeHtml(skillNames)}</span>
      </div>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

init();
