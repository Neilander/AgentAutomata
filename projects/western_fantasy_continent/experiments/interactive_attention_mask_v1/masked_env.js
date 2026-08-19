const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const sealedPath = path.join(root, 'sealed', 'cases.json');
const runtimeDir = path.join(root, 'runtime');
const transcriptDir = path.join(root, 'transcript');
const statePath = path.join(runtimeDir, 'private_state.json');
fs.mkdirSync(runtimeDir, {recursive: true});
fs.mkdirSync(transcriptDir, {recursive: true});

const hash = (value) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const clone = (value) => JSON.parse(JSON.stringify(value));

function parsePos(position) {
  const match = /^sky-c(\d+)-r(\d+)$/.exec(position || '');
  if (!match) return null;
  return {column: Number(match[1]), row: Number(match[2])};
}

function initState() {
  const sealed = JSON.parse(fs.readFileSync(sealedPath, 'utf8'));
  return {
    schema: 'masked_attention_private_state_v1',
    round: 0,
    previousResponseHash: null,
    cases: Object.fromEntries(sealed.cases.map((spec) => [spec.id, {
      spec,
      ships: clone(spec.ships),
      cityHp: spec.cityHp,
      mothershipPosition: spec.mothership ? spec.mothership.position : null,
      outcome: null,
      unplacedDiceState: spec.unplacedDice.length ? 'unchanged' : 'none',
      disclosed: {base: false, column: false, shipCells: {}, mothershipRows: {}, unplacedDice: false},
      pendingLanding: {},
      mothershipCheckPending: false,
      finished: false,
      rejectedCommands: 0
    }]))
  };
}

function loadState() {
  return fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : initState();
}

function result(ok, type, detail) {
  return {ok, type, detail};
}

function handleFocus(item, command) {
  const {spec} = item;
  switch (command.operation) {
    case 'inspect_base_cell':
      if (command.target !== spec.base.id) return result(false, 'rejected', 'target不是本局初始基地格');
      item.disclosed.base = true;
      return result(true, 'observation', {baseCellId: spec.base.id, columnId: spec.base.column, kind: spec.base.kind});
    case 'inspect_column_occupants': {
      if (command.target !== spec.base.column) return result(false, 'rejected', '未知列');
      item.disclosed.column = true;
      const columnNumber = Number(spec.base.column.split('-')[1]);
      const ships = Object.entries(item.ships).filter(([, pos]) => parsePos(pos)?.column === columnNumber).map(([id, position]) => ({id, position}));
      return result(true, 'observation', {columnId: spec.base.column, ships});
    }
    case 'inspect_ship_cell': {
      const position = item.ships[command.target];
      if (!position || position === 'mothership-waiting') return result(false, 'rejected', '目标飞船当前不在可检查天空格');
      const feature = spec.cells[position] || {kind: 'plain'};
      item.disclosed.shipCells[command.target] = position;
      return result(true, 'observation', {shipId: command.target, position, feature});
    }
    case 'inspect_mothership_row': {
      if (command.target !== 'mothership' || !spec.mothership) return result(false, 'rejected', '本局没有可检查母舰');
      const feature = spec.mothership.rows[item.mothershipPosition] || {kind: 'normal'};
      item.disclosed.mothershipRows[item.mothershipPosition] = true;
      return result(true, 'observation', {position: item.mothershipPosition, feature});
    }
    case 'inspect_unplaced_dice':
      if (command.target !== 'unplaced-dice') return result(false, 'rejected', 'target必须是unplaced-dice');
      item.disclosed.unplacedDice = true;
      return result(true, 'observation', {dice: clone(spec.unplacedDice)});
    default:
      return result(false, 'rejected', `未知关注操作：${command.operation}`);
  }
}

