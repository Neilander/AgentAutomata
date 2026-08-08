# Agent Handoff: Formation Card Portrait Slot

- Date: 2026-08-06
- Agent/thread: Codex primary thread
- Scope: Border village formation member-card hierarchy
- Status: complete

## User Intent

Make the formation cards capable of displaying future character illustrations lower in the card, while removing unnecessary boxes around profession icons.

## Completed

- Rebuilt formation member cards as three stable layers: compact identity header, downward portrait region, and separated combat-power footer.
- Added a low-contrast temporary silhouette in the portrait region plus an image rule that can accept future artwork without changing card layout.
- Removed border, radius, and background plate from profession icons in both roster cards and occupied position slots.
- Updated UI documentation and static regression checks for the portrait layer and unframed icons.

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: render the dedicated middle portrait layer.
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: define the three-row card, portrait placeholder, future image behavior, and unframed profession icons.
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: verify portrait reservation and icon treatment.
- `projects/western_fantasy_continent/border_village_war_web/README.md`: document the three-layer formation card.
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: record the intended identity/art/power hierarchy.
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: record the future-asset gap and excessive-framing findings.

## Validation

- `node --check projects\western_fantasy_continent\border_village_war_web\border-village-web.js`: PASS.
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS.
- `git diff --check`: PASS; only existing LF-to-CRLF warnings were reported.
- No server or browser was started, following the project testing constraint.

## Current State

Formation member cards now reserve their flexible middle height for character art. Names and city remain in the compact header, and combat power remains fixed in the footer. A later portrait asset can be inserted as an image in `.formation-member-art` without displacing either information region.

## Unresolved

- Final character illustration assets are not yet available; the current middle region uses a deliberately quiet placeholder.
- Visual pixel review still depends on the user's next local play session because no browser session was launched.

## Recommended Next Step

Review the new card proportions in the local workbench, then decide whether the portrait region should crop at the waist or show more full-body art before producing final assets.
