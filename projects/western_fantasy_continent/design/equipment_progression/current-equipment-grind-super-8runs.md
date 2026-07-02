# Current Equipment Grind vs Super Waterline

Generated at: 2026-07-02T11:37:24.514Z

## Setup

- Super waterline sample: 48/120
- Avg sampled pressure: 224.95
- Ticks: 24
- Items per team per tick: 4

## Synthesis

- Average end average: 0.125
- Average end best: 0.125
- Average end worst: 0.125
- Average delta: 0.099
- Strongest scenario: s1_fire_lowhp_wall (fireBurst, bloodRage, ironWall) end average 0.125
- Weakest floor scenario: s1_fire_lowhp_wall (fireBurst, bloodRage, ironWall) end worst 0.125

## Runs

| Run | Teams | Start avg | End avg | End best | End worst | Delta avg | Jumps | Plateau |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| s1_fire_lowhp_wall | fireBurst, bloodRage, ironWall | 0.028 | 0.125 | 0.125 | 0.125 | 0.097 | 0 | 22 |
| s2_poison_shadow_sustain | poisonBloom, shadowExecute, holySustain | 0.028 | 0.125 | 0.125 | 0.125 | 0.097 | 0 | 23 |
| s3_double_dot_wall | fireBurst, poisonBloom, ironWall | 0.035 | 0.125 | 0.125 | 0.125 | 0.09 | 0 | 22 |
| s4_lowhp_shadow_sustain | bloodRage, shadowExecute, holySustain | 0.014 | 0.125 | 0.125 | 0.125 | 0.111 | 0 | 22 |
| s5_defensive_shells | ironWall, holySustain, bloodRage | 0.014 | 0.125 | 0.125 | 0.125 | 0.111 | 1 | 22 |
| s6_damage_race | fireBurst, poisonBloom, shadowExecute | 0.042 | 0.125 | 0.125 | 0.125 | 0.083 | 1 | 23 |
| s7_spell_execute_sustain | fireBurst, shadowExecute, holySustain | 0.028 | 0.125 | 0.125 | 0.125 | 0.097 | 1 | 23 |
| s8_pressure_front | bloodRage, poisonBloom, ironWall | 0.021 | 0.125 | 0.125 | 0.125 | 0.104 | 1 | 21 |

## Team End Scores

### s1_fire_lowhp_wall

- fireBurst: 0.063 -> 0.125, delta 0.062, jumps 1, inventory 96
- bloodRage: 0.021 -> 0.125, delta 0.104, jumps 1, inventory 96
- ironWall: 0 -> 0.125, delta 0.125, jumps 0, inventory 96

### s2_poison_shadow_sustain

- poisonBloom: 0.042 -> 0.125, delta 0.083, jumps 1, inventory 96
- shadowExecute: 0.021 -> 0.125, delta 0.104, jumps 0, inventory 96
- holySustain: 0.021 -> 0.125, delta 0.104, jumps 0, inventory 96

### s3_double_dot_wall

- fireBurst: 0.042 -> 0.125, delta 0.083, jumps 1, inventory 96
- poisonBloom: 0.063 -> 0.125, delta 0.062, jumps 0, inventory 96
- ironWall: 0 -> 0.125, delta 0.125, jumps 0, inventory 96

### s4_lowhp_shadow_sustain

- bloodRage: 0.021 -> 0.125, delta 0.104, jumps 1, inventory 96
- shadowExecute: 0.021 -> 0.125, delta 0.104, jumps 1, inventory 96
- holySustain: 0 -> 0.125, delta 0.125, jumps 0, inventory 96

### s5_defensive_shells

- ironWall: 0 -> 0.125, delta 0.125, jumps 1, inventory 96
- holySustain: 0.021 -> 0.125, delta 0.104, jumps 0, inventory 96
- bloodRage: 0.021 -> 0.125, delta 0.104, jumps 1, inventory 96

### s6_damage_race

- fireBurst: 0.063 -> 0.125, delta 0.062, jumps 1, inventory 96
- poisonBloom: 0.063 -> 0.125, delta 0.062, jumps 0, inventory 96
- shadowExecute: 0 -> 0.125, delta 0.125, jumps 1, inventory 96

### s7_spell_execute_sustain

- fireBurst: 0.063 -> 0.125, delta 0.062, jumps 0, inventory 96
- shadowExecute: 0 -> 0.125, delta 0.125, jumps 1, inventory 96
- holySustain: 0.021 -> 0.125, delta 0.104, jumps 0, inventory 96

### s8_pressure_front

- bloodRage: 0.021 -> 0.125, delta 0.104, jumps 1, inventory 96
- poisonBloom: 0.042 -> 0.125, delta 0.083, jumps 1, inventory 96
- ironWall: 0 -> 0.125, delta 0.125, jumps 1, inventory 96

## Notes

- Super waterline is intentionally harsh; absolute scores should be read as pressure capacity, not normal dungeon clear rate.
- If average and best improve but worst remains low, loot is creating a carry/high-roll path but not solving team floor.
- If all curves stay flat, current drop quality or role-aware equip scoring is too weak for the super bucket.
- If one archetype dominates best-score endings, its affix family should be checked for over-conversion.
