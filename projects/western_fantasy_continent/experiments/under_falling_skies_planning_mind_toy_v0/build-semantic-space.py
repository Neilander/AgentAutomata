from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent
EXPERIMENTS = ROOT.parent
OUT_FILE = ROOT / "artifacts" / "semantic-space.json"

sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))
from gte_runtime import GTERuntime  # noqa: E402


CONCEPTS = {
    "survival": "保护地下基地和城市，在敌机与母舰到达前避免毁灭并继续生存",
    "research": "推进武器研究，尽快完成最终科技并以研究胜利",
    "energy": "生产和储存能源，为研究、战斗机和基地设施供能",
    "defense": "减慢、控制或击落逼近城市的敌机，降低眼前受到的伤害",
    "infrastructure": "先挖掘和扩建地下基地，解锁更强房间并提高未来行动效率",
    "stability": "优先选择稳定可靠、最坏结果较轻的方案",
    "risk": "接受眼前危险和结果波动，换取更大的潜在推进",
    "immediate": "解决马上发生的紧急问题，获得立刻生效的短期收益",
    "delayed": "牺牲当前收益进行投资，在后续回合获得更大的长期回报",
    "flexibility": "保留后续选择和调整空间，不把资源过早锁死在单一路线上",
}

ROOM_TYPES = {
    "aa": "使用防空火力减慢这一列的敌机，降低城市立刻受伤的风险",
    "energy": "生产能源，为研究、战斗机和基地设施提供后续运行资源",
    "research": "推进武器研究，向在母舰抵达前完成最终研究的胜利目标前进",
    "fighter": "启动战斗机，击毁进入爆炸射程的敌机并保护城市",
    "excavate": "向地下挖掘基地，暂时牺牲行动以解锁更强的长期房间",
}

HYPOTHESES = {
    "research_rush": "只要更快推进研究，就能在母舰到达前完成武器并获胜",
    "defense_first": "只要先控制敌机和基地伤害，就能活到有机会完成研究",
    "infrastructure_first": "只要先挖掘基地并建立能源设施，后续强力房间会带来更高总收益",
}


def normalize(vector: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vector))
    return vector / norm if norm > 1e-12 else np.zeros_like(vector)


def main() -> None:
    runtime = GTERuntime(os.environ.get("GTE_MODEL_PATH"))
    records = [
        *(('concept', key, value) for key, value in CONCEPTS.items()),
        *(('roomType', key, value) for key, value in ROOM_TYPES.items()),
        *(('hypothesis', key, value) for key, value in HYPOTHESES.items()),
    ]
    encoded = runtime.encode([record[2] for record in records], batch_size=16)
    payload: dict[str, object] = {
        "schema": "ufs_planning_semantic_space_v0",
        "model": str(runtime.model_path),
        "dimensions": int(encoded.shape[1]),
        "concepts": {},
        "roomTypes": {},
        "hypotheses": {},
    }
    section_for = {"concept": "concepts", "roomType": "roomTypes", "hypothesis": "hypotheses"}
    for index, (kind, key, text) in enumerate(records):
        vector = normalize(encoded[index])
        payload[section_for[kind]][key] = {  # type: ignore[index]
            "text": text,
            "vector": np.round(vector, 8).tolist(),
        }

    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUT_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({
        "output": str(OUT_FILE),
        "dimensions": payload["dimensions"],
        "concepts": len(CONCEPTS),
        "roomTypes": len(ROOM_TYPES),
        "hypotheses": len(HYPOTHESES),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
