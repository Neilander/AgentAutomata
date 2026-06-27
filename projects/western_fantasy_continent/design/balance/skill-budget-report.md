# Skill Budget Model Report

This report is a static first pass. It checks skill scale against class-specific budgets before benchmark-team or breaker testing.

## Summary

- Skills checked: 127
- Active skills checked: 100
- Warning count: 7

## Current Warnings

- `bloodAegis` (狂战士, 小技能): sps 8 exceeds 狂战士 low cap 6.
- `crownBloodCharm` (牧师, 小技能): defenseUptime 1.41 exceeds 牧师 high cap 1; defenseUptime 1.41 exceeds global extreme 1.35.
- `frostNova` (法师, 小技能): controlUptime 0.7 exceeds 法师 medium cap 0.55.
- `radiantInterpose` (牧师, 小技能): controlUptime 0.26 exceeds 牧师 low cap 0.25; function density 3: shield, timer/control, defense-window.
- `resonantFinale` (吟游诗人, 大招): sps 3.9 exceeds 吟游诗人 low cap 3; hps 4.5 exceeds 吟游诗人 low cap 3.
- `scarletChallenge` (狂战士, 小技能): controlUptime 0.35 exceeds 狂战士 low cap 0.25.
- `tauntLine` (骑士, 小技能): function density 3: shield, timer/control, defense-window.

## Class Baselines

### 炼金师

Allowed highs: statusAmplify, mixedDot, payoff

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `miasmaFlask` | 小技能 | 10 | 11 | 0 | 0 | 0 | 0 | 0 | damage |
| `perfectReaction` | 大招 | 34 | 8.8 | 0 | 0 | 0 | 0 | 0 | damage |
| `chainReaction` | 大招 | 30 | 8.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `grandMixture` | 大招 | 35 | 7.1 | 0 | 0 | 0 | 0 | 0 |  |
| `volatileBottle` | 小技能 | 8 | 6.9 | 0 | 0 | 0 | 0 | 0 |  |
| `sparkCatalyst` | 小技能 | 8.2 | 6.2 | 0 | 0 | 0 | 0 | 0 |  |
| `corrosiveFoam` | 小技能 | 8.7 | 5.9 | 0 | 0 | 0.34 | 0 | 0 | timer/control |
| `reagentMark` | 小技能 | 8 | 3.2 | 0 | 0 | 0 | 0 | 1.3 |  |
| `stabilizingVapor` | 小技能 | 9.5 | 2.7 | 0 | 0 | 0.25 | 0 | 0 | timer/control |

### 刺客

Allowed highs: singleTargetDps, execute, mobility

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `toxicStabs` | 小技能 | 4 | 13.2 | 0 | 0 | 0 | 0 | 0 | damage |
| `garrote` | 小技能 | 6.2 | 11.2 | 0 | 0 | 0 | 0 | 0 | damage |
| `venomStep` | 小技能 | 7.2 | 10 | 0 | 0 | 0 | 0 | 0 | damage |
| `deathNeedle` | 小技能 | 7 | 9.6 | 0 | 0 | 0 | 0 | 0 | damage |
| `shadowCut` | 小技能 | 6.6 | 6.7 | 0 | 0 | 0 | 0 | 0 |  |
| `midnightBloom` | 大招 | 31 | 6.5 | 0 | 0 | 0 | 0 | 0 |  |
| `shadowHarvest` | 大招 | 27.5 | 3.8 | 0 | 0 | 0 | 0 | 0 |  |

### 吟游诗人

Allowed highs: buffValuePerSecond, haste, teamTempo

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `courageChord` | 小技能 | 7 | 0 | 0 | 0 | 0 | 0 | 11 | buff |
| `resonantFinale` | 大招 | 33 | 0 | 3.9 | 4.5 | 0 | 0 | 1.8 |  |
| `syncopate` | 小技能 | 8.5 | 0 | 0 | 0 | 0 | 0 | 10.1 | buff |
| `rhythmGuard` | 小技能 | 9 | 0 | 4 | 0 | 0 | 0 | 4 |  |
| `battleHymn` | 小技能 | 10 | 0 | 3.9 | 0 | 0 | 0 | 3.8 |  |
| `tempoSong` | 小技能 | 9 | 0 | 0 | 0 | 0 | 0 | 5.3 | buff |
| `lullabyGuard` | 小技能 | 9.6 | 0 | 3.3 | 0 | 0.25 | 0 | 0 | timer/control |
| `crescendo` | 大招 | 30 | 0 | 0 | 0 | 0 | 0 | 2.7 |  |

### 狂战士

