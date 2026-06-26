# Archetype Matchup Report

Generated with `15` deterministic seeds per side, `30` total games per matchup, from `game_data/combat-sim.js`.

Rates are left preset win rates. Expectation checks ask whether a matchup follows the intended strong/weak/flex contract; ecology health treats 0/100 as expected in low-randomness combat, then checks whether hard counters have answers and whether any preset becomes an all-rounder.

## Win Matrix

| Preset | 炼金异常 | 低血狂怒 | 王冠核心 | 余烬爆燃 | 霜控拖延 | 圣盾续航 | 铁壁反击 | 急速节奏 | 毒巢滚雪球 | 暗影处决 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 炼金异常 | — | 20% | 0% | 3% | 53% | 87% | 63% | 40%! | 27% | 87% |
| 低血狂怒 | 80% | — | 7% | 10% | 83% | 100% | 93% | 7% | 17% | 27% |
| 王冠核心 | 100% | 93% | — | 47% | 100% | 100% | 100% | 100% | 63%! | 93% |
| 余烬爆燃 | 97% | 90% | 53% | — | 97% | 93% | 93% | 37%! | 17%! | 83%! |
| 霜控拖延 | 47% | 17% | 0% | 3% | — | 57% | 100% | 27% | 10% | 77%! |
| 圣盾续航 | 13% | 0% | 0% | 7% | 43% | — | 23% | 20%! | 0% | 30% |
| 铁壁反击 | 37% | 7% | 0% | 7% | 0% | 77% | — | 93% | 0% | 47% |
| 急速节奏 | 60%! | 93% | 0% | 63%! | 73% | 80%! | 7% | — | 13% | 70%! |
| 毒巢滚雪球 | 73% | 83% | 37%! | 83%! | 90% | 100% | 100% | 87% | — | 93% |
| 暗影处决 | 13% | 73% | 7% | 17%! | 23% | 70% | 53% | 30%! | 7% | — |

## Ecology Health

- Result: review.
- Matrix cells checked: 90.
- Absolute outcomes (0% or 100%): 18/90 (20%), recorded as determinism evidence, not an automatic failure.
- Hard counters (<= 10% or >= 90%): 42/90 (47%).
- Soft band (35%-65%): 16/90 (18%).
- Polarization score: 0.67 (0 is all 50/50, 1 is all 0/100).
- Review checks:
  - crownCarry has broad hard advantages but few hard predators (7 prey, 0 predators)
  - fireBurst has broad hard advantages but few hard predators (5 prey, 0 predators)
  - ironWall has many hard predators and almost no hard prey (5 predators, 1 prey)

Preset ecology profile:
- `alchemyChaos`: answered; prey 0/9, predators 2/9, extreme advantage tags -.
- `bloodRage`: answered; prey 2/9, predators 3/9, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `crownCarry`: all-rounder-risk; prey 7/9, predators 0/9, extreme advantage tags favored->favored, flex->favored, flex->weak, weak->weak.
- `fireBurst`: all-rounder-risk; prey 5/9, predators 0/9, extreme advantage tags favored->favored, weak->weak.
- `frostControl`: answered; prey 1/9, predators 3/9, extreme advantage tags favored->favored, weak->weak.
- `holySustain`: answered; prey 0/9, predators 4/9, extreme advantage tags -.
- `ironWall`: vulnerable-without-prey; prey 1/9, predators 5/9, extreme advantage tags favored->favored, weak->weak.
- `lightningTempo`: answered; prey 1/9, predators 2/9, extreme advantage tags favored->favored, weak->weak.
- `poisonBloom`: answered; prey 4/9, predators 0/9, extreme advantage tags favored->favored, weak->weak.
- `shadowExecute`: answered; prey 0/9, predators 2/9, extreme advantage tags -.

Most polarized ordered matchups:
- `alchemyChaos` vs `crownCarry`: 0% (flex/weak)
- `bloodRage` vs `holySustain`: 100% (favored/favored)
- `crownCarry` vs `alchemyChaos`: 100% (flex/favored)
- `crownCarry` vs `frostControl`: 100% (favored/favored)
- `crownCarry` vs `holySustain`: 100% (favored/favored)
- `crownCarry` vs `ironWall`: 100% (favored/favored)
- `crownCarry` vs `lightningTempo`: 100% (favored/favored)
- `frostControl` vs `crownCarry`: 0% (weak/weak)
- `frostControl` vs `ironWall`: 100% (favored/favored)
- `holySustain` vs `bloodRage`: 0% (weak/weak)
- `holySustain` vs `crownCarry`: 0% (weak/weak)
- `holySustain` vs `poisonBloom`: 0% (weak/weak)

