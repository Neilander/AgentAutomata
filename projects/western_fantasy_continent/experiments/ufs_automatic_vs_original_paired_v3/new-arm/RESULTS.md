# Paired V3 — sealed new arm

Status: **PASS**. The V2 automatic multi-cutpoint player completed three consecutive rounds from a fresh isolated UFS session under the frozen paired protocol.

This file reports only the new arm. It makes no comparison and does not claim an advantage over the original player. The old arm must be selected and run from `PAIR_PROTOCOL.json` without reading this file or any other `new-arm/` output.

## Frozen identities

- Protocol SHA-256: `5b84f209dd3704044bbbdf326d9ad35f2a70ecdf4e5a45b287d6b2b258f4a8eb`
- V2 controller SHA-256: `7ca4533e4fd4a69e649585e3dd7ec0deb760d7eb62942f3328eabeeac4cdef85`
- Attention seed: `2026090102`
- Random stream: xorshift32, initial seed `0x5f3759df`
- Completed safe round boundaries: 3/3

## Integrity result

- 30 planning cutpoints and 72 imagined candidates.
- 30 executed controller actions; every action was step 0 of a plan generated at the latest Q revision and carried automatic `imagineSequentialPlan()` evidence.
- 0 hand-written intermediate Q fields.
- 0 random operations inside plans.
- 0 rejected live operations.
- 6 reroll boundaries; each was marked `paused_random`, consumed only external tape values, discarded the old suffix and replanned from a higher Q revision.
- 31 total random draws, including round-roll contracts for rounds 2 and 3. Every draw records its global ordinal, value and bound public pending ID.
- Formal host inspection occurred at the three `waiting_for_next_round_roll` boundaries only.

## Formal boundary outcomes

| Round | Energy | Research | Damage | Mothership row | Max ship row | Total ship rows |
|---|---:|---:|---:|---:|---:|---:|
| 1 | 5 | 1 | 0 | 1 | 5 | 7 |
| 2 | 2 | 4 | 0 | 2 | 9 | 19 |
| 3 | 1 | 4 | 0 | 3 | 10 | 37 |

The run reproduces the sealed V2 behavior under the paired stream. Threat accumulation remains visible and is not interpreted here; relative meaning requires the independently sealed old arm.

## Replay and verification

Run:

```powershell
node new-arm/run-new-arm.js
node new-arm/verify-new-arm.js
```

Machine evidence is in `new-arm/evidence/machine-evidence.json`, the separately materialized tape is `random-draw-tape.json`, and the resumable end state is `final-checkpoint.json`.
