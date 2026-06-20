const CLASS_RULES = {
  tank: {
    label: "坦克",
    note: "高生命，短距离牵制，吸收伤害。",
    hp: 180,
    damage: 15,
    range: 48,
    speed: 34,
    attackSpeed: 1.05,
    color: "#7d91a4",
    weapon: {
      left: "36px",
      top: "32px",
      width: "24px",
      height: "30px",
      radius: "4px",
      color: "#8c7c62",
      rotate: "0deg",
    },
  },
  warrior: {
    label: "战士",
    note: "均衡近战，稳定输出，适合前排。",
    hp: 130,
    damage: 24,
    range: 52,
    speed: 48,
    attackSpeed: 0.85,
    color: "#b77745",
    weapon: {
      left: "42px",
      top: "20px",
      width: "7px",
      height: "44px",
      radius: "2px",
      color: "#c7cbd0",
      rotate: "-24deg",
    },
  },
  assassin: {
    label: "刺客",
    note: "高速低血，优先切后排，爆发高。",
    hp: 90,
    damage: 34,
    range: 46,
    speed: 76,
    attackSpeed: 0.62,
    color: "#6b5aa7",
    weapon: {
      left: "40px",
      top: "36px",
      width: "24px",
      height: "6px",
      radius: "2px",
      color: "#d5d7dc",
      rotate: "-18deg",
    },
  },
  mage: {
    label: "法师",
    note: "远程法术，血量低，能隔空攻击。",
    hp: 82,
    damage: 29,
    range: 190,
    speed: 30,
    attackSpeed: 1.18,
    color: "#497dc3",
    weapon: {
      left: "43px",
      top: "18px",
      width: "6px",
      height: "52px",
      radius: "4px",
      color: "#c9a85b",
      rotate: "-12deg",
    },
  },
};

const TEAM_NAMES = {
  left: "我方",
  right: "敌方",
};

const state = {
  running: false,
  elapsed: 0,
  lastFrame: 0,
  fighters: [],
  nextId: 1,
  log: [],
};

const els = {
  leftCount: document.querySelector("#leftCount"),
  rightCount: document.querySelector("#rightCount"),
  leftRoster: document.querySelector("#leftRoster"),
  rightRoster: document.querySelector("#rightRoster"),
  startBtn: document.querySelector("#startBtn"),
  pauseBtn: document.querySelector("#pauseBtn"),
  resetBtn: document.querySelector("#resetBtn"),
  battlefield: document.querySelector("#battlefield"),
  unitLayer: document.querySelector("#unitLayer"),
  leftAlive: document.querySelector("#leftAlive"),
  rightAlive: document.querySelector("#rightAlive"),
  battleState: document.querySelector("#battleState"),
  battleTimer: document.querySelector("#battleTimer"),
  combatLog: document.querySelector("#combatLog"),
};

const defaultClasses = ["tank", "warrior", "assassin", "mage"];

function setup() {
  fillCountSelect(els.leftCount, 3);
  fillCountSelect(els.rightCount, 3);
  renderRoster("left");
  renderRoster("right");
  resetBattle();

  els.leftCount.addEventListener("change", () => {
    renderRoster("left");
    resetBattle();
  });
  els.rightCount.addEventListener("change", () => {
    renderRoster("right");
    resetBattle();
  });
  els.leftRoster.addEventListener("change", resetBattle);
  els.rightRoster.addEventListener("change", resetBattle);
  els.startBtn.addEventListener("click", startBattle);
  els.pauseBtn.addEventListener("click", pauseBattle);
  els.resetBtn.addEventListener("click", resetBattle);

  requestAnimationFrame(tick);
}

function fillCountSelect(select, selected) {
  for (let count = 1; count <= 4; count += 1) {
    const option = document.createElement("option");
    option.value = String(count);
    option.textContent = String(count);
    option.selected = count === selected;
    select.appendChild(option);
  }
}

