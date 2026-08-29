# V9 sealed player protocol

- Run every operation through `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]`.
- The recorder writes the decision before invoking the CLI and automatically preserves stdout, stderr, payloads, and the machine ledger.
- Start exactly once at `001`; increment the sequence by one for every call, including rejected calls.
- Read only the recorder's stdout and your own public artifacts. Never open or list `state_attempt_2026082509_v9`.
- Never read `attention-audit-transcript.jsonl`, host checkpoints, implementation source, tests, old playtest directories, or oracle state.
- Use only the current response's `availableOperations` and public IDs. At `status=random`, call `random`; do not invent values.
- Continue until the public response is a rules win/loss, or until it explicitly stops with no available operation. A normal `choice` or `random` response is never a valid stopping point.
- Do not restart, change seed, erase evidence, or repair a decision after seeing its result.
