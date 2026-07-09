# Agent Handoff: Lock-Key Cognition Skill Notes

- Date: 2026-07-09
- Agent/thread: Codex
- Scope: enrich project `game-analysis-iteration` skill with lock-key cognition review
- Status: complete

## User Intent

The user refined the earlier lock-key design idea. The important correction is that validation must model player cognition, not only static designer intent. Player cognition includes concepts, knowledge, behaviors, failure memories, attribution, wake-up conditions, and knowledge updates. Knowledge also has a first impression and update rules; for example, early equipment may teach "small stackable gains", while a later single item with `>=30%` power gain should update the belief to "equipment can create large jumps".

## Completed

- Added `projects/western_fantasy_continent/skills/game-analysis-iteration/references/lock-key-cognition.md`.
- Documented:
  - cognition state schema;
  - knowledge first impressions and update rules;
  - action selection assumptions;
  - failure memory and attribution;
  - power-based wake-up condition defaults;
  - lock/key/treasure definitions from player cognition;
  - layered lock-key chains such as camp equipment -> prison -> character -> process wall;
  - review format and reject/revise conditions.
- Updated `game-analysis-iteration/SKILL.md` so agents know when to read the new reference.
- Updated `compare-current-game.md` with a `Lock-Key Cognition Check` method.

## Files Changed

- `projects/western_fantasy_continent/skills/game-analysis-iteration/SKILL.md`
- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/compare-current-game.md`
- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/lock-key-cognition.md`

## Validation

- Read back the new reference and skill links.
- No runtime validation needed; documentation-only skill update.

## Current State

Future agents reviewing map progression should use the new lock-key cognition reference rather than checking only whether a node is statically a lock or key.

## Unresolved

- The `+30%` wake threshold and `+100%` guaranteed retry threshold are recorded as first-pass modeling assumptions, not final balance constants.
- No automated evaluator has been trained yet against this model.

## Recommended Next Step

Use the new review format on the current first-region map and decide where the first prison, camp, process wall, and boss should sit in the player's cognition timeline.
