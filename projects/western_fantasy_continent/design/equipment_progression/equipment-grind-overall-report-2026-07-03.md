# Equipment Grind Overall Report

Date: 2026-07-03

Scope: equipment generation, dungeon drops, recommendation validation, progression curve, and current playable state.

## One-Line Current State

`equipment_grind_v3` is the active playtest branch for the equipment-grind loop: it keeps V2 as the 9-dungeon baseline, adds D10 and revised output pacing, uses level-driven base stats plus rarity-driven affix counts, and now has practical warehouse/auto-equip support.

## Playable Versions

| Version | Role |
|---|---|
| `equipment_grind_v2` | 9-dungeon baseline. Keep it as the older comparison point. |
| `equipment_grind_v3` | Active experiment. Adds D10, revised drop ecology, flow-based recommendations, warehouse cleanup, session loot, and auto-equip. |

## Equipment Formula

The accepted direction is:

```text
equipment strength = level-based base stats + rarity-based affix point lines
```

Important rules:

- Equipment level controls direct base stats.
- Rarity controls the number of affix lines.
- Rarity does not make every individual affix massively larger.
- Mechanic affix points pass through the global curve asset.
- Direct small stats already covered by major attributes are blocked from affix pools:
  - `physicalPower`
  - `magicPower`
  - `maxHp`
  - `armor`
  - `attackSpeed`
  - `skillHaste`

Current rarity affix counts:

| Rarity | Affix lines |
|---|---:|
| Common | 1 |
| Rare | 2 |
| Epic | 4 |
| Legendary | 7 |
| Mythic | 12 |

Current level-to-base-stat reference:

| Stat | Formula | Lv.60 | Lv.100 | Lv.150 |
|---|---:|---:|---:|---:|
| Physical / magic power | `level * 0.5` | 30 | 50 | 75 |
| HP | `level * 2.8` | 168 | 280 | 420 |
| Armor | `level * 0.08` | 4.8 | 8 | 12 |

Reference doc:

- `projects/western_fantasy_continent/design/equipment_progression/equipment-generation-v2.md`

## Current V3 Drop Ecology

The active V3 design deliberately delays high rarity:

- Mythic is removed from D1-D4.
- D5 mythic is only an extreme chase drop.
- D6-D10 mythic rates are present but controlled.
- D10 is not guaranteed mythic.

Current measured ecology, 200 successful clears per dungeon:

| D | Drops | Rare/100 | Epic/100 | Legendary/100 | Mythic/100 | Item top2 share | Repeated item share |
|---|---:|---:|---:|---:|---:|---:|---:|
| D1 | 5 | 51.5 | 0 | 0 | 0 | 100% | 1% |
| D2 | 5 | 178 | 17.5 | 0 | 0 | 96% | 4% |
| D3 | 6 | 327.5 | 92 | 6 | 0 | 87% | 13% |
| D4 | 5 | 249.5 | 218 | 32.5 | 0 | 72% | 27% |
| D5 | 6 | 88.5 | 378.5 | 131 | 2 | 62% | 47% |
| D6 | 5 | 0 | 311.5 | 175.5 | 13 | 59% | 62% |
| D7 | 6 | 0 | 246.5 | 316 | 37.5 | 59% | 74% |
| D8 | 5 | 0 | 89.5 | 352 | 58.5 | 58% | 90% |
| D9 | 5 | 0 | 0 | 385 | 115 | 57% | 100% |
| D10 | 6 | 0 | 0 | 324.5 | 275.5 | 58% | 100% |

Notes:

- Rarity values are expected item counts per 100 successful clears.
- The active affix model is not dungeon-themed.
- Each item chooses up to two random focus affixes; about half of that item's affix slots go into those focus affixes, and the rest are random from the legal slot pool.
- This keeps individual items readable without making entire dungeons deterministic theme farms.

Reference docs:

- `projects/western_fantasy_continent/design/equipment_progression/equipment-grind-v3-drop-ecology.md`
- `coop_repo/reports/2026-07-03_1757_equipment-affix-focused-random-correction.md`

## Recommendation Validation

There were two definitions of "recommended power"; the active one is the flow-based definition.

### Rejected/Secondary Definition

Static similar-power-team recommendation:

```text
Find teams with similar displayed power and test whether they can farm the dungeon at about 70% win rate.
```

This produced values such as D2 `9600`, which did not match real play because real first clears happened much earlier.

Reference:

- `projects/western_fantasy_continent/design/equipment_progression/equipment-grind-v3-recommended-power-calibration.md`

### Active Definition

Flow first-clear p70 recommendation:

```text
In fresh grind simulations, only sample moments where the player is actively challenging the next uncleared dungeon.
Among successful first clears, use the power value by which about 70% of clears have happened.
```

Current V3 displayed recommendations:

| Dungeon | Recommended power |
|---|---:|
| D1 | 3000 |
| D2 | 5500 |
| D3 | 8000 |
| D4 | 12000 |
| D5 | 18000 |
| D6 | 24000 |
| D7 | 30000 |
| D8 | 38000 |
| D9 | 40000 |
| D10 | 49000 |

This definition is more player-facing: it approximates "when should I try this?" rather than "when can I farm this stably?"

Reference:

