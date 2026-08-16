from __future__ import annotations

import json
import math
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any, Protocol

import numpy as np


SCHEMA = "five_slot_trajectory_memory_v0"
SLOT_NAMES = (
    "affected_object",
    "change_trend",
    "cause_relation",
    "temporal_state",
    "context",
)
DEFAULT_SLOT_WEIGHTS = {
    "affected_object": 0.20,
    "change_trend": 0.27,
    "cause_relation": 0.23,
    "temporal_state": 0.13,
    "context": 0.17,
}


class TextEncoder(Protocol):
    """Minimal encoder contract; GTE and test encoders both implement this."""

    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        ...


def unit(vector: np.ndarray) -> np.ndarray:
    vector = np.asarray(vector, dtype=np.float64)
    norm = float(np.linalg.norm(vector))
    if norm < 1e-12:
        return np.zeros_like(vector)
    return vector / norm


@dataclass(frozen=True)
class FiveSlotCoordinate:
    """One perceived event coordinate, not a sentence or an action opcode."""

    affected_object: str
    change_trend: str
    cause_relation: str
    temporal_state: str
    context: str

    def __post_init__(self) -> None:
        for name in SLOT_NAMES:
            value = getattr(self, name)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"{name} must be a non-empty string")

    def slot_texts(self) -> list[str]:
        return [getattr(self, name).strip() for name in SLOT_NAMES]

    @classmethod
    def from_dict(cls, row: dict[str, Any]) -> "FiveSlotCoordinate":
        return cls(**{name: row[name] for name in SLOT_NAMES})


@dataclass
class TransitionRecord:
    record_id: str
    current: FiveSlotCoordinate
    following: FiveSlotCoordinate
    support: float = 1.0
    observations: int = 1
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "recordId": self.record_id,
            "current": asdict(self.current),
            "following": asdict(self.following),
            "support": self.support,
            "observations": self.observations,
            "metadata": self.metadata,
        }

    @classmethod
    def from_dict(cls, row: dict[str, Any]) -> "TransitionRecord":
        return cls(
            record_id=row["recordId"],
            current=FiveSlotCoordinate.from_dict(row["current"]),
            following=FiveSlotCoordinate.from_dict(row["following"]),
            support=float(row.get("support", 1.0)),
            observations=int(row.get("observations", 1)),
            metadata=dict(row.get("metadata", {})),
        )


@dataclass(frozen=True)
class WakeupCandidate:
    record_id: str
    score: float
    weight: float
    support: float
    observations: int
    following: FiveSlotCoordinate
    in_winning_cluster: bool
    metadata: dict[str, Any]


@dataclass(frozen=True)
class WakeupResult:
    abstained: bool
    reason: str | None
    best_score: float
    confidence: float
    agreement: float
    effective_support: float
    following: FiveSlotCoordinate | None
    prediction_vector: np.ndarray | None
    candidates: tuple[WakeupCandidate, ...]

    def to_dict(self, *, include_vector: bool = False) -> dict[str, Any]:
        row: dict[str, Any] = {
            "abstained": self.abstained,
            "reason": self.reason,
            "bestScore": self.best_score,
            "confidence": self.confidence,
            "agreement": self.agreement,
            "effectiveSupport": self.effective_support,
            "following": asdict(self.following) if self.following else None,
            "candidates": [
                {
                    "recordId": candidate.record_id,
                    "score": candidate.score,
                    "weight": candidate.weight,
                    "support": candidate.support,
                    "observations": candidate.observations,
                    "following": asdict(candidate.following),
                    "inWinningCluster": candidate.in_winning_cluster,
                    "metadata": candidate.metadata,
                }
                for candidate in self.candidates
            ],
        }
        if include_vector:
            row["predictionVector"] = (
                self.prediction_vector.tolist() if self.prediction_vector is not None else None
            )
        return row


