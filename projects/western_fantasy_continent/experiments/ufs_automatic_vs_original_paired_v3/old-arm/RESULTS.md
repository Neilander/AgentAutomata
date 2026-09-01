# UFS automatic-vs-original paired V3 — old arm

## Outcome

**INVALID / FAILED.** This old-arm execution cannot be used in a paired comparison.

The policy was frozen before the run to the existing
`UfsFullGameAttentionSession.planCurrentChoice()` path: call it exactly once at every non-random
public boundary and execute its returned `recommendedPayload` unchanged. The execution itself
preserved that policy: 116 planner invocations produced 116 submitted deliberate operations, all
116 were byte-for-byte equal to the selected operation, with 0 live rejections, 0 manual rescue,
0 external-policy actions, 0 `imagineSequentialPlan()` calls, and 0 automatic multi-cutpoint
controller calls.

The experiment nevertheless failed its boundary protocol. The runner incorrectly recognized a
round audit boundary only when public status was `choice`; the real
`waiting_for_next_round_roll` response has status `random`. As a result, the runner observed nine
such public boundaries but recorded zero formal host audits, did not stop at the third boundary,
and eventually terminated in round 10 with the public outcome `maximum_damage`. No final safe-
boundary checkpoint exists. The focused verifier passes 14/19 checks and fails the five required
completion/audit/checkpoint gates.

No corrective rerun was performed. The failed formal execution had already consumed 57 external
random draws, so restarting would violate the frozen protocol's no-preview/no-retry constraint.

## Frozen identities

- Protocol SHA-256: `5b84f209dd3704044bbbdf326d9ad35f2a70ecdf4e5a45b287d6b2b258f4a8eb`
- Public initial state SHA-256: `584765c4b0e4a6a2e802ddfd6f7838c444a082eedf67fcaeba6ea62b4b23e8bd`
- Public map SHA-256: `a8d20066fc2f74aa3a94f08ba762f539231daaf4095f8b0388aae138340dc7c4`
- `ufs-full-game-attention-session.js`: `b1eea527956f69791f5b960ae479b0e493f3ba553a1a4fd2f143b9ca99178f36`
- `ufs-prechoice-planner.js`: `5d64d36a29ef9adca7adcc90b6fdd719e48a709b100fe258ae170bc5cd2b9c44`
- `ufs-temporal-cognitive-unit.js`: `31f565afa5bace113369be0993ea1026999e14c5ecf0cfaaa5c16c9642210b28`
- Attention seed: `2026090102`
- External random source: xorshift32, initial seed `0x5f3759df`, one advance per public pending ID, value `(rawUnsigned % 6) + 1`

## First three public boundary observations

These are attention-limited public responses, **not** the required formal host audits. They are
listed only to locate the runner failure precisely and must not be promoted to formal metrics.

| Round | Event | Action count | Energy | Damage | Research | Excavator | Mothership | Ships | Ship-row sum | Max ship row |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | 14 | 13 | 2 | 0 | 0 | 0 | 0 | 4 | 8 | 4 |
| 2 | 29 | 28 | 2 | 0 | 0 | 0 | 2 | 6 | 26 | 8 |
| 3 | 42 | 41 | 2 | 0 | 0 | 0 | 3 | 5 | 27 | 9 |

The draw-tape prefix through the third public boundary is ordinals 1–13. The sealed tape contains
57 draws because the runner failed to stop; all 57 remain contiguous and bound to the public IDs
in their exposed order. Nothing was skipped, reordered, or retried inside this failed execution.

## Evidence

- `machine-evidence.json`: every public response, every default plan summary, selected/submitted
  operation, counters, hashes, and terminal failure.
- `random-draw-tape.json`: global ordinal, raw xorshift32 output, die value, bound ID, contract,
  round, and public reason for all consumed draws.
- `verification.json`: focused 19-check validator output (`pass: false`, 14/19).
- `run-manifest.json`: run status and evidence hashes.
- `preflight-failed-attempt/`: an earlier harness preflight that stopped at the first public reroll
  before consuming any draw. It is retained rather than erased.
- `final-checkpoint.json`: **absent**, because there was no compliant formal audit boundary capture.

## Blindness and scope

Repository coordination required reading `coop_repo/LATEST.md`, which exposed a summary of the
new-arm work. Therefore this arm cannot claim complete blindness to that summary. The old policy
had already been fixed by the parent task before this agent ran, and the task prohibited tuning;
no score, policy, runtime, initializer, protocol, seed, or frozen asset was changed in response to
that summary or to execution outcomes. No new-arm directory or new-arm-specific report was read.

This report states only the old-arm execution and its invalidity. It makes no comparison and no
claim of relative advantage.
