# Agent Handoff: Equipment V2 Follow-up and Drop Logic Bug

- Date: 2026-07-02
- Agent/thread: Codex desktop
- Scope: equipment generation v2 follow-up, simulation interpretation, and drop logic bug
- Status: partial; formula implemented, simulation drop logic needs correction

## Related Reports

Read these first for the full context instead of duplicating details here:

- `2026-07-02_1910_global-mechanic-curves.md`: global mechanic curve asset, point-to-effect conversion, build-layer integration.
- `2026-07-02_1928_equipment-generation-v2.md`: equipment generation v2 implementation and validation.
- `2026-07-02_1549_super-waterline-equipment-grind.md`: super waterline construction and original equipment-grind stress test.

## User Intent

The user challenged the equipment progression interpretation after seeing low scores against the super waterline, asking whether 150-level mythic equipment was really that weak. The goal was to clarify whether the issue was equipment strength or the simulation/drop logic.

## Completed

- Confirmed that equipment generation v2 is implemented:
  - Equipment tier maps to equipment level.
  - Level provides base hard stats.
  - Rarity provides affix line count.
  - Mechanic affixes are point values and use the global curve asset.
- Corrected a conceptual mistake in the v2 pass:
  - Equipment base stats should not produce direct percentage-style stats.
  - Removed legacy base `attackSpeed`, `skillHaste`, `effectPower`, `effectResist`, and `receivedHealing` sources from production.
  - These concepts should only appear as affix point lines if used.
- Validated current base stat pools:
  - Weapon: physical power or magic power.
  - Helm: HP and armor.
  - Chest: HP and armor.
  - Gloves: physical power and armor.
  - Legs: HP and armor.
  - Boots: HP and armor.
  - Ring: physical power or magic power.
  - Charm: HP or magic power.
- Reran the current super-waterline equipment grind simulation after this cleanup:
  - Average end average: 0.125
  - Average delta: 0.099
- Investigated why the score stayed low.

## Key Finding

The low score does **not** mean 150-level mythic gear is weak.

The current grind simulation decides drop tier from the team's score against the super waterline:

```text
score > 0.85 -> Tier 5
score > 0.62 -> Tier 4
score > 0.38 -> Tier 3
score > 0.18 -> Tier 2
otherwise -> Tier 1
```

Since teams score only around `0.02` to `0.125` against the super waterline, they mostly receive Tier 1 drops, which now map to level 20 equipment. The low result is therefore testing low-level gear against the hardest bucket, not full 150 mythic gear.

## 150 Mythic Sanity Check

A forced sanity test was run by giving representative teams full level-150 mythic-style gear. Against 48 sampled super-waterline teams:

- `fireBurst`: 48/48 wins
- `bloodRage`: 48/48 wins
- `ironWall`: 48/48 wins
- `shadowExecute`: 48/48 wins
- `poisonBloom`: 48/48 wins
- `holySustain`: 48/48 wins

This confirms 150-level mythic gear is extremely strong. The problem is the simulation's drop progression logic, not the gear ceiling.

## Files Changed In This Follow-up

- `projects/western_fantasy_continent/equipment_grind_simulator/equipment-grind-simulator.js`
  - Removed percentage-style base stat production from slot base pools.
- `projects/western_fantasy_continent/design/equipment_progression/equipment-generation-v2.md`
  - Updated to state direct percentage-style stats should not be equipment base stats.
- `coop_repo/reports/2026-07-02_1928_equipment-generation-v2.md`
  - Updated validation/current-state notes to include this correction.
- `coop_repo/reports/2026-07-02_1938_equipment-v2-followup-and-drop-bug.md`
  - This report.
- `coop_repo/LATEST.md`
  - Updated to point here.
- `coop_repo/REPORT_INDEX.md`
  - Indexed this report.

## Validation

- `node -c projects\western_fantasy_continent\equipment_grind_simulator\equipment-grind-simulator.js`: passed.
- `node -c projects\western_fantasy_continent\game_data\simulate-current-equipment-grind-super.js`: passed.
- Base stat extraction check confirmed no direct percentage-style base stats remain.
- Full super-waterline grind simulation reran successfully.
- Forced level-150 mythic sanity test confirmed all 6 representative presets beat 48/48 sampled super-waterline teams.

## Unresolved

- The grind simulation's drop tier logic is wrong for the current purpose. Drop level should come from dungeon/region level, not from score against the super waterline.
- The super waterline is useful as a pressure benchmark, but it should not drive loot quality directly.
- The forced 150 mythic sanity test used synthetic maximal gear, not naturally generated inventory.
- UI was not browser-validated after the base stat cleanup.

## Recommended Next Step

Fix the equipment grind simulation progression model:

1. Separate "loot source level" from "benchmark score."
2. Let dungeon/region level decide equipment level range.
3. Let rarity table decide affix count/quality.
4. Use the super waterline only to evaluate resulting team strength.
5. Rerun an 8-scenario equipment grind test with a realistic dungeon progression path.
