# Improvement Perception Granularity

Use this reference when a decision, equipment change, roster change, build change, or progression event produces a measurable relative improvement and the player model must decide what the player actually notices.

## Core Rule

Players perceive improvement in bands, not exact percentages.

```text
raw improvement
-> cap at 150%
-> map through the current player profile's bands
-> return a shared semantic intensity
-> compare perceived actual improvement with perceived expected improvement
```

Keep the uncapped raw value in audit evidence. Use the capped value only for player perception.

```text
perceived_input = clamp(raw_improvement, 0%, 150%)
```

Do not make experienced players detect smaller ordinary improvements by default. Their extra resolution begins in the high-growth range because they can distinguish levels that an ordinary player groups together.

## Shared Semantic Scale

All profiles use the same semantic levels. A profile may skip levels, but a shared label must retain the same intensity.

| Level | Meaning |
| ---: | --- |
| 0 | no noticeable difference |
| 1 | a little |
| 2 | a fair amount |
| 3 | clearly stronger |
| 4 | much stronger |
| 5 | a lot stronger |
| 6 | very much stronger |
| 7 | explosive improvement |
| 8 | absurd improvement |
| 9 | qualitative transformation |

For A, use the shared global scale rather than normalizing by each profile's own number of bands.

```text
perceived_intensity = semantic_level / 9
perceived_mismatch = actual_perceived_intensity - expected_perceived_intensity
```

This preserves the meaning of a label across profiles. It also lets ordinary players make coarse jumps while familiar and expert players distinguish high-end improvements.

## Ordinary Player

| Objective improvement | Semantic level | Player perception |
| ---: | ---: | --- |
| `<25%` | 0 | no noticeable difference |
| `25%-45%` | 1 | a little |
| `45%-70%` | 2 | a fair amount |
| `70%-110%` | 4 | much stronger |
| `110%-150%` | 7 | explosive improvement |

The ordinary player saturates early and skips intermediate high-end distinctions.

## Familiar Player

Use the ordinary-player resolution below 80%. Split the range above 80%.

| Objective improvement | Semantic level | Player perception |
| ---: | ---: | --- |
| `<25%` | 0 | no noticeable difference |
| `25%-45%` | 1 | a little |
| `45%-70%` | 2 | a fair amount |
| `70%-80%` | 4 | much stronger |
| `80%-100%` | 5 | a lot stronger |
| `100%-120%` | 6 | very much stronger |
| `120%-135%` | 7 | explosive improvement |
| `135%-150%` | 9 | qualitative transformation |

## Expert Player

Use the common low-growth resolution below 60%. Split the range above 60%.

| Objective improvement | Semantic level | Player perception |
| ---: | ---: | --- |
| `<25%` | 0 | no noticeable difference |
| `25%-45%` | 1 | a little |
| `45%-60%` | 2 | a fair amount |
| `60%-75%` | 3 | clearly stronger |
| `75%-90%` | 4 | much stronger |
| `90%-105%` | 5 | a lot stronger |
| `105%-120%` | 6 | very much stronger |
| `120%-135%` | 7 | explosive improvement |
| `135%-145%` | 8 | absurd improvement |
| `145%-150%` | 9 | qualitative transformation |

## Expectation Settlement

Quantize expected and actual improvement independently with the same persistent player profile.

```text
expected_band = perceive(expected_improvement, profile)
actual_band = perceive(actual_improvement, profile)
A_input = actual_band.intensity - expected_band.intensity
```

If two objective results land in the same band, the player cannot reliably distinguish them and A should not create precision disappointment.

Example for an ordinary player:

```text
expected improvement = 80% -> level 4
actual improvement = 39% -> level 1
A_input = 1/9 - 4/9 = -3/9
```

Example for an expert player:

```text
expected improvement = 80% -> level 4
actual improvement = 65% -> level 3
A_input = 3/9 - 4/9 = -1/9
```

## Combat Performance Input

The current executable combat result uses continuous performance:

```text
combat_score = average_player_remaining_hp - average_enemy_remaining_hp
combat_progress = (combat_score + 1) / 2
```

When comparing a decision with its prior combat baseline:

```text
relative_improvement
= (new_combat_progress - baseline_combat_progress)
  / max(baseline_combat_progress, denominator_floor)
```

`denominator_floor` is a calibration parameter that prevents a near-zero baseline from producing unbounded percentages. Do not change it during an A/B gameplay comparison. Cap the resulting perception input at 150%.

## Guardrails

- Do not feed raw precise percentages directly into A after perceptual quantization exists.
- Do not normalize by each profile's maximum available level.
- Do not give experts extra low-end sensitivity unless a separate tested profile trait explicitly requires it.
- Do not let the Agent choose emotional intensity. Code maps objective improvement through the profile table.
- Do not use hidden simulator outcomes to form player expectation. Prediction must come from player knowledge, priors, and visible evidence.
- Keep negative deterioration bands separate until they are explicitly designed; do not assume positive labels mirror perfectly.
