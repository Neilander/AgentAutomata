# Equipment Grind UI Flow Contract v1

This design applies `game-ui-flow-contract` to the current equipment grind simulator.

## Problems To Fix

- Equipment page hero click selected a hero and opened character details at the same time.
- Character equipment/detail inspection was available from the equipment page, where the player is trying to equip items.
- Team order depended too much on roster order instead of visible formation.
- Front/back placement existed only as buttons, not as a board.
- Equipment page and team page still share too much roster-card behavior.

## Page Contracts

### Dungeon Page

```text
Primary job: choose a dungeon and run one fight.
Must not do: edit equipment, inspect long character details, tune debug values.
Primary object: current party versus selected dungeon enemy preview.
Primary action: 开刷一次.
Secondary actions: choose dungeon, reset roster.
State shown: party power, highest clear, selected dungeon, enemy roles, battle preview/result.
State changed: current enemy roll, best clear, loot on win.
```

### Team Page

```text
Primary job: choose the four active characters and set visible formation.
Must not do: equip items as the main flow.
Primary object: formation board.
Primary action: place/remove character in front/back slots.
Secondary actions: open character detail modal, inspect skills/stats.
State shown: front slots, back slots, bench, selected character, active count.
State changed: active party, exact formation order, selected character.
```

Target layout:

```text
top: team power / active count / navigation
center-left: formation board
  Front: [slot] [slot]
  Back:  [slot] [slot]
center-right: selected character summary + detail button
bottom: bench / roster cards
```

### Equipment Page

```text
Primary job: equip the selected character.
Must not do: open full character detail from hero-card click, change formation.
Primary object: selected character loadout.
Primary action: equip selected bag item to selected character.
Secondary actions: select character, select item, inspect item comparison.
State shown: current character, equipped slots, bag grid, selected item comparison.
State changed: selected character, selected item, equipment assignment.
```

Target layout:

```text
top: team power / best clear / navigation
left: compact character selector
center: selected character + equipment slots
right: selected item comparison + equip button
bottom: bag grid
```

### Loot Page

```text
Primary job: inspect recent drops and backpack.
Must not do: change formation or open combat.
Primary object: loot history and inventory.
Primary action: select item for inspection.
Secondary actions: navigate to equipment page to equip.
State shown: recent drops, bag count, item rarity/slot/tier.
State changed: selected item only.
```

## Click Contracts

| Element | Page | Effect |
| --- | --- | --- |
| Hero card | Team | select hero |
| Hero card | Equipment | select current equip target |
| 详情 | Team | open character modal |
| 前排/后排 or formation slot | Team | change formation |
| 上阵/下阵 | Team | change active state |
| Bag item | Equipment/Loot | select item |
| Equip button | Equipment | equip selected item to selected character |
| Equipment slot | Equipment | select currently equipped item for comparison |

No card click should both select and open a modal.

## Formation Contract

Short-term acceptable version:

```text
hero.formation = "front" | "back"
activeHeroes() sorts front before back
```

Better next version:

```text
hero.formationSlot = "front1" | "front2" | "back1" | "back2" | null
```

The better version should show exact slots and use those slots for `slotIndex`.

## Implementation Plan

1. Keep the current emergency fix: equipment page does not open character modal.
2. Replace team page roster-first layout with a formation-board-first layout.
3. Change hero state from two-bucket `formation` to exact `formationSlot`.
4. Render bench separately from active formation.
5. Make `activeHeroes()` sort by exact slot order: `front1`, `front2`, `back1`, `back2`.
6. Keep equipment page as selector + loadout + bag + comparison.
7. Remove any future attempt to add unequip unless explicitly requested.

## Acceptance Checks

- On equipment page, clicking a hero only changes selected hero.
- On team page, clicking a hero only changes selected hero.
- Only `详情` opens the character modal.
- The active party can be understood by looking at front/back slots.
- Combat slot order matches visible formation.
- Equipping remains possible without opening character modal.
