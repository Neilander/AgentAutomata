# Agent Handoff: UFS paired V4 sealed old arm

- Date: 2026-09-01 13:24 +08:00
- Agent/thread: paired V4 old-arm isolated worker
- Scope: Execute and seal only the original default single-step planner arm under the frozen V4 protocol.
- Status: complete

## User Intent

Run one fresh continuous original-policy UFS session against the shared V4 protocol through exactly
three helper-recognized completed-round boundaries, preserve complete deterministic evidence, and
report only this old arm without making a cross-arm comparison.

## Completed

- Verified the frozen protocol, helper, helper test, sealed pre-run result, public initial state,
  and public map hashes before session construction or random consumption.
- Imported the exact shared safety helper and ran its three host-free structural cases; all matched
  the frozen expected booleans, with no host runtime import and zero random draws.
- Ran one fresh isolated session at attention seed `2026090104` with xorshift32 seed `0x243f6a88`.
- Called the existing default `planCurrentChoice()` exactly once for each of 36 non-random public
  choices and submitted each sole `recommendedPayload` unchanged.
- Used the external provider exclusively for five public random contracts and 13 ID-bound draws.
- Stopped at exactly the third imported-helper boundary. Formal host inspection occurred exactly
  three times, only after helper acceptance, and was never fed into later planning.
- Sealed machine evidence, full random tape, exact third-boundary checkpoint, manifest, arm-local
  results, and a 19-check focused verifier. Verification passes 19/19.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/old-arm/`: old-arm-only runner, preflight, verifier, evidence, checkpoint, manifest, README, and RESULTS.
- `coop_repo/reports/2026-09-01_1324_ufs-paired-v4-old-arm.md`: this handoff.
- `coop_repo/LATEST.md`: appended the old-arm completion entry.

No shared protocol/helper/test, V4 new-arm file, core runtime, initializer, controller, or frozen
asset was modified.

## Validation

- `node --check` on `preflight-old-arm.js`, `run-old-arm.js`, and `verify-old-arm.js`: PASS.
- `node .../old-arm/preflight-old-arm.js`: PASS; frozen hashes matched; host-free cases 3/3;
  host runtime imported false; session constructed false; random draws 0.
- `node .../old-arm/run-old-arm.js`: PASS; one fresh session completed and stopped at boundary 3.
- `node .../old-arm/verify-old-arm.js`: PASS, 19/19 checks.
- Action policy: 36 plans / 36 submitted deliberate actions; every submission byte-for-byte equals
  its unique call's default recommendation; 0 planner failures and 0 live rejections.
- Forbidden paths: 0 manual rescue, 0 external-policy actions, 0 sequential imagination calls,
  0 automatic-controller calls, and controller module not loaded.
- Random tape: 13/13 draws independently recomputed and matched ordinal/raw/value/ID/full public
  contract/round/reason; 0 extra, missing, retry, skip, reorder, or mismatch.
- Boundary/checkpoint: three shared-helper boundaries and three guarded audits; final checkpoint
  canonical hash matches audit 3 and contains three completed rounds at `new_round` phase.

## Current State

The V4 old arm is valid and sealed. Boundary metrics were:

- Round 1: energy 2, damage 0, research 0, mothership 0, 6 ships, ship-row sum 15, max row 5.
- Round 2: energy 2, damage 0, research 0, mothership 1, 6 ships, ship-row sum 32, max row 9.
- Round 3: energy 2, damage 0, research 0, mothership 2, 7 ships, ship-row sum 50, max row 14.

This report intentionally states only the old arm and makes no comparison or advantage claim.

## Unresolved

- Complete blindness to `coop_repo/LATEST.md` cannot be claimed because repository coordination
  exposed a V4 new-arm summary. The parent task froze the old strategy before execution, tuning was
  prohibited, and no V4 new-arm directory or new-arm-specific report was read.
- This is a deterministic three-round run under one frozen attention/random stream; it does not by
  itself establish statistical generality, win rate, or relative policy quality.

## Recommended Next Step

The parent task may perform the separately authorized paired comparison using the two sealed arm
artifacts. Begin with this old-arm `RESULTS.md` and `verification.json`; do not alter either arm's
evidence.
