---
name: design-width-evaluator
description: Evaluate the application width of a game design element before accepting it into common systems. Use when judging whether a keyword, affix, skill mechanic, item stat, equipment rule, enemy mechanic, UI control, or reward type is too narrow, too universal, or healthy enough for normal use. Especially use before adding loot affixes, shared keywords, common skill effects, or mechanics that could become dead rolls for most classes.
---

# Design Width Evaluator

Use this project skill before adding a design element into a shared pool.

Core rule:

```text
Normal shared designs should have enough real use cases.
Narrow designs are allowed only when they are deliberately class-exclusive, rare, or gated.
```

For normal loot affixes in the current equipment system:

```text
A normal archetype affix must have at least two real user roles.
```

Do not count "can appear on several slots" as usage. A design is used only when a character, team, encounter, or player decision can actually convert it into value.

## Workflow

### 1. Find Current Real Use Cases

List who can use the design right now.

Use this format:

```text
Design element:
Current users:
Current non-users:
Conversion path:
  what mechanic/stat/skill turns this into value
Current width:
  broad | medium | narrow | dead
Evidence:
```

Definitions:

- `broad`: useful to many roles or systems without becoming mandatory.
- `medium`: useful to several roles or one common team function.
- `narrow`: useful to one role, one build, or one matchup.
- `dead`: available but no one can meaningfully convert it.

Questions:

- Which classes already have matching skills or stats?
- Which team archetypes already want it?
- Which enemies or encounters make it relevant?
- Does it create visible feedback, or only hidden score?
- Is it useful outside one named matchup?

Example:

```text
stealthDuration
Current users: assassin
Conversion path: assassin has hidden/shadow-window mechanics
Current width: narrow
Verdict: not valid as a normal shared affix unless another role gains a real stealth/ambush branch.
```

### 2. Analyze Future Potential

List who could reasonably use the design later without breaking fantasy or combat ecology.

Use this format:

```text
Future candidates:
  role/system | possible conversion path | fantasy fit | risk
Rejected candidates:
  role/system | why not
Future width:
  broadable | expandable | class-locked | should stay rare
```

Do not add future users by name only. Define the conversion path.

Good:

```text
ranger can use stealthDuration if it gains camouflage/ambush: short hidden setup, first shot bonus, breaks on attack.
```

Bad:

```text
ranger can use stealth because it sounds cool.
```

## Extreme Saturation Test

After current and future use cases, ask:

```text
If every role, or all 4 units in one team, had this design, would the game still work?
```

Classify the result:

- `safe universal`: everyone can have it and the game still functions.
- `bounded universal`: everyone can have it, but values must be capped or differentiated.
- `team-warping`: multiple copies create a dominant or unfun team pattern.
- `fantasy-breaking`: broad access destroys role identity.
- `system-breaking`: broad access breaks targeting, tempo, readability, or counterplay.

Examples:

```text
Fire damage:
Extreme test: all 4 units deal fire damage.
Result: safe or bounded universal.
Reason: fire is mostly a damage type. It can be balanced by resistance, burn stacks, or damage budget.
```

```text
Stealth/hidden:
Extreme test: all 4 units enter stealth.
Result: system-breaking/team-warping.
Reason: targeting collapses, fights lose readable front/back structure, and counterplay becomes mandatory.
Verdict: do not make stealth a normal universal stat. Gate it by role, item type, cooldown, or special class branch.
```

```text
Aura power:
Extreme test: all 4 units stack generic auras.
Result: team-warping if uncapped.
Reason: passive multiplicative team value can become invisible but mandatory.
Verdict: allow only if aura categories have caps, diminishing returns, or clear ownership by support/frontline classes.
```

## Width Verdict

Finish every evaluation with one of these verdicts:

```text
Verdict:
  accept as common
  accept as normal archetype
  accept but gate by slot/role/rarity
  redesign to add more real users
  move to class-exclusive pool
  reject/remove from shared pool

Reason:
Required changes:
Validation:
```

Guidance:

- Use `accept as common` for stable fundamentals like damage, health, cooldown, attack speed, fire-as-damage-type.
- Use `accept as normal archetype` only when at least two real roles can use it.
- Use `gate by slot/role/rarity` when extreme saturation is dangerous but controlled use is healthy.
- Use `move to class-exclusive pool` when the design is good but genuinely belongs to one class.
- Use `reject/remove` when it creates dead rolls, mandatory counters, or unreadable combat.

## Red Flags

Reject or redesign when:

- Only one class can use a normal shared affix.
- The design is a dead roll for most loot recipients.
- The only use case is one matchup counter.
- The design needs invisible AI targeting or vague wording to work.
- Four copies would make the fight unreadable.
- The design is so universal that every build always wants it.
- Future users exist only as names, without a clear conversion path.

## Output Template

```text
Design element:
Current real use cases:
Future possible use cases:
Rejected use cases:
Extreme saturation result:
Width verdict:
Required change:
Next validation:
```
