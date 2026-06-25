# 4v4 Genre Arena Attention Report

- Intent: `select_matchup_then_watch_battle`
- Method: recursive attention tree. First analyze hierarchy, then allocate attention within each sibling group.

## Page Hierarchy

```text
- screen: 100.0
  - battle_panel: 45.3 [1/3 children below min child attention 5]
    - battlefield: 33.3
      - skill_effects: 22.2
      - left_units: 5.6
      - right_units: 5.6
    - scorebar: 10.4
      - left_alive: 3.8
      - right_alive: 3.8
      - timer_state: 2.9
    - battle_legend: 1.6
  - preset_dock: 33.4
    - left_preset_list: 16.7 [child count 10 exceeds comfort limit 6; 9/10 children below min child attention 1.6]
      - left_poison_bloom: 10.2
      - left_fire_burst: 0.7
      - left_crown_carry: 0.7
      - left_iron_wall: 0.7
      - left_blood_rage: 0.7
      - left_lightning_tempo: 0.7
      - left_frost_control: 0.7
      - left_holy_sustain: 0.7
      - left_shadow_execute: 0.7
      - left_alchemy_chaos: 0.7
    - right_preset_list: 16.7 [child count 10 exceeds comfort limit 6; 9/10 children below min child attention 1.6]
      - right_iron_wall: 10.2
      - right_poison_bloom: 0.7
      - right_fire_burst: 0.7
      - right_crown_carry: 0.7
      - right_blood_rage: 0.7
      - right_lightning_tempo: 0.7
      - right_frost_control: 0.7
      - right_holy_sustain: 0.7
      - right_shadow_execute: 0.7
      - right_alchemy_chaos: 0.7
  - topbar: 19.0 [2/4 children below min child attention 2]
    - start_button: 11.8 [above max attention 9]
    - page_title: 5.1
    - speed_button: 1.5
    - reset_button: 0.7
  - team_config: 2.0
    - left_config_panel: 1.0
    - right_config_panel: 1.0
  - debug_bottom: 0.3
    - matchup_matrix: 0.1
    - combat_log: 0.1
    - skill_library: 0.1
```

## Top-Level Attention

| Region | Attention | Issues |
| --- | ---: | --- |
| battle_panel | 45.3 | 1/3 children below min child attention 5 |
| preset_dock | 33.4 | ok |
| topbar | 19.0 | 2/4 children below min child attention 2 |
| team_config | 2.0 | ok |
| debug_bottom | 0.3 | ok |

## Strongest Leaf Signals

| Signal | Attention | Parent/Role | Issues |
| --- | ---: | --- | --- |
| skill_effects | 22.15 | event_layer | ok |
| start_button | 11.79 | button | above max attention 9 |
| right_iron_wall | 10.21 | card | ok |
| left_poison_bloom | 10.21 | card | ok |
| left_units | 5.57 | unit_group | ok |
| right_units | 5.57 | unit_group | ok |
| page_title | 5.06 | text | ok |
| left_alive | 3.77 | number | ok |
| right_alive | 3.77 | number | ok |
| timer_state | 2.90 | number | ok |
| battle_legend | 1.59 | legend | ok |
| speed_button | 1.46 | button | ok |
| left_config_panel | 0.98 | panel | ok |
| right_config_panel | 0.98 | panel | ok |
| right_poison_bloom | 0.72 | card | ok |

## Issues

- battle_panel: 1/3 children below min child attention 5
- left_preset_list: child count 10 exceeds comfort limit 6; 9/10 children below min child attention 1.6
- right_preset_list: child count 10 exceeds comfort limit 6; 9/10 children below min child attention 1.6
- topbar: 2/4 children below min child attention 2
- start_button: above max attention 9

## Interpretation

- The battle panel dominates the screen, which is good only after battle has started.
- Under the current intent `select_matchup_then_watch_battle`, the preset selector needs enough attention before battle starts, but each preset card receives very little child-level attention because the lists contain many same-category cards.
- The start button is important but competes inside a small topbar; if the player has not started yet, it may need stronger visual priority or relocation near the matchup selector.
- The battlefield has large area attention, but its actual event layer depends on skill effects and floaters. If skill effects are weak, the battle panel becomes visually dominant but experientially underfed.
- Detailed team config and debug bottom are correctly low for this intent, but they should become stronger in a separate tuning/debug intent.

## Suggested UI Direction

- Split states: before battle, make matchup selection plus start action the P0 flow; during battle, collapse selectors and make battle events P0.
- Replace always-visible preset cards with compact rows plus selected matchup detail, or show fewer recommended presets at once.
- Keep selected left/right teams visible, but reduce non-selected card text density.
- Add stronger event signals inside battle: skill casts, shield spikes, poison ticks, execute moments, and result banners.
