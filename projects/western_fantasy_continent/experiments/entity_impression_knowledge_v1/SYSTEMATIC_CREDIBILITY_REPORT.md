# Entity Impression Systematic Credibility Test

## Verdict

`CREDIBLE_WITH_GUARDRAILS`

The previously blocking environment, trait-revalidation, and population-scale problems are addressed. Strength observations retain the ally environment and full comparison basis; trait impressions are revalidated from attempted domain evidence; and one global pairwise information matrix now solves current character positions before rebuilding the top-30-percent ruler. The formal player session consumes this code-owned state. The remaining warning is the provisional shared negative-perception scale; these tests still do not calibrate human psychology.

## Test Matrix

Four controlled suites were built. Every suite contains exactly five preset battles using the live player-semantic report shape:

1. `contextual_correction`: extreme weak-team first impression, ordinary evidence, repeated high-armor counterevidence, and a low-armor rebound.
2. `profile_trait_resolution`: Mage, Priest, Guardian, and Ranger signals around the 60%-80% perception boundaries, including a later weak Mage area-damage attempt.
3. `roster_replacement_identity`: Ranger and an analogous Duelist enter at different campaign positions and receive separate strong/weak evidence.
4. `team_relative_confounding`: the Alchemist stays fixed at 200 useful contribution while only teammate output changes.

Each suite ran ordinary, familiar, and expert perception profiles across all 120 permutations of its five battles: 1,440 complete five-battle sequences and 7,200 battle analyses.

Two direct deterministic probes complement the suites: a `3, 6, 12, 9` four-character state tested simultaneous movement, and a 20-character population tested ruler changes after adding three strong or ten valid weak characters.

## Passed Findings

### The character positions are solved together

One battle applied perceived levels `0, 2, 6, 6` to starting positions `3, 6, 12, 9`. The global solve moved all four positions to `3.941, 6.000, 10.118, 9.941`. The runtime accumulates the complete pairwise normal matrix and evidence vector, so battle evidence is added commutatively rather than folded into four sequential overwrites. A direct eight-character overlapping evidence graph produced maximum per-character position difference `0` when its reports were reversed. Across every permutation in the systematic suites, the final matrix positions were also invariant for the same evidence graph.

### The top-30-percent ruler has the intended population behavior

For 20 valid known characters, the top count was six and the zero boundary was position 6; a position-9 character displayed level 3. Adding three strong characters increased the population to 23, made the top count seven, raised the boundary to 8, and reclassified that unchanged old character to level 1. In a separate 20-character baseline, adding ten valid weak characters increased the top count to nine, lowered the boundary to 4, and reclassified the same old character from level 3 to level 5.

The stored Matrix-1 positions do not shift merely because the display ruler moves. Historical observation synthesis also remains separately available, so a population-wide reclassification does not rewrite what the player saw in an earlier battle.

### The formal player session owns the cognition

Every completed challenge now feeds its player-semantic battle log and visible squad into the entity-impression runtime. The persisted session stores the selected ordinary/familiar/expert perception profile and the matrix state. The following decision request receives compact code-owned `characterImpressions`; the AI cannot calculate or write positions. Causal subject-environment-behavior-result knowledge remains a separate store.

### Perception profiles preserve objective evidence

Useful contribution, channels, domains, team average, and raw relative strength were identical across all three profiles. Only perceived semantic levels and trait gates changed. The matrix found four strength cases and sixty trait cases where profiles produced different semantic resolution. At 65% area-domain magnitude, only the expert profile reached shared semantic level 3 and initially learned the area-damage trait.

### Ally environment is retained instead of collapsed

The Alchemist's useful contribution remained exactly 200 in all five reports:

| Teammate baseline | Relative strength | Expert semantic level |
| --- | ---: | ---: |
| three teammates at 50 | +128.571% | 7 |
| three teammates at 100 | +60.000% | 3 |
| three teammates at 200 | 0.000% | 0 |
| three teammates at 300 | -27.273% | -1 |
| teammates at 100/200/300 | 0.000% | 0 |

The 155.844-point swing is still real and intentionally visible as a within-team impression. It is no longer stored as an unconditional character fact. Every strength observation retains:

