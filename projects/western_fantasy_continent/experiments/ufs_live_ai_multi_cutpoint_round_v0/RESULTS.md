# Results: live AI multi-cutpoint round V0

## Bottom line

The live AI successfully generated and executed multiple cut-ins and multi-step plans through one real attention-limited round, but its rolling revision produced **no measured benefit** over the frozen opening plan.

This is a useful negative result: producing a plausible sequence of anchors is not yet the same as imagining the intermediate state transitions inside that sequence.

## What the AI actually did

1. Opening result/environment cut-ins:
   - `researchIndex = 0` created the research intent.
   - energy `2`, research cost `2`, and a free two-cell energy room created the support intent.
   - Plan: complete energy, take research, use fighter, provisionally put the last die in the tunnel.
2. Attention-omission cut-in:
   - after the two energy placements, the research room remained visible but its callable cell was omitted.
   - The AI repaired execution order by moving the visible fighter placement earlier without abandoning the two anchors.
3. Post-reroll result/environment cut-ins:
   - the host freshly drew gray `5` and white `6`; the same observation was replayed to the static branch.
   - the new public view showed `purple-2` at row `0`, column `2`, plus column-2 AA and tunnel cells.
   - Static kept research + tunnel. Rolling chose research + AA.
4. Room-operation cut-in:
   - both branches used energy → research +2 → fighter → end because of the payment dependency.
5. Both branches used the same first-listed legal spawn policy.

## Formal paired result

| Metric | Static opening plan | Rolling live-AI plan | Rolling benefit |
|---|---:|---:|---:|
| Energy | 1 | 1 | 0 |
| Research | 2 | 2 | 0 |
| Damage | 0 | 0 | 0 |
| Mothership row | 1 | 1 | 0 |
| Maximum ship row | 5 | 5 | 0 |
| Total ship rows | 12 | 12 | 0 |
| Rejected operations | 0 | 0 | 0 |

Both branches reached `waiting_for_next_round_roll` after 13 accepted operations.

## Why the plausible revision did not help

At the post-reroll cutpoint, the AA anchor had a visible target: `purple-2` in the same column. But the rolling sequence was:

1. place gray-5 in research;
2. then place white-6 in AA.

Post-hoc formal timeline inspection shows that `purple-2` was already absent immediately after step 1. The AA placement at step 2 therefore changed no formal ship state. The static tunnel placement also changed no ship state, so the two branches reconverged before room resolution.

The AI had compared two named continuations, but it did not actually update Q/state after the first action inside each continuation. Its reasoning effectively said “research is good and AA has a target” while evaluating those facts at one snapshot. This is precisely the remaining gap between:

- a multi-action list; and
- a real multi-step imagination where `Q0 + A1 -> Q1`, then candidate `A2` is checked against `Q1`.

Natural attention made this harder: after the research placement, absence from the compact view alone could mean either true removal or omission. A robust planner must carry its prior belief, simulate the first action, mark uncertainty, and revalidate the second anchor rather than silently retaining it.

## What is proven and what is not

Proven in this one round:

- a live AI can generate result-led, environment-led, attention-repair, and operation-led cut-ins from player-visible views;
- the formal host can execute the resulting plan with probabilistic attention and no illegal actions;
- paired static/rolling branches can share attention and random observations while keeping state isolated;
- a rolling plan can change without improving the outcome.

Not proven:

- that live-AI rolling planning improves one-round reward;
- that the AI actually performs Q-by-Q internal rollout for every action in a plan;
- that absence under probabilistic attention is handled correctly;
- any whole-game or win-rate improvement.

## Evidence and validation

- Machine comparison: `evidence/paired-round-result.json`.
- Public decision inputs: `evidence/cutpoint-*.json` plus both machine transcripts.
- Pre-action decisions: `decisions/*.json`.
- UFS regression suite: 156/156 passed.
- `git diff --check`: passed; only existing line-ending warnings were emitted.

## Next experiment

Keep the same live-AI/paired-host design, but require each candidate plan to emit an intermediate predicted state after every action. Before applying action 2, test whether its anchor still has support in predicted `Q1`; after the real action 1, compare the new attention-limited view against that prediction and either preserve, revise, or mark the plan uncertain. The acceptance target is not “must change plan”, but “must not claim a downstream benefit from a precondition that its own earlier step removed.”
