# Validation Protocol

## 1. Design Contract

```text
Level:
Type:
Progression stage:
Standard equipment:
Player knowledge before entry:
Lesson or test:
Favored state family:
Alternatives:
Wrong-but-plausible states:
Expected visible signals:
Expected emotion shape:
Forbidden outcomes:
```

## 2. Search Plan

```text
Legal character count:
Team size:
Formation choices:
Skill/loadout choices:
Estimated total states:
Method: exhaustive / standard-team sample / matched pairs
Reason:
Seeds per state:
```

For a large space, list the team groups and their intended interpretation before running combat.

## 3. Combat Table

| State/team | Group | Equipment | Win rate | Duration | Survivors | Target evidence | Classification |
|---|---|---|---:|---:|---:|---|---|

Classifications:

- `teaches`: wins by expressing the declared lesson
- `acceptable`: wins through a related, understandable alternative
- `accidental`: wins while bypassing or contradicting the lesson
- `fails`: does not pass

## 4. Character Or Mechanic Matched Pairs

| Shell | With target | Replacement | Win-rate delta | Signal delta | Causal interpretation |
|---|---|---|---:|---|---|

Do not compare unrelated teams and attribute the entire difference to one character.

## 5. Emotion Timeline

| Node/phase | Before | Minimum | Result delta | Loot delta | Decision/verification | After | Interpretation |
|---|---:|---:|---:|---:|---|---:|---|

Record the first meaningful failure separately:

```text
Feedback at failure:
Player-visible cause:
Available actions:
Hypothesis formed:
Cost of testing it:
Feedback after verification:
```

## 6. Counterfactual Checks

Run at least the relevant comparisons:

- remove the intended key/character
- replace it with a role-equivalent option
- keep the key but remove the encounter condition it should answer
- increase raw equipment without using the key
- use a mainstream team unrelated to the lesson

The lesson is causal only when these comparisons support it.

## 7. Verdict

```text
Combat goal: pass / revise / fail
Emotion goal: pass / revise / fail
Teaching clarity: pass / revise / fail
Regression: pass / not run / fail
Overall: accept / revise / reject
Primary reason:
Next permitted change:
```

Never report `accept` when any required check was not run.

