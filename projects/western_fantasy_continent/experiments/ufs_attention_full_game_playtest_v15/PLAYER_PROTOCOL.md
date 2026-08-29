# V15 sealed three-round player protocol

- Use `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]` for every operation.
- Write the decision before invoking the CLI. Briefly record the public facts used, alternatives rejected, and selected operation.
- Read only recorder stdout, files under `evidence/`, `current-player-view.json`, `DECISIONS.md`, and your own public strategy notes.
- Do not read the host checkpoint, attention audit, feedback audit, source code, older playtests, reports, or any formal/oracle state while choosing.
- At `status=random`, call the recorder with `random`; never invent dice values.
- At a normal `choice`, continue using only public `availableOperations`, `observation`, `mapView`, and `pending`.
- A rejected operation is recoverable: use the preserved public response and continue the same attempt. Never restart.
- Stop immediately after the first response with `status=random`, `reason=waiting_for_next_round_roll`, `pending.type=next_round_roll`, `pending.round=4`, and `game.completedRoundCount=3`.
- Do not submit round 4 dice.
- If a real public win/loss occurs earlier, stop there.
- Write `ROUND_SUMMARIES.md` and `STAGE1_RESULTS.md` from public evidence only.
- Write a new coop report; do not edit `coop_repo/LATEST.md` or `REPORT_INDEX.md`. Tell root only that the files are complete, without summarizing results in chat.

