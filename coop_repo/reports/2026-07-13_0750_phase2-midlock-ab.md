# Agent Handoff: Phase 2 Mid-Region Soft Lock A/B

- Date: 2026-07-13
- Agent/thread: Codex heartbeat automation
- Scope: readable Main 6 resistance, Bandit key, and immediate verification under Frozen V3
- Status: complete for the isolated soft-lock objective

## User Intent

Use real game signals and the frozen player model to improve Region 1 design, restoring meaningful resistance without breaking the accepted Ranger onboarding or manufacturing emotional improvement through psychological parameters.

## Completed

- Built a candidate-only Main 6 heavy-shield lock after the Ranger proof.
- Reused the visible Bandit armory as the key source.
- Added a second shield-break weapon so the key reliably affects Warrior and Ranger.
- Fixed the field runtime so the candidate lock reads shield-break and armor-break mechanics rather than succeeding only through incidental base stats.
- Added real source attribution and renderer-backed field labels.
- Preserved the old heavy-shield field semantics by splitting the candidate into `heavy_shield_lock`.
- Ran matched A/B, a 60-route width check, regression tests, and two independent reviews.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-midlock.js`: isolated Main 6 lock, Bandit key, and visible candidate event encoding.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-v3-midlock.js`: candidate loop under Frozen V3.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-v3-midlock-ab.js`: paired lock, bypass, emotion, and recovery analysis.
- `projects/western_fantasy_continent/game_data/test-map-cognition-v3-midlock.js`: onboarding, lock/key/retry, bypass, field-signal, and terminal regression.
- `projects/western_fantasy_continent/game_data/runtime-field-effects.js`: candidate-only field definition, counter hooks, and real source attribution.
- `projects/western_fantasy_continent/game_data/combat-signals.js`: generic field-signal presentation contract.
- `projects/western_fantasy_continent/battle_view/battle-view.js`: field labels and rings anchored to the responsible unit.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/2026-07-13_0750/ROUND.md`: complete evidence and bounded claim.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/PHASE_STATE.md`: Phase 2 iteration state.

## Validation

- 30 paired routes: 19 lock routes, 11 existing-build bypasses.
- All 19 lock routes: loss -> Bandit -> immediate Main 6 retry -> win.
- Ranger onboarding and terminal: 30/30.
- Failure-route emotion: 46.0372 -> 44.7889 -> 46.6366 -> 48.1561.
- 60-route candidate width check: 30 locks / 30 bypasses; every key retry wins.
- Counter labels are visible and H-accepted with real sources.
- Mid-lock, Ranger, V3, V2, V1, and formal-map regressions: pass.
- Frozen V3 hashes: unchanged.
- Independent review: ACCEPT / ACCEPT.
- Full field-effect waterline validator: timed out after 240 seconds without completion; targeted old-field/new-field isolation traces passed.

## Current State

Two isolated Phase 2 gameplay candidates are now accepted under Frozen V3: Ranger onboarding and the subsequent Main 6 soft lock. Formal map code remains unchanged.

## Unresolved

- Frozen V3 chooses retry mainly from visible power growth, not semantic counter taxonomy.
- The Bandit key creates a large visible equipment jump, about 103% in sampled loss routes.
- Human play still needs to confirm that the lock, key labels, and retry feel clear rather than overly authored.
- Full 500-team field-effect waterline revalidation remains pending because the local run exceeded 240 seconds.
- The accepted Ranger, mid-lock, and Boss-recovery candidates have not yet been assembled into one human-playable candidate.

## Recommended Next Step

Assemble the accepted Ranger onboarding, Main 6 soft lock, and Boss-recovery behavior into one separate playable Region 1 candidate. Do not merge formal gameplay yet. Use the existing real battle renderer and add a compact cognition/debug overlay only for testing.
