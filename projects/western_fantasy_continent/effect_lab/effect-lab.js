const state = {
  mode: "css",
  particles: [],
  raf: 0,
  lastTime: performance.now(),
  pixi: null,
  premium: null,
};

const MODE_META = {
  css: {
    title: "CSS 特效",
    note: "轻量、好接入 DOM 战斗，适合护盾、闪光、斩击这种短反馈。",
    advice: "适合先接小战斗，成本最低。",
  },
  canvas: {
    title: "Canvas 粒子",
    note: "用粒子、混合模式和模糊做火焰、冰晶、爆炸、冲击波。",
    advice: "适合打击、爆炸、持续伤害和大范围反馈。",
  },
  js: {
    title: "JS 调度层",
    note: "统一 playEffect API，把 CSS、Canvas 和单位动作编排成技能反馈。",
    advice: "最适合接战斗逻辑，之后所有技能都只调用一个函数。",
  },
  pixi: {
    title: "PixiJS / 高级渲染",
    note: "优先用 PixiJS WebGL 舞台；加载失败会降级成高级 Canvas。",
    advice: "适合后期独立战斗渲染器，表现上限最高。",
  },
};

const els = {
  modeList: document.querySelector("#modeList"),
  effectButtons: document.querySelector("#effectButtons"),
  premiumButtons: document.querySelector("#premiumButtons"),
  stage: document.querySelector("#stage"),
  domLayer: document.querySelector("#domLayer"),
  pixiLayer: document.querySelector("#pixiLayer"),
  canvas: document.querySelector("#particleCanvas"),
  caster: document.querySelector("#caster"),
  target: document.querySelector("#target"),
  modeTitle: document.querySelector("#modeTitle"),
  modeNote: document.querySelector("#modeNote"),
  readoutMode: document.querySelector("#readoutMode"),
  readoutEffect: document.querySelector("#readoutEffect"),
  readoutAdvice: document.querySelector("#readoutAdvice"),
  clearBtn: document.querySelector("#clearBtn"),
};

const ctx = els.canvas.getContext("2d");

function setup() {
  bindEvents();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(tick);
  updateModeUi();
}

function bindEvents() {
  els.modeList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-mode]");
    if (!button) return;
    state.mode = button.dataset.mode;
    updateModeUi();
    clearStage();
  });

  els.effectButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-effect]");
    if (!button) return;
    playSelected(button.dataset.effect);
  });

  els.premiumButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-premium]");
    if (!button) return;
    if (button.dataset.premium === "noiseSlash") playNoiseSlash();
    if (button.dataset.premium === "sheetSlash") playSheetSlash();
  });

  els.clearBtn.addEventListener("click", clearStage);
}

function updateModeUi() {
  const meta = MODE_META[state.mode];
  els.modeList.querySelectorAll("[data-mode]").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  els.modeTitle.textContent = meta.title;
  els.modeNote.textContent = meta.note;
  els.readoutMode.textContent = meta.title;
  els.readoutAdvice.textContent = meta.advice;
}

function resizeCanvas() {
  const rect = els.stage.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  els.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  els.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  els.canvas.style.width = `${rect.width}px`;
  els.canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (state.pixi?.renderer) {
    state.pixi.renderer.resize(rect.width, rect.height);
  }
}

function stagePoint(kind) {
  const rect = els.stage.getBoundingClientRect();
  const target = els.target.getBoundingClientRect();
  const caster = els.caster.getBoundingClientRect();
  const center = kind === "caster" ? caster : target;
  return {
    x: center.left - rect.left + center.width / 2,
    y: center.top - rect.top + center.height / 2,
  };
}

function playSelected(effect) {
  els.readoutEffect.textContent = effectName(effect);
  if (effect === "combo") {
    playCombo();
    return;
  }
  if (state.mode === "css") playCssEffect(effect);
  if (state.mode === "canvas") playCanvasEffect(effect);
  if (state.mode === "js") playJsEffect(effect);
  if (state.mode === "pixi") playPixiEffect(effect);
}

