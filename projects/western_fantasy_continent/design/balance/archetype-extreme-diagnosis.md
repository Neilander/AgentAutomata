# Archetype Extreme Matchup Diagnosis

Generated from `design\balance\archetype-matchup-evidence.json`. This report diagnoses extreme ordered matchups; it does not recommend direct numeric changes by itself.

## Summary

- Extreme ordered matchups: 38.
- Ecology health: review; polarization score 0.6163.
- Extreme thresholds: <= 10% or >= 90%.
- Deterministic rule: In deterministic combat, 0/100 is acceptable when the winner has clear cost, clear predators, and causal explanation. Review all-rounders and preyless weak presets first.

## Ecology Review

- 王冠核心 all-rounder-risk: prey 6, predators 0.
- 余烬爆燃 all-rounder-risk: prey 5, predators 0.

| Preset | Status | Hard prey | Hard predators | Advantage categories |
| --- | --- | ---: | ---: | --- |
| 炼金异常 `alchemyChaos` | answered-niche | 0 | 2 | - |
| 低血狂怒 `bloodRage` | answered-niche | 1 | 1 | frontloadedDamage |
| 王冠核心 `crownCarry` | all-rounder-risk | 6 | 0 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 余烬爆燃 `fireBurst` | all-rounder-risk | 5 | 0 | frontloadedDamage, statusScaling, sustainOrCounterplay |
| 霜控拖延 `frostControl` | answered-niche | 1 | 4 | frontloadedDamage, statusScaling, tempoControl |
| 圣盾续航 `holySustain` | answered-niche | 1 | 4 | sustainOrCounterplay |
| 铁壁反击 `ironWall` | answered-niche | 1 | 4 | frontloadedDamage, sustainOrCounterplay, tempoControl |
| 急速节奏 `lightningTempo` | answered-niche | 0 | 2 | - |
| 毒巢滚雪球 `poisonBloom` | answered-niche | 4 | 0 | frontloadedDamage, statusScaling, sustainOrCounterplay |
| 暗影处决 `shadowExecute` | answered-niche | 0 | 2 | - |

## Repeated Cause Tags

| Cause tag | Count | Meaning |
| --- | ---: | --- |
| `damageLead` | 30 | 优势方总伤害显著领先 |
| `burstWindow` | 24 | 优势方短窗口爆发过强 |
| `statusSetup` | 18 | 优势方状态铺设量大 |
| `sustainGap` | 16 | 优势方治疗/护盾资源显著领先 |
| `basicPressure` | 16 | 优势方普攻输出占比高且领先 |
| `lowCounterplay` | 12 | 弱势方治疗/护盾/格挡反制不足 |
| `dotPressure` | 8 | 优势方 DOT/异常输出占比高 |
| `earlyCollapse` | 4 | 弱势方首死过早 |
| `controlPressure` | 2 | 优势方控制应用更密集 |
| `shieldWall` | 2 | 优势方护盾承伤占比高 |
| `counterValue` | 2 | 优势方反击伤害占比较高 |

## Preset Summary

### 炼金异常 `alchemyChaos`

- Extreme advantages: 0; repeated tags: -.
- Extreme disadvantages: 4; repeated tags: burstWindow x4, lowCounterplay x4, sustainGap x2, basicPressure x2.
- Disadvantage cases:
  - alchemyChaos vs crownCarry: 3%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - alchemyChaos vs fireBurst: 3%; 2秒峰值爆发过强 + 总伤害碾压.
  - crownCarry vs alchemyChaos: 97%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - fireBurst vs alchemyChaos: 97%; 2秒峰值爆发过强 + 总伤害碾压.

### 低血狂怒 `bloodRage`

- Extreme advantages: 2; repeated tags: damageLead x2, burstWindow x2, basicPressure x2.
- Extreme disadvantages: 2; repeated tags: statusSetup x2, damageLead x2, lowCounterplay x2.
- Advantage cases:
  - bloodRage vs holySustain: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - holySustain vs bloodRage: 0%; 总伤害碾压 + 2秒峰值爆发过强.
