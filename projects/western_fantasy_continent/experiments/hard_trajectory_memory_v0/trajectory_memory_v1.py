from __future__ import annotations

import numpy as np

from trajectory_memory import HardTrajectoryMemory, unit


class RobustTrajectoryMemory(HardTrajectoryMemory):
    """V1 adds label-free uncertainty gating without changing retrieval."""

    def query(
        self,
        previous,
        current,
        *,
        confidence_threshold: float = 0.02,
        uncertainty_cluster_threshold: float = 0.68,
        uncertainty_direction_weight: float = 0.5,
        **kwargs,
    ) -> dict:
        result = super().query(previous, current, **kwargs)
        if result["abstained"]:
            result.update({"rawConfidence": 0.0, "uncertaintyDominance": 0.0,
                           "uncertaintyClusterCount": 0})
            return result

        selected = result["selected"]
        indices = [row["matrixRow"] for row in selected]
        weights = np.array([row["weight"] for row in selected], dtype=float)
        weights /= weights.sum()
        future_vectors = self.output_delta_matrix[indices] + np.stack([
            self.vectors[self.segments[index].current_text] for index in indices
        ])
        future_vectors = np.stack([unit(row) for row in future_vectors])
        signatures = np.concatenate([
            np.sqrt(1.0 - uncertainty_direction_weight) * future_vectors,
            np.sqrt(uncertainty_direction_weight) * self.output_direction_matrix[indices],
        ], axis=1)
        similarity = signatures @ signatures.T
        remaining = set(range(len(indices)))
        cluster_masses = []
        while remaining:
            frontier = [remaining.pop()]
            cluster = []
            while frontier:
                index = frontier.pop()
                cluster.append(index)
                linked = [candidate for candidate in remaining
                          if similarity[index, candidate] >= uncertainty_cluster_threshold]
                for candidate in linked:
                    remaining.remove(candidate)
                    frontier.append(candidate)
            cluster_masses.append(float(np.sum(weights[cluster])))

        dominance = max(cluster_masses)
        raw_confidence = result["confidence"]
        result["rawConfidence"] = raw_confidence
        result["uncertaintyDominance"] = dominance
        result["uncertaintyClusterCount"] = len(cluster_masses)
        result["confidence"] = raw_confidence * dominance
        if result["confidence"] < confidence_threshold:
            result["abstained"] = True
            result["prediction"] = None
        return result

