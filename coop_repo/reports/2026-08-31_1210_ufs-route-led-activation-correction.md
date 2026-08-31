# Agent Handoff: UFS route-led activation correction

- Date: 2026-08-31
- Agent/thread: root / codex/simulate-player-next
- Scope: correct full-convergence activation into trigger-side-only Q-before, Q-after and operation routes
- Status: controlled UFS route test complete; earlier conjunction policy superseded

## User Intent

Activation should validate the side that caused recall. A result goal may awaken memories with different starts, methods and side effects; a starting-state cue may awaken different methods/results; an operation cue may awaken different contexts/results. Do not require all three sides to match and do not use non-UFS examples for the test.

## Completed

- Built a five-memory UFS bank covering research +2/cost2, research +1/cost3, zero advance, reversed research operations and energy-room gain.
- Implemented three independent route runners with no aggregation.
- Q-after “research increases” accepted the +2, +1 and reversed-operation memories; it preserved energy costs -2/-3/-2 and rejected energy-room research-0.
- Q-before “resolvable research room in rooms phase” accepted all four research-room starts regardless of later operation/result.
- Operation `resolve research room → choose advance` accepted advance2, advance1 and advance0 regardless of numerical parameters or endpoints; reversed order and one-step energy resolution did not match.
- Repeated each route with deliberately wrong non-trigger sides and proved activated/accepted IDs were invariant.
- Recorded exactly one `triggeredBy` route per candidate and no average/joint/aggregate field.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_route_led_activation_v0/PROTOCOL.md`: corrected route-led contract and expected sets.
- `projects/western_fantasy_continent/experiments/ufs_route_led_activation_v0/fixture.json`: UFS memory bank and route cues.
- `projects/western_fantasy_continent/experiments/ufs_route_led_activation_v0/run-route-led.js`: real-GTE endpoint and structural-operation route runner.
- `projects/western_fantasy_continent/experiments/ufs_route_led_activation_v0/RESULTS.md`: measured route sets, side effects and limits.
- `coop_repo/LATEST.md`: correction entry.

## Validation

- All three expected accepted sets: passed.
- Non-trigger decoy invariance: 3/3 passed.
- Result-side energy costs preserved, including -3: passed.
- Single route provenance and no aggregate fields: passed.
- Profiles, formal games and runtime source remained unchanged.
- `git diff --check`: passed with existing line-ending warnings only.

## Current State

The earlier `complete_convergence` idea is no longer the activation policy. Its evidence-separation implementation remains informative, but a candidate does not need all three channels to agree before being remembered. The triggering route alone determines activation-side acceptance; the other sides travel with the recalled trajectory for later use.

This restores broad associative recall: a desired research gain awakens costly and structurally different methods, while a shared research-room start awakens both productive and zero-yield histories.

## Unresolved

- Define the next-stage use of route provenance without retroactively turning it into an all-channel activation gate.
- Generate route cues from actual noticed UFS state/goal/considered operations.
- Decide how many candidates each route retains at scale.
- Test post-recall applicability and legality while preserving result-led and state-led generality.
- Connect to newly learned real multi-step memories; revision-9 historical rows still lack operations.

## Recommended Next Step

Test post-recall handling separately for each provenance: result-led memories should be checked as possible methods toward a goal, Q-before-led memories as possible continuations, and operation-led memories as possible consequences. Never require the non-trigger sides to have matched during recall.

