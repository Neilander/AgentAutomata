# Agent Handoff: Map Wave Regroup

- Date: 2026-07-09
- Agent/thread: Codex current thread
- Scope: Improve `/map_progression_lab/` battle simulation wave pacing and regroup behavior.
- Status: complete

## User Intent

The user accepted the large-map camera effect and wanted the battle simulation to have better wave pacing: longer intervals, a distinction between small waves and big waves, and after a big wave ends, allies should regroup into a four-person formation while the battle camera resets toward the left-side player formation.

## Completed

- Changed the battle simulation wave labels from generic three segments to `小波 1 / 小波 2 / 大波`.
- Extended wave spacing:
  - Small wave 1 starts immediately with 3 melee enemies.
  - Small wave 2 arrives after 6.2 seconds with 2 melee + 3 ranged enemies.
  - Big wave arrives after 14.8 seconds with the standard enemy team.
- Added big-wave completion polling:
  - If all enemies are cleared, allies regroup.
  - If the big wave drags on too long, regroup can still trigger as a fallback after the timeout window.
- Added ally regroup behavior:
  - Allies are moved into a compact four-slot left-side formation.
  - Their home positions and line labels are updated.
  - Targets and attack animation state are cleared.
  - Battle camera is reset toward the left-side ally formation.
- Updated `fitUnits` camera follow to ignore dead units, so cleared enemies no longer pull the camera framing after regroup.
- Hardened wave cleanup so both timeouts and polling intervals are cleared when restarting preview/play.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/index.html`: updated wave-strip labels.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: added small/big wave pacing, big-wave clear polling, ally regroup, camera-left reset, and timer cleanup.
- `projects/western_fantasy_continent/battle_view/battle-view.js`: `fitUnits` camera now follows only alive units.

## Validation

- `node --check projects\western_fantasy_continent\map_progression_lab\map-progression-lab.js`: passed.
- `node --check projects\western_fantasy_continent\battle_view\battle-view.js`: passed.
- `Invoke-WebRequest http://localhost:3777/map_progression_lab/`: returned 200.

## Current State

The battle simulation now reads as a paced enemy-wave prototype rather than all reinforcements arriving almost immediately. The large-map camera remains unchanged from the previous pass, and the battle camera should no longer be dragged toward dead enemies after a wave is cleared.

## Unresolved

- Browser visual QA still needed for exact timing feel.
- The big-wave clear check uses enemy-clear polling plus a timeout fallback; it is not yet a fully authored wave director with multiple big-wave chapters.

## Recommended Next Step

Open `/map_progression_lab/`, switch to battle simulation, and watch one full run. Tune only the `delay` values or regroup slot positions if the cadence still feels off.
