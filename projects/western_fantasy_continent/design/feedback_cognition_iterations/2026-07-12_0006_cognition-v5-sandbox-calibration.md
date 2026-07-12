# Player Cognition V5 Sandbox Calibration

- Date: 2026-07-12
- Status: accepted sandbox baseline
- Scope: isolated psychological values and deterministic minimum behavior loop
- Production integration: not implemented

## Scenarios

The same parameter set was tested against:

1. First ten-hit ordinary enemy with no prior decision.
2. Failure, equipment hypothesis, and confirmed damage improvement.
3. Failure, positioning hypothesis, and refuted survival improvement.
4. Random five-target kill without a decision.
5. Planned five-target kill that confirms a build hypothesis.
6. Repeated magnitude adaptation: 999, 1999, and a later 29970 breakthrough.
7. Balanced, impatient, and analytical player profiles.

## Iteration 1

Initial values over-rewarded successful reasoning:

| Scenario | Total experience |
| --- | ---: |
| Planned multikill | 18.694 |
| Upgrade confirmed | 16.652 |
| Random multikill | 5.750 |
| Ten-hit opening | 2.744 |
| Position refuted | 0.506 |

Independent reviewers found duplicated amplification through P*Q, progression R, verification R, and A. Failure was also too mild because reasoning itself generated excessive process reward. The first 1999 feedback fell below the previous repeated 999.

## Iteration 2

Changes:

- Reduced cognitive process and Q weights.
- Reduced progression, growth, verification, and positive mismatch scales.
- Raised k relative to the new P scale.
- Split family freshness from magnitude surprise.
- Required an actual comparison before verification reward.
- Applied freshness to progression.

Results:

| Scenario | Total experience | Feedback stock after |
| --- | ---: | ---: |
| Planned multikill | 4.476 | 42.176 |
| Upgrade confirmed | 3.466 | 39.966 |
| Random multikill | 1.810 | 39.510 |
| Ten-hit opening | -0.948 | 35.552 |
| Position refuted | -4.704 | 31.796 |

One reviewer accepted. Two requested hardening around invalid operators, probability bounds, W/E separation, general magnitude-breakthrough tests, and actual next-action output.

## Iteration 3

Hardening:

- Renamed duration input to explicit `wSeconds`.
- Bounded probability/freshness/confidence inputs to `[0,1]`.
- Invalid verification operators now return `inconclusive`.
- Added general breakthrough tests for `[100,200]` and `[1000,900,2000]`.
- Added historical-peak breakthrough feedback.
- Added minimum cause/action scoring and next action:
  - confirmed -> continue
  - refuted -> switch to highest visible untried action
  - no alternative and low stock -> abandon
- Added profile ordering and extreme-input tests.

Final balanced outputs remained unchanged from Iteration 2. Position refutation now selects `equip_upgrade` with visible score `0.192`.

Magnitude sequence:

| Value | Feedback |
| ---: | ---: |
| 999 first | 4.051 |
| 999 second | 2.026 |
| 999 third | 1.528 |
| 1999 first | 1.916 |
| 1999 second | 1.234 |
| 29970 breakthrough | 3.908 |

Both final independent reviewers returned `ACCEPT` with no blockers.

## Accepted Base Values

```text
initialFeedbackStock = 38
stockDecayPerSecond = 0.15
cognitiveProcessWeight = 0.35
wProcessWeight = 0.40
k = 0.35
progressionScale = 0.45
growthScale = 2.50
verificationBase = 1.20
positiveMismatchScale = 0.40
negativeMismatchScale = 1.05
freshnessLambda = 0.24
baselineAlpha = 0.25
familyFreshnessWeight = 0.30
magnitudeSurpriseWeight = 0.70
breakthroughWeight = 0.40
```

## Interpretation

This is a comparison baseline, not a claim about human constants. It is useful because all tested scenarios share one parameter set and preserve the required qualitative ordering without scenario-specific tuning.

The ten-hit opening is intentionally slightly negative: it establishes a performance gap and continues rather than rewarding passive routine combat. A confirmed improvement becomes positive. A refuted hypothesis is meaningfully negative but routes the player toward another known action.

## Deferred

- Dynamic context-specific k learning.
- Failure attribution generated from real combat signals.
- Hypothesis history and causal-confidence updates over multiple episodes.
- Long-term fatigue and probabilistic abandonment.
- Human calibration.
- Live map integration.

