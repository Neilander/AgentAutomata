# Life Recognition Simulator

This prototype tests a minimal satisfaction / achievement model.

## Core Idea

Satisfaction and achievement are not separate currencies. They are different interpretations of the same recognition event value.

```text
recognitionDelta = eventRecognition - selfRecognitionBaseline
```

- Far below baseline: comfort or weak pleasure.
- Slightly below baseline: satisfaction and self-confirmation.
- Near baseline: healthy challenge.
- Above baseline: achievement.
- Far above baseline: high-risk achievement or high-risk failure.

## State

```js
player = {
  selfWorth: 35,
  pleasure: 64
}
```

- `selfWorth` is the slow recognition baseline.
- `pleasure` is the fast hedonic bar. It decays each turn.

## Card Value

Cards have success probability. Recognition is calculated from inverse probability:

```js
eventRecognition = (1 / successRate) ^ x
```

So when success rate is `1%`, base recognition is `100 ^ x`.

This is intentionally simple. It follows the design claim that rarer success carries more recognition, but the exponent `x` lets us tune how extreme that curve feels.

## Interpretation

On success:

```js
satisfaction = recognition * pleasureNeed * lowSelfWorthFactor
achievement = recognition * agency * baselineDeltaFactor
selfWorth += achievementWeight + smallSatisfactionWeight
pleasure += satisfactionWeight + achievementWeight
```

On failure:

```js
failureDamage = recognition * exposure * agencyPain
selfWorth -= failureDamage
pleasure -= failureDamage
```

High-agency failure hurts more because the player is more likely to attribute the failure to self. Low-agency success also converts less cleanly into achievement because it feels like luck.

## References

- Expectancy-value theory: achievement behavior depends on expectation of success and subjective task value.
- Self-worth theory: achievement and failure can protect or threaten self-worth.
- Self-determination theory: agency/autonomy and competence affect motivation quality.
- Flow theory: challenge must match perceived ability to feel engaging rather than boring or overwhelming.

