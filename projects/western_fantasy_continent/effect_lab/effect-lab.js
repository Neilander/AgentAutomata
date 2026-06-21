const state = {
  mode: "css",
  particles: [],
  raf: 0,
  lastTime: performance.now(),
  pixi: null,
  premium: null,
  assets: {},
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

const BRACKEYS_BASE = "/effect_lab/assets/brackeys";
const BRACKEYS_SHEETS = {
  bigHit: sheet("predrawn/big_hit_6x5.png", 6, 5, 30),
  bloodImpact: sheet("predrawn/blood_impact_6x5.png", 6, 5, 30),
  charge: sheet("predrawn/charge_7x6.png", 7, 6, 42),
  ditheredFire: sheet("predrawn/dithered_fire_6x5.png", 6, 5, 30),
  impactWhite: sheet("predrawn/impact_white_6x4.png", 6, 4, 24),
  lightstreaks: sheet("predrawn/lightstreaks_6x5.png", 6, 5, 30),
  explosion: sheet("predrawn/explosion_6x5.png", 6, 5, 30),
  firePoint: sheet("predrawn/fire_point_6x5.png", 6, 5, 30),
  starExplosion: sheet("predrawn/star_explosion_6x5.png", 6, 5, 30),
  electricRing: sheet("predrawn/electric_ring_6x5.png", 6, 5, 30),
  fireRing: sheet("predrawn/fire_ring_6x5.png", 6, 5, 30),
  wavyBlue: sheet("predrawn/wavy_blue_6x5.png", 6, 5, 30),
  wavyPurple: sheet("predrawn/wavy_purple_6x5.png", 6, 5, 30),
  vortex: sheet("predrawn/vortex_6x5.png", 6, 5, 30),
};

const BRACKEYS_IMAGES = {
  slash01: imageAsset("particles/alpha/slash_01_a.png"),
  slash02: imageAsset("particles/alpha/slash_02_a.png"),
  slash03: imageAsset("particles/alpha/slash_03_a.png"),
  slash04: imageAsset("particles/alpha/slash_04_a.png"),
  spark01: imageAsset("particles/alpha/spark_01_a.png"),
  spark02: imageAsset("particles/alpha/spark_02_a.png"),
  spark03: imageAsset("particles/alpha/spark_03_a.png"),
  spark04: imageAsset("particles/alpha/spark_04_a.png"),
  spark05: imageAsset("particles/alpha/spark_05_a.png"),
  spark06: imageAsset("particles/alpha/spark_06_a.png"),
  spark07: imageAsset("particles/alpha/spark_07_a.png"),
  fire01: imageAsset("particles/alpha/fire_01_a.png"),
  fire02: imageAsset("particles/alpha/fire_02_a.png"),
  flame01: imageAsset("particles/alpha/flame_01_a.png"),
  flame02: imageAsset("particles/alpha/flame_02_a.png"),
  flame03: imageAsset("particles/alpha/flame_03_a.png"),
  magic01: imageAsset("particles/alpha/magic_01_a.png"),
  magic02: imageAsset("particles/alpha/magic_02_a.png"),
  magic03: imageAsset("particles/alpha/magic_03_a.png"),
  magic04: imageAsset("particles/alpha/magic_04_a.png"),
  magic05: imageAsset("particles/alpha/magic_05_a.png"),
  smoke01: imageAsset("particles/alpha/smoke_01_a.png"),
  smoke02: imageAsset("particles/alpha/smoke_02_a.png"),
  smoke03: imageAsset("particles/alpha/smoke_03_a.png"),
  smoke07: imageAsset("particles/alpha/smoke_07_a.png"),
  smokeStrong: imageAsset("particles/alpha/smoke_07_strong_a.png"),
  scorch01: imageAsset("particles/alpha/scorch_01_a.png"),
  scorch02: imageAsset("particles/alpha/scorch_02_a.png"),
  scratch01: imageAsset("particles/alpha/scratch_01_a.png"),
  star01: imageAsset("particles/alpha/star_01_a.png"),
  star02: imageAsset("particles/alpha/star_02_a.png"),
  star03: imageAsset("particles/alpha/star_03_a.png"),
  star06: imageAsset("particles/alpha/star_06_a.png"),
  trace01: imageAsset("particles/alpha/trace_01_a.png"),
  trace02: imageAsset("particles/alpha/trace_02_a.png"),
  trace04: imageAsset("particles/alpha/trace_04_a.png"),
  twirl01: imageAsset("particles/alpha/twirl_01_a.png"),
  twirl02: imageAsset("particles/alpha/twirl_02_a.png"),
  twirl04: imageAsset("particles/alpha/twirl_04_a.png"),
  spotlight01: imageAsset("particles/alpha/spotlight_01_a.png"),
  spotlight03: imageAsset("particles/alpha/spotlight_03_a.png"),
  window01: imageAsset("particles/alpha/window_01_a.png"),
  circle01: imageAsset("particles/alpha/circle_01_a.png"),
  circle03: imageAsset("particles/alpha/circle_03_a.png"),
  effect01: imageAsset("particles/alpha/effect_01_a.png"),
  effect02: imageAsset("particles/alpha/effect_02_a.png"),
};

const SKILL_EFFECTS = [
  { id: "iron_cleave", name: "铁卫横斩", group: "attack", element: "physical", style: "cleave", icon: "⚔" },
  { id: "silver_lunge", name: "银锋突刺", group: "attack", element: "physical", style: "pierce", icon: "🗡" },
  { id: "double_cut", name: "双连切", group: "attack", element: "physical", style: "doubleSlash", icon: "⚔" },
  { id: "whirl_blade", name: "旋风刃", group: "attack", element: "wind", style: "spinSlash", icon: "🌀" },
  { id: "execution_arc", name: "处决弧光", group: "attack", element: "physical", style: "heavySlash", icon: "✦" },
  { id: "bleeding_mark", name: "裂伤印记", group: "attack", element: "blood", style: "bleedSlash", icon: "♦" },
  { id: "shadow_step", name: "影步背刺", group: "attack", element: "shadow", style: "blinkSlash", icon: "☾" },
  { id: "ranger_shot", name: "游侠穿云", group: "attack", element: "wind", style: "projectile", icon: "➶" },
  { id: "piercing_bolt", name: "破甲飞矢", group: "attack", element: "physical", style: "projectileHit", icon: "➶" },
  { id: "hammer_shock", name: "战锤震击", group: "attack", element: "earth", style: "impact", icon: "◆" },
  { id: "fireball", name: "火球术", group: "magic", element: "fire", style: "fireball", icon: "🔥" },
  { id: "flame_ring", name: "烈焰环", group: "magic", element: "fire", style: "ringBlast", icon: "🔥" },
  { id: "meteor_burst", name: "陨火爆裂", group: "magic", element: "fire", style: "explosion", icon: "☄" },
  { id: "burning_ground", name: "燃烧地面", group: "magic", element: "fire", style: "groundFire", icon: "🔥" },
  { id: "ember_rain", name: "余烬雨", group: "magic", element: "fire", style: "rain", icon: "✹" },
  { id: "frost_nova", name: "冰霜新星", group: "magic", element: "ice", style: "nova", icon: "❄" },
  { id: "ice_lance", name: "寒冰枪", group: "magic", element: "ice", style: "projectile", icon: "❄" },
  { id: "frozen_prison", name: "冰封牢笼", group: "magic", element: "ice", style: "controlRing", icon: "❄" },
  { id: "blizzard_cut", name: "雪刃斩", group: "magic", element: "ice", style: "slashMagic", icon: "❄" },
  { id: "glacial_burst", name: "冰川爆破", group: "magic", element: "ice", style: "burst", icon: "❄" },
  { id: "chain_lightning", name: "连锁闪电", group: "magic", element: "lightning", style: "chain", icon: "⚡" },
  { id: "thunder_clap", name: "雷鸣震荡", group: "magic", element: "lightning", style: "impact", icon: "⚡" },
  { id: "storm_ring", name: "风暴电环", group: "magic", element: "lightning", style: "ringBlast", icon: "⚡" },
  { id: "static_mark", name: "静电标记", group: "magic", element: "lightning", style: "mark", icon: "⚡" },
  { id: "lightning_spear", name: "雷矛", group: "magic", element: "lightning", style: "projectileHit", icon: "⚡" },
  { id: "poison_cloud", name: "毒雾", group: "magic", element: "poison", style: "cloud", icon: "☠" },
  { id: "venom_spike", name: "毒刺", group: "magic", element: "poison", style: "projectile", icon: "☠" },
  { id: "corrosion_pool", name: "腐蚀池", group: "magic", element: "poison", style: "groundCloud", icon: "☠" },
  { id: "plague_pop", name: "瘟疫爆", group: "magic", element: "poison", style: "burst", icon: "☠" },
  { id: "toxic_slash", name: "淬毒斩", group: "attack", element: "poison", style: "slashMagic", icon: "☠" },
  { id: "holy_smite", name: "圣裁", group: "magic", element: "holy", style: "smite", icon: "✚" },
  { id: "sun_burst", name: "日耀爆发", group: "magic", element: "holy", style: "burst", icon: "☀" },
  { id: "healing_light", name: "治疗光", group: "support", element: "holy", style: "heal", icon: "✚" },
  { id: "guardian_aegis", name: "守护屏障", group: "support", element: "shield", style: "shield", icon: "◎" },
  { id: "battle_banner", name: "战旗鼓舞", group: "support", element: "holy", style: "buff", icon: "⚑" },
  { id: "arcane_orb", name: "奥术球", group: "magic", element: "arcane", style: "orb", icon: "✦" },
  { id: "mana_burst", name: "魔力爆", group: "magic", element: "arcane", style: "burst", icon: "✦" },
  { id: "void_pull", name: "虚空牵引", group: "magic", element: "shadow", style: "vortex", icon: "☾" },
  { id: "night_bloom", name: "夜幕绽放", group: "magic", element: "shadow", style: "burst", icon: "☾" },
  { id: "curse_mark", name: "诅咒印", group: "magic", element: "shadow", style: "mark", icon: "☾" },
  { id: "stone_spike", name: "岩刺", group: "magic", element: "earth", style: "projectileHit", icon: "▲" },
  { id: "earth_quake", name: "地震波", group: "magic", element: "earth", style: "impact", icon: "◆" },
  { id: "dust_blast", name: "尘爆", group: "magic", element: "earth", style: "cloudBurst", icon: "◆" },
  { id: "wind_dash", name: "疾风步", group: "support", element: "wind", style: "dashBuff", icon: "➤" },
  { id: "gale_cut", name: "风压斩", group: "attack", element: "wind", style: "slashMagic", icon: "🌀" },
  { id: "water_pulse", name: "水波冲击", group: "magic", element: "water", style: "wave", icon: "≈" },
  { id: "mist_veil", name: "雾幕", group: "support", element: "water", style: "cloud", icon: "≈" },
  { id: "blood_burst", name: "血爆", group: "magic", element: "blood", style: "burst", icon: "♦" },
  { id: "life_steal", name: "汲魂", group: "magic", element: "blood", style: "drain", icon: "♦" },
  { id: "revive_spark", name: "复苏火花", group: "support", element: "holy", style: "healBurst", icon: "✚" },
];

function sheet(path, cols, rows, frames) {
  return {
    src: `${BRACKEYS_BASE}/${path}`,
    cols,
    rows,
    frames,
    image: null,
    ready: false,
    failed: false,
  };
}

function imageAsset(path) {
  return {
    src: `${BRACKEYS_BASE}/${path}`,
    image: null,
    ready: false,
    failed: false,
  };
}

const els = {
  modeList: document.querySelector("#modeList"),
  effectButtons: document.querySelector("#effectButtons"),
  premiumButtons: document.querySelector("#premiumButtons"),
  assetButtons: document.querySelector("#assetButtons"),
  skillGrid: document.querySelector("#skillGrid"),
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
  preloadBrackeysSheets();
  renderSkillGrid("all");
  window.addEventListener("resize", resizeCanvas);
  requestAnimationFrame(tick);
  updateModeUi();
}

function preloadBrackeysSheets() {
  Object.keys(BRACKEYS_SHEETS).forEach(loadBrackeysSheet);
  Object.keys(BRACKEYS_IMAGES).forEach(loadBrackeysImage);
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

  els.assetButtons?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-asset-effect]");
    if (!button) return;
    playBrackeysEffect(button.dataset.assetEffect);
  });

  els.skillGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-skill-id]");
    if (!button) return;
    playSkillPreset(button.dataset.skillId);
    els.skillGrid.querySelectorAll("[data-skill-id]").forEach((item) => {
      item.classList.toggle("active", item === button);
    });
  });

  document.querySelectorAll("[data-skill-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-skill-filter]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      renderSkillGrid(button.dataset.skillFilter);
    });
  });

  els.clearBtn.addEventListener("click", clearStage);
}

