from __future__ import annotations

import json
import tempfile
from pathlib import Path

from five_slot_memory import FiveSlotCoordinate as Q
from five_slot_memory import FiveSlotTrajectoryMemory
from gte_encoder import LocalGTEEncoder


HERE = Path(__file__).resolve().parent
ARTIFACTS = HERE / "artifacts"


def q(obj: str, change: str, cause: str, time: str, context: str) -> Q:
    return Q(obj, change, cause, time, context)


def build_new_memory(encoder: LocalGTEEncoder) -> FiveSlotTrajectoryMemory:
    memory = FiveSlotTrajectoryMemory.new(encoder)
    memory.remember(
        q("可被引爆的危险装置", "从完整安静变为被移动物体直接碰撞", "运动物体与装置发生物理接触", "碰撞正在发生，结果尚未结算", "真实游戏局面的短期预想"),
        q("同一个可爆炸装置", "从受到碰撞变为已经爆炸并向外释放冲击", "碰撞触发装置内部的爆炸机制", "后果已经发生", "真实游戏局面的后果"),
        record_id="actual-collision-detonates",
        metadata={"meaning": "真实接触可能继续引发爆炸"},
    )
    memory.remember(
        q("规则文字里提到的爆炸装置", "从没有被讨论变为被描述成可能触发", "玩家阅读并口头假设碰撞结果", "只是设想，尚未在世界中发生", "规则说明或讨论"),
        q("现实中的爆炸装置", "物理状态保持不变，没有真正被触发", "只有语言讨论，没有物理接触", "讨论结束但事件未发生", "规则说明或假设"),
        record_id="hypothesis-does-not-change-world",
        metadata={"meaning": "想到爆炸不等于真的爆炸"},
    )
    memory.remember(
        q("远处可见的危险装置", "从没有看见变为被观察者注意到", "视野扩大并完成视觉观察", "刚刚被看见", "真实场景中的观察"),
        q("被看见但未接触的危险装置", "保持完整安静，没有被触发", "观察没有造成物理碰撞", "观察已经完成", "真实场景中的观察"),
        record_id="observation-is-not-contact",
        metadata={"meaning": "看见装置不会触发装置"},
    )
    return memory


def main() -> None:
    encoder = LocalGTEEncoder()

    # The test starts from a genuinely empty instance every run.
    memory = FiveSlotTrajectoryMemory.new(encoder)
    empty = memory.query(q("任意对象", "任意变化", "任意原因", "当前", "真实局面"))
    assert empty.abstained and empty.reason == "empty_memory"

    memory = build_new_memory(encoder)
    actual_query = q(
        "尚未起爆的地雷",
        "从静止未触发变为被矿车压住并发生接触",
        "移动中的矿车碾到地雷",
        "接触刚发生，后果还没出现",
        "玩家对当前真实局面的预演",
    )
    hypothetical_query = q(
        "说明书中提到的炸弹",
        "从没被提及变为被玩家设想可能爆炸",
        "阅读规则后讨论如果发生碰撞会怎样",
        "只是在假设未来，并未真实发生",
        "规则讲解和假设讨论",
    )
    observed_query = q(
        "远方地面上的爆炸物",
        "从没发现变为进入视野并被看见",
        "角色转头观察到该物体",
        "刚刚完成观察",
        "真实探索场景",
    )

    cases = [
        ("actual_collision", actual_query, "actual-collision-detonates"),
        ("hypothetical_discussion", hypothetical_query, "hypothesis-does-not-change-world"),
        ("observation_only", observed_query, "observation-is-not-contact"),
    ]
    rows = []
    for name, query, expected in cases:
        result = memory.query(query, threshold=0.50, top_k=3, score_band=0.18)
        predicted = result.candidates[0].record_id if result.candidates else None
        correct = not result.abstained and predicted == expected
        rows.append({
            "case": name,
            "expected": expected,
            "predicted": predicted,
            "correct": correct,
            "bestScore": result.best_score,
            "confidence": result.confidence,
            "following": result.to_dict()["following"],
            "candidateScores": [
                {"recordId": item.record_id, "score": item.score}
                for item in result.candidates
            ],
        })

    with tempfile.TemporaryDirectory() as directory:
        store = Path(directory) / "saved-memory.json"
        memory.save(store)
        restored = FiveSlotTrajectoryMemory.load(store, encoder)
        restored_result = restored.query(actual_query, threshold=0.50)
        persistence_ok = (
            len(restored) == len(memory)
            and not restored_result.abstained
            and restored_result.candidates[0].record_id == "actual-collision-detonates"
        )

    payload = {
        "schema": "five_slot_semantic_demo_v0",
        "newInstanceWasEmpty": empty.reason == "empty_memory",
        "slotCount": 5,
        "coordinateDimension": memory.coordinate_dimension,
        "memoryRecords": len(memory),
        "semanticCases": rows,
        "semanticPassed": sum(row["correct"] for row in rows),
        "persistencePassed": persistence_ok,
    }
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    (ARTIFACTS / "latest_results.json").write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if payload["semanticPassed"] != len(rows) or not persistence_ok:
        raise SystemExit(1)


if __name__ == "__main__":
    main()

