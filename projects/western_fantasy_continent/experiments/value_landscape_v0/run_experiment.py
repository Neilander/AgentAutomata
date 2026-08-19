from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import numpy as np

from value_landscape import ValueLandscape, adaptive_direct_radius, normalize


ROOT = Path(__file__).resolve().parent
EXPERIMENTS = ROOT.parent
SEMANTIC_ARTIFACT = EXPERIMENTS / "semantic_team_coordinate_v0" / "artifacts" / "semantic-coordinate-results.json"
TEAM_ARTIFACT = EXPERIMENTS / "team_vector_guess_v1" / "artifacts" / "team-vector-knowledge.json"
HIDDEN_ARTIFACT = ROOT / "artifacts" / "hidden-win-rates.json"
OUT_FILE = ROOT / "artifacts" / "value-landscape-results.json"


def controlled_coordinates() -> dict[str, np.ndarray]:
    shield = np.array([1.0, 0.0, 0.0, 0.0])
    healing = np.array([0.0, 1.0, 0.0, 0.0])
    burst = np.array([0.0, 0.0, 1.0, 0.0])
    control = np.array([0.0, 0.0, 0.0, 1.0])
    return {
        "shield": shield,
        "healing": healing,
        "burst": burst,
        "control": control,
        "shield_healing_team": normalize(shield + healing),
        "near_shield_healing_team": normalize(0.9 * shield + 1.1 * healing),
        "shield_burst_team": normalize(shield + burst),
    }


def controlled_credit_test() -> dict:
    c = controlled_coordinates()
    unexplained = ValueLandscape(direct_radius=0.045, concept_radius=0.15)
    unexplained.observe(
        team_coordinate=c["shield_healing_team"],
        context="normal",
        utility=1.0,
        source="unexplained-win",
    )
    unexplained_values = {
        key: unexplained.evaluate(c[key], "normal")
        for key in ["shield_healing_team", "near_shield_healing_team", "shield", "healing", "burst"]
    }

    verified = ValueLandscape(direct_radius=0.045, concept_radius=0.15)
    verified.observe(
        team_coordinate=c["shield_healing_team"],
        context="normal",
        utility=1.0,
        source="shield-verified-win",
        verified_concepts=[(c["shield"], 1.0)],
    )
    verified_values = {
        key: verified.evaluate(c[key], "normal")
        for key in ["shield_healing_team", "near_shield_healing_team", "shield", "healing", "burst"]
    }

    conflict = ValueLandscape(direct_radius=0.045, concept_radius=0.15)
    conflict.observe(
        team_coordinate=c["shield_healing_team"],
        context="normal",
        utility=1.0,
        source="conflicting-win",
    )
    conflict.observe(
        team_coordinate=c["shield_healing_team"],
        context="normal",
        utility=0.0,
        source="conflicting-loss",
    )
    conflict_value = conflict.evaluate(c["shield_healing_team"], "normal")
    return {
        "unexplained": unexplained_values,
        "shieldVerified": verified_values,
        "conflictingEvidence": conflict_value,
        "checks": {
            "unexplainedStaysLocal": (
                unexplained_values["shield_healing_team"]["value"] > 0.85
                and unexplained_values["near_shield_healing_team"]["value"] > 0.80
                and unexplained_values["shield"]["confidence"] < 0.35
                and unexplained_values["healing"]["confidence"] < 0.35
            ),
            "verificationGeneralizesToShield": (
                verified_values["shield"]["value"] > 0.80
                and verified_values["shield"]["confidence"] > unexplained_values["shield"]["confidence"] + 0.40
                and verified_values["healing"]["confidence"] < verified_values["shield"]["confidence"] * 0.25
            ),
            "conflictingEvidenceLowersConfidence": (
                conflict_value["coverage"] > 0.85
                and conflict_value["consensus"] < 1e-9
                and conflict_value["confidence"] < 1e-9
                and abs(conflict_value["value"] - 0.5) < 1e-9
            ),
        },
    }


