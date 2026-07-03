# Current Equipment Grind vs Super Waterline

Generated at: 2026-07-02T15:06:46.967Z

## Setup

- Super waterline sample: 48/120
- Scoring pool after excluding boss outliers: 74/120
- Avg sampled pressure: 218.16
- Ticks: 24
- Items per team per tick: 6
- Dungeon unlock clear rate: 0.75

## Dungeons

| # | Dungeon | Item level range | Rarity table | Challenge mobs |
| ---: | --- | --- | --- | ---: |
| 1 | 旧路鼠窟 | 18-28 | common 90%/item (~100%/run), rare 9.5%/item (~45.1%/run), epic 0.5%/item (~3%/run) | 12 |
| 2 | 黑松哨站 | 26-42 | common 74%/item (~100%/run), rare 24.5%/item (~81.5%/run), epic 1.5%/item (~8.7%/run) | 12 |
| 3 | 腐火地窟 | 38-58 | common 42%/item (~96.2%/run), rare 48%/item (~98%/run), epic 9.5%/item (~45.1%/run), legendary 0.5%/item (~3%/run) | 12 |
| 4 | 王墓外环 | 58-84 | rare 54%/item (~99.1%/run), epic 38%/item (~94.3%/run), legendary 7.5%/item (~37.4%/run), mythic 0.5%/item (~3%/run) | 12 |
| 5 | 龙骨浅层 | 80-112 | rare 16%/item (~64.9%/run), epic 58%/item (~99.5%/run), legendary 24%/item (~80.7%/run), mythic 2%/item (~11.4%/run) | 12 |
| 6 | 灰冠深井 | 102-136 | epic 56%/item (~99.3%/run), legendary 38%/item (~94.3%/run), mythic 6%/item (~31%/run) | 12 |
| 7 | 星坠祭坛 | 126-158 | epic 32%/item (~90.1%/run), legendary 53%/item (~98.9%/run), mythic 15%/item (~62.3%/run) | 12 |
| 8 | 夜王门厅 | 148-178 | epic 10%/item (~46.9%/run), legendary 58%/item (~99.5%/run), mythic 32%/item (~90.1%/run) | 12 |
| 9 | 无月王冠 | 170-198 | legendary 46%/item (~97.5%/run), mythic 54%/item (~99.1%/run) | 12 |

## Synthesis

- Average end average: 0.918
- Average end best: 0.984
- Average end worst: 0.839
- Average delta: 0.866
- Strongest scenario: s4_lowhp_shadow_sustain (bloodRage, shadowExecute, holySustain) end average 1
- Weakest floor scenario: s3_double_dot_wall (fireBurst, poisonBloom, ironWall) end worst 0.708

## Runs

| Run | Teams | Start avg | End avg | End best | End worst | Delta avg | Jumps | Plateau |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| s1_fire_lowhp_wall | fireBurst, bloodRage, ironWall | 0.042 | 0.854 | 1 | 0.75 | 0.812 | 4 | 7 |
| s2_poison_shadow_sustain | poisonBloom, shadowExecute, holySustain | 0.063 | 0.958 | 1 | 0.875 | 0.895 | 7 | 7 |
| s3_double_dot_wall | fireBurst, poisonBloom, ironWall | 0.07 | 0.903 | 1 | 0.708 | 0.833 | 8 | 11 |
| s4_lowhp_shadow_sustain | bloodRage, shadowExecute, holySustain | 0.028 | 1 | 1 | 1 | 0.972 | 5 | 9 |
| s5_defensive_shells | ironWall, holySustain, bloodRage | 0.021 | 0.938 | 1 | 0.813 | 0.917 | 7 | 9 |
| s6_damage_race | fireBurst, poisonBloom, shadowExecute | 0.09 | 0.834 | 0.875 | 0.813 | 0.744 | 7 | 7 |
| s7_spell_execute_sustain | fireBurst, shadowExecute, holySustain | 0.049 | 0.854 | 1 | 0.75 | 0.805 | 7 | 11 |
| s8_pressure_front | bloodRage, poisonBloom, ironWall | 0.049 | 1 | 1 | 1 | 0.951 | 9 | 7 |

## Curve Samples

Each sampled row shows `tick: avg / worst / team dungeon+score` after that grind tick.

### s1_fire_lowhp_wall

