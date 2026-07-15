# Agent Handoff: Continuous Combat Performance For Expectation

- Date: 2026-07-15
- Agent/thread: Codex current thread
- Scope: player-emotion-simulation / decision expectation prerequisite
- Status: complete

## User Intent

Replace binary win/loss as the observed combat result used by expectation mismatch so the player model can distinguish a crushing loss, close loss, close win, and crushing win. Do not yet invent the expected improvement produced by a roster/equipment decision.

## Completed

- Added real team-size evidence to Chapter 1 and Chapter 2 combat result events.
- Added `normalized_remaining_hp_margin_v1` to the V3 map event adapter.
- The continuous score is `average player remaining HP ratio - average enemy remaining HP ratio`, clamped to `[-1, 1]`.
- Attached the score to both the visible combat result and the action summary.
- Made the action-summary expectation settlement use the continuous score as `actualUtility`.
- Kept direct win/loss, loot, unlock, and equipment feedback on their existing result channels.
- Kept a legacy fallback: events without HP/team-size evidence still use the prior fixed win/loss settlement.
- Added a focused regression proving `-0.9` hard loss, `-0.1` close loss, `+0.1` close win, and `+0.9` clean win, plus learned hard-loss expectation improving on a later close loss.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: add real player/enemy initial team sizes to Chapter 1 events.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-chapter2-core.js`: add real player/enemy initial team sizes to Chapter 2 events.
- `projects/western_fantasy_continent/game_data/map-cognition-v3-event-adapter.js`: calculate and settle continuous combat performance.
- `projects/western_fantasy_continent/game_data/test-player-cognition-v3-continuous-performance.js`: focused continuous-result regression.

## Validation

- `node projects/western_fantasy_continent/game_data/test-player-cognition-v3-continuous-performance.js`: PASS, 3 tests.
- `node projects/western_fantasy_continent/game_data/test-player-cognition-v1-events.js`: PASS.
- `node projects/western_fantasy_continent/game_data/test-player-cognition-v3-player-hypothesis.js`: PASS.
- `node projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: PASS, including manual equipment causality.
- No browser or UI validation was run.

## Current State

The executable player loop now receives a continuous real combat result for A. A close loss can outperform a previously learned crushing-loss expectation even when both attempts are formally losses.

This does not yet solve decision-specific expectation. The current expectation still comes from historical results for the same map action, not from a precommitted estimate such as "swapping in Ranger should improve combat performance by 0.25".

## Unresolved

- Define the evidence-bound predicted improvement for roster, equipment, and positioning decisions.
- Do not let the decision Agent directly invent an arbitrary numeric improvement.
- The recommended model is a confidence-weighted estimate from prior causal beliefs and learned before/after intervention deltas, with a conservative qualitative prior only when the player has no numeric evidence.
- The two touched progression cores already contained unrelated worktree edits. This change only added `teamSizes` fields and did not revert or rewrite those edits.

## Recommended Next Step

Specify and validate decision expectation as a separate ledger: baseline combat performance, predicted intervention delta derived from player knowledge, actual next-combat delta, then EVerify settlement through A.