function renderSkillGrid(filter) {
  if (!els.skillGrid) return;
  const items = SKILL_EFFECTS.filter((skill) => filter === "all" || skill.group === filter);
  els.skillGrid.innerHTML = items.map((skill) => (
    `<button data-skill-id="${skill.id}" type="button"><strong>${skill.icon} ${skill.name}</strong><span>${skillTag(skill)}</span></button>`
  )).join("");
}

function skillTag(skill) {
  const group = ({ attack: "攻击", magic: "魔法", support: "辅助" })[skill.group] || skill.group;
  const element = ({
    physical: "物理",
    fire: "火焰",
    ice: "冰霜",
    lightning: "雷电",
    poison: "剧毒",
    holy: "圣光",
    shadow: "暗影",
    earth: "大地",
    wind: "疾风",
    water: "水雾",
    arcane: "奥术",
    blood: "血术",
    shield: "护盾",
  })[skill.element] || skill.element;
  return `${group} · ${element}`;
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

function playSkillPreset(skillId) {
  const skill = SKILL_EFFECTS.find((item) => item.id === skillId);
  if (!skill) return;
  clearStage();
  els.readoutEffect.textContent = skill.name;
  els.readoutMode.textContent = "技能特效库";
  els.readoutAdvice.textContent = `${skillTag(skill)} · ${skill.style}`;
  resetUnitState();

  const points = slashAimPoints();
  const target = skill.group === "support" ? stagePoint("caster") : points.impact;
  const source = points.source;
  if (skill.group === "attack" || skill.style.includes("slash") || skill.style.includes("Slash")) {
    swingCaster();
  }

  state.premium = brackeysTimeline(skill.id, buildSkillClips(skill, source, target), source, target);
  const impactDelay = skill.group === "support" ? 80 : 160;
  setTimeout(() => applySkillFeedback(skill, target), impactDelay);
}

function buildSkillClips(skill, source, target) {
  const element = elementLook(skill.element);
  const clips = [];
  const travelX = target.x - source.x;
  const travelY = target.y - source.y;
  const slashRotation = skill.element === "wind" ? -0.34 : -0.6;

  if (["cleave", "pierce", "heavySlash", "bleedSlash", "slashMagic"].includes(skill.style)) {
    clips.push(imageClip(element.slash || "slash01", 0, 300, target.x - 28, target.y - 14, 0.74, slashRotation, 0.9, "screen", { sx: 0.82, sy: 0.44, driftX: 26, driftY: -8 }));
    clips.push(imageClip(element.spark, 80, 320, target.x + 8, target.y + 4, 0.18, 0.4, 0.55, "screen", { sx: 1.1, sy: 0.9 }));
    clips.push(clip(element.impact, 130, 420, target.x, target.y, skill.style === "heavySlash" ? 0.3 : 0.22, 0, 0.78, "screen"));
    if (skill.style === "bleedSlash") clips.push(clip("bloodImpact", 120, 520, target.x - 2, target.y + 6, 0.42, 0, 0.85, "screen"));
  } else if (skill.style === "doubleSlash") {
    clips.push(imageClip("slash01", 0, 260, target.x - 30, target.y - 18, 0.62, -0.58, 0.9, "screen", { sx: 0.78, sy: 0.38, driftX: 24 }));
    clips.push(imageClip("slash02", 110, 270, target.x - 12, target.y + 10, 0.58, 0.62, 0.78, "screen", { sx: 0.78, sy: 0.38, driftX: 20 }));
    clips.push(clip("impactWhite", 170, 360, target.x, target.y, 0.2, 0, 0.78, "screen"));
  } else if (skill.style === "spinSlash") {
    clips.push(clip("vortex", 0, 700, target.x - 4, target.y, 0.28, 0, 0.62, "screen"));
    clips.push(imageClip("slash03", 80, 420, target.x, target.y, 0.72, 0.15, 0.7, "screen", { sx: 0.9, sy: 0.42, driftX: 10 }));
    clips.push(imageClip("slash04", 180, 420, target.x + 2, target.y, 0.6, 2.3, 0.48, "screen", { sx: 0.9, sy: 0.42, driftX: -10 }));
  } else if (skill.style === "blinkSlash") {
    clips.push(imageClip("smokeStrong", 0, 460, source.x - 20, source.y + 2, 0.22, 0, 0.55, "screen"));
    clips.push(imageClip("slash04", 95, 280, target.x - 18, target.y - 8, 0.62, -0.85, 0.86, "screen", { sx: 0.74, sy: 0.36, driftX: 26 }));
    clips.push(clip("wavyPurple", 120, 560, target.x, target.y, 0.24, 0, 0.45, "screen"));
  } else if (["projectile", "projectileHit", "fireball", "orb"].includes(skill.style)) {
    clips.push(imageClip(element.projectile, 0, 560, source.x + 8, source.y - 16, 0.2, 0, 0.88, "screen", { sx: 1.1, sy: 1.1, driftX: travelX - 18, driftY: travelY + 4 }));
    clips.push(imageClip(element.trail, 80, 520, source.x + travelX * 0.5, source.y + travelY * 0.5 - 6, 0.18, 0.1, 0.42, "screen", { sx: 1.7, sy: 0.65, driftX: travelX * 0.22 }));
    clips.push(clip(element.impact, 360, 560, target.x, target.y, 0.28, 0, 0.9, "screen"));
  } else if (["explosion", "burst", "cloudBurst", "impact", "smite"].includes(skill.style)) {
    clips.push(clip(element.precast, 0, 520, target.x, target.y, 0.28, 0, 0.55, "screen"));
    clips.push(clip(element.impact, 180, 760, target.x, target.y, 0.48, 0, 0.95, "screen"));
    clips.push(imageClip(element.spark, 260, 560, target.x, target.y, 0.24, 0, 0.5, "screen", { sx: 1.6, sy: 1.6 }));
  } else if (["ringBlast", "nova", "controlRing", "shield"].includes(skill.style)) {
    clips.push(clip(element.ring, 0, 900, target.x, target.y, skill.style === "shield" ? 0.42 : 0.5, 0, 0.9, "screen"));
    clips.push(clip(element.precast, 80, 760, target.x, target.y, 0.24, 0, 0.5, "screen"));
    clips.push(imageClip(element.spark, 140, 680, target.x, target.y, 0.18, 0, 0.52, "screen", { sx: 1.8, sy: 1.8 }));
  } else if (["groundFire", "groundCloud", "cloud"].includes(skill.style)) {
    clips.push(imageClip(element.cloud, 0, 1050, target.x, target.y + 24, 0.42, 0, 0.68, "screen", { sx: 1.7, sy: 0.8 }));
    clips.push(clip(element.precast, 140, 900, target.x, target.y + 18, 0.3, 0, 0.48, "screen"));
  } else if (skill.style === "rain") {
    for (let i = 0; i < 5; i += 1) {
      clips.push(imageClip(element.projectile, i * 70, 620, target.x - 90 + i * 42, target.y - 150, 0.15, 1.24, 0.75, "screen", { sx: 0.8, sy: 1.2, driftX: 30, driftY: 135 }));
    }
    clips.push(clip(element.impact, 430, 560, target.x, target.y + 6, 0.36, 0, 0.78, "screen"));
  } else if (["heal", "healBurst", "buff", "dashBuff"].includes(skill.style)) {
    clips.push(clip(skill.style === "dashBuff" ? "lightstreaks" : "charge", 0, 850, target.x, target.y - 4, 0.22, skill.style === "dashBuff" ? -0.15 : 0, 0.62, "screen"));
    clips.push(imageClip(element.spark, 120, 820, target.x, target.y - 20, 0.2, 0, 0.65, "screen", { sx: 1.6, sy: 1.6, driftY: -18 }));
    clips.push(imageClip("star06", 220, 760, target.x, target.y - 58, 0.16, 0, 0.82, "screen", { sx: 1.2, sy: 1.2, driftY: -20 }));
  } else if (skill.style === "vortex") {
    clips.push(clip("vortex", 0, 1050, target.x, target.y, 0.42, 0, 0.82, "screen"));
    clips.push(imageClip("twirl04", 80, 920, target.x, target.y, 0.38, 0, 0.55, "screen", { sx: 1.2, sy: 1.2 }));
  } else if (skill.style === "mark") {
    clips.push(imageClip(element.mark, 0, 850, target.x, target.y - 60, 0.18, 0, 0.85, "screen", { sx: 1.15, sy: 1.15, driftY: 18 }));
    clips.push(clip(element.precast, 160, 720, target.x, target.y, 0.2, 0, 0.45, "screen"));
  } else if (skill.style === "wave") {
    clips.push(clip("wavyBlue", 0, 900, source.x + travelX * 0.5, target.y, 0.42, 0, 0.78, "screen"));
    clips.push(imageClip("trace04", 160, 700, source.x + 30, source.y - 8, 0.28, 0, 0.56, "screen", { sx: 2.2, sy: 0.7, driftX: travelX - 20 }));
  } else if (skill.style === "drain") {
    clips.push(imageClip("trace02", 0, 880, target.x, target.y, 0.24, 2.9, 0.75, "screen", { sx: 2.0, sy: 0.58, driftX: source.x - target.x, driftY: source.y - target.y }));
    clips.push(clip("bloodImpact", 120, 650, target.x, target.y, 0.42, 0, 0.78, "screen"));
    clips.push(imageClip("star03", 320, 650, source.x - 4, source.y - 34, 0.12, 0, 0.74, "screen"));
  } else {
    clips.push(clip(element.impact, 0, 760, target.x, target.y, 0.35, 0, 0.86, "screen"));
  }
  return clips;
}

function applySkillFeedback(skill, point) {
  if (skill.group !== "support") hitTarget();
  if (skill.element === "ice") freezeTarget(1000);
  if (skill.style === "shield") shieldTarget(1200);
  emitSkillParticles(point.x, point.y, skill.element, skill.group === "support" ? 18 : 26);
}

function emitSkillParticles(x, y, element, count) {
  const look = elementLook(element);
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 220;
    particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      life: 360 + Math.random() * 520,
      size: 14 + Math.random() * 26,
      color: look.color,
      type: "assetImage",
      asset: look.particles[i % look.particles.length],
      spin: Math.random() * Math.PI,
      gravity: look.float ? -20 : 100,
    });
  }
}

