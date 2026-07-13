# Agent Handoff: Candidate Single Battle Settlement

- Date: 2026-07-13
- Agent/thread: Codex heartbeat automation
- Scope: remove duplicate visual/settlement combat from the playable Region 1 candidate
- Status: complete

## User Intent

Continue the real-signal player-cognition iteration without manufacturing psychological gains, and harden the separate playable candidate before any formal merge.

## Completed

- Made the displayed unified battle the human candidate's sole combat result.
- Added candidate-core support for settling an externally completed real combat result.
- Preserved the existing internal simulation path used by AI playtests.
- Added side normalization and missing-metric derivation for the legacy displayed-result fallback.
- Added parity regression coverage.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/candidate-v3.js`: export the played simulation and pass it into settlement.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-combined.js`: normalize and settle `resolvedCombat` without rerunning battle.
- `projects/western_fantasy_continent/game_data/test-map-cognition-v3-combined.js`: verify display/core settlement parity.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/2026-07-13_1158/ROUND.md`: evidence and bounded claim.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/PHASE_STATE.md`: Phase 2 hardening state.

## Validation

- `node game_data/test-map-cognition-v3-combined.js`: pass.
- `node game_data/test-map-cognition-v3-midlock.js`: pass.
- `node game_data/test-player-cognition-v3-character-affordance.js`: pass.
- `node --check map_progression_lab/candidate-v3.js`: pass.
- Chrome 1440x900 page load: pass.
- Frozen V3 hashes: unchanged.
- Independent review: ACCEPT / ACCEPT for the scoped settlement objective.

## Current State

The displayed human battle and game-state settlement now share one real combat result. AI simulation remains unchanged and continues to generate its own real combat events through the candidate core.

## Unresolved

- The browser candidate does not run the full Frozen V3 runtime; its right panel is a lightweight summary.
- Automated clicking through a complete browser fight remains unavailable; parity is covered at the core boundary and final tactile confirmation remains human work.
- Failure diagnosis still does not identify specific missing counter equipment or composition mistakes.

## Recommended Next Step

Have the user play the candidate once to judge the three gameplay beats. If browser-visible emotion tracing is needed before that judgment, create a browser-compatible V3 adapter/state surface as a separate debug module; do not conflate that work with gameplay balance.

