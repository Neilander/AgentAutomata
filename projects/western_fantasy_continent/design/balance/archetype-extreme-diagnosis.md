# Archetype Extreme Matchup Diagnosis

Generated from `design/balance/archetype-matchup-evidence.json`. This report diagnoses extreme ordered matchups; it does not recommend direct numeric changes by itself.

## Summary

- Extreme ordered matchups: 66.
- Ecology health: review; polarization score 0.7259.
- Extreme thresholds: <= 10% or >= 90%.
- Deterministic rule: In deterministic combat, 0/100 is acceptable when the winner has clear cost, clear predators, and causal explanation. Review all-rounders and preyless weak presets first.

## Ecology Review

- 低血狂怒 vulnerable-without-prey: prey 1, predators 5.
- 余烬爆燃 all-rounder-risk: prey 6, predators 1.
- 圣盾续航 vulnerable-without-prey: prey 0, predators 6.
- 铁壁反击 vulnerable-without-prey: prey 1, predators 5.
- 毒巢滚雪球 all-rounder-risk: prey 8, predators 1.

| Preset | Status | Hard prey | Hard predators | Advantage categories |
| --- | --- | ---: | ---: | --- |
| 炼金异常 `alchemyChaos` | answered-niche | 2 | 3 | frontloadedDamage, statusScaling, sustainOrCounterplay |
| 低血狂怒 `bloodRage` | vulnerable-without-prey | 1 | 5 | frontloadedDamage |
| 王冠核心 `crownCarry` | dominant-but-answered | 6 | 2 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 余烬爆燃 `fireBurst` | all-rounder-risk | 6 | 1 | frontloadedDamage, statusScaling, sustainOrCounterplay |
| 霜控拖延 `frostControl` | answered-niche | 2 | 4 | frontloadedDamage, statusScaling, tempoControl |
| 圣盾续航 `holySustain` | vulnerable-without-prey | 0 | 6 | - |
| 铁壁反击 `ironWall` | vulnerable-without-prey | 1 | 5 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 急速节奏 `lightningTempo` | answered-niche | 2 | 4 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 毒巢滚雪球 `poisonBloom` | all-rounder-risk | 8 | 1 | frontloadedDamage, statusScaling, sustainOrCounterplay, tempoControl |
| 暗影处决 `shadowExecute` | dominant-but-answered | 5 | 2 | frontloadedDamage, statusScaling, sustainOrCounterplay, tempoControl |

## Repeated Cause Tags

| Cause tag | Count | Meaning |
| --- | ---: | --- |
| `damageLead` | 54 | 优势方总伤害显著领先 |
| `burstWindow` | 40 | 优势方短窗口爆发过强 |
| `statusSetup` | 40 | 优势方状态铺设量大 |
| `sustainGap` | 26 | 优势方治疗/护盾资源显著领先 |
| `dotPressure` | 22 | 优势方 DOT/异常输出占比高 |
| `basicPressure` | 20 | 优势方普攻输出占比高且领先 |
| `lowCounterplay` | 18 | 弱势方治疗/护盾/格挡反制不足 |
| `earlyCollapse` | 16 | 弱势方首死过早 |
| `executePressure` | 10 | 优势方处决伤害占比较高 |
| `controlPressure` | 8 | 优势方控制应用更密集 |
| `shieldWall` | 4 | 优势方护盾承伤占比高 |
| `counterValue` | 2 | 优势方反击伤害占比较高 |

## Preset Summary

### 炼金异常 `alchemyChaos`

- Extreme advantages: 4; repeated tags: statusSetup x4, damageLead x4, dotPressure x4, burstWindow x2.
- Extreme disadvantages: 6; repeated tags: sustainGap x4, burstWindow x4, lowCounterplay x4, earlyCollapse x2.
- Advantage cases:
  - alchemyChaos vs ironWall: 93%; 状态铺垫过快 + 总伤害碾压.
  - alchemyChaos vs lightningTempo: 97%; 治疗/护盾资源差距过大 + 状态铺垫过快.
  - ironWall vs alchemyChaos: 7%; 状态铺垫过快 + 总伤害碾压.
  - lightningTempo vs alchemyChaos: 3%; 治疗/护盾资源差距过大 + 状态铺垫过快.
- Disadvantage cases:
  - alchemyChaos vs crownCarry: 0%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - alchemyChaos vs fireBurst: 0%; 弱势方反制资源不足.
  - alchemyChaos vs poisonBloom: 0%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - crownCarry vs alchemyChaos: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - fireBurst vs alchemyChaos: 100%; 弱势方反制资源不足.
  - poisonBloom vs alchemyChaos: 100%; 状态铺垫过快 + 治疗/护盾资源差距过大.

### 低血狂怒 `bloodRage`

- Extreme advantages: 2; repeated tags: damageLead x2, burstWindow x2, basicPressure x2.
- Extreme disadvantages: 10; repeated tags: damageLead x10, lowCounterplay x6, statusSetup x4, earlyCollapse x4.
- Advantage cases:
  - bloodRage vs holySustain: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - holySustain vs bloodRage: 0%; 总伤害碾压 + 2秒峰值爆发过强.
- Disadvantage cases:
  - bloodRage vs crownCarry: 0%; 总伤害碾压 + 普攻压力过高.
  - bloodRage vs fireBurst: 3%; 总伤害碾压 + 弱势方反制资源不足.
  - bloodRage vs lightningTempo: 0%; 控制窗口压制 + 总伤害碾压.
  - bloodRage vs poisonBloom: 0%; 状态铺垫过快 + 弱势方过早减员.
  - bloodRage vs shadowExecute: 0%; 状态铺垫过快 + 弱势方过早减员.
  - crownCarry vs bloodRage: 100%; 总伤害碾压 + 普攻压力过高.
  - fireBurst vs bloodRage: 97%; 总伤害碾压 + 弱势方反制资源不足.
  - lightningTempo vs bloodRage: 100%; 控制窗口压制 + 总伤害碾压.

