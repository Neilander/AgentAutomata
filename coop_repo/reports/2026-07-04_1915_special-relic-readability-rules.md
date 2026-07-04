# Agent Handoff: Special Relic Readability Rules

- Date: 2026-07-04
- Agent/thread: Codex special relic design follow-up
- Scope: Add readability constraints to the special relic design skill.
- Status: complete

## User Intent

The user reviewed an initial batch of relic ideas and identified two design problems that should become durable rules:

- avoid too many per-character relics that trigger from one unit and grant a conditional effect to whichever single ally matches a state;
- avoid overcomplicated "A but B" balancing clauses when a simpler probability, ratio, stack cap, duration, cooldown, or trigger limit would express the same tuning intent.

## Completed

- Added an `Effect Readability` section to `special-relic-design`.
- Documented preferred relic target scopes:
  - self-applied;
  - whole-team;
  - concrete formation relation.
- Warned against overusing "any ally meets condition, that ally gets effect" patterns because four equipped copies become hard to reason about.
- Added simple limiter preferences for tuning strong effects.
- Added guidance against defaulting to "A but B" clauses, such as spreading burn but reducing damage on the extra target, when direct ratio/chance/cap language is clearer.

## Files Changed

- `projects/western_fantasy_continent/skills/special-relic-design/SKILL.md`: added target-scope and effect-complexity readability rules.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- Reviewed the skill diff directly.
- No runtime code or relic data was changed.

## Current State

Future relic batches should be judged not only by width and uplift, but also by whether each effect remains readable when equipped by up to four units. Prefer wearer-owned effects, whole-team effects, or fixed formation relationships.

## Unresolved

- The previously drafted 20 relic ideas have not yet been rewritten under these readability constraints.
- No simulator validation exists yet for special relic uplift.

## Recommended Next Step

Redesign the 20 relic candidate batch using the updated target-scope and simple-effect rules before implementing or adding them to `relics.js`.