- Disadvantage cases:
  - bloodRage vs fireBurst: 0%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs bloodRage: 100%; 状态铺垫过快 + 总伤害碾压.

### 王冠核心 `crownCarry`

- Extreme advantages: 12; repeated tags: basicPressure x12, sustainGap x10, damageLead x10, burstWindow x8.
- Extreme disadvantages: 0; repeated tags: -.
- Advantage cases:
  - alchemyChaos vs crownCarry: 3%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - crownCarry vs alchemyChaos: 97%; 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
  - crownCarry vs frostControl: 100%; 弱势方过早减员 + 2秒峰值爆发过强.
  - crownCarry vs holySustain: 100%; 总伤害碾压 + 普攻压力过高.
  - crownCarry vs ironWall: 100%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - crownCarry vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - crownCarry vs shadowExecute: 90%; 治疗/护盾资源差距过大 + 总伤害碾压.
  - frostControl vs crownCarry: 0%; 弱势方过早减员 + 2秒峰值爆发过强.

### 余烬爆燃 `fireBurst`

- Extreme advantages: 10; repeated tags: damageLead x10, burstWindow x8, statusSetup x8, lowCounterplay x6.
- Extreme disadvantages: 0; repeated tags: -.
- Advantage cases:
  - alchemyChaos vs fireBurst: 3%; 2秒峰值爆发过强 + 总伤害碾压.
  - bloodRage vs fireBurst: 0%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs alchemyChaos: 97%; 2秒峰值爆发过强 + 总伤害碾压.
  - fireBurst vs bloodRage: 100%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs frostControl: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - fireBurst vs holySustain: 97%; 状态铺垫过快 + 总伤害碾压.
  - fireBurst vs ironWall: 93%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs fireBurst: 0%; 状态铺垫过快 + 2秒峰值爆发过强.

### 霜控拖延 `frostControl`

- Extreme advantages: 2; repeated tags: controlPressure x2, statusSetup x2, damageLead x2.
- Extreme disadvantages: 8; repeated tags: burstWindow x6, sustainGap x4, damageLead x4, statusSetup x4.
- Advantage cases:
  - frostControl vs ironWall: 90%; 控制窗口压制 + 状态铺垫过快.
  - ironWall vs frostControl: 10%; 控制窗口压制 + 状态铺垫过快.
- Disadvantage cases:
  - crownCarry vs frostControl: 100%; 弱势方过早减员 + 2秒峰值爆发过强.
  - fireBurst vs frostControl: 100%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs crownCarry: 0%; 弱势方过早减员 + 2秒峰值爆发过强.
  - frostControl vs fireBurst: 0%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs holySustain: 3%; 治疗/护盾资源差距过大.
  - frostControl vs poisonBloom: 10%; 状态铺垫过快 + 2秒峰值爆发过强.
  - holySustain vs frostControl: 97%; 治疗/护盾资源差距过大.
  - poisonBloom vs frostControl: 90%; 状态铺垫过快 + 2秒峰值爆发过强.

### 圣盾续航 `holySustain`

- Extreme advantages: 2; repeated tags: sustainGap x2.
- Extreme disadvantages: 8; repeated tags: damageLead x8, burstWindow x4, basicPressure x4, statusSetup x4.
- Advantage cases:
  - frostControl vs holySustain: 3%; 治疗/护盾资源差距过大.
  - holySustain vs frostControl: 97%; 治疗/护盾资源差距过大.
