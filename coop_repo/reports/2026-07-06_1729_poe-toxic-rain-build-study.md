# Agent Handoff: PoE Toxic Rain Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Deepen loot/build-design expertise by studying one Path of Exile build as a mechanism and replacement-cost case study.
- Status: partial, first build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked the worktree before editing, and avoided unrelated dirty files.
- Selected Toxic Rain Pathfinder as the first focused study because it exposes several useful expert concepts:
  - chaos damage-over-time scaling instead of generic bow hit DPS;
  - gem-level scaling;
  - attack-speed and pod-overlap cadence;
  - area-of-effect sweet spot rather than simple "more is better";
  - Pathfinder flask identity as part of the equipment engine;
  - Lightning Coil / physical-to-element defense as a mechanism item pattern.
- Added a structured build-study note covering:
  - one-sentence core;
  - core engine layers;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - reusable design lessons for this project's equipment system;
  - checklist for future build studies.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-toxic-rain-pathfinder-build-study.md`: new first PoE build study and equipment-system reference.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1729_poe-toxic-rain-build-study.md`: this handoff report.

## Validation

- Read current coop entry point, latest linked report, and worktree status before editing.
- Opened current public reference pages for Toxic Rain Pathfinder and Pathfinder:
  - PoE Vault Toxic Rain Pathfinder Build Guide;
  - PoE Vault Toxic Rain Pathfinder Gear, Jewels and Flasks;
  - PoE Wiki Pathfinder.
- Re-read the beginning of the generated study note after writing.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There is now a first concrete build-analysis artifact for the active long-term goal. It frames Toxic Rain Pathfinder as a build engine, not just an item list, and gives a reusable checklist for future PoE build studies.

## Unresolved

- This is only one build; it does not yet prove broad expertise across archetypes.
- The study relies on public guide pages and was not cross-validated against a live Path of Building import or poe.ninja population data.
- Exact current-league metagame popularity was not measured in this pass.

## Recommended Next Step

Study Righteous Fire next. It is also damage-over-time, but its engine is self-burn sustain, regeneration, maximum fire resistance, aura reservation, and walking uptime. Comparing it with Toxic Rain should sharpen the distinction between broad damage labels and the real engine that keeps a build alive.
