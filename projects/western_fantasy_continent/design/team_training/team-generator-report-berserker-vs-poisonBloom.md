# Team Generator Prototype Report

- Dataset samples: 231
- Skill data version: `2026-06-23-skill-assets`
- Requested core role: `berserker`
- Target preset: `poisonBloom`
- Candidate teams validated: 16

## What This Prototype Does

- Stores each character as a token sentence containing role, base stats, skills, effect keywords, and a numeric vector.
- Trains a lightweight retrieval/scoring model from winning teams and losing teams.
- Generates candidate teams for a requested role, then validates them against every current standard preset with the real simulator.
- This is not yet a neural network; it is the data and search loop that a neural generator can later replace.

## Top Recommendations

| Rank | Target Win | Avg Win | Core Share | Core Signal | Similar To | Tags | Source | Team |
| ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| 1 | 100% | 94% | 67% | dmg 67%, alive 100%, blink 0, auto 0 | crownCarry 100% | double-front, support-heavy, risk-frontline, sustain-shell, window-tempo | preset-containing-core | knight(guard/tauntLine/fortressStance/bannerWall) + priest(heal/crownBloodCharm/afterglowGrace/sanctuary) + bard(tempoSong/courageChord/encore/crescendo) + berserker(bloodStrike/boneWhirl/rageEngine/undyingRoar) |
| 2 | 67% | 59% | 59% | dmg 59%, alive 67%, blink 0, auto 0 | crownCarry 43% | double-front, support-heavy, risk-frontline, sustain-shell, window-tempo | winning-memory | priest(heal/mendingLight/afterglowGrace/bastionSanctuary) + berserker(bloodAegis/bloodStrike/painAnchor/undyingRoar) + knight(vowTaunt/shieldBash/fortressStance/bannerWall) + bard(courageChord/syncopate/chorusKeeper/crescendo) |
| 3 | 67% | 55% | 68% | dmg 68%, alive 67%, blink 0, auto 0 | cavalryBreak 23% | double-front, support-heavy, risk-frontline, mark-engine, poison-engine, burn-engine, window-tempo | winning-memory | knight(rhythmGuard/lanceCharge/frontlineDrill/oathBulwark) + berserker(bloodStrike/bloodAegis/rageEngine/crimsonCyclone) + alchemist(reagentMark/volatileBottle/statusHunter/grandMixture) + knight(rhythmGuard/vowTaunt/chargerMomentum/royalCavalryBreak) |
| 4 | 33% | 88% | 59% | dmg 59%, alive 0%, blink 0, auto 0 | fireBurst 36% | double-front, support-heavy, risk-frontline, window-tempo | model-guided-mutation | berserker(lastWound/guardBreak/rageEngine/crimsonCyclone) + knight(rhythmGuard/tauntLine/frontlineDrill/oathBulwark) + knight(lanceCharge/guard/fortressStance/bannerWall) + warrior(powerStrike/duelChallenge/lineBreaker/warBanner) |
| 5 | 33% | 86% | 32% | dmg 32%, alive 33%, blink 0, auto 0 | cavalryBreak 27% | double-front, support-heavy, multi-carry, risk-frontline, burn-engine, sustain-shell, window-tempo | model-guided-mutation | berserker(lastWound/bloodAegis/frontlineDrill/undyingRoar) + knight(rhythmGuard/lanceCharge/frontlineDrill/royalCavalryBreak) + mage(fireball/ashZone/statusHunter/meteorRain) + priest(mendingLight/rhythmGuard/afterglowGrace/bastionSanctuary) |
| 6 | 33% | 84% | 37% | dmg 37%, alive 0%, blink 0, auto 0 | crownCarry 29% | double-front, support-heavy, risk-frontline, sustain-shell, window-tempo | model-guided-mutation | berserker(bloodAegis/guardBreak/aaFrenzyEngine/undyingRoar) + bard(courageChord/lullabyGuard/chorusKeeper/resonantFinale) + priest(radiantInterpose/bloodCharm/afterglowGrace/sanctuary) + knight(tauntLine/rhythmGuard/wardenVow/oathRally) |
| 7 | 0% | 69% | 11% | dmg 11%, alive 0%, blink 0, auto 0 | cavalryBreak 23% | double-front, support-heavy, multi-carry, backline-dive, risk-frontline, poison-engine, window-tempo | model-guided-mutation | berserker(boneWhirl/scarletChallenge/rageEngine/undyingRoar) + knight(shieldBash/vowTaunt/wardenVow/royalCavalryBreak) + assassin(toxicStabs/aa2BacklineBlink/finisherInstinct/aaBladeHarvest) + knight(tauntLine/vowTaunt/frontlineDrill/bannerWall) |
| 8 | 0% | 59% | 19% | dmg 19%, alive 0%, blink 0, auto 0 | frostControl 29% | double-front, support-heavy, risk-frontline, poison-engine, burn-engine, sustain-shell, window-tempo | model-guided-mutation | berserker(bloodStrike/guardBreak/aaFrenzyEngine/crimsonCyclone) + priest(graceTransfer/purifyingWard/afterglowGrace/bastionSanctuary) + alchemist(sparkCatalyst/miasmaFlask/catalyst/ruinComet) + knight(tauntLine/guard/fortressStance/royalCavalryBreak) |
| 9 | 0% | 55% | 51% | dmg 51%, alive 0%, blink 0, auto 1 | crownCarry 32% | double-front, support-heavy, risk-frontline, sustain-shell, window-tempo | winning-memory | priest(radiantInterpose/heal/martyrAegis/sanctuary) + berserker(bloodAegis/guardBreak/rageEngine/aaRazorRoar) + priest(heal/rhythmGuard/martyrAegis/bastionSanctuary) + knight(guard/bulwarkRiposte/fortressStance/bannerWall) |
| 10 | 0% | 51% | 21% | dmg 21%, alive 0%, blink 0, auto 0 | crownCarry 31% | double-front, support-heavy, risk-frontline, sustain-shell, window-tempo | model-guided-mutation | berserker(scarletChallenge/redFeast/rageEngine/undyingRoar) + knight(guard/shieldBash/frontlineDrill/oathBulwark) + knight(vowTaunt/guard/fortressStance/royalCavalryBreak) + bard(rhythmGuard/courageChord/encore/resonantFinale) |

## Target Details

The table is sorted by target win rate against `poisonBloom`, then by full-ecology average win rate.
Similarity is recorded but not penalized. If many strong teams converge toward one preset, treat that preset as an attractor rather than a mistake.

## Emergence Signals

- Repeated structure tags: double-front x10, support-heavy x10, risk-frontline x10, window-tempo x10, sustain-shell x7, poison-engine x3, burn-engine x3, multi-carry x2, mark-engine x1, backline-dive x1.
- Non-preset candidates passing target threshold: 2/16.
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

