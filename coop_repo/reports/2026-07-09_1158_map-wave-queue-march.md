# Agent Handoff: Map Wave Queue March

- Date: 2026-07-09
- Agent/thread: Codex
- Scope: refine `/map_progression_lab/` battle wave spawn, queue entry, and regroup movement
- Status: partial

## User Intent

The user accepted the basic terrain reference direction but found the camera/wave behavior still wrong. Within one big wave, when the previous small wave has one or fewer enemies left, the next small wave should spawn immediately. New enemies should enter as a queue and then form up, not appear as a clump. Between big waves, allies should regroup at their normal movement speed into a four-person formation, then move right together; the next enemy big wave should also walk in as a formation from the right.

## Completed

- Added a map-lab-only `marchTarget` movement rule to the mounted battle view.
- Units with `marchTarget` move using the existing battle-view `moveToward` speed and do not attack until they arrive.
- Changed same-big-wave small-wave advancement from "wait until all enemies are dead" to "advance when alive enemies are <= 1".
- Removed same-big-wave spawn delay: the next small wave now spawns immediately after the <= 1 threshold.
- New enemy waves now spawn offscreen/right-side in a staggered queue, then march into front/back formation points.
- Initial enemies are also queued into formation instead of starting already placed.
- Big-wave transition now makes allies regroup by movement speed into four slots, then march right together before the next big wave enters.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: added march-target movement patch, queued enemy entry, immediate next-small-wave trigger, and movement-speed regroup/right-march flow.
- `projects/western_fantasy_continent/map_progression_lab/styles.css`: still contains the corrected plain top-down terrain styling from the prior pass.

## Validation

- `node --check projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: passed.
- Browser/playtest validation was intentionally not run because the user asked Codex not to start or interfere with their own server workflow.

## Current State

The implementation is ready for user playtest on the user's running server. The intended read is:

1. first small wave queues in from the right;
2. when only one enemy remains, the next small wave immediately queues in;
3. after the big wave ends, allies walk back into four-person formation at normal movement speed;
4. the allied formation moves right;
5. the next big wave enters from the right as a formation.

## Unresolved

- Exact pacing and visual readability still need browser/player judgment.
- The march rule is a map-lab-local patch on the mounted battle view, not a generalized battle-view API yet.
- If this behavior is accepted, it should later become a proper shared "march / formation / spawn queue" presentation feature instead of staying as a lab-only patch.

## Recommended Next Step

Play one full `/map_progression_lab/` battle simulation and tune only formation coordinates, queue spacing, and right-march distance before promoting the idea into shared battle-view code.
