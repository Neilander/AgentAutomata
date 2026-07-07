(() => {
  const TARGET = 10;
  const POOL_URL = "/game_data/candidate_skill_packs/review_audits/2026-07-06_1915/all_candidates.json";
  const REVIEW_URL = "/game_data/candidate_skill_packs/review_audits/2026-07-06_1915/agent_top10.json";
  const PROMPT_URL = "/game_data/candidate_skill_packs/prompt_benchmarks/2026-07-06_1944/prompt_top10.json";
  const RUNS_URL = "/game_data/candidate_skill_packs/runs.json";
  const STORAGE_KEY = "aa_top10_blind_state";
  const LEGACY_STORAGE_KEY = "aa_top10_blind_selected";

  const savedState = readSavedState();

  const state = {
    candidates: [],
    poolIds: savedState.poolIds,
    round: savedState.round,
    review: null,
    promptBenchmark: null,
    selected: new Set(savedState.selected),
  };

  const els = {
    countLabel: document.querySelector("#countLabel"),
    cards: document.querySelector("#cards"),
    selectedList: document.querySelector("#selectedList"),
    clearBtn: document.querySelector("#clearBtn"),
    nextBtn: document.querySelector("#nextBtn"),
    compareBtn: document.querySelector("#compareBtn"),
    comparePanel: document.querySelector("#comparePanel"),
  };

  init().catch((error) => {
    console.error(error);
    els.cards.innerHTML = `<div class="load-error">加载失败：${escapeHtml(error.message)}</div>`;
  });

  async function init() {
    const [pool, review, promptBenchmark, runs] = await Promise.all([
      fetchJson(POOL_URL),
      fetchJson(REVIEW_URL),
      fetchJson(PROMPT_URL),
      fetchJson(RUNS_URL).catch(() => ({ runs: [] })),
    ]);
    state.candidates = await hydrateCandidates(Array.isArray(pool) ? pool : [], runs?.runs || []);
    if (!state.poolIds.length) state.poolIds = state.candidates.map((candidate) => candidate.id);
    pruneStateToCurrentCandidates();
    state.review = review;
    state.promptBenchmark = promptBenchmark;
    els.clearBtn.addEventListener("click", clearSelection);
    els.nextBtn.addEventListener("click", nextRound);
    els.compareBtn.addEventListener("click", toggleCompare);
    persistState();
    render();
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) throw new Error(`${url} ${response.status}`);
    return response.json();
  }

  async function hydrateCandidates(candidates, runs) {
    const byId = new Map();
    await Promise.all((runs || []).map(async (run) => {
      if (!run?.url) return;
      try {
        const payload = await fetchJson(run.url);
        const items = Array.isArray(payload) ? payload : payload?.candidates || [];
        for (const item of items) {
          if (item?.id) byId.set(item.id, item);
        }
      } catch (error) {
        console.warn("candidate run load failed", run.url, error);
      }
    }));

    return candidates.map((candidate) => {
      const full = byId.get(candidate.id);
      return full ? { ...candidate, ...full, run: candidate.run || full.run } : candidate;
    });
  }

  function render() {
    const poolSize = currentPoolCandidates().length;
    const overTarget = state.selected.size > TARGET;
    els.countLabel.textContent = `第 ${state.round} 轮：已选 ${state.selected.size} / ${TARGET}，当前池 ${poolSize}`;
    els.nextBtn.disabled = !overTarget;
    els.compareBtn.disabled = state.selected.size === 0 || overTarget;
    els.compareBtn.title = overTarget ? `已选超过 ${TARGET} 个，先点下一步继续收窄` : "";
    if (overTarget) els.comparePanel.hidden = true;
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
    els.cards.innerHTML = currentPoolCandidates().map((candidate) => {
      const selected = state.selected.has(candidate.id);
      return `
        <article class="candidate-card${selected ? " selected" : ""}">
          <div class="meta">${escapeHtml(candidate.run)} · ${escapeHtml(candidate.role || candidate.profession || "候选")}</div>
          <h3>${escapeHtml(candidate.name)}</h3>
          <p>${escapeHtml(candidate.blindText || candidate.outputPosture || "暂无一句话幻想")}</p>
          <div class="skills">${renderSkills(candidate)}</div>
          <button class="pick-btn" data-id="${escapeHtml(candidate.id)}" type="button">${selected ? "取消" : "选择"}</button>
        </article>
      `;
    }).join("");

    els.cards.querySelectorAll("[data-id]").forEach((button) => {
      button.addEventListener("click", () => toggleCandidate(button.dataset.id));
    });
  }

  function renderSkills(candidate) {
    const skills = normalizedSkills(candidate);
    if (!skills.length) return `<div class="skill">暂无技能文本</div>`;
    return skills.slice(0, 3).map((skill) => `
      <div class="skill">
        <strong>${escapeHtml(skill.slot)} · ${escapeHtml(skill.name || "未命名")}</strong>
        <span>${escapeHtml(skill.text || "")}</span>
      </div>
    `).join("");
  }

  function normalizedSkills(candidate) {
    if (Array.isArray(candidate?.skills)) {
      return candidate.skills.map((skill, index) => ({
        slot: skill.slot || ["被动", "小技能", "大招"][index] || "技能",
        name: skill.name || "",
        text: skill.text || skill.desc || "",
      }));
    }

    const structured = [
      ["被动", candidate?.passive],
      ["小技能", candidate?.smallSkill],
      ["大招", candidate?.ultimate],
    ].filter(([, skill]) => skill);

    if (structured.length) {
      return structured.map(([slot, skill]) => ({
        slot,
        name: skill.name || "",
        text: skill.text || skill.desc || "",
      }));
    }

    return String(candidate?.skills || "")
      .split(" | ")
      .filter(Boolean)
      .map((piece) => {
        const [head, ...rest] = piece.split("=");
        return { slot: head || "技能", name: "", text: rest.join("=") };
      });
  }

  function toggleCandidate(id) {
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    persistState();
    render();
  }

  function clearSelection() {
    state.selected.clear();
    state.poolIds = state.candidates.map((candidate) => candidate.id);
    state.round = 1;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    els.comparePanel.hidden = true;
    render();
  }

  function nextRound() {
    if (state.selected.size <= TARGET) return;
    state.poolIds = selectedCandidates().map((candidate) => candidate.id);
    state.selected.clear();
    state.round += 1;
    els.comparePanel.hidden = true;
    persistState();
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCompare() {
    const willOpen = els.comparePanel.hidden;
    els.comparePanel.hidden = !willOpen;
    renderCompare();
    if (willOpen && !els.comparePanel.hidden) {
      els.comparePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    const selected = new Set(state.selected);
    return currentPoolCandidates().filter((candidate) => selected.has(candidate.id));
  }

  function currentPoolCandidates() {
    const currentIds = new Set(state.poolIds);
    return state.candidates.filter((candidate) => currentIds.has(candidate.id));
  }

  function pruneStateToCurrentCandidates() {
    const candidateIds = new Set(state.candidates.map((candidate) => candidate.id));
    state.poolIds = state.poolIds.filter((id) => candidateIds.has(id));
    const poolIds = new Set(state.poolIds);
    state.selected = new Set([...state.selected].filter((id) => poolIds.has(id)));
  }

  function readSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved && typeof saved === "object") {
        return {
          poolIds: Array.isArray(saved.poolIds) ? saved.poolIds : [],
          round: Number.isFinite(saved.round) && saved.round > 0 ? saved.round : 1,
          selected: Array.isArray(saved.selected) ? saved.selected : [],
        };
      }
    } catch (error) {
      console.warn("top10 saved state parse failed", error);
    }

    try {
      const legacySelected = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "[]");
      return {
        poolIds: [],
        round: 1,
        selected: Array.isArray(legacySelected) ? legacySelected : [],
      };
    } catch (error) {
      return { poolIds: [], round: 1, selected: [] };
    }
  }

  function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      poolIds: state.poolIds,
      round: state.round,
      selected: [...state.selected],
    }));
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
