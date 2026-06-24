# Keyword Mechanics Taxonomy

Use this reference before designing or expanding skill keywords.

The goal is not to increase keyword count. The goal is to decide whether a keyword can support meaningful builds, whether it should stay rare, and how it should interact with class identity.

## Core Rule

Classify a keyword before adding skills around it.

Do not treat "low usage count" as automatic evidence that a keyword needs more skills. Some low-count keywords are rare by design. Some common keywords are necessary glue but not worth deep expansion.

## 1. Resource Keywords

Resource keywords are the best candidates for deep build design.

They can be generated, stacked, transferred, consumed, detonated, protected, converted, or amplified.

Current examples:

- Mark
- Poison stacks
- Burn stacks
- Shield value

Future examples:

- Rage
- Holy light
- Combo points
- Alchemy charge

Design guidance:

- Give resource keywords both setup skills and payoff skills.
- Avoid letting one unit provide the full resource loop alone unless that is the explicit class fantasy.
- Prefer multiple verbs around one resource: apply, spread, consume, detonate, convert, protect, steal.
- Resource keywords should create readable team-building questions.

Good question:

```text
Who applies mark, who preserves it, and who consumes it?
```

Bad question:

```text
Who has the biggest damage number?
```

## 2. Keyword Actions

Keyword actions are verbs that manipulate resource keywords.

Examples:

- Apply
- Spread
- Transfer
- Consume
- Detonate
- Cleanse
- Convert
- Extend
- Steal

Design guidance:

- Add actions when a resource keyword feels shallow.
- Do not add many new resource nouns before existing resources have enough actions.
- Each action should create a visible player-facing change.

Example:

```text
Mark spread makes the fight shift from single-target focus to multi-target setup.
Mark detonation makes saved stacks visibly cash out into burst.
```

## 3. Window Keywords

Window keywords create timing and rhythm. They are strongest when the player can notice the opening and payoff.

Examples:

- Haste
- Guard / damage reduction
- Counterattack window
- Lifesteal window
- Power buff
- Immortality window

Design guidance:

- Window keywords do not need high counts.
- Design around "when this opens" and "what should happen during it."
- Strong windows need downtime, a risk condition, or a clear counter.
- Avoid stacking too many always-on windows, because the fight becomes unreadable.

## 4. Behavior Rewrite Keywords

Behavior rewrite keywords change targeting, response rules, or combat structure. They are powerful and should be used carefully.

Examples:

- Taunt
- Counterattack
- Execute
- Backline access
- Target switching
- Frontline pressure
- Cooldown reset
- Ultimate refund

Design guidance:

- These are high-value keywords because they make a role feel different.
- Add fewer skills, but make each one legible.
- Protect the global combat loop. Prefer skill-owned rules over changing targeting or action priority globally.
- Validate with signal curves, not only win rate.

## 5. Basic Survival Keywords

Basic survival keywords are necessary but not automatically deep.

Examples:

- Heal
- Lifesteal
- Plain damage reduction
- DOT resistance

Design guidance:

- Use them as glue unless they are attached to a sharper fantasy.
- Lifesteal is usually ordinary unless tied to low-health, self-damage, poison, or execute.
- Healing is usually ordinary unless it converts overheal, cleanses, creates a resource, or changes target priority.
- Do not expand these just because their count is low.

## 6. Rare Miracle Keywords

Rare miracle keywords should stay scarce because they create huge emotional and balance impact.

Examples:

- Immortality
- Revive
- Death prevention
- Team invulnerability
- Ultimate reset
- Instant kill
- Time stop

Design guidance:

- Keep them rare and class-defining.
- Do not use them as generic balance patches.
- Give them strong signal validation and failure boundaries.
- If one becomes common, it stops feeling miraculous and starts distorting balance.

## Current Project Priorities

Prioritize expansion:

- Mark as a resource keyword.
- Shield as both survival and resource keyword.
- Counterattack as a behavior rewrite keyword.
- Taunt as a behavior rewrite keyword.
- Frontline pressure as a behavior rewrite keyword.
- Carry support as a team resource-routing pattern.
- Poison/burn payoff as resource conversion.

Expand moderately:

- Burn
- Poison
- Haste
- Power buff
- Execute
- Self-damage

Keep rare:

- Immortality
- Revive
- Ultimate reset
- Full immunity

Do not expand by default:

- Plain lifesteal
- Plain healing
- Plain direct damage
- Plain damage reduction

## Review Checklist

Before adding a keyword skill, answer:

```text
Keyword:
Category:
Why this category:
Should this keyword be common, build-around, or rare:
What action does this skill add:
What player-facing change should be visible:
What existing keyword or class identity could it overlap with:
What signal would prove it works:
What failure mode would make it unhealthy:
```

If the keyword is a resource, define setup and payoff separately.

If the keyword is rare, justify why it belongs in this class and why it should not be generalized.

If the keyword is basic survival, explain why it is not just filler.
