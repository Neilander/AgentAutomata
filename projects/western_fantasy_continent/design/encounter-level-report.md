# Encounter Level Simulation Report

Generated with 5 deterministic-order seeds per combination. A passing solution is win rate >= 60%; stable means 100%.

## Summary

| Level | Pick | Enemy | Winning combos | Stable | Win share | Target |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| 关卡1 裂骨门卫 `ogre_gate` | 2 | 裂骨独眼 | 12/28 | 12 | 43% | ok |
| 关卡2 余烬倒计时 `ember_clock` | 3 | 余烬石像 | 27/56 | 27 | 48% | ok |
| 关卡3 瘟疫钟摆 `plague_clock` | 3 | 瘟疫图腾 | 21/56 | 21 | 38% | ok |
| 关卡4 石肤试炼 `stone_skin` | 4 | 石肤魔像 | 41/210 | 31 | 20% | ok |
| 关卡5 镜霜双考 `mirror_frost` | 6 | 镜刃处刑者, 霜缚塔 | 34/210 | 19 | 16% | ok |

## 关卡1 裂骨门卫 `ogre_gate`

- Fantasy: 一个高压近战木桩，考验前排和治疗是否够硬。
- Pick 2 from: 铁壁守卫, 银誓医师, 破阵战士, 月弦猎手, 余烬学徒, 赤狮狂战, 战鼓诗人, 毒刃影手.
- Enemy: 裂骨独眼.
- Result: 12/28 winning combos; target ok (min 3, max win share 65%).

Top solutions:
- 银誓医师 + 赤狮狂战: 5/5, leftHp 1.38, rightHp 0, alive 2-0, tags basic, heal, lifesteal, lowHp, shield.
- 铁壁守卫 + 赤狮狂战: 5/5, leftHp 1.24, rightHp 0, alive 2-0, tags basic, frontline, lifesteal, lowHp, shield.
- 赤狮狂战 + 战鼓诗人: 5/5, leftHp 1.11, rightHp 0, alive 2-0, tags basic, buff, haste, lifesteal, lowHp.
- 破阵战士 + 赤狮狂战: 5/5, leftHp 1.03, rightHp 0, alive 2-0, tags basic, cleave, frontline, lifesteal, lowHp.
- 铁壁守卫 + 破阵战士: 5/5, leftHp 0.97, rightHp 0, alive 2-0, tags frontlinex2, cleave, physical, shield, taunt.
- 月弦猎手 + 赤狮狂战: 5/5, leftHp 0.94, rightHp 0, alive 2-0, tags basic, focus, lifesteal, lowHp, mark.

Near misses:
- None.

Hard fail examples:
- 铁壁守卫 + 银誓医师: 0/5, leftHp 1.9, rightHp 0.01, alive 2-1, tags shieldx2, frontline, heal, stabilize, taunt.
- 铁壁守卫 + 战鼓诗人: 0/5, leftHp 0, rightHp 0.13, alive 0-1, tags buff, frontline, haste, shield, taunt.
- 银誓医师 + 破阵战士: 0/5, leftHp 0, rightHp 0.38, alive 0-1, tags cleave, frontline, heal, physical, shield.
- 银誓医师 + 月弦猎手: 0/5, leftHp 0, rightHp 0.16, alive 0-1, tags focus, heal, mark, ranged, shield.

## 关卡2 余烬倒计时 `ember_clock`

- Fantasy: 群体火焰持续压血，要求快速击杀或群体续航。
- Pick 3 from: 铁壁守卫, 银誓医师, 余烬学徒, 月弦猎手, 毒刃影手, 灰契术士, 战鼓诗人, 破阵战士.
- Enemy: 余烬石像.
- Result: 27/56 winning combos; target ok (min 5, max win share 70%).

