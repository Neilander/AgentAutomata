# Entity Impression Knowledge V1

This isolated experiment tests a second player-knowledge family alongside causal subject-environment-behavior-result knowledge.

```text
battle report
-> visible HP-equivalent contribution channels
-> team-relative strength
-> ally-performance environment and decomposable comparison basis
-> profile-specific perceived strength
-> accumulate pairwise character-strength evidence in a global matrix
-> solve all known character positions together
-> rebuild the current top-30-percent strength ruler
-> domain magnitude
-> retrieve and revalidate existing domain traits every battle
-> append-only impression knowledge
-> context-aware retrieval
```

The five fixtures are controlled preset reports that use the live player-semantic event shape. They are not represented as freshly simulated battles.

## Strength

```text
useful contribution
= actual enemy HP removed
 + effective healing
 + shield damage actually absorbed
 + damage actually prevented
 + control action-prevention value

expected unit contribution = team useful contribution / active unit count
relative strength = unit useful contribution / expected unit contribution - 1
```

Overkill, overheal, unused shields, raw damage taken, and kills already represented by damage are not counted again.

Positive strength uses the accepted ordinary/familiar/expert improvement bands and caps perceptual input at 150%. Negative bands are explicitly provisional in this experiment because the accepted reference does not yet freeze deterioration thresholds.

Strength cognition retains both the encounter and the ally environment. Teammates are compared with the focal subject using the same player profile, then summarized as `mostly_weak_teammates`, `weak_leaning_teammates`, `mixed_or_balanced`, `strong_leaning_teammates`, or `mostly_strong_teammates`. The observation also keeps the full visible roster fingerprint and each unit's useful contribution, so a claim such as “the Mage looked strong among mostly weak teammates” remains decomposable instead of becoming an unconditional claim that the Mage is strong everywhere.

### Current Character Strength Matrix And Relative Ruler

Immutable encounter observations and current strength cognition are separate layers. Every battle produces perceived semantic levels for its visible characters. The runtime converts them into pairwise differences, such as `Mage - Warrior`, accumulates those constraints in one global information matrix, and solves every known character position together.

```text
Matrix 1: one current scalar position for every known character
Matrix 2: the pairwise perceived differences produced by this battle

accumulated information H += C' W C
accumulated evidence    b += C' W d
current positions       x  = solve(H, b)
```

This retains the full relation graph rather than updating four characters sequentially. Matrix addition is commutative, so replaying the same evidence in a different battle order yields the same current positions. A small fixed prior anchors translation only; it does not prevent the four participants from moving together.

After every solve, all valid observed characters rebuild one shared ruler:

```text
top count      = ceil(valid known character count * 0.30)
zero boundary  = weakest Matrix-1 position inside that top 30%
relative level = round(character position - zero boundary)
```

The relative level is clamped to the shared semantic perception range and mapped back to the existing strength labels. If the boundary is 6 and a character is at 7, the displayed cognition is level 1: only a little stronger than the ruler. The Matrix-1 position itself is not overwritten when the ruler moves.

New strong characters can raise the boundary and make unchanged older characters display a lower level. Many valid weak characters expand the top-30-percent membership, can lower the boundary, and make older characters display a higher level. Invalid or stale observations should be excluded by an eligibility policy, while genuinely weak but valid characters remain in the population.

V1 currently treats every character with at least one accepted battle observation as valid. Aging and stale-evidence invalidation are not implemented yet and must not be confused with excluding weak characters.

## Traits

A domain is compared with one expected unit's total useful contribution:

```text
domain magnitude = domain useful contribution / expected unit contribution
```

The magnitude passes through the same positive perception table. A trait becomes knowledge only at shared semantic level 3 or above. This makes an expert able to name a high-end distinction earlier without granting extra low-end sensitivity.

Trait evidence reliability is a V1 heuristic, not a calibrated psychological constant:

```text
high evidence weight   = 1.00
medium evidence weight = 0.65
low evidence weight    = 0.20
trait eligibility      = weighted reliability >= 0.50
```

Boundary tests freeze these provisional values for reproducibility. They may be recalibrated later, but not silently changed inside an A/B comparison.

Before every battle updates a character, the runtime retrieves that character's current strength and trait beliefs. Every eligible domain that was actually attempted is then compared with the prior belief:

```text
strong attempted result  -> create or strengthen the trait belief
weak attempted result    -> add correction evidence; the current belief may fall below salience
no attempt               -> inconclusive; preserve the existing belief and observation count
low-reliability evidence -> inconclusive; preserve the existing belief and observation count
```

Therefore not reaching the trait threshold is correction evidence only when the report proves a valid attempt and a weak result. Merely omitting area damage in one battle does not prove that the character lacks area damage.

