from __future__ import annotations

import json
from pathlib import Path

from run_mvp import GTERuntime, SemanticWakeRuntime, collect_texts, make_world


HERE = Path(__file__).resolve().parent

# These cases were added only after the attention settings and retrieval
# algorithm produced 8/8 on the development batch. Do not tune on this list.
HOLDOUT = [
    {
        "id": "holdout_chevron_arrow",
        "world": make_world({"sky-c0-r1": "天空板上的白色大于号，表示敌机在这里改去右侧邻列"}, "紫色侵略艇"),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "event_move"},
        "expectedPresets": ["ship_lands_right_arrow"],
        "expectedActions": ["move", "move"],
    },
    {
        "id": "holdout_mothership_height_signal",
        "world": make_world({
            "sky-c0-r1": "会令天空中的巨型母船降低一层高度的控制符号",
            "mothership-r1": "母船一旦到达就宣告失败的骸骨警戒线",
        }),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "event_move"},
        "expectedPresets": ["ship_lands_mothership_down", "mothership_reaches_skull"],
        "expectedActions": ["move", "move", "outcome"],
    },
    {
        "id": "holdout_roswell_damage",
        "world": make_world({"sky-c0-r1": "天空轨道尽头的罗斯威尔城区，敌机落下会直接撞进城市"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "event_move"},
        "expectedPresets": ["ship_hits_city"],
        "expectedActions": ["move", "damage", "relocate"],
    },
    {
        "id": "holdout_burst_icon_no_effect",
        "world": make_world({"sky-c0-r1": "绘有放射状星芒爆裂图案的格位"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "event_move"},
        "expectedPresets": ["ship_lands_explosion_no_immediate_effect"],
        "expectedActions": ["move"],
    },
    {
        "id": "holdout_unknown_question_lamp",
        "world": make_world({"sky-c0-r1": "一个绿色灯泡包围黑色问号的陌生标志"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 1, "cause": "event_move"},
        "expectedPresets": [],
        "expectedActions": ["move"],
    },
    {
        "id": "holdout_city_only_on_path",
        "world": make_world({"sky-c0-r1": "飞船会撞击城市的底部区域"}),
        "initial": {"operator": "move", "actorRef": "ship", "connectionKind": "sky_down", "direction": "down", "distance": 2, "cause": "event_move"},
        "expectedPresets": [],
        "expectedActions": ["move"],
    },
    {
        "id": "holdout_inspect_city_without_collision",
        "world": make_world({"sky-c0-r1": "天空区域下方的城市位置"}),
        "initial": {"operator": "inspect", "actorRef": "ship", "targetUnitId": "sky-c0-r1"},
        "expectedPresets": [],
        "expectedActions": ["inspect"],
    },
]


def main() -> None:
    model = json.loads((HERE / "ai_initial_model.json").read_text(encoding="utf-8"))
    texts = collect_texts(model, HOLDOUT)
    matrix = GTERuntime().encode(texts, batch_size=16)
    vectors = {text: matrix[index] for index, text in enumerate(texts)}
    runtime = SemanticWakeRuntime(model, vectors)
    rows = []
    for scenario in HOLDOUT:
        result = runtime.run(scenario)
        passed = (
            result["awakenedPresets"] == scenario["expectedPresets"]
            and result["actionTrace"] == scenario["expectedActions"]
        )
        rows.append({
            "id": scenario["id"],
            "expectedPresets": scenario["expectedPresets"],
            "actualPresets": result["awakenedPresets"],
            "expectedActions": scenario["expectedActions"],
            "actualActions": result["actionTrace"],
            "wakeTrace": result["wakeTrace"],
            "pass": passed,
        })
    payload = {
        "schema": "semantic_action_glue_mvp_holdout_v1",
        "policy": "frozen attention and retrieval; no tuning on holdout",
        "caseCount": len(rows),
        "passCount": sum(row["pass"] for row in rows),
        "results": rows,
    }
    output_path = HERE / "artifacts" / "holdout_results.json"
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({
        "caseCount": payload["caseCount"],
        "passCount": payload["passCount"],
        "cases": [{"id": row["id"], "actualPresets": row["actualPresets"], "actualActions": row["actualActions"], "pass": row["pass"]} for row in rows],
    }, ensure_ascii=False, indent=2))
    print(f"RESULT_PATH={output_path}")


if __name__ == "__main__":
    main()
