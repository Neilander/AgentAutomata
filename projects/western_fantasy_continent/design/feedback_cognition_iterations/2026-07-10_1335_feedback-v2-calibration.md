# Feedback Cognition V2: First Calibration

- Model: `feedback-v2`
- Failure freshness recovery: `+0.40`
- Event scope: combat, progression, and world/map decisions

## Changes From V1

1. Split cumulative failure counts from active unresolved frustration. Clearing a failed object resolves the emotional `受挫` state without deleting failure history used by abandonment.
2. Reduced ordinary event intensities. A skill cast fell from 1.1 to 0.35; a normal kill from 3 to 1.3; common equipment from 9 to 4.5; main clear from 12 to 6.
3. Raised baseline decay from 3 to 4.5 per five seconds and reduced initial stock from 45 to 38.
4. Added player profiles through decay only: tolerant 3, baseline 4.5, strict 6 per five seconds.
5. Kept relevant-failure freshness recovery at forty percentage points.

## First-Level Sample

Baseline explorer seed `inspect-A`:

- Start: 38, `平稳`.
- First level end: 57.875, `投入`.
- Contributions: world 5.0, combat 6.24, progression 17.635.
- Minimum during the level: 35.365.
- Longest interval without positive feedback: 4.32 seconds.

This replaces V1's first-level jump from 45 to about 98.

## Matched 40-Seed Batch

| Profile | Policy | Completion | Abandonment | Final Feedback | Minimum | Low-Feedback Seconds |
|---|---:|---:|---:|---:|---:|---:|
| tolerant | explorer | 95.0% | 5.0% | 98.746 | 42.000 | 0.000 |
| baseline | explorer | 87.5% | 12.5% | 69.458 | 15.030 | 15.497 |
| strict | explorer | 82.5% | 17.5% | 34.023 | 0.000 | 144.702 |
| tolerant | mainline | 30.0% | 70.0% | 30.662 | 15.489 | 48.063 |
| baseline | mainline | 30.0% | 70.0% | 14.275 | 0.000 | 190.035 |
| strict | mainline | 30.0% | 70.0% | 13.652 | 0.000 | 245.734 |

The same seeds are reused across strictness profiles so decay comparisons are not polluted by different abandonment rolls.

## Current Interpretation

- Explorer-route feedback now has useful movement instead of permanent saturation.
- Strictness changes low-feedback exposure strongly, as intended.
- Mainline-only abandonment remains dominated by repeated Boss failure. Strictness changes emotional stock but does not yet change the matched-seed abandonment outcome enough; an independent reviewer must judge whether this is humanly plausible or whether feedback protection is too weak.
- The automated cognition core still uses the compact first-level proxy encounter, not the new formal wave encounter. This round tests the feedback mechanism and whole-map path, not final first-level presentation parity.

## Gate

Do not accept V2 from aggregate numbers alone. Run two step-by-step knowledge-bounded player agents, then pass only their raw cognition/emotion records to an independent human-plausibility reviewer.
