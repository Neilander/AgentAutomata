# 2026-06-27 Secondary Skill Batch Report

## Goal

After the current class numbers were accepted as broadly stable, this pass expanded class secondary positions and checked whether the new skills create readable options without changing the combat loop.

## Guardrails

- Did not change targeting, cooldown flow, action priority, movement, or shared combat semantics.
- Did not tune tutorial enemies or role baseline stats in this pass.
- Used the skill design, keyword taxonomy, archetype signal curve, red-team, matchup matrix, and task-budget workflow.

## Added Skills

- `bulwarkRiposte`: knight secondary frontliner. Self shield, guard window, and small blocked-damage retaliation.
- `lineHold`: warrior secondary protector. Damages the target while shielding the lowest-health ally.
- `scarletChallenge`: berserker risk frontliner. Self-cost damage, short taunt, and guard window.
- `markDetonate`: ranger mark payoff. Converts existing mark stacks into focused physical damage but does not add marks itself.
- `ashZone`: mage fire-control skill. Small area hit plus slow window.
- `purifyingWard`: priest cleansing support. Shields the lowest ally and grants short DOT resistance.
- `venomDividend`: warlock poison-support skill. Applies poison while buffing the carry window.
- `battleHymn`: bard tempo-protection skill. Team haste plus a small shield to the lowest ally.
- `stabilizingVapor`: alchemist setup skill. Adds burn, poison, and slow to prepare status payoff.

## Added Standard Presets

- `bulwarkMarks`: knight plus dual-ranger mark team. One ranger builds marks while the other cashes them out. It now has 2 hard prey and 5 hard predators after being changed from the too-weak single-ranger version.
- `purgeAttrition`: priest/warlock/alchemist attrition team. Intended to blunt status pressure and win through poison sustain.
- `scarletVanguard`: berserker risk-front team with warrior/bard/mage stabilization.

## Important Iteration

The first `bulwarkMarks` version used knight, warrior, one ranger, and bard. It passed local signal checks but failed the ecology check with 0 prey and 12 predators. The fix was not a numeric buff. The preset was changed to a dual-ranger version because mark production and mark payoff need to be split across two units to create a readable team pattern.

## Validation

Ran:

- `build-skill-assets`
- `validate-skill-assets`
- `analyze-archetype-signals`
- `redteam-skill-pool`
- `simulate-archetype-matchups`

Results:

- Skill assets are valid.
- All archetype signal contracts pass.
- Red-team risky candidates: 0.
- `bulwarkMarks` improved from unusable to answered: 2 prey / 5 predators.
- The overall matchup matrix still reports review. Main inherited review items are `crownCarry`, `fireBurst`, and `poisonBloom` as broad hard-advantage teams, plus `holySustain`, `ironWall`, and `shadowExecute` as low-prey teams. Those are broader standard-ecology issues, not direct blockers for this skill batch.

## Next Suggested Work

- Browser/playtest the new skills in the 4v4 and team simulator pages.
- If the user likes the feel, add these new skills into more player-facing recruit pools and skill detail views.
- Later balance pass should revisit standard-team ecology as its own goal, especially the broad all-rounder-risk presets and low-prey defensive presets.
