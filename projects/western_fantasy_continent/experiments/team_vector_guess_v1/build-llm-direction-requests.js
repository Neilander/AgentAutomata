const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ARTIFACT_FILE = path.join(ROOT, "artifacts", "team-vector-knowledge.json");
const REQUEST_FILE = path.join(ROOT, "artifacts", "llm-direction-requests.json");

const SCENARIOS = [
  { id: "survive_fire_burst", teamId: "team-003", opponentId: "fireBurst" },
  { id: "break_frost_control", teamId: "team-003", opponentId: "frostControl" },
  { id: "break_holy_sustain", teamId: "team-012", opponentId: "holySustain" },
  { id: "survive_fast_pressure", teamId: "team-021", opponentId: "lightningTempo" },
  { id: "counter_poison_snowball", teamId: "team-021", opponentId: "poisonBloom" },
  { id: "survive_fire_without_healer", teamId: "team-005", opponentId: "fireBurst" },
  { id: "escape_control_lock", teamId: "team-005", opponentId: "frostControl" },
  { id: "stabilize_poison_glass_team", teamId: "team-012", opponentId: "poisonBloom" },
];

function main() {
  const artifact = JSON.parse(fs.readFileSync(ARTIFACT_FILE, "utf8"));
  const teamById = new Map(artifact.teams.map((row) => [row.id, row]));
  const vectorById = new Map(artifact.knowledge.vectors.map((row) => [row.teamId, row]));
  const cellByKey = new Map(artifact.knowledge.cells.map((row) => [
    `${row.subject.id}|${row.environment.id}`,
    row,
  ]));
  const requests = SCENARIOS.map((scenario) => {
    const team = teamById.get(scenario.teamId);
    const vector = vectorById.get(scenario.teamId);
    const cell = cellByKey.get(`${scenario.teamId}|${scenario.opponentId}`);
    if (!team || !vector || !cell) throw new Error(`missing scenario input ${scenario.id}`);
    if (cell.result.outcome !== "loss") throw new Error(`${scenario.id} is not a failed battle`);
    return {
      schema: "llm_team_need_direction_request_v2",
      scenarioId: scenario.id,
      task: "根据玩家刚刚看到的失败和已有队伍认知，判断下一次应当优先寻找哪些能力。只输出需求方向，不选择具体队伍。",
      rules: [
        "只能使用本请求中的玩家知识，不得假设隐藏敌人数值或设计标签。",
        "你只有100点有限注意力预算，必须把它分配给九个方向；九项权重之和必须恰好为100。",
        "权重表达相对优先级而不是能力是否有益。不要因为所有能力都有用就全部打高分。",
        "最高的三个方向合计必须至少60点，确保输出形成可用于点积的明确方向。",
        "不得输出候选队伍、角色名称、队伍ID或最终选择。",
        "evidenceStatementIndices只能引用observedBattle.statements中的序号。",
      ],
      goal: "下一次挑战同一种敌方阵容时，提高获胜机会。可以更换整支四人队。",
      currentTeamKnowledge: {
        formation: team.label,
        learnedSummary: vector.learnedSummary,
        axes: Object.fromEntries(artifact.axes.map((axis) => [axis.id, {
          label: axis.label,
          relativeCoordinate: vector.axes[axis.id].coordinate,
          confidence: vector.axes[axis.id].confidence,
        }])),
      },
      observedBattle: {
        outcome: cell.result.outcome,
        ownAlive: cell.result.ownAlive,
        enemyAlive: cell.result.enemyAlive,
        ownHp: cell.result.ownHp,
        enemyHp: cell.result.enemyHp,
        statements: cell.receivedKnowledge.statements.map((text, index) => ({ index: index + 1, text })),
      },
      availableDirections: artifact.axes.map((axis) => ({
        id: axis.id,
        label: axis.label,
        meaning: axis.description,
      })),
      requiredOutput: {
        scenarioId: "原样返回",
        weights: Object.fromEntries(artifact.axes.map((axis) => [axis.id, "0..100 number; all nine sum to exactly 100"])),
        confidence: "0..1 number",
        evidenceStatementIndices: "integer[]",
        reasoning: "简短说明为什么这些能力是本次需求，而不是描述具体队伍",
        uncertainty: "目前证据无法判断的部分",
      },
    };
  });
  fs.writeFileSync(REQUEST_FILE, `${JSON.stringify({
    schema: "llm_team_need_direction_request_set_v1",
    generatedAt: new Date().toISOString(),
    blindBoundary: {
      candidateTeamVectorsIncluded: false,
      validationBattlesIncluded: false,
      opponentPresetIdIncluded: false,
      designerTagsIncluded: false,
    },
    requests,
  }, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ output: path.relative(process.cwd(), REQUEST_FILE), requests: requests.length }, null, 2));
}

if (require.main === module) main();

module.exports = { SCENARIOS };
