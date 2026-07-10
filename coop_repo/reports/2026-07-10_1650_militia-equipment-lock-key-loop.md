# Agent Handoff: Militia Equipment Lock-Key Loop

- Date: 2026-07-10
- Agent/thread: Codex main thread with bounded two-agent playtest cycles
- Scope: `projects/western_fantasy_continent/map_progression_lab/` Region 1 only
- Status: complete

## User Intent

Iterate the isolated map lab through repeated “change -> two knowledge-bounded player agents -> analyze -> adjust” cycles. Integrate militia scarcity, the accepted equipment model, one-time key encounters, manual character replacement, and diagnosable gear progression without touching formal skills/base stats or reconnecting the lab to Mercenary Town.

## Completed

- Added a shared 2-hero/4-militia initial roster and a manually recruited Ranger.
- Added an 8-slot formal equipment runtime with level base stats, rarity affix counts, focused affixes, and role-aware auto-equip.
- Rebuilt Region 1 order around Main 3 Prison discovery, Main 5 one-shot Camp key, manual Ranger swap, Main 7 role evidence, and a farm-before-retry Boss loop.
- Split human and Agent resolution: human clicks run the real incremental battle view; Agent tests use instant reports from the same `CombatSimulation` contract.
- Fixed fixed-step visual simulation, seed/drop parity, stale wave timers, reset-result contamination, refresh-to-cancel, real-time contribution reporting, and Boss time-limit false victories.
- Ran multiple two-agent playtest cycles and closed every agent after each cycle.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-roster.js`: shared hero/militia roster and team construction.
- `projects/western_fantasy_continent/game_data/equipment-runtime.js`: formal equipment generation, application, scoring, and auto-equip.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: map order, real battle settlement, manual team management, drops, interruption recovery, and diagnostics.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core.js`: knowledge-bounded state, actions, memories, goals, and real combat reports.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-batch.js`: batch progression metrics.
- `projects/western_fantasy_continent/battle_view/battle-view.js`: deterministic fixed-step visual simulation.
- `projects/western_fantasy_continent/map_progression_lab/index.html`: runtime load order and team-management dialog.
- `projects/western_fantasy_continent/map_progression_lab/styles.css`: team-management UI.
- `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-10_1650_militia-equipment-lock-key-loop.md`: complete iteration record.

## Validation

- `node --check` on all changed JavaScript: passed.
- `node game_data/analyze-map-cognition-batch.js 200`: 100% final completion; 11.0% first Prison win; 74.7% first post-Camp Prison win; 43.5% first Boss win; 44.6% average Ranger Main 7 damage share.
- Fixed-step parity comparison against headless `CombatSimulation`: exact winner, duration, and HP match.
- Final Agent audit: 200/200 Boss clears had zero living enemies; 192/192 time-limit results were failures.
- Final strict player Agents: two complete 15/16-step flows, no illegal actions, no deadlock, no blocking issue.

## Current State

Region 1 now provides a coherent early loop: weak militia establish scarcity, Prison creates desire for a hero, Camp acts as a one-time equipment key, Ranger requires a player decision, Main 7 validates that decision, and Boss failure returns the player to the latest repeatable main node. Formal skills and base stats were not changed.

## Unresolved

- Browser visual QA was not run because this pass did not start the local server.
- Regions 2 and 3 remain placeholders.
- Enemy/drop definitions are still duplicated between page and cognition core, although parity is tested; extract a shared encounter contract before expanding more regions.

## Recommended Next Step

Have the user play Region 1 in the browser. If its pacing is accepted, extract the shared encounter contract, then use the same lock-key method to design Region 2 rather than reconnecting to Mercenary Town immediately.

