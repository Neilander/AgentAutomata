# Character Affordance Validity Audit

- Date: 2026-07-13 05:38 CST
- Intended phase: continue Phase 2 under the accepted recovery candidate
- Result: character-related Phase 2 paused; Phase 1 reopened for V3

## Next Observed Problem

All five accepted-candidate routes rescue the Ranger but never use the Ranger:

- Prison first fails at step 4.
- `r1_main_7`, which contains Ranger role-proof logic, is cleared before Ranger recruitment.
- Ranger is rescued only after the first Boss attempt.
- In 3/5 seeds the Boss is already defeated before Ranger rescue.
- The roster, `调整队伍` behavior, and four Ranger swap actions are all visible.
- Zero swap decisions occur; the team remains Warrior / Barricade / Mage / Herb.
- In the three Boss-win seeds, terminal conclusion occurs immediately after rescue.

The character unlock produces 2.63-2.88 emotion from the reward event, but no decision, use, combat verification, or learned role follows. Character-reward value is therefore currently overcounted.

## Gameplay Defect

The Ranger validation node is ordered before Ranger acquisition, and successful routes leave no post-recruit combat space. This must eventually be redesigned.

## V2 Model Defect

Frozen V2 cannot perform the first meaningful swap experiment:

- `scoreSwap()` considers swap known only when a prior V2 knowledge row already contains `swap`.
- The visible map cognition behavior `调整队伍` does not become such a row.
- A new character and visible swap buttons therefore score only 0.04.
- After Boss completion, terminal evaluation runs before swap candidates are considered.

This prevents valid Phase 2 evaluation of recruitment, roster experimentation, role learning, and character-composition gameplay.

## Smallest Micro Fixture

Observation:

- Ranger newly visible in reserve;
- `swap:1:hero_ranger` visible;
- one unfinished Ranger-proof challenge visible;
- no hidden designer information.

Frozen V2 results:

| Prior state | Swap score | Challenge score | Selected |
|---|---:|---:|---|
| No swap knowledge | 0.04 | 0.5292 | challenge |
| Synthetic prior swap knowledge | 0.12 | 0.5292 | challenge |

Even seeded generic swap knowledge is insufficient. Forcing swap or locking all other actions would route around the defect rather than validate the model.

## Independent Review

Two independent reviewers returned `C) both`: a gameplay ordering defect and a player-model validity defect. Both reject current character-reward Phase 2 conclusions while preserving the narrow validity of the accepted equipment-recovery candidate.

## V3 Acceptance Gates

1. A visible new character creates one unresolved, low-cost team-composition experiment without hidden designer knowledge.
2. The player may voluntarily select a relevant first swap while ordinary alternatives remain available.
3. Generic old reserve characters do not all receive the same novelty boost.
4. One swap does not cause endless swap oscillation.
5. The following combat verifies or refutes the character hypothesis.
6. Terminal conclusion waits for a meaningful newly unlocked experiment, then becomes available after resolution.
7. Hidden or unperceived character unlocks do not create the experiment.
8. Existing V2 equipment-recovery and all earlier causal controls remain green.
9. Two independent reviewers accept V3 before character-related Phase 2 resumes.

## Integrity

- Frozen V2 changed: no.
- Accepted Boss-preparation candidate changed: no.
- New gameplay design accepted this round: none.
- New artifact: read-only character-affordance diagnostic.

