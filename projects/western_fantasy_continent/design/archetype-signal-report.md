# Archetype Signal And Curve Acceptance Report

Generated from preset-owned design contracts with 4 deterministic seeds per side and validation opponent.

A pass requires the intended process curve, numeric conversion, and failure boundaries. Win rate is evaluated separately.

## Summary

| Preset | Primary output | Result | Passing checks | Validation opponents |
| --- | --- | --- | ---: | --- |
| `alchemyChaos` 炼金异常 | statusPayoff | pass | 6/6 | ironWall, shadowExecute |
| `bloodRage` 低血狂怒 | basicAttack | pass | 9/9 | ironWall, frostControl |
| `bulwarkMarks` 壁垒猎标 | focusBasic | pass | 6/6 | ironWall, holySustain, poisonBloom, fireBurst |
| `cavalryBreak` 王骑破阵 | controlTempo | pass | 5/5 | ironWall, duelChampion, poisonBloom |
| `crownCarry` 王冠核心 | basicAttack | pass | 7/7 | poisonBloom, shadowExecute |
| `duelChampion` 决斗冠军 | singleTargetSkill | pass | 5/5 | ironWall, holySustain, fireBurst |
| `fireBurst` 余烬爆燃 | burst | pass | 7/7 | alchemyChaos, ironWall |
| `frostControl` 霜控拖延 | control | pass | 5/5 | bloodRage, fireBurst |
| `frostTrapField` 霜陷猎场 | controlFocus | pass | 5/5 | bloodRage, ironWall, poisonBloom |
| `holySustain` 圣盾续航 | sustain | pass | 6/6 | fireBurst, poisonBloom |
| `ironWall` 铁壁反击 | counterattack | pass | 8/8 | lightningTempo, poisonBloom |
| `lightningTempo` 急速节奏 | focusBasic | pass | 5/5 | ironWall, frostControl |
| `martyrFrontline` 殉道前线 | frontlineSustain | pass | 5/5 | bloodRage, ironWall, fireBurst |
| `poisonBloom` 毒巢滚雪球 | dot | pass | 8/8 | ironWall, fireBurst |
| `purgeAttrition` 净化消耗 | dot | pass | 6/6 | fireBurst, shadowExecute |
| `scarletVanguard` 赤血先锋 | basic attack | pass | 6/6 | ironWall, shadowExecute |
| `shadowExecute` 暗影处决 | execute | pass | 5/5 | crownCarry, ironWall |

## Details

### `alchemyChaos` 炼金异常

- Fantasy: Mix poison and burn, then cash accumulated statuses into area damage.
- Experience: Poison and burn begin accumulating together. -> Both statuses overlap on several targets. -> Alchemy skills convert the overlap into area damage. -> Statuses rebuild after the payoff.
- Samples: 16
- PASS [curve] `dualStatusOverlapRatio`: 1 >= 0.250
- PASS [curve] `payoffCycles`: 11.938 >= 1
- PASS [metric] `statusStacksApplied`: 49.188 >= 20
- PASS [metric] `statusPayoffDamageShare`: 0.230 >= 0.120
- PASS [failure boundary] `poisonStacksApplied`: 29.625 >= 4
- PASS [failure boundary] `burnStacksApplied`: 19.563 >= 4

### `bloodRage` 低血狂怒

- Fantasy: Fall into danger, refuse death, then recover through empowered basic attacks.
- Experience: The berserker loses health from a safe band. -> The berserker enters the low-health danger band. -> Attack cadence, empowered basics, and lifesteal rise. -> Health repeatedly dips and recovers instead of immediately dying.
- Samples: 16
- PASS [curve] `highHealthDecline`: 0.615 >= 0.300
- PASS [curve] `lowHealthSurvivalSeconds`: 10.000 >= 3
- PASS [curve] `lowHealthOscillations`: 6.625 >= 1
- PASS [curve] `postLowAttackRateRatio`: 2.115 >= 1.200
- PASS [curve] `recoveryAfterLow`: 0.154 >= 0.080
- PASS [metric] `basicDamageShare`: 0.929 >= 0.450
- PASS [metric] `empoweredBasicDamageShare`: 0.830 >= 0.300
- PASS [metric] `healingPerSecond`: 19.223 >= 1
- PASS [failure boundary] `lowHealthEntryRate`: 1 >= 0.500

