"use strict";

const MAP=require("../fixtures/roswell-threat-0-map");
const {createBeamPlayer}=require("./beam-player");
const {runEpisode,summarize}=require("./episode-runner");
const SUITES=require("./seed-suites");

function main(){
  const suiteName=process.env.UFS_SUITE||"smoke";
  if(!Object.hasOwn(SUITES,suiteName))throw new Error(`unknown suite ${suiteName}`);
  const offset=Number(process.env.UFS_OFFSET||0);
  const limit=Number(process.env.UFS_LIMIT||SUITES[suiteName].length);
  const seeds=SUITES[suiteName].slice(offset,offset+limit);
  const started=Date.now();
  const games=seeds.map((seed,index)=>runEpisode({map:MAP,seed,policyFactory:(map)=>createBeamPlayer(map),trace:index===0&&process.env.UFS_TRACE==="1"}));
  const result={schema:"ufs_matrix_planning_suite_v0",map:MAP.id,suite:suiteName,offset,informationBoundary:{policyReceivesSeed:false,policyReceivesRngState:false,policyReceivesFutureDice:false,candidateRerollModel:"expected_not_actual",policyReceivesExpectedAnswers:false},summary:summarize(games),elapsedMs:Date.now()-started,games:process.env.UFS_GAMES==="1"?games:undefined,exampleTrace:games[0].trace?.length?games[0].trace:undefined};
  console.log(JSON.stringify(result,null,2));
}
if(require.main===module)main();
