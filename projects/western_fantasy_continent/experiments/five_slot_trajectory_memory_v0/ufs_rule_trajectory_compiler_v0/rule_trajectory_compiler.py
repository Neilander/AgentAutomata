from __future__ import annotations

import copy
import math
import re
from dataclasses import asdict, dataclass, field
from typing import Any

import numpy as np

from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory, SLOT_NAMES


EDGE_STATES = {"ready", "unresolved"}
RELATION_OPERATIONS = {"add", "subtract", "identity"}


def _normalized(text: str) -> str:
    return " ".join(str(text).split())


@dataclass(frozen=True)
class NumericRelation:
    """A small serializable relation, not arbitrary executable code."""

    output: str
    operation: str
    inputs: tuple[str, ...]
    description: str

    def __post_init__(self) -> None:
        if self.operation not in RELATION_OPERATIONS:
            raise ValueError(f"unsupported numeric relation: {self.operation}")
        expected = 2 if self.operation in {"add", "subtract"} else 1
        if len(self.inputs) != expected:
            raise ValueError(f"{self.operation} needs {expected} inputs")
        if not self.output.strip() or not self.description.strip() or any(not row.strip() for row in self.inputs):
            raise ValueError("numeric relation fields must not be empty")

    def bind(self, values: dict[str, float]) -> float:
        missing = [name for name in self.inputs if name not in values]
        if missing:
            raise KeyError(f"missing relation inputs: {missing}")
        rows = [float(values[name]) for name in self.inputs]
        if not all(math.isfinite(value) for value in rows):
            raise ValueError("relation inputs must be finite")
        if self.operation == "add":
            return rows[0] + rows[1]
        if self.operation == "subtract":
            return rows[0] - rows[1]
        return rows[0]

    @classmethod
    def from_dict(cls, row: dict[str, Any]) -> "NumericRelation":
        return cls(
            output=row["output"],
            operation=row["operation"],
            inputs=tuple(row["inputs"]),
            description=row["description"],
        )