### 王冠核心 `crownCarry`

- Extreme advantages: 12; repeated tags: damageLead x12, basicPressure x12, sustainGap x8, burstWindow x8.
- Extreme disadvantages: 4; repeated tags: statusSetup x4, damageLead x4, burstWindow x2, dotPressure x2.
- Advantage cases:
  - alchemyChaos vs crownCarry: 0%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - bloodRage vs crownCarry: 0%; 总伤害碾压 + 普攻压力过高.
  - crownCarry vs alchemyChaos: 100%; 弱势方过早减员 + 治疗/护盾资源差距过大.
  - crownCarry vs bloodRage: 100%; 总伤害碾压 + 普攻压力过高.
  - crownCarry vs frostControl: 100%; 弱势方过早减员 + 2秒峰值爆发过强.
  - crownCarry vs holySustain: 100%; 总伤害碾压 + 普攻压力过高.
  - crownCarry vs ironWall: 100%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - crownCarry vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.
- Disadvantage cases:
  - crownCarry vs fireBurst: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - crownCarry vs poisonBloom: 3%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs crownCarry: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - poisonBloom vs crownCarry: 97%; 状态铺垫过快 + 总伤害碾压.

### 余烬爆燃 `fireBurst`

- Extreme advantages: 12; repeated tags: damageLead x8, statusSetup x8, burstWindow x8, lowCounterplay x6.
- Extreme disadvantages: 2; repeated tags: sustainGap x2, earlyCollapse x2, burstWindow x2, damageLead x2.
- Advantage cases:
  - alchemyChaos vs fireBurst: 0%; 弱势方反制资源不足.
  - bloodRage vs fireBurst: 3%; 总伤害碾压 + 弱势方反制资源不足.
  - crownCarry vs fireBurst: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - fireBurst vs alchemyChaos: 100%; 弱势方反制资源不足.
  - fireBurst vs bloodRage: 97%; 总伤害碾压 + 弱势方反制资源不足.
  - fireBurst vs crownCarry: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - fireBurst vs frostControl: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - fireBurst vs holySustain: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
- Disadvantage cases:
  - fireBurst vs shadowExecute: 0%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - shadowExecute vs fireBurst: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.

### 霜控拖延 `frostControl`

- Extreme advantages: 4; repeated tags: controlPressure x4, statusSetup x4, damageLead x4, basicPressure x2.
- Extreme disadvantages: 8; repeated tags: burstWindow x8, sustainGap x6, damageLead x6, statusSetup x6.
- Advantage cases:
  - frostControl vs holySustain: 100%; 控制窗口压制 + 状态铺垫过快.
  - frostControl vs ironWall: 100%; 控制窗口压制 + 状态铺垫过快.
  - holySustain vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
  - ironWall vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
- Disadvantage cases:
  - crownCarry vs frostControl: 100%; 弱势方过早减员 + 2秒峰值爆发过强.
  - fireBurst vs frostControl: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs crownCarry: 0%; 弱势方过早减员 + 2秒峰值爆发过强.
  - frostControl vs fireBurst: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs poisonBloom: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs shadowExecute: 0%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - poisonBloom vs frostControl: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - shadowExecute vs frostControl: 100%; 状态铺垫过快 + 治疗/护盾资源差距过大.

### 圣盾续航 `holySustain`

- Extreme advantages: 0; repeated tags: -.
- Extreme disadvantages: 12; repeated tags: damageLead x12, statusSetup x8, burstWindow x6, basicPressure x6.
- Disadvantage cases:
  - bloodRage vs holySustain: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - crownCarry vs holySustain: 100%; 总伤害碾压 + 普攻压力过高.
  - fireBurst vs holySustain: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs holySustain: 100%; 控制窗口压制 + 状态铺垫过快.
  - holySustain vs bloodRage: 0%; 总伤害碾压 + 2秒峰值爆发过强.
  - holySustain vs crownCarry: 0%; 总伤害碾压 + 普攻压力过高.
  - holySustain vs fireBurst: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - holySustain vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.

### 铁壁反击 `ironWall`

- Extreme advantages: 2; repeated tags: sustainGap x2, basicPressure x2, counterValue x2, lowCounterplay x2.
- Extreme disadvantages: 10; repeated tags: damageLead x10, statusSetup x8, burstWindow x8, dotPressure x6.
- Advantage cases:
  - ironWall vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs ironWall: 0%; 治疗/护盾资源差距过大 + 普攻压力过高.
- Disadvantage cases:
  - alchemyChaos vs ironWall: 93%; 状态铺垫过快 + 总伤害碾压.
  - crownCarry vs ironWall: 100%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - frostControl vs ironWall: 100%; 控制窗口压制 + 状态铺垫过快.
  - ironWall vs alchemyChaos: 7%; 状态铺垫过快 + 总伤害碾压.
  - ironWall vs crownCarry: 0%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - ironWall vs frostControl: 0%; 控制窗口压制 + 状态铺垫过快.
  - ironWall vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - ironWall vs shadowExecute: 0%; 状态铺垫过快 + 总伤害碾压.

### 急速节奏 `lightningTempo`

