from __future__ import annotations

import hashlib
import json
import random
from pathlib import Path


HERE = Path(__file__).resolve().parent
DATA = HERE / "data"
SECRET = HERE / "secret"
ARTIFACTS = HERE / "artifacts"
SEED = 0x51A7E2026


TRAIN_FRAMES = (
    ("当前记录显示：{before}", "随后发生：{steps}"),
    ("先观察到：{before}", "接着依次出现：{steps}"),
    ("事件开始前，{before}", "本次相互影响为：{steps}"),
    ("局面如下：{before}", "之后可见：{steps}"),
    ("起始公开状态：{before}", "已发生的作用：{steps}"),
)

EVAL_FRAMES = (
    ("眼前的状态是：{before}", "正在发生：{steps}"),
    ("观察者先看到：{before}", "紧接着：{steps}"),
    ("在这次事件里，最初{before}", "相互作用表现为：{steps}"),
    ("公开局势为：{before}", "目前已经出现：{steps}"),
    ("预测点之前：{before}", "现在的变化是：{steps}"),
)


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    text = "".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n" for row in rows)
    path.write_text(text, encoding="utf-8")


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def render(text: str, bindings: dict[str, str]) -> str:
    try:
        return text.format_map(bindings)
    except (KeyError, ValueError):
        # Domain authors sometimes provide already-rendered prose. Keep it public
        # rather than guessing a hidden causal fact.
        return text


def role_order(family: dict, bindings: dict[str, str]) -> list[str]:
    order: list[str] = []
    for interaction in family["interactions"]:
        for role in (interaction["subject"], interaction.get("object")):
            if role is not None and role not in order:
                order.append(role)
    for role in bindings:
        if role not in order:
            order.append(role)
    if len(order) != family["subject_count"]:
        raise ValueError(f"{family['family_id']}: role count mismatch")
    return order


def replace_entities(text: str, bindings: dict[str, str], slots: dict[str, str]) -> str:
    output = text
    # Long names first so a short name cannot partially consume a longer one.
    for role, entity in sorted(bindings.items(), key=lambda item: len(item[1]), reverse=True):
        output = output.replace(entity, f"<{slots[role]}>")
    for role, slot in slots.items():
        output = output.replace("{" + role + "}", f"<{slot}>")
    return output


def interaction_texts(family: dict, realization: dict, bindings: dict[str, str], instance_index: int) -> list[str]:
    phrases = realization["interaction_phrases"]
    output = []
    for step_index, interaction in enumerate(family["interactions"]):
        if step_index < len(phrases):
            phrase = phrases[(instance_index + step_index) % len(phrases)]
        else:
            subject = bindings[interaction["subject"]]
            obj_role = interaction.get("object")
            if obj_role is None:
                phrase = f"{subject}{interaction['relation']}"
            else:
                phrase = f"{subject}{interaction['relation']}{bindings[obj_role]}"
        output.append(render(phrase, bindings))
    return output


def build_instance(
    family: dict,
    split: str,
    instance_index: int,
    realization: dict,
    before_variant: int,
    interaction_variant: int,
) -> tuple[dict, dict, dict]:
    bindings = dict(realization["entities"])
    order = role_order(family, bindings)
    role_to_slot = {role: f"p{index}" for index, role in enumerate(order)}
    slot_bindings = {role_to_slot[role]: entity for role, entity in bindings.items()}
    shared_before = render(family["observable_before"], bindings)
    domain_before = render(realization.get("before", ""), bindings)
    # The family-level text contains the observable trigger/boundary facts. A
    # short domain vignette is context, not a replacement for those facts.
    before = shared_before if not domain_before else f"{shared_before} {domain_before}"
    interaction_text = interaction_texts(family, realization, bindings, instance_index)
    frames = TRAIN_FRAMES if split == "train" else EVAL_FRAMES
    before_frame = frames[before_variant % len(frames)][0]
    interaction_frame = frames[interaction_variant % len(frames)][1]
    raw_before = before_frame.format(before=before)
    raw_interactions = interaction_frame.format(steps="；然后".join(interaction_text))
    opaque_id = hashlib.sha256(
        f"{SEED}:{family['family_id']}:{split}:{instance_index}:{realization['domain']}".encode()
    ).hexdigest()[:16]

    effects = [
        {
            "slot": role_to_slot[effect["role"]],
            "property": "状态",
            "operation": "变为",
            "value": effect["predicate"],
        }
        for effect in family["effects"]
    ]
    result_template = "；".join(
        "{" + effect["slot"] + "}:" + effect["value"] for effect in effects
    )
    result_text = "；".join(
        f"{bindings[effect['role']]}：{effect['predicate']}" for effect in family["effects"]
    )
    steps = []
    for step_index, interaction in enumerate(family["interactions"]):
        steps.append({
            "subject": role_to_slot[interaction["subject"]],
            "change": replace_entities(interaction_text[step_index], bindings, role_to_slot),
            "object": role_to_slot[interaction["object"]] if interaction.get("object") is not None else None,
        })
    current_norm = "；然后".join(replace_entities(text, bindings, role_to_slot) for text in interaction_text)
    normalized = {
        "id": opaque_id,
        "slots": [
            {
                "slot": role_to_slot[role],
                "description": replace_entities(
                    render(family["observable_before"], bindings), bindings, role_to_slot
                ),
            }
            for role in order
        ],
        "bindings": slot_bindings,
        "beforeNorm": replace_entities(before, bindings, role_to_slot),
        "interactions": steps,
        "currentNorm": current_norm,
    }
    observed = {**normalized, "resultTemplate": result_template, "effects": effects}
    public = {
        "id": opaque_id,
        "before": raw_before,
        "interactions": raw_interactions,
        **({"result": result_text} if split == "train" else {}),
    }
    gold = {
        "id": opaque_id,
        "familyId": family["family_id"],
        "familySplit": family["split"],
        "subjectCount": family["subject_count"],
        "interactionCount": family["interaction_count"],
        "domain": realization["domain"],
        "effects": [
            {
                "entity": bindings[effect["role"]],
                "property": "状态",
                "operation": "变为",
                "value": effect["predicate"],
            }
            for effect in family["effects"]
        ],
    }
    return public, observed, gold