def shield_value_shift_test() -> dict:
    c = controlled_coordinates()
    frozen_before = {key: value.copy() for key, value in c.items()}
    landscape = ValueLandscape(direct_radius=0.045, concept_radius=0.15)
    for index in range(4):
        landscape.observe(
            team_coordinate=c["shield_burst_team"],
            context="normal",
            utility=1.0,
            source=f"normal-shield-win-{index + 1}",
            verified_concepts=[(c["shield"], 1.0)],
        )
    normal_before = landscape.evaluate(c["shield"], "normal")
    dispel_before = landscape.evaluate(c["shield"], "dispel")
    for index in range(4):
        landscape.observe(
            team_coordinate=c["shield_burst_team"],
            context="dispel",
            utility=0.0,
            source=f"dispel-shield-failure-{index + 1}",
            verified_concepts=[(c["shield"], 1.0)],
        )
    normal_after_context_failure = landscape.evaluate(c["shield"], "normal")
    dispel_after = landscape.evaluate(c["shield"], "dispel")
    burst_dispel = landscape.evaluate(c["burst"], "dispel")

    for index in range(7):
        landscape.observe(
            team_coordinate=c["shield_burst_team"],
            context="normal",
            utility=0.0,
            source=f"global-shield-nerf-{index + 1}",
            verified_concepts=[(c["shield"], 1.0)],
            concept_scope="*",
            direct_weight=0.0,
        )
    normal_after_global_nerf = landscape.evaluate(c["shield"], "normal")
    dispel_after_global_nerf = landscape.evaluate(c["shield"], "dispel")
    max_coordinate_drift = max(
        float(np.max(np.abs(c[key] - frozen_before[key]))) for key in c
    )
    return {
        "normalBefore": normal_before,
        "dispelBefore": dispel_before,
        "normalAfterContextFailure": normal_after_context_failure,
        "dispelAfterContextFailure": dispel_after,
        "burstInDispel": burst_dispel,
        "normalAfterGlobalNerf": normal_after_global_nerf,
        "dispelAfterGlobalNerf": dispel_after_global_nerf,
        "maxCoordinateDrift": max_coordinate_drift,
        "checks": {
            "coordinatesFrozen": max_coordinate_drift == 0.0,
            "normalShieldStartsStrong": normal_before["value"] > 0.90,
            "contextFailureDoesNotDamageNormal": abs(normal_after_context_failure["value"] - normal_before["value"]) < 1e-9,
            "shieldFallsOnlyInDispel": dispel_after["value"] < 0.10 and normal_after_context_failure["value"] > 0.90,
            "unrelatedBurstNotBlamed": burst_dispel["confidence"] < dispel_after["confidence"] * 0.35,
            "globalNerfLowersEveryContext": (
                normal_after_global_nerf["value"] < normal_after_context_failure["value"] - 0.30
                and dispel_after_global_nerf["value"] <= dispel_after["value"] + 0.03
            ),
        },
    }


def rankdata(values: np.ndarray) -> np.ndarray:
    order = np.argsort(values, kind="mergesort")
    ranks = np.empty(len(values), dtype=np.float64)
    start = 0
    while start < len(values):
        end = start + 1
        while end < len(values) and values[order[end]] == values[order[start]]:
            end += 1
        ranks[order[start:end]] = (start + end - 1) / 2.0
        start = end
    return ranks


def spearman(left: np.ndarray, right: np.ndarray) -> float:
    left_rank = rankdata(left)
    right_rank = rankdata(right)
    if np.std(left_rank) <= 1e-12 or np.std(right_rank) <= 1e-12:
        return 0.0
    return float(np.corrcoef(left_rank, right_rank)[0, 1])


