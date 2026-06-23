const DEFAULTS = {
  left: {
    label: "无效果",
    seconds: 30,
    power: 66,
    armor: 0,
    attackSpeed: 1,
    skillCooldown: 1,
    finalDamage: 0,
    critRate: 0,
    critDamage: 150,
    bloodBonus: 45,
    whirlwindBonus: 30,
    whirlwindSplash: 18,
    roarBonus: 35,
    ultEnabled: 1,
  },
  right: {
    label: "诗人急速",
    seconds: 30,
    power: 66,
    armor: 0,
    attackSpeed: 1.4,
    skillCooldown: 1,
    finalDamage: 0,
    critRate: 0,
    critDamage: 150,
    bloodBonus: 45,
    whirlwindBonus: 30,
    whirlwindSplash: 18,
    roarBonus: 35,
    ultEnabled: 1,
  },
};

const FIELDS = [
  ["label", "方案名", "text", ""],
  ["seconds", "测试秒数", "number", "秒"],
  ["power", "攻击力", "number", ""],
  ["armor", "木桩护甲", "number", ""],
  ["attackSpeed", "普攻冷却流速", "number", "x"],
  ["skillCooldown", "技能冷却倍率", "number", "x"],
  ["finalDamage", "最终伤害增幅", "number", "%"],
  ["critRate", "暴击率", "number", "%"],
  ["critDamage", "暴击伤害", "number", "%"],
  ["bloodBonus", "血怒普攻附伤", "number", "%攻"],
  ["whirlwindBonus", "旋风主目标附伤", "number", "%攻"],
  ["whirlwindSplash", "旋风溅射附伤", "number", "%攻"],
  ["roarBonus", "战吼普攻附伤", "number", "%攻"],
  ["ultEnabled", "启用大招", "number", "0/1"],
];

const state = {
  left: { ...DEFAULTS.left },
  right: { ...DEFAULTS.right },
  timers: [],
};

const els = {
  runBtn: document.querySelector("#runBtn"),
  normalDps: document.querySelector("#normalDps"),
  hasteDps: document.querySelector("#hasteDps"),
  gainDps: document.querySelector("#gainDps"),
  normalStats: document.querySelector("#normalStats"),
  hasteStats: document.querySelector("#hasteStats"),
  normalLane: document.querySelector("#normalLane"),
  hasteLane: document.querySelector("#hasteLane"),
  normalTitle: document.querySelector("#normalTitle"),
  hasteTitle: document.querySelector("#hasteTitle"),
  normalSub: document.querySelector("#normalSub"),
  hasteSub: document.querySelector("#hasteSub"),
  leftConfig: document.querySelector("#leftConfig .form-grid"),
  rightConfig: document.querySelector("#rightConfig .form-grid"),
};

document.querySelector("#leftConfig [data-preset]").addEventListener("click", () => applyPreset("left", "baseline"));
document.querySelector("#rightConfig [data-preset]").addEventListener("click", () => applyPreset("right", "haste"));
els.runBtn.addEventListener("click", run);

renderForms();
run();

function renderForms() {
  els.leftConfig.innerHTML = formHtml("left");
  els.rightConfig.innerHTML = formHtml("right");
  for (const side of ["left", "right"]) {
    const root = side === "left" ? els.leftConfig : els.rightConfig;
    root.addEventListener("input", () => {
      readForm(side);
      run(false);
    });
  }
}

function formHtml(side) {
  const values = state[side];
  return FIELDS.map(([key, label, type, unit]) => `
    <label class="field">
      <span>${label}</span>
      <div>
        <input data-key="${key}" type="${type}" value="${values[key]}" ${type === "number" ? 'step="0.1"' : ""}>
        ${unit ? `<em>${unit}</em>` : ""}
      </div>
    </label>
  `).join("");
}

function readForm(side) {
  const root = side === "left" ? els.leftConfig : els.rightConfig;
  for (const input of root.querySelectorAll("[data-key]")) {
    const key = input.dataset.key;
    state[side][key] = input.type === "number" ? Number(input.value || 0) : input.value;
  }
}

function applyPreset(side, preset) {
  state[side] = preset === "haste" ? { ...DEFAULTS.right } : { ...DEFAULTS.left };
  const root = side === "left" ? els.leftConfig : els.rightConfig;
  root.innerHTML = formHtml(side);
  run();
}

