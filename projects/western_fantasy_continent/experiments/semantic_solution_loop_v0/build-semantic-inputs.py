from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
EXPERIMENTS = ROOT.parent
SEMANTIC_ARTIFACT = EXPERIMENTS / "semantic_team_coordinate_v0" / "artifacts" / "semantic-coordinate-results.json"
OUT_FILE = ROOT / "artifacts" / "semantic-inputs.json"

sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))
from gte_runtime import GTERuntime  # noqa: E402


NEEDS = {
    "survive": "队伍很快倒下，需要让队伍活下来并在敌人造成致命伤害前解除威胁",
    "finish": "敌人已经接近倒下，需要补足伤害并完成最后击杀",
    "attrition": "战斗拖了很久，需要在持久战中保持队伍生存并持续造成伤害",
    "reliable": "需要更可靠地让队伍存活并最终击倒敌人",
}

CONCEPTS = {
    "shield": "用护盾保护队友",
    "healing": "持续治疗受伤的队友",
    "control": "限制敌人行动并为队友争取时间",
    "burst": "快速造成伤害并击倒敌人",
    "sustained_damage": "通过持续伤害逐渐消耗敌人",
    "survival": "让队伍成员在战斗中存活",
}


def normalize(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    return vector / norm if norm > 1e-12 else np.zeros_like(vector)


def main() -> None:
    source = json.loads(SEMANTIC_ARTIFACT.read_text(encoding="utf-8"))
    snapshots = source["coordinateSnapshots"]
    assert snapshots["outcomeClaimsExcluded"] is True
    team_coordinates = np.asarray(snapshots["capabilityOnly"], dtype=np.float64)
    team_coordinates = np.asarray([normalize(row) for row in team_coordinates])

    runtime = GTERuntime(os.environ.get("GTE_MODEL_PATH"))
    texts = [*NEEDS.values(), *CONCEPTS.values()]
    encoded = runtime.encode(texts, batch_size=16)
    vectors = {text: normalize(encoded[index]) for index, text in enumerate(texts)}

    payload = {
        "schema": "semantic_solution_inputs_v0",
        "boundary": {
            "teamCoordinatesExcludeOutcomeClaims": True,
            "needTextsAreFrozenBeforeHiddenValidation": True,
            "conceptTextsAreFrozenBeforeHiddenValidation": True,
        },
        "model": source["model"],
        "teamOrder": snapshots["teamOrder"],
        "teamCoordinates": np.round(team_coordinates, 8).tolist(),
        "needs": {
            need_id: {"text": text, "vector": np.round(vectors[text], 8).tolist()}
            for need_id, text in NEEDS.items()
        },
        "concepts": {
            concept_id: {"text": text, "vector": np.round(vectors[text], 8).tolist()}
            for concept_id, text in CONCEPTS.items()
        },
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(OUT_FILE),
        "teams": len(team_coordinates),
        "dimensions": int(team_coordinates.shape[1]),
        "needs": len(NEEDS),
        "concepts": len(CONCEPTS),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
