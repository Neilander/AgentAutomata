# 装备水表验证 v1

生成时间：2026-06-30T17:45:25.222Z

约束：本验证只在克隆队伍 spec 上应用装备代理 bonus，没有修改角色属性、技能、战斗引擎或水表队伍。

验证版本：v5 固定底座回补。

## 总览

- 平均基础胜率：43%
- 平均装备胜率：45%
- 平均胜率变化：2%
- 平均 HP 分变化：0.216
- 平均伤害变化：-171.44
- 装备导致的胜转负：8
- 大幅跳升流派：无

## 按流派

| 流派 | 预设 | 基础胜率 | 装备胜率 | 变化 | HP变化 | 伤害变化 | 判定 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 低血狂战 | 低血狂怒 `bloodRage` | 56% | 38% | -19% | -0.625 | -113.057 | review: equipment caused regression |
| 火法燃烧 | 余烬爆燃 `fireBurst` | 81% | 100% | 19% | 0.573 | -113.788 | ok: visible improvement |
| 剧毒绽放 | 毒巢滚雪球 `poisonBloom` | 81% | 94% | 13% | 0.343 | -80.74 | ok: visible improvement |
| 暗影刺客 | 暗影处决 `shadowExecute` | 19% | 0% | -19% | -0.268 | -933.624 | review: equipment caused regression |
| 铁壁骑士 | 铁壁反击 `ironWall` | 13% | 38% | 25% | 1.309 | 428.045 | ok: visible improvement |
| 圣光续航 | 圣盾续航 `holySustain` | 6% | 0% | -6% | -0.035 | -215.478 | review: equipment caused regression |

## 观察

### 低血狂战

- 翻盘对手：frostTrapField
- 回退对手：alchemyChaos, bulwarkMarks, duelChampion, ironWall
- 装备 bonus：HP +0, 物攻 +32, 法强 +0, 护甲 +3, 攻速 x1.32, 技能急速 x1.08, 效果 x1.107, 受治愈 x1.06

### 火法燃烧

- 翻盘对手：crownCarry, lightningTempo, poisonBloom
- 回退对手：无
- 装备 bonus：HP +178, 物攻 +8, 法强 +42.203, 护甲 +11.031, 攻速 x1.27, 技能急速 x1.28, 效果 x1.272, 受治愈 x1.08

### 剧毒绽放

- 翻盘对手：fireBurst, lightningTempo
- 回退对手：无
- 装备 bonus：HP +145, 物攻 +10, 法强 +43.13, 护甲 +24.486, 攻速 x1.188, 技能急速 x1.381, 效果 x1.18, 受治愈 x1.102

### 暗影刺客

- 翻盘对手：无
- 回退对手：duelChampion, ironWall, martyrFrontline
- 装备 bonus：HP +45, 物攻 +42, 法强 +0, 护甲 +4, 攻速 x1.18, 技能急速 x1.129, 效果 x1.08, 受治愈 x1

### 铁壁骑士

- 翻盘对手：cavalryBreak, frostTrapField, martyrFrontline, shadowExecute
- 回退对手：无
- 装备 bonus：HP +248, 物攻 +22, 法强 +8, 护甲 +53.1, 攻速 x1.063, 技能急速 x1.283, 效果 x1.08, 受治愈 x1.188

### 圣光续航

- 翻盘对手：无
- 回退对手：lightningTempo
- 装备 bonus：HP +195, 物攻 +0, 法强 +22, 护甲 +12, 攻速 x1.084, 技能急速 x1.08, 效果 x1.07, 受治愈 x1.12

## 局限

- 当前是代理映射，不是最终装备战斗公式。
- 没有改 combat-sim，所以部分词条只能映射成现有字段，不能完整表现独特机制。
- 下一轮应根据本验证控制装备映射强度，并保存一个可继续接入正式装备系统的候选版本。
