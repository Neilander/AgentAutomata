from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
EXPERIMENTS = HERE.parent
sys.path.insert(0, str(EXPERIMENTS / "latent_space_rune_v0"))

from gte_runtime import GTERuntime  # noqa: E402


RELATION_EXAMPLES = {
    "contact": [
        ("石像保持静止，没有受到外物作用", "石像被推车正面撞到"),
        ("压力板上没有任何重量", "冒险者踩在压力板上"),
        ("门铃按钮处于弹起状态", "访客用手按下门铃按钮"),
        ("玻璃瓶安稳地放在桌面上", "飞来的石块击中了玻璃瓶"),
        ("机关拉杆没有被操作", "角色抓住并扳动机关拉杆"),
    ],
    "move_down": [
        ("电梯停在建筑的高层", "电梯沿轨道下降到低层"),
        ("雨滴位于云层下方", "雨滴向地面方向落下"),
        ("棋子停在棋盘上方的格子", "棋子向下移动到下一格"),
        ("吊篮悬在矿井入口", "吊篮垂直下降到矿井深处"),
        ("飞船停留在天空板的高处", "飞船下降到更低的一行"),
    ],
    "heat": [
        ("铁块保持常温", "火焰持续加热铁块"),
        ("锅里的水还是凉的", "炉火把锅里的水加热"),
        ("冰冷的房间没有热源", "暖炉开始提高房间温度"),
        ("面包胚还没有烘烤", "烤箱高温烘烤面包胚"),
        ("发动机处于冷却状态", "发动机运转后逐渐升温"),
    ],
    "remove": [
        ("钥匙插在门锁里", "角色把钥匙从门锁中拔出"),
        ("棋子位于棋盘中央", "棋子被拿离棋盘"),
        ("箱子里装着一枚硬币", "硬币被人从箱子中取走"),
        ("墙上挂着一幅画", "画被从墙上摘了下来"),
        ("装备栏中装着盾牌", "玩家卸下了装备栏里的盾牌"),
    ],
    "inspect": [
        ("密封信件尚未被查看", "玩家仔细阅读密封信件"),
        ("宝箱内部仍然未知", "角色打开并检查宝箱内部"),
        ("地图上的符号没人理解", "玩家停下来观察地图符号"),
        ("敌人的属性尚不清楚", "玩家查看敌人的详细属性"),
        ("机关表面没有被研究", "工程师近距离检查机关结构"),
    ],
}


OBJECT_WAKEUPS = {
    "bomb": {
        "base": "炸弹保持稳定，尚未受到外物作用",
        "candidates": [
            {
                "id": "bomb_contacted",
                "state": "炸弹受到外物碰撞或挤压",
                "trigger_examples": [
                    ("炸弹周围没有物体与它接触", "一块坠落的石头砸中了炸弹"),
                    ("爆炸装置独自放在地面上", "移动的机械撞上了爆炸装置"),
                    ("地雷表面没有承受重量", "敌人踩到了地雷表面"),
                ],
                "chain": ["检查炸弹触发条件", "预想炸弹爆炸", "继续关注爆炸范围内的对象"],
            },
            {
                "id": "bomb_moved",
                "state": "炸弹被搬运到另一个位置",
                "trigger_examples": [
                    ("炸弹放在原来的房间里", "机械手把炸弹从原房间取走"),
                    ("爆炸物仍在货架上", "角色将爆炸物拿离货架"),
                ],
                "chain": ["更新炸弹位置"],
            },
            {
                "id": "bomb_heated",
                "state": "炸弹受到持续的高温加热",
                "trigger_examples": [
                    ("炸弹处于正常温度", "喷出的火焰开始加热炸弹"),
                    ("爆炸物附近没有热源", "高温蒸汽持续烘烤爆炸物"),
                ],
                "chain": ["检查炸弹是否因高温变得不稳定"],
            },
            {
                "id": "bomb_inspected",
                "state": "炸弹正在被仔细检查",
                "trigger_examples": [
                    ("玩家尚未查看炸弹细节", "玩家开始观察炸弹的外壳和引信"),
                    ("爆炸装置的结构仍然未知", "工程师仔细检查爆炸装置的结构"),
                ],
                "chain": ["读取炸弹可见信息"],
            },
            {
                "id": "bomb_untouched",
                "state": "炸弹仍然保持稳定，没有受到外物作用",
                "chain": [],
            },
        ],
    },
    "arrow_tile": {
        "base": "箭头格保持空闲，尚未有单位进入",
        "candidates": [
            {
                "id": "arrow_tile_entered",
                "state": "有单位进入并压在箭头格上",
                "trigger_examples": [
                    ("箭头格上没有任何单位", "一艘飞船落在箭头格上"),
                    ("带方向标记的格子仍然空闲", "移动的敌机占据了方向格"),
                    ("箭头图标所在位置没有棋子", "棋子移动后压住了箭头图标"),
                ],
                "chain": ["读取箭头方向", "预想该单位沿箭头方向横移", "关注新的落点"],
            },
            {
                "id": "arrow_tile_removed",
                "state": "箭头格被从地图中移除",
                "trigger_examples": [
                    ("箭头地块仍连接在地图中", "箭头地块被拿出地图"),
                    ("方向格仍是地图的一部分", "方向格从地图结构中移除"),
                ],
                "chain": ["更新地图结构"],
            },
            {
                "id": "arrow_tile_inspected",
                "state": "箭头格正在被玩家观察",
                "trigger_examples": [
                    ("玩家还没有查看箭头格", "玩家开始仔细观察箭头格"),
                    ("方向标记的含义尚未查看", "玩家阅读方向标记的信息"),
                ],
                "chain": ["读取箭头格信息"],
            },
            {
                "id": "arrow_tile_empty",
                "state": "箭头格仍然空闲，没有单位进入",
                "chain": [],
            },
        ],
    },
}


