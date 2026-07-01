# Equipment Balance Comparative Diagnosis

Date: 2026-07-01

## Core Question

Are the equipment bonuses from the current static-best equipment variant healthy combat growth, or are they creating abnormal matchup flips?

Design intent:

- Equipment should create visible improvement.
- Equipment should not turn a weak/medium preset into a near-universal winner.
- Equipment tuning must not modify role base stats, skills, combat engine, or waterline teams.

Observed gap:

- Static evaluation selected `v4_extreme_guard` as best.
- Combat validation showed several archetypes gaining more than 25 percentage points of win rate.

Decision needed:

- Decide whether this is a real problem.
- If yes, identify whether the cause is static scoring, combat proxy mapping, or specific archetype thresholds.

## Evidence Table

| Case | Change | Result | Key signal | Immediate interpretation | Confidence |
| --- | --- | --- | --- | --- | --- |
| Static equipment pass | v4 selected by static score | `overall=0.778`, best variant | fantasy `0.954`, formation `0.958`, diversity `0.523` | Static loot quality is good | High |
| Original combat pass | Apply v4 best builds through proxy combat bonus | avg win delta `+40.7%`, no regressions | 4 archetypes flagged as large jumps | Combat impact too high | High |
| First clamp pass | Remove hard minimums and cap broad bonuses | avg win delta `+30.3%`, no regressions | holy/assassin/knight still risk | Broad proxy was part of the issue, but not all | High |
| Second clamp pass | Further reduce holy/assassin/knight bonuses | avg win delta `+26.1%`, no regressions | holy becomes acceptable; assassin/knight still risk | Some archetypes are threshold-sensitive | High |
| Third clamp pass | More reduction to assassin/knight | avg win delta still `+26.1%` | assassin still flips 6, knight still flips 5 | Further small stat cuts do not smoothly reduce flips | Medium |

## Separate Models

### Static Score Model

Value formula:

```text
staticScore = diversity * 0.24 + fantasy * 0.34 + (1 - extremeRisk) * 0.22 + formation * 0.20
```

Variables changed:

- Rarity weights
- slot weights
- risky affix penalties
- fixed base stat multiplier

Variables held constant:

- role stats
- skills
- combat engine
- waterline teams

Conclusion candidates:

- C1: v4 is good at producing recognizable, timely, non-perfect loot.
- C2: static score is blind to combat matchup flips.

Falsifier:

- If the combat pass had small win deltas, static score alone would be enough for this stage.

### Combat Proxy Model

Value formula:

```text
combatValue = survivalWindow * contributionPerSecond
contributionPerSecond ~= power + tempo + effect multipliers
```

Variables changed:

- Equipment bonus mapped to HP, power, armor, attack speed, skill haste, effect power, received healing.

Variables held constant:

- same preset team
- same opponent pool
- same seeds

Conclusion candidates:

- C1: original equipment mapping gave too many broad combat stats at once.
- C2: hard minimums such as forced physical power/attack speed created over-buffed archetypes.
- C3: for assassin and iron knight, matchup flips are threshold-like rather than smooth.

Falsifier:

- If reducing broad stats had no effect on any archetype, proxy mapping would not be the cause.

## Conclusion Ledger

### Static loot system is not the main failure

Supported by:

- v4 has the best static score.
- v4 has high fantasy and formation scores.

Contradicted by:

- Static score does not predict combat jump size.

Explains:

- Why the loot looks structurally good.

Fails to explain:

- Why some teams jump from weak to dominant.

Confidence after comparison: high.

### Combat proxy mapping was too strong

Supported by:

- Removing forced minimums reduced avg win delta from `+40.7%` to `+30.3%`.
- Further clamping reduced it to `+26.1%`.
- Holy sustain moved from risk to acceptable.

Contradicted by:

- Assassin and iron knight remained risky after smaller clamps.

Explains:

- Broad original over-buff.

Fails to explain:

- Threshold flips that persist after small reductions.

Confidence after comparison: high.

### Assassin and iron knight are threshold-sensitive

Supported by:

- Assassin stayed at `+37.5%` after being reduced to HP +10, physical +16, attack speed x1.05.
- Iron knight stayed at `+31.3%` after being reduced to HP +50, armor +12, physical +6.

Contradicted by:

- More seeds may show different exact flip count.

Explains:

- Why small stat reductions do not smoothly lower win rate.

Fails to explain:

- Whether the threshold is target selection, first kill timing, shield/armor breakpoint, or preset matchup composition.

Confidence after comparison: medium-high.

## Precise Diagnosis

Primary cause:

- Equipment combat proxy was translating many affixes into universal combat stats, then archetype normalization added hard floors/caps that made several builds too broadly strong.

Secondary cause:

- Static equipment scoring does not include a combat-waterline penalty, so it can select a loot rule that is structurally good but combat-overpowered.

Still unresolved:

- Shadow assassin and iron knight have threshold-sensitive flips. They need matchup-level signal inspection, not only smaller bonus numbers.

Not the cause:

- The role base stats and skills are not proven to be the problem in this test, because the same base teams were used before and after equipment.

## Changes Applied

Only `equipment-combat-validation.js` was changed.

The changes:

- Removed forced minimum combat floors for low-health berserker and shadow assassin.
- Reduced broad bonus caps for low-health berserker, shadow assassin, iron knight, and holy sustain.
- Kept fire mage and poison bloom unchanged because their win-rate increase was below the risk threshold.

Current result:

```text
avg base win rate: 42.8%
avg equipped win rate: 68.8%
avg delta: +26.1%
regressions: 0
```

Remaining risk rows:

- shadow assassin: `18.8% -> 56.3%`, delta `+37.5%`
- iron knight: `12.5% -> 43.8%`, delta `+31.3%`

## Recommended Next Lever

Do not keep blindly lowering all equipment stats.

Next lever:

1. Add matchup-level signal output for equipment validation:
   - first death time
   - first kill time
   - target killed first
   - damage share by basic / skill / status / counter / execute
   - shield and healing contribution

2. For shadow assassin:
   - check whether equipment moves first kill before the enemy can respond.
   - if yes, reduce execute/first-kill channel rather than generic power.

3. For iron knight:
   - check whether equipment pushes armor + HP over a survival breakpoint.
   - if yes, reduce the defense-to-counter conversion, not all tank gear.

4. Add combat penalty into equipment variant selection:

```text
finalEquipmentRuleScore = staticScore - largeJumpPenalty - regressionPenalty
```

Suggested temporary thresholds:

- desired win-rate delta: `+10%` to `+25%`
- review: `+25%` to `+35%`
- fail: above `+35%` or any regression

Stop condition:

- no regressions
- average win-rate delta between `+15%` and `+25%`
- no single archetype above `+35%`
- at most one archetype in review band

