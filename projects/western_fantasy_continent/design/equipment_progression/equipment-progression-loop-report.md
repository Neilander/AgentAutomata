# Equipment Progression Loop Simulation

Generated at: 2026-07-01T03:16:54.652Z

## Setup

- Player teams: 低血狂战队 `bloodRage`, 火法燃烧队 `fireBurst`, 铁壁骑士队 `ironWall`
- Ticks: 30
- Items per tick: 9, split as 3 per team
- High bucket sample: 24 teams from 13_14, 15_17
- Drop quality score: average 0.45, best 0.35, worst 0.2

## Summary

- Start average / best / worst: 0.222 / 0.458 / 0
- End average / best / worst: 0.625 / 1 / 0.333
- Delta average / best / worst: 0.403 / 0.542 / 0.333
- Max spread: 0.958
- Interpretation: average team power grows visibly; top team growth is visible; team gap becomes large; catch-up pressure is needed; top team approaches high-bucket ceiling

## Timeline

| Tick | Drop quality | Average | Best | Worst | Spread | Team scores |
| ---: | ---: | ---: | ---: | ---: | ---: | --- |
| 0 | 0 | 0.222 | 0.458 | 0 | 0.458 | 低血狂战队:0.208<br>火法燃烧队:0.458<br>铁壁骑士队:0 |
| 3 | 0.477 | 0.43 | 0.833 | 0 | 0.833 | 低血狂战队:0.458<br>火法燃烧队:0.833<br>铁壁骑士队:0 |
| 6 | 0.642 | 0.583 | 0.958 | 0.292 | 0.666 | 低血狂战队:0.5<br>火法燃烧队:0.958<br>铁壁骑士队:0.292 |
| 9 | 0.654 | 0.611 | 0.958 | 0.333 | 0.625 | 低血狂战队:0.542<br>火法燃烧队:0.958<br>铁壁骑士队:0.333 |
| 12 | 0.7 | 0.611 | 0.958 | 0.375 | 0.583 | 低血狂战队:0.5<br>火法燃烧队:0.958<br>铁壁骑士队:0.375 |
| 15 | 0.66 | 0.611 | 0.958 | 0.292 | 0.666 | 低血狂战队:0.583<br>火法燃烧队:0.958<br>铁壁骑士队:0.292 |
| 18 | 0.719 | 0.611 | 0.958 | 0.333 | 0.625 | 低血狂战队:0.542<br>火法燃烧队:0.958<br>铁壁骑士队:0.333 |
| 21 | 0.698 | 0.639 | 1 | 0.417 | 0.583 | 低血狂战队:0.5<br>火法燃烧队:1<br>铁壁骑士队:0.417 |
| 24 | 0.727 | 0.653 | 1 | 0.375 | 0.625 | 低血狂战队:0.583<br>火法燃烧队:1<br>铁壁骑士队:0.375 |
| 27 | 0.698 | 0.639 | 1 | 0.292 | 0.708 | 低血狂战队:0.625<br>火法燃烧队:1<br>铁壁骑士队:0.292 |
| 30 | 0.704 | 0.625 | 1 | 0.333 | 0.667 | 低血狂战队:0.542<br>火法燃烧队:1<br>铁壁骑士队:0.333 |

## Final Bonuses

- 低血狂战队: HP +0, phys +24, magic +0, armor +2, atk x1.162, haste x1.04, effect x1.102, resist 0.023, heal x1.02
- 火法燃烧队: HP +201, phys +8, magic +58.106, armor +20, atk x1.035, haste x1.28, effect x1.251, resist 0.081, heal x1.08
- 铁壁骑士队: HP +50, phys +6, magic +8, armor +12, atk x1.02, haste x1.123, effect x1.02, resist 0.06, heal x1.113

## Notes

- This is a fast loop simulation, not a final economy model.
- It uses high-bucket mob waterline samples instead of the full 500-team waterline.
- The goal is to observe score trajectory shape: average, best, worst, and spread.