class FiveSlotTrajectoryMemory:
    """Reusable q -> q_next episodic memory with one matrix retrieval.

    Each q is five independently encoded semantic slots.  Runtime retrieval is
    a single matrix-vector multiplication over all remembered q coordinates.
    Only the small retrieved Top-K is clustered to decide which remembered
    continuation was jointly supported.
    """

    def __init__(
        self,
        encoder: TextEncoder,
        *,
        slot_weights: dict[str, float] | None = None,
        records: list[TransitionRecord] | None = None,
    ) -> None:
        self.encoder = encoder
        self.slot_weights = self._normalize_weights(slot_weights or DEFAULT_SLOT_WEIGHTS)
        self.records = list(records or [])
        self._text_vectors: dict[str, np.ndarray] = {}
        self._current_matrix: np.ndarray | None = None
        self._following_matrix: np.ndarray | None = None
        self.coordinate_dimension: int | None = None

    @classmethod
    def new(
        cls,
        encoder: TextEncoder,
        *,
        slot_weights: dict[str, float] | None = None,
    ) -> "FiveSlotTrajectoryMemory":
        """Create an independent, completely empty memory instance."""
        return cls(encoder, slot_weights=slot_weights)

    @classmethod
    def load(cls, path: str | Path, encoder: TextEncoder) -> "FiveSlotTrajectoryMemory":
        payload = json.loads(Path(path).read_text(encoding="utf-8"))
        if payload.get("schema") != SCHEMA:
            raise ValueError(f"unsupported memory schema: {payload.get('schema')}")
        records = [TransitionRecord.from_dict(row) for row in payload.get("records", [])]
        return cls(encoder, slot_weights=payload["slotWeights"], records=records)

    def save(self, path: str | Path) -> Path:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        payload = {
            "schema": SCHEMA,
            "slotOrder": list(SLOT_NAMES),
            "slotWeights": self.slot_weights,
            "records": [record.to_dict() for record in self.records],
        }
        target.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        return target

    def __len__(self) -> int:
        return len(self.records)

    @property
    def is_empty(self) -> bool:
        return not self.records

    def remember(
        self,
        current: FiveSlotCoordinate,
        following: FiveSlotCoordinate,
        *,
        strength: float = 1.0,
        metadata: dict[str, Any] | None = None,
        record_id: str | None = None,
    ) -> str:
        if not math.isfinite(strength) or strength <= 0:
            raise ValueError("strength must be finite and positive")
        metadata = dict(metadata or {})
        for record in self.records:
            if record.current == current and record.following == following:
                record.support += float(strength)
                record.observations += 1
                if metadata:
                    record.metadata.update(metadata)
                self._invalidate_matrix()
                return record.record_id
        identifier = record_id or uuid.uuid4().hex
        if any(record.record_id == identifier for record in self.records):
            raise ValueError(f"duplicate record_id: {identifier}")
        self.records.append(TransitionRecord(
            record_id=identifier,
            current=current,
            following=following,
            support=float(strength),
            observations=1,
            metadata=metadata,
        ))
        self._invalidate_matrix()
        return identifier

    def remember_trajectory(
        self,
        coordinates: list[FiveSlotCoordinate],
        *,
        strength: float = 1.0,
        metadata: dict[str, Any] | None = None,
    ) -> list[str]:
        if len(coordinates) < 2:
            raise ValueError("a trajectory needs at least two coordinates")
        return [
            self.remember(
                coordinates[index],
                coordinates[index + 1],
                strength=strength,
                metadata={**(metadata or {}), "trajectoryStep": index},
            )
            for index in range(len(coordinates) - 1)
        ]

    def coordinate_vector(self, coordinate: FiveSlotCoordinate) -> np.ndarray:
        self._ensure_texts(coordinate.slot_texts())
        parts = [
            math.sqrt(self.slot_weights[name]) * self._text_vectors[text]
            for name, text in zip(SLOT_NAMES, coordinate.slot_texts())
        ]
        vector = unit(np.concatenate(parts))
        self.coordinate_dimension = int(vector.shape[0])
        return vector

    def query(
        self,
        coordinate: FiveSlotCoordinate,
        *,
        top_k: int = 8,
        threshold: float = 0.55,
        score_band: float = 0.12,
        temperature: float = 0.045,
        future_cluster_threshold: float = 0.80,
    ) -> WakeupResult:
        if self.is_empty:
            return WakeupResult(
                abstained=True,
                reason="empty_memory",
                best_score=0.0,
                confidence=0.0,
                agreement=0.0,
                effective_support=0.0,
                following=None,
                prediction_vector=None,
                candidates=(),
            )
        if top_k <= 0:
            raise ValueError("top_k must be positive")
        self._compile()
        assert self._current_matrix is not None
        assert self._following_matrix is not None
        query_vector = self.coordinate_vector(coordinate)
        scores = self._current_matrix @ query_vector
        order = np.argsort(scores)[::-1]
        best_score = float(scores[order[0]])
        selected = [
            int(index)
            for index in order[:top_k]
            if float(scores[index]) >= threshold
            and float(scores[index]) >= best_score - score_band
        ]
        if not selected:
            return WakeupResult(
                abstained=True,
                reason="below_threshold",
                best_score=best_score,
                confidence=0.0,
                agreement=0.0,
                effective_support=0.0,
                following=None,
                prediction_vector=None,
                candidates=(),
            )

        selected_scores = scores[selected]
        supports = np.asarray([self.records[index].support for index in selected], dtype=np.float64)
        logits = (selected_scores - selected_scores.max()) / max(temperature, 1e-6)
        logits += np.log(np.maximum(supports, 1e-9))
        weights = np.exp(logits - logits.max())
        weights /= weights.sum()

        clusters: list[list[int]] = []
        for local_index in range(len(selected)):
            candidate_vector = self._following_matrix[selected[local_index]]
            destination: list[int] | None = None
            for cluster in clusters:
                centroid = unit(np.mean(
                    self._following_matrix[[selected[item] for item in cluster]], axis=0
                ))
                if float(candidate_vector @ centroid) >= future_cluster_threshold:
                    destination = cluster
                    break
            if destination is None:
                clusters.append([local_index])
            else:
                destination.append(local_index)

        cluster_masses = [float(weights[cluster].sum()) for cluster in clusters]
        winning_cluster = clusters[int(np.argmax(cluster_masses))]
        winning_weights = weights[winning_cluster]
        winning_weights /= winning_weights.sum()
        winning_global = [selected[index] for index in winning_cluster]
        prediction_vector = unit(np.sum(
            winning_weights[:, None] * self._following_matrix[winning_global], axis=0
        ))
        similarities = self._following_matrix[winning_global] @ prediction_vector
        agreement = float(np.sum(winning_weights * similarities))
        representative_local = int(np.argmax(similarities))
        representative_global = winning_global[representative_local]
        effective_support = float(sum(self.records[index].support for index in winning_global))
        similarity_strength = float(np.clip(
            (best_score - threshold) / max(1e-6, 1.0 - threshold), 0.0, 1.0
        ))
        support_strength = float(1.0 - math.exp(-effective_support / 2.0))
        confidence = float(np.clip(
            similarity_strength
            * cluster_masses[int(np.argmax(cluster_masses))]
            * max(0.0, agreement)
            * support_strength,
            0.0,
            1.0,
        ))

        candidate_rows = []
        winning_set = set(winning_cluster)
        for local_index, global_index in enumerate(selected):
            record = self.records[global_index]
            candidate_rows.append(WakeupCandidate(
                record_id=record.record_id,
                score=float(scores[global_index]),
                weight=float(weights[local_index]),
                support=record.support,
                observations=record.observations,
                following=record.following,
                in_winning_cluster=local_index in winning_set,
                metadata=dict(record.metadata),
            ))
        return WakeupResult(
            abstained=False,
            reason=None,
            best_score=best_score,
            confidence=confidence,
            agreement=agreement,
            effective_support=effective_support,
            following=self.records[representative_global].following,
            prediction_vector=prediction_vector,
            candidates=tuple(candidate_rows),
        )

    @staticmethod
    def _normalize_weights(weights: dict[str, float]) -> dict[str, float]:
        if set(weights) != set(SLOT_NAMES):
            missing = set(SLOT_NAMES) - set(weights)
            extra = set(weights) - set(SLOT_NAMES)
            raise ValueError(f"slot weights mismatch; missing={sorted(missing)}, extra={sorted(extra)}")
        if any(not math.isfinite(float(value)) or float(value) < 0 for value in weights.values()):
            raise ValueError("slot weights must be finite and non-negative")
        total = float(sum(weights.values()))
        if total <= 0:
            raise ValueError("at least one slot weight must be positive")
        return {name: float(weights[name]) / total for name in SLOT_NAMES}

    def _ensure_texts(self, texts: list[str]) -> None:
        missing = list(dict.fromkeys(text for text in texts if text not in self._text_vectors))
        if not missing:
            return
        encoded = np.asarray(self.encoder.encode(missing, batch_size=16), dtype=np.float64)
        if encoded.ndim != 2 or encoded.shape[0] != len(missing):
            raise ValueError("encoder returned an invalid matrix")
        for text, vector in zip(missing, encoded):
            self._text_vectors[text] = unit(vector)

    def _compile(self) -> None:
        if self._current_matrix is not None and self._following_matrix is not None:
            return
        texts = []
        for record in self.records:
            texts.extend(record.current.slot_texts())
            texts.extend(record.following.slot_texts())
        self._ensure_texts(texts)
        self._current_matrix = np.stack([
            self.coordinate_vector(record.current) for record in self.records
        ])
        self._following_matrix = np.stack([
            self.coordinate_vector(record.following) for record in self.records
        ])

    def _invalidate_matrix(self) -> None:
        self._current_matrix = None
        self._following_matrix = None