function handleAct(item, command) {
  const {spec} = item;
  switch (command.operation) {
    case 'resolve_column_descent': {
      if (!item.disclosed.base || !item.disclosed.column) return result(false, 'rejected', '必须先关注基地格和列内飞船');
      if (command.target !== spec.base.column) return result(false, 'rejected', '列不匹配');
      if (item.descentResolved) return result(false, 'rejected', '本局下降已结算');
      const amount = Math.max(0, spec.die.value - (spec.base.kind === 'air_defense' ? 1 : 0));
      const movements = [];
      for (const [shipId, from] of Object.entries(item.ships)) {
        const pos = parsePos(from);
        if (!pos || `column-${pos.column}` !== spec.base.column) continue;
        const to = `sky-c${pos.column}-r${pos.row + amount}`;
        item.ships[shipId] = to;
        item.pendingLanding[shipId] = amount > 0;
        movements.push({shipId, from, to, amount});
      }
      item.descentResolved = true;
      return result(true, 'state_change', {movements, zeroMovementMeansNoLandingEffect: amount === 0});
    }
    case 'follow_arrow': {
      const shipId = command.target;
      const position = item.ships[shipId];
      if (item.disclosed.shipCells[shipId] !== position) return result(false, 'rejected', '必须先关注该飞船当前格');
      const feature = spec.cells[position];
      if (!feature || feature.kind !== 'arrow') return result(false, 'rejected', '当前已揭示特征不是箭头');
      item.ships[shipId] = feature.target;
      item.pendingLanding[shipId] = true;
      delete item.disclosed.shipCells[shipId];
      return result(true, 'state_change', {shipId, from: position, to: feature.target, landingMustBeCheckedAgain: true});
    }
    case 'resolve_city_hit': {
      const shipId = command.target;
      const position = item.ships[shipId];
      if (item.disclosed.shipCells[shipId] !== position || (spec.cells[position] || {}).kind !== 'city_hit') return result(false, 'rejected', '必须先揭示该飞船当前最终格为城市命中');
      item.cityHp -= 1;
      item.ships[shipId] = 'mothership-waiting';
      item.pendingLanding[shipId] = false;
      return result(true, 'state_change', {shipId, cityHp: item.cityHp, shipPosition: 'mothership-waiting'});
    }
    case 'lower_mothership': {
      const shipId = Object.keys(item.ships).find((id) => item.pendingLanding[id] && (spec.cells[item.ships[id]] || {}).kind === 'mothership_down' && item.disclosed.shipCells[id] === item.ships[id]);
      if (command.target !== 'mothership' || !shipId || !spec.mothership) return result(false, 'rejected', '必须先揭示飞船最终格为母舰下降');
      item.mothershipPosition = spec.mothership.next;
      item.pendingLanding[shipId] = false;
      item.mothershipCheckPending = true;
      return result(true, 'state_change', {mothershipPosition: item.mothershipPosition, rightSideActionResolved: false, newRowMustBeChecked: true});
    }
    case 'resolve_no_immediate_effect': {
      const shipId = command.target;
      const position = item.ships[shipId];
      const feature = spec.cells[position] || {kind: 'plain'};
      if (item.disclosed.shipCells[shipId] !== position || !['plain', 'explosion'].includes(feature.kind)) return result(false, 'rejected', '必须先揭示最终格为普通格或爆炸格');
      item.pendingLanding[shipId] = false;
      return result(true, 'state_change', {shipId, position, immediateEffect: 'none'});
    }
    case 'reroll_unplaced_dice':
      if (command.target !== 'unplaced-dice' || spec.die.color !== 'white') return result(false, 'rejected', '本局没有白骰重投');
      if (!item.disclosed.unplacedDice) return result(false, 'rejected', '必须先关注未放置骰子集合');
      if (Object.values(item.pendingLanding).some(Boolean) || item.mothershipCheckPending) return result(false, 'rejected', '必须先完成所有飞船落点链');
      item.unplacedDiceState = 'rerolled_result_unknown';
      return result(true, 'random_boundary', {diceIds: spec.unplacedDice.map((die) => die.id), newValues: 'unknown'});
    case 'declare_loss': {
      if (command.target !== 'game' || !item.mothershipCheckPending) return result(false, 'rejected', '当前没有待判定的母舰新行');
      const feature = spec.mothership.rows[item.mothershipPosition] || {kind: 'normal'};
      if (!item.disclosed.mothershipRows[item.mothershipPosition] || feature.kind !== 'skull') return result(false, 'rejected', '必须先揭示母舰当前行为骷髅行');
      item.outcome = 'loss';
      item.mothershipCheckPending = false;
      return result(true, 'terminal', {outcome: 'loss'});
    }
    case 'finish_case': {
      const landingPending = Object.values(item.pendingLanding).some(Boolean);
      const whitePending = spec.die.color === 'white' && item.unplacedDiceState !== 'rerolled_result_unknown';
      if (landingPending || item.mothershipCheckPending || whitePending) return result(false, 'rejected', '仍有未完成的落点、母舰检查或白骰重投');
      item.finished = true;
      return result(true, 'finished', {finalState: publicFinal(item)});
    }
    default:
      return result(false, 'rejected', `未知动作：${command.operation}`);
  }
}

function publicFinal(item) {
  return {
    shipPositions: clone(item.ships),
    cityHp: item.cityHp,
    mothershipPosition: item.mothershipPosition,
    outcome: item.outcome,
    unplacedDiceState: item.unplacedDiceState
  };
}

const state = loadState();
const round = state.round + 1;
const requestPath = path.join(transcriptDir, `round_${round}_request.json`);
const responsePath = path.join(transcriptDir, `round_${round}_response.json`);
if (!fs.existsSync(requestPath)) throw new Error(`缺少 ${path.basename(requestPath)}`);
if (fs.existsSync(responsePath)) throw new Error(`响应已存在，禁止回写：${path.basename(responsePath)}`);

const requestText = fs.readFileSync(requestPath, 'utf8');
const request = JSON.parse(requestText);
if (request.round !== round) throw new Error(`请求轮次 ${request.round}，期望 ${round}`);
const seen = new Set();
const responses = [];
for (const command of request.commands || []) {
  if (seen.has(command.caseId)) throw new Error(`同一轮同一案例只能一个命令：${command.caseId}`);
  seen.add(command.caseId);
  const item = state.cases[command.caseId];
  if (!item) { responses.push({caseId: command.caseId, result: result(false, 'rejected', '未知案例')}); continue; }
  if (item.finished) { responses.push({caseId: command.caseId, result: result(false, 'rejected', '案例已结束')}); continue; }
  const commandResult = command.kind === 'focus' ? handleFocus(item, command) : command.kind === 'act' ? handleAct(item, command) : result(false, 'rejected', 'kind必须是focus或act');
  if (!commandResult.ok) item.rejectedCommands += 1;
  responses.push({caseId: command.caseId, command: clone(command), result: commandResult});
}

const activeCaseIds = Object.entries(state.cases).filter(([, item]) => !item.finished).map(([id]) => id);
const missing = activeCaseIds.filter((id) => !seen.has(id));
if (missing.length) throw new Error(`活跃案例每轮必须恰好一个命令，缺少：${missing.join(', ')}`);

const responseCore = {schema: 'masked_attention_response_v1', round, previousResponseHash: state.previousResponseHash, requestHash: hash(requestText), responses};
responseCore.responseHash = hash(responseCore);
fs.writeFileSync(responsePath, JSON.stringify(responseCore, null, 2) + '\n', 'utf8');
state.round = round;
state.previousResponseHash = responseCore.responseHash;
fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({round, responsePath, responseHash: responseCore.responseHash, activeAfterRound: activeCaseIds}, null, 2));
