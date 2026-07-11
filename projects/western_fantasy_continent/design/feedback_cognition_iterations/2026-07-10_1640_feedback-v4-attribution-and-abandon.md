# Feedback Cognition V4: Attribution-Bounded Recovery

- Model: `feedback-v4`
- Trigger: V3 independent verdict `revise`
- Failure recovery amount: unchanged at `+0.40`

## Changes

1. Failure no longer restores every previously seen skill-cast family. A power/equipment-attributed failure restores normal-kill farming, main clear, equipment drops/upgrades, and farm decision freshness. Side-branch/team events are restored only when current cognition makes them relevant.
2. Abandonment now records `preAbandonEmotion`, probability, roll, and terminal decision separately. `已放弃` remains an outcome, not the pre-roll emotion.
3. Old V3 player records remain unchanged. The efficient V3 stop is explicitly interpreted as a 7.1% tail hit (`0.032 < 0.071`), not a deterministic second-failure outcome.

## Focused Deterministic Check

Route: main 1-3, first Prison attempt.

- Pre-abandon emotion: `平稳`.
- Abandon probability: 2.4%.
- Roll: 0.191; player continued.
- Recovered event families: normal kill, main clear, common/rare equipment, equipment upgrade, farm-after-failure decision.
- Recovered skill-cast families: none.

## Next Gate

Run a short knowledge-bounded player session through the first failure and pass its raw record to an independent reviewer. Accept V4 only if the reviewer finds no serious attribution or emotion/abandon conflation.