Top solutions:
- 铁壁守卫 + 银誓医师 + 破阵战士: 5/5, leftHp 1.72, rightHp 0, alive 3-0, tags frontlinex2, shieldx2, cleave, heal, physical.
- 铁壁守卫 + 银誓医师 + 战鼓诗人: 5/5, leftHp 1.72, rightHp 0, alive 3-0, tags shieldx2, buff, frontline, haste, heal.
- 铁壁守卫 + 银誓医师 + 月弦猎手: 5/5, leftHp 1.71, rightHp 0, alive 3-0, tags shieldx2, focus, frontline, heal, mark.
- 铁壁守卫 + 银誓医师 + 灰契术士: 5/5, leftHp 1.67, rightHp 0, alive 3-0, tags shieldx2, frontline, heal, payoff, poison.
- 铁壁守卫 + 银誓医师 + 余烬学徒: 5/5, leftHp 1.67, rightHp 0, alive 3-0, tags shieldx2, area, burn, burst, frontline.
- 铁壁守卫 + 银誓医师 + 毒刃影手: 5/5, leftHp 1.62, rightHp 0, alive 3-0, tags shieldx2, execute, frontline, heal, melee.

Near misses:
- None.

Hard fail examples:
- 铁壁守卫 + 余烬学徒 + 战鼓诗人: 0/5, leftHp 0, rightHp 0.07, alive 0-1, tags area, buff, burn, burst, frontline.
- 银誓医师 + 余烬学徒 + 月弦猎手: 0/5, leftHp 0, rightHp 0.07, alive 0-1, tags area, burn, burst, focus, heal.
- 银誓医师 + 余烬学徒 + 毒刃影手: 0/5, leftHp 0, rightHp 0, alive 0-0, tags area, burn, burst, execute, heal.
- 银誓医师 + 余烬学徒 + 灰契术士: 0/5, leftHp 0, rightHp 0.09, alive 0-1, tags area, burn, burst, heal, payoff.

## 关卡3 瘟疫钟摆 `plague_clock`

- Fantasy: 毒会越拖越危险，爆发和稳定抬血都能解，但慢队会被拖垮。
- Pick 3 from: 银誓医师, 余烬学徒, 月弦猎手, 毒刃影手, 灰契术士, 战鼓诗人, 赤狮狂战, 沼雾炼金师.
- Enemy: 瘟疫图腾.
- Result: 21/56 winning combos; target ok (min 4, max win share 65%).

Top solutions:
- 银誓医师 + 战鼓诗人 + 赤狮狂战: 5/5, leftHp 1.21, rightHp 0, alive 3-0, tags basic, buff, haste, heal, lifesteal.
- 月弦猎手 + 战鼓诗人 + 赤狮狂战: 5/5, leftHp 1.06, rightHp 0, alive 3-0, tags basic, buff, focus, haste, lifesteal.
- 银誓医师 + 灰契术士 + 赤狮狂战: 5/5, leftHp 0.91, rightHp 0, alive 3-0, tags basic, heal, lifesteal, lowHp, payoff.
- 月弦猎手 + 毒刃影手 + 赤狮狂战: 5/5, leftHp 0.85, rightHp 0, alive 3-0, tags basic, execute, focus, lifesteal, lowHp.
- 银誓医师 + 余烬学徒 + 赤狮狂战: 5/5, leftHp 0.83, rightHp 0, alive 3-0, tags area, basic, burn, burst, heal.
- 银誓医师 + 月弦猎手 + 赤狮狂战: 5/5, leftHp 0.83, rightHp 0, alive 3-0, tags basic, focus, heal, lifesteal, lowHp.

Near misses:
- None.

Hard fail examples:
- 银誓医师 + 余烬学徒 + 月弦猎手: 0/5, leftHp 0, rightHp 0.4, alive 0-1, tags area, burn, burst, focus, heal.
- 银誓医师 + 余烬学徒 + 毒刃影手: 0/5, leftHp 0, rightHp 0.34, alive 0-1, tags area, burn, burst, execute, heal.
- 银誓医师 + 余烬学徒 + 灰契术士: 0/5, leftHp 0, rightHp 0.36, alive 0-1, tags area, burn, burst, heal, payoff.
- 银誓医师 + 余烬学徒 + 战鼓诗人: 0/5, leftHp 0, rightHp 0.51, alive 0-1, tags area, buff, burn, burst, haste.

