from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np


def normalize(vector: np.ndarray) -> np.ndarray:
    vector = np.asarray(vector, dtype=np.float64)
    norm = float(np.linalg.norm(vector))
    return vector / norm if norm > 1e-12 else np.zeros_like(vector)


@dataclass(frozen=True)
class Anchor:
    center: np.ndarray
    utility: float
    context: str
    weight: float
    radius: float
    kind: str
    source: str


class ValueLandscape:
    """Player-specific value field built from result and causal anchors."""

    def __init__(
        self,
        *,
        direct_radius: float = 0.12,
        concept_radius: float = 0.28,
        prior_value: float = 0.5,
        prior_mass: float = 0.15,
    ) -> None:
        self.direct_radius = direct_radius
        self.concept_radius = concept_radius
        self.prior_value = prior_value
        self.prior_mass = prior_mass
        self.anchors: list[Anchor] = []

    def observe(
        self,
        *,
        team_coordinate: np.ndarray,
        context: str,
        utility: float,
        source: str,
        verified_concepts: list[tuple[np.ndarray, float]] | None = None,
        concept_scope: str | None = None,
        direct_weight: float = 1.0,
    ) -> None:
        """R always adds a local team anchor; EVerify adds concept anchors."""
        self.anchors.append(Anchor(
            center=normalize(team_coordinate),
            utility=float(np.clip(utility, 0.0, 1.0)),
            context=context,
            weight=max(0.0, direct_weight),
            radius=self.direct_radius,
            kind="direct_team_result",
            source=source,
        ))
        for concept, support in verified_concepts or []:
            if support <= 0:
                continue
            self.anchors.append(Anchor(
                center=normalize(concept),
                utility=float(np.clip(utility, 0.0, 1.0)),
                context=concept_scope or context,
                weight=float(np.clip(support, 0.0, 1.0)),
                radius=self.concept_radius,
                kind="verified_concept_result",
                source=source,
            ))

    def evaluate(self, coordinate: np.ndarray, context: str) -> dict:
        coordinate = normalize(coordinate)
        contributions = []
        for anchor in self.anchors:
            if anchor.context not in (context, "*"):
                continue
            similarity = float(np.dot(coordinate, anchor.center))
            distance = max(0.0, 1.0 - similarity)
            kernel = math.exp(-distance / max(anchor.radius, 1e-6)) * anchor.weight
            if kernel <= 1e-9:
                continue
            contributions.append((kernel, anchor, similarity))
        mass = sum(row[0] for row in contributions)
        numerator = self.prior_mass * self.prior_value + sum(
            kernel * anchor.utility for kernel, anchor, _ in contributions
        )
        value = numerator / (self.prior_mass + mass)
        coverage = mass / (self.prior_mass + mass)
        evidence_mean = (
            sum(kernel * anchor.utility for kernel, anchor, _ in contributions) / mass
            if mass > 1e-12 else self.prior_value
        )
        evidence_variance = (
            sum(kernel * (anchor.utility - evidence_mean) ** 2 for kernel, anchor, _ in contributions) / mass
            if mass > 1e-12 else 0.25
        )
        consensus = float(np.clip(1.0 - 4.0 * evidence_variance, 0.0, 1.0))
        confidence = coverage * consensus
        effective_count = 0.0
        if mass > 1e-12:
            square_sum = sum(row[0] ** 2 for row in contributions)
            effective_count = mass * mass / max(square_sum, 1e-12)
        strongest = sorted(contributions, key=lambda row: row[0], reverse=True)[:5]
        return {
            "value": float(value),
            "confidence": float(confidence),
            "coverage": float(coverage),
            "consensus": consensus,
            "evidenceVariance": float(evidence_variance),
            "effectiveAnchorCount": float(effective_count),
            "evidenceMass": float(mass),
            "strongestAnchors": [
                {
                    "source": anchor.source,
                    "kind": anchor.kind,
                    "context": anchor.context,
                    "utility": anchor.utility,
                    "influence": float(kernel),
                    "similarity": similarity,
                }
                for kernel, anchor, similarity in strongest
            ],
        }


def adaptive_direct_radius(coordinates: np.ndarray, neighbor_rank: int = 5) -> float:
    coordinates = np.asarray(coordinates, dtype=np.float64)
    if len(coordinates) < 3:
        return 0.12
    similarities = coordinates @ coordinates.T
    np.fill_diagonal(similarities, -np.inf)
    rank = min(max(1, neighbor_rank), len(coordinates) - 1)
    distances = []
    for row in similarities:
        nearest = np.sort(row)[::-1][rank - 1]
        distances.append(max(1e-4, 1.0 - float(nearest)))
    return float(np.clip(np.median(distances) * 0.8, 0.006, 0.25))
