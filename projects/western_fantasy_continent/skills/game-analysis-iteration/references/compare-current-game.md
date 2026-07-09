# Compare Current Game State

Goal: turn macro traits from `distill` into detailed indicators that can be checked against the current game.

## Method: Step-By-Step Loop Check

For a loop such as:

```text
goal -> drop perception -> improvement -> verification -> new goal
```

Check each step concretely.

### A. Goal

- Can the player see an obvious output hand or target build direction?
- Is the next target understandable before optimization?
- Does the interface show what the player is trying to improve?

### B. Drop Perception

- Can the player tell which drop might matter?
- Are there keywords, rarity cues, base-stat cues, or build tags?
- Does the drop create curiosity instead of only inventory noise?

### C. Improvement

- How does the player feel they strengthened the output hand?
- Is the improvement visible through power number, keyword, affix, animation, combat signal, or success rate?
- Does the improvement connect to the build engine rather than only generic stats?

### D. Verification

- Is there a suitable dungeon, fight, benchmark, or event to test the change?
- Can the player see whether the change worked?
- Could the player become stronger on paper but fail harder because the test changed shape?

### E. New Goal

- Does verification create a next target?
- Does failure explain what part of the build is weak?
- Does success unlock a sharper build direction?

## Method: Build-System Role Check

For each candidate system component, classify it as:

- core engine;
- style assistant;
- general utility hand;
- bridge;
- payoff.

Then check whether the current game has enough visible engines before adding subtle assistants.

## Method: Field-Effect Mechanism Check

Use this when reviewing dungeon field effects, level-wide buffs, battlefield rules, or environment modifiers.

Core feedback:

```text
If most field effects add several unrelated stats at once, the player cannot read what the field actually does.
Multi-stat fields are allowed as special cases, but they cannot be the default design language.
```

A field effect should usually have one readable main axis:

- a mechanism rule, such as "shields explode", "first backline hit marks", "every third skill echoes", or "poison spreads on death";
- a single primary stat axis, such as frontline HP, caster skill haste, basic attack speed, or healing received;
- a clear conversion, such as shield -> damage, burn -> attack speed, healing overflow -> shield, or mark -> focus damage.

Multi-stat fields are allowed only when the field is intentionally about combining several levers. Example: a "Blood Moon" type field can add physical power, attack speed, effect power, and received healing because the intended player question is "how do I exploit all four low-health/brawl levers?" This should be rare. If every field works this way, all fields become attribute soup.

Required review format:

```text
Field:
Player-facing one-line rule:
Primary axis:
  mechanism | single stat | conversion | multi-stat package
Exact modified stats:
Who can exploit it:
Who cannot exploit it:
Why this is not generic power:
Can the player understand it at first glance:
  yes | partial | no
If partial/no, simplify by:
  choosing one main axis | turning it into a mechanism | making it a rare special field
```

Reject or revise if:

- the field buffs three or more unrelated stats without a clear unifying question;
- the one-line rule cannot be stated without listing many hidden numbers;
- the same design could be described as "these roles get a bunch of useful stats";
- multiple fields in the same batch all use the same multi-stat package pattern;
- the field only creates team preference through broad stat coverage rather than a visible mechanism, conversion, or testable play pattern.

## Method: Progression-Layer Check

For each growth layer, ask:

- What does the player learn at this layer?
- What UI or combat signal makes the layer visible?
- What previous knowledge does it build on?
- What new decision does it unlock?
- What should not be introduced yet?

## Method: Lock-Key Cognition Check

Use `lock-key-cognition.md` when reviewing map progression, prisons, camps, process-level walls, boss gates, or other sequences where the player must solve a problem to earn a valuable reward.

Do not check only the static designer chain:

```text
lock -> key -> treasure
```

Check the player's cognition over time:

```text
concepts -> knowledge -> behaviors -> failure memory -> attribution -> wake-up -> retry -> knowledge update
```

Minimum questions:

- What concepts, knowledge, and behaviors does the player have before the lock?
- What failure memory does the lock create?
- Can the player attribute the failure using concepts they already know?
- What key is visible and actionable under that current cognition?
- Does obtaining the key wake the failure memory soon enough?
- What knowledge updates after the player succeeds?
- Does the lock have at least two heterogeneous solutions?

If the answer depends on first impressions, update thresholds, or failure wake-up probability, read `lock-key-cognition.md` and use its review format.

## Method: Problem List And Dependency Check

After checking the current game, do not jump from each problem directly to a fix. First produce a problem list with dependency information.

Use this format:

```text
Problem:
Evidence:
Loop step affected:
Player understanding stage affected:
Problem type:
  upstream | core | downstream | local polish
Depends on:
Blocks:
Coupling:
  high | medium | low
Can be solved by direct explanation:
  yes | no | partial
Why direct explanation is or is not enough:
Priority:
  high | medium | low
```

Definitions:

- `upstream`: affects the player's ability to form goals, understand what is being tested, or interpret later signals.
- `core`: directly affects the main loop under analysis, such as loot choice, build adjustment, verification, or failure diagnosis.
- `downstream`: depends on earlier problems being solved. Do not polish it first if the upstream meaning is still unclear.
- `local polish`: improves comfort or clarity but does not change the loop's meaning.

Dependency rule:

```text
In a linear player loop, later problems often depend on earlier problems.
Do not prioritize a downstream solution just because it is easier to implement.
Prefer fixing the earliest missing meaning signal that blocks later choices.
```

Important caution:

```text
Not every information problem can be solved by adding explanatory text.
If the player needs to learn through comparison, repeated feedback, combat evidence, or a choice consequence, mark direct explanation as partial or no.
Then the later implementation plan must design an experience, not only a label.
```

Example:

```text
Problem: Player cannot tell whether a drop matters.
Direct explanation: partial.
Reason: text can name likely users, but the player still needs comparison, equip delta, and later combat verification to believe the item mattered.
```
