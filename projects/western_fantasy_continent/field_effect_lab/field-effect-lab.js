(() => {
  const FIELD = window.GAME_FIELD_EFFECTS;
  const COMBAT = window.GAME_COMBAT_SIM;
  const BATTLE = window.GAME_BATTLE_VIEW;

  if (!FIELD || !COMBAT || !BATTLE) throw new Error("Field effect lab requires field effects, combat sim, and battle view.");

  const els = {
    fieldSelect: document.querySelector("#fieldSelect"),
    levelSelect: document.querySelector("#levelSelect"),
    leftTeamSelect: document.querySelector("#leftTeamSelect"),
    rightTeamSelect: document.querySelector("#rightTeamSelect"),
    fieldInfo: document.querySelector("#fieldInfo"),
    readout: document.querySelector("#readout"),
    baselineBtn: document.querySelector("#baselineBtn"),
    fieldBtn: document.querySelector("#fieldBtn"),
    battlefield: document.querySelector("#battlefield"),
  };

  const teams = [
    ...FIELD.standardTeams,
    ...FIELD.effects.flatMap((effect) => effect.favorableTeams.slice(0, 2).map((roles, index) => ({
      id: `${effect.id}_fav_${index + 1}`,
      name: `${effect.name} Fav ${index + 1}`,
      roles,
    }))),
  ];

  const view = BATTLE.mount({
    container: els.battlefield,
    maxTime: 75,
    speed: 1,
  });

  init();

  function init() {
    els.fieldSelect.innerHTML = FIELD.effects.map((effect) => `<option value="${effect.id}">${effect.name}</option>`).join("");
    els.leftTeamSelect.innerHTML = teams.map((team) => `<option value="${team.id}">${team.name}</option>`).join("");
    els.rightTeamSelect.innerHTML = FIELD.standardTeams.map((team) => `<option value="${team.id}">${team.name}</option>`).join("");
    els.leftTeamSelect.value = "iron_oath_fav_1";
    els.rightTeamSelect.value = "balanced";
    els.fieldSelect.addEventListener("change", syncDefaultTeam);
    for (const el of [els.fieldSelect, els.levelSelect, els.leftTeamSelect, els.rightTeamSelect]) el.addEventListener("change", render);
    els.baselineBtn.addEventListener("click", () => start(false));
    els.fieldBtn.addEventListener("click", () => start(true));
    render();
    preview();
  }

  function syncDefaultTeam() {
    const effect = FIELD.effectById(els.fieldSelect.value);
    const candidate = teams.find((team) => team.id === `${effect.id}_fav_1`);
    if (candidate) els.leftTeamSelect.value = candidate.id;
    render();
    preview();
  }

  function selectedTeam(select) {
    const team = teams.find((item) => item.id === select.value) || FIELD.standardTeams[0];
    return { ...team, team: FIELD.roleTeam(team.roles, team.id) };
  }

  function selectedStandardTeam(select) {
    const team = FIELD.standardTeams.find((item) => item.id === select.value) || FIELD.standardTeams[0];
    return { ...team, team: FIELD.roleTeam(team.roles, team.id) };
  }

  function preview() {
    const left = selectedTeam(els.leftTeamSelect);
    const right = selectedStandardTeam(els.rightTeamSelect);
    view.preview({ leftTeam: left.team, rightTeam: right.team, title: "场地预览" });
  }

  function start(withField) {
    const left = selectedTeam(els.leftTeamSelect);
    const right = selectedStandardTeam(els.rightTeamSelect);
    const level = Number(els.levelSelect.value);
    let leftTeam = left.team;
    let rightTeam = right.team;
    const effect = FIELD.effectById(els.fieldSelect.value);
    if (withField) {
      const fielded = FIELD.applyFieldEffectToTeams(left.team, right.team, effect.id, level);
      leftTeam = fielded.leftTeam;
      rightTeam = fielded.rightTeam;
    }
    view.start({
      leftTeam,
      rightTeam,
      title: withField ? `${effect.name} L${level}` : "无场地",
      seed: `${effect.id}|${level}|${left.id}|${right.id}|${withField ? "field" : "base"}`,
      randomizeStats: false,
    });
  }

  function render() {
    const effect = FIELD.effectById(els.fieldSelect.value);
    const level = Number(els.levelSelect.value);
    const levelSpec = effect.levels[level - 1];
    els.fieldInfo.innerHTML = `
      <h2>${effect.name} L${level}</h2>
      <p>${effect.short}</p>
      <div class="tags">${effect.favoredRoles.map((role) => `<span class="tag">${role}</span>`).join("")}</div>
    `;

    const modifierText = Object.entries(levelSpec)
      .filter(([key]) => !["level", "expectedLift", "roles"].includes(key))
      .map(([key, value]) => `${key}: ${value}`)
      .join(" / ");
    els.readout.innerHTML = `
      <div class="metric"><strong>学习信号</strong><span>${effect.targetSignal}</span></div>
      <div class="metric"><strong>当前等级修正</strong><span>${modifierText}</span></div>
      <div class="metric"><strong>风险</strong><span>${effect.risk}</span></div>
    `;
  }
})();
