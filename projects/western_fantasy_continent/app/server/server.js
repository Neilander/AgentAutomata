const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3777);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(PROJECT_ROOT, "..", "..");
const TRACE_DIR = path.join(PROJECT_ROOT, "trace_tool", "traces");
const GAME_DATA_DIR = path.join(PROJECT_ROOT, "game_data");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".md": "text/markdown; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    ...headers,
  });
  res.end(body);
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value, null, 2), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function safeName(name) {
  const value = String(name || "").replace(/\.json$/i, "");
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return null;
  }
  return value;
}

function safeJoin(base, target) {
  const resolved = path.resolve(base, target);
  if (!resolved.startsWith(base)) {
    return null;
  }
  return resolved;
}

function routeStatic(req, res, url) {
  let targetPath;
  const slashRoutes = new Set([
    "/workbench",
    "/trace_tool",
    "/world_map_demo",
    "/battle_autochess",
    "/advanced_battle_demo",
    "/spine_skeleton_demo",
    "/effect_lab",
  ]);

  if (slashRoutes.has(url.pathname)) {
    send(res, 302, "", { Location: `${url.pathname}/` });
    return true;
  }

  if (url.pathname === "/") {
    send(res, 302, "", { Location: "/workbench/" });
    return true;
  }

  const staticRoots = [
    "workbench",
    "trace_tool",
    "world_map_demo",
    "battle_autochess",
    "advanced_battle_demo",
    "spine_skeleton_demo",
    "effect_lab",
  ];

  const root = staticRoots.find((item) => url.pathname === `/${item}/` || url.pathname.startsWith(`/${item}/`));
  if (root && url.pathname === `/${root}/`) {
    targetPath = path.join(PROJECT_ROOT, root, "index.html");
  } else if (root) {
    targetPath = safeJoin(PROJECT_ROOT, decodeURIComponent(url.pathname.slice(1)));
  } else if (url.pathname.startsWith("/picref/")) {
    targetPath = safeJoin(REPO_ROOT, decodeURIComponent(url.pathname.slice(1)));
  } else {
    return false;
  }

  if (!targetPath || !fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
    sendJson(res, 404, { error: "File not found" });
    return true;
  }

  const ext = path.extname(targetPath).toLowerCase();
  send(res, 200, fs.readFileSync(targetPath), {
    "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
  });
  return true;
}

function listTraces(res) {
  fs.mkdirSync(TRACE_DIR, { recursive: true });
  const traces = fs
    .readdirSync(TRACE_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => {
      const fullPath = path.join(TRACE_DIR, file);
      const stat = fs.statSync(fullPath);
      return {
        name: file.replace(/\.json$/i, ""),
        file,
        updatedAt: stat.mtime.toISOString(),
        size: stat.size,
      };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  sendJson(res, 200, { traces });
}

function readTrace(res, name) {
  const cleanName = safeName(name);
  if (!cleanName) {
    sendJson(res, 400, { error: "Invalid trace name" });
    return;
  }
  const filePath = path.join(TRACE_DIR, `${cleanName}.json`);
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: "Trace not found" });
    return;
  }
  send(res, 200, fs.readFileSync(filePath, "utf8"), {
    "Content-Type": "application/json; charset=utf-8",
  });
}

async function saveTrace(req, res, name) {
  const cleanName = safeName(name);
  if (!cleanName) {
    sendJson(res, 400, { error: "Invalid trace name" });
    return;
  }

  try {
    const body = await readBody(req);
    const parsed = JSON.parse(body);
    fs.mkdirSync(TRACE_DIR, { recursive: true });
    const filePath = path.join(TRACE_DIR, `${cleanName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2), "utf8");
    sendJson(res, 200, {
      ok: true,
      name: cleanName,
      file: path.relative(PROJECT_ROOT, filePath).replace(/\\/g, "/"),
    });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

function readGameData(res, fileName) {
  const filePath = path.join(GAME_DATA_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    sendJson(res, 404, { error: "Game data not found" });
    return;
  }
  send(res, 200, fs.readFileSync(filePath, "utf8"), {
    "Content-Type": "text/javascript; charset=utf-8",
  });
}

function readGameDataSummary(res) {
  const { EQUIPMENT_SETS } = require(path.join(GAME_DATA_DIR, "equipment.js"));
  const { MAX_RELICS_PER_UNIT, RELICS } = require(path.join(GAME_DATA_DIR, "relics.js"));
  const { CLASS_BASE_STATS } = require(path.join(GAME_DATA_DIR, "combat-model.js"));
  sendJson(res, 200, {
    classes: CLASS_BASE_STATS,
    equipmentSets: EQUIPMENT_SETS,
    relics: RELICS,
    maxRelicsPerUnit: MAX_RELICS_PER_UNIT,
  });
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") {
    send(res, 204, "");
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, project: "western_fantasy_continent" });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/traces") {
    listTraces(res);
    return;
  }
  if (req.method === "GET" && url.pathname.startsWith("/api/traces/")) {
    readTrace(res, decodeURIComponent(url.pathname.split("/").pop()));
    return;
  }
  if (req.method === "POST" && url.pathname.startsWith("/api/traces/")) {
    await saveTrace(req, res, decodeURIComponent(url.pathname.split("/").pop()));
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/game-data/equipment") {
    readGameData(res, "equipment.js");
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/game-data/relics") {
    readGameData(res, "relics.js");
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/game-data/summary") {
    readGameDataSummary(res);
    return;
  }

  if (routeStatic(req, res, url)) {
    return;
  }
  sendJson(res, 404, { error: "Not found" });
}

http.createServer(handle).listen(PORT, () => {
  console.log(`Western Fantasy Continent local server: http://localhost:${PORT}/workbench/`);
});
