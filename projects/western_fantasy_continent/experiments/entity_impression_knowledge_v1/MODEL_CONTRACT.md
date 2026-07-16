# Entity Impression Knowledge V1

This isolated experiment tests a second player-knowledge family alongside causal subject-environment-behavior-result knowledge.

```text
battle report
-> visible HP-equivalent contribution channels
-> team-relative strength
-> profile-specific perceived strength
-> domain magnitude
-> traits whose semantic level is at least 3
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

Not reaching the trait threshold in one battle is not evidence that the character lacks the trait. Absence can become correction evidence only when the report proves that a valid opportunity existed, the relevant behavior was attempted, and the result remained weak. The V1 runtime deliberately learns positive trait evidence only.

## Bias And Correction

The first salient observation creates a general impression and has the largest `primacyWeight`. A neutral first observation creates no salient knowledge claim, but remains in the immutable strength-observation ledger and affects later current belief. Later supporting reports increase confidence. Contradictory evidence never deletes an earlier row. It creates a new contextual knowledge row that qualifies the first impression.

The append-only observation history is not the same thing as the player's current belief. A no-context query synthesizes all strength observations with finite primacy:

```text
observation weight = evidence reliability * (1 + 1 / observation order)
current semantic level = weighted mean of observed semantic levels
```

The first observation therefore has the highest individual weight, as required, while repeated reliable counterevidence can still revise the current general belief. The original biased row remains available for audit and memory.

A level-0 observation does not create a first impression by itself. It can still create a contextual correction when it contradicts an earlier strong or weak impression. Seeing a supposedly extreme unit perform ordinarily is meaningful evidence even though `ordinary` alone is not a salient identity.

Retrieval follows two rules:

1. An exact context tag-set match outranks a synthesized general belief; subset matches do not count as exact.
2. Without context, all observations form a current belief with finite primacy weighting.
3. Among equally matching contextual rows, evidence reliability and count outrank primacy; primacy is a final inertia/tie-break signal.

Storage and queries both normalize raw context through the same salient-tag function (at most two ordered design tags). Exact-context current belief is synthesized directly from the immutable strength-observation ledger, including neutral observations that never created a salient knowledge row. When a query contains context tags but no exact observed strength context exists, retrieval falls back to the synthesized general current belief. It must not fall back to an unrelated immutable first-impression row.

A contradiction with no salient context is stored as general evidence, not as an empty context. Empty context rows must never match every query. Re-ingesting the same report ID is ignored and cannot raise confidence or evidence count.

This deliberately permits a biased belief such as `灰鸦战士很强` after seeing him beside three weak militia. A later armored fight adds `面对重甲精英时明显偏弱`. Against high armor the correction is retrieved first. Without context, one counterexample weakens the general belief and repeated counterexamples can replace it, while the original first-impression row remains intact.

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
