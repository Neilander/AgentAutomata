---
name: experiment-budget-governance
description: Allocate and govern iteration budgets for game-development tasks according to importance, uncertainty, blast radius, and expected value. Use when starting, continuing, pivoting, stopping, postponing, or changing acceptance criteria for balancing, mechanics, UI, VFX, tooling, architecture, or other agent-led experiments.
---

# Experiment Budget Governance

## Purpose

Decide how much effort a task deserves before changing its approach, target, or priority.

Do not iterate forever on low-value work. Do not lower a high-value target after one failed attempt.

## Step 1: Create An Experiment Card

Before the first implementation attempt, record:

```yaml
task:
importance: critical | high | medium | low
uncertainty: high | medium | low
blast_radius: high | medium | low
attempt_budget:
attempts_used: 0
success_criteria:
protected_regressions:
pivot_after:
target_review_after:
stop_after:
```

Store the card in the relevant hierarchical change-log branch. Update it after each meaningful attempt.

Also mirror active work in the task budget board. Do not edit `design/task-budget-board.json` by hand. Use the project updater so ids, statuses, priorities, and attempt counts stay normalized:

```bash
node projects/western_fantasy_continent/game_data/update-task-board.js list
node projects/western_fantasy_continent/game_data/update-task-board.js attempt <task-id> --decision reject --evidence "reason and validation result"
node projects/western_fantasy_continent/game_data/update-task-board.js set <task-id> --status active --used 2
```

The workbench page reads the same board, so this is the source for user-visible budget feedback.

### Task Board Status Updates

When work starts, changes checkpoint, or finishes, update the board through the updater:

```bash
node projects/western_fantasy_continent/game_data/update-task-board.js set <task-id> --status active
node projects/western_fantasy_continent/game_data/update-task-board.js attempt <task-id> --decision accept --evidence "validation result" --status done
node projects/western_fantasy_continent/game_data/update-task-board.js attempt <task-id> --decision reject --evidence "failed metric and reason" --status active
node projects/western_fantasy_continent/game_data/update-task-board.js set <task-id> --status postponed --evidence "why this is delayed"
```

Use statuses consistently:

- `queued`: planned but not currently being worked.
- `active`: currently being worked or still needs the next attempt.
- `blocked`: cannot progress without user approval, missing asset, or external dependency.
- `done`: accepted, validated, and no required work remains for this task.
- `postponed`: intentionally delayed because the budget process says to defer it.

Do not mark a task `done` just because the latest attempt ran. Mark it `done` only when the success criteria are accepted or the task is explicitly closed with a recorded limitation.

Do not run multiple task-board update commands in parallel. The board is a single local JSON store, so concurrent writes can overwrite each other. Apply status and attempt updates one at a time.

## Step 2: Assign Importance

- `critical`: foundational architecture, core combat feel, data safety, shared automation, or a project-defining experience.
- `high`: primary archetypes, major progression systems, core interfaces, or heavily reused assets.
- `medium`: normal mechanics, secondary interfaces, balance relationships, or localized workflow improvements.
- `low`: polish, decoration, optional convenience, or speculative improvements with limited reuse.

Suggested initial budgets:

| Importance | Attempts | Pivot review | Target review |
| --- | ---: | ---: | ---: |
| critical | 8-12 | 3-4 | 7-9 |
| high | 5-8 | 2-3 | 4-6 |
| medium | 3-5 | 2 | 3-4 |
| low | 1-3 | 1 | 2 |

Increase or reduce the budget by one or two attempts when uncertainty and blast radius justify it:

- High uncertainty can justify more diagnostic attempts.
- High blast radius requires fewer implementation attempts and more analysis before each edit.
- Cheap, isolated experiments may use the upper end.
- Expensive or shared-runtime experiments should use the lower end.

## Step 3: Count Attempts Correctly

One attempt is a testable hypothesis with:

- one stated reason
- one bounded change or coherent variant
- one validation result
- one accept, reject, or inconclusive decision

Do not count syntax fixes, logging additions, or rerunning the same unchanged test as new attempts.

## Step 4: Use Budget Stages

### Explore

Use early attempts to test the most likely narrow causes. Keep acceptance criteria fixed.

### Pivot

At `pivot_after`, stop stacking similar number changes. Reclassify the failure:

- implementation failure
- timing failure
- mechanic ownership failure
- measurement failure
- impossible under current architecture

Try a different mechanism, subject, measurement, or owning asset.

### Target Review

At `target_review_after`, review the acceptance target instead of automatically lowering it.

Changing a target is allowed when evidence shows:

- the metric measures the wrong subject
- the phase split is invalid
- the threshold conflicts with the written player experience
- the target is impossible under an explicitly protected rule
- the task's importance has changed
- further work costs more than the expected player or automation value

Record:

```text
Original target:
Attempts used:
Observed failure pattern:
Why implementation changes were insufficient:
Why the target or metric is wrong or no longer worth its cost:
New target or decision:
Expected consequence:
```

Do not change a target only because the current result is below it.

### Stop

At `stop_after`, choose and record one:

- accept
- accept with known limitation
- postpone
- redesign
- request architectural approval
- drop

Do not silently continue beyond the budget.

## Step 5: Protect High-Level Rules

Experiment budget does not override project God Rules, safety constraints, or explicit user decisions.

If a promising experiment requires violating a protected rule:

1. Do not perform it.
2. Record the architectural conflict.
3. Present it as a separate proposal requiring approval.

## Step 6: Regression Cost

Shared changes consume more budget because they require broader validation.

After changing shared assets or runtime behavior:

- rerun all affected contracts
- identify newly failing checks
- count regression repair as part of the same experiment branch
- reject the experiment if its regression cost exceeds its intended value

## Decision Output

At each checkpoint, report:

```text
Importance:
Budget:
Attempts used:
Current evidence:
Decision:
Remaining attempts:
Next hypothesis or stop reason:
```
