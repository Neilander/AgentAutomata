# Agent Handoff: Team Pool Evolver

- Date: 2026-06-28
- Agent/thread: Codex desktop
- Scope: Western Fantasy Continent team-composition automation
- Status: complete

## User Intent

The user decided not to push the AI-training/team-generation direction yet. The new desired workflow is a practical team-pool process:

- Keep a curated base of roughly 140 logic-built teams.
- Generate about 60 random exploration teams per round.
- Validate random teams with `combat-sim`.
- Append valuable random discoveries to the team pool.
- Do not remove weak teams yet.

## Completed

- Added a document that classifies the current simulation, validation, random, and training prototype scripts.
- Added a new `team-pool-evolver` script.
- Generated the initial team-pool database with 140 logic-built teams.
- Verified the script with a small dry-run exploration round.
- Added a role-specific team-pool script for testing one profession or one new profession skill against the main team pool.
- Generated the initial role-team database with 10 teams per role, 100 teams total.
- Added a role-vs-main matrix script that runs each role test team into the main team pool with one deterministic battle per cell and stores summary only.
- Ran the current 100 role teams into the current 140 main teams: 14,000 battles.
- Added `--opponents=presets` mode to the matrix script and ran the current 100 role teams into the 17 fixed standard preset teams: 1,700 battles.

## Files Changed

- `projects/western_fantasy_continent/design/team-pool-and-test-scripts.md`: script inventory plus the new team-pool workflow.
- `projects/western_fantasy_continent/game_data/team-pool-evolver.js`: initializes and evolves the long-term team pool.
- `projects/western_fantasy_continent/game_data/team_pools/team-pool-db.json`: initial 140-team database.
- `projects/western_fantasy_continent/game_data/role-team-pool-evolver.js`: initializes and evolves compact per-role test pools.
- `projects/western_fantasy_continent/game_data/team_pools/role-team-pool-db.json`: initial 10-role / 100-team role test database.
- `projects/western_fantasy_continent/design/team_pool/team-pool-evolver-report.md`: latest report generated from the dry-run.
- `projects/western_fantasy_continent/design/team_pool/team-pool-last-round.json`: latest dry-run candidate data.
- `projects/western_fantasy_continent/design/team_pool/role-team-pool-report.md`: role-pool summary and latest dry-run.
- `projects/western_fantasy_continent/design/team_pool/role-team-pool-last-round.json`: latest role-pool dry-run candidate data.
- `projects/western_fantasy_continent/game_data/role-team-pool-matrix.js`: runs role-team pools against the main team pool and stores one summary per cell.
- `projects/western_fantasy_continent/design/team_pool/role-vs-main-matrix.json`: 14,000-cell summary matrix.
- `projects/western_fantasy_continent/design/team_pool/role-vs-main-matrix-report.md`: readable role balance summary.
- `projects/western_fantasy_continent/design/team_pool/role-vs-preset-matrix.json`: 1,700-cell fixed-preset summary matrix.
- `projects/western_fantasy_continent/design/team_pool/role-vs-preset-matrix-report.md`: readable fixed-preset baseline summary.

## Validation

- `node --check projects/western_fantasy_continent/game_data/team-pool-evolver.js`: passed.
- `node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=init`: generated a 140-team database.
- `node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=evolve --random=6 --seeds=1 --opponent-sample=6 --promote-limit=3 --dry-run`: passed; 2/6 candidates were flagged for promotion, but no database write occurred because it was dry-run.
- `node --check projects/western_fantasy_continent/game_data/role-team-pool-evolver.js`: passed.
- `node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=init`: generated a 100-team role database, 10 teams for each of 10 roles.
- `node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=evolve --role=priest --focus-skill=purifyingWard --random=2 --seeds=1 --opponent-limit=8 --promote-limit=2 --dry-run`: passed; 1/2 priest candidates was flagged for promotion, but no database write occurred because it was dry-run.
- `node --check projects/western_fantasy_continent/game_data/role-team-pool-matrix.js`: passed.
- `node projects/western_fantasy_continent/game_data/role-team-pool-matrix.js`: ran 14,000 battles in about 27 seconds and wrote summary matrix/report.
- `node projects/western_fantasy_continent/game_data/role-team-pool-matrix.js --opponents=presets`: ran 1,700 battles in about 5 seconds and wrote fixed-preset matrix/report.
- `git diff --check`: passed.

