from __future__ import annotations

import json
import sys
from pathlib import Path


ATTENTION_DIR = (
    Path(__file__).resolve().parents[1]
    / "five_slot_trajectory_memory_v0"
    / "ufs_attention_space_v0"
)
sys.path.insert(0, str(ATTENTION_DIR))

from ufs_attention_space import AttentionContext, UfsAttentionModule  # noqa: E402


def main() -> None:
    payload = json.load(sys.stdin)
    context_input = payload["context"]
    context = AttentionContext(
        phase=context_input["phase"],
        action=context_input["action"],
        goal=context_input.get("goal"),
        tags=tuple(context_input.get("tags", [])),
        focus=context_input.get("focus", {}),
    )
    module = UfsAttentionModule(payload["publicInput"])
    field = module.inspect_attention(context)
    mode = payload.get("mode", "probabilistic")
    if mode == "all":
        noticed_ids = {row["itemId"] for row in field}
        capacity = len(field)
    elif mode == "probabilistic":
        allocation = module.notice_probabilistic(
            context,
            float(payload.get("attentionLevel", 0.75)),
            int(payload["randomSeed"]),
        )
        noticed_ids = {row.item_id for row in allocation.noticed}
        capacity = allocation.capacity
    else:
        raise ValueError(f"unknown attention mode: {mode}")

    output = {
        "schema": "ufs_full_attention_allocation_v0",
        "mode": mode,
        "spaceItemCount": len(field),
        "capacity": capacity,
        "noticedItemIds": sorted(noticed_ids),
        "omittedItemIds": sorted(row["itemId"] for row in field if row["itemId"] not in noticed_ids),
        "field": [
            {
                "itemId": row["itemId"],
                "kind": row["kind"],
                "activation": row["activation"],
                "noticed": row["itemId"] in noticed_ids,
            }
            for row in field
        ],
    }
    json.dump(output, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
