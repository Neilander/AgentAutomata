# Agent Handoff: Battle Camera Model Note

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: record withdrawn battle-camera experiment and future camera model
- Status: complete

## User Intent

The user withdrew the temporary battle-simulation camera behavior and wanted the real desired camera concept recorded for future design.

## Completed

- Recorded the future battle camera model in the durable western-fantasy project overview.
- Clarified that the correct direction is a viewport/camera system, not a unit-position hack.
- Confirmed the current `/map_progression_lab/` script no longer contains the temporary `configureBattleCamera` / movement patch logic.

## Files Changed

- `projects/western_fantasy_continent/PROJECT_OVERVIEW.md`: added `Battle Camera Model` under battle display guidance.
- `coop_repo/reports/2026-07-08_2227_battle-camera-model-note.md`: this handoff report.
- `coop_repo/LATEST.md`: updated latest pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `rg -n "Battle Camera Model|temporary map-lab|world coordinates" projects/western_fantasy_continent/PROJECT_OVERVIEW.md`: confirmed the new overview note is present.
- `rg -n "configureBattleCamera|patchBattleMovement|fastEntry|entryEndX|cameraAnchor" projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: confirmed no temporary camera movement patch remains.

## Current State

The desired model is now documented:

- in combat, the camera normally stays stable;
- if living units touch or threaten the viewport boundary, the camera may pan or zoom out;
- once units no longer touch the boundary, the camera may shrink back smoothly;
- outside combat, the camera may reframe the party toward the left to leave room for the next wave.

## Unresolved

- The actual camera/viewport system is not implemented.
- Future implementation should separate world coordinates from screen coordinates in `battle-view` instead of changing combat movement rules.

## Recommended Next Step

When revisiting multi-wave battle presentation, start from `projects/western_fantasy_continent/PROJECT_OVERVIEW.md` > `Battle Camera Model`, then design a battle-view camera layer before changing unit movement.
