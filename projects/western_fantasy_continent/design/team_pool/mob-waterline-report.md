# Mob Waterline Report

这是一组生成小怪强度尺。每支生成队都按打赢固定 preset 的数量分桶；任何新队都可以打这组水表来获得强度分。

## Summary

- Teams: 500
- Evaluated candidates: 1800
- Fixed presets used for scoring: 17

| Bucket | Count | Target | Avg Score | Meaning |
| --- | ---: | ---: | ---: | --- |
| 0-2 | 100 | 100 | 0.58 | trash / low pressure |
| 3-7 | 160 | 160 | 4.59 | normal mobs |
| 8-12 | 140 | 140 | 9.64 | elite mobs |
| 13-14 | 70 | 70 | 13.24 | boss candidates |
| 15-17 | 30 | 30 | 15.7 | apex / anomaly mobs |

## Examples

### 0-2

- mob-001: 三前排一后排 mob-candidate-b1-001; score 0/17; beats -
- mob-002: 一核心三保护 mob-candidate-b1-003; score 0/17; beats -
- mob-003: 一核心三保护 mob-candidate-b1-007; score 0/17; beats -
- mob-004: 一核心三保护 mob-candidate-b1-012; score 0/17; beats -
- mob-005: 状态铺设与引爆 mob-candidate-b1-015; score 0/17; beats -
- mob-006: 状态铺设与引爆 mob-candidate-b1-019; score 0/17; beats -

### 3-7

- mob-101: 控制爆发 mob-candidate-b1-022; score 3/17; beats holySustain, lightningTempo, purgeAttrition
- mob-102: 状态铺设与引爆 mob-candidate-b1-031; score 3/17; beats bloodRage, martyrFrontline, scarletVanguard
- mob-103: 一前排三后排 mob-candidate-b1-042; score 3/17; beats bloodRage, holySustain, purgeAttrition
- mob-104: 三前排一后排 mob-candidate-b1-050; score 3/17; beats duelChampion, ironWall, shadowExecute
- mob-105: 一核心三保护 mob-candidate-b1-054; score 3/17; beats bloodRage, bulwarkMarks, purgeAttrition
- mob-106: 状态铺设与引爆 mob-candidate-b1-065; score 3/17; beats bloodRage, holySustain, purgeAttrition

### 8-12

- mob-261: 控制爆发 mob-candidate-b1-030; score 8/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, holySustain, ironWall, martyrFrontline, purgeAttrition
- mob-262: 三前排一后排 mob-candidate-b1-047; score 8/17; beats bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, ironWall, lightningTempo, purgeAttrition
- mob-263: 一核心三保护 mob-candidate-b1-049; score 8/17; beats bloodRage, bulwarkMarks, frostTrapField, holySustain, ironWall, lightningTempo, purgeAttrition, scarletVanguard
- mob-264: 随机职业 mob-candidate-b1-082; score 8/17; beats bloodRage, duelChampion, fireBurst, frostControl, holySustain, martyrFrontline, purgeAttrition, scarletVanguard
- mob-265: 四前排 mob-candidate-b1-133; score 8/17; beats bulwarkMarks, cavalryBreak, duelChampion, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard
- mob-266: 一核心三保护 mob-candidate-b1-142; score 8/17; beats bulwarkMarks, cavalryBreak, duelChampion, holySustain, martyrFrontline, poisonBloom, purgeAttrition, shadowExecute

### 13-14

- mob-401: 一前排三后排 mob-candidate-b1-021; score 13/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute
- mob-402: 四前排 mob-candidate-b1-062; score 13/17; beats alchemyChaos, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-403: 随机职业 mob-candidate-b1-078; score 13/17; beats bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, fireBurst, holySustain, ironWall, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute
- mob-404: 状态铺设与引爆 mob-candidate-b1-104; score 13/17; beats alchemyChaos, bloodRage, bulwarkMarks, duelChampion, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute
- mob-405: 两前排两后排 mob-candidate-b1-153; score 13/17; beats bloodRage, bulwarkMarks, crownCarry, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-406: 一核心三保护 mob-candidate-b2-053; score 13/17; beats alchemyChaos, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, fireBurst, frostControl, holySustain, ironWall, martyrFrontline, poisonBloom, purgeAttrition, shadowExecute

### 15-17

- mob-471: 随机职业 mob-candidate-b1-010; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-472: 控制爆发 mob-candidate-b2-158; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-473: 四前排 mob-candidate-b3-035; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard, shadowExecute
- mob-474: 三前排一后排 mob-candidate-b3-106; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, shadowExecute
- mob-475: 三前排一后排 mob-candidate-b4-022; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute
- mob-476: 一核心三保护 mob-candidate-b4-098; score 15/17; beats alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute

