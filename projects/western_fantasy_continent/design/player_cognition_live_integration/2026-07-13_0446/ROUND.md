# V2 Long-Horizon Causal Closure

- Date: 2026-07-13 04:46 CST
- Phase: reopened Phase 1
- Result: passed; V2 frozen and Phase 2 may resume

## Causal Change

V2 adds one missing cognition loop without modifying gameplay:

```text
visible team power at failure
-> failure baseline and wake condition
-> visible equipment growth during preparation
-> explicit power-growth hypothesis
-> threshold crossing
-> failed-goal reconsideration
-> retry verification
```

It also converts a fully completed region with no unfinished visible nodes into a terminal conclusion rather than another farm choice.

## Reviewer-Found Revision

The first candidate behaviorally passed but allowed `observedPower` to enter failure memory without proving the number was visible. One reviewer returned REVISE.

The correction:

- marks team power as an explicit visible numeric metric in the real event log;
- stores a baseline only when `presentation.visible && presentation.hasNumber`;
- adds a hidden-power counterexample;
- includes power growth in the action summary;
- gives preparation repetition an explicit, verifiable power-growth hypothesis.

Both reviewers then returned ACCEPT.

## Deterministic Controls

- 100 -> 125 visible power: Boss remains dormant.
- 100 -> 131 visible power: Boss is reconsidered.
- Hidden power 100 -> later power 1000: no baseline and no wake-up.
- Unfinished failed goal: repeated preparation remains possible.
- Completed region: terminal conclusion.

## Full-Region Result

Five paired seeds, maximum 40 actions:

| Metric | V1 | V2 |
|---|---:|---:|
| Boss reached | 5/5 | 5/5 |
| Boss cleared | 3/5 | 5/5 |
| Failed runs that retry | 0/2 | 2/2 |
| Terminal conclusions | 0/5 | 5/5 |
| Terminal repeated-action attractors | 5/5 | 0/5 |

Concrete retry evidence:

- `phase2-a`: visible failure baseline 934, retry at 1238 (+32.55%), then win.
- `phase2-b`: visible failure baseline 975, retry at 1288 (+32.10%), then win.

## Integrity

- Gameplay changes: none.
- Frozen V1 changes: none; hashes remain identical.
- Direct psychological outputs injected by game events: none.
- V2 parameter additions are recorded in `FROZEN_V2.md` and are now frozen for gameplay A/B.

