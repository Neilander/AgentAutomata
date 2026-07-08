# Agent Handoff: Wildfire Backline Assassin Check

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: test and record the user's backline blink assassin idea for `wildfire_rings`
- Status: complete

## User Intent

User suggested trying a backline assassin under `wildfire_rings`: the assassin starts in the backline, receives a moving wildfire ring, then blinks into the enemy side and burns them directly.

## Completed

- Tested the idea with several 500-team waterline checks.
- Added two wildfire candidates:
  - `wildfire_backline_assassin`: knight + priest + mage + assassin.
  - `wildfire_assassin_delivery`: knight + mage + warlock + assassin.
- Added a same-field one-role swap:
  - `add_backline_assassin_delivery`: knight + mage + warlock + alchemist -> knight + mage + warlock + assassin.
- Regenerated runtime field-effect validation output.

## Files Changed

- `projects/western_fantasy_continent/game_data/runtime-field-effects.js`: added wildfire assassin candidates and swap test.
- `projects/western_fantasy_continent/design/field_effects/runtime-field-effect-advantage.json`: regenerated.
- `projects/western_fantasy_continent/design/field_effects/runtime-field-effect-advantage.md`: regenerated.

## Validation

- `node --check projects\western_fantasy_continent\game_data\runtime-field-effects.js`: passed.
- `node --check projects\western_fantasy_continent\game_data\validate-runtime-field-effects.js`: passed.
- `node --check projects\western_fantasy_continent\game_data\combat-sim.js`: passed.
- `node projects\western_fantasy_continent\game_data\validate-runtime-field-effects.js`: passed, full 500/500 waterline.

Key wildfire numbers:

- `wildfire_backline_assassin`: 52.4% -> 85.2%, +32.8 absolute, +62.6% relative.
- `wildfire_assassin_delivery`: 76.0% -> 91.2%, +15.2 absolute, +20.0% relative.
- `add_backline_assassin_delivery` swap: 76.0% -> 91.2%, +15.2 absolute.

This is currently the cleanest positive same-field swap for `wildfire_rings`.

## Current State

The user's idea is validated: a backline assassin can act as a wildfire delivery unit by carrying the ring into enemy formations.

This gives `wildfire_rings` a much clearer player-facing lesson:

```text
Backline carries fire -> add a backline diver -> move the fire into enemies.
```

## Unresolved

- The uplift is large. It may be too strong if the goal is a mild teaching field.
- Visual inspection is still needed. Numerically it works, but the field lab should show whether the player can actually see the assassin carrying the ring into enemies.

## Recommended Next Step

Wire `wildfire_rings` into the field lab and watch `wildfire_backline_assassin` vs a normal ranged/status team. If the visual reads well, keep the route and tune numbers later.