- Disadvantage cases:
  - bloodRage vs holySustain: 100%; 总伤害碾压 + 2秒峰值爆发过强.
  - crownCarry vs holySustain: 100%; 总伤害碾压 + 普攻压力过高.
  - fireBurst vs holySustain: 97%; 状态铺垫过快 + 总伤害碾压.
  - holySustain vs bloodRage: 0%; 总伤害碾压 + 2秒峰值爆发过强.
  - holySustain vs crownCarry: 0%; 总伤害碾压 + 普攻压力过高.
  - holySustain vs fireBurst: 3%; 状态铺垫过快 + 总伤害碾压.
  - holySustain vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - poisonBloom vs holySustain: 100%; 状态铺垫过快 + 总伤害碾压.

### 铁壁反击 `ironWall`

- Extreme advantages: 2; repeated tags: sustainGap x2, basicPressure x2, shieldWall x2, counterValue x2.
- Extreme disadvantages: 8; repeated tags: damageLead x8, burstWindow x6, statusSetup x6, sustainGap x2.
- Advantage cases:
  - ironWall vs lightningTempo: 90%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs ironWall: 10%; 治疗/护盾资源差距过大 + 普攻压力过高.
- Disadvantage cases:
  - crownCarry vs ironWall: 100%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - fireBurst vs ironWall: 93%; 状态铺垫过快 + 2秒峰值爆发过强.
  - frostControl vs ironWall: 90%; 控制窗口压制 + 状态铺垫过快.
  - ironWall vs crownCarry: 0%; 总伤害碾压 + 治疗/护盾资源差距过大.
  - ironWall vs fireBurst: 7%; 状态铺垫过快 + 2秒峰值爆发过强.
  - ironWall vs frostControl: 10%; 控制窗口压制 + 状态铺垫过快.
  - ironWall vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - poisonBloom vs ironWall: 100%; 状态铺垫过快 + 总伤害碾压.

### 急速节奏 `lightningTempo`

- Extreme advantages: 0; repeated tags: -.
- Extreme disadvantages: 4; repeated tags: sustainGap x4, basicPressure x4, earlyCollapse x2, damageLead x2.
- Disadvantage cases:
  - crownCarry vs lightningTempo: 100%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - ironWall vs lightningTempo: 90%; 治疗/护盾资源差距过大 + 普攻压力过高.
  - lightningTempo vs crownCarry: 0%; 治疗/护盾资源差距过大 + 弱势方过早减员.
  - lightningTempo vs ironWall: 10%; 治疗/护盾资源差距过大 + 普攻压力过高.

### 毒巢滚雪球 `poisonBloom`

- Extreme advantages: 8; repeated tags: statusSetup x8, dotPressure x8, burstWindow x6, damageLead x6.
- Extreme disadvantages: 0; repeated tags: -.
- Advantage cases:
  - frostControl vs poisonBloom: 10%; 状态铺垫过快 + 2秒峰值爆发过强.
  - holySustain vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - ironWall vs poisonBloom: 0%; 状态铺垫过快 + 总伤害碾压.
  - poisonBloom vs frostControl: 90%; 状态铺垫过快 + 2秒峰值爆发过强.
  - poisonBloom vs holySustain: 100%; 状态铺垫过快 + 总伤害碾压.
  - poisonBloom vs ironWall: 100%; 状态铺垫过快 + 总伤害碾压.
  - poisonBloom vs shadowExecute: 93%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - shadowExecute vs poisonBloom: 7%; 状态铺垫过快 + 治疗/护盾资源差距过大.

### 暗影处决 `shadowExecute`

- Extreme advantages: 0; repeated tags: -.
- Extreme disadvantages: 4; repeated tags: sustainGap x4, damageLead x4, basicPressure x2, lowCounterplay x2.
- Disadvantage cases:
  - crownCarry vs shadowExecute: 90%; 治疗/护盾资源差距过大 + 总伤害碾压.
  - poisonBloom vs shadowExecute: 93%; 状态铺垫过快 + 治疗/护盾资源差距过大.
  - shadowExecute vs crownCarry: 10%; 治疗/护盾资源差距过大 + 总伤害碾压.
  - shadowExecute vs poisonBloom: 7%; 状态铺垫过快 + 治疗/护盾资源差距过大.

