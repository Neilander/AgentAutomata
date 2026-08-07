from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULT = json.loads((ROOT / "artifacts" / "value-landscape-results.json").read_text(encoding="utf-8"))

assert RESULT["schema"] == "player_value_landscape_v0"
assert RESULT["boundary"]["formalPlayerAgentModified"] is False
assert RESULT["boundary"]["teamCoordinatesFrozenDuringValueLearning"] is True
assert all(RESULT["controlledCredit"]["checks"].values()), RESULT["controlledCredit"]["checks"]
assert all(RESULT["shieldValueShift"]["checks"].values()), RESULT["shieldValueShift"]["checks"]
real = RESULT["realFiftyTeams"]
assert real["boundary"]["outcomeClaimsExcludedFromCoordinates"] is True
assert real["boundary"]["hiddenBattlesPerTeamOpponent"] >= 20
assert len(real["field"]["perContext"]) == 6
assert real["hiddenTruthCoordinateOracle"]["diagnosticOnly"] is True

print(json.dumps({
    "pass": True,
    "creditChecks": RESULT["controlledCredit"]["checks"],
    "shieldChecks": RESULT["shieldValueShift"]["checks"],
    "fieldOverallSpearman": real["field"]["overallSpearman"],
    "fieldPositiveTop10Contexts": real["field"]["contextsWithPositiveTop10Uplift"],
    "linearOverallSpearman": real["singleDirectionBaseline"]["overallSpearman"],
}, ensure_ascii=False, indent=2))
