# Archetype Matchup Report

Generated with `15` deterministic seeds per side, `30` total games per matchup, from `game_data/combat-sim.js`.

Rates are left preset win rates. Expectation checks ask whether a matchup follows the intended strong/weak/flex contract; ecology health treats 0/100 as expected in low-randomness combat, then checks whether hard counters have answers and whether any preset becomes an all-rounder.

## Win Matrix

| Preset | 炼金异常 | 低血狂怒 | 壁垒猎标 | 王骑破阵 | 王冠核心 | 决斗冠军 | 余烬爆燃 | 霜控拖延 | 霜陷猎场 | 圣盾续航 | 铁壁反击 | 急速节奏 | 殉道前线 | 毒巢滚雪球 | 净化消耗 | 赤血先锋 | 暗影处决 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 炼金异常 | — | 77%! | 100% | 90% | 20% | 100% | 13% | 40% | 53% | 100% | 100% | 50%! | 100% | 57%! | 87% | 100% | 100% |
| 低血狂怒 | 23%! | — | 60% | 83% | 0% | 70% | 0% | 0% | 30% | 100% | 83% | 13% | 93% | 3% | 97% | 3% | 20% |
| 壁垒猎标 | 0% | 40% | — | 0% | 0% | 83% | 0% | 0% | 0% | 100% | 87% | 43% | 93% | 0% | 80% | 23% | 70%! |
| 王骑破阵 | 10% | 17% | 100% | — | 13% | 73% | 13% | 7% | 17% | 73% | 100% | 20% | 67% | 0% | 90% | 50% | 60% |
| 王冠核心 | 80% | 100% | 100% | 87% | — | 100% | 40% | 100% | 100% | 100% | 100% | 100% | 100% | 100%! | 100% | 70% | 100% |
| 决斗冠军 | 0% | 30% | 17% | 27% | 0% | — | 0% | 70% | 23% | 13%! | 60% | 30% | 7% | 0% | 33% | 53% | 23% |
| 余烬爆燃 | 87% | 100% | 100% | 87% | 60% | 100% | — | 90% | 100% | 100% | 100% | 13%! | 100% | 40%! | 100% | 100% | 100%! |
| 霜控拖延 | 60% | 100% | 100% | 93% | 0% | 30% | 10% | — | 90% | 100% | 100% | 77% | 100% | 7% | 90% | 93% | 100%! |
| 霜陷猎场 | 47% | 70% | 100% | 83% | 0% | 77% | 0% | 10% | — | 87% | 100% | 90% | 90% | 7% | 100% | 57% | 73% |
| 圣盾续航 | 0% | 0% | 0% | 27% | 0% | 87% | 0% | 0% | 13% | — | 47% | 7%! | 37% | 0% | 0% | 0% | 53%! |
| 铁壁反击 | 0% | 17% | 13% | 0% | 0% | 40% | 0% | 0% | 0% | 53% | — | 100% | 47% | 0% | 3% | 27% | 70%! |
| 急速节奏 | 50%! | 87% | 57% | 80% | 0% | 70% | 87%! | 23% | 10% | 93%! | 0% | — | 100% | 7% | 83% | 77% | 97%! |
| 殉道前线 | 0% | 7%! | 7% | 33% | 0% | 93% | 0% | 0% | 10% | 63% | 53% | 0% | — | 0% | 20% | 0% | 37% |
| 毒巢滚雪球 | 43%! | 97% | 100% | 100% | 0%! | 100% | 60%! | 93% | 93% | 100% | 100% | 93% | 100% | — | 100% | 100% | 100% |
| 净化消耗 | 13% | 3% | 20% | 10% | 0% | 67% | 0%! | 10% | 0% | 100% | 97% | 17% | 80% | 0% | — | 13% | 93%! |
| 赤血先锋 | 0% | 97% | 77% | 50% | 30% | 47% | 0% | 7% | 43% | 100% | 73% | 23% | 100% | 0% | 87% | — | 30% |
| 暗影处决 | 0% | 80% | 30% | 40% | 0% | 77% | 0%! | 0% | 27% | 47%! | 30%! | 3%! | 63% | 0% | 7% | 70% | — |

## Ecology Health

- Result: review.
- Matrix cells checked: 272.
- Absolute outcomes (0% or 100%): 112/272 (41%), recorded as determinism evidence, not an automatic failure.
- Hard counters (<= 10% or >= 90%): 156/272 (57%).
- Soft band (35%-65%): 36/272 (13%).
- Polarization score: 0.74 (0 is all 50/50, 1 is all 0/100).
- Review checks:
  - crownCarry has broad hard advantages but few hard predators (12 prey, 0 predators)
  - fireBurst has broad hard advantages but few hard predators (11 prey, 0 predators)
  - frostControl has broad hard advantages but few hard predators (10 prey, 3 predators)
  - holySustain has many hard predators and almost no hard prey (10 predators, 0 prey)
  - ironWall has many hard predators and almost no hard prey (8 predators, 1 prey)
  - martyrFrontline has many hard predators and almost no hard prey (10 predators, 1 prey)
  - poisonBloom has broad hard advantages but few hard predators (13 prey, 1 predators)

Preset ecology profile:
- `alchemyChaos`: answered; prey 8/16, predators 0/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `bloodRage`: answered; prey 3/16, predators 5/16, extreme advantage tags favored->favored, favored->weak, flex->favored, flex->weak, weak->weak.
- `bulwarkMarks`: answered; prey 2/16, predators 7/16, extreme advantage tags favored->favored, flex->favored, flex->weak.
- `cavalryBreak`: answered; prey 3/16, predators 3/16, extreme advantage tags favored->favored, flex->favored, flex->weak.
- `crownCarry`: all-rounder-risk; prey 12/16, predators 0/16, extreme advantage tags favored->favored, favored->weak, flex->favored, flex->weak, weak->favored, weak->weak.
- `duelChampion`: answered; prey 0/16, predators 5/16, extreme advantage tags -.
- `fireBurst`: all-rounder-risk; prey 11/16, predators 0/16, extreme advantage tags favored->favored, favored->weak, flex->favored, flex->weak, weak->favored, weak->weak.
- `frostControl`: all-rounder-risk; prey 10/16, predators 3/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->favored, weak->weak.
- `frostTrapField`: answered; prey 5/16, predators 4/16, extreme advantage tags favored->favored, flex->favored, flex->weak.
- `holySustain`: vulnerable-without-prey; prey 0/16, predators 10/16, extreme advantage tags -.
- `ironWall`: vulnerable-without-prey; prey 1/16, predators 8/16, extreme advantage tags favored->favored, weak->weak.
- `lightningTempo`: answered; prey 3/16, predators 4/16, extreme advantage tags favored->weak, flex->favored, flex->weak, weak->favored.
- `martyrFrontline`: vulnerable-without-prey; prey 1/16, predators 10/16, extreme advantage tags flex->favored, flex->weak.
- `poisonBloom`: all-rounder-risk; prey 13/16, predators 1/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `purgeAttrition`: answered; prey 3/16, predators 7/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->favored.
- `scarletVanguard`: answered; prey 3/16, predators 4/16, extreme advantage tags flex->favored, flex->weak.
- `shadowExecute`: answered; prey 0/16, predators 7/16, extreme advantage tags -.

Most polarized ordered matchups:
- `alchemyChaos` vs `bulwarkMarks`: 100% (flex/favored)
- `alchemyChaos` vs `duelChampion`: 100% (flex/favored)
- `alchemyChaos` vs `holySustain`: 100% (flex/favored)
- `alchemyChaos` vs `ironWall`: 100% (favored/favored)
- `alchemyChaos` vs `martyrFrontline`: 100% (flex/favored)
- `alchemyChaos` vs `scarletVanguard`: 100% (flex/favored)
- `alchemyChaos` vs `shadowExecute`: 100% (flex/favored)
- `bloodRage` vs `crownCarry`: 0% (weak/weak)
- `bloodRage` vs `fireBurst`: 0% (weak/weak)
- `bloodRage` vs `frostControl`: 0% (flex/weak)
- `bloodRage` vs `holySustain`: 100% (favored/favored)
- `bulwarkMarks` vs `alchemyChaos`: 0% (flex/weak)

## Expectation Mismatches

