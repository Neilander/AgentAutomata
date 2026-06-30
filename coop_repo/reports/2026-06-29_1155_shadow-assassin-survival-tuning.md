# Agent Handoff: Shadow Assassin Survival Tuning

Correction: this report's acceptance verdict is superseded by `2026-06-29_1205_shadow-assassin-report-correction.md`. The table labeled as 4v4 below was actually the generated `2v2` table. The real current 4v4 result remains `10坚韧` led, with expected shadow routes at `36-39%`.

- Date: 2026-06-29
- Agent/thread: Codex desktop
- Scope: Western Fantasy Continent shadow assassin survivability tuning
- Status: complete

## User Intent

The user asked for a small-budget tuning pass on the hidden/shadow assassin branch: improve survivability a little, try two or three balance iterations, and verify whether the branch can be made usable without turning it back into the accepted meat/poison assassin.

## Completed

- Opened a task-board budget entry: `shadow-assassin-survival-tuning`, budget 3.
- Used all three attempts and recorded the final attempt as accepted with risk noted.
- Tuned `暗影突袭` to give a longer hidden entry window and slightly less retaliation exposure.
- Added a reusable `basicAttackHiddenExtend` combat effect so passives can extend hidden time during basic attacks.
- Tuned `影势连杀` into the current accepted candidate:
  - passive attack speed multiplier `1.08 -> 1.18`
  - hidden basic attacks can extend hidden time when the target has enough mark stacks
  - one low-HP `残影脱身` guard/fade trigger, with no direct shield value
- Rebuilt generated skill data and regenerated attribute route reports.

## Files Changed

- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowBurstAmbush.json`: hidden entry adjusted from 2.8s to 3.2s, retaliation from 0.8s to 0.6s, guard from 0.5s to 0.8s.
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowMomentum.json`: added hidden extension, low-HP fade/guard, and stronger attack speed.
- `projects/western_fantasy_continent/game_data/combat-sim.js`: added `basicAttackHiddenExtend` signal-emitting passive effect.
- `projects/western_fantasy_continent/game_data/validate-skill-assets.js`: whitelisted `basicAttackHiddenExtend`.
- `projects/western_fantasy_continent/game_data/skill-assets.js`: regenerated from skill assets.
- `projects/western_fantasy_continent/design/attribute-build-route-simulation-v2.md`: regenerated route report.
- `projects/western_fantasy_continent/design/attribute-team-route-simulation-v2.md`: regenerated team route report.
- `projects/western_fantasy_continent/design/task-budget-board.json`: recorded the 3-attempt tuning budget and outcome.
- `coop_repo/LATEST.md`, `coop_repo/REPORT_INDEX.md`: updated handoff pointers.

## Validation

- `node projects/western_fantasy_continent/game_data/build-skill-assets.js`: passed.
- `node projects/western_fantasy_continent/game_data/validate-skill-assets.js`: passed.
- `node projects/western_fantasy_continent/game_data/analyze-attribute-build-routes-v2.js`: passed and regenerated report.
- `node projects/western_fantasy_continent/game_data/analyze-attribute-team-routes-v2.js`: passed and regenerated report.

Team route result for assassin 4v4 after the accepted candidate:

| Route | Team Win | Focus Damage | Focus Alive |
| --- | ---: | ---: | ---: |
| `10副` | 57% | 326.8 | 29% |
| `7主3副` | 57% | 314.5 | 25% |
| `全分散` | 57% | 310.0 | 29% |
| `10坚韧` | 54% | 324.4 | 50% |
| `5主5副` | 54% | 312.1 | 25% |
| `3主7副` | 50% | 318.8 | 25% |
| `10主` | 50% | 293.2 | 25% |

Corrected 500-team waterline check using the actual route stat conversion:

| Route | Total | 0-2 | 3-7 | 8-12 | 13-14 | 15-17 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `base0` | 44% | 89% | 56% | 23% | 10% | 7% |
| `10敏` | 50% | 90% | 61% | 31% | 21% | 7% |
| `5敏5武` | 58% | 95% | 69% | 41% | 30% | 20% |
| `7敏3武` | 59% | 95% | 70% | 44% | 34% | 17% |
| `10武` | 60% | 95% | 71% | 46% | 31% | 13% |
| `3敏7武` | 60% | 94% | 73% | 45% | 30% | 27% |
| `10坚韧` | 68% | 100% | 84% | 54% | 34% | 17% |

Selected standard-preset spot check, 12 seeds each:

| Route | Clear Wins | Clear Losses |
| --- | --- | --- |
| `7敏3武` | `holySustain` 12/12, `poisonBloom` 12/12, `frostControl` 12/12, `shadowExecute` 12/12 | `bloodRage` 0/12, `fireBurst` 0/12, `crownCarry` 0/12 |
| `10坚韧` | `ironWall` 12/12, `poisonBloom` 12/12, `shadowExecute` 12/12 | `fireBurst` 0/12, `crownCarry` 0/12 |
| `10敏` | `shadowExecute` 12/12, `holySustain` 8/12 | `bloodRage` 0/12, `fireBurst` 0/12, `crownCarry` 0/12, `poisonBloom` 0/12, `frostControl` 0/12 |

## Current State

The shadow assassin is now more playable in 4v4. The important improvement is that expected routes are no longer crushed by pure tenacity in the team-route report: `10副`, `7主3副`, and `5主5副` are now near or above `10坚韧`.

The branch still has real counters. It remains poor into `bloodRage`, `fireBurst`, and `crownCarry`, so this pass did not create a universal assassin.

## Unresolved

- In the old `shadowExecute` team shell waterline, `10坚韧` is still best at 68%. This is acceptable for this pass because the team-route report improved and the user asked for a small survivability bump, but it is still a balance risk.
- Pure `10敏` remains weaker than mixed agility/weapon routes. If shadow assassin is supposed to be a pure speed fantasy, the next design needs a payoff that specifically converts attack frequency into exit/reset value.
- `basicAttackHiddenExtend` currently keys off the passive skill in signals. That is good enough for analysis, but a future signal cleanup may want a more explicit effect id.

## Recommended Next Step

Do not add more generic survivability yet. If another pass is needed, start from `shadowMomentum.json` and make the hidden/mark loop scale more specifically with agility or kill timing, while reducing the value of pure tenacity in the old waterline shell.
