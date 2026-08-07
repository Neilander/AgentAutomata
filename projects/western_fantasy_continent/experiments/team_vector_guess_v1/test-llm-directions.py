from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
responses = json.loads(
    (ROOT / "artifacts" / "llm-direction-responses.json").read_text(encoding="utf-8")
)
results = json.loads(
    (ROOT / "artifacts" / "llm-direction-results.json").read_text(encoding="utf-8")
)
boundary = responses["generationBoundary"]
assert boundary["forkTurns"] == "none"
assert boundary["onlyRequestFileRead"] is True
assert boundary["candidateTeamVectorsVisibleToGenerator"] is False
assert boundary["validationBattlesVisibleToGenerator"] is False
assert len(responses["responses"]) == 8

for row in responses["responses"]:
    values = list(row["weights"].values())
    assert abs(sum(values) - 100) < 0.001
    assert sum(sorted(values)[-3:]) >= 60

summary = results["summary"]
assert summary["scenarioCount"] == 8
assert summary["selectedBeatsBaselineVector"] == 8
assert summary["selectedBeatsPoolMeanVector"] == 8
assert summary["top5BeatsPoolWinRate"] == 8
assert summary["selectedTurnedLossIntoWin"] >= 5
assert len({row["selected"]["teamId"] for row in results["rows"]}) >= 3

print(
    json.dumps(
        {
            "pass": True,
            **summary,
            "uniqueSelectedTeams": len(
                {row["selected"]["teamId"] for row in results["rows"]}
            ),
        },
        ensure_ascii=False,
        indent=2,
    )
)