## Current State

The team pool starts with 140 designer-logic teams:

- 30 one-front-three-back teams.
- 30 two-front-two-back teams.
- 18 three-front-one-back teams.
- 8 four-front teams.
- 18 protect-carry teams.
- 18 status-engine teams.
- 18 control-burst teams.

The default evolution command is:

```bash
node projects/western_fantasy_continent/game_data/team-pool-evolver.js --mode=evolve --random=60 --seeds=2 --opponent-sample=48
```

The role team pool starts with 10 teams per role:

- 7 designer-logic teams per role.
- 3 random seed teams per role.
- 100 total role-test teams.

The role-pool simulation budget is:

- single role: 10 role teams x 200 main teams = 2,000 matchup pairs before seeds.
- all roles: 100 role teams x 200 main teams = 20,000 matchup pairs before seeds.
- seeds=2 makes the all-role run 40,000 battles.

Example profession-skill dry-run:

```bash
node projects/western_fantasy_continent/game_data/role-team-pool-evolver.js --mode=evolve --role=priest --focus-skill=purifyingWard --dry-run
```

Current role-vs-main matrix result, using 140 main teams:

| Role | Win Rate | Notes |
| --- | ---: | --- |
| 骑士 | 74% | clearly high in this test pool; 7/10 role teams are 70%+ |
| 狂战士 | 59% | upper-middle; several strong teams and one weak random seed |
| 战士 | 56% | upper-middle, but role-team spread is large |
| 游侠 | 55% | upper-middle, one very strong shell and several weak shells |
| 术士 | 43% | below middle; only one 70%+ team |
| 牧师 | 42% | below middle, but focus sustain is high, so the issue is probably shell/output rather than no contribution |
| 吟游诗人 | 40% | below middle; many weak shells |
| 法师 | 38% | low overall, but one shell is 86% and several are near-zero |
| 刺客 | 37% | low overall; focus alive rate is only about 5% |
| 炼金师 | 34% | lowest; no 70%+ role team in this current pool |

Matrix storage:

- `role-vs-main-matrix.json` is about 15 MB.
- It stores summary only, not full signals/replays.
- The report is about 8 KB.

Fixed-preset baseline result, using 17 standard preset teams, after changing role pools to seed from fixed presets that contain each role:

| Role | Win Rate | Notes |
| --- | ---: | --- |
| 狂战士 | 50% | highest after preset seeding |
| 吟游诗人 | 49% | near top, mostly from tuned preset shells |
| 法师 | 42% | solid after fixed fire/frost presets are included |
| 骑士 | 41% | no longer inflated by generated main-pool weak teams |
| 牧师 | 34% | focus sustain is very high, but not always converting into wins |
| 战士 | 34% | mid-low against fixed presets |
| 游侠 | 24% | lower than generated-main-pool result |
| 术士 | 21% | low except the poison preset shell |
| 炼金师 | 19% | low except fixed preset shells |
| 刺客 | 18% | low overall; `poisonBloom` as an assassin-containing team is strong, but `shadowExecute` is weak in this baseline |

Hardest fixed preset teams for the role pools:

- `crownCarry` 王冠核心: role-pool win 6%.
- `poisonBloom` 毒巢滚雪球: role-pool win 9%.
- `fireBurst` 余烬爆燃: role-pool win 10%.
- `frostControl` 霜控拖延: role-pool win 22%.
- `frostTrapField` 霜陷猎场: role-pool win 22%.

## Unresolved

- Promotion thresholds are first-pass values and should be tuned after a few real rounds.
- The script does not yet remove redundant or weak teams.
- The script does not yet compute team similarity or novelty beyond duplicate exact kit checks.
- The latest report is from a small dry-run, not a full 60-team round.
- The role-pool script currently appends valuable random role teams, but it does not yet run the full 2,000-matchup single-role benchmark as a separate report.
- The matrix script currently ran against 140 main teams because the main team pool has not yet been expanded to 200 through a non-dry evolution round.
- The first matrix script version undercounted focus sustain because it matched generated unit ids incorrectly; this was fixed before the final matrix run.

## Recommended Next Step

Run one full non-dry evolution round only when the user wants to actually grow the pool. For a newly added profession skill, prefer running the role-pool dry-run first, then inspect promoted teams in the battle UI before treating them as real content.
