from __future__ import annotations

import hashlib
import json
import sys
import time
from dataclasses import asdict
from pathlib import Path

import numpy as np


HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent.parent
MEMORY_ROOT = EXPERIMENTS / "five_slot_trajectory_memory_v0"
COMPILER_ROOT = MEMORY_ROOT / "ufs_rule_trajectory_compiler_v0"
sys.path.insert(0, str(MEMORY_ROOT))
sys.path.insert(0, str(COMPILER_ROOT))

from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory  # noqa: E402
from gte_encoder import LocalGTEEncoder  # noqa: E402
from rule_trajectory_compiler import RuleTrajectoryCompiler  # noqa: E402


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def query_summary(
    memory: FiveSlotTrajectoryMemory,
    query_id: str,
    coordinate: FiveSlotCoordinate,
    expected_edge_id: str,
) -> dict:
    result = memory.query(
        coordinate,
        top_k=8,
        threshold=0.55,
        score_band=0.12,
    )
    candidate_ids = [row.record_id for row in result.candidates]
    return {
        "queryId": query_id,
        "expectedEdgeId": expected_edge_id,
        "candidateIds": candidate_ids,
        "expectedInCandidates": expected_edge_id in candidate_ids,
        "bestScore": result.best_score,
        "abstained": result.abstained,
    }


