# Agent Handoff: Town Loop Global Visible Battle

- Date: 2026-07-03
- Agent/thread: Codex town-loop battle visibility fix
- Scope: Keep combat visible while navigating town-loop pages.
- Status: complete

## User Intent

The user clarified that a game loop cannot hide combat. If true persistent battle cannot survive page navigation, the implementation should have two layers: visible foreground combat on the current page and background simulation/settlement when needed.

## Completed

- Added `battle-view` CSS/JS to all town-loop pages:
  - town overview;
  - team prep;
  - warehouse;
  - recruitment.
- Added a global visible battle dock for non-region pages.
- When grind is active:
  - the region page uses the large existing battle panel;
  - all other pages show a fixed compact battle panel.
- When a town page loads while grind is already active, it starts a visible battle on that page.
- When a visible battle finishes and grind is still active, it schedules the next visible battle.
- Existing background simulation remains as a fallback/status layer.
- Added a stop button inside the global battle dock.

## Files Changed

- `projects/western_fantasy_continent/town_loop/index.html`: added battle-view assets.
- `projects/western_fantasy_continent/town_loop/team.html`: added battle-view assets.
- `projects/western_fantasy_continent/town_loop/warehouse.html`: added battle-view assets.
- `projects/western_fantasy_continent/town_loop/recruit.html`: added battle-view assets.
- `projects/western_fantasy_continent/town_loop/styles.css`: added fixed global battle dock styling.
- `projects/western_fantasy_continent/town_loop/town-loop.js`: added global battle dock creation, visual battle mounting outside region page, and continuous visible battle restart while grinding.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node -c projects/western_fantasy_continent/town_loop/town-loop.js`: passed.
- Browser check:
  - opened `/town_loop/regions.html`;
  - clicked `开始挂机`;
  - confirmed region battle view entered `交战中`;
  - navigated to `/town_loop/team.html`;
  - confirmed a global battle dock appeared;
  - confirmed the global dock battle view was also `交战中`;
  - no project console errors were reported.

## Current State

Town-loop grind now has visible combat on every main page. Page navigation may restart the visual battle representation, but the player is no longer left staring at static management UI while the grind silently runs.

## Unresolved

- This is not true single-instance battle persistence across page navigations; it is a visible current-page battle layer plus background state.
- The compact dock may need layout tuning if it covers important controls on smaller screens.

## Recommended Next Step

Play with grind active while switching between town, team, warehouse, and recruit pages. If the dock blocks too much UI, tune its size/position or add collapse/expand.
