# Agent Handoff: Downward-Compatible Battle Formations

- Date: 2026-08-07
- Agent/thread: Codex primary thread
- Scope: Battle formation capacity compatibility
- Status: complete

## User Intent

Treat battle participant counts as upper limits so smaller formations can enter larger-capacity battles.

## Completed

- Changed matching from exact capacity to `formation capacity <= battle capacity` in both frontend eligibility and core deployment validation.
- A 2-unit formation can now enter 4/8/20-unit battles; a 4-unit formation can enter 8/20-unit battles; oversized formations remain incompatible.
- Sorted compatible formations by distance from the battle limit so the closest capacity appears first and becomes the default selection.
- Renamed UI language from exact specification to participant limit and clarified the three groups: compatible/legal, compatible/illegal, and over the limit.
- Added regression coverage proving that a 2-unit formation enters a 4-unit hunt while an 8-unit formation cannot.
- Updated core and UI documentation.

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: validate deployment capacity as a positive upper-bounded size and preserve its own position range.
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: verify downward compatibility and oversize rejection.
- `projects/western_fantasy_continent/border_village_war/README.md`: document capacity-as-upper-limit behavior.
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: implement compatible matching, nearest-capacity ordering, and revised reasons.
- `projects/western_fantasy_continent/border_village_war_web/index.html`: explain downward compatibility in the prebattle note.
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: verify the rule in frontend source and actual plans.
- `projects/western_fantasy_continent/border_village_war_web/README.md`: document player-visible compatibility.
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: redefine battle sizes as participant limits.
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: update the prebattle user path and success state.

## Validation

- Core, formal input boundary, sealed surface, winning route, and web static verifiers: PASS.
- Core check explicitly reports downward-compatible 2/4/8/20-unit authoritative plans.
- `git diff --check`: PASS; only existing LF-to-CRLF warnings were reported.
- No server or browser was started.

## Current State

Battle sizes are now maxima, not exact formation requirements. Compatible legal formations remain in the first group, with the closest size first; only formations larger than the battle limit are incompatible.

## Unresolved

- Final visual density still awaits the user's local workbench review.

## Recommended Next Step

Open a 4-unit hunt and an 8-unit raid and verify that the list order communicates compatibility without making smaller formations look invalid.
