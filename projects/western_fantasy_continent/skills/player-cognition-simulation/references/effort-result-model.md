# Effort, Process, Result, And Expectation

## Contents

1. Variables
2. Modeling E and W
3. Subjective process amount
4. Effort quality
5. Process feedback
6. Result value and learned expectation
7. Asymmetric mismatch
8. Temporal credit assignment
9. Worked patterns
10. Calibration cautions
11. Western Fantasy V0 working scale

## 1. Variables

Use the E/W/P/Q/R/k/A model for a bounded episode:

```text
E = meaningful high-load effort amount
W = low-load or non-demanding amount
P = subjectively perceived process amount
Q = effort quality, allowed to be negative
R = subjective result value
k = learned expected result per unit of process for this context
A = asymmetric expectation-mismatch function
```

These variables answer different questions:

- `E/W`: what rhythm did the player live through?
- `P`: how much process did the player feel they paid?
- `Q`: how good or painful was that process per unit?
- `R`: how valuable was the outcome right now?
- `kP`: what outcome did the player learn to expect for that process?

## 2. Modeling E And W

Do not define E as all active time and W as all bad time.

For each short segment, estimate an effort intensity `e_i` from 0 to 1 using visible demands:

```text
e_i = attention * meaningful_information * decision_or_stakes * legibility
```

Then estimate:

```text
E_i = subjective_duration_i * e_i
W_i = subjective_duration_i * (1 - e_i)
```

`W` can be useful recovery, anticipation, observation, or pacing. It becomes harmful only when its ratio, placement, or meaning violates the expected rhythm. Continuous E can also be harmful through overload.

Treat `EWWW EWWW` as one plausible low-complexity rhythm, not a universal target. Different activities learn different target patterns.

## 3. Subjective Process Amount

Time is the first measurable input, but perceived time changes with cognitive load. During E, time can feel slower because more mental operations are encoded.

Start with:

```text
P_i = real_seconds_i * time_expansion(e_i) + explicit_cognitive_operations_i
time_expansion(e_i) = 1 + lambda_effort * e_i
```

Use `explicit_cognitive_operations` for meaningful comparisons, decisions, target switches, equipment checks, or remembered plans that are not captured by duration alone.

Do not count invisible simulation work. Count only what the player could perceive or think about.

## 4. Effort Quality

Effort quality depends on ratio and distribution, not total amount:

```text
Q = ratio_fit(E / (E + W), learned_target_ratio)
  + distribution_fit(actual_pattern, learned_target_pattern)
  + clarity_fit
  - overload
  - dead_repetition
```

Normalize the provisional result to a range such as `[-1, 1]`, but do not clamp it at zero.

- `Q > 0`: the process itself contributes positive experience.
- `Q = 0`: the process is emotionally inert.
- `Q < 0`: each additional unit makes the experience worse.

The range and weights are calibration parameters. A value like `-0.3` is valid when an activity is persistently unpleasant but not maximally aversive.

Keep Q independent of P. One second may have excellent rhythm and clarity. Twenty days may contain mostly badly distributed W and yield negative Q.

## 5. Process Feedback

For one bounded segment or episode:

```text
process_feedback = P * Q
```

For long play, segment first:

```text
total_process_feedback = sum(P_i * Q_i * freshness_i)
```

Use local loops such as contact-to-kill, wave-to-wave, decision-to-verification, or failure-to-retry. Do not average a whole season into one Q.

Apply habituation after computing local process feedback. Repetition must not gain unlimited value through duration.

## 6. Result Value And Learned Expectation

Result value is subjective:

```text
R = objective_result
  * current_desire
  * comprehension
  * freshness
  * relevance_to_active_goal
```

A kill can have a small R even without loot because it advances the encounter. An unwanted item can have low R despite high objective rarity.

Expected result is learned:

```text
expected_result = k(context) * P
```

Initialize `k(context)` from genre priors and explicit promises. Update it from first impressions and subsequent evidence.

If the first ordinary enemy dies in one hit, the player learns a very high result-per-process rate for ordinary enemies. A later ordinary enemy taking several seconds for the same result therefore creates negative mismatch unless the game signals a changed context or gives a larger result.

## 7. Asymmetric Mismatch

Define:

```text
delta = R - k(context) * P
```

Use separate positive and negative curves:

```text
A(delta) = a_positive * max(delta, 0)^gamma_positive
         - a_negative * max(-delta, 0)^gamma_negative
```

Then:

```text
total_experience = P * Q + R + A(delta)
```

Direct result feedback and mismatch are intentionally separate. A reward may be intrinsically pleasant while still feeling insufficient for the learned cost.

Do not assume `a_positive == a_negative` or equal powers. Calibrate surprise and disappointment independently.

## 8. Temporal Credit Assignment

