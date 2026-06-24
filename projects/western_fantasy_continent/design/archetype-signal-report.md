# Archetype Signal And Curve Acceptance Report

Generated from preset-owned design contracts with 4 deterministic seeds per side and validation opponent.

A pass requires the intended process curve, numeric conversion, and failure boundaries. Win rate is evaluated separately.

## Summary

| Preset | Primary output | Result | Passing checks | Validation opponents |
| --- | --- | --- | ---: | --- |
| `alchemyChaos` 炼金异常 | statusPayoff | pass | 6/6 | ironWall, shadowExecute |
| `bloodRage` 低血狂怒 | basicAttack | pass | 9/9 | ironWall, frostControl |
| `crownCarry` 王冠核心 | basicAttack | pass | 7/7 | poisonBloom, shadowExecute |
| `fireBurst` 余烬爆燃 | burst | pass | 7/7 | alchemyChaos, ironWall |
| `frostControl` 霜控拖延 | control | pass | 5/5 | bloodRage, fireBurst |
| `holySustain` 圣盾续航 | sustain | pass | 6/6 | fireBurst, poisonBloom |
| `ironWall` 铁壁反击 | counterattack | pass | 8/8 | shadowExecute, poisonBloom |
| `lightningTempo` 急速节奏 | focusBasic | pass | 5/5 | ironWall, frostControl |
| `poisonBloom` 毒巢滚雪球 | dot | pass | 8/8 | ironWall, fireBurst |
| `shadowExecute` 暗影处决 | execute | pass | 5/5 | crownCarry, ironWall |

## Details

### `alchemyChaos` 炼金异常

- Fantasy: Mix poison and burn, then cash accumulated statuses into area damage.
- Experience: Poison and burn begin accumulating together. -> Both statuses overlap on several targets. -> Alchemy skills convert the overlap into area damage. -> Statuses rebuild after the payoff.
- Samples: 16
- PASS [curve] `dualStatusOverlapRatio`: 1 >= 0.250
- PASS [curve] `payoffCycles`: 10.313 >= 1
- PASS [metric] `statusStacksApplied`: 48.813 >= 20
- PASS [metric] `statusPayoffDamageShare`: 0.291 >= 0.120
- PASS [failure boundary] `poisonStacksApplied`: 29.500 >= 4
- PASS [failure boundary] `burnStacksApplied`: 19.313 >= 4

### `bloodRage` 低血狂怒

- Fantasy: Fall into danger, refuse death, then recover through empowered basic attacks.
- Experience: The berserker loses health from a safe band. -> The berserker enters the low-health danger band. -> Attack cadence, empowered basics, and lifesteal rise. -> Health repeatedly dips and recovers instead of immediately dying.
- Samples: 16
- PASS [curve] `highHealthDecline`: 0.603 >= 0.300
- PASS [curve] `lowHealthSurvivalSeconds`: 9.760 >= 3
- PASS [curve] `lowHealthOscillations`: 7 >= 1
- PASS [curve] `postLowAttackRateRatio`: 2.750 >= 1.200
- PASS [curve] `recoveryAfterLow`: 0.213 >= 0.080
- PASS [metric] `basicDamageShare`: 0.959 >= 0.450
- PASS [metric] `empoweredBasicDamageShare`: 0.851 >= 0.300
- PASS [metric] `healingPerSecond`: 19.104 >= 1
- PASS [failure boundary] `lowHealthEntryRate`: 1 >= 0.500

### `crownCarry` 王冠核心

- Fantasy: Three allies funnel protection and tempo into one visible carry.
- Experience: Supports begin feeding one designated carry. -> Buff and haste windows concentrate on that carry. -> The carry becomes the visible majority damage source. -> Team output falls outside the carry window.
- Samples: 16
- PASS [curve] `carryBuffShare`: 0.629 >= 0.450
- PASS [metric] `basicDamageShare`: 1 >= 0.280
- PASS [metric] `hasteWindowBasicDamageShare`: 0.764 >= 0.100
- PASS [metric] `shieldPerSecond`: 18.352 >= 3
- PASS [failure boundary] `carrySurvives10Seconds`: 1 >= 0.750
- PASS [failure boundary] `carryDamageShare`: 0.750 >= 0.450
- PASS [failure boundary] `carryDamageShare`: 0.750 <= 0.750

### `fireBurst` 余烬爆燃

- Fantasy: Ignite the team, spread fire, then end the fight with a meteor burst.
- Experience: Burn is applied across several enemies. -> Fire spreads and prepares the meteor window. -> A short, visible damage peak lands. -> Damage falls after the burst while cooldowns recover.
- Samples: 16
- PASS [curve] `peak2sDamageShare`: 0.451 >= 0.200
- PASS [curve] `postPeakDamageRateRatio`: 0.313 <= 0.750
- PASS [curve] `burnCoverageBeforeUltimate`: 1 >= 0.500
- PASS [metric] `burnStacksApplied`: 30 >= 12
- PASS [metric] `ultimateDamageShare`: 0.162 >= 0.120
- PASS [metric] `areaDamageShare`: 0.465 >= 0.200
- PASS [failure boundary] `payoffStartsAfterSetup`: 1 >= 1

