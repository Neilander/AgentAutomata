# Archetype Matchup Report

Generated with `15` deterministic seeds per side, `30` total games per matchup, from `game_data/combat-sim.js`.

Rates are left preset win rates. Expectation checks ask whether a matchup follows the intended strong/weak/flex contract; ecology health treats 0/100 as expected in low-randomness combat, then checks whether hard counters have answers and whether any preset becomes an all-rounder.

## Win Matrix

| Preset | 炼金异常 | 低血狂怒 | 壁垒猎标 | 王骑破阵 | 王冠核心 | 决斗冠军 | 余烬爆燃 | 霜控拖延 | 霜陷猎场 | 圣盾续航 | 铁壁反击 | 急速节奏 | 殉道前线 | 毒巢滚雪球 | 净化消耗 | 赤血先锋 | 暗影处决 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 炼金异常 | — | 73%! | 100% | 83% | 7% | 97% | 20% | 57% | 47% | 100% | 100% | 53% | 100% | 53%! | 90% | 100% | 100% |
| 低血狂怒 | 27%! | — | 67% | 77% | 3% | 60% | 0% | 3% | 40% | 100% | 77% | 27% | 87% | 10% | 90% | 0% | 30% |
| 壁垒猎标 | 0% | 33% | — | 20% | 0% | 80% | 0% | 0% | 0% | 100% | 93% | 17% | 100% | 3% | 73% | 40% | 43% |
| 王骑破阵 | 17% | 23% | 80% | — | 7% | 87% | 10% | 3% | 20% | 50% | 100% | 10% | 63% | 3% | 97% | 53% | 50% |
| 王冠核心 | 93% | 97% | 100% | 93% | — | 100% | 53%! | 100% | 100% | 100% | 100% | 87% | 100% | 77%! | 100% | 80% | 90% |
| 决斗冠军 | 3% | 40% | 20% | 13% | 0% | — | 0% | 80% | 17% | 7%! | 53% | 7% | 17% | 0% | 33% | 50% | 3% |
| 余烬爆燃 | 80% | 100% | 100% | 90% | 47%! | 100% | — | 93% | 100% | 100% | 100% | 20%! | 100% | 27%! | 100% | 100% | 100%! |
| 霜控拖延 | 43% | 97% | 100% | 97% | 0% | 20% | 7% | — | 73% | 100% | 100% | 77% | 100% | 3% | 93% | 90% | 97%! |
| 霜陷猎场 | 53% | 60% | 100% | 80% | 0% | 83% | 0% | 27% | — | 97% | 97% | 87% | 87% | 3% | 100% | 57% | 70% |
| 圣盾续航 | 0% | 0% | 0% | 50% | 0% | 93% | 0% | 0% | 3% | — | 67% | 3%! | 53% | 0% | 0% | 0% | 27% |
| 铁壁反击 | 0% | 23% | 7% | 0% | 0% | 47% | 0% | 0% | 3% | 33% | — | 100% | 60% | 0% | 0% | 20% | 30% |
| 急速节奏 | 47% | 73% | 83% | 90% | 13% | 93% | 80%! | 23% | 13% | 97%! | 0% | — | 100% | 7% | 87% | 70% | 87%! |
| 殉道前线 | 0% | 13%! | 0% | 37% | 0% | 83% | 0% | 0% | 13% | 47% | 40%! | 0% | — | 0% | 10% | 3% | 7% |
| 毒巢滚雪球 | 47%! | 90% | 97% | 97% | 23%! | 100% | 73%! | 97% | 97% | 100% | 100% | 93% | 100% | — | 100% | 100% | 97% |
| 净化消耗 | 10% | 10% | 27% | 3% | 0% | 67% | 0%! | 7% | 0% | 100% | 100% | 13% | 90% | 0% | — | 7% | 93%! |
| 赤血先锋 | 0% | 100% | 60% | 47% | 20% | 50% | 0% | 10% | 43% | 100% | 80% | 30% | 97% | 0% | 93% | — | 30% |
| 暗影处决 | 0% | 70% | 57% | 50% | 10% | 97% | 0%! | 3% | 30% | 73% | 70% | 13%! | 93% | 3% | 7% | 70% | — |

## Ecology Health

- Result: review.
- Matrix cells checked: 272.
- Absolute outcomes (0% or 100%): 92/272 (34%), recorded as determinism evidence, not an automatic failure.
- Hard counters (<= 10% or >= 90%): 162/272 (60%).
- Soft band (35%-65%): 36/272 (13%).
- Polarization score: 0.73 (0 is all 50/50, 1 is all 0/100).
- Review checks:
  - crownCarry has broad hard advantages but few hard predators (12 prey, 0 predators)
  - fireBurst has broad hard advantages but few hard predators (12 prey, 0 predators)
  - frostControl has broad hard advantages but few hard predators (9 prey, 3 predators)
  - holySustain has many hard predators and almost no hard prey (11 predators, 1 prey)
  - ironWall has many hard predators and almost no hard prey (9 predators, 1 prey)
  - martyrFrontline has many hard predators and almost no hard prey (10 predators, 0 prey)
  - poisonBloom has broad hard advantages but few hard predators (13 prey, 0 predators)

Preset ecology profile:
- `alchemyChaos`: answered; prey 8/16, predators 1/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `bloodRage`: answered; prey 2/16, predators 5/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `bulwarkMarks`: answered; prey 3/16, predators 6/16, extreme advantage tags favored->favored, flex->favored, flex->weak.
- `cavalryBreak`: answered; prey 2/16, predators 5/16, extreme advantage tags favored->favored, flex->favored, flex->weak.
- `crownCarry`: all-rounder-risk; prey 12/16, predators 0/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `duelChampion`: answered; prey 0/16, predators 7/16, extreme advantage tags -.
- `fireBurst`: all-rounder-risk; prey 12/16, predators 0/16, extreme advantage tags favored->favored, favored->weak, flex->favored, flex->weak, weak->favored, weak->weak.
- `frostControl`: all-rounder-risk; prey 9/16, predators 3/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->favored, weak->weak.
- `frostTrapField`: answered; prey 4/16, predators 3/16, extreme advantage tags favored->favored, flex->favored, flex->weak.
- `holySustain`: vulnerable-without-prey; prey 1/16, predators 11/16, extreme advantage tags favored->weak, flex->favored.
- `ironWall`: vulnerable-without-prey; prey 1/16, predators 9/16, extreme advantage tags favored->favored, weak->weak.
- `lightningTempo`: answered; prey 4/16, predators 2/16, extreme advantage tags favored->weak, flex->favored, flex->weak, weak->favored.
- `martyrFrontline`: vulnerable-without-prey; prey 0/16, predators 10/16, extreme advantage tags -.
- `poisonBloom`: all-rounder-risk; prey 13/16, predators 0/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `purgeAttrition`: niche-under-pressure; prey 4/16, predators 9/16, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->favored.
- `scarletVanguard`: answered; prey 4/16, predators 4/16, extreme advantage tags flex->favored, flex->weak.
- `shadowExecute`: answered; prey 2/16, predators 6/16, extreme advantage tags flex->favored, flex->weak, weak->weak.

Most polarized ordered matchups:
- `alchemyChaos` vs `bulwarkMarks`: 100% (flex/favored)
- `alchemyChaos` vs `holySustain`: 100% (flex/favored)
- `alchemyChaos` vs `ironWall`: 100% (favored/favored)
- `alchemyChaos` vs `martyrFrontline`: 100% (flex/favored)
- `alchemyChaos` vs `scarletVanguard`: 100% (flex/favored)
- `alchemyChaos` vs `shadowExecute`: 100% (flex/favored)
- `bloodRage` vs `fireBurst`: 0% (weak/weak)
- `bloodRage` vs `holySustain`: 100% (favored/favored)
- `bloodRage` vs `scarletVanguard`: 0% (flex/weak)
- `bulwarkMarks` vs `alchemyChaos`: 0% (flex/weak)
- `bulwarkMarks` vs `crownCarry`: 0% (flex/weak)
- `bulwarkMarks` vs `fireBurst`: 0% (weak/weak)

## Expectation Mismatches