## Extreme Matchup Details

### 炼金异常 into 王冠核心

- Rate: 3%; advantaged: 王冠核心; disadvantaged: 炼金异常.
- Headline: 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 4.66 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.4 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 18%。).
- Advantaged metrics: damage 1460.9, basic 100%, DOT 0%, peak 559.1, sustain 372.2+566.2, first death 13.97.
- Disadvantaged metrics: damage 1233.5, basic 26%, DOT 33%, peak 399.2, sustain 0+201.4, first death 11.25.

### 炼金异常 into 余烬爆燃

- Rate: 3%; advantaged: 余烬爆燃; disadvantaged: 炼金异常.
- Headline: 2秒峰值爆发过强 + 总伤害碾压.
- Top reasons: 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.38 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.29 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1207.1, basic 25%, DOT 15%, peak 433.9, sustain 0+148.4, first death 11.45.
- Disadvantaged metrics: damage 934, basic 27%, DOT 28%, peak 314.4, sustain 0+169.6, first death 10.54.

### 低血狂怒 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 28.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.78 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 25%。).
- Advantaged metrics: damage 1527.8, basic 32%, DOT 12%, peak 378.6, sustain 0+155.5, first death 8.19.
- Disadvantaged metrics: damage 856.6, basic 73%, DOT 0%, peak 367, sustain 202.7+146.8, first death 8.45.

### 低血狂怒 into 圣盾续航

- Rate: 100%; advantaged: 低血狂怒; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.5 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.03 倍。); 普攻压力过高 (优势方普攻占自身输出约 81%。).
- Advantaged metrics: damage 1992.1, basic 82%, DOT 0%, peak 398.8, sustain 497.9+297.1, first death 14.48.
- Disadvantaged metrics: damage 796.9, basic 56%, DOT 0%, peak 196.8, sustain 568+843.8, first death 13.74.

### 王冠核心 into 炼金异常

- Rate: 97%; advantaged: 王冠核心; disadvantaged: 炼金异常.
- Headline: 治疗/护盾资源差距过大 + 2秒峰值爆发过强.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 4.66 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.4 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 18%。).
- Advantaged metrics: damage 1460.9, basic 100%, DOT 0%, peak 559.1, sustain 372.2+566.2, first death 13.97.
- Disadvantaged metrics: damage 1233.5, basic 26%, DOT 33%, peak 399.2, sustain 0+201.4, first death 11.25.

### 王冠核心 into 霜控拖延

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 霜控拖延.
- Headline: 弱势方过早减员 + 2秒峰值爆发过强.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.97 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.16 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.83 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.63 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1425.5, basic 100%, DOT 0%, peak 458.5, sustain 341.8+565.7, first death none.
- Disadvantaged metrics: damage 874.4, basic 29%, DOT 28%, peak 212.5, sustain 125.8+369.9, first death 11.97.

### 王冠核心 into 圣盾续航

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 5.33 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 2291.5, basic 100%, DOT 0%, peak 273, sustain 429.2+2395.5, first death none.
- Disadvantaged metrics: damage 429.6, basic 52%, DOT 0%, peak 129.5, sustain 952.3+2387.8, first death 33.35.

### 王冠核心 into 铁壁反击

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 铁壁反击.
- Headline: 总伤害碾压 + 治疗/护盾资源差距过大.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.38 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.85 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.71 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1602, basic 100%, DOT 0%, peak 370.5, sustain 518.5+1144, first death none.
- Disadvantaged metrics: damage 673.9, basic 62%, DOT 0%, peak 217, sustain 181.4+717.5, first death 15.01.

### 王冠核心 into 急速节奏

- Rate: 100%; advantaged: 王冠核心; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 9.02 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.56 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.56 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1407.3, basic 100%, DOT 0%, peak 446.5, sustain 347.3+537.9, first death 12.56.
- Disadvantaged metrics: damage 900.9, basic 48%, DOT 0%, peak 285.7, sustain 0+0, first death 9.02.