function elementLook(element) {
  const looks = {
    physical: { color: "#fff0b6", slash: "slash01", projectile: "trace01", trail: "scratch01", spark: "spark01", particles: ["spark01", "spark02", "scratch01"], impact: "impactWhite", ring: "impactWhite", precast: "charge", cloud: "smoke02", mark: "star01" },
    fire: { color: "#ff7a2b", slash: "slash02", projectile: "fire01", trail: "flame02", spark: "flame01", particles: ["flame01", "flame02", "spark04"], impact: "explosion", ring: "fireRing", precast: "firePoint", cloud: "flame03", mark: "star01" },
    ice: { color: "#8defff", slash: "slash03", projectile: "magic02", trail: "trace04", spark: "spark06", particles: ["spark06", "magic02", "star02"], impact: "starExplosion", ring: "wavyBlue", precast: "electricRing", cloud: "smoke03", mark: "window01" },
    lightning: { color: "#a8f6ff", slash: "slash04", projectile: "light03", trail: "trace01", spark: "spark07", particles: ["spark07", "light01", "star06"], impact: "electricRing", ring: "electricRing", precast: "charge", cloud: "smoke01", mark: "effect02" },
    poison: { color: "#9cff5d", slash: "slash03", projectile: "magic05", trail: "smoke07", spark: "effect03", particles: ["magic05", "smoke07", "effect03"], impact: "wavyPurple", ring: "vortex", precast: "wavyPurple", cloud: "smokeStrong", mark: "circle03" },
    holy: { color: "#fff4a8", slash: "slash01", projectile: "star06", trail: "spotlight01", spark: "star01", particles: ["star01", "star02", "spotlight03"], impact: "impactWhite", ring: "charge", precast: "charge", cloud: "spotlight01", mark: "star06", float: true },
    shadow: { color: "#d7a7ff", slash: "slash04", projectile: "magic04", trail: "trace02", spark: "twirl04", particles: ["twirl04", "magic04", "smokeStrong"], impact: "wavyPurple", ring: "vortex", precast: "vortex", cloud: "smokeStrong", mark: "twirl02" },
    earth: { color: "#d7b06a", slash: "scratch01", projectile: "scorch02", trail: "smoke02", spark: "scorch01", particles: ["scorch01", "scorch02", "smoke02"], impact: "bigHit", ring: "bigHit", precast: "bloodImpact", cloud: "smoke07", mark: "circle01" },
    wind: { color: "#bbffe4", slash: "slash03", projectile: "trace04", trail: "trace01", spark: "trace01", particles: ["trace01", "trace04", "spark06"], impact: "impactWhite", ring: "wavyBlue", precast: "lightstreaks", cloud: "smoke01", mark: "twirl01", float: true },
    water: { color: "#83dfff", slash: "slash03", projectile: "magic03", trail: "trace04", spark: "circle03", particles: ["circle03", "magic03", "smoke03"], impact: "wavyBlue", ring: "wavyBlue", precast: "wavyBlue", cloud: "smoke03", mark: "circle03", float: true },
    arcane: { color: "#d7b7ff", slash: "slash04", projectile: "magic01", trail: "trace02", spark: "magic03", particles: ["magic01", "magic03", "star03"], impact: "wavyPurple", ring: "vortex", precast: "charge", cloud: "twirl04", mark: "effect01", float: true },
    blood: { color: "#ff6f8a", slash: "slash02", projectile: "magic04", trail: "trace02", spark: "star03", particles: ["star03", "spark05", "magic04"], impact: "bloodImpact", ring: "wavyPurple", precast: "bloodImpact", cloud: "smokeStrong", mark: "star03" },
    shield: { color: "#72f0c9", slash: "slash01", projectile: "magic03", trail: "spotlight03", spark: "circle03", particles: ["circle03", "star02", "spotlight03"], impact: "electricRing", ring: "electricRing", precast: "charge", cloud: "spotlight03", mark: "circle03", float: true },
  };
  return looks[element] || looks.arcane;
}

