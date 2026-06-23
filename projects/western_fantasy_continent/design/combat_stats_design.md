# Auto-Battler Stat Design

This combat system is built around reusable units, equipment, relics, and event-driven modifiers.

## Core Goals

1. A unit has base stats from class, level, gear, and relics.
2. Damage is not a single number. Attacks create damage packets that can contain multiple damage types.
3. Equipment provides mostly numeric growth.
4. Relics provide mechanisms that react to combat events.
5. A unit can equip up to 6 relics.

## Build Design Checklist

Every class or team archetype must declare its damage profile before skills are written.

- Primary output source: basic attack, skill direct damage, DOT, summon, counterattack, execute, or burst window.
- Preferred buffs: attack speed, skill cooldown, final damage, DOT duration, crit, shield, healing, control, or enemy debuff.
- Non-preferred buffs: buffs that should provide weak value for this archetype.
- Payoff condition: what the player should notice when the archetype is working.

Before accepting a skill kit, run a positioning overlap check:

- Two skills may share a theme, but they should not create the same player-facing effect unless one is setup and the other is payoff.
- A support buff must affect the carry's primary output source. If a carry deals mostly basic-attack damage, attack-speed buffs should be strong. If a carry deals mostly DOT damage, attack speed should be secondary.
- The simulator should report output attribution: basic attack, skill direct damage, DOT, and burst-window damage.

Example: Berserker should be a basic-attack carry. Its skills create short windows that empower basic attacks, so Bard haste has visible value. A Berserker kit made of independent skill hits fails this checklist because attack speed cannot amplify the class fantasy.

## Base Stats

- `hp`: maximum health
- `attack`: physical attack power
- `defense`: physical mitigation
- `magicPower`: magical scaling power
- `magicResist`: magical mitigation
- `attackSpeed`: attacks per second multiplier
- `critChance`: chance to critically strike
- `critDamage`: critical damage multiplier
- `moveSpeed`: battlefield movement speed
- `accuracy`: hit chance support stat
- `evasion`: dodge support stat

## Damage Types

- `physical`
- `fire`
- `poison`
- `lightning`
- `ice`
- `holy`
- `shadow`
- `arcane`

## Specialized Stats

Specialized stats are additive unless noted otherwise.

- `physicalDamageAmp`
- `fireDamage`
- `fireDamageAmp`
- `fireDurationAmp`
- `poisonDamage`
- `poisonDamageAmp`
- `poisonDurationAmp`
- `lightningDamage`
- `lightningDamageAmp`
- `lightningChainChance`
- `iceDamage`
- `iceDamageAmp`
- `iceSlowAmp`
- `holyDamageAmp`
- `shadowDamageAmp`
- `arcaneDamageAmp`
- `dotDamageAmp`
- `areaDamageAmp`
- `singleTargetDamageAmp`

## Combat Event Model

Combat should emit events so relics can react without being hard-coded into attack logic.

- `onBattleStart`
- `onAttackStart`
- `onHit`
- `onCrit`
- `onDamageType`
- `onApplyDot`
- `onKill`
- `onShieldBreak`
- `onHealthBelow`
- `onEverySeconds`

## Damage Packet

```json
{
  "sourceId": "unit_1",
  "targetId": "unit_2",
  "tags": ["attack", "singleTarget"],
  "entries": [
    { "type": "physical", "amount": 30 },
    { "type": "fire", "amount": 8, "duration": 3 }
  ],
  "canCrit": true,
  "isArea": false
}
```

## Relic Limit

Each unit can carry at most 6 relics. Relic effects should be small, composable, and event-driven.
