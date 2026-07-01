# Equipment Progression Batch Analysis

Generated at: 2026-07-01T07:12:54.552Z
Runs: 12; waterline sample: 60; ticks: 30; items/team/tick: 3

## Summary

- Average final team-set score: 0.708
- Average score gain: 0.301
- Average satisfying jumps per run: 2.333
- Feel counts: {"overcap-risk":10,"uneven-growth":1,"acceptable-growth":1}
- 1/12 runs have acceptable or good growth feel.
- Overcap exists: fireBurst, poisonBloom.
- Weak growth exists: holySustain, shadowExecute.
- Fire/poison still need equipment-specific checks, even after attribute haste tuning.

## Archetype Aggregate

| Team | Runs | Avg End | Avg Gain | Avg Jumps | Cap Ticks | Avg Plateau | Max Static |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| bloodRage | 5 | 0.603 | 0.263 | 8.8 | 0 | 3.8 | 189.633 |
| fireBurst | 7 | 1 | 0.355 | 2.429 | 186 | 22.714 | 203.119 |
| ironWall | 6 | 0.764 | 0.636 | 6.667 | 0 | 4.167 | 237.462 |
| poisonBloom | 7 | 0.964 | 0.279 | 3.286 | 139 | 11.286 | 155.139 |
| shadowExecute | 6 | 0.442 | 0.125 | 8 | 0 | 3.667 | 161.34 |
| holySustain | 5 | 0.297 | 0.107 | 3.8 | 0 | 4.4 | 156.549 |

## Runs

| Run | Teams | Start Avg | End Avg | Gain | Jumps | Max Jump | Cap Ticks | Low Floor Ticks | Feel |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| front_spell_a | bloodRage / fireBurst / ironWall | 0.389 | 0.767 | 0.378 | 2 | 0.289 | 28 | 2 | overcap-risk |
| front_spell_b | bloodRage / fireBurst / ironWall | 0.367 | 0.806 | 0.439 | 3 | 0.177 | 28 | 2 | overcap-risk |
| status_execute_a | poisonBloom / shadowExecute / holySustain | 0.4 | 0.556 | 0.156 | 3 | 0.056 | 15 | 31 | overcap-risk |
| status_execute_b | poisonBloom / shadowExecute / holySustain | 0.378 | 0.561 | 0.183 | 2 | 0.088 | 27 | 31 | overcap-risk |
| double_dot_front_a | fireBurst / poisonBloom / ironWall | 0.472 | 0.894 | 0.422 | 3 | 0.178 | 27 | 1 | overcap-risk |
| double_dot_front_b | fireBurst / poisonBloom / ironWall | 0.517 | 0.939 | 0.422 | 2 | 0.216 | 28 | 1 | overcap-risk |
| risk_burst_sustain | bloodRage / shadowExecute / holySustain | 0.289 | 0.461 | 0.172 | 1 | 0.078 | 0 | 31 | uneven-growth |
| defensive_shells | ironWall / holySustain / bloodRage | 0.2 | 0.55 | 0.35 | 3 | 0.106 | 0 | 31 | acceptable-growth |
| damage_shells_a | fireBurst / poisonBloom / shadowExecute | 0.556 | 0.806 | 0.25 | 3 | 0.083 | 27 | 6 | overcap-risk |
| damage_shells_b | fireBurst / poisonBloom / shadowExecute | 0.556 | 0.8 | 0.244 | 2 | 0.105 | 26 | 7 | overcap-risk |
| spell_execute_sustain | fireBurst / shadowExecute / holySustain | 0.383 | 0.583 | 0.2 | 1 | 0.145 | 26 | 31 | overcap-risk |
| pressure_front | bloodRage / poisonBloom / ironWall | 0.372 | 0.772 | 0.4 | 3 | 0.216 | 18 | 2 | overcap-risk |

## Overcap Watch