Allowed highs: selfDps, selfHaste, selfLeech, lowHpScaling

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `bloodAegis` | 小技能 | 9.4 | 0 | 8 | 0 | 0 | 0.3 | 4.1 | shield, defense-window |
| `bloodStrike` | 小技能 | 5.2 | 0 | 0 | 0 | 0 | 0 | 10.2 | buff |
| `lastWound` | 小技能 | 8.2 | 3.9 | 0 | 0 | 0 | 0 | 5.9 | buff |
| `redFeast` | 小技能 | 7.8 | 3.3 | 0 | 0 | 0 | 0 | 6.2 | buff |
| `crimsonCyclone` | 大招 | 33 | 4.8 | 0 | 0 | 0 | 0 | 2.4 | death-prevent |
| `boneWhirl` | 小技能 | 8.4 | 0 | 0 | 0 | 0 | 0 | 7.1 | buff |
| `undyingRoar` | 大招 | 24 | 0 | 0 | 0 | 0 | 0 | 3.3 | death-prevent |
| `scarletChallenge` | 小技能 | 9.2 | 0 | 0 | 0 | 0.35 | 0.28 | 0 | timer/control |

### 骑士

Allowed highs: sps, damageReduction, taunt, counter

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `bulwarkRiposte` | 小技能 | 10.5 | 0 | 5.5 | 0 | 0 | 0.33 | 5.7 | defense-window, buff |
| `retaliationBanner` | 大招 | 34 | 0 | 7.5 | 0 | 0 | 0.09 | 1.8 | shield |
| `oathBulwark` | 大招 | 34 | 0 | 6.8 | 0 | 0 | 0 | 1.8 | shield |
| `bannerWall` | 大招 | 34 | 0 | 8.3 | 0 | 0 | 0.09 | 0 | shield |
| `guard` | 小技能 | 8 | 0 | 7.4 | 0 | 0 | 0 | 0 | shield |
| `tauntLine` | 小技能 | 10 | 0 | 6.7 | 0 | 0.5 | 0.5 | 0 | shield, timer/control, defense-window |
| `lanceCharge` | 小技能 | 9.4 | 6.3 | 0 | 0 | 0.53 | 0 | 0 | timer/control |
| `vowTaunt` | 小技能 | 11 | 0 | 4.8 | 0 | 0.36 | 0.36 | 0 | timer/control, defense-window |
| `interceptVow` | 小技能 | 10.2 | 0 | 4.3 | 0 | 0.24 | 0.24 | 0 |  |
| `shieldBash` | 小技能 | 7.5 | 3.9 | 0 | 0 | 0.4 | 0 | 0 | timer/control |
| `royalCavalryBreak` | 大招 | 33 | 3.7 | 0 | 0 | 0.14 | 0.1 | 0 |  |

### 法师

Allowed highs: burstDps, aoe, burn

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `fireball` | 小技能 | 6 | 13.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `combustSigil` | 小技能 | 8.5 | 13 | 0 | 0 | 0 | 0 | 0 | damage |
| `frostNova` | 小技能 | 10 | 10.3 | 0 | 0 | 0.7 | 0 | 0 | damage, timer/control |
| `iceLance` | 小技能 | 7.2 | 7.1 | 0 | 0 | 0.35 | 0 | 0 | timer/control |
| `emberSpread` | 小技能 | 9 | 6.5 | 0 | 0 | 0 | 0 | 0 |  |
| `glacierShard` | 小技能 | 7.8 | 6.5 | 0 | 0 | 0.51 | 0 | 0 | timer/control |
| `ashZone` | 小技能 | 10 | 5.5 | 0 | 0 | 0.28 | 0 | 0 | timer/control |
| `meteorRain` | 大招 | 37 | 5 | 0 | 0 | 0 | 0 | 0 |  |
| `whiteout` | 大招 | 35 | 1.2 | 0 | 0 | 0.17 | 0 | 0 |  |

### 牧师

Allowed highs: hps, sps, cleanse, protection, deathPreventionSupport

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `renewingSanctuary` | 大招 | 30 | 0 | 7 | 7.9 | 0 | 0 | 0 | shield, heal |
| `sanctuary` | 大招 | 32 | 0 | 5.8 | 6 | 0 | 0 | 0 | heal |
| `crownBloodCharm` | 小技能 | 8.5 | 0 | 11.7 | 0 | 0 | 1.41 | 0 | shield, defense-window |
| `bastionSanctuary` | 大招 | 34 | 0 | 6.4 | 3.2 | 0 | 0.1 | 0 | shield |
| `heal` | 小技能 | 7 | 0 | 0 | 9.5 | 0 | 0 | 0 | heal |
| `graceTransfer` | 小技能 | 9.5 | 0 | 4.7 | 3.5 | 0 | 0 | 0 |  |
| `mendingLight` | 小技能 | 8 | 0 | 3 | 4.9 | 0 | 0 | 0 |  |
| `bloodCharm` | 小技能 | 10 | 0 | 6.7 | 0 | 0 | 0.5 | 0 | shield, defense-window |
| `radiantInterpose` | 小技能 | 10.6 | 0 | 6.3 | 0 | 0.26 | 0.3 | 0 | shield, timer/control, defense-window |
| `purifyingWard` | 小技能 | 10.5 | 0 | 5.4 | 0 | 0 | 0.57 | 0 | defense-window |

### 游侠

