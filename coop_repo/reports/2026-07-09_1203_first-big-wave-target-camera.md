# Agent Handoff: First Big Wave Target And Camera Fix

- Date: 2026-07-09
- Agent/thread: Codex
- Scope: fix first-big-wave target priority, small-wave threshold, and camera rightward movement in `/map_progression_lab/`
- Status: partial

## User Intent

The user found the first big wave still wrong: after the next small wave spawned, allies immediately attacked the new back wave instead of finishing the earlier/front enemies. The next small wave should spawn when two enemies remain. When the second small wave appears, the camera should shift the whole view right instead of feeling locked.

## Completed

- Changed same-big-wave next-small-wave threshold from `<= 1` living enemy to `<= 2`.
- Added `spawnSerial` to enemy batches.
- Overrode the map-lab mounted battle view's target selection for allies so they only target the earliest living enemy batch.
- New incoming enemies are `targetable = false` while marching in, then become targetable after reaching formation.
- Added a rightward camera nudge when a new enemy wave enters, so first-big-wave wave 1-2 should pull the camera right more visibly.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: target priority, wave threshold, incoming targetability, and camera nudge.

## Validation

- `node --check projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: passed.
- Browser/playtest validation was intentionally not run; the user asked Codex not to start its own server.

## Current State

First big wave behavior should now be:

1. wave 1-1 fights normally;
2. when two or fewer enemies remain, wave 1-2 immediately queues in from the right;
3. allies keep targeting the older wave batch first;
4. new enemies cannot be targeted while still marching into formation;
5. the camera is nudged right when the new wave enters.

## Unresolved

- Needs user playtest to judge whether the camera nudge is strong enough.
- Second big wave behavior was intentionally not redesigned in this pass.

## Recommended Next Step

Play only the first big wave in `/map_progression_lab/`. If the camera still feels too locked after wave 1-2 enters, increase `nudgeBattleCameraRight` target `x` or alpha before touching second-big-wave logic.
