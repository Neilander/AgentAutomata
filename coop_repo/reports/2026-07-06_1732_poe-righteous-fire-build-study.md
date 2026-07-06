# Agent Handoff: PoE Righteous Fire Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Continue deep loot/build-design learning by studying Righteous Fire as a self-upkeep build engine.
- Status: partial, second build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked worktree state, and avoided unrelated dirty files.
- Studied Righteous Fire Chieftain as a contrast against Toxic Rain Pathfinder.
- Added a structured build-study note covering:
  - RF as a self-upkeep fire DOT engine;
  - maximum fire resistance and regeneration as engine stats, not merely defense;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - direct comparison with Toxic Rain;
  - equipment-system lessons for self-cost / uptime builds;
  - checklist addendum for future self-upkeep build studies.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-righteous-fire-chieftain-build-study.md`: new RF build study and contrast case.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1732_poe-righteous-fire-build-study.md`: this handoff report.

## Validation

- Read the current coop entry point, latest linked report, and report index before editing.
- Checked worktree status before editing.
- Consulted current public RF / Chieftain references:
  - Pohx RF guide hub;
  - PoE Wiki Righteous Fire;
  - PoE Wiki Chieftain;
  - Mobalytics / Pohx Righteous Fire Chieftain page.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There are now two concrete PoE build-study artifacts:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask-threshold study.
- Righteous Fire Chieftain: self-upkeep / max fire resistance / regeneration / walking-aura study.

Together they start to separate broad labels like "DOT build" from the actual engine that determines equipment priorities and replacement costs.

## Unresolved

- The broader goal is still active; two builds are not enough for expert-level coverage.
- RF details were not cross-checked against a live Path of Building import or poe.ninja distribution data.
- Exact current-league popularity and top-end item distributions were not measured in this pass.

## Recommended Next Step

Study either Cast on Critical Strike or a Spectre/minion build next. Those would add a new build-engine category: trigger breakpoints / cooldowns, or externalized damage ownership through minions.
