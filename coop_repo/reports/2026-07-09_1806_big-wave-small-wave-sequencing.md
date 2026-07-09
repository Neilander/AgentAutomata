# Agent Handoff: Big Wave Small Wave Sequencing

- Date: 2026-07-09
- Agent/thread: Codex current thread
- Scope: Correct `/map_progression_lab/` battle simulation wave hierarchy.
- Status: complete

## User Intent

The user clarified the intended hierarchy: small waves should not reset formation. A big wave contains several small waves. Only after a big wave ends should allies reform into the normal four-person formation, and that reform/camera movement should lerp rather than teleport. The first big wave is two small monster waves; the second big wave is one standard enemy team.

## Completed

- Replaced the flat wave sequence with a big-wave model:
  - Big wave 1 contains two small waves:
    - 1-1 melee scouting wave.
    - 1-2 mixed melee/ranged wave.
  - Big wave 2 contains the standard enemy team.
- Small wave 1 now clears into small wave 2 without regrouping.
- After big wave 1 finishes, allies reform into the left-side four-person formation.
- Ally regroup now animates over roughly 950ms instead of teleporting.
- Camera movement during regroup uses camera `moveToward`, so it lerps back toward the left-side formation.
- Stop/restart cleanup now cancels animation frames as well as timeouts/intervals.
- Updated the battle simulation wave-strip labels to `大波 1-1 / 大波 1-2 / 大波 2`.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/index.html`: updated wave-strip labels.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: introduced big-wave/small-wave sequencing and animated regroup/camera lerp between big waves.

## Validation

- `node --check projects\western_fantasy_continent\map_progression_lab\map-progression-lab.js`: passed.
- `node --check projects\western_fantasy_continent\battle_view\battle-view.js`: passed.
- `Invoke-WebRequest http://localhost:3777/map_progression_lab/`: returned 200.

## Current State

The battle simulation should now read as: fight two small waves as one continuous big wave, then regroup smoothly, then fight the standard-team big wave.

## Unresolved

- Browser visual QA still needed for exact regroup duration and camera framing.
- Final big wave currently does not regroup afterward, matching the current prototype's "last wave" behavior.

## Recommended Next Step

Watch one full `/map_progression_lab/` battle simulation run. Tune only `nextDelay` values and the `duration` in `regroupAllies` if the transition feels too rushed or too slow.
