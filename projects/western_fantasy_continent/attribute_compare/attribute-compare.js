(() => {
  const SKILL_DATA = window.GAME_SKILL_DATA;
  const COMBAT = window.GAME_COMBAT_SIM;
  const BATTLE = window.GAME_BATTLE_VIEW;

  if (!SKILL_DATA || !COMBAT || !BATTLE) {
    throw new Error("Attribute compare requires skill data, combat sim, and battle view.");
  }

  const ATTR_LABELS = {
    might: "武力",
    fortitude: "坚韧",
    agility: "敏捷",
    arcana: "奥术",
    rhythm: "节律",
    resilience: "韧性",
  };

  const ATTR_BONUS = {
    might: { physicalPower: 2.35, hp: 3 },
    fortitude: { hp: 14, receivedHealing: 0.012 },
    agility: { attackSpeed: 0.052, effectResist: 0.005 },
    arcana: { magicPower: 2.65, skillHaste: 0.018 },
    rhythm: { skillHaste: 0.055, effectPower: 0.04 },
    resilience: { armor: 0.5, effectResist: 0.012 },
  };

  const ROUTES = {
    fortitude10: {
      id: "fortitude10",
      name: "10 坚韧",
      shortName: "坚韧",
      points: { fortitude: 10 },
      intent: "测试刺客靠生存撑过切入窗口的收益。",
    },
    agility3Might7: {
      id: "agility3Might7",
      name: "3 敏捷 / 7 武力",
      shortName: "敏武",
      points: { agility: 3, might: 7 },
      intent: "测试少量攻速配合物理爆发的暗影路线。",
    },
  };

  const KITS = {
    shadowAssassin: {
      role: "assassin",
      small1: "shadowBurstAmbush",
      small2: "throatCut",
      passive: "shadowMomentum",
      ultimate: "midnightBloom",
    },
    knightWall: {
      role: "knight",
      small1: "guard",
      small2: "tauntLine",
      passive: "fortressStance",
      ultimate: "bannerWall",
    },
    priestCrown: {
      role: "priest",
      small1: "heal",
      small2: "crownBloodCharm",
      passive: "afterglowGrace",
      ultimate: "sanctuary",
    },
    rangerMarks: {
      role: "ranger",
      small1: "kingmarkShot",
      small2: "markRelay",
      passive: "huntRhythm",
      ultimate: "killZone",
    },
  };

  const ENEMY_TEAMS = {
    multiFront: {
      id: "multiFront",
      name: "多前排压力",
      desc: "三前排一辅助，检验刺客遇到少后排目标时是否被克制。",
      team: [
        { role: "knight", small1: "guard", small2: "tauntLine", passive: "fortressStance", ultimate: "bannerWall", slotIndex: 0 },
        { role: "warrior", small1: "powerStrike", small2: "cleave", passive: "lineBreaker", ultimate: "warBanner", slotIndex: 1 },
        { role: "berserker", small1: "bloodStrike", small2: "boneWhirl", passive: "rageEngine", ultimate: "undyingRoar", slotIndex: 2 },
        { role: "priest", small1: "heal", small2: "bloodCharm", passive: "afterglowGrace", ultimate: "sanctuary", slotIndex: 3 },
      ],
    },
    crownCarry: {
      id: "crownCarry",
      name: "王冠核心",
      desc: "强保护单核，检验刺客是否能绕过保护切掉核心节奏。",
      team: "crownCarry",
    },
    poisonBloom: {
      id: "poisonBloom",
      name: "毒巢滚雪球",
      desc: "DOT 和续航压力，检验刺客能否在毒层成型前打开突破口。",
      team: "poisonBloom",
    },
  };

  let presets = buildDefaultPresets();
  const state = {
    activePresetId: presets[0]?.id || "",
    battleView: null,
    lastResult: null,
  };

  const els = {
    presetList: document.querySelector("#presetList"),
    presetCount: document.querySelector("#presetCount"),
    presetTitle: document.querySelector("#presetTitle"),
    presetDesc: document.querySelector("#presetDesc"),
    routeBadge: document.querySelector("#routeBadge"),
    resultBadge: document.querySelector("#resultBadge"),
    enemySummary: document.querySelector("#enemySummary"),
    battleMount: document.querySelector("#battleMount"),
    playBtn: document.querySelector("#playBtn"),
    previewBtn: document.querySelector("#previewBtn"),
    statWinner: document.querySelector("#statWinner"),
    statDuration: document.querySelector("#statDuration"),
    statAssassinDamage: document.querySelector("#statAssassinDamage"),
    statBadSwitch: document.querySelector("#statBadSwitch"),
    presetJson: document.querySelector("#presetJson"),
    applyJsonBtn: document.querySelector("#applyJsonBtn"),
    copyApiBtn: document.querySelector("#copyApiBtn"),
    apiHint: document.querySelector("#apiHint"),
  };

  function buildDefaultPresets() {
    return Object.values(ENEMY_TEAMS).flatMap((enemy) => [
      makePreset(ROUTES.fortitude10, enemy),
      makePreset(ROUTES.agility3Might7, enemy),
    ]);
  }

  function makePreset(route, enemy) {
    return {
      id: `${route.id}_vs_${enemy.id}`,
      name: `${route.name} vs ${enemy.name}`,
      routeId: route.id,
      enemyId: enemy.id,
      routePoints: route.points,
      description: `${route.intent} 对手：${enemy.desc}`,
      seed: `attribute-compare|${route.id}|${enemy.id}`,
    };
  }

  function buildBonus(points = {}) {
    const bonus = {
      hp: 0,
      physicalPower: 0,
      magicPower: 0,
      armor: 0,
      attackSpeed: 0,
      skillHaste: 0,
      effectPower: 0,
      effectResist: 0,
      receivedHealing: 0,
    };
    for (const [attr, value] of Object.entries(points || {})) {
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

  function buildUnit(role, points = {}, overrides = {}) {
    const base = SKILL_DATA.roleKits[role];
    if (!base) throw new Error(`Unknown role: ${role}`);
    const kit = { ...(base.kit || {}), ...overrides };
    const bonus = buildBonus(points);
    return {
      role,
      name: overrides.name || `${base.name}-${routeText(points) || "无加点"}`,
      small1: kit.small1,
      small2: kit.small2,
      passive: kit.passive,
      ultimate: kit.ultimate,
      hp: Math.round((base.hp || 300) + bonus.hp),
      power: base.power,
      physicalPower: round((base.power || 0) + bonus.physicalPower, 2),
      magicPower: round((base.power || 0) + bonus.magicPower, 2),
      armor: round((base.armor || 0) + bonus.armor, 2),
      range: base.range,
      attackSpeedMult: round(1 + bonus.attackSpeed, 3),
      skillHasteMult: round(1 + bonus.skillHaste, 3),
      effectPowerMult: round(1 + bonus.effectPower, 3),
      effectResistPct: Math.min(0.5, round(bonus.effectResist, 3)),
      receivedHealingMult: round(1 + bonus.receivedHealing, 3),
      slotIndex: Number.isFinite(overrides.slotIndex) ? overrides.slotIndex : undefined,
    };
  }

  function buildAssassinTeam(points = {}) {
    return [
      buildUnit("knight", {}, { ...KITS.knightWall, slotIndex: 0, name: "铁壁骑士" }),
      buildUnit("assassin", points, { ...KITS.shadowAssassin, slotIndex: 2, name: `暗影刺客-${routeText(points)}` }),
      buildUnit("priest", {}, { ...KITS.priestCrown, slotIndex: 3, name: "银誓牧师" }),
      buildUnit("ranger", {}, { ...KITS.rangerMarks, slotIndex: 1, name: "月弦游侠" }),
    ];
  }

  function resolveEnemyTeam(enemyId) {
    const enemy = ENEMY_TEAMS[enemyId];
    if (!enemy) throw new Error(`Unknown enemy team: ${enemyId}`);
    if (typeof enemy.team === "string") return structuredClone(SKILL_DATA.presets[enemy.team].team);
    return structuredClone(enemy.team);
  }

  function teamsForPreset(preset) {
    const points = preset.routePoints || ROUTES[preset.routeId]?.points || {};
    return {
      leftTeam: preset.leftTeam ? structuredClone(preset.leftTeam) : buildAssassinTeam(points),
      rightTeam: preset.rightTeam ? structuredClone(preset.rightTeam) : resolveEnemyTeam(preset.enemyId),
    };
  }

  function renderPresetList() {
    els.presetCount.textContent = String(presets.length);
    els.presetList.innerHTML = presets.map((preset) => {
      const route = ROUTES[preset.routeId];
      const enemy = ENEMY_TEAMS[preset.enemyId];
      return `
        <button class="preset-button ${preset.id === state.activePresetId ? "active" : ""}" type="button" data-preset-id="${escapeHtml(preset.id)}">
          <strong>${escapeHtml(route?.shortName || preset.routeId || "自定义")}</strong>
          <span>${escapeHtml(enemy?.name || preset.enemyId || preset.name)}</span>
          <span>${escapeHtml(routeText(preset.routePoints || route?.points || {}))}</span>
        </button>
      `;
    }).join("");
  }

  function renderActive() {
    const preset = activePreset();
    if (!preset) return;
    const route = ROUTES[preset.routeId];
    const enemy = ENEMY_TEAMS[preset.enemyId];
    els.presetTitle.textContent = preset.name || preset.id;
    els.presetDesc.textContent = preset.description || "";
    els.routeBadge.textContent = route?.shortName || routeText(preset.routePoints || {});
    els.enemySummary.innerHTML = resolveEnemyTeam(preset.enemyId).map((unit) => {
      const role = SKILL_DATA.roleKits[unit.role];
      return `<div class="unit-pill"><strong>${escapeHtml(role?.name || unit.role)}</strong><span>${escapeHtml(skillLine(unit))}</span></div>`;
    }).join("");
    els.presetJson.value = JSON.stringify(preset, null, 2);
    resetStats();
    previewPreset();
    renderPresetList();
  }

  function previewPreset() {
    const preset = activePreset();
    if (!preset) return;
    const teams = teamsForPreset(preset);
    battleView().preview({ ...teams, title: preset.name });
    els.resultBadge.className = "result-badge";
    els.resultBadge.textContent = "预览";
  }

  function playPreset() {
    const preset = activePreset();
    if (!preset) return;
    const teams = teamsForPreset(preset);
    resetStats();
    els.resultBadge.className = "result-badge";
    els.resultBadge.textContent = "战斗中";
    battleView().start({
      ...teams,
      seed: preset.seed || `attribute-compare|${preset.id}`,
      title: preset.name,
      randomizeStats: false,
    });
  }

  function battleView() {
    if (!state.battleView) {
      state.battleView = BATTLE.mount({
        container: els.battleMount,
        maxTime: 75,
        speed: 1.25,
        onFinish: handleFinish,
      });
    }
    return state.battleView;
  }

  function handleFinish(result) {
    state.lastResult = result;
    const winner = result.winner === "left" ? "胜利" : "失败";
    els.resultBadge.className = `result-badge ${result.winner === "left" ? "win" : "loss"}`;
    els.resultBadge.textContent = winner;
    els.statWinner.textContent = winner;
    els.statDuration.textContent = `${round(result.duration, 1)}s`;
    els.statAssassinDamage.textContent = String(round(assassinDamage(result), 0));
    els.statBadSwitch.textContent = String(badTargetSwitches(result));
  }

  function assassinDamage(result) {
    return (result.units || []).filter((unit) => unit.side === "ally" && unit.roleKey === "assassin")
      .reduce((sum, unit) => sum + (unit.damageDone || 0), 0);
  }

  function badTargetSwitches(result) {
    const assassinIds = new Set((result.units || [])
      .filter((unit) => unit.side === "ally" && unit.roleKey === "assassin")
      .flatMap((unit) => [unit.simId, unit.id, unit.unitId].filter(Boolean)));
    const deathTime = {};
    for (const signal of result.signals || []) {
      if ((signal.tags || []).includes("death") && signal.target?.id) {
        deathTime[signal.target.id] = Math.min(deathTime[signal.target.id] ?? Infinity, signal.time || 0);
      }
    }
    return (result.signals || []).filter((signal) => signal.kind === "targeting" && assassinIds.has(signal.source?.id))
      .filter((signal) => {
        const focus = signal.meta?.assassinFocusTargetId;
        if (!focus || signal.target?.id === focus) return false;
        return (deathTime[focus] ?? Infinity) > (signal.time || 0);
      }).length;
  }

  function activePreset() {
    return presets.find((preset) => preset.id === state.activePresetId) || presets[0];
  }

  function applyPreset(id) {
    const preset = presets.find((item) => item.id === id);
    if (!preset) throw new Error(`Unknown preset: ${id}`);
    state.activePresetId = id;
    renderActive();
    return preset;
  }

  function registerPreset(preset) {
    if (!preset?.id) throw new Error("Preset requires id.");
    const index = presets.findIndex((item) => item.id === preset.id);
    if (index >= 0) presets[index] = preset;
    else presets.push(preset);
    if (!state.activePresetId) state.activePresetId = preset.id;
    renderActive();
    return preset;
  }

  function setPresets(nextPresets) {
    if (!Array.isArray(nextPresets)) throw new Error("setPresets expects an array.");
    presets = structuredClone(nextPresets);
    state.activePresetId = presets[0]?.id || "";
    renderActive();
    return presets;
  }

  function resetStats() {
    state.lastResult = null;
    els.statWinner.textContent = "-";
    els.statDuration.textContent = "-";
    els.statAssassinDamage.textContent = "-";
    els.statBadSwitch.textContent = "-";
  }

  function routeText(points = {}) {
    return Object.entries(points).filter(([, value]) => value)
      .map(([key, value]) => `${value}${ATTR_LABELS[key] || key}`)
      .join(" / ");
  }

  function skillLine(unit) {
    return [unit.small1, unit.small2, unit.passive, unit.ultimate]
      .filter(Boolean)
      .map((key) => SKILL_DATA.skills[key]?.name || key)
      .join(" · ");
  }

  function round(value, digits = 2) {
    return Number(Number(value || 0).toFixed(digits));
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[char]);
  }

  els.presetList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset-id]");
    if (!button) return;
    applyPreset(button.dataset.presetId);
  });
  els.playBtn.addEventListener("click", playPreset);
  els.previewBtn.addEventListener("click", previewPreset);
  els.applyJsonBtn.addEventListener("click", () => {
    try {
      registerPreset(JSON.parse(els.presetJson.value));
      els.apiHint.textContent = "已应用当前 JSON。";
    } catch (error) {
      els.apiHint.textContent = `JSON 错误：${error.message}`;
    }
  });
  els.copyApiBtn.addEventListener("click", async () => {
    const text = `window.AttributeCompare.registerPreset(${els.presetJson.value});\nwindow.AttributeCompare.applyPreset(${JSON.stringify(activePreset()?.id || "")});`;
    els.apiHint.textContent = text;
    try { await navigator.clipboard?.writeText(text); } catch (_) {}
  });

  window.AttributeCompare = {
    state,
    routes: ROUTES,
    enemyTeams: ENEMY_TEAMS,
    getPresets: () => structuredClone(presets),
    setPresets,
    registerPreset,
    applyPreset,
    playPreset,
    previewPreset,
    buildUnit,
    buildAssassinTeam,
    routeText,
  };

  renderPresetList();
  renderActive();
})();