function playCombo() {
  const items = ["slash", "explosion", "freeze", "shield"];
  items.forEach((item, index) => {
    setTimeout(() => {
      if (state.mode === "css") playCssEffect(item);
      if (state.mode === "canvas") playCanvasEffect(item);
      if (state.mode === "js") playJsEffect(item);
      if (state.mode === "pixi") playPixiEffect(item);
    }, index * 520);
  });
}

function effectName(effect) {
  return ({ slash: "刀挥击", explosion: "爆炸", freeze: "冰冻", shield: "护盾", combo: "播放整套" })[effect] || effect;
}

function playCssEffect(effect) {
  resetUnitState();
  const target = stagePoint("target");
  const caster = stagePoint("caster");
  if (effect === "slash") {
    hitTarget();
    spawnDom("css-slash", caster.x + 180, caster.y - 34, 220, 110, 520);
  }
  if (effect === "explosion") {
    hitTarget();
    spawnDom("css-explosion", target.x, target.y, 180, 180, 760);
  }
  if (effect === "freeze") {
    freezeTarget(900);
    spawnDom("css-freeze", target.x, target.y, 150, 150, 940);
  }
  if (effect === "shield") {
    shieldTarget(1050);
    spawnDom("css-shield", target.x, target.y, 170, 170, 1050);
  }
}

function playCanvasEffect(effect) {
  resetUnitState();
  const target = stagePoint("target");
  const caster = stagePoint("caster");
  if (effect === "slash") {
    hitTarget();
    emitSlash(caster.x + 95, caster.y - 8, target.x - 20, target.y - 28, "#fff0b6");
  }
  if (effect === "explosion") {
    hitTarget();
    emitExplosion(target.x, target.y, 58, "fire");
  }
  if (effect === "freeze") {
    freezeTarget(1100);
    emitFreeze(target.x, target.y, 44);
  }
  if (effect === "shield") {
    shieldTarget(1200);
    emitShield(target.x, target.y, 26);
  }
}

function playJsEffect(effect) {
  playEffect(effect, {
    source: stagePoint("caster"),
    target: stagePoint("target"),
    power: effect === "explosion" ? 1.35 : 1,
  });
}

function playPixiEffect(effect) {
  resetUnitState();
  ensurePixi().then((ok) => {
    if (!ok) {
      playAdvancedCanvasFallback(effect);
      return;
    }
    const target = stagePoint("target");
    const caster = stagePoint("caster");
    if (effect === "slash") pixiSlash(caster, target);
    if (effect === "explosion") pixiExplosion(target);
    if (effect === "freeze") pixiFreeze(target);
    if (effect === "shield") pixiShield(target);
  });
}

function playEffect(effect, options) {
  resetUnitState();
  const { source, target, power } = options;
  if (effect === "slash") {
    swingCaster();
    emitSlash(source.x + 86, source.y - 6, target.x - 18, target.y - 28, "#fff0b6");
    setTimeout(hitTarget, 120);
    setTimeout(() => spawnDom("js-rune", target.x, target.y - 90, 48, 48, 520, "斩"), 80);
  }
  if (effect === "explosion") {
    spawnDom("js-rune", target.x, target.y - 84, 54, 54, 520, "爆");
    setTimeout(() => emitExplosion(target.x, target.y, Math.round(72 * power), "fire"), 120);
    setTimeout(hitTarget, 150);
  }
  if (effect === "freeze") {
    emitFreeze(target.x, target.y, 52);
    setTimeout(() => freezeTarget(1400), 80);
    setTimeout(() => spawnDom("js-ring", target.x, target.y, 150, 150, 900), 60);
  }
  if (effect === "shield") {
    shieldTarget(1500);
    emitShield(target.x, target.y, 36);
    spawnDom("js-rune", target.x, target.y - 96, 54, 54, 800, "守");
  }
}

