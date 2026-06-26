---
name: game-ui-designer
description: Design readable, game-like frontends for games and game tools. Use when Codex builds or revises game UI, RPG inventory/equipment screens, combat HUDs, map screens, character panels, taverns, loot screens, dungeon menus, tool overlays, or any frontend where game information hierarchy, visual hierarchy, player decision flow, and interaction feedback matter.
---

# Game UI Designer

## Routing Rule

Use `signal-based-ui-planner` first when the interface is complex, dense, novel, multi-state, or mixes player-facing UI with debug/designer information. That planner decides intent, core object, hierarchy, attention budget, and control choice.

Use this `game-ui-designer` skill directly when the screen is common and simple, such as a straightforward inventory, combat HUD, map panel, menu, modal, or small tool surface.

After designing or implementing a UI, use `../user-review/SKILL.md` when the task flow may be incomplete, the player may need to recover from choices, or the user asks whether the interface is convenient, missing controls, or hard to use.

## Core Rule

Do not start by placing data on the page. Start by defining the player's current decision.

Every game UI should answer these in the first screenful:
- Who am I controlling or editing?
- Where am I?
- What can I do next?
- What changes if I click this?
- What reward, danger, or status changed recently?

## Workflow

1. Identify the main decision path.
   Example for RPG equipment: character -> equipment slot -> inventory item -> stat comparison -> equip action.

2. Split information into layers.
   - Primary: current actor, current action, selected object, main outcome.
   - Secondary: stats, rarity, level, costs, cooldowns, requirements.
   - Tertiary: logs, flavor text, long descriptions, raw debug details.

3. Sketch the layout before implementation.
   Use a short text wireframe when the UI is non-trivial:
   `left: character/equipped`, `center: interactive grid/map/combat`, `right: selected detail/action`.

4. Choose visual roles.
   - Icons communicate item/category/type.
   - Color communicates state, rarity, threat, improvement, or selection.
   - Size and position communicate importance.
   - Motion/floaters communicate immediate feedback.

5. Implement the main path first.
   Make the most common player action obvious before adding optional panels.

6. Review with the checklist below before finishing.

## Layout Patterns

### Inventory And Equipment

Prefer:
- Left: selected character, portrait, power, equipped slots.
- Center: fixed-size inventory grid with icons.
- Right: selected item detail, stat comparison, primary equip button.

Avoid:
- Long text-only item lists.
- Showing every stat inside every inventory cell.
- Letting low-value items push high-rarity items out of view.
- Mixing roster, backpack, logs, tavern, and combat into one flat page.

Inventory cells should show only:
- icon
- rarity border/color
- tier or level
- equipped/selected state

Item details should show:
- full name
- slot
- rarity/tier/level
- comparison against currently equipped item
- affixes
- primary action

### Combat HUD

Prefer:
- Combat space remains visually dominant.
- Health bars and damage floaters are near units.
- Skill events get stronger visual treatment than basic attacks.
- Logs summarize phase changes, drops, growth, and debugging breakpoints.

Avoid:
- Large side panels squeezing the combat field.
- Damage and reward feedback appearing only in text logs.

### World Map

Prefer:
- Map is the main surface.
- Regions have visible level/threat/reward identity.
- Monsters, resources, and party position are visually distinct.
- Side panels are fixed-size and scroll internally.

Avoid:
- Lists that grow and resize the map.
- Having players click abstract text instead of map objects when the fantasy is exploration.

## Visual Rules

- Use stable grid sizes for bags, equipment slots, maps, boards, and HUD counters.
- Keep cards to actual repeated items, modals, and tool panels. Do not put cards inside cards.
- Use restrained fantasy materials: stone, iron, parchment, leather, gold accents, colored rarity glows.
- Do not let decorative styling hide state. State beats ornament.
- Use color consistently:
  - green/teal: gain, heal, success
  - red/orange: damage, danger, loss
  - gold: reward, selected action, legendary value
  - blue/purple: magic, rare/epic value
- Keep text short inside compact UI. Move detail into the selected-detail panel.
- Use icons or symbols for repeated game concepts where possible.
- Keep the primary action button visually obvious and singular.

## Interaction Feedback

Every important click should create immediate feedback:
- selected state changes
- numbers show delta, not only final value
- equipped items get an equipped marker
- power/stat increases may float upward
- loot pickups should appear in world space before entering inventory
- logs should record meaningful phase/growth breakpoints, not every tiny tick

## Self Review Checklist

Before finalizing a game UI, verify:
- The player can identify the main interactive area in 2 seconds.
- The most likely next click is visually obvious.
- The UI is not a raw data table unless it is explicitly a debug tool.
- Inventory/backpack uses fixed grid cells, not text rows.
- Rarity and equipped/selected states are visible without reading full names.
- Details are shown for the selected object instead of duplicated everywhere.
- Panels do not resize the map/combat area as content grows.
- Text does not overflow compact buttons, slots, or cells.
- The screen has a game-like visual language, not a generic admin dashboard.
- If possible, take a screenshot and inspect the actual rendered layout before reporting done.

## Useful Comparison Method

When improving UI quality, create a quick before/after:
- Before: naive functional layout.
- After: same features, reorganized by player decision path and visual hierarchy.

Use this when evaluating whether the skill improved the result.
