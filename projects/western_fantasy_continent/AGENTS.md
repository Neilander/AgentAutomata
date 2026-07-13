# Project Agent Instructions

In addition to the repository-root `AGENTS.md`, follow these rules inside `projects/western_fantasy_continent`.

## Executable Player Model

Before changing, running, reviewing, or extending player cognition, AI playtesting, emotion simulation, signal interpretation, knowledge learning, or agent decisions:

1. Read `PLAYER_MODEL_RUNTIME.md`.
2. Read `player_model_runtime.json` for the current executable entry points and accepted evidence.
3. Read `skills/player-cognition-simulation/SKILL.md` and its required references.
4. Run the listed regression before claiming that the loop works.

Do not reconstruct the runtime from old reports. Do not replace the code-owned loop with an agent narrating an entire playthrough. The external AI is called only at the explicit decision and attribution boundaries documented by the current runtime.

Raw engine events are audit data. They must pass through the signal concept interpreter before emotion, knowledge, attribution, or decision systems consume them.

