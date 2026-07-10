# Agent Handoff: Camp One-Shot And Main Farming

- Date: 2026-07-10
- Agent/thread: Codex
- Scope: `/map_progression_lab/` farming ownership correction
- Status: complete

## User Intent

Correct the previous implementation: Camp is a one-time key encounter and must not be repeat-farmable. Explain the current main-level drop rates.

## Completed

- Restricted repeat farming to cleared main nodes only.
- Camp and other branch nodes now remain completed after first clear.
- After another Prison loss, focus moves to the latest cleared main node instead of Camp.
- Updated the batch cognition policy to farm the latest cleared main before retrying Prison.
- Recorded the current Region 1-3 main drop tables.

## Files Changed

- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: main-only repeat farming and latest-main failure focus.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-cognition-core.js`: main-only farmable status.
- `projects/western_fantasy_continent/game_data/analyze-map-cognition-batch.js`: latest-main farming fallback.
- `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-10_1225_camp-one-shot-main-farming.md`: design correction and drop table.

## Validation

- Syntax checks passed for page, cognition core, and batch analyzer.
- 200-run batch: Camp attempted exactly 200 times; 99% completed within 30 actions; no logical deadlock.

## Current State

The first-region ownership is now:

```text
Camp: one-time concentrated key reward
Main levels: repeatable equipment farming
Prison: character lock/reward
```

## Unresolved

- All main levels inside one region currently share the same drop table; deeper nodes do not yet improve level range or rarity.
- 1% of sampled seeds exceeded the 30-action cap while farming for enough Prison strength.

## Recommended Next Step

Decide whether main-node depth should increase item level, drop count, rarity, or only enemy difficulty. The current implementation only changes enemy difficulty; the drop table is uniform within each region.
