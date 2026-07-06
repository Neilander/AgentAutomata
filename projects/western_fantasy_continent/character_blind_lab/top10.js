(() => {
  const MAX = 10;
  const POOL_URL = "/game_data/candidate_skill_packs/review_audits/2026-07-06_1915/all_candidates.json";
  const REVIEW_URL = "/game_data/candidate_skill_packs/review_audits/2026-07-06_1915/agent_top10.json";
  const PROMPT_URL = "/game_data/candidate_skill_packs/prompt_benchmarks/2026-07-06_1944/prompt_top10.json";
  const STORAGE_KEY = "aa_top10_blind_selected";

  const state = {
    candidates: [],
    review: null,
    promptBenchmark: null,
    selected: new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")),
  };

  const els = {
    countLabel: document.querySelector("#countLabel"),
    cards: document.querySelector("#cards"),
    selectedList: document.querySelector("#selectedList"),
    clearBtn: document.querySelector("#clearBtn"),
    compareBtn: document.querySelector("#compareBtn"),
    comparePanel: document.querySelector("#comparePanel"),
  };

  init().catch((error) => {
    console.error(error);
    els.cards.innerHTML = `<div class="load-error">加载失败：${escapeHtml(error.message)}</div>`;
  });

  async function init() {
    const [pool, review, promptBenchmark] = await Promise.all([
      fetchJson(POOL_URL),
      fetchJson(REVIEW_URL),
      fetchJson(PROMPT_URL),
    ]);
    state.candidates = Array.isArray(pool) ? pool : [];
    state.review = review;
    state.promptBenchmark = promptBenchmark;
    els.clearBtn.addEventListener("click", clearSelection);
    els.compareBtn.addEventListener("click", toggleCompare);
    render();
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }

  function render() {
    els.countLabel.textContent = `已选 ${state.selected.size} / ${MAX}`;
    els.compareBtn.disabled = state.selected.size === 0;
    renderSelected();
    renderCards();
    if (!els.comparePanel.hidden) renderCompare();
  }

  function renderSelected() {
    const selected = selectedCandidates();
    els.selectedList.innerHTML = selected.length
      ? selected.map((candidate) => `<li>${escapeHtml(candidate.name)}</li>`).join("")
      : `<li>还没选择</li>`;
  }

  function renderCards() {
    els.cards.innerHTML = state.candidates.map((candidate) => {
      const selected = state.selected.has(candidate.id);
      const disabled = !selected && state.selected.size >= MAX;
      return `
        <article class="candidate-card${selected ? " selected" : ""}">
          <div class="meta">${escapeHtml(candidate.run)} · ${escapeHtml(candidate.role || candidate.profession || "候选")}</div>
          <h3>${escapeHtml(candidate.name)}</h3>
          <p>${escapeHtml(candidate.blindText || "暂无一句话幻想")}</p>
          <div class="skills">${renderSkills(candidate.skills)}</div>
          <button class="pick-btn" data-id="${escapeHtml(candidate.id)}" ${disabled ? "disabled" : ""} type="button">${selected ? "取消" : "选择"}</button>
        </article>
      `;
    }).join("");

    els.cards.querySelectorAll("[data-id]").forEach((button) => {
      button.addEventListener("click", () => toggleCandidate(button.dataset.id));
    });
  }

  function renderSkills(skillsText) {
    const pieces = String(skillsText || "").split(" | ").filter(Boolean).slice(0, 3);
    if (!pieces.length) return `<div class="skill">暂无技能文本</div>`;
    return pieces.map((piece) => {
      const [head, ...rest] = piece.split("=");
      return `<div class="skill"><strong>${escapeHtml(head)}</strong>${escapeHtml(rest.join("="))}</div>`;
    }).join("");
  }

  function toggleCandidate(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else if (state.selected.size < MAX) state.selected.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...state.selected]));
    render();
  }

  function clearSelection() {
    state.selected.clear();
    localStorage.removeItem(STORAGE_KEY);
    els.comparePanel.hidden = true;
    render();
  }

  function toggleCompare() {
    els.comparePanel.hidden = !els.comparePanel.hidden;
    renderCompare();
  }

  function renderCompare() {
    if (els.comparePanel.hidden) return;
    const selectedNames = selectedCandidates().map((candidate) => candidate.name);
    const selectedSet = new Set(selectedNames);
    const combined = state.review?.combinedTop10 || [];
    const combinedResult = scoreList("旧版综合 Top10", combined, selectedSet);
    const promptResults = (state.promptBenchmark?.prompts || [])
      .map((prompt) => ({
        ...scoreList(`${prompt.id} · ${prompt.label}`, prompt.top10 || [], selectedSet),
        prompt,
      }))
      .sort((a, b) => b.score - a.score || a.prompt.id.localeCompare(b.prompt.id));

    const bestPrompt = promptResults[0];
    const matches = combinedResult.matches;
    const misses = combinedResult.misses;
    const extras = selectedNames.filter((name) => !combined.includes(name));

    els.comparePanel.innerHTML = `
      <h2>对比结果</h2>
      <p>你和旧版 agent 综合 Top10 重合 ${matches.length} / ${combined.length}。${bestPrompt ? `目前最贴你的评价 prompt 是「${escapeHtml(bestPrompt.prompt.label)}」，重合 ${bestPrompt.score} / 10。` : ""}</p>

      <div class="compare-grid">
        <div class="compare-card">
          <h3>旧版重合</h3>
          ${renderNameList(matches, "match")}
        </div>
        <div class="compare-card">
          <h3>agent 选了但你没选</h3>
          ${renderNameList(misses, "miss")}
        </div>
        <div class="compare-card">
          <h3>你选了但旧版没选</h3>
          ${renderNameList(extras, "match")}
        </div>
        <div class="compare-card">
          <h3>旧版综合 Top10</h3>
          ${renderNameList(combined, "")}
        </div>
      </div>

      <section class="prompt-compare">
        <h3>prompt 审美拟合</h3>
        <div class="prompt-list">
          ${promptResults.map(renderPromptResult).join("")}
        </div>
      </section>
    `;
  }

  function scoreList(label, names, selectedSet) {
    const matches = names.filter((name) => selectedSet.has(name));
    return {
      label,
      names,
      score: matches.length,
      matches,
      misses: names.filter((name) => !selectedSet.has(name)),
    };
  }

  function renderPromptResult(result) {
    const prompt = result.prompt;
    return `
      <article class="prompt-card">
        <div class="prompt-score">${result.score}/10</div>
        <div>
          <h4>${escapeHtml(result.label)}</h4>
          <p>${escapeHtml(prompt.criteria)}</p>
          <div class="prompt-matches">${renderNameChips(result.matches)}</div>
        </div>
      </article>
    `;
  }

  function renderNameChips(names) {
    if (!names.length) return `<span class="chip muted">无重合</span>`;
    return names.map((name) => `<span class="chip">${escapeHtml(name)}</span>`).join("");
  }

  function renderNameList(names, className) {
    if (!names.length) return `<p>无</p>`;
    return `<ol>${names.map((name) => `<li class="${className}">${escapeHtml(name)}</li>`).join("")}</ol>`;
  }

  function selectedCandidates() {
    return state.candidates.filter((candidate) => state.selected.has(candidate.id));
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
