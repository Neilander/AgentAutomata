from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402


def main() -> None:
    files = [HERE / "family_catalog_part_a.json", HERE / "family_catalog_part_b.json"]
    parts = [json.loads(path.read_text(encoding="utf-8")) for path in files]
    texts = [
        f"{row['name_zh']}。规律：{row['invariant']}。边界：{row['boundary_condition']}"
        for part in parts for row in part
    ]
    vectors = GTERuntime().encode(texts, batch_size=32)
    left = vectors[:len(parts[0])]
    right = vectors[len(parts[0]):]
    scores = left @ right.T
    pairs = []
    for i in range(scores.shape[0]):
        for j in range(scores.shape[1]):
            pairs.append((float(scores[i, j]), parts[0][i], parts[1][j]))
    pairs.sort(key=lambda item: item[0], reverse=True)
    output = [
        {
            "score": score,
            "left": left_row["family_id"],
            "leftName": left_row["name_zh"],
            "right": right_row["family_id"],
            "rightName": right_row["name_zh"],
        }
        for score, left_row, right_row in pairs[:30]
    ]
    print(json.dumps(output, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
