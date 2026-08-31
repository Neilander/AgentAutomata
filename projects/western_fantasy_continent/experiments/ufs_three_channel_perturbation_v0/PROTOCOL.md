# UFS three-channel perturbation V0 protocol

## Purpose

Stress the independent Q-before / operation / Q-after activation contract with missing and incorrect structured evidence. No signal may be averaged with another.

## Frozen baseline

Use the correct no-ID two-step research query and four-candidate controlled bank from `ufs_structured_relation_activation_v0/fixture.json`.

## Perturbations

1. baseline full query;
2. missing Q-before energy;
3. missing Q-after research value;
4. missing `advanceSteps` operation parameter;
5. wrong `advanceSteps=0` while Q-after still says research `0→2`;
6. wrong Q-after research `0` while operations still say advance 2;
7. wrong Q-before object type `energy_room` while operations/result still describe research;
8. reversed operation order with otherwise unchanged endpoints.

## Evidence and degradation

- Q evidence records similarity, high/not-high and known-field coverage separately.
- Operation evidence is `exact`, `compatible` for omitted query parameters with no conflict, or `conflict`.
- `complete_convergence` requires full high Q-before, exact operation sequence and full high Q-after.
- Missing evidence may become `partial_convergence`; it must not be silently promoted to complete.
- Inconsistent wrong evidence must produce no complete candidate.
- The reversed-order input is internally coherent with the reversed-order memory. It should awaken that row, demonstrating that activation cannot detect a coherently wrong extractor; later state/rule validation must do so.

## Frozen checks

- Baseline uniquely completes the correct target.
- All three missing cases produce no complete candidate and retain the correct target as partial convergence.
- The three internally inconsistent wrong cases produce no complete candidate.
- Reversed order uniquely completes the reversed row, not the target.
- No average, joint or aggregate candidate field exists.

