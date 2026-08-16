"use strict";

const ENGINE = require("../standard-engine");
const API = require("./player-api");

function createBeamPlayer(map, options = {}) {
  const config = {
    diceBeam: options.diceBeam || 200,
    finalDiceNodes: options.finalDiceNodes || 48,
    roomBeam: options.roomBeam || 32,
  };
  let cachedPlan = [];
  let lastPlan = null;
  let forceReplan = false;
  return {
    id: "matrix-planning-beam-v0",
    chooseAction({ observation, legalActions }) {
      const safe = API.assertObservationSafe(observation);
      if (!safe.ok) throw new Error(`hidden observation fields: ${safe.violations.join(",")}`);
      const legalIds = new Set(legalActions.map((action) => action.id));
      if (forceReplan) {
        cachedPlan = [];
        forceReplan = false;
      }
      while (cachedPlan.length && !legalIds.has(cachedPlan[0])) cachedPlan = [];
      if (!cachedPlan.length) {
        lastPlan = planRound(map, observation, config);
        cachedPlan = [...lastPlan.actionIds];
      }
      const actionId = cachedPlan.shift();
      if (!legalIds.has(actionId)) throw new Error(`planner produced illegal public action: ${actionId}`);
      const selected = legalActions.find((action) => action.id === actionId);
      if (selected?.kind === "worker_placement" && selected.placement.dieColor === "white") forceReplan = true;
      return { actionId, rationale: lastPlan?.rationale || null };
    },
    chooseSpawnColumn({ candidates, observation }) {
      return chooseSpawnColumn(map, observation, candidates);
    },
    debugState() { return { cachedPlan:[...cachedPlan], lastPlan:structuredClone(lastPlan) }; },
  };
}

function planRound(map, observation, config) {
  const state = beliefStateFromObservation(observation);
  if (state.phase === "mothership") return { actionIds:["environment:resolve_mothership"], score:scoreState(map,state), rationale:{phase:"automatic_environment"} };
  if (state.phase === "rooms") return planRooms(map, state, config);

  let nodes = [{ state, actions:[] }];
  while (nodes[0]?.state.phase === "dice") {
    const expanded = [];
    for (const node of nodes) {
      for (const placement of ENGINE.allLegalWorkerPlacements(map, node.state)) {
        const next = ENGINE.applyWorkerPlacement(map, node.state, placement, {rerollMode:"expected"});
        expanded.push({state:next,actions:[...node.actions,`worker:${placement.id}`],score:scorePartial(map,next)});
      }
    }
    nodes = topDistinct(expanded, config.diceBeam, planningKey);
    if (!nodes.length) throw new Error("dice beam exhausted");
    if (nodes.every((node) => node.state.phase !== "dice" || node.state.outcome)) break;
  }

  const finalists = [...nodes].sort((a,b)=>b.score-a.score).slice(0,config.finalDiceNodes);
  const routes = finalists.map((node)=> {
    if (node.state.outcome) return {...node,finalScore:scoreState(map,node.state),roomActions:[]};
    const roomPlan = planRooms(map,node.state,config);
    return {state:roomPlan.finalState,actions:node.actions,roomActions:roomPlan.actionIds,finalScore:roomPlan.score};
  });
  routes.sort((a,b)=>b.finalScore-a.finalScore || a.actions.join("|").localeCompare(b.actions.join("|")));
  const best = routes[0];
  return {
    actionIds:[...best.actions,...best.roomActions],
    score:round(best.finalScore),
    rationale:{phase:"round_beam",diceBeam:config.diceBeam,consideredFinalDiceNodes:finalists.length,predicted:stateSummary(best.state)},
  };
}

function planRooms(map, state, config) {
  if (state.outcome) return {actionIds:[],score:scoreState(map,state),finalState:state,rationale:{phase:"terminal"}};
  let frontier=[{state,actions:[],score:scorePartial(map,state)}];
  const finished=[];
  for(let depth=0;depth<12&&frontier.length;depth+=1){
    const expanded=[];
    for(const node of frontier){
      if(node.state.outcome){finished.push({...node,finalState:node.state,finalScore:scoreState(map,node.state)});continue;}
      const actions=ENGINE.legalRoomActions(map,node.state)
        .filter((action)=>action.affordable!==false&&action.roomType!=="robot")
        .filter((action)=>!["skip_worker","remove_robot"].includes(action.type));
      for(const action of actions){
        let next;
        try{next=ENGINE.applyRoomAction(map,node.state,action);}catch{continue;}
        const actionId=API.roomActionId(action);
        if(next.outcome){finished.push({state:next,actions:[...node.actions,actionId],finalState:next,finalScore:scoreState(map,next)});continue;}
        if(next.phase==="mothership"){
          const afterMother=resolveMothershipForPlan(map,next);
          finished.push({state:next,actions:[...node.actions,actionId],finalState:afterMother,finalScore:scoreState(map,afterMother)});
        }else expanded.push({state:next,actions:[...node.actions,actionId],score:scorePartial(map,next)});
      }
    }
    frontier=topDistinct(expanded,config.roomBeam,planningKey);
  }
  if(!finished.length){
    for(const node of frontier){
      const end=ENGINE.applyRoomAction(map,node.state,{type:"end_rooms"});
      const after=resolveMothershipForPlan(map,end);
      finished.push({state:end,actions:[...node.actions,"room:end_rooms"],finalState:after,finalScore:scoreState(map,after)});
    }
  }
  finished.sort((a,b)=>b.finalScore-a.finalScore||a.actions.join("|").localeCompare(b.actions.join("|")));
  const best=finished[0];
  return {actionIds:best.actions,score:best.finalScore,finalState:best.finalState,rationale:{phase:"room_beam",predicted:stateSummary(best.finalState)}};
}