EVENT_CASES = [
    {
        "id": "ufs_ship_hits_bomb",
        "before": "飞船位于危险装置的上方，两者还没有接触",
        "after": "飞船下降到危险装置所在格，两者发生了碰撞",
        "local_before": "危险装置还没有受到飞船接触",
        "local_after": "危险装置受到下降飞船的碰撞",
        "expected_relation": "contact",
        "object": "bomb",
        "expected_wakeup": "bomb_contacted",
    },
    {
        "id": "cart_hits_bomb_paraphrase",
        "before": "装有爆炸物的箱子独自放在路中，矿车还在远处",
        "after": "矿车驶到箱子的位置并顶住了它",
        "local_before": "装有爆炸物的箱子尚未受到外物接触",
        "local_after": "装有爆炸物的箱子被驶来的矿车顶住",
        "expected_relation": "contact",
        "object": "bomb",
        "expected_wakeup": "bomb_contacted",
    },
    {
        "id": "ship_enters_arrow",
        "before": "飞船还在箭头标记上方，箭头格目前是空的",
        "after": "飞船下降后占据了箭头标记所在的格子",
        "local_before": "箭头标记没有被任何单位接触",
        "local_after": "箭头标记被下降的飞船压住",
        "expected_relation": "contact",
        "object": "arrow_tile",
        "expected_wakeup": "arrow_tile_entered",
    },
    {
        "id": "bomb_is_heated",
        "before": "炸弹放在关闭的喷火机关旁边，温度没有变化",
        "after": "喷火机关启动，火焰持续烘烤炸弹",
        "local_before": "炸弹没有受到热源影响",
        "local_after": "炸弹受到火焰持续加热",
        "expected_relation": "heat",
        "object": "bomb",
        "expected_wakeup": "bomb_heated",
    },
    {
        "id": "bomb_is_inspected",
        "before": "玩家还没有查看角落里的炸弹",
        "after": "玩家停下来仔细观察炸弹的引信结构",
        "local_before": "炸弹的结构尚未被玩家查看",
        "local_after": "炸弹的引信结构被玩家仔细观察",
        "expected_relation": "inspect",
        "object": "bomb",
        "expected_wakeup": "bomb_inspected",
    },
    {
        "id": "bomb_is_carried_away",
        "before": "炸弹仍然放在房间中央",
        "after": "机械臂把炸弹从房间中央取走",
        "local_before": "炸弹仍在原来的位置",
        "local_after": "炸弹被机械臂从原位置取走",
        "expected_relation": "remove",
        "object": "bomb",
        "expected_wakeup": "bomb_moved",
    },
]