- focal and team useful contribution;
- expected unit contribution and active-unit count;
- full roster fingerprint;
- each visible teammate's contribution and relative comparison;
- an ally-performance environment such as `mostly_weak_teammates` or `mostly_strong_teammates`.

Retrieval can filter exact encounter evidence by ally-performance band or roster fingerprint, and synthesized beliefs expose their evidence basis. Historical prediction can therefore distinguish “the character changed” from “the comparison team changed,” provided the prediction stage actually consumes these fields.

### Trait impressions are revalidated rather than frozen

Every battle records a review of the character's existing impressions. For each domain visibly attempted in that battle, the current subject-domain belief is retrieved before the new observation is appended.

In the direct regression, the expert Mage first produced a salient area-damage belief at level 3. A later valid but weak area-damage attempt produced level 0 contextual correction evidence. The general current belief fell to level 2 and became non-salient; the exact battle context retrieved level 0. A subsequent battle with no area-damage attempt did not add counterevidence or reduce the belief further.

Historical trait rows remain immutable for memory and audit. Current trait cognition is synthesized from the append-only attempted-observation ledger, so later counterevidence can revise the active belief without erasing the original impression.

### Counterevidence and order remain bounded

The immutable first-impression row remains available, while repeated strength counterevidence revises the current general belief and exact-context retrieval surfaces local corrections first. Primacy uses each subject's local observation order; moving another character earlier or later does not change this character's first-impression weight.

Across all 120 battle orders, final synthesized trait levels for every tested subject-domain pair spanned at most one semantic band. This checks the belief used for prediction, not the intentionally order-dependent sequence of historical correction rows.

### Replacement identities remain isolated

Ranger and Duelist produced no cross-subject strength observations, trait observations, or knowledge rows. Reordering campaign entry while preserving a subject's own evidence order produced the same subject-local primacy result.

## Remaining Guardrails

### Negative perception is not profile-specific

Sixteen negative observations were found. All three profiles mapped them through the same provisional deterioration table. Positive high-end resolution is tested; negative resolution still needs an explicit design decision or separate calibration.

### Attempt is visible-result based

The current correction contract can distinguish a weak recorded area-damage attempt from no recorded area-damage attempt. It cannot infer that an unrecorded tactical opportunity existed and the character declined to use a trait. Absence therefore remains inconclusive.

### Controlled reports do not calibrate psychology

The 7,200 analyses are permutations of twenty controlled semantic reports, not fresh stochastic combat and not observations of human players. They validate formula wiring, storage semantics, identity isolation, bounded order behavior, and revalidation logic. They do not establish the correct numerical size of human primacy, perception thresholds, or HP-equivalent utility weights.

The formal cognition runtime is integrated without retuning emotion or causal knowledge. Its required causal-loop regression passes and verifies that four visible squad members persist in the impression matrix, use a two-character `ceil(4 * 0.30)` ruler, and appear in the next decision request.

Ruler eligibility currently means at least one accepted battle observation. There is no time-based stale-data invalidation yet. This is distinct from genuinely weak valid characters, which intentionally remain in the population and affect the ruler.

Low-reliability attempted evidence is retained in the raw audit ledger but filtered out of the synthesized current belief. A manual independent check confirmed that current level and synthesized observation count remain unchanged; a dedicated fixed regression case should still be added when that branch becomes prediction-critical.

## Independent Review

The earlier independent review accepted the environment and trait-revalidation layer with guardrails. A fresh independent read-only review returned `ACCEPT_WITH_GUARDRAILS` for the global matrix, ruler, and formal-session integration. It confirmed simultaneous global solving, commutative evidence accumulation, correct top-30-percent behavior, separation of historical observation synthesis from current relative cognition, and isolation from causal knowledge. Its requested direct per-character order-commutativity regression was added and passes with zero position difference.

## Recommended Next Step

The integrated character-impression state is suitable to begin a guarded historical success/failure prediction experiment. Prediction must consume stored encounter and ally comparison evidence alongside the current relative level. Keep negative-scale calibration and stale-data eligibility as explicit warnings, and do not treat missing trait behavior as negative evidence.
