# UFS live AI sequential rollout round V1

## Repair under test

Replace a snapshot-scored action list with a sequential Q chain. Every step must:

1. validate its anchor against the current Q;
2. imagine the operation and emit a new Q;
3. pass that new Q—not the opening snapshot—to the next step;
4. revalidate the next anchor after the corresponding real action.

An absent anchor is invalid. An anchor missing under probabilistic attention is uncertain and cannot justify a deterministic benefit claim.

## Paired replay

- Use the same initial attention seed `2026082504` as V0.
- Replay the exact public reroll from V0: gray `5`, white `6`.
- Keep the opening prefix and room/spawn policies paired.
- Static freezes the V0 research-then-tunnel continuation.
- Sequential rolling may change action assignment/order, but every downstream anchor must be supported by its preceding predicted and actual Q.

Formal checkpoints remain unavailable to the AI until both branches finish. Post-hoc formal comparison is evaluation only.
