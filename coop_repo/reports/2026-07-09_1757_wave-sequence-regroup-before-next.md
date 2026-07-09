# Agent Handoff: Wave Sequence Regroup Before Next

- Date: 2026-07-09
- Agent/thread: Codex current thread
- Scope: Correct `/map_progression_lab/` battle simulation wave reset timing.
- Status: complete

## User Intent

The user clarified that camera reset/regroup should happen after the previous wave ends, before the next wave appears. The second wave should then enter and fight normally from a reset left-side ally formation.

## Completed

- Replaced absolute-time wave spawning with a sequential wave director:
  - Start small wave 1.
  - Poll until current wave enemies are cleared.
  - Regroup allies and reset the camera to the left-side formation.
  - Wait briefly, then spawn the next wave.
  - Repeat for small wave 2, then big wave.
- Kept the three authored waves:
  - Small wave 1: 3 melee.
  - Small wave 2: 2 melee + 3 ranged.
  - Big wave: standard enemy team.
- Reused existing regroup behavior so allies re-form before each later wave.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: changed wave timing from fixed delayed spawns to clear-regroup-next sequencing.

## Validation

- `node --check projects\western_fantasy_continent\map_progression_lab\map-progression-lab.js`: passed.
- `node --check projects\western_fantasy_continent\battle_view\battle-view.js`: passed.
- `Invoke-WebRequest http://localhost:3777/map_progression_lab/`: returned 200.

## Current State

The battle simulation now has the intended rhythm: fight a wave, regroup/reset camera, then face the next wave. Later waves no longer enter while the previous wave is still unresolved unless the fallback timeout is reached.

## Unresolved

- Browser visual QA still needed for exact pause length between regroup and next wave.
- The wave-clear poll still has a timeout fallback so the sequence cannot stall forever if a combat bug leaves an enemy alive.

## Recommended Next Step

Watch one full battle simulation run and tune only `regroupDelay` values if the pause before the next wave feels too short or too long.
