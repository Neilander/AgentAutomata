# Team Generator Prototype Report

- Dataset samples: 231
- Skill data version: `2026-06-23-skill-assets`
- Requested core role: `assassin`
- Candidate teams validated: 12

## What This Prototype Does

- Stores each character as a token sentence containing role, base stats, skills, effect keywords, and a numeric vector.
- Trains a lightweight retrieval/scoring model from winning teams and losing teams.
- Generates candidate teams for a requested role, then validates them against every current standard preset with the real simulator.
- This is not yet a neural network; it is the data and search loop that a neural generator can later replace.

## Top Recommendations

| Rank | Avg Win | Presets Beaten | Source | Model Score | Team | Good Into | Bad Into |
| ---: | ---: | ---: | --- | ---: | --- | --- | --- |
| 1 | 91% | 17/17 | preset-containing-core | 62.7961 | knight(guard/tauntLine/fortressStance/bannerWall) + assassin(toxicStabs/shadowCut/executionSense/shadowHarvest) + warlock(venomBrand/miasmaFlask/hotbedPact/bloomDetonation) + priest(bloodCharm/heal/afterglowGrace/sanctuary) | bloodRage, bulwarkMarks, cavalryBreak, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute | - |
| 2 | 82% | 15/17 | model-guided-mutation | 51.6047 | assassin(aaShadowPursuit/shadowCut/finisherInstinct/aa2FinisherCut) + priest(bloodCharm/rhythmGuard/martyrAegis/bastionSanctuary) + warlock(venomBrand/bloodContract/statusHunter/ruinComet) + berserker(bloodStrike/bloodAegis/rageEngine/crimsonCyclone) | bloodRage, bulwarkMarks, crownCarry, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition, scarletVanguard | poisonBloom, shadowExecute |
| 3 | 53% | 11/17 | model-guided-mutation | 52.2663 | assassin(toxicStabs/deathNeedle/statusHunter/midnightBloom) + berserker(bloodAegis/bloodStrike/rageEngine/undyingRoar) + priest(radiantInterpose/heal/martyrAegis/sanctuary) + ranger(markDetonate/snareShot/duelistFocus/arrowStorm) | bulwarkMarks, duelChampion, holySustain, ironWall, martyrFrontline, poisonBloom, purgeAttrition | crownCarry, fireBurst, frostTrapField, lightningTempo, scarletVanguard, shadowExecute |
| 4 | 32% | 7/17 | winning-memory | 53.4845 | knight(interceptVow/tauntLine/chargerMomentum/oathBulwark) + berserker(aaFrenzyCut/bloodAegis/aaFrenzyEngine/crimsonCyclone) + bard(tempoSong/courageChord/encore/oathRally) + assassin(aaBladeFlurry/shadowCut/finisherInstinct/aaBladeHarvest) | duelChampion, holySustain, martyrFrontline, scarletVanguard | alchemyChaos, bulwarkMarks, crownCarry, fireBurst, frostControl, frostTrapField, ironWall, lightningTempo, poisonBloom, shadowExecute |
| 5 | 29% | 6/17 | model-guided-mutation | 61.936 | assassin(venomStep/toxicStabs/aa2MarkedTempo/shadowHarvest) + knight(interceptVow/vowTaunt/fortressStance/royalCavalryBreak) + berserker(guardBreak/scarletChallenge/frontlineDrill/aaRazorRoar) + knight(tauntLine/guard/frontlineDrill/bannerWall) | bulwarkMarks, holySustain, lightningTempo, scarletVanguard | alchemyChaos, cavalryBreak, crownCarry, duelChampion, fireBurst, frostControl, ironWall, martyrFrontline, poisonBloom, purgeAttrition, shadowExecute |
| 6 | 24% | 7/17 | model-guided-mutation | 56.5358 | assassin(deathNeedle/toxicStabs/toxinExecution/shadowHarvest) + warlock(curseLeak/bloodContract/statusHunter/forbiddenOffering) + berserker(redFeast/guardBreak/rageEngine/aaRazorRoar) + knight(tauntLine/guard/wardenVow/bannerWall) | lightningTempo | alchemyChaos, crownCarry, fireBurst, frostControl, ironWall, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute |
| 7 | 15% | 4/17 | model-guided-mutation | 53.9224 | assassin(garrote/toxicStabs/statusHunter/shadowHarvest) + priest(purifyingWard/mendingLight/afterglowGrace/oathRally) + priest(bloodCharm/heal/afterglowGrace/bastionSanctuary) + berserker(scarletChallenge/redFeast/rageEngine/aaRazorRoar) | martyrFrontline | alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, crownCarry, fireBurst, frostControl, ironWall, lightningTempo, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute |
| 8 | 12% | 4/17 | model-guided-mutation | 55.4535 | assassin(toxicStabs/garrote/aaPredatorRhythm/aaBladeHarvest) + bard(syncopate/rhythmGuard/encore/crescendo) + warlock(venomBrand/curseLeak/hotbedPact/ruinComet) + knight(shieldBash/rhythmGuard/fortressStance/bannerWall) | - | alchemyChaos, bulwarkMarks, cavalryBreak, crownCarry, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, poisonBloom, purgeAttrition, shadowExecute |
| 9 | 6% | 2/17 | model-guided-mutation | 58.3746 | assassin(aa2BacklineBlink/aa2SmokeStep/executionSense/aaBladeHarvest) + warlock(painDividend/bloodContract/crimsonPact/plagueOffering) + knight(rhythmGuard/vowTaunt/fortressStance/bannerWall) + knight(rhythmGuard/lanceCharge/fortressStance/royalCavalryBreak) | - | alchemyChaos, bloodRage, crownCarry, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute |
| 10 | 6% | 2/17 | winning-memory | 52.0555 | priest(heal/mendingLight/martyrAegis/bastionSanctuary) + assassin(toxicStabs/aaShadowPursuit/aa2MarkedTempo/aaBladeHarvest) + bard(syncopate/courageChord/chorusKeeper/crescendo) + knight(interceptVow/bulwarkRiposte/wardenVow/oathBulwark) | - | alchemyChaos, bulwarkMarks, cavalryBreak, crownCarry, duelChampion, fireBurst, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, scarletVanguard, shadowExecute |

## Top Role Scores

| Role | Score | Count |
| --- | ---: | ---: |
| `knight` | 6.8493 | 286 |
| `berserker` | 6.1103 | 202 |
| `priest` | 5.2566 | 255 |
| `ranger` | 4.7185 | 144 |
| `bard` | 4.4773 | 166 |
| `warrior` | 4.2505 | 177 |
| `mage` | 4.0415 | 131 |
| `alchemist` | 3.2869 | 182 |
| `warlock` | 3.2788 | 187 |
| `assassin` | 2.7649 | 118 |

## Data Boundary

- Same-role stack tests are not used as the main training target here.
- Generated matches include random structured teams plus current preset teams.
- Every sample carries base stats. If a character has custom hp/power/armor/range, those values enter the token and combat unit.
- When skills change, regenerate the dataset for affected versions; old data remains versioned, not silently mixed.

