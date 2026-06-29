# Archetype Extreme Matchup Diagnosis

Generated from `design\balance\archetype-matchup-evidence.json`. This report diagnoses extreme ordered matchups; it does not recommend direct numeric changes by itself.

## Summary

- Extreme ordered matchups: 158.
- Ecology health: review; polarization score 0.7451.
- Extreme thresholds: <= 10% or >= 90%.
- Deterministic rule: In deterministic combat, 0/100 is acceptable when the winner has clear cost, clear predators, and causal explanation. Review all-rounders and preyless weak presets first.

## Ecology Review

- 王冠核心 all-rounder-risk: prey 12, predators 0.
- 余烬爆燃 all-rounder-risk: prey 11, predators 0.
- 霜控拖延 all-rounder-risk: prey 10, predators 3.
- 圣盾续航 vulnerable-without-prey: prey 0, predators 10.
- 铁壁反击 vulnerable-without-prey: prey 1, predators 8.
- 殉道前线 vulnerable-without-prey: prey 1, predators 11.
- 毒巢滚雪球 all-rounder-risk: prey 13, predators 1.

| Preset | Status | Hard prey | Hard predators | Advantage categories |
| --- | --- | ---: | ---: | --- |
| 炼金异常 `alchemyChaos` | answered-niche | 8 | 0 | frontloadedDamage, statusScaling, sustainOrCounterplay, tempoControl |
| 低血狂怒 `bloodRage` | answered-niche | 3 | 5 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 壁垒猎标 `bulwarkMarks` | answered-niche | 2 | 7 | frontloadedDamage, tempoControl |
| 王骑破阵 `cavalryBreak` | answered-niche | 3 | 3 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 王冠核心 `crownCarry` | all-rounder-risk | 12 | 0 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 决斗冠军 `duelChampion` | answered-niche | 0 | 5 | - |
| 余烬爆燃 `fireBurst` | all-rounder-risk | 11 | 0 | frontloadedDamage, statusScaling, sustainOrCounterplay, tempoControl |
| 霜控拖延 `frostControl` | all-rounder-risk | 10 | 3 | frontloadedDamage, statusScaling, sustainOrCounterplay, tempoControl |
| 霜陷猎场 `frostTrapField` | polarized-but-answered | 5 | 4 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 圣盾续航 `holySustain` | vulnerable-without-prey | 0 | 10 | - |
| 铁壁反击 `ironWall` | vulnerable-without-prey | 1 | 8 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 急速节奏 `lightningTempo` | answered-niche | 3 | 4 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 殉道前线 `martyrFrontline` | vulnerable-without-prey | 1 | 11 | frontloadedDamage, statusScaling, tempoControl |
| 毒巢滚雪球 `poisonBloom` | all-rounder-risk | 13 | 1 | frontloadedDamage, statusScaling, sustainOrCounterplay, tempoControl |
| 净化消耗 `purgeAttrition` | answered-niche | 2 | 7 | frontloadedDamage, statusScaling, tempoControl |
| 赤血先锋 `scarletVanguard` | answered-niche | 3 | 5 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 暗影处决 `shadowExecute` | answered-niche | 2 | 6 | frontloadedDamage, statusScaling, sustainOrCounterplay |

## Repeated Cause Tags

| Cause tag | Count | Meaning |
| --- | ---: | --- |
| `damageLead` | 136 | 优势方总伤害显著领先 |
| `burstWindow` | 106 | 优势方短窗口爆发过强 |
| `statusSetup` | 82 | 优势方状态铺设量大 |
| `lowCounterplay` | 68 | 弱势方治疗/护盾/格挡反制不足 |
| `sustainGap` | 64 | 优势方治疗/护盾资源显著领先 |
| `basicPressure` | 64 | 优势方普攻输出占比高且领先 |
| `controlPressure` | 44 | 优势方控制应用更密集 |
| `earlyCollapse` | 42 | 弱势方首死过早 |
| `dotPressure` | 30 | 优势方 DOT/异常输出占比高 |
| `shieldWall` | 10 | 优势方护盾承伤占比高 |
| `executePressure` | 4 | 优势方处决伤害占比较高 |
| `counterValue` | 2 | 优势方反击伤害占比较高 |

## Preset Summary

### 炼金异常 `alchemyChaos`

- Extreme advantages: 16; repeated tags: statusSetup x16, damageLead x16, burstWindow x10, lowCounterplay x8.
- Extreme disadvantages: 0; repeated tags: -.
- Advantage cases:
  - alchemyChaos vs bulwarkMarks: 100%; 状态铺垫过快 + 总伤害碾压.
  - alchemyChaos vs cavalryBreak: 90%; 状态铺垫过快 + 总伤害碾压.
  - alchemyChaos vs duelChampion: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - alchemyChaos vs holySustain: 100%; 状态铺垫过快 + 总伤害碾压.
  - alchemyChaos vs ironWall: 100%; 状态铺垫过快 + 弱势方过早减员.
  - alchemyChaos vs martyrFrontline: 100%; 状态铺垫过快 + 弱势方过早减员.
  - alchemyChaos vs scarletVanguard: 100%; 状态铺垫过快 + 总伤害碾压.
  - alchemyChaos vs shadowExecute: 100%; 状态铺垫过快 + 弱势方过早减员.

### 低血狂怒 `bloodRage`

- Extreme advantages: 6; repeated tags: burstWindow x6, basicPressure x6, earlyCollapse x4, damageLead x4.
- Extreme disadvantages: 10; repeated tags: damageLead x10, burstWindow x6, lowCounterplay x6, sustainGap x4.
- Advantage cases:
  - bloodRage vs holySustain: 100%; 弱势方过早减员 + 总伤害碾压.
  - bloodRage vs martyrFrontline: 93%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - bloodRage vs purgeAttrition: 97%; 弱势方过早减员 + 2秒峰值爆发过强.
  - holySustain vs bloodRage: 0%; 弱势方过早减员 + 总伤害碾压.
  - martyrFrontline vs bloodRage: 7%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - purgeAttrition vs bloodRage: 3%; 弱势方过早减员 + 2秒峰值爆发过强.
- Disadvantage cases:
  - bloodRage vs crownCarry: 0%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - bloodRage vs fireBurst: 0%; 总伤害碾压 + 2秒峰值爆发过强.
  - bloodRage vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
  - bloodRage vs poisonBloom: 3%; 状态铺垫过快 + 弱势方过早减员.
  - bloodRage vs scarletVanguard: 3%; 控制窗口压制 + 总伤害碾压.
  - crownCarry vs bloodRage: 100%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - fireBurst vs bloodRage: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - frostControl vs bloodRage: 100%; 控制窗口压制 + 状态铺垫过快.

### 壁垒猎标 `bulwarkMarks`

- Extreme advantages: 4; repeated tags: earlyCollapse x4, damageLead x4, basicPressure x4, burstWindow x2.
- Extreme disadvantages: 14; repeated tags: burstWindow x14, damageLead x12, sustainGap x10, statusSetup x8.
- Advantage cases:
  - bulwarkMarks vs holySustain: 100%; 弱势方过早减员 + 总伤害碾压.
  - bulwarkMarks vs martyrFrontline: 93%; 弱势方过早减员 + 总伤害碾压.
  - holySustain vs bulwarkMarks: 0%; 弱势方过早减员 + 总伤害碾压.
  - martyrFrontline vs bulwarkMarks: 7%; 弱势方过早减员 + 总伤害碾压.
- Disadvantage cases:
  - alchemyChaos vs bulwarkMarks: 100%; 状态铺垫过快 + 总伤害碾压.
  - bulwarkMarks vs alchemyChaos: 0%; 状态铺垫过快 + 总伤害碾压.
  - bulwarkMarks vs cavalryBreak: 0%; 控制窗口压制 + 治疗/护盾资源差距过大.
  - bulwarkMarks vs crownCarry: 0%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - bulwarkMarks vs fireBurst: 0%; 状态铺垫过快 + 总伤害碾压.
  - bulwarkMarks vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
  - bulwarkMarks vs frostTrapField: 0%; 控制窗口压制 + 治疗/护盾资源差距过大.
  - bulwarkMarks vs poisonBloom: 0%; 状态铺垫过快 + 2秒峰值爆发过强.

### 王骑破阵 `cavalryBreak`

- Extreme advantages: 6; repeated tags: controlPressure x6, basicPressure x6, sustainGap x4, burstWindow x4.
- Extreme disadvantages: 6; repeated tags: statusSetup x6, damageLead x6, lowCounterplay x4, earlyCollapse x2.
- Advantage cases:
  - bulwarkMarks vs cavalryBreak: 0%; 控制窗口压制 + 治疗/护盾资源差距过大.
  - cavalryBreak vs bulwarkMarks: 100%; 控制窗口压制 + 治疗/护盾资源差距过大.
  - cavalryBreak vs ironWall: 100%; 控制窗口压制 + 2秒峰值爆发过强.
  - cavalryBreak vs purgeAttrition: 90%; 弱势方过早减员 + 控制窗口压制.
  - ironWall vs cavalryBreak: 0%; 控制窗口压制 + 2秒峰值爆发过强.
  - purgeAttrition vs cavalryBreak: 10%; 弱势方过早减员 + 控制窗口压制.
- Disadvantage cases:
  - alchemyChaos vs cavalryBreak: 90%; 状态铺垫过快 + 总伤害碾压.
  - cavalryBreak vs alchemyChaos: 10%; 状态铺垫过快 + 总伤害碾压.
  - cavalryBreak vs frostControl: 7%; 状态铺垫过快 + 总伤害碾压.
  - cavalryBreak vs poisonBloom: 0%; 状态铺垫过快 + 弱势方过早减员.
  - frostControl vs cavalryBreak: 93%; 状态铺垫过快 + 总伤害碾压.
  - poisonBloom vs cavalryBreak: 100%; 状态铺垫过快 + 弱势方过早减员.

### 王冠核心 `crownCarry`

- Extreme advantages: 24; repeated tags: basicPressure x24, damageLead x22, sustainGap x22, burstWindow x14.
- Extreme disadvantages: 0; repeated tags: -.
- Advantage cases:
  - bloodRage vs crownCarry: 0%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - bulwarkMarks vs crownCarry: 0%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - crownCarry vs bloodRage: 100%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - crownCarry vs bulwarkMarks: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - crownCarry vs duelChampion: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - crownCarry vs frostControl: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - crownCarry vs frostTrapField: 100%; 治疗/护盾资源差距过大 + 总伤害碾压.
  - crownCarry vs holySustain: 100%; 总伤害碾压 + 普攻压力过高.

### 决斗冠军 `duelChampion`

- Extreme advantages: 0; repeated tags: -.
- Extreme disadvantages: 10; repeated tags: burstWindow x10, damageLead x10, statusSetup x8, sustainGap x2.
- Disadvantage cases:
  - alchemyChaos vs duelChampion: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - crownCarry vs duelChampion: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - duelChampion vs alchemyChaos: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - duelChampion vs crownCarry: 0%; 总伤害碾压 + 2秒峰值爆发过强.
  - duelChampion vs fireBurst: 0%; 状态铺垫过快 + 总伤害碾压.
  - duelChampion vs martyrFrontline: 7%; 控制窗口压制 + 状态铺垫过快.
  - duelChampion vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs duelChampion: 100%; 状态铺垫过快 + 总伤害碾压.

### 余烬爆燃 `fireBurst`

- Extreme advantages: 22; repeated tags: damageLead x22, burstWindow x22, lowCounterplay x16, statusSetup x12.
- Extreme disadvantages: 0; repeated tags: -.
- Advantage cases:
  - bloodRage vs fireBurst: 0%; 总伤害碾压 + 2秒峰值爆发过强.
  - bulwarkMarks vs fireBurst: 0%; 状态铺垫过快 + 总伤害碾压.
  - duelChampion vs fireBurst: 0%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs bloodRage: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - fireBurst vs bulwarkMarks: 100%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs duelChampion: 100%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs frostControl: 90%; 状态铺垫过快 + 2秒峰值爆发过强.
  - fireBurst vs frostTrapField: 100%; 总伤害碾压 + 2秒峰值爆发过强.

