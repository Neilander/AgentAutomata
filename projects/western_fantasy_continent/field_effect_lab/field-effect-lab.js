(() => {
  const FIELD = window.GAME_FIELD_EFFECTS;
  const BATTLE = window.GAME_BATTLE_VIEW;
  const SKILL = window.GAME_SKILL_DATA;

  if (!FIELD || !BATTLE || !SKILL) throw new Error("Field effect lab requires field effects, skill data, and battle view.");

  const BASE_ROLES = ["warrior", "knight", "berserker", "assassin", "ranger", "mage", "priest", "warlock"];
  const SLOT_NAMES = ["前排 1", "前排 2", "后排 1", "后排 2"];
  const DEFAULT_LEFT = ["warrior", "knight", "mage", "priest"];
  const DEFAULT_RIGHT = ["knight", "berserker", "ranger", "warlock"];
  const STORAGE_KEY = "aa_field_effect_lab_custom_teams";
  const FIELD_DESCRIPTIONS = {
    iron_oath: "前排更耐打，战斗更容易进入长线对抗。",
    arcane_tide: "技能输出窗口更强，施法节奏更快。",
    blood_moon: "危险血线下的进攻和回复能力提高。",
    hunter_fog: "单体物理压制和攻击节奏提高。",
    ember_air: "持续伤害和异常压力更容易滚起来。",
    shield_echo: "保护、治疗和第二轮技能更稳定。",
    tempo_drum: "普攻频率和物理连续输出提高。",
    frost_clock: "控制、拖延和后续技能收益提高。",
    crown_relay: "支援资源更容易集中到核心输出身上。",
    many_target_hall: "多目标压血和群体压力更强。",
    duelist_ring: "单体击杀和决斗式压制更强。",
    backline_beacon: "后排稳定输出和安全施法更强。",
    plague_workshop: "毒、诅咒和持续施压更容易成型。",
    banner_march: "队伍阵型稳定性和前线承压提高。",
    consecrated_well: "治疗、护盾和恢复节奏更强。",
    witching_hour: "后续技能轮次的爆发更致命。",
    thorn_maze: "拉扯、控制和消耗战更强。",
    red_anvil: "近战承压、治疗转化和持续肉搏更强。",
    spellblade_corridor: "物理与魔法混合输出更强。",
    breakers_yard: "破防、干扰和拆防御壳能力更强。",
  };

  const state = {
    left: [...DEFAULT_LEFT],
    right: [...DEFAULT_RIGHT],
    picking: null,
  };

  const els = {
    fieldSelect: document.querySelector("#fieldSelect"),
    levelSelect: document.querySelector("#levelSelect"),
    fieldInfo: document.querySelector("#fieldInfo"),
    startBtn: document.querySelector("#startBtn"),
    leftResetBtn: document.querySelector("#leftResetBtn"),
    rightResetBtn: document.querySelector("#rightResetBtn"),
    leftSlots: document.querySelector("#leftSlots"),
    rightSlots: document.querySelector("#rightSlots"),
    battlefield: document.querySelector("#battlefield"),
    roleModal: document.querySelector("#roleModal"),
    roleOptions: document.querySelector("#roleOptions"),
    closeModalBtn: document.querySelector("#closeModalBtn"),
  };

  const view = BATTLE.mount({
    container: els.battlefield,
    maxTime: 75,
    speed: 1,
  });

  init();

  function init() {
    restoreTeams();
    els.fieldSelect.innerHTML = [
      `<option value="none">无</option>`,
      ...FIELD.effects.map((effect) => `<option value="${effect.id}">${escapeHtml(effect.name)}</option>`),
    ].join("");

    els.fieldSelect.addEventListener("change", () => {
      renderFieldInfo();
      preview();
    });
    els.levelSelect.addEventListener("change", () => {
      renderFieldInfo();
      preview();
    });
    els.startBtn.addEventListener("click", startBattle);
    els.leftResetBtn.addEventListener("click", () => resetSide("left"));
    els.rightResetBtn.addEventListener("click", () => resetSide("right"));
    els.closeModalBtn.addEventListener("click", closeRoleModal);
    els.roleModal.addEventListener("click", (event) => {
      if (event.target?.dataset?.close) closeRoleModal();
    });

    renderRoleOptions();
    renderAll();
    preview();
  }

  function restoreTeams() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved?.left) && saved.left.length === 4) state.left = saved.left.filter(isBaseRole).concat(DEFAULT_LEFT).slice(0, 4);
      if (Array.isArray(saved?.right) && saved.right.length === 4) state.right = saved.right.filter(isBaseRole).concat(DEFAULT_RIGHT).slice(0, 4);
    } catch (error) {
      console.warn("field lab team restore failed", error);
    }
  }

  function renderAll() {
    renderSlots("left");
    renderSlots("right");
    renderFieldInfo();
  }

  function renderSlots(side) {
    const host = side === "left" ? els.leftSlots : els.rightSlots;
    host.innerHTML = state[side].map((roleId, index) => {
      const role = SKILL.roleKits[roleId] || {};
      return `
        <button class="slot-btn" type="button" data-side="${side}" data-index="${index}">
          <span class="slot-name">${SLOT_NAMES[index]}</span>
          <strong>${escapeHtml(role.name || roleId)}</strong>
          <span>${escapeHtml(role.role || roleId)}</span>
        </button>
      `;
    }).join("");
    host.querySelectorAll(".slot-btn").forEach((button) => {
      button.addEventListener("click", () => openRoleModal(button.dataset.side, Number(button.dataset.index)));
    });
  }

  function renderRoleOptions() {
    els.roleOptions.innerHTML = BASE_ROLES.map((roleId) => {
      const role = SKILL.roleKits[roleId] || {};
      return `
        <button class="role-option" type="button" data-role="${roleId}">
          <strong>${escapeHtml(role.name || roleId)}</strong>
          <span>${escapeHtml(role.role || roleId)}</span>
        </button>
      `;
    }).join("");
    els.roleOptions.querySelectorAll("[data-role]").forEach((button) => {
      button.addEventListener("click", () => chooseRole(button.dataset.role));
    });
  }

  function renderFieldInfo() {
    if (els.fieldSelect.value === "none") {
      els.levelSelect.disabled = true;
      els.fieldInfo.innerHTML = `
        <h2>无场地</h2>
        <p>不应用任何场地修正，直接按双方队伍开战。</p>
      `;
      return;
    }

    els.levelSelect.disabled = false;
    const effect = FIELD.effectById(els.fieldSelect.value);
    els.fieldInfo.innerHTML = `
      <h2>${escapeHtml(effect.name)} L${escapeHtml(els.levelSelect.value)}</h2>
      <p>${escapeHtml(FIELD_DESCRIPTIONS[effect.id] || effect.short || "场地会改变本场战斗的队伍表现。")}</p>
    `;
  }

  function openRoleModal(side, index) {
    state.picking = { side, index };
    els.roleModal.hidden = false;
  }

  function closeRoleModal() {
    state.picking = null;
    els.roleModal.hidden = true;
  }

  function chooseRole(roleId) {
    if (!state.picking || !isBaseRole(roleId)) return;
    const side = state.picking.side;
    state[side][state.picking.index] = roleId;
    persistTeams();
    closeRoleModal();
    renderSlots(side);
    preview();
  }

  function resetSide(side) {
    state[side] = side === "left" ? [...DEFAULT_LEFT] : [...DEFAULT_RIGHT];
    persistTeams();
    renderSlots(side);
    preview();
  }

  function makeTeam(side) {
    return FIELD.roleTeam(state[side], `${side}-custom`);
  }

  function preview() {
    view.preview({
      leftTeam: makeTeam("left"),
      rightTeam: makeTeam("right"),
      title: selectedFieldTitle(),
    });
  }

  function startBattle() {
    const level = Number(els.levelSelect.value);
    let leftTeam = makeTeam("left");
    let rightTeam = makeTeam("right");
    const fieldId = els.fieldSelect.value;

    if (fieldId !== "none") {
      const fielded = FIELD.applyFieldEffectToTeams(leftTeam, rightTeam, fieldId, level);
      leftTeam = fielded.leftTeam;
      rightTeam = fielded.rightTeam;
    }

    view.start({
      leftTeam,
      rightTeam,
      title: selectedFieldTitle(),
      seed: `${fieldId}|${level}|${state.left.join("-")}|${state.right.join("-")}`,
      randomizeStats: false,
    });
  }

  function selectedFieldTitle() {
    if (els.fieldSelect.value === "none") return "无场地";
    return `${FIELD.effectById(els.fieldSelect.value).name} L${els.levelSelect.value}`;
  }

  function persistTeams() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ left: state.left, right: state.right }));
  }

  function isBaseRole(roleId) {
    return BASE_ROLES.includes(roleId);
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }
})();