function scorePartial(map,state){
  let score=scoreState(map,state);
  const indexes=new Map(map.base.rooms.map((room)=>[room.id,room]));
  for(const placement of state.placements.filter((item)=>!item.resolved)){
    if(placement.excavationCandidate){
      const excavationTarget=state.researchIndex>=8?18:8;
      const usefulDistance=Math.max(0,Math.min(excavationTarget,placement.excavationDistance+state.excavatorIndex)-Math.min(excavationTarget,state.excavatorIndex));
      score+=300*usefulDistance;
      continue;
    }
    const room=indexes.get(placement.roomId);
    if(!room)continue;
    if(room.type==="research")score+=95*placement.dieValue;
    if(room.type==="energy")score+=55*placement.dieValue;
    if(room.type==="fighter")score+=(35+12*shipPressure(map,state))*placement.dieValue;
  }
  for(const room of map.base.rooms){
    const occupied=room.cellIds.filter((cellId)=>state.placements.some((placement)=>!placement.resolved&&!placement.excavationCandidate&&placement.cellId===cellId)).length;
    if(occupied===room.cellIds.length&&room.cellIds.length>1){
      if(room.type==="research"){
        const profile=finishRoomProfile(map,state,room);
        score+=profile.canFinishNow?16000+profile.margin*1400:900;
      }
      if(room.type==="energy")score+=350;
      if(room.type==="fighter")score+=300;
    }
  }
  return score;
}

function scoreState(map,state){
  if(state.outcome?.result==="win")return 1e9-state.round*1000-state.damage*100;
  if(state.outcome?.result==="loss")return -1e9-state.round*1000;
  const research=state.researchIndex;
  const excavator=state.excavatorIndex;
  const deepExcavationValue=research>=8?380:40;
  let score=research*1550+Math.min(excavator,8)*430+Math.max(0,Math.min(excavator,18)-8)*deepExcavationValue+state.energy*150;
  score-=state.damage*2400;
  // A sky-triggered mothership drop permanently removes roughly one full
  // future round.  Treat it as a route-level catastrophe, not a small cost.
  score-=Math.max(0,state.mothershipRow+1)*6000;
  score-=shipPressure(map,state)*1800;
  if(excavator<8)score-=(8-excavator)*180;
  if(research>=12&&excavator>=8)score+=1800;
  const finish=finishReadiness(map,state);
  if(finish.unlockedRooms.length)score+=2000;
  if(research>=12&&finish.bestUnlockedCellCount>=3)score+=3000;
  if(research>=15){
    // Research 15/16 is not an achievement by itself: it is a pending 11-point
    // bill.  Reward only concrete access to a multi-space room and enough
    // energy to pay it, then punish running out of safe mothership phases.
    score+=finish.unlockedRooms.length?4500:-3000;
    if(finish.bestUnlockedCellCount>=3)score+=2500;
    score-=finish.energyShortfall*2500;
    // One remaining safe phase still means "win during the next room phase";
    // only zero means that another mothership resolution is fatal.
    if(finish.safeMotherPhases<=0)score-=9000;
    else if(finish.safeMotherPhases===1)score-=1200;
  }
  score-=state.round*15;
  return score;
}

function shipPressure(map,state){
  return state.ships.reduce((sum,ship)=>sum+Math.pow((ship.row+1)/map.sky.cityRow,2),0);
}

function spawnColumnScore(map,observation,column){
  const cell=map.sky.rows.find((row)=>row.index===map.sky.dropRow)?.cells?.[column];
  const existing=observation.ships.filter((ship)=>ship.column===column);
  return (cell?.explosion!=null?1:0)-existing.length*2;
}

