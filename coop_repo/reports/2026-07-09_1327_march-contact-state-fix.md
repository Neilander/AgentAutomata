# Agent Handoff: March Contact State Fix

- Date: 2026-07-09
- Agent/thread: Codex
- Scope: refine `/map_progression_lab/` battle-simulation marching and contact behavior
- Status: partial

## User Intent

The user reported two small bugs in the wave battle simulation:

- If no enemy is within a certain range, the scene is in marching state, and all character movement speed should be a fixed value.
- Enemies should not be forced to walk all the way to a preset position before attacking.

## Completed

- Added a local fixed march speed for map-lab march targets.
- Changed both out-of-combat ally marching and in-combat `marchTarget` movement to use fixed march movement instead of the shared `battle-view` movement helper.
- Added a march contact range. A unit with a `marchTarget` now cancels marching and enters normal combat behavior when a target is within `max(unit.range, 22)`.
- Kept normal combat chase/attack behavior unchanged after contact.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`

## Validation

- `node --check projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: passed.
- Browser validation was not run; the user is using their own running server.

## Current State

Marching should now read as a uniform movement state, while incoming enemies can peel out of formation and fight once they are close enough instead of waiting to reach their formation slot.

## Unresolved

- The exact contact distance `22` is an initial feel value and may need playtest tuning.
- This remains a map-lab-local patch rather than a global `battle-view` rule.

## Recommended Next Step

Refresh `/map_progression_lab/` and test the transition into big wave 2, watching whether incoming enemies begin fighting at the right distance.
