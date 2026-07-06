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
    run: DEFAULT_RUNS[0],
    data: null,
    page: 0,
    selected: new Set(JSON.parse(localStorage.getItem("aa_blind_selected") || "[]")),
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
      state.run = state.runs.find((run) => run.id === els.runSelect.value) || state.runs[0];
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
        state.run = state.runs[0];
      }
    } catch (error) {
      state.runs = DEFAULT_RUNS;
      state.run = state.runs[0];
    }
  }

  function renderRunSelect() {
    els.runSelect.innerHTML = state.runs
      .map((run) => `<option value="${escapeHtml(run.id)}">${escapeHtml(run.label || run.id)}</option>`)
      .join("");
    els.runSelect.value = state.run.id;
  }

  async function loadRun() {
    try {
      const response = await fetch(state.run.url, { cache: "no-cache" });
      if (!response.ok) throw new Error(`run ${response.status}`);
      state.data = await response.json();
    } catch (error) {
      state.data = { candidates: [], error: String(error) };
    }
    render();
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
          <p>${escapeHtml(candidate.outputPosture || "")}</p>
        </div>
        <div class="skill-list">
          ${renderSkill("Passive", candidate.passive)}
          ${renderSkill("Skill", candidate.smallSkill)}
          ${renderSkill("Ultimate", candidate.ultimate)}
        </div>
        <button class="select-btn" data-select="${escapeHtml(candidate.id)}" type="button">${selected ? "Selected" : "Like"}</button>
      </article>
    `;
  }

  function renderSkill(label, skill = {}) {
    return `
      <div class="skill">
        <strong>${label} - ${escapeHtml(skill.name || "Unnamed")}</strong>
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
