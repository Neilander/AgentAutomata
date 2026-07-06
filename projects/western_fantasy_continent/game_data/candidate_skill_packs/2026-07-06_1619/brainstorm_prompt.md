# Brainstorm Prompt: 2026-07-06_1619

Prompt strategy:

Instead of asking one agent for 30-50 structured ideas, split the brainstorm into 10 narrow directions. Each subagent was asked for only 8 rough ideas with this compact format:

```text
Name
Type
One-sentence fantasy
Output posture
What the player wants to stack
Biggest weakness
```

Directions:

1. Low-health output
2. Bouncing basic attacks / return projectiles
3. Shield-to-damage / counter cannon
4. Frost shatter / frost output
5. Protected long cast
6. DOT spread / poison-fire propagation
7. Reload / magazine / pressure loading
8. Charged heavy hit / dragged blade
9. Mark focus fire / team first hit
10. Hybrid builds from the above veins

Result:

- 10 requested directions.
- Tool concurrency allowed 4 subagents at a time, so they were batched.
- All 10 directions returned successfully.
- No subagent timed out in this run.
