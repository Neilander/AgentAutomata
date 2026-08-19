from __future__ import annotations

import json
import sys
import unittest
from dataclasses import asdict
from pathlib import Path


HERE = Path(__file__).resolve().parent
MEMORY_ROOT = HERE.parent
sys.path.insert(0, str(MEMORY_ROOT))
sys.path.insert(0, str(HERE))

from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory  # noqa: E402
from gte_encoder import LocalGTEEncoder  # noqa: E402
from rule_trajectory_compiler import (  # noqa: E402
    AdaptiveNumericOutcome,
    CandidateEvidence,
    RuleHeadIndex,
    RuleTrajectoryCompiler,
)
from test_rule_trajectory_compiler import RuleTrajectoryCompilerTests  # noqa: E402


def load_inputs() -> tuple[dict[str, str], list[dict], list[dict]]:
    source = json.loads((HERE / "source_rules.json").read_text(encoding="utf-8"))["rules"]
    edges = json.loads((HERE / "ai_compiled_examples.json").read_text(encoding="utf-8"))["edges"]
    queries = json.loads((HERE / "semantic_queries.json").read_text(encoding="utf-8"))["queries"]
    return source, edges, queries


def query_row(memory: FiveSlotTrajectoryMemory, row: dict, threshold: float = 0.55) -> dict:
    result = memory.query(
        FiveSlotCoordinate.from_dict(row["q"]),
        top_k=1,
        threshold=threshold,
        score_band=0.0,
    )
    selected = result.candidates[0].record_id if result.candidates else None
    return {
        "queryId": row["id"],
        "expectedEdgeId": row.get("expectedEdgeId"),
        "selectedEdgeId": selected,
        "correct": selected == row.get("expectedEdgeId"),
        "abstained": result.abstained,
        "bestScore": result.best_score,
        "confidence": result.confidence,
    }


