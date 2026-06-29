---
name: phenomenon-math-modeling
description: Turn observed gameplay, balance, UX, or player-behavior phenomena into explicit mathematical or causal models before changing design. Use when a user reports symptoms such as "berserker prefers health", "assassin does not benefit from attack speed", "players avoid mode A", "one team is too dominant", or any problem where the agent must translate a phenomenon into variables, formulas, contribution channels, hypotheses, and validation metrics before tuning.
---

# Phenomenon Math Modeling

Use this skill before proposing fixes for a confusing phenomenon. The goal is not to make a perfect equation; the goal is to force the problem into a testable language so the next change targets the true cause instead of the visible symptom.

Core rule:

```text
Do not ask "what should I buff or nerf?"
Ask "which variable is converting into value too efficiently, too weakly, or through the wrong channel?"
```

## Workflow

### 1. State The Phenomenon

Write the symptom as an observation, not a solution.

Good:

```text
Observation: Berserker prefers health/tenacity routes over attack-speed routes.
```

Bad:

```text
Solution: Buff berserker attack speed scaling.
```

Required output:

```text
Observed phenomenon:
Where it appears:
Expected fantasy or design intent:
Why the gap matters:
```

### 2. Define The Value Function

Translate the phenomenon into a rough value model.

For combat:

```text
Combat value ~= survival time * contribution per second
Contribution per second ~= basic channel + skill channel + utility channel
Basic channel ~= basic attack value * basic attack frequency * on-hit conversion
Skill channel ~= skill value * skill efficiency
Skill efficiency ~= cast frequency * timing quality * target quality
```

Important interaction:

```text
High skill efficiency can reduce basic attack value if skills interrupt, replace, or dominate the combat window.
High survival value often means "the unit converts extra seconds into high damage or utility", not necessarily "health is too strong."
```

For player behavior:

```text
Willingness ~= expected reward - expected cost + emotional reward - emotional cost
Expected reward ~= material reward + progress reward + social/status reward
Expected cost ~= time + friction + uncertainty + failure risk
```

Required output:

```text
Value function:
Primary variables:
Conversion channels:
Possible bottlenecks:
Possible runaway multipliers:
```

### 3. Decompose Contribution

Break the value function into channels before changing numbers.

For a role/build problem, ask:

- Does extra survival mainly add more basic attacks?
- Does extra survival mainly allow a key skill or ultimate to fire?
- Does extra survival mainly preserve a utility aura, shield, heal, mark, or debuff?
- Does attack speed increase real events, or is the unit spending too much time casting skills?
- Does power increase the actual skill formulas, or is the skill using the wrong scaling stat?
- Does the current test environment reward the intended channel?

Required output:

```text
Contribution split to inspect:
  survival:
  basic attacks:
  skills:
  ultimate/window:
  healing/shielding:
  control/debuff:
  target selection:
```

### 4. Form Hypotheses

Generate at least two causal hypotheses. Each must name a variable and a conversion path.

Example:

```text
H1: Health is valuable because extra seconds let berserker reach ultimate.
H2: Attack speed is weak because the berserker's value is concentrated in cooldown skills, not on-hit effects.
H3: Power is weak because the new skill uses generic power or magic scaling instead of physical scaling.
```

Do not accept hypotheses like "the class is weak" or "the player does not like it"; those are labels, not causes.

Required output:

```text
Hypothesis:
Predicted signal if true:
Signal that would falsify it:
Safer design lever:
Risk of the lever:
```

### 5. Choose Measurements

Pick measurements that correspond to the model.

Combat examples:

- survival seconds
- damage by basic / small skill / ultimate / DOT / counterattack
- casts per minute
- basic attacks per minute
- skill time share versus basic time share
- healing received, lifesteal, shielding received
- damage after low-health threshold
- value gained after each extra second alive
- target class hit by important skills

UX/player-behavior examples:

- entry rate
- completion rate
- retry rate
- time to first meaningful action
- reward claimed per minute
- visible failure moment
- abandonment point
- mismatch between player intent and visible feedback

Required output:

```text
Metrics:
Diagnostic run:
Acceptance threshold:
Regression check:
```

### 6. Select The Lever

Choose a fix based on the model, not the symptom.

Common lever mapping:

| Diagnosis | Bad fix | Better fix |
| --- | --- | --- |
| Survival is valuable because it unlocks a huge ultimate | Nerf all health | Move some value from ultimate into baseline loop, or reduce ultimate dependence |
| Attack speed is weak because basic attacks have no conversion | Add raw attack speed | Add on-hit resource, stacking, lifesteal, or trigger payoff |
| A class only works when forced into one stat | Buff that stat harder | Create two useful conversion channels with different tradeoffs |
| Players avoid mode A because cost feels high | Force participation | Reduce friction, clarify reward, add optional low-cost entry, or improve emotional payoff |
| A counter skill only beats one team | Make it stronger | Add secondary utility so it is a soft counter with ordinary use cases |

Required output:

```text
Chosen lever:
Why this lever targets the conversion path:
Protected rules:
Expected side effects:
Validation plan:
```

### 7. Translate Back To Design

After math modeling, explain the design in player-facing language.

Example:

```text
Math: Attack speed must increase berserker value through on-hit lifesteal and rage stacking.
Design: Berserker should feel like it gets more dangerous the longer it keeps swinging, even before ultimate.
```

If the math answer cannot be translated into a clear player-facing story, it is probably not the right design answer.

## Game-Specific Notes

### Berserker Health Preference

If berserker prefers health/tenacity:

1. Do not immediately nerf health.
2. Compute what extra survival converts into.
3. If it converts into ultimate access, reduce ultimate dependency.
4. If it converts into basic attacks but attack speed is still weak, basic attacks lack on-hit conversion or the skill loop blocks basics.
5. Prefer moving value into baseline attack-speed / physical-power loops before touching base stats.

Target direction:

```text
Berserker should have a baseline loop that eats attack speed and physical power.
Ultimate should amplify the loop, not create the only real loop.
```

### Assassin Survival Preference

If assassin prefers health/tenacity:

1. Check whether the assassin dies before reaching target or before using payoff skills.
2. Separate "needs entry reliability" from "needs generic tankiness."
3. Prefer backline access, brief evasion, target reset, or on-hit resource conversion over raw durability.
4. Avoid simply raising burst multipliers, because that can break 1v1 while failing to fix 4v4.

## Examples And References

Read `references/modeling-examples.md` when examples or theoretical anchors are needed.

