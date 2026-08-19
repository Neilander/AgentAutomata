from __future__ import annotations

import copy
import json
import random
import unittest
from pathlib import Path
from typing import Any

from adaptive_program import AdaptiveGroundingProgram
from test_adaptive_program import AdaptiveProgramTests


HERE = Path(__file__).resolve().parent
ALL_RULES = {"R01", "R02", "R03", "R04", "R05", "R06"}


def load_program() -> AdaptiveGroundingProgram:
    return AdaptiveGroundingProgram.from_files(HERE / "base_program.json", HERE / "source_rules.json")


def load_revisions() -> list[dict[str, Any]]:
    return json.loads((HERE / "program_revisions.json").read_text(encoding="utf-8"))["revisions"]


def oracle(event: dict[str, Any], state: dict[str, Any], active_rules: set[str]) -> tuple[dict, tuple[str, ...]]:
    after = copy.deepcopy(state)
    if event["type"] != "die_placed":
        return after, ()
    distance = int(event["die"]["value"])
    if "R02" in active_rules and event["roomType"] == "aa":
        distance = max(0, distance - 1)

    eligible = [ship for ship in after["ships"] if ship["column"] == event["die"]["column"]]
    if "R03" in active_rules:
        eligible = [ship for ship in eligible if "frozen" not in set(ship["traits"])]
    if "R06" in active_rules and event["roomType"] == "focus" and eligible:
        front_row = max(ship["row"] for ship in eligible)
        eligible = [ship for ship in eligible if ship["row"] == front_row]

    selected = []
    for ship in eligible:
        traits = set(ship["traits"])
        local_distance = distance
        if "R04" in active_rules and "heavy" in traits:
            local_distance //= 2
        if "R05" in active_rules and "boosted" in traits:
            local_distance += 1
        selected.append(ship["id"])
        ship["row"] += local_distance
    return after, tuple(selected)


def _ship(identifier: str, column: int, row: int, traits: list[str] | None = None) -> dict:
    return {"id": identifier, "column": column, "row": row, "traits": list(traits or [])}


def generate_suite(kind: str, count: int, seed: int) -> list[dict[str, Any]]:
    rng = random.Random(seed)
    rows = []
    for case_index in range(count):
        die_column = rng.randrange(5)
        die_value = rng.randint(1, 6)
        room_type = "normal"
        active_rules = {"R01"}
        forced_traits: list[str] | None = None

        if kind in {"aa", "frozen", "heavy", "boosted", "combined", "focus"}:
            active_rules.add("R02")
        if kind in {"frozen", "heavy", "boosted", "combined", "focus"}:
            active_rules.add("R03")
        if kind in {"heavy", "boosted", "combined", "focus"}:
            active_rules.add("R04")
        if kind in {"boosted", "combined", "focus"}:
            active_rules.add("R05")

        if kind == "aa":
            room_type = "aa"
            forced_traits = []
        elif kind == "frozen":
            room_type = rng.choice(["normal", "aa"])
            forced_traits = ["frozen"]
        elif kind == "heavy":
            room_type = rng.choice(["normal", "aa"])
            die_value = rng.randint(2, 6)
            forced_traits = ["heavy"]
        elif kind == "boosted":
            room_type = rng.choice(["normal", "aa"])
            forced_traits = ["boosted"] + (["heavy"] if rng.random() < 0.5 else [])
        elif kind == "combined":
            room_type = rng.choice(["normal", "aa"])
        elif kind == "focus":
            active_rules.add("R06")
            room_type = "focus"

        ships = []
        ship_count = rng.randint(0, 7) if kind == "base" else rng.randint(2, 7)
        for ship_index in range(ship_count):
            column = rng.randrange(5)
            traits: list[str] = []
            if kind == "combined":
                traits = [name for name in ("frozen", "heavy", "boosted") if rng.random() < 0.35]
            ships.append(_ship(f"S{case_index}-{ship_index}", column, rng.randint(0, 14), traits))

        if forced_traits is not None:
            # Guarantee that the newly introduced rule is exercised.
            ships.append(_ship(f"S{case_index}-forced", die_column, rng.randint(0, 14), forced_traits))
        elif kind == "combined" and not any(ship["column"] == die_column for ship in ships):
            traits = [name for name in ("frozen", "heavy", "boosted") if rng.random() < 0.5]
            ships.append(_ship(f"S{case_index}-forced", die_column, rng.randint(0, 14), traits))
        elif kind == "focus":
            # Exercise group-relative selection and ties. Frozen units may be farther
            # forward but must be excluded before the frontmost reducer runs.
            front_row = rng.randint(7, 14)
            ships.extend(
                [
                    _ship(f"S{case_index}-back", die_column, front_row - 3, []),
                    _ship(f"S{case_index}-front-a", die_column, front_row, ["heavy"] if rng.random() < 0.5 else []),
                    _ship(f"S{case_index}-front-b", die_column, front_row, ["boosted"] if rng.random() < 0.5 else []),
                    _ship(f"S{case_index}-frozen", die_column, front_row + 1, ["frozen"]),
                ]
            )

        event = {
            "type": "die_placed",
            "die": {"id": f"D{case_index}", "column": die_column, "value": die_value},
            "roomType": room_type,
        }
        state = {"ships": ships}
        expected_state, expected_selected = oracle(event, state, active_rules)
        rows.append(
            {
                "id": f"{kind}-{case_index:03d}",
                "kind": kind,
                "activeRuleIds": sorted(active_rules),
                "event": event,
                "state": state,
                "expectedState": expected_state,
                "expectedSelectedIds": list(expected_selected),
            }
        )
    return rows


