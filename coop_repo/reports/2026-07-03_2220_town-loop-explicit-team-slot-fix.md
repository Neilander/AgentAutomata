# Agent Handoff: Town Loop Explicit Team Slot Fix

- Date: 2026-07-03
- Agent/thread: Codex town-loop slot fix
- Scope: Fix team prep placement so clicked slots are exact slots, not compacted order.
- Status: complete

## User Intent

The user reported that selecting a hero and clicking a specific team position still placed the hero by compacted order. For example, clicking `后排 2` should put the selected hero directly into `后排 2`, not the next available backline position.

## Completed

- Added explicit `teamSlot` state on heroes.
- Initial active heroes now get slots `0-3`.
- Existing/older active heroes without valid `teamSlot` are normalized into available slots.
- `teamSlots()` now reads heroes by exact `teamSlot` instead of by sorted active array position.
- Clicking a slot now writes `hero.teamSlot = slotIndex`.
- Replacing an occupied slot clears the old hero's active state and slot.
- Active-team ordering now sorts by explicit `teamSlot`.
- Recruited heroes that auto-enter the team get the first open explicit slot.

## Files Changed

- `projects/western_fantasy_continent/town_loop/town-loop.js`: changed active-team placement from formation/order-derived positions to explicit slot state.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node -c projects/western_fantasy_continent/town_loop/town-loop.js`: passed.
- Browser check on `/town_loop/team.html`:
  - selected the fifth roster hero;
  - clicked the fourth team slot (`后排 2`);
  - verified the selected hero appeared in the `后排 2` slot specifically;
  - no project console errors were reported.

## Current State

Team placement now matches the user's intended model: select a hero, click a concrete slot, and that exact slot changes.

## Unresolved

- Slot placement is still click-based, not drag-and-drop.

## Recommended Next Step

Play the team prep page normally and check whether replacing an occupied slot should bench the old hero, swap with the selected hero's previous slot, or prompt later. Current behavior benches the old occupant.
