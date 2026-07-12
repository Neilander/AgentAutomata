# Signal, Growth, Agency, And Effort Attribution

## Contents

1. Layer order
2. Damage observation
3. Signal H
4. Event families and adaptation
5. Growth feedback
6. Decision and verification effort
7. Progression
8. Goal, ROI, and agency
9. Integration with E/W/P/Q/R/k/A
10. Update order
11. Required diagnostics
12. Accepted sandbox baseline

## 1. Layer Order

Do not add every variable directly into total experience. Use this order:

```text
raw visible events
-> perceptual signal H
-> evidence and baseline comparison
-> progression, growth, goal, ROI, agency
-> E/W/P/Q/R/k/A
-> feedback stock and next action
-> update freshness, baselines, and knowledge
```

The final experience equation remains:

```text
total_experience = P * Q + R + A(R - kP)
```

The signal layer determines what enters E, Q, R, knowledge, and expectation. It is not an extra additive reward term.

## 2. Damage Observation

Group simultaneous damage fragments before measuring them. A provisional hit packet is:

```text
same source
+ same target
+ same action or cast
+ timestamps within 100 ms
= one hit packet
```

Do not let DOT ticks, multi-projectile fragments, or duplicated floaters masquerade as separate meaningful hits.

For one bounded comparison window, record:

```text
D50 = median clear hit-packet damage
D90 = 90th-percentile clear hit-packet damage
F = clear hit-packet count / active contact seconds
I = median(target_hp_fraction_lost * perceived_enemy_strength)
```

Keep D50 and D90 separate:

- D50 models typical output.
- D90 models memorable peak output.
- F models effective hit frequency.
- I models subjective impact against the perceived target.

Use comparable contexts or normalize by perceived enemy strength. Do not compare raw damage against unrelated enemy tiers as if it were pure growth.

## 3. Signal H

H answers: "How strongly and clearly did the player receive this event?"

For event i:

```text
H_i = salience_i
    * perceptual_clarity_i
    * causal_clarity_i
    * goal_relevance_i
```

Initial implementations may hold visual salience and perceptual clarity at fixed "competent presentation" values. Preserve the fields so later VFX and UI tests can replace the assumption.

Keep these meanings separate:

- perceptual clarity: the player can see and parse the number, HP change, animation, and target.
- causal clarity: the player can attribute the change to a character, skill, item, field effect, or decision.
- goal relevance: the event matters to the player's current objective.

H is an intermediate signal, not E and not direct reward.

Route H as follows:

```text
H -> Q, through clarity, rhythm, overload, and intelligibility
H -> R, only through recognized progression or growth
H -> knowledge, as evidence weighted by causal clarity
H -> A, when magnitude or outcome violates expectation
H -> E_verify, only when the player actively compares H with a prior decision or hypothesis
```

A clear routine hit can therefore occur during W. A visually intense event does not become effort merely because it captures attention.

## 4. Event Families And Adaptation

Store event memory as hierarchical prototypes rather than one universal freshness counter.

Provisional event features:

```text
result: damage | healing | shield | control | loot
temporal_shape: single | multihit | dot | sustained
scope: single_target | aoe | multikill
source: basic | skill | item | field
target_context: ordinary | elite | boss
goal_context: clear | burst | survive | build_verification
```

Use rule-based tags first. Do not introduce opaque clustering until traces show the tags are insufficient.

An event may match several levels:

```text
damage
damage/single
damage/single/multikill
damage/single/multikill/skill
```

Compute effective exposure from similarity-weighted counts. A new fire skill may retain novelty at the source level while inheriting some habituation from the broader single-hit damage family.

Separate two mechanisms:

```text
family_freshness = decay(similarity_weighted_exposure_count)
magnitude_surprise = ln(current_magnitude / expected_magnitude)
```

Do not model habituation by repeatedly increasing the logarithm base. Use an adaptive reference magnitude in log space.

Example:

```text
33 -> 999: ln(999 / 33) = ln(30)
999 -> 1999: ln(1999 / 999) ~= ln(2)
```

The second event is stronger and should feel better, but it does not fully reset the novelty of "one large damage number."

For each prototype, store:

```yaml
expected_log_magnitude:
magnitude_variance:
exposure_count:
last_exposure_at:
confidence:
```

Update only after current feedback has been calculated.

## 5. Growth Feedback

