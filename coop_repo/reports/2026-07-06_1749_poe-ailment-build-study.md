# Agent Handoff: PoE Ailment Build Study

- Date: 2026-07-06
- Agent/thread: Codex goal continuation
- Scope: Continue deep loot/build-design learning by studying Ignite, Poison, and Bleed as ailment application engines.
- Status: partial, sixth build study complete

## User Intent

Build long-term expert judgment for Path of Exile and similar loot games: explain a build's core engine, identify which gear/passive/gem pieces are essential, predict what happens when they are replaced, and convert the learning into reusable equipment-system design knowledge.

## Completed

- Followed repository coordination rules: read `coop_repo/LATEST.md`, opened the latest report, checked worktree state, and avoided unrelated dirty files.
- Studied Ignite, Poison, and Bleed as the sixth build-engine category, contrasting them with the previous five study artifacts.
- Added a structured build-study note covering:
  - ailment application engines;
  - one-big-application versus many-stack logic;
  - qualifying hit, chance to inflict, base damage, duration, stack/replacement rules, and enemy mitigation;
  - slot-by-slot equipment responsibilities;
  - mandatory functions vs swappable item names;
  - replacement matrix;
  - budget progression logic;
  - comparison against previous studies;
  - equipment-system lessons for status effects and stack rules.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_progression/poe-ailment-build-study.md`: new ailment build study.
- `coop_repo/LATEST.md`: updated latest report pointer to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this report entry.
- `coop_repo/reports/2026-07-06_1749_poe-ailment-build-study.md`: this handoff report.

## Validation

- Read the current coop entry point, latest linked report, and report index before editing.
- Checked worktree status before editing.
- Consulted public mechanics references:
  - PoE Wiki Ignite;
  - PoE Wiki Poison;
  - PoE Wiki Bleeding;
  - PoE Wiki Ailment.
- Re-read the generated note through file output after writing.
- No local app or combat simulator test was needed because this was documentation / design research only.

## Current State

There are now six concrete PoE build-study artifacts:

- Toxic Rain Pathfinder: overlap / chaos DOT / gem-level / flask threshold.
- Righteous Fire Chieftain: self-upkeep / max fire resistance / regeneration / walking aura.
- Cast on Critical Strike: hit + crit + cooldown + attack-rate breakpoint trigger engine.
- Spectre Summoner: externalized minion ownership / minion level / minion count / army uptime.
- Traps, Mines, and Totems: temporary deployed entities / setup time / entity limits / activation reliability.
- Ignite, Poison, and Bleed: ailment application / stack rules / duration / enemy mitigation.

Together they cover six different equipment-reading habits: geometry/overlap, upkeep stability, trigger rhythm, persistent external actors, temporary deployment cadence, and status application logic.

## Unresolved

- The broader goal is still active; more archetypes and synthesis work are needed before claiming expert-level coverage.
- This pass focuses on generalized ailment logic and did not select one current-league ignite/poison/bleed meta build from poe.ninja data.
- Exact values and skill-specific interactions should be verified separately before implementing a playable ailment analogue.

## Recommended Next Step

Study a charge / resource loop build next, such as Power Charge stacking, Frenzy Charge scaling, or Rage/Berserk. That would add temporary internal-resource upkeep and spend/convert logic to the build-engine taxonomy.