- `alchemyChaos` vs `bloodRage`: expected weak, actual favored, rate 73%.
- `alchemyChaos` vs `poisonBloom`: expected weak, actual even, rate 53%.
- `bloodRage` vs `alchemyChaos`: expected favored, actual weak, rate 27%.
- `crownCarry` vs `fireBurst`: expected weak, actual even, rate 53%.
- `crownCarry` vs `poisonBloom`: expected weak, actual favored, rate 77%.
- `duelChampion` vs `holySustain`: expected favored, actual weak, rate 7%.
- `fireBurst` vs `crownCarry`: expected favored, actual even, rate 47%.
- `fireBurst` vs `lightningTempo`: expected favored, actual weak, rate 20%.
- `fireBurst` vs `poisonBloom`: expected favored, actual weak, rate 27%.
- `fireBurst` vs `shadowExecute`: expected weak, actual favored, rate 100%.
- `frostControl` vs `shadowExecute`: expected weak, actual favored, rate 97%.
- `holySustain` vs `lightningTempo`: expected favored, actual weak, rate 3%.
- `lightningTempo` vs `fireBurst`: expected weak, actual favored, rate 80%.
- `lightningTempo` vs `holySustain`: expected weak, actual favored, rate 97%.
- `lightningTempo` vs `shadowExecute`: expected weak, actual favored, rate 87%.
- `martyrFrontline` vs `bloodRage`: expected favored, actual weak, rate 13%.
- `martyrFrontline` vs `ironWall`: expected favored, actual weak, rate 40%.
- `poisonBloom` vs `alchemyChaos`: expected favored, actual even, rate 47%.
- `poisonBloom` vs `crownCarry`: expected favored, actual weak, rate 23%.
- `poisonBloom` vs `fireBurst`: expected weak, actual favored, rate 73%.
- `purgeAttrition` vs `fireBurst`: expected favored, actual weak, rate 0%.
- `purgeAttrition` vs `shadowExecute`: expected weak, actual favored, rate 93%.
- `shadowExecute` vs `fireBurst`: expected favored, actual weak, rate 0%.
- `shadowExecute` vs `lightningTempo`: expected favored, actual weak, rate 13%.

## Pair Details

### `alchemyChaos` into `bloodRage`

