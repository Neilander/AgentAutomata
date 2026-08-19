from __future__ import annotations

import json
import statistics
import time
from pathlib import Path

import numpy as np

from gte_encoder import LocalGTEEncoder


HERE = Path(__file__).resolve().parent
CASES_PATH = HERE / "cases.json"
RESULTS_PATH = HERE / "artifacts" / "results.json"


def elapsed_ms(start: float) -> float:
    return (time.perf_counter() - start) * 1000.0


def percentile(values: list[float], p: float) -> float:
    if not values:
        return 0.0
    return float(np.percentile(np.asarray(values, dtype=np.float64), p))


def largest_gap_selection(scores: np.ndarray) -> tuple[set[int], float]:
    """Select the top cluster using only the largest adjacent score drop."""
    order = np.argsort(-scores)
    sorted_scores = scores[order]
    gaps = sorted_scores[:-1] - sorted_scores[1:]
    split = int(np.argmax(gaps)) + 1
    return set(int(x) for x in order[:split]), float(gaps[split - 1])


def score_query(scores: np.ndarray, labels: list[bool]) -> dict:
    positives = {i for i, label in enumerate(labels) if label}
    negatives = {i for i, label in enumerate(labels) if not label}
    pairs = [(p, n) for p in positives for n in negatives]
    correct_pairs = sum(float(scores[p] > scores[n]) + 0.5 * float(scores[p] == scores[n]) for p, n in pairs)
    pairwise = correct_pairs / len(pairs)

    order = list(np.argsort(-scores))
    top_k = set(int(x) for x in order[: len(positives)])
    gap_set, gap_size = largest_gap_selection(scores)
    return {
        "pairwiseRankingAccuracy": pairwise,
        "oracleTopKExact": top_k == positives,
        "oracleTopKSelectedIndices": sorted(top_k),
        "largestGapExact": gap_set == positives,
        "largestGapSelectedIndices": sorted(gap_set),
        "largestGapSize": gap_size,
        "minPositive": float(min(scores[i] for i in positives)),
        "maxNegative": float(max(scores[i] for i in negatives)),
        "separationMargin": float(min(scores[i] for i in positives) - max(scores[i] for i in negatives)),
    }


def score_subset(scores: np.ndarray, labels: list[bool], indices: list[int]) -> dict:
    subset_scores = scores[indices]
    subset_labels = [labels[i] for i in indices]
    result = score_query(subset_scores, subset_labels)
    result["poolIndices"] = indices
    return result