function playAdvancedCanvasFallback(effect) {
  const target = stagePoint("target");
  const caster = stagePoint("caster");
  if (effect === "slash") {
    emitSlash(caster.x + 80, caster.y - 22, target.x, target.y - 24, "#d9b7ff", 2);
    emitSlash(caster.x + 70, caster.y + 2, target.x - 10, target.y - 3, "#fff0b6", 1);
    hitTarget();
  }
  if (effect === "explosion") {
    emitExplosion(target.x, target.y, 90, "arcane");
    hitTarget();
  }
  if (effect === "freeze") {
    emitFreeze(target.x, target.y, 70);
    freezeTarget(1400);
  }
  if (effect === "shield") {
    emitShield(target.x, target.y, 52);
    shieldTarget(1500);
  }
}

function playNoiseSlash() {
  clearStage();
  els.readoutEffect.textContent = "Noise 3D 斩击";
  els.readoutMode.textContent = "Procedural Noise";
  els.readoutAdvice.textContent = "适合 3D/VFX 方向：用噪声控制边缘、能量流动和溶解。";
  resetUnitState();
  swingCaster();
  const { source, impact } = slashAimPoints();
  state.premium = {
    type: "noiseSlash",
    source,
    target: impact,
    start: performance.now(),
    duration: 720,
    impact: false,
  };
}

