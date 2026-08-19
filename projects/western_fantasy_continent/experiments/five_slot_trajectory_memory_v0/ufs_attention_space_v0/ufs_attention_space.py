from __future__ import annotations

import copy
import math
import uuid
from dataclasses import asdict, dataclass, field
from typing import Any, Iterable


FORBIDDEN_PUBLIC_KEYS = {
    "seed",
    "rngstate",
    "history",
    "futuredice",
    "future_rolls",
    "expectedresult",
    "bestaction",
    "hiddenstate",
}

ALLOWED_SELECTOR_KEYS = {"item_ids", "kinds", "tags", "relation"}
ALLOWED_RELATIONS = {
    "same_column_as_focus",
    "same_room_as_focus",
    "ship_path_below_focus",
    "all_unplaced_dice",
    "all_public_tracks",
}


@dataclass(frozen=True)
class AttentionContext:
    phase: str
    action: str
    goal: str | None = None
    tags: tuple[str, ...] = ()
    focus: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class AttentionScope:
    phase: str | None = None
    action: str | None = None
    goal: str | None = None
    required_tags: tuple[str, ...] = ()

    def matches(self, context: AttentionContext) -> bool:
        return (
            (self.phase is None or self.phase == context.phase)
            and (self.action is None or self.action == context.action)
            and (self.goal is None or self.goal == context.goal)
            and set(self.required_tags).issubset(context.tags)
        )


@dataclass(frozen=True)
class AttentionAdjustment:
    adjustment_id: str
    operation: str
    selector: dict[str, Any]
    amount: float
    scope: AttentionScope
    reason: str
    created_by: str = "ai_review"


@dataclass(frozen=True)
class AttentionItem:
    item_id: str
    kind: str
    value: Any
    tags: tuple[str, ...] = ()
    relations: tuple[str, ...] = ()


@dataclass(frozen=True)
class AttentionContribution:
    source: str
    amount: float
    reason: str


@dataclass(frozen=True)
class ActivatedItem:
    item: AttentionItem
    activation: float
    contributions: tuple[AttentionContribution, ...]


@dataclass(frozen=True)
class NoticedItem:
    item_id: str
    kind: str
    value: Any
    activation: float
    clarity: str
    tags: tuple[str, ...]


@dataclass(frozen=True)
class AttentionAllocation:
    attention_level: float
    capacity: int
    noticed: tuple[NoticedItem, ...]
    omitted_count: int


