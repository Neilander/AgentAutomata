# Agent Handoff: Player Cognition Real-Event Slice

- Date: 2026-07-13
- Agent/thread: Codex heartbeat automation
- Scope: Phase 1 real game signal integration
- Status: partial

## User Intent

Connect the independent big-map AI-play version to the real cognition loop. Emotion and cognition must be derived from game events rather than directly supplied psychological outputs. Gameplay design optimization must wait until the player model is causally credible and frozen.

## Completed

- Added an opt-in transient combat-analysis return to the map cognition core. Normal gameplay events and save history remain unchanged.
- Added a V1 event adapter for real combat, settlement, loot, unlock, and duration events.
- Added a V1 cognition runtime covering H reception, structured knowledge, immediate/delayed expectations, signed appraisal, goal/desire, freshness, probability learning, emotion, goal progress, hypotheses, failure memory, and feedback-before-learning.
- Added immediate and delayed causal tests plus counterfactual tests for visibility, prior knowledge, desire, probability, and single settlement.
- Fixed event provenance and modeling defects found during review: hidden non-rendered signals, duplicate IDs, cast/effect contamination, cross-role partial matching, positive enemy damage, adapter-injected loot utility, duplicate outcome settlement, and unknown-first-action surprise.
- Recorded the live Phase 1 gate and round notes under `design/player_cognition_live_integration/`.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core.js`: opt-in transient visible-signal analysis.
- `projects/western_fantasy_continent/game_data/player-cognition-v1-event-runtime.js`: event-driven cognition runtime.
- `projects/western_fantasy_continent/game_data/map-cognition-v1-event-adapter.js`: raw game-event adapter and unified expectation boundaries.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-v1-events.js`: focused opening trace runner.
- `projects/western_fantasy_continent/game_data/test-player-cognition-v1-events.js`: causal and contract tests.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/PHASE_STATE.md`: current gate and blockers.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/2026-07-13_0251/ROUND.md`: round evidence and decisions.

## Validation

- `node projects/western_fantasy_continent/game_data/test-player-cognition-v1-events.js`: passed.
- `node projects/western_fantasy_continent/game_data/test-map-first-region-flow.js`: passed.
- Real opening analyzer: two real fights, 178 accepted visible signals, zero pending expectation ledgers; emotion moved from 38 to 39.68 using the event chain.
- Independent review: one reviewer accepted the vertical event-to-emotion slice; one requested correction for unknown expectation settlement. That defect was fixed and covered by a passing test. Both reviewers rejected Phase 1 as a whole because cognition does not yet choose the next action.

## Current State

The real event-to-emotion vertical slice is usable as a foundation. It no longer relies on the old V5 path that directly filled psychological intermediate values. Phase 2 remains locked.

## Unresolved

- Cognition, goals, fear, knowledge, and emotion do not yet rank or select the next real action.
- There is no paired counterfactual showing the same visible game state producing a different chosen action under different cognition.
- H is auditable by component but still accepts nearly every selected visible combat signal; competing-signal attention and calibration remain unfinished.
- Hypothesis planning/verification and decision E are not yet connected to a real planner.
- Failure, interruption, abnormal dry streak, and longer probability horizons still need full real-trace tests.
- Base utility, salience, decay, and learning constants are provisional human-property calibration values, not gameplay optimization knobs.

## Recommended Next Step

Implement a small auditable action-ranking node that consumes only the current available actions, structured knowledge, active goals, expected payoff/cost, failure fear, and uncertainty. Then prove with paired counterfactuals that cognition changes the chosen action while the visible game state stays fixed. Do not begin gameplay A/B until independent reviewers accept that closure.