- Extreme advantages: 4; repeated tags: controlPressure x4, damageLead x4, lowCounterplay x2, basicPressure x2.
- Extreme disadvantages: 8; repeated tags: sustainGap x8, damageLead x6, statusSetup x4, dotPressure x4.
- Advantage cases:
  - bloodRage vs lightningTempo: 0%; 控制窗口压制 + 总伤害碾压.
  - lightningTempo vs bloodRage: 100%; 控制窗口压制 + 总伤害碾压.
  - lightningTempo vs shadowExecute: 93%; 控制窗口压制 + 总伤害碾压.
  - shadowExecute vs lightningTempo: 7%; 控制窗口压制 + 总伤害碾压.
- Disadvantage cases:
  - alchemyChaos vs lightningTempo: 97%; 治疗/护盾资源差距过大 + 状态铺垫过快.
  - crownCarry vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - ironWall vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs alchemyChaos: 3%; 治疗/护盾资源差距过大 + 状态铺垫过快.
  - lightningTempo vs crownCarry: 0%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - lightningTempo vs ironWall: 0%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs poisonBloom: 0%; 治疗/护盾资源差距过大 + 状态铺垫过快.
  - poisonBloom vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 状态铺垫过快.

### 毒巢滚雪球 `poisonBloom`

- Extreme advantages: 16; repeated tags: statusSetup x16, dotPressure x14, damageLead x12, sustainGap x10.
- Extreme disadvantages: 2; repeated tags: statusSetup x2, burstWindow x2.
- Advantage cases:
  - alchemyChaos vs poisonBloom: 0%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - bloodRage vs poisonBloom: 0%; 状态铺垫过快 + 弱势方过早减员.
  - crownCarry vs poisonBloom: 3%; 状态铺垫过快 + 总伤害碾压.
  - frostControl vs poisonBloom: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - holySustain vs poisonBloom: 0%; 状态铺垫过快 + 弱势方过早减员.
  - ironWall vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - lightningTempo vs poisonBloom: 0%; 治疗/护盾资源差距过大 + 状态铺垫过快.
  - poisonBloom vs alchemyChaos: 100%; 状态铺垫过快 + 治疗/护盾资源差距过大.
- Disadvantage cases:
  - fireBurst vs poisonBloom: 93%; 状态铺垫过快 + 2秒峰值爆发过强.
  - poisonBloom vs fireBurst: 7%; 状态铺垫过快 + 2秒峰值爆发过强.

### 暗影处决 `shadowExecute`

- Extreme advantages: 10; repeated tags: burstWindow x10, executePressure x10, statusSetup x8, damageLead x8.
- Extreme disadvantages: 4; repeated tags: controlPressure x2, damageLead x2, basicPressure x2, statusSetup x2.
- Advantage cases:
  - bloodRage vs shadowExecute: 0%; 状态铺垫过快 + 弱势方过早减员.
  - fireBurst vs shadowExecute: 0%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - frostControl vs shadowExecute: 0%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - holySustain vs shadowExecute: 0%; 状态铺垫过快 + 弱势方过早减员.
  - ironWall vs shadowExecute: 0%; 状态铺垫过快 + 总伤害碾压.
  - shadowExecute vs bloodRage: 100%; 状态铺垫过快 + 弱势方过早减员.
  - shadowExecute vs fireBurst: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - shadowExecute vs frostControl: 100%; 状态铺垫过快 + 治疗/护盾资源差距过大.
- Disadvantage cases:
  - lightningTempo vs shadowExecute: 93%; 控制窗口压制 + 总伤害碾压.
  - poisonBloom vs shadowExecute: 100%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - shadowExecute vs lightningTempo: 7%; 控制窗口压制 + 总伤害碾压.
  - shadowExecute vs poisonBloom: 0%; 状态铺垫过快 + 治疗/护盾资源差距过大.

## Extreme Matchup Details

### 炼金异常 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 炼金异常.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.26 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 4.23 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.2 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.44 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1598.3, basic 100%, DOT 0%, peak 667.6, sustain 354.4+490.6, first death none.
- Disadvantaged metrics: damage 1106.2, basic 26%, DOT 38%, peak 302.8, sustain 0+199.9, first death 11.26.

### 炼金异常 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 炼金异常.
- Headline: 弱势方反制资源不足.
- Top reasons: 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 19%。).
- Advantaged metrics: damage 1206.8, basic 25%, DOT 11%, peak 363.8, sustain 0+148, first death 11.55.
- Disadvantaged metrics: damage 1041.5, basic 30%, DOT 24%, peak 339.1, sustain 0+211.2, first death 11.16.

### 炼金异常 into 铁壁反击

- Rate: 93%; advantaged: 炼金异常; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 57.9。); 总伤害碾压 (优势方总伤害约为弱势方 2.08 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.04 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 25%。).
- Advantaged metrics: damage 1602.8, basic 33%, DOT 25%, peak 337.6, sustain 0+743.2, first death 15.72.
- Disadvantaged metrics: damage 770.4, basic 79%, DOT 0%, peak 165.5, sustain 332.2+1007.4, first death 12.08.

### 炼金异常 into 急速节奏

