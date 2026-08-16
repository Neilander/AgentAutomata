// 机械对照：故意不读取 rules/、agent/memory.json、sealed/expected.json。
// 它只按协议中的字段名和 operation 名，把局部响应映射到下一命令。
const fs = require('fs');
const path = require('path');
const {execFileSync} = require('child_process');

const root = __dirname;
const control = path.join(root, 'mechanical_control');
const transcript = path.join(control, 'transcript');
if (fs.existsSync(control)) throw new Error('mechanical_control 已存在；为保护记录，不自动覆盖');
fs.mkdirSync(transcript, {recursive: true});

const publicStart = JSON.parse(fs.readFileSync(path.join(root, 'public_start.json'), 'utf8'));
const states = Object.fromEntries(publicStart.cases.map((item) => [item.id, {
  dieColor: item.initialAction.color,
  baseCellId: item.initialAction.baseCellId,
  columnId: item.initialAction.columnId,
  next: {kind:'focus', operation:'inspect_base_cell', target:item.initialAction.baseCellId},
  shipQueue: [],
  currentShip: null,
  stage: 'base',
  finished: false
}]));

function command(caseId, state) {
  return {caseId, ...state.next, reason:'mechanical field dispatch', expectedWakeup:null};
}

function afterShips(state) {
  if (state.shipQueue.length) {
    state.currentShip = state.shipQueue.shift();
    state.next = {kind:'focus', operation:'inspect_ship_cell', target:state.currentShip};
  } else if (state.dieColor === 'white' && state.stage !== 'rerolled') {
    state.next = {kind:'focus', operation:'inspect_unplaced_dice', target:'unplaced-dice'};
    state.stage = 'unplaced';
  } else {
    state.next = {kind:'act', operation:'finish_case', target:'case'};
    state.stage = 'finish';
  }
}

function consume(caseId, response) {
  const state = states[caseId];
  if (!response.result.ok) throw new Error(`机械对照命令被拒绝：${caseId} ${response.result.detail}`);
  const detail = response.result.detail;
  switch (state.stage) {
    case 'base':
      state.next = {kind:'focus', operation:'inspect_column_occupants', target:state.columnId};
      state.stage = 'column';
      break;
    case 'column':
      state.next = {kind:'act', operation:'resolve_column_descent', target:state.columnId};
      state.stage = 'descent';
      break;
    case 'descent':
      state.shipQueue = detail.movements.filter((move) => move.amount > 0).map((move) => move.shipId);
      if (!state.shipQueue.length) {
        state.next = {kind:'act', operation:'finish_case', target:'case'};
        state.stage = 'finish';
      } else {
        afterShips(state);
        state.stage = 'ship_cell';
      }
      break;
    case 'ship_cell': {
      const kind = detail.feature.kind;
      if (kind === 'arrow') state.next = {kind:'act', operation:'follow_arrow', target:state.currentShip};
      else if (kind === 'city_hit') state.next = {kind:'act', operation:'resolve_city_hit', target:state.currentShip};
      else if (kind === 'mothership_down') state.next = {kind:'act', operation:'lower_mothership', target:'mothership'};
      else state.next = {kind:'act', operation:'resolve_no_immediate_effect', target:state.currentShip};
      state.stage = kind === 'arrow' ? 'arrow' : kind === 'mothership_down' ? 'mother_drop' : 'ship_resolved';
      break;
    }
    case 'arrow':
      state.next = {kind:'focus', operation:'inspect_ship_cell', target:state.currentShip};
      state.stage = 'ship_cell';
      break;
    case 'ship_resolved':
      afterShips(state);
      if (state.stage !== 'unplaced' && state.stage !== 'finish') state.stage = 'ship_cell';
      break;
    case 'mother_drop':
      state.next = {kind:'focus', operation:'inspect_mothership_row', target:'mothership'};
      state.stage = 'mother_row';
      break;
    case 'mother_row':
      state.next = detail.feature.kind === 'skull'
        ? {kind:'act', operation:'declare_loss', target:'game'}
        : {kind:'act', operation:'finish_case', target:'case'};
      state.stage = detail.feature.kind === 'skull' ? 'declaring_loss' : 'finish';
      break;
    case 'declaring_loss':
      state.next = {kind:'act', operation:'finish_case', target:'case'};
      state.stage = 'finish';
      break;
    case 'unplaced':
      state.next = {kind:'act', operation:'reroll_unplaced_dice', target:'unplaced-dice'};
      state.stage = 'reroll';
      break;
    case 'reroll':
      state.stage = 'rerolled';
      state.next = {kind:'act', operation:'finish_case', target:'case'};
      state.stage = 'finish';
      break;
    case 'finish':
      state.finished = true;
      break;
    default:
      throw new Error(`未知机械阶段：${state.stage}`);
  }
}

let round = 0;
while (Object.values(states).some((state) => !state.finished)) {
  round += 1;
  if (round > 30) throw new Error('机械对照超过30轮');
  const active = Object.entries(states).filter(([, state]) => !state.finished);
  const request = {schema:'masked_attention_request_v1', round, commands:active.map(([id, state]) => command(id, state))};
  fs.writeFileSync(path.join(transcript, `round_${round}_request.json`), JSON.stringify(request, null, 2) + '\n');
  execFileSync(process.execPath, [path.join(root, 'mechanical_env.js')], {cwd:root, stdio:'ignore'});
  const response = JSON.parse(fs.readFileSync(path.join(transcript, `round_${round}_response.json`), 'utf8'));
  for (const item of response.responses) consume(item.caseId, item);
}

const privateState = JSON.parse(fs.readFileSync(path.join(control, 'runtime', 'private_state.json'), 'utf8'));
const summary = {
  schema:'mechanical_attention_baseline_v1',
  readsRules:false,
  readsAgentMemory:false,
  readsExpected:false,
  rounds:round,
  rejectedCommands:Object.values(privateState.cases).reduce((sum, item) => sum + item.rejectedCommands, 0),
  cases:Object.fromEntries(Object.entries(privateState.cases).map(([id, item]) => [id, {finished:item.finished, ships:item.ships, cityHp:item.cityHp, mothershipPosition:item.mothershipPosition, outcome:item.outcome, unplacedDiceState:item.unplacedDiceState}]))
};
fs.writeFileSync(path.join(control, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({rounds:summary.rounds, rejectedCommands:summary.rejectedCommands, allFinished:Object.values(summary.cases).every((item) => item.finished)}, null, 2));