- `alchemyChaos` vs `bloodRage`: expected weak, actual favored, rate 77%.
- `alchemyChaos` vs `lightningTempo`: expected favored, actual even, rate 50%.
- `alchemyChaos` vs `poisonBloom`: expected weak, actual even, rate 57%.
- `bloodRage` vs `alchemyChaos`: expected favored, actual weak, rate 23%.
- `bulwarkMarks` vs `shadowExecute`: expected weak, actual favored, rate 70%.
- `crownCarry` vs `poisonBloom`: expected weak, actual favored, rate 100%.
- `duelChampion` vs `holySustain`: expected favored, actual weak, rate 13%.
- `fireBurst` vs `lightningTempo`: expected favored, actual weak, rate 13%.
- `fireBurst` vs `poisonBloom`: expected favored, actual weak, rate 40%.
- `fireBurst` vs `shadowExecute`: expected weak, actual favored, rate 100%.
- `frostControl` vs `shadowExecute`: expected weak, actual favored, rate 100%.
- `holySustain` vs `lightningTempo`: expected favored, actual weak, rate 7%.
- `holySustain` vs `shadowExecute`: expected weak, actual even, rate 53%.
- `ironWall` vs `shadowExecute`: expected weak, actual favored, rate 70%.
- `lightningTempo` vs `alchemyChaos`: expected weak, actual even, rate 50%.
- `lightningTempo` vs `fireBurst`: expected weak, actual favored, rate 87%.
- `lightningTempo` vs `holySustain`: expected weak, actual favored, rate 93%.
- `lightningTempo` vs `shadowExecute`: expected weak, actual favored, rate 97%.
- `martyrFrontline` vs `bloodRage`: expected favored, actual weak, rate 7%.
- `poisonBloom` vs `alchemyChaos`: expected favored, actual even, rate 43%.
- `poisonBloom` vs `crownCarry`: expected favored, actual weak, rate 0%.
- `poisonBloom` vs `fireBurst`: expected weak, actual favored, rate 60%.
- `purgeAttrition` vs `fireBurst`: expected favored, actual weak, rate 0%.
- `purgeAttrition` vs `shadowExecute`: expected weak, actual favored, rate 93%.
- `shadowExecute` vs `fireBurst`: expected favored, actual weak, rate 0%.
- `shadowExecute` vs `holySustain`: expected favored, actual even, rate 47%.
- `shadowExecute` vs `ironWall`: expected favored, actual weak, rate 30%.
- `shadowExecute` vs `lightningTempo`: expected favored, actual weak, rate 3%.

## Pair Details

### `alchemyChaos` into `bloodRage`

