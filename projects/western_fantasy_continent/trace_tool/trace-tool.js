const SVG_NS = "http://www.w3.org/2000/svg";
const STORAGE_KEY = "western_fantasy_trace_v1";
const DEFAULT_TRACE_NAME = "battle_chibi_trace_v1";
const API_BASE = window.location.origin;

const JOINTS = [
  ["root", "整体锚点"],
  ["hip", "胯部"],
  ["chest", "胸腔"],
  ["neck", "脖子"],
  ["head", "头部"],
  ["front_shoulder", "前肩"],
  ["front_elbow", "前肘"],
  ["front_hand", "前手"],
  ["back_shoulder", "后肩"],
  ["back_elbow", "后肘"],
  ["back_hand", "后手"],
  ["front_knee", "前膝"],
  ["front_foot", "前脚"],
  ["back_knee", "后膝"],
  ["back_foot", "后脚"],
  ["weapon_handle", "武器握点"],
  ["weapon_tip", "武器末端"],
];

const BONES = [
  ["root", "hip"],
  ["hip", "chest"],
  ["chest", "neck"],
  ["neck", "head"],
  ["chest", "front_shoulder"],
  ["front_shoulder", "front_elbow"],
  ["front_elbow", "front_hand"],
  ["chest", "back_shoulder"],
  ["back_shoulder", "back_elbow"],
  ["back_elbow", "back_hand"],
  ["hip", "front_knee"],
  ["front_knee", "front_foot"],
  ["hip", "back_knee"],
  ["back_knee", "back_foot"],
  ["front_hand", "weapon_handle"],
  ["weapon_handle", "weapon_tip"],
];

const PARTS = [
  ["head", "头"],
  ["hair", "头发"],
  ["face", "脸"],
  ["torso", "身体"],
  ["pelvis", "胯"],
  ["front_upper_arm", "前上臂"],
  ["front_forearm", "前前臂"],
  ["back_upper_arm", "后上臂"],
  ["back_forearm", "后前臂"],
  ["front_leg", "前腿"],
  ["back_leg", "后腿"],
  ["front_foot", "前脚"],
  ["back_foot", "后脚"],
  ["weapon", "武器"],
  ["back_prop", "背部挂件"],
];

const initialJoints = {
  root: { x: 410, y: 360 },
  hip: { x: 408, y: 334 },
  chest: { x: 426, y: 268 },
  neck: { x: 443, y: 225 },
  head: { x: 457, y: 190 },
  front_shoulder: { x: 462, y: 265 },
  front_elbow: { x: 496, y: 287 },
  front_hand: { x: 530, y: 277 },
  back_shoulder: { x: 405, y: 267 },
  back_elbow: { x: 372, y: 297 },
  back_hand: { x: 344, y: 318 },
  front_knee: { x: 447, y: 392 },
  front_foot: { x: 478, y: 442 },
  back_knee: { x: 378, y: 382 },
  back_foot: { x: 346, y: 434 },
  weapon_handle: { x: 520, y: 273 },
  weapon_tip: { x: 320, y: 350 },
};

const state = {
  mode: "joint",
  activeJoint: "head",
  activePart: "head",
  joints: structuredClone(initialJoints),
  parts: Object.fromEntries(PARTS.map(([key]) => [key, []])),
  image: "/picref/战斗小人参考.png",
  traceName: DEFAULT_TRACE_NAME,
  opacity: 0.82,
  scale: 1.9,
  zoom: 1.6,
  serverOnline: false,
};

const els = {
  imageInput: document.querySelector("#imageInput"),
  resetView: document.querySelector("#resetViewBtn"),
  save: document.querySelector("#saveBtn"),
  load: document.querySelector("#loadBtn"),
  copy: document.querySelector("#copyBtn"),
  serverStatus: document.querySelector("#serverStatus"),
  traceName: document.querySelector("#traceNameInput"),
  jointMode: document.querySelector("#jointModeBtn"),
  partMode: document.querySelector("#partModeBtn"),
  allMode: document.querySelector("#allModeBtn"),
  opacity: document.querySelector("#opacityRange"),
  scale: document.querySelector("#scaleRange"),
  jointList: document.querySelector("#jointList"),
  partSelect: document.querySelector("#partSelect"),
  partList: document.querySelector("#partList"),
  clearPart: document.querySelector("#clearPartBtn"),
  json: document.querySelector("#jsonOutput"),
  stage: document.querySelector("#traceStage"),
  content: document.querySelector("#traceContent"),
  image: document.querySelector("#referenceImage"),
  svg: document.querySelector("#traceSvg"),
  boneLayer: document.querySelector("#boneLayer"),
  partLayer: document.querySelector("#partLayer"),
  pointLayer: document.querySelector("#pointLayer"),
};