function playBrackeysEffect(effect) {
  clearStage();
  els.readoutEffect.textContent = `Brackeys ${effectName(effect)}`;
  els.readoutMode.textContent = "Brackeys 素材包";
  els.readoutAdvice.textContent = "用本地 CC0 spritesheet 做主表现，再叠少量粒子和震动，适合接进小战斗。";
  resetUnitState();
  if (effect === "combo") {
    const sequence = ["slash", "explosion", "freeze", "shield"];
    sequence.forEach((name, index) => setTimeout(() => playBrackeysEffect(name), index * 760));
    return;
  }
  const { source, impact } = slashAimPoints();
  if (effect === "slash") {
    swingCaster();
    state.premium = brackeysTimeline("slash", [
      imageClip("slash01", 0, 280, impact.x - 28, impact.y - 16, 0.78, -0.64, 0.95, "screen", { sx: 0.72, sy: 0.48, driftX: 32, driftY: -10 }),
      imageClip("slash02", 36, 300, impact.x - 8, impact.y - 2, 0.62, -0.58, 0.78, "screen", { sx: 0.8, sy: 0.42, driftX: 20, driftY: -4 }),
      imageClip("slash04", 72, 320, impact.x + 8, impact.y + 6, 0.45, -0.54, 0.42, "screen", { sx: 0.88, sy: 0.34, driftX: 12, driftY: 4 }),
      clip("impactWhite", 135, 360, impact.x - 2, impact.y - 2, 0.22, 0.02, 0.82, "screen"),
      clip("bigHit", 150, 420, impact.x + 6, impact.y + 2, 0.22, 0.08, 0.65, "screen"),
    ], source, impact);
    setTimeout(() => {
      hitTarget();
      emitAssetSparks(impact.x - 16, impact.y - 4, 20, 1.05);
    }, 145);
  }
  if (effect === "explosion") {
    state.premium = brackeysTimeline("explosion", [
      clip("explosion", 0, 880, impact.x + 2, impact.y + 6, 0.45, 0, 1, "screen"),
      clip("starExplosion", 80, 660, impact.x, impact.y - 2, 0.72, 0, 0.78, "screen"),
    ], source, impact);
    setTimeout(() => {
      hitTarget();
      emitExplosion(impact.x, impact.y, 34, "fire");
    }, 160);
  }
  if (effect === "freeze") {
    freezeTarget(1200);
    state.premium = brackeysTimeline("freeze", [
      clip("wavyBlue", 0, 900, impact.x, impact.y - 2, 0.52, 0, 0.82, "screen"),
      clip("electricRing", 120, 900, impact.x, impact.y + 2, 0.38, 0, 0.72, "screen"),
    ], source, impact);
    emitFreeze(impact.x, impact.y, 18);
  }
  if (effect === "shield") {
    shieldTarget(1300);
    state.premium = brackeysTimeline("shield", [
      clip("electricRing", 0, 920, impact.x, impact.y, 0.42, 0, 0.9, "screen"),
      clip("fireRing", 100, 940, impact.x, impact.y + 2, 0.36, 0, 0.62, "screen"),
      clip("vortex", 140, 900, impact.x, impact.y, 0.3, 0, 0.5, "screen"),
    ], source, impact);
    emitShield(impact.x, impact.y, 18);
  }
}

