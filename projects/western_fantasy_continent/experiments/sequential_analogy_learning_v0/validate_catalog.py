from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path


HERE = Path(__file__).resolve().parent
CATALOG = HERE / "family_catalog.json"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def main() -> None:
    families = json.loads(CATALOG.read_text(encoding="utf-8"))
    require(isinstance(families, list), "catalog root must be an array")
    require(len(families) == 120, f"expected 120 families, got {len(families)}")
    ids = [family.get("family_id") for family in families]
    require(ids == [f"F{index:03d}" for index in range(1, 121)], "family ids/order mismatch")
    require(len(set(ids)) == 120, "family ids are not unique")
    split_counts = Counter(family.get("split") for family in families)
    require(split_counts == {"shared": 100, "train_only": 10, "unknown_only": 10},
            f"bad split counts: {dict(split_counts)}")

    predicates: Counter[str] = Counter()
    for family in families:
        family_id = family["family_id"]
        subject_count = family.get("subject_count")
        interaction_count = family.get("interaction_count")
        require(subject_count in (1, 2, 3), f"{family_id}: subject_count")
        require(interaction_count in (1, 2), f"{family_id}: interaction_count")
        interactions = family.get("interactions", [])
        require(len(interactions) == interaction_count, f"{family_id}: interaction length")
        require(1 <= len(family.get("effects", [])) <= 3, f"{family_id}: effects length")
        require(bool(family.get("invariant")), f"{family_id}: missing invariant")
        require(bool(family.get("boundary_condition")), f"{family_id}: missing boundary")
        require(isinstance(family.get("near_negative"), dict), f"{family_id}: near_negative")
        realizations = family.get("domain_realizations", [])
        require(len(realizations) >= 4, f"{family_id}: requires >=4 domain realizations")

        role_names = set()
        for realization in realizations:
            entities = realization.get("entities")
            require(isinstance(entities, dict) and entities, f"{family_id}: realization entities")
            current_roles = set(entities)
            role_names |= current_roles
            require(len(current_roles) == subject_count,
                    f"{family_id}: realization has {len(current_roles)} roles, expected {subject_count}")
            require(bool(realization.get("before")), f"{family_id}: realization before")
            phrases = realization.get("interaction_phrases")
            require(isinstance(phrases, list) and phrases,
                    f"{family_id}: realization interaction_phrases")
        for interaction in interactions:
            require(interaction.get("subject") in role_names, f"{family_id}: unknown subject role")
            obj = interaction.get("object")
            require(obj is None or obj in role_names, f"{family_id}: unknown object role")
            require(bool(interaction.get("relation")), f"{family_id}: missing relation")
        for effect in family["effects"]:
            require(effect.get("role") in role_names, f"{family_id}: unknown effect role")
            require(bool(effect.get("predicate")), f"{family_id}: missing predicate")
            predicates[effect["predicate"]] += 1
        before = family.get("observable_before", "")
        placeholders = set(re.findall(r"\{([^{}]+)\}", before))
        require(placeholders.issubset(role_names), f"{family_id}: unknown before placeholder")

    require(len(predicates) >= 20, f"predicate vocabulary too small: {len(predicates)}")
    summary = {
        "families": len(families),
        "splits": dict(split_counts),
        "predicates": len(predicates),
        "domainRealizations": sum(len(row["domain_realizations"]) for row in families),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
