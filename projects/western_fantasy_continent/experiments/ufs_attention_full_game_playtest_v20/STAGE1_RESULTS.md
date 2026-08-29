# UFS V20 Stage 1 Results

- Date: 2026-08-29 Asia/Shanghai
- Player profile: `player-v20-fresh.json`
- Player id: `ufs-v20-fresh-player`
- Attempt/state: `state_attempt_2026082920_v20`
- Attention/game seed: `2026082920`
- Stop point: sequence `048`, Round 4 next-round-roll boundary

## Result

Stage 1 passed.

- Public verifier: `ok=true`
- Three-round gate: `stageGatePassed=true`
- Machine records: 48
- Deliberate actions: 41
- Explicit prediction actions: 41
- Prediction coverage: 100%
- Completed rounds: 3
- Formal outcome: none yet

## Stage-Gate State

The last public response is the intended pause point:

- `status=random`
- `reason=waiting_for_next_round_roll`
- `pending.round=4`
- `completedRoundCount=3`

Restored host audit at the gate:

- round: 3
- phase: `new_round`
- energy: 5
- damage: 0
- researchIndex: 4
- excavatorIndex: 0
- mothershipRow: 4
- outcome: null

## Rejections Observed

There were four rejected records during the single attempt:

- sequence `010`: prediction syntax used `absent` with a field.
- sequence `014`: prediction syntax used `present` with a field.
- sequence `015`: prediction item id `waitingShips` was not scoped.
- sequence `023`: player chose a visible cell in an already-used column; the formal host rejected the placement.

All four were recovered in the same state without restarting or mutating the formal board incorrectly.

## Notes

V20 fixed the V18 research-choice public contract blocker: `choose_research_advance` publicly exposed required field `advanceSteps` with numeric bounds, and the player successfully used it twice.