### 王冠核心 into 暗影处决

- Rate: 90%; advantaged: 王冠核心; disadvantaged: 暗影处决.
- Headline: 治疗/护盾资源差距过大 + 总伤害碾压.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.35 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.35 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 24%。).
- Advantaged metrics: damage 1440.3, basic 100%, DOT 0%, peak 493.6, sustain 195.7+361.1, first death 8.19.
- Disadvantaged metrics: damage 1063.6, basic 28%, DOT 27%, peak 368.5, sustain 0+236.5, first death 8.88.

### 余烬爆燃 into 炼金异常

- Rate: 97%; advantaged: 余烬爆燃; disadvantaged: 炼金异常.
- Headline: 2秒峰值爆发过强 + 总伤害碾压.
- Top reasons: 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.38 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.29 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 16%。).
- Advantaged metrics: damage 1207.1, basic 25%, DOT 15%, peak 433.9, sustain 0+148.4, first death 11.45.
- Disadvantaged metrics: damage 934, basic 27%, DOT 28%, peak 314.4, sustain 0+169.6, first death 10.54.

### 余烬爆燃 into 低血狂怒

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 低血狂怒.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 28.4。); 总伤害碾压 (优势方总伤害约为弱势方 1.78 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 25%。).
- Advantaged metrics: damage 1527.8, basic 32%, DOT 12%, peak 378.7, sustain 0+155.5, first death 8.19.
- Disadvantaged metrics: damage 856.6, basic 73%, DOT 0%, peak 367, sustain 202.7+146.8, first death 8.45.

### 余烬爆燃 into 霜控拖延

- Rate: 100%; advantaged: 余烬爆燃; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 26.9。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.7 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.49 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 35%。).
- Advantaged metrics: damage 1343.2, basic 21%, DOT 11%, peak 544, sustain 0+153, first death 14.34.
- Disadvantaged metrics: damage 902.3, basic 33%, DOT 22%, peak 320.6, sustain 112.2+313, first death 12.56.

### 余烬爆燃 into 圣盾续航

- Rate: 97%; advantaged: 余烬爆燃; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 42。); 总伤害碾压 (优势方总伤害约为弱势方 3.1 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.14 倍。).
- Advantaged metrics: damage 1873.6, basic 23%, DOT 18%, peak 492, sustain 0+329.1, first death 16.
- Disadvantaged metrics: damage 604.5, basic 55%, DOT 0%, peak 156.5, sustain 524.7+845.9, first death 17.18.

### 余烬爆燃 into 铁壁反击

- Rate: 93%; advantaged: 余烬爆燃; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 38.4。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.55 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.83 倍。).
- Advantaged metrics: damage 1505.8, basic 23%, DOT 18%, peak 563, sustain 0+211.8, first death 12.22.
- Disadvantaged metrics: damage 822.5, basic 56%, DOT 0%, peak 221.1, sustain 187.7+642.1, first death 13.58.

### 霜控拖延 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 霜控拖延.
- Headline: 弱势方过早减员 + 2秒峰值爆发过强.
- Top reasons: 弱势方过早减员 (弱势方平均首死约在 11.97 秒。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.16 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.83 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.63 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1425.5, basic 100%, DOT 0%, peak 458.5, sustain 341.8+565.7, first death none.
- Disadvantaged metrics: damage 874.4, basic 29%, DOT 28%, peak 212.5, sustain 125.8+369.9, first death 11.97.

### 霜控拖延 into 余烬爆燃

- Rate: 0%; advantaged: 余烬爆燃; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 26.9。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.7 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.49 倍。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 35%。).
- Advantaged metrics: damage 1343.2, basic 21%, DOT 11%, peak 544, sustain 0+153, first death 14.34.
- Disadvantaged metrics: damage 902.3, basic 33%, DOT 22%, peak 320.6, sustain 112.2+313, first death 12.56.