let dragTarget = null;
let panTarget = null;

function setup() {
  els.partSelect.innerHTML = PARTS.map(
    ([key, label]) => `<option value="${key}">${label}</option>`
  ).join("");
  els.partSelect.value = state.activePart;
  bindEvents();
  render();
}

function bindEvents() {
  els.jointMode.addEventListener("click", () => setMode("joint"));
  els.partMode.addEventListener("click", () => setMode("part"));
  els.allMode.addEventListener("click", () => setMode("all"));
  els.opacity.addEventListener("input", () => {
    state.opacity = Number(els.opacity.value) / 100;
    render();
  });
  els.scale.addEventListener("input", () => {
    state.zoom = Number(els.scale.value) / 100;
    render();
  });
  els.partSelect.addEventListener("change", () => {
    state.activePart = els.partSelect.value;
    render();
  });
  els.clearPart.addEventListener("click", () => {
    state.parts[state.activePart] = [];
    render();
  });
  els.resetView.addEventListener("click", () => {
    state.opacity = 0.82;
    state.scale = 1.9;
    state.zoom = 1.6;
    els.opacity.value = "82";
    els.scale.value = "160";
    render();
  });
  els.save.addEventListener("click", saveCurrentTrace);
  els.load.addEventListener("click", loadSaved);
  els.copy.addEventListener("click", copyJson);
  els.traceName.addEventListener("input", () => {
    state.traceName = sanitizeTraceName(els.traceName.value) || DEFAULT_TRACE_NAME;
  });
  els.imageInput.addEventListener("change", loadImageFile);
  els.svg.addEventListener("contextmenu", (event) => event.preventDefault());
  els.svg.addEventListener("pointerdown", onPointerDown);
  els.stage.addEventListener("wheel", onStageWheel, { passive: false });
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
}

function onPointerUp() {
  if (panTarget && !panTarget.moved && !panTarget.startedOnPoint) {
    placeAt(panTarget.svgPoint);
  }
  if (panTarget) {
    els.stage.classList.remove("panning");
  }
  panTarget = null;
    dragTarget = null;
}

function setMode(mode) {
  state.mode = mode;
  els.jointMode.classList.toggle("active", mode === "joint");
  els.partMode.classList.toggle("active", mode === "part");
  els.allMode.classList.toggle("active", mode === "all");
  render();
}

function loadImageFile(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    state.image = reader.result;
    render();
  };
  reader.readAsDataURL(file);
}

async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    state.serverOnline = response.ok;
  } catch {
    state.serverOnline = false;
  }
  updateServerStatus();
}

function updateServerStatus() {
  els.serverStatus.textContent = state.serverOnline ? "后端已连接" : "仅浏览器缓存";
  els.serverStatus.classList.toggle("online", state.serverOnline);
  els.serverStatus.classList.toggle("offline", !state.serverOnline);
}

async function saveCurrentTrace() {
  const data = toExportData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  if (!state.serverOnline) {
    updateServerStatus();
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/api/traces/${encodeURIComponent(state.traceName)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }
    state.serverOnline = true;
  } catch {
    state.serverOnline = false;
  }
  updateServerStatus();
}

async function loadSaved() {
  if (state.serverOnline) {
    try {
      const response = await fetch(`${API_BASE}/api/traces/${encodeURIComponent(state.traceName)}`);
      if (response.ok) {
        applyTraceData(await response.json());
        state.serverOnline = true;
        updateServerStatus();
        return;
      }
    } catch {
      state.serverOnline = false;
      updateServerStatus();
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return;
  }
  applyTraceData(JSON.parse(raw));
}

function applyTraceData(saved) {
  state.joints = saved.joints || state.joints;
  state.parts = { ...state.parts, ...(saved.parts || {}) };
  state.image = saved.referenceImage || state.image;
  state.traceName = saved.name || state.traceName;
  state.opacity = saved.view?.opacity ?? state.opacity;
  state.scale = saved.view?.scale ?? state.scale;
  state.zoom = saved.view?.zoom ?? state.zoom;
  els.traceName.value = state.traceName;
  els.opacity.value = String(Math.round(state.opacity * 100));
  els.scale.value = String(Math.round(state.zoom * 100));
  render();
}

async function copyJson() {
  const text = JSON.stringify(toExportData(), null, 2);
  els.json.value = text;
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  }
}

