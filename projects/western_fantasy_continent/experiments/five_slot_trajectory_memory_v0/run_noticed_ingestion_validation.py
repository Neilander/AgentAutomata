from __future__ import annotations

import hashlib
import json
from pathlib import Path
from time import perf_counter

import numpy as np

from five_slot_memory import FiveSlotCoordinate, FiveSlotTrajectoryMemory
from noticed_step_writer import FullyNoticedStep, FullyNoticedTrajectoryWriter


HERE = Path(__file__).resolve().parent
SOURCE = HERE.parent / "sequential_analogy_learning_v0" / "final_v1" / "data"
ARTIFACT = HERE / "artifacts" / "noticed_ingestion_validation.json"


class FastStableEncoder:
    dimension = 32
    identifier = "fast-stable-ingestion-validation-v1"

    def encode(self, texts: list[str], batch_size: int = 16) -> np.ndarray:
        rows = []
        for text in texts:
            seed = int.from_bytes(hashlib.sha256(text.encode("utf-8")).digest()[:8], "big")
            rng = np.random.default_rng(seed)
            vector = rng.normal(size=self.dimension).astype(np.float32)
            rows.append(vector / np.linalg.norm(vector))
        return np.asarray(rows, dtype=np.float32)


def read_jsonl(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line]


def bind(text: str, bindings: dict[str, str]) -> str:
    rendered = text
    for role, entity in bindings.items():
        rendered = rendered.replace(f"<{role}>", entity)
    return rendered


def episode_steps(ideal: dict, public: dict) -> list[FullyNoticedStep]:
    bindings = ideal["bindings"]
    rows: list[FullyNoticedStep] = []
    previous = public["before"]
    for index, interaction in enumerate(ideal["interactions"], start=1):
        actor = bindings[interaction["subject"]]
        target_role = interaction.get("object")
        target = bindings[target_role] if target_role else "当前环境"
        action = bind(interaction["change"], bindings)
        rows.append(FullyNoticedStep(
            actor=actor,
            action=action,
            affected_object=target,
            before_state=previous,
            after_state=f"已完整观察到：{action}",
            temporal_state=f"第{index}步已经发生并被玩家看见",
            context=f"真实经历；当前公开作用为：{public['interactions']}",
        ))
        previous = f"第{index}步“{action}”已经完成"

    affected = "、".join(
        bindings[effect["slot"]] for effect in ideal["effects"]
    )
    rows.append(FullyNoticedStep(
        actor="前述全部相互作用",
        action="共同产生已观察到的结果",
        affected_object=affected,
        before_state="前述作用已经发生但结果尚未结算",
        after_state=public["result"],
        temporal_state="结果已经发生并被玩家完整看见",
        context="真实经历的已观察结果",
    ))
    return rows


def main() -> None:
    ideal_rows = read_jsonl(SOURCE / "learn_ideal_records.jsonl")
    public_rows = read_jsonl(SOURCE / "learn_public.jsonl")
    public_by_id = {row["id"]: row for row in public_rows}
    if len(ideal_rows) != 5000 or len(public_by_id) != 5000:
        raise ValueError("expected the frozen 5000 learning examples")

    memory = FiveSlotTrajectoryMemory.new(FastStableEncoder())
    replay: list[tuple[FiveSlotCoordinate, FiveSlotCoordinate]] = []
    total_steps = 0
    multi_interaction_episodes = 0
    started = perf_counter()
    for ideal in ideal_rows:
        steps = episode_steps(ideal, public_by_id[ideal["id"]])
        coordinates = FullyNoticedTrajectoryWriter.abstract(steps)
        if not all(all(coordinate.slot_texts()) for coordinate in coordinates):
            raise AssertionError(f"empty slot in {ideal['id']}")
        FullyNoticedTrajectoryWriter.remember(
            memory,
            steps,
            metadata={"sourceId": ideal["id"]},
        )
        total_steps += len(ideal["interactions"])
        multi_interaction_episodes += int(len(ideal["interactions"]) == 2)
        if len(replay) < 500:
            replay.extend(zip(coordinates[:-1], coordinates[1:]))
            replay = replay[:500]
    write_seconds = perf_counter() - started

    queries = [current for current, _ in replay]
    expected = [following for _, following in replay]
    query_started = perf_counter()
    results = memory.query_many(queries, threshold=0.99, candidate_pool=128)
    query_seconds = perf_counter() - query_started
    exact = sum(result.following == target for result, target in zip(results, expected))

    payload = {
        "schema": "fully_noticed_five_slot_ingestion_validation_v0",
        "source": "sequential_analogy_learning_v0/final_v1",
        "assumption": "every step is fully noticed before abstraction",
        "episodes": len(ideal_rows),
        "noticedInteractionSteps": total_steps,
        "multiInteractionEpisodes": multi_interaction_episodes,
        "writtenMemoryLinksAfterExactDeduplication": len(memory),
        "allFiveSlotsNonempty": True,
        "writeSecondsBeforeVectorCompilation": write_seconds,
        "exactReplay": {
            "cases": len(replay),
            "correct": exact,
            "accuracy": exact / len(replay),
            "secondsIncludingFirstVectorCompilation": query_seconds,
        },
    }
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if exact != len(replay):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
