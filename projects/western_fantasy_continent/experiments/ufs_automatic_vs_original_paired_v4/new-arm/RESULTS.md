# UFS automatic-vs-original paired V4: sealed new arm

## Status

PASS for new-arm execution integrity. This is not a comparison and establishes no advantage over the original planner.

V4 is a wholly new replacement experiment for invalid V3. V3's old-arm shell incorrectly required `status: choice` at `waiting_for_next_round_roll`; the actual public response is `status: random`. All V3 failure evidence remains retained and none is treated as V4 data.

## Frozen inputs

- Public initial state SHA-256: `584765c4b0e4a6a2e802ddfd6f7838c444a082eedf67fcaeba6ea62b4b23e8bd`
- Public map SHA-256: `a8d20066fc2f74aa3a94f08ba762f539231daaf4095f8b0388aae138340dc7c4`
- Attention seed: `2026090104`
- Fresh xorshift32 seed: `0x243f6a88` / unsigned `608135816`
- V4 protocol SHA-256: `e431142225927a24cf868174a98975f926399a6731177e223f871b2b5f7b4177`
- Sealed V2 controller SHA-256: `7ca4533e4fd4a69e649585e3dd7ec0deb760d7eb62942f3328eabeeac4cdef85`
- Shared safety-boundary helper SHA-256: `116d5e26d78533e24e06515fb6cf76fa916935cdfa032d75c75abf2d51af2e45`

The controller, scoring, session runtime, one-round runtime, sequential planner, initializer assets, map, and shared boundary artifacts were hashed before and after the formal run and were byte-identical.

## Boundary preflight

The host-free structural test completed at `2026-09-01T05:09:02.621Z`, before the formal run started at `2026-09-01T05:12:14.834Z`, and consumed zero random draws.

- Real shape (`random` + `waiting_for_next_round_roll` + `submit_round_roll`): true.
- V3's wrong `choice` shape: false.
- Other random boundary (`waiting_for_random_observation` + `submit_random_observation`): false.

The test source and result hashes are frozen in `PAIR_PROTOCOL.json`. The only formal-audit gate used by the runner is the shared helper.

## Formal run

One fresh isolated session ran continuously through exactly three completed-round boundaries:

| Round | Planning cutpoints | Candidates imagined | Random pause/replans | Energy | Research | Damage | Total active ship rows |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 13 | 30 | 2 | 4 | 2 | 0 | 10 |
| 2 | 13 | 34 | 2 | 1 | 4 | 0 | 16 |
| 3 | 15 | 30 | 2 | 3 | 4 | 0 | 13 |

Totals:

- 41 planning cutpoints and 94 automatically imagined candidates.
- 41 real policy actions; every action exactly matched step 0 of its selected newest-Q candidate and carried an automatic imagination trace.
- 6 `paused_random → live external observation → discard old suffix → new-Q replan` cycles.
- 31 random draws, each recorded with ordinal, raw unsigned xorshift32 state, derived value, bound public ID, complete public contract snapshot, round, and reason.
- 0 handwritten intermediate Q, 0 random operations inside plans, 0 rejected live operations.
- 3/3 shared-predicate safety boundaries. Formal host inspection occurred only post-hoc at those boundaries and was not used for subsequent planning.

The final third-boundary formal checkpoint records round 3, energy 3, research index 4, damage 0, and total active ship rows 13.

## Verification

`verify-new-arm.js` passes 11/11 focused checks. It independently recomputes the entire xorshift32 stream, public ID/contract order, all hashes, action-to-plan bindings, random suffix discard/replanning, exact boundary count, and final checkpoint.

Artifact hashes:

- Machine evidence: `f54be0739243c7eaba8ec10c97e5f0d1438e511940565c7e4af4fa17e3b84965`
- Random tape: `dabba00a34b9715e006f34fd36569410e5faa467ab123afff446638c1ad2eb82`
- Final checkpoint: `81d4b3216ab04d62391953806636c5f8021a54f3f66e71f8bd571f837753c84b`
- Verification result: `186257c760360be47f8b79eafe776906ddf1e4e63e24e46e2206ab62a957aa03`

## Comparison boundary

No old-arm file or result was used, no relative result is stated, and no parameter was tuned from V3 or this run. The future old arm must use this exact `PAIR_PROTOCOL.json` plus the shared `safety-boundary.js` and frozen hashes. It is forbidden to author a separate boundary condition or inspect new-arm outputs before sealing its own policy/run.
