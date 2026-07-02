# Agent Handoff: Equipment UI Team Interaction Fix

- Date: 2026-07-01
- Agent/thread: Codex desktop
- Scope: equipment grind simulator team/equipment UI interaction
- Status: complete

## User Intent

The user rejected several UI behaviors:

- Clicking a hero on the equipment page should not open the character/equipment display modal.
- Clicking a hero card should select/switch the current hero, not also open details.
- Character equipment/detail display belongs on the team page and should use a separate action.
- Team order should not just follow roster order 1-6; the player needs explicit front/back controls.
- Equipment should not have a remove/unequip flow.

## Completed

- Hero card click now only selects the hero and clears selected item.
- Character modal now opens only through a dedicated `详情` button.
- The `详情` button is rendered only on the team page.
- Equipment page hero strip no longer exposes the character modal action.
- Added `formation` state to heroes:
  - default first two heroes: `front`
  - remaining heroes: `back`
  - old saves are normalized with the same fallback
- Added `前排` / `后排` buttons to roster cards.
- `activeHeroes()` now sorts by formation first, then roster order.
- Battle preview/fight uses that sorted active hero order.
- No unequip button or remove flow was added.

## Files Changed

- `projects/western_fantasy_continent/equipment_grind_simulator/equipment-grind-simulator.js`
  - adjusted roster click behavior;
  - added formation state and controls;
  - moved modal opening to a dedicated team-page button;
  - sorted active combat units by front/back formation.
- `projects/western_fantasy_continent/equipment_grind_simulator/styles.css`
  - added compact button group styling for hero actions;
  - kept equipment-page hero strip compact by hiding action buttons there.

## Validation

- `node -c projects/western_fantasy_continent/equipment_grind_simulator/equipment-grind-simulator.js`: passed.

## Current State

The interaction contract is now:

- Equipment page:
  - click hero = select current hero for equipment.
  - no character modal.
- Team page:
  - click hero = select hero.
  - `详情` button = open character/equipment modal.
  - `前排` / `后排` buttons = control combat ordering.
- Combat:
  - active front-row heroes enter first.
  - active back-row heroes enter after front-row heroes.

## Unresolved

- Front/back is currently a two-bucket ordering system, not exact 4-slot drag/drop placement.
- There is no visual board/grid yet for exact front/back positions.
- Manual browser click-through still needs to be done in a stable local browser session.

## Recommended Next Step

If the two-bucket front/back control is accepted, the next UI pass should replace the roster-only team setup with a small formation board:

```text
Front: [slot] [slot]
Back:  [slot] [slot]
Bench: remaining heroes
```

That would make placement visible instead of only button-driven.
