# Agent Handoff: First-Level Weak-Wave Combat

- Date: 2026-07-10
- Agent/thread: Codex main thread
- Scope: `r1_main_1` formal wave combat and shared unified-simulation reinforcement support
- Status: complete, browser presentation pending

## User Intent

Shorten the perceived length of early combat by replacing the first level's static enemy team with the previously established big-wave/small-wave structure, using only weak enemies and leaving later levels unchanged.

## Completed

- Redesigned `r1_main_1` as two big waves and three enemy entries: `3 melee -> 1 melee + 2 ranged -> regroup/march -> 2 melee + 2 ranged`.
- Made all ten first-level enemies deliberately weak and removed functional skills, passives, and ultimates.
- Added a unified-simulation reinforcement entry point to `battle-view`; reinforcements are inserted into the existing `CombatSimulation` instead of using a second combat implementation.
- Reused the existing ally regroup, formation march, camera, and right-side enemy entry behavior between the two big waves.
- Updated first-level map and cognition descriptions without changing later-node enemy teams or progression.
- Recorded the design-state analysis in `design/map_cognition_iterations/2026-07-10_1230_first-level-wave-combat.md`.

## Files Changed

- `projects/western_fantasy_continent/battle_view/battle-view.js`: added unified-combat reinforcement insertion and stable display/simulation identity matching.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-encounters.js`: added isolated first-road wave data and weak enemy specs.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: enabled formal wave direction only for `r1_main_1`, including small-wave overlap and big-wave regroup.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core.js`: updated the visible first-level enemy hint.
- `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-10_1230_first-level-wave-combat.md`: recorded problem verification, design, and metrics.

## Validation

- JavaScript syntax checks for all four runtime files: passed.
- `git diff --check`: passed.
- 60 deterministic shared-combat replays: 100% win rate, 9.0s average, 8.8-9.5s range, four surviving allies on average.
- Existing map-cognition mainline batch still runs successfully.
- Browser QA: not run because `127.0.0.1:3777` was not active; no extra server was started.

## Current State

The first playable node now uses the project's established wave grammar and real combat engine. Only `r1_main_1` activates formal reinforcements; all later encounters retain their current definitions.

## Unresolved

- Human review is still needed for visual entry spacing, regroup pacing, and whether the total real-time feel is short enough with the 0.5-second regroup pause.
- Headless cognition simulation still resolves the first node as its former compact proxy fight; it remains valid for route completion but does not measure formal wave presentation.

## Recommended Next Step

Start the user's normal local server, reset the map-lab save, and play `1-1` once. Judge kill cadence, reinforcement arrival, and regroup duration before applying waves to any other node.

