# Round 2026-07-13 03:17

## Stage

Phase 1. Behavior closure only; no gameplay design changed.

## Added

- An auditable action policy that sees only current `allowedActions`, visible node/reward hints, goals, learned action outcomes, expected duration, success belief, failure fear, and current emotion.
- An automatic action-loop runner. Its chosen action is passed directly into the real map combat adapter.
- Explicit progression and capability-discovery goals, with active-goal switching.
- Validated decision E: simple comparison is one step; a complete goal/evidence/affordance/comparison/hypothesis chain is four steps.
- Real hypothesis verification and separate `EVerify` reporting.
- Learned action cost and win-rate summaries.

## Real Trace

The policy executed:

`Main 1 -> Main 2 -> Main 3 -> Prison loss -> Main 4 -> Main 5 -> Main 6 -> Main 7`

Prison was selected to pursue `discover_new_capabilities` because the reward hint visibly promised a character. The loss refuted the `character_unlock` hypothesis. The next decision switched to `grow_and_progress`; it was explicitly not described as a remedy for the prison failure.

## Paired Counterfactual

The exact same post-Main-3 visible observation was reused:

- Before real Prison failure knowledge: select Prison.
- After the real Prison loss: select Main 4.

The Prison score falls through learned negative utility, lower success belief, observed duration, and fear. Removing that learned history removes the behavior change.

## Parameter Calibration

`decisionEffortValue` changed from `0.18` to `0.04` per validated decision step. Reason: the first automatic loop gained `+0.54` emotion from every routine three-label comparison, treating thought itself as a large reward. The new model counts routine comparison as one step (`+0.04`) and reserves four steps for a valid hypothesis chain. This was a plausibility correction, not an attempt to maximize playtest emotion.

## Independent Review

Two independent reviewers accepted behavior closure. Both rejected Phase 1 completion because presentation-grounded H, real interruption/dry-streak traces, broader calibration, and a real event-derived emotion-to-action case remain unfinished.
