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

const FORMATION_SLOTS = [
  { slotIndex: 0, label: "\u524d\u6392\u4e0a", note: "\u9760\u524d\u627f\u538b" },
  { slotIndex: 1, label: "\u524d\u6392\u4e0b", note: "\u9760\u524d\u627f\u538b" },
  { slotIndex: 2, label: "\u540e\u6392\u4e0a", note: "\u8f83\u5b89\u5168" },
  { slotIndex: 3, label: "\u540e\u6392\u4e0b", note: "\u8f83\u5b89\u5168" },
];

const SLOT_LAYOUTS = {
  frontBack: [
    { slotIndex: 0, label: "\u524d\u6392", note: "\u627f\u538b" },
    { slotIndex: 2, label: "\u540e\u6392", note: "\u8f93\u51fa / \u652f\u63f4" },
  ],
  frontPair: [
    { slotIndex: 0, label: "\u524d\u6392\u4e0a", note: "\u9760\u524d\u627f\u538b" },
    { slotIndex: 1, label: "\u524d\u6392\u4e0b", note: "\u9760\u524d\u627f\u538b" },
  ],
  full: FORMATION_SLOTS,
};

const LEVELS = [
  {
    title: "\u7b2c\u4e00\u8bfe\uff1a\u7ad9\u4f4f\u524d\u7ebf",
    objective: "\u654c\u4eba\u662f\u53cc\u6218\u58eb\uff0c\u9700\u8981\u4e00\u4e2a\u524d\u6392\u62d6\u4f4f\uff0c\u518d\u914d\u4e00\u4e2a\u80fd\u7a33\u5b9a\u8f93\u51fa\u7684\u89d2\u8272\u3002",
    line: "\u9009\u62e9 2 \u4eba\u3002",
    winLine: "\u901a\u8fc7\uff1a\u9a91\u58eb\u62d6\u4f4f\u524d\u7ebf\uff0c\u6e38\u4fa0\u5728\u540e\u9762\u7a33\u5b9a\u8f93\u51fa\u3002",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["knight", "ranger", "mage"],
    enemies: ["warrior", "warrior"],
  },
  {
    title: "\u7b2c\u4e8c\u8bfe\uff1a\u6551\u4e0b\u6b8b\u8840",
    objective: "\u72c2\u6218\u58eb\u9700\u8981\u8fdb\u5165\u5371\u9669\u8840\u7ebf\u624d\u4f1a\u53d8\u5f3a\uff0c\u4f46\u4ed6\u9700\u8981\u7267\u5e08\u628a\u8fd9\u4e2a\u7a97\u53e3\u6491\u4f4f\u3002",
    line: "\u9009\u62e9 2 \u4eba\u3002",
    winLine: "\u901a\u8fc7\uff1a\u7267\u5e08\u4fdd\u4f4f\u4e86\u72c2\u6218\u58eb\u7684\u4f4e\u8840\u7ffb\u76d8\u7a97\u53e3\u3002",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["priest", "berserker", "ranger"],
    enemies: ["assassin", { role: "warrior", hpMult: 0.85, powerMult: 0.75 }],
  },
  {
    title: "\u7b2c\u4e09\u8bfe\uff1a\u6321\u4f4f\u7a81\u8fdb",
    objective: "\u654c\u65b9\u6709\u591a\u4e2a\u523a\u5ba2\uff0c\u524d\u6392\u8981\u5438\u6536\u7b2c\u4e00\u6ce2\u538b\u529b\uff0c\u8fdc\u7a0b\u9700\u8981\u5c3d\u5feb\u6253\u6389\u5a01\u80c1\u3002",
    line: "\u9009\u62e9 3 \u4eba\u3002",
    winLine: "\u901a\u8fc7\uff1a\u9a91\u58eb\u627f\u538b\uff0c\u8fdc\u7a0b\u706b\u529b\u5728\u7a81\u8fdb\u7206\u53d1\u524d\u5b8c\u6210\u51fb\u6740\u3002",
    slots: 3,
    slotLayout: "full",
    choices: ["knight", "priest", "ranger", "mage"],
    enemies: ["assassin", "assassin", "warlock"],
  },
  {
    title: "\u7b2c\u56db\u8bfe\uff1a\u6e05\u6389\u5c0f\u961f",
    objective: "\u654c\u4eba\u6570\u91cf\u591a\u4f46\u5355\u4f53\u8f83\u8106\uff0c\u52a0\u901f\u4f1a\u653e\u5927\u6e05\u573a\u89d2\u8272\u7684\u653b\u51fb\u8282\u594f\u3002",
    line: "\u9009\u62e9 3 \u4eba\u3002",
    winLine: "\u901a\u8fc7\uff1a\u541f\u6e38\u8bd7\u4eba\u628a\u961f\u4f0d\u7684\u6e05\u573a\u8282\u594f\u62c9\u4e86\u8d77\u6765\u3002",
    slots: 3,
    slotLayout: "full",
    choices: ["knight", "mage", "bard", "warrior"],
    enemies: [
      { role: "warrior", hpMult: 0.7, powerMult: 0.75 },
      { role: "warrior", hpMult: 0.7, powerMult: 0.75 },
      { role: "ranger", hpMult: 0.7, powerMult: 0.75 },
      { role: "ranger", hpMult: 0.7, powerMult: 0.75 },
    ],
  },
  {
    title: "\u7b2c\u4e94\u8bfe\uff1a\u62d6\u957f\u6218\u6597",
    objective: "\u9ad8\u62a4\u7532\u654c\u4eba\u4e0d\u9002\u5408\u6162\u6162\u7528\u767d\u5b57\u786c\u780d\uff0c\u9700\u8981\u6301\u7eed\u4f24\u5bb3\u914d\u5408\u7eed\u822a\u6216\u524d\u6392\u3002",
    line: "\u9009\u62e9 2 \u4eba\u3002",
    winLine: "\u901a\u8fc7\uff1a\u672f\u58eb\u7684\u6301\u7eed\u4f24\u5bb3\u8ba9\u9ad8\u62a4\u7532\u654c\u4eba\u65e0\u6cd5\u53ea\u9760\u62a4\u7532\u62d6\u4f4f\u3002",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["warlock", "knight", "priest"],
    enemies: [{ role: "knight", hpMult: 1.8, powerMult: 0.45, armorAdd: 12 }],
  },
  {
    title: "\u7b2c\u516d\u8bfe\uff1a\u7ec4\u5408\u9009\u62e9",
    objective: "\u6700\u540e\u4e00\u5173\u6df7\u5408\u4e86\u524d\u6392\u3001\u7a81\u8fdb\u548c\u6301\u7eed\u4f24\u5bb3\uff0c\u9009\u4e00\u652f\u5b8c\u6574\u5c0f\u961f\u3002",
    line: "\u9009\u62e9 4 \u4eba\u3002",
    winLine: "\u901a\u8fc7\uff1a\u4e00\u652f\u5b8c\u6574\u961f\u4f0d\u9700\u8981\u627f\u538b\u3001\u8f93\u51fa\u548c\u6062\u590d\u540c\u65f6\u6210\u7acb\u3002",
    slots: 4,
    slotLayout: "full",
    choices: ["knight", "priest", "berserker", "ranger", "mage"],
    enemies: ["knight", "assassin", "assassin", "warlock"],
  },
];

