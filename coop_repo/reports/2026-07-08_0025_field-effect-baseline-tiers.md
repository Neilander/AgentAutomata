# Agent Handoff: Field Effect Baseline Tiers

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: update field-effect design skill with team strength baseline tiers
- Status: complete

## User Intent

User clarified that field-effect design needs to know which teams are mainstream strong, weak, or unplayable, otherwise future agents may design effects that reward strong defaults while punishing already bad teams.

## Completed

- Updated `projects/western_fantasy_continent/skills/field-effect-design/SKILL.md`.
- Added `Baseline Team Strength Tiers`.
- Recorded the current tested 17-preset waterline scores and four-ranged comparison.
- Expanded each tier entry with the team composition and play pattern, not only the preset name, so future agents can judge teaching contrasts without guessing what a Chinese preset name means.
- Added guidance:
  - compare same output core with different support/counter roles;
  - do not use weak or unplayable baselines as the main punished example;
  - four-ranged is not one baseline; damage variants are low-mid playable while control/support variants are currently unplayable.
- Added the design distinction between basic field effects and visually obvious field effects. After enough basic effects exist, future designs should include battlefield-visible objects/zones such as a center poison swamp, where the player first notices the space change and then learns how to exploit it.
- Refined visible effects into signal-visible effects: they may be zones, unit states, shields, marks, countdowns, transformations, behavior changes, or triggers. Prefer effects that both sides can participate in, avoid vague selectors like "some unit", and remove fake flavor that does not map to a visible combat signal or exact rule.

## Files Changed

- `projects/western_fantasy_continent/skills/field-effect-design/SKILL.md`: added baseline strength tiers.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added report entry.

## Validation

- Manual skill read-back after edit.
- Data copied from the latest normal 500-team waterline comparison:
  - strongest presets around 358-426/500;
  - low-mid playable four-ranged damage/double-ranger around 263-269/500;
  - four-ranged control/support at 145/500 and 80/500.

## Current State

Future field-effect proposals should check whether their positive and negative examples are valid teaching contrasts. A support-oriented field should not simply reward mainstream strong compositions or punish teams already below the playable floor.

## Unresolved

- The tier thresholds are practical current heuristics, not final balance doctrine.
- If the base combat balance changes, these tiers must be refreshed.

## Recommended Next Step

Use the updated skill to redesign the five early-game support-oriented field effects, especially revising `Iron Boots Battlefield` so its negative contrast is "missing contact/front-pressure role" rather than "all ranged".
