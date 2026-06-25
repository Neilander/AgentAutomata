# Agent Handoff: Deterministic Ecology And Encounters

- Date: 2026-06-24
- Agent/thread: Codex desktop
- Scope: Western Fantasy Continent battle ecology diagnostics and encounter prototype
- Status: complete

## User Intent

The user wanted the balance workflow adjusted for low-randomness combat: 0/100 outcomes are not automatically bad if they represent clear hard counters. The useful check is whether hard counters have causes, costs, answers, and whether any team becomes an all-purpose winner. They also asked for simple enemy encounter design: each enemy has 1-2 clear skills, levels provide fixed character pools, the player picks a subset, and five levels should have multiple valid solutions without allowing every combination.

## Completed

- Changed matchup health reporting from raw polarization failure to deterministic ecology review.
- Added ecology profile checks for broad all-rounder risk and preyless weak presets.
- Extended extreme matchup diagnosis with an Ecology Review table and deterministic rule note.
- Added a project skill for causal attribution: occurrence, amplification, and resolution.
- Added inline encounter-unit support to `combat-sim.js`, so enemy units can live in encounter data without becoming player role kits.
- Added simple enemy skills through the unified skill asset pipeline.
- Added `encounter-data.js` with 10 fixed player roster candidates, 6 simple enemies, and 5 encounter levels.
- Added `simulate-encounter-levels.js`, which enumerates all legal team choices per level and writes markdown/json reports.
- Tuned enemy stats until all five levels had multiple passing teams but not full-pass pools.
- Recorded task-budget board entry `deterministic-ecology-encounters`.

## Files Changed

- `projects/western_fantasy_continent/game_data/simulate-archetype-matchups.js`: deterministic ecology health instead of raw 0/100 failure.
- `projects/western_fantasy_continent/game_data/analyze-matchup-extremes.js`: extreme matchup causal report plus ecology review.
- `projects/western_fantasy_continent/game_data/combat-sim.js`: inline unit profiles for encounter enemies.
- `projects/western_fantasy_continent/game_data/encounter-data.js`: fixed roster, simple enemy templates, and 5 levels.
- `projects/western_fantasy_continent/game_data/simulate-encounter-levels.js`: exhaustive level solver/report generator.
- `projects/western_fantasy_continent/game_data/skill_assets/skills/enemy*.json`: enemy skill assets and empty enemy slots.
- `projects/western_fantasy_continent/game_data/skill-assets.js`: regenerated unified skill asset bundle.
- `projects/western_fantasy_continent/design/archetype-matchup-report.md`: regenerated matchup report with ecology health.
- `projects/western_fantasy_continent/design/balance/archetype-matchup-evidence.json`: matchup evidence samples.
- `projects/western_fantasy_continent/design/balance/archetype-extreme-diagnosis.md`: causal/ecology diagnosis report.
- `projects/western_fantasy_continent/design/balance/archetype-extreme-diagnosis.json`: machine-readable causal/ecology diagnosis.
- `projects/western_fantasy_continent/design/encounter-level-report.md`: human-readable level simulation result.
- `projects/western_fantasy_continent/design/encounter-level-results.json`: machine-readable level simulation result.
- `projects/western_fantasy_continent/design/task-budget-board.json`: added and accepted the new task-budget entry.
- `projects/western_fantasy_continent/skills/combat-causal-attribution/SKILL.md`: new attribution workflow skill.
- `projects/western_fantasy_continent/skills/README.md`: registered the attribution skill.

## Validation

- `node --check projects/western_fantasy_continent/game_data/simulate-encounter-levels.js`: pass.
- `node projects/western_fantasy_continent/game_data/validate-game-data.js`: pass.
- `node projects/western_fantasy_continent/game_data/simulate-encounter-levels.js`: pass; writes encounter reports.
- `node projects/western_fantasy_continent/game_data/simulate-archetype-matchups.js`: pass; writes matchup report and evidence.
- `node projects/western_fantasy_continent/game_data/analyze-matchup-extremes.js`: pass; writes causal diagnosis.
- `git diff --check`: pass.

## Current State

Encounter solver result:

- Level 1 `ogre_gate`: 11/28 winning combos, 39% win share, target ok.
- Level 2 `ember_clock`: 31/56 winning combos, 55% win share, target ok.
- Level 3 `plague_clock`: 20/56 winning combos, 36% win share, target ok.
- Level 4 `stone_skin`: 31/210 winning combos, 15% win share, target ok.
- Level 5 `mirror_frost`: 32/210 winning combos, 15% win share, target ok.

Ecology diagnosis now flags review targets rather than failing raw determinism. Current review flags include `fireBurst` and `poisonBloom` as all-rounder risks, and `bloodRage`, `holySustain`, `ironWall` as preyless/vulnerable risks.

## Unresolved

- Encounter levels are data/simulation only; no UI has been wired to let the user pick roster members yet.
- Encounter enemies use the unified skill asset pipeline, but their stats are inline in `encounter-data.js`; this is intentional for prototype speed.
- Level pass/fail currently requires all enemies dead. Timeout is treated as not passed for encounter solving, which is better for boss levels but should be surfaced in UI text later.
- Enemy icons reference game-icons slugs but were not visually verified in the browser.
- No commit has been made; worktree remains dirty with earlier related untracked reports and this new work.

## Recommended Next Step

Start by reading `projects/western_fantasy_continent/design/encounter-level-report.md` and `projects/western_fantasy_continent/game_data/encounter-data.js`. The highest-value next action is adding a small workbench UI panel that loads the five encounter levels, lets the user choose roster members, runs `simulateTeams`, and displays pass/fail plus signal highlights.
