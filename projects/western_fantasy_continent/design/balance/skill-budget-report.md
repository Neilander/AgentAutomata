# Skill Budget Model Report

This report is a static first pass. It checks skill scale against class-specific budgets before benchmark-team or breaker testing.

## Summary

- Skills checked: 82
- Active skills checked: 67
- Warning count: 3

## Current Warnings

- `crownBloodCharm` (牧师, 小技能): defenseUptime 1.41 exceeds 牧师 high cap 1; defenseUptime 1.41 exceeds global extreme 1.35.
- `frostNova` (法师, 小技能): controlUptime 0.7 exceeds 法师 medium cap 0.55.
- `tauntLine` (骑士, 小技能): function density 3: shield, timer/control, defense-window.

## Class Baselines

### 炼金师

Allowed highs: statusAmplify, mixedDot, payoff

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `miasmaFlask` | 小技能 | 10 | 11 | 0 | 0 | 0 | 0 | 0 | damage |
| `chainReaction` | 大招 | 30 | 8.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `grandMixture` | 大招 | 35 | 7.1 | 0 | 0 | 0 | 0 | 0 |  |
| `volatileBottle` | 小技能 | 8 | 6.9 | 0 | 0 | 0 | 0 | 0 |  |
| `sparkCatalyst` | 小技能 | 8.2 | 6.2 | 0 | 0 | 0 | 0 | 0 |  |
| `reagentMark` | 小技能 | 8 | 3.2 | 0 | 0 | 0 | 0 | 1.3 |  |

### 刺客

Allowed highs: singleTargetDps, execute, mobility

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `toxicStabs` | 小技能 | 4 | 13.4 | 0 | 0 | 0 | 0 | 0 | damage |
| `garrote` | 小技能 | 6.2 | 11.4 | 0 | 0 | 0 | 0 | 0 | damage |
| `deathNeedle` | 小技能 | 7 | 9.7 | 0 | 0 | 0 | 0 | 0 | damage |
| `shadowCut` | 小技能 | 6.6 | 8.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `shadowHarvest` | 大招 | 27.5 | 4.6 | 0 | 0 | 0 | 0 | 0 |  |

### 吟游诗人

Allowed highs: buffValuePerSecond, haste, teamTempo

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `courageChord` | 小技能 | 7 | 0 | 0 | 0 | 0 | 0 | 18.9 | buff |
| `syncopate` | 小技能 | 8.5 | 0 | 0 | 0 | 0 | 0 | 10.1 | buff |
| `rhythmGuard` | 小技能 | 9 | 0 | 4 | 0 | 0 | 0 | 4 |  |
| `tempoSong` | 小技能 | 9 | 0 | 0 | 0 | 0 | 0 | 6.7 | buff |
| `crescendo` | 大招 | 30 | 0 | 0 | 0 | 0 | 0 | 2.7 |  |

### 狂战士

Allowed highs: selfDps, selfHaste, selfLeech, lowHpScaling

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `bloodStrike` | 小技能 | 5.2 | 0 | 0 | 0 | 0 | 0 | 10.2 | buff |
| `lastWound` | 小技能 | 8.2 | 4 | 0 | 0 | 0 | 0 | 5.9 | buff |
| `redFeast` | 小技能 | 7.8 | 3.4 | 0 | 0 | 0 | 0 | 6.2 | buff |
| `boneWhirl` | 小技能 | 8.4 | 0 | 0 | 0 | 0 | 0 | 7.1 | buff |
| `undyingRoar` | 大招 | 24 | 0 | 0 | 0 | 0 | 0 | 3.3 | death-prevent |

### 骑士

Allowed highs: sps, damageReduction, taunt, counter

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `retaliationBanner` | 大招 | 34 | 0 | 7.5 | 0 | 0 | 0.09 | 1.8 | shield |
| `bannerWall` | 大招 | 34 | 0 | 8.3 | 0 | 0 | 0.09 | 0 | shield |
| `guard` | 小技能 | 8 | 0 | 7.4 | 0 | 0 | 0 | 0 | shield |
| `tauntLine` | 小技能 | 10 | 0 | 6.7 | 0 | 0.5 | 0.5 | 0 | shield, timer/control, defense-window |
| `vowTaunt` | 小技能 | 11 | 0 | 4.8 | 0 | 0.36 | 0.36 | 0 | timer/control, defense-window |
| `shieldBash` | 小技能 | 7.5 | 3.9 | 0 | 0 | 0.4 | 0 | 0 | timer/control |