- Rate: 97%; advantaged: 炼金异常; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 状态铺垫过快.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 31.6。); 总伤害碾压 (优势方总伤害约为弱势方 1.27 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 22%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1236.4, basic 37%, DOT 22%, peak 321.7, sustain 0+181.6, first death 4.1.
- Disadvantaged metrics: damage 971.1, basic 50%, DOT 0%, peak 366.8, sustain 0+0, first death 6.56.

### 炼金异常 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 炼金异常.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 51.2。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.81 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.35 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 29%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 20%。).
- Advantaged metrics: damage 1226.1, basic 26%, DOT 29%, peak 406.5, sustain 133+441.9, first death 6.46.
- Disadvantaged metrics: damage 1030.9, basic 34%, DOT 21%, peak 300.5, sustain 0+204.5, first death 7.57.

### 低血狂怒 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.34 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 34%。).
- Advantaged metrics: damage 1874.9, basic 100%, DOT 0%, peak 396.3, sustain 276.7+395.3, first death 10.84.
- Disadvantaged metrics: damage 1400.7, basic 100%, DOT 0%, peak 685, sustain 366.9+203.1, first death 9.99.

### 低血狂怒 into 余烬爆燃

- Rate: 3%; advantaged: 余烬爆燃; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 弱势方反制资源不足.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.88 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 21%。).
- Advantaged metrics: damage 1434, basic 31%, DOT 9%, peak 386.6, sustain 0+167.6, first death 7.95.
- Disadvantaged metrics: damage 761.8, basic 74%, DOT 0%, peak 315.1, sustain 154.4+123.4, first death 7.95.

### 低血狂怒 into 圣盾续航

- Rate: 100%; advantaged: 低血狂怒; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.06 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 91%。).
- Advantaged metrics: damage 1825.6, basic 91%, DOT 0%, peak 399, sustain 479.1+239.5, first death 12.15.
- Disadvantaged metrics: damage 887.5, basic 61%, DOT 0%, peak 235.6, sustain 423.7+739.5, first death 11.84.

### 低血狂怒 into 急速节奏

- Rate: 0%; advantaged: 急速节奏; disadvantaged: 低血狂怒.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.69 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 26%。).
- Advantaged metrics: damage 1570, basic 56%, DOT 0%, peak 429.9, sustain 0+0, first death 7.6.
- Disadvantaged metrics: damage 931.4, basic 84%, DOT 0%, peak 341.6, sustain 232.6+159.2, first death 6.38.

### 低血狂怒 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 42。); 弱势方过早减员 (弱势方平均首死约在 5.82 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.69 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.5 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.42 倍。).
- Advantaged metrics: damage 1471.2, basic 33%, DOT 18%, peak 429.3, sustain 133+411.5, first death none.
- Disadvantaged metrics: damage 588.3, basic 88%, DOT 0%, peak 303.2, sustain 117.8+84.9, first death 5.82.

### 低血狂怒 into 暗影处决

- Rate: 0%; advantaged: 暗影处决; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 25.1。); 弱势方过早减员 (弱势方平均首死约在 3.76 秒。); 总伤害碾压 (优势方总伤害约为弱势方 3.67 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.18 倍。); 处决压力过稳定 (优势方处决伤害占比约 29%。).
- Advantaged metrics: damage 1465.1, basic 35%, DOT 10%, peak 621.3, sustain 0+275.2, first death 8.23.
- Disadvantaged metrics: damage 399.1, basic 75%, DOT 0%, peak 195.5, sustain 108.4+112, first death 3.76.

### 王冠核心 into 炼金异常

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 炼金异常.
- Headline: 弱势方过早减员 + 治疗/护盾资源差距过大.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.26 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 4.23 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.2 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.44 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1598.3, basic 100%, DOT 0%, peak 667.6, sustain 354.4+490.6, first death none.
- Disadvantaged metrics: damage 1106.2, basic 26%, DOT 38%, peak 302.8, sustain 0+199.9, first death 11.26.

### 王冠核心 into 低血狂怒

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.34 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 34%。).
- Advantaged metrics: damage 1874.9, basic 100%, DOT 0%, peak 396.3, sustain 276.7+395.3, first death 10.84.
- Disadvantaged metrics: damage 1400.7, basic 100%, DOT 0%, peak 685, sustain 366.9+203.1, first death 9.99.

### 王冠核心 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 王冠核心.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 36.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.66 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.35 倍。).
- Advantaged metrics: damage 1641.7, basic 22%, DOT 19%, peak 609, sustain 0+141.9, first death 11.22.
- Disadvantaged metrics: damage 1214.7, basic 100%, DOT 0%, peak 366.8, sustain 265.8+420, first death 12.54.

### 王冠核心 into 霜控拖延

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 霜控拖延.
- Headline: 弱势方过早减员 + 2秒峰值爆发过强.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.96 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.38 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.82 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.66 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1521.5, basic 100%, DOT 0%, peak 505.3, sustain 348.8+554.6, first death none.
- Disadvantaged metrics: damage 915.2, basic 31%, DOT 30%, peak 212, sustain 134.5+361.1, first death 11.96.

### 王冠核心 into 圣盾续航

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 6.47 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 2361.3, basic 100%, DOT 0%, peak 296.6, sustain 364.9+1875, first death none.
- Disadvantaged metrics: damage 364.9, basic 65%, DOT 0%, peak 134.6, sustain 954.6+2064.6, first death 20.83.

### 王冠核心 into 铁壁反击

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 铁壁反击.
- Headline: 总伤害碾压 + 治疗/护盾资源差距过大.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.36 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.79 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1515.7, basic 100%, DOT 0%, peak 352.8, sustain 455.2+1036.9, first death none.
- Disadvantaged metrics: damage 642.6, basic 66%, DOT 0%, peak 208.7, sustain 145+689.2, first death 12.41.

### 王冠核心 into 急速节奏

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 9.12 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.77 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.58 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1580.8, basic 100%, DOT 0%, peak 491.7, sustain 340.8+523.6, first death none.
- Disadvantaged metrics: damage 891.9, basic 51%, DOT 0%, peak 311.4, sustain 0+0, first death 9.12.

### 王冠核心 into 毒巢滚雪球