function run(animate = true) {
  readForm("left");
  readForm("right");
  const left = simulate(state.left);
  const right = simulate(state.right);
  renderResult(left, right);
  if (animate) {
    clearPreviewTimers();
    playPreview(els.normalLane, left.events, left.config.seconds);
    playPreview(els.hasteLane, right.events, right.config.seconds);
  }
}

function simulate(config) {
  let time = 0;
  let attackCd = 0;
  let bloodCd = 1;
  let whirlwindCd = 2.6;
  let ultCd = 14;
  let bloodFury = 0;
  let whirlwind = 0;
  let roarFury = 0;
  let hasteWindow = 0;
  const dt = 0.02;
  const counts = { basics: 0, bloods: 0, whirls: 0, ults: 0, crits: 0 };
  const buckets = { basic: 0, blood: 0, whirlwind: 0, roar: 0, splash: 0 };
  const events = [];

  while (time < config.seconds) {
    const attackSpeed = Math.max(0.05, config.attackSpeed) * (hasteWindow > 0 ? 1.4 : 1);
    attackCd -= dt * attackSpeed;
    bloodCd = Math.max(0, bloodCd - dt);
    whirlwindCd = Math.max(0, whirlwindCd - dt);
    ultCd = Math.max(0, ultCd - dt);
    bloodFury = Math.max(0, bloodFury - dt);
    whirlwind = Math.max(0, whirlwind - dt);
    roarFury = Math.max(0, roarFury - dt);
    hasteWindow = Math.max(0, hasteWindow - dt);

    if (config.ultEnabled > 0 && ultCd <= 0) {
      bloodFury = Math.max(bloodFury, 6);
      whirlwind = Math.max(whirlwind, 6);
      roarFury = 6;
      hasteWindow = 6;
      counts.ults += 1;
      events.push({ time, value: 0, type: "不死战吼" });
      ultCd = 24;
    } else if (bloodCd <= 0) {
      bloodFury = 4;
      counts.bloods += 1;
      events.push({ time, value: 0, type: "血怒斩" });
      bloodCd = 5.2 * Math.max(0.05, config.skillCooldown);
    } else if (whirlwindCd <= 0) {
      whirlwind = 5;
      counts.whirls += 1;
      events.push({ time, value: 0, type: "裂骨旋风" });
      whirlwindCd = 8.4 * Math.max(0.05, config.skillCooldown);
    } else if (attackCd <= 0) {
      counts.basics += 1;
      const parts = [];
      parts.push(addDamage("basic", 10 + config.power * 0.22, config, time, 3, buckets, counts));
      if (bloodFury > 0) {
        parts.push(addDamage("blood", config.power * config.bloodBonus / 100, config, time, 11, buckets, counts));
      }
      if (whirlwind > 0) {
        parts.push(addDamage("whirlwind", config.power * config.whirlwindBonus / 100, config, time, 17, buckets, counts));
        parts.push(addDamage("splash", config.power * config.whirlwindSplash / 100 * 2, config, time, 23, buckets, counts));
      }
      if (roarFury > 0) {
        parts.push(addDamage("roar", config.power * config.roarBonus / 100, config, time, 31, buckets, counts));
      }
      const total = parts.reduce((sum, item) => sum + item.damage, 0);
      const crit = parts.some((item) => item.crit);
      events.push({ time, value: total, type: crit ? "普攻 暴击" : "普攻" });
      attackCd = 1.35;
    }
    time += dt;
  }

  const damage = Object.values(buckets).reduce((sum, item) => sum + item, 0);
  return {
    config,
    damage,
    dps: damage / config.seconds,
    ...counts,
    buckets,
    events,
  };
}

function addDamage(bucket, raw, config, time, salt, buckets, counts) {
  const value = hitValue(raw, config, time, salt);
  buckets[bucket] += value.damage;
  if (value.crit) counts.crits += 1;
  return value;
}

function hitValue(raw, config, time, salt) {
  let damage = Math.max(1, raw - config.armor * 0.7);
  damage *= 1 + config.finalDamage / 100;
  const crit = deterministicCrit(time, salt, config.critRate);
  if (crit) damage *= config.critDamage / 100;
  return { damage, crit };
}