def ridge_predict(train_x: np.ndarray, train_y: np.ndarray, test_x: np.ndarray, regularization: float = 1.0) -> np.ndarray:
    centered = train_y - 0.5
    gram = train_x @ train_x.T
    coefficients = np.linalg.solve(gram + regularization * np.eye(len(train_x)), centered)
    weights = train_x.T @ coefficients
    return np.clip(0.5 + test_x @ weights, 0.0, 1.0)


def real_team_validation() -> dict:
    semantic = json.loads(SEMANTIC_ARTIFACT.read_text(encoding="utf-8"))
    team_payload = json.loads(TEAM_ARTIFACT.read_text(encoding="utf-8"))
    hidden = json.loads(HIDDEN_ARTIFACT.read_text(encoding="utf-8"))
    snapshots = semantic["coordinateSnapshots"]
    team_ids = snapshots["teamOrder"]
    coordinates = np.array(snapshots["capabilityOnly"], dtype=np.float64)
    coordinates = np.array([normalize(row) for row in coordinates])
    coordinate_by_id = {team_id: coordinates[index] for index, team_id in enumerate(team_ids)}
    observed: dict[tuple[str, str], list[float]] = defaultdict(list)
    for branch in ["knowledge", "heldOutValidation"]:
        for cell in team_payload[branch]["cells"]:
            observed[(cell["subject"]["id"], cell["environment"]["id"])].append(
                1.0 if cell["result"]["outcome"] == "win" else 0.0
            )
    truth = {(row["teamId"], row["opponentId"]): row["winRate"] for row in hidden["rows"]}
    opponents = [row["id"] for row in team_payload["opponents"]]
    team_labels = {row["id"]: row["label"] for row in team_payload["teams"]}
    field_predictions: dict[tuple[str, str], float] = {}
    linear_predictions: dict[tuple[str, str], float] = {}
    hidden_oracle_predictions: dict[tuple[str, str], float] = {}
    field_confidence: dict[tuple[str, str], float] = {}
    fold_rows = []
    for fold in range(5):
        test_ids = [team_id for index, team_id in enumerate(team_ids) if index % 5 == fold]
        train_ids = [team_id for team_id in team_ids if team_id not in test_ids]
        train_x = np.array([coordinate_by_id[team_id] for team_id in train_ids])
        radius = adaptive_direct_radius(train_x)
        for opponent in opponents:
            landscape = ValueLandscape(direct_radius=radius, concept_radius=max(radius * 2.0, 0.02))
            oracle_landscape = ValueLandscape(direct_radius=radius, concept_radius=max(radius * 2.0, 0.02))
            train_y = np.array([np.mean(observed[(team_id, opponent)]) for team_id in train_ids])
            for team_id, utility in zip(train_ids, train_y):
                for sample_index, sample_utility in enumerate(observed[(team_id, opponent)]):
                    landscape.observe(
                        team_coordinate=coordinate_by_id[team_id],
                        context=opponent,
                        utility=sample_utility,
                        source=f"{team_id}:{opponent}:observed-{sample_index + 1}",
                    )
                oracle_landscape.observe(
                    team_coordinate=coordinate_by_id[team_id],
                    context=opponent,
                    utility=truth[(team_id, opponent)],
                    source=f"{team_id}:{opponent}:hidden-oracle-diagnostic",
                )
            test_x = np.array([coordinate_by_id[team_id] for team_id in test_ids])
            linear = ridge_predict(train_x, train_y, test_x)
            for team_id, linear_value in zip(test_ids, linear):
                evaluation = landscape.evaluate(coordinate_by_id[team_id], opponent)
                field_predictions[(team_id, opponent)] = evaluation["value"]
                field_confidence[(team_id, opponent)] = evaluation["confidence"]
                linear_predictions[(team_id, opponent)] = float(linear_value)
                hidden_oracle_predictions[(team_id, opponent)] = oracle_landscape.evaluate(
                    coordinate_by_id[team_id], opponent
                )["value"]
            fold_rows.append({"fold": fold, "opponent": opponent, "radius": round(radius, 6)})

    def summarize(predictions: dict[tuple[str, str], float]) -> dict:
        per_context = []
        top_uplifts = []
        all_pred = []
        all_truth = []
        for opponent in opponents:
            predicted = np.array([predictions[(team_id, opponent)] for team_id in team_ids])
            actual = np.array([truth[(team_id, opponent)] for team_id in team_ids])
            order = np.argsort(-predicted)
            top = order[:10]
            uplift = float(np.mean(actual[top]) - np.mean(actual))
            top_uplifts.append(uplift)
            per_context.append({
                "opponent": opponent,
                "spearman": round(spearman(predicted, actual), 4),
                "top10HiddenWinRate": round(float(np.mean(actual[top])), 4),
                "poolHiddenWinRate": round(float(np.mean(actual)), 4),
                "top10Uplift": round(uplift, 4),
                "topTeams": [
                    {
                        "teamId": team_ids[index],
                        "label": team_labels[team_ids[index]],
                        "prediction": round(float(predicted[index]), 4),
                        "hiddenWinRate": round(float(actual[index]), 4),
                    }
                    for index in order[:5]
                ],
            })
            all_pred.extend(predicted.tolist())
            all_truth.extend(actual.tolist())
        all_pred_array = np.array(all_pred)
        all_truth_array = np.array(all_truth)
        return {
            "overallSpearman": round(spearman(all_pred_array, all_truth_array), 4),
            "meanAbsoluteError": round(float(np.mean(np.abs(all_pred_array - all_truth_array))), 4),
            "meanTop10Uplift": round(float(np.mean(top_uplifts)), 4),
            "contextsWithPositiveTop10Uplift": sum(value > 0 for value in top_uplifts),
            "perContext": per_context,
        }

    return {
        "boundary": {
            "coordinateSource": "semantic_team_coordinate_v0 capabilityOnly snapshot",
            "outcomeClaimsExcludedFromCoordinates": snapshots["outcomeClaimsExcluded"],
            "observedBattlesPerTeamOpponent": 2,
            "hiddenBattlesPerTeamOpponent": hidden["seedCount"],
            "teamHeldOutFolds": 5,
            "realEVerifyConceptGeneralization": False,
            "note": "real matrix tests unexplained-result local anchors only; causal generalization is isolated in controlled tests",
        },
        "folds": fold_rows,
        "field": summarize(field_predictions),
        "singleDirectionBaseline": summarize(linear_predictions),
        "hiddenTruthCoordinateOracle": {
            "diagnosticOnly": True,
            "hiddenResultsUsedForLearning": True,
            "purpose": "separate coordinate-neighborhood limits from sparse observed-result noise",
            **summarize(hidden_oracle_predictions),
        },
        "meanFieldConfidence": round(float(np.mean(list(field_confidence.values()))), 4),
    }


def main() -> None:
    credit = controlled_credit_test()
    shield = shield_value_shift_test()
    real = real_team_validation()
    payload = {
        "schema": "player_value_landscape_v0",
        "boundary": {
            "formalPlayerAgentModified": False,
            "teamCoordinatesFrozenDuringValueLearning": True,
            "resultCreatesDirectTeamAnchor": True,
            "EVerifyCreatesConceptAnchor": True,
        },
        "controlledCredit": credit,
        "shieldValueShift": shield,
        "realFiftyTeams": real,
    }
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    compact = lambda summary: {key: value for key, value in summary.items() if key != "perContext"}
    print(json.dumps({
        "output": str(OUT_FILE),
        "creditChecks": credit["checks"],
        "shieldChecks": shield["checks"],
        "meanFieldConfidence": real["meanFieldConfidence"],
        "field": compact(real["field"]),
        "singleDirectionBaseline": compact(real["singleDirectionBaseline"]),
        "hiddenTruthCoordinateOracle": compact(real["hiddenTruthCoordinateOracle"]),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
