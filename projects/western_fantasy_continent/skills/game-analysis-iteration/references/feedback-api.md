# Feedback API

Treat asking the user as an API call named `call_feedback`.

## Contract

Use `call_feedback` when the workflow requires user judgment, approval, or preference fitting.

Input must include:

- `state`: current state name.
- `summary`: shortest useful summary of current output.
- `decision_needed`: what the user must judge.
- `options`: likely next transitions.
- `recommended_next`: the agent's recommendation, if any.

Expected response types:

- `pass`: continue to the next state.
- `fail`: return to a specified earlier state.
- `revise`: update part of the current output and re-run the state.
- `train_checker`: enter `train_reviewer`.
- `skip_training`: go to `implementation_plan`.
- `abandon_training`: leave `train_reviewer` and continue without a trained checker.

## Prompt Shape

When calling feedback, ask directly:

```text
call_feedback
state: ...
summary: ...
decision_needed: ...
options:
- ...
recommended_next: ...
```

Do not hide multiple decisions in one question. If several decisions are needed, ask the blocking one first.