def evaluate(program: AdaptiveGroundingProgram, cases: list[dict[str, Any]]) -> dict[str, Any]:
    correct = 0
    failures = []
    read_counts = []
    for case in cases:
        preview = program.preview(case["event"], case["state"])
        passed = (
            preview.after_state == case["expectedState"]
            and list(preview.selected_ids) == case["expectedSelectedIds"]
        )
        correct += int(passed)
        read_counts.append(len(preview.attention_reads))
        if not passed and len(failures) < 3:
            failures.append(
                {
                    "caseId": case["id"],
                    "activeRuleIds": case["activeRuleIds"],
                    "event": case["event"],
                    "beforeShips": case["state"]["ships"],
                    "expectedShips": case["expectedState"]["ships"],
                    "actualShips": preview.after_state["ships"],
                    "attentionReads": list(preview.attention_reads),
                }
            )
    return {
        "cases": len(cases),
        "correct": correct,
        "accuracy": correct / len(cases) if cases else 1.0,
        "meanAttentionReads": sum(read_counts) / len(read_counts) if read_counts else 0.0,
        "failureExamples": failures,
    }


def main() -> None:
    tests = unittest.defaultTestLoader.loadTestsFromTestCase(AdaptiveProgramTests)
    test_run = unittest.TextTestRunner(verbosity=2).run(tests)
    if not test_run.wasSuccessful():
        raise SystemExit(1)

    suites = {
        "base": generate_suite("base", 150, 2026081901),
        "aa": generate_suite("aa", 100, 2026081902),
        "frozen": generate_suite("frozen", 100, 2026081903),
        "heavy": generate_suite("heavy", 100, 2026081904),
        "boosted": generate_suite("boosted", 100, 2026081905),
        "combined": generate_suite("combined", 300, 2026081906),
        "focus": generate_suite("focus", 100, 2026081907),
    }
    suite_for_revision = {
        "V2-aa-reduction": "aa",
        "V3-frozen-exclusion": "frozen",
        "V4-heavy-distance": "heavy",
        "V5-boost-after-modifiers": "boosted",
        "V6-focus-frontmost-group": "focus",
    }

    program = load_program()
    versions = [
        {
            "version": program.version,
            "introducedBy": "R01 base rule",
            "programBytes": program.serialized_size(),
            "baseRegression": evaluate(program, suites["base"]),
            "program": copy.deepcopy(program.program),
        }
    ]
    learned_suite_names = ["base"]
    revision_results = []

    for revision in load_revisions():
        suite_name = suite_for_revision[revision["revisionId"]]
        before = evaluate(program, suites[suite_name])
        program.apply_revision(revision)
        learned_suite_names.append(suite_name)
        after_new = evaluate(program, suites[suite_name])
        cumulative_cases = [case for name in learned_suite_names for case in suites[name]]
        cumulative = evaluate(program, cumulative_cases)
        base_regression = evaluate(program, suites["base"])
        revision_results.append(
            {
                "revisionId": revision["revisionId"],
                "sourceRuleId": revision["sourceRuleId"],
                "operation": revision["operation"],
                "newSuite": suite_name,
                "beforeRevision": before,
                "afterRevision": after_new,
                "cumulativeRegression": cumulative,
                "baseRegression": base_regression,
                "programBytesAfter": program.serialized_size(),
            }
        )
        versions.append(
            {
                "version": program.version,
                "introducedBy": revision["revisionId"],
                "programBytes": program.serialized_size(),
                "program": copy.deepcopy(program.program),
            }
        )

    combined = evaluate(program, suites["combined"] + suites["focus"])
    results = {
        "schema": "adaptive_rule_program_validation_v0",
        "integrity": {
            "programAuthorship": "current AI authored base and four revisions from frozen source rules",
            "notBlindLlmEvaluation": True,
            "interpreterIsRuleAgnostic": True,
            "oracleIsIndependentCodePath": True,
            "inputsMutatedByPreview": False,
        },
        "tests": {
            "run": test_run.testsRun,
            "failures": len(test_run.failures),
            "errors": len(test_run.errors),
        },
        "caseCounts": {name: len(rows) for name, rows in suites.items()},
        "baseCoverage": versions[0]["baseRegression"],
        "revisions": revision_results,
        "finalCombinedGeneralization": combined,
        "versions": versions,
        "conclusionChecks": {
            "baseRuleCoversAllParameterVariations": versions[0]["baseRegression"]["accuracy"] == 1.0,
            "eachNewRuleExposesPreviousProgramFailure": all(row["beforeRevision"]["accuracy"] < 1.0 for row in revision_results),
            "eachRevisionFixesItsNewSuite": all(row["afterRevision"]["accuracy"] == 1.0 for row in revision_results),
            "noCumulativeRegression": all(row["cumulativeRegression"]["accuracy"] == 1.0 for row in revision_results),
            "finalCombinedSuitePasses": combined["accuracy"] == 1.0,
        },
        "honestBoundary": [
            "This validates a restricted program and incremental patch architecture, not autonomous blind LLM patch generation.",
            "Synthetic frozen/heavy/boosted modifiers are stress rules, not claims about official UFS rules.",
            "The next experiment must let an isolated Agent generate patches without seeing evaluation cases.",
        ],
    }
    output = HERE / "artifacts" / "validation.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "tests": results["tests"],
        "caseCounts": results["caseCounts"],
        "baseCoverage": results["baseCoverage"],
        "revisionSummary": [
            {
                "revisionId": row["revisionId"],
                "beforeAccuracy": row["beforeRevision"]["accuracy"],
                "afterAccuracy": row["afterRevision"]["accuracy"],
                "cumulativeAccuracy": row["cumulativeRegression"]["accuracy"],
                "programBytesAfter": row["programBytesAfter"],
            }
            for row in revision_results
        ],
        "finalCombined": combined,
        "checks": results["conclusionChecks"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
