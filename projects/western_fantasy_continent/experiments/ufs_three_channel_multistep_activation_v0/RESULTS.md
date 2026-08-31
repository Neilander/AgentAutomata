# UFS three-channel multi-step activation V0 results

- Run date: 2026-08-31
- Encoder: real local `gte-multilingual-base`
- Channels: Q-before GTE / structural operations / Q-after GTE
- Aggregation: none
- Memory bank: correct two-step research, advance-0, reversed-order and energy-room trajectories
- Queries: three correct paraphrases, reversed order and advance 0
- Frozen checks: all passed

## Main result

Every query produced exactly one `complete_convergence` candidate, and it was always the expected trajectory:

| Query | Unique complete convergence |
|---|---|
| Correct research paraphrase 1 | `research-two-step-target` |
| Correct research paraphrase 2 | `research-two-step-target` |
| Correct research paraphrase 3 | `research-two-step-target` |
| Reversed operation order | `research-reversed-order-confuser` |
| Advance 0 | `research-zero-advance-confuser` |

No joint vector, sum, weighted score or average was calculated.

## Correct-query evidence

All three correct paraphrases normalized to the same typed relation and produced the same classification:

| Candidate | Q-before | Operations | Q-after | Classification |
|---|---|---|---|---|
| Correct `resolve → advance(2)` | high | exact | high | `complete_convergence` |
| `resolve → advance(0)` | high | parameter conflict | not high | `before_only` |
| `advance(2) → resolve` | high | order conflict | high | `endpoint_convergence_without_operation` |
| Energy room | not high | type/count conflict | not high | `not_high` |

This is the distinction the average-based version lost. The reversed-order memory is genuinely related: it has the same start and same result, so both Q channels are high. It is not called a complete wake-up because its ordered operation structure conflicts. The advance-0 row shares the same start but conflicts on both the operation parameter and result.

## Channel mechanics

- Q-before and Q-after are separately compiled GTE vectors.
- Operations never enter either vector. They are compared as ordered structured records with operation count, per-position type and named parameters.
- A Q channel is “high” when it is within `0.0005` cosine similarity of that channel's best match. This preserves legitimate ties rather than selecting one arbitrary row.
- A full known query requires `operation.exact`. Partial-operation compatibility is represented by the matcher but was not claimed by this full-information test.
- Each candidate retains all three pieces of evidence. Classification reads the tuple; it does not reduce it to one scalar.

## What this proves

For a controlled already-learned multi-step bank with correctly normalized structured input, independent Q-before, operation and Q-after evidence can uniquely distinguish:

- the correct two-step sequence;
- the same endpoints with reversed operation order;
- the same starting situation with a different operation parameter and result.

It also confirms that high Q-before plus high Q-after is not sufficient: operation compatibility is an independent necessary dimension when endpoints are shared.

## Limits

- Revision 9's 275 historical trajectories have no explicit `operations[]`; this remains an assumed-learned controlled bank, not a retroactive claim about that player.
- The three natural-language queries use fixture-provided normalized typed relations. Agent extraction accuracy is not tested here.
- The high-band epsilon is a frozen engineering choice, not calibrated on a large dataset.
- Operation matching is exact for these full queries. Missing fields, partial observations and approximate parameter relations require a separate perturbation test.
- This is activation classification, not the later post-activation rule/state validation stage and not planning benefit.

## Next step

Keep this three-channel result shape and perturb one channel at a time: omit one Q-before field, hide one Q-after value, omit an operation parameter, and introduce one incorrect operation parameter/order. The desired behavior is graceful degradation from `complete_convergence` to a clearly named partial class, never a silent average-driven replacement.

## Validation

- Five queries, four candidates, 18 real-GTE endpoint vectors.
- Expected unique complete convergence: 5/5.
- Three target paraphrases had identical classifications.
- Reverse order and advance 0 remained distinct.
- Runtime source and player profiles were not modified.
- `git diff --check`: passed with existing Windows line-ending warnings only.

