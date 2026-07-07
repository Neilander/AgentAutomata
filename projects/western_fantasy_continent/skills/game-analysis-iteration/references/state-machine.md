# State Machine

Use this workflow as a state machine. Each state has a goal, multiple methods, and an exit condition. When a feedback gate is required, call `call_feedback` and wait for the user's response before proceeding.

## Scenario Routing

Scenario A: feedback says the game has a problem.

- Start at `experience` unless the user provides enough prior comparable-game analysis.
- The purpose is to verify whether the reported problem is real, whether it matters, and whether it should be changed.

Scenario B: the game is playable but the next change is unclear.

- Start at `experience` unless recent experience research already exists.
- The purpose is to identify the most valuable next iteration.

## States

### 1. experience

Goal: experience other comparable games or adjacent design artifacts and summarize what players like and dislike.

Primary methods:

- Steam review analysis.
- Guide/design reading.
- `call_feedback` if game selection, genre boundary, or research source is uncertain.

Exit when there is a useful summary of liked parts, disliked parts, and design mechanisms.

### 2. distill

Goal: based on experience output and the current game type, summarize what a good game of this type should contain.

Primary methods:

- Loop analysis.
- System-role analysis.
- Progression-layer analysis.
- `call_feedback` if the target game type or desired player fantasy is ambiguous.

Exit when the analysis has macro traits or loops that can be checked against the current game.

### 3. review_distillation

Goal: verify whether the distillation is actually reasonable.

Primary methods:

- `call_feedback`.
- Later: comparative analysis method.

Exit to `compare_current_game` if feedback passes. Return to `experience` or `distill` if feedback fails.

### 4. compare_current_game

Goal: compare the distilled traits against the current game and turn macro indicators into detailed indicators.

Primary methods:

- Step-by-step loop check.
- Build-system role check.
- Progression-layer check.
- Other checkers can be added later.

Exit when each macro trait has concrete observable indicators.

### 5. review_checks

Goal: verify whether the detailed indicators and judgment method are reasonable.

Primary methods:

- `call_feedback`.

Exit:

- If feedback passes and no reviewer training is needed, go to `implementation_plan`.
- If feedback passes but the user wants a trained checker, go to `train_reviewer`.
- If feedback fails, return to `compare_current_game` or `distill`.

### 6. train_reviewer

Goal: train or fit an evaluator/checker against user feedback on a fixed dataset.

Primary methods:

- Fixed-dataset prompt comparison.
- Subagent judging with different prompts.
- Feedback-fit analysis.
- `call_feedback` to decide whether training is complete, should repeat, or should be abandoned.

Exit to `review_checks` or `implementation_plan`.

### 7. implementation_plan

Goal: turn accepted checks into concrete changes.

This state is intentionally unfinished. Expand later.