NO_WAKE_CASES = [
    {
        "id": "ship_descends_in_other_column",
        "reason": "飞机虽然下降，但注意力终点没有炸弹；不应构造炸弹局部事件",
        "object": None,
    },
    {
        "id": "ship_passes_over_bomb",
        "reason": "炸弹只在可见路径中而不在后果落点；只看见，不等于受到作用",
        "object": None,
    },
    {
        "id": "distance_unknown",
        "reason": "不知道飞机下降几格，无法确认终点与炸弹重合；应保留疑问而不是唤醒爆炸链",
        "object": None,
    },
    {
        "id": "unknown_rune_contact",
        "reason": "即使检测到接触，记忆中没有未知符文的结果预设；应查规则或等待经验",
        "object": "unknown_rune",
    },
    {
        "id": "bomb_gets_wet_without_learned_preset",
        "reason": "炸弹受潮是确定变化，但记忆里没有受潮预设，不能硬选碰撞或加热",
        "object": "bomb",
        "local_before": "炸弹表面保持干燥",
        "local_after": "水流淋湿了炸弹表面",
    },
    {
        "id": "bomb_is_painted_without_learned_preset",
        "reason": "炸弹被涂色与现有触发链无关，应保持未知",
        "object": "bomb",
        "local_before": "炸弹外壳没有涂料",
        "local_after": "角色把炸弹外壳涂成蓝色",
    },
]

WAKE_MIN_SCORE = 0.35
WAKE_MIN_MARGIN = 0.08


def normalize(vector: np.ndarray) -> np.ndarray:
    return vector / max(float(np.linalg.norm(vector)), 1e-12)


def cosine(left: np.ndarray, right: np.ndarray) -> float:
    return float(np.dot(normalize(left), normalize(right)))


