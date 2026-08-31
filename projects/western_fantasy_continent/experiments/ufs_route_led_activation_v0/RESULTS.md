# UFS route-led activation V0 results

- Run date: 2026-08-31
- Domain: UFS research/energy room trajectories
- Endpoint encoder: real local `gte-multilingual-base`
- Routes: Q-after / Q-before / operation
- Aggregation: none
- Frozen checks: all passed

## Correction

This result supersedes the earlier idea that a memory must have high Q-before, exact operations and high Q-after to count as awakened. Activation is route-led: only the side that triggered recall is checked at this stage. Other sides are recalled content, not activation gates.

## Q-after-led result

Cue: “research increases”, with amount and cost unspecified.

| Awakened memory | Research change | Energy change | Result-side accepted |
|---|---:|---:|---:|
| Research advance 2, cost 2 | +2 | -2 | Yes |
| Reversed operations, same endpoint | +2 | -2 | Yes |
| Research advance 1, cost 3 | +1 | -3 | Yes |
| Energy-room gain | 0 | +2 | No |

The advance-1 memory remains accepted despite losing three energy because the triggering request was only “research increases”. Its cost is preserved as a side effect for later reasoning. The reversed-order memory also remains recalled because it genuinely contains the desired result; operation validity is not a result-side activation requirement.

The research-zero memory ranked outside the frozen endpoint Top-4 and contains no research increase in any case.

## Q-before-led result

Cue: rooms phase with a resolvable research room; exact energy and research values are not required.

Accepted memories:

- advance 2, cost 2;
- advance 1, cost 3;
- advance 0;
- reversed operation order.

All four share the relevant starting side. Their later method and outcome differences do not suppress Q-before recall. The energy-room memory was not accepted as a related starting side.

## Operation-led result

Cue shape: `resolve research room → choose research advance`, with cost and advance amount unspecified.

Accepted memories:

- advance 2;
- advance 1;
- advance 0.

The reversed row did not match because order is part of the triggering operation side. The one-step energy-room operation also did not match.

## Non-trigger-side interference

Each route was repeated with deliberately unrelated values on the other two sides:

- Q-after route received an energy-room Q-before and energy-room operation;
- Q-before route received an energy-room operation and impossible energy-result decoy;
- operation route received energy-room before/after decoys.

Activated and accepted IDs were unchanged in all three routes. The implementation never reads non-trigger sides during route selection.

## Conclusion

The UFS test supports the corrected activation rule:

- Q-after-led recall checks only whether the desired effect occurs, while preserving costs and other consequences;
- Q-before-led recall checks only whether the memory starts from the relevant kind of situation;
- operation-led recall checks only method shape/order, allowing parameter and endpoint variation;
- no weak non-trigger channel can average away a strong trigger-side memory.

What happens after recall remains separate. A reversed operation can be useful to remember from the result side even if it later fails applicability or legality checks. Activation should remember it first; later reasoning decides how to use it.

## Limits

- This is a controlled no-ID UFS bank, not the historical revision-9 player whose old rows lack operations.
- Trigger cues and desired side conditions are fixtures, not generated from live attention by an Agent.
- Endpoint Top-4 is an engineering pilot choice.
- Applicability, adaptation, legality, planning value and post-activation filtering are deliberately not tested here.

## Real-use status

The controlled mechanism has passed, but real usability has not yet been observed. Future formal playtests must use [`REAL_USE_CHECKLIST.md`](REAL_USE_CHECKLIST.md): the memory must have been learned by the real feedback flow, the checkpoint and trigger must arise naturally, and recall must compete in the player's actual personal store. Filtering and planning improvement remain separate verdicts.

## Validation

- Q-after expected accepted set: passed.
- Q-before expected accepted set: passed.
- Operation expected accepted set: passed.
- Non-trigger decoy invariance: 3/3 passed.
- Costly research side effect `energy -3` preserved: passed.
- Exactly one trigger route per returned candidate: passed.
- No average/joint/aggregate candidate field: passed.
- Runtime source and player profiles were not modified.
- `git diff --check`: passed with existing Windows line-ending warnings only.
