from __future__ import annotations

import copy
import json
import math
from dataclasses import dataclass
from pathlib import Path
from typing import Any


SUPPORTED_PATCHES = {
    "replace_global_binding",
    "and_target_predicate",
    "replace_local_binding",
    "wrap_local_binding",
    "set_target_reducer",
}
SUPPORTED_OPERATORS = {
    "add",
    "subtract",
    "max",
    "min",
    "floor_divide",
    "eq",
    "neq",
    "and",
    "or",
    "not",
    "contains",
    "if",
}


@dataclass(frozen=True)
class ProgramPreview:
    applicable: bool
    selected_ids: tuple[str, ...]
    bindings: dict[str, Any]
    effects: tuple[dict[str, Any], ...]
    attention_reads: tuple[str, ...]
    after_state: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return {
            "applicable": self.applicable,
            "selectedIds": list(self.selected_ids),
            "bindings": copy.deepcopy(self.bindings),
            "effects": [copy.deepcopy(row) for row in self.effects],
            "attentionReads": list(self.attention_reads),
            "afterState": copy.deepcopy(self.after_state),
        }


class ReadTrace:
    def __init__(self) -> None:
        self._rows: list[str] = []
        self._seen: set[str] = set()

    def add(self, path: str, candidate_id: str | None = None) -> None:
        row = path if candidate_id is None else f"{path}[candidate={candidate_id}]"
        if row not in self._seen:
            self._seen.add(row)
            self._rows.append(row)

    @property
    def rows(self) -> tuple[str, ...]:
        return tuple(self._rows)


def _read_path(path: str, context: dict[str, Any], trace: ReadTrace) -> Any:
    parts = path.split(".")
    if not parts or parts[0] not in context:
        raise KeyError(f"path root is not available: {path}")
    value = context[parts[0]]
    for part in parts[1:]:
        if not isinstance(value, dict) or part not in value:
            raise KeyError(f"path is not available: {path}")
        value = value[part]
    candidate = context.get("candidate")
    candidate_id = candidate.get("id") if parts[0] == "candidate" and isinstance(candidate, dict) else None
    trace.add(path, candidate_id)
    return value


def _eval(expression: Any, context: dict[str, Any], trace: ReadTrace) -> Any:
    if not isinstance(expression, dict):
        raise TypeError("expressions must be dictionaries")
    if set(expression) == {"const"}:
        return copy.deepcopy(expression["const"])
    if set(expression) == {"path"}:
        return _read_path(expression["path"], context, trace)
    if set(expression) == {"var"}:
        name = expression["var"]
        if name not in context["vars"]:
            raise KeyError(f"variable is not bound: {name}")
        return context["vars"][name]

    operation = expression.get("op")
    if operation not in SUPPORTED_OPERATORS:
        raise ValueError(f"unsupported expression operator: {operation}")
    if operation == "if":
        condition = bool(_eval(expression["condition"], context, trace))
        return _eval(expression["then"] if condition else expression["else"], context, trace)

    args = [_eval(row, context, trace) for row in expression.get("args", [])]
    if operation == "add":
        return args[0] + args[1]
    if operation == "subtract":
        return args[0] - args[1]
    if operation == "max":
        return max(args)
    if operation == "min":
        return min(args)
    if operation == "floor_divide":
        if args[1] == 0:
            raise ZeroDivisionError("floor_divide denominator is zero")
        return args[0] // args[1]
    if operation == "eq":
        return args[0] == args[1]
    if operation == "neq":
        return args[0] != args[1]
    if operation == "and":
        return all(bool(row) for row in args)
    if operation == "or":
        return any(bool(row) for row in args)
    if operation == "not":
        return not bool(args[0])
    if operation == "contains":
        return args[1] in args[0]
    raise AssertionError(operation)


def _replace_previous(value: Any, previous: dict[str, Any]) -> Any:
    if isinstance(value, dict):
        if value == {"previous": True}:
            return copy.deepcopy(previous)
        return {key: _replace_previous(child, previous) for key, child in value.items()}
    if isinstance(value, list):
        return [_replace_previous(child, previous) for child in value]
    return copy.deepcopy(value)


