# Agent Handoff: Equipment Loot Design

- Date: 2026-06-30
- Agent/thread: Codex desktop
- Scope: equipment loot experience design draft
- Status: complete

## User Intent

The user wanted the messy early equipment-loot idea condensed into a design document before implementation. Key points:

- characters need armor/accessory slots plus left-hand/right-hand weapons;
- two-handed weapons should occupy both hands;
- rarity should mostly control affix count, but first validation should only go up to around epic / 4 affixes;
- affix levels may scale steeply, e.g. 1, 2, 4, 7, 12;
- each equipment slot needs restricted affix pools so players cannot stack one extreme stat on every piece.

## Completed

- Added `projects/western_fantasy_continent/design/equipment_loot_experience_v1.md`.
- The draft defines:
  - 8 equipment slots plus two-hand occupancy;
  - rarity-to-affix-count ladder with epic as v1 cap;
  - base stats versus random affixes;
  - steep affix-level budget curve;
  - slot-specific affix restrictions;
  - broad affix categories: major attributes, minor stats, archetype affixes;
  - first implementation boundary and next design steps.

## Files Changed

- `projects/western_fantasy_continent/design/equipment_loot_experience_v1.md`: new equipment loot design draft.
- `coop_repo/reports/2026-06-30_1131_equipment-loot-design.md`: this handoff.
- `coop_repo/LATEST.md`: updated latest pointer.
- `coop_repo/REPORT_INDEX.md`: added this report.

## Validation

- Manual markdown read-through: passed.
- No code validation needed; this is a design-only change.

## Current State

The equipment system now has an agreed draft shape:

- v1 should stop at epic / 4 affixes;
- affix levels can be intentionally steep;
- chest/legs should be survival-biased and not grant direct damage;
- gloves/right-hand weapons are primary direct-output sources;
- accessory and weapons carry most archetype/special build expression;
- two-handed weapons trade off left-hand utility for high output or special mechanics.

## Unresolved

- Exact base stat pools per slot are not yet enumerated.
- Exact random affix pools per slot are not yet enumerated.
- First 20-30 affixes still need to be designed.
- Drop generation pseudocode and preview tooling are still future work.

## Recommended Next Step

Read `equipment_loot_experience_v1.md`, then do a second pass that produces:

1. first-slot base stat pools;
2. slot-specific affix pools;
3. first 20-30 affixes;
4. a simple equipment generator for previewing rolls before combat integration.
