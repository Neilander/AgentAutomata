const http = require("http");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 3777);
const APP_MODE = process.env.APP_MODE || (PORT === 3777 ? "production" : "test");
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");
const REPO_ROOT = path.resolve(PROJECT_ROOT, "..", "..");
const TRACE_DIR = path.join(PROJECT_ROOT, "trace_tool", "traces");
const GAME_DATA_DIR = path.join(PROJECT_ROOT, "game_data");
const ART_RECORD_DIR = path.join(PROJECT_ROOT, "art_lab", "records");
const ART_IMAGE_DIR = path.join(ART_RECORD_DIR, "images");
const ART_RECORD_FILE = path.join(ART_RECORD_DIR, "records.json");
const ENV_FILE = path.join(REPO_ROOT, "env", ".env");
const API_LOG_FILE = path.join(REPO_ROOT, "logs", "api_calls.jsonl");
const { readTaskBoard, writeTaskBoard } = require(path.join(GAME_DATA_DIR, "task-board-store.js"));

const KEY_DEFINITIONS = [
  { key: "OPENAI_API_KEY", label: "OpenAI API Key", secret: true },
  { key: "OPENAI_IMAGE_MODEL", label: "OpenAI Image Model", secret: false, defaultValue: "gpt-image-2" },
  { key: "OPENAI_TEXT_MODEL", label: "OpenAI Text Model", secret: false, defaultValue: "gpt-5-mini" },
  { key: "GEMINI_API_KEY", label: "Gemini API Key", secret: true },
  { key: "GOOGLE_API_KEY", label: "Google API Key", secret: true },
  { key: "GEMINI_IMAGE_MODEL", label: "Gemini Image Model", secret: false, defaultValue: "gemini-2.5-flash-image" },
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", secret: true },
  { key: "ANTHROPIC_TEXT_MODEL", label: "Anthropic Text Model", secret: false },
  { key: "LEONARDO_API_KEY", label: "Leonardo API Key", secret: true },
  { key: "LEONARDO_MODEL_ID", label: "Leonardo Model ID", secret: false },
  { key: "MIDJOURNEY_API_KEY", label: "MidJourney API Key", secret: true },
];

const AI_MODULES = [
  {
    key: "openai_image",
    name: "OpenAI GPT Image",
    kind: "image",
    status: "ready",
    envKeys: ["OPENAI_API_KEY", "OPENAI_IMAGE_MODEL"],
    notes: "Art Lab image generation and reference-image edits.",
  },
  {
    key: "gemini_image",
    name: "Gemini Image",
    kind: "image",
    status: "ready",
    envKeys: ["GEMINI_API_KEY", "GEMINI_IMAGE_MODEL"],
    notes: "Art Lab secondary image generation path.",
  },
  {
    key: "openai_llm",
    name: "OpenAI Text/Reasoning",
    kind: "llm",
    status: "ready",
    envKeys: ["OPENAI_API_KEY", "OPENAI_TEXT_MODEL"],
    notes: "Planning, summaries, prompt expansion, and future automation tasks.",
  },
  {
    key: "anthropic_llm",
    name: "Anthropic Claude",
    kind: "llm",
    status: "optional",
    envKeys: ["ANTHROPIC_API_KEY", "ANTHROPIC_TEXT_MODEL"],
    notes: "Optional comparison model for planning and writing.",
  },
  {
    key: "leonardo_image",
    name: "Leonardo.ai",
    kind: "image",
    status: "optional",
    envKeys: ["LEONARDO_API_KEY", "LEONARDO_MODEL_ID"],
    notes: "Optional external image batch provider.",
  },
  {
    key: "midjourney_manual",
    name: "MidJourney Manual Import",
    kind: "manual",
    status: "manual",
    envKeys: [],
    notes: "No direct official API assumed; Art Lab can import external results.",
  },
  {
    key: "stats_logger",
    name: "API Call Logger",
    kind: "stats",
    status: "ready",
    envKeys: [],
    notes: "Append-only JSONL usage log in logs/api_calls.jsonl.",
  },
  {
    key: "art_workflows",
    name: "Art Department Workflows",
    kind: "workflow",
    status: "ready",
    envKeys: ["OPENAI_API_KEY", "GEMINI_API_KEY"],
    notes: "Local Python helpers for style prompt building and concept workflows.",
  },
];

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

loadLocalEnv();

function loadLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    return;
  }

  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readLocalEnv() {
  if (!fs.existsSync(ENV_FILE)) {
    return {};
  }
  const values = {};
  for (const line of fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function writeLocalEnv(updates) {
  const allowed = new Set(KEY_DEFINITIONS.map((item) => item.key));
  const current = readLocalEnv();
  for (const [key, value] of Object.entries(updates || {})) {
    if (!allowed.has(key)) continue;
    const normalized = String(value || "").trim();
    if (normalized) {
      current[key] = normalized;
      process.env[key] = normalized;
    } else {
      delete current[key];
      delete process.env[key];
    }
  }
  fs.mkdirSync(path.dirname(ENV_FILE), { recursive: true });
  const lines = [
    "# Local secrets for AgentAutomata. This file is gitignored.",
    ...KEY_DEFINITIONS.map((item) => `${item.key}=${escapeEnvValue(current[item.key] || item.defaultValue || "")}`),
    "",
  ];
  fs.writeFileSync(ENV_FILE, lines.join("\n"), "utf8");
}

function escapeEnvValue(value) {
  const text = String(value || "");
  if (!text || /^[a-zA-Z0-9_.:/@+-]+$/.test(text)) {
    return text;
  }
  return JSON.stringify(text);
}

function maskSecret(value) {
  if (!value) return "";
  const text = String(value);
  if (text.length <= 8) return "configured";
  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function keyStatusList() {
  const local = readLocalEnv();
  return KEY_DEFINITIONS.map((item) => {
    const value = process.env[item.key] || local[item.key] || "";
    return {
      key: item.key,
      label: item.label,
      secret: item.secret,
      configured: Boolean(value),
      value: item.secret ? "" : value,
      masked: item.secret ? maskSecret(value) : value,
      source: process.env[item.key] ? "process/env file" : local[item.key] ? "env/.env" : "",
      defaultValue: item.defaultValue || "",
    };
  });
}

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

function logApiCall(record) {
  fs.mkdirSync(path.dirname(API_LOG_FILE), { recursive: true });
  const payload = {
    timestamp: new Date().toISOString(),
    ...record,
  };
  fs.appendFileSync(API_LOG_FILE, `${JSON.stringify(payload)}\n`, "utf8");
}

function readApiCalls() {
  if (!fs.existsSync(API_LOG_FILE)) {
    return [];
  }
  return fs.readFileSync(API_LOG_FILE, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function apiUsageSummary() {
  const calls = readApiCalls();
  const byProvider = {};
  const byModel = {};
  let totalUnits = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  for (const call of calls) {
    const provider = call.provider || "unknown";
    const model = call.model || "unknown";
    const usage = call.usage || {};
    const units = Number(call.image_count || usage.units || 0);
    const inputTokens = Number(call.input_tokens || usage.input_tokens || 0);
    const outputTokens = Number(call.output_tokens || usage.output_tokens || 0);
    totalUnits += units;
    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
    byProvider[provider] = (byProvider[provider] || 0) + 1;
    byModel[model] = (byModel[model] || 0) + 1;
  }
  return {
    totalCalls: calls.length,
    totalUnits,
    totalInputTokens,
    totalOutputTokens,
    byProvider,
    byModel,
    recent: calls.slice(-30).reverse(),
  };
}

function errorMessage(error) {
  return error && error.message ? error.message : String(error);
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

function safeId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${stamp}_${Math.random().toString(36).slice(2, 8)}`;
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
    "/art_lab",
    "/ai_tools",
    "/genre_arena",
    "/genre_arena_v2",
    "/genre_arena_v3",
    "/encounter_lab",
    "/battle_view",
    "/team_simulator",
    "/tutorial_guide",
    "/tutorial_guide_v2",
    "/tutorial_guide_v3",
    "/dps_lab",
    "/task_board",
    "/keyword_workbench",
    "/life_simulator",
    "/game_data",
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
    "art_lab",
    "ai_tools",
    "genre_arena",
    "genre_arena_v2",
    "genre_arena_v3",
    "encounter_lab",
    "battle_view",
    "team_simulator",
    "tutorial_guide",
    "tutorial_guide_v2",
    "tutorial_guide_v3",
    "dps_lab",
    "task_board",
    "keyword_workbench",
    "life_simulator",
    "game_data",
  ];

  const root = staticRoots.find((item) => url.pathname === `/${item}/` || url.pathname.startsWith(`/${item}/`));
  if (root && url.pathname === `/${root}/`) {
    targetPath = path.join(PROJECT_ROOT, root, "index.html");
  } else if (root) {
    targetPath = safeJoin(PROJECT_ROOT, decodeURIComponent(url.pathname.slice(1)));
  } else if (url.pathname.startsWith("/picref/")) {
    targetPath = safeJoin(REPO_ROOT, decodeURIComponent(url.pathname.slice(1)));
  } else if (url.pathname.startsWith("/art-records/")) {
    targetPath = safeJoin(ART_RECORD_DIR, decodeURIComponent(url.pathname.replace("/art-records/", "")));
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

function ensureArtStore() {
  fs.mkdirSync(ART_IMAGE_DIR, { recursive: true });
  if (!fs.existsSync(ART_RECORD_FILE)) {
    fs.writeFileSync(ART_RECORD_FILE, "[]\n", "utf8");
  }
}

function readArtRecords() {
  ensureArtStore();
  try {
    return JSON.parse(fs.readFileSync(ART_RECORD_FILE, "utf8"));
  } catch {
    return [];
  }
}

function writeArtRecords(records) {
  ensureArtStore();
  fs.writeFileSync(ART_RECORD_FILE, JSON.stringify(records, null, 2), "utf8");
}

function publicArtUrl(filePath) {
  if (!filePath) {
    return "";
  }
  const relative = path.relative(ART_RECORD_DIR, filePath).replace(/\\/g, "/");
  return `/art-records/${relative}`;
}

function extensionFromContentType(contentType, fallback = ".png") {
  const normalized = String(contentType || "").split(";")[0].trim().toLowerCase();
  return {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
  }[normalized] || fallback;
}

function extensionFromFileName(fileName, fallback = ".png") {
  const ext = path.extname(String(fileName || "")).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    return ext === ".jpeg" ? ".jpg" : ext;
  }
  return fallback;
}

function parseMultipart(req, bodyBuffer) {
  const contentType = req.headers["content-type"] || "";
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) {
    throw new Error("Missing multipart boundary");
  }

  const boundary = Buffer.from(`--${match[1] || match[2]}`);
  const fields = {};
  const files = {};
  let cursor = 0;

  while (cursor < bodyBuffer.length) {
    const boundaryStart = bodyBuffer.indexOf(boundary, cursor);
    if (boundaryStart === -1) break;
    const partStart = boundaryStart + boundary.length;
    if (bodyBuffer.slice(partStart, partStart + 2).toString() === "--") break;

    const headerStart = partStart + 2;
    const headerEnd = bodyBuffer.indexOf(Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;

    const nextBoundary = bodyBuffer.indexOf(boundary, headerEnd + 4);
    if (nextBoundary === -1) break;

    const headerText = bodyBuffer.slice(headerStart, headerEnd).toString("utf8");
    const content = bodyBuffer.slice(headerEnd + 4, nextBoundary - 2);
    const nameMatch = headerText.match(/name="([^"]+)"/);
    if (!nameMatch) {
      cursor = nextBoundary;
      continue;
    }

    const fileNameMatch = headerText.match(/filename="([^"]*)"/);
    const typeMatch = headerText.match(/content-type:\s*([^\r\n]+)/i);
    const name = nameMatch[1];
    if (fileNameMatch && fileNameMatch[1]) {
      files[name] = {
        fileName: path.basename(fileNameMatch[1]),
        contentType: typeMatch ? typeMatch[1].trim() : "application/octet-stream",
        buffer: content,
      };
    } else {
      fields[name] = content.toString("utf8");
    }
    cursor = nextBoundary;
  }

  return { fields, files };
}

function readBodyBuffer(req, maxBytes = 30_000_000) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function saveUploadedImage(upload, id, label) {
  if (!upload || !upload.buffer || !upload.buffer.length) {
    return null;
  }
  if (!String(upload.contentType || "").startsWith("image/")) {
    throw new Error(`${label} must be an image`);
  }
  const ext = extensionFromFileName(upload.fileName, extensionFromContentType(upload.contentType));
  const filePath = path.join(ART_IMAGE_DIR, `${id}_${label}${ext}`);
  fs.writeFileSync(filePath, upload.buffer);
  return filePath;
}

function saveGeneratedImage(base64, id, label, contentType = "image/png") {
  const ext = extensionFromContentType(contentType);
  const filePath = path.join(ART_IMAGE_DIR, `${id}_${label}${ext}`);
  fs.writeFileSync(filePath, Buffer.from(base64, "base64"));
  return filePath;
}

function imageToDataUrl(upload) {
  if (!upload || !upload.buffer || !upload.contentType) {
    return "";
  }
  return `data:${upload.contentType};base64,${upload.buffer.toString("base64")}`;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    const message = data.error && (data.error.message || data.error.status) ? data.error.message || data.error.status : text;
    throw new Error(message || `Provider request failed: ${response.status}`);
  }
  return data;
}

async function generateWithOpenAi(fields, files) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in env/.env or the shell environment");
  }

  const prompt = fields.prompt || "";
  const negativePrompt = fields.negativePrompt ? `\nAvoid: ${fields.negativePrompt}` : "";
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
  let data;

  if (files.referenceImage) {
    const body = new FormData();
    body.set("model", model);
    body.set("prompt", `${prompt}${negativePrompt}`);
    body.set("size", process.env.OPENAI_IMAGE_SIZE || "1024x1024");
    body.set(
      "image",
      new Blob([files.referenceImage.buffer], { type: files.referenceImage.contentType }),
      files.referenceImage.fileName || "reference.png"
    );
    data = await requestJson("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });
  } else {
    data = await requestJson("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt: `${prompt}${negativePrompt}`,
        size: process.env.OPENAI_IMAGE_SIZE || "1024x1024",
      }),
    });
  }

  const item = data.data && data.data[0];
  const base64 = item && (item.b64_json || item.b64);
  if (!base64) {
    throw new Error("OpenAI did not return an image payload");
  }
  return { base64, contentType: "image/png", model };
}

async function generateWithGemini(fields, files) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in env/.env or the shell environment");
  }

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
  const parts = [{ text: `${fields.prompt || ""}${fields.negativePrompt ? `\nAvoid: ${fields.negativePrompt}` : ""}` }];
  if (files.referenceImage) {
    parts.push({
      inlineData: {
        mimeType: files.referenceImage.contentType,
        data: files.referenceImage.buffer.toString("base64"),
      },
    });
  }

  const data = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  const partsOut = (((data.candidates || [])[0] || {}).content || {}).parts || [];
  const imagePart = partsOut.find((part) => part.inlineData && part.inlineData.data);
  if (!imagePart) {
    throw new Error("Gemini did not return an image payload");
  }
  return {
    base64: imagePart.inlineData.data,
    contentType: imagePart.inlineData.mimeType || "image/png",
    model,
  };
}

function artStatus(res) {
  sendJson(res, 200, {
    keys: {
      openai: Boolean(process.env.OPENAI_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
    },
    models: {
      openai: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      gemini: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
    },
  });
}

function listArtRecords(res) {
  const records = readArtRecords()
    .map((record) => ({
      ...record,
      referenceUrl: publicArtUrl(record.referencePath),
      outputUrl: publicArtUrl(record.outputPath),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  sendJson(res, 200, { records });
}

function addArtRecord(record) {
  const records = readArtRecords();
  records.push(record);
  writeArtRecords(records);
}

function removeArtRecord(res, id) {
  const records = readArtRecords();
  const index = records.findIndex((item) => item.id === id);
  if (index === -1) {
    sendJson(res, 404, { error: "Record not found" });
    return;
  }

  const [record] = records.splice(index, 1);
  for (const filePath of [record.referencePath, record.outputPath]) {
    if (filePath && filePath.startsWith(ART_RECORD_DIR) && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  writeArtRecords(records);
  sendJson(res, 200, { ok: true });
}

async function importArtRecord(req, res) {
  try {
    const { fields, files } = parseMultipart(req, await readBodyBuffer(req));
    const id = safeId();
    const referencePath = saveUploadedImage(files.referenceImage, id, "reference");
    const outputPath = saveUploadedImage(files.outputImage, id, "output");
    const record = {
      id,
      provider: "manual",
      model: "external",
      prompt: fields.prompt || "",
      negativePrompt: fields.negativePrompt || "",
      styleTag: fields.styleTag || "",
      sourceLink: fields.sourceLink || "",
      notes: fields.notes || "",
      referencePath,
      outputPath,
      candidate: false,
      createdAt: new Date().toISOString(),
    };
    addArtRecord(record);
    sendJson(res, 200, {
      ok: true,
      record: { ...record, referenceUrl: publicArtUrl(referencePath), outputUrl: publicArtUrl(outputPath) },
    });
  } catch (error) {
    sendJson(res, 400, { error: errorMessage(error) });
  }
}

async function generateArtRecord(req, res) {
  try {
    const { fields, files } = parseMultipart(req, await readBodyBuffer(req));
    const provider = fields.provider === "gemini" ? "gemini" : "openai";
    if (!fields.prompt || !fields.prompt.trim()) {
      throw new Error("Prompt is required");
    }

    const id = safeId();
    const result = provider === "gemini"
      ? await generateWithGemini(fields, files)
      : await generateWithOpenAi(fields, files);
    logApiCall({
      provider,
      department: "art",
      project: "western_fantasy_continent",
      task: "art_lab_generate",
      model: result.model,
      image_count: 1,
      usage: {
        units: 1,
        has_reference_image: Boolean(files.referenceImage),
      },
    });
    const referencePath = saveUploadedImage(files.referenceImage, id, "reference");
    const outputPath = saveGeneratedImage(result.base64, id, "output", result.contentType);
    const record = {
      id,
      provider,
      model: result.model,
      prompt: fields.prompt || "",
      negativePrompt: fields.negativePrompt || "",
      styleTag: fields.styleTag || "",
      sourceLink: fields.sourceLink || "",
      notes: fields.notes || "",
      referencePath,
      outputPath,
      candidate: false,
      createdAt: new Date().toISOString(),
    };
    addArtRecord(record);
    sendJson(res, 200, {
      ok: true,
      record: { ...record, referenceUrl: publicArtUrl(referencePath), outputUrl: publicArtUrl(outputPath) },
    });
  } catch (error) {
    sendJson(res, 400, { error: errorMessage(error) });
  }
}

async function updateArtCandidate(req, res, id) {
  try {
    const body = JSON.parse(await readBody(req));
    const records = readArtRecords();
    const record = records.find((item) => item.id === id);
    if (!record) {
      sendJson(res, 404, { error: "Record not found" });
      return;
    }
    record.candidate = Boolean(body.candidate);
    writeArtRecords(records);
    sendJson(res, 200, {
      ok: true,
      record: { ...record, referenceUrl: publicArtUrl(record.referencePath), outputUrl: publicArtUrl(record.outputPath) },
    });
  } catch (error) {
    sendJson(res, 400, { error: errorMessage(error) });
  }
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
    sendJson(res, 200, { ok: true, project: "western_fantasy_continent", port: PORT, mode: APP_MODE });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/art-lab/status") {
    artStatus(res);
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/ai-tools/keys") {
    sendJson(res, 200, { keys: keyStatusList() });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/ai-tools/keys") {
    try {
      const body = JSON.parse(await readBody(req));
      writeLocalEnv(body.updates || {});
      sendJson(res, 200, { ok: true, keys: keyStatusList() });
    } catch (error) {
      sendJson(res, 400, { error: errorMessage(error) });
    }
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/ai-tools/modules") {
    sendJson(res, 200, { modules: AI_MODULES });
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/ai-tools/usage") {
    sendJson(res, 200, apiUsageSummary());
    return;
  }
  if (req.method === "GET" && url.pathname === "/api/art-lab/records") {
    listArtRecords(res);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/art-lab/import") {
    await importArtRecord(req, res);
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/art-lab/generate") {
    await generateArtRecord(req, res);
    return;
  }
  if (req.method === "POST" && url.pathname.startsWith("/api/art-lab/records/") && url.pathname.endsWith("/candidate")) {
    const id = decodeURIComponent(url.pathname.split("/").slice(-2)[0]);
    await updateArtCandidate(req, res, id);
    return;
  }
  if (req.method === "DELETE" && url.pathname.startsWith("/api/art-lab/records/")) {
    removeArtRecord(res, decodeURIComponent(url.pathname.split("/").pop()));
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
  if (req.method === "GET" && url.pathname === "/api/task-board") {
    try {
      sendJson(res, 200, readTaskBoard());
    } catch (error) {
      sendJson(res, 500, { error: errorMessage(error) });
    }
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/task-board") {
    try {
      const body = JSON.parse(await readBody(req));
      sendJson(res, 200, { ok: true, board: writeTaskBoard(body.board || body) });
    } catch (error) {
      sendJson(res, 400, { error: errorMessage(error) });
    }
    return;
  }

  if (routeStatic(req, res, url)) {
    return;
  }
  sendJson(res, 404, { error: "Not found" });
}

http.createServer(handle).listen(PORT, () => {
  console.log(`Western Fantasy Continent local server (${APP_MODE}): http://localhost:${PORT}/workbench/`);
});
