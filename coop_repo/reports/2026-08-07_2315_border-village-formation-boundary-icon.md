# Agent Handoff: Formation Boundary Profession Icon

- Date: 2026-08-07
- Agent/thread: Codex primary thread
- Scope: Border village formation card visual hierarchy
- Status: complete

## User Intent

Keep the future portrait region genuinely empty and move a smaller profession icon to the center of the boundary between the portrait and information regions.

## Completed

- Removed the profession icon from inside the portrait region.
- Added a small unframed profession icon centered on and overlapping the portrait/information divider.
- Preserved the lower information hierarchy: left-aligned name above the compact combat-power row, with city visible on the right.
- Added regression checks for the empty portrait markup and boundary-icon positioning.
- Updated the web README, UI plan, and user-path review.

## Files Changed

- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: move the role icon from the portrait node into the summary boundary.
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: position and scale the boundary icon while reserving portrait space.
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: verify the empty portrait and boundary icon.
- `projects/western_fantasy_continent/border_village_war_web/README.md`: document the boundary treatment.
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: record the intended card hierarchy.
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: record the asset-confusion finding.

## Validation

- `node --check projects\western_fantasy_continent\border_village_war_web\border-village-web.js`: PASS.
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS.
- `git diff --check`: PASS; only existing LF-to-CRLF warnings were reported.
- No server or browser was started.

## Current State

The upper region is now a clean portrait slot. The profession icon acts as a small bridge across the divider instead of occupying the art space, and the lower information remains compact and readable.

## Unresolved

- Final portrait assets are still unavailable.
- Exact icon size and overlap may need one more visual adjustment after local review.

## Recommended Next Step

Review this boundary treatment in the local workbench. If accepted, continue to the next formation-screen element rather than adding more information to the card.
