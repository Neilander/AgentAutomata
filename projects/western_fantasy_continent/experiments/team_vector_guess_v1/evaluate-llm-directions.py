from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
ARTIFACT_FILE = ROOT / "artifacts" / "team-vector-knowledge.json"
REQUEST_FILE = ROOT / "artifacts" / "llm-direction-requests.json"
RESPONSE_FILE = ROOT / "artifacts" / "llm-direction-responses.json"
RESULT_FILE = ROOT / "artifacts" / "llm-direction-results.json"
REPORT_FILE = ROOT / "LLM_RESULTS.md"


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def validate_response(response: dict, request: dict, axes: list[str]) -> np.ndarray:
    assert response.get("schema", "llm_team_need_direction_response_v2") == "llm_team_need_direction_response_v2"
    assert response["scenarioId"] == request["scenarioId"]
    assert set(response["weights"]) == set(axes)
    values = np.array([float(response["weights"][axis]) for axis in axes], dtype=np.float64)
    assert np.all(np.isfinite(values))
    assert np.all(values >= 0) and np.all(values <= 100)
    assert abs(float(np.sum(values)) - 100) <= 0.001
    assert float(np.sum(np.sort(values)[-3:])) >= 60
    assert float(np.linalg.norm(values)) > 0
    assert 0 <= float(response["confidence"]) <= 1
    valid_indices = {row["index"] for row in request["observedBattle"]["statements"]}
    assert set(response["evidenceStatementIndices"]).issubset(valid_indices)
    forbidden = ["team-", "候选队伍", "最终选择"]
    joined = f"{response.get('reasoning', '')} {response.get('uncertainty', '')}"
    assert not any(token in joined for token in forbidden)
    return values / np.linalg.norm(values)