### 霜控拖延 `frostControl`

- Extreme advantages: 20; repeated tags: statusSetup x18, damageLead x18, controlPressure x12, sustainGap x8.
- Extreme disadvantages: 6; repeated tags: burstWindow x6, damageLead x4, statusSetup x4, earlyCollapse x2.
- Advantage cases:
  - bloodRage vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
  - bulwarkMarks vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
  - cavalryBreak vs frostControl: 7%; 状态铺垫过快 + 总伤害碾压.
  - frostControl vs bloodRage: 100%; 控制窗口压制 + 状态铺垫过快.
  - frostControl vs bulwarkMarks: 100%; 控制窗口压制 + 状态铺垫过快.
  - frostControl vs cavalryBreak: 93%; 状态铺垫过快 + 总伤害碾压.
  - frostControl vs frostTrapField: 90%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - frostControl vs holySustain: 100%; 控制窗口压制 + 状态铺垫过快.
- Disadvantage cases:
  - crownCarry vs frostControl: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - fireBurst vs frostControl: 90%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs crownCarry: 0%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - frostControl vs fireBurst: 10%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs poisonBloom: 3%; 状态铺垫过快 + 2秒峰值爆发过强.
  - poisonBloom vs frostControl: 97%; 状态铺垫过快 + 2秒峰值爆发过强.

### 霜陷猎场 `frostTrapField`

- Extreme advantages: 10; repeated tags: controlPressure x10, basicPressure x10, damageLead x8, burstWindow x6.
- Extreme disadvantages: 8; repeated tags: sustainGap x6, damageLead x6, burstWindow x6, lowCounterplay x6.
- Advantage cases:
  - bulwarkMarks vs frostTrapField: 0%; 控制窗口压制 + 治疗/护盾资源差距过大.
  - frostTrapField vs bulwarkMarks: 100%; 控制窗口压制 + 治疗/护盾资源差距过大.
  - frostTrapField vs ironWall: 100%; 控制窗口压制 + 总伤害碾压.
  - frostTrapField vs lightningTempo: 90%; 治疗/护盾资源差距过大 + 控制窗口压制.
  - frostTrapField vs martyrFrontline: 90%; 控制窗口压制 + 总伤害碾压.
  - frostTrapField vs purgeAttrition: 100%; 控制窗口压制 + 2秒峰值爆发过强.
  - ironWall vs frostTrapField: 0%; 控制窗口压制 + 总伤害碾压.
  - lightningTempo vs frostTrapField: 10%; 治疗/护盾资源差距过大 + 控制窗口压制.
- Disadvantage cases:
  - crownCarry vs frostTrapField: 100%; 治疗/护盾资源差距过大 + 总伤害碾压.
  - fireBurst vs frostTrapField: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - frostControl vs frostTrapField: 90%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - frostTrapField vs crownCarry: 0%; 治疗/护盾资源差距过大 + 总伤害碾压.
  - frostTrapField vs fireBurst: 0%; 总伤害碾压 + 2秒峰值爆发过强.
  - frostTrapField vs frostControl: 10%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - frostTrapField vs poisonBloom: 7%; 状态铺垫过快 + 2秒峰值爆发过强.
  - poisonBloom vs frostTrapField: 93%; 状态铺垫过快 + 2秒峰值爆发过强.

### 圣盾续航 `holySustain`

- Extreme advantages: 0; repeated tags: -.
- Extreme disadvantages: 20; repeated tags: damageLead x20, statusSetup x10, burstWindow x10, basicPressure x10.
- Disadvantage cases:
  - alchemyChaos vs holySustain: 100%; 状态铺垫过快 + 总伤害碾压.
  - bloodRage vs holySustain: 100%; 弱势方过早减员 + 总伤害碾压.
  - bulwarkMarks vs holySustain: 100%; 弱势方过早减员 + 总伤害碾压.
  - crownCarry vs holySustain: 100%; 总伤害碾压 + 普攻压力过高.
  - fireBurst vs holySustain: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs holySustain: 100%; 控制窗口压制 + 状态铺垫过快.
  - holySustain vs alchemyChaos: 0%; 状态铺垫过快 + 总伤害碾压.
  - holySustain vs bloodRage: 0%; 弱势方过早减员 + 总伤害碾压.

### 铁壁反击 `ironWall`

- Extreme advantages: 2; repeated tags: sustainGap x2, basicPressure x2, shieldWall x2, counterValue x2.
- Extreme disadvantages: 16; repeated tags: damageLead x16, burstWindow x14, statusSetup x10, controlPressure x8.
- Advantage cases:
  - ironWall vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs ironWall: 0%; 治疗/护盾资源差距过大 + 普攻压力过高.
- Disadvantage cases:
  - alchemyChaos vs ironWall: 100%; 状态铺垫过快 + 弱势方过早减员.
  - cavalryBreak vs ironWall: 100%; 控制窗口压制 + 2秒峰值爆发过强.
  - crownCarry vs ironWall: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - fireBurst vs ironWall: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs ironWall: 100%; 控制窗口压制 + 状态铺垫过快.
  - frostTrapField vs ironWall: 100%; 控制窗口压制 + 总伤害碾压.
  - ironWall vs alchemyChaos: 0%; 状态铺垫过快 + 弱势方过早减员.
  - ironWall vs cavalryBreak: 0%; 控制窗口压制 + 2秒峰值爆发过强.

### 急速节奏 `lightningTempo`

- Extreme advantages: 6; repeated tags: controlPressure x6, damageLead x6, burstWindow x6, earlyCollapse x4.
- Extreme disadvantages: 8; repeated tags: sustainGap x8, lowCounterplay x8, basicPressure x6, earlyCollapse x2.
- Advantage cases:
  - holySustain vs lightningTempo: 7%; 控制窗口压制 + 弱势方过早减员.
  - lightningTempo vs holySustain: 93%; 控制窗口压制 + 弱势方过早减员.
  - lightningTempo vs martyrFrontline: 100%; 控制窗口压制 + 总伤害碾压.
  - lightningTempo vs shadowExecute: 97%; 控制窗口压制 + 弱势方过早减员.
  - martyrFrontline vs lightningTempo: 0%; 控制窗口压制 + 总伤害碾压.
  - shadowExecute vs lightningTempo: 3%; 控制窗口压制 + 弱势方过早减员.
- Disadvantage cases:
  - crownCarry vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - frostTrapField vs lightningTempo: 90%; 治疗/护盾资源差距过大 + 控制窗口压制.
  - ironWall vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs crownCarry: 0%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - lightningTempo vs frostTrapField: 10%; 治疗/护盾资源差距过大 + 控制窗口压制.
  - lightningTempo vs ironWall: 0%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs poisonBloom: 7%; 治疗/护盾资源差距过大 + 状态铺垫过快.
  - poisonBloom vs lightningTempo: 93%; 治疗/护盾资源差距过大 + 状态铺垫过快.

### 殉道前线 `martyrFrontline`

- Extreme advantages: 2; repeated tags: controlPressure x2, statusSetup x2, damageLead x2, burstWindow x2.
- Extreme disadvantages: 22; repeated tags: damageLead x20, burstWindow x14, lowCounterplay x14, basicPressure x12.
- Advantage cases:
  - duelChampion vs martyrFrontline: 7%; 控制窗口压制 + 状态铺垫过快.
  - martyrFrontline vs duelChampion: 93%; 控制窗口压制 + 状态铺垫过快.
- Disadvantage cases:
  - alchemyChaos vs martyrFrontline: 100%; 状态铺垫过快 + 弱势方过早减员.
  - bloodRage vs martyrFrontline: 93%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - bulwarkMarks vs martyrFrontline: 93%; 弱势方过早减员 + 总伤害碾压.
  - crownCarry vs martyrFrontline: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - fireBurst vs martyrFrontline: 100%; 弱势方过早减员 + 总伤害碾压.
  - frostControl vs martyrFrontline: 100%; 状态铺垫过快 + 总伤害碾压.
  - frostTrapField vs martyrFrontline: 90%; 控制窗口压制 + 总伤害碾压.
  - lightningTempo vs martyrFrontline: 100%; 控制窗口压制 + 总伤害碾压.

### 毒巢滚雪球 `poisonBloom`

- Extreme advantages: 26; repeated tags: statusSetup x26, burstWindow x22, dotPressure x20, damageLead x18.
- Extreme disadvantages: 2; repeated tags: earlyCollapse x2, sustainGap x2, basicPressure x2.
- Advantage cases:
  - bloodRage vs poisonBloom: 3%; 状态铺垫过快 + 弱势方过早减员.
  - bulwarkMarks vs poisonBloom: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - cavalryBreak vs poisonBloom: 0%; 状态铺垫过快 + 弱势方过早减员.
  - duelChampion vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - frostControl vs poisonBloom: 3%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostTrapField vs poisonBloom: 7%; 状态铺垫过快 + 2秒峰值爆发过强.
  - holySustain vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - ironWall vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
- Disadvantage cases:
  - crownCarry vs poisonBloom: 93%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - poisonBloom vs crownCarry: 7%; 弱势方过早减员 + 治疗/护盾资源差距过大.

### 净化消耗 `purgeAttrition`

- Extreme advantages: 4; repeated tags: statusSetup x4, controlPressure x4, damageLead x4, dotPressure x4.
- Extreme disadvantages: 14; repeated tags: damageLead x12, burstWindow x10, sustainGap x8, basicPressure x8.
- Advantage cases:
  - holySustain vs purgeAttrition: 0%; 状态铺垫过快 + 控制窗口压制.
  - ironWall vs purgeAttrition: 3%; 控制窗口压制 + 状态铺垫过快.
  - purgeAttrition vs holySustain: 100%; 状态铺垫过快 + 控制窗口压制.
  - purgeAttrition vs ironWall: 97%; 控制窗口压制 + 状态铺垫过快.
- Disadvantage cases:
  - bloodRage vs purgeAttrition: 97%; 弱势方过早减员 + 2秒峰值爆发过强.
  - cavalryBreak vs purgeAttrition: 90%; 弱势方过早减员 + 控制窗口压制.
  - crownCarry vs purgeAttrition: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - fireBurst vs purgeAttrition: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs purgeAttrition: 90%; 状态铺垫过快 + 控制窗口压制.
  - frostTrapField vs purgeAttrition: 100%; 控制窗口压制 + 2秒峰值爆发过强.
  - poisonBloom vs purgeAttrition: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - purgeAttrition vs bloodRage: 3%; 弱势方过早减员 + 2秒峰值爆发过强.

### 赤血先锋 `scarletVanguard`

- Extreme advantages: 6; repeated tags: damageLead x6, burstWindow x6, basicPressure x6, controlPressure x4.
- Extreme disadvantages: 10; repeated tags: lowCounterplay x10, damageLead x8, sustainGap x8, statusSetup x6.
- Advantage cases:
  - bloodRage vs scarletVanguard: 3%; 控制窗口压制 + 总伤害碾压.
  - holySustain vs scarletVanguard: 0%; 控制窗口压制 + 总伤害碾压.
  - martyrFrontline vs scarletVanguard: 0%; 2秒峰值爆发过强 + 总伤害碾压.
  - scarletVanguard vs bloodRage: 97%; 控制窗口压制 + 总伤害碾压.
  - scarletVanguard vs holySustain: 100%; 控制窗口压制 + 总伤害碾压.
  - scarletVanguard vs martyrFrontline: 100%; 2秒峰值爆发过强 + 总伤害碾压.
- Disadvantage cases:
  - alchemyChaos vs scarletVanguard: 100%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs scarletVanguard: 100%; 弱势方过早减员 + 总伤害碾压.
  - frostControl vs scarletVanguard: 93%; 治疗/护盾资源差距过大 + 弱势方反制资源不足.
  - poisonBloom vs scarletVanguard: 100%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - scarletVanguard vs alchemyChaos: 0%; 状态铺垫过快 + 总伤害碾压.
  - scarletVanguard vs fireBurst: 0%; 弱势方过早减员 + 总伤害碾压.
  - scarletVanguard vs frostControl: 7%; 治疗/护盾资源差距过大 + 弱势方反制资源不足.
  - scarletVanguard vs poisonBloom: 0%; 状态铺垫过快 + 治疗/护盾资源差距过大.