- Rate: 3%; advantaged: 毒巢滚雪球; disadvantaged: 王冠核心.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 56.5。); 总伤害碾压 (优势方总伤害约为弱势方 1.31 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 32%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1517.9, basic 22%, DOT 32%, peak 520.3, sustain 131.6+439.6, first death 11.14.
- Disadvantaged metrics: damage 1160.1, basic 100%, DOT 0%, peak 435.3, sustain 242+398.7, first death 10.37.

### 余烬爆燃 into 炼金异常

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 炼金异常.
- Headline: 弱势方反制资源不足.
- Top reasons: 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 19%。).
- Advantaged metrics: damage 1206.8, basic 25%, DOT 11%, peak 363.8, sustain 0+148, first death 11.55.
- Disadvantaged metrics: damage 1041.5, basic 30%, DOT 24%, peak 339.1, sustain 0+211.2, first death 11.16.

### 余烬爆燃 into 低血狂怒

- Rate: 97%; advantaged: 余烬爆燃; disadvantaged: 低血狂怒.
- Headline: 总伤害碾压 + 弱势方反制资源不足.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 1.88 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 21%。).
- Advantaged metrics: damage 1434, basic 31%, DOT 9%, peak 386.5, sustain 0+167.6, first death 7.95.
- Disadvantaged metrics: damage 761.8, basic 74%, DOT 0%, peak 315.1, sustain 154.4+123.4, first death 7.95.

### 余烬爆燃 into 王冠核心

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 王冠核心.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 36.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.66 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.35 倍。).
- Advantaged metrics: damage 1641.7, basic 22%, DOT 19%, peak 609, sustain 0+141.9, first death 11.22.
- Disadvantaged metrics: damage 1214.7, basic 100%, DOT 0%, peak 366.8, sustain 265.8+420, first death 12.54.

### 余烬爆燃 into 霜控拖延

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 28.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.77 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 31%。).
- Advantaged metrics: damage 1385.5, basic 22%, DOT 14%, peak 565.9, sustain 0+146.2, first death 14.09.
- Disadvantaged metrics: damage 1011.2, basic 31%, DOT 25%, peak 320.5, sustain 111.8+287.5, first death 12.54.

### 余烬爆燃 into 圣盾续航

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 41.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 4.05 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.99 倍。).
- Advantaged metrics: damage 1877.8, basic 27%, DOT 19%, peak 699.1, sustain 0+268.1, first death 16.76.
- Disadvantaged metrics: damage 628.4, basic 59%, DOT 0%, peak 172.7, sustain 534.5+781.8, first death 14.66.

### 余烬爆燃 into 毒巢滚雪球

- Rate: 93%; advantaged: 余烬爆燃; disadvantaged: 毒巢滚雪球.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 34。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.52 倍。).
- Advantaged metrics: damage 1352.9, basic 30%, DOT 11%, peak 609.9, sustain 0+229.2, first death 4.16.
- Disadvantaged metrics: damage 1110.9, basic 23%, DOT 23%, peak 400.4, sustain 133+396.1, first death 8.49.

### 余烬爆燃 into 暗影处决

- Rate: 0%; advantaged: 暗影处决; disadvantaged: 余烬爆燃.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 6.57 倍。); 弱势方过早减员 (弱势方平均首死约在 3.74 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.82 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.21 倍。); 处决压力过稳定 (优势方处决伤害占比约 26%。).
- Advantaged metrics: damage 1287.6, basic 31%, DOT 8%, peak 617, sustain 0+213.2, first death 8.91.
- Disadvantaged metrics: damage 581.3, basic 36%, DOT 14%, peak 218.8, sustain 0+32.4, first death 3.74.

### 霜控拖延 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 霜控拖延.
- Headline: 弱势方过早减员 + 2秒峰值爆发过强.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.96 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.38 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.82 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.66 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1521.5, basic 100%, DOT 0%, peak 505.3, sustain 348.8+554.6, first death none.
- Disadvantaged metrics: damage 915.2, basic 31%, DOT 30%, peak 212, sustain 134.5+361.1, first death 11.96.

### 霜控拖延 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 28.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.77 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 31%。).
- Advantaged metrics: damage 1385.5, basic 22%, DOT 14%, peak 565.9, sustain 0+146.2, first death 14.09.
- Disadvantaged metrics: damage 1011.2, basic 31%, DOT 25%, peak 320.5, sustain 111.8+287.5, first death 12.54.

### 霜控拖延 into 圣盾续航

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 91.6。); 总伤害碾压 (优势方总伤害约为弱势方 3.58 倍。); 普攻压力过高 (优势方普攻占自身输出约 48%。).
- Advantaged metrics: damage 2143.8, basic 48%, DOT 13%, peak 228.8, sustain 583.3+2831.3, first death none.
- Disadvantaged metrics: damage 598, basic 69%, DOT 0%, peak 116.1, sustain 1714.5+3814.8, first death 27.18.

### 霜控拖延 into 铁壁反击

- Rate: 100%; advantaged: 霜控拖延; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 48.6。); 总伤害碾压 (优势方总伤害约为弱势方 2.77 倍。).
- Advantaged metrics: damage 1854, basic 43%, DOT 14%, peak 215.1, sustain 507.2+1619.5, first death none.
- Disadvantaged metrics: damage 670.2, basic 66%, DOT 0%, peak 195.1, sustain 526.7+1271.7, first death 18.15.

### 霜控拖延 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 60.4。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.61 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.58 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.27 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 33%。).
- Advantaged metrics: damage 1383.1, basic 30%, DOT 33%, peak 363.8, sustain 192.8+638.6, first death 9.03.
- Disadvantaged metrics: damage 1090, basic 42%, DOT 18%, peak 225.4, sustain 136.4+388.4, first death 13.25.

