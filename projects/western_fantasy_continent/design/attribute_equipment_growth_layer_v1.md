# Attribute And Equipment Growth Layer v1

This document records the current integration rule for character growth, attribute points, and equipment.

## Boundary

Do not reverse-map current role base stats into attributes.

The current role base stats are the combat anchor. A level 1 warrior, mage, assassin, etc. keeps its existing base HP, power, armor, range, and skills.

Growth is layered on top:

```text
role/class base stats
+ attribute point modifiers
+ equipment base stat modifiers
+ equipment affix modifiers
= final combat unit
```

## Attribute Point Rule

Attribute points are not combat stats.

They must pass through a function:

```text
attribute points -> attributePointYield(points) -> combat modifiers
```

Current implementation:

```text
yield = points * (1 + log(1 + points) * 0.018)
```

This is intentionally close to linear for the current 10-point prototype, but it is still a real conversion layer. Later we can tune the curve for long-term growth without rewriting every skill, equipment item, or test script.

## Current Major Attributes

| Attribute | Main Gain | Byproduct | Design Intent |
| --- | --- | --- | --- |
| Might | Physical power | Small HP | Physical roles gain damage without becoming glass extremes. |
| Fortitude | HP | Received healing | Durable roles gain a sustain hook, but no lifesteal multiplier. |
| Agility | Attack speed | Small effect resistance | Basic-attack and timing roles gain tempo. |
| Arcana | Magic power | Small skill haste | Spell roles gain scaling and a little cast frequency. |
| Rhythm | Skill haste | Effect power | Skill-cycle and control/DOT roles gain tempo plus mechanic payoff. |
| Resilience | Armor | Effect resistance | Defensive roles gain anti-burst and anti-effect coverage. |

## Equipment Rule

Equipment has two layers:

1. Base stats from item type and slot.
2. Affix modifiers from rarity/archetype rolls.

Both are converted into the same modifier bundle used by attribute points:

```text
equipment item -> base stats + affixes -> modifier bundle -> final combat unit
```

Major attribute affixes add attribute yield, not raw attribute points. This keeps equipment budget separate from level-up point budget.

## Why This Shape

This preserves the good combat baseline while letting growth systems evolve independently.

It also prevents direct one-to-one thinking such as "10 points equals 10 attack". Instead, every growth source is explicitly a budget that passes through a conversion function.

## Current Code Entry Points

- `game_data/build-layers.js`
  - `attributePointYield`
  - `buildAttributeModifierBundle`
  - `buildEquipmentModifierBundle`
  - `applyBuildLayers`

- `game_data/analyze-attribute-build-routes-v2.js`
  - now uses the shared attribute modifier bundle for point testing.

- `game_data/equipment-combat-validation.js`
  - now applies equipment through the shared build layer instead of manually mutating unit stats.

## Next Validation

1. Re-run attribute route tests and compare whether major routes still match intuition.
2. Feed real equipment items through `buildEquipmentModifierBundle`, not only the old proxy bonus.
3. Add report columns for:
   - base contribution
   - attribute contribution
   - equipment base contribution
   - affix contribution
4. Only after those pass, connect this layer to a player-facing equipment UI.

