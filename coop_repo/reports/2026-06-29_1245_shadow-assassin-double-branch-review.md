# Agent Handoff: Shadow Assassin Double-Branch Review

- Date: 2026-06-29
- Agent/thread: Codex desktop
- Scope: Reinterpreting no-attribute shadow assassin results as a possible double-assassin branch
- Status: partial

## User Intent

The user proposed that the two-shadow result may be healthy rather than broken: double shadow assassins may quickly cut one key unit and break combo teams, while multi-frontline teams that do not depend on one backline/combo unit should be natural counters. The task was to re-check the no-attribute results from that lens before moving toward attribute routes.

## Completed

- Kept the test clean: no attribute routes, no `unitSpec()`, no 10-point builds.
- Re-read the previous no-attribute matrix and waterline results.
- Broke the 500-team waterline result down by generated team pattern and bucket.
- Updated task-board evidence for `shadow-assassin-survival-tuning`.

## Key Results

### Fixed-Preset Matrix

Two-shadow average vs fixed presets: `64%`.

Strong prey:

- `bulwarkMarks` 100%
- `duelChampion` 100%
- `frostControl` 100%
- `holySustain` 100%
- `martyrFrontline` 100%
- `poisonBloom` 100%
- `purgeAttrition` 100%
- `shadowExecute` 100%

Clear predators:

- `bloodRage` 0%
- `cavalryBreak` 0%
- `fireBurst` 0%
- `lightningTempo` 0%

Interpretation: matrix profile is not flatly overpowered. It has hard prey and hard predators, which matches the intended deterministic ecology.

### Waterline By Bucket

| Bucket | Old `shadowExecute` | One Shadow | Two Shadow | Two vs Old |
| --- | ---: | ---: | ---: | ---: |
| `0-2` | 98% | 86% | 92% | -6 |
| `3-7` | 80% | 57% | 61% | -19 |
| `8-12` | 52% | 23% | 33% | -19 |
| `13-14` | 17% | 11% | 26% | +9 |
| `15-17` | 0% | 0% | 7% | +7 |

Interpretation: two-shadow is worse into low/mid waterline volume, but better into the strongest buckets. That supports the idea that it is not a generalist farmer; it is a specialized high-end disruption profile.

### Waterline By Pattern

| Pattern | Old | One Shadow | Two Shadow | Two vs Old |
| --- | ---: | ---: | ---: | ---: |
| 一前排三后排 | 68% | 61% | 66% | -2 |
| 一核心三保护 | 73% | 63% | 61% | -12 |
| 三前排一后排 | 41% | 22% | 26% | -15 |
| 两前排两后排 | 66% | 51% | 69% | +3 |
| 四前排 | 46% | 14% | 24% | -22 |
| 控制爆发 | 72% | 45% | 51% | -21 |
| 状态铺设与引爆 | 71% | 44% | 65% | -6 |
| 随机职业 | 69% | 54% | 46% | -23 |

Interpretation:

- The user hypothesis is partly supported: two-shadow is clearly bad into multi-frontline patterns, especially `四前排` and `三前排一后排`.
- It is not generally better into every combo label. It is close into `一前排三后排`, slightly better into `两前排两后排`, and still lower than old into `一核心三保护`, `控制爆发`, and `状态铺设与引爆`.
- The strongest evidence for the branch is not pattern average; it is fixed-preset prey/predator shape plus improved high-bucket waterline performance.

## Current State

Revised verdict:

- Single-shadow is not valid as a standalone replacement.
- Two-shadow is a plausible anti-combo / disruption branch prototype, not a universal upgrade.
- It should be evaluated as its own archetype with two shadow assassins, not as a one-character swap.
- It can proceed to a more formal branch test, but attribute-route testing should be framed around the double-shadow archetype.

## Files Changed

- `projects/western_fantasy_continent/design/task-budget-board.json`: updated evidence.
- `coop_repo/reports/2026-06-29_1245_shadow-assassin-double-branch-review.md`: this report.
- `coop_repo/LATEST.md`, `coop_repo/REPORT_INDEX.md`: updated handoff pointers.

## Unresolved

- Need decide whether the official shadow branch team is exactly two assassins, or whether there should be a support/mark enabler variant.
- Need inspect why `一核心三保护` and `控制爆发` are lower than expected despite the matrix showing many combo-like prey.
- Attribute-route testing should wait until the branch identity is written as "double-shadow anti-combo" rather than "single assassin replacement."

## Recommended Next Step

Create or formalize a `doubleShadow` preset/archetype and run the normal no-attribute matrix/waterline as a named branch. If that is accepted, then test attribute routes for the double-shadow branch specifically.
