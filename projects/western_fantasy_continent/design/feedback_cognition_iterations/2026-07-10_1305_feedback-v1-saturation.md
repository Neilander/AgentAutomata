# Feedback Cognition V1: Saturation Baseline

- Model: `feedback-v1`
- Route: explorer policy
- Samples: 20
- Failure freshness recovery: `+0.40`

## Parameters

- Initial feedback: 45/100.
- Decay: 3 per 5 seconds.
- Normal kill: 3.
- Skill cast: 1.1 per perceived skill family.
- Equipment: 9 common / 15 rare.
- Equipment power upgrade: 9 before magnitude/desire multipliers.
- Main clear: 12.
- Character unlock: 28.

## Result

- Region completion: 85%.
- Abandonment: 15%.
- Average final feedback: 97.612.
- Average minimum feedback: 45.
- Average low-feedback time: 0 seconds.
- Average longest no-gain interval: 16.1 seconds.
- Average contribution: world 32.535, combat 98.957, progression 114.170.

## Diagnosis

1. Feedback saturates too early. The first level commonly moves feedback from 45 to about 98; later high-value rewards often land while stock is already capped.
2. The model cannot distinguish `cumulative failures used for abandonment` from `currently unresolved frustration`; resolved Prison failures leave the emotional label permanently frustrated.
3. No run enters the low-feedback region, so the baseline cannot explain the user's report that an easy early fight feels too long.
4. The event trace is usable: combat, loot, unlock, map decision, decay, failure recovery, and abandonment are all recorded in real-time order.

## Decision

Reject V1 values. Keep the event/timeline mechanism and `+0.40` relevant-failure recovery. Split active frustration from cumulative failure, then reduce ordinary combat/progression intensities and increase decay for the next scan.
