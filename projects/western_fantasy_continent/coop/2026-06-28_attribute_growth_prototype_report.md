# 2026-06-28 Attribute Growth Prototype Report

## Goal

This report hands off the recent numeric-system work to other agents.

The important boundary: the current combat baseline has a usable anchor, but the new attribute-growth system is still a prototype. It has been tested and iterated, but it is not yet approved for implementation.

## Current Baseline Anchor

Before the attribute-system exploration, the project had a playable and broadly accepted combat baseline:

- Class baseline numbers were tuned through 1v1, 2v2, 4v4, tutorial-level checks, and archetype matchup checks.
- Tutorial v3 reached a good-feeling stage after role swaps, role balance, and level-design iteration.
- The user explicitly said the current class numbers feel basically good enough and that future differences can partly come from equipment.

This means future agents should not casually modify the current role baseline stats. Treat them as an anchor unless a specific test proves a problem.

## Why We Started Attribute Growth

The next design target is character progression:

1. Characters level up and gain baseline stats.
2. Characters wear equipment.
3. Equipment should have large attributes and small attributes.
4. Large attributes should improve multiple small attributes, so builds do not become extreme.

The user emphasized one key advantage of a Dark and Darker-style large-stat system:

> If Strength only gives attack, players just stack attack. If Strength also gives health or shield-break side value, players start thinking about how to use that byproduct.

So the design focus became:

- byproducts,
- coupling,
- build-space,
- non-extreme growth,
- multiple meaningful point distributions per role.

## Reference Direction

The reference discussed was Dark and Darker / DaD-style attribute structure, not Docker containers.

What we extracted from that direction:

- Large attributes map to multiple derived stats.
- A stat point should usually create one main benefit and one or more side benefits.
- Side benefits prevent absurd characters such as 100 attack and 5 health.
- Coupling creates decisions: a player may choose a slightly weaker main output stat because its side benefit fits the team.
- The system should allow 1-3 meaningful build routes per class, not a single obvious best answer.

Reference doc:

- `projects/western_fantasy_continent/design/attribute_stat_system_reference.md`

## Documents Added Or Updated

### `attribute_growth_and_build_model.md`

Purpose:

- Explain why byproducts and coupling matter.
- Connect character progression to player-facing build pleasure.
- Define the design question: can a class have multiple meaningful point distributions?

Status:

- Concept document.
- Useful for design reasoning.
- Not a final numeric table.

### `attribute_growth_prototype_v1.md`

Purpose:

- Define seven large attributes.
- Define role primary/secondary attributes.
- Define expected build routes such as `10 main`, `7 main / 3 secondary`, and `5 / 5`.
- Record 5-level and 10-level growth targets.

Current seven attributes:

- Strength: physical pressure, some health, shield-break/armor-break side value.
- Vigor: survival, armor, received healing, frontline stability.
- Agility: frequency, movement, evasion, very low direct power.
- Technique: accuracy, mark, execution/crit stability, low direct power.
- Will: healing, shields, magic resistance, support durability.
- Arcana: skills, elemental/status output, cycle speed.
- Command: team buffs, aura/control value, team contribution over personal carry.

Status:

- Prototype document.
- Updated with test results.
- Explicitly warns that the values are not final implementation values.

### `attribute-growth-prototype-test-report.md`

Purpose:

- Record the actual test run.
- Compare 10 prototype attempts.
- Show why the best candidate is not simply the last attempt.

Current selected candidate:

- `attempt-8`

Reason:

- It had the fewest overall issues among the 10 attempts.
- It reached 9/10 growth pass and 8/10 route-diversity pass.
- Later attempts tried to fix specific issues but created more total problems.

### `analyze-attribute-growth-prototype.js`

Purpose:

- Independent test script for the prototype.
- Clones existing role units and applies temporary attribute bonuses.
- Does not modify formal role stats or combat assets.

It tests:

- 5-level main growth vs level-1 same class.
- 5-level mixed growth vs level-1 same class.
- 10-level main growth vs level-1 same class.
- 10-level main growth vs two level-1 same-class units.
- Route diversity across `main10`, `main7Sec3`, `split5`, `sec10`, `off10`.
- Team route tests on existing archetype presets.

## What The Prototype Found

The main result is directionally useful:

- Large attributes need side products.
- Pure output attributes make choices too obvious.
- Tank/support attributes need a way to express value in tests, otherwise they look weak.
- A temporary `stability` proxy was added to represent “standing long enough to exert pressure/protection.”
- Main/secondary mixed routes can work.

The best current prototype is `attempt-8`.

Its current candidate direction:

- Strength: moderate power, some HP, small armor, shield-break side value.
- Vigor: high HP, armor, received healing, stability.
- Agility: HP, tiny power, attack speed, movement, evasion.
- Technique: HP, small power, crit/accuracy/mark.
- Will: HP, armor, healing/shield/magic resistance/stability.
- Arcana: HP, power, skill haste, elemental/status value.
- Command: HP, armor, team buff/control value.

## Current Known Problems

The prototype is not complete.

Remaining issues from the current test report:

- Assassin 5-level main growth is weak in the proxy model.
- Berserker can still be misread as benefiting too much from off-build survival/stability.
- Warlock routes lean too much toward Vigor in the proxy model.

Important interpretation:

- These may not all be real balance problems.
- Some are likely caused by missing formal small-stat formulas.
- The current combat formula does not yet truly support attack speed, crit, mark scaling, healing strength, shield strength, magic resistance, DOT scaling, or sacrifice/self-damage scaling as full derived stats.

So do not fix these by directly buffing base class numbers. The next correct step is probably to define and simulate the missing derived-stat formulas.

## Guardrails For Future Agents

Do not:

- Do not change the existing role baseline stats just to make the attribute prototype pass.
- Do not directly implement `attempt-8` as formal game stats.
- Do not treat `power / hp / armor` proxy values as final small attributes.
- Do not solve assassin/warlock/berserker prototype issues by hardcoding tutorial enemies or role stat exceptions.

Do:

- Treat the current class balance as an anchor.
- Treat the attribute prototype as a design hypothesis.
- Keep testing before implementation.
- If formal small attributes are added, rerun the prototype tests.
- Preserve the distinction between formal combat data and temporary simulation proxy data.

## Suggested Next Work

1. User review of the attribute prototype documents and report.
2. Decide whether the seven large attributes are directionally right.
3. Define formal small stats and formulas:
   - attack speed,
   - crit rate / crit payoff,
   - mark scaling,
   - healing strength,
   - shield strength,
   - magic resistance,
   - DOT/status scaling,
   - sacrifice/self-damage scaling,
   - team buff scaling.
4. Update the prototype script to use those real formulas instead of proxy `power / hp / armor`.
5. Rerun the same 5-level, 10-level, route-diversity, and team-route tests.
6. Only after that, design equipment slot stat pools.

## Files To Read First

- `projects/western_fantasy_continent/design/attribute_stat_system_reference.md`
- `projects/western_fantasy_continent/design/attribute_growth_and_build_model.md`
- `projects/western_fantasy_continent/design/attribute_growth_prototype_v1.md`
- `projects/western_fantasy_continent/design/attribute-growth-prototype-test-report.md`
- `projects/western_fantasy_continent/game_data/analyze-attribute-growth-prototype.js`

## Summary

We have a stable-ish combat baseline and a promising attribute-growth prototype.

The prototype has already been tested for 10 rounds, and `attempt-8` is the current best candidate. However, it is still a hypothesis, not an implementation plan. The next stage is to formalize derived small stats and rerun the same validation framework before touching production combat progression.
