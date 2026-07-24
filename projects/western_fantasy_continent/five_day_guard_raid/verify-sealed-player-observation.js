const assert = require("node:assert/strict");
const GAME = require("./five-day-raid-core");

const FORBIDDEN_KEYS = new Set([
  "internalId",
  "outcome",
  "requirement",
  "requirements",
  "reasons",
  "suggestedPower",
  "estimatedPower",
  "rulesVisible",
  "objective",
]);

const INITIAL_FORBIDDEN_TEXT = [
  "建议战力",
  "锻造钥匙",
  "流放者符文",
  "战胜守炉",
  "三条路线",
  "刷副本不消耗",
  "不推进时间",
  "事件与关系会改变最终战",
  "身份词条可用于事件交涉",
  "第五日之前会开放",
  "第2日开放",
  "第3日开放",
  "第4日开放",
];

function walk(value, visit, path = "$") {
  visit(value, path);
  if (Array.isArray(value)) value.forEach((row, index) => walk(row, visit, `${path}[${index}]`));
  else if (value && typeof value === "object") {
    for (const [key, row] of Object.entries(value)) walk(row, visit, `${path}.${key}`);
  }
}

function assertSealed(observation, stage) {
  walk(observation, (value, path) => {
    const key = path.split(".").at(-1);
    assert(!FORBIDDEN_KEYS.has(key), `${stage}: leaked key ${path}`);
  });
  const text = JSON.stringify(observation);
  for (const phrase of INITIAL_FORBIDDEN_TEXT) {
    assert(!text.includes(phrase), `${stage}: leaked phrase ${phrase}`);
  }
  for (const action of observation.actions) {
    assert(/^choice_[a-z0-9]+$/.test(action.id), `${stage}: action id is not opaque: ${action.id}`);
    assert(!String(action.label).includes("｜"), `${stage}: designer action prefix leaked: ${action.label}`);
  }
}

function chooseByLabel(state, fragment) {
  const catalog = GAME.getPlayerActionCatalog(state);
  const action = catalog.find((row) => row.label.includes(fragment));
  assert(action, `missing action containing: ${fragment}`);
  return GAME.applyPlayerAction(state, action.id);
}

function run() {
  let state = GAME.createInitialState("sealed-observation-regression");
  let observation = GAME.getPlayerObservation(state);
  assertSealed(observation, "initial");
  assert(!observation.actions.some((row) => row.label.includes("守炉甲胄")), "guardian action appeared before inspecting the door");
  assert(!observation.places.some((row) => row.title === "王炉守卫"), "guardian node appeared before inspecting the door");
  assert(observation.places.every((row) => !row.scene.includes("建议")), "designer recommendation leaked into a scene");

  state = chooseByLabel(state, "仔细检查门锁");
  observation = GAME.getPlayerObservation(state);
  assertSealed(observation, "after-door-inspection");
  const door = observation.places.find((row) => row.title === "王炉门");
  assert(door.scene.includes("熔毁") && door.scene.includes("断裂旧纹") && door.scene.includes("铜线"), "door inspection did not expose physical evidence");
  assert(!door.scene.includes("钥匙") && !door.scene.includes("符文") && !door.scene.includes("战胜"), "door inspection named a solution");
  assert(observation.actions.some((row) => row.label.includes("拓印拿给铁匠")), "inspection did not create a natural follow-up action");
  assert(observation.actions.some((row) => row.label.includes("挑战守炉甲胄")), "inspection did not reveal the visible guardian interaction");

  state = chooseByLabel(state, "拓印拿给铁匠");
  observation = GAME.getPlayerObservation(state);
  assertSealed(observation, "after-smith-conversation");
  assert(observation.recentSignals.some((row) => row.includes("普通钥匙无用")), "smith conversation did not preserve the discovered clue");
  assert(!observation.actions.some((row) => row.label.includes("古代锻造物")), "unusable smith proposal appeared as a current action");
  let batches = 0;
  while (!GAME.getPlayerObservation(state).actions.some((row) => row.label.includes("古代锻造物")) && batches < 100) {
    state = chooseByLabel(state, "刷10次");
    batches += 1;
  }
  observation = GAME.getPlayerObservation(state);
  assert(observation.actions.some((row) => row.label.includes("古代锻造物")), "smith proposal did not become actionable after the materials were actually present");

  let identityState = GAME.createInitialState("sealed-identity-result");
  identityState.day = 2;
  identityState.inventory.push({ id: "terror_probe", name: "裂角面具", slot: "charm", slotLabel: "饰品", rarity: "稀有", power: 12, identityTags: ["恐怖"], source: "边界验证" });
  identityState.equipment.player.charm = "terror_probe";
  identityState = chooseByLabel(identityState, "向两名雇工逼近");
  const identityObservation = GAME.getPlayerObservation(identityState);
  assert(!identityObservation.recentSignals.some((row) => row.includes("穿戴[恐怖]") || row.includes("威吓他们")), "post-action log restored the hidden identity condition");
  assert(identityObservation.threatSignals.some((row) => row.includes("不会随队出现")), "identity action did not preserve its observable consequence");

  process.stdout.write(`${JSON.stringify({ ok: true, stages: 5, materialBatches: batches, identityResultSealed: true, initialActions: GAME.getPlayerObservation(GAME.createInitialState("sealed-observation-regression")).actions.length }, null, 2)}\n`);
}

run();