### 暗影处决 `shadowExecute`

- Extreme advantages: 4; repeated tags: statusSetup x4, damageLead x4, executePressure x4, burstWindow x2.
- Extreme disadvantages: 12; repeated tags: damageLead x10, burstWindow x10, statusSetup x6, earlyCollapse x6.
- Advantage cases:
  - martyrFrontline vs shadowExecute: 7%; 状态铺垫过快 + 总伤害碾压.
  - scarletVanguard vs shadowExecute: 10%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - shadowExecute vs martyrFrontline: 93%; 状态铺垫过快 + 总伤害碾压.
  - shadowExecute vs scarletVanguard: 90%; 状态铺垫过快 + 治疗/护盾资源差距过大.
- Disadvantage cases:
  - alchemyChaos vs shadowExecute: 100%; 状态铺垫过快 + 弱势方过早减员.
  - crownCarry vs shadowExecute: 97%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - fireBurst vs shadowExecute: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - frostControl vs shadowExecute: 97%; 控制窗口压制 + 状态铺垫过快.
  - lightningTempo vs shadowExecute: 97%; 控制窗口压制 + 弱势方过早减员.
  - poisonBloom vs shadowExecute: 97%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - shadowExecute vs alchemyChaos: 0%; 状态铺垫过快 + 弱势方过早减员.
  - shadowExecute vs crownCarry: 3%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.

## Extreme Matchup Details

### 炼金异常 into 壁垒猎标

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 壁垒猎标.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 38.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.64 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.45 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 30%。); DOT/异常压力过高 (优势方 DOT 占自身输出约 24%。).
- Advantaged metrics: damage 1259.2, basic 33%, DOT 24%, peak 298.8, sustain 0+377.2, first death 6.54.
- Disadvantaged metrics: damage 769.1, basic 55%, DOT 0%, peak 206.4, sustain 0+340.1, first death 6.62.

### 炼金异常 into 王骑破阵

- Rate: 90%; advantaged: 炼金异常; disadvantaged: 王骑破阵.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 39.3。); 总伤害碾压 (优势方总伤害约为弱势方 1.47 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1507.9, basic 31%, DOT 20%, peak 428, sustain 0+206.6, first death 11.54.
- Disadvantaged metrics: damage 1025.5, basic 85%, DOT 0%, peak 369.3, sustain 186.5+194.3, first death 10.6.

### 炼金异常 into 决斗冠军

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 决斗冠军.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 47.7。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.86 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.94 倍。).
- Advantaged metrics: damage 1451.2, basic 20%, DOT 21%, peak 601, sustain 0+284.7, first death 16.6.
- Disadvantaged metrics: damage 493.9, basic 70%, DOT 0%, peak 155.7, sustain 124.8+424.9, first death 12.84.

### 炼金异常 into 圣盾续航

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 70.8。); 总伤害碾压 (优势方总伤害约为弱势方 6.08 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 23%。).
- Advantaged metrics: damage 2078.1, basic 35%, DOT 23%, peak 354.5, sustain 0+865.6, first death none.
- Disadvantaged metrics: damage 341.8, basic 70%, DOT 0%, peak 121.5, sustain 745+1327.4, first death 14.06.

### 炼金异常 into 铁壁反击

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 52.6。); 弱势方过早减员 (弱势方平均首死约在 11.4 秒。); 总伤害碾压 (优势方总伤害约为弱势方 3.27 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.12 倍。).
- Advantaged metrics: damage 1644, basic 33%, DOT 21%, peak 331.5, sustain 0+705.3, first death 17.23.
- Disadvantaged metrics: damage 502.3, basic 77%, DOT 0%, peak 156.5, sustain 322.5+912.7, first death 11.4.

### 炼金异常 into 殉道前线

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 38.5。); 弱势方过早减员 (弱势方平均首死约在 8.65 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.55 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.16 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 19%。).
- Advantaged metrics: damage 1399.8, basic 33%, DOT 21%, peak 386.8, sustain 0+271.3, first death 14.75.
- Disadvantaged metrics: damage 548.3, basic 51%, DOT 17%, peak 178.9, sustain 69.8+160.2, first death 8.65.

### 炼金异常 into 赤血先锋

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 赤血先锋.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 31.5。); 总伤害碾压 (优势方总伤害约为弱势方 1.44 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 13%。).
- Advantaged metrics: damage 1246.8, basic 34%, DOT 21%, peak 361.4, sustain 0+138.3, first death 8.26.
- Disadvantaged metrics: damage 868, basic 65%, DOT 3%, peak 361.4, sustain 50.4+92.2, first death 7.9.

### 炼金异常 into 暗影处决

- Rate: 100%; advantaged: 炼金异常; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 40.5。); 弱势方过早减员 (弱势方平均首死约在 3.25 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.88 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.94 倍。).
- Advantaged metrics: damage 1260.5, basic 40%, DOT 19%, peak 387.5, sustain 0+482.5, first death 8.77.
- Disadvantaged metrics: damage 671.4, basic 39%, DOT 27%, peak 199.2, sustain 0+519.5, first death 3.25.

### 低血狂怒 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 治疗/护盾资源差距过大.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.72 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.58 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1715.1, basic 100%, DOT 0%, peak 348.9, sustain 374.9+502.7, first death 10.66.
- Disadvantaged metrics: damage 998.5, basic 94%, DOT 0%, peak 396.1, sustain 347.2+207.8, first death 10.62.

### 低血狂怒 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.63 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.91 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 22%。).
- Advantaged metrics: damage 1417.5, basic 33%, DOT 8%, peak 362.1, sustain 0+236.2, first death 8.88.
- Disadvantaged metrics: damage 539.6, basic 71%, DOT 0%, peak 189.8, sustain 144.5+135.1, first death 7.26.

### 低血狂怒 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 低血狂怒.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 26.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.82 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 27%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1544.7, basic 40%, DOT 14%, peak 308.9, sustain 136.8+316.8, first death 10.43.
- Disadvantaged metrics: damage 849.8, basic 93%, DOT 0%, peak 378, sustain 273.2+134.9, first death 11.42.

### 低血狂怒 into 圣盾续航

- Rate: 100%; advantaged: 低血狂怒; disadvantaged: 圣盾续航.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.98 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.63 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.38 倍。); 普攻压力过高 (优势方普攻占自身输出约 84%。).
- Advantaged metrics: damage 1866, basic 84%, DOT 0%, peak 398.5, sustain 469.4+293.8, first death none.
- Disadvantaged metrics: damage 710, basic 63%, DOT 0%, peak 167.4, sustain 434.4+742.1, first death 11.98.

### 低血狂怒 into 殉道前线

- Rate: 93%; advantaged: 低血狂怒; disadvantaged: 殉道前线.
- Headline: 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.93 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.56 倍。); 普攻压力过高 (优势方普攻占自身输出约 89%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1469, basic 89%, DOT 0%, peak 431.2, sustain 370.7+215.9, first death 10.76.
- Disadvantaged metrics: damage 1280.1, basic 50%, DOT 13%, peak 275.6, sustain 38+162.3, first death 8.89.

### 低血狂怒 into 毒巢滚雪球

- Rate: 3%; advantaged: 毒巢滚雪球; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 56。); 弱势方过早减员 (弱势方平均首死约在 7.78 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.06 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.77 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.54 倍。).
- Advantaged metrics: damage 1503.8, basic 31%, DOT 26%, peak 458.5, sustain 148.8+379.6, first death 10.98.
- Disadvantaged metrics: damage 730, basic 81%, DOT 0%, peak 297.7, sustain 162.8+135, first death 7.78.

### 低血狂怒 into 净化消耗

- Rate: 97%; advantaged: 低血狂怒; disadvantaged: 净化消耗.
- Headline: 弱势方过早减员 + 2秒峰值爆发过强.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 10.16 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.05 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.59 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 普攻压力过高 (优势方普攻占自身输出约 88%。).
- Advantaged metrics: damage 1560, basic 88%, DOT 0%, peak 426, sustain 330.4+154.7, first death 15.28.
- Disadvantaged metrics: damage 1140.8, basic 47%, DOT 39%, peak 207.6, sustain 93.8+212.2, first death 10.16.

### 低血狂怒 into 赤血先锋

- Rate: 3%; advantaged: 赤血先锋; disadvantaged: 低血狂怒.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.84 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.51 倍。); 普攻压力过高 (优势方普攻占自身输出约 66%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1524.4, basic 66%, DOT 5%, peak 381, sustain 48.2+158.6, first death 7.62.
- Disadvantaged metrics: damage 826.3, basic 73%, DOT 0%, peak 252.7, sustain 211.4+181.6, first death 6.84.

### 壁垒猎标 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 壁垒猎标.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 38.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.64 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.45 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 30%。); DOT/异常压力过高 (优势方 DOT 占自身输出约 24%。).
- Advantaged metrics: damage 1259.2, basic 33%, DOT 24%, peak 298.8, sustain 0+377.2, first death 6.54.
- Disadvantaged metrics: damage 769.1, basic 55%, DOT 0%, peak 206.4, sustain 0+340.1, first death 6.62.

### 壁垒猎标 into 王骑破阵

- Rate: 0%; advantaged: 王骑破阵; disadvantaged: 壁垒猎标.
- Headline: 控制窗口压制 + 治疗/护盾资源差距过大.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.8 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.67 倍。); 普攻压力过高 (优势方普攻占自身输出约 84%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 19%。).
- Advantaged metrics: damage 1389.9, basic 85%, DOT 0%, peak 387.8, sustain 317.2+295.9, first death 10.
- Disadvantaged metrics: damage 1306.3, basic 58%, DOT 0%, peak 232.1, sustain 0+219, first death 11.79.

### 壁垒猎标 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 壁垒猎标.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.1 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 4.1 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.05 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.53 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1403.6, basic 100%, DOT 0%, peak 519.9, sustain 359.4+523.5, first death none.
- Disadvantaged metrics: damage 553.7, basic 65%, DOT 0%, peak 170.7, sustain 0+215.3, first death 11.1.

### 壁垒猎标 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 壁垒猎标.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 25.6。); 总伤害碾压 (优势方总伤害约为弱势方 2.11 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.97 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 20%。).
- Advantaged metrics: damage 1259.6, basic 25%, DOT 15%, peak 370.2, sustain 0+147.4, first death 11.22.
- Disadvantaged metrics: damage 596.5, basic 67%, DOT 0%, peak 188.4, sustain 0+223.4, first death 11.28.

### 壁垒猎标 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 壁垒猎标.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 26.2。); 总伤害碾压 (优势方总伤害约为弱势方 2.07 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.89 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.93 倍。).
- Advantaged metrics: damage 1269.6, basic 37%, DOT 17%, peak 293.3, sustain 191.7+516.8, first death 12.48.
- Disadvantaged metrics: damage 612, basic 69%, DOT 0%, peak 154.8, sustain 0+367.3, first death 10.61.

### 壁垒猎标 into 霜陷猎场

- Rate: 0%; advantaged: 霜陷猎场; disadvantaged: 壁垒猎标.
- Headline: 控制窗口压制 + 治疗/护盾资源差距过大.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.89 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.78 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 50%。).
- Advantaged metrics: damage 1269.8, basic 50%, DOT 0%, peak 350.2, sustain 103.3+305.9, first death 8.94.
- Disadvantaged metrics: damage 751.7, basic 63%, DOT 0%, peak 197.2, sustain 0+216.9, first death 10.36.

### 壁垒猎标 into 圣盾续航

- Rate: 100%; advantaged: 壁垒猎标; disadvantaged: 圣盾续航.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.18 秒。); 总伤害碾压 (优势方总伤害约为弱势方 6.8 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.82 倍。); 普攻压力过高 (优势方普攻占自身输出约 58%。).
- Advantaged metrics: damage 1866.3, basic 58%, DOT 0%, peak 377.1, sustain 0+1041.6, first death none.
- Disadvantaged metrics: damage 274.6, basic 66%, DOT 0%, peak 98.6, sustain 507.8+1356.8, first death 11.18.

### 壁垒猎标 into 殉道前线

