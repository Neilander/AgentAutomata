# Agent Handoff: Roster expectation continuous story and edge cases

- Date: 2026-07-16
- Agent/thread: Codex `/root`
- Scope: continuous roster-change expectation story and boundary expansion
- Status: complete

## User Intent

Run the previously proposed continuous story rather than isolated examples, and exercise the missing edge cases: repeated failures, multiple successive swaps, mixed outcomes, stale data, trait decline, equipment ambiguity, and multiple perception profiles.

## Completed

- Added an executable continuous story: the initial team fails; a materially stronger replacement is selected but that exact new team also fails; a second, context-specialized replacement changes another slot and succeeds; returning to the intermediate team correctly retrieves only that team's prior failure.
- Added a mixed exact-history case. `loss/loss/win/loss/win` produces recent weighted win rate `0.536` and `uncertain_near_boundary`.
- Added a stale-data case. Ten old failures plus recent `loss/loss/win/win/win` use only the latest five observations, produce weighted win rate `0.786`, and return `plausible_success`.
- Added context-relevant trait-cognition comparability. When area-damage cognition drops from level 6 to 0 without a strength-position change, the old exact-team interpretation is invalidated and the candidate is recalculated with trait contribution zero.
- Added equipped-build fingerprints. Equal total equipment power with different visible builds no longer reuses the old baseline; it returns unknown.
- Fixed exact candidate history to compare against the hypothetical candidate team's equipped power rather than the current team's power. The edge test verifies candidate power `406` can retrieve exact evidence while current-team power is `46`.
- Replayed the same 20 controlled battle reports end to end through ordinary, familiar, and expert perception profiles before building roster expectations. All three remained knowledge-bounded and non-unknown.
- Explicitly tested unsupported boundaries: an attempted simultaneous two-slot action produces no prediction; a visible heavy-armor tag does not secretly activate armor-break knowledge because richer context mapping is not implemented.
- Updated the contract, runtime documentation, experiment README, formal game-state wiring, and runtime manifest.

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-roster-change-expectation-edge-cases.js`: continuous story and expanded edge-case suite.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-change-expectation.js`: trait-belief comparability, equipped-build fingerprinting, and candidate-specific power comparison.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: passes the current game state for equipped-build comparison.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/ROSTER_CHANGE_EXPECTATION_CONTRACT.md`: new evidence boundaries and unsupported cases.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`: edge-test entry point.
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`: current exact-history comparability and limits.
- `projects/western_fantasy_continent/player_model_runtime.json`: runtime version `player_agent_api_loop_v1_roster_expectation_edge_v13`.

## Validation

- `node test-roster-change-expectation-edge-cases.js`: PASS.
- `node test-roster-change-expectation.js`: PASS.
- `node verify-causal-loop.js`: PASS.
- `node validate-controlled-two-chapter-run.js`: PASS.
- `node validate-player-profile-ensemble.js`: PASS.
- `node validate-persistent-agent-context.js`: PASS.
- `node validate-knowledge-retrieval-slices.js`: PASS.
- `node test-strength-cognition-matrix.js`: PASS.
- `node test-entity-impression-model.js`: PASS.
- JavaScript syntax checks for the model and new edge suite: PASS.
- `git diff --check`: PASS.
- Independent player-cognition review reread the skill and nine required references, reran the new/old roster tests, formal causal loop, and four formal regressions: all PASS. Verdict: `ACCEPT`, scoped to expectation calculation, request wiring, and boundary behavior.

## Current State

The original overgeneralization has now been tested across a continuous sequence, not only isolated alternatives. Each exact roster retains its own outcome history, while a different subsequent replacement can still reopen the expectation. Recent consistent evidence can overcome a large obsolete failure pile, and materially revised trait cognition or equipment build prevents stale exact evidence from pretending to answer the current question.

The three perception profiles received the same 20 reports. Their absolute cognition values differed, but all produced `likely_failure` for the chosen near-strength replacement, with effective deltas `0.583`, `0.579`, and `0.581`. This is evidence of stable interpretation for this fixture, not evidence of diverse decision paths.

## Unresolved

- `chooseBestSwap` in the edge test is a mechanical outcome/score ordering used to make the story executable. It is not a persistent decision Agent and does not prove the real Agent will act on the reopened expectation.
- Simultaneous multi-slot swaps are unsupported. Successive one-slot swaps are supported and tested.
- Rich environment prediction is still unimplemented. Heavy armor was tested only to prove safe non-inference; backline threat, control immunity, and formations were not mapped or individually tested.
- The three replayed perception profiles converge on the same ordinal result here. This test proves cross-profile stability, not behavioral diversity across the six or more persistent decision profiles required for a full level validation.
- Prediction coefficients and thresholds remain provisional and uncalibrated.

## Recommended Next Step

Run a real persistent decision-Agent episode using the formal request surface. Present at least a weak replacement and a materially strong or context-specialized replacement after each failure, retain profile priors and swap friction, and observe whether the Agent selects, rejects, or ignores the reopened route. Keep the current mechanical edge suite as a backstop; do not use it as a substitute for the behavioral trace.
