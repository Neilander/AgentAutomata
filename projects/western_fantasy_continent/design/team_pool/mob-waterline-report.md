# Mob Waterline Report

这是一组生成小怪强度尺。每支生成队都按打赢固定 preset 的数量分桶；任何新队都可以打这组水表来获得强度分。

## Summary

- Teams: 500
- Evaluated candidates: 2400
- Fixed presets used for scoring: 17

| Bucket | Count | Target | Avg Score | Meaning |
| --- | ---: | ---: | ---: | --- |
| 0-2 | 100 | 100 | 0.48 | trash / low pressure |
| 3-7 | 160 | 160 | 4.62 | normal mobs |
| 8-12 | 140 | 140 | 9.89 | elite mobs |
| 13-14 | 70 | 70 | 13.46 | boss candidates |
| 15-17 | 30 | 30 | 15.57 | apex / anomaly mobs |

## Examples

### 0-2

- mob-001: 三前排一后排 mob-candidate-b1-001; score 0/17; beats -
- mob-002: 控制爆发 mob-candidate-b1-003; score 0/17; beats -
- mob-003: 一核心三保护 mob-candidate-b1-005; score 0/17; beats -
- mob-004: 两前排两后排 mob-candidate-b1-008; score 0/17; beats -
- mob-005: 随机职业 mob-candidate-b1-012; score 0/17; beats -
- mob-006: 状态铺设与引爆 mob-candidate-b1-013; score 0/17; beats -

### 3-7

- mob-101: 状态铺设与引爆 mob-candidate-b1-006; score 3/17; beats holySustain, ironWall, martyrFrontline
- mob-102: 一核心三保护 mob-candidate-b1-015; score 3/17; beats cavalryBreak, martyrFrontline, scarletVanguard
- mob-103: 一核心三保护 mob-candidate-b1-028; score 3/17; beats bulwarkMarks, cavalryBreak, duelChampion
- mob-104: 两前排两后排 mob-candidate-b1-030; score 3/17; beats cavalryBreak, holySustain, purgeAttrition
- mob-105: 两前排两后排 mob-candidate-b1-050; score 3/17; beats bulwarkMarks, martyrFrontline, purgeAttrition
- mob-106: 状态铺设与引爆 mob-candidate-b1-061; score 3/17; beats alchemyChaos, bulwarkMarks, cavalryBreak

### 8-12

- mob-261: 四前排 mob-candidate-b1-007; score 8/17; beats bloodRage, bulwarkMarks, cavalryBreak, duelChampion, ironWall, lightningTempo, martyrFrontline, scarletVanguard
- mob-262: 三前排一后排 mob-candidate-b1-014; score 8/17; beats bulwarkMarks, duelChampion, frostControl, ironWall, lightningTempo, martyrFrontline, purgeAttrition, shadowExecute
- mob-263: 两前排两后排 mob-candidate-b1-055; score 8/17; beats bulwarkMarks, crownCarry, duelChampion, frostControl, holySustain, ironWall, martyrFrontline, purgeAttrition
- mob-264: 三前排一后排 mob-candidate-b1-081; score 8/17; beats bulwarkMarks, cavalryBreak, crownCarry, duelChampion, holySustain, ironWall, lightningTempo, purgeAttrition
- mob-265: 三前排一后排 mob-candidate-b1-103; score 8/17; beats bloodRage, bulwarkMarks, holySustain, ironWall, lightningTempo, purgeAttrition, scarletVanguard, shadowExecute
- mob-266: 四前排 mob-candidate-b1-115; score 8/17; beats bloodRage, bulwarkMarks, cavalryBreak, duelChampion, holySustain, ironWall, martyrFrontline, scarletVanguard

### 13-14

- mob-401: 一前排三后排 mob-candidate-b1-033; score 13/17; beats bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-402: 四前排 mob-candidate-b1-107; score 13/17; beats bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, shadowExecute
- mob-403: 随机职业 mob-candidate-b1-147; score 13/17; beats bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostTrapField, holySustain, ironWall, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute
- mob-404: 四前排 mob-candidate-b1-171; score 13/17; beats alchemyChaos, bulwarkMarks, cavalryBreak, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, shadowExecute
- mob-405: 状态铺设与引爆 mob-candidate-b1-177; score 13/17; beats bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, poisonBloom, purgeAttrition
- mob-406: 控制爆发 mob-candidate-b10-036; score 13/17; beats bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostControl, frostTrapField, holySustain, ironWall, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute

### 15-17

- mob-471: 两前排两后排 mob-candidate-b1-108; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, shadowExecute
- mob-472: 两前排两后排 mob-candidate-b10-176; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-473: 状态铺设与引爆 mob-candidate-b11-132; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-474: 四前排 mob-candidate-b12-022; score 15/17; beats bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-475: 一前排三后排 mob-candidate-b2-032; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-476: 两前排两后排 mob-candidate-b2-049; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute

