from __future__ import annotations

import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent
RESULT = json.loads(
    (ROOT / "artifacts" / "vector-test-results.json").read_text(encoding="utf-8")
)
assert RESULT["teamCount"] == 50
assert len(RESULT["axisOrder"]) == 9
assert RESULT["directionLanguage"]["atomicTop1Rate"] >= 0.9
assert RESULT["retrieval"]["heldOutPassRate"] >= 6 / 7
assert RESULT["axisStability"]["meanSpearman"] >= 0.8
assert RESULT["axisStability"]["topBeatsBottomRate"] >= 8 / 9
assert RESULT["teamGuess"]["top3"] >= 45

for row in RESULT["retrieval"]["rows"]:
    norm = math.sqrt(sum(value * value for value in row["directionWeights"].values()))
    assert abs(norm - 1.0) < 0.001
    assert len(row["top5"]) == 5
    assert all(item["teamId"].startswith("team-") for item in row["top5"])

print(
    json.dumps(
        {
            "pass": True,
            "atomicDirectionTop1": RESULT["directionLanguage"]["atomicTop1Rate"],
            "heldOutRetrievalPass": RESULT["retrieval"]["heldOutPassRate"],
            "meanAxisSpearman": RESULT["axisStability"]["meanSpearman"],
            "guessTop1": RESULT["teamGuess"]["top1"],
            "guessTop3": RESULT["teamGuess"]["top3"],
        },
        ensure_ascii=False,
        indent=2,
    )
)
