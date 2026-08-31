# UFS live AI multi-cutpoint round V0

This experiment lets the main AI player operate one real attention-limited UFS round. It records each decision before the formal host applies it and compares a frozen opening plan against a rolling replan under the same attention seed and random observation.

- [Protocol](PROTOCOL.md)
- [Results](RESULTS.md)
- `decisions/`: AI-authored cut-ins and multi-step plans.
- `state/rolling/` and `state/static/`: isolated formal host sessions and public transcripts.
- `evidence/paired-round-result.json`: post-decision formal comparison.

The formal checkpoint and private attention audit were used only after both branches reached the next-round-roll boundary. They were not AI decision inputs.