def realize_family(family: dict, split: str, count: int) -> list[tuple[dict, dict, dict]]:
    realizations = family["domain_realizations"]
    if family["split"] == "shared":
        selected = realizations[::2] if split == "train" else realizations[1::2]
        if not selected:
            raise ValueError(f"{family['family_id']}: cannot isolate train/eval domains")
    else:
        selected = realizations
    output = []
    domain_count = len(selected)
    for index in range(count):
        realization_index = index % domain_count
        before_variant = (index // domain_count) % len(TRAIN_FRAMES)
        interaction_variant = (index // (domain_count * len(TRAIN_FRAMES))) % len(TRAIN_FRAMES)
        output.append(build_instance(
            family, split, index, selected[realization_index],
            before_variant, interaction_variant,
        ))
    return output


def interleave_batches(shared: list, exclusive: list, rng: random.Random) -> list:
    rng.shuffle(shared)
    rng.shuffle(exclusive)
    output = []
    for batch_index in range(50):
        batch = shared[batch_index * 90:(batch_index + 1) * 90]
        batch += exclusive[batch_index * 10:(batch_index + 1) * 10]
        rng.shuffle(batch)
        output.extend(batch)
    if len(output) != 5000:
        raise ValueError(f"bad stream length {len(output)}")
    return output


def main() -> None:
    families = json.loads((HERE / "family_catalog.json").read_text(encoding="utf-8"))
    train_shared, train_only, eval_shared, eval_unknown = [], [], [], []
    for family in families:
        if family["split"] == "shared":
            train_shared.extend(realize_family(family, "train", 45))
            eval_shared.extend(realize_family(family, "eval", 45))
        elif family["split"] == "train_only":
            train_only.extend(realize_family(family, "train", 50))
        elif family["split"] == "unknown_only":
            eval_unknown.extend(realize_family(family, "eval", 50))
        else:
            raise ValueError(f"unknown split {family['split']}")

    rng = random.Random(SEED)
    train_rows = interleave_batches(train_shared, train_only, rng)
    eval_rows = interleave_batches(eval_shared, eval_unknown, rng)
    learn_public = [row[0] for row in train_rows]
    learn_ideal = [row[1] for row in train_rows]
    eval_public = [row[0] for row in eval_rows]
    eval_ideal = [{key: value for key, value in row[1].items()
                   if key not in ("resultTemplate", "effects")} for row in eval_rows]
    eval_gold = [row[2] for row in eval_rows]

    write_jsonl(DATA / "learn_public.jsonl", learn_public)
    write_jsonl(DATA / "learn_ideal_records.jsonl", learn_ideal)
    write_jsonl(DATA / "eval_public.jsonl", eval_public)
    write_jsonl(DATA / "eval_ideal_queries.jsonl", eval_ideal)
    write_jsonl(SECRET / "eval_gold.jsonl", eval_gold)
    files = [
        DATA / "learn_public.jsonl", DATA / "learn_ideal_records.jsonl",
        DATA / "eval_public.jsonl", DATA / "eval_ideal_queries.jsonl",
        SECRET / "eval_gold.jsonl",
    ]
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    manifest = {
        "schema": "sequential_analogy_dataset_manifest_v0",
        "generationMode": "agent-authored causal families; mechanical surface realization",
        "formalAgentInstanceGeneration": False,
        "seed": SEED,
        "total": 10000,
        "learn": 5000,
        "eval": 5000,
        "batchSize": 100,
        "batches": 50,
        "hashes": {str(path.relative_to(HERE)): digest(path) for path in files},
    }
    (ARTIFACTS / "dataset_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
