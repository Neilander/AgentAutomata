const fs = require("fs");
const path = require("path");

const GENERATED = path.join(__dirname, "generated");
const deterministic = JSON.parse(fs.readFileSync(path.join(GENERATED, "deterministic-result.json"), "utf8"));
const agent = JSON.parse(fs.readFileSync(path.join(GENERATED, "agent-forward-expert-analysis.json"), "utf8"));
const expected = deterministic.sequences.forwardExpert;
const checks = [];

check(agent.battleAnalyses.length === 5, "agent analyzed exactly five battles");
for (let index = 0; index < expected.analyses.length; index += 1) {
  const codeBattle = expected.analyses[index];
  const agentBattle = agent.battleAnalyses[index];
  check(agentBattle.battleId === codeBattle.reportId, `battle ${index + 1} order and identity match`);
  check(close(agentBattle.teamUsefulContribution, codeBattle.teamUsefulContribution), `${codeBattle.reportId} team contribution matches`);
  check(close(agentBattle.teamMeanUsefulContribution, codeBattle.expectedUnitContribution), `${codeBattle.reportId} team mean matches`);

  for (const codeUnit of codeBattle.units) {
    const agentUnit = agentBattle.units.find((unit) => unit.unitId === codeUnit.id);
    check(Boolean(agentUnit), `${codeBattle.reportId}/${codeUnit.name} exists`);
    if (!agentUnit) continue;
    check(close(agentUnit.usefulContribution, codeUnit.usefulContribution), `${codeBattle.reportId}/${codeUnit.name} contribution matches`);
    check(close(agentUnit.relativeStrengthPercent, codeUnit.relativeStrengthPercent), `${codeBattle.reportId}/${codeUnit.name} relative strength matches`);
    check(agentUnit.perceivedStrength.semanticLevel === codeUnit.strength.level, `${codeBattle.reportId}/${codeUnit.name} strength level matches`);
    const codeTraits = new Map(codeUnit.traits.map((trait) => [trait.domain, trait.level]));
    const agentTraits = new Map(agentUnit.level3OrHigherTraits.map((trait) => [trait.domain, trait.semanticLevel]));
    check(JSON.stringify([...agentTraits]) === JSON.stringify([...codeTraits]), `${codeBattle.reportId}/${codeUnit.name} eligible traits match`);
  }
}

const codeBelief = expected.warriorDefaultRetrieval[0];
check(close(agent.finalCurrentBelief.noContextSynthesis.currentSemanticLevel, codeBelief.weightedSemanticLevel), "final Warrior weighted current belief matches");
check(JSON.stringify(agent.finalCurrentBelief.noContextSynthesis.observationLevelsInOrder)
  === JSON.stringify(expected.state.strengthObservations
    .filter((observation) => observation.subject.id === "hero_warrior")
    .map((observation) => observation.claim.level)), "Warrior observation order matches");

const result = {
  status: checks.every((row) => row.pass) ? "PASS" : "FAIL",
  checkCount: checks.length,
  failed: checks.filter((row) => !row.pass),
  note: "The Agent was isolated from deterministic-result.json and source code. This validates arithmetic and evidence-bound knowledge, not causal truth or calibrated human psychology.",
};

if (process.argv.includes("--write")) {
  fs.writeFileSync(path.join(GENERATED, "agent-validation.json"), `${JSON.stringify(result, null, 2)}\n`);
}

console.log(JSON.stringify(result, null, 2));
if (result.status !== "PASS") process.exitCode = 1;

function check(pass, label) {
  checks.push({ pass: Boolean(pass), label });
}

function close(a, b, tolerance = 0.001) {
  return Math.abs(Number(a) - Number(b)) <= tolerance;
}
