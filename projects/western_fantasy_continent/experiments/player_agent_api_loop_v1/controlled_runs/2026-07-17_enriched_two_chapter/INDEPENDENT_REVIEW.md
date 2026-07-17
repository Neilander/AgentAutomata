# Enriched Two-Chapter Independent Review

- Review date: 2026-07-17
- Scope: `open_novice/paired-alpha`, `safety_conservative/paired-alpha`, `damage_absolutist/paired-alpha`, enriched runtime code, and `mechanical-bottlenecks.json`
- Overall verdict: **reject**

## What the verdict means

The three trajectories remain useful qualitative diagnostics, and the agents' selected actions are mostly plausible for their assigned profiles. They are not acceptable as a validation of the full `player-cognition-simulation` model or of the two-chapter progression design. There are four blocking reasons:

1. Raw combat diagnosis fields, including disposable enemy names and internal role strings, enter canonical knowledge and later player requests without concept interpretation.
2. The implemented cognition trace does not expose or exercise the full skill-required model, especially auditable `P`, `Q`, `R`, `kP`, and Agency-mediated choice; profile priors also remain static `unverified_prior` records after contradictory experience.
3. Reward expectation is learned sequentially inside one simultaneous loot batch, creating an order artifact rather than a player-plausible prior.
4. Visible equipment bypasses most intended Chapter 2 role/mechanic lessons; the mechanical enumeration also omits the two bosses and `r1_main_10`.

The requested model was `5.5fast`, but all three summaries record `actualModel: unknown_platform_default`. Therefore even the profile-behaviour observations below apply to the archived trajectories, not to a verified named-model configuration.

## Blind-review protocol and independence

I reviewed the complete player-cognition skill and its referenced model/protocol material, then inspected the raw session/artifact pairs, selected cycle records, the enriched runtime/validator/analyser code, and `mechanical-bottlenecks.json`. I did **not** read `STATISTICAL_REPORT.md` or `aggregate-statistics.json`, and did not adopt the main thread's diagnosis.

I previously generated the `damage_absolutist/paired-alpha` trajectory. Its behavioural assessment is therefore **not fully independent**. The open and safety trajectories, code audit, signal-boundary audit, and mechanical enumeration were reviewed independently.

## Profile behaviour assessment

### `open_novice/paired-alpha`: behaviour accept, validation reject

The behaviour fits an open novice well. The player changes the starting roster before the first combat, samples newly rescued roles, creates next-combat hypotheses, and reverses a refuted experiment instead of defending it indefinitely. Examples include drummer at Chapter 1 cycle 1, mage at cycle 6, berserker at cycle 8, ranger at cycle 12, and the Chapter 2 warlock/knight/priest/alchemist sequence.

The strongest corrective segment is Chapter 1 cycles 16-22: bard is tried, `r1_main_6` is lost, equipment is improved, berserker is restored, and the encounter is then won. That is plausible exploration followed by evidence-sensitive correction.

This does not validate the level's teaching. Almost every new composition succeeds immediately once equipment is present, so successful hypothesis checks often prove only that a capability appeared or an easy fight was won, not that the inferred cause was necessary.

### `safety_conservative/paired-alpha`: behaviour accept, route/design reject

The behaviour strongly fits the profile. The player preserves warrior, barricade, spear, and healer through the early route; equips frontline and healing units; farms known encounters after losses; and makes narrow roster changes only after repeated evidence. Mage is introduced at Chapter 1 cycle 26 after repeated `r1_main_6`/bandit failures, and ranger at cycle 37 after the `r1_main_7` loss.

The run nevertheless ends at the 60-cycle cap without clearing Chapter 1. The player loses `r1_boss` at cycles 51 and 56, tests assassin on `r1_main_10`, returns to a geared mage at cycle 59, and reaches the cap after another farm win at cycle 60 before it can retest the boss. This is not mere refusal to learn: it is a cautious, evidence-driven route that never receives a legible, safety-compatible closure within the allowed budget. The ensemble therefore exposes a profile-specific progression trap.

### `damage_absolutist/paired-alpha`: behaviour accept with independence caveat

