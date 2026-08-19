from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path


HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from test_ufs_attention_space import UfsAttentionSpaceTests, load_real_snapshot  # noqa: E402
from ufs_attention_space import (  # noqa: E402
    AttentionContext,
    AttentionScope,
    UfsAttentionModule,
    UfsAttentionProfile,
)


def main() -> None:
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(UfsAttentionSpaceTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        raise SystemExit(1)

    public_input = load_real_snapshot()
    action = next(
        row for row in public_input["legalActions"]
        if row["id"] == "worker:r1-gray-0@A-r2-c2"
    )
    placement = action["placement"]
    ship_rows = [
        ship["row"] for ship in public_input["observation"]["ships"]
        if ship["column"] == placement["column"]
    ]
    context = AttentionContext(
        phase="dice",
        action="place_die",
        goal="choose_worker_placement",
        tags=("imagination",),
        focus={
            "die_id": placement["dieId"],
            "die_value": placement["dieValue"],
            "cell_id": placement["cellId"],
            "room_id": placement["roomId"],
            "column": placement["column"],
            "ship_rows": ship_rows,
        },
    )
    profile = UfsAttentionProfile()
    module = UfsAttentionModule(public_input, profile)
    before = module.inspect_attention(context)
    adjustment_id = profile.increase_attention(
        {"relation": "all_unplaced_dice"},
        0.35,
        AttentionScope(phase="dice", action="place_die"),
        "复盘发现白骰会联动剩余骰子，因此扩大到未放置骰集合",
    )
    profile.expand_attention(
        "same_column_as_focus",
        0.2,
        AttentionScope(phase="dice", action="place_die"),
        "复盘发现同列较远标志也可能影响后续结果",
    )
    after = module.inspect_attention(context)
    allocations = {
        name: module.notice(context, level)
        for name, level in (("low", 0.15), ("normal", 0.5), ("high", 0.9))
    }

    def activation(rows: list[dict], item_id: str) -> float:
        return next(row["activation"] for row in rows if row["itemId"] == item_id)

    artifact = {
        "schema": "ufs_attention_space_validation_v0",
        "passed": True,
        "testsRun": result.testsRun,
        "realSnapshot": {
            "mapId": public_input["observation"]["mapId"],
            "seedWasNotPassedToModule": True,
            "spaceItemCount": len(module.space.items),
            "skyCellCount": sum(row.kind == "sky_cell" for row in module.space.items),
            "baseCellCount": sum(row.kind == "base_cell" for row in module.space.items),
        },
        "exampleAdjustment": {
            "adjustmentId": adjustment_id,
            "unplacedWhiteDieBefore": activation(before, "die:r1-white-4"),
            "unplacedWhiteDieAfter": activation(after, "die:r1-white-4"),
            "sameColumnFarCellBefore": activation(before, "sky_cell:10:1"),
            "sameColumnFarCellAfter": activation(after, "sky_cell:10:1"),
            "unrelatedFarCellBefore": activation(before, "sky_cell:10:4"),
            "unrelatedFarCellAfter": activation(after, "sky_cell:10:4"),
        },
        "budgets": {
            name: {
                "level": allocation.attention_level,
                "capacity": allocation.capacity,
                "noticedCount": len(allocation.noticed),
                "omittedCount": allocation.omitted_count,
                "topItems": [
                    {
                        "itemId": row.item_id,
                        "activation": row.activation,
                        "clarity": row.clarity,
                    }
                    for row in allocation.noticed[:8]
                ],
            }
            for name, allocation in allocations.items()
        },
        "boundaries": [
            "只接受公开观察与公开地图；隐藏键和答案式字段会被拒绝",
            "模块只分配注意，不选择动作、不预测结果",
            "当前注意力常数和预算容量是可调测试参数，不声称已经拟合人类",
        ],
    }
    artifact_dir = HERE / "artifacts"
    artifact_dir.mkdir(exist_ok=True)
    (artifact_dir / "validation.json").write_text(
        json.dumps(artifact, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps(artifact, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