function renderRoster(side) {
  const count = getCount(side);
  const roster = side === "left" ? els.leftRoster : els.rightRoster;
  const existing = getSelectedClasses(side);
  roster.innerHTML = "";

  for (let index = 0; index < count; index += 1) {
    const selectedClass = existing[index] || defaultClasses[index] || "warrior";
    const card = document.createElement("div");
    card.className = "unit-card";
    card.innerHTML = `
      <strong>${TEAM_NAMES[side]} ${index + 1}</strong>
      <select data-side="${side}" data-index="${index}">
        ${Object.entries(CLASS_RULES)
          .map(([key, rule]) => `<option value="${key}">${rule.label}</option>`)
          .join("")}
      </select>
      <div class="class-note"></div>
    `;

    const select = card.querySelector("select");
    select.value = selectedClass;
    updateClassNote(card, selectedClass);
    select.addEventListener("change", () => updateClassNote(card, select.value));
    roster.appendChild(card);
  }
}

function updateClassNote(card, classKey) {
  card.querySelector(".class-note").textContent = CLASS_RULES[classKey].note;
}

function getCount(side) {
  return Number(side === "left" ? els.leftCount.value : els.rightCount.value);
}

function getSelectedClasses(side) {
  const roster = side === "left" ? els.leftRoster : els.rightRoster;
  return [...roster.querySelectorAll("select")].map((select) => select.value);
}

function resetBattle() {
  state.running = false;
  state.elapsed = 0;
  state.lastFrame = 0;
  state.nextId = 1;
  state.fighters = createFighters();
  state.log = ["战斗已重置。"];
  renderAll();
  setBattleState("待命");
}

function createFighters() {
  const width = els.battlefield.clientWidth || 720;
  const height = els.battlefield.clientHeight || 460;
  const teams = [
    { side: "left", classes: getSelectedClasses("left"), x: width * 0.18 },
    { side: "right", classes: getSelectedClasses("right"), x: width * 0.82 },
  ];

  return teams.flatMap((team) => {
    const spacing = height / (team.classes.length + 1);
    return team.classes.map((classKey, index) => {
      const rules = CLASS_RULES[classKey];
      return {
        id: state.nextId++,
        side: team.side,
        classKey,
        label: rules.label,
        maxHp: rules.hp,
        hp: rules.hp,
        damage: rules.damage,
        range: rules.range,
        speed: rules.speed,
        attackSpeed: rules.attackSpeed,
        attackCooldown: 0.35 + index * 0.18,
        x: team.x,
        y: spacing * (index + 1),
        spawnX: team.x,
        spawnY: spacing * (index + 1),
        attacking: false,
        attackFlash: 0,
      };
    });
  });
}

function startBattle() {
  if (getAlive("left").length === 0 || getAlive("right").length === 0) {
    resetBattle();
  }
  state.running = true;
  state.lastFrame = performance.now();
  setBattleState("交战中");
  addLog("战斗开始。");
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
    if (fighter.hp <= 0) {
      continue;
    }

    fighter.attackCooldown -= delta;
    fighter.attackFlash = Math.max(0, fighter.attackFlash - delta);
    fighter.attacking = fighter.attackFlash > 0;

    const target = chooseTarget(fighter);
    if (!target) {
      finishBattle(fighter.side);
      return;
    }

    const distance = getDistance(fighter, target);
    if (distance > fighter.range) {
      moveToward(fighter, target, delta);
    } else if (fighter.attackCooldown <= 0) {
      attack(fighter, target);
    }
  }

  if (getAlive("left").length === 0) {
    finishBattle("right");
  } else if (getAlive("right").length === 0) {
    finishBattle("left");
  }
}

function chooseTarget(fighter) {
  const enemies = getAlive(fighter.side === "left" ? "right" : "left");
  if (enemies.length === 0) {
    return null;
  }

  if (fighter.classKey === "assassin") {
    const sortedByBackline = [...enemies].sort((a, b) => {
      return fighter.side === "left" ? b.x - a.x : a.x - b.x;
    });
    return sortedByBackline[0];
  }

  return enemies.sort((a, b) => getDistance(fighter, a) - getDistance(fighter, b))[0];
}

