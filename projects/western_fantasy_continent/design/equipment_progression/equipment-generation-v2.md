# Equipment Generation V2

Date: 2026-07-02

## Goal

Move equipment generation from the old `tier * rarity multiplier` model to:

```text
equipment strength = level-based base stats + rarity-based affix point lines
```

This matches the current design direction:

- Equipment level provides direct base stats.
- Rarity provides affix count and build richness.
- Each affix line is a small point value.
- Mechanic affix points are converted through the global curve asset.

## Tier To Level

The current simulator still has 5 dungeon reward tiers. They now map to equipment levels:

| Tier | Equipment level |
| ---: | ---: |
| 1 | 20 |
| 2 | 40 |
| 3 | 60 |
| 4 | 100 |
| 5 | 150 |

## Rarity Affix Count

| Rarity | Affix lines |
| --- | ---: |
| Common | 1 |
| Rare | 2 |
| Epic | 4 |
| Legendary | 7 |
| Mythic | 12 |

Rarity no longer makes each individual affix massively larger. It mainly gives more affix lines.

## Base Stat Formula

Base stats are level driven and can still roll a small variance.

Approximate center values:

| Stat | Formula | Lv.60 | Lv.100 | Lv.150 |
| --- | ---: | ---: | ---: | ---: |
| Physical / magic power | `level * 0.5` | 30 | 50 | 75 |
| HP | `level * 2.8` | 168 | 280 | 420 |
| Armor | `level * 0.08` | 4.8 | 8 | 12 |

Equipment base stats should not produce direct percentage stats. Attack speed, skill haste, effect power, effect resist, and received healing are affix point concepts, not base equipment stat concepts.

Current base stat sources:

| Slot | Base stat source |
| --- | --- |
| Weapon | Physical power or magic power |
| Helm | HP and armor |
| Chest | HP and armor |
| Gloves | Physical power and armor |
| Legs | HP and armor |
| Boots | HP and armor |
| Ring | Physical power or magic power |
| Charm | HP or magic power |

## Affix Line Formula

Direct small stats that are already covered by major attributes are blocked from affix pools:

- `physicalPower`
- `magicPower`
- `maxHp`
- `armor`
- `attackSpeed`
- `skillHaste`

Direct percentage-style stats should also not be generated as base stats. If they appear, they should appear as affix points and pass through `mechanic-curves.js`.

Examples:

- Might is allowed because it gives physical power plus a side product.
- Direct physical power is blocked because Might already covers it.
- Agility is allowed because it gives attack speed plus a side product.
- Direct attack speed is blocked because Agility already covers it.

Approximate single-line affix values:

| Category | Formula | Lv.60 | Lv.100 | Lv.150 |
| --- | ---: | ---: | ---: | ---: |
| Major attributes | `1.1 + level / 45` | 2-3 | 3-4 | 4-5 |
| Curved mechanic points | `2.5 + level / 7.5` | 10-11 | 15-16 | 22-23 |
| Other small point stats | `2 + level / 9` | 8-9 | 13 | 18-19 |

Mechanic point stats use:

- `game_data/mechanic-curves.js`

## Validation Snapshot

The super-waterline equipment grind simulation was rerun after this change.

Result:

- Runs: 8
- Waterline sample: 48
- Ticks: 24
- Average end average: 0.125
- Average delta: 0.099
- Average end best: 0.125
- Average end worst: 0.125

Interpretation:

- Equipment is now clearly stronger than the previous formula.
- The current super-waterline score sample saturates at 0.125, so it is no longer detailed enough to distinguish post-equipment team differences.

## Open Questions

- Mythic items with 12 visible affix rows may be too visually noisy. UI may need grouping or compact summaries.
- The simulation score has hit a plateau. A graded strong waterline or more granular scoring metric is needed for later tuning.
- This is a generation formula pass, not final balance.