### `bulwarkMarks` 壁垒猎标

- Fantasy: Hold melee pressure behind a riposte wall while one ranger builds marks and another cashes them out into focused shots.
- Experience: The knight absorbs early melee contact. -> One ranger keeps marks moving while the other waits for a cash-out window. -> Mark detonation and repeated shots finish one slow target at a time. -> The team waits for the next shield and mark window.
- Samples: 32
- PASS [curve] `lowestTargetDamageShare`: 0.401 >= 0.300
- PASS [curve] `counterTriggers`: 1.469 >= 1
- PASS [metric] `markApplications`: 13.625 >= 4
- PASS [metric] `shieldPerSecond`: 19.969 >= 3
- PASS [metric] `lowestTargetDamageShare`: 0.401 >= 0.300
- PASS [failure boundary] `counterDamageShare`: 0.003 <= 0.220

### `cavalryBreak` 王骑破阵

- Fantasy: A charge knight crashes into the enemy front line, slows it, and lets the team attack during the disruption window.
- Experience: The knight charges early instead of only waiting behind shields. -> Enemy front units are slowed and briefly pulled into pressure. -> Royal Cavalry Break creates a larger disruption window. -> The team loses momentum when slow windows expire.
- Samples: 24
- PASS [curve] `slowApplications`: 7.917 >= 4
- PASS [curve] `controlWindowMeleeRateRatio`: 0.172 <= 0.850
- PASS [metric] `slowApplications`: 7.917 >= 4
- PASS [metric] `areaDamageShare`: 0.256 >= 0.080
- PASS [failure boundary] `shieldPerSecond`: 14.888 <= 38

### `crownCarry` 王冠核心

- Fantasy: Three allies funnel protection and tempo into one visible carry.
- Experience: Supports begin feeding one designated carry. -> Buff and haste windows concentrate on that carry. -> The carry becomes the visible majority damage source. -> Team output falls outside the carry window.
- Samples: 16
- PASS [curve] `carryBuffShare`: 0.677 >= 0.450
- PASS [metric] `basicDamageShare`: 1 >= 0.280
- PASS [metric] `hasteWindowBasicDamageShare`: 0.615 >= 0.100
- PASS [metric] `shieldPerSecond`: 29.135 >= 3
- PASS [failure boundary] `carrySurvives10Seconds`: 1 >= 0.750
- PASS [failure boundary] `carryDamageShare`: 0.708 >= 0.450
- PASS [failure boundary] `carryDamageShare`: 0.708 <= 0.750

### `duelChampion` 决斗冠军

- Fantasy: A warrior names one enemy, holds the duel window, and wins through repeated single-target pressure.
- Experience: The warrior marks a current front target for a duel. -> Damage concentrates on that target instead of spreading. -> Single Combat Verdict refreshes the duel and lands a heavy strike. -> The team waits for the next named target.
- Samples: 24
- PASS [curve] `lowestTargetDamageShare`: 0.697 >= 0.320
- PASS [curve] `areaDamageShare`: 0 <= 0.280
- PASS [metric] `lowestTargetDamageShare`: 0.697 >= 0.320
- PASS [metric] `basicDamageShare`: 0.693 >= 0.180
- PASS [failure boundary] `areaDamageShare`: 0 <= 0.300

### `fireBurst` 余烬爆燃

- Fantasy: Ignite the team, spread fire, then end the fight with a meteor burst.
- Experience: Burn is applied across several enemies. -> Fire spreads and prepares the meteor window. -> A short, visible damage peak lands. -> Damage falls after the burst while cooldowns recover.
- Samples: 16
- PASS [curve] `peak2sDamageShare`: 0.361 >= 0.200
- PASS [curve] `postPeakDamageRateRatio`: 0.333 <= 0.750
- PASS [curve] `burnCoverageBeforeUltimate`: 1 >= 0.500
- PASS [metric] `burnStacksApplied`: 29 >= 12
- PASS [metric] `ultimateDamageShare`: 0.166 >= 0.120
- PASS [metric] `areaDamageShare`: 0.459 >= 0.200
- PASS [failure boundary] `payoffStartsAfterSetup`: 1 >= 1

