# Agent Handoff: Region 1 V5 Map Loop

- Date: 2026-07-12
- Agent/thread: Codex first-region redesign goal
- Scope: Region 1 opening through first boss, real combat plus cognition-v5 simulation
- Status: complete

## User Intent

Redesign the first large-map segment through the first boss using only existing militia, heroes, equipment, encounters, rarities, and field effects. Allow roster changes, restructure the route, test with the new player-cognition model, iterate, and report both game-flow and simulator problems.

## Completed

- Opened roster management at the start. Initial heroes and militia can now be swapped before rescuing the Ranger; rescuing the Ranger expands the roster instead of unlocking the UI.
- Rebuilt Region 1 as a readable trunk/fork/merge route:
  - M1-M3 establish combat and first loot.
  - Prison appears after M3 as an optional early character goal.
  - M4-M5 lead to the optional one-time Camp equipment key.
  - M6 opens two parallel checks: M7 high-HP single target and M8 fragile caster group.
  - Clearing either M7 or M8 unlocks M9; the unchosen route is not required.
  - M10 remains the repeatable pre-boss equipment source.
- Preserved Prison and Camp as repeatable optional encounters with one-time rewards.
- Added real-combat evidence to cognition events: D50, D90, hit frequency, relative hit impact, first ally death, incoming physical/magic/effect damage, and surviving enemies.
- Added Mage role proof on M8 alongside the existing Ranger proof on M7.
- Added a cognition-v5 route simulator with balanced, impatient, and analytical profiles. Failure now creates a bounded hypothesis from visible knowledge/actions; only replaying the failed target confirms or refutes it.
- Corrected two simulator errors found by independent player reviews:
  - auto-battle duration is not treated as continuous player effort;
  - individual hits in one battle are not treated as repeated whole-event freshness loss.
- Corrected action-ordering errors:
  - a clear Camp no longer confirms a Prison hypothesis;
  - an actionable hypothesis may be tried once before low feedback causes abandonment;
  - Ranger is placed in the back slot instead of replacing the frontline Warrior;
  - automated route traversal skips the unused fork after M9 becomes available.
- Added player-facing failure evidence to the map reward log: first death timing, enemy survivors, and dominant incoming damage.
- Tuned only the Region 1 boss override from 1.53 to 1.38. No formal role base values or skill assets changed.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core.js`: fork prerequisites, start-of-game swaps, combat performance/diagnosis evidence, M8 enemy/readout and Mage proof.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: visible fork layout, start-of-game team dialog, OR prerequisite support, auto-route merge handling, failure diagnosis text.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-encounters.js`: Region 1 boss-only scale adjustment to 1.38; existing prior first-road profiles were left intact.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-v5-flow.js`: new real-combat V5 route/player simulation.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-batch.js`: old batch policy now respects the fork merge.
- `projects/western_fantasy_continent/game_data/test-map-first-region-flow.js`: topology, roster, one-time reward, and V5 flow regressions.

## Validation

- `node game_data/test-player-cognition-v5-sandbox.js`: passed.
- `node game_data/test-map-first-region-flow.js`: passed.
- Syntax checks for map frontend, cognition core, and V5 flow: passed.
- 90 real-combat V5 flows after final iteration:
  - completion: 96.7%
  - balanced: 93.3%; impatient: 100%; analytical: 96.7%
  - average steps: 16.09
  - average losses: 2.23
  - average final feedback: 35.79; average minimum feedback: 30.20
  - route use: M7 60, M8 30
  - hypotheses: 136 confirmed, 62 refuted, 0 left pending
- Boss alternative-path grid, 80 seeds each, before/after extra M10 farms:
  - default team: 66.2% -> 76.2% -> 81.3%
  - Ranger backline: 100% immediately
  - Spear militia route: 25.0% -> 43.8% -> 61.3% -> 75.0%
  - Drum militia route: 22.5% -> 32.5% -> 52.5% -> 57.5%
- Browser check at `http://localhost:3777/map_progression_lab/`:
  - map fork is visible;
  - team management is enabled at the start and opens the roster dialog;
  - no console warnings/errors.

## Current State

The first region now has a closed opening loop rather than a single line: establish a baseline, notice the optional character goal, hit a visible obstacle, obtain a targeted key or ordinary gear, verify the change, choose one of two readable combat routes, then use the boss as a final build/gear check. There are multiple boss solutions rather than a Ranger-only hard lock.

## Simulator Problems Observed

- Chaining the isolated V5 calibration unchanged initially made ordinary auto-battles drain feedback too fast. The bridge now uses attended effort time, not full simulation duration.
- Growth baselines cannot compare raw relative damage across different enemy compositions. The bridge now compares performance only against previous attempts at the same node.
- The first implementation verified hypotheses during intervention rather than at the failed target. This is fixed.
- Route choice still relies on public enemy hints plus public roster notes with persona-specific deterministic policy. It no longer needs hidden combat labels, but it is not yet an emergent learned preference model.
- The live frontend expected-player panel still uses the earlier lightweight player-state model. V5 is currently the offline validation authority, not the live UI renderer.

## Unresolved

- Boss failure evidence is present in the reward log but not yet a dedicated diagnosis panel.
- The simulator does not yet model a player manually comparing individual equipment affixes; equipment gain is represented through team score and actual combat outcome.
- The existing Prison/Camp/Boss field effects were retained; no new field effect was introduced in this pass.
- The worktree already contained uncommitted V5 and first-level work before this goal. Do not revert those files when integrating this report.

## Recommended Next Step

Have the user play the first region once without looking at the simulation report. Record whether they naturally try Prison early, understand why Camp is relevant, notice the M7/M8 distinction, and can explain a boss failure from the new evidence. Use that human trace to replace the remaining deterministic route-choice policy with learned preference updates.
