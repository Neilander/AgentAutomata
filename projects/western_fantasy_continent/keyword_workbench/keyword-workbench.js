const DATA = window.GAME_KEYWORD_MECHANICS;
const els = {
  categoryRail: document.querySelector("#categoryRail"),
  keywordGrid: document.querySelector("#keywordGrid"),
  toolbar: document.querySelector(".toolbar"),
};
let filter = "all";

function render() {
  els.categoryRail.innerHTML = Object.entries(DATA.categories).map(([key, category]) => `
    <article class="category-card">
      <strong>${category.label}</strong>
      <span>${category.summary}</span>
    </article>
  `).join("");

  const keywords = DATA.keywords.filter((item) => filter === "all" || item.exploration === filter);
  els.keywordGrid.innerHTML = keywords.map((item) => keywordCard(item)).join("");
}

function keywordCard(item) {
  const category = DATA.categories[item.category];
  return `
    <article class="keyword-card ${item.exploration}">
      <header>
        <div>
          <h2>${item.name}</h2>
          <div class="meta">
            <span>${category?.label || item.category}</span>
            <span>使用 ${item.usage}</span>
            <span>${explorationLabel(item.exploration)}</span>
          </div>
        </div>
        <span class="badge">${item.key}</span>
      </header>
      <p>${item.current}</p>
      <h3>可探索方向</h3>
      <ul>${item.opportunities.map((text) => `<li>${text}</li>`).join("")}</ul>
      <h3>注意</h3>
      <p>${item.caution}</p>
    </article>
  `;
}

function explorationLabel(value) {
  return {
    priority: "优先探索",
    moderate: "适度探索",
    low: "低优先级",
    rare: "稀有保留",
  }[value] || value;
}

els.toolbar.addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  filter = button.dataset.filter;
  els.toolbar.querySelectorAll("button").forEach((item) => item.classList.toggle("active", item === button));
  render();
});

render();
