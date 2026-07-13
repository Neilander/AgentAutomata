# Round 2026-07-13 02:51

## Stage

Phase 1 only. No gameplay design was changed.

## Real Event Path

`map cognition core -> transient visible-signal analysis -> event adapter -> H receiver -> structured knowledge and expectation ledger -> appraisal and emotion -> post-feedback learning`

The old V5 analyzer was explicitly rejected as a base because it directly filled psychological intermediate values.

## Defects Found During Review

- Analysis data initially risked polluting persistent history.
- The first signal selector claimed non-rendered targeting and shield-break events were visible.
- Signal IDs were not unique across repeated encounters.
- Skill casts and their damage effects shared one behavior key.
- Partial knowledge matching let one role borrow another role's expectation.
- Incoming enemy damage was incorrectly appraised as positive.
- Loot utility was calculated in the adapter instead of from raw loot components inside cognition.
- Combat result and action summary could settle the same expectation twice.
- The opening's second action is externally supplied, so it is not evidence of cognition-driven behavior.

## Corrections

- Added opt-in, transient `captureVisibleSignals` analysis without changing normal game history.
- Aligned selected combat signals to the battle-view rendering branches.
- Added attempt-qualified event IDs and stable signal order.
- Changed initial matching to strict subject/environment/behavior matching, including behavior kind and probability family.
- Added player-perspective signs for damage, healing, and shielding.
- Moved loot appraisal to cognition using raw loot components.
- Added goal/desire and learned freshness to appraisal.
- Added learned probability and success value to delayed loot expectation.
- Made combat result observation-only for expectation; action summary is the single settlement boundary.
- Added counterfactual tests for visibility, prior knowledge, desire, delayed probability, and single settlement.

## Current Decision

Do not pass Phase 1 yet. The event-to-emotion slice is now materially stronger, but the loop does not yet close from cognition back into a selected next behavior.
