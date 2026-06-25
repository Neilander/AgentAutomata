const state = {
  turn: 1,
  selfWorth: 35,
  pleasure: 64,
  exponent: 1,
  decay: 3,
  hand: [],
  logs: [],
};

const cardPool = [
  {
    title: "整理房间",
    domain: "生活秩序",
    successRate: 0.96,
    agency: 0.9,
    kind: "safe",
    desc: "低风险、低认可事件。适合愉悦低、自我认可也低的时候恢复一点秩序感。",
  },
  {
    title: "完成日常训练",
    domain: "稳定成长",
    successRate: 0.82,
    agency: 0.85,
    kind: "safe",
    desc: "可靠的小进步。它不会证明你很强，但能持续补充“我在变好”的感觉。",
  },
  {
    title: "约朋友吃饭",
    domain: "关系确认",
    successRate: 0.74,
    agency: 0.65,
    kind: "safe",
    desc: "偏满足感的事件。认可来自被回应，但 agency 不完全在自己手里。",
  },
  {
    title: "公开作品",
    domain: "表达",
    successRate: 0.46,
    agency: 0.78,
    kind: "mid",
    desc: "中等风险。成功时会确认能力，失败时也能解释成一次尝试。",
  },
  {
    title: "申请理想职位",
    domain: "职业",
    successRate: 0.28,
    agency: 0.7,
    kind: "mid",
    desc: "高一点的社会认可事件。成功能明显抬升自我认可，失败会有一点刺痛。",
  },
  {
    title: "参加比赛",
    domain: "竞技",
    successRate: 0.18,
    agency: 0.88,
    kind: "high-risk",
    desc: "高 agency 的挑战。成败都很容易被解释为“我到底行不行”。",
  },
  {
    title: "创业融资",
    domain: "事业跃迁",
    successRate: 0.08,
    agency: 0.62,
    kind: "high-risk",
    desc: "低概率高认可。成功很强，失败如果缺少可解释原因，会伤自我认可。",
  },
  {
    title: "一夜成名",
    domain: "外部奖赏",
    successRate: 0.01,
    agency: 0.28,
    kind: "high-risk",
    desc: "极低概率，理论认可很高，但 agency 低，成功更像运气，不会完整转化成成就感。",
  },
  {
    title: "挑战世界级难题",
    domain: "极限突破",
    successRate: 0.015,
    agency: 0.95,
    kind: "high-risk",
    desc: "几乎是自我神话级事件。成功会强烈改写基准线，失败也最容易破防。",
  },
];