const state = {
  levelIndex: 0,
  placements: [null, null, null, null],
  pendingRole: "",
  running: false,
  passed: false,
  hint: "",
  battleView: null,
};

const els = {
  stageCount: document.querySelector("#stageCount"),
  stageTitle: document.querySelector("#stageTitle"),
  objectiveLine: document.querySelector("#objectiveLine"),
  stageLine: document.querySelector("#stageLine"),
  selectMeta: document.querySelector("#selectMeta"),
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
    const slot = event.target.closest("[data-slot-index]");
    if (slot) {
      placePending(Number(slot.dataset.slotIndex));
      return;
    }
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

function currentSlotLayout(level = currentLevel()) {
  return SLOT_LAYOUTS[level.slotLayout] || SLOT_LAYOUTS.full;
}

function resetLevel() {
  state.placements = [null, null, null, null];
  state.pendingRole = "";
  state.running = false;
  state.passed = false;
  state.hint = "";
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
  const slotIndex = state.placements.indexOf(role);
  if (slotIndex >= 0) {
    state.placements[slotIndex] = null;
    state.pendingRole = role;
    state.hint = "\u5df2\u79fb\u51fa\u7ad9\u4f4d\uff0c\u518d\u70b9\u4e00\u4e2a\u69fd\u4f4d\u653e\u56de\u53bb\u3002";
  } else if (placedCount() < currentLevel().slots) {
    state.pendingRole = state.pendingRole === role ? "" : role;
    state.hint = state.pendingRole ? "\u5df2\u9009\u4e2d\u89d2\u8272\uff0c\u70b9\u524d\u6392\u6216\u540e\u6392\u69fd\u4f4d\u653e\u7f6e\u3002" : "\u5df2\u53d6\u6d88\u5f85\u653e\u7f6e\u89d2\u8272\u3002";
  } else {
    state.hint = "\u961f\u4f0d\u5df2\u6ee1\uff0c\u5148\u79fb\u51fa\u4e00\u4e2a\u69fd\u4f4d\u91cc\u7684\u89d2\u8272\u3002";
  }
  state.passed = false;
  els.resultLine.textContent = "";
  render();
}

function placePending(slotIndex) {
  if (state.running || !state.pendingRole || state.placements[slotIndex]) return;
  if (!currentSlotLayout().some((slot) => slot.slotIndex === slotIndex)) return;
  if (placedCount() >= currentLevel().slots) return;
  state.placements[slotIndex] = state.pendingRole;
  state.pendingRole = "";
  state.passed = false;
  state.hint = "\u5df2\u653e\u5165\u7ad9\u4f4d\u3002";
  els.resultLine.textContent = "";
  render();
}

function removeSelected(index) {
  if (state.running || !state.placements[index]) return;
  state.pendingRole = state.placements[index];
  state.placements[index] = null;
  state.passed = false;
  state.hint = "\u5df2\u79fb\u51fa\u7ad9\u4f4d\uff0c\u53ef\u4ee5\u91cd\u65b0\u653e\u7f6e\u3002";
  els.resultLine.textContent = "";
  render();
}

function clearSelection() {
  if (state.running || (placedCount() === 0 && !state.pendingRole)) return;
  state.placements = [null, null, null, null];
  state.pendingRole = "";
  state.passed = false;
  state.hint = "\u5df2\u6e05\u7a7a\u961f\u4f0d\u3002";
  els.resultLine.textContent = "";
  render();
}

function startBattle() {
  const level = currentLevel();
  if (state.running || placedCount() !== level.slots) return;
  state.running = true;
  state.passed = false;
  state.hint = "\u6218\u6597\u4e2d\u3002";
  els.resultLine.textContent = "";
  state.battleView.start({
    leftTeam: selectedTeam(),
    rightTeam: enemyTeam(level),
    seed: `tutorial|${state.levelIndex}|${placementSeed()}`,
    title: level.title,
    randomizeStats: false,
  });
  render();
}

function finishBattle(result) {
  state.running = false;
  state.passed = result.winner === "left";
  state.hint = state.passed ? currentLevel().winLine : "\u6ca1\u901a\u8fc7\uff0c\u6362\u4e00\u7ec4\u518d\u8bd5\u3002";
  els.resultLine.className = `result-line ${state.passed ? "pass" : "fail"}`;
  els.resultLine.textContent = state.passed ? `${currentLevel().winLine} ${resultSummary(result)}` : "\u672a\u901a\u8fc7\u3002\u6362\u4e00\u7ec4\u518d\u8bd5\u3002";
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
  return currentSlotLayout()
    .map((slot) => {
      const role = state.placements[slot.slotIndex];
      return role ? unitSpec(role, `ally-${slot.slotIndex}`, { slotIndex: slot.slotIndex }) : null;
    })
    .filter(Boolean);
}

function enemyTeam(level = currentLevel()) {
  return level.enemies.map((role, index) => unitSpec(role, `enemy-${index}`));
}

function unitSpec(entry, id, options = {}) {
  const role = typeof entry === "string" ? entry : entry.role;
  const tuning = typeof entry === "string" ? {} : entry;
  const kit = DATA.roleKits[role];
  const meta = ROLE_META[role];
  return {
    id,
    slotIndex: options.slotIndex,
    name: meta.name,
    role,
    roleName: meta.name,
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

function render() {
  const level = currentLevel();
  const count = placedCount();
  els.stageCount.textContent = `${state.levelIndex + 1} / ${LEVELS.length}`;
  els.stageTitle.textContent = level.title;
  els.objectiveLine.textContent = level.objective;
  els.stageLine.textContent = selectionLine(level);
  els.selectMeta.textContent = state.hint || selectionHint(level);
  els.selectMeta.className = `select-meta ${count === level.slots ? "ready" : ""}`;
  els.startBtn.disabled = state.running || count !== level.slots;
  els.clearBtn.disabled = state.running || (count === 0 && !state.pendingRole);
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
  const slots = currentSlotLayout(level);
  const count = placedCount(level);
  const teamFull = count >= level.slots;
  els.slotRow.className = `slot-row formation-slots slots-${slots.length}`;
  els.slotRow.innerHTML = slots.map((slot) => {
    const role = state.placements[slot.slotIndex];
    if (!role) {
      const canPlace = state.pendingRole && !teamFull;
      const mark = teamFull ? "\u00d7" : "+";
      const title = teamFull ? "\u961f\u4f0d\u5df2\u6ee1" : slot.label;
      return `<button class="slot empty-slot ${canPlace ? "can-place" : ""} ${teamFull ? "locked-empty" : ""}" type="button" ${canPlace ? `data-slot-index="${slot.slotIndex}"` : "disabled"}>
        <span class="portrait empty">${mark}</span><span><b>${title}</b><small>${slot.note}</small></span>
      </button>`;
    }
    const meta = ROLE_META[role];
    return `<div class="slot filled">
      <span class="portrait">${meta.icon}</span>
      <span><b>${slot.label} · ${meta.name}</b><span class="tags">${meta.tags.map((tag) => `<i class="tag">${tag}</i>`).join("")}</span></span>
      <button class="remove-slot" type="button" data-remove-index="${slot.slotIndex}" aria-label="\u53d6\u6d88${meta.name}">\u00d7</button>
    </div>`;
  }).join("");
}

function selectionLine(level) {
  const need = level.slots - placedCount();
  if (state.running) return "\u6218\u6597\u8fdb\u884c\u4e2d\u3002";
  if (need <= 0) return `\u5df2\u653e\u7f6e ${placedCount()} / ${level.slots}\uff0c\u53ef\u4ee5\u5f00\u6218\u3002`;
  return `\u5df2\u653e\u7f6e ${placedCount()} / ${level.slots}\uff0c\u8fd8\u5dee ${need} \u4eba\u3002`;
}

function selectionHint(level) {
  if (state.pendingRole) return "\u70b9\u4e00\u4e2a\u7ad9\u4f4d\u69fd\u653e\u7f6e\u89d2\u8272\u3002";
  if (placedCount() === 0) return "\u5148\u70b9\u5019\u9009\u89d2\u8272\uff0c\u518d\u70b9\u7ad9\u4f4d\u69fd\u3002";
  if (placedCount() === level.slots) return "\u70b9\u5f00\u6218\uff0c\u6216\u70b9\u69fd\u4f4d\u53f3\u4e0a\u89d2\u79fb\u51fa\u3002";
  return "\u7ee7\u7eed\u9009\u89d2\u8272\u5e76\u653e\u5230\u7ad9\u4f4d\u3002";
}

function renderChoices(level) {
  els.choiceGrid.innerHTML = level.choices.map((role) => {
    const meta = ROLE_META[role];
    const placed = state.placements.includes(role);
    const pending = state.pendingRole === role;
    return `<button class="choice ${placed || pending ? "selected" : ""} ${pending ? "pending" : ""}" type="button" data-role="${role}" ${state.running ? "disabled" : ""}>
      <span class="portrait">${meta.icon}</span>
      <span><b class="role-name">${meta.name}</b><span class="choice-state">${placed ? "\u5df2\u4e0a\u9635 / \u70b9\u51fb\u79fb\u51fa" : pending ? "\u5f85\u653e\u7f6e" : "\u70b9\u51fb\u9009\u4e2d"}</span><span class="tags">${meta.tags.map((tag) => `<i class="tag">${tag}</i>`).join("")}</span></span>
    </button>`;
  }).join("");
}

function placedCount(level = currentLevel()) {
  return currentSlotLayout(level).filter((slot) => state.placements[slot.slotIndex]).length;
}

function placementSeed() {
  return currentSlotLayout().map((slot) => {
    const role = state.placements[slot.slotIndex];
    return role ? `${slot.slotIndex}:${role}` : `${slot.slotIndex}:empty`;
  }).join("|");
}

setup();
