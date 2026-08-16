from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import numpy as np

from episodic_learner import (
    Prediction,
    _safe_render,
    _validate_row,
    effect_signature,
    global_representation,
    step_representations,
)


VectorEncoder = Callable[[list[str]], np.ndarray]


def normalize(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    return vector if norm == 0.0 else vector / norm


@dataclass
class Prototype:
    signature: tuple
    effects: list[dict]
    result_template: str
    source_ids: list[str]
    global_sum: np.ndarray
    step_sums: np.ndarray
    step_counts: np.ndarray


class ConsequencePrototypeLearner:
    """
    Accumulates a continuous prototype for each *observed result delta*.

    The grouping key is not a generator family label. It is the state change the
    learner actually saw, such as p0.integrity -> broken. More experiences with
    that same consequence pull its cause prototype a little, so evidence can be
    accumulated instead of requiring one individual row to enter Top-K.
    """

    def __init__(
        self,
        encoder: VectorEncoder,
        *,
        global_weight: float = 0.72,
        min_similarity: float | None = None,
    ) -> None:
        self.encoder = encoder
        self.global_weight = global_weight
        self.min_similarity = min_similarity
        self.prototypes: dict[tuple, Prototype] = {}
        self.dimension: int | None = None

    def observe(self, batch: list[dict]) -> None:
        for row in batch:
            _validate_row(row, observed=True)
        global_vectors = self.encoder([global_representation(row) for row in batch])
        step_texts = [text for row in batch for text in step_representations(row)]
        step_vectors = self.encoder(step_texts)
        self.dimension = int(global_vectors.shape[1])
        offset = 0
        for row_index, row in enumerate(batch):
            count = len(row["interactions"])
            row_steps = step_vectors[offset:offset + count]
            offset += count
            signature = effect_signature(row["effects"])
            prototype = self.prototypes.get(signature)
            if prototype is None:
                prototype = Prototype(
                    signature=signature,
                    effects=row["effects"],
                    result_template=row["resultTemplate"],
                    source_ids=[],
                    global_sum=np.zeros(self.dimension, dtype=global_vectors.dtype),
                    step_sums=np.zeros((2, self.dimension), dtype=global_vectors.dtype),
                    step_counts=np.zeros(2, dtype=np.float64),
                )
                self.prototypes[signature] = prototype
            prototype.source_ids.append(row["id"])
            prototype.global_sum += global_vectors[row_index]
            prototype.step_sums[:count] += row_steps
            prototype.step_counts[:count] += 1.0

    def _matrices(self) -> tuple[list[Prototype], np.ndarray, np.ndarray, np.ndarray]:
        rows = list(self.prototypes.values())
        global_matrix = np.stack([normalize(row.global_sum) for row in rows])
        step_matrix = np.zeros((len(rows), 2, self.dimension), dtype=global_matrix.dtype)
        step_mask = np.zeros((len(rows), 2), dtype=np.float64)
        for row_index, row in enumerate(rows):
            for step_index in range(2):
                if row.step_counts[step_index] > 0:
                    step_matrix[row_index, step_index] = normalize(row.step_sums[step_index])
                    step_mask[row_index, step_index] = 1.0
        return rows, global_matrix, step_matrix, step_mask

    def predict(self, batch: list[dict]) -> list[Prediction]:
        if not self.prototypes:
            raise RuntimeError("observe at least one trajectory before predicting")
        for row in batch:
            _validate_row(row, observed=False)
        rows, global_matrix, step_matrix, step_mask = self._matrices()
        globals_ = self.encoder([global_representation(row) for row in batch])
        flat_steps = self.encoder([text for row in batch for text in step_representations(row)])
        output = []
        offset = 0
        for query_index, query in enumerate(batch):
            count = len(query["interactions"])
            query_steps = flat_steps[offset:offset + count]
            offset += count
            global_scores = global_matrix @ globals_[query_index]
            aligned = np.einsum("nkd,kd->nk", step_matrix[:, :count], query_steps)
            overlap = step_mask[:, :count]
            step_scores = (aligned * overlap).sum(axis=1) / np.maximum(overlap.sum(axis=1), 1.0)
            prototype_counts = step_mask.sum(axis=1)
            count_penalty = 0.04 * np.abs(prototype_counts - count)
            scores = (
                self.global_weight * global_scores
                + (1.0 - self.global_weight) * step_scores
                - count_penalty
            )
            order = np.argsort(scores)[::-1]
            selected_index = None
            for candidate in order:
                required = {effect["slot"] for effect in rows[int(candidate)].effects}
                if required.issubset(query["bindings"]):
                    selected_index = int(candidate)
                    break
            if selected_index is None:
                output.append(Prediction(query["id"], True, None, [], [], float(scores[order[0]]), 0.0))
                continue
            score = float(scores[selected_index])
            second = float(scores[order[1]]) if len(order) > 1 else -1.0
            prototype = rows[selected_index]
            if self.min_similarity is not None and score < self.min_similarity:
                output.append(Prediction(query["id"], True, None, [], [], score, score - second))
                continue
            effects = [
                {
                    "entity": query["bindings"][effect["slot"]],
                    "property": effect["property"],
                    "operation": effect["operation"],
                    "value": effect["value"],
                }
                for effect in prototype.effects
            ]
            output.append(Prediction(
                query["id"], False, _safe_render(prototype.result_template, query["bindings"]),
                effects, prototype.source_ids[-9:], score, score - second,
            ))
        return output