- `projects/western_fantasy_continent/design/equipment_progression/equipment-grind-v3-flow-recommended-power.md`
- `coop_repo/reports/2026-07-03_1342_equipment-grind-v3-flow-recommended-power.md`

## Growth Curve

The desired progression aesthetic is:

```text
early lift -> bottleneck -> breakthrough -> plateau -> second breakthrough -> long tail
```

Earlier V2/V3 curve work used repeated grind simulations and tracked the highest cleared dungeon over 100 runs.

The clearest macro design rule that emerged:

- Decide the total experience window first.
- Place planned bottleneck anchors, such as around run 20, 50, 90.
- Before each bottleneck, the curve should stretch upward and then slow down.
- The early 1-2 easy clears should be front-loaded.
- The hard 1-2 clears before a bottleneck should create the "I am stuck, then I broke through" feeling.
- After the final bottleneck, leave enough reward runway so the player ends with momentum rather than exhaustion.

Recent 8-run V2 curve snapshot:

| Seed | D4 run | D7 run | D9 run | D10 run | Final |
|---|---:|---:|---:|---:|---:|
| feedback-loop-v2 | 25 | 64 | - | - | D8 |
| feedback-loop-v2-b | 38 | 67 | - | - | D7 |
| feedback-loop-v2-c | 14 | 27 | 35 | 74 | D10 |
| feedback-loop-v2-d | 39 | 68 | - | - | D7 |
| feedback-loop-v2-e | 21 | 54 | 91 | - | D9 |
| feedback-loop-v2-f | 16 | 22 | 32 | 90 | D10 |
| feedback-loop-v2-g | 12 | 20 | 22 | 90 | D10 |
| feedback-loop-v2-h | 17 | 46 | 68 | - | D9 |

Interpretation:

- There is a recognizable wave, but seed variance is high.
- Some seeds break through too fast, while others stall around D7-D8.
- This is acceptable for playtest but not final.

Reference docs:

- `projects/western_fantasy_continent/design/equipment_progression/equipment-grind-v2-clear-stage-curve-8runs.md`
- `projects/western_fantasy_continent/design/equipment_progression/equipment-grind-three-wave-budget.md`
- `projects/western_fantasy_continent/skills/progression-curve-aesthetics/SKILL.md`

## Current UX Support Around Equipment

V3 has several playtest support features:

- Page split:
  - dungeon/battle page;
  - team page;
  - equipment page;
  - loot page.
- Warehouse one-click dismantle by rarity.
- Bottom session-loot strip on the battle page.
- Auto-equip current hero.
- Auto-equip active team.
- Auto-equip uses role-aware `itemScoreForHero`; it is not raw item total score.

Reference reports:

- `coop_repo/reports/2026-07-03_1613_equipment-grind-v3-dust-and-session-loot.md`
- `coop_repo/reports/2026-07-03_1814_equipment-v3-auto-equip.md`

## Important Implementation Files

Runtime:

- `projects/western_fantasy_continent/equipment_grind_v3/equipment-grind-simulator.js`
- `projects/western_fantasy_continent/equipment_grind_v3/index.html`
- `projects/western_fantasy_continent/equipment_grind_v3/equipment.html`
- `projects/western_fantasy_continent/equipment_grind_v3/loot.html`
- `projects/western_fantasy_continent/equipment_grind_v3/styles.css`

Shared stat/combat:

- `projects/western_fantasy_continent/game_data/build-layers.js`
- `projects/western_fantasy_continent/game_data/mechanic-curves.js`
- `projects/western_fantasy_continent/game_data/combat-sim.js`
- `projects/western_fantasy_continent/battle_view/battle-view.js`

Analysis scripts:

- `projects/western_fantasy_continent/game_data/calibrate-equipment-grind-v3-flow-recommended-power.js`
- `projects/western_fantasy_continent/game_data/calibrate-equipment-grind-v3-recommended-power.js`
- `projects/western_fantasy_continent/game_data/analyze-equipment-grind-v3-drop-ecology.js`
- `projects/western_fantasy_continent/game_data/simulate-equipment-grind-v2-feedback.js`

## Current Risks

- `equipment_grind_v3/` is still untracked in git, so normal `git diff` will not show V3 file-level changes until the directory is staged/tracked.
- Several HTML files still contain mojibake from earlier encoding history. The new Chinese strings may display normally, but older labels may not.
- V3 drop ecology was measured statistically, but the latest playtest feedback after focused-affix correction is still light.
- Auto-equip is greedy, not a global optimizer.
- Recommendation values are player-flow recommendations, not stable farm thresholds. Do not treat them as "guaranteed clear" numbers.
- Growth curve still needs more manual feel checks around D8-D10.

## Recommended Next Work

1. Play V3 from a fresh save and record:
   - first clear run for D2/D4/D8/D10;
   - whether mythic feels emotionally rare again;
   - whether focused affixes make high-rarity items readable.
2. If D8-D10 feel too hard, adjust dungeon enemy budgets before increasing mythic generosity.
3. If mythic feels bland, tune item focus share or affix display, not just rarity chance.
4. Rerun:
   - `calibrate-equipment-grind-v3-flow-recommended-power.js`
   - `analyze-equipment-grind-v3-drop-ecology.js`
5. Keep V2 as baseline. Do not overwrite it with V3 tuning.