## 关卡4 石肤试炼 `stone_skin`

- Fantasy: 高甲高盾敌人，纯物理会卡住，异常和破防窗口更有效。
- Pick 4 from: 铁壁守卫, 银誓医师, 余烬学徒, 月弦猎手, 毒刃影手, 灰契术士, 战鼓诗人, 破阵战士, 赤狮狂战, 沼雾炼金师.
- Enemy: 石肤魔像.
- Result: 41/210 winning combos; target ok (min 8, max win share 62%).

Top solutions:
- 铁壁守卫 + 银誓医师 + 毒刃影手 + 赤狮狂战: 5/5, leftHp 4, rightHp 0, alive 4-0, tags shieldx2, basic, execute, frontline, heal.
- 铁壁守卫 + 银誓医师 + 灰契术士 + 赤狮狂战: 5/5, leftHp 4, rightHp 0, alive 4-0, tags shieldx2, basic, frontline, heal, lifesteal.
- 铁壁守卫 + 银誓医师 + 月弦猎手 + 毒刃影手: 5/5, leftHp 4, rightHp 0, alive 4-0, tags shieldx2, execute, focus, frontline, heal.
- 铁壁守卫 + 银誓医师 + 毒刃影手 + 破阵战士: 5/5, leftHp 4, rightHp 0, alive 4-0, tags frontlinex2, shieldx2, cleave, execute, heal.
- 铁壁守卫 + 银誓医师 + 月弦猎手 + 灰契术士: 5/5, leftHp 4, rightHp 0, alive 4-0, tags shieldx2, focus, frontline, heal, mark.
- 铁壁守卫 + 银誓医师 + 余烬学徒 + 毒刃影手: 5/5, leftHp 3.95, rightHp 0, alive 4-0, tags shieldx2, area, burn, burst, execute.

Near misses:
- 铁壁守卫 + 月弦猎手 + 毒刃影手 + 破阵战士: 2/5, leftHp 0.8, rightHp 0.11, alive 0.8-0.6, tags frontlinex2, cleave, execute, focus, mark.
- 铁壁守卫 + 余烬学徒 + 月弦猎手 + 灰契术士: 2/5, leftHp 0.6, rightHp 0.09, alive 0.8-0.6, tags area, burn, burst, focus, frontline.
- 月弦猎手 + 破阵战士 + 赤狮狂战 + 沼雾炼金师: 2/5, leftHp 0.43, rightHp 0.01, alive 0.6-0.6, tags basic, burn, cleave, focus, frontline.
- 铁壁守卫 + 余烬学徒 + 灰契术士 + 破阵战士: 1/5, leftHp 0.38, rightHp 0.15, alive 0.4-0.8, tags frontlinex2, area, burn, burst, cleave.

Hard fail examples:
- 铁壁守卫 + 银誓医师 + 月弦猎手 + 战鼓诗人: 0/5, leftHp 4, rightHp 0.72, alive 4-1, tags shieldx2, buff, focus, frontline, haste.
- 铁壁守卫 + 银誓医师 + 月弦猎手 + 破阵战士: 0/5, leftHp 4, rightHp 0.54, alive 4-1, tags frontlinex2, shieldx2, cleave, focus, heal.
- 铁壁守卫 + 银誓医师 + 月弦猎手 + 沼雾炼金师: 0/5, leftHp 4, rightHp 0.7, alive 4-1, tags shieldx2, burn, focus, frontline, heal.
- 铁壁守卫 + 银誓医师 + 余烬学徒 + 月弦猎手: 0/5, leftHp 3.98, rightHp 0.45, alive 4-1, tags shieldx2, area, burn, burst, focus.

## 关卡5 镜霜双考 `mirror_frost`