- Rate: 93%; advantaged: 壁垒猎标; disadvantaged: 殉道前线.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 8.28 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.45 倍。); 普攻压力过高 (优势方普攻占自身输出约 59%。).
- Advantaged metrics: damage 1359.1, basic 59%, DOT 0%, peak 284.4, sustain 0+305.5, first death 14.38.
- Disadvantaged metrics: damage 936.6, basic 51%, DOT 16%, peak 261.9, sustain 122.8+287.9, first death 8.28.

### 壁垒猎标 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 壁垒猎标.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 67.6。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.01 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.91 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.47 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 33%。).
- Advantaged metrics: damage 1311.2, basic 24%, DOT 33%, peak 541, sustain 153.5+437.3, first death 5.56.
- Disadvantaged metrics: damage 893.8, basic 61%, DOT 0%, peak 269.3, sustain 0+309.1, first death 13.58.

### 王骑破阵 into 炼金异常

- Rate: 10%; advantaged: 炼金异常; disadvantaged: 王骑破阵.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 39.3。); 总伤害碾压 (优势方总伤害约为弱势方 1.47 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1507.9, basic 31%, DOT 20%, peak 428, sustain 0+206.6, first death 11.54.
- Disadvantaged metrics: damage 1025.5, basic 85%, DOT 0%, peak 369.3, sustain 186.5+194.3, first death 10.6.

### 王骑破阵 into 壁垒猎标

- Rate: 100%; advantaged: 王骑破阵; disadvantaged: 壁垒猎标.
- Headline: 控制窗口压制 + 治疗/护盾资源差距过大.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.8 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.67 倍。); 普攻压力过高 (优势方普攻占自身输出约 84%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 19%。).
- Advantaged metrics: damage 1389.8, basic 85%, DOT 0%, peak 387.8, sustain 317.2+295.9, first death 10.
- Disadvantaged metrics: damage 1306.3, basic 58%, DOT 0%, peak 232.1, sustain 0+219, first death 11.79.

### 王骑破阵 into 霜控拖延

- Rate: 7%; advantaged: 霜控拖延; disadvantaged: 王骑破阵.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 32.2。); 总伤害碾压 (优势方总伤害约为弱势方 1.79 倍。).
- Advantaged metrics: damage 1595, basic 36%, DOT 14%, peak 367.7, sustain 257.9+457.8, first death 12.62.
- Disadvantaged metrics: damage 892.4, basic 73%, DOT 0%, peak 357.9, sustain 236.6+276.6, first death 14.34.

### 王骑破阵 into 铁壁反击

- Rate: 100%; advantaged: 王骑破阵; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 2秒峰值爆发过强.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.5 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.38 倍。); 普攻压力过高 (优势方普攻占自身输出约 88%。).
- Advantaged metrics: damage 1654.5, basic 88%, DOT 0%, peak 385.2, sustain 433.2+390.1, first death 10.98.
- Disadvantaged metrics: damage 1195.3, basic 57%, DOT 0%, peak 256.3, sustain 246.7+717.4, first death 13.24.

### 王骑破阵 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 王骑破阵.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 60.1。); 弱势方过早减员 (弱势方平均首死约在 8 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.58 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.43 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 32%。).
- Advantaged metrics: damage 1537.5, basic 30%, DOT 25%, peak 508.9, sustain 155.7+395.7, first death 14.22.
- Disadvantaged metrics: damage 974.5, basic 87%, DOT 0%, peak 356.6, sustain 213.4+213.5, first death 8.

### 王骑破阵 into 净化消耗

- Rate: 90%; advantaged: 王骑破阵; disadvantaged: 净化消耗.
- Headline: 弱势方过早减员 + 控制窗口压制.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.83 秒。); 控制窗口压制 (优势方控制应用约为弱势方 4.7 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.49 倍。); 普攻压力过高 (优势方普攻占自身输出约 74%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 33%。).
- Advantaged metrics: damage 1410.4, basic 74%, DOT 0%, peak 341.2, sustain 268.4+324, first death 17.29.
- Disadvantaged metrics: damage 1329.7, basic 37%, DOT 35%, peak 327.3, sustain 106.3+292.4, first death 11.83.

### 王冠核心 into 低血狂怒

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 治疗/护盾资源差距过大.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.72 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.58 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1715.1, basic 100%, DOT 0%, peak 348.9, sustain 374.9+502.7, first death 10.66.
- Disadvantaged metrics: damage 998.5, basic 94%, DOT 0%, peak 396.1, sustain 347.2+207.8, first death 10.62.

### 王冠核心 into 壁垒猎标

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 壁垒猎标.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.1 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 4.1 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.05 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.53 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1403.6, basic 100%, DOT 0%, peak 519.9, sustain 359.4+523.5, first death none.
- Disadvantaged metrics: damage 553.7, basic 65%, DOT 0%, peak 170.7, sustain 0+215.3, first death 11.1.

### 王冠核心 into 决斗冠军

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 决斗冠军.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 3.71 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.21 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1643.5, basic 100%, DOT 0%, peak 309.6, sustain 475.6+1423.6, first death none.
- Disadvantaged metrics: damage 442.6, basic 57%, DOT 0%, peak 140.1, sustain 295.1+826.4, first death 13.79.

### 王冠核心 into 霜控拖延

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 霜控拖延.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.94 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.62 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.08 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.42 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1460.9, basic 100%, DOT 0%, peak 496.3, sustain 488.1+767.9, first death 21.6.
- Disadvantaged metrics: damage 1029.5, basic 28%, DOT 25%, peak 238.5, sustain 125.4+353.9, first death 11.94.

### 王冠核心 into 霜陷猎场

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 霜陷猎场.
- Headline: 治疗/护盾资源差距过大 + 总伤害碾压.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.9 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.76 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.64 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 31%。).
- Advantaged metrics: damage 1406.5, basic 100%, DOT 0%, peak 542.3, sustain 357.2+637.1, first death none.
- Disadvantaged metrics: damage 800.1, basic 45%, DOT 0%, peak 330.6, sustain 57.9+285.1, first death 12.14.

### 王冠核心 into 圣盾续航

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 7.83 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 2390.2, basic 100%, DOT 0%, peak 290.1, sustain 469.1+2340.3, first death none.
- Disadvantaged metrics: damage 305.4, basic 58%, DOT 0%, peak 137.3, sustain 993.6+2226.8, first death 27.92.

### 王冠核心 into 铁壁反击

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 铁壁反击.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 3.07 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.86 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.66 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1685, basic 100%, DOT 0%, peak 342, sustain 519.4+1318.8, first death none.
- Disadvantaged metrics: damage 549.3, basic 71%, DOT 0%, peak 184.4, sustain 259.7+846.5, first death 13.14.

### 王冠核心 into 急速节奏

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 9.06 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.57 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1404.9, basic 100%, DOT 0%, peak 429.6, sustain 374.1+591.8, first death 18.44.
- Disadvantaged metrics: damage 896.3, basic 43%, DOT 0%, peak 343.3, sustain 0+0, first death 9.06.

### 王冠核心 into 殉道前线

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 殉道前线.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 10.27 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 3.71 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.52 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 35%。).
- Advantaged metrics: damage 1477.9, basic 100%, DOT 0%, peak 326, sustain 549.5+981.5, first death 19.65.
- Disadvantaged metrics: damage 971.4, basic 38%, DOT 20%, peak 381.1, sustain 108.8+303.6, first death 10.27.

### 王冠核心 into 毒巢滚雪球

- Rate: 93%; advantaged: 王冠核心; disadvantaged: 毒巢滚雪球.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.06 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.86 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1522.3, basic 100%, DOT 0%, peak 413.1, sustain 452.4+676.5, first death 14.14.
- Disadvantaged metrics: damage 1392.7, basic 20%, DOT 39%, peak 475.8, sustain 168.3+437.7, first death 11.06.

### 王冠核心 into 净化消耗

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 净化消耗.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.84 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.5 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.08 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.02 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1484.8, basic 100%, DOT 0%, peak 443.2, sustain 333.4+688.6, first death 20.96.
- Disadvantaged metrics: damage 735, basic 34%, DOT 45%, peak 213.4, sustain 110.3+298.3, first death 11.84.

### 王冠核心 into 暗影处决

- Rate: 97%; advantaged: 王冠核心; disadvantaged: 暗影处决.
- Headline: 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 3.49 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.11 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 20%。).
- Advantaged metrics: damage 1400.6, basic 100%, DOT 0%, peak 522.7, sustain 270.2+406.6, first death 10.35.
- Disadvantaged metrics: damage 699.3, basic 29%, DOT 26%, peak 247.5, sustain 0+193.8, first death 8.6.

### 决斗冠军 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 决斗冠军.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 47.7。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.86 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.94 倍。).
- Advantaged metrics: damage 1451.2, basic 20%, DOT 21%, peak 601, sustain 0+284.7, first death 16.6.
- Disadvantaged metrics: damage 493.9, basic 70%, DOT 0%, peak 155.7, sustain 124.8+424.9, first death 12.84.

### 决斗冠军 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 决斗冠军.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 3.71 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.21 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1643.5, basic 100%, DOT 0%, peak 309.6, sustain 475.6+1423.6, first death none.
- Disadvantaged metrics: damage 442.6, basic 57%, DOT 0%, peak 140.1, sustain 295.1+826.4, first death 13.79.

### 决斗冠军 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 决斗冠军.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 46.9。); 总伤害碾压 (优势方总伤害约为弱势方 4.29 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.35 倍。).
- Advantaged metrics: damage 1707.9, basic 25%, DOT 12%, peak 486.8, sustain 0+680.6, first death 13.07.
- Disadvantaged metrics: damage 397.6, basic 72%, DOT 0%, peak 145.3, sustain 374.7+1205.7, first death 12.22.

### 决斗冠军 into 殉道前线

- Rate: 7%; advantaged: 殉道前线; disadvantaged: 决斗冠军.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 25.4。); 总伤害碾压 (优势方总伤害约为弱势方 2.19 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.1 倍。).
- Advantaged metrics: damage 1669.5, basic 44%, DOT 15%, peak 401.1, sustain 250.8+706.3, first death 25.32.
- Disadvantaged metrics: damage 762, basic 72%, DOT 0%, peak 191.2, sustain 342.9+1056.2, first death 15.88.

### 决斗冠军 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 决斗冠军.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 86.3。); 总伤害碾压 (优势方总伤害约为弱势方 2.33 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.33 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 1678.1, basic 28%, DOT 39%, peak 389.6, sustain 307.2+1094.5, first death 18.9.
- Disadvantaged metrics: damage 720.8, basic 78%, DOT 0%, peak 167.2, sustain 368+882.1, first death 17.22.

### 余烬爆燃 into 低血狂怒

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.63 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.91 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 22%。).
- Advantaged metrics: damage 1417.5, basic 33%, DOT 8%, peak 362.1, sustain 0+236.2, first death 8.88.
- Disadvantaged metrics: damage 539.6, basic 71%, DOT 0%, peak 189.8, sustain 144.5+135.1, first death 7.26.

### 余烬爆燃 into 壁垒猎标

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 壁垒猎标.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 25.6。); 总伤害碾压 (优势方总伤害约为弱势方 2.11 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.97 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 20%。).
- Advantaged metrics: damage 1259.6, basic 25%, DOT 15%, peak 370.2, sustain 0+147.4, first death 11.22.
- Disadvantaged metrics: damage 596.5, basic 67%, DOT 0%, peak 188.4, sustain 0+223.4, first death 11.28.

### 余烬爆燃 into 决斗冠军

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 决斗冠军.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 46.9。); 总伤害碾压 (优势方总伤害约为弱势方 4.29 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.35 倍。).
- Advantaged metrics: damage 1707.9, basic 25%, DOT 12%, peak 486.8, sustain 0+680.6, first death 13.07.
- Disadvantaged metrics: damage 397.6, basic 72%, DOT 0%, peak 145.3, sustain 374.7+1205.7, first death 12.22.

### 余烬爆燃 into 霜控拖延

