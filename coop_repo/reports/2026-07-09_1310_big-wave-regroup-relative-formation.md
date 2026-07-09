# Agent Handoff: Big Wave Regroup Relative Formation

- Date: 2026-07-09
- Agent/thread: Codex
- Scope: refine `/map_progression_lab/` big-wave transition behavior
- Status: partial

## User Intent

After the first big wave behaves correctly, the user wants big-wave completion to enter a clear regroup phase. During regroup, the camera should default to half-field observation on the right side. All surviving allied characters should reform the same relative formation as the opening layout, using the current leftmost allied character as the anchor. The anchor should not travel far horizontally, though a small vertical adjustment is acceptable. After regroup completes, the party should wait `0.5s` before marching right.

## Completed

- Added `allyOpeningSlots` matching the opening 4-slot allied formation.
- Changed `regroupAllies` so it computes march targets from opening-slot relative offsets instead of fixed absolute positions.
- Anchored regroup formation on the current leftmost living ally.
- Added a `500ms` pause after regroup completion before `marchAlliesRight`.
- Changed regroup and right-march camera behavior to use right-side half-field observation anchored on the leftmost living ally.
- Added basic no-alive-ally guards for regroup/march transitions.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`

## Validation

- `node --check projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: passed.
- Browser validation was not run; the user is using their own running server.

## Current State

The first big wave should clear, then allies should regroup around the leftmost ally using the original formation relationship, pause for half a second, and then march right before the next big wave enters.

## Unresolved

- Needs user playtest to confirm whether the vertical regroup offset feels natural.
- If the leftmost unit is a frontliner instead of a backliner, the formation will still preserve that unit as the horizontal anchor; this is intentional per the current user request but may need tuning later.

## Recommended Next Step

Refresh `/map_progression_lab/` and test the transition from big wave 1 to big wave 2.
