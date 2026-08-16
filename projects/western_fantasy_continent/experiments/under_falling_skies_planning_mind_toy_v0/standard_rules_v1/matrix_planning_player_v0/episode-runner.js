"use strict";

const ENGINE=require("../standard-engine");
const API=require("./player-api");

function runEpisode({map,seed,policyFactory,trace=false,maxDecisions=300}){
  let state=ENGINE.createGame(map,seed);
  const policy=policyFactory(map);
  const decisions=[];
  let guard=0;
  while(!state.outcome&&guard<maxDecisions){
    const observation=API.publicObservation(map,state);
    const safety=API.assertObservationSafe(observation);
    if(!safety.ok)throw new Error(`unsafe observation: ${safety.violations.join(",")}`);
    const legalActions=API.publicLegalActions(map,state);
    if(!legalActions.length)throw new Error(`no public legal actions during ${state.phase}`);
    const choice=policy.chooseAction({observation:structuredClone(observation),legalActions:structuredClone(legalActions)});
    if(!choice||!legalActions.some((action)=>action.id===choice.actionId))throw new Error(`invalid policy choice: ${choice?.actionId}`);
    if(trace)decisions.push({observation,legalActionCount:legalActions.length,choice:structuredClone(choice)});
    state=API.applyPublicAction(map,state,choice.actionId,policy);
    guard+=1;
  }
  if(guard>=maxDecisions)throw new Error(`decision guard exceeded seed=${seed}`);
  return {seed,result:state.outcome.result,reason:state.outcome.reason,round:state.round,decisions:guard,final:{energy:state.energy,damage:state.damage,research:state.researchIndex,excavator:state.excavatorIndex,mothership:state.mothershipRow},trace:decisions};
}

function summarize(games){
  const wins=games.filter((game)=>game.result==="win").length;
  return {games:games.length,wins,losses:games.length-wins,winRate:wins/games.length,meanRound:mean(games.map((g)=>g.round)),meanResearch:mean(games.map((g)=>g.final.research)),meanExcavator:mean(games.map((g)=>g.final.excavator)),lossReasons:games.filter((g)=>g.result!=="win").reduce((out,g)=>({...out,[g.reason]:(out[g.reason]||0)+1}),{})};
}

function mean(values){return Math.round(values.reduce((a,b)=>a+b,0)/values.length*1e6)/1e6;}
module.exports={runEpisode,summarize};
