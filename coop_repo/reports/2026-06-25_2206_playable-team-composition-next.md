# Agent Handoff: Playable Team Composition Next

- Date: 2026-06-25
- Agent/thread: Codex desktop
- Scope: Western Fantasy Continent workbench, reusable combat view, encounter/team simulator direction, balance diagnostics, player signal priority
- Status: partial / handoff

## User Intent

The next phase should prioritize a playable character-composition game loop. The player should be able to choose roles/skills, enter an actual battle, and feel that different team combinations create different outcomes and combo fantasies.

Player signal systems remain important, but they are the secondary target for this phase. Signals should support later analysis, debugging, balance, and player behavior modeling rather than blocking the first playable team-composition loop.

## Completed

- Built a reusable battle presentation module under `projects/western_fantasy_continent/battle_view/`.
- Connected the shared battle view into the team simulator so it can show pre-battle units, 4v4 positioning, HP bars, floating text, skill labels, and live combat movement/effects.
- Connected the shared battle view into the encounter lab so level attempts show battle instead of only a static result board.
- Updated the local app server static route list so `/battle_view` assets can be served.
- Added pre-battle preview support so characters/enemies are visible before combat starts.
- Investigated the assassin / `shadowExecute` balance issue from matrix and evidence data.
- Confirmed that matrix data did expose `shadowExecute` as broadly dominant, but current reporting classified it as `dominant-but-answered` because it has two hard predators.
- Identified the diagnostic gap: current balance reports operate mostly at archetype/team level, not per-skill offender level.

## Files Changed

- `projects/western_fantasy_continent/battle_view/battle-view.js`: reusable live battle view module.
- `projects/western_fantasy_continent/battle_view/battle-view.css`: shared 4v4 battle styling, unit layout, HP bars, floaters, and FX.
- `projects/western_fantasy_continent/app/server/server.js`: serves the new shared battle view assets.
- `projects/western_fantasy_continent/team_simulator/index.html`: loads shared battle view assets.
- `projects/western_fantasy_continent/team_simulator/team-simulator.js`: mounts shared battle view and uses it for preview/live challenge combat.
- `projects/western_fantasy_continent/team_simulator/styles.css`: adjusted page styling around the shared battle host.
- `projects/western_fantasy_continent/encounter_lab/index.html`: loads shared battle view assets.
- `projects/western_fantasy_continent/encounter_lab/encounter-lab.js`: uses shared battle view for level preview and combat.
- `projects/western_fantasy_continent/encounter_lab/styles.css`: adjusted encounter page layout around the battle host.
- `projects/western_fantasy_continent/game_data/skill_assets/roles/assassin.json`: current worktree contains a tentative assassin power reduction.
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowCut.json`: current worktree contains tentative `shadowCut` reductions.
- `projects/western_fantasy_continent/game_data/skill_assets/skills/shadowHarvest.json`: current worktree contains tentative `shadowHarvest` opening/cooldown/damage reductions.
- `projects/western_fantasy_continent/game_data/skill-assets.js`: rebuilt generated skill asset bundle after tentative assassin edits.

## Validation

- `node --check projects/western_fantasy_continent/battle_view/battle-view.js`: passed.
- `node --check projects/western_fantasy_continent/team_simulator/team-simulator.js`: passed.
- `node --check projects/western_fantasy_continent/encounter_lab/encounter-lab.js`: passed.
- `git diff --check`: passed during the shared battle-view work.
- Browser checked on local server port `3779`:
  - Team simulator initially previews the enemy team before battle.
  - After auto-pick, team simulator previews selected player units plus enemies.
  - Starting a challenge shows live 4v4 combat with HP changes, floaters, skill labels, and logs.
  - Encounter lab previews enemies before selection and shows selected player units after choosing a team.
  - Encounter lab can start a level and show live combat.

## Current State

The project now has a reusable battle view that can be mounted by multiple workbench pages. This is the right direction: battle should become a reusable system, similar to skill data, instead of each page implementing its own separate combat UI.

The current playable loop is still not good enough. The next agent should focus on making one coherent character-composition experience work end to end:

- choose from a readable roster,
- inspect roles and skills,
- form a team,
- enter a level/challenge,
- watch a real battle,
- understand why the team won or lost,
- retry with a different composition.

Assassin balance is currently suspicious. The matrix already showed `shadowExecute` hard-winning many matchups, but it was not escalated because it had two hard predators: `lightningTempo` and `poisonBloom`. This creates a bad shape: the archetype can be oppressive into most teams while still being considered "answered" by the ecology heuristic.

The current worktree includes tentative assassin nerfs. Treat them as provisional, not final design truth. The better next step is to add per-skill offender diagnostics before making more numeric changes.

## Unresolved

- The shared battle view is implemented and usable, but it should be treated as a first extracted version, not a final combat client.
- Some older legacy battle/replay code remains in pages and may need cleanup after the shared module is stable.
- The encounter lab still needs to become genuinely playable, not just visually nicer.
- Team composition UX is still the highest priority. The user is explicitly unhappy with pages that do not let them fight.
- Assassin / `shadowExecute` needs a proper skill-level diagnosis:
  - first cast timing,
  - per-skill damage contribution,
  - kill participation,
  - 2-second peak contribution,
  - target HP before/after,
  - reset/snowball contribution.
- Existing matrix/evidence data is useful but too archetype-level. It can say "burstWindow + executePressure"; it does not yet say "this exact skill is the offender."
- Player signal-system work and life-recognition simulator work are intentionally secondary for now.

## Recommended Next Step

Primary objective: build the first truly playable character-composition mode.

Start from the shared battle view and either the team simulator or encounter lab. Prefer whichever page can most quickly become a complete loop:

- roster selection,
- team setup,
- enemy/level selection,
- battle start,
- battle result,
- clear reason summary,
- retry/change lineup.

Secondary objective: player signal system.

Do not let signal work block the playable loop. Add signals where they directly help explain battle outcomes, balance issues, or player choice behavior. Once the playable loop is acceptable, extend the signal system to record player decisions and post-battle analysis.

For balance, the next high-value technical task is a skill-offender report generated from `projects/western_fantasy_continent/design/balance/archetype-matchup-evidence.json`. This should identify which skills and timing windows cause extreme matchups, especially `shadowHarvest` in `shadowExecute`.