- Rate: 90%; advantaged: 余烬爆燃; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 25.4。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.93 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.42 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 31%。).
- Advantaged metrics: damage 1326.8, basic 21%, DOT 13%, peak 573.3, sustain 0+146.7, first death 14.59.
- Disadvantaged metrics: damage 932.6, basic 30%, DOT 22%, peak 296.7, sustain 98.7+293, first death 12.19.

### 余烬爆燃 into 霜陷猎场

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 霜陷猎场.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.92 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.44 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 25%。).
- Advantaged metrics: damage 1237.3, basic 31%, DOT 10%, peak 390.1, sustain 0+148.5, first death 11.06.
- Disadvantaged metrics: damage 644.2, basic 55%, DOT 0%, peak 270.3, sustain 29.2+234.7, first death 9.66.

### 余烬爆燃 into 圣盾续航

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 40.7。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 4.66 倍。); 总伤害碾压 (优势方总伤害约为弱势方 4.24 倍。).
- Advantaged metrics: damage 1871.5, basic 21%, DOT 21%, peak 566.4, sustain 0+445.2, first death none.
- Disadvantaged metrics: damage 441.5, basic 56%, DOT 0%, peak 121.5, sustain 549.7+797, first death 14.22.

### 余烬爆燃 into 铁壁反击

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 35。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.91 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.25 倍。).
- Advantaged metrics: damage 1516.6, basic 25%, DOT 14%, peak 530, sustain 0+241.4, first death 13.3.
- Disadvantaged metrics: damage 673.7, basic 58%, DOT 0%, peak 181.9, sustain 178+609.8, first death 13.06.

### 余烬爆燃 into 殉道前线

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 殉道前线.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 10.7 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.88 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.56 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1411, basic 28%, DOT 13%, peak 389, sustain 0+233.4, first death 14.02.
- Disadvantaged metrics: damage 750.6, basic 44%, DOT 23%, peak 249.6, sustain 48+148.9, first death 10.7.

### 余烬爆燃 into 净化消耗

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 净化消耗.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 27.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.45 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.07 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1429.2, basic 22%, DOT 9%, peak 557, sustain 0+143.2, first death 14.73.
- Disadvantaged metrics: damage 691.3, basic 43%, DOT 45%, peak 161.4, sustain 126.1+252.3, first death 11.96.

### 余烬爆燃 into 赤血先锋

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 赤血先锋.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 7.24 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.98 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.96 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.67 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 12%。).
- Advantaged metrics: damage 1235.2, basic 33%, DOT 7%, peak 397.9, sustain 0+248.8, first death 11.16.
- Disadvantaged metrics: damage 625.2, basic 67%, DOT 8%, peak 238.4, sustain 34.3+92.7, first death 7.24.

### 余烬爆燃 into 暗影处决

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 暗影处决.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.39 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 17%。).
- Advantaged metrics: damage 1270.9, basic 29%, DOT 13%, peak 372.1, sustain 0+143.5, first death 7.32.
- Disadvantaged metrics: damage 929, basic 37%, DOT 23%, peak 267.5, sustain 0+192.3, first death 8.88.

### 霜控拖延 into 低血狂怒

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 低血狂怒.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 26.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.82 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 27%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1544.7, basic 40%, DOT 14%, peak 308.9, sustain 136.8+316.8, first death 10.43.
- Disadvantaged metrics: damage 849.8, basic 93%, DOT 0%, peak 378, sustain 273.2+134.9, first death 11.42.

### 霜控拖延 into 壁垒猎标

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 壁垒猎标.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 26.2。); 总伤害碾压 (优势方总伤害约为弱势方 2.07 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.89 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.93 倍。).
- Advantaged metrics: damage 1269.6, basic 37%, DOT 17%, peak 293.3, sustain 191.7+516.8, first death 12.48.
- Disadvantaged metrics: damage 612, basic 69%, DOT 0%, peak 154.8, sustain 0+367.3, first death 10.61.

### 霜控拖延 into 王骑破阵

- Rate: 93%; advantaged: 霜控拖延; disadvantaged: 王骑破阵.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 32.2。); 总伤害碾压 (优势方总伤害约为弱势方 1.79 倍。).
- Advantaged metrics: damage 1595, basic 36%, DOT 14%, peak 367.7, sustain 257.9+457.8, first death 12.62.
- Disadvantaged metrics: damage 892.4, basic 73%, DOT 0%, peak 357.9, sustain 236.6+276.6, first death 14.34.

### 霜控拖延 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 霜控拖延.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.94 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.62 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.08 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.42 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1460.9, basic 100%, DOT 0%, peak 496.4, sustain 488.1+767.9, first death 21.6.
- Disadvantaged metrics: damage 1029.5, basic 28%, DOT 25%, peak 238.5, sustain 125.4+353.9, first death 11.94.

### 霜控拖延 into 余烬爆燃

- Rate: 10%; advantaged: 余烬爆燃; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 25.4。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.93 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.42 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 31%。).
- Advantaged metrics: damage 1326.8, basic 21%, DOT 13%, peak 573.3, sustain 0+146.7, first death 14.59.
- Disadvantaged metrics: damage 932.6, basic 30%, DOT 22%, peak 296.7, sustain 98.7+293, first death 12.19.

### 霜控拖延 into 霜陷猎场

- Rate: 90%; advantaged: 霜控拖延; disadvantaged: 霜陷猎场.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 26.4。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.69 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.45 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 29%。).
- Advantaged metrics: damage 1227.2, basic 32%, DOT 14%, peak 317.3, sustain 155.8+395.3, first death 11.12.
- Disadvantaged metrics: damage 849, basic 53%, DOT 0%, peak 294.9, sustain 62.7+263.8, first death 11.42.

### 霜控拖延 into 圣盾续航

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 97。); 总伤害碾压 (优势方总伤害约为弱势方 3.2 倍。); 普攻压力过高 (优势方普攻占自身输出约 45%。).
- Advantaged metrics: damage 2211.9, basic 45%, DOT 15%, peak 231.2, sustain 657+2773.5, first death none.
- Disadvantaged metrics: damage 690.1, basic 56%, DOT 0%, peak 162.4, sustain 1786.4+3761.3, first death 47.82.

### 霜控拖延 into 铁壁反击

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 56.4。); 总伤害碾压 (优势方总伤害约为弱势方 3.95 倍。).
- Advantaged metrics: damage 1968.1, basic 38%, DOT 13%, peak 242.3, sustain 481.6+1785.9, first death none.
- Disadvantaged metrics: damage 498.2, basic 71%, DOT 0%, peak 140.5, sustain 648.1+1551.3, first death 16.02.

### 霜控拖延 into 殉道前线

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 30.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.63 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.64 倍。).
- Advantaged metrics: damage 1449.5, basic 33%, DOT 14%, peak 311.8, sustain 269.6+618.1, first death 17.85.
- Disadvantaged metrics: damage 888.8, basic 44%, DOT 13%, peak 314.4, sustain 162.2+379.7, first death 12.58.

### 霜控拖延 into 毒巢滚雪球

- Rate: 3%; advantaged: 毒巢滚雪球; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 71.1。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.43 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 35%。).
- Advantaged metrics: damage 1388.8, basic 20%, DOT 35%, peak 523.5, sustain 235.5+508.8, first death 8.98.
- Disadvantaged metrics: damage 1147.3, basic 40%, DOT 18%, peak 215.3, sustain 152.2+426.1, first death 14.62.

### 霜控拖延 into 净化消耗

- Rate: 90%; advantaged: 霜控拖延; disadvantaged: 净化消耗.
- Headline: 状态铺垫过快 + 控制窗口压制.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 33.2。); 控制窗口压制 (优势方控制应用约为弱势方 4.21 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.3 倍。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 10%。).
- Advantaged metrics: damage 1479.4, basic 35%, DOT 19%, peak 327.2, sustain 294.7+665.1, first death 20.36.
- Disadvantaged metrics: damage 1141.6, basic 39%, DOT 40%, peak 280.5, sustain 262.7+563.5, first death 18.26.

### 霜控拖延 into 赤血先锋

- Rate: 93%; advantaged: 霜控拖延; disadvantaged: 赤血先锋.
- Headline: 治疗/护盾资源差距过大 + 弱势方反制资源不足.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.2 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 7%。).
- Advantaged metrics: damage 1239.1, basic 38%, DOT 13%, peak 292.8, sustain 121.2+287.6, first death 10.08.
- Disadvantaged metrics: damage 1092.1, basic 63%, DOT 5%, peak 357.1, sustain 70.2+115.6, first death 9.89.

### 霜控拖延 into 暗影处决

- Rate: 97%; advantaged: 霜控拖延; disadvantaged: 暗影处决.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 29.2。); 弱势方过早减员 (弱势方平均首死约在 5.72 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.58 倍。).
- Advantaged metrics: damage 1245.8, basic 41%, DOT 14%, peak 261.9, sustain 39.9+818.6, first death 9.35.
- Disadvantaged metrics: damage 788.6, basic 34%, DOT 29%, peak 220.5, sustain 0+618.4, first death 5.72.

### 霜陷猎场 into 壁垒猎标

- Rate: 100%; advantaged: 霜陷猎场; disadvantaged: 壁垒猎标.
- Headline: 控制窗口压制 + 治疗/护盾资源差距过大.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.89 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.78 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 50%。).
- Advantaged metrics: damage 1269.8, basic 50%, DOT 0%, peak 350.2, sustain 103.3+305.9, first death 8.94.
- Disadvantaged metrics: damage 751.7, basic 63%, DOT 0%, peak 197.2, sustain 0+216.9, first death 10.36.

### 霜陷猎场 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 霜陷猎场.
- Headline: 治疗/护盾资源差距过大 + 总伤害碾压.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.9 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.76 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.64 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 31%。).
- Advantaged metrics: damage 1406.5, basic 100%, DOT 0%, peak 542.3, sustain 357.2+637.1, first death none.
- Disadvantaged metrics: damage 800.1, basic 45%, DOT 0%, peak 330.6, sustain 57.9+285.1, first death 12.14.

### 霜陷猎场 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 霜陷猎场.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.92 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.44 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 25%。).
- Advantaged metrics: damage 1237.3, basic 31%, DOT 10%, peak 390.1, sustain 0+148.5, first death 11.06.
- Disadvantaged metrics: damage 644.2, basic 55%, DOT 0%, peak 270.3, sustain 29.2+234.7, first death 9.66.

### 霜陷猎场 into 霜控拖延

- Rate: 10%; advantaged: 霜控拖延; disadvantaged: 霜陷猎场.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 26.4。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.69 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.45 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 29%。).
- Advantaged metrics: damage 1227.2, basic 32%, DOT 14%, peak 317.3, sustain 155.8+395.3, first death 11.12.
- Disadvantaged metrics: damage 849, basic 53%, DOT 0%, peak 294.9, sustain 62.7+263.8, first death 11.42.

### 霜陷猎场 into 铁壁反击

- Rate: 100%; advantaged: 霜陷猎场; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.92 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.62 倍。); 普攻压力过高 (优势方普攻占自身输出约 47%。).
- Advantaged metrics: damage 1636.4, basic 47%, DOT 0%, peak 354.1, sustain 82.9+511.2, first death 12.72.
- Disadvantaged metrics: damage 561.3, basic 64%, DOT 0%, peak 218, sustain 326.5+824.2, first death 12.78.

### 霜陷猎场 into 急速节奏

