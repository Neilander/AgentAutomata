const DATA = window.GAME_SKILL_DATA;

const ROLE_META = {
  knight: { name: "\u9a91\u58eb", icon: "\u26e8\ufe0f", tags: ["\u524d\u6392", "\u62a4\u76fe"], focus: "\u7ad9\u4f4f\u3001\u6321\u4f24\u3001\u62a4\u961f\u53cb" },
  warrior: { name: "\u6218\u58eb", icon: "\u2694\ufe0f", tags: ["\u8fd1\u6218", "\u538b\u7ebf"], focus: "\u524d\u6392\u538b\u7ebf\uff0c\u8d34\u8eab\u6253\u7a33\u5b9a\u4f24\u5bb3" },
  berserker: { name: "\u72c2\u6218\u58eb", icon: "\ud83e\ude93", tags: ["\u666e\u653b", "\u4f4e\u8840"], focus: "\u8840\u91cf\u8d8a\u5371\u9669\uff0c\u666e\u653b\u53cd\u6253\u8d8a\u5f3a" },
  assassin: { name: "\u523a\u5ba2", icon: "\ud83d\udde1\ufe0f", tags: ["\u6536\u5272", "\u4f4e\u8840"], focus: "\u627e\u6b8b\u8840\uff0c\u5feb\u901f\u6536\u5272" },
  ranger: { name: "\u6e38\u4fa0", icon: "\ud83c\udff9", tags: ["\u8fdc\u7a0b", "\u6807\u8bb0"], focus: "\u6807\u8bb0\u5355\u4f53\uff0c\u8d8a\u6253\u8d8a\u51c6" },
  mage: { name: "\u6cd5\u5e08", icon: "\ud83d\udd25", tags: ["\u71c3\u70e7", "\u8303\u56f4"], focus: "\u7528\u706b\u7403\u548c\u71c3\u70e7\u540c\u65f6\u538b\u591a\u4e2a\u654c\u4eba" },
  priest: { name: "\u7267\u5e08", icon: "\u2728", tags: ["\u6cbb\u7597", "\u62a4\u76fe"], focus: "\u62ac\u6b8b\u8840\uff0c\u628a\u5371\u9669\u7a97\u53e3\u6491\u8fc7\u53bb" },
  warlock: { name: "\u672f\u58eb", icon: "\u2620\ufe0f", tags: ["\u5267\u6bd2", "\u6301\u7eed"], focus: "\u9760\u6301\u7eed\u4f24\u5bb3\u62d6\u7a7f\u9ad8\u62a4\u7532" },
  bard: { name: "\u541f\u6e38\u8bd7\u4eba", icon: "\ud83c\udfb5", tags: ["\u52a0\u901f", "\u652f\u63f4"], focus: "\u63d0\u901f\u961f\u53cb\uff0c\u628a\u8282\u594f\u62c9\u8d77\u6765" },
  alchemist: { name: "\u70bc\u91d1\u5e08", icon: "\u2697\ufe0f", tags: ["\u5f02\u5e38", "\u7206\u53d1"], focus: "\u6df7\u5408\u5f02\u5e38\uff0c\u8f6c\u5316\u6210\u7206\u53d1" },
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
  frontOneBackTwo: [
    { slotIndex: 0, label: "\u524d\u6392", note: "\u627f\u538b" },
    { slotIndex: 2, label: "\u540e\u6392\u4e0a", note: "\u8f93\u51fa / \u652f\u63f4" },
    { slotIndex: 3, label: "\u540e\u6392\u4e0b", note: "\u8f93\u51fa / \u652f\u63f4" },
  ],
  frontTwoBackOne: [
    { slotIndex: 0, label: "\u524d\u6392\u4e0a", note: "\u9760\u524d\u627f\u538b" },
    { slotIndex: 1, label: "\u524d\u6392\u4e0b", note: "\u9760\u524d\u627f\u538b" },
    { slotIndex: 2, label: "\u540e\u6392", note: "\u8f93\u51fa / \u652f\u63f4" },
  ],
  full: FORMATION_SLOTS,
};

const LEVELS = [
  {
    title: "第一课：前后排",
    objective: "敌方有前排和后排压力。先熟悉选人、放置、开战和前后排的基础关系。",
    line: "选择 2 人。",
    winLine: "通过：前排承压，后排完成输出，这是一支小队最基础的骨架。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["warrior", "mage", "priest"],
    enemies: ["warrior", "mage"],
    lesson: { type: "lesson", goal: "frontline plus backline", teaches: ["warrior"], teachesAny: ["mage", "priest"], targetDensity: [0.15, 0.35] },
  },
  {
    title: "第二课：治疗窗口",
    objective: "敌方会制造一段危险血线，队伍需要有人把关键角色从危险窗口里拉回来。",
    line: "选择 2 人。",
    winLine: "通过：治疗保住了低血反打窗口，危险血线不是立刻失败。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["berserker", "priest", "bard", "ranger"],
    enemies: ["knight", "knight", "assassin"],
    lesson: { type: "combo", goal: "heal a low-health carry through danger", teaches: ["berserker", "priest"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第三课：标记集火",
    objective: "敌方有难缠的单位，分散输出会拖太久，集中火力能更快打开局面。",
    line: "选择 2 人。",
    winLine: "通过：稳定前排给游侠时间，标记和持续射击把目标压下去了。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["warrior", "ranger", "mage", "bard"],
    enemies: ["knight", "assassin"],
    lesson: { type: "lesson", goal: "single-target focus with mark", teaches: ["ranger"], teachesAny: ["warrior", "bard"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第四课：硬壳敌人",
    objective: "敌方前排很硬，短时间打不穿时，需要能拖住并持续输出的结构。",
    line: "选择 2 人。",
    winLine: "通过：队伍没有急着秒杀，而是靠持续压力把硬壳慢慢磨穿。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["knight", "warlock", "ranger", "bard"],
    enemies: ["knight", "warrior"],
    lesson: { type: "lesson", goal: "frontline plus sustained damage against armor", teaches: ["knight"], teachesAny: ["warlock", "ranger"], targetDensity: [0.15, 0.35] },
  },
  {
    title: "第五课：范围压力",
    objective: "敌方是两个快速近战，后排如果没有前线保护会很快被贴住。",
    line: "选择 2 人。",
    winLine: "通过：骑士把敌人拖在前线，法师的范围伤害同时处理多个近战。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["knight", "mage", "priest", "bard"],
    enemies: ["assassin", "assassin"],
    lesson: { type: "lesson", goal: "area damage behind a real front", teaches: ["knight", "mage"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第六课：残血收割",
    objective: "敌方会被逐步压低，收割型角色需要队友先制造残血目标。",
    line: "选择 2 人。",
    winLine: "通过：前排制造窗口，刺客在敌人进入危险血线后完成收割。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["warrior", "assassin", "ranger", "priest"],
    enemies: ["berserker", "priest", "priest"],
    lesson: { type: "lesson", goal: "execute needs setup damage", teaches: ["assassin"], teachesAny: ["warrior", "priest"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第七课：持续消耗",
    objective: "敌方有前排和突进，队伍需要有人稳定住血线，同时让持续伤害慢慢发挥。",
    line: "选择 2 人。",
    winLine: "通过：牧师拖住危险窗口，术士的持续伤害在长战斗里逐渐生效。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["warlock", "priest", "mage", "assassin"],
    enemies: ["knight", "assassin"],
    lesson: { type: "lesson", goal: "sustain plus damage over time", teaches: ["warlock", "priest"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第八课：保护收割",
    objective: "敌方会把战斗拖长，刺客需要稳定前线帮他创造切入和收割空间。",
    line: "选择 2 人。",
    winLine: "通过：骑士吸收压力，刺客在安全窗口里完成关键击杀。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["knight", "assassin", "ranger", "mage"],
    enemies: ["knight", "priest", "bard"],
    lesson: { type: "lesson", goal: "frontline protection for execute", teaches: ["knight", "assassin"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第九课：稳定点杀",
    objective: "敌方全是硬目标，队伍需要稳定前排和持续单点输出。",
    line: "选择 2 人。",
    winLine: "通过：骑士拖住硬目标，游侠用标记和持续射击逐个击破。",
    slots: 2,
    slotLayout: "frontBack",
    choices: ["knight", "ranger", "warlock", "bard"],
    enemies: ["knight", "knight", "knight"],
    lesson: { type: "lesson", goal: "stable mark damage against hard targets", teaches: ["knight", "ranger"], targetDensity: [0.05, 0.2] },
  },
  {
    title: "第十课：综合挑战",
    objective: "最后一关混合前排、突进、后排和持续伤害，检验你能不能自己组出稳定队伍。",
    line: "选择 4 人。",
    winLine: "通过：你的队伍能承压、处理危险窗口，并持续产生有效输出。",
    slots: 4,
    slotLayout: "full",
    choices: ["knight", "warrior", "priest", "ranger", "mage", "warlock", "berserker"],
    enemies: ["knight", "assassin", "ranger", "warlock"],
    lesson: { type: "practice", goal: "final mixed-pressure check", teachesAny: ["knight", "warrior", "priest", "ranger", "mage", "warlock", "berserker"], targetDensity: [0.4, 0.7] },
  },
];
const state = {
  levelIndex: 0,
  placements: [null, null, null, null],
  pendingRole: "",
  detailRole: "",
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
  prevStageBtn: document.querySelector("#prevStageBtn"),
  nextStageBtn: document.querySelector("#nextStageBtn"),
  resultLine: document.querySelector("#resultLine"),
  battlefield: document.querySelector("#battlefield"),
  skillModal: document.querySelector("#skillModal"),
  skillModalBody: document.querySelector("#skillModalBody"),
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
  els.prevStageBtn.addEventListener("click", () => jumpLevel(state.levelIndex - 1));
  els.nextStageBtn.addEventListener("click", () => jumpLevel(state.levelIndex + 1));
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
    const detail = event.target.closest("[data-detail-role]");
    if (detail) {
      openSkillModal(detail.dataset.detailRole);
      return;
    }
    const card = event.target.closest("[data-role]");
    if (card) toggleRole(card.dataset.role);
  });
  els.skillModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-skill]")) closeSkillModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeSkillModal();
  });
  els.choiceGrid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-role]");
    if (!card) return;
    event.preventDefault();
    toggleRole(card.dataset.role);
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
  closeSkillModal();
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

function jumpLevel(index) {
  state.levelIndex = Math.max(0, Math.min(LEVELS.length - 1, index));
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

function openSkillModal(role) {
  state.detailRole = role;
  renderSkillModal(role);
  els.skillModal.hidden = false;
}

function closeSkillModal() {
  state.detailRole = "";
  if (els.skillModal) els.skillModal.hidden = true;
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
  els.prevStageBtn.disabled = state.running || state.levelIndex <= 0;
  els.nextStageBtn.disabled = state.running || state.levelIndex >= LEVELS.length - 1;
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
    return `<article class="choice ${placed || pending ? "selected" : ""} ${pending ? "pending" : ""}" data-role="${role}" role="button" tabindex="${state.running ? "-1" : "0"}" aria-pressed="${placed || pending ? "true" : "false"}">
      <button class="flip-button" type="button" data-detail-role="${role}" aria-label="\u67e5\u770b${meta.name}\u6280\u80fd">\u6280</button>
      <div class="choice-face choice-front">
        <span class="portrait">${meta.icon}</span>
        <span><b class="role-name">${meta.name}</b><span class="choice-state">${placed ? "\u5df2\u4e0a\u9635 / \u70b9\u51fb\u79fb\u51fa" : pending ? "\u5f85\u653e\u7f6e" : "\u70b9\u51fb\u9009\u4e2d"}</span><span class="tags">${meta.tags.map((tag) => `<i class="tag">${tag}</i>`).join("")}</span></span>
      </div>
    </article>`;
  }).join("");
}

function renderSkillModal(role) {
  const meta = ROLE_META[role];
  if (!meta) return;
  els.skillModalBody.innerHTML = `<header class="skill-modal-head">
    <span class="portrait">${meta.icon}</span>
    <span><b id="skillModalTitle">${meta.name}</b><small>${meta.focus}</small></span>
  </header>
  <div class="skill-modal-tags">${meta.tags.map((tag) => `<i class="tag">${tag}</i>`).join("")}</div>
  <div class="skill-modal-grid">
    ${skillLines(role).map((line) => `<section class="skill-detail-card"><b>${line.label}</b><strong>${line.value}</strong><p>${line.desc}</p></section>`).join("")}
  </div>`;
}

function skillLines(role) {
  const kit = DATA.roleKits[role]?.kit || {};
  return [
    { label: "\u88ab\u52a8", value: skillName(kit.passive), desc: skillDesc(kit.passive) },
    { label: "\u5c0f1", value: skillName(kit.small1), desc: skillDesc(kit.small1) },
    { label: "\u5c0f2", value: skillName(kit.small2), desc: skillDesc(kit.small2) },
    { label: "\u5927\u62db", value: skillName(kit.ultimate), desc: skillDesc(kit.ultimate) },
  ];
}

function skillName(key) {
  return DATA.skills[key]?.name || key || "-";
}

function skillDesc(key) {
  const desc = DATA.skills[key]?.desc || "";
  return desc.length > 18 ? `${desc.slice(0, 18)}...` : desc;
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

