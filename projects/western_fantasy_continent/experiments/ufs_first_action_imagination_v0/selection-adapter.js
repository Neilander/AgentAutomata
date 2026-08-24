"use strict";

const COLOR_BY_LABEL = Object.freeze({
  "灰": "gray",
  "白": "white",
});

function parseSelectionLine(submissionText, scenarioLabel) {
  const escaped = String(scenarioLabel).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `^SELECTION ${escaped}: die=(灰|白)(\\d+); cell=([A-Z]-r\\d+-c\\d+)\\s*$`,
    "m",
  );
  const match = String(submissionText).match(pattern);
  if (!match) throw new Error(`missing structured selection line for scenario ${scenarioLabel}`);
  return {
    colorLabel: match[1],
    color: COLOR_BY_LABEL[match[1]],
    value: Number(match[2]),
    cellId: match[3],
  };
}

function resolveSelectedAction({ submissionText, scenarioLabel, publicState }) {
  const parsed = parseSelectionLine(submissionText, scenarioLabel);
  const matchingDice = publicState.dice.filter((die) => (
    !die.placed && die.color === parsed.color && die.value === parsed.value
  ));
  if (matchingDice.length !== 1) {
    throw new Error(
      `scenario ${scenarioLabel} selection resolves to ${matchingDice.length} public dice`,
    );
  }
  const die = matchingDice[0];
  return {
    schema: "ufs_selected_action_v0",
    scenarioLabel,
    source: `submission:SELECTION ${scenarioLabel}`,
    action: {
      type: "place_die",
      dieId: die.id,
      dieColor: die.color,
      dieValue: die.value,
      cellId: parsed.cellId,
    },
  };
}

module.exports = {
  parseSelectionLine,
  resolveSelectedAction,
};
