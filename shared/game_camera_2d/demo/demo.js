const { createCamera2D, boundsFromPoints } = window.AgentAutomataCamera2D;
const { createGameTime } = window.AgentAutomataGameTime;
const { createCameraModeController, createKeepTargetsInViewMode, createFollowTargetMode, createFixedViewMode } = window.AgentAutomataCameraModes;
const { createPostProcessingStack } = window.AgentAutomataPostProcessing;

const viewport = document.querySelector("#viewport");
const worldLayer = document.querySelector("#worldLayer");
const gridLayer = document.querySelector("#gridLayer");
const boundsEl = document.querySelector("#bounds");
const originEl = document.querySelector("#origin");
const originLabel = document.querySelector("#originLabel");
const autoFitButton = document.querySelector("#autoFitButton");
const followAllyButton = document.querySelector("#followAllyButton");
const fixedModeButton = document.querySelector("#fixedModeButton");
const wideButton = document.querySelector("#wideButton");
const zoomPulseButton = document.querySelector("#zoomPulseButton");
const resetButton = document.querySelector("#resetButton");
const warmGradeButton = document.querySelector("#warmGradeButton");
const coldGradeButton = document.querySelector("#coldGradeButton");
const poisonOverlayButton = document.querySelector("#poisonOverlayButton");
const vignetteButton = document.querySelector("#vignetteButton");
const flashButton = document.querySelector("#flashButton");
const shakeButton = document.querySelector("#shakeButton");
const clearPostButton = document.querySelector("#clearPostButton");
const normalTimeButton = document.querySelector("#normalTimeButton");
const halfTimeButton = document.querySelector("#halfTimeButton");
const slowTimeButton = document.querySelector("#slowTimeButton");
const pauseTimeButton = document.querySelector("#pauseTimeButton");
const bulletTimeButton = document.querySelector("#bulletTimeButton");
const readout = {
  x: document.querySelector("#cameraX"),
  y: document.querySelector("#cameraY"),
  zoom: document.querySelector("#cameraZoom"),
  timeScale: document.querySelector("#timeScale"),
  gameTime: document.querySelector("#gameTime"),
  bounds: document.querySelector("#viewBounds"),
};

const worldBounds = { minX: -700, minY: -420, maxX: 1150, maxY: 520 };
const camera = createCamera2D({
  viewportWidth: viewport.clientWidth,
  viewportHeight: viewport.clientHeight,
  x: 220,
  y: 0,
  zoom: 0.9,
  minZoom: 0.48,
  maxZoom: 1.35,
  worldBounds,
});
const post = createPostProcessingStack({
  viewport,
  contentLayer: worldLayer,
  zIndex: 16,
});
const gameTime = createGameTime({
  timeScale: 1,
  smoothing: 0.18,
});
const cameraModes = createCameraModeController(camera, {
  transitionMs: 520,
  modes: [
    createKeepTargetsInViewMode({
      id: "all",
      label: "全体入镜",
      targets: (context) => context.units,
      ratios: () => ({
        padding: 150,
        minZoom: 0.56 + (zoomPulse ? Math.sin(gameTime.snapshot().elapsedMs * 0.001) * 0.12 : 0),
        maxZoom: 1.12 + (zoomPulse ? Math.sin(gameTime.snapshot().elapsedMs * 0.001) * 0.12 : 0),
      }),
      smoothing: 0.055,
    }),
    createFollowTargetMode({
      id: "ally",
      label: "跟随我方",
      targets: (context) => context.units.filter((unit) => unit.side === "ally"),
      ratios: { zoom: 1.1, offsetX: 120 },
      smoothing: 0.08,
    }),
    createFixedViewMode({
      id: "fixed",
      label: "固定镜头",
      coordinates: [{ x: 220, y: 0 }],
      ratios: { zoom: 0.9 },
      smoothing: 0.08,
    }),
  ],
  initialModeId: "all",
});

const units = [
  { id: "A1", side: "ally", x: -300, y: -110, baseX: -300, baseY: -110, phase: 0 },
  { id: "A2", side: "ally", x: -210, y: 30, baseX: -210, baseY: 30, phase: 1.7 },
  { id: "A3", side: "ally", x: -120, y: 160, baseX: -120, baseY: 160, phase: 2.8 },
  { id: "E1", side: "enemy", x: 620, y: -150, baseX: 620, baseY: -150, phase: 0.4 },
  { id: "E2", side: "enemy", x: 760, y: 20, baseX: 760, baseY: 20, phase: 1.2 },
  { id: "E3", side: "enemy", x: 910, y: 180, baseX: 910, baseY: 180, phase: 2.2 },
];