### 霜控拖延 into 暗影处决

- Rate: 0%; advantaged: 暗影处决; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 28.8。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.62 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 22%。); 处决压力过稳定 (优势方处决伤害占比约 21%。).
- Advantaged metrics: damage 1290.9, basic 37%, DOT 22%, peak 406.5, sustain 0+599.3, first death 5.98.
- Disadvantaged metrics: damage 1087.9, basic 38%, DOT 15%, peak 251.7, sustain 0+299, first death 4.3.

### 圣盾续航 into 低血狂怒

- Rate: 0%; advantaged: 低血狂怒; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.06 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 91%。).
- Advantaged metrics: damage 1825.6, basic 91%, DOT 0%, peak 399, sustain 479.1+239.5, first death 12.15.
- Disadvantaged metrics: damage 887.5, basic 61%, DOT 0%, peak 235.6, sustain 423.7+739.5, first death 11.84.

### 圣盾续航 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 6.47 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 2361.3, basic 100%, DOT 0%, peak 296.6, sustain 364.9+1875, first death none.
- Disadvantaged metrics: damage 364.9, basic 65%, DOT 0%, peak 134.6, sustain 954.6+2064.6, first death 20.83.

### 圣盾续航 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 41.2。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 4.05 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.99 倍。).
- Advantaged metrics: damage 1877.8, basic 27%, DOT 19%, peak 699.1, sustain 0+268.1, first death 16.76.
- Disadvantaged metrics: damage 628.4, basic 59%, DOT 0%, peak 172.7, sustain 534.5+781.8, first death 14.66.

### 圣盾续航 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 圣盾续航.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 91.6。); 总伤害碾压 (优势方总伤害约为弱势方 3.58 倍。); 普攻压力过高 (优势方普攻占自身输出约 48%。).
- Advantaged metrics: damage 2143.8, basic 48%, DOT 13%, peak 228.8, sustain 583.3+2831.3, first death none.
- Disadvantaged metrics: damage 598, basic 69%, DOT 0%, peak 116.1, sustain 1714.5+3814.8, first death 27.18.

### 圣盾续航 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 99.6。); 弱势方过早减员 (弱势方平均首死约在 11.54 秒。); 总伤害碾压 (优势方总伤害约为弱势方 4.48 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 2309.1, basic 28%, DOT 39%, peak 345.5, sustain 210.9+1466.3, first death 18.94.
- Disadvantaged metrics: damage 515.2, basic 77%, DOT 0%, peak 156.1, sustain 969.5+1694.2, first death 11.54.

### 圣盾续航 into 暗影处决

- Rate: 0%; advantaged: 暗影处决; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 56.9。); 弱势方过早减员 (弱势方平均首死约在 5.86 秒。); 总伤害碾压 (优势方总伤害约为弱势方 3.8 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.84 倍。); 处决压力过稳定 (优势方处决伤害占比约 19%。).
- Advantaged metrics: damage 2133.6, basic 32%, DOT 21%, peak 415, sustain 0+883.8, first death 8.94.
- Disadvantaged metrics: damage 560.8, basic 74%, DOT 0%, peak 145.9, sustain 660.1+1125, first death 5.86.

### 铁壁反击 into 炼金异常

- Rate: 7%; advantaged: 炼金异常; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 57.9。); 总伤害碾压 (优势方总伤害约为弱势方 2.08 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.04 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 25%。).
- Advantaged metrics: damage 1602.8, basic 33%, DOT 25%, peak 337.6, sustain 0+743.2, first death 15.72.
- Disadvantaged metrics: damage 770.4, basic 79%, DOT 0%, peak 165.5, sustain 332.2+1007.4, first death 12.08.

### 铁壁反击 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 铁壁反击.
- Headline: 总伤害碾压 + 治疗/护盾资源差距过大.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.36 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.79 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.69 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1515.7, basic 100%, DOT 0%, peak 352.8, sustain 455.2+1036.9, first death none.
- Disadvantaged metrics: damage 642.6, basic 66%, DOT 0%, peak 208.7, sustain 145+689.2, first death 12.41.

### 铁壁反击 into 霜控拖延

- Rate: 0%; advantaged: 霜控拖延; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 48.6。); 总伤害碾压 (优势方总伤害约为弱势方 2.77 倍。).
- Advantaged metrics: damage 1854, basic 43%, DOT 14%, peak 215.1, sustain 507.2+1619.5, first death none.
- Disadvantaged metrics: damage 670.2, basic 66%, DOT 0%, peak 195.1, sustain 526.7+1271.7, first death 18.15.

### 铁壁反击 into 急速节奏

- Rate: 100%; advantaged: 铁壁反击; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 普攻压力过高.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 普攻压力过高 (优势方普攻占自身输出约 78%。); 反击收益过高 (优势方反击伤害占比约 9%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1250.7, basic 78%, DOT 0%, peak 322.8, sustain 363.7+973, first death 6.54.
- Disadvantaged metrics: damage 1180.4, basic 48%, DOT 0%, peak 335.1, sustain 0+0, first death 9.35.

### 铁壁反击 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 68.5。); 总伤害碾压 (优势方总伤害约为弱势方 3.11 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.19 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 33%。).
- Advantaged metrics: damage 1589.5, basic 27%, DOT 34%, peak 354.6, sustain 190.9+924.7, first death 10.22.
- Disadvantaged metrics: damage 511.9, basic 64%, DOT 0%, peak 162.2, sustain 233.7+755.6, first death 8.65.

### 铁壁反击 into 暗影处决

- Rate: 0%; advantaged: 暗影处决; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 45.3。); 总伤害碾压 (优势方总伤害约为弱势方 2.43 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.02 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 22%。); 处决压力过稳定 (优势方处决伤害占比约 20%。).
- Advantaged metrics: damage 1718.9, basic 33%, DOT 22%, peak 416.2, sustain 0+714.1, first death 6.72.
- Disadvantaged metrics: damage 707.5, basic 67%, DOT 0%, peak 206.5, sustain 369+742.4, first death 4.38.