### `frostControl` 霜控拖延

- Fantasy: Slow the enemy front line so ranged damage gains extra time to work.
- Experience: Enemy melee units approach normally. -> Slow windows suppress their movement and attacks. -> The backline gains extra uncontested output time. -> Pressure rises again when control expires.
- Samples: 16
- PASS [curve] `controlWindowMeleeRateRatio`: 0.000 <= 0.800
- PASS [metric] `slowApplications`: 6.625 >= 4
- PASS [metric] `enemyMeleeBasicPerSecond`: 0.460 <= 1.800
- PASS [metric] `statusPayoffDamageShare`: 0.188 >= 0.050
- PASS [failure boundary] `slowApplications`: 6.625 >= 1

### `frostTrapField` 霜陷猎场

- Fantasy: Ranger traps and mage frost turn the battlefield into a slow kill zone.
- Experience: Trap shots and frost skills apply slow and marks. -> Enemy melee cadence drops during control windows. -> Marked and slowed targets are finished by focused shots. -> Pressure falls if the team cannot refresh slow.
- Samples: 24
- PASS [curve] `slowApplications`: 26.750 >= 6
- PASS [curve] `controlWindowMeleeRateRatio`: 0.000 <= 0.850
- PASS [metric] `markApplications`: 11.583 >= 4
- PASS [metric] `lowestTargetDamageShare`: 0.302 >= 0.300
- PASS [failure boundary] `areaDamageShare`: 0.216 <= 0.450

### `holySustain` 圣盾续航

- Fantasy: Absorb repeated pressure until healing and shields stabilize the whole team.
- Experience: The team takes visible early pressure. -> A health crisis activates repeated healing and shields. -> Average team health stabilizes or recovers. -> The team survives into a longer attrition phase.
- Samples: 16
- PASS [curve] `teamRecoveryAfterCrisis`: 0.174 >= 0.100
- PASS [metric] `healingPerSecond`: 25.782 >= 5
- PASS [metric] `shieldPerSecond`: 43.207 >= 4
- PASS [metric] `effectiveHealingRatio`: 0.922 >= 0.600
- PASS [metric] `survivorsAt20Seconds`: 2.500 >= 2
- PASS [failure boundary] `teamRecoveryAfterCrisis`: 0.174 <= 0.550

### `ironWall` 铁壁反击

- Fantasy: Invite melee pressure into shields, then turn blocked damage into counterattacks.
- Experience: The frontline absorbs pressure behind shields. -> Blocked melee hits trigger retaliation. -> The banner slows team health loss and opens a team counter window. -> The team returns to ordinary defense after the retaliation window.
- Samples: 16
- PASS [curve] `blockedCounterLinkRate`: 1 >= 0.950
- PASS [curve] `postUltimateHpLossRatio`: 0.066 <= 0.800
- PASS [metric] `counterTriggers`: 7.750 >= 1
- PASS [metric] `counterDamageShare`: 0.132 >= 0.060
- PASS [metric] `counterDamageShare`: 0.132 <= 0.180
- PASS [metric] `shieldPerSecond`: 34.062 >= 3
- PASS [metric] `ultimateCastsBefore15`: 1 >= 1
- PASS [failure boundary] `ultimateBeforeFirstDeath`: 1 >= 0.750

### `lightningTempo` 急速节奏

- Fantasy: Build marks quickly and convert team haste into repeated focused shots.
- Experience: Rangers establish a marked target. -> Marks and haste concentrate repeated attacks. -> The focused target falls faster during the tempo window. -> Attack pressure falls between haste windows.
- Samples: 16
- PASS [curve] `topTwoBuffShare`: 0.732 >= 0.550
- PASS [metric] `markApplications`: 7 >= 6
- PASS [metric] `hasteWindowBasicDamageShare`: 0.228 >= 0.120
- PASS [metric] `basicDamageShare`: 0.381 >= 0.200
- PASS [failure boundary] `lowestTargetDamageShare`: 0.392 >= 0.350

