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
  pleasure: 64,
  decay: 6
}
```

- `selfWorth` is the slow recognition baseline.
- `pleasure` is the fast hedonic bar. It can jump after an event, then decays by about 6 each turn by default.

## Card Value

Cards have both an explicit base recognition value and a success probability. The old prototype used only inverse probability:

```js
eventRecognition = (1 / successRate) ^ x
```

That made ordinary life events collapse into values around 1-2, which is unusable. The current prototype uses:

```js
eventRecognition = baseRecognition * (1 / successRate) ^ (x - 1)
```

When `x = 1`, the card's authored `baseRecognition` is the value shown. The probability term is only a rarity modulation.

Current default scale:

| Event band | Example | Success rate | Base recognition |
| --- | --- | ---: | ---: |
| Basic maintenance | 吃饭洗澡 | 100% | 1 |
| Light self-management | 按时睡觉 | 93% | 4 |
| Daily order | 整理房间 | 90% | 8 |
| Daily quality | 认真做一顿饭 | 92% | 14 |
| Stable growth | 完成日常训练 | 91% | 20 |
| Social confirmation | 约朋友吃饭 | 90% | 24 |
| Weekly persistence | 连续一周训练 | 90% | 31 |
| Public expression | 公开作品 | 90% | 36 |
| Solvable challenge | 解决棘手小问题 | 55% | 42 |
| Hard task | 完成困难任务 | 44% | 54 |
| Career challenge | 申请理想职位 | 28% | 46 |

This keeps true maintenance actions low while giving ordinary life enough range to model small, medium, and meaningful recognition.

## Interpretation

On success:

```js
if (recognition > selfWorth) {
  satisfaction = recognition * pleasureNeed * lowSelfWorthFactor
  achievement = recognition * agency * baselineDeltaFactor
  selfWorth += (recognition - selfWorth) * beliefJumpRate + smallConfirmationGain
  pleasure += largeSatisfactionWeight + achievementMoodWeight + moderateChallengeBonus - decay
} else {
  selfWorth += tinyConfirmationGain
  pleasure += maintenanceRelief - decay
  pleasureDelta = min(0, pleasureDelta)
}
```

The current model intentionally makes pleasure much faster than self-recognition. A 40%-55% success event can raise pleasure by 50-90 points, while self-recognition may only move by 1-4 points.

Correction: self-recognition is slow when the event is below or near the current baseline, but it can jump sharply when the event is much stronger than the current baseline. If a player with near-zero self-recognition completes a 30-50 recognition event, the baseline should immediately move toward that evidence instead of rising by only 1-2 points. This models sudden self-reappraisal such as "I may actually be capable."

Current examples:

| Starting self-recognition | Event | Recognition | New self-recognition |
| ---: | --- | ---: | ---: |
| 0 | 公开作品 | 36 | 24 |
| 0 | 解决棘手小问题 | 42 | 29 |
| 0 | 完成困难任务 | 54 | 37 |
| 0 | 高考120分 style event | 76 | 56 |

If event recognition is below the current self-recognition baseline, the event should not produce net pleasure growth. It can only reduce the normal mood decay. Example with self-recognition 45 and pleasure 50:

| Event | Recognition | Pleasure delta |
| --- | ---: | ---: |
| 完成日常训练 | 20 | -4 |
| 约朋友吃饭 | 24 | -3 |
| 公开作品 | 36 | -2 |
| 解决棘手小问题 | 42 | -1 |
| 完成困难任务 | 54 | +22 |

Mood gain uses a soft cap:

```js
pleasureGain = moodCap * (1 - exp(-rawMood / moodCap))
```

This prevents moderate successes from jumping straight to maximum pleasure while still allowing meaningful one-event mood shifts.

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
