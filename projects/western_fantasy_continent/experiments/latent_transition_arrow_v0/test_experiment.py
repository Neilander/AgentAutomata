from __future__ import annotations

import numpy as np

from run_experiment import normalize_rows, transform_embeddings
from transition_dataset import CORE_FAMILY_IDS, FAMILIES, build_transitions


def main() -> None:
    core = build_transitions(core_only=True)
    expanded = build_transitions(core_only=False)
    assert len(CORE_FAMILY_IDS) == 6
    assert len(FAMILIES) == 12
    assert len(core) == 96
    assert len(expanded) == 192
    assert len({item["relation"] for item in expanded}) == 24
    assert all(len(item["candidates"]) == 4 for item in expanded)
    assert all(item["candidates"][0] == item["after"] for item in expanded)
    assert all(item["before"] != item["after"] for item in expanded)

    matrix = normalize_rows(np.arange(1, 97, dtype=np.float64).reshape(12, 8))
    raw, raw_info = transform_embeddings(matrix, "raw")
    corrected, corrected_info = transform_embeddings(matrix, "abtt_1")
    assert np.allclose(raw, matrix)
    assert raw_info["method"] == "raw"
    assert corrected.shape == matrix.shape
    assert corrected_info["removed_components"] == 1
    assert np.isfinite(corrected).all()
    print("PASS latent_transition_arrow_v0 contract tests")


if __name__ == "__main__":
    main()

