"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const initialPublicState = require("../ufs_first_action_imagination_v0/public_initial_state.json");
const publicMap = require("../ufs_first_action_imagination_v0/public-map");
const { UfsFullGameAttentionSession } = require("../ufs_first_action_imagination_v0/ufs-full-game-attention-session");

const SOURCE_TRANSCRIPT = path.join(
  __dirname,
  "../ufs_attention_full_game_playtest_v16/state_attempt_2026082816_v16/machine-transcript.jsonl",
);

function readOperations() {
  return fs.readFileSync(SOURCE_TRANSCRIPT, "utf8")
    .split(/\r?\n/u)
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((row) => row.operation)
    .map((row) => structuredClone(row.operation));
}

function expectation(itemId, change, field = null, value = undefined) {
  return {
    itemId,
    ...(field ? { field } : {}),
    change,
    ...(change === "equals" ? { value } : {}),
  };
}

function placementsForRoom(view, roomId) {
  return (view.observation?.placements || []).filter((row) => row.roomId === roomId);
}

function deliberatePredictions(operation, view, step) {
  if (["submit_random_observation", "submit_round_roll"].includes(operation.type)) return [];
  if (operation.type === "place_die") {
    const rows = [{
      because: "被选择的骰子提交后会占据目标格",
      expectations: [expectation(`die:${operation.dieId}`, "equals", "placed", true)],
    }];
    if (step === 1) {
      rows.push({
        because: "错误探针：猜测任何放置都会立即产能",
        expectations: [expectation("track:energy", "increase")],
      });
    }
    return rows;
  }
  if (operation.type === "resolve_room") {
    const room = publicMap.base.rooms.find((row) => row.id === operation.roomId);
    const roomPlacements = placementsForRoom(view, operation.roomId);
    const expectations = roomPlacements.slice(0, 2).map((row) => (
      expectation(`placement:${row.id}`, "equals", "resolved", true)
    ));
    if (room?.type === "energy") expectations.unshift(expectation("track:energy", "changed"));
    if (room?.type === "research") expectations.unshift(expectation("track:energy", "decrease"));
    return expectations.length ? [{
      because: `${room?.type || "当前"}房间进入正式结算`,
      expectations: expectations.slice(0, 3),
    }] : [];
  }
  if (operation.type === "choose_research_advance") {
    return [{
      because: "研究选择将落实刚才房间预算允许的推进",
      expectations: [expectation(
        "track:researchIndex",
        operation.advanceSteps > 0 ? "increase" : "unchanged",
      )],
    }];
  }
  if (operation.type === "excavate") {
    return [{
      because: "挖掘消耗能源并把挖掘机推向目标",
      expectations: [
        expectation("track:energy", "decrease"),
        expectation("track:excavatorIndex", "increase"),
        expectation(`placement:${operation.placementId}`, "equals", "resolved", true),
      ],
    }];
  }
  if (operation.type === "skip_worker") {
    return [{
      because: "跳过工人会结束该放置的房间阶段处理",
      expectations: [expectation(`placement:${operation.placementId}`, "equals", "resolved", true)],
    }];
  }
  if (operation.type === "end_rooms") {
    return [{
      because: "结束房间阶段后母舰阶段会推进母舰",
      expectations: [expectation("track:mothershipRow", "increase")],
    }];
  }
  if (operation.type === "choose_spawn") {
    return [{
      because: "选择投放点会把等待中的飞船放回天空",
      expectations: [
        expectation(`ship:${operation.shipId}`, "present"),
        expectation(`waiting_ship:${operation.shipId}`, "absent"),
      ],
    }];
  }
  return [];
}

function main() {
  const operations = readOperations();
  const session = new UfsFullGameAttentionSession({ publicMap });
  let view = session.start({ initialPublicState, attentionSeed: 2026082816 });
  const steps = [];
  const finalTickets = new Map();
  for (let index = 0; index < operations.length; index += 1) {
    const operation = operations[index];
    const predictions = deliberatePredictions(operation, view, index + 1);
    view = session.advance({ ...operation, ...(predictions.length ? { predictions } : {}) });
    const audit = session.inspectFeedbackState().lastAudit;
    assert.notEqual(view.status, "rejected", `V17 replay rejected step ${index + 1}: ${view.reason}`);
    for (const ticket of audit.tickets || []) {
      if (ticket.evaluation) finalTickets.set(ticket.ticketId, ticket);
    }
    steps.push({
      step: index + 1,
      operation: operation.type,
      declaredPredictionCount: predictions.length,
      responseStatus: view.status,
      feedbackStatus: audit.status,
      feedbackReason: audit.reason,
      ticketCounts: audit.ticketCounts || null,
      learnedCount: audit.learned?.length || 0,
    });
  }

  const feedback = session.inspectFeedbackState();
  const tickets = [...finalTickets.values()];
  const deliberate = tickets.filter((row) => row.source === "deliberate_action_prediction");
  const dispositionCounts = Object.fromEntries([
    "confirmed", "contradicted", "unresolved", "ambiguous",
  ].map((status) => [status, deliberate.filter((row) => row.learningDisposition === status).length]));
  const result = {
    schema: "ufs_prediction_feedback_playtest_v17",
    sourceAttempt: "ufs_attention_full_game_playtest_v16",
    attentionSeed: 2026082816,
    operationCount: operations.length,
    rejectedCount: steps.filter((row) => row.responseStatus === "rejected").length,
    noPredictionStableCount: steps.filter((row) => row.feedbackStatus === "no_prediction").length,
    deliberateChoiceWithoutDeclaredPredictionCount: steps.filter((row) => (
      !["submit_random_observation", "submit_round_roll"].includes(row.operation)
      && row.declaredPredictionCount === 0
    )).length,
    deliberateTicketCount: deliberate.length,
    deliberateDispositionCounts: dispositionCounts,
    predictionLedgerCount: feedback.predictionLedger.length,
    unresolvedLedgerCount: feedback.predictionLedger.filter((row) => row.status === "unresolved").length,
    learnedTrajectoryCount: feedback.learning.trajectories.length,
    reinforcedConnectionCount: feedback.learning.connectionUpdates.length,
    finalGame: view.game,
    finalStatus: view.status,
    finalReason: view.reason,
    finalPending: view.pending,
    steps,
  };
  assert.equal(result.rejectedCount, 0);
  assert.equal(result.finalGame.completedRoundCount, 3);
  assert.equal(result.finalPending.type, "next_round_roll");
  assert.ok(result.deliberateTicketCount >= 20);
  assert.equal(result.deliberateChoiceWithoutDeclaredPredictionCount, 0);
  assert.ok(result.deliberateDispositionCounts.confirmed > 0);
  assert.ok(result.deliberateDispositionCounts.contradicted > 0);
  assert.ok(result.unresolvedLedgerCount > 0);
  fs.writeFileSync(path.join(__dirname, "RESULTS.json"), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main();
