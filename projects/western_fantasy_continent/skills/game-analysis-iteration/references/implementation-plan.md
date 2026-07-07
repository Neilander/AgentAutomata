# Implementation Plan State

Goal: turn accepted indicators into concrete changes.

This state should not start from a flat wishlist. It must start from the problem list generated in `compare_current_game`, especially dependency, coupling, and whether the problem can be solved by direct explanation.

## Prioritization

Classify each candidate change:

```text
Change:
Solves problem(s):
Problem type:
  upstream | core | downstream | local polish
Dependencies:
Blocked by:
Coupling:
  high | medium | low
Implementation risk:
  high | medium | low
Learning value:
  high | medium | low
Validation signal:
```

Priority rules:

1. Prefer upstream problems that unlock player understanding of later steps.
2. Prefer core-loop breaks over downstream polish.
3. Lower the priority of downstream problems whose prerequisites are unresolved.
4. Do not rank an easy UI label above a harder upstream experience problem if the label cannot actually teach the player.
5. When two problems are equally important, prefer the one with lower coupling and clearer validation.
6. If a change touches combat rules, loot generation, progression pacing, and UI at the same time, split it unless the coupling is the point of the experiment.

## Direct Explanation Check

Before planning a fix, decide whether the problem can be solved by direct text.

Use:

```text
Can direct explanation solve it:
  yes | partial | no
Required experience if not direct:
  comparison | repeated feedback | combat evidence | choice consequence | benchmark | tutorial step
```

Guidance:

- Use direct explanation when the player only needs a name, label, or reminder.
- Use comparison when the player must judge one item, build, recruit, or region against another.
- Use repeated feedback when the player must learn a rule over several runs.
- Use combat evidence when the player needs to believe a build is stronger because it performed better.
- Use choice consequence when the lesson is "choosing this changes the next fight."

## Output

The implementation plan should end with:

```text
Chosen first change:
Why this is first:
Deferred changes:
Why deferred:
Validation:
Report/task-board updates needed:
```

Do not implement changes until the user approves the plan, unless the user explicitly asks to proceed.
