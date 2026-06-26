# 2026-06-26 Team Simulator Composition Milestone

## Status

The 8-pick-4 team simulator reached a useful first validation point: with hidden stat scaling removed, the user confirmed the mode now has readable counterplay and team-composition meaning.

This is a stage milestone, not a final balance lock.

## What Changed

- Team simulator combat now enters through `BattleView.start(...)`.
- `BattleView.start(...)` routes to the shared `CombatSimulation` when `combat-sim.js` is loaded.
- The battle view advances the shared simulation frame by frame and consumes combat signals for visible feedback.
- The direct "show final result only" path was removed from the team simulator flow.
- Team simulator recruits now use base role stats only.
- Team simulator enemies now use base role stats only.
- Team simulator challenges pass `randomizeStats: false`, so the mode tests composition and skill synergy rather than hidden stat variance.
- A manual role add control was added so the user can force specific roles into the candidate pool instead of repeatedly rerolling.

## Why This Matters

Before this pass, the 80-strength challenge felt impossible because three things were stacked together:

- enemy stat multiplier from challenge strength,
- player random quality variance,
- a strong enemy composition: knight + double assassin + warlock.

Batch testing showed the old 80 challenge had about 1.4% win rate under random recruit + auto-pick, which made it a stat wall rather than a composition test.

After removing hidden stat advantages, the same challenge remains harder but no longer behaves like an unfair wall. The remaining difficulty mostly comes from actual mechanics: double assassin execution pressure plus warlock poison enabling low-health/abnormal-target payoffs.

## User-Validated Result

The user manually tested the updated simulator and confirmed:

- the 80 challenge can be beaten,
- counters and team-composition choices are visible,
- current numbers are acceptable for this stage,
- the mode is now interesting enough to count as a stage result.

## Important Constraints Going Forward

- Do not reintroduce hidden role quality scaling in the team simulator unless it is explicitly shown to the user.
- Do not make challenge labels such as 30/60/80/90 silently multiply base stats in this mode.
- Keep this mode focused on composition testing: role choice, skill package, synergy, and counters.
- If challenge difficulty needs to rise, prefer enemy lineup changes, skill packages, or explicit modifiers shown in the UI.
- Do not bypass the shared battle path with page-local battle logic.

## Files Touched In This Stage

- `team_simulator/index.html`
- `team_simulator/team-simulator.js`
- `team_simulator/styles.css`
- `battle_view/battle-view.js`

## Next Useful Steps

- Add explicit challenge modifiers if future stages need difficulty tiers.
- Add a small combat summary after each fight: first death, top damage source, top healing/shielding source.
- Add role/skill filters for manual testing if the candidate pool grows.
- Continue making skill effects more legible through shared combat signal mapping.
