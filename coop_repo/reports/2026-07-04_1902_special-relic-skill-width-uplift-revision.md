# Agent Handoff: Special Relic Width And Uplift Revision

- Date: 2026-07-04
- Agent/thread: Codex special relic design revision
- Scope: Update the special relic design skill with the user's refined width mix and uplift-based validation.
- Status: complete

## User Intent

The user clarified that the relic distribution should not be `20/40/40`. The intended ecology is:

- 20% broadly usable relics;
- 40% medium-width relics usable by about three roles/build families;
- 30% single-build relics;
- 10% bridge relics that link two build families, such as low-health plus burn.

The user also clarified that relic validation should measure uplift percentage, not only raw result quality, and that genericity should be capped by the total uplift across sampled teams.

## Completed

- Updated `special-relic-design` from `20/40/40` to `20/40/30/10`.
- Added `bridge relic` as a width class.
- Added relic grade categories:
  - normal;
  - advanced;
  - component;
  - core.
- Added target-team uplift bands:
  - normal: 10%-20%;
  - component: 20%-40%;
  - core: 40%-60%;
  - advanced: between normal and component, tuned by reward tier.
- Added mid-gear uplift-sum genericity caps:
  - normal relic: suggested cap around 150;
  - core relic: suggested cap around 240;
  - component relic: between those, tuned by acquisition rarity.
- Updated the sampling plan:
  - 1 target team;
  - 3 near-target teams, randomly sampled if more exist;
  - 5 logically-built random standard teams;
  - repeated sampling passes.
- Updated the project skill README entry to reflect the new rules.

## Files Changed

- `projects/western_fantasy_continent/skills/special-relic-design/SKILL.md`: revised width mix, grade system, uplift measurement, and genericity cap.
- `projects/western_fantasy_continent/skills/README.md`: updated the skill summary.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- Reviewed the modified skill text directly.
- Confirmed this is design documentation only; no combat, loot, skill, or item runtime was modified.

## Current State

Future relic design should use uplift bands and uplift-sum caps. A relic is not accepted just because it helps its target team; it must also avoid being too broadly efficient across near-target and random standard teams.

## Unresolved

- No relic simulator exists yet for automated repeated sampling.
- Exact uplift caps for `advanced` and `component` relics still need calibration after real data.
- The first ten proposed relic ideas should be reclassified under the new 20/40/30/10 system before implementation.

## Recommended Next Step

Re-review the ten candidate relics under `special-relic-design`, explicitly assigning each one a width class, grade, expected target uplift, and expected total uplift sum before implementing challenge first-clear rewards.
