from __future__ import annotations

from dataclasses import dataclass
from itertools import combinations
from math import exp, log
from typing import Iterable

import numpy as np


AXES = (
    "healing",
    "shield",
    "damage_reduction",
    "death_prevention",
    "control",
    "burst_damage",
    "sustained_damage",
    "mobility",
    "anti_heal",
)

AXIS_LABELS = {
    "healing": "直接治疗",
    "shield": "护盾",
    "damage_reduction": "减伤",
    "death_prevention": "强制阻止死亡",
    "control": "控制",
    "burst_damage": "爆发输出",
    "sustained_damage": "持续输出",
    "mobility": "位移",
    "anti_heal": "禁止治疗",
}

MECHANISM_PHRASES = {
    "healing": (
        "治疗受伤的友军并恢复生命值",
        "修复队友的伤势，使其生命重新增长",
        "为生命不足的同伴回复一部分体力",
    ),
    "shield": (
        "制造一层屏障，提前吸收友军将要受到的伤害",
        "给队友覆盖护盾，在护盾破裂前抵挡攻击",
        "用防护结界承受原本会落到队友身上的伤害",
    ),
    "damage_reduction": (
        "强化友军的防御，使随后承受的伤害降低",
        "让队友进入坚韧状态，削弱来袭攻击的威力",
        "减轻一段时间内友军实际受到的伤害",
    ),
    "death_prevention": (
        "在受到致命伤时保留一点生命，强制避免这次死亡",
        "让友军下一次本应死亡时继续存活",
        "短时间内生命值不会降到零以下",
    ),
    "control": (
        "让敌人眩晕，暂时无法行动",
        "用束缚和减速限制敌人的行动",
        "打断敌人的动作并令其短暂失去行动能力",
    ),
    "burst_damage": (
        "在很短时间内对敌人造成大量伤害",
        "集中力量发动一次高额爆发攻击",
        "瞬间倾泻伤害，迅速压低敌人的生命值",
    ),
    "sustained_damage": (
        "持续攻击并在较长时间里稳定造成伤害",
        "让敌人不断受到灼烧伤害",
        "通过连续攻击逐渐累积可观的输出",
    ),
    "mobility": (
        "快速移动到新的位置并重新调整站位",
        "可以瞬移穿过战场，到达需要支援的地点",
        "利用突进和撤退改变自己所在的位置",
    ),
    "anti_heal": (
        "使敌人无法通过治疗恢复生命值",
        "给敌人施加重伤，显著压制其生命恢复",
        "封锁对手的治疗效果，使回复无法生效",
    ),
}

AXIS_ANCHORS = {
    "healing": {
        "positive": ["恢复友军失去的生命值", "治疗伤口并让血量回升", "为队友回复生命"],
        "negative": ["不能恢复任何生命值", "只会阻挡伤害但不会回血", "只攻击敌人而不治疗"],
    },
    "shield": {
        "positive": ["提前生成护盾吸收伤害", "用屏障抵挡未来攻击", "给队友套上可被打破的防护层"],
        "negative": ["不会产生护盾或屏障", "伤害已经发生后才恢复生命", "只攻击而不提供防护层"],
    },
    "damage_reduction": {
        "positive": ["降低接下来实际受到的伤害", "强化防御并减轻来袭攻击", "按比例减少承受的伤害"],
        "negative": ["不会降低受到的伤害", "伤害数值完全不被削弱", "只造成伤害而不提升防御"],
    },
    "death_prevention": {
        "positive": ["受到致命伤时仍保留一点生命", "本来会死亡但被强制保住", "短时间内生命不会降到零"],
        "negative": ["无法阻止致命伤导致死亡", "生命归零时正常死亡", "只回复少量生命而不保证存活"],
    },
    "control": {
        "positive": ["眩晕敌人使其无法行动", "束缚或减速敌人的行动", "打断敌人的关键动作"],
        "negative": ["完全不影响敌人的行动", "敌人仍能自由移动和攻击", "只改变伤害而不控制敌人"],
    },
    "burst_damage": {
        "positive": ["瞬间造成大量爆发伤害", "在极短时间倾泻高额输出", "用一次强力攻击快速击杀"],
        "negative": ["短时间内不能造成明显伤害", "伤害缓慢发生而没有爆发", "只防守而不攻击敌人"],
    },
    "sustained_damage": {
        "positive": ["长时间稳定地持续造成伤害", "让敌人不断受到灼烧", "连续攻击并逐渐累积输出"],
        "negative": ["不能持续造成伤害", "只有一次攻击而没有后续输出", "只保护友军而不攻击"],
    },
    "mobility": {
        "positive": ["快速位移到新的战场位置", "瞬移并重新调整站位", "突进或撤退改变所在地点"],
        "negative": ["无法移动或改变站位", "始终停留在原来的位置", "只改变数值而不产生位移"],
    },
    "anti_heal": {
        "positive": ["禁止敌人通过治疗恢复生命", "施加重伤并压制生命回复", "让对手的治疗效果失效"],
        "negative": ["不会干扰敌人的治疗", "敌人仍能正常恢复生命", "只治疗友军而不禁止敌方回复"],
    },
}


