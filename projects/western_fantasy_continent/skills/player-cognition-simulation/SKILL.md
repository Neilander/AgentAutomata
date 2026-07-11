---
name: player-cognition-simulation
description: Simulate how a knowledge-bounded player learns concepts, chooses actions, perceives effort rhythm, updates expected reward exchange rates, experiences process and result feedback, forms failure memories, retries, or abandons. Use when designing or reviewing onboarding, battles, rewards, grind loops, difficulty pacing, lock-key progression, or any game sequence whose cognitive and emotional path must be tested without leaking designer knowledge.
---

# Player Cognition Simulation

Model the player as a learning agent, not as a designer who already knows the systems. Trace what the player can observe, what they infer, how much subjective process they experience, what result they expect, and how the resulting experience changes the next action.

## Required Workflow

1. Define the bounded episode being tested: one fight, one map decision, one reward loop, or one failure-and-retry loop.
2. Initialize only the cognition available before the episode. Read `references/cognition-state.md`.
3. Divide the episode into locally meaningful segments. Record simulated real time and visible state changes.
4. For each segment, estimate effective effort `E`, low-load time `W`, subjective process amount `P`, and effort quality `Q`. Read `references/effort-result-model.md`.
5. Calculate process feedback, subjective result `R`, learned exchange rate `k`, signed expectation mismatch, and total episode experience.
6. Update concepts, knowledge, behaviors, first impressions, expectations, event freshness, failure memories, and wake-up conditions.
7. Select the next action using only the updated state. Never use hidden designer intent or future rewards.
8. Produce the required trace and run an independent plausibility review. Read `references/simulation-protocol.md`.

## Core Model

For a bounded episode:

```text
process_feedback = P * Q
expected_result = k(context) * P
mismatch = R - expected_result
total_experience = process_feedback + R + A(mismatch)
```

Use an asymmetric mismatch function:

```text
A(delta) = positive_scale * max(delta, 0)^positive_power
         - negative_scale * max(-delta, 0)^negative_power
```

Treat these as separate quantities:

- `E`: meaningful, attention-demanding effort.
- `W`: low-load time; neutral until judged by ratio and distribution.
- `P`: subjectively perceived process amount, including time-perception slowdown during effort.
- `Q`: effort quality. Allow negative values when the process itself is unpleasant.
- `R`: subjective result value after desire, comprehension, saturation, and freshness.
- `k(context)`: learned expected result per unit of process for this activity context.
- `A`: asymmetric amplification of disappointment or surprise.

## Hard Rules

- Do not equate elapsed time with process amount. Effort changes perceived time and cognitive load.
- Do not treat `W` as a direct penalty. Recovery space can improve quality; badly proportioned or clustered `W` can reduce quality.
- Keep `Q` independent of total process amount. A one-second episode can have high quality; a twenty-day episode can have negative quality.
- Allow `Q < 0`. Repeating a painful process must accumulate negative experience rather than becoming positive through duration.
- Segment long play into resolved local loops before summing. Never multiply one global duration by one average quality score.
- Keep direct result feedback separate from expectation mismatch. A reward can feel good and still feel insufficient for its cost.
- Accrue expected result during a loop and resolve mismatch only when the learned result deadline arrives. Do not punish every non-reward segment as an immediate expectation miss.
- Learn `k` from first impressions, explicit promises, and repeated outcomes. Never use one universal constant for every activity.
- Keep feedback stock, freshness, fatigue, frustration, expectation, abandonment probability, abandonment roll, and terminal abandonment separate.
- Attribute failure only through concepts already known to the simulated player.
- Treat all constants as hypotheses until calibrated against traces or human feedback.
- Do not let the player agent approve its own trace. A separate reviewer must issue `accept`, `revise`, or `reject`; otherwise mark independent review as not run.

## Existing Runtime Surfaces

Use these project tools when executable simulation is needed:

- `projects/western_fantasy_continent/game_data/feedback-cognition-model.js`
- `projects/western_fantasy_continent/game_data/analyze-map-feedback-cognition.js`
- `projects/western_fantasy_continent/game_data/test-feedback-cognition-model.js`

The current runtime is `feedback-v4`. The E/W/P/Q/R/k/A model in this skill is the next conceptual layer and must not be claimed as implemented in V4 until the runtime is explicitly upgraded and tested.

## Skill Composition

Use this skill as the general player model. Apply `game-analysis-iteration/references/lock-key-cognition.md` afterward when the design question specifically concerns locks, keys, treasures, bypasses, or map ordering.
