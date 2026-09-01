# UFS automatic-vs-original paired V4 — old arm

## Outcome

**PASS.** The sealed original-policy arm started one fresh isolated
`UfsFullGameAttentionSession` from the V4 protocol state and ran continuously until the imported
shared safety helper recognized exactly three completed-round boundaries. The final checkpoint is
the checkpoint captured by the third post-hoc boundary audit. Focused verification passes 19/19.

The old policy was fixed before execution: at every non-random public choice, call the existing
default `planCurrentChoice()` exactly once and submit that call's `recommendedPayload` unchanged.
All 36 non-random actions have unique consecutive planner ordinals and are byte-for-byte equal to
their sole call's recommendation. There were 0 rejected responses, 0 manual rescues, 0 external
policy actions, 0 sequential-imagination calls, and 0 automatic-controller calls or module loads.

## Frozen inputs and preflight

- Protocol SHA-256: `e431142225927a24cf868174a98975f926399a6731177e223f871b2b5f7b4177`
- Shared safety helper SHA-256: `116d5e26d78533e24e06515fb6cf76fa916935cdfa032d75c75abf2d51af2e45`
- Shared structural test SHA-256: `e34b4144b24c5c742873c7c281a63672cc77642c5e99166fb91bceb92c0ae214`
- Sealed structural result SHA-256: `3748951dc0298be30b2a3e8afca0162616c8c18f880d3db8011e9952b31c2296`
- Public initial state SHA-256: `584765c4b0e4a6a2e802ddfd6f7838c444a082eedf67fcaeba6ea62b4b23e8bd`
- Public map SHA-256: `a8d20066fc2f74aa3a94f08ba762f539231daaf4095f8b0388aae138340dc7c4`
- Attention seed: `2026090104`
- External random source: xorshift32, initial seed `0x243f6a88` (`608135816` unsigned)

Before host runtime import or session construction, the arm-local preflight imported the exact
shared helper, verified all hashes above, checked the sealed test result, and ran the three
host-free shapes. The real `random + waiting_for_next_round_roll + submit_round_roll` shape was
true; the V3 wrong `choice` shape and a different random boundary were false. Preflight consumed
zero random draws.

## Three completed-round boundaries

Formal host inspection was hard-guarded and enabled only after the shared helper returned true.
Each audit was post-hoc; none of its data entered subsequent planning.

| Boundary | Round | Phase | Energy | Damage | Research | Excavator | Mothership | Ships | Waiting | Ship-row sum | Max ship row |
|---:|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1 | `new_round` | 2 | 0 | 0 | 0 | 0 | 6 | 0 | 15 | 5 |
| 2 | 2 | `new_round` | 2 | 0 | 0 | 0 | 1 | 6 | 0 | 32 | 9 |
| 3 | 3 | `new_round` | 2 | 0 | 0 | 0 | 2 | 7 | 0 | 50 | 14 |

This table reports the old arm only and is not a comparison or relative-advantage claim.

## Random-stream compliance

Five public random contracts consumed 13 draws. The external provider was the exclusive source
for `submit_random_observation` and `submit_round_roll`. For every public pending contract it
consumed exactly one fresh draw per ID in the exposed ID order. Every tape row records the global
ordinal, raw unsigned xorshift32 state, derived die value, bound ID, full public contract snapshot,
contract round, and public reason. The verifier independently recomputed all 13 xorshift32 states
and values from the initial seed and matched every event, contract snapshot, ID order, and submitted
value: 0 missing, extra, skipped, reordered, retried, or mismatched draws.

## Evidence

- `preflight-validation.json` (`f69b089ffa12699b57bce663a0e36ff32ea5d22bf80a87e212f4a2046753b4bf`): hash checks and host-free structural cases.
- `machine-evidence.json` (`a4146529ced786b950afcea7cbee1b7945dcaf64f8013e5fb1127aaf50da874e`): all public responses, unique default-plan records, exact selected/submitted operations, counters, source identities, and three audits.
- `random-draw-tape.json` (`389bffaf023aa707482aefc02e9f51aebcf919faeec1576f3627f3935b03e42d`): the complete 13-draw bound stream.
- `final-checkpoint.json` (`15abb22c42193c3d2c1e776952b36c98f9caad2ab47878d82b6462dbddef75dc`): the exact third-boundary checkpoint; canonical checkpoint hash `958fbb726971a82e6ac10d5fe51af484b1577d4ff0a746eea08127573db5e2cb` matches audit 3.
- `verification.json`: focused 19-check verification, 19/19 PASS.
- `run-manifest.json`: sealed run status and core evidence hashes.
- `run-old-arm.js`, `verify-old-arm.js`, `preflight-old-arm.js`: arm-local reproducibility and audit programs.

## Blindness and scope

Repository coordination required reading `coop_repo/LATEST.md`, which exposed a V4 new-arm
summary. Therefore complete blindness to that summary cannot be claimed. The parent task had
already frozen the old policy before this work began, and tuning was prohibited. No score,
strategy branch, controller, core runtime, initializer, protocol, helper/test, seed, or frozen
asset was changed in response to the summary or the old-arm outcome. No V4 new-arm directory or
new-arm-specific report was read.

This document states only the old-arm execution. It does not compare the arms and does not claim
that either policy is better.