function brackeysTimeline(name, clips, source, target) {
  const duration = Math.max(...clips.map((item) => item.delay + item.duration));
  return {
    type: "brackeys",
    name,
    clips,
    source,
    target,
    start: performance.now(),
    duration,
  };
}

function clip(asset, delay, duration, x, y, scale, rotation = 0, alpha = 1, blend = "source-over") {
  loadBrackeysSheet(asset);
  return { kind: "sheet", asset, delay, duration, x, y, scale, rotation, alpha, blend };
}

function imageClip(asset, delay, duration, x, y, scale, rotation = 0, alpha = 1, blend = "source-over", motion = {}) {
  loadBrackeysImage(asset);
  return { kind: "image", asset, delay, duration, x, y, scale, rotation, alpha, blend, motion };
}

function loadBrackeysSheet(name) {
  const asset = BRACKEYS_SHEETS[name];
  if (!asset || asset.ready || asset.failed || asset.image) return asset;
  const image = new Image();
  image.onload = () => {
    asset.ready = true;
  };
  image.onerror = () => {
    asset.failed = true;
  };
  image.src = asset.src;
  asset.image = image;
  return asset;
}

function loadBrackeysImage(name) {
  const asset = BRACKEYS_IMAGES[name];
  if (!asset || asset.ready || asset.failed || asset.image) return asset;
  const image = new Image();
  image.onload = () => {
    asset.ready = true;
  };
  image.onerror = () => {
    asset.failed = true;
  };
  image.src = asset.src;
  asset.image = image;
  return asset;
}