- T0: avg 0.042, worst 0; fireBurst:D1/0.083, bloodRage:D1/0.042, ironWall:D1/0
- T3: avg 0.181, worst 0.167; fireBurst:D4/0.188, bloodRage:D4/0.188, ironWall:D3/0.167
- T6: avg 0.285, worst 0.208; fireBurst:D5/0.271, bloodRage:D5/0.375, ironWall:D5/0.208
- T9: avg 0.549, worst 0.292; fireBurst:D5/0.438, bloodRage:D8/0.917, ironWall:D5/0.292
- T12: avg 0.667, worst 0.5; fireBurst:D6/0.5, bloodRage:D9/1, ironWall:D6/0.5
- T15: avg 0.75, worst 0.542; fireBurst:D6/0.542, bloodRage:D9/1, ironWall:D6/0.708
- T18: avg 0.764, worst 0.604; fireBurst:D6/0.604, bloodRage:D9/1, ironWall:D6/0.688
- T21: avg 0.826, worst 0.729; fireBurst:D6/0.75, bloodRage:D9/1, ironWall:D6/0.729
- T24: avg 0.854, worst 0.75; fireBurst:D6/0.813, bloodRage:D9/1, ironWall:D6/0.75

### s2_poison_shadow_sustain

- T0: avg 0.063, worst 0.021; poisonBloom:D1/0.125, shadowExecute:D1/0.042, holySustain:D1/0.021
- T3: avg 0.174, worst 0.146; poisonBloom:D4/0.188, shadowExecute:D3/0.188, holySustain:D2/0.146
- T6: avg 0.222, worst 0.188; poisonBloom:D5/0.271, shadowExecute:D5/0.208, holySustain:D5/0.188
- T9: avg 0.368, worst 0.354; poisonBloom:D5/0.354, shadowExecute:D6/0.375, holySustain:D5/0.375
- T12: avg 0.577, worst 0.5; poisonBloom:D6/0.667, shadowExecute:D6/0.563, holySustain:D6/0.5
- T15: avg 0.799, worst 0.688; poisonBloom:D6/0.75, shadowExecute:D6/0.688, holySustain:D9/0.958
- T18: avg 0.833, worst 0.708; poisonBloom:D6/0.792, shadowExecute:D6/0.708, holySustain:D9/1
- T21: avg 0.896, worst 0.75; poisonBloom:D9/0.938, shadowExecute:D7/0.75, holySustain:D9/1
- T24: avg 0.958, worst 0.875; poisonBloom:D9/1, shadowExecute:D8/0.875, holySustain:D9/1

### s3_double_dot_wall

- T0: avg 0.07, worst 0; fireBurst:D1/0.063, poisonBloom:D1/0.146, ironWall:D1/0
- T3: avg 0.188, worst 0.188; fireBurst:D4/0.188, poisonBloom:D4/0.188, ironWall:D3/0.188
- T6: avg 0.264, worst 0.208; fireBurst:D5/0.271, poisonBloom:D5/0.313, ironWall:D5/0.208
- T9: avg 0.472, worst 0.333; fireBurst:D5/0.396, poisonBloom:D6/0.688, ironWall:D5/0.333
- T12: avg 0.639, worst 0.542; fireBurst:D6/0.542, poisonBloom:D6/0.771, ironWall:D6/0.604
- T15: avg 0.785, worst 0.771; fireBurst:D6/0.792, poisonBloom:D7/0.792, ironWall:D6/0.771
- T18: avg 0.861, worst 0.729; fireBurst:D7/0.854, poisonBloom:D9/1, ironWall:D6/0.729
- T21: avg 0.903, worst 0.729; fireBurst:D9/0.979, poisonBloom:D9/1, ironWall:D6/0.729
- T24: avg 0.903, worst 0.708; fireBurst:D9/1, poisonBloom:D9/1, ironWall:D6/0.708

### s4_lowhp_shadow_sustain

- T0: avg 0.028, worst 0; bloodRage:D1/0.042, shadowExecute:D1/0.042, holySustain:D1/0
- T3: avg 0.167, worst 0.146; bloodRage:D4/0.188, shadowExecute:D3/0.167, holySustain:D2/0.146
- T6: avg 0.271, worst 0.229; bloodRage:D5/0.354, shadowExecute:D5/0.229, holySustain:D5/0.229
- T9: avg 0.514, worst 0.354; bloodRage:D8/0.813, shadowExecute:D6/0.354, holySustain:D5/0.375
- T12: avg 0.813, worst 0.646; bloodRage:D9/0.979, shadowExecute:D6/0.646, holySustain:D7/0.813
- T15: avg 0.882, worst 0.667; bloodRage:D9/1, shadowExecute:D6/0.667, holySustain:D9/0.979
- T18: avg 0.917, worst 0.75; bloodRage:D9/1, shadowExecute:D7/0.75, holySustain:D9/1
- T21: avg 0.958, worst 0.875; bloodRage:D9/1, shadowExecute:D9/0.875, holySustain:D9/1
- T24: avg 1, worst 1; bloodRage:D9/1, shadowExecute:D9/1, holySustain:D9/1