### 急速节奏 into 炼金异常

- Rate: 3%; advantaged: 炼金异常; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 状态铺垫过快.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 31.6。); 总伤害碾压 (优势方总伤害约为弱势方 1.27 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 22%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1236.4, basic 37%, DOT 22%, peak 321.7, sustain 0+181.6, first death 4.1.
- Disadvantaged metrics: damage 971.1, basic 50%, DOT 0%, peak 366.8, sustain 0+0, first death 6.56.

### 急速节奏 into 低血狂怒

- Rate: 100%; advantaged: 急速节奏; disadvantaged: 低血狂怒.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.69 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 26%。).
- Advantaged metrics: damage 1570, basic 56%, DOT 0%, peak 429.9, sustain 0+0, first death 7.6.
- Disadvantaged metrics: damage 931.4, basic 84%, DOT 0%, peak 341.6, sustain 232.6+159.2, first death 6.38.

### 急速节奏 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 9.12 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.77 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.58 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1580.8, basic 100%, DOT 0%, peak 491.7, sustain 340.8+523.6, first death none.
- Disadvantaged metrics: damage 891.9, basic 51%, DOT 0%, peak 311.4, sustain 0+0, first death 9.12.

### 急速节奏 into 铁壁反击

- Rate: 0%; advantaged: 铁壁反击; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 普攻压力过高.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 普攻压力过高 (优势方普攻占自身输出约 78%。); 反击收益过高 (优势方反击伤害占比约 9%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1250.7, basic 78%, DOT 0%, peak 322.8, sustain 363.7+973, first death 6.54.
- Disadvantaged metrics: damage 1180.4, basic 48%, DOT 0%, peak 335.1, sustain 0+0, first death 9.35.

### 急速节奏 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 状态铺垫过快.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 50.5。); 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.4 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 24%。).
- Advantaged metrics: damage 1367.3, basic 30%, DOT 24%, peak 436.6, sustain 106.2+358.5, first death 4.05.
- Disadvantaged metrics: damage 998.2, basic 57%, DOT 0%, peak 311.1, sustain 0+0, first death 5.41.

### 急速节奏 into 暗影处决

- Rate: 93%; advantaged: 急速节奏; disadvantaged: 暗影处决.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.36 倍。); 普攻压力过高 (优势方普攻占自身输出约 54%。).
- Advantaged metrics: damage 1230, basic 54%, DOT 0%, peak 378.2, sustain 0+0, first death 5.34.
- Disadvantaged metrics: damage 907.4, basic 43%, DOT 14%, peak 390.5, sustain 0+442.3, first death 3.78.

### 毒巢滚雪球 into 炼金异常

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 炼金异常.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 51.2。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.81 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.35 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 29%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 20%。).
- Advantaged metrics: damage 1226.1, basic 26%, DOT 29%, peak 406.5, sustain 133+441.9, first death 6.46.
- Disadvantaged metrics: damage 1030.9, basic 34%, DOT 21%, peak 300.5, sustain 0+204.5, first death 7.57.

### 毒巢滚雪球 into 低血狂怒

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 42。); 弱势方过早减员 (弱势方平均首死约在 5.82 秒。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.69 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.5 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.42 倍。).
- Advantaged metrics: damage 1471.1, basic 33%, DOT 18%, peak 429.3, sustain 133+411.5, first death none.
- Disadvantaged metrics: damage 588.3, basic 88%, DOT 0%, peak 303.2, sustain 117.8+84.9, first death 5.82.

### 毒巢滚雪球 into 王冠核心

- Rate: 97%; advantaged: 毒巢滚雪球; disadvantaged: 王冠核心.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 56.5。); 总伤害碾压 (优势方总伤害约为弱势方 1.31 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 32%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1517.9, basic 22%, DOT 32%, peak 520.3, sustain 131.6+439.6, first death 11.14.
- Disadvantaged metrics: damage 1160.1, basic 100%, DOT 0%, peak 435.3, sustain 242+398.7, first death 10.37.

### 毒巢滚雪球 into 余烬爆燃

- Rate: 7%; advantaged: 余烬爆燃; disadvantaged: 毒巢滚雪球.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 34。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.52 倍。).
- Advantaged metrics: damage 1352.9, basic 30%, DOT 11%, peak 609.9, sustain 0+229.2, first death 4.16.
- Disadvantaged metrics: damage 1110.9, basic 23%, DOT 23%, peak 400.4, sustain 133+396.1, first death 8.49.

### 毒巢滚雪球 into 霜控拖延

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 60.4。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.61 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.58 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.27 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 33%。).
- Advantaged metrics: damage 1383.1, basic 30%, DOT 33%, peak 363.8, sustain 192.8+638.6, first death 9.03.
- Disadvantaged metrics: damage 1090, basic 42%, DOT 18%, peak 225.4, sustain 136.4+388.4, first death 13.25.

