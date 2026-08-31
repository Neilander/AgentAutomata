# UFS structured-relation multi-step activation V0 results

- Run date: 2026-08-30
- Encoder: real local `gte-multilingual-base`
- Candidates: four controlled already-learned trajectories
- Queries: three target paraphrases, one reversed-order query and one zero-advance query
- Compiled vectors: 54 in one batch
- Episode-specific IDs: none
- Frozen coarse checks: passed

## Why this is controlled rather than the revision-9 player

The revision-9 player has 275 compiled historical feedback trajectories, but all 275 predate explicit `operations[]`; their operation count is zero. They can test Q endpoints but cannot honestly test `Q-before + ordered operations + Q-after`. This experiment therefore constructs the assumed-learned multi-step bank through the current representation contract.

## Target paraphrase ranks

Each tuple is `Q-before rank / Q-after rank / joint-average rank` for the correct `resolve research room → advance 2` trajectory.

| Representation | Paraphrase 1 | Paraphrase 2 | Paraphrase 3 |
|---|---:|---:|---:|
| Natural-language endpoints only | 1 / 1 / 1 | 2 / 1 / 2 | 2 / 1 / 1 |
| Natural language + ordered operations | 2 / 1 / 1 | 2 / 1 / 2 | 2 / 1 / 2 |
| Typed relations + ordered operations | 1 / 2 / 1 | 1 / 2 / 1 | 1 / 2 / 1 |

The typed representation made all three target paraphrases stable: Q-before rank 1 and joint rank 1 every time. The correct target was also joint rank 1 for the reverse-order and zero-advance queries' corresponding expected memories.

## What each route contributes

- Q-before plus ordered operations distinguishes `resolve → advance` from `advance → resolve` even when both end in energy `0`, research `2`.
- Q-after correctly captures the result, but cannot logically distinguish two memories with identical endpoints. In the typed target query it ranks the reversed-order row first and the correct row second because their Q-after vectors are exactly tied and the deterministic ID tie-breaker wins.
- Joint similarity recovers the correct target because the Q-before/operation route resolves the ordering ambiguity.
- The union of Q-before Top-2, Q-after Top-2 and joint Top-2 contained the expected memory in all 15 representation/query runs. This supports retaining three candidate routes rather than one average-only list.

## Important margin warning

The typed result is correct but not yet robust. For the target query:

- correct joint similarity: `1.000000`;
- reversed-order confuser: `0.999775`;
- zero-advance confuser: `0.998389`.

The operation order and `advanceSteps=0/2` are present, but embedding them as text inside a 3840-dimensional semantic vector produces very small margins. The exact structured query wins because canonical extraction emits the same representation as the stored target; a small extraction error could erase the lead.

Natural-language plus operations alone did not fix the problem: on paraphrases 2 and 3 the reversed-order memory still won the joint route. This means merely appending an operation JSON string to free prose is insufficient.

## Conclusion

The representation direction is feasible but only partially successful:

1. canonical typed relations without episode IDs can stabilize the correct multi-step rank;
2. ordered operations genuinely add information that Q-after cannot contain;
3. Q-before leaders, Q-after leaders and joint leaders should be preserved as separate candidate classes;
4. typed relations should not live only as ordinary GTE text, because the measured margins are too small.

The next activation experiment should add an explicit structured-relation channel alongside GTE—not yet a post-retrieval filter. It should calculate compatibility for operation type/order, phase, object role/type and before/after values, then combine that channel with semantic activation while preserving the three route lists. After its margins are tested under small extraction perturbations, post-activation validation can be added separately.

## Validation

- All five typed queries returned their expected memory at joint rank 1.
- All expected memories appeared in the three-route Top-2 union.
- Three target paraphrases had identical typed ranks.
- Reverse order and zero advance remained separately retrievable.
- No player profile, game or runtime source was modified.
- Full UFS runtime regression remains 156/156 from the preceding work unit; this unit added only isolated experiment files.
- `git diff --check`: passed with existing Windows line-ending warnings only.

