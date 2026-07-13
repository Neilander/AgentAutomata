# V3 Character Affordance Gate

Date: 2026-07-13 06:21 CST

## Question

Can the simulated player notice a newly rescued character, voluntarily try that character, obtain independent visible combat evidence, and then continue without forced behavior or swap oscillation?

## Implementation

- Created separately versioned V3 runtime, policy, adapter, and full-route loop. Frozen V2 was not modified.
- Visible `character_unlock` creates a bounded affordance experiment.
- A selected swap creates a separate next-combat hypothesis rather than treating the swap itself as proof.
- Visible combat signals summarize the new character's damage, healing, shielding, and skill use.
- Hidden contribution aggregates are excluded.
- A pending combat experiment blocks additional new-character swap experiments until evidence arrives.
- Terminal conclusion defers until the meaningful experiment resolves.

## Causal Controls

1. Visible unlock versus hidden unlock.
2. Freshly unlocked reserve versus an old reserve character.
3. Swap boundary versus following combat evidence.
4. Visible contribution signals versus hidden aggregate contribution.
5. Single unlock versus simultaneous Ranger and Assassin unlocks.
6. Experiment available/awaiting versus resolved terminal state.

## Validation

- `test-player-cognition-v3-character-affordance.js`: pass.
- `test-player-cognition-v2-long-horizon.js`: pass.
- `test-player-cognition-v1-events.js`: pass.
- `test-map-first-region-flow.js`: pass.
- Five real seeds each perform exactly one Ranger swap, keep Ranger active, confirm the independent hypothesis from visible contribution, resolve the experiment, and terminate.
- Independent reviewers: ACCEPT / ACCEPT after concrete defects were found and fixed: premature hypothesis settlement, hidden contribution leakage, multi-unlock stacking, and an unresolved no-visible-contribution boundary.

## Model Parameters

- Added behavior-policy weights: novelty `0.68`, visible militia replacement `0.12`, low action cost `0.05`.
- No emotion, P/Q/R/A, H, decay, learning-rate, or gameplay reward parameter changed.
- The new values enable a bounded voluntary experiment and are frozen for the next gameplay A/B.

## Result

Phase 1 passes for V3. The model can now evaluate character onboarding and role-proof design. The preserved Main9 equipment-recovery candidate remains valid for its narrow claim.

## Next Gameplay Question

Move Ranger acquisition before a relevant optional proof encounter, then compare matched routes under Frozen V3. The design should earn character-unlock value through visible use and role evidence, not by directly increasing emotion.
