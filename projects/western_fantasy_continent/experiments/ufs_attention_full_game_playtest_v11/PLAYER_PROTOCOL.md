# V11 sealed player protocol

- Run every operation through `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]`.
- The recorder writes the decision before invoking the CLI and preserves stdout, stderr, payloads, and the machine ledger.
- Start exactly once at `001`; increment the sequence for every call, including rejected calls.
- Read only recorder stdout and artifacts authored from that public output. Do not use host checkpoints or attention audit files to make decisions.
- Use only the current response's `availableOperations` and public IDs. At `status=random`, call `random`; never invent random values.
- Before every operation, record the considered alternatives, expected result, and why the selected option was preferred.
- Continue until a public rules win/loss, or an explicit hard stop with no available operation. A normal `choice`, `random`, `rejected`, or visible uncertainty is not a stopping point.
- Do not restart, change seed, erase evidence, or revise a prior decision after seeing its result.
- When finished, write `RESULTS.md`, `ROUND_SUMMARIES.md`, and a coop report.