### s5_defensive_shells

- T0: avg 0.021, worst 0; ironWall:D1/0, holySustain:D1/0.021, bloodRage:D1/0.042
- T3: avg 0.181, worst 0.167; ironWall:D3/0.188, holySustain:D2/0.167, bloodRage:D4/0.188
- T6: avg 0.313, worst 0.188; ironWall:D5/0.229, holySustain:D5/0.188, bloodRage:D5/0.521
- T9: avg 0.507, worst 0.354; ironWall:D6/0.354, holySustain:D5/0.438, bloodRage:D6/0.729
- T12: avg 0.861, worst 0.583; ironWall:D6/0.583, holySustain:D8/1, bloodRage:D8/1
- T15: avg 0.931, worst 0.792; ironWall:D6/0.792, holySustain:D9/1, bloodRage:D9/1
- T18: avg 0.931, worst 0.792; ironWall:D6/0.792, holySustain:D9/1, bloodRage:D9/1
- T21: avg 0.91, worst 0.729; ironWall:D6/0.729, holySustain:D9/1, bloodRage:D9/1
- T24: avg 0.938, worst 0.813; ironWall:D7/0.813, holySustain:D9/1, bloodRage:D9/1

### s6_damage_race

- T0: avg 0.09, worst 0.021; fireBurst:D1/0.104, poisonBloom:D1/0.146, shadowExecute:D1/0.021
- T3: avg 0.181, worst 0.167; fireBurst:D4/0.188, poisonBloom:D4/0.188, shadowExecute:D3/0.167
- T6: avg 0.271, worst 0.229; fireBurst:D5/0.292, poisonBloom:D5/0.292, shadowExecute:D5/0.229
- T9: avg 0.375, worst 0.354; fireBurst:D5/0.354, poisonBloom:D5/0.417, shadowExecute:D6/0.354
- T12: avg 0.598, worst 0.542; fireBurst:D6/0.563, poisonBloom:D6/0.688, shadowExecute:D6/0.542
- T15: avg 0.701, worst 0.625; fireBurst:D6/0.75, poisonBloom:D6/0.729, shadowExecute:D6/0.625
- T18: avg 0.75, worst 0.708; fireBurst:D6/0.771, poisonBloom:D6/0.771, shadowExecute:D6/0.708
- T21: avg 0.771, worst 0.708; fireBurst:D6/0.792, poisonBloom:D6/0.708, shadowExecute:D6/0.813
- T24: avg 0.834, worst 0.813; fireBurst:D6/0.813, poisonBloom:D6/0.813, shadowExecute:D8/0.875

### s7_spell_execute_sustain

- T0: avg 0.049, worst 0.021; fireBurst:D1/0.083, shadowExecute:D1/0.021, holySustain:D1/0.042
- T3: avg 0.167, worst 0.146; fireBurst:D4/0.188, shadowExecute:D3/0.167, holySustain:D3/0.146
- T6: avg 0.236, worst 0.208; fireBurst:D5/0.271, shadowExecute:D5/0.208, holySustain:D5/0.229
- T9: avg 0.465, worst 0.417; fireBurst:D5/0.458, shadowExecute:D6/0.417, holySustain:D6/0.521
- T12: avg 0.722, worst 0.604; fireBurst:D6/0.688, shadowExecute:D6/0.604, holySustain:D7/0.875
- T15: avg 0.806, worst 0.688; fireBurst:D6/0.729, shadowExecute:D6/0.688, holySustain:D9/1
- T18: avg 0.826, worst 0.729; fireBurst:D6/0.75, shadowExecute:D6/0.729, holySustain:D9/1
- T21: avg 0.861, worst 0.771; fireBurst:D6/0.813, shadowExecute:D6/0.771, holySustain:D9/1
- T24: avg 0.854, worst 0.75; fireBurst:D6/0.813, shadowExecute:D6/0.75, holySustain:D9/1

### s8_pressure_front