def main() -> None:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(RuleTrajectoryCompilerTests)
    unit_result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not unit_result.wasSuccessful():
        raise SystemExit(1)

    source, edge_rows, query_rows = load_inputs()
    compiler = RuleTrajectoryCompiler(source)
    drafts = compiler.compile_rows(edge_rows)
    encoder = LocalGTEEncoder()
    memory = FiveSlotTrajectoryMemory.new(encoder)
    installed = compiler.install_ready(memory, drafts)
    head_index = RuleHeadIndex(encoder, drafts)

    paraphrases = [query_row(memory, row) for row in query_rows]
    correct = sum(row["correct"] for row in paraphrases)

    hard_negative_rows = [
        {
            "id": "N01-passed-arrow-not-final",
            "q": {
                "affected_object": "从箭头格上方经过但最终停在别处的飞船",
                "change_trend": "飞船越过箭头位置并继续下降到普通格",
                "cause_relation": "箭头格只是经过路径而不是最终落点",
                "temporal_state": "下降已经结束，终点不在箭头上",
                "context": "UFS只结算最终停留格，不结算经过格"
            }
        },
        {
            "id": "N02-gray-die-not-white",
            "q": {
                "affected_object": "刚被放置的灰色骰子和目标基地列",
                "change_trend": "普通灰骰从未放置变为占据一个基地格",
                "cause_relation": "玩家选择放置一颗灰骰而不是白骰",
                "temporal_state": "骰子阶段刚完成放置",
                "context": "UFS普通骰放置，不包含白骰重投"
            }
        },
        {
            "id": "N03-unknown-mothership-icon",
            "q": {
                "affected_object": "母舰刚进入的新行和一个尚未理解的图标",
                "change_trend": "母舰下降后停在未知效果旁边",
                "cause_relation": "母舰移动使这个陌生图标需要被结算",
                "temporal_state": "母舰下降完成、查规则之前",
                "context": "玩家还不知道当前母舰行图标的含义"
            }
        }
    ]
    hard_negatives = []
    for row in hard_negative_rows:
        coordinate = FiveSlotCoordinate.from_dict(row["q"])
        result = memory.query(coordinate, top_k=1)
        head_result = head_index.query(coordinate)
        hard_negatives.append({
            "queryId": row["id"],
            "readyOnlyMatrixSelected": result.candidates[0].record_id if result.candidates else None,
            "readyOnlyBestScore": result.best_score,
            "allHeadsSelected": head_result.edge_id,
            "allHeadsState": head_result.state,
            "allHeadsScore": head_result.score,
        })

    queries_by_id = {row["id"]: row for row in [*query_rows, *hard_negative_rows]}
    drafts_by_id = {row.edge_id: row for row in drafts}
    evidence_rows = json.loads(
        (HERE / "ai_candidate_evidence.json").read_text(encoding="utf-8")
    )["rows"]
    evidence_checks = []
    for row in evidence_rows:
        evidence = CandidateEvidence.from_dict(row)
        query = FiveSlotCoordinate.from_dict(queries_by_id[row["queryId"]]["q"])
        evidence.validate(query, drafts_by_id[evidence.candidate_edge_id])
        evidence_checks.append({
            "queryId": row["queryId"],
            "candidateEdgeId": evidence.candidate_edge_id,
            "accepted": evidence.accepted,
            "contradictedSlots": [
                name for name, verdict in evidence.slot_verdicts.items()
                if verdict == "contradicted"
            ],
        })

    numeric = AdaptiveNumericOutcome(decay=0.7)
    for value in (1, 1, 2, 1, 2):
        numeric.observe(value)
    before_shift = numeric.estimate()
    for value in (5, 5, 5, 5, 5, 5, 5, 5):
        numeric.observe(value)
    after_shift = numeric.estimate()

    # Explicit two-stage composition: the descent rule does not contain an arrow.
    placement = next(row for row in paraphrases if row["queryId"] == "P01")
    arrow = next(row for row in paraphrases if row["queryId"] == "P03")
    chain = {
        "firstLocalState": "放置骰子",
        "firstWakeup": placement["selectedEdgeId"],
        "environmentAndAttentionAdds": "飞船最终停在箭头格",
        "secondWakeup": arrow["selectedEdgeId"],
        "composed": (
            placement["selectedEdgeId"] == "place-die-to-descend-ships"
            and arrow["selectedEdgeId"] == "arrow-landing-to-horizontal-move"
        ),
    }

    expected_evidence = {"P03": True, "N01-passed-arrow-not-final": False, "N02-gray-die-not-white": True}
    evidence_ok = all(expected_evidence[row["queryId"]] == row["accepted"] for row in evidence_checks)
    unknown_head = next(row for row in hard_negatives if row["queryId"] == "N03-unknown-mothership-icon")
    unresolved_ok = (
        unknown_head["allHeadsSelected"] == "mothership-row-effect-unresolved"
        and unknown_head["allHeadsState"] == "unresolved"
    )
    artifact = {
        "schema": "ufs_rule_trajectory_compiler_validation_v0",
        "passed": (
            correct == len(paraphrases)
            and chain["composed"]
            and evidence_ok
            and unresolved_ok
        ),
        "unitTests": {"run": unit_result.testsRun, "passed": unit_result.wasSuccessful()},
        "compiled": {
            "sourceRules": len(source),
            "drafts": len(drafts),
            "readyEdgesInstalled": len(installed),
            "unresolvedEdges": [row.edge_id for row in drafts if row.state == "unresolved"],
            "allCoordinatesHaveExactlyFiveSlots": True,
        },
        "semanticParaphrases": {
            "correct": correct,
            "total": len(paraphrases),
            "accuracy": correct / len(paraphrases),
            "rows": paraphrases,
        },
        "twoStageComposition": chain,
        "hardNegatives": {
            "rawRetrieval": hard_negatives,
            "agentSlotEvidence": evidence_checks,
            "conclusion": "向量负责提出候选；逐槽举证拒绝否定句误唤醒；未解决头返回查规则而不是猜后续。"
        },
        "adaptiveRandomEstimate": {
            "afterLowOutcomes": asdict(before_shift),
            "afterRecentHighOutcomes": asdict(after_shift),
        },
        "honestBoundary": [
            "AI草稿由当前AI一次性生成，程序验证结构、来源引用和禁止补具体数字；这不是独立模型盲测。",
            "来源原句存在只能证明可追溯，不能单靠字符串程序证明每个自然语言概括都逻辑蕴含于原文。",
            "硬负例用于暴露纯语义检索风险；正式粘连仍应读取注意到的局部状态，并允许未知时查规则。"
        ]
    }
    artifact_dir = HERE / "artifacts"
    artifact_dir.mkdir(exist_ok=True)
    (artifact_dir / "validation.json").write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(artifact, ensure_ascii=False, indent=2))
    if not artifact["passed"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
