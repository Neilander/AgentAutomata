from __future__ import annotations

import copy
import heapq
import math
from dataclasses import asdict, dataclass, field
from typing import Any, Callable, Iterable

from five_slot_memory import FiveSlotCoordinate


OUTCOME_KINDS = {"automatic", "choice", "random", "unknown", "complete"}
BOUNDARY_KINDS = {"choice", "random", "unknown", "attention_stop", "loop_guard"}


def _unit_interval(name: str, value: float) -> float:
    value = float(value)
    if not math.isfinite(value) or not 0 <= value <= 1:
        raise ValueError(f"{name} must be between 0 and 1")
    return value


def _clean(text: str) -> str:
    return "".join(str(text).strip().lower().split())


@dataclass(frozen=True)
class GoalSpec:
    """Temporary planning-facing representation; later goal models may replace it."""

    goal_id: str
    object_concept: str
    state_concept: str
    desired_direction: int
    urgency: float
    horizon: str = "current_imagination"

    def __post_init__(self) -> None:
        if not self.goal_id.strip() or not self.object_concept.strip() or not self.state_concept.strip():
            raise ValueError("goal identity and concepts must not be empty")
        if self.desired_direction not in {-1, 0, 1}:
            raise ValueError("desired_direction must be -1, 0, or 1")
        _unit_interval("urgency", self.urgency)
        if not self.horizon.strip():
            raise ValueError("goal horizon must not be empty")


@dataclass(frozen=True)
class PredictedChange:
    object_concept: str
    state_concept: str
    direction: int
    description: str

    def __post_init__(self) -> None:
        if not self.object_concept.strip() or not self.state_concept.strip() or not self.description.strip():
            raise ValueError("predicted change fields must not be empty")
        if self.direction not in {-1, 0, 1}:
            raise ValueError("change direction must be -1, 0, or 1")


@dataclass(frozen=True)
class AttentionPoint:
    point_id: str
    description: str
    base_cost: float = 1.0
    predicted_change: PredictedChange | None = None

    def __post_init__(self) -> None:
        if not self.point_id.strip() or not self.description.strip():
            raise ValueError("attention point identity and description must not be empty")
        if not math.isfinite(self.base_cost) or self.base_cost <= 0:
            raise ValueError("attention point base_cost must be finite and positive")


@dataclass(frozen=True)
class ImaginedEvent:
    event_id: str
    coordinate: FiveSlotCoordinate
    public_facts: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        if not self.event_id.strip():
            raise ValueError("event_id must not be empty")


@dataclass(frozen=True)
class GlueOutcome:
    """One recalled and verified consequence of an event.

    Several outcomes returned for one event are parallel consequences, not choices.
    A choice is represented explicitly by kind='choice'.
    """

    outcome_id: str
    kind: str
    attention_points: tuple[AttentionPoint, ...]
    next_events: tuple[ImaginedEvent, ...] = ()
    alternatives: tuple[str, ...] = ()
    random_summary: str | None = None
    missing_knowledge: str | None = None
    completion_reason: str | None = None
    activation: float = 1.0
    salience: float = 0.0
    familiarity: float = 0.0
    source_memory_ids: tuple[str, ...] = ()

    def __post_init__(self) -> None:
        if not self.outcome_id.strip() or self.kind not in OUTCOME_KINDS:
            raise ValueError("outcome identity/kind is invalid")
        if not self.attention_points:
            raise ValueError("every imagined outcome needs at least one attention point")
        point_ids = [point.point_id for point in self.attention_points]
        if len(point_ids) != len(set(point_ids)):
            raise ValueError("attention point ids must be unique inside an outcome")
        _unit_interval("activation", self.activation)
        _unit_interval("salience", self.salience)
        _unit_interval("familiarity", self.familiarity)

        if self.kind == "automatic" and not self.next_events:
            raise ValueError("automatic outcome needs at least one next event")
        if self.kind != "automatic" and self.next_events:
            raise ValueError("only automatic outcomes may emit next events")
        if self.kind == "choice" and len(self.alternatives) < 2:
            raise ValueError("choice outcome needs at least two alternatives")
        if self.kind != "choice" and self.alternatives:
            raise ValueError("only choice outcomes may contain alternatives")
        if self.kind == "random" and not (self.random_summary or "").strip():
            raise ValueError("random outcome needs a known range/distribution summary")
        if self.kind == "unknown" and not (self.missing_knowledge or "").strip():
            raise ValueError("unknown outcome must say what knowledge is missing")
        if self.kind == "complete" and not (self.completion_reason or "").strip():
            raise ValueError("complete outcome needs a reason")


@dataclass(frozen=True)
class GoalMatch:
    goal_id: str
    point_id: str
    relevance: float
    effect: str