class AdaptiveGroundingProgram:
    """Restricted declarative program for binding one recalled rule to public state."""

    def __init__(self, program: dict[str, Any], source_rules: dict[str, str]):
        self.program = copy.deepcopy(program)
        self.source_rules = copy.deepcopy(source_rules)
        self.validate()

    @classmethod
    def from_files(cls, program_path: Path, source_path: Path) -> "AdaptiveGroundingProgram":
        return cls(
            json.loads(program_path.read_text(encoding="utf-8")),
            json.loads(source_path.read_text(encoding="utf-8")),
        )

    def clone(self) -> "AdaptiveGroundingProgram":
        return AdaptiveGroundingProgram(self.program, self.source_rules)

    @property
    def version(self) -> int:
        return int(self.program["version"])

    def validate(self) -> None:
        required = {
            "schema",
            "programId",
            "version",
            "sourceRuleIds",
            "trigger",
            "globalBindings",
            "targetSource",
            "targetAlias",
            "targetPredicate",
            "localBindings",
            "effects",
            "revisionHistory",
        }
        missing = required - set(self.program)
        if missing:
            raise ValueError(f"program is missing fields: {sorted(missing)}")
        if self.program["schema"] != "adaptive_grounding_program_v0":
            raise ValueError("unsupported program schema")
        if self.version <= 0:
            raise ValueError("program version must be positive")
        unknown_sources = set(self.program["sourceRuleIds"]) - set(self.source_rules)
        if unknown_sources:
            raise ValueError(f"program refers to unknown source rules: {sorted(unknown_sources)}")
        if self.program["targetAlias"] != "candidate":
            raise ValueError("v0 interpreter requires candidate target alias")
        if not self.program["effects"]:
            raise ValueError("program must emit at least one effect")
        # Exercise expression validation without requiring runtime paths.
        for expression in self._all_expressions():
            self._validate_expression(expression)

    def _all_expressions(self):
        yield self.program["trigger"]
        yield self.program["targetSource"]
        yield self.program["targetPredicate"]
        yield from self.program["globalBindings"].values()
        yield from self.program["localBindings"].values()
        for effect in self.program["effects"]:
            yield effect["value"]
        reducer = self.program.get("targetReducer")
        if reducer is not None:
            yield reducer["when"]
            yield reducer["key"]

    def _validate_expression(self, value: Any) -> None:
        if not isinstance(value, dict):
            raise TypeError("expression nodes must be dictionaries")
        if set(value) in ({"const"}, {"path"}, {"var"}):
            return
        operation = value.get("op")
        if operation not in SUPPORTED_OPERATORS:
            raise ValueError(f"unsupported expression operator: {operation}")
        children = (
            [value["condition"], value["then"], value["else"]]
            if operation == "if"
            else value.get("args", [])
        )
        for child in children:
            self._validate_expression(child)

    def apply_revision(self, revision: dict[str, Any]) -> None:
        operation = revision.get("operation")
        if operation not in SUPPORTED_PATCHES:
            raise ValueError(f"unsupported patch operation: {operation}")
        source_id = revision.get("sourceRuleId")
        if source_id not in self.source_rules:
            raise KeyError(f"unknown patch source rule: {source_id}")
        quote = str(revision.get("sourceQuote", "")).strip()
        if not quote or quote not in self.source_rules[source_id]:
            raise ValueError("patch source quote is not present in the frozen rule")

        name = revision.get("name")
        if operation == "replace_global_binding":
            if name not in self.program["globalBindings"]:
                raise KeyError(f"global binding does not exist: {name}")
            self.program["globalBindings"][name] = copy.deepcopy(revision["expression"])
        elif operation == "and_target_predicate":
            self.program["targetPredicate"] = {
                "op": "and",
                "args": [self.program["targetPredicate"], copy.deepcopy(revision["predicate"])],
            }
        elif operation == "replace_local_binding":
            if name not in self.program["localBindings"]:
                raise KeyError(f"local binding does not exist: {name}")
            self.program["localBindings"][name] = copy.deepcopy(revision["expression"])
        elif operation == "wrap_local_binding":
            if name not in self.program["localBindings"]:
                raise KeyError(f"local binding does not exist: {name}")
            previous = self.program["localBindings"][name]
            self.program["localBindings"][name] = _replace_previous(revision["template"], previous)
        elif operation == "set_target_reducer":
            reducer = copy.deepcopy(revision["reducer"])
            if reducer.get("kind") not in {"max", "min"} or reducer.get("keepTies") is not True:
                raise ValueError("v0 target reducer supports max/min with ties kept")
            self.program["targetReducer"] = reducer

        if source_id not in self.program["sourceRuleIds"]:
            self.program["sourceRuleIds"].append(source_id)
        self.program["version"] += 1
        self.program["revisionHistory"].append(
            {
                "revisionId": revision["revisionId"],
                "sourceRuleId": source_id,
                "description": revision["description"],
                "operation": operation,
            }
        )
        self.validate()

    def preview(self, event: dict[str, Any], state: dict[str, Any]) -> ProgramPreview:
        original_state = copy.deepcopy(state)
        after_state = copy.deepcopy(state)
        trace = ReadTrace()
        context = {"event": event, "state": original_state, "candidate": None, "vars": {}}
        if not bool(_eval(self.program["trigger"], context, trace)):
            return ProgramPreview(False, (), {}, (), trace.rows, after_state)

        for name, expression in self.program["globalBindings"].items():
            value = _eval(expression, context, trace)
            if isinstance(value, float) and not math.isfinite(value):
                raise ValueError(f"binding {name} produced non-finite value")
            context["vars"][name] = value

        source = _eval(self.program["targetSource"], context, trace)
        if not isinstance(source, list):
            raise TypeError("target source must resolve to a list")
        selected_ids: list[str] = []
        effects: list[dict[str, Any]] = []
        by_id = {row["id"]: row for row in after_state["ships"]}
        global_bindings = copy.deepcopy(context["vars"])
        local_binding_rows: dict[str, dict[str, Any]] = {}

        filtered_candidates = []
        for candidate in source:
            context["candidate"] = candidate
            context["vars"] = copy.deepcopy(global_bindings)
            if not bool(_eval(self.program["targetPredicate"], context, trace)):
                continue
            filtered_candidates.append(candidate)

        reducer = self.program.get("targetReducer")
        if reducer is not None:
            context["candidate"] = None
            context["vars"] = copy.deepcopy(global_bindings)
            if bool(_eval(reducer["when"], context, trace)) and filtered_candidates:
                scored = []
                for candidate in filtered_candidates:
                    context["candidate"] = candidate
                    scored.append((_eval(reducer["key"], context, trace), candidate))
                target_value = (
                    max(row[0] for row in scored)
                    if reducer["kind"] == "max"
                    else min(row[0] for row in scored)
                )
                filtered_candidates = [candidate for value, candidate in scored if value == target_value]

        for candidate in filtered_candidates:
            context["candidate"] = candidate
            context["vars"] = copy.deepcopy(global_bindings)
            selected_ids.append(candidate["id"])
            for name, expression in self.program["localBindings"].items():
                context["vars"][name] = _eval(expression, context, trace)
            local_binding_rows[candidate["id"]] = {
                name: context["vars"][name] for name in self.program["localBindings"]
            }
            for effect in self.program["effects"]:
                if effect["target"] != "candidate" or effect["field"] not in candidate:
                    raise ValueError("effect target/field is invalid for candidate")
                before = candidate[effect["field"]]
                after = _eval(effect["value"], context, trace)
                by_id[candidate["id"]][effect["field"]] = after
                effects.append(
                    {
                        "targetId": candidate["id"],
                        "field": effect["field"],
                        "before": before,
                        "after": after,
                    }
                )

        bindings = {"global": global_bindings, "perTarget": local_binding_rows}
        return ProgramPreview(
            True,
            tuple(selected_ids),
            bindings,
            tuple(effects),
            trace.rows,
            after_state,
        )

    def serialized_size(self) -> int:
        return len(json.dumps(self.program, ensure_ascii=False, sort_keys=True).encode("utf-8"))
