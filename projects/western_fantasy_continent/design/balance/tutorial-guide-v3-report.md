# Tutorial Guide V3 Audit

This report enumerates every selectable role and formation combination for tutorial_guide_v3.

| Level | Type | Goal | Pass | Target | Teach | Accidental | Natural Pass | Status |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1. 第一课：前后排 | lesson | frontline plus backline | 1/6 (17%) | 15%-35% | 1 | 0 | 1 | ok |
| 2. 第二课：治疗窗口 | combo | heal a low-health carry through danger | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 3. 第三课：标记集火 | lesson | single-target focus with mark | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 4. 第四课：硬壳敌人 | lesson | frontline plus sustained damage against armor | 3/12 (25%) | 15%-35% | 2 | 1 | 2 | ok |
| 5. 第五课：范围压力 | lesson | area damage behind a real front | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 6. 第六课：残血收割 | lesson | execute needs setup damage | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 7. 第七课：持续消耗 | lesson | sustain plus damage over time | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 8. 第八课：保护收割 | lesson | frontline protection for execute | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 9. 第九课：稳定点杀 | lesson | stable mark damage against hard targets | 1/12 (8%) | 5%-20% | 1 | 0 | 1 | ok |
| 10. 第十课：综合挑战 | practice | final mixed-pressure check | 494/840 (59%) | 40%-70% | 69 | 425 | 69 | ok |

## 1. 第一课：前后排

- Goal: frontline plus backline
- Status: ok
- Density: 1/6 (17%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:warrior 2:mage; uses intended roles naturally; hp 0.085/0; t=12.56
- Failing samples:
  - 0:mage 2:warrior
  - 0:warrior 2:priest
  - 0:priest 2:warrior
  - 0:mage 2:priest
  - 0:priest 2:mage

## 2. 第二课：治疗窗口

- Goal: heal a low-health carry through danger
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:berserker 2:priest; uses intended roles naturally; hp 1.241/0; t=13.04
- Failing samples:
  - 0:priest 2:berserker
  - 0:berserker 2:bard
  - 0:bard 2:berserker
  - 0:berserker 2:ranger
  - 0:ranger 2:berserker
  - 0:priest 2:bard

## 3. 第三课：标记集火

- Goal: single-target focus with mark
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:warrior 2:ranger; uses intended roles naturally; hp 0.221/0; t=36.48
- Failing samples:
  - 0:ranger 2:warrior
  - 0:warrior 2:mage
  - 0:mage 2:warrior
  - 0:warrior 2:bard
  - 0:bard 2:warrior
  - 0:ranger 2:mage

## 4. 第四课：硬壳敌人

- Goal: frontline plus sustained damage against armor
- Status: ok
- Density: 3/12 (25%)
- Teaching audit: teaches/acceptable 2, accidental 1, natural pass 2

- Passing samples:
  - teaches: 0:knight 2:warlock; uses intended roles naturally; hp 0.776/0; t=32.48
  - teaches: 0:knight 2:ranger; uses intended roles naturally; hp 1.579/0; t=49.92
  - accidental: 0:ranger 2:warlock; unnatural formation, misses required lesson role; hp 0/0; t=20.08
- Failing samples:
  - 0:warlock 2:knight
  - 0:ranger 2:knight
  - 0:knight 2:bard
  - 0:bard 2:knight
  - 0:warlock 2:ranger
  - 0:warlock 2:bard

## 5. 第五课：范围压力

- Goal: area damage behind a real front
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:knight 2:mage; uses intended roles naturally; hp 0.058/0; t=13.28
- Failing samples:
  - 0:mage 2:knight
  - 0:knight 2:priest
  - 0:priest 2:knight
  - 0:knight 2:bard
  - 0:bard 2:knight
  - 0:mage 2:priest

## 6. 第六课：残血收割

- Goal: execute needs setup damage
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:warrior 2:assassin; uses intended roles naturally; hp 0.018/0; t=33.92
- Failing samples:
  - 0:assassin 2:warrior
  - 0:warrior 2:ranger
  - 0:ranger 2:warrior
  - 0:warrior 2:priest
  - 0:priest 2:warrior
  - 0:assassin 2:ranger

## 7. 第七课：持续消耗

- Goal: sustain plus damage over time
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:priest 2:warlock; uses intended roles naturally; hp 1/0.718; t=70.08
- Failing samples:
  - 0:warlock 2:priest
  - 0:warlock 2:mage
  - 0:mage 2:warlock
  - 0:warlock 2:assassin
  - 0:assassin 2:warlock
  - 0:priest 2:mage

## 8. 第八课：保护收割

- Goal: frontline protection for execute
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:knight 2:assassin; uses intended roles naturally; hp 0.929/0; t=68.88
- Failing samples:
  - 0:assassin 2:knight
  - 0:knight 2:ranger
  - 0:ranger 2:knight
  - 0:knight 2:mage
  - 0:mage 2:knight
  - 0:assassin 2:ranger

## 9. 第九课：稳定点杀

- Goal: stable mark damage against hard targets
- Status: ok
- Density: 1/12 (8%)
- Teaching audit: teaches/acceptable 1, accidental 0, natural pass 1

- Passing samples:
  - teaches: 0:knight 2:ranger; uses intended roles naturally; hp 2/1.823; t=70.08
- Failing samples:
  - 0:ranger 2:knight
  - 0:knight 2:warlock
  - 0:warlock 2:knight
  - 0:knight 2:bard
  - 0:bard 2:knight
  - 0:ranger 2:warlock

## 10. 第十课：综合挑战

- Goal: final mixed-pressure check
- Status: ok
- Density: 494/840 (59%)
- Teaching audit: teaches/acceptable 69, accidental 425, natural pass 69

- Passing samples:
  - teaches: 0:knight 1:warrior 2:ranger 3:priest; uses intended roles naturally; hp 0.954/0; t=32.72
  - accidental: 0:knight 1:priest 2:ranger 3:warrior; unnatural formation; hp 0.471/0; t=27.92
  - accidental: 0:knight 1:ranger 2:priest 3:warrior; unnatural formation; hp 2.388/0; t=46.72
  - teaches: 0:warrior 1:knight 2:priest 3:ranger; uses intended roles naturally; hp 1.646/0; t=26.24
  - teaches: 0:warrior 1:knight 2:ranger 3:priest; uses intended roles naturally; hp 1.06/0; t=26.4
  - accidental: 0:warrior 1:priest 2:knight 3:ranger; unnatural formation; hp 1.242/0; t=30.56
  - accidental: 0:warrior 1:priest 2:ranger 3:knight; unnatural formation; hp 2.294/0; t=21.44
  - accidental: 0:warrior 1:ranger 2:priest 3:knight; unnatural formation; hp 1.554/0; t=26.4
  - accidental: 0:priest 1:knight 2:warrior 3:ranger; unnatural formation; hp 0.212/0; t=26.24
  - accidental: 0:priest 1:warrior 2:knight 3:ranger; unnatural formation; hp 0.769/0; t=45.36
  - accidental: 0:priest 1:ranger 2:warrior 3:knight; unnatural formation; hp 1.536/0; t=20.08
  - accidental: 0:ranger 1:warrior 2:knight 3:priest; unnatural formation; hp 0.672/0; t=42.32
- Failing samples:
  - 0:knight 1:warrior 2:priest 3:ranger
  - 0:knight 1:priest 2:warrior 3:ranger
  - 0:knight 1:ranger 2:warrior 3:priest
  - 0:warrior 1:ranger 2:knight 3:priest
  - 0:priest 1:knight 2:ranger 3:warrior
  - 0:priest 1:warrior 2:ranger 3:knight