function drawBrackeysTimeline(item, now) {
  for (const clipItem of item.clips) {
    const local = now - item.start - clipItem.delay;
    if (local < 0 || local > clipItem.duration) continue;
    const t = local / clipItem.duration;
    if (clipItem.kind === "image") drawBrackeysImageClip(clipItem, t);
    else drawBrackeysClip(clipItem, t);
  }
}

function drawBrackeysImageClip(clipItem, t) {
  const asset = BRACKEYS_IMAGES[clipItem.asset];
  if (!asset?.ready) return;
  const fadeIn = smoothstep(0, 0.1, t);
  const fadeOut = 1 - smoothstep(0.42, 1, t);
  const slashSnap = 0.92 + Math.sin(t * Math.PI) * 0.18;
  const motion = clipItem.motion || {};
  const x = clipItem.x + (motion.driftX || 0) * easeOutCubic(t);
  const y = clipItem.y + (motion.driftY || 0) * easeOutCubic(t);
  const sx = clipItem.scale * (motion.sx || 1) * slashSnap;
  const sy = clipItem.scale * (motion.sy || 1) * (1 + t * 0.08);
  ctx.save();
  ctx.globalCompositeOperation = clipItem.blend || "source-over";
  ctx.globalAlpha = clipItem.alpha * fadeIn * fadeOut;
  ctx.translate(x, y);
  ctx.rotate(clipItem.rotation || 0);
  ctx.scale(sx, sy);
  ctx.shadowColor = "rgba(255, 247, 190, 0.92)";
  ctx.shadowBlur = 20;
  ctx.drawImage(asset.image, -asset.image.width / 2, -asset.image.height / 2);
  ctx.globalAlpha *= 0.45;
  ctx.shadowBlur = 34;
  ctx.drawImage(asset.image, -asset.image.width / 2, -asset.image.height / 2);
  ctx.restore();
}

