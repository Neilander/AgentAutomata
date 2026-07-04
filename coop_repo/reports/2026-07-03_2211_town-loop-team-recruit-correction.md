# Agent Handoff: Town Loop Team And Recruit Correction

- Date: 2026-07-03
- Agent/thread: Codex town-loop correction pass
- Scope: Correct initial recruit quality, team-slot interaction, and skill-level scaling.
- Status: complete

## User Intent

The user liked parts of the new town-loop UI but identified two design issues:

- starting characters should not roll high skill levels because that removes the later joy of recruiting high-rarity characters;
- the team prep page should clearly separate the current four team positions from the available roster.

The user also proposed a simple skill-level rule: higher skill level should scale the character by about `+10%` per level, so a level 5 skill implies about `+50%` growth.

## Completed

- Changed the town-loop save key so future playtests start from a clean V2 town-loop state.
- Initial six heroes now always start with skill levels `1 / 1 / 1 / 1`.
- Recruited heroes still roll skill levels from the prosperity-based quality band.
- Changed the team prep page from a loose active-character list to four explicit team slots:
  - `前排 1`;
  - `前排 2`;
  - `后排 1`;
  - `后排 2`.
- Available roster cards now focus on selecting a hero or removing an active hero from the team.
- Clicking a team slot assigns the currently selected hero to that position.
- Added skill average display alongside total skill level.
- Replaced the previous rough `skillTotal -> attribute points` combat bonus with a simple skill-level multiplier:
  - multiplier is `1 + max(0, averageSkillLevel - 1) * 0.1`;
  - the multiplier is applied to core combat spec stats;
  - displayed hero power uses the same multiplier.
- Added CSS for filled/empty/selected team slots.

## Files Changed

- `projects/western_fantasy_continent/town_loop/team.html`: renamed the active team panel to emphasize four positions.
- `projects/western_fantasy_continent/town_loop/styles.css`: added team-slot styling.
- `projects/western_fantasy_continent/town_loop/town-loop.js`: corrected initial hero skill levels, recruitment calls, team-slot assignment, and skill-level multiplier logic.
- `coop_repo/LATEST.md`: updated latest handoff pointer.
- `coop_repo/REPORT_INDEX.md`: added this report entry.

## Validation

- `node -c projects/western_fantasy_continent/town_loop/town-loop.js`: passed.
- Browser check on `/town_loop/team.html`:
  - page rendered without project console errors;
  - initial roster has six heroes;
  - all initial heroes show skill average `1.0` and total skill level `4`;
  - current team renders exactly four position slots.

## Current State

The town-loop first playtest now preserves the intended long-term recruitment fantasy: starting heroes are low-rarity, and high skill levels come from prosperity-driven recruitment rather than the initial roll.

The team page now has the intended mental model: select a roster hero, then click one of four team slots to place that hero.

## Unresolved

- The skill multiplier is still character-wide, not per individual skill cast. It is intentionally simple for V1.
- Drag-and-drop team placement is not implemented; placement is click-selected-hero then click-slot.
- Existing browser localStorage under the old save key remains on disk but is no longer used by the new town-loop key.

## Recommended Next Step

Playtest `/town_loop/team.html` and decide whether click-to-slot is enough for V1 or whether the team prep page needs explicit "selected hero" affordance, swap buttons, or drag-and-drop later.
