# Agent Handoff: Game UI Flow Contract Skill

- Date: 2026-07-01
- Agent/thread: Codex desktop
- Scope: project UI skill and equipment grind redesign contract
- Status: complete

## User Intent

The user asked to preserve the lessons from the recent failed UI work as a reusable project skill, because the existing UI skill did not prevent confusing interaction design. The user also asked to use the new skill to redesign the current equipment/team/dungeon defects.

## Completed

- Added a new project skill:
  - `projects/western_fantasy_continent/skills/game-ui-flow-contract/SKILL.md`
- Updated the project skills README to list the new skill.
- Added a first application of the skill to the equipment grind simulator:
  - `projects/western_fantasy_continent/design/equipment_grind_ui_flow_contract_v1.md`

## Files Changed

- `projects/western_fantasy_continent/skills/game-ui-flow-contract/SKILL.md`
  - New UI repair workflow focused on page responsibility, click-action contracts, formation/placement rules, equipment flow, modal rules, and validation.
- `projects/western_fantasy_continent/skills/README.md`
  - Added the new skill to the current skills list.
- `projects/western_fantasy_continent/design/equipment_grind_ui_flow_contract_v1.md`
  - Applies the new skill to the equipment grind simulator and defines corrected page/click/formation contracts.

## Validation

- Manual file review completed:
  - Skill frontmatter exists with `name` and `description`.
  - Skill is concise and project-specific.
  - Design contract covers dungeon, team, equipment, and loot pages.

## Current State

The new skill should be used when a game UI is technically functional but confusing, especially when:

- page responsibilities are mixed;
- one click does multiple hidden actions;
- team placement is inferred from array order;
- equipment/team/dungeon flows bleed into each other.

The equipment grind simulator now has a written target contract:

- Dungeon page: fight and rewards.
- Team page: party and formation.
- Equipment page: current character loadout and item comparison/equip.
- Loot page: recent drops and inventory inspection.

## Unresolved

- The design contract has not yet been fully implemented as a formation board.
- Current code still uses a two-bucket `front/back` formation control, not exact slots.
- Manual browser validation remains pending.

## Recommended Next Step

Use `game-ui-flow-contract` before the next UI edit, then implement the first concrete improvement from `equipment_grind_ui_flow_contract_v1.md`:

```text
Team page formation board:
Front: [slot] [slot]
Back:  [slot] [slot]
Bench: remaining heroes
```

This should replace the current roster-first team page and make combat placement visible.
