const state = {
  records: [],
  activeRecord: null,
  keys: {},
};

const els = {
  form: document.getElementById("artForm"),
  provider: document.getElementById("provider"),
  referenceImage: document.getElementById("referenceImage"),
  outputImage: document.getElementById("outputImage"),
  outputField: document.getElementById("outputField"),
  prompt: document.getElementById("prompt"),
  negativePrompt: document.getElementById("negativePrompt"),
  styleTag: document.getElementById("styleTag"),
  sourceLink: document.getElementById("sourceLink"),
  notes: document.getElementById("notes"),
  submitButton: document.getElementById("submitButton"),
  saveManualButton: document.getElementById("saveManualButton"),
  formMessage: document.getElementById("formMessage"),
  providerStatus: document.getElementById("providerStatus"),
  referenceFrame: document.getElementById("referenceFrame"),
  outputFrame: document.getElementById("outputFrame"),
  referencePreview: document.getElementById("referencePreview"),
  outputPreview: document.getElementById("outputPreview"),
  activeMeta: document.getElementById("activeMeta"),
  promptPreview: document.getElementById("promptPreview"),
  markCandidateButton: document.getElementById("markCandidateButton"),
  deleteRecordButton: document.getElementById("deleteRecordButton"),
  historyList: document.getElementById("historyList"),
  refreshButton: document.getElementById("refreshButton"),
};

function setMessage(text, type = "") {
  els.formMessage.textContent = text;
  els.formMessage.className = `form-message ${type}`.trim();
}

function setImage(frame, image, url) {
  if (url) {
    image.src = url;
    frame.classList.add("has-image");
    frame.classList.remove("empty");
  } else {
    image.removeAttribute("src");
    frame.classList.remove("has-image");
    frame.classList.add("empty");
  }
}

function filePreview(input, frame, image) {
  const file = input.files && input.files[0];
  if (!file) {
    setImage(frame, image, "");
    return;
  }
  setImage(frame, image, URL.createObjectURL(file));
}

function providerLabel(value) {
  return {
    openai: "OpenAI",
    gemini: "Gemini",
    manual: "Manual",
  }[value] || value;
}

function updateProviderUi() {
  const provider = els.provider.value;
  const isManual = provider === "manual";
  els.outputField.style.display = isManual ? "grid" : "none";
  els.submitButton.textContent = isManual ? "保存导入记录" : "生成并存档";
  els.saveManualButton.style.display = isManual ? "none" : "block";

  const hasKey = provider === "openai" ? state.keys.openai : provider === "gemini" ? state.keys.gemini : true;
  els.submitButton.disabled = !hasKey && !isManual;
}

