const DATA = window.GAME_SKILL_DATA;

const ROLE_META = {
  knight: { name: "\u9a91\u58eb", icon: "\u26e8\ufe0f", tags: ["\u524d\u6392", "\u62a4\u76fe"] },
  warrior: { name: "\u6218\u58eb", icon: "\u2694\ufe0f", tags: ["\u8fd1\u6218", "\u538b\u7ebf"] },
  berserker: { name: "\u72c2\u6218\u58eb", icon: "\ud83e\ude93", tags: ["\u666e\u653b", "\u4f4e\u8840"] },
  assassin: { name: "\u523a\u5ba2", icon: "\ud83d\udde1\ufe0f", tags: ["\u6536\u5272", "\u4f4e\u8840"] },
  ranger: { name: "\u6e38\u4fa0", icon: "\ud83c\udff9", tags: ["\u8fdc\u7a0b", "\u6807\u8bb0"] },
  mage: { name: "\u6cd5\u5e08", icon: "\ud83d\udd25", tags: ["\u71c3\u70e7", "\u8303\u56f4"] },
  priest: { name: "\u7267\u5e08", icon: "\u2728", tags: ["\u6cbb\u7597", "\u62a4\u76fe"] },
  warlock: { name: "\u672f\u58eb", icon: "\u2620\ufe0f", tags: ["\u5267\u6bd2", "\u6301\u7eed"] },
  bard: { name: "\u541f\u6e38\u8bd7\u4eba", icon: "\ud83c\udfb5", tags: ["\u52a0\u901f", "\u652f\u63f4"] },
  alchemist: { name: "\u70bc\u91d1\u5e08", icon: "\u2697\ufe0f", tags: ["\u5f02\u5e38", "\u7206\u53d1"] },
};

const LEVELS = [
  {
    title: "\u7b2c\u4e00\u8bfe\uff1a\u7ad9\u4f4f\u524d\u7ebf",
    line: "\u9009\u62e9 2 \u4eba\u3002",
    slots: 2,
    choices: ["warrior", "mage", "ranger"],
    enemies: ["warrior", "warrior"],
  },
  {
    title: "\u7b2c\u4e8c\u8bfe\uff1a\u6551\u4e0b\u6b8b\u8840",
    line: "\u9009\u62e9 2 \u4eba\u3002",
    slots: 2,
    choices: ["priest", "ranger", "assassin"],
    enemies: ["assassin", "assassin"],
  },
  {
    title: "\u7b2c\u4e09\u8bfe\uff1a\u6321\u4f4f\u7a81\u8fdb",
    line: "\u9009\u62e9 3 \u4eba\u3002",
    slots: 3,
    choices: ["knight", "priest", "ranger", "mage"],
    enemies: ["assassin", "assassin", "warlock"],
  },
  {
    title: "\u7b2c\u56db\u8bfe\uff1a\u6e05\u6389\u5c0f\u961f",
    line: "\u9009\u62e9 3 \u4eba\u3002",
    slots: 3,
    choices: ["mage", "warrior", "bard", "priest"],
    enemies: ["warrior", "warrior", "ranger"],
  },
  {
    title: "\u7b2c\u4e94\u8bfe\uff1a\u62d6\u957f\u6218\u6597",
    line: "\u9009\u62e9 3 \u4eba\u3002",
    slots: 3,
    choices: ["warlock", "knight", "priest", "assassin"],
    enemies: ["knight", "warrior", "priest"],
  },
  {
    title: "\u7b2c\u516d\u8bfe\uff1a\u7ec4\u5408\u9009\u62e9",
    line: "\u9009\u62e9 4 \u4eba\u3002",
    slots: 4,
    choices: ["knight", "priest", "berserker", "ranger", "mage", "warlock"],
    enemies: ["knight", "assassin", "assassin", "warlock"],
  },
];

const state = {
  levelIndex: 0,
  selected: [],
  running: false,
  passed: false,
  battleView: null,
};

const els = {
  stageCount: document.querySelector("#stageCount"),
  stageTitle: document.querySelector("#stageTitle"),
  stageLine: document.querySelector("#stageLine"),
  slotRow: document.querySelector("#slotRow"),
  choiceGrid: document.querySelector("#choiceGrid"),
  startBtn: document.querySelector("#startBtn"),
  clearBtn: document.querySelector("#clearBtn"),
  nextBtn: document.querySelector("#nextBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  resultLine: document.querySelector("#resultLine"),
  battlefield: document.querySelector("#battlefield"),
};

function setup() {
  state.battleView = window.GAME_BATTLE_VIEW.mount({
    container: els.battlefield,
    maxTime: 70,
    onFinish: finishBattle,
  });
  els.startBtn.addEventListener("click", startBattle);
  els.clearBtn.addEventListener("click", clearSelection);
  els.nextBtn.addEventListener("click", nextLevel);
  els.resetBtn.addEventListener("click", resetLevel);
  els.slotRow.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (button) removeSelected(Number(button.dataset.removeIndex));
  });
  els.choiceGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-role]");
    if (button) toggleRole(button.dataset.role);
  });
  render();
}

