from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULT = json.loads((ROOT / "artifacts" / "semantic-coordinate-results.json").read_text(encoding="utf-8"))

assert RESULT["schema"] == "semantic_team_coordinate_v0"
assert RESULT["model"]["dimensions"] == 768
assert RESULT["knowledge"]["teamCount"] == 50
assert RESULT["knowledge"]["uniqueFriendlyStatementCount"] > 100
assert RESULT["boundary"]["manualNeedWeights"] is False
assert RESULT["boundary"]["manualNineAxisCandidateVector"] is False
assert len(RESULT["directActivationProbe"]) == 8
assert len(RESULT["predicateActivationProbe"]) == 8
assert len(RESULT["realTeams"]["rawSum"]) == 7
assert len(RESULT["realTeams"]["corpusCenteredSum"]) == 7
assert len(RESULT["realTeams"]["signedSemanticState"]) == 7
assert len(RESULT["realTeams"]["capabilityOnlyAblation"]) == 7
assert RESULT["coordinateSnapshots"]["outcomeClaimsExcluded"] is True
assert len(RESULT["coordinateSnapshots"]["teamOrder"]) == 50
assert len(RESULT["coordinateSnapshots"]["capabilityOnly"]) == 50
assert all(len(row) == 768 for row in RESULT["coordinateSnapshots"]["capabilityOnly"])

weights = [row["weight"] for row in RESULT["edgeCases"]["repetitionSaturation"]]
increments = [weights[index + 1] - weights[index] for index in range(len(weights) - 1)]
assert all(weights[index + 1] > weights[index] for index in range(len(weights) - 1))
assert increments[-1] < increments[0]

print(json.dumps({
    "pass": True,
    "teamCount": RESULT["knowledge"]["teamCount"],
    "uniqueKnowledge": RESULT["knowledge"]["uniqueFriendlyStatementCount"],
    "rawQueriesTop10BeatBottom10": sum(row["top10BeatsBottom10"] for row in RESULT["realTeams"]["rawSum"]),
    "centeredQueriesTop10BeatBottom10": sum(row["top10BeatsBottom10"] for row in RESULT["realTeams"]["corpusCenteredSum"]),
    "signedQueriesTop10BeatBottom10": sum(row["top10BeatsBottom10"] for row in RESULT["realTeams"]["signedSemanticState"]),
    "capabilityOnlyQueriesTop10BeatBottom10": sum(row["top10BeatsBottom10"] for row in RESULT["realTeams"]["capabilityOnlyAblation"]),
    "contradictionHandledWithEvidenceStance": RESULT["edgeCases"]["contradiction"]["negativeKnowledgeReducedScore"],
}, ensure_ascii=False, indent=2))
