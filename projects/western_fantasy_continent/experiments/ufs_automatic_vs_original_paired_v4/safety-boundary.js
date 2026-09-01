"use strict";

function isWaitingForNextRoundRollBoundary(response) {
  return response?.status === "random"
    && response.reason === "waiting_for_next_round_roll"
    && Array.isArray(response.availableOperations)
    && response.availableOperations.includes("submit_round_roll");
}

module.exports = { isWaitingForNextRoundRollBoundary };