- Rate: 90%; advantaged: 霜陷猎场; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 控制窗口压制.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 控制窗口压制 (优势方控制应用约为弱势方 4.35 倍。); 普攻压力过高 (优势方普攻占自身输出约 55%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1174.4, basic 55%, DOT 0%, peak 309.4, sustain 12.4+154.4, first death 7.26.
- Disadvantaged metrics: damage 994.2, basic 46%, DOT 0%, peak 332.7, sustain 0+0, first death 7.32.

### 霜陷猎场 into 殉道前线

- Rate: 90%; advantaged: 霜陷猎场; disadvantaged: 殉道前线.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 3.12 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.33 倍。); 普攻压力过高 (优势方普攻占自身输出约 50%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 33%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1382.9, basic 50%, DOT 0%, peak 308.7, sustain 97.5+349.8, first death 10.34.
- Disadvantaged metrics: damage 1042.8, basic 48%, DOT 13%, peak 277.5, sustain 113.8+277.9, first death 9.9.

### 霜陷猎场 into 毒巢滚雪球

- Rate: 7%; advantaged: 毒巢滚雪球; disadvantaged: 霜陷猎场.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 63。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.7 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.73 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 1295.4, basic 26%, DOT 39%, peak 464, sustain 210.4+476.3, first death 5.26.
- Disadvantaged metrics: damage 1130.8, basic 43%, DOT 0%, peak 272.4, sustain 99.7+298, first death 11.51.

### 霜陷猎场 into 净化消耗

- Rate: 100%; advantaged: 霜陷猎场; disadvantaged: 净化消耗.
- Headline: 控制窗口压制 + 2秒峰值爆发过强.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 10.75 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.3 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.71 倍。); 普攻压力过高 (优势方普攻占自身输出约 50%。).
- Advantaged metrics: damage 1445.7, basic 50%, DOT 0%, peak 433.8, sustain 125+316, first death 11.5.
- Disadvantaged metrics: damage 845.1, basic 44%, DOT 44%, peak 188.6, sustain 164.8+300.4, first death 11.07.

### 圣盾续航 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 70.8。); 总伤害碾压 (优势方总伤害约为弱势方 6.08 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 23%。).
- Advantaged metrics: damage 2078.1, basic 35%, DOT 23%, peak 354.5, sustain 0+865.6, first death none.
- Disadvantaged metrics: damage 341.8, basic 70%, DOT 0%, peak 121.6, sustain 745+1327.4, first death 14.06.

### 圣盾续航 into 低血狂怒

- Rate: 0%; advantaged: 低血狂怒; disadvantaged: 圣盾续航.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.98 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.63 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.38 倍。); 普攻压力过高 (优势方普攻占自身输出约 84%。).
- Advantaged metrics: damage 1866, basic 84%, DOT 0%, peak 398.5, sustain 469.4+293.8, first death none.
- Disadvantaged metrics: damage 710, basic 63%, DOT 0%, peak 167.4, sustain 434.4+742.1, first death 11.98.

### 圣盾续航 into 壁垒猎标

- Rate: 0%; advantaged: 壁垒猎标; disadvantaged: 圣盾续航.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.18 秒。); 总伤害碾压 (优势方总伤害约为弱势方 6.8 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.82 倍。); 普攻压力过高 (优势方普攻占自身输出约 58%。).
- Advantaged metrics: damage 1866.3, basic 58%, DOT 0%, peak 377.1, sustain 0+1041.6, first death none.
- Disadvantaged metrics: damage 274.6, basic 66%, DOT 0%, peak 98.6, sustain 507.8+1356.8, first death 11.18.

### 圣盾续航 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 7.83 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 2390.2, basic 100%, DOT 0%, peak 290.1, sustain 469.1+2340.3, first death none.
- Disadvantaged metrics: damage 305.4, basic 58%, DOT 0%, peak 137.3, sustain 993.6+2226.9, first death 27.92.

### 圣盾续航 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 40.7。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 4.66 倍。); 总伤害碾压 (优势方总伤害约为弱势方 4.24 倍。).
- Advantaged metrics: damage 1871.5, basic 21%, DOT 21%, peak 566.4, sustain 0+445.2, first death none.
- Disadvantaged metrics: damage 441.5, basic 56%, DOT 0%, peak 121.5, sustain 549.7+797.1, first death 14.22.

### 圣盾续航 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 97。); 总伤害碾压 (优势方总伤害约为弱势方 3.2 倍。); 普攻压力过高 (优势方普攻占自身输出约 45%。).
- Advantaged metrics: damage 2211.9, basic 45%, DOT 15%, peak 231.2, sustain 657+2773.5, first death none.
- Disadvantaged metrics: damage 690.1, basic 56%, DOT 0%, peak 162.4, sustain 1786.4+3761.3, first death 47.82.

### 圣盾续航 into 急速节奏

- Rate: 7%; advantaged: 急速节奏; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 弱势方过早减员.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 7.83 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.79 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.72 倍。).
- Advantaged metrics: damage 1744.3, basic 39%, DOT 0%, peak 352.4, sustain 0+0, first death 19.36.
- Disadvantaged metrics: damage 625.8, basic 79%, DOT 0%, peak 205.5, sustain 510.3+981.1, first death 7.83.

### 圣盾续航 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 123.5。); 总伤害碾压 (优势方总伤害约为弱势方 5.93 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 38%。).
- Advantaged metrics: damage 2549, basic 31%, DOT 38%, peak 382.2, sustain 185+1840.7, first death 15.06.
- Disadvantaged metrics: damage 430.1, basic 74%, DOT 0%, peak 129.8, sustain 1189.6+1938.6, first death 15.37.

### 圣盾续航 into 净化消耗

- Rate: 0%; advantaged: 净化消耗; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 控制窗口压制.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 127.9。); 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 4.78 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 2579.5, basic 44%, DOT 30%, peak 442.2, sustain 619.6+2205, first death none.
- Disadvantaged metrics: damage 539.8, basic 71%, DOT 0%, peak 163, sustain 1281+2690, first death 21.27.

### 圣盾续航 into 赤血先锋

- Rate: 0%; advantaged: 赤血先锋; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 3.06 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.48 倍。); 普攻压力过高 (优势方普攻占自身输出约 80%。).
- Advantaged metrics: damage 1798.8, basic 80%, DOT 4%, peak 461.9, sustain 187.4+199.8, first death 14.32.
- Disadvantaged metrics: damage 588.4, basic 60%, DOT 0%, peak 186.3, sustain 419.8+712, first death 12.12.

### 铁壁反击 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 52.6。); 弱势方过早减员 (弱势方平均首死约在 11.4 秒。); 总伤害碾压 (优势方总伤害约为弱势方 3.27 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.12 倍。).
- Advantaged metrics: damage 1644, basic 33%, DOT 21%, peak 331.4, sustain 0+705.3, first death 17.23.
- Disadvantaged metrics: damage 502.3, basic 77%, DOT 0%, peak 156.5, sustain 322.5+912.7, first death 11.4.

### 铁壁反击 into 王骑破阵

- Rate: 0%; advantaged: 王骑破阵; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 2秒峰值爆发过强.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.5 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.38 倍。); 普攻压力过高 (优势方普攻占自身输出约 88%。).
- Advantaged metrics: damage 1654.5, basic 88%, DOT 0%, peak 385.2, sustain 433.2+390.1, first death 10.98.
- Disadvantaged metrics: damage 1195.3, basic 57%, DOT 0%, peak 256.3, sustain 246.7+717.4, first death 13.24.

### 铁壁反击 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 铁壁反击.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 3.07 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.86 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.66 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1685, basic 100%, DOT 0%, peak 342, sustain 519.4+1318.8, first death none.
- Disadvantaged metrics: damage 549.3, basic 71%, DOT 0%, peak 184.4, sustain 259.7+846.5, first death 13.14.

### 铁壁反击 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 35。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.91 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.25 倍。).
- Advantaged metrics: damage 1516.6, basic 25%, DOT 14%, peak 530, sustain 0+241.4, first death 13.3.
- Disadvantaged metrics: damage 673.7, basic 58%, DOT 0%, peak 181.9, sustain 178+609.8, first death 13.06.

### 铁壁反击 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 56.4。); 总伤害碾压 (优势方总伤害约为弱势方 3.95 倍。).
- Advantaged metrics: damage 1968.1, basic 38%, DOT 13%, peak 242.3, sustain 481.6+1785.9, first death none.
- Disadvantaged metrics: damage 498.2, basic 71%, DOT 0%, peak 140.5, sustain 648.1+1551.3, first death 16.02.

### 铁壁反击 into 霜陷猎场

- Rate: 0%; advantaged: 霜陷猎场; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.92 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.62 倍。); 普攻压力过高 (优势方普攻占自身输出约 47%。).
- Advantaged metrics: damage 1636.4, basic 47%, DOT 0%, peak 354.1, sustain 82.9+511.2, first death 12.72.
- Disadvantaged metrics: damage 561.3, basic 64%, DOT 0%, peak 218, sustain 326.5+824.2, first death 12.78.

### 铁壁反击 into 急速节奏

- Rate: 100%; advantaged: 铁壁反击; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 普攻压力过高.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 普攻压力过高 (优势方普攻占自身输出约 78%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 14%。); 反击收益过高 (优势方反击伤害占比约 10%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1239.9, basic 78%, DOT 0%, peak 298.9, sustain 402.8+1113.9, first death 7.68.
- Disadvantaged metrics: damage 1063.6, basic 44%, DOT 0%, peak 319.3, sustain 0+0, first death 9.75.

### 铁壁反击 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 99.9。); 总伤害碾压 (优势方总伤害约为弱势方 2.84 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.48 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 1880.4, basic 30%, DOT 39%, peak 455.2, sustain 367.4+1299.1, first death 8.67.
- Disadvantaged metrics: damage 662.9, basic 61%, DOT 0%, peak 183.3, sustain 476.3+1119.4, first death 15.79.

### 铁壁反击 into 净化消耗

- Rate: 3%; advantaged: 净化消耗; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 81.6。); 总伤害碾压 (优势方总伤害约为弱势方 2.64 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.51 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 1717.8, basic 42%, DOT 30%, peak 489, sustain 441.3+1221, first death none.
- Disadvantaged metrics: damage 650.1, basic 74%, DOT 0%, peak 194.5, sustain 408.7+1112.8, first death 17.78.

### 急速节奏 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 9.06 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.57 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1404.9, basic 100%, DOT 0%, peak 429.6, sustain 374.1+591.8, first death 18.44.
- Disadvantaged metrics: damage 896.3, basic 43%, DOT 0%, peak 343.3, sustain 0+0, first death 9.06.

### 急速节奏 into 霜陷猎场

- Rate: 10%; advantaged: 霜陷猎场; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 控制窗口压制.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 控制窗口压制 (优势方控制应用约为弱势方 4.35 倍。); 普攻压力过高 (优势方普攻占自身输出约 55%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1174.4, basic 55%, DOT 0%, peak 309.4, sustain 12.4+154.4, first death 7.26.
- Disadvantaged metrics: damage 994.2, basic 46%, DOT 0%, peak 332.7, sustain 0+0, first death 7.32.

### 急速节奏 into 圣盾续航

- Rate: 93%; advantaged: 急速节奏; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 弱势方过早减员.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 7.83 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.79 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.72 倍。).
- Advantaged metrics: damage 1744.3, basic 39%, DOT 0%, peak 352.4, sustain 0+0, first death 19.36.
- Disadvantaged metrics: damage 625.8, basic 79%, DOT 0%, peak 205.5, sustain 510.3+981.1, first death 7.83.

### 急速节奏 into 铁壁反击

- Rate: 0%; advantaged: 铁壁反击; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 普攻压力过高.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 普攻压力过高 (优势方普攻占自身输出约 78%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 14%。); 反击收益过高 (优势方反击伤害占比约 10%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1239.9, basic 78%, DOT 0%, peak 298.9, sustain 402.8+1113.9, first death 7.68.
- Disadvantaged metrics: damage 1063.6, basic 44%, DOT 0%, peak 319.3, sustain 0+0, first death 9.75.

### 急速节奏 into 殉道前线

- Rate: 100%; advantaged: 急速节奏; disadvantaged: 殉道前线.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 2 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.53 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.47 倍。); 普攻压力过高 (优势方普攻占自身输出约 49%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1368.7, basic 49%, DOT 0%, peak 383.9, sustain 0+0, first death 9.58.
- Disadvantaged metrics: damage 892.4, basic 52%, DOT 14%, peak 261.8, sustain 37.8+139.4, first death 6.78.

### 急速节奏 into 毒巢滚雪球

- Rate: 7%; advantaged: 毒巢滚雪球; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 状态铺垫过快.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 58.5。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.85 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 31%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1293.6, basic 23%, DOT 31%, peak 594.9, sustain 93.6+227.8, first death 4.12.
- Disadvantaged metrics: damage 1170.1, basic 53%, DOT 0%, peak 321, sustain 0+0, first death 9.02.

### 急速节奏 into 暗影处决

- Rate: 97%; advantaged: 急速节奏; disadvantaged: 暗影处决.
- Headline: 控制窗口压制 + 弱势方过早减员.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 3.2 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.76 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.75 倍。); 普攻压力过高 (优势方普攻占自身输出约 47%。).
- Advantaged metrics: damage 1270.4, basic 47%, DOT 0%, peak 381.9, sustain 0+0, first death 7.94.
- Disadvantaged metrics: damage 723.5, basic 46%, DOT 26%, peak 217.9, sustain 0+404.7, first death 3.2.

### 殉道前线 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 38.5。); 弱势方过早减员 (弱势方平均首死约在 8.65 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.55 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.16 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 19%。).
- Advantaged metrics: damage 1399.8, basic 33%, DOT 21%, peak 386.8, sustain 0+271.3, first death 14.75.
- Disadvantaged metrics: damage 548.3, basic 51%, DOT 17%, peak 178.9, sustain 69.8+160.2, first death 8.65.

### 殉道前线 into 低血狂怒

- Rate: 7%; advantaged: 低血狂怒; disadvantaged: 殉道前线.
- Headline: 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.93 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.56 倍。); 普攻压力过高 (优势方普攻占自身输出约 89%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1469, basic 89%, DOT 0%, peak 431.2, sustain 370.7+215.9, first death 10.76.
- Disadvantaged metrics: damage 1280.1, basic 50%, DOT 13%, peak 275.6, sustain 38+162.4, first death 8.89.

### 殉道前线 into 壁垒猎标

- Rate: 7%; advantaged: 壁垒猎标; disadvantaged: 殉道前线.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 8.28 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.45 倍。); 普攻压力过高 (优势方普攻占自身输出约 59%。).
- Advantaged metrics: damage 1359.1, basic 59%, DOT 0%, peak 284.4, sustain 0+305.5, first death 14.38.
- Disadvantaged metrics: damage 936.6, basic 51%, DOT 16%, peak 261.9, sustain 122.8+287.9, first death 8.28.

