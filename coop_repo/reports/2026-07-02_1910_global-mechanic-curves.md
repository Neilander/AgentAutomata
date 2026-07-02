# Agent Handoff: Global Mechanic Curve Asset

- Date: 2026-07-02
- Agent/thread: Codex desktop
- Scope: equipment affix point-to-effect curve infrastructure
- Status: complete, ready for equipment formula redesign

## User Intent

The user clarified that affixes such as life steal should not be direct percentages. They should be stored as points, then converted through a global diminishing return curve. The curve should be a shared asset, not duplicated in UI, combat, or simulation scripts.

## Completed

- Added a global mechanic curve asset:
  - `projects/western_fantasy_continent/game_data/mechanic-curves.js`
- Integrated curved affix conversion into `build-layers.js`.
- Kept raw affix points in `mechanicModifiers`.
- Added converted values to `buildLayers.debug.curvedMechanics` for debugging.
- Updated equipment grind pages to load `mechanic-curves.js` before `build-layers.js`.
- Updated equipment UI item scoring to use the same curve asset.
- Updated the super-waterline equipment grind simulation auto-equip scoring to use the same curve asset.
- Added a design document:
  - `projects/western_fantasy_continent/design/equipment_progression/global-mechanic-curve-asset.md`

## Files Changed

- `projects/western_fantasy_continent/game_data/mechanic-curves.js`: new global point-to-effect curve asset.
- `projects/western_fantasy_continent/game_data/build-layers.js`: curved affix stats now pass through the global curve asset.
- `projects/western_fantasy_continent/equipment_grind_simulator/index.html`: loads mechanic curves.
- `projects/western_fantasy_continent/equipment_grind_simulator/team.html`: loads mechanic curves.
- `projects/western_fantasy_continent/equipment_grind_simulator/equipment.html`: loads mechanic curves.
- `projects/western_fantasy_continent/equipment_grind_simulator/loot.html`: loads mechanic curves.
- `projects/western_fantasy_continent/equipment_grind_simulator/equipment-grind-simulator.js`: item scoring now uses mechanic curves.
- `projects/western_fantasy_continent/game_data/simulate-current-equipment-grind-super.js`: auto-equip scoring now uses mechanic curves.
- `projects/western_fantasy_continent/design/equipment_progression/global-mechanic-curve-asset.md`: documents the rule and sample curve outputs.
- `projects/western_fantasy_continent/design/equipment_progression/current-equipment-grind-super-8runs.md`: rerun after curve-aware scoring.
- `projects/western_fantasy_continent/design/equipment_progression/current-equipment-grind-super-8runs.json`: rerun after curve-aware scoring.
- `coop_repo/reports/2026-07-02_1910_global-mechanic-curves.md`: this report.
- `coop_repo/LATEST.md`: updated to point to this report.
- `coop_repo/REPORT_INDEX.md`: indexed this report.

## Validation

- `node -c projects\western_fantasy_continent\game_data\mechanic-curves.js`: passed.
- `node -c projects\western_fantasy_continent\game_data\build-layers.js`: passed.
- `node -c projects\western_fantasy_continent\equipment_grind_simulator\equipment-grind-simulator.js`: passed.
- `node -c projects\western_fantasy_continent\game_data\simulate-current-equipment-grind-super.js`: passed.
- Smoke test confirmed:
  - lifeSteal 10 points -> 3.89%
  - fireAmp 10 points -> 12.00%
  - attackSpeed 10 points -> 9.38%
  - effectResist 10 points -> 5.56%
- Build-layer smoke test confirmed raw points and converted effects are both recorded.
- Full super-waterline equipment grind simulation rerun:
  - Runs: 8
  - Sample: 48
  - Ticks: 24
  - Average end average: 0.103
  - Average delta: 0.077
  - Average end best: 0.122
  - Average end worst: 0.081

## Current State

The project now has a shared infrastructure answer for "affix points become real effects through curves." This is not yet the final equipment generation formula. It is the foundation needed before rebuilding rarity, affix count, and level-based base stats.

## Unresolved

- Current equipment generation still uses the old rarity/tier structure.
- The new curve asset has initial tuning values, not final balance.
- Direct skill logic does not yet consume `mechanicModifiers`; build layers currently translate curved affixes into core combat stats and debug records.
- No browser visual validation was performed in this pass.

## Recommended Next Step

Redesign the equipment generator around the new model:

1. Equipment level provides base stats.
2. Rarity provides many small affix point lines.
3. Affix points pass through `mechanic-curves.js`.
4. UI should show compact affix summaries, with detailed converted values behind a hover/detail panel.
