# Run 01: Main 6 Lock-Key Emotional Validation Recovery

- Time: 2026-07-13 12:55 Asia/Shanghai
- Result: REJECT
- Model under test: Frozen V3, hashes unchanged
- Gameplay implementation changed: no
- Psychological parameters changed: no
- Browser/UI work: none

## Invariant Objective

Verify that a real game design change produces different real events, which the frozen player model turns into causally traceable emotion and next-behavior changes, and that the complex model adds useful evidence beyond a simpler baseline.

## Four Drift Questions

1. Emotional claim: the Main 6 lock, Bandit key, and retry create a meaningful loss-recovery-verification arc that the full model diagnoses beyond direct result scoring.
2. Real design variable: the binary presence of the complete candidate lock-key package: Main 6 heavy-shield resistance plus the corresponding visible Bandit key reward. The existing data cannot separately attribute the field and reward subcomponents.
3. Changed real events: the baseline wins Main 6 directly; 19/30 candidate routes lose Main 6, win Bandit, receive key equipment, then retry and win Main 6.
4. Emotion and behavior: Frozen V3 produces a loss dip, key recovery, and retry recovery, but the result-only ablation produces the same qualitative arc and identical candidate routes. The immediate Bandit choice is unchanged when emotion is locally neutralized.

## Paired Result

Thirty paired seeds used the same Frozen V3 files and initial setup.

| Metric | Baseline | Candidate |
|---|---:|---:|
| Main 6 lock routes | 0 | 19 |
| Average final emotion | 54.7621 | 54.9952 |
| Average emotion gain/action | 1.1973 | 1.1635 |
| Longest no-positive-feedback interval, all routes | 28.9973 s | 34.1753 s |
| Longest no-positive-feedback interval, candidate loss-route subset | 28.9095 s | 35.9905 s |

The no-feedback metric is an audit metric, not a new model parameter: accumulated simulated time between accepted signals with `emotionDelta > 0.05`.

## Event-To-Emotion Trace

Representative paired seed: `midlock-ab-2`.

### Baseline Main 6

- Decision E: `+0.16`; explicit exploration hypothesis.
- Real result: Main 6 win.
- Event totals: process `-0.1589`, direct result `R +1.1089`, mismatch `A -0.0261`.
- Net action change including decision: about `+1.0839`.
- Hypothesis: confirmed by visible combat win.
- Next behavior: continue to Main 7.

### Candidate Main 6 Loss

- Decision E: `+0.16`; same exploration hypothesis.
- Real result: Main 6 loss.
- Event totals: process `-0.6384`, `R -0.7335`, `A -0.0449`.
- Net action change including decision: about `-1.2568`.
- Hypothesis: refuted at action summary; failure memory records the visible encounter and power baseline after feedback.
- Emotion: `45.5445 -> 44.2875`.
- Next behavior: Bandit.

### Bandit Key

- Decision E: `+0.16`; visible first-clear reward creates an exploration hypothesis.
- Real result: Bandit win plus three visible key items and about 103% average visible gear growth on loss routes.
- Event totals: process `-0.1934`, `R +1.9893`, `A -0.0920`.
- Net action change including decision: about `+1.8639`.
- Emotion: `44.2875 -> 46.1513` in the representative seed.
- Next behavior: immediate Main 6 retry.

### Main 6 Retry

- Decision E: `+0.16`; prior failure plus visible growth creates a retry hypothesis.
- Real result: win.
- Event totals: process `-0.3374`, `R +1.0750`, `A +0.5125`.
- Net action change including decision: about `+1.4101`.
- The action-summary expectation compares prior `-1` utility with actual `+1.2`, creating `A +0.4891`; the retry hypothesis is confirmed.
- Emotion: `46.1513 -> 47.5610` in the representative seed.

Across 19 loss routes, the Frozen V3 checkpoint arc is:

```text
46.0372 -> 44.7889 -> 46.6366 -> 48.1561
before lock -> loss -> key -> retry win
```

## Ablations

### Result-Only Shadow Model

For analysis only, process coefficients and mismatch scales were set to zero without editing project files. `R`, real events, learning, and policy remained.

- Candidate route differences from full model: `0/30`.
- Lock routes: `19`, same as full model.
- Baseline/candidate final emotion: `56.1642 / 56.4186`, still favoring candidate by the same small direction.
- Loss-route arc: `46.2542 -> 45.5462 -> 47.5309 -> 48.6986`.

Therefore direct results already reproduce the qualitative dip/recovery and design ranking.

### Emotion-To-Behavior Checks

- Neutralize emotion only at the immediate post-loss choice: Bandit remains selected `19/19`.
- Neutralize emotion at every decision: all 30 candidate routes differ and all 30 hit the lock.

The global test proves cumulative emotion can affect exploration policy, but it also changes earlier actions, gear, and knowledge. It does not prove the Main 6 emotional arc causes the local key choice.

## Component Judgment

- Useful in this case: direct result `R`; failure memory; visible power-growth wake logic.
- Globally active but not locally proven here: scalar accumulated emotion.
- Numerically active but diagnostic-only here: `A`; it changes retry amplitude but not route or verdict.
- Unproven by this A/B: `H`, E/W decomposition, explicit P/Q, learned `k`, freshness, goal weighting, and hypothesis verification as necessary design diagnostics.
- Trace gap: V3 exposes component emotion totals but does not emit explicit standalone P, Q, and k values for every settlement, so the locked trace requirement is only partially met.

## Independent Review

- Reviewer A: REJECT. The lock-key gameplay package works, but the full-model emotional contribution beyond outcome scoring is unproven.
- Reviewer B: REJECT. The focal behavior is explained by result plus failure memory; `A` is decorative for this diagnosis and other components remain unproven.

## Conclusion

Reject the broad model-validation claim. Preserve the narrower gameplay observation only:

> The package creates a reliable power-growth lock-key-retry sequence whose outcomes produce a coherent scored dip and recovery. Frozen V3's additional process and expectation components have not yet demonstrated necessary design-diagnostic value for this sequence.

Do not change gameplay based on this run. The next test remains in model validation.

## Next Smallest Test

Use fixed recorded event tapes and identical observations. Replay the full model and one-component-at-a-time ablations without allowing chosen actions to alter game state. At each decision record action rank, selected-versus-runner-up margin, margin change, and the component change needed to flip the decision. Start with `A`, then process/E-W, then H/freshness.

