# Agent Handoff: UFS paired V3 old arm invalid boundary audit

- Date: 2026-09-01 13:03 +08:00
- Agent/thread: paired old arm
- Scope: sealed original/default-planner arm only
- Status: blocked

## User Intent

Run the frozen original `UfsFullGameAttentionSession.planCurrentChoice()` policy for three
consecutive rounds under the shared paired V3 protocol, preserve exact external randomness and
per-choice evidence, audit the formal host only at round boundaries, and emit an arm-local
validator/checkpoint/result without comparing against the new arm.

## Completed

- Verified the shared protocol, public initial state, and public map hashes before execution.
- Locked the old policy to one `planCurrentChoice()` invocation at every non-random public choice
  and unchanged submission of its `recommendedPayload`.
- Implemented a standalone xorshift32 provider, evidence recorder, draw tape, and focused validator
  inside `old-arm/` only.
- Preserved every default plan summary, selected/submitted operation, true public response, random
  binding, source hash, and failure record.
- Preserved an earlier preflight failure that consumed no random draw rather than deleting it.
- Stopped without retry after the intended formal run had consumed random draws and exposed a
  boundary-recognition defect.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/run-old-arm.js`: sealed original-policy runner and external random provider.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/verify-old-arm.js`: focused evidence validator.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/README.md`: run contract and sealed invalid status.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/RESULTS.md`: old-arm-only result and failure disclosure.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/machine-evidence.json`: 116 plans/actions and all public responses through terminal failure.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/random-draw-tape.json`: 57 ordered/bound draws.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/run-manifest.json`: sealed status and evidence hashes.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/verification.json`: 19-check focused verifier output.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v3/old-arm/preflight-failed-attempt/`: retained no-draw preflight failure.
- `coop_repo/LATEST.md`: appended this old-arm status.

## Validation

- `node --check .../old-arm/run-old-arm.js`: passed before execution.
- Protocol SHA-256: passed, `5b84f209dd3704044bbbdf326d9ad35f2a70ecdf4e5a45b287d6b2b258f4a8eb`.
- Frozen public assets: both hashes passed.
- `node .../old-arm/verify-old-arm.js`: expected nonzero exit; 14/19 checks passed and the
  completion, exact-stop, formal-audit, checkpoint-exists, and third-boundary-checkpoint gates
  failed.
- Authenticity checks passed: 116/116 deliberate actions came directly from that boundary's one
  default plan; 0 rejects, 0 rescue, 0 external policy action, 0 sequential-imagination call, and
  0 automatic-controller call.
- Random-stream checks passed for the executed (invalidly overlong) run: 57/57 contiguous draws,
  public ID order preserved, and values bound to the submitted contracts.

## Current State

The old-arm evidence is sealed but invalid for pairing. The runner's safe-boundary predicate
required public status `choice`, whereas actual `waiting_for_next_round_roll` responses have status
`random`. Therefore it saw nine public round boundaries, captured zero allowed formal host audits,
did not stop after round three, and ended in round 10 at public `maximum_damage`. A compliant final
checkpoint was never captured. The first three public boundary responses are retained in RESULTS
only as public observations, never mislabeled as formal metrics.

The repository coordination file exposed a summary of new-arm work. The policy was already fixed
by the parent task and could not be tuned; no new-arm directory or new-arm-specific report was
opened.

## Unresolved

- The required 3/3 formal safe boundaries and final checkpoint are absent.
- This arm cannot be compared with another arm.
- A fresh rerun in this arm would violate the protocol's no-preview/no-retry rule because 57 random
  values were already consumed and observed. This agent therefore did not rerun or repair evidence.

## Recommended Next Step

Treat this old arm as invalid and do not compare it. If the study owner authorizes a wholly new
paired protocol/experiment version with fresh precommitted randomness, begin by correcting the
boundary predicate to accept `status: random` plus `reason: waiting_for_next_round_roll`, and test
that predicate structurally before any formal run. Do not reuse this V3 draw stream.
