# UFS V19 Round Summaries

- Attempt: `state_attempt_2026082919_v19`
- Seed: `2026082919`
- Status: stopped in Round 6 by system bug at sequence `092`

## Stage Gate

The attempt reached the Round 4 next-round-roll boundary at sequence `046`.

Both required checks passed:

- V19 stage verifier passed.
- Generic three-round gate passed.

## Round 1 to Round 3

The player survived the first three rounds and reached the stage gate.

High-level state at the gate:

- completed rounds: 3
- energy: 0
- damage: 0
- researchIndex: 2
- excavatorIndex: 0
- mothershipRow: 4
- outcome: none

The player was operationally valid but strategically weak: it made legal choices, used predictions, and advanced research a little, but had not yet built an effective energy/depth engine.

## Round 4

The same attempt continued past the stage gate.

Round 4 focused on basic placement, energy, AA, tunnel resolution, and spawning. It completed without a system blocker.

Key observation:

- the public-contract flow stayed stable after the gate.
- the player still over-relied on shallow tactical choices rather than establishing a strong energy/excavation path.

## Round 5

The player continued to operate under partial attention and formal correction.

By the end of Round 5:

- completed rounds: 5
- damage: 3
- energy: 3
- excavatorIndex: 0
- researchIndex: 3
- mothershipRow: 8

The state showed real pressure. The player had survived, but had not made enough research or excavation progress.

## Round 6

Round 6 began with:

- damage: 3
- energy: 3
- excavatorIndex: 0
- researchIndex: 3
- mothershipRow: 8

The player placed:

- `r6-gray-2` at `A-r3-c5`
- `r6-white-3` at `A-r2-c2`
- `r6-gray-0` at `A-r3-c4`
- `r6-gray-1` at `A-r2-c3`
- `r6-white-4` at `A-r1-c1`

Notable Round 6 results:

- `r6-gray-0@A-r3-c4` was recognized as an excavation candidate.
- `excavate` at sequence `086` increased `excavatorIndex` from 0 to 1.
- Resolving `A-upper-research` then choosing 3 research steps increased `researchIndex` from 3 to 6 and consumed the remaining energy.
- Resolving tunnel rooms marked rooms resolved but did not increase `excavatorIndex`.

The attempt stopped at sequence `092`, when `end_rooms` triggered a full-attention duplicate item id error.

## Player Behavior Notes

The player is now capable of:

- reading public operation contracts;
- making legal multi-round choices;
- attaching structured predictions to most deliberate actions;
- recovering from rejected prediction tickets;
- receiving formal-world corrections rather than self-validating its own imagination;
- using the explicit `excavate` operation when it appears.

Weaknesses observed:

- still poor at prioritizing energy and depth early;
- sometimes confuses room visibility with legal placement;
- prediction item-id schema is easy to misuse;
- AA/fighter value is not yet well understood;
- does not yet reliably connect "deep research requires excavation and energy" into a winning tempo.

## Blocker

The Round 6 blocker is not a gameplay decision:

```text
full attention item ids must be unique
```

This should be fixed in the full attention provider before the next formal full-game fresh-player attempt.
