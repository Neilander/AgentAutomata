from __future__ import annotations

import json
from pathlib import Path


HERE = Path(__file__).resolve().parent


def main() -> None:
    model = json.loads((HERE / "ai_initial_model.json").read_text(encoding="utf-8"))
    assert model["frozenForEvaluation"] is True
    assert set(model["attentionPresets"]) == {"directed_move", "inspect"}
    assert len(model["memoryPresets"]) == 5
    serialized = json.dumps(model, ensure_ascii=False)
    for forbidden in ("arrow_then_city_recursive", "sky-c0-r1", "random_extra", "白色外星载具"):
        assert forbidden not in serialized, f"scenario leaked into frozen model: {forbidden}"
    for preset in model["memoryPresets"]:
        assert len(preset["targetExamples"]) >= 3
        assert len(preset["triggerExamples"]) >= 2
        assert "sourceRule" in preset
    print("PASS: frozen AI model contains no evaluation scenario ids, coordinates, or actor paraphrases")


if __name__ == "__main__":
    main()
