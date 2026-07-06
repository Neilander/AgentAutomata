# Agent Handoff: PoE Charge Resource Loop Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Continue deep loot/build-design learning by studying Power/Frenzy/Endurance Charges, Rage, and Berserk as temporary resource-loop engines.
- Status: partial, seventh build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked worktree state, and avoided unrelated dirty files.
- Studied charge and resource loops as the seventh build-engine category, contrasting them with the previous six study artifacts.
- Added a structured build-study note covering:
  - resource generation, capacity, duration/decay, spend/conversion, uptime, and content reliability;
  - Power/Frenzy/Endurance Charge and Rage/Berserk sub-engines;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - comparison against previous studies;
  - equipment-system lessons for temporary internal resources.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-charge-resource-loop-build-study.md`: new charge/resource-loop build study.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1753_poe-charge-resource-loop-build-study.md`: this handoff report.

## Validation

- Read the current coop entry point, latest linked report, and report index before editing.
- Checked worktree status before editing.
- Consulted public mechanics references:
  - PoE Wiki Charge;
  - PoE Wiki Power charge;
  - PoE Wiki Frenzy charge;
  - PoE Wiki Endurance charge;
  - PoE Wiki Rage;
  - PoE Wiki Berserk.
- Re-read the generated note through file output after writing.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There are now seven concrete PoE build-study artifacts:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold.
- Righteous Fire Chieftain: self-upkeep / max fire resistance / regeneration / walking aura.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate breakpoint trigger engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.
- Traps, Mines, and Totems: temporary deployed entities / setup time / entity limits / activation reliability.
- Ignite, Poison, and Bleed: ailment application / stack rules / duration / enemy mitigation.
- Charges, Rage, and Berserk: temporary internal resources / generation / uptime / spend timing.

Together they cover seven different equipment-reading habits: geometry/overlap, upkeep stability, trigger rhythm, persistent external actors, temporary deployment cadence, status application logic, and resource-loop economy.

## Unresolved

- The broader goal is still active; synthesis work is now increasingly important.
- This pass focuses on generalized charge/resource-loop logic and did not select one current-league charge-stacking or Rage/Berserk meta build from poe.ninja data.
- Exact resource values and item-specific interactions should be verified separately before implementing a playable analogue.

## Recommended Next Step

Study a low-life, energy-shield, or reservation-stacking build next. That would add intentional life/ES reservation and aura economy as another equipment engine.
