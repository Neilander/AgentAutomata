# Agent Handoff: Attribute Equipment Layer Direction

- Date: 2026-06-30
- Agent/thread: Codex desktop
- Scope: equipment/attribute architecture direction after the first auto-iteration loop
- Status: complete

## User Intent

The user clarified the current task line after reviewing the five equipment attempts:

- Attempts 1-3 were useful for equipment rule design and static evaluation.
- Attempts 4-5 used proxy mapping only because there was no clean combat entry point for attributes/equipment.
- The next main task should not continue tuning that proxy.
- The next main task should make character growth and equipment bonuses enter combat through a proper additive layer.

The user specifically asked to evaluate two approaches:

1. Keep character base stats unchanged. Every character starts with 0 attribute points, and points/equipment add bonuses on top.
2. Convert each character's existing base stats into an initial attribute allocation.

## Completed

- Aligned on the preferred architecture: use option 1.
- Recorded that existing character base stats should remain the class/spec baseline.
- Recorded that attributes and equipment should be treated as an extra build layer above the baseline, not as a replacement for baseline stats.
- Reframed the next task away from equipment proxy tuning and toward a formal shared modifier pipeline.

## Files Changed

- `coop_repo/reports/2026-06-30_2116_attribute-equipment-layer-direction.md`: new handoff report for the next agent.
- `coop_repo/LATEST.md`: updated to point to this report.
- `coop_repo/REPORT_INDEX.md`: indexed this report.

## Validation

- No code was changed.
- Manual review only:
  - Read `coop_repo/LATEST.md`.
  - Read the previous report `2026-06-30_1338_equipment-auto-iteration-goal-complete.md`.
  - Checked the current worktree before writing this handoff.

## Current State

The recommended architecture is:

```text
role/class base stats
+ attribute point bonuses
+ equipment base stats
+ equipment affix modifiers
= final combat unit
```

Important constraints:

- Do not rebalance role base stats as part of this step.
- Do not rewrite skill data as part of this step.
- Stop treating equipment validation as a temporary conversion into fake attack/HP where possible.
- A combat change is acceptable only if it creates a clean input/read path for real modifiers, for example `attributePoints`, `equipment`, or `equipmentModifiers`.

Preferred interpretation:

- Base stats represent innate class/spec identity.
- Attribute points represent build growth.
- Equipment represents loot/build customization.
- It is acceptable that two characters with the same added points still differ because their base stats differ.

Rejected/paused interpretation:

- Do not attempt to reverse-map all existing role base stats into initial attribute points right now.
- That would increase risk, blur existing balance work, and force awkward mappings for things like range, skill structure, attack type, targeting, and role identity.

## Unresolved

- The formal implementation of the additive layer is not done yet.
- The equipment affix registry still needs review after the modifier layer exists.
- The old combat proxy validation files are useful as a historical test harness but should not be treated as final balance truth.
- Existing attribute route scripts already clone units and add bonuses, but that logic is analysis-local; it is not yet a shared combat/build system.

## Recommended Next Step

Start by creating a shared attribute/stat modifier module, then update combat entry points to use it.

Suggested first implementation shape:

1. Extract the accepted v2 attributes and per-point conversions into a shared module:
   - `武力 / might`
   - `坚韧 / fortitude`
   - `敏捷 / agility`
   - `奥术 / arcana`
   - `节律 / rhythm`
   - `韧性 / resilience`
2. Provide a pure function such as:

```js
applyBuildLayers(baseSpec, {
  attributePoints,
  equipmentItems,
  equipmentModifiers,
})
```

3. The function should return a cloned final combat spec and never mutate source role data.
4. Wire existing attribute-route analysis to this shared function instead of duplicating the conversion locally.
5. Only after that, reconnect equipment affixes to real modifier fields and rerun static evaluation plus waterline/matrix validation.

Highest-value files to read first:

- `projects/western_fantasy_continent/game_data/analyze-attribute-build-routes-v2.js`
- `projects/western_fantasy_continent/game_data/combat-sim.js`
- `projects/western_fantasy_continent/game_data/equipment-affix-registry.js`
- `projects/western_fantasy_continent/game_data/equipment-combat-validation.js`
- `projects/western_fantasy_continent/design/equipment_auto_iteration/equipment-combat-variant-comparison.md`