def main() -> None:
    source_path = HERE / "source_rules.json"
    draft_path = HERE / "ai_compiled_trajectories.json"
    source_bundle = read_json(source_path)
    draft_bundle = read_json(draft_path)

    compiler = RuleTrajectoryCompiler(source_bundle["rules"])
    drafts = compiler.compile_rows(draft_bundle["edges"])

    started = time.perf_counter()
    encoder = LocalGTEEncoder()
    memory = FiveSlotTrajectoryMemory.new(encoder)
    installed = compiler.install_ready(memory, drafts)

    artifact_dir = HERE / "artifacts"
    artifact_dir.mkdir(exist_ok=True)
    memory_path = artifact_dir / "initial_rule_memory.json"
    memory.save(memory_path, include_cache=True)
    elapsed = time.perf_counter() - started

    vector_path = memory_path.with_suffix(memory_path.suffix + ".vectors.npz")
    with np.load(vector_path, allow_pickle=False) as cache:
        record_ids = list(cache["recordIds"].astype(str))
        current_matrix = np.asarray(cache["current"], dtype="<f4")
        following_matrix = np.asarray(cache["following"], dtype="<f4")
        coarse_matrix = np.asarray(cache["coarse"], dtype="<f4")
        current_shape = list(current_matrix.shape)
        following_shape = list(following_matrix.shape)
        coarse_shape = list(coarse_matrix.shape)

    current_raw_path = artifact_dir / "current_matrix.f32"
    following_raw_path = artifact_dir / "following_matrix.f32"
    coarse_raw_path = artifact_dir / "coarse_matrix.f32"
    current_raw_path.write_bytes(current_matrix.tobytes(order="C"))
    following_raw_path.write_bytes(following_matrix.tobytes(order="C"))
    coarse_raw_path.write_bytes(coarse_matrix.tobytes(order="C"))
    drafts_by_id = {draft.edge_id: draft for draft in drafts}
    node_manifest_path = artifact_dir / "node_gte_matrix_manifest.json"
    node_manifest = {
        "schema": "ufs_node_precompiled_gte_matrix_v0",
        "encoder": encoder.identifier,
        "dtype": "float32-le",
        "currentMatrixFile": current_raw_path.name,
        "followingMatrixFile": following_raw_path.name,
        "coarseMatrixFile": coarse_raw_path.name,
        "currentShape": current_shape,
        "followingShape": following_shape,
        "coarseShape": coarse_shape,
        "records": [
            {
                "recordId": record.record_id,
                "current": asdict(drafts_by_id[record.record_id].current),
                "following": asdict(drafts_by_id[record.record_id].following),
                "support": record.support,
                "observations": record.observations,
            }
            for record in memory.records
        ],
    }
    node_manifest_path.write_text(
        json.dumps(node_manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    exact_rows = [
        query_summary(
            memory,
            f"exact:{draft.edge_id}",
            draft.current,
            draft.edge_id,
        )
        for draft in drafts
    ]

    smoke_inputs = [
        (
            "white-die-reroll",
            "read-rule-place-white-die-to-reroll",
            {
                "affected_object": "刚刚放到基地里的白色骰子和其他还没放的骰子",
                "change_trend": "白骰完成放置，其余骰子的点数面临改变",
                "cause_relation": "玩家这次选择的是白骰",
                "temporal_state": "白骰落位之后、选择下一颗骰子之前",
                "context": "根据UFS教程回想白骰的立即后果",
            },
        ),
        (
            "pay-energy-excavate",
            "read-rule-pay-energy-to-excavate",
            {
                "affected_object": "未挖掘位置上的合法骰子、能源标记和挖掘机",
                "change_trend": "准备花能源把挖掘机推进到骰子的位置",
                "cause_relation": "房间阶段选择执行本回合的挖掘候选",
                "temporal_state": "挖掘动作已选但还没有结算",
                "context": "玩家在脑内预想挖掘会发生什么",
            },
        ),
        (
            "mothership-next-row",
            "read-rule-mothership-phase-to-next-row",
            {
                "affected_object": "母舰和它即将进入那一行的飞船",
                "change_trend": "母舰阶段开始，母舰准备往下一行移动",
                "cause_relation": "当前回合进入母舰阶段的第一步",
                "temporal_state": "母舰还没有下降",
                "context": "玩家根据教程设想母舰阶段",
            },
        ),
        (
            "research-top-win",
            "read-rule-research-track-top-to-immediate-win",
            {
                "affected_object": "研究标记和研究轨道最上方",
                "change_trend": "研究推进后抵达轨道顶端",
                "cause_relation": "研究房让研究标记完成最后推进",
                "temporal_state": "研究移动刚刚结束",
                "context": "玩家检查是否已经达成首局胜利",
            },
        ),
        (
            "spawn-empty-column",
            "read-rule-spawn-to-empty-columns-first",
            {
                "affected_object": "等待生成的紫色敌机、所有列和投放点",
                "change_trend": "紫色飞船等待决定放到哪个入口",
                "cause_relation": "母舰阶段来到重新生成飞船的步骤",
                "temporal_state": "紫色飞船尚未放回天空",
                "context": "玩家回忆飞船生成的第一层优先级",
            },
        ),
    ]
    semantic_rows = [
        query_summary(
            memory,
            query_id,
            FiveSlotCoordinate.from_dict(coordinate),
            expected,
        )
        for query_id, expected, coordinate in smoke_inputs
    ]

    exact_ok = all(row["expectedInCandidates"] for row in exact_rows)
    semantic_ok = all(row["expectedInCandidates"] for row in semantic_rows)
    expected_shape = [len(installed), 3840]
    shape_ok = current_shape == expected_shape and following_shape == expected_shape
    artifact = {
        "schema": "ufs_initial_rule_gte_matrix_compilation_v0",
        "passed": exact_ok and semantic_ok and shape_ok,
        "inputs": {
            "sourceRules": len(source_bundle["rules"]),
            "trajectoryDrafts": len(drafts),
            "sourceSha256": sha256(source_path),
            "draftSha256": sha256(draft_path),
        },
        "compiler": {
            "readyEdgesInstalled": len(installed),
            "strictFiveSlotValidation": True,
            "sourceGroundingValidation": True,
            "inventedNumberGuard": True,
        },
        "matrix": {
            "encoder": encoder.identifier,
            "slotEmbeddingDimensions": 768,
            "coordinateDimensions": 3840,
            "currentShape": current_shape,
            "followingShape": following_shape,
            "coarseShape": coarse_shape,
            "memoryFile": memory_path.name,
            "vectorCacheFile": vector_path.name,
            "nodeManifestFile": node_manifest_path.name,
            "nodeCurrentMatrixFile": current_raw_path.name,
            "nodeFollowingMatrixFile": following_raw_path.name,
            "nodeCoarseMatrixFile": coarse_raw_path.name,
            "memoryBytes": memory_path.stat().st_size,
            "vectorCacheBytes": vector_path.stat().st_size,
            "nodeCurrentMatrixBytes": current_raw_path.stat().st_size,
            "nodeFollowingMatrixBytes": following_raw_path.stat().st_size,
            "nodeCoarseMatrixBytes": coarse_raw_path.stat().st_size,
            "compileSeconds": elapsed,
        },
        "activationSmoke": {
            "exactHeadsFound": sum(row["expectedInCandidates"] for row in exact_rows),
            "exactHeadsTotal": len(exact_rows),
            "semanticFound": sum(row["expectedInCandidates"] for row in semantic_rows),
            "semanticTotal": len(semantic_rows),
            "semanticRows": semantic_rows,
        },
        "honestBoundary": [
            "矩阵只负责提出Top-K联想候选；关系、否定和当前对象仍要经过逐槽证据与grounding。",
            "初始轨迹来自规则书第1—9页既有知识，允许后续因新规则和实际反馈补边、修边或降低支持度。",
            f"本产物证明当前冻结轨迹可以由真实GTE编译和激活，不证明{len(drafts)}条已经覆盖首局所有可能局面。",
        ],
    }
    validation_path = artifact_dir / "gte_matrix_validation.json"
    validation_path.write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(artifact, ensure_ascii=False, indent=2))
    if not artifact["passed"]:
        raise SystemExit(2)


if __name__ == "__main__":
    main()