def main() -> None:
    artifact = load(ARTIFACT_FILE)
    request_set = load(REQUEST_FILE)
    response_set = load(RESPONSE_FILE)
    axes = [row["id"] for row in artifact["axes"]]
    requests = {row["scenarioId"]: row for row in request_set["requests"]}
    responses = {row["scenarioId"]: row for row in response_set["responses"]}
    assert set(requests) == set(responses)

    team_ids = [row["teamId"] for row in artifact["knowledge"]["vectors"]]
    teams = {row["id"]: row for row in artifact["teams"]}
    knowledge_vectors = np.array(
        [row["vector"] for row in artifact["knowledge"]["vectors"]], dtype=np.float64
    )
    validation_vectors = np.array(
        [row["vector"] for row in artifact["heldOutValidation"]["vectors"]], dtype=np.float64
    )
    knowledge_cells = {
        (row["subject"]["id"], row["environment"]["id"]): row
        for row in artifact["knowledge"]["cells"]
    }
    validation_cells = {
        (row["subject"]["id"], row["environment"]["id"]): row
        for row in artifact["heldOutValidation"]["cells"]
    }
    index_by_team = {team_id: index for index, team_id in enumerate(team_ids)}
    rows = []
    for scenario_id, request in requests.items():
        response = responses[scenario_id]
        direction = validate_response(response, request, axes)
        knowledge_scores = knowledge_vectors @ direction
        validation_scores = validation_vectors @ direction
        ranking = np.argsort(-knowledge_scores)
        baseline_id = scenario_baseline_id(knowledge_cells, scenario_id)
        opponent_id = scenario_opponent_id(knowledge_cells, baseline_id, request)
        baseline_index = index_by_team[baseline_id]
        top_indices = ranking[:5]
        top_id = team_ids[int(ranking[0])]
        pool_validation = np.array(
            [
                1.0 if validation_cells[(team_id, opponent_id)]["result"]["outcome"] == "win" else 0.0
                for team_id in team_ids
            ]
        )
        top5_wins = [pool_validation[int(index)] for index in top_indices]
        selected_cell = validation_cells[(top_id, opponent_id)]
        baseline_cell = validation_cells[(baseline_id, opponent_id)]
        rows.append(
            {
                "scenarioId": scenario_id,
                "direction": {
                    axis: round(float(direction[index]), 4)
                    for index, axis in enumerate(axes)
                    if direction[index] >= 0.08
                },
                "rawWeights": response["weights"],
                "confidence": response["confidence"],
                "reasoning": response["reasoning"],
                "uncertainty": response["uncertainty"],
                "baseline": {
                    "teamId": baseline_id,
                    "formation": teams[baseline_id]["label"],
                    "knowledgeScore": round(float(knowledge_scores[baseline_index]), 4),
                    "validationScore": round(float(validation_scores[baseline_index]), 4),
                    "validationOutcome": baseline_cell["result"]["outcome"],
                },
                "selected": {
                    "teamId": top_id,
                    "formation": teams[top_id]["label"],
                    "knowledgeScore": round(float(knowledge_scores[ranking[0]]), 4),
                    "validationScore": round(float(validation_scores[ranking[0]]), 4),
                    "validationOutcome": selected_cell["result"]["outcome"],
                },
                "validation": {
                    "selectedBeatsBaselineVector": bool(
                        validation_scores[ranking[0]] > validation_scores[baseline_index]
                    ),
                    "selectedBeatsPoolMeanVector": bool(
                        validation_scores[ranking[0]] > np.mean(validation_scores)
                    ),
                    "top5WinRate": round(float(np.mean(top5_wins)), 4),
                    "poolWinRate": round(float(np.mean(pool_validation)), 4),
                    "top5BeatsPoolWinRate": bool(np.mean(top5_wins) > np.mean(pool_validation)),
                    "selectedTurnedLossIntoWin": bool(
                        baseline_cell["result"]["outcome"] == "loss"
                        and selected_cell["result"]["outcome"] == "win"
                    ),
                },
            }
        )

    summary = {
        "scenarioCount": len(rows),
        "selectedBeatsBaselineVector": sum(
            row["validation"]["selectedBeatsBaselineVector"] for row in rows
        ),
        "selectedBeatsPoolMeanVector": sum(
            row["validation"]["selectedBeatsPoolMeanVector"] for row in rows
        ),
        "top5BeatsPoolWinRate": sum(
            row["validation"]["top5BeatsPoolWinRate"] for row in rows
        ),
        "selectedTurnedLossIntoWin": sum(
            row["validation"]["selectedTurnedLossIntoWin"] for row in rows
        ),
    }
    result = {
        "schema": "llm_team_need_direction_evaluation_v1",
        "generationBoundary": response_set["generationBoundary"],
        "summary": summary,
        "rows": rows,
    }
    RESULT_FILE.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_FILE.write_text(render_report(result), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def scenario_baseline_id(cells: dict, scenario_id: str) -> str:
    mapping = {
        "survive_fire_burst": "team-003",
        "break_frost_control": "team-003",
        "break_holy_sustain": "team-012",
        "survive_fast_pressure": "team-021",
        "counter_poison_snowball": "team-021",
        "survive_fire_without_healer": "team-005",
        "escape_control_lock": "team-005",
        "stabilize_poison_glass_team": "team-012",
    }
    return mapping[scenario_id]


def scenario_opponent_id(cells: dict, baseline_id: str, request: dict) -> str:
    statements = [row["text"] for row in request["observedBattle"]["statements"]]
    candidates = [
        opponent_id
        for (team_id, opponent_id), cell in cells.items()
        if team_id == baseline_id
        and cell["receivedKnowledge"]["statements"] == statements
        and cell["result"]["outcome"] == "loss"
    ]
    assert len(candidates) == 1, (baseline_id, candidates)
    return candidates[0]


def render_report(result: dict) -> str:
    summary = result["summary"]
    lines = [
        "# 大语言模型需求方向选队实验",
        "",
        "## 结论",
        "",
        f"- 真实大语言模型根据8个失败后的玩家知识输出九维连续需求方向；候选队伍和验证战斗对模型不可见。",
        f"- 第二随机种子中，所选Top-1需求向量表现优于原失败队：{summary['selectedBeatsBaselineVector']}/{summary['scenarioCount']}。",
        f"- 所选Top-1需求向量表现优于50队平均：{summary['selectedBeatsPoolMeanVector']}/{summary['scenarioCount']}。",
        f"- Top-5真实胜率高于该敌队的全池胜率：{summary['top5BeatsPoolWinRate']}/{summary['scenarioCount']}。",
        f"- Top-1把原失败变成第二随机种子胜利：{summary['selectedTurnedLossIntoWin']}/{summary['scenarioCount']}。",
        "",
        "## 明细",
        "",
        "| 场景 | LLM主要方向 | 选择队伍 | 原队验证 | 新队验证 | Top5/全池胜率 |",
        "| --- | --- | --- | --- | --- | ---: |",
    ]
    for row in result["rows"]:
        direction = "、".join(f"{key}={value:.2f}" for key, value in row["direction"].items())
        lines.append(
            f"| {row['scenarioId']} | {direction} | {row['selected']['formation']} | {row['baseline']['validationOutcome']} | {row['selected']['validationOutcome']} | {row['validation']['top5WinRate']:.0%}/{row['validation']['poolWinRate']:.0%} |"
        )
    lines.extend(
        [
            "",
            "## 边界",
            "",
            "- 模型只输出方向权重，不能读取候选队向量，也不能直接选队。",
            "- 这是当前Codex大语言模型的一次冻结输出，不是多模型、多次采样统计。",
            "- 验证换了随机种子但没有换敌队；未见敌队迁移仍待测试。",
            "- 点积选择使用已冻结的50队玩家知识向量，没有重新训练或按结果调权。",
            "",
        ]
    )
    return "\n".join(lines)


if __name__ == "__main__":
    main()
