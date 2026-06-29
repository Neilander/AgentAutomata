# Agent Handoff: Mob Waterline And Role Score

- Date: 2026-06-28
- Agent/thread: Codex desktop
- Scope: Western Fantasy Continent generated team waterline and role scoring
- Status: complete

## User Intent

Build a practical generated-team "mob waterline": about 500 generated teams spread across strength tiers, where strength is measured by how many fixed standard preset teams they can beat. If the waterline succeeds, use it to score the ten professions' current standard teams.

## Completed

- Added `mob-waterline-builder.js`.
- Built a 500-team generated waterline.
- Evaluated 2400 generated candidates to fill the waterline.
- Filled all requested strength buckets exactly:
  - `0-2`: 100 teams.
  - `3-7`: 160 teams.
  - `8-12`: 140 teams.
  - `13-14`: 70 teams.
  - `15-17`: 30 teams.
- Scored current fixed-preset-derived standard teams for all ten professions against the 500-team waterline.
- Updated the team-pool script documentation with the new waterline workflow and current role-score summary.

## Files Changed

- `projects/western_fantasy_continent/game_data/mob-waterline-builder.js`: builds the generated mob waterline and scores role standard teams against it.
- `projects/western_fantasy_continent/game_data/team_pools/mob-waterline-db.json`: generated 500-team waterline database.
- `projects/western_fantasy_continent/design/team_pool/mob-waterline-report.md`: readable bucket report for the waterline.
- `projects/western_fantasy_continent/design/team_pool/mob-waterline-role-score.json`: role scoring data.
- `projects/western_fantasy_continent/design/team_pool/mob-waterline-role-score-report.md`: readable role scoring report.
- `projects/western_fantasy_continent/design/team-pool-and-test-scripts.md`: documented commands, bucket meanings, and current role score summary.
- `coop_repo/LATEST.md`: updated to this handoff.
- `coop_repo/REPORT_INDEX.md`: added this handoff.

## Validation

- `node --check projects/western_fantasy_continent/game_data/mob-waterline-builder.js`: passed.
- `node projects/western_fantasy_continent/game_data/mob-waterline-builder.js --mode=build --target=500 --batch=200 --max-batches=40 --force`: passed; wrote `mob-waterline-db.json` and `mob-waterline-report.md`.
- `node projects/western_fantasy_continent/game_data/mob-waterline-builder.js --mode=score-roles`: passed; wrote role-score JSON and report.

## Current State

The waterline can be used as a scoring set. A new candidate team can fight the 500 generated teams, and its win count can be interpreted as a rough "mob-clear strength" score. The current waterline is intentionally tiered, not balanced flat:

| Bucket | Count | Avg Score Against 17 Fixed Presets |
| --- | ---: | ---: |
| `0-2` | 100 | 0.48 |
| `3-7` | 160 | 4.62 |
| `8-12` | 140 | 9.89 |
| `13-14` | 70 | 13.46 |
| `15-17` | 30 | 15.57 |

Current role standard-team score summary:

| Role | Avg Win Against Waterline |
| --- | ---: |
| 刺客 `assassin` | 75% |
| 法师 `mage` | 74% |
| 炼金师 `alchemist` | 64% |
| 骑士 `knight` | 63% |
| 狂战士 `berserker` | 60% |
| 术士 `warlock` | 58% |
| 牧师 `priest` | 54% |
| 吟游诗人 `bard` | 53% |
| 战士 `warrior` | 53% |
| 游侠 `ranger` | 48% |

Important interpretation: this is not profession single-unit strength. It is the current standard teams that contain each profession, tested as full teams against the generated waterline.

## Unresolved

- The waterline uses deterministic single battles per matchup. That matches current low-randomness combat, but if randomness increases later, the scorer should support seeds per cell.
- The `15-17` tier contains intentionally extreme generated teams. They are useful for the waterline, but should not automatically become playable preset teams.
- The role score says "can clear mobs", not "is healthy in PvP ecology". Use the fixed-preset matrix and signal attribution for ecology and offender analysis.
- The generated waterline has not yet been surfaced in a frontend UI.

## Recommended Next Step

Add a small script mode or UI button to score an arbitrary selected team against `mob-waterline-db.json`, returning total wins plus per-bucket wins. After that, test the ten profession pools again only when skill numbers or standard preset rosters change.