Allowed highs: singleTargetDps, mark, tempo

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `markShot` | 小技能 | 5 | 11.7 | 0 | 0 | 0 | 0 | 2 | damage |
| `markRelay` | 小技能 | 6.8 | 5.1 | 0 | 0 | 0 | 0 | 2.9 |  |
| `snareShot` | 小技能 | 7.6 | 4.8 | 0 | 0 | 0.45 | 0 | 2.6 | timer/control |
| `arrowStorm` | 大招 | 30 | 7.1 | 0 | 0 | 0 | 0 | 0 |  |
| `killZone` | 大招 | 32 | 6.7 | 0 | 0 | 0.16 | 0 | 0 |  |
| `markDetonate` | 小技能 | 8.4 | 6.3 | 0 | 0 | 0 | 0 | 0 |  |
| `pinningArrow` | 小技能 | 8 | 5.7 | 0 | 0 | 0.5 | 0 | 0 | timer/control |
| `flareMark` | 小技能 | 6.5 | 4 | 0 | 0 | 0 | 0 | 1.5 |  |

### unknown

Allowed highs: n/a

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `enemyVenomCloud` | 小技能 | 5.4 | 65.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `enemyStoneGuard` | 小技能 | 6.5 | 0 | 30 | 0 | 0 | 0 | 0 | shield |
| `enemyCullWeak` | 小技能 | 5.7 | 24.1 | 0 | 0 | 0 | 0 | 0 | damage |
| `enemySweepingClaw` | 小技能 | 8.2 | 17.2 | 0 | 0 | 0 | 0 | 0 | damage |
| `enemyHeavySmash` | 小技能 | 5.8 | 15.5 | 0 | 0 | 0 | 0 | 0 | damage |
| `enemyEmberPulse` | 小技能 | 5.8 | 9.9 | 0 | 0 | 0 | 0 | 0 | damage |
| `oathRally` | 大招 | 32 | 0 | 4.5 | 0 | 0 | 0 | 2.3 |  |
| `ruinComet` | 大招 | 34 | 3.7 | 0 | 0 | 0 | 0 | 0 |  |
| `enemyFrostClamp` | 小技能 | 7.5 | 0 | 0 | 0 | 0.69 | 0 | 0 | timer/control |
| `enemyNoUltimate` | 大招 | 999 | 0 | 0 | 0 | 0 | 0 | 0 |  |
| `enemyNoop` | 小技能 | 999 | 0 | 0 | 0 | 0 | 0 | 0 |  |

### 术士

Allowed highs: dotDps, statusPayoff, selfCost, drain

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `venomBrand` | 小技能 | 6 | 13 | 0 | 0 | 0 | 0 | 0 | damage |
| `bloodContract` | 小技能 | 8 | 0 | 0 | 0 | 0 | 0 | 12 | buff |
| `bloomDetonation` | 大招 | 26 | 10.8 | 0 | 0 | 0 | 0 | 0 | damage |
| `plagueOffering` | 大招 | 30 | 9.4 | 0 | 0 | 0 | 0 | 0 | damage |
| `bloodHex` | 小技能 | 8.8 | 5.7 | 0 | 0 | 0 | 0 | 3.2 |  |
| `venomDividend` | 小技能 | 9.2 | 2.7 | 0 | 0 | 0 | 0 | 5.9 | buff |
| `forbiddenOffering` | 大招 | 35 | 8 | 0 | 0 | 0 | 0 | 0 | damage |
| `curseLeak` | 小技能 | 8.5 | 4.4 | 0 | 0 | 0 | 0 | 0 |  |
| `painDividend` | 小技能 | 11 | 0 | 0 | 0 | 0 | 0 | 3.6 |  |

### 战士

Allowed highs: frontlineDps, cleave, armorPressure

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `powerStrike` | 小技能 | 5 | 11.9 | 0 | 0 | 0 | 0.3 | 0 | damage, defense-window |
| `duelChallenge` | 小技能 | 7.2 | 5.8 | 0 | 0 | 0 | 0.25 | 4.3 |  |
| `guardBreak` | 小技能 | 6.8 | 10.1 | 0 | 0 | 0 | 0 | 0 | damage |
| `sunderingAdvance` | 小技能 | 7.5 | 9.6 | 0 | 0 | 0 | 0 | 0 | damage |
| `cleave` | 小技能 | 7 | 9.5 | 0 | 0 | 0 | 0 | 0 | damage |
| `lineHold` | 小技能 | 8.2 | 4 | 4.6 | 0 | 0 | 0 | 0 |  |
| `veteranCut` | 小技能 | 7.4 | 6 | 0 | 0 | 0 | 0.3 | 0 | defense-window |
| `singleCombatVerdict` | 大招 | 31 | 3.6 | 0 | 0 | 0 | 0 | 1.2 |  |
| `warBanner` | 大招 | 28 | 3.3 | 0 | 0 | 0 | 0 | 1.5 |  |
| `duelistBreak` | 大招 | 30 | 3.2 | 0 | 0 | 0.11 | 0 | 0 |  |

## Interpretation

- High HPS on priest skills is expected; it should not be judged against assassin or mage budgets.
- High SPS/control on knight skills is expected, while direct healing would be suspicious.
- Function density warnings mean a skill occupies several jobs at once; this requires benchmark testing rather than automatic nerfs.
- Breaker/red-team runs should be reserved for batches of new skills or balance passes.
