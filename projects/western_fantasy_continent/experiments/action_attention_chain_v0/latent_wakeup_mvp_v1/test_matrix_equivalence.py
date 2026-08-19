from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from run_holdout import HOLDOUT
from run_mvp import GTERuntime, SCENARIOS, SemanticWakeRuntime, collect_texts


HERE = Path(__file__).resolve().parent


def main() -> None:
    model = json.loads((HERE / "ai_initial_model.json").read_text(encoding="utf-8"))
    scenarios = [*SCENARIOS, *HOLDOUT]
    texts = collect_texts(model, scenarios)
    encoded = GTERuntime().encode(texts, batch_size=16)
    vectors = {text: encoded[index] for index, text in enumerate(texts)}
    runtime = SemanticWakeRuntime(model, vectors)
    original_retrieve = runtime.retrieve
    errors = []
    query_count = 0

    def checked_retrieve(event: dict) -> dict:
        nonlocal query_count
        result = original_retrieve(event)
        reference = runtime.reference_scores(event)
        matrix_scores = np.asarray(result["activationVector"])
        errors.append(float(np.max(np.abs(reference - matrix_scores))))
        query_count += 1
        return result

    runtime.retrieve = checked_retrieve
    for scenario in scenarios:
        runtime.run(scenario)

    max_error = max(errors, default=0.0)
    assert query_count >= 15
    assert max_error < 1e-12, max_error
    assert runtime.activation_matrix.shape[1] == 1536
    print(json.dumps({
        "pass": True,
        "queriesCompared": query_count,
        "maxAbsoluteError": max_error,
        "activationMatrixShape": list(runtime.activation_matrix.shape),
        "memoryCount": len(runtime.presets),
        "objectPhrasingCount": runtime.example_count,
        "runtimePath": "one matrix multiplication plus max-reduction and fact mask",
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
