from __future__ import annotations

import json
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent

from run_experiment import (  # noqa: E402
    GTERuntime,
    OBJECT_WAKEUPS,
    WAKE_MIN_MARGIN,
    WAKE_MIN_SCORE,
)


CASES = [
    {
        "id": "bomb_from_die_placement",
        "object": "bomb",
        "local_before": "危险装置还没有受到飞船接触",
        "local_after": "危险装置受到下降飞船的碰撞",
        "facts": ["contact", "endpoint_overlap"],
        "expected_recall": "bomb_contacted",
        "expected_verified_glue": "bomb_contacted",
    },
    {
        "id": "bomb_from_random_extra_move",
        "object": "bomb",
        "local_before": "爆炸物所在位置仍然空着",
        "local_after": "随机移动的敌机落入爆炸物所在位置并压住它",
        "facts": ["contact", "endpoint_overlap"],
        "expected_recall": "bomb_contacted",
        "expected_verified_glue": "bomb_contacted",
    },
    {
        "id": "arrow_from_ship_landing",
        "object": "arrow_tile",
        "local_before": "方向标记所在格还没有单位进入",
        "local_after": "下降的飞船占据了方向标记所在格",
        "facts": ["contact", "endpoint_overlap"],
        "expected_recall": "arrow_tile_entered",
        "expected_verified_glue": "arrow_tile_entered",
    },
    {
        "id": "bomb_visible_on_path_not_endpoint",
        "object": "bomb",
        "local_before": "下降路径旁边可以看见炸弹",
        "local_after": "飞船从炸弹所在行经过但最终落在更下方",
        "facts": ["path_visible"],
        "expected_recall": None,
        "expected_verified_glue": None,
    },
    {
        "id": "unknown_rune_landing",
        "object": "unknown_rune",
        "local_before": "陌生符文格还没有单位进入",
        "local_after": "飞船落在了陌生符文格上",
        "facts": ["contact", "endpoint_overlap"],
        "expected_recall": None,
        "expected_verified_glue": None,
    },
    {
        "id": "bomb_painted_blue",
        "object": "bomb",
        "local_before": "炸弹外壳没有涂料",
        "local_after": "角色把炸弹外壳涂成蓝色",
        "facts": ["appearance_change"],
        "expected_recall": None,
        "expected_verified_glue": None,
    },
]


GLUE_REQUIREMENTS = {
    "bomb_contacted": {"contact", "endpoint_overlap"},
    "arrow_tile_entered": {"contact", "endpoint_overlap"},
}


def normalize(vector: np.ndarray) -> np.ndarray:
    return vector / max(float(np.linalg.norm(vector)), 1e-12)


def cosine(left: np.ndarray, right: np.ndarray) -> float:
    return float(np.dot(normalize(left), normalize(right)))


def main() -> None:
    texts = set()
    for record in OBJECT_WAKEUPS.values():
        for candidate in record["candidates"]:
            for before, after in candidate.get("trigger_examples", []):
                texts.update((before, after))
    for case in CASES:
        texts.update((case["local_before"], case["local_after"]))

    ordered = sorted(texts)
    encoded = GTERuntime().encode(ordered, batch_size=16)
    vectors = {text: encoded[index] for index, text in enumerate(ordered)}

    prototypes = {}
    for object_id, record in OBJECT_WAKEUPS.items():
        prototypes[object_id] = {}
        for candidate in record["candidates"]:
            examples = candidate.get("trigger_examples", [])
            if not examples:
                continue
            arrows = np.stack(
                [normalize(vectors[after] - vectors[before]) for before, after in examples]
            )
            prototypes[object_id][candidate["id"]] = normalize(arrows.mean(axis=0))

    rows = []
    for case in CASES:
        object_prototypes = prototypes.get(case["object"])
        if not object_prototypes:
            recalled = None
            scores = {}
            margin = None
            accepted = False
        else:
            arrow = normalize(vectors[case["local_after"]] - vectors[case["local_before"]])
            scores = {key: cosine(arrow, value) for key, value in object_prototypes.items()}
            ranking = sorted(scores, key=scores.get, reverse=True)
            margin = scores[ranking[0]] - scores[ranking[1]]
            accepted = scores[ranking[0]] >= WAKE_MIN_SCORE and margin >= WAKE_MIN_MARGIN
            recalled = ranking[0] if accepted else None

        required = GLUE_REQUIREMENTS.get(recalled)
        verified = recalled if required and required.issubset(set(case["facts"])) else None
        rows.append(
            {
                **case,
                "raw_recall": recalled,
                "scores": scores,
                "margin": margin,
                "accepted": accepted,
                "verified_glue": verified,
                "recall_correct": recalled == case["expected_recall"],
                "verified_correct": verified == case["expected_verified_glue"],
            }
        )

    payload = {
        "schema": "latent_glue_recall_manifest_v0",
        "thresholds": {"minimum_score": WAKE_MIN_SCORE, "minimum_margin": WAKE_MIN_MARGIN},
        "cases": rows,
        "summary": {
            "case_count": len(rows),
            "raw_recall_accuracy": float(np.mean([row["recall_correct"] for row in rows])),
            "verified_glue_accuracy": float(np.mean([row["verified_correct"] for row in rows])),
            "false_raw_recall_count": sum(
                row["raw_recall"] is not None and row["expected_recall"] is None for row in rows
            ),
            "false_verified_glue_count": sum(
                row["verified_glue"] is not None and row["expected_verified_glue"] is None
                for row in rows
            ),
        },
    }
    output_dir = HERE / "artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / "glue_recall_manifest.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(payload["summary"], ensure_ascii=False))
    print(f"RESULT_PATH={path}")


if __name__ == "__main__":
    main()
