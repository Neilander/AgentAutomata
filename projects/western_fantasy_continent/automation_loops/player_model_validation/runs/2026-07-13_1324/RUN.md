# Run 02: Fixed-Tape A Necessity Audit

- Time: 2026-07-13 13:24 Asia/Shanghai
- Result: PASS for a narrow negative classification
- Broad complex-model gate: still open
- Frozen model files changed: no
- Gameplay changed: no
- Browser/UI work: none

## Invariant Objective

Determine whether complex player-model components add necessary design-diagnostic or behavior-predictive value after real game events, rather than merely changing displayed emotion numbers.

## Four Drift Questions

1. Emotional-model claim: `A` from expectation mismatch should affect the Main 6 diagnosis through emotion strongly enough to alter a later action rank, decision margin, or selected behavior.
2. Real design variable: the source A/B remains the binary Main 6 lock-key package versus its baseline. This run does not introduce another design change; it conditions on the existing 19 candidate loss tapes to isolate component necessity.
3. Changed real events: baseline routes win Main 6 directly; the conditioned candidate tapes contain Main 6 loss, Bandit key acquisition, and Main 6 retry win. Full and no-A shadows receive identical candidate event tapes.
4. Emotion and behavior: removing mismatch emotion changes accumulated emotion but produces no selected-action difference on the fixed tapes. It does not change the focal action rank and barely changes decision margin.

## Fixed-Event-Tape Method

For each of the 19 previously observed candidate loss routes:

1. Frozen V3 generated the real game state, observation, full decision, selected action, combat result, equipment result, RNG result, and unified event log.
2. A shadow cognition state used the same initial state and received the exact same full decisions and exact same event logs.
3. The shadow changed only mismatch scales to zero for analysis. No project file or frozen parameter record changed.
4. Before the recorded action was applied, full and no-A states independently ranked the same visible actions.
5. The queried policy state returned by ranking was discarded; only the separately applied recorded decision advanced each shadow state.

This preserves observations, knowledge-producing evidence, goals, failure-memory inputs, equipment, RNG, route, and action tape. Forced identical actions are not treated as evidence; independently queried ranks and margins are the evidence.

## Results

### All Decisions On 19 Loss Tapes

- Decisions compared: `285`.
- Selected-action differences: `0`.
- Decisions whose rounded margin changed by more than `0.00005`: `171`.
- Maximum absolute margin change: `0.0063`.
- Minimum selected-versus-runner margin was `0` in both models due to stable-order ties, but no selected action changed.

### Immediately After Main 6 Loss

- Full and no-A both selected Bandit: `19/19`.
- Recorded action rank remained first: `19/19`.
- Average full margin: `0.27917`.
- Average no-A margin: `0.27687`.
- Average margin effect from A: `+0.00230`.

### Immediately After Bandit Key

- Full and no-A both selected immediate Main 6 retry: `19/19`.
- Recorded action rank remained first: `19/19`.
- Average full margin: `0.17405`.
- Average no-A margin: `0.17405`.
- Average margin effect from A: `0`.

Across the 38 focal snapshots, minimum margin was `0.1242` and maximum absolute A-driven margin change was `0.0050`.

### Emotion Sensitivity

- Average final full-minus-no-A emotion: `+0.54795`.
- A is therefore numerically active and changes the emotional report.
- A coarse emotion sweep from `5` through `100` found no post-loss or post-key selected-action flip. The originally attempted `0` endpoint is excluded because the policy expression `emotion.value || 38` treats exact zero as 38.

## Interpretation

PASS this narrow classification:

> For these 19 Main 6 loss/key/retry tapes, A is behaviorally non-decisive and serves descriptive emotion shaping rather than necessary design diagnosis.

This does not mean expectations or A are globally useless. Fixed tapes suppress downstream route divergence, and the conclusion does not extend to unseen near-tie states or other game designs. A remains causally connected to policy through accumulated emotion and slightly changes margins.

## Independent Review

- Reviewer A: PASS, narrowly bounded. A is active but unnecessary on the tested trajectories; requested no-E/no-W next.
- Reviewer B: PASS, narrowly scoped. The intervention validly tests `A -> emotion -> policy`; warned that exact emotion zero is a fallback bug and that expectation-ledger formation itself was not removed.

## Component Status After Run 02

- `R`: useful in the Main 6 diagnosis.
- Failure memory and visible power wake: useful in the Main 6 behavior.
- `A`: descriptive-only for these fixed Main 6 tapes.
- Scalar emotion: globally connected to policy, but Main 6 local mediation remains absent.
- E/W, explicit P/Q, k, H, freshness, goal weighting, and verification: still unproven as necessary diagnostics here.

## Next Run

Run separate no-E and no-W fixed-tape shadows on both baseline and candidate tapes. Report full rank order, selected-versus-runner margin, minimum margin, maximum margin change, paired design-emotion judgment, and the coefficient multiplier required for the first behavior flip. Do not test P/Q as standalone values until the trace exposes them explicitly.