@dataclass(frozen=True)
class Character:
    id: str
    description: str
    tags: frozenset[str]


def build_characters() -> list[Character]:
    removed_pairs = {
        frozenset(("death_prevention", "burst_damage")),
        frozenset(("anti_heal", "control")),
    }
    tag_sets = [
        frozenset(pair)
        for pair in combinations(AXES, 2)
        if frozenset(pair) not in removed_pairs
    ]
    tag_sets.extend(
        [
            frozenset(("healing", "control", "sustained_damage")),
            frozenset(("shield", "mobility", "burst_damage")),
            frozenset(("damage_reduction", "control", "anti_heal")),
            frozenset(("death_prevention", "mobility", "sustained_damage")),
        ]
    )

    characters: list[Character] = []
    for index, tags in enumerate(tag_sets, start=1):
        phrases = [
            MECHANISM_PHRASES[tag][(index + axis_index) % len(MECHANISM_PHRASES[tag])]
            for axis_index, tag in enumerate(AXES)
            if tag in tags
        ]
        characters.append(
            Character(
                id=f"候选-{index:02d}",
                description="；".join(phrases) + "。",
                tags=tags,
            )
        )

    characters.extend(
        [
            Character(
                id="候选-39",
                description="技能名称是“锁血”。友军受到致命伤时生命值最低保留一点；随后立刻进行一次高额攻击。",
                tags=frozenset(("death_prevention", "burst_damage")),
            ),
            Character(
                id="候选-40",
                description="技能名称也是“锁血”。命中敌人后封锁其生命恢复，并使敌人短暂眩晕；它不会保护友军免于死亡。",
                tags=frozenset(("anti_heal", "control")),
            ),
        ]
    )
    return characters