function drawNoiseSlashFrame(source, target, t) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const alpha = t < 0.18 ? t / 0.18 : Math.max(0, 1 - (t - 0.18) / 0.82);
  const sweep = easeOutCubic(t);
  const angle = 0.42;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const centerX = target.x - 18;
  const centerY = target.y - 8;
  const reveal = 0.35 + sweep * 0.65;

  for (let band = 0; band < 18; band += 1) {
    const p = band / 17;
    const jitter = fractalNoise(p * 8.3, t * 7.1) * 22 - 11;
    const width = 30 * (1 - p) + 3;
    const hue = 188 + p * 52 + Math.sin(t * 8) * 14;
    ctx.beginPath();
    for (let i = 0; i <= 48; i += 1) {
      const q = i / 48;
      const n = fractalNoise(q * 6 + band, t * 9 + band * 0.21);
      const head = Math.min(1, q * reveal);
      const theta = -2.15 + head * 3.05;
      const radiusX = 118 + p * 24 + jitter * 0.28;
      const radiusY = 52 + p * 8;
      const localX = Math.cos(theta) * radiusX + n * 18;
      const localY = Math.sin(theta) * radiusY + jitter + n * 12;
      const x = centerX + ca * localX - sa * localY;
      const y = centerY + sa * localX + ca * localY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsla(${hue}, 100%, ${70 + p * 18}%, ${alpha * (0.55 - p * 0.025)})`;
    ctx.lineWidth = width;
    ctx.shadowColor = `hsl(${hue}, 100%, 70%)`;
    ctx.shadowBlur = 26;
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(255,255,255,${alpha * 0.72})`;
  ctx.beginPath();
  ctx.ellipse(target.x - 8, target.y + 2, 30 * alpha, 64 * alpha, angle + 1.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 4; i += 1) {
    const q = Math.random();
    const theta = -2.15 + q * 3.05;
    const localX = Math.cos(theta) * 118;
    const localY = Math.sin(theta) * 52;
    particle(
      centerX + ca * localX - sa * localY,
      centerY + sa * localX + ca * localY,
      {
        vx: 90 + Math.random() * 150,
        vy: -90 + Math.random() * 180,
        life: 280 + Math.random() * 260,
        size: 4 + Math.random() * 10,
        color: Math.random() < 0.5 ? "#9dfcff" : "#d7b7ff",
      },
    );
  }

}

function playSheetSlash() {
  clearStage();
  els.readoutEffect.textContent = "Sheet 2D 斩击";
  els.readoutMode.textContent = "Texture Atlas / Sheet";
  els.readoutAdvice.textContent = "适合 2D 方向：用图集决定美术形状，代码只负责节奏、缩放、发光。";
  resetUnitState();
  swingCaster();
  const atlas = createSlashAtlas();
  const { source, impact } = slashAimPoints();
  state.premium = {
    type: "sheetSlash",
    atlas,
    source,
    target: impact,
    start: performance.now(),
    duration: atlas.frames * 42,
    impact: false,
  };
}

function createSlashAtlas() {
  const frames = 12;
  const frameW = 320;
  const frameH = 190;
  const canvas = document.createElement("canvas");
  canvas.width = frameW * frames;
  canvas.height = frameH;
  const g = canvas.getContext("2d");
  for (let f = 0; f < frames; f += 1) {
    const p = f / (frames - 1);
    const ox = f * frameW;
    const alpha = p < 0.22 ? p / 0.22 : Math.max(0, 1 - (p - 0.22) / 0.78);
    g.save();
    g.translate(ox + frameW * 0.5, frameH * 0.56);
    g.rotate(-0.18 + p * 0.14);
    g.globalCompositeOperation = "lighter";
    drawSlashShape(g, frameW, frameH, alpha, p, "#fff7cc", "#74eaff");
    drawSlashShape(g, frameW * 0.86, frameH * 0.58, alpha * 0.65, p + 0.13, "#d7b7ff", "#6efff2");
    g.restore();
  }
  return { canvas, frames, frameW, frameH };
}

function drawSlashShape(g, width, height, alpha, p, core, edge) {
  const grad = g.createLinearGradient(-width * 0.42, -height * 0.18, width * 0.46, height * 0.16);
  grad.addColorStop(0, `rgba(255,255,255,0)`);
  grad.addColorStop(0.18, hexToRgba(edge, alpha * 0.45));
  grad.addColorStop(0.46, hexToRgba(core, alpha));
  grad.addColorStop(0.72, hexToRgba(edge, alpha * 0.62));
  grad.addColorStop(1, `rgba(255,255,255,0)`);
  g.fillStyle = grad;
  g.shadowColor = edge;
  g.shadowBlur = 28;
  g.beginPath();
  g.moveTo(-width * 0.48, height * 0.06);
  g.bezierCurveTo(-width * 0.18, -height * (0.42 + p * 0.08), width * 0.2, -height * 0.5, width * 0.49, -height * 0.08);
  g.bezierCurveTo(width * 0.18, -height * 0.12, -width * 0.08, height * 0.08, -width * 0.48, height * 0.06);
  g.closePath();
  g.fill();

  g.strokeStyle = hexToRgba("#ffffff", alpha * 0.88);
  g.lineWidth = 3 + p * 5;
  g.beginPath();
  g.moveTo(-width * 0.38, height * 0.01);
  g.bezierCurveTo(-width * 0.08, -height * 0.34, width * 0.22, -height * 0.34, width * 0.42, -height * 0.08);
  g.stroke();

  g.strokeStyle = hexToRgba(edge, alpha * 0.42);
  g.lineWidth = 9;
  g.beginPath();
  g.moveTo(-width * 0.42, height * 0.11);
  g.bezierCurveTo(-width * 0.05, -height * 0.16, width * 0.22, -height * 0.18, width * 0.5, height * 0.04);
  g.stroke();
}

function fractalNoise(x, y) {
  return (
    valueNoise(x, y) * 0.58 +
    valueNoise(x * 2.13 + 7.1, y * 2.07 - 4.3) * 0.28 +
    valueNoise(x * 4.01 - 2.8, y * 3.77 + 5.2) * 0.14
  );
}

function valueNoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = randomHash(xi, yi);
  const b = randomHash(xi + 1, yi);
  const c = randomHash(xi, yi + 1);
  const d = randomHash(xi + 1, yi + 1);
  return lerp(lerp(a, b, u), lerp(c, d, u), v);
}

function randomHash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgba(hex, alpha) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function spawnDom(className, x, y, width, height, ttl, text = "") {
  const node = document.createElement("div");
  node.className = `effect-node ${className}`;
  node.style.setProperty("--x", `${x}px`);
  node.style.setProperty("--y", `${y}px`);
  node.style.setProperty("--size", `${Math.max(width, height)}px`);
  node.style.width = `${width}px`;
  node.style.height = `${height}px`;
  node.textContent = text;
  els.domLayer.appendChild(node);
  setTimeout(() => node.remove(), ttl);
  return node;
}

