# Agent Handoff: Equipment Rarity Level Waterline Thresholds

- Date: 2026-07-02
- Agent/thread: Codex
- Scope: equipment threshold testing against current super-waterline bucket
- Status: complete

## User Intent

Find roughly what fixed equipment level each rarity needs to beat the current "super hard / full-score waterline" bucket, using tests like common Lv.150, rare Lv.150, then stepping levels down or up.

## Completed

- Added a fixed-rarity/fixed-level equipment threshold scanner.
- Tested six representative preset teams against the current super-waterline team database.
- Ran a fast sampled scan over 48/120 waterline teams and additional targeted full-waterline checks over all 120 teams.
- Wrote detailed output report and JSON result under the equipment progression design folder.

## Files Changed

- `projects/western_fantasy_continent/game_data/scan-equipment-rarity-level-waterline.js`: new scanner that generates fixed rarity/level gear, auto-equips role-aware items, and evaluates representative presets against the super-waterline.
- `projects/western_fantasy_continent/design/equipment_progression/equipment-rarity-level-waterline-thresholds.md`: human-readable threshold report, including sampled scan and targeted full-waterline probes.
- `projects/western_fantasy_continent/design/equipment_progression/equipment-rarity-level-waterline-thresholds.json`: machine-readable sampled scan output.

## Validation

- `node -c projects/western_fantasy_continent/game_data/scan-equipment-rarity-level-waterline.js`: passed.
- `node projects/western_fantasy_continent/game_data/scan-equipment-rarity-level-waterline.js`: completed sampled scan.
- Targeted full-waterline probes were run through the scanner export against all 120 super-waterline teams.

## Current State

The strict full-waterline result should be read as bands, not exact single levels, because generated affix rolls and the "best of 4 candidates per slot" auto-equip introduce small non-monotonic noise.

Practical full-waterline bands from the targeted probes:

- Common: does not strict-clear even at Lv.350; best observed weakest preset was 118/120.
- Rare: does not strict-clear even at Lv.350; best observed weakest preset was 119/120.
- Epic: starts strict-clearing around the high 200s to low 300s; safest observed point is Lv.310+.
- Legendary: strict-clears around Lv.230-Lv.270; Lv.230 cleared in the targeted probe, Lv.270 is the safer read.
- Mythic: strict-clears around Lv.210+; Lv.150 cleared the 48-sample scan but failed strict 120-team verification.

Fast 48-sample thresholds:

- Common: no full clear up to Lv.250.
- Rare: near-clear at Lv.250.
- Epic: full-clear at Lv.250, near-clear at Lv.210.
- Legendary: full-clear at Lv.230, near-clear at Lv.170.
- Mythic: full-clear at Lv.150, near-clear at Lv.130.

## Unresolved

- The report currently uses generated gear samples, so exact pass/fail at adjacent levels can flip by one or two matches. A future deterministic percentile-style gear set would make thresholds cleaner.
- Common and rare high-level gear being near but not full-clear may be acceptable if "super waterline" is intended as endgame; otherwise the low-affix rarities need either stronger base scaling or clearer role-specific high-level bases.
- This test bypasses the current dungeon drop progression; it does not fix the known issue where progression drops stay too low because loot tier is tied to benchmark score.

## Recommended Next Step

Use this threshold report to set dungeon loot bands: if the current super-waterline is the ceiling target, mythic around Lv.210 or legendary around Lv.270 should be treated as "reliable clear" gear, while epic needs roughly Lv.300. Then fix the loot source progression so players can actually reach these bands through dungeon depth rather than score-gated drop tiers.
