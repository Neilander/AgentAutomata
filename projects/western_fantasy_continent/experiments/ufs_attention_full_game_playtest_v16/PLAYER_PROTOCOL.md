# V16 sealed clean three-round protocol

- Every recorded operation uses `node record-public-step.js <NNN> <start|advance|random> "<brief decision>" [payload-json]`.
- Use sequence `001 start`, then increment only after a ledger record is created. If the recorder rejects malformed input before recording it, fix the command and retry the same sequence.
- Read only recorder stdout, `evidence/`, `current-player-view.json`, `DECISIONS.md`, and your own public notes. Never read checkpoint, attention/feedback audits, source, V15, old playtests, or reports while choosing.
- Use only operations in current public `availableOperations` and IDs/bounds in the current public response.
- Exact payload schemas:
  - `place_die`: `{"type":"place_die","dieId":"...","cellId":"..."}`
  - `resolve_room`: `{"type":"resolve_room","roomId":"...","pay":true}`
  - `choose_research_advance`: `{"type":"choose_research_advance","roomId":"...","advanceSteps":0}` using current bound
  - `excavate`: `{"type":"excavate","placementId":"..."}`
  - `skip_worker`: `{"type":"skip_worker","placementId":"..."}`
  - `end_rooms`: `{"type":"end_rooms"}`
  - `choose_spawn`: `{"type":"choose_spawn","shipId":"...","dropPointId":"DP-C1"}`
- At public `status=random`, use recorder command `random`; never invent dice.
- Rejected game operations remain in evidence and are recoverable in the same attempt; do not restart.
- Stop at the first Round 4 next-round-roll response with `completedRoundCount=3`, without submitting Round 4 dice. Stop earlier only for a true public terminal outcome.
- Run `verify-public-evidence.js`, write `ROUND_SUMMARIES.md`, `STAGE1_RESULTS.md`, and one new coop report. Do not edit `LATEST.md` or `REPORT_INDEX.md`. In chat say only “文件已写完”.