## Expectation Mismatches

- `alchemyChaos` vs `lightningTempo`: expected favored, actual weak, rate 40%.
- `crownCarry` vs `poisonBloom`: expected weak, actual favored, rate 63%.
- `fireBurst` vs `lightningTempo`: expected favored, actual weak, rate 37%.
- `fireBurst` vs `poisonBloom`: expected favored, actual weak, rate 17%.
- `fireBurst` vs `shadowExecute`: expected weak, actual favored, rate 83%.
- `frostControl` vs `shadowExecute`: expected weak, actual favored, rate 77%.
- `holySustain` vs `lightningTempo`: expected favored, actual weak, rate 20%.
- `lightningTempo` vs `alchemyChaos`: expected weak, actual favored, rate 60%.
- `lightningTempo` vs `fireBurst`: expected weak, actual favored, rate 63%.
- `lightningTempo` vs `holySustain`: expected weak, actual favored, rate 80%.
- `lightningTempo` vs `shadowExecute`: expected weak, actual favored, rate 70%.
- `poisonBloom` vs `crownCarry`: expected favored, actual weak, rate 37%.
- `poisonBloom` vs `fireBurst`: expected weak, actual favored, rate 83%.
- `shadowExecute` vs `fireBurst`: expected favored, actual weak, rate 17%.
- `shadowExecute` vs `lightningTempo`: expected favored, actual weak, rate 30%.

## Pair Details

### `alchemyChaos` into `bloodRage`