Compare current output with the old baseline:

```text
g_typical = ln(D50_current / D50_reference)
g_frequency = ln(F_current / F_reference)
g_peak = ln(D90_current / D90_reference)
```

Typical combat efficiency is:

```text
g_efficiency = g_typical + g_frequency
             = ln(
                 D50_current * F_current
                 / (D50_reference * F_reference)
               )
```

This captures both desired cases:

- five hits to one hit: typical damage rises by about 5x.
- still five hits but half the time: frequency rises by about 2x.

Keep the components visible even when their sum is used. A slower heavy hitter and a rapid attacker may have equal efficiency but different fantasies.

Provisional combined growth:

```text
G = baseline_confidence
  * family_freshness
  * saturate(
      w_efficiency * g_efficiency
      + w_peak * g_peak
      + w_impact * ln(I_current / I_reference)
    )
```

Use a bounded monotonic saturating function such as tanh while constants remain uncalibrated. Report component ranges instead of fabricating precision.

On the first comparable exposure, G is undefined or zero. The event establishes a baseline after delivering its normal H and progression feedback.

## 6. Decision And Verification Effort

E answers: "How much meaningful cognitive effort did the player invest toward a goal?"

Do not classify H directly as E. For the first runnable version, model E as discrete reasoning steps rather than multiplying many uncertain psychological coefficients.

```text
problem observed
-> plausible cause selected from known causes
-> available behavior selected
-> observable hypothesis written
```

### Decision effort

Count one decision-effort unit for each meaningful, knowledge-bounded reasoning transition:

```text
E_decision = valid_reasoning_step_count
```

Provisional valid steps are:

```text
1. state the visible problem
2. select a plausible cause using current knowledge
3. select an available behavior believed to affect that cause
4. predict one observable target change
```

Do not award a step for designer-only reasoning, repeated restatement, or an action with no stated link to the cause.

Store the result in a hypothesis record:

```yaml
hypothesis_id:
trigger:
problem:
selected_cause:
chosen_behavior:
observable_target:
baseline_value:
target_condition:
evidence_deadline:
verification_state: pending
feedback_exposures: 0
```

### Verification effort

At the evidence deadline, compare the observable result with the target condition:

```text
E_verify = 1 if the comparison is actually made, otherwise 0
target_met = observed_value satisfies target_condition
```

If the target is met:

```text
verification_feedback = base_verification_value * hypothesis_freshness
verification_state = confirmed
```

If the target is not met:

```text
verification_feedback = 0
verification_state = refuted
```

Put positive verification feedback into R. A refuted hypothesis still updates knowledge and may create expectation mismatch, but does not receive success feedback merely for being tested.

Keep inconclusive when the context changed, the relevant H was unreadable, or the deadline did not produce enough evidence. Do not force confirm/refute.

For the first version:

```text
E = E_decision + E_verify
```

Routine combat between them remains W-dominant. Unexpected results may start a new reasoning chain, but do not require a separate `E_interpret` formula yet.

Examples:

- routine auto-attack: H may be clear; no reasoning step, so E = 0.
- random five-target kill: high H, R, and positive A; it may trigger a new decision chain afterward.
- chosen chain build kills five targets: earlier reasoning steps create E_decision; checking the predicted multikill creates E_verify; target success adds verification feedback to R.

The result validates effort; the result is not itself effort.

## 7. Progression

Represent objectives hierarchically:

```text
target HP progress
-> enemies defeated
-> wave completion
-> level completion
-> map progression
```

For objective j:

```text
Prog_j =
completion_delta_j
* objective_importance_j
* comprehension_j
* causal_clarity_j
* freshness_j
```

Avoid counting every layer as a full reward. A hit advances target HP; a kill advances kill count; a clear advances the level. Record each delta at its own scale.

Kill result belongs to progression. If the active objective is ten enemies, the first kill changes visible completion from 0/10 to 1/10.

## 8. Goal, ROI, And Agency

Keep goal pressure separate from solvability:

```text
Goal =
desire
* perceived_gap
* problem_clarity
```

For visible action a:

```text
ROI(a) =
causal_confidence(a)
* expected_improvement(a)
/ perceived_cost(a)
```

Perceived cost may combine time, resources, interaction friction, and opportunity cost. Uncertainty and player control belong inside causal confidence and expected improvement.

Then:

