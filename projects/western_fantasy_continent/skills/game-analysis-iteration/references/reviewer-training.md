# Reviewer Training State

Goal: train or fit an evaluator/checker so it matches user feedback better.

Use this only after `review_checks` says some part needs a trained checker.

## Fixed-Dataset Prompt Comparison

Process:

1. Choose a fixed dataset.
2. Write multiple evaluator prompts.
3. Ask subagents or repeated passes to judge the same dataset using each prompt.
4. Compare results against user feedback.
5. Identify which prompt or criteria best fit the user's judgment.

Important rules:

- Do not change the dataset while comparing prompts.
- Do not treat low overlap as a small tuning issue. If every prompt misses user choices, the judging frame is wrong.

## Feedback Gate

End with `call_feedback`:

```text
call_feedback
state: train_reviewer
summary: best prompt, failures, and unresolved mismatch
decision_needed: Is the reviewer trained enough, should training repeat, or should training be abandoned?
options:
- complete training and return to review_checks
- repeat training with revised prompts
- abandon training and continue manually
recommended_next: ...
```
