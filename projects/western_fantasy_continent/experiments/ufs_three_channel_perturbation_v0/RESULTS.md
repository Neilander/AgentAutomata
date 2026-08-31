# UFS three-channel perturbation V0 results

- Run date: 2026-08-31
- Channels: independent Q-before GTE / structured operations / Q-after GTE
- Aggregation: none
- Perturbations: one baseline, three missing fields, three inconsistent errors, one coherent reversed-order error
- Frozen checks: all passed

## Summary

| Input | Correct target classification | Complete convergence | Result |
|---|---|---|---|
| Full baseline | `complete_convergence` | correct target only | Pass |
| Missing Q-before energy | `partial_convergence` | none | Graceful degradation |
| Missing Q-after research | `partial_convergence` | none | Graceful degradation |
| Missing operation `advanceSteps` | `partial_convergence` | none | Graceful degradation |
| Wrong operation says advance 0, Q-after says +2 | `endpoint_convergence_operation_conflict` | none | Contradiction retained |
| Wrong Q-after says research stays 0, operation says +2 | `method_convergence` | none | Contradiction retained |
| Wrong Q-before says energy room, method/result say research | `result_convergence` | none | Contradiction retained |
| Reversed operations with matching reversed memory | `endpoint_convergence_operation_conflict` | reversed row only | Coherent wrong input followed |

No missing or internally inconsistent query was promoted to a complete wake-up.

## Missing evidence

The result records coverage separately from similarity.

- Removing Q-before energy changed before coverage from `5/5` to `4/5`. The target still had high Q-before similarity, exact operations and high Q-after similarity, but became `partial_convergence` because the before evidence was incomplete.
- Removing Q-after research behaved symmetrically: high similarity remained, but `4/5` after coverage prevented complete convergence.
- Removing `advanceSteps` made the target operation status `compatible`, not `exact`. The target remained partial. The advance-0 row was also method-compatible, but its Q-after was not high, so it did not become complete.

This is the desired behavior: missing evidence stays usable without being silently treated as known.

## Inconsistent errors

- Querying operation `advanceSteps=0` while retaining Q-after research `2` split the evidence. The zero-advance memory matched the method but not the result; the target matched both endpoints but conflicted on operation. No complete candidate existed.
- Querying Q-after research `0` while retaining operation advance 2 left the target as method convergence and the zero-advance row as endpoint evidence with an operation conflict. Again, no complete candidate existed.
- Querying an energy-room Q-before with research operations/result left the target as result convergence and the energy memory as Q-before-only evidence.

The three channels expose the contradiction instead of hiding it inside an average.

## Coherent wrong input boundary

When only the operation sequence was reversed, the reversed-order memory became the unique complete convergence because:

- the starting state was high;
- the reversed operation sequence matched exactly;
- the reversed memory has the same Q-after as the correct sequence.

This is not an arithmetic failure. The structured query itself consistently describes the reversed memory. Activation alone cannot know that an upstream observer or extractor produced a coherent false description. State/rule validation after activation is required for this case.

## Conclusion

The independent three-channel contract passed its first robustness test:

- missing information degrades to partial evidence;
- contradictory channels remain visibly contradictory;
- no average can conceal a bad operation or endpoint;
- fully coherent but wrong structured input remains the explicit boundary for later validation.

The next step can now move to extraction and validation: generate these three channels from an actual noticed state and rule knowledge, then verify the awakened operation sequence is legal and its Q-after is feasible before planning uses it.

## Validation

- Eight perturbation cases against four no-ID controlled memories.
- Missing cases correctly partial: 3/3.
- Inconsistent errors with no complete result: 3/3.
- Baseline correct and reversed coherent-input boundary reproduced.
- No average/joint/aggregate candidate field: executable check passed.
- Runtime source and player profiles were not modified.
- `git diff --check`: passed with existing Windows line-ending warnings only.

