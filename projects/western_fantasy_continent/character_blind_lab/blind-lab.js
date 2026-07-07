(() => {
  const DEFAULT_RUNS = [
    {
      id: "2026-07-06_1419",
      label: "2026-07-06 14:19 Run 1",
      url: "/game_data/candidate_skill_packs/2026-07-06_1419/candidates.json",
    },
  ];

  const state = {
    runs: DEFAULT_RUNS,
    run: { id: "mixed", label: "全部轮次洗混", url: "" },
    data: null,
    page: 0,
    selected: new Set(JSON.parse(localStorage.getItem("aa_blind_selected") || "[]")),
    shuffleSeed: localStorage.getItem("aa_blind_shuffle_seed") || String(Date.now()),
  };

  const els = {
    runSelect: document.querySelector("#runSelect"),
    cards: document.querySelector("#cards"),
    prevBtn: document.querySelector("#prevBtn"),
    nextBtn: document.querySelector("#nextBtn"),
    revealBtn: document.querySelector("#revealBtn"),
    revealPanel: document.querySelector("#revealPanel"),
  };

  init();

  async function init() {
    await loadRuns();
    renderRunSelect();
    els.runSelect.addEventListener("change", async () => {
      state.run = els.runSelect.value === "mixed"
        ? mixedRun()
        : state.runs.find((run) => run.id === els.runSelect.value) || mixedRun();
      state.page = 0;
      els.revealPanel.hidden = true;
      await loadRun();
    });
    els.prevBtn.addEventListener("click", () => {
      state.page = Math.max(0, state.page - 1);
      render();
    });
    els.nextBtn.addEventListener("click", () => {
      const maxPage = Math.max(0, Math.ceil((state.data?.candidates?.length || 0) / 5) - 1);
      state.page = Math.min(maxPage, state.page + 1);
      render();
    });
    els.revealBtn.addEventListener("click", () => {
      els.revealPanel.hidden = !els.revealPanel.hidden;
      renderReveal();
    });
    await loadRun();
  }

  async function loadRuns() {
    try {
      const response = await fetch("/game_data/candidate_skill_packs/runs.json", { cache: "no-cache" });
      if (!response.ok) throw new Error(`runs ${response.status}`);
      const manifest = await response.json();
      if (Array.isArray(manifest.runs) && manifest.runs.length) {
        state.runs = manifest.runs;
        state.run = mixedRun();
      }
    } catch (error) {
      state.runs = DEFAULT_RUNS;
      state.run = mixedRun();
    }
  }

  function renderRunSelect() {
    const options = [mixedRun(), ...state.runs];
    els.runSelect.innerHTML = options
      .map((run) => `<option value="${escapeHtml(run.id)}">${escapeHtml(run.label || run.id)}</option>`)
      .join("");
    els.runSelect.value = state.run.id;
  }

  async function loadRun() {
    try {
      state.data = state.run.id === "mixed" ? await loadMixedRun() : await fetchRun(state.run);
    } catch (error) {
      state.data = { candidates: [], error: String(error) };
    }
    render();
  }

  function mixedRun() {
    return { id: "mixed", label: "全部轮次洗混", url: "" };
  }

  async function fetchRun(run) {
    const response = await fetch(run.url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`run ${response.status}`);
    return response.json();
  }

  async function loadMixedRun() {
    if (!localStorage.getItem("aa_blind_shuffle_seed")) {
      localStorage.setItem("aa_blind_shuffle_seed", state.shuffleSeed);
    }
    const results = await Promise.all(state.runs.map(async (run) => {
      try {
        const data = await fetchRun(run);
        const candidates = (data.candidates || []).map((candidate) => ({
          ...candidate,
          runId: run.id,
          runLabel: run.label || run.id,
        }));
        return candidates;
      } catch (error) {
        console.warn("run load failed", run.url, error);
        return [];
      }
    }));
    return {
      sourcePrompt: "mixed runs",
      candidates: stableShuffle(results.flat(), state.shuffleSeed),
    };
  }

  function stableShuffle(items, seedText) {
    const scored = items.map((item, index) => ({
      item,
      score: hashString(`${seedText}:${item.id || index}`),
    }));
    scored.sort((a, b) => a.score - b.score);
    return scored.map((entry) => entry.item);
  }

  function hashString(text) {
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function render() {
    const candidates = state.data?.candidates || [];
    const start = state.page * 5;
    const pageItems = candidates.slice(start, start + 5);
    els.prevBtn.disabled = state.page <= 0;
    els.nextBtn.disabled = start + 5 >= candidates.length;
    if (!pageItems.length) {
      els.cards.innerHTML = `<div class="empty">This run has no candidates yet.</div>`;
      renderReveal();
      return;
    }
    els.cards.innerHTML = pageItems.map(renderCard).join("");
    els.cards.querySelectorAll("[data-select]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.select;
        if (state.selected.has(id)) state.selected.delete(id);
        else state.selected.add(id);
        localStorage.setItem("aa_blind_selected", JSON.stringify([...state.selected]));
        render();
      });
    });
    renderReveal();
  }

  function renderCard(candidate) {
    const selected = state.selected.has(candidate.id);
    return `
      <article class="candidate-card${selected ? " selected" : ""}">
        <div>
          <div class="role-line">${escapeHtml(candidate.role || "Unknown role")}</div>
          <h2>${escapeHtml(candidate.name)}</h2>
          <p>${escapeHtml(candidate.outputPosture || candidate.blindText || "")}</p>
        </div>
        <div class="skill-list">
          ${renderSkills(candidate)}
        </div>
        <button class="select-btn" data-select="${escapeHtml(candidate.id)}" type="button">${selected ? "Selected" : "Like"}</button>
      </article>
    `;
  }

  function renderSkills(candidate) {
    const skills = normalizedSkills(candidate);
    if (!skills.length) return `<div class="skill"><strong>技能</strong><span>暂无技能文本</span></div>`;
    return skills.slice(0, 3).map((skill) => renderSkill(skill.slot, skill)).join("");
  }

  function normalizedSkills(candidate) {
    if (Array.isArray(candidate?.skills)) {
      return candidate.skills.map((skill, index) => ({
        slot: skill.slot || ["被动", "小技能", "大招"][index] || "技能",
        name: skill.name || "",
        text: skill.text || skill.desc || "",
      }));
    }

    return [
      ["被动", candidate?.passive],
      ["小技能", candidate?.smallSkill],
      ["大招", candidate?.ultimate],
    ]
      .filter(([, skill]) => skill)
      .map(([slot, skill]) => ({
        slot,
        name: skill.name || "",
        text: skill.text || skill.desc || "",
      }));
  }

  function renderSkill(label, skill = {}) {
    return `
      <div class="skill">
        <strong>${escapeHtml(label)} - ${escapeHtml(skill.name || "Unnamed")}</strong>
        <span>${escapeHtml(skill.text || "")}</span>
      </div>
    `;
  }

  function renderReveal() {
    if (els.revealPanel.hidden) return;
    const candidates = state.data?.candidates || [];
    const selected = candidates.filter((candidate) => state.selected.has(candidate.id));
    if (!selected.length) {
      els.revealPanel.innerHTML = `<p>No selected candidates in this run.</p>`;
      return;
    }
    els.revealPanel.innerHTML = selected.map((candidate) => `
      <div class="reveal-item">
        <h3>${escapeHtml(candidate.name)}</h3>
        <p><strong>Prompt:</strong> ${escapeHtml(candidate.promptTag || state.data?.sourcePrompt || "not recorded")}</p>
        <p><strong>Screening:</strong> ${escapeHtml(candidate.screening || "not recorded")}</p>
        <p><strong>Build thought:</strong> ${escapeHtml(candidate.hiddenBuildThought || "not recorded")}</p>
      </div>
    `).join("");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }
})();
