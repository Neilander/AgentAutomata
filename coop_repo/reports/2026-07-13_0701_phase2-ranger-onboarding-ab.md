# Agent Handoff: Phase 2 Ranger Onboarding A/B

- Date: 2026-07-13
- Agent/thread: Codex heartbeat automation
- Scope: early Ranger acquisition, voluntary use, and role proof under Frozen V3
- Status: complete for the isolated onboarding objective

## User Intent

Improve the real first-region design using game-generated signals and a frozen player model, proving that emotional and behavioral changes come from gameplay rather than hand-authored psychology values.

## Completed

- Diagnosed the original failure: the player already chose Prison early, but the encounter almost always defeated the early team, delaying Ranger beyond the proof and often beyond the Boss.
- Built a separate candidate without touching formal gameplay or Frozen V3.
- Made Prison a reliable early character-delivery encounter and moved the high-health Ranger proof to the immediately following Main 4 fight.
- Corrected the audit to require Ranger-specific proof instead of accepting any role-proof event.
- Ran 30 paired full routes and 100 short proof routes.
- Obtained two independent ACCEPT verdicts.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core-phase2-ranger-onboarding.js`: isolated Prison and Main 4 proof design.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-v3-ranger-onboarding.js`: candidate loop using Frozen V3.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-v3-ranger-onboarding-ab.js`: paired route, milestone emotion, and Ranger-specific proof comparison.
- `projects/western_fantasy_continent/game_data/test-map-cognition-v3-ranger-onboarding.js`: rescue -> swap -> proof -> experiment -> terminal regression.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/2026-07-13_0701/ROUND.md`: complete evidence and interpretation.
- `projects/western_fantasy_continent/design/player_cognition_live_integration/PHASE_STATE.md`: Phase 2 iteration state.

## Validation

- 30 paired candidate routes: 30/30 first Prison wins, rescue before proof/Boss, immediate voluntary Ranger use, Ranger-specific proof, confirmed experiment, and terminal.
- 100 short routes: 100/100 rescue and Ranger proof; average Ranger damage share about 36.75%, minimum 32.2%.
- Proof milestone emotion: 43.7659 -> 45.1408.
- First Boss-action emotion: 49.3775 -> 54.9909.
- Emotion gain per action: 1.0555 -> 1.2136.
- Candidate regression and V3/V2/V1/formal-map regressions: all pass.
- Frozen V3 hashes: unchanged.
- Independent review: ACCEPT / ACCEPT.

## Current State

The isolated candidate now provides a reliable and causally readable Ranger onboarding chain. The formal map and the previously accepted Boss-recovery candidate remain unchanged.

## Unresolved

- Candidate routes have zero losses in the checked 30-route set.
- Prison now functions as a reliable character-delivery beat, not a lock/failure/retry lesson.
- Region 1 still needs a later, readable resistance beat that does not undo the Ranger onboarding chain.
- Final cumulative emotion is slightly lower because the route is shorter; milestone and per-action comparisons are more informative here.

## Recommended Next Step

Keep Frozen V3 and the Ranger candidate fixed. Design one isolated mid-region resistance/lock candidate after Main 4, then run paired routes to test whether it restores goal formation and meaningful recovery without delaying Ranger acquisition or obscuring the role proof.

