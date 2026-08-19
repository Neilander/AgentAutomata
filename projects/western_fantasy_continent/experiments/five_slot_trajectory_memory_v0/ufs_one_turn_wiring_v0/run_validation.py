from __future__ import annotations

import json
import subprocess
from collections import Counter
from pathlib import Path
from time import perf_counter

from gte_encoder import LocalGTEEncoder
from five_slot_memory import FiveSlotTrajectoryMemory
from one_turn_player import build_rule_memory, choose_one_turn, imagine_worker_placement


HERE = Path(__file__).resolve().parent
BRIDGE = HERE / "ufs-public-bridge.js"
ARTIFACT = HERE / "artifacts" / "validation.json"
SEEDS = [0x51A7E, 1, 42]


def node_json(mode: str, seed: int) -> dict:
    completed = subprocess.run(
        ["node", str(BRIDGE), mode, str(seed)],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return json.loads(completed.stdout)


def main() -> None:
    started = perf_counter()
    encoder = LocalGTEEncoder()
    memory = build_rule_memory(encoder)
    empty_memory = FiveSlotTrajectoryMemory.new(encoder)
    cases = []
    total = correct = total_wakeups = selected_correct = 0
    delayed_correct = 0
    wakeup_records: Counter[str] = Counter()
    wakeup_ranks: Counter[int] = Counter()
    max_returned_candidates = 0
    empty_memory_ablation = None
    selected_examples = []
    for seed in SEEDS:
        public_input = node_json("snapshot", seed)
        if empty_memory_ablation is None:
            first_worker = next(row for row in public_input["legalActions"] if row["kind"] == "worker_placement")
            empty_prediction = imagine_worker_placement(empty_memory, public_input, first_worker)
            empty_memory_ablation = {
                "actionId": first_worker["id"],
                "complete": empty_prediction["complete"],
                "selectedRecordId": empty_prediction["wakeups"][0]["selectedRecordId"],
                "worldStayedAtObservation": (
                    empty_prediction["predicted"]["damage"] == public_input["observation"]["damage"]
                    and empty_prediction["predicted"]["mothershipRow"] == public_input["observation"]["mothershipRow"]
                    and empty_prediction["predicted"]["ships"] == sorted(
                        public_input["observation"]["ships"], key=lambda row: row["id"]
                    )
                ),
            }
        choice = choose_one_turn(memory, public_input)
        # Evaluation is requested only after all predictions and the choice exist.
        actual = node_json("evaluate-workers", seed)["outcomes"]
        actual_delayed = node_json("evaluate-delayed", seed)["outcomes"]
        case_correct = 0
        for candidate in choice["candidates"]:
            total += 1
            matches = candidate["predicted"] == actual[candidate["actionId"]]
            correct += int(matches)
            case_correct += int(matches)
            delayed_matches = (
                candidate["delayedBenefit"]["features"]
                == actual_delayed[candidate["actionId"]]["features"]
            )
            delayed_correct += int(delayed_matches)
            all_wakeups = [*candidate["wakeups"], candidate["delayedBenefit"]["wakeup"]]
            total_wakeups += len(all_wakeups)
            for wakeup in all_wakeups:
                if wakeup["selectedRecordId"]:
                    wakeup_records[wakeup["selectedRecordId"]] += 1
                    wakeup_ranks[wakeup["selectedRank"]] += 1
                max_returned_candidates = max(max_returned_candidates, len(wakeup["candidateRecordIds"]))
        selected = next(row for row in choice["candidates"] if row["actionId"] == choice["selectedActionId"])
        selected_matches = selected["predicted"] == actual[selected["actionId"]]
        selected_correct += int(selected_matches)
        selected_examples.append({
            "seed": seed,
            "selectedActionId": choice["selectedActionId"],
            "evaluation": selected["evaluation"],
            "effectiveDescent": selected["effectiveDescent"],
            "wakeups": [
                {
                    "selectedRecordId": wakeup["selectedRecordId"],
                    "selectedScore": wakeup["selectedScore"],
                    "selectedRank": wakeup["selectedRank"],
                    "facts": wakeup["facts"],
                }
                for wakeup in selected["wakeups"]
            ],
            "delayedBenefit": {
                "kind": selected["delayedBenefit"]["kind"],
                "status": selected["delayedBenefit"]["status"],
                "features": selected["delayedBenefit"]["features"],
                "selectedRecordId": selected["delayedBenefit"]["wakeup"]["selectedRecordId"],
                "selectedRank": selected["delayedBenefit"]["wakeup"]["selectedRank"],
            },
            "predictedMatchesEngineAfterChoice": selected_matches,
        })
        cases.append({
            "seed": seed,
            "workerPlacementCandidates": len(choice["candidates"]),
            "predictionsMatchingEngine": case_correct,
            "selectedActionId": choice["selectedActionId"],
            "topThree": [
                {
                    "actionId": row["actionId"],
                    "score": row["evaluation"]["score"],
                    "features": row["evaluation"]["features"],
                }
                for row in choice["candidates"][:3]
            ],
            "bottomThree": [
                {
                    "actionId": row["actionId"],
                    "score": row["evaluation"]["score"],
                    "features": row["evaluation"]["features"],
                }
                for row in choice["candidates"][-3:]
            ],
        })

    payload = {
        "schema": "ufs_five_slot_one_turn_wiring_validation_v0",
        "seeds": SEEDS,
        "ruleMemoryRecords": len(memory),
        "candidatePredictions": total,
        "candidatePredictionsMatchingEngine": correct,
        "candidatePredictionAccuracy": correct / total if total else 0.0,
        "delayedBenefitPredictionsMatchingEngineCounterfactual": delayed_correct,
        "delayedBenefitPredictionAccuracy": delayed_correct / total if total else 0.0,
        "selectedActions": len(SEEDS),
        "selectedActionsMatchingEngine": selected_correct,
        "memoryWakeups": total_wakeups,
        "memoryWakeupRecordCounts": dict(sorted(wakeup_records.items())),
        "memoryWakeupSelectedRankCounts": {str(key): value for key, value in sorted(wakeup_ranks.items())},
        "maxVectorCandidatesBeforeFactVerification": max_returned_candidates,
        "emptyMemoryAblation": empty_memory_ablation,
        "cases": cases,
        "selectedExamples": selected_examples,
        "seconds": perf_counter() - started,
        "boundary": "All worker placements are ranked. Delayed room values are immediate-room counterfactual projections; later placements may change them. Future random die values are never leaked or guessed.",
    }
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if (
        correct != total
        or delayed_correct != total
        or selected_correct != len(SEEDS)
        or max_returned_candidates > 3
        or empty_memory_ablation["complete"]
        or empty_memory_ablation["selectedRecordId"] is not None
        or not empty_memory_ablation["worldStayedAtObservation"]
    ):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
