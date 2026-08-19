module.exports = {
  SOURCE_RULE_IDS: ["RULE-BASE-COLUMN-MOVE", "RULE-FROZEN-STAYS"],
  REVISION: "round_1",

  preview(state) {
    const event = state.event;
    if (event.type !== "place_die") {
      return [];
    }

    const effects = [];
    for (const object of state.objects) {
      if (object.column === event.column && object.frozen === false) {
        effects.push({
          object_id: object.id,
          from_row: object.row,
          to_row: object.row + event.amount,
        });
      }
    }
    return effects;
  },
};
