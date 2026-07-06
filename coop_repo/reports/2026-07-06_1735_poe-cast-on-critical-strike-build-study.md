# Agent Handoff: PoE Cast on Critical Strike Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Continue deep loot/build-design learning by studying Cast on Critical Strike as a trigger breakpoint engine.
- Status: partial, third build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked worktree state, and avoided unrelated dirty files.
- Studied Cast on Critical Strike as a trigger breakpoint build, contrasting it with Toxic Rain and Righteous Fire.
- Added a structured build-study note covering:
  - hit, crit, attack-rate, cooldown-recovery, resource, and payload layers;
  - attack speed as a capped / breakpoint stat rather than always-good scaling;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - comparison against the previous DOT studies;
  - equipment-system lessons for trigger builds and UI legibility.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-cast-on-critical-strike-build-study.md`: new CoC build study.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1735_poe-cast-on-critical-strike-build-study.md`: this handoff report.

## Validation

- Read the current coop entry point, latest linked report, and report index before editing.
- Checked worktree status before editing.
- Consulted current public mechanics references:
  - PoE Wiki Cast On Critical Strike Support;
  - PoE Wiki Trigger;
  - PoE Wiki Cooldown.
- Re-read the generated note through file output after writing.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There are now three concrete PoE build-study artifacts:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold.
- Righteous Fire Chieftain: self-upkeep / max fire resistance / regeneration / walking aura.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate breakpoint trigger engine.

Together they cover three different equipment-reading habits: geometry/overlap, upkeep stability, and trigger rhythm.

## Unresolved

- The broader goal is still active; more archetypes are needed for expert-level breadth.
- This CoC pass focuses on mechanics and generalized build logic, not one live current-league poe.ninja population sample.
- Exact breakpoint numbers and specific skill payload choices should be verified again before implementing a playable CoC-inspired system.

## Recommended Next Step

Study a minion build next, preferably Spectres or Skeleton Mages. That will add externalized damage ownership: gear scales summoned entities rather than the player directly.
