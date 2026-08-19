"use strict";
const MAP=require("../fixtures/roswell-threat-0-map");
const {createBeamPlayer}=require("./beam-player");
const {runEpisode}=require("./episode-runner");
const SUITES=require("./seed-suites");
const seed=Number(process.env.UFS_SEED||SUITES.smoke[0]);
const game=runEpisode({map:MAP,seed,policyFactory:(map)=>createBeamPlayer(map),trace:true});
const rows=[];
for(const step of game.trace){
  const o=step.observation;
  rows.push({round:o.round,phase:o.phase,energy:o.energy,damage:o.damage,research:o.researchIndex,excavator:o.excavatorIndex,mothership:o.mothershipRow,nearestShip:o.ships.length?Math.max(...o.ships.map((s)=>s.row)):null,action:step.choice.actionId,predicted:step.choice.rationale?.predicted||null});
}
console.log(JSON.stringify({result:game.result,reason:game.reason,round:game.round,final:game.final,steps:rows},null,2));