function buildKeyStatus() {
  const bits = [
    state.keys.openai ? "OpenAI key 已配置" : "OpenAI key 未配置",
    state.keys.gemini ? "Gemini key 已配置" : "Gemini key 未配置",
    "MidJourney 走手动导入",
  ];
  els.providerStatus.textContent = bits.join(" · ");
  updateProviderUi();
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

function formDataFor(mode) {
  const data = new FormData();
  data.set("provider", mode === "manual" ? "manual" : els.provider.value);
  data.set("prompt", els.prompt.value.trim());
  data.set("negativePrompt", els.negativePrompt.value.trim());
  data.set("styleTag", els.styleTag.value.trim());
  data.set("sourceLink", els.sourceLink.value.trim());
  data.set("notes", els.notes.value.trim());

  if (els.referenceImage.files[0]) {
    data.set("referenceImage", els.referenceImage.files[0]);
  }
  if (els.outputImage.files[0]) {
    data.set("outputImage", els.outputImage.files[0]);
  }
  return data;
}

async function submitRecord(mode) {
  const provider = mode === "manual" ? "manual" : els.provider.value;
  const endpoint = provider === "manual" ? "/api/art-lab/import" : "/api/art-lab/generate";
  setMessage(provider === "manual" ? "正在保存记录..." : "正在生成，可能需要一点时间...");
  els.submitButton.disabled = true;
  els.saveManualButton.disabled = true;

  try {
    const result = await apiJson(endpoint, {
      method: "POST",
      body: formDataFor(provider),
    });
    setMessage("已保存到版本记录。", "ok");
    await loadRecords();
    selectRecord(result.record.id);
  } catch (error) {
    setMessage(error.message, "error");
  } finally {
    els.saveManualButton.disabled = false;
    updateProviderUi();
  }
}

function renderRecords() {
  if (!state.records.length) {
    els.historyList.innerHTML = '<div class="empty-history">还没有记录。可以先上传参考图和 prompt，或者手动导入一张 MidJourney 结果。</div>';
    return;
  }

  els.historyList.innerHTML = state.records.map((record) => {
    const thumb = record.outputUrl || record.referenceUrl || "";
    const created = new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false });
    return `
      <button class="record-card ${state.activeRecord && state.activeRecord.id === record.id ? "active" : ""}" data-id="${record.id}" type="button">
        <div class="record-thumb">${thumb ? `<img src="${thumb}" alt="">` : ""}</div>
        <div class="record-title">
          <span>${providerLabel(record.provider)} · ${created}</span>
          ${record.candidate ? '<span class="badge">候选</span>' : ""}
        </div>
        <p>${escapeHtml(record.prompt || record.notes || "无文字记录")}</p>
      </button>
    `;
  }).join("");

  els.historyList.querySelectorAll(".record-card").forEach((button) => {
    button.addEventListener("click", () => selectRecord(button.dataset.id));
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function selectRecord(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;

  state.activeRecord = record;
  setImage(els.referenceFrame, els.referencePreview, record.referenceUrl);
  setImage(els.outputFrame, els.outputPreview, record.outputUrl);
  els.activeMeta.textContent = `${providerLabel(record.provider)} · ${new Date(record.createdAt).toLocaleString("zh-CN", { hour12: false })}${record.styleTag ? ` · ${record.styleTag}` : ""}`;
  els.promptPreview.textContent = [
    record.prompt || "无 prompt",
    record.negativePrompt ? `\n排除项：${record.negativePrompt}` : "",
    record.notes ? `\n备注：${record.notes}` : "",
    record.sourceLink ? `\n链接：${record.sourceLink}` : "",
  ].join("");
  els.markCandidateButton.textContent = record.candidate ? "取消候选" : "标记候选";
  els.markCandidateButton.disabled = false;
  els.deleteRecordButton.disabled = false;
  renderRecords();
}

async function loadRecords() {
  const data = await apiJson("/api/art-lab/records");
  state.records = data.records || [];
  if (!state.activeRecord && state.records[0]) {
    state.activeRecord = state.records[0];
  }
  renderRecords();
  if (state.activeRecord) {
    selectRecord(state.activeRecord.id);
  }
}

async function loadStatus() {
  const data = await apiJson("/api/art-lab/status");
  state.keys = data.keys || {};
  buildKeyStatus();
}

async function markCandidate() {
  if (!state.activeRecord) return;
  const data = await apiJson(`/api/art-lab/records/${encodeURIComponent(state.activeRecord.id)}/candidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate: !state.activeRecord.candidate }),
  });
  state.activeRecord = data.record;
  await loadRecords();
  selectRecord(data.record.id);
}

async function deleteActiveRecord() {
  if (!state.activeRecord) return;
  const id = state.activeRecord.id;
  await apiJson(`/api/art-lab/records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  state.activeRecord = null;
  setImage(els.referenceFrame, els.referencePreview, "");
  setImage(els.outputFrame, els.outputPreview, "");
  els.activeMeta.textContent = "上传参考图或选择历史记录。";
  els.promptPreview.textContent = "还没有选择记录。";
  els.markCandidateButton.disabled = true;
  els.deleteRecordButton.disabled = true;
  await loadRecords();
}

els.referenceImage.addEventListener("change", () => filePreview(els.referenceImage, els.referenceFrame, els.referencePreview));
els.outputImage.addEventListener("change", () => filePreview(els.outputImage, els.outputFrame, els.outputPreview));
els.provider.addEventListener("change", updateProviderUi);
els.form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitRecord(els.provider.value === "manual" ? "manual" : "generate");
});
els.saveManualButton.addEventListener("click", () => submitRecord("manual"));
els.refreshButton.addEventListener("click", loadRecords);
els.markCandidateButton.addEventListener("click", markCandidate);
els.deleteRecordButton.addEventListener("click", deleteActiveRecord);
els.markCandidateButton.disabled = true;
els.deleteRecordButton.disabled = true;

Promise.all([loadStatus(), loadRecords()]).catch((error) => {
  setMessage(error.message, "error");
});
