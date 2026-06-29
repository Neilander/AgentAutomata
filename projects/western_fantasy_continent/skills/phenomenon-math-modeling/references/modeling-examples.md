# Modeling Examples And Anchors

This reference gives compact examples for `phenomenon-math-modeling`.

## Reference Anchors

- Mathematical modeling: define the real-world problem, choose variables and assumptions, build relationships/equations, solve, validate, and translate results back into the original domain.
- Systems thinking: explain behavior through feedback loops, delays, bottlenecks, and incentives rather than a single visible symptom.
- Game balance: evaluate a mechanic by value, cost, context, counters, and player-facing experience; avoid balancing isolated numbers outside the system.
- MDA-style game design: mechanics produce dynamics, and dynamics produce player experience. A numerical fix must still create the intended experience.

Useful public starting points:

- SIAM / Math modeling education material on translating real situations into variables, assumptions, and equations.
- Game design MDA framework by Hunicke, LeBlanc, and Zubek.
- Game balancing writing from designers such as Ian Schreiber and Ernest Adams, especially around cost, power, dominant strategies, and meaningful choices.
- Behavioral economics / UX framing around motivation as reward, effort, friction, uncertainty, and emotional payoff.

## Example 1: Berserker Prefers Health

Observation:

```text
Berserker's best build is health/tenacity, not attack speed or physical power.
```

Bad direct fix:

```text
Nerf health, buff attack speed.
```

Model:

```text
Berserker value ~= survival time * contribution per second
Contribution per second ~= basic attack channel + skill/ultimate channel
Health value ~= extra survival seconds * value unlocked during those seconds
```

Diagnostic questions:

- Does health mostly let berserker reach ultimate?
- Does health mostly let berserker keep swinging basics?
- Is attack speed increasing actual basics per minute?
- Are on-hit effects meaningful enough to make attack speed valuable?
- Are skills taking so much time that attack speed has little room to matter?

Possible conclusions:

```text
If health mainly unlocks ultimate:
  Move some ultimate value into baseline loop.
  Make ultimate amplify rage stacks instead of being the only true power spike.

If basics are many but low value:
  Add on-hit rage, lifesteal, bleed, or stacking damage.

If basics are blocked by skills:
  Reduce cast-lock, make skills empower next basic, or make attack speed reduce basic-window downtime.
```

Design translation:

```text
Berserker should already feel dangerous while swinging.
The ultimate should make a visible frenzy peak, not define the class by itself.
```

## Example 2: Assassin Prefers Health

Observation:

```text
Assassin takes generic survival because it dies before contributing in 4v4.
```

Model:

```text
Assassin value ~= probability of reaching target * payoff after reaching target
Probability of reaching target ~= entry reliability * survival during entry * target availability
Payoff ~= burst damage + execute value + reset/resource value
```

Bad direct fix:

```text
Give assassin more HP or more raw burst.
```

Better analysis:

- If entry reliability is low, add blink, brief dodge, or backline targeting.
- If payoff is low, add mark consumption, execute trigger, or reset.
- If burst is already high in 1v1, do not raise raw damage; add conditional teamfight reliability.

Design translation:

```text
Assassin should feel like it solves a positioning problem, not like a fragile warrior with bigger numbers.
```

## Example 3: Players Avoid Mode A

Observation:

```text
Players do not play mode A.
```

Bad direct fix:

```text
Force players to enter mode A daily.
```

Model:

```text
Willingness to play ~= material reward + emotional reward - time cost - friction cost - failure anxiety
```

Diagnostic questions:

- Do players understand the reward?
- Is the first action too slow?
- Does the mode punish failure too hard?
- Is the emotional fantasy weaker than the main mode?
- Is the mode useful only after a long delay?

Better fixes:

- Reduce entry friction.
- Show reward earlier.
- Add a cheap first attempt.
- Make failure produce information or partial progress.
- Tie the mode to the player's current intent.

Design translation:

```text
Players should enter because the expected reward and emotional payoff exceed the perceived cost, not because the UI traps them.
```

## Example 4: One Team Dominates

Observation:

```text
A standard team beats too many baselines.
```

Model:

```text
Team value ~= core carry value * support multiplier * matchup coverage
Dominance can come from:
  high base value
  too many multipliers
  no counter-window
  broad target coverage
  test pool missing natural predators
```

Diagnostic split:

- Does the core win without support?
- Does support multiply it too much?
- Does it have no timing weakness?
- Does it beat both burst and sustain?
- Does the test pool lack shield-break, cleanse, backline access, or tempo denial?

Possible fixes:

- Add a reusable soft counter.
- Reduce one multiplier.
- Create a timing window where the team can be punished.
- Improve the test pool before touching the team.

