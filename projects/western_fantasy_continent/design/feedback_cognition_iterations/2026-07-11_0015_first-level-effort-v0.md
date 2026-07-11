# First-Level Effort V0

- Date: 2026-07-11
- Scope: `r1_main_1` only
- Status: playable candidate accepted for human review, not final calibration

## Goal

Replace the starter lesson "ordinary enemies are almost free" with a short but legible combat exchange. Preserve guaranteed success and the existing ordinary equipment result. Do not lengthen combat merely by adding health.

## V0 Ruler

```text
P = 1.4E + 0.6W + decision_units
Q range = -1 .. 1
first-level Q target = 0.30 .. 0.60
first-level E share hypothesis = 30% .. 40%
first-level k prior = 0.5 .. 0.8 R/P, then learned from play
A positive scale = 0.5 .. 0.8
A negative scale = 0.9 .. 1.3
```

The complete provisional anchors are recorded in `skills/player-cognition-simulation/references/effort-result-model.md`.

## Baseline A

- Melee HP: 30.
- Ranged HP: 22.
- Second small wave enters at one remaining enemy.
- 40 deterministic runs.
- Win rate: 100%.
- Average simulation duration: 8.936 seconds.
- Duration range: 8.8-9.6 seconds.
- Enemies receiving at most one damage event: 46.0%.
- Average damage events per enemy: 1.54.
- Average longest gap between damage events: 1.464 seconds.
- Average enemy damage: 56.673.
- Average surviving allies: 4.

## Candidate B

- Melee HP: 41.
- Ranged HP: 30.
- Second small wave enters at two remaining enemies.
- 200 deterministic runs.
- Win rate: 100%.
- Average simulation duration: 10.821 seconds.
- Duration range: 10.08-12.16 seconds.
- Enemies receiving at most one damage event: 5.7%.
- Average damage events per enemy: 2.053.
- Average longest gap between damage events: 2.156 seconds.
- Average enemy damage: 54.064.
- Average surviving allies: 4.

## Player-Agent Trace

A fresh GPT-5.5 knowledge-bounded player agent preferred B as a more extensible first contract:

- A teaches that ordinary enemies should be nearly free and raises learned k too high.
- B teaches that ordinary combat requires several visible exchanges while remaining safe and short.
- B's extra 1-3 seconds can be repaid by better process quality, but only if the longer no-damage gap remains visually meaningful.
- Predicted next action remains equipping the visible upgrade and continuing to the next node.

## Independent Review

A separate fresh GPT-5.5 reviewer returned `accept` for B as one playable candidate, not a final calibration.

Smallest uncertain assumption:

```text
The 2.156-second damage-event gap is meaningful movement, entry, or anticipation rather than perceived dead time.
```

## Human Review Gate

Observe only these questions on the next playtest:

1. Can the player see that most enemies require more than one exchange, without interpreting them as damage sponges?
2. During the longest no-damage interval, does attention remain on movement, entry, or attack preparation?
3. Does the early ordinary-enemy expectation become "quick but not free"?
4. Does one ordinary equipment item feel adequate for this short encounter?
5. Does the second small wave entering at two remaining enemies feel continuous rather than cluttered?

Do not tune k, Q, or A again before this human gate. The next evidence should be subjective play, not additional headless precision.