- Fantasy: 处决者压最低血，霜塔压节奏，需要保护、抬血和足够输出同时在线。
- Pick 6 from: 铁壁守卫, 银誓医师, 余烬学徒, 月弦猎手, 毒刃影手, 灰契术士, 战鼓诗人, 破阵战士, 赤狮狂战, 沼雾炼金师.
- Enemy: 镜刃处刑者, 霜缚塔.
- Result: 34/210 winning combos; target ok (min 10, max win share 70%).

Top solutions:
- 银誓医师 + 月弦猎手 + 灰契术士 + 战鼓诗人 + 破阵战士 + 赤狮狂战: 5/5, leftHp 1.6, rightHp 0, alive 4-0, tags basic, buff, cleave, focus, frontline.
- 银誓医师 + 余烬学徒 + 月弦猎手 + 毒刃影手 + 战鼓诗人 + 赤狮狂战: 5/5, leftHp 1.48, rightHp 0, alive 4-0, tags area, basic, buff, burn, burst.
- 银誓医师 + 月弦猎手 + 毒刃影手 + 战鼓诗人 + 破阵战士 + 赤狮狂战: 5/5, leftHp 1.41, rightHp 0, alive 3.2-0, tags basic, buff, cleave, execute, focus.
- 银誓医师 + 月弦猎手 + 毒刃影手 + 灰契术士 + 破阵战士 + 赤狮狂战: 5/5, leftHp 1.38, rightHp 0, alive 3.2-0, tags poisonx2, basic, cleave, execute, focus.
- 银誓医师 + 余烬学徒 + 月弦猎手 + 灰契术士 + 战鼓诗人 + 赤狮狂战: 5/5, leftHp 1.27, rightHp 0, alive 3-0, tags area, basic, buff, burn, burst.
- 银誓医师 + 余烬学徒 + 月弦猎手 + 毒刃影手 + 灰契术士 + 赤狮狂战: 5/5, leftHp 1.13, rightHp 0, alive 4-0, tags poisonx2, area, basic, burn, burst.

Near misses:
- 铁壁守卫 + 银誓医师 + 灰契术士 + 战鼓诗人 + 破阵战士 + 赤狮狂战: 2/5, leftHp 0.85, rightHp 0.04, alive 1.6-0.6, tags frontlinex2, shieldx2, basic, buff, cleave.
- 银誓医师 + 毒刃影手 + 灰契术士 + 战鼓诗人 + 破阵战士 + 赤狮狂战: 2/5, leftHp 0.59, rightHp 0.24, alive 1.2-0.6, tags poisonx2, basic, buff, cleave, execute.
- 银誓医师 + 余烬学徒 + 毒刃影手 + 破阵战士 + 赤狮狂战 + 沼雾炼金师: 2/5, leftHp 0.36, rightHp 0.46, alive 1.4-1.2, tags burnx2, poisonx2, area, basic, burst.
- 铁壁守卫 + 余烬学徒 + 战鼓诗人 + 破阵战士 + 赤狮狂战 + 沼雾炼金师: 2/5, leftHp 0.35, rightHp 0.07, alive 0.8-0.6, tags burnx2, frontlinex2, area, basic, buff.

Hard fail examples:
- 铁壁守卫 + 银誓医师 + 余烬学徒 + 月弦猎手 + 毒刃影手 + 灰契术士: 0/5, leftHp 0, rightHp 0.86, alive 0-2, tags poisonx2, shieldx2, area, burn, burst.
- 铁壁守卫 + 银誓医师 + 余烬学徒 + 月弦猎手 + 毒刃影手 + 战鼓诗人: 0/5, leftHp 0, rightHp 1, alive 0-2, tags shieldx2, area, buff, burn, burst.
- 铁壁守卫 + 银誓医师 + 余烬学徒 + 月弦猎手 + 毒刃影手 + 破阵战士: 0/5, leftHp 0, rightHp 0.89, alive 0-2, tags frontlinex2, shieldx2, area, burn, burst.
- 铁壁守卫 + 银誓医师 + 余烬学徒 + 月弦猎手 + 毒刃影手 + 赤狮狂战: 0/5, leftHp 0, rightHp 0.82, alive 0-2, tags shieldx2, area, basic, burn, burst.
