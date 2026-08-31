# UFS route-led activation V0 protocol

## Correction under test

Activation is directional, not a three-channel conjunction.

- A Q-after/goal cue validates only that the awakened memory contains the desired result pattern. Its old Q-before and operations may differ.
- A Q-before cue validates only that the awakened memory starts from a sufficiently related situation. Its operations and result may differ.
- An operation cue validates only operation shape/order similarity. Its Q-before and Q-after may differ.

Other sides are returned as recalled content but cannot suppress the route that triggered the memory. No average, sum or full-convergence gate is allowed.

## UFS memory bank

1. research room, energy `2→0`, research `0→2`;
2. different research situation, energy `3→0`, research `2→3`;
3. research room, energy `2→0`, research remains `0`;
4. reversed research operations with endpoint research `0→2`;
5. energy room, energy `2→4`, research unchanged.

## Route tests

### Q-after led

Goal: “research increases”, with amount and costs unspecified.

Expected accepted memories: 1, 2 and 4. Their energy costs and operation differences remain visible but do not invalidate result-side recall. Memories 3 and 5 do not contain research increase.

### Q-before led

Cue: rooms phase with a resolvable research room. Exact energy/research numbers are not required.

Expected accepted memories: 1, 2, 3 and 4. Their later operations/outcomes may differ. The energy-room memory is not a related starting side.

### Operation led

Cue shape: `resolve research room → choose research advance`; exact cost and advance amount are unspecified.

Expected accepted memories: 1, 2 and 3. Reversed order and one-step energy resolution do not match the operation side.

Each route is run once cleanly and once with deliberately unrelated values on the two non-trigger sides. Activated and accepted IDs must remain identical.

## Frozen checks

- Each route accepts exactly its expected set.
- Non-trigger-side decoys do not change activated or accepted IDs.
- Q-after recall preserves energy costs as side effects rather than rejecting them.
- Every candidate records exactly one `triggeredBy` route.
- No average/joint/aggregate field exists.

Passing establishes route behavior only. Candidate applicability, adaptation, legality and planning value remain later stages.

