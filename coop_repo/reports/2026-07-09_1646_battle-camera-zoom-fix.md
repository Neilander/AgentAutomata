# Agent Handoff: Battle Camera Zoom Fix

- Date: 2026-07-09
- Agent/thread: Codex current thread
- Scope: Fix first-pass battle camera integration where world positions were projected but visual scale stayed too small/flat.
- Status: complete

## User Intent

User tested the shared battle camera integration and found that the battle looked too far away: unit avatars stayed normal-sized while projected positions compressed the battlefield, so visual scale did not match camera zoom.

## Completed

- Changed battle camera zoom from a fixed `1.x` value to viewport-derived pixels-per-world-unit.
- Reduced keep-all-units padding from the incorrect large world-space value to a tighter battle-space padding.
- Raised the default/follow zoom so combat appears closer.
- Added visual scaling for unit DOM nodes based on `camera.zoom / baseViewportZoom`.
- Applied the same visual scale to ring and slash VFX via their existing `--scale` CSS variable.

## Files Changed

- `projects/western_fantasy_continent/battle_view/battle-view.js`: corrected camera zoom model and visual scale application.

## Validation

- `node --check projects\western_fantasy_continent\battle_view\battle-view.js`: passed.
- `node tests\game_camera_2d.test.js`: passed.

## Current State

The battle camera now treats the old `0..100` battle coordinates as world units and derives zoom from the actual battle viewport size. This should make units occupy a similar visual scale to the old percent layout while still letting the camera move/fit/follow.

## Unresolved

- Browser visual QA still needed to tune exact closeness.
- Only unit, slash, and ring scale were adjusted; labels/floaters remain mostly fixed-size for readability.

## Recommended Next Step

Reload one battle page through the local server and check whether unit spacing now feels close enough. If it is still too far, tune `padding`, `minZoom`, and `maxZoom` in `battle-view.js` near the `createKeepTargetsInViewMode` setup.
