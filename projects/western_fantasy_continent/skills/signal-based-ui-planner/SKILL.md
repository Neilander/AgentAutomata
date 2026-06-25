---
name: signal-based-ui-planner
description: Plan complex game interfaces from intent, core object, information inventory, hierarchy, attention allocation, and control choice before visual implementation. Use for dense or novel game screens such as combat sandboxes, team builders, equipment systems, encounter labs, maps, multi-state tools, debug/player hybrid pages, or any UI where many signals compete for attention.
---

# Signal-Based UI Planner

## Routing Rule

Use this skill before `game-ui-designer` when the interface is complex, novel, dense, or has multiple player intents.

Use `game-ui-designer` directly when the screen is common and simple, such as a straightforward inventory, basic combat HUD, simple menu, or small modal.

Complex means any of these are true:

- The screen mixes player-facing and debug/designer information.
- There are many same-type choices, such as presets, skills, characters, items, or regions.
- The screen has multiple states, such as setup, combat, result, edit, and debug.
- The main object is unclear or could be replaced by text by mistake.
- A flat layout would show too many cards, stats, logs, or controls at once.
- The user is unhappy because the UI is technically functional but hard to understand.

## Core Rule

Do not start by arranging components. Start by deriving the player intent, core object, required information, page hierarchy, and attention budget.

The most common failure this skill prevents:

> The agent places labels, lists, or debug results in the main area instead of the actual gameplay object.

Example: for a 4v4 arena, the core object is the 4v4 fight itself, not a large "Preset A vs Preset B" text block.

## Workflow

### 1. Define Intent

Write the entry intent in one sentence:

```text
The player enters this screen to ...
```

Also identify screen states if intent changes:

```text
Setup: choose left/right teams and start combat.
Combat: watch the fight and understand key events.
Result: understand why one side won and what to try next.
Debug: inspect logs, signals, and balance evidence.
```

### 2. Identify The Core Object

Ask:

- What is the thing the player is really here to manipulate or observe?
- Does it have a visual form?
- If yes, why is that visual form not the center of the screen?
- Is any text label being mistaken for the object itself?

Examples:

- 4v4 arena: core object is the fight.
- Encounter lab: core object is the enemy challenge plus selected team.
- Equipment screen: core object is selected character plus equipped slots.
- Puzzle screen: core object is the puzzle board/clues.

### 3. List Required Information

Before layout, list information by priority.

```text
P0: must be immediately visible.
P1: required to decide.
P2: required to understand feedback.
P3: useful for recap.
P4: debug/designer information.
```

Anything P4 should default to folded, separate mode, or secondary route unless the current intent is debug.

### 4. Build The Hierarchy Tree

Convert information into a page tree before drawing UI.

Example:

```text
screen
  topbar
    state
    primary action
  left selector
    selected value
    compact control
    selected detail
  core object
    preview/fight/map/board
    action bridge
  right selector
  recap/debug folded area
```

Use the hierarchy to avoid flat pages where every card, log, and stat competes at the same level.

### 5. Allocate Attention Budget

Assign rough attention percentages per state.

Example:

```text
Setup:
left choice 20
core object / preview 38
right choice 20
primary action 12
recap/debug 10

Combat:
combat object 62
event/result summary 20
controls 10
debug 8
```

This does not need exact math. It prevents obvious mistakes.

### 6. Choose Controls To Solve Attention Problems

If a region has too many same-level items, do not show them all as large cards by default.

Use controls:

| Problem | Control |
| --- | --- |
| Many options, only selected value matters | Dropdown |
| Few mutually exclusive modes | Segmented control |
| Many icons/items need scanning | Grid |
| Multiple objects need comparison | Compact list plus selected detail |
| Secondary or debug info | Collapsible panel |
| Too many options to browse | Search/filter |
| Continuous value | Slider/stepper |

Dropdown rule:

> Use a dropdown when many options exist but the player mainly needs the selected value.

Do not use dropdowns when simultaneous visual comparison is the main task.

### 7. Account For Overlay And Z-Layer

Dynamic controls have states:

- closed state: compact, low attention
- open state: overlay, high attention, covers other content

For dropdowns, popovers, modals, tooltips, dragged items, and floating numbers, account for the fact that higher z-layer UI steals attention and covered UI loses attention.

### 8. Output A Design Plan Before Implementation

Before writing code, output:

- intent
- core object
- information inventory
- hierarchy tree
- attention budget
- control choices
- hidden/debug information
- expected player path

Only then use `game-ui-designer` to implement the visual UI.

## Review Checklist

Before approving a design:

- Is the core object directly visible?
- Is the primary action near the object it affects?
- Are repeated choices compressed or structured?
- Is debug information hidden unless debug is the active intent?
- Does the layout change when the player's state changes?
- Does the first strong signal match the current intent?
- Are overlays and dropdown open states considered?
- Can the player explain what to do next within two seconds?

## Reference

For the deeper attention/signal model, read:

`../../design/player-signal-simulation-system.md`
