# Agent Handoff: Prebattle Formation Picker

- Date: 2026-08-07
- Agent/thread: Codex primary thread
- Scope: Border village prebattle formation selection and authoritative deployment
- Status: complete

## User Intent

Give every battle a formation type and participant capacity, show all player formations sorted by eligibility, allow clicking to switch formations, and dedicate space to the selected formation's information.

## Completed

- Defined public battle formation rules: hunt and training use 4-unit formations, raids use 8-unit formations, and the final battle uses a 20-unit formation.
- Rebuilt the prebattle dialog around a left formation picker and right selected-formation detail surface.
- Sorted every unlocked player formation into three visible groups: matching and legal, matching but illegal, then size mismatch.
- Kept invalid and mismatched formations selectable for inspection; the persistent action button becomes visibly unavailable and the detail header explains why.
- Added selected-formation capacity, city, total combat power, positioned members, known enemies, resource costs, and training's fixed trainee note.
- Passed the selected member IDs and positions into actual combat plans, authoritative result reconstruction, and subsequent continuous-grind rounds.
- Kept the legacy automatic-party combat API working when no formation deployment is supplied.
- Corrected final-battle action display to zero action points.
- Updated design, review, core, and web documentation.

## Files Changed

- `projects/western_fantasy_continent/border_village_war/border-village-core.js`: accept validated 4/8/20-unit deployments, build actual teams from member IDs and positions, and reconstruct settlement with the same deployment.
- `projects/western_fantasy_continent/border_village_war/verify-border-village.js`: test hunt, training, raid, and final formation capacities and position order.
- `projects/western_fantasy_continent/border_village_war/README.md`: document the optional authoritative deployment contract.
- `projects/western_fantasy_continent/border_village_war_web/index.html`: add battle-rule, formation-list, and selected-detail regions to the prebattle dialog.
- `projects/western_fantasy_continent/border_village_war_web/border-village-web.js`: sort, select, inspect, validate, launch, settle, and persist prebattle formations.
- `projects/western_fantasy_continent/border_village_war_web/styles.css`: implement the two-column prebattle hierarchy and visible eligibility states.
- `projects/western_fantasy_continent/border_village_war_web/verify-static-web.js`: verify sorting, selection, blocked reasons, actual deployment, position propagation, and settlement.
- `projects/western_fantasy_continent/border_village_war_web/README.md`: document the player-facing flow.
- `projects/western_fantasy_continent/border_village_war_web/UI_PLAN.md`: record battle capacities, hierarchy, and attention budget.
- `projects/western_fantasy_continent/border_village_war_web/USER_REVIEW.md`: add the prebattle selection user-path review.

## Validation

- `node projects\western_fantasy_continent\border_village_war\verify-border-village.js`: PASS, including selected 4/8/20-unit teams and formation position order.
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-input-boundary.js`: PASS.
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-sealed-surface.js`: PASS; 17 audited requests, day 7 reached, no future-information leak reported.
- `node projects\western_fantasy_continent\border_village_war\verify-border-village-winning-route.js`: PASS; final result `灰谷村守住了`.
- `node projects\western_fantasy_continent\border_village_war_web\verify-static-web.js`: PASS, including selected-team authoritative combat and settlement.
- `git diff --check`: PASS; only existing LF-to-CRLF warnings were reported.
- No server or browser was started.

## Current State

Opening any battle now selects the first matching legal player formation by default while still displaying every other formation in the requested order. Clicking any formation refreshes the right-side details. Only a non-empty, legal, capacity-matching, resource-affordable formation can launch. The chosen members and formation positions now determine the real battle team and are reused for authoritative settlement.

## Unresolved

- Final pixel-level layout review remains for the user's local workbench session because no browser was launched.
- Cross-city legality is enforced by the frontend formation state; the current first chapter has only Greyvale members, so the core deployment contract does not yet carry multi-city metadata.
- Training adds its trainee outside the selected 4-unit formation, as explicitly displayed in the preview.

## Recommended Next Step

Play one hunt, one raid, and the final battle from the local workbench to review dialog density and confirm that the chosen formation and position order feel obvious before entering combat.