- Win rate: 20% (6/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 424 / 310 / 0 / 138
- Avg right basic / DOT / heal / shield: 1219 / 0 / 257 / 147

### `alchemyChaos` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.0s
- Avg left basic / DOT / heal / shield: 264 / 281 / 0 / 151
- Avg right basic / DOT / heal / shield: 1416 / 0 / 316 / 501

### `alchemyChaos` into `fireBurst`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.1s
- Avg left basic / DOT / heal / shield: 259 / 268 / 0 / 182
- Avg right basic / DOT / heal / shield: 325 / 153 / 0 / 148

### `alchemyChaos` into `frostControl`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 31.2s
- Avg left basic / DOT / heal / shield: 460 / 391 / 0 / 611
- Avg right basic / DOT / heal / shield: 390 / 203 / 192 / 791

### `alchemyChaos` into `holySustain`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 47.2s
- Avg left basic / DOT / heal / shield: 731 / 476 / 0 / 1094
- Avg right basic / DOT / heal / shield: 331 / 0 / 957 / 1896

### `alchemyChaos` into `ironWall`

- Win rate: 63% (19/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 36.8s
- Avg left basic / DOT / heal / shield: 516 / 349 / 0 / 672
- Avg right basic / DOT / heal / shield: 679 / 0 / 435 / 1151

### `alchemyChaos` into `lightningTempo`

- Win rate: 40% (12/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 413 / 306 / 0 / 185
- Avg right basic / DOT / heal / shield: 514 / 0 / 0 / 0

### `alchemyChaos` into `poisonBloom`

- Win rate: 27% (8/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.2s
- Avg left basic / DOT / heal / shield: 441 / 269 / 0 / 228
- Avg right basic / DOT / heal / shield: 283 / 393 / 124 / 397

### `alchemyChaos` into `shadowExecute`

- Win rate: 87% (26/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 32.3s
- Avg left basic / DOT / heal / shield: 506 / 251 / 0 / 333
- Avg right basic / DOT / heal / shield: 376 / 216 / 0 / 600

### `bloodRage` into `alchemyChaos`

- Win rate: 80% (24/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 15.7s
- Avg left basic / DOT / heal / shield: 1219 / 0 / 257 / 147
- Avg right basic / DOT / heal / shield: 424 / 310 / 0 / 138

### `bloodRage` into `crownCarry`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 20.9s
- Avg left basic / DOT / heal / shield: 936 / 0 / 266 / 154
- Avg right basic / DOT / heal / shield: 1628 / 0 / 261 / 374

### `bloodRage` into `fireBurst`

- Win rate: 10% (3/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 721 / 0 / 208 / 144
- Avg right basic / DOT / heal / shield: 492 / 158 / 0 / 143

### `bloodRage` into `frostControl`

- Win rate: 83% (25/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.2s
- Avg left basic / DOT / heal / shield: 1187 / 0 / 324 / 180
- Avg right basic / DOT / heal / shield: 475 / 231 / 90 / 272

### `bloodRage` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 22.6s
- Avg left basic / DOT / heal / shield: 1577 / 0 / 405 / 207
- Avg right basic / DOT / heal / shield: 414 / 0 / 408 / 680

### `bloodRage` into `ironWall`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.5s
- Avg left basic / DOT / heal / shield: 1524 / 0 / 439 / 157
- Avg right basic / DOT / heal / shield: 553 / 0 / 117 / 532

### `bloodRage` into `lightningTempo`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 22.0s
- Avg left basic / DOT / heal / shield: 936 / 0 / 248 / 161
- Avg right basic / DOT / heal / shield: 870 / 0 / 0 / 0

### `bloodRage` into `poisonBloom`

- Win rate: 17% (5/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 17.0s
- Avg left basic / DOT / heal / shield: 747 / 0 / 196 / 149
- Avg right basic / DOT / heal / shield: 422 / 369 / 143 / 375

### `bloodRage` into `shadowExecute`

- Win rate: 27% (8/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 723 / 0 / 198 / 151
- Avg right basic / DOT / heal / shield: 558 / 209 / 0 / 277

### `crownCarry` into `alchemyChaos`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.0s
- Avg left basic / DOT / heal / shield: 1416 / 0 / 316 / 501
- Avg right basic / DOT / heal / shield: 264 / 281 / 0 / 151

### `crownCarry` into `bloodRage`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 20.9s
- Avg left basic / DOT / heal / shield: 1628 / 0 / 261 / 374
- Avg right basic / DOT / heal / shield: 936 / 0 / 266 / 154

### `crownCarry` into `fireBurst`

- Win rate: 47% (14/30)
- Expectation: intended weak, actual even, ok
- Avg duration: 18.4s
- Avg left basic / DOT / heal / shield: 1253 / 0 / 302 / 433
- Avg right basic / DOT / heal / shield: 295 / 310 / 0 / 141

### `crownCarry` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 1442 / 0 / 346 / 609
- Avg right basic / DOT / heal / shield: 245 / 242 / 104 / 364

### `crownCarry` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 44.8s
- Avg left basic / DOT / heal / shield: 2218 / 0 / 392 / 1736
- Avg right basic / DOT / heal / shield: 159 / 0 / 834 / 1891

### `crownCarry` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 1562 / 0 / 466 / 997
- Avg right basic / DOT / heal / shield: 375 / 0 / 144 / 682

### `crownCarry` into `lightningTempo`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.2s
- Avg left basic / DOT / heal / shield: 1499 / 0 / 374 / 519
- Avg right basic / DOT / heal / shield: 426 / 0 / 0 / 0

### `crownCarry` into `poisonBloom`

- Win rate: 63% (19/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 1457 / 0 / 302 / 502
- Avg right basic / DOT / heal / shield: 302 / 441 / 173 / 430

### `crownCarry` into `shadowExecute`

- Win rate: 93% (28/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 1403 / 0 / 214 / 388
- Avg right basic / DOT / heal / shield: 287 / 242 / 0 / 215

### `fireBurst` into `alchemyChaos`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 14.1s
- Avg left basic / DOT / heal / shield: 325 / 153 / 0 / 148
- Avg right basic / DOT / heal / shield: 259 / 268 / 0 / 182

### `fireBurst` into `bloodRage`

- Win rate: 90% (27/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 492 / 158 / 0 / 143
- Avg right basic / DOT / heal / shield: 721 / 0 / 208 / 144

### `fireBurst` into `crownCarry`

- Win rate: 53% (16/30)
- Expectation: intended favored, actual even, ok
- Avg duration: 18.4s
- Avg left basic / DOT / heal / shield: 295 / 310 / 0 / 141
- Avg right basic / DOT / heal / shield: 1253 / 0 / 302 / 433

### `fireBurst` into `frostControl`

- Win rate: 97% (29/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 293 / 164 / 0 / 148
- Avg right basic / DOT / heal / shield: 292 / 189 / 102 / 307

### `fireBurst` into `holySustain`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 24.9s
- Avg left basic / DOT / heal / shield: 486 / 368 / 0 / 388
- Avg right basic / DOT / heal / shield: 349 / 0 / 594 / 897

### `fireBurst` into `ironWall`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 19.6s
- Avg left basic / DOT / heal / shield: 375 / 255 / 0 / 212
- Avg right basic / DOT / heal / shield: 479 / 0 / 190 / 623

### `fireBurst` into `lightningTempo`

- Win rate: 37% (11/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 13.2s
- Avg left basic / DOT / heal / shield: 349 / 121 / 0 / 55
- Avg right basic / DOT / heal / shield: 561 / 0 / 0 / 0

### `fireBurst` into `poisonBloom`

- Win rate: 17% (5/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 17.0s
- Avg left basic / DOT / heal / shield: 301 / 168 / 0 / 229
- Avg right basic / DOT / heal / shield: 242 / 380 / 147 / 450

### `fireBurst` into `shadowExecute`

- Win rate: 83% (25/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 15.9s
- Avg left basic / DOT / heal / shield: 391 / 131 / 0 / 145
- Avg right basic / DOT / heal / shield: 359 / 183 / 0 / 188

### `frostControl` into `alchemyChaos`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 31.2s
- Avg left basic / DOT / heal / shield: 390 / 203 / 192 / 791
- Avg right basic / DOT / heal / shield: 460 / 391 / 0 / 611

### `frostControl` into `bloodRage`

- Win rate: 17% (5/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.2s
- Avg left basic / DOT / heal / shield: 475 / 231 / 90 / 272
- Avg right basic / DOT / heal / shield: 1187 / 0 / 324 / 180

### `frostControl` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 20.8s
- Avg left basic / DOT / heal / shield: 245 / 242 / 104 / 364
- Avg right basic / DOT / heal / shield: 1442 / 0 / 346 / 609

### `frostControl` into `fireBurst`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 292 / 189 / 102 / 307
- Avg right basic / DOT / heal / shield: 293 / 164 / 0 / 148

### `frostControl` into `holySustain`

- Win rate: 57% (17/30)
- Expectation: intended favored, actual even, ok
- Avg duration: 74.3s
- Avg left basic / DOT / heal / shield: 807 / 335 / 719 / 2612
- Avg right basic / DOT / heal / shield: 594 / 0 / 1627 / 3896

### `frostControl` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 53.8s
- Avg left basic / DOT / heal / shield: 800 / 283 / 580 / 1974
- Avg right basic / DOT / heal / shield: 462 / 0 / 654 / 1658

### `frostControl` into `lightningTempo`

- Win rate: 27% (8/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.8s
- Avg left basic / DOT / heal / shield: 434 / 180 / 104 / 350
- Avg right basic / DOT / heal / shield: 583 / 0 / 0 / 0

### `frostControl` into `poisonBloom`

- Win rate: 10% (3/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 21.2s
- Avg left basic / DOT / heal / shield: 431 / 196 / 155 / 422
- Avg right basic / DOT / heal / shield: 331 / 445 / 216 / 512

### `frostControl` into `shadowExecute`

- Win rate: 77% (23/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 40.7s
- Avg left basic / DOT / heal / shield: 534 / 191 / 18 / 736
- Avg right basic / DOT / heal / shield: 363 / 255 / 0 / 754

### `holySustain` into `alchemyChaos`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 47.2s
- Avg left basic / DOT / heal / shield: 331 / 0 / 957 / 1896
- Avg right basic / DOT / heal / shield: 731 / 476 / 0 / 1094

### `holySustain` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 22.6s
- Avg left basic / DOT / heal / shield: 414 / 0 / 408 / 680
- Avg right basic / DOT / heal / shield: 1577 / 0 / 405 / 207

### `holySustain` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 44.8s
- Avg left basic / DOT / heal / shield: 159 / 0 / 834 / 1891
- Avg right basic / DOT / heal / shield: 2218 / 0 / 392 / 1736

### `holySustain` into `fireBurst`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 24.9s
- Avg left basic / DOT / heal / shield: 349 / 0 / 594 / 897
- Avg right basic / DOT / heal / shield: 486 / 368 / 0 / 388

### `holySustain` into `frostControl`

- Win rate: 43% (13/30)
- Expectation: intended weak, actual even, ok
- Avg duration: 74.3s
- Avg left basic / DOT / heal / shield: 594 / 0 / 1627 / 3896
- Avg right basic / DOT / heal / shield: 807 / 335 / 719 / 2612

### `holySustain` into `ironWall`

- Win rate: 23% (7/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 477 / 0 / 1626 / 3964
- Avg right basic / DOT / heal / shield: 1228 / 0 / 765 / 2872

### `holySustain` into `lightningTempo`

- Win rate: 20% (6/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 30.8s
- Avg left basic / DOT / heal / shield: 567 / 0 / 615 / 1174
- Avg right basic / DOT / heal / shield: 751 / 0 / 0 / 0

### `holySustain` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 51.1s
- Avg left basic / DOT / heal / shield: 347 / 0 / 1139 / 2184
- Avg right basic / DOT / heal / shield: 614 / 871 / 263 / 1725

### `holySustain` into `shadowExecute`

- Win rate: 30% (9/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 51.7s
- Avg left basic / DOT / heal / shield: 424 / 0 / 801 / 2117
- Avg right basic / DOT / heal / shield: 649 / 475 / 0 / 1093

### `ironWall` into `alchemyChaos`

- Win rate: 37% (11/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 36.8s
- Avg left basic / DOT / heal / shield: 679 / 0 / 435 / 1151
- Avg right basic / DOT / heal / shield: 516 / 349 / 0 / 672

### `ironWall` into `bloodRage`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.5s
- Avg left basic / DOT / heal / shield: 553 / 0 / 117 / 532
- Avg right basic / DOT / heal / shield: 1524 / 0 / 439 / 157

### `ironWall` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 23.6s
- Avg left basic / DOT / heal / shield: 375 / 0 / 144 / 682
- Avg right basic / DOT / heal / shield: 1562 / 0 / 466 / 997

### `ironWall` into `fireBurst`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 19.6s
- Avg left basic / DOT / heal / shield: 479 / 0 / 190 / 623
- Avg right basic / DOT / heal / shield: 375 / 255 / 0 / 212

### `ironWall` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 53.8s
- Avg left basic / DOT / heal / shield: 462 / 0 / 654 / 1658
- Avg right basic / DOT / heal / shield: 800 / 283 / 580 / 1974

### `ironWall` into `holySustain`

- Win rate: 77% (23/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 1228 / 0 / 765 / 2872
- Avg right basic / DOT / heal / shield: 477 / 0 / 1626 / 3964

### `ironWall` into `lightningTempo`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 27.4s
- Avg left basic / DOT / heal / shield: 914 / 0 / 309 / 926
- Avg right basic / DOT / heal / shield: 444 / 0 / 0 / 0

### `ironWall` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 41.1s
- Avg left basic / DOT / heal / shield: 409 / 0 / 470 / 1166
- Avg right basic / DOT / heal / shield: 554 / 711 / 438 / 1379

### `ironWall` into `shadowExecute`

- Win rate: 47% (14/30)
- Expectation: intended weak, actual even, ok
- Avg duration: 45.8s
- Avg left basic / DOT / heal / shield: 664 / 0 / 397 / 1202
- Avg right basic / DOT / heal / shield: 540 / 424 / 0 / 831

### `lightningTempo` into `alchemyChaos`

- Win rate: 60% (18/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 514 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 413 / 306 / 0 / 185

### `lightningTempo` into `bloodRage`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 22.0s
- Avg left basic / DOT / heal / shield: 870 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 936 / 0 / 248 / 161

### `lightningTempo` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.2s
- Avg left basic / DOT / heal / shield: 426 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 1499 / 0 / 374 / 519

### `lightningTempo` into `fireBurst`

- Win rate: 63% (19/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 13.2s
- Avg left basic / DOT / heal / shield: 561 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 349 / 121 / 0 / 55

### `lightningTempo` into `frostControl`

- Win rate: 73% (22/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.8s
- Avg left basic / DOT / heal / shield: 583 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 434 / 180 / 104 / 350

### `lightningTempo` into `holySustain`

- Win rate: 80% (24/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 30.8s
- Avg left basic / DOT / heal / shield: 751 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 567 / 0 / 615 / 1174

### `lightningTempo` into `ironWall`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 27.4s
- Avg left basic / DOT / heal / shield: 444 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 914 / 0 / 309 / 926

### `lightningTempo` into `poisonBloom`

- Win rate: 13% (4/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 15.9s
- Avg left basic / DOT / heal / shield: 664 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 319 / 408 / 98 / 270

### `lightningTempo` into `shadowExecute`

- Win rate: 70% (21/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 20.7s
- Avg left basic / DOT / heal / shield: 663 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 383 / 203 / 0 / 354

### `poisonBloom` into `alchemyChaos`

- Win rate: 73% (22/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 17.2s
- Avg left basic / DOT / heal / shield: 283 / 393 / 124 / 397
- Avg right basic / DOT / heal / shield: 441 / 269 / 0 / 228

### `poisonBloom` into `bloodRage`

- Win rate: 83% (25/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 17.0s
- Avg left basic / DOT / heal / shield: 422 / 369 / 143 / 375
- Avg right basic / DOT / heal / shield: 747 / 0 / 196 / 149

### `poisonBloom` into `crownCarry`

- Win rate: 37% (11/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 23.5s
- Avg left basic / DOT / heal / shield: 302 / 441 / 173 / 430
- Avg right basic / DOT / heal / shield: 1457 / 0 / 302 / 502

### `poisonBloom` into `fireBurst`

- Win rate: 83% (25/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 17.0s
- Avg left basic / DOT / heal / shield: 242 / 380 / 147 / 450
- Avg right basic / DOT / heal / shield: 301 / 168 / 0 / 229

### `poisonBloom` into `frostControl`

- Win rate: 90% (27/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 21.2s
- Avg left basic / DOT / heal / shield: 331 / 445 / 216 / 512
- Avg right basic / DOT / heal / shield: 431 / 196 / 155 / 422

### `poisonBloom` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 51.1s
- Avg left basic / DOT / heal / shield: 614 / 871 / 263 / 1725
- Avg right basic / DOT / heal / shield: 347 / 0 / 1139 / 2184

### `poisonBloom` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 41.1s
- Avg left basic / DOT / heal / shield: 554 / 711 / 438 / 1379
- Avg right basic / DOT / heal / shield: 409 / 0 / 470 / 1166

### `poisonBloom` into `lightningTempo`

- Win rate: 87% (26/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 15.9s
- Avg left basic / DOT / heal / shield: 319 / 408 / 98 / 270
- Avg right basic / DOT / heal / shield: 664 / 0 / 0 / 0

### `poisonBloom` into `shadowExecute`

- Win rate: 93% (28/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.6s
- Avg left basic / DOT / heal / shield: 380 / 415 / 149 / 427
- Avg right basic / DOT / heal / shield: 343 / 219 / 0 / 268

### `shadowExecute` into `alchemyChaos`

- Win rate: 13% (4/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 32.3s
- Avg left basic / DOT / heal / shield: 376 / 216 / 0 / 600
- Avg right basic / DOT / heal / shield: 506 / 251 / 0 / 333

### `shadowExecute` into `bloodRage`

- Win rate: 73% (22/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 558 / 209 / 0 / 277
- Avg right basic / DOT / heal / shield: 723 / 0 / 198 / 151

### `shadowExecute` into `crownCarry`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 287 / 242 / 0 / 215
- Avg right basic / DOT / heal / shield: 1403 / 0 / 214 / 388

### `shadowExecute` into `fireBurst`

- Win rate: 17% (5/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 15.9s
- Avg left basic / DOT / heal / shield: 359 / 183 / 0 / 188
- Avg right basic / DOT / heal / shield: 391 / 131 / 0 / 145

### `shadowExecute` into `frostControl`

- Win rate: 23% (7/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 40.7s
- Avg left basic / DOT / heal / shield: 363 / 255 / 0 / 754
- Avg right basic / DOT / heal / shield: 534 / 191 / 18 / 736

### `shadowExecute` into `holySustain`

- Win rate: 70% (21/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 51.7s
- Avg left basic / DOT / heal / shield: 649 / 475 / 0 / 1093
- Avg right basic / DOT / heal / shield: 424 / 0 / 801 / 2117

### `shadowExecute` into `ironWall`

- Win rate: 53% (16/30)
- Expectation: intended favored, actual even, ok
- Avg duration: 45.8s
- Avg left basic / DOT / heal / shield: 540 / 424 / 0 / 831
- Avg right basic / DOT / heal / shield: 664 / 0 / 397 / 1202

### `shadowExecute` into `lightningTempo`

- Win rate: 30% (9/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 20.7s
- Avg left basic / DOT / heal / shield: 383 / 203 / 0 / 354
- Avg right basic / DOT / heal / shield: 663 / 0 / 0 / 0

### `shadowExecute` into `poisonBloom`

- Win rate: 7% (2/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.6s
- Avg left basic / DOT / heal / shield: 343 / 219 / 0 / 268
- Avg right basic / DOT / heal / shield: 380 / 415 / 149 / 427

