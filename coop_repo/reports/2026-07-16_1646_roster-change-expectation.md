# Agent Handoff: Roster-change expectation from character cognition

- Date: 2026-07-16
- Agent/thread: Codex `/root`
- Scope: player-agent roster-change expectation after a failed battle
- Status: complete

## User Intent

Use the new character-strength and trait cognition to prevent the player from learning the over-broad rule `one replacement failed, therefore changing characters never matters`. Try the original failure scenario and determine whether materially different replacements reopen the expectation of success.

## Completed

- Added a code-owned roster expectation layer that stores encounter, ordered team composition, visible outcome/performance, equipped power, context tags, and the current character-cognition snapshot.
- Scoped a recorded failure to its exact team and encounter. Every legal one-character replacement is evaluated separately.
- Reuses comparable exact-team history when available; otherwise compares the incoming and outgoing characters through current Matrix-1 strength plus context-relevant trait cognition.
- Returns `unknown` when there is no comparable exact-current-team baseline or no accepted character cognition. Results from another team are never borrowed as the current baseline.
- Treats missing trait observations as unknown rather than level 0. A real accepted level-0 observation remains comparable evidence.
- Uses weighted recent actual wins/losses for exact-team ordinal outcome. A loss with a favorable remaining-HP margin remains a failure, with the margin retained only as a performance interpretation.
- Integrated the state into formal player sessions, chapter inheritance, full decision requests, and compact decision requests.
- Added a focused story-like regression with weak, strong, context-specialist, previously failed, favorable-margin-but-failed, and unknown replacements; also added power, encounter, cognition-revision, and other-roster guardrails.
- Independent cognition review returned `ACCEPT` with calibration guardrails.

## Files Changed

- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/roster-change-expectation.js`: roster observation, exact-history matching, counterfactual comparison, and failure-transfer rules.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/test-roster-change-expectation.js`: focused swap-after-failure simulation and guardrails.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/ROSTER_CHANGE_EXPECTATION_CONTRACT.md`: evidence boundary, formulas, unknown handling, and ownership contract.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/player-agent-loop.js`: formal session persistence, chapter inheritance, and decision-request wiring.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/compact-request.js`: preserves character cognition and roster expectations in compact requests.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/verify-causal-loop.js`: formal and compact request assertions.
- `projects/western_fantasy_continent/experiments/player_agent_api_loop_v1/README.md`: experiment entry and validation command.
- `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md`: runtime behavior and limitations.
- `projects/western_fantasy_continent/player_model_runtime.json`: machine-readable roster expectation registration and runtime version.

## Validation

- `node test-roster-change-expectation.js`: PASS. Weak replacement remained likely failure; strong and known area-damage replacements reopened plausible success; a separately observed failed replacement stayed likely failure; an unknown character stayed unknown.
- `node verify-causal-loop.js`: PASS. Formal session records the observation and exposes one scoped expectation per legal swap; compact request retains it.
- `node validate-controlled-two-chapter-run.js`: PASS. Chapter transition inherited one roster observation.
- `node validate-player-profile-ensemble.js`: PASS.
- `node validate-persistent-agent-context.js`: PASS.
- `node validate-knowledge-retrieval-slices.js`: PASS, 10 slices and 14 semantic checks.
- Independent reviewer reran the roster test, causal-loop test, strength-matrix test, and entity-impression test: all PASS; final verdict `ACCEPT` with guardrails.
- `git diff --check`: PASS.

## Current State

The executable player model no longer turns one failed swap into a universal belief that every swap is pointless. The old team failure remains remembered, but a materially stronger or context-better character can move a specific candidate from likely failure to uncertain or plausible success. Exact failed compositions keep their own negative evidence.

This is an ordinal player expectation, not hidden combat truth and not a calibrated win probability.

## Unresolved

- Prediction coefficients and bands (`0.12`, `0.35`, `0.08`, `0.33`, `0.67`) are provisional and have not been calibrated against human judgments or a large real-combat dataset.
- Equipment comparability currently uses total equipped power; equal totals with materially different builds may be treated as comparable.
- Exact-history cognition invalidation compares Matrix-1 position changes, not trait-belief changes.
- Context trait mapping currently covers many targets, one/two targets, and survival pressure; it does not yet model precise enemy armor, formation, or other richer environment features.
- The three perception profiles are seeded cognition variants rather than one shared battle-report batch replayed end to end.
- No live decision-Agent trajectory yet proves it will choose the reopened strong replacement. Current validation proves the expectation model and request wiring.

## Recommended Next Step

Run one controlled live decision-Agent episode that first fails with the current team, then exposes at least one weak and one materially strong/context-specialized legal replacement. Verify that the Agent reads the scoped alternatives, chooses or explicitly rejects them for a stated reason, and update only behavior guidance if it still acts indifferent. Do not tune prediction coefficients from a single episode.