function moveToward(fighter, target, delta) {
  const distance = getDistance(fighter, target);
  if (distance <= 1) {
    return;
  }
  const step = Math.min(fighter.speed * delta, distance);
  fighter.x += ((target.x - fighter.x) / distance) * step;
  fighter.y += ((target.y - fighter.y) / distance) * step;
}

function attack(attacker, target) {
  const variance = 0.86 + Math.random() * 0.28;
  const damage = Math.round(attacker.damage * variance);
  target.hp = Math.max(0, target.hp - damage);
  attacker.attackCooldown = attacker.attackSpeed;
  attacker.attackFlash = 0.16;

  addLog(
    `${TEAM_NAMES[attacker.side]}${attacker.id} ${attacker.label} 攻击 ${TEAM_NAMES[target.side]}${target.id}，造成 ${damage} 伤害。`
  );

  if (target.hp <= 0) {
    addLog(`${TEAM_NAMES[target.side]}${target.id} ${target.label} 倒下。`);
  }
}

function finishBattle(winnerSide) {
  state.running = false;
  setBattleState(`${TEAM_NAMES[winnerSide]}胜利`);
  addLog(`${TEAM_NAMES[winnerSide]}获胜，用时 ${state.elapsed.toFixed(1)} 秒。`);
}

function getAlive(side) {
  return state.fighters.filter((fighter) => fighter.side === side && fighter.hp > 0);
}

function getDistance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function renderAll() {
  renderUnits();
  els.leftAlive.textContent = String(getAlive("left").length);
  els.rightAlive.textContent = String(getAlive("right").length);
  els.battleTimer.textContent = `${state.elapsed.toFixed(1)}s`;
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

  for (const node of existing.values()) {
    node.remove();
  }
}

function createUnitNode(fighter) {
  const node = document.createElement("div");
  node.className = "fighter";
  node.dataset.id = String(fighter.id);
  node.innerHTML = `
    <div class="body">
      <div class="part head"></div>
      <div class="part torso"></div>
      <div class="part arm left"></div>
      <div class="part arm right"></div>
      <div class="part leg left"></div>
      <div class="part leg right"></div>
      <div class="weapon"></div>
    </div>
    <div class="hp"><span class="hp-fill"></span></div>
    <div class="nameplate"></div>
  `;
  return node;
}

function updateUnitNode(node, fighter) {
  const rules = CLASS_RULES[fighter.classKey];
  const weapon = rules.weapon;
  node.style.left = `${fighter.x}px`;
  node.style.top = `${fighter.y}px`;
  node.style.setProperty("--class-color", rules.color);
  node.style.setProperty("--lunge", fighter.side === "left" ? "12px" : "-12px");
  node.style.setProperty("--weapon-left", weapon.left);
  node.style.setProperty("--weapon-top", weapon.top);
  node.style.setProperty("--weapon-width", weapon.width);
  node.style.setProperty("--weapon-height", weapon.height);
  node.style.setProperty("--weapon-radius", weapon.radius);
  node.style.setProperty("--weapon-color", weapon.color);
  node.style.setProperty("--weapon-rotate", weapon.rotate);
  node.classList.toggle("dead", fighter.hp <= 0);
  node.classList.toggle("attacking", fighter.attacking);
  node.querySelector(".hp-fill").style.width = `${(fighter.hp / fighter.maxHp) * 100}%`;
  node.querySelector(".nameplate").textContent = `${TEAM_NAMES[fighter.side]}${fighter.id} ${fighter.label}`;
}

function setBattleState(text) {
  els.battleState.textContent = text;
}

function addLog(text) {
  state.log.push(text);
  state.log = state.log.slice(-80);
}

setup();