The trajectory consistently prioritizes output: mage enters at Chapter 1 cycle 5, berserker replaces the healer at cycle 7, and ranger replaces the weak slot after the `r1_main_7` loss at cycle 19. In Chapter 2 the same warrior/mage/ranger/berserker core clears both trials and confluence without adopting their showcased sustain roles.

The best adaptive segment is Chapter 2 cycles 14-18. The pure-output team loses `r2_boss`; the mage is replaced by knight; knight receives two strong items; the lower-total-power revised team then wins. This is meaningful falsification of “more damage is always better,” but the causal attribution is confounded by the two equipment changes. The roster prediction selected at cycle 15 is consequently invalidated as `different_equipment_build` rather than settled against the boss result.

Because I generated this trajectory earlier, treat this profile-fit judgment as corroborating evidence only.

## Evidence and attribution legality

### Structurally legal

Across the archived decision/attribution pairs:

- every selected action is present in that cycle's `allowedActions`;
- every cited knowledge ID exists;
- every cited semantic event ID belongs to the current event log; and
- attribution evidence IDs are contained by the selected knowledge record's evidence set.

The open and damage sessions also preserve one agent session ID across the chapter transition. Terminal transition/completion requests without paired responses are orchestration endpoints, not illegal player decisions.

### Semantically illegal signal boundary

`player-agent-loop.js` builds `threat_profile` knowledge by spreading `record.gameEvent.diagnosis` directly into canonical knowledge. The diagnosis includes raw `firstAllyDeath.killer` and `enemySurvivors[].name/role/hpRatio` fields. These fields bypass the concept interpreter and later appear in attribution and decision requests.

Minimal proof:

- `open_novice`, Chapter 1, cycle 17, `challenge:r1_main_6`: `artifacts/chapter-1-attribution-017-request.json` contains `firstAllyDeath.killer: "重甲盗匪2"` and an enemy survivor named `"重甲盗匪1"` with internal role `"knight"`.
- `safety_conservative`, Chapter 1, cycle 16, `challenge:r1_main_6`: `artifacts/chapter-1-attribution-016-request.json` contains `firstAllyDeath.killer: "路匪弓手4"` and survivors including `"重甲盗匪2"` with role `"knight"`.

This is a hard rejection issue: attribution responses may cite legal IDs while reasoning over an illegally enriched observation.

## Cognition and expectation `A`

### Full cognition-model coverage is not demonstrated

The runtime applies fixed decision, verification, and mechanical-time emotion deltas and records acquired/expectation/process totals. It does not provide a complete auditable trace of the skill's `P`, `Q`, `R`, `kP`, and Agency terms or show Agency governing action selection. Consequently high final emotion values (open `97.3944`, damage `95.7120`) cannot be read as validation of the complete cognition model. Safety ends failed at `58.5257`, further showing that the scalar can remain moderately positive despite a terminal progression failure.

Profile priors are carried as unchanged `unverified_prior` objects. Behaviour can change through conversation and retrieved knowledge, but the code-owned prior itself does not gain confidence, weaken, or become refuted. That prevents an auditable distinction between persistence, mistaken belief, and learned correction.

### Intra-batch expectation is temporally invalid

Minimal proof: `open_novice`, Chapter 1, cycle 2, `challenge:r1_main_1`. The first reward batch contains a mythic boots event followed by a common ring event. The mythic item is ingested with `expectation: no_prior`; it immediately updates knowledge; the following common item in the same batch then receives expectation emotion `-1.7797` against that just-seen mythic reward.

The player did not have the mythic result as a prior before the batch. Expectations must be frozen at action/batch start, or simultaneous results must be evaluated as a batch, before learning from the batch is committed.

### Roster-specific `A` is too sparse and sometimes invalidated

Open and safety record zero roster-prediction settlements. Damage has one valid settlement: Chapter 1 cycle 19 `swap:2:hero_ranger` predicts only `0.0526` improvement (“没有明显差别”) for `r1_main_7`; the cycle 20 win resolves to `0.2842`. The more design-relevant Chapter 2 boss prediction at cycle 15 is invalidated at cycle 18 because knight's equipment fingerprint changed.

