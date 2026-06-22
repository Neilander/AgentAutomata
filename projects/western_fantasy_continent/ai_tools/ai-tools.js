const state = {
  keys: [],
  modules: [],
  usage: null,
};

const els = {
  keyList: document.getElementById("keyList"),
  keyMessage: document.getElementById("keyMessage"),
  saveKeysButton: document.getElementById("saveKeysButton"),
  refreshButton: document.getElementById("refreshButton"),
  moduleList: document.getElementById("moduleList"),
  recentCalls: document.getElementById("recentCalls"),
  totalCalls: document.getElementById("totalCalls"),
  totalUnits: document.getElementById("totalUnits"),
  inputTokens: document.getElementById("inputTokens"),
  outputTokens: document.getElementById("outputTokens"),
};

async function apiJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderKeys() {
  els.keyList.innerHTML = state.keys.map((item) => {
    const placeholder = item.secret
      ? item.configured ? `${item.masked}，留空不修改，输入 DELETE 清空` : "粘贴本地 key"
      : item.defaultValue || "可选";
    const value = item.secret ? "" : item.value || item.defaultValue || "";
    return `
      <div class="key-row" data-key="${escapeHtml(item.key)}" data-secret="${item.secret ? "1" : "0"}">
        <div class="key-label">
          <strong>${escapeHtml(item.label)}</strong>
          <span>${escapeHtml(item.key)}</span>
        </div>
        <input type="${item.secret ? "password" : "text"}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}">
        <span class="badge ${item.configured ? "ok" : "warn"}">${item.configured ? "已配置" : "未配置"}</span>
      </div>
    `;
  }).join("");
}

function renderModules() {
  els.moduleList.innerHTML = state.modules.map((item) => {
    const envKeys = (item.envKeys || []).map((key) => `<span class="pill">${escapeHtml(key)}</span>`).join("");
    return `
      <article class="module-card">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.notes)}</span>
        <div class="module-meta">
          <span class="pill">${escapeHtml(item.kind)}</span>
          <span class="pill">${escapeHtml(item.status)}</span>
          ${envKeys}
        </div>
      </article>
    `;
  }).join("");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("zh-CN");
}

function renderUsage() {
  const usage = state.usage || {};
  els.totalCalls.textContent = formatNumber(usage.totalCalls);
  els.totalUnits.textContent = formatNumber(usage.totalUnits);
  els.inputTokens.textContent = formatNumber(usage.totalInputTokens);
  els.outputTokens.textContent = formatNumber(usage.totalOutputTokens);
  const recent = usage.recent || [];
  if (!recent.length) {
    els.recentCalls.innerHTML = '<article class="call-card"><strong>暂无调用记录</strong><span>通过 Art Lab 或 shared/* client 调用后会出现在这里。</span></article>';
    return;
  }
  els.recentCalls.innerHTML = recent.map((item) => `
    <article class="call-card">
      <strong>${escapeHtml(item.provider || "unknown")} · ${escapeHtml(item.model || "unknown")}</strong>
      <span>${new Date(item.timestamp).toLocaleString("zh-CN", { hour12: false })} · ${escapeHtml(item.department || "")} · ${escapeHtml(item.task || "")}</span>
      <span>images/units: ${formatNumber(item.image_count || item.usage?.units || 0)} · input: ${formatNumber(item.input_tokens || item.usage?.input_tokens || 0)} · output: ${formatNumber(item.output_tokens || item.usage?.output_tokens || 0)}</span>
    </article>
  `).join("");
}

async function loadAll() {
  const [keys, modules, usage] = await Promise.all([
    apiJson("/api/ai-tools/keys"),
    apiJson("/api/ai-tools/modules"),
    apiJson("/api/ai-tools/usage"),
  ]);
  state.keys = keys.keys || [];
  state.modules = modules.modules || [];
  state.usage = usage;
  renderKeys();
  renderModules();
  renderUsage();
}

async function saveKeys() {
  const updates = {};
  els.keyList.querySelectorAll(".key-row").forEach((row) => {
    const key = row.dataset.key;
    const isSecret = row.dataset.secret === "1";
    const value = row.querySelector("input").value.trim();
    if (isSecret && !value) return;
    if (isSecret && value.toUpperCase() === "DELETE") {
      updates[key] = "";
      return;
    }
    updates[key] = value;
  });
  els.keyMessage.textContent = "正在保存...";
  els.keyMessage.className = "message";
  try {
    const data = await apiJson("/api/ai-tools/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
    });
    state.keys = data.keys || [];
    renderKeys();
    els.keyMessage.textContent = "已保存到本地 env/.env";
    els.keyMessage.className = "message ok";
  } catch (error) {
    els.keyMessage.textContent = error.message;
    els.keyMessage.className = "message error";
  }
}

els.saveKeysButton.addEventListener("click", saveKeys);
els.refreshButton.addEventListener("click", loadAll);

loadAll().catch((error) => {
  els.keyMessage.textContent = error.message;
  els.keyMessage.className = "message error";
});
