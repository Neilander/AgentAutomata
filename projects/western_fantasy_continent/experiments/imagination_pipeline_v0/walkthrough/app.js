"use strict";

(() => {
  const data = window.IMAGINATION_WALKTHROUGH_DATA;
  if (!data) {
    document.body.innerHTML = "<p style='padding:2rem;color:#fff'>缺少 walkthrough-data.js，请先运行 build-walkthrough-data.js。</p>";
    return;
  }

  const state = {
    index: 0,
    rawTab: "input",
    timer: null,
  };

  const elements = {
    baseline: document.querySelector("#baseline-label"),
    runStatus: document.querySelector("#run-status"),
    scenarioLabel: document.querySelector("#scenario-label"),
    scopeLabel: document.querySelector("#scope-label"),
    flowRail: document.querySelector("#flow-rail"),
    stepList: document.querySelector("#step-list"),
    stepCounter: document.querySelector("#step-counter"),
    observedBoard: document.querySelector("#observed-board"),
    imaginedBoard: document.querySelector("#imagined-board"),
    observedHealth: document.querySelector("#observed-health"),
    imaginedHealth: document.querySelector("#imagined-health"),
    deltaBanner: document.querySelector("#delta-banner"),
    detailStage: document.querySelector("#detail-stage"),
    detailEyebrow: document.querySelector("#detail-eyebrow"),
    detailTitle: document.querySelector("#detail-title"),
    detailSummary: document.querySelector("#detail-summary"),
    detailDecision: document.querySelector("#detail-decision"),
    outputTitle: document.querySelector("#output-title"),
    outputNote: document.querySelector("#output-note"),
    detailVisual: document.querySelector("#detail-visual"),
    checksList: document.querySelector("#checks-list"),
    rawJson: document.querySelector("#raw-json"),
    rawTabs: [...document.querySelectorAll("[data-raw-tab]")],
    previous: document.querySelector("#previous-button"),
    play: document.querySelector("#play-button"),
    next: document.querySelector("#next-button"),
    progressFill: document.querySelector("#progress-fill"),
    footerStepLabel: document.querySelector("#footer-step-label"),
    footerStepTitle: document.querySelector("#footer-step-title"),
  };

  const slotLabels = {
    affected_object: "受影响对象",
    change_trend: "变化趋势",
    cause_relation: "原因关系",
    temporal_state: "时间状态",
    context: "语境",
  };

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function displayValue(value) {
    if (value === true) return "true";
    if (value === false) return "false";
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function renderFlowRail() {
    const visited = new Set(data.steps.slice(0, state.index + 1).map((step) => step.stageId));
    const currentStage = data.steps[state.index].stageId;
    elements.flowRail.innerHTML = data.stages.map((stage) => `
      <button type="button"
        class="flow-node${visited.has(stage.id) ? " is-visited" : ""}${stage.id === currentStage ? " is-active" : ""}"
        data-stage-id="${escapeHtml(stage.id)}"
        aria-current="${stage.id === currentStage ? "step" : "false"}">
        <span class="flow-number">${escapeHtml(stage.number)}</span>
        <strong>${escapeHtml(stage.label)}</strong>
        <small>${escapeHtml(stage.output)}</small>
      </button>
    `).join("");
  }

  function renderStepList() {
    elements.stepList.innerHTML = data.steps.map((step, index) => {
      const stage = data.stages.find((candidate) => candidate.id === step.stageId);
      return `
        <button type="button"
          class="step-button${index === state.index ? " is-active" : ""}${index < state.index ? " is-complete" : ""}"
          data-step-index="${index}"
          aria-current="${index === state.index ? "step" : "false"}">
          <span class="step-index">${String(step.number).padStart(2, "0")}</span>
          <span class="step-copy">
            <small>${escapeHtml(stage.label)}</small>
            <strong>${escapeHtml(step.title)}</strong>
          </span>
        </button>
      `;
    }).join("");
  }

  function tileAt(world, column, row) {
    return world.tiles.find((tile) => tile.column === column && tile.row === row) || null;
  }

  function objectsAt(world, column, row) {
    return world.objects.filter((object) => object.column === column && object.row === row);
  }

  function tileGlyph(tile) {
    if (!tile) return "";
    if (tile.kind === "arrow") return "→";
    if (tile.kind === "city") return "城";
    if (tile.kind === "choice") return "?";
    if (tile.kind === "random") return "◇";
    if (tile.kind === "mystery") return "…";
    return "";
  }

  function renderBoard(target, world) {
    const columns = ["B", "C"];
    let html = '<span class="board-label"></span>';
    html += columns.map((column) => `<span class="board-label">${column}</span>`).join("");
    for (let row = 1; row <= 8; row += 1) {
      html += `<span class="board-label">${row}</span>`;
      for (const column of columns) {
        const tile = tileAt(world, column, row);
        const objects = objectsAt(world, column, row);
        const tileClass = tile ? ` is-${escapeHtml(tile.kind)}` : "";
        html += `
          <div class="board-cell${tileClass}" data-cell="${column}:${row}">
            ${tileGlyph(tile) ? `<span class="tile-glyph">${escapeHtml(tileGlyph(tile))}</span>` : ""}
            <div class="object-stack">
              ${objects.map((object) => `
                <div class="ship-token${object.frozen ? " is-frozen" : ""}" title="${escapeHtml(object.id)}">
                  <span>${escapeHtml(object.id.replace("ship-", ""))}</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }
    }
    target.innerHTML = html;
  }

  function renderHealth(target, world) {
    const current = world.city.health;
    const maximum = 3;
    target.innerHTML = `
      <div class="health-row"><span>城市生命</span><strong>${current} / ${maximum}</strong></div>
      <div class="health-pips" aria-label="城市生命 ${current} / ${maximum}">
        ${Array.from({ length: maximum }, (_, index) => `<i class="health-pip${index < current ? " is-full" : ""}"></i>`).join("")}
      </div>
    `;
  }

  function renderKeyValues(values) {
    return `
      <div class="kv-grid">
        ${Object.entries(values).map(([key, value]) => `
          <div class="kv-item"><small>${escapeHtml(key)}</small><strong title="${escapeHtml(displayValue(value))}">${escapeHtml(displayValue(value))}</strong></div>
        `).join("")}
      </div>
    `;
  }

  function renderAction(detail) {
    return `
      <div class="action-instance">
        <span class="action-id">${escapeHtml(detail.actionInstance.patternId)}</span>
        ${renderKeyValues(detail.actionInstance.parameters)}
        ${renderKeyValues({ actorRef: detail.actionInstance.actorRef, exit: detail.actionInstance.exit, goal: detail.goal.kind })}
      </div>
    `;
  }

  function renderAttention(detail) {
    const percentage = Math.min(100, (detail.selected.length / detail.total) * 100);
    return `
      <div class="budget-meter">
        <div class="budget-copy"><span>已选 ${detail.selected.length} / 总计 ${detail.total}</span><strong>预算 ${detail.budget}</strong></div>
        <div class="meter-track"><span style="width:${percentage}%"></span></div>
        <div class="atom-cloud">
          ${detail.selected.map((atom) => `<span class="atom-chip" title="激活 ${atom.activation.toFixed(3)}">${escapeHtml(atom.id)}</span>`).join("")}
        </div>
      </div>
    `;
  }

  function renderQueries(detail) {
    return `
      <div class="query-stack">
        ${detail.queries.map((query, index) => `
          <article class="query-card">
            <div class="query-head">
              <strong>Q ${String(index + 1).padStart(2, "0")}</strong>
              <span>${escapeHtml(query.metadata?.objectId || query.metadata?.kind || "state")}</span>
            </div>
            <div class="query-slots">
              ${Object.entries(query.q).map(([key, value]) => `
                <div class="query-slot"><small>${escapeHtml(slotLabels[key] || key)}</small><span>${escapeHtml(value)}</span></div>
              `).join("")}
            </div>
          </article>
        `).join("")}
      </div>
    `;
  }

  function candidateRows(activation) {
    const maximum = Math.max(...activation.candidates.map((candidate) => candidate.activation), 1);
    return activation.candidates.map((candidate) => `
      <div class="candidate-row">
        <div class="candidate-main">
          <span title="${escapeHtml(candidate.trajectoryId)}">${escapeHtml(candidate.trajectoryId)}</span>
          <div class="activation-track"><span style="width:${Math.max(0, candidate.activation / maximum * 100)}%"></span></div>
        </div>
        <span class="candidate-score">${candidate.activation.toFixed(3)}</span>
      </div>
    `).join("");
  }

  function renderActivation(detail) {
    return `
      <div class="activation-stack">
        ${detail.activations.map((activation) => `
          <article class="activation-group">
            <div class="activation-head"><strong>${escapeHtml(activation.objectId)}</strong><span>${escapeHtml(activation.queryKind)}</span></div>
            ${candidateRows(activation)}
          </article>
        `).join("")}
        ${detail.rejections.map((rejection) => `
          <div class="rejection-row">拒绝 ${escapeHtml(rejection.trajectoryId)}<br>${escapeHtml(rejection.reason)}</div>
        `).join("")}
        ${detail.accepted ? `<div class="accepted-rule">接受 ${escapeHtml(detail.accepted.id)}<br>${escapeHtml(detail.accepted.sourceQuote)}</div>` : ""}
      </div>
    `;
  }

  function patchLabel(patch) {
    if (patch.kind === "move_object") {
      return `${patch.objectId}: ${patch.fromColumn}${patch.fromRow} → ${patch.toColumn}${patch.toRow}`;
    }
    if (patch.kind === "set_city_health") {
      return `city.health: ${patch.fromHealth} → ${patch.toHealth}`;
    }
    return JSON.stringify(patch);
  }

  function renderGrounding(detail) {
    const grounding = detail.grounding;
    const reads = [...new Set(grounding.reads)];
    return `
      <article class="grounding-card">
        <div class="grounding-head">
          <span class="rule-id">${escapeHtml(grounding.trajectoryId)}</span>
          <span class="status-pill status-complete">${grounding.committed ? "committed" : "not committed"}</span>
        </div>
        <div class="patch-list">
          ${grounding.patches.length ? grounding.patches.map((patch) => `<div class="patch-row">${escapeHtml(patchLabel(patch))}</div>`).join("") : '<div class="patch-row">无世界补丁</div>'}
        </div>
        <div class="read-list">
          ${reads.map((read) => `<span>${escapeHtml(read)}</span>`).join("")}
        </div>
        ${detail.excluded?.length ? `<div class="excluded-row">排除：${detail.excluded.map(escapeHtml).join("、")}</div>` : ""}
      </article>
    `;
  }

  function renderFinish(detail) {
    return `
      <div class="finish-card">
        <span class="boundary-kind">${escapeHtml(detail.boundary.kind)}</span>
        <div class="boundary-reason">${escapeHtml(detail.boundary.reason)}</div>
        ${renderKeyValues({
          "设想注意消耗": `${detail.attentionAccount.spent} / ${detail.attentionAccount.initial}`,
          "剩余": detail.attentionAccount.remaining,
          "补丁已提交": detail.grounding.committed,
          "最终规则": detail.grounding.trajectoryId,
        })}
      </div>
    `;
  }

  function renderDetailVisual(step) {
    if (step.detailKind === "action") return renderAction(step.detail);
    if (step.detailKind === "attention") return renderAttention(step.detail);
    if (step.detailKind === "queries") return renderQueries(step.detail);
    if (step.detailKind === "activation") return renderActivation(step.detail);
    if (step.detailKind === "grounding") return renderGrounding(step.detail);
    if (step.detailKind === "finish") return renderFinish(step.detail);
    return "";
  }

  function renderRaw(step) {
    elements.rawTabs.forEach((tab) => {
      const active = tab.dataset.rawTab === state.rawTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    elements.rawJson.textContent = JSON.stringify(step.raw[state.rawTab], null, 2);
  }

  function render() {
    const step = data.steps[state.index];
    const stage = data.stages.find((candidate) => candidate.id === step.stageId);
    const observedWorld = data.scenario.observedWorld;

    renderFlowRail();
    renderStepList();
    renderBoard(elements.observedBoard, observedWorld);
    renderBoard(elements.imaginedBoard, step.world);
    renderHealth(elements.observedHealth, observedWorld);
    renderHealth(elements.imaginedHealth, step.world);

    elements.stepCounter.textContent = `${state.index + 1} / ${data.steps.length}`;
    elements.detailStage.textContent = `${stage.number} · ${stage.label}`;
    elements.detailEyebrow.textContent = `STEP ${String(step.number).padStart(2, "0")} / ${step.eyebrow}`;
    elements.detailTitle.textContent = step.title;
    elements.detailSummary.textContent = step.summary;
    elements.detailDecision.textContent = step.decision;
    elements.outputTitle.textContent = step.outputHeadline;
    elements.outputNote.textContent = step.outputNote;
    elements.detailVisual.innerHTML = renderDetailVisual(step);
    elements.checksList.innerHTML = step.checks.map((check) => `<li>${escapeHtml(check)}</li>`).join("");
    elements.deltaBanner.dataset.tone = step.delta.tone;
    elements.deltaBanner.innerHTML = `<strong>${escapeHtml(step.delta.label)}</strong><span>${escapeHtml(step.delta.text)}</span>`;
    elements.footerStepLabel.textContent = `步骤 ${String(step.number).padStart(2, "0")} / ${String(data.steps.length).padStart(2, "0")}`;
    elements.footerStepTitle.textContent = step.title;
    elements.progressFill.style.width = `${((state.index + 1) / data.steps.length) * 100}%`;
    elements.previous.disabled = state.index === 0;
    elements.next.disabled = state.index === data.steps.length - 1;
    renderRaw(step);
  }

  function stopPlayback() {
    if (state.timer) window.clearInterval(state.timer);
    state.timer = null;
    elements.play.classList.remove("is-playing");
    elements.play.querySelector(".play-icon").textContent = "▶";
    elements.play.querySelector(".play-label").textContent = "自动播放";
  }

  function goTo(index, { keepPlayback = false } = {}) {
    const nextIndex = Math.max(0, Math.min(data.steps.length - 1, index));
    state.index = nextIndex;
    if (!keepPlayback) stopPlayback();
    render();
    const activeButton = elements.stepList.querySelector(".step-button.is-active");
    activeButton?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }

  function togglePlayback() {
    if (state.timer) {
      stopPlayback();
      return;
    }
    if (state.index === data.steps.length - 1) state.index = 0;
    elements.play.classList.add("is-playing");
    elements.play.querySelector(".play-icon").textContent = "Ⅱ";
    elements.play.querySelector(".play-label").textContent = "暂停";
    render();
    state.timer = window.setInterval(() => {
      if (state.index >= data.steps.length - 1) {
        stopPlayback();
        return;
      }
      goTo(state.index + 1, { keepPlayback: true });
    }, 2400);
  }

  function bindEvents() {
    elements.flowRail.addEventListener("click", (event) => {
      const button = event.target.closest("[data-stage-id]");
      if (!button) return;
      const index = data.steps.findIndex((step) => step.stageId === button.dataset.stageId);
      if (index >= 0) goTo(index);
    });

    elements.stepList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-step-index]");
      if (!button) return;
      goTo(Number(button.dataset.stepIndex));
    });

    elements.previous.addEventListener("click", () => goTo(state.index - 1));
    elements.next.addEventListener("click", () => goTo(state.index + 1));
    elements.play.addEventListener("click", togglePlayback);
    elements.rawTabs.forEach((tab) => tab.addEventListener("click", () => {
      state.rawTab = tab.dataset.rawTab;
      renderRaw(data.steps[state.index]);
    }));

    document.addEventListener("keydown", (event) => {
      if (event.target.matches("button, summary") || event.target.closest("details")) return;
      if (event.key === "ArrowLeft") goTo(state.index - 1);
      if (event.key === "ArrowRight") goTo(state.index + 1);
      if (event.key === " ") {
        event.preventDefault();
        togglePlayback();
      }
    });
  }

  function initialize() {
    elements.baseline.textContent = data.meta.baseline;
    elements.runStatus.textContent = data.meta.status;
    elements.scenarioLabel.textContent = data.scenario.label;
    elements.scopeLabel.textContent = data.meta.scope;
    bindEvents();
    render();
  }

  initialize();
})();
