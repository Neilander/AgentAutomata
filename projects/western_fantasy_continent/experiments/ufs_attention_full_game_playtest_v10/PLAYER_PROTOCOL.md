# V10 sealed player protocol

- Run every operation through `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]`.
- The recorder writes the decision before invoking the CLI and preserves stdout, stderr, payloads, and the machine ledger.
- Start exactly once at `001`; increment the sequence for every call, including rejected calls.
- Read only recorder stdout and artifacts you authored from that public output. Never open, list, or search `state_attempt_2026082510_v10`.
- Never read attention audit files, host checkpoints, implementation source, tests, prior playtest decisions/results, or oracle state.
- Use only the current response's `availableOperations` and public IDs. At `status=random`, call `random`; never invent random values.
- Before every operation, record the considered alternatives, expected result, and why the selected option was preferred. Keep it concise.
- Continue until a public rules win/loss, or an explicit stop with no available operation. A normal `choice` or `random` is not a stopping point.
- Do not restart, change seed, erase evidence, or revise a prior decision after seeing its result.
- When finished, write `RESULTS.md`, `ROUND_SUMMARIES.md`, and `coop_repo/reports/2026-08-25_ufs-attention-full-game-playtest-v10.md`. Do not update `LATEST.md` or `REPORT_INDEX.md`; root will audit first.
- Your final message to root must only say that the files are written, without summarizing the result.
