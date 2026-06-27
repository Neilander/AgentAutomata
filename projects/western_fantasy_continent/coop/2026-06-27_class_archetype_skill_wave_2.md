# 2026-06-27 Class Archetype Skill Wave 2

## Goal

Add one new passive, one new ultimate, and one new small skill for every class. The passive should open a visible secondary archetype rather than duplicate the class's existing default passive.

## Runtime Support Added

This pass added small data-driven passive effects:

- `passiveStat`: adjusts max HP, power, armor, or range when the unit is created.
- `passiveHealAmp`: modifies healing done by the passive owner.
- `passiveShieldAmp`: modifies shielding done by the passive owner.
- `passiveDotAmp`: modifies poison or burn tick damage done by the passive owner.

`passiveDamageAmp` also gained optional `sourceHpBelow`, `targetTimer`, and `perMark` conditions. This keeps the new passives data-owned instead of hardcoding every passive name into the combat loop.

## New Class Directions

- Warrior: lone duelist. Self-contained durability and front-line pressure without team-scaling resources.
- Knight: active bodyguard. Protects the carry and turns shield windows into counter pressure.
- Berserker: risk frontline. Trades HP for self-shield and low-health pressure, but was tuned down to avoid becoming a generic hard tank.
- Assassin: poison execute. Uses poison and low-health pressure rather than immediate naked burst.
- Ranger: trap control. Slows and marks targets, then cashes out controlled targets.
- Mage: frost control. Converts slow windows into safer ranged pressure instead of fire burst.
- Priest: martyr tank. Higher personal HP/armor and self-shield/heal scaling, lower power, shorter range.
- Warlock: blood pact. Self-cost poison and poison payoff with risk-based damage.
- Bard: defensive rhythm. Adds shielding, healing, and slow support instead of only haste.
- Alchemist: distillation sustain. Improves ongoing poison/burn value and status reaction setup.

## Added Skills

- Warrior: `veteranCut`, `loneVeteran`, `duelistBreak`
- Knight: `interceptVow`, `wardenVow`, `oathBulwark`
- Berserker: `bloodAegis`, `painAnchor`, `crimsonCyclone`
- Assassin: `venomStep`, `toxinExecution`, `midnightBloom`
- Ranger: `snareShot`, `trapSense`, `killZone`
- Mage: `glacierShard`, `frostScholar`, `whiteout`
- Priest: `radiantInterpose`, `martyrAegis`, `bastionSanctuary`
- Warlock: `bloodHex`, `crimsonPact`, `forbiddenOffering`
- Bard: `lullabyGuard`, `chorusKeeper`, `resonantFinale`
- Alchemist: `corrosiveFoam`, `distillationLoop`, `perfectReaction`

## Balance Iteration

Attempt 1 produced one red-team breaker: a berserker/knight/warlock/bard shell at 67.7% average win rate. The issue was a too-safe frontline chain around `painAnchor`, `interceptVow`, `wardenVow`, and `lullabyGuard`.

Attempt 2 narrowed that safety package:

- `painAnchor`: lower HP/armor and lower low-health damage amp.
- `interceptVow`: lower carry shield and shorter taunt/guard.
- `wardenVow`: lower HP multiplier and self-shield amp.
- `lullabyGuard`: shorter slow and lower shield.

## Validation

Ran:

- `build-skill-assets`
- `validate-skill-assets`
- `analyze-archetype-signals`
- `redteam-skill-pool`
- `simulate-archetype-matchups`
- `analyze-skill-budget`
- syntax checks for changed runtime files

Final results:

- Skill assets valid.
- Existing archetype signal contracts pass.
- Red-team risky candidates: 0.
- The top random candidate is now a watch-list team at 60.0% average win rate, below breaker threshold.
- Full matchup matrix remains in review due to inherited standard-ecology issues: `crownCarry`, `fireBurst`, and `poisonBloom` are broad hard-advantage teams; `holySustain`, `ironWall`, and `shadowExecute` still have too few prey.

## Notes For Next Agent

Do not treat this batch as a final meta expansion. It is safe enough for browsing and playtest, but the player-facing UI should expose skill details clearly before judging fun. The next good step is adding these skills to recruit/character skill detail views if they are not already auto-listed.
