# V13 sealed three-round player protocol

- Run every operation through `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]`.
- The recorder writes the decision before invoking the CLI and preserves stdout, stderr, payloads, and the machine ledger.
- Start exactly once at `001`; increment the sequence for every call, including rejected calls.
- Read only recorder stdout and artifacts authored from that public output. Do not use host checkpoints or attention audit files to make decisions.
- Use only the current response's `availableOperations`, public `mapView`, `pending.candidates`, and public IDs. At `status=random`, call `random`; never invent random values.
- Before every operation, record the considered alternatives, expected result, and why the selected option was preferred.
- At room choices, explicitly inspect the public `room_action` candidate groups: resolvable, incomplete, noOutput, unremembered, excavation, and skippable.
- For this stage, continue until exactly three completed rounds and then pause only at `status=random`, `reason=waiting_for_next_round_roll`, `pending.type=next_round_roll`. Do not submit the fourth-round dice until the root audit gate passes.
- Before the three-round gate, continue until a public rules win/loss, or an explicit hard stop with no available operation. A normal `choice`, `random`, `rejected`, or visible uncertainty is not a stopping point.
- Do not restart, change seed, erase evidence, or revise a prior decision after seeing its result.
- When the stage pauses, write `STAGE1_RESULTS.md`, `ROUND_SUMMARIES.md`, and a coop report.
