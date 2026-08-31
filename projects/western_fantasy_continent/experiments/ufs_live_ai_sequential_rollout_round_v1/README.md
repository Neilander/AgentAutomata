# UFS live AI sequential rollout round V1

This experiment repairs the V0 stale-snapshot failure by requiring every action in a multi-step plan to consume the predicted Q produced by the preceding action. It then replays the same attention seed and public random observation through isolated static and rolling formal hosts.

- [Protocol](PROTOCOL.md)
- [Results](RESULTS.md)
- `sequential-q-rollout.js`: sequential Q-chain and anchor-validation mechanism.
- `decisions/`: AI-authored Q chains written before execution.
- `evidence/`: predicted rollout, real post-step revalidation, and post-hoc formal comparison.
- `state/`: isolated static and rolling host transcripts/checkpoints.

The AI did not read formal checkpoints while deciding. `compare-round.js` opens them only after both branches reach the next-round-roll boundary.