### `martyrFrontline` 殉道前线

- Fantasy: A priest becomes a temporary frontline bastion, absorbing pressure with self-shields while allies grind the fight out.
- Experience: The priest steps into danger rather than hiding as a healer. -> Self-shields and guard windows blunt early pressure. -> Bastion Sanctuary stabilizes the whole team. -> The team is vulnerable between sanctuary windows.
- Samples: 24
- PASS [curve] `shieldPerSecond`: 11.981 >= 8
- PASS [curve] `survivorsAt20Seconds`: 1.708 >= 1.500
- PASS [metric] `healingPerSecond`: 3.939 >= 3
- PASS [metric] `shieldPerSecond`: 11.981 >= 8
- PASS [failure boundary] `carryDamageShare`: 0.448 <= 0.720

### `poisonBloom` 毒巢滚雪球

- Fantasy: Survive the opening, accumulate poison, then spread and detonate it.
- Experience: Poison begins slowly while the team survives. -> Stacks accelerate and spread between enemies. -> A poison payoff converts accumulated stacks into damage. -> Stacks fall and begin accumulating again.
- Samples: 16
- PASS [curve] `poisonApplicationAcceleration`: 1.817 >= 1.150
- PASS [curve] `poisonSpreadEvents`: 5.750 >= 0.500
- PASS [curve] `payoffCycles`: 1.375 >= 1
- PASS [metric] `poisonStacksApplied`: 70.438 >= 12
- PASS [metric] `dotDamageShare`: 0.365 >= 0.200
- PASS [metric] `dotDamageShare`: 0.365 <= 0.550
- PASS [metric] `statusPayoffDamageShare`: 0.203 >= 0.080
- PASS [failure boundary] `payoffStartsAfterSetup`: 1 >= 1

### `purgeAttrition` 净化消耗

- Fantasy: Survive status pressure, then let poison and carry support convert a long fight into inevitability.
- Experience: The team takes poison or burn pressure. -> Purifying shields blunt the dangerous status window. -> Poison stacks and carry buffs start to decide the long fight. -> The team stabilizes rather than bursting.
- Samples: 16
- PASS [curve] `poisonStacksApplied`: 36.375 >= 16
- PASS [curve] `shieldPerSecond`: 15.238 >= 3
- PASS [metric] `poisonStacksApplied`: 36.375 >= 10
- PASS [metric] `shieldPerSecond`: 15.238 >= 3
- PASS [metric] `dotDamageShare`: 0.464 >= 0.160
- PASS [failure boundary] `selfCostPerSecond`: 1.534 >= 0.100

### `scarletVanguard` 赤血先锋

- Fantasy: A risky berserker front line opens danger windows while the team stabilizes and burns enemies down.
- Experience: The berserker deliberately takes risk. -> Short guard and shields prevent immediate collapse. -> Low-health basic pressure and fire zones win before the frontline burns out. -> The team needs new guard windows after each risk cycle.
- Samples: 16
- PASS [curve] `lowHealthEntryRate`: 1 >= 0.500
- PASS [curve] `postLowAttackRateRatio`: 3.786 >= 1.150
- PASS [metric] `basicDamageShare`: 0.788 >= 0.220
- PASS [metric] `selfCostPerSecond`: 3.724 >= 0.150
- PASS [metric] `areaDamageShare`: 0.188 >= 0.120
- PASS [failure boundary] `lowHealthEntryRate`: 1 >= 0.500

### `shadowExecute` 暗影处决

- Fantasy: Create one vulnerable target and repeatedly finish the lowest-health enemy.
- Experience: Damage begins to concentrate on a vulnerable enemy. -> The target enters the execute band. -> Execute damage rapidly finishes that target. -> Focus moves to the next lowest-health enemy.
- Samples: 16
- PASS [curve] `peak2sDamageShare`: 0.225 >= 0.160
- PASS [metric] `executeDamageShare`: 0.149 >= 0.100
- PASS [metric] `lowestTargetDamageShare`: 0.533 >= 0.250
- PASS [metric] `selfCostPerSecond`: 2.235 >= 0.200
- PASS [failure boundary] `areaDamageShare`: 0.060 <= 0.500