### `frostControl` 霜控拖延

- Fantasy: Slow the enemy front line so ranged damage gains extra time to work.
- Experience: Enemy melee units approach normally. -> Slow windows suppress their movement and attacks. -> The backline gains extra uncontested output time. -> Pressure rises again when control expires.
- Samples: 16
- PASS [curve] `controlWindowMeleeRateRatio`: 0.000 <= 0.800
- PASS [metric] `slowApplications`: 6 >= 4
- PASS [metric] `enemyMeleeBasicPerSecond`: 0.550 <= 1.800
- PASS [metric] `statusPayoffDamageShare`: 0.175 >= 0.050
- PASS [failure boundary] `slowApplications`: 6 >= 1

### `holySustain` 圣盾续航

- Fantasy: Absorb repeated pressure until healing and shields stabilize the whole team.
- Experience: The team takes visible early pressure. -> A health crisis activates repeated healing and shields. -> Average team health stabilizes or recovers. -> The team survives into a longer attrition phase.
- Samples: 16
- PASS [curve] `teamRecoveryAfterCrisis`: 0.180 >= 0.100
- PASS [metric] `healingPerSecond`: 23.623 >= 5
- PASS [metric] `shieldPerSecond`: 40.890 >= 4
- PASS [metric] `effectiveHealingRatio`: 0.874 >= 0.600
- PASS [metric] `survivorsAt20Seconds`: 2.063 >= 2
- PASS [failure boundary] `teamRecoveryAfterCrisis`: 0.180 <= 0.550

### `ironWall` 铁壁反击

- Fantasy: Invite melee pressure into shields, then turn blocked damage into counterattacks.
- Experience: The frontline absorbs pressure behind shields. -> Blocked melee hits trigger retaliation. -> The banner slows team health loss and opens a team counter window. -> The team returns to ordinary defense after the retaliation window.
- Samples: 16
- PASS [curve] `blockedCounterLinkRate`: 1 >= 0.950
- PASS [curve] `postUltimateHpLossRatio`: 0.117 <= 0.800
- PASS [metric] `counterTriggers`: 6.063 >= 1
- PASS [metric] `counterDamageShare`: 0.115 >= 0.060
- PASS [metric] `counterDamageShare`: 0.115 <= 0.180
- PASS [metric] `shieldPerSecond`: 28.145 >= 3
- PASS [metric] `ultimateCastsBefore15`: 1 >= 1
- PASS [failure boundary] `ultimateBeforeFirstDeath`: 1 >= 0.750

### `lightningTempo` 急速节奏

- Fantasy: Build marks quickly and convert team haste into repeated focused shots.
- Experience: Rangers establish a marked target. -> Marks and haste concentrate repeated attacks. -> The focused target falls faster during the tempo window. -> Attack pressure falls between haste windows.
- Samples: 16
- PASS [curve] `topTwoBuffShare`: 0.697 >= 0.550
- PASS [metric] `markApplications`: 6 >= 6
- PASS [metric] `hasteWindowBasicDamageShare`: 0.325 >= 0.120
- PASS [metric] `basicDamageShare`: 0.457 >= 0.200
- PASS [failure boundary] `lowestTargetDamageShare`: 0.422 >= 0.350

### `poisonBloom` 毒巢滚雪球

- Fantasy: Survive the opening, accumulate poison, then spread and detonate it.
- Experience: Poison begins slowly while the team survives. -> Stacks accelerate and spread between enemies. -> A poison payoff converts accumulated stacks into damage. -> Stacks fall and begin accumulating again.
- Samples: 16
- PASS [curve] `poisonApplicationAcceleration`: 2.800 >= 1.150
- PASS [curve] `poisonSpreadEvents`: 6 >= 0.500
- PASS [curve] `payoffCycles`: 1 >= 1
- PASS [metric] `poisonStacksApplied`: 64.688 >= 12
- PASS [metric] `dotDamageShare`: 0.293 >= 0.200
- PASS [metric] `dotDamageShare`: 0.293 <= 0.550
- PASS [metric] `statusPayoffDamageShare`: 0.177 >= 0.080
- PASS [failure boundary] `payoffStartsAfterSetup`: 1 >= 1

### `shadowExecute` 暗影处决

- Fantasy: Create one vulnerable target and repeatedly finish the lowest-health enemy.
- Experience: Damage begins to concentrate on a vulnerable enemy. -> The target enters the execute band. -> Execute damage rapidly finishes that target. -> Focus moves to the next lowest-health enemy.
- Samples: 16
- PASS [curve] `peak2sDamageShare`: 0.287 >= 0.160
- PASS [metric] `executeDamageShare`: 0.298 >= 0.100
- PASS [metric] `lowestTargetDamageShare`: 0.373 >= 0.250
- PASS [metric] `selfCostPerSecond`: 2.008 >= 0.200
- PASS [failure boundary] `areaDamageShare`: 0.032 <= 0.500

