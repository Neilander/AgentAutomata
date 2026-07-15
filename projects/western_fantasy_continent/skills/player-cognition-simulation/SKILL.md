---
name: player-cognition-simulation
description: Simulate how a knowledge-bounded player learns concepts, chooses actions, perceives effort rhythm, updates expected reward exchange rates, experiences process and result feedback, forms failure memories, retries, or abandons. Use when designing or reviewing onboarding, battles, rewards, grind loops, difficulty pacing, lock-key progression, or any game sequence whose cognitive and emotional path must be tested without leaking designer knowledge.
---

# Player Cognition Simulation

When game events are converted into player knowledge, read [references/signal-concept-interpretation.md](references/signal-concept-interpretation.md). The signal interpreter must map raw engine entities to player-visible concepts before expectation, emotion, knowledge, attribution, or decision code can consume them.

Model the player as a learning agent, not as a designer who already knows the systems. Trace what the player can observe, what they infer, how much subjective process they experience, what result they expect, and how the resulting experience changes the next action.

Before modeling or explaining the system, read [references/model-concepts-explained.md](references/model-concepts-explained.md). It defines the full signal → perception → concept → knowledge → affordance → hypothesis → behavior → verification → emotion loop, and distinguishes gameplay validation from direct parameter unit tests.

## Required Workflow

1. Define the bounded episode being tested: one fight, one map decision, one reward loop, or one failure-and-retry loop.
2. Initialize only the cognition available before the episode. Read `references/cognition-state.md`. When validating a level or progression sequence, also read `references/player-profile-ensemble.md` and run multiple persistent player profiles instead of one default Agent.
3. Convert raw game events into player-visible concepts, then into perceptual signals, comparable performance observations, progression, growth, and agency. Read `references/signal-concept-interpretation.md` before `references/signal-growth-agency-model.md`.
4. Divide the episode into locally meaningful segments. Count the explicit problem -> cause -> behavior -> hypothesis decision chain and the later hypothesis comparison before estimating `E`, `W`, `P`, and `Q`. Read `references/effort-result-model.md`.
5. Calculate progression and growth result `R`, learned exchange rate `k`, signed expectation mismatch, and total episode experience.
   When expected and actual results are expressed as relative improvement, read [references/improvement-perception-granularity.md](references/improvement-perception-granularity.md) before settling `A`. Quantize both values through the same persistent player profile instead of comparing precise percentages directly.
6. Update concepts, knowledge, behaviors, first impressions, expectations, event freshness, failure memories, and wake-up conditions.

For loot drops, critical hits, rare encounters, procs, and other repeated probability events, read [references/probability-expectation.md](references/probability-expectation.md). The cognition layer maintains event-family probability beliefs and counters; `A` only evaluates observed result against the prior expectation.
7. Select the next action using only the updated state. Never use hidden designer intent or future rewards.
8. Produce the required trace and run an independent plausibility review. Read `references/simulation-protocol.md`. Report per-profile paths and failures before any aggregate; an average result must not hide a dominant bypass or a profile-specific dead end.

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

- `H`: perceptual signal strength; evidence, not effort or direct reward.
- `E`: meaningful, attention-demanding effort.
- `W`: low-load time; neutral until judged by ratio and distribution.
- `P`: subjectively perceived process amount, including time-perception slowdown during effort.
- `Q`: effort quality. Allow negative values when the process itself is unpleasant.
- `R`: subjective result value after desire, comprehension, saturation, and freshness.
- `k(context)`: learned expected result per unit of process for this activity context.
- `A`: asymmetric amplification of disappointment or surprise.

## Hard Rules

- Do not equate elapsed time with process amount. Effort changes perceived time and cognitive load.
- Do not classify a clear or spectacular signal as E by default. In the first runnable version, E requires a valid decision-chain step or explicit hypothesis verification.
- Keep H out of the final additive experience formula. Route it through clarity/Q, understood progression or growth/R, evidence updates, and expectation mismatch.
- Count cognitive comparisons and model updates, not physical button presses.
- Compare growth with the old baseline, deliver feedback, then update freshness and baselines.
- Freeze baselines by meaningful feedback exposures, not battles or levels.
- Do not treat `W` as a direct penalty. Recovery space can improve quality; badly proportioned or clustered `W` can reduce quality.
- Keep `Q` independent of total process amount. A one-second episode can have high quality; a twenty-day episode can have negative quality.
- Allow `Q < 0`. Repeating a painful process must accumulate negative experience rather than becoming positive through duration.
- Segment long play into resolved local loops before summing. Never multiply one global duration by one average quality score.
- Keep direct result feedback separate from expectation mismatch. A reward can feel good and still feel insufficient for its cost.
- Accrue expected result during a loop and resolve mismatch only when the learned result deadline arrives. Do not punish every non-reward segment as an immediate expectation miss.
- Learn `k` from first impressions, explicit promises, and repeated outcomes. Never use one universal constant for every activity.
- Keep feedback stock, freshness, fatigue, frustration, expectation, abandonment probability, abandonment roll, and terminal abandonment separate.
- Attribute failure only through concepts already known to the simulated player.
- Never let disposable entity IDs, internal enemy names, or engine role strings cross the signal interpreter into emotion, knowledge, attribution, or decision inputs.
- Keep raw audit events separate from player-semantic events. Post-hoc knowledge filtering is not concept interpretation.
- Treat all constants as hypotheses until calibrated against traces or human feedback.
- Do not let the player agent approve its own trace. A separate reviewer must issue `accept`, `revise`, or `reject`; otherwise mark independent review as not run.
- Do not validate a design with only one cooperative or balanced player profile. Keep the cognition engine fixed while varying structured initial beliefs, confidence, risk tolerance, experimentation tendency, and action friction.
- Treat profile beliefs such as "damage is everything" as fallible subject-environment-behavior-result priors with confidence and provenance, never as designer truth or hard-coded actions.
- Keep each player profile persistent for the whole run. Do not replace its personality after a failure to force the intended solution.

## Existing Runtime Surfaces

The current executable AI-playtest integration reference is registered in `projects/western_fantasy_continent/PLAYER_MODEL_RUNTIME.md` and `projects/western_fantasy_continent/player_model_runtime.json`. Read those files before using or extending the code-owned decision/attribution loop.

Use these project tools when executable simulation is needed:

- `projects/western_fantasy_continent/game_data/feedback-cognition-model.js`
- `projects/western_fantasy_continent/game_data/analyze-map-feedback-cognition.js`
- `projects/western_fantasy_continent/game_data/test-feedback-cognition-model.js`
- `projects/western_fantasy_continent/game_data/player-cognition-v5-sandbox.js`
- `projects/western_fantasy_continent/game_data/test-player-cognition-v5-sandbox.js`

The production-facing runtime is still `feedback-v4`. The V5 sandbox is an isolated, independently reviewed calibration surface for H, E/W/P/Q/R/k/A, freshness, growth, hypotheses, and deterministic next-action checks. Do not claim that the live map or V4 implements V5 until explicitly integrated.

## Skill Composition

Use this skill as the general player model. Apply `game-analysis-iteration/references/lock-key-cognition.md` afterward when the design question specifically concerns locks, keys, treasures, bypasses, or map ordering.
