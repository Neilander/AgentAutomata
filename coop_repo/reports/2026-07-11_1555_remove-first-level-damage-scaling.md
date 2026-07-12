# Agent Handoff: Remove First-Level Enemy Damage Fitting

- Date: 2026-07-11
- Agent/thread: Codex
- Scope: correct Effort V1 fitting dimensions
- Status: complete

## User Intent

Remove the first-level enemy damage coefficient because multi-parameter effort fitting must not change an unrelated threat parameter.

## Completed

- Removed `powerScale` from every first-road profile.
- Restored first-level melee and ranged enemies to their authored base power values.
- Removed enemy power scaling from the first-level analyzer and all comparison candidates.
- Restricted fitting dimensions to variables with a direct causal relation to the target experience: melee/ranged durability, armor, and wave overlap timing.
- Kept the selected durability profile unchanged because it already meets the 4-5 visible-hit target without damage scaling.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-encounters.js`: removed profile-level enemy damage scaling.
- `projects/western_fantasy_continent/game_data/analyze-first-level-effort.js`: removed damage scaling as an available fitting parameter.

## Validation

- 80-run Effort V1: 100% wins, 4.197 average hits/enemy, 4.006 median, 74.0% strict 4-5 hit share, 0% one-hit enemies.
- Real browser battle after correction: 12.8s, 4.4 visible hits/enemy, four survivors; enemy displayed strength restored from 719 to 774.
- 40-run map cognition regression remained at 100% completion and all branch reward/retry invariants passed.
- Feedback cognition tests and `git diff --check` passed.
- Browser QA save reset afterward.

## Current State

The first-level effort target is now achieved without weakening enemy attacks. The fitted parameters describe only enemy durability and encounter pacing.

## Unresolved

- Human repeated-play judgment is still required for whether 4-5 hits feels weak-but-readable rather than tedious.

## Recommended Next Step

Use only parameters that appear in the causal model of the target sensation. For this target, do not tune player damage taken unless survivability itself becomes a separate explicit objective.