def main() -> None:
    texts = set()
    for pairs in RELATION_EXAMPLES.values():
        for before, after in pairs:
            texts.update((before, after))
    for record in OBJECT_WAKEUPS.values():
        texts.add(record["base"])
        texts.update(candidate["state"] for candidate in record["candidates"])
        for candidate in record["candidates"]:
            for before, after in candidate.get("trigger_examples", []):
                texts.update((before, after))
    for case in EVENT_CASES:
        texts.update((case["before"], case["after"], case["local_before"], case["local_after"]))
    for case in NO_WAKE_CASES:
        if case.get("local_before"):
            texts.update((case["local_before"], case["local_after"]))

    ordered = sorted(texts)
    runtime = GTERuntime()
    matrix = runtime.encode(ordered, batch_size=16)
    vectors = {text: matrix[index] for index, text in enumerate(ordered)}

    prototypes = {}
    prototype_lengths = {}
    for relation, pairs in RELATION_EXAMPLES.items():
        deltas = np.stack([vectors[after] - vectors[before] for before, after in pairs])
        directions = np.stack([normalize(delta) for delta in deltas])
        prototypes[relation] = normalize(directions.mean(axis=0))
        prototype_lengths[relation] = float(np.median(np.linalg.norm(deltas, axis=1)))

    memory_trigger_prototypes = {}
    for object_id, record in OBJECT_WAKEUPS.items():
        memory_trigger_prototypes[object_id] = {}
        for candidate in record["candidates"]:
            examples = candidate.get("trigger_examples", [])
            if not examples:
                continue
            trigger_directions = np.stack(
                [normalize(vectors[after] - vectors[before]) for before, after in examples]
            )
            memory_trigger_prototypes[object_id][candidate["id"]] = normalize(
                trigger_directions.mean(axis=0)
            )

    rows = []
    for case in EVENT_CASES:
        scene_arrow = normalize(vectors[case["after"]] - vectors[case["before"]])
        local_arrow = normalize(vectors[case["local_after"]] - vectors[case["local_before"]])
        scene_relation_scores = {
            relation: cosine(scene_arrow, prototype)
            for relation, prototype in prototypes.items()
        }
        relation_scores = {
            relation: cosine(local_arrow, prototype)
            for relation, prototype in prototypes.items()
        }
        relation_ranking = sorted(relation_scores, key=relation_scores.get, reverse=True)
        predicted_relation = relation_ranking[0]

        record = OBJECT_WAKEUPS[case["object"]]
        base = vectors[record["base"]]
        # Earlier transport tests found a shared 2x step substantially stronger
        # than a 1x median arrow. It is fixed globally here, never tuned per case.
        projected = normalize(
            base + prototypes[predicted_relation] * prototype_lengths[predicted_relation] * 2.0
        )
        transported_endpoint_scores = {
            candidate["id"]: cosine(projected, vectors[candidate["state"]])
            for candidate in record["candidates"]
        }
        # A semantic encoder is not a decoder: base + arrow often leaves the
        # manifold. Compare the recalled relation to each memorized candidate
        # transition instead. This asks which entry has the same change, while
        # keeping the object/context in the candidate itself.
        candidate_scores = {}
        for candidate in record["candidates"]:
            trigger_prototype = memory_trigger_prototypes[case["object"]].get(candidate["id"])
            if trigger_prototype is None:
                candidate_scores[candidate["id"]] = cosine(
                    local_arrow, vectors[candidate["state"]] - base
                )
                continue
            candidate_scores[candidate["id"]] = cosine(local_arrow, trigger_prototype)
        # "Unchanged" is a null transition and is never a wakeable action entry.
        wakeable_ids = [candidate["id"] for candidate in record["candidates"] if candidate["chain"]]
        wakeup_ranking = sorted(wakeable_ids, key=candidate_scores.get, reverse=True)
        predicted_wakeup = wakeup_ranking[0]
        wakeup_margin = candidate_scores[wakeup_ranking[0]] - candidate_scores[wakeup_ranking[1]]
        accepted = (
            candidate_scores[predicted_wakeup] >= WAKE_MIN_SCORE
            and wakeup_margin >= WAKE_MIN_MARGIN
        )
        if not accepted:
            predicted_wakeup = None
        selected = next(
            (item for item in record["candidates"] if item["id"] == predicted_wakeup),
            None,
        )
        rows.append(
            {
                **case,
                "predicted_relation": predicted_relation,
                "relation_correct": predicted_relation == case["expected_relation"],
                "whole_scene_relation_scores": scene_relation_scores,
                "relation_scores": relation_scores,
                "predicted_wakeup": predicted_wakeup,
                "wakeup_correct": predicted_wakeup == case["expected_wakeup"],
                "candidate_scores": candidate_scores,
                "wakeup_margin": wakeup_margin,
                "accepted": accepted,
                "naive_transported_endpoint_scores": transported_endpoint_scores,
                "awakened_chain": selected["chain"] if selected else [],
            }
        )

    no_wake_rows = []
    for case in NO_WAKE_CASES:
        object_id = case.get("object")
        if object_id not in OBJECT_WAKEUPS or not case.get("local_before"):
            no_wake_rows.append({**case, "wakeup": None, "correct": True, "gate": "no_confirmed_affected_object_or_no_memory"})
            continue
        local_arrow = normalize(vectors[case["local_after"]] - vectors[case["local_before"]])
        scores = {
            candidate_id: cosine(local_arrow, prototype)
            for candidate_id, prototype in memory_trigger_prototypes[object_id].items()
        }
        ranking = sorted(scores, key=scores.get, reverse=True)
        margin = scores[ranking[0]] - scores[ranking[1]]
        accepted = scores[ranking[0]] >= WAKE_MIN_SCORE and margin >= WAKE_MIN_MARGIN
        no_wake_rows.append(
            {
                **case,
                "scores": scores,
                "best_candidate": ranking[0],
                "best_score": scores[ranking[0]],
                "margin": margin,
                "wakeup": ranking[0] if accepted else None,
                "correct": not accepted,
                "gate": "similarity_rejection",
            }
        )

    results = {
        "schema": "latent_wakeup_retrieval_v0",
        "model": "Alibaba-NLP/gte-multilingual-base",
        "question": "Can a local before-after trend recall a relation, transport it onto the affected object, and wake the correct next action-attention preset?",
        "contract": [
            "程序注意力先确认哪个对象真正受到作用",
            "局部前后状态只负责形成变化箭头",
            "变化箭头召回关系原型，再搬运到受影响对象",
            "投影点只选择下一条记忆预设，不执行正式规则",
            "没有受影响对象或没有预设时保持不唤醒/疑问",
        ],
        "positive_cases": rows,
        "no_wake_cases": no_wake_rows,
        "summary": {
            "case_count": len(rows),
            "relation_top1": float(np.mean([row["relation_correct"] for row in rows])),
            "wakeup_top1": float(np.mean([row["wakeup_correct"] for row in rows])),
            "end_to_end_top1": float(
                np.mean([row["relation_correct"] and row["wakeup_correct"] for row in rows])
            ),
            "no_wake_contract_cases": len(NO_WAKE_CASES),
            "no_wake_accuracy": float(np.mean([row["correct"] for row in no_wake_rows])),
            "wakeup_thresholds": {"minimum_score": WAKE_MIN_SCORE, "minimum_margin": WAKE_MIN_MARGIN},
        },
    }

    output_dir = HERE / "artifacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / "latest_results.json"
    output_path.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    print(f"RESULT_PATH={output_path}")


if __name__ == "__main__":
    main()
