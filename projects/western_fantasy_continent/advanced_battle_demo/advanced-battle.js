const CLASS_META = {
  tank: {
    label: "坦克",
    color: "#7d91a4",
    range: 52,
    weapon: { left: "38px", top: "33px", width: "25px", height: "31px", radius: "5px", color: "#8c7c62", rotate: "0deg" },
  },
  warrior: {
    label: "战士",
    color: "#b77745",
    range: 58,
    weapon: { left: "44px", top: "18px", width: "7px", height: "50px", radius: "2px", color: "#c7cbd0", rotate: "-26deg" },
  },
  assassin: {
    label: "刺客",
    color: "#6b5aa7",
    range: 48,
    weapon: { left: "41px", top: "38px", width: "28px", height: "6px", radius: "2px", color: "#d5d7dc", rotate: "-12deg" },
  },
  mage: {
    label: "法师",
    color: "#497dc3",
    range: 205,
    weapon: { left: "45px", top: "14px", width: "6px", height: "58px", radius: "4px", color: "#c9a85b", rotate: "-10deg" },
  },
};

const EMPTY_STATS = {
  hp: 0, attack: 0, defense: 0, magicPower: 0, magicResist: 0, attackSpeed: 0,
  critChance: 0, critDamage: 0, moveSpeed: 0, accuracy: 0, evasion: 0,
  physicalDamageAmp: 0, fireDamage: 0, fireDamageAmp: 0, fireDurationAmp: 0,
  poisonDamage: 0, poisonDamageAmp: 0, poisonDurationAmp: 0,
  lightningDamage: 0, lightningDamageAmp: 0, lightningChainChance: 0,
  iceDamage: 0, iceDamageAmp: 0, iceSlowAmp: 0, holyDamageAmp: 0,
  shadowDamageAmp: 0, arcaneDamageAmp: 0, dotDamageAmp: 0,
  areaDamageAmp: 0, singleTargetDamageAmp: 0,
};

const state = {
  data: null,
  running: false,
  elapsed: 0,
  lastFrame: 0,
  nextId: 1,
  fighters: [],
  log: [],
  selectedId: null,
};

