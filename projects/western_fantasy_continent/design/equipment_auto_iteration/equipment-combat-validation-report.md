# 装备水表验证 v1

生成时间：2026-07-01T02:56:02.049Z

约束：本验证只在克隆队伍 spec 上应用装备代理 bonus，没有修改角色属性、技能、战斗引擎或水表队伍。

验证版本：v4 极端风险收束。

## 总览

- 平均基础胜率：43%
- 平均装备胜率：69%
- 平均胜率变化：26%
- 平均 HP 分变化：0.668
- 平均伤害变化：125.543
- 装备导致的胜转负：0
- 大幅跳升流派：shadowAssassin, ironKnight

## 按流派

| 流派 | 预设 | 基础胜率 | 装备胜率 | 变化 | HP变化 | 伤害变化 | 判定 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 低血狂战 | 低血狂怒 `bloodRage` | 56% | 81% | 25% | 0.542 | 235.166 | ok: visible improvement |
| 火法燃烧 | 余烬爆燃 `fireBurst` | 81% | 100% | 19% | 1.035 | -128.15 | ok: visible improvement |
| 剧毒绽放 | 毒巢滚雪球 `poisonBloom` | 81% | 100% | 19% | 0.494 | -226.738 | ok: visible improvement |
| 暗影刺客 | 暗影处决 `shadowExecute` | 19% | 56% | 38% | 0.292 | 129.297 | risk: large win-rate jump |
| 铁壁骑士 | 铁壁反击 `ironWall` | 13% | 44% | 31% | 1.034 | 387.851 | risk: large win-rate jump |
| 圣光续航 | 圣盾续航 `holySustain` | 6% | 31% | 25% | 0.612 | 355.83 | ok: visible improvement |

## 观察

### 低血狂战

- 翻盘对手：crownCarry, frostControl, frostTrapField, lightningTempo
- 回退对手：无
- 装备 bonus：HP +0, 物攻 +24, 法强 +0, 护甲 +2, 攻速 x1.18, 技能急速 x1.039, 效果 x1.022, 受治愈 x1.02

### 火法燃烧

- 翻盘对手：crownCarry, lightningTempo, poisonBloom
- 回退对手：无
- 装备 bonus：HP +144, 物攻 +8, 法强 +38.75, 护甲 +20, 攻速 x1.019, 技能急速 x1.28, 效果 x1.123, 受治愈 x1.08

### 剧毒绽放

- 翻盘对手：crownCarry, fireBurst, lightningTempo
- 回退对手：无
- 装备 bonus：HP +145, 物攻 +10, 法强 +23.896, 护甲 +23.02, 攻速 x1.176, 技能急速 x1.12, 效果 x1.18, 受治愈 x1.16

### 暗影刺客

- 翻盘对手：bloodRage, bulwarkMarks, cavalryBreak, holySustain, purgeAttrition, scarletVanguard
- 回退对手：无
- 装备 bonus：HP +10, 物攻 +16, 法强 +0, 护甲 +1, 攻速 x1.05, 技能急速 x1.015, 效果 x1.015, 受治愈 x1

### 铁壁骑士

- 翻盘对手：cavalryBreak, fireBurst, frostTrapField, martyrFrontline, shadowExecute
- 回退对手：无
- 装备 bonus：HP +50, 物攻 +6, 法强 +6.966, 护甲 +12, 攻速 x1.02, 技能急速 x1.012, 效果 x1.02, 受治愈 x1.05

### 圣光续航

- 翻盘对手：cavalryBreak, frostControl, ironWall, shadowExecute
- 回退对手：无
- 装备 bonus：HP +25, 物攻 +0, 法强 +10, 护甲 +4, 攻速 x1.02, 技能急速 x1.035, 效果 x1.03, 受治愈 x1.04

## 局限

- 当前是代理映射，不是最终装备战斗公式。
- 没有改 combat-sim，所以部分词条只能映射成现有字段，不能完整表现独特机制。
- 下一轮应根据本验证控制装备映射强度，并保存一个可继续接入正式装备系统的候选版本。
