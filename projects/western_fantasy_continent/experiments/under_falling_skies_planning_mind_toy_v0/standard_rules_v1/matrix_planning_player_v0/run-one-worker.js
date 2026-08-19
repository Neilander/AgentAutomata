"use strict";
const MAP=require("../fixtures/roswell-threat-0-map");
const {createBeamPlayer}=require("./beam-player");
const {runEpisode}=require("./episode-runner");
const seed=Number(process.argv[2]);
if(!Number.isInteger(seed))throw new Error("worker requires integer seed");
console.log(JSON.stringify(runEpisode({map:MAP,seed,policyFactory:(map)=>createBeamPlayer(map)})));