### 殉道前线 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 殉道前线.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 10.27 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 3.71 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.52 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 35%。).
- Advantaged metrics: damage 1477.9, basic 100%, DOT 0%, peak 326, sustain 549.5+981.5, first death 19.65.
- Disadvantaged metrics: damage 971.4, basic 38%, DOT 20%, peak 381.1, sustain 108.8+303.6, first death 10.27.

### 殉道前线 into 决斗冠军

- Rate: 93%; advantaged: 殉道前线; disadvantaged: 决斗冠军.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 25.4。); 总伤害碾压 (优势方总伤害约为弱势方 2.19 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.1 倍。).
- Advantaged metrics: damage 1669.4, basic 44%, DOT 15%, peak 401.1, sustain 250.8+706.3, first death 25.32.
- Disadvantaged metrics: damage 762, basic 72%, DOT 0%, peak 191.2, sustain 342.9+1056.2, first death 15.88.

### 殉道前线 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 殉道前线.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 10.7 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.88 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.56 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1411, basic 28%, DOT 13%, peak 389, sustain 0+233.4, first death 14.02.
- Disadvantaged metrics: damage 750.6, basic 44%, DOT 23%, peak 249.6, sustain 48+148.9, first death 10.7.

### 殉道前线 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 30.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.63 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.64 倍。).
- Advantaged metrics: damage 1449.5, basic 33%, DOT 14%, peak 311.8, sustain 269.6+618.1, first death 17.85.
- Disadvantaged metrics: damage 888.8, basic 44%, DOT 13%, peak 314.4, sustain 162.2+379.7, first death 12.58.

### 殉道前线 into 霜陷猎场

- Rate: 10%; advantaged: 霜陷猎场; disadvantaged: 殉道前线.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 3.12 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.33 倍。); 普攻压力过高 (优势方普攻占自身输出约 50%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 33%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1382.9, basic 50%, DOT 0%, peak 308.7, sustain 97.5+349.8, first death 10.34.
- Disadvantaged metrics: damage 1042.8, basic 48%, DOT 13%, peak 277.5, sustain 113.8+277.9, first death 9.9.

### 殉道前线 into 急速节奏

- Rate: 0%; advantaged: 急速节奏; disadvantaged: 殉道前线.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 2 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.53 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.47 倍。); 普攻压力过高 (优势方普攻占自身输出约 49%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1368.7, basic 49%, DOT 0%, peak 383.9, sustain 0+0, first death 9.58.
- Disadvantaged metrics: damage 892.4, basic 52%, DOT 14%, peak 261.8, sustain 37.8+139.4, first death 6.78.

### 殉道前线 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 61。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.97 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.05 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.87 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 1448.3, basic 28%, DOT 30%, peak 451.3, sustain 224.7+634.5, first death 9.75.
- Disadvantaged metrics: damage 776.2, basic 48%, DOT 11%, peak 229.6, sustain 127.7+291.8, first death 10.41.

### 殉道前线 into 赤血先锋

- Rate: 0%; advantaged: 赤血先锋; disadvantaged: 殉道前线.
- Headline: 2秒峰值爆发过强 + 总伤害碾压.
- Top reasons: 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.19 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.63 倍。); 普攻压力过高 (优势方普攻占自身输出约 74%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 14%。).
- Advantaged metrics: damage 1511.7, basic 74%, DOT 3%, peak 487.8, sustain 118.8+119.4, first death 11.14.
- Disadvantaged metrics: damage 929.2, basic 48%, DOT 15%, peak 222.9, sustain 40.2+142.3, first death 8.71.

### 殉道前线 into 暗影处决

- Rate: 7%; advantaged: 暗影处决; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 40.1。); 总伤害碾压 (优势方总伤害约为弱势方 1.46 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.55 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 25%。); 处决压力过稳定 (优势方处决伤害占比约 10%。).
- Advantaged metrics: damage 1406.9, basic 39%, DOT 25%, peak 292.6, sustain 0+542.9, first death 7.27.
- Disadvantaged metrics: damage 966.4, basic 57%, DOT 11%, peak 189.3, sustain 133.4+312.2, first death 7.62.

### 毒巢滚雪球 into 低血狂怒

- Rate: 97%; advantaged: 毒巢滚雪球; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 56。); 弱势方过早减员 (弱势方平均首死约在 7.78 秒。); 总伤害碾压 (优势方总伤害约为弱势方 2.06 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.77 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.54 倍。).
- Advantaged metrics: damage 1503.8, basic 31%, DOT 26%, peak 458.5, sustain 148.8+379.6, first death 10.98.
- Disadvantaged metrics: damage 730, basic 81%, DOT 0%, peak 297.7, sustain 162.8+135, first death 7.78.

### 毒巢滚雪球 into 壁垒猎标

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 壁垒猎标.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 67.6。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.01 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.91 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.47 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 33%。).
- Advantaged metrics: damage 1311.2, basic 24%, DOT 33%, peak 541, sustain 153.5+437.3, first death 5.56.
- Disadvantaged metrics: damage 893.8, basic 61%, DOT 0%, peak 269.3, sustain 0+309.1, first death 13.58.

### 毒巢滚雪球 into 王骑破阵

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 王骑破阵.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 60.1。); 弱势方过早减员 (弱势方平均首死约在 8 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.58 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.43 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 32%。).
- Advantaged metrics: damage 1537.5, basic 30%, DOT 25%, peak 508.9, sustain 155.7+395.7, first death 14.22.
- Disadvantaged metrics: damage 974.6, basic 87%, DOT 0%, peak 356.6, sustain 213.4+213.5, first death 8.

### 毒巢滚雪球 into 王冠核心

- Rate: 7%; advantaged: 王冠核心; disadvantaged: 毒巢滚雪球.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.06 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.86 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1522.3, basic 100%, DOT 0%, peak 413.1, sustain 452.4+676.5, first death 14.14.
- Disadvantaged metrics: damage 1392.7, basic 20%, DOT 39%, peak 475.8, sustain 168.3+437.7, first death 11.06.

### 毒巢滚雪球 into 决斗冠军

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 决斗冠军.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 86.3。); 总伤害碾压 (优势方总伤害约为弱势方 2.33 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.33 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 1678.1, basic 28%, DOT 39%, peak 389.6, sustain 307.2+1094.5, first death 18.9.
- Disadvantaged metrics: damage 720.8, basic 78%, DOT 0%, peak 167.2, sustain 368+882.1, first death 17.22.

### 毒巢滚雪球 into 霜控拖延

- Rate: 97%; advantaged: 毒巢滚雪球; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 71.1。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.43 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 35%。).
- Advantaged metrics: damage 1388.8, basic 20%, DOT 35%, peak 523.5, sustain 235.5+508.8, first death 8.98.
- Disadvantaged metrics: damage 1147.3, basic 40%, DOT 18%, peak 215.3, sustain 152.2+426.1, first death 14.62.

### 毒巢滚雪球 into 霜陷猎场

- Rate: 93%; advantaged: 毒巢滚雪球; disadvantaged: 霜陷猎场.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 63。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.7 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.73 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 1295.4, basic 26%, DOT 39%, peak 464, sustain 210.4+476.3, first death 5.26.
- Disadvantaged metrics: damage 1130.8, basic 43%, DOT 0%, peak 272.4, sustain 99.7+298, first death 11.51.

### 毒巢滚雪球 into 圣盾续航

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 123.5。); 总伤害碾压 (优势方总伤害约为弱势方 5.93 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 38%。).
- Advantaged metrics: damage 2549, basic 31%, DOT 38%, peak 382.2, sustain 185+1840.7, first death 15.06.
- Disadvantaged metrics: damage 430.1, basic 74%, DOT 0%, peak 129.8, sustain 1189.6+1938.6, first death 15.37.

### 毒巢滚雪球 into 铁壁反击

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 99.9。); 总伤害碾压 (优势方总伤害约为弱势方 2.84 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.48 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 1880.4, basic 30%, DOT 39%, peak 455.2, sustain 367.4+1299.1, first death 8.67.
- Disadvantaged metrics: damage 662.9, basic 61%, DOT 0%, peak 183.3, sustain 476.3+1119.4, first death 15.79.

### 毒巢滚雪球 into 急速节奏

- Rate: 93%; advantaged: 毒巢滚雪球; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 状态铺垫过快.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 58.5。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.85 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 31%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1293.6, basic 23%, DOT 31%, peak 594.9, sustain 93.6+227.8, first death 4.12.
- Disadvantaged metrics: damage 1170.1, basic 53%, DOT 0%, peak 321, sustain 0+0, first death 9.02.

### 毒巢滚雪球 into 殉道前线

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 61。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.97 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.05 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.87 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 1448.3, basic 28%, DOT 30%, peak 451.3, sustain 224.7+634.5, first death 9.75.
- Disadvantaged metrics: damage 776.2, basic 48%, DOT 11%, peak 229.6, sustain 127.7+291.8, first death 10.41.

### 毒巢滚雪球 into 净化消耗

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 净化消耗.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 64.8。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.84 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.84 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.59 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1493.8, basic 24%, DOT 29%, peak 622.6, sustain 164.6+433.6, first death 8.94.
- Disadvantaged metrics: damage 810.3, basic 46%, DOT 47%, peak 162.3, sustain 120.4+255.9, first death 12.24.

### 毒巢滚雪球 into 赤血先锋

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 赤血先锋.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 51.9。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.74 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.41 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 26%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1329.8, basic 29%, DOT 26%, peak 427.7, sustain 126.8+345.1, first death 8.94.
- Disadvantaged metrics: damage 945.4, basic 66%, DOT 6%, peak 318.1, sustain 45.3+126.8, first death 7.7.

### 毒巢滚雪球 into 暗影处决

- Rate: 97%; advantaged: 毒巢滚雪球; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 60.8。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.97 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.67 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 35%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 33%。).
- Advantaged metrics: damage 1275.6, basic 29%, DOT 35%, peak 443.6, sustain 207.1+514.6, first death 6.5.
- Disadvantaged metrics: damage 1070.7, basic 29%, DOT 26%, peak 265, sustain 0+366.5, first death 10.06.

### 净化消耗 into 低血狂怒

