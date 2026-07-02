# Weapon Slots And Archetype Affix Audit

- Date: 2026-07-02
- Scope: `equipment_grind_simulator/equipment-grind-simulator.js`
- Status: audit only, no implementation change

## Summary

The current equipment grind simulator has an 8-slot equipment model:

```text
weapon, helm, chest, gloves, legs, boots, ring, charm
```

There is **not yet a left-hand / right-hand weapon system**. The current `weapon` slot is a single weapon slot. The character modal displays equipment in left and right columns, but that is only visual layout:

```text
left column: weapon, helm, chest, gloves
right column: legs, boots, ring, charm
```

This means the requested dual-hand weapon model is still missing.

## Current Weapon Slot

Current `weapon` base options are mutually exclusive:

```text
physical weapon: physicalPower + attackSpeed
magic weapon: magicPower + skillHaste
```

Current weapon affix pool:

```text
might, agility, arcana,
physicalPower, magicPower, attackSpeed,
critChance, critDamage, lifeSteal,
shieldBreak, armorBreak,
fireAmp, poisonAmp, shadowAmp, arcaneAmp,
executeDamage, lowHpDamage, markPower
```

This is a reasonable single-weapon prototype, but it cannot yet support:

- main-hand / off-hand distinction;
- dual-wield versus shield/focus/book;
- two-handed weapon tradeoffs;
- left/right hand visual and build identity;
- role-specific weapon restrictions.

## Recommendation For Weapon System

Suggested next model:

```text
mainHand
offHand
helm
chest
gloves
legs
boots
ring
charm
```

Optional later expansion:

```text
ring1, ring2
trinket/charm
```

Recommended weapon rules:

- `mainHand`: primary damage identity. Swords, axes, daggers, bows, staves, wands.
- `offHand`: secondary build identity. Shield, dagger, focus, tome, buckler, relic.
- `twoHanded`: occupies both `mainHand` and `offHand`.
- `dualWield`: requires compatible one-handed weapons and should favor attack speed/on-hit/crit.
- `shieldOffhand`: favors defense, counter, guard, healing received.
- `focusOffhand`: favors magic power, skill haste, effect power.

This should be implemented before serious equipment balance, because weapon slots strongly affect build direction and loot fantasy.

## Archetype Affix Coverage

There are currently 12 archetype affixes.

New hard rule from user review:

```text
Every normal archetype affix must have at least two real user roles.
```

That means "can appear on several equipment slots" is not enough. The affix must connect to mechanics or build goals that at least two professions can actually use. If an affix is useful for only one profession, it should either be redesigned, moved out of the normal affix pool, or treated as a special class-exclusive item line instead of a common loot affix.

The corrected table below separates:

```text
slot coverage = how many equipment slots can roll it
real roles = professions that can actually use the mechanic/build goal
valid normal affix = real roles >= 2
```

| Affix | Meaning | Slots | Real Roles | Valid Normal Affix | Direct Build-Layer Hook |
|---|---|---:|---|---:|---:|
| `fireAmp` | fire damage/burn/explosion line | 4 | mage only right now | no | yes |
| `poisonAmp` | poison/DOT/status damage line | 4 | warlock, alchemist, assassin | yes | yes |
| `markPower` | marked-target follow-up line | 4 | ranger, assassin | yes | yes |
| `stealthDuration` | stealth/hidden-window line | 3 | assassin only right now | no | yes |
| `executeDamage` | low-HP finisher line | 3 | assassin, ranger, warrior | yes | yes |
| `lowHpDamage` | self low-HP damage line | 3 | berserker only right now | no | yes |
| `lowHpHealingReceived` | self low-HP recovery/sustain line | 3 | berserker, knight, warrior | yes | yes |
| `counterDamage` | retaliation/frontline punish line | 4 | knight, warrior | yes | yes |
| `cleanseEfficiency` | cleanse/debuff answer line | 4 | priest, bard, alchemist | yes | yes |
| `auraPower` | team aura/support field line | 4 | bard only right now | no | yes |
| `shadowAmp` | shadow/backline burst line | 3 | assassin, warlock | yes | no |
| `arcaneAmp` | arcane/general magic line | 3 | mage, warlock, alchemist, priest, bard | yes | no |

Current result:

- Valid normal archetype affixes: 8/12
- Invalid under the new rule: 4/12
- Invalid affixes: `fireAmp`, `stealthDuration`, `lowHpDamage`, `auraPower`

## Observations

### Broad But Weakly Specific

`arcaneAmp` has the highest scenario count at 15 because it is valued by many magic-side roles. However, it currently has no direct build-layer side effect. That makes it broad in scoring but potentially weak in real combat feel.

### Under-Covered Affixes

The following affixes violate the new "at least two real roles" rule:

- `fireAmp`: currently mage-only in practice. Fix by giving alchemist or warlock a real fire/burn branch, or rename it into a broader elemental/burning affix that more roles consume.
- `stealthDuration`: currently assassin-only. Fix by giving ranger a camouflage/ambush branch or warlock a shadow-cloak branch, or remove it from normal loot and make it assassin-exclusive.
- `lowHpDamage`: currently berserker-only. Fix by giving warrior or warlock a low-HP/last-stand damage branch, or merge it with `lowHpHealingReceived` into a broader "low-HP power" affix.
- `auraPower`: currently bard-only. Fix by giving knight, priest, or alchemist real aura/field skills, or remove it from normal loot and make it bard-exclusive.

The key design lesson: a narrow identity is fine for skills, but normal loot affixes should not be single-class dead rolls.

### Good Multi-Role Affixes

`poisonAmp`, `markPower`, `executeDamage`, `lowHpHealingReceived`, `counterDamage`, and `cleanseEfficiency` are healthier because they map to multiple roles or multiple team patterns.

### Missing Combat Consumption

`shadowAmp` and `arcaneAmp` are currently the clearest red flags:

- They appear in pools.
- They are scored for relevant roles.
- They enter `mechanicModifiers`.
- But `build-layers.js` does not give them direct generic side effects like effect power, physical power, or attack speed.

They may still be available for future skill-specific consumption, but right now their practical combat impact is likely weaker than the UI implies.

## Recommended Next Steps

1. Add `mainHand` and `offHand` before deeper weapon balance.
2. Decide whether to support `twoHanded` items now or later.
3. Move current `weapon` pool into `mainHand`.
4. Create separate off-hand pools:
   - shield/counter/sustain;
   - focus/arcana/effect;
   - dagger/crit/execute/stealth.
5. Redesign under-covered affixes so each normal archetype affix has at least two real roles:
   - `fireAmp`;
   - `stealthDuration`;
   - `lowHpDamage`;
   - `auraPower`.
6. Add direct build-layer side effects or skill hooks for:
   - `shadowAmp`;
   - `arcaneAmp`.
7. After weapon slots and affix coverage are corrected, rerun fixed-team dungeon calibration.
