from __future__ import annotations

import json
import math
import sys
from collections import defaultdict
from itertools import combinations
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402
from transition_dataset import FAMILIES, build_transitions  # noqa: E402


def normalize_rows(values: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(values, axis=1, keepdims=True)
    return values / np.maximum(norms, 1e-12)


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    denominator = float(np.linalg.norm(a) * np.linalg.norm(b))
    if denominator <= 1e-12:
        return 0.0
    return float(np.dot(a, b) / denominator)


def transform_embeddings(
    embeddings: np.ndarray, method: str
) -> tuple[np.ndarray, dict]:
    if method == "raw":
        return embeddings.copy(), {"method": method}

    if not method.startswith("abtt_"):
        raise ValueError(f"unknown transform: {method}")
    top_k = int(method.split("_")[1])
    mean = embeddings.mean(axis=0, keepdims=True)
    centered = embeddings - mean
    _, singular_values, vh = np.linalg.svd(centered, full_matrices=False)
    basis = vh[:top_k]
    projected = centered - centered @ basis.T @ basis
    return normalize_rows(projected), {
        "method": method,
        "removed_components": top_k,
        "top_singular_values": singular_values[: min(10, len(singular_values))].tolist(),
    }


def prepare_vectors(transitions: list[dict], all_text_vectors: dict[str, np.ndarray]) -> dict:
    before = np.stack([all_text_vectors[item["before"]] for item in transitions])
    after = np.stack([all_text_vectors[item["after"]] for item in transitions])
    deltas = after - before
    directions = normalize_rows(deltas)
    return {"before": before, "after": after, "deltas": deltas, "directions": directions}


def relation_prototype(
    transitions: list[dict],
    vectors: np.ndarray,
    relation: str,
    excluded_index: int,
    exclude_same_domain: bool,
) -> np.ndarray | None:
    query = transitions[excluded_index]
    candidates = []
    for index, item in enumerate(transitions):
        if index == excluded_index or item["relation"] != relation:
            continue
        if exclude_same_domain and item["domain"] == query["domain"]:
            continue
        candidates.append(vectors[index])
    if not candidates:
        return None
    return np.mean(candidates, axis=0)


def classify_arrows(transitions: list[dict], directions: np.ndarray) -> dict:
    relations = sorted({item["relation"] for item in transitions})
    predictions = []
    margins = []
    ranks = []
    per_relation = defaultdict(lambda: {"correct": 0, "total": 0})
    for index, item in enumerate(transitions):
        scores = []
        for relation in relations:
            prototype = relation_prototype(
                transitions, directions, relation, index, exclude_same_domain=True
            )
            scores.append(-1.0 if prototype is None else cosine(directions[index], prototype))
        order = np.argsort(scores)[::-1]
        correct_position = relations.index(item["relation"])
        rank = int(np.where(order == correct_position)[0][0]) + 1
        best_wrong = max(score for relation, score in zip(relations, scores) if relation != item["relation"])
        correct_score = scores[correct_position]
        predictions.append(relations[int(order[0])] == item["relation"])
        margins.append(correct_score - best_wrong)
        ranks.append(rank)
        per_relation[item["relation"]]["correct"] += int(predictions[-1])
        per_relation[item["relation"]]["total"] += 1

    within = []
    between = []
    inverse = []
    for left in range(len(transitions)):
        for right in range(left + 1, len(transitions)):
            score = cosine(directions[left], directions[right])
            if transitions[left]["relation"] == transitions[right]["relation"]:
                within.append(score)
            else:
                between.append(score)
            if transitions[left]["relation"] == transitions[right]["inverse_relation"]:
                inverse.append(score)

    return {
        "relation_count": len(relations),
        "chance_top1": 1.0 / len(relations),
        "cross_domain_top1": float(np.mean(predictions)),
        "mean_reciprocal_rank": float(np.mean([1.0 / rank for rank in ranks])),
        "mean_correct_margin": float(np.mean(margins)),
        "within_relation_cosine": float(np.mean(within)),
        "between_relation_cosine": float(np.mean(between)),
        "inverse_relation_cosine": float(np.mean(inverse)),
        "per_relation_recall": {
            relation: values["correct"] / values["total"]
            for relation, values in sorted(per_relation.items())
        },
    }


def transport_arrows(
    transitions: list[dict],
    state_vectors: dict[str, np.ndarray],
    deltas: np.ndarray,
    mode: str,
) -> dict:
    correct = []
    margins = []
    ranks = []
    per_relation = defaultdict(lambda: {"correct": 0, "total": 0})
    selected_scales = []

    for target_index, target in enumerate(transitions):
        source_indices = [
            index
            for index, item in enumerate(transitions)
            if item["relation"] == target["relation"]
            and index != target_index
            and item["domain"] != target["domain"]
        ]
        if not source_indices:
            continue

        if mode == "mean":
            source_arrows = [np.mean(deltas[source_indices], axis=0)]
        elif mode == "single":
            source_arrows = [deltas[index] for index in source_indices]
        elif mode == "mean_direction" or mode.startswith("mean_direction_x"):
            directions = normalize_rows(deltas[source_indices])
            mean_direction = np.mean(directions, axis=0)
            mean_direction = mean_direction / max(np.linalg.norm(mean_direction), 1e-12)
            scale = float(np.median(np.linalg.norm(deltas[source_indices], axis=1)))
            if mode.startswith("mean_direction_x"):
                scale *= float(mode.removeprefix("mean_direction_x"))
            source_arrows = [mean_direction * scale]
        elif mode == "tuned_direction":
            scale_candidates = (0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0)
            scale_scores = []
            for multiplier in scale_candidates:
                validation_outcomes = []
                validation_margins = []
                for validation_index in source_indices:
                    training_indices = [
                        index for index in source_indices if index != validation_index
                    ]
                    training_deltas = deltas[training_indices]
                    validation_direction = np.mean(
                        normalize_rows(training_deltas), axis=0
                    )
                    validation_direction /= max(
                        np.linalg.norm(validation_direction), 1e-12
                    )
                    validation_scale = float(
                        np.median(np.linalg.norm(training_deltas, axis=1))
                    ) * multiplier
                    validation_item = transitions[validation_index]
                    validation_prediction = (
                        state_vectors[validation_item["before"]]
                        + validation_direction * validation_scale
                    )
                    validation_prediction /= max(
                        np.linalg.norm(validation_prediction), 1e-12
                    )
                    validation_candidates = normalize_rows(
                        np.stack(
                            [
                                state_vectors[text]
                                for text in validation_item["candidates"]
                            ]
                        )
                    )
                    validation_scores = validation_candidates @ validation_prediction
                    correct_index = int(validation_item["correct_index"])
                    validation_outcomes.append(
                        int(np.argmax(validation_scores)) == correct_index
                    )
                    validation_margins.append(
                        float(validation_scores[correct_index])
                        - max(
                            float(score)
                            for index, score in enumerate(validation_scores)
                            if index != correct_index
                        )
                    )
                scale_scores.append(
                    (
                        float(np.mean(validation_outcomes)),
                        float(np.mean(validation_margins)),
                        -abs(math.log(multiplier)),
                        multiplier,
                    )
                )
            multiplier = max(scale_scores)[-1]
            selected_scales.append(multiplier)
            directions = normalize_rows(deltas[source_indices])
            mean_direction = np.mean(directions, axis=0)
            mean_direction = mean_direction / max(np.linalg.norm(mean_direction), 1e-12)
            scale = float(np.median(np.linalg.norm(deltas[source_indices], axis=1)))
            source_arrows = [mean_direction * scale * multiplier]
        else:
            raise ValueError(mode)

        target_before = state_vectors[target["before"]]
        candidate_vectors = np.stack([state_vectors[text] for text in target["candidates"]])
        for arrow in source_arrows:
            prediction = target_before + arrow
            scores = normalize_rows(candidate_vectors) @ (
                prediction / max(np.linalg.norm(prediction), 1e-12)
            )
            order = np.argsort(scores)[::-1]
            correct_index = int(target["correct_index"])
            rank = int(np.where(order == correct_index)[0][0]) + 1
            is_correct = int(order[0]) == correct_index
            best_wrong = max(float(score) for idx, score in enumerate(scores) if idx != correct_index)
            correct_score = float(scores[correct_index])
            correct.append(is_correct)
            margins.append(correct_score - best_wrong)
            ranks.append(rank)
            per_relation[target["relation"]]["correct"] += int(is_correct)
            per_relation[target["relation"]]["total"] += 1

    result = {
        "mode": mode,
        "chance_top1": 0.25,
        "cross_domain_top1": float(np.mean(correct)),
        "mean_reciprocal_rank": float(np.mean([1.0 / rank for rank in ranks])),
        "mean_correct_margin": float(np.mean(margins)),
        "evaluations": len(correct),
        "per_relation_recall": {
            relation: values["correct"] / values["total"]
            for relation, values in sorted(per_relation.items())
        },
    }
    if selected_scales:
        result["selected_scale_histogram"] = {
            str(value): selected_scales.count(value)
            for value in sorted(set(selected_scales))
        }
    return result


def transport_learning_curve(
    transitions: list[dict],
    state_vectors: dict[str, np.ndarray],
    deltas: np.ndarray,
) -> list[dict]:
    rows = []
    max_sources = max(
        sum(
            1
            for other in transitions
            if other["relation"] == item["relation"]
            and other["domain"] != item["domain"]
        )
        for item in transitions
    )
    for source_count in range(1, max_sources + 1):
        outcomes = []
        margins = []
        for target_index, target in enumerate(transitions):
            source_indices = [
                index
                for index, item in enumerate(transitions)
                if item["relation"] == target["relation"]
                and index != target_index
                and item["domain"] != target["domain"]
            ]
            if len(source_indices) < source_count:
                continue
            target_before = state_vectors[target["before"]]
            candidate_vectors = normalize_rows(
                np.stack([state_vectors[text] for text in target["candidates"]])
            )
            for selected in combinations(source_indices, source_count):
                selected_deltas = deltas[list(selected)]
                mean_direction = np.mean(normalize_rows(selected_deltas), axis=0)
                mean_direction /= max(np.linalg.norm(mean_direction), 1e-12)
                scale = float(np.median(np.linalg.norm(selected_deltas, axis=1)))
                prediction = target_before + mean_direction * scale
                prediction /= max(np.linalg.norm(prediction), 1e-12)
                scores = candidate_vectors @ prediction
                correct_index = int(target["correct_index"])
                outcomes.append(int(np.argmax(scores)) == correct_index)
                margins.append(
                    float(scores[correct_index])
                    - max(
                        float(score)
                        for index, score in enumerate(scores)
                        if index != correct_index
                    )
                )
        rows.append(
            {
                "source_arrow_count": source_count,
                "top1": float(np.mean(outcomes)),
                "mean_correct_margin": float(np.mean(margins)),
                "evaluations": len(outcomes),
            }
        )
    return rows


def global_transport_retrieval(
    transitions: list[dict],
    state_vectors: dict[str, np.ndarray],
    deltas: np.ndarray,
    multiplier: float,
) -> dict:
    candidate_texts = sorted(state_vectors)
    candidate_matrix = normalize_rows(
        np.stack([state_vectors[text] for text in candidate_texts])
    )
    candidate_index = {text: index for index, text in enumerate(candidate_texts)}
    ranks = []
    baseline_ranks = []
    for target_index, target in enumerate(transitions):
        source_indices = [
            index
            for index, item in enumerate(transitions)
            if item["relation"] == target["relation"]
            and index != target_index
            and item["domain"] != target["domain"]
        ]
        source_deltas = deltas[source_indices]
        direction = np.mean(normalize_rows(source_deltas), axis=0)
        direction /= max(np.linalg.norm(direction), 1e-12)
        scale = float(np.median(np.linalg.norm(source_deltas, axis=1)))
        before = state_vectors[target["before"]]
        prediction = before + direction * scale * multiplier
        prediction /= max(np.linalg.norm(prediction), 1e-12)
        baseline = before / max(np.linalg.norm(before), 1e-12)
        scores = candidate_matrix @ prediction
        baseline_scores = candidate_matrix @ baseline
        # The exact start sentence is not a possible future state.
        scores[candidate_index[target["before"]]] = -np.inf
        baseline_scores[candidate_index[target["before"]]] = -np.inf
        correct_index = candidate_index[target["after"]]
        ranks.append(int(np.sum(scores > scores[correct_index])) + 1)
        baseline_ranks.append(
            int(np.sum(baseline_scores > baseline_scores[correct_index])) + 1
        )

    def summarize(values: list[int]) -> dict:
        return {
            "top1": float(np.mean([rank <= 1 for rank in values])),
            "top5": float(np.mean([rank <= 5 for rank in values])),
            "top10": float(np.mean([rank <= 10 for rank in values])),
            "mean_reciprocal_rank": float(np.mean([1.0 / rank for rank in values])),
            "median_rank": float(np.median(values)),
        }

    return {
        "candidate_count": len(candidate_texts) - 1,
        "multiplier": multiplier,
        "translated": summarize(ranks),
        "unchanged_start_baseline": summarize(baseline_ranks),
    }


def evaluate_dataset(
    transitions: list[dict], raw_text_vectors: dict[str, np.ndarray], method: str
) -> dict:
    ordered_texts = list(raw_text_vectors)
    matrix = np.stack([raw_text_vectors[text] for text in ordered_texts])
    transformed, diagnostics = transform_embeddings(matrix, method)
    state_vectors = {text: transformed[index] for index, text in enumerate(ordered_texts)}
    prepared = prepare_vectors(transitions, state_vectors)
    return {
        "transform": diagnostics,
        "arrow_classification": classify_arrows(transitions, prepared["directions"]),
        "transport": {
            mode: transport_arrows(transitions, state_vectors, prepared["deltas"], mode)
            for mode in (
                "single",
                "mean",
                "mean_direction",
                "mean_direction_x2",
                "mean_direction_x3",
                "tuned_direction",
            )
        },
        "mean_direction_learning_curve": transport_learning_curve(
            transitions, state_vectors, prepared["deltas"]
        ),
        "global_retrieval": {
            f"x{multiplier:g}": global_transport_retrieval(
                transitions,
                state_vectors,
                prepared["deltas"],
                multiplier,
            )
            for multiplier in (1.0, 2.0, 3.0)
        },
    }


def strongest_relations(result: dict, limit: int = 8) -> list[dict]:
    classification = result["arrow_classification"]["per_relation_recall"]
    transport = result["transport"]["mean_direction"]["per_relation_recall"]
    rows = []
    for relation in classification:
        score = math.sqrt(max(classification[relation], 0.0) * max(transport[relation], 0.0))
        rows.append(
            {
                "relation": relation,
                "arrow_recall": classification[relation],
                "transport_recall": transport[relation],
                "joint_score": score,
            }
        )
    return sorted(rows, key=lambda item: item["joint_score"], reverse=True)[:limit]


def main() -> None:
    core = build_transitions(core_only=True)
    expanded = build_transitions(core_only=False)
    all_texts = sorted(
        {
            text
            for item in expanded
            for text in [item["before"], item["after"], *item["candidates"]]
        }
    )

    runtime = GTERuntime()
    encoded = runtime.encode(all_texts, batch_size=16)
    raw_text_vectors = {text: encoded[index] for index, text in enumerate(all_texts)}

    core_raw = evaluate_dataset(core, raw_text_vectors, "raw")
    raw_both_weak = (
        core_raw["arrow_classification"]["cross_domain_top1"] < 0.65
        and core_raw["transport"]["mean"]["cross_domain_top1"] < 0.65
    )

    results = {
        "model": {
            "name": "Alibaba-NLP/gte-multilingual-base",
            "dimensions": int(encoded.shape[1]),
            "offline": True,
        },
        "research_question": {
            "experiment_1": "Do normalized after-minus-before arrows identify the same relation across unseen game domains?",
            "experiment_2": "Can an arrow from other subjects be translated to a new start point and rank its correct end state?",
        },
        "datasets": {
            "core": {
                "family_count": 6,
                "relation_count": len({item["relation"] for item in core}),
                "transition_count": len(core),
            },
            "expanded": {
                "family_count": len(FAMILIES),
                "relation_count": len({item["relation"] for item in expanded}),
                "transition_count": len(expanded),
            },
        },
        "core_raw": core_raw,
        "core_raw_both_below_0_65": raw_both_weak,
        "expanded": {},
    }

    # The expanded scan is intentionally always recorded. When the core fails it
    # is the requested fallback; when it passes it checks which relations actually
    # generalize instead of hiding behind one aggregate score.
    for method in ("raw", "abtt_1", "abtt_3", "abtt_5", "abtt_10"):
        result = evaluate_dataset(expanded, raw_text_vectors, method)
        result["strongest_relations"] = strongest_relations(result)
        results["expanded"][method] = result

    output_dir = HERE / "artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "latest_results.json"
    output_path.write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"RESULT_PATH={output_path}")


if __name__ == "__main__":
    main()
