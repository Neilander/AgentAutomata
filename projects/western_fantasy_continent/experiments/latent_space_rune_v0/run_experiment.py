from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from character_space import (
    AXES,
    AXIS_ANCHORS,
    axis_probabilities,
    build_characters,
    evaluate_axes,
    inverse_survival_retrieval,
    lock_blood_context_check,
    normalize_rows,
    oracle_probabilities,
    run_all_guesses,
)
from gte_runtime import GTERuntime


def main() -> None:
    output_path = Path(__file__).resolve().parent / "artifacts" / "latest_results.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    characters = build_characters()
    runtime = GTERuntime()
    character_vectors = normalize_rows(runtime.encode([item.description for item in characters]))

    all_anchor_texts = []
    anchor_slices = {}
    for axis in AXES:
        positive_start = len(all_anchor_texts)
        all_anchor_texts.extend(AXIS_ANCHORS[axis]["positive"])
        positive_end = len(all_anchor_texts)
        negative_start = len(all_anchor_texts)
        all_anchor_texts.extend(AXIS_ANCHORS[axis]["negative"])
        negative_end = len(all_anchor_texts)
        anchor_slices[axis] = (
            slice(positive_start, positive_end),
            slice(negative_start, negative_end),
        )

    anchor_vectors = runtime.encode(all_anchor_texts)
    positives = {
        axis: anchor_vectors[anchor_slices[axis][0]] for axis in AXES
    }
    negatives = {
        axis: anchor_vectors[anchor_slices[axis][1]] for axis in AXES
    }
    latent_probabilities, anchor_diagnostics = axis_probabilities(
        character_vectors, positives, negatives
    )
    axis_auc = evaluate_axes(characters, latent_probabilities)

    oracle_guess = run_all_guesses(characters, oracle_probabilities(characters))
    latent_guess = run_all_guesses(characters, latent_probabilities)
    results = {
        "model": {
            "name": "Alibaba-NLP/gte-multilingual-base",
            "dimensions": int(character_vectors.shape[1]),
            "offline": True,
        },
        "dataset": {
            "character_count": len(characters),
            "axis_count": len(AXES),
            "axes": list(AXES),
            "coordinates_come_from_description_only": True,
            "truth_tags_used_for_evaluation_only": True,
        },
        "axis_auc": axis_auc,
        "mean_axis_auc": float(np.mean(list(axis_auc.values()))),
        "anchor_diagnostics": anchor_diagnostics,
        "inverse_retrieval": inverse_survival_retrieval(
            characters, latent_probabilities
        ),
        "same_word_different_meaning": lock_blood_context_check(
            characters, latent_probabilities
        ),
        "oracle_guess": {
            key: value for key, value in oracle_guess.items() if key != "runs"
        },
        "latent_guess": {
            key: value for key, value in latent_guess.items() if key != "runs"
        },
        "representative_latent_runs": [
            latent_guess["runs"][0],
            latent_guess["runs"][18],
            latent_guess["runs"][38],
            latent_guess["runs"][39],
        ],
    }
    output_path.write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"RESULT_PATH={output_path}")


if __name__ == "__main__":
    main()
