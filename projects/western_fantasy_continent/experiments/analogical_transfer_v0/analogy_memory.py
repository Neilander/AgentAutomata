from __future__ import annotations

from dataclasses import dataclass

import numpy as np


MODES = ("raw_current", "raw_transition", "normalized_current", "normalized_transition")


def representation_text(row: dict, mode: str) -> str:
    if mode == "raw_current":
        return row["currentRaw"]
    if mode == "raw_transition":
        return f"状态变化。之前：{row['beforeRaw']} 现在：{row['currentRaw']}"
    if mode == "normalized_current":
        return row["currentNorm"]
    if mode == "normalized_transition":
        return f"角色保持对应。之前：{row['beforeNorm']} 现在：{row['currentNorm']}"
    raise ValueError(f"unknown mode: {mode}")


def safe_render(template: str, bindings: dict[str, str]) -> str:
    class Bindings(dict):
        def __missing__(self, key):
            return f"<未绑定:{key}>"
    return template.format_map(Bindings(bindings))


@dataclass(frozen=True)
class Retrieval:
    abstained: bool
    score: float
    source_id: str | None
    predicted_text: str | None
    predicted_effects: list[dict]
    top_sources: list[dict]


class AnalogyMemory:
    """One matrix row per remembered source trajectory."""

    def __init__(self, sources: list[dict], mode: str, vectors: dict[str, np.ndarray]) -> None:
        if mode not in MODES:
            raise ValueError(mode)
        self.sources = sources
        self.mode = mode
        self.vectors = vectors
        self.matrix = np.stack([vectors[representation_text(row, mode)] for row in sources])

    def query(self, target: dict, *, threshold: float) -> Retrieval:
        query_vector = self.vectors[representation_text(target, self.mode)]
        scores = self.matrix @ query_vector
        order = np.argsort(scores)[::-1]
        top_sources = [{"sourceId": self.sources[index]["id"], "score": float(scores[index])}
                       for index in order[:3]]
        best_index = int(order[0])
        best_score = float(scores[best_index])
        if best_score < threshold:
            return Retrieval(True, best_score, None, None, [], top_sources)
        remembered = self.sources[best_index]
        effects = [{"entity": target["bindings"].get(effect["slot"], f"<未绑定:{effect['slot']}>") ,
                    "change": effect["change"]} for effect in remembered["effects"]]
        return Retrieval(
            False,
            best_score,
            remembered["id"],
            safe_render(remembered["nextTemplate"], target["bindings"]),
            effects,
            top_sources,
        )


def collect_representation_texts(sources: list[dict], cases: list[dict]) -> list[str]:
    return sorted({representation_text(row, mode) for row in sources + cases for mode in MODES})

