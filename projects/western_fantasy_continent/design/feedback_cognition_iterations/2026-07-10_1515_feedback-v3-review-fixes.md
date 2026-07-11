# Feedback Cognition V3: Human-Plausibility Fixes

- Model: `feedback-v3`
- Source: independent review of two V2 knowledge-bounded player traces
- Failure freshness recovery: unchanged at `+0.40`

## Accepted Review Findings

1. Feedback stock and emotion were too tightly coupled. A player could experience a 15-second no-gain interval while the label still said `平稳`.
2. Close victories, first team-change verification, and visible role contribution were not represented as feedback events.
3. A visible `可能出现蓝装` promise could motivate a decision but had no explicit fulfillment/miss record.
4. Camp equipment visibly taught a shield/armor counter relationship, but cognition did not record it.

## Mechanism Changes

- Added current/max low-feedback streak and recent positive-event diversity diagnostics.
- Emotion now enters fatigue on a long current no-gain interval or sustained low-feedback streak, even when stock has not reached zero.
- Added `survive:danger_window`, `verify:team_change`, and `proof:role_contribution` events.
- Added expectation creation/resolution. A missed blue-drop hint applies a proportional disappointment penalty; a fulfilled expectation records a separate payoff.
- Camp first clear now teaches the narrow knowledge: named shield-break/armor-break equipment may answer visible shield/armor obstacles.
- Preserved cumulative failure for abandonment while clearing active frustration when the failed object is beaten.

## 40-Seed Aggregate After Changes

| Profile | Policy | Completion | Abandonment | Final Feedback | Minimum | Low-Feedback Seconds | Longest Gap |
|---|---:|---:|---:|---:|---:|---:|---:|
| baseline | explorer | 87.5% | 12.5% | 87.777 | 13.977 | 16.550 | 15.163 |
| baseline | mainline | 30.0% | 70.0% | 14.860 | 0.000 | 177.274 | 21.623 |
| strict | explorer | 82.5% | 17.5% | 37.688 | 0.000 | 112.401 | 14.941 |
| strict | mainline | 30.0% | 70.0% | 14.237 | 0.000 | 244.365 | 21.623 |

## New Risk

Explorer final feedback increased from about 69 to about 88 because danger survival, character proof, and expectation payoff now count. This may be correct after a successful lock-key payoff or may over-reward the sequence. V3 requires fresh player traces and a new independent review rather than acceptance from aggregate metrics.