### 霜控拖延 into 圣盾续航

- Rate: 3%; advantaged: 圣盾续航; disadvantaged: 霜控拖延.
- Headline: 治疗/护盾资源差距过大.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.87 倍。).
- Advantaged metrics: damage 1542.1, basic 50%, DOT 0%, peak 242, sustain 1759.5+3876.1, first death none.
- Disadvantaged metrics: damage 1787.1, basic 38%, DOT 20%, peak 248.5, sustain 662.8+2356.2, first death 54.13.

### 霜控拖延 into 铁壁反击

- Rate: 90%; advantaged: 霜控拖延; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 56.2。); 总伤害碾压 (优势方总伤害约为弱势方 2.27 倍。).
- Advantaged metrics: damage 1842, basic 41%, DOT 18%, peak 218.5, sustain 477.2+1710.4, first death 20.52.
- Disadvantaged metrics: damage 809.9, basic 73%, DOT 0%, peak 179.7, sustain 647+1560.4, first death 20.03.

### 霜控拖延 into 毒巢滚雪球

- Rate: 10%; advantaged: 毒巢滚雪球; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 62.6。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.91 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 34%。).
- Advantaged metrics: damage 1294.4, basic 26%, DOT 34%, peak 430.6, sustain 221.1+507.7, first death 9.38.
- Disadvantaged metrics: damage 1092.2, basic 42%, DOT 20%, peak 225.7, sustain 170.8+445.8, first death 13.42.

### 圣盾续航 into 低血狂怒

- Rate: 0%; advantaged: 低血狂怒; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 2秒峰值爆发过强.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.5 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.03 倍。); 普攻压力过高 (优势方普攻占自身输出约 81%。).
- Advantaged metrics: damage 1992.1, basic 82%, DOT 0%, peak 398.8, sustain 497.9+297.1, first death 14.48.
- Disadvantaged metrics: damage 796.9, basic 56%, DOT 0%, peak 196.8, sustain 568+843.8, first death 13.74.

### 圣盾续航 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 圣盾续航.
- Headline: 总伤害碾压 + 普攻压力过高.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 5.33 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 2291.5, basic 100%, DOT 0%, peak 273, sustain 429.2+2395.5, first death none.
- Disadvantaged metrics: damage 429.6, basic 52%, DOT 0%, peak 129.5, sustain 952.3+2387.8, first death 33.35.

### 圣盾续航 into 余烬爆燃

- Rate: 3%; advantaged: 余烬爆燃; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 42。); 总伤害碾压 (优势方总伤害约为弱势方 3.1 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 3.14 倍。).
- Advantaged metrics: damage 1873.6, basic 23%, DOT 18%, peak 492, sustain 0+329.1, first death 16.
- Disadvantaged metrics: damage 604.5, basic 55%, DOT 0%, peak 156.5, sustain 524.7+845.9, first death 17.18.

### 圣盾续航 into 霜控拖延

- Rate: 97%; advantaged: 圣盾续航; disadvantaged: 霜控拖延.
- Headline: 治疗/护盾资源差距过大.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.87 倍。).
- Advantaged metrics: damage 1542.1, basic 50%, DOT 0%, peak 242, sustain 1759.5+3876.1, first death none.
- Disadvantaged metrics: damage 1787.1, basic 38%, DOT 20%, peak 248.5, sustain 662.8+2356.2, first death 54.13.

### 圣盾续航 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 143.1。); 总伤害碾压 (优势方总伤害约为弱势方 4.13 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 40%。).
- Advantaged metrics: damage 2372.3, basic 27%, DOT 40%, peak 397.7, sustain 290.9+2191.1, first death 15.95.
- Disadvantaged metrics: damage 573.9, basic 68%, DOT 0%, peak 161.8, sustain 1471.5+3006.5, first death 19.63.

