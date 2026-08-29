# V14 full-game public playtest results

- Attempt: `state_attempt_2026082814_v14`
- Attention seed: `2026082814`
- Evidence ledger: `machine-records.ndjson`
- Public evidence files: `evidence/001.stdout.json` through `evidence/079.stdout.json`
- Final sequence: `079`
- Final public status: `complete`
- Final public outcome: `loss`
- Final public reason: `mothership_reached_skull_row`
- Final public round: `6`

## Final public observation

- Phase: `lost`
- Damage: `6`
- Energy: `1`
- Research index: `11`
- Excavator index: `8`
- Mothership row: `11`
- Pending: `null`
- Available operations: `[]`

## Evidence integrity

- Total machine records: `79`, sequences `001` through `079`.
- Every command exited with `exitCode=0`.
- Every record has non-null public JSON.
- Strict public verifier result: `node verify-public-evidence.js` -> `public evidence OK`.
- Random was only advanced via public CLI `random`.
- The stage-1 pause at sequence `038` remained intact before root-authorized continuation from the same state.

## Rejected responses

- Sequence `017`: `invalid_action:selected column is already occupied: C2`. This was a player placement mistake and sequence `018` recovered in the same game from the preserved public pending state.
- Sequence `074`: `choose_research_advance_requires_current_room_and_legal_steps`. This was a player payload-shape mistake (`steps` instead of the already-used `advanceSteps` field); sequence `075` recovered in the same research-choice pending state.

## Gameplay notes

- The corrected V14 path did not reproduce the V13 obsolete shallow excavation bug during this continuation. Public room candidates after relevant excavations did not expose a second stale shallower excavation settlement.
- The game reached a formal public terminal state; this is not an `attention_stop` or an inferred result.
- Research reached `11` before terminal loss. The decisive failure mode was mothership track pressure, not a protocol stop.
