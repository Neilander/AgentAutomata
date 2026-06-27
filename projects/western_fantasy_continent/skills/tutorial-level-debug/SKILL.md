---
name: tutorial-level-debug
description: Debug tutorial, test, and onboarding combat levels for Western Fantasy Continent. Use when a teaching level, test encounter, or small preset fight fails because class differences are unclear, the intended answer is not visible, or the agent is tempted to tune enemy/player stats instead of improving role identity, roster choice, skill signals, and acceptance checks.
---

# Tutorial Level Debug

## Core Rule

Do not solve a tutorial or test level by changing raw enemy/player stats first.

A tutorial level must teach a visible decision. If the intended team wins only after hidden stat multipliers, the level is probably not teaching the right thing.

Player-facing setup text must not reveal the solution.

Before combat, text may describe:

- enemy behavior
- visible pressure
- selection count
- broad objective
- constraints the player can observe

Before combat, text must not say:

- which role is correct
- which role should stand front/back
- which skill is the intended answer
- "recommended", "best", "wrong", or equivalent labels

Only after success may result text summarize what the player just proved.

## Required Question

Before changing anything, answer:

```text
What should the player notice after trying this level?
```

Examples:

- "法师的 AOE should visibly hit multiple enemies and outperform single-target damage against grouped enemies."
- "牧师 should make a fragile ally survive a dangerous window."
- "骑士 should buy time, but not be the only usable front-line solution."
- "游侠 should feel better against one priority target than against a spread-out pack."

## Debug Order

### 1. Diagnose Visible Difference

Check whether the level creates conditions where the class fantasy can appear.

Ask:

- Are there enough targets for AOE to matter?
- Is there a sustained damage window where healing can matter?
- Is there a single dangerous target for mark/focus fire to matter?
- Is there a frontline pressure pattern where tanking matters?
- Is the fight long enough for the intended skill to cast?
- Does the UI/combat feedback show the effect clearly enough?

If the answer is no, do not tune numbers. Change the encounter or roster first.

### 2. Option A: Adjust Available Roles

Use this when the test is meant to teach a decision through comparison.

Allowed changes:

- Swap a candidate role for a clearer comparator.
- Remove roles that accidentally solve the level for the wrong reason.
- Add a role that shows the intended contrast.
- Change the number of available picks if the lesson is too noisy.

Examples:

- If "knight + ranger" and "knight + mage" feel similar, replace one candidate with warrior or priest so the choice tests frontline/sustain more clearly.
- If a two-unit lesson is about front/back, show only front/back slots.
- If a lesson needs front-row choice or back-row safety, show the full four slots and lock empty slots after the team is full.

Validation:

```text
Intended team:
Wrong-but-plausible team:
Why the intended team should feel different:
Signal that proves the difference:
```

### 3. Option B: Strengthen Class Feature

Use this when the right class is present but its signature effect is too weak, too late, or too invisible.

Allowed changes:

- Strengthen a class-owned skill effect.
- Shorten a class-owned opening cooldown if the skill fires after the fight is decided.
- Increase target count/radius for AOE when the class is supposed to teach AOE.
- Increase healing/shield timing clarity for sustain classes.
- Improve combat feedback for the effect.

Do not:

- Change shared action priority, targeting, movement, death handling, or cooldown flow.
- Add hidden tutorial-only stat multipliers as the first fix.
- Buff a generic base stat when the problem is class identity.

## Natural Player Behavior Rule

Do not fix a bad tutorial by removing ordinary player agency.

If the only passing setup requires an unnatural behavior, such as putting a backline mage or priest in front while the intended frontline stays behind, the level is broken. Do not solve that by locking slots, hiding slots, or preventing the player from making formation choices unless the lesson itself is explicitly about a constrained formation.

Instead:

- Define the natural expected setup first, such as frontline roles in front and ranged/support roles behind.
- Verify that this natural setup can pass.
- Verify that at least one plausible wrong setup fails or looks clearly worse.
- Adjust roster candidates, enemy composition, class-feature visibility, or encounter pressure until the natural setup is the obvious working path.
- Only constrain slots when the teaching goal is specifically about a smaller formation, such as a two-unit front/back lesson.

After strengthening a feature, run a balance pass to check whether the class became generally overpowered.

## Solution Density Rule

A tutorial level is not valid just because it has at least one passing answer. It must have a controlled number of passing answers, and most passing answers must teach the intended lesson.

Before accepting a level, enumerate or sample the solution space:

- total selectable team/formation combinations
- passing combinations
- pass density
- natural passing combinations
- passing combinations that teach the intended point
- passing combinations that win for unrelated reasons

Use these rough targets:

- Operation/tutorial UI level: high pass density is acceptable if the goal is only teaching controls.
- Single-concept combat lesson: target about 15-35% pass density.
- Combo/synergy lesson: target about 20-45% pass density.
- Practice/checkpoint level: target about 40-70% pass density.

If pass density is too high, the level is probably a practice arena, not a lesson. Tighten roster choices, enemy composition, pick count, or encounter pattern before changing stats.

## Teaching Validity Rule

Passing answers must be checked for meaning, not only count.

For most passing answers, ask:

- Does this answer use the intended role, skill family, formation idea, or counter-pattern?
- Would a player who wins this way learn the intended lesson?
- Is the answer natural, such as frontline units in front and backline units behind?
- Is the answer accidentally winning through raw role strength, hidden enemy weakness, or a dominant unrelated combo?
- Does combat feedback visibly show why this answer worked?

Mark each sampled passing answer as:

- `teaches`: proves the intended lesson.
- `acceptable`: not the ideal lesson, but still reinforces a related idea.
- `accidental`: wins while teaching the wrong thing or nothing.

Acceptance rule:

- Teaching levels need a majority of passing answers to be `teaches` or `acceptable`.
- Any strong, obvious `accidental` answer must be removed or turned into a real lesson.
- Do not accept a level where the easiest or most natural passing answer teaches the wrong thing.

When checking a level, sample at least:

- the first 5-10 passing answers found
- the most natural passing answers
- the highest-power-looking passing answers
- at least 3 plausible failing answers
- at least 1 negative-control answer that should not pass

Required checks:

```text
Feature changed:
Expected visible signal:
Before/after signal:
Does it affect only the intended fantasy, or generic power?
Regression risk:
```

### 4. Balance Verification

After Option A or B, run at least these checks:

- Intended solution wins in the intended way.
- At least one plausible wrong solution fails or looks clearly worse.
- The level does not require hidden knowledge.
- The class fantasy appears in signals, not only in final win rate.
- Existing archetype or role checks do not show a new obvious overpowered pattern.

Prefer signal checks:

- AOE: number of targets hit per cast, skill damage share, simultaneous damage floaters.
- Healing: healing per second, ally low-health survival time, recovery after danger.
- Shield/tank: damage redirected/absorbed, survival window bought, taunt or guard timing.
- Mark/single target: marked target damage share, first-kill timing.
- DOT: stack count over time, tick damage share, payoff timing.

## Output Format

Use this format before implementing:

```text
Teaching goal:
Current failure:

Option A - role/encounter adjustment:
- Change:
- Why it teaches better:
- Validation:

Option B - class-feature adjustment:
- Change:
- Why it teaches better:
- Balance risk:
- Validation:

Recommended first patch:
Do not change:
```

After implementing:

```text
Changed:
Signal evidence:
Solution density:
Passing answer audit:
Pass/fail:
Remaining problem:
Next patch if needed:
```