def normalize_rows(values: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(values, axis=1, keepdims=True)
    return values / np.clip(norms, 1e-12, None)


def axis_probabilities(
    character_vectors: np.ndarray,
    positive_anchor_vectors: dict[str, np.ndarray],
    negative_anchor_vectors: dict[str, np.ndarray],
) -> tuple[np.ndarray, dict[str, dict[str, float]]]:
    probabilities = np.zeros((len(character_vectors), len(AXES)), dtype=np.float64)
    diagnostics: dict[str, dict[str, float]] = {}
    for axis_index, axis in enumerate(AXES):
        positive = normalize_rows(positive_anchor_vectors[axis])
        negative = normalize_rows(negative_anchor_vectors[axis])
        positive_centroid = normalize_rows(positive.mean(axis=0, keepdims=True))[0]
        negative_centroid = normalize_rows(negative.mean(axis=0, keepdims=True))[0]
        direction = positive_centroid - negative_centroid
        direction = direction / max(float(np.linalg.norm(direction)), 1e-12)

        positive_scores = positive @ direction
        negative_scores = negative @ direction
        midpoint = float((positive_scores.mean() + negative_scores.mean()) / 2)
        separation = max(float(positive_scores.mean() - negative_scores.mean()), 1e-6)
        candidate_scores = character_vectors @ direction
        logits = np.clip(4.0 * (candidate_scores - midpoint) / separation, -12, 12)
        probabilities[:, axis_index] = 1.0 / (1.0 + np.exp(-logits))
        diagnostics[axis] = {
            "positive_anchor_mean": float(positive_scores.mean()),
            "negative_anchor_mean": float(negative_scores.mean()),
            "anchor_separation": separation,
        }
    return probabilities, diagnostics


def pairwise_auc(scores: np.ndarray, labels: np.ndarray) -> float:
    positives = scores[labels == 1]
    negatives = scores[labels == 0]
    if len(positives) == 0 or len(negatives) == 0:
        return float("nan")
    wins = 0.0
    for positive in positives:
        wins += float(np.sum(positive > negatives))
        wins += 0.5 * float(np.sum(positive == negatives))
    return wins / (len(positives) * len(negatives))


def evaluate_axes(characters: list[Character], probabilities: np.ndarray) -> dict[str, float]:
    result = {}
    for axis_index, axis in enumerate(AXES):
        labels = np.array([int(axis in character.tags) for character in characters])
        result[axis] = pairwise_auc(probabilities[:, axis_index], labels)
    return result


def oracle_probabilities(characters: list[Character]) -> np.ndarray:
    return np.array(
        [[0.95 if axis in character.tags else 0.05 for axis in AXES] for character in characters],
        dtype=np.float64,
    )


def entropy(probability: float) -> float:
    probability = min(max(probability, 1e-12), 1 - 1e-12)
    return -(probability * log(probability) + (1 - probability) * log(1 - probability))


def choose_question(
    posterior: np.ndarray,
    probabilities: np.ndarray,
    asked_axes: Iterable[int],
) -> int | None:
    asked = set(asked_axes)
    choices = []
    for axis_index in range(probabilities.shape[1]):
        if axis_index in asked:
            continue
        predicted_yes = float(posterior @ probabilities[:, axis_index])
        choices.append((entropy(predicted_yes), axis_index))
    return max(choices)[1] if choices else None


def update_posterior(
    posterior: np.ndarray,
    yes_probabilities: np.ndarray,
    answer_yes: bool,
) -> np.ndarray:
    likelihood = yes_probabilities if answer_yes else 1 - yes_probabilities
    likelihood = np.clip(likelihood, 0.02, 0.98)
    updated = posterior * likelihood
    return updated / updated.sum()


def run_guess(
    characters: list[Character],
    probabilities: np.ndarray,
    target_index: int,
    max_questions: int = 9,
) -> dict:
    posterior = np.full(len(characters), 1 / len(characters), dtype=np.float64)
    asked: list[int] = []
    trace = []
    for _ in range(max_questions):
        question = choose_question(posterior, probabilities, asked)
        if question is None:
            break
        asked.append(question)
        answer_yes = AXES[question] in characters[target_index].tags
        before_effective = 1.0 / float(np.sum(posterior**2))
        posterior = update_posterior(posterior, probabilities[:, question], answer_yes)
        after_effective = 1.0 / float(np.sum(posterior**2))
        trace.append(
            {
                "axis": AXES[question],
                "answer": answer_yes,
                "effective_candidates_before": before_effective,
                "effective_candidates_after": after_effective,
                "top_probability": float(posterior.max()),
            }
        )
    prediction = int(np.argmax(posterior))
    return {
        "target": characters[target_index].id,
        "prediction": characters[prediction].id,
        "correct": prediction == target_index,
        "target_rank": int((-posterior).argsort().tolist().index(target_index) + 1),
        "target_probability": float(posterior[target_index]),
        "trace": trace,
    }


def run_all_guesses(characters: list[Character], probabilities: np.ndarray) -> dict:
    runs = [run_guess(characters, probabilities, index) for index in range(len(characters))]
    return {
        "accuracy": sum(run["correct"] for run in runs) / len(runs),
        "mean_target_rank": float(np.mean([run["target_rank"] for run in runs])),
        "mean_target_probability": float(np.mean([run["target_probability"] for run in runs])),
        "runs": runs,
    }


def inverse_survival_retrieval(
    characters: list[Character], probabilities: np.ndarray, top_k: int = 8
) -> dict:
    indices = {axis: AXES.index(axis) for axis in AXES}
    prevention = np.maximum.reduce(
        [
            probabilities[:, indices["shield"]],
            probabilities[:, indices["damage_reduction"]],
            probabilities[:, indices["death_prevention"]],
        ]
    )
    score = prevention - probabilities[:, indices["healing"]]
    ranking = np.argsort(-score)[:top_k]
    rows = []
    for index in ranking:
        character = characters[int(index)]
        desired = "healing" not in character.tags and bool(
            character.tags & {"shield", "damage_reduction", "death_prevention"}
        )
        rows.append({"id": character.id, "score": float(score[index]), "desired": desired})
    return {
        "top_k": top_k,
        "precision": sum(row["desired"] for row in rows) / top_k,
        "ranking": rows,
    }


def lock_blood_context_check(characters: list[Character], probabilities: np.ndarray) -> dict:
    by_id = {character.id: index for index, character in enumerate(characters)}
    death = AXES.index("death_prevention")
    anti_heal = AXES.index("anti_heal")
    protect = by_id["候选-39"]
    suppress = by_id["候选-40"]
    return {
        "protect_lock_blood": {
            "death_prevention": float(probabilities[protect, death]),
            "anti_heal": float(probabilities[protect, anti_heal]),
            "correct": bool(
                probabilities[protect, death] > probabilities[protect, anti_heal]
            ),
        },
        "suppress_lock_blood": {
            "death_prevention": float(probabilities[suppress, death]),
            "anti_heal": float(probabilities[suppress, anti_heal]),
            "correct": bool(
                probabilities[suppress, anti_heal] > probabilities[suppress, death]
            ),
        },
    }
