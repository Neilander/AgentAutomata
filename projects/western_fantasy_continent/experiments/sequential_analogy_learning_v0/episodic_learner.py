from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import numpy as np


VectorEncoder = Callable[[list[str]], np.ndarray]


def _slot_order(slot: str) -> int:
    if not slot.startswith("p") or not slot[1:].isdigit():
        raise ValueError(f"invalid slot {slot!r}; expected p0/p1/p2")
    return int(slot[1:])


def _validate_row(row: dict, *, observed: bool) -> None:
    slots = row["slots"]
    if not 1 <= len(slots) <= 3:
        raise ValueError("a trajectory must contain 1-3 slots")
    expected = [f"p{index}" for index in range(len(slots))]
    actual = [slot["slot"] for slot in slots]
    if actual != expected:
        raise ValueError(f"slots must be canonical and consecutive: {expected}")
    if set(row["bindings"]) != set(expected):
        raise ValueError("bindings must cover every canonical slot exactly once")
    interactions = row["interactions"]
    if not 1 <= len(interactions) <= 2:
        raise ValueError("a trajectory must contain 1-2 interactions")
    for interaction in interactions:
        if interaction["subject"] not in expected:
            raise ValueError("interaction subject is not bound")
        if interaction.get("object") is not None and interaction["object"] not in expected:
            raise ValueError("interaction object is not bound")
    if observed:
        if "resultTemplate" not in row or "effects" not in row:
            raise ValueError("an observed trajectory must include its result")
        for effect in row["effects"]:
            if effect["slot"] not in expected:
                raise ValueError("effect slot is not bound")
            for key in ("property", "operation", "value"):
                if not effect.get(key):
                    raise ValueError(f"effect requires {key}")
    elif "resultTemplate" in row or "effects" in row:
        raise ValueError("prediction queries must not contain hidden results")


def global_representation(row: dict) -> str:
    """Entity names are excluded; only roles, observations and ordered changes remain."""
    roles = "；".join(f"<{slot['slot']}:{slot['description']}>" for slot in row["slots"])
    steps = "；".join(
        f"第{index + 1}步：<{step['subject']}> {step['change']} "
        f"<{step['object']}>" if step.get("object") is not None
        else f"第{index + 1}步：<{step['subject']}> {step['change']}"
        for index, step in enumerate(row["interactions"])
    )
    return (
        f"临时角色：{roles}。"
        f"之前：{row['beforeNorm']}。"
        f"有序互动：{steps}。"
        f"现在：{row['currentNorm']}。"
    )


def step_representations(row: dict) -> list[str]:
    descriptions = {slot["slot"]: slot["description"] for slot in row["slots"]}
    output = []
    for index, step in enumerate(row["interactions"]):
        subject = descriptions[step["subject"]]
        if step.get("object") is None:
            output.append(f"第{index + 1}步；主体角色：{subject}；变化：{step['change']}")
        else:
            target = descriptions[step["object"]]
            output.append(
                f"第{index + 1}步；主体角色：{subject}；变化：{step['change']}；"
                f"客体角色：{target}"
            )
    return output


def effect_signature(effects: list[dict]) -> tuple[tuple[str, str, str, str], ...]:
    """A state delta, not a hidden causal-family label."""
    return tuple(sorted(
        (effect["slot"], effect["property"], effect["operation"], str(effect["value"]))
        for effect in effects
    ))


def _safe_render(template: str, bindings: dict[str, str]) -> str:
    class SafeBindings(dict):
        def __missing__(self, key: str) -> str:
            return f"<unbound:{key}>"

    return template.format_map(SafeBindings(bindings))


@dataclass(frozen=True)
class Prediction:
    query_id: str
    abstained: bool
    result_text: str | None
    effects: list[dict]
    source_ids: list[str]
    similarity: float
    vote_margin: float