- Win rate: 77% (23/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 15.4s
- Avg left basic / DOT / heal / shield: 494 / 310 / 0 / 138
- Avg right basic / DOT / heal / shield: 900 / 0 / 230 / 130

### `alchemyChaos` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 399 / 293 / 0 / 373
- Avg right basic / DOT / heal / shield: 437 / 0 / 0 / 333

### `alchemyChaos` into `cavalryBreak`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.9s
- Avg left basic / DOT / heal / shield: 478 / 332 / 0 / 205
- Avg right basic / DOT / heal / shield: 903 / 0 / 195 / 196

### `alchemyChaos` into `crownCarry`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 305 / 331 / 0 / 198
- Avg right basic / DOT / heal / shield: 1333 / 0 / 313 / 492

### `alchemyChaos` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 275 / 296 / 0 / 282
- Avg right basic / DOT / heal / shield: 338 / 0 / 117 / 422

### `alchemyChaos` into `fireBurst`

- Win rate: 13% (4/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 13.9s
- Avg left basic / DOT / heal / shield: 271 / 260 / 0 / 201
- Avg right basic / DOT / heal / shield: 297 / 138 / 0 / 148

### `alchemyChaos` into `frostControl`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 30.9s
- Avg left basic / DOT / heal / shield: 435 / 324 / 0 / 623
- Avg right basic / DOT / heal / shield: 359 / 207 / 190 / 778

### `alchemyChaos` into `frostTrapField`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 16.6s
- Avg left basic / DOT / heal / shield: 339 / 324 / 0 / 218
- Avg right basic / DOT / heal / shield: 586 / 0 / 40 / 240

### `alchemyChaos` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 35.4s
- Avg left basic / DOT / heal / shield: 715 / 453 / 0 / 876
- Avg right basic / DOT / heal / shield: 240 / 0 / 732 / 1283

### `alchemyChaos` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 27.5s
- Avg left basic / DOT / heal / shield: 521 / 339 / 0 / 655
- Avg right basic / DOT / heal / shield: 393 / 0 / 306 / 875

### `alchemyChaos` into `lightningTempo`

- Win rate: 50% (15/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 17.2s
- Avg left basic / DOT / heal / shield: 434 / 326 / 0 / 208
- Avg right basic / DOT / heal / shield: 494 / 0 / 0 / 0

### `alchemyChaos` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.5s
- Avg left basic / DOT / heal / shield: 433 / 297 / 0 / 253
- Avg right basic / DOT / heal / shield: 281 / 98 / 72 / 167

### `alchemyChaos` into `poisonBloom`

- Win rate: 57% (17/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 16.6s
- Avg left basic / DOT / heal / shield: 485 / 266 / 0 / 243
- Avg right basic / DOT / heal / shield: 251 / 354 / 131 / 344

### `alchemyChaos` into `purgeAttrition`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 460 / 303 / 0 / 283
- Avg right basic / DOT / heal / shield: 367 / 310 / 145 / 338

### `alchemyChaos` into `scarletVanguard`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 13.5s
- Avg left basic / DOT / heal / shield: 435 / 262 / 0 / 138
- Avg right basic / DOT / heal / shield: 575 / 29 / 52 / 90

### `alchemyChaos` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.6s
- Avg left basic / DOT / heal / shield: 528 / 221 / 0 / 578
- Avg right basic / DOT / heal / shield: 217 / 193 / 0 / 457

### `bloodRage` into `alchemyChaos`

- Win rate: 23% (7/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.4s
- Avg left basic / DOT / heal / shield: 900 / 0 / 230 / 130
- Avg right basic / DOT / heal / shield: 494 / 310 / 0 / 138

### `bloodRage` into `bulwarkMarks`

- Win rate: 60% (18/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.0s
- Avg left basic / DOT / heal / shield: 1160 / 0 / 367 / 188
- Avg right basic / DOT / heal / shield: 861 / 0 / 0 / 227

### `bloodRage` into `cavalryBreak`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.8s
- Avg left basic / DOT / heal / shield: 1507 / 0 / 487 / 197
- Avg right basic / DOT / heal / shield: 1170 / 0 / 328 / 269

### `bloodRage` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 924 / 0 / 346 / 213
- Avg right basic / DOT / heal / shield: 1703 / 0 / 348 / 493

### `bloodRage` into `duelChampion`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.2s
- Avg left basic / DOT / heal / shield: 1115 / 0 / 376 / 183
- Avg right basic / DOT / heal / shield: 701 / 0 / 160 / 531

### `bloodRage` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.5s
- Avg left basic / DOT / heal / shield: 394 / 0 / 152 / 130
- Avg right basic / DOT / heal / shield: 464 / 112 / 0 / 236

### `bloodRage` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 809 / 0 / 288 / 146
- Avg right basic / DOT / heal / shield: 609 / 217 / 138 / 333

### `bloodRage` into `frostTrapField`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 837 / 0 / 312 / 170
- Avg right basic / DOT / heal / shield: 798 / 0 / 72 / 356

### `bloodRage` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 1565 / 0 / 487 / 344
- Avg right basic / DOT / heal / shield: 450 / 0 / 440 / 745

### `bloodRage` into `ironWall`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 1391 / 0 / 411 / 170
- Avg right basic / DOT / heal / shield: 621 / 0 / 155 / 572

### `bloodRage` into `lightningTempo`

- Win rate: 13% (4/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 833 / 0 / 242 / 144
- Avg right basic / DOT / heal / shield: 799 / 0 / 0 / 0

### `bloodRage` into `martyrFrontline`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.6s
- Avg left basic / DOT / heal / shield: 1313 / 0 / 372 / 238
- Avg right basic / DOT / heal / shield: 619 / 146 / 38 / 165

### `bloodRage` into `poisonBloom`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 553 / 0 / 158 / 133
- Avg right basic / DOT / heal / shield: 468 / 382 / 153 / 402

### `bloodRage` into `purgeAttrition`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.5s
- Avg left basic / DOT / heal / shield: 1376 / 0 / 320 / 150
- Avg right basic / DOT / heal / shield: 514 / 429 / 94 / 192

### `bloodRage` into `scarletVanguard`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.8s
- Avg left basic / DOT / heal / shield: 513 / 0 / 153 / 138
- Avg right basic / DOT / heal / shield: 997 / 55 / 66 / 154

### `bloodRage` into `shadowExecute`

- Win rate: 20% (6/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 20.2s
- Avg left basic / DOT / heal / shield: 721 / 0 / 195 / 148
- Avg right basic / DOT / heal / shield: 605 / 225 / 0 / 289

### `bulwarkMarks` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 437 / 0 / 0 / 333
- Avg right basic / DOT / heal / shield: 399 / 293 / 0 / 373

### `bulwarkMarks` into `bloodRage`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.0s
- Avg left basic / DOT / heal / shield: 861 / 0 / 0 / 227
- Avg right basic / DOT / heal / shield: 1160 / 0 / 367 / 188

### `bulwarkMarks` into `cavalryBreak`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.9s
- Avg left basic / DOT / heal / shield: 738 / 0 / 0 / 219
- Avg right basic / DOT / heal / shield: 1125 / 0 / 308 / 314

### `bulwarkMarks` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.2s
- Avg left basic / DOT / heal / shield: 380 / 0 / 0 / 215
- Avg right basic / DOT / heal / shield: 1388 / 0 / 360 / 510

### `bulwarkMarks` into `duelChampion`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 29.4s
- Avg left basic / DOT / heal / shield: 867 / 0 / 0 / 444
- Avg right basic / DOT / heal / shield: 672 / 0 / 282 / 770

### `bulwarkMarks` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.9s
- Avg left basic / DOT / heal / shield: 405 / 0 / 0 / 223
- Avg right basic / DOT / heal / shield: 319 / 166 / 0 / 147

### `bulwarkMarks` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.7s
- Avg left basic / DOT / heal / shield: 452 / 0 / 0 / 443
- Avg right basic / DOT / heal / shield: 463 / 204 / 230 / 653

### `bulwarkMarks` into `frostTrapField`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 466 / 0 / 0 / 216
- Avg right basic / DOT / heal / shield: 629 / 0 / 103 / 306

### `bulwarkMarks` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 38.2s
- Avg left basic / DOT / heal / shield: 1060 / 0 / 0 / 1052
- Avg right basic / DOT / heal / shield: 191 / 0 / 534 / 1413

### `bulwarkMarks` into `ironWall`

- Win rate: 87% (26/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 32.5s
- Avg left basic / DOT / heal / shield: 903 / 0 / 0 / 879
- Avg right basic / DOT / heal / shield: 535 / 0 / 337 / 1015

### `bulwarkMarks` into `lightningTempo`

- Win rate: 43% (13/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 19.8s
- Avg left basic / DOT / heal / shield: 668 / 0 / 0 / 185
- Avg right basic / DOT / heal / shield: 634 / 0 / 0 / 0

### `bulwarkMarks` into `martyrFrontline`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.4s
- Avg left basic / DOT / heal / shield: 791 / 0 / 0 / 339
- Avg right basic / DOT / heal / shield: 468 / 145 / 111 / 283

### `bulwarkMarks` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 19.4s
- Avg left basic / DOT / heal / shield: 541 / 0 / 0 / 315
- Avg right basic / DOT / heal / shield: 325 / 448 / 158 / 456

### `bulwarkMarks` into `purgeAttrition`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.6s
- Avg left basic / DOT / heal / shield: 806 / 0 / 0 / 404
- Avg right basic / DOT / heal / shield: 418 / 397 / 172 / 478

### `bulwarkMarks` into `scarletVanguard`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 740 / 0 / 0 / 219
- Avg right basic / DOT / heal / shield: 799 / 91 / 60 / 115

### `bulwarkMarks` into `shadowExecute`

- Win rate: 70% (21/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 32.8s
- Avg left basic / DOT / heal / shield: 755 / 0 / 0 / 685
- Avg right basic / DOT / heal / shield: 410 / 278 / 0 / 608

### `cavalryBreak` into `alchemyChaos`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.9s
- Avg left basic / DOT / heal / shield: 903 / 0 / 195 / 196
- Avg right basic / DOT / heal / shield: 478 / 332 / 0 / 205

### `cavalryBreak` into `bloodRage`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.8s
- Avg left basic / DOT / heal / shield: 1170 / 0 / 328 / 269
- Avg right basic / DOT / heal / shield: 1507 / 0 / 487 / 197

### `cavalryBreak` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.9s
- Avg left basic / DOT / heal / shield: 1125 / 0 / 308 / 314
- Avg right basic / DOT / heal / shield: 738 / 0 / 0 / 219

### `cavalryBreak` into `crownCarry`

- Win rate: 13% (4/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 26.9s
- Avg left basic / DOT / heal / shield: 1074 / 0 / 298 / 341
- Avg right basic / DOT / heal / shield: 1661 / 0 / 350 / 451

### `cavalryBreak` into `duelChampion`

- Win rate: 73% (22/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 34.2s
- Avg left basic / DOT / heal / shield: 1110 / 0 / 328 / 483
- Avg right basic / DOT / heal / shield: 843 / 0 / 360 / 991

### `cavalryBreak` into `fireBurst`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.3s
- Avg left basic / DOT / heal / shield: 932 / 0 / 227 / 198
- Avg right basic / DOT / heal / shield: 463 / 177 / 0 / 189

### `cavalryBreak` into `frostControl`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.9s
- Avg left basic / DOT / heal / shield: 680 / 0 / 241 / 280
- Avg right basic / DOT / heal / shield: 537 / 250 / 253 / 466

### `cavalryBreak` into `frostTrapField`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 25.1s
- Avg left basic / DOT / heal / shield: 805 / 0 / 273 / 290
- Avg right basic / DOT / heal / shield: 796 / 0 / 101 / 417

### `cavalryBreak` into `holySustain`

- Win rate: 73% (22/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 41.0s
- Avg left basic / DOT / heal / shield: 1468 / 0 / 448 / 595
- Avg right basic / DOT / heal / shield: 672 / 0 / 831 / 1545

### `cavalryBreak` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 29.0s
- Avg left basic / DOT / heal / shield: 1395 / 0 / 407 / 397
- Avg right basic / DOT / heal / shield: 641 / 0 / 228 / 683

### `cavalryBreak` into `lightningTempo`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.5s
- Avg left basic / DOT / heal / shield: 746 / 0 / 168 / 225
- Avg right basic / DOT / heal / shield: 700 / 0 / 0 / 0

### `cavalryBreak` into `martyrFrontline`

- Win rate: 67% (20/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 26.0s
- Avg left basic / DOT / heal / shield: 1111 / 0 / 304 / 322
- Avg right basic / DOT / heal / shield: 633 / 142 / 68 / 197

### `cavalryBreak` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 815 / 0 / 208 / 212
- Avg right basic / DOT / heal / shield: 452 / 384 / 144 / 390

### `cavalryBreak` into `purgeAttrition`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.4s
- Avg left basic / DOT / heal / shield: 1080 / 0 / 285 / 332
- Avg right basic / DOT / heal / shield: 499 / 482 / 106 / 292

### `cavalryBreak` into `scarletVanguard`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 20.1s
- Avg left basic / DOT / heal / shield: 1066 / 0 / 273 / 225
- Avg right basic / DOT / heal / shield: 1073 / 44 / 134 / 150

### `cavalryBreak` into `shadowExecute`

- Win rate: 60% (18/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.4s
- Avg left basic / DOT / heal / shield: 1278 / 0 / 324 / 275
- Avg right basic / DOT / heal / shield: 600 / 280 / 0 / 226

### `crownCarry` into `alchemyChaos`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 1333 / 0 / 313 / 492
- Avg right basic / DOT / heal / shield: 305 / 331 / 0 / 198

### `crownCarry` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 1703 / 0 / 348 / 493
- Avg right basic / DOT / heal / shield: 924 / 0 / 346 / 213

### `crownCarry` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.2s
- Avg left basic / DOT / heal / shield: 1388 / 0 / 360 / 510
- Avg right basic / DOT / heal / shield: 380 / 0 / 0 / 215

### `crownCarry` into `cavalryBreak`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 26.9s
- Avg left basic / DOT / heal / shield: 1661 / 0 / 350 / 451
- Avg right basic / DOT / heal / shield: 1074 / 0 / 298 / 341

### `crownCarry` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 32.0s
- Avg left basic / DOT / heal / shield: 1659 / 0 / 476 / 1417
- Avg right basic / DOT / heal / shield: 255 / 0 / 302 / 795

### `crownCarry` into `fireBurst`

- Win rate: 40% (12/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 1252 / 0 / 295 / 428
- Avg right basic / DOT / heal / shield: 274 / 333 / 0 / 141

### `crownCarry` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 1450 / 0 / 483 / 746
- Avg right basic / DOT / heal / shield: 279 / 256 / 125 / 351

### `crownCarry` into `frostTrapField`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.3s
- Avg left basic / DOT / heal / shield: 1429 / 0 / 369 / 639
- Avg right basic / DOT / heal / shield: 360 / 0 / 59 / 286

### `crownCarry` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 57.9s
- Avg left basic / DOT / heal / shield: 2377 / 0 / 455 / 2343
- Avg right basic / DOT / heal / shield: 169 / 0 / 1051 / 2345

### `crownCarry` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 28.0s
- Avg left basic / DOT / heal / shield: 1674 / 0 / 526 / 1303
- Avg right basic / DOT / heal / shield: 390 / 0 / 265 / 849

### `crownCarry` into `lightningTempo`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 19.9s
- Avg left basic / DOT / heal / shield: 1392 / 0 / 371 / 655
- Avg right basic / DOT / heal / shield: 402 / 0 / 0 / 0

### `crownCarry` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 25.8s
- Avg left basic / DOT / heal / shield: 1480 / 0 / 529 / 1062
- Avg right basic / DOT / heal / shield: 354 / 202 / 113 / 309

### `crownCarry` into `poisonBloom`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 22.2s
- Avg left basic / DOT / heal / shield: 1576 / 0 / 474 / 683
- Avg right basic / DOT / heal / shield: 277 / 567 / 170 / 438

### `crownCarry` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.3s
- Avg left basic / DOT / heal / shield: 1481 / 0 / 366 / 705
- Avg right basic / DOT / heal / shield: 255 / 338 / 114 / 297

### `crownCarry` into `scarletVanguard`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.5s
- Avg left basic / DOT / heal / shield: 1408 / 0 / 319 / 422
- Avg right basic / DOT / heal / shield: 1003 / 101 / 109 / 130

### `crownCarry` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 1374 / 0 / 278 / 393
- Avg right basic / DOT / heal / shield: 224 / 230 / 0 / 199

### `duelChampion` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 338 / 0 / 117 / 422
- Avg right basic / DOT / heal / shield: 275 / 296 / 0 / 282

### `duelChampion` into `bloodRage`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.2s
- Avg left basic / DOT / heal / shield: 701 / 0 / 160 / 531
- Avg right basic / DOT / heal / shield: 1115 / 0 / 376 / 183

### `duelChampion` into `bulwarkMarks`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 29.4s
- Avg left basic / DOT / heal / shield: 672 / 0 / 282 / 770
- Avg right basic / DOT / heal / shield: 867 / 0 / 0 / 444

### `duelChampion` into `cavalryBreak`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 34.2s
- Avg left basic / DOT / heal / shield: 843 / 0 / 360 / 991
- Avg right basic / DOT / heal / shield: 1110 / 0 / 328 / 483

### `duelChampion` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 32.0s
- Avg left basic / DOT / heal / shield: 255 / 0 / 302 / 795
- Avg right basic / DOT / heal / shield: 1659 / 0 / 476 / 1417

### `duelChampion` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 33.0s
- Avg left basic / DOT / heal / shield: 294 / 0 / 377 / 1236
- Avg right basic / DOT / heal / shield: 427 / 221 / 0 / 707

### `duelChampion` into `frostControl`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 61.8s
- Avg left basic / DOT / heal / shield: 1179 / 0 / 889 / 2868
- Avg right basic / DOT / heal / shield: 427 / 353 / 531 / 1726

### `duelChampion` into `frostTrapField`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 36.1s
- Avg left basic / DOT / heal / shield: 532 / 0 / 401 / 1176
- Avg right basic / DOT / heal / shield: 711 / 0 / 86 / 582

### `duelChampion` into `holySustain`

- Win rate: 13% (4/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 580 / 0 / 412 / 3458
- Avg right basic / DOT / heal / shield: 222 / 0 / 774 / 4012

### `duelChampion` into `ironWall`

- Win rate: 60% (18/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 58.1s
- Avg left basic / DOT / heal / shield: 1084 / 0 / 505 / 2286
- Avg right basic / DOT / heal / shield: 672 / 0 / 589 / 1610

### `duelChampion` into `lightningTempo`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 26.7s
- Avg left basic / DOT / heal / shield: 811 / 0 / 207 / 641
- Avg right basic / DOT / heal / shield: 677 / 0 / 0 / 0

### `duelChampion` into `martyrFrontline`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 34.5s
- Avg left basic / DOT / heal / shield: 545 / 0 / 334 / 1088
- Avg right basic / DOT / heal / shield: 742 / 237 / 255 / 722

### `duelChampion` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 29.7s
- Avg left basic / DOT / heal / shield: 511 / 0 / 343 / 841
- Avg right basic / DOT / heal / shield: 482 / 520 / 322 / 1069

### `duelChampion` into `purgeAttrition`

- Win rate: 33% (10/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 49.6s
- Avg left basic / DOT / heal / shield: 934 / 0 / 561 / 1695
- Avg right basic / DOT / heal / shield: 677 / 671 / 527 / 1272

### `duelChampion` into `scarletVanguard`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 27.0s
- Avg left basic / DOT / heal / shield: 791 / 0 / 312 / 755
- Avg right basic / DOT / heal / shield: 824 / 97 / 76 / 197

### `duelChampion` into `shadowExecute`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 31.7s
- Avg left basic / DOT / heal / shield: 687 / 0 / 265 / 732
- Avg right basic / DOT / heal / shield: 579 / 306 / 0 / 602

### `fireBurst` into `alchemyChaos`

- Win rate: 87% (26/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 13.9s
- Avg left basic / DOT / heal / shield: 297 / 138 / 0 / 148
- Avg right basic / DOT / heal / shield: 271 / 260 / 0 / 201

### `fireBurst` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 14.5s
- Avg left basic / DOT / heal / shield: 464 / 112 / 0 / 236
- Avg right basic / DOT / heal / shield: 394 / 0 / 152 / 130

### `fireBurst` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.9s
- Avg left basic / DOT / heal / shield: 319 / 166 / 0 / 147
- Avg right basic / DOT / heal / shield: 405 / 0 / 0 / 223

### `fireBurst` into `cavalryBreak`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.3s
- Avg left basic / DOT / heal / shield: 463 / 177 / 0 / 189
- Avg right basic / DOT / heal / shield: 932 / 0 / 227 / 198

### `fireBurst` into `crownCarry`

- Win rate: 60% (18/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 274 / 333 / 0 / 141
- Avg right basic / DOT / heal / shield: 1252 / 0 / 295 / 428

### `fireBurst` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 33.0s
- Avg left basic / DOT / heal / shield: 427 / 221 / 0 / 707
- Avg right basic / DOT / heal / shield: 294 / 0 / 377 / 1236

### `fireBurst` into `frostControl`

- Win rate: 90% (27/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 16.8s
- Avg left basic / DOT / heal / shield: 286 / 161 / 0 / 147
- Avg right basic / DOT / heal / shield: 292 / 212 / 89 / 305

### `fireBurst` into `frostTrapField`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 374 / 101 / 0 / 153
- Avg right basic / DOT / heal / shield: 362 / 0 / 28 / 235

### `fireBurst` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 423 / 351 / 0 / 475
- Avg right basic / DOT / heal / shield: 251 / 0 / 573 / 827

### `fireBurst` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.6s
- Avg left basic / DOT / heal / shield: 355 / 203 / 0 / 244
- Avg right basic / DOT / heal / shield: 377 / 0 / 176 / 598

### `fireBurst` into `lightningTempo`

- Win rate: 13% (4/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 13.2s
- Avg left basic / DOT / heal / shield: 339 / 111 / 0 / 15
- Avg right basic / DOT / heal / shield: 601 / 0 / 0 / 0

### `fireBurst` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.3s
- Avg left basic / DOT / heal / shield: 398 / 209 / 0 / 225
- Avg right basic / DOT / heal / shield: 344 / 167 / 46 / 152

### `fireBurst` into `poisonBloom`

- Win rate: 40% (12/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 365 / 183 / 0 / 223
- Avg right basic / DOT / heal / shield: 269 / 412 / 157 / 415

### `fireBurst` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 314 / 135 / 0 / 143
- Avg right basic / DOT / heal / shield: 294 / 315 / 131 / 253

### `fireBurst` into `scarletVanguard`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 13.3s
- Avg left basic / DOT / heal / shield: 404 / 102 / 0 / 241
- Avg right basic / DOT / heal / shield: 418 / 46 / 35 / 94

### `fireBurst` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 15.6s
- Avg left basic / DOT / heal / shield: 388 / 142 / 0 / 144
- Avg right basic / DOT / heal / shield: 338 / 208 / 0 / 192

### `frostControl` into `alchemyChaos`

- Win rate: 60% (18/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 30.9s
- Avg left basic / DOT / heal / shield: 359 / 207 / 190 / 778
- Avg right basic / DOT / heal / shield: 435 / 324 / 0 / 623

### `frostControl` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 609 / 217 / 138 / 333
- Avg right basic / DOT / heal / shield: 809 / 0 / 288 / 146

### `frostControl` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.7s
- Avg left basic / DOT / heal / shield: 463 / 204 / 230 / 653
- Avg right basic / DOT / heal / shield: 452 / 0 / 0 / 443

### `frostControl` into `cavalryBreak`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.9s
- Avg left basic / DOT / heal / shield: 537 / 250 / 253 / 466
- Avg right basic / DOT / heal / shield: 680 / 0 / 241 / 280

### `frostControl` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 279 / 256 / 125 / 351
- Avg right basic / DOT / heal / shield: 1450 / 0 / 483 / 746

### `frostControl` into `duelChampion`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 61.8s
- Avg left basic / DOT / heal / shield: 427 / 353 / 531 / 1726
- Avg right basic / DOT / heal / shield: 1179 / 0 / 889 / 2868

### `frostControl` into `fireBurst`

- Win rate: 10% (3/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 16.8s
- Avg left basic / DOT / heal / shield: 292 / 212 / 89 / 305
- Avg right basic / DOT / heal / shield: 286 / 161 / 0 / 147

### `frostControl` into `frostTrapField`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 403 / 177 / 163 / 392
- Avg right basic / DOT / heal / shield: 465 / 0 / 60 / 262

### `frostControl` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 1034 / 325 / 569 / 2766
- Avg right basic / DOT / heal / shield: 345 / 0 / 1823 / 3733

### `frostControl` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 49.8s
- Avg left basic / DOT / heal / shield: 749 / 258 / 494 / 1703
- Avg right basic / DOT / heal / shield: 363 / 0 / 627 / 1501

### `frostControl` into `lightningTempo`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.7s
- Avg left basic / DOT / heal / shield: 494 / 186 / 121 / 405
- Avg right basic / DOT / heal / shield: 521 / 0 / 0 / 0

### `frostControl` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 475 / 202 / 275 / 614
- Avg right basic / DOT / heal / shield: 376 / 119 / 152 / 367

### `frostControl` into `poisonBloom`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 455 / 211 / 171 / 433
- Avg right basic / DOT / heal / shield: 302 / 523 / 234 / 540

### `frostControl` into `purgeAttrition`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.1s
- Avg left basic / DOT / heal / shield: 536 / 247 / 283 / 666
- Avg right basic / DOT / heal / shield: 415 / 410 / 259 / 547

### `frostControl` into `scarletVanguard`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 475 / 166 / 122 / 293
- Avg right basic / DOT / heal / shield: 691 / 53 / 71 / 116

### `frostControl` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 24.6s
- Avg left basic / DOT / heal / shield: 539 / 155 / 101 / 733
- Avg right basic / DOT / heal / shield: 232 / 222 / 0 / 440

### `frostTrapField` into `alchemyChaos`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 16.6s
- Avg left basic / DOT / heal / shield: 586 / 0 / 40 / 240
- Avg right basic / DOT / heal / shield: 339 / 324 / 0 / 218

### `frostTrapField` into `bloodRage`

- Win rate: 70% (21/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 798 / 0 / 72 / 356
- Avg right basic / DOT / heal / shield: 837 / 0 / 312 / 170

### `frostTrapField` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 629 / 0 / 103 / 306
- Avg right basic / DOT / heal / shield: 466 / 0 / 0 / 216

### `frostTrapField` into `cavalryBreak`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 25.1s
- Avg left basic / DOT / heal / shield: 796 / 0 / 101 / 417
- Avg right basic / DOT / heal / shield: 805 / 0 / 273 / 290

### `frostTrapField` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.3s
- Avg left basic / DOT / heal / shield: 360 / 0 / 59 / 286
- Avg right basic / DOT / heal / shield: 1429 / 0 / 369 / 639

### `frostTrapField` into `duelChampion`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 36.1s
- Avg left basic / DOT / heal / shield: 711 / 0 / 86 / 582
- Avg right basic / DOT / heal / shield: 532 / 0 / 401 / 1176

### `frostTrapField` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 362 / 0 / 28 / 235
- Avg right basic / DOT / heal / shield: 374 / 101 / 0 / 153

### `frostTrapField` into `frostControl`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 465 / 0 / 60 / 262
- Avg right basic / DOT / heal / shield: 403 / 177 / 163 / 392

### `frostTrapField` into `holySustain`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 41.3s
- Avg left basic / DOT / heal / shield: 1053 / 0 / 111 / 727
- Avg right basic / DOT / heal / shield: 324 / 0 / 968 / 1656

### `frostTrapField` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 28.3s
- Avg left basic / DOT / heal / shield: 784 / 0 / 84 / 522
- Avg right basic / DOT / heal / shield: 378 / 0 / 322 / 825

### `frostTrapField` into `lightningTempo`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 696 / 0 / 21 / 190
- Avg right basic / DOT / heal / shield: 438 / 0 / 0 / 0

### `frostTrapField` into `martyrFrontline`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.0s
- Avg left basic / DOT / heal / shield: 693 / 0 / 99 / 347
- Avg right basic / DOT / heal / shield: 471 / 130 / 104 / 272

### `frostTrapField` into `poisonBloom`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.3s
- Avg left basic / DOT / heal / shield: 518 / 0 / 114 / 308
- Avg right basic / DOT / heal / shield: 351 / 556 / 232 / 492

### `frostTrapField` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.4s
- Avg left basic / DOT / heal / shield: 729 / 0 / 125 / 316
- Avg right basic / DOT / heal / shield: 373 / 367 / 161 / 299

### `frostTrapField` into `scarletVanguard`

- Win rate: 57% (17/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 620 / 0 / 58 / 269
- Avg right basic / DOT / heal / shield: 743 / 56 / 78 / 123

### `frostTrapField` into `shadowExecute`

- Win rate: 73% (22/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.5s
- Avg left basic / DOT / heal / shield: 539 / 0 / 28 / 226
- Avg right basic / DOT / heal / shield: 400 / 243 / 0 / 337

### `holySustain` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 35.4s
- Avg left basic / DOT / heal / shield: 240 / 0 / 732 / 1283
- Avg right basic / DOT / heal / shield: 715 / 453 / 0 / 876

### `holySustain` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 450 / 0 / 440 / 745
- Avg right basic / DOT / heal / shield: 1565 / 0 / 487 / 344

### `holySustain` into `bulwarkMarks`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 38.2s
- Avg left basic / DOT / heal / shield: 191 / 0 / 534 / 1413
- Avg right basic / DOT / heal / shield: 1060 / 0 / 0 / 1052

### `holySustain` into `cavalryBreak`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 41.0s
- Avg left basic / DOT / heal / shield: 672 / 0 / 831 / 1545
- Avg right basic / DOT / heal / shield: 1468 / 0 / 448 / 595

### `holySustain` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 57.9s
- Avg left basic / DOT / heal / shield: 169 / 0 / 1051 / 2345
- Avg right basic / DOT / heal / shield: 2377 / 0 / 455 / 2343

### `holySustain` into `duelChampion`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 222 / 0 / 774 / 4012
- Avg right basic / DOT / heal / shield: 580 / 0 / 412 / 3458

### `holySustain` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 251 / 0 / 573 / 827
- Avg right basic / DOT / heal / shield: 423 / 351 / 0 / 475

### `holySustain` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 345 / 0 / 1823 / 3733
- Avg right basic / DOT / heal / shield: 1034 / 325 / 569 / 2766

### `holySustain` into `frostTrapField`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 41.3s
- Avg left basic / DOT / heal / shield: 324 / 0 / 968 / 1656
- Avg right basic / DOT / heal / shield: 1053 / 0 / 111 / 727

### `holySustain` into `ironWall`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 553 / 0 / 1480 / 3884
- Avg right basic / DOT / heal / shield: 1009 / 0 / 687 / 2784

### `holySustain` into `lightningTempo`

- Win rate: 7% (2/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 27.0s
- Avg left basic / DOT / heal / shield: 480 / 0 / 482 / 938
- Avg right basic / DOT / heal / shield: 710 / 0 / 0 / 0

### `holySustain` into `martyrFrontline`

- Win rate: 37% (11/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 59.6s
- Avg left basic / DOT / heal / shield: 604 / 0 / 1007 / 2463
- Avg right basic / DOT / heal / shield: 831 / 365 / 375 / 1054

### `holySustain` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 57.3s
- Avg left basic / DOT / heal / shield: 318 / 0 / 1241 / 2168
- Avg right basic / DOT / heal / shield: 743 / 998 / 162 / 1931

### `holySustain` into `purgeAttrition`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 63.8s
- Avg left basic / DOT / heal / shield: 378 / 0 / 1265 / 2663
- Avg right basic / DOT / heal / shield: 1171 / 792 / 624 / 2209

### `holySustain` into `scarletVanguard`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 352 / 0 / 428 / 670
- Avg right basic / DOT / heal / shield: 1476 / 64 / 194 / 185

### `holySustain` into `shadowExecute`

- Win rate: 53% (16/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 65.4s
- Avg left basic / DOT / heal / shield: 450 / 0 / 1005 / 2626
- Avg right basic / DOT / heal / shield: 637 / 614 / 0 / 1391

### `ironWall` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 27.5s
- Avg left basic / DOT / heal / shield: 393 / 0 / 306 / 875
- Avg right basic / DOT / heal / shield: 521 / 339 / 0 / 655

### `ironWall` into `bloodRage`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 621 / 0 / 155 / 572
- Avg right basic / DOT / heal / shield: 1391 / 0 / 411 / 170

### `ironWall` into `bulwarkMarks`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 32.5s
- Avg left basic / DOT / heal / shield: 535 / 0 / 337 / 1015
- Avg right basic / DOT / heal / shield: 903 / 0 / 0 / 879

### `ironWall` into `cavalryBreak`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 29.0s
- Avg left basic / DOT / heal / shield: 641 / 0 / 228 / 683
- Avg right basic / DOT / heal / shield: 1395 / 0 / 407 / 397

### `ironWall` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 28.0s
- Avg left basic / DOT / heal / shield: 390 / 0 / 265 / 849
- Avg right basic / DOT / heal / shield: 1674 / 0 / 526 / 1303

### `ironWall` into `duelChampion`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 58.1s
- Avg left basic / DOT / heal / shield: 672 / 0 / 589 / 1610
- Avg right basic / DOT / heal / shield: 1084 / 0 / 505 / 2286

### `ironWall` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.6s
- Avg left basic / DOT / heal / shield: 377 / 0 / 176 / 598
- Avg right basic / DOT / heal / shield: 355 / 203 / 0 / 244

### `ironWall` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 49.8s
- Avg left basic / DOT / heal / shield: 363 / 0 / 627 / 1501
- Avg right basic / DOT / heal / shield: 749 / 258 / 494 / 1703

### `ironWall` into `frostTrapField`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 28.3s
- Avg left basic / DOT / heal / shield: 378 / 0 / 322 / 825
- Avg right basic / DOT / heal / shield: 784 / 0 / 84 / 522

### `ironWall` into `holySustain`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 1009 / 0 / 687 / 2784
- Avg right basic / DOT / heal / shield: 553 / 0 / 1480 / 3884

### `ironWall` into `lightningTempo`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 28.8s
- Avg left basic / DOT / heal / shield: 959 / 0 / 392 / 1060
- Avg right basic / DOT / heal / shield: 442 / 0 / 0 / 0

### `ironWall` into `martyrFrontline`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 41.3s
- Avg left basic / DOT / heal / shield: 874 / 0 / 348 / 1125
- Avg right basic / DOT / heal / shield: 634 / 265 / 203 / 512

### `ironWall` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 37.7s
- Avg left basic / DOT / heal / shield: 397 / 0 / 436 / 1060
- Avg right basic / DOT / heal / shield: 525 / 740 / 347 / 1236

### `ironWall` into `purgeAttrition`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 35.8s
- Avg left basic / DOT / heal / shield: 525 / 0 / 408 / 1113
- Avg right basic / DOT / heal / shield: 708 / 538 / 432 / 1157

### `ironWall` into `scarletVanguard`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 554 / 0 / 136 / 597
- Avg right basic / DOT / heal / shield: 1126 / 53 / 172 / 125

### `ironWall` into `shadowExecute`

- Win rate: 70% (21/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 39.9s
- Avg left basic / DOT / heal / shield: 711 / 0 / 360 / 1197
- Avg right basic / DOT / heal / shield: 412 / 371 / 0 / 664

### `lightningTempo` into `alchemyChaos`

- Win rate: 50% (15/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 17.2s
- Avg left basic / DOT / heal / shield: 494 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 434 / 326 / 0 / 208

### `lightningTempo` into `bloodRage`

- Win rate: 87% (26/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 799 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 833 / 0 / 242 / 144

### `lightningTempo` into `bulwarkMarks`

- Win rate: 57% (17/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 19.8s
- Avg left basic / DOT / heal / shield: 634 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 668 / 0 / 0 / 185

### `lightningTempo` into `cavalryBreak`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.5s
- Avg left basic / DOT / heal / shield: 700 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 746 / 0 / 168 / 225

### `lightningTempo` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 19.9s
- Avg left basic / DOT / heal / shield: 402 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 1392 / 0 / 371 / 655

### `lightningTempo` into `duelChampion`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 26.7s
- Avg left basic / DOT / heal / shield: 677 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 811 / 0 / 207 / 641

### `lightningTempo` into `fireBurst`

- Win rate: 87% (26/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 13.2s
- Avg left basic / DOT / heal / shield: 601 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 339 / 111 / 0 / 15

### `lightningTempo` into `frostControl`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.7s
- Avg left basic / DOT / heal / shield: 521 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 494 / 186 / 121 / 405

### `lightningTempo` into `frostTrapField`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 438 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 696 / 0 / 21 / 190

### `lightningTempo` into `holySustain`

- Win rate: 93% (28/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 27.0s
- Avg left basic / DOT / heal / shield: 710 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 480 / 0 / 482 / 938

### `lightningTempo` into `ironWall`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 28.8s
- Avg left basic / DOT / heal / shield: 442 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 959 / 0 / 392 / 1060

### `lightningTempo` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.4s
- Avg left basic / DOT / heal / shield: 672 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 452 / 131 / 39 / 140

### `lightningTempo` into `poisonBloom`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 628 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 297 / 430 / 89 / 226

### `lightningTempo` into `purgeAttrition`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.9s
- Avg left basic / DOT / heal / shield: 702 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 461 / 455 / 131 / 242

### `lightningTempo` into `scarletVanguard`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 638 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 638 / 57 / 41 / 74

### `lightningTempo` into `shadowExecute`

- Win rate: 97% (29/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 20.6s
- Avg left basic / DOT / heal / shield: 598 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 310 / 177 / 0 / 354

### `martyrFrontline` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 14.5s
- Avg left basic / DOT / heal / shield: 281 / 98 / 72 / 167
- Avg right basic / DOT / heal / shield: 433 / 297 / 0 / 253

### `martyrFrontline` into `bloodRage`

- Win rate: 7% (2/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 22.6s
- Avg left basic / DOT / heal / shield: 619 / 146 / 38 / 165
- Avg right basic / DOT / heal / shield: 1313 / 0 / 372 / 238

### `martyrFrontline` into `bulwarkMarks`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.4s
- Avg left basic / DOT / heal / shield: 468 / 145 / 111 / 283
- Avg right basic / DOT / heal / shield: 791 / 0 / 0 / 339

### `martyrFrontline` into `cavalryBreak`

- Win rate: 33% (10/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 26.0s
- Avg left basic / DOT / heal / shield: 633 / 142 / 68 / 197
- Avg right basic / DOT / heal / shield: 1111 / 0 / 304 / 322

### `martyrFrontline` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 25.8s
- Avg left basic / DOT / heal / shield: 354 / 202 / 113 / 309
- Avg right basic / DOT / heal / shield: 1480 / 0 / 529 / 1062

### `martyrFrontline` into `duelChampion`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 34.5s
- Avg left basic / DOT / heal / shield: 742 / 237 / 255 / 722
- Avg right basic / DOT / heal / shield: 545 / 0 / 334 / 1088

### `martyrFrontline` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 15.3s
- Avg left basic / DOT / heal / shield: 344 / 167 / 46 / 152
- Avg right basic / DOT / heal / shield: 398 / 209 / 0 / 225

### `martyrFrontline` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 376 / 119 / 152 / 367
- Avg right basic / DOT / heal / shield: 475 / 202 / 275 / 614

### `martyrFrontline` into `frostTrapField`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.0s
- Avg left basic / DOT / heal / shield: 471 / 130 / 104 / 272
- Avg right basic / DOT / heal / shield: 693 / 0 / 99 / 347

### `martyrFrontline` into `holySustain`

- Win rate: 63% (19/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 59.6s
- Avg left basic / DOT / heal / shield: 831 / 365 / 375 / 1054
- Avg right basic / DOT / heal / shield: 604 / 0 / 1007 / 2463

### `martyrFrontline` into `ironWall`

- Win rate: 53% (16/30)
- Expectation: intended favored, actual even, ok
- Avg duration: 41.3s
- Avg left basic / DOT / heal / shield: 634 / 265 / 203 / 512
- Avg right basic / DOT / heal / shield: 874 / 0 / 348 / 1125

### `martyrFrontline` into `lightningTempo`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.4s
- Avg left basic / DOT / heal / shield: 452 / 131 / 39 / 140
- Avg right basic / DOT / heal / shield: 672 / 0 / 0 / 0

### `martyrFrontline` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 373 / 85 / 114 / 267
- Avg right basic / DOT / heal / shield: 407 / 438 / 203 / 573

### `martyrFrontline` into `purgeAttrition`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 27.8s
- Avg left basic / DOT / heal / shield: 635 / 162 / 203 / 446
- Avg right basic / DOT / heal / shield: 607 / 446 / 313 / 439

### `martyrFrontline` into `scarletVanguard`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 465 / 141 / 39 / 142
- Avg right basic / DOT / heal / shield: 1102 / 40 / 115 / 121

### `martyrFrontline` into `shadowExecute`

- Win rate: 37% (11/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.2s
- Avg left basic / DOT / heal / shield: 589 / 107 / 107 / 265
- Avg right basic / DOT / heal / shield: 483 / 342 / 0 / 396

### `poisonBloom` into `alchemyChaos`

- Win rate: 43% (13/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 16.6s
- Avg left basic / DOT / heal / shield: 251 / 354 / 131 / 344
- Avg right basic / DOT / heal / shield: 485 / 266 / 0 / 243

### `poisonBloom` into `bloodRage`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 468 / 382 / 153 / 402
- Avg right basic / DOT / heal / shield: 553 / 0 / 158 / 133

### `poisonBloom` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.4s
- Avg left basic / DOT / heal / shield: 325 / 448 / 158 / 456
- Avg right basic / DOT / heal / shield: 541 / 0 / 0 / 315

### `poisonBloom` into `cavalryBreak`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 452 / 384 / 144 / 390
- Avg right basic / DOT / heal / shield: 815 / 0 / 208 / 212

### `poisonBloom` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 22.2s
- Avg left basic / DOT / heal / shield: 277 / 567 / 170 / 438
- Avg right basic / DOT / heal / shield: 1576 / 0 / 474 / 683

### `poisonBloom` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 29.7s
- Avg left basic / DOT / heal / shield: 482 / 520 / 322 / 1069
- Avg right basic / DOT / heal / shield: 511 / 0 / 343 / 841

### `poisonBloom` into `fireBurst`

- Win rate: 60% (18/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 269 / 412 / 157 / 415
- Avg right basic / DOT / heal / shield: 365 / 183 / 0 / 223

### `poisonBloom` into `frostControl`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 302 / 523 / 234 / 540
- Avg right basic / DOT / heal / shield: 455 / 211 / 171 / 433

### `poisonBloom` into `frostTrapField`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.3s
- Avg left basic / DOT / heal / shield: 351 / 556 / 232 / 492
- Avg right basic / DOT / heal / shield: 518 / 0 / 114 / 308

### `poisonBloom` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 57.3s
- Avg left basic / DOT / heal / shield: 743 / 998 / 162 / 1931
- Avg right basic / DOT / heal / shield: 318 / 0 / 1241 / 2168

### `poisonBloom` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 37.7s
- Avg left basic / DOT / heal / shield: 525 / 740 / 347 / 1236
- Avg right basic / DOT / heal / shield: 397 / 0 / 436 / 1060

### `poisonBloom` into `lightningTempo`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 297 / 430 / 89 / 226
- Avg right basic / DOT / heal / shield: 628 / 0 / 0 / 0

### `poisonBloom` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 407 / 438 / 203 / 573
- Avg right basic / DOT / heal / shield: 373 / 85 / 114 / 267

### `poisonBloom` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.1s
- Avg left basic / DOT / heal / shield: 362 / 461 / 177 / 458
- Avg right basic / DOT / heal / shield: 407 / 410 / 145 / 274

### `poisonBloom` into `scarletVanguard`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 376 / 352 / 114 / 326
- Avg right basic / DOT / heal / shield: 632 / 49 / 48 / 128

### `poisonBloom` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 367 / 380 / 153 / 412
- Avg right basic / DOT / heal / shield: 316 / 229 / 0 / 280

### `purgeAttrition` into `alchemyChaos`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 367 / 310 / 145 / 338
- Avg right basic / DOT / heal / shield: 460 / 303 / 0 / 283

### `purgeAttrition` into `bloodRage`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.5s
- Avg left basic / DOT / heal / shield: 514 / 429 / 94 / 192
- Avg right basic / DOT / heal / shield: 1376 / 0 / 320 / 150

### `purgeAttrition` into `bulwarkMarks`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.6s
- Avg left basic / DOT / heal / shield: 418 / 397 / 172 / 478
- Avg right basic / DOT / heal / shield: 806 / 0 / 0 / 404

### `purgeAttrition` into `cavalryBreak`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.4s
- Avg left basic / DOT / heal / shield: 499 / 482 / 106 / 292
- Avg right basic / DOT / heal / shield: 1080 / 0 / 285 / 332

### `purgeAttrition` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.3s
- Avg left basic / DOT / heal / shield: 255 / 338 / 114 / 297
- Avg right basic / DOT / heal / shield: 1481 / 0 / 366 / 705

### `purgeAttrition` into `duelChampion`

- Win rate: 67% (20/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 49.6s
- Avg left basic / DOT / heal / shield: 677 / 671 / 527 / 1272
- Avg right basic / DOT / heal / shield: 934 / 0 / 561 / 1695

### `purgeAttrition` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 294 / 315 / 131 / 253
- Avg right basic / DOT / heal / shield: 314 / 135 / 0 / 143

### `purgeAttrition` into `frostControl`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.1s
- Avg left basic / DOT / heal / shield: 415 / 410 / 259 / 547
- Avg right basic / DOT / heal / shield: 536 / 247 / 283 / 666

### `purgeAttrition` into `frostTrapField`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.4s
- Avg left basic / DOT / heal / shield: 373 / 367 / 161 / 299
- Avg right basic / DOT / heal / shield: 729 / 0 / 125 / 316

### `purgeAttrition` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 63.8s
- Avg left basic / DOT / heal / shield: 1171 / 792 / 624 / 2209
- Avg right basic / DOT / heal / shield: 378 / 0 / 1265 / 2663

### `purgeAttrition` into `ironWall`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 35.8s
- Avg left basic / DOT / heal / shield: 708 / 538 / 432 / 1157
- Avg right basic / DOT / heal / shield: 525 / 0 / 408 / 1113

### `purgeAttrition` into `lightningTempo`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.9s
- Avg left basic / DOT / heal / shield: 461 / 455 / 131 / 242
- Avg right basic / DOT / heal / shield: 702 / 0 / 0 / 0

### `purgeAttrition` into `martyrFrontline`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 27.8s
- Avg left basic / DOT / heal / shield: 607 / 446 / 313 / 439
- Avg right basic / DOT / heal / shield: 635 / 162 / 203 / 446

### `purgeAttrition` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.1s
- Avg left basic / DOT / heal / shield: 407 / 410 / 145 / 274
- Avg right basic / DOT / heal / shield: 362 / 461 / 177 / 458

### `purgeAttrition` into `scarletVanguard`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.8s
- Avg left basic / DOT / heal / shield: 449 / 344 / 108 / 186
- Avg right basic / DOT / heal / shield: 1068 / 53 / 111 / 118

### `purgeAttrition` into `shadowExecute`

- Win rate: 93% (28/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 574 / 440 / 82 / 422
- Avg right basic / DOT / heal / shield: 393 / 298 / 0 / 404

### `scarletVanguard` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 13.5s
- Avg left basic / DOT / heal / shield: 575 / 29 / 52 / 90
- Avg right basic / DOT / heal / shield: 435 / 262 / 0 / 138

### `scarletVanguard` into `bloodRage`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.8s
- Avg left basic / DOT / heal / shield: 997 / 55 / 66 / 154
- Avg right basic / DOT / heal / shield: 513 / 0 / 153 / 138

### `scarletVanguard` into `bulwarkMarks`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 799 / 91 / 60 / 115
- Avg right basic / DOT / heal / shield: 740 / 0 / 0 / 219

### `scarletVanguard` into `cavalryBreak`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 20.1s
- Avg left basic / DOT / heal / shield: 1073 / 44 / 134 / 150
- Avg right basic / DOT / heal / shield: 1066 / 0 / 273 / 225

### `scarletVanguard` into `crownCarry`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.5s
- Avg left basic / DOT / heal / shield: 1003 / 101 / 109 / 130
- Avg right basic / DOT / heal / shield: 1408 / 0 / 319 / 422

### `scarletVanguard` into `duelChampion`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 27.0s
- Avg left basic / DOT / heal / shield: 824 / 97 / 76 / 197
- Avg right basic / DOT / heal / shield: 791 / 0 / 312 / 755

### `scarletVanguard` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 13.3s
- Avg left basic / DOT / heal / shield: 418 / 46 / 35 / 94
- Avg right basic / DOT / heal / shield: 404 / 102 / 0 / 241

### `scarletVanguard` into `frostControl`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 691 / 53 / 71 / 116
- Avg right basic / DOT / heal / shield: 475 / 166 / 122 / 293

### `scarletVanguard` into `frostTrapField`

- Win rate: 43% (13/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 743 / 56 / 78 / 123
- Avg right basic / DOT / heal / shield: 620 / 0 / 58 / 269

### `scarletVanguard` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 1476 / 64 / 194 / 185
- Avg right basic / DOT / heal / shield: 352 / 0 / 428 / 670

### `scarletVanguard` into `ironWall`

- Win rate: 73% (22/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 1126 / 53 / 172 / 125
- Avg right basic / DOT / heal / shield: 554 / 0 / 136 / 597

### `scarletVanguard` into `lightningTempo`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 638 / 57 / 41 / 74
- Avg right basic / DOT / heal / shield: 638 / 0 / 0 / 0

### `scarletVanguard` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 1102 / 40 / 115 / 121
- Avg right basic / DOT / heal / shield: 465 / 141 / 39 / 142

### `scarletVanguard` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 632 / 49 / 48 / 128
- Avg right basic / DOT / heal / shield: 376 / 352 / 114 / 326

### `scarletVanguard` into `purgeAttrition`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.8s
- Avg left basic / DOT / heal / shield: 1068 / 53 / 111 / 118
- Avg right basic / DOT / heal / shield: 449 / 344 / 108 / 186

### `scarletVanguard` into `shadowExecute`

- Win rate: 30% (9/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.9s
- Avg left basic / DOT / heal / shield: 667 / 49 / 41 / 113
- Avg right basic / DOT / heal / shield: 476 / 219 / 0 / 243

### `shadowExecute` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.6s
- Avg left basic / DOT / heal / shield: 217 / 193 / 0 / 457
- Avg right basic / DOT / heal / shield: 528 / 221 / 0 / 578

### `shadowExecute` into `bloodRage`

- Win rate: 80% (24/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 20.2s
- Avg left basic / DOT / heal / shield: 605 / 225 / 0 / 289
- Avg right basic / DOT / heal / shield: 721 / 0 / 195 / 148

### `shadowExecute` into `bulwarkMarks`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 32.8s
- Avg left basic / DOT / heal / shield: 410 / 278 / 0 / 608
- Avg right basic / DOT / heal / shield: 755 / 0 / 0 / 685

### `shadowExecute` into `cavalryBreak`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.4s
- Avg left basic / DOT / heal / shield: 600 / 280 / 0 / 226
- Avg right basic / DOT / heal / shield: 1278 / 0 / 324 / 275

### `shadowExecute` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 224 / 230 / 0 / 199
- Avg right basic / DOT / heal / shield: 1374 / 0 / 278 / 393

### `shadowExecute` into `duelChampion`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 31.7s
- Avg left basic / DOT / heal / shield: 579 / 306 / 0 / 602
- Avg right basic / DOT / heal / shield: 687 / 0 / 265 / 732

### `shadowExecute` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.6s
- Avg left basic / DOT / heal / shield: 338 / 208 / 0 / 192
- Avg right basic / DOT / heal / shield: 388 / 142 / 0 / 144

### `shadowExecute` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 24.6s
- Avg left basic / DOT / heal / shield: 232 / 222 / 0 / 440
- Avg right basic / DOT / heal / shield: 539 / 155 / 101 / 733

### `shadowExecute` into `frostTrapField`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.5s
- Avg left basic / DOT / heal / shield: 400 / 243 / 0 / 337
- Avg right basic / DOT / heal / shield: 539 / 0 / 28 / 226

### `shadowExecute` into `holySustain`

- Win rate: 47% (14/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 65.4s
- Avg left basic / DOT / heal / shield: 637 / 614 / 0 / 1391
- Avg right basic / DOT / heal / shield: 450 / 0 / 1005 / 2626

### `shadowExecute` into `ironWall`

- Win rate: 30% (9/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 39.9s
- Avg left basic / DOT / heal / shield: 412 / 371 / 0 / 664
- Avg right basic / DOT / heal / shield: 711 / 0 / 360 / 1197

### `shadowExecute` into `lightningTempo`

- Win rate: 3% (1/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 20.6s
- Avg left basic / DOT / heal / shield: 310 / 177 / 0 / 354
- Avg right basic / DOT / heal / shield: 598 / 0 / 0 / 0

### `shadowExecute` into `martyrFrontline`

- Win rate: 63% (19/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.2s
- Avg left basic / DOT / heal / shield: 483 / 342 / 0 / 396
- Avg right basic / DOT / heal / shield: 589 / 107 / 107 / 265

### `shadowExecute` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 316 / 229 / 0 / 280
- Avg right basic / DOT / heal / shield: 367 / 380 / 153 / 412

### `shadowExecute` into `purgeAttrition`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 393 / 298 / 0 / 404
- Avg right basic / DOT / heal / shield: 574 / 440 / 82 / 422

### `shadowExecute` into `scarletVanguard`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.9s
- Avg left basic / DOT / heal / shield: 476 / 219 / 0 / 243
- Avg right basic / DOT / heal / shield: 667 / 49 / 41 / 113

