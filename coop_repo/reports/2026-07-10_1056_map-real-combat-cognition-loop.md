# Agent Handoff: Map Real Combat Cognition Loop

- Date: 2026-07-10
- Agent/thread: Codex
- Scope: `/map_progression_lab/` and player cognition simulation
- Status: partial

## User Intent

Correct two important map-progression modeling mistakes:

1. The world-map lab used fake clears, so it could not truthfully block the player with real combat.
2. Simulated player behavior was not knowledge-bounded enough; after failure, the player should try known behaviors first, then escalate after those explanations fail.

The requested next step was to update the cognition skill with the second point, connect the map lab to real combat, and design node layout, enemies, and drop rules.

## Completed

- Added a "smart-but-knowledge-bounded player agent" section to the lock-key cognition reference.
- Loaded the existing combat simulator into `/map_progression_lab/`.
- Changed map node attempts to call `GAME_COMBAT_SIM.simulateTeams`.
- Added map-lab state for attempts, failures, inventory, equipped gear, and knowledge flags.
- Added lightweight map-lab loot:
  - slots: weapon, armor, focus, boots
  - rarity + level + power
  - auto-equip best item per slot
- Added real-combat node logic:
  - win clears node and grants loot
  - loss does not clear node
  - loss logs a cognition-bounded next behavior
- Added node enemy generation by node type and region scale.
- Added a design record:
  - `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-10_1056_real-combat-cognition-loop.md`

## Files Changed

- `projects/western_fantasy_continent/skills/game-analysis-iteration/references/lock-key-cognition.md`: added knowledge-bounded player-agent behavior rules for subagent playtests.
- `projects/western_fantasy_continent/map_progression_lab/index.html`: loaded runtime field effects and combat simulator before map lab script.
- `projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: added real combat resolution, failures, loot, auto-equip, enemy composition, and drop rules.
- `projects/western_fantasy_continent/design/map_cognition_iterations/2026-07-10_1056_real-combat-cognition-loop.md`: documents the new loop, node design, enemy design, and drop tables.

## Validation

- `node --check projects/western_fantasy_continent/map_progression_lab/map-progression-lab.js`: passed.
- `node --check projects/western_fantasy_continent/game_data/combat-sim.js`: passed.
- Direct `combat-sim` preset smoke test: passed, signals and damage metrics exist for formal preset-vs-preset combat.
- Inline map-style smoke test: ran, but early test units without role kits degraded into weak/long combat; map lab was then patched to inject role kits for player units and enemy small skills.

## Current State

The map lab no longer treats node challenge as guaranteed fake victory. It now has a first-pass real combat gate and failure memory path.

The new progression model is intentionally lightweight. It does not replace the full town equipment system; it only gives the map cognition lab enough truth to test:

```text
fail -> attribute using known knowledge -> farm/equip -> retry -> escalate to role/team only after gear explanation fails
```

## Unresolved

- Browser visual validation was not run in this pass.
- Node strength is not yet calibrated by batch simulation.
- Existing map-lab UI still has legacy mojibake text in places.
- The challenge button label still has some legacy text fallback after the early return path; user-facing text should be cleaned in a later UI pass.
- The map-lab equipment model is simplified and may diverge from the full equipment simulator.

## Recommended Next Step

Open `/map_progression_lab/` fresh, reset the map, and manually check the first lock-key loop:

1. Can a node genuinely fail?
2. Does failure leave it uncleared?
3. Does the page focus the next plausible known behavior?
4. Does farming/equipping visibly improve retry odds?
5. Does prison/camp/prison still feel like cognition rather than scripted theater?

If this loop feels structurally right, the next pass should batch-calibrate region 1 node scales and clean the UI text.
