#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const GAME = require("./five-day-raid-core.js");

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.resolve(file), "utf8"));
}

function writeJson(file, value) {
  fs.writeFileSync(path.resolve(file), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function printView(state) {
  const view = GAME.getPlayerObservation(state);
  const lines = [];
  lines.push(`# 第${view.time.day}日｜今日剩余行动 ${view.time.actionsRemainingToday}`);
  lines.push(view.situation);
  lines.push(`出战：${view.party.active.map((row) => `${row.name}(${row.visiblePower})`).join("、")}`);
  lines.push(`候补：${view.party.reserve.map((row) => row.name).join("、") || "无"}`);
  lines.push(`资源：金币${view.resources.gold} 药品${view.resources.medicine} 镇民支持${view.resources.townFavor} 证据${view.resources.evidence}`);
  lines.push(`背包：${view.inventory.length}件`);
  lines.push("");
  lines.push("## 已知地点");
  for (const place of view.places) {
    lines.push(`- [${place.status}] ${place.title}｜${place.area}`);
    lines.push(`  ${place.scene}`);
  }
  lines.push("");
  lines.push("## 当前迹象");
  for (const signal of view.threatSignals) lines.push(`- ${signal}`);
  lines.push("");
  lines.push("## 最近发生");
  for (const signal of view.recentSignals) lines.push(`- ${signal}`);
  lines.push("");
  lines.push("## 现在可以做");
  for (const action of view.actions) {
    const mark = action.actionPointMark ? "｜占用今日行动" : action.endsCurrentDay ? "｜结束本日" : "";
    lines.push(`- ${action.id}｜${action.label}${mark}`);
  }
  if (view.result) lines.push(`\n结算：${view.result.win ? "胜利" : "失败"}｜${view.result.explanation}`);
  return lines.join("\n");
}

function usage() {
  console.error("用法：node five-day-raid-cli.js init <session.json> [seed]");
  console.error("      node five-day-raid-cli.js view <session.json> [view.txt]");
  console.error("      node five-day-raid-cli.js action <session.json> <opaque-action-id>");
  process.exit(2);
}

const [, , command, sessionFile, arg] = process.argv;
if (!command || !sessionFile) usage();

if (command === "init") {
  const state = GAME.createInitialState(arg || "player-session");
  writeJson(sessionFile, state);
  console.log(printView(state));
} else if (command === "view") {
  const text = printView(readJson(sessionFile));
  if (arg) fs.writeFileSync(path.resolve(arg), `${text}\n`, "utf8");
  console.log(text);
} else if (command === "action") {
  if (!arg) usage();
  const before = readJson(sessionFile);
  const after = GAME.applyPlayerAction(before, arg);
  writeJson(sessionFile, after);
  console.log(printView(after));
} else usage();
