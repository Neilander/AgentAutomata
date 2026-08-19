from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Iterable

import numpy as np


def unit(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    if norm < 1e-12:
        return np.zeros_like(vector)
    return vector / norm


@dataclass(frozen=True)
class Segment:
    trajectory_id: str
    step_index: int
    previous_text: str
    current_text: str
    next_text: str
    next_concept: str | None


def transition_text(previous: str, current: str) -> str:
    """Turn two observed state points into one neutral transition point.

    This contains no rule name or expected consequence.  It only preserves the
    two observations and their temporal order so a text encoder can represent
    relations that raw vector subtraction may lose.
    """
    return f"状态变化。之前：{previous} 现在：{current}"


class HardTrajectoryMemory:
    """Immutable episodic trajectories with one-shot matrix retrieval.

    Runtime retrieval does not branch over memories. Every remembered segment
    is compiled into one matrix row. A query performs a single matrix-vector
    product, then only the small retrieved Top-K is combined.
    """

    def __init__(
        self,
        trajectories: list[dict],
        vectors: dict[str, np.ndarray],
        *,
        state_weight: float = 0.5,
        direction_weight: float = 0.5,
        signature_mode: str = "state_delta",
        prediction_mode: str = "translate_delta",
    ) -> None:
        if not trajectories:
            raise ValueError("at least one trajectory is required")
        if state_weight < 0 or direction_weight < 0 or state_weight + direction_weight <= 0:
            raise ValueError("invalid retrieval weights")
        total = state_weight + direction_weight
        self.state_weight = state_weight / total
        self.direction_weight = direction_weight / total
        if signature_mode not in {"delta", "endpoints", "state_delta", "transition", "transition_delta"}:
            raise ValueError(f"unknown signature mode: {signature_mode}")
        if prediction_mode not in {"translate_delta", "future_prototype"}:
            raise ValueError(f"unknown prediction mode: {prediction_mode}")
        self.signature_mode = signature_mode
        self.prediction_mode = prediction_mode
        self.vectors = vectors
        self.segments: list[Segment] = []
        signatures: list[np.ndarray] = []
        output_deltas: list[np.ndarray] = []
        output_directions: list[np.ndarray] = []

        for trajectory in trajectories:
            states = trajectory["states"]
            if len(states) < 3:
                raise ValueError(f"trajectory {trajectory['id']} needs at least three states")
            for step_index in range(1, len(states) - 1):
                previous = states[step_index - 1]
                current = states[step_index]
                following = states[step_index + 1]
                previous_vector = vectors[previous["text"]]
                current_vector = vectors[current["text"]]
                following_vector = vectors[following["text"]]
                incoming = unit(current_vector - previous_vector)
                outgoing_raw = following_vector - current_vector
                signatures.append(self._signature(previous_vector, current_vector, incoming, previous["text"], current["text"]))
                output_deltas.append(outgoing_raw)
                output_directions.append(unit(outgoing_raw))
                self.segments.append(Segment(
                    trajectory_id=trajectory["id"],
                    step_index=step_index,
                    previous_text=previous["text"],
                    current_text=current["text"],
                    next_text=following["text"],
                    next_concept=following.get("concept"),
                ))

        self.signature_matrix = np.stack(signatures)
        self.output_delta_matrix = np.stack(output_deltas)
        self.output_direction_matrix = np.stack(output_directions)

    def _signature(
        self,
        previous: np.ndarray,
        current: np.ndarray,
        incoming_direction: np.ndarray,
        previous_text: str,
        current_text: str,
    ) -> np.ndarray:
        if self.signature_mode == "delta":
            return unit(incoming_direction)
        if self.signature_mode == "endpoints":
            return np.concatenate([unit(previous) / np.sqrt(2.0), unit(current) / np.sqrt(2.0)])
        if self.signature_mode == "transition":
            return unit(self.vectors[transition_text(previous_text, current_text)])
        if self.signature_mode == "transition_delta":
            return np.concatenate([
                np.sqrt(self.state_weight) * unit(self.vectors[transition_text(previous_text, current_text)]),
                np.sqrt(self.direction_weight) * unit(incoming_direction),
            ])
        return np.concatenate([
            np.sqrt(self.state_weight) * unit(current),
            np.sqrt(self.direction_weight) * unit(incoming_direction),
        ])

    def query(
        self,
        previous: str | np.ndarray,
        current: str | np.ndarray,
        *,
        top_k: int = 8,
        threshold: float = -1.0,
        score_band: float = 0.10,
        temperature: float = 0.035,
        future_cluster_threshold: float = 0.72,
        outcome_direction_weight: float = 0.35,
        support_bonus: float = 0.04,
    ) -> dict:
        previous_vector = self.vectors[previous] if isinstance(previous, str) else previous
        current_vector = self.vectors[current] if isinstance(current, str) else current
        incoming = unit(current_vector - previous_vector)
        previous_text = previous if isinstance(previous, str) else ""
        current_text = current if isinstance(current, str) else ""
        if self.signature_mode in {"transition", "transition_delta"} and (not previous_text or not current_text):
            raise ValueError("transition signatures require text queries")
        query_vector = self._signature(previous_vector, current_vector, incoming, previous_text, current_text)

        started = perf_counter()
        scores = self.signature_matrix @ query_vector
        matrix_seconds = perf_counter() - started
        order = np.argsort(scores)[::-1]
        best_score = float(scores[order[0]])
        cutoff = best_score - score_band
        selected = [int(index) for index in order[:top_k] if scores[index] >= cutoff]
        preliminary_scores = scores[selected]
        preliminary_logits = (preliminary_scores - preliminary_scores.max()) / max(temperature, 1e-6)
        preliminary_weights = np.exp(preliminary_logits)
        preliminary_weights /= preliminary_weights.sum()
        preliminary_support = float(1.0 / np.sum(preliminary_weights * preliminary_weights))
        evidence_score = float(best_score + support_bonus * np.log(max(1.0, preliminary_support)))
        if evidence_score < threshold or not selected:
            return {
                "abstained": True,
                "bestScore": best_score,
                "evidenceScore": evidence_score,
                "selected": [],
                "matrixSeconds": matrix_seconds,
                "prediction": None,
                "confidence": 0.0,
                "agreement": 0.0,
                "effectiveSupport": 0.0,
            }

        selected_scores = scores[selected]
        logits = (selected_scores - selected_scores.max()) / max(temperature, 1e-6)
        weights = np.exp(logits)
        weights /= weights.sum()
        # Retrieved futures form small evidence groups.  This is deliberately
        # restricted to Top-K; the full memory is never traversed here.
        future_vectors = self.output_delta_matrix[selected] + np.stack([
            self.vectors[self.segments[index].current_text] for index in selected
        ])
        future_vectors = np.stack([unit(row) for row in future_vectors])
        outcome_signatures = np.concatenate([
            np.sqrt(1.0 - outcome_direction_weight) * future_vectors,
            np.sqrt(outcome_direction_weight) * self.output_direction_matrix[selected],
        ], axis=1)
        future_similarity = outcome_signatures @ outcome_signatures.T
        remaining = set(range(len(selected)))
        clusters: list[list[int]] = []
        while remaining:
            frontier = [remaining.pop()]
            cluster: list[int] = []
            while frontier:
                local_index = frontier.pop()
                cluster.append(local_index)
                linked = [candidate for candidate in remaining
                          if future_similarity[local_index, candidate] >= future_cluster_threshold]
                for candidate in linked:
                    remaining.remove(candidate)
                    frontier.append(candidate)
            clusters.append(cluster)
        cluster_masses = [float(np.sum(weights[cluster])) for cluster in clusters]
        winning_cluster_id = int(np.argmax(cluster_masses))
        winning_local = clusters[winning_cluster_id]
        winning_global = [selected[index] for index in winning_local]
        winning_weights = weights[winning_local]
        winning_weights /= winning_weights.sum()
        deltas = self.output_delta_matrix[winning_global]
        prediction_delta = np.sum(winning_weights[:, None] * deltas, axis=0)
        if self.prediction_mode == "future_prototype":
            prediction = unit(np.sum(winning_weights[:, None] * future_vectors[winning_local], axis=0))
        else:
            prediction = unit(current_vector + prediction_delta)
        future_centroid = unit(np.sum(winning_weights[:, None] * future_vectors[winning_local], axis=0))
        future_agreement = future_vectors[winning_local] @ future_centroid
        agreement = float(np.sum(winning_weights * np.clip(future_agreement, -1.0, 1.0)))
        effective_support = float(1.0 / np.sum(winning_weights * winning_weights))
        similarity_strength = float(np.clip((best_score - threshold) / max(1e-6, 1.0 - threshold), 0.0, 1.0))
        support_strength = float(1.0 - np.exp(-effective_support / 2.0))
        cluster_mass = cluster_masses[winning_cluster_id]
        confidence = float(np.clip(similarity_strength * cluster_mass * max(0.0, agreement) * support_strength, 0.0, 1.0))

        rows = []
        for local_index, (index, weight) in enumerate(zip(selected, weights)):
            segment = self.segments[index]
            rows.append({
                "matrixRow": index,
                "trajectoryId": segment.trajectory_id,
                "stepIndex": segment.step_index,
                "score": float(scores[index]),
                "weight": float(weight),
                "rememberedNextConcept": segment.next_concept,
                "inWinningCluster": local_index in winning_local,
            })
        return {
            "abstained": False,
            "bestScore": best_score,
            "evidenceScore": evidence_score,
            "selected": rows,
            "matrixSeconds": matrix_seconds,
            "prediction": prediction,
            "predictionDelta": prediction_delta,
            "confidence": confidence,
            "agreement": agreement,
            "effectiveSupport": effective_support,
            "clusterMass": cluster_mass,
            "clusterCount": len(clusters),
            "evidenceCount": len(winning_local),
        }

    def expanded_for_scale(self, copies: int) -> "HardTrajectoryMemory":
        if copies < 1:
            raise ValueError("copies must be positive")
        clone = object.__new__(HardTrajectoryMemory)
        clone.state_weight = self.state_weight
        clone.direction_weight = self.direction_weight
        clone.signature_mode = self.signature_mode
        clone.prediction_mode = self.prediction_mode
        clone.vectors = self.vectors
        clone.segments = self.segments * copies
        clone.signature_matrix = np.tile(self.signature_matrix, (copies, 1))
        clone.output_delta_matrix = np.tile(self.output_delta_matrix, (copies, 1))
        clone.output_direction_matrix = np.tile(self.output_direction_matrix, (copies, 1))
        return clone


def collect_texts(trajectories: Iterable[dict], cases: Iterable[dict], candidates: dict[str, list[str]]) -> list[str]:
    texts: set[str] = set()
    for trajectory in trajectories:
        texts.update(state["text"] for state in trajectory["states"])
        texts.update(transition_text(trajectory["states"][index - 1]["text"], trajectory["states"][index]["text"])
                     for index in range(1, len(trajectory["states"]) - 1))
    for case in cases:
        texts.add(case["previous"])
        texts.add(case["current"])
        texts.add(transition_text(case["previous"], case["current"]))
    for rows in candidates.values():
        texts.update(rows)
    return sorted(texts)


def rank_concepts(prediction: np.ndarray, candidates: dict[str, list[str]], vectors: dict[str, np.ndarray]) -> list[tuple[str, float]]:
    rows = []
    for concept, descriptions in candidates.items():
        score = max(float(np.dot(prediction, vectors[text])) for text in descriptions)
        rows.append((concept, score))
    return sorted(rows, key=lambda row: row[1], reverse=True)