```text
Agency =
Goal
* path_visibility
* max_a(ROI(a))
```

Interpretation:

- clear problem, no visible path: frustration, not agency.
- visible path, no meaningful gap: low motivation.
- clear gap plus an affordable, trusted path: high agency and likely action.
- five days for 10% improvement: low ROI even when the path is certain.

Agency primarily controls action selection, goal relevance, desire, and future expectation. Do not grant large immediate pleasure merely because Agency is high. A small "I know what to do" result is allowed when confusion is resolved.

## 9. Integration With E/W/P/Q/R/k/A

Compute subjective process:

```text
P_i = real_seconds_i * time_expansion(e_i)
time_expansion(e_i) = 1 + lambda_effort * e_i
```

Do not count button presses. If discrete cognitive operations are not represented by duration, add their complexity, not their physical click count. Prefer increasing e_i during the actual compare/decide/verify interval to adding arbitrary operation units.

Compute process quality:

```text
Q =
ratio_fit(E / (E + W), learned_target_ratio)
+ distribution_fit(actual_pattern, learned_target_pattern)
+ signal_clarity
+ causal_intelligibility
+ goal_progress_readability
- overload
- incomprehensible_combat
- dead_repetition
```

Compute subjective result:

```text
R =
w_progress * sum(Prog_j)
+ w_growth * G
+ other_understood_results
```

Agency changes future behavior and weighting. Include only a small direct R when the player resolves uncertainty and gains a clear plan.

Keep learned expectation:

```text
expected_result = k(context) * P
delta = R - expected_result
total_experience = P * Q + R + A(delta)
```

Update feedback stock through its existing time decay and total experience. Do not add a generic process-cost term that duplicates time decay, negative Q, and expectation mismatch.

## 10. Update Order

For each resolved signal or comparison window:

```text
1. read old event prototype and old performance baseline
2. form hit packets and compute H, D50, D90, F, I
3. count valid decision-chain steps, hypothesis comparison, and W
4. compute P and Q
5. compute progression, growth, R, expectation, A, and total experience
6. update feedback stock
7. update goal, ROI, agency, and next-action preferences
8. consume similarity-weighted freshness exposure
9. update expected log magnitude and performance baselines
10. update knowledge confidence and confirm, refute, or retain hypotheses
```

Freeze baselines by meaningful feedback exposures, not battles. Example: after an equipment change, preserve the pre-change reference through the next three causally clear high-damage verification events, then begin adapting the reference.

## 11. Required Diagnostics

Every trace using this layer must report:

```text
H and its clarity components
event-family match and freshness
D50, D90, F, I
old baseline and confidence
g_typical, g_frequency, g_peak, G
attribution candidates, available behaviors, and active hypothesis
E_decision and E_verify
E, W, P, Q
progression deltas
Goal, best visible ROI, Agency
R, kP, mismatch, A
baseline/freshness updates after feedback
next action and its knowledge basis
```

If any value is unavailable, mark it unknown. Do not silently replace missing perception evidence with designer truth.

## 12. Accepted Sandbox Baseline

Use these only as the first executable comparison ruler in `player-cognition-v5-sandbox.js`, not as universal human constants:

```text
initial feedback stock: 38
feedback stock decay: 0.15 / W second
cognitive E weight in P: 0.35
W weight in P: 0.40
initial k: 0.35
progression R scale: 0.45
growth R scale: 2.50
verification success R: 1.20
positive mismatch scale: 0.40
negative mismatch scale: 1.05
family freshness lambda: 0.24
expected-log-magnitude alpha: 0.25
family freshness contribution: 0.30
magnitude surprise contribution: 0.70
historical-peak breakthrough contribution: 0.40
```

Accepted ordering constraints:

```text
planned success > random equivalent success
confirmed upgrade > passive opening baseline
refuted hypothesis < passive opening baseline
first repeated magnitude > later identical magnitude
historical-peak breakthrough > immediately preceding weaker event
impatient profile dislikes W and failed hypotheses more
analytical profile values successful decision/verification more
```

The sandbox next-action policy is intentionally minimal:

```text
confirmed -> continue
refuted + known available alternative -> switch to highest visible score
no alternative + feedback below profile threshold -> abandon
otherwise -> continue
```

Dynamic k, real-signal attribution, long-term fatigue, probabilistic abandonment, and cross-episode hypothesis learning remain later layers.
