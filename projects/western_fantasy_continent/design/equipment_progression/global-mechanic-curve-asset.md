# Global Mechanic Curve Asset

Date: 2026-07-02

## Purpose

Equipment affixes such as life steal, fire amp, DOT amp, control power, and shield break should be stored as points, not direct percentages.

The global asset is:

- `game_data/mechanic-curves.js`

It converts points into real combat value through a diminishing curve:

```text
real_value = cap * points / (points + half)
```

This prevents a stat such as `lifeSteal +100` from becoming 100% life steal, while still making stacked points feel valuable.

## Current Rule

- Item text may show: `lifeSteal +10`
- Combat layer reads this as: 10 life-steal points
- Curve converts it into the real effect
- Build layer keeps both:
  - raw points in `mechanicModifiers`
  - converted value in `buildLayers.debug.curvedMechanics`

## Sample Curves

| Stat | 1 point | 5 points | 10 points | 20 points | 40 points | 80 points |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Life steal | 0.43% | 2.06% | 3.89% | 7.00% | 11.67% | 17.50% |
| Fire amp | 1.32% | 6.32% | 12.00% | 21.82% | 36.92% | 56.47% |
| Attack speed | 1.06% | 5.00% | 9.38% | 16.67% | 27.27% | 40.00% |
| Skill haste | 1.06% | 5.00% | 9.38% | 16.67% | 27.27% | 40.00% |
| Effect resist | 0.62% | 2.94% | 5.56% | 10.00% | 16.67% | 25.00% |

## Design Contract

1. Equipment generation should roll affix points.
2. UI should display affix points first, optionally show converted value in details.
3. Combat and auto-equip evaluation should use the same curve asset.
4. Curves are global assets. Do not duplicate one-off conversions in UI, simulations, or skill scripts.
5. If a new affix is added, add its conversion rule here before using it in equipment.

## Current Integration

- `build-layers.js` now calls `mechanic-curves.js` for curved affix stats.
- Equipment grind pages load `mechanic-curves.js` before `build-layers.js`.
- `equipment-grind-simulator.js` uses the same curve asset for item scoring.
- `simulate-current-equipment-grind-super.js` uses the same curve asset for auto-equip scoring.

## Open Balance Question

The curve asset is infrastructure, not final tuning. The next equipment formula pass still needs to decide:

- How much base stat each equipment level provides.
- How many affix point slots each rarity provides.
- Whether high rarity should provide many small affix lines, grouped affix bundles, or visible compact summaries.
