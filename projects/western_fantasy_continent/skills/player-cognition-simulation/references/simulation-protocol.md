# Simulation Protocol

## Contents

1. Inputs
2. Episode segmentation
3. Required trace
4. Action continuation
5. Independent review
6. Versioning and calibration

## 1. Inputs

Provide the player agent only:

- The current player cognition state.
- What the game visibly presents.
- Available actions and their visible costs.
- A way to execute or observe the chosen action.
- A player profile containing effort tolerance, decay strictness, reading tendency, and risk preference.

Do not provide intended lessons, hidden rewards, future nodes, evaluator conclusions, or the desired route.

## 2. Episode Segmentation

Create a segment when at least one of these changes:

- Attention demand.
- Meaningful information.
- Decision or risk state.
- Visible progress.
- Result delivery.
- Expected rhythm.

Use simulated real game time. AI wall-clock execution time is irrelevant.

## 3. Required Trace

Record this table for every segment:

```text
time_range
visible_state
known_concepts_before
chosen_action
E
W
P
Q
process_feedback
result_R
k_before
expected_result
mismatch
mismatch_feedback
mismatch_status: pending or resolved
total_experience
knowledge_update
emotion_before_abandonment
abandonment_probability
abandonment_roll
continued_or_abandoned
```

Also record episode diagnostics:

```text
E_W_ratio
longest_continuous_E
longest_continuous_W
distance_from_learned_pattern
lowest_Q_segment
largest_unpaid_expectation
largest_positive_surprise
```

When constants are uncalibrated, use ranges and preserve the qualitative ordering. Do not fabricate precision merely to fill every cell.

Keep mismatch pending across segments that belong to the same unresolved reward loop. Resolve it only at an immediate-result event, a learned deadline, loop completion, route exit, or abandonment.

## 4. Action Continuation

After the episode:

1. Update first impressions and `k(context)`.
2. Update event freshness and current desire.
3. Add or resolve failure memories.
4. Recompute available behavior preferences.
5. Run the abandonment check.
6. Let the player agent choose the next action from the updated state.

If the intended next action is not selected, treat that as evidence. Do not override the agent to preserve the authored sequence.

## 5. Independent Review

Send the raw trace and visible game artifact to a separate reviewer agent. Do not send the intended diagnosis.

When delegating from this repository, pass the absolute path to `player-cognition-simulation/SKILL.md` and explicitly require the agent to read it and its required references. Do not rely only on the `$player-cognition-simulation` name: project-local skills may not be auto-discovered in a fresh subagent context.

Ask the reviewer to judge:

- Whether E and W classifications match plausible human attention.
- Whether Q reflects ratio and distribution rather than total duration.
- Whether any negative Q segment is justified.
- Whether R reflects current desire and comprehension.
- Whether learned `k` updates resemble adaptation from first impressions and repetition.
- Whether disappointment and surprise use appropriate asymmetric treatment.
- Whether the next action follows from the recorded cognition.

Return `accept`, `revise`, or `reject`, with the smallest failing segment identified.

The player agent must not issue this verdict for its own trace. If a separate reviewer cannot be run, write `independent_review: not_run`.

Prefer a strong independent model such as GPT-5.5 when available, and record the actual model used.

## 6. Versioning And Calibration

Use this loop:

```text
model hypothesis
-> knowledge-bounded player trace
-> independent plausibility review
-> identify whether the model, design, or review method failed
-> append a corrected version
-> replay matched seeds and profiles
```

Do not overwrite earlier traces or rules. Keep constants provisional until multiple profiles and human notes support them.

When changing a design, report the affected variables explicitly:

```text
P changed because...
Q changed because...
R changed because...
k changed because...
A changed because...
```
