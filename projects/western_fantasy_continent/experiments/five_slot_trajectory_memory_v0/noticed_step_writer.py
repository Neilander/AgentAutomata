from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory


def _required(label: str, value: str) -> str:
    normalized = " ".join(str(value).split())
    if not normalized:
        raise ValueError(f"{label} must not be empty")
    return normalized


@dataclass(frozen=True)
class FullyNoticedStep:
    """One transition the simulated player is assumed to have noticed completely.

    This is deliberately downstream from attention.  It neither discovers an event nor
    guesses a missing participant; it only turns an already explicit transition into q.
    """

    actor: str
    action: str
    affected_object: str
    before_state: str
    after_state: str
    temporal_state: str
    context: str

    def __post_init__(self) -> None:
        for field in (
            "actor",
            "action",
            "affected_object",
            "before_state",
            "after_state",
            "temporal_state",
            "context",
        ):
            object.__setattr__(self, field, _required(field, getattr(self, field)))

    def to_coordinate(self) -> FiveSlotCoordinate:
        return FiveSlotCoordinate(
            affected_object=self.affected_object,
            change_trend=f"{self.before_state} → {self.after_state}",
            cause_relation=(
                f"{self.actor}通过“{self.action}”作用于{self.affected_object}，"
                "使其发生上述变化"
            ),
            temporal_state=self.temporal_state,
            context=self.context,
        )


class FullyNoticedTrajectoryWriter:
    """Mechanical adapter from fully noticed steps to the five-slot memory."""

    @staticmethod
    def abstract(steps: list[FullyNoticedStep]) -> list[FiveSlotCoordinate]:
        if len(steps) < 2:
            raise ValueError("a remembered episode needs at least two noticed steps")
        return [step.to_coordinate() for step in steps]

    @classmethod
    def remember(
        cls,
        memory: FiveSlotTrajectoryMemory,
        steps: list[FullyNoticedStep],
        *,
        strength: float = 1.0,
        metadata: dict[str, Any] | None = None,
    ) -> list[str]:
        return memory.remember_trajectory(
            cls.abstract(steps),
            strength=strength,
            metadata={"inputAssumption": "every_step_fully_noticed", **(metadata or {})},
        )
