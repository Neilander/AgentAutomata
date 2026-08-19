"use strict";

const fs = require("fs");
const path = require("path");

const root = __dirname;
const html = fs.readFileSync(path.join(root, "sky-city-map-editor.html"), "utf8");
const css = fs.readFileSync(path.join(root, "sky-city-map-editor.css"), "utf8");
const js = fs.readFileSync(path.join(root, "sky-city-map-editor.js"), "utf8");

for (const id of [
  "tileTabs", "skyRows", "skyCellForm", "railForm", "cityId", "maxDamage",
  "startEnergy", "maxEnergy", "researchCosts", "validationMessages", "jsonPreview",
]) {
  if (!html.includes(`id="${id}"`)) throw new Error(`HTML 缺少 #${id}`);
}
if (!html.includes("sky-city-map-model.js") || !html.includes("sky-city-map-editor.js")) throw new Error("HTML 缺少脚本引用");
if (!css.includes("grid-template-columns: repeat(5") || !css.includes(".rail-cell")) throw new Error("天空五列或侧轨布局缺失");
if (!js.includes("ufs_base_map_entry_v1") || !js.includes("Model.validateState")) throw new Error("旧基地兼容或数据校验缺失");

console.log("PASS sky-city-map-editor static checks");
