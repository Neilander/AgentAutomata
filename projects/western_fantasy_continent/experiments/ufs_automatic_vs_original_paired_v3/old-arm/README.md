# UFS paired V3 old arm run protocol

This directory seals only the original/default-planner arm. It does not compare arms.

The policy was fixed before execution: at every non-random public choice boundary, call
`UfsFullGameAttentionSession.planCurrentChoice()` exactly once and submit its returned
`recommendedPayload` unchanged. At a public random boundary, an external xorshift32 provider
consumes one value for each listed public ID in listed order. The run never calls
`imagineSequentialPlan()` or the V2 automatic multi-cutpoint controller, and it has no manual
fallback when the default planner cannot return an operation.

Formal host inspection occurs only after the public response reaches
`waiting_for_next_round_roll`. Boundary metrics are recorded but never enter later planning.
The third such boundary supplies the sealed final checkpoint.

Run once from the repository root:

```text
node projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/run-old-arm.js
node projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/verify-old-arm.js
```

The runner refuses to overwrite existing evidence.

## Sealed execution status

Do not rerun this directory. The intended formal execution exposed that
`waiting_for_next_round_roll` has public status `random`, while the runner's audit predicate
incorrectly required status `choice`. It therefore passed nine public round boundaries without
performing the required host audit or stopping at the third, then ended at `maximum_damage`.
Because its external provider had already consumed random draws, no retry was made. See
`RESULTS.md` and `verification.json`; this arm is invalid for paired comparison.
