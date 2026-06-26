---
name: user-review
description: Review a designed or implemented game UI by simulating user goals, task paths, expected actions, and feedback gaps. Use after UI planning or implementation to find missing controls, unclear affordances, blocked recovery paths, weak feedback, or places where the player cannot complete the intended task.
---

# User Review

## Role

Use this skill after `signal-based-ui-planner` and/or `game-ui-designer`.

Do not redesign the whole UI first. Review the current interface as a player would encounter it, then report concrete friction points and minimal fixes.

## Core Rule

Review from the user's goal, not from the component list.

The main failure this skill prevents:

> The interface contains all intended features, but the player cannot smoothly complete the task because a needed action, recovery path, or feedback signal is missing.

## Workflow

### 1. Define User Frame

Write the user frame in four short lines:

```text
User:
Intent:
Prior knowledge:
Success state:
```

For games, include the current player expectation, such as:

- learn a new mechanic
- choose a team
- compare equipment
- start a fight
- recover from a wrong choice
- understand why they won or lost

### 2. Build Task Path

Write the likely user path as steps.

Each step must include:

```text
Step:
User expects:
UI must show:
Action available:
Feedback after action:
Recovery if wrong:
```

If a step has no recovery, flag it unless failure is intentional gameplay pressure.

### 3. Run Cognitive Walkthrough Questions

For each step, ask:

- Will the user know they need this step?
- Will the user notice the correct action?
- Will the user understand that this action does what they want?
- After acting, will the user know what changed?

If any answer is weak, mark the issue.

### 4. Check Control Completeness

For every selectable or changeable state, check:

- select
- deselect/cancel
- replace
- reset
- confirm
- undo or safe escape
- disabled state reason

Do not assume "click again" is obvious unless the selected state visibly communicates it.

### 5. Check Feedback Completeness

For every important action, check whether the player receives feedback in the same context:

- selection changed
- requirement missing
- action started
- action succeeded
- action failed
- result changed future options

Feedback should appear near the object affected unless there is a strong reason not to.

### 6. Classify Issues

Use these categories:

| Category | Meaning |
| --- | --- |
| Missing action | The user needs an action that does not exist. |
| Hidden action | The action exists but is easy to miss. |
| Ambiguous result | The user acts but cannot tell what changed. |
| No recovery | The user can enter a wrong state but cannot easily leave. |
| Wrong priority | Low-value information steals attention from the next action. |
| State mismatch | The screen does not match setup, active, result, or error state. |

### 7. Output Format

Return:

```text
User frame:
Task path:
Findings:
Minimal fixes:
Do not change:
```

Findings should be concrete and tied to a step.

Prefer minimal fixes over broad redesign. If the issue is structural, say so clearly.

## References

This workflow combines:

- Task analysis: break a user goal into visible and mental steps.
- Cognitive walkthrough: inspect whether a new user can discover and complete each step.
- Heuristic review: check feedback, user control, recovery, and status visibility.
