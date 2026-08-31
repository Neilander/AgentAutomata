# Results: live AI sequential rollout round V1

## Bottom line

The stale-snapshot or “刻舟求剑” failure is fixed in this isolated live-planning path.

The rolling AI no longer wrote `research -> AA` while assuming the AA target would survive research. It constructed and executed:

`Q0 -> gray-5 AA -> predicted Q1 -> validate research -> white-6 research -> predicted Q2`

AA was executed while `purple-2` was still a supported visible target. The predicted endpoint `row 4, column 2` later matched the formal result exactly. After the real AA action, the research die and room were visible and the research anchor was explicitly revalidated before execution.

## Structural repair

`sequential-q-rollout.js` enforces four rules:

1. validate each step's anchor against the current Q;
2. imagine the action and emit a new Q;
3. feed that new Q into the next step;
4. stop or replan when the next anchor is unsupported or uncertain.

Three focused boundaries pass:

- if step 1 removes the AA target, step 2 is invalidated before imagination;
- if step 1 preserves the target, step 2 receives Q1 and continues;
- if probabilistic attention may have omitted the target, status is `uncertain`, execution pauses, and deterministic benefit cannot be claimed.

## Same-condition replay

The V1 replay used the exact V0 conditions:

- attention seed `2026082504`;
- paired public reroll `gray-5`, `white-6`;
- same energy/fighter opening prefix;
- same energy → research +2 → fighter room policy;
- first-listed legal spawn policy in both branches.

The treatment differed only after the public reroll:

- Static: gray-5 research, then white-6 tunnel.
- Sequential rolling: gray-5 AA while the visible target exists, then white-6 research after Q1 revalidation.

## Formal paired outcome

| Metric | Static | Sequential rolling | Rolling change |
|---|---:|---:|---:|
| Energy | 1 | 1 | 0 |
| Research | 2 | 2 | 0 |
| Damage | 0 | 0 | 0 |
| Mothership row | 1 | 0 | 1 row avoided |
| Maximum ship row | 5 | 5 | 0 |
| Total ship rows | 12 | 11 | 1 lower |
| Active ship count | 5 | 6 | 1 more |
| Active white ships | 0 | 1 | 1 more |
| Rejected operations | 0 | 0 | 0 |

This is a real improvement on mothership descent and aggregate ship depth, but not an unqualified scalar win: rolling also ends with one additional white ship at row 0. A later contextual value/utility mechanism must decide how to trade immediate depth against future active-ship count. This experiment does not smuggle in that missing preference.

## Repair acceptance

All repair checks passed:

- AA target formally existed immediately before AA.
- AA formally changed the ship state.
- predicted `purple-2` endpoint matched formal Q1.
- actual post-AA research anchor status was `supported`.
- research executed only after revalidation.
- no stale-snapshot benefit claim occurred.

This directly contrasts with V0, where research removed the target before AA and AA changed nothing.

## Limits

- The repair currently lives in the isolated sequential-planning experiment; it has not replaced default `planCurrentChoice()`.
- AI-authored predicted Q fields still need a general automatic producer from awakened trajectories.
- Probabilistic omission is represented conservatively, but belief fusion across long histories remains incomplete.
- One paired round cannot establish win-rate improvement.
- The value trade-off between mothership depth and extra ship count remains intentionally unresolved.

## Validation

- Sequential and paired-result focused tests: 5/5 passed.
- Full UFS regression suite: 156/156 passed.
- Both formal branches reached `waiting_for_next_round_roll`; rolling used 14 accepted actions, static 13, with 0 rejects.
- `git diff --check`: passed aside from existing Windows line-ending warnings.

## Recommended next step

Connect this sequential Q-chain contract to automatic trajectory-based imagination for candidate continuations. Keep the conservative anchor rule: an unsupported next anchor invalidates the branch, and an attention-uncertain anchor cannot claim deterministic benefit. Only then consider replacing the default single-step planner.