Do not resolve `R - kP` independently for every visual segment. Process can accumulate before a delayed result.

Maintain an expectation ledger for each player-understood loop:

```text
pending_expected_result += k(context) * P_i
pending_process_feedback += P_i * Q_i
```

Resolve mismatch when one of these occurs:

- The promised or learned result arrives.
- The loop visibly ends.
- The learned result deadline passes.
- The player abandons or switches away from the loop.

At resolution:

```text
delta = attributed_R - pending_expected_result
loop_experience = pending_process_feedback + attributed_R + A(delta)
```

Attribute delayed rewards only to process the player can causally connect to them. A level-end item may repay the preceding fight. An unrelated town gift must not retroactively justify a bad fight unless the game presents that connection.

Before the deadline, an unrepaid expectation may create anticipation or uncertainty, but it is not yet disappointment. If delivery is later than the learned timing, apply a delay penalty or reduce Q for the waiting segments before resolving the final mismatch.

Use immediate resolution only for events whose learned contract is immediate, such as hit confirmation, a visible kill, or a button response.

## 9. Worked Patterns

### One-click action, no result

`P` and `R` are near zero. The experience is almost inert beyond basic control confirmation.

### Five-second enemy, no loot

The kill and visible progress give small R. If E/W rhythm is legible and `kP` remains small, the exchange can provide modest positive experience.

### Sixty-second enemy, no meaningful result

P is high. If the pattern contains dead repetition, Q becomes zero or negative. `R << kP`, so disappointment compounds the poor process.

### Sixty-second enemy, desired equipment

If the equipment value roughly matches `kP`, the result closes the transaction. If it exceeds expectation, add surprise through the positive A curve.

### One-hit ordinary enemies at the start

The player receives shallow kill feedback but learns that ordinary enemies should be nearly free. This can damage later pacing. One-hit enemies work better as a contrast that proves prior growth than as the initial exchange-rate lesson.

## 10. Calibration Cautions

- Do not increase enemy health blindly. A longer fight with poor E/W distribution only increases P and disappointment.
- Do not treat information density as automatically good. Continuous high E causes overload.
- Do not call all downtime W harmful. Correctly placed W lets the next E pulse remain legible.
- Do not fit constants from one route or one player profile.
- Record whether a change altered P, Q, R, k, or A. Avoid saying only that the experience became better.
- Check temporal attribution. Segment-level negative mismatch may be false if the expected result has not reached its learned deadline.

## 11. Western Fantasy V0 Working Scale

Use this only as a replaceable project ruler for the first playable calibration pass. It is not a claim about universal human constants.

### Process amount

When E and W are measured in visible real-time seconds:

```text
P = 1.4 * E + 0.6 * W + decision_units
```

Initial decision-unit anchors:

```text
minor recognition or confirmation: 0.5
meaningful comparison or choice: 1.5
complex multi-variable decision: 3.0
```

### Effort quality

Use `Q` in `[-1, 1]`:

```text
-1.00 .. -0.50: strongly aversive process
-0.50 .. -0.15: actively annoying process
-0.15 ..  0.15: inert or ambiguous process
 0.15 ..  0.45: acceptable positive process
 0.45 ..  0.70: strong process rhythm
 0.70 ..  1.00: exceptional and uncommon
```

For the first auto-battle level, target `Q = 0.30 .. 0.60` and an E share near `30% .. 40%`. Treat an `EWWW`-like rhythm as a starting hypothesis. Do not equate damage-event gaps with W; use them only as a warning proxy until presentation is observed.

### Result anchors

Apply current desire and freshness after these provisional anchors:

```text
first legible ordinary kill: 0.2 .. 0.4 R
small-wave completion: 0.7 .. 1.1 R
short level completion: 1.0 .. 1.6 R
ordinary equipment with visible improvement: 1.8 .. 2.8 R
rare equipment with visible improvement: 4.0 .. 7.0 R
new playable character: 10.0 .. 16.0 R
```

Repeated ordinary kills retain the existing event-freshness decay; do not grant the first-kill value ten times.

### Learned exchange rate

Use a broad first-level prior of `k = 0.5 .. 0.8 R/P` for the whole encounter loop, then learn by context. Use provisional update weights:

```text
first salient impression alpha: 0.50 .. 0.70
repeated ordinary evidence alpha: 0.15 .. 0.30
explicit promise or guaranteed reward alpha: 0.60 .. 0.80
```

Do not force observed k back into the prior range. The purpose of the simulation is to reveal what the design teaches.

### Mismatch amplification

Start with:

```text
positive_scale: 0.5 .. 0.8
positive_power: 0.8 .. 1.0
negative_scale: 0.9 .. 1.3
negative_power: 1.1 .. 1.3
```

This makes disappointment initially stronger and more convex than positive surprise. Replace these ranges after matched traces and human feedback.