### 铁壁反击 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 铁壁反击.
- Headline: 总伤害碾压 + 治疗/护盾资源差距过大.
- Top reasons: 总伤害碾压 (优势方总伤害约为弱势方 2.38 倍。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 1.85 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.71 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1602, basic 100%, DOT 0%, peak 370.5, sustain 518.5+1144, first death none.
- Disadvantaged metrics: damage 673.9, basic 62%, DOT 0%, peak 217, sustain 181.4+717.4, first death 15.01.

### 铁壁反击 into 余烬爆燃

- Rate: 7%; advantaged: 余烬爆燃; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 38.4。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 2.55 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.83 倍。).
- Advantaged metrics: damage 1505.8, basic 23%, DOT 18%, peak 563, sustain 0+211.8, first death 12.22.
- Disadvantaged metrics: damage 822.5, basic 56%, DOT 0%, peak 221.1, sustain 187.6+642.1, first death 13.58.

### 铁壁反击 into 霜控拖延

- Rate: 10%; advantaged: 霜控拖延; disadvantaged: 铁壁反击.
- Headline: 控制窗口压制 + 状态铺垫过快.
- Top reasons: 控制窗口压制 (优势方控制应用约为弱势方 99 倍。); 状态铺垫过快 (优势方平均铺设状态层数约 56.2。); 总伤害碾压 (优势方总伤害约为弱势方 2.27 倍。).
- Advantaged metrics: damage 1842, basic 41%, DOT 18%, peak 218.5, sustain 477.2+1710.4, first death 20.52.
- Disadvantaged metrics: damage 809.9, basic 73%, DOT 0%, peak 179.7, sustain 647+1560.4, first death 20.03.

### 铁壁反击 into 急速节奏

- Rate: 90%; advantaged: 铁壁反击; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 普攻压力过高.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 普攻压力过高 (优势方普攻占自身输出约 78%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 13%。); 反击收益过高 (优势方反击伤害占比约 9%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1240.2, basic 78%, DOT 0%, peak 312.6, sustain 395.5+1063, first death 7.13.
- Disadvantaged metrics: damage 1144.5, basic 46%, DOT 0%, peak 323.8, sustain 0+0, first death 7.82.

### 铁壁反击 into 毒巢滚雪球

- Rate: 0%; advantaged: 毒巢滚雪球; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 91。); 总伤害碾压 (优势方总伤害约为弱势方 2.29 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.64 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 41%。).
- Advantaged metrics: damage 1790.1, basic 27%, DOT 42%, peak 352.4, sustain 371.4+1173.3, first death 10.19.
- Disadvantaged metrics: damage 782, basic 64%, DOT 0%, peak 214.2, sustain 429.7+1022.3, first death 14.65.

### 急速节奏 into 王冠核心

- Rate: 0%; advantaged: 王冠核心; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 弱势方过早减员.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 弱势方过早减员 (弱势方平均首死约在 9.02 秒。); 总伤害碾压 (优势方总伤害约为弱势方 1.56 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.56 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。).
- Advantaged metrics: damage 1407.3, basic 100%, DOT 0%, peak 446.5, sustain 347.3+537.9, first death 12.56.
- Disadvantaged metrics: damage 901, basic 48%, DOT 0%, peak 285.7, sustain 0+0, first death 9.02.

### 急速节奏 into 铁壁反击

- Rate: 10%; advantaged: 铁壁反击; disadvantaged: 急速节奏.
- Headline: 治疗/护盾资源差距过大 + 普攻压力过高.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 99 倍。); 普攻压力过高 (优势方普攻占自身输出约 78%。); 护盾吸收过强 (优势方承伤中护盾吸收占比约 13%。); 反击收益过高 (优势方反击伤害占比约 9%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 0%。).
- Advantaged metrics: damage 1240.2, basic 78%, DOT 0%, peak 312.6, sustain 395.5+1063, first death 7.13.
- Disadvantaged metrics: damage 1144.5, basic 46%, DOT 0%, peak 323.8, sustain 0+0, first death 7.82.

