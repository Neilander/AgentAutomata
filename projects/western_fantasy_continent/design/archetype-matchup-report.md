# Archetype Matchup Report

Generated with `15` deterministic seeds per side, `30` total games per matchup, from `game_data/combat-sim.js`.

Rates are left preset win rates. This is now signal-backed simulation evidence, but it is still a prototype core and should be compared with the browser arena after major changes.

## Win Matrix

| Preset | 炼金异常 | 低血狂怒 | 王冠核心 | 余烬爆燃 | 霜控拖延 | 圣盾续航 | 铁壁反击 | 急速节奏 | 毒巢滚雪球 | 暗影处决 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 炼金异常 | — | 0% | 0% | 0% | 50% | 50%! | 100% | 97% | 0% | 50%! |
| 低血狂怒 | 100% | — | 50% | 0% | 100% | 100% | 100% | 0% | 0% | 3% |
| 王冠核心 | 100% | 50% | — | 100%! | 100% | 100% | 100% | 0% | 100% | 97%! |
| 余烬爆燃 | 100% | 100% | 0% | — | 100% | 100%! | 100%! | 53% | 97% | 0%! |
| 霜控拖延 | 50% | 0%! | 0% | 0% | — | 100% | 100% | 50% | 50%! | 0%! |
| 圣盾续航 | 50%! | 0% | 0% | 0%! | 0% | — | 100% | 50% | 0% | 0%! |
| 铁壁反击 | 0% | 0% | 0% | 0%! | 0% | 0% | — | 50% | 0% | 0%! |
| 急速节奏 | 3% | 100% | 100% | 47% | 50%! | 50%! | 50%! | — | 47% | 93%! |
| 毒巢滚雪球 | 100% | 100% | 0% | 3% | 50% | 100% | 100% | 53% | — | 50%! |
| 暗影处决 | 50% | 97% | 3%! | 100% | 100% | 100%! | 100%! | 7% | 50% | — |

## Expectation Mismatches

- `alchemyChaos` vs `holySustain`: expected favored, actual even, rate 50%.
- `alchemyChaos` vs `shadowExecute`: expected weak, actual even, rate 50%.
- `crownCarry` vs `fireBurst`: expected weak, actual favored, rate 100%.
- `crownCarry` vs `shadowExecute`: expected weak, actual favored, rate 97%.
- `fireBurst` vs `holySustain`: expected weak, actual favored, rate 100%.
- `fireBurst` vs `ironWall`: expected weak, actual favored, rate 100%.
- `fireBurst` vs `shadowExecute`: expected favored, actual weak, rate 0%.
- `frostControl` vs `bloodRage`: expected favored, actual weak, rate 0%.
- `frostControl` vs `poisonBloom`: expected weak, actual even, rate 50%.
- `frostControl` vs `shadowExecute`: expected favored, actual weak, rate 0%.
- `holySustain` vs `alchemyChaos`: expected weak, actual even, rate 50%.
- `holySustain` vs `fireBurst`: expected favored, actual weak, rate 0%.
- `holySustain` vs `shadowExecute`: expected favored, actual weak, rate 0%.
- `ironWall` vs `fireBurst`: expected favored, actual weak, rate 0%.
- `ironWall` vs `shadowExecute`: expected favored, actual weak, rate 0%.
- `lightningTempo` vs `frostControl`: expected weak, actual even, rate 50%.
- `lightningTempo` vs `holySustain`: expected favored, actual even, rate 50%.
- `lightningTempo` vs `ironWall`: expected favored, actual even, rate 50%.
- `lightningTempo` vs `shadowExecute`: expected weak, actual favored, rate 93%.
- `poisonBloom` vs `shadowExecute`: expected weak, actual even, rate 50%.
- `shadowExecute` vs `crownCarry`: expected favored, actual weak, rate 3%.
- `shadowExecute` vs `holySustain`: expected weak, actual favored, rate 100%.
- `shadowExecute` vs `ironWall`: expected weak, actual favored, rate 100%.