@dataclass(frozen=True)
class RuleTrajectoryDraft:
    edge_id: str
    source_rule_id: str
    source_text: str
    current: FiveSlotCoordinate
    following: FiveSlotCoordinate | None
    state: str
    source_grounding: dict[str, tuple[str, ...]]
    variable_relations: tuple[NumericRelation, ...] = ()
    unresolved_need: str | None = None
    initial_strength: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)

    def validate(self) -> None:
        if self.state not in EDGE_STATES:
            raise ValueError(f"unknown edge state: {self.state}")
        if not self.edge_id.strip() or not self.source_rule_id.strip() or not self.source_text.strip():
            raise ValueError("edge id and source rule must not be empty")
        if not math.isfinite(self.initial_strength) or self.initial_strength <= 0:
            raise ValueError("initial strength must be finite and positive")
        if self.state == "ready" and self.following is None:
            raise ValueError("ready edge requires a following q")
        if self.state == "unresolved" and self.following is not None:
            raise ValueError("unresolved edge must not invent a following q")
        if self.state == "unresolved" and not (self.unresolved_need or "").strip():
            raise ValueError("unresolved edge must say what information is missing")

        required_refs = [f"current.{name}" for name in SLOT_NAMES]
        if self.following is not None:
            required_refs.extend(f"following.{name}" for name in SLOT_NAMES)
        missing_refs = [ref for ref in required_refs if not self.source_grounding.get(ref)]
        if missing_refs:
            raise ValueError(f"missing source grounding for: {missing_refs}")
        normalized_source = _normalized(self.source_text)
        for ref, quotes in self.source_grounding.items():
            if ref not in required_refs:
                raise ValueError(f"grounding refers to unknown slot: {ref}")
            for quote in quotes:
                if not quote.strip() or _normalized(quote) not in normalized_source:
                    raise ValueError(f"grounding quote is not in source rule: {quote!r}")

        # Concrete Arabic numerals in the draft must be present in the source.
        # Variables such as N are carried by NumericRelation instead.
        source_numbers = set(re.findall(r"\d+(?:\.\d+)?", self.source_text))
        coordinate_text = " ".join(self.current.slot_texts())
        if self.following is not None:
            coordinate_text += " " + " ".join(self.following.slot_texts())
        unsupported = set(re.findall(r"\d+(?:\.\d+)?", coordinate_text)) - source_numbers
        if unsupported:
            raise ValueError(f"draft invented concrete numbers not present in source: {sorted(unsupported)}")

    def to_memory(self, memory: FiveSlotTrajectoryMemory) -> str | None:
        self.validate()
        if self.following is None:
            return None
        return memory.remember(
            self.current,
            self.following,
            strength=self.initial_strength,
            record_id=self.edge_id,
            metadata={
                "sourceRuleId": self.source_rule_id,
                "sourceText": self.source_text,
                "variableRelations": [asdict(row) for row in self.variable_relations],
                "origin": "tutorial_rule",
                **copy.deepcopy(self.metadata),
            },
        )

    @classmethod
    def from_dict(cls, source_catalog: dict[str, str], row: dict[str, Any]) -> "RuleTrajectoryDraft":
        source_rule_id = row["sourceRuleId"]
        if source_rule_id not in source_catalog:
            raise KeyError(f"unknown source rule: {source_rule_id}")
        raw_grounding = row["sourceGrounding"]
        if set(raw_grounding) == {"all"}:
            refs = [f"current.{name}" for name in SLOT_NAMES]
            if row.get("following") is not None:
                refs.extend(f"following.{name}" for name in SLOT_NAMES)
            grounding = {ref: tuple(raw_grounding["all"]) for ref in refs}
        else:
            grounding = {key: tuple(value) for key, value in raw_grounding.items()}
        draft = cls(
            edge_id=row["edgeId"],
            source_rule_id=source_rule_id,
            source_text=source_catalog[source_rule_id],
            current=FiveSlotCoordinate.from_dict(row["current"]),
            following=(
                FiveSlotCoordinate.from_dict(row["following"])
                if row.get("following") is not None
                else None
            ),
            state=row["state"],
            source_grounding=grounding,
            variable_relations=tuple(
                NumericRelation.from_dict(relation)
                for relation in row.get("variableRelations", [])
            ),
            unresolved_need=row.get("unresolvedNeed"),
            initial_strength=float(row.get("initialStrength", 1.0)),
            metadata=copy.deepcopy(row.get("metadata", {})),
        )
        draft.validate()
        return draft


class RuleTrajectoryCompiler:
    """Validates AI-produced five-slot drafts against frozen tutorial sentences."""

    def __init__(self, source_catalog: dict[str, str]):
        if not source_catalog or any(not key.strip() or not value.strip() for key, value in source_catalog.items()):
            raise ValueError("source catalog must contain non-empty frozen rules")
        self.source_catalog = copy.deepcopy(source_catalog)

    def compile_rows(self, rows: list[dict[str, Any]]) -> tuple[RuleTrajectoryDraft, ...]:
        drafts = tuple(RuleTrajectoryDraft.from_dict(self.source_catalog, row) for row in rows)
        ids = [draft.edge_id for draft in drafts]
        if len(ids) != len(set(ids)):
            raise ValueError("edge ids must be unique")
        return drafts

    @staticmethod
    def install_ready(memory: FiveSlotTrajectoryMemory, drafts: tuple[RuleTrajectoryDraft, ...]) -> list[str]:
        installed = []
        for draft in drafts:
            record_id = draft.to_memory(memory)
            if record_id is not None:
                installed.append(record_id)
        return installed


@dataclass(frozen=True)
class RuleHeadMatch:
    edge_id: str | None
    score: float
    state: str | None
    following: FiveSlotCoordinate | None
    unresolved_need: str | None
    abstained: bool