### 毒巢滚雪球 into 霜控拖延

- Rate: 90%; advantaged: 毒巢滚雪球; disadvantaged: 霜控拖延.
- Headline: 状态铺垫过快 + 2秒峰值爆发过强.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 62.6。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.91 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 34%。).
- Advantaged metrics: damage 1294.4, basic 26%, DOT 34%, peak 430.6, sustain 221.1+507.7, first death 9.38.
- Disadvantaged metrics: damage 1092.2, basic 42%, DOT 20%, peak 225.7, sustain 170.7+445.8, first death 13.42.

### 毒巢滚雪球 into 圣盾续航

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 圣盾续航.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 143.1。); 总伤害碾压 (优势方总伤害约为弱势方 4.13 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 40%。).
- Advantaged metrics: damage 2372.3, basic 27%, DOT 40%, peak 397.7, sustain 290.9+2191.1, first death 15.95.
- Disadvantaged metrics: damage 573.9, basic 68%, DOT 0%, peak 161.8, sustain 1471.5+3006.5, first death 19.63.

### 毒巢滚雪球 into 铁壁反击

- Rate: 100%; advantaged: 毒巢滚雪球; disadvantaged: 铁壁反击.
- Headline: 状态铺垫过快 + 总伤害碾压.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 91。); 总伤害碾压 (优势方总伤害约为弱势方 2.29 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.64 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 41%。).
- Advantaged metrics: damage 1790.1, basic 27%, DOT 42%, peak 352.4, sustain 371.4+1173.3, first death 10.19.
- Disadvantaged metrics: damage 782, basic 64%, DOT 0%, peak 214.2, sustain 429.7+1022.3, first death 14.65.

### 毒巢滚雪球 into 暗影处决

- Rate: 93%; advantaged: 毒巢滚雪球; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 57.6。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.18 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.51 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.27 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 1356.8, basic 28%, DOT 30%, peak 507.1, sustain 146.5+411.9, first death 7.34.
- Disadvantaged metrics: damage 1066.9, basic 30%, DOT 22%, peak 336.1, sustain 0+256, first death 8.34.

### 暗影处决 into 王冠核心

- Rate: 10%; advantaged: 王冠核心; disadvantaged: 暗影处决.
- Headline: 治疗/护盾资源差距过大 + 总伤害碾压.
- Top reasons: 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.35 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.35 倍。); 普攻压力过高 (优势方普攻占自身输出约 100%。); 弱势方反制资源不足 (弱势方反制资源/优势方伤害约 24%。).
- Advantaged metrics: damage 1440.3, basic 100%, DOT 0%, peak 493.6, sustain 195.7+361.1, first death 8.19.
- Disadvantaged metrics: damage 1063.6, basic 28%, DOT 27%, peak 368.5, sustain 0+236.5, first death 8.88.

### 暗影处决 into 毒巢滚雪球

- Rate: 7%; advantaged: 毒巢滚雪球; disadvantaged: 暗影处决.
- Headline: 状态铺垫过快 + 治疗/护盾资源差距过大.
- Top reasons: 状态铺垫过快 (优势方平均铺设状态层数约 57.6。); 治疗/护盾资源差距过大 (优势方治疗+护盾约为弱势方 2.18 倍。); 2秒峰值爆发过强 (优势方 2 秒峰值约为弱势方 1.51 倍。); 总伤害碾压 (优势方总伤害约为弱势方 1.27 倍。); DOT/异常压力过高 (优势方 DOT 占自身输出约 30%。).
- Advantaged metrics: damage 1356.8, basic 28%, DOT 30%, peak 507.1, sustain 146.5+411.9, first death 7.34.
- Disadvantaged metrics: damage 1066.9, basic 30%, DOT 22%, peak 336.1, sustain 0+256, first death 8.34.

