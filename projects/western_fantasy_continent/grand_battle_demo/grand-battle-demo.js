(() => {
  const SKILLS = window.GAME_SKILL_DATA;
  const BUILD = window.GAME_BUILD_LAYERS;
  const BATTLE = window.GAME_BATTLE_VIEW;

  if (!SKILLS?.roleKits || !BUILD?.applyBuildLayers || !BATTLE?.mount) {
    throw new Error("Grand battle demo requires skill data, build layers, and battle view.");
  }

  const ROLE_LABELS = {
    warrior: "战士",
    knight: "骑士",
    berserker: "狂战士",
    assassin: "刺客",
    ranger: "游侠",
    mage: "法师",
    priest: "牧师",
    warlock: "术士",
    bard: "诗人",
    alchemist: "炼金师",
  };

  const ROLE_ICONS = {
    warrior: "⚔",
    knight: "🛡",
    berserker: "🪓",
    assassin: "🗡",
    ranger: "🏹",
    mage: "🔥",
    priest: "✦",
    warlock: "☠",
    bard: "♫",
    alchemist: "⚗",
  };

  const LEFT_ROLES = [
    "knight", "warrior", "knight", "warrior",
    "berserker", "berserker", "assassin", "ranger",
    "mage", "mage", "warlock", "alchemist",
    "priest", "priest", "bard", "ranger",
    "warrior", "knight", "bard", "assassin",
  ];

  const RIGHT_ROLES = [
    "warrior", "knight", "berserker", "knight",
    "assassin", "assassin", "ranger", "berserker",
    "warlock", "mage", "alchemist", "mage",
    "bard", "priest", "ranger", "warlock",
    "knight", "warrior", "priest", "alchemist",
  ];

  const state = {
    seed: 1,
    leftTeam: [],
    rightTeam: [],
    view: null,
  };

  const els = {
    mount: document.querySelector("#battleMount"),
    startBtn: document.querySelector("#startBtn"),
    previewBtn: document.querySelector("#previewBtn"),
    rerollBtn: document.querySelector("#rerollBtn"),
    matchTitle: document.querySelector("#matchTitle"),
    leftPower: document.querySelector("#leftPower"),
    rightPower: document.querySelector("#rightPower"),
    leftList: document.querySelector("#leftList"),
    rightList: document.querySelector("#rightList"),
    resultBox: document.querySelector("#resultBox"),
  };

  function init() {
    state.view = BATTLE.mount({
      container: els.mount,
      maxTime: 95,
      speed: 1.05,
      onFinish: onFinish,
    });
    bind();
    buildScenario();
    preview();
  }

  function bind() {
    els.startBtn.addEventListener("click", start);
    els.previewBtn.addEventListener("click", preview);
    els.rerollBtn.addEventListener("click", () => {
      state.seed += 1;
      buildScenario();
      preview();
    });
  }

  function buildScenario() {
    state.leftTeam = buildArmy("left", rotateRoles(LEFT_ROLES, state.seed % 5), "晨星军");
    state.rightTeam = buildArmy("right", rotateRoles(RIGHT_ROLES, state.seed % 7), "夜王军");
    renderSideInfo();
  }

  function buildArmy(side, roles, prefix) {
    return roles.map((role, index) => {
      const pos = formationPosition(side, index);
      return buildGodSpec(role, index, `${prefix}${index + 1}`, pos);
    });
  }

  function buildGodSpec(role, index, name, pos) {
    const kit = SKILLS.roleKits[role] || {};
    const roleKit = kit.kit || {};
    const basePower = kit.power || 45;
    const base = {
      role,
      name: `${name} ${ROLE_LABELS[role] || role}`,
      small1: roleKit.small1,
      small2: roleKit.small2,
      passive: roleKit.passive,
      ultimate: roleKit.ultimate,
      hp: kit.hp || 300,
      maxHp: kit.hp || 300,
      power: basePower,
      physicalPower: basePower,
      magicPower: basePower,
      armor: kit.armor || 8,
      range: kit.range || 14,
      icon: roleIconKey(role),
    };
    const spec = BUILD.applyBuildLayers(base, {
      attributePoints: godAttributePoints(role),
      equipmentModifiers: godEquipmentBundle(role),
      tags: ["grand-battle", "god-gear"],
    });
    return {
      ...spec,
      slotIndex: index,
      homeX: pos.x,
      homeY: pos.y,
      line: pos.line,
    };
  }

  function formationPosition(side, index) {
    const col = Math.floor(index / 4);
    const row = index % 4;
    const y = [20, 40, 60, 80][row];
    const leftX = [35, 29, 23, 17, 11][col];
    const rightX = [65, 71, 77, 83, 89][col];
    return {
      x: side === "left" ? leftX[col] : rightX[col],
      y,
      line: col < 2 ? "鍓嶆帓" : "鍚庢帓",
    };
  }

  function godAttributePoints(role) {
    const [main, secondary] = BUILD.ROLE_ATTRS?.[role] || ["might", "fortitude"];
    return {
      [main]: 48,
      [secondary]: 34,
      fortitude: (role === "knight" || role === "warrior") ? 24 : 10,
      resilience: (role === "priest" || role === "bard" || role === "knight") ? 22 : 8,
    };
  }

  function godEquipmentBundle(role) {
    const physical = ["warrior", "knight", "berserker", "assassin", "ranger"].includes(role);
    const magic = ["mage", "priest", "warlock", "bard", "alchemist"].includes(role);
    const frontline = ["knight", "warrior", "berserker"].includes(role);
    return {
      source: "grand-battle-god-gear",
      maxHpAdd: frontline ? 1900 : 1250,
      physicalPowerAdd: physical ? 270 : 80,
      magicPowerAdd: magic ? 285 : 70,
      armorAdd: frontline ? 86 : 46,
      attackSpeedMult: physical ? 1.82 : 1.22,
      skillHasteMult: magic ? 1.78 : 1.28,
      effectPowerMult: magic ? 1.58 : 1.22,
      effectResistPct: frontline ? 0.34 : 0.24,
      receivedHealingMult: frontline ? 1.55 : 1.28,
      mechanicModifiers: roleMechanicBundle(role),
      notes: ["20v20 god gear"],
      debug: { role },
    };
  }

  function roleMechanicBundle(role) {
    const common = { effectResist: 28 };
    const byRole = {
      warrior: { counterDamage: 85, armorBreak: 60, critDamage: 42 },
      knight: { shieldPower: 92, auraPower: 66, counterDamage: 45 },
      berserker: { lifeSteal: 92, lowHpDamage: 82, attackSpeed: 62 },
      assassin: { stealthDuration: 82, executeDamage: 96, shadowAmp: 74, critChance: 50 },
      ranger: { markPower: 96, critChance: 72, attackSpeed: 56 },
      mage: { fireAmp: 96, arcaneAmp: 68, dotAmp: 52 },
      priest: { healPower: 104, shieldPower: 64, cleanseEfficiency: 72 },
      warlock: { poisonAmp: 96, shadowAmp: 56, dotAmp: 80 },
      bard: { auraPower: 106, skillHaste: 54, cleanseEfficiency: 48 },
      alchemist: { poisonAmp: 72, fireAmp: 72, controlPower: 78 },
    };
    return { ...common, ...(byRole[role] || {}) };
  }

  function start() {
    els.resultBox.textContent = "团战进行中";
    state.view.start({
      leftTeam: structuredClone(state.leftTeam),
      rightTeam: structuredClone(state.rightTeam),
      seed: `grand-battle-${state.seed}-${Date.now()}`,
      title: "20v20 神装方阵",
      randomizeStats: false,
    });
  }

  function preview() {
    els.resultBox.textContent = "等待开战";
    state.view.preview({
      leftTeam: structuredClone(state.leftTeam),
      rightTeam: structuredClone(state.rightTeam),
      title: "20v20 神装方阵",
    });
  }

  function onFinish(result) {
    const winner = result.winner === "left" ? "左军胜利" : "右军胜利";
    const leftAlive = result.units.filter((unit) => unit.side === "ally" && !unit.deadTriggered).length;
    const rightAlive = result.units.filter((unit) => unit.side === "enemy" && !unit.deadTriggered).length;
    els.resultBox.textContent = `${winner} · ${result.duration.toFixed(1)}s · 存活 ${leftAlive}:${rightAlive}`;
  }

  function renderSideInfo() {
    els.matchTitle.textContent = `第 ${state.seed} 组`;
    els.leftPower.textContent = formatNumber(teamPower(state.leftTeam));
    els.rightPower.textContent = formatNumber(teamPower(state.rightTeam));
    els.leftList.innerHTML = roleRows(state.leftTeam);
    els.rightList.innerHTML = roleRows(state.rightTeam);
  }

  function roleRows(team) {
    return team.map((unit, index) => `
      <div class="role-row">
        <span>${ROLE_ICONS[unit.role] || "◆"}</span>
        <strong>${index + 1}. ${ROLE_LABELS[unit.role] || unit.role}</strong>
        <span>${displayLine(unit.line)}</span>
      </div>
    `).join("");
  }

  function teamPower(team) {
    return team.reduce((sum, unit) => sum + unitPower(unit), 0);
  }

  function unitPower(unit) {
    return Math.round(
      (unit.maxHp || unit.hp || 0) * 0.42
      + (unit.physicalPower || unit.power || 0) * 9
      + (unit.magicPower || unit.power || 0) * 9
      + (unit.armor || 0) * 18
      + ((unit.attackSpeedMult || 1) - 1) * 1800
      + ((unit.skillHasteMult || 1) - 1) * 1700
      + ((unit.effectPowerMult || 1) - 1) * 1300
      + (unit.effectResistPct || 0) * 2200
    );
  }

  function rotateRoles(roles, count) {
    const offset = count % roles.length;
    return [...roles.slice(offset), ...roles.slice(0, offset)];
  }

  function roleIconKey(role) {
    return {
      warrior: "crossed-swords",
      knight: "shield",
      berserker: "battle-axe",
      assassin: "plain-dagger",
      ranger: "high-shot",
      mage: "fireball",
      priest: "angel-outfit",
      warlock: "death-skull",
      bard: "lyre",
      alchemist: "potion-ball",
    }[role] || "crossed-swords";
  }

  function displayLine(line) {
    return line === "鍚庢帓" ? "后排" : "前排";
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString("zh-CN");
  }

  init();
})();
