# Phase 2 Gameplay A/B 01: Boss Preparation Node

- Date: 2026-07-13 05:16 CST
- Phase: Phase 2 gameplay design
- Model: Frozen V2, hashes unchanged
- Result: accepted candidate; isolated from the formal map

## Baseline Diagnosis

The first negative beat is the Prison loss at step 4. It is intentional lock-key frustration: the visible character reward creates desire, the defeat establishes a problem, and the main path remains available.

The first harmful low appears after a Boss loss:

- The player correctly knows that visible power must grow by about 30%.
- The highest perceived preparation ROI is stale Main3.
- Loss seeds repeat Main3 11-13 times after the Prison clear.
- Some wins produce no equipment growth, refute the preparation hypothesis, and are followed by the same action anyway.

This is a gameplay affordance/loot-economy problem, not a Frozen V2 model defect.

## Single Gameplay Change

After Boss failure and only while current visible equipment power is below 130% of the failure baseline:

- cleared Main9 temporarily becomes an `available` Boss preparation node;
- its visible reward hint becomes `首领整备点：3件 Lv10-16 装备，稀有率提升`;
- it drops three Lv10-16 items at 70% common, 28% rare, and 2% epic;
- once the visible threshold is reached, Main9 returns to its ordinary farm state and the Boss becomes the top action again.

Boss stats, Prison, the wake threshold, cognition parameters, and all Frozen V2 files are unchanged.

## Matched Five-Seed A/B

Only the two Boss-loss seeds enter the variant rule; the three first-attempt victories are identical.

| Metric on Boss-loss routes | Baseline | Candidate |
|---|---:|---:|
| Preparation actions | 13.0 | 4.0 |
| No-growth preparation actions | 2.0 | 0.0 |
| Preparation emotion per action | 0.8615 | 1.8350 |
| Visible preparation gear gain | 308.5 | 333.0 |
| Retry and win | 2/2 | 2/2 |
| Normal terminal conclusion | 2/2 | 2/2 |
| Final accumulated emotion | 60.8299 | 56.4889 |

The lower final stock is not treated as a regression by itself. The baseline contains nine extra mildly positive loops, so it mechanically accumulates more emotion. The candidate has a higher feedback rate, no dead growth checks, clearer agency, and reaches the same verified outcome sooner.

Concrete routes:

- `phase2-a`: Boss fails at 934; Prison then Main9 twice; power reaches 1245 (+33.3%); Main9 expires; Boss retry wins at step 17 instead of step 26.
- `phase2-b`: Boss fails at 975; Prison then Main9 four times; power reaches 1330 (+36.4%); Main9 expires; Boss retry wins at step 19 instead of step 28.

## Long-Tail Check

Thirty additional paired seeds produced 20 Boss-loss routes:

- average candidate preparation actions: 3.3;
- maximum candidate preparation actions: 5;
- no-growth preparation actions: 0;
- failed to retry/win: 0/20;
- failed to reach terminal conclusion: 0/20.

## Independent Review

Two independent players returned ACCEPT. Both identified improved agency, causal learning, and rhythm. They also agreed that accumulated final emotion is not comparable across routes of different length without normalization.

## Integrity

- Frozen V2 files and hashes: unchanged.
- Psychological parameters changed: none.
- Direct R/Q/A/Agency/emotion values supplied by gameplay: none.
- Formal map changed: no; this remains an isolated Phase 2 candidate.