### 毒巢滚雪球 into 圣盾续航

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 99.6。); 弱势方过早减员 (弱势方平均首死约在 11.54 秒。); 总伤害碾压 (优势方总伤害约为弱势方 4.48 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 39%。).
- Advantaged metrics: damage 2309.1, basic 28%, DOT 39%, peak 345.5, sustain 210.9+1466.3, first death 18.94.
- Disadvantaged metrics: damage 515.2, basic 77%, DOT 0%, peak 156.1, sustain 969.5+1694.2, first death 11.54.

### 毒巢滚雪球 into 铁壁反击

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 68.5。); 总伤害碾压 (优势方总伤害约为弱势方 3.11 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.19 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 33%。).
- Advantaged metrics: damage 1589.5, basic 27%, DOT 34%, peak 354.6, sustain 190.9+924.7, first death 10.22.
- Disadvantaged metrics: damage 511.9, basic 64%, DOT 0%, peak 162.2, sustain 233.7+755.6, first death 8.65.

### 毒巢滚雪球 into 急速节奏

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 状态铺垫过快.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 50.5。); 总伤害碾压 (优势方总伤害约为弱势方 1.37 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.4 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 24%。).
- Advantaged metrics: damage 1367.3, basic 30%, DOT 24%, peak 436.6, sustain 106.2+358.5, first death 4.05.
- Disadvantaged metrics: damage 998.2, basic 57%, DOT 0%, peak 311.1, sustain 0+0, first death 5.41.

### 毒巢滚雪球 into 暗影处决

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 50.9。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.85 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 36%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 27%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1286.2, basic 35%, DOT 36%, peak 310, sustain 100.9+420.5, first death 3.67.
- Disadvantaged metrics: damage 1278.9, basic 35%, DOT 19%, peak 411.1, sustain 0+282.4, first death 6.34.

### 暗影处决 into 低血狂怒

- Rate: 100%; advantaged: 暗影处决; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 25.1。); 弱势方过早减员 (弱势方平均首死约在 3.76 秒。); 总伤害碾压 (优势方总伤害约为弱势方 3.67 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.18 倍。); 处决压力过稳定 (优势方处决伤害占比约 29%。).
- Advantaged metrics: damage 1465.1, basic 35%, DOT 10%, peak 621.3, sustain 0+275.2, first death 8.23.
- Disadvantaged metrics: damage 399.1, basic 75%, DOT 0%, peak 195.5, sustain 108.4+112, first death 3.76.

### 暗影处决 into 余烬爆燃

- Rate: 100%; advantaged: 暗影处决; disadvantaged: 余烬爆燃.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 6.57 倍。); 弱势方过早减员 (弱势方平均首死约在 3.74 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.82 倍。); 总伤害碾压 (优势方总伤害约为弱势方 2.21 倍。); 处决压力过稳定 (优势方处决伤害占比约 26%。).
- Advantaged metrics: damage 1287.6, basic 31%, DOT 8%, peak 617, sustain 0+213.2, first death 8.91.
- Disadvantaged metrics: damage 581.3, basic 36%, DOT 14%, peak 218.8, sustain 0+32.4, first death 3.74.

### 暗影处决 into 霜控拖延

- Rate: 100%; advantaged: 暗影处决; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 28.8。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.62 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 22%。); 处决压力过稳定 (优势方处决伤害占比约 21%。).
- Advantaged metrics: damage 1290.9, basic 37%, DOT 22%, peak 406.5, sustain 0+599.3, first death 5.98.
- Disadvantaged metrics: damage 1087.9, basic 38%, DOT 15%, peak 251.7, sustain 0+299, first death 4.3.

### 暗影处决 into 圣盾续航

- Rate: 100%; advantaged: 暗影处决; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 弱势方过早减员.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 56.9。); 弱势方过早减员 (弱势方平均首死约在 5.86 秒。); 总伤害碾压 (优势方总伤害约为弱势方 3.8 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.84 倍。); 处决压力过稳定 (优势方处决伤害占比约 19%。).
- Advantaged metrics: damage 2133.6, basic 32%, DOT 21%, peak 415, sustain 0+883.8, first death 8.94.
- Disadvantaged metrics: damage 560.8, basic 74%, DOT 0%, peak 145.9, sustain 660.1+1125, first death 5.86.

### 暗影处决 into 铁壁反击

- Rate: 100%; advantaged: 暗影处决; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 45.3。); 总伤害碾压 (优势方总伤害约为弱势方 2.43 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.02 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 22%。); 处决压力过稳定 (优势方处决伤害占比约 20%。).
- Advantaged metrics: damage 1718.9, basic 33%, DOT 22%, peak 416.2, sustain 0+714.1, first death 6.72.
- Disadvantaged metrics: damage 707.5, basic 67%, DOT 0%, peak 206.5, sustain 369+742.4, first death 4.38.

### 暗影处决 into 急速节奏

- Rate: 7%; advantaged: 急速节奏; disadvantaged: 暗影处决.
- Headline: 控制窗口压制 + 总伤害碾压.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.36 倍。); 普攻压力过高 (优势方普攻占自身输出约 54%。).
- Advantaged metrics: damage 1230, basic 54%, DOT 0%, peak 378.2, sustain 0+0, first death 5.34.
- Disadvantaged metrics: damage 907.4, basic 43%, DOT 14%, peak 390.5, sustain 0+442.3, first death 3.78.

### 暗影处决 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 50.9。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.85 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 36%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 27%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 9%。).
- Advantaged metrics: damage 1286.2, basic 35%, DOT 36%, peak 310, sustain 100.9+420.5, first death 3.67.
- Disadvantaged metrics: damage 1278.9, basic 35%, DOT 19%, peak 411.1, sustain 0+282.4, first death 6.34.