const unitEls = new Map();
let autoFit = true;
let wideMode = false;
let zoomPulse = true;
let drag = null;

units.forEach((unit) => {
  const el = document.createElement("div");
  el.className = `unit ${unit.side}`;
  el.textContent = unit.id;
  worldLayer.appendChild(el);
  unitEls.set(unit.id, el);
});

function resize() {
  camera.setViewport(viewport.clientWidth, viewport.clientHeight);
}

function unitBounds() {
  return boundsFromPoints(units.map((unit) => ({ x: unit.x, y: unit.y, radius: 34 })));
}

function placeElement(el, point) {
  const screen = camera.worldToScreen(point);
  el.style.transform = `translate(${screen.x}px, ${screen.y}px)`;
}

function renderBounds(bounds) {
  const topLeft = camera.worldToScreen({ x: bounds.minX, y: bounds.minY });
  const bottomRight = camera.worldToScreen({ x: bounds.maxX, y: bounds.maxY });
  boundsEl.style.transform = `translate(${topLeft.x}px, ${topLeft.y}px)`;
  boundsEl.style.width = `${bottomRight.x - topLeft.x}px`;
  boundsEl.style.height = `${bottomRight.y - topLeft.y}px`;
}

function renderGrid() {
  const zoom = camera.snapshot().zoom;
  const origin = camera.worldToScreen({ x: 0, y: 0 });
  const grid = 80 * zoom;
  gridLayer.style.backgroundSize = `${grid}px ${grid}px`;
  gridLayer.style.backgroundPosition = `${origin.x}px ${origin.y}px`;
}

function updateReadout() {
  const snap = camera.snapshot();
  const time = gameTime.snapshot();
  const view = camera.getViewBounds();
  readout.x.textContent = snap.x.toFixed(1);
  readout.y.textContent = snap.y.toFixed(1);
  readout.zoom.textContent = snap.zoom.toFixed(2);
  readout.timeScale.textContent = `${time.timeScale.toFixed(2)}x${time.paused ? " paused" : ""}`;
  readout.gameTime.textContent = `${(time.elapsedMs / 1000).toFixed(2)}s`;
  readout.bounds.textContent = `${view.minX.toFixed(0)},${view.minY.toFixed(0)} -> ${view.maxX.toFixed(0)},${view.maxY.toFixed(0)}`;
}

function updateUnits(time) {
  const spread = wideMode ? 1.55 : 1;
  units.forEach((unit, index) => {
    const wave = Math.sin(time * 0.0014 + unit.phase) * 48;
    const march = Math.sin(time * 0.0007 + index) * 30;
    unit.x = unit.baseX * spread + wave + (unit.side === "ally" ? march : -march);
    unit.y = unit.baseY * spread + Math.cos(time * 0.001 + unit.phase) * 24;
  });
}

function frame(realTime) {
  const time = gameTime.update(realTime);
  const deltaMs = Math.min(48, time.deltaMs);
  updateUnits(time.elapsedMs);
  const bounds = unitBounds();
  if (autoFit && !drag) cameraModes.update(deltaMs || 16, { units });

  renderGrid();
  renderBounds(bounds);
  units.forEach((unit) => placeElement(unitEls.get(unit.id), unit));
  placeElement(originEl, { x: 0, y: 0 });
  placeElement(originLabel, { x: 12, y: 12 });
  post.update(deltaMs);
  updateReadout();
  requestAnimationFrame(frame);
}

viewport.addEventListener("pointerdown", (event) => {
  drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
  viewport.setPointerCapture(event.pointerId);
});

viewport.addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  autoFit = false;
  autoFitButton.classList.remove("active");
  camera.panByScreen(event.clientX - drag.x, event.clientY - drag.y);
  drag.x = event.clientX;
  drag.y = event.clientY;
});

function stopDrag(event) {
  if (drag && drag.id === event.pointerId) drag = null;
}

viewport.addEventListener("pointerup", stopDrag);
viewport.addEventListener("pointercancel", stopDrag);

viewport.addEventListener("wheel", (event) => {
  event.preventDefault();
  autoFit = false;
  autoFitButton.classList.remove("active");
  const rect = viewport.getBoundingClientRect();
  const anchor = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  const factor = event.deltaY < 0 ? 1.12 : 0.88;
  camera.setZoom(camera.snapshot().zoom * factor, anchor);
}, { passive: false });

