# Inertial player / paired-alpha agent notes

## Completion

- Environment: `enriched_v1`, two chapters.
- Profile: `inertial_player`.
- Seed: `paired-alpha`.
- Result: complete; chapter 1 and chapter 2 both cleared.
- Cycles: chapter 1 = 26, chapter 2 = 23, total = 49.
- Combat: 34 challenges, 20 wins, 14 losses.
- Final team: `hero_warrior`, `hero_knight`, `hero_ranger`, `hero_priest`.
- Final active equipment score: 1126 before the winning boss fight.
- Final emotion: 99.6856 (initial 38; minimum 38; maximum 99.6856).
- Knowledge rows: 192.
- Requested model: `5.5fast`; actual model could not be verified by the current orchestrator and is recorded as `unknown_platform_default`.

## Player behavior and prior correction

This profile behaved recognizably as an inertial player. It ignored early menu opportunities, including a first-chapter mythic drop and newly unlocked heroes, while the familiar team kept winning. After the first hard failure it preferred a small gear change, then another attempt, then another nearby encounter, and only accepted a composition change after repeated losses and several insufficient equipment upgrades.

The decisive chapter-1 correction happened at the bandit branch. Replacing the weak second frontliner with Berserker immediately changed the outcome from repeated full wipes to a win. Berserker contributed 53.8% of team damage, confirming the pre-combat `damageShare >= 20%` hypothesis. This was not blind persistence: the agent revised its prior only after the supplied evidence crossed its high threshold.

The later Ranger experiment was more specific. The team won after Spear was replaced by Ranger, but Ranger produced only 18.28% damage share, so the `damageShare >= 20%` hypothesis was correctly refuted despite the positive team outcome. The system separated outcome from the claimed character attribution.

## Chapter 2 route and decisive evidence

The carried Berserker plus chapter-1 gear cleared the Priest and Knight teaching branches without using the intended full Priest or Knight. This is a real content bypass: those nodes unlocked the characters, but did not force the player to learn why they mattered.

Confluence then created a meaningful wall:

1. The inherited team lost.
2. Equipping a mythic Ranger item raised active gear score from 374 to 754, but still lost.
3. Replacing the militia healer with full Priest still lost. Priest healed 174.53, below the `heal >= 200` hypothesis, so the hypothesis was refuted.
4. Replacing the collapsed Berserker slot with full Knight won. Knight produced 286.12 shield, confirming the `shield >= 200` hypothesis. Ranger supplied 1065.22 damage and four kills, while Priest also supplied 328.59 healing and 308.99 shield, so the attribution retained those alternatives.

The boss required six attempts. The first three attempts with Warrior/Knight/Ranger/Priest killed two enemies but wiped. The epic Priest charm raised Priest healing from 299.16 to 470.76 and confirmed `heal >= 320`, yet the team still lost. A rare Knight glove increased active gear score by 107 but raised Knight shield only from 137.63 to 139.18; the `shield >= 160` hypothesis was correctly refuted and the outcome did not improve.

After three similar boss failures, the agent tested newly unlocked Alchemist. Alchemist had 34.49% damage with zero gear, but only four skill casts, refuting the `skillCount >= 5` hypothesis. More importantly, swapping out the equipped Warrior dropped active gear score from 1000 to 626. Both Alchemist boss attempts ended with zero kills, so the agent restored Warrior rather than perseverating on novelty.

The successful composition combined restored Warrior gear with the newly equipped shield-break Ranger bow. Active gear score reached 1126. The boss win had two player survivors; Ranger contributed 66.09% damage and three kills, Warrior contributed 21.71% and confirmed the `damageShare >= 20%` hypothesis, Priest supplied 392.40 healing and 334.06 shielding, and Knight supplied 210.56 shielding.

## What the run suggests

- The player profile is behaviorally visible: it resists menu and roster changes until repeated failures make the familiar route clearly worse.
- Character-specific hypotheses can be confirmed or refuted independently of battle outcome. Ranger failed its share hypothesis in a win; Priest and Knight equipment hypotheses respectively confirmed and refuted while the boss still remained a loss.
- The cognition loop can recover from a failed character experiment. It tried Alchemist, recorded the confounding equipment-score collapse, observed two worse outcomes, and restored Warrior.
- The final win was not attributed to a single hero. The notes preserve Ranger, Warrior, Priest, Knight, and total equipment as simultaneous causes.

## Problems and risks observed

1. New reserve characters generally had `unknown` roster predictions because they had no accepted combat cognition. The most meaningful first-time swaps therefore did not have informative numeric roster-A forecasts before the experiment. The summary still records six settlements, but this run alone is not enough to prove the roster-A prediction layer works well for novel characters.
2. Equipment feedback is emotionally too weak. Very large active-score jumps, including +380 from the mythic Ranger gloves, produced almost no immediate emotion change. This makes exceptional loot feel cognitively important but affectively flat.
3. Emotion saturated early in chapter 2 near the upper bound, leaving little room for later wins, failures, or mythic drops to differentiate the state.
4. The intended Priest/Knight teaching trials were bypassed by carried power. Their learning value appeared only later at Confluence, not at the nodes designed to teach them.
5. Swapping an equipped character changes active equipment score at the same time as character identity. The Alchemist experiment dropped 374 active score, making raw role attribution confounded unless equipment is transferred or the comparison explicitly controls for this.
6. A chapter-1 current-action win hypothesis remained `inconclusive` after a loss instead of being refuted. This looks like a settlement-status bug.
7. The large authoritative session file grew to roughly 40 MB and intermittently failed to write with an `UNKNOWN open session.json` error. Retrying the exact pending action succeeded; no decision or attribution was skipped.
8. Loot emotion can be order-sensitive within one batch: a common item following an exceptional item produced a disproportionately negative local comparison signal. This should be reviewed separately from the final cumulative emotion.

## Artifacts and review status

- `session.json`: authoritative full run and cognition trace.
- `summary.json`: CLI-generated compact summary.
- `artifacts/`: archived decision and attribution request/response pairs.
- Independent review: not run by this player agent. A separate reviewer should judge system behavior without inheriting these conclusions as verdicts.