- Rate: 3%; advantaged: 低血狂怒; disadvantaged: 净化消耗.
- Headline: 弱势方过早减员 + 2秒峰值爆发过强.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 10.16 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.05 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.59 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 普攻压力过高 (优势方普攻占自身输出约 88%。).
- Advantaged metrics: damage 1560, basic 88%, DOT 0%, peak 426, sustain 330.4+154.7, first death 15.28.
- Disadvantaged metrics: damage 1140.8, basic 47%, DOT 39%, peak 207.6, sustain 93.8+212.2, first death 10.16.

### 净化消耗 into 王骑破阵

- Rate: 10%; advantaged: 王骑破阵; disadvantaged: 净化消耗.
- Headline: 弱势方过早减员 + 控制窗口压制.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.83 秒。); 控制窗口压制 (优势方控制应用约为弱势方 4.7 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.49 倍。); 普攻压力过高 (优势方普攻占自身输出约 74%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 33%。).
- Advantaged metrics: damage 1410.4, basic 74%, DOT 0%, peak 341.2, sustain 268.4+324, first death 17.29.
- Disadvantaged metrics: damage 1329.7, basic 37%, DOT 35%, peak 327.3, sustain 106.3+292.3, first death 11.83.

### 净化消耗 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 净化消耗.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.84 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.5 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.08 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.02 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1484.8, basic 100%, DOT 0%, peak 443.2, sustain 333.4+688.6, first death 20.96.
- Disadvantaged metrics: damage 735, basic 34%, DOT 45%, peak 213.4, sustain 110.3+298.3, first death 11.84.

### 净化消耗 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 净化消耗.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 27.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.45 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.07 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1429.2, basic 22%, DOT 9%, peak 557, sustain 0+143.2, first death 14.73.
- Disadvantaged metrics: damage 691.3, basic 43%, DOT 45%, peak 161.4, sustain 126.1+252.3, first death 11.96.

### 净化消耗 into 霜控拖延

- Rate: 10%; advantaged: 霜控拖延; disadvantaged: 净化消耗.
- Headline: 状态铺垫过快 + 控制窗口压制.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 33.2。); 控制窗口压制 (优势方控制应用约为弱势方 4.21 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.3 倍。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 10%。).
- Advantaged metrics: damage 1479.4, basic 35%, DOT 19%, peak 327.2, sustain 294.7+665.1, first death 20.36.
- Disadvantaged metrics: damage 1141.6, basic 39%, DOT 40%, peak 280.5, sustain 262.7+563.5, first death 18.26.

### 净化消耗 into 霜陷猎场

- Rate: 0%; advantaged: 霜陷猎场; disadvantaged: 净化消耗.
- Headline: 控制窗口压制 + 2秒峰值爆发过强.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 10.75 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.3 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.71 倍。); 普攻压力过高 (优势方普攻占自身输出约 50%。).
- Advantaged metrics: damage 1445.7, basic 50%, DOT 0%, peak 433.8, sustain 125+316, first death 11.5.
- Disadvantaged metrics: damage 845.1, basic 44%, DOT 44%, peak 188.6, sustain 164.8+300.4, first death 11.07.

### 净化消耗 into 圣盾续航

- Rate: 100%; advantaged: 净化消耗; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 控制窗口压制.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 127.9。); 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 4.78 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 2579.5, basic 44%, DOT 30%, peak 442.2, sustain 619.6+2205, first death none.
- Disadvantaged metrics: damage 539.8, basic 71%, DOT 0%, peak 163, sustain 1281+2690, first death 21.27.

### 净化消耗 into 铁壁反击

- Rate: 97%; advantaged: 净化消耗; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 81.6。); 总伤害碾压 (优势方总伤害约为弱势方 2.64 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.51 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 1717.8, basic 42%, DOT 30%, peak 489, sustain 441.3+1221, first death none.
- Disadvantaged metrics: damage 650.1, basic 74%, DOT 0%, peak 194.5, sustain 408.7+1112.8, first death 17.78.

### 净化消耗 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 净化消耗.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 64.8。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.84 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.84 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.59 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1493.8, basic 24%, DOT 29%, peak 622.6, sustain 164.6+433.6, first death 8.94.
- Disadvantaged metrics: damage 810.3, basic 46%, DOT 47%, peak 162.3, sustain 120.4+255.9, first death 12.24.

### 赤血先锋 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 赤血先锋.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 31.5。); 总伤害碾压 (优势方总伤害约为弱势方 1.44 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 13%。).
- Advantaged metrics: damage 1246.8, basic 34%, DOT 21%, peak 361.4, sustain 0+138.3, first death 8.26.
- Disadvantaged metrics: damage 868, basic 65%, DOT 3%, peak 361.4, sustain 50.4+92.2, first death 7.9.

### 赤血先锋 into 低血狂怒

- Rate: 97%; advantaged: 赤血先锋; disadvantaged: 低血狂怒.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.84 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.51 倍。); 普攻压力过高 (优势方普攻占自身输出约 66%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 28%。).
- Advantaged metrics: damage 1524.4, basic 66%, DOT 5%, peak 381, sustain 48.2+158.6, first death 7.62.
- Disadvantaged metrics: damage 826.3, basic 73%, DOT 0%, peak 252.7, sustain 211.4+181.6, first death 6.84.

### 赤血先锋 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 赤血先锋.
- Headline: 弱势方过早减员 + 总伤害碾压.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 7.24 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.98 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.96 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.67 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 12%。).
- Advantaged metrics: damage 1235.2, basic 33%, DOT 7%, peak 397.9, sustain 0+248.8, first death 11.16.
- Disadvantaged metrics: damage 625.2, basic 67%, DOT 8%, peak 238.4, sustain 34.3+92.7, first death 7.24.

### 赤血先锋 into 霜控拖延

- Rate: 7%; advantaged: 霜控拖延; disadvantaged: 赤血先锋.
- Headline: 治疗/护盾资源差距过大 + 弱势方反制资源不足.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.2 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 7%。).
- Advantaged metrics: damage 1239.1, basic 38%, DOT 13%, peak 292.8, sustain 121.2+287.6, first death 10.08.
- Disadvantaged metrics: damage 1092.2, basic 63%, DOT 5%, peak 357.1, sustain 70.2+115.6, first death 9.89.

### 赤血先锋 into 圣盾续航

- Rate: 100%; advantaged: 赤血先锋; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 3.06 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.48 倍。); 普攻压力过高 (优势方普攻占自身输出约 80%。).
- Advantaged metrics: damage 1798.8, basic 80%, DOT 4%, peak 461.9, sustain 187.4+199.8, first death 14.32.
- Disadvantaged metrics: damage 588.4, basic 60%, DOT 0%, peak 186.3, sustain 419.8+712, first death 12.12.

### 赤血先锋 into 殉道前线

- Rate: 100%; advantaged: 赤血先锋; disadvantaged: 殉道前线.
- Headline: 2秒峰值爆发过强 + 总伤害碾压.
- Top reasons: 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.19 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.63 倍。); 普攻压力过高 (优势方普攻占自身输出约 74%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 14%。).
- Advantaged metrics: damage 1511.7, basic 74%, DOT 3%, peak 487.8, sustain 118.8+119.4, first death 11.14.
- Disadvantaged metrics: damage 929.2, basic 48%, DOT 15%, peak 222.9, sustain 40.2+142.3, first death 8.71.

### 赤血先锋 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 赤血先锋.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 51.9。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.74 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.41 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 26%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1329.8, basic 29%, DOT 26%, peak 427.7, sustain 126.8+345.1, first death 8.94.
- Disadvantaged metrics: damage 945.4, basic 66%, DOT 6%, peak 318.1, sustain 45.3+126.8, first death 7.7.

### 赤血先锋 into 暗影处决

- Rate: 10%; advantaged: 暗影处决; disadvantaged: 赤血先锋.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 34.4。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.87 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.31 倍。); 处决压力过稳定 (优势方处决伤害占比约 17%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 14%。).
- Advantaged metrics: damage 1266.2, basic 40%, DOT 18%, peak 368.6, sustain 0+262.5, first death 9.04.
- Disadvantaged metrics: damage 967.9, basic 62%, DOT 5%, peak 297.2, sustain 29.2+111.5, first death 7.1.

### 暗影处决 into 炼金异常

- Rate: 0%; advantaged: 炼金异常; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 40.5。); 弱势方过早减员 (弱势方平均首死约在 3.25 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.88 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.94 倍。).
- Advantaged metrics: damage 1260.5, basic 40%, DOT 19%, peak 387.5, sustain 0+482.5, first death 8.77.
- Disadvantaged metrics: damage 671.4, basic 39%, DOT 27%, peak 199.2, sustain 0+519.5, first death 3.25.

### 暗影处决 into 王冠核心

- Rate: 3%; advantaged: 王冠核心; disadvantaged: 暗影处决.
- Headline: 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 3.49 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.11 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 20%。).
- Advantaged metrics: damage 1400.6, basic 100%, DOT 0%, peak 522.7, sustain 270.2+406.6, first death 10.35.
- Disadvantaged metrics: damage 699.3, basic 29%, DOT 26%, peak 247.5, sustain 0+193.8, first death 8.6.

### 暗影处决 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 暗影处决.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.39 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 17%。).
- Advantaged metrics: damage 1270.9, basic 29%, DOT 13%, peak 372.1, sustain 0+143.5, first death 7.32.
- Disadvantaged metrics: damage 929, basic 37%, DOT 23%, peak 267.5, sustain 0+192.3, first death 8.88.

### 暗影处决 into 霜控拖延

- Rate: 3%; advantaged: 霜控拖延; disadvantaged: 暗影处决.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 29.2。); 弱势方过早减员 (弱势方平均首死约在 5.72 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.58 倍。).
- Advantaged metrics: damage 1245.8, basic 41%, DOT 14%, peak 261.9, sustain 39.9+818.6, first death 9.35.
- Disadvantaged metrics: damage 788.6, basic 34%, DOT 29%, peak 220.5, sustain 0+618.4, first death 5.72.

### 暗影处决 into 急速节奏

- Rate: 3%; advantaged: 急速节奏; disadvantaged: 暗影处决.
- Headline: 控制窗口压制 + 弱势方过早减员.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 3.2 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.76 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.75 倍。); 普攻压力过高 (优势方普攻占自身输出约 47%。).
- Advantaged metrics: damage 1270.4, basic 47%, DOT 0%, peak 381.9, sustain 0+0, first death 7.94.
- Disadvantaged metrics: damage 723.5, basic 46%, DOT 26%, peak 217.9, sustain 0+404.7, first death 3.2.

### 暗影处决 into 殉道前线

- Rate: 93%; advantaged: 暗影处决; disadvantaged: 殉道前线.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 40.1。); 总伤害碾压 (优势方总伤害约为弱势方 1.46 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.55 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 25%。); 处决压力过稳定 (优势方处决伤害占比约 10%。).
- Advantaged metrics: damage 1406.9, basic 39%, DOT 25%, peak 292.6, sustain 0+542.9, first death 7.27.
- Disadvantaged metrics: damage 966.4, basic 57%, DOT 11%, peak 189.3, sustain 133.4+312.2, first death 7.62.

### 暗影处决 into 毒巢滚雪球

- Rate: 3%; advantaged: 毒巢滚雪球; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 60.8。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.97 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.67 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 35%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 33%。).
- Advantaged metrics: damage 1275.6, basic 29%, DOT 35%, peak 443.6, sustain 207.1+514.6, first death 6.5.
- Disadvantaged metrics: damage 1070.7, basic 29%, DOT 26%, peak 265, sustain 0+366.5, first death 10.06.

### 暗影处决 into 赤血先锋

- Rate: 90%; advantaged: 暗影处决; disadvantaged: 赤血先锋.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 34.4。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.87 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.31 倍。); 处决压力过稳定 (优势方处决伤害占比约 17%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 14%。).
- Advantaged metrics: damage 1266.2, basic 40%, DOT 18%, peak 368.6, sustain 0+262.5, first death 9.04.
- Disadvantaged metrics: damage 967.9, basic 62%, DOT 5%, peak 297.3, sustain 29.2+111.5, first death 7.1.

