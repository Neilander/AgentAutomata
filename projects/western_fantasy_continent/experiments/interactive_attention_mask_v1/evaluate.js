const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = __dirname;
const sha = (text) => crypto.createHash('sha256').update(text).digest('hex').toUpperCase();
const fileSha = (relative) => sha(fs.readFileSync(path.join(root, relative)));
const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])])) : value;
const equal = (a, b) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));

const frozenHashes = {
  'PHASE2_PROTOCOL.md': '2A7DADF192ABC7E23C96853C10BC37FCA9957ECF113989F6B80E8C3AEA87BEDC',
  'public_start.json': 'C1D52664EB770017586A4BC54B0BA1D77389ABE2EE6C6B77CBD60041FFABBE69',
  'rules/R01.txt': '45F79114AB9A509925DB22811A9BC2D330A1A67102ACBFDB02631C4189F7014E',
  'rules/R02.txt': '8040E0B8744D73F4378068D5F4AC243250520FC7540E8809534E339D96A537B4',
  'rules/R03.txt': 'A3B658EACBAAEB720DB43A0569FC9BA6D19096A4325A7A4388F37A7F96223892',
  'rules/R04.txt': '76E3EEB4DC529DB55A650FC8D744F17586A23E382240ED6588B4D4415EEB6911',
  'rules/R05.txt': '6D04374E42BF2470F26BA63CA47D21F3B8DB9F36078E6387611AC1922028879F',
  'rules/R06.txt': 'C77A5737FCBEE2A66793B4876BD4CD1FCEB8699E5DFC9FB259B933DF905D6EE3',
  'rules/R07.txt': '7F9CBAB3F81331B0E1C5416013766F70A0FC980303B552F4AA49DB2F2D8A7971',
  'rules/R08.txt': '5ED93B1908F4C647030B60F95D92C2413AC7827B91AF5AF319C29BEB059A0856',
  'sealed/cases.json': 'C08B034333B5E109F9EFE48D30646E486D3DD1D3B2147BBC288A0F96F8F68C34',
  'sealed/expected.json': '6550E8540DEA6420902B2CDD7C44D96E2228270A8652E6097199383D45B06978'
};

const expectedSequences = {
  arrow_city: ['inspect_base_cell','inspect_column_occupants','resolve_column_descent','inspect_ship_cell','follow_arrow','inspect_ship_cell','resolve_city_hit','finish_case'],
  air_defense_zero: ['inspect_base_cell','inspect_column_occupants','resolve_column_descent','finish_case'],
  mothership_skull: ['inspect_base_cell','inspect_column_occupants','resolve_column_descent','inspect_ship_cell','lower_mothership','inspect_mothership_row','declare_loss','finish_case'],
  path_not_endpoint: ['inspect_base_cell','inspect_column_occupants','resolve_column_descent','inspect_ship_cell','resolve_no_immediate_effect','finish_case'],
  white_random_stop: ['inspect_base_cell','inspect_column_occupants','resolve_column_descent','inspect_ship_cell','resolve_no_immediate_effect','inspect_unplaced_dice','reroll_unplaced_dice','finish_case'],
  two_ship_split: ['inspect_base_cell','inspect_column_occupants','resolve_column_descent','inspect_ship_cell','follow_arrow','inspect_ship_cell','resolve_city_hit','inspect_ship_cell','resolve_no_immediate_effect','finish_case']
};

const state = JSON.parse(fs.readFileSync(path.join(root, 'runtime', 'private_state.json'), 'utf8'));
const expected = JSON.parse(fs.readFileSync(path.join(root, 'sealed', 'expected.json'), 'utf8'));
const expectedById = Object.fromEntries(expected.cases.map((item) => [item.id, item]));
const sequences = Object.fromEntries(Object.keys(expectedSequences).map((id) => [id, []]));
let previousHash = null;
let chainValid = true;
let rejectedFromResponses = 0;
let focusCommands = 0;
let actionCommands = 0;

for (let round = 1; round <= state.round; round += 1) {
  const requestPath = path.join(root, 'transcript', `round_${round}_request.json`);
  const responsePath = path.join(root, 'transcript', `round_${round}_response.json`);
  const requestText = fs.readFileSync(requestPath, 'utf8');
  const request = JSON.parse(requestText);
  const response = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
  if (request.round !== round || response.round !== round) chainValid = false;
  if (response.previousResponseHash !== previousHash) chainValid = false;
  if (response.requestHash !== crypto.createHash('sha256').update(requestText).digest('hex')) chainValid = false;
  const claimed = response.responseHash;
  const core = {...response};
  delete core.responseHash;
  if (claimed !== crypto.createHash('sha256').update(JSON.stringify(core)).digest('hex')) chainValid = false;
  previousHash = claimed;
  for (const command of request.commands) {
    if (sequences[command.caseId]) sequences[command.caseId].push(command.operation);
    if (command.kind === 'focus') focusCommands += 1;
    if (command.kind === 'act') actionCommands += 1;
  }
  rejectedFromResponses += response.responses.filter((item) => !item.result.ok).length;
}

const caseResults = Object.keys(expectedSequences).map((id) => {
  const item = state.cases[id];
  const finalState = {
    shipPositions: item.ships,
    cityHp: item.cityHp,
    mothershipPosition: item.mothershipPosition,
    outcome: item.outcome,
    unplacedDiceState: item.unplacedDiceState
  };
  const expectedFinal = {...expectedById[id]};
  delete expectedFinal.id;
  return {
    id,
    passed: item.finished && item.rejectedCommands === 0 && equal(finalState, expectedFinal) && equal(sequences[id], expectedSequences[id]),
    checks: {
      finished: item.finished,
      noRejectedCommands: item.rejectedCommands === 0,
      finalStateExact: equal(finalState, expectedFinal),
      attentionActionSequenceExact: equal(sequences[id], expectedSequences[id])
    },
    sequence: sequences[id],
    finalState
  };
});

const frozenChecks = Object.fromEntries(Object.entries(frozenHashes).map(([file, expectedHash]) => [file, {expectedHash, actualHash: fileSha(file), unchanged: fileSha(file) === expectedHash}]));
const summary = {
  schema: 'interactive_attention_mask_evaluation_v1',
  frozenInputsUnchanged: Object.values(frozenChecks).every((item) => item.unchanged),
  transcriptHashChainValid: chainValid && state.previousResponseHash === previousHash,
  rounds: state.round,
  focusCommands,
  actionCommands,
  rejectedCommands: rejectedFromResponses,
  casesPassed: caseResults.filter((item) => item.passed).length,
  casesTotal: caseResults.length,
  allPassed: caseResults.every((item) => item.passed) && rejectedFromResponses === 0 && chainValid && Object.values(frozenChecks).every((item) => item.unchanged),
  frozenChecks,
  caseResults
};

fs.writeFileSync(path.join(root, 'evaluation.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({allPassed: summary.allPassed, cases: `${summary.casesPassed}/${summary.casesTotal}`, rounds: summary.rounds, focusCommands, actionCommands, rejectedCommands: rejectedFromResponses, transcriptHashChainValid: summary.transcriptHashChainValid, frozenInputsUnchanged: summary.frozenInputsUnchanged}, null, 2));