function onPointerDown(event) {
  const pointTarget = event.target.closest?.("[data-point-type]");
  const pos = getSvgPoint(event);

  if (pointTarget) {
    if (event.button === 2) {
      event.preventDefault();
      dragTarget = {
        type: pointTarget.dataset.pointType,
        key: pointTarget.dataset.key,
        index: Number(pointTarget.dataset.index || 0),
      };
    }
    if (event.button === 0) {
      event.preventDefault();
      startPan(event, pos, true);
    }
    return;
  }

  if (event.button === 0) {
    event.preventDefault();
    startPan(event, pos, false);
  }
}

function placeAt(pos) {
  if (state.mode === "all") {
    return;
  }
  if (state.mode === "joint") {
    state.joints[state.activeJoint] = pos;
  } else {
    state.parts[state.activePart].push(pos);
  }
  render();
}

function onPointerMove(event) {
  if (panTarget) {
    const dx = event.clientX - panTarget.startX;
    const dy = event.clientY - panTarget.startY;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      panTarget.moved = true;
    }
    els.stage.scrollLeft = panTarget.scrollLeft - dx;
    els.stage.scrollTop = panTarget.scrollTop - dy;
    return;
  }

  if (!dragTarget) {
    return;
  }
  const pos = getSvgPoint(event);
  if (dragTarget.type === "joint") {
    state.joints[dragTarget.key] = pos;
  } else {
    state.parts[dragTarget.key][dragTarget.index] = pos;
  }
  render();
}

function startPan(event, svgPoint, startedOnPoint) {
  panTarget = {
    startX: event.clientX,
    startY: event.clientY,
    scrollLeft: els.stage.scrollLeft,
    scrollTop: els.stage.scrollTop,
    svgPoint,
    startedOnPoint,
    moved: false,
  };
  els.stage.classList.add("panning");
}

function onStageWheel(event) {
  event.preventDefault();
  const rect = els.stage.getBoundingClientRect();
  const oldZoom = state.zoom;
  const zoomFactor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
  const nextZoom = clamp(oldZoom * zoomFactor, 0.8, 8);

  const pointerX = event.clientX - rect.left;
  const pointerY = event.clientY - rect.top;
  const contentX = (els.stage.scrollLeft + pointerX) / oldZoom;
  const contentY = (els.stage.scrollTop + pointerY) / oldZoom;

  state.zoom = nextZoom;
  els.scale.value = String(Math.round(state.zoom * 100));
  render();

  els.stage.scrollLeft = contentX * state.zoom - pointerX;
  els.stage.scrollTop = contentY * state.zoom - pointerY;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getSvgPoint(event) {
  const rect = els.svg.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) / rect.width) * 800),
    y: Math.round(((event.clientY - rect.top) / rect.height) * 560),
  };
}

function render() {
  els.image.src = state.image;
  els.traceName.value = state.traceName;
  els.stage.style.setProperty("--image-opacity", state.opacity);
  els.content.style.width = `${800 * state.zoom}px`;
  els.content.style.height = `${560 * state.zoom}px`;
  els.image.style.transform = `translate(-50%, -50%) scale(${state.scale * state.zoom})`;
  renderJointList();
  renderPartList();
  renderSvg();
  els.json.value = JSON.stringify(toExportData(), null, 2);
}

function renderJointList() {
  els.jointList.innerHTML = JOINTS.map(([key, label]) => {
    const point = state.joints[key];
    return `
      <button class="row ${state.activeJoint === key ? "active" : ""}" type="button" data-joint="${key}">
        <span><strong>${label}</strong>${key}</span>
        <span class="meta">${point.x}, ${point.y}</span>
      </button>
    `;
  }).join("");

  els.jointList.querySelectorAll("[data-joint]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeJoint = button.dataset.joint;
      setMode("joint");
      render();
    });
  });
}

