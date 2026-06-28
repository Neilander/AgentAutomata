# Team Generator Prototype Report

- Dataset samples: 231
- Skill data version: `2026-06-23-skill-assets`
- Requested core role: `assassin`
- Target preset: `fireBurst`
- Candidate teams validated: 16

## What This Prototype Does

- Stores each character as a token sentence containing role, base stats, skills, effect keywords, and a numeric vector.
- Trains a lightweight retrieval/scoring model from winning teams and losing teams.
- Generates candidate teams for a requested role, then validates them against every current standard preset with the real simulator.
- This is not yet a neural network; it is the data and search loop that a neural generator can later replace.

## Top Recommendations

| Rank | Target Win | Avg Win | Core Share | Core Signal | Similar To | Tags | Source | Team |
| ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| 1 | 100% | 82% | 11% | dmg 11%, alive 0%, blink 0, auto 0 | poisonBloom 100% | double-front, support-heavy, multi-carry, poison-engine, sustain-shell, window-tempo | preset-containing-core | knight(guard/tauntLine/fortressStance/bannerWall) + assassin(toxicStabs/shadowCut/executionSense/shadowHarvest) + warlock(venomBrand/miasmaFlask/hotbedPact/bloomDetonation) + priest(bloodCharm/heal/afterglowGrace/sanctuary) |
| 2 | 33% | 69% | 28% | dmg 28%, alive 0%, blink 0, auto 0 | shadowExecute 33% | double-front, support-heavy, multi-carry, risk-frontline, poison-engine, window-tempo | model-guided-mutation | assassin(toxicStabs/deathNeedle/executionSense/shadowHarvest) + berserker(bloodStrike/bloodAegis/painAnchor/crimsonCyclone) + knight(tauntLine/lanceCharge/fortressStance/bannerWall) + knight(tauntLine/vowTaunt/frontlineDrill/bannerWall) |
| 3 | 0% | 75% | 5% | dmg 5%, alive 0%, blink 0, auto 0 | crownCarry 33% | double-front, support-heavy, multi-carry, risk-frontline, poison-engine, sustain-shell, window-tempo | model-guided-mutation | assassin(toxicStabs/aaShadowPursuit/finisherInstinct/aa2FinisherCut) + bard(courageChord/rhythmGuard/encore/resonantFinale) + knight(interceptVow/tauntLine/fortressStance/bannerWall) + berserker(guardBreak/bloodAegis/rageEngine/undyingRoar) |
| 4 | 0% | 75% | 12% | dmg 12%, alive 0%, blink 1, auto 0 | bloodRage 32% | double-front, multi-carry, backline-dive, risk-frontline, poison-engine, window-tempo | model-guided-mutation | assassin(aa2BacklineBlink/venomStep/statusHunter/aaBladeHarvest) + berserker(boneWhirl/bloodStrike/rageEngine/undyingRoar) + berserker(guardBreak/aaFrenzyCut/rageEngine/undyingRoar) + bard(courageChord/battleHymn/encore/crescendo) |
| 5 | 0% | 37% | 28% | dmg 28%, alive 0%, blink 0, auto 0 | frostControl 29% | double-front, support-heavy, multi-carry, poison-engine, burn-engine, window-tempo | model-guided-mutation | assassin(toxicStabs/shadowCut/aa2MarkedTempo/aaBladeHarvest) + knight(tauntLine/vowTaunt/fortressStance/oathBulwark) + priest(mendingLight/heal/afterglowGrace/oathRally) + mage(fireball/emberSpread/kindlingEcho/ruinComet) |
| 6 | 0% | 29% | 25% | dmg 25%, alive 0%, blink 0, auto 0 | shadowExecute 32% | double-front, support-heavy, multi-carry, risk-frontline, poison-engine, window-tempo | model-guided-mutation | assassin(venomStep/toxicStabs/aa2MarkedTempo/shadowHarvest) + knight(interceptVow/vowTaunt/fortressStance/royalCavalryBreak) + berserker(guardBreak/scarletChallenge/frontlineDrill/aaRazorRoar) + knight(tauntLine/guard/frontlineDrill/bannerWall) |
| 7 | 0% | 29% | 29% | dmg 29%, alive 0%, blink 0, auto 0 | shadowExecute 40% | support-heavy, multi-carry, poison-engine, sustain-shell, window-tempo | model-guided-mutation | assassin(toxicStabs/shadowCut/statusHunter/shadowHarvest) + bard(rhythmGuard/syncopate/chorusKeeper/crescendo) + knight(lanceCharge/tauntLine/fortressStance/bannerWall) + warlock(bloodHex/venomDividend/hotbedPact/ruinComet) |
| 8 | 0% | 28% | 24% | dmg 24%, alive 0%, blink 1, auto 0 | cavalryBreak 21% | double-front, support-heavy, multi-carry, backline-dive, risk-frontline, sustain-shell, window-tempo | model-guided-mutation | assassin(aa2BacklineBlink/shadowCut/executionSense/shadowHarvest) + berserker(guardBreak/redFeast/aaFrenzyEngine/crimsonCyclone) + priest(graceTransfer/mendingLight/martyrAegis/sanctuary) + knight(shieldBash/vowTaunt/wardenVow/royalCavalryBreak) |
| 9 | 0% | 20% | 26% | dmg 26%, alive 0%, blink 0, auto 0 | poisonBloom 23% | double-front, support-heavy, multi-carry, risk-frontline, poison-engine, sustain-shell, window-tempo | model-guided-mutation | assassin(garrote/toxicStabs/statusHunter/shadowHarvest) + priest(purifyingWard/mendingLight/afterglowGrace/oathRally) + priest(bloodCharm/heal/afterglowGrace/bastionSanctuary) + berserker(scarletChallenge/redFeast/rageEngine/aaRazorRoar) |
| 10 | 0% | 18% | 4% | dmg 4%, alive 0%, blink 0, auto 0 | shadowExecute 35% | double-front, support-heavy, multi-carry, risk-frontline, poison-engine, window-tempo | model-guided-mutation | assassin(deathNeedle/toxicStabs/toxinExecution/shadowHarvest) + warlock(curseLeak/bloodContract/statusHunter/forbiddenOffering) + berserker(redFeast/guardBreak/rageEngine/aaRazorRoar) + knight(tauntLine/guard/wardenVow/bannerWall) |

## Target Details

The table is sorted by target win rate against `fireBurst`, then by full-ecology average win rate.
Similarity is recorded but not penalized. If many strong teams converge toward one preset, treat that preset as an attractor rather than a mistake.

## Emergence Signals

- Repeated structure tags: multi-carry x10, window-tempo x10, double-front x9, support-heavy x9, poison-engine x9, risk-frontline x7, sustain-shell x5, backline-dive x2, burn-engine x1.
- Non-preset candidates passing target threshold: 0/16.
- Strong candidates with >=50% similarity to an existing preset: 1/16.
- Current interpretation: emergence is weak if only preset memory wins; emergence is stronger if model-guided or winning-memory candidates repeatedly form the same structure tags and pass validation without being near-identical to one preset.

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