- Win rate: 73% (22/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 495 / 294 / 0 / 143
- Avg right basic / DOT / heal / shield: 872 / 0 / 227 / 135

### `alchemyChaos` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.1s
- Avg left basic / DOT / heal / shield: 387 / 298 / 0 / 371
- Avg right basic / DOT / heal / shield: 426 / 0 / 0 / 336

### `alchemyChaos` into `cavalryBreak`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 495 / 318 / 0 / 207
- Avg right basic / DOT / heal / shield: 879 / 0 / 212 / 213

### `alchemyChaos` into `crownCarry`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 301 / 343 / 0 / 203
- Avg right basic / DOT / heal / shield: 1386 / 0 / 344 / 498

### `alchemyChaos` into `duelChampion`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 263 / 285 / 0 / 280
- Avg right basic / DOT / heal / shield: 356 / 0 / 115 / 433

### `alchemyChaos` into `fireBurst`

- Win rate: 20% (6/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.0s
- Avg left basic / DOT / heal / shield: 287 / 265 / 0 / 192
- Avg right basic / DOT / heal / shield: 285 / 139 / 0 / 149

### `alchemyChaos` into `frostControl`

- Win rate: 57% (17/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 31.0s
- Avg left basic / DOT / heal / shield: 464 / 300 / 0 / 614
- Avg right basic / DOT / heal / shield: 351 / 197 / 180 / 761

### `alchemyChaos` into `frostTrapField`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 341 / 319 / 0 / 213
- Avg right basic / DOT / heal / shield: 604 / 0 / 44 / 248

### `alchemyChaos` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 35.0s
- Avg left basic / DOT / heal / shield: 714 / 450 / 0 / 868
- Avg right basic / DOT / heal / shield: 242 / 0 / 710 / 1255

### `alchemyChaos` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 27.9s
- Avg left basic / DOT / heal / shield: 526 / 357 / 0 / 664
- Avg right basic / DOT / heal / shield: 418 / 0 / 317 / 887

### `alchemyChaos` into `lightningTempo`

- Win rate: 53% (16/30)
- Expectation: intended favored, actual even, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 437 / 320 / 0 / 199
- Avg right basic / DOT / heal / shield: 497 / 0 / 0 / 0

### `alchemyChaos` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.6s
- Avg left basic / DOT / heal / shield: 447 / 289 / 0 / 237
- Avg right basic / DOT / heal / shield: 285 / 99 / 73 / 177

### `alchemyChaos` into `poisonBloom`

- Win rate: 53% (16/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 16.7s
- Avg left basic / DOT / heal / shield: 468 / 273 / 0 / 233
- Avg right basic / DOT / heal / shield: 255 / 371 / 133 / 351

### `alchemyChaos` into `purgeAttrition`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.0s
- Avg left basic / DOT / heal / shield: 473 / 319 / 0 / 283
- Avg right basic / DOT / heal / shield: 380 / 323 / 142 / 344

### `alchemyChaos` into `scarletVanguard`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 13.6s
- Avg left basic / DOT / heal / shield: 448 / 260 / 0 / 138
- Avg right basic / DOT / heal / shield: 590 / 34 / 53 / 92

### `alchemyChaos` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 27.4s
- Avg left basic / DOT / heal / shield: 510 / 242 / 0 / 472
- Avg right basic / DOT / heal / shield: 266 / 203 / 0 / 523

### `bloodRage` into `alchemyChaos`

- Win rate: 27% (8/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 872 / 0 / 227 / 135
- Avg right basic / DOT / heal / shield: 495 / 294 / 0 / 143

### `bloodRage` into `bulwarkMarks`

- Win rate: 67% (20/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.9s
- Avg left basic / DOT / heal / shield: 1192 / 0 / 386 / 213
- Avg right basic / DOT / heal / shield: 860 / 0 / 0 / 228

### `bloodRage` into `cavalryBreak`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 1472 / 0 / 449 / 177
- Avg right basic / DOT / heal / shield: 1134 / 0 / 327 / 257

### `bloodRage` into `crownCarry`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 24.3s
- Avg left basic / DOT / heal / shield: 995 / 0 / 373 / 230
- Avg right basic / DOT / heal / shield: 1739 / 0 / 323 / 482

### `bloodRage` into `duelChampion`

- Win rate: 60% (18/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 27.1s
- Avg left basic / DOT / heal / shield: 1108 / 0 / 413 / 236
- Avg right basic / DOT / heal / shield: 832 / 0 / 217 / 604

### `bloodRage` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.7s
- Avg left basic / DOT / heal / shield: 368 / 0 / 148 / 128
- Avg right basic / DOT / heal / shield: 482 / 120 / 0 / 248

### `bloodRage` into `frostControl`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 861 / 0 / 296 / 140
- Avg right basic / DOT / heal / shield: 613 / 220 / 152 / 354

### `bloodRage` into `frostTrapField`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 917 / 0 / 331 / 167
- Avg right basic / DOT / heal / shield: 768 / 0 / 62 / 338

### `bloodRage` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 1547 / 0 / 505 / 353
- Avg right basic / DOT / heal / shield: 441 / 0 / 442 / 744

### `bloodRage` into `ironWall`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.9s
- Avg left basic / DOT / heal / shield: 1316 / 0 / 408 / 172
- Avg right basic / DOT / heal / shield: 638 / 0 / 158 / 611

### `bloodRage` into `lightningTempo`

- Win rate: 27% (8/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.6s
- Avg left basic / DOT / heal / shield: 900 / 0 / 263 / 143
- Avg right basic / DOT / heal / shield: 756 / 0 / 0 / 0

### `bloodRage` into `martyrFrontline`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.8s
- Avg left basic / DOT / heal / shield: 1374 / 0 / 389 / 248
- Avg right basic / DOT / heal / shield: 636 / 161 / 38 / 165

### `bloodRage` into `poisonBloom`

- Win rate: 10% (3/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 649 / 0 / 173 / 135
- Avg right basic / DOT / heal / shield: 459 / 396 / 149 / 393

### `bloodRage` into `purgeAttrition`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 1361 / 0 / 334 / 164
- Avg right basic / DOT / heal / shield: 533 / 439 / 95 / 210

### `bloodRage` into `scarletVanguard`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.8s
- Avg left basic / DOT / heal / shield: 465 / 0 / 124 / 106
- Avg right basic / DOT / heal / shield: 1030 / 40 / 84 / 155

### `bloodRage` into `shadowExecute`

- Win rate: 30% (9/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.1s
- Avg left basic / DOT / heal / shield: 828 / 0 / 226 / 166
- Avg right basic / DOT / heal / shield: 585 / 233 / 0 / 247

### `bulwarkMarks` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.1s
- Avg left basic / DOT / heal / shield: 426 / 0 / 0 / 336
- Avg right basic / DOT / heal / shield: 387 / 298 / 0 / 371

### `bulwarkMarks` into `bloodRage`

- Win rate: 33% (10/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.9s
- Avg left basic / DOT / heal / shield: 860 / 0 / 0 / 228
- Avg right basic / DOT / heal / shield: 1192 / 0 / 386 / 213

### `bulwarkMarks` into `cavalryBreak`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 25.0s
- Avg left basic / DOT / heal / shield: 763 / 0 / 0 / 227
- Avg right basic / DOT / heal / shield: 1073 / 0 / 290 / 316

### `bulwarkMarks` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 385 / 0 / 0 / 215
- Avg right basic / DOT / heal / shield: 1401 / 0 / 354 / 516

### `bulwarkMarks` into `duelChampion`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 29.0s
- Avg left basic / DOT / heal / shield: 821 / 0 / 0 / 431
- Avg right basic / DOT / heal / shield: 659 / 0 / 273 / 745

### `bulwarkMarks` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.8s
- Avg left basic / DOT / heal / shield: 404 / 0 / 0 / 225
- Avg right basic / DOT / heal / shield: 322 / 167 / 0 / 147

### `bulwarkMarks` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 447 / 0 / 0 / 471
- Avg right basic / DOT / heal / shield: 456 / 209 / 233 / 638

### `bulwarkMarks` into `frostTrapField`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.9s
- Avg left basic / DOT / heal / shield: 463 / 0 / 0 / 218
- Avg right basic / DOT / heal / shield: 635 / 0 / 115 / 315

### `bulwarkMarks` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 39.6s
- Avg left basic / DOT / heal / shield: 1080 / 0 / 0 / 1085
- Avg right basic / DOT / heal / shield: 195 / 0 / 552 / 1483

### `bulwarkMarks` into `ironWall`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 32.1s
- Avg left basic / DOT / heal / shield: 914 / 0 / 0 / 902
- Avg right basic / DOT / heal / shield: 495 / 0 / 326 / 1005

### `bulwarkMarks` into `lightningTempo`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.4s
- Avg left basic / DOT / heal / shield: 655 / 0 / 0 / 180
- Avg right basic / DOT / heal / shield: 673 / 0 / 0 / 0

### `bulwarkMarks` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.9s
- Avg left basic / DOT / heal / shield: 795 / 0 / 0 / 354
- Avg right basic / DOT / heal / shield: 476 / 147 / 135 / 319

### `bulwarkMarks` into `poisonBloom`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 19.5s
- Avg left basic / DOT / heal / shield: 583 / 0 / 0 / 279
- Avg right basic / DOT / heal / shield: 335 / 444 / 160 / 428

### `bulwarkMarks` into `purgeAttrition`

- Win rate: 73% (22/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.2s
- Avg left basic / DOT / heal / shield: 798 / 0 / 0 / 404
- Avg right basic / DOT / heal / shield: 421 / 402 / 191 / 450

### `bulwarkMarks` into `scarletVanguard`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.9s
- Avg left basic / DOT / heal / shield: 767 / 0 / 0 / 220
- Avg right basic / DOT / heal / shield: 772 / 96 / 51 / 116

### `bulwarkMarks` into `shadowExecute`

- Win rate: 43% (13/30)
- Expectation: intended weak, actual even, ok
- Avg duration: 32.1s
- Avg left basic / DOT / heal / shield: 675 / 0 / 0 / 568
- Avg right basic / DOT / heal / shield: 452 / 282 / 0 / 623

### `cavalryBreak` into `alchemyChaos`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 879 / 0 / 212 / 213
- Avg right basic / DOT / heal / shield: 495 / 318 / 0 / 207

### `cavalryBreak` into `bloodRage`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 1134 / 0 / 327 / 257
- Avg right basic / DOT / heal / shield: 1472 / 0 / 449 / 177

### `cavalryBreak` into `bulwarkMarks`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 25.0s
- Avg left basic / DOT / heal / shield: 1073 / 0 / 290 / 316
- Avg right basic / DOT / heal / shield: 763 / 0 / 0 / 227

### `cavalryBreak` into `crownCarry`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 26.5s
- Avg left basic / DOT / heal / shield: 1052 / 0 / 300 / 337
- Avg right basic / DOT / heal / shield: 1702 / 0 / 341 / 451

### `cavalryBreak` into `duelChampion`

- Win rate: 87% (26/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 34.8s
- Avg left basic / DOT / heal / shield: 1263 / 0 / 355 / 510
- Avg right basic / DOT / heal / shield: 800 / 0 / 366 / 907

### `cavalryBreak` into `fireBurst`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.3s
- Avg left basic / DOT / heal / shield: 912 / 0 / 220 / 195
- Avg right basic / DOT / heal / shield: 472 / 192 / 0 / 173

### `cavalryBreak` into `frostControl`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.6s
- Avg left basic / DOT / heal / shield: 653 / 0 / 231 / 259
- Avg right basic / DOT / heal / shield: 536 / 244 / 257 / 487

### `cavalryBreak` into `frostTrapField`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.3s
- Avg left basic / DOT / heal / shield: 819 / 0 / 273 / 275
- Avg right basic / DOT / heal / shield: 795 / 0 / 95 / 400

### `cavalryBreak` into `holySustain`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 43.8s
- Avg left basic / DOT / heal / shield: 1323 / 0 / 441 / 616
- Avg right basic / DOT / heal / shield: 782 / 0 / 922 / 1769

### `cavalryBreak` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 29.0s
- Avg left basic / DOT / heal / shield: 1388 / 0 / 414 / 385
- Avg right basic / DOT / heal / shield: 642 / 0 / 223 / 683

### `cavalryBreak` into `lightningTempo`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.6s
- Avg left basic / DOT / heal / shield: 695 / 0 / 153 / 219
- Avg right basic / DOT / heal / shield: 705 / 0 / 0 / 0

### `cavalryBreak` into `martyrFrontline`

- Win rate: 63% (19/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 26.4s
- Avg left basic / DOT / heal / shield: 1093 / 0 / 297 / 322
- Avg right basic / DOT / heal / shield: 647 / 149 / 67 / 198

### `cavalryBreak` into `poisonBloom`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 841 / 0 / 217 / 214
- Avg right basic / DOT / heal / shield: 452 / 384 / 143 / 392

### `cavalryBreak` into `purgeAttrition`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.3s
- Avg left basic / DOT / heal / shield: 1072 / 0 / 273 / 318
- Avg right basic / DOT / heal / shield: 481 / 474 / 102 / 286

### `cavalryBreak` into `scarletVanguard`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 25.6s
- Avg left basic / DOT / heal / shield: 1008 / 0 / 274 / 283
- Avg right basic / DOT / heal / shield: 1105 / 45 / 99 / 172

### `cavalryBreak` into `shadowExecute`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 24.8s
- Avg left basic / DOT / heal / shield: 1225 / 0 / 319 / 277
- Avg right basic / DOT / heal / shield: 604 / 285 / 0 / 228

### `crownCarry` into `alchemyChaos`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 1386 / 0 / 344 / 498
- Avg right basic / DOT / heal / shield: 301 / 343 / 0 / 203

### `crownCarry` into `bloodRage`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 24.3s
- Avg left basic / DOT / heal / shield: 1739 / 0 / 323 / 482
- Avg right basic / DOT / heal / shield: 995 / 0 / 373 / 230

### `crownCarry` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 1401 / 0 / 354 / 516
- Avg right basic / DOT / heal / shield: 385 / 0 / 0 / 215

### `crownCarry` into `cavalryBreak`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 26.5s
- Avg left basic / DOT / heal / shield: 1702 / 0 / 341 / 451
- Avg right basic / DOT / heal / shield: 1052 / 0 / 300 / 337

### `crownCarry` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 31.7s
- Avg left basic / DOT / heal / shield: 1661 / 0 / 469 / 1411
- Avg right basic / DOT / heal / shield: 263 / 0 / 294 / 779

### `crownCarry` into `fireBurst`

- Win rate: 53% (16/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 1256 / 0 / 305 / 427
- Avg right basic / DOT / heal / shield: 280 / 329 / 0 / 142

### `crownCarry` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 1454 / 0 / 412 / 688
- Avg right basic / DOT / heal / shield: 287 / 256 / 133 / 347

### `crownCarry` into `frostTrapField`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.1s
- Avg left basic / DOT / heal / shield: 1426 / 0 / 371 / 610
- Avg right basic / DOT / heal / shield: 342 / 0 / 56 / 280

### `crownCarry` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 55.6s
- Avg left basic / DOT / heal / shield: 2280 / 0 / 457 / 2328
- Avg right basic / DOT / heal / shield: 170 / 0 / 939 / 2187

### `crownCarry` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 28.3s
- Avg left basic / DOT / heal / shield: 1677 / 0 / 537 / 1303
- Avg right basic / DOT / heal / shield: 383 / 0 / 272 / 852

### `crownCarry` into `lightningTempo`

- Win rate: 87% (26/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 1390 / 0 / 326 / 556
- Avg right basic / DOT / heal / shield: 423 / 0 / 0 / 0

### `crownCarry` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 27.5s
- Avg left basic / DOT / heal / shield: 1472 / 0 / 532 / 1019
- Avg right basic / DOT / heal / shield: 385 / 213 / 115 / 315

### `crownCarry` into `poisonBloom`

- Win rate: 77% (23/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 1530 / 0 / 413 / 601
- Avg right basic / DOT / heal / shield: 311 / 560 / 195 / 451

### `crownCarry` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.1s
- Avg left basic / DOT / heal / shield: 1459 / 0 / 341 / 669
- Avg right basic / DOT / heal / shield: 252 / 348 / 107 / 299

### `crownCarry` into `scarletVanguard`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.6s
- Avg left basic / DOT / heal / shield: 1438 / 0 / 336 / 423
- Avg right basic / DOT / heal / shield: 980 / 106 / 104 / 129

### `crownCarry` into `shadowExecute`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 1339 / 0 / 227 / 423
- Avg right basic / DOT / heal / shield: 256 / 226 / 0 / 254

### `duelChampion` into `alchemyChaos`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.9s
- Avg left basic / DOT / heal / shield: 356 / 0 / 115 / 433
- Avg right basic / DOT / heal / shield: 263 / 285 / 0 / 280

### `duelChampion` into `bloodRage`

- Win rate: 40% (12/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 27.1s
- Avg left basic / DOT / heal / shield: 832 / 0 / 217 / 604
- Avg right basic / DOT / heal / shield: 1108 / 0 / 413 / 236

### `duelChampion` into `bulwarkMarks`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 29.0s
- Avg left basic / DOT / heal / shield: 659 / 0 / 273 / 745
- Avg right basic / DOT / heal / shield: 821 / 0 / 0 / 431

### `duelChampion` into `cavalryBreak`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 34.8s
- Avg left basic / DOT / heal / shield: 800 / 0 / 366 / 907
- Avg right basic / DOT / heal / shield: 1263 / 0 / 355 / 510

### `duelChampion` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 31.7s
- Avg left basic / DOT / heal / shield: 263 / 0 / 294 / 779
- Avg right basic / DOT / heal / shield: 1661 / 0 / 469 / 1411

### `duelChampion` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 34.2s
- Avg left basic / DOT / heal / shield: 308 / 0 / 386 / 1284
- Avg right basic / DOT / heal / shield: 436 / 214 / 0 / 748

### `duelChampion` into `frostControl`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 63.4s
- Avg left basic / DOT / heal / shield: 1209 / 0 / 905 / 2964
- Avg right basic / DOT / heal / shield: 437 / 342 / 545 / 1747

### `duelChampion` into `frostTrapField`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 36.3s
- Avg left basic / DOT / heal / shield: 512 / 0 / 420 / 1160
- Avg right basic / DOT / heal / shield: 739 / 0 / 94 / 589

### `duelChampion` into `holySustain`

- Win rate: 7% (2/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 579 / 0 / 413 / 3440
- Avg right basic / DOT / heal / shield: 255 / 0 / 750 / 4027

### `duelChampion` into `ironWall`

- Win rate: 53% (16/30)
- Expectation: intended favored, actual even, ok
- Avg duration: 61.3s
- Avg left basic / DOT / heal / shield: 1062 / 0 / 527 / 2469
- Avg right basic / DOT / heal / shield: 709 / 0 / 610 / 1720

### `duelChampion` into `lightningTempo`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 25.4s
- Avg left basic / DOT / heal / shield: 725 / 0 / 213 / 592
- Avg right basic / DOT / heal / shield: 735 / 0 / 0 / 0

### `duelChampion` into `martyrFrontline`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 35.9s
- Avg left basic / DOT / heal / shield: 625 / 0 / 335 / 1194
- Avg right basic / DOT / heal / shield: 670 / 229 / 235 / 666

### `duelChampion` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 29.9s
- Avg left basic / DOT / heal / shield: 508 / 0 / 343 / 920
- Avg right basic / DOT / heal / shield: 430 / 585 / 314 / 1074

### `duelChampion` into `purgeAttrition`

- Win rate: 33% (10/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 47.4s
- Avg left basic / DOT / heal / shield: 947 / 0 / 557 / 1616
- Avg right basic / DOT / heal / shield: 649 / 645 / 507 / 1165

### `duelChampion` into `scarletVanguard`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 24.9s
- Avg left basic / DOT / heal / shield: 708 / 0 / 282 / 675
- Avg right basic / DOT / heal / shield: 870 / 85 / 92 / 190

### `duelChampion` into `shadowExecute`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 31.9s
- Avg left basic / DOT / heal / shield: 635 / 0 / 284 / 739
- Avg right basic / DOT / heal / shield: 635 / 301 / 0 / 674

### `fireBurst` into `alchemyChaos`

- Win rate: 80% (24/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 14.0s
- Avg left basic / DOT / heal / shield: 285 / 139 / 0 / 149
- Avg right basic / DOT / heal / shield: 287 / 265 / 0 / 192

### `fireBurst` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 14.7s
- Avg left basic / DOT / heal / shield: 482 / 120 / 0 / 248
- Avg right basic / DOT / heal / shield: 368 / 0 / 148 / 128

### `fireBurst` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.8s
- Avg left basic / DOT / heal / shield: 322 / 167 / 0 / 147
- Avg right basic / DOT / heal / shield: 404 / 0 / 0 / 225

### `fireBurst` into `cavalryBreak`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.3s
- Avg left basic / DOT / heal / shield: 472 / 192 / 0 / 173
- Avg right basic / DOT / heal / shield: 912 / 0 / 220 / 195

### `fireBurst` into `crownCarry`

- Win rate: 47% (14/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 280 / 329 / 0 / 142
- Avg right basic / DOT / heal / shield: 1256 / 0 / 305 / 427

### `fireBurst` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 34.2s
- Avg left basic / DOT / heal / shield: 436 / 214 / 0 / 748
- Avg right basic / DOT / heal / shield: 308 / 0 / 386 / 1284

### `fireBurst` into `frostControl`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 17.0s
- Avg left basic / DOT / heal / shield: 290 / 163 / 0 / 147
- Avg right basic / DOT / heal / shield: 291 / 212 / 92 / 303

### `fireBurst` into `frostTrapField`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 365 / 117 / 0 / 158
- Avg right basic / DOT / heal / shield: 355 / 0 / 35 / 241

### `fireBurst` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 469 / 323 / 0 / 526
- Avg right basic / DOT / heal / shield: 252 / 0 / 570 / 844

### `fireBurst` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.4s
- Avg left basic / DOT / heal / shield: 353 / 229 / 0 / 235
- Avg right basic / DOT / heal / shield: 367 / 0 / 166 / 592

### `fireBurst` into `lightningTempo`

- Win rate: 20% (6/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 13.5s
- Avg left basic / DOT / heal / shield: 332 / 127 / 0 / 20
- Avg right basic / DOT / heal / shield: 607 / 0 / 0 / 0

### `fireBurst` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.4s
- Avg left basic / DOT / heal / shield: 423 / 183 / 0 / 237
- Avg right basic / DOT / heal / shield: 357 / 174 / 45 / 152

### `fireBurst` into `poisonBloom`

- Win rate: 27% (8/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 308 / 138 / 0 / 241
- Avg right basic / DOT / heal / shield: 207 / 392 / 154 / 404

### `fireBurst` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.2s
- Avg left basic / DOT / heal / shield: 309 / 140 / 0 / 145
- Avg right basic / DOT / heal / shield: 289 / 313 / 127 / 254

### `fireBurst` into `scarletVanguard`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 13.4s
- Avg left basic / DOT / heal / shield: 437 / 87 / 0 / 252
- Avg right basic / DOT / heal / shield: 399 / 44 / 33 / 88

### `fireBurst` into `shadowExecute`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 15.3s
- Avg left basic / DOT / heal / shield: 393 / 146 / 0 / 143
- Avg right basic / DOT / heal / shield: 335 / 203 / 0 / 188

### `frostControl` into `alchemyChaos`

- Win rate: 43% (13/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 31.0s
- Avg left basic / DOT / heal / shield: 351 / 197 / 180 / 761
- Avg right basic / DOT / heal / shield: 464 / 300 / 0 / 614

### `frostControl` into `bloodRage`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 613 / 220 / 152 / 354
- Avg right basic / DOT / heal / shield: 861 / 0 / 296 / 140

### `frostControl` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 456 / 209 / 233 / 638
- Avg right basic / DOT / heal / shield: 447 / 0 / 0 / 471

### `frostControl` into `cavalryBreak`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 22.6s
- Avg left basic / DOT / heal / shield: 536 / 244 / 257 / 487
- Avg right basic / DOT / heal / shield: 653 / 0 / 231 / 259

### `frostControl` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 287 / 256 / 133 / 347
- Avg right basic / DOT / heal / shield: 1454 / 0 / 412 / 688

### `frostControl` into `duelChampion`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 63.4s
- Avg left basic / DOT / heal / shield: 437 / 342 / 545 / 1747
- Avg right basic / DOT / heal / shield: 1209 / 0 / 905 / 2964

### `frostControl` into `fireBurst`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.0s
- Avg left basic / DOT / heal / shield: 291 / 212 / 92 / 303
- Avg right basic / DOT / heal / shield: 290 / 163 / 0 / 147

### `frostControl` into `frostTrapField`

- Win rate: 73% (22/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 393 / 189 / 171 / 396
- Avg right basic / DOT / heal / shield: 520 / 0 / 75 / 291

### `frostControl` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 1035 / 323 / 535 / 2760
- Avg right basic / DOT / heal / shield: 331 / 0 / 1828 / 3709

### `frostControl` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 49.3s
- Avg left basic / DOT / heal / shield: 742 / 248 / 492 / 1657
- Avg right basic / DOT / heal / shield: 370 / 0 / 616 / 1466

### `frostControl` into `lightningTempo`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.7s
- Avg left basic / DOT / heal / shield: 489 / 192 / 112 / 405
- Avg right basic / DOT / heal / shield: 520 / 0 / 0 / 0

### `frostControl` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 24.1s
- Avg left basic / DOT / heal / shield: 493 / 205 / 299 / 638
- Avg right basic / DOT / heal / shield: 391 / 120 / 161 / 377

### `frostControl` into `poisonBloom`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 20.0s
- Avg left basic / DOT / heal / shield: 437 / 208 / 135 / 411
- Avg right basic / DOT / heal / shield: 281 / 449 / 214 / 468

### `frostControl` into `purgeAttrition`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 521 / 260 / 251 / 654
- Avg right basic / DOT / heal / shield: 416 / 425 / 240 / 525

### `frostControl` into `scarletVanguard`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 467 / 184 / 116 / 282
- Avg right basic / DOT / heal / shield: 711 / 53 / 70 / 115

### `frostControl` into `shadowExecute`

- Win rate: 97% (29/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 34.0s
- Avg left basic / DOT / heal / shield: 534 / 162 / 30 / 734
- Avg right basic / DOT / heal / shield: 250 / 227 / 0 / 614

### `frostTrapField` into `alchemyChaos`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 604 / 0 / 44 / 248
- Avg right basic / DOT / heal / shield: 341 / 319 / 0 / 213

### `frostTrapField` into `bloodRage`

- Win rate: 60% (18/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 768 / 0 / 62 / 338
- Avg right basic / DOT / heal / shield: 917 / 0 / 331 / 167

### `frostTrapField` into `bulwarkMarks`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.9s
- Avg left basic / DOT / heal / shield: 635 / 0 / 115 / 315
- Avg right basic / DOT / heal / shield: 463 / 0 / 0 / 218

### `frostTrapField` into `cavalryBreak`

- Win rate: 80% (24/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.3s
- Avg left basic / DOT / heal / shield: 795 / 0 / 95 / 400
- Avg right basic / DOT / heal / shield: 819 / 0 / 273 / 275

### `frostTrapField` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.1s
- Avg left basic / DOT / heal / shield: 342 / 0 / 56 / 280
- Avg right basic / DOT / heal / shield: 1426 / 0 / 371 / 610

### `frostTrapField` into `duelChampion`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 36.3s
- Avg left basic / DOT / heal / shield: 739 / 0 / 94 / 589
- Avg right basic / DOT / heal / shield: 512 / 0 / 420 / 1160

### `frostTrapField` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 355 / 0 / 35 / 241
- Avg right basic / DOT / heal / shield: 365 / 117 / 0 / 158

### `frostTrapField` into `frostControl`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 520 / 0 / 75 / 291
- Avg right basic / DOT / heal / shield: 393 / 189 / 171 / 396

### `frostTrapField` into `holySustain`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 36.1s
- Avg left basic / DOT / heal / shield: 1073 / 0 / 92 / 627
- Avg right basic / DOT / heal / shield: 249 / 0 / 857 / 1300

### `frostTrapField` into `ironWall`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 27.0s
- Avg left basic / DOT / heal / shield: 759 / 0 / 86 / 516
- Avg right basic / DOT / heal / shield: 351 / 0 / 307 / 818

### `frostTrapField` into `lightningTempo`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.7s
- Avg left basic / DOT / heal / shield: 687 / 0 / 23 / 182
- Avg right basic / DOT / heal / shield: 453 / 0 / 0 / 0

### `frostTrapField` into `martyrFrontline`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 661 / 0 / 100 / 340
- Avg right basic / DOT / heal / shield: 448 / 126 / 103 / 271

### `frostTrapField` into `poisonBloom`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 20.9s
- Avg left basic / DOT / heal / shield: 503 / 0 / 111 / 307
- Avg right basic / DOT / heal / shield: 354 / 516 / 217 / 484

### `frostTrapField` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 725 / 0 / 125 / 317
- Avg right basic / DOT / heal / shield: 372 / 357 / 162 / 297

### `frostTrapField` into `scarletVanguard`

- Win rate: 57% (17/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 611 / 0 / 63 / 272
- Avg right basic / DOT / heal / shield: 741 / 55 / 77 / 126

### `frostTrapField` into `shadowExecute`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 544 / 0 / 43 / 243
- Avg right basic / DOT / heal / shield: 388 / 246 / 0 / 349

### `holySustain` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 35.0s
- Avg left basic / DOT / heal / shield: 242 / 0 / 710 / 1255
- Avg right basic / DOT / heal / shield: 714 / 450 / 0 / 868

### `holySustain` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 441 / 0 / 442 / 744
- Avg right basic / DOT / heal / shield: 1547 / 0 / 505 / 353

### `holySustain` into `bulwarkMarks`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 39.6s
- Avg left basic / DOT / heal / shield: 195 / 0 / 552 / 1483
- Avg right basic / DOT / heal / shield: 1080 / 0 / 0 / 1085

### `holySustain` into `cavalryBreak`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 43.8s
- Avg left basic / DOT / heal / shield: 782 / 0 / 922 / 1769
- Avg right basic / DOT / heal / shield: 1323 / 0 / 441 / 616

### `holySustain` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 55.6s
- Avg left basic / DOT / heal / shield: 170 / 0 / 939 / 2187
- Avg right basic / DOT / heal / shield: 2280 / 0 / 457 / 2328

### `holySustain` into `duelChampion`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 255 / 0 / 750 / 4027
- Avg right basic / DOT / heal / shield: 579 / 0 / 413 / 3440

### `holySustain` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 252 / 0 / 570 / 844
- Avg right basic / DOT / heal / shield: 469 / 323 / 0 / 526

### `holySustain` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 331 / 0 / 1828 / 3709
- Avg right basic / DOT / heal / shield: 1035 / 323 / 535 / 2760

### `holySustain` into `frostTrapField`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 36.1s
- Avg left basic / DOT / heal / shield: 249 / 0 / 857 / 1300
- Avg right basic / DOT / heal / shield: 1073 / 0 / 92 / 627

### `holySustain` into `ironWall`

- Win rate: 67% (20/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 568 / 0 / 1499 / 3909
- Avg right basic / DOT / heal / shield: 1013 / 0 / 676 / 2764

### `holySustain` into `lightningTempo`

- Win rate: 3% (1/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 27.2s
- Avg left basic / DOT / heal / shield: 473 / 0 / 491 / 925
- Avg right basic / DOT / heal / shield: 751 / 0 / 0 / 0

### `holySustain` into `martyrFrontline`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 53.2s
- Avg left basic / DOT / heal / shield: 664 / 0 / 865 / 2291
- Avg right basic / DOT / heal / shield: 720 / 299 / 303 / 866

### `holySustain` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 58.4s
- Avg left basic / DOT / heal / shield: 318 / 0 / 1288 / 2305
- Avg right basic / DOT / heal / shield: 719 / 960 / 183 / 1975

### `holySustain` into `purgeAttrition`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 65.6s
- Avg left basic / DOT / heal / shield: 383 / 0 / 1301 / 2760
- Avg right basic / DOT / heal / shield: 1181 / 809 / 620 / 2180

### `holySustain` into `scarletVanguard`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 357 / 0 / 434 / 677
- Avg right basic / DOT / heal / shield: 1501 / 64 / 201 / 178

### `holySustain` into `shadowExecute`

- Win rate: 27% (8/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 54.6s
- Avg left basic / DOT / heal / shield: 449 / 0 / 716 / 1968
- Avg right basic / DOT / heal / shield: 620 / 479 / 0 / 1145

### `ironWall` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 27.9s
- Avg left basic / DOT / heal / shield: 418 / 0 / 317 / 887
- Avg right basic / DOT / heal / shield: 526 / 357 / 0 / 664

### `ironWall` into `bloodRage`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.9s
- Avg left basic / DOT / heal / shield: 638 / 0 / 158 / 611
- Avg right basic / DOT / heal / shield: 1316 / 0 / 408 / 172

### `ironWall` into `bulwarkMarks`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 32.1s
- Avg left basic / DOT / heal / shield: 495 / 0 / 326 / 1005
- Avg right basic / DOT / heal / shield: 914 / 0 / 0 / 902

### `ironWall` into `cavalryBreak`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 29.0s
- Avg left basic / DOT / heal / shield: 642 / 0 / 223 / 683
- Avg right basic / DOT / heal / shield: 1388 / 0 / 414 / 385

### `ironWall` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 28.3s
- Avg left basic / DOT / heal / shield: 383 / 0 / 272 / 852
- Avg right basic / DOT / heal / shield: 1677 / 0 / 537 / 1303

### `ironWall` into `duelChampion`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 61.3s
- Avg left basic / DOT / heal / shield: 709 / 0 / 610 / 1720
- Avg right basic / DOT / heal / shield: 1062 / 0 / 527 / 2469

### `ironWall` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.4s
- Avg left basic / DOT / heal / shield: 367 / 0 / 166 / 592
- Avg right basic / DOT / heal / shield: 353 / 229 / 0 / 235

### `ironWall` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 49.3s
- Avg left basic / DOT / heal / shield: 370 / 0 / 616 / 1466
- Avg right basic / DOT / heal / shield: 742 / 248 / 492 / 1657

### `ironWall` into `frostTrapField`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 27.0s
- Avg left basic / DOT / heal / shield: 351 / 0 / 307 / 818
- Avg right basic / DOT / heal / shield: 759 / 0 / 86 / 516

### `ironWall` into `holySustain`

- Win rate: 33% (10/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 1013 / 0 / 676 / 2764
- Avg right basic / DOT / heal / shield: 568 / 0 / 1499 / 3909

### `ironWall` into `lightningTempo`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 28.4s
- Avg left basic / DOT / heal / shield: 970 / 0 / 379 / 1035
- Avg right basic / DOT / heal / shield: 428 / 0 / 0 / 0

### `ironWall` into `martyrFrontline`

- Win rate: 60% (18/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 39.4s
- Avg left basic / DOT / heal / shield: 850 / 0 / 339 / 1081
- Avg right basic / DOT / heal / shield: 601 / 253 / 193 / 486

### `ironWall` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 38.6s
- Avg left basic / DOT / heal / shield: 391 / 0 / 439 / 1095
- Avg right basic / DOT / heal / shield: 528 / 742 / 338 / 1272

### `ironWall` into `purgeAttrition`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 37.1s
- Avg left basic / DOT / heal / shield: 511 / 0 / 415 / 1139
- Avg right basic / DOT / heal / shield: 740 / 543 / 449 / 1241

### `ironWall` into `scarletVanguard`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.2s
- Avg left basic / DOT / heal / shield: 561 / 0 / 141 / 588
- Avg right basic / DOT / heal / shield: 1213 / 54 / 173 / 129

### `ironWall` into `shadowExecute`

- Win rate: 30% (9/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 52.2s
- Avg left basic / DOT / heal / shield: 580 / 0 / 415 / 1221
- Avg right basic / DOT / heal / shield: 595 / 473 / 0 / 962

### `lightningTempo` into `alchemyChaos`

- Win rate: 47% (14/30)
- Expectation: intended weak, actual even, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 497 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 437 / 320 / 0 / 199

### `lightningTempo` into `bloodRage`

- Win rate: 73% (22/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.6s
- Avg left basic / DOT / heal / shield: 756 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 900 / 0 / 263 / 143

### `lightningTempo` into `bulwarkMarks`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.4s
- Avg left basic / DOT / heal / shield: 673 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 655 / 0 / 0 / 180

### `lightningTempo` into `cavalryBreak`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.6s
- Avg left basic / DOT / heal / shield: 705 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 695 / 0 / 153 / 219

### `lightningTempo` into `crownCarry`

- Win rate: 13% (4/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 423 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 1390 / 0 / 326 / 556

### `lightningTempo` into `duelChampion`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 25.4s
- Avg left basic / DOT / heal / shield: 735 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 725 / 0 / 213 / 592

### `lightningTempo` into `fireBurst`

- Win rate: 80% (24/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 13.5s
- Avg left basic / DOT / heal / shield: 607 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 332 / 127 / 0 / 20

### `lightningTempo` into `frostControl`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.7s
- Avg left basic / DOT / heal / shield: 520 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 489 / 192 / 112 / 405

### `lightningTempo` into `frostTrapField`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.7s
- Avg left basic / DOT / heal / shield: 453 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 687 / 0 / 23 / 182

### `lightningTempo` into `holySustain`

- Win rate: 97% (29/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 27.2s
- Avg left basic / DOT / heal / shield: 751 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 473 / 0 / 491 / 925

### `lightningTempo` into `ironWall`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 28.4s
- Avg left basic / DOT / heal / shield: 428 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 970 / 0 / 379 / 1035

### `lightningTempo` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.3s
- Avg left basic / DOT / heal / shield: 665 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 446 / 134 / 38 / 139

### `lightningTempo` into `poisonBloom`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 15.3s
- Avg left basic / DOT / heal / shield: 619 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 303 / 407 / 98 / 236

### `lightningTempo` into `purgeAttrition`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.9s
- Avg left basic / DOT / heal / shield: 709 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 466 / 475 / 131 / 239

### `lightningTempo` into `scarletVanguard`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.8s
- Avg left basic / DOT / heal / shield: 634 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 645 / 60 / 43 / 74

### `lightningTempo` into `shadowExecute`

- Win rate: 87% (26/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 22.4s
- Avg left basic / DOT / heal / shield: 623 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 357 / 206 / 0 / 390

### `martyrFrontline` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 14.6s
- Avg left basic / DOT / heal / shield: 285 / 99 / 73 / 177
- Avg right basic / DOT / heal / shield: 447 / 289 / 0 / 237

### `martyrFrontline` into `bloodRage`

- Win rate: 13% (4/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 23.8s
- Avg left basic / DOT / heal / shield: 636 / 161 / 38 / 165
- Avg right basic / DOT / heal / shield: 1374 / 0 / 389 / 248

### `martyrFrontline` into `bulwarkMarks`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.9s
- Avg left basic / DOT / heal / shield: 476 / 147 / 135 / 319
- Avg right basic / DOT / heal / shield: 795 / 0 / 0 / 354

### `martyrFrontline` into `cavalryBreak`

- Win rate: 37% (11/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 26.4s
- Avg left basic / DOT / heal / shield: 647 / 149 / 67 / 198
- Avg right basic / DOT / heal / shield: 1093 / 0 / 297 / 322

### `martyrFrontline` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 27.5s
- Avg left basic / DOT / heal / shield: 385 / 213 / 115 / 315
- Avg right basic / DOT / heal / shield: 1472 / 0 / 532 / 1019

### `martyrFrontline` into `duelChampion`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 35.9s
- Avg left basic / DOT / heal / shield: 670 / 229 / 235 / 666
- Avg right basic / DOT / heal / shield: 625 / 0 / 335 / 1194

### `martyrFrontline` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 15.4s
- Avg left basic / DOT / heal / shield: 357 / 174 / 45 / 152
- Avg right basic / DOT / heal / shield: 423 / 183 / 0 / 237

### `martyrFrontline` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.1s
- Avg left basic / DOT / heal / shield: 391 / 120 / 161 / 377
- Avg right basic / DOT / heal / shield: 493 / 205 / 299 / 638

### `martyrFrontline` into `frostTrapField`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.9s
- Avg left basic / DOT / heal / shield: 448 / 126 / 103 / 271
- Avg right basic / DOT / heal / shield: 661 / 0 / 100 / 340

### `martyrFrontline` into `holySustain`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 53.2s
- Avg left basic / DOT / heal / shield: 720 / 299 / 303 / 866
- Avg right basic / DOT / heal / shield: 664 / 0 / 865 / 2291

### `martyrFrontline` into `ironWall`

- Win rate: 40% (12/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 39.4s
- Avg left basic / DOT / heal / shield: 601 / 253 / 193 / 486
- Avg right basic / DOT / heal / shield: 850 / 0 / 339 / 1081

### `martyrFrontline` into `lightningTempo`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.3s
- Avg left basic / DOT / heal / shield: 446 / 134 / 38 / 139
- Avg right basic / DOT / heal / shield: 665 / 0 / 0 / 0

### `martyrFrontline` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 397 / 85 / 105 / 265
- Avg right basic / DOT / heal / shield: 414 / 433 / 202 / 532

### `martyrFrontline` into `purgeAttrition`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 27.8s
- Avg left basic / DOT / heal / shield: 643 / 151 / 202 / 440
- Avg right basic / DOT / heal / shield: 612 / 451 / 312 / 451

### `martyrFrontline` into `scarletVanguard`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 458 / 147 / 39 / 142
- Avg right basic / DOT / heal / shield: 1114 / 44 / 116 / 120

### `martyrFrontline` into `shadowExecute`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 26.3s
- Avg left basic / DOT / heal / shield: 532 / 93 / 122 / 303
- Avg right basic / DOT / heal / shield: 513 / 341 / 0 / 547

### `poisonBloom` into `alchemyChaos`

- Win rate: 47% (14/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 16.7s
- Avg left basic / DOT / heal / shield: 255 / 371 / 133 / 351
- Avg right basic / DOT / heal / shield: 468 / 273 / 0 / 233

### `poisonBloom` into `bloodRage`

- Win rate: 90% (27/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 459 / 396 / 149 / 393
- Avg right basic / DOT / heal / shield: 649 / 0 / 173 / 135

### `poisonBloom` into `bulwarkMarks`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.5s
- Avg left basic / DOT / heal / shield: 335 / 444 / 160 / 428
- Avg right basic / DOT / heal / shield: 583 / 0 / 0 / 279

### `poisonBloom` into `cavalryBreak`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 452 / 384 / 143 / 392
- Avg right basic / DOT / heal / shield: 841 / 0 / 217 / 214

### `poisonBloom` into `crownCarry`

- Win rate: 23% (7/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 311 / 560 / 195 / 451
- Avg right basic / DOT / heal / shield: 1530 / 0 / 413 / 601

### `poisonBloom` into `duelChampion`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 29.9s
- Avg left basic / DOT / heal / shield: 430 / 585 / 314 / 1074
- Avg right basic / DOT / heal / shield: 508 / 0 / 343 / 920

### `poisonBloom` into `fireBurst`

- Win rate: 73% (22/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 207 / 392 / 154 / 404
- Avg right basic / DOT / heal / shield: 308 / 138 / 0 / 241

### `poisonBloom` into `frostControl`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 20.0s
- Avg left basic / DOT / heal / shield: 281 / 449 / 214 / 468
- Avg right basic / DOT / heal / shield: 437 / 208 / 135 / 411

### `poisonBloom` into `frostTrapField`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.9s
- Avg left basic / DOT / heal / shield: 354 / 516 / 217 / 484
- Avg right basic / DOT / heal / shield: 503 / 0 / 111 / 307

### `poisonBloom` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 58.4s
- Avg left basic / DOT / heal / shield: 719 / 960 / 183 / 1975
- Avg right basic / DOT / heal / shield: 318 / 0 / 1288 / 2305

### `poisonBloom` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 38.6s
- Avg left basic / DOT / heal / shield: 528 / 742 / 338 / 1272
- Avg right basic / DOT / heal / shield: 391 / 0 / 439 / 1095

### `poisonBloom` into `lightningTempo`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 15.3s
- Avg left basic / DOT / heal / shield: 303 / 407 / 98 / 236
- Avg right basic / DOT / heal / shield: 619 / 0 / 0 / 0

### `poisonBloom` into `martyrFrontline`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 414 / 433 / 202 / 532
- Avg right basic / DOT / heal / shield: 397 / 85 / 105 / 265

### `poisonBloom` into `purgeAttrition`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.5s
- Avg left basic / DOT / heal / shield: 351 / 434 / 166 / 461
- Avg right basic / DOT / heal / shield: 387 / 380 / 127 / 287

### `poisonBloom` into `scarletVanguard`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 377 / 349 / 114 / 360
- Avg right basic / DOT / heal / shield: 542 / 40 / 38 / 126

### `poisonBloom` into `shadowExecute`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.8s
- Avg left basic / DOT / heal / shield: 357 / 444 / 153 / 444
- Avg right basic / DOT / heal / shield: 276 / 240 / 0 / 319

### `purgeAttrition` into `alchemyChaos`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.0s
- Avg left basic / DOT / heal / shield: 380 / 323 / 142 / 344
- Avg right basic / DOT / heal / shield: 473 / 319 / 0 / 283

### `purgeAttrition` into `bloodRage`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 533 / 439 / 95 / 210
- Avg right basic / DOT / heal / shield: 1361 / 0 / 334 / 164

### `purgeAttrition` into `bulwarkMarks`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.2s
- Avg left basic / DOT / heal / shield: 421 / 402 / 191 / 450
- Avg right basic / DOT / heal / shield: 798 / 0 / 0 / 404

### `purgeAttrition` into `cavalryBreak`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 22.3s
- Avg left basic / DOT / heal / shield: 481 / 474 / 102 / 286
- Avg right basic / DOT / heal / shield: 1072 / 0 / 273 / 318

### `purgeAttrition` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.1s
- Avg left basic / DOT / heal / shield: 252 / 348 / 107 / 299
- Avg right basic / DOT / heal / shield: 1459 / 0 / 341 / 669

### `purgeAttrition` into `duelChampion`

- Win rate: 67% (20/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 47.4s
- Avg left basic / DOT / heal / shield: 649 / 645 / 507 / 1165
- Avg right basic / DOT / heal / shield: 947 / 0 / 557 / 1616

### `purgeAttrition` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.2s
- Avg left basic / DOT / heal / shield: 289 / 313 / 127 / 254
- Avg right basic / DOT / heal / shield: 309 / 140 / 0 / 145

### `purgeAttrition` into `frostControl`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 416 / 425 / 240 / 525
- Avg right basic / DOT / heal / shield: 521 / 260 / 251 / 654

### `purgeAttrition` into `frostTrapField`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 372 / 357 / 162 / 297
- Avg right basic / DOT / heal / shield: 725 / 0 / 125 / 317

### `purgeAttrition` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 65.6s
- Avg left basic / DOT / heal / shield: 1181 / 809 / 620 / 2180
- Avg right basic / DOT / heal / shield: 383 / 0 / 1301 / 2760

### `purgeAttrition` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 37.1s
- Avg left basic / DOT / heal / shield: 740 / 543 / 449 / 1241
- Avg right basic / DOT / heal / shield: 511 / 0 / 415 / 1139

### `purgeAttrition` into `lightningTempo`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.9s
- Avg left basic / DOT / heal / shield: 466 / 475 / 131 / 239
- Avg right basic / DOT / heal / shield: 709 / 0 / 0 / 0

### `purgeAttrition` into `martyrFrontline`

- Win rate: 90% (27/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 27.8s
- Avg left basic / DOT / heal / shield: 612 / 451 / 312 / 451
- Avg right basic / DOT / heal / shield: 643 / 151 / 202 / 440

### `purgeAttrition` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.5s
- Avg left basic / DOT / heal / shield: 387 / 380 / 127 / 287
- Avg right basic / DOT / heal / shield: 351 / 434 / 166 / 461

### `purgeAttrition` into `scarletVanguard`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 426 / 339 / 102 / 183
- Avg right basic / DOT / heal / shield: 1087 / 38 / 121 / 115

### `purgeAttrition` into `shadowExecute`

- Win rate: 93% (28/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 554 / 446 / 51 / 452
- Avg right basic / DOT / heal / shield: 348 / 241 / 0 / 435

### `scarletVanguard` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 13.6s
- Avg left basic / DOT / heal / shield: 590 / 34 / 53 / 92
- Avg right basic / DOT / heal / shield: 448 / 260 / 0 / 138

### `scarletVanguard` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.8s
- Avg left basic / DOT / heal / shield: 1030 / 40 / 84 / 155
- Avg right basic / DOT / heal / shield: 465 / 0 / 124 / 106

### `scarletVanguard` into `bulwarkMarks`

- Win rate: 60% (18/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.9s
- Avg left basic / DOT / heal / shield: 772 / 96 / 51 / 116
- Avg right basic / DOT / heal / shield: 767 / 0 / 0 / 220

### `scarletVanguard` into `cavalryBreak`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 25.6s
- Avg left basic / DOT / heal / shield: 1105 / 45 / 99 / 172
- Avg right basic / DOT / heal / shield: 1008 / 0 / 274 / 283

### `scarletVanguard` into `crownCarry`

- Win rate: 20% (6/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.6s
- Avg left basic / DOT / heal / shield: 980 / 106 / 104 / 129
- Avg right basic / DOT / heal / shield: 1438 / 0 / 336 / 423

### `scarletVanguard` into `duelChampion`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 24.9s
- Avg left basic / DOT / heal / shield: 870 / 85 / 92 / 190
- Avg right basic / DOT / heal / shield: 708 / 0 / 282 / 675

### `scarletVanguard` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 13.4s
- Avg left basic / DOT / heal / shield: 399 / 44 / 33 / 88
- Avg right basic / DOT / heal / shield: 437 / 87 / 0 / 252

### `scarletVanguard` into `frostControl`

- Win rate: 10% (3/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 711 / 53 / 70 / 115
- Avg right basic / DOT / heal / shield: 467 / 184 / 116 / 282

### `scarletVanguard` into `frostTrapField`

- Win rate: 43% (13/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 741 / 55 / 77 / 126
- Avg right basic / DOT / heal / shield: 611 / 0 / 63 / 272

### `scarletVanguard` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.8s
- Avg left basic / DOT / heal / shield: 1501 / 64 / 201 / 178
- Avg right basic / DOT / heal / shield: 357 / 0 / 434 / 677

### `scarletVanguard` into `ironWall`

- Win rate: 80% (24/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 20.2s
- Avg left basic / DOT / heal / shield: 1213 / 54 / 173 / 129
- Avg right basic / DOT / heal / shield: 561 / 0 / 141 / 588

### `scarletVanguard` into `lightningTempo`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.8s
- Avg left basic / DOT / heal / shield: 645 / 60 / 43 / 74
- Avg right basic / DOT / heal / shield: 634 / 0 / 0 / 0

### `scarletVanguard` into `martyrFrontline`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.7s
- Avg left basic / DOT / heal / shield: 1114 / 44 / 116 / 120
- Avg right basic / DOT / heal / shield: 458 / 147 / 39 / 142

### `scarletVanguard` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 542 / 40 / 38 / 126
- Avg right basic / DOT / heal / shield: 377 / 349 / 114 / 360

### `scarletVanguard` into `purgeAttrition`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 15.5s
- Avg left basic / DOT / heal / shield: 1087 / 38 / 121 / 115
- Avg right basic / DOT / heal / shield: 426 / 339 / 102 / 183

### `scarletVanguard` into `shadowExecute`

- Win rate: 30% (9/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.1s
- Avg left basic / DOT / heal / shield: 660 / 57 / 41 / 114
- Avg right basic / DOT / heal / shield: 477 / 224 / 0 / 239

### `shadowExecute` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 27.4s
- Avg left basic / DOT / heal / shield: 266 / 203 / 0 / 523
- Avg right basic / DOT / heal / shield: 510 / 242 / 0 / 472

### `shadowExecute` into `bloodRage`

- Win rate: 70% (21/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.1s
- Avg left basic / DOT / heal / shield: 585 / 233 / 0 / 247
- Avg right basic / DOT / heal / shield: 828 / 0 / 226 / 166

### `shadowExecute` into `bulwarkMarks`

- Win rate: 57% (17/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 32.1s
- Avg left basic / DOT / heal / shield: 452 / 282 / 0 / 623
- Avg right basic / DOT / heal / shield: 675 / 0 / 0 / 568

### `shadowExecute` into `cavalryBreak`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 24.8s
- Avg left basic / DOT / heal / shield: 604 / 285 / 0 / 228
- Avg right basic / DOT / heal / shield: 1225 / 0 / 319 / 277

### `shadowExecute` into `crownCarry`

- Win rate: 10% (3/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 256 / 226 / 0 / 254
- Avg right basic / DOT / heal / shield: 1339 / 0 / 227 / 423

### `shadowExecute` into `duelChampion`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 31.9s
- Avg left basic / DOT / heal / shield: 635 / 301 / 0 / 674
- Avg right basic / DOT / heal / shield: 635 / 0 / 284 / 739

### `shadowExecute` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.3s
- Avg left basic / DOT / heal / shield: 335 / 203 / 0 / 188
- Avg right basic / DOT / heal / shield: 393 / 146 / 0 / 143

### `shadowExecute` into `frostControl`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 34.0s
- Avg left basic / DOT / heal / shield: 250 / 227 / 0 / 614
- Avg right basic / DOT / heal / shield: 534 / 162 / 30 / 734

### `shadowExecute` into `frostTrapField`

- Win rate: 30% (9/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 388 / 246 / 0 / 349
- Avg right basic / DOT / heal / shield: 544 / 0 / 43 / 243

### `shadowExecute` into `holySustain`

- Win rate: 73% (22/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 54.6s
- Avg left basic / DOT / heal / shield: 620 / 479 / 0 / 1145
- Avg right basic / DOT / heal / shield: 449 / 0 / 716 / 1968

### `shadowExecute` into `ironWall`

- Win rate: 70% (21/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 52.2s
- Avg left basic / DOT / heal / shield: 595 / 473 / 0 / 962
- Avg right basic / DOT / heal / shield: 580 / 0 / 415 / 1221

### `shadowExecute` into `lightningTempo`

- Win rate: 13% (4/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 22.4s
- Avg left basic / DOT / heal / shield: 357 / 206 / 0 / 390
- Avg right basic / DOT / heal / shield: 623 / 0 / 0 / 0

### `shadowExecute` into `martyrFrontline`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 26.3s
- Avg left basic / DOT / heal / shield: 513 / 341 / 0 / 547
- Avg right basic / DOT / heal / shield: 532 / 93 / 122 / 303

### `shadowExecute` into `poisonBloom`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.8s
- Avg left basic / DOT / heal / shield: 276 / 240 / 0 / 319
- Avg right basic / DOT / heal / shield: 357 / 444 / 153 / 444

### `shadowExecute` into `purgeAttrition`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 348 / 241 / 0 / 435
- Avg right basic / DOT / heal / shield: 554 / 446 / 51 / 452

### `shadowExecute` into `scarletVanguard`

- Win rate: 70% (21/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.1s
- Avg left basic / DOT / heal / shield: 477 / 224 / 0 / 239
- Avg right basic / DOT / heal / shield: 660 / 57 / 41 / 114

