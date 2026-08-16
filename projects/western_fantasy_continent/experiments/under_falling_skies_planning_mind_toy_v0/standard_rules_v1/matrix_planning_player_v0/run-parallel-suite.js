"use strict";
const path=require("path");
const {execFile}=require("child_process");
const SUITES=require("./seed-suites");
const {summarize}=require("./episode-runner");

async function main(){
  const suiteName=process.env.UFS_SUITE||"smoke";
  const offset=Number(process.env.UFS_OFFSET||0);
  const limit=Number(process.env.UFS_LIMIT||SUITES[suiteName]?.length||0);
  const concurrency=Number(process.env.UFS_CONCURRENCY||4);
  if(!SUITES[suiteName])throw new Error(`unknown suite ${suiteName}`);
  const seeds=SUITES[suiteName].slice(offset,offset+limit);
  const started=Date.now();
  const games=Array(seeds.length);
  let cursor=0;
  async function worker(){
    while(true){
      const index=cursor++;
      if(index>=seeds.length)return;
      games[index]=await runOne(seeds[index]);
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,seeds.length)},worker));
  console.log(JSON.stringify({schema:"ufs_matrix_planning_parallel_suite_v0",suite:suiteName,offset,concurrency,informationBoundary:{workerKnowsHiddenSeed:true,policyReceivesSeed:false,policyReceivesRngState:false,policyReceivesFutureDice:false},summary:summarize(games),elapsedMs:Date.now()-started,games:process.env.UFS_GAMES==="1"?games:undefined},null,2));
}

function runOne(seed){
  return new Promise((resolve,reject)=>execFile(process.execPath,[path.join(__dirname,"run-one-worker.js"),String(seed)],{cwd:__dirname,maxBuffer:1024*1024},(error,stdout,stderr)=>{
    if(error)return reject(new Error(`${error.message}\n${stderr}`));
    try{resolve(JSON.parse(stdout));}catch(parseError){reject(new Error(`invalid worker output: ${parseError.message}\n${stdout}`));}
  }));
}

if(require.main===module)main().catch((error)=>{console.error(error.stack||error.message);process.exitCode=1;});