One resolved sample, made with `predictionEvidenceScope: insufficient_player_knowledge` and null confidence, cannot validate `A` across profiles or chapters. The invalidation is correct bookkeeping, but it leaves the decisive boss correction without a roster-only expectation settlement.

## Equipment and level exposure

The mechanical enumeration shows equipment dominating the intended roster/mechanic lessons:

| Encounter | Bare win rate | Best-visible-equipment win rate |
|---|---:|---:|
| `r1_main_6` | 36.90% | 55.95% |
| `r1_main_7` | 35.32% | 56.75% |
| `r1_main_8` | 89.68% | 99.21% |
| `r1_main_9` | 44.05% | 92.62% |
| `r2_shield_trial` | 19.79% | 94.76% |
| `r2_flag_trial` | 13.36% | 91.47% |
| `r2_confluence` | 12.69% | 97.90% |

The damage trajectory supplies the minimal player trace: Chapter 2 cycles 8, 10, and 12 clear `r2_shield_trial`, `r2_flag_trial`, and `r2_confluence` with warrior/mage/ranger/berserker. No knight or priest is needed, and three allies survive each cited trial/confluence win. The encounters therefore expose their themed roles but do not require the player to learn or use the showcased mechanic once visible equipment is equipped.

The enumeration does not include `r1_main_10`, `r1_boss`, or `r2_boss`. Thus it cannot support a claim that the complete two-chapter route, especially its terminal checks, is mechanically covered. The damage boss correction suggests the final boss may enforce sustain, but it is only one confounded trajectory rather than an enumerated boundary.

## Minimal proving traces

| Finding | Profile | Chapter | Cycle(s) | Action(s) | What the fragment proves |
|---|---|---:|---:|---|---|
| Raw signal leak | open novice | 1 | 17 | `challenge:r1_main_6` | Attribution input exposes disposable enemy names/internal role through raw diagnosis. |
| Raw signal leak | safety conservative | 1 | 16 | `challenge:r1_main_6` | The same boundary failure occurs independently in a second profile. |
| Batch-order `A` artifact | open novice | 1 | 2 | `challenge:r1_main_1` | The second simultaneous drop is compared against the first drop from the same batch. |
| Safety-profile dead end | safety conservative | 1 | 51, 56, 60 | boss loss; boss loss; farm win/cap | Evidence-driven cautious correction has no opportunity to close the route within 60 cycles. |
| Intended mechanics bypassed | damage absolutist | 2 | 8, 10, 12 | shield trial; flag trial; confluence | A geared pure-output core clears all three without the showcased roles. |
| Positive falsification | damage absolutist | 2 | 14-18 | boss loss; knight swap/equip; boss win | Damage-only prior is revised, but roster and equipment effects are confounded. |
| Only resolved roster `A` | damage absolutist | 1 | 19-20 | ranger swap; `r1_main_7` win | Roster expectation settlement works once, but coverage is one profile/one encounter. |

## Required conditions before acceptance

1. Remove raw diagnosis spreading from player-visible canonical knowledge; pass every player-visible combat fact through the concept/signal interpreter and add a regression test for disposable IDs/internal role strings.
2. Freeze expectation priors at action/batch start and commit learning only after all simultaneous results are evaluated.
3. Emit and validate the full cognition state required by the skill, including `P/Q/R/kP`, Agency, prior-confidence revision, and the link from cognition to the selected action.
4. Run roster-prediction `A` settlements across all profiles and both chapters with matched encounter and equipment fingerprints; report invalidations separately from settlements.
5. Rebalance or constrain visible equipment so the shield, flag, and confluence encounters discriminate the intended mechanic, then enumerate `r1_main_10`, both bosses, and relevant gear/roster boundaries.
6. Re-run the safety profile with a route that preserves its identity while exposing a legible, achievable correction before the cycle cap.

Until these conditions are met, the correct aggregate disposition is **reject as a cognition/progression validation**, while retaining the archived runs as diagnostic counterexamples.