@dataclass
class AttentionAccount:
    initial_budget: float
    remaining: float = field(init=False)
    spent: float = field(default=0.0, init=False)

    def __post_init__(self) -> None:
        if not math.isfinite(self.initial_budget) or self.initial_budget < 0:
            raise ValueError("attention budget must be finite and non-negative")
        self.remaining = float(self.initial_budget)

    def try_spend(self, amount: float) -> bool:
        if not math.isfinite(amount) or amount <= 0:
            raise ValueError("attention spend must be finite and positive")
        if self.remaining + 1e-12 < amount:
            return False
        self.remaining -= amount
        self.spent += amount
        return True


ConceptMatcher = Callable[[str, str], float]
OutcomeResolver = Callable[[ImaginedEvent], Iterable[GlueOutcome]]


def exact_concept_match(left: str, right: str) -> float:
    """MVP matcher. A semantic/vector matcher can be injected later."""
    return 1.0 if _clean(left) == _clean(right) else 0.0


def _direction_effect(goal: GoalSpec, change: PredictedChange) -> tuple[str, float]:
    if goal.desired_direction == 0:
        return ("opportunity", 0.5) if change.direction == 0 else ("threat", 1.0)
    if change.direction == goal.desired_direction:
        return "opportunity", 1.0
    if change.direction == -goal.desired_direction:
        return "threat", 1.0
    return "neutral", 0.35


