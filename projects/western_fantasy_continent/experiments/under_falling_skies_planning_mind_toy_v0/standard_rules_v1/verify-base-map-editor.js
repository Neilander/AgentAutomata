"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "base-map-editor.html"), "utf8");
const css = fs.readFileSync(path.join(root, "base-map-editor.css"), "utf8");
const js = fs.readFileSync(path.join(root, "base-map-editor.js"), "utf8");

const requiredIds = [
  "boardGrid",
  "cellForm",
  "roomType",
  "roomId",
  "unlockIndex",
  "pathOrder",
  "exportButton",
  "jsonPreview",
];

for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) throw new Error(`HTML 缺少 #${id}`);
}
if (!html.includes("base-map-editor.css") || !html.includes("base-map-editor.js")) throw new Error("HTML 未正确引用资源");
if (!css.includes("grid-template-columns: repeat(5")) throw new Error("基地板不是固定五列");
if (!js.includes('schema: "ufs_base_map_entry_v1"')) throw new Error("导出 schema 不正确");
if (!js.includes("excavatorPath") || !js.includes("startExcavatorIndex")) throw new Error("缺少挖掘路径输出");
if (!js.includes("sourceCells")) throw new Error("缺少可继续编辑的数据");

console.log("PASS base-map-editor static checks");
