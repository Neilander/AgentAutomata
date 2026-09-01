# Agent Handoff: UFS paired V4 sealed new arm

- Date: 2026-09-01 13:16 +08:00
- Agent/thread: paired V4 new arm
- Scope: fresh shared V4 protocol/boundary contract and sealed automatic-multicutpoint new arm only
- Status: complete

## User Intent

Replace the invalid V3 pairing with an entirely fresh V4 protocol/random stream, structurally test the real completed-round boundary before any formal random consumption, then run the sealed V2 automatic multi-cutpoint controller plus `imagineSequentialPlan()` for three continuous completed rounds. Preserve machine evidence, exact public-contract draw binding, final checkpoint, focused verification and an arm-local result without inspecting or comparing the old arm.

## Completed

- Created a new V4 experiment directory without modifying or removing any V3 evidence.
- Froze identical public initial state/map, attention seed `2026090104`, xorshift32 seed `0x243f6a88` / `608135816`, exact three-round completion, and one draw per public pending ID in public order.
- Added the single shared safety-boundary helper. Its only true case is `status: random`, `reason: waiting_for_next_round_roll`, with `submit_round_roll` available.
- Ran the host-free boundary contract test before session construction/random consumption: real shape true, V3 wrong `choice` shape false, other random boundary false. Frozen helper/test/result hashes are recorded in the protocol.
- Sealed the new arm to the existing controller SHA-256 `7ca4533e4fd4a69e649585e3dd7ec0deb760d7eb62942f3328eabeeac4cdef85`; controller, scoring, core session/one-round/sequential runtimes and initializer assets were unchanged across the run.
- Completed one fresh isolated session through exactly three shared-predicate boundaries. It produced 41 planning events, 94 automatically imagined candidates, 41 real strategy actions, 6 random pause/replans, and 31 exact public-contract draws.
- Preserved every planning Q, candidate/imagination, selected step 0, automatic trajectory, public response, discarded suffix, new-Q replan, formal boundary audit, raw xorshift state/value/ID/contract binding, and final checkpoint.
- Verified 0 handwritten intermediate Q, 0 planned random operation, 0 live rejection, an automatic trace for every real strategy action, 3/3 boundaries, and pre-run ordering.
- Made no old-arm comparison, advantage claim, or outcome-driven tuning.

## Files Changed

- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/PAIR_PROTOCOL.json`: frozen machine protocol and old-arm constraints.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/PAIR_PROTOCOL.md`: human-readable V4 protocol and invalid-V3 replacement rationale.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/PAIR_PROTOCOL.sha256`: protocol hash `e431142225927a24cf868174a98975f926399a6731177e223f871b2b5f7b4177`.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/safety-boundary.js`: single shared correct boundary predicate.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/test-safety-boundary.js`: host-free three-shape structural contract test.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/safety-boundary-test-results.json`: passing pre-run contract evidence.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/run-new-arm.js`: sealed fresh-session runner with no-overwrite/no-retry guard.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/verify-new-arm.js`: focused independent verifier.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/verification.json`: PASS, 11/11.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/evidence/machine-evidence.json`: complete plans/actions/audits and invariants.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/evidence/random-draw-tape.json`: 31 ordinal/raw/value/ID/contract/round/reason records.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/evidence/final-checkpoint.json`: third-boundary checkpoint.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/README.md`: sealed-arm usage and comparison boundary.
- `projects/western_fantasy_continent/experiments/ufs_automatic_vs_original_paired_v4/new-arm/RESULTS.md`: new-arm-only result.
- `coop_repo/LATEST.md`: appended the V4 new-arm handoff.

No `old-arm/` file was created or changed.

## Validation

- `node .../test-safety-boundary.js`: PASS before formal run; 3/3 cases, 0 host runtime import, 0 draws.
- Boundary test completed `2026-09-01T05:09:02.621Z`; formal run began `2026-09-01T05:12:14.834Z`.
- `node --check .../new-arm/run-new-arm.js`: passed before the only formal run.
- Formal run: PASS; three continuous rounds, 3/3 safe boundaries, 41 policy actions, 6 random observations, 31 draws, 0 rejected operations.
- `node --check .../new-arm/verify-new-arm.js`: passed.
- `node .../new-arm/verify-new-arm.js`: PASS, 11/11 focused checks.
- Random verifier recomputed every xorshift32 raw state/value and matched exact public ID order, operation values, full public contract snapshot, round and reason.
- Machine evidence SHA-256: `f54be0739243c7eaba8ec10c97e5f0d1438e511940565c7e4af4fa17e3b84965`.
- Random tape SHA-256: `dabba00a34b9715e006f34fd36569410e5faa467ab123afff446638c1ad2eb82`.
- Final checkpoint SHA-256: `81d4b3216ab04d62391953806636c5f8021a54f3f66e71f8bd571f837753c84b`.
- Verification SHA-256: `186257c760360be47f8b79eafe776906ddf1e4e63e24e46e2206ab62a957aa03`.

## Current State

The V4 new arm is sealed and complete. Round-boundary formal values were: R1 energy 4/research 2/damage 0/total ship rows 10; R2 1/4/0/16; R3 3/4/0/13. These are arm-local observations only. The study remains incomplete until the independently sealed old arm runs and passes under the same protocol.

## Unresolved

- No old-arm execution or paired comparison exists yet; no advantage conclusion is permitted.
- The single random stream is protocol evidence, not a statistical sample.
- The shared contract-test result file is a frozen artifact. The old arm should verify its hash and import the exact helper rather than overwrite the pre-run evidence.

## Recommended Next Step

Run the old arm in a separate `old-arm/` directory only after sealing the original default single-step policy. It must use this exact `PAIR_PROTOCOL.json`, public assets/seeds/random consumption order, and import `safety-boundary.js` after verifying the frozen helper/test/evidence hashes. It must not write its own boundary condition and must not inspect `new-arm/RESULTS.md`, machine evidence, random tape, checkpoint, verification, or this arm-local report before its policy/run is sealed.
