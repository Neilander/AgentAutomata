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

## Method: Progression-Layer Check

For each growth layer, ask:

- What does the player learn at this layer?
- What UI or combat signal makes the layer visible?
- What previous knowledge does it build on?
- What new decision does it unlock?
- What should not be introduced yet?
