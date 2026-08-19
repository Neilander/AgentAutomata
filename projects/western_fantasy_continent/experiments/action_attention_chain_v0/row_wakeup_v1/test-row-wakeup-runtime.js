"use strict";

const assert = require("assert");
const ROWS = require("./ufs-wake-rows");
const { compileWakeRows, executeSelectedRows, referenceSelectRows, validateAgentResponse } = require("./row-wakeup-runtime");

const compiled = compileWakeRows(ROWS);
const executed = [];
const executor = (action, context) => { executed.push({ action, context }); return { ok: true, action }; };

function run(eventId, localFact) {
  const response = referenceSelectRows({ eventId, localFact, publicRows: compiled.publicRows });
  return { response, execution: executeSelectedRows({ eventId, localFact, response, compiled, executor }) };
}

const arrow = run("E01", { subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"sky-c1-r2"} });
assert.deepStrictEqual(arrow.execution.selectedRowIds, ["W002"]);
assert.deepStrictEqual(executed.at(-1).action, {type:"move_ship_horizontal",shipId:"s1",direction:"right",target:"sky-c1-r2"});

const city = run("E02", { subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["city_hit"]} });
assert.deepStrictEqual(city.execution.selectedRowIds, ["W005"]);
assert.deepStrictEqual(executed.slice(-2).map((item) => item.action.type), ["damage_city","return_ship_to_waiting"]);

const passing = run("E03", { subject:{type:"ship",id:"s1"}, transition:"passed_cell", observed:{tags:["arrow_right"]} });
assert.deepStrictEqual(passing.execution.selectedRowIds, ["W001"]);
assert.strictEqual(passing.execution.results[0].chainDirective, "stop");

const mother = run("E04", { subject:{type:"ship",id:"s2"}, transition:"final_landing", observed:{tags:["mothership_down"]} });
assert.deepStrictEqual(mother.execution.selectedRowIds, ["W003"]);
const skull = run("E05", { subject:{type:"mothership",id:"mother"}, transition:"move_completed", observed:{tags:["skull"]} });
assert.deepStrictEqual(skull.execution.selectedRowIds, ["W004"]);

const explosion = run("E06", { subject:{type:"ship",id:"s3"}, transition:"final_landing", observed:{tags:["explosion"]} });
assert.deepStrictEqual(explosion.execution.selectedRowIds, ["W006"]);
assert.strictEqual(explosion.execution.results[0].emittedResults.length, 0);

const aaZero = run("E07", { subject:{type:"ship_group"}, transition:"descent_computed", observed:{descent:0} });
assert.deepStrictEqual(aaZero.execution.selectedRowIds, ["W007"]);
const white = run("E08", { subject:{type:"die",color:"white"}, transition:"placement_chain_settled", observed:{} });
assert.deepStrictEqual(white.execution.selectedRowIds, ["W008"]);

const unknown = run("E09", { subject:{type:"ship",id:"s4"}, transition:"final_landing", observed:{tags:["unknown_symbol"]} });
assert.deepStrictEqual(unknown.execution.selectedRowIds, []);
assert.strictEqual(unknown.execution.abstained, true);

const forbidden = structuredClone(arrow.response);
forbidden.selections[0].nextAction = "move right";
assert.strictEqual(validateAgentResponse({ eventId:"E01", localFact:{ subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"sky-c1-r2"} }, response:forbidden, compiled }).ok, false);

const falseEvidence = structuredClone(arrow.response);
falseEvidence.selections[0].evidence.find((item) => item.factPath === "transition").observedValue = "passed_cell";
assert.strictEqual(validateAgentResponse({ eventId:"E01", localFact:{ subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"sky-c1-r2"} }, response:falseEvidence, compiled }).ok, false);

const consumed = new Set();
executeSelectedRows({ eventId:"E10", localFact:{ subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"x"} }, response:referenceSelectRows({eventId:"E10",localFact:{ subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"x"} },publicRows:compiled.publicRows}), compiled, consumed, executor });
assert.throws(() => executeSelectedRows({ eventId:"E10", localFact:{ subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"x"} }, response:referenceSelectRows({eventId:"E10",localFact:{ subject:{type:"ship",id:"s1"}, transition:"final_landing", observed:{tags:["arrow_right"],arrowTarget:"x"} },publicRows:compiled.publicRows}), compiled, consumed, executor }), /already consumed/);

assert.strictEqual(compiled.publicRows.some((row) => Object.hasOwn(row, "emit")), false);
console.log(JSON.stringify({status:"PASS",tests:12,rows:compiled.publicRows.length,publicRowsHash:compiled.publicRowsHash},null,2));
