# Agent Handoff: First-Level Ten-Hit Experiment

- Date: 2026-07-11
- Agent/thread: Codex
- Scope: first-level ordinary-enemy effort experiment
- Status: complete

## User Intent

Try a substantially more durable first level where each ordinary enemy takes about ten visible hits.

## Completed

- Scanned uniform-HP and split melee/ranged durability candidates.
- Found uniform scaling produced a visible role mismatch: melee enemies took about 11 hits while ranged enemies took about 9.
- Added `effort_v2` with melee HP 216, ranged HP 214, unchanged armor 2, unchanged authored enemy damage, and next-wave overlap at three enemies remaining.
- Generalized the analyzer target band from hardcoded 4-5 to configurable 9-11 hit metrics.
- Made Effort V2 the playable first-road default while preserving V0/V1 profiles for comparison.

## Validation

- 200-run selected candidate: 9.916 average hits/enemy; melee 9.792 and ranged 10.100; 27.155s average duration; four average survivors.
- 80-run stored Effort V2: 9.911 average hits/enemy, 9.581 median, 100% wins.
- Real browser battle: 9.9 visible hits/enemy, 25.44s clear, four survivors, no enemy damage coefficient.
- Expected-player-state panel classified the result as prolonged focus fire and reduced feedback reserve from 38 to 28.6, making the possible pacing cost visible.
- JavaScript syntax, cognition unit tests, and `git diff --check` passed; browser QA save was reset.

## Current State

The playable first level is now an explicit ten-hit experiment, not a final accepted balance point. Enemy attack values remain untouched.

## Unresolved

- Only 37.4% of individual enemies land inside the strict 9-11 band despite the near-perfect average, because target switching, overkill, and damage variance create a broad distribution.
- The battle is roughly twice as long as Effort V1 and the cognition model considers it draining. Human play should decide whether that is useful weight or excessive friction.

## Recommended Next Step

Compare Effort V1 and V2 by feel. If ten hits is too slow but four hits is too light, fit a 7-8-hit midpoint without changing enemy damage.

