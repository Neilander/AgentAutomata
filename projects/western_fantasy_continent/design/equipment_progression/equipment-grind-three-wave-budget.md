# Equipment Grind Three-Wave Budget

Generated: 2026-07-02

## Goal

Tune equipment dungeon drops toward the project's preferred progression aesthetic:

```text
early lift -> bottleneck -> breakthrough -> plateau -> second breakthrough -> long tail
```

The target is not maximum final score. The target is a visible three-wave growth curve.

## Budget Attempts

### Attempt 1: Add 9-stage dungeon ladder and harden early pressure

Change:

- Expanded the progression ladder from 8 to 9 dungeon tiers.
- Lowered early item level ranges.
- Raised early and mid dungeon pressure.
- Added a final `无月王冠` tier.

Result, fast 24-sample run:

- End average: `0.311`
- End delta: `+0.273`
- All teams stuck at D4 after T5.

Decision:

- Rejected. This made the curve too flat and prevented the second wave.

### Attempt 2: Open the D5-D9 path

Change:

- Relaxed D5-D9 challenge pressure.
- Slightly raised D4-D9 item level ranges.
- Kept rarity ecology intact.

Result, fast 24-sample run:

- End average: `0.725`
- End delta: `+0.687`
- Shape: clear early lift, plateau, and strong T9-T12 second wave.
- Third wave existed but was small.

Decision:

- Partially accepted. Good baseline, but needed a clearer late wave.

### Attempt 3: Lightly soften late-stage thresholds

Change:

- Slightly softened D6-D9 pressure bands.
- Did not add artificial run-count gates.
- Did not make early high rarities common.

Result, fast 24-sample run:

- End average: `0.915`
- End delta: `+0.877`
- Shape: clear three-wave curve.

Decision:

- Accepted for full validation.

## Final Full Validation

Default 48-sample run:

- End average: `0.918`
- End delta: `+0.866`
- End best average: `0.984`
- End worst average: `0.839`

Aggregate curve:

| Tick | Avg | Delta From Previous Mark | Interpretation |
| ---: | ---: | ---: | --- |
| 0 | 0.051 | - | naked / baseline |
| 1 | 0.137 | +0.086 | wave 1: early slot-fill lift |
| 2 | 0.171 | +0.034 | bottleneck begins |
| 3 | 0.178 | +0.007 | bottleneck |
| 4 | 0.189 | +0.010 | bottleneck |
| 5 | 0.229 | +0.041 | pre-wave replacement |
| 6 | 0.278 | +0.048 | second wave starts |
| 9 | 0.478 | +0.201 | wave 2 breakthrough |
| 12 | 0.709 | +0.231 | wave 2 peak |
| 15 | 0.810 | +0.101 | wave 3 starts |
| 18 | 0.849 | +0.039 | wave 3 continuation |
| 21 | 0.884 | +0.035 | wave 3 tail |
| 24 | 0.918 | +0.034 | long tail |

Dungeon distribution confirms phase structure:

| Tick | Dungeon Distribution |
| ---: | --- |
| 0 | D1:24 |
| 1 | D1:12, D2:12 |
| 4 | D3:3, D4:9, D5:12 |
| 6 | D5:23, D6:1 |
| 9 | D5:12, D6:9, D8:3 |
| 12 | D6:17, D7:2, D8:2, D9:3 |
| 15 | D6:15, D7:1, D9:8 |
| 21 | D6:9, D7:1, D8:1, D9:13 |
| 24 | D6:7, D7:1, D8:2, D9:14 |

## Final Read

The current curve has the desired structure:

- **Wave 1:** T0-T1, early equipment fill.
- **Bottleneck 1:** T2-T4, visible slowdown while better drops accumulate.
- **Wave 2:** T6-T12, D5/D6 replacement and breakthrough into high-tier drops.
- **Bottleneck 2 / transition:** around T12-T15, some teams are ahead while others remain in D6.
- **Wave 3:** T15-T21, more teams reach D9 and high mythic/legendary ecology.
- **Long tail:** T21-T24, still improving but slower.

## Files

- `projects/western_fantasy_continent/game_data/simulate-current-equipment-grind-super.js`
- `projects/western_fantasy_continent/design/equipment_progression/current-equipment-grind-super-8runs.md`
- `projects/western_fantasy_continent/design/equipment_progression/current-equipment-grind-super-8runs.json`
- `projects/western_fantasy_continent/design/equipment_progression/equipment-grind-growth-curve.svg`

## Next Tuning Lever

If this is too generous, reduce D9 mythic chance or raise D9 pressure slightly.

If this is too harsh for weaker teams, soften D6 pressure or add more D6 sidegrade value.

Do not add artificial "farm N times before challenge" gates.