class ImaginationContinuationController:
    """Runs recalled consequences until a structural or cognitive boundary.

    The resolver owns memory retrieval and evidence verification. This controller
    only decides continuation, parallel branching, explicit boundaries and the
    finite attention cost of inspecting internal attention points.
    """

    def __init__(
        self,
        concept_matcher: ConceptMatcher = exact_concept_match,
        familiarity_discount: float = 0.65,
        minimum_cost_multiplier: float = 0.25,
        max_processed_outcomes: int = 200,
    ) -> None:
        self.concept_matcher = concept_matcher
        self.familiarity_discount = _unit_interval("familiarity_discount", familiarity_discount)
        self.minimum_cost_multiplier = _unit_interval("minimum_cost_multiplier", minimum_cost_multiplier)
        if max_processed_outcomes <= 0:
            raise ValueError("max_processed_outcomes must be positive")
        self.max_processed_outcomes = max_processed_outcomes

    def goal_matches(self, outcome: GlueOutcome, goals: tuple[GoalSpec, ...]) -> tuple[GoalMatch, ...]:
        matches: list[GoalMatch] = []
        for point in outcome.attention_points:
            change = point.predicted_change
            if change is None:
                continue
            for goal in goals:
                object_match = _unit_interval(
                    "object concept match",
                    self.concept_matcher(goal.object_concept, change.object_concept),
                )
                state_match = _unit_interval(
                    "state concept match",
                    self.concept_matcher(goal.state_concept, change.state_concept),
                )
                effect, direction_weight = _direction_effect(goal, change)
                relevance = object_match * state_match * direction_weight * goal.urgency
                if relevance > 0:
                    matches.append(GoalMatch(goal.goal_id, point.point_id, relevance, effect))
        return tuple(sorted(matches, key=lambda row: (-row.relevance, row.goal_id, row.point_id)))

    def priority(self, outcome: GlueOutcome, goals: tuple[GoalSpec, ...]) -> tuple[float, tuple[GoalMatch, ...]]:
        matches = self.goal_matches(outcome, goals)
        goal_relevance = max((row.relevance for row in matches), default=0.0)
        # These are ordering terms, not calibrated psychological parameters.
        return outcome.activation + outcome.salience + goal_relevance, matches

    def point_cost(self, point: AttentionPoint, familiarity: float) -> float:
        multiplier = max(
            self.minimum_cost_multiplier,
            1.0 - self.familiarity_discount * familiarity,
        )
        return point.base_cost * multiplier

    def run(
        self,
        initial_events: Iterable[ImaginedEvent],
        resolver: OutcomeResolver,
        attention: AttentionAccount,
        goals: Iterable[GoalSpec] = (),
    ) -> dict[str, Any]:
        goal_rows = tuple(goals)
        queue: list[tuple[float, int, int, ImaginedEvent]] = []
        sequence = 0
        for event in initial_events:
            heapq.heappush(queue, (-1.0, sequence, 0, event))
            sequence += 1

        trace: list[dict[str, Any]] = []
        boundaries: list[dict[str, Any]] = []
        completions: list[dict[str, Any]] = []
        consumed: set[tuple[str, str]] = set()
        processed = 0

        while queue:
            if processed >= self.max_processed_outcomes:
                boundaries.append(
                    {
                        "kind": "loop_guard",
                        "reason": "technical safety limit reached before the imagined chain ended",
                        "pendingEventIds": [row[3].event_id for row in queue],
                    }
                )
                break

            _, _, depth, event = heapq.heappop(queue)
            outcomes = tuple(resolver(event))
            if not outcomes:
                boundaries.append(
                    {
                        "eventId": event.event_id,
                        "kind": "unknown",
                        "reason": "no recalled outcome explicitly classified this branch",
                        "missingKnowledge": "需要确认当前状态究竟没有后续，还是缺少相关规则记忆",
                        "depth": depth,
                    }
                )
                continue

            ranked = []
            for outcome in outcomes:
                score, matches = self.priority(outcome, goal_rows)
                ranked.append((score, outcome.outcome_id, outcome, matches))
            ranked.sort(key=lambda row: (-row[0], row[1]))

            for score, _, outcome, matches in ranked:
                key = (event.event_id, outcome.outcome_id)
                if key in consumed:
                    boundaries.append(
                        {
                            "kind": "loop_guard",
                            "eventId": event.event_id,
                            "outcomeId": outcome.outcome_id,
                            "reason": "the same event/outcome pair was already imagined",
                        }
                    )
                    continue
                consumed.add(key)
                processed += 1

                inspected: list[dict[str, Any]] = []
                missed: list[dict[str, Any]] = []
                for index, point in enumerate(outcome.attention_points):
                    cost = self.point_cost(point, outcome.familiarity)
                    if attention.try_spend(cost):
                        inspected.append(
                            {
                                "pointId": point.point_id,
                                "description": point.description,
                                "cost": cost,
                            }
                        )
                        continue
                    missed = [
                        {
                            "pointId": pending.point_id,
                            "description": pending.description,
                            "requiredCost": self.point_cost(pending, outcome.familiarity),
                        }
                        for pending in outcome.attention_points[index:]
                    ]
                    break

                trace_row = {
                    "eventId": event.event_id,
                    "outcomeId": outcome.outcome_id,
                    "kind": outcome.kind,
                    "depth": depth,
                    "priority": score,
                    "activation": outcome.activation,
                    "salience": outcome.salience,
                    "familiarity": outcome.familiarity,
                    "goalMatches": [asdict(row) for row in matches],
                    "inspectedAttentionPoints": inspected,
                    "missedAttentionPoints": missed,
                    "remainingAttention": attention.remaining,
                }

                if missed:
                    trace_row["result"] = "attention_stop"
                    boundaries.append(
                        {
                            "kind": "attention_stop",
                            "eventId": event.event_id,
                            "outcomeId": outcome.outcome_id,
                            "reason": "remaining attention could not inspect every required internal point",
                            "inspectedPointIds": [row["pointId"] for row in inspected],
                            "missedPointIds": [row["pointId"] for row in missed],
                            "remainingAttention": attention.remaining,
                        }
                    )
                    trace.append(trace_row)
                    continue

                if outcome.kind == "automatic":
                    trace_row["result"] = "continue"
                    trace_row["nextEventIds"] = [row.event_id for row in outcome.next_events]
                    for next_event in outcome.next_events:
                        heapq.heappush(queue, (-score, sequence, depth + 1, next_event))
                        sequence += 1
                elif outcome.kind == "complete":
                    trace_row["result"] = "complete"
                    completions.append(
                        {
                            "eventId": event.event_id,
                            "outcomeId": outcome.outcome_id,
                            "kind": "complete",
                            "reason": outcome.completion_reason,
                            "depth": depth,
                        }
                    )
                else:
                    trace_row["result"] = outcome.kind
                    detail = {
                        "choice": {"alternatives": list(outcome.alternatives)},
                        "random": {"randomSummary": outcome.random_summary},
                        "unknown": {"missingKnowledge": outcome.missing_knowledge},
                    }[outcome.kind]
                    boundaries.append(
                        {
                            "kind": outcome.kind,
                            "eventId": event.event_id,
                            "outcomeId": outcome.outcome_id,
                            "reason": {
                                "choice": "automatic imagination reached a player decision",
                                "random": "exact continuation depends on an unresolved random result",
                                "unknown": "the player lacks a rule needed for the next transition",
                            }[outcome.kind],
                            **detail,
                        }
                    )
                trace.append(trace_row)

        kinds = sorted({row["kind"] for row in boundaries})
        return {
            "schema": "imagination_continuation_result_v0",
            "goals": [asdict(row) for row in goal_rows],
            "attention": {
                "initial": attention.initial_budget,
                "spent": attention.spent,
                "remaining": attention.remaining,
            },
            "processedOutcomes": processed,
            "trace": trace,
            "boundaries": boundaries,
            "boundaryKinds": kinds,
            "completions": completions,
        }