## Pair Details

### `alchemyChaos` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 14.9s
- Avg left basic / DOT / heal / shield: 385 / 340 / 0 / 139
- Avg right basic / DOT / heal / shield: 1159 / 0 / 215 / 118

### `alchemyChaos` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 425 / 404 / 0 / 139
- Avg right basic / DOT / heal / shield: 1215 / 0 / 240 / 584

### `alchemyChaos` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 13.6s
- Avg left basic / DOT / heal / shield: 322 / 247 / 0 / 211
- Avg right basic / DOT / heal / shield: 296 / 128 / 0 / 148

### `alchemyChaos` into `frostControl`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 34.6s
- Avg left basic / DOT / heal / shield: 454 / 396 / 0 / 721
- Avg right basic / DOT / heal / shield: 469 / 185 / 308 / 1009

### `alchemyChaos` into `holySustain`

- Win rate: 50% (15/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 49.9s
- Avg left basic / DOT / heal / shield: 513 / 452 / 0 / 1185
- Avg right basic / DOT / heal / shield: 434 / 0 / 856 / 2086

### `alchemyChaos` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 31.5s
- Avg left basic / DOT / heal / shield: 632 / 401 / 0 / 615
- Avg right basic / DOT / heal / shield: 394 / 0 / 330 / 779

### `alchemyChaos` into `lightningTempo`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 462 / 274 / 0 / 176
- Avg right basic / DOT / heal / shield: 472 / 0 / 0 / 0

### `alchemyChaos` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.4s
- Avg left basic / DOT / heal / shield: 363 / 332 / 0 / 210
- Avg right basic / DOT / heal / shield: 450 / 473 / 166 / 544

### `alchemyChaos` into `shadowExecute`

- Win rate: 50% (15/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 35.2s
- Avg left basic / DOT / heal / shield: 468 / 251 / 0 / 240
- Avg right basic / DOT / heal / shield: 442 / 248 / 0 / 622

### `bloodRage` into `alchemyChaos`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.9s
- Avg left basic / DOT / heal / shield: 1159 / 0 / 215 / 118
- Avg right basic / DOT / heal / shield: 385 / 340 / 0 / 139

### `bloodRage` into `crownCarry`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 1222 / 0 / 277 / 154
- Avg right basic / DOT / heal / shield: 1617 / 0 / 308 / 300

### `bloodRage` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.6s
- Avg left basic / DOT / heal / shield: 634 / 0 / 159 / 77
- Avg right basic / DOT / heal / shield: 512 / 113 / 0 / 172

### `bloodRage` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 1217 / 0 / 264 / 154
- Avg right basic / DOT / heal / shield: 454 / 171 / 82 / 220

### `bloodRage` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 1428 / 0 / 328 / 154
- Avg right basic / DOT / heal / shield: 437 / 0 / 307 / 460

### `bloodRage` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 1443 / 0 / 323 / 154
- Avg right basic / DOT / heal / shield: 554 / 0 / 115 / 219

### `bloodRage` into `lightningTempo`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 23.9s
- Avg left basic / DOT / heal / shield: 1015 / 0 / 244 / 166
- Avg right basic / DOT / heal / shield: 873 / 0 / 0 / 0

### `bloodRage` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 956 / 0 / 209 / 158
- Avg right basic / DOT / heal / shield: 594 / 446 / 197 / 304

### `bloodRage` into `shadowExecute`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 14.9s
- Avg left basic / DOT / heal / shield: 500 / 0 / 126 / 80
- Avg right basic / DOT / heal / shield: 565 / 174 / 0 / 276

### `crownCarry` into `alchemyChaos`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.7s
- Avg left basic / DOT / heal / shield: 1215 / 0 / 240 / 584
- Avg right basic / DOT / heal / shield: 425 / 404 / 0 / 139

### `crownCarry` into `bloodRage`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 1617 / 0 / 308 / 300
- Avg right basic / DOT / heal / shield: 1222 / 0 / 277 / 154

### `crownCarry` into `fireBurst`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 1433 / 0 / 310 / 381
- Avg right basic / DOT / heal / shield: 292 / 303 / 0 / 148

### `crownCarry` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 19.4s
- Avg left basic / DOT / heal / shield: 1479 / 0 / 348 / 434
- Avg right basic / DOT / heal / shield: 382 / 234 / 116 / 361

### `crownCarry` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 28.1s
- Avg left basic / DOT / heal / shield: 1868 / 0 / 460 / 1204
- Avg right basic / DOT / heal / shield: 415 / 0 / 465 / 842

### `crownCarry` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.3s
- Avg left basic / DOT / heal / shield: 1630 / 0 / 324 / 504
- Avg right basic / DOT / heal / shield: 557 / 0 / 154 / 442

### `crownCarry` into `lightningTempo`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 18.2s
- Avg left basic / DOT / heal / shield: 509 / 0 / 111 / 329
- Avg right basic / DOT / heal / shield: 716 / 0 / 0 / 0

### `crownCarry` into `poisonBloom`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 20.1s
- Avg left basic / DOT / heal / shield: 1634 / 0 / 320 / 587
- Avg right basic / DOT / heal / shield: 349 / 285 / 157 / 364

### `crownCarry` into `shadowExecute`

- Win rate: 97% (29/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 1470 / 0 / 172 / 279
- Avg right basic / DOT / heal / shield: 380 / 287 / 0 / 215

### `fireBurst` into `alchemyChaos`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 13.6s
- Avg left basic / DOT / heal / shield: 296 / 128 / 0 / 148
- Avg right basic / DOT / heal / shield: 322 / 247 / 0 / 211

### `fireBurst` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.6s
- Avg left basic / DOT / heal / shield: 512 / 113 / 0 / 172
- Avg right basic / DOT / heal / shield: 634 / 0 / 159 / 77

### `fireBurst` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 292 / 303 / 0 / 148
- Avg right basic / DOT / heal / shield: 1433 / 0 / 310 / 381

### `fireBurst` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 16.4s
- Avg left basic / DOT / heal / shield: 310 / 198 / 0 / 146
- Avg right basic / DOT / heal / shield: 319 / 250 / 108 / 288

### `fireBurst` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 308 / 211 / 0 / 282
- Avg right basic / DOT / heal / shield: 293 / 0 / 370 / 565

### `fireBurst` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 346 / 212 / 0 / 210
- Avg right basic / DOT / heal / shield: 404 / 0 / 140 / 365

### `fireBurst` into `lightningTempo`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 14.7s
- Avg left basic / DOT / heal / shield: 380 / 150 / 0 / 150
- Avg right basic / DOT / heal / shield: 537 / 0 / 0 / 0

### `fireBurst` into `poisonBloom`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 310 / 273 / 0 / 280
- Avg right basic / DOT / heal / shield: 263 / 342 / 137 / 462

### `fireBurst` into `shadowExecute`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 12.0s
- Avg left basic / DOT / heal / shield: 212 / 81 / 0 / 32
- Avg right basic / DOT / heal / shield: 392 / 108 / 0 / 213

### `frostControl` into `alchemyChaos`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 34.6s
- Avg left basic / DOT / heal / shield: 469 / 185 / 308 / 1009
- Avg right basic / DOT / heal / shield: 454 / 396 / 0 / 721

### `frostControl` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 18.3s
- Avg left basic / DOT / heal / shield: 454 / 171 / 82 / 220
- Avg right basic / DOT / heal / shield: 1217 / 0 / 264 / 154

### `frostControl` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.4s
- Avg left basic / DOT / heal / shield: 382 / 234 / 116 / 361
- Avg right basic / DOT / heal / shield: 1479 / 0 / 348 / 434

### `frostControl` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 16.4s
- Avg left basic / DOT / heal / shield: 319 / 250 / 108 / 288
- Avg right basic / DOT / heal / shield: 310 / 198 / 0 / 146

### `frostControl` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 1154 / 335 / 436 / 2814
- Avg right basic / DOT / heal / shield: 324 / 0 / 1679 / 3219

### `frostControl` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 50.1s
- Avg left basic / DOT / heal / shield: 904 / 251 / 452 / 1634
- Avg right basic / DOT / heal / shield: 345 / 0 / 611 / 1424

### `frostControl` into `lightningTempo`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 21.4s
- Avg left basic / DOT / heal / shield: 539 / 216 / 109 / 437
- Avg right basic / DOT / heal / shield: 557 / 0 / 0 / 0

### `frostControl` into `poisonBloom`

- Win rate: 50% (15/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 24.4s
- Avg left basic / DOT / heal / shield: 591 / 219 / 149 / 473
- Avg right basic / DOT / heal / shield: 379 / 538 / 199 / 640

### `frostControl` into `shadowExecute`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 30.6s
- Avg left basic / DOT / heal / shield: 433 / 159 / 0 / 314
- Avg right basic / DOT / heal / shield: 490 / 302 / 0 / 628

### `holySustain` into `alchemyChaos`

- Win rate: 50% (15/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 49.9s
- Avg left basic / DOT / heal / shield: 434 / 0 / 856 / 2086
- Avg right basic / DOT / heal / shield: 513 / 452 / 0 / 1185

### `holySustain` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 19.3s
- Avg left basic / DOT / heal / shield: 437 / 0 / 307 / 460
- Avg right basic / DOT / heal / shield: 1428 / 0 / 328 / 154

### `holySustain` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 28.1s
- Avg left basic / DOT / heal / shield: 415 / 0 / 465 / 842
- Avg right basic / DOT / heal / shield: 1868 / 0 / 460 / 1204

### `holySustain` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 17.5s
- Avg left basic / DOT / heal / shield: 293 / 0 / 370 / 565
- Avg right basic / DOT / heal / shield: 308 / 211 / 0 / 282

### `holySustain` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 75.0s
- Avg left basic / DOT / heal / shield: 324 / 0 / 1679 / 3219
- Avg right basic / DOT / heal / shield: 1154 / 335 / 436 / 2814

### `holySustain` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 71.6s
- Avg left basic / DOT / heal / shield: 1052 / 0 / 1194 / 3737
- Avg right basic / DOT / heal / shield: 893 / 0 / 801 / 2347

### `holySustain` into `lightningTempo`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 30.1s
- Avg left basic / DOT / heal / shield: 785 / 0 / 626 / 1156
- Avg right basic / DOT / heal / shield: 605 / 0 / 0 / 0

### `holySustain` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 51.6s
- Avg left basic / DOT / heal / shield: 386 / 0 / 1217 / 2312
- Avg right basic / DOT / heal / shield: 663 / 818 / 199 / 1816

### `holySustain` into `shadowExecute`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 23.4s
- Avg left basic / DOT / heal / shield: 392 / 0 / 331 / 504
- Avg right basic / DOT / heal / shield: 570 / 315 / 0 / 590

### `ironWall` into `alchemyChaos`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 31.5s
- Avg left basic / DOT / heal / shield: 394 / 0 / 330 / 779
- Avg right basic / DOT / heal / shield: 632 / 401 / 0 / 615

### `ironWall` into `bloodRage`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 17.4s
- Avg left basic / DOT / heal / shield: 554 / 0 / 115 / 219
- Avg right basic / DOT / heal / shield: 1443 / 0 / 323 / 154

### `ironWall` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 21.3s
- Avg left basic / DOT / heal / shield: 557 / 0 / 154 / 442
- Avg right basic / DOT / heal / shield: 1630 / 0 / 324 / 504

### `ironWall` into `fireBurst`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 17.1s
- Avg left basic / DOT / heal / shield: 404 / 0 / 140 / 365
- Avg right basic / DOT / heal / shield: 346 / 212 / 0 / 210

### `ironWall` into `frostControl`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 50.1s
- Avg left basic / DOT / heal / shield: 345 / 0 / 611 / 1424
- Avg right basic / DOT / heal / shield: 904 / 251 / 452 / 1634

### `ironWall` into `holySustain`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 71.6s
- Avg left basic / DOT / heal / shield: 893 / 0 / 801 / 2347
- Avg right basic / DOT / heal / shield: 1052 / 0 / 1194 / 3737

### `ironWall` into `lightningTempo`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 33.9s
- Avg left basic / DOT / heal / shield: 857 / 0 / 331 / 925
- Avg right basic / DOT / heal / shield: 684 / 0 / 0 / 0

### `ironWall` into `poisonBloom`

- Win rate: 0% (0/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 22.0s
- Avg left basic / DOT / heal / shield: 367 / 0 / 165 / 419
- Avg right basic / DOT / heal / shield: 552 / 452 / 162 / 654

### `ironWall` into `shadowExecute`

- Win rate: 0% (0/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 445 / 0 / 182 / 340
- Avg right basic / DOT / heal / shield: 512 / 251 / 0 / 452

### `lightningTempo` into `alchemyChaos`

- Win rate: 3% (1/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 16.1s
- Avg left basic / DOT / heal / shield: 472 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 462 / 274 / 0 / 176

### `lightningTempo` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 23.9s
- Avg left basic / DOT / heal / shield: 873 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 1015 / 0 / 244 / 166

### `lightningTempo` into `crownCarry`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 18.2s
- Avg left basic / DOT / heal / shield: 716 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 509 / 0 / 111 / 329

### `lightningTempo` into `fireBurst`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 14.7s
- Avg left basic / DOT / heal / shield: 537 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 380 / 150 / 0 / 150

### `lightningTempo` into `frostControl`

- Win rate: 50% (15/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 21.4s
- Avg left basic / DOT / heal / shield: 557 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 539 / 216 / 109 / 437

### `lightningTempo` into `holySustain`

- Win rate: 50% (15/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 30.1s
- Avg left basic / DOT / heal / shield: 605 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 785 / 0 / 626 / 1156

### `lightningTempo` into `ironWall`

- Win rate: 50% (15/30)
- Expectation: intended favored, actual even, mismatch
- Avg duration: 33.9s
- Avg left basic / DOT / heal / shield: 684 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 857 / 0 / 331 / 925

### `lightningTempo` into `poisonBloom`

- Win rate: 47% (14/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 19.7s
- Avg left basic / DOT / heal / shield: 671 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 466 / 364 / 135 / 341

### `lightningTempo` into `shadowExecute`

- Win rate: 93% (28/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 24.3s
- Avg left basic / DOT / heal / shield: 677 / 0 / 0 / 0
- Avg right basic / DOT / heal / shield: 372 / 115 / 0 / 471

### `poisonBloom` into `alchemyChaos`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 21.4s
- Avg left basic / DOT / heal / shield: 450 / 473 / 166 / 544
- Avg right basic / DOT / heal / shield: 363 / 332 / 0 / 210

### `poisonBloom` into `bloodRage`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 20.4s
- Avg left basic / DOT / heal / shield: 594 / 446 / 197 / 304
- Avg right basic / DOT / heal / shield: 956 / 0 / 209 / 158

### `poisonBloom` into `crownCarry`

- Win rate: 0% (0/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 20.1s
- Avg left basic / DOT / heal / shield: 349 / 285 / 157 / 364
- Avg right basic / DOT / heal / shield: 1634 / 0 / 320 / 587

### `poisonBloom` into `fireBurst`

- Win rate: 3% (1/30)
- Expectation: intended weak, actual weak, ok
- Avg duration: 18.7s
- Avg left basic / DOT / heal / shield: 263 / 342 / 137 / 462
- Avg right basic / DOT / heal / shield: 310 / 273 / 0 / 280

### `poisonBloom` into `frostControl`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 24.4s
- Avg left basic / DOT / heal / shield: 379 / 538 / 199 / 640
- Avg right basic / DOT / heal / shield: 591 / 219 / 149 / 473

### `poisonBloom` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 51.6s
- Avg left basic / DOT / heal / shield: 663 / 818 / 199 / 1816
- Avg right basic / DOT / heal / shield: 386 / 0 / 1217 / 2312

### `poisonBloom` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 22.0s
- Avg left basic / DOT / heal / shield: 552 / 452 / 162 / 654
- Avg right basic / DOT / heal / shield: 367 / 0 / 165 / 419

### `poisonBloom` into `lightningTempo`

- Win rate: 53% (16/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 19.7s
- Avg left basic / DOT / heal / shield: 466 / 364 / 135 / 341
- Avg right basic / DOT / heal / shield: 671 / 0 / 0 / 0

### `poisonBloom` into `shadowExecute`

- Win rate: 50% (15/30)
- Expectation: intended weak, actual even, mismatch
- Avg duration: 21.2s
- Avg left basic / DOT / heal / shield: 435 / 401 / 101 / 436
- Avg right basic / DOT / heal / shield: 408 / 214 / 0 / 282

### `shadowExecute` into `alchemyChaos`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 35.2s
- Avg left basic / DOT / heal / shield: 442 / 248 / 0 / 622
- Avg right basic / DOT / heal / shield: 468 / 251 / 0 / 240

### `shadowExecute` into `bloodRage`

- Win rate: 97% (29/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 14.9s
- Avg left basic / DOT / heal / shield: 565 / 174 / 0 / 276
- Avg right basic / DOT / heal / shield: 500 / 0 / 126 / 80

### `shadowExecute` into `crownCarry`

- Win rate: 3% (1/30)
- Expectation: intended favored, actual weak, mismatch
- Avg duration: 16.5s
- Avg left basic / DOT / heal / shield: 380 / 287 / 0 / 215
- Avg right basic / DOT / heal / shield: 1470 / 0 / 172 / 279

### `shadowExecute` into `fireBurst`

- Win rate: 100% (30/30)
- Expectation: intended favored, actual favored, ok
- Avg duration: 12.0s
- Avg left basic / DOT / heal / shield: 392 / 108 / 0 / 213
- Avg right basic / DOT / heal / shield: 212 / 81 / 0 / 32

### `shadowExecute` into `frostControl`

- Win rate: 100% (30/30)
- Expectation: intended flex, actual favored, ok
- Avg duration: 30.6s
- Avg left basic / DOT / heal / shield: 490 / 302 / 0 / 628
- Avg right basic / DOT / heal / shield: 433 / 159 / 0 / 314

### `shadowExecute` into `holySustain`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 23.4s
- Avg left basic / DOT / heal / shield: 570 / 315 / 0 / 590
- Avg right basic / DOT / heal / shield: 392 / 0 / 331 / 504

### `shadowExecute` into `ironWall`

- Win rate: 100% (30/30)
- Expectation: intended weak, actual favored, mismatch
- Avg duration: 21.0s
- Avg left basic / DOT / heal / shield: 512 / 251 / 0 / 452
- Avg right basic / DOT / heal / shield: 445 / 0 / 182 / 340

### `shadowExecute` into `lightningTempo`

- Win rate: 7% (2/30)
- Expectation: intended flex, actual weak, ok
- Avg duration: 24.3s
- Avg left basic / DOT / heal / shield: 372 / 115 / 0 / 471
- Avg right basic / DOT / heal / shield: 677 / 0 / 0 / 0

### `shadowExecute` into `poisonBloom`

- Win rate: 50% (15/30)
- Expectation: intended flex, actual even, ok
- Avg duration: 21.2s
- Avg left basic / DOT / heal / shield: 408 / 214 / 0 / 282
- Avg right basic / DOT / heal / shield: 435 / 401 / 101 / 436