function hitTarget() {
  els.target.classList.remove("hit");
  els.stage.classList.remove("shake");
  void els.target.offsetWidth;
  els.target.classList.add("hit");
  els.stage.classList.add("shake");
  setTimeout(() => els.target.classList.remove("hit"), 260);
  setTimeout(() => els.stage.classList.remove("shake"), 200);
}

function freezeTarget(ms) {
  els.target.classList.add("frozen");
  setTimeout(() => els.target.classList.remove("frozen"), ms);
}

function shieldTarget(ms) {
  els.target.classList.add("shielded");
  setTimeout(() => els.target.classList.remove("shielded"), ms);
}

function swingCaster() {
  els.caster.animate([
    { transform: "translate(-50%, -50%) translateX(0)" },
    { transform: "translate(-50%, -50%) translateX(52px) translateY(-4px) rotate(3deg)", offset: 0.34 },
    { transform: "translate(-50%, -50%) translateX(24px) translateY(2px) rotate(-2deg)", offset: 0.58 },
    { transform: "translate(-50%, -50%) translateX(0)" },
  ], { duration: 360, easing: "cubic-bezier(.16,.86,.22,1)" });
}

function resetUnitState() {
  els.target.classList.remove("hit", "frozen", "shielded");
}

function particle(x, y, options = {}) {
  state.particles.push({
    x,
    y,
    vx: options.vx || 0,
    vy: options.vy || 0,
    life: options.life || 700,
    maxLife: options.life || 700,
    size: options.size || 6,
    color: options.color || "#fff",
    type: options.type || "dot",
    spin: options.spin || 0,
    gravity: options.gravity || 0,
    width: options.width || 80,
  });
}

function emitExplosion(x, y, count = 48, palette = "fire") {
  const colors = palette === "arcane"
    ? ["#fff3ff", "#d9b7ff", "#895dff", "#55e7ff"]
    : ["#fff6a7", "#ffb02d", "#ff6d2d", "#ef352f"];
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 70 + Math.random() * 290;
    particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 420 + Math.random() * 520,
      size: 3 + Math.random() * 12,
      color: colors[i % colors.length],
      gravity: 120,
    });
  }
  for (let r = 0; r < 3; r += 1) {
    particle(x, y, { type: "ring", life: 520 + r * 120, size: 28 + r * 22, color: colors[r], width: 3 });
  }
}

function emitFreeze(x, y, count = 34) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 170;
    particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 720 + Math.random() * 560,
      size: 6 + Math.random() * 12,
      color: i % 3 === 0 ? "#ffffff" : "#82e7ff",
      type: "ice",
      spin: Math.random() * Math.PI,
    });
  }
  particle(x, y, { type: "ring", life: 920, size: 82, color: "#82e7ff", width: 3 });
}

function emitShield(x, y, count = 28) {
  for (let i = 0; i < count; i += 1) {
    const angle = i / count * Math.PI * 2;
    particle(x + Math.cos(angle) * 70, y + Math.sin(angle) * 70, {
      vx: -Math.cos(angle) * 18,
      vy: -Math.sin(angle) * 18,
      life: 900 + Math.random() * 420,
      size: 5 + Math.random() * 7,
      color: "#72f0c9",
      type: "dot",
    });
  }
  particle(x, y, { type: "ring", life: 1100, size: 92, color: "#72f0c9", width: 4 });
  particle(x, y, { type: "ring", life: 780, size: 128, color: "#9fffe2", width: 2 });
}

function emitSlash(x1, y1, x2, y2, color = "#fff0b6", width = 1) {
  const steps = 18;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t - Math.sin(t * Math.PI) * 44;
    particle(x, y, {
      vx: 40 + Math.random() * 40,
      vy: -18 + Math.random() * 36,
      life: 220 + i * 14,
      size: (10 + i * 1.5) * width,
      color,
      type: "slash",
    });
  }
}