function drawBrackeysClip(clipItem, t) {
  const asset = BRACKEYS_SHEETS[clipItem.asset];
  if (!asset?.ready) return;
  const frame = Math.min(asset.frames - 1, Math.floor(t * asset.frames));
  const frameW = asset.image.width / asset.cols;
  const frameH = asset.image.height / asset.rows;
  const sx = (frame % asset.cols) * frameW;
  const sy = Math.floor(frame / asset.cols) * frameH;
  const fadeIn = smoothstep(0, 0.08, t);
  const fadeOut = 1 - smoothstep(0.78, 1, t);
  ctx.save();
  ctx.globalCompositeOperation = clipItem.blend || "source-over";
  ctx.globalAlpha = clipItem.alpha * fadeIn * fadeOut;
  ctx.translate(clipItem.x, clipItem.y);
  ctx.rotate(clipItem.rotation || 0);
  const width = frameW * clipItem.scale;
  const height = frameH * clipItem.scale;
  ctx.drawImage(asset.image, sx, sy, frameW, frameH, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function emitAssetSparks(x, y, count, power = 1) {
  for (let i = 0; i < count; i += 1) {
    const angle = -0.9 + Math.random() * 1.8;
    const speed = (80 + Math.random() * 220) * power;
    particle(x, y, {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 240 + Math.random() * 360,
      size: 16 + Math.random() * 24,
      color: "#fff4ba",
      type: "assetImage",
      asset: i % 3 === 0 ? "spark01" : i % 3 === 1 ? "spark02" : "spark03",
      spin: Math.random() * Math.PI,
      gravity: 120,
    });
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
  const life = t < 0.16 ? t / 0.16 : Math.max(0, 1 - (t - 0.38) / 0.62);
  const reveal = smoothstep(0.02, 0.28, t);
  const dissolve = smoothstep(0.28, 0.92, t);
  const center = { x: target.x - 12, y: target.y + 8 };
  const rotation = 0.42;
  const innerRadius = 46;
  const outerRadius = 132;
  const startAngle = -2.35;
  const endAngle = 0.55;

  drawArcRibbonLayer({
    center,
    rotation,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    t,
    reveal,
    dissolve,
    life,
    colorA: [255, 252, 214],
    colorB: [116, 234, 255],
    alpha: 0.95,
    noiseScale: 6.5,
    shell: 0,
  });

  drawArcRibbonLayer({
    center,
    rotation,
    innerRadius: innerRadius - 14,
    outerRadius: outerRadius + 28,
    startAngle: startAngle - 0.08,
    endAngle: endAngle + 0.05,
    t,
    reveal,
    dissolve,
    life: life * 0.72,
    colorA: [145, 235, 255],
    colorB: [190, 140, 255],
    alpha: 0.45,
    noiseScale: 4.2,
    shell: 1,
  });

  drawArcRibbonCore(center, rotation, innerRadius + 32, outerRadius - 18, startAngle + 0.18, endAngle - 0.16, reveal, life);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(255,255,255,${life * 0.62})`;
  ctx.beginPath();
  ctx.ellipse(target.x - 6, target.y + 6, 28 * life, 62 * life, rotation + 1.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let i = 0; i < 4; i += 1) {
    const q = Math.random() * reveal;
    const v = Math.random();
    const point = arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, q, v);
    particle(
      point.x,
      point.y,
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

function drawArcRibbonLayer(config) {
  const {
    center,
    rotation,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    t,
    reveal,
    dissolve,
    life,
    colorA,
    colorB,
    alpha,
    noiseScale,
    shell,
  } = config;
  const uSteps = 58;
  const vSteps = 10;
  for (let i = 0; i < uSteps; i += 1) {
    const u0 = i / uSteps;
    const u1 = (i + 1) / uSteps;
    if (u0 > reveal) continue;
    for (let j = 0; j < vSteps; j += 1) {
      const v0 = j / vSteps;
      const v1 = (j + 1) / vSteps;
      const u = (u0 + u1) * 0.5;
      const v = (v0 + v1) * 0.5;
      const body = smoothstep(0.04, 0.16, v) * (1 - smoothstep(0.78, 0.98, v));
      const headFade = 1 - smoothstep(reveal - 0.16, reveal + 0.02, u);
      const tailFade = smoothstep(0.02, 0.16, u);
      const noise = fractalNoise(u * noiseScale + t * 3.8 + shell * 11.3, v * 4.4 - t * 1.7);
      const erode = smoothstep(dissolve - 0.34, dissolve + 0.34, noise + u * 0.36 - v * 0.12);
      const edgeNoise = smoothstep(0.38, 0.82, noise);
      const cellAlpha = life * alpha * body * headFade * tailFade * (0.35 + edgeNoise * 0.85) * (1 - erode * 0.88);
      if (cellAlpha <= 0.015) continue;
      const p00 = arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, u0, v0, noise);
      const p10 = arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, u1, v0, noise);
      const p11 = arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, u1, v1, noise);
      const p01 = arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, u0, v1, noise);
      const mix = clamp01(v * 0.65 + edgeNoise * 0.35);
      const color = mixRgb(colorA, colorB, mix);
      ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},${cellAlpha})`;
      ctx.shadowColor = `rgba(${color[0]},${color[1]},${color[2]},${cellAlpha})`;
      ctx.shadowBlur = 18 + shell * 18;
      ctx.beginPath();
      ctx.moveTo(p00.x, p00.y);
      ctx.lineTo(p10.x, p10.y);
      ctx.lineTo(p11.x, p11.y);
      ctx.lineTo(p01.x, p01.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawArcRibbonCore(center, rotation, innerRadius, outerRadius, startAngle, endAngle, reveal, life) {
  ctx.save();
  ctx.shadowColor = "rgba(255,255,255,0.95)";
  ctx.shadowBlur = 18;
  ctx.beginPath();
  for (let i = 0; i <= 42; i += 1) {
    const u = Math.min(reveal, i / 42);
    const p = arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, u, 0.48);
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = `rgba(255,255,245,${life * 0.82})`;
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.restore();
}

function arcRibbonPoint(center, rotation, innerRadius, outerRadius, startAngle, endAngle, u, v, noise = 0.5) {
  const angle = startAngle + (endAngle - startAngle) * u;
  const radius = innerRadius + (outerRadius - innerRadius) * v + (noise - 0.5) * 10 * (0.35 + v);
  const localX = Math.cos(angle) * radius;
  const localY = Math.sin(angle) * radius * 0.62;
  const ca = Math.cos(rotation);
  const sa = Math.sin(rotation);
  return {
    x: center.x + ca * localX - sa * localY,
    y: center.y + sa * localX + ca * localY,
  };
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

function smoothstep(edge0, edge1, value) {
  const t = clamp01((value - edge0) / Math.max(0.0001, edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mixRgb(a, b, t) {
  const p = clamp01(t);
  return [
    Math.round(lerp(a[0], b[0], p)),
    Math.round(lerp(a[1], b[1], p)),
    Math.round(lerp(a[2], b[2], p)),
  ];
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
    asset: options.asset || "",
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
    } else if (item.type === "assetImage") {
      const asset = BRACKEYS_IMAGES[item.asset];
      if (asset?.ready) {
        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.spin);
        const size = item.size * (0.55 + (1 - p) * 0.35);
        ctx.drawImage(asset.image, -size / 2, -size / 2, size, size);
        ctx.restore();
      }
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
  if (item.type === "brackeys") {
    drawBrackeysTimeline(item, now);
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
