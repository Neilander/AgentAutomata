# V14 sealed three-round player protocol

- Use `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]` for every operation.
- Write each decision before invoking the CLI. Record considered public candidates, rejected alternatives, and the selected operation.
- Read only recorder stdout, public evidence files, `DECISIONS.md`, and strategy notes authored from public output.
- Do not read host checkpoint files, attention audit transcripts, source internals, or any oracle while choosing actions.
- At `status=random`, call public CLI `random`; never invent dice values.
- At normal `choice`, keep playing through public `availableOperations`, `mapView`, and `pending.candidates`.
- Rejected public operations are recoverable by using the preserved pending and `availableOperations`; do not restart.
- Stop immediately after recording the first response with `status=random`, `reason=waiting_for_next_round_roll`, `pending.type=next_round_roll`, `pending.round=4`, and `game.completedRoundCount=3`.
- Do not submit round 4 dice without root authorization.
