# UFS learned-trajectory cognitive-field activation benchmark V1 results

- Run date: 2026-08-30
- Frozen learned profile: V24 attempt 02 revision 9
- Personal trajectory matrix: 275/275 `compiled_matrix`
- Encoder: real local `gte-multilingual-base`
- Fresh ownership control: 0 personal trajectories and no personal GTE overlay
- Result: **the frozen acceptance thresholds did not pass**

No player profile was modified, no action was submitted, and no new feedback was learned during this read-only benchmark.

## Primary frozen scores

| Cell | Result | Frozen requirement | Pass |
|---|---:|---:|---:|
| Exact target-ID Hit@1 | 11/12 (91.7%) | 12/12 | No |
| Paraphrased positives Hit@3 | 16/36 (44.4%) | at least 27/36 | No |
| Pass-1 combined Hit@3 | 4/6 | at least 5/6 | No |
| All three passes stay Top-3 | 2/6 | at least 4/6 | No |
| Near-miss target false Hit@3 | 2/6 | at most 1/6 | No |
| Unrelated target false Hit@3 | 0/6 | at most 1/6 | Yes |
| Cue evidence grounding | 36/36 cues valid | 100% | Yes |
| Fresh personal candidates | 0 | 0 | Yes |

All 60 learned-profile cases and their 60 empty-fresh ownership checks were constructed from the preregistered six targets. The 36 controlled Agent cues compiled into 108 before/after query vectors in one GTE batch.

## Per-situation combined ranks

Lower is better. The three pass columns use separately phrased, knowledge-grounded cue summaries of the same public situation.

| Situation | Pass 1 | Pass 2 | Pass 3 | Pass-1 + noise |
|---|---:|---:|---:|---:|
| Incomplete energy room, first cell | 1 | 147 | 116 | 20 |
| Energy room, completing second cell | 55 | 149 | 137 | 71 |
| Research choice with legal range 0..0 | 1 | 1 | 1 | 1 |
| End rooms, mothership row 5→6 | 5 | 5 | 9 | 4 |
| Same-column placement reaches damage 3 | 3 | 12 | 11 | 51 |
| Free tunnel leaves energy at 1 | 1 | 1 | 1 | 4 |

Only the zero-budget research and free-tunnel memories remained Top-3 in all three passes. Extra unrelated cues caused large rank collapses for incomplete energy and damage-3, so the current equal merge is not noise-robust.

## What the exact miss means

The single exact target-ID miss was the mothership Q-before row. Its target ID ranked 6, but ten stored trajectories have the same canonical Q-before and the rank-1 row was one of those exact endpoint duplicates. Therefore:

- the original target-ID metric honestly remains failed at 11/12;
- an additional, non-frozen endpoint-equivalence diagnostic is 12/12 Hit@1;
- the memory store needs duplicate/context handling rather than interpreting every duplicated row ID as a semantic encoder error.

## Context diagnostic, not a benchmark score

As an oracle-only upper bound, the same positive queries were repeated after filtering with the target trajectory's full stored `applicability`. This is answer-leaking and cannot be used as the deployed mechanism, but it isolates the failure source:

- paraphrased positives became 36/36 Top-3 (33/36 Top-1);
- pass-1 combined became 6/6 Top-1.

This shows that GTE semantic similarity is useful, but querying all 275 contextually different trajectories as one undifferentiated pool is the dominant current bottleneck. A runtime implementation must derive a partial context gate from actually noticed state rather than receiving the target context.

## Additional failure signals

- Combining Q-before and Q-after by unconditional evidence addition can make recall worse. For the completed energy room, Q-after alone ranked 2 while combined ranked 55. For damage-3, Q-after alone ranked 1 while combined ranked 3.
- The near-miss test falsely retained the target in Top-3 for 2/6 cases. The zero-budget research target was rank 1 for its confuser because the stored Q endpoints are identical and only applicability distinguishes them.
- Although the specifically unrelated target never entered Top-3, every unrelated query still produced some other candidate above the current `0.55` threshold (6/6, top similarities 0.60–0.66). The prototype therefore has no reliable abstention rule.
- Pass-to-pass phrasing is unstable: four of six targets left Top-3 in at least one pass.

## Decision

Do not connect this V0 activation merger to live planning yet. The next narrow experiment should derive a query context from public noticed state, apply context as a soft or staged gate, weight competing cue channels instead of blindly summing them, and add an abstention/margin rule. Rerun this exact frozen benchmark after that change; only then test whether retrieved units improve two-step planning choices.

## Validation

- Focused cognitive-field tests: 4/4 passed.
- Full UFS suite: 16 files, 156/156 passed.
- Benchmark grounding: 0 errors.
- `git diff --check`: passed; only existing Windows line-ending warnings.