- front_spell_a / fireBurst: end 1, gain 0.333, capTicks 28, bonus hp+165, phys+8, magic+33.52, armor+20, atkSpd x1.251, haste x1.28, effect x1.5
- front_spell_b / fireBurst: end 1, gain 0.367, capTicks 28, bonus hp+249, phys+8, magic+15.05, armor+17.341, atkSpd x1.036, haste x1.269, effect x1.487
- double_dot_front_a / fireBurst: end 1, gain 0.417, capTicks 27, bonus hp+228, phys+8, magic+40.061, armor+20, atkSpd x1.274, haste x1.156, effect x1.343
- double_dot_front_b / fireBurst: end 1, gain 0.35, capTicks 26, bonus hp+206, phys+8, magic+60.033, armor+20, atkSpd x1.157, haste x1.168, effect x1.224
- damage_shells_b / fireBurst: end 1, gain 0.35, capTicks 26, bonus hp+156, phys+8, magic+36.773, armor+20, atkSpd x1.211, haste x1.124, effect x1.288
- spell_execute_sustain / fireBurst: end 1, gain 0.35, capTicks 26, bonus hp+184, phys+8, magic+77.066, armor+20, atkSpd x1.159, haste x1.19, effect x1.192
- damage_shells_a / fireBurst: end 1, gain 0.317, capTicks 25, bonus hp+151, phys+8, magic+54.457, armor+20, atkSpd x1.151, haste x1.192, effect x1.229
- double_dot_front_b / poisonBloom: end 0.983, gain 0.25, capTicks 28, bonus hp+145, phys+10, magic+12, armor+17.526, atkSpd x1.458, haste x1.341, effect x1.18
- pressure_front / poisonBloom: end 0.983, gain 0.3, capTicks 18, bonus hp+145, phys+10, magic+33.897, armor+12.693, atkSpd x1.137, haste x1.379, effect x1.18
- status_execute_b / poisonBloom: end 0.967, gain 0.334, capTicks 27, bonus hp+145, phys+10, magic+23.097, armor+35.457, atkSpd x1.054, haste x1.214, effect x1.18
- damage_shells_a / poisonBloom: end 0.967, gain 0.3, capTicks 21, bonus hp+145, phys+10, magic+44.068, armor+23.2, atkSpd x1.043, haste x1.261, effect x1.18
- status_execute_a / poisonBloom: end 0.967, gain 0.3, capTicks 15, bonus hp+145, phys+10, magic+20.128, armor+16.546, atkSpd x1.072, haste x1.192, effect x1.18

## Weak Growth Watch

- status_execute_a / holySustain: end 0.267, gain 0.067, capTicks 0, bonus hp+25, phys+0, magic+10, armor+4, atkSpd x1.02, haste x1.035, effect x1.03
- status_execute_b / holySustain: end 0.3, gain 0.1, capTicks 0, bonus hp+25, phys+0, magic+10, armor+4, atkSpd x1.02, haste x1.035, effect x1.03
- spell_execute_sustain / holySustain: end 0.3, gain 0.1, capTicks 0, bonus hp+25, phys+0, magic+10, armor+4, atkSpd x1.02, haste x1.035, effect x1.03
- risk_burst_sustain / holySustain: end 0.3, gain 0.117, capTicks 0, bonus hp+25, phys+0, magic+10, armor+4, atkSpd x1.02, haste x1.035, effect x1.03
- defensive_shells / holySustain: end 0.317, gain 0.15, capTicks 0, bonus hp+25, phys+0, magic+10, armor+4, atkSpd x1.02, haste x1.035, effect x1.03
- status_execute_b / shadowExecute: end 0.417, gain 0.117, capTicks 0, bonus hp+10, phys+16, magic+0, armor+1, atkSpd x1.05, haste x1.015, effect x1.015
- status_execute_a / shadowExecute: end 0.433, gain 0.1, capTicks 0, bonus hp+10, phys+16, magic+0, armor+1, atkSpd x1.05, haste x1.015, effect x1.015
- risk_burst_sustain / shadowExecute: end 0.433, gain 0.1, capTicks 0, bonus hp+10, phys+16, magic+0, armor+1, atkSpd x1.05, haste x1.015, effect x1.015
- damage_shells_a / shadowExecute: end 0.45, gain 0.133, capTicks 0, bonus hp+10, phys+16, magic+0, armor+1, atkSpd x1.05, haste x1.015, effect x1.015

## Readout

- A satisfying jump is a score increase of at least 0.05 in one tick.
- Cap risk means score reaches 0.95 or above for many ticks.
- Plateau ticks count nearly-flat ticks below 0.01 score change.