class EpisodicAnalogyLearner:
    """
    Incremental memory, not a trained rule classifier.

    GTE embeds role-normalized trajectory text. Retrieval is one global matrix
    multiplication plus an ordered two-step matrix comparison. Remembered result
    deltas vote after being rebound to the query's p0/p1/p2 entities.
    """

    def __init__(
        self,
        encoder: VectorEncoder,
        *,
        top_k: int = 9,
        global_weight: float = 0.72,
        temperature: float = 0.04,
        min_similarity: float | None = None,
        min_vote_margin: float | None = None,
    ) -> None:
        if not 0.0 <= global_weight <= 1.0:
            raise ValueError("global_weight must be in [0, 1]")
        self.encoder = encoder
        self.top_k = top_k
        self.global_weight = global_weight
        self.temperature = temperature
        self.min_similarity = min_similarity
        self.min_vote_margin = min_vote_margin
        self.rows: list[dict] = []
        self.global_matrix: np.ndarray | None = None
        self.step_matrix: np.ndarray | None = None
        self.step_mask: np.ndarray | None = None

    def observe(self, batch: list[dict]) -> None:
        """Append one revealed batch. This is the only method allowed to see results."""
        if not batch:
            return
        for row in batch:
            _validate_row(row, observed=True)
        texts = [global_representation(row) for row in batch]
        step_texts = [text for row in batch for text in step_representations(row)]
        global_vectors = self.encoder(texts)
        flat_steps = self.encoder(step_texts)
        dimension = int(global_vectors.shape[1])
        steps = np.zeros((len(batch), 2, dimension), dtype=global_vectors.dtype)
        mask = np.zeros((len(batch), 2), dtype=np.float64)
        offset = 0
        for row_index, row in enumerate(batch):
            count = len(row["interactions"])
            steps[row_index, :count, :] = flat_steps[offset:offset + count]
            mask[row_index, :count] = 1.0
            offset += count
        if self.global_matrix is None:
            self.global_matrix = global_vectors
            self.step_matrix = steps
            self.step_mask = mask
        else:
            self.global_matrix = np.concatenate((self.global_matrix, global_vectors), axis=0)
            self.step_matrix = np.concatenate((self.step_matrix, steps), axis=0)
            self.step_mask = np.concatenate((self.step_mask, mask), axis=0)
        self.rows.extend(batch)

    def predict(self, batch: list[dict]) -> list[Prediction]:
        """Queries are result-free and are never added to memory."""
        if self.global_matrix is None or self.step_matrix is None or self.step_mask is None:
            raise RuntimeError("observe at least one trajectory before predicting")
        for row in batch:
            _validate_row(row, observed=False)
        global_vectors = self.encoder([global_representation(row) for row in batch])
        all_step_texts = [text for row in batch for text in step_representations(row)]
        all_step_vectors = self.encoder(all_step_texts)
        predictions = []
        offset = 0
        for query_index, query in enumerate(batch):
            count = len(query["interactions"])
            query_steps = all_step_vectors[offset:offset + count]
            offset += count
            global_scores = self.global_matrix @ global_vectors[query_index]

            # Only compare first change to first and second to second. This retains
            # order without iterating over remembered source rows.
            aligned = np.einsum(
                "nkd,kd->nk", self.step_matrix[:, :count, :], query_steps
            )
            overlap = self.step_mask[:, :count]
            denominators = np.maximum(overlap.sum(axis=1), 1.0)
            step_scores = (aligned * overlap).sum(axis=1) / denominators
            memory_counts = self.step_mask.sum(axis=1)
            count_penalty = 0.04 * np.abs(memory_counts - count)
            scores = (
                self.global_weight * global_scores
                + (1.0 - self.global_weight) * step_scores
                - count_penalty
            )
            predictions.append(self._vote(query, scores))
        return predictions

    def _vote(self, query: dict, scores: np.ndarray) -> Prediction:
        order = np.argsort(scores)[::-1][: min(self.top_k, len(self.rows))]
        best_score = float(scores[order[0]])
        groups: dict[tuple, dict] = {}
        for source_index in order:
            source = self.rows[int(source_index)]
            required_slots = {effect["slot"] for effect in source["effects"]}
            if not required_slots.issubset(query["bindings"]):
                continue
            signature = effect_signature(source["effects"])
            weight = float(np.exp((float(scores[source_index]) - best_score) / self.temperature))
            group = groups.setdefault(signature, {"weight": 0.0, "members": []})
            group["weight"] += weight
            group["members"].append((int(source_index), float(scores[source_index])))
        if not groups:
            return Prediction(query["id"], True, None, [], [], best_score, 0.0)
        ranked = sorted(groups.values(), key=lambda group: group["weight"], reverse=True)
        winner = ranked[0]
        second_weight = ranked[1]["weight"] if len(ranked) > 1 else 0.0
        vote_margin = float(winner["weight"] - second_weight)
        if (
            (self.min_similarity is not None and best_score < self.min_similarity)
            or (self.min_vote_margin is not None and vote_margin < self.min_vote_margin)
        ):
            return Prediction(query["id"], True, None, [], [], best_score, vote_margin)
        exemplar_index = max(winner["members"], key=lambda item: item[1])[0]
        exemplar = self.rows[exemplar_index]
        rebound = [
            {
                "entity": query["bindings"][effect["slot"]],
                "property": effect["property"],
                "operation": effect["operation"],
                "value": effect["value"],
            }
            for effect in exemplar["effects"]
        ]
        return Prediction(
            query_id=query["id"],
            abstained=False,
            result_text=_safe_render(exemplar["resultTemplate"], query["bindings"]),
            effects=rebound,
            source_ids=[self.rows[index]["id"] for index, _ in winner["members"]],
            similarity=best_score,
            vote_margin=vote_margin,
        )
