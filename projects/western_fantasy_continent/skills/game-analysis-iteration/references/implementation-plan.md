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

## Information Concentration Rule

When turning a diagnosis into an implemented game change, account for the player's limited attention.

Core rule:

```text
If one piece of information can explain the design, do not explain it with two.
When information count rises, the message becomes less concentrated and less clear.
```

Use this rule for UI, field effects, relics, enemy rules, dungeon modifiers, loot signals, and tutorial beats.

Before accepting a change, write:

```text
Player-facing message:
Number of distinct ideas:
Can one idea explain it:
  yes | no
If no, why multiple ideas are necessary:
What to remove or merge:
```

Guidance:

- Prefer one readable mechanism over several stat boosts.
- Prefer one primary stat axis over several loosely related axes.
- Prefer one conversion rule over a package of bonuses.
- Allow multi-stat packages only when the player's intended question is explicitly "how do I exploit these several levers together?"
- Treat special cases such as Blood Moon-style fields as rare. They are not the default way to make different teams viable.
- If a change needs several information channels, decide which one is primary and make the rest supporting, not equal-weight.

For field effects specifically:

```text
Bad default:
  This field gives HP, armor, damage, haste, and healing to a role group.

Better:
  This field makes frontliners much harder to kill.
  This field makes every third spell echo.
  This field converts shield gain into damage.
```

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
