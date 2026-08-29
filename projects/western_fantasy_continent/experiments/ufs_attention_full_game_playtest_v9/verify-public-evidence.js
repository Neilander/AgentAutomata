"use strict";
const fs = require("node:fs");
const path = require("node:path");
const dir = __dirname;
const lines = fs.readFileSync(path.join(dir,"machine-records.ndjson"),"utf8").trim().split(/\r?\n/).map(JSON.parse);
if (!lines.length || lines[0].command !== "start" || lines.filter(x=>x.command === "start").length !== 1) throw new Error("start contract");
for (let i=0;i<lines.length;i++) {
  if (lines[i].sequence !== String(i+1).padStart(3,"0")) throw new Error("sequence");
  if (lines[i].exitCode !== 0) throw new Error("exit");
  const p=lines[i].public;
  if (!p || !Array.isArray(p.availableOperations)) throw new Error("public response");
  if (lines[i].command === "advance") {
    const payload=JSON.parse(fs.readFileSync(path.join(dir,lines[i].payloadFile),"utf8"));
    const allowed = lines[i-1].public.availableOperations;
    if (!allowed.includes(payload.type)) throw new Error("operation not offered");
  }
  if (lines[i].command === "random" && lines[i-1].public.status !== "random") throw new Error("random boundary");
}
const last=lines.at(-1).public;
if (!(last.status === "complete" || (last.status === "attention_stop" && last.availableOperations.length === 0))) throw new Error("invalid stop");
console.log("public evidence OK");
