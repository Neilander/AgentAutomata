# Auto-Battler Stat Design

This combat system is built around reusable units, equipment, relics, and event-driven modifiers.

## Core Goals

1. A unit has base stats from class, level, gear, and relics.
2. Damage is not a single number. Attacks create damage packets that can contain multiple damage types.
3. Equipment provides mostly numeric growth.
4. Relics provide mechanisms that react to combat events.
5. A unit can equip up to 6 relics.

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