def main() -> None:
    cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    all_object_texts = [obj["text"] for case in cases for obj in case["objects"]]
    unique_object_texts = list(dict.fromkeys(all_object_texts))

    started = time.perf_counter()
    encoder = LocalGTEEncoder()
    model_load_ms = elapsed_ms(started)

    # Warm up before online latency measurement.
    encoder.encode(["预热模型"])

    started = time.perf_counter()
    unique_vectors = encoder.encode(unique_object_texts, batch_size=32)
    object_encode_ms = elapsed_ms(started)
    vector_by_text = {text: unique_vectors[i] for i, text in enumerate(unique_object_texts)}

    query_latencies: list[float] = []
    matrix_latencies: list[float] = []
    query_results: list[dict] = []

    for case in cases:
        object_matrix = np.stack([vector_by_text[obj["text"]] for obj in case["objects"]])
        labels = [bool(obj["positive"]) for obj in case["objects"]]
        object_index = {obj["id"]: i for i, obj in enumerate(case["objects"])}
        attention_indices = [object_index[obj_id] for obj_id in case["attentionPool"]]
        for query_index, query in enumerate(case["queries"], start=1):
            started = time.perf_counter()
            query_vector = encoder.encode([query])[0]
            query_latencies.append(elapsed_ms(started))

            # Repeat only the cheap matrix operation to obtain a measurable stable latency.
            repeats = 1000
            started = time.perf_counter()
            for _ in range(repeats):
                scores = object_matrix @ query_vector
            matrix_latencies.append(elapsed_ms(started) / repeats)

            metrics = score_query(scores, labels)
            attention_metrics = score_subset(scores, labels, attention_indices)
            ranked = sorted(
                [
                    {"id": obj["id"], "text": obj["text"], "positive": obj["positive"], "score": float(scores[i])}
                    for i, obj in enumerate(case["objects"])
                ],
                key=lambda item: item["score"],
                reverse=True,
            )
            query_results.append(
                {
                    "caseId": case["caseId"],
                    "category": case["category"],
                    "queryIndex": query_index,
                    "query": query,
                    **metrics,
                    "attentionPool": attention_metrics,
                    "ranking": ranked,
                }
            )

    # Cached-vector activation scaling. This deliberately excludes text encoding.
    base_matrix = np.stack(list(vector_by_text.values()))
    query_vector = encoder.encode(["注意同一列并且即将撞击城市的飞船"])[0]
    scale_results = []
    for count in [10, 100, 1_000, 10_000, 100_000]:
        tiled = np.tile(base_matrix, (int(np.ceil(count / len(base_matrix))), 1))[:count]
        samples = []
        for _ in range(30):
            started = time.perf_counter()
            _ = tiled @ query_vector
            samples.append(elapsed_ms(started))
        scale_results.append(
            {
                "candidateCount": count,
                "medianMs": statistics.median(samples),
                "p95Ms": percentile(samples, 95),
            }
        )

    total_queries = len(query_results)
    category_summary = []
    for category in sorted({result["category"] for result in query_results}):
        selected = [result for result in query_results if result["category"] == category]
        category_summary.append(
            {
                "category": category,
                "queries": len(selected),
                "meanPairwiseRankingAccuracy": statistics.mean(x["pairwiseRankingAccuracy"] for x in selected),
                "oracleTopKExactRate": statistics.mean(float(x["oracleTopKExact"]) for x in selected),
                "largestGapExactRate": statistics.mean(float(x["largestGapExact"]) for x in selected),
                "meanSeparationMargin": statistics.mean(x["separationMargin"] for x in selected),
                "attentionPoolMeanPairwiseRankingAccuracy": statistics.mean(x["attentionPool"]["pairwiseRankingAccuracy"] for x in selected),
                "attentionPoolOracleTopKExactRate": statistics.mean(float(x["attentionPool"]["oracleTopKExact"]) for x in selected),
                "attentionPoolLargestGapExactRate": statistics.mean(float(x["attentionPool"]["largestGapExact"]) for x in selected),
            }
        )

    results = {
        "schema": "ufs_rule_object_activation_v0",
        "integrity": {
            "answerUsage": "positive labels are used only after vector scoring",
            "retrieval": "one query embedding followed by one matrix dot product against cached object embeddings",
            "noRelationHardCoding": True,
            "largestGapRuleFrozen": "sort descending and split at the largest adjacent score drop",
        },
        "model": encoder.identifier,
        "counts": {
            "cases": len(cases),
            "queries": total_queries,
            "uniqueObjectDescriptions": len(unique_object_texts),
        },
        "overall": {
            "meanPairwiseRankingAccuracy": statistics.mean(x["pairwiseRankingAccuracy"] for x in query_results),
            "oracleTopKExactRate": statistics.mean(float(x["oracleTopKExact"]) for x in query_results),
            "largestGapExactRate": statistics.mean(float(x["largestGapExact"]) for x in query_results),
            "positiveSeparationRate": statistics.mean(float(x["separationMargin"] > 0) for x in query_results),
            "meanSeparationMargin": statistics.mean(x["separationMargin"] for x in query_results),
            "attentionPoolMeanPairwiseRankingAccuracy": statistics.mean(x["attentionPool"]["pairwiseRankingAccuracy"] for x in query_results),
            "attentionPoolOracleTopKExactRate": statistics.mean(float(x["attentionPool"]["oracleTopKExact"]) for x in query_results),
            "attentionPoolLargestGapExactRate": statistics.mean(float(x["attentionPool"]["largestGapExact"]) for x in query_results),
            "attentionPoolPositiveSeparationRate": statistics.mean(float(x["attentionPool"]["separationMargin"] > 0) for x in query_results),
        },
        "timing": {
            "modelLoadMs": model_load_ms,
            "objectCacheBuild": {
                "objects": len(unique_object_texts),
                "totalMs": object_encode_ms,
                "meanMsPerObjectAmortized": object_encode_ms / len(unique_object_texts),
            },
            "onlineQueryEncoding": {
                "medianMs": statistics.median(query_latencies),
                "p95Ms": percentile(query_latencies, 95),
                "minMs": min(query_latencies),
                "maxMs": max(query_latencies),
            },
            "smallCaseMatrixActivation": {
                "medianMs": statistics.median(matrix_latencies),
                "p95Ms": percentile(matrix_latencies, 95),
            },
            "cachedMatrixScaling": scale_results,
        },
        "byCategory": category_summary,
        "queries": query_results,
    }
    RESULTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    RESULTS_PATH.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"overall": results["overall"], "timing": results["timing"], "byCategory": category_summary}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