function currentLevel() {
  return LEVELS[state.levelIndex];
}

function resetLevel() {
  state.selected = [];
  state.running = false;
  state.passed = false;
  els.resultLine.textContent = "";
  render();
}

function nextLevel() {
  if (!state.passed) return;
  state.levelIndex = Math.min(LEVELS.length - 1, state.levelIndex + 1);
  resetLevel();
}

function toggleRole(role) {
  if (state.running) return;
  if (state.selected.includes(role)) state.selected = state.selected.filter((item) => item !== role);
  else if (state.selected.length < currentLevel().slots) state.selected.push(role);
  state.passed = false;
  els.resultLine.textContent = "";
  render();
}

function removeSelected(index) {
  if (state.running || !state.selected[index]) return;
  state.selected.splice(index, 1);
  state.passed = false;
  els.resultLine.textContent = "";
  render();
}

function clearSelection() {
  if (state.running || state.selected.length === 0) return;
  state.selected = [];
  state.passed = false;
  els.resultLine.textContent = "";
  render();
}

function startBattle() {
  const level = currentLevel();
  if (state.running || state.selected.length !== level.slots) return;
  state.running = true;
  state.passed = false;
  els.resultLine.textContent = "";
  state.battleView.start({
    leftTeam: selectedTeam(),
    rightTeam: enemyTeam(level),
    seed: `tutorial|${state.levelIndex}|${state.selected.join("-")}`,
    title: level.title,
    randomizeStats: false,
  });
  render();
}

function finishBattle(result) {
  state.running = false;
  state.passed = result.winner === "left";
  els.resultLine.className = `result-line ${state.passed ? "pass" : "fail"}`;
  els.resultLine.textContent = state.passed ? resultSummary(result) : "\u672a\u901a\u8fc7\u3002\u6362\u4e00\u7ec4\u518d\u8bd5\u3002";
  render();
}

function resultSummary(result) {
  const summary = result.summary?.byUnit || {};
  const entries = Object.values(summary);
  const topDamage = [...entries].sort((a, b) => (b.damage || 0) - (a.damage || 0))[0];
  if (topDamage?.damage > 0) return `${topDamage.name} \u9020\u6210\u4e86\u6700\u591a\u4f24\u5bb3\u3002`;
  const topShield = [...entries].sort((a, b) => (b.shield || 0) - (a.shield || 0))[0];
  if (topShield?.shield > 0) return `${topShield.name} \u63d0\u4f9b\u4e86\u6700\u591a\u62a4\u76fe\u3002`;
  return "\u901a\u8fc7\u3002";
}

function selectedTeam() {
  return state.selected.map((role, index) => unitSpec(role, `ally-${index}`));
}

function enemyTeam(level = currentLevel()) {
  return level.enemies.map((role, index) => unitSpec(role, `enemy-${index}`));
}

function unitSpec(role, id) {
  const kit = DATA.roleKits[role];
  const meta = ROLE_META[role];
  return {
    id,
    name: meta.name,
    role,
    roleName: meta.name,
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

function render() {
  const level = currentLevel();
  els.stageCount.textContent = `${state.levelIndex + 1} / ${LEVELS.length}`;
  els.stageTitle.textContent = level.title;
  els.stageLine.textContent = level.line;
  els.startBtn.disabled = state.running || state.selected.length !== level.slots;
  els.clearBtn.disabled = state.running || state.selected.length === 0;
  els.nextBtn.hidden = !state.passed || state.levelIndex >= LEVELS.length - 1;
  renderSlots(level);
  renderChoices(level);
  renderBattlePreview(level);
}

function renderBattlePreview(level) {
  if (state.running || state.passed) return;
  state.battleView.preview({
    leftTeam: selectedTeam(),
    rightTeam: enemyTeam(level),
    title: level.title,
  });
}

function renderSlots(level) {
  els.slotRow.className = `slot-row slots-${level.slots}`;
  els.slotRow.innerHTML = Array.from({ length: level.slots }, (_, index) => {
    const role = state.selected[index];
    if (!role) return `<div class="slot"><span class="portrait empty">+</span><span>\u7a7a\u4f4d</span></div>`;
    const meta = ROLE_META[role];
    return `<div class="slot filled">
      <span class="portrait">${meta.icon}</span>
      <span><b>${meta.name}</b><span class="tags">${meta.tags.map((tag) => `<i class="tag">${tag}</i>`).join("")}</span></span>
      <button class="remove-slot" type="button" data-remove-index="${index}" aria-label="\u53d6\u6d88${meta.name}">\u00d7</button>
    </div>`;
  }).join("");
}

function renderChoices(level) {
  els.choiceGrid.innerHTML = level.choices.map((role) => {
    const meta = ROLE_META[role];
    const selected = state.selected.includes(role);
    return `<button class="choice ${selected ? "selected" : ""}" type="button" data-role="${role}" ${state.running ? "disabled" : ""}>
      <span class="portrait">${meta.icon}</span>
      <span><b class="role-name">${meta.name}</b><span class="tags">${meta.tags.map((tag) => `<i class="tag">${tag}</i>`).join("")}</span></span>
    </button>`;
  }).join("");
}

setup();
