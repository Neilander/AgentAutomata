from __future__ import annotations

import json
from pathlib import Path

import materialize_dataset as materializer


HERE = Path(__file__).resolve().parent
ROOT = HERE / "final_v1"


materializer.DATA = ROOT / "data"
materializer.SECRET = ROOT / "secret"
materializer.ARTIFACTS = ROOT / "artifacts"
materializer.SEED = 0xA11CE2026
materializer.TRAIN_FRAMES = (
    ("公开观察首先给出：{before}", "随后记录到的作用依次是：{steps}"),
    ("在变化发生以前可以确认，{before}", "接下来发生的相互影响是：{steps}"),
    ("起点局面被描述为：{before}", "事件继续发展为：{steps}"),
    ("此时尚未出现结果；已知{before}", "当前已经发生：{steps}"),
    ("从现场状态可见：{before}", "接着观察到：{steps}"),
)
materializer.EVAL_FRAMES = (
    ("需要预测的局面起初是：{before}", "此后立刻出现：{steps}"),
    ("结果尚未知；目前只知道{before}", "已经发生的作用为：{steps}"),
    ("另一名观察者这样记录开端：{before}", "紧随其后的变化是：{steps}"),
    ("预测前的公开事实包括：{before}", "下一刻可见：{steps}"),
    ("不考虑最后结果，初始状态为：{before}", "当前事件推进到：{steps}"),
)


def normalized_public(row: dict) -> str:
    return json.dumps(
        {key: value for key, value in row.items() if key != "id"},
        ensure_ascii=False, sort_keys=True, separators=(",", ":"),
    )


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def main() -> None:
    materializer.main()
    train = read_jsonl(materializer.DATA / "learn_public.jsonl")
    evaluation = read_jsonl(materializer.DATA / "eval_public.jsonl")
    train_texts = {normalized_public(row) for row in train}
    eval_texts = {normalized_public(row) for row in evaluation}
    audit = {
        "schema": "final_v1_surface_uniqueness_audit",
        "trainRows": len(train), "trainUnique": len(train_texts),
        "evalRows": len(evaluation), "evalUnique": len(eval_texts),
        "crossSplitExactOverlap": len(train_texts & eval_texts),
    }
    if audit != {
        "schema": "final_v1_surface_uniqueness_audit",
        "trainRows": 5000, "trainUnique": 5000,
        "evalRows": 5000, "evalUnique": 5000,
        "crossSplitExactOverlap": 0,
    }:
        raise RuntimeError(f"surface uniqueness failed: {audit}")
    path = materializer.ARTIFACTS / "surface_uniqueness.json"
    path.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(audit, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
