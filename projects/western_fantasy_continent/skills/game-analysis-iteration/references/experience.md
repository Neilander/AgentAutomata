# Experience State

Goal: experience comparable games or adjacent design artifacts and summarize what makes them liked or disliked.

## Method A: Steam Review Analysis

Use when the target is broad player reception.

Process:

1. Collect a large review sample. The current target sample size is 5000 reviews when feasible.
2. Separate positive and negative reviews.
3. Perform close reading rather than only keyword counting.
4. Summarize what players like, what players dislike, what loops players praise, and what failure points create fatigue, boredom, confusion, or distrust.

Output:

```text
source_games:
review_count:
positive_patterns:
negative_patterns:
liked_loops:
disliked_loops:
design_hypotheses:
```

## Method B: Guide / Strategy Reading

Use when the target is system understanding rather than broad reception.

Process:

1. Find guides, build guides, map guides, progression guides, or strategy explanations.
2. Identify what the guide teaches players to optimize.
3. Extract design points such as map tricks, build engines, key components, progression gates, and common mistakes.
4. Record what knowledge the game expects players to learn.

Output:

```text
source_guides:
core_design_points:
build_or_map_engines:
player_learning_requirements:
common_mistakes:
transferable_lessons:
```
