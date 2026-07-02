---
name: game-ui-flow-contract
description: Design or repair game UI by first writing a page responsibility contract, click-action contract, formation/placement contract, and validation checklist. Use when an interface is technically functional but feels confusing, when page responsibilities are mixed, when one click does multiple hidden things, when roster/equipment/team/dungeon screens blur together, or before implementing RPG team, equipment, loot, dungeon, combat setup, or workbench flows.
---

# Game UI Flow Contract

## Purpose

Use this skill before implementing or revising game UI screens where the user is angry because the interface is confusing, not merely ugly.

This skill prevents these failures:

- One click secretly performs several actions.
- A page owns the wrong task, such as equipment pages opening team-detail modals.
- Arrays or creation order stand in for visible placement.
- Data is visible but the player's next action is unclear.
- Debug/designer information leaks into player-facing screens.

Use `signal-based-ui-planner` first when the screen is very dense or novel. Use `game-ui-designer` after this skill for visual styling.

## Required Output Before Code

Before editing UI code, write a short contract:

```text
Screen:
Primary job:
Must not do:
Primary object:
Primary action:
Secondary actions:
State shown:
State changed:
```

For multi-page tools, write one contract per page. If two pages share the same primary job, merge them or move one job.

## Page Responsibility Rules

Each page gets one main job.

- Dungeon page: choose challenge, preview enemy, start fight, see immediate result/reward.
- Team page: choose active party, set formation/positions, inspect character details.
- Equipment page: choose current character, compare equipment, equip items.
- Loot page: inspect recent drops and backpack inventory.
- Debug page: expose logs, signals, raw metrics, and test controls.

Do not put character-detail inspection on the equipment page unless it directly supports equipping.
Do not put equipment-changing controls in the team page unless the page is explicitly a combined loadout editor.
Do not let combat/debug logs dominate player setup screens.

## Click-Action Contract

Every clickable element must have exactly one primary meaning.

Bad:

```text
click hero card = select hero + open modal + maybe change team
```

Good:

```text
click hero card = select hero
click 上阵 = toggle active state
click 前排/后排 = change formation
click 详情 = open detail modal
click 装备 = equip selected item
```

If a click changes persistent state, make that state visible near the clicked object.
If an action opens a modal, the button label must say so.
If an action changes combat order or placement, show that placement visually.

## Formation And Placement Rules

Never use roster order as invisible combat placement.

For any team builder or auto-battle setup, prefer a visible board:

```text
Front: [slot] [slot]
Back:  [slot] [slot]
Bench: remaining characters
```

If exact slots are not implemented yet, use explicit front/back controls and visibly label each active hero.

Combat order should be derived from visible formation state, not array index.

## Equipment Flow Rules

The equipment page primary chain is:

```text
select character -> select bag item/equipment slot -> compare -> equip
```

Rules:

- Selecting a character must not open a character-detail modal.
- Selected character and equipped slots must be adjacent.
- Bag grid and comparison/action panel must be adjacent.
- Item cells show icon, rarity, slot, tier, and selected/equipped state only.
- Long skill text belongs in character detail, not repeated on equipment cards.
- Do not add unequip/remove unless the game design explicitly wants empty slots.

## Modal Rules

Use modal only for focused inspection or confirmation.

- Modal open requires an explicit button such as `详情`, `比较`, or `确认`.
- Modal must not open from a primary selection click.
- Modal content must not replace page responsibilities.
- If a modal contains equipment, it is display/inspection unless it has explicit equip actions.

## Validation Checklist

Before reporting done:

- Can the user explain each page's job in one sentence?
- Does each clickable element have one obvious effect?
- Is selected state visible?
- Is changed state visible near the control?
- Can the player set formation without knowing array order?
- Does equipment selection stay inside the equipment flow?
- Does character inspection stay inside the team/detail flow?
- Are debug details hidden unless debugging is the page's job?
- Run syntax checks.
- If possible, open the UI and perform the main path manually.

## Repair Workflow

When fixing an existing bad UI:

1. List the user's concrete complaints.
2. Convert each complaint into a broken contract.
3. Write corrected page and click contracts.
4. Make the smallest code change that enforces the contract.
5. Add missing visible state before adding more styling.
6. Only then improve visual polish.

## Escalation Rule

If a page still needs several unrelated primary actions, stop and split it into separate pages or modes before adding more panels.
