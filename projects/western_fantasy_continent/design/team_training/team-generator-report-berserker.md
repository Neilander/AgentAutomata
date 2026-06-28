# Team Generator Prototype Report

- Dataset samples: 231
- Skill data version: `2026-06-23-skill-assets`
- Requested core role: `berserker`
- Candidate teams validated: 12

## What This Prototype Does

- Stores each character as a token sentence containing role, base stats, skills, effect keywords, and a numeric vector.
- Trains a lightweight retrieval/scoring model from winning teams and losing teams.
- Generates candidate teams for a requested role, then validates them against every current standard preset with the real simulator.
- This is not yet a neural network; it is the data and search loop that a neural generator can later replace.

## Top Recommendations

| Rank | Avg Win | Presets Beaten | Source | Model Score | Team | Good Into | Bad Into |
| ---: | ---: | ---: | --- | ---: | --- | --- | --- |
| 1 | 94% | 17/17 | preset-containing-core | 75.2851 | knight(guard/tauntLine/fortressStance/bannerWall) + priest(heal/crownBloodCharm/afterglowGrace/sanctuary) + bard(tempoSong/courageChord/encore/crescendo) + berserker(bloodStrike/boneWhirl/rageEngine/undyingRoar) | alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, duelChampion, frostControl, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, poisonBloom, purgeAttrition, scarletVanguard, shadowExecute | - |
| 2 | 71% | 15/17 | model-guided-mutation | 66.5185 | berserker(boneWhirl/scarletChallenge/rageEngine/undyingRoar) + knight(shieldBash/vowTaunt/wardenVow/royalCavalryBreak) + assassin(toxicStabs/aa2BacklineBlink/finisherInstinct/aaBladeHarvest) + knight(tauntLine/vowTaunt/frontlineDrill/bannerWall) | alchemyChaos, bloodRage, bulwarkMarks, cavalryBreak, frostTrapField, holySustain, lightningTempo, martyrFrontline, scarletVanguard | fireBurst, poisonBloom |
| 3 | 65% | 13/17 | winning-memory | 65.8888 | knight(rhythmGuard/lanceCharge/frontlineDrill/oathBulwark) + berserker(bloodStrike/bloodAegis/rageEngine/crimsonCyclone) + alchemist(reagentMark/volatileBottle/statusHunter/grandMixture) + knight(rhythmGuard/vowTaunt/chargerMomentum/royalCavalryBreak) | bulwarkMarks, cavalryBreak, crownCarry, duelChampion, holySustain, ironWall, martyrFrontline, purgeAttrition, scarletVanguard | bloodRage, fireBurst, lightningTempo, poisonBloom |
| 4 | 62% | 12/17 | winning-memory | 73.1143 | priest(radiantInterpose/heal/martyrAegis/sanctuary) + berserker(bloodAegis/guardBreak/rageEngine/aaRazorRoar) + priest(heal/rhythmGuard/martyrAegis/bastionSanctuary) + knight(guard/bulwarkRiposte/fortressStance/bannerWall) | alchemyChaos, bulwarkMarks, cavalryBreak, fireBurst, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition | bloodRage, crownCarry, poisonBloom, scarletVanguard, shadowExecute |
| 5 | 59% | 12/17 | preset-containing-core | 67.7811 | berserker(bloodStrike/boneWhirl/rageEngine/undyingRoar) + warrior(powerStrike/cleave/lineBreaker/warBanner) + priest(heal/bloodCharm/afterglowGrace/sanctuary) + bard(tempoSong/courageChord/encore/crescendo) | bloodRage, bulwarkMarks, duelChampion, holySustain, ironWall, martyrFrontline, purgeAttrition, shadowExecute | crownCarry, fireBurst, frostControl, frostTrapField, scarletVanguard |
| 6 | 47% | 9/17 | model-guided-mutation | 66.3673 | berserker(scarletChallenge/guardBreak/aaFrenzyEngine/undyingRoar) + warrior(duelChallenge/powerStrike/duelistOath/oathRally) + knight(rhythmGuard/interceptVow/chargerMomentum/oathRally) + priest(mendingLight/heal/afterglowGrace/sanctuary) | cavalryBreak, frostTrapField, holySustain, ironWall, lightningTempo, martyrFrontline, purgeAttrition | alchemyChaos, crownCarry, duelChampion, fireBurst, frostControl, poisonBloom, scarletVanguard, shadowExecute |
| 7 | 44% | 9/17 | winning-memory | 70.8719 | priest(heal/mendingLight/afterglowGrace/bastionSanctuary) + berserker(bloodAegis/bloodStrike/painAnchor/undyingRoar) + knight(vowTaunt/shieldBash/fortressStance/bannerWall) + bard(courageChord/syncopate/chorusKeeper/crescendo) | cavalryBreak, duelChampion, frostControl, holySustain, martyrFrontline, purgeAttrition | alchemyChaos, bloodRage, bulwarkMarks, fireBurst, frostTrapField, lightningTempo, scarletVanguard, shadowExecute |
| 8 | 41% | 9/17 | model-guided-mutation | 71.3345 | berserker(scarletChallenge/redFeast/rageEngine/undyingRoar) + knight(guard/shieldBash/frontlineDrill/oathBulwark) + knight(vowTaunt/guard/fortressStance/royalCavalryBreak) + bard(rhythmGuard/courageChord/encore/resonantFinale) | bulwarkMarks, cavalryBreak, holySustain, ironWall, martyrFrontline | alchemyChaos, bloodRage, crownCarry, duelChampion, fireBurst, frostTrapField, poisonBloom, shadowExecute |
| 9 | 38% | 8/17 | preset-containing-core | 69.2802 | knight(lanceCharge/shieldBash/chargerMomentum/royalCavalryBreak) + warrior(sunderingAdvance/lineHold/lineBreaker/warBanner) + berserker(bloodStrike/boneWhirl/rageEngine/undyingRoar) + priest(mendingLight/purifyingWard/afterglowGrace/sanctuary) | bulwarkMarks, cavalryBreak, ironWall, martyrFrontline, purgeAttrition | alchemyChaos, bloodRage, crownCarry, fireBurst, frostControl, frostTrapField, lightningTempo, poisonBloom, scarletVanguard |
| 10 | 32% | 7/17 | winning-memory | 65.9818 | knight(guard/interceptVow/fortressStance/royalCavalryBreak) + berserker(bloodAegis/lastWound/frontlineDrill/crimsonCyclone) + bard(rhythmGuard/courageChord/chorusKeeper/resonantFinale) + warrior(guardBreak/lineHold/finisherInstinct/warBanner) | bulwarkMarks, cavalryBreak, duelChampion, martyrFrontline | alchemyChaos, bloodRage, crownCarry, fireBurst, frostControl, holySustain, ironWall, lightningTempo, poisonBloom, shadowExecute |

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