def _walk_keys(value: Any) -> Iterable[str]:
    if isinstance(value, dict):
        for key, child in value.items():
            yield str(key)
            yield from _walk_keys(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk_keys(child)


def _validate_public_input(public_input: dict[str, Any]) -> None:
    if not isinstance(public_input, dict):
        raise TypeError("public_input must be a dictionary")
    if "observation" not in public_input or "publicMap" not in public_input:
        raise ValueError("public_input must contain observation and publicMap")
    leaked = sorted({key for key in _walk_keys(public_input) if key.lower() in FORBIDDEN_PUBLIC_KEYS})
    if leaked:
        raise ValueError(f"public_input contains hidden or answer-like keys: {leaked}")


def _tags(*values: str | None) -> tuple[str, ...]:
    return tuple(value for value in values if value)


class UfsAttentionSpace:
    """Turns one safe UFS public snapshot into addressable public attention items.

    This class does not choose an action and does not predict an outcome.  It only
    exposes public state pieces and stable relations that attention can operate on.
    """

    def __init__(self, public_input: dict[str, Any]):
        _validate_public_input(public_input)
        self._public_input = copy.deepcopy(public_input)
        self._items = self._build_items(self._public_input)
        self._by_id = {item.item_id: item for item in self._items}
        if len(self._by_id) != len(self._items):
            raise ValueError("attention item ids must be unique")

    @property
    def items(self) -> tuple[AttentionItem, ...]:
        return self._items

    def get(self, item_id: str) -> AttentionItem:
        return self._by_id[item_id]

    @staticmethod
    def _build_items(public_input: dict[str, Any]) -> tuple[AttentionItem, ...]:
        observation = public_input["observation"]
        public_map = public_input["publicMap"]
        items: list[AttentionItem] = []

        for key in ("round", "phase", "energy", "damage", "researchIndex", "excavatorIndex", "mothershipRow", "outcome"):
            kind = {
                "researchIndex": "research",
                "excavatorIndex": "excavator",
                "mothershipRow": "mothership",
            }.get(key, key)
            items.append(AttentionItem(f"track:{key}", kind, copy.deepcopy(observation.get(key)), _tags("public_track")))

        for die in observation.get("dice", []):
            state = "placed" if die.get("placed") else "unplaced"
            items.append(
                AttentionItem(
                    f"die:{die['id']}",
                    "die",
                    copy.deepcopy(die),
                    _tags(state, f"die_color:{die.get('color')}", f"die_value:{die.get('value')}"),
                    _tags("all_unplaced_dice" if state == "unplaced" else None),
                )
            )

        for ship in observation.get("ships", []):
            column = ship.get("column")
            row = ship.get("row")
            items.append(
                AttentionItem(
                    f"ship:{ship['id']}",
                    "ship",
                    copy.deepcopy(ship),
                    _tags(f"column:{column}", f"row:{row}", f"ship_color:{ship.get('color')}"),
                    _tags(f"column:{column}", f"sky_cell:{row}:{column}"),
                )
            )

        for ship in observation.get("waitingShips", []):
            items.append(AttentionItem(f"waiting_ship:{ship['id']}", "waiting_ship", copy.deepcopy(ship), _tags("waiting")))

        for placement in observation.get("placements", []):
            items.append(
                AttentionItem(
                    f"placement:{placement['id']}",
                    "placement",
                    copy.deepcopy(placement),
                    _tags(f"cell:{placement.get('cellId')}", f"room:{placement.get('roomId')}"),
                )
            )

        for robot in observation.get("robots", []):
            items.append(
                AttentionItem(
                    f"robot:{robot['id']}",
                    "robot",
                    copy.deepcopy(robot),
                    _tags(f"cell:{robot.get('cellId')}", f"room:{robot.get('roomId')}"),
                )
            )

        rooms_by_id = {room["id"]: room for room in public_map.get("base", {}).get("rooms", [])}
        for room in rooms_by_id.values():
            items.append(
                AttentionItem(
                    f"room:{room['id']}",
                    "room",
                    copy.deepcopy(room),
                    _tags(f"room:{room['id']}", f"room_type:{room.get('type')}"),
                    tuple(f"base_cell:{cell_id}" for cell_id in room.get("cellIds", [])),
                )
            )

        for cell in public_map.get("base", {}).get("cells", []):
            column = cell.get("column")
            room_id = cell.get("roomId")
            items.append(
                AttentionItem(
                    f"base_cell:{cell['id']}",
                    "base_cell",
                    copy.deepcopy(cell),
                    _tags(f"column:{column}", f"room:{room_id}", f"tile:{cell.get('tile')}"),
                    _tags(f"column:{column}", f"room:{room_id}"),
                )
            )

        for sky_row in public_map.get("sky", {}).get("rows", []):
            row = sky_row["index"]
            for column, cell in enumerate(sky_row.get("cells", [])):
                cell_value = copy.deepcopy(cell)
                effect = cell_value.get("effect") if isinstance(cell_value, dict) else None
                has_explosion = isinstance(cell_value, dict) and cell_value.get("explosion") is not None
                items.append(
                    AttentionItem(
                        f"sky_cell:{row}:{column}",
                        "sky_cell",
                        {"row": row, "column": column, **(cell_value if isinstance(cell_value, dict) else {})},
                        _tags(
                            f"column:{column}",
                            f"row:{row}",
                            f"effect:{effect}" if effect else None,
                            "explosion" if has_explosion else None,
                        ),
                        _tags(f"column:{column}"),
                    )
                )

        return tuple(items)


class UfsAttentionProfile:
    """Mutable, auditable attention presets and AI review adjustments."""

    def __init__(self):
        self._initial_presets: dict[str, AttentionAdjustment] = {}
        self._adjustments: dict[str, AttentionAdjustment] = {}

    @property
    def initial_presets(self) -> tuple[AttentionAdjustment, ...]:
        return tuple(self._initial_presets.values())

    @property
    def adjustments(self) -> tuple[AttentionAdjustment, ...]:
        return tuple(self._adjustments.values())

    def define_initial_attention(
        self,
        selector: dict[str, Any],
        amount: float,
        scope: AttentionScope,
        reason: str,
    ) -> str:
        """Install one rule-reading preset without embedding a gameplay answer."""
        return self._add(
            "preset",
            selector,
            amount,
            scope,
            reason,
            destination=self._initial_presets,
            created_by="rule_reader",
        )

    def increase_attention(
        self,
        selector: dict[str, Any],
        amount: float,
        scope: AttentionScope,
        reason: str,
    ) -> str:
        return self._add("increase", selector, amount, scope, reason)

    def decrease_attention(
        self,
        selector: dict[str, Any],
        amount: float,
        scope: AttentionScope,
        reason: str,
    ) -> str:
        return self._add("decrease", selector, amount, scope, reason)

    def expand_attention(
        self,
        relation: str,
        amount: float,
        scope: AttentionScope,
        reason: str,
    ) -> str:
        if relation not in ALLOWED_RELATIONS:
            raise ValueError(f"unknown public relation: {relation}")
        return self._add("expand", {"relation": relation}, amount, scope, reason)

    def remove_adjustment(self, adjustment_id: str) -> AttentionAdjustment:
        try:
            return self._adjustments.pop(adjustment_id)
        except KeyError as exc:
            raise KeyError(f"unknown adjustment: {adjustment_id}") from exc

    def remove_initial_attention(self, preset_id: str) -> AttentionAdjustment:
        try:
            return self._initial_presets.pop(preset_id)
        except KeyError as exc:
            raise KeyError(f"unknown initial preset: {preset_id}") from exc

    def inspect_adjustments(self) -> list[dict[str, Any]]:
        return [asdict(row) for row in self.adjustments]

    def inspect_initial_presets(self) -> list[dict[str, Any]]:
        return [asdict(row) for row in self.initial_presets]

    def _add(
        self,
        operation: str,
        selector: dict[str, Any],
        amount: float,
        scope: AttentionScope,
        reason: str,
        destination: dict[str, AttentionAdjustment] | None = None,
        created_by: str = "ai_review",
    ) -> str:
        _validate_selector(selector)
        if not math.isfinite(amount) or not 0 < amount <= 1:
            raise ValueError("amount must be in (0, 1]")
        if not reason.strip():
            raise ValueError("AI review adjustment requires a reason")
        prefix = "preset" if operation == "preset" else "attn"
        adjustment_id = f"{prefix}-{uuid.uuid4().hex[:12]}"
        target = self._adjustments if destination is None else destination
        target[adjustment_id] = AttentionAdjustment(
            adjustment_id=adjustment_id,
            operation=operation,
            selector=copy.deepcopy(selector),
            amount=amount,
            scope=scope,
            reason=reason.strip(),
            created_by=created_by,
        )
        return adjustment_id


def _validate_selector(selector: dict[str, Any]) -> None:
    if not isinstance(selector, dict) or not selector:
        raise ValueError("selector must be a non-empty dictionary")
    unknown = set(selector) - ALLOWED_SELECTOR_KEYS
    if unknown:
        raise ValueError(f"selector contains unsupported fields: {sorted(unknown)}")
    if "relation" in selector and selector["relation"] not in ALLOWED_RELATIONS:
        raise ValueError(f"unknown public relation: {selector['relation']}")
    for collection_key in ("item_ids", "kinds", "tags"):
        if collection_key in selector and not isinstance(selector[collection_key], (list, tuple, set)):
            raise ValueError(f"selector.{collection_key} must be a collection")


class AttentionFieldBuilder:
    BACKGROUND = 0.04

    def __init__(self, space: UfsAttentionSpace, profile: UfsAttentionProfile):
        self.space = space
        self.profile = profile

    def build(self, context: AttentionContext) -> tuple[ActivatedItem, ...]:
        contributions: dict[str, list[AttentionContribution]] = {
            item.item_id: [AttentionContribution("background", self.BACKGROUND, "完整公开状态保留低激活")]
            for item in self.space.items
        }
        self._apply_base_preset(context, contributions)
        for preset in self.profile.initial_presets:
            if not preset.scope.matches(context):
                continue
            for item in self.space.items:
                if _selector_matches(preset.selector, item, context):
                    contributions[item.item_id].append(
                        AttentionContribution(preset.adjustment_id, preset.amount, preset.reason)
                    )
        for adjustment in self.profile.adjustments:
            if not adjustment.scope.matches(context):
                continue
            sign = -1.0 if adjustment.operation == "decrease" else 1.0
            for item in self.space.items:
                if _selector_matches(adjustment.selector, item, context):
                    contributions[item.item_id].append(
                        AttentionContribution(
                            adjustment.adjustment_id,
                            sign * adjustment.amount,
                            adjustment.reason,
                        )
                    )
        activated = []
        for item in self.space.items:
            item_contributions = tuple(contributions[item.item_id])
            activation = max(0.0, min(1.0, sum(row.amount for row in item_contributions)))
            activated.append(ActivatedItem(item, round(activation, 6), item_contributions))
        return tuple(sorted(activated, key=lambda row: (-row.activation, row.item.item_id)))

    def _apply_base_preset(
        self,
        context: AttentionContext,
        contributions: dict[str, list[AttentionContribution]],
    ) -> None:
        if context.action != "place_die":
            return
        focus = context.focus
        die_id = focus.get("die_id")
        cell_id = focus.get("cell_id")
        room_id = focus.get("room_id")
        column = focus.get("column")
        die_value = focus.get("die_value")

        for item in self.space.items:
            amount = 0.0
            reason = ""
            if item.item_id == f"die:{die_id}":
                amount, reason = 0.91, "放置动作直接作用的骰子"
            elif item.item_id == f"base_cell:{cell_id}":
                amount, reason = 0.91, "放置动作的目标格"
            elif item.item_id == f"room:{room_id}":
                amount, reason = 0.66, "目标格所属房间"
            elif item.kind == "ship" and f"column:{column}" in item.tags:
                amount, reason = 0.81, "目标格上方同列飞船"
            elif item.kind == "sky_cell" and f"column:{column}" in item.tags:
                item_row = item.value.get("row")
                ship_rows = [
                    other.value.get("row")
                    for other in self.space.items
                    if other.kind == "ship" and f"column:{column}" in other.tags
                ]
                in_projected_path = isinstance(die_value, int) and any(
                    isinstance(ship_row, int) and ship_row < item_row <= ship_row + die_value
                    for ship_row in ship_rows
                )
                amount = 0.58 if in_projected_path else 0.24
                reason = "同列飞船预计经过的天空格" if in_projected_path else "目标列的其他天空格"
            elif item.kind in {"damage", "mothership"}:
                amount, reason = 0.10, "放置时保留的弱背景风险"
            elif item.kind in {"energy", "research", "excavator"}:
                amount, reason = 0.06, "放置时保留的弱资源背景"
            if amount:
                contributions[item.item_id].append(AttentionContribution("base:place_die", amount, reason))


def _selector_matches(selector: dict[str, Any], item: AttentionItem, context: AttentionContext) -> bool:
    checks: list[bool] = []
    if "item_ids" in selector:
        checks.append(item.item_id in selector["item_ids"])
    if "kinds" in selector:
        checks.append(item.kind in selector["kinds"])
    if "tags" in selector:
        checks.append(set(selector["tags"]).issubset(item.tags))
    if "relation" in selector:
        checks.append(_relation_matches(selector["relation"], item, context))
    return all(checks)


def _relation_matches(relation: str, item: AttentionItem, context: AttentionContext) -> bool:
    focus = context.focus
    if relation == "same_column_as_focus":
        return f"column:{focus.get('column')}" in item.tags
    if relation == "same_room_as_focus":
        return f"room:{focus.get('room_id')}" in item.tags
    if relation == "all_unplaced_dice":
        return "unplaced" in item.tags
    if relation == "all_public_tracks":
        return "public_track" in item.tags
    if relation == "ship_path_below_focus":
        column = focus.get("column")
        die_value = focus.get("die_value")
        if item.kind != "sky_cell" or not isinstance(column, int) or not isinstance(die_value, int):
            return False
        if item.value.get("column") != column:
            return False
        ship_rows = focus.get("ship_rows", [])
        return any(ship_row < item.value.get("row", -1) <= ship_row + die_value for ship_row in ship_rows)
    return False


class AttentionBudgetAllocator:
    """Deterministic finite-capacity allocator; constants are test scaffolding."""

    def __init__(self, minimum_capacity: int = 6, maximum_capacity: int = 50):
        if minimum_capacity <= 0 or maximum_capacity < minimum_capacity:
            raise ValueError("invalid capacity range")
        self.minimum_capacity = minimum_capacity
        self.maximum_capacity = maximum_capacity

    def allocate(
        self,
        field: tuple[ActivatedItem, ...],
        attention_level: float,
    ) -> AttentionAllocation:
        if not math.isfinite(attention_level) or not 0 <= attention_level <= 1:
            raise ValueError("attention_level must be between 0 and 1")
        capacity = round(
            self.minimum_capacity
            + attention_level * (self.maximum_capacity - self.minimum_capacity)
        )
        selected = field[: min(capacity, len(field))]
        noticed = tuple(
            NoticedItem(
                item_id=row.item.item_id,
                kind=row.item.kind,
                value=copy.deepcopy(row.item.value),
                activation=row.activation,
                clarity=_clarity(row.activation),
                tags=row.item.tags,
            )
            for row in selected
        )
        return AttentionAllocation(
            attention_level=attention_level,
            capacity=capacity,
            noticed=noticed,
            omitted_count=max(0, len(field) - len(noticed)),
        )


def _clarity(activation: float) -> str:
    if activation >= 0.8:
        return "precise"
    if activation >= 0.4:
        return "clear"
    return "gist"


class UfsAttentionModule:
    """Reusable facade: public state -> attention field -> noticed public facts."""

    def __init__(self, public_input: dict[str, Any], profile: UfsAttentionProfile | None = None):
        self.space = UfsAttentionSpace(public_input)
        self.profile = profile or UfsAttentionProfile()
        self.field_builder = AttentionFieldBuilder(self.space, self.profile)
        self.allocator = AttentionBudgetAllocator()

    def inspect_attention(self, context: AttentionContext) -> list[dict[str, Any]]:
        return [
            {
                "itemId": row.item.item_id,
                "kind": row.item.kind,
                "activation": row.activation,
                "value": copy.deepcopy(row.item.value),
                "contributions": [asdict(value) for value in row.contributions],
            }
            for row in self.field_builder.build(context)
        ]

    def notice(self, context: AttentionContext, attention_level: float) -> AttentionAllocation:
        return self.allocator.allocate(self.field_builder.build(context), attention_level)
