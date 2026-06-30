# Agent Handoff: Shadow Assassin Clean No-Attribute Baseline

- Date: 2026-06-29
- Agent/thread: Codex desktop
- Scope: Shadow assassin baseline validation without attribute routes
- Status: partial

## User Intent

The user clarified the correct order: first test the no-attribute base strength with matrix and waterline. Attribute-route testing comes later only if the base version has enough strength.

## Completed

- Stopped using attribute-route results as evidence for base strength.
- Ran a no-attribute matrix-style check against all current fixed presets.
- Ran a no-attribute 500-team waterline check.
- Tested three variants using the existing `shadowExecute` shell:
  - `old`: unchanged current preset.
  - `one`: replace one assassin with `shadowBurstAmbush / throatCut / shadowMomentum / midnightBloom`.
  - `two`: replace both assassins with that shadow kit.
- Updated task board evidence for `shadow-assassin-survival-tuning`.

## Validation Results

No `unitSpec()`, no 10-point route build, no attribute injection.

### No-Attribute Matrix

Each cell used 15 seeds per side, 30 games total.

| Variant | Average vs fixed presets | Interpretation |
| --- | ---: | --- |
| `old` | 25% | Existing shadowExecute shell baseline. |
| `one` | 21% | Replacing one assassin is weaker than old. |
| `two` | 64% | Two shadow assassins creates extreme matchup spikes; not a stable single-character validation. |

Important `two` spike examples:

- 100% into `bulwarkMarks`, `duelChampion`, `frostControl`, `holySustain`, `martyrFrontline`, `poisonBloom`, `purgeAttrition`, `shadowExecute`.
- 0% into `bloodRage`, `cavalryBreak`, `fireBurst`, `lightningTempo`.

### No-Attribute Waterline

500 generated waterline teams, fixed team on left, no attribute builds.

| Variant | Total | 0-2 | 3-7 | 8-12 | 13-14 | 15-17 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `old` | 62% | 97% | 79% | 49% | 20% | 7% |
| `one` | 45% | 90% | 56% | 25% | 14% | 7% |
| `two` | 53% | 92% | 60% | 36% | 29% | 13% |

## Current State

The base shadow assassin is not ready for attribute-route testing.

- Single replacement is worse than the old preset in both matrix average and waterline.
- Double replacement creates strong matchup spikes in matrix, but still scores lower than the old preset on the 500-team waterline.
- Therefore the current kit is not a clean base-strength pass.

## Files Changed

- `projects/western_fantasy_continent/design/task-budget-board.json`: updated evidence for `shadow-assassin-survival-tuning`.
- `coop_repo/reports/2026-06-29_1238_shadow-assassin-clean-baseline.md`: this report.
- `coop_repo/LATEST.md`, `coop_repo/REPORT_INDEX.md`: updated handoff pointers.

## Unresolved

- Need decide whether the shadow branch is meant to replace one assassin in a team or operate as a two-assassin branch. The results differ dramatically.
- Need tune base no-attribute strength before any attribute-route analysis.

## Recommended Next Step

Treat `one-shadow` as the primary single-character baseline and buff/rework it until it approaches the old preset waterline. Separately inspect why `two-shadow` creates extreme matrix spikes before accepting it as a real archetype.