function deterministicCrit(time, salt, critRate) {
  if (critRate <= 0) return false;
  const seed = Math.sin((time * 997 + salt * 37.7) * 12.9898) * 43758.5453;
  return (seed - Math.floor(seed)) < critRate / 100;
}

function renderResult(left, right) {
  const gain = left.dps === 0 ? 0 : ((right.dps / left.dps - 1) * 100);
  els.normalDps.textContent = left.dps.toFixed(1);
  els.hasteDps.textContent = right.dps.toFixed(1);
  els.gainDps.textContent = `${gain >= 0 ? "+" : ""}${gain.toFixed(1)}%`;
  els.normalTitle.textContent = state.left.label || "左侧狂战";
  els.hasteTitle.textContent = state.right.label || "右侧狂战";
  els.normalSub.textContent = summaryText(state.left);
  els.hasteSub.textContent = summaryText(state.right);
  els.normalStats.innerHTML = statsHtml(left);
  els.hasteStats.innerHTML = statsHtml(right);
  els.hasteLane.classList.toggle("haste", state.right.attackSpeed > 1.01 || state.right.skillCooldown < 0.99);
  els.normalLane.classList.toggle("haste", state.left.attackSpeed > 1.01 || state.left.skillCooldown < 0.99);
}

function summaryText(config) {
  return `攻速 x${config.attackSpeed} · 技冷 x${config.skillCooldown} · 增伤 ${config.finalDamage}%`;
}

function statsHtml(result) {
  const total = Math.max(1, result.damage);
  const rows = [
    ["总伤害", Math.round(result.damage)],
    ["普攻次数", result.basics],
    ["血怒/旋风/大招", `${result.bloods}/${result.whirls}/${result.ults}`],
    ["暴击", result.crits],
  ];
  const bars = [
    ["普攻基础", result.buckets.basic, "basic"],
    ["血怒附伤", result.buckets.blood, "blood"],
    ["旋风主伤", result.buckets.whirlwind, "whirl"],
    ["战吼附伤", result.buckets.roar, "roar"],
    ["旋风溅射", result.buckets.splash, "splash"],
  ].map(([label, value, cls]) => `
    <div class="damage-row ${cls}">
      <span>${label}</span>
      <strong>${Math.round(value)}</strong>
      <i style="width:${Math.round(value / total * 100)}%"></i>
    </div>
  `).join("");
  return `${rows.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join("")}<section class="damage-breakdown">${bars}</section>`;
}

function clearPreviewTimers() {
  state.timers.forEach((timer) => clearTimeout(timer));
  state.timers = [];
}

function playPreview(lane, events, seconds) {
  const fighter = lane.querySelector(".fighter");
  const dummy = lane.querySelector(".dummy");
  const fx = lane.querySelector(".fx-layer");
  fx.innerHTML = "";
  fighter.classList.remove("swing");
  dummy.classList.remove("hit");
  const previewWindow = Math.min(8, Math.max(3, seconds));
  const previewEvents = events.filter((event) => event.time <= previewWindow);
  const playbackScale = 700;
  previewEvents.forEach((event) => {
    const timer = setTimeout(() => {
      if (event.value <= 0) {
        spawnStateFx(fx, event);
        return;
      }
      fighter.classList.remove("swing");
      dummy.classList.remove("hit");
      void fighter.offsetWidth;
      fighter.classList.add("swing");
      dummy.classList.add("hit");
      spawnFx(fx, event);
    }, event.time * playbackScale);
    state.timers.push(timer);
  });
}

function spawnFx(fx, event) {
  const slash = document.createElement("div");
  slash.className = "slash";
  fx.appendChild(slash);
  state.timers.push(setTimeout(() => slash.remove(), 340));

  const floater = document.createElement("div");
  floater.className = "float";
  floater.textContent = `${event.type} -${Math.round(event.value)}`;
  fx.appendChild(floater);
  state.timers.push(setTimeout(() => floater.remove(), 820));
}

function spawnStateFx(fx, event) {
  const floater = document.createElement("div");
  floater.className = "float state-float";
  floater.textContent = event.type;
  fx.appendChild(floater);
  state.timers.push(setTimeout(() => floater.remove(), 900));
}