## Bias And Correction

The first salient observation creates a general impression and has the largest `primacyWeight`. A neutral first observation creates no salient knowledge claim, but remains in the immutable strength-observation ledger and affects later current belief. Later supporting reports increase confidence. Contradictory evidence never deletes an earlier row. It creates a new contextual knowledge row that qualifies the first impression.

The append-only observation history is not the same thing as the player's current relative belief. A no-context query first synthesizes all strength observations with finite primacy:

```text
observation weight = evidence reliability * (1 + 1 / subject observation order)
observation synthesis = weighted mean of observed semantic levels
```

That synthesis preserves primacy and contextual memory. The public no-context current belief then uses the solved Matrix-1 position relative to the live top-30-percent ruler. Both values remain available, so historical interpretation is not erased when the population-wide ruler shifts.

The first observation of that subject therefore has the highest individual observation weight, as required, while repeated reliable counterevidence can still revise the observation synthesis. Campaign battle order is retained separately for audit, but a character who joins late does not receive an artificially weaker first impression merely because other characters were observed earlier. The original biased row remains available for audit and memory.

Trait beliefs use the same principle independently for each subject and domain. Historical trait rows are immutable, while the current trait belief is synthesized from all reliable attempted observations. A sufficiently weak later attempt can make a once-salient trait currently non-salient without deleting the memory that created the original impression. A context query can still retrieve a context-specific correction before the general trait belief.

Contextual trait retrieval is domain-specific. Domains observed in the exact context use exact-context synthesis; every other known domain falls back to its current synthesized general belief, never directly to a stale immutable historical row.

A level-0 observation does not create a first impression by itself. It can still create a contextual correction when it contradicts an earlier strong or weak impression. Seeing a supposedly extreme unit perform ordinarily is meaningful evidence even though `ordinary` alone is not a salient identity.

Retrieval follows two rules:

1. An exact context tag-set match outranks a synthesized general belief; subset matches do not count as exact.
2. Without context, all observations form a current belief with finite primacy weighting.
3. Among equally matching contextual rows, evidence reliability and count outrank primacy; primacy is a final inertia/tie-break signal.

Storage and queries both normalize raw context through the same salient-tag function (at most two ordered design tags). Exact-context current belief is synthesized directly from the immutable strength-observation ledger, including neutral observations that never created a salient knowledge row. When a query contains context tags but no exact observed strength context exists, retrieval falls back to the synthesized general current belief. It must not fall back to an unrelated immutable first-impression row.

A contradiction with no salient context is stored as general evidence, not as an empty context. Empty context rows must never match every query. Re-ingesting the same report ID is ignored and cannot raise confidence or evidence count.

This deliberately permits a biased belief such as `法师在三个弱小民兵旁边显得很强`. A later armored fight can add `面对重甲精英时明显偏弱`. Against high armor the correction is retrieved first. Without context, one counterexample weakens the general belief and repeated counterexamples can replace it, while the original first-impression row remains intact.

## Report Boundary Found During Validation

The accepted live semantic report is sufficient for total strength because it contains settled per-unit damage plus visible effective healing and protection events. It is not always sufficient for exact area-versus-single-target classification.

The concept interpreter intentionally merges disposable enemy identities. When one cast hits two enemies of the same visible concept, distinct target IDs are no longer available. The analyzer must not guess that two same-time damage events mean area damage because a true multi-hit single-target skill has the same shape.

Future live integration therefore needs one player-visible aggregate on damage events:

```text
result.meta.visibleTargetCount
```

The raw-to-semantic interpreter can calculate this before deleting raw IDs. Until that signal exists, trait knowledge from old live reports is lower-confidence and may undercount area damage.

## Agent Boundary Found During Validation

Independent Agents consistently calculated total contribution, team average, and relative strength when given explicit formulas. They did not consistently infer the domain formula or trait-update rules from prose:

- one Agent subtracted 100% from domain magnitude as if it were total relative strength;
- one Agent treated high purity as a trait even when magnitude was below the level-3 threshold;
- one Agent treated a battle without a domain result as evidence that an existing trait was false.

Therefore the executable boundary should be:

```text
code: contribution, relative strength, perception bands, domain magnitude,
      evidence reliability, threshold gating, primacy, contextual retrieval
Agent: evidence-bound wording and causal hypotheses only
code: later structured evidence validates a hypothesis before code may promote it
```

The Agent may audit the arithmetic, but its free-form calculation is not the source of truth. Agent-authored causal interpretation cannot directly become knowledge, even if it passes schema validation; it remains a hypothesis until later structured evidence validates it.
