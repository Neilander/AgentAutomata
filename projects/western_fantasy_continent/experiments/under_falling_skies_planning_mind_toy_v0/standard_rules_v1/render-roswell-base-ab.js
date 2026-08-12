"use strict";

const fs = require("fs");
const path = require("path");
const base = require("./fixtures/roswell-base-ab");

const colors = {
  aa: "#c9d0d0",
  energy: "#eacb46",
  fighter: "#ed7545",
  research: "#68c96b",
  robot: "#64aee3",
  tunnel: "#655f59",
};
const labels = {
  aa: "防空",
  energy: "能源",
  fighter: "战斗机",
  research: "研究",
  robot: "机器人",
  tunnel: "通道",
};

const width = 1420;
const height = 1160;
const marginX = 80;
const boardTop = 125;
const cellW = 240;
const cellH = 138;
const gap = 10;
const boardGap = 80;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&apos;",
  })[character]);
}

function roomById(id) {
  return base.rooms.find((room) => room.id === id);
}

const multiRoomLabels = new Map(
  base.rooms.filter((room) => room.cellIds.length > 1).map((room, index) => [room.id, `G${index + 1}`]),
);

function cellPosition(cell) {
  const tileOffset = cell.tile === "A" ? 0 : 3 * (cellH + gap) + boardGap;
  return {
    x: marginX + cell.column * (cellW + gap),
    y: boardTop + tileOffset + cell.row * (cellH + gap),
  };
}

const svg = [];
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
svg.push(`<rect width="100%" height="100%" fill="#07151b"/>`);
svg.push(`<text x="${marginX}" y="55" fill="#ecf7f6" font-family="Microsoft YaHei, sans-serif" font-size="30" font-weight="700">Roswell 基地 A+B 数据复原图</text>`);
svg.push(`<text x="${marginX}" y="88" fill="#8fb0b4" font-family="Microsoft YaHei, sans-serif" font-size="16">完整黄色通道从 A 右上开始蛇形，到 B 右下结束；圆圈 0-19 是开局后仍需挖掘的距离。</text>`);

for (const tile of ["A", "B"]) {
  const y = tile === "A" ? boardTop - 20 : boardTop + 3 * (cellH + gap) + boardGap - 20;
  svg.push(`<text x="25" y="${y + 65}" fill="#f2ca62" font-family="Microsoft YaHei, sans-serif" font-size="30" font-weight="700">${tile}</text>`);
}

// Draw the excavation tunnel behind cells.
const pathPoints = base.fullRoute.map((id) => {
  const cell = base.cells.find((candidate) => candidate.id === id);
  const position = cellPosition(cell);
  return `${position.x + cellW / 2},${position.y + cellH / 2}`;
});
svg.push(`<polyline points="${pathPoints.join(" ")}" fill="none" stroke="#f1cf58" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".42"/>`);

for (const cell of base.cells) {
  const room = roomById(cell.roomId);
  const { x, y } = cellPosition(cell);
  const color = colors[room.type];
  const pathOrder = base.excavatorPath.indexOf(cell.id);
  const stats = [
    room.modifier ? (room.modifier > 0 ? `+${room.modifier}` : room.modifier) : null,
    room.energyCost ? `耗能 ${room.energyCost}` : null,
  ].filter(Boolean).join(" · ");
  svg.push(`<rect x="${x}" y="${y}" width="${cellW}" height="${cellH}" rx="12" fill="#10262e" stroke="${color}" stroke-width="4"/>`);
  svg.push(`<rect x="${x}" y="${y + cellH - 8}" width="${cellW}" height="8" rx="4" fill="${color}"/>`);
  svg.push(`<text x="${x + 16}" y="${y + 27}" fill="#7fa1a6" font-family="Microsoft YaHei, sans-serif" font-size="13">${cell.tile} · 行${cell.row + 1} · 列${cell.column + 1}</text>`);
  svg.push(`<text x="${x + 16}" y="${y + 67}" fill="${color}" font-family="Microsoft YaHei, sans-serif" font-size="22" font-weight="700">${labels[room.type]}</text>`);
  if (stats) svg.push(`<text x="${x + 16}" y="${y + 98}" fill="#d9e8e8" font-family="Microsoft YaHei, sans-serif" font-size="16">${escapeXml(stats)}</text>`);
  if (room.cellIds.length > 1) svg.push(`<text x="${x + 16}" y="${y + 121}" fill="#9db6b9" font-family="Microsoft YaHei, sans-serif" font-size="12">多格房 ${multiRoomLabels.get(room.id)}（共${room.cellIds.length}格）</text>`);
  if (pathOrder >= 0) {
    svg.push(`<circle cx="${x + cellW - 27}" cy="${y + 28}" r="20" fill="#f1cf58" stroke="#07151b" stroke-width="3"/>`);
    svg.push(`<text x="${x + cellW - 27}" y="${y + 35}" text-anchor="middle" fill="#07151b" font-family="Arial, sans-serif" font-size="19" font-weight="700">${pathOrder}</text>`);
  } else {
    svg.push(`<text x="${x + cellW - 15}" y="${y + 27}" text-anchor="end" fill="#72dbca" font-family="Microsoft YaHei, sans-serif" font-size="12">初始开放</text>`);
  }
}

svg.push(`<text x="${marginX}" y="1130" fill="#8fb0b4" font-family="Microsoft YaHei, sans-serif" font-size="15">完整路线：A右上向左 → 向右 → 到 A 右侧起点 0 后向左 → B 向右 → 向左 → 到右下结束。</text>`);
svg.push("</svg>");

const outputDir = path.join(__dirname, "artifacts");
fs.mkdirSync(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "roswell-base-ab-review.svg");
fs.writeFileSync(outputPath, svg.join("\n"), "utf8");
console.log(outputPath);
