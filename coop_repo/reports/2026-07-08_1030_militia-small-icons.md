# Agent Handoff: Militia Small Icons

- Date: 2026-07-08
- Agent/thread: Codex
- Scope: small visual product pass for militia differentiation in the militia progression lab
- Status: complete

## User Intent

The user playtested the militia progression lab and said the direction is right, but militia icons should be visibly smaller than normal heroes so players can immediately feel the difference between militia and full characters.

## Completed

- Added a militia-specific class to roster cards in the militia progression lab.
- Added `unitKind` to militia progression battle specs so shared `battle-view` can distinguish militia visually.
- Added a shared `battle-view` militia class that shrinks militia battle avatars, name text, and HP bar width.
- Shrunk militia roster portraits and slightly softened their label treatment.
- Did not change combat stats, equipment, progression, or battle logic.

## Files Changed

- `projects/western_fantasy_continent/militia_progression_lab/app.js`: adds `militia` class to militia roster cards.
- `projects/western_fantasy_continent/militia_progression_lab/militia-progression-core.js`: passes `unitKind` through generated battle specs.
- `projects/western_fantasy_continent/militia_progression_lab/styles.css`: shrinks militia roster portraits.
- `projects/western_fantasy_continent/battle_view/battle-view.js`: preserves `unitKind` and adds `militia-unit` class during render.
- `projects/western_fantasy_continent/battle_view/battle-view.css`: shrinks militia battle avatars and related labels.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node --check projects/western_fantasy_continent/militia_progression_lab/app.js`: passed.
- `node --check projects/western_fantasy_continent/militia_progression_lab/militia-progression-core.js`: passed.
- `node --check projects/western_fantasy_continent/battle_view/battle-view.js`: passed.
- Static grep confirmed `unitKind`, `hero-card militia`, and `militia-unit` are wired through.

## Current State

Militia now read as visually smaller both in the roster list and in battle playback, while full heroes keep the existing normal size.

## Unresolved

- Browser visual smoke was not run, so final pixel feel still needs a quick playtest.
- This only handles militia from the militia progression lab. Other pages must pass `unitKind: "militia"` if they want the same shared battle-view treatment.

## Recommended Next Step

Reload `/militia_progression_lab/`, reset if needed, and check whether the size difference makes militia feel like temporary, weaker bodies without making them hard to read in combat.
