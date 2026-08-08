"use strict";

// A compact, rule-faithful tutorial board for the planning experiment.
// It keeps the official core room types and timing while omitting campaign content.
const COLUMNS = 5;
const CITY_ROW = 10;
const MAX_ENERGY = 7;
const MAX_DAMAGE = 5;
const RESEARCH_TARGET = 12;
const MAX_EXCAVATION = 6;
const MOTHERSHIP_LIMIT = 8;

const ROOMS = Object.freeze([
  { id: "energy-c0-d0", column: 0, depth: 0, type: "energy", modifier: 0, energyCost: 0 },
  { id: "research-c0-d2", column: 0, depth: 2, type: "research", modifier: 1, energyCost: 2 },
  { id: "fighter-c0-d5", column: 0, depth: 5, type: "fighter", modifier: 2, energyCost: 2 },

  { id: "research-c1-d0", column: 1, depth: 0, type: "research", modifier: 0, energyCost: 1 },
  { id: "fighter-c1-d2", column: 1, depth: 2, type: "fighter", modifier: 1, energyCost: 1 },
  { id: "energy-c1-d5", column: 1, depth: 5, type: "energy", modifier: 2, energyCost: 0 },

  { id: "fighter-c2-d0", column: 2, depth: 0, type: "fighter", modifier: 0, energyCost: 1 },
  { id: "energy-c2-d3", column: 2, depth: 3, type: "energy", modifier: 2, energyCost: 0 },
  { id: "research-c2-d6", column: 2, depth: 6, type: "research", modifier: 3, energyCost: 2 },

  { id: "energy-c3-d0", column: 3, depth: 0, type: "energy", modifier: 0, energyCost: 0 },
  { id: "research-c3-d3", column: 3, depth: 3, type: "research", modifier: 2, energyCost: 2 },
  { id: "fighter-c3-d6", column: 3, depth: 6, type: "fighter", modifier: 3, energyCost: 2 },

  { id: "research-c4-d0", column: 4, depth: 0, type: "research", modifier: -1, energyCost: 1 },
  { id: "energy-c4-d2", column: 4, depth: 2, type: "energy", modifier: 1, energyCost: 0 },
  { id: "fighter-c4-d5", column: 4, depth: 5, type: "fighter", modifier: 2, energyCost: 2 },
]);

const EXPLOSION_SPACES = Object.freeze([
  { 3: 2, 6: 4, 8: 5 },
  { 2: 2, 5: 3, 8: 5 },
  { 4: 3, 7: 4, 9: 5 },
  { 3: 2, 6: 4, 8: 5 },
  { 2: 2, 5: 3, 8: 5 },
]);

const MOTHERSHIP_EVENTS = Object.freeze([
  "none",
  "spawn_white",
  "research_back",
  "damage",
  "spawn_white",
  "excavator_back",
  "damage",
  "none",
]);

const ROOM_TEXTS = Object.freeze({
  aa: "使用防空火力减慢这一列的敌机，降低城市立刻受伤的风险",
  energy: "生产能源，为研究、战斗机和基地设施提供后续运行资源",
  research: "推进武器研究，向在母舰抵达前完成最终研究的胜利目标前进",
  fighter: "启动战斗机，击毁进入爆炸射程的敌机并保护城市",
  excavate: "向地下挖掘基地，暂时牺牲行动以解锁更强的长期房间",
});

module.exports = {
  CITY_ROW,
  COLUMNS,
  EXPLOSION_SPACES,
  MAX_DAMAGE,
  MAX_ENERGY,
  MAX_EXCAVATION,
  MOTHERSHIP_EVENTS,
  MOTHERSHIP_LIMIT,
  RESEARCH_TARGET,
  ROOMS,
  ROOM_TEXTS,
};
