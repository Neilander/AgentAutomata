# UFS structured-relation multi-step activation V0 protocol

## Purpose

Test the representation prerequisite for recalling an already learned multi-step trajectory from Q-before, an ordered operation sequence and Q-after. This is activation only; no post-retrieval validation or planning is performed.

The historical revision-9 profile cannot honestly supply this test because all 275 trajectories predate explicit `operations[]`. This experiment therefore uses the current learning representation to construct a controlled “already learned” memory bank and compiles it with the real local GTE.

## Memory bank

All episode-specific die, cell, room and ticket IDs are forbidden.

1. target: resolvable research room, then `resolve_room → choose_research_advance(2)`, energy `2→0`, research `0→2`;
2. zero-advance confuser: same start, then `resolve_room → choose_research_advance(0)`, research remains `0`;
3. reversed-order confuser: same endpoints as target, but operations occur in the opposite order;
4. energy-room confuser: room resolution produces energy rather than research.

## Representation ablation

1. `semantic_endpoints`: natural-language Q-before and Q-after only;
2. `semantic_with_operations`: natural-language endpoints, with the exact ordered operation sequence embedded into Q-before;
3. `structured_with_operations`: canonical typed object/phase/before/after relations plus the ordered operation sequence, without episode IDs.

For every query, report three independent routes:

- Q-before route;
- Q-after route;
- joint route using the mean of Q-before and Q-after similarities.

Also report the union of each route's Top-2. This records the proposed future candidate policy without changing runtime selection.

## Queries and frozen checks

- Three natural-language paraphrases of the correct two-step research sequence must all retrieve the target.
- A query with the same endpoints but reversed operations must retrieve the reversed-order memory.
- A zero-advance query must retrieve the zero-advance memory.
- For `structured_with_operations`, the expected memory must be joint Top-1 for all five queries and must appear in the three-route Top-2 union.
- Target-query rankings must be stable across all three paraphrases.

Passing is representation feasibility only. The structured relations are supplied by the fixture, so this does not validate an Agent extractor, post-activation filtering or behavior improvement.