function chooseSpawnColumn(map,observation,candidates){
  return [...candidates].sort((a,b)=>spawnColumnScore(map,observation,b)-spawnColumnScore(map,observation,a)||a-b)[0];
}

function resolveMothershipForPlan(map,state){
  return ENGINE.resolveMothership(map,state,{
    startNextRound:false,
    // Use the exact same public-state policy as real execution.  The callback
    // receives the incrementally updated state, so multiple spawns do not all
    // reason from the pre-spawn snapshot.
    spawnPolicy:({candidates,state:spawnState})=>chooseSpawnColumn(map,spawnState,candidates),
  });
}

function remainingResearchCost(map,researchIndex){
  return map.research.costs.slice(researchIndex).reduce((sum,cost)=>sum+cost,0);
}

function finishRoomProfile(map,state,room){
  const placements=room.cellIds.map((cellId)=>state.placements.find((placement)=>!placement.resolved&&!placement.excavationCandidate&&placement.cellId===cellId));
  const value=placements.every(Boolean)?placements.reduce((sum,placement)=>sum+placement.dieValue,room.modifier):null;
  const required=remainingResearchCost(map,state.researchIndex);
  return {
    roomId:room.id,
    cellCount:room.cellIds.length,
    required,
    value,
    margin:value==null?null:value-required,
    canFinishNow:value!=null&&value>=required&&state.energy>=room.energyCost,
  };
}

function finishReadiness(map,state){
  const cells=new Map(map.base.cells.map((cell)=>[cell.id,cell]));
  const unlockedRooms=map.base.rooms.filter((room)=>room.type==="research"&&room.cellIds.length>=2&&room.cellIds.every((id)=>cells.get(id).unlockIndex<=state.excavatorIndex));
  const minimumEnergy=unlockedRooms.length?Math.min(...unlockedRooms.map((room)=>room.energyCost)):Infinity;
  return {
    unlockedRooms,
    bestUnlockedCellCount:unlockedRooms.reduce((best,room)=>Math.max(best,room.cellIds.length),0),
    energyShortfall:Number.isFinite(minimumEnergy)?Math.max(0,minimumEnergy-state.energy):0,
    safeMotherPhases:Math.max(0,map.sky.skullRow-state.mothershipRow-1),
    remainingCost:remainingResearchCost(map,state.researchIndex),
  };
}

function beliefStateFromObservation(observation){
  const ids=[...observation.ships,...observation.waitingShips].map((ship)=>ship.id);
  const whiteMax=Math.max(0,...ids.filter((id)=>id.startsWith("white-")).map((id)=>Number(id.split("-")[1])||0));
  const robotMax=Math.max(0,...observation.robots.map((robot)=>Number(String(robot.id).split("-")[1])||0));
  return {
    schema:"ufs_standard_game_state_v1",mapId:observation.mapId,seed:0,rngState:1,
    round:observation.round,phase:observation.phase,energy:observation.energy,damage:observation.damage,
    researchIndex:observation.researchIndex,excavatorIndex:observation.excavatorIndex,mothershipRow:observation.mothershipRow,
    ships:structuredClone(observation.ships),waitingShips:structuredClone(observation.waitingShips),dice:structuredClone(observation.dice),
    placements:structuredClone(observation.placements),robots:structuredClone(observation.robots),
    nextWhiteId:whiteMax+1,nextRobotId:robotMax+1,history:[],outcome:structuredClone(observation.outcome),
  };
}

function topDistinct(nodes,limit,keyFn){
  const sorted=[...nodes].sort((a,b)=>(b.score??scorePartialDummy(b))-(a.score??scorePartialDummy(a))||a.actions.join("|").localeCompare(b.actions.join("|")));
  const seen=new Set();const result=[];
  for(const node of sorted){const key=keyFn(node.state);if(seen.has(key))continue;seen.add(key);result.push(node);if(result.length>=limit)break;}
  return result;
}

function scorePartialDummy(node){return node.score||0;}
function planningKey(state){return JSON.stringify([state.phase,state.energy,state.damage,state.researchIndex,state.excavatorIndex,state.mothershipRow,state.ships.map((s)=>[s.id,s.column,s.row]).sort(),state.dice.map((d)=>[d.id,d.value,d.placed]),state.placements.map((p)=>p.id).sort()]);}
function stateSummary(state){return {round:state.round,phase:state.phase,energy:state.energy,damage:state.damage,research:state.researchIndex,excavator:state.excavatorIndex,mothership:state.mothershipRow,outcome:state.outcome};}
function round(value){return Math.round(value*1e6)/1e6;}

module.exports={beliefStateFromObservation,chooseSpawnColumn,createBeamPlayer,finishReadiness,planRound,resolveMothershipForPlan,scoreState};
