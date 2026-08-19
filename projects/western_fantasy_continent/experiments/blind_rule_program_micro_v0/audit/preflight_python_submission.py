SOURCE_RULE_IDS: tuple[str, ...] = ("RULE-BASE-COLUMN-MOVE",)
REVISION: str = "round_0"


def preview(state):
    event = state["event"]
    if event["type"] != "place_die":
        return []
    column = event["column"]
    amount = event["amount"]
    effects = []
    for obj in state["objects"]:
        if obj["column"] == column:
            row = obj["row"]
            effects.append({"object_id": obj["id"], "from_row": row, "to_row": row + amount})
    return effects
