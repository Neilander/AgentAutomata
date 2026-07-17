# Roster Change Expectation V1

This layer answers one bounded player question:

```text
After this exact team failed here, what should I currently expect from each legal one-character replacement?
```

It does not erase the failure and does not turn character cognition into hidden game truth.

## Evidence Scope

Every challenge stores:

```text
encounter + ordered team fingerprint + equipped power + equipped-build fingerprint when available + visible performance + outcome + visible context tags
```

An exact team-and-encounter observation at comparable equipped power, equipped build, and current character cognition outranks all counterfactual calculation. Therefore, if one particular replacement already failed here under comparable conditions, that evidence applies to that composition. It must not become the rule `all character swaps fail`. Exact prediction combines recent outcome distribution with HP-margin performance; a recorded loss cannot be relabeled as success merely because its final HP margin was favorable. A material equipment change, an equal-score but different equipped build, a character-position shift larger than 1.25 semantic levels, or a context-relevant trait-belief shift larger than 1.25 levels invalidates the old roster-only interpretation instead of pretending the old evidence still answers the current question.

Counterfactual prediction requires a comparable history for the exact current team. If that baseline is missing, V1 returns `unknown`; it never borrows another composition's outcome and calls it the current-team baseline. When the current baseline exists but the candidate composition has no exact history, V1 compares the incoming and outgoing characters using current player cognition:

```text
strength delta = incoming Matrix-1 position - outgoing Matrix-1 position

trait delta = incoming relevant current trait levels
            - outgoing relevant current trait levels

effective level delta = strength delta + 0.35 * trait delta

predicted performance = prior exact-team performance
                      + 0.12 * effective level delta
```

The current context mapping uses only visible encounter evidence:

- many visible targets: area damage and control;
- one or two visible targets: single-target and sustained damage;
- defeat or low remaining team HP: healing, shielding, durability, and control.

V1 does not yet map richer visible contexts such as heavy armor, control immunity, backline pressure, or formations. Unsupported context does not activate a guessed trait relation. This is a safe `not modeled` boundary, not evidence that those traits do not matter.

A trait domain contributes only when both the incoming and outgoing characters have accepted observations for that domain. `No observation` is unknown, not level 0. A reliable attempted level-0 result is known weak evidence and may be compared. Missing domains are listed in `unknownTraitDomains` and reduce counterfactual confidence.

The coefficients `0.35` and `0.12` are provisional prediction mappings, not human-calibrated or balance-authoritative constants. The output is an expectation band (`likely_failure`, `uncertain_near_boundary`, or `plausible_success`), not a guaranteed outcome or hidden win probability.

## Old And Unknown Evidence

Exact composition history uses at most the five most recent observations, with descending recency weights. This prevents a large pile of old observations from dominating indefinitely without deleting audit history.

If the incoming or outgoing character has no accepted combat cognition, V1 returns `unknown`. It does not copy the current team's failure onto an unseen character.

## Ownership

- Code records exact-roster outcomes and calculates every legal swap expectation.
- Character positions and traits come from the persistent entity-impression state.
- The decision Agent reads the resulting alternatives but cannot write the prediction or cognition state.
- Causal knowledge and generic runtime failure memory remain separate. This layer narrows their application for roster planning; it does not overwrite them.

V1 predicts one legal single-slot `swap:` action at a time. Several slots can be changed through successive decisions and every intermediate battle receives its own exact roster memory. A simultaneous multi-slot action is not silently approximated; it remains unsupported until the game exposes such an affordance.

## Settlement Repairs

The selected prediction remains code-owned after the swap.

- `C` represents self-serving confirmation of the player's chosen roster decision. It is scaled by effective confidence, perceptual strength, and goal importance. Visible actual-versus-expected combat progress supplies an asymmetric geometric multiplier: ratios at or above `1` grow with `ratio^0.5`; a lower result that remains in the same perceived band decays with `ratio^1.5`; crossing downward into a lower perceived band is clear failure and forces `C = 0`; the positive multiplier is capped at `2`.
- Direct result `R` stays separate from `C`. Confirming an expected loss therefore confirms the player's understanding without turning the loss itself into a positive result.
- An explicit equipment action recalculates the pending prediction instead of invalidating it. The audit keeps base cognition strength, equipment multiplier, effective expected strength, and predicted score before and after the change.
- Equipment multiplier uses the “reaches X% of base” convention. Base strength `5` at multiplier `2.0` produces effective expected strength `10`.
- A different encounter keeps the prior expected strength unchanged and reduces only its effective confidence. With weak-inertia weight `0.25`, expected strength `5` remains `5`, while source confidence `0.7` becomes effective confidence `0.175`. A visible Boss label or visible trial/field rule is a strong difficulty signal and may replace the inherited expectation at weight `0.7`.
- A different team still invalidates the prediction; a later swap still supersedes it.

These constants are provisional. The focused deterministic test is `test-expectation-repair-trio.js`; it is a program-contract check, not multi-profile gameplay calibration.