### 法师

Allowed highs: burstDps, aoe, burn

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `fireball` | 小技能 | 6 | 13.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `combustSigil` | 小技能 | 8.5 | 13 | 0 | 0 | 0 | 0 | 0 | damage |
| `frostNova` | 小技能 | 10 | 10.3 | 0 | 0 | 0.7 | 0 | 0 | damage, timer/control |
| `iceLance` | 小技能 | 7.2 | 7.1 | 0 | 0 | 0.35 | 0 | 0 | timer/control |
| `emberSpread` | 小技能 | 9 | 6.5 | 0 | 0 | 0 | 0 | 0 |  |
| `meteorRain` | 大招 | 37 | 5 | 0 | 0 | 0 | 0 | 0 |  |

### 牧师

Allowed highs: hps, sps, cleanse, protection, deathPreventionSupport

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `renewingSanctuary` | 大招 | 30 | 0 | 7 | 7.9 | 0 | 0 | 0 | shield, heal |
| `sanctuary` | 大招 | 32 | 0 | 5.8 | 6 | 0 | 0 | 0 | heal |
| `crownBloodCharm` | 小技能 | 8.5 | 0 | 11.7 | 0 | 0 | 1.41 | 0 | shield, defense-window |
| `heal` | 小技能 | 7 | 0 | 0 | 9.5 | 0 | 0 | 0 | heal |
| `graceTransfer` | 小技能 | 9.5 | 0 | 4.7 | 3.5 | 0 | 0 | 0 |  |
| `mendingLight` | 小技能 | 8 | 0 | 3 | 4.9 | 0 | 0 | 0 |  |
| `bloodCharm` | 小技能 | 10 | 0 | 7.7 | 0 | 0 | 0.5 | 0 | shield, defense-window |

### 游侠

Allowed highs: singleTargetDps, mark, tempo

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `markShot` | 小技能 | 5 | 11.7 | 0 | 0 | 0 | 0 | 2 | damage |
| `markRelay` | 小技能 | 6.8 | 5.1 | 0 | 0 | 0 | 0 | 2.9 |  |
| `arrowStorm` | 大招 | 30 | 7.1 | 0 | 0 | 0 | 0 | 0 |  |
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
| `curseLeak` | 小技能 | 8.5 | 4.4 | 0 | 0 | 0 | 0 | 0 |  |
| `painDividend` | 小技能 | 11 | 0 | 0 | 0 | 0 | 0 | 3.6 |  |

### 战士

Allowed highs: frontlineDps, cleave, armorPressure

| Skill | Type | CD | DPS | SPS | HPS | Control | Defense | Buff | Axes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| `powerStrike` | 小技能 | 5 | 12.2 | 0 | 0 | 0 | 0.3 | 0 | damage, defense-window |
| `cleave` | 小技能 | 7 | 12 | 0 | 0 | 0 | 0 | 0 | damage |
| `guardBreak` | 小技能 | 6.8 | 10.3 | 0 | 0 | 0 | 0 | 0 | damage |
| `sunderingAdvance` | 小技能 | 7.5 | 9.9 | 0 | 0 | 0 | 0 | 0 | damage |
| `warBanner` | 大招 | 28 | 5.5 | 0 | 0 | 0 | 0 | 2.1 |  |

## Interpretation

- High HPS on priest skills is expected; it should not be judged against assassin or mage budgets.
- High SPS/control on knight skills is expected, while direct healing would be suspicious.
- Function density warnings mean a skill occupies several jobs at once; this requires benchmark testing rather than automatic nerfs.
- Breaker/red-team runs should be reserved for batches of new skills or balance passes.
