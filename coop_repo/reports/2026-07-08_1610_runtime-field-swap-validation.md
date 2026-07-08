# Agent Handoff: Runtime Field Swap Validation

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: retune runtime field effects and add same-field one-role swap validation
- Status: complete

## User Intent

User clarified that field validation must not only compare field vs no-field. It also needs to answer whether a player can take a standard team, change one role for the field, and improve while both versions are still fighting under the same field effect.

The user also judged:

- `war_drum_echo` / 普攻核心队 is ideal.
- `delay_mud` / 泥地 was too strong.
- Several other effects were too weak.

## Completed

- Added one-role swap validation to `validate-runtime-field-effects.js`.
- Added `swaps` definitions to all 10 runtime field effects.
- Updated `field-effect-design/SKILL.md` with same-field one-role swap validation.
- Retuned runtime effects:
  - `delay_mud`: melee move multiplier changed from `0.78` to `0.84`, reducing its strength.
  - `sentry_suppression`: backline pre-engage damage multiplier increased.
  - `hunting_whistle`: marked-target payoff increased.
  - `mirror_curse`: reflection increased.
  - `blood_moon_rise`: now prioritizes berserker/low-HP carry targets, adds stronger shield/damage/heal/leech.
  - `pressure_corridor`: added low-HP healing/shield amplification so sustain teams can actually benefit.
- Added a `beforeShield` runtime hook to `combat-sim.js` so field effects can interact with shield creation.
- Reran full 500-team waterline validation.

## Files Changed

- `projects/western_fantasy_continent/game_data/combat-sim.js`: added `beforeShield` hook.
- `projects/western_fantasy_continent/game_data/runtime-field-effects.js`: retuned effects and added swap tests.
- `projects/western_fantasy_continent/game_data/validate-runtime-field-effects.js`: added same-field one-role swap validation.
- `projects/western_fantasy_continent/skills/field-effect-design/SKILL.md`: recorded the new validation standard.
- `projects/western_fantasy_continent/design/field_effects/runtime-field-effect-advantage.json`: regenerated.
- `projects/western_fantasy_continent/design/field_effects/runtime-field-effect-advantage.md`: regenerated.

## Validation

- `node --check projects\western_fantasy_continent\game_data\combat-sim.js`: passed.
- `node --check projects\western_fantasy_continent\game_data\runtime-field-effects.js`: passed.
- `node --check projects\western_fantasy_continent\game_data\validate-runtime-field-effects.js`: passed.
- `node projects\western_fantasy_continent\game_data\validate-runtime-field-effects.js`: passed, full 500/500 waterline.

Key final results:

- `war_drum_echo`: basic_attack_core 54.4% -> 70.4%; swap marks_add_bard 64.0% -> 82.6%.
- `delay_mud`: four_ranged_damage 53.4% -> 74.0%, down from the previous 86.8%; swap melee_add_mage 39.4% -> 62.8%.
- `heavy_shield_line`: lightningTempo 61.6% -> 66.2%; swap sustain_add_ranger 20.0% -> 48.2%.
- `pressure_corridor`: holySustain 42.8% -> 47.2%; swap rage_add_priest 49.4% -> 54.4%.
- `blood_moon_rise`: crownCarry 75.0% -> 88.8%; swap rage_add_berserker 29.0% -> 79.8%.
- `king_flag`: flag_guard_mix 52.8% -> 67.6%; swap guard_add_knight 47.2% -> 67.6%.
- `mirror_curse`: multi_core_safe 54.4% -> 60.0%; swap execute_add_mage 63.8% -> 69.4%.
- `hunting_whistle`: bulwarkMarks 39.2% -> 46.0%; swap tempo_add_ranger 50.8% -> 65.0%.
- `ember_contagion`: frostControl 77.8% -> 84.8%; swap frost_add_alchemist 30.2% -> 46.2%.
- `sentry_suppression`: cavalryBreak 45.4% -> 54.2%; swap ranged_add_knight 61.6% -> 76.6%.

## Current State

The validation report now includes two tables per field:

1. field vs no-field advantage rows;
2. same-field one-role swap rows.

This better supports the user's desired teaching-loop standard: see field -> change one role -> improve.

## Unresolved

- Some swap rows are intentionally or accidentally negative. This is useful evidence, but future reports should label them as "bad swaps" rather than implying all swaps are intended positive answers.
- `delay_mud` is still one of the strongest effects at +20.6 absolute points for four-ranged damage. It is much closer but may still need another small nerf if the user wants it at the `war_drum_echo` level.
- `blood_moon_rise` now has a very large one-role swap lift, but the independent `bloodRage` preset still does not benefit. This suggests the preset is not the right representative for the effect.

## Recommended Next Step

Open `projects/western_fantasy_continent/design/field_effects/runtime-field-effect-advantage.md` and review both sections for each field. If continuing tuning, begin with:

1. deciding whether `delay_mud` should drop again from 0.84 to around 0.87-0.89 melee move multiplier;
2. replacing negative swap rows with explicit "bad swap" labels or better fair-swap examples;
3. wiring the runtime fields into the field lab so the user can watch the signals, not just read waterline numbers.
