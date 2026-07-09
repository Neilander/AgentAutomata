---
name: game-analysis-iteration
description: Execute a state-machine workflow for game analysis and iteration in Western Fantasy Continent. Use when feedback claims the game has a problem and the agent must verify whether it is real and worth changing, or when the game/prototype is playable but the next design change is unclear. Covers experience research, design distillation, feedback-as-API checkpoints, comparison against the current game, evaluator training, and implementation-plan preparation.
---

# Game Analysis And Iteration

Use this project skill as a state machine. Do not jump straight to suggestions. Move through states, record each state's goal, choose one or more methods, and treat asking the user as an explicit API call named `call_feedback`.

## Operating Model

For each state, produce:

```text
state:
goal:
methods_used:
output:
next_state:
feedback_request: only when calling call_feedback
```

If a feedback gate fails, return to the earlier state named by the feedback. If the user gives a direct correction, update the relevant reference file or working notes before continuing.

## Scenarios

Scenario A: feedback says the game has a problem.

- Goal: determine whether the problem is real, whether it matters, and whether it should be changed.

Scenario B: the game exists but the next change is unclear.

- Goal: discover the highest-value next iteration.

## State Machine

1. `experience`: Study comparable games or adjacent designs.
2. `distill`: Convert experience research into traits a good game of this type should have.
3. `review_distillation`: Check whether the distilled traits are reasonable.
4. `compare_current_game`: Turn macro traits into concrete checks against the current game.
5. `review_checks`: Check whether the concrete indicators and judgment method are reasonable.
6. `train_reviewer`: If needed, train or fit evaluators/prompts against feedback on fixed datasets.
7. `implementation_plan`: Turn accepted checks into a concrete modification plan. This state is intentionally unfinished and should be expanded later.

## References

Read only the files needed for the current state:

- `references/state-machine.md`: state transitions, required outputs, and feedback gates.
- `references/feedback-api.md`: the `call_feedback` contract.
- `references/experience.md`: Steam review analysis and guide/design reading.
- `references/distillation.md`: loop analysis, system-role analysis, and progression-layer analysis.
- `references/compare-current-game.md`: turning macro traits into detailed indicators against the current game.
- `references/lock-key-cognition.md`: lock-key progression review using player cognition, failure attribution, wake-up conditions, and knowledge updates.
- `references/reviewer-training.md`: fitting evaluator prompts/subagents to user feedback.
- `references/implementation-plan.md`: placeholder for state 7.

## Hard Rules

- Do not treat `call_feedback` as conversation filler. Treat it as a blocking API call with explicit inputs and expected response shape.
- Do not turn every criticism into a change request. First verify whether the problem exists and whether changing it serves the target loop.
- Do not keep analyzing after a feedback gate fails. Return to the relevant earlier state.
- Do not invent state 7 details beyond the current placeholder unless the user asks to enrich it.
