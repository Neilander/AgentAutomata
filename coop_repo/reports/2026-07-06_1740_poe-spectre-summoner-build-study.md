# Agent Handoff: PoE Spectre Summoner Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Continue deep loot/build-design learning by studying Spectre Summoner as an externalized damage ownership engine.
- Status: partial, fourth build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked worktree state, and avoided unrelated dirty files.
- Studied Spectre Summoner as the fourth build-engine category, contrasting it with Toxic Rain, Righteous Fire, and Cast on Critical Strike.
- Added a structured build-study note covering:
  - externalized damage ownership;
  - spectre choice, minion level, minion count, minion survival, AI/positioning, auras, and commander defenses;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - comparison against previous studies;
  - equipment-system lessons for minion/companion systems.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-spectre-summoner-build-study.md`: new Spectre Summoner build study.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1740_poe-spectre-summoner-build-study.md`: this handoff report.

## Validation

- Read the current coop entry point, latest linked report, and report index before editing.
- Checked worktree status before editing.
- Consulted public mechanics / guide references:
  - PoE Wiki Raise Spectre;
  - PoE Wiki Minion;
  - PoE Vault Spectre Summoner Gear, Jewels and Flasks;
  - PoE Vault Spectre Summoner Gear Progression.
- Re-read the generated note through file output after writing.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There are now four concrete PoE build-study artifacts:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold.
- Righteous Fire Chieftain: self-upkeep / max fire resistance / regeneration / walking aura.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate breakpoint trigger engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.

Together they cover four different equipment-reading habits: geometry/overlap, upkeep stability, trigger rhythm, and external actor scaling.

## Unresolved

- The broader goal is still active; more archetypes are needed before claiming expert-level coverage.
- This pass focuses on generalized Spectre Summoner logic and did not select one current-league best spectre from poe.ninja data.
- Specific spectre monster choices, AI patterns, and support links should be validated separately before designing a playable minion analogue.

## Recommended Next Step

Study a trap, mine, or totem build next. Those builds externalize damage into temporary deployed entities rather than persistent allies, adding placement, arming/detonation, activation limits, and uptime as equipment concerns.