function renderPartList() {
  els.partList.innerHTML = PARTS.map(([key, label]) => {
    const count = state.parts[key].length;
    return `
      <button class="row ${state.activePart === key ? "active" : ""}" type="button" data-part="${key}">
        <span><strong>${label}</strong>${key}</span>
        <span class="meta">${count} 点</span>
      </button>
    `;
  }).join("");

  els.partList.querySelectorAll("[data-part]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activePart = button.dataset.part;
      els.partSelect.value = state.activePart;
      setMode("part");
      render();
    });
  });
}

function renderSvg() {
  const visibleParts =
    state.mode === "part"
      ? [[state.activePart, state.parts[state.activePart] || []]]
      : state.mode === "all"
        ? Object.entries(state.parts)
        : [];

  els.boneLayer.replaceChildren(...(state.mode === "part" ? [] : BONES.map(createBoneLine)));
  els.partLayer.replaceChildren(...visibleParts.map(createPartShape));
  els.pointLayer.replaceChildren(...createPoints());
}

function createBoneLine([from, to]) {
  const start = state.joints[from];
  const end = state.joints[to];
  const line = svg("line", {
    class: "bone-line",
    x1: start.x,
    y1: start.y,
    x2: end.x,
    y2: end.y,
  });
  return line;
}

function createPartShape([key, points]) {
  const group = svg("g", {});
  if (points.length > 1) {
    group.appendChild(
      svg("polygon", {
        class: `part-shape ${key === state.activePart ? "active" : ""}`,
        points: points.map((point) => `${point.x},${point.y}`).join(" "),
      })
    );
  }
  return group;
}

function createPoints() {
  const nodes = [];

  if (state.mode === "joint" || state.mode === "all") {
    for (const [key, label] of JOINTS) {
      const point = state.joints[key];
      const group = svg("g", {
        class: "point joint-point",
        "data-point-type": "joint",
        "data-key": key,
        transform: `translate(${point.x} ${point.y})`,
      });
      group.appendChild(svg("circle", { r: key === state.activeJoint ? 8 : 6 }));
      group.appendChild(svg("text", { x: 9, y: -8 }, label));
      nodes.push(group);
    }
  }

  const visiblePartPoints =
    state.mode === "part"
      ? [[state.activePart, state.parts[state.activePart] || []]]
      : state.mode === "all"
        ? Object.entries(state.parts)
        : [];

  for (const [key, points] of visiblePartPoints) {
    points.forEach((point, index) => {
      const group = svg("g", {
        class: "point part-point",
        "data-point-type": "part",
        "data-key": key,
        "data-index": index,
        transform: `translate(${point.x} ${point.y})`,
      });
      group.appendChild(svg("circle", { r: key === state.activePart ? 6 : 4 }));
      group.appendChild(svg("text", { x: 8, y: 15 }, String(index + 1)));
      nodes.push(group);
    });
  }

  return nodes;
}

function svg(tag, attrs, text = "") {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  if (text) {
    node.textContent = text;
  }
  return node;
}

function toExportData() {
  return {
    schema: "agent_automata_trace_v1",
    project: "western_fantasy_continent",
    name: state.traceName,
    referenceImage: state.image,
    view: {
      type: "three_quarter_side",
      opacity: state.opacity,
      scale: state.scale,
      zoom: state.zoom,
      canvas: { width: 800, height: 560 },
    },
    joints: state.joints,
    bones: BONES.map(([from, to]) => ({ from, to })),
    parts: state.parts,
    slots: {
      head: { bone: "head", part: "head" },
      hair: { bone: "head", part: "hair" },
      face: { bone: "head", part: "face" },
      torso: { bone: "chest", part: "torso" },
      pelvis: { bone: "hip", part: "pelvis" },
      front_upper_arm: { bone: "front_shoulder", part: "front_upper_arm" },
      front_forearm: { bone: "front_elbow", part: "front_forearm" },
      back_upper_arm: { bone: "back_shoulder", part: "back_upper_arm" },
      back_forearm: { bone: "back_elbow", part: "back_forearm" },
      front_leg: { bone: "front_knee", part: "front_leg" },
      back_leg: { bone: "back_knee", part: "back_leg" },
      front_foot: { bone: "front_foot", part: "front_foot" },
      back_foot: { bone: "back_foot", part: "back_foot" },
      weapon: { bone: "weapon_handle", part: "weapon" },
      back_prop: { bone: "back_shoulder", part: "back_prop" },
    },
  };
}

function sanitizeTraceName(value) {
  return String(value || "")
    .trim()
    .replace(/\.json$/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
}

setup();
checkServer();