const els = {
  cards: document.getElementById("cards"),
  turnCount: document.getElementById("turnCount"),
  selfWorthValue: document.getElementById("selfWorthValue"),
  selfWorthBar: document.getElementById("selfWorthBar"),
  selfWorthHint: document.getElementById("selfWorthHint"),
  pleasureValue: document.getElementById("pleasureValue"),
  pleasureBar: document.getElementById("pleasureBar"),
  pleasureHint: document.getElementById("pleasureHint"),
  exponentSlider: document.getElementById("exponentSlider"),
  exponentValue: document.getElementById("exponentValue"),
  decaySlider: document.getElementById("decaySlider"),
  decayValue: document.getElementById("decayValue"),
  eventSummary: document.getElementById("eventSummary"),
  log: document.getElementById("log"),
  newHandButton: document.getElementById("newHandButton"),
  resetButton: document.getElementById("resetButton"),
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function recognitionFor(successRate) {
  return Math.pow(1 / successRate, state.exponent);
}

function weightedSample(pool, count) {
  const copy = [...pool].sort(() => Math.random() - 0.5);
  const selected = [];
  const buckets = [
    copy.filter((card) => card.successRate >= 0.7),
    copy.filter((card) => card.successRate < 0.7 && card.successRate >= 0.2),
    copy.filter((card) => card.successRate < 0.2),
  ];
  for (const bucket of buckets) {
    if (bucket.length && selected.length < count) {
      selected.push(bucket[Math.floor(Math.random() * bucket.length)]);
    }
  }
  while (selected.length < count) {
    const next = copy[Math.floor(Math.random() * copy.length)];
    if (!selected.includes(next)) selected.push(next);
  }
  return selected.sort(() => Math.random() - 0.5);
}

function generateHand() {
  state.hand = weightedSample(cardPool, 3);
  render();
}

function classifyCard(card) {
  const recognition = recognitionFor(card.successRate);
  const delta = recognition - state.selfWorth;
  if (delta < -18) return "安慰型满足";
  if (delta < 0) return "低难确认";
  if (delta < 24) return "匹配挑战";
  return "突破型成就";
}

function predictText(card) {
  const recognition = recognitionFor(card.successRate);
  const delta = recognition - state.selfWorth;
  if (delta < -18) {
    return "认可度明显低于当前基准线，成功主要补一点愉悦，几乎不提升自我认可。";
  }
  if (delta < 0) {
    return "认可度略低于基准线，成功会提供确认感，适合愉悦低时回血。";
  }
  if (delta < 24) {
    return "认可度接近或略高于基准线，是比较健康的成就事件。";
  }
  return "认可度远高于当前基准线，成功强烈抬升自我认可，失败也更疼。";
}

function resolveCard(card) {
  const recognition = recognitionFor(card.successRate);
  const success = Math.random() < card.successRate;
  const delta = recognition - state.selfWorth;
  const pleasureNeed = (100 - state.pleasure) / 100;
  const lowSelfBonus = (100 - state.selfWorth) / 100;
  const belowLine = clamp((state.selfWorth - recognition) / 45, 0, 1);
  const aboveLine = clamp((recognition - state.selfWorth) / 60, 0, 1);
  const fit = 1 - clamp(Math.abs(delta) / 95, 0, 1);

  let satisfaction = 0;
  let achievement = 0;
  let selfWorthDelta = 0;
  let pleasureDelta = -state.decay;
  let label = "";

  if (success) {
    satisfaction = recognition * (0.22 + pleasureNeed * 0.7) * (0.4 + lowSelfBonus * 0.6) * (1 - aboveLine * 0.35);
    achievement = recognition * card.agency * (0.18 + aboveLine * 0.95 + fit * 0.32);
    selfWorthDelta = achievement * 0.16 + satisfaction * 0.035;
    pleasureDelta += satisfaction * 0.18 + achievement * 0.07;
    label = delta >= 0 ? "成就" : "满足";
  } else {
    const exposure = clamp((recognition / Math.max(state.selfWorth, 1)) - 0.6, 0.1, 2.2);
    const agencyPain = 0.45 + card.agency * 0.7;
    selfWorthDelta = -recognition * exposure * agencyPain * 0.075;
    pleasureDelta -= recognition * exposure * 0.045;
    satisfaction = 0;
    achievement = 0;
    label = delta >= 0 ? "高认可失败" : "低认可失败";
  }

  state.selfWorth = clamp(state.selfWorth + selfWorthDelta, 0, 150);
  state.pleasure = clamp(state.pleasure + pleasureDelta, 0, 120);
  state.turn += 1;

  const log = {
    turn: state.turn - 1,
    title: card.title,
    success,
    label,
    recognition,
    delta,
    satisfaction,
    achievement,
    selfWorthDelta,
    pleasureDelta,
  };
  state.logs.unshift(log);
  state.logs = state.logs.slice(0, 20);
  els.eventSummary.textContent = summarizeLog(log);
  generateHand();
}

function summarizeLog(log) {
  const result = log.success ? "成功" : "失败";
  const relation = log.delta >= 0 ? "高于" : "低于";
  return `${log.title}${result}。事件认可度 ${log.recognition.toFixed(1)}，${relation}当前自我认可 ${Math.abs(log.delta).toFixed(1)}。解释为「${log.label}」，自我认可 ${signed(log.selfWorthDelta)}，愉悦 ${signed(log.pleasureDelta)}。`;
}

function signed(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}`;
}

function render() {
  els.turnCount.textContent = state.turn;
  els.selfWorthValue.textContent = Math.round(state.selfWorth);
  els.selfWorthBar.style.width = `${clamp(state.selfWorth, 0, 100)}%`;
  els.pleasureValue.textContent = Math.round(state.pleasure);
  els.pleasureBar.style.width = `${clamp(state.pleasure, 0, 100)}%`;
  els.exponentValue.textContent = state.exponent.toFixed(2);
  els.decayValue.textContent = state.decay;

  els.selfWorthHint.textContent = selfWorthHint();
  els.pleasureHint.textContent = pleasureHint();
  renderCards();
  renderLog();
}

function selfWorthHint() {
  if (state.selfWorth < 25) return "基准线很低：小成功也能带来明显满足和自我修复。";
  if (state.selfWorth < 60) return "基准线中等：需要接近当前水平的事件来稳定提升。";
  if (state.selfWorth < 100) return "基准线较高：低难事件开始失效，需要真实挑战。";
  return "基准线极高：只有极难且高 agency 的事件能继续证明自己。";
}

function pleasureHint() {
  if (state.pleasure < 25) return "愉悦很低：玩家会更渴望即时满足，也更怕失败。";
  if (state.pleasure < 70) return "愉悦正常：满足感和成就感都能被接收。";
  return "愉悦较高：普通小奖励边际收益降低。";
}

function renderCards() {
  els.cards.innerHTML = state.hand.map((card, index) => {
    const recognition = recognitionFor(card.successRate);
    const failureRate = 1 - card.successRate;
    const delta = recognition - state.selfWorth;
    return `
      <article class="card ${card.kind}">
        <div class="card-title">
          <h3>${card.title}</h3>
          <span class="tag">${card.domain}</span>
        </div>
        <p class="card-desc">${card.desc}</p>
        <div class="stats">
          <div class="stat"><span>成功率</span><strong>${Math.round(card.successRate * 100)}%</strong></div>
          <div class="stat"><span>失败率</span><strong>${Math.round(failureRate * 100)}%</strong></div>
          <div class="stat"><span>认可度</span><strong>${recognition.toFixed(1)}</strong></div>
          <div class="stat"><span>Agency</span><strong>${Math.round(card.agency * 100)}%</strong></div>
        </div>
        <div class="diff">
          <strong>${classifyCard(card)} · ${delta >= 0 ? "+" : ""}${delta.toFixed(1)}</strong>
          <p>${predictText(card)}</p>
        </div>
        <button class="choose" type="button" data-index="${index}">选择这张牌</button>
      </article>
    `;
  }).join("");

  for (const button of document.querySelectorAll(".choose")) {
    button.addEventListener("click", () => resolveCard(state.hand[Number(button.dataset.index)]));
  }
}

function renderLog() {
  if (!state.logs.length) {
    els.log.innerHTML = `<div class="log-item"><strong>等待选择</strong><span>还没有事件。</span><span>-</span></div>`;
    return;
  }
  els.log.innerHTML = state.logs.map((log) => `
    <div class="log-item">
      <strong class="${log.success ? "good" : "bad"}">#${log.turn} ${log.success ? "成功" : "失败"}</strong>
      <span>${log.title}：认可 ${log.recognition.toFixed(1)}，差值 ${signed(log.delta)}，${log.label}</span>
      <span>自我 ${signed(log.selfWorthDelta)} / 愉悦 ${signed(log.pleasureDelta)}</span>
    </div>
  `).join("");
}

function reset() {
  state.turn = 1;
  state.selfWorth = 35;
  state.pleasure = 64;
  state.logs = [];
  els.eventSummary.textContent = "选择一张牌，观察事件如何被解释成满足感或成就感。";
  generateHand();
}

els.exponentSlider.addEventListener("input", () => {
  state.exponent = Number(els.exponentSlider.value);
  render();
});

els.decaySlider.addEventListener("input", () => {
  state.decay = Number(els.decaySlider.value);
  render();
});

els.newHandButton.addEventListener("click", () => {
  state.pleasure = clamp(state.pleasure - state.decay * 0.35, 0, 120);
  generateHand();
});

els.resetButton.addEventListener("click", reset);

generateHand();
