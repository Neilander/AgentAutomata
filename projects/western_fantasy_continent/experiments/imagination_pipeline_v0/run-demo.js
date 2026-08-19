"use strict";

const { ImaginationPipeline } = require("./imagination-pipeline");
const { createScenario } = require("./trajectory-fixtures");

const scenario = createScenario();
const result = new ImaginationPipeline().run({
  ...scenario,
  perceptionBudget: 40,
  imaginationBudget: 20,
});

const ship = result.imaginedWorld.objects.find((object) => object.id === "ship-a");
console.log(JSON.stringify({
  status: result.status,
  observed_world_unchanged: result.observedWorldUnchanged,
  initial_q_count: result.trace.initialQueryCount,
  activated_and_grounded: result.trace.groundings.map((row) => ({
    trajectory: row.trajectoryId,
    committed: row.committed,
    reads: row.reads,
  })),
  relation_rejections: result.trace.relationRejections.map((row) => ({
    trajectory: row.trajectoryId,
    reason: row.reason,
  })),
  imagined_ship_a: { column: ship.column, row: ship.row },
  imagined_city_health: result.imaginedWorld.city.health,
  stop: result.trace.boundaries.at(-1),
}, null, 2));
