# Agent Handoff: Town Loop App Shell Navigation

- Date: 2026-07-04
- Agent/thread: Codex town-loop app-shell pass
- Scope: Convert only `town_loop` internal navigation toward an app-shell pattern so the floating combat dock survives page switches.
- Status: complete

## User Intent

The user wants the town simulator's battle window to behave like a persistent floating app layer across town pages instead of resetting whenever the player switches between town, region, team, warehouse, and recruit screens. The user also asked whether shared skills, stats, and global combat data would be affected.

## Completed

- Added `town_loop`-local app-shell navigation:
  - internal town links are intercepted;
  - the target HTML is fetched;
  - only the `.town-shell` main content is replaced;
  - the rest of the document, including the global battle dock, stays alive.
- Added `currentPage` state and refreshable element references so the same script can rerender after swapping the page body content.
- Added back/forward support through `popstate`.
- Added fallback behavior: if shell navigation cannot find a valid town target, it falls back to normal full-page navigation.
- Kept preview battles from leaking when leaving the region page by stopping detached non-grind previews before swapping shell content.
- Left shared game modules untouched:
  - no edits to `game_data/skill-data.js`;
  - no edits to `game_data/build-layers.js`;
  - no edits to `game_data/combat-sim.js`;
  - no edits to global combat/equipment formulas.

## Files Changed

- `projects/western_fantasy_continent/town_loop/town-loop.js`: added shell navigation, dynamic page detection, element refresh, and detached preview cleanup.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node -c projects\western_fantasy_continent\town_loop\town-loop.js`: passed.
- Local server health check on `http://localhost:3777/api/health`: passed with `200`.
- `Invoke-WebRequest` for `http://localhost:3777/town_loop/regions.html`: passed with `200`.
- Static route/content check:
  - all five `town_loop` pages have `data-page`;
  - all five pages have `.town-shell`;
  - all five pages load `town-loop.js`;
  - shared skill/build/combat scripts remain imported by HTML but were not modified.
- Browser plugin validation was attempted, but the in-app browser reported a local URL policy/error page for localhost. A separate Chrome DevTools validation attempt also failed because the debug endpoint reset the connection in this environment. Because of that, the interaction-level check is still best verified manually in the app browser.

## Current State

Within `town_loop`, clicking town navigation should now behave more like a single app: the main page content changes while the floating combat dock remains attached to the document. This is intentionally scoped to the town simulator only.

Shared skills, profession data, combat formulas, build layers, and equipment math should not be affected by this pass.

## Unresolved

- Manual visual/play validation is still recommended:
  - start grind on `/town_loop/regions.html`;
  - switch to team/warehouse/recruit/town through the top nav;
  - confirm the floating battle dock does not disappear or restart from a full page reload.
- The current implementation is still plain HTML/JS app-shell navigation, not Electron/Steam packaging. It is compatible with that direction but not a complete desktop runtime.
- One legacy mojibake display line still uses the old `page` alias. The alias is deliberately kept so it does not break; cleanup can happen during a future text-encoding/UI polish pass.

## Recommended Next Step

Manually play the town loop with an active grind and switch pages repeatedly. If the shell pattern feels correct, the next architecture step is to extract a formal `town_app_shell` module and later make that the boundary that an Electron/Steam wrapper would host.