- T0: avg 0.049, worst 0; bloodRage:D1/0.042, poisonBloom:D1/0.104, ironWall:D1/0
- T3: avg 0.188, worst 0.188; bloodRage:D4/0.188, poisonBloom:D4/0.188, ironWall:D3/0.188
- T6: avg 0.361, worst 0.229; bloodRage:D6/0.583, poisonBloom:D5/0.271, ironWall:D5/0.229
- T9: avg 0.577, worst 0.396; bloodRage:D8/0.896, poisonBloom:D6/0.438, ironWall:D5/0.396
- T12: avg 0.799, worst 0.667; bloodRage:D9/0.979, poisonBloom:D6/0.75, ironWall:D6/0.667
- T15: avg 0.826, worst 0.729; bloodRage:D9/1, poisonBloom:D6/0.75, ironWall:D6/0.729
- T18: avg 0.91, worst 0.771; bloodRage:D9/1, poisonBloom:D6/0.771, ironWall:D9/0.958
- T21: avg 0.944, worst 0.833; bloodRage:D9/1, poisonBloom:D8/0.833, ironWall:D9/1
- T24: avg 1, worst 1; bloodRage:D9/1, poisonBloom:D9/1, ironWall:D9/1

## Team End Scores

### s1_fire_lowhp_wall

- fireBurst: 0.083 -> 0.813, delta 0.73, jumps 7, final dungeon 6 灰冠深井, inventory 144
- bloodRage: 0.042 -> 1, delta 0.958, jumps 7, final dungeon 9 无月王冠, inventory 144
- ironWall: 0 -> 0.75, delta 0.75, jumps 7, final dungeon 6 灰冠深井, inventory 144

### s2_poison_shadow_sustain

- poisonBloom: 0.125 -> 1, delta 0.875, jumps 6, final dungeon 9 无月王冠, inventory 144
- shadowExecute: 0.042 -> 0.875, delta 0.833, jumps 6, final dungeon 8 夜王门厅, inventory 144
- holySustain: 0.021 -> 1, delta 0.979, jumps 6, final dungeon 9 无月王冠, inventory 144

### s3_double_dot_wall

- fireBurst: 0.063 -> 1, delta 0.937, jumps 7, final dungeon 9 无月王冠, inventory 144
- poisonBloom: 0.146 -> 1, delta 0.854, jumps 8, final dungeon 9 无月王冠, inventory 144
- ironWall: 0 -> 0.708, delta 0.708, jumps 7, final dungeon 6 灰冠深井, inventory 144

### s4_lowhp_shadow_sustain

- bloodRage: 0.042 -> 1, delta 0.958, jumps 5, final dungeon 9 无月王冠, inventory 144
- shadowExecute: 0.042 -> 1, delta 0.958, jumps 7, final dungeon 9 无月王冠, inventory 144
- holySustain: 0 -> 1, delta 1, jumps 8, final dungeon 9 无月王冠, inventory 144

### s5_defensive_shells

- ironWall: 0 -> 0.813, delta 0.813, jumps 9, final dungeon 7 星坠祭坛, inventory 144
- holySustain: 0.021 -> 1, delta 0.979, jumps 6, final dungeon 9 无月王冠, inventory 144
- bloodRage: 0.042 -> 1, delta 0.958, jumps 6, final dungeon 9 无月王冠, inventory 144

### s6_damage_race

- fireBurst: 0.104 -> 0.813, delta 0.709, jumps 8, final dungeon 6 灰冠深井, inventory 144
- poisonBloom: 0.146 -> 0.813, delta 0.667, jumps 5, final dungeon 6 灰冠深井, inventory 144
- shadowExecute: 0.021 -> 0.875, delta 0.854, jumps 7, final dungeon 8 夜王门厅, inventory 144

### s7_spell_execute_sustain

- fireBurst: 0.083 -> 0.813, delta 0.73, jumps 4, final dungeon 6 灰冠深井, inventory 144
- shadowExecute: 0.021 -> 0.75, delta 0.729, jumps 7, final dungeon 6 灰冠深井, inventory 144
- holySustain: 0.042 -> 1, delta 0.958, jumps 7, final dungeon 9 无月王冠, inventory 144

### s8_pressure_front

- bloodRage: 0.042 -> 1, delta 0.958, jumps 5, final dungeon 9 无月王冠, inventory 144
- poisonBloom: 0.104 -> 1, delta 0.896, jumps 9, final dungeon 9 无月王冠, inventory 144
- ironWall: 0 -> 1, delta 1, jumps 9, final dungeon 9 无月王冠, inventory 144

## Notes

- Super waterline is intentionally harsh; absolute scores should be read as pressure capacity, not normal dungeon clear rate.
- If average and best improve but worst remains low, loot is creating a carry/high-roll path but not solving team floor.
- If all curves stay flat, current drop quality or role-aware equip scoring is too weak for the super bucket.
- If one archetype dominates best-score endings, its affix family should be checked for over-conversion.