function tick(now) {
  const dt = Math.min(0.04, (now - state.lastTime) / 1000);
  state.lastTime = now;
  updateParticles(dt);
  drawParticles();
  state.raf = requestAnimationFrame(tick);
}

function updateParticles(dt) {
  for (const item of state.particles) {
    item.life -= dt * 1000;
    item.vy += item.gravity * dt;
    item.x += item.vx * dt;
    item.y += item.vy * dt;
    item.spin += dt * 4;
  }
  state.particles = state.particles.filter((item) => item.life > 0);
}

function drawParticles() {
  const rect = els.stage.getBoundingClientRect();
  ctx.clearRect(0, 0, rect.width, rect.height);
  drawPremiumEffect();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const item of state.particles) {
    const p = Math.max(0, item.life / item.maxLife);
    ctx.globalAlpha = Math.min(1, p * 1.2);
    ctx.strokeStyle = item.color;
    ctx.fillStyle = item.color;
    ctx.lineWidth = item.width || 2;
    if (item.type === "ring") {
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.size * (1.2 - p), 0, Math.PI * 2);
      ctx.stroke();
    } else if (item.type === "slash") {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(-0.42);
      ctx.fillRect(-item.size * 0.5, -1.5, item.size, 3);
      ctx.restore();
    } else if (item.type === "ice") {
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.spin);
      ctx.beginPath();
      ctx.moveTo(0, -item.size);
      ctx.lineTo(item.size * 0.55, 0);
      ctx.lineTo(0, item.size);
      ctx.lineTo(-item.size * 0.55, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      const gradient = ctx.createRadialGradient(item.x, item.y, 0, item.x, item.y, item.size);
      gradient.addColorStop(0, item.color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(item.x, item.y, item.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawPremiumEffect() {
  if (!state.premium) return;
  const now = performance.now();
  const item = state.premium;
  const t = Math.min(1, (now - item.start) / item.duration);
  if (item.type === "noiseSlash") {
    drawNoiseSlashFrame(item.source, item.target, t);
    if (!item.impact && t > 0.2) {
      item.impact = true;
      hitTarget();
      emitExplosion(item.target.x, item.target.y, 20, "arcane");
    }
  }
  if (item.type === "sheetSlash") {
    drawSheetSlashFrame(item, t);
    if (!item.impact && t > 0.34) {
      item.impact = true;
      hitTarget();
      emitSlash(item.source.x, item.source.y, item.target.x, item.target.y, "#fff7cc", 1.4);
    }
  }
  if (t >= 1) state.premium = null;
}

function drawSheetSlashFrame(item, t) {
  const { atlas, source, target } = item;
  const frameW = atlas.frameW;
  const frameH = atlas.frameH;
  const frame = Math.min(atlas.frames - 1, Math.floor(t * atlas.frames));
  const p = frame / (atlas.frames - 1);
  const angle = 0.42;
  const cx = target.x - 16 + Math.cos(angle) * (p - 0.35) * 24;
  const cy = target.y - 8 + Math.sin(angle) * (p - 0.35) * 24;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = Math.min(1, 1.12 - p * 0.1);
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.scale(1.04 + p * 0.18, 1.04 + p * 0.08);
  ctx.drawImage(atlas.canvas, frame * frameW, 0, frameW, frameH, -frameW / 2, -frameH / 2, frameW, frameH);
  ctx.restore();
}

function slashAimPoints() {
  const caster = stagePoint("caster");
  const target = stagePoint("target");
  return {
    source: { x: caster.x + 56, y: caster.y - 10 },
    impact: { x: target.x - 18, y: target.y + 2 },
  };
}

async function ensurePixi() {
  if (state.pixi) return true;
  if (!window.PIXI) return false;
  try {
    const rect = els.stage.getBoundingClientRect();
    const app = new PIXI.Application();
    await app.init({
      width: rect.width,
      height: rect.height,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    els.pixiLayer.innerHTML = "";
    els.pixiLayer.appendChild(app.canvas);
    app.canvas.style.width = "100%";
    app.canvas.style.height = "100%";
    state.pixi = app;
    return true;
  } catch {
    return false;
  }
}

function pixiSlash(source, target) {
  hitTarget();
  const g = new PIXI.Graphics();
  state.pixi.stage.addChild(g);
  let age = 0;
  state.pixi.ticker.add(function draw(ticker) {
    age += ticker.deltaMS;
    const p = Math.min(1, age / 360);
    g.clear();
    g.alpha = 1 - p;
    g.moveTo(source.x + 70 + p * 110, source.y - 18 - p * 8);
    g.quadraticCurveTo((source.x + target.x) / 2, target.y - 120, target.x + p * 30, target.y - 26);
    g.stroke({ width: 16 * (1 - p) + 3, color: 0xfff0b6, alpha: 0.92 });
    if (p >= 1) {
      state.pixi.ticker.remove(draw);
      g.destroy();
    }
  });
}

function pixiExplosion(point) {
  hitTarget();
  const particles = [];
  for (let i = 0; i < 64; i += 1) {
    const g = new PIXI.Graphics();
    g.circle(0, 0, 2 + Math.random() * 7);
    g.fill([0xfff6a7, 0xffb02d, 0xff6d2d, 0xef352f][i % 4]);
    g.x = point.x;
    g.y = point.y;
    g.blendMode = "add";
    const angle = Math.random() * Math.PI * 2;
    particles.push({ g, vx: Math.cos(angle) * (2 + Math.random() * 6), vy: Math.sin(angle) * (2 + Math.random() * 6), life: 1 });
    state.pixi.stage.addChild(g);
  }
  state.pixi.ticker.add(function draw(ticker) {
    const dt = ticker.deltaMS / 16.67;
    for (const p of particles) {
      p.life -= 0.025 * dt;
      p.vy += 0.04 * dt;
      p.g.x += p.vx * dt;
      p.g.y += p.vy * dt;
      p.g.alpha = Math.max(0, p.life);
      p.g.scale.set(1 + (1 - p.life) * 1.8);
    }
    if (particles.every((p) => p.life <= 0)) {
      state.pixi.ticker.remove(draw);
      particles.forEach((p) => p.g.destroy());
    }
  });
}

function pixiFreeze(point) {
  freezeTarget(1400);
  const g = new PIXI.Graphics();
  state.pixi.stage.addChild(g);
  let age = 0;
  state.pixi.ticker.add(function draw(ticker) {
    age += ticker.deltaMS;
    const p = Math.min(1, age / 1000);
    g.clear();
    g.alpha = 1 - p * 0.8;
    for (let i = 0; i < 10; i += 1) {
      const a = i / 10 * Math.PI * 2 + p * 0.6;
      const r = 30 + p * 70;
      g.moveTo(point.x, point.y);
      g.lineTo(point.x + Math.cos(a) * r, point.y + Math.sin(a) * r);
    }
    g.stroke({ width: 3, color: 0x82e7ff, alpha: 0.9 });
    if (p >= 1) {
      state.pixi.ticker.remove(draw);
      g.destroy();
    }
  });
}

function pixiShield(point) {
  shieldTarget(1500);
  const g = new PIXI.Graphics();
  state.pixi.stage.addChild(g);
  let age = 0;
  state.pixi.ticker.add(function draw(ticker) {
    age += ticker.deltaMS;
    const p = Math.min(1, age / 1200);
    g.clear();
    g.alpha = 1 - p * 0.65;
    g.circle(point.x, point.y, 72 + Math.sin(p * Math.PI * 4) * 6);
    g.stroke({ width: 5, color: 0x72f0c9, alpha: 0.85 });
    g.circle(point.x, point.y, 96 + p * 24);
    g.stroke({ width: 2, color: 0x9fffe2, alpha: 0.5 });
    if (p >= 1) {
      state.pixi.ticker.remove(draw);
      g.destroy();
    }
  });
}

function clearStage() {
  els.domLayer.innerHTML = "";
  state.premium = null;
  state.particles = [];
  ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
  resetUnitState();
  if (state.pixi) state.pixi.stage.removeChildren();
}

setup();
