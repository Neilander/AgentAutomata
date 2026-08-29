# UFS attention full-game playtest V7

This directory preserves one isolated, non-restarted play attempt through the only public CLI:

- entry point: `../ufs_first_action_imagination_v0/full-game-attention-player-cli.js`
- attention seed: `2026082507`
- opaque state directory: `state_attempt_2026082507_v7/`
- terminal public response: step `090`, `status=attention_stop`, `reason=no_complete_initial_q`, no available operations

The state directory is an opaque persistence target. It was never opened for playtest reasoning, reporting, or contract validation. Decisions used only prior public stdout, the public README/help contract, and cross-turn working memory.

## Evidence layout

- `DECISIONS.md`: judgment recorded before every CLI operation.
- `payloads/`: exact JSON payload for each `advance` call.
- `evidence/*.stdout.json`: verbatim public stdout.
- `evidence/*.stderr.txt`: verbatim stderr, including empty files.
- `machine-records.ndjson`: append-only public response ledger.
- `ROUND_SUMMARIES.md`: public-evidence round summaries.
- `RESULTS.md`: outcome and behavioral analysis.
- `TEST_RESULTS.md`: validation commands and results.
- `verify-public-evidence.js`: read-only validator that reads only the public artifacts above and never the state directory.
- `record-public-step.js`: recorder used throughout the attempt; it logged each decision before invoking the public CLI.

The attempt contains 90 CLI calls: 1 start, 76 advances, and 13 required random calls. Five rejected calls are retained verbatim.