class RuleHeadIndex:
    """One matrix lookup over ready and unresolved trajectory heads."""

    def __init__(self, encoder: Any, drafts: tuple[RuleTrajectoryDraft, ...]):
        if not drafts:
            raise ValueError("head index needs at least one draft")
        self.drafts = drafts
        self._vectorizer = FiveSlotTrajectoryMemory.new(encoder)
        self._matrix = self._vectorizer.coordinate_vectors([row.current for row in drafts])

    def query(self, coordinate: FiveSlotCoordinate, threshold: float = 0.55) -> RuleHeadMatch:
        vector = self._vectorizer.coordinate_vector(coordinate)
        scores = self._matrix @ vector
        index = int(np.argmax(scores))
        score = float(scores[index])
        if score < threshold:
            return RuleHeadMatch(None, score, None, None, None, True)
        draft = self.drafts[index]
        return RuleHeadMatch(
            edge_id=draft.edge_id,
            score=score,
            state=draft.state,
            following=draft.following,
            unresolved_need=draft.unresolved_need,
            abstained=False,
        )


VERDICTS = {"supported", "contradicted", "unknown"}


@dataclass(frozen=True)
class CandidateEvidence:
    """Agent-produced slot evidence for one matrix-recalled trajectory row."""

    candidate_edge_id: str
    slot_verdicts: dict[str, str]
    evidence_quotes: dict[str, str]

    def validate(
        self,
        query: FiveSlotCoordinate,
        candidate: RuleTrajectoryDraft,
    ) -> None:
        if self.candidate_edge_id != candidate.edge_id:
            raise ValueError("evidence addresses a different candidate row")
        if set(self.slot_verdicts) != set(SLOT_NAMES):
            raise ValueError("evidence must give one verdict for every q slot")
        if set(self.evidence_quotes) != set(SLOT_NAMES):
            raise ValueError("evidence must quote every q slot")
        for name in SLOT_NAMES:
            if self.slot_verdicts[name] not in VERDICTS:
                raise ValueError(f"unknown slot verdict: {self.slot_verdicts[name]}")
            quote = _normalized(self.evidence_quotes[name])
            if not quote or quote not in _normalized(getattr(query, name)):
                raise ValueError(f"evidence quote is not present in query slot: {name}")

    @property
    def accepted(self) -> bool:
        return all(self.slot_verdicts.get(name) == "supported" for name in SLOT_NAMES)

    @classmethod
    def from_dict(cls, row: dict[str, Any]) -> "CandidateEvidence":
        return cls(
            candidate_edge_id=row["candidateEdgeId"],
            slot_verdicts=dict(row["slotVerdicts"]),
            evidence_quotes=dict(row["evidenceQuotes"]),
        )


@dataclass(frozen=True)
class NumericEstimate:
    observations: int
    center: float
    typical_low: float
    typical_high: float
    observed_low: float
    observed_high: float


class AdaptiveNumericOutcome:
    """A recency-weighted approximate number and typical range for random outcomes."""

    def __init__(self, decay: float = 0.9):
        if not 0 < decay <= 1:
            raise ValueError("decay must be in (0, 1]")
        self.decay = decay
        self._values: list[float] = []
        self._weights: list[float] = []

    def observe(self, value: float) -> None:
        value = float(value)
        if not math.isfinite(value):
            raise ValueError("random outcome must be finite")
        self._weights = [weight * self.decay for weight in self._weights]
        self._values.append(value)
        self._weights.append(1.0)

    @property
    def observations(self) -> int:
        return len(self._values)

    def estimate(self) -> NumericEstimate | None:
        if not self._values:
            return None
        total = sum(self._weights)
        center = sum(value * weight for value, weight in zip(self._values, self._weights)) / total
        return NumericEstimate(
            observations=len(self._values),
            center=center,
            typical_low=self._weighted_quantile(0.2),
            typical_high=self._weighted_quantile(0.8),
            observed_low=min(self._values),
            observed_high=max(self._values),
        )

    def _weighted_quantile(self, probability: float) -> float:
        ordered = sorted(zip(self._values, self._weights), key=lambda row: row[0])
        threshold = probability * sum(weight for _, weight in ordered)
        cumulative = 0.0
        for value, weight in ordered:
            cumulative += weight
            if cumulative >= threshold:
                return value
        return ordered[-1][0]