const els = {
  leftRoster: document.querySelector("#leftRoster"),
  rightRoster: document.querySelector("#rightRoster"),
  startBtn: document.querySelector("#startBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  leftPresetBtn: document.querySelector("#leftPresetBtn"),
  rightPresetBtn: document.querySelector("#rightPresetBtn"),
  battlefield: document.querySelector("#battlefield"),
  unitLayer: document.querySelector("#unitLayer"),
  fxLayer: document.querySelector("#fxLayer"),
  leftAlive: document.querySelector("#leftAlive"),
  rightAlive: document.querySelector("#rightAlive"),
  battleState: document.querySelector("#battleState"),
  timer: document.querySelector("#timer"),
  selectedStats: document.querySelector("#selectedStats"),
  combatLog: document.querySelector("#combatLog"),
};

const defaultTeams = {
  left: [
    { classKey: "tank", equipmentSetId: "frost_oath_set", relicIds: ["stone_heart", "war_banner_shard"] },
    { classKey: "warrior", equipmentSetId: "dragonforged_set", relicIds: ["ember_crit_core", "execution_rhythm"] },
    { classKey: "mage", equipmentSetId: "thunder_set", relicIds: ["storm_capacitor", "chain_spark"] },
  ],
  right: [
    { classKey: "tank", equipmentSetId: "iron_guard_set", relicIds: ["stone_heart", "frost_shatter_shell"] },
    { classKey: "assassin", equipmentSetId: "hunter_set", relicIds: ["glass_blade", "duelist_mark"] },
    { classKey: "mage", equipmentSetId: "ember_set", relicIds: ["long_burning_wick", "wildfire_map"] },
  ],
};

async function setup() {
  state.data = await loadGameData();
  renderRosters();
  bindEvents();
  resetBattle();
  requestAnimationFrame(tick);
}

async function loadGameData() {
  try {
    const response = await fetch("/api/game-data/summary");
    if (response.ok) return response.json();
  } catch {}
  throw new Error("无法读取游戏数据，请从本地后端打开页面。");
}

function bindEvents() {
  els.startBtn.addEventListener("click", startBattle);
  els.pauseBtn.addEventListener("click", pauseBattle);
  els.resetBtn.addEventListener("click", resetBattle);
  els.leftPresetBtn.addEventListener("click", () => randomizeTeam("left"));
  els.rightPresetBtn.addEventListener("click", () => randomizeTeam("right"));
  els.leftRoster.addEventListener("change", resetBattle);
  els.rightRoster.addEventListener("change", resetBattle);
  els.unitLayer.addEventListener("click", (event) => {
    const node = event.target.closest(".fighter");
    if (!node) return;
    state.selectedId = Number(node.dataset.id);
    renderSelectedStats();
  });
}

function renderRosters() {
  renderTeamRoster("left", els.leftRoster);
  renderTeamRoster("right", els.rightRoster);
}

function renderTeamRoster(side, mount) {
  mount.innerHTML = "";
  const team = defaultTeams[side];
  for (let index = 0; index < 3; index += 1) {
    const spec = team[index];
    const card = document.createElement("div");
    card.className = "unit-card";
    card.dataset.side = side;
    card.dataset.index = String(index);
    card.innerHTML = `
      <header><strong>${side === "left" ? "我方" : "敌方"} ${index + 1}</strong><span class="power"></span></header>
      <div class="field"><label>职业</label><select data-field="classKey">${classOptions(spec.classKey)}</select></div>
      <div class="field"><label>装备</label><select data-field="equipmentSetId">${equipmentOptions(spec.equipmentSetId)}</select></div>
      <label>藏品</label>
      <div class="relic-grid">
        ${Array.from({ length: 6 }, (_, i) => `<select data-field="relicIds" data-slot="${i}">${relicOptions(spec.relicIds[i] || "")}</select>`).join("")}
      </div>
    `;
    mount.appendChild(card);
  }
  updatePowerLabels();
}

function classOptions(selected) {
  return Object.entries(state.data.classes)
    .map(([key]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${CLASS_META[key].label}</option>`)
    .join("");
}

function equipmentOptions(selected) {
  return state.data.equipmentSets
    .map((set) => `<option value="${set.id}" ${set.id === selected ? "selected" : ""}>T${set.tier} ${set.name}</option>`)
    .join("");
}

function relicOptions(selected) {
  return [`<option value="">无</option>`]
    .concat(state.data.relics.map((relic) => `<option value="${relic.id}" ${relic.id === selected ? "selected" : ""}>${relic.name}</option>`))
    .join("");
}

function readTeam(side) {
  const roster = side === "left" ? els.leftRoster : els.rightRoster;
  return [...roster.querySelectorAll(".unit-card")].map((card) => ({
    classKey: card.querySelector('[data-field="classKey"]').value,
    equipmentSetId: card.querySelector('[data-field="equipmentSetId"]').value,
    relicIds: [...card.querySelectorAll('[data-field="relicIds"]')].map((select) => select.value).filter(Boolean).slice(0, 6),
  }));
}

function randomizeTeam(side) {
  const classes = Object.keys(state.data.classes);
  const equipment = state.data.equipmentSets;
  const relics = state.data.relics;
  const roster = side === "left" ? els.leftRoster : els.rightRoster;
  for (const card of roster.querySelectorAll(".unit-card")) {
    card.querySelector('[data-field="classKey"]').value = pick(classes);
    card.querySelector('[data-field="equipmentSetId"]').value = pick(equipment).id;
    const chosen = shuffle(relics).slice(0, 3 + Math.floor(Math.random() * 4));
    card.querySelectorAll('[data-field="relicIds"]').forEach((select, index) => {
      select.value = chosen[index]?.id || "";
    });
  }
  resetBattle();
}

function resetBattle() {
  state.running = false;
  state.elapsed = 0;
  state.lastFrame = performance.now();
  state.nextId = 1;
  state.log = ["战斗已重置。"];
  state.fighters = createFighters();
  state.selectedId = state.fighters[0]?.id || null;
  clearFx();
  renderAll();
  setBattleState("待命");
  updatePowerLabels();
}

function createFighters() {
  const width = els.battlefield.clientWidth || 720;
  const height = els.battlefield.clientHeight || 460;
  return [
    ...createTeam("left", readTeam("left"), width * 0.18, height),
    ...createTeam("right", readTeam("right"), width * 0.82, height),
  ];
}

function createTeam(side, specs, x, height) {
  const spacing = height / 4;
  return specs.map((spec, index) => {
    const stats = buildStats(spec);
    const meta = CLASS_META[spec.classKey];
    return {
      id: state.nextId++,
      side,
      index,
      ...spec,
      label: meta.label,
      stats,
      maxHp: Math.max(1, Math.round(stats.hp)),
      hp: Math.max(1, Math.round(stats.hp)),
      x,
      y: spacing * (index + 1),
      range: meta.range,
      speed: Math.max(25, stats.moveSpeed),
      attackCooldown: 0.4 + index * 0.15,
      attackFlash: 0,
      attacking: false,
      dots: [],
      battleStacks: {},
      targetStacks: {},
      markedTargetId: null,
      damageDone: 0,
    };
  });
}

function buildStats(spec) {
  const base = state.data.classes[spec.classKey] || {};
  const equipment = state.data.equipmentSets.find((set) => set.id === spec.equipmentSetId)?.stats || {};
  const passiveRelics = spec.relicIds
    .map(getRelic)
    .filter((relic) => relic?.trigger === "passive")
    .map((relic) => relic.effect.stats || {});
  return mergeStats(EMPTY_STATS, base, equipment, ...passiveRelics);
}

function startBattle() {
  if (!getAlive("left").length || !getAlive("right").length) resetBattle();
  state.running = true;
  state.lastFrame = performance.now();
  applyBattleStartRelics();
  addLog("战斗开始。");
  setBattleState("交战中");
}

function pauseBattle() {
  state.running = false;
  setBattleState("暂停");
}

function tick(now) {
  if (state.running) {
    const delta = Math.min((now - state.lastFrame) / 1000, 0.05);
    state.lastFrame = now;
    updateBattle(delta);
    renderAll();
  } else {
    state.lastFrame = now;
  }
  requestAnimationFrame(tick);
}

function updateBattle(delta) {
  state.elapsed += delta;
  for (const fighter of state.fighters) {
    if (fighter.hp <= 0) continue;
    updateDots(fighter, delta);
    fighter.attackCooldown -= delta;
    fighter.attackFlash = Math.max(0, fighter.attackFlash - delta);
    fighter.attacking = fighter.attackFlash > 0;
    const target = chooseTarget(fighter);
    if (!target) continue;
    const distance = distanceBetween(fighter, target);
    if (distance > fighter.range) moveToward(fighter, target, delta);
    else if (fighter.attackCooldown <= 0) performAttack(fighter, target);
  }
  if (!getAlive("left").length) finishBattle("right");
  if (!getAlive("right").length) finishBattle("left");
}

function updateDots(target, delta) {
  for (const dot of target.dots) {
    dot.remaining -= delta;
    dot.tick -= delta;
    if (dot.tick <= 0 && dot.remaining > 0) {
      dot.tick += 1;
      applyDamage(dot.source, target, [{ type: dot.type, amount: dot.amount, isDot: true }], { canCrit: false, tags: ["dot"] });
    }
  }
  target.dots = target.dots.filter((dot) => dot.remaining > 0);
}

function chooseTarget(fighter) {
  const enemies = getAlive(enemySide(fighter.side));
  if (!enemies.length) return null;
  if (fighter.markedTargetId) {
    const marked = enemies.find((enemy) => enemy.id === fighter.markedTargetId);
    if (marked) return marked;
  }
  if (fighter.classKey === "assassin") {
    return [...enemies].sort((a, b) => fighter.side === "left" ? b.x - a.x : a.x - b.x)[0];
  }
  return [...enemies].sort((a, b) => distanceBetween(fighter, a) - distanceBetween(fighter, b))[0];
}

function moveToward(fighter, target, delta) {
  const distance = distanceBetween(fighter, target);
  const step = Math.min(fighter.speed * delta, distance);
  fighter.x += ((target.x - fighter.x) / distance) * step;
  fighter.y += ((target.y - fighter.y) / distance) * step;
}

function performAttack(attacker, target) {
  attacker.attackCooldown = Math.max(0.28, 1.35 / Math.max(0.25, attacker.stats.attackSpeed));
  attacker.attackFlash = 0.16;
  const entries = createDamageEntries(attacker);
  const crit = Math.random() < attacker.stats.critChance;
  const finalEntries = entries.map((entry) => ({ ...entry, amount: crit ? entry.amount * attacker.stats.critDamage : entry.amount }));
  applyDamage(attacker, target, finalEntries, { canCrit: true, crit, tags: ["attack", "singleTarget"] });
  triggerRelics(attacker, "onHit", { target });
  if (crit) triggerRelics(attacker, "onCrit", { target });
}

function createDamageEntries(attacker) {
  const stats = attacker.stats;
  const entries = [{ type: "physical", amount: stats.attack * (1 + stats.physicalDamageAmp) }];
  if (stats.fireDamage) entries.push({ type: "fire", amount: stats.fireDamage * (1 + stats.fireDamageAmp), duration: 3 * (1 + stats.fireDurationAmp) });
  if (stats.poisonDamage) entries.push({ type: "poison", amount: stats.poisonDamage * (1 + stats.poisonDamageAmp), duration: 4 * (1 + stats.poisonDurationAmp) });
  if (stats.lightningDamage) entries.push({ type: "lightning", amount: stats.lightningDamage * (1 + stats.lightningDamageAmp) });
  if (stats.iceDamage) entries.push({ type: "ice", amount: stats.iceDamage * (1 + stats.iceDamageAmp), slow: stats.iceSlowAmp });
  return entries;
}

function applyDamage(source, target, entries, context) {
  let total = 0;
  for (const entry of entries) {
    const reduced = reduceDamage(target, entry);
    target.hp = Math.max(0, target.hp - reduced);
    total += reduced;
    source.damageDone += reduced;
    triggerDamageTypeRelics(source, entry.type, target, reduced);
    if (entry.duration && !entry.isDot) {
      target.dots.push({ source, type: entry.type, amount: Math.max(1, reduced * 0.22), remaining: entry.duration, tick: 1 });
    }
  }
  if (total > 0 && !context.tags?.includes("dot")) {
    addLog(`${source.side === "left" ? "我方" : "敌方"}${source.index + 1} 攻击 ${target.side === "left" ? "我方" : "敌方"}${target.index + 1}，${context.crit ? "暴击 " : ""}造成 ${Math.round(total)}。`);
  }
  if (target.hp <= 0) onKill(source, target);
}

function reduceDamage(target, entry) {
  const amount = entry.amount;
  if (entry.type === "physical") return Math.max(1, amount * (100 / (100 + target.stats.defense)));
  return Math.max(1, amount * (100 / (100 + target.stats.magicResist)));
}

function triggerDamageTypeRelics(source, type, target, amount) {
  for (const relic of getRelics(source)) {
    if (relic.trigger === `onDamageType:${type}`) applyRelicEffect(source, relic, { target, amount, type });
    if (relic.trigger === `onHit:${type}`) applyRelicEffect(source, relic, { target, amount, type });
  }
}

function triggerRelics(source, trigger, context = {}) {
  for (const relic of getRelics(source)) {
    if (relic.trigger === trigger) applyRelicEffect(source, relic, context);
    if (trigger === "onHit" && relic.trigger === "onHit:sameTarget") applyRelicEffect(source, relic, context);
  }
}

function applyBattleStartRelics() {
  for (const fighter of state.fighters) {
    for (const relic of getRelics(fighter)) {
      if (relic.trigger === "onBattleStart") applyRelicEffect(fighter, relic, {});
    }
  }
}

function applyRelicEffect(source, relic, context) {
  const effect = relic.effect;
  if (effect.addBattleStack) {
    const key = effect.addBattleStack.stat;
    const current = source.battleStacks[key] || 0;
    const max = effect.addBattleStack.maxStacks || 999;
    if (current < max) {
      source.battleStacks[key] = current + 1;
      source.stats[key] = (source.stats[key] || 0) + effect.addBattleStack.value;
    }
  }
  if (effect.createAreaDamage && context.target) {
    createAreaDamage(source, context.target, effect.createAreaDamage);
  }
  if (effect.chainDamage && context.target && Math.random() < effect.chainDamage.chance) {
    chainDamage(source, context.target, effect.chainDamage);
  }
  if (effect.lifeSteal && context.amount) {
    source.hp = Math.min(source.maxHp, source.hp + context.amount * effect.lifeSteal.ratio);
  }
  if (effect.markNearestEnemy) {
    const nearest = chooseTarget(source);
    if (nearest) source.markedTargetId = nearest.id;
  }
}

function createAreaDamage(source, center, config) {
  const enemies = getAlive(enemySide(source.side)).filter((enemy) => distanceBetween(enemy, center) <= config.radius);
  const amount = (config.scaleFromAttack ? source.stats.attack * config.scaleFromAttack : 0) +
    (config.scaleFromMagicPower ? source.stats.magicPower * config.scaleFromMagicPower : 0);
  spawnFx(center.x, center.y, config.type || "fire", config.radius);
  for (const enemy of enemies) {
    applyDamage(source, enemy, [{ type: config.type || "fire", amount: amount * (1 + source.stats.areaDamageAmp) }], { canCrit: false, tags: ["area"] });
  }
}

function chainDamage(source, firstTarget, config) {
  let current = firstTarget;
  let amount = Math.max(4, source.stats.lightningDamage || source.stats.magicPower * 0.4);
  for (let jump = 0; jump < config.jumps; jump += 1) {
    const candidates = getAlive(enemySide(source.side)).filter((enemy) => enemy.id !== current.id);
    if (!candidates.length) break;
    current = candidates.sort((a, b) => distanceBetween(current, a) - distanceBetween(current, b))[0];
    amount *= config.falloff;
    spawnFx(current.x, current.y, "lightning", 70);
    applyDamage(source, current, [{ type: "lightning", amount }], { canCrit: false, tags: ["chain"] });
  }
}

function onKill(source, target) {
  addLog(`${target.side === "left" ? "我方" : "敌方"}${target.index + 1} 倒下。`);
  for (const relic of getRelics(source)) {
    if (relic.trigger === "onKill:fire" && hasDamageType(source, "fire")) applyRelicEffect(source, { effect: { createAreaDamage: relic.effect.createGroundDot } }, { target });
    if (relic.trigger === "onKill:poisoned" && target.dots.some((dot) => dot.type === "poison")) {
      createAreaDamage(source, target, { type: "poison", radius: relic.effect.spreadDot.radius, scaleFromMagicPower: 0.3 });
    }
  }
}

function finishBattle(winnerSide) {
  if (!state.running) return;
  state.running = false;
  setBattleState(`${winnerSide === "left" ? "我方" : "敌方"}胜利`);
  addLog(`${winnerSide === "left" ? "我方" : "敌方"}获胜，用时 ${state.elapsed.toFixed(1)} 秒。`);
}

function renderAll() {
  renderUnits();
  renderSelectedStats();
  els.leftAlive.textContent = String(getAlive("left").length);
  els.rightAlive.textContent = String(getAlive("right").length);
  els.timer.textContent = `${state.elapsed.toFixed(1)}s`;
  els.combatLog.innerHTML = state.log.map((item) => `<div>${item}</div>`).join("");
  els.combatLog.scrollTop = els.combatLog.scrollHeight;
}

function renderUnits() {
  const existing = new Map([...els.unitLayer.children].map((node) => [node.dataset.id, node]));
  for (const fighter of state.fighters) {
    let node = existing.get(String(fighter.id));
    if (!node) {
      node = createUnitNode(fighter);
      els.unitLayer.appendChild(node);
    }
    updateUnitNode(node, fighter);
    existing.delete(String(fighter.id));
  }
  for (const node of existing.values()) node.remove();
}

function createUnitNode(fighter) {
  const node = document.createElement("div");
  node.className = "fighter";
  node.dataset.id = String(fighter.id);
  node.innerHTML = `
    <div class="buffs"></div>
    <div class="body">
      <div class="part head"></div><div class="part torso"></div>
      <div class="part arm left"></div><div class="part arm right"></div>
      <div class="part leg left"></div><div class="part leg right"></div>
      <div class="weapon"></div>
    </div>
    <div class="hp"><span class="hp-fill"></span></div>
    <div class="nameplate"></div>
  `;
  return node;
}

function updateUnitNode(node, fighter) {
  const meta = CLASS_META[fighter.classKey];
  const weapon = meta.weapon;
  node.style.left = `${fighter.x}px`;
  node.style.top = `${fighter.y}px`;
  node.style.setProperty("--class-color", meta.color);
  node.style.setProperty("--lunge", fighter.side === "left" ? "13px" : "-13px");
  for (const [key, value] of Object.entries({
    "--weapon-left": weapon.left, "--weapon-top": weapon.top, "--weapon-width": weapon.width,
    "--weapon-height": weapon.height, "--weapon-radius": weapon.radius, "--weapon-color": weapon.color,
    "--weapon-rotate": weapon.rotate,
  })) node.style.setProperty(key, value);
  node.classList.toggle("dead", fighter.hp <= 0);
  node.classList.toggle("attacking", fighter.attacking);
  node.querySelector(".hp-fill").style.width = `${Math.max(0, fighter.hp / fighter.maxHp * 100)}%`;
  node.querySelector(".nameplate").textContent = `${fighter.side === "left" ? "我方" : "敌方"}${fighter.index + 1} ${fighter.label}`;
  node.querySelector(".buffs").textContent = fighter.dots.map((dot) => dot.type[0].toUpperCase()).join(" ");
}

function renderSelectedStats() {
  const fighter = state.fighters.find((item) => item.id === state.selectedId) || state.fighters[0];
  if (!fighter) return;
  const equipment = state.data.equipmentSets.find((set) => set.id === fighter.equipmentSetId);
  const relicNames = fighter.relicIds.map((id) => getRelic(id)?.name).filter(Boolean).join("、") || "无";
  els.selectedStats.innerHTML = `
    <strong>${fighter.side === "left" ? "我方" : "敌方"}${fighter.index + 1} ${fighter.label}</strong>
    <div>${equipment?.name || "无装备"}</div>
    <div>藏品：${relicNames}</div>
    <div class="stat-grid">
      <span>生命 ${Math.round(fighter.hp)}/${fighter.maxHp}</span><span>输出 ${Math.round(fighter.damageDone)}</span>
      <span>攻击 ${Math.round(fighter.stats.attack)}</span><span>法强 ${Math.round(fighter.stats.magicPower)}</span>
      <span>防御 ${Math.round(fighter.stats.defense)}</span><span>魔抗 ${Math.round(fighter.stats.magicResist)}</span>
      <span>暴击 ${Math.round(fighter.stats.critChance * 100)}%</span><span>攻速 ${fighter.stats.attackSpeed.toFixed(2)}</span>
      <span>火 ${Math.round(fighter.stats.fireDamage || 0)}</span><span>雷 ${Math.round(fighter.stats.lightningDamage || 0)}</span>
      <span>毒 ${Math.round(fighter.stats.poisonDamage || 0)}</span><span>冰 ${Math.round(fighter.stats.iceDamage || 0)}</span>
    </div>
  `;
}

function updatePowerLabels() {
  for (const side of ["left", "right"]) {
    const roster = side === "left" ? els.leftRoster : els.rightRoster;
    for (const card of roster.querySelectorAll(".unit-card")) {
      const spec = {
        classKey: card.querySelector('[data-field="classKey"]').value,
        equipmentSetId: card.querySelector('[data-field="equipmentSetId"]').value,
        relicIds: [...card.querySelectorAll('[data-field="relicIds"]')].map((select) => select.value).filter(Boolean),
      };
      const stats = buildStats(spec);
      card.querySelector(".power").textContent = `战力 ${Math.round(stats.hp / 8 + stats.attack * 2 + stats.magicPower * 1.8 + stats.defense + stats.magicResist)}`;
    }
  }
}

function mergeStats(...sources) {
  const result = { ...EMPTY_STATS };
  for (const source of sources) {
    for (const [key, value] of Object.entries(source || {})) result[key] = (result[key] || 0) + value;
  }
  return result;
}

function getRelic(id) { return state.data.relics.find((relic) => relic.id === id); }
function getRelics(fighter) { return fighter.relicIds.map(getRelic).filter(Boolean); }
function getAlive(side) { return state.fighters.filter((fighter) => fighter.side === side && fighter.hp > 0); }
function enemySide(side) { return side === "left" ? "right" : "left"; }
function distanceBetween(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function pick(items) { return items[Math.floor(Math.random() * items.length)]; }
function shuffle(items) { return [...items].sort(() => Math.random() - 0.5); }
function hasDamageType(fighter, type) { return createDamageEntries(fighter).some((entry) => entry.type === type); }
function setBattleState(text) { els.battleState.textContent = text; }
function addLog(text) { state.log.push(text); state.log = state.log.slice(-100); }
function clearFx() { els.fxLayer.innerHTML = ""; }
function spawnFx(x, y, type, size) {
  const fx = document.createElement("div");
  fx.className = `fx ${type}`;
  fx.style.left = `${x}px`;
  fx.style.top = `${y}px`;
  fx.style.setProperty("--fx-size", `${size}px`);
  els.fxLayer.appendChild(fx);
  setTimeout(() => fx.remove(), 450);
}

setup().catch((error) => {
  setBattleState("加载失败");
  els.combatLog.innerHTML = `<div>${error.message}</div>`;
});
