# Agent Handoff: PoE Deployed Entity Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Continue deep loot/build-design learning by studying traps, mines, and totems as temporary deployed-entity engines.
- Status: partial, fifth build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked worktree state, and avoided unrelated dirty files.
- Studied traps, mines, and totems as the fifth build-engine category, contrasting them with Toxic Rain, Righteous Fire, Cast on Critical Strike, and Spectre Summoner.
- Added a structured build-study note covering:
  - deployed temporary entity engines;
  - trap arming/triggering, mine detonation rhythm, and totem autonomous uptime;
  - deployment speed, entity limits, activation reliability, duration, payload, and setup safety;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - comparison against previous studies;
  - equipment-system lessons for turrets, traps, constructs, and setup windows.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-deployed-entity-build-study.md`: new deployed-entity build study.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1746_poe-deployed-entity-build-study.md`: this handoff report.

## Validation

- Read the current coop entry point, latest linked report, and report index before editing.
- Checked worktree status before editing.
- Consulted public mechanics references:
  - PoE Wiki Trap;
  - PoE Wiki Mine;
  - PoE Wiki Totem;
  - PoE Wiki Ballista Totem Support.
- Re-read the generated note through file output after writing.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There are now five concrete PoE build-study artifacts:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold.
- Righteous Fire Chieftain: self-upkeep / max fire resistance / regeneration / walking aura.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate breakpoint trigger engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.
- Traps, Mines, and Totems: temporary deployed entities / setup time / entity limits / activation reliability.

Together they cover five different equipment-reading habits: geometry/overlap, upkeep stability, trigger rhythm, persistent external actors, and temporary deployed-entity cadence.

## Unresolved

- The broader goal is still active; more archetypes are needed before claiming expert-level coverage.
- This pass focuses on generalized trap/mine/totem logic and did not select one current-league best skill or poe.ninja population sample.
- Specific deployed-entity numbers, activation AI, and skill-specific payload tags should be verified separately before implementing a playable analogue.

## Recommended Next Step

Study an ailment build next, such as Ignite, Poison, or Bleed. Ailments add one-big-hit versus many-hit application logic, duration, chance to inflict, enemy resistance, and stacking rules.