autoFitButton.addEventListener("click", () => {
  autoFit = true;
  cameraModes.setMode("all");
  setCameraModeButtonState(autoFitButton);
});

followAllyButton.addEventListener("click", () => {
  autoFit = true;
  cameraModes.setMode("ally");
  setCameraModeButtonState(followAllyButton);
});

fixedModeButton.addEventListener("click", () => {
  autoFit = true;
  cameraModes.setMode("fixed");
  setCameraModeButtonState(fixedModeButton);
});

wideButton.addEventListener("click", () => {
  wideMode = !wideMode;
  wideButton.classList.toggle("active", wideMode);
});

zoomPulseButton.addEventListener("click", () => {
  zoomPulse = !zoomPulse;
  zoomPulseButton.classList.toggle("active", zoomPulse);
});

resetButton.addEventListener("click", () => {
  autoFit = true;
  autoFitButton.classList.add("active");
  camera.setPosition(220, 0).setZoom(0.9);
});

warmGradeButton.addEventListener("click", () => {
  post.setColorGrade({
    weight: 1,
    brightness: 1.06,
    contrast: 1.08,
    saturate: 1.28,
    hueRotate: -8,
    sepia: 0.12,
  });
});

coldGradeButton.addEventListener("click", () => {
  post.setColorGrade({
    weight: 1,
    brightness: 0.96,
    contrast: 1.16,
    saturate: 0.88,
    hueRotate: 188,
    sepia: 0,
  });
});

poisonOverlayButton.addEventListener("click", () => {
  post.setOverlay("poison", {
    color: "rgba(70, 255, 116, 1)",
    opacity: 0.18,
    blendMode: "screen",
    weight: 1,
  });
});

vignetteButton.addEventListener("click", () => {
  const enabled = !post.snapshot().vignette.enabled;
  if (enabled) {
    post.setVignette({ enabled: true, weight: 1, opacity: 0.58, size: 62, color: "rgba(0, 0, 0, 1)" });
  } else {
    post.clearVignette();
  }
});

flashButton.addEventListener("click", () => {
  post.flash({ color: "rgba(255, 244, 190, 1)", opacity: 0.9, durationMs: 180, blendMode: "screen" });
});

shakeButton.addEventListener("click", () => {
  post.shake({ intensity: 18, durationMs: 360, frequency: 28 });
});

clearPostButton.addEventListener("click", () => {
  post.clearAll();
});

function setCameraModeButtonState(activeButton) {
  [autoFitButton, followAllyButton, fixedModeButton].forEach((button) => button.classList.toggle("active", button === activeButton));
}

function setTimeButtonState(activeButton) {
  [normalTimeButton, halfTimeButton, slowTimeButton].forEach((button) => button.classList.toggle("active", button === activeButton));
}

normalTimeButton.addEventListener("click", () => {
  gameTime.setPaused(false).setTimeScale(1, { instant: false });
  pauseTimeButton.textContent = "暂停";
  setTimeButtonState(normalTimeButton);
});

halfTimeButton.addEventListener("click", () => {
  gameTime.setPaused(false).setTimeScale(0.5, { instant: false });
  pauseTimeButton.textContent = "暂停";
  setTimeButtonState(halfTimeButton);
});

slowTimeButton.addEventListener("click", () => {
  gameTime.setPaused(false).setTimeScale(0.2, { instant: false });
  pauseTimeButton.textContent = "暂停";
  setTimeButtonState(slowTimeButton);
});

pauseTimeButton.addEventListener("click", () => {
  gameTime.togglePaused();
  pauseTimeButton.textContent = gameTime.snapshot().paused ? "继续" : "暂停";
});

bulletTimeButton.addEventListener("click", () => {
  gameTime.setPaused(false).setTemporaryTimeScale(0.12, 1000, { instant: false, restoreScale: gameTime.snapshot().targetTimeScale || 1 });
  post.setOverlay("bullet-time-blue", {
    color: "rgba(70, 170, 255, 1)",
    opacity: 0.16,
    blendMode: "screen",
    durationMs: 1000,
    fadeOutMs: 280,
  });
  post.setVignette({ enabled: true, weight: 1, opacity: 0.42, size: 58, color: "rgba(0, 8, 22, 1)" });
});

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(frame);
