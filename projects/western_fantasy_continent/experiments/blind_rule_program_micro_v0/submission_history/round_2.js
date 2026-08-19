module.exports = {
  SOURCE_RULE_IDS: [
    "RULE-BASE-COLUMN-MOVE",
    "RULE-FROZEN-STAYS",
    "RULE-NEAREST-CITY-TIES",
  ],
  REVISION: "round_2",

  preview(state) {
    const event = state.event;
    if (event.type !== "place_die") {
      return [];
    }

    const candidates = [];
    for (const object of state.objects) {
      if (object.column === event.column && object.frozen === false) {
        candidates.push(object);
      }
    }

    let minimumDistance;
    if (event.selection === "nearest_city") {
      for (const object of candidates) {
        if (
          minimumDistance === undefined ||
          object.city_distance < minimumDistance
        ) {
          minimumDistance = object.city_distance;
        }
      }
    }

    const effects = [];
    for (const object of candidates) {
      if (
        event.selection !== "nearest_city" ||
        object.city_distance === minimumDistance
      ) {
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
